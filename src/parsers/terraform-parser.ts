import { readFileSync } from 'fs';
import type { IaCParser } from './types.js';
import type { ArchitectureGraph, AwsResourceNode, ResourceEdge } from '../graph/types.js';
import { isTerraformFile } from '../scanner/framework-detector.js';
import { parseHcl } from '../utils/hcl-parser.js';
import { logger } from '../utils/logger.js';

const TF_TYPE_MAP: Record<string, string> = {
  'aws_lambda_function':              'lambda',
  'aws_dynamodb_table':               'dynamodb',
  'aws_s3_bucket':                    's3',
  'aws_sqs_queue':                    'sqs',
  'aws_sns_topic':                    'sns',
  'aws_api_gateway_rest_api':         'api-gateway',
  'aws_apigatewayv2_api':             'api-gateway-v2',
  'aws_cloudfront_distribution':      'cloudfront',
  'aws_ecs_service':                  'ecs',
  'aws_ecs_task_definition':          'ecs',
  'aws_eks_cluster':                  'eks',
  'aws_db_instance':                  'rds',
  'aws_rds_cluster':                  'aurora',
  'aws_sfn_state_machine':            'step-functions',
  'aws_cloudwatch_event_rule':        'eventbridge',
  'aws_kinesis_stream':               'kinesis',
  'aws_kinesis_firehose_delivery_stream': 'kinesis-firehose',
  'aws_msk_cluster':                  'msk',
  'aws_elasticache_replication_group':'elasticache',
  'aws_elasticache_cluster':          'elasticache',
  'aws_cognito_user_pool':            'cognito',
  'aws_cloudwatch_metric_alarm':      'cloudwatch',
  'aws_route53_zone':                 'route53',
  'aws_wafv2_web_acl':                'waf',
  'aws_sagemaker_endpoint':           'sagemaker',
  'aws_apprunner_service':            'app-runner',
  'aws_neptune_cluster':              'neptune',
  'aws_opensearch_domain':            'opensearch',
  'aws_redshift_cluster':             'redshift',
  'aws_globalaccelerator_accelerator':'global-accelerator',
  'aws_batch_job_definition':         'batch',
  'aws_ec2_instance':                 'ec2',
  'aws_instance':                     'ec2',
};

function detectTfService(type: string, attrs: Record<string, string | boolean | number>): string {
  if (type === 'aws_lb' || type === 'aws_alb') {
    return String(attrs['load_balancer_type'] ?? 'application') === 'network' ? 'nlb' : 'alb';
  }
  if (type === 'aws_ecs_task_definition') {
    return String(attrs['requires_compatibilities'] ?? '').includes('FARGATE') ? 'ecs-fargate' : 'ecs';
  }
  return TF_TYPE_MAP[type] ?? '';
}

export class TerraformParser implements IaCParser {
  name = 'terraform';

  detect(files: string[]): boolean {
    return files.some(f => isTerraformFile(f));
  }

  async parse(files: string[], _rootDir: string): Promise<Partial<ArchitectureGraph>> {
    const nodes: AwsResourceNode[] = [];
    const edges: ResourceEdge[] = [];
    const parsedFiles: string[] = [];

    const tfFiles = files.filter(f => isTerraformFile(f));

    for (const filePath of tfFiles) {
      let content: string;
      try { content = readFileSync(filePath, 'utf-8'); } catch { continue; }
      parsedFiles.push(filePath);

      const resources = parseHcl(content);
      logger.debug('Terraform file', { file: filePath, resources: resources.length });

      for (const resource of resources) {
        const service = detectTfService(resource.type, resource.attributes);
        if (!service) continue;

        // Handle event source mappings
        if (resource.type === 'aws_lambda_event_source_mapping') {
          const src = String(resource.attributes['event_source_arn'] ?? '').split(':').pop() ?? '';
          const fn = String(resource.attributes['function_name'] ?? '').split(':').pop() ?? '';
          if (src && fn) {
            edges.push({ source: src.toLowerCase().replace(/[^a-z0-9]/g, '-'), target: fn.toLowerCase().replace(/[^a-z0-9]/g, '-'), edgeType: 'triggers', label: 'event source' });
          }
          continue;
        }

        const id = `${resource.type}-${resource.name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const name = String(resource.attributes['function_name'] ?? resource.attributes['name'] ?? resource.attributes['bucket'] ?? resource.name);

        nodes.push({
          id,
          logicalId: `${resource.type}.${resource.name}`,
          service,
          resourceType: resource.type,
          name,
          properties: resource.attributes as Record<string, unknown>,
        });
      }
    }

    return {
      nodes,
      edges,
      boundaries: [],
      metadata: { source: 'terraform', parsedFiles, generatedAt: new Date().toISOString(), liveMode: false },
    };
  }
}

import { readFileSync } from 'fs';
import type { IaCParser } from './types.js';
import type { ArchitectureGraph, AwsResourceNode, ResourceEdge } from '../graph/types.js';
import { parseTemplate } from '../utils/yaml-parser.js';
import { isCfnFile } from '../scanner/framework-detector.js';
import { logger } from '../utils/logger.js';

// Maps CloudFormation resource types to our service identifiers
const CFN_TYPE_MAP: Record<string, string> = {
  'AWS::Lambda::Function':                    'lambda',
  'AWS::DynamoDB::Table':                     'dynamodb',
  'AWS::S3::Bucket':                          's3',
  'AWS::SQS::Queue':                          'sqs',
  'AWS::SNS::Topic':                          'sns',
  'AWS::ApiGateway::RestApi':                 'api-gateway',
  'AWS::ApiGatewayV2::Api':                   'api-gateway-v2',
  'AWS::CloudFront::Distribution':            'cloudfront',
  'AWS::ECS::TaskDefinition':                 'ecs',
  'AWS::ECS::Service':                        'ecs',
  'AWS::EKS::Cluster':                        'eks',
  'AWS::RDS::DBInstance':                     'rds',
  'AWS::RDS::DBCluster':                      'aurora',
  'AWS::Serverless::Function':                'lambda',
  'AWS::Serverless::Api':                     'api-gateway',
  'AWS::Serverless::SimpleTable':             'dynamodb',
  'AWS::StepFunctions::StateMachine':         'step-functions',
  'AWS::Events::Rule':                        'eventbridge',
  'AWS::Kinesis::Stream':                     'kinesis',
  'AWS::KinesisFirehose::DeliveryStream':     'kinesis-firehose',
  'AWS::MSK::Cluster':                        'msk',
  'AWS::ElastiCache::ReplicationGroup':       'elasticache',
  'AWS::ElastiCache::CacheCluster':           'elasticache',
  'AWS::Cognito::UserPool':                   'cognito',
  'AWS::CloudWatch::Alarm':                   'cloudwatch',
  'AWS::Route53::HostedZone':                 'route53',
  'AWS::WAFv2::WebACL':                       'waf',
  'AWS::SageMaker::Endpoint':                 'sagemaker',
  'AWS::Bedrock::AgentAlias':                 'bedrock',
  'AWS::AppRunner::Service':                  'app-runner',
  'AWS::Batch::JobDefinition':                'batch',
  'AWS::Neptune::DBCluster':                  'neptune',
  'AWS::OpenSearchService::Domain':           'opensearch',
  'AWS::Redshift::Cluster':                   'redshift',
  'AWS::GlobalAccelerator::Accelerator':      'global-accelerator',
};

function resolveRef(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const v = val as Record<string, unknown>;
    if ('Ref' in v) return String(v['Ref']);
    if ('Fn::GetAtt' in v) {
      const att = v['Fn::GetAtt'];
      if (Array.isArray(att)) return String(att[0]);
      if (typeof att === 'string') return att.split('.')[0] ?? att;
    }
    if ('Fn::Sub' in v) return String(v['Fn::Sub']).replace(/\$\{([^}]+)\}/g, '$1');
  }
  return '';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function parseLbType(props: Record<string, unknown>): string {
  const t = String(props['Type'] ?? 'application').toLowerCase();
  return t === 'network' ? 'nlb' : 'alb';
}

function detectServiceFromType(cfnType: string, props: Record<string, unknown>): string {
  if (cfnType === 'AWS::ElasticLoadBalancingV2::LoadBalancer') return parseLbType(props);
  if (cfnType === 'AWS::RDS::DBCluster') {
    const engine = String(props['Engine'] ?? '').toLowerCase();
    if (engine.includes('serverless')) return 'aurora-serverless';
    return 'aurora';
  }
  if (cfnType === 'AWS::RDS::DBInstance') {
    const engine = String(props['DBInstanceClass'] ?? props['Engine'] ?? '').toLowerCase();
    if (engine.includes('mysql')) return 'rds-mysql';
    if (engine.includes('postgres')) return 'rds-postgres';
    return 'rds';
  }
  return CFN_TYPE_MAP[cfnType] ?? '';
}

export class CloudFormationParser implements IaCParser {
  name = 'cloudformation';

  detect(files: string[]): boolean {
    return files.some(f => isCfnFile(f));
  }

  async parse(files: string[], _rootDir: string): Promise<Partial<ArchitectureGraph>> {
    const nodes: AwsResourceNode[] = [];
    const edges: ResourceEdge[] = [];
    const parsedFiles: string[] = [];

    const cfnFiles = files.filter(f => isCfnFile(f));

    for (const filePath of cfnFiles) {
      const template = parseTemplate(filePath) as Record<string, unknown> | null;
      if (!template || typeof template !== 'object') continue;

      const resources = template['Resources'] as Record<string, unknown> | undefined;
      if (!resources) continue;

      parsedFiles.push(filePath);
      logger.debug(`Parsing CFN template`, { file: filePath, resourceCount: Object.keys(resources).length });

      for (const [logicalId, resource] of Object.entries(resources)) {
        const res = resource as Record<string, unknown>;
        const cfnType = String(res['Type'] ?? '');
        const props = (res['Properties'] as Record<string, unknown>) ?? {};

        // Handle EventSourceMapping — creates an edge, not a node
        if (cfnType === 'AWS::Lambda::EventSourceMapping') {
          const fnArn = resolveRef(props['FunctionName']);
          const src = resolveRef(props['EventSourceArn']);
          if (fnArn && src) {
            edges.push({
              source: slugify(src),
              target: slugify(fnArn),
              edgeType: 'triggers',
              label: 'triggers',
            });
          }
          continue;
        }

        const service = detectServiceFromType(cfnType, props);
        if (!service) continue;

        const name = String(props['FunctionName'] ?? props['TableName'] ?? props['BucketName'] ??
          props['QueueName'] ?? props['TopicName'] ?? props['RestApiName'] ?? props['Name'] ?? logicalId);

        nodes.push({
          id: slugify(logicalId),
          logicalId,
          service,
          resourceType: cfnType,
          name,
          properties: props,
        });

        // Extract SAM function events as edges
        if (cfnType === 'AWS::Serverless::Function') {
          const events = props['Events'] as Record<string, Record<string, unknown>> | undefined;
          if (events) {
            for (const [, evt] of Object.entries(events)) {
              const evtType = String(evt['Type'] ?? '');
              const evtProps = (evt['Properties'] as Record<string, unknown>) ?? {};
              if (evtType === 'Api' || evtType === 'HttpApi') {
                const apiId = resolveRef(evtProps['RestApiId'] ?? evtProps['ApiId'] ?? '');
                if (apiId) {
                  edges.push({ source: slugify(apiId), target: slugify(logicalId), edgeType: 'routes', label: String(evtProps['Method'] ?? 'ANY') + ' ' + String(evtProps['Path'] ?? '/') });
                }
              } else if (evtType === 'SQS') {
                const queueId = resolveRef(evtProps['Queue'] ?? '');
                if (queueId) {
                  edges.push({ source: slugify(queueId), target: slugify(logicalId), edgeType: 'triggers', label: 'SQS trigger' });
                }
              } else if (evtType === 'Kinesis') {
                const streamId = resolveRef(evtProps['Stream'] ?? '');
                if (streamId) {
                  edges.push({ source: slugify(streamId), target: slugify(logicalId), edgeType: 'triggers', label: 'Kinesis trigger' });
                }
              } else if (evtType === 'SNS') {
                const topicId = resolveRef(evtProps['Topic'] ?? '');
                if (topicId) {
                  edges.push({ source: slugify(topicId), target: slugify(logicalId), edgeType: 'triggers', label: 'SNS subscription' });
                }
              } else if (evtType === 'Schedule' || evtType === 'EventBridgeRule') {
                edges.push({ source: 'eventbridge-scheduler', target: slugify(logicalId), edgeType: 'triggers', label: 'schedule' });
              }
            }
          }
        }
      }
    }

    return {
      nodes,
      edges,
      boundaries: [],
      metadata: {
        source: 'cloudformation',
        parsedFiles,
        generatedAt: new Date().toISOString(),
        liveMode: false,
      },
    };
  }
}

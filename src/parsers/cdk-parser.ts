import { readFileSync } from 'fs';
import type { IaCParser } from './types.js';
import type { ArchitectureGraph, AwsResourceNode, ResourceEdge } from '../graph/types.js';
import { isCdkProject } from '../scanner/framework-detector.js';
import { logger } from '../utils/logger.js';

interface ConstructPattern {
  service: string;
  patterns: RegExp[];
}

const CONSTRUCT_PATTERNS: ConstructPattern[] = [
  { service: 'lambda',        patterns: [/new\s+(?:lambda|Lambda)\.(?:Function|NodejsFunction|PythonFunction|DockerImageFunction)\s*\(/g] },
  { service: 'dynamodb',      patterns: [/new\s+(?:dynamodb|DynamoDB)\.Table\s*\(/g] },
  { service: 's3',            patterns: [/new\s+(?:s3|S3)\.Bucket\s*\(/g] },
  { service: 'sqs',           patterns: [/new\s+(?:sqs|SQS)\.Queue\s*\(/g] },
  { service: 'sns',           patterns: [/new\s+(?:sns|SNS)\.Topic\s*\(/g] },
  { service: 'api-gateway',   patterns: [/new\s+(?:apigateway|apigw)\.RestApi\s*\(/gi, /new\s+(?:apigw_alpha|RestApi)\s*\(/g] },
  { service: 'api-gateway-v2',patterns: [/new\s+(?:apigatewayv2|HttpApi)\s*\(/gi] },
  { service: 'cloudfront',    patterns: [/new\s+(?:cloudfront|cf)\.Distribution\s*\(/gi] },
  { service: 'ecs-fargate',   patterns: [/new\s+ecs_patterns\.\w+FargateService\s*\(/g, /new\s+ecs\.FargateService\s*\(/g] },
  { service: 'ecs',           patterns: [/new\s+ecs\.(?:Ec2Service|ExternalService)\s*\(/g] },
  { service: 'eks',           patterns: [/new\s+eks\.Cluster\s*\(/g] },
  { service: 'rds',           patterns: [/new\s+rds\.DatabaseInstance\s*\(/g] },
  { service: 'aurora',        patterns: [/new\s+rds\.DatabaseCluster\s*\(/g, /new\s+rds\.ServerlessCluster\s*\(/g] },
  { service: 'elasticache',   patterns: [/new\s+elasticache\.CfnReplicationGroup\s*\(/gi] },
  { service: 'step-functions',patterns: [/new\s+sfn\.StateMachine\s*\(/g, /new\s+stepfunctions\.StateMachine\s*\(/g] },
  { service: 'eventbridge',   patterns: [/new\s+events\.Rule\s*\(/g] },
  { service: 'kinesis',       patterns: [/new\s+kinesis\.Stream\s*\(/g] },
  { service: 'cognito',       patterns: [/new\s+cognito\.UserPool\s*\(/g] },
  { service: 'alb',           patterns: [/new\s+elbv2\.ApplicationLoadBalancer\s*\(/gi] },
  { service: 'nlb',           patterns: [/new\s+elbv2\.NetworkLoadBalancer\s*\(/gi] },
  { service: 'bedrock',       patterns: [/new\s+bedrock\.\w+\s*\(/g] },
  { service: 'sagemaker',     patterns: [/new\s+sagemaker\.\w+\s*\(/g] },
];

const EVENT_SOURCE_PATTERNS: Array<{ pattern: RegExp; service: string; edgeType: 'triggers' }> = [
  { pattern: /addEventSource\s*\(\s*new\s+SqsEventSource\s*\(\s*(\w+)/g, service: 'sqs', edgeType: 'triggers' },
  { pattern: /addEventSource\s*\(\s*new\s+KinesisEventSource\s*\(\s*(\w+)/g, service: 'kinesis', edgeType: 'triggers' },
  { pattern: /addEventSource\s*\(\s*new\s+DynamoEventSource\s*\(\s*(\w+)/g, service: 'dynamodb', edgeType: 'triggers' },
  { pattern: /addEventSource\s*\(\s*new\s+SnsEventSource\s*\(\s*(\w+)/g, service: 'sns', edgeType: 'triggers' },
];

function extractConstructId(content: string, matchIndex: number): string {
  const segment = content.slice(matchIndex, matchIndex + 200);
  const thisIdMatch = /this,\s*['"`]([^'"`]+)['"`]/.exec(segment);
  if (thisIdMatch) return thisIdMatch[1] ?? '';
  const idMatch = /['"`]([A-Z][A-Za-z0-9]+)['"`]/.exec(segment);
  return idMatch?.[1] ?? `construct-${matchIndex}`;
}

export class CdkParser implements IaCParser {
  name = 'cdk';

  detect(files: string[]): boolean {
    return isCdkProject(files);
  }

  async parse(files: string[], _rootDir: string): Promise<Partial<ArchitectureGraph>> {
    const nodes: AwsResourceNode[] = [];
    const edges: ResourceEdge[] = [];
    const parsedFiles: string[] = [];
    let nodeCount = 0;

    const tsFiles = files.filter(f => f.endsWith('.ts') && !f.includes('.d.ts') && !f.includes('node_modules'));

    for (const filePath of tsFiles) {
      let content: string;
      try { content = readFileSync(filePath, 'utf-8'); } catch { continue; }
      if (!content.includes('aws-cdk-lib') && !content.includes('@aws-cdk')) continue;

      parsedFiles.push(filePath);
      const fileNodes: AwsResourceNode[] = [];

      for (const { service, patterns } of CONSTRUCT_PATTERNS) {
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(content)) !== null) {
            const constructId = extractConstructId(content, match.index) || `${service}-${++nodeCount}`;
            const id = constructId.toLowerCase().replace(/[^a-z0-9]/g, '-');
            if (!nodes.find(n => n.id === id)) {
              const node: AwsResourceNode = {
                id,
                logicalId: constructId,
                service,
                resourceType: `cdk:${service}`,
                name: constructId,
                properties: {},
              };
              nodes.push(node);
              fileNodes.push(node);
            }
          }
        }
      }

      // Extract event source connections
      for (const { pattern, edgeType } of EVENT_SOURCE_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
          const sourceVar = (match[1] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '-');
          const targetNode = fileNodes.find(n => n.service === 'lambda');
          if (sourceVar && targetNode) {
            edges.push({ source: sourceVar, target: targetNode.id, edgeType, label: 'event source' });
          }
        }
      }
    }

    logger.debug('CDK parser complete', { nodes: nodes.length, edges: edges.length });

    return {
      nodes,
      edges,
      boundaries: [],
      metadata: { source: 'cdk', parsedFiles, generatedAt: new Date().toISOString(), liveMode: false },
    };
  }
}

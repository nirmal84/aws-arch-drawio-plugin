export type ResourceTier = 'edge' | 'compute' | 'data' | 'integration' | 'monitoring' | 'external';
export type ResourceCategory = 'compute' | 'database' | 'storage' | 'networking' | 'messaging' | 'security' | 'monitoring' | 'ai' | 'external';

export interface ServiceMetadata {
  tier: ResourceTier;
  techLabel: string;
  category: ResourceCategory;
}

export const AWS_SERVICE_CATALOG = {
  // Compute
  'lambda':             { tier: 'compute',     techLabel: 'Lambda',             category: 'compute' },
  'ecs':                { tier: 'compute',     techLabel: 'Docker',             category: 'compute' },
  'ecs-fargate':        { tier: 'compute',     techLabel: 'Fargate',            category: 'compute' },
  'ec2':                { tier: 'compute',     techLabel: 'EC2',                category: 'compute' },
  'eks':                { tier: 'compute',     techLabel: 'Kubernetes',         category: 'compute' },
  'app-runner':         { tier: 'compute',     techLabel: 'AppRunner',          category: 'compute' },
  'batch':              { tier: 'compute',     techLabel: 'Batch',              category: 'compute' },
  'step-functions':     { tier: 'compute',     techLabel: 'StepFunctions',      category: 'compute' },
  // Data
  'dynamodb':           { tier: 'data',        techLabel: 'DynamoDB',           category: 'database' },
  'rds':                { tier: 'data',        techLabel: 'PostgreSQL',         category: 'database' },
  'rds-mysql':          { tier: 'data',        techLabel: 'MySQL',              category: 'database' },
  'rds-postgres':       { tier: 'data',        techLabel: 'PostgreSQL',         category: 'database' },
  'aurora':             { tier: 'data',        techLabel: 'Aurora',             category: 'database' },
  'aurora-serverless':  { tier: 'data',        techLabel: 'Aurora',             category: 'database' },
  's3':                 { tier: 'data',        techLabel: 'S3',                 category: 'storage' },
  'elasticache':        { tier: 'data',        techLabel: 'Redis',              category: 'database' },
  'elasticache-memcached': { tier: 'data',     techLabel: 'Memcached',          category: 'database' },
  'neptune':            { tier: 'data',        techLabel: 'Neptune',            category: 'database' },
  'opensearch':         { tier: 'data',        techLabel: 'OpenSearch',         category: 'database' },
  'redshift':           { tier: 'data',        techLabel: 'Redshift',           category: 'database' },
  'timestream':         { tier: 'data',        techLabel: 'Timestream',         category: 'database' },
  // Edge / Networking
  'cloudfront':         { tier: 'edge',        techLabel: 'CloudFront',         category: 'networking' },
  'api-gateway':        { tier: 'edge',        techLabel: 'API Gateway',        category: 'networking' },
  'api-gateway-v2':     { tier: 'edge',        techLabel: 'API Gateway',        category: 'networking' },
  'alb':                { tier: 'edge',        techLabel: 'ALB',                category: 'networking' },
  'nlb':                { tier: 'edge',        techLabel: 'NLB',                category: 'networking' },
  'route53':            { tier: 'edge',        techLabel: 'Route53',            category: 'networking' },
  'waf':                { tier: 'edge',        techLabel: 'WAF',                category: 'networking' },
  'global-accelerator': { tier: 'edge',        techLabel: 'GlobalAccelerator',  category: 'networking' },
  'app-mesh':           { tier: 'edge',        techLabel: 'AppMesh',            category: 'networking' },
  // Integration / Messaging
  'sqs':                { tier: 'integration', techLabel: 'SQS',                category: 'messaging' },
  'sns':                { tier: 'integration', techLabel: 'SNS',                category: 'messaging' },
  'eventbridge':        { tier: 'integration', techLabel: 'EventBridge',        category: 'messaging' },
  'kinesis':            { tier: 'integration', techLabel: 'Kinesis',            category: 'messaging' },
  'kinesis-firehose':   { tier: 'integration', techLabel: 'Firehose',           category: 'messaging' },
  'msk':                { tier: 'integration', techLabel: 'Kafka',              category: 'messaging' },
  // AI/ML
  'bedrock':            { tier: 'compute',     techLabel: 'Bedrock',            category: 'ai' },
  'sagemaker':          { tier: 'compute',     techLabel: 'SageMaker',          category: 'ai' },
  // Auth / Security
  'cognito':            { tier: 'edge',        techLabel: 'Cognito',            category: 'security' },
  'iam':                { tier: 'external',    techLabel: 'IAM',                category: 'security' },
  // Monitoring
  'cloudwatch':         { tier: 'monitoring',  techLabel: 'CloudWatch',         category: 'monitoring' },
  'xray':               { tier: 'monitoring',  techLabel: 'X-Ray',              category: 'monitoring' },
  // External
  'internet':           { tier: 'external',    techLabel: 'Internet',           category: 'external' },
  'users':              { tier: 'external',    techLabel: 'Users',              category: 'external' },
} as const satisfies Record<string, ServiceMetadata>;

export type AwsService = keyof typeof AWS_SERVICE_CATALOG;

export function getServiceMetadata(service: string): ServiceMetadata {
  if (service in AWS_SERVICE_CATALOG) {
    return AWS_SERVICE_CATALOG[service as AwsService];
  }
  return { tier: 'compute', techLabel: service, category: 'compute' };
}

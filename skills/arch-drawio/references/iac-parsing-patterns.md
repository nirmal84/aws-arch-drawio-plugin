# IaC Parsing Patterns

Detailed parsing reference for Stage 1 (Scan & Detect) and Stage 2 (Parse Resources).
This file is shared across both the Excalidraw and Draw.io plugins.

---

## CloudFormation

### Detection

A file is a CloudFormation template if it contains:
```yaml
AWSTemplateFormatVersion: "2010-09-09"
```

or a SAM template if it contains:
```yaml
Transform: AWS::Serverless-2016-10-31
```

### Resource Type → Service Mapping

| CloudFormation Type | Service | Draw.io Shape |
|---|---|---|
| `AWS::Lambda::Function` | lambda | `mxgraph.aws4.lambda_function` |
| `AWS::Serverless::Function` | lambda | `mxgraph.aws4.lambda_function` |
| `AWS::ApiGateway::RestApi` | api-gateway | `mxgraph.aws4.api_gateway` |
| `AWS::ApiGateway::HttpApi` | api-gateway | `mxgraph.aws4.api_gateway` |
| `AWS::Serverless::Api` | api-gateway | `mxgraph.aws4.api_gateway` |
| `AWS::DynamoDB::Table` | dynamodb | `mxgraph.aws4.dynamodb` |
| `AWS::S3::Bucket` | s3 | `mxgraph.aws4.s3` |
| `AWS::SQS::Queue` | sqs | `mxgraph.aws4.sqs` |
| `AWS::SNS::Topic` | sns | `mxgraph.aws4.sns` |
| `AWS::Events::EventBus` | eventbridge | `mxgraph.aws4.eventbridge` |
| `AWS::Events::Rule` | eventbridge-rule | `mxgraph.aws4.eventbridge` |
| `AWS::Kinesis::Stream` | kinesis | `mxgraph.aws4.kinesis_data_streams` |
| `AWS::MSK::Cluster` | msk | `mxgraph.aws4.managed_streaming_for_kafka` |
| `AWS::ECS::Cluster` | ecs | `mxgraph.aws4.ecs` |
| `AWS::ECS::Service` | ecs-service | `mxgraph.aws4.ecs` |
| `AWS::ECS::TaskDefinition` | ecs-task | `mxgraph.aws4.fargate` |
| `AWS::EKS::Cluster` | eks | `mxgraph.aws4.eks` |
| `AWS::EC2::Instance` | ec2 | `mxgraph.aws4.ec2` |
| `AWS::RDS::DBInstance` | rds | `mxgraph.aws4.rds` |
| `AWS::RDS::DBCluster` | aurora | `mxgraph.aws4.aurora` |
| `AWS::ElastiCache::CacheCluster` | elasticache | `mxgraph.aws4.elasticache` |
| `AWS::CloudFront::Distribution` | cloudfront | `mxgraph.aws4.cloudfront` |
| `AWS::ElasticLoadBalancingV2::LoadBalancer` | alb/nlb | `mxgraph.aws4.application_load_balancer` |
| `AWS::Cognito::UserPool` | cognito | `mxgraph.aws4.cognito` |
| `AWS::StepFunctions::StateMachine` | step-functions | `mxgraph.aws4.step_functions` |
| `AWS::CloudWatch::Alarm` | cloudwatch | `mxgraph.aws4.cloudwatch` |
| `AWS::Bedrock::Agent` | bedrock | `mxgraph.aws4.bedrock` |
| `AWS::SageMaker::Endpoint` | sagemaker | `mxgraph.aws4.sagemaker` |
| `AWS::Neptune::DBCluster` | neptune | `mxgraph.aws4.neptune` |
| `AWS::OpenSearchService::Domain` | opensearch | `mxgraph.aws4.opensearch_service` |
| `AWS::Redshift::Cluster` | redshift | `mxgraph.aws4.redshift` |
| `AWS::AppRunner::Service` | apprunner | `mxgraph.aws4.app_runner` |

### Key Properties to Extract

**Lambda**:
```yaml
Properties:
  FunctionName: my-function        # → name
  Runtime: nodejs20.x              # → metadata
  VpcConfig:
    SubnetIds: [!Ref PrivateSubnet]  # → subnet boundary
  Environment:
    Variables:
      TABLE_NAME: !Ref OrdersTable   # → env var edge
      QUEUE_URL: !Ref OrderQueue
  Policies:                          # SAM — IAM grants
  Events:                            # SAM — trigger edges
```

**RDS**:
```yaml
Properties:
  Engine: postgres               # → determines shape label
  MultiAZ: true
  DBSubnetGroupName: !Ref DBSubnetGroup  # → subnet boundary
```

### Resolving !Ref and !GetAtt

- `!Ref LogicalName` → resolves to the logical ID of the resource
- `!GetAtt LogicalName.Arn` → same logical ID
- `!Sub "arn:...${LogicalName}..."` → extract `LogicalName` from substitution

Use these to build edges between resources by matching logical IDs.

---

## Terraform

### Detection

Files with `.tf` extension containing `resource "aws_*"` blocks.

### Resource Type → Draw.io Shape Mapping

| Terraform Resource | Draw.io Shape |
|---|---|
| `aws_lambda_function` | `mxgraph.aws4.lambda_function` |
| `aws_api_gateway_rest_api` | `mxgraph.aws4.api_gateway` |
| `aws_apigatewayv2_api` | `mxgraph.aws4.api_gateway` |
| `aws_dynamodb_table` | `mxgraph.aws4.dynamodb` |
| `aws_s3_bucket` | `mxgraph.aws4.s3` |
| `aws_sqs_queue` | `mxgraph.aws4.sqs` |
| `aws_sns_topic` | `mxgraph.aws4.sns` |
| `aws_cloudwatch_event_bus` | `mxgraph.aws4.eventbridge` |
| `aws_kinesis_stream` | `mxgraph.aws4.kinesis_data_streams` |
| `aws_msk_cluster` | `mxgraph.aws4.managed_streaming_for_kafka` |
| `aws_ecs_cluster` | `mxgraph.aws4.ecs` |
| `aws_ecs_service` | `mxgraph.aws4.ecs` |
| `aws_eks_cluster` | `mxgraph.aws4.eks` |
| `aws_instance` | `mxgraph.aws4.ec2` |
| `aws_db_instance` | `mxgraph.aws4.rds` |
| `aws_rds_cluster` | `mxgraph.aws4.aurora` |
| `aws_elasticache_cluster` | `mxgraph.aws4.elasticache` |
| `aws_cloudfront_distribution` | `mxgraph.aws4.cloudfront` |
| `aws_lb` / `aws_alb` | `mxgraph.aws4.application_load_balancer` |
| `aws_cognito_user_pool` | `mxgraph.aws4.cognito` |
| `aws_sfn_state_machine` | `mxgraph.aws4.step_functions` |

### Key Patterns

```hcl
# Lambda environment variable → resource reference
resource "aws_lambda_function" "handler" {
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.orders.name   # → edge to orders table
      QUEUE_URL  = aws_sqs_queue.orders.url
    }
  }
}

# Event source mapping → SQS trigger edge
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.orders.arn
  function_name    = aws_lambda_function.handler.arn
}

# IAM policy → resource access edge
resource "aws_iam_role_policy" "lambda_policy" {
  policy = jsonencode({
    Statement = [{
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
      Resource = aws_dynamodb_table.orders.arn
    }]
  })
}
```

---

## CDK (TypeScript)

### Detection

Look for `cdk.json` at root or `import { ... } from 'aws-cdk-lib'` in `*.ts` files.

### Key Patterns

```typescript
// Lambda — extract name and environment variable references
const handler = new lambda.Function(this, 'OrderHandler', {
  functionName: 'order-handler',
  environment: {
    TABLE_NAME: table.tableName,   // → edge to table
    QUEUE_URL: queue.queueUrl,
  },
});

// IAM grant → data flow edge
table.grantReadWriteData(handler);  // → edge: handler → table

// Event source → trigger edge
handler.addEventSource(new SqsEventSource(queue));  // → edge: queue → handler

// API Gateway integration → routing edge
resource.addMethod('POST', new apigateway.LambdaIntegration(handler));
```

---

## SAM Event Types → Draw.io Edge Types

| SAM Event | Edge Source | Edge Target | Style |
|---|---|---|---|
| `Api` / `HttpApi` | API Gateway | Lambda | HTTPS/API (blue) |
| `SQS` | SQS | Lambda | Event/Async (orange dashed) |
| `SNS` | SNS | Lambda | Event/Async (orange dashed) |
| `DynamoDB` | DynamoDB | Lambda | Event/Async (orange dashed) |
| `Kinesis` | Kinesis | Lambda | Event/Async (orange dashed) |
| `EventBridgeRule` | EventBridge | Lambda | Event/Async (orange dashed) |
| `S3` | S3 | Lambda | Event/Async (orange dashed) |
| `Schedule` | EventBridge | Lambda | Event/Async (orange dashed) |

## SAM Policy Shortcuts → Edge Labels

| SAM Policy | Edge Label | Edge Style |
|---|---|---|
| `DynamoDBCrudPolicy` | "CRUD" | Data flow (green) |
| `DynamoDBReadPolicy` | "Read" | Data flow (green) |
| `SQSSendMessagePolicy` | "SendMessage" | Integration |
| `SNSPublishMessagePolicy` | "Publish" | Integration |
| `S3CrudPolicy` | "CRUD" | Data flow (green) |
| `S3ReadPolicy` | "Read" | Data flow (green) |

# AWS Shape Map for Draw.io

Official `mxgraph.aws4.*` shape names for use with `add-shape` tool calls or in `style` properties.

> **Tip**: Use `get-shape-by-name` to verify a shape exists before placing it. Use `get-shapes-in-category` to browse available shapes in a category.

---

## Compute

| AWS Service | Shape Name | Category |
|---|---|---|
| Lambda | `mxgraph.aws4.lambda_function` | Compute |
| ECS | `mxgraph.aws4.ecs` | Compute |
| Fargate | `mxgraph.aws4.fargate` | Compute |
| EKS | `mxgraph.aws4.eks` | Compute |
| EC2 | `mxgraph.aws4.ec2` | Compute |
| EC2 Auto Scaling | `mxgraph.aws4.auto_scaling` | Compute |
| App Runner | `mxgraph.aws4.app_runner` | Compute |
| Batch | `mxgraph.aws4.batch` | Compute |
| Lightsail | `mxgraph.aws4.lightsail` | Compute |
| Elastic Beanstalk | `mxgraph.aws4.elastic_beanstalk` | Compute |

## API & Edge

| AWS Service | Shape Name | Category |
|---|---|---|
| API Gateway | `mxgraph.aws4.api_gateway` | Network |
| CloudFront | `mxgraph.aws4.cloudfront` | Network |
| Application Load Balancer | `mxgraph.aws4.application_load_balancer` | Network |
| Network Load Balancer | `mxgraph.aws4.network_load_balancer` | Network |
| WAF | `mxgraph.aws4.waf` | Security |
| Route 53 | `mxgraph.aws4.route_53` | Network |
| Cognito | `mxgraph.aws4.cognito` | Security |
| Global Accelerator | `mxgraph.aws4.global_accelerator` | Network |

## Data Storage

| AWS Service | Shape Name | Category |
|---|---|---|
| DynamoDB | `mxgraph.aws4.dynamodb` | Database |
| S3 | `mxgraph.aws4.s3` | Storage |
| RDS | `mxgraph.aws4.rds` | Database |
| Aurora | `mxgraph.aws4.aurora` | Database |
| ElastiCache | `mxgraph.aws4.elasticache` | Database |
| Neptune | `mxgraph.aws4.neptune` | Database |
| OpenSearch | `mxgraph.aws4.opensearch_service` | Analytics |
| Redshift | `mxgraph.aws4.redshift` | Analytics |
| DocumentDB | `mxgraph.aws4.documentdb` | Database |
| Keyspaces | `mxgraph.aws4.keyspaces` | Database |
| Timestream | `mxgraph.aws4.timestream` | Database |
| EBS | `mxgraph.aws4.ebs` | Storage |
| EFS | `mxgraph.aws4.efs` | Storage |
| FSx | `mxgraph.aws4.fsx` | Storage |
| Glacier | `mxgraph.aws4.s3_glacier` | Storage |

## Messaging & Integration

| AWS Service | Shape Name | Category |
|---|---|---|
| SQS | `mxgraph.aws4.sqs` | Integration |
| SNS | `mxgraph.aws4.sns` | Integration |
| EventBridge | `mxgraph.aws4.eventbridge` | Integration |
| Kinesis Data Streams | `mxgraph.aws4.kinesis_data_streams` | Analytics |
| Kinesis Firehose | `mxgraph.aws4.kinesis_data_firehose` | Analytics |
| MSK (Managed Kafka) | `mxgraph.aws4.managed_streaming_for_kafka` | Analytics |
| Step Functions | `mxgraph.aws4.step_functions` | Integration |
| AppSync | `mxgraph.aws4.appsync` | Integration |
| MQ | `mxgraph.aws4.mq` | Integration |

## AI / ML

| AWS Service | Shape Name | Category |
|---|---|---|
| Bedrock | `mxgraph.aws4.bedrock` | ML |
| SageMaker | `mxgraph.aws4.sagemaker` | ML |
| Rekognition | `mxgraph.aws4.rekognition` | ML |
| Textract | `mxgraph.aws4.textract` | ML |
| Comprehend | `mxgraph.aws4.comprehend` | ML |
| Translate | `mxgraph.aws4.translate` | ML |
| Lex | `mxgraph.aws4.lex` | ML |

## Observability

| AWS Service | Shape Name | Category |
|---|---|---|
| CloudWatch | `mxgraph.aws4.cloudwatch` | Management |
| X-Ray | `mxgraph.aws4.xray` | Management |
| CloudTrail | `mxgraph.aws4.cloudtrail` | Management |

## Networking / VPC

| AWS Service | Shape Name | Category |
|---|---|---|
| VPC | `mxgraph.aws4.vpc` | Network |
| Transit Gateway | `mxgraph.aws4.transit_gateway` | Network |
| VPN | `mxgraph.aws4.vpn` | Network |
| Direct Connect | `mxgraph.aws4.direct_connect` | Network |
| NAT Gateway | `mxgraph.aws4.nat_gateway` | Network |
| Internet Gateway | `mxgraph.aws4.internet_gateway` | Network |

## Security & Identity

| AWS Service | Shape Name | Category |
|---|---|---|
| IAM | `mxgraph.aws4.iam` | Security |
| KMS | `mxgraph.aws4.kms` | Security |
| Secrets Manager | `mxgraph.aws4.secrets_manager` | Security |
| Certificate Manager | `mxgraph.aws4.certificate_manager` | Security |
| Shield | `mxgraph.aws4.shield` | Security |
| GuardDuty | `mxgraph.aws4.guardduty` | Security |

## Developer Tools

| AWS Service | Shape Name | Category |
|---|---|---|
| CodePipeline | `mxgraph.aws4.codepipeline` | Developer Tools |
| CodeBuild | `mxgraph.aws4.codebuild` | Developer Tools |
| CodeDeploy | `mxgraph.aws4.codedeploy` | Developer Tools |
| CDK | `mxgraph.aws4.cdk` | Developer Tools |
| CloudFormation | `mxgraph.aws4.cloudformation` | Management |

---

## Using Fallback Styles

If `add-shape` is not available or a shape isn't found, use `add-rectangle` with the shape in the style:

```
style="shape=mxgraph.aws4.lambda_function;sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outline=Lambda;labelBackgroundColor=#ffffff;sketch=0;fontStyle=1;fontSize=11;align=center;verticalAlign=bottom;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda"
```

Minimal fallback style:
```
style="shape=mxgraph.aws4.lambda_function;fillColor=#ED7100;strokeColor=#ffffff;"
```

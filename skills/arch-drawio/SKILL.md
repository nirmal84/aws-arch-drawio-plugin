---
name: aws-arch-drawio
description: >
  AWS architecture diagram generator for Draw.io. Analyses IaC code
  (CloudFormation, CDK, Terraform, SAM) and generates professional Draw.io
  diagrams with official AWS icons (mxgraph.aws4.*) via drawio-mcp-server,
  with tier-based layout, layer management, and PNG/SVG export.

  USE THIS SKILL whenever someone:
  - Shares CloudFormation, CDK, Terraform, or SAM code and asks for a Draw.io diagram
  - Runs /arch-drawio or asks to visualise their AWS infrastructure in Draw.io
  - Wants official AWS icons with proper tier-based layout (edge → compute → data)
  - Asks "draw my architecture", "generate a drawio diagram", or "visualise my stack"
  - Needs a professional, export-ready diagram with layers for boundaries, services,
    and connections — suitable for enterprise documentation or architecture reviews
  - Wants to see inferred connections between services (IAM policies, env vars, event
    source mappings, SNS subscriptions, S3 notifications, Step Functions states)
  - Needs a diagram with VPC/subnet/AZ boundary containers and security group overlays
---

# AWS Architecture Diagram — Draw.io

You are an AWS architecture diagram generator for Draw.io. Your job is to analyse IaC code in the current project and produce a professional Draw.io architecture diagram with official AWS icons by orchestrating MCP tool calls.

## Pipeline

Follow these stages in order:

### Stage 1: Scan & Detect
1. Walk the project directory looking for IaC files:
   - `*.yaml`, `*.yml`, `*.json` — check for `AWSTemplateFormatVersion` (CloudFormation) or `Transform: AWS::Serverless` (SAM)
   - `*.tf`, `*.tfvars` — Terraform
   - `cdk.json`, `bin/*.ts`, `lib/*.ts` — CDK projects (look for `aws-cdk-lib` imports)
   - `serverless.yml` — Serverless Framework
2. Also scan application code (`*.ts`, `*.py`, `*.java`) for AWS SDK client instantiations
3. Report what you found before proceeding.

### Stage 2: Parse Resources
For each IaC file found:
1. Extract AWS resource definitions (resource type, logical name, key properties)
2. Use `awslabs-iac` MCP to validate templates if CloudFormation
3. Build a resource inventory with these fields per resource:
   - `id`: unique identifier
   - `service`: AWS service name
   - `name`: human-readable label
   - `tier`: one of edge / compute / data / integration / monitoring / external
   - `drawioShape`: the mxgraph shape name from the AWS Shape Map below
   - `vpc`, `subnet`, `availabilityZone`: if applicable

### Stage 3: Infer Relationships
Same inference logic as the Excalidraw plugin:
1. **IAM policies** → reads/writes edges
2. **Environment variables** → connection edges
3. **Event source mappings** → trigger edges
4. **API Gateway integrations** → routing edges
5. **S3 notifications** → trigger edges
6. **Security groups** → network connectivity
7. **Step Functions** → invocation edges
8. **SNS subscriptions** → subscription edges

### Stage 4: Detect Boundaries
Group resources into nested containers:
- Account → Region → VPC → Subnet → Availability Zone
- ECS services under ECS Cluster, Step Function states under state machine

### Stage 5: Generate Diagram in Draw.io

Use the `drawio` MCP server tools. The sequence is:

#### 5a. Set Up Layers (if --layers enabled, which is default)
```
→ create-layer("Boundaries")      # VPCs, subnets, AZs
→ create-layer("Services")        # AWS resource nodes
→ create-layer("Connections")     # Edges/arrows
```

#### 5b. Draw Boundary Containers
Switch to the Boundaries layer, then for each boundary (outermost first):
```
→ set-active-layer("Boundaries")
→ add-rectangle({
    x: <computed>,
    y: <computed>,
    width: <computed>,
    height: <computed>,
    text: "VPC: 10.0.0.0/16",
    style: "<boundary style from styles reference below>"
  })
```
Record the returned cell ID for each boundary.

#### 5c. Place AWS Service Nodes
Switch to the Services layer, then for each resource:
```
→ set-active-layer("Services")
→ add-shape({
    shape_name: "<from AWS Shape Map>",
    x: <computed within boundary>,
    y: <computed within boundary>,
    width: 60,
    height: 60,
    text: "Order Handler"
  })
```
Record returned cell IDs.

**Important**: Use `add-shape` with the AWS library shape name (not `add-rectangle`) to get the official AWS icon rendering.

If `add-shape` is not available or the shape isn't found, fall back to `add-rectangle` with the shape style embedded:
```
style: "shape=mxgraph.aws4.lambda_function;..."
```

#### 5d. Draw Connections
Switch to the Connections layer:
```
→ set-active-layer("Connections")
→ add-edge({
    source: <source cell ID>,
    target: <target cell ID>,
    text: "POST /orders",
    style: "<edge style from styles reference>"
  })
```

#### 5e. Add Metadata (optional)
For key resources, embed custom data:
```
→ set-data-attribute(cellId, "arn", "arn:aws:lambda:ap-southeast-2:123456:function:order-handler")
→ set-data-attribute(cellId, "service", "lambda")
```

### Stage 6: Report
After diagram generation:
1. Tell the user the diagram is ready in the draw.io editor at `http://localhost:3000/`
2. Summarise: number of services, edges (explicit vs inferred), layers created
3. If `--file` was specified, note the output path
4. If `--export` was specified, explain how to export (draw.io desktop CLI)

## AWS Shape Map

These are the draw.io mxgraph shape identifiers for AWS services. Use these with `add-shape` or in the `style` property:

| AWS Service | Draw.io Shape Name |
|---|---|
| Lambda | `mxgraph.aws4.lambda_function` |
| API Gateway | `mxgraph.aws4.api_gateway` |
| DynamoDB | `mxgraph.aws4.dynamodb` |
| S3 | `mxgraph.aws4.s3` |
| SQS | `mxgraph.aws4.sqs` |
| SNS | `mxgraph.aws4.sns` |
| EventBridge | `mxgraph.aws4.eventbridge` |
| Kinesis | `mxgraph.aws4.kinesis_data_streams` |
| MSK (Kafka) | `mxgraph.aws4.managed_streaming_for_kafka` |
| CloudFront | `mxgraph.aws4.cloudfront` |
| ALB | `mxgraph.aws4.application_load_balancer` |
| NLB | `mxgraph.aws4.network_load_balancer` |
| ECS | `mxgraph.aws4.ecs` |
| Fargate | `mxgraph.aws4.fargate` |
| EKS | `mxgraph.aws4.eks` |
| EC2 | `mxgraph.aws4.ec2` |
| RDS | `mxgraph.aws4.rds` |
| Aurora | `mxgraph.aws4.aurora` |
| ElastiCache | `mxgraph.aws4.elasticache` |
| Cognito | `mxgraph.aws4.cognito` |
| Step Functions | `mxgraph.aws4.step_functions` |
| CloudWatch | `mxgraph.aws4.cloudwatch` |
| Route 53 | `mxgraph.aws4.route_53` |
| WAF | `mxgraph.aws4.waf` |
| VPC | `mxgraph.aws4.vpc` |
| Bedrock | `mxgraph.aws4.bedrock` |
| SageMaker | `mxgraph.aws4.sagemaker` |
| Neptune | `mxgraph.aws4.neptune` |
| OpenSearch | `mxgraph.aws4.opensearch_service` |
| Redshift | `mxgraph.aws4.redshift` |
| App Runner | `mxgraph.aws4.app_runner` |

**Tip**: If you're unsure of a shape name, use `get-shape-categories` to list categories, then `get-shapes-in-category` to browse, or `get-shape-by-name` to search.

## Draw.io Style Reference

### Boundary Containers
```
VPC:             rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=#E8F5E9;strokeColor=#4CAF50;fontStyle=1;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;container=1;collapsible=0;
Public Subnet:   rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#E3F2FD;strokeColor=#2196F3;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;
Private Subnet:  rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#FFF3E0;strokeColor=#FF9800;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;
Availability Zone: rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=#F5F5F5;strokeColor=#9E9E9E;container=1;collapsible=0;verticalAlign=top;
Region:          rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=12 4;fillColor=#FAFAFA;strokeColor=#616161;container=1;collapsible=0;verticalAlign=top;
```

### Edge Styles
```
HTTPS/API:       edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#1976D2;strokeWidth=2;
Event/Async:     edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#F57C00;strokeWidth=2;dashed=1;
Data Flow:       edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#388E3C;strokeWidth=2;
Inferred:        edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#9E9E9E;strokeWidth=1;dashed=1;dashPattern=3 3;
Monitoring:      edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#7B1FA2;strokeWidth=1;dashed=1;
```

## Layout Positioning

Since draw.io requires explicit coordinates, use this tier-based grid layout:

```
Tier layout (left-to-right):
  x=50:    External tier    (Users, Internet, Route53)
  x=200:   Edge tier        (CloudFront, API GW, ALB, WAF, Cognito)
  x=400:   Compute tier     (Lambda, ECS, EKS, EC2, Step Functions)
  x=600:   Integration tier (SQS, SNS, EventBridge, Kinesis)
  x=800:   Data tier        (DynamoDB, RDS, S3, ElastiCache, Neptune)
  x=1000:  Monitoring tier  (CloudWatch, X-Ray)

Within each tier, stack vertically with 80px gaps.
Standard AWS icon size: 60x60px.
Boundary containers: add 40px padding on all sides around their children.
```

Adjust coordinates based on actual node count — the above are starting positions. If a tier has many nodes, increase the vertical spacing or split into sub-columns.

## Style Modes

- **minimal**: Only edge + compute + data tiers. No monitoring, IAM, or VPC boundaries. Clean for presentations.
- **standard** (default): All tiers. VPC boundaries. Inferred edges shown dashed. Layers enabled.
- **detailed**: Everything including AZ boundaries, security groups, CloudWatch alarms, IAM roles, data attribute metadata on all nodes.

## Live Mode (--live)

When `--live` flag is passed:
1. Use AWS MCP servers to query deployed CloudFormation stacks
2. Annotate nodes with ARNs and drift status via `set-data-attribute`
3. Show undeployed resources with dashed borders
4. Show deployed-but-not-in-code resources with red warning styling

## Important Rules

- Always use `add-shape` with AWS library shapes (not plain rectangles) for service nodes — this gives official AWS icons
- Use `get-shape-by-name` to verify a shape exists before placing it
- Create layers FIRST, then switch layers as you place elements
- Record all cell IDs returned by add operations — you need them for edges and metadata
- Keep diagrams readable — suggest splitting at >25 nodes
- Use orthogonal edge style (not straight lines) for professional look
- Report any resources you couldn't classify or connect

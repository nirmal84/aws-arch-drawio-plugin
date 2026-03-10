# AWS Architecture Diagram Plugin — Draw.io

Equip AI coding agents with the skill to generate professional Draw.io architecture diagrams with **official AWS icons** from AWS infrastructure-as-code. Works with **Claude Code**, **Kiro**, **Cursor**, **Windsurf**, and any MCP-compatible editor.

> **Note:** Always review generated diagrams before using them in production documentation. AI can occasionally misclassify resources or miss relationships.

---

## What This Plugin Does

The AWS Arch Draw.io plugin gives your AI agent a `/arch-drawio` command that scans your IaC codebase and produces a professional Draw.io diagram with official AWS icons (`mxgraph.aws4.*`), tier-based layout, layer management, and support for PNG/SVG export.

### Agent Skill Triggers

The skill activates when you ask questions like:

| Trigger Phrase | What It Does |
|---|---|
| *"/arch-drawio"* | Full scan → parse → diagram pipeline |
| *"Generate a Draw.io architecture diagram"* | Scans IaC, opens diagram in Draw.io editor |
| *"Draw my AWS infrastructure with official icons"* | Places `mxgraph.aws4.*` shapes with tier layout |
| *"Show me the service relationships in this project"* | Infers connections from IAM, env vars, event sources |
| *"Create an architecture diagram with VPC boundaries"* | Adds region/VPC/subnet/AZ boundary containers |
| *"Export my architecture to PNG"* | Generates diagram and provides export instructions |

---

## Pipeline

When you run `/arch-drawio`, the plugin follows this pipeline:

1. **Scan & Detect** — Walks the project looking for IaC files (CloudFormation, SAM, CDK, Terraform, Serverless Framework) and application code (AWS SDK usage)
2. **Parse Resources** — Extracts AWS resource definitions and builds a resource inventory with service name, tier, and `mxgraph.aws4.*` shape name
3. **Infer Relationships** — Analyses IAM policies, environment variables, event source mappings, API Gateway integrations, S3 notifications, Step Functions states, and SNS subscriptions
4. **Detect Boundaries** — Groups resources into Account → Region → VPC → Subnet → AZ containers; ECS services under clusters
5. **Generate Diagram** — Calls `drawio-mcp-server` tool sequence: creates layers, places boundary containers, places AWS icon nodes with explicit coordinates, draws edges
6. **Report** — Provides diagram location (`http://localhost:3000/`), resource count, layer summary, and export instructions

---

## Supported IaC Frameworks

| Framework | Detection |
|---|---|
| AWS CloudFormation | `AWSTemplateFormatVersion: "2010-09-09"` in `.yaml`/`.json` |
| AWS SAM | `Transform: AWS::Serverless-2016-10-31` |
| AWS CDK (TypeScript) | `cdk.json` at root or `aws-cdk-lib` imports in `bin/*.ts`, `lib/*.ts` |
| Terraform | `*.tf` files with `resource "aws_*"` blocks |
| Serverless Framework | `serverless.yml` / `serverless.yaml` |
| Application Code | `*.ts`, `*.py`, `*.java` scanned for AWS SDK client instantiation |

---

## Relationship Inference

The skill infers service connections from:

| Source | What It Detects |
|---|---|
| IAM policies | `dynamodb:PutItem` → Lambda writes to DynamoDB |
| Environment variables | `TABLE_NAME: !Ref OrdersTable` → Lambda connects to table |
| Event source mappings | `SQS/Kinesis/DynamoDB Stream` → Lambda triggers |
| API Gateway integrations | API GW → Lambda/HTTP proxy routing |
| S3 notifications | `NotificationConfiguration` → Lambda/SQS/SNS triggers |
| SNS subscriptions | `SNS` → SQS/Lambda/HTTP subscriptions |
| Step Functions | State machine definition → Lambda/ECS invocations |
| AWS SDK usage | `new DynamoDBClient()`, `boto3.client('s3')` → inferred data flows |

---

## Draw.io Backends

| Backend | Flag | Description |
|---|---|---|
| **lgazo** *(default)* | `--backend lgazo` | Live editor via `drawio-mcp-server` at `localhost:3000` |
| **sujimoshi** | `--backend sujimoshi` | File-based output, no running editor required |
| **official** | `--backend official` | One-shot mxGraph XML via `@drawio/mcp` |

---

## Style Modes

| Mode | Description |
|---|---|
| `--style minimal` | Only edge + compute + data tiers. No boundaries or monitoring. Clean for presentations. |
| `--style standard` | All tiers. VPC/subnet boundaries. Inferred edges as dashed grey. 3 layers. *(default)* |
| `--style detailed` | AZ boundaries, security group nodes, CloudWatch alarms, IAM roles, ARN metadata on all nodes. |

---

## Plugin Components

### Agent Skill

| Component | Description |
|---|---|
| `skills/arch-drawio/SKILL.md` | Core skill — pipeline stages, AWS shape map, style modes, layout guide |
| `skills/arch-drawio/references/aws-shape-map.md` | Complete `mxgraph.aws4.*` shape name reference for 50+ AWS services |
| `skills/arch-drawio/references/drawio-style-guide.md` | Boundary styles, edge styles, tier coordinates, layer management |
| `skills/arch-drawio/references/iac-parsing-patterns.md` | Parsing reference for CloudFormation, SAM, CDK, Terraform, Serverless |

### MCP Servers

The plugin configures two MCP servers via `mcp.json`:
- **[drawio-mcp-server](https://github.com/lgazo/drawio-mcp-server)** — Live Draw.io editor control: create layers, add shapes, add edges, set data attributes
- **[awslabs.aws-iac-mcp-server](https://github.com/awslabs/mcp)** — IaC validation (cfn-lint, Checkov) and template analysis

---

## Prerequisites

- **Node.js 18+** — for the TypeScript engine
- **Python 3.10+ with [uv](https://docs.astral.sh/uv/)** — for the AWS IaC MCP server (runs via `uvx`)
- **Draw.io desktop app** (optional) — running at `localhost:3000` for live editor backend

---

## Installation

### Claude Code (GUI — Recommended)

1. Open **Claude Code** → click the **Extensions** icon (puzzle piece) in the sidebar
2. Click **Install Plugin from URL**
3. Enter: `https://github.com/nirmal84/aws-arch-drawio-plugin`
4. Click **Install** — Claude Code clones the plugin and registers the skill and MCP servers automatically
5. In any project with IaC code, type `/arch-drawio`

### Claude Code (CLI)

```bash
# Clone the plugin
git clone https://github.com/nirmal84/aws-arch-drawio-plugin.git ~/.claude/plugins/aws-arch-drawio

# Register the skill
cp -r ~/.claude/plugins/aws-arch-drawio/skills/arch-drawio ~/.claude/skills/

# Add MCP servers
claude mcp add drawio -- npx -y drawio-mcp-server
claude mcp add aws-iac -- uvx awslabs.aws-iac-mcp-server@latest
```

### Manual (Cursor / Windsurf / Kiro / Other MCP Editors)

1. Copy `skills/arch-drawio/` to your editor's skills directory
2. Merge `mcp.json` into your editor's MCP server configuration

---

## Usage

```bash
/arch-drawio                                        # Scan repo, generate diagram
/arch-drawio --file architecture.drawio             # Output to specific file
/arch-drawio --live --region ap-southeast-2         # Include deployed AWS state
/arch-drawio --update architecture.drawio           # Update existing diagram
/arch-drawio --export png                           # Also export to PNG
/arch-drawio --layers                               # Organise into draw.io layers
/arch-drawio --style minimal                        # Fewer nodes (no monitoring/IAM)
/arch-drawio --backend sujimoshi                    # File-based output, no editor
/arch-drawio --backend official                     # One-shot XML via @drawio/mcp
```

---

## File Structure

```
aws-arch-drawio-plugin/
├── skills/
│   └── arch-drawio/
│       ├── SKILL.md                              # Core agent skill
│       └── references/
│           ├── aws-shape-map.md                  # mxgraph.aws4.* shape names
│           ├── drawio-style-guide.md             # Styles, layout, layer guide
│           └── iac-parsing-patterns.md           # IaC parsing reference
├── commands/
│   └── arch-drawio.md                            # /arch-drawio command
├── src/                                          # TypeScript engine
│   ├── scanner/                                  # IaC file detection
│   ├── parsers/                                  # CloudFormation, CDK, Terraform, SAM
│   ├── graph/                                    # Resource graph, inference, boundaries
│   ├── translator/                               # drawio-mcp-server payload builder
│   │   ├── aws-shape-map.ts
│   │   ├── drawio-styles.ts
│   │   ├── layout-engine.ts
│   │   ├── lgazo-translator.ts
│   │   ├── xml-generator.ts
│   │   └── sujimoshi-translator.ts
│   └── index.ts
├── mcp.json                                      # MCP server configuration
├── .claude-plugin/plugin.json                    # Plugin manifest
├── package.json
└── README.md
```

---

## Related Resources

- [drawio-mcp-server](https://github.com/lgazo/drawio-mcp-server) — Draw.io MCP server (lgazo backend)
- [awslabs/mcp](https://github.com/awslabs/mcp) — Official AWS MCP servers
- [aws-arch-excalidraw-plugin](https://github.com/nirmal84/aws-arch-excalidraw-plugin) — Sister plugin for Excalidraw with auto-layout

---

## Author

**Nirmal Rajan** — [@nirmal84](https://github.com/nirmal84)

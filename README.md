# AWS Architecture Diagrams — Draw.io Plugin

A **Claude Code plugin** that scans your AWS infrastructure-as-code (CloudFormation, CDK, Terraform, SAM) and generates professional Draw.io architecture diagrams with **official AWS icons** (`mxgraph.aws4.*`) by orchestrating `drawio-mcp-server`.

---

## Installation

### Option A — Claude Code GUI (Recommended)

1. **Open Claude Code** (the desktop app or VS Code extension)

2. **Add the plugin** — type this slash command in any conversation:
   ```
   /plugin add github:nirmal84/aws-arch-drawio-plugin
   ```
   Or use the Plugin Manager:
   - Click **"Plugins"** in the sidebar → **"Add Plugin"** → paste the GitHub URL:
     `https://github.com/nirmal84/aws-arch-drawio-plugin`

3. **Choose install scope** when prompted:
   - **User** — available in all your projects (recommended)
   - **Project** — shared via `.claude/` committed to git (for teams)

4. **Verify** — you should now see `/arch-drawio` in the `/` command menu

---

### Option B — Claude Code CLI

```bash
claude plugin add github:nirmal84/aws-arch-drawio-plugin
```

For project scope (shared with your team via git):
```bash
claude plugin add github:nirmal84/aws-arch-drawio-plugin --scope project
```

---

### Option C — Manual installation

```bash
# User-level (available in all projects)
git clone https://github.com/nirmal84/aws-arch-drawio-plugin \
  ~/.claude/plugins/aws-arch-drawio

# Project-level (checked into git, shared with team)
git clone https://github.com/nirmal84/aws-arch-drawio-plugin \
  .claude/plugins/aws-arch-drawio
```

Then restart Claude Code.

---

## Required MCP Servers

Install these MCP servers for Claude Code **before** using the plugin:

### Minimum (required)

```bash
# Draw.io MCP — live editor, shape library, full CRUD (900+ stars)
claude mcp add drawio -- npx -y drawio-mcp-server --editor

# AWS IaC MCP — CloudFormation validation, CDK docs
claude mcp add awslabs-iac -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-iac-mcp-server@latest
```

### Full setup (recommended)

```bash
# Draw.io MCP (required)
claude mcp add drawio -- npx -y drawio-mcp-server --editor

# AWS MCPs
claude mcp add awslabs-iac -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-iac-mcp-server@latest
claude mcp add awslabs-cdk -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.cdk-mcp-server@latest
claude mcp add awslabs-terraform -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.terraform-mcp-server@latest

# Live AWS account mode (optional)
claude mcp add awslabs-cfn \
  -e AWS_PROFILE=$AWS_PROFILE \
  -e AWS_REGION=$AWS_REGION \
  -- uvx awslabs.cfn-mcp-server@latest
```

---

## Usage

Navigate to any AWS project directory and run:

```
/arch-drawio
```

### All options

```
/arch-drawio                                          # Static analysis → architecture.drawio
/arch-drawio --file docs/arch.drawio                  # Custom output path
/arch-drawio --style minimal                          # Fewer nodes (no monitoring/IAM)
/arch-drawio --style detailed                         # All nodes + ARN annotations
/arch-drawio --layers                                 # Organize into draw.io layers
/arch-drawio --backend sujimoshi                      # File-based output, no editor
/arch-drawio --backend official                       # One-shot XML via @drawio/mcp
/arch-drawio --export png                             # Also export to PNG via draw.io CLI
/arch-drawio --live --region ap-southeast-2           # Overlay deployed AWS state
/arch-drawio --update architecture.drawio             # Incrementally update existing diagram
```

| Flag | Default | Description |
|------|---------|-------------|
| `--file` | `architecture.drawio` | Output file path |
| `--style` | `standard` | `minimal` / `standard` / `detailed` |
| `--backend` | `lgazo` | `lgazo` / `sujimoshi` / `official` |
| `--layers` | true | Separate Boundaries / Services / Connections layers |
| `--export` | — | Export format: `png` / `svg` / `pdf` |
| `--live` | false | Query live AWS account for deployed state |
| `--profile` | default | AWS profile for live mode |
| `--region` | from config | AWS region for live mode |
| `--update` | — | Path to existing diagram to update |

---

## Draw.io Backends

| Backend | Flag | Best for |
|---------|------|----------|
| **lgazo** (default) | `--backend lgazo` | Live editor — watch diagram build in real-time at `localhost:3000` |
| **sujimoshi** | `--backend sujimoshi` | File-only — writes `.drawio.svg` directly, no editor needed, CI-friendly |
| **official** | `--backend official` | One-shot XML — opens in draw.io editor via URL, portable |

---

## Supported IaC Frameworks

| Framework | Detection |
|-----------|-----------|
| CloudFormation | `*.yaml`/`*.yml`/`*.json` with `AWSTemplateFormatVersion` |
| SAM | `Transform: AWS::Serverless` |
| AWS CDK (TypeScript) | `cdk.json` + `aws-cdk-lib` imports |
| Terraform | `*.tf` files with `resource "aws_*"` |
| Serverless Framework | `serverless.yml` with `provider: name: aws` |

---

## AWS Icon Library

Uses Draw.io's built-in `mxgraph.aws4.*` shapes — the same official AWS icons used in AWS documentation:

`Lambda` · `API Gateway` · `DynamoDB` · `S3` · `SQS` · `SNS` · `EventBridge` · `CloudFront` · `ECS` · `Fargate` · `EKS` · `RDS` · `Aurora` · `ElastiCache` · `Step Functions` · `Kinesis` · `MSK (Kafka)` · `Bedrock` · `SageMaker` · `Cognito` · `CloudWatch` · `ALB` · `NLB` · `Route 53` · `WAF` · `Neptune` · `OpenSearch` · `Redshift` · `Global Accelerator` · and more

---

## How it works

```
Your IaC code
      │
  ┌───▼──────────┐    ┌─────────────────────┐    ┌────────────────────┐
  │   Scanner    │    │     Parsers          │    │   Graph Builder    │
  │ Detects: CFN │───►│ CFN, SAM, CDK,      │───►│ Merges partials,   │
  │ CDK, TF, SAM │    │ Terraform parsers    │    │ infers relations   │
  └──────────────┘    └─────────────────────┘    └─────────┬──────────┘
                                                            │
                                                  ┌─────────▼──────────┐
                                                  │   Layout Engine    │
                                                  │ Tier-based grid:   │
                                                  │ edge→compute→data  │
                                                  └─────────┬──────────┘
                                                            │
                                                  ┌─────────▼──────────┐
                                                  │  drawio-mcp-server │
                                                  │  Official AWS icons │
                                                  │  Layer management  │
                                                  └─────────┬──────────┘
                                                            │
                                                   architecture.drawio
```

Relationship inference covers: IAM policies · environment variables · event source mappings · Step Functions state definitions

---

## Why Draw.io vs Excalidraw?

| | Draw.io | Excalidraw |
|--|---------|------------|
| **AWS Icons** | ✅ Official `mxgraph.aws4.*` | Text labels only |
| **Enterprise** | ✅ Confluence/Jira/SharePoint | Modern eng teams |
| **Layers** | ✅ Toggle boundary/service/connection visibility | No |
| **Export** | PNG, SVG, PDF (draw.io CLI) | PNG only |
| **Aesthetic** | Professional/formal | Hand-drawn/sketch |

---

## Companion plugin

- **[aws-arch-excalidraw-plugin](https://github.com/nirmal84/aws-arch-excalidraw-plugin)** — same analysis, outputs Excalidraw with auto-layout. Better for informal diagrams, workshops, whiteboarding.

---

## Troubleshooting

**Plugin not appearing in `/` menu**
- Restart Claude Code after installation
- Run `claude plugin list` to verify installation

**`drawio-mcp-server` not found**
- Install it: `claude mcp add drawio -- npx -y drawio-mcp-server --editor`
- Verify: `claude mcp list`

**No resources found**
- Ensure IaC files are present (`*.yaml` with `AWSTemplateFormatVersion`, `*.tf`, etc.)

**Build from source**
```bash
git clone https://github.com/nirmal84/aws-arch-drawio-plugin
cd aws-arch-drawio-plugin
npm install
npm run build
```

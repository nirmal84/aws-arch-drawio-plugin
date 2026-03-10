# AWS Architecture Diagrams — Draw.io Plugin

A Claude Code plugin that analyzes AWS IaC code (CloudFormation, CDK, Terraform, SAM) and generates Draw.io architecture diagrams with official AWS icons, using Draw.io and AWS MCP servers.

## Slash Commands

### /arch-drawio
Scan the current project for AWS infrastructure code and generate a Draw.io architecture diagram.

**Usage:**
- `/arch-drawio` — Static analysis, outputs `architecture.drawio`
- `/arch-drawio --live --region ap-southeast-2` — Include deployed AWS resource state
- `/arch-drawio --update architecture.drawio` — Incrementally update existing diagram
- `/arch-drawio --export png` — Also export to PNG
- `/arch-drawio --style minimal` — Minimal diagram
- `/arch-drawio --backend sujimoshi` — Use file-based drawio-mcp (no editor)
- `/arch-drawio --backend official` — Use @drawio/mcp (XML one-shot)
- `/arch-drawio --layers` — Separate boundaries, services, connections into layers

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--file` | `architecture.drawio` | Output file path |
| `--live` | false | Query live AWS account |
| `--profile` | default | AWS profile |
| `--region` | from config | AWS region |
| `--style` | `standard` | `minimal` / `standard` / `detailed` |
| `--update` | — | Path to existing diagram to update |
| `--export` | — | Export format: `png` / `svg` / `pdf` |
| `--backend` | `lgazo` | `lgazo` / `sujimoshi` / `official` |
| `--layers` | true | Use draw.io layers |
| `--aws-icons` | true | Use official AWS icons |

## Required MCP Servers

### Minimum Setup
```bash
claude mcp add drawio -- npx -y drawio-mcp-server --editor
claude mcp add awslabs-iac -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-iac-mcp-server@latest
```

### Full Setup
```bash
claude mcp add drawio -- npx -y drawio-mcp-server --editor
claude mcp add awslabs-iac -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-iac-mcp-server@latest
claude mcp add awslabs-cfn -e AWS_PROFILE=$AWS_PROFILE -e AWS_REGION=$AWS_REGION -- uvx awslabs.cfn-mcp-server@latest
claude mcp add awslabs-cdk -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.cdk-mcp-server@latest
claude mcp add awslabs-terraform -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.terraform-mcp-server@latest
```

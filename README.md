# AWS Architecture Diagrams — Draw.io Plugin

Claude Code plugin that analyses AWS infrastructure code (CDK, Terraform, CloudFormation, SAM) and generates Draw.io architecture diagrams with official AWS icons, layer management, and export capabilities.

## Install

```bash
claude plugin add github:your-org/aws-arch-drawio-plugin
```

This installs the `/arch-drawio` slash command and configures the required MCP servers.

## Required MCP Servers

The plugin's `.mcp.json` auto-configures these, but you can also set them up manually:

```bash
# Draw.io (built-in editor, full CRUD, AWS shape library)
claude mcp add drawio -- npx -y drawio-mcp-server --editor

# AWS IaC (CloudFormation/CDK validation and docs)
claude mcp add awslabs-iac -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-iac-mcp-server@latest
```

### Optional (for full functionality)

```bash
# Live mode — query deployed stacks
claude mcp add awslabs-cfn -e AWS_PROFILE=$AWS_PROFILE -e AWS_REGION=$AWS_REGION -- uvx awslabs.cfn-mcp-server@latest

# CDK construct resolution
claude mcp add awslabs-cdk -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.cdk-mcp-server@latest

# Terraform provider docs
claude mcp add awslabs-terraform -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.terraform-mcp-server@latest

# Complementary PNG output via Python diagrams package
claude mcp add awslabs-diagram -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.aws-diagram-mcp-server@latest
```

## Usage

```
/arch-drawio                                        # Scan repo, open in draw.io editor
/arch-drawio --file architecture.drawio             # Save to specific file
/arch-drawio --live --region ap-southeast-2         # Include deployed state
/arch-drawio --update architecture.drawio           # Update existing diagram
/arch-drawio --export png                           # Also export to PNG
/arch-drawio --style minimal                        # Presentation-friendly
```

## How It Works

1. **Scans** your project for IaC files (CDK, Terraform, CloudFormation, SAM, Serverless)
2. **Parses** AWS resource definitions and properties
3. **Infers** relationships from IAM policies, environment variables, event sources, security groups
4. **Renders** via drawio-mcp-server with official AWS icons from the built-in shape library, organized into layers (Boundaries / Services / Connections)

## Why Draw.io?

- **Official AWS icons** — uses draw.io's built-in `mxgraph.aws4.*` shape library
- **Enterprise standard** — `.drawio` files open in Confluence, Jira, VS Code, desktop app
- **Layer management** — toggle VPC boundaries, connections, or service nodes independently
- **Export pipeline** — PNG, SVG, PDF with embedded XML (remains editable)
- **Live editor** — watch the diagram build in real-time at `localhost:3000`
- **Custom metadata** — ARNs, drift status, and other data embedded in diagram cells

## Companion Plugin

For Excalidraw output with hand-drawn aesthetic: [aws-arch-excalidraw-plugin](https://github.com/your-org/aws-arch-excalidraw-plugin)

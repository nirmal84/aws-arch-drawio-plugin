---
description: Generate a Draw.io architecture diagram with official AWS icons from IaC code in the current project
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(cat:*), Bash(ls:*), Bash(find:*)
argument-hint: "[--file <path>] [--style minimal|standard|detailed] [--backend lgazo|sujimoshi|official] [--layers] [--export png|svg]"
---

Generate a Draw.io architecture diagram with official AWS icons from AWS infrastructure-as-code in the current project.

## Usage

```
/arch-drawio                                        # Scan repo, generate diagram
/arch-drawio --file architecture.drawio             # Output to specific file
/arch-drawio --live --region ap-southeast-2         # Include deployed AWS state
/arch-drawio --update architecture.drawio           # Update existing diagram
/arch-drawio --export png                           # Also export to PNG
/arch-drawio --layers                               # Organize into draw.io layers
/arch-drawio --style minimal                        # Fewer nodes (no monitoring/IAM)
/arch-drawio --backend sujimoshi                    # File-based output, no editor
/arch-drawio --backend official                     # One-shot XML via @drawio/mcp
```

## What happens

Execute the `arch-drawio` skill which will:
1. Scan the project for IaC files (CloudFormation, CDK, Terraform, SAM)
2. Parse AWS resources and infer service relationships
3. Build a resource graph with tier-based layout coordinates
4. Call the `drawio-mcp-server` to place official AWS icons and draw connections
5. Save the result to `architecture.drawio` (or `--file` path)

**Arguments:** $ARGUMENTS

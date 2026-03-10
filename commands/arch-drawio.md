# /arch-drawio

Generate a Draw.io architecture diagram with official AWS icons from infrastructure-as-code in the current project.

## Usage

```
/arch-drawio                                        # Scan repo, generate diagram in draw.io editor
/arch-drawio --file architecture.drawio             # Output to specific file
/arch-drawio --live --region ap-southeast-2         # Include deployed AWS state
/arch-drawio --update architecture.drawio           # Update existing diagram
/arch-drawio --export png                           # Also export to PNG
/arch-drawio --layers                               # Organize into draw.io layers
/arch-drawio --style minimal                        # Fewer nodes (no monitoring/IAM)
```

When invoked, use the `arch-drawio` skill to analyse the codebase and generate the diagram.

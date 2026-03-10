# Draw.io Style Guide for AWS Architecture Diagrams

Reference for boundary styles, edge styles, layout coordinates, and layer organisation.

---

## Layer Organisation

Create three layers in this order (Boundaries first):

```
Layer 1: "Boundaries"   → VPCs, subnets, AZs, regions
Layer 2: "Services"     → AWS service icon nodes
Layer 3: "Connections"  → Edges / arrows between services
```

Tool call sequence:
```
create-layer("Boundaries")
create-layer("Services")
create-layer("Connections")
set-active-layer("Boundaries")   ← draw containers first
set-active-layer("Services")     ← then place icons
set-active-layer("Connections")  ← then draw edges
```

---

## Boundary Container Styles

Use these exact styles with `add-rectangle` for boundary containers:

### Region
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=12 4;fillColor=#FAFAFA;strokeColor=#616161;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;fontSize=12;fontStyle=1;
```

### VPC
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=#E8F5E9;strokeColor=#4CAF50;fontStyle=1;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;container=1;collapsible=0;fontSize=12;
```

### Public Subnet
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#E3F2FD;strokeColor=#2196F3;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;fontSize=11;
```

### Private Subnet
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#FFF3E0;strokeColor=#FF9800;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;fontSize=11;
```

### Availability Zone
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=#F5F5F5;strokeColor=#9E9E9E;container=1;collapsible=0;verticalAlign=top;fontSize=11;
```

### ECS Cluster
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=#E8EAF6;strokeColor=#3F51B5;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;fontSize=11;
```

### Step Functions State Machine
```
rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=#FCE4EC;strokeColor=#E91E63;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;fontSize=11;
```

---

## Edge Styles

### HTTPS / API call (solid, blue)
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#1976D2;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;
```

### Event / Async trigger (dashed, orange)
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#F57C00;strokeWidth=2;dashed=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;
```

### Data flow (solid, green)
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#388E3C;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;
```

### Inferred (dashed, grey — for IAM/env-var inferred edges)
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#9E9E9E;strokeWidth=1;dashed=1;dashPattern=3 3;
```

### Monitoring (dashed, purple)
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#7B1FA2;strokeWidth=1;dashed=1;
```

---

## Tier-Based Layout Coordinates

Left-to-right tier layout. All coordinates are starting X positions for the first node in each tier.

```
Tier                 x       Width reserved
─────────────────────────────────────────────
External             50      130px
Edge                 200     130px
Compute              400     130px
Integration          600     130px
Data                 800     130px
Monitoring           1000    130px
```

**Vertical spacing**: 80px between nodes in the same tier.
**Node size**: 60×60px for all AWS service icons.
**Label**: text appears below the icon (verticalAlign=bottom).

### Example Coordinates

3-node architecture (API GW → Lambda → DynamoDB):
```
API Gateway:  x=200, y=100, w=60, h=60
Lambda:       x=400, y=100, w=60, h=60
DynamoDB:     x=800, y=100, w=60, h=60
```

With a queue in the integration tier:
```
API Gateway:  x=200, y=100
Lambda:       x=400, y=100
SQS Queue:    x=600, y=100
DynamoDB:     x=800, y=100
```

### Boundary Container Sizing

Add 40px padding on all sides around children:

```
If children span y=100 to y=220 (2 nodes × 60px + 80px gap):
Container y = 100 - 40 = 60
Container height = (220 - 100 + 60) + 80 = 220px
Container x = leftmost child x - 40
Container width = rightmost child right edge - leftmost child x + 80
```

For VPC wrapping an edge and compute tier:
```
x = 200 - 40 = 160
width = (400 + 60) - 200 + 80 = 300px
```

---

## Style Modes

### minimal
- Show only: edge + compute + data tiers
- Omit: monitoring, IAM nodes, VPC boundaries, inferred edges
- Use for: presentations, exec summaries

### standard (default)
- Show: all tiers, VPC/subnet boundaries, all explicit edges, inferred edges as dashed grey
- 3 layers: Boundaries, Services, Connections
- Use for: team documentation, architecture reviews

### detailed
- Everything in standard plus: AZ boundaries, security group nodes, CloudWatch alarm nodes, IAM role nodes, data attributes on all nodes, `set-data-attribute` calls for ARNs and metadata
- Use for: enterprise documentation, compliance reviews, security audits

---

## AWS Icon Colours Reference

For fallback rectangle styles, use these AWS brand colours:

| Service Category | Fill Colour | Hex |
|---|---|---|
| Compute | Orange | `#ED7100` |
| Storage | Green | `#7AA116` |
| Database | Blue | `#2E73B8` |
| Network | Purple | `#8C4FFF` |
| Security | Red | `#DD344C` |
| Analytics | Blue (dark) | `#1A5276` |
| Integration | Pink | `#E7157B` |
| Management | Grey | `#E7157B` |
| AI/ML | Teal | `#01A88D` |

---

## MCP Tool Call Sequence

```
1. create-layer("Boundaries")
2. create-layer("Services")
3. create-layer("Connections")
4. set-active-layer("Boundaries")
5. add-rectangle(...)  ← outermost boundary (Region/Account)
6. add-rectangle(...)  ← VPC
7. add-rectangle(...)  ← Subnets / AZs
8. set-active-layer("Services")
9. add-shape(shape_name, x, y, 60, 60, "Service Name")  ← for each resource
10. set-active-layer("Connections")
11. add-edge(source_id, target_id, "label", style)       ← for each edge
12. set-data-attribute(cell_id, "arn", "...")            ← optional metadata
```

> **Important**: Record every cell ID returned by `add-rectangle`, `add-shape`, and `add-edge` — you need them for subsequent edge and metadata calls.

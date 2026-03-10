import type { ResourceEdge } from '../graph/types.js';

export const DRAWIO_STYLES = {
  vpc:             'rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=#E8F5E9;strokeColor=#4CAF50;fontStyle=1;verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;container=1;collapsible=0;',
  subnet_public:   'rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#E3F2FD;strokeColor=#2196F3;container=1;collapsible=0;verticalAlign=top;',
  subnet_private:  'rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#FFF3E0;strokeColor=#FF9800;container=1;collapsible=0;verticalAlign=top;',
  availability_zone: 'rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=#F5F5F5;strokeColor=#9E9E9E;container=1;collapsible=0;',
  account:         'rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=12 6;fillColor=#FAFAFA;strokeColor=#424242;fontStyle=1;fontSize=14;verticalAlign=top;container=1;collapsible=0;',
  region:          'rounded=1;whiteSpace=wrap;html=1;dashed=0;fillColor=#F0F4FF;strokeColor=#3F51B5;fontStyle=1;verticalAlign=top;container=1;collapsible=0;',
  edge_https:      'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#1976D2;strokeWidth=2;',
  edge_event:      'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#F57C00;strokeWidth=2;dashed=1;dashPattern=8 4;',
  edge_data:       'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#388E3C;strokeWidth=2;',
  edge_monitor:    'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#9C27B0;strokeWidth=1;dashed=1;',
  edge_inferred:   'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;strokeColor=#9E9E9E;strokeWidth=1;dashed=1;dashPattern=3 3;',
  aws_node: (shapeName: string) =>
    `shape=${shapeName};html=1;pointerEvents=1;dashed=0;fillColor=#FF9900;strokeColor=none;sketch=0;aspect=fixed;`,
} as const;

export function getEdgeStyle(edge: ResourceEdge): string {
  if (edge.inferred) return DRAWIO_STYLES.edge_inferred;
  switch (edge.edgeType) {
    case 'triggers':
    case 'publishes':
    case 'subscribes': return DRAWIO_STYLES.edge_event;
    case 'reads':
    case 'writes':
    case 'caches':     return DRAWIO_STYLES.edge_data;
    case 'monitors':   return DRAWIO_STYLES.edge_monitor;
    default:           return DRAWIO_STYLES.edge_https;
  }
}

export function getBoundaryStyle(type: string): string {
  switch (type) {
    case 'vpc':               return DRAWIO_STYLES.vpc;
    case 'subnet':            return DRAWIO_STYLES.subnet_private;
    case 'availability-zone': return DRAWIO_STYLES.availability_zone;
    case 'account':           return DRAWIO_STYLES.account;
    case 'region':            return DRAWIO_STYLES.region;
    default:                  return DRAWIO_STYLES.subnet_private;
  }
}

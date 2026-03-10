import type { ArchitectureGraph } from '../graph/types.js';
import type { LayoutResult } from './layout-engine.js';
import type { DiagramStyle } from './translator-registry.js';
import { getAwsShape } from './aws-shape-map.js';

interface SujimoshiNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: string;
}

interface SujimoshiLink {
  source: string;
  target: string;
  label: string;
}

export interface SujimoshiPayload {
  file_path: string;
  add_nodes: { file_path: string; nodes: SujimoshiNode[] };
  link_nodes: { file_path: string; links: SujimoshiLink[] };
}

export function buildSujimoshiPayload(
  graph: ArchitectureGraph,
  layout: LayoutResult,
  style: DiagramStyle,
  outputPath = 'architecture.drawio.svg'
): SujimoshiPayload {
  const filteredNodes = graph.nodes.filter(n => {
    if (style === 'minimal' && (n.tier === 'monitoring' || n.service === 'iam')) return false;
    return true;
  });

  const nodes: SujimoshiNode[] = filteredNodes.map(node => {
    const pos = layout.nodePositions.get(node.id) ?? { x: 100, y: 100, width: 60, height: 60 };
    const shapeName = getAwsShape(node.service);
    return {
      id: node.id,
      label: node.name,
      type: 'rectangle',
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      style: `shape=${shapeName};html=1;fillColor=#FF9900;strokeColor=none;aspect=fixed;`,
    };
  });

  // Add boundary rectangles as nodes too
  for (const boundary of graph.boundaries) {
    const pos = layout.boundaryPositions.get(boundary.id);
    if (!pos) continue;
    nodes.unshift({
      id: boundary.id,
      label: boundary.label,
      type: 'rectangle',
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      style: 'rounded=1;dashed=1;fillColor=#E8F5E9;strokeColor=#4CAF50;container=1;collapsible=0;',
    });
  }

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const links: SujimoshiLink[] = graph.edges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => ({ source: e.source, target: e.target, label: e.label ?? '' }));

  return {
    file_path: outputPath,
    add_nodes: { file_path: outputPath, nodes },
    link_nodes: { file_path: outputPath, links },
  };
}

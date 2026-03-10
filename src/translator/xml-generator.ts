import type { ArchitectureGraph } from '../graph/types.js';
import type { LayoutResult } from './layout-engine.js';
import type { DiagramStyle } from './translator-registry.js';
import { getAwsShape } from './aws-shape-map.js';
import { getEdgeStyle, getBoundaryStyle } from './drawio-styles.js';

let idCounter = 2;
function nextId(): string { return String(idCounter++); }

/**
 * Generates a complete mxGraph XML string from an ArchitectureGraph.
 * Compatible with @drawio/mcp (official jgraph) open_drawio_xml tool.
 */
export function generateMxGraphXml(
  graph: ArchitectureGraph,
  layout: LayoutResult,
  style: DiagramStyle
): string {
  idCounter = 2;
  const cellLines: string[] = [];
  const cellIds = new Map<string, string>();

  // Escape XML special chars
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Add boundary containers
  for (const boundary of graph.boundaries) {
    const pos = layout.boundaryPositions.get(boundary.id);
    if (!pos) continue;
    const id = nextId();
    cellIds.set(boundary.id, id);
    const boundaryStyle = getBoundaryStyle(boundary.type);
    cellLines.push(
      `      <mxCell id="${id}" value="${esc(boundary.label)}" style="${esc(boundaryStyle)}" vertex="1" parent="1">` +
      `<mxGeometry x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" as="geometry"/></mxCell>`
    );
  }

  // Add nodes
  const filteredNodes = graph.nodes.filter(n => {
    if (style === 'minimal' && (n.tier === 'monitoring' || n.service === 'iam')) return false;
    return true;
  });

  for (const node of filteredNodes) {
    const pos = layout.nodePositions.get(node.id);
    if (!pos) continue;
    const id = nextId();
    cellIds.set(node.id, id);
    const shapeName = getAwsShape(node.service);
    const nodeStyle = `shape=${shapeName};html=1;pointerEvents=1;dashed=0;fillColor=#FF9900;strokeColor=none;sketch=0;aspect=fixed;`;
    // Find parent boundary
    const parentBoundary = graph.boundaries.find(b => b.children.includes(node.id));
    const parentId = parentBoundary ? (cellIds.get(parentBoundary.id) ?? '1') : '1';
    cellLines.push(
      `      <mxCell id="${id}" value="${esc(node.name)}" style="${esc(nodeStyle)}" vertex="1" parent="${parentId}">` +
      `<mxGeometry x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" as="geometry"/></mxCell>`
    );
  }

  // Add edges
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const sourceCellId = cellIds.get(edge.source);
    const targetCellId = cellIds.get(edge.target);
    if (!sourceCellId || !targetCellId) continue;
    const edgeStyle = getEdgeStyle(edge);
    const edgeId = nextId();
    cellLines.push(
      `      <mxCell id="${edgeId}" value="${esc(edge.label ?? '')}" style="${esc(edgeStyle)}" edge="1" source="${sourceCellId}" target="${targetCellId}" parent="1">` +
      `<mxGeometry relative="1" as="geometry"/></mxCell>`
    );
  }

  return [
    `<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${layout.canvasWidth}" pageHeight="${layout.canvasHeight}" math="0" shadow="0">`,
    `  <root>`,
    `    <mxCell id="0"/>`,
    `    <mxCell id="1" parent="0"/>`,
    ...cellLines,
    `  </root>`,
    `</mxGraphModel>`,
  ].join('\n');
}

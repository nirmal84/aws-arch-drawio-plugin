import type { ArchitectureGraph } from '../graph/types.js';
import type { LayoutResult } from './layout-engine.js';
import type { DiagramStyle } from './translator-registry.js';
import { getAwsShape } from './aws-shape-map.js';
import { getEdgeStyle, getBoundaryStyle } from './drawio-styles.js';

export interface DrawioToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export function buildLgazoPayload(
  graph: ArchitectureGraph,
  layout: LayoutResult,
  style: DiagramStyle,
  useLayers = true
): DrawioToolCall[] {
  const calls: DrawioToolCall[] = [];
  const cellIds = new Map<string, string>(); // nodeId → draw.io cellId
  let idCounter = 100;
  const nextId = () => `cell-${idCounter++}`;

  // Step 1: Create layers
  if (useLayers) {
    calls.push({ tool: 'create-layer', args: { name: 'Boundaries' } });
    calls.push({ tool: 'create-layer', args: { name: 'Services' } });
    calls.push({ tool: 'create-layer', args: { name: 'Connections' } });
    calls.push({ tool: 'set-active-layer', args: { name: 'Boundaries' } });
  }

  // Step 2: Draw boundary containers (outermost first: account > region > vpc > subnet > az)
  const boundaryOrder = ['account', 'region', 'vpc', 'subnet', 'availability-zone', 'security-group'];
  const sortedBoundaries = [...graph.boundaries].sort((a, b) =>
    (boundaryOrder.indexOf(a.type) - boundaryOrder.indexOf(b.type))
  );

  for (const boundary of sortedBoundaries) {
    const pos = layout.boundaryPositions.get(boundary.id);
    if (!pos) continue;
    const cellId = nextId();
    cellIds.set(boundary.id, cellId);
    calls.push({
      tool: 'add-rectangle',
      args: {
        id: cellId,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        text: boundary.label,
        style: getBoundaryStyle(boundary.type),
      },
    });
  }

  // Step 3: Place AWS service nodes
  if (useLayers) {
    calls.push({ tool: 'set-active-layer', args: { name: 'Services' } });
  }

  const filteredNodes = graph.nodes.filter(n => {
    if (style === 'minimal' && (n.tier === 'monitoring' || n.service === 'iam')) return false;
    return true;
  });

  for (const node of filteredNodes) {
    const pos = layout.nodePositions.get(node.id);
    if (!pos) continue;
    const cellId = nextId();
    cellIds.set(node.id, cellId);
    const shapeName = getAwsShape(node.service);
    calls.push({
      tool: 'add-shape',
      args: {
        id: cellId,
        shape_name: shapeName,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        text: node.name,
        style: `shape=${shapeName};html=1;pointerEvents=1;dashed=0;fillColor=#FF9900;strokeColor=none;sketch=0;aspect=fixed;`,
      },
    });
  }

  // Step 4: Draw edges/connections
  if (useLayers) {
    calls.push({ tool: 'set-active-layer', args: { name: 'Connections' } });
  }

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const sourceCellId = cellIds.get(edge.source);
    const targetCellId = cellIds.get(edge.target);
    if (!sourceCellId || !targetCellId) continue;

    calls.push({
      tool: 'add-edge',
      args: {
        source: sourceCellId,
        target: targetCellId,
        text: edge.label ?? '',
        style: getEdgeStyle(edge),
      },
    });
  }

  // Step 5: Set metadata on key nodes
  if (style === 'detailed') {
    for (const node of filteredNodes) {
      const cellId = cellIds.get(node.id);
      if (!cellId) continue;
      if (node.arn) {
        calls.push({ tool: 'set-data-attribute', args: { id: cellId, key: 'arn', value: node.arn } });
      }
      calls.push({ tool: 'set-data-attribute', args: { id: cellId, key: 'service', value: node.service } });
      if (node.driftStatus) {
        calls.push({ tool: 'set-data-attribute', args: { id: cellId, key: 'drift', value: node.driftStatus } });
      }
    }
  }

  return calls;
}

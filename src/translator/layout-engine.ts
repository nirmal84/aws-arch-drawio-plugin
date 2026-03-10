import type { ArchitectureGraph } from '../graph/types.js';

export interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  boundaryPadding: number;
  tierSpacing: number;
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodePositions: Map<string, NodePosition>;
  boundaryPositions: Map<string, NodePosition>;
  canvasWidth: number;
  canvasHeight: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  canvasWidth: 1400,
  canvasHeight: 900,
  nodeWidth: 60,
  nodeHeight: 60,
  horizontalGap: 100,
  verticalGap: 80,
  boundaryPadding: 40,
  tierSpacing: 180,
};

const TIER_ORDER = ['external', 'edge', 'compute', 'integration', 'data', 'monitoring'];

export function calculateLayout(graph: ArchitectureGraph, config?: Partial<LayoutConfig>): LayoutResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const nodePositions = new Map<string, NodePosition>();
  const boundaryPositions = new Map<string, NodePosition>();

  // Group nodes by tier
  const tierGroups = new Map<string, typeof graph.nodes>();
  for (const node of graph.nodes) {
    const tier = node.tier ?? 'compute';
    const list = tierGroups.get(tier) ?? [];
    list.push(node);
    tierGroups.set(tier, list);
  }

  // Assign x positions per tier (column-based left-to-right layout)
  const tierX: Record<string, number> = {};
  let currentX = 80;
  for (const tier of TIER_ORDER) {
    if (tierGroups.has(tier)) {
      tierX[tier] = currentX;
      currentX += cfg.tierSpacing;
    }
  }

  // Position each node within its tier column
  const tierCurrentY: Record<string, number> = {};
  for (const [tier, nodes] of tierGroups.entries()) {
    const x = tierX[tier] ?? currentX;
    let y = 80;
    for (const node of nodes) {
      nodePositions.set(node.id, { x, y, width: cfg.nodeWidth, height: cfg.nodeHeight });
      tierCurrentY[tier] = y;
      y += cfg.nodeHeight + cfg.verticalGap;
    }
  }

  // Position boundaries to enclose their children
  for (const boundary of graph.boundaries) {
    const childPositions = boundary.children
      .map(id => nodePositions.get(id))
      .filter((p): p is NodePosition => p !== undefined);

    if (childPositions.length === 0) continue;

    const minX = Math.min(...childPositions.map(p => p.x)) - cfg.boundaryPadding;
    const minY = Math.min(...childPositions.map(p => p.y)) - cfg.boundaryPadding - 20; // header space
    const maxX = Math.max(...childPositions.map(p => p.x + p.width)) + cfg.boundaryPadding;
    const maxY = Math.max(...childPositions.map(p => p.y + p.height)) + cfg.boundaryPadding;

    boundaryPositions.set(boundary.id, {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  const maxX = currentX + 100;
  const allY = [...nodePositions.values()].map(p => p.y + p.height);
  const maxY = allY.length > 0 ? Math.max(...allY) + 80 : cfg.canvasHeight;

  return {
    nodePositions,
    boundaryPositions,
    canvasWidth: Math.max(maxX, cfg.canvasWidth),
    canvasHeight: Math.max(maxY, cfg.canvasHeight),
  };
}

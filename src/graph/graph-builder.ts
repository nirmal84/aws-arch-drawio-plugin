import type { ArchitectureGraph, AwsResourceNode, ResourceEdge, BoundaryGroup } from './types.js';

export function buildGraph(
  partials: Partial<ArchitectureGraph>[],
  metadata: ArchitectureGraph['metadata']
): ArchitectureGraph {
  const nodeMap = new Map<string, AwsResourceNode>();
  const edgeSet = new Set<string>();
  const edges: ResourceEdge[] = [];
  const boundaryMap = new Map<string, BoundaryGroup>();

  for (const p of partials) {
    for (const n of p.nodes ?? []) {
      if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
      else {
        // Merge properties from duplicate nodes
        const existing = nodeMap.get(n.id)!;
        nodeMap.set(n.id, { ...existing, ...n, properties: { ...existing.properties, ...n.properties } });
      }
    }
    for (const e of p.edges ?? []) {
      const key = `${e.source}->${e.target}:${e.edgeType}`;
      if (!edgeSet.has(key)) { edgeSet.add(key); edges.push(e); }
    }
    for (const b of p.boundaries ?? []) {
      if (!boundaryMap.has(b.id)) boundaryMap.set(b.id, b);
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
    boundaries: Array.from(boundaryMap.values()),
    metadata,
  };
}

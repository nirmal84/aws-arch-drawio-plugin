import type { ArchitectureGraph, BoundaryGroup } from './types.js';

export function detectBoundaries(graph: ArchitectureGraph): ArchitectureGraph {
  if (graph.boundaries.length > 0) return graph; // Already detected

  const vpcMap = new Map<string, string[]>();
  const subnetMap = new Map<string, string[]>();

  for (const node of graph.nodes) {
    if (node.vpc) {
      const list = vpcMap.get(node.vpc) ?? [];
      list.push(node.id);
      vpcMap.set(node.vpc, list);
    }
    if (node.subnet) {
      const list = subnetMap.get(node.subnet) ?? [];
      list.push(node.id);
      subnetMap.set(node.subnet, list);
    }
  }

  const boundaries: BoundaryGroup[] = [];

  for (const [vpcId, children] of vpcMap.entries()) {
    boundaries.push({ id: `vpc-${vpcId}`, type: 'vpc', label: `VPC: ${vpcId}`, children });
  }
  for (const [subnetId, children] of subnetMap.entries()) {
    boundaries.push({ id: `subnet-${subnetId}`, type: 'subnet', label: `Subnet: ${subnetId}`, children });
  }

  return { ...graph, boundaries: [...graph.boundaries, ...boundaries] };
}

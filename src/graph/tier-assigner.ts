import type { ArchitectureGraph } from './types.js';
import { getServiceMetadata } from '../catalog/aws-services.js';

export function assignTiers(graph: ArchitectureGraph): ArchitectureGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(node => {
      const meta = getServiceMetadata(node.service);
      return { ...node, tier: node.tier ?? meta.tier, techLabel: node.techLabel ?? meta.techLabel };
    }),
  };
}

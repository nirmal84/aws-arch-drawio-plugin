import type { IaCParser } from './types.js';
import type { ArchitectureGraph, AwsResourceNode, ResourceEdge, BoundaryGroup } from '../graph/types.js';
import type { ScanResult } from '../scanner/scanner.js';
import { CloudFormationParser } from './cloudformation-parser.js';
import { SamParser } from './sam-parser.js';
import { CdkParser } from './cdk-parser.js';
import { TerraformParser } from './terraform-parser.js';
import { logger } from '../utils/logger.js';

export class ParserRegistry {
  private parsers: IaCParser[] = [
    new SamParser(),          // SAM before CFN (SAM is CFN superset)
    new CloudFormationParser(),
    new CdkParser(),
    new TerraformParser(),
  ];

  register(parser: IaCParser): void {
    this.parsers.push(parser);
  }

  async parseAll(scanResult: ScanResult, rootDir: string): Promise<ArchitectureGraph> {
    const partials: Partial<ArchitectureGraph>[] = [];
    const sources: string[] = [];

    for (const parser of this.parsers) {
      if (!parser.detect(scanResult.allFiles)) continue;
      logger.info(`Running parser: ${parser.name}`);
      try {
        const partial = await parser.parse(scanResult.allFiles, rootDir);
        partials.push(partial);
        sources.push(parser.name);
      } catch (err) {
        logger.warn(`Parser ${parser.name} failed`, err);
      }
    }

    return mergePartials(partials, sources.join('+'));
  }
}

function mergePartials(partials: Partial<ArchitectureGraph>[], source: string): ArchitectureGraph {
  const nodeMap = new Map<string, AwsResourceNode>();
  const edgeSet = new Set<string>();
  const edges: ResourceEdge[] = [];
  const boundaryMap = new Map<string, BoundaryGroup>();
  const parsedFiles: string[] = [];

  for (const p of partials) {
    for (const n of p.nodes ?? []) {
      if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
    }
    for (const e of p.edges ?? []) {
      const key = `${e.source}->${e.target}:${e.edgeType}`;
      if (!edgeSet.has(key)) { edgeSet.add(key); edges.push(e); }
    }
    for (const b of p.boundaries ?? []) {
      if (!boundaryMap.has(b.id)) boundaryMap.set(b.id, b);
    }
    parsedFiles.push(...(p.metadata?.parsedFiles ?? []));
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
    boundaries: Array.from(boundaryMap.values()),
    metadata: {
      source,
      parsedFiles: [...new Set(parsedFiles)],
      generatedAt: new Date().toISOString(),
      liveMode: false,
    },
  };
}

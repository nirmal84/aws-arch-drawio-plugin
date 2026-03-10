import { resolve } from 'path';
import { scanProject } from '../scanner/scanner.js';
import { ParserRegistry } from '../parsers/parser-registry.js';
import { inferRelationships } from '../graph/relationship-inferrer.js';
import { detectBoundaries } from '../graph/boundary-detector.js';
import { assignTiers } from '../graph/tier-assigner.js';
import { translate, type DrawioBackend, type DiagramStyle } from '../translator/translator-registry.js';
import { logger } from '../utils/logger.js';

export interface DiagramCommandOptions {
  file?: string;
  style?: DiagramStyle;
  live?: boolean;
  profile?: string;
  region?: string;
  update?: string;
  export?: string;
  backend?: DrawioBackend;
  layers?: boolean;
  awsIcons?: boolean;
}

export async function runDiagramCommand(rootDir: string, options: DiagramCommandOptions = {}): Promise<string> {
  const resolvedRoot = resolve(rootDir);
  const style = options.style ?? 'standard';
  const backend = options.backend ?? 'lgazo';
  const outputFile = options.file ?? 'architecture.drawio';

  logger.info('Starting Draw.io diagram generation', { rootDir: resolvedRoot, style, backend });

  // Stage 1: Scan
  const scanResult = await scanProject(resolvedRoot);
  logger.info('Scan complete', { frameworks: scanResult.frameworks, fileCount: scanResult.allFiles.length });

  if (scanResult.frameworks.includes('unknown') || scanResult.allFiles.length === 0) {
    return 'No AWS IaC files detected. Ensure you have CloudFormation, CDK, Terraform, or SAM files.';
  }

  // Stage 2: Parse
  const registry = new ParserRegistry();
  let graph = await registry.parseAll(scanResult, resolvedRoot);
  logger.info('Parse complete', { nodes: graph.nodes.length, edges: graph.edges.length });

  if (graph.nodes.length === 0) {
    return 'No AWS resources found in the detected IaC files.';
  }

  // Stage 3: Infer relationships
  graph = inferRelationships(graph);

  // Stage 4: Detect boundaries
  graph = detectBoundaries(graph);

  // Stage 5: Assign tiers
  graph = assignTiers(graph);

  logger.info('Graph built', { nodes: graph.nodes.length, edges: graph.edges.length });

  // Stage 6: Translate to Draw.io MCP payload
  const payload = translate(graph, backend, style, {
    outputPath: outputFile,
    useLayers: options.layers ?? true,
    useAwsIcons: options.awsIcons ?? true,
  });

  const services = [...new Set(graph.nodes.map(n => n.service))].sort();
  const inferred = graph.edges.filter(e => e.inferred).length;
  const explicit = graph.edges.filter(e => !e.inferred).length;

  let nextStepText = '';
  if (backend === 'lgazo') {
    nextStepText = 'Execute the **tool_calls** array sequentially against the **drawio-mcp-server**.';
  } else if (backend === 'sujimoshi') {
    nextStepText = 'Call **new_diagram**, then **add_nodes**, then **link_nodes** on the drawio-mcp server.';
  } else if (backend === 'official') {
    nextStepText = 'Call **open_drawio_xml** on the @drawio/mcp server with the XML payload.';
  }

  return [
    `## AWS Architecture Diagram — Draw.io`,
    ``,
    `**Detected Frameworks:** ${scanResult.frameworks.join(', ')}`,
    `**Resources:** ${graph.nodes.length} nodes (${services.join(', ')})`,
    `**Connections:** ${explicit} explicit + ${inferred} inferred = ${graph.edges.length} total`,
    `**Boundaries:** ${graph.boundaries.length} VPC/subnet groups`,
    `**Backend:** ${backend} | **Output:** \`${outputFile}\``,
    ``,
    `### Next Step: Call the Draw.io MCP`,
    ``,
    nextStepText,
    ``,
    `\`\`\`json`,
    payload,
    `\`\`\``,
  ].join('\n');
}

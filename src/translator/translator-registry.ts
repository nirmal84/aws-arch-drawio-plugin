import type { ArchitectureGraph } from '../graph/types.js';
import { calculateLayout } from './layout-engine.js';
import { buildLgazoPayload } from './lgazo-translator.js';
import { generateMxGraphXml } from './xml-generator.js';
import { buildSujimoshiPayload } from './sujimoshi-translator.js';

export type DrawioBackend = 'lgazo' | 'sujimoshi' | 'official';
export type DiagramStyle = 'minimal' | 'standard' | 'detailed';

export interface TranslatorOptions {
  outputPath?: string;
  useLayers?: boolean;
  useAwsIcons?: boolean;
}

export function translate(
  graph: ArchitectureGraph,
  backend: DrawioBackend = 'lgazo',
  style: DiagramStyle = 'standard',
  options: TranslatorOptions = {}
): string {
  const layout = calculateLayout(graph);
  const outputPath = options.outputPath ?? 'architecture.drawio';

  if (backend === 'lgazo') {
    const calls = buildLgazoPayload(graph, layout, style, options.useLayers ?? true);
    return JSON.stringify({ backend: 'lgazo', tool_calls: calls }, null, 2);
  }

  if (backend === 'sujimoshi') {
    const payload = buildSujimoshiPayload(graph, layout, style, outputPath);
    return JSON.stringify({ backend: 'sujimoshi', ...payload }, null, 2);
  }

  if (backend === 'official') {
    const xml = generateMxGraphXml(graph, layout, style);
    return JSON.stringify({ backend: 'official', tool: 'open_drawio_xml', args: { xml } }, null, 2);
  }

  return JSON.stringify({ error: `Unknown backend: ${backend}` });
}

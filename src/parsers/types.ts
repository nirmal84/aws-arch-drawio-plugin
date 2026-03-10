import type { ArchitectureGraph } from '../graph/types.js';

export interface IaCParser {
  name: string;
  detect(files: string[]): boolean;
  parse(files: string[], rootDir: string): Promise<Partial<ArchitectureGraph>>;
}

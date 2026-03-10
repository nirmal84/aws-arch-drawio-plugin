import { glob } from 'glob';
import { detectFrameworks, type IaCFramework } from './framework-detector.js';
import { logger } from '../utils/logger.js';

export interface ScanOptions {
  scanDirs?: string[];
  excludeDirs?: string[];
}

export interface ScanResult {
  frameworks: IaCFramework[];
  files: Record<string, string[]>;
  allFiles: string[];
}

const DEFAULT_EXCLUDE = ['node_modules', '.aws-sam', 'cdk.out', 'dist', '.git', '.terraform', '__pycache__'];

export async function scanProject(rootDir: string, options?: ScanOptions): Promise<ScanResult> {
  const excludeDirs = options?.excludeDirs ?? DEFAULT_EXCLUDE;
  const ignorePatterns = excludeDirs.map(d => `**/${d}/**`);

  const allFiles = await glob('**/*.{yaml,yml,json,tf,ts,py,js}', {
    cwd: rootDir,
    absolute: true,
    ignore: ignorePatterns,
    nodir: true,
  });

  logger.debug('Scanned files', { count: allFiles.length, rootDir });

  const frameworks = detectFrameworks(allFiles);
  const filesByFramework: Record<string, string[]> = {};

  for (const fw of frameworks) {
    filesByFramework[fw] = allFiles.filter(f => {
      switch (fw) {
        case 'terraform':  return f.endsWith('.tf') || f.endsWith('.tf.json');
        case 'serverless': return f.endsWith('serverless.yml') || f.endsWith('serverless.yaml');
        case 'sam':        return f.includes('template') && (f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'));
        case 'cloudformation': return f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json');
        case 'cdk':        return f.endsWith('.ts') || f.endsWith('.py') || f.endsWith('.js');
        default:           return false;
      }
    });
  }

  return { frameworks, files: filesByFramework, allFiles };
}

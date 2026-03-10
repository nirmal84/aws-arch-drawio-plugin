import type { IaCParser } from './types.js';
import type { ArchitectureGraph } from '../graph/types.js';
import { isSamTemplate } from '../scanner/framework-detector.js';
import { CloudFormationParser } from './cloudformation-parser.js';

// SAM templates are CloudFormation with a Transform.
// The CloudFormation parser already handles SAM resource types.
// This parser wraps CFN parser, scoped to SAM templates.
export class SamParser implements IaCParser {
  name = 'sam';
  private cfnParser = new CloudFormationParser();

  detect(files: string[]): boolean {
    return files.some(f => isSamTemplate(f));
  }

  async parse(files: string[], rootDir: string): Promise<Partial<ArchitectureGraph>> {
    const samFiles = files.filter(f => isSamTemplate(f));
    const result = await this.cfnParser.parse(samFiles, rootDir);
    if (result.metadata) {
      result.metadata.source = 'sam';
    }
    return result;
  }
}

import { readFileSync } from 'fs';
import { basename } from 'path';

export type IaCFramework = 'cloudformation' | 'cdk' | 'terraform' | 'sam' | 'serverless' | 'unknown';

function readSafe(filePath: string): string {
  try { return readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

export function isCfnFile(filePath: string, content?: string): boolean {
  const name = basename(filePath).toLowerCase();
  if (name.endsWith('.template.yaml') || name.endsWith('.template.json') || name === 'template.yaml' || name === 'template.json') {
    const body = content ?? readSafe(filePath);
    return body.includes('AWSTemplateFormatVersion') || body.includes('Resources:') || body.includes('"Resources"');
  }
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml') || filePath.endsWith('.json')) {
    const body = content ?? readSafe(filePath);
    return body.includes('AWSTemplateFormatVersion');
  }
  return false;
}

export function isSamTemplate(filePath: string, content?: string): boolean {
  const body = content ?? readSafe(filePath);
  return isCfnFile(filePath, body) && body.includes('Transform: AWS::Serverless') || body.includes('AWS::Serverless::Function');
}

export function isTerraformFile(filePath: string): boolean {
  return filePath.endsWith('.tf') || filePath.endsWith('.tf.json');
}

export function isServerlessConfig(filePath: string, content?: string): boolean {
  const name = basename(filePath);
  if (name !== 'serverless.yml' && name !== 'serverless.yaml' && name !== 'serverless.json') return false;
  const body = content ?? readSafe(filePath);
  return body.includes('provider:') && body.includes('aws');
}

export function isCdkProject(files: string[]): boolean {
  return files.some(f => {
    if (basename(f) === 'cdk.json') return true;
    if (basename(f) === 'package.json') {
      const content = readSafe(f);
      return content.includes('aws-cdk-lib') || content.includes('aws-cdk');
    }
    return false;
  });
}

export function detectFrameworks(files: string[]): IaCFramework[] {
  const detected = new Set<IaCFramework>();
  for (const f of files) {
    if (isTerraformFile(f)) { detected.add('terraform'); continue; }
    if (isServerlessConfig(f)) { detected.add('serverless'); continue; }
    if (isSamTemplate(f)) { detected.add('sam'); continue; }
    if (isCfnFile(f)) { detected.add('cloudformation'); continue; }
  }
  if (isCdkProject(files)) detected.add('cdk');
  return detected.size > 0 ? Array.from(detected) : ['unknown'];
}

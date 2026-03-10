import yaml from 'js-yaml';
import { readFileSync } from 'fs';

export function parseYaml(content: string): unknown {
  try {
    return yaml.load(content);
  } catch {
    return null;
  }
}

export function parseYamlFile(filePath: string): unknown {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseYaml(content);
  } catch {
    return null;
  }
}

export function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function parseJsonFile(filePath: string): unknown {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseJson(content);
  } catch {
    return null;
  }
}

export function parseTemplate(filePath: string): unknown {
  if (filePath.endsWith('.json')) return parseJsonFile(filePath);
  return parseYamlFile(filePath);
}

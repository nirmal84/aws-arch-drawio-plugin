import yaml from 'js-yaml';
import { readFileSync } from 'fs';

// CloudFormation custom tag schema so !Ref / !Sub / !GetAtt etc. don't crash js-yaml.
// Without this, real-world CFn templates fail to parse and the diagram is empty.
const cfnTagNames = [
  'Ref', 'Sub', 'GetAtt', 'Join', 'Select', 'Split', 'Equals', 'If', 'Not',
  'And', 'Or', 'Base64', 'FindInMap', 'ImportValue', 'Cidr', 'Transform', 'GetAZs', 'Condition',
] as const;

const cfnTypes: yaml.Type[] = [];
for (const name of cfnTagNames) {
  for (const kind of ['scalar', 'sequence', 'mapping'] as const) {
    cfnTypes.push(new yaml.Type('!' + name, {
      kind,
      multi: false,
      construct: (data: unknown) => {
        if (name === 'GetAtt' && typeof data === 'string') {
          return { 'Fn::GetAtt': data.split('.') };
        }
        if (name === 'Ref') return { Ref: data };
        return { ['Fn::' + name]: data };
      },
    }));
  }
}
const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTypes);

export function parseYaml(content: string): unknown {
  try {
    return yaml.load(content, { schema: CFN_SCHEMA });
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

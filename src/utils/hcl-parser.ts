export interface TerraformResource {
  type: string;
  name: string;
  attributes: Record<string, string | boolean | number>;
}

const RESOURCE_RE = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gm;
const ATTR_RE = /^\s*(\w+)\s*=\s*"?([^"\n]+)"?\s*$/;

export function parseHcl(content: string): TerraformResource[] {
  const resources: TerraformResource[] = [];
  let match: RegExpExecArray | null;
  while ((match = RESOURCE_RE.exec(content)) !== null) {
    const [, type, name, body] = match;
    const attributes: Record<string, string | boolean | number> = {};
    for (const line of (body ?? '').split('\n')) {
      const attrMatch = ATTR_RE.exec(line);
      if (attrMatch) {
        const [, key, val] = attrMatch;
        if (val === 'true') attributes[key] = true;
        else if (val === 'false') attributes[key] = false;
        else if (!isNaN(Number(val))) attributes[key] = Number(val);
        else attributes[key] = val.trim();
      }
    }
    resources.push({ type: type ?? '', name: name ?? '', attributes });
  }
  return resources;
}

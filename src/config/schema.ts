import { z } from 'zod';

export const configSchema = z.object({
  drawioMcp: z.enum(['lgazo', 'sujimoshi', 'official']).optional(),
  defaultStyle: z.enum(['minimal', 'standard', 'detailed']).optional(),
  output: z.string().optional(),
  useLayers: z.boolean().optional(),
  useAwsIcons: z.boolean().optional(),
  exportFormats: z.array(z.string()).optional(),
  parsers: z.object({
    enabled: z.array(z.string()).optional(),
    scanDirs: z.array(z.string()).optional(),
    excludeDirs: z.array(z.string()).optional(),
  }).optional(),
  diagram: z.object({
    showMonitoring: z.boolean().optional(),
    showIam: z.boolean().optional(),
    showVpcBoundaries: z.boolean().optional(),
    maxNodes: z.number().optional(),
  }).optional(),
  live: z.object({
    profile: z.string().optional(),
    region: z.string().optional(),
    stacks: z.array(z.string()).optional(),
  }).optional(),
});

export type PluginConfig = z.infer<typeof configSchema>;

export function parseConfig(raw: unknown): PluginConfig {
  return configSchema.parse(raw);
}

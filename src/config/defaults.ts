export const DEFAULT_CONFIG = {
  drawioMcp: 'lgazo' as const,
  defaultStyle: 'standard' as const,
  output: 'architecture.drawio',
  useLayers: true,
  useAwsIcons: true,
  exportFormats: [] as string[],
  parsers: {
    enabled: ['cloudformation', 'cdk', 'terraform', 'sam', 'serverless'] as string[],
    scanDirs: ['.'],
    excludeDirs: ['node_modules', '.aws-sam', 'cdk.out', 'dist', '.git', '.terraform'],
  },
  inference: {
    iamPolicies: true,
    environmentVariables: true,
    eventSourceMappings: true,
    securityGroups: false,
    stepFunctionStates: true,
  },
  diagram: {
    showMonitoring: false,
    showIam: false,
    showVpcBoundaries: true,
    showAzBoundaries: false,
    maxNodes: 50,
    groupBy: 'service-tier' as const,
  },
};

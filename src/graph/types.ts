import type { AwsService, ResourceTier } from '../catalog/aws-services.js';

export type { ResourceTier };

export type EdgeType =
  | 'invokes'
  | 'reads'
  | 'writes'
  | 'triggers'
  | 'routes'
  | 'publishes'
  | 'subscribes'
  | 'connects'
  | 'authenticates'
  | 'caches'
  | 'monitors';

export type BoundaryType =
  | 'account'
  | 'region'
  | 'vpc'
  | 'subnet'
  | 'availability-zone'
  | 'security-group'
  | 'ecs-cluster'
  | 'step-function';

export interface AwsResourceNode {
  id: string;
  logicalId: string;
  service: string;
  resourceType: string;
  name: string;
  properties: Record<string, unknown>;
  // Topology
  region?: string;
  account?: string;
  vpc?: string;
  subnet?: string;
  availabilityZone?: string;
  securityGroups?: string[];
  // Diagram hints
  tier?: ResourceTier;
  techLabel?: string;
  // Live mode
  arn?: string;
  driftStatus?: 'IN_SYNC' | 'DRIFTED' | 'NOT_CHECKED';
  deployed?: boolean;
}

export interface ResourceEdge {
  source: string;
  target: string;
  edgeType: EdgeType;
  protocol?: string;
  label?: string;
  inferred?: boolean;
  inferenceSource?: string;
}

export interface BoundaryGroup {
  id: string;
  type: BoundaryType;
  label: string;
  children: string[];
  properties?: Record<string, string>;
}

export interface ArchitectureGraph {
  nodes: AwsResourceNode[];
  edges: ResourceEdge[];
  boundaries: BoundaryGroup[];
  metadata: {
    source: string;
    parsedFiles: string[];
    generatedAt: string;
    liveMode: boolean;
    region?: string;
    account?: string;
  };
}

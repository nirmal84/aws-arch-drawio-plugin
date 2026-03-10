import { describe, it, expect } from '@jest/globals';
import { generateMxGraphXml } from '../../src/translator/xml-generator.js';
import { calculateLayout } from '../../src/translator/layout-engine.js';
import type { ArchitectureGraph } from '../../src/graph/types.js';

function makeTestGraph(): ArchitectureGraph {
  return {
    nodes: [
      { id: 'api-gw', logicalId: 'RestApi', service: 'api-gateway', resourceType: 'AWS::ApiGateway::RestApi', name: 'Orders API', properties: {}, tier: 'edge', techLabel: 'API Gateway' },
      { id: 'order-fn', logicalId: 'OrderFn', service: 'lambda', resourceType: 'AWS::Lambda::Function', name: 'Order Handler', properties: {}, tier: 'compute', techLabel: 'Lambda' },
      { id: 'orders-table', logicalId: 'OrdersTable', service: 'dynamodb', resourceType: 'AWS::DynamoDB::Table', name: 'Orders Table', properties: {}, tier: 'data', techLabel: 'DynamoDB' },
    ],
    edges: [
      { source: 'api-gw', target: 'order-fn', edgeType: 'routes', label: 'POST /orders' },
      { source: 'order-fn', target: 'orders-table', edgeType: 'writes', label: 'PutItem' },
    ],
    boundaries: [],
    metadata: { source: 'cloudformation', parsedFiles: [], generatedAt: new Date().toISOString(), liveMode: false },
  };
}

describe('generateMxGraphXml', () => {
  const graph = makeTestGraph();
  const layout = calculateLayout(graph);
  const xml = generateMxGraphXml(graph, layout, 'standard');

  it('produces a string', () => {
    expect(typeof xml).toBe('string');
  });

  it('starts with mxGraphModel tag', () => {
    expect(xml.trim()).toMatch(/^<mxGraphModel/);
  });

  it('contains root mxCell id=0', () => {
    expect(xml).toContain('id="0"');
  });

  it('contains AWS shape references', () => {
    expect(xml).toContain('mxgraph.aws4');
  });

  it('contains Lambda shape', () => {
    expect(xml).toContain('mxgraph.aws4.lambda_function');
  });

  it('contains DynamoDB shape', () => {
    expect(xml).toContain('mxgraph.aws4.dynamodb');
  });

  it('contains API Gateway shape', () => {
    expect(xml).toContain('mxgraph.aws4.api_gateway');
  });

  it('contains edge connections', () => {
    expect(xml).toContain('edge="1"');
  });

  it('contains edge labels', () => {
    expect(xml).toContain('PutItem');
  });
});

describe('calculateLayout', () => {
  const graph = makeTestGraph();
  const layout = calculateLayout(graph);

  it('assigns positions to all nodes', () => {
    expect(layout.nodePositions.size).toBe(3);
  });

  it('assigns non-zero positions', () => {
    for (const [, pos] of layout.nodePositions) {
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    }
  });

  it('returns canvas dimensions', () => {
    expect(layout.canvasWidth).toBeGreaterThan(0);
    expect(layout.canvasHeight).toBeGreaterThan(0);
  });
});

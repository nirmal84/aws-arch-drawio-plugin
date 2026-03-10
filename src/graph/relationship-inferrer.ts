import type { ArchitectureGraph, AwsResourceNode, ResourceEdge } from "./types.js";

export function inferRelationships(
  graph: ArchitectureGraph,
  rawTemplates?: Record<string, unknown>
): ArchitectureGraph {
  const newEdges: ResourceEdge[] = [];
  const existingEdgeKeys = new Set(
    graph.edges.map((e) => `${e.source}→${e.target}→${e.edgeType}`)
  );

  function addEdge(edge: ResourceEdge) {
    const key = `${edge.source}→${edge.target}→${edge.edgeType}`;
    if (!existingEdgeKeys.has(key)) {
      existingEdgeKeys.add(key);
      newEdges.push(edge);
    }
  }

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const nodeByLogicalId = new Map(graph.nodes.map((n) => [n.logicalId, n]));

  for (const node of graph.nodes) {
    const props = node.properties as Record<string, unknown>;

    // Infer from environment variables
    if (node.service === "lambda" && props["Environment"]) {
      const env = (props["Environment"] as Record<string, unknown>)?.["Variables"] as Record<string, unknown> | undefined;
      if (env) {
        for (const [, value] of Object.entries(env)) {
          if (typeof value === "string") {
            // Look for Ref patterns: { Ref: LogicalId }
            const refMatch = value.match(/^\{"Ref":"([^"]+)"\}$/) || value.match(/Ref:\s*(\S+)/);
            if (refMatch) {
              const target = nodeByLogicalId.get(refMatch[1]);
              if (target && target.id !== node.id) {
                addEdge({
                  source: node.id,
                  target: target.id,
                  edgeType: target.service === "dynamodb" || target.service === "rds" || target.service === "s3" ? "reads" : "connects",
                  inferred: true,
                  inferenceSource: "env-var",
                });
              }
            }
          }
        }
      }
    }

    // Infer from IAM policies
    if (props["Policies"] || props["ManagedPolicyArns"]) {
      const policies = (props["Policies"] as Array<Record<string, unknown>>) ?? [];
      for (const policy of policies) {
        const statements = ((policy["PolicyDocument"] as Record<string, unknown>)?.["Statement"] as Array<Record<string, unknown>>) ?? [];
        for (const stmt of statements) {
          const actions = Array.isArray(stmt["Action"]) ? stmt["Action"] : [stmt["Action"]];
          const resources = Array.isArray(stmt["Resource"]) ? stmt["Resource"] : [stmt["Resource"]];

          for (const action of actions) {
            if (typeof action !== "string") continue;
            for (const resource of resources) {
              if (typeof resource !== "string") continue;

              // Find target node by ARN reference or logical ID
              for (const target of graph.nodes) {
                if (target.id === node.id) continue;
                const targetLogicalId = target.logicalId;
                if (resource.includes(targetLogicalId)) {
                  const edgeType = action.includes("Get") || action.includes("Query") || action.includes("Scan") || action.includes("List")
                    ? "reads"
                    : action.includes("Put") || action.includes("Create") || action.includes("Write") || action.includes("Delete")
                    ? "writes"
                    : "connects";
                  addEdge({
                    source: node.id,
                    target: target.id,
                    edgeType,
                    inferred: true,
                    inferenceSource: "iam-policy",
                  });
                }
              }
            }
          }
        }
      }
    }

    // Infer from Step Functions state machine
    if (node.service === "step-functions" && props["DefinitionString"]) {
      const defStr = props["DefinitionString"] as string;
      const arnMatches = defStr.matchAll(/"Resource"\s*:\s*"([^"]+)"/g);
      for (const match of arnMatches) {
        const arn = match[1];
        for (const target of graph.nodes) {
          if (target.id !== node.id && (arn.includes(target.logicalId) || arn.includes(target.name))) {
            addEdge({
              source: node.id,
              target: target.id,
              edgeType: "invokes",
              inferred: true,
              inferenceSource: "step-function-state",
            });
          }
        }
      }
    }
  }

  return { ...graph, edges: [...graph.edges, ...newEdges] };
}

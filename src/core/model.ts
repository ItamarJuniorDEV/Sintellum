import type { Evidence, SourceRange } from './evidence.ts';

export const confidenceValues = ['confirmed', 'probable', 'inferred', 'user_corrected'] as const;
export type Confidence = (typeof confidenceValues)[number];
export type ExplanationMode = 'simple' | 'normal' | 'technical';
export type FlowNodeKind = 'actor' | 'route' | 'request' | 'controller' | 'service' | 'model' | 'view' | 'database' | 'redirect' | 'decision' | 'generic';
export type FlowEdgeType = 'sequence' | 'call' | 'data' | 'success' | 'error' | 'render' | 'redirect';

export interface LogicalBlock {
  id: string;
  uri: string;
  range: SourceRange;
  kind: string;
  actor: string;
  action: string;
  input?: string;
  output?: string;
  why?: string;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  actor: string;
  action: string;
  input?: string;
  output?: string;
  why?: string;
  uri?: string;
  range?: SourceRange;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  type: FlowEdgeType;
  condition?: string;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface FlowGraph {
  schemaVersion: 1;
  id: string;
  rootUri: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  sourceHashes: Record<string, string>;
}

export interface AnalysisResult {
  rootUri: string;
  blocks: LogicalBlock[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  sourceHashes: Record<string, string>;
  facts?: unknown[];
}

export function validateFlowGraph(value: unknown): value is FlowGraph {
  if (!value || typeof value !== 'object') return false;
  const graph = value as Partial<FlowGraph>;
  if (graph.schemaVersion !== 1 || typeof graph.id !== 'string' || typeof graph.rootUri !== 'string') return false;
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !graph.sourceHashes || typeof graph.sourceHashes !== 'object') return false;
  return graph.nodes.every(node =>
    !!node && typeof node.id === 'string' && confidenceValues.includes(node.confidence) && Array.isArray(node.evidence) && node.evidence.length > 0
  ) && graph.edges.every(edge =>
    !!edge && typeof edge.id === 'string' && typeof edge.from === 'string' && typeof edge.to === 'string' && confidenceValues.includes(edge.confidence) && Array.isArray(edge.evidence)
  );
}

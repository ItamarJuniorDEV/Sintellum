import type { FlowGraph, FlowNode } from '../core/model.ts';

export interface UserCorrection {
  graphId: string;
  elementId: string;
  sourceHashes: Record<string, string>;
  patch: Partial<Pick<FlowNode, 'actor' | 'action' | 'input' | 'output' | 'why'>>;
}

function hashesMatch(expected: Record<string, string>, actual: Record<string, string>): boolean {
  return Object.entries(expected).every(([uri, hash]) => actual[uri] === hash);
}

export class CorrectionStore {
  private readonly corrections: UserCorrection[] = [];
  set(correction: UserCorrection): void {
    const index = this.corrections.findIndex(c => c.graphId === correction.graphId && c.elementId === correction.elementId);
    if (index >= 0) this.corrections[index] = correction; else this.corrections.push(correction);
  }
  async apply(graph: FlowGraph): Promise<FlowGraph> {
    const nodes = graph.nodes.map(node => {
      const correction = this.corrections.find(c => c.graphId === graph.id && c.elementId === node.id && hashesMatch(c.sourceHashes, graph.sourceHashes));
      return correction ? { ...node, ...correction.patch, confidence: 'user_corrected' as const } : { ...node };
    });
    return { ...graph, nodes, edges: graph.edges.map(edge => ({ ...edge })) };
  }
}

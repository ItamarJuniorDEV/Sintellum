import type { AnalysisResult, FlowGraph, FlowNode, FlowEdge } from '../core/model.ts';
import { stableHash } from '../core/hashing.ts';

export class FlowGraphBuilder {
  build(result: AnalysisResult, selectedBlockIds: string[]): FlowGraph {
    const selected = result.blocks.filter(block => selectedBlockIds.includes(block.id));
    const nodes: FlowNode[] = result.nodes.map(node => ({ ...node, evidence: [...node.evidence] }));
    const edges: FlowEdge[] = result.edges.map(edge => ({ ...edge, evidence: [...edge.evidence] }));

    for (const block of selected) {
      if (block.kind !== 'redirect') continue;
      const id = `redirect:${block.id}`;
      if (!nodes.some(node => node.id === id)) {
        nodes.push({ id, kind: 'redirect', actor: block.actor, action: block.action, input: block.input, output: block.output, why: block.why, uri: block.uri, range: block.range, confidence: block.confidence, evidence: [...block.evidence] });
        const previous = [...nodes].reverse().find(node => node.id !== id && node.kind !== 'route');
        if (previous) edges.push({ id: `${previous.id}->${id}`, from: previous.id, to: id, type: 'redirect', confidence: block.confidence, evidence: [...block.evidence] });
      }
    }

    const id = `flow-${stableHash(`${result.rootUri}:${selectedBlockIds.slice().sort().join(',')}`)}`;
    return { schemaVersion: 1, id, rootUri: result.rootUri, nodes, edges, sourceHashes: { ...result.sourceHashes } };
  }
}

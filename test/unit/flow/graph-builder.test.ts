import test from 'node:test';
import assert from 'node:assert/strict';
import { FlowGraphBuilder } from '../../../src/flow/FlowGraphBuilder.ts';

const evidence: any[] = [{ uri: 'file:///OrderController.php', range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } }, origin: 'ast' }];
const result: any = {
  rootUri: 'file:///OrderController.php', sourceHashes: { 'file:///OrderController.php': 'h1' },
  nodes: [
    { id: 'request:r', kind: 'request', actor: 'StoreOrderRequest', action: 'Valida', confidence: 'confirmed', evidence },
    { id: 'controller:c', kind: 'controller', actor: 'OrderController', action: 'Delega', confidence: 'confirmed', evidence },
    { id: 'service:s', kind: 'service', actor: 'OrderService', action: 'Cria', confidence: 'confirmed', evidence },
    { id: 'model:m', kind: 'model', actor: 'Order', action: 'Persiste', confidence: 'probable', evidence }
  ],
  edges: [
    { id: 'e1', from: 'request:r', to: 'controller:c', type: 'sequence', confidence: 'confirmed', evidence },
    { id: 'e2', from: 'controller:c', to: 'service:s', type: 'call', confidence: 'confirmed', evidence },
    { id: 'e3', from: 'service:s', to: 'model:m', type: 'data', confidence: 'probable', evidence }
  ],
  blocks: [
    { id: 'service:1', uri: 'file:///OrderController.php', range: evidence[0].range, kind: 'service-delegation', actor: 'OrderService', action: 'Cria', confidence: 'confirmed', evidence },
    { id: 'redirect:2', uri: 'file:///OrderController.php', range: evidence[0].range, kind: 'redirect', actor: 'Controller', action: 'Redireciona', confidence: 'confirmed', evidence }
  ]
};

test('grafo preserva FormRequest e só inclui caminho necessário aos blocos confirmados', () => {
  const graph = new FlowGraphBuilder().build(result, ['service:1', 'redirect:2']);
  assert.deepEqual(graph.nodes.slice(0, 4).map(n => n.kind), ['request','controller','service','model']);
  assert.ok(graph.nodes.some(n => n.kind === 'redirect'));
  assert.equal(graph.edges.some(e => e.from.includes('request') && e.to.includes('controller')), true);
  assert.equal(graph.nodes.some(n => n.actor === 'Inventado'), false);
});

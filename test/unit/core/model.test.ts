import test from 'node:test';
import assert from 'node:assert/strict';
import { confidenceValues, validateFlowGraph } from '../../../src/core/model.ts';

test('FlowGraph representa FormRequest → Controller → Service com evidência', () => {
  const evidence = [{ uri: 'file:///Request.php', range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } }, origin: 'ast' as const }];
  const graph = {
    schemaVersion: 1 as const,
    id: 'g1',
    rootUri: 'file:///Controller.php',
    nodes: [
      { id: 'request', kind: 'request' as const, actor: 'StoreOrderRequest', action: 'valida', confidence: 'confirmed' as const, evidence },
      { id: 'controller', kind: 'controller' as const, actor: 'OrderController', action: 'recebe', confidence: 'confirmed' as const, evidence },
      { id: 'service', kind: 'service' as const, actor: 'OrderService', action: 'cria', confidence: 'confirmed' as const, evidence }
    ],
    edges: [
      { id: 'e1', from: 'request', to: 'controller', type: 'sequence' as const, confidence: 'confirmed' as const, evidence },
      { id: 'e2', from: 'controller', to: 'service', type: 'call' as const, confidence: 'confirmed' as const, evidence }
    ],
    sourceHashes: {}
  };
  assert.equal(validateFlowGraph(graph), true);
  assert.deepEqual(graph.nodes.map(n => n.kind), ['request', 'controller', 'service']);
});

test('user_corrected é um estado de confiança válido', () => {
  assert.equal(confidenceValues.includes('user_corrected'), true);
});

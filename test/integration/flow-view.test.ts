import test from 'node:test';
import assert from 'node:assert/strict';
import { FlowViewProvider } from '../../src/ui/FlowViewProvider.ts';

const graph: any = { schemaVersion: 1, id: 'g1', rootUri: 'file:///A.php', sourceHashes: {}, nodes: [{ id: 'n1', kind: 'request', actor: 'StoreOrderRequest', action: 'Valida', confidence: 'confirmed', evidence: [] }, { id: 'n2', kind: 'controller', actor: 'OrderController', action: 'Recebe', confidence: 'confirmed', evidence: [] }], edges: [{ id: 'e1', from: 'n1', to: 'n2', type: 'sequence', confidence: 'confirmed', evidence: [] }] };

test('painel e editor usam o mesmo DTO serializável e CSP restritiva', () => {
  const provider = new FlowViewProvider();
  const panel = provider.renderHtml(graph, 'n123');
  const editor = provider.renderEditorHtml(graph, 'n123');
  assert.match(panel, /StoreOrderRequest/);
  assert.match(editor, /StoreOrderRequest/);
  assert.match(panel, /Content-Security-Policy/);
  assert.doesNotMatch(panel, /unsafe-inline/);
  assert.deepEqual(provider.serialize(graph), graph);
});

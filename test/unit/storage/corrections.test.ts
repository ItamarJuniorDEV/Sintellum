import test from 'node:test';
import assert from 'node:assert/strict';
import { CorrectionStore } from '../../../src/storage/CorrectionStore.ts';

const evidence: any[] = [{ uri: 'file:///A.php', range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } }, origin: 'ast' }];
const graph: any = { schemaVersion: 1, id: 'g1', rootUri: 'file:///A.php', nodes: [{ id: 'n1', kind: 'service', actor: 'Old', action: 'Old action', confidence: 'confirmed', evidence }], edges: [], sourceHashes: { 'file:///A.php': 'hash1' } };

test('correção humana prevalece enquanto hash da fonte for o mesmo', async () => {
  const store = new CorrectionStore();
  store.set({ graphId: 'g1', elementId: 'n1', sourceHashes: { 'file:///A.php': 'hash1' }, patch: { actor: 'OrderService', action: 'Cria pedido' } });
  const corrected = await store.apply(graph);
  assert.equal(corrected.nodes[0].actor, 'OrderService');
  assert.equal(corrected.nodes[0].confidence, 'user_corrected');
  const changed = { ...graph, sourceHashes: { 'file:///A.php': 'hash2' } };
  const staleCorrection = await store.apply(changed as any);
  assert.equal(staleCorrection.nodes[0].actor, 'Old');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { StalenessService } from '../../src/storage/StalenessService.ts';
import { stableHash } from '../../src/core/hashing.ts';

test('análise fica desatualizada sem disparar provider automaticamente', async () => {
  let providerCalls = 0;
  const graph: any = { schemaVersion: 1, id: 'g', rootUri: 'file:///A.php', nodes: [], edges: [], sourceHashes: { 'file:///A.php': stableHash('original') } };
  const stale = await new StalenessService(async () => 'alterado').check(graph);
  assert.equal(stale.stale, true);
  assert.deepEqual(stale.changedUris, ['file:///A.php']);
  assert.equal(providerCalls, 0);
});

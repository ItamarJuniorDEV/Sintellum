import test from 'node:test';
import assert from 'node:assert/strict';
import { StalenessService } from '../../../src/storage/StalenessService.ts';
import { stableHash } from '../../../src/core/hashing.ts';

const graph: any = { schemaVersion: 1, id: 'g1', rootUri: 'file:///A.php', nodes: [], edges: [], sourceHashes: { 'file:///A.php': stableHash('old') } };

test('mudança de fonte marca análise como desatualizada sem chamar IA', async () => {
  let aiCalls = 0;
  const service = new StalenessService(async () => 'new');
  const result = await service.check(graph);
  assert.equal(result.stale, true);
  assert.deepEqual(result.changedUris, ['file:///A.php']);
  assert.equal(aiCalls, 0);
});

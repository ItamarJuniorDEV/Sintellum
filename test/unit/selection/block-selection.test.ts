import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockSelectionStore } from '../../../src/selection/BlockSelectionStore.ts';

test('seleção é por documento e persiste até identidade da análise mudar', () => {
  const store = new BlockSelectionStore();
  assert.equal(store.toggle('file:///A.php', 'b1', 'analysis-1'), true);
  assert.equal(store.isSelected('file:///A.php', 'b1', 'analysis-1'), true);
  assert.equal(store.isSelected('file:///B.php', 'b1', 'analysis-1'), false);
  store.prepare('file:///A.php', 'analysis-1');
  assert.equal(store.isSelected('file:///A.php', 'b1', 'analysis-1'), true);
  store.prepare('file:///A.php', 'analysis-2');
  assert.equal(store.isSelected('file:///A.php', 'b1', 'analysis-2'), false);
});

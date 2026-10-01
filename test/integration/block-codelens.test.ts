import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockSelectionStore } from '../../src/selection/BlockSelectionStore.ts';
import { BlockCodeLensProvider } from '../../src/ui/BlockCodeLensProvider.ts';

const block: any = { id: 'service:8', uri: 'file:///OrderController.php', range: { start: { line: 8, character: 0 }, end: { line: 8, character: 20 } }, kind: 'service-delegation', actor: 'OrderService', action: 'Cria o pedido', confidence: 'confirmed', evidence: [{ uri: 'file:///OrderController.php', range: { start: { line: 8, character: 0 }, end: { line: 8, character: 20 } }, origin: 'ast' }] };

test('CodeLens usa check visual e não chama IA', () => {
  const store = new BlockSelectionStore();
  const provider = new BlockCodeLensProvider(store);
  const before = provider.toLensDtos('file:///OrderController.php', 'a1', [block]);
  assert.equal(before[0].title, '☐ Explicar: Cria o pedido');
  store.toggle(block.uri, block.id, 'a1');
  const after = provider.toLensDtos(block.uri, 'a1', [block]);
  assert.equal(after[0].title, '☑ Explicar: Cria o pedido');
  assert.equal(after[0].command, 'sintellum.toggleBlock');
});

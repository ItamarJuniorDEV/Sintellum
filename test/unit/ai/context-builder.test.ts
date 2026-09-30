import test from 'node:test';
import assert from 'node:assert/strict';
import { AiContextBuilder } from '../../../src/ai/AiContextBuilder.ts';

const selected: any = {
  id: 'b1', uri: 'file:///OrderController.php',
  range: { start: { line: 10, character: 0 }, end: { line: 12, character: 0 } },
  kind: 'service-delegation', actor: 'OrderService', action: 'Cria pedido', confidence: 'confirmed',
  evidence: [{ uri: 'file:///OrderController.php', range: { start: { line: 10, character: 0 }, end: { line: 12, character: 0 } }, origin: 'ast' }]
};

test('payload contém só bloco selecionado e assinaturas mínimas', () => {
  const builder = new AiContextBuilder();
  const pkg = builder.build({ blocks: [selected], sources: {
    'file:///OrderController.php': 'linha0\nlinha1\nlinha2\nlinha3\nlinha4\nlinha5\nlinha6\nlinha7\nlinha8\nlinha9\n$order = $this->orderService->create($dados);\nreturn $order;\nfim',
    'file:///SecretAdmin.php': 'SUPER_SECRET_INTERNAL_CODE'
  }, signatures: ['OrderService::create(array $dados): Order'] });
  const serialized = JSON.stringify(pkg);
  assert.match(serialized, /orderService->create/);
  assert.match(serialized, /OrderService::create/);
  assert.doesNotMatch(serialized, /SUPER_SECRET_INTERNAL_CODE/);
});

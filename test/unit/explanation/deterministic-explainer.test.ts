import test from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicExplainer } from '../../../src/explanation/DeterministicExplainer.ts';

const block: any = {
  id: 'service:8', uri: 'file:///OrderController.php',
  range: { start: { line: 8, character: 0 }, end: { line: 8, character: 30 } },
  kind: 'service-delegation', actor: 'OrderService', action: 'Executa a criação por meio do serviço',
  input: 'Dados preparados', output: 'Resultado da criação', why: 'Delegar a regra de negócio', confidence: 'confirmed',
  evidence: [{ uri: 'file:///OrderController.php', range: { start: { line: 8, character: 0 }, end: { line: 8, character: 30 } }, origin: 'ast' }]
};

const explainer = new DeterministicExplainer();

test('simple mostra ator + ação', () => {
  const result = explainer.explain(block, 'simple');
  assert.equal(result.actor, 'OrderService');
  assert.match(result.summary, /OrderService/);
  assert.equal(result.input, undefined);
  assert.equal(result.why, undefined);
});

test('normal inclui entrada e saída', () => {
  const result = explainer.explain(block, 'normal');
  assert.equal(result.input, 'Dados preparados');
  assert.equal(result.output, 'Resultado da criação');
  assert.equal(result.why, undefined);
});

test('technical inclui por quê e evidência sem rebaixar confirmado', () => {
  const result = explainer.explain(block, 'technical');
  assert.equal(result.why, 'Delegar a regra de negócio');
  assert.equal(result.confidence, 'confirmed');
  assert.equal(result.evidence.length, 1);
});

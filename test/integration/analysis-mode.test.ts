import test from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisModeController } from '../../src/orchestration/AnalysisModeController.ts';

test('manual não faz análise de fundo; automatic prepara contexto mas não chama IA', async () => {
  let prepared = 0; let ai = 0;
  const manual = new AnalysisModeController('manual', async () => { prepared++; }, async () => { ai++; });
  await manual.onEditorChanged('file:///A.php', true);
  assert.equal(prepared, 0); assert.equal(ai, 0);
  const automatic = new AnalysisModeController('automatic', async () => { prepared++; }, async () => { ai++; });
  await automatic.onEditorChanged('file:///A.php', true);
  assert.equal(prepared, 1); assert.equal(ai, 0);
});

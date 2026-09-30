import test from 'node:test';
import assert from 'node:assert/strict';
import { ExplanationService } from '../../../src/explanation/ExplanationService.ts';

const block: any = { id: 'b1', uri: 'file:///A.php', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }, kind: 'generic', actor: 'A', action: 'Ação determinística', why: 'Motivo determinístico', confidence: 'confirmed', evidence: [{ uri: 'file:///A.php', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }, origin: 'ast' }] };

test('IA melhora linguagem sem alterar confiança/evidência confirmadas', async () => {
  const provider: any = { id: 'ollama', enrich: async () => ({ explanations: [{ blockId: 'b1', action: 'Ação mais clara', why: 'Explicação humana' }], inferredRelations: [] }) };
  const service = new ExplanationService();
  const result = await service.explain([block], 'technical', { provider, aiContext: { blocks: [{ id: 'b1', source: 'x', facts: ['confirmed: ast'] }], signatures: [] } });
  assert.equal(result[0].action, 'Ação mais clara');
  assert.equal(result[0].why, 'Explicação humana');
  assert.equal(result[0].confidence, 'confirmed');
  assert.equal(result[0].evidence[0].origin, 'ast');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { OllamaProvider } from '../../../src/ai/providers/OllamaProvider.ts';
import { OpenAiProvider } from '../../../src/ai/providers/OpenAiProvider.ts';

const input: any = { blocks: [{ id: 'b1', source: '$x=1;', facts: ['confirmed: assignment'] }], signatures: [] };
const valid = JSON.stringify({ explanations: [{ blockId: 'b1', action: 'Define x', why: 'Preparar valor' }], inferredRelations: [] });

test('Ollama e OpenAI validam a mesma forma de enriquecimento', async () => {
  const transport = async () => ({ ok: true, status: 200, text: valid });
  const ollama = new OllamaProvider('http://127.0.0.1:11434', 'qwen2.5-coder', transport);
  const openai = new OpenAiProvider(async () => 'secret-key', 'gpt-5-mini', transport);
  assert.equal((await ollama.enrich(input)).explanations[0].blockId, 'b1');
  assert.equal((await openai.enrich(input)).explanations[0].blockId, 'b1');
});

test('saída malformada é rejeitada e não vira fato confirmado', async () => {
  const badTransport = async () => ({ ok: true, status: 200, text: JSON.stringify({ explanations: [{ blockId: 12, action: null }] }) });
  const provider = new OllamaProvider('http://127.0.0.1:11434', 'qwen', badTransport);
  await assert.rejects(() => provider.enrich(input), /Resposta de IA inválida/);
});

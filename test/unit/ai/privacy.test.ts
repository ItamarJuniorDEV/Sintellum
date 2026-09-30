import test from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets } from '../../../src/ai/AiContextBuilder.ts';

test('remove chaves, tokens, senhas e linhas de .env', () => {
  const source = `API_KEY=sk-abc123\nconst TOKEN = 'ghp_secret';\n$password = "supersecret";\nDB_PASSWORD=my-db-password\nnormal=value`;
  const safe = redactSecrets(source);
  assert.doesNotMatch(safe, /sk-abc123|ghp_secret|supersecret|my-db-password/);
  assert.match(safe, /API_KEY=\[REDACTED\]/);
  assert.match(safe, /normal=value/);
});

import { OllamaProvider } from '../../../src/ai/providers/OllamaProvider.ts';

test('Ollama rejeita endpoint remoto para reduzir SSRF/exfiltração acidental', () => {
  assert.throws(() => new OllamaProvider('https://example.com', 'model'), /endpoint local/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/extension.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('chave OpenAI só é configurada via SecretStorage e input mascarado', () => {
  assert.ok(pkg.contributes.commands.some((c: any) => c.command === 'sintellum.configureOpenAiKey'));
  assert.match(source, /context\.secrets\.store\(['"]sintellum\.openai\.apiKey['"]/);
  assert.match(source, /password:\s*true/);
  assert.doesNotMatch(JSON.stringify(pkg.contributes.configuration), /apiKey/i);
});

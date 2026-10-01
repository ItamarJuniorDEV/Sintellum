import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/extension.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('runtime registra exports e usa save dialog sem overwrite silencioso', () => {
  for (const command of ['sintellum.exportSvg','sintellum.exportPng','sintellum.exportBpmn']) {
    assert.ok(pkg.contributes.commands.some((c: any) => c.command === command), `${command} ausente`);
    assert.match(source, new RegExp(command.replace('.', '\\.')));
  }
  assert.match(source, /showSaveDialog/);
  assert.match(source, /PngExporter/);
});

test('runtime detecta edição e marca análise desatualizada', () => {
  assert.match(source, /onDidChangeTextDocument/);
  assert.match(source, /Análise desatualizada/);
});

test('runtime conecta providers respeitando trust e SecretStorage', () => {
  assert.match(source, /AiContextBuilder/);
  assert.match(source, /OllamaProvider/);
  assert.match(source, /OpenAiProvider/);
  assert.match(source, /canUseCloudAi/);
  assert.match(source, /\.secrets\.get\(['"]sintellum\.openai\.apiKey['"]/);
});

test('flow webview aceita edição suportada e save explícito', () => {
  assert.match(source, /node:edit-request/);
  assert.match(source, /flow:save/);
  assert.match(source, /user_corrected/);
});

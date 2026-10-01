import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/extension.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('runtime registra CodeLens e dois webviews', () => {
  assert.match(source, /registerCodeLensProvider/);
  assert.match(source, /registerWebviewViewProvider/);
  assert.ok(pkg.contributes.viewsContainers?.panel?.some((v: any) => v.id === 'sintellumPanel'));
  assert.ok(pkg.contributes.views?.sintellumPanel?.some((v: any) => v.id === 'sintellum.explanations'));
  assert.ok(pkg.contributes.views?.sintellumPanel?.some((v: any) => v.id === 'sintellum.flow'));
});

test('abrir editor de fluxo é um comando declarado e registrado', () => {
  assert.ok(pkg.contributes.commands.some((c: any) => c.command === 'sintellum.openFlowEditor'));
  assert.match(source, /sintellum\.openFlowEditor/);
});

test('runtime aplica explicações inline como decorations sem editar o documento', () => {
  assert.match(source, /InlineExplanationController/);
  assert.match(source, /createTextEditorDecorationType/);
  assert.match(source, /setDecorations/);
});

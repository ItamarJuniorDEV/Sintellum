import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/extension.ts', import.meta.url), 'utf8');

test('extensão consulta Workspace Trust e nunca executa processo do projeto', () => {
  assert.match(source, /workspace\.isTrusted/);
  assert.doesNotMatch(source, /child_process|exec\(|spawn\(|require\([^)]*workspace/i);
});

test('comandos de análise, refresh e toggle ficam registrados', () => {
  assert.match(source, /sintellum\.analyzeCurrentFile/);
  assert.match(source, /sintellum\.refreshAnalysis/);
  assert.match(source, /sintellum\.toggleBlock/);
});

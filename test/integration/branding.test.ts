import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const extensionSource = await readFile(new URL('../../src/extension.ts', import.meta.url), 'utf8');
const readme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');
const bpmnSource = await readFile(new URL('../../src/flow/bpmn/BpmnMapper.ts', import.meta.url), 'utf8');

test('public branding and VS Code identifiers use Sintellum', () => {
  assert.equal(pkg.name, 'sintellum');
  assert.equal(pkg.displayName, 'Sintellum');
  assert.equal(pkg.repository.url, 'https://github.com/ItamarJuniorDEV/Sintellum.git');
  assert.ok(pkg.contributes.commands.every((command: { command: string; title: string }) => command.command.startsWith('sintellum.') && command.title.startsWith('Sintellum:')));
  assert.ok(Object.keys(pkg.contributes.configuration.properties).every((key) => key.startsWith('sintellum.')));
  assert.match(readme, /^# Sintellum/m);
  assert.equal(pkg.contributes.viewsContainers.panel[0].icon, 'resources/sintellum.svg');
  assert.doesNotMatch(extensionSource, /codeFlow\./);
  assert.doesNotMatch(extensionSource, /CodeFlow:/);
  assert.doesNotMatch(bpmnSource, /codeflow/);
});

test('project persistence uses .sintellum rather than the old codename folder', async () => {
  const storeSource = await readFile(new URL('../../src/storage/AnalysisStore.ts', import.meta.url), 'utf8');
  assert.match(storeSource, /\.sintellum/);
  assert.doesNotMatch(storeSource, /\.codeflow/);
});

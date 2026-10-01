import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../../src/extension.ts', import.meta.url), 'utf8');

test('manifest registra comando principal e defaults seguros', () => {
  const commands = pkg.contributes.commands.map((c: { command: string }) => c.command);
  assert.ok(commands.includes('sintellum.analyzeCurrentFile'));
  const props = pkg.contributes.configuration.properties;
  assert.equal(props['sintellum.analysisMode'].default, 'manual');
  assert.equal(props['sintellum.provider'].default, 'none');
});

test('ativação não contém telemetria nem chamada de rede direta', () => {
  assert.doesNotMatch(source, /telemetry|fetch\(/i);
  assert.equal(pkg.contributes.configuration.properties['sintellum.provider'].default, 'none');
});

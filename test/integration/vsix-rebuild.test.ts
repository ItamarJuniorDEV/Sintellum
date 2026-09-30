import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('reempacotar VSIX remove entradas antigas em vez de atualizar zip existente', () => {
  execFileSync('npm', ['run', 'package'], { stdio: 'ignore' });
  writeFileSync('stale.marker', 'should disappear');
  execFileSync('zip', ['-q', 'sintellum-0.0.1.vsix', 'stale.marker']);
  rmSync('stale.marker');
  execFileSync('npm', ['run', 'package'], { stdio: 'ignore' });
  const entries = execFileSync('unzip', ['-Z1', 'sintellum-0.0.1.vsix'], { encoding: 'utf8' });
  assert.doesNotMatch(entries, /stale\.marker/);
  assert.doesNotMatch(entries, /extension\/docs\/superpowers\//);
});

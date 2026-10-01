import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const tsconfig = JSON.parse(readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8'));

test('build gera o entrypoint declarado pela extensão', () => {
  assert.equal(pkg.main, './dist/extension.js');
  assert.equal(tsconfig.compilerOptions.rootDir, 'src');
});

test('arquivos de release e segurança existem', () => {
  for (const file of ['README.md','SECURITY.md','CONTRIBUTING.md','CHANGELOG.md','docs/privacy.md','docs/providers.md','docs/architecture.md','.vscodeignore']) {
    assert.equal(existsSync(new URL(`../../${file}`, import.meta.url)), true, `${file} ausente`);
  }
});

test('CI sem lockfile não ativa cache npm e fixa TypeScript para build reproduzível', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(workflow, /cache:\s*npm/);
  assert.equal(pkg.devDependencies.typescript, '5.7.2');
});

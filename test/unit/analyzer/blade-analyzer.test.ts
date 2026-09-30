import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BladeAnalyzer } from '../../../src/analyzer/blade/BladeAnalyzer.ts';

const analyzer = new BladeAnalyzer();

test('extrai relações estáticas de include e route com evidência', async () => {
  const file = resolve('test/fixtures/laravel-basic/resources/views/orders/create.blade.php');
  const result = await analyzer.analyze(pathToFileURL(file).href, readFileSync(file, 'utf8'));
  const facts = result.facts as any[];
  assert.ok(facts.some(f => f.kind === 'include' && f.target === 'orders.partials.form' && f.confidence === 'confirmed'));
  assert.ok(facts.some(f => f.kind === 'route' && f.target === 'orders.store' && f.confidence === 'confirmed'));
  assert.ok(facts.every(f => f.evidence?.uri));
});

test('nomes dinâmicos não viram links inventados', async () => {
  const file = resolve('test/fixtures/laravel-basic/resources/views/orders/dynamic.blade.php');
  const result = await analyzer.analyze(pathToFileURL(file).href, readFileSync(file, 'utf8'));
  const facts = result.facts as any[];
  assert.equal(facts.some(f => f.targetUri), false);
  assert.ok(facts.some(f => f.confidence === 'probable' || f.confidence === 'inferred'));
});

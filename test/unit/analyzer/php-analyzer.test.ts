import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { PhpAnalyzer } from '../../..//src/analyzer/php/PhpAnalyzer.ts';

const file = resolve('test/fixtures/laravel-basic/app/Http/Controllers/OrderController.php');
const source = readFileSync(file, 'utf8');
const result = new PhpAnalyzer().analyze(pathToFileURL(file).href, source);

test('extrai namespace, imports, parâmetros tipados e chamadas relevantes', () => {
  const facts = result.facts ?? [];
  const kinds = facts.map((f: any) => f.kind);
  assert.ok(kinds.includes('namespace'));
  assert.ok(kinds.includes('import'));
  assert.ok(facts.some((f: any) => f.kind === 'parameter' && f.type === 'StoreOrderRequest'));
  assert.ok(facts.some((f: any) => f.kind === 'property' && f.type === 'Orders' && f.name === 'orderService'));
  assert.ok(facts.some((f: any) => f.kind === 'method_call' && f.method === 'validated'));
  assert.ok(facts.some((f: any) => f.kind === 'method_call' && f.method === 'create'));
  assert.ok(facts.some((f: any) => f.kind === 'function_call' && f.name === 'redirect'));
});

test('preserva alias de import para resolução exata', () => {
  const imp = (result.facts ?? []).find((f: any) => f.kind === 'import' && f.alias === 'Orders') as any;
  assert.equal(imp.fqcn, 'App\\Services\\OrderService');
});

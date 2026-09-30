import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PhpAnalyzer } from '../../../src/analyzer/php/PhpAnalyzer.ts';
import { LaravelRelationResolver } from '../../../src/analyzer/laravel/LaravelRelationResolver.ts';

const root = resolve('test/fixtures/laravel-basic');
const controllerPath = resolve(root, 'app/Http/Controllers/OrderController.php');
const source = readFileSync(controllerPath, 'utf8');
const base = new PhpAnalyzer().analyze(pathToFileURL(controllerPath).href, source);

test('FormRequest aparece como etapa própria antes do Controller e Service', async () => {
  const result = await new LaravelRelationResolver(pathToFileURL(root + '/').href).resolve(base.rootUri, base);
  const kinds = result.nodes.map(n => n.kind);
  const requestIndex = kinds.indexOf('request');
  const controllerIndex = kinds.indexOf('controller');
  const serviceIndex = kinds.indexOf('service');
  assert.ok(requestIndex >= 0 && controllerIndex > requestIndex && serviceIndex > controllerIndex);
  const request = result.nodes[requestIndex];
  assert.equal(request.actor, 'StoreOrderRequest');
  assert.match(request.action, /autoriza|valida/i);
  assert.ok(result.edges.some(e => e.from === request.id && e.to === result.nodes[controllerIndex].id && e.confidence === 'confirmed'));
});

test('$request->validated() consome saída do FormRequest e não vira validação do Controller', async () => {
  const result = await new LaravelRelationResolver(pathToFileURL(root + '/').href).resolve(base.rootUri, base);
  const controller = result.nodes.find(n => n.kind === 'controller')!;
  assert.doesNotMatch(controller.action, /valida/i);
  assert.ok(result.blocks.some(b => b.kind === 'validation-consumption' && b.actor === 'StoreOrderRequest'));
});

test('resolução dinâmica nunca é confirmada sem evidência direta', async () => {
  const dynamicSource = `<?php class X { function run($app) { return $app->make($serviceName)->run(); } }`;
  const dynamic = new PhpAnalyzer().analyze('file:///dynamic.php', dynamicSource);
  const result = await new LaravelRelationResolver(pathToFileURL(root + '/').href).resolve(dynamic.rootUri, dynamic);
  assert.equal(result.nodes.some(n => n.confidence === 'confirmed' && /serviceName/.test(n.actor)), false);
});

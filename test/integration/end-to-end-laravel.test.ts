import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SintellumOrchestrator } from '../../src/orchestration/SintellumOrchestrator.ts';

const root = resolve('test/fixtures/laravel-basic');
const controller = resolve(root, 'app/Http/Controllers/OrderController.php');

test('fluxo realista mantém FormRequest separado e chega a Redirect sem IA', async () => {
  const orchestrator = new SintellumOrchestrator(pathToFileURL(root + '/').href);
  const prepared = await orchestrator.prepare(pathToFileURL(controller).href);
  const selected = prepared.analysis.blocks.filter(b => ['validation-consumption','service-delegation','redirect'].includes(b.kind)).map(b => b.id);
  const final = await orchestrator.build(selected, 'normal');
  const kinds = final.graph.nodes.map(n => n.kind);
  assert.ok(kinds.indexOf('request') < kinds.indexOf('controller'));
  assert.ok(kinds.indexOf('controller') < kinds.indexOf('service'));
  assert.ok(kinds.includes('model'));
  assert.ok(kinds.includes('redirect'));
  assert.equal(final.explanations.some(e => e.confidence === 'inferred'), false);
});

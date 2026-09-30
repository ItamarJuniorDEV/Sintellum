import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PhpAnalyzer } from '../../../src/analyzer/php/PhpAnalyzer.ts';
import { LogicalBlockExtractor } from '../../../src/analyzer/laravel/LogicalBlockExtractor.ts';

const file = resolve('test/fixtures/laravel-basic/app/Http/Controllers/OrderController.php');
const source = readFileSync(file, 'utf8');
const analysis = new PhpAnalyzer().analyze(pathToFileURL(file).href, source);

test('separa consumo de validação, delegação e redirect em blocos lógicos', () => {
  const blocks = new LogicalBlockExtractor().extract(analysis);
  assert.ok(blocks.some(b => b.kind === 'validation-consumption'));
  assert.ok(blocks.some(b => b.kind === 'service-delegation'));
  assert.ok(blocks.some(b => b.kind === 'redirect'));
  assert.ok(blocks.every(b => b.evidence.length > 0));
});

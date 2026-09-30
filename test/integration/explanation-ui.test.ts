import test from 'node:test';
import assert from 'node:assert/strict';
import { InlineExplanationController } from '../../src/ui/InlineExplanationController.ts';
import { ExplanationViewProvider } from '../../src/ui/ExplanationViewProvider.ts';

const explanation: any = { blockId: 'b1', actor: 'StoreOrderRequest', action: 'Fornece dados validados', summary: 'StoreOrderRequest → fornece os dados já validados.', confidence: 'confirmed', evidence: [{ uri: 'file:///A.php', range: { start: { line: 2, character: 0 }, end: { line: 2, character: 20 } }, origin: 'ast' }] };

test('inline produz decoração e painel produz cards sem editar código', () => {
  const inline = new InlineExplanationController().toDecorations([explanation]);
  assert.equal(inline[0].line, 2);
  assert.match(inline[0].text, /dados já validados/);
  assert.equal('replacementText' in inline[0], false);
  const html = new ExplanationViewProvider().renderHtml([explanation], 'nonce123');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /StoreOrderRequest/);
  assert.match(html, /Confirmado/);
});

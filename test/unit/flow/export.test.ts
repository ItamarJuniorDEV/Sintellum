import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgExporter } from '../../../src/flow/export/SvgExporter.ts';
import { PngExporter } from '../../../src/flow/export/PngExporter.ts';

const graph: any = { schemaVersion: 1, id: 'g1', rootUri: 'file:///A.php', sourceHashes: {}, nodes: [{ id: 'n1', kind: 'service', actor: 'OrderService', action: 'Cria pedido', confidence: 'confirmed', evidence: [] }], edges: [] };

test('SVG é não vazio e escapa conteúdo', async () => {
  graph.nodes[0].action = 'Cria <pedido>';
  const svg = await new SvgExporter().export(graph);
  assert.match(svg, /^<svg/);
  assert.match(svg, /Cria &lt;pedido&gt;/);
  assert.doesNotMatch(svg, /<pedido>/);
});

test('PNG usa rasterizador do webview e exige assinatura PNG', async () => {
  const exporter = new PngExporter(async () => new Uint8Array([137,80,78,71,13,10,26,10,1,2,3]));
  const bytes = await exporter.export('<svg></svg>');
  assert.deepEqual([...bytes.slice(0,8)], [137,80,78,71,13,10,26,10]);
});

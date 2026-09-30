import test from 'node:test';
import assert from 'node:assert/strict';
import { BpmnMapper } from '../../../src/flow/bpmn/BpmnMapper.ts';

const evidence: any[] = [{ uri: 'file:///A.php', range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } }, origin: 'ast' }];
const graph: any = {
  schemaVersion: 1, id: 'g1', rootUri: 'file:///A.php', sourceHashes: { 'file:///A.php': 'h1' },
  nodes: [
    { id: 'n1', kind: 'request', actor: 'StoreOrderRequest', action: 'Valida os dados', confidence: 'confirmed', evidence },
    { id: 'n2', kind: 'decision', actor: 'Sistema', action: 'Dados válidos?', confidence: 'confirmed', evidence },
    { id: 'n3', kind: 'service', actor: 'OrderService', action: 'Cria pedido', confidence: 'confirmed', evidence },
    { id: 'n4', kind: 'redirect', actor: 'Controller', action: 'Retorna erro', confidence: 'probable', evidence }
  ],
  edges: [
    { id: 'e1', from: 'n1', to: 'n2', type: 'sequence', confidence: 'confirmed', evidence },
    { id: 'e2', from: 'n2', to: 'n3', type: 'success', condition: 'Sim', confidence: 'confirmed', evidence },
    { id: 'e3', from: 'n2', to: 'n4', type: 'error', condition: 'Não', confidence: 'probable', evidence }
  ]
};

test('mapeia tarefas, gateway e ramos distintos com incerteza visível', async () => {
  const xml = await new BpmnMapper().toXml(graph);
  assert.match(xml, /bpmn:task[^>]+id="n1"/);
  assert.match(xml, /bpmn:exclusiveGateway[^>]+id="n2"/);
  assert.match(xml, /name="Sim"/);
  assert.match(xml, /name="Não"/);
  assert.match(xml, /sintellum:confidence="probable"/);
});

test('round-trip preserva metadados Sintellum ao renomear tarefa suportada', async () => {
  const mapper = new BpmnMapper();
  const xml = await mapper.toXml(graph);
  const renamed = xml.replace('name="Cria pedido"', 'name="Criar pedido confirmado"');
  const updated = await mapper.fromXml(renamed, graph);
  const node = updated.nodes.find((n: any) => n.id === 'n3')!;
  assert.equal(node.action, 'Criar pedido confirmado');
  assert.equal(node.evidence[0].uri, 'file:///A.php');
  assert.equal(node.confidence, 'confirmed');
});

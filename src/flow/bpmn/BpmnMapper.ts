import type { FlowGraph } from '../../core/model.ts';

function xmlEscape(value: string): string {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}
function xmlDecode(value: string): string {
  return value.replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&');
}

export class BpmnMapper {
  async toXml(graph: FlowGraph): Promise<string> {
    const nodes = graph.nodes.map(node => {
      const tag = node.kind === 'decision' ? 'bpmn:exclusiveGateway' : 'bpmn:task';
      return `    <${tag} id="${xmlEscape(node.id)}" name="${xmlEscape(node.action)}" sintellum:actor="${xmlEscape(node.actor)}" sintellum:confidence="${xmlEscape(node.confidence)}"/>`;
    }).join('\n');
    const edges = graph.edges.map(edge => `    <bpmn:sequenceFlow id="${xmlEscape(edge.id)}" sourceRef="${xmlEscape(edge.from)}" targetRef="${xmlEscape(edge.to)}"${edge.condition ? ` name="${xmlEscape(edge.condition)}"` : ''} sintellum:confidence="${xmlEscape(edge.confidence)}"/>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:sintellum="https://sintellum.dev/schema/1" id="Definitions_${xmlEscape(graph.id)}">\n  <bpmn:process id="${xmlEscape(graph.id)}" isExecutable="false">\n${nodes}\n${edges}\n  </bpmn:process>\n</bpmn:definitions>`;
  }

  async fromXml(xml: string, baseGraph: FlowGraph): Promise<FlowGraph> {
    const nodes = baseGraph.nodes.map(node => {
      const escapedId = node.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<bpmn:(?:task|exclusiveGateway)\\s+[^>]*id="${escapedId}"[^>]*name="([^"]*)"[^>]*/>`);
      const match = xml.match(re);
      return match ? { ...node, action: xmlDecode(match[1]) } : { ...node };
    });
    return { ...baseGraph, nodes, edges: baseGraph.edges.map(edge => ({ ...edge })) };
  }
}

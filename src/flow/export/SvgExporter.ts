import type { FlowGraph } from '../../core/model.ts';

function esc(value: string): string {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}

export class SvgExporter {
  async export(graph: FlowGraph): Promise<string> {
    const width = Math.max(260, graph.nodes.length * 220);
    const height = 180;
    const nodes = graph.nodes.map((node, i) => {
      const x = 20 + i * 210;
      const dash = node.confidence === 'confirmed' || node.confidence === 'user_corrected' ? '' : ' stroke-dasharray="6 4"';
      return `<g data-id="${esc(node.id)}"><rect x="${x}" y="45" width="180" height="80" rx="10" fill="none" stroke="currentColor"${dash}/><text x="${x + 10}" y="72" font-size="14">${esc(node.actor)}</text><text x="${x + 10}" y="98" font-size="12">${esc(node.action)}</text></g>`;
    }).join('');
    const arrows = graph.nodes.slice(0, -1).map((_, i) => {
      const x1 = 200 + i * 210, x2 = 230 + i * 210;
      return `<line x1="${x1}" y1="85" x2="${x2}" y2="85" stroke="currentColor"/><path d="M ${x2-6} 80 L ${x2} 85 L ${x2-6} 90" fill="none" stroke="currentColor"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${arrows}${nodes}</svg>`;
  }
}

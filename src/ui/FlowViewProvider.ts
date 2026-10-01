import type { FlowGraph } from '../core/model.ts';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export class FlowViewProvider {
  serialize(graph: FlowGraph): FlowGraph { return JSON.parse(JSON.stringify(graph)) as FlowGraph; }

  renderHtml(graph: FlowGraph, nonce: string): string { return this.render(graph, nonce, false); }
  renderEditorHtml(graph: FlowGraph, nonce: string): string { return this.render(graph, nonce, true); }

  renderPngRendererHtml(svg: string, nonce: string): string {
    const encoded = encodeURIComponent(svg);
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src 'nonce-${escapeHtml(nonce)}';"></head><body><script nonce="${escapeHtml(nonce)}">const vscode=acquireVsCodeApi();const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||1200;canvas.height=image.naturalHeight||600;const ctx=canvas.getContext('2d');if(!ctx){vscode.postMessage({type:'png:render-error'});return;}ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background')||'#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);const data=canvas.toDataURL('image/png').split(',')[1]||'';vscode.postMessage({type:'png:render-result',data});};image.onerror=()=>vscode.postMessage({type:'png:render-error'});image.src='data:image/svg+xml;charset=utf-8,${encoded}';</script></body></html>`;
  }

  private render(graph: FlowGraph, nonce: string, editor: boolean): string {
    const nodes = graph.nodes.map((node, index) => `<div class="node ${escapeHtml(node.confidence)}" data-id="${escapeHtml(node.id)}" style="--i:${index}"><b>${escapeHtml(node.actor)}</b><span>${escapeHtml(node.action)}</span><small>${escapeHtml(node.confidence)}</small></div>`).join('<div class="arrow" aria-hidden="true">→</div>');
    const title = editor ? 'Sintellum — Editor de Fluxo' : 'Fluxo visual do código';
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${escapeHtml(nonce)}'; script-src 'nonce-${escapeHtml(nonce)}';"><style nonce="${escapeHtml(nonce)}">body{font-family:var(--vscode-font-family);padding:12px;color:var(--vscode-foreground)}.flow{display:flex;align-items:center;gap:8px;overflow:auto}.node{min-width:150px;border:1px solid var(--vscode-panel-border);border-radius:10px;padding:10px}.node b,.node span,.node small{display:block}.node small{opacity:.7;margin-top:6px}.arrow{opacity:.7;font-size:20px}.probable{border-style:dashed}.inferred{border-style:dotted}</style></head><body><h3>${escapeHtml(title)}</h3><button id="save">Salvar fluxo</button><div class="flow">${nodes}</div><script nonce="${escapeHtml(nonce)}">const vscode=typeof acquireVsCodeApi==='function'?acquireVsCodeApi():null;document.addEventListener('dblclick',e=>{const el=e.target.closest?.('.node');if(!el||!vscode)return;vscode.postMessage({type:'node:edit-request',id:el.dataset.id});});document.getElementById('save')?.addEventListener('click',()=>vscode?.postMessage({type:'flow:save'}));</script></body></html>`;
  }
}

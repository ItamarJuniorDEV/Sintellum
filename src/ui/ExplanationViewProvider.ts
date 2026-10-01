import type { BlockExplanation } from '../explanation/schemas.ts';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function label(confidence: BlockExplanation['confidence']): string {
  return ({ confirmed: 'Confirmado', probable: 'Provável', inferred: 'Inferido', user_corrected: 'Corrigido pelo usuário' })[confidence];
}

export class ExplanationViewProvider {
  renderHtml(explanations: BlockExplanation[], nonce: string): string {
    const cards = explanations.map(e => `<article class="card"><header><strong>${escapeHtml(e.actor)}</strong><span>${label(e.confidence)}</span></header><p>${escapeHtml(e.action)}</p>${e.input ? `<p><b>Entrada:</b> ${escapeHtml(e.input)}</p>` : ''}${e.output ? `<p><b>Saída:</b> ${escapeHtml(e.output)}</p>` : ''}${e.why ? `<p><b>Por quê:</b> ${escapeHtml(e.why)}</p>` : ''}</article>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${escapeHtml(nonce)}';"><style nonce="${escapeHtml(nonce)}">body{font-family:var(--vscode-font-family);padding:12px}.card{border:1px solid var(--vscode-panel-border);border-radius:8px;padding:12px;margin:0 0 10px}header{display:flex;justify-content:space-between;gap:8px}span{opacity:.75}</style></head><body>${cards}</body></html>`;
  }
}

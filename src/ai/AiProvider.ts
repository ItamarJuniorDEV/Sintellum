export interface AiContextBlock {
  id: string;
  source: string;
  facts: string[];
}

export interface AiContextPackage {
  blocks: AiContextBlock[];
  signatures: string[];
}

export interface AiExplanationPatch {
  blockId: string;
  action?: string;
  why?: string;
}

export interface AiInferredRelation {
  from: string;
  to: string;
  label: string;
  confidence: 'inferred';
}

export interface AiEnrichment {
  explanations: AiExplanationPatch[];
  inferredRelations: AiInferredRelation[];
}

export interface AiProvider {
  readonly id: 'ollama' | 'openai';
  enrich(input: AiContextPackage, signal?: AbortSignal): Promise<AiEnrichment>;
}

export interface HttpResult { ok: boolean; status: number; text: string; }
export type HttpTransport = (url: string, init?: RequestInit, signal?: AbortSignal) => Promise<HttpResult>;

export function validateAiEnrichment(value: unknown): AiEnrichment {
  if (!value || typeof value !== 'object') throw new Error('Resposta de IA inválida');
  const v = value as any;
  if (!Array.isArray(v.explanations) || !Array.isArray(v.inferredRelations ?? [])) throw new Error('Resposta de IA inválida');
  for (const e of v.explanations) {
    if (!e || typeof e.blockId !== 'string') throw new Error('Resposta de IA inválida');
    if (e.action !== undefined && typeof e.action !== 'string') throw new Error('Resposta de IA inválida');
    if (e.why !== undefined && typeof e.why !== 'string') throw new Error('Resposta de IA inválida');
  }
  const inferredRelations = (v.inferredRelations ?? []).map((r: any) => {
    if (!r || typeof r.from !== 'string' || typeof r.to !== 'string' || typeof r.label !== 'string') throw new Error('Resposta de IA inválida');
    return { from: r.from, to: r.to, label: r.label, confidence: 'inferred' as const };
  });
  return { explanations: v.explanations.map((e: any) => ({ blockId: e.blockId, action: e.action, why: e.why })), inferredRelations };
}

export const defaultTransport: HttpTransport = async (url, init, signal) => {
  const response = await fetch(url, { ...init, signal });
  return { ok: response.ok, status: response.status, text: await response.text() };
};

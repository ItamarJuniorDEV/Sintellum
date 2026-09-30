import type { AiContextPackage, AiEnrichment, AiProvider, HttpTransport } from '../AiProvider.ts';
import { defaultTransport, validateAiEnrichment } from '../AiProvider.ts';

function assertLocalEndpoint(endpoint: string): string {
  const url = new URL(endpoint);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Endpoint Ollama inválido');
  const host = url.hostname.toLowerCase();
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Ollama deve usar endpoint local por padrão');
  return url.origin;
}

export class OllamaProvider implements AiProvider {
  readonly id = 'ollama' as const;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly transport: HttpTransport;
  constructor(endpoint: string, model: string, transport: HttpTransport = defaultTransport) {
    this.endpoint = assertLocalEndpoint(endpoint);
    this.model = model;
    this.transport = transport;
  }

  async enrich(input: AiContextPackage, signal?: AbortSignal): Promise<AiEnrichment> {
    const prompt = `Responda somente JSON. Explique em português os blocos sem alterar fatos confirmados. Entrada: ${JSON.stringify(input)}`;
    const response = await this.transport(`${this.endpoint}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false, format: 'json' })
    }, signal);
    if (!response.ok) throw new Error(`Falha no Ollama (${response.status})`);
    let raw: any;
    try { raw = JSON.parse(response.text); } catch { throw new Error('Resposta de IA inválida'); }
    const modelText = typeof raw.response === 'string' ? raw.response : response.text;
    try { return validateAiEnrichment(JSON.parse(modelText)); } catch { throw new Error('Resposta de IA inválida'); }
  }
}

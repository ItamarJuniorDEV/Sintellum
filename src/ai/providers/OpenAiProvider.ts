import type { AiContextPackage, AiEnrichment, AiProvider, HttpTransport } from '../AiProvider.ts';
import { defaultTransport, validateAiEnrichment } from '../AiProvider.ts';

export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const;
  private readonly getApiKey: () => Promise<string | undefined>;
  private readonly model: string;
  private readonly transport: HttpTransport;
  constructor(getApiKey: () => Promise<string | undefined>, model: string, transport: HttpTransport = defaultTransport) {
    this.getApiKey = getApiKey;
    this.model = model;
    this.transport = transport;
  }

  async enrich(input: AiContextPackage, signal?: AbortSignal): Promise<AiEnrichment> {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error('Chave OpenAI não configurada');
    const prompt = `Explique em português. Retorne somente JSON com explanations e inferredRelations. Nunca transforme inferência em fato confirmado. ${JSON.stringify(input)}`;
    const response = await this.transport('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: this.model, input: prompt })
    }, signal);
    if (!response.ok) throw new Error(`Falha no provedor OpenAI (${response.status})`);
    let outer: any;
    try { outer = JSON.parse(response.text); } catch { throw new Error('Resposta de IA inválida'); }
    const modelText = typeof outer.output_text === 'string' ? outer.output_text : response.text;
    try { return validateAiEnrichment(JSON.parse(modelText)); } catch { throw new Error('Resposta de IA inválida'); }
  }
}

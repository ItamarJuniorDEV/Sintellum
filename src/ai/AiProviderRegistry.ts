import type { AiProvider } from './AiProvider.ts';
export class AiProviderRegistry {
  private readonly providers = new Map<AiProvider['id'], AiProvider>();
  register(provider: AiProvider): void { this.providers.set(provider.id, provider); }
  get(id: AiProvider['id']): AiProvider | undefined { return this.providers.get(id); }
}

import type { ExplanationMode, LogicalBlock } from '../core/model.ts';
import type { AiContextPackage, AiProvider } from '../ai/AiProvider.ts';
import type { BlockExplanation } from './schemas.ts';
import { DeterministicExplainer } from './DeterministicExplainer.ts';

export interface ExplanationOptions {
  provider?: AiProvider;
  aiContext?: AiContextPackage;
  signal?: AbortSignal;
}

export class ExplanationService {
  private readonly deterministic = new DeterministicExplainer();

  async explain(blocks: LogicalBlock[], mode: ExplanationMode, options: ExplanationOptions = {}): Promise<BlockExplanation[]> {
    const base = blocks.map(block => this.deterministic.explain(block, mode));
    if (!options.provider || !options.aiContext) return base;
    const enrichment = await options.provider.enrich(options.aiContext, options.signal);
    const patches = new Map(enrichment.explanations.map(patch => [patch.blockId, patch]));
    return base.map(explanation => {
      const patch = patches.get(explanation.blockId);
      if (!patch) return explanation;
      return {
        ...explanation,
        action: patch.action ?? explanation.action,
        why: mode === 'technical' ? (patch.why ?? explanation.why) : explanation.why,
        summary: `${explanation.actor} → ${(patch.action ?? explanation.action).charAt(0).toLowerCase()}${(patch.action ?? explanation.action).slice(1)}.`
      };
    });
  }
}

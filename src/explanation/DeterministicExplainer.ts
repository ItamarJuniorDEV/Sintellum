import type { ExplanationMode, LogicalBlock } from '../core/model.ts';
import type { BlockExplanation } from './schemas.ts';

export class DeterministicExplainer {
  explain(block: LogicalBlock, mode: ExplanationMode): BlockExplanation {
    const base: BlockExplanation = {
      blockId: block.id,
      actor: block.actor,
      action: block.action,
      summary: `${block.actor} → ${block.action.charAt(0).toLowerCase()}${block.action.slice(1)}.`,
      confidence: block.confidence,
      evidence: block.evidence
    };
    if (mode === 'normal' || mode === 'technical') {
      base.input = block.input;
      base.output = block.output;
    }
    if (mode === 'technical') base.why = block.why;
    return base;
  }
}

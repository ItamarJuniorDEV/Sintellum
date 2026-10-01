import type { BlockExplanation } from '../explanation/schemas.ts';

export interface InlineDecorationDto { line: number; text: string; hover: string; }

export class InlineExplanationController {
  toDecorations(explanations: BlockExplanation[]): InlineDecorationDto[] {
    return explanations.map(explanation => ({
      line: explanation.evidence[0]?.range.start.line ?? 0,
      text: `  → ${explanation.summary}`,
      hover: `${explanation.actor}: ${explanation.action}`
    }));
  }
}

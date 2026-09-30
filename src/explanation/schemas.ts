import type { Confidence } from '../core/model.ts';
import type { Evidence } from '../core/evidence.ts';

export interface BlockExplanation {
  blockId: string;
  actor: string;
  action: string;
  input?: string;
  output?: string;
  why?: string;
  summary: string;
  confidence: Confidence;
  evidence: Evidence[];
}

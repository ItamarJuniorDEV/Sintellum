import type { AnalysisResult } from '../core/model.ts';
export interface SourceAnalyzer { analyze(uri: string, source: string): AnalysisResult | Promise<AnalysisResult>; }

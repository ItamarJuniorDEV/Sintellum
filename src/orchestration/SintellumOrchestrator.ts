import type { AnalysisResult, ExplanationMode, FlowGraph } from '../core/model.ts';
import type { AiContextPackage, AiProvider } from '../ai/AiProvider.ts';
import type { BlockExplanation } from '../explanation/schemas.ts';
import { AnalysisContextBuilder } from '../context/AnalysisContextBuilder.ts';
import { FlowGraphBuilder } from '../flow/FlowGraphBuilder.ts';
import { ExplanationService } from '../explanation/ExplanationService.ts';

export interface PreparedAnalysis { analysis: AnalysisResult; }
export interface BuiltAnalysis { graph: FlowGraph; explanations: BlockExplanation[]; }

export class SintellumOrchestrator {
  private readonly contextBuilder: AnalysisContextBuilder;
  private readonly graphBuilder = new FlowGraphBuilder();
  private readonly explanationService = new ExplanationService();
  private current?: AnalysisResult;

  constructor(workspaceUri: string) { this.contextBuilder = new AnalysisContextBuilder(workspaceUri); }

  async prepare(seedUri: string): Promise<PreparedAnalysis> {
    this.current = await this.contextBuilder.build(seedUri);
    return { analysis: this.current };
  }

  async build(selectedBlockIds: string[], mode: ExplanationMode, ai?: { provider: AiProvider; context: AiContextPackage }): Promise<BuiltAnalysis> {
    if (!this.current) throw new Error('Nenhuma análise preparada');
    const selected = this.current.blocks.filter(block => selectedBlockIds.includes(block.id));
    const explanations = await this.explanationService.explain(selected, mode, ai ? { provider: ai.provider, aiContext: ai.context } : {});
    const graph = this.graphBuilder.build(this.current, selectedBlockIds);
    return { graph, explanations };
  }
}

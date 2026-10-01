export type AnalysisMode = 'manual' | 'automatic';
export class AnalysisModeController {
  private readonly mode: AnalysisMode;
  private readonly prepare: (uri: string) => Promise<void>;
  private readonly aiAutoEnrich: (uri: string) => Promise<void>;
  constructor(mode: AnalysisMode, prepare: (uri: string) => Promise<void>, aiAutoEnrich: (uri: string) => Promise<void>) {
    this.mode = mode; this.prepare = prepare; this.aiAutoEnrich = aiAutoEnrich;
  }
  async onEditorChanged(uri: string, supported: boolean, aiAutoEnrichmentEnabled = false): Promise<void> {
    if (this.mode !== 'automatic' || !supported) return;
    await this.prepare(uri);
    if (aiAutoEnrichmentEnabled) await this.aiAutoEnrich(uri);
  }
}

interface DocumentSelection { analysisId: string; selected: Set<string>; }

export class BlockSelectionStore {
  private readonly documents = new Map<string, DocumentSelection>();

  prepare(documentUri: string, analysisId: string): void {
    const current = this.documents.get(documentUri);
    if (!current || current.analysisId !== analysisId) this.documents.set(documentUri, { analysisId, selected: new Set() });
  }

  toggle(documentUri: string, blockId: string, analysisId: string): boolean {
    this.prepare(documentUri, analysisId);
    const current = this.documents.get(documentUri)!;
    if (current.selected.has(blockId)) { current.selected.delete(blockId); return false; }
    current.selected.add(blockId); return true;
  }

  isSelected(documentUri: string, blockId: string, analysisId: string): boolean {
    const current = this.documents.get(documentUri);
    return !!current && current.analysisId === analysisId && current.selected.has(blockId);
  }

  selectedIds(documentUri: string, analysisId: string): string[] {
    const current = this.documents.get(documentUri);
    return current && current.analysisId === analysisId ? [...current.selected] : [];
  }
}

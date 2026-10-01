import type { LogicalBlock } from '../core/model.ts';
import { BlockSelectionStore } from '../selection/BlockSelectionStore.ts';

export interface CodeLensDto {
  title: string;
  command: 'sintellum.toggleBlock';
  arguments: [string, string, string];
  range: LogicalBlock['range'];
}

export class BlockCodeLensProvider {
  private readonly store: BlockSelectionStore;
  constructor(store: BlockSelectionStore) { this.store = store; }

  toLensDtos(documentUri: string, analysisId: string, blocks: LogicalBlock[]): CodeLensDto[] {
    this.store.prepare(documentUri, analysisId);
    return blocks.map(block => ({
      title: `${this.store.isSelected(documentUri, block.id, analysisId) ? '☑' : '☐'} Explicar: ${block.action}`,
      command: 'sintellum.toggleBlock',
      arguments: [documentUri, block.id, analysisId],
      range: block.range
    }));
  }
}

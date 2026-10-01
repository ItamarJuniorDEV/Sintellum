import type { FlowGraph } from '../core/model.ts';
import { stableHash } from '../core/hashing.ts';

export class StalenessService {
  private readonly readSource: (uri: string) => Promise<string>;
  constructor(readSource: (uri: string) => Promise<string>) { this.readSource = readSource; }
  async check(graph: FlowGraph): Promise<{ stale: boolean; changedUris: string[] }> {
    const changedUris: string[] = [];
    for (const [uri, previousHash] of Object.entries(graph.sourceHashes)) {
      try {
        const current = await this.readSource(uri);
        if (stableHash(current) !== previousHash) changedUris.push(uri);
      } catch { changedUris.push(uri); }
    }
    return { stale: changedUris.length > 0, changedUris };
  }
}

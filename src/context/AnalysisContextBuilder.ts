import { readFile } from 'node:fs/promises';
import { PhpAnalyzer } from '../analyzer/php/PhpAnalyzer.ts';
import { LaravelRelationResolver } from '../analyzer/laravel/LaravelRelationResolver.ts';

export class AnalysisContextBuilder {
  private readonly workspaceUri: string;
  constructor(workspaceUri: string) { this.workspaceUri = workspaceUri; }
  async build(seedUri: string, selectedBlockIds?: string[]) {
    const source = await readFile(new URL(seedUri), 'utf8');
    const base = new PhpAnalyzer().analyze(seedUri, source);
    const resolved = await new LaravelRelationResolver(this.workspaceUri).resolve(seedUri, base);
    if (!selectedBlockIds?.length) return resolved;
    return { ...resolved, blocks: resolved.blocks.filter(b => selectedBlockIds.includes(b.id)) };
  }
}

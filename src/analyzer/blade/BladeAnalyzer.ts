import type { AnalysisResult } from '../../core/model.ts';
import type { Confidence } from '../../core/model.ts';
import type { Evidence } from '../../core/evidence.ts';
import { stableHash } from '../../core/hashing.ts';

interface BladeFact {
  kind: 'extends' | 'include' | 'route' | 'component' | 'form';
  target?: string;
  confidence: Confidence;
  evidence: Evidence;
  dynamic?: boolean;
}

function parseQuotedArgument(text: string, functionName: string): { value?: string; dynamic: boolean } | undefined {
  const start = text.indexOf(functionName + '(');
  if (start < 0) return undefined;
  let i = start + functionName.length + 1;
  while (i < text.length && /\s/.test(text[i])) i++;
  const quote = text[i];
  if (quote !== "'" && quote !== '"') return { dynamic: true };
  i++;
  let value = '';
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) { value += text[i + 1]; i += 2; continue; }
    if (ch === quote) return { value, dynamic: false };
    value += ch; i++;
  }
  return { dynamic: true };
}

export class BladeAnalyzer {
  async analyze(uri: string, source: string): Promise<AnalysisResult> {
    const facts: BladeFact[] = [];
    const lines = source.split(/\r?\n/);
    const add = (line: number, kind: BladeFact['kind'], target: string | undefined, dynamic: boolean) => {
      const evidence: Evidence = { uri, range: { start: { line, character: 0 }, end: { line, character: lines[line]?.length ?? 0 } }, origin: 'blade', excerpt: lines[line]?.trim() };
      facts.push({ kind, target, dynamic, confidence: dynamic ? 'probable' : 'confirmed', evidence });
    };

    for (let line = 0; line < lines.length; line++) {
      const text = lines[line];
      for (const [needle, kind] of [['@extends','extends'], ['@include','include'], ['route','route']] as const) {
        if (!text.includes(needle + '(')) continue;
        const parsed = parseQuotedArgument(text, needle);
        if (parsed) add(line, kind, parsed.value, parsed.dynamic);
      }
      const dynamicComponent = text.includes('<x-dynamic-component');
      if (dynamicComponent) add(line, 'component', undefined, true);
      const componentStart = text.indexOf('<x-');
      if (componentStart >= 0 && !dynamicComponent) {
        let i = componentStart + 3; let name = '';
        while (i < text.length && /[A-Za-z0-9_.:-]/.test(text[i])) name += text[i++];
        if (name) add(line, 'component', name, false);
      }
      if (/<form\b/i.test(text)) add(line, 'form', undefined, false);
    }

    return { rootUri: uri, blocks: [], nodes: [], edges: [], sourceHashes: { [uri]: stableHash(source) }, facts };
  }
}

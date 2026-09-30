import type { AnalysisResult } from '../../core/model.ts';
import type { Evidence, SourceRange } from '../../core/evidence.ts';
import type { PhpFact } from './PhpFacts.ts';
import { stableHash } from '../../core/hashing.ts';

interface Token { value: string; line: number; column: number; }

function tokenizePhp(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0, line = 0, column = 0;
  const push = (value: string, startLine: number, startColumn: number) => tokens.push({ value, line: startLine, column: startColumn });
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\n') { i++; line++; column = 0; continue; }
    if (/\s/.test(ch)) { i++; column++; continue; }
    if (ch === '/' && source[i + 1] === '/') { while (i < source.length && source[i] !== '\n') { i++; column++; } continue; }
    if (ch === '/' && source[i + 1] === '*') { i += 2; column += 2; while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) { if (source[i] === '\n') { line++; column = 0; i++; } else { i++; column++; } } i += 2; column += 2; continue; }
    if (ch === '#' ) { while (i < source.length && source[i] !== '\n') { i++; column++; } continue; }
    if (ch === '"' || ch === "'") {
      const quote = ch, sl = line, sc = column; let value = quote; i++; column++;
      while (i < source.length) { const c = source[i]; value += c; i++; column++; if (c === '\\' && i < source.length) { value += source[i]; i++; column++; continue; } if (c === quote) break; if (c === '\n') { line++; column = 0; } }
      push(value, sl, sc); continue;
    }
    const two = source.slice(i, i + 2);
    if (['->','::','=>','??','?->'].includes(two)) { push(two, line, column); i += 2; column += 2; continue; }
    if (ch === '$') {
      const sl = line, sc = column; let value = '$'; i++; column++;
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) { value += source[i++]; column++; }
      push(value, sl, sc); continue;
    }
    if (/[A-Za-z_\\]/.test(ch)) {
      const sl = line, sc = column; let value = '';
      while (i < source.length && /[A-Za-z0-9_\\]/.test(source[i])) { value += source[i++]; column++; }
      push(value, sl, sc); continue;
    }
    push(ch, line, column); i++; column++;
  }
  return tokens;
}

function rangeForLine(source: string, line: number): SourceRange {
  const text = source.split(/\r?\n/)[line] ?? '';
  return { start: { line, character: 0 }, end: { line, character: text.length } };
}

export class PhpAnalyzer {
  analyze(uri: string, source: string): AnalysisResult {
    const tokens = tokenizePhp(source);
    const facts: PhpFact[] = [];
    const add = (fact: Omit<PhpFact, 'uri' | 'range'> & { line: number }) => facts.push({ ...fact, uri, range: rangeForLine(source, fact.line) });

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.value === 'namespace') {
        const parts: string[] = []; let j = i + 1;
        while (tokens[j] && tokens[j].value !== ';' && tokens[j].value !== '{') parts.push(tokens[j++].value);
        add({ kind: 'namespace', fqcn: parts.join(''), line: t.line });
      }
      if (t.value === 'use') {
        const parts: string[] = []; let alias: string | undefined; let j = i + 1;
        while (tokens[j] && tokens[j].value !== ';') {
          if (tokens[j].value.toLowerCase() === 'as') { alias = tokens[j + 1]?.value; j += 2; continue; }
          parts.push(tokens[j++].value);
        }
        const fqcn = parts.join('');
        if (fqcn && !fqcn.includes('$')) add({ kind: 'import', fqcn, alias: alias ?? fqcn.split('\\').pop(), line: t.line });
      }
      if (t.value === 'class' && tokens[i + 1]) add({ kind: 'class', name: tokens[i + 1].value, line: t.line });
      if (t.value === 'function' && tokens[i + 1]) {
        const methodName = tokens[i + 1].value; add({ kind: 'method', name: methodName, line: t.line });
        let j = i + 2; while (tokens[j] && tokens[j].value !== '(') j++;
        if (tokens[j]?.value === '(') {
          j++;
          while (tokens[j] && tokens[j].value !== ')') {
            let visibility: string | undefined;
            if (['private','protected','public','readonly'].includes(tokens[j].value)) { visibility = tokens[j].value; j++; }
            const type = tokens[j]?.value;
            const variable = tokens[j + 1]?.value;
            if (type && variable?.startsWith('$')) {
              add({ kind: methodName === '__construct' && visibility ? 'property' : 'parameter', type, name: variable.slice(1), variable, line: tokens[j].line });
              j += 2;
            } else j++;
            while (tokens[j] && ![',',')'].includes(tokens[j].value)) j++;
            if (tokens[j]?.value === ',') j++;
          }
        }
      }
      if (t.value.startsWith('$') && (tokens[i + 1]?.value === '->' || tokens[i + 1]?.value === '?->') && tokens[i + 2] && tokens[i + 3]?.value === '(') {
        add({ kind: 'method_call', receiver: t.value.slice(1), method: tokens[i + 2].value, line: t.line });
      }
      if (t.value === '$this' && tokens[i + 1]?.value === '->' && tokens[i + 2] && tokens[i + 3]?.value === '->' && tokens[i + 4] && tokens[i + 5]?.value === '(') {
        add({ kind: 'method_call', receiver: tokens[i + 2].value, method: tokens[i + 4].value, line: t.line });
      }
      if (/^[A-Za-z_][A-Za-z0-9_\\]*$/.test(t.value) && tokens[i + 1]?.value === '(' && !['if','for','foreach','while','switch','function'].includes(t.value)) {
        add({ kind: 'function_call', name: t.value, line: t.line });
      }
      if (t.value === 'new' && tokens[i + 1]) add({ kind: 'new', type: tokens[i + 1].value, line: t.line });
      if (t.value === 'return') add({ kind: 'return', line: t.line, text: source.split(/\r?\n/)[t.line]?.trim() });
      if (t.value.startsWith('$') && tokens[i + 1]?.value === '=') add({ kind: 'assignment', variable: t.value.slice(1), line: t.line });
    }

    const evidence: Evidence[] = facts.map(f => ({ uri, range: f.range, origin: 'ast', excerpt: source.split(/\r?\n/)[f.range.start.line]?.trim() }));
    return { rootUri: uri, blocks: [], nodes: [], edges: [], sourceHashes: { [uri]: stableHash(source) }, facts: facts.map((f, idx) => ({ ...f, evidence: evidence[idx] })) };
  }
}

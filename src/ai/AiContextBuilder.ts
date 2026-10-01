import type { LogicalBlock } from '../core/model.ts';
import type { AiContextPackage } from './AiProvider.ts';

const SECRET_NAME = /(api[_-]?key|token|secret|password|passwd|authorization|private[_-]?key)/i;

export function redactSecrets(source: string): string {
  return source.split(/\r?\n/).map(line => {
    const assignment = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$/);
    if (assignment && SECRET_NAME.test(assignment[1])) return `${assignment[1]}=${'[REDACTED]'}`;
    const jsLike = line.match(/^(.*?\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*)(['"])(.*?)(\3)(.*)$/);
    if (jsLike && SECRET_NAME.test(jsLike[2])) return `${jsLike[1]}${jsLike[3]}[REDACTED]${jsLike[5]}${jsLike[6]}`;
    const phpLike = line.match(/^(.*?\$([A-Za-z_][A-Za-z0-9_]*)\s*=\s*)(['"])(.*?)(\3)(.*)$/);
    if (phpLike && SECRET_NAME.test(phpLike[2])) return `${phpLike[1]}${phpLike[3]}[REDACTED]${phpLike[5]}${phpLike[6]}`;
    return line;
  }).join('\n');
}

export interface AiBuildInput { blocks: LogicalBlock[]; sources: Record<string,string>; signatures: string[]; }
export class AiContextBuilder {
  build(input: AiBuildInput): AiContextPackage {
    const blocks = input.blocks.map(block => {
      const source = input.sources[block.uri] ?? '';
      const lines = source.split(/\r?\n/);
      const start = Math.max(0, block.range.start.line);
      const end = Math.min(lines.length - 1, Math.max(start, block.range.end.line));
      const selected = lines.slice(start, end + 1).join('\n');
      return { id:block.id, source:redactSecrets(selected), facts:block.evidence.map(e => `${block.confidence}: ${e.origin}${e.note ? ` — ${e.note}` : ''}`) };
    });
    return { blocks, signatures: input.signatures.map(redactSecrets) };
  }
}

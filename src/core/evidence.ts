export interface Position { line: number; character: number; }
export interface SourceRange { start: Position; end: Position; }
export type EvidenceOrigin = 'ast' | 'route' | 'symbol' | 'blade' | 'user' | 'ai';
export interface Evidence {
  uri: string;
  range: SourceRange;
  origin: EvidenceOrigin;
  excerpt?: string;
  note?: string;
}

import type { SourceRange } from '../../core/evidence.ts';

export type PhpFactKind = 'namespace' | 'import' | 'class' | 'method' | 'parameter' | 'property' | 'method_call' | 'function_call' | 'new' | 'return' | 'assignment';

export interface PhpFact {
  kind: PhpFactKind;
  uri: string;
  range: SourceRange;
  name?: string;
  fqcn?: string;
  alias?: string;
  type?: string;
  variable?: string;
  receiver?: string;
  method?: string;
  text?: string;
}

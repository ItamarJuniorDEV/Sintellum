import { resolve, relative, isAbsolute } from 'node:path';

export function assertWorkspacePath(workspaceRoot: string, candidate: string): string {
  const root = resolve(workspaceRoot);
  const target = resolve(candidate);
  const rel = relative(root, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Acesso fora do workspace bloqueado');
  return target;
}

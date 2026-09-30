import { access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export type ComposerAutoload = Record<string, string | string[]>;

export class NamespaceResolver {
  private readonly workspaceUri: string;
  constructor(workspaceUri: string) { this.workspaceUri = workspaceUri; }

  async resolveClass(fqcn: string, mapping: ComposerAutoload): Promise<string | undefined> {
    const root = fileURLToPath(this.workspaceUri);
    const entries = Object.entries(mapping).sort(([a], [b]) => b.length - a.length);
    for (const [prefix, dirs] of entries) {
      if (!fqcn.startsWith(prefix)) continue;
      const rest = fqcn.slice(prefix.length).replaceAll('\\', '/') + '.php';
      for (const dir of Array.isArray(dirs) ? dirs : [dirs]) {
        const candidate = resolve(root, dir, rest);
        try { await access(candidate); return pathToFileURL(candidate).href; } catch { /* try next mapping */ }
      }
    }
    return undefined;
  }
}

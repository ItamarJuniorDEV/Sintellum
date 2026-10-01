import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export class LaravelProjectDetector {
  async detect(workspaceUri: string): Promise<boolean> {
    try {
      const raw = await readFile(resolve(fileURLToPath(workspaceUri), 'composer.json'), 'utf8');
      const composer = JSON.parse(raw) as { require?: Record<string, string>; };
      return typeof composer.require?.['laravel/framework'] === 'string';
    } catch { return false; }
  }
}

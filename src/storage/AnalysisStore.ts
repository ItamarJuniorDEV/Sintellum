import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute } from 'node:path';
import type { FlowGraph } from '../core/model.ts';
import { validateFlowGraph } from '../core/model.ts';

export interface WorkspaceStateLike {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Promise<void>;
}

export class MemoryWorkspaceState implements WorkspaceStateLike {
  private readonly values = new Map<string, unknown>();
  get<T>(key: string): T | undefined { return this.values.get(key) as T | undefined; }
  async update(key: string, value: unknown): Promise<void> { this.values.set(key, value); }
}

async function assertNoSymlinkComponents(root: string, candidate: string): Promise<void> {
  const rel = relative(root, candidate);
  const parts = rel.split(/[\\/]+/).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) throw new Error('Caminho de segurança contém symlink');
    } catch (error) {
      if (error instanceof Error && /symlink/.test(error.message)) throw error;
    }
  }
}

function assertInside(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Caminho fora do workspace bloqueado');
}

export class AnalysisStore {
  private readonly rootPath: string;
  private readonly state: WorkspaceStateLike;
  constructor(workspaceUri: string, state: WorkspaceStateLike) {
    this.rootPath = fileURLToPath(workspaceUri);
    this.state = state;
  }

  async save(graph: FlowGraph, target: 'workspaceState' | 'project'): Promise<void> {
    if (!validateFlowGraph(graph)) throw new Error('FlowGraph inválido');
    if (target === 'workspaceState') {
      await this.state.update(`analysis:${graph.id}`, graph);
      return;
    }
    const dir = resolve(this.rootPath, '.sintellum', 'analyses');
    const file = resolve(dir, `${safeId(graph.id)}.json`);
    assertInside(this.rootPath, file);
    await assertNoSymlinkComponents(this.rootPath, dir);
    await mkdir(dir, { recursive: true });
    await writeFile(file, JSON.stringify(graph, null, 2), 'utf8');
  }

  async load(id: string): Promise<FlowGraph | undefined> {
    const local = this.state.get<FlowGraph>(`analysis:${id}`);
    if (local) return local;
    const file = resolve(this.rootPath, '.sintellum', 'analyses', `${safeId(id)}.json`);
    assertInside(this.rootPath, file);
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'));
      return parsed as FlowGraph;
    } catch { return undefined; }
  }
}

function safeId(id: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new Error('Identificador de análise inválido');
  return id;
}

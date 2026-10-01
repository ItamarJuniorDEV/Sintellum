import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AnalysisStore, MemoryWorkspaceState } from '../../../src/storage/AnalysisStore.ts';

const graph: any = { schemaVersion: 1, id: 'g1', rootUri: 'file:///x.php', nodes: [], edges: [], sourceHashes: {} };

test('project mode grava JSON versionado em .sintellum; local mode não grava arquivo', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sintellum-'));
  const memory = new MemoryWorkspaceState();
  const store = new AnalysisStore(pathToFileURL(dir + '/').href, memory);
  await store.save(graph, 'workspaceState');
  assert.equal((await store.load('g1'))?.id, 'g1');
  await assert.rejects(() => readFile(join(dir, '.sintellum/analyses/g1.json'), 'utf8'));
  await store.save(graph, 'project');
  const raw = JSON.parse(await readFile(join(dir, '.sintellum/analyses/g1.json'), 'utf8'));
  assert.equal(raw.schemaVersion, 1);
  await rm(dir, { recursive: true, force: true });
});

import { symlink } from 'node:fs/promises';

test('project mode bloqueia .sintellum como symlink para fora do workspace', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sintellum-root-'));
  const outside = await mkdtemp(join(tmpdir(), 'sintellum-outside-'));
  await symlink(outside, join(dir, '.sintellum'), 'dir');
  const store = new AnalysisStore(pathToFileURL(dir + '/').href, new MemoryWorkspaceState());
  await assert.rejects(() => store.save(graph, 'project'), /symlink|workspace|seguran/i);
  await rm(dir, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

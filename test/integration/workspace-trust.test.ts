import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceSecurityPolicy } from '../../src/security/WorkspaceSecurityPolicy.ts';

test('workspace não confiável permite análise determinística mas bloqueia cloud e persistência no projeto', () => {
  const policy = new WorkspaceSecurityPolicy(false);
  assert.equal(policy.canReadWorkspaceForStaticAnalysis(), true);
  assert.equal(policy.canPersistToProject(), false);
  assert.equal(policy.canUseCloudAi(), false);
  assert.equal(policy.canUseLocalAi(), false);
});

test('workspace confiável ainda exige configuração explícita para cloud', () => {
  const policy = new WorkspaceSecurityPolicy(true);
  assert.equal(policy.canUseCloudAi(false), false);
  assert.equal(policy.canUseCloudAi(true), true);
});

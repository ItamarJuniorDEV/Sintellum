import test from 'node:test';
import assert from 'node:assert/strict';
import { assertWorkspacePath } from '../../src/security/PathGuard.ts';
import { isSafeWebviewMessage } from '../../src/security/WebviewMessageGuard.ts';

test('path traversal para fora do workspace é bloqueado', () => {
  assert.throws(() => assertWorkspacePath('/safe/project', '/safe/secret/../outside/file.php'), /workspace/i);
  assert.doesNotThrow(() => assertWorkspacePath('/safe/project', '/safe/project/app/A.php'));
});

test('mensagens de webview aceitam apenas ações e campos previstos', () => {
  assert.equal(isSafeWebviewMessage({ type: 'node:update', id: 'n1', patch: { action: 'Novo' } }), true);
  assert.equal(isSafeWebviewMessage({ type: 'run:command', command: 'rm -rf /' }), false);
  assert.equal(isSafeWebviewMessage({ type: '__proto__', payload: {} }), false);
});

test('resultado PNG do webview exige base64 limitado e não aceita payload arbitrário', () => {
  assert.equal(isSafeWebviewMessage({ type: 'png:render-result', data: 'iVBORw0KGgo=' }), true);
  assert.equal(isSafeWebviewMessage({ type: 'png:render-result', data: '<script>alert(1)</script>' }), false);
  assert.equal(isSafeWebviewMessage({ type: 'png:render-result', data: 'A'.repeat(21_000_000) }), false);
});

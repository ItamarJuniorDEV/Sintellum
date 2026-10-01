import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NamespaceResolver } from '../../../src/analyzer/laravel/NamespaceResolver.ts';

test('resolve FQCN por PSR-4 sem first-file-wins', async () => {
  const root = resolve('test/fixtures/laravel-basic');
  const resolver = new NamespaceResolver(pathToFileURL(root + '/').href);
  const mapping = { 'App\\': 'app/' };
  const service = await resolver.resolveClass('App\\Services\\OrderService', mapping);
  const alternate = await resolver.resolveClass('App\\Alternate\\OrderService', mapping);
  assert.match(service ?? '', /app\/Services\/OrderService\.php$/);
  assert.match(alternate ?? '', /app\/Alternate\/OrderService\.php$/);
  assert.notEqual(service, alternate);
});

type PlainObject = Record<string, unknown>;
const nodePatchKeys = new Set(['actor','action','input','output','why']);

function isObject(value: unknown): value is PlainObject {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function isSafeWebviewMessage(value: unknown): boolean {
  if (!isObject(value) || typeof value.type !== 'string') return false;
  if (value.type === 'node:edit-request') return typeof value.id === 'string' && value.id.length <= 256;
  if (value.type === 'node:update') {
    if (typeof value.id !== 'string' || value.id.length > 256 || !isObject(value.patch)) return false;
    const entries = Object.entries(value.patch);
    if (entries.length === 0) return false;
    return entries.every(([key, item]) => nodePatchKeys.has(key) && typeof item === 'string' && item.length <= 4000);
  }
  if (value.type === 'edge:update') {
    return typeof value.id === 'string' && isObject(value.patch) && Object.keys(value.patch).every(key => ['condition','type'].includes(key));
  }
  if (value.type === 'edge:create') return typeof value.from === 'string' && typeof value.to === 'string';
  if (value.type === 'element:delete') return typeof value.id === 'string';
  if (value.type === 'png:render-result') {
    return typeof value.data === 'string' && value.data.length > 0 && value.data.length <= 20_000_000 && /^[A-Za-z0-9+/]*={0,2}$/.test(value.data);
  }
  if (value.type === 'flow:save') return true;
  return false;
}

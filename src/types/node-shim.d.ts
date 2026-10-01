declare module 'node:fs/promises' {
  export function access(path: string): Promise<void>;
  export function readFile(path: string | URL, encoding: string): Promise<string>;
  export function writeFile(path: string | URL, data: string, encoding: string): Promise<void>;
  export function mkdir(path: string | URL, options?: { recursive?: boolean }): Promise<void>;
  export function lstat(path: string | URL): Promise<{ isSymbolicLink(): boolean }>;
}
declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
  export function pathToFileURL(path: string): URL;
}
declare module 'node:path' {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function normalize(path: string): string;
  export function relative(from: string, to: string): string;
  export function isAbsolute(path: string): boolean;
  export const sep: string;
}

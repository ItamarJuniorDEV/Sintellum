import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const stage = await mkdtemp(join(tmpdir(), 'sintellum-vsix-'));
const extensionDir = join(stage, 'extension');
await mkdir(extensionDir, { recursive: true });
for (const entry of ['dist','package.json','README.md','LICENSE','SECURITY.md','CHANGELOG.md','resources']) {
  await cp(join(root, entry), join(extensionDir, entry), { recursive: true });
}
await mkdir(join(extensionDir, 'docs'), { recursive: true });
for (const entry of ['architecture.md','privacy.md','providers.md']) {
  await cp(join(root, 'docs', entry), join(extensionDir, 'docs', entry));
}
try { await cp(join(root, 'docs', 'assets'), join(extensionDir, 'docs', 'assets'), { recursive: true }); } catch {}
const manifest = `<?xml version="1.0" encoding="utf-8"?>\n<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">\n<Metadata><Identity Language="en-US" Id="${pkg.name}" Version="${pkg.version}" Publisher="${pkg.publisher}"/><DisplayName>${pkg.displayName}</DisplayName><Description xml:space="preserve">${pkg.description}</Description><Categories>Other</Categories><Properties><Property Id="Microsoft.VisualStudio.Code.Engine" Value="${pkg.engines.vscode}"/></Properties></Metadata>\n<Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/></Assets>\n</PackageManifest>`;
await writeFile(join(stage, 'extension.vsixmanifest'), manifest, 'utf8');
await writeFile(join(stage, '[Content_Types].xml'), `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="js" ContentType="application/javascript"/><Default Extension="map" ContentType="application/json"/><Default Extension="svg" ContentType="image/svg+xml"/><Override PartName="/extension.vsixmanifest" ContentType="text/xml"/></Types>`, 'utf8');
const output = resolve(root, `${pkg.name}-${pkg.version}.vsix`);
try { await rm(output, { force: true }); } catch {}
execFileSync('zip', ['-q','-r', output, '[Content_Types].xml','extension.vsixmanifest','extension'], { cwd: stage });
await rm(stage, { recursive: true, force: true });
console.log(output);

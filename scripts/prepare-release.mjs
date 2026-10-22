import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Build the release artifact only after semantic-release has chosen its version. */
export function prepareRelease(version, cwd = process.cwd(), run = execFileSync) {
  // Chrome manifest versions are numeric, not arbitrary shell input or prereleases.
  if (!/^\d+\.\d+\.\d+$/.test(version) ||
      version.split('.').some(part => Number(part) > 65535)) {
    throw new Error('Expected a stable three-part Chrome extension version');
  }
  const manifestPath = join(cwd, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  run('npm', ['run', 'build'], { cwd, stdio: 'inherit' });
  const dist = join(cwd, 'dist');
  const builtManifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
  if (builtManifest.version !== version) {
    throw new Error('Built manifest version does not match the release');
  }

  // zip updates existing archives; remove an old build so deleted assets cannot linger.
  const archive = join(cwd, 'dify-monkey-extension.zip');
  rmSync(archive, { force: true });
  run('zip', ['-r', archive, '.'], { cwd: dist, stdio: 'inherit' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  prepareRelease(process.argv[2]);
}

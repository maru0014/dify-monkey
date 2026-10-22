// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareRelease } from '../../../scripts/prepare-release.mjs';

const dirs = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'dify-release-test-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ manifest_version: 3, version: '0.3.0' }));
  mkdirSync(join(dir, 'dist'));
  return dir;
}
afterEach(() => dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe('release packaging', () => {
  it('sets the version before building and removes stale archives before packaging', () => {
    const cwd = fixture();
    writeFileSync(join(cwd, 'dify-monkey-extension.zip'), 'stale');
    const run = vi.fn((command, args, options) => {
      if (command === 'npm') {
        expect(args).toEqual(['run', 'build']);
        expect(JSON.parse(readFileSync(join(cwd, 'manifest.json'), 'utf8')).version).toBe('0.3.2');
        writeFileSync(join(cwd, 'dist/manifest.json'), readFileSync(join(cwd, 'manifest.json')));
      } else {
        expect(command).toBe('zip');
        expect(args).toEqual(['-r', join(cwd, 'dify-monkey-extension.zip'), '.']);
        expect(options.cwd).toBe(join(cwd, 'dist'));
        expect(existsSync(join(cwd, 'dify-monkey-extension.zip'))).toBe(false);
      }
    });
    prepareRelease('0.3.2', cwd, run);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it.each(['0.3.2-beta.1', '0.3.2;touch injected', '65536.1.1', undefined])('rejects invalid versions: %s', version => {
    const run = vi.fn();
    expect(() => prepareRelease(version, fixture(), run)).toThrow('stable three-part');
    expect(run).not.toHaveBeenCalled();
  });
  it('does not archive if the build fails', () => {
    const run = vi.fn(() => { throw new Error('build failed'); });
    expect(() => prepareRelease('0.3.2', fixture(), run)).toThrow('build failed');
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('does not archive a mismatched built version', () => {
    const cwd = fixture();
    writeFileSync(join(cwd, 'dist/manifest.json'), '{"version":"0.3.0"}');
    const run = vi.fn();
    expect(() => prepareRelease('0.3.2', cwd, run)).toThrow('does not match');
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('uses the prepare hook instead of pre-version workflow packaging', () => {
    const config = JSON.parse(readFileSync('.releaserc.json', 'utf8'));
    expect(config.plugins.find(p => p[0] === '@semantic-release/exec')[1].prepareCmd)
      .toBe('node scripts/prepare-release.mjs ${nextRelease.version}');
    const workflow = readFileSync('.github/workflows/release.yml', 'utf8');
    expect(workflow).not.toContain('zip -r');
    expect(workflow).not.toContain('run: npm run build');
  });
});

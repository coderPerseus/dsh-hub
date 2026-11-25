import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { CatalogPlugin } from '../packages/catalog/src/index';
import { buildDshHubPlugin, withDshHubPluginDistribution } from './lib/dshhub-plugin-distribution.mts';

test('publishes a shell-safe, standalone native plugin without changing other catalog entries', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const output = await mkdtemp(path.join(tmpdir(), 'dshhub-plugin-test-'));
  try {
    const packaged = await buildDshHubPlugin(root, output);
    const archive = path.join(output, packaged.assetPath);
    assert.match(packaged.url, /^https:\/\/dshhub\.org\/downloads\/dshhubs-plugin-search-\d+\.\d+\.\d+-[a-f0-9]{16}\.tgz$/);
    assert.ok((await readFile(archive)).length > 0);
    const extract = (name: string) => execFileSync('tar', ['-xOf', archive, 'package/' + name], {encoding: 'utf8'});
    const manifest = JSON.parse(extract('package.json'));
    assert.equal(manifest.name, '@dshhubs/plugin-search');
    assert.equal(manifest.version, packaged.version);
    assert.equal(manifest.dependencies, undefined, 'workspace client must be bundled, not installed from npm');
    assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
    assert.ok(extract(manifest.main).includes('Catalog index shard does not match its directory'));
    assert.ok(extract('cordis.patch.yml').includes('@dshhubs/plugin-search'));

    const previous = {id: 'github:coderPerseus/dsh-hub:packages/dsh-plugin',
      package: {name: '@dshhubs/plugin-search', version: '0.1.0'}, installation: {command: 'broken'}, usage: {}} as CatalogPlugin;
    const self = withDshHubPluginDistribution(previous, packaged);
    assert.equal(self.package.version, packaged.version);
    assert.ok(self.installation.command?.endsWith("add '" + packaged.url + "'"));
    assert.ok(self.usage.markdown.includes(self.installation.command!));
    assert.equal(previous.installation.command, 'broken');
    const unrelated = {...previous, id: 'github:someone/dsh-hub:packages/dsh-plugin'};
    assert.equal(withDshHubPluginDistribution(unrelated, packaged), unrelated);
  } finally {
    await rm(output, {recursive: true, force: true});
  }
});

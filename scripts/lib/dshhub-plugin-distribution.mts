import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { build } from 'esbuild';
import type { CatalogPlugin } from '../../packages/catalog/src/index';

const selfId = 'github:coderPerseus/dsh-hub:packages/dsh-plugin';
const exec = promisify(execFile);

export async function buildDshHubPlugin(root: string, output: string) {
  const source = path.join(root, 'packages/dsh-plugin');
  const { name, version, description, type, main, dsh, engines, peerDependencies, license, repository } =
    JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
  if (name !== '@dshhubs/plugin-search' || !/^\d+\.\d+\.\d+$/.test(version) || main !== 'lib/index.js') {
    throw new Error('Unexpected DSH Hub plugin package metadata');
  }

  const stage = await mkdtemp(path.join(tmpdir(), 'dshhub-plugin-pack-'));
  try {
    // Bundle the exact workspace client, not the incompatible npm package. The
    // host still supplies Cordis and the tool runtime via peer dependencies.
    await build({
      entryPoints: [path.join(source, 'src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'esm',
      external: Object.keys(peerDependencies),
      alias: {'@dshhubs/client': path.join(root, 'packages/client/src/index.ts')},
      outfile: path.join(stage, main),
    });
    await cp(path.join(source, 'cordis.patch.yml'), path.join(stage, 'cordis.patch.yml'));
    await writeFile(path.join(stage, 'package.json'), JSON.stringify({
      name, version, description, type, main, exports: './lib/index.js',
      files: ['lib', 'cordis.patch.yml'], dsh, engines, peerDependencies, license, repository,
    }));
    const {stdout} = await exec('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', stage], {cwd: stage});
    const [{filename}] = JSON.parse(stdout);
    if (filename !== `dshhubs-plugin-search-${version}.tgz`) throw new Error('Unexpected DSH Hub plugin archive name');
    const bytes = await readFile(path.join(stage, filename));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const assetPath = `/downloads/dshhubs-plugin-search-${version}-${hash}.tgz`;
    await mkdir(path.join(output, 'downloads'), {recursive: true});
    await writeFile(path.join(output, assetPath), bytes);
    return {version, url: 'https://dshhub.org' + assetPath, assetPath};
  } finally {
    await rm(stage, {recursive: true, force: true});
  }
}

export function withDshHubPluginDistribution(plugin: CatalogPlugin, distribution: {url: string; version: string}): CatalogPlugin {
  if (plugin.id.toLowerCase() !== selfId.toLowerCase() || plugin.package.name !== '@dshhubs/plugin-search') return plugin;
  const {url, version} = distribution;
  const command = `npx -p @deepseek-ai/dsh@0.2.2-rc.5 dsh plugin --profile web add '${url}'`;
  const markdown = `## Installation\n\n\`\`\`bash\n${command}\n\`\`\`\n\nThis DSH Hub package includes the client for the sharded catalog.\n\n## Usage\n\n- \`search_dsh_plugins\` searches by keyword or category.\n- \`get_dsh_plugin\` looks up a plugin by its exact slug.`;
  return {
    ...plugin,
    package: {...plugin.package, version},
    installation: {...plugin.installation, kind: 'manual', spec: url, command, markdown,
      notes: ['Packaged and hosted by DSH Hub; no workspace or npm client install required.']},
    usage: {...plugin.usage, markdown, readmeUrl: 'https://github.com/coderPerseus/dsh-hub/blob/main/packages/dsh-plugin/README.md'},
  };
}

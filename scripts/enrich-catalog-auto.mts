import { spawn } from 'node:child_process';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { enrichWithFallback } from './lib/enrichment-fallback.mjs';

const root = path.resolve(import.meta.dirname, '..');
const tsxCli = createRequire(path.join(root, 'apps/web/package.json')).resolve('tsx/cli');
const lockPath = path.join(root, '.catalog/enrichment-auto.lock');
await mkdir(path.dirname(lockPath), {recursive:true});
try {
  await writeFile(lockPath, String(process.pid), {flag:'wx',mode:0o600});
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
    throw new Error('Another enrichment run may be active. Check the PID in .catalog/enrichment-auto.lock before removing a stale lock.');
  }
  throw error;
}
try {
  process.exitCode = await enrichWithFallback(async provider => {
    const env = {...process.env, CATALOG_ENRICH_PROVIDER:provider,
      CATALOG_ENRICH_MODEL:provider === 'codex' ? 'gpt-5.3-codex-spark' : 'gemini-3.5-flash',
      MIDWAY_API_KEY_FILE:process.env.MIDWAY_API_KEY_FILE || path.join(homedir(), '.config/dshhub/midway-api-key'),
    };
    if (provider === 'midway') {
      if (!process.env.MIDWAY_API_KEY && !(await readFile(env.MIDWAY_API_KEY_FILE,'utf8')).trim()) {
        throw new Error('Midway credential is empty');
      }
      console.log('Spark unavailable; completing uncached entries with Midway gemini-3.5-flash.');
    }
    // Saved entries are reused automatically; only missing or changed official sources are generated.
    return await new Promise<number>((resolve,reject) => {
      const child = spawn(process.execPath,[tsxCli, path.join(root,'scripts/enrich-catalog.mts'),
        '--concurrency','3','--batch-size','25', ...process.argv.slice(2)],{cwd:root,env,stdio:'inherit'});
      child.once('error',reject);
      child.once('exit',code => resolve(code ?? 1));
    });
  });
} finally {
  await unlink(lockPath);
}

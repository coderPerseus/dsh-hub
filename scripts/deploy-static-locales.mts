import { spawn } from 'node:child_process';
import path from 'node:path';
import { locales } from '../apps/web/src/lib/i18n/locales';
const root = path.resolve(import.meta.dirname, '..');
const ci = process.argv.includes('--ci');
const uploadOnly = process.argv.includes('--upload');
const requested = process.argv.find(x=>x.startsWith('--locale='))?.slice(9);
if (requested && !locales.includes(requested as typeof locales[number])) throw new Error('Unknown locale');
const configs = requested
  ? [`.static-build/wrangler-${requested}${ci ? '.ci' : ''}.json`]
  : [...locales.map(locale=>`.static-build/wrangler-${locale}${ci ? '.ci' : ''}.json`),ci ? 'wrangler.ci.jsonc' : 'wrangler.jsonc'];
// Publish locale pages and their own bundles before redirecting legacy URLs at the root.
for (const config of configs) {
  console.log(`Deploying ${config}`);
  await new Promise<void>((resolve,reject)=>{
    const child = spawn('pnpm',['exec','wrangler',...(uploadOnly ? ['versions','upload'] : ['deploy']),'--config',config],{
      cwd:path.join(root,'apps/web'),env:{...process.env,OPEN_NEXT_DEPLOY:'true'},stdio:'inherit',
    });
    child.on('error',reject);
    child.on('exit',code=>code===0 ? resolve() : reject(new Error(`Deployment failed: ${config} (${code})`)));
  });
}

import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,symlinkSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {expect,it,vi} from 'vitest';
import {enrichWithFallback,isSparkUnavailable} from '../../../scripts/lib/enrichment-fallback.mjs';

it('uses Spark alone while quota is available',async()=>{
  const run=vi.fn(async()=>0);
  expect(await enrichWithFallback(run)).toBe(0);
  expect(run.mock.calls).toEqual([['codex']]);
});
it('switches to Midway only after Spark reports unavailable quota/model',async()=>{
  const run=vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(0);
  expect(await enrichWithFallback(run)).toBe(0);
  expect(run.mock.calls).toEqual([['codex'],['midway']]);
});
it('does not hide output validation errors and propagates fallback failure',async()=>{
  const invalid=vi.fn(async()=>1);
  expect(await enrichWithFallback(invalid)).toBe(1);
  expect(invalid).toHaveBeenCalledTimes(1);
  expect(await enrichWithFallback(vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1))).toBe(1);
});
it('recognizes Spark exhaustion without treating arbitrary process errors as quota',()=>{
  for(const log of ['You have hit your usage limit','usage_limit_reached','insufficient_quota','The model is not supported','model_not_found']) expect(isSparkUnavailable(log)).toBe(true);
  expect(isSparkUnavailable('invalid_output missing:1')).toBe(false);
  expect(isSparkUnavailable('codex_exit_1')).toBe(false);
});

it('preserves the quota exit code across actual child processes and releases its lock',()=>{
  const root=path.resolve(import.meta.dirname,'../../..');
  const fixture=mkdtempSync(path.join(tmpdir(),'dshhub-enrichment-fallback-'));
  try {
    mkdirSync(path.join(fixture,'scripts/lib'),{recursive:true});
    mkdirSync(path.join(fixture,'apps/web'),{recursive:true});
    writeFileSync(path.join(fixture,'apps/web/package.json'),'{}');
    symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'));
    for(const file of ['enrich-catalog-auto.mts','lib/enrichment-fallback.mts']) {
      copyFileSync(path.join(root,'scripts',file),path.join(fixture,'scripts',file));
    }
    writeFileSync(path.join(fixture,'key'),'fixture-only');
    writeFileSync(path.join(fixture,'scripts/enrich-catalog.mts'),`
      import {appendFileSync} from 'node:fs';
      appendFileSync('providers',process.env.CATALOG_ENRICH_PROVIDER+'\\n');
      process.exit(process.env.CATALOG_ENRICH_PROVIDER==='codex'?2:0);
    `);
    const result=spawnSync(process.execPath,[createRequire(import.meta.url).resolve('tsx/cli'),path.join(fixture,'scripts/enrich-catalog-auto.mts')],{
      encoding:'utf8',env:{...process.env,MIDWAY_API_KEY_FILE:path.join(fixture,'key')},
    });
    expect(result.status,result.stderr).toBe(0);
    expect(readFileSync(path.join(fixture,'providers'),'utf8')).toBe('codex\nmidway\n');
    expect(existsSync(path.join(fixture,'.catalog/enrichment-auto.lock'))).toBe(false);
  } finally { rmSync(fixture,{recursive:true,force:true}); }
});

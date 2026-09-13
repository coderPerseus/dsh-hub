import {describe,it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'../../..');
function simulate(fail=false){
  const directory=mkdtempSync(path.join(tmpdir(),'dshhub-deploy-test-'));
  try{
    const log=path.join(directory,'events.jsonl');
    writeFileSync(path.join(directory,'pnpm'),`#!/usr/bin/env node
const fs=require('node:fs'); const config=process.argv.at(-1);
const event=type=>fs.appendFileSync(process.env.DEPLOY_TEST_LOG,JSON.stringify({type,config})+'\\n');
event('start');setTimeout(()=>{event('end');process.exit(process.env.DEPLOY_TEST_FAIL==='1'&&config.includes('zh-CN')?1:0);},100);
`,{mode:0o755});
    const result=spawnSync(process.execPath,[require.resolve('tsx/cli'),path.join(root,'scripts/deploy-static-locales.mts'),'--ci'],{cwd:root,encoding:'utf8',env:{...process.env,PATH:directory+path.delimiter+process.env.PATH,DEPLOY_TEST_LOG:log,DEPLOY_TEST_FAIL:fail?'1':'0'}});
    const events=readFileSync(log,'utf8').trim().split('\n').map(line=>JSON.parse(line));
    return {status:result.status,events};
  }finally{rmSync(directory,{recursive:true,force:true});}
}
describe('static locale rollout',()=>{
  it('uploads at most two locales concurrently and publishes root last',()=>{
    const {status,events}=simulate();expect(status).toBe(0);
    let active=0,max=0;for(const e of events){active+=e.type==='start'?1:-1;max=Math.max(max,active);}
    expect(max).toBe(2);expect(active).toBe(0);
    expect(events.filter(e=>e.type==='end')).toHaveLength(6);
    expect(events.at(-2)).toEqual({type:'start',config:'wrangler.ci.jsonc'});
    expect(events.at(-1)).toEqual({type:'end',config:'wrangler.ci.jsonc'});
  });
  it('does not change root redirects when a locale fails',()=>{
    const {status,events}=simulate(true);expect(status).not.toBe(0);
    expect(events.some(e=>e.config==='wrangler.ci.jsonc')).toBe(false);
  });
});

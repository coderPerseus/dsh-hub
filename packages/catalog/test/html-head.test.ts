import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {expect,it} from 'vitest';
import {readHtmlHead} from '../../../scripts/lib/read-html-head.mjs';

it('reads metadata beyond 8KB without including body metadata',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'dsh-head-'));
  try {
    const file=path.join(dir,'index.html');
    const head='<html><head><meta name="description" content="'+'中文说明'.repeat(1000)+'"><meta property="og:locale" content="zh_CN"></head>';
    await writeFile(file,head+'<body><meta name="fake"></body>');
    expect(await readHtmlHead(file)).toBe(head);
    await writeFile(file,'<html><head>incomplete');
    await expect(readHtmlHead(file)).rejects.toThrow('Missing closing head tag');
  } finally {await rm(dir,{recursive:true,force:true});}
});

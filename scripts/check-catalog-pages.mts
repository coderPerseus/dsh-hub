import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync, brotliCompressSync} from 'node:zlib';
import {locales} from '../apps/web/src/lib/i18n/locales';
import {localizedHref} from '../apps/web/src/lib/i18n/routing';
import {listingPath} from '../apps/web/src/lib/listing';
import {decodeBrowserIndex} from '../apps/web/src/lib/browser-index';
import {pluginDescription} from '../apps/web/src/lib/plugin-description';
import {searchStaticCatalog, type StaticIndex} from '../packages/client/src/static';
const root=new URL('../',import.meta.url).pathname;
const manifest=JSON.parse(await readFile(root+'apps/web/dist/catalog/manifest.json','utf8'));
const web=decodeBrowserIndex(JSON.parse(await readFile(root+'apps/web/dist'+manifest.browserIndexes.en,'utf8')));
const legacy:StaticIndex=JSON.parse(await readFile(root+'apps/web/dist'+manifest.index,'utf8'));
const allowed=new Set(web.items.map(p=>p.id));
const baseline={...legacy,items:[...new Map(legacy.items.filter(p=>allowed.has(p.id)).map(p=>[p.slug,p])).values()]};
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let checked=0;
for(const locale of locales){
  const base=root+'apps/web/.static-build/locales/'+locale;
  for(const category of [undefined,...web.categories.map(c=>c.id)]){
    const input={categories:category?[category]:[],locale};
    const ordered=baseline.items.filter(p=>!category||p.categories.includes(category)).sort((a,b)=>Number(b.featured)-Number(a.featured)||b.stars-a.stars||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    const count=ordered.length;
    const pages=Math.max(1,Math.ceil(count/24));
    for(let page=1;page<=pages;page++){
      const url=localizedHref(listingPath(category,page),locale);
      const html=await readFile(base+url+'index.html','utf8');
      const data=JSON.parse(html.match(/<script id="page-data" type="application\/json">(.*?)<\/script>/s)![1]);
      const expected={items:ordered.slice((page-1)*24,page*24)};
      assert.deepEqual(data.initial.items.map((p:any)=>p.id),expected.items.map(p=>p.id),url);
      assert.equal(data.listing.total,count);
      assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);
      assert(html.includes(`rel="canonical" href="https://dshhub.org${url}"`));
      if(page<pages)assert(html.includes(`href="${localizedHref(listingPath(category,page+1),locale)}"`));
      if(page>1)assert(html.includes(`href="${localizedHref(listingPath(category,page-1),locale)}"`));
      if(category)assert(data.initial.items.every((p:any)=>p.categories.includes(category)));
      checked++;
    }
  }
  const sample=await readFile(base+localizedHref('/plugins/'+web.items[0].slug,locale)+'index.html','utf8');
  const data=JSON.parse(sample.match(/<script id="page-data" type="application\/json">(.*?)<\/script>/s)![1]);
  const description=pluginDescription(data.plugin,locale);
  assert(sample.includes(`<meta name="description" content="${escape(description)}">`));
  assert(sample.includes(`<p class="detail-summary">${escape(description)}</p>`));
}
const sizes:Record<string,unknown>={};
for(const [name,file] of Object.entries({legacy:manifest.index,...manifest.browserIndexes}) as [string,string][]){
  const bytes=await readFile(root+'apps/web/dist'+file);
  sizes[name]={bytes:bytes.length,gzip:gzipSync(bytes).length,brotli:brotliCompressSync(bytes).length};
}
// Compare realistic query behavior on the full current catalog, in both languages.
for(const language of ['en','zh'] as const){
  const compact=decodeBrowserIndex(JSON.parse(await readFile(root+'apps/web/dist'+manifest.browserIndexes[language],'utf8')));
  for(const query of ['memory','agent','工作流','知识库','plugin','ssh','API','dsh-hub']){
    const input={query,locale:language==='zh'?'zh-CN' as const:'en' as const,sort:'stars' as const,limit:24};
    const expected=searchStaticCatalog(baseline,input),actual=searchStaticCatalog(compact,input);
    assert.deepEqual(actual.items.map(p=>[p.id,p.description,p.installCommand]),expected.items.map(p=>[p.id,p.description,p.installCommand]),query);
    assert.equal(actual.total,expected.total,query);
  }
}
console.log(JSON.stringify({checkedListingPages:checked,sizes},null,2));
await import('node:fs/promises').then(fs=>fs.writeFile(root+'.catalog/seo-validation.report.json',JSON.stringify({checkedListingPages:checked,sizes},null,2)));

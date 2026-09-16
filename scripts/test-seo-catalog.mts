import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {governCatalog} from './lib/catalog-governance.mts';
import {encodeBrowserIndex, decodeBrowserIndex} from '../apps/web/src/lib/browser-index';
import {pluginDescription} from '../apps/web/src/lib/plugin-description';
import {searchStaticCatalog, type StaticIndex} from '../packages/client/src/static';
import {localizedHref} from '../apps/web/src/lib/i18n/routing';
import {listingPath} from '../apps/web/src/lib/listing';
import type {CatalogPlugin} from '../packages/catalog/src/schema';
const source: CatalogPlugin = JSON.parse(await readFile(new URL('../.catalog/catalog.snapshot.json', import.meta.url),'utf8')).plugins.find((p: CatalogPlugin) => (p.usage.markdown || '').length > 160 && p.package.version);
const clone = (slug: string): CatalogPlugin => ({...structuredClone(source), id:'github:'+slug, slug, repository:{...source.repository,owner:slug.split('/')[0],name:slug.split('/')[1]}});
test('description includes analysis without duplication, and falls back to README', () => {
  const plugin = clone('test/plugin'); plugin.i18n = {'zh-CN':{description:'原有描述'}}; plugin.aiAnalysis = {'zh-CN':'AI 分析'};
  assert.equal(pluginDescription(plugin, 'zh-CN'), '原有描述 AI 分析');
  plugin.i18n['zh-CN'].description = '原有描述 AI 分析';
  assert.equal(pluginDescription(plugin, 'zh-TW'), '原有描述 AI 分析');
  plugin.i18n = {}; plugin.description = ''; plugin.aiAnalysis = {};
  assert(pluginDescription(plugin, 'en').length > 0);
});
test('same name does not establish equivalence; source-identical copies do', () => {
  const a = clone('a/plugin'), b = clone('b/plugin'), different = clone('c/plugin');
  different.repository.commit = 'f'.repeat(40); different.usage.markdown += '\nDifferent behavior';
  const result = governCatalog([different,b,a]);
  assert.equal(result.canonical.get(b.slug),a.slug);
  assert.equal(result.canonical.get(different.slug),different.slug);
  assert.equal(result.variants.get(a.slug)?.length,2);
  assert.equal(governCatalog([a,b,different]).canonical.get(b.slug),a.slug);
});
test('different package paths and missing evidence remain independent', () => {
  const a=clone('a/plugin'), b=clone('b/plugin'); b.id += ':other';
  assert.equal(governCatalog([a,b]).canonical.get(b.slug),b.slug);
  b.id='github:b/plugin'; b.package.version=null;
  assert.equal(governCatalog([a,b]).canonical.get(b.slug),b.slug);
});
test('compact index preserves cross-language queries, ordering, pagination and install commands', () => {
  const items = Array.from({length:30},(_,i) => ({id:`github:a/p${i}`,slug:`a/p${i}`,name:`Plugin ${i}`,packageName:`Plugin ${i}`,repositoryUrl:`https://github.com/a/p${i}`,description:'Task runner',descriptionZh:'任务工具',stars:i,pushedAt:'2026-09-12',featured:i===0,categories:[i%2?'agents':'development'],compatibilityStatus:'unknown' as const,compatibilityLevel:'unverified' as const,installCommand:`dsh add plugin${i}`,searchText:`plugin ${i} task runner workflow api`,searchTextZh:'任务工具 工作流 api'}));
  const index: StaticIndex={schemaVersion:1,snapshotId:'x',generatedAt:'2026-09-12',items,categories:[]};
  for (const locale of ['en','zh-CN'] as const) {
    const decoded=decodeBrowserIndex(encodeBrowserIndex(index,locale==='zh-CN'));
    for (const query of ['任务','API','workflow','Plugin 1','runner','missing']) {
      for (const sort of ['featured','stars','name','updated'] as const) {
        const input={query,sort,locale,categories:['agents'],cursor:btoa('2'),limit:5};
        const expected=searchStaticCatalog(index,input),actual=searchStaticCatalog(decoded,input);
        assert.deepEqual(actual.items.map(p=>[p.id,p.description,p.installCommand]),expected.items.map(p=>[p.id,p.description,p.installCommand]));
        assert.equal(actual.total,expected.total); assert.equal(actual.nextCursor,expected.nextCursor);
      }
    }
  }
});
test('category and paginated routes preserve locale and query fragments', () => {
  assert.equal(localizedHref(listingPath('agents',2),'en'),'/en/categories/agents/page/2/');
  assert.equal(localizedHref('/zh-CN/categories/agents/page/2/?q=test#catalog','ja'),'/ja/categories/agents/page/2/?q=test#catalog');
  assert.equal(localizedHref(listingPath(undefined,2),'en'),'/en/page/2/');
});
test('browser loader shares requests, retries after failure and recovers stale version URLs', async () => {
  const {loadBrowserIndex}=await import('../apps/web/src/lib/load-browser-index');
  const original=globalThis.fetch;
  const index:StaticIndex={schemaVersion:1,snapshotId:'new',generatedAt:'2026-09-16',items:[],categories:[]};
  const manifest={schemaVersion:1 as const,snapshotId:'old',generatedAt:'2026-09-16',pluginCount:0,index:'/old/index.json',details:[],browserIndexes:{en:'/old/browser-en.json',zh:'/old/browser-zh.json'}};
  const urls:string[]=[];
  try {
    globalThis.fetch=(async url=>{
      urls.push(String(url));
      if(url==='/old/browser-en.json')return new Response('',{status:404});
      if(url==='/catalog/manifest.json')return Response.json({...manifest,browserIndexes:{en:'/new/browser-en.json',zh:'/new/browser-zh.json'}});
      return Response.json(encodeBrowserIndex(index,false));
    }) as typeof fetch;
    const first=loadBrowserIndex(manifest,'en'),second=loadBrowserIndex(manifest,'en');
    assert.equal(first,second); assert.equal((await first).snapshotId,'new');
    assert.deepEqual(urls,['/old/browser-en.json','/catalog/manifest.json','/new/browser-en.json']);
    let calls=0;
    globalThis.fetch=(async()=>++calls===1?new Response('',{status:503}):Response.json(encodeBrowserIndex(index,true))) as typeof fetch;
    await assert.rejects(loadBrowserIndex(manifest,'zh-CN'));
    assert.equal((await loadBrowserIndex(manifest,'zh-CN')).snapshotId,'new');
    assert.equal(calls,2);
  } finally { globalThis.fetch=original; }
});

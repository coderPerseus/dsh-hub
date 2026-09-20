import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm, cp, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogSnapshotSchema, type CatalogPlugin } from '../packages/catalog/src/index';
import { applyCatalogEnrichment, catalogEnrichmentDataSchema } from '../packages/catalog/src/enrichment';
import { localizedDescription } from '../packages/catalog/src/i18n';
import { detailShard, searchStaticCatalog, type StaticIndex, type StaticEntry } from '../packages/client/src/static';
import { normalizeReadme, pluginPackageDirectory } from '../apps/web/src/lib/plugin-readme';

import { locales, type Locale } from '../apps/web/src/lib/i18n/locales';
import { localizedHref } from '../apps/web/src/lib/i18n/routing';
import { getMessages } from '../apps/web/src/lib/i18n/messages';
import { discoveryCopy } from '../apps/web/src/lib/i18n/discovery';
import { pluginDescription } from '../apps/web/src/lib/plugin-description';
import { categoryCopy, listingTitle } from '../apps/web/src/lib/i18n/categories';
import { listingPath } from '../apps/web/src/lib/listing';
import { encodeBrowserIndex } from '../apps/web/src/lib/browser-index';
import { governCatalog } from './lib/catalog-governance.mts';
import { googleAnalyticsScript } from '../apps/web/src/lib/google-analytics';
import { compactSearchText } from './lib/search-text.mts';

const root = path.resolve(import.meta.dirname, '..');
// Reject changes that would reintroduce request-based compute or storage billing.
for (const filename of ['wrangler.jsonc', 'wrangler.ci.jsonc']) {
  const config = JSON.parse(await readFile(path.join(root, 'apps/web', filename), 'utf8'));
  const allowed = new Set(['$schema', 'name', 'account_id', 'compatibility_date', 'assets', 'routes', 'observability']);
  if (Object.keys(config).some(key => !allowed.has(key)) || !config.assets?.directory
    || config.assets.run_worker_first || config.assets.binding || config.observability?.enabled) {
    throw new Error(`${filename}: only static assets are permitted by the monthly cost policy`);
  }
}
const output = path.join(root, 'apps/web/dist');
const rawSnapshot = JSON.parse(await readFile(path.join(root, '.catalog/catalog.snapshot.json'), 'utf8'));
const snapshot = applyCatalogEnrichment(
  catalogSnapshotSchema.parse(rawSnapshot),
  catalogEnrichmentDataSchema.parse(JSON.parse(await readFile(path.join(root, 'data', 'catalog-enrichment.json'), 'utf8'))),
);
if (snapshot.plugins.length < Number(process.env.CATALOG_MIN_PLUGIN_COUNT ?? 50)) throw new Error('Refusing to publish an incomplete catalog');
const governance = governCatalog(snapshot.plugins);
await writeFile(path.join(root, '.catalog/seo-governance.report.json'), JSON.stringify(governance.report, null, 2));
const version = createHash('sha256').update('browser-index-v1-governance-v1').update(JSON.stringify(snapshot)).digest('hex').slice(0,16);
const prefix = `/catalog/${version}`;
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await cp(path.join(root, 'apps/web/public'), output, {recursive: true});
await build({entryPoints:[path.join(root,'apps/web/src/static/browser.tsx')], bundle:true, external:['/fonts/*','/hero-*'], format:'esm', platform:'browser', outdir:output + '/assets', entryNames:'app-[hash]', minify:true, metafile:true, define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SITE_URL':'"https://dshhub.org"'}, jsx:'automatic', write:true}).then(async result => {
  const outputs = Object.keys(result.metafile!.outputs);
  await writeFile(path.join(root,'.catalog/assets.json'), JSON.stringify({js:'/' + path.relative(output,outputs.find(x=>x.endsWith('.js'))!), css:'/' + path.relative(output,outputs.find(x=>x.endsWith('.css'))!)}));
});
const rendererPath = path.join(root, 'apps/web/.static-build/render.mjs');
await build({entryPoints:[path.join(root,'apps/web/src/static/render.tsx')], bundle:true, platform:'node', format:'esm', packages:'external', outfile:rendererPath, jsx:'automatic'});
const {render} = await import(pathToFileURL(rendererPath).href);
const assets = JSON.parse(await readFile(root+'/.catalog/assets.json','utf8'));
const categories = new Map<string,number>();
const items: StaticEntry[] = snapshot.plugins.map(p => {
  for (const c of p.categories) categories.set(c, (categories.get(c) ?? 0)+1);
  const descriptionZh = localizedDescription(p, 'zh-CN');
  const usageSummaryZh = p.i18n?.["zh-CN"]?.usageSummary ?? p.usage.summary;
  const searchText = compactSearchText([p.name,p.package.name,p.description,...p.repository.topics,p.usage.summary]);
  return {id:p.id,slug:p.slug,name:p.name,description:p.description,packageName:p.package.name,repositoryUrl:p.repository.url,stars:p.repository.stars,pushedAt:p.repository.pushedAt,featured:p.featured,categories:p.categories,compatibilityStatus:p.compatibility.status,compatibilityLevel:p.compatibility.level,installCommand:p.installation.command,
    descriptionZh,
    searchText,
    searchTextZh:compactSearchText([descriptionZh,usageSummaryZh], searchText),
  };
});
const index: StaticIndex = {schemaVersion:1,snapshotId:snapshot.snapshotId,generatedAt:snapshot.generatedAt,items,categories:[...categories].sort(([a],[b])=>a.localeCompare(b)).map(([id,count])=>({id,count}))};
const manifest = {browserIndexes: {en: prefix+'/browser-en.json', zh: prefix+'/browser-zh.json'}, schemaVersion:1 as const,snapshotId:snapshot.snapshotId,generatedAt:snapshot.generatedAt,pluginCount:items.length,index:prefix+'/index.json',details:Array.from({length:256},(_,i)=>`${prefix}/details-${i}.json`)};
const primarySlugs = new Set(governance.plugins.filter(p => governance.canonical.get(p.slug) === p.slug).map(p => p.slug));
const primaryIds = new Set(governance.plugins.filter(p => primarySlugs.has(p.slug)).map(p => p.id));
const webItems = items.filter(p => primaryIds.has(p.id));
const uniqueWebItems = [...new Map(webItems.map(p => [p.slug, p])).values()];
const webCategories = [...categories.keys()].sort().map(id => ({id, count: uniqueWebItems.filter(p => p.categories.includes(id)).length})).filter(c => c.count > 0);
const webIndex: StaticIndex = {...index, items: uniqueWebItems, categories: webCategories};
const initial = {...webIndex, items: searchStaticCatalog(webIndex,{limit:24}).items.map(p => ({...p,searchText:''}))};
async function put(file:string, content:string) { const target=output+file; await mkdir(path.dirname(target),{recursive:true}); if (Buffer.byteLength(content)>24*1024*1024) throw new Error(`Asset too large: ${file} (${Buffer.byteLength(content)} bytes)`); await writeFile(target,content); }
await put('/catalog/manifest.json',JSON.stringify(manifest));
await put(prefix+'/index.json',JSON.stringify(index));
await put(manifest.browserIndexes.en, JSON.stringify(encodeBrowserIndex(webIndex, false)));
await put(manifest.browserIndexes.zh, JSON.stringify(encodeBrowserIndex(webIndex, true)));
const shards: CatalogPlugin[][] = Array.from({length:256},()=>[]);
const plugins = [...governance.plugins].sort((a,b)=>a.id.localeCompare(b.id));
for (const plugin of plugins) shards[detailShard(plugin.slug)].push(plugin);
for (let i=0;i<256;i++) await put(manifest.details[i],JSON.stringify(shards[i]));
const escape = (s:string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const localeOutput = (locale: Locale) => path.join(root, 'apps/web/.static-build/locales', locale);
async function writeAsset(directory: string, file: string, content: string) {
  if (Buffer.byteLength(content) > 24*1024*1024) throw new Error(`Asset too large: ${file} (${Buffer.byteLength(content)} bytes)`);
  const target = path.join(directory, file);
  await mkdir(path.dirname(target), {recursive:true});
  await writeFile(target, content);
}
function html(data:any, title:string, description:string, pagePath:string) {
  const locale: Locale = data.locale;
  const canonicalPath = data.canonicalSlug ? `/plugins/${data.canonicalSlug}` : pagePath;
  const url = localizedHref(canonicalPath, locale);
  const alternates = data.notFound ? '' : [...locales.map(l => `<link rel="alternate" hreflang="${l}" href="https://dshhub.org${escape(localizedHref(canonicalPath,l))}">`), `<link rel="alternate" hreflang="x-default" href="https://dshhub.org${escape(localizedHref(canonicalPath,'zh-CN'))}">`].join('');
  return `<!doctype html><html lang="${locale}" data-theme="dark"><head><script>${googleAnalyticsScript}</script><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escape(title)}</title><meta name="description" content="${escape(description)}">${data.notFound ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="https://dshhub.org${escape(url)}">`}${alternates}<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="https://dshhub.org${escape(url)}"><meta property="og:locale" content="${({'zh-CN':'zh_CN','zh-TW':'zh_TW',en:'en_US',ja:'ja_JP',ko:'ko_KR'})[locale]}"><meta property="og:type" content="website"><meta property="og:site_name" content="DSH Hub"><meta property="og:image" content="https://dshhub.org/icon.png"><meta property="og:image:alt" content="DSH Hub"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="https://dshhub.org/icon.png"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/${locale}${assets.css}"></head><body><div id="root">${render(data)}</div><script id="page-data" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script><script type="module" src="/${locale}${assets.js}"></script></body></html>`;
}
const emptyInitial = {...initial,items:[]};
for (const locale of locales) {
  const directory = localeOutput(locale);
  await rm(directory,{recursive:true,force:true});
  await mkdir(directory,{recursive:true});
  await cp(output+'/assets',directory+'/'+locale+'/assets',{recursive:true});
  const t = getMessages(locale);

  await writeAsset(directory, '/404.html', html({locale,manifest,initial:emptyInitial,related:[],notFound:true},'404 · DSH Hub',t.notFoundHint,'/404'));
  await writeAsset(directory, '/_headers', '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/'+locale+'/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
  const config = {
    name: 'dshhub-web-'+locale.toLowerCase(), workers_dev:false, account_id:'de7749886db8f5df040c27a20388fdcc', compatibility_date:'2026-08-01',
    assets:{directory,html_handling:'auto-trailing-slash',not_found_handling:'404-page'},observability:{enabled:false},
  };
  await writeFile(root+`/apps/web/.static-build/wrangler-${locale}.ci.json`,JSON.stringify(config,null,2));
  await writeFile(root+`/apps/web/.static-build/wrangler-${locale}.json`,JSON.stringify({...config,routes:[{pattern:`dshhub.org/${locale}/*`,zone_name:'dshhub.org'},{pattern:`dshhub.org/${locale}`,zone_name:'dshhub.org'}]},null,2));
}
const listingPaths: string[] = [];
for (const category of [undefined, ...webCategories.map(c => c.id)]) {
  const matching = searchStaticCatalog(webIndex, {categories: category ? [category] : [], limit: 1});
  const pages = Math.max(1, Math.ceil(matching.total / 24));
  for (let page = 1; page <= pages; page++) {
    const pagePath = listingPath(category, page);
    listingPaths.push(pagePath);
    const list = searchStaticCatalog(webIndex, {categories: category ? [category] : [], cursor: btoa(String((page - 1) * 24))});
    const pageInitial = {...webIndex, items: list.items.map(p => ({...p, searchText: ''}))};
    const listing = {path: pagePath, category, page, total: matching.total, previousPath: page > 1 ? listingPath(category, page - 1) : null, nextPath: page < pages ? listingPath(category, page + 1) : null};
    for (const locale of locales) {
      const title = listingTitle(locale, category, page) + ' | DSH Hub';
      const description = category ? categoryCopy(category, locale).description : discoveryCopy[locale].intro;
      await writeAsset(localeOutput(locale), localizedHref(pagePath, locale) + 'index.html', html({locale,manifest,initial:pageInitial,listing,related:[]},title,description,pagePath));
    }
  }
}
const seen = new Set<string>();
const recommended = [...uniqueWebItems].sort((a,b)=>b.stars-a.stars);
for (const source of plugins) {
  if (seen.has(source.slug)) continue; seen.add(source.slug);
  const plugin = {...source, usage:{...source.usage,markdown:normalizeReadme(source.usage.markdown || source.installation.markdown,{owner:source.repository.owner,name:source.repository.name,ref:source.repository.commit || source.repository.defaultBranch,file:(pluginPackageDirectory(source.id) ? pluginPackageDirectory(source.id)+'/' : '')+'README.md'})}};
  const related = recommended.filter(p=>p.slug!==plugin.slug && p.categories.some(c=>plugin.categories.includes(c))).slice(0,6).map(({searchText:_,...p})=>p);
  const canonicalSlug = governance.canonical.get(plugin.slug)!;
  const variants = (governance.variants.get(plugin.slug) || []).map(p => ({slug:p.slug, repository:p.slug}));
  const displayName = variants.length ? `${plugin.name} (${plugin.slug})` : plugin.name;
  for (const locale of locales) {
    const description = pluginDescription(plugin, locale) || getMessages(locale).missingDescription;
    const url='/plugins/'+plugin.slug;
    await writeAsset(localeOutput(locale),localizedHref(url,locale)+'index.html',html({locale,manifest,initial:emptyInitial,plugin,related,variants,canonicalSlug},displayName+' — '+discoveryCopy[locale].detailTitle+' | DSH Hub',description,url));
  }
  if (seen.size % 1000 === 0) console.log(`Rendered ${seen.size} plugins in ${locales.length} languages`);
}
for (const locale of locales) {
  const urls = [...listingPaths, ...[...primarySlugs].map(s=>'/plugins/'+s)];
  await writeAsset(localeOutput(locale),`/${locale}/sitemap.xml`,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>`<url><loc>https://dshhub.org${escape(localizedHref(url,locale))}</loc></url>`).join('')+'</urlset>');
}
await put('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+locales.map(locale=>`<sitemap><loc>https://dshhub.org/${locale}/sitemap.xml</loc></sitemap>`).join('')+'</sitemapindex>');
await put('/_redirects','/ /zh-CN/ 301\n/plugins/* /zh-CN/plugins/:splat 301\n/categories/* /zh-CN/categories/:splat 301\n/page/* /zh-CN/page/:splat 301\n'+locales.map(locale=>`/${locale} /${locale}/ 301`).join('\n')+'\n');
await put('/404.html',html({locale:'zh-CN',manifest,initial:emptyInitial,related:[],notFound:true},'404 · DSH Hub','页面不存在','/404'));
await put('/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://dshhub.org/sitemap.xml\n');
await put('/api/v1/plugins/index.html',JSON.stringify({error:'The live search API has been retired. Upgrade @dshhubs/client and @dshhubs/cli to 0.2.0. Static catalog: https://dshhub.org/catalog/manifest.json'}));
await put('/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/catalog/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
for (const name of ['favicon.ico','icon.png','apple-icon.png']) await cp(root+'/apps/web/src/app/'+name,output+'/'+name);
async function files(dir:string):Promise<string[]> { const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):Promise.resolve([path.join(dir,e.name)])))).flat(); }
const counts: Record<string,number> = {};
// Workers Paid supports 100,000 static assets per Worker version.
const maxStaticAssets = 100_000;
for (const [name,directory] of [['shared',output],...locales.map(locale=>[locale,localeOutput(locale)])]) {
  const all=await files(directory);
  if(all.length>maxStaticAssets) throw new Error(`${name}: ${all.length} static assets exceed the Workers Paid limit of ${maxStaticAssets}`);
  counts[name]=all.length;
}
console.log(JSON.stringify({plugins:items.length,uniquePlugins:plugins.length,canonicalPlugins:primarySlugs.size,listingPages:listingPaths.length,detailPages:seen.size*locales.length,files:counts,version}));

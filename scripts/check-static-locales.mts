import {readFile,open} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {locales} from '../apps/web/src/lib/i18n/locales';
import {localizedHref} from '../apps/web/src/lib/i18n/routing';
const root = path.resolve(import.meta.dirname,'..');
const snapshot = JSON.parse(await readFile(root+'/.catalog/catalog.snapshot.json','utf8'));
const slugs = [...new Set<string>(snapshot.plugins.map((p:{slug:string})=>p.slug))];
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const report=JSON.parse(await readFile(root+'/.catalog/seo-governance.report.json','utf8'));
const canonical=new Map<string,string>();
for(const group of report.duplicateGroups) for(const slug of group.members) canonical.set(slug,group.canonical);
let verified=0;
for(const locale of locales){
  const base=root+'/apps/web/.static-build/locales/'+locale;
  const config=JSON.parse(await readFile(root+`/apps/web/.static-build/wrangler-${locale}.json`,'utf8'));
  assert(!config.main && !config.assets.binding && !config.assets.run_worker_first);
  const sitemap=await readFile(`${base}/${locale}/sitemap.xml`,'utf8');
  const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.equal(new Set(sitemapUrls).size,sitemapUrls.length);
  const listingPaths=sitemapUrls.map(url=>new URL(url).pathname.slice(locale.length+1)).filter(page=>!page.startsWith('/plugins/'));
  for(const slug of slugs) assert.equal(sitemapUrls.includes('https://dshhub.org'+localizedHref('/plugins/'+slug,locale)),!canonical.has(slug)||canonical.get(slug)===slug);
  for(const page of [...listingPaths,...slugs.map(s=>'/plugins/'+s)]){
    const url=localizedHref(page,locale);
    const file=await open(path.join(base,url,'index.html'),'r');
    const buffer=Buffer.alloc(8192);const {bytesRead}=await file.read(buffer,0,8192,0);await file.close();
    const head=buffer.subarray(0,bytesRead).toString();
    assert(head.includes(`<html lang="${locale}"`),url);
    const canonicalPage=page.startsWith('/plugins/') ? '/plugins/'+(canonical.get(page.slice(9))||page.slice(9)) : page;
    assert(head.includes(`<link rel="canonical" href="https://dshhub.org${escape(localizedHref(canonicalPage,locale))}">`),url);
    for(const language of locales)assert(head.includes(`hreflang="${language}" href="https://dshhub.org${escape(localizedHref(canonicalPage,language))}"`),url);
    assert(head.includes('hreflang="x-default"'),url);
    assert(head.includes(`property="og:locale" content="${({'zh-CN':'zh_CN','zh-TW':'zh_TW',en:'en_US',ja:'ja_JP',ko:'ko_KR'})[locale]}"`),url);
    verified++;
  }

  const notFound=await readFile(base+'/404.html','utf8');assert(notFound.includes('name="robots" content="noindex"'));
  const sample=await readFile(path.join(base,localizedHref('/plugins/'+slugs[0],locale),'index.html'),'utf8');
  const data=JSON.parse(sample.match(/<script id="page-data" type="application\/json">(.*?)<\/script>/s)![1]);
  assert.equal(data.locale,locale);
  assert(sample.includes(`https://dshhub.org${localizedHref('/plugins/'+slugs[0],locale)}#software`));
  assert(!sample.includes('href="/"'));
  console.log(`Verified ${locale}: ${slugs.length+listingPaths.length} pages, metadata, sitemap, structured data and 404`);
}
const redirects=await readFile(root+'/apps/web/dist/_redirects','utf8');assert(redirects.includes('/plugins/* /zh-CN/plugins/:splat 301'));
console.log(JSON.stringify({verifiedPages:verified,languages:locales.length,plugins:slugs.length}));

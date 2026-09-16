import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { locales } from '../apps/web/src/lib/i18n/locales';
import { discoveryCopy } from '../apps/web/src/lib/i18n/discovery';
const root = path.resolve(import.meta.dirname, '..');
function structured(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m => JSON.parse(m[1])['@graph']);
}
for (const locale of locales) {
  const base = `${root}/apps/web/.static-build/locales/${locale}/${locale}`;
  const home = await readFile(`${base}/index.html`, 'utf8');
  assert.equal((home.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert(home.includes(discoveryCopy[locale].intro));
  const graph = structured(home);
  assert(graph.some(node => node['@type'] === 'WebSite'));
  const list = graph.find(node => node['@type'] === 'CollectionPage').mainEntity.itemListElement;
  assert(list.length > 0);
  // Check a real detail linked in server-rendered HTML, not a synthetic fixture.
  const detail = await readFile(path.join(root, 'apps/web/.static-build/locales', locale, new URL(list[0].url).pathname, 'index.html'), 'utf8');
  for (const html of [home, detail]) {
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert(html.includes('name="twitter:card" content="summary"'));
    assert(html.includes('property="og:image" content="https://dshhub.org/icon.png"'));
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    assert(description && description.length > 20);
  }
  assert(detail.includes(discoveryCopy[locale].detailTitle.replaceAll('&', '&amp;')));
  const software = structured(detail).find(node => node['@type'] === 'SoftwareApplication');
  assert(software && !('isAccessibleForFree' in software));
  assert.equal(software.inLanguage, locale);
  for (const id of ['install-title', 'readme-title', 'related-title']) {
    assert(detail.includes(`href="#${id}"`));
    assert(detail.includes(`id="${id}"`));
  }
  console.log(`SEO verified: ${locale} home + linked plugin detail`);
}

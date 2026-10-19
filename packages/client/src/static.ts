import type { PluginSummary, SearchPluginsInput, SearchPluginsResult } from './index.js';

export type StaticEntry = PluginSummary & {
  searchText: string;
  descriptionZh?: string;
  searchTextZh?: string;
};
export type StaticIndex = { schemaVersion: 1; snapshotId: string; generatedAt: string; items: StaticEntry[]; categories: Array<{id: string; count: number}> };
export type StaticManifest = { schemaVersion: 1 | 2; snapshotId: string; index: string; details: string[]; pluginCount: number; generatedAt: string };
// Version 2 is a directory; each shard retains the version 1 index shape.
export type StaticIndexDirectory = Omit<StaticIndex, 'schemaVersion' | 'items'> & {
  schemaVersion: 2;
  itemCount: number;
  shards: string[];
};

export async function loadStaticIndex(
  file: string,
  read: (file: string) => Promise<StaticIndex | StaticIndexDirectory>,
): Promise<StaticIndex> {
  const index = await read(file);
  if (index.schemaVersion === 1 && Array.isArray(index.items)) return index;
  if (index.schemaVersion !== 2 || !Array.isArray(index.shards) || !index.shards.length
    || new Set(index.shards).size !== index.shards.length
    || !Number.isSafeInteger(index.itemCount) || index.itemCount < 0) {
    throw new Error('Unsupported catalog index format; update @dshhubs/client to a version supporting this catalog schema');
  }
  const items: StaticEntry[] = [];
  // Bound concurrent downloads while preserving the directory's item order.
  for (let start = 0; start < index.shards.length; start += 4) {
    const shards = await Promise.all(index.shards.slice(start, start + 4).map(read));
    for (const shard of shards) {
      if (shard.schemaVersion !== 1 || shard.snapshotId !== index.snapshotId
        || shard.generatedAt !== index.generatedAt || !Array.isArray(shard.items)) {
        throw new Error('Catalog index shard does not match its directory');
      }
      items.push(...shard.items);
    }
  }
  if (items.length !== index.itemCount) {
    throw new Error('Catalog index shards are incomplete');
  }
  return {schemaVersion: 1, snapshotId: index.snapshotId, generatedAt: index.generatedAt, categories: index.categories, items};
}

export function detailShard(slug: string): number {
  let hash = 2166136261;
  for (const char of slug.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 256;
}

export function searchStaticCatalog(index: StaticIndex, input: SearchPluginsInput = {}): SearchPluginsResult {
  const locale = input.locale ?? "en";
  const isChineseLocale = locale === "zh-CN" || locale === "zh-TW";
  const tokens = (input.query ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const score = (p: StaticEntry) => tokens.reduce(
    (n, t) => n + (p.name.toLocaleLowerCase().includes(t) ? 10 : (p.searchText.includes(t) || p.searchTextZh?.includes(t)) ? 1 : 0),
    0,
  );
  const items = index.items.filter(p =>
    (!input.categories?.length || input.categories.some(c => p.categories.includes(c))) &&
    (!input.compatibility?.length || input.compatibility.includes(p.compatibilityStatus)) &&
    (!tokens.length || score(p) > 0)
  ).sort((a,b) => {
    if (tokens.length && score(a) !== score(b)) return score(b) - score(a);
    const order = input.sort === 'name' ? 0 : input.sort === 'updated'
      ? (b.pushedAt ?? '').localeCompare(a.pushedAt ?? '')
      : input.sort === 'stars' ? b.stars - a.stars : Number(b.featured) - Number(a.featured) || b.stars - a.stars;
    return order || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
  let offset = 0;
  try { const n = Number(atob(input.cursor ?? '')); if (Number.isSafeInteger(n) && n >= 0) offset = n; } catch { /* first page */ }
  const limit = Math.min(100, Math.max(1, Math.trunc(input.limit ?? 24) || 24));
  return { items: items.slice(offset, offset + limit).map(({searchText: _, searchTextZh: _zh, ...p}) => ({...p, description: isChineseLocale && p.descriptionZh ? p.descriptionZh : p.description})), total: items.length,
    nextCursor: offset + limit < items.length ? btoa(String(offset + limit)) : null };
}

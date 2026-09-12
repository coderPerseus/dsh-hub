import type { PluginSummary, SearchPluginsInput, SearchPluginsResult } from './index.js';

export type StaticEntry = PluginSummary & { searchText: string };
export type StaticIndex = { schemaVersion: 1; snapshotId: string; generatedAt: string; items: StaticEntry[]; categories: Array<{id: string; count: number}> };
export type StaticManifest = { schemaVersion: 1; snapshotId: string; index: string; details: string[]; pluginCount: number; generatedAt: string };

export function detailShard(slug: string): number {
  let hash = 2166136261;
  for (const char of slug.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 256;
}

export function searchStaticCatalog(index: StaticIndex, input: SearchPluginsInput = {}): SearchPluginsResult {
  const tokens = (input.query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const score = (p: StaticEntry) => tokens.reduce((n, t) => n + (p.name.toLocaleLowerCase().includes(t) ? 10 : p.searchText.includes(t) ? 1 : 0), 0);
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
  return { items: items.slice(offset, offset + limit).map(({searchText: _, ...p}) => p), total: items.length,
    nextCursor: offset + limit < items.length ? btoa(String(offset + limit)) : null };
}

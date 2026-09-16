import type { StaticEntry, StaticIndex } from '../../../../packages/client/src/static';
// Positional rows avoid repeating long field names for every plugin. This format is
// private to the website; the public client/CLI index remains backward compatible.
export type BrowserIndex = {
  schemaVersion: 1; snapshotId: string; generatedAt: string; categories: StaticIndex['categories'];
  rows: Array<[string, string, string, string, string, string, number, string | null, boolean, string[], StaticEntry['compatibilityStatus'], StaticEntry['compatibilityLevel'], string | null, string]>;
};
export function encodeBrowserIndex(index: StaticIndex, chinese: boolean): BrowserIndex {
  return {schemaVersion: 1, snapshotId: index.snapshotId, generatedAt: index.generatedAt, categories: index.categories,
    rows: index.items.map(p => {
      const description = chinese ? p.descriptionZh || p.description : p.description;
      const base = [p.name, p.packageName, description].join(' ').toLowerCase();
      return [p.id, p.slug, p.name, description,
      p.packageName === p.name ? '' : p.packageName, p.repositoryUrl, p.stars, p.pushedAt, p.featured,
      p.categories, p.compatibilityStatus, p.compatibilityLevel, p.installCommand,
      [...new Set([p.searchText, p.searchTextZh || ''].join(' ').toLowerCase().split(/\s+/).filter(word => word && !base.includes(word)))].join(' ')]; })};
}
export function decodeBrowserIndex(data: BrowserIndex): StaticIndex {
  if (data.schemaVersion !== 1 || !Array.isArray(data.rows)) throw new Error('Invalid browser index');
  return {schemaVersion: 1, snapshotId: data.snapshotId, generatedAt: data.generatedAt, categories: data.categories,
    items: data.rows.map(([id, slug, name, description, packageName, repositoryUrl, stars, pushedAt, featured, categories, compatibilityStatus, compatibilityLevel, installCommand, searchText]) =>
      ({id, slug, name, description, packageName: packageName || name, repositoryUrl, stars, pushedAt, featured, categories, compatibilityStatus, compatibilityLevel, installCommand, searchText: [name, packageName || name, description, searchText].join(' ').toLowerCase()}))};
}

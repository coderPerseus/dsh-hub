import { createHash } from 'node:crypto';
import type { CatalogPlugin } from '../../packages/catalog/src/schema';
import { pluginPackageDirectory } from '../../apps/web/src/lib/plugin-readme';

export function governCatalog(source: CatalogPlugin[]) {
  // Resolve existing duplicate slug records deterministically before generating any links.
  const bySlug = new Map<string, CatalogPlugin>();
  for (const plugin of [...source].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!bySlug.has(plugin.slug)) bySlug.set(plugin.slug, plugin);
  }
  const plugins = [...bySlug.values()];
  const names = new Map<string, CatalogPlugin[]>();
  const copies = new Map<string, CatalogPlugin[]>();
  for (const plugin of plugins) {
    const name = plugin.package.name.toLowerCase();
    names.set(name, [...(names.get(name) || []), plugin]);
    const readme = (plugin.usage.markdown || plugin.installation.markdown).trim();
    // A name match or similar README alone is not evidence of an identical fork.
    if (readme.length < 160 || !plugin.package.version || !/^[a-f0-9]{40}$/i.test(plugin.repository.commit)) continue;
    const evidence = {
      name, version: plugin.package.version, commit: plugin.repository.commit,
      directory: pluginPackageDirectory(plugin.id), readme,
      description: plugin.description, usageSummary: plugin.usage.summary,
      installation: plugin.installation.markdown, notes: plugin.installation.notes,
      dependencies: Object.entries(plugin.package.peerDependencies).sort(),
      categories: [...plugin.categories].sort(), compatibility: plugin.compatibility,
      license: plugin.repository.license,
    };
    const fingerprint = createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
    copies.set(fingerprint, [...(copies.get(fingerprint) || []), plugin]);
  }
  const canonical = new Map(plugins.map(p => [p.slug, p.slug]));
  const duplicateGroups: Array<{canonical: string; members: string[]; evidence: string}> = [];
  for (const group of copies.values()) {
    if (group.length < 2) continue;
    // A stable directory representative; this does not assert upstream authorship.
    group.sort((a, b) => Number(b.featured) - Number(a.featured) || a.slug.localeCompare(b.slug));
    for (const plugin of group) canonical.set(plugin.slug, group[0].slug);
    duplicateGroups.push({canonical: group[0].slug, members: group.map(p => p.slug), evidence: 'same package, version, commit, path, source content, dependencies and compatibility'});
  }
  const variants = new Map<string, CatalogPlugin[]>();
  for (const group of names.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => b.repository.stars - a.repository.stars || a.slug.localeCompare(b.slug));
    for (const plugin of group) variants.set(plugin.slug, group.filter(p => p.slug !== plugin.slug).slice(0, 6));
  }
  return {plugins, canonical, variants, report: {duplicateSlugRecords: source.length - plugins.length, sameNameGroups: [...names.values()].filter(g => g.length > 1).length, duplicateGroups}};
}

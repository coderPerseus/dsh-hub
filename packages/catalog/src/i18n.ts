import {
  catalogLocales,
  type CatalogLocale,
  type CatalogPlugin,
  type CatalogSnapshot,
} from "./schema";

export function isCatalogLocale(value: string | null | undefined): value is CatalogLocale {
  return catalogLocales.includes(value as CatalogLocale);
}

export function localizePlugin(plugin: CatalogPlugin, locale?: string | null): CatalogPlugin {
  if (!locale || !isCatalogLocale(locale)) return plugin;
  const entry = plugin.i18n?.[locale];
  if (!entry) return plugin;
  return {
    ...plugin,
    description: entry.description || plugin.description,
    installation: {
      ...plugin.installation,
      markdown: entry.installationMarkdown || plugin.installation.markdown,
      notes: entry.installationNotes ?? plugin.installation.notes,
    },
    usage: {
      ...plugin.usage,
      markdown: entry.usageMarkdown || plugin.usage.markdown,
      summary: entry.usageSummary || plugin.usage.summary,
    },
  };
}

export function localizedDescription(plugin: Pick<CatalogPlugin, "description" | "i18n">, locale?: string | null): string {
  if (!locale || !isCatalogLocale(locale)) return plugin.description;
  return plugin.i18n?.[locale]?.description || plugin.description;
}

export function i18nSearchText(plugin: CatalogPlugin): string {
  const translated = Object.values(plugin.i18n ?? {})
    .flatMap(entry => [entry?.description, entry?.usageSummary])
    .filter((value): value is string => Boolean(value));
  return [plugin.description, plugin.usage.summary, ...translated].join("\n");
}

export function stripCatalogTranslations(snapshot: CatalogSnapshot): CatalogSnapshot {
  if (!snapshot.plugins.some(plugin => plugin.i18n !== undefined)) return snapshot;
  const { changedRepositories: _changedRepositories, ...fullSnapshot } = snapshot;
  return {
    ...fullSnapshot,
    plugins: snapshot.plugins.map(plugin => {
      const { i18n: _i18n, ...sourcePlugin } = plugin;
      return sourcePlugin;
    }),
  };
}

export function catalogSearchText(plugin: CatalogPlugin): string {
  const translated = Object.values(plugin.i18n ?? {}).flatMap(entry => [
    entry?.description,
    entry?.installationMarkdown,
    ...(entry?.installationNotes ?? []),
    entry?.usageMarkdown,
    entry?.usageSummary,
  ]);
  const peerDependencies = Object.entries(plugin.package.peerDependencies).flat();
  const compatibility = plugin.compatibility.checks.flatMap(check => [
    check.id,
    check.status,
    check.summary,
  ]);

  return [
    plugin.repository.owner,
    plugin.repository.name,
    plugin.repository.defaultBranch,
    plugin.repository.homepage,
    ...plugin.repository.topics,
    plugin.package.name,
    plugin.package.version,
    plugin.package.bundlePatch,
    ...peerDependencies,
    ...plugin.categories,
    plugin.compatibility.harnessRange,
    plugin.compatibility.cordisRange,
    ...compatibility,
    plugin.installation.spec,
    plugin.installation.command,
    plugin.installation.markdown,
    ...plugin.installation.notes,
    plugin.usage.summary,
    plugin.usage.markdown,
    ...translated,
  ].filter((value): value is string => Boolean(value)).join("\n");
}

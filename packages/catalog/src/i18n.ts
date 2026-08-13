import {
  catalogLocales,
  type CatalogLocale,
  type CatalogPlugin,
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

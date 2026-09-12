import { createHash } from "node:crypto";

import { z } from "zod";

import { type CatalogPlugin, type CatalogSnapshot } from "./schema";

export const catalogEnrichmentEntrySchema = z.object({
  sourceHash: z.string().min(1),
  descriptionZh: z.string().min(1).refine(value => [...value].length <= 100, "descriptionZh must be at most 100 unicode characters"),
  analysisZh: z.string().min(1).refine(
    value => [...value].length <= 100,
    "analysisZh must be at most 100 unicode characters",
  ),
});

export const catalogEnrichmentDataSchema = z.object({
  version: z.literal(1),
  entries: z.record(z.string(), catalogEnrichmentEntrySchema),
});

export type CatalogEnrichmentData = z.infer<typeof catalogEnrichmentDataSchema>;
export type CatalogEnrichmentEntry = z.infer<typeof catalogEnrichmentEntrySchema>;

export function enrichmentSourceHash(plugin: CatalogPlugin): string {
  return createHash("sha256").update(JSON.stringify([
    plugin.package.name,
    plugin.description,
    plugin.usage.summary,
    plugin.usage.markdown,
    plugin.installation.markdown,
  ])).digest("hex");
}

export function applyCatalogEnrichment(
  snapshot: CatalogSnapshot,
  data: CatalogEnrichmentData,
): CatalogSnapshot {
  const plugins = snapshot.plugins.map((plugin) => {
    const record = data.entries[plugin.id];
    if (!record || record.sourceHash !== enrichmentSourceHash(plugin)) return plugin;
    const zhLocale = plugin.i18n?.["zh-CN"] ?? {};
    return {
      ...plugin,
      i18n: {
        ...plugin.i18n,
        "zh-CN": {
          ...zhLocale,
          description: record.descriptionZh,
        },
      },
      aiAnalysis: {
        ...plugin.aiAnalysis,
        "zh-CN": record.analysisZh,
      },
    };
  });
  if (plugins.every((plugin, index) => plugin === snapshot.plugins[index])) return snapshot;
  return { ...snapshot, plugins };
}

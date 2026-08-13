import type { CatalogPluginSummary } from "@dshhub/contracts";
import type { MetadataRoute } from "next";

import { orpc } from "../lib/orpc";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-dynamic";

async function getPlugins(): Promise<CatalogPluginSummary[]> {
  try {
    const plugins: CatalogPluginSummary[] = [];
    let cursor: string | null = null;
    do {
      const page = await orpc.catalog.list({
        categories: [],
        compatibility: [],
        cursor,
        limit: 50,
        query: "",
        sort: "name",
      });
      plugins.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return plugins;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const plugins = await getPlugins();
  return [
    { changeFrequency: "hourly", priority: 1, url: absoluteUrl() },
    ...plugins.map(plugin => ({
      changeFrequency: "weekly" as const,
      lastModified: plugin.pushedAt ?? undefined,
      priority: 0.8,
      url: absoluteUrl(`/plugins/${plugin.slug}`),
    })),
  ];
}

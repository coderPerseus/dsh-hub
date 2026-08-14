import {
  catalogI18nSchema,
  catalogPluginSchema,
  localizePlugin,
  localizedDescription,
  type CatalogPlugin,
} from "@dshhub/catalog";
import type { CatalogListInput, CatalogPluginSummary } from "@dshhub/contracts";

type CurrentRun = {
  generated_at: string;
  id: string;
  plugin_count: number;
  published_at: string | null;
  snapshot_id: string;
};

type PluginSummaryRow = {
  compatibility_level: CatalogPluginSummary["compatibilityLevel"];
  compatibility_status: CatalogPluginSummary["compatibilityStatus"];
  description: string;
  featured: number;
  id: string;
  install_command: string | null;
  name: string;
  package_name: string;
  pushed_at: string | null;
  repository_url: string;
  raw_json: string;
  slug: string;
  stars: number;
};

function encodeCursor(offset: number): string {
  return btoa(String(offset));
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = Number(atob(cursor));
    return Number.isSafeInteger(decoded) && decoded >= 0 ? decoded : 0;
  } catch {
    return 0;
  }
}

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ");
}

function localizedRowDescription(
  description: string,
  rawJson: string,
  locale: string | undefined,
): string {
  if (!locale) return description;
  try {
    const raw = JSON.parse(rawJson) as { i18n?: unknown };
    const i18n = catalogI18nSchema.parse(raw.i18n ?? {});
    return localizedDescription({ description, i18n }, locale);
  } catch {
    return description;
  }
}

export function toFtsQuery(query: string): string {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map(token => `"${token.replaceAll('"', '""')}"*`)
    .join(" OR ");
}

export class CatalogStore {
  constructor(private readonly db: D1Database) {}

  private currentRun(): Promise<CurrentRun | null> {
    return this.db.prepare(
      `SELECT id, snapshot_id, plugin_count, generated_at, published_at
       FROM catalog_runs WHERE status = 'current' ORDER BY published_at DESC LIMIT 1`,
    ).first<CurrentRun>();
  }

  async meta(): Promise<{
    generatedAt: string | null;
    pluginCount: number;
    publishedAt: string | null;
    snapshotId: string | null;
  }> {
    const run = await this.currentRun();
    return {
      snapshotId: run?.snapshot_id ?? null,
      generatedAt: run?.generated_at ?? null,
      publishedAt: run?.published_at ?? null,
      pluginCount: run?.plugin_count ?? 0,
    };
  }

  async categories(): Promise<Array<{ count: number; id: string }>> {
    const run = await this.currentRun();
    if (run === null) return [];
    const result = await this.db.prepare(
      `SELECT category_id AS id, COUNT(*) AS count
       FROM plugin_categories WHERE run_id = ?
       GROUP BY category_id ORDER BY category_id`,
    ).bind(run.id).all<{ count: number; id: string }>();
    return result.results;
  }

  async detail(owner: string, repository: string, locale?: string): Promise<CatalogPlugin | null> {
    const run = await this.currentRun();
    if (run === null) return null;
    const row = await this.db.prepare(
      "SELECT raw_json FROM plugin_snapshots WHERE run_id = ? AND slug = ? LIMIT 1",
    ).bind(run.id, `${owner}/${repository}`).first<{ raw_json: string }>();
    if (row === null) return null;
    return localizePlugin(catalogPluginSchema.parse(JSON.parse(row.raw_json)), locale);
  }

  async list(input: CatalogListInput): Promise<{
    items: CatalogPluginSummary[];
    nextCursor: string | null;
    total: number;
  }> {
    const run = await this.currentRun();
    if (run === null) return { items: [], nextCursor: null, total: 0 };

    const query = input.query?.trim() ?? "";
    const categories = input.categories ?? [];
    const compatibility = input.compatibility ?? [];
    const limit = input.limit ?? 24;
    const offset = decodeCursor(input.cursor);
    const where = ["p.run_id = ?"];
    const bindings: unknown[] = [run.id];
    let searchJoin = "";
    if (query) {
      searchJoin = "JOIN plugin_search ON plugin_search.run_id = p.run_id AND plugin_search.plugin_id = p.plugin_id";
      where.push("plugin_search MATCH ?");
      bindings.push(toFtsQuery(query));
    }
    if (categories.length > 0) {
      where.push(`EXISTS (
        SELECT 1 FROM plugin_categories c
        WHERE c.run_id = p.run_id AND c.plugin_id = p.plugin_id
          AND c.category_id IN (${placeholders(categories)})
      )`);
      bindings.push(...categories);
    }
    if (compatibility.length > 0) {
      where.push(`p.compatibility_status IN (${placeholders(compatibility)})`);
      bindings.push(...compatibility);
    }
    const whereSql = where.join(" AND ");
    const orderBy = query
      ? "bm25(plugin_search), p.featured DESC, p.stars DESC, p.name"
      : input.sort === "stars"
        ? "p.stars DESC, p.name"
        : input.sort === "updated"
          ? "p.pushed_at DESC, p.name"
          : input.sort === "name"
            ? "p.name"
            : "p.featured DESC, p.stars DESC, p.name";
    const count = await this.db.prepare(
      `SELECT COUNT(*) AS count FROM plugin_snapshots p ${searchJoin} WHERE ${whereSql}`,
    ).bind(...bindings).first<{ count: number }>();
    const result = await this.db.prepare(
      `SELECT
        p.plugin_id AS id, p.slug, p.name, p.package_name, p.description,
        p.compatibility_status, p.compatibility_level, p.stars, p.pushed_at,
        p.repository_url, p.featured, p.raw_json,
        json_extract(p.installation_json, '$.command') AS install_command
       FROM plugin_snapshots p ${searchJoin}
       WHERE ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
    ).bind(...bindings, limit + 1, offset).all<PluginSummaryRow>();
    const visible = result.results.slice(0, limit);
    const categoryMap = new Map<string, string[]>();
    if (visible.length > 0) {
      const categoryRows = await this.db.prepare(
        `SELECT plugin_id, category_id FROM plugin_categories
         WHERE run_id = ? AND plugin_id IN (${placeholders(visible)})
         ORDER BY category_id`,
      ).bind(run.id, ...visible.map(item => item.id)).all<{ category_id: string; plugin_id: string }>();
      for (const row of categoryRows.results) {
        categoryMap.set(row.plugin_id, [...(categoryMap.get(row.plugin_id) ?? []), row.category_id]);
      }
    }
    return {
      items: visible.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: localizedRowDescription(row.description, row.raw_json, input.locale),
        packageName: row.package_name,
        repositoryUrl: row.repository_url,
        stars: row.stars,
        pushedAt: row.pushed_at,
        featured: row.featured === 1,
        categories: categoryMap.get(row.id) ?? [],
        compatibilityStatus: row.compatibility_status,
        compatibilityLevel: row.compatibility_level,
        installCommand: row.install_command,
      })),
      nextCursor: result.results.length > limit ? encodeCursor(offset + limit) : null,
      total: count?.count ?? 0,
    };
  }
}

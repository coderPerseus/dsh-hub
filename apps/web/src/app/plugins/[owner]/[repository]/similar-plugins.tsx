import type { CatalogPluginSummary } from "@dshhub/contracts";
import type { CSSProperties } from "react";
import Link from "next/link";

import { orpc } from "../../../../lib/orpc";
import { categoryLabel, formatStars } from "../../../../lib/presentation";

type SimilarPluginsProps = {
  categories: string[];
  categoryLabels: Record<string, string>;
  categoriesLabel: string;
  currentId: string;
  currentText: string;
  description: string;
  missingDescription: string;
  title: string;
};

function tokens(value: string): Set<string> {
  return new Set(
    (value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
      .filter(token => token.length > 2 && !["deepseek", "harness", "plugin", "plugins", "dsh"].includes(token)),
  );
}

function similarityScore(
  plugin: CatalogPluginSummary,
  sourceCategories: Set<string>,
  sourceTokens: Set<string>,
): number {
  const sharedCategories = plugin.categories.filter(category => sourceCategories.has(category)).length;
  const sharedTokens = [...tokens(`${plugin.name} ${plugin.packageName} ${plugin.description}`)]
    .filter(token => sourceTokens.has(token)).length;
  return sharedCategories * 100 + sharedTokens * 10 + Math.log10(plugin.stars + 1);
}

export async function SimilarPlugins(props: SimilarPluginsProps) {
  if (props.categories.length === 0) return null;

  let candidates: CatalogPluginSummary[];
  try {
    const result = await orpc.catalog.list({
      categories: props.categories,
      compatibility: [],
      cursor: null,
      limit: 24,
      query: "",
      sort: "stars",
    });
    candidates = result.items;
  } catch {
    return null;
  }

  const sourceCategories = new Set(props.categories);
  const sourceTokens = tokens(props.currentText);
  const related = candidates
    .filter(plugin => plugin.id !== props.currentId)
    .sort((left, right) => (
      similarityScore(right, sourceCategories, sourceTokens)
      - similarityScore(left, sourceCategories, sourceTokens)
    ))
    .slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="detail-panel" aria-labelledby="similar-plugins-title">
      <h2 id="similar-plugins-title">{props.title}</h2>
      <p className="missing-docs">{props.description}</p>
      <div className="plugin-grid">
        {related.map((plugin, index) => (
          <article className="plugin-card" key={plugin.id} style={{ "--order": index } as CSSProperties}>
            <div className="card-head">
              <h3><Link href={`/plugins/${plugin.slug}`}>{plugin.name}</Link></h3>
              <span className="card-stars">★ {formatStars(plugin.stars)}</span>
            </div>
            <p>{plugin.description || props.missingDescription}</p>
            <div className="card-meta">
              <span className="card-cats" aria-label={props.categoriesLabel}>
                {plugin.categories.map(category => categoryLabel(category, props.categoryLabels)).join(" · ")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

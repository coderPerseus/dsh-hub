import type { CatalogListInput, CatalogPluginSummary } from "@dshhub/contracts";
import Link from "next/link";

import { categoryLabel, formatStars } from "../../../../lib/presentation";
import { orpc } from "../../../../lib/orpc";

type SimilarPluginsProps = {
  categories: string[];
  categoryLabels: Record<string, string>;
  currentId: string;
  currentText: string;
  locale: CatalogListInput["locale"];
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
      limit: 48,
      locale: props.locale,
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
    .slice(0, 10);
  if (related.length === 0) return null;

  return (
    <aside className="similar-rail" aria-labelledby="similar-plugins-title">
      <h2 id="similar-plugins-title">{props.title}</h2>
      <ol className="similar-list">
        {related.map(plugin => (
          <li key={plugin.id}>
            <Link className="similar-item" href={`/plugins/${plugin.slug}`}>
              <strong>{plugin.name}</strong>
              <span>
                ★ {formatStars(plugin.stars)}
                {plugin.categories[0]
                  ? ` · ${categoryLabel(plugin.categories[0], props.categoryLabels)}`
                  : ""}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}

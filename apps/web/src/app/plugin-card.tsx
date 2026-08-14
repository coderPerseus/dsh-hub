import type { CatalogPluginSummary } from "@dshhub/contracts";
import type { CSSProperties } from "react";
import Link from "next/link";

import { displayInstallCommand } from "../lib/install-command";
import { categoryLabel, formatStars } from "../lib/presentation";

type PluginCardProps = {
  categoriesLabel: string;
  categoryLabels: Record<string, string>;
  index: number;
  missingDescription: string;
  plugin: CatalogPluginSummary;
  updatedText?: string;
  viewLabel?: string;
};

export function PluginCard(props: PluginCardProps) {
  const href = `/plugins/${props.plugin.slug}`;
  const installCommand = props.plugin.installCommand
    ? displayInstallCommand(props.plugin.installCommand)
    : null;
  return (
    <article className="plugin-card" style={{ "--order": props.index } as CSSProperties}>
      <div className="card-head">
        <h3><Link href={href}>{props.plugin.name}</Link></h3>
        <span className="card-stars">★ {formatStars(props.plugin.stars)}</span>
      </div>
      <code className="card-package">{props.plugin.packageName}</code>
      <p>{props.plugin.description || props.missingDescription}</p>
      <div className="card-meta">
        <span className="card-cats" aria-label={props.categoriesLabel}>
          {props.plugin.categories.map(category => categoryLabel(category, props.categoryLabels)).join(" · ")}
        </span>
        {props.updatedText && <time>{props.updatedText}</time>}
      </div>
      {installCommand && (
        <code className="card-command"><em>$</em> {installCommand}</code>
      )}
      {props.viewLabel && (
        <div className="card-footer">
          <Link href={href}>{props.viewLabel}</Link>
        </div>
      )}
    </article>
  );
}

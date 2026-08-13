import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "../../../copy-button";
import { PageStage } from "../../../page-stage";
import { getPlugin } from "../../../../lib/catalog";
import { catalogHref } from "../../../../lib/catalog-href";
import { getTranslator } from "../../../../lib/i18n/get-locale";
import {
  categoryLabel,
  formatDate,
  formatStars,
} from "../../../../lib/presentation";
import { absoluteUrl } from "../../../../lib/site";

type PluginPageProps = {
  params: Promise<{ owner: string; repository: string }>;
};

export async function generateMetadata({ params }: PluginPageProps): Promise<Metadata> {
  const { owner, repository } = await params;
  const { locale, t } = await getTranslator();
  const result = await getPlugin(owner, repository, locale);
  if (!result.ok || !result.plugin) {
    return { robots: { follow: true, index: false }, title: t.pluginDetail };
  }

  const plugin = result.plugin;
  const description = (plugin.description || t.missingDescription).slice(0, 160);
  const path = `/plugins/${plugin.slug}`;
  return {
    alternates: { canonical: path },
    description,
    keywords: [plugin.name, plugin.package.name, ...plugin.categories, "DeepSeek Harness plugin"],
    openGraph: {
      description,
      title: plugin.name,
      type: "website",
      url: path,
    },
    title: plugin.name,
    twitter: { card: "summary", description, title: plugin.name },
  };
}

export default async function PluginPage({ params }: PluginPageProps) {
  const { owner, repository } = await params;
  const { locale, t } = await getTranslator();
  const result = await getPlugin(owner, repository, locale);
  if (result.ok && result.plugin === null) notFound();

  if (!result.ok) {
    return (
      <PageStage>
        <div className="detail-main">
          <div className="ds-container">
            <Link className="back-link" href="/">← {t.backToCatalog}</Link>
            <div className="empty-state error-state">
              <span>503</span>
              <h1>{t.errorDetail}</h1>
              <p>{t.errorDetailHint}</p>
            </div>
          </div>
        </div>
      </PageStage>
    );
  }

  const plugin = result.plugin;
  if (plugin === null) notFound();
  const pluginUrl = absoluteUrl(`/plugins/${plugin.slug}`);
  const facts = [
    plugin.package.version ? { label: t.version, value: plugin.package.version } : null,
    plugin.repository.license ? { label: t.license, value: plugin.repository.license } : null,
    plugin.repository.pushedAt
      ? { label: t.lastUpdated, value: formatDate(plugin.repository.pushedAt, locale) }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${pluginUrl}#software`,
        "@type": "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        codeRepository: plugin.repository.url,
        description: plugin.description || t.missingDescription,
        isAccessibleForFree: true,
        license: plugin.repository.license ?? undefined,
        name: plugin.name,
        operatingSystem: "DeepSeek Harness",
        softwareVersion: plugin.package.version ?? undefined,
        url: pluginUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: absoluteUrl(), name: "DSH Hub", position: 1 },
          { "@type": "ListItem", item: absoluteUrl("/#catalog"), name: t.plugins, position: 2 },
          { "@type": "ListItem", item: pluginUrl, name: plugin.name, position: 3 },
        ],
      },
    ],
  };

  return (
    <PageStage>
      <article className="detail-main">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
        <div className="ds-container">
          <nav className="back-link" aria-label="Breadcrumb">
            <Link href="/">DSH Hub</Link> / <Link href="/#catalog">{t.plugins}</Link> / <span>{plugin.name}</span>
          </nav>

          <header className="detail-hero">
            <p className="detail-slug">
              <a href={plugin.repository.url} rel="noreferrer" target="_blank">{plugin.slug} ↗</a>
              <span>★ {formatStars(plugin.repository.stars)}</span>
            </p>
            <h1>{plugin.name}</h1>
            {plugin.description ? <p className="detail-summary">{plugin.description}</p> : null}
            {plugin.categories.length > 0 && (
              <div className="tags">
                {plugin.categories.map(category => (
                  <span key={category}>
                    <Link href={`${catalogHref({ categories: [category] })}#catalog`}>
                      {categoryLabel(category, t.categories)}
                    </Link>
                  </span>
                ))}
              </div>
            )}
            {facts.length > 0 && (
              <dl className="detail-meta">
                {facts.map(fact => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          <section className="detail-install" aria-labelledby="install-title">
            <h2 id="install-title">{t.installTitle}</h2>
            {plugin.installation.command ? (
              <div className="command-block">
                <span>$</span>
                <code>{plugin.installation.command}</code>
                <CopyButton copiedLabel={t.copied} copyLabel={t.copy} value={plugin.installation.command} />
              </div>
            ) : (
              <p className="detail-install-fallback">
                {t.manualInstallHint}{" "}
                <a href={plugin.repository.url} rel="noreferrer" target="_blank">{t.readme}</a>
              </p>
            )}
          </section>
        </div>
      </article>
    </PageStage>
  );
}

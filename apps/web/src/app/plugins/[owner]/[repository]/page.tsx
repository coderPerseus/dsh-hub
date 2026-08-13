import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "../../../copy-button";
import { PageStage } from "../../../page-stage";
import { getPlugin } from "../../../../lib/catalog";
import { getTranslator } from "../../../../lib/i18n/get-locale";
import { catalogHref } from "../../../../lib/catalog-href";
import {
  categoryLabel,
  formatDate,
  formatStars,
} from "../../../../lib/presentation";
import { absoluteUrl } from "../../../../lib/site";
import { SimilarPlugins } from "./similar-plugins";

type PluginPageProps = {
  params: Promise<{ owner: string; repository: string }>;
};

export async function generateMetadata({ params }: PluginPageProps): Promise<Metadata> {
  const { owner, repository } = await params;
  const { t } = await getTranslator();
  const result = await getPlugin(owner, repository);
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
  const result = await getPlugin(owner, repository);
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
            <p className="detail-summary">{plugin.description || t.missingDescription}</p>
            <div className="tags">
              {plugin.categories.map(category => (
                <span key={category}>
                  <Link href={`${catalogHref({ categories: [category] })}#catalog`}>
                    {categoryLabel(category, t.categories)}
                  </Link>
                </span>
              ))}
            </div>
            <dl className="detail-meta">
              <div>
                <dt>{t.version}</dt>
                <dd>{plugin.package.version ?? t.notDeclared}</dd>
              </div>
              <div>
                <dt>{t.license}</dt>
                <dd>{plugin.repository.license ?? t.notDeclared}</dd>
              </div>
              <div>
                <dt>{t.lastUpdated}</dt>
                <dd>{plugin.repository.pushedAt ? formatDate(plugin.repository.pushedAt, locale) : t.unknownDate}</dd>
              </div>
            </dl>
          </header>

          <section className="detail-panel" aria-labelledby="install-title">
            <h2 id="install-title">{t.installTitle}</h2>
            {plugin.installation.command ? (
              <div className="command-block">
                <span>$</span>
                <code>{plugin.installation.command}</code>
                <CopyButton copiedLabel={t.copied} copyLabel={t.copy} value={plugin.installation.command} />
              </div>
            ) : (
              <div className="manual-notice">
                <strong>{t.manualInstall}</strong>
                <p>{t.manualInstallHint}</p>
              </div>
            )}
            {plugin.installation.notes.map(note => <p className="install-note" key={note}>⚠ {note}</p>)}
            <p className="pin-note">
              {t.pinNoteBefore} <code>{plugin.repository.commit.slice(0, 12)}</code>{t.pinNoteAfter}
            </p>
            {plugin.installation.markdown && (
              <div className="markdown-body install-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plugin.installation.markdown}</ReactMarkdown>
              </div>
            )}
          </section>

          <div className="detail-split">
            <section className="detail-panel" aria-labelledby="evidence-title">
              <h2 id="evidence-title">{t.compatibility.label}</h2>
              <div className="check-list">
                {plugin.compatibility.checks.map(check => (
                  <div className={`check check-${check.status}`} key={check.id}>
                    <span>{check.status === "pass" ? "✓" : check.status === "fail" ? "×" : check.status === "warn" ? "!" : "–"}</span>
                    <div><strong>{check.id}</strong><p>{check.summary}</p></div>
                  </div>
                ))}
              </div>
              <dl className="range-list">
                <div><dt>{t.harnessRange}</dt><dd>{plugin.compatibility.harnessRange ?? t.notDeclared}</dd></div>
                <div><dt>{t.cordisRange}</dt><dd>{plugin.compatibility.cordisRange ?? t.notDeclared}</dd></div>
              </dl>
            </section>

            <aside className="detail-panel source-panel">
              <div><span>{t.package}</span><code>{plugin.package.name}</code></div>
              <div>
                <span>{t.source}</span>
                <a href={plugin.repository.url} rel="noreferrer" target="_blank">{plugin.slug} ↗</a>
              </div>
              <div><span>{t.defaultBranch}</span><code>{plugin.repository.defaultBranch}</code></div>
            </aside>
          </div>

          <section className="detail-panel" aria-labelledby="usage-title">
            <h2 id="usage-title">{t.usageTitle}</h2>
            {plugin.usage.markdown ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plugin.usage.markdown}</ReactMarkdown>
              </div>
            ) : (
              <p className="missing-docs">{t.missingDocs}</p>
            )}
            <a className="source-link" href={plugin.usage.readmeUrl} rel="noreferrer" target="_blank">{t.readme}</a>
          </section>

          <SimilarPlugins
            categories={plugin.categories}
            categoryLabels={t.categories}
            categoriesLabel={t.categoriesLabel}
            currentId={plugin.id}
            currentText={`${plugin.name} ${plugin.package.name} ${plugin.description}`}
            description={t.relatedPluginsHint}
            missingDescription={t.missingDescription}
            title={t.relatedPlugins}
          />
        </div>
      </article>
    </PageStage>
  );
}

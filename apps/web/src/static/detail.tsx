import type { CatalogPlugin } from "../../../../packages/catalog/src/index";
import type { PluginSummary } from "../../../../packages/client/src/index";
import Link from "./link";
import { useTranslator } from "./locale";
import { CopyButton } from "../app/copy-button";
import { PageStage } from "../app/page-stage";
import { catalogHref } from "../lib/catalog-href";
import { displayInstallCommand } from "../lib/install-command";
import { pluginPackageDirectory, pluginRepositoryUrl, readmeExcerpt } from "../lib/plugin-readme";
import { PluginReadme } from "../app/plugins/[owner]/[repository]/plugin-readme";
import { categoryLabel, formatDate, formatStars } from "../lib/presentation";
import { absoluteUrl } from "../lib/site";

export default function Detail({plugin, related}: {plugin: CatalogPlugin; related: PluginSummary[]}) {
  const {locale, t} = useTranslator();
  const catalogLocale = locale === "zh-TW" ? "zh-CN" : locale;
  const isChineseLocale = locale === "zh-CN" || locale === "zh-TW";
  const pluginAiAnalysis = plugin.aiAnalysis;
  const descriptionText = (plugin.i18n?.[catalogLocale]?.description || plugin.description).trim();
  const aiAnalysis = pluginAiAnalysis?.[catalogLocale] || pluginAiAnalysis?.["zh-CN"] || null;
  const aiAnalysisLabel = isChineseLocale ? "AI 分析" : "AI Analysis";
  const aiAnalysisText = aiAnalysis
    || (isChineseLocale ? "该插件暂无 AI 分析内容。" : "AI analysis is not available for this plugin yet.");
  const readme = { markdown: plugin.usage.markdown || plugin.installation.markdown, sourceUrl: plugin.usage.readmeUrl };
  const description = descriptionText || readmeExcerpt(readme.markdown);
  const installCommand = plugin.installation.command
    ? displayInstallCommand(plugin.installation.command)
    : null;
  const pluginUrl = absoluteUrl(`/plugins/${plugin.slug}`);
  const repositoryUrl = pluginRepositoryUrl(plugin);
  const packageDirectory = pluginPackageDirectory(plugin.id);
  const homepage = plugin.repository.homepage?.trim() || null;
  const facts = [
    { label: t.package, value: plugin.package.name },
    plugin.package.version ? { label: t.version, value: plugin.package.version } : null,
    plugin.repository.license ? { label: t.license, value: plugin.repository.license } : null,
    plugin.repository.pushedAt
      ? { label: t.lastUpdated, value: formatDate(plugin.repository.pushedAt, locale) }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);
  const links = [
    { href: repositoryUrl, label: t.github },
    packageDirectory ? { href: plugin.repository.url, label: t.packagePath } : null,
    homepage ? { href: homepage, label: t.website } : null,
    { href: readme.sourceUrl, label: t.docs },
  ].filter((item): item is { href: string; label: string } => item !== null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${pluginUrl}#software`,
        "@type": "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        codeRepository: plugin.repository.url,
        description: description || t.missingDescription,
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

          <div className="detail-layout">
            <div className="detail-primary">
              <header className="detail-hero">
                <p className="detail-slug">
                  <a href={repositoryUrl} rel="noreferrer" target="_blank">{plugin.slug} ↗</a>
                  <span>★ {formatStars(plugin.repository.stars)}</span>
                </p>
                <h1>{plugin.name}</h1>
                <p className="detail-summary">{description || t.missingDescription}</p>
                <section className="detail-analysis">
                  <h2>{aiAnalysisLabel}</h2>
                  <p>{aiAnalysisText}</p>
                </section>
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
                <nav className="detail-links" aria-label={t.docs}>
                  {links.map(link => (
                    <a key={`${link.label}:${link.href}`} href={link.href} rel="noreferrer" target="_blank">
                      {link.label} ↗
                    </a>
                  ))}
                </nav>
              </header>

              <section className="detail-install" aria-labelledby="install-title">
                <h2 id="install-title">{t.installTitle}</h2>
                {installCommand ? (
                  <div className="command-block">
                    <span>$</span>
                    <code>{installCommand}</code>
                    <CopyButton copiedLabel={t.copied} copyLabel={t.copy} value={installCommand} />
                  </div>
                ) : (
                  <p className="detail-install-fallback">
                    {t.manualInstallHint}{" "}
                    <a href={readme.sourceUrl} rel="noreferrer" target="_blank">{t.readme}</a>
                  </p>
                )}
              </section>

              <PluginReadme
                markdown={readme.markdown}
                missingLabel={t.missingDocs}
                sourceLabel={t.readme}
                sourceUrl={readme.sourceUrl}
                title={t.readmeTitle}
              />
            </div>

            <aside className="similar-rail"><h2>{t.relatedPlugins}</h2><ol className="similar-list">{related.map(p => <li key={p.id}><Link className="similar-item" href={'/plugins/' + p.slug}><strong>{p.name}</strong><span>★ {formatStars(p.stars)}</span></Link></li>)}</ol></aside>
          </div>
        </div>
      </article>
    </PageStage>
  );
}

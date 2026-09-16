import type { CatalogPlugin } from "../../../../packages/catalog/src/index";
import type { PluginSummary } from "../../../../packages/client/src/index";
import Link from "./link";
import { useTranslator } from "./locale";
import { CopyButton } from "../app/copy-button";
import { PageStage } from "../app/page-stage";
import { listingPath } from "../lib/listing";
import { categoryLabels } from "../lib/i18n/categories";
import { pluginDescription } from "../lib/plugin-description";
import { displayInstallCommand } from "../lib/install-command";
import { pluginPackageDirectory, pluginRepositoryUrl } from "../lib/plugin-readme";
import { PluginReadme } from "../app/plugins/[owner]/[repository]/plugin-readme";
import { categoryLabel, formatDate, formatStars } from "../lib/presentation";
import { localizedHref } from "../lib/i18n/routing";
import { absoluteUrl } from "../lib/site";

export default function Detail({plugin, related, variants = [], canonicalSlug}: {plugin: CatalogPlugin; related: PluginSummary[]; variants?: Array<{slug: string; repository: string}>; canonicalSlug?: string}) {
  const {locale, t} = useTranslator();
  const readme = { markdown: plugin.usage.markdown || plugin.installation.markdown, sourceUrl: plugin.usage.readmeUrl };
  const description = pluginDescription(plugin, locale);
  const installCommand = plugin.installation.command
    ? displayInstallCommand(plugin.installation.command)
    : null;
  const pluginUrl = absoluteUrl(localizedHref(`/plugins/${plugin.slug}`, locale));
  const repositoryUrl = pluginRepositoryUrl(plugin);
  const packageDirectory = pluginPackageDirectory(plugin.id);
  const homepage = plugin.repository.homepage?.trim() || null;
  const facts = [
    { label: t.package, value: plugin.package.name },
    { label: t.compatibility.label, value: t.compatibility[plugin.compatibility.status] },
    plugin.compatibility.harnessRange ? { label: t.harnessRange, value: plugin.compatibility.harnessRange } : null,
    plugin.compatibility.cordisRange ? { label: t.cordisRange, value: plugin.compatibility.cordisRange } : null,
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
        sameAs: repositoryUrl,
        inLanguage: locale,
        description: description || t.missingDescription,
        license: plugin.repository.license ?? undefined,
        name: plugin.name,
        operatingSystem: "DeepSeek Harness",
        softwareVersion: plugin.package.version ?? undefined,
        url: pluginUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: absoluteUrl(localizedHref("/", locale)), name: "DSH Hub", position: 1 },
          { "@type": "ListItem", item: absoluteUrl(localizedHref("/#catalog", locale)), name: t.plugins, position: 2 },
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
                {plugin.categories.length > 0 && (
                  <div className="tags">
                    {plugin.categories.map(category => (
                      <span key={category}>
                        <Link href={listingPath(category)}>
                          {categoryLabel(category, categoryLabels(locale))}
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
                {canonicalSlug && canonicalSlug !== plugin.slug && <p className="duplicate-note"><Link href={'/plugins/' + canonicalSlug}>{({'zh-CN':'查看内容一致的目录代表页','zh-TW':'查看內容一致的目錄代表頁',en:'View the directory representative for this identical content',ja:'同一内容の代表ページを見る',ko:'동일한 콘텐츠의 대표 페이지 보기'})[locale]}</Link></p>}
                {variants.length > 0 && <section className="detail-variants"><h2>{({'zh-CN':'同名包的其他仓库','zh-TW':'同名套件的其他儲存庫',en:'Other repositories with this package name',ja:'同名パッケージの別リポジトリ',ko:'같은 패키지 이름의 다른 저장소'})[locale]}</h2><ul>{variants.map(v => <li key={v.slug}><Link href={'/plugins/' + v.slug}>{v.repository}</Link></li>)}</ul></section>}
                <nav className="detail-links" aria-label={t.docs}>
                  {links.map(link => (
                    <a key={`${link.label}:${link.href}`} href={link.href} rel="noreferrer" target="_blank">
                      {link.label} ↗
                    </a>
                  ))}
                </nav>
              </header>

              <nav className="detail-section-nav" aria-label={t.pluginDetail}>
                <a href="#install-title">{t.installTitle}</a><a href="#readme-title">{t.readmeTitle}</a><a href="#related-title">{t.relatedPlugins}</a>
              </nav>
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

            <aside className="similar-rail"><h2 id="related-title">{t.relatedPlugins}</h2><ol className="similar-list">{related.map(p => <li key={p.id}><Link className="similar-item" href={'/plugins/' + p.slug}><strong>{p.name}</strong><span>★ {formatStars(p.stars)}</span></Link></li>)}</ol></aside>
          </div>
        </div>
      </article>
    </PageStage>
  );
}

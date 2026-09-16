import Link from "./link";
import { categoryCopy, categoryLabels, listingTitle } from "../lib/i18n/categories";
import { listingPath, type ListingPage } from "../lib/listing";
import { loadBrowserIndex, type WebManifest } from "../lib/load-browser-index";
import { discoveryCopy } from "../lib/i18n/discovery";
import { absoluteUrl } from "../lib/site";
import { useEffect, useState } from "react";
import { searchStaticCatalog, type StaticIndex } from "../../../../packages/client/src/static";
import { useTranslator } from "./locale";

import { localizedHref } from "../lib/i18n/routing";
import { CatalogSearch } from "../app/catalog-search";
import { HeroBackdrop } from "../app/hero-backdrop";
import { PluginCard } from "../app/plugin-card";

import { catalogHref, previousCatalogCursor } from "../lib/catalog-href";

import {
  categoryLabel,
  formatDate,
} from "../lib/presentation";



function values(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function scalar(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function Home({ initial, manifest, listing }: { initial: StaticIndex; manifest: WebManifest; listing?: ListingPage }) {
  const { locale, t } = useTranslator();
  const copy = discoveryCopy[locale];
  const labels = categoryLabels(locale);
  const pageTitle = listing?.category || (listing?.page || 1) > 1 ? listingTitle(locale, listing?.category, listing?.page) : copy.title;
  const intro = listing?.category ? categoryCopy(listing.category, locale).description : copy.intro;
  const pagePath = localizedHref(listing?.path || '/', locale);
  const homePath = localizedHref("/", locale);
  const [index, setIndex] = useState(initial);
  const [raw, setRaw] = useState<Record<string, string[]>>({});
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const update = () => { const params = new URLSearchParams(location.search); const next: Record<string,string[]> = {}; for (const key of new Set(params.keys())) next[key] = params.getAll(key); setRaw(next); };
    update();
    window.addEventListener('popstate', update);
    const click = (event: MouseEvent) => {
      const a = (event.target as Element).closest('a');
      if (!a || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href); if (location.pathname !== homePath) return; if (url.origin !== location.origin || url.pathname !== homePath || !url.search) return;
      event.preventDefault(); history.pushState(null, '', url); window.dispatchEvent(new PopStateEvent('popstate'));
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement; if (location.pathname !== homePath) return; if (form.getAttribute('role') !== 'search') return;
      event.preventDefault(); const params = new URLSearchParams(new FormData(form) as unknown as Record<string,string>);
      history.pushState(null, '', homePath + '?' + params); window.dispatchEvent(new PopStateEvent('popstate'));
    };
    document.addEventListener('click', click); document.addEventListener('submit', submit);
    return () => { window.removeEventListener('popstate', update); document.removeEventListener('click', click); document.removeEventListener('submit', submit); };
  }, [homePath]);
  const dynamic = ['q', 'category', 'compatibility', 'sort', 'cursor'].some(key => Boolean(raw[key]?.some(Boolean)));
  useEffect(() => {
    if (!dynamic || ready) return;
    let active = true;
    setLoading(true); setFailed(false);
    loadBrowserIndex(manifest, locale).then(data => {
      if (active) { setIndex(data); setReady(true); setLoading(false); }
    }).catch(() => { if (active) { setFailed(true); setLoading(false); } });
    return () => { active = false; };
  }, [dynamic, ready, retry, manifest, locale]);
  const query = scalar(raw.q).slice(0, 100);
  const categories = dynamic ? values(raw.category).slice(0, 10) : listing?.category ? [listing.category] : [];
  const compatibility = values(raw.compatibility)
    .filter((item): item is "compatible" | "incompatible" | "unknown" => (
      item === "compatible" || item === "incompatible" || item === "unknown"
    ));
  const requestedSort = scalar(raw.sort);
  const sort = requestedSort === "stars" || requestedSort === "updated" || requestedSort === "name"
    ? requestedSort
    : "featured";
  const cursor = scalar(raw.cursor) || null;
  const list = dynamic && ready ? searchStaticCatalog(index, { query, categories, compatibility, sort, cursor, locale })
    : {items: initial.items.map(({searchText: _, ...p}) => ({...p, description: (locale === 'zh-CN' || locale === 'zh-TW') && p.descriptionZh ? p.descriptionZh : p.description})), total: listing?.total ?? manifest.pluginCount, nextCursor: null};
  const catalog = {ok: true, meta: {pluginCount: manifest.pluginCount}, categories: index.categories, list};
  const hasFilters = dynamic;
  const pending = dynamic && !ready;
  const showPrevious = !pending && (dynamic ? Boolean(cursor) : Boolean(listing?.previousPath));
  const previousCursor = previousCatalogCursor(cursor);
  const showNext = !pending && (dynamic ? Boolean(catalog.list.nextCursor) : Boolean(listing?.nextPath));
  const hrefState = { query, categories, compatibility, sort };
  const sortOptions = [
    { id: "featured", label: t.recommended },
    { id: "stars", label: t.sortStars },
    { id: "updated", label: t.recentlyUpdated },
    { id: "name", label: t.sortName },
  ] as const;
  const compatibilityOptions = [
    { id: "", label: t.compatibilityAll },
    { id: "unknown", label: t.compatibilityUnknown },
    { id: "incompatible", label: t.compatibilityIncompatible },
  ] as const;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@graph': [
          {'@type': 'WebSite', '@id': absoluteUrl('/#website'), name: 'DSH Hub', url: absoluteUrl('/')},
          {'@type': 'CollectionPage', url: absoluteUrl(pagePath), name: pageTitle, description: intro, inLanguage: locale, isPartOf: {'@id': absoluteUrl('/#website')},
            mainEntity: {'@type': 'ItemList', itemListElement: initial.items.map((p, i) => ({'@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(localizedHref('/plugins/' + p.slug, locale))}))}},
        ],
      }).replace(/</g, "\\u003c") }} />
      <section className="hero" aria-hidden="true">
        <HeroBackdrop />
      </section>
      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="ds-container">
          <header className="catalog-intro">
            {listing?.category && <nav className="back-link" aria-label="Breadcrumb"><Link href="/">DSH Hub</Link> / <span>{categoryCopy(listing.category, locale).label}</span></nav>}
            <p className="catalog-kicker">{t.slogan}</p>
            <div className="catalog-intro-row">
              <h1 id="catalog-title">{pageTitle}</h1>
              {catalog.ok && (
                <p className="catalog-count">
                  <strong>{catalog.list.total}</strong>
                  <span>{t.resultCount}</span>
                </p>
              )}
            </div>
            <p className="catalog-description">{intro}</p>
          </header>

          {pending && failed && <p role="alert">{t.errorHint} <button type="button" onClick={() => setRetry(n => n + 1)}>{t.search}</button></p>}
          {pending && loading && <p role="status">正在加载搜索目录… / Loading search index…</p>}
          <CatalogSearch action={homePath}
            key={query}
            categories={categories}
            compatibility={compatibility}
            placeholder={t.searchPlaceholder}
            query={query}
            sort={sort}
            submitLabel={t.search}
          />

          <div className="filter-bar">
            <div className="chip-row" aria-label={t.categoriesLabel}>
              <Link className={categories.length === 0 ? "chip is-active" : "chip"} href={dynamic ? catalogHref({ ...hrefState, categories: [] }) : "/"}>
                {t.allCategories}
              </Link>
              {catalog.ok && catalog.categories.map(category => {
                const active = categories.includes(category.id);
                const next = active
                  ? categories.filter(item => item !== category.id)
                  : [...categories, category.id];
                return (
                  <Link
                    className={active ? "chip is-active" : "chip"}
                    href={dynamic ? catalogHref({ ...hrefState, categories: next }) : listingPath(category.id)}
                    key={category.id}
                  >
                    {categoryLabel(category.id, labels)}
                    <small>{category.count}</small>
                  </Link>
                );
              })}
            </div>
            <div className="filter-meta">
              <div className="filter-groups">
                <div className="segment" aria-label={t.sort}>
                  {sortOptions.map(option => (
                    <Link
                      className={sort === option.id ? "is-active" : undefined}
                      href={catalogHref({ ...hrefState, sort: option.id })}
                      key={option.id}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
                <div className="segment" aria-label={t.compatibility.label}>
                  {compatibilityOptions.map(option => {
                    const active = option.id === "" ? compatibility.length === 0 : compatibility[0] === option.id;
                    return (
                      <Link
                        className={active ? "is-active" : undefined}
                        href={catalogHref({
                          ...hrefState,
                          compatibility: option.id ? [option.id] : [],
                        })}
                        key={option.id || "all"}
                      >
                        {option.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              {hasFilters && (
                <Link className="clear-filters" href="/">{t.clear}</Link>
              )}
            </div>
          </div>

          {pending ? null : !catalog.ok ? (
            <div className="empty-state error-state">
              <span>503</span>
              <h3>{t.errorTitle}</h3>
              <p>{t.errorHint}</p>
            </div>
          ) : catalog.list.items.length === 0 ? (
            <div className="empty-state">
              <span>000</span>
              <h3>{catalog.meta.pluginCount === 0 ? t.emptyCatalog : t.noMatch}</h3>
              <p>{catalog.meta.pluginCount === 0 ? t.emptyCatalogHint : t.noMatchHint}</p>
              {hasFilters && <Link href="/">{t.clearFilters}</Link>}
            </div>
          ) : (
            <div className="plugin-grid">
              {catalog.list.items.map((plugin, index) => (
                <PluginCard
                  categoriesLabel={t.categoriesLabel}
                  categoryLabels={labels}
                  copiedLabel={t.copied}
                  copyLabel={t.copy}
                  index={index}
                  key={plugin.id}
                  missingDescription={t.missingDescription}
                  plugin={plugin}
                  updatedText={plugin.pushedAt ? formatDate(plugin.pushedAt, locale) : t.updatedUnknown}
                  viewLabel={t.viewInstall}
                />
              ))}
            </div>
          )}

          {catalog.ok && (showPrevious || showNext) && (
            <nav className="pager" aria-label="pagination">
              {showPrevious ? (
                <Link className="pager-btn" href={dynamic ? catalogHref({ ...hrefState, cursor: previousCursor }) : listing!.previousPath!}>
                  {t.previousPage}
                </Link>
              ) : <span />}
              {showNext ? (
                <Link className="pager-btn pager-next" href={dynamic ? catalogHref({ ...hrefState, cursor: catalog.list.nextCursor }) : listing!.nextPath!}>
                  {t.nextPage}
                </Link>
              ) : null}
            </nav>
          )}
          <section className="discovery-guide" aria-labelledby="guide-title">
            <h2 id="guide-title">{copy.guide}</h2>
            <ol className="discovery-steps">{copy.steps.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}</ol>
          </section>
          <section className="discovery-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">{copy.faq}</h2>
            {copy.questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </section>
        </div>
      </section>
    </main>
  );
}

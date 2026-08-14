import Link from "next/link";

import { CatalogSearch } from "./catalog-search";
import { HeroBackdrop } from "./hero-backdrop";
import { PluginCard } from "./plugin-card";
import { getCatalogIndex } from "../lib/catalog";
import { catalogHref, previousCatalogCursor } from "../lib/catalog-href";
import { getTranslator } from "../lib/i18n/get-locale";
import {
  categoryLabel,
  formatDate,
} from "../lib/presentation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function values(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function scalar(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const { locale, t } = await getTranslator();
  const query = scalar(raw.q).slice(0, 100);
  const categories = values(raw.category).slice(0, 10);
  const compatibility = values(raw.compatibility)
    .filter((item): item is "compatible" | "incompatible" | "unknown" => (
      item === "compatible" || item === "incompatible" || item === "unknown"
    ));
  const requestedSort = scalar(raw.sort);
  const sort = requestedSort === "stars" || requestedSort === "updated" || requestedSort === "name"
    ? requestedSort
    : "featured";
  const cursor = scalar(raw.cursor) || null;
  const catalog = await getCatalogIndex({ query, categories, compatibility, sort, cursor, locale });
  const hasFilters = Boolean(query || categories.length > 0 || compatibility.length > 0 || sort !== "featured");
  const showPrevious = Boolean(cursor);
  const previousCursor = previousCatalogCursor(cursor);
  const showNext = Boolean(catalog.ok && catalog.list.nextCursor);
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
      <section className="hero" aria-hidden="true">
        <HeroBackdrop />
      </section>
      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="ds-container">
          <header className="catalog-intro">
            <p className="slogan">{t.slogan}</p>
            <div className="catalog-intro-row">
              <h1 id="catalog-title">{t.catalogTitle}</h1>
              {catalog.ok && (
                <p className="catalog-count">
                  <strong>{catalog.list.total}</strong>
                  <span>{t.resultCount}</span>
                </p>
              )}
            </div>
          </header>

          <CatalogSearch
            categories={categories}
            compatibility={compatibility}
            placeholder={t.searchPlaceholder}
            query={query}
            sort={sort}
            submitLabel={t.search}
          />

          <div className="filter-bar">
            <div className="chip-row" aria-label={t.categoriesLabel}>
              <Link className={categories.length === 0 ? "chip is-active" : "chip"} href={catalogHref({ ...hrefState, categories: [] })}>
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
                    href={catalogHref({ ...hrefState, categories: next })}
                    key={category.id}
                  >
                    {categoryLabel(category.id, t.categories)}
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

          {!catalog.ok ? (
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
                  categoryLabels={t.categories}
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
                <Link className="pager-btn" href={catalogHref({ ...hrefState, cursor: previousCursor })}>
                  {t.previousPage}
                </Link>
              ) : <span />}
              {showNext ? (
                <Link className="pager-btn pager-next" href={catalogHref({ ...hrefState, cursor: catalog.list.nextCursor })}>
                  {t.nextPage}
                </Link>
              ) : null}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}

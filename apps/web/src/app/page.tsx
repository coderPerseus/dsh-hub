import Link from "next/link";

import { getCatalogIndex } from "../lib/catalog";
import {
  categoryLabel,
  compatibilityLabel,
  compatibilityTone,
  formatDate,
  formatStars,
} from "../lib/presentation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function values(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function scalar(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageHref(params: Record<string, string | string[]>, cursor: string): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item) query.append(key, item);
    }
  }
  query.set("cursor", cursor);
  return `/?${query.toString()}#catalog`;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
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
  const catalog = await getCatalogIndex({ query, categories, compatibility, sort, cursor });

  return (
    <main>
      <section className="hero" aria-labelledby="page-title">
        <p className="kicker"><span>01</span> COMMUNITY INDEX</p>
        <h1 id="page-title">给 Harness<br />装上新能力。</h1>
        <div className="hero-copy">
          <p>从社区仓库生成的 DeepSeek Harness 插件目录。搜索功能、核对兼容性，再按固定提交安装。</p>
          <div className="hero-stat" aria-label="目录插件数">
            <strong>{catalog.ok ? catalog.meta.pluginCount : "—"}</strong>
            <span>INDEXED<br />PLUGINS</span>
          </div>
        </div>
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <p className="kicker"><span>02</span> CATALOG</p>
          <h2 id="catalog-title">插件目录</h2>
          {catalog.ok && <p>{catalog.list.total} 个结果</p>}
        </div>

        <form className="filters" action="/" method="get">
          <label className="search-field">
            <span>搜索插件</span>
            <input defaultValue={query} name="q" placeholder="名称、描述、包名…" type="search" />
          </label>
          <label>
            <span>排序</span>
            <select defaultValue={sort} name="sort">
              <option value="featured">编辑推荐</option>
              <option value="stars">Star 数</option>
              <option value="updated">最近更新</option>
              <option value="name">名称</option>
            </select>
          </label>
          <label>
            <span>兼容性</span>
            <select defaultValue={compatibility[0] ?? ""} name="compatibility">
              <option value="">全部状态</option>
              <option value="compatible">兼容</option>
              <option value="unknown">待验证</option>
              <option value="incompatible">不兼容</option>
            </select>
          </label>
          <button type="submit">应用筛选 →</button>

          {catalog.ok && catalog.categories.length > 0 && (
            <fieldset className="category-filter">
              <legend>分类</legend>
              {catalog.categories.map(category => (
                <label key={category.id}>
                  <input
                    defaultChecked={categories.includes(category.id)}
                    name="category"
                    type="checkbox"
                    value={category.id}
                  />
                  <span>{categoryLabel(category.id)} <small>{category.count}</small></span>
                </label>
              ))}
            </fieldset>
          )}
        </form>

        {!catalog.ok ? (
          <div className="empty-state error-state">
            <span>503</span>
            <h3>目录服务暂时不可用</h3>
            <p>API 没有响应。请检查 API Service Binding，或为本地环境配置 API_URL。</p>
          </div>
        ) : catalog.list.items.length === 0 ? (
          <div className="empty-state">
            <span>000</span>
            <h3>{catalog.meta.pluginCount === 0 ? "目录还没有发布插件" : "没有匹配的插件"}</h3>
            <p>{catalog.meta.pluginCount === 0 ? "向 registry 添加首个插件后，CI 会生成并发布目录。" : "换一个关键词，或减少筛选条件。"}</p>
            {(query || categories.length > 0 || compatibility.length > 0) && <Link href="/#catalog">清除筛选</Link>}
          </div>
        ) : (
          <div className="plugin-grid">
            {catalog.list.items.map((plugin, index) => (
              <article className="plugin-card" key={plugin.id} style={{ "--order": index } as React.CSSProperties}>
                <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="card-topline">
                  <span className={`compatibility ${compatibilityTone(plugin.compatibilityStatus)}`}>
                    {compatibilityLabel(plugin.compatibilityStatus, plugin.compatibilityLevel)}
                  </span>
                  <span>★ {formatStars(plugin.stars)}</span>
                </div>
                <h3><Link href={`/plugins/${plugin.slug}`}>{plugin.name}</Link></h3>
                <code>{plugin.packageName}</code>
                <p>{plugin.description || "仓库暂未提供描述。"}</p>
                <div className="tags" aria-label="插件分类">
                  {plugin.categories.map(category => <span key={category}>{categoryLabel(category)}</span>)}
                </div>
                <div className="card-footer">
                  <span>{plugin.pushedAt ? formatDate(plugin.pushedAt) : "更新时间未知"}</span>
                  <Link href={`/plugins/${plugin.slug}`}>查看安装 →</Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {catalog.ok && catalog.list.nextCursor && (
          <Link
            className="load-more"
            href={pageHref({ q: query, category: categories, compatibility, sort }, catalog.list.nextCursor)}
          >
            下一页 <span>↓</span>
          </Link>
        )}
      </section>
    </main>
  );
}

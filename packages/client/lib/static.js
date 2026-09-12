export function detailShard(slug) {
    let hash = 2166136261;
    for (const char of slug.toLowerCase())
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0) % 256;
}
export function searchStaticCatalog(index, input = {}) {
    const locale = input.locale ?? "en";
    const isChineseLocale = locale === "zh-CN" || locale === "zh-TW";
    const tokens = (input.query ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const score = (p) => tokens.reduce((n, t) => n + (p.name.toLocaleLowerCase().includes(t) ? 10 : (p.searchText.includes(t) || p.searchTextZh?.includes(t)) ? 1 : 0), 0);
    const items = index.items.filter(p => (!input.categories?.length || input.categories.some(c => p.categories.includes(c))) &&
        (!input.compatibility?.length || input.compatibility.includes(p.compatibilityStatus)) &&
        (!tokens.length || score(p) > 0)).sort((a, b) => {
        if (tokens.length && score(a) !== score(b))
            return score(b) - score(a);
        const order = input.sort === 'name' ? 0 : input.sort === 'updated'
            ? (b.pushedAt ?? '').localeCompare(a.pushedAt ?? '')
            : input.sort === 'stars' ? b.stars - a.stars : Number(b.featured) - Number(a.featured) || b.stars - a.stars;
        return order || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
    let offset = 0;
    try {
        const n = Number(atob(input.cursor ?? ''));
        if (Number.isSafeInteger(n) && n >= 0)
            offset = n;
    }
    catch { /* first page */ }
    const limit = Math.min(100, Math.max(1, Math.trunc(input.limit ?? 24) || 24));
    return { items: items.slice(offset, offset + limit).map(({ searchText: _, searchTextZh: _zh, ...p }) => ({ ...p, description: isChineseLocale && p.descriptionZh ? p.descriptionZh : p.description })), total: items.length,
        nextCursor: offset + limit < items.length ? btoa(String(offset + limit)) : null };
}

"use client";

type CatalogSearchProps = {
  categories: string[];
  compatibility: string[];
  placeholder: string;
  query: string;
  sort: string;
  submitLabel: string;
};

export function CatalogSearch({
  categories,
  compatibility,
  placeholder,
  query,
  sort,
  submitLabel,
}: CatalogSearchProps) {
  return (
    <form className="ocean-search" action="/" method="get" role="search">
      {categories.map(category => (
        <input key={category} name="category" type="hidden" value={category} />
      ))}
      {compatibility.map(item => (
        <input key={item} name="compatibility" type="hidden" value={item} />
      ))}
      {sort !== "featured" && <input name="sort" type="hidden" value={sort} />}
      <span className="ocean-search-mark" aria-hidden="true">/</span>
      <input
        autoComplete="off"
        defaultValue={query}
        enterKeyHint="search"
        name="q"
        placeholder={placeholder}
        type="search"
      />
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

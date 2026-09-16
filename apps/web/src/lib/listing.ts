export type ListingPage = {path: string; category?: string; page: number; total: number; previousPath: string | null; nextPath: string | null};
export function listingPath(category?: string, page = 1): string {
  const base = category ? `/categories/${category}/` : '/';
  return page > 1 ? `${base}page/${page}/` : base;
}

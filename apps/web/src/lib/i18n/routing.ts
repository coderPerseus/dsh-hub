import { isLocale, type Locale } from './locales';

export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : null;
}

/** Localize page links only; files, API endpoints and external URLs stay absolute. */
export function localizedHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const split = href.search(/[?#]/);
  let pathname = split < 0 ? href : href.slice(0, split);
  const suffix = split < 0 ? '' : href.slice(split);
  const existing = localeFromPath(pathname);
  if (existing) pathname = pathname.slice(existing.length + 1) || '/';
  if (pathname !== '/' && !pathname.startsWith('/plugins/')) return href;
  return `/${locale}${pathname.endsWith('/') ? pathname : pathname + '/'}${suffix}`;
}

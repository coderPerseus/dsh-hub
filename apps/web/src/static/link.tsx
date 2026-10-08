import type { AnchorHTMLAttributes } from 'react';
import { useTranslator } from './locale';
import { catalogLinkRel } from '../lib/catalog-href';
import { localizedHref } from '../lib/i18n/routing';
export default function Link({href, rel, ...props}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const {locale} = useTranslator();
  return <a {...props} rel={href ? catalogLinkRel(href, rel) : rel} href={href ? localizedHref(href, locale) : href} />;
}

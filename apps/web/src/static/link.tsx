import type { AnchorHTMLAttributes } from 'react';
import { useTranslator } from './locale';
import { localizedHref } from '../lib/i18n/routing';
export default function Link({href, ...props}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const {locale} = useTranslator();
  return <a {...props} href={href ? localizedHref(href, locale) : href} />;
}

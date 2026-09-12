import { useEffect, useState } from 'react';
import type { CatalogPlugin } from '../../../../packages/catalog/src/index';
import type { PluginSummary } from '../../../../packages/client/src/index';
import type { StaticIndex, StaticManifest } from '../../../../packages/client/src/static';
import { SiteHeader } from '../app/site-header';
import { getMessages } from '../lib/i18n/messages';
import { detectLocale, isLocale, localeOptions, type Locale } from '../lib/i18n/locales';
import { LocaleContext } from './locale';
import Home from './home';
import Detail from './detail';

export type PageData = {manifest: StaticManifest; initial: StaticIndex; plugin?: CatalogPlugin; related: PluginSummary[]; notFound?: boolean};
export function App({data}: {data: PageData}) {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  useEffect(() => { let saved: string | null = null; try { saved = localStorage.getItem('dshhub-locale'); } catch {} setLocale(isLocale(saved) ? saved : detectLocale(navigator.language)); }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const t = getMessages(locale);
  function choose(value: Locale) { setLocale(value); try { localStorage.setItem('dshhub-locale', value); } catch {} }
  return <LocaleContext.Provider value={locale}>
    <SiteHeader docsLabel={t.docs} homeAria={t.homeAria} navAria={t.navAria} pluginsLabel={t.plugins} submission={t.submission} />
    {data.notFound ? <main className="detail-main"><div className="ds-container empty-state"><h1>404</h1><a href="/">{t.backToCatalog}</a></div></main> : data.plugin ? <Detail plugin={data.plugin} related={data.related} /> : <Home initial={data.initial} manifest={data.manifest} />}
    <footer className="site-footer"><div className="ds-container footer-inner"><span>{t.footerNote}</span><div className="footer-right"><a href="https://www.deepseek.com/harness/" target="_blank" rel="noreferrer">DeepSeek Harness</a><nav className="locale-switch" aria-label={t.language}>{localeOptions.map(o => <button key={o.id} aria-pressed={o.id === locale} className={o.id === locale ? 'is-active' : undefined} onClick={() => choose(o.id)} title={o.label}>{o.code}</button>)}</nav></div></div></footer>
  </LocaleContext.Provider>;
}

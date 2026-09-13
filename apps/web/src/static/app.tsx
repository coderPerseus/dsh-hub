import { useEffect, useState } from 'react';
import type { CatalogPlugin } from '../../../../packages/catalog/src/index';
import type { PluginSummary } from '../../../../packages/client/src/index';
import type { StaticIndex, StaticManifest } from '../../../../packages/client/src/static';
import { SiteHeader } from '../app/site-header';
import { getMessages } from '../lib/i18n/messages';
import { localeOptions, type Locale } from '../lib/i18n/locales';
import { LocaleContext } from './locale';
import { localizedHref } from '../lib/i18n/routing';
import Home from './home';
import Detail from './detail';

export type PageData = {locale: Locale; manifest: StaticManifest; initial: StaticIndex; plugin?: CatalogPlugin; related: PluginSummary[]; notFound?: boolean};
export function App({data}: {data: PageData}) {
  const locale = data.locale;
  const [suffix, setSuffix] = useState('');
  useEffect(() => {
    const update = () => setSuffix(location.search + location.hash);
    update();
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); };
  }, []);
  const t = getMessages(locale);
  const pagePath = data.plugin ? '/plugins/' + data.plugin.slug : '/';
  return <LocaleContext.Provider value={locale}>
    <SiteHeader homeHref={localizedHref("/", locale)} docsLabel={t.docs} homeAria={t.homeAria} navAria={t.navAria} pluginsLabel={t.plugins} submission={t.submission} />
    {data.notFound ? <main className="detail-main"><div className="ds-container empty-state"><h1>{t.notFoundTitle}</h1><a href={localizedHref("/", locale)}>{t.backToCatalog}</a></div></main> : data.plugin ? <Detail plugin={data.plugin} related={data.related} /> : <Home initial={data.initial} manifest={data.manifest} />}
    <footer className="site-footer"><div className="ds-container footer-inner"><span>{t.footerNote}</span><div className="footer-right"><a href="https://github.com/coderPerseus/dsh-hub" target="_blank" rel="noreferrer">GitHub</a><span>build by <a href="https://luckysnail.cn/" target="_blank" rel="noreferrer">luckySnail</a></span><a href="https://www.deepseek.com/harness/" target="_blank" rel="noreferrer">DeepSeek Harness</a><nav className="locale-switch" aria-label={t.language}>{localeOptions.map(o => <a key={o.id} href={localizedHref(pagePath + suffix, o.id)} hrefLang={o.id} lang={o.id} aria-current={o.id === locale ? "page" : undefined} className={o.id === locale ? 'is-active' : undefined} title={o.label}>{o.code}</a>)}</nav></div></div></footer>
  </LocaleContext.Provider>;
}

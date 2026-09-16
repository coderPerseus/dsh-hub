import type { CatalogPlugin } from '../../../../packages/catalog/src/schema';
import type { Locale } from './i18n/locales';
import { readmeExcerpt } from './plugin-readme';

/** Keep the visible summary, metadata and structured data based on the same text. */
export function pluginDescription(plugin: CatalogPlugin, locale: Locale) {
  const language = locale === 'zh-TW' ? 'zh-CN' : locale;
  const description = (plugin.i18n?.[language]?.description || plugin.description).trim()
    || readmeExcerpt(plugin.usage.markdown || plugin.installation.markdown);
  const analysis = (plugin.aiAnalysis?.[language] || plugin.aiAnalysis?.['zh-CN'] || '').trim();
  return [description, analysis && !description.includes(analysis) ? analysis : ''].filter(Boolean).join(' ');
}

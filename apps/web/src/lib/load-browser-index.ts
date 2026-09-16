import type { StaticIndex, StaticManifest } from '../../../../packages/client/src/static';
import { decodeBrowserIndex, type BrowserIndex } from './browser-index';
import type { Locale } from './i18n/locales';
export type WebManifest = StaticManifest & {browserIndexes?: {en: string; zh: string}};
const pending = new Map<string, Promise<StaticIndex>>();
export function loadBrowserIndex(manifest: WebManifest, locale: Locale): Promise<StaticIndex> {
  const language = locale === 'zh-CN' || locale === 'zh-TW' ? 'zh' : 'en';
  const key = manifest.browserIndexes?.[language] || manifest.index;
  const existing = pending.get(key);
  if (existing) return existing;
  const read = async (current: WebManifest) => {
    const url = current.browserIndexes?.[language] || current.index;
    const response = await fetch(url, {signal: AbortSignal.timeout(30_000)});
    if (!response.ok) throw Object.assign(new Error('Catalog unavailable'), {status: response.status});
    const data = await response.json();
    return current.browserIndexes?.[language] ? decodeBrowserIndex(data as BrowserIndex) : data as StaticIndex;
  };
  const request = read(manifest).catch(async error => {
    if (error.status !== 404) throw error;
    // Recover old open tabs after a deployment removes their versioned assets.
    const response = await fetch('/catalog/manifest.json', {cache: 'no-cache', signal: AbortSignal.timeout(15_000)});
    if (!response.ok) throw new Error('Catalog unavailable');
    return read(await response.json());
  }).catch(error => { pending.delete(key); throw error; });
  pending.set(key, request);
  return request;
}

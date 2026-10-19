import { afterEach, expect, it, vi } from 'vitest';
import { loadBrowserIndex } from '../../../apps/web/src/lib/load-browser-index';
import type { StaticIndex, StaticManifest } from '../../client/src/static';

afterEach(() => vi.unstubAllGlobals());

it('reads a sharded full catalog when browser-specific indexes are absent', async () => {
  const index: StaticIndex = {schemaVersion: 1, snapshotId: 'fallback', generatedAt: 'today', categories: [], items: []};
  const manifest: StaticManifest = {schemaVersion: 2, snapshotId: 'fallback', generatedAt: 'today', pluginCount: 0, details: [], index: '/fallback/index.json'};
  const fetcher = vi.fn(async (url: string) => Response.json(url === manifest.index
    ? {...index, schemaVersion: 2, items: undefined, itemCount: 0, shards: ['/fallback/part.json']}
    : index));
  vi.stubGlobal('fetch', fetcher);
  expect(await loadBrowserIndex(manifest, 'en')).toEqual(index);
  expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/fallback/index.json', '/fallback/part.json']);
});

it('continues using the compact browser index when one is supplied', async () => {
  const index: StaticIndex = {schemaVersion: 1, snapshotId: 'compact', generatedAt: 'today', categories: [], items: []};
  const fetcher = vi.fn(async () => Response.json({...index, items: undefined, rows: []}));
  vi.stubGlobal('fetch', fetcher);
  await loadBrowserIndex({schemaVersion: 2, snapshotId: 'compact', generatedAt: 'today', pluginCount: 0, details: [], index: '/unused/index.json', browserIndexes: {en: '/compact/en.json', zh: '/compact/zh.json'}}, 'zh-CN');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('/compact/zh.json', expect.anything());
});

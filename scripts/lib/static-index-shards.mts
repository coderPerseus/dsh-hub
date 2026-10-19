import type { StaticIndex, StaticIndexDirectory } from '../../packages/client/src/static.js';
import { STATIC_ASSET_MAX_BYTES } from './static-asset-limit.mjs';

// Keep headroom below the hosting limit; use UTF-8 serialized bytes, not item counts.
export const INDEX_SHARD_MAX_BYTES = 8 * 1024 * 1024;

export function shardStaticIndex(index: StaticIndex, prefix: string, maxBytes = INDEX_SHARD_MAX_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > STATIC_ASSET_MAX_BYTES) {
    throw new Error('Invalid index shard byte limit');
  }
  const {items, ...metadata} = index;
  const header = JSON.stringify({...metadata, items: []}).slice(0, -2);
  const overhead = Buffer.byteLength(header + ']}');
  if (overhead > maxBytes) throw new Error('Index metadata exceeds shard byte limit');
  const files: Array<{path: string; content: string}> = [];
  let parts: string[] = [], bytes = overhead;
  const flush = () => {
    files.push({path: `${prefix}/index-${files.length}.json`, content: header + parts.join(',') + ']}'});
    parts = [];
    bytes = overhead;
  };
  for (const item of items) {
    const json = JSON.stringify(item), size = Buffer.byteLength(json);
    if (overhead + size > maxBytes) throw new Error(`Index entry exceeds shard byte limit: ${item.id}`);
    if (bytes + size + (parts.length ? 1 : 0) > maxBytes) flush();
    bytes += size + (parts.length ? 1 : 0);
    parts.push(json);
  }
  if (parts.length || !files.length) flush();
  const directory: StaticIndexDirectory = {...metadata, schemaVersion: 2, itemCount: items.length, shards: files.map(file => file.path)};
  if (Buffer.byteLength(JSON.stringify(directory)) > STATIC_ASSET_MAX_BYTES) throw new Error('Index directory exceeds asset byte limit');
  return {directory, files};
}

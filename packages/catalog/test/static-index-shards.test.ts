import { describe, expect, it } from 'vitest';
import { shardStaticIndex } from '../../../scripts/lib/static-index-shards.mjs';
import { loadStaticIndex, type StaticIndex } from '../../client/src/static';

const index: StaticIndex = {schemaVersion: 1, snapshotId: 'test', generatedAt: 'today', categories: [{id: 'tools', count: 3}], items: []};
const entry = (id: string) => ({id, slug: `owner/${id}`, name: id, description: '中文😀"\\'.repeat(25), packageName: id, repositoryUrl: '', stars: 0, pushedAt: null, featured: false, categories: ['tools'], compatibilityStatus: 'unknown' as const, compatibilityLevel: 'unverified' as const, installCommand: null, searchText: 'complete text'});

describe('byte-bounded full index shards', () => {
  it('round trips UTF-8 and JSON escapes without dropping entries, text, order or categories', async () => {
    const original = {...index, items: ['a', 'b', 'c'].map(entry)};
    const result = shardStaticIndex(original, '/catalog/test', 1200);
    expect(result.files.length).toBeGreaterThan(1);
    for (const file of result.files) expect(Buffer.byteLength(file.content)).toBeLessThanOrEqual(1200);
    const restored = await loadStaticIndex('/directory', async file => file === '/directory'
      ? result.directory : JSON.parse(result.files.find(part => part.path === file)!.content));
    expect(restored).toEqual(original);
  });

  it('accepts an exact boundary and starts a new shard for the next entry', () => {
    const one = {...index, items: [entry('a')]};
    const limit = Buffer.byteLength(JSON.stringify(one));
    expect(shardStaticIndex(one, '/test', limit).files).toHaveLength(1);
    expect(shardStaticIndex({...one, items: [entry('a'), entry('b')]}, '/test', limit).files).toHaveLength(2);
    expect(() => shardStaticIndex(one, '/test', limit - 1)).toThrow('Index entry exceeds');
  });

  it('keeps an empty catalog readable and rejects oversized metadata', async () => {
    const result = shardStaticIndex(index, '/test');
    expect(result.files).toHaveLength(1);
    expect(JSON.parse(result.files[0].content)).toEqual(index);
    expect(() => shardStaticIndex(index, '/test', 1)).toThrow('metadata');
  });
});

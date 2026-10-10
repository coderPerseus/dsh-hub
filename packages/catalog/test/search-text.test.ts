import { describe, expect, it } from 'vitest';
import { compactSearchText } from '../../../scripts/lib/search-text.mjs';
import { searchStaticCatalog, type StaticIndex } from '../../client/src/static';

describe('compact static search text', () => {
  it('preserves token and substring matches across both languages', () => {
    const english = ['Browser', '@scope/browser', 'Browser tools\nBrowser tools', 'websocket tools'];
    const chinese = ['浏览器工具 Browser', '令牌认证 websocket'];
    const before = [english.join(' ').toLowerCase(), chinese.join(' ').toLowerCase()];
    const en = compactSearchText(english);
    const after = [en, compactSearchText(chinese, en)];
    expect(after.join(' ').length).toBeLessThan(before.join(' ').length);
    for (const query of ['browser', '@scope/browser', 'scope', 'websocket', 'socket', '浏览器', '令牌认证', 'tools', 'missing']) {
      expect(after.some(text => text.includes(query))).toBe(before.some(text => text.includes(query)));
    }
    expect(compactSearchText(['', ' \n '])).toBe('');
  });

  it('keeps every substring while removing words covered by longer words or names', () => {
    const parts = ['tool tools websocket socket', '中文工具 工具 中文', 'Browser browser'];
    const compact = compactSearchText(parts, 'BROWSER');
    expect(compact).toBe('websocket tools 中文工具');
    const before = parts.join(' ').toLowerCase();
    for (const word of before.split(/\s+/u)) {
      for (let start = 0; start < word.length; start++) {
        for (let end = start + 1; end <= word.length; end++) {
          expect([compact, 'browser'].some(text => text.includes(word.slice(start, end)))).toBe(true);
        }
      }
    }
  });

  it('preserves multilingual results, scores, filters and pagination for legacy clients', () => {
    const items = ['Browser', 'Tools', '浏览器'].map((name, i) => ({
      id: String(i), slug: `owner/${i}`, name, packageName: '@scope/browser',
      description: 'Browser tools', descriptionZh: '浏览器工具', repositoryUrl: `https://github.com/owner/${i}`,
      stars: i, pushedAt: null, featured: false, categories: [i === 1 ? 'tools' : 'browser'],
      compatibilityStatus: 'unknown' as const, compatibilityLevel: 'unverified' as const, installCommand: null,
      searchText: `${name.toLowerCase()} @scope/browser browser tools websocket`, searchTextZh: '浏览器工具 工具 socket',
    }));
    const before: StaticIndex = {schemaVersion: 1, snapshotId: 'v1', generatedAt: '', categories: [], items};
    const after: StaticIndex = {...before, items: items.map(({searchTextZh, ...p}) => ({
      ...p, searchText: compactSearchText([p.searchText, searchTextZh], p.name),
    }))};
    for (const query of ['browser', 'tool', 'scope', 'socket', '浏览器', '工具', 'browser 工具', 'missing']) {
      for (const locale of ['en', 'zh-CN', 'zh-TW'] as const) {
        for (const categories of [[], ['browser']]) {
          const input = {query, locale, categories, limit: 1};
          const expected = searchStaticCatalog(before, input);
          expect(searchStaticCatalog(after, input)).toEqual(expected);
          if (expected.nextCursor) expect(searchStaticCatalog(after, {...input, cursor: expected.nextCursor}))
            .toEqual(searchStaticCatalog(before, {...input, cursor: expected.nextCursor}));
        }
      }
    }
  });
});

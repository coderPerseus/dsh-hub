import { describe, expect, it } from 'vitest';
import { compactSearchText } from '../../../scripts/lib/search-text.mjs';

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
});

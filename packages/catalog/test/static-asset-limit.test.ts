import { describe, expect, it } from 'vitest';
import { assertStaticAssetSize, STATIC_ASSET_MAX_BYTES } from '../../../scripts/lib/static-asset-limit.mjs';

describe('static asset size limit', () => {
  it('accepts the catalog index that exceeded the old 24 MiB guard', () => {
    expect(() => assertStaticAssetSize('/catalog/index.json', 'a'.repeat(25_186_785))).not.toThrow();
  });

  it('accepts exactly 25 MiB and rejects one additional byte', () => {
    expect(() => assertStaticAssetSize('/exact.json', 'a'.repeat(STATIC_ASSET_MAX_BYTES))).not.toThrow();
    expect(() => assertStaticAssetSize('/large.json', 'a'.repeat(STATIC_ASSET_MAX_BYTES + 1)))
      .toThrow(`Asset too large: /large.json (${STATIC_ASSET_MAX_BYTES + 1} bytes)`);
  });

  it('measures UTF-8 bytes instead of character count', () => {
    const content = '中'.repeat(Math.floor(STATIC_ASSET_MAX_BYTES / 3) + 1);
    expect(content.length).toBeLessThan(STATIC_ASSET_MAX_BYTES);
    expect(() => assertStaticAssetSize('/zh.json', content)).toThrow('Asset too large: /zh.json');
  });
});

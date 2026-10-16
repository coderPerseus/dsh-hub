// https://developers.cloudflare.com/workers/platform/limits/#static-assets
export const STATIC_ASSET_MAX_BYTES = 25 * 1024 * 1024;

export function assertStaticAssetSize(file: string, content: string): void {
  const bytes = Buffer.byteLength(content);
  if (bytes > STATIC_ASSET_MAX_BYTES) {
    throw new Error(`Asset too large: ${file} (${bytes} bytes)`);
  }
}

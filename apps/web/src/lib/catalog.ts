import type { CatalogListInput } from "@dshhub/contracts";
import { cache } from "react";

import { orpc } from "./orpc";

type CatalogIndex = Awaited<ReturnType<typeof loadCatalogIndex>>;

async function loadCatalogIndex(input: CatalogListInput) {
  const [meta, categories, list] = await Promise.all([
    orpc.catalog.meta(),
    orpc.catalog.categories(),
    orpc.catalog.list(input),
  ]);
  return { meta, categories, list };
}

export async function getCatalogIndex(input: CatalogListInput): Promise<
  { ok: true } & CatalogIndex | { ok: false }
> {
  try {
    return { ok: true, ...await loadCatalogIndex(input) };
  } catch {
    return { ok: false };
  }
}

export const getPlugin = cache(async (
  owner: string,
  repository: string,
  locale?: CatalogListInput["locale"],
) => {
  try {
    return { ok: true as const, plugin: await orpc.catalog.detail({ owner, repository, locale }) };
  } catch {
    return { ok: false as const, plugin: null };
  }
});

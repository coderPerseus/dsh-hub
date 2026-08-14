import { describe, expect, it } from "vitest";

import type { CatalogPlugin, CatalogSnapshot } from "../src/schema";
import {
  asFullSnapshot,
  chunkText,
  createTaskLimiter,
  pluginsNeedingTranslation,
  reusableTranslations,
  translationPayload,
  validateTranslations,
} from "../../../scripts/translate-catalog";

const plugin = {
  id: "github:owner/plugin",
  slug: "owner/plugin",
  description: "Source description",
  repository: { owner: "owner", name: "plugin", commit: "abc123" },
  installation: {
    markdown: "i".repeat(3_000),
    notes: ["Keep the command unchanged"],
  },
  usage: {
    markdown: "u".repeat(3_000),
    summary: "Source summary",
  },
} as unknown as CatalogPlugin;

function completeTranslations() {
  return Object.fromEntries(
    ["zh-CN", "en", "ja", "ko", "zh-TW"].map(locale => [locale, {
      description: `${locale} description`,
      installationMarkdown: `${locale} installation`,
      installationNotes: [`${locale} note`],
      usageMarkdown: `${locale} usage`,
      usageSummary: `${locale} summary`,
    }]),
  );
}

describe("catalog translation", () => {
  it("sends complete scraped markdown to the translator", () => {
    const payload = translationPayload(plugin);

    expect(payload.installationMarkdown).toHaveLength(3_000);
    expect(payload.usageMarkdown).toHaveLength(3_000);
  });

  it("chunks long markdown without dropping content", () => {
    const markdown = `${"a".repeat(1_000)}\n${"b".repeat(2_500)}`;
    const chunks = chunkText(markdown, 1_200);

    expect(chunks.every(chunk => chunk.length <= 1_200)).toBe(true);
    expect(chunks.join("")).toBe(markdown);
  });

  it("limits concurrent tasks and preserves result order", async () => {
    const limit = createTaskLimiter(2);
    let active = 0;
    let maximumActive = 0;
    const release: Array<() => void> = [];

    const tasks = [0, 1, 2].map(index => limit(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise<void>(resolve => release[index] = resolve);
      active -= 1;
      return index;
    }));

    expect(maximumActive).toBe(2);
    expect(release[2]).toBeUndefined();

    release[0]?.();
    await tasks[0];
    expect(release[2]).toBeTypeOf("function");

    release[2]?.();
    await tasks[2];
    release[1]?.();
    await expect(Promise.all(tasks)).resolves.toEqual([0, 1, 2]);
    expect(maximumActive).toBe(2);
  });

  it("rejects a response that omits any target locale", () => {
    const translations = completeTranslations();
    delete translations["zh-TW"];

    expect(() => validateTranslations(translations, translationPayload(plugin)))
      .toThrow("model response is missing locale zh-TW");
  });

  it("reuses complete translations from the previous snapshot", () => {
    const translatedPlugin = {
      ...plugin,
      i18n: completeTranslations(),
    } as unknown as CatalogPlugin;

    expect(reusableTranslations(translatedPlugin)).toEqual(translatedPlugin.i18n);
  });

  it("translates only changed repositories in an incremental snapshot", () => {
    const unchanged = {
      ...plugin,
      id: "github:other/plugin",
      slug: "other/plugin",
      repository: { owner: "other", name: "plugin", commit: "def456" },
    } as unknown as CatalogPlugin;
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-1",
      generatedAt: "2026-08-14T00:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "abc123" },
      mainline: null,
      plugins: [plugin, unchanged],
    } satisfies CatalogSnapshot;

    expect(pluginsNeedingTranslation(snapshot)).toEqual([plugin]);
  });

  it("publishes translated snapshots as full imports", () => {
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-1",
      generatedAt: "2026-08-14T00:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "abc123" },
      mainline: null,
      plugins: [plugin],
    } satisfies CatalogSnapshot;

    expect(asFullSnapshot(snapshot, [plugin]).changedRepositories).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  applyCatalogEnrichment,
  catalogEnrichmentDataSchema,
  enrichmentSourceHash,
} from "../src/enrichment";

const plugin = {
  id: "github:owner/plugin",
  slug: "owner/plugin",
  name: "@owner/plugin",
  description: "Analyze images and export text.",
  repository: {
    owner: "owner",
    name: "plugin",
    url: "https://github.com/owner/plugin",
    defaultBranch: "main",
    commit: "abc123",
    stars: 42,
    license: null,
    topics: ["vision"],
    pushedAt: "2026-09-01T00:00:00.000Z",
    homepage: null,
  },
  package: {
    name: "@owner/plugin",
    version: "1.0.0",
    hasBundle: false,
    bundlePatch: null,
    hasPrepareScript: false,
    peerDependencies: {},
  },
  categories: ["vision"],
  featured: false,
  compatibility: {
    status: "unknown",
    level: "unverified",
    harnessRange: null,
    cordisRange: null,
    checks: [{ id: "package-entry", status: "pass", summary: "Entry declared." }],
  },
  installation: {
    kind: "github",
    spec: "github:owner/plugin",
    command: "npm install @owner/plugin",
    markdown: "Install with npm.",
    notes: ["Keep existing notes."],
  },
  usage: {
    summary: "Use this plugin to extract text from images.",
    markdown: "Call /analyze with an image file.",
    readmeUrl: "https://github.com/owner/plugin/blob/main/README.md",
  },
  i18n: {
    "zh-CN": {
      description: "旧翻译",
      usageSummary: "保留旧用法摘要",
      installationNotes: ["旧安装说明"],
      usageMarkdown: "旧使用文档",
      installationMarkdown: "旧安装文档",
    },
    en: {
      description: "English description",
    },
  },
  aiAnalysis: {
    en: "English analysis",
  },
} as any;

function baseSnapshot(plugins = [plugin]) {
  return {
    schemaVersion: 1 as const,
    snapshotId: "snapshot-2026-09-01",
    generatedAt: "2026-09-01T00:00:00.000Z",
    source: { repository: "local/dshhub", commit: "snap" },
    mainline: null,
    plugins,
  };
}

describe("catalog enrichment", () => {
  it("applies zh-CN description and ai analysis when source hash matches", () => {
    const sourceHash = enrichmentSourceHash(plugin);
    const sidecar = catalogEnrichmentDataSchema.parse({
      version: 1,
      entries: {
        [plugin.id]: {
          sourceHash,
          descriptionZh: "识别图片内容",
          analysisZh: "结合官方说明判断该插件用于提取图片文本并给出结果。",
        },
      },
    });
    const next = applyCatalogEnrichment(baseSnapshot(), sidecar) as ReturnType<typeof baseSnapshot>;

    expect(next.plugins[0].description).toBe(plugin.description);
    expect(next.plugins[0].i18n?.["zh-CN"]?.description).toBe("识别图片内容");
    expect(next.plugins[0].i18n?.["zh-CN"]?.usageSummary).toBe("保留旧用法摘要");
    expect(next.plugins[0].i18n?.["zh-CN"]?.installationMarkdown).toBe("旧安装文档");
    expect(next.plugins[0].aiAnalysis).toEqual({ en: "English analysis", "zh-CN": "结合官方说明判断该插件用于提取图片文本并给出结果。" });
  });

  it("skips enrichment when source hash is stale", () => {
    const sidecar = catalogEnrichmentDataSchema.parse({
      version: 1,
      entries: {
        [plugin.id]: {
          sourceHash: "mismatch",
          descriptionZh: "不会被应用",
          analysisZh: "不会被应用",
        },
      },
    });
    const original = baseSnapshot();
    const next = applyCatalogEnrichment(original, sidecar) as ReturnType<typeof baseSnapshot>;

    expect(next).toEqual(original);
  });

  it("allows exactly 100 unicode analysis characters", () => {
    const sourceHash = enrichmentSourceHash(plugin);
    const analysisZh = "一".repeat(100);
    const sidecar = catalogEnrichmentDataSchema.parse({
      version: 1,
      entries: {
        [plugin.id]: {
          sourceHash,
          descriptionZh: "边界测试",
          analysisZh,
        },
      },
    });

    const next = applyCatalogEnrichment(baseSnapshot(), sidecar) as ReturnType<typeof baseSnapshot>;

    expect(next.plugins[0].aiAnalysis?.["zh-CN"]).toHaveLength(100);
  });

  it("rejects invalid cache entries longer than 100 unicode characters", () => {
    const sourceHash = enrichmentSourceHash(plugin);
    const sidecar = {
      version: 1,
      entries: {
        [plugin.id]: {
          sourceHash,
          descriptionZh: "描述",
          analysisZh: "一".repeat(101),
        },
      },
    };

    expect(() => catalogEnrichmentDataSchema.parse(sidecar)).toThrow("analysisZh must be at most 100 unicode characters");
  });
  it("rejects Chinese card descriptions longer than 100 characters", () => {
    expect(() => catalogEnrichmentDataSchema.parse({version:1, entries:{
      [plugin.id]:{sourceHash:enrichmentSourceHash(plugin),descriptionZh:"中".repeat(101),analysisZh:"用于说明插件用途。"},
    }})).toThrow("descriptionZh must be at most 100 unicode characters");
  });

});

import { describe, expect, it } from "vitest";

import { catalogSearchText } from "../src/i18n";
import type { CatalogPlugin } from "../src/schema";

describe("catalog search text", () => {
  it("includes documentation, repository, dependency, compatibility, and translated terms", () => {
    const plugin = {
      repository: {
        owner: "owner",
        name: "vision-plugin",
        defaultBranch: "main",
        homepage: "https://example.com",
        topics: ["image-to-text"],
      },
      package: {
        name: "@owner/vision-plugin",
        version: "1.2.3",
        bundlePatch: "cordis.patch.yml",
        peerDependencies: { "@deepseek-ai/cordis": "^4" },
      },
      categories: ["vision"],
      compatibility: {
        harnessRange: null,
        cordisRange: "^4",
        checks: [{ id: "bundle", status: "pass", summary: "Bundle exists." }],
      },
      installation: {
        spec: "github:owner/vision-plugin",
        command: "dsh plugin add github:owner/vision-plugin",
        markdown: "Connect a Gemini vision provider.",
        notes: ["Restart the web profile."],
      },
      usage: {
        summary: "Read screenshots.",
        markdown: "Paste an image from the clipboard.",
      },
      i18n: {
        "zh-CN": {
          description: "读取图片",
          installationMarkdown: "连接视觉模型",
          installationNotes: ["重启服务"],
          usageMarkdown: "粘贴截图",
          usageSummary: "识别图片",
        },
      },
    } as unknown as CatalogPlugin;

    const text = catalogSearchText(plugin);

    for (const expected of [
      "image-to-text",
      "Gemini",
      "@deepseek-ai/cordis",
      "Bundle exists.",
      "clipboard",
      "读取图片",
      "粘贴截图",
    ]) {
      expect(text).toContain(expected);
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loadPluginReadme,
  normalizeReadme,
  pluginPackageDirectory,
  pluginReadmeCandidates,
  pluginRepositoryUrl,
  rewriteReadmeUrl,
} from "./plugin-readme";

const base = {
  file: "README.md",
  name: "modlens",
  owner: "liustack",
  ref: "abc123",
};

describe("plugin readme helpers", () => {
  it("extracts a monorepo package directory from the catalog id", () => {
    assert.equal(pluginPackageDirectory("github:liustack/modlens"), "");
    assert.equal(
      pluginPackageDirectory("github:owner/repo:packages/memory"),
      "packages/memory",
    );
  });

  it("prefers a package README then the repository root README", () => {
    assert.deepEqual(
      pluginReadmeCandidates({
        id: "github:owner/repo:packages/memory",
        installation: { markdown: "" },
        repository: {
          commit: "abc",
          defaultBranch: "main",
          name: "repo",
          owner: "owner",
          url: "https://github.com/owner/repo",
        },
        usage: { markdown: "", readmeUrl: "https://github.com/owner/repo#readme" },
      }, "zh-CN"),
      [
        "packages/memory/README.zh-CN.md",
        "packages/memory/README.zh.md",
        "packages/memory/README.md",
        "packages/memory/readme.md",
        "README.zh-CN.md",
        "README.zh.md",
        "README.md",
        "readme.md",
      ],
    );
  });

  it("uses a short package README instead of a longer root README", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/packages/memory/README.md") && !url.includes("README.zh")) {
        return new Response("# memory\n");
      }
      if (url.includes("/packages/memory/")) {
        return new Response(null, { status: 404 });
      }
      if (url.includes("/README.zh-CN.md") || url.endsWith("/README.md") || url.includes("/readme.md")) {
        return new Response("# Root\n\nThis workspace README should not replace a package-local file.\n");
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    try {
      const result = await loadPluginReadme({
        id: "github:owner/repo:packages/memory",
        installation: { markdown: "" },
        repository: {
          commit: "abc",
          defaultBranch: "main",
          name: "repo",
          owner: "owner",
          url: "https://github.com/owner/repo",
        },
        usage: { markdown: "", readmeUrl: "https://github.com/owner/repo#readme" },
      }, "zh-CN");
      assert.match(result.sourceUrl, /packages\/memory\/README\.md$/);
      assert.match(result.markdown, /memory/);
      assert.doesNotMatch(result.markdown, /workspace README/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rewrites relative README images to raw GitHub URLs", () => {
    assert.equal(
      rewriteReadmeUrl("./assets/banner.jpg", base),
      "https://raw.githubusercontent.com/liustack/modlens/abc123/assets/banner.jpg",
    );
    assert.equal(
      rewriteReadmeUrl("docs/setup.md", base),
      "https://github.com/liustack/modlens/blob/abc123/docs/setup.md",
    );
    assert.equal(
      pluginRepositoryUrl({ repository: { owner: "liustack", name: "modlens" } }),
      "https://github.com/liustack/modlens",
    );
  });

  it("turns HTML banners into markdown images", () => {
    const normalized = normalizeReadme(
      '<p align="center"><img src="assets/banner.jpg" alt="ModLens" /></p>\n\n# ModLens',
      base,
    );
    assert.match(normalized, /!\[ModLens]\(https:\/\/raw\.githubusercontent\.com\/liustack\/modlens\/abc123\/assets\/banner\.jpg\)/);
    assert.match(normalized, /# ModLens/);
  });
});

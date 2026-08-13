import { describe, expect, it } from "vitest";

import { localizePlugin } from "../src/i18n";
import {
  discoverCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../src/node";

describe("catalog i18n", () => {
  it("falls back to the source description when a locale is missing", () => {
    const plugin = {
      description: "Source description",
      i18n: { "zh-CN": { description: "中文描述" } },
      installation: { markdown: "install", notes: ["note"] },
      usage: { markdown: "usage", summary: "summary" },
    } as unknown as Parameters<typeof localizePlugin>[0];

    expect(localizePlugin(plugin, "ja").description).toBe("Source description");
    expect(localizePlugin(plugin, "zh-CN").description).toBe("中文描述");
  });
});

describe("catalog README projection", () => {
  const snapshot = {
    schemaVersion: 1 as const,
    snapshotId: "snapshot-1",
    generatedAt: "2026-08-14T00:00:00.000Z",
    source: { repository: "example/catalog", commit: "abcdef123456" },
    mainline: null,
    plugins: [],
  };

  it("renders an empty catalog without inventing plugins", () => {
    expect(renderCatalogSection(snapshot)).toContain("No plugins registered yet.");
  });

  it("replaces only the generated marker region", () => {
    const original = "# Intro\n\n<!-- catalog:start -->\nold\n<!-- catalog:end -->\n\nFooter\n";
    const updated = replaceCatalogSection(original, renderCatalogSection(snapshot));

    expect(updated).toContain("# Intro");
    expect(updated).toContain("Footer");
    expect(updated).not.toContain("\nold\n");
  });
});

describe("catalog discovery", () => {
  it("discovers and builds installable root packages from GitHub topics", async () => {
    const responses = new Map<string, string>([
      ["/search/repositories", JSON.stringify({
        total_count: 1,
        incomplete_results: false,
        items: [{
          archived: false,
          default_branch: "main",
          description: "Repository description",
          disabled: false,
          fork: false,
          full_name: "owner/plugin",
          html_url: "https://github.com/owner/plugin",
          license: { spdx_id: "MIT" },
          name: "plugin",
          owner: { login: "owner" },
          pushed_at: "2026-08-14T00:00:00Z",
          stargazers_count: 42,
          topics: ["dsh-plugin", "vision"],
        }],
      })],
      ["/repos/owner/plugin/commits/main", JSON.stringify({
        sha: "abc123",
        commit: { tree: { sha: "tree123" } },
      })],
      ["/repos/owner/plugin", JSON.stringify({
        archived: false,
        default_branch: "main",
        description: "Repository description",
        disabled: false,
        fork: false,
        full_name: "owner/plugin",
        html_url: "https://github.com/owner/plugin",
        license: { spdx_id: "MIT" },
        name: "plugin",
        owner: { login: "owner" },
        pushed_at: "2026-08-14T00:00:00Z",
        stargazers_count: 43,
        topics: ["dsh-plugin", "vision"],
      })],
      ["/owner/plugin/main/package.json", JSON.stringify({
        name: "dsh-example",
        version: "1.0.0",
        main: "index.js",
        dsh: { bundle: { patch: "./cordis.patch.yml" } },
        peerDependencies: { "@deepseek-ai/cordis": "^4.0.0" },
      })],
      ["/owner/plugin/abc123/README.md", "# Plugin\n\n## Installation\n\nRun it."],
      ["/owner/plugin/abc123/cordis.patch.yml", "- insert: []"],
    ]);
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      const pathname = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
      const body = responses.get(pathname.pathname === "/search/repositories"
        ? pathname.pathname
        : `${pathname.pathname}${pathname.search}`);
      return body === undefined ? new Response(null, { status: 404 }) : new Response(body);
    };

    const snapshot = await discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins[0]?.installation.command).toBe(
      "dsh plugin --profile <profile> add github:owner/plugin#abc123",
    );
    expect(snapshot.plugins[0]?.installation.markdown).toContain("## Installation");
    expect(snapshot.plugins[0]?.categories).toContain("vision");
    expect(snapshot.plugins[0]?.compatibility.level).toBe("declared");
    expect(snapshot.plugins[0]?.compatibility.status).toBe("unknown");

    const incremental = await discoverCatalogSnapshot({
      catalogMode: "discover",
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T02:00:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source456" },
    });
    expect(incremental.plugins).toEqual(snapshot.plugins);
    expect(incremental.changedRepositories).toEqual([]);

    const refreshed = await discoverCatalogSnapshot({
      catalogMode: "refresh",
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T03:00:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source789" },
    });
    expect(refreshed.plugins[0]?.repository.stars).toBe(43);
    expect(refreshed.changedRepositories).toEqual(["owner/plugin"]);

    const failedRefresh = await discoverCatalogSnapshot({
      catalogMode: "refresh",
      fetch: (async () => new Response(null, { status: 403 })) as typeof fetch,
      generatedAt: new Date("2026-08-14T04:00:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source999" },
    });
    expect(failedRefresh.plugins).toEqual(snapshot.plugins);
    expect(failedRefresh.changedRepositories).toEqual([]);
  });

  it("rejects incomplete GitHub search results", async () => {
    const fetcher = async (): Promise<Response> => new Response(JSON.stringify({
      total_count: 100,
      incomplete_results: true,
      items: [],
    }));

    await expect(discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      source: { repository: "owner/catalog", commit: "source123" },
    })).rejects.toThrow(/incomplete results/);
  });

  it("discovers multiple installable packages in a monorepo", async () => {
    const repository = {
      archived: false,
      default_branch: "main",
      description: "Memory and skill plugins",
      disabled: false,
      fork: false,
      full_name: "owner/plugins",
      html_url: "https://github.com/owner/plugins",
      license: { spdx_id: "MIT" },
      name: "plugins",
      owner: { login: "owner" },
      pushed_at: "2026-08-14T00:00:00Z",
      stargazers_count: 2,
      topics: ["dsh-plugin"],
    };
    const responses = new Map<string, string>([
      ["/search/repositories", JSON.stringify({ total_count: 1, incomplete_results: false, items: [repository] })],
      ["/repos/owner/plugins/commits/main", JSON.stringify({
        sha: "commit123",
        commit: { tree: { sha: "tree123" } },
      })],
      ["/repos/owner/plugins/git/trees/main?recursive=1", JSON.stringify({
        tree: [
          { path: "packages/memory/package.json", type: "blob" },
          { path: "packages/skill-curator/package.json", type: "blob" },
        ],
      })],
      ["/owner/plugins/main/package.json", JSON.stringify({
        name: "workspace-root",
        private: true,
      })],
      ["/owner/plugins/main/packages/memory/package.json", JSON.stringify({
        name: "@owner/dsh-memory",
        main: "lib/index.js",
        dsh: { bundle: { patch: "./cordis.patch.yml" } },
      })],
      ["/owner/plugins/main/packages/skill-curator/package.json", JSON.stringify({
        name: "@owner/dsh-skill-curator",
        exports: "./lib/index.js",
        peerDependencies: { "@deepseek-ai/cordis": "^4.0.0" },
      })],
      ["/owner/plugins/commit123/packages/memory/cordis.patch.yml", "- insert: []"],
    ]);
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      const pathname = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
      const key = pathname.pathname === "/search/repositories"
        ? pathname.pathname
        : `${pathname.pathname}${pathname.search}`;
      const body = responses.get(key);
      return body === undefined ? new Response(null, { status: 404 }) : new Response(body);
    };

    const snapshot = await discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins.map(plugin => plugin.package.name)).toEqual([
      "@owner/dsh-memory",
      "@owner/dsh-skill-curator",
    ]);
    expect(snapshot.plugins[0]?.slug).toBe("owner/plugins--packages-memory");
    expect(snapshot.plugins[0]?.installation.spec).toBe(
      "github:owner/plugins#commit123&path:packages/memory",
    );
  });

  it("excludes private and unrelated workspace packages", async () => {
    const repository = {
      archived: false,
      default_branch: "main",
      description: "Plugin workspace",
      disabled: false,
      fork: false,
      full_name: "owner/plugin-workspace",
      html_url: "https://github.com/owner/plugin-workspace",
      license: null,
      name: "plugin-workspace",
      owner: { login: "owner" },
      pushed_at: null,
      stargazers_count: 0,
      topics: ["dsh-plugin"],
    };
    const responses = new Map<string, string>([
      ["/search/repositories", JSON.stringify({ total_count: 1, incomplete_results: false, items: [repository] })],
      ["/repos/owner/plugin-workspace/commits/main", JSON.stringify({ sha: "commit123", commit: { tree: { sha: "tree123" } } })],
      ["/repos/owner/plugin-workspace/git/trees/main?recursive=1", JSON.stringify({ tree: [
        { path: "packages/private/package.json", type: "blob" },
        { path: "packages/utils/package.json", type: "blob" },
        { path: "plugins/good/package.json", type: "blob" },
      ] })],
      ["/owner/plugin-workspace/main/package.json", JSON.stringify({ name: "root", private: true, main: "index.js" })],
      ["/owner/plugin-workspace/main/packages/private/package.json", JSON.stringify({ name: "dsh-private", private: true, main: "index.js" })],
      ["/owner/plugin-workspace/main/packages/utils/package.json", JSON.stringify({ name: "shared-utils", main: "index.js" })],
      ["/owner/plugin-workspace/main/plugins/good/package.json", JSON.stringify({ name: "dsh-good", main: "index.js" })],
    ]);
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      const pathname = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
      const key = pathname.pathname === "/search/repositories" ? pathname.pathname : `${pathname.pathname}${pathname.search}`;
      const body = responses.get(key);
      return body === undefined ? new Response(null, { status: 404 }) : new Response(body);
    };

    const snapshot = await discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins.map(plugin => plugin.package.name)).toEqual(["dsh-good"]);
    expect(snapshot.plugins[0]?.slug).toBe("owner/plugin-workspace--plugins-good");
  });
});

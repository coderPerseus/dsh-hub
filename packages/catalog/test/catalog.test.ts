import { describe, expect, it } from "vitest";

import {
  discoverCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../src/node";

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
      ["/repos/owner/plugin/git/trees/tree123?recursive=1", JSON.stringify({ tree: [] })],
      ["/repos/owner/plugin/contents/package.json?ref=abc123", JSON.stringify({
        name: "dsh-example",
        version: "1.0.0",
        main: "index.js",
        dsh: { bundle: { patch: "./cordis.patch.yml" } },
        peerDependencies: { "@deepseek-ai/cordis": "^4.0.0" },
      })],
      ["/repos/owner/plugin/contents/README.md?ref=abc123", "# Plugin\n\n## Installation\n\nRun it."],
      ["/repos/owner/plugin/contents/cordis.patch.yml?ref=abc123", "- insert: []"],
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
      ["/repos/owner/plugins/git/trees/tree123?recursive=1", JSON.stringify({
        tree: [
          { path: "packages/memory/package.json", type: "blob" },
          { path: "packages/skill-curator/package.json", type: "blob" },
        ],
      })],
      ["/repos/owner/plugins/contents/package.json?ref=commit123", JSON.stringify({
        name: "workspace-root",
        private: true,
      })],
      ["/repos/owner/plugins/contents/packages/memory/package.json?ref=commit123", JSON.stringify({
        name: "@owner/dsh-memory",
        main: "lib/index.js",
        dsh: { bundle: { patch: "./cordis.patch.yml" } },
      })],
      ["/repos/owner/plugins/contents/packages/skill-curator/package.json?ref=commit123", JSON.stringify({
        name: "@owner/dsh-skill-curator",
        exports: "./lib/index.js",
      })],
      ["/repos/owner/plugins/contents/packages/memory/cordis.patch.yml?ref=commit123", "- insert: []"],
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
    expect(snapshot.plugins[0]?.slug).toBe("owner/plugins--memory");
    expect(snapshot.plugins[0]?.installation.spec).toBe(
      "github:owner/plugins#commit123&path:packages/memory",
    );
  });
});

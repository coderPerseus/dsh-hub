import { describe, expect, it } from "vitest";

import {
  localizePlugin,
  localizedDescription,
  stripCatalogTranslations,
} from "../src/i18n";
import {
  catalogPluginSchema,
  type CatalogPlugin,
  type CatalogSnapshot,
} from "../src/schema";
import {
  availableRefreshLimit,
  discoverCatalogSnapshot,
  isFeaturedPlugin,
  renderCatalogSection,
  replaceCatalogSection,
  selectCategoryHighlights,
} from "../src/node";
import { firstPlainParagraph, isSubstantialDocumentation } from "../src/readme";

it('reserves API quota for publishing while bounding repository refresh work', async () => {
  for (const [remaining, expected] of [[1000,300], [500,133], [103,1], [100,0], [0,0]]) {
    const fetcher = (async () => Response.json({resources:{core:{remaining}}})) as typeof fetch;
    expect(await availableRefreshLimit(fetcher)).toBe(expected);
  }
});

function monorepoReadmeFixture(options: { packageReadme?: string } = {}) {
  const repository = {
    archived: false,
    default_branch: "main",
    description: null,
    disabled: false,
    fork: false,
    full_name: "owner/monorepo",
    homepage: "docs.example.com",
    html_url: "https://github.com/owner/monorepo",
    license: { spdx_id: "MIT" },
    name: "monorepo",
    owner: { login: "owner" },
    pushed_at: "2026-08-14T00:00:00Z",
    stargazers_count: 3,
    topics: ["dsh-plugin"],
  };
  const rootReadme = [
    "# Monorepo plugins",
    "",
    "This workspace ships installable DeepSeek Harness plugins for memory and recall.",
    "",
    "## Installation",
    "",
    "Add the memory package from this repository.",
    "",
    "## Usage",
    "",
    "Call the memory tool after install.",
  ].join("\n");
  const responses = new Map<string, string>([
    ["/search/repositories", JSON.stringify({ total_count: 1, incomplete_results: false, items: [repository] })],
    ["/repos/owner/monorepo", JSON.stringify(repository)],
    ["/repos/owner/monorepo/commits/main", JSON.stringify({
      sha: "commit456",
      commit: { tree: { sha: "tree456" } },
    })],
    ["/repos/owner/monorepo/git/trees/main?recursive=1", JSON.stringify({
      tree: [{ path: "packages/memory/package.json", type: "blob" }],
    })],
    ["/owner/monorepo/main/package.json", JSON.stringify({ name: "workspace-root", private: true })],
    ["/owner/monorepo/main/packages/memory/package.json", JSON.stringify({
      name: "@owner/dsh-memory",
      main: "lib/index.js",
      dsh: { bundle: { patch: "./cordis.patch.yml" } },
    })],
    ["/owner/monorepo/commit456/README.md", rootReadme],
    ["/owner/monorepo/commit456/packages/memory/cordis.patch.yml", "- insert: []"],
  ]);
  if (options.packageReadme !== undefined) {
    responses.set("/owner/monorepo/commit456/packages/memory/README.md", options.packageReadme);
  }
  const fetcher = async (input: string | URL | Request): Promise<Response> => {
    const pathname = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
    const key = pathname.pathname === "/search/repositories"
      ? pathname.pathname
      : `${pathname.pathname}${pathname.search}`;
    const body = responses.get(key);
    return body === undefined ? new Response(null, { status: 404 }) : new Response(body);
  };
  return { fetcher, rootReadme };
}

it.each(["discover", "refresh"] as const)("refreshes an explicit existing repository in %s mode without moving global cursors", async catalogMode => {
  const { fetcher } = monorepoReadmeFixture();
  const source = { repository: "owner/catalog", commit: "test" };
  const previous = await discoverCatalogSnapshot({ fetch: fetcher, source });
  previous.discoveryAt = "2026-08-01T00:00:00Z";
  previous.refreshCursor = 7;
  previous.pendingRepositories = ["unrelated/repository"];
  previous.plugins[0].description = "Stale metadata";
  const result = await discoverCatalogSnapshot({
    fetch: fetcher, source, previousSnapshot: previous, catalogMode,
    targetRepository: "owner/monorepo", refreshLimit: 1,
  });
  expect(result.plugins[0].description).not.toBe("Stale metadata");
  expect(result.changedRepositories).toEqual(["owner/monorepo"]);
  expect(result.discoveryAt).toBe(previous.discoveryAt);
  expect(result.refreshCursor).toBe(7);
  expect(result.pendingRepositories).toEqual(previous.pendingRepositories);
});

it("classifies ecommerce CSV demos as productivity and renders localized README descriptions", async () => {
  const { fetcher } = monorepoReadmeFixture();
  const snapshot = await discoverCatalogSnapshot({
    source: { repository: "owner/catalog", commit: "test" },
    targetRepository: "owner/monorepo",
    fetch: async input => {
      if (String(input).endsWith("/packages/memory/package.json")) {
        return Response.json({ name: "dsh-commerce-cockpit", main: "index.js", description: "Ecommerce demo with CSV validation and rule-based Q&A." });
      }
      return fetcher(input);
    },
  });
  const plugin = snapshot.plugins[0];
  expect(plugin.categories).toEqual(["productivity"]);
  plugin.i18n = { "zh-CN": { description: "电商演示与 CSV 校验" } };
  const chinese = renderCatalogSection(snapshot, "zh-CN");
  expect(chinese).toContain("电商演示与 CSV 校验");
  expect(chinese).toContain("/zh-CN/?category=productivity");
  expect(chinese).toContain("按分类探索插件");
  expect(renderCatalogSection(snapshot)).toContain(plugin.description);
  expect(renderCatalogSection(snapshot)).toContain("/en/?category=productivity");
  delete plugin.i18n;
  expect(renderCatalogSection(snapshot, "zh-CN")).toContain(plugin.description);
});

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

  it("serves repository-authored content when translations are absent", () => {
    const plugin = {
      description: "Source description",
      installation: { markdown: "Source install", notes: ["Source note"] },
      usage: { markdown: "Source usage", summary: "Source summary" },
    } as unknown as Parameters<typeof localizePlugin>[0];

    expect(localizePlugin(plugin, "zh-CN")).toBe(plugin);
    expect(localizedDescription(plugin, "zh-CN")).toBe("Source description");
  });

  it("removes legacy translations and requests a one-time full import", () => {
    const plugin = {
      description: "Source description",
      i18n: { "zh-CN": { description: "中文描述" } },
      installation: { markdown: "Source install", notes: [] },
      usage: { markdown: "Source usage", summary: "Source summary" },
    } as unknown as CatalogPlugin;
    const snapshot: CatalogSnapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-with-translations",
      generatedAt: "2026-08-14T00:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "abcdef" },
      mainline: null,
      plugins: [plugin],
    };

    const stripped = stripCatalogTranslations(snapshot);

    expect(stripped.changedRepositories).toBeUndefined();
    expect(stripped.plugins[0]?.i18n).toBeUndefined();
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

  it("selects five repository-diverse highlights for each category", () => {
    const plugins = [
      ["owner-a", "plugin-a", 100],
      ["owner-a", "plugin-b", 90],
      ["owner-b", "plugin-c", 80],
      ["owner-c", "plugin-d", 70],
      ["owner-d", "plugin-e", 60],
      ["owner-e", "plugin-f", 50],
    ].map(([owner, name, stars]) => ({
      name,
      featured: false,
      repository: { owner, name: owner, stars, pushedAt: null },
      compatibility: { status: "unknown", level: "declared" },
    })) as unknown as CatalogPlugin[];

    expect(selectCategoryHighlights(plugins).map(plugin => plugin.name)).toEqual([
      "plugin-a",
      "plugin-c",
      "plugin-d",
      "plugin-e",
      "plugin-f",
    ]);
  });
});

describe("catalog discovery", () => {
  it("features only the dshhub search plugin", () => {
    expect(isFeaturedPlugin("coderPerseus/dsh-hub", "@dshhubs/plugin-search")).toBe(true);
    expect(isFeaturedPlugin("other/dsh-hub", "@dshhubs/plugin-search")).toBe(false);
    expect(isFeaturedPlugin("coderPerseus/dsh-hub", "@dshhubs/cli")).toBe(false);
  });

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
          homepage: "https://example.com/plugin",
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
        homepage: "https://example.com/plugin",
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
    const searchQueries: string[] = [];
    const fetcher = async (input: string | URL | Request): Promise<Response> => {
      const pathname = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
      if (pathname.pathname === "/search/repositories") {
        searchQueries.push(pathname.searchParams.get("q") ?? "");
      }
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
      "npx -p @deepseek-ai/dsh dsh plugin --profile web add github:owner/plugin",
    );
    expect(snapshot.plugins[0]?.description).toBe("Repository description");
    expect(snapshot.plugins[0]?.repository.homepage).toBe("https://example.com/plugin");
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

    searchQueries.length = 0;
    const windowed = await discoverCatalogSnapshot({
      catalogMode: 'discover',
      discoverySince: new Date('2026-08-14T00:00:00Z'),
      discoveryQueries: ['topic:dsh-plugin'],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date('2026-08-14T02:00:00Z'),
      previousSnapshot: snapshot,
      source: {repository:'owner/catalog',commit:'windowed'},
    });
    expect(searchQueries).toHaveLength(2);
    expect(searchQueries.every(query => query.includes('pushed:'))).toBe(true);
    expect(windowed.plugins).toEqual(snapshot.plugins);

    const searchResult = JSON.parse(responses.get("/search/repositories") ?? "{}") as {
      items: Array<{ stargazers_count: number }>;
    };
    searchResult.items[0].stargazers_count = 44;
    responses.set("/search/repositories", JSON.stringify(searchResult));
    searchQueries.length = 0;
    const backfilled = await discoverCatalogSnapshot({
      catalogMode: "backfill",
      discoveryQueries: ["topic:dsh-plugin"],
      discoverySince: new Date("2026-08-14T00:00:00Z"),
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T02:00:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source-backfill" },
    });
    expect(searchQueries).toHaveLength(2);
    expect(searchQueries.every(query => query.includes("pushed:"))).toBe(true);
    expect(backfilled.plugins[0]?.repository.stars).toBe(44);
    expect(backfilled.changedRepositories).toEqual(["owner/plugin"]);

    const refreshed = await discoverCatalogSnapshot({
      catalogMode: "refresh",
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T03:00:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source789" },
    });
    expect(refreshed.plugins[0]?.repository.stars).toBe(43);
    expect(refreshed.changedRepositories).toEqual(["owner/plugin"]);
    expect(refreshed.discoveryAt).toBe(snapshot.generatedAt);

    const rotation = await discoverCatalogSnapshot({
      catalogMode: 'refresh', refreshLimit: 1,
      fetch: (async () => new Response(null, {status:404})) as typeof fetch,
      previousSnapshot: {...snapshot, plugins:[snapshot.plugins[0]!, {...snapshot.plugins[0]!, id:'github:other/plugin', slug:'other/plugin', repository:{...snapshot.plugins[0]!.repository,owner:'other'}}]},
      source: {repository:'owner/catalog',commit:'rotation'},
    });
    expect(rotation.refreshCursor).toBe(1);
    expect(rotation.plugins).toHaveLength(2);
    expect(rotation.discoveryAt).toBe(snapshot.generatedAt);

    responses.set("/repos/owner/plugin", JSON.stringify({
      archived: false,
      default_branch: "main",
      description: "Repository description",
      disabled: false,
      fork: false,
      full_name: "owner/plugin",
      homepage: "https://example.com/plugin",
      html_url: "https://github.com/owner/plugin",
      license: { spdx_id: "MIT" },
      name: "plugin",
      owner: { login: "owner" },
      pushed_at: "2026-08-14T00:00:00Z",
      stargazers_count: 42,
      topics: ["dsh-plugin", "vision"],
    }));
    const unchangedRefresh = await discoverCatalogSnapshot({
      catalogMode: "refresh",
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T03:30:00Z"),
      previousSnapshot: snapshot,
      source: { repository: "owner/catalog", commit: "source890" },
    });
    expect(unchangedRefresh.changedRepositories).toEqual([]);

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
      catalogMode: "backfill",
      discoveryQueries: ["topic:dsh-plugin"],
      discoverySince: new Date("2026-08-14T00:00:00Z"),
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    })).rejects.toThrow(/incomplete results/);
  });

  it("rejects discovery queries that exceed GitHub's result window", async () => {
    const fetcher = async (): Promise<Response> => new Response(JSON.stringify({
      total_count: 1_001,
      incomplete_results: false,
      items: [],
    }));

    await expect(discoverCatalogSnapshot({
      catalogMode: "backfill",
      discoveryQueries: ["topic:dsh-plugin"],
      discoverySince: new Date("2026-08-14T00:00:00Z"),
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    })).rejects.toThrow(/exceeds 1000 repositories/);
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
          { path: "packages/cli/package.json", type: "blob" },
          { path: "packages/memory/package.json", type: "blob" },
          { path: "packages/skill-curator/package.json", type: "blob" },
        ],
      })],
      ["/owner/plugins/main/package.json", JSON.stringify({
        name: "workspace-root",
        private: true,
      })],
      ["/owner/plugins/main/packages/cli/package.json", JSON.stringify({
        name: "@owner/cli",
        description: "Search and inspect plugins from a catalog",
        main: "lib/index.js",
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
    expect(snapshot.plugins[0]?.installation.command).toBe(
      "npx -p @deepseek-ai/dsh dsh plugin --profile web add github:owner/plugins#commit123&path:packages/memory",
    );
  });

  it("discovers a private GitHub package with an explicit DSH manifest", async () => {
    const repository = {
      archived: false,
      default_branch: "main",
      description: "Desktop DSH distribution",
      disabled: false,
      fork: false,
      full_name: "owner/private-dsh",
      html_url: "https://github.com/owner/private-dsh",
      license: { spdx_id: "BSD-3-Clause" },
      name: "private-dsh",
      owner: { login: "owner" },
      pushed_at: "2026-08-14T00:00:00Z",
      stargazers_count: 2,
      topics: ["dsh-plugin"],
    };
    const responses = new Map<string, string>([
      ["/search/repositories", JSON.stringify({ total_count: 1, incomplete_results: false, items: [repository] })],
      ["/repos/owner/private-dsh/commits/main", JSON.stringify({
        sha: "commit123",
        commit: { tree: { sha: "tree123" } },
      })],
      ["/owner/private-dsh/main/package.json", JSON.stringify({
        name: "@owner/private-dsh",
        private: true,
        main: "dist/plugin.js",
        dsh: { bundle: { patch: "./dist/cordis.patch.yml" } },
      })],
      ["/owner/private-dsh/commit123/dist/cordis.patch.yml", "- insert: []"],
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
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins).toHaveLength(1);
    expect(snapshot.plugins[0]?.slug).toBe("owner/private-dsh");
    expect(snapshot.plugins[0]?.installation.command).toBe(
      "npx -p @deepseek-ai/dsh dsh plugin --profile web add github:owner/private-dsh",
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

  it("prefers a workspace package README over the root README", async () => {
    const { fetcher, rootReadme } = monorepoReadmeFixture({
      packageReadme: "# @owner/dsh-memory\n\nPackage-local install notes for the memory plugin.\n",
    });

    const snapshot = await discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins).toHaveLength(1);
    expect(snapshot.plugins[0]?.description).toBe("Package-local install notes for the memory plugin.");
    expect(snapshot.plugins[0]?.usage.markdown).not.toContain("Call the memory tool after install.");
    expect(rootReadme).toContain("Call the memory tool after install.");
    expect(snapshot.plugins[0]?.repository.homepage).toBe("https://docs.example.com/");
    expect(snapshot.plugins[0]?.usage.readmeUrl).toBe(
      "https://github.com/owner/monorepo/blob/commit456/packages/memory/README.md",
    );
  });

  it("uses the root README only when the workspace package has none", async () => {
    const { fetcher } = monorepoReadmeFixture();

    const snapshot = await discoverCatalogSnapshot({
      discoveryQueries: ["topic:dsh-plugin"],
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins).toHaveLength(1);
    expect(snapshot.plugins[0]?.description).toContain("installable DeepSeek Harness plugins");
    expect(snapshot.plugins[0]?.installation.markdown).toContain("## Installation");
    expect(snapshot.plugins[0]?.usage.markdown).toContain("## Usage");
    expect(snapshot.plugins[0]?.usage.readmeUrl).toBe(
      "https://github.com/owner/monorepo/blob/commit456/README.md",
    );
  });
});

describe("catalog schema compatibility", () => {
  it("accepts plugins that predate the homepage field", () => {
    const plugin = catalogPluginSchema.parse({
      id: "github:owner/plugin",
      slug: "owner/plugin",
      name: "plugin",
      description: "A plugin",
      repository: {
        owner: "owner",
        name: "plugin",
        url: "https://github.com/owner/plugin",
        defaultBranch: "main",
        commit: "abc123",
        stars: 1,
        license: null,
        topics: [],
        pushedAt: null,
      },
      package: {
        name: "plugin",
        version: "1.0.0",
        hasBundle: false,
        bundlePatch: null,
        hasPrepareScript: false,
        peerDependencies: {},
      },
      categories: ["other"],
      featured: false,
      compatibility: {
        status: "unknown",
        level: "unverified",
        harnessRange: null,
        cordisRange: null,
        checks: [],
      },
      installation: {
        kind: "manual",
        spec: null,
        command: null,
        markdown: "",
        notes: [],
      },
      usage: {
        summary: "A plugin",
        markdown: "",
        readmeUrl: "https://github.com/owner/plugin#readme",
      },
    });

    expect(plugin.repository.homepage).toBeUndefined();
  });
});

describe("readme projection", () => {
  it("treats heading-only stubs as empty documentation", () => {
    expect(isSubstantialDocumentation("# @owner/package\n")).toBe(false);
    expect(isSubstantialDocumentation("This package adds a memory tool to DeepSeek Harness and explains how to install it.")).toBe(true);
  });

  it("reads the first visible paragraph from HTML-heavy READMEs", () => {
    expect(firstPlainParagraph([
      "<p align=\"center\"><img src=\"banner.jpg\" alt=\"Banner\" /></p>",
      "",
      "# ModLens",
      "",
      "Give a text-only model sight, and just paste the image.",
    ].join("\n"))).toBe("Give a text-only model sight, and just paste the image.");
  });
});

it('publishes healthy repositories and retries skipped 409 repositories outside the discovery window', async () => {
  const { fetcher } = monorepoReadmeFixture();
  const search = await (await fetcher('https://api.github.com/search/repositories')).json();
  const good = search.items[0];
  const bad = {...good, full_name:'owner/broken', name:'broken'};
  let recovered = false;
  let searchesEmpty = false;
  const requests: string[] = [];
  const mixedFetch = (async (input: string | URL | Request) => {
    const url = String(input); requests.push(url);
    if (url.includes('/search/repositories')) return Response.json({...search,items:searchesEmpty ? [] : [good,bad]});
    if (url === 'https://api.github.com/repos/owner/broken') return Response.json(bad);
    if (url.includes('/owner/broken/')) {
      if (!recovered) return new Response(null,{status:url.includes('/git/trees/') ? 409 : 404});
      return fetcher(url.replace('/owner/broken/','/owner/monorepo/'));
    }
    return fetcher(input);
  }) as typeof fetch;
  const source = {repository:'owner/catalog',commit:'test'};
  const first = await discoverCatalogSnapshot({fetch:mixedFetch,source,catalogMode:'discover'});
  expect(first.plugins).toHaveLength(1);
  expect(first.pendingRepositories).toEqual(['owner/broken']);
  searchesEmpty = true;
  const stillFailed = await discoverCatalogSnapshot({fetch:mixedFetch,source,catalogMode:'discover',previousSnapshot:first});
  expect(stillFailed.plugins).toEqual(first.plugins);
  expect(stillFailed.pendingRepositories).toEqual(['owner/broken']);
  recovered = true;
  const next = await discoverCatalogSnapshot({fetch:mixedFetch,source,catalogMode:'discover',previousSnapshot:stillFailed});
  expect(next.plugins).toHaveLength(2);
  expect(next.pendingRepositories).toEqual([]);
  expect(requests).toContain('https://api.github.com/repos/owner/broken');
});

it('retains existing plugin data when refresh hits a repository 409', async () => {
  const {fetcher} = monorepoReadmeFixture();
  const source = {repository:'owner/catalog',commit:'test'};
  const first = await discoverCatalogSnapshot({fetch:fetcher as typeof fetch,source});
  const repository = (await (await fetcher('https://api.github.com/search/repositories')).json()).items[0];
  const next = await discoverCatalogSnapshot({source,catalogMode:'refresh',previousSnapshot:first,fetch:(async input => {
    if (String(input)==='https://api.github.com/repos/owner/monorepo') return Response.json(repository);
    return new Response(null,{status:409});
  }) as typeof fetch});
  expect(next.plugins).toEqual(first.plugins);
  expect(next.pendingRepositories).toEqual(['owner/monorepo']);
  expect(next.discoveryAt).toBe(first.discoveryAt);
});

it('does not swallow GitHub authentication failures as bad repository data', async () => {
  const {fetcher} = monorepoReadmeFixture();
  await expect(discoverCatalogSnapshot({source:{repository:'owner/catalog',commit:'test'},fetch:(async input => {
    if (String(input).includes('/search/repositories')) return fetcher(input);
    return new Response(null,{status:401});
  }) as typeof fetch})).rejects.toThrow(/401/);
});

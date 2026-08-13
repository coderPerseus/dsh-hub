import { describe, expect, it } from "vitest";

import { registryEntrySchema } from "../src/schema";
import {
  buildCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../src/node";

describe("registry entry schema", () => {
  it("rejects repository names that cannot be addressed safely", () => {
    expect(() => registryEntrySchema.parse({
      schemaVersion: 1,
      repository: "../escape",
      categories: ["tools"],
    })).toThrow(/segments cannot be/);
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

describe("catalog builder", () => {
  it("derives an installable entry from repository files", async () => {
    const responses = new Map<string, string>([
      ["/repos/owner/plugin", JSON.stringify({
        default_branch: "main",
        description: "Repository description",
        full_name: "owner/plugin",
        html_url: "https://github.com/owner/plugin",
        license: { spdx_id: "MIT" },
        name: "plugin",
        owner: { login: "owner" },
        pushed_at: "2026-08-14T00:00:00Z",
        stargazers_count: 42,
        topics: ["dsh-plugin"],
      })],
      ["/repos/owner/plugin/commits/main", JSON.stringify({ sha: "abc123" })],
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
      const body = responses.get(`${pathname.pathname}${pathname.search}`);
      return body === undefined ? new Response(null, { status: 404 }) : new Response(body);
    };
    const entry = registryEntrySchema.parse({
      schemaVersion: 1,
      repository: "owner/plugin",
      categories: ["tools"],
      documentation: {
        install: "Enable the plugin after installation.",
        usage: "## Curated usage\n\nUse the profile settings.",
      },
    });

    const snapshot = await buildCatalogSnapshot([entry], {
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins[0]?.installation.command).toBe(
      "dsh plugin --profile <profile> add github:owner/plugin#abc123",
    );
    expect(snapshot.plugins[0]?.installation.markdown).toBe("Enable the plugin after installation.");
    expect(snapshot.plugins[0]?.usage.markdown).toBe("## Curated usage\n\nUse the profile settings.");
    expect(snapshot.plugins[0]?.compatibility.level).toBe("declared");
    expect(snapshot.plugins[0]?.compatibility.status).toBe("unknown");
  });

  it("does not fetch registry entries hidden by curation", async () => {
    const entry = registryEntrySchema.parse({
      schemaVersion: 1,
      repository: "owner/hidden",
      categories: ["tools"],
      curation: { featured: false, hidden: true },
    });
    const fetcher = async (): Promise<Response> => {
      throw new Error("hidden repositories must not be fetched");
    };

    const snapshot = await buildCatalogSnapshot([entry], {
      fetch: fetcher as typeof fetch,
      generatedAt: new Date("2026-08-14T01:00:00Z"),
      source: { repository: "owner/catalog", commit: "source123" },
    });

    expect(snapshot.plugins).toEqual([]);
  });
});

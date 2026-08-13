import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import {
  catalogSnapshotSchema,
  registryEntrySchema,
  type CatalogPlugin,
  type CatalogSnapshot,
  type RegistryEntry,
} from "./schema";

type GithubRepository = {
  default_branch: string;
  description: string | null;
  full_name: string;
  html_url: string;
  license: { spdx_id: string } | null;
  name: string;
  owner: { login: string };
  pushed_at: string | null;
  stargazers_count: number;
  topics: string[];
};

type GithubCommit = { sha: string };

type PackageManifest = {
  description?: string;
  dsh?: { bundle?: { patch?: string } };
  exports?: unknown;
  main?: string;
  name?: string;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  version?: string;
};

export type CatalogBuildOptions = {
  fetch?: typeof globalThis.fetch;
  generatedAt?: Date;
  githubToken?: string;
  mainline?: CatalogSnapshot["mainline"];
  source: CatalogSnapshot["source"];
};

const GITHUB_CONCURRENCY = 4;
const GITHUB_MAX_ATTEMPTS = 4;

const githubHeaders = (token?: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function wait(milliseconds: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function githubRequest(
  fetcher: typeof globalThis.fetch,
  input: string,
  init: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt < GITHUB_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetcher(input, init);
    const retryable = response.status === 429
      || response.status >= 500
      || (response.status === 403 && (
        response.headers.has("retry-after")
        || response.headers.get("x-ratelimit-remaining") === "0"
      ));
    if (!retryable || attempt === GITHUB_MAX_ATTEMPTS - 1) return response;

    const retryAfter = Number(response.headers.get("retry-after"));
    const rateLimitReset = Number(response.headers.get("x-ratelimit-reset"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1_000, 60_000)
      : Number.isFinite(rateLimitReset) && rateLimitReset > 0
        ? Math.min(Math.max(rateLimitReset * 1_000 - Date.now(), 1_000), 60_000)
        : 1_000 * 2 ** attempt;
    await wait(delay);
  }
  throw new Error("GitHub request exhausted its retry budget.");
}

async function githubJson<T>(
  fetcher: typeof globalThis.fetch,
  pathname: string,
  token?: string,
): Promise<T> {
  const response = await githubRequest(fetcher, `https://api.github.com${pathname}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`GitHub ${pathname} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function githubRaw(
  fetcher: typeof globalThis.fetch,
  repository: string,
  file: string,
  ref: string,
  token?: string,
): Promise<string | null> {
  const response = await githubRequest(
    fetcher,
    `https://api.github.com/repos/${repository}/contents/${file}?ref=${encodeURIComponent(ref)}`,
    {
      headers: {
        ...githubHeaders(token),
        Accept: "application/vnd.github.raw+json",
      },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub ${repository}/${file} returned ${response.status}`);
  }
  return response.text();
}

function extractDocumentation(readme: string, titlePattern: RegExp): string {
  const headings = /^(#{1,3})\s+(.+)$/gm;
  const matches = [...readme.matchAll(headings)];
  const selected: string[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!titlePattern.test(match[2])) {
      continue;
    }
    const start = match.index ?? 0;
    const level = match[1].length;
    const next = matches.slice(index + 1).find((candidate) => candidate[1].length <= level);
    selected.push(readme.slice(start, next?.index ?? readme.length).trim());
  }

  return selected.join("\n\n").slice(0, 16_000);
}

async function mapConcurrent<Input, Output>(
  items: Input[],
  concurrency: number,
  mapper: (item: Input) => Promise<Output>,
): Promise<Output[]> {
  const output = new Array<Output>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await mapper(items[index]);
    }
  }));
  return output;
}

function peerRange(peers: Record<string, string>, matcher: (name: string) => boolean): string | null {
  const match = Object.entries(peers).find(([name]) => matcher(name));
  return match?.[1] ?? null;
}

async function buildPlugin(
  entry: RegistryEntry,
  options: Required<Pick<CatalogBuildOptions, "fetch">> & CatalogBuildOptions,
): Promise<CatalogPlugin> {
  const repo = await githubJson<GithubRepository>(
    options.fetch,
    `/repos/${entry.repository}`,
    options.githubToken,
  );
  const head = await githubJson<GithubCommit>(
    options.fetch,
    `/repos/${entry.repository}/commits/${encodeURIComponent(repo.default_branch)}`,
    options.githubToken,
  );
  const manifestText = await githubRaw(
    options.fetch,
    entry.repository,
    "package.json",
    head.sha,
    options.githubToken,
  );
  if (manifestText === null) throw new Error(`${entry.repository} has no package.json`);

  const manifest = JSON.parse(manifestText) as PackageManifest;
  if (!manifest.name || (!manifest.main && !manifest.exports && !manifest.dsh)) {
    throw new Error(`${entry.repository} does not expose an installable package`);
  }

  const readme =
    (await githubRaw(options.fetch, entry.repository, "README.md", head.sha, options.githubToken))
    ?? (await githubRaw(options.fetch, entry.repository, "README.zh.md", head.sha, options.githubToken))
    ?? "";
  const bundlePatch = manifest.dsh?.bundle?.patch ?? null;
  const bundleExists = bundlePatch === null
    ? null
    : await githubRaw(
      options.fetch,
      entry.repository,
      bundlePatch.replace(/^\.\//, ""),
      head.sha,
      options.githubToken,
    );
  const peers = manifest.peerDependencies ?? {};
  const cordisRange = peers["@deepseek-ai/cordis"] ?? null;
  const harnessRange = peerRange(peers, name => name.startsWith("@deepseek-ai/dsh-"));
  const checks: CatalogPlugin["compatibility"]["checks"] = [
    { id: "package-entry", status: "pass", summary: "Package entry is declared." },
    bundlePatch === null
      ? { id: "bundle", status: "warn", summary: "No dsh.bundle patch is declared." }
      : bundleExists === null
        ? { id: "bundle", status: "fail", summary: `Bundle patch ${bundlePatch} is missing.` }
        : { id: "bundle", status: "pass", summary: `Bundle patch ${bundlePatch} exists.` },
    harnessRange === null && cordisRange === null
      ? { id: "peer-dependencies", status: "warn", summary: "No Harness or Cordis peer range is declared." }
      : { id: "peer-dependencies", status: "pass", summary: "Harness or Cordis peer ranges are declared." },
  ];
  const incompatible = checks.some(check => check.status === "fail");
  const spec = `github:${entry.repository}#${head.sha}`;
  const notes = [
    ...(manifest.scripts?.prepare
      ? ["This source package declares a prepare script; pnpm may require allowBuilds approval."]
      : []),
  ];
  const installationMarkdown = entry.documentation?.install
    ?? extractDocumentation(readme, /(install|setup|quick start|安装|开始)/i);
  const usageMarkdown = entry.documentation?.usage
    ?? extractDocumentation(readme, /(usage|configuration|使用|配置)/i);

  return {
    id: `github:${entry.repository}`,
    slug: entry.repository,
    name: entry.display?.name ?? manifest.name ?? repo.name,
    description: entry.display?.summary ?? repo.description ?? manifest.description ?? "",
    repository: {
      owner: repo.owner.login,
      name: repo.name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      commit: head.sha,
      stars: repo.stargazers_count,
      license: repo.license?.spdx_id ?? null,
      topics: repo.topics,
      pushedAt: repo.pushed_at,
    },
    package: {
      name: manifest.name,
      version: manifest.version ?? null,
      hasBundle: bundlePatch !== null,
      bundlePatch,
      hasPrepareScript: Boolean(manifest.scripts?.prepare),
      peerDependencies: peers,
    },
    categories: entry.categories,
    featured: entry.curation.featured,
    compatibility: {
      status: incompatible ? "incompatible" : "unknown",
      level: harnessRange === null && cordisRange === null ? "unverified" : "declared",
      harnessRange,
      cordisRange,
      checks,
    },
    installation: {
      kind: bundlePatch === null || incompatible ? "manual" : "github",
      spec,
      command: bundlePatch === null || incompatible
        ? null
        : `dsh plugin --profile <profile> add ${spec}`,
      markdown: installationMarkdown,
      notes,
    },
    usage: {
      summary: entry.display?.summary ?? repo.description ?? manifest.description ?? "",
      markdown: usageMarkdown,
      readmeUrl: `${repo.html_url}#readme`,
    },
  };
}

export async function loadRegistry(directory: string): Promise<RegistryEntry[]> {
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map(entry => entry.name)
    .sort();

  return Promise.all(files.map(async (file) => {
    const contents = await readFile(path.join(directory, file), "utf8");
    return registryEntrySchema.parse(parse(contents));
  }));
}

export async function buildCatalogSnapshot(
  entries: RegistryEntry[],
  options: CatalogBuildOptions,
): Promise<CatalogSnapshot> {
  const generatedAt = options.generatedAt ?? new Date();
  const fetcher = options.fetch ?? globalThis.fetch;
  const visibleEntries = entries.filter(entry => !entry.curation.hidden);
  const plugins = await mapConcurrent(visibleEntries, GITHUB_CONCURRENCY, entry => buildPlugin(entry, {
    ...options,
    fetch: fetcher,
  }));
  plugins.sort((left, right) => left.name.localeCompare(right.name));

  return catalogSnapshotSchema.parse({
    schemaVersion: 1,
    snapshotId: `${generatedAt.toISOString()}-${options.source.commit.slice(0, 12)}`,
    generatedAt: generatedAt.toISOString(),
    source: options.source,
    mainline: options.mainline ?? null,
    plugins,
  });
}

export function renderCatalogSection(snapshot: CatalogSnapshot): string {
  const categoryCount = new Map<string, number>();
  for (const plugin of snapshot.plugins) {
    for (const category of plugin.categories) {
      categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
    }
  }
  const categories = [...categoryCount.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => `- \`${category}\`: ${count}`)
    .join("\n");
  const rows = snapshot.plugins.map(plugin => (
    `| [${plugin.name}](${plugin.repository.url}) | ${plugin.description.replaceAll("|", "\\|")} | ${plugin.categories.join(", ")} | ${plugin.compatibility.level} |`
  )).join("\n");

  return [
    "<!-- catalog:start -->",
    "## Plugin catalog",
    "",
    `Generated at ${snapshot.generatedAt} from snapshot \`${snapshot.snapshotId}\`.`,
    "",
    `Plugins: **${snapshot.plugins.length}**`,
    "",
    categories || "No categories yet.",
    "",
    "| Plugin | Description | Categories | Evidence |",
    "| --- | --- | --- | --- |",
    rows || "| — | No plugins registered yet. | — | — |",
    "<!-- catalog:end -->",
  ].join("\n");
}

export function replaceCatalogSection(readme: string, section: string): string {
  const marker = /<!-- catalog:start -->[\s\S]*?<!-- catalog:end -->/;
  if (marker.test(readme)) return readme.replace(marker, section);
  return `${readme.trimEnd()}\n\n${section}\n`;
}

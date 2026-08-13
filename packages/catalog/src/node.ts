import {
  catalogSnapshotSchema,
  type CatalogPlugin,
  type CatalogSnapshot,
} from "./schema";

type GithubRepository = {
  archived: boolean;
  default_branch: string;
  description: string | null;
  disabled: boolean;
  fork: boolean;
  full_name: string;
  html_url: string;
  license: { spdx_id: string } | null;
  name: string;
  owner: { login: string };
  pushed_at: string | null;
  stargazers_count: number;
  topics: string[];
  updated_at?: string | null;
};

type GithubCommit = { commit: { tree: { sha: string } }; sha: string };
type GithubSearchResponse = {
  incomplete_results: boolean;
  items: GithubRepository[];
  total_count: number;
};
type GithubTree = { tree: Array<{ path: string; type: string }> };

type PackageManifest = {
  description?: string;
  dsh?: { bundle?: { patch?: string } };
  exports?: unknown;
  keywords?: string[];
  main?: string;
  name?: string;
  peerDependencies?: Record<string, string>;
  private?: boolean;
  scripts?: Record<string, string>;
  version?: string;
};

export type CatalogBuildOptions = {
  catalogMode?: "discover" | "refresh";
  discoveryQueries?: string[];
  fetch?: typeof globalThis.fetch;
  generatedAt?: Date;
  githubToken?: string;
  mainline?: CatalogSnapshot["mainline"];
  minimumPluginCount?: number;
  previousSnapshot?: CatalogSnapshot;
  source: CatalogSnapshot["source"];
};

type DiscoveredPackage = {
  head: GithubCommit;
  manifest: PackageManifest & { name: string };
  packageDirectory: string;
  repository: GithubRepository;
};

const DEFAULT_DISCOVERY_QUERIES = [
  "topic:dsh-plugin archived:false fork:false",
  "topic:deepseek-harness-plugin archived:false fork:false",
  "topic:deepseek-harness-plugins archived:false fork:false",
];
const GITHUB_CONCURRENCY = 4;
const GITHUB_MAX_ATTEMPTS = 4;
const MAX_PACKAGES_PER_REPOSITORY = 50;
const DISCOVERY_OVERLAP_MS = 5 * 60 * 1_000;

function discoveryCutoff(previousSnapshot?: CatalogSnapshot): string | null {
  if (!previousSnapshot) return null;
  return new Date(
    new Date(previousSnapshot.generatedAt).getTime() - DISCOVERY_OVERLAP_MS,
  ).toISOString();
}

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
  const encodedPath = file.split("/").map(encodeURIComponent).join("/");
  const response = await githubRequest(
    fetcher,
    `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${encodedPath}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
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

function isInstallablePackage(manifest: PackageManifest): manifest is PackageManifest & { name: string } {
  if (manifest.private || !manifest.name || (!manifest.main && !manifest.exports && !manifest.dsh)) return false;
  const evidence = [manifest.name, manifest.description, ...(manifest.keywords ?? [])].filter(Boolean).join(" ");
  const peers = Object.keys(manifest.peerDependencies ?? {});
  return Boolean(
    manifest.dsh
    || /(?:^|[/_-])dsh(?:$|[/_-])|deepseek[- ]?harness/i.test(evidence)
    || peers.some(name => name === "@deepseek-ai/cordis" || name.startsWith("@deepseek-ai/dsh-")),
  );
}

function joinRepositoryPath(directory: string, file: string): string {
  return directory ? `${directory}/${file}` : file;
}

function packageSlug(source: DiscoveredPackage): string {
  if (!source.packageDirectory) return source.repository.full_name;
  const suffix = source.packageDirectory
    .replaceAll(/[^A-Za-z0-9_.-]+/g, "-");
  return `${source.repository.owner.login}/${source.repository.name}--${suffix}`;
}

const CATEGORY_RULES: Array<[string, RegExp]> = [
  ["memory", /\b(memory|memories|recall|knowledge)\b|记忆/i],
  ["skills", /\b(skill|skills|curator)\b|技能/i],
  ["agents", /\b(agent|agents|multi-agent|subagent|team)\b|智能体|代理/i],
  ["vision", /\b(vision|image|ocr|screenshot|multimodal)\b|视觉|图片/i],
  ["notifications", /\b(notification|notify|reminder|attention|badge|alert)\b|提醒|通知/i],
  ["finance", /\b(balance|billing|cost|price|token tracker)\b|余额|费用|成本/i],
  ["interface", /\b(ui|tui|sidebar|theme|desktop|pet|favicon)\b|界面|侧边栏|桌宠/i],
  ["development", /\b(code|coding|developer|vscode|git|terminal|debug)\b|开发|终端/i],
  ["integrations", /\b(mcp|integration|bridge|connector|remote)\b|集成/i],
  ["productivity", /\b(productivity|workflow|automation|session|workspace)\b|效率|工作流|会话/i],
];

function inferCategories(source: DiscoveredPackage): string[] {
  const manifest = source.manifest;
  const evidence = [
    manifest.name,
    manifest.description,
    ...(manifest.keywords ?? []),
    source.repository.description,
    ...source.repository.topics,
  ].filter(Boolean).join(" ");
  const categories = CATEGORY_RULES
    .filter(([, pattern]) => pattern.test(evidence))
    .map(([category]) => category);
  return categories.length > 0 ? categories : ["other"];
}

async function discoverRepositories(
  options: Required<Pick<CatalogBuildOptions, "fetch">> & CatalogBuildOptions,
): Promise<GithubRepository[]> {
  const cutoff = discoveryCutoff(options.previousSnapshot);
  const repositories = new Map<string, GithubRepository>();
  for (const query of options.discoveryQueries ?? DEFAULT_DISCOVERY_QUERIES) {
    for (let page = 1; page <= 10; page += 1) {
      const result = await githubJson<GithubSearchResponse>(
        options.fetch,
        `/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&page=${page}`,
        options.githubToken,
      );
      if (result.incomplete_results) {
        throw new Error(`GitHub discovery returned incomplete results for ${query}.`);
      }
      for (const repository of result.items) {
        const updatedAt = repository.updated_at ?? repository.pushed_at;
        if (cutoff && updatedAt && updatedAt <= cutoff) continue;
        if (!repository.archived && !repository.disabled && !repository.fork) {
          repositories.set(repository.full_name.toLowerCase(), repository);
        }
      }
      const oldest = result.items.at(-1);
      const oldestUpdatedAt = oldest?.updated_at ?? oldest?.pushed_at;
      if (result.items.length < 100 || (cutoff && oldestUpdatedAt && oldestUpdatedAt <= cutoff)) break;
    }
  }
  return [...repositories.values()];
}

async function loadExistingRepositories(
  options: Required<Pick<CatalogBuildOptions, "fetch">> & CatalogBuildOptions,
): Promise<GithubRepository[]> {
  const names = new Set((options.previousSnapshot?.plugins ?? []).map(plugin => (
    `${plugin.repository.owner}/${plugin.repository.name}`
  )));
  const loaded = await mapConcurrent([...names], GITHUB_CONCURRENCY, async (name) => {
    try {
      return await githubJson<GithubRepository>(options.fetch, `/repos/${name}`, options.githubToken);
    } catch (error) {
      console.warn(`Kept stale ${name}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  });
  return loaded.filter((repository): repository is GithubRepository => repository !== null);
}

async function discoverRepositoryPackages(
  repository: GithubRepository,
  options: Required<Pick<CatalogBuildOptions, "fetch">> & CatalogBuildOptions,
): Promise<DiscoveredPackage[]> {
  const manifests: Array<{ manifest: PackageManifest & { name: string }; packageDirectory: string }> = [];
  const rootManifestText = await githubRaw(
    options.fetch,
    repository.full_name,
    "package.json",
    repository.default_branch,
    options.githubToken,
  );
  if (rootManifestText !== null) {
    try {
      const manifest = JSON.parse(rootManifestText) as PackageManifest;
      if (isInstallablePackage(manifest)) manifests.push({ manifest, packageDirectory: "" });
    } catch (error) {
      console.warn(
        `Skipped malformed ${repository.full_name}/package.json: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (manifests.length === 0) {
    const tree = await githubJson<GithubTree>(
      options.fetch,
      `/repos/${repository.full_name}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`,
      options.githubToken,
    );
    const manifestPaths = tree.tree
      .filter(item => item.type === "blob" && /^(?:packages|plugins)\/[^/]+\/package\.json$/.test(item.path))
      .map(item => item.path)
      .slice(0, MAX_PACKAGES_PER_REPOSITORY);
    for (const manifestPath of manifestPaths) {
      const manifestText = await githubRaw(
        options.fetch,
        repository.full_name,
        manifestPath,
        repository.default_branch,
        options.githubToken,
      );
      if (manifestText === null) continue;
      try {
        const manifest = JSON.parse(manifestText) as PackageManifest;
        if (!isInstallablePackage(manifest)) continue;
        manifests.push({
          manifest,
          packageDirectory: manifestPath.slice(0, -"/package.json".length),
        });
      } catch (error) {
        console.warn(
          `Skipped malformed ${repository.full_name}/${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  if (manifests.length === 0) return [];
  const head = await githubJson<GithubCommit>(
    options.fetch,
    `/repos/${repository.full_name}/commits/${encodeURIComponent(repository.default_branch)}`,
    options.githubToken,
  );
  return manifests.map(manifest => ({ ...manifest, head, repository }));
}

async function buildPlugin(
  source: DiscoveredPackage,
  options: Required<Pick<CatalogBuildOptions, "fetch">> & CatalogBuildOptions,
): Promise<CatalogPlugin> {
  const { head, manifest, packageDirectory, repository: repo } = source;
  const repository = repo.full_name;

  const readme =
    (await githubRaw(options.fetch, repository, joinRepositoryPath(packageDirectory, "README.md"), head.sha, options.githubToken))
    ?? (await githubRaw(options.fetch, repository, joinRepositoryPath(packageDirectory, "README.zh.md"), head.sha, options.githubToken))
    ?? (packageDirectory ? await githubRaw(options.fetch, repository, "README.md", head.sha, options.githubToken) : null)
    ?? "";
  const bundlePatch = manifest.dsh?.bundle?.patch ?? null;
  const bundleExists = bundlePatch === null
    ? null
    : await githubRaw(
      options.fetch,
      repository,
      joinRepositoryPath(packageDirectory, bundlePatch.replace(/^\.\//, "")),
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
  const spec = `github:${repository}#${head.sha}${packageDirectory ? `&path:${packageDirectory}` : ""}`;
  const notes = [
    ...(manifest.scripts?.prepare
      ? ["This source package declares a prepare script; pnpm may require allowBuilds approval."]
      : []),
  ];
  const installationMarkdown = extractDocumentation(readme, /(install|setup|quick start|安装|开始)/i);
  const usageMarkdown = extractDocumentation(readme, /(usage|configuration|使用|配置)/i);
  const slug = packageSlug(source);
  const repositoryUrl = packageDirectory
    ? `${repo.html_url}/tree/${head.sha}/${packageDirectory}`
    : repo.html_url;

  return {
    id: `github:${repository}${packageDirectory ? `:${packageDirectory}` : ""}`,
    slug,
    name: manifest.name,
    description: manifest.description ?? repo.description ?? "",
    repository: {
      owner: repo.owner.login,
      name: repo.name,
      url: repositoryUrl,
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
    categories: inferCategories(source),
    featured: false,
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
      summary: manifest.description ?? repo.description ?? "",
      markdown: usageMarkdown,
      readmeUrl: `${repositoryUrl}#readme`,
    },
  };
}

export async function discoverCatalogSnapshot(
  options: CatalogBuildOptions,
): Promise<CatalogSnapshot> {
  const generatedAt = options.generatedAt ?? new Date();
  const fetcher = options.fetch ?? globalThis.fetch;
  const resolvedOptions = { ...options, fetch: fetcher };
  const isIncremental = Boolean(options.previousSnapshot);
  let repositories: GithubRepository[];
  if (isIncremental && options.catalogMode === "refresh") {
    repositories = await loadExistingRepositories(resolvedOptions);
  } else {
    repositories = await discoverRepositories(resolvedOptions);
    if (isIncremental) {
      const existing = new Set(options.previousSnapshot?.plugins.map(plugin => (
        `${plugin.repository.owner}/${plugin.repository.name}`.toLowerCase()
      )));
      repositories = repositories.filter(repository => !existing.has(repository.full_name.toLowerCase()));
    }
  }
  if (repositories.length === 0 && !options.previousSnapshot) {
    throw new Error("GitHub discovery returned no repositories.");
  }

  const discovered = await mapConcurrent(repositories, GITHUB_CONCURRENCY, async (repository) => {
    try {
      return {
        repository,
        sources: await discoverRepositoryPackages(repository, resolvedOptions),
        succeeded: true,
      };
    } catch (error) {
      console.warn(`Skipped ${repository.full_name}: ${error instanceof Error ? error.message : String(error)}`);
      return { repository, sources: [], succeeded: false };
    }
  });
  const sources = discovered.flatMap(result => result.sources);
  const built = await mapConcurrent(sources, GITHUB_CONCURRENCY, async (source) => {
    try {
      return { plugin: await buildPlugin(source, resolvedOptions), source, succeeded: true };
    } catch (error) {
      console.warn(
        `Skipped ${source.repository.full_name}/${source.packageDirectory || "package.json"}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { plugin: null, source, succeeded: false };
    }
  });
  const failedRepositories = new Set(built
    .filter(result => !result.succeeded)
    .map(result => result.source.repository.full_name.toLowerCase()));
  const changedRepositories = new Set(discovered
    .filter(result => result.succeeded && !failedRepositories.has(result.repository.full_name.toLowerCase()))
    .map(result => result.repository.full_name.toLowerCase()));
  const plugins = built
    .filter((result): result is typeof result & { plugin: CatalogPlugin } => (
      result.plugin !== null && changedRepositories.has(result.source.repository.full_name.toLowerCase())
    ))
    .map(result => result.plugin);
  const retained = (options.previousSnapshot?.plugins ?? []).filter(plugin => (
    !changedRepositories.has(`${plugin.repository.owner}/${plugin.repository.name}`.toLowerCase())
  ));
  plugins.push(...retained);
  plugins.sort((left, right) => left.name.localeCompare(right.name));
  const minimumPluginCount = options.minimumPluginCount ?? 1;
  if (plugins.length < minimumPluginCount) {
    throw new Error(`Discovery produced ${plugins.length} plugins; minimum is ${minimumPluginCount}.`);
  }
  console.log(
    `${options.previousSnapshot ? "Updated" : "Discovered"} ${repositories.length} repositories and produced ${plugins.length} installable packages.`,
  );

  return catalogSnapshotSchema.parse({
    schemaVersion: 1,
    snapshotId: `${generatedAt.toISOString()}-${options.source.commit.slice(0, 12)}`,
    generatedAt: generatedAt.toISOString(),
    changedRepositories: options.previousSnapshot
      ? [...changedRepositories].sort()
      : undefined,
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

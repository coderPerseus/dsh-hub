const README_MAX_CHARS = 80_000;
const README_FETCH_TIMEOUT_MS = 4_000;

export type PluginReadmeSource = {
  id: string;
  installation: { markdown: string };
  repository: {
    commit: string;
    defaultBranch: string;
    name: string;
    owner: string;
    url: string;
  };
  usage: { markdown: string; readmeUrl: string };
};

export type LoadedPluginReadme = {
  markdown: string;
  sourceUrl: string;
};

type ReadmeBase = {
  file: string;
  name: string;
  owner: string;
  ref: string;
};

export function pluginPackageDirectory(id: string): string {
  const match = /^github:[^/]+\/[^:]+:(.+)$/.exec(id);
  return match?.[1] ?? "";
}

export function pluginRepositoryUrl(plugin: { repository: { name: string; owner: string } }): string {
  return `https://github.com/${plugin.repository.owner}/${plugin.repository.name}`;
}

function readmeFileNames(locale?: string): string[] {
  const localized = locale === "zh-CN" || locale === "zh-TW"
    ? ["README.zh-CN.md", "README.zh.md"]
    : locale === "ja"
      ? ["README.ja.md"]
      : locale === "ko"
        ? ["README.ko.md"]
        : [];
  return [...localized, "README.md", "readme.md"];
}

export function pluginReadmeCandidates(plugin: PluginReadmeSource, locale?: string): string[] {
  const directory = pluginPackageDirectory(plugin.id);
  const names = readmeFileNames(locale);
  return [...new Set([
    ...names.map(name => (directory ? `${directory}/${name}` : name)),
    ...(directory ? names : []),
  ])];
}

function htmlAttr(attrs: string, name: string): string | null {
  const match = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(attrs);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function isImagePath(value: string): boolean {
  return /\.(?:png|jpe?g|gif|svg|webp|avif|bmp)(?:$|\?)/i.test(value);
}

function githubBlobUrl(base: ReadmeBase, path: string): string {
  return `https://github.com/${base.owner}/${base.name}/blob/${base.ref}/${path}`;
}

function githubRawUrl(base: ReadmeBase, path: string, search = ""): string {
  return `https://raw.githubusercontent.com/${base.owner}/${base.name}/${base.ref}/${path}${search}`;
}

export function rewriteReadmeUrl(value: string, base: ReadmeBase): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(?:mailto:|data:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const relative = trimmed.startsWith("/")
    ? trimmed.slice(1)
    : trimmed;
  const directory = base.file.includes("/") ? base.file.slice(0, base.file.lastIndexOf("/")) : "";
  const origin = `https://placeholder.local/${directory ? `${directory}/` : ""}`;
  const resolvedPath = new URL(relative, origin).pathname.replace(/^\//, "");
  return isImagePath(resolvedPath)
    ? githubRawUrl(base, resolvedPath)
    : githubBlobUrl(base, resolvedPath);
}

export function normalizeReadme(markdown: string, base: ReadmeBase): string {
  let text = markdown.replaceAll("\r\n", "\n");
  text = text.replace(/<img\b([^>]*)>/gi, (_match, attrs: string) => {
    const src = htmlAttr(attrs, "src");
    if (!src) return "";
    return `\n\n![${htmlAttr(attrs, "alt") ?? ""}](${rewriteReadmeUrl(src, base)})\n\n`;
  });
  text = text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_match, attrs: string, inner: string) => {
    const href = htmlAttr(attrs, "href");
    const label = inner.replace(/<[^>]+>/g, "").trim();
    if (!href) return label;
    return `[${label || href}](${rewriteReadmeUrl(href, base)})`;
  });
  text = text.replace(/<\/?(?:p|div|h[1-6]|br|hr|center|picture|source)[^>]*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/(!?\[[^\]]*])\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label: string, target: string) => {
    const next = rewriteReadmeUrl(target, base);
    return next === target ? match : `${label}(${next})`;
  });
  return decodeEntities(text).replace(/\n{3,}/g, "\n\n").trim().slice(0, README_MAX_CHARS);
}

function hasReadmeText(text: string): boolean {
  return Boolean(text.replace(/<[^>]+>/g, " ").trim());
}

export function readmeExcerpt(markdown: string): string {
  const withoutMarkup = markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\|.*$/gm, "");
  return withoutMarkup
    .split(/\n\s*\n/)
    .map(block => block.replace(/\s+/g, " ").trim())
    .find(block => block.length >= 40)
    ?.slice(0, 320) ?? "";
}

export async function loadPluginReadme(
  plugin: PluginReadmeSource,
  locale?: string,
): Promise<LoadedPluginReadme> {
  const ref = plugin.repository.commit || plugin.repository.defaultBranch;
  const base = {
    name: plugin.repository.name,
    owner: plugin.repository.owner,
    ref,
  };

  for (const file of pluginReadmeCandidates(plugin, locale)) {
    const encodedPath = file.split("/").map(encodeURIComponent).join("/");
    const url = `https://raw.githubusercontent.com/${base.owner}/${base.name}/${encodeURIComponent(ref)}/${encodedPath}`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/plain" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(README_FETCH_TIMEOUT_MS),
      });
      if (!response.ok) continue;
      const text = await response.text();
      if (!hasReadmeText(text)) continue;
      return {
        markdown: normalizeReadme(text, { ...base, file }),
        sourceUrl: `https://github.com/${base.owner}/${base.name}/blob/${ref}/${file}`,
      };
    } catch {
      continue;
    }
  }

  const fallback = plugin.usage.markdown || plugin.installation.markdown;
  return {
    markdown: fallback ? normalizeReadme(fallback, { ...base, file: "" }) : "",
    sourceUrl: plugin.usage.readmeUrl,
  };
}

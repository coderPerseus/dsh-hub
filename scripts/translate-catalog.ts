import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function repoRoot(): string {
  let dir = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}

import {
  catalogI18nEntrySchema,
  catalogLocales,
  catalogSnapshotSchema,
  type CatalogI18nEntry,
  type CatalogLocale,
  type CatalogPlugin,
  type CatalogSnapshot,
} from "../packages/catalog/src/index";

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_CONCURRENCY = 3;
const TRANSLATION_CACHE_VERSION = 2;

type CacheFile = Record<string, Record<string, CatalogI18nEntry>>;

type ChatChoice = {
  message?: { content?: string };
};

type TranslationPayload = {
  description: string;
  installationMarkdown: string;
  installationNotes: string[];
  usageMarkdown: string;
  usageSummary: string;
};

function argValue(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before running catalog translation.`);
  return value;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fingerprint(plugin: CatalogPlugin, model: string): string {
  return createHash("sha256").update(JSON.stringify({
    cacheVersion: TRANSLATION_CACHE_VERSION,
    model,
    commit: plugin.repository.commit,
    description: plugin.description,
    notes: plugin.installation.notes,
    usageMarkdown: plugin.usage.markdown,
    usageSummary: plugin.usage.summary,
    installationMarkdown: plugin.installation.markdown,
  })).digest("hex");
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export function translationPayload(plugin: CatalogPlugin): TranslationPayload {
  return {
    description: plugin.description,
    installationMarkdown: plugin.installation.markdown,
    installationNotes: plugin.installation.notes,
    usageMarkdown: plugin.usage.markdown,
    usageSummary: plugin.usage.summary,
  };
}

export function validateTranslations(
  value: unknown,
  source: TranslationPayload,
): Record<CatalogLocale, CatalogI18nEntry> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("model response must be a locale object");
  }
  const parsed = value as Record<string, unknown>;
  const result = {} as Record<CatalogLocale, CatalogI18nEntry>;
  const textFields = [
    "description",
    "installationMarkdown",
    "usageMarkdown",
    "usageSummary",
  ] as const;
  for (const locale of catalogLocales) {
    if (!(locale in parsed)) throw new Error(`model response is missing locale ${locale}`);
    const entry = catalogI18nEntrySchema.parse(parsed[locale]);
    for (const field of textFields) {
      if (source[field].trim() && !entry[field]?.trim()) {
        throw new Error(`model response is missing ${locale}.${field}`);
      }
    }
    if (source.installationNotes.length > 0) {
      if (entry.installationNotes?.length !== source.installationNotes.length
        || entry.installationNotes.some(note => !note.trim())) {
        throw new Error(`model response has invalid ${locale}.installationNotes`);
      }
    }
    result[locale] = entry;
  }
  return result;
}

export function asFullSnapshot(
  snapshot: CatalogSnapshot,
  plugins: CatalogPlugin[],
): CatalogSnapshot {
  const { changedRepositories: _changedRepositories, ...fullSnapshot } = snapshot;
  return { ...fullSnapshot, plugins };
}

async function translatePlugin(
  plugin: CatalogPlugin,
  apiUrl: string,
  apiKey: string,
  model: string,
): Promise<Record<CatalogLocale, CatalogI18nEntry>> {
  const payload = translationPayload(plugin);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "Translate DeepSeek Harness plugin catalog copy.",
            `Return a JSON object whose keys are exactly: ${catalogLocales.join(", ")}.`,
            "Each value must be an object with optional keys: description, usageSummary, usageMarkdown, installationMarkdown, installationNotes.",
            "Keep package names, CLI commands, URLs, code fences, and file paths unchanged.",
            "Do not invent features. Do not wrap the JSON in markdown.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            plugin: plugin.slug,
            source: payload,
            targets: catalogLocales,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    throw new Error(`${plugin.slug}: ${response.status} ${await response.text()}`);
  }
  const body = await response.json() as { choices?: ChatChoice[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${plugin.slug}: empty model response`);
  try {
    return validateTranslations(parseModelJson(content), payload);
  } catch (error) {
    throw new Error(`${plugin.slug}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
}

export async function main(): Promise<void> {
  const apiKey = requiredEnvironment("NEW_API_KEY");
  const apiUrl = requiredEnvironment("NEW_API_URL");
  const endpoint = new URL(apiUrl);
  if (endpoint.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(endpoint.hostname)) {
    throw new Error("NEW_API_URL must use HTTPS outside localhost.");
  }
  const model = process.env.NEW_API_MODEL ?? DEFAULT_MODEL;
  const root = repoRoot();
  const inputPath = resolve(root, argValue("--input", ".catalog/catalog.snapshot.json") ?? ".catalog/catalog.snapshot.json");
  const outputPath = resolve(root, argValue("--output", ".catalog/catalog.snapshot.json") ?? ".catalog/catalog.snapshot.json");
  const cachePath = resolve(root, argValue("--cache", ".catalog/i18n-cache.json") ?? ".catalog/i18n-cache.json");
  const concurrency = Number(argValue("--concurrency", String(DEFAULT_CONCURRENCY)));
  const limit = Number(argValue("--limit", "0"));
  const force = hasFlag("--force");

  if (!existsSync(inputPath)) {
    throw new Error(`Catalog snapshot not found: ${inputPath}`);
  }

  const snapshot = catalogSnapshotSchema.parse(readJson<CatalogSnapshot>(inputPath));
  const cache = existsSync(cachePath) ? readJson<CacheFile>(cachePath) : {};
  const plugins = limit > 0 ? snapshot.plugins.slice(0, limit) : snapshot.plugins;
  let translated = 0;
  let reused = 0;
  let failed = 0;

  await mapPool(plugins, Number.isFinite(concurrency) ? Math.max(1, concurrency) : DEFAULT_CONCURRENCY, async (plugin) => {
    const key = `${plugin.id}:${fingerprint(plugin, model)}`;
    if (!force && cache[key]) {
      try {
        plugin.i18n = validateTranslations(cache[key], translationPayload(plugin));
        reused += 1;
        return;
      } catch {
        delete cache[key];
      }
    }
    try {
      const i18n = await translatePlugin(plugin, apiUrl, apiKey, model);
      plugin.i18n = i18n;
      cache[key] = i18n;
      translated += 1;
      process.stdout.write(`translated ${plugin.slug}\n`);
    } catch (error) {
      failed += 1;
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    }
  });

  const next = asFullSnapshot(
    snapshot,
    snapshot.plugins.map(plugin => {
      const updated = plugins.find(item => item.id === plugin.id);
      return updated ?? plugin;
    }),
  );
  writeJson(outputPath, next);
  writeJson(cachePath, cache);
  process.stdout.write(
    `catalog i18n: ${translated} translated, ${reused} cached, ${failed} failed, wrote ${outputPath}\n`,
  );
  if (failed > 0) process.exitCode = 1;
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entrypoint) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

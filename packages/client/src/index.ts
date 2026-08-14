export const DEFAULT_DSHHUB_API_URL = "https://dshhub.org/api/v1";

export type CompatibilityStatus = "compatible" | "incompatible" | "unknown";
export type CompatibilityLevel = "unverified" | "declared" | "validated" | "tested";

export type PluginSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  packageName: string;
  repositoryUrl: string;
  stars: number;
  pushedAt: string | null;
  featured: boolean;
  categories: string[];
  compatibilityStatus: CompatibilityStatus;
  compatibilityLevel: CompatibilityLevel;
  installCommand: string | null;
};

export type PluginDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categories: string[];
  featured: boolean;
  repository: {
    owner: string;
    name: string;
    url: string;
    stars: number;
    pushedAt: string | null;
  };
  package: {
    name: string;
    version: string | null;
  };
  compatibility: {
    status: CompatibilityStatus;
    level: CompatibilityLevel;
    checks: Array<{ id: string; status: "pass" | "warn" | "fail" | "skip"; summary: string }>;
  };
  installation: {
    kind: "github" | "npm" | "manual" | "unavailable";
    command: string | null;
    markdown: string;
    notes: string[];
  };
  usage: {
    summary: string;
    markdown: string;
    readmeUrl: string;
  };
};

export type SearchPluginsInput = {
  query?: string;
  categories?: string[];
  compatibility?: CompatibilityStatus[];
  sort?: "featured" | "stars" | "updated" | "name";
  cursor?: string | null;
  limit?: number;
  locale?: "zh-CN" | "en" | "ja" | "ko" | "zh-TW";
};

export type SearchPluginsResult = {
  items: PluginSummary[];
  nextCursor: string | null;
  total: number;
};

export class DshHubApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "DshHubApiError";
  }
}

export type DshHubClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export class DshHubClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: DshHubClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_DSHHUB_API_URL).replace(/\/+$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  async search(input: SearchPluginsInput = {}): Promise<SearchPluginsResult> {
    const url = new URL(`${this.baseUrl}/plugins`);
    if (input.query) url.searchParams.set("query", input.query);
    for (const category of input.categories ?? []) url.searchParams.append("category", category);
    for (const status of input.compatibility ?? []) url.searchParams.append("compatibility", status);
    if (input.sort) url.searchParams.set("sort", input.sort);
    if (input.cursor) url.searchParams.set("cursor", input.cursor);
    if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));
    if (input.locale) url.searchParams.set("locale", input.locale);
    return this.request<SearchPluginsResult>(url);
  }

  async plugin(slug: string, locale?: SearchPluginsInput["locale"]): Promise<PluginDetail | null> {
    const segments = slug.split("/");
    if (segments.length !== 2 || segments.some(segment => !segment)) {
      throw new Error("Plugin slug must use owner/repository format");
    }
    const url = new URL(
      `${this.baseUrl}/plugins/${encodeURIComponent(segments[0])}/${encodeURIComponent(segments[1])}`,
    );
    if (locale) url.searchParams.set("locale", locale);
    try {
      return await this.request<PluginDetail>(url);
    } catch (error) {
      if (error instanceof DshHubApiError && error.status === 404) return null;
      throw error;
    }
  }

  private async request<T>(url: URL): Promise<T> {
    const response = await this.fetcher(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      let message = `dshhub API returned ${response.status}`;
      try {
        const body = await response.json() as { error?: unknown };
        if (typeof body.error === "string") message = body.error;
      } catch {
        // Keep the status-based message when the response is not JSON.
      }
      throw new DshHubApiError(message, response.status);
    }
    return await response.json() as T;
  }
}

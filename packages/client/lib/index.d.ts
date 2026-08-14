export declare const DEFAULT_DSHHUB_API_URL = "https://dshhub.org/api/v1";
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
        checks: Array<{
            id: string;
            status: "pass" | "warn" | "fail" | "skip";
            summary: string;
        }>;
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
export declare class DshHubApiError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
}
export type DshHubClientOptions = {
    baseUrl?: string;
    fetch?: typeof globalThis.fetch;
};
export declare class DshHubClient {
    private readonly baseUrl;
    private readonly fetcher;
    constructor(options?: DshHubClientOptions);
    search(input?: SearchPluginsInput): Promise<SearchPluginsResult>;
    plugin(slug: string, locale?: SearchPluginsInput["locale"]): Promise<PluginDetail | null>;
    private request;
}

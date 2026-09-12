import { detailShard, searchStaticCatalog } from './static.js';
export { detailShard, searchStaticCatalog } from './static.js';
export const DEFAULT_DSHHUB_API_URL = "https://dshhub.org/api/v1";
export class DshHubApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = "DshHubApiError";
    }
}
export class DshHubClient {
    baseUrl;
    fetcher;
    transport;
    manifest;
    index;
    expiresAt = 0;
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl ?? DEFAULT_DSHHUB_API_URL).replace(/\/+$/, "");
        this.fetcher = options.fetch ?? globalThis.fetch;
        this.transport = options.transport ?? (options.baseUrl && options.baseUrl !== DEFAULT_DSHHUB_API_URL ? "api" : "static");
    }
    async search(input = {}) {
        if (this.transport === "static") {
            return this.withCurrentCatalog(async (manifest) => {
                this.index ??= this.request(new URL(manifest.index, this.baseUrl)).catch(e => { this.index = undefined; throw e; });
                return searchStaticCatalog(await this.index, input);
            });
        }
        const url = new URL(`${this.baseUrl}/plugins`);
        if (input.query)
            url.searchParams.set("query", input.query);
        for (const category of input.categories ?? [])
            url.searchParams.append("category", category);
        for (const status of input.compatibility ?? [])
            url.searchParams.append("compatibility", status);
        if (input.sort)
            url.searchParams.set("sort", input.sort);
        if (input.cursor)
            url.searchParams.set("cursor", input.cursor);
        if (input.limit !== undefined)
            url.searchParams.set("limit", String(input.limit));
        if (input.locale)
            url.searchParams.set("locale", input.locale);
        return this.request(url);
    }
    async plugin(slug, locale) {
        const segments = slug.split("/");
        if (segments.length !== 2 || segments.some(segment => !segment)) {
            throw new Error("Plugin slug must use owner/repository format");
        }
        if (this.transport === "static") {
            return this.withCurrentCatalog(async (manifest) => {
                const plugins = await this.request(new URL(manifest.details[detailShard(slug)], this.baseUrl));
                return plugins.find(p => p.slug.toLowerCase() === slug.toLowerCase()) ?? null;
            });
        }
        const url = new URL(`${this.baseUrl}/plugins/${encodeURIComponent(segments[0])}/${encodeURIComponent(segments[1])}`);
        if (locale)
            url.searchParams.set("locale", locale);
        try {
            return await this.request(url);
        }
        catch (error) {
            if (error instanceof DshHubApiError && error.status === 404)
                return null;
            throw error;
        }
    }
    async withCurrentCatalog(read) {
        const manifest = await this.getManifest();
        try {
            return await read(manifest);
        }
        catch (error) {
            if (!(error instanceof DshHubApiError) || error.status !== 404)
                throw error;
            // A deployment replaces versioned assets; refresh a cached manifest once.
            this.expiresAt = 0;
            return read(await this.getManifest());
        }
    }
    getManifest() {
        if (Date.now() >= this.expiresAt) {
            this.manifest = undefined;
            this.index = undefined;
        }
        if (!this.manifest) {
            this.expiresAt = Date.now() + 5 * 60_000;
            this.manifest = this.request(new URL('/catalog/manifest.json', this.baseUrl))
                .catch(e => { this.manifest = undefined; throw e; });
        }
        return this.manifest;
    }
    async request(url) {
        const response = await this.fetcher(url, {
            headers: { Accept: "application/json" },
            cache: url.pathname.endsWith('/manifest.json') ? 'no-cache' : 'default',
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
            let message = `dshhub API returned ${response.status}`;
            try {
                const body = await response.json();
                if (typeof body.error === "string")
                    message = body.error;
            }
            catch {
                // Keep the status-based message when the response is not JSON.
            }
            throw new DshHubApiError(message, response.status);
        }
        return await response.json();
    }
}

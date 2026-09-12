import type { PluginSummary, SearchPluginsInput, SearchPluginsResult } from './index.js';
export type StaticEntry = PluginSummary & {
    searchText: string;
    descriptionZh?: string;
    searchTextZh?: string;
};
export type StaticIndex = {
    schemaVersion: 1;
    snapshotId: string;
    generatedAt: string;
    items: StaticEntry[];
    categories: Array<{
        id: string;
        count: number;
    }>;
};
export type StaticManifest = {
    schemaVersion: 1;
    snapshotId: string;
    index: string;
    details: string[];
    pluginCount: number;
    generatedAt: string;
};
export declare function detailShard(slug: string): number;
export declare function searchStaticCatalog(index: StaticIndex, input?: SearchPluginsInput): SearchPluginsResult;

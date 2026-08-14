import { type PluginDetail, type SearchPluginsInput, type SearchPluginsResult } from "@dshhubs/client";
type Io = {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
};
type Client = {
    search(input?: SearchPluginsInput): Promise<SearchPluginsResult>;
    plugin(slug: string, locale?: SearchPluginsInput["locale"]): Promise<PluginDetail | null>;
};
export declare function runCli(argv: string[], io: Io, providedClient?: Client): Promise<number>;
export {};

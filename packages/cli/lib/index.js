import { DEFAULT_DSHHUB_API_URL, DshHubClient, } from "@dshhubs/client";
const HELP = `Usage:
  dshhub search <query> [--category <id>] [--compatibility <status>] [--limit <n>] [--json]
  dshhub plugin <owner/repository> [--locale <locale>] [--json]

Options:
  --api-url <url>      Override the catalog API (default: ${DEFAULT_DSHHUB_API_URL})
  --json               Print stable JSON for agents
  --help               Show this help`;
function parseArgs(argv) {
    const parsed = { command: argv[0], positional: [], values: new Map(), flags: new Set() };
    const valueOptions = new Set(["api-url", "category", "compatibility", "limit", "locale", "sort"]);
    for (let index = 1; index < argv.length; index += 1) {
        const arg = argv[index];
        if (!arg.startsWith("--")) {
            parsed.positional.push(arg);
            continue;
        }
        const option = arg.slice(2);
        if (option === "json" || option === "help") {
            parsed.flags.add(option);
            continue;
        }
        if (!valueOptions.has(option))
            throw new Error(`Unknown option: ${arg}`);
        const value = argv[index + 1];
        if (value === undefined || value.startsWith("--"))
            throw new Error(`Missing value for ${arg}`);
        parsed.values.set(option, [...(parsed.values.get(option) ?? []), value]);
        index += 1;
    }
    return parsed;
}
function last(parsed, name) {
    return parsed.values.get(name)?.at(-1);
}
function textSearch(result) {
    if (result.items.length === 0)
        return "No plugins found.";
    return result.items.map(item => [
        `${item.name} (${item.slug})`,
        item.description,
        `Compatibility: ${item.compatibilityStatus}/${item.compatibilityLevel}`,
        item.installCommand ? `Install: ${item.installCommand}` : "Install: unavailable",
    ].join("\n")).join("\n\n");
}
function textPlugin(plugin) {
    return [
        `${plugin.name} (${plugin.slug})`,
        plugin.description,
        `Repository: ${plugin.repository.url}`,
        `Compatibility: ${plugin.compatibility.status}/${plugin.compatibility.level}`,
        plugin.installation.command ? `Install: ${plugin.installation.command}` : "Install: unavailable",
    ].join("\n");
}
export async function runCli(argv, io, providedClient) {
    try {
        if (argv.length === 0 || argv.includes("--help")) {
            io.stdout(HELP);
            return 0;
        }
        const parsed = parseArgs(argv);
        const client = providedClient ?? new DshHubClient({
            baseUrl: last(parsed, "api-url") ?? process.env.DSHHUB_API_URL,
        });
        if (parsed.command === "search") {
            const rawLimit = last(parsed, "limit");
            const limit = rawLimit === undefined ? undefined : Number(rawLimit);
            if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
                throw new Error("--limit must be an integer from 1 to 50");
            }
            const compatibility = (parsed.values.get("compatibility") ?? []);
            if (compatibility.some(value => !["compatible", "incompatible", "unknown"].includes(value))) {
                throw new Error("--compatibility must be compatible, incompatible, or unknown");
            }
            const sort = last(parsed, "sort");
            if (sort !== undefined && !["featured", "stars", "updated", "name"].includes(sort)) {
                throw new Error("--sort must be featured, stars, updated, or name");
            }
            const result = await client.search({
                query: parsed.positional.join(" "),
                categories: parsed.values.get("category"),
                compatibility,
                limit,
                sort,
                locale: last(parsed, "locale"),
            });
            io.stdout(parsed.flags.has("json") ? JSON.stringify(result) : textSearch(result));
            return result.items.length === 0 ? 2 : 0;
        }
        if (parsed.command === "plugin") {
            if (parsed.positional.length !== 1)
                throw new Error("plugin requires one owner/repository slug");
            const plugin = await client.plugin(parsed.positional[0], last(parsed, "locale"));
            if (plugin === null) {
                io.stderr("Plugin not found");
                return 2;
            }
            io.stdout(parsed.flags.has("json") ? JSON.stringify(plugin) : textPlugin(plugin));
            return 0;
        }
        throw new Error(`Unknown command: ${parsed.command}`);
    }
    catch (error) {
        io.stderr(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

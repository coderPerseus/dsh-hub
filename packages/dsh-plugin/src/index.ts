import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";
import {
  DshHubClient,
  type PluginDetail,
  type PluginSummary,
} from "@dshhub/client";

export const name = "dshhub-plugin-search";
export const inject = ["tools"];

const summaryProperties = {
  name: { type: "string", required: true },
  slug: { type: "string", required: true },
  description: { type: "string", required: true },
  categories: { type: "array", required: true, items: { type: "string" } },
  compatibilityStatus: {
    type: "string",
    required: true,
    enum: ["compatible", "incompatible", "unknown"],
  },
  compatibilityLevel: {
    type: "string",
    required: true,
    enum: ["unverified", "declared", "validated", "tested"],
  },
  repositoryUrl: { type: "string", required: true },
  installCommand: {
    required: true,
    oneOf: [{ type: "string" }, { type: "null" }],
  },
} as const;

function summary(plugin: PluginSummary) {
  return {
    name: plugin.name,
    slug: plugin.slug,
    description: plugin.description,
    categories: plugin.categories,
    compatibilityStatus: plugin.compatibilityStatus,
    compatibilityLevel: plugin.compatibilityLevel,
    repositoryUrl: plugin.repositoryUrl,
    installCommand: plugin.installCommand,
  };
}

function detail(plugin: PluginDetail) {
  return {
    name: plugin.name,
    slug: plugin.slug,
    description: plugin.description,
    categories: plugin.categories,
    compatibilityStatus: plugin.compatibility.status,
    compatibilityLevel: plugin.compatibility.level,
    repositoryUrl: plugin.repository.url,
    installCommand: plugin.installation.command,
    checks: plugin.compatibility.checks,
    usageSummary: plugin.usage.summary,
    readmeUrl: plugin.usage.readmeUrl,
  };
}

export function apply(ctx: Context): void {
  const client = new DshHubClient({ baseUrl: process.env.DSHHUB_API_URL });

  ctx.tools.register(defineTool({
    name: "search_dsh_plugins",
    description: "Find DeepSeek Harness plugins by capability. Use this before proposing or installing a plugin. Returns catalog evidence and installation commands; it does not install anything.",
    parameters: {
      query: {
        type: "string",
        required: true,
        description: "Capability or task in natural language, for example: cross-session memory or token cost display.",
      },
      categories: {
        type: "array",
        items: { type: "string" },
        description: "Optional catalog category IDs such as skills, memory, agents, interface, or development.",
      },
      compatibility: {
        type: "array",
        items: { type: "string", enum: ["compatible", "incompatible", "unknown"] },
        description: "Optional compatibility status filters.",
      },
      limit: {
        type: "integer",
        description: "Maximum results from 1 to 20. Default: 10.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          total: { type: "integer", required: true },
          items: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              properties: summaryProperties,
            },
          },
        },
      },
      render: (_args, value) => [{
        type: "text",
        text: value.items.length === 0
          ? "No matching DSH plugins found."
          : value.items.map(item => `${item.name} (${item.slug}): ${item.description}`).join("\n"),
      }],
    },
    async execute(args) {
      const limit = args.limit ?? 10;
      if (limit < 1 || limit > 20) throw new Error("limit must be from 1 to 20");
      const result = await client.search({
        query: args.query,
        categories: args.categories,
        compatibility: args.compatibility,
        limit,
      });
      return { total: result.total, items: result.items.map(summary) };
    },
  }));

  ctx.tools.register(defineTool({
    name: "get_dsh_plugin",
    description: "Inspect one dshhub catalog result by its owner/repository slug. Returns compatibility checks, usage, repository, and installation command; it does not install anything.",
    parameters: {
      slug: {
        type: "string",
        required: true,
        description: "Exact owner/repository slug returned by search_dsh_plugins.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ...summaryProperties,
          checks: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string", required: true },
                status: { type: "string", required: true, enum: ["pass", "warn", "fail", "skip"] },
                summary: { type: "string", required: true },
              },
            },
          },
          usageSummary: { type: "string", required: true },
          readmeUrl: { type: "string", required: true },
        },
      },
      render: (_args, value) => [{
        type: "text",
        text: [
          `${value.name} (${value.slug})`,
          value.description,
          `Compatibility: ${value.compatibilityStatus}/${value.compatibilityLevel}`,
          value.installCommand ? `Install: ${value.installCommand}` : "Install: unavailable",
        ].join("\n"),
      }],
    },
    async execute(args) {
      const plugin = await client.plugin(args.slug);
      if (plugin === null) throw new Error(`Plugin not found: ${args.slug}`);
      return detail(plugin);
    },
  }));
}

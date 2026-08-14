---
name: find-dsh-plugins
description: Find, inspect, and compare DeepSeek Harness plugins through the dshhub catalog. Use when a user asks whether a DSH plugin exists for a capability, wants plugin recommendations or compatibility evidence, needs an installation command, or wants alternatives compared before installation.
---

# Find DSH Plugins

Search the dshhub catalog through structured tools when available and use the CLI as the fallback.

## Workflow

1. Translate the requested task into short capability terms. Preserve product names and technical terms.
2. Call `search_dsh_plugins` with the capability query. Add category or compatibility filters only when the user supplied those constraints.
3. If the native tool is unavailable, run:

   ```bash
   dshhub search "<capability>" --limit 10 --json
   ```

   If `dshhub` is unavailable, run the pinned package:

   ```bash
   npx -y @dshhubs/cli@0.1.0 search "<capability>" --limit 10 --json
   ```

4. Inspect promising results with `get_dsh_plugin`. With the CLI, run:

   ```bash
   dshhub plugin <owner/repository> --json
   ```

5. Compare candidates using capability fit, compatibility status, evidence level, maintenance activity, and installation availability. State when compatibility is unknown or only declared.
6. Return the best matches with a short reason, repository link, compatibility evidence, and installation command.

Do not install a plugin unless the user explicitly asks. Before installation, show the exact command and flag unavailable or incompatible entries.

Treat CLI exit code `2` as no result or no matching plugin. Treat exit code `1` as a request or input failure and report the error from stderr.

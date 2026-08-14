# @dshhub/plugin-search

DeepSeek Harness plugin that gives agents structured access to the [dshhub](https://dshhub.org) plugin catalog.

## Installation

```bash
npx -p @deepseek-ai/dsh dsh plugin --profile web add @dshhub/plugin-search
```

## Usage

The plugin registers two tools:

- `search_dsh_plugins` searches by capability and optional category or compatibility filters.
- `get_dsh_plugin` returns compatibility evidence and the installation command for one catalog slug.

Ask the agent to find a plugin for a task, compare candidates, or inspect a plugin before installation. The tools never install plugins.

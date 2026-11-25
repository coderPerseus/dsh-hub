# @dshhubs/plugin-search

DeepSeek Harness plugin that gives agents structured access to the [dshhub](https://dshhub.org) plugin catalog.

## Installation

Copy the install command from the [official DSH Hub plugin card](https://dshhub.org/en/plugins/coderPerseus/dsh-hub--packages-dsh-plugin/). The static site build publishes an installable package with the shard-compatible client bundled. The older npm release is not suitable for the current catalog.

## Usage

The plugin registers two tools:

- `search_dsh_plugins` searches by capability and optional category or compatibility filters.
- `get_dsh_plugin` returns compatibility evidence and the installation command for one catalog slug.

Ask the agent to find a plugin for a task, compare candidates, or inspect a plugin before installation. The tools never install plugins.

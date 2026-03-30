## Why

The current CLI is built on `cmd-ts`, which requires verbose boilerplate for command definitions and offers no interactive experience. Users must already know the exact subcommand name to invoke it. Switching to `citty` (UnJS ecosystem) reduces definition boilerplate, and adding `@inquirer/search`-powered interactive autocomplete lets users discover and select commands in real-time when they don't specify a subcommand.

## What Changes

- **BREAKING**: Replace `cmd-ts` with `citty` as the CLI framework. All command definitions will use citty's API instead of cmd-ts's `command()` / `subcommands()`.
- Add `@inquirer/search` as a dependency for interactive command selection.
- When `toolboxia` is invoked with no subcommand, launch an interactive autocomplete prompt that lists all available commands with descriptions, filtered as the user types.
- Direct subcommand invocation (`toolboxia merge-all-md-file --root ./docs`) continues to work as before — the interactive mode is only the fallback when no subcommand is given.
- Remove `cmd-ts` and its associated boilerplate (`Type<>` helpers, manual `binary()` wrapping).
- Rewrite all existing script command definitions (`merge-all-md-file`, `tree-to-yaml`, `collect-env-files`, `remove_node_modules`) to use citty's `defineCommand` API.
- Remove the manual `scriptRegistry` and `listScriptFiles()` — command metadata will live in each command's citty definition.

## Capabilities

### New Capabilities

- `interactive-command-picker`: When no subcommand is provided, display an interactive autocomplete prompt (powered by `@inquirer/search`) that lets users search and select from all registered commands in real-time.
- `citty-cli-framework`: Define the CLI entry point and all subcommands using citty's `defineCommand` / `runMain` API, replacing the cmd-ts framework entirely.

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Dependencies**: Remove `cmd-ts`. Add `citty` and `@inquirer/search`.
- **All script files**: Every `src/scripts/*.ts` file must be rewritten to export citty-style command definitions instead of cmd-ts `command()` objects.
- **Entry point**: `src/index.ts` will be restructured around citty's subcommand routing and the new interactive fallback.
- **Runtime**: Bun remains the runtime. No changes to build or publish pipeline.
- **User-facing**: Direct invocation CLI interface is preserved (same flags and arguments). The only new behavior is the interactive picker when no subcommand is given.

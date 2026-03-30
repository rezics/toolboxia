## Why

Toolboxia currently has no user-level configuration directory, and the `prompt` script is empty. Users need a way to store custom prompts alongside the built-in ones, and the CLI needs a cross-platform config directory (`%APPDATA%/toolboxia`, `~/.config/toolboxia`, `~/Library/Application Support/toolboxia`) to support this and future plugin-style extensions.

## What Changes

- Add `env-paths` dependency to resolve the cross-platform config directory (`paths.config`)
- Create `src/config/` module that exposes the resolved config path with lazy `ensureDir` (directory created only when first accessed)
- Implement `src/scripts/prompt/prompt.ts` — a new CLI subcommand that:
  - Scans built-in prompts from the bundled `prompt/` directory
  - Scans user prompts from `<config>/plugins/prompt/prompt/`
  - Extracts metadata via YAML frontmatter → `# Title` heading → filename fallback
  - Presents all prompts in an interactive `@inquirer/search` picker (user prompts listed first, with source labels)
  - Outputs the selected prompt content
- Add YAML frontmatter to `generate-git-commit-message.md`
- Register the `prompt` command in `src/index.ts`

## Capabilities

### New Capabilities

- `config-dir`: Cross-platform configuration directory resolution using `env-paths`, with lazy `ensureDir` on first access
- `prompt-script`: Interactive prompt picker that merges built-in and user prompts, with `@inquirer/search` autocomplete and source labeling

### Modified Capabilities

_(none)_

## Impact

- **Dependencies**: adds `env-paths` (small, well-maintained package)
- **Files**: new `src/config/` module, completed `src/scripts/prompt/prompt.ts`, updated `src/index.ts`, updated `generate-git-commit-message.md`
- **User-facing**: new `toolboxia prompt` subcommand; config directory created lazily on first use

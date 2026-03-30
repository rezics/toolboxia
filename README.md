# Toolboxia

A CLI script toolbox with an interactive command picker, built on [citty](https://github.com/unjs/citty).

Run it without arguments to get a searchable command menu, or invoke any command directly.

## Installation

```bash
# npm
npm install -g toolboxia

# pnpm
pnpm add -g toolboxia

# bun
bun add -g toolboxia
```

Or run without installing via `npx`:

```bash
npx toolboxia
```

## Usage

**Interactive mode** — pick a command from a searchable list:

```bash
toolboxia
```

**Direct mode** — run a specific command:

```bash
toolboxia merge-all-md-file
toolboxia tree-to-yaml
```

## Commands

| Command | Description |
|---|---|
| `merge-all-md-file` | Recursively merge Markdown files into a single output (with TOC, heading demotion, custom sorting) |
| `tree-to-yaml` | Generate a YAML file tree from git-tracked files |
| `collect-env-files` | Collect `.env` files from a project, preserving directory structure |
| `remove-node-modules` | Recursively delete all `node_modules` directories |

## Development

```bash
# Install dependencies
bun install

# Run in dev mode
bun run dev

# Type-check
bun run typecheck

# Build
bun run build

# Link as global command for testing
bun link
```

## License

GUN AGPL v3

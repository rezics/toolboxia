## Context

Toolboxia is a TypeScript CLI tool (`citty` framework, ES modules, built with Bun/Node). It currently has no user-level configuration or data directory. The `src/config/` directory and `src/scripts/prompt/prompt.ts` are empty scaffolds. The project already uses `@inquirer/search` for interactive command picking in `src/index.ts`, and `yaml` for YAML parsing.

Built-in prompt templates live in `src/scripts/prompt/prompt/*.md`. Users need a way to add their own prompts in a platform-appropriate config directory.

## Goals / Non-Goals

**Goals:**
- Establish a cross-platform config directory convention using `env-paths`
- Provide a reusable `ensureDir` utility with lazy creation semantics
- Complete the prompt script with interactive search matching the existing CLI UX
- Merge prompts from two sources (built-in + user) with clear source labeling

**Non-Goals:**
- General plugin system beyond prompt directories
- Prompt templating / variable interpolation
- Config file (YAML/JSON) management — only directory resolution for now
- Syncing or conflict resolution between user and built-in prompts

## Decisions

### 1. Config directory resolution: `env-paths`

Use `env-paths` package with app name `"toolboxia"`. Access `paths.config` for the config root.

| Platform | Result |
|----------|--------|
| Windows | `%APPDATA%/toolboxia-nodejs/toolboxia` |
| macOS | `~/Library/Preferences/toolboxia` |
| Linux | `$XDG_CONFIG_HOME/toolboxia` or `~/.config/toolboxia` |

**Alternative considered**: Manual `process.platform` switch — rejected because `env-paths` handles edge cases (portable mode, XDG fallbacks) and is a tiny, well-maintained dependency (~2KB).

### 2. Module structure: `src/config/index.ts`

Export:
- `configDir: string` — resolved config root path (computed once via `env-paths`)
- `ensureDir(path: string): Promise<void>` — `mkdir -p` wrapper, called lazily

No eager initialization. The config directory is only created on disk when a script actually needs to write or read from it.

### 3. Prompt metadata extraction: waterfall strategy

```
YAML frontmatter  →  # Heading  →  filename (kebab-case humanized)
```

Parse order:
1. Check for `---` delimited YAML frontmatter at file start. Extract `description` field.
2. If no frontmatter, find first `# ...` heading and use its text as description.
3. Fallback: derive from filename — strip `.md`, replace `-` with spaces.

The `name` is always the filename without `.md` extension.

### 4. Prompt source merging: both listed, user first

All prompts from both sources are shown. Each item is tagged with its source (`[built-in]` / `[user]`). User prompts appear first in the list. No deduplication — if a user has a prompt with the same filename as a built-in, both appear (user's on top).

### 5. Interactive picker: reuse `@inquirer/search` pattern

Mirror the existing `interactivePicker()` in `src/index.ts`. Search filters by prompt name and description. Selection outputs the full prompt content to stdout.

### 6. Built-in prompt path resolution

Use `import.meta.dirname` (or `import.meta.url` + `fileURLToPath`) to resolve the built-in `prompt/` directory relative to the script file. This works correctly in both dev (Bun) and build (Node + dist/) environments.

## Risks / Trade-offs

- **`env-paths` suffix behavior**: `env-paths` appends `-nodejs` on some platforms by default. We should pass `{suffix: ''}` to get clean `toolboxia` paths. → Mitigation: set `suffix: ''` in the `envPaths()` call.
- **Empty user directory**: First-time users won't have any user prompts. → Mitigation: gracefully handle missing directory (return empty array, don't error). Only `ensureDir` when the user explicitly creates content.
- **`import.meta.dirname` compatibility**: Available in Node 21.2+ and Bun. The project targets ES2022/NodeNext. → Mitigation: fallback to `fileURLToPath(import.meta.url)` + `path.dirname()` if needed, but the project already uses `import.meta.main` so this should be safe.

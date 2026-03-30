## 1. Dependencies & Config Module

- [ ] 1.1 Install `env-paths` package (`bun add env-paths`)
- [ ] 1.2 Create `src/config/index.ts` — export `configDir` (via `envPaths('toolboxia', {suffix: ''}).config`) and `ensureDir(path)` utility (async `mkdir -p` wrapper)

## 2. Prompt Metadata & Built-in Prompts

- [ ] 2.1 Add YAML frontmatter (`description` field) to `src/scripts/prompt/prompt/generate-git-commit-message.md`
- [ ] 2.2 Implement metadata extraction function: parse YAML frontmatter → fallback to `# heading` → fallback to filename

## 3. Prompt Script Implementation

- [ ] 3.1 Implement `scanPrompts(dir: string, source: 'builtin' | 'user')` — scan a directory for `.md` files, extract metadata, return prompt entries
- [ ] 3.2 Implement prompt merging — combine user prompts (from `<configDir>/plugins/prompt/prompt/`) and built-in prompts, user first
- [ ] 3.3 Implement `@inquirer/search` interactive picker — display `name`, `description`, and source label; filter by name and description
- [ ] 3.4 Output selected prompt content to stdout (strip YAML frontmatter before output)
- [ ] 3.5 Wire up as citty `defineCommand` with `main()` export (follow existing script pattern)

## 4. CLI Registration

- [ ] 4.1 Register `prompt` command in `src/index.ts` — import and add to `commands` record

## 5. Verification

- [ ] 5.1 Run `bun run typecheck` to verify no type errors
- [ ] 5.2 Run `bun run build` to verify successful compilation
- [ ] 5.3 Test `bun run cli prompt` — verify interactive picker launches with built-in prompts

## Context

Toolboxia is a Bun-based CLI toolbox currently built on `cmd-ts`. It has 4 scripts in `src/scripts/`, of which only 2 are wired into the CLI entry point. Commands are defined using cmd-ts's `command()` API with custom `Type<>` helpers for flags and arguments. The entry point (`src/index.ts`) manually imports each command and registers it via `subcommands()`.

The CLI has no interactive capabilities — users must know the exact subcommand name. There is a manual `scriptRegistry` array and a `listScriptFiles()` function that are redundant with the actual command definitions.

## Goals / Non-Goals

**Goals:**
- Replace `cmd-ts` with `citty` for all command definitions and CLI routing
- Add an interactive autocomplete command picker (via `@inquirer/search`) when no subcommand is provided
- Preserve direct subcommand invocation for scriptability and non-interactive use
- Wire up all 4 existing scripts as citty subcommands
- Eliminate redundant metadata (scriptRegistry, listScriptFiles)

**Non-Goals:**
- Fuzzy matching or advanced search algorithms — simple substring filtering is sufficient
- Auto-discovery of script files at runtime — commands are still explicitly registered
- Shell-level tab completion (bash/zsh/fish completion scripts)
- Changing the behavior or arguments of any existing script
- Changing the build pipeline or runtime (stays Bun)

## Decisions

### 1. CLI framework: citty

**Choice**: Use `citty` from the UnJS ecosystem.

**Rationale**: citty provides a minimal, TypeScript-first API (`defineCommand`) with built-in subcommand support. It reduces boilerplate significantly compared to cmd-ts — no custom `Type<>` helpers needed, no `binary()` wrapping. It aligns with modern TS/Bun patterns.

**Alternatives considered**:
- **Keep cmd-ts**: Works but verbose. No ecosystem momentum. The `Type<>` boilerplate for simple flags is unnecessary friction.
- **commander / yargs**: Heavier, older API style. Not TypeScript-first.
- **cleye**: Lighter than citty but less mature subcommand support.

### 2. Interactive prompt: @inquirer/search

**Choice**: Use `@inquirer/search` from the `@inquirer/prompts` family.

**Rationale**: Purpose-built for type-to-filter selection. Actively maintained, TypeScript-first, confirmed working with Bun (since v1.0.36). 20M+ weekly downloads.

**Alternatives considered**:
- **@clack/prompts**: Beautiful UI but has unresolved Bun stdin bugs. No freeform search prompt.
- **prompts (terkelg)**: Has autocomplete type but abandoned since 2021.
- **ink + custom**: Maximum flexibility but excessive complexity for a single autocomplete prompt.

### 3. Interactive mode trigger: no-subcommand fallback

**Choice**: When `toolboxia` is invoked with no arguments (or with an unrecognized subcommand), launch the interactive picker. Direct subcommand invocation works as before.

**Rationale**: This preserves scriptability (CI, aliases, pipes) while adding discoverability. Users who know what they want lose nothing; users who don't get guided.

**Flow**:
```
toolboxia <args>
    │
    ├─ has valid subcommand? ──▶ citty routes to subcommand handler
    │
    └─ no subcommand? ──▶ @inquirer/search prompt
                              │
                              ├─ user selects command ──▶ run selected command
                              └─ user cancels (Ctrl+C) ──▶ exit cleanly
```

### 4. Command definition pattern

Each script exports a citty `defineCommand()` object. The main entry point collects them into a parent command with `subCommands`. Command metadata (name, description) lives in the `defineCommand()` call itself — no separate registry.

```
src/
├── index.ts              ← main command with subCommands + interactive fallback
└── scripts/
    ├── merge-all-md-file.ts   ← export default defineCommand({ ... })
    ├── tree-to-yaml.ts
    ├── collect-env-files.ts
    └── remove-node-modules.ts
```

### 5. Handling the interactive-to-execution bridge

After the user selects a command from the interactive picker, the CLI needs to execute that command. Two approaches:

**Choice**: Import and invoke the selected command's `run()` handler directly (in-process).

**Rationale**: Avoids spawning a child process. Keeps it simple — the command objects are already imported. If the selected command needs additional arguments, it can prompt for them or show its own help.

## Risks / Trade-offs

- **[Risk] citty API surface is smaller than cmd-ts** → Some advanced cmd-ts features (custom types, complex validation) need manual reimplementation. Mitigation: the existing commands use simple types (string, number, boolean) — no complex custom types beyond the `SortBy` enum, which is trivially handled with citty's `options.type` or manual validation.

- **[Risk] @inquirer/search stdin handling with Bun edge cases** → While confirmed working post-Bun v1.0.36, terminal raw mode edge cases could surface. Mitigation: the interactive mode is a fallback — if it fails, direct invocation always works. Add a `--no-interactive` flag as an escape hatch.

- **[Trade-off] No argument prompting in interactive mode** → When a user selects a command via the picker, they don't get prompted for required arguments. They'll see the command's help/error. This keeps complexity bounded. Future enhancement could add argument prompting per-command.

- **[Trade-off] Explicit command registration over auto-discovery** → Commands must be imported in index.ts. This is intentional — it keeps the dependency graph clear and avoids dynamic import complexity. The cost is a one-line import per new command.

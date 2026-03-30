## 1. Dependencies

- [ ] 1.1 Install `citty` and `@inquirer/search` as dependencies
- [ ] 1.2 Remove `cmd-ts` from dependencies
- [ ] 1.3 Verify `bun install` succeeds and lockfile updates cleanly

## 2. Migrate script commands to citty

- [ ] 2.1 Rewrite `src/scripts/merge-all-md-file.ts` to export a citty `defineCommand()` — preserve all 9 arguments (root, out, ext, ignore, sort, header, separator, demote, toc) with identical names, types, and defaults
- [ ] 2.2 Rewrite `src/scripts/tree-to-yaml.ts` to export a citty `defineCommand()`
- [ ] 2.3 Wrap `src/scripts/collect-env-files.ts` in a citty `defineCommand()` with a `target` argument (currently reads `process.argv[2]`, default cwd)
- [ ] 2.4 Wrap `src/scripts/remove_node_modules.ts` in a citty `defineCommand()` with a `target` argument (currently reads `process.argv[2]`, default cwd); rename file to `remove-node-modules.ts` for consistency

## 3. Rewrite CLI entry point

- [ ] 3.1 Rewrite `src/index.ts` to use citty `defineCommand` with `subCommands` registering all 4 script commands
- [ ] 3.2 Remove all cmd-ts imports, `scriptRegistry`, `listScriptFiles()`, `createListCommand()`, `createHelpCommand()`, and custom `Type<>` helpers
- [ ] 3.3 Verify `toolboxia --help` displays all subcommands with descriptions via citty's built-in help

## 4. Interactive command picker

- [ ] 4.1 Implement the interactive fallback in `src/index.ts`: when no subcommand is provided, invoke `@inquirer/search` with the list of registered commands (name + description)
- [ ] 4.2 Filter commands by substring match (case-insensitive) on name and description as the user types
- [ ] 4.3 On selection, execute the chosen command's handler in-process
- [ ] 4.4 Handle Ctrl+C gracefully — exit with code 0, no stack trace

## 5. Cleanup and verification

- [ ] 5.1 Confirm no `cmd-ts` imports remain in any source file
- [ ] 5.2 Run `bun run typecheck` and fix any type errors
- [ ] 5.3 Test direct invocation: `toolboxia merge-all-md-file --help` shows correct flags
- [ ] 5.4 Test interactive mode: `toolboxia` (no args) launches the picker and commands are selectable

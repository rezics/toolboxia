## ADDED Requirements

### Requirement: CLI entry point uses citty
The CLI entry point (`src/index.ts`) SHALL use citty's `defineCommand` and subcommand routing to define the top-level `toolboxia` command with all subcommands registered.

#### Scenario: CLI starts with citty
- **WHEN** the CLI is invoked
- **THEN** citty SHALL handle argument parsing and subcommand routing

#### Scenario: Help flag
- **WHEN** the user runs `toolboxia --help`
- **THEN** citty SHALL display the top-level help listing all available subcommands with descriptions

### Requirement: All scripts defined as citty commands
Each script in `src/scripts/` SHALL export a citty `defineCommand()` object that defines its name, description, arguments, and handler.

#### Scenario: merge-all-md-file command definition
- **WHEN** the `merge-all-md-file` command is defined
- **THEN** it SHALL accept all existing arguments (root, out, ext, ignore, sort, header, separator, demote, toc) with the same defaults and behavior as the current cmd-ts definition

#### Scenario: tree-to-yaml command definition
- **WHEN** the `tree-to-yaml` command is defined
- **THEN** it SHALL maintain its current behavior of generating a `tree.yaml` from the git file tree

#### Scenario: Previously unwired scripts
- **WHEN** the CLI is built
- **THEN** `collect-env-files` and `remove-node-modules` (renamed to `remove_node_modules` or kebab-cased) SHALL be registered as citty subcommands

### Requirement: cmd-ts dependency removed
The project SHALL NOT depend on `cmd-ts` after the migration. All cmd-ts imports and associated boilerplate (`Type<>` helpers, `binary()`, `run()` from cmd-ts) SHALL be removed.

#### Scenario: No cmd-ts references remain
- **WHEN** the migration is complete
- **THEN** no source file SHALL import from `cmd-ts`
- **THEN** `package.json` SHALL NOT list `cmd-ts` in dependencies

### Requirement: Existing CLI arguments preserved
All existing command-line arguments and flags for migrated commands SHALL maintain identical names, types, defaults, and behavior.

#### Scenario: merge-all-md-file flag compatibility
- **WHEN** a user runs `toolboxia merge-all-md-file --root ./docs --out merged.md --toc`
- **THEN** the behavior SHALL be identical to the current cmd-ts implementation

## ADDED Requirements

### Requirement: Scan built-in prompts
The system SHALL scan the `prompt/` directory relative to the prompt script for `.md` files and return them as prompt entries.

#### Scenario: Built-in directory contains markdown files
- **WHEN** the built-in `prompt/` directory contains `generate-git-commit-message.md`
- **THEN** the scanner SHALL return an entry with name `generate-git-commit-message` and source `builtin`

#### Scenario: Built-in directory is empty
- **WHEN** the built-in `prompt/` directory contains no `.md` files
- **THEN** the scanner SHALL return an empty array

### Requirement: Scan user prompts
The system SHALL scan `<configDir>/plugins/prompt/prompt/` for `.md` files and return them as prompt entries with source `user`.

#### Scenario: User prompt directory exists with files
- **WHEN** the user config directory contains `plugins/prompt/prompt/my-custom.md`
- **THEN** the scanner SHALL return an entry with name `my-custom` and source `user`

#### Scenario: User prompt directory does not exist
- **WHEN** the path `<configDir>/plugins/prompt/prompt/` does not exist on disk
- **THEN** the scanner SHALL return an empty array without throwing an error

### Requirement: Metadata extraction with waterfall strategy
The system SHALL extract prompt metadata using a three-tier fallback: YAML frontmatter → first heading → filename.

#### Scenario: Prompt with YAML frontmatter
- **WHEN** a `.md` file starts with `---` delimited YAML containing a `description` field
- **THEN** the system SHALL use the `description` value as the prompt's description

#### Scenario: Prompt with heading but no frontmatter
- **WHEN** a `.md` file has no YAML frontmatter but contains a first-level heading `# Some Title`
- **THEN** the system SHALL use `Some Title` as the prompt's description

#### Scenario: Prompt with neither frontmatter nor heading
- **WHEN** a `.md` file has no YAML frontmatter and no `#` heading
- **THEN** the system SHALL derive the description from the filename by stripping `.md` and replacing `-` with spaces

### Requirement: Merge and order prompts from both sources
The system SHALL merge prompts from both sources into a single list, with user prompts listed before built-in prompts. Both sources SHALL be shown even if names collide.

#### Scenario: User and built-in prompts with same name
- **WHEN** both sources contain a prompt named `generate-git-commit-message`
- **THEN** the merged list SHALL contain both entries, with the user entry appearing first

#### Scenario: Mixed sources ordering
- **WHEN** user source has prompts [A, B] and built-in source has prompts [C, D]
- **THEN** the merged list order SHALL be [A, B, C, D]

### Requirement: Interactive prompt picker with search
The system SHALL present all merged prompts in an `@inquirer/search` interactive picker. Each item MUST display the prompt name, description, and source label (`[user]` or `[built-in]`). The picker MUST filter by both name and description as the user types.

#### Scenario: User types a search term
- **WHEN** the user types `git` in the search prompt
- **THEN** only prompts whose name or description contains `git` (case-insensitive) SHALL be shown

#### Scenario: User selects a prompt
- **WHEN** the user selects a prompt from the picker
- **THEN** the system SHALL output the full markdown content of that prompt to stdout (excluding YAML frontmatter)

### Requirement: Register as CLI subcommand
The `prompt` command SHALL be registered in `src/index.ts` as a subcommand, appearing in the main interactive picker alongside other commands.

#### Scenario: Running via subcommand
- **WHEN** the user runs `toolboxia prompt`
- **THEN** the interactive prompt picker SHALL launch

#### Scenario: Visible in main picker
- **WHEN** the user runs `toolboxia` without arguments
- **THEN** `prompt` SHALL appear as a selectable command in the interactive picker

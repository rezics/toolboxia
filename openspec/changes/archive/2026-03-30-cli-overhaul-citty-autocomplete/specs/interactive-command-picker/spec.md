## ADDED Requirements

### Requirement: Interactive command picker activates when no subcommand is provided
The CLI SHALL launch an interactive autocomplete prompt when invoked with no subcommand arguments. The prompt MUST use `@inquirer/search` to display all available commands, filtered in real-time as the user types.

#### Scenario: No arguments provided
- **WHEN** the user runs `toolboxia` with no arguments
- **THEN** the CLI SHALL display an interactive search prompt listing all registered commands with their descriptions

#### Scenario: User types partial input
- **WHEN** the interactive prompt is active and the user types `co`
- **THEN** only commands whose name or description contains `co` (case-insensitive) SHALL be displayed

#### Scenario: User types input with no matches
- **WHEN** the interactive prompt is active and the user types a string that matches no commands
- **THEN** the prompt SHALL display an empty list (no suggestions)

### Requirement: Command selection executes the chosen command
When the user selects a command from the interactive picker, the CLI SHALL execute that command's handler in-process.

#### Scenario: User selects a command
- **WHEN** the user highlights a command in the interactive list and presses Enter
- **THEN** the CLI SHALL invoke that command's handler directly

#### Scenario: User cancels the prompt
- **WHEN** the user presses Ctrl+C during the interactive prompt
- **THEN** the CLI SHALL exit cleanly with exit code 0

### Requirement: Direct subcommand invocation bypasses interactive mode
When a valid subcommand is provided as an argument, the CLI SHALL route directly to that command without showing the interactive prompt.

#### Scenario: Valid subcommand provided
- **WHEN** the user runs `toolboxia merge-all-md-file --root ./docs`
- **THEN** the CLI SHALL execute the `merge-all-md-file` command directly without showing the interactive picker

### Requirement: Command list displays name and description
Each entry in the interactive picker MUST show the command name and its description to help users identify the right command.

#### Scenario: Command entries in the picker
- **WHEN** the interactive prompt is displayed
- **THEN** each command entry SHALL display in the format `<command-name> — <description>`

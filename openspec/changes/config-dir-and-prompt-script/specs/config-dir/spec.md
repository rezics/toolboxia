## ADDED Requirements

### Requirement: Cross-platform config directory resolution
The system SHALL resolve a configuration directory path using `env-paths` with app name `"toolboxia"` and `suffix: ''`, returning the `config` path for the current platform.

#### Scenario: Windows config path
- **WHEN** running on Windows with `%APPDATA%` set to `C:\Users\alice\AppData\Roaming`
- **THEN** the config directory SHALL resolve to `C:\Users\alice\AppData\Roaming\toolboxia`

#### Scenario: Linux config path with XDG
- **WHEN** running on Linux with `$XDG_CONFIG_HOME` set to `/home/alice/.config`
- **THEN** the config directory SHALL resolve to `/home/alice/.config/toolboxia`

#### Scenario: Linux config path without XDG
- **WHEN** running on Linux without `$XDG_CONFIG_HOME` set
- **THEN** the config directory SHALL resolve to `~/.config/toolboxia`

#### Scenario: macOS config path
- **WHEN** running on macOS
- **THEN** the config directory SHALL resolve to `~/Library/Preferences/toolboxia`

### Requirement: Lazy directory creation
The system SHALL NOT create the config directory on disk at import time. The directory MUST only be created when explicitly requested via `ensureDir`.

#### Scenario: Import without side effects
- **WHEN** `src/config/index.ts` is imported
- **THEN** no filesystem write operations SHALL occur

#### Scenario: ensureDir creates directory recursively
- **WHEN** `ensureDir(path)` is called with a path that does not exist
- **THEN** the directory and all parent directories SHALL be created (equivalent to `mkdir -p`)

#### Scenario: ensureDir on existing directory
- **WHEN** `ensureDir(path)` is called with a path that already exists
- **THEN** no error SHALL be thrown and the function SHALL return normally

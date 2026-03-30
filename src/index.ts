#!/usr/bin/env node

import {defineCommand, runMain, runCommand, type CommandDef} from 'citty';
import search from '@inquirer/search';
import mergeAllMdFile from './scripts/merge-all-md-file.ts';
import treeToYaml from './scripts/tree-to-yaml.ts';
import collectEnvFiles from './scripts/collect-env-files.ts';
import removeNodeModules from './scripts/remove-node-modules.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const commands: Record<string, CommandDef<any>> = {
  'merge-all-md-file': mergeAllMdFile,
  'tree-to-yaml': treeToYaml,
  'collect-env-files': collectEnvFiles,
  'remove-node-modules': removeNodeModules,
};

const commandEntries = Object.entries(commands).map(([name, cmd]) => ({
  name,
  description: (typeof cmd.meta === 'object' && cmd.meta && 'description' in cmd.meta ? (cmd.meta as {description: string}).description : ''),
}));

async function interactivePicker(): Promise<void> {
  try {
    const selected = await search<string>({
      message: 'Select a command',
      source: (input) => {
        const term = (input ?? '').toLowerCase();
        return commandEntries
          .filter(
            entry =>
              entry.name.toLowerCase().includes(term) ||
              entry.description.toLowerCase().includes(term),
          )
          .map(entry => ({
            name: `${entry.name} — ${entry.description}`,
            value: entry.name,
          }));
      },
    });

    await runCommand(commands[selected]!, {rawArgs: []});
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('User force closed') ||
        error.message.includes('ExitPromptError'))
    ) {
      process.exit(0);
    }
    throw error;
  }
}

const main = defineCommand({
  meta: {
    name: 'toolboxia',
    version: '0.1.0',
    description: '脚本工具集合',
  },
  subCommands: commands,
  run() {
    return interactivePicker();
  },
});

if (import.meta.main) {
  runMain(main);
}

export {main};

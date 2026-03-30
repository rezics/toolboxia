#!/usr/bin/env node

import {readdirSync, rmSync, lstatSync} from 'fs';
import {join} from 'path';
import {defineCommand, runMain} from 'citty';

function removeNodeModules(dir: string): number {
  let deletedCount = 0;
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const stats = lstatSync(fullPath);

      if (stats.isDirectory()) {
        if (file === 'node_modules') {
          console.log(`Deleting: ${fullPath}`);
          rmSync(fullPath, {recursive: true, force: true});
          deletedCount++;
        } else {
          deletedCount += removeNodeModules(fullPath);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error accessing directory ${dir}: ${error.message}`);
    }
  }
  return deletedCount;
}

const removeNodeModulesCommand = defineCommand({
  meta: {
    name: 'remove-node-modules',
    description: 'Recursively remove all node_modules folders in a directory',
  },
  args: {
    target: {
      type: 'positional',
      description: 'Target directory, defaults to current directory',
      default: process.cwd(),
    },
  },
  run({args}) {
    const targetDir = args.target;
    console.log(`Searching for node_modules in: ${targetDir}`);
    const deletedCount = removeNodeModules(targetDir);
    console.log(`Cleanup complete. Removed ${deletedCount} node_modules directories.`);
  },
});

export default removeNodeModulesCommand;

if (import.meta.main) {
  runMain(removeNodeModulesCommand);
}

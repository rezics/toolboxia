#!/usr/bin/env node

import {readdirSync, lstatSync, copyFileSync, mkdirSync, existsSync} from 'fs';
import {join, basename, dirname, relative} from 'path';
import {defineCommand, runMain} from 'citty';

const ENV_PATTERN = /^\.env(\..*)?$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.nuxt', '.cache']);

function collectEnvFiles(dir: string, resolvedTarget: string, outputDir: string): number {
  let collectedCount = 0;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Unable to access directory ${dir}: ${error.message}`);
    }
    return 0;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = lstatSync(fullPath);

    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) {
        collectedCount += collectEnvFiles(fullPath, resolvedTarget, outputDir);
      }
      continue;
    }

    if (stats.isFile() && ENV_PATTERN.test(entry)) {
      const rel = relative(resolvedTarget, fullPath);
      const dest = join(outputDir, rel);
      mkdirSync(dirname(dest), {recursive: true});
      copyFileSync(fullPath, dest);
      console.log(`Copied: ${rel}`);
      collectedCount++;
    }
  }

  return collectedCount;
}

const collectEnvFilesCommand = defineCommand({
  meta: {
    name: 'collect-env-files',
    description: 'Recursively collect .env files from the project into a separate directory',
  },
  args: {
    target: {
      type: 'positional',
      description: 'Target directory, defaults to current directory',
      default: process.cwd(),
    },
  },
  run({args}) {
    const resolvedTarget = join(args.target);
    const projectName = basename(resolvedTarget);
    const outputDir = join(dirname(resolvedTarget), `${projectName}-envfolder`);

    if (!existsSync(resolvedTarget)) {
      console.error(`Directory not found: ${resolvedTarget}`);
      process.exit(1);
    }

    console.log(`Project directory: ${resolvedTarget}`);
    console.log(`Output directory: ${outputDir}`);
    console.log('');

    mkdirSync(outputDir, {recursive: true});
    const collectedCount = collectEnvFiles(resolvedTarget, resolvedTarget, outputDir);

    console.log('');
    if (collectedCount === 0) {
      console.log('No .env files found.');
    } else {
      console.log(`Done. Collected ${collectedCount} env files to ${outputDir}`);
    }
  },
});

export default collectEnvFilesCommand;

if (import.meta.main) {
  runMain(collectEnvFilesCommand);
}

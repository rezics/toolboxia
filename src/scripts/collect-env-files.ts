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
      console.error(`无法访问目录 ${dir}: ${error.message}`);
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
      console.log(`已复制: ${rel}`);
      collectedCount++;
    }
  }

  return collectedCount;
}

const collectEnvFilesCommand = defineCommand({
  meta: {
    name: 'collect-env-files',
    description: '递归收集项目中的 .env 文件到独立目录',
  },
  args: {
    target: {
      type: 'positional',
      description: '目标目录，默认当前目录',
      default: process.cwd(),
    },
  },
  run({args}) {
    const resolvedTarget = join(args.target);
    const projectName = basename(resolvedTarget);
    const outputDir = join(dirname(resolvedTarget), `${projectName}-envfolder`);

    if (!existsSync(resolvedTarget)) {
      console.error(`目录不存在: ${resolvedTarget}`);
      process.exit(1);
    }

    console.log(`项目目录: ${resolvedTarget}`);
    console.log(`输出目录: ${outputDir}`);
    console.log('');

    mkdirSync(outputDir, {recursive: true});
    const collectedCount = collectEnvFiles(resolvedTarget, resolvedTarget, outputDir);

    console.log('');
    if (collectedCount === 0) {
      console.log('未找到任何 .env 文件。');
    } else {
      console.log(`完成，共收集 ${collectedCount} 个 env 文件到 ${outputDir}`);
    }
  },
});

export default collectEnvFilesCommand;

if (import.meta.main) {
  runMain(collectEnvFilesCommand);
}

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
          console.log(`正在删除: ${fullPath}`);
          rmSync(fullPath, {recursive: true, force: true});
          deletedCount++;
        } else {
          deletedCount += removeNodeModules(fullPath);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`访问目录 ${dir} 时出错: ${error.message}`);
    }
  }
  return deletedCount;
}

const removeNodeModulesCommand = defineCommand({
  meta: {
    name: 'remove-node-modules',
    description: '递归删除目录中的所有 node_modules 文件夹',
  },
  args: {
    target: {
      type: 'positional',
      description: '目标目录，默认当前目录',
      default: process.cwd(),
    },
  },
  run({args}) {
    const targetDir = args.target;
    console.log(`开始在目录中搜索 node_modules: ${targetDir}`);
    const deletedCount = removeNodeModules(targetDir);
    console.log(`清理完成。共删除 ${deletedCount} 个 node_modules 目录。`);
  },
});

export default removeNodeModulesCommand;

if (import.meta.main) {
  runMain(removeNodeModulesCommand);
}

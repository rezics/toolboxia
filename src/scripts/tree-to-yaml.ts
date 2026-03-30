#!/usr/bin/env node

import {execSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {command, option, flag, run, string, type Type} from 'cmd-ts';
import YAML from 'yaml';

type TreeNode = {
  [key: string]: 'folder' | 'file' | TreeNode;
};

/**
 * 将文件路径数组转换为目录树结构
 */
function buildTree(files: string[]): TreeNode {
  const root: TreeNode = {};

  for (const file of files) {
    const parts = file.split('/'); // git uses posix-style paths
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        // Check if it's the last part to assign 'file' or 'folder'
        current[part] = index === parts.length - 1 ? 'file' : {};
      }

      if (current[part] && typeof current[part] === 'object') {
        current = current[part] as TreeNode;
      }
    });
  }

  return root;
}

export async function main(): Promise<void> {
  const output = execSync('git ls-files --cached --others --exclude-standard', {
    encoding: 'utf8',
  });

  const files = output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const tree = buildTree(files);
  const yaml = YAML.stringify(tree, {indent: 2});
  const outputPath = path.resolve(process.cwd(), 'tree.yaml');

  writeFileSync(outputPath, yaml, 'utf8');
  console.log(`✅ Tree written to ${outputPath}`);
}

export function cmd() {
  return command({
    name: 'tree-to-yaml',
    args: {
      description: flag({
        type: cmdBoolean,
        long: 'description',
        description: 'tree-to-yaml description',
        defaultValue: () => false,
      }),
    },
    handler: async args => {
      if (args.description) {
        console.log('生成当前 git 仓库的文件树，并输出为 tree.yaml');
        console.log('');
        console.log('用法:');
        console.log('  toolboxia tree-to-yaml');
        return;
      } else {
        await main();
      }
    },
  });
}

if (import.meta.main) {
  run(cmd(), process.argv.slice(2));
}

const cmdBoolean: Type<boolean, boolean> = {
  async from(value: boolean): Promise<boolean> {
    return value;
  },
};

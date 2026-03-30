#!/usr/bin/env node

import {execSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {defineCommand, runMain} from 'citty';
import YAML from 'yaml';

type TreeNode = {
  [key: string]: 'folder' | 'file' | TreeNode;
};

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = {};

  for (const file of files) {
    const parts = file.split('/');
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
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

const treeToYamlCommand = defineCommand({
  meta: {
    name: 'tree-to-yaml',
    description:
      'Generate the file tree of the current git repository and output as tree.yaml',
  },
  args: {},
  run() {
    return main();
  },
});

export default treeToYamlCommand;

if (import.meta.main) {
  runMain(treeToYamlCommand);
}

#!/usr/bin/env node

import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {binary, command, run, subcommands} from 'cmd-ts';
import {cmd as mergeAllMdFileCmd} from './scripts/merge-all-md-file.ts';
import {cmd as treeToYamlCmd} from './scripts/tree-to-yaml.ts';

const VERSION = '0.1.0';

type ScriptEntry = {
  commandName: string;
  summary: string;
};

const scriptRegistry: ScriptEntry[] = [
  {
    commandName: 'merge-all-md-file',
    summary: '递归合并 Markdown 文件到单个输出文件',
  },
  {
    commandName: 'tree-to-yaml',
    summary: '导出仓库文件树到 tree.yaml',
  },
];

async function listScriptFiles(): Promise<string[]> {
  const currentFilePath = fileURLToPath(import.meta.url);
  const scriptDir = path.resolve(path.dirname(currentFilePath), 'scripts');
  const entries = await readdir(scriptDir, {withFileTypes: true});

  return entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => !name.startsWith('index.'))
    .filter(name => ['.ts', '.js', '.mjs', '.mts', '.cts'].includes(path.extname(name)))
    .sort((a, b) => a.localeCompare(b));
}

function createListCommand() {
  return command({
    name: 'list',
    args: {},
    handler: async () => {
      const files = await listScriptFiles();

      console.log('toolboxia scripts:');
      for (const file of files) {
        const commandName = file.replace(path.extname(file), '');
        const metadata = scriptRegistry.find(item => item.commandName === commandName);
        const summary = metadata?.summary ?? '未提供简介';
        console.log(`- ${commandName} (${file}) : ${summary}`);
      }
    },
  });
}

function createHelpCommand() {
  return command({
    name: 'help',
    args: {},
    handler: async () => {
      console.log('toolboxia - 脚本工具集合');
      console.log('');
      console.log('可用命令:');
      for (const script of scriptRegistry) {
        console.log(`- ${script.commandName}: ${script.summary}`);
      }
      console.log('- list: 列出 scripts 目录中的脚本文件');
      console.log('');
      console.log('示例:');
      console.log('  toolboxia merge-all-md-file --root ./docs --out ./docs/merged.md');
      console.log('  toolboxia tree-to-yaml');
      console.log('  toolboxia list');
      console.log('');
      console.log('查看任意命令参数:');
      console.log('  toolboxia <command> --help');
    },
  });
}

function createCliCommand() {
  return subcommands({
    name: 'toolboxia',
    version: VERSION,
    cmds: {
      help: createHelpCommand(),
      list: createListCommand(),
      'merge-all-md-file': mergeAllMdFileCmd(),
      'tree-to-yaml': treeToYamlCmd(),
    },
  });
}

export async function main(argv: string[] = process.argv): Promise<void> {
  await run(binary(createCliCommand()), argv);
}

if (import.meta.main) {
  await main();
}

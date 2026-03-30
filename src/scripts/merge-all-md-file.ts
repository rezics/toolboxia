#!/usr/bin/env node

import {promises as fs} from 'node:fs';
import path from 'node:path';
import {
  command,
  flag,
  number,
  oneOf,
  option,
  run,
  string,
  type Type,
} from 'cmd-ts';

type SortBy = 'path' | 'name' | 'mtime' | 'ctime';

type MarkdownFile = {
  abs: string;
  rel: string;
  name: string;
  mtimeMs: number;
  ctimeMs: number;
};

export type MergeAllMdOptions = {
  root: string;
  out: string;
  ext: string;
  ignore: string;
  sort: SortBy;
  header: string;
  separator: string;
  demote: number;
  toc: boolean;
};

function parseCsv(input: string): string[] {
  return input
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9\-_.\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function demoteHeadings(markdown: string, levels: number): string {
  if (!levels) {
    return markdown;
  }

  const hashSuffix = '#'.repeat(levels);
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let fenceCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const nextFenceChar = fenceMatch[2]?.[0] ?? '';
      const nextFenceCount = fenceMatch[2]?.length ?? 0;

      if (!inFence) {
        inFence = true;
        fenceChar = nextFenceChar;
        fenceCount = nextFenceCount;
      } else if (nextFenceChar === fenceChar && nextFenceCount >= fenceCount) {
        inFence = false;
      }

      continue;
    }

    if (inFence) {
      continue;
    }

    const atxMatch = line.match(/^(\s{0,3})(#{1,6})(\s+.*)$/);
    if (atxMatch) {
      const leading = atxMatch[1] ?? '';
      const hashes = atxMatch[2] ?? '';
      const text = atxMatch[3] ?? '';
      lines[index] = `${leading}${hashes}${hashSuffix}${text}`;
      continue;
    }

    const nextLine = lines[index + 1];
    if (nextLine === undefined) {
      continue;
    }

    const underlineMatch = nextLine.match(/^ {0,3}(=+|-+)\s*$/);
    if (underlineMatch) {
      const isH1 = (underlineMatch[1] ?? '').startsWith('=');
      const originalLevel = isH1 ? 1 : 2;
      const atxLevel = Math.min(6, originalLevel + levels);
      lines[index] = `${'#'.repeat(atxLevel)} ${line.trim()}`;
      lines[index + 1] = '';
      index += 1;
    }
  }

  return lines.join('\n');
}

function applyHeaderTemplate(
  template: string,
  relPath: string,
  name: string,
): string {
  return template.replaceAll('{relpath}', relPath).replaceAll('{name}', name);
}

async function walkDir(
  root: string,
  dir: string,
  ignoreDirs: string[],
  exts: string[],
): Promise<MarkdownFile[]> {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files: MarkdownFile[] = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs).replaceAll('\\', '/');

    if (entry.isDirectory()) {
      if (ignoreDirs.includes(entry.name)) {
        continue;
      }
      const children = await walkDir(root, abs, ignoreDirs, exts);
      files.push(...children);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!exts.includes(extension)) {
      continue;
    }

    const stat = await fs.stat(abs);
    files.push({
      abs,
      rel,
      name: entry.name,
      mtimeMs: stat.mtimeMs,
      ctimeMs: stat.ctimeMs,
    });
  }

  return files;
}

function sortFiles(files: MarkdownFile[], sortBy: SortBy): MarkdownFile[] {
  switch (sortBy) {
    case 'name':
      return files.sort((left, right) => left.name.localeCompare(right.name));
    case 'mtime':
      return files.sort((left, right) => left.mtimeMs - right.mtimeMs);
    case 'ctime':
      return files.sort((left, right) => left.ctimeMs - right.ctimeMs);
    case 'path':
    default:
      return files.sort((left, right) => left.rel.localeCompare(right.rel));
  }
}

export async function main(options: MergeAllMdOptions): Promise<void> {
  const root = path.resolve(options.root);
  const exts = parseCsv(options.ext).map(item => item.toLowerCase());
  const ignoreDirs = parseCsv(options.ignore);
  const outputPath = path.resolve(options.out || path.join(root, 'merged.md'));
  const separator = options.separator;
  const files = sortFiles(
    await walkDir(root, root, ignoreDirs, exts),
    options.sort,
  );

  if (files.length === 0) {
    throw new Error(
      `No markdown files found under ${root} for extensions: ${exts.join(', ')}`,
    );
  }

  await fs.mkdir(path.dirname(outputPath), {recursive: true});

  const parts: string[] = [];
  const tocItems: Array<{title: string; id: string}> = [];

  for (const markdownFile of files) {
    const raw = await fs.readFile(markdownFile.abs, 'utf8');
    const content = demoteHeadings(stripBom(raw), options.demote);
    const header = applyHeaderTemplate(
      options.header,
      markdownFile.rel,
      markdownFile.name,
    );
    const anchorId = slugify(markdownFile.rel);
    const anchorTag = `<a id="${anchorId}"></a>`;

    tocItems.push({
      title: header.replace(/^#+\s*/, '').trim(),
      id: anchorId,
    });

    parts.push(`${anchorTag}\n${header}\n\n${content}`);
  }

  let output = parts.join(separator);
  if (options.toc) {
    const toc =
      '# 合并目录（TOC）\n\n' +
      tocItems.map(item => `- [${item.title}](#${item.id})`).join('\n') +
      '\n\n---\n\n';
    output = `${toc}${output}`;
  }

  await fs.writeFile(outputPath, output, 'utf8');

  console.log(`✅ 已合并 ${files.length} 个文件。`);
  console.log(`📄 输出：${outputPath}`);
}

export function cmd() {
  return command({
    name: 'merge-all-md-file',
    args: {
      root: option({
        type: string,
        long: 'root',
        description: '根目录，默认当前目录',
        defaultValue: () => '.',
      }),
      out: option({
        type: string,
        long: 'out',
        description: '输出文件路径，默认 <root>/merged.md',
        defaultValue: () => '',
      }),
      ext: option({
        type: string,
        long: 'ext',
        description: '扩展名列表，逗号分隔',
        defaultValue: () => '.md,.mdx',
      }),
      ignore: option({
        type: string,
        long: 'ignore',
        description: '忽略目录，逗号分隔',
        defaultValue: () => 'node_modules,.git,dist,build,out,.next',
      }),
      sort: option({
        type: sortType,
        long: 'sort',
        description: '排序方式：path|name|mtime|ctime',
        defaultValue: () => 'path' as SortBy,
      }),
      header: option({
        type: string,
        long: 'header',
        description: '分节标题模板，支持 {relpath} {name}',
        defaultValue: () => '## {relpath}',
      }),
      separator: option({
        type: string,
        long: 'separator',
        description: '文件间分隔符',
        defaultValue: () => '\n\n---\n\n',
      }),
      demote: option({
        type: number,
        long: 'demote',
        description: '标题降级层数',
        defaultValue: () => 0,
      }),
      toc: flag({
        type: cmdBoolean,
        long: 'toc',
        description: '生成目录',
        defaultValue: () => false,
      }),
    },
    handler: async args => {
      const out =
        args.out.trim() === '' ? path.join(args.root, 'merged.md') : args.out;
      await main({...args, out});
    },
  });
}

const cmdBoolean: Type<boolean, boolean> = {
  async from(value: boolean): Promise<boolean> {
    return value;
  },
};

if (import.meta.main) {
  run(cmd(), process.argv.slice(2));
}

const sortType: Type<string, SortBy> = {
  async from(str: string): Promise<SortBy> {
    return new Promise((resolve, reject) => {
      if (['path', 'name', 'mtime', 'ctime'].includes(str)) {
        resolve(str as SortBy);
      } else {
        reject(new Error(`Invalid sort type: ${str}`));
      }
    });
  },
};

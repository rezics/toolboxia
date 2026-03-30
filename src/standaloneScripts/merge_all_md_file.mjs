#!/usr/bin/env node
// merge_all_md_file.mjs
// 递归合并目录下的 Markdown 文件到一个文件（零依赖、便携版）

import {promises as fs} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------ CLI 解析（轻量） ------------------------
const args = process.argv.slice(2);
function getArg(name, def = undefined) {
  const i = args.indexOf(name);
  if (i !== -1) {
    const v = args[i + 1];
    if (v === undefined || v.startsWith('--')) return true; // 布尔开关
    return v;
  }
  return def;
}
function hasFlag(name) {
  return args.includes(name);
}

const help = hasFlag('-h') || hasFlag('--help');
if (help) {
  console.log(`
合并 Markdown（递归）
用法：
  node merge_all_md_file.mjs [--root <目录>] [--out <输出文件>]
                             [--ext ".md,.mdx"] [--ignore "node_modules,.git,dist"]
                             [--sort path|name|mtime|ctime]
                             [--header "## {relpath}"]
                             [--separator "\\n\\n---\\n\\n"]
                             [--demote <N>] [--toc]

参数说明：
  --root       根目录，默认当前目录 "."
  --out        输出文件路径，默认 "<root>/merged.md"
  --ext        需要合并的扩展名，逗号分隔，默认 ".md,.mdx"
  --ignore     忽略的目录名，逗号分隔，默认 "node_modules,.git,dist,build,out,.next"
  --sort       合并顺序，按：
                 - path（默认，完整相对路径字典序）
                 - name（仅文件名）
                 - mtime（修改时间，旧->新）
                 - ctime（创建时间，旧->新）
  --header     每个文件并入时的分节标题模板（支持 {relpath} {name}），默认 "## {relpath}"
  --separator  文件之间的分隔符，默认 "\\n\\n---\\n\\n"
  --demote     将正文里的 Markdown 标题降级 N 级（避免多重 # H1 冲突），默认 0 不降级
  --toc        在最前面生成一个包含每个文件分节的目录（锚点与 header 对应）

示例：
  node merge_all_md_file.mjs --root ./docs --out ./docs/_merged.md
  node merge_all_md_file.mjs --root . --ignore "node_modules,.git,dist,.next" --demote 1 --toc
  node merge_all_md_file.mjs --root ./notes --sort mtime --header "## 📄 {name}" --separator "\\n\\n---\\n\\n"
`);
  process.exit(0);
}

// ------------------------ 配置项 ------------------------
const ROOT = path.resolve(getArg('--root', '.'));
const OUT = path.resolve(getArg('--out', path.join(ROOT, 'merged.md')));
const exts = String(getArg('--ext', '.md,.mdx'))
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
const ignoreDirs = String(
  getArg('--ignore', 'node_modules,.git,dist,build,out,.next'),
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const sortBy = getArg('--sort', 'path'); // path | name | mtime | ctime
const headerTpl = String(getArg('--header', '## {relpath}'));
const separator = getArg('--separator', '\n\n---\n\n');
const demoteN = Math.max(0, parseInt(getArg('--demote', '0'), 10) || 0);
const genTOC = hasFlag('--toc');

// ------------------------ 工具函数 ------------------------
const stripBOM = s => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9\-_.\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function demoteHeadings(markdown, n) {
  if (!n) return markdown;
  const addHashes = '#'.repeat(n);
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let fenceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 处理围栏代码块（三重反引号或波浪线）
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const fence = fenceMatch[2][0]; // ` 或 ~
      const count = fenceMatch[2].length;
      if (!inFence) {
        inFence = true;
        fenceChar = fence;
        fenceCount = count;
      } else if (fence === fenceChar && count >= fenceCount) {
        inFence = false;
      }
      // 围栏行本身不处理标题
      continue;
    }
    if (inFence) continue;

    // ATX 标题：以 # 开头
    const atx = line.match(/^(\s{0,3})(#{1,6})(\s+.*)$/);
    if (atx) {
      lines[i] = `${atx[1]}${atx[2]}${addHashes}${atx[3]}`;
      continue;
    }

    // Setext 标题（下划线式）转 ATX 再降级
    // 当前行是文本，下一行是 === 或 ---（最多3个缩进）
    if (i + 1 < lines.length) {
      const underline = lines[i + 1].match(/^ {0,3}(=+|-+)\s*$/);
      if (underline) {
        const level = underline[1][0] === '=' ? 1 : 2;
        const atxLevel = Math.min(6, level + n);
        const text = line.trim();
        lines[i] = `${'#'.repeat(atxLevel)} ${text}`;
        lines[i + 1] = ''; // 去掉下划线行
        i++; // 跳过下一行
      }
    }
  }
  return lines.join('\n');
}

async function walkDir(dir, relBase = '') {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = [];
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    const rel = path.relative(ROOT, abs);
    if (ent.isDirectory()) {
      if (ignoreDirs.includes(ent.name)) continue;
      files.push(...(await walkDir(abs, rel)));
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (exts.includes(ext)) {
        const stat = await fs.stat(abs);
        files.push({
          abs,
          rel,
          name: ent.name,
          mtimeMs: stat.mtimeMs,
          ctimeMs: stat.ctimeMs,
        });
      }
    }
  }
  return files;
}

function sortFiles(files) {
  switch (sortBy) {
    case 'name':
      return files.sort((a, b) => a.name.localeCompare(b.name));
    case 'mtime':
      return files.sort((a, b) => a.mtimeMs - b.mtimeMs);
    case 'ctime':
      return files.sort((a, b) => a.ctimeMs - b.ctimeMs);
    case 'path':
    default:
      return files.sort((a, b) => a.rel.localeCompare(b.rel));
  }
}

function applyHeaderTemplate(tpl, rel, name) {
  return tpl.replaceAll('{relpath}', rel).replaceAll('{name}', name);
}

// ------------------------ 主流程 ------------------------
(async () => {
  try {
    await fs.mkdir(path.dirname(OUT), {recursive: true});

    const files = sortFiles(await walkDir(ROOT));
    if (!files.length) {
      console.error(`未在 ${ROOT} 找到扩展名为 ${exts.join(', ')} 的文件。`);
      process.exit(2);
    }

    const parts = [];
    const tocItems = [];

    for (const f of files) {
      const raw = await fs.readFile(f.abs, 'utf8');
      const content = demoteHeadings(stripBOM(raw), demoteN);

      const header = applyHeaderTemplate(headerTpl, f.rel, f.name);
      const anchorId = slugify(f.rel);
      const anchorTag = `<a id="${anchorId}"></a>`;
      tocItems.push({
        title: header.replace(/^#+\s*/, '').trim(),
        id: anchorId,
      });

      parts.push(`${anchorTag}\n${header}\n\n${content}`);
    }

    let output = parts.join(separator);

    if (genTOC) {
      const toc =
        '# 合并目录（TOC）\n\n' +
        tocItems.map(t => `- [${t.title}](#${t.id})`).join('\n') +
        '\n\n---\n\n';
      output = toc + output;
    }

    await fs.writeFile(OUT, output, 'utf8');

    console.log(`✅ 已合并 ${files.length} 个文件。`);
    console.log(`📄 输出：${OUT}`);
  } catch (err) {
    console.error('合并失败：', err);
    process.exit(1);
  }
})();

import {readdirSync, lstatSync, copyFileSync, mkdirSync, existsSync} from 'fs';
import {join, basename, dirname, relative} from 'path';

const targetDir = process.argv[2] || process.cwd();
const resolvedTarget = join(targetDir);
const projectName = basename(resolvedTarget);
const outputDir = join(dirname(resolvedTarget), `${projectName}-envfolder`);

const ENV_PATTERN = /^\.env(\..*)?$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.nuxt', '.cache']);

let collectedCount = 0;

function collectEnvFiles(dir: string): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`无法访问目录 ${dir}: ${error.message}`);
    }
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = lstatSync(fullPath);

    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) {
        collectEnvFiles(fullPath);
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
}

if (!existsSync(resolvedTarget)) {
  console.error(`目录不存在: ${resolvedTarget}`);
  process.exit(1);
}

console.log(`项目目录: ${resolvedTarget}`);
console.log(`输出目录: ${outputDir}`);
console.log('');

mkdirSync(outputDir, {recursive: true});
collectEnvFiles(resolvedTarget);

console.log('');
if (collectedCount === 0) {
  console.log('未找到任何 .env 文件。');
} else {
  console.log(`完成，共收集 ${collectedCount} 个 env 文件到 ${outputDir}`);
}

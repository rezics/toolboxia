#!/usr/bin/env node

import {readdir, readFile} from 'fs/promises';
import {join, basename, dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineCommand, runMain} from 'citty';
import search from '@inquirer/search';
import {parse as parseYaml} from 'yaml';
import clipboardy from 'clipboardy';
import {configDir} from '../../config/index.js';

interface PromptEntry {
  name: string;
  description: string;
  source: 'builtin' | 'user';
  filePath: string;
}

function extractMetadata(
  content: string,
  filename: string,
): {description: string; body: string} {
  // Try YAML frontmatter
  if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
    const endIndex = content.indexOf('\n---', 3);
    if (endIndex !== -1) {
      const frontmatter = content.slice(4, endIndex);
      const afterFrontmatter = content.slice(
        content.indexOf('\n', endIndex + 1) + 1,
      );
      try {
        const parsed = parseYaml(frontmatter) as Record<string, unknown>;
        if (parsed && typeof parsed.description === 'string') {
          return {description: parsed.description, body: afterFrontmatter};
        }
      } catch {
        // Fall through to next strategy
      }
    }
  }

  // Try first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return {description: headingMatch[1]!.trim(), body: content};
  }

  // Fallback: filename
  const name = filename.replace(/\.md$/, '').replace(/-/g, ' ');
  return {description: name, body: content};
}

async function scanPrompts(
  dir: string,
  source: 'builtin' | 'user',
): Promise<PromptEntry[]> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const entries: PromptEntry[] = [];
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = join(dir, file);
    const content = await readFile(filePath, 'utf-8');
    const {description} = extractMetadata(content, file);
    entries.push({
      name: file.replace(/\.md$/, ''),
      description,
      source,
      filePath,
    });
  }
  return entries;
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const builtinDir = join(scriptDir, 'prompt');
  const userDir = join(configDir, 'plugins', 'prompt', 'prompt');

  const [userPrompts, builtinPrompts] = await Promise.all([
    scanPrompts(userDir, 'user'),
    scanPrompts(builtinDir, 'builtin'),
  ]);

  const allPrompts = [...userPrompts, ...builtinPrompts];

  if (allPrompts.length === 0) {
    console.log('No prompts found.');
    return;
  }

  const selected = await search<string>({
    message: 'Select a prompt',
    source: input => {
      const term = (input ?? '').toLowerCase();
      return allPrompts
        .filter(
          entry =>
            entry.name.toLowerCase().includes(term) ||
            entry.description.toLowerCase().includes(term),
        )
        .map(entry => ({
          name: `${entry.name} — ${entry.description} [${entry.source === 'user' ? 'user' : 'built-in'}]`,
          value: entry.filePath,
        }));
    },
  });

  const content = await readFile(selected, 'utf-8');
  const {body} = extractMetadata(content, basename(selected));
  const trimmed = body.trim();
  await clipboardy.write(trimmed);
  console.log(trimmed);
  console.log('\nCopied to clipboard.');
}

const command = defineCommand({
  meta: {
    name: 'prompt',
    description: 'Interactive prompt picker (built-in + user prompts)',
  },
  async run() {
    try {
      await main();
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('User force closed') ||
          error.message.includes('ExitPromptError'))
      ) {
        process.exit(0);
      }
      throw error;
    }
  },
});

if (import.meta.main) {
  runMain(command);
}

export default command;

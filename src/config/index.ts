import {mkdir} from 'fs/promises';
import envPaths from 'env-paths';

const paths = envPaths('toolboxia', {suffix: ''});

export const configDir = paths.config;

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, {recursive: true});
}

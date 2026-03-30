import {existsSync} from 'fs';
import {join, dirname} from 'path';

export function findProjectRoot(startDir: string): string {
  let dir = startDir;

  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  throw new Error('Cannot find package.json');
}

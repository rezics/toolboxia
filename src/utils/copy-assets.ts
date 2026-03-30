import {cpSync} from 'fs';
import {join} from 'path';
import {findProjectRoot} from './utils';

const root = findProjectRoot(__dirname);
const src = join(root, 'src');
const dist = join(root, 'dist');

// Add asset directories to copy here
const assets = ['scripts/prompt/prompt'];

for (const asset of assets) {
  cpSync(join(src, asset), join(dist, asset), {recursive: true});
}

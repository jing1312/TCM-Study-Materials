import { rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');

if (!dist.startsWith(root + sep)) {
  throw new Error(`Refusing to remove an unexpected path: ${dist}`);
}

await rm(dist, { recursive: true, force: true });

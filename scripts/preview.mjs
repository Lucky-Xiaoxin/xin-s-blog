import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASTRO_BIN = path.join(ROOT, 'node_modules', 'astro', 'astro.js');

// verify 生成的是生产子路径产物；preview 默认按 base=/ 启动会 404。
// 这里显式使用同款参数，并把额外参数（如 --port）透传给 astro preview。
const env = {
  ...process.env,
  SITE_URL: process.env.SITE_URL || 'https://lucky-xiaoxin.github.io',
  BASE_PATH: process.env.BASE_PATH || '/xin-s-blog',
};

console.log(`[preview:prod] BASE_PATH=${env.BASE_PATH} SITE_URL=${env.SITE_URL}`);
const result = spawnSync(process.execPath, [ASTRO_BIN, 'preview', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

if (result.status !== 0) {
  console.error(`[preview:prod] FAIL（exit ${result.status ?? result.signal}）`);
  process.exit(result.status ?? 1);
}

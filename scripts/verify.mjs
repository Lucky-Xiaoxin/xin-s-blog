import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  TZ: process.env.TZ || 'Etc/UTC',
  SITE_URL: process.env.SITE_URL || 'https://lucky-xiaoxin.github.io',
  BASE_PATH: process.env.BASE_PATH || '/xin-s-blog',
  DIST_DIR: process.env.DIST_DIR || 'dist',
};

const steps = [
  { label: 'astro check', command: 'npm run check' },
  { label: 'production build', command: 'npm run build' },
  { label: 'check dist', command: `"${process.execPath}" scripts/check-dist.mjs` },
];

console.log(`[verify] BASE_PATH=${env.BASE_PATH} SITE_URL=${env.SITE_URL} TZ=${env.TZ}`);

for (const [i, step] of steps.entries()) {
  console.log(`\n[verify] (${i + 1}/${steps.length}) ${step.label}`);
  // Windows 下 npm 是 .cmd，不能直接 spawn；固定命令串走 shell 最省事
  const result = spawnSync(step.command, { stdio: 'inherit', shell: true, env });
  if (result.status !== 0) {
    console.error(`\n[verify] FAIL: ${step.label}（exit ${result.status ?? result.signal}）`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[verify] PASS');

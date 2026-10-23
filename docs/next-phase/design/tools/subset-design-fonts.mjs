// 为设计原型生成字体子集。只读 node_modules，产物写进 design/assets/fonts。
// 与站点 scripts/subset-fonts.mjs 同源，但扫描范围是设计原型全部文案。
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..', '..', '..');
const outDir = path.join(root, 'assets', 'fonts');
mkdirSync(outDir, { recursive: true });

const isCjk = (cp) =>
  (cp >= 0x3000 && cp <= 0x9fff) ||
  (cp >= 0xff00 && cp <= 0xffef) ||
  [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x00b7].includes(cp);

const chars = new Set();
function collect(text) {
  for (const ch of text) if (isCjk(ch.codePointAt(0))) chars.add(ch);
}
function walk(dir, exts) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'screens' || entry.name === 'fonts') continue;
      walk(p, exts);
    } else if (exts.includes(path.extname(entry.name))) {
      collect(readFileSync(p, 'utf8'));
    }
  }
}

walk(root, ['.html', '.mjs', '.css']);
collect('二进制与诗一个佛大计算机学生的笔记站计算机系统算法题解与开发工具的个人笔记小鑫目录归档标签关于碎碎念现在');
console.log(`[design-fonts] 标题用字：${chars.size} 个`);

for (const weight of [400, 500]) {
  const src = path.join(
    repo,
    'node_modules',
    '@fontsource',
    'noto-serif-sc',
    'files',
    `noto-serif-sc-chinese-simplified-${weight}-normal.woff2`,
  );
  const out = await subsetFont(readFileSync(src), [...chars].join(''), { targetFormat: 'woff2' });
  const outFile = path.join(outDir, `noto-serif-sc-subset-${weight}.woff2`);
  writeFileSync(outFile, out);
  const font = fontkit.openSync(outFile);
  const missing = [...chars].filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));
  if (missing.length) console.warn(`[design-fonts] 缺字：${missing.join('')}`);
  console.log(`[design-fonts] ${weight}: ${Math.round(out.length / 1024)} KB`);
}

for (const weight of [400, 500]) {
  const src = path.join(
    repo,
    'node_modules',
    '@fontsource',
    'bodoni-moda',
    'files',
    `bodoni-moda-latin-${weight}-normal.woff2`,
  );
  copyFileSync(src, path.join(outDir, `bodoni-moda-${weight}.woff2`));
}
console.log('[design-fonts] Bodoni Moda 400/500 已复制');

// 中文衬线子集：把思源宋体按「站内标题类用字」裁剪成几十 KB 的自托管字体。
// 为什么这样做：完整思源宋体单字重约 1.4MB（官方分片版每页也要拉 300KB+），
// 而本站衬线只用于标题类元素，全站用字不过几百个——构建期子集化后每字重仅几十 KB。
//
// 字符来源（= 会走 --font-display 的元素的文案来源）：
//   1. src 下所有 .astro/.ts/.js 全文（页面上的固定文案、const.ts 的站名等，多收无害）
//   2. 文章 Markdown：frontmatter 全文（title/description/tags）、标题行、引用行
//      —— 正文段落刻意不收（用系统无衬线），避免子集随文章体积膨胀
// 若以后新增「非 h1~h3 / brand / 摘要 / 引用」的衬线用例，必须把它的文案来源补进上面两处，
// 否则那个字会静默回退到系统宋体（真出问题时的对照表见 TROUBLESHOOTING.md）。
//
// 由 package.json 的 predev / prebuild 自动执行；产物在 src/assets/fonts/（已 gitignore）。
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 只保留会走中文衬线回退的字符：CJK、全角形式、常见中文标点
// （拉丁字母与数字由 Bodoni Moda 覆盖，不进子集）
const isCjk = (cp) =>
  (cp >= 0x3000 && cp <= 0x9fff) ||
  (cp >= 0xff00 && cp <= 0xffef) ||
  [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].includes(cp);

function collectFrom(text, into) {
  for (const ch of text) {
    if (isCjk(ch.codePointAt(0))) into.add(ch);
  }
}

function walk(dir, exts, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, exts, visit);
    else if (exts.includes(path.extname(entry.name))) visit(p);
  }
}

const chars = new Set();

// 1) 源码文件全文
walk(path.join(root, 'src'), ['.astro', '.ts', '.js'], (file) => {
  collectFrom(readFileSync(file, 'utf8'), chars);
});

// 2) Markdown：frontmatter + 标题行 + 引用行
walk(path.join(root, 'src', 'content', 'posts'), ['.md'], (file) => {
  const text = readFileSync(file, 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) collectFrom(frontmatter[1], chars);
  for (const line of text.split(/\r?\n/)) {
    if (/^#{1,6}\s/.test(line) || /^>/.test(line)) collectFrom(line, chars);
  }
});

const text = [...chars].join('');
console.log(`[subset-fonts] 标题用字：${chars.size} 个`);

const outDir = path.join(root, 'src', 'assets', 'fonts');
mkdirSync(outDir, { recursive: true });

for (const weight of [400, 500]) {
  const src = path.join(
    root,
    'node_modules/@fontsource/noto-serif-sc/files',
    `noto-serif-sc-chinese-simplified-${weight}-normal.woff2`,
  );
  if (!existsSync(src)) {
    console.error('[subset-fonts] 找不到思源宋体源文件，请先 npm install（依赖 @fontsource/noto-serif-sc）');
    process.exit(1);
  }

  const out = await subsetFont(readFileSync(src), text, { targetFormat: 'woff2' });
  const outFile = path.join(outDir, `noto-serif-sc-subset-${weight}.woff2`);
  writeFileSync(outFile, out);

  // 自检：源字体没有字形缺陷无法凭空造——缺字只警告不阻断
  // （与 KaTeX throwOnError:false 同一哲学：降级可见、不挡发布；兜底走 --font-display 尾部的系统宋体）
  const font = fontkit.openSync(outFile);
  const missing = [...chars].filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));
  if (missing.length) {
    console.warn(
      `[subset-fonts] ⚠ 源字体缺字，标题里这些字将回退系统宋体（不影响构建与发布）：${missing.join('')}`,
    );
  }
  console.log(`[subset-fonts] ${weight}: ${Math.round(out.length / 1024)} KB → ${path.relative(root, outFile)}`);
}
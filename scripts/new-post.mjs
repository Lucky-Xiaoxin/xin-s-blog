#!/usr/bin/env node
/**
 * 一键建稿：npm run new -- <文件名>  或双击「新建文章.bat」
 * 生成带注释模板的 src/content/posts/<文件名>.md，自动填当天日期与本机时间。
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const POSTS_DIR = path.join(ROOT, 'src/content/posts');
const CONST_FILE = path.join(ROOT, 'src/const.ts');

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const HINT = '规范：只用小写字母、数字、连字符 -（如 redis-cache-notes），文件名就是文章 URL。';

function nameProblem(name) {
  if (!name) return '文件名为空';
  if (/[一-鿿]/.test(name)) return '不能含中文';
  if (/\s/.test(name)) return '不能含空格';
  if (/[A-Z]/.test(name)) return '不能含大写字母';
  if (name.includes('_')) return '不能用下划线，请用连字符 -';
  if (/[\\/]/.test(name)) return '不能含路径分隔符';
  if (/[.]/.test(name)) return '不用写 .md 后缀，也不能含点';
  if (!NAME_RE.test(name)) return '只能用小写字母、数字、连字符';
  return null;
}

const SHAPE_LABEL = {
  triangle: '△ 三角',
  hexagon: '⬡ 六边',
  square: '□ 方形',
  rhombus: '◇ 菱',
  semicircle: '◠ 半圆',
  circle: '○ 圆形',
};

/** 从 src/const.ts 提取 TAG_SHAPE 的「形状 -> 标签列表」，失败返回 null（模板降级） */
function readTagGroups() {
  try {
    const src = fs.readFileSync(CONST_FILE, 'utf8');
    const block = src.match(/const TAG_SHAPE[^=]*=\s*\{([\s\S]*?)\};/);
    if (!block) return null;
    const groups = new Map();
    for (const line of block[1].split('\n')) {
      const m = line.match(
        /^\s*(?:'([^']+)'|"([^"]+)"|([\p{L}\p{N}_$][\p{L}\p{N}_$ -]*?))\s*:\s*'([a-z]+)'\s*,?\s*$/u,
      );
      if (!m) continue;
      const tag = m[1] ?? m[2] ?? m[3].trim();
      const shape = m[4];
      if (!SHAPE_LABEL[shape]) continue;
      if (!groups.has(shape)) groups.set(shape, []);
      groups.get(shape).push(tag);
    }
    return groups.size ? groups : null;
  } catch {
    return null;
  }
}

function tagComments() {
  const groups = readTagGroups();
  if (!groups) {
    return [
      '# 可用标签清单：见 src/const.ts 的 TAG_SHAPE；新标签要先在那里登记形状，',
      '# 否则构建时告警、徽章回退为圆形。',
    ];
  }
  const lines = ['# ── 可用标签（按徽章形状分组）────────────────────────'];
  for (const [shape, label] of Object.entries(SHAPE_LABEL)) {
    const tags = groups.get(shape);
    if (tags) lines.push(`#  ${label}: ${tags.join(' / ')}`);
  }
  lines.push('# 未登记的标签会回退成 ○ 圆形并在构建时告警');
  return lines;
}

function localStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    pubDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    pubTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

function template(name) {
  const { pubDate, pubTime } = localStamp();
  return [
    '---',
    "title: ''            # 必填：文章标题（目录页、浏览器标签、RSS 都用它）",
    "description: ''      # 必填：一句话摘要（目录页卡片、RSS、分享预览用）",
    `pubDate: ${pubDate}  # 发布日期，脚本已自动填，发布前可手改`,
    `pubTime: '${pubTime}'     # 发布时间 24h 制，仅显示用；不要显示就删整行`,
    "tags: ['其它']       # 从下面清单挑，可多个；新标签须先去 src/const.ts 的 TAG_SHAPE 登记形状",
    ...tagComments(),
    'draft: true          # 草稿箱：true 时不进目录页/RSS；定稿改成 false 或删整行',
    '---',
    '',
    `<!-- ${name}：正文从这里开始…… -->`,
    '',
  ].join('\n');
}

function create(name) {
  const problem = nameProblem(name);
  if (problem) {
    console.error(`✗ ${problem}：「${name}」\n  ${HINT}`);
    return false;
  }
  const file = path.join(POSTS_DIR, `${name}.md`);
  if (fs.existsSync(file)) {
    console.error(`✗ 已存在 src/content/posts/${name}.md，不换名字就不动它了`);
    return false;
  }
  fs.writeFileSync(file, template(name), 'utf8');
  console.log(`✓ 已创建 src/content/posts/${name}.md（draft 状态，本地 npm run dev 可预览）`);
  return true;
}

async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((done) => rl.question(q, done));
  console.log('📝 新建博客文章');
  console.log(`   ${HINT}`);
  for (;;) {
    const name = (await ask('请输入文件名（直接回车退出）：')).trim().replace(/\.md$/i, '');
    if (!name) break;
    if (create(name)) break;
  }
  rl.close();
}

const arg = process.argv[2];
if (arg) {
  process.exit(create(arg.trim().replace(/\.md$/i, '')) ? 0 : 1);
} else {
  await interactive();
}

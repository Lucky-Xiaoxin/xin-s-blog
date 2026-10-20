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

/**
 * 标签提示只给「去哪儿看」，不给清单快照。
 * 这里曾经是正则解析 src/const.ts 的 TAG_SHAPE、按形状把全量标签写进每篇新文章
 * 的 frontmatter 注释——那是个必然过期的快照：TAG_SHAPE 后来加过 Git/GitHub、又把
 * Github 改名成 GitHub，已有文章里的清单就永远停在创建那一刻（实测三篇文章三个版本，
 * 其中一份还带着改名前的 Github）。指向单一事实来源，注释就不会再腐烂。
 */
function tagComments() {
  return [
    '# 可用标签清单与徽章形状：见 src/const.ts 的 TAG_SHAPE（那里是唯一事实来源）',
    '# 未登记的标签会回退成 ○ 圆形并在构建时告警；新标签要先去那里登记形状',
  ];
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
    "tags: ['其它']       # 可多个；清单见 src/const.ts 的 TAG_SHAPE，新标签须先去那里登记形状",
    ...tagComments(),
    'draft: true          # 草稿箱：true 时不进目录页/RSS；定稿改成 false 或删整行',
    '---',
    '',
    `<!-- ${name}：正文从这里开始…… -->`,
    '<!-- 下面这行是写法提示，开写后整行删掉（它会随 HTML 发布，且字数统计算得到它） -->',
    '<!-- 公式：$行内$ 或 $$独立成行$$，KaTeX 语法——中文、→、≤、≥ 可直接写；真语法错（如 \\foo）页面标红，不挡发布 -->',
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

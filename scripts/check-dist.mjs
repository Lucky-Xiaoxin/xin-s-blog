import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.env.DIST_DIR || 'dist');
// 默认与 astro.config.mjs 的 base 默认值（/）一致；生产子路径由 verify/CI 显式传。
const BASE = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const BASE_PATH_DECODED = decodeURIComponent(BASE);
// SITE_URL 用 URL origin 归一化：canonical/sitemap 里的 host 会被 URL 规范化成小写，
// 直接拿 env 原字符串比较会因 GitHub 用户名的大小写（Lucky-Xiaoxin）误报。
const SITE = new URL(process.env.SITE_URL || 'https://lucky-xiaoxin.github.io').origin;
const SITE_ROOT = `${SITE}${BASE}/`;
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');
const NOTES_DIR = path.join(ROOT, 'src', 'content', 'notes');
const PAGES_DIR = path.join(ROOT, 'src', 'content', 'pages');

const KB = 1024;
const MB = 1024 * 1024;
const LIMITS = {
  css: 18 * KB,
  js: 3 * KB,
  fonts: Math.round(1.5 * MB),
  html: 30 * KB,
  dist: Math.round(2.6 * MB),
};

const failures = [];
const fail = (check, file, detail) => failures.push({ check, file, detail });
const failCount = (check) => failures.filter((f) => f.check === check).length;

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

const relDist = (p) => path.relative(DIST, p).split(path.sep).join('/');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out.sort();
}

const read = (p) => fs.readFileSync(p, 'utf8');

function attrsOf(tag) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const m of tag.matchAll(re)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

/**
 * 只返回实际开始标签，避免把代码块/正文中的属性文本当成链接或 id。
 * script/style 的内容先剥掉；标签内的引号允许出现 >。
 */
function startTags(html) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script\s*>)/gi, '$1$2')
    .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style\s*>)/gi, '$1$2');
  return [...cleaned.matchAll(/<[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>/g)].map((m) => m[0]);
}

function linkAttrs(html) {
  const out = [];
  for (const tag of startTags(html)) {
    const attrs = attrsOf(tag);
    for (const name of ['href', 'src']) {
      if (Object.hasOwn(attrs, name)) out.push(attrs[name].trim());
    }
  }
  return out;
}

function decodeHtml(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

const files = walk(DIST);
const htmlFiles = files.filter((p) => p.endsWith('.html'));

// ---------- 3.1 必需产物 ----------
const REQUIRED = [
  'index.html',
  '404.html',
  'rss.xml',
  'sitemap-index.xml',
  'sitemap-0.xml',
  'notes/index.html',
  'notes/rss.xml',
  'now/index.html',
];
const missingArtifacts = REQUIRED.filter((f) => !isFile(path.join(DIST, f)));
for (const f of missingArtifacts) fail('artifacts', f, '必需产物缺失');

// ---------- 3.2 / 3.3 子路径、内部链接与锚点 ----------
let internalCount = 0;
let anchorCount = 0;
const idCache = new Map();

function idsIn(file) {
  if (!idCache.has(file)) {
    const ids = new Set();
    // 只认属性名严格等于 id：data-id / aria-id 不是页面锚点
    for (const tag of startTags(read(file))) {
      const attrs = attrsOf(tag);
      if (Object.hasOwn(attrs, 'id')) ids.add(decodeHtml(attrs.id.trim()));
    }
    idCache.set(file, ids);
  }
  return idCache.get(file);
}

function mapTarget(relPath) {
  const clean = path.posix.normalize(relPath);
  if (!clean.startsWith('/')) return null;
  const candidate =
    clean === '/'
      ? path.join(DIST, 'index.html')
      : clean.endsWith('/')
        ? path.join(DIST, clean.slice(1), 'index.html')
        : path.posix.extname(clean)
          ? path.join(DIST, clean.slice(1))
          : null;
  if (candidate) return candidate;
  const asDir = path.join(DIST, clean.slice(1), 'index.html');
  if (isFile(asDir)) return asDir;
  return path.join(DIST, `${clean.slice(1)}.html`);
}

for (const file of htmlFiles) {
  const html = read(file);
  const pageUrl = new URL(`https://check.invalid${BASE}/${relDist(file)}`);

  for (const raw of linkAttrs(html)) {
    if (!raw) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) continue;

    let hash = '';
    let value = raw;
    const hashAt = value.indexOf('#');
    if (hashAt >= 0) {
      hash = value.slice(hashAt + 1);
      value = value.slice(0, hashAt);
    }
    const queryAt = value.indexOf('?');
    if (queryAt >= 0) value = value.slice(0, queryAt);
    if (!value && !hash) continue;

    let decodedPath;
    if (value.startsWith('/')) {
      if (BASE_PATH_DECODED && value !== BASE && !value.startsWith(`${BASE}/`)) {
        fail('links', relDist(file), `根绝对链接缺少 ${BASE} 前缀：${raw}`);
        continue;
      }
      decodedPath = decodeSafe(value);
    } else {
      const target = new URL(value || '', pageUrl);
      decodedPath = decodeSafe(target.pathname);
    }
    if (decodedPath === null) {
      fail('links', relDist(file), `URL 编码无法解码：${raw}`);
      continue;
    }
    internalCount += 1;

    let relPath = decodedPath;
    if (BASE_PATH_DECODED) {
      if (relPath === BASE_PATH_DECODED) relPath = '/';
      else if (relPath.startsWith(`${BASE_PATH_DECODED}/`)) relPath = relPath.slice(BASE_PATH_DECODED.length);
      else {
        fail('links', relDist(file), `站内路径不在 ${BASE} 下：${raw}`);
        continue;
      }
    }
    const targetFile = mapTarget(relPath);
    if (!targetFile) {
      fail('links', relDist(file), `无法解析站内链接：${raw}`);
      continue;
    }
    if (targetFile !== DIST && !targetFile.startsWith(`${DIST}${path.sep}`)) {
      fail('links', relDist(file), `链接解析越出 dist：${raw}`);
      continue;
    }
    if (!isFile(targetFile)) {
      fail('links', relDist(file), `${raw} -> ${relDist(targetFile)} 不存在`);
      continue;
    }
    if (!hash) continue;

    const decodedHash = decodeSafe(hash);
    if (decodedHash === null) {
      fail('links', relDist(file), `锚点编码无法解码：#${hash}`);
      continue;
    }
    anchorCount += 1;
    // 文件/SVG/PDF 的 fragment 不是页面锚点，无法用 HTML id 校验；只查文件存在性。
    if (!targetFile.endsWith('.html')) continue;
    if (!idsIn(targetFile).has(decodeHtml(decodedHash))) {
      fail('links', relDist(file), `锚点 #${decodedHash} 在 ${relDist(targetFile)} 中找不到 id`);
    }
  }
}

// ---------- 3.4 草稿泄漏 ----------
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

const posts = [];
if (!fs.existsSync(POSTS_DIR)) {
  fail('drafts', 'src/content/posts', '文章目录不存在');
} else {
  for (const file of walk(POSTS_DIR).filter((p) => p.endsWith('.md'))) {
    const fm = frontmatter(read(file));
    posts.push({
      slug: path.relative(POSTS_DIR, file).split(path.sep).join('/').replace(/\.md$/, ''),
      draft: /^\s*draft\s*:\s*(['"]?)true\1\s*(?:#.*)?$/im.test(fm),
      source: path.relative(ROOT, file).split(path.sep).join('/'),
    });
  }
}
const published = posts.filter((p) => !p.draft);
const drafts = posts.filter((p) => p.draft);
const encodeSlug = (slug) => slug.split('/').map(encodeURIComponent).join('/');
const postUrl = (post) => `${SITE_ROOT}posts/${encodeSlug(post.slug)}/`;

const leakTargets = htmlFiles.filter((p) => !p.startsWith(`${DIST}${path.sep}posts${path.sep}`));
for (const p of [
  path.join(DIST, 'rss.xml'),
  path.join(DIST, 'sitemap-0.xml'),
  path.join(DIST, 'notes', 'rss.xml'),
]) {
  if (isFile(p)) leakTargets.push(p);
}
for (const draft of drafts) {
  const page = path.join(DIST, 'posts', ...draft.slug.split('/'), 'index.html');
  if (isFile(page)) {
    fail('drafts', relDist(page), `草稿页被生成：${draft.slug}（${draft.source}）`);
  }
  // 只按 URL 判定：标题子串会命中导航/页脚里的常见词（如“订阅”）造成误报；
  // 真实泄漏到列表/RSS 时一定伴随文章 URL。
  const needles = [`posts/${draft.slug}/`, `posts/${encodeSlug(draft.slug)}/`];
  for (const target of leakTargets) {
    const hay = read(target);
    if (needles.some((n) => hay.includes(n))) {
      fail('drafts', relDist(target), `包含草稿 ${draft.slug}（${draft.source}）`);
    }
  }
}

// ---------- 3.5 碎碎念 / now：源扫描与草稿泄漏 ----------
// notes 只收顶层 *.md（与 glob({ pattern: '*.md' }) 一致），`_` 前缀是模板、永远不是 note
const NOTE_ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const notes = [];
if (!fs.existsSync(NOTES_DIR)) {
  fail('drafts', 'src/content/notes', '碎碎念目录不存在');
} else {
  for (const entry of fs.readdirSync(NOTES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (entry.name.startsWith('_')) continue;
    const file = path.join(NOTES_DIR, entry.name);
    const id = entry.name.replace(/\.md$/, '');
    const source = path.relative(ROOT, file).split(path.sep).join('/');
    if (!NOTE_ID_RE.test(id)) {
      fail('drafts', source, '碎碎念文件名非法（须为 YYYY-MM-DD-slug.md）');
      continue;
    }
    const fm = frontmatter(read(file));
    notes.push({
      id,
      draft: /^\s*draft\s*:\s*(['"]?)true\1\s*(?:#.*)?$/im.test(fm),
      source,
    });
  }
}
const publishedNotes = notes.filter((n) => !n.draft);
const draftNotes = notes.filter((n) => n.draft);

/** 精确取开始标签上的 id 属性值（data-id 之类不算） */
function hasIdValue(file, value) {
  for (const tag of startTags(read(file))) {
    const attrs = attrsOf(tag);
    if (Object.hasOwn(attrs, 'id') && decodeHtml(attrs.id.trim()) === value) return true;
  }
  return false;
}

// 草稿 note 的锚点不得出现在任何 HTML / feed / sitemap 里
for (const draft of draftNotes) {
  const anchor = `n-${draft.id}`;
  for (const target of leakTargets) {
    if (hasIdValue(target, anchor)) {
      fail('drafts', relDist(target), `包含草稿 note ${draft.id} 的锚点`);
    }
    if (read(target).includes(`#${anchor}`)) {
      fail('drafts', relDist(target), `包含草稿 note ${draft.id} 的锚点链接`);
    }
  }
}

// now.md：草稿时 /now/ 只能走空状态，不渲染状态行与正文
const nowSource = path.join(PAGES_DIR, 'now.md');
let nowDraft = false;
if (!isFile(nowSource)) {
  fail('drafts', 'src/content/pages/now.md', 'now.md 缺失');
} else {
  const fm = frontmatter(read(nowSource));
  nowDraft = /^\s*draft\s*:\s*(['"]?)true\1\s*(?:#.*)?$/im.test(fm);
}

if (nowDraft) {
  const nowPage = path.join(DIST, 'now', 'index.html');
  if (isFile(nowPage)) {
    for (const tag of startTags(read(nowPage))) {
      const classes = (attrsOf(tag).class ?? '').split(/\s+/).filter(Boolean);
      if (classes.includes('now-status') || classes.includes('now-body')) {
        fail('drafts', relDist(nowPage), '渲染了草稿 now 的状态/正文');
        break;
      }
    }
  }
}

// ---------- 3.6 canonical / OG ----------
const postPages = new Set(
  htmlFiles.filter((p) => relDist(p).startsWith('posts/') && relDist(p).endsWith('/index.html')),
);

/** 目录式输出 index.html 对应的绝对 URL；扁平 404.html 不参与 canonical 校验 */
function expectedCanonical(file) {
  const rel = relDist(file);
  if (rel === '404.html' || rel === '404/index.html') return null;
  if (!rel.endsWith('/index.html')) return null;
  const dir = rel.slice(0, -'index.html'.length);
  return `${SITE_ROOT}${encodeURI(dir)}`;
}

for (const file of htmlFiles) {
  const expected = expectedCanonical(file);
  if (expected === null) continue;
  const rel = relDist(file);
  const html = read(file);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrsOf(m[0]));

  const canonical = links.find((l) => l.rel?.toLowerCase() === 'canonical')?.href;
  if (!canonical) {
    fail('seo', rel, '缺少 canonical');
  } else if (!canonical.startsWith(SITE_ROOT)) {
    fail('seo', rel, `canonical 不是 ${SITE_ROOT} 下的绝对地址：${canonical}`);
  } else if (/[?#]/.test(canonical)) {
    fail('seo', rel, `canonical 不应包含 query/hash：${canonical}`);
  } else if (canonical !== expected) {
    fail('seo', rel, `canonical 与页面地址不一致：期望 ${expected}，实际 ${canonical}`);
  }

  if (!postPages.has(file)) continue;
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  if (!metas.some((m) => m.property === 'og:title' && m.content)) fail('seo', rel, '缺少 og:title');
  if (!metas.some((m) => m.property === 'og:description' && m.content)) fail('seo', rel, '缺少 og:description');
  if (!metas.some((m) => m.property === 'og:image' && m.content)) fail('seo', rel, '缺少 og:image');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail('seo', rel, '缺少 <title>');
  if (!metas.some((m) => m.name === 'description' && m.content)) fail('seo', rel, '缺少 meta description');
}

const notFoundPage = path.join(DIST, '404.html');
if (isFile(notFoundPage)) {
  const html = read(notFoundPage);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrsOf(m[0]));
  if (!metas.some((m) => m.name === 'robots' && /noindex/i.test(m.content ?? ''))) {
    fail('seo', '404.html', '缺少 robots noindex');
  }
  if (links.some((l) => l.rel?.toLowerCase() === 'canonical')) {
    fail('seo', '404.html', '不应有 canonical');
  }
  if (
    metas.some(
      (m) => (m.property || '').startsWith('og:') || (m.name || '').startsWith('twitter:'),
    )
  ) {
    fail('seo', '404.html', '不应有 OG/Twitter 卡片');
  }
}

// ---------- 3.7 RSS / sitemap ----------
const rssPath = path.join(DIST, 'rss.xml');
const sitemapPath = path.join(DIST, 'sitemap-0.xml');
const sitemapIndexPath = path.join(DIST, 'sitemap-index.xml');

if (isFile(rssPath)) {
  const rss = read(rssPath);
  if (!/<\?xml\b/.test(rss) || !/<rss\b/.test(rss) || !/<channel>/.test(rss)) {
    fail('rss', 'rss.xml', '缺少 XML 声明 / rss / channel');
  }
  for (const post of published) {
    const link = postUrl(post);
    if (!rss.includes(link)) fail('rss', 'rss.xml', `缺少已发布文章链接：${link}`);
  }
  // 主 feed 只发文章，不得混入碎碎念
  if (/#n-/.test(rss)) fail('rss', 'rss.xml', '不应包含碎碎念锚点');
  if (rss.includes(`${SITE_ROOT}notes/`)) fail('rss', 'rss.xml', '不应包含碎碎念页面链接');
}

// 碎碎念 feed：与 /notes/ 页面交叉校验
const notesRssPath = path.join(DIST, 'notes', 'rss.xml');
const notesPagePath = path.join(DIST, 'notes', 'index.html');
if (isFile(notesRssPath)) {
  const feed = read(notesRssPath);
  if (!/<\?xml\b/.test(feed) || !/<rss\b/.test(feed) || !/<channel>/.test(feed)) {
    fail('rss', 'notes/rss.xml', '缺少 XML 声明 / rss / channel');
  }
  const pageIds = isFile(notesPagePath) ? idsIn(notesPagePath) : new Set();
  // item 链接逐条精确比对：@astrojs/rss 会给相对链接补尾斜杠（#n-xxx → #n-xxx/），
  // 那样的锚点在页面上并不存在，必须在这里被拦下
  const itemLinks = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const link = m[1].match(/<link>([\s\S]*?)<\/link>/);
    return link ? link[1] : '';
  });

  for (const note of publishedNotes) {
    const expected = `${SITE_ROOT}notes/#n-${note.id}`;
    if (!itemLinks.includes(expected)) {
      fail('rss', 'notes/rss.xml', `缺少已发布碎碎念链接：${expected}`);
    }
  }
  for (const draft of draftNotes) {
    if (feed.includes(`#n-${draft.id}`)) {
      fail('rss', 'notes/rss.xml', `包含草稿碎碎念锚点：#n-${draft.id}`);
    }
  }
  // 每个 item 链接的锚点都必须能在 /notes/ 页面找到对应 id
  for (const link of itemLinks) {
    const hash = link.indexOf('#');
    if (hash < 0) {
      fail('rss', 'notes/rss.xml', `item 链接缺少锚点：${link}`);
      continue;
    }
    const anchor = link.slice(hash + 1);
    if (!pageIds.has(anchor)) {
      fail('rss', 'notes/rss.xml', `锚点 #${anchor} 在 notes/index.html 中找不到 id`);
    }
  }
  if (itemLinks.length !== publishedNotes.length) {
    fail(
      'rss',
      'notes/rss.xml',
      `item 数量与已发布碎碎念不一致：期望 ${publishedNotes.length}，实际 ${itemLinks.length}`,
    );
  }
}

// notes 页重复 id：锚点最密集，出问题最先在这里暴露
if (isFile(notesPagePath)) {
  const counts = new Map();
  for (const tag of startTags(read(notesPagePath))) {
    const attrs = attrsOf(tag);
    if (!Object.hasOwn(attrs, 'id')) continue;
    const id = decodeHtml(attrs.id.trim());
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (count > 1) fail('dom', 'notes/index.html', `重复 id: ${id}`);
  }
}

if (isFile(sitemapPath)) {
  const sitemap = read(sitemapPath);
  if (!sitemap.includes(SITE_ROOT)) fail('sitemap', 'sitemap-0.xml', `缺少站点根：${SITE_ROOT}`);
  const expected = new Set([
    SITE_ROOT,
    `${SITE_ROOT}about/`,
    `${SITE_ROOT}archive/`,
    `${SITE_ROOT}tags/`,
    `${SITE_ROOT}notes/`,
    `${SITE_ROOT}now/`,
  ]);
  for (const post of published) expected.add(postUrl(post));
  for (const file of htmlFiles) {
    const rel = relDist(file);
    if (/^tags\/[^/]+\/index\.html$/.test(rel)) {
      const tag = rel.slice('tags/'.length, -'/index.html'.length);
      expected.add(`${SITE_ROOT}tags/${encodeURIComponent(tag)}/`);
    }
  }
  for (const url of expected) {
    if (!sitemap.includes(url)) fail('sitemap', 'sitemap-0.xml', `缺少页面：${url}`);
  }
  if (sitemap.includes('/404/')) fail('sitemap', 'sitemap-0.xml', '不应包含 /404/');
  if (/#n-/.test(sitemap)) fail('sitemap', 'sitemap-0.xml', '不应包含碎碎念锚点');
}

if (isFile(sitemapIndexPath)) {
  const index = read(sitemapIndexPath);
  if (!index.includes('sitemap-0.xml')) fail('sitemap', 'sitemap-index.xml', '缺少 sitemap-0.xml 引用');
}

// ---------- 3.8 体积预算 ----------
const rawSum = (arr) => arr.reduce((n, p) => n + fs.statSync(p).size, 0);
const gzipSum = (arr) => arr.reduce((n, p) => n + zlib.gzipSync(fs.readFileSync(p)).length, 0);

const cssSize = gzipSum(files.filter((p) => p.endsWith('.css')));
const jsSize = gzipSum(files.filter((p) => p.endsWith('.js')));
const fontSize = rawSum(files.filter((p) => /\.(woff2|woff|ttf)$/i.test(p)));
const maxHtml = Math.max(0, ...htmlFiles.map((p) => fs.statSync(p).size));
const distSize = rawSum(files);

const sizeMetrics = [
  { key: 'css', label: 'CSS', value: cssSize, limit: LIMITS.css, fmt: (b) => (b / KB).toFixed(1) },
  { key: 'js', label: 'JS', value: jsSize, limit: LIMITS.js, fmt: (b) => (b / KB).toFixed(1) },
  { key: 'fonts', label: 'fonts', value: fontSize, limit: LIMITS.fonts, fmt: (b) => (b / MB).toFixed(2) },
  { key: 'html', label: 'max HTML', value: maxHtml, limit: LIMITS.html, fmt: (b) => (b / KB).toFixed(1) },
  { key: 'dist', label: 'dist', value: distSize, limit: LIMITS.dist, fmt: (b) => (b / MB).toFixed(1) },
];
for (const m of sizeMetrics) {
  if (m.value > m.limit) {
    fail(
      'size',
      m.label,
      `当前 ${m.fmt(m.value)} 上限 ${m.fmt(m.limit)}，超出 ${m.fmt(m.value - m.limit)}`,
    );
  }
}

let inlineJs = 0;
const indexHtml = path.join(DIST, 'index.html');
if (isFile(indexHtml)) {
  for (const m of read(indexHtml).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/i.test(m[1])) inlineJs += Buffer.byteLength(m[2]);
  }
}

// ---------- 3.9 输出 ----------
const status = (check) => (failCount(check) > 0 ? 'FAIL' : 'OK');
const sizeLine = sizeMetrics
  .map((m) => `${m.label} ${m.fmt(m.value)}/${m.fmt(m.limit)} ${m.key === 'fonts' || m.key === 'dist' ? 'MB' : 'KB'}`)
  .join(' · ');

console.log(`[check-dist] base=${BASE || '/'} files=${files.length}`);
console.log(
  `  artifacts  ${missingArtifacts.length > 0 ? `FAIL (missing: ${missingArtifacts.join(', ')})` : `OK (${REQUIRED.length}/${REQUIRED.length})`}`,
);
console.log(`  links      ${status('links')} (internal=${internalCount}, anchors=${anchorCount})`);
console.log(`  drafts     ${status('drafts')} (published=${published.length}, notes=${publishedNotes.length})`);
console.log(`  seo        ${status('seo')} (posts=${postPages.size})`);
console.log(`  rss/sitemap ${failCount('rss') + failCount('sitemap') > 0 ? 'FAIL' : 'OK'}`);
console.log(`  dom        ${status('dom')} (notes)`);
console.log(`  size       ${status('size') === 'FAIL' ? 'FAIL · ' : ''}${sizeLine}`);
console.log(`  inline JS  ${(inlineJs / KB).toFixed(1)} KB (theme script, not budgeted)`);

if (failures.length > 0) {
  for (const f of failures) console.log(`FAIL ${f.check} ${f.file} ${f.detail}`);
  console.log(`  result     FAIL (${failures.length} 项)`);
  process.exitCode = 1;
} else {
  console.log('  result     PASS');
}

export const SITE = {
  title: '二进制与诗',
  tagline: '一个佛大计算机专业学生的笔记本站',
  author: '小鑫',
  handle: '@Xiaoxin',
  description:
    '计算机系统、算法题解与开发工具的个人笔记。',
  year: new Date().getUTCFullYear(),
};

export const NAV = [
  { href: '/', label: '目录', key: 'home' },
  { href: '/tags', label: '标签', key: 'tags' },
  { href: '/about', label: '关于', key: 'about' },
];

export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/Lucky-Xiaoxin' },
  { label: 'Email', href: 'mailto:yggdya@163.com' },
  { label: 'RSS', href: '/rss.xml' },
];

/** 标签类别 -> 几何描边形状，供列表徽章使用 */
export type Shape = 'triangle' | 'hexagon' | 'square' | 'rhombus' | 'semicircle' | 'circle';

const TAG_SHAPE: Record<string, Shape> = {
  算法: 'triangle',
  题解: 'triangle',
  单调栈: 'triangle',
  计算机系统: 'hexagon',
  CSAPP: 'hexagon',
  读书笔记: 'hexagon',
  Go: 'square',
  后端: 'square',
  课程实验: 'square',
  建站: 'rhombus',
  Astro: 'rhombus',
  'GitHub Pages': 'rhombus',
  工具: 'semicircle',
  'Git': 'semicircle',
  'GitHub': 'semicircle',
  Linux: 'semicircle',
  效率: 'semicircle',
  其它: 'hexagon',
};

const warnedTags = new Set<string>();

export function shapeFor(tag?: string): Shape {
  if (!tag) return 'circle';
  const shape = TAG_SHAPE[tag];
  if (!shape) {
    if (!warnedTags.has(tag)) {
      warnedTags.add(tag);
      console.warn(`[TAG_SHAPE] 标签「${tag}」未登记形状，徽章回退为 circle；请在 src/const.ts 的 TAG_SHAPE 中登记`);
    }
    return 'circle';
  }
  return shape;
}

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** 拼接带 GitHub Pages 子路径前缀的内部链接 */
export function u(path = '/') {
  if (path === '/') return base === '' ? '/' : `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (/\.[a-z0-9]+$/i.test(p)) return `${base}${p}`;
  return `${base}${p.replace(/\/$/, '')}/`;
}

/** 绝对地址（http:/https:/mailto: 等）原样使用，站内路径补上 Pages 子路径前缀 */
export function resolveHref(href: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) ? href : u(href);
}

// frontmatter 的 date-only 会被 z.coerce.date() 解析为 UTC 零点，
// 必须用 UTC getter 渲染，否则构建机时区为负时日期会整体少一天
export function formatDay(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** 发布日期倒序；同日按 pubTime（零填充 HH:MM 可字典序比较）倒序，再按 id 定序 */
export function byNewest(
  a: { id: string; data: { pubDate: Date; pubTime?: string } },
  b: { id: string; data: { pubDate: Date; pubTime?: string } },
) {
  return (
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
    (b.data.pubTime ?? '').localeCompare(a.data.pubTime ?? '') ||
    b.id.localeCompare(a.id)
  );
}

/** 中文按 ~400 字/分钟、英文按 ~220 词/分钟估算 */
export function readingTime(body?: string) {
  const text = body ?? '';
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

/** 印记内芯：由文章 id 哈希决定，红点落在内芯的特征点上（渲染在 Seal.astro） */
export type SealCore = 'ring' | 'tri' | 'diamond' | 'cross' | 'diag' | 'axis' | 'hline' | 'orb';

// 每种外框可用的内芯（按几何相容性取子集：红点/内芯完整落在框内才入选——
// triangle 剔除了 ring/diamond（穿框/红点越框），rhombus 剔除 hline，hexagon 剔除 diag；
// semicircle 进深最小，装不下大内芯，其 tri/axis 的红点由 Seal.astro 按框覆写到低位）。
// 名单顺序是"确定性映射"的一部分：重排/增删会换掉既有文章的印记——本分支上线前是最后的免费调整窗口。
const SEAL_CORES: Record<Shape, SealCore[]> = {
  circle: ['tri', 'diamond', 'cross', 'diag', 'axis', 'hline', 'ring', 'orb'],
  square: ['tri', 'diamond', 'cross', 'diag', 'axis', 'hline', 'ring', 'orb'],
  hexagon: ['tri', 'diamond', 'cross', 'ring', 'hline', 'axis', 'orb'],
  rhombus: ['ring', 'diamond', 'cross', 'axis', 'orb'],
  triangle: ['tri', 'axis', 'cross', 'hline', 'orb'],
  semicircle: ['orb', 'tri', 'hline', 'axis'],
};

/** 由文章 id 算稳定哈希（同一篇永远同一枚印记） */
function sealHash(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

/** 文章印记：外框 = 分类形状，内芯 = 文章哈希选一枚 */
export function sealFor(id: string, tag?: string) {
  const shape = shapeFor(tag);
  const cores = SEAL_CORES[shape];
  return { shape, core: cores[sealHash(id) % cores.length] };
}

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

/** 发布日期倒序；同日文章按 id 定序，避免顺序随 getCollection 插入序漂移 */
export function byNewest(
  a: { id: string; data: { pubDate: Date } },
  b: { id: string; data: { pubDate: Date } },
) {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || b.id.localeCompare(a.id);
}

/** 中文按 ~400 字/分钟、英文按 ~220 词/分钟估算 */
export function readingTime(body?: string) {
  const text = body ?? '';
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

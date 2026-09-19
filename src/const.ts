export const SITE = {
  title: '二进制与诗',
  tagline: '一个计算机专业学生的笔记本站',
  author: '张三',
  handle: '@zhangsan',
  description:
    '计算机系统、算法题解与开发工具的个人笔记。记录课堂上不会讲清楚的那些细节。',
  year: 2026,
};

export const NAV = [
  { href: '/', label: '目录', key: 'home' },
  { href: '/tags', label: '标签', key: 'tags' },
  { href: '/about', label: '关于', key: 'about' },
];

export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/zhangsan' },
  { label: 'Email', href: 'mailto:zhangsan@example.com' },
  { label: 'RSS', href: '/rss.xml' },
];

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** 拼接带 GitHub Pages 子路径前缀的内部链接 */
export function u(path = '/') {
  if (path === '/') return base === '' ? '/' : `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (/\.[a-z0-9]+$/i.test(p)) return `${base}${p}`;
  return `${base}${p.replace(/\/$/, '')}/`;
}

export function formatDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** 中文按 ~400 字/分钟、英文按 ~220 词/分钟估算 */
export function readingTime(body: string) {
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (body.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

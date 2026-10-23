# P0a 契约：内容数据层与草稿预览

> 状态：已验收 · 2026-10-23（P0a 已实现；复核见 `review.md`）。本文定义 API/行为/边界。

## 1. 目标

- 所有页面/RSS 从同一个 `src/lib/posts.ts` 取文章，避免“首页包含草稿、RSS 不包含、标签页排序不同”这类分叉。
- 草稿只在 dev 可预览；build、首页、标签、RSS、sitemap 都不出现。
- P0 不改视觉；唯一可见变化是 dev 草稿页的“草稿预览”标记。

## 2. 数据层 API

文件：`src/lib/posts.ts`。类型使用 Astro 的 `CollectionEntry<'posts'>`。

```ts
export type Post = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<Post[]>;
export async function getPostsForStaticPaths(): Promise<Post[]>;
export async function getPostBySlug(
  slug: string,
  opts?: { includeDrafts?: boolean },
): Promise<Post | undefined>;
export async function getAdjacentPosts(
  slug: string,
  opts?: { includeDrafts?: boolean },
): Promise<{ older?: Post; newer?: Post }>;
export interface TagSummary {
  tag: string;
  count: number;
  latest: Post;
}
export async function getAllTags(): Promise<TagSummary[]>;
```

### 2.1 `getPublishedPosts()`

- `getCollection('posts', ({ data }) => !data.draft)`。
- 用 `byNewest` 排序（`pubDate` 倒序 → `pubTime` 倒序 → id 倒序）。
- 所有“面向读者”的列表/RSS 都用它：首页、标签索引/详情、RSS、文章页相邻。
- 不返回草稿；dev/build 行为一致。

### 2.2 `getPostsForStaticPaths()`

- 仅用于 `getStaticPaths`：
  - `import.meta.env.DEV` 为 true → 包含草稿；
  - build → 只包含已发布。
- 必须显式命名，避免有人误用它做列表。
- 返回排序后的数组；草稿也参与排序（预览时能看到真实位置）。
- **不要**把 `import.meta.env.DEV` 的默认值藏进通用函数；只在 `getStaticPaths` 调用点决定。

### 2.3 `getPostBySlug(slug, opts)`

- `includeDrafts` 默认 false。
- 从 `getPostsForStaticPaths()`（dev 包含草稿）或 `getPublishedPosts()` 中查找；建议统一用 `getPostsForStaticPaths({ includeDrafts })` 的内部函数，避免两套排序。
- 返回 `Post | undefined`；文章页找不到时应该 404（Astro 会处理未生成路径；dev 下若直接访问不存在 slug，应返回 404 而不是崩溃）。
- 草稿页在 dev 生成时，必须能通过此函数拿到 `post`，否则文章页顶部/正文会 undefined。

### 2.4 `getAdjacentPosts(slug, opts)`

- 在同一列表（发布列表或 dev 含草稿列表）中按 `byNewest` 找当前项：
  - `older = list[index + 1]`（更早）
  - `newer = index > 0 ? list[index - 1] : undefined`
- 当前 slug 不在列表中 → `{}`，页面不渲染对应方向。
- 草稿页在 dev 下可与其它草稿相邻；build 不会出现草稿。

### 2.5 `getAllTags()`

- 基于 `getPublishedPosts()`。
- 聚合每个 tag 的 `count` 与 `latest`（按 `byNewest` 的第一篇）。
- 排序：count 倒序 → `localeCompare(zh)` 升序（与现有标签页一致）。
- 不包含草稿的标签/计数。
- 标签详情页仍用 `getPublishedPosts().filter(post => post.data.tags.includes(tag))`；不要按 `latest` 反推列表。

## 3. 调用点改造

| 文件 | 现在 | 改为 |
| --- | --- | --- |
| `src/pages/index.astro` | `getCollection` + filter + sort | `getPublishedPosts()`；`latest = posts[0]` |
| `src/pages/posts/[...slug].astro` | 发布列表 + `findIndex` | `getPostsForStaticPaths()` 生成路径；`getPostBySlug(slug, { includeDrafts: import.meta.env.DEV })`；`getAdjacentPosts(...)` 同 flag |
| `src/pages/tags/index.astro` | `getCollection` + 手写聚合 | `getAllTags()` |
| `src/pages/tags/[tag].astro` | `getCollection` + filter/sort | `getPublishedPosts()` + filter；`getStaticPaths` 的 tag 集合来自 `getPublishedPosts()` |
| `src/pages/rss.xml.js` | `getCollection` + filter/sort | `getPublishedPosts()` |

- 其他页面（about/404）不涉及文章集合。
- 检查 `getCollection` 在 `src/pages` 下是否只剩数据层调用；允许 `getCollection` 出现在 `src/lib/posts.ts`。
- 保留 `const.ts` 的 `byNewest`/`readingTime`/`formatDay`；不把站点常量搬进数据层。

## 4. 草稿预览行为

### 4.1 dev

- 访问 `/posts/<draft-slug>/` 返回 200。
- 页面显示“草稿预览”标记（建议放在文章头部 kicker 附近，使用现有 `.label`/`.section-note`，**不新增永久 CSS**；P1d 再按设计稿调整）。
- 首页、标签索引/详情、RSS、sitemap 仍不显示草稿。
- 相邻文章可以包含草稿（因为 dev 列表包含草稿），方便连续预览。
- 草稿的 tag 链接可点，但标签页不会列出它。

### 4.2 build

- 不为草稿生成 `dist/posts/<slug>/index.html`。
- 草稿不出现在首页/标签/RSS/sitemap。
- 构建产物中不能出现草稿标题/正文；`check-dist` 用 frontmatter 的 slug 对照 URL 与草稿页验证（不按标题子串，避免常见词误报）。
- 生产 404 对草稿 URL 返回 404。

### 4.3 边界

- `draft` 缺省 = false（schema 默认）。
- `draft: true` 的文章仍参与 `getPostsForStaticPaths()` 的 dev 排序，但 build 排除。
- 草稿的 `pubDate` 在未来：仍按现有行为（不隐藏）；P0 不引入调度语义。
- 草稿缺 `description`/`title`：schema 已经会报错；P0 不改 schema。
- 草稿被 `check-dist` 检测到 → 失败，并打印 slug + frontmatter 文件路径。
- 不要用“文件名前缀 `_`”或“git 分支”代替 draft 字段；唯一事实源是 frontmatter `draft`。

## 5. README/AGENTS 修正

### README 第 25 行附近

改为类似：

> 没写完设 `draft: true`——草稿不进目录页、不进标签、不进 RSS、不生成线上页面；`npm run dev` 可直接打开 `/posts/<文件名>/` 预览，页面会显示“草稿预览”。

### AGENTS 增补

- 所有文章读取走 `src/lib/posts.ts`；不要在页面里重复 `getCollection` 过滤/排序。
- 草稿预览只在 dev；build 不生成；不要为了预览把 `draft` 改成 false 再改回来。
- P0 根因：`getStaticPaths` 必须用 `getPostsForStaticPaths()`；文章页查找必须传 `includeDrafts: import.meta.env.DEV`。

## 6. 验收

- `rg "getCollection\\('posts'" src` 只命中 `src/lib/posts.ts`（或明确的数据层文件）。
- dev 临时草稿：路由 200、有标记；首页/标签/RSS 无；build 无 `dist/posts/<slug>/`。
- 现有 4 篇的排序、标签计数、RSS 条目、上下篇与改前一致。
- 无 CSS/JS 行为变化；除了 dev 草稿标记，没有视觉 diff。
- `npm run check` 0/0。

## 7. 测试数据

- 使用临时文件 `src/content/posts/__p0-draft-preview-test.md`，`draft: true`，测完删除；不要提交。
- 或复制一篇现有文章改 slug/title，但必须保证 `draft: true` 且测试后清理。
- 不在生产内容中留下测试草稿。

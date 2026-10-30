# P1a UI 契约：tokens、外壳、归档/标签/404

> 状态：已验收 · 2026-10-23（实现完成；**宽度 A 已确认**；用户本地验收通过）
> 上游：`design-contract.md`、`p0/review.md`
> 下游：P1b notes/now、P1c 首页、P1d 文章页
> Owner：实现规划师
> 复核/证据：`review.md`、`screens/`

## 1. 设计来源与边界

- 视觉来源：`docs/next-phase/design/d1/` 方向一「卷首」；`assets/base.css` 只作参考，**不要整份 import/替换** `src/styles/global.css`。
- 只实现“壳 + 归档/标签/404/about”；首页卷首/文章正文/notes/now 留给后续。
- 不新增字体/色相/第三方脚本；不新增运行时 JS。

## 2. Tokens

| Token | 值 | 备注 |
| --- | --- | --- |
| `--measure` | `42rem` | 正文，保持 |
| `--mid` | `46rem` | 归档/标签/关于/404；P1a 唯一启用的新宽度 |
| `--wide` | `58rem` | P1c/P1d 才启用；P1a 先定义 |
| `--gutter` | `clamp(1.25rem, 6vw, 4.5rem)` | 从 `1.5rem/7vw/6rem` 改窄；全站回归 |
| `--bleed` | `clamp(0.75rem, 4vw, 3rem)` | 技术内容突破量；与设计稿一致 |
| `--ease` | `cubic-bezier(0.2, 0.6, 0.2, 1)` | 新过渡统一用；不新增动画 |

- 颜色/字体族/字号基线不变；`body` 行高保持 1.8，`.prose` 保持 1.95（不采用设计稿 base.css 的 body 1.9）。
- `--measure` 是**内容列宽**：旧 `.shell` 把 `max-width: 42rem` 当盒宽，1440 下正文实际只有 30rem；P1a 改为 `max-width: calc(内容宽 + 2 × gutter)` 后正文回到 42rem（**用户 2026-10-23 选择 A 并在本地验收通过**）。
- 暗色 token 不变；新增组件只能消费 token。
- 所有新 CSS 加在 `global.css` 现有结构内，不复制第二套 `:root`。

## 3. Base 外壳

### `width` prop

- `Base.astro` 增加 `width?: 'measure' | 'mid' | 'wide'`，默认 `measure`。
- 页头、`main`、页脚使用**同一个** shell 宽度。**2026-10-30 前端评审 F2 已改为页头/页脚固定 `wide`、`main` 按页面分档；本段其余宽度语义不变。**
- **P1a 使用**：`/archive/`、`/tags/`、`/tags/[tag]/`、`/about/`、404 → `mid`。
- **P1a 不使用**：首页、文章页保持 `measure`；`wide` 只定义，P1c/P1d 再切。
- 理由：避免宽壳 + 旧内容区的半成品；首页/文章窄→宽的切换与内容改版同 PR。

### 页头 / 页脚 / 导航

- `masthead--full`：首页保留品牌 h1 + tagline；P1a 不改首页内容区。
- `masthead--compact`：内页品牌 a + 导航；隐藏 tagline/handle。
- 导航 4 项：目录 / 归档 / 标签 / 关于；`aria-current='page'` 正确。
- 页脚结构：版权 + 现有社交（GitHub/Email/RSS）+ 新布局；**notes/now 链接延后到 P1b**，P1a 不放死链。
- 320px：4 项导航不换行/不溢出；采用设计稿窄屏 gap/字号（`<=40rem` gap 1.25rem、`<=24rem` gap 0.9rem、字号 0.6875rem）。
- 主题开关、skip link、`main { flex:1 }`、短页页脚贴底保持不变。

## 4. PageHead

新增 `src/components/PageHead.astro`，用于归档/标签/关于/标签详情。

Props：

```ts
interface Props {
  kicker: string;          // 例如“归档 / ARCHIVE”
  title: string;           // h1
  description?: string;
  meta?: boolean;          // 是否渲染底部 meta 行；默认跟随 default slot
  // meta 用 slot 传入计数/说明；避免把具体页面文案写进组件
}
```

结构/样式：

- `<header class="page-head">`：kicker（红方块 + 大写）、h1、可选描述、`page-head__meta`（顶部 1px 墨线）。
- h1 必须唯一；页面内不再有第二个 h1。
- `page-head__meta` 放计数/最近更新/按钮；按钮用 `.btn`。**只有真有 meta 内容时传 `meta={true}`**；空数据页（0 文章/0 标签）传 `false`，否则只会留下一条空横线。
- 320/390 单列；描述 `max-width: 38rem`。

## 5. 基础组件

| 组件/类 | 规格 | 注意 |
| --- | --- | --- |
| `.btn` | 方角、1px 边框、mono 11px、min-height 2.5rem、hover 反色 | 不新增圆角/阴影 |
| `.btn--red` | 红边/红字，hover 红底白字 | 唯一红色按钮 |
| `.more` | 文字下划线 + 红箭头，hover 红字 | 用于“阅读全文/查看全部” |
| `.tag` / `.tag-list` | 保持现有方角描边标签 | 不改 `TAG_SHAPE`/Seal |
| `.tag-index` | 标签索引列表：徽章/名称/最近一篇/计数 | 替代 `.tagcloud`；移动端隐藏“最近” |
| `.page-head` | 见第 4 节 | 归档/标签/关于共用 |

- 触控热区 ≥44px（视觉尺寸可小）；焦点沿用红色 2px 外框。**2026-10-30 规模收敛：44px 只覆盖标签/按钮/主导航等主要触控目标；正文内联链接维持 24px（WCAG 2.5.8）。**
- 新组件不写死亮/暗颜色；需要暗色差异时走 token 或双入口同步。

## 6. 归档页 `/archive/`

- 页头：kicker `归档 / ARCHIVE`；h1“归档”；描述“按年月分组…”；meta“N 篇 · 年份范围 / 最近更新”。
- 年份：`h2` 大字（Bodoni）`3rem–4.6rem`，右上计数。
- 月份：`h3` 1.1rem，右上计数；月份下 1px 规则线。
- 列表：`ol.archive-list`，四列：
  - 编号（mono 红字）
  - 标题 + tags
  - 日期
  - 阅读时长
- 编号按全站时间倒序连续（01…NN），不是每年重排。
- 移动端（<=40rem）三列，隐藏阅读时长；标题可换行。
- 数据：`getArchiveGroups()`；按 UTC 年/月分组；年/月倒序；组内 `byNewest`。
- 空状态：无文章时不生成 `/archive/`？当前站点有文章；若为 0，页面显示“还没有文章”，不报错。
- 链接：`u('/posts/<id>/')`、标签 `u('/tags/<encoded>/')`。

### 数据 helper

在 `src/lib/posts.ts` 增加：

```ts
export interface ArchiveMonth {
  month: number;      // 1-12
  posts: Post[];      // byNewest
}
export interface ArchiveYear {
  year: number;       // UTC full year
  count: number;
  months: ArchiveMonth[];
}
export async function getArchiveGroups(): Promise<ArchiveYear[]>;
```

- 只用 `getPublishedPosts()`；不包含草稿。
- 年/月排序：年 desc、月 desc；组内 `byNewest`。
- 不把 `getCollection` 逻辑复制进页面。

## 7. 标签索引 `/tags/`

- 页头：kicker `索引 / TAGS`；h1“标签”；描述；meta“N 个标签 · M 篇文章”。
- 列表 `ul.tag-index`：每行 4 列：
  - 徽章（`Badge`，22px）
  - 标签名（链接）
  - 最近一篇（“最近” + 标题；超出省略）
  - 计数（mono，右对齐）
- 排序：计数 desc → `localeCompare(zh)` asc（与 `getAllTags` 一致）。
- 计数/最近一篇只算已发布文章；数据来自 `getAllTags()`。
- 移动端（<=40rem）三列，隐藏“最近”列。
- 标签 URL 使用 `encodeURIComponent`；不新增标签描述/专题页。

## 8. 标签详情 `/tags/[tag]/`

- 页头：kicker `标签 / TAG`；h1 `#<tag>`；描述“N 篇文章”；meta 最近更新。
- 列表：复用首页 `contents` 的紧凑版（`section-head` + `toc` 列表），不是 `PostList` 卡片。
- 数据：`getPostsByTag(tag)`；只含已发布；`byNewest`。
- `getStaticPaths` 只生成有文章的标签；不存在空标签页。
- canonical 由 Base 生成；页面 title `#tag · 二进制与诗`。
- 移动端：目录编号/日期/阅读时长折行；不横向溢出。
- 标签详情无独立设计稿，按本契约实现；如视觉 QA 发现与索引页不协调，优先调间距，不新造卡片。

### 数据 helper

```ts
export async function getPostsByTag(tag: string): Promise<Post[]>;
```

- 基于 `getPublishedPosts()`；filter tags includes tag；保持排序。
- 页面不要重复 filter/sort。

## 9. 关于 / 404

### 关于 `/about/`

- `width='mid'`；`PageHead` kicker `关于 / ABOUT`；h1“关于我”；`about-lead` + `.prose`。
- 文案/结构不改；不新增 notes/now 链接（P1b 路由存在后再加）。
- 联系链接沿用 `SOCIALS`/`resolveHref`。

### 404

- `width='mid'`；`masthead--compact`；保留 `notfound__mark` 的 `40[4]` 与“这个路径下没有文件”。
- 不生成 canonical/OG；保留 `robots noindex`。
- 320/390 不溢出；页脚贴底。

## 10. 暗色 / 打印 / 减少动效

- 暗色：新组件全用 token；若新增依赖规则（如按钮），入口①和入口②同步；不复制主题脚本。
- 打印：P1a 只保证现有规则不被破坏（强制亮色、隐藏主题开关/skip）；归档/标签页不出现暗底。P1e 再做完整打印规则。
- 减少动效：在 `global.css` 加全局 `prefers-reduced-motion: reduce` 规则（动画/过渡近乎关闭、`scroll-behavior:auto`），不影响主题初始状态。

## 11. CSS 合并规则

1. 只把需要的 token/组件规则合并进 `global.css`；不 import `docs/.../assets/base.css`，不复制第二套 `:root`/字体。
2. 新类名沿用设计稿（`.page-head`、`.tag-index`、`.archive-*`、`.btn`、`.more`），避免和旧类冲突。
3. 替换标签页后，`.tagcloud` 可删除；删除前 `rg` 确认无引用。`.index`/`.postlist` 仍被首页/旧标签详情使用，P1c/P1d 前不要删。
4. 不修改 `.prose`/Shiki/KaTeX/`.scroll-x` 原规则；只加新组件样式。
5. 暗色双入口逐字一致；新增暗色规则必须两边同步。
6. 字体子集：P1a 新增文案都在 `.astro` 内，现有扫描覆盖；P1b 再扩到 notes/pages。

## 12. 响应式验收

| 视口 | 重点 |
| --- | --- |
| 320 | 4 项导航不换行；PageHead h1/描述；归档/标签列表不横溢 |
| 390 | 导航/页脚；归档/标签行；关于 |
| 768 | `mid` 壳留白；归档四列是否够宽 |
| 1024 | `mid` 壳居中；标签索引最近一列 |
| 1440 | `mid` 壳最大宽度；页脚 |

- 亮/暗；禁用 JS；键盘 Tab；焦点可见。
- `npm run verify` 必须 PASS；所有新链接走 `u()`。
- 无新增 `.js` 产物；主题脚本仍内联。

## 13. 验收清单

- [ ] `--mid/--wide/--gutter/--ease` 落地；`--wide` 未误用于首页/文章。
- [ ] Base `width` 三档可用；P1a 只用 mid。
- [ ] 4 项导航 + active 正确；320 不换行。
- [ ] 页脚结构更新；notes/now 无死链。
- [ ] PageHead/btn/more/tag-index 样式与设计稿一致。
- [ ] `/archive/` 分组/编号/计数/链接正确。
- [ ] `/tags/` 索引/计数/最近一篇正确；移动端隐藏最近列。
- [ ] `/tags/[tag]/` 过滤/标题/canonical 正确；无空标签页。
- [ ] 0 文章/0 标签时 PageHead 不渲染空 meta 行（显式 `meta={false}`）。
- [ ] `/about/` 内容不变，只换壳。
- [ ] 404 noindex、无 canonical/OG。
- [ ] 暗色/打印基础/reduced-motion 正常。
- [ ] 无新增 JS/字体/色相；体积预算内。
- [x] 文档同步；用户本地验收通过（2026-10-23）。

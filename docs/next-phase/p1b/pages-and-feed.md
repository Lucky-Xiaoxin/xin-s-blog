# P1b 页面与 feed：`/notes/`、`/notes/rss.xml`、`/now/`

> 状态：已批准 · 2026-10-23（P1b 页面/feed 契约，待实施）
> 上游：`design-contract.md` §5.4/§7、`notes-contract.md` §4、`now-contract.md` §4/§6、`content-model.md`
> 下游：P1c 首页（notes/now 区块）、P1e SEO/a11y
> Owner：实现规划师
> 复核/证据：未开始

## 1. 总览

术语：**notes = 碎碎念**（`/notes/` 的短时间流，类似微博/朋友圈，一条 1–5 句，没有标题/标签）；**now = 现在页**（`/now/`，回答“我最近在干嘛”，覆盖更新）。

| 路由 | 壳 | 标题 | 是否主导航 | sitemap | RSS |
| --- | --- | --- | --- | --- | --- |
| `/notes/` | `mid`，compact 页头 | `碎碎念 · 二进制与诗` | 否 | 是 | 独立 `/notes/rss.xml`（无可见入口） |
| `/notes/rss.xml` | — | `碎碎念 · 二进制与诗` | — | 否（不要求） | — |
| `/now/` | `mid`，compact 页头 | `现在 · 二进制与诗` | 否 | 是 | 无 |

- 主导航仍为 **目录 / 归档 / 标签 / 关于** 四项；notes/now 只从页脚、about、notes 互链进入。
- 两页都零 JS；主题切换脚本仍由 Base 提供。
- 所有站内链接走 `u()`；feed 里的链接要带子路径。

## 2. `/notes/`

### 2.1 页面结构

```text
Base(size=compact, width=mid, title=碎碎念)
└─ PageHead(kicker=页边 / NOTES, title=碎碎念, description=固定文案)
   └─ meta（仅 published > 0）：N 条 · 最近更新 YYYY.MM.DD（不放 RSS 按钮）
└─ .note-stream
   └─ section.note-month[aria-labelledby=notes-YYYY-MM]
      ├─ h2.note-month__title#notes-YYYY-MM：YYYY 年 M 月
      └─ ol.note-list
         └─ li.note#n-<id>
            ├─ .note__meta：time.note__date（MM.DD）/ .note__time（可选）/ 草稿徽标（dev）
            └─ .note__body：渲染后的 Markdown + a.note__link（#）
└─ .notes-foot：想看我最近在做什么？→ /now/
```

### 2.2 数据与计数

- 列表用 `getNotesForPage()`：dev 含草稿，build 只含已发布。
- 页头计数/最近更新用 `getPublishedNotes()` 推导，**不把草稿算进去**；dev 有草稿时只在条目上显示徽标，不改页头数字。
- `published.length === 0`：
  - build 中列表为空 → 显示空状态：`还没有碎碎念。先去<a href={u('/now/')}>现在</a>看看我最近在做什么。`
  - `PageHead` 不渲染 meta 行（`meta={false}`）；页头本来就没有 RSS 按钮。
  - dev 中如果只有草稿，仍列出草稿（带徽标），不显示空状态；页头计数仍为 0。
  - 不显示空框、虚线占位或 0 条计数。
- 月份分组用 `groupNotesByMonth()`；不要在各页面重复分组逻辑。

### 2.3 条目渲染

- 日期：`<time class="note__date" datetime="YYYY-MM-DD">MM.DD</time>`；月/日补零，UTC getter。
- 时间：有 `time` 才渲染 `<span class="note__time">HH:MM</span>`；纯显示，不加时区。
- 草稿：dev 下在 meta 里加 `<span class="label" style="color:var(--red)">草稿预览</span>`（与文章页一致）；build 不会出现。
- 正文：frontmatter 里用 `render(note)` 预计算，模板中 `<note.Content />`；不要在模板里 `await`。
- 锚点链接：`<a class="note__link" href={`#${anchor}`} aria-label={`${M} 月 ${D} 日碎碎念的固定链接`}>#</a>`。
  - 热区 ≥44×44px（视觉字符可以小）；键盘焦点可见。
  - 不依赖 hover 才出现。
- 不显示 `N°`；不显示阅读时长/标签/标题。
- 正文里的 h1 不期望出现；如用户写了 h1，样式仍由 `.prose` 控制，但会在验收时记录（不自动改写内容）。

### 2.4 锚点与 `:target`

- `li.note` 的 id = `noteAnchor(note)` = `n-<id>`；全页唯一。
- `.note:target::before`：左侧 2px 红规线（`--red`），从 meta 顶部到正文底部；不改变布局宽度。
- `.note { scroll-margin-top: 2rem; }`：无 sticky 页头，但留出呼吸空间。
- 从 RSS/外部打开 `/notes/#n-...` 时，目标条目必须可见且不被页头遮住。
- 月份小节 id `notes-YYYY-MM` 只供页内跳转/aria，不对外承诺稳定；外部链接用 note 锚点。

### 2.5 feed 入口与交叉链接（用户 2026-10-23 已定）

- `/notes/rss.xml` 仍生成并受门禁校验，但**不放任何可见订阅入口**：页面不放按钮，页脚不加“碎碎念 RSS”，Base 也不新增第二个 `<link rel="alternate">`。
- Base 现有的 feed 自动发现和页脚 RSS 仍指主文章 feed `/rss.xml`，不改指向。
- 页面底部 `.notes-foot` 链到 `/now/`；不占主导航。

## 3. `/notes/rss.xml`

### 3.1 契约

- 路由：`src/pages/notes/rss.xml.js`，`export async function GET(context)`。
- 只含**已发布** notes；dev 也不混入草稿（feed 面向订阅者，不是预览）。
- feed 元信息：
  - `title`: `碎碎念 · 二进制与诗`
  - `description`: `短、带时间、随时记。`
  - `site`: `new URL(u('/notes/'), context.site)`
- item：
  - `title`: `formatDay(date)` + 可选 ` HH:MM`，如 `2026.10.22 19:40`；没有标题字段，日期就是标题。
  - `link`: `${u('/notes/')}#${noteAnchor(note)}`（带 `/xin-s-blog/` 子路径和锚点）。
  - `pubDate`: `note.data.date`（只到日期；**不把 time 合进 Date**，避免时区语义）。
  - `description`: `note.body` 原文（首版不渲染 Markdown/HTML）；短笔记足够。
- 0 条 notes：仍生成合法 feed（0 item）；不允许因为没有 note 就让路由 404。实施时先验证 `@astrojs/rss` 接受空 `items`；若库报错，改用手写的合法最小 RSS（channel 无 item），**不要造占位条目**。
- 主 `/rss.xml` 不改：只发文章，不混 notes；页脚 RSS 仍指它。

### 3.2 校验

- XML 声明/`<rss>`/`<channel>` 存在。
- 已发布 note 的锚点必须出现在 feed 中；草稿锚点不得出现。
- feed item 的每个 `#n-...` 必须在 `/notes/` 的 HTML 中存在（check-dist 交叉校验）。
- notes RSS 的 `pubDate` 与 note 的 `date` 一致（只比日期）。

## 4. `/now/`

### 4.1 页面结构

有已发布 now 且正文有小节：

```text
Base(size=compact, width=mid, title=现在, description=now.description)
└─ header.now-head
   ├─ p.kicker：现在 / NOW
   ├─ h1：now.title（默认“现在”）
   ├─ p.now-lead：now.description
   └─ p.now-status.meta：<i aria-hidden> + 最后更新于 YYYY.MM.DD（+ 草稿徽标，dev）
└─ .now-body.prose：渲染 now.md 正文
└─ p.now-foot：这份状态每月更新一次。带日期的小事写在 → /notes/
```

有已发布 now 但正文为空（**首版：用户已定单行状态 `emo中……`**）：

```text
Base(size=compact, width=mid, title=现在, description=emo中……)
└─ header.now-head
   ├─ p.kicker：现在 / NOW
   ├─ h1：现在
   ├─ p.now-lead：emo中……
   └─ p.now-status.meta：<i aria-hidden> + 最后更新于 YYYY.MM.DD
（不渲染 .now-body / .now-foot；不留空框）
```

无已发布 now（build 中 draft/缺失，或 dev 中缺失）：

```text
header.now-head
├─ p.kicker：现在 / NOW
├─ h1：现在
└─ p.now-lead：这一页还没写。
p.empty-state：先去 <a /about/>关于</a> 或 <a /notes/>碎碎念</a>。
```

- 空状态**不显示** `.now-status`、`.now-body`、任何“最后更新于”日期；这是 check-dist 的草稿泄漏哨兵。
- 正文为空但已发布的 now 仍显示 `.now-status`（最后更新），只是没有 `.now-body`/`.now-foot`。
- dev 中 `now.md` 为 draft 时可预览正文，页头加“草稿预览”；build 中同一文件只走空状态。
- 不把 now 做成简历/仪表盘；首版就是单行状态。以后想分节，正文写 4–6 个 `##`（在学/在做/在读/最近），每节 1–3 条，两列样式自动启用。

### 4.2 两列与编号（实现决策，用户 2026-10-23 接受）

- 仅在**正文有小节**时生效；首版正文为空，不触发分栏。
- `.now-body.prose` 桌面 `column-count: 2`，`column-gap: clamp(2rem, 5vw, 4rem)`；40rem 以下 `column-count: 1`。
- `h2` 用 CSS counter 编号 `01…`：`.now-body.prose { counter-reset: now-section; }`，`h2::before { content: counter(now-section, decimal-leading-zero); ... }`，编号 `aria-hidden` 语义由伪元素承担（不读屏）。
- `h2 { break-after: avoid; }`；`ul`、`p` `break-inside: avoid`，减少分栏断裂。
- 不新增 rehype 插件、不要求作者手写 `<section>`；Markdown 顺序即阅读顺序。允许与设计稿的 2×2 网格存在分栏差异，记录在 `review.md`。
- 打印时 `column-count: 1`，避免 PDF 分栏错位。

### 4.3 日期与标题

- `updatedDate` 用 UTC 渲染 `YYYY.MM.DD`（`formatDay`）。
- `<h1>` 用 frontmatter `title`；schema 要求非空，模板固定“现在”。
- `<title>` 由 Base 拼成 `现在 · 二进制与诗`；description 用 frontmatter。
- 不做 JSON-LD、不做 now RSS、不做历史版本。

## 5. 页脚与 about 入口

### 5.1 `src/const.ts`

新增：

```ts
export const PAGE_LINKS = [
  { label: '碎碎念', href: '/notes' },
  { label: '现在', href: '/now' },
];
```

- `SOCIALS` 保持 `GitHub / Email / RSS` 不变；**不要把页面链接塞进 SOCIALS**。
- Base 页脚渲染 `[...PAGE_LINKS, ...SOCIALS]`，分隔符逻辑沿用现有 `i > 0` 方案。
- 最终顺序：碎碎念 / 现在 / GitHub / Email / RSS。

### 5.2 about

在“这个站点”段落 RSS 句后补一句（不改现有段落结构）：

> 带日期的小事写在<a href={u('/notes/')}>碎碎念</a>里，当前状态在<a href={u('/now/')}>现在</a>。

- “联系我”仍只列 `SOCIALS`。
- 不新增 about 小节，避免页面变长。

## 6. 样式规格（合并进 `global.css`，不替换）

### 6.1 notes

| 选择器 | 规格 |
| --- | --- |
| `.note-month` | 月份之间 `margin-top: clamp(2.5rem, 5vw, 3.5rem)` |
| `.note-month__title` | `font-family: var(--font-display)`；`font-size: clamp(1.35rem, 3vw, 1.6rem)`；`border-top: 1px solid var(--ink)`；`padding-top: 1rem` |
| `.note-list` | `list-style: none; margin: 0; padding: 0` |
| `.note` | `position: relative`；`display: grid`；`grid-template-columns: 6.5rem minmax(0, 1fr)`；`gap: 1.5rem`；`padding: 1.4rem 0`；`border-bottom: 1px solid var(--rule)`；`scroll-margin-top: 2rem` |
| `.note__meta` | `display: flex; flex-direction: column; gap: .35rem` |
| `.note__date` | `font-family: var(--font-display)`；`font-size: 1.3rem`；`line-height: 1` |
| `.note__time` | `font-family: var(--font-mono)`；`font-size: .75rem`；`color: var(--ink-3)` |
| `.note__body` | `min-width: 0`；首尾段落 margin 归零；正文继承 `.prose` 的字号/行高 |
| `.note__link` | `display: inline-flex`；`align-items/justify-content: center`；`min-width/height: 44px`；`color: var(--ink-3)`；`:focus-visible` 用现有焦点红框 |
| `.note:target::before` | 左侧 2px `--red` 竖线；`position:absolute`；不改变列宽 |
| `.notes-foot` | `margin-top: 2.5rem`；`color: var(--ink-2)` |

- 40rem 以下：`.note { grid-template-columns: 1fr; gap: .4rem }`；`.note__meta { flex-direction: row; align-items: baseline; gap: .75rem }`；日期仍衬线。
- 320 下 `#` 链接与正文不重叠；`.note__body` 右侧不需要额外留白。
- 暗色只消费 token；不新增暗色专用规则。

### 6.2 now

| 选择器 | 规格 |
| --- | --- |
| `.now-head` | 与 `.page-head` 相同的外边距/标题字号；不直接复用 PageHead 组件（需要 status 行） |
| `.now-lead` | `font-family: var(--font-body)`；`max-width: 38rem`；`color: var(--ink-2)`；`text-wrap: pretty`（首版“emo中……”不走衬线，避免新增子集用字） |
| `.now-status` | `display: flex; align-items: center; gap: .5rem`；上方 1px `--ink` 分隔线 |
| `.now-status i` | 7px 圆点，`background: var(--red)`；`aria-hidden` |
| `.now-body.prose` | `column-count: 2`；`column-gap: clamp(2rem, 5vw, 4rem)`；`counter-reset: now-section` |
| `.now-body.prose h2` | `break-after: avoid`；编号伪元素 `01…` 用 mono/红色/小字号；标题用 `--font-display` |
| `.now-body.prose ul, .now-body.prose p` | `break-inside: avoid` |
| `.now-foot` | 与 `.notes-foot` 同款；`color: var(--ink-2)` |
| `.empty-state` | 无边框/背景；`color: var(--ink-2)`；`margin: 2rem 0`；链接走现有样式 |

- 40rem 以下 `column-count: 1`；页头/正文单列；`now-status` 可换行。
- 打印：`column-count: 1`；隐藏 `.now-foot`、`.now-status i`、notes 页 `.note__link`；`.note { break-inside: avoid }`。notes 页没有 RSS 按钮，不需要单独隐藏。
- 减少动效：不新增动画；如给链接加颜色过渡，用 `var(--ease)`，现有 reduced-motion 规则会关闭。

## 7. SEO、sitemap 与可访问性

- `/notes/`、`/now/` 由 Base 自动生成 canonical/OG（`og:type=website`）；不手写第二套。
- `/notes/` 进 sitemap；`/now/` 进 sitemap；note 锚点不进 sitemap；不要求 `/notes/rss.xml` 出现在 sitemap。
- notes/now 不做 `BlogPosting` JSON-LD；不生成逐条 OG。
- 每页一个 h1：notes/now 都是页头 h1；品牌在内页是链接。
- 月份 `section` 有 `aria-labelledby`；note 列表用 `<ol>`；锚点链接有 `aria-label`。
- now 的编号是纯装饰（伪元素），不读屏；红点 `aria-hidden`。
- 键盘顺序：导航 → 主题开关 → 页头 RSS → 月份/条目锚点 → 页脚；焦点红框保持一致。
- 不新增低对比装饰文本；`--ink-3` 只用于时间/元信息。
- 重复 id 为 0（notes 页由 check-dist 兜底）。

## 8. 空状态与发布门槛

| 状态 | `/notes/` | `/now/` | 是否可发布 |
| --- | --- | --- | --- |
| **首版目标（2026-10-23 已定）** | 0 条 notes，空状态 | 单行 `emo中……`，正文为空 | 可以发布；不代写 notes |
| 0 条已发布 notes + 有正文的 now | 空状态，无计数 meta | 正常渲染正文 | 可以 |
| 有 notes、无 now | 正常 | 空状态 | **不默认发布**；需用户补 now 或明确接受空 now |
| `now.md` draft | — | build 空状态；dev 预览 | 本地可以；push 前处理 |
| 有 notes + 真实 now | 正常 | 正常 | 可以 |

- 首版 now 内容由用户定为单行 `emo中……`，不是实现者编造的状态；`updatedDate` 填实际发布日。
- now 是页脚/about 的公开入口；若连单行状态都没有（draft/缺失），上线前必须用户明确同意，不能由实现者默认决定。
- notes 空状态是产品允许的状态（“还没有碎碎念”），不算未完成。

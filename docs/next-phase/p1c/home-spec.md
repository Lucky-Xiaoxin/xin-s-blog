# P1c 首页规格：卷首 / 开卷 / 页边 / 目录

> 状态：规划中 · 2026-10-23
> 上游：`design-contract.md` §2/§5.1/§7、`design/d1/home.html`、`design/assets/d1.css`、`p1c/README.md`
> 下游：`src/pages/index.astro`、首页组件、`global.css`
> Owner：实现规划师
> 复核/证据：未开始

## 1. 页面骨架

```text
Base(size=full, width=wide, active=home)
└─ section.frontispiece[aria-label=本册概览]
   ├─ svg.frontispiece__drawing（aria-hidden，960×200）
   └─ div.frontispiece__legend（2 或 3 格）
      ├─ span：<b>文章</b> NN · 最新 MM.DD
      ├─ span：<b>碎碎念</b> NN · 最近 MM.DD（0 条时 `00 · 暂无`）
      └─ span：<b>现在</b> {now.description}（now 缺失时整格不渲染）
└─ div.frontmatter
   ├─ section.opening[aria-labelledby=opening-title]（0 文章时隐藏）
   │  ├─ p.kicker：开卷 <span>/ 最新</span>
   │  ├─ h2.opening__title#opening-title > a：最新文章标题
   │  ├─ p.opening__desc：description
   │  ├─ div.opening__meta：日期(+time) / N 分钟读完 / 标签
   │  └─ a.more：阅读全文 →
   └─ aside.margin-notes[aria-labelledby=margin-notes-title]（0 碎碎念且无 now 时隐藏）
      ├─ div.margin-notes__head：h2.label#margin-notes-title 页边 + a 全部碎碎念 →
      ├─ ol.note-mini（0 碎碎念时隐藏）：最近 3 条，time MM.DD + 摘要，链到 /notes/#n-<id>
      └─ div.now-line（now 缺失时隐藏）：红点 + label 现在 + description + a 看看 →
└─ section.contents[aria-labelledby=contents-title]（0 文章时隐藏）
   ├─ header.section-head：h2#contents-title 目录 + span.meta NN 篇 · 按时间倒序
   └─ ol.toc：每篇 li.toc__item（编号/标题/摘要/标签/日期/分钟）
```

- 首页不渲染旧的 `Hero`/`PostList`/“没啦~”。
- `Base` 的 `size="full"` 让品牌是 h1；开卷/页边/目录标题用 h2，文章标题用 h3。
- 所有站内链接走 `u()`；notes 锚点链接为 `${u('/notes/')}#${noteAnchor(note)}`。

## 2. 数据与计数

| 数据 | 来源 | 用途 |
| --- | --- | --- |
| 已发布文章 | `getPublishedPosts()` | 图例文章格、opening、contents |
| 已发布碎碎念 | `getPublishedNotes()` | 图例碎碎念格计数/最近日期 |
| 最近 3 条碎碎念 | `getRecentNotes(3)` | 页边 note-mini |
| now | `getNow()`（build 不含草稿） | 图例现在格、now-line |

- 计数用 `String(n).padStart(2, '0')`；日期用 `MM.DD`（UTC getter），不要 `YYYY.MM.DD` 塞进图例。
- 图例“最新/最近”取对应列表第 0 条的日期；列表为空时不显示日期部分。
- 首页不使用 `getCollection` 直接查询；不复用 dev 草稿列表（首页永远只算已发布）。
- 阅读时长用 `readingTime(post.body)`；标签用 `post.data.tags`。

### 2.1 页边摘要 `noteExcerpt()`

在 `src/lib/notes.ts` 增加：

```ts
/** 首页页边用的一行摘要：取正文第一个非空行，剥离 Markdown 标记，超长截断 */
export function noteExcerpt(note: Note, limit = 60): string;
```

规则（固定，避免各页面各写一套）：

1. 取 `note.body` 按行 split 后第一个非空行。
2. 删除图片 `![...](...)`；链接 `[text](url)` 保留 `text`。
3. 删除 `*`、`_`、`` ` ``、`#`、`>` 等标记字符。
4. 空白压缩为单个空格并 trim。
5. 超过 `limit` 截断并加 `……`。
6. 结果为空时回退为 `（空）` 不出现——调用方应保证 note 正文非空（schema 已保证）。

## 3. 组件规格

### 3.1 frontispiece

- 外层 `section.frontispiece`：`padding-bottom: .9rem`；`border-bottom: 1px solid var(--ink)`。
- SVG 用设计稿 `d1/home.html` 的 960×200 版本（圆/方/三角 + 基线 + 红点），`role="presentation" aria-hidden="true"`；`width:100%; height:auto`。
- 图例 `.frontispiece__legend`：默认 `grid-template-columns: repeat(3, minmax(0,1fr))`；now 缺失时用修饰类 `--2` 改 `repeat(2, minmax(0,1fr))`。
- 图例文字：`font-family: var(--font-mono)`、`0.6875rem`、`letter-spacing:.08em`、`color: var(--ink-3)`；`<b>` 为 `var(--ink)`、`font-weight:600`。
- 图例不是链接；不要给格子加 hover/点击。

### 3.2 opening

- `.frontmatter`：`grid-template-columns: minmax(0,1.55fr) minmax(16rem,.85fr)`；`gap: clamp(2rem,5vw,4.5rem)`；上下 padding 与 `border-bottom: 1px solid var(--rule)` 按 d1.css。
- `.opening .kicker` 复用全局 `.kicker`；`<span>/ 最新</span>` 用 `var(--ink-3)`。
- `.opening__title`：`clamp(2rem,4.4vw,3rem)`、`line-height:1.12`；链接 hover 红。
- `.opening__desc`：`max-width:32rem`、`var(--ink-2)`、`0.9375rem`。
- `.opening__meta`：flex wrap；日期/分钟用 `.meta`；标签用 `.tag-list/.tag`。
- 阅读全文用现有 `.more`。

### 3.3 margin-notes

- `.margin-notes`：`border-left:1px solid var(--rule)`；`padding-left: clamp(1.5rem,3vw,2.25rem)`。
- head：flex space-between；`h2.label` 为“页边”；右侧 `a` 为 mono 小字“全部碎碎念 →”，链 `/notes/`。
- `.note-mini`：`list-style:none`；每条 `li` `border-bottom:1px solid var(--rule)`。
- 每条 `a`：grid `3rem 1fr`；`time` mono `0.6875rem` 红色；`p` `0.8125rem`、`var(--ink-2)`；hover 时 p 变 ink。
- 整条可点（链接包住 time+p）；不需要额外伪元素热区，链接本身足够。
- `.now-line`：`margin-top:1.25rem`、`border-top:1px solid var(--ink)`、`padding-top:1rem`。
- `.now-line__top`：红点 `i`（6px，`aria-hidden`）+ `.label` 现在。
- `.now-line p`：`0.8125rem`、`var(--ink-2)`；“看看 →”链接 `border-bottom:1px solid var(--ink)`，hover 红；加 `aria-label="查看「现在」页"`。

### 3.4 contents

- 复用 P1a 的 `.contents`、`.section-head`、`.toc`、`.toc__item`、`.toc__no`、`.toc__foot`、`.toc__meta`。
- 编号：`String(index+1).padStart(2,'0')`。
- 标题 h3 + 链接；整行可点沿用 `.toc__item h3 a::after`；标签 `.toc__foot` 保持 `z-index:2` 独立可点。
- 摘要 p 用 `post.data.description`。
- `.toc__meta` 两行：`formatDay(pubDate)` 与 `${readingTime} 分钟`。
- 不渲染 Seal 徽章（设计稿首页目录没有）。

## 4. 空状态矩阵

| 文章 | 碎碎念 | now | 渲染 |
| --- | --- | --- | --- |
| >0 | >0 | 有 | 完整三块；图例 3 格 |
| >0 | 0 | 有 | 无 note-mini；页边只有 now-line；图例碎碎念格 `00 · 暂无`，3 格 |
| >0 | >0 | 无 | 无 now-line；图例 2 格（`--2`） |
| >0 | 0 | 无 | 隐藏 margin-notes；frontmatter 单列；图例 2 格 |
| 0 | 任意 | 任意 | 隐藏 opening/contents；图例文章格 `00 · 暂无`；若页边有内容则 frontmatter 单列显示页边，否则显示 `.empty-state`“还没写文章。” |

- 任何组合都不渲染空框、虚线占位或 `0 条` 假 meta。
- 0 文章时 `section-head` 的计数不显示（整个 contents 隐藏）。

## 5. 响应式 / 暗色 / 打印 / a11y

### 断点

| 断点 | 行为 |
| --- | --- |
| >52rem | frontmatter 两列；页边左边框 |
| ≤52rem | frontmatter 单列；页边改 `border-top`、`padding-top`；note-mini 三列 |
| ≤40rem | note-mini 单列；`.toc__item` 两列、meta 换行（P1a 已有）；图例文字换行 |
| ≤24rem | 图例单列；frontmatter padding 收紧 |

- 320 必须无横向滚动；图例/页边/目录都要实测。
- 暗色：只消费 token；SVG stroke 用 `var(--ink)/var(--rule)`，红点 `var(--red)`。
- 打印：隐藏 `.frontispiece__drawing` 与 `.now-line__top i`；页边单列；保留文字内容。
- a11y：
  - 首页 h1 = 品牌；opening/页边/目录 h2 有 id 并被 `aria-labelledby` 引用。
  - SVG `aria-hidden`；红点 `aria-hidden`。
  - note-mini/now-line/目录链接焦点可见；整行点击不吞掉标签链接。
  - 不新增低对比文本；图例小字用 `--ink-3` 仅装饰计数。

## 6. 删除清单

- `src/components/Hero.astro`、`src/components/PostList.astro`。
- `global.css` 的 `.hero`、`.hero svg`、`.hero__caption`、`.index`、`.index__*`。
- 首页模板里的 `section-note`“没啦~”。
- 删除前 grep 确认没有其它页面/组件引用；若 TROUBLESHOOTING/README 提到旧首页结构，同步更新。

## 7. SEO / 体积

- 首页 canonical/OG 仍由 Base 生成；不改 title/description。
- 首页不生成 JSON-LD（P1e）。
- 首页 HTML 含 4 文章 + 3 碎碎念 + now 一行，必须 ≤30KB；SVG 内联约 1KB。
- 不新增字体/位图/第三方脚本；站内 JS 仍 0。

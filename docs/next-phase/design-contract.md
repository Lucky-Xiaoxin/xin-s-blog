# 设计契约：方向一「卷首」（D1）

> 状态：2026-10-22 **已批准**。实现按本契约执行；不再补设计稿。
> 2026-10-23 宽度澄清：`--measure/--mid/--wide` 是**内容列宽**，不是 `.shell` 盒宽；用户选择 **A**：P1a 把旧实现的 30rem 正文修正回 42rem，并已在本地验收通过。
> 来源：`docs/next-phase/design/d1/`（HTML/CSS 原型）、`docs/next-phase/design/screens/`（截图与自检）。
> 已选定：设计稿 **A 方案 = 方向一「卷首」**。方向二/三保留作对照，不进入实现。
> 设计稿未覆盖的标签详情页、404、移动端 notes/now 截图：**不补稿**，按本文默认在实现中完成。
> 变更控制：实现中如发现设计稿与本契约/现有不变量冲突，以 **本契约 + AGENTS.md 的不变量** 为准；要改契约先改本文档并征得用户同意。

## 0. 评审结论

- 方向一可用：保留白底、单一正红、几何描边、Bodoni + 思源宋体、42rem 正文；JS 仍为 0；没有新增色相/字体族/位图。
- 首页从“Hero + 列表”变成“卷首插图 + 开卷/页边 + 编号目录”；文章页从单列变成“标题 + 页边规格 + 内联目录 + 编号小节”。
- 原型自检：150 次检查、0 个失败；覆盖 7 页 × 5 宽度 × 亮/暗，检查项为横向溢出、重复 id、缺失锚点、h1 数量、字体加载。**不覆盖**对比度、焦点顺序、空状态、打印、真实内容下的编号/字数/印记标签。
- 原型里的数字（04、06、本周 02、N° 006、约 900 字、式 1、Listing 01、图 1）是手写示例；生产必须动态生成或明确降级，见第 6 节。
- 主要实现风险：首页依赖 notes/now 数据；文章页的 H2 编号、TOC、代码标题栏、公式/图注编号需要构建期转换；Shiki/KaTeX/`.scroll-x`/明暗双入口不能被原型的简化版覆盖。

## 1. 范围

| 页面 | 宽度 | 设计稿 | 本阶段 |
| --- | --- | --- | --- |
| 首页 `/` | wide 58rem | `d1/home.html` | 做，依赖 notes/now 数据 |
| 文章 `/posts/[slug]/` | wide 外壳 + 42rem 正文 | `d1/post.html` | 做 |
| 归档 `/archive/` | mid 46rem | `d1/archive.html` | 做 |
| 标签 `/tags/` | mid 46rem | `d1/tags.html` | 做 |
| 标签详情 `/tags/[tag]/` | mid 46rem | **未设计** | 需补契约，见 5.3 |
| 碎碎念 `/notes/` | mid 46rem | `d1/notes.html` | 做，依赖 notes collection |
| 现在 `/now/` | mid 46rem | `d1/now.html` | 做，依赖 pages collection |
| 关于 `/about/` | mid 46rem | `d1/about.html` | 做，轻改 |
| 404 | mid 46rem | **未设计** | 沿用现有 404 标记，套新壳；见 5.5 |
| RSS / sitemap | — | 无视觉 | 保留；新增 notes RSS |

不做：系列页、搜索、评论、统计、友链、Newsletter、点赞、Webmention；配色/字体不改；不引入 UI 框架/第三方脚本。

## 2. 设计决定

### 首页

- 第一屏：卷首插图（圆/方/三角 + 基线 + 红点）+ 三格图例（文章/碎碎念/现在），而不是空白 Hero。
- 第二屏：两栏 `frontmatter`——左“开卷/最新”文章，右“页边”最新 3 条碎碎念 + now 一行。
- 第三屏：`contents` 编号目录，列出全部文章；编号 01…NN，日期/阅读时长在右。
- 移动端顺序：卷首 → 开卷 → 页边 → 目录；`frontmatter` 在 52rem 以下变单列。

### 文章页

- 文章头两栏：左标题/题记/meta/tags；右 12rem 页边（印记 104px + 规格表）。
- 规格表四项：归档 `YYYY / MM`、阅读 `N 分钟 · 约 M 字`、分类（tags）、印记 `形状 × 内芯`。
- 内联 TOC：两栏，`01…` 编号 + 虚线引导；桌面在正文前，移动端单栏。
- 正文：h2 左侧编号（桌面页边/移动内联）+ 红方块；h3 前红色破折号；blockquote 大引号；figure/figcaption；代码块标题栏；公式编号；文末“本文完”+ 标签；延伸阅读；上下篇。
- 不做 sticky 目录；不做阅读进度条；不引入 JS。

### 归档 / 标签

- 归档：年份大字（Bodoni）+ 月份小节 + 文章编号/标题/标签/日期/阅读时长；移动端隐藏阅读时长列。
- 标签：索引列表（徽章、名称、最近一篇、计数），不是标签云；移动端隐藏“最近”列。

### 碎碎念 / now

- 碎碎念：月份分组，每条日期/时间/N° + 正文 + `#` 锚点；`:target` 左侧红规线；独立 RSS 入口。
- now：页头状态 + 最后更新；2 列 4 节（在学/在做/在读/最近）；移动端单列。
- 两者是“作者在场”的页面，不抢文章主体；首页只放最新 3 条碎碎念 + 一行 now。

## 3. Tokens（与现有系统合并，不另起一套）

### 颜色（不变）

| Token | 亮色 | 暗色 |
| --- | --- | --- |
| `--paper` | `#ffffff` | `#111214` |
| `--surface` | `#f7f7f5` | `#1b1d20` |
| `--tiji-bg` | `#ededeb` | `#202327` |
| `--ink` | `#111214` | `#f2f2f0` |
| `--ink-2` | `#4b4f55` | `#c7c9cc` |
| `--ink-3` | `#686d73` | `#979ba0` |
| `--rule` | `#e4e4e1` | `#2a2c2f` |
| `--red` | `#d81e1e` | `#ef3b3b` |

红色仍是唯一重音；不新增色相。题记的硬边阴影仍是唯一阴影用例。

### 宽度与节奏（新增/调整）

| Token | 值 | 说明 |
| --- | --- | --- |
| `--measure` | `42rem` | 正文内容列宽；token 值不变，但旧实现误把它当盒宽 |
| `--mid` | `46rem` | 归档/标签/碎碎念/now/关于 |
| `--wide` | `58rem` | 首页外壳/文章页外壳 |
| `--gutter` | `clamp(1.25rem, 6vw, 4.5rem)` | 比现在的 7vw/6rem 更窄；需全站回归 |
| `--bleed` | `clamp(0.75rem, 4vw, 3rem)` | 技术内容两侧突破 |
| `--ease` | `cubic-bezier(0.2, 0.6, 0.2, 1)` | 新过渡统一用；不新增动画 |

- `body` 行高保持现状 1.8；`.prose` 保持 1.95。设计原型 base.css 的 `body 1.9` 不作为硬指标，避免无意义的全站重排。
- **宽度语义**：`--measure/--mid/--wide` 是内容列宽；`.shell` 的 `max-width` 必须是 `内容宽 + 2 × --gutter`。旧实现把 `--measure: 42rem` 当盒宽，1440 下正文只有 30rem；P1a 按本契约修正会让首页/文章 measure 页正文回到 42rem。用户已选择 **A：接受这个视觉变化**；P1a 已按此实现并验收（2026-10-23）。
- 标题：Bodoni Moda 500 + 思源宋体子集；正文系统无衬线 17px；meta 12px 等宽；目录编号 10–11px 等宽。
- 文章标题 `clamp(2.2rem, 5.6vw, 3.35rem)`；页面 h1 `clamp(2.2rem, 6vw, 3rem)`；归档年份 `clamp(3rem, 8vw, 4.6rem)`；碎碎念日期 `1.3rem`（衬线）。
- 所有新组件必须使用现有 token；不得在组件里写死亮色/暗色以外的颜色（Shiki token 除外）。

## 4. 布局与 Base

- `Base.astro` 增加 `width?: 'measure' | 'mid' | 'wide'`，默认 `measure`；**只有 `main` 使用页面内容壳，页头/页脚固定 `wide`**（2026-10-30 前端评审 F2：站点 chrome 不随页面换档，避免品牌/导航横向跳动）。
- 首页/文章页 `main` 最终用 `wide`；P1a 只定义 `wide`，不提前启用，P1c/P1d 再切。归档/标签/碎碎念/now/关于/404 用 `mid`；标签详情用 `mid`。
- 页头：首页 `masthead--full`（品牌 h1 + tagline + 4 项导航）；内页 `masthead--compact`（品牌 a + 4 项导航，隐藏 tagline/handle）。
- 导航从 3 项变 4 项：目录 / 归档 / 标签 / 关于。320px 必须不换行、不溢出；如过挤，优先缩小间距而不是删“归档”。
- 页脚：保留版权/社交；增加“碎碎念 / 现在”两个链接；RSS 仍指向 `/rss.xml`；所有站内链接走 `u()`。
- 主题脚本、`data-theme` 双入口、打印强制亮色、`main { flex:1 }`、短页页脚贴底等现有不变量全部保留。
- `shell--wide`/`shell--mid` 只加在必要页面；文章正文仍用 42rem，不因外壳变宽而拉长行宽。

## 5. 组件规格

### 5.1 首页

| 组件 | 规格 | 数据 |
| --- | --- | --- |
| `frontispiece` | 960×200 SVG，1px 规则线 + 三形状 + 红点；下方三格图例 | 文章数/最新日期；碎碎念数/最近日期；now 摘要 |
| `frontmatter` | 两列 `1.55fr / minmax(16rem,.85fr)`，gap `clamp(2rem,5vw,4.5rem)`；52rem 以下单列 | 最新一篇；最新 3 条 notes；now 一行 |
| `opening` | kicker“开卷 / 最新”；标题、摘要、日期/阅读/标签、阅读全文 | 最新文章 |
| `margin-notes` | 左边框；标题“页边”+“全部碎碎念”；3 条 date+摘要；下方 now 行 | notes + now |
| `contents` | `section-head` + `ol.toc`；编号 01…；标题/摘要/标签/日期/阅读；40rem 以下两列变单列 | 全部已发布文章 |

- 首页图例不要写死 `04/06/本周 02`；用 `padStart(2,'0')` 格式化计数。
- “本周 02”建议改为“最近 10.22”或“共 06 条 · 最近 10.22”，避免构建时周计算/时区语义；若保留“本周”，契约需明确“构建日往前 7 天”，且接受不重建会过期。
- 空状态：0 篇文章时显示“还没写”；0 条碎碎念时隐藏页边块或显示“还没有碎碎念”；now 缺失时只显示文章/碎碎念两格。

### 5.2 文章页

| 组件 | 规格 | 实现要点 |
| --- | --- | --- |
| `article-head` | 42rem + 12rem 两栏，gap clamp(2,4vw,3.5rem)；60rem 以下单列 | 右栏在 60rem 以下折成 104px + 内容两列；40rem 以下只留 归档/印记 |
| `article-head__margin` | 104px 印记 + `dl.spec-list` 四项 | 印记标签需新增 shape/core 中文映射 |
| `toc-inline` | 9rem 标签 + 两栏列表；40rem 以下单栏 | 用 `render()` 的 headings，过滤 h2/h3；少于 3 条不显示 |
| h2 | 桌面左侧编号 + 红方块；60rem 以下编号内联 | 需要给每个 h2 注入编号 span，或 CSS counter；见 6.2 |
| h3 | 红色破折号 + 标题 | CSS `::before` 即可 |
| blockquote | 大红色引号 + 左缩进 | 替换现有红线样式；注意中文无斜体 |
| figure | 图 + 1px 边框 + `figcaption`（`图 N`） | 生产图片/ SVG 均可；图注来源见 6.5 |
| listing | 外框 + 标题栏（Listing NN · 语言 / 文件名）+ 可滚动代码 | 保留 Shiki；标题栏在滚动区外；见 6.3 |
| formula | 外框 + `式 N` + MathML/KaTeX | 保留 KaTeX `htmlAndMathml` 与 `.scroll-x`；见 6.4 |
| article-end | “本文完” + 红点 + 标签 | 纯装饰；红点 aria-hidden |
| related | 2 条，徽章 + 标题 + 日期/阅读/标签 | 共享标签算分；无匹配不显示 |
| pager | 更早/更新 | 保留现有逻辑，套新样式 |

- 文章页所有内容/元信息动态化：阅读时长、字数、归档年月、分类、印记标签；原型中的 `3 分钟 · 约 900 字` 不能写死。
- `印记` 标签：`sealFor()` 返回 shape/core；新增中文映射（如 triangle=三角形、cross=十字）。只用于展示，不改变 Seal 映射。
- 字数口径：CJK 字符 + 英文/数字词；是否剔除代码块需在实现前定。建议“粗略字数，含代码”，只展示，不参与排序。

### 5.3 归档 / 标签 / 标签详情

- 归档：`archive-year` > `archive-month` > `archive-list`；编号按全站时间倒序连续；移动端隐藏阅读时长列。年份/月计数动态。
- 标签索引：`tag-index` 列表；每项徽章、名称、最近一篇、计数；移动端隐藏“最近”列。计数只算已发布文章。
- **标签详情未设计（已确认）**：复用首页 `contents` 的紧凑版（section-head + toc 列表），标题为 `#标签`，显示文章数/最近更新；不新造一种卡片。实现中完成，不再补稿。
- 标签索引的“最近一篇”需要 `latestPostByTag` 聚合；不能在前端算。

### 5.4 碎碎念 / now

- 碎碎念：`note-month` 分组；`note` 网格 6.5rem + 正文；日期用衬线，时间/N° 用等宽；`#` 锚点有 aria-label；`:target` 红规线；锚点 id 统一为 `n-<文件 id>`（即 `n-YYYY-MM-DD-slug`，永远带 slug，避免同日冲突；见 `p1b/content-model.md`）。独立 `/notes/rss.xml`，**首版不放可见订阅入口**（用户 2026-10-23 定）。
- N°：原型按时间顺序编号。建议**首版去掉 N°**，只留日期/时间/锚点，避免插入旧 note 导致编号漂移；若保留，需定义“按发布时间升序，回填旧 note 会重排”。
- now：`now-head` + 可选 `now-grid` 两列四节；**首版用户定为单行状态 `emo中……`，正文为空，只渲染页头 + 最后更新**；有小节时才启用两列；`updatedDate` 显示“最后更新于”；移动端单列；内容来自 `pages` collection 的 `now.md`。
- 首页的“现在”一行使用 `now.md` 的 `description` 或单独 `summary`；不要从正文截断。

### 5.5 关于 / 404

- 关于：`page-head` + `about-lead` + `.prose`；保留现有文案结构，补 notes/now 链接；链接走 `u()`。
- 404：设计稿未覆盖（已确认）。保留现有 `40[4]` 标记与“这个路径下没有文件”，套 `masthead--compact` + `shell--mid` + 新页脚；不要为 404 生成 canonical/OG。验收 320/390。实现中完成，不再补稿。

## 6. 内容 → UI 映射（本次评审的重点）

原型里的“编辑感”有一部分是手写 HTML；生产不能假设作者会手写这些结构。逐项定：

### 6.1 首页计数/最新/now

- 动态：文章数、最新文章日期、notes 数、notes 最近日期、now 摘要。
- 依赖 notes/pages collection；在它们落地前，首页只能先做“文章数 + 最新 + 目录”，页边/now 图例留空或隐藏。
- 因此首页大改应排在 notes/now 数据层之后（见第 8 节）。

### 6.2 H2 编号 + TOC

- 原型：`<h2 id="s1"><span class="h2-no">01</span>…` 是手写。
- 生产方案（推荐）：新增一个构建期 rehype 插件（或扩展现有 `rehypeScrollable`），只对文章正文顶层 h2 注入 `<span class="h2-no" aria-hidden="true">01</span>`；TOC 用 `render()` 的 headings 顺序生成编号，保证两边一致。
- 备选：CSS counter + 伪元素；但移动端“编号在红方块前”的顺序不好做，且 TOC 仍需另算。插件更稳。
- 验收：H2 数量与 TOC 数量一致；KaTeX/代码/表格内的标题不误编号；无 JS。

### 6.3 代码标题栏 / Listing 编号

- 原型：`.listing` + `Listing 01 · C++ / xor_prefix.cpp` 手写。
- 生产方案：构建期把 Shiki 的 `<pre>` 包进 `.listing`（标题栏在外、滚动区在内），保留 `.scroll-x` 的 `tabindex=0`/`role=region`/`aria-label`；标题栏显示 `Listing NN · 语言`。
- 文件名：优先读取 fence meta（如 ` ```cpp title="xor_prefix.cpp" `）；如果 Astro/Shiki 的 meta 透传不稳定，首版**只显示语言 + 编号**，不要为了文件名引入脆弱解析。
- 不替换 Shiki token 色；原型的 `.tok-*` 只是示例，生产继续用 `--shiki-*` 变量和双主题覆写。

### 6.4 公式编号

- 原型：手写 `<span class="formula__no">式 1</span>` + 原生 MathML。
- 生产：KaTeX 仍输出 `htmlAndMathml`；`.scroll-x[data-kind='math']` 保留。若要编号，构建期把 top-level display math 包成 `.formula`（标签 + 内层滚动区），并计数；内联公式不编号。
- 已确认：**首版不强制“式 N”自动编号**。如果 rehype 包裹会破坏 KaTeX 布局/滚动，就不做编号，保留现有公式样式；不要为了编号牺牲 MathML/横向滚动。验收时必须用真实长公式。

### 6.5 图注 / 图编号

- 原型：`<figure><svg/><figcaption><span class="fig-no">图 1</span>…` 手写。
- 生产：首版支持**作者手写 `<figure>` HTML**（Markdown 允许 HTML），样式由全局 CSS 提供；不做“所有图片自动变 figure”的隐式转换。
- 如果以后要自动：用 rehype 把 `<img title="图注">` 包成 figure；需要明确 alt/title 语义，P2 再评估。不要用 alt 当图注。
- 验收：真实图片在 320/390 不溢出；图注可读；alt 存在。

### 6.6 表格 / 分节装饰

- 表格继续由 `rehypeScrollable` 包 `.scroll-x`；标题/图注不自动加。
- “分节装饰”三红点：可作为作者手写 `<div class="section-mark">`，或把 `hr` 样式改成三红点；首版建议不改 `hr` 语义，手动用 HTML 时可选用。
- 不要把装饰写进每篇文章的自动流程；它是可选项。

### 6.7 文章元信息

- 阅读时长：继续用 `readingTime`；新增 `wordCount`（CJK + 英文词）用于“约 M 字”。
- 归档年月：从 `pubDate` 用 UTC getter（现有 `formatDay` 同源）。
- 分类：tags；印记：`sealFor` + 新标签映射。
- 所有站内链接用 `u()`；标记 `time datetime`。

### 6.8 字体子集

- 新增 `src/content/notes/`、`src/content/pages/` 后，`scripts/subset-fonts.mjs` 必须扫描它们的 frontmatter/标题/引用；否则 now/notes 里的中文衬线会静默回退系统宋体。
- 首页/文章页新增中文文案都在 `.astro` 内，会被现有扫描覆盖；notes/now 的 Markdown 内容不会。
- 验收：`npm run build` 后检查 `now`/`notes` 标题的衬线字体实际加载；不要只看构建成功。

## 7. 响应式、暗色、打印、可访问性

### 断点

| 断点 | 行为 |
| --- | --- |
| `max-width: 60rem` | 文章头两栏 → 单列；页边规格折成 104px + 两列；h2 编号内联 |
| `max-width: 52rem` | 首页 frontmatter 两栏 → 单列；页边碎碎念三列 → 一行 |
| `max-width: 40rem` | 首页目录两列 → 单列；文章头只留 归档/印记；TOC 单栏；归档隐藏阅读时长；标签隐藏“最近”；notes 单列；now 单列 |
| `max-width: 24rem` | 导航/标题缩字号；图例单列；gutter 1.25rem |

必须在 320 / 375 / 390 / 768 / 1024 / 1440 实测；用户可提供 iPhone/Android 真机。

### 暗色

- 新组件全部消费 token；不新增暗色专用色。
- 保留现有两个入口：`:root[data-theme='dark']` 与 `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])`；新增组件的依赖规则（如代码/按钮）若在入口①出现，入口②也要同步。
- Shiki 双主题覆写、KaTeX、题记阴影、主题开关的暗色规则不能丢。
- 原型 base.css 只是简化版，不能整份替换 `global.css`。

### 打印

- 强制亮色；隐藏主题开关、skip、TOC、相关文章、上下篇、碎碎念锚点、原型提示。
- 代码/表格/图/listing 避免跨页断裂；标题后避免分页。
- 保留标题、题记、meta、正文、图注；文章页页边规格可保留“归档/印记”或整块隐藏，需在实现时定；建议打印隐藏页边规格，节省宽度。

### 可访问性

- 每页一个 h1；首页品牌是 h1，内页品牌是 a。
- 装饰 SVG/红点/编号 span 加 `aria-hidden`；TOC、related、footer 有 aria-label。
- 焦点红框 2px；新按钮/链接/锚点热区 ≥44px（视觉尺寸可小）。
- `prefers-reduced-motion` 全局关闭过渡。
- 对比度：新组件沿用 token，但 `--ink-3` 的小字、红底白字、暗色红字需抽查；不新增低对比装饰文本。
- 键盘：导航 → 主题开关 → 正文 → TOC → 代码滚动区 → 相关/上下篇；notes 锚点可聚焦。

## 8. 性能、SEO 与预算

| 指标 | 当前 | 上限 |
| --- | --- | --- |
| CSS gzip | 13.0 KB | 18 KB |
| 站内 JS | 1.5 KB 内联 | 3 KB gzip（复制按钮 ≤2KB，后续） |
| 新 SVG | — | 首页 1.5KB + 其他 <3KB |
| 字体总量 | 1.36 MB | 1.5 MB（不新增字体族） |
| 最大文章 HTML | 20.1 KB | 30 KB |
| dist（不含图） | 1.5 MB | 2.6 MB |
| LCP/CLS/INP | 未测 | 2.5s / 0.1 / 200ms |

当前值为 2026-10-23 生产子路径 verify；运行基线以根 README 的体积预算表为准。

- 不新增位图/字体/第三方脚本；首页卷首 SVG 内联，避免额外请求。
- 新页面都要 title/description/canonical；notes 页进 sitemap，锚点不进；`/notes/rss.xml` 独立；`/now/` 进 sitemap，不做 BlogPosting。
- 标签详情页保留 canonical；归档/标签索引不 noindex。
- 404 保持 noindex、无 canonical/OG。
- 字体子集扩展见 6.8；构建后抽查 now/notes 标题。

## 9. 实现顺序（设计契约批准后）

| 阶段 | 内容 | 依赖 | 验收 |
| --- | --- | --- | --- |
| P0 | 数据层 `src/lib/posts.ts`、草稿预览、`verify` | 无 | 子路径/草稿/死链/体积；文章页 JS 0 |
| P1a | design foundation：tokens/shell 宽度、页头页脚、4 项导航、按钮/标签/page-head；归档/标签改版 | P0 | 所有页面壳一致；320/1440 不溢出；暗色双入口保持 |
| P1b | notes collection + `/notes/` + notes RSS；pages collection + `/now/` | P1a | 锚点/月份分组/RSS；真实内容；字体子集 |
| P1c | 首页卷首 + frontmatter + 目录 | P1b | 动态计数/最新/now；空状态；390/320 |
| P1d | 文章页：文章头/规格/TOC/H2 编号/代码标题栏/图注/相关/文末 | P0 + P1a | 真实文章（math-xor）验证 KaTeX/长公式/代码；TOC 锚点；打印 |
| P1e | SEO/OG 补全、print/reduced-motion、a11y、真机走查、文档同步 | P1d | 对比设计稿；预算内；用户试用确认 |

- 每个阶段单独 PR；不把“设计改版”和“内容录入”混在一个 PR。
- 文章内容不代写代改；notes/now 的示例文案由用户提供或确认后再写入。
- 设计稿中的方向二/三不删除；保留在 `docs/next-phase/design/` 作对照。

## 10. 已确认决定（2026-10-22）

| 编号 | 决定 |
| --- | --- |
| C1 | 标签详情页复用首页 `contents` 紧凑版；不另造卡片 |
| C2 | 404 保留现有 `40[4]` 标记，套新页头/页脚；不重新设计 |
| C3 | 首页“本周 02”改为“最近 10.22”（或“共 06 条 · 最近 10.22”），避免周计算/构建过期 |
| C4 | 碎碎念首版去掉 `N° 006`，只留日期/时间/锚点 |
| C5 | 代码标题栏首版只显示 `Listing NN · 语言`；文件名等 fence meta 稳定后再加 |
| C6 | 图注首版支持手写 `<figure>`；公式编号不强制，不能破坏 KaTeX/MathML/滚动 |
| C7 | H2 编号用构建期 rehype 插件注入，TOC 用同一顺序 |
| C8 | 采用 `--gutter: clamp(1.25rem, 6vw, 4.5rem)`、`--wide: 58rem`、`--mid: 46rem`；做全站回归 |
| C9 | 空状态隐藏对应块，不留空框 |
| C10 | “本文完”/三红点保留为可选装饰，不强制每篇 |
| C11 | 设计稿未覆盖的标签详情/404/notes 390/now 390：不补稿，按本契约在实现中完成 |
| C12 | 字体、动效不变；配色/字体族不新增 |
| C13 | 宽度语义：`--measure/--mid/--wide` 是内容列宽；用户已选择 A，P1a 把 measure 页从旧 30rem 修正到 42rem，并已验收 |

## 11. 验收清单

### 视觉

- 1440 / 1024 / 768 / 390 / 320，亮/暗；首页、文章、归档、标签、标签详情、notes、now、about、404。
- 对照 `screens/d1-*.webp`：首页卷首/开卷/页边/目录；文章头/页边规格/TOC/编号/公式/代码/图注/文末；归档年份/月份；标签索引；notes 月份/锚点；now 两列。
- 无横向页面滚动；技术内容横向滚动限制在容器内；320 导航不换行/不溢出。
- 暗色下新增组件全部使用 token；Shiki/KaTeX/题记/开关正常。
- 打印：亮色、无 TOC/相关/上下篇/主题开关；代码/表格/图不跨页断裂。

### 功能/数据

- 首页计数/最新/now/notes 动态；空状态。
- 文章 TOC 锚点全部可跳；H2 编号与 TOC 一致；长公式/代码/表格在 `.scroll-x` 内。
- 归档按年月正确；标签索引最近一篇正确；标签详情过滤正确。
- notes 锚点稳定、月份分组、RSS 独立；now 最后更新正确。
- 所有站内链接走 `u()`；子路径构建无 404。
- 草稿：dev 可预览，build 不出现；notes/now 同样。

### 质量

- `npm run verify` 全绿（已含 check/build/check-dist）。
- CSS gzip ≤18KB；JS 0（本阶段）；字体 ≤1.5MB；dist ≤2.6MB。
- 键盘全流程；焦点可见；reduced-motion；对比度抽查；VoiceOver/NVDA 抽查。
- iPhone Safari + Android Chrome 真机；打印 PDF。
- AGENTS/README/TROUBLESHOOTING 同步新结构、字体子集扫描、导航/路由。

## 12. 已知不做 / 留给后续

- 系列（暂缓）、搜索、评论、统计、友链、Newsletter、点赞、Webmention。
- 逐篇 OG 图、旧链接重定向、字体死重清理、Lighthouse CI/外链巡检。
- 图片自动转 figure、公式/图注全自动编号、代码文件名解析——除非实现时证明低风险。
- 视觉方向二/三不实现，仅保留对照。

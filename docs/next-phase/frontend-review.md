# 前端页面评审：问题汇总

> 状态：已批准 · 2026-10-30
> 上游：2026-10-30 前端页面评审；用户确认“问题都属实”。证据来自本地生产子路径构建 `dist`（2026-10-29）。
> 下游：P1d 文章页、P1e 视觉/可访问性收尾、跨阶段一致性小修。
> Owner：实现规划师
> 复核/证据：本文 §2、§4、§6 的实测记录与代码位置；未覆盖项见 §7。
> 说明：本文是问题清单与处置建议，不是实现契约。实现细节仍以 `design-contract.md`、`implementation-plan.md` 的 P1d/P1e 为准；作者文章/碎碎念内容不代写。

## 1. 结论与范围

### 1.1 结论

视觉方向成立：白纸、单一正红、几何线稿、Bodoni + 思源宋体、等宽元信息，这套“编辑部”语言是站得住的，不需要推翻。

问题不在审美，集中在三处：

1. **完成度**：文章页还停在最小形态，P1d 的规格表、TOC、编号、代码栏、图注、相关阅读都没做。
2. **尺度**：三档壳宽让页头在页面间跳动；首页目录没有上限；10–11px 中文小字偏多。
3. **一致性**：空状态、几何语义、时间口径、计数格式、打印规则还有前后不一致的地方。

当前真实内容是 4 篇文章、0 条碎碎念、`now` 只有一行；空状态的问题因此被放大。

### 1.2 评审范围

| 路由 | 1440 壳宽 | 内容列宽 | 宽度档 |
| --- | --- | --- | --- |
| `/` | 1072px | 928px | wide |
| `/archive/`、`/tags/`、`/tags/[tag]/`、`/notes/`、`/now/`、`/about/`、`/404.html` | 880px | 736px | mid |
| `/posts/[slug]/` | 816px | 672px | measure |

- 视口：320 / 390 / 768 / 1440。
- 主题：亮 / 暗。
- 浏览器：headless Chrome（CDP），设备缩放 1。
- 产物：本地 `dist`，生产子路径 `/xin-s-blog/`；**不是线上实时快照**。
- 本次**没有重跑** `npm run verify`；体积数字沿用 P1c review / design-contract 记录。

### 1.3 做得好的

- 抽查页面在 320–1440 无横向溢出；每页一个 h1。
- 亮色对比度实测：meta 5.22:1、kicker 5.09:1、tag 8.24:1，达 AA。
- 暗色双入口、打印强制亮色、`prefers-reduced-motion`、KaTeX/Shiki 双主题都在。
- 首页卷首、归档、标签索引的编辑感清晰；不是模板站。
- 客户端 JS 仍只有主题切换，没有第三方脚本。

## 2. 实测基线

| 项目 | 实测 | 来源 |
| --- | --- | --- |
| 横向溢出 | 抽查页面（首页/文章/归档/标签）在 320/390/768/1440 无横向溢出；其余页面只做 1440 截图 | 本次基线 |
| h1 数量 | 每页 1 个（抽查页面实测 + 其余页面代码核对） | 本次基线 |
| 亮色对比度 | 抽查页面 meta 5.22:1；kicker 5.09:1；tag 8.24:1 | 本次基线 |
| 壳宽 | 1072 / 880 / 816 | 本次基线 |
| 首页目录行高 | 157px（当前 4 篇，均有标签） | 本次基线 |
| 手机图例字号 | 10px（`max-width: 40rem` 下 `.625rem`） | 本次基线 |
| 标签热区 | 高度 29px（2 字标签宽 44px） | 本次基线 |
| 内容状态 | 4 篇文章 / 0 条碎碎念 / now 一行 | `dist` 内容 |
| CSS gzip / JS | 14.6KB / 1.5KB | P1c review（CSS）与 design-contract（JS 预算），未重测 |

## 3. 问题总表

| ID | 级别 | 性质 | 问题 | 建议归属 |
| --- | --- | --- | --- | --- |
| F1 | 高 | 实测 + 契约缺口 | 文章页只完成骨架，P1d 组件全部未做 | P1d |
| F2 | 高 | 实测 | 三档壳宽导致页头/页脚在页面间跳动 | P1d 前置或 P1e |
| F3 | 高 | 实测 + 内容状态 | 0 条碎碎念时，首页右栏与 `/notes/`、`/now/` 半空 | 跨阶段小修 + 用户内容 |
| F4 | 中高 | 实测 + 外推 | 首页目录列出全部文章，行高 157px，无上限 | P1e 或跨阶段小修 |
| F5 | 中 | 实测 | 10–11px 中文小字过多 | P1e |
| F6 | 中 | 实测 | 44px 热区没有统一执行 | P1e |
| F7 | 中 | 实测 + 判断 | 归档层级扁平：月份与文章标题几乎同大 | P1e |
| F8 | 中 | 判断 | 几何语义过载：卷首/标签/印记三套含义，印记无说明 | P1d（印记标签）+ P1e |
| F9 | 中低 | 判断 | 题记灰块与引用红线语义不明 | P1d |
| F10 | 低 | 判断 | 主题开关是页头视觉最强的元素 | P1e |
| F11 | 低 | 判断（计算） | 暗色 `--rule` 约 1.3:1，结构线过弱 | P1e |
| F12 | 低 | 实测 | 时间口径、计数格式、`<time>`、页脚 RSS 等一致性 bug | 独立小 PR |
| F13 | 低 | 实测（CSS） | 打印规则遗漏：上下篇、印记未被隐藏 | P1d / P1e |
| F14 | 低 | 判断 | 标签索引“最近”列大量重复 | P1e 或内容运营 |
| F15 | 低 | 实测 + 判断 | 首页 tagline 文案重复，1440 下出现孤行 | 跨阶段小修 + 用户文案 |

## 4. 详细说明

### F1 · 高 · 文章页只完成骨架

- 现象：当前文章页是“印记 + 标题 + 题记 + meta + 正文 + 上下篇”。没有页边规格表、内联 TOC、h2 编号、代码标题栏、图注、本文完、相关阅读。
- 证据：`src/pages/posts/[...slug].astro:23-91` 只有单列结构；104px 印记在 `:39` 直接放在 h1 上方，没有“印记”文字说明。`design-contract.md` §5.2 与 `implementation-plan.md` P1d（182–220 行）列出了完整文章页规格。390px 截图里印记高 104px，标题字号 33.6px，印记约为标题的 3 倍高。
- 判断：首页和归档已经有编号、等宽元信息、几何印记；真正阅读的页面却退回“标题 + 正文 + 上下篇”。对计算机笔记站，这是最核心的页面，也是设计语言断档最明显的地方。
- 建议：按 P1d 补文章头两栏（42rem + 12rem）、规格表、TOC、h2 编号、代码 listing、图注、本文完、相关阅读。规格表里的“印记”写成“三角形 × 十字”这类中文标签，让 Seal 的 shape/core 变成可读信息，而不是纯装饰。
- 位置：`src/pages/posts/[...slug].astro`、`src/styles/global.css:660-692`、`docs/next-phase/design-contract.md` §5.2、`docs/next-phase/implementation-plan.md` P1d。

### F2 · 高 · 三档壳宽导致页头跳动

- 现象：`Base` 把同一个 shell 用在页头、`main`、页脚；页面切换宽度档时，品牌、导航、页脚整体横向位移。
- 证据：1440 下首页壳 1072px、归档/标签 880px、文章页 816px；品牌左边缘差 96–128px。`src/layouts/Base.astro:28` 计算 `shellClass`，`:104`、`:157`、`:163` 分别用于页头、main、页脚；`src/pages/index.astro:25` 用 wide，`src/pages/archive/index.astro:31` 用 mid，文章页没有 `width` prop，走默认 measure。
- 判断：这不是单页内的对齐问题，而是跨页面的“骨架不稳定”。设计契约里文章页本来是 wide 外壳 + 42rem 正文（P1d），当前直接用了 measure 外壳。
- 建议：站点 chrome（页头/页脚）固定 wide，正文列再分 measure/mid。这样翻页时品牌和导航不位移；正文仍保持 42rem 的阅读宽度。若要保留归档/标签的 mid 内容列，也应让页头/页脚独立于内容壳。
- 位置：`src/layouts/Base.astro:28,104,157,163`、`src/pages/index.astro:25`、`src/pages/archive/index.astro:31`、`src/pages/posts/[...slug].astro:23`。

### F3 · 高 · 空状态把首页撕成两半

- 现象：0 条碎碎念时，首页图例仍显示“碎碎念 00 · 暂无”并链到空页；页边栏只剩“现在”一行，右栏 200+px 空白；`/notes/` 只有一行“还没有碎碎念”；`/now/` 只有三行（标题、lead、最后更新）。
- 证据：`src/components/Frontispiece.astro:87-101` 只处理“无 now”的 `--2` 两格，不处理 notes=0；`src/components/MarginNotes.astro:23-57` 只判断 `notes.length > 0` 与 `nowDescription` 两项；`src/pages/index.astro:20-22` 的 `hasMargin` 只保证“notes 或 now 至少一个”。`p1c/review.md` §4（65–72 行）记录了“0 碎碎念 + 有 now”的组合，结果是“无 note-mini；页边只剩 now-line；图例碎碎念格 00 · 暂无”，这是当时接受的空态，不是遗漏。
- 判断：契约 C9 处理了“全空”，但没有处理“半空”。当前真实内容正好落在“半空”组合，所以首页和作者生活层看起来像半成品。
- 建议：两条路，二选一：
  1. 用户先写 2–3 条碎碎念，让页边与图例成立（内容由用户提供，agent 不代写）。
  2. 改空态：notes=0 时隐藏碎碎念图例格；`hasMargin` 不再因为 now 单独存在而渲染整栏，把 now 移到图例/开卷区；`/now/` 在正文为空时并入关于页，等有内容再独立。
- 位置：`src/components/Frontispiece.astro`、`src/components/MarginNotes.astro`、`src/pages/index.astro:20-22`、`src/pages/notes/index.astro:45-49`、`src/pages/now.astro:41-58`。

### F4 · 中高 · 首页目录没有上限

- 现象：首页 `.toc` 列出全部文章，并且与 `/archive/` 内容重复；行高 157px。
- 证据：`src/components/Contents.astro:16-50` 直接 `posts.map`；实测当前 4 篇 629px；按 157px/行估算，30 篇约 4.7k px、100 篇约 15.7k px。`p1c/review.md:113` 明确“首页在 100+ 文章下的目录长度与构建时间未压测”。
- 判断：4 篇时这是正常的“目录”；文章变多后，首页会变成第二份归档，首屏之后的滚动成本越来越高。
- 建议：首页只放最新 5–8 篇，末尾给“全部 N 篇 → 归档”；或把目录行压到 80–100px（去掉部分标签/摘要），把“完整目录”留给 `/archive/`。
- 位置：`src/components/Contents.astro`、`src/pages/index.astro`、`docs/next-phase/p1c/review.md:113`。

### F5 · 中 · 10–11px 的中文小字太多

- 现象：等宽 12px 的日期/计数没问题，但中文也被压到 10–11px：手机图例 10px；320 下 nav 11px、390 以上 nav 12px；`.label`、`.tag` 11px；页脚 11px + 0.2em 字距。
- 证据：`src/styles/global.css:185-191`（`.label` 0.6875rem）、`:1211-1225`（图例 0.6875rem）、`:1664-1672`（40rem 以下 0.625rem）、`:263-297`（导航 0.75rem 但中文字距 0.18em）、`:1707-1714`（24rem 以下导航 0.6875rem）、`:403-429`（页脚 label）。本次实测 320/390 图例为 10px。
- 判断：拉丁大写 + 字距可以小；中文 10px 在 Windows 100% 和手机上已经影响可读性。站点自己讲“中文可读性优先”，这一条与正文策略不一致。
- 建议：中文 utility 文本 ≥12px；0.2em 字距只给拉丁大写；mono 的日期/计数保留 11–12px。图例在 320 优先缩小列数/换行，不要缩字号。
- 位置：`src/styles/global.css`。

### F6 · 中 · 44px 热区没有统一执行

- 现象：nav、btn、more、note 锚点都用伪元素扩了热区；标签和页边小链接没有。
- 证据：实测 2 字标签 44×29px，“全部碎碎念 →”67×18px，“看看 →”41×23px，页脚“订阅 RSS”约 21px 高。`src/styles/global.css:609-620`（`.tag` 无 `::after`）、`:1292-1300`（`.margin-notes__head a` 无扩展）、`:1355-1360`（`.now-line p a` 无扩展）。P1a/设计契约要求新链接/按钮/锚点热区 ≥44px。
- 判断：标签是站内主要横切入口，29px 高在手机上偏小；页边小链接同样。WCAG 2.5.8 的 24px 最低线是过的，但没达到项目自己定的 44px。
- 建议：标签至少 44×44；内联链接用 padding 或伪元素扩热区，注意相邻链接热区不重叠。
- 位置：`src/styles/global.css:609-620,1292-1300,1355-1360`。

### F7 · 中 · 归档层级扁平

- 现象：1440 下年份“2026”73.6px，页面 h1“归档”48px，月份“10 月”17.6px，文章标题 h4 16.8px。月份和文章标题几乎同大，扫月时没有层级；10px 红色序号也偏小。
- 证据：`src/styles/global.css:1022-1027`（年份 `clamp(3rem, 8vw, 4.6rem)`）、`:1039-1042`（月份 1.1rem）、`:1062-1068`（h4 1.05rem）、`:1057-1061`（序号 0.625rem）。
- 判断：年份压过页面标题可以是编辑选择；但月份与文章标题同大，会让“按月扫读”失效。红色序号 10px 目前更像装饰，不承担定位功能。
- 建议：月份标题加大到 1.3–1.4rem 或加左侧月轨；序号 11–12px 或去掉；年份保留大字。重点是让“年 → 月 → 文章”三级一眼可分。
- 位置：`src/styles/global.css:1022-1068`、`src/pages/archive/index.astro:57-99`。

### F8 · 中 · 几何语义过载

- 现象：同一套几何形状被三套分类复用：卷首（圆=文章、方=碎碎念、三角=现在）、标签徽章（三角=算法、六边=计算机系统等）、文章印记（外框=首个标签、内芯=哈希选一枚）。文章页的 104px 印记没有文字说明；卷首红点落在圆的右边缘，像未读提示。
- 证据：`src/components/Frontispiece.astro:36-62`（三形状与红点 `cx=222`）、`src/const.ts:33-52`（`TAG_SHAPE`）、`src/components/Seal.astro:36-109`（shape/core 渲染）、`src/components/Badge.astro`。
- 判断：几何是本站的身份，但读者无法从“三角”推断含义；同一形状在不同上下文表示不同东西，会削弱系统感。文章页的印记尤其像“看不懂的装饰”。
- 建议：P1d 的规格表加入“印记：三角形 × 十字”之类的中文标签，让 shape/core 可学习；卷首图形要么在图例里说明对应关系（已有图例，但形状本身无标签），要么退回纯装饰，不暗示分类。红点要么给解释，要么去掉。
- 位置：`src/components/Frontispiece.astro`、`src/const.ts`、`src/components/Seal.astro`、`src/components/Badge.astro`、P1d 规格表。

### F9 · 中低 · 题记与引用样式语义不明

- 现象：`.article__desc` 是整块灰底 + 红左规 + 内陷阴影，视觉重量仅次于标题；`.prose blockquote` 只有上方 28px 红线，没有缩进/引号，`math-xor` 里“最终成绩……”读起来像图注而不是引用。
- 证据：`src/styles/global.css:672-684`（题记）、`:748-766`（blockquote）；`src/content/posts/math-xor.md:13` 用了 `>` 引用。
- 判断：题记的灰块和阴影是全站唯一允许的阴影用例，但面积大，容易和正文抢；引用没有视觉上的“引用”信号，语义丢失。
- 建议：题记减弱底色或缩窄（或去掉阴影，只留红规 + 衬线）；blockquote 加左缩进 + 「」或左侧红竖线，让它和题记明显不同。中文没有真斜体，不要靠 italic。
- 位置：`src/styles/global.css:672-684,748-766`。

### F10 · 低 · 主题开关是页头视觉最强的元素

- 现象：亮色是黑色胶囊，暗色是正红胶囊；导航是 12px 灰字。页头唯一的实心块是工具性控件。
- 证据：`src/styles/global.css:299-365`；亮/暗实测中，开关是页头唯一的高对比实心块。
- 判断：如果这是有意的“红色开关”符号，可以保留；否则它把注意力从品牌/导航抢走了。工具控件不该是页头最响的元素。
- 建议：改图标按钮或降低轨道对比度；保留 `role="switch"` 与 `aria-checked`；也可把开关移入页脚。不要牺牲键盘可用性。
- 位置：`src/styles/global.css:299-365`、`src/layouts/Base.astro:136-151`。

### F11 · 低 · 暗色 `--rule` 太弱

- 现象：暗色 `--rule: #2a2c2f` 与 `--paper: #111214` 约 1.3:1；标签边框、标签索引行线、页边竖线在暗色下非常弱。
- 证据：`src/styles/global.css:59-71` 的暗色 token；评审时在 1440 暗色下核对（可视化版只保留 3 张关键截图）。
- 判断：亮色 `--rule` 也只有约 1.3:1，但白底黑线的方向让发丝线可读；暗色更容易丢结构。如果这些线是装饰，可接受；如果承担表格/索引结构，就需要提亮。
- 建议：暗色 `--rule` 提到 `#34383c` 一档，或让结构性分隔使用 `--ink`、纯装饰才用 `--rule`。改 token 时同步两个深色入口。
- 位置：`src/styles/global.css:59-71,73-115`。

### F12 · 低 · 一致性 bug

- 现象与证据：
  - **“最近更新”用 `pubDate`**：归档和标签详情显示“最近更新 2026.10.19”，但当前 4 篇文章的 `updatedDate` 都是 10.29，文章页显示“更新于 10.29”。位置：`src/pages/archive/index.astro:46`、`src/pages/tags/[tag].astro:33`、`src/pages/posts/[...slug].astro:45-47`。
  - **标签详情计数不补零**：“2 篇文章 / 共 2 篇”，其他页面是 02/04/06。位置：`src/pages/tags/[tag].astro:31,43`。
  - **日期缺 `<time>`**：文章、归档、首页、标签详情都是 `<span class="meta">`，只有碎碎念用了 `<time datetime>`。契约 §6.7 要求 `<time>`。位置：`src/pages/posts/[...slug].astro:43`、`src/pages/archive/index.astro:89`、`src/pages/tags/[tag].astro:67-70`、`src/components/Opening.astro:22-25`。
  - **阅读时长文案不统一**：开卷/文章页“1 分钟读完”，目录/归档/标签“1 分钟”。
  - **`pubTime` 只在部分列表出现**：开卷、标签详情、文章页显示；首页目录和归档不显示。位置：`src/components/Opening.astro:23`、`src/pages/tags/[tag].astro:68-70`。
  - **页脚 RSS 出现两次**：`SOCIALS` 里有一个 RSS，“订阅 RSS”又出现一次；同一目标两条链接。位置：`src/const.ts:24-28`、`src/layouts/Base.astro:162-183`。
  - **页脚实现说明占位**：“Astro 构建 · GitHub Pages 托管”是构建细节，读者价值低，且和 RSS 挤在同一行。位置：`src/layouts/Base.astro:179-181`。
  - **文章页没有 `aria-current`**：文章页 `Base` 没有 `active`，导航四项都不高亮。位置：`src/pages/posts/[...slug].astro:23`。
- 判断：这些不影响主结构，但会让“编辑部”系统露馅，尤其是“最近更新”是事实性错误。
- 建议：`最近更新` 改为 `max(updatedDate ?? pubDate)`，或把文案改成“最新发布”；计数统一 `padStart(2,'0')`；日期换 `<time datetime="YYYY-MM-DD">`；阅读时长统一一种文案；`pubTime` 要么全显示要么全不显示；页脚只留一个 RSS，并决定是否保留“Astro 构建 · GitHub Pages 托管”；文章页可以给 `active="home"` 或按语义选一项。
- 位置：见上。

### F13 · 低 · 打印规则遗漏

- 现象：打印样式隐藏了主题开关、skip、碎碎念锚点、now-foot，但没有隐藏文章页的 `.pager`、`.article__seal`、`.kicker` 链接；设计契约 P1d/P1e 要求打印隐藏 TOC/相关/上下篇/页边规格。
- 证据：`src/styles/global.css:905-938`；`docs/next-phase/implementation-plan.md` P1d 第 9 条、P1e 第 3 条。
- 判断：P1d 还没做 TOC/相关，所以现在只有 pager/seal 暴露出打印遗漏；实现 P1d 时要一起补。
- 建议：打印时隐藏 `.pager`、`.article__seal`、kicker 链接、TOC、相关阅读、页边规格；代码/表格/图 `break-inside: avoid`；用真实文章导出 PDF 检查。
- 位置：`src/styles/global.css:905-938`。

### F14 · 低 · 标签索引“最近”列重复

- 现象：6 个标签里 3 个“最近”都是同一篇“GitHub 配置代理”；“最近”列占了一整列宽度。
- 证据：`src/pages/tags/index.astro:41-46` 每行渲染 `latest.data.title`；标签索引页上工具/Git/GitHub 三行重复。
- 判断：对 4 篇文章的站，这列的信息增量很低；它把“标签名”和“计数”之间塞进了重复文本。
- 建议：桌面端也可以去掉“最近”列，或只在最近一篇不是重复项时显示；把计数作为主要信号。移动端已经隐藏这一列（`max-width: 40rem`），桌面可对齐同样逻辑。
- 位置：`src/pages/tags/index.astro:41-46`、`src/styles/global.css:986-1005`。

### F15 · 低 · 首页 tagline 文案重复 + 孤行

- 现象：`SITE.tagline + ' · ' + SITE.description` 拼成“一个佛大计算机学生的笔记站 · 计算机系统、算法题解与开发工具的个人笔记。”；1440 下第二行只剩“笔记。”。
- 证据：`src/const.ts:1-8`、`src/layouts/Base.astro:121-124`、`src/styles/global.css:240-246`（`max-width: 30rem`）；1440 实测第二行只剩“笔记。”。
- 判断：两句都在说“笔记”，语义重复；`max-width: 30rem` 让 1440 下出现两字孤行。文案属于作者内容，agent 不代写。
- 建议：删掉重复分句，保留一句 20–30 字的 tagline；或把 `max-width` 放宽到 34–36rem，并加 `text-wrap: pretty`。文案改法请用户确认。
- 位置：`src/const.ts:1-8`、`src/layouts/Base.astro:121-124`、`src/styles/global.css:240-246`。

## 5. 处置顺序

1. **先修事实性 bug（F12）**：`最近更新`、列表计数补零、`<time>`、页脚 RSS。独立小 PR，不依赖设计，也不该等 P1d。
2. **P1d 文章页（F1 + F8 的印记标签 + F9 + F13）**：这是阅读页主体，也是设计语言断档最明显的地方。按 `implementation-plan.md` P1d 的**精简版**做（2026-10-30 规模收敛：文章头/规格表/印记标签/本文完/打印隐藏；TOC、H2 编号、代码标题栏、图注、相关阅读延后）。
3. **P1d 前置或 P1e 的结构修补（F2 + F3）**：壳宽统一与空状态决定“像不像一个完整的站”。F3 需要用户先决定是补内容还是改空态。
4. **P1e 收尾（F4/F5/F6/F7/F10/F11/F14/F15）**：目录上限、微字号、热区、归档层级、暗色线、标签列、tagline，连同真机/读屏/打印/100+ 压测一起做。

> 2026-10-30 实施记录（F12 + F2，分支 `fix/frontend-review-f12-f2`，已通过本地验证）：
> - F12：`最近更新` 改取 `max(updatedDate ?? pubDate)`；标签详情的列表计数补零（正文描述用自然数字）；日期统一 `<time datetime>`；阅读时长统一“N 分钟”；`pubTime` 只在文章页显示；页脚删除构建说明行，只保留 `SOCIALS` 中一个 RSS；文章页不强行 `aria-current`（文章不属于“目录”导航页）。
> - F2：页头/页脚固定 `wide`，`main` 按页面分档；`html` 加 `scrollbar-gutter: stable`，短页与长页品牌左边缘一致。
> - 验证：`npm run verify` PASS（CSS 14.6/18.0 KB，JS 0.0/3.0 KB，dist 1.6/2.6 MB）；`npm run audit` 0 vulnerabilities；1440/390/320 实测无横向滚动，1440 品牌左边缘均为 249px。
> - 未动：F1、F3、F4–F15；F3 仍需用户决定“补内容/改空态”。

> 2026-10-30 规模收敛（用户确认，覆盖本文旧口径）：
> - F1/P1d 精简：只做文章头/规格表/印记中文标签/本文完/打印隐藏；TOC、H2 编号、代码标题栏、图注、相关阅读延后，触发条件见 `implementation-plan.md` P1d。
> - F6：44px 只覆盖标签/按钮/主导航等主要触控目标；正文内联链接维持 WCAG 2.5.8 的 ≥24px。
> - F12：正文计数不补零（“2 篇文章”）；文章页不强行 `aria-current`。
> - F4 延后到 >10 篇或首页 >2 屏；F7/F9/F10/F11/F14 暂不动；F3 继续补 2–3 条碎碎念。

不要把这些混进一个 PR：文章内容、框架改动、空态文案、视觉 token 变更按 AGENTS 的双轨和“一个阶段一个 PR”分开。

## 6. 建议验收

每个框架改动 PR 按 AGENTS 走：`npm run verify` + `npm run audit`，用户本地试用后再 push/开 PR。本文不提供代码，只给验收口径。

| ID | 验收口径 |
| --- | --- |
| F1 | 精简版：文章头/规格表/印记中文标签/本文完可用；打印隐藏 pager/seal/kicker；320/390/768/1024/1440；文章页 JS 仍为 0。TOC/编号/代码栏/图注/相关阅读按 §5 的触发条件后置 |
| F2 | 1440 下 `/`、`/archive/`、`/tags/`、`/tags/[tag]/`、`/posts/[slug]/`、`/about/` 的品牌左边缘一致；页头/页脚壳宽相同；无横向滚动 |
| F3 | 6 种空状态组合逐一截图；notes=0 时不出现空图例格/空页边；`/notes/`、`/now/` 不再是一条/三行死胡同；没有链接指向空内容 |
| F4 | 延后到 >10 篇或首页 >2 屏；届时再定上限（N 篇或“最新 5–8”）并做压测 |
| F5 | 计算样式抽查：中文 utility 文本 ≥12px；图例在 320 不缩到 10px；mono 日期/计数保持 11–12px |
| F6 | 标签/按钮/主导航等主要触控目标 ≥44×44；正文内联链接 ≥24px（WCAG 2.5.8）；相邻热区不重叠；键盘 Tab 顺序不变 |
| F7 | 年/月/文章三级字号与间距可一眼区分；320 下月份与标题仍可扫读 |
| F8 | 规格表出现“印记：形状 × 内芯”；卷首形状有图例说明或纯装饰；红点有解释或被移除 |
| F9 | 题记在 1440/390 下不压过标题；blockquote 与题记视觉可区分；中文无斜体 |
| F10 | 页头最响的元素是品牌/导航，不是开关；开关仍可键盘操作、`aria-checked` 正确 |
| F11 | 暗色截图检查标签边框/索引行线/页边竖线；若提亮 `--rule`，两个深色入口逐字同步 |
| F12 | “最近更新”与文章页“更新于”一致（或改文案）；列表计数补零、正文计数用自然数字；日期使用 `<time datetime>`；阅读时长文案统一；页脚只有一个 RSS；文章页不强行 current |
| F13 | 打印隐藏 pager/seal/kicker；TOC/相关/页边规格等组件出现后再补；代码/表格/图不跨页断裂 |
| F14 | 标签索引不再出现三行同样的“最近”；桌面/移动端策略一致 |
| F15 | 1440 下 tagline 无两字孤行；文案不重复；改动经用户确认 |

补充：F3/F4 需要 100+ 文章、100+ 碎碎念的压力数据；本次没有压测，不能用 4 篇文章的截图代替。

## 7. 未覆盖 / 未验证

- 本次没有重跑 `npm run verify`；结论基于 2026-10-29 的 `dist`。如果源码已变，需要重新构建再测。
- 没有 iPhone Safari / Android Chrome 真机走查；只有 headless Chrome 模拟。
- 没有 NVDA / VoiceOver 读屏测试；skip link 在 Safari 的焦点行为未验证。
- 没有导出打印 PDF；打印结论来自 CSS 阅读与计算样式。
- 没有 100+ 文章 / 100+ 碎碎念压测；F4 的 30/100 篇数字是按 157px/行外推。
- notes/now/about/404 未跑 320/390/768 全矩阵；这些页面只在 1440 做了截图与代码核对。
- 没有测禁用 JS 的完整矩阵；暗色双入口只在 CSS 层保持。
- 没有测 Firefox/Safari 的 `:has()`、`text-wrap: balance/pretty` 回退。
- 没有测 LCP/CLS/INP；只引用了 P1c review 的体积记录。
- 没有抓取线上站点；线上可能仍是旧版，浏览器缓存约 10 分钟。

## 8. 已知不做 / 后续

以下不是本次缺陷，按现有契约暂不做，不要顺手加进来：

- 站内搜索：P2，先验证中文分词/索引体积/子路径/无结果态。
- 逐篇 OG、旧链接重定向、字体死重清理、Lighthouse/外链巡检：P2。
- 系列页：暂缓（`series-contract.md` 保留）。
- 评论、统计、Newsletter、点赞、友链、Webmention：暂不做。
- 不添加 LICENSE（用户已明确拒绝）。
- 不为了预览把 `draft` 改成 false 再改回来；草稿只在 dev。

## 9. 证据与复现

- 产物：本地 `dist`，2026-10-29 构建，生产子路径 `/xin-s-blog/`；内容为 4 篇文章、0 条碎碎念、now 一行。
- 视口：320 / 390 / 768 / 1440；亮/暗；headless Chrome CDP，`deviceScaleFactor=1`。
- 方法：`Page.captureScreenshot` + `Runtime.evaluate` 取样；`document.documentElement.scrollWidth` 与 `innerWidth` 比对；`getBoundingClientRect` 量壳宽/热区；计算样式取字号/颜色。
- 临时 CDP 脚本未入库；关键数值可用浏览器 DevTools 复测。关键截图与可视化版为本地评审产物（仓库根目录 `frontend-review/frontend-review.html`，未入库）。
- 本次没有修改任何站内代码；本文是纯文档。

## 10. 链接

- `docs/next-phase/design-contract.md`：§5.2 文章页规格、§6.7 元信息、§7 可访问性、§12 不做清单。
- `docs/next-phase/implementation-plan.md`：P1d 文章页（182–220 行）、P1e 收尾（224–241 行）。
- `docs/next-phase/p1c/review.md`：§4 空状态组合、第 113 行“100+ 未压测”。
- `docs/next-phase/p1c/README.md`：首页卷首范围与空状态目标。
- `docs/next-phase/p1a/ui-foundation.md`：宽度 token、44px 热区、页头/页脚骨架。
- `docs/next-phase/runtime-contract.md`：JS/第三方准入、性能预算、可访问性。
- `AGENTS.md`：双轨、文档体系、不可破坏的约定。
- 可视化版：本地 `frontend-review/frontend-review.html`（未入库，单页无外部依赖）。

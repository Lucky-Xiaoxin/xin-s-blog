# P1b 实施文档：碎碎念与 now

> 状态：已验收 · 2026-10-24（实现、验证与验收复核均通过；验收证据见 `review.md` §9）
> 上游：`design-contract.md`（已批准）、`notes-contract.md`（已批准）、`now-contract.md`（已批准）、`p1a/review.md`（P1a 已验收）
> 下游：P1c 首页（消费 notes/now 数据）、P1e SEO/a11y/真机
> Owner：实现规划师
> 复核/证据：`review.md`（命令输出、注入结果、浏览器矩阵、允许差异、未覆盖项）

## 1. 目标

把“作者在场”从契约变成可发布的两条内容线（术语：**notes = 碎碎念**，**now = 现在页**）：

- **碎碎念**：`src/content/notes/` + `/notes/` 时间流 + 独立 `/notes/rss.xml`；每条有稳定锚点，不生成独立页面。
- **now**：`src/content/pages/now.md` + `/now/` 静态页；显示“最后更新于”，每月覆盖更新。

同时把首页 P1c 需要的数据（最新 notes、notes 计数/最近日期、now 摘要）准备好，但**不改首页**。

**为什么不能跳过**：P1c 的卷首图例、页边 notes、now 一行都依赖这两个 collection；先做首页会硬编码或空转。

## 2. 范围

### 做

1. **数据层**：`src/content.config.ts` 增加 `notes`、`pages` collection；新增 `src/lib/notes.ts`、`src/lib/now.ts`。
2. **`/notes/`**：月份分组、时间倒序、`:target` 红规线、草稿 dev 预览、空状态；不显示 `N°`。
3. **`/notes/rss.xml`**：独立 feed；主 `/rss.xml` 继续只发文章；**首版不放可见订阅按钮/链接**，feed 仅通过直接 URL 访问。
4. **`/now/`**：渲染 `now.md`、`updatedDate`；首版为单行状态 `emo中……`、正文可空；以后有小节时启用 2 列（移动端单列）；不占主导航。
5. **入口**：页脚加“碎碎念 / 现在”；`/about/` 补两条链接；`SOCIALS` 保持只含联系方式。
6. **字体子集**：`scripts/subset-fonts.mjs` 扫描 `src/content/notes` 与 `src/content/pages` 的 frontmatter、标题行、引用行。
7. **门禁**：`check-dist` 增加 notes/now 产物、草稿泄漏、notes 锚点/RSS 交叉校验、sitemap、notes 页重复 id。
8. **内容模板**：提供 `src/content/notes/_template.md`（永远不作为 note）；`src/content/pages/now.md` 首版写入用户已定的单行状态 `emo中……`（`draft: false`，正文为空）。
9. **文档**：README（发布流程）、AGENTS（不变量）、TROUBLESHOOTING（新报错）；本目录文档随实现更新。

### 不做（非目标）

- 不改首页卷首/开卷/页边/目录（P1c）；不改文章页结构（P1d）。
- 不做 `/notes/[slug]/` 独立页面、逐条 OG/JSON-LD、notes 标签/标签云、N° 编号。
- 不把 notes 混进文章列表、归档、标签、主 RSS。
- 不做评论、点赞、统计、友链、Newsletter、Webmention、自动同步。
- 不新增第三方脚本/字体/色相/依赖；站内 JS 仍只有主题切换。
- 不自动生成/代写 notes 个人内容；不把示例文案当成真实内容发布。now 首版内容由用户明确提供（`emo中……`），不是代写。
- 不做 now 历史版本、now RSS、多 now 页面。
- 不在 P1b 补 JSON-LD/OG 策略（P1e）；notes/now 沿用 Base 的 website OG。

## 3. 依赖与 PR 顺序

```
P0（已验收）──> P1a（已验收）──> P1b ──> P1c
                                  └────> P1e（部分依赖）
```

建议**一个分支/PR** `feat/notes-now`，内部两个提交，避免半成品：

1. `feat: notes/pages 数据层与门禁`：collections、`lib/notes.ts`、`lib/now.ts`、字体子集、模板、check-dist 通用守卫（重复 id）。
2. `feat: 碎碎念与 now 页面`：`/notes/`、`/notes/rss.xml`、`/now/`、页脚/关于链接、CSS、check-dist 产物/RSS/sitemap 守卫、文档。

如果实现中页面体积/样式明显膨胀，可再拆 `feat/notes-page` 与 `feat/now-page`；但**不要**先合并会生成空路由/死链的提交。P1b 会改 `global.css`/`Base.astro`，不要与 P1c/P1d 同时开改这两个文件的 PR。

## 4. 文件地图

| 文件/接口 | 动作 | 说明 |
| --- | --- | --- |
| `src/content.config.ts` | 改 | `notes`、`pages` schema；notes 只收顶层 `*.md` |
| `src/content/notes/_template.md` | 新增 | 模板；`_` 前缀永远被 `notes.ts` 忽略 |
| `src/content/pages/now.md` | 新增 | 首版用户已定内容：单行 `emo中……`，`draft:false`，正文为空 |
| `src/lib/notes.ts` | 新增 | 读取/校验/排序/分组/锚点/最近 notes |
| `src/lib/now.ts` | 新增 | `getNow()`；dev 含草稿、build 排除 |
| `src/pages/notes/index.astro` | 新增 | 月份分组流；空状态；页头只显示计数/最近更新，不放 RSS 按钮 |
| `src/pages/notes/rss.xml.js` | 新增 | 独立 notes feed；只含已发布 notes |
| `src/pages/now.astro` | 新增 | now 页；空状态；mid 壳 |
| `src/pages/about.astro` | 改 | 补 notes/now 链接；不改现有段落结构 |
| `src/layouts/Base.astro` | 改 | 页脚 `PAGE_LINKS`；不新增 notes feed 自动发现 |
| `src/const.ts` | 改 | 新增 `PAGE_LINKS`（碎碎念/现在）；`SOCIALS` 不变 |
| `src/styles/global.css` | 改 | `.note-*`、`.now-*`、`.empty-state`；只加规则，不替换体系 |
| `scripts/subset-fonts.mjs` | 改 | 扫描 notes/pages 的 frontmatter/标题/引用 |
| `scripts/check-dist.mjs` | 改 | 产物/草稿/锚点/RSS/sitemap/重复 id |
| `README.md`、`AGENTS.md`、`TROUBLESHOOTING.md` | 改 | 发布流程、不变量、新报错 |
| `docs/next-phase/p1b/review.md`、`screens/` | 实施后新增 | 实测证据；不在规划阶段创建假记录 |

## 5. 关键决策

1. **锚点唯一化**：`n-<文件 id>` = `n-YYYY-MM-DD-slug`，永远带 slug；不做“同日第一条只写日期”。理由：插入同日旧 note 不会让既有锚点漂移；`_` 前缀文件只作模板，永远不渲染。详见 `content-model.md`。
2. **不显示 N°**：沿用设计契约 C4；只显示日期/可选时间/锚点，避免回填导致编号重排。
3. **排序固定**：`date` 倒序 → 同日 `time` 倒序（无 time 视为最后）→ `id` 倒序；日期/分组一律 UTC getter，与 `formatDay` 同源。
4. **now 首版内容已定（2026-10-23）**：用户定为单行状态 **`emo中……`**。`now.md` 的 `description` 就是这句话，`draft: false`，**正文可以为空**；`/now/` 支持“只有页头”的形态：渲染 h1/导语/最后更新，不渲染 `.now-body`/`.now-foot`。以后想分节，再按 `content-model.md` 的 4–6 节规则，两列样式才会启用。`updatedDate` 填实际发布日（实施当天为 2026-10-23，可改），不编造经历。
5. **notes 首版 0 条（用户 2026-10-23 确认）**：上线时 `/notes/` 显示“还没有碎碎念”；测试用临时中性夹具，发布前删除；不代写。用户想写时复制 `src/content/notes/_template.md` 为 `YYYY-MM-DD-slug.md`。
6. **页脚入口独立于联系方式**：新增 `PAGE_LINKS` 并在 Base 页脚拼接 `[...PAGE_LINKS, ...SOCIALS]`；**不要把 notes/now 塞进 `SOCIALS`**，否则 `/about/` 的“联系我”会多出两个站内页。
7. **now 两列用 CSS 多列，不新增 rehype 插件（用户 2026-10-23 接受）**：Markdown 正文直接渲染进 `.now-body`，桌面 `column-count: 2`，`h2` 用 CSS counter 编号 01…；40rem 以下单列。首版正文为空，不触发分栏。理由：不破坏 Markdown 作者体验，零 JS、零新依赖；代价是分栏边界不如手写 `<section>` 精确，允许作为实现差异记录。
8. **零 JS**：notes 锚点、`:target` 红规线、now 分栏、feed 都是静态 HTML/CSS；不新增脚本。
9. **草稿语义与文章一致**：dev 可见并带“草稿预览”；build 页面/RSS/首页数据一律排除；不为了预览改 `draft` 来回切换。
10. **notes RSS 不放可见入口（用户 2026-10-23 确认）**：`/notes/rss.xml` 仍生成并可被门禁校验，但页面/页脚都不放“订阅碎碎念”按钮或链接；页脚现有 RSS 仍指主文章 feed `/rss.xml`，不改成 notes feed。

## 6. 验收

### 命令

```bash
npm run check
npm run verify
npm run dev        # 草稿/空状态手测
```

`verify` 必须用生产子路径 `/xin-s-blog/` 构建；`check-dist` 新增项必须全部 PASS。

### 数据/功能

- `/notes/`：月份分组、倒序、锚点、草稿徽标（dev）、空状态；每条 `:target` 有红规线。
- `/notes/rss.xml`：只含已发布 notes；item 链接锚点在 `/notes/` 中存在；0 notes 时 feed 仍合法；页面/页脚无可见订阅按钮。
- `/now/`：首版渲染单行 `emo中……` + “最后更新于”；正文为空时不渲染 `.now-body`/`.now-foot`；草稿/缺失时只显示空状态，无 `now-status`。
- 页脚“碎碎念/现在”、about 链接在 `/xin-s-blog/` 下可达；主导航仍 4 项。
- `now.md` 为用户提供的单行状态；notes 首版 0 条，内容不代写、不编造。

### 视觉/可访问性

- 320/390/768/1024/1440；亮/暗；无 JS + 系统暗色；打印。
- 320/390 无横向滚动；页脚换行不溢出；notes 单列；now 单列。
- 每页 1 个 h1；月份分组有 `aria-labelledby`；锚点链接有 `aria-label` 且焦点可见；重复 id 为 0。
- 新增样式只消费现有 token；暗色双入口、Shiki、KaTeX、`.scroll-x`、字体子集不回归。

### 门禁/体积

- `check-dist`：notes/now 产物齐全；草稿不泄漏；notes RSS/锚点/sitemap 正确；notes 页无重复 id。
- 体积不超 P0 预算：CSS ≤18KB gzip、站内 JS 0/≤3KB、字体 ≤1.5MB、max HTML ≤30KB、dist ≤2.6MB。
- notes/now 的衬线用字进入子集；首版 now 单行不走衬线，重点检查 notes 引用行/未来小节标题；构建无缺字警告（源字体缺字只警告，但必须在交付说明中列出）。

## 7. 风险与回滚

| 风险 | 对策 |
| --- | --- |
| 同日多条 note 锚点冲突 | 统一 `n-<id>`；id 含 slug，天然唯一；check-dist 查重复 id |
| 回填旧 note 导致编号/锚点漂移 | 不做 N°；锚点只由文件名决定 |
| 时区导致日期少一天 | 日期/分组/`updatedDate` 全部 UTC getter，与 `formatDay` 同源 |
| 草稿泄漏到 notes 页/RSS/首页数据 | `listNotes(false)` 统一过滤；check-dist 注入草稿锚点必须 FAIL |
| now 没有内容时上线空页 | 首版内容已定为单行 `emo中……`；正文为空只渲染页头；draft/缺失才走空状态，不显示假日期 |
| 字体子集漏扫 notes/pages | 扩展扫描 + build 后 fontkit 抽查 notes 引用/未来 now 小节；首版 now 单行不走衬线 |
| 两列正文分栏断裂难看 | `break-after/inside` 控制；40rem 以下单列；本地试用重点看 now |
| 页脚新增链接在 320 溢出 | 复用现有 `flex-wrap`；320 实测；必要时缩小 gap 而不是删链接 |
| P1b 与 P1c/P1d 同时改 Base/CSS | 按依赖顺序，P1b 先合并；不并行开改同文件的 PR |
| notes RSS 与主 RSS 混淆 | 独立路由/标题/描述；主 RSS 断言仍只有文章 |

回滚：revert P1b merge commit；不涉及数据迁移/外部状态。若只回滚页面，保留 collection 不影响现有页面。

## 8. 待确认

**无**。原 B1–B4 已由用户于 2026-10-23 全部确认，决定记录如下：

| 编号 | 问题 | 决定 |
| --- | --- | --- |
| B1 | 首次 now 内容 | 单行 `emo中……`，`draft: false`，正文可空 |
| B2 | 首版 notes 是否至少放 1 条真实碎碎念 | 允许 0 条；页面显示空状态，测试夹具发布前删除 |
| B3 | now 两列用 CSS 多列 | 接受；首版正文为空，不触发分栏 |
| B4 | notes 页是否放“订阅碎碎念 RSS”按钮 | 不放；`/notes/rss.xml` 仍生成，页脚 RSS 保持主文章 feed |

## 9. 链接

- `content-model.md`：schema、命名、锚点、排序、校验、草稿、字体子集。
- `pages-and-feed.md`：`/notes/`、`/notes/rss.xml`、`/now/`、入口与样式规格。
- `check-dist-guards.md`：新增门禁与故障注入。
- `test-plan.md`：测试矩阵、证据、退出标准。
- 上游：`../notes-contract.md`、`../now-contract.md`、`../design-contract.md`、`../p1a/review.md`。

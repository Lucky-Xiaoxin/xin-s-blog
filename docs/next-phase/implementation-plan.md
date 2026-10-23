# 实施计划（设计契约已批准）

> 状态：实施中 · 2026-10-23（P0 已验收；P1a 实现与本地验证完成，待用户试用确认；P1b 未开始）。本文保留 P0→P1e 的拆解、测试与完成定义。
> 依赖：`design-contract.md`（已批准）、`notes-contract.md`、`now-contract.md`、`runtime-contract.md`。
> 规则：每个阶段单独分支/PR；用户本地试完才 push；文章/碎碎念/now 的个人内容不代写。

## 0. 基线（2026-10-22）

- Astro 5 静态站，GitHub Pages 子路径 `/xin-s-blog/`；4 篇文章。
- `npm run check`：0 error / 0 warning。
- `dist`：约 1.8 MB；CSS 12.9 KB gzip；字体 1.36 MB / 77 文件；无独立 JS 文件。（2026-10-22 快照；当前为 dist 1.5 MB、CSS 13.0 KB，见 README。）
- 设计方向：方向一「卷首」已选定，契约已批准。
- 当前范围：碎碎念 + now；系列暂缓；搜索/评论/统计/友链/Newsletter 不做。

## 1. 实施原则

1. 先数据层与门禁，再视觉；避免“先改 CSS、再补数据”的返工。
2. 不整份替换 `global.css`；把设计稿的 token/组件合并进现有体系，保留明暗双入口、Shiki、KaTeX、`.scroll-x`、字体子集。
3. 每个 PR 只做一类事；不把设计改版和内容录入混在一起。
4. 每个 PR 必须给出：变更范围、测试命令、截图/视口、未覆盖风险。
5. 所有站内链接走 `u()`；所有新路由必须在 `BASE_PATH=/xin-s-blog/` 下构建验证。
6. 不新增第三方脚本；本阶段站内 JS 仍只有主题切换（后续复制按钮单独评估）。
7. 文章内容不改；notes/now 的个人内容由用户提供，先做空状态/模板。

## 2. PR 序列

### P0 · `feat/content-foundation`

**目标**：抽数据层、修草稿预览、建立 `verify` 门禁；不改视觉。

> P0 详细契约见 `docs/next-phase/p0/`（README、data-and-draft、verify、test-plan）。
> 建议拆 **P0a（数据层 + 草稿预览）** 与 **P0b（verify + check-dist + CI）** 两个 PR；P0b 依赖 P0a。

**文件**

- 新增 `src/lib/posts.ts`。
- 改 `src/pages/index.astro`、`src/pages/posts/[...slug].astro`、`src/pages/tags/index.astro`、`src/pages/tags/[tag].astro`、`src/pages/rss.xml.js`。
- 新增 `scripts/check-dist.mjs`、`scripts/verify.mjs`、`scripts/preview.mjs`；改 `package.json` scripts（`check:dist`/`verify`/`preview:prod`）。
- 更新 `README.md`、`AGENTS.md`、`TROUBLESHOOTING.md`（草稿预览、verify 用法）。

**任务**

1. `getPublishedPosts()`、`getPostBySlug()`、`getAdjacentPosts()`、`getAllTags()`；所有路由/RSS 统一使用；保留 `byNewest`。
2. 草稿预览：`getStaticPaths` 仅在 `import.meta.env.DEV` 纳入 `draft: true`；首页/RSS/标签仍排除；dev 页面显示“草稿预览”标记；build 产物不得出现草稿；修正 README 第 25 行的矛盾。
3. `npm run verify`：跨平台 Node 脚本设置 `BASE_PATH=/xin-s-blog/`、`SITE_URL`，执行 `astro check` + build + `check-dist`。
4. `check-dist`：根绝对路径、内部链接/锚点、草稿泄漏、canonical/OG、RSS/sitemap 路由、体积预算。
5. `preview:prod`：用同款生产参数预览 verify 产物；普通 `preview` 仍对应普通 build。
6. 预算：CSS gzip ≤18 KB；站内 JS ≤3 KB；dist ≤2.6 MB；字体 ≤1.5 MB。

**验收**

- 现有页面视觉不变（除 dev 草稿标记）；`npm run verify` 绿；dist 无草稿；子路径链接全通；无新增 JS。
- `math-xor` 仍有公式；RSS/sitemap 正常。

**风险**

- `check-dist` 的 HTML 解析要简单可靠；不要引入重依赖。
- dev/build 的 `getStaticPaths` 分支要测；避免草稿泄漏。
- `verify` 会多一次构建，CI 时间可接受。

---

### P1a · `feat/design-foundation`

> 实现状态：完成（2026-10-23），证据见 `p1a/review.md`；待用户本地试用确认后 push/开 PR。

**目标**：统一新壳、tokens、导航/页脚、归档/标签/404；先不动首页和文章正文。

> P1a 详细契约见 `docs/next-phase/p1a/`（README、ui-foundation、check-dist-guards、test-plan）。
> 建议先做 `fix/check-dist-guards`（F1/F2 两个 P2 假阴性），再开 P1a UI 分支。

**文件**

- `src/styles/global.css`（合并 tokens/组件，不替换）。
- `src/layouts/Base.astro`（`width` prop、导航、页脚）。
- `src/const.ts`（NAV 加归档；页脚结构调整；notes/now 链接延后到 P1b）。
- `src/pages/archive/index.astro`（新增）、`src/pages/tags/index.astro`、`src/pages/tags/[tag].astro`、`src/pages/404.astro`。
- 可选新增 `src/components/PageHead.astro`。

**任务**

1. Tokens：`--mid 46rem`、`--wide 58rem`、`--gutter: clamp(1.25rem, 6vw, 4.5rem)`、`--ease`；保留 `--measure 42rem`、`--bleed`/颜色/字体。
2. `Base.astro` 增加 `width: 'measure' | 'mid' | 'wide'`；页头/main/页脚同壳。**P1a 只给归档/标签/关于/404 启用 mid；首页/文章保持 measure，P1c/P1d 再切 wide**，避免半成品宽布局。
3. 导航 4 项（加归档）；页脚结构先调整，**notes/now 链接随 P1b 路由一起加**，不提前放死链；全部 `u()`。
4. 归档页：年月分组、连续编号、动态计数；移动端隐藏阅读时长列。
5. 标签索引：徽章/名称/最近一篇/计数；标签详情用紧凑 `contents` 列表。
6. 404：保留 `40[4]` 标记，套新壳；不生成 canonical/OG。
7. 打印/减少动效/焦点的基础规则同步。

**验收**

- 320/390/768/1024/1440 无横向滚动；导航 320 不换行；亮/暗；禁用 JS。
- 归档/标签数据正确；标签详情过滤正确；404 仍是 noindex。
- 现有文章页/首页暂不改，但壳变化要在各页回归。

**风险**

- `--gutter` 改窄会影响所有页面；需要全站截图。
- 新壳宽度和现有 `masthead--compact .shell` flex 的相互作用。
- 标签详情无设计稿；按契约默认实现。

---

### P1b · `feat/notes-now`

**目标**：notes/pages collection、`/notes/`、`/now/`、notes RSS、字体子集；为首页提供数据。

**文件**

- `src/content.config.ts`（notes/pages schema）。
- 新增 `src/content/notes/`、`src/content/pages/now.md`。
- 新增 `src/lib/notes.ts`、`src/lib/now.ts`（或统一 `src/lib/content.ts`）。
- 新增 `src/pages/notes/index.astro`、`src/pages/notes/rss.xml.js`、`src/pages/now.astro`。
- 改 `scripts/subset-fonts.mjs`（扫描 notes/pages）。
- 更新 README/AGENTS（内容模型、发布方式）。

**任务**

1. Notes schema：`date`、可选 `time`、`draft`；无 title/description/tags；文件名 `YYYY-MM-DD-slug.md`；锚点 `n-YYYY-MM-DD`（同日加 slug）。
2. `/notes/`：月份分组、时间倒序、`:target` 红规线；不做 N°；空状态“还没有碎碎念”。
3. `/notes/rss.xml`：独立 feed；主 RSS 保持文章。
4. Pages schema：`title`、`description`、`updatedDate`、`draft`；`/now/` 渲染 `now.md`，显示“最后更新于”。
5. 字体子集扫描 `src/content/notes` 与 `src/content/pages` 的 frontmatter/标题/引用；否则 now/notes 的衬线会回退。
6. 内容不代写：提供模板/空状态；个人内容由用户填。

**验收**

- 锚点可跳、月份分组正确、notes RSS 可用；now 最后更新正确。
- dev 草稿可预览、build 不出现；字体子集包含 now/notes 标题用字。
- 390/320 无溢出；空状态不出现空框。
- 不造假个人内容；用户确认后再发布。

**风险**

- 同日多 note 的锚点冲突；用 slug 区分。
- `updatedDate` 时区（沿用 UTC getter）。
- 字体子集扫描 Markdown 的规则要与 posts 一致。
- now 没有内容时链接是否可达；先放“内容待补”并标 draft，或隐藏链接。

---

### P1c · `feat/home-frontispiece`

**目标**：首页卷首 + 开卷/页边 + 编号目录；依赖 P1b 数据。

**文件**

- `src/pages/index.astro`。
- 新增 `src/components/Frontispiece.astro`、`Opening.astro`、`MarginNotes.astro`、`Contents.astro`（或按需拆分）。
- `src/styles/global.css`（首页组件）。
- `src/lib/posts.ts`/`notes.ts` 补充首页查询。

**任务**

1. `frontispiece`：SVG 约 1.5KB；三格图例动态：文章数/最新、notes 数/最近、now 摘要（“本周”改“最近”）。
2. `frontmatter`：左最新文章（标题/摘要/日期/阅读/标签/阅读全文），右最新 3 条 notes + now 一行。
3. `contents`：全部文章编号 01…NN；日期/阅读时长；移动端单列。
4. 空状态：0 文章/0 notes/无 now 时隐藏对应块。
5. 首页宽壳 + 页脚/导航与 P1a 一致。

**验收**

- 动态数据正确，无硬编码 04/06/本周；空状态成立。
- 320/390/768/1024/1440；亮/暗；无 JS；无横向滚动。
- 首页仍是 h1 品牌；文章标题从 h2 开始，层级正确。
- 对比设计稿 `d1-home-*`；差异需记录。

**风险**

- 首页依赖 notes/now 内容；没有内容时视觉会空，需空状态。
- 320 首屏信息密度；页边 notes 的顺序；figcaption/标签换行。
- 首页计数与 RSS/归档计数必须同源。

---

### P1d · `feat/article-redesign`

**目标**：文章页新结构：文章头/规格、内联 TOC、H2 编号、代码标题栏、图注、相关文章；保留 KaTeX/Shiki/滚动。

**文件**

- `src/pages/posts/[...slug].astro`。
- 新增 `src/components/ArticleHead.astro`、`SpecList.astro`、`TOC.astro`、`RelatedPosts.astro`。
- 新增构建期 rehype 插件（如 `src/lib/rehype-section-numbers.mjs`）或在 `astro.config.mjs` 内实现。
- `src/lib/posts.ts`（字数、相关文章）；`src/const.ts`（印记中文标签）。
- `src/styles/global.css`（文章组件）。

**任务**

1. 文章头两栏：42rem + 12rem；规格表：归档年月、阅读时长+字数、分类、印记；60rem 以下折叠；40rem 以下只留归档/印记。
2. 内联 TOC：`render()` 的 headings，过滤 h2/h3，≥3 条；编号与 H2 一致；移动端单栏。
3. H2 编号：rehype 插件注入 `span.h2-no`（aria-hidden），只处理文章正文顶层 h2；H3 红色破折号用 CSS。
4. 代码块：构建期包 `.listing`（标题栏 + 内层 `.scroll-x`），保留 Shiki token/双主题/焦点/aria；标题栏 `Listing NN · 语言`；文件名暂不做。
5. 图注：支持手写 `<figure>`；样式化 figcaption；不自动把 img 变 figure。
6. 公式：保留 KaTeX `htmlAndMathml` 与 `.scroll-x`；公式编号不强制；如做，必须验证长公式/移动端。
7. 表格：保留 `.scroll-x`；不自动加 caption。
8. 文章末：本文完 + 标签 + 相关文章（共享标签前 2-3）+ 上下篇。
9. 打印：隐藏 TOC/相关/上下篇/页边规格；代码/表格/图避免跨页断裂。

**验收**

- 用 `math-xor` 验证公式、代码、表格、TOC 锚点；用一篇代码较多的文章验证 listing。
- 320/390/768/1024/1440；亮/暗；无 JS；打印；无横向页面滚动。
- H2 编号与 TOC 数量一致；长公式在容器内滚动；Shiki 双主题正常。
- 文章页 JS 仍为 0（本阶段不做复制按钮）。
- 设计稿的页边规格/间距/字体与实现对照；差异记录。

**风险**

- rehype 插件顺序与 KaTeX/scroll 包装冲突；需在 `astro.config.mjs` 中确定顺序。
- 代码块 `.listing` 与现有 `.scroll-x` 的嵌套；焦点目标/aria 不能丢。
- 公式编号可能破坏布局；默认不做。
- 相关文章在 4 篇阶段可能为空；无匹配隐藏。
- 页边规格的“印记”标签需要新增映射，不能改 Seal 映射。

---

### P1e · `feat/seo-a11y-print`

**目标**：结构化数据、OG 补全、打印/减少动效/可访问性、文档与视觉 QA。

**文件**

- `src/layouts/Base.astro`、`src/pages/posts/[...slug].astro`（JSON-LD/OG）。
- `src/styles/global.css`（print/reduced-motion/a11y）。
- `README.md`、`AGENTS.md`、`TROUBLESHOOTING.md`。
- 可选 `scripts/check-dist.mjs` 增加 JSON-LD/OG 检查。

**任务**

1. `BlogPosting` + `BreadcrumbList` JSON-LD；OG `og:image:width/height`、`og:locale`、article 时间/标签；安全转义。
2. sitemap 过滤 404；notes RSS 链接；canonical/404 noindex 回归。
3. 打印规则：隐藏 TOC/相关/上下篇/页边规格/主题开关；代码/表格/图不跨页。
4. `prefers-reduced-motion` 全局；焦点/键盘/对比度抽查；装饰 SVG/编号 aria-hidden。
5. 字体子集/构建预算/真机走查；文档同步。
6. 视觉 QA：对照 `screens/d1-*`，记录允许差异。

**验收**

- JSON-LD 可解析；OG 完整；sitemap 不含 404。
- 键盘全流程；焦点可见；打印 PDF 可读；减少动效生效。
- 320/390 真机（iPhone/Android）通过；无横向滚动。
- 预算：CSS ≤18KB gzip、JS ≤3KB、字体 ≤1.5MB、dist ≤2.6MB。
- 文档无失真；用户确认。

**风险**

- JSON-LD 转义（`</script>`）；内容可信但仍要转义。
- 打印页边规格可能占宽；默认隐藏。
- 真机字体/滚动差异；以真机为准。

## 3. 每个 PR 的通用验收

### 命令

```bash
npm run check
npm run verify
```

`verify` 必须用生产子路径构建；CI 同款。P0 已实现，P1 仍按此命令验收。

### 视口/状态

- 320 / 375 / 390 / 768 / 1024 / 1440。
- 亮色 / 暗色 / 无 JS + 系统暗色。
- 打印/存 PDF。
- iPhone Safari + Android Chrome（用户真机）。
- 键盘全流程；至少一次读屏抽查。

### 内容

- 现有 4 篇文章不改（除非用户明确要求）。
- notes/now 个人内容由用户提供；不代写、不编造。
- 系列不建；搜索/评论/统计/友链/Newsletter 不做。

### 交付物

- PR 正文：摘要、变更明细、测试命令与结果、截图/视口、未覆盖风险、回滚方式。
- 行为变更同步 AGENTS/README/TROUBLESHOOTING。

## 4. 依赖图

```
P0 ──> P1a ──> P1b ──> P1c
 │       │
 └───────┴──> P1d ──> P1e
```

- P1a 与 P1b 可并行，但都改 `global.css`/Base 时要协调；建议 P1a 先合并。
- P1d 可在 P0 + P1a 后与 P1b/P1c 并行；最终视觉 QA 在 P1e。
- 不要同时开两个改 `global.css` 的 PR，避免冲突。

## 5. 完成定义（DoD）

- 所有新路由在 `/xin-s-blog/` 下可访问；无死链；无草稿泄漏。
- 设计契约的视觉/数据/空状态/响应式/暗色/打印/可访问性验收通过。
- `verify` 绿；预算内；文章页 JS 0（本阶段）。
- 真实内容验证：至少一篇含公式/代码/表格的文章、notes 锚点、now 页。
- 用户本地试用确认；PR 合并；文档同步。
- 未覆盖风险在 PR/交付说明中明确列出。

## 6. 本阶段不做

- 系列页、搜索、评论、统计、友链、Newsletter、点赞、Webmention。
- 逐篇 OG 图、旧链接重定向、字体死重清理、Lighthouse CI/外链巡检。
- 自动图注/公式全自动编号、代码文件名解析（除非实现证明低风险）。
- 任何第三方运行时脚本。

## 7. 当前状态

- 设计契约：已批准（`design-contract.md`）。
- P0：已验收（`p0/review.md`）；数据层、草稿预览、verify/check-dist 均已落地。
- P1a：实现与本地验证完成（`p1a/review.md`）；tokens/shell/页头页脚/导航/归档/标签/关于/404 已落地，F1/F2 已修；待用户本地试用确认后 push/开 PR。
- 下一步：P1b notes/now；P1c 首页；P1d 文章页。P1b 与 P1c/P1d 均会改 `global.css`/`Base` 时，按 `p1a/review.md` 的宽度分期与文档约定协调，不要同时开两个改 `global.css` 的 PR。

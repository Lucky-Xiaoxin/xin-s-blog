# AGENTS.md

This file provides guidance to the AI agent when working with code in this repository.

Astro 7 静态博客，部署为 GitHub Pages **项目站**（子路径 `/xin-s-blog/`）。维护者是大二学生，单人使用，全程中文交流（文档、注释、commit message 均中文）。

## 交付双轨（用户明确要求，不可混用）

- **写/改文章**（`src/content/posts/`）：直推 main 即可。但**文章是用户的内容，未经同意不要代写代改**；发现语法错只报告，让他自己修（学习导向）。
- **框架改动**（其余一切）：`git switch -c xxx` 分支 → 本地 `npm run verify`（check + 生产子路径 build + 产物检查）与 `npm run audit` → 交用户本地试用 → 用户确认 → push → 用 GitHub MCP 建 PR（正文含摘要/明细/测试计划）→ 合并 → `git pull` 同步 main。

Commit 前缀风格：`ci: / fix: / style: / docs: / content:` + 中文描述。

## 非显而易见的约定

- `pubTime`（`'HH:MM'`）是**刻意纯显示字段**，不参与日期运算——排序用 pubDate(+pubTime 作 tiebreaker)、RSS 只认 pubDate。不要"顺手"把它并进 pubDate，会重新引入时区坑。
- 站内链接必须走 `src/const.ts` 的 `u()`/`resolveHref()` 补子路径前缀；文章正文资源用相对路径（`/` 开头构建不补前缀，线上必 404）。
- `SITE_URL`/`BASE_PATH` 由 `.github/workflows/deploy.yml` 构建期注入，`astro.config.mjs` 的默认值**只影响本地**——改域名/改路径要改 deploy.yml。**不要在 shell 里设 `BASE_URL` 环境变量**：Astro 会把它当站点 base，`u()` 与 404 判定一起坏掉（门禁会同时报「404 缺 noindex」和「RSS 缺已发布文章链接」）；子路径只认 `BASE_PATH`，本地脚本要指预览地址就换变量名（如 `PREVIEW_URL`）。
- 构建时出现 `Duplicate id "xxx"` 警告多半是**假警报**：其他文件 YAML 错误中断同步所致，先修真正的 `bad indentation`，它会自己消失（详见 TROUBLESHOOTING.md）。
- KaTeX 配了 `throwOnError: false`：坏公式页面标红但不挡发布，这是有意的。**必须保留 `output: 'htmlAndMathml'`**——改回 `html` 会把 `.katex-html` 标成 `aria-hidden` 且不产出 MathML，读屏读不到任何公式。根 `katex` 固定 0.18.9，`package.json` 的 `overrides` 把 `rehype-katex`/`micromark-extension-math` 的嵌套版本统一到同一版；`npm ls katex` 只能有一个版本。**不要跑 `npm audit fix --force`**（它会把 `rehype-katex` 降到 1.2.0）。
- Astro 7 默认 Markdown 处理器是 Sätteri；本站依赖 remark/rehype 插件链，`astro.config.mjs` 必须显式使用 `@astrojs/markdown-remark` 的 `unified({ remarkPlugins, rehypePlugins })`（`markdown.processor`）。不要移回已废弃的 `markdown.remarkPlugins`/`markdown.rehypePlugins`；内容 schema 的 `z` 从 `astro/zod` 导入，不要从 `astro:content` 导入。
- 技术内容（代码块/独立公式/表格）由 `astro.config.mjs` 的 `rehypeScrollable` 在构建期包一层 `.scroll-x`；CSS 只对 `.prose > .scroll-x` 生效。它给宽内容两侧 `--bleed` 的突破和可聚焦横向滚动容器；不要删掉 wrapper 或把 `.prose pre`/`.katex-display` 的 overflow 改回去。
- 首页品牌在 `size='full'` 时是 `h1`，内页是 `a`（每页只留一个 h1）；短页页脚贴底依赖 `body` 的 flex column + `main { flex:1 }`。改页头/页脚骨架时保留这两点。
- 明暗主题**两个入口**（改配色前先读这条）：`Base.astro` 的 `<head>` 内联脚本负责首屏防闪色（别挪位置、别改成打包脚本），并且**永远显式写 `data-theme='light'` 或 `'dark'`**——属性一缺失就等于"没有 JS"，会被兜底入口接管，用户选的亮色会被系统暗色翻盘。`global.css` 里深色声明有两份，必须逐字一致：入口① `:root[data-theme='dark']`（脚本/手动），入口② `@media (prefers-color-scheme: dark)` 下的 `:root:not([data-theme='light'])`（JS 被禁用时跟随系统）。入口②还各自拷贝了深色态的依赖规则（开关 4 条 + Shiki 覆写），**改这些原规则时必须同步改入口②那份**；`@media print` 的选择器要带上 `:root:not([data-theme='light'])` 形式，否则特异性压不过入口②、无 JS+系统暗色时会打出墨底。Shiki 双主题：亮色色值内联、暗色色值与两侧字体风格走 `--shiki-dark`/`--shiki-light-*` 变量（global.css 的 `.astro-code span` 必须消费 light 侧字体变量，删掉它就丢代码粗体/斜体）；改代码高亮配色要同改 `astro.config.mjs` 的 `themes`。
- 中文字体是构建期子集：`scripts/subset-fonts.mjs`（predev/prebuild 自动跑）扫描 src 下 .astro/.ts/.js 全文 + `src/content/{posts,notes,pages}` 里 md 的 frontmatter/标题行/引用行，裁出思源宋体子集写进 `src/assets/fonts/`（已 gitignore）。正文刻意不收（走系统无衬线）；新增「非 h1~h3/brand/摘要/引用」的衬线用例时，必须让它的文案落进上述扫描来源，否则那个字会静默回退系统宋体。
- 所有文章读取都走 `src/lib/posts.ts`：列表/RSS 用 `getPublishedPosts()`、标签聚合用 `getAllTags()`、归档用 `getArchiveGroups()`、标签详情用 `getPostsByTag()`。页面里不要再复制 `getCollection` 过滤/排序；归档年月只用 helper 里的 UTC getter；标签索引的“最近一篇”只取 `getAllTags().latest`。文章/笔记等内容页的 `getStaticPaths` 只能用 `getPostsForStaticPaths()`（dev 含草稿、build 排除）；**标签详情是例外**：只用 `getPublishedPosts()`，只生成有已发布文章的标签（build 无空标签页；dev 下草稿新增的标签不建页）。文章页按 slug 查找与上下篇必须传 `includeDrafts: import.meta.env.DEV`，否则 dev 草稿页 `post` 为 undefined。草稿预览只在 dev，build 不生成；不要为了预览把 `draft` 改成 false 再改回来。
- 宽度分三档，**token 是内容列宽，不是盒宽**：`.shell` 用 `max-width: calc(内容宽 + 2 * --gutter)`。**页头/页脚固定 `wide`（2026-10-30 前端评审 F2），只有 `main` 按页面分档**：P1a 只有归档/标签/关于/404 用 `width='mid'`；**P1c 已把首页切到 `wide`（卷首/开卷/页边/目录）**；**文章页自 P1d 起也是 `wide`**（正文列仍锁 42rem，两栏文章头与竖排书脊占右页边，60rem 以下页边折到文章头之后）。不要把 `--measure` 当成 `max-width` 的盒宽（那会把 42rem 内容压回旧的 30rem）。**P1a 把 measure 页从旧 30rem 修正到 42rem 已获用户选择 A；后续不要回滚这个语义，除非重新改契约。** `html` 的 `scrollbar-gutter: stable` 不能删：它抵消短页无滚动条的 15px 差，保证品牌左边缘跨页一致。
- 导航固定 4 项：目录 / 归档 / 标签 / 关于（`NAV` 顺序即渲染顺序）；`/notes/`、`/now/` **不进主导航**，P1b 起只从页脚与关于页进入（页脚链接见下面的 `PAGE_LINKS`）。`PageHead` 只用于归档/标签/关于/标签详情；每页只能有一个 h1（首页品牌是 h1，内页品牌是 a）。归档列表的 h4 单独走衬线，不要把 h4 并进全局 h1~h3 规则（文章正文 h4 保持现状）。
- 碎碎念/现在的数据层分别收口到 `src/lib/notes.ts`、`src/lib/now.ts`：过滤、排序、分组、锚点、校验只在 helper 里，页面/RSS 不要直接 `getCollection('notes')`。notes 文件名必须是 `YYYY-MM-DD-slug.md`（小写/数字/连字符），`_` 前缀是模板、永远不渲染；`date` 必须与文件名日期一致、正文不能为空（错误会让构建失败）。锚点唯一来源是 `noteAnchor()`＝`n-<文件名>`，只由文件名决定。
- 碎碎念 feed 的 item `link` **必须给绝对 URL**（`new URL(u('/notes/') + '#' + anchor, context.site).href`）：`@astrojs/rss` 会给相对链接补尾斜杠，把 `#n-xxx` 变成 `#n-xxx/`，锚点在页面上并不存在（`check-dist` 会 FAIL）。
- 页脚入口分两组：`PAGE_LINKS`（碎碎念/现在，站内页）与 `SOCIALS`（联系方式），Base 里拼成 `[...PAGE_LINKS, ...SOCIALS]`；**不要把站内页塞进 SOCIALS**，否则 about 的「联系我」会多出站内链接。
- 首页是卷首页：`src/pages/index.astro` 只负责组装 `Frontispiece`/`Opening`/`MarginNotes`/`Contents` 四个组件，计数与日期一律来自 `getPublishedPosts()`/`getPublishedNotes()`/`getRecentNotes(3)`/`getNow()`，**禁止硬编码 04/06**；页边摘要统一用 `src/lib/notes.ts` 的 `noteExcerpt()`，不要在页面里另写一套 Markdown 剥离规则。首页 h1 是品牌，开卷/页边/目录用 h2，目录里的文章标题用 h3（每页只留一个 h1）。**首页目录每条 = 01 + 下方 48px Seal（2026-10-30 用户确认恢复；40rem 以下 32px），不要按 P1c 旧“无徽章”记录再次删除。**空状态组合（0 文章 / 0 碎碎念 / 无 now）必须隐藏对应块，不留空框、不显示假计数；旧首页件 `Hero.astro`/`PostList.astro` 与 `.hero*`/`.index*` 已在 P1c 删除，不要恢复。
- `check-dist` 的锚点只认属性名严格等于 `id` 的值（`data-id` 不算）；canonical 对每个目录式页面做**精确比对**（404 除外）。新增路由若缺 canonical、指错页面或缺尾斜杠都会 FAIL；`tsconfig.json` 排除 `docs/`（设计工具脚本不参与 `astro check`）。
- 新增路由/资源必须过 `npm run verify`（check + 生产子路径 build + `check:dist`）：站内链接一律用 `u()`/`resolveHref()`，HTML 里的根绝对 `href`/`src` 会被 check-dist 拦下；字体放 `src/assets/fonts/`（构建生成），内容图放 `src/content/posts/` 内并用相对路径。体积预算见 README，超限先定位、不要直接抬上限。
- 预览分两种：`npm run preview` 对应普通 `npm run build`（`base=/`）；`npm run preview:prod` 对应 `npm run verify` 的生产子路径产物。`npm run check:dist` 默认也按 `base=/` 检查，生产子路径请走 verify 或显式传 `BASE_PATH`。
- 文章印记是确定性映射：`const.ts` 的 `sealHash` + `SEAL_CORES`——名单按几何相容性筛选（红点/内芯必须完整落在外框内，triangle/rhombus/hexagon 各有剔除项，semicircle 的 tri/axis 红点由 `Seal.astro` 的 `FRAME_DOTS` 按框覆写）；重排名单、改哈希或换 `TAG_SHAPE` 都会换掉既有文章的印记（有意为之才能动）；新增内芯必须先过一遍框内几何验证再加。
- deploy job 有 `if: github.ref == 'refs/heads/main'` 守卫、`pages: write` 只给 deploy job——不要"简化"回顶层权限。
- README 与 TROUBLESHOOTING.md 是维护者的主要参照，**行为变更后必须同步更新**（历史审计曾发现多处文档失真；改完核对每条可验证断言）。

## 文档体系与卫生规范（2026-10-23）

### 单一事实源

| 文档 | 只放什么 | 不要放什么 |
| --- | --- | --- |
| `README.md` | 用户操作：安装、命令、日常流程、体积预算、已知边界 | agent 内部约定、阶段计划全文 |
| `AGENTS.md` | agent 约束、不可破坏的约定、文档规范 | 重复命令表/体积数字/文章教程 |
| `TROUBLESHOOTING.md` | 真实遇到的报错 → 人话 → 修法 | 未验证的猜测 |
| `docs/README.md` | docs 目录索引（写文章 / 改框架两条入口） | 单篇长文 |
| `docs/writing-style.md` | 文章写法规范：frontmatter、骨架、标题层级、元素用法、语气 | 阶段计划、命令表 |
| `docs/example.md` | 可照抄的示例文章（规范的实例化） | 事实快照、清单副本 |
| `docs/next-phase/README.md` | 阶段索引、决策日志、状态 | 单阶段长契约 |
| `docs/next-phase/pX/README.md` | 阶段目标、范围、依赖、验收、风险 | 大段重复 token/命令/预算 |
| `docs/next-phase/pX/*.md` | 详细契约、测试计划、复核 | 长期维护的“当前值”副本 |
| `docs/next-phase/design/` | 设计原型、截图、自检 | 生产 CSS/字体/图片 |
| `docs/next-phase/_template.md` | 新文档模板 | — |

**当前命令/体积/运行基线的权威来源**：根 README + `scripts/check-dist.mjs` + `npm run verify` 实际输出。阶段文档若引用快照，必须写“快照 YYYY-MM-DD，以 verify 输出为准”，不要写“当前值”然后长期不更新。

### 状态头（新阶段/契约文档必须）

新文档先复制 `_template.md`；已有文档至少保持状态行最新，不强制回填全部元数据。

```md
> 状态：规划中 · YYYY-MM-DD
> 上游：<需求/设计/上一阶段>
> 下游：<会被谁消费>
> Owner：<角色/人>
> 复核/证据：<PR/review.md/测试输出；没有写“未开始”>
```

状态词只用：**规划中 / 已批准 / 实施中 / 已验收 / 暂缓 / 已废弃**。

- 规划中：不可当作实现指令。
- 已批准：契约生效，实现按它做。
- 实施中：代码在改，契约仍是基准。
- 已验收：有 `review.md` 证据；后续改动先改契约。
- 暂缓/已废弃：写原因 + 替代链接。

### 索引与生命周期

- 每个 docs 文档必须从父级 README 链接；**无孤儿文档**。
- 每个阶段一个文件夹（`p0/`、`p1a/`…）；阶段完成时更新阶段 README 状态、写 `review.md`（命令输出、失败注入、未覆盖项、结论）。
- 新阶段先出文档再实现；文档状态为“规划中”时不要写代码。
- 阶段收尾必须同步：docs 索引 + 根 README（命令/预算若变）+ TROUBLESHOOTING（新错误）+ 相关 AGENTS 约束。
- 不新建“一次性”文档；能放进现有阶段文档就放。不删除历史；废弃用状态 + 链接，不靠“记得”。

### 写法

- 中文 prose；代码标识符/命令保持英文；不要营销话术。
- 每个断言可验证：命令、日期、数值、文件路径；不要写“应该可以”。
- 明确区分：**已实现 / 已验证 / 未验证 / 不做**。
- “待确认”必须带 Owner + 日期/截止；没有就写“无”，不要留空表。
- 设计稿/原型只作参考；不要 import 其 CSS/字体/图片，生产仍用 `src/styles/global.css` 与构建期字体子集。
- 用户不读 README：操作提示写进脚本/模板/生成文件注释；文档是给 agent 和维护者查的。

### 变更流程

- 代码/行为变更：**同一 PR** 更新 README/AGENTS/TROUBLESHOOTING + 对应阶段文档；不能代码合了文档滞后。
- 纯文档 typo/死链修正：可直推 main；涉及约束/行为说明的文档改走 PR。
- `review.md` 必须含“跑了什么、结果、失败注入、未覆盖、结论”；不能只写“看起来没问题”。
- 新增阶段文档先复制 `docs/next-phase/_template.md`，不要自创结构。

## 工作流杂项

- 建稿用 `npm run new -- <文件名>` 或双击根目录「新建文章.bat」，不要手抄 frontmatter。
- 文章写法有统一规范：`docs/writing-style.md`（结构/标题层级/元素用法/语气）+ `docs/example.md`（可照抄的示例）。改文章或新建稿按它来。三条最容易踩的：**正文里不要留建稿提示注释**（`<!-- xxx：正文从这里开始…… -->` 会随 HTML 发布并计入阅读时长）；**frontmatter 不要复制标签清单快照**（清单唯一来源是 `src/const.ts` 的 `TAG_SHAPE`，复制的那份必然过期）；**正文只用 h2/h3**（`.prose` 只给 h2/h3 上样式，h4 及以下掉回浏览器默认字号）。
- 新标签必须登记进 `src/const.ts` 的 `TAG_SHAPE`，否则构建告警。
- P1d 已按 2026-10-30 规模收敛为精简版：只做文章头/规格表/印记标签/本文完/打印隐藏；TOC、H2 编号、代码标题栏、图注、相关阅读延后，触发条件见 `docs/next-phase/implementation-plan.md` P1d。44px 热区覆盖标签/按钮/主导航/页边链接/页脚（P1e F6），正文内联链接维持 WCAG 2.5.8 的 24px；F4/F7/F9/F10/F11/F14 暂缓。
- P1e（2026-11-01）新增的硬约定：**SEO**——文章页 JSON-LD（BlogPosting/BreadcrumbList）与 article meta 经 `Base.astro` 的 `head` 插槽注入，`check-dist` 校验存在性与可解析性，别删；`og:image` 尺寸锁 1200×630（实测 `public/og.png`），换图必须同步 `Base.astro` 的两个 meta；面包屑取文章首个标签（与印记外框同源）。**字号**——中文 utility 文本 ≥12px，`0.2em` 大字距只给拉丁大写，等宽日期/计数 11–12px 可保留（F5）。**首页文案**——头部只显示 `SITE.tagline` 单行，`SITE.description` 只进 meta；卷首图例「现在」格单行 ellipsis、完整文案在 `/now/`（这是对 p1c「图例不截断」的显式推翻，N3）；热区伪元素扩边量与列表 `gap` 互为 mirror，相邻热区不得重叠（F6）。
- Node 需 22.23.4+（Astro 7 的硬性要求）。**CI 的 `node-version` 必须钉具体小版本**（现在是 `22.23.4`）：写 `22` 时 runner 按自己的 tool-cache 索引解析、实测取到 22.23.3，差一个补丁版本 `astro check` 直接拒跑——**本地过了不代表 CI 过**。「Astro 7 要求 22.23.4 而 CI 报 Node not supported」先查 deploy.yml 的 node-version。`@astrojs/check` 的 peer TypeScript 仍只到 `^6`，不要升 TypeScript 7。
- agent shell 里 `git push` 凭据通常已缓存；若报 `/dev/tty` 错误，让用户在输入框用 `! git push` 代跑一次。
- GitHub Pages HTML 有约 10 分钟浏览器缓存：用户说"推上去没变"先让他 Ctrl+F5 再排查。
- 不要提议添加 LICENSE（用户已明确拒绝）。
- CI 门禁 = `npm run audit`（high/critical）+ `astro check` + `astro build` + `npm run check:dist`，任一失败不发布、线上保持旧版——不存在"推坏线上"，但也不要跳过 check/verify 直推框架改动。

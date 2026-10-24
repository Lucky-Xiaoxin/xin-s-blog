# P1c 复核记录：首页卷首

> 状态：已验收 · 2026-10-24（实现与本地验证完成；图例与图案可点击补丁已验；用户本地验收通过）
> 上游：`p1c/README.md`、`home-spec.md`、`test-plan.md`、`p1b/review.md`
> 证据：本文件 + `screens/`（生产子路径 `preview:prod` 截图与矩阵 JSON）
> Owner：实现规划师

## 1. 完成范围

- **首页重写**：`src/pages/index.astro` 改为 `Base size="full" width="wide"`，只负责组装四个组件与取数，不再写结构。
- **新组件**：`Frontispiece.astro`（卷首 SVG + 三格图例）、`Opening.astro`（开卷：最新文章）、`MarginNotes.astro`（页边：最近 3 条碎碎念 + 现在一行）、`Contents.astro`（编号目录）。
- **数据层**：`src/lib/notes.ts` 增加 `noteExcerpt(note, limit = 60)`（取正文首个非空行 → 剥图片/链接/强调标记 → 压缩空白 → 超长截断加 `……`）；`src/const.ts` 增加 `formatMonthDay()`（`MM.DD`，UTC getter）。计数与日期全部来自 `getPublishedPosts()` / `getPublishedNotes()` / `getRecentNotes(3)` / `getNow()`，页面里没有硬编码数字。
- **样式**：`global.css` 新增 `.frontispiece*` / `.frontmatter` / `.opening*` / `.margin-notes*` / `.note-mini` / `.now-line*`；断点 52rem（开卷/页边上下排、页边改上边框、note-mini 三列）、40rem（note-mini 单列、图例小字换行）、24rem（图例单列）。
- **删除旧件**：`src/components/Hero.astro`、`src/components/PostList.astro` 与 `.hero` / `.hero svg` / `.hero__caption` / `.index` / `.index__*` CSS、首页的「没啦~」`section-note`（grep 确认只有首页引用；`.section-note` 本身仍被 404/标签/归档使用，保留）。
- **文档**：README（首页结构/宽度）、AGENTS（首页不变量 + `BASE_URL` 陷阱）、TROUBLESHOOTING（新增两条报错）同步；`p1c/*` 状态推进到「实施中」。

## 2. 命令与结果

```text
npm run check
Result (31 files): - 0 errors - 0 warnings - 0 hints

npm run verify
[verify] BASE_PATH=/xin-s-blog SITE_URL=https://lucky-xiaoxin.github.io TZ=Etc/UTC
[check-dist] base=/xin-s-blog files=103
  artifacts  OK (8/8)
  links      OK (internal=310, anchors=17)
  drafts     OK (published=4, notes=0)
  seo        OK (posts=4)
  rss/sitemap OK
  dom        OK (notes)
  size       CSS 14.6/18.0 KB · JS 0.0/3.0 KB · fonts 1.40/1.50 MB · max HTML 20.3/30.0 KB · dist 1.6/2.6 MB
  inline JS  1.5 KB (theme script, not budgeted)
  result     PASS
[verify] PASS
```

- 装 3 条夹具碎碎念时：`links OK (internal=316, anchors=23)`、`drafts OK (published=4, notes=3)`，其余不变。
- **CSS 14.3 → 14.6 KB**：删掉 `.hero*`/`.index*`（约 1.1 KB）后新增首页组件样式（约 1.4 KB），净增 0.3 KB，仍在 18 KB 预算内。
- **字体 1.39 → 1.40 MB**：首页新增的中文（「开卷」「页边」「目录」「全部碎碎念」「看看」等）进了构建期子集。
- 站内 JS 仍是 0 KB（只有内联主题脚本），符合「首页零 JS」约束。

## 3. 功能矩阵（test-plan H1–H13）

| 编号 | 检查 | 结果 |
| --- | --- | --- |
| H1 | 图例动态 | `文章 04 · 最新 10.19` / `碎碎念 03 · 最近 10.22` / `现在 emo中……`；无硬编码 |
| H2 | 图例 0 碎碎念 | 碎碎念格 `00 · 暂无`；无 note-mini；now 行仍在 |
| H3 | 图例无 now | 只剩两格（`--2`，实测 `grid-template-columns` 两列）；无 now-line |
| H4 | opening | 标题/摘要/日期 2026.10.19 17:22/1 分钟读完/标签/阅读全文齐全，链接到文章页 |
| H5 | 页边 3 条 | 顺序与 `/notes/` 一致（10.22 / 10.21 / 09.30）；锚点链接可跳；草稿不出现 |
| H6 | noteExcerpt | 首行含 `**粗体**`、`[链接](url)`、`![图](url)` → 摘要为纯文本「这是测试条目 A，首行里有 一个链接 和 ，用来验证摘要剥离。」，无 `**`/`![`/`[](`；超 60 字截断加 `……` |
| H7 | now 行 | `emo中……` + `看看 →`；链接 `/now/`；`aria-label="查看「现在」页"` 在 |
| H8 | 目录 | 编号 `01`–`04`；日期/分钟/标签正确；整行可点、标签独立可点；无 Seal 徽章 |
| H9 | 0 文章 | 隐藏 opening/contents；图例文章格 `00 · 暂无`；页边有内容 → frontmatter 单列（实测一列 928px），无页边 → 显示 `.empty-state`「还没写文章。」 |
| H10 | 链接门禁 | `verify` PASS：首页 3 条碎碎念锚点在 `/notes/` 都能找到 id |
| H11 | 删除回归 | grep 无 `Hero` / `PostList` / `.index` / `.hero` 残留；全站 8 个页面重跑 verify 通过 |
| H12 | h1/层级 | 首页 1 个 h1（品牌）；开卷/页边/目录为 h2；目录里文章标题为 h3 |
| H13 | 体积 | CSS 14.6/18 KB、JS 0、max HTML 20.3/30 KB、dist 1.6/2.6 MB；删旧 CSS 后未增长 |

## 4. 空状态组合（契约 home-spec §4 全表）

构建前会临时移走内容并清掉 Astro 内容缓存，测完原样还原。

| 文章 | 碎碎念 | now | 实测渲染 |
| --- | --- | --- | --- |
| >0 | >0 | 有 | 完整三块；图例 3 格（1440 实测三列 298px） |
| >0 | 0 | 有 | 无 note-mini；页边只剩 now-line；图例碎碎念格 `00 · 暂无`，仍 3 格 |
| >0 | >0 | 无 | 无 now-line；图例 2 格（`--2` 实测两列 456px） |
| >0 | 0 | 无 | 隐藏页边；frontmatter 单列（928px）；图例 2 格 |
| 0 | >0 | 有 | 隐藏 opening/contents；图例文章格 `00 · 暂无`；页边单列显示页边；max HTML 降到 7.2 KB |
| 0 | 0 | 无 | 隐藏 opening/contents/页边；图例 `00 · 暂无` + `00 · 暂无` 两格；frontmatter 只剩 `.empty-state`「还没写文章。」；max HTML 6.2 KB |

- 四种组合各跑一次 `npm run verify`：全部 PASS（0 文章那次 `seo OK (posts=0)`、`drafts OK (published=0)`）。
- 任何组合都没有空框、虚线占位或「0 条」假 meta。

## 5. 浏览器矩阵（生产子路径 `preview:prod`，headless Chrome + CDP）

每次检查：`scrollWidth <= innerWidth`、无元素越界、每页恰好 1 个 h1、无重复 id、页内锚点都能落到 id、导航 4 项且同一行、页脚顺序 碎碎念/现在/GitHub/Email/RSS、明暗 token 正确；首页另查图例格数与文案、note-mini 条数与链接、now 行、目录编号、frontmatter/图例/note-mini 的栅格列数、打印时卷首 SVG 与红点是否隐藏。

| 变体 | 用例 | 结果 |
| --- | --- | --- |
| content（3 条夹具 notes + now 单行） | 首页 1440/1024/768/390/320、暗色 1440/390、无 JS + 系统暗色 390、打印 390；notes/now/archive/tags/about/文章页 390、文章页 1440、404 390 = **17** | 17/17 通过 |
| no-notes（0 条已发布） | 首页 1440/390 = **2** | 2/2 通过 |
| no-now（now 草稿） | 首页 1440/390 = **2** | 2/2 通过 |
| empty（0 条 notes + 无 now） | 首页 1440/390 = **2** | 2/2 通过 |
| no-posts（0 篇文章） | 首页 390 = **1** | 1/1 通过 |

合计 **24 次，0 失败**。截图与矩阵 JSON 在 `screens/`（`matrix-content.json` / `matrix-no-notes.json` / `matrix-no-now.json` / `matrix-empty.json` / `matrix-no-posts.json`）。

- 无 JS + 系统暗色：`data-theme` 属性缺失时 `--paper` 落到 `#111214`，深色入口②接管。
- 打印：`--paper` 强制 `#ffffff`，卷首 SVG 与 now 红点隐藏，页边单列，文字保留。

## 6. 实施中发现并修掉的三个真问题

1. **打印规则被后面的主页样式反压**：`@media print` 块在文件靠前位置，而 `.frontispiece__drawing { display: block }` 定义在后面——同特异性下后者赢，打印时卷首插图和红点照样出现。修法：把首页的打印覆盖规则挪到首页样式**之后**单独成块。浏览器矩阵抓到了这个（第一轮 `drawing visible=True`）。
2. **环境变量 `BASE_URL` 会改掉站点 base**：本地脚本里用 `BASE_URL` 指预览地址，构建时 Astro 把它当 base，站内链接前缀与 404 判定一起坏掉，门禁报「404 缺 noindex」+「RSS 缺已发布文章链接」4 条。修法：脚本改用 `PREVIEW_URL`；已写进 AGENTS.md 与 TROUBLESHOOTING.md。
3. **Astro 内容缓存会让「0 文章」分支形同虚设**：把文章文件移走后 `data-store.json` 仍带着旧条目，构建照样产出 4 篇文章（门禁 `published=0` 与页面渲染自相矛盾）。修法：验证「0 文章」时先清 `node_modules/.astro/data-store.json`、`.astro/data-store.json` 与 `.astro/collections`，再构建；测完还原并重建。

## 7. 允许的差异 / 与设计稿的偏差

1. **图例文案**：设计稿写「碎碎念 06 · 本周 02」，按设计契约 C3 改成「碎碎念 NN · 最近 MM.DD」（首页不出现「本周」这种相对时间）。
2. **目录无 Seal 徽章**：设计稿首页目录没有印记徽章，按契约不渲染。
3. **现在一行用 description**：首版就是 `emo中……`，不从正文截断。
4. **页边摘要**：按 `noteExcerpt()` 规则剥掉 Markdown 标记，剥离后可能留下「和 ，」这种悬空连接词（图片被整段删除的副作用）；契约规则如此，记录为允许差异。
5. **masthead 导语**：站点把 `tagline` 与 `description` 拼在一行，1440 下仍折成两行；设计稿只有一行 tagline。这是 P1a 之前的既有行为，不在 P1c 范围内。
6. **导航当前项标记**：站点用「实心红方块」表示当前页，设计稿用空心小方框；沿用站点既有约定。

## 8. 未覆盖 / 风险

- 真机 iOS Safari / Android Chrome、读屏（NVDA/VoiceOver）未实测（P1e 计划覆盖）。
- 实体打印 / PDF 阅读器逐页排版未验证，只验证了 print 媒体下的计算样式与截图。
- 首页在 100+ 文章下的目录长度与构建时间未压测（首版 4 篇验证）。
- 首页在 100+ 条碎碎念下的页边体积未压测（页边固定只取 3 条，增量有限）。
- 摘要截断的 60 字阈值是拍的经验值，没有做过可读性 A/B。

## 9. 结论

契约范围内的首页卷首、开卷/页边、编号目录、动态图例、空状态组合、旧件清理与文档同步均已按 `home-spec.md` 实现：`npm run check` 0/0，`npm run verify` PASS（体积在 P0 预算内），功能矩阵 H1–H13 全部符合，空状态 6 种组合全部成立，浏览器矩阵 24/24 通过。用户 2026-10-24 本地验收通过；图例与图案可点击补丁见 §10/§11，随后按流程合并发布。

## 10. 补记：图例可点击（2026-10-24）

用户本地试用时指出：卷首三格图例是顶部入口，应该能点，不应只是计数。原 `home-spec` 写的是“图例不是链接”，按用户判断改为可点击（契约已同步）。

改动：

- `Frontispiece.astro`：三格 `<span>` → `<a class="frontispiece__legend-item">`；文章 → `/archive/`，碎碎念 → `/notes/`，现在 → `/now/`；全部走 `u()` 子路径。now 缺失时第三格仍不渲染。
- `global.css`：`.frontispiece__legend` 的子项改查 `a`；`min-height: 2.75rem` 保证热区 ≥44px；hover/focus 时文字与 `<b>` 变红；焦点框沿用全局 `:focus-visible`。
- `p1c/home-spec.md` §3.1、`p1c/README.md` 决策 9、`p1c/test-plan.md` H1/H1b/H14 同步。

验证：

```text
npm run check
Result (31 files): 0 errors / 0 warnings / 0 hints

npm run verify
links OK (internal=313, anchors=17)
CSS 14.7/18.0 KB · max HTML 20.3/30.0 KB
result PASS
```

- 产物 `dist/index.html` 三格链接为 `/xin-s-blog/archive/`、`/xin-s-blog/notes/`、`/xin-s-blog/now/`。
- 额外用 headless Chrome（CDP）在 1440×900 与 320×800 检查：三格高度均 44px；1440 宽 299px/格、320 宽 280px/格；`scrollWidth <= innerWidth`；链接与文案正确。
- **未重跑**完整 24 次浏览器矩阵；本次只改图例链接样式/结构，其余 P1c 证据仍以 §5 为准。真机/读屏仍未覆盖（P1e）。

## 11. 补记：三个图案也可点击（2026-10-24）

用户继续要求：上面三个几何图案也要像图例三格一样能点。改动仍局限在卷首组件与样式。

改动：

- `Frontispiece.astro`：SVG 外包 `.frontispiece__stage`；在 SVG 上盖一层三等分透明 `.frontispiece__hotspots`：
  - 圆 → `/archive/`
  - 方 → `/notes/`
  - 三角 → `/now/`（now 缺失时不渲染第三块）
- 热区 `aria-hidden="true" tabindex="-1"`：只服务鼠标/触屏；键盘与读屏走图例里的真链接，避免同一目标读两遍。
- `global.css`：`.frontispiece__stage` 定位；`.frontispiece__hotspots` 三列网格盖满 SVG；`cursor:pointer`；`:has()` 下 hover 对应图案描边变红。
- `p1c/home-spec.md` §3.1、`p1c/README.md` 决策 9、`p1c/test-plan.md` H1c/H14 同步。

验证：

```text
npm run verify
links OK (internal=316, anchors=17)
CSS 14.8/18.0 KB · max HTML 20.3/30.0 KB
result PASS
```

- headless Chrome 1440×900：stage 928×193；三个热区各 309×193；`elementFromPoint` 在圆/方/三角形中心分别命中 `/xin-s-blog/archive/`、`/xin-s-blog/notes/`、`/xin-s-blog/now/`；`scrollWidth 1425 <= 1440`。
- headless Chrome 320×800：stage 280×58；三个热区各 93×58（高 ≥44px）；三个中心命中同上；`scrollWidth 320 <= 320`。
- 三个热区 `tabIndex=-1`、父层 `aria-hidden=true`；图例三格仍是可 Tab 的真链接。
- 未重跑完整 24 次矩阵；本次只加图案热区与 hover 描边，其余证据仍以 §5 为准。

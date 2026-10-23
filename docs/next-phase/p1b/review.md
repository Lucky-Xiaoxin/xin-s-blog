# P1b 复核记录：碎碎念与 now

> 状态：实施中 · 2026-10-23（实现与本地验证完成，**待用户本地试用确认**）
> 上游：`p1b/README.md`、`content-model.md`、`pages-and-feed.md`、`check-dist-guards.md`、`test-plan.md`
> 证据：本文件 + `screens/`（生产子路径 `preview:prod` 截图与矩阵 JSON）
> Owner：实现规划师

## 1. 完成范围

- 数据层：`src/content.config.ts` 增加 `notes`/`pages` 两个 `.strict()` collection（`dateOnly` 预处理把 YAML 未加引号的日期归一化成 `YYYY-MM-DD`，再固定为 UTC 零点）；新增 `src/lib/notes.ts`（过滤/校验/排序/分组/锚点）、`src/lib/now.ts`（`getNow`）。
- 内容：`src/content/notes/_template.md`（`_` 前缀，永远不渲染）、`src/content/pages/now.md`（用户已定的单行状态 `emo中……`，`draft: false`，正文为空）。
- 页面：`/notes/`（月份分组、时间倒序、`:target` 红规线、草稿徽标、空状态）、`/notes/rss.xml`（独立 feed，0 条也生成）、`/now/`（单行状态 / 有小节两列 / 草稿空状态三态）。
- 入口：`src/const.ts` 新增 `PAGE_LINKS`（碎碎念/现在），`Base.astro` 页脚渲染 `[...PAGE_LINKS, ...SOCIALS]`；`/about/` 的「这个站点」段补一条碎碎念/现在的链接；`SOCIALS` 未动。
- 样式：`global.css` 新增 `.note-*`、`.now-*`、`.empty-state`（只加规则，不替换体系），含 40rem 以下单列与打印规则。
- 字体子集：`scripts/subset-fonts.mjs` 的 Markdown 扫描扩到 `src/content/{posts,notes,pages}`，规则与 posts 一致。
- 门禁：`scripts/check-dist.mjs` 新增 notes/now 产物、草稿泄漏、notes feed 交叉校验、sitemap、notes 页重复 id；产物计数改为动态 `OK (8/8)`，输出新增 `dom` 行。
- 文档：README（发布流程/体积基线/视觉规范/已知边界）、AGENTS（不变量）、TROUBLESHOOTING（新报错与仓库地图）同步。

## 2. 数据层校验（对应 T1–T5 / content-model §4）

每条用例都是临时建一个 note 文件 → `npm run build` → 记录退出码与输出 → 删除文件。

| 用例 | 输入 | 期望 | 实际 |
| --- | --- | --- | --- |
| T1 未知字段 | note 里加 `title` | 构建失败 | exit=1，`InvalidContentEntryDataError: notes → 2026-10-25-tmpcase data does not match collection schema` |
| T2 time 非零填充 | `time: '9:30'` | 构建失败 | exit=1，schema 报错（`time 须为零填充 24h 制，如 09:30`） |
| T2b time 越界 | `time: '25:00'` | 构建失败 | exit=1，schema 报错 |
| T3 日期与文件名不一致 | 文件名 `2026-10-25-…`、frontmatter `date: 2026-10-21` | 构建失败 | exit≠0，`[notes] 碎碎念 2026-10-25-tmpcase 的 date 与文件名日期不一致：date=2026-10-21` |
| T4 正文为空 | frontmatter + 空白 | 构建失败 | exit=1，`[notes] 碎碎念 2026-10-25-tmpcase 正文为空` |
| T5a 超长 | 801 字 | 构建通过 + 警告 | exit=0，`[notes] 碎碎念 … 超过 800 字，考虑写成文章` |
| T5b 未来日期 | `date` 晚于构建日 | 构建通过 + 警告 | exit=0，`[notes] 碎碎念 … 日期在未来；不会自动隐藏` |
| T7 date 格式错 | `date: '2026/10/25'` | 构建失败 | exit=1，schema 报错（`date 须为 YYYY-MM-DD`） |

- 错误路径会中断构建，**Windows 上 Node 在静态生成阶段抛未捕获异常时退出码是 3221226505**（0xC0000409），CI（Linux）上是常规非零退出；两种情况都会拦住发布，报错原文在输出最前面。
- 字段错误挡发布、超长/未来日期只警告，与 content-model §4 的分级一致。

## 3. 产物与门禁

### 3.1 类型检查与生产子路径 verify

```text
npm run check
Result (29 files): - 0 errors - 0 warnings - 0 hints

npm run verify
[check-dist] base=/xin-s-blog files=103
  artifacts  OK (8/8)
  links      OK (internal=304, anchors=17)
  drafts     OK (published=4, notes=0)
  seo        OK (posts=4)
  rss/sitemap OK
  dom        OK (notes)
  size       CSS 14.3/18.0 KB · JS 0.0/3.0 KB · fonts 1.39/1.50 MB · max HTML 20.3/30.0 KB · dist 1.6/2.6 MB
  inline JS  1.5 KB (theme script, not budgeted)
  result     PASS
[verify] PASS
```

- 带 4 条夹具 notes 时：`links OK (internal=308, anchors=21)`、`drafts OK (published=4, notes=4)`，其余不变；体积仍在 P0 预算内（CSS 14.3/18 KB，max HTML 20.3/30 KB）。
- 站内 JS 仍是 0 KB（只多了一段内联主题脚本），符合「零 JS」约束。

### 3.2 页面/feed 产物要点

- `/notes/`：月份小节 `id="notes-2026-10"` / `notes-2026-09`，`aria-labelledby` 指向标题；条目 `id="n-2026-10-22-fixture-c"` 形式；同日有时间（09:00）排在前、无时间在后；页头 meta `04 条 · 最近更新 2026.10.22`；0 条时显示「还没有碎碎念。先去现在看看我最近在做什么。」且**不渲染 meta 行**。
- `/notes/rss.xml`：0 条时生成合法 feed（`<channel>` 无 `<item>`）；有 4 条时 item 数 = 已发布数，`title` 为 `2026.10.22 09:00` / `2026.10.22`，`pubDate` 只到日期（`Thu, 22 Oct 2026 00:00:00 GMT`），`link` 带子路径与锚点。
- `/now/`：首版单行 → 渲染 h1/导语/「最后更新于 2026.10.23」，**不渲染 `.now-body`/`.now-foot`**；`now.md` 改草稿后 build 只剩空状态，产物里没有 `now-status`/`now-body`，也没有 `2026.10.23`；填入中性 `##` 小节后 `.now-body` + `.now-foot` + 两个 h2 正常出现。

### 3.3 故障注入 G1–G11（`DIST_DIR` 指向 dist 临时副本，跑完删除）

| 编号 | 注入 | 期望 | 实际输出 | 退出码 |
| --- | --- | --- | --- | --- |
| G1 | 未注入的最终 dist | PASS | `result PASS` | 0 |
| G2 | notes 页注入 `<li id="n-2026-10-20-fixture-draft">` | FAIL drafts | `FAIL drafts notes/index.html 包含草稿 note 2026-10-20-fixture-draft 的锚点` | 1 |
| G3 | notes feed 注入 `#n-2026-10-20-fixture-draft` | FAIL drafts | `FAIL drafts notes/rss.xml 包含草稿 note … 的锚点链接` + `FAIL rss … 包含草稿碎碎念锚点` | 1 |
| G4 | sitemap 去掉 `/notes/` | FAIL sitemap | `FAIL sitemap sitemap-0.xml 缺少页面：…/notes/` | 1 |
| G5 | notes canonical 改成站点根 | FAIL seo | `FAIL seo notes/index.html canonical 不是 …/xin-s-blog/ 下的绝对地址：https://lucky-xiaoxin.github.io/` | 1 |
| G6 | notes 页复制一个已有 note id | FAIL dom | `FAIL dom notes/index.html 重复 id: n-2026-10-22-fixture-c` | 1 |
| G7 | `now.md` 改草稿但产物仍渲染状态行 | FAIL drafts | `FAIL drafts now/index.html 渲染了草稿 now 的状态/正文` | 1 |
| G8 | feed 链接改成 `#n-2099-01-01-nope` | FAIL rss | `FAIL rss notes/rss.xml 缺少已发布碎碎念链接：…#n-2026-10-21-fixture-b` + `锚点 #n-2099-01-01-nope 在 notes/index.html 中找不到 id` | 1 |
| G9 | 主 feed 注入 `#n-…` | FAIL rss | `FAIL rss rss.xml 不应包含碎碎念锚点` + `不应包含碎碎念页面链接` | 1 |
| G10 | 删除 `notes/rss.xml` | FAIL artifacts | `FAIL artifacts notes/rss.xml 必需产物缺失` | 1 |
| G11 | 404 注入 `og:title` | FAIL seo | `FAIL seo 404.html 不应有 OG/Twitter 卡片` | 1 |

11/11 符合预期。

### 3.4 实施中发现并修掉的一个真问题

第一次生成 feed 时，item 的 `link` 是相对路径 `/xin-s-blog/notes/#n-2026-10-22-fixture-c`，`@astrojs/rss` 会调用 `createCanonicalURL()` 给它补尾斜杠，产出 `…/#n-2026-10-22-fixture-c/`——锚点后面多了个 `/`，页面里根本没有这个 id，订阅者点进来会跳不到条目。

修法：item 的 `link` 改用**绝对 URL**（`new URL(u('/notes/') + '#' + anchor, context.site).href`）。`@astrojs/rss` 对已经是绝对 URL 的 link 原样输出，不再补斜杠。同时把门禁改成**逐条精确比对 item 链接**（不再用子串包含判断），并用 fragment 原样去 `/notes/` 的 id 集合里找——正是这条更严的门禁把上面的斜杠问题照出来了。

## 4. 浏览器矩阵（生产子路径 `preview:prod`，headless Chrome + CDP）

每次检查：`scrollWidth <= innerWidth`、无元素越界、每页恰好 1 个 h1、无重复 id、页内锚点都能落到 id、导航 4 项且同一行、页脚顺序 碎碎念/现在/GitHub/Email/RSS、明暗 token 正确；notes 另查列数与锚点热区 ≥44×44、`:target` 规线是 absolute + 红色；now 另查分栏数与 h2 编号规则。

| 变体 | 用例 | 结果 |
| --- | --- | --- |
| content（4 条 notes + now 单行） | notes 1440/1024/768/390/320、notes 暗色 1440/390、notes#锚点 1440/390、now 1440/1024/768/390/320、now 暗色 1440/390、now 打印 390、about 1440/320、首页 390、404 390 = **21** | 21/21 通过 |
| empty（0 条 notes + now 草稿） | notes 空状态 390/1440、now 空状态 390/1440 = **4** | 4/4 通过 |
| columns（now 有两个 `##` 小节） | 1440 两列、390 单列 = **2** | 2/2 通过 |
| nojs（脚本执行禁用 + 系统暗色） | notes 390、now 390 = **2** | 2/2 通过 |

合计 **29 次，0 失败**。截图与矩阵 JSON 在 `screens/`。

- 无 JS + 系统暗色：`data-theme` 属性缺失时 `--paper` 落到 `#111214`，深色入口②接管（截图 `p1b-notes-390-noscript-dark.webp`）。
- 打印：`--paper` 强制 `#ffffff`、`.now-foot`/红点/锚点 `#` 隐藏、正文单列。
- 锚点热区实测 44×44px（`.note__link`），`:target` 规线 `position: absolute` + 红色 2px。

## 5. 字体子集

- 扫描路径按 content-model §8 扩展到 `src/content/notes` 与 `src/content/pages`，规则与 posts 一致（frontmatter 全文 + `^#{1,6}\s` 标题行 + `^>` 引用行；正文段落不收）。
- 用「源字体有 + 仓库其它地方没有」的常用字做探针，比较子集**字形总数**：note 引用行 +1 字形、note 正文段 +0、pages frontmatter +2 字形——说明「引用行/小节标题进子集、正文段不进」按预期工作；构建日志无缺字警告。
- **注意**：`fontkit` 的 `hasGlyphForCodePoint()` 对这个子集字体**不可靠**（子集 cmap 保留得更宽，未收录的字也返回 true）。test-plan §4.1 的抽查命令应改成比较字形总数或检查字形轮廓，否则会给出「都在子集里」的假结论。

## 6. 允许的差异 / 与设计稿的偏差

1. **月份标题**：契约用「2026 年 10 月」+ 顶部 1px 分隔线；设计原型是左栏「十月 / 2026 · 05 条」。按契约实现。
2. **没有「订阅碎碎念 RSS」按钮**：设计原型有，按用户 2026-10-23 的决定不放；`/notes/rss.xml` 仍生成并受门禁校验。
3. **条目里没有 N° 编号**：沿用设计契约 C4，只显示日期/可选时间/锚点。
4. **now 正文用 CSS 多列**：不是设计稿的 2×2 网格；标题编号 `01…` 也是契约新增（设计稿没有）。允许差异。
5. **now 导语用无衬线**：契约明确 `emo中……` 走 `--font-body`，避免为它新增子集用字；设计原型导语是衬线大字。
6. **`#` 锚点放在正文下方**（契约的 `.note__body` 内），不是设计稿的左栏红规线位置；`:target` 时才出现左侧 2px 红规线。
7. **空状态时 `/notes/` 不显示 `.notes-foot`**：空状态文案本身已经指向「现在」，两处重复会显得啰嗦。

## 7. 未覆盖 / 风险

- 真机 iOS Safari / Android Chrome、读屏（NVDA/VoiceOver）未实测（P1e 计划覆盖）。
- 实体打印 / PDF 阅读器逐页排版未验证，只验证了 print 媒体下的计算样式与截图。
- 第三方 RSS 阅读器未逐家兼容测试：只抽查了 feed 的 XML 结构与链接正确性（`@astrojs/rss` 标准输出）。
- notes 大量增长（100+ 条）的构建时间与 HTML 体积未压测；首版按 4 条夹具验证，max HTML 20.3 KB 距 30 KB 上限尚有余量。
- now 两列在超长条目下的分栏美观度未压测（只有 2 个小节的夹具）。
- 数据层错误在 Windows 上的退出码不直观（3221226505），见 §2。

## 8. 结论

P1b 的两个 collection、数据层校验与排序、两个页面与独立 feed、页脚/about 入口、字体子集扩展与 check-dist 新门禁均已按契约实现：`npm run check` 0/0，`npm run verify` PASS（体积在 P0 预算内），G1–G11 注入 11/11 符合预期，浏览器矩阵 29/29 通过。首版内容按用户已定的口径：notes 0 条（测试夹具已全部删除）、now 为单行 `emo中……`。**待用户本地试用确认后再 push / 开 PR。**

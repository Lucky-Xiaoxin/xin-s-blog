# P1b 测试计划：notes / now / feed

> 状态：已批准 · 2026-10-23（测试计划；实施后把真实结果写进 `review.md`）
> 上游：`p1b/README.md`、`content-model.md`、`pages-and-feed.md`、`check-dist-guards.md`
> 下游：`p1b/review.md`（实施后填真实验证结果）
> Owner：实现规划师
> 复核/证据：未开始

## 1. 测试对象

1. `notes`/`pages` collection 与 schema。
2. `src/lib/notes.ts` / `src/lib/now.ts` 的过滤、排序、分组、锚点、草稿。
3. `/notes/`、`/notes/rss.xml`、`/now/`。
4. 页脚/about 入口。
5. 字体子集扫描。
6. `check-dist` 新门禁与 P0/P1a 回归。

## 2. 测试夹具（不提交）

个人内容未提供前，用**中性测试条目**验证，跑完删除；不得把测试文案或伪造的个人经历留在仓库。

| 文件 | 用途 | 关键字段 |
| --- | --- | --- |
| `2026-09-30-fixture-a.md` | 跨月分组 | date 2026-09-30，已发布 |
| `2026-10-21-fixture-b.md` | 倒序 | date 2026-10-21，已发布 |
| `2026-10-22-fixture-c.md` | 同日有时间 | date 2026-10-22，time 09:00 |
| `2026-10-22-fixture-d.md` | 同日无时间 | date 2026-10-22，无 time |
| `2026-10-20-fixture-draft.md` | 草稿泄漏 | date 2026-10-20，draft true |
| `_template.md` | 模板排除 | `_` 前缀，draft true |
| `now.md`（首版已定） | 单行状态 | `description: 'emo中……'`、`updatedDate: 2026-10-23`、`draft:false`、正文为空 |
| `now.md`（临时覆盖） | 草稿/有小节两态 | 临时改 `draft:true`；或临时填中性小节，测完恢复首版 |

- 正文用“测试条目 A/B…”或结构性占位，不写课程、比赛、读书进度等可能被误认为真实经历的内容。
- 每次测试后 `git status` 确认只留下应提交的模板/代码，测试夹具全部删除。
- 空状态测试：删除所有非 `_` notes，只留 `_template.md`。

## 3. 命令

```bash
npm run check
npm run build                 # base=/
npm run verify                # base=/xin-s-blog/ + check-dist
npm run dev                   # 草稿、空状态、target 手测
npm run preview:prod          # 生产子路径预览（截图/浏览器矩阵）
```

- `verify` PASS 是硬门槛；`build` 失败信息要可读（中文、含文件 id）。
- 生产子路径测试必须用 `preview:prod`，不要用普通 `preview` 代替。
- check-dist 注入测试见 `check-dist-guards.md` §8，使用临时 `DIST_DIR` 副本。

## 4. 功能矩阵

| 编号 | 检查 | 步骤 | 期望 |
| --- | --- | --- | --- |
| T1 | schema 严格性 | 临时给 note 加 `title`；给 now 加未知字段 | build 失败，报未知字段；不留半成品产物 |
| T2 | 时间格式 | note `time: '9:30'` / `25:00` | build 失败，提示 `HH:MM` |
| T3 | 日期/文件名一致 | `2026-10-22-x.md` 写 `date: 2026-10-21` | build 失败，提示日期不一致 |
| T4 | 正文非空 | note 只有 frontmatter/空白 | build 失败，提示正文为空 |
| T5 | 长度/未来警告 | 801 字 note；未来日期 note | build 成功，console warning；条目仍显示 |
| T6 | 排序 | 夹具 A–D | 日期倒序；10.22 有 time 在前、无 time 在后；同日同 time 按 id 倒序 |
| T7 | 月份分组 | 夹具跨 9/10 月 | 10 月在前；标题 `2026 年 10 月`；小节 id `notes-2026-10` |
| T8 | 锚点唯一 | 4 条夹具 | 每条 `id="n-<id>"`；无重复；RSS 锚点与页面一致 |
| T9 | 模板排除 | 保留 `_template.md` | 不出现在 `/notes/`、RSS、首页数据 |
| T10 | 草稿 dev | `npm run dev` 打开 `/notes/` | 草稿条目出现，带“草稿预览”；不生成 `/notes/[slug]/` 独立页 |
| T11 | 草稿 build | `npm run verify` | `dist/notes/index.html` 无草稿锚点；`notes/rss.xml` 无草稿锚点 |
| T12 | notes RSS | 直接访问 `/xin-s-blog/notes/rss.xml`（页面无订阅按钮） | 只含已发布；item 数 = 已发布数；`title` 为日期(+时间)；`pubDate` 只到日期；链接带子路径+锚点；含 `&`/`<` 的正文不破坏 XML |
| T13 | 主 RSS 不变 | 检查 `/rss.xml` | 只有 4 篇文章；无 `#n-`/notes 锚点 |
| T14 | now 首版单行 | 用已定内容 `emo中……`、`draft:false`、正文为空 | h1/导语/最后更新正确；无 `.now-body`/`.now-foot`；无空框；`emo中……` 完整显示 |
| T14b | now 有小节（临时夹具） | 临时填中性 `##` 小节，`npm run build` | 正文按 Markdown 渲染；桌面 2 列、40rem 以下 1 列；h2 编号 01…；测完恢复首版单行 |
| T15 | now 草稿态 | 临时 `draft:true` + `npm run verify` | `now/index.html` 只空状态；无 `now-status`/`now-body`；dev 可预览且带徽标 |
| T16 | notes 空状态 | 只留 `_template.md` | 页头无计数 meta；显示“还没有碎碎念”；无 RSS 按钮（本来就不放）；无空框；feed 0 item 合法 |
| T17 | now 缺失 | 临时移走 now.md / 保持 draft | 空状态；无假日期；页脚/about 链接仍可达（返回空状态，不是 404） |
| T18 | 字体子集 | 构建后检查子集 | notes 夹具引用行用字在 woff2 中；有 now 小节夹具时 `在学/在做/在读/最近` 也在子集中；首版单行 `emo中……` 走无衬线，不要求进子集；无缺字 warning |
| T19 | 入口 | 检查页脚/about | 页脚顺序 碎碎念/现在/GitHub/Email/RSS；RSS 仍指 `/rss.xml`（主文章 feed）；没有“碎碎念 RSS”可见入口；`/xin-s-blog/` 前缀正确；about 联系我仍只有 SOCIALS |
| T20 | canonical/sitemap | 检查产物 | `/notes/`、`/now/` canonical 精确；sitemap 含两项；无 note 锚点；404 无 OG/noindex 保持 |

### 4.1 字体抽查命令（一次性，不提交脚本）

```bash
node --input-type=module -e "import * as fk from 'fontkit'; const f=fk.openSync('src/assets/fonts/noto-serif-sc-subset-500.woff2'); for (const c of '在学在做在读最近') if (!f.hasGlyphForCodePoint(c.codePointAt(0))) throw new Error('缺字 '+c); console.log('font subset OK')"
```

- 首版 now 无小节时，把字符集换成 notes 夹具引用行的中文；有 now 小节夹具时再查 `在学在做在读最近`。
- 浏览器侧看 computed `font-family` 首个可用字体是否为子集；截图对照设计稿的衬线标题。

## 5. 浏览器/视觉矩阵

生产子路径 `npm run preview:prod`，用与 P1a 相同的无头 Chrome/CDP 流程。

| 页面 | 宽度 | 主题/状态 |
| --- | --- | --- |
| `/notes/`（4 条夹具 + 草稿仅 dev） | 320 / 390 / 768 / 1024 / 1440 | 亮；390/1440 暗；390 无 JS + 系统暗；390 打印 |
| `/notes/#n-2026-10-21-fixture-b` | 390 / 1440 | 亮；target 红规线可见 |
| `/now/`（首版单行） | 320 / 390 / 768 / 1024 / 1440 | 亮；390/1440 暗；390 无 JS + 系统暗；390 打印 |
| `/now/`（临时小节夹具） | 390 / 1440 | 亮；桌面两列、移动单列 |
| `/now/`（空状态） | 390 | 亮 |
| `/about/`、首页页脚 | 320 / 390 / 1440 | 亮/暗；320 页脚换行 |
| `/notes/`（空状态） | 390 | 亮 |
| 404（回归） | 390 | 亮 |

每次检查：

- `document.documentElement.scrollWidth === window.innerWidth`；无元素越界。
- 每页恰好 1 个 h1；无重复 id；所有 `#n-...` 锚点都能找到目标。
- 导航仍 4 项且同一行；页脚含“碎碎念/现在”且 320 不溢出。
- notes：桌面 6.5rem 元信息列 + 正文；390 单列；时间/日期/草稿徽标不重叠；`:target` 线不改变布局。
- now：首版单行只有页头 + 状态行，无空框；有小节夹具时桌面两列（分栏顺序可读）、390/320 单列；状态行与“最后更新于”不被截断；打印单列。
- 亮/暗 token 正确；无 JS + 系统暗色走入口②；主题开关仍可用。
- 打印：白底、隐藏锚点 `#`/now 页脚/红点；notes/now 不横向溢出。

## 6. 故障注入

按 `check-dist-guards.md` §8 的 G1–G11 执行：

- 每条记录：注入文件/内容、实际输出行、退出码。
- 必须至少覆盖：草稿 note 锚点泄漏（HTML/RSS）、now 草稿正文泄漏、notes RSS 锚点不存在、sitemap 缺 notes/now、notes canonical 错、重复 id、主 RSS 混入 notes、404 OG 回归。
- 注入只改 `DIST_DIR` 临时副本；跑完删除，`git status` 不受影响。

## 7. 证据清单（实施后附在 `review.md` / PR）

- `npm run check` 输出：0 error / 0 warning（或明确记录 warning 来源）。
- `npm run verify` 完整输出：artifacts/links/drafts/seo/rss/sitemap/size/dom/result。
- G1–G11 注入表：注入 → 期望 → 实际 → 退出码。
- 字体抽查输出（fontkit）+ 构建子集日志（无缺字 warning）。
- 截图（建议命名，存 `p1b/screens/`）：
  - `p1b-notes-1440-light.webp`、`p1b-notes-390-light.webp`、`p1b-notes-1440-dark.webp`
  - `p1b-notes-target-390-light.webp`
  - `p1b-notes-empty-390-light.webp`
  - `p1b-notes-390-noscript-dark.webp`
  - `p1b-now-1440-light.webp`、`p1b-now-390-light.webp`、`p1b-now-1440-dark.webp`
  - `p1b-now-empty-390-light.webp`、`p1b-now-390-print.webp`
  - `p1b-footer-320-light.webp`
- 允许差异记录：now 分栏 vs 设计 2×2、notes 无 N°、月份/条目间距等。
- 未覆盖风险：真机 iOS/Android、读屏、实体打印、第三方 RSS 阅读器逐项说明。

## 8. 退出标准

全部满足才可交用户本地试用：

1. `npm run check` 0/0；`npm run verify` PASS。
2. T1–T20 全部通过；无跳过项（不能测的写“未覆盖 + 原因”，不能写“通过”）。
3. G1–G11 注入全部按期望 FAIL/PASS；证据可复现。
4. 320/390 无横向滚动；亮/暗/无 JS/打印通过；无新增 JS。
5. notes/now 标题用字进子集；无静默回退。
6. 体积在 P0 预算内；max HTML 不超 30KB（用夹具 10 条 notes 压测）。
7. 文档同步：README 发布流程、AGENTS 不变量、TROUBLESHOOTING 新报错、`p1b/review.md` 真实证据。
8. 内容门槛：`now.md` 为用户已定的单行 `emo中……`（`draft:false`）；notes 首版 0 条真实内容（用户已确认），夹具全部删除。
9. 用户本地试用确认后才 push/开 PR。

## 9. 已知不覆盖

- 真机 iOS Safari / Android Chrome、读屏（NVDA/VoiceOver）：P1e 计划覆盖。
- 第三方 RSS 阅读器逐家兼容：本阶段只抽查 1 个（如 Feedly/NetNewsWire），其余记录未覆盖。
- 实体打印/PDF 阅读器逐页排版：只验证打印媒体 CSS 与截图。
- notes 大量增长（100+ 条）的构建时间/HTML 体积：首版只压测 10 条；以后按需优化分页/折叠。
- now 两列在超长条目下的分栏美观度：允许差异，用户本地试用确认。

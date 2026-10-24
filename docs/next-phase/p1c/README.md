# P1c 实施文档：首页卷首与顶部入口

> 状态：已验收 · 2026-10-24（实现与本地验证完成；图例与三个图案可点击；用户本地验收通过）
> 上游：`design-contract.md` §2/§5.1/§7（已批准）、`implementation-plan.md` P1c、`p1b/review.md`（P1b 已验收）
> 下游：P1d 文章页、P1e 视觉 QA
> Owner：实现规划师
> 复核/证据：`review.md`（命令输出、空状态组合、浏览器矩阵、允许差异、未覆盖项）

## 1. 目标

把首页从旧的 `Hero + PostList` 换成设计稿方向一的**卷首首页**，让“碎碎念 / 现在”在首页顶部出现：

- 第一屏：卷首插图 + 三格图例（文章 / 碎碎念 / 现在），全部动态。
- 第二屏：左“开卷/最新”文章，右“页边”最新 3 条碎碎念 + 一行 now。
- 第三屏：编号目录，列出全部文章。

**为什么现在做**：用户 2026-10-23 看到 P1b 只有页脚入口，确认设计稿的顶部入口属于首页改版；P1b 数据层（notes/now）已就绪，P1c 只消费数据，不再改 collection。

## 2. 范围

### 做

1. `src/pages/index.astro` 重写：`Base size="full" width="wide"`；frontispiece + frontmatter + contents。
2. 新增组件：`Frontispiece.astro`、`Opening.astro`、`MarginNotes.astro`、`Contents.astro`（或按需合并，但首页模板不堆逻辑）。
3. `src/lib/notes.ts` 增加 `noteExcerpt()`（页边碎碎念的一行摘要）。
4. `src/styles/global.css` 增加 `.frontispiece*`、`.frontmatter`、`.opening*`、`.margin-notes*`、`.note-mini`、`.now-line*`；复用 P1a 的 `.contents/.section-head/.toc*`。
5. 删除旧首页专用件：`Hero.astro`、`PostList.astro` 与 `.hero*`、`.index*` CSS（确认无其它引用后）。
6. 空状态：0 文章 / 0 碎碎念 / 无 now 的任意组合都不留空框。
7. 文档：README/AGENTS/TROUBLESHOOTING 若首页行为变化需同步；本目录文档随实现更新。

### 不做（非目标）

- 不改 `/notes/`、`/now/`、`/archive/`、`/tags/`、`/about/`、404 的结构与文案。
- 不改页脚/主导航；notes/now 仍不占主导航。
- 不改文章页（P1d）；不做 H2 编号/TOC/代码标题栏。
- 不新增 JS/第三方/字体/色相；首页仍零 JS。
- 不做搜索、统计、评论、Newsletter。
- 不改 notes/now 的 schema 或排序；首页计数必须复用 P0/P1b helpers。
- 不做逐篇 OG/JSON-LD（P1e）。

## 3. 依赖与 PR 顺序

```
P1b（feat/notes-now，已验收）──> P1c（feat/home-frontispiece）──> P1d/P1e
```

- P1c 分支从 P1b 分支切出；P1b 未合并前不要并行改 `global.css`。
- 建议一个 PR：`feat/home-frontispiece`；内部可分两个提交（组件+样式 / 删旧首页件）。
- 若实现中发现首页宽壳与 P1d 文章页宽壳冲突，先完成 P1c 再动 P1d。

## 4. 文件地图

| 文件/接口 | 动作 | 说明 |
| --- | --- | --- |
| `src/pages/index.astro` | 重写 | wide/full 壳；组装四个组件；不写死计数 |
| `src/components/Frontispiece.astro` | 新增 | SVG + 三格图例；props 传计数/日期/now 摘要 |
| `src/components/Opening.astro` | 新增 | 最新文章块 |
| `src/components/MarginNotes.astro` | 新增 | 页边碎碎念 + now 行 |
| `src/components/Contents.astro` | 新增 | 编号目录 |
| `src/lib/notes.ts` | 改 | 增加 `noteExcerpt(note, limit?)` |
| `src/const.ts` | 改 | 增加 `formatMonthDay()`（`MM.DD`，UTC getter）；图例与页边共用 |
| `src/styles/global.css` | 改 | 新增首页组件；删除 `.hero*`/`.index*` |
| `src/components/Hero.astro` | 删 | 旧首页插图；确认无其它引用 |
| `src/components/PostList.astro` | 删 | 旧文章列表；确认无其它引用 |
| `README.md`/`AGENTS.md` | 改 | 首页结构/体积基线/视觉规范 |
| `docs/next-phase/p1c/review.md`、`screens/` | 实施后新增 | 实测证据 |

## 5. 关键决策

1. **顶部入口 = 首页内容块，不是主导航**：设计稿主导航仍 4 项；notes/now 通过卷首图例、页边块、页脚/about 进入。不把 notes/now 塞进 `NAV`。
2. **图例文案不用“本周”**：沿用设计契约 C3，碎碎念格显示 `碎碎念 NN · 最近 MM.DD`；now 格显示 `现在 <now.description>`；文章格 `文章 NN · 最新 MM.DD`。全部动态，禁止硬编码 04/06。
3. **页边碎碎念取最近 3 条**：`getRecentNotes(3)`；摘要用 `noteExcerpt()`，不渲染 Markdown、不截断出半句话。
4. **now 一行用 `description`**：不从正文截断；首版就是 `emo中……`。now 缺失时隐藏 now 行与图例第三格。
5. **目录复用 P1a 的 `.toc`**：不新造列表样式；编号 `01…NN` 按发布时间倒序；不显示 Seal 徽章（设计稿首页目录无徽章）。
6. **旧首页件删除**：`Hero`/`PostList` 与 `.hero*`/`.index*` 只服务旧首页；删除减少 CSS 体积。若未来其它页面需要列表样式，再单独抽。
7. **空状态组合**：0 文章 / 0 碎碎念 / 无 now 任意组合都成立；隐藏对应块，不留空框、不显示 0 条假数据。
8. **零 JS**：卷首 SVG 内联、图例/页边/目录全部静态；不新增脚本。
9. **图例可点击（2026-10-24 用户确认）**：文章 → `/archive/`，碎碎念 → `/notes/`，现在 → `/now/`；三格都是链接，热区 ≥44px，不再只是静态计数。契约原写法“图例不是链接”作废。上方三个图案也用透明热区链到同一目标（圆→归档、方→notes、三角→now）；图案热区不额外进读屏/键盘，键盘走图例真链接。

## 6. 验收

### 命令

```bash
npm run check
npm run verify
npm run dev
npm run preview:prod
```

### 数据/功能

- 图例三格与页边/目录全部来自 `getPublishedPosts()`、`getPublishedNotes()`、`getRecentNotes(3)`、`getNow()`；与 `/archive/`、`/tags/`、RSS 的计数同源。
- 页边 3 条碎碎念链接到 `/notes/#n-<id>`，锚点在 `/notes/` 存在（check-dist 自动校验）。
- now 行链接到 `/now/`；now 缺失时不渲染该行。
- 目录编号连续 `01…NN`；日期/阅读时长/标签正确；整行可点、标签独立可点。
- 0 文章/0 碎碎念/无 now 的空状态组合不出现空框或假计数。

### 视觉/可访问性

- 320/390/768/1024/1440；亮/暗；无 JS + 系统暗色；打印。
- 320 无横向滚动；图例可换行/单列；页边块单列；目录 meta 换行。
- 首页 h1 仍是品牌；开卷标题 h2、页边 h2、目录 h2、文章标题 h3，层级正确。
- 卷首 SVG `aria-hidden`；页边/目录有 `aria-labelledby`；链接焦点可见。
- 暗色只消费 token；打印隐藏装饰 SVG/红点。

### 门禁/体积

- `npm run verify` PASS；`check-dist` 无死链/锚点失败。
- 体积不超 P0 预算：CSS ≤18KB gzip、JS 0/≤3KB、字体 ≤1.5MB、max HTML ≤30KB、dist ≤2.6MB。
- 删除 `.hero*`/`.index*` 后 CSS 不应明显增长；首页 HTML 含 4 文章 + 3 碎碎念仍 ≤30KB。

## 7. 风险与回滚

| 风险 | 对策 |
| --- | --- |
| 320 首屏信息过密 | 图例 24rem 单列；页边 40rem 单列；目录 meta 换行；320 实测 |
| now 描述过长撑爆图例 | 图例允许换行；不截断 now 描述（它是用户写的一句话） |
| 碎碎念摘要带 Markdown 符号 | `noteExcerpt()` 统一剥离图片/链接/强调符号；测试含链接/粗体的 note |
| 删除 Hero/PostList 影响其它页面 | 先 grep 确认仅首页引用；PR 内同提交删除组件与 CSS |
| 首页宽壳与 P1d 冲突 | P1c 只切首页 wide；文章页 P1d 再切 |
| 图例/页边硬编码 | 门禁+浏览器矩阵断言计数来自数据；临时改 notes 看首页变化 |
| 暗色/打印回归 | 矩阵覆盖；只消费 token |
| P1b 未验收就叠 P1c | P1c 从 P1b 分支切出；P1b 验收问题先修 |

回滚：revert P1c merge commit；首页回到 P1b 后的旧 Hero 版本（若旧组件已删，回滚会一并恢复）。无数据迁移。

## 8. 待确认

**无**。设计稿与 P0/P1b 契约已覆盖首页结构；实现差异（如页边摘要长度）按本文默认执行并在 `review.md` 记录。

## 9. 链接

- `home-spec.md`：首页组件、数据、CSS、响应式、空状态、a11y/打印规格。
- `test-plan.md`：测试矩阵、证据、退出标准。
- 上游：`../design-contract.md`、`../implementation-plan.md`、`../p1b/review.md`。
- 设计稿：`../design/d1/home.html`、`../design/screens/d1-home-*.webp`。

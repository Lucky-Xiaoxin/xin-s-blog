# P1e 实施文档：SEO 补全、可访问性收尾与终验

> 状态：已批准 · 2026-11-01（用户批准契约并拍板 Q1/Q2；实现开始）
> 上游：`../implementation-plan.md` P1e（2026-10-30 规模收敛版）、`../frontend-review.md`（F5/F6/F15/N3 原始记录）、`../design-contract.md`（已批准）；上一阶段 P1d 已验收（验收记录见 `../implementation-plan.md` 实施记录）
> 下游：P1 系列收官；此后的新能力一律走 P2 逐项评审，不再有预设阶段
> Owner：实现规划师
> 复核/证据：未开始（`review.md` 实施后新增）

## 1. 目标

P1 的最后一阶段，做三件事：

1. **SEO 补全**：文章页 JSON-LD（BlogPosting + BreadcrumbList）与 OG 元信息补全，让搜索引擎与社交分享卡片拿到结构化信息。
2. **可访问性收尾**：修掉评审确认的 F5（中文小字）、F6（触控热区）、N3（图例撑破）、F15（tagline），让站点符合自己定的「中文可读性优先」与 44px 热区标准。
3. **终验**：打印查漏、视口矩阵、对照设计稿做视觉 QA，留下 P1 系列的收官验收记录。

不做的后果：结构化数据缺失影响搜索收录质量；小字/热区是评审已确认的问题，与站点「中文可读性优先」原则矛盾；P1 无收官记录，后续维护失去对照基线。

### 2026-11-01 摸底：契约瘦身

对照 2026-11-01 代码实测，原 P1e 任务清单中以下项**已完成，只做回归验证**，不再实现：

- sitemap 已排除 404（`dist/sitemap-0.xml` 实测 0 处）。
- `public/og.png` 已存在，尺寸 1200×630（OG 分享卡标准尺寸）。
- canonical 与 404 noindex 已实现（`Base.astro`，check-dist 每次构建校验）。
- `prefers-reduced-motion` 全局规则已存在（`global.css`，关停全部 animation/transition）。
- 打印隐藏（上下篇/页边规格/主题开关/skip 链接）P1d 已完成。

## 2. 范围

### 做

**A. SEO 补全**

1. 文章页 JSON-LD：`BlogPosting` + `BreadcrumbList`，构建期静态注入 `<head>`；`<` 序列（含 `</script>`）安全转义；仅文章页注入，列表页不加。
2. OG 补全（Base 级）：`og:locale=zh_CN`、`og:image:width=1200`、`og:image:height=630`；文章页加 `article:published_time`、`article:modified_time`、`article:tag`（每标签一条）。
3. 可选：`scripts/check-dist.mjs` 增加「JSON-LD 可 JSON.parse」与 OG 属性存在性检查（实施首日决定，见 §8 Q1）。

**B. 可访问性（评审项）**

4. F5 中文小字 ≥12px：卷首图例（320/390 实测 10px）、`.margin-notes__head a`（桌面端也是 10px）、320 导航（11px）、`.label`/`.tag`（11px）、页脚 label（11px）；`0.2em` 字距只保留给拉丁大写；等宽日期/计数维持 11–12px（评审确认可读）；320 图例靠缩列数/换行，不缩字号。
5. F6 热区 44×44：`.tag`（实测 44×29）、`.margin-notes__head a`（67×18）、`.now-line p a`（41×23）、页脚「订阅 RSS」（约 21px 高）、主题开关（40px，差 4px）；用伪元素扩热区、视觉外观不变，相邻热区不重叠；正文内联链接维持 ≥24px（WCAG 2.5.8，AGENTS 既定口径）；键盘 Tab 顺序不变。
6. N3 卷首图例「现在」格截断保护：对齐标签索引「最近」列的单行 ellipsis 策略（本契约推翻 p1c 的对应处理，见 §3.8）；完整文案仍以 `/now/` 页为准。
7. F15 tagline：**2026-11-01 用户选定方案 A 文案**：`计算机系统、算法与开发工具，一个本科生的手记。`首页头部只显示该行（去掉 `{SITE.tagline} · {SITE.description}` 拼接）；`SITE.description` 保留，仅用于 meta description / og:description；首页 `<title>` 随之变为 `二进制与诗 — {新 tagline}`，无需额外改动。

**C. 打印查漏**

8. `@media print` 补：`.prose` 内代码块（`.scroll-x`）、表格、图片 `break-inside: avoid`，长代码/宽表格/图不从中间切断；其余打印规则回归验证。

**D. 终验与文档**

9. 视口矩阵（320/375/390/768/1024/1440 × 亮/暗/无 JS+系统暗色/打印）、键盘全流程、读屏抽查、装饰 SVG/编号 aria-hidden 抽查。
10. 视觉 QA：对照 `../design/screens/d1-*`，允许差异记入 `review.md`。
11. 文档同步：README/AGENTS/TROUBLESHOOTING + 本目录 `review.md`、`screens/`。
12. 真机走查：**2026-11-01 用户确认实现完成后即真机验收**——合并上线后用户按一分钟清单（首页/文章/标签/碎碎念 × 横竖屏 × 字号/热区）检查，结论补记 `review.md`；发现问题开小修，不重开阶段。

### 不做（非目标）

- F4/F7/F9/F10/F11/F14（2026-10-30 暂缓；触发条件见 `../frontend-review.md` §5）与 N4（待 P2）。
- TOC/H2 编号/代码标题栏/图注/相关阅读（P1d 延后项，触发条件见 `../implementation-plan.md` P1d）。
- P2 全部：搜索、逐篇 OG、旧链接重定向、系列、评论、统计、Newsletter、友链、Webmention。
- 不动 Seal 映射与 `SEAL_CORES`（红线）；不改配色/字体方向（E 不动）。
- 不新增运行时 JS（JSON-LD 是构建期静态 HTML，不是脚本）；不引入第三方服务。
- 逐篇 OG image 不做（全站共用 `og.png`）。

## 3. 契约与决策

以下写死，实现不得擅自偏离：

1. **JSON-LD 形态**：文章页 `<head>` 内 `<script type="application/ld+json">`；所有字符串统一 `JSON.stringify` 并把 `<` 转义（防 `</script>` 逃逸）；字段值只来自 frontmatter 与 `SITE`，不引入新数据源。
2. **BreadcrumbList 三级**：目录（`/`）→ 首个标签页（`/tags/<tag>/`）→ 文章页；标签取文章首个标签（与印记外框同源顺序）。
3. **BlogPosting 必填字段**：`headline`（文章标题）、`datePublished`（`pubDate` ISO 字符串）、`dateModified`（`updatedDate ?? pubDate`）、`author`（Person，`SITE.author`）、`keywords`（标签数组）、`mainEntityOfPage`（canonical）。
4. **og:image 尺寸写死 1200×630**（2026-11-01 实测 `public/og.png`）；未来换图必须同步这两个值。
5. **og:locale 写死 `zh_CN`**。
6. **F5 界线**：中文 utility 文本 ≥12px；纯拉丁大写 + 字距可小于 12px 但不小于 10px；等宽日期/计数保留 11–12px 不动。
7. **F6 界线**：标签/按钮/主导航/页边链接 ≥44×44；正文内联链接 ≥24px；相邻热区不重叠；链接文字视觉外观不变（伪元素扩区）。
8. **N3 策略**：单行 ellipsis（对齐标签索引「最近」列）。**推翻 p1c README 风险表中「图例允许换行、不截断 now 描述」的处理，仅限卷首图例第三格**；理由：N3 是其后（2026-10-31）用户确认的实测问题，长文案会撑破三格布局；页边 now 行与 `/now/` 页维持完整显示。
9. **F15 形态**：首页头部 tagline 单行显示；`SITE.description` 不再进入首页显示流；删除 `Base.astro` 中 `{SITE.tagline} · {SITE.description}` 拼接；`max-width` 是否微调由 1440 实测决定（新文案 22 字符，预计单行放下）。
10. **PR 形态**：单分支 `feat/seo-a11y-print` 单 PR；提交分组：①SEO ②可访问性 ③打印（+check-dist 若做）④文档。

## 4. 文件地图

| 文件/接口 | 动作 | 说明 |
| --- | --- | --- |
| `src/const.ts` | 改 | `SITE.tagline` 换为方案 A 文案 |
| `src/layouts/Base.astro` | 改 | og:locale/og:image 尺寸；首页 tagline 显示去拼接 |
| `src/pages/posts/[...slug].astro` | 改 | 注入 JSON-LD；article: 时间/标签 meta |
| `src/styles/global.css` | 改 | F5 五处、F6 五处、N3 clamp、打印 break-inside |
| `src/components/Frontispiece.astro` | 视实现 | N3 若纯 CSS 可解则不动组件 |
| `scripts/check-dist.mjs` | 可选改 | JSON-LD/OG 检查（§8 Q1） |
| `README.md`/`AGENTS.md`/`TROUBLESHOOTING.md` | 改 | 行为同步（预算数字若变、新约定、新报错） |
| `docs/next-phase/p1e/review.md`、`screens/` | 实施后新增 | 验收证据 |

## 5. 验收

### 命令

```bash
npm run check
npm run verify
npm run dev          # 本地试用
npm run preview:prod # 生产子路径预览
```

### 机器可验证

- `verify` PASS；体积预算全项不破（CSS 现 15.2/18KB，新增规则后仍 ≤18KB；JS 仍 0）。
- JSON-LD 可被 `JSON.parse`（若 Q1 加门禁由 check-dist 覆盖；否则实施时用浏览器控制台/脚本验证并留证据）。
- sitemap 不含 404、canonical/404 noindex 回归通过（check-dist 现有项）。

### 人工可验证

- F5：图例/导航/`.label`/`.tag`/页脚的计算字号 ≥12px；mono 日期 11–12px 不变；320 图例不缩字号。
- F6：五个目标 ≥44×44、相邻不重叠；Tab 焦点顺序与视觉顺序一致；链接文字视觉不变。
- N3：临时把 now description 改长（验证后还原）——图例第三格出省略号、三格布局不破；`/now/` 完整显示。
- F15：1440 无孤行；首页头部为新文案单行；`<title>`/meta description 正确。
- 打印：长代码块/宽表格/图片不跨页；P1d 打印规则回归。
- 视口矩阵 + 亮/暗/无 JS/打印全过；视觉对照 d1 记录允许差异。
- 真机：**待补**（见 §2 D12）。

## 6. 测试与证据

见 [test-plan.md](test-plan.md)（实施前为计划，不填假结果）。PR 附：verify 输出、F5/F6 计算样式数值或截图、N3 长文案注入、打印 PDF、d1 对照差异表。

## 7. 风险与回滚

| 风险 | 对策 |
| --- | --- |
| JSON-LD 转义遗漏（`</script>` 逃逸） | 统一 `JSON.stringify` + `<` 转义；若加门禁由 check-dist 拦截 |
| 热区伪元素导致相邻可点元素重叠 | 矩阵含相邻元素 bounding box 抽查；Tab 走查 |
| F5 调字号引发换行/溢出回归 | 全视口矩阵；320 图例改列数不缩字号 |
| tagline 改动影响 `<title>`/meta | 引用点只有 `Base.astro` 两处（已核实）；check-dist seo 项回归 |
| CSS 增长逼近 18KB | F5 多为改值非增规则；verify 把关，超限先定位不抬上限 |
| 真机未验 | 改动方向单调（字号/热区只大不小）；线上补验清单兜底 |
| 打印 break-inside 与现有分栏规则冲突 | now 页分栏已有 break 规则，只加 `.prose` 域；打印 PDF 实测 |

回滚：revert 本 PR 的 merge commit；无数据迁移；线上回到 P1d 版本。

## 8. 待确认

| 编号 | 问题 | Owner | 截止/状态 |
| --- | --- | --- | --- |
| Q1 | `check-dist.mjs` 是否加 JSON-LD/OG 检查 | 实现规划师 | **已决（2026-11-01 用户拍板：做）** |
| Q2 | 真机走查时间 | 用户 | **已决（2026-11-01：实现完成后用户即真机验收；上线后按一分钟清单执行，结论补记 review.md）** |

## 9. 链接

- [test-plan.md](test-plan.md)：测试矩阵、故障注入、证据清单与退出标准。
- 上游：`../implementation-plan.md` P1e、`../frontend-review.md`（F5/F6/F15/N3 原始记录）、`../design-contract.md`。
- 设计稿：`../design/screens/d1-*`（视觉对照）。

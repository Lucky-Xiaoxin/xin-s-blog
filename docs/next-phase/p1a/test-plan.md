# P1a 测试计划与证据清单

> 状态：实施中 · 2026-10-23（实现完成，浏览器矩阵 52/52；待用户试用确认）
> 上游：`p1a/README.md`、`ui-foundation.md`、`check-dist-guards.md`
> 执行时机：P1a 实现完成后、合并前
> Owner：实现规划师；复核记录见 `p1a/review.md` 与 `p1a/screens/`

## 1. 测试矩阵

| 编号 | 测什么 | 方法 | 预期 |
| --- | --- | --- | --- |
| T1 | preflight guards | 临时 dist 注入 data-id/错 canonical | 修复前复现假阴性；修复后 FAIL |
| T2 | verify 基线 | `npm run verify` | PASS；体积不超 P0 预算 |
| T3 | tokens/shell | 320/390/768/1024/1440 | 无横溢；mid 壳居中；首页/文章仍 measure |
| T4 | 4 项导航 | 320/390 宽度、Tab | 不换行/不溢出；active 正确；焦点可见 |
| T5 | 归档 | 访问 `/archive/`；对照 4 篇日期 | 2026：10 月 1 篇、9 月 3 篇；编号 01–04；链接正确 |
| T6 | 标签索引 | 访问 `/tags/` | 6 个标签；计数 算法 2/题解 1/工具 1/Git 1/GitHub 1/其它 1；最近一篇正确 |
| T7 | 标签详情 | 逐个标签 | 过滤正确；标题 `#tag`；canonical 正确；无空标签页 |
| T8 | 关于 | 访问 `/about/` | 内容不变，只换壳；无 notes/now 死链 |
| T9 | 404 | 访问不存在路径/构建 404.html | 404 页面；noindex；无 canonical/OG；320 不溢出 |
| T10 | 暗色/无 JS | 亮/暗；禁用 JS + 系统暗色 | token 正常；主题兜底；无新 JS |
| T11 | 打印/减少动效 | 打印预览；系统减少动效 | 强制亮色；主题开关隐藏；动画近乎关闭 |
| T12 | 视觉回归 | 改前/改后截图 | 首页/文章内容区不变；允许页头/页脚/导航/gutter/mid 页面变化 |
| T13 | 死链/根绝对 | `npm run verify` | PASS；无根绝对；无 notes/now 死链 |
| T14 | CI | PR 触发 | build + check:dist 绿；失败阻断 |
| T15 | 文档 | README/AGENTS/TROUBLESHOOTING | 新宽度/导航/归档/标签/F1F2 说明一致 |

## 2. 关键预期数据

基于当前 4 篇文章：

- 文章：4 篇；最新 `math-xor` 2026-10-19。
- 标签：算法、题解、工具、Git、GitHub、其它；计数 2/1/1/1/1/1（算法 2、题解 1、其余各 1）。
- 归档：
  - 2026 年 10 月：`math-xor` 1 篇。
  - 2026 年 9 月：`github-remote-ques`、`happy-number-from-cf1124-div2-d`、`first_page` 3 篇。
  - 编号按全站倒序：01 math-xor、02 github-remote-ques、03 happy-number、04 first_page。
- 标签详情 URL 为百分号编码；页面标题/计数正确。

## 3. 具体步骤

### T1 preflight guards

按 `check-dist-guards.md` 第 4 节做临时 dist 注入：

1. `data-id="nope"` + `href="#nope"` → 修复前 links PASS（假阴性）；修复后 FAIL。
2. 文章 canonical 改成站点根 → 修复前 PASS；修复后 FAIL。
3. 正确 canonical → PASS。
4. `npm run verify` 仍 PASS；`internal/anchors` 基线不下降。

### T2 verify

- 清空/保留 `dist` 均可；`npm run verify` 会重建。
- 记录输出体积：
  - CSS gzip ≤18KB
  - JS ≤3KB（本阶段应为 0 个 `.js`）
  - 字体 ≤1.5MB
  - 最大 HTML ≤30KB
  - dist ≤2.6MB
- 记录 `links internal/anchors` 数量；比 P0 基线增加是正常的（新增归档/标签页）。

### T3 tokens/shell

- 在浏览器 DevTools 检查 `--mid`/`--wide`/`--gutter`/`--ease` 计算值。
- 首页/文章页：内容宽度仍 42rem；不要因为定义了 `--wide` 就切宽。
- 归档/标签/关于/404：shell 最大 46rem（+gutter），居中。
- 320/390：无横向滚动；`document.documentElement.scrollWidth === innerWidth`。

### T4 导航

- 320/390：4 项导航 + 品牌 + 主题开关不换行/不溢出。
- 当前页 active 红点/墨色正确：目录/归档/标签/关于。
- Tab 顺序：skip → 品牌 → 4 导航 → 主题开关 → 正文。
- 页脚无 `/notes/`、`/now/` 死链（P1b 再加）。

### T5 归档

- 对照预期数据；编号连续。
- 年份/月顺序 desc；组内 `byNewest`。
- 移动端隐藏阅读时长列；标题/标签换行不溢出。
- 所有链接 200。

### T6/T7 标签

- 索引排序：计数 desc，同计数按中文 locale。
- 最近一篇：取 `getAllTags().latest`，不是页面反推。
- 标签详情：文章列表与索引计数一致；标题、canonical、meta 正确。
- 中文 URL 可访问；无 `%` 双重编码。
- 无空标签路由（getStaticPaths 只生成有文章的标签）。

### T8/T9 关于/404

- 关于文案不变；只换 shell/PageHead；无 notes/now 链接。
- 404：`dist/404.html` 有 `noindex`，无 canonical/og:url；320/390 正常。
- 访问不存在的 `/tags/xxx/` 应 404。

### T10/T11 暗色/无 JS/打印

- 亮/暗切换；刷新后记忆；无 JS + 系统暗色仍暗。
- 新组件在暗色下用 token；无白底/黑字漏网。
- 打印：强制亮色；隐藏主题开关/skip；归档/标签页可读。
- 系统减少动效：过渡近乎关闭；主题初始状态不受影响。

### T12 视觉回归

- 改前（P0 当前 main）截图：首页、文章 `math-xor`、标签索引、404，1440/390，亮色。
- 改后同视口/同页面。
- 允许变化：
  - 全局 gutter（内容两侧留白）；
  - 页头/页脚/导航（4 项、页脚布局）；
  - 归档/标签/关于/404 的新壳。
- **不允许**：
  - 首页 Hero/文章列表/文章头/正文排版被改；
  - 文章正文宽度变化；
  - 颜色/字体族变化；
  - 新增 JS。
- 将允许差异写入 PR，避免“看起来变了但说不清”。

### T13/T14 链接与 CI

- `npm run verify` PASS；所有新页面链接可达。
- `check-dist` 的 internal/anchors 数量合理；无根绝对/死链。
- PR 触发 build + check:dist；失败阻断。
- 合并后 main deploy 正常（如用户允许）。

### T15 文档

- README：新导航/归档/标签、verify 说明、预算不变。
- AGENTS：文档规范、width 分期、页脚链接延后、F1/F2。
- TROUBLESHOOTING：新增“4 项导航溢出”“mid/wide 混用”“归档时区”等真实错误（如有）。
- 核对所有可验证断言。

## 4. 证据清单（PR 正文附）

- [ ] T1 修复前/后注入输出各一份。
- [ ] `npm run verify` 成功输出（含体积表）。
- [ ] T5/T6/T7 页面截图或 DOM 断言。
- [ ] 320/390/1440 导航/归档/标签/404 截图。
- [ ] 暗色/无 JS/打印各一张关键截图。
- [ ] 改前/改后首页/文章对比截图（标注允许差异）。
- [ ] `rg` 证明无 notes/now 死链、无新增 `.js`。
- [ ] CI PR run 链接/截图。
- [ ] 未覆盖风险列表。

## 5. 退出标准

- T1–T15 全通过，或未通过项有用户接受的说明。
- `npm run verify` PASS；体积预算内；无新增 JS。
- 首页/文章内容区未被改；归档/标签/404/about 符合契约。
- 无临时测试文件/临时 dist 残留。
- 文档同步；用户本地试用确认后才 push/开 PR。
- 复核记录写 `p1a/review.md`；P1a 状态改“已验收”。

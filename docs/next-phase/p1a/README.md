# P1a 实施文档：设计基础层

> 状态：实施中 · 2026-10-23（实现与本地验证完成，待用户试用确认）
> 上游：`design-contract.md`（已批准）、`p0/review.md`（P0 已验收）
> 下游：P1b notes/now、P1c 首页、P1d 文章页
> Owner：实现规划师
> 复核/证据：`review.md`；`screens/`（生产子路径预览截图）

## 1. 目标

在不改首页/文章正文的前提下，把方向一「卷首」的**外壳、tokens、基础组件、归档/标签/404** 落到现有 Astro 结构里。P1a 完成后，全站有统一的新壳和数据基础，P1b–P1d 只做内容区，不再反复改 Base/CSS。

**为什么不能跳过**：首页和文章页的新版式依赖 `--wide/--mid`、PageHead、标签/归档样式、归档数据；如果先做首页/文章，会边做边改壳，返工。

## 2. 范围

### 做

1. **Preflight（推荐单独小 PR）**：修 `check-dist` 的两个 P2 假阴性（`data-id` 被当成 `id`、canonical 只校验前缀）；详见 `check-dist-guards.md`。
2. **Design foundation**：`--mid/--wide/--ease/新 gutter`；`Base.astro` 的 `width` prop；页头/页脚/4 项导航；`PageHead`、`.btn`、`.more`、`.tag-index` 等基础组件。
3. **页面壳**：`/archive/`（新增）、`/tags/` 索引改版、`/tags/[tag]/` 紧凑版、`/about/` 换壳、404 套新壳。
4. **数据 helpers**：`getArchiveGroups()`、`getPostsByTag()`（在 `src/lib/posts.ts`，与 P0 数据层一致）。
5. **基础可访问性**：焦点、键盘、`prefers-reduced-motion`、打印基础规则；暗色双入口保持。
6. **文档/门禁**：README/AGENTS/TROUBLESHOOTING 同步；`npm run verify` 保持 PASS。

### 不做（非目标）

- 不改首页的卷首/开卷/页边/目录（P1c）。
- 不改文章页的文章头/规格/TOC/H2 编号/代码标题栏/图注/相关（P1d）。
- 不做 notes/now 页面与 collection（P1b）；**不在页脚提前放 notes/now 死链**。
- 不做系列、搜索、评论、统计、友链、Newsletter、复制按钮。
- 不做 JSON-LD/OG 补全、逐篇 OG、图片管线（P1e/P2）。
- 不新增字体/色相/第三方脚本；不整份导入设计稿的 `base.css`。
- 不改任何文章内容。

## 3. 依赖与 PR 顺序

```
P0（已验收）
   │
   ├─ P1a-preflight（可选，check-dist F1/F2）
   │
P1a-1 design foundation（tokens/Base/页头页脚/PageHead/按钮/标签）
   │
P1a-2 archive/tags/404/about 壳
   │
P1b notes/now
```

建议拆两个 PR（preflight 可单独）：

1. `fix/check-dist-guards`：F1/F2 + 测试；不改 UI。
2. `feat/design-foundation`：P1a-1 + P1a-2；或再拆 `feat/archive-tags`。

**不要**在 P1a 把首页/文章切到 `wide`。Base 支持 `wide`，但 P1a 只给归档/标签/关于/404 用 `mid`；首页/文章保持 `measure`，等 P1c/P1d 再切。

## 4. 文件地图

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/styles/global.css` | 改 | 合并 tokens/shell/页头页脚/PageHead/按钮/归档/标签/404；不替换现有体系 |
| `src/layouts/Base.astro` | 改 | `width` prop；4 项导航；页脚结构；active 状态 |
| `src/const.ts` | 改 | `NAV` 加归档；必要的标签/文案；notes/now 页脚链接延后 |
| `src/lib/posts.ts` | 改 | `getArchiveGroups()`、`getPostsByTag()` |
| `src/components/PageHead.astro` | 新增 | 归档/标签/关于的通用页头 |
| `src/pages/archive/index.astro` | 新增 | 年月分组、编号、计数 |
| `src/pages/tags/index.astro` | 改 | `.tag-index` 索引 |
| `src/pages/tags/[tag].astro` | 改 | 紧凑 `contents` 列表 |
| `src/pages/about.astro` | 改 | 只换 shell/PageHead，不改文案 |
| `src/pages/404.astro` | 改 | 套新壳；noindex/无 canonical/OG |
| `scripts/check-dist.mjs` | 改（preflight） | 精确 id/canonical |
| `README.md`/`AGENTS.md`/`TROUBLESHOOTING.md` | 改 | 新宽度/导航/归档/标签/检查项 |

## 5. 关键决策

1. **宽度分期**：P1a 只启用 `mid`；`wide` 先定义不启用。首页/文章在 P1c/P1d 切，避免宽壳 + 旧内容区的半成品。
2. **页脚死链**：notes/now 链接与 P1b 的路由同 PR 加；P1a 只调页脚布局/现有社交链接。
3. **归档/标签数据**：用 helpers，不在页面里重复 `getCollection` 过滤/排序；归档年月用 UTC getter。
4. **标签详情无设计稿**：按设计契约复用首页 `contents` 的紧凑版；不新造卡片体系。
5. **404 无设计稿**：保留现有 `40[4]` 标记，套新壳；不生成 canonical/OG。
6. **CSS 合并**：设计稿 `assets/base.css` 只作参考，不 import；把需要的 token/组件合并进 `global.css`，保留暗色双入口/Shiki/KaTeX/`.scroll-x`/字体子集。
7. **全局 gutter**：`--gutter` 改窄会影响所有页面；必须全站回归，不能只看归档页。
8. **导航 4 项**：320px 必须不换行/不溢出；优先缩间距/字号，不删“归档”。

## 6. 验收

- `npm run check` 0/0；`npm run verify` PASS；体积不超 P0 预算（CSS ≤18KB gzip、JS 0/≤3KB、字体 ≤1.5MB、HTML ≤30KB、dist ≤2.6MB）。
- 320/390/768/1024/1440 无横向滚动；亮/暗；禁用 JS；导航 4 项在 320 可用。
- `/archive/` 分组/计数/编号/链接正确；移动端隐藏阅读时长列。
- `/tags/` 徽章/名称/最近一篇/计数正确；`/tags/[tag]/` 过滤正确；无空标签路由。
- `/about/` 内容不变，只换壳；404 noindex、无 canonical/OG。
- 现有首页/文章内容区不被改；允许的变化只有：全局 gutter、页头/页脚/导航、shell 宽度（mid 页面）。
- 无新增 JS/字体/色相/第三方；暗色、打印基础、reduced-motion 正常。
- 所有站内链接走 `u()`；`check-dist` 无死链；F1/F2 修复后注入测试能 FAIL。
- 文档同步；用户本地试用确认。

## 7. 风险与回滚

| 风险 | 对策 |
| --- | --- |
| 全局 gutter 改窄影响所有页面 | 改前/改后 1440/390 截图；重点看首页/文章页留白 |
| 4 项导航在 320 换行 | 采用设计稿的窄屏 gap/字号；必要时缩小 letter-spacing |
| P1a 提前切 wide 导致旧内容区拉伸 | 明确 P1a 只启用 mid；wide 留到 P1c/P1d |
| 页脚 notes/now 死链 | 链接随 P1b 路由一起加 |
| 标签详情/404 无设计稿 | 按契约默认实现；视觉 QA 记录允许差异 |
| 合并 CSS 覆盖现有暗色/Shiki/KaTeX | 只加新规则，不改现有 token/入口；改一处同步另一入口 |
| 归档年月时区差一天 | 用 UTC getter，与 `formatDay` 同源 |
| 标签 latest 取错 | 用 `getAllTags` 的 `latest`，不要在页面反推 |

回滚：revert P1a merge commit；无数据迁移/外部状态。F1/F2 preflight 可独立回滚。

## 8. 待确认

无。设计契约已批准；标签详情/404 按默认实现；P1a 只做壳，不涉及个人内容。

## 9. 文档索引

- `ui-foundation.md`：tokens、Base、PageHead、归档/标签/404 的详细规格。
- `check-dist-guards.md`：F1/F2 的修复契约与测试。
- `test-plan.md`：P1a 测试矩阵、证据、退出标准。
- `review.md`：实现结果、verify/注入/浏览器矩阵证据、允许差异、未覆盖风险。
- `screens/`：改前/改后与特殊状态截图（生产子路径 `preview:prod`）。

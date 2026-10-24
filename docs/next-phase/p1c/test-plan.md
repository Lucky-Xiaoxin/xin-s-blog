# P1c 测试计划：首页卷首

> 状态：已验收 · 2026-10-24（测试已按本计划执行；H1b/H1c/H14 为图例与图案可点击补丁新增，真实结果见 `review.md`）
> 上游：`p1c/README.md`、`home-spec.md`、`p1b/review.md`
> 下游：`p1c/review.md`
> Owner：实现规划师
> 复核/证据：`review.md` §2–§4（用例结果、空状态组合、浏览器矩阵、体积）

## 1. 测试对象

1. 首页数据：图例计数/日期、opening、页边 3 条、now 行、目录编号。
2. 首页链接：notes 锚点、now、文章、标签、阅读全文。
3. 空状态组合。
4. 响应式/暗色/无 JS/打印。
5. 删除旧首页件后的全站回归。
6. 体积与门禁。

## 2. 夹具

- 文章：沿用现有 4 篇（不改内容）。
- 碎碎念：临时 3 条已发布 + 1 条草稿；其中一条正文首行含链接/粗体，验证 `noteExcerpt()`；跑完删除。
- now：首版 `emo中……`；另临时验证“有小节”和“草稿/缺失”两态，跑完恢复。
- 空状态：临时把 notes 全删/now 改草稿；文章空状态用一个临时空 content 目录副本验证（不改仓库文章），或只在单元层面断言组件分支。

## 3. 命令

```bash
npm run check
npm run build
npm run verify
npm run dev
npm run preview:prod
```

- `verify` PASS 是硬门槛。
- 生产子路径截图/矩阵用 `preview:prod`。
- 删除旧组件后必须重跑全站 `verify`，确认没有引用残留。

## 4. 功能矩阵

| 编号 | 检查 | 步骤 | 期望 |
| --- | --- | --- | --- |
| H1 | 图例动态 + 可点击 | 4 文章 + 3 碎碎念 + now | `文章 04 · 最新 <最新文 MM.DD>`、`碎碎念 03 · 最近 <最新 note MM.DD>`、`现在 emo中……`；三格分别是 `/archive/`、`/notes/`、`/now/` 链接；无硬编码 04/06 |
| H1b | 图例热区/焦点 | 320/390/1440 键盘 Tab | 每格热区高 ≥44px；hover/focus 变红；焦点框可见；不遮住相邻格 |
| H1c | 图案热区 | 1440/320 用 `elementFromPoint` 点三个图案中心 | 圆→`/archive/`、方→`/notes/`、三角→`/now/`；三个热区各占 SVG 1/3；不上 Tab 焦点（图例已可键盘） |
| H14 | 图例缺失态链接 | 0 碎碎念 / 无 now | 0 碎碎念格仍链 `/notes/`；now 缺失时第三格与第三个图案热区都不渲染；2 格布局正常 |
| H2 | 图例 0 碎碎念 | 删除 notes 夹具 | 碎碎念格 `00 · 暂无`；页边无 note-mini；now 行仍在 |
| H3 | 图例无 now | now 改草稿 | 图例只剩文章/碎碎念两格（`--2`）；无 now-line |
| H4 | opening | 检查最新文章 | 标题/摘要/日期(+time)/分钟/标签/阅读全文正确；链接到文章页 |
| H5 | 页边 3 条 | 3 条夹具 | 顺序与 `/notes/` 一致；锚点链接可跳；摘要剥离 Markdown；草稿不出现 |
| H6 | noteExcerpt | 首行含 `[链接](url)`、`**粗体**`、图片 | 摘要为纯文本，链接保留文字，无 `**`/`![`；超 60 字截断加 `……` |
| H7 | now 行 | now 单行 | 显示 `emo中……` + 看看 →；链接 `/now/` |
| H8 | 目录 | 4 文章 | 编号 01–04；日期/分钟/标签正确；整行可点、标签独立可点；无 Seal |
| H9 | 0 文章 | 临时空文章集合 | 隐藏 opening/contents；图例文章格 `00 · 暂无`；页边有内容时单列，否则 `.empty-state` |
| H10 | 链接门禁 | `npm run verify` | notes 锚点、now、文章、标签链接全部通过 check-dist |
| H11 | 删除回归 | grep + verify | 无 `Hero`/`PostList`/`.index`/`.hero` 引用残留；全站页面不回归 |
| H12 | h1/层级 | 检查 DOM | 首页 1 个 h1（品牌）；opening/页边/目录 h2；文章标题 h3 |
| H13 | 体积 | verify | CSS ≤18KB、JS 0、max HTML ≤30KB、dist ≤2.6MB；删除旧 CSS 后不增 |

## 5. 浏览器/视觉矩阵

生产子路径 `preview:prod`：

| 页面/状态 | 宽度 | 主题/状态 |
| --- | --- | --- |
| 首页（4 文章 + 3 碎碎念 + now） | 320 / 390 / 768 / 1024 / 1440 | 亮；390/1440 暗 |
| 首页（0 碎碎念） | 390 / 1440 | 亮 |
| 首页（无 now） | 390 / 1440 | 亮 |
| 首页（0 文章，临时） | 390 | 亮 |
| 首页无 JS + 系统暗色 | 390 | 暗 |
| 首页打印 | 390 | print |
| 对照设计稿 | 1440 / 390 | 与 `d1-home-*.webp` 对比，记录允许差异 |

每次检查：

- `scrollWidth <= innerWidth`；无元素越界。
- 图例在 320 不溢出（24rem 单列）；页边 40rem 单列；目录 meta 换行。
- 导航 4 项同一行；页脚顺序不变。
- 亮/暗 token 正确；无 JS 时深色入口②接管。
- 打印隐藏卷首 SVG/红点；文字可读。
- 焦点：页边/目录/标签链接键盘可达，焦点框可见。

## 6. 证据清单

- `npm run check`、`npm run verify` 完整输出。
- H1–H13 结果表。
- 浏览器矩阵 JSON + 截图，建议命名存 `p1c/screens/`：
  - `p1c-home-1440-light.webp`、`p1c-home-390-light.webp`、`p1c-home-1440-dark.webp`
  - `p1c-home-320-light.webp`
  - `p1c-home-no-notes-390-light.webp`、`p1c-home-no-now-390-light.webp`
  - `p1c-home-no-posts-390-light.webp`
  - `p1c-home-390-noscript-dark.webp`、`p1c-home-390-print.webp`
- 与设计稿差异记录：页边摘要截断、图例换行、目录无 Seal 等。
- 未覆盖风险：真机、读屏、第三方 RSS 不涉及首页但需声明。

## 7. 退出标准

1. `npm run check` 0/0；`npm run verify` PASS。
2. H1–H13 全部通过；空状态组合不出现空框/假计数。
3. 浏览器矩阵 0 失败；320/390 无横向滚动。
4. 首页计数与 `/archive/`、`/tags/`、RSS 同源；临时增删 note 后首页同步变化。
5. 旧首页组件/CSS 删除干净；全站无引用残留。
6. 体积在 P0 预算内。
7. 文档同步；用户本地试用确认后才 push/开 PR。

## 8. 已知不覆盖

- 真机 iOS/Android、读屏：P1e。
- 首页在 100+ 文章下的目录长度/性能：首版 4 篇验证。
- 卷首 SVG 在极端窄屏的视觉比例：允许差异，记录。

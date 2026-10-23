# P1a 复核记录

> 状态：已验收 · 2026-10-23（实现与本地验证完成；**宽度 A 已确认**；用户本地验收通过）
> 上游：`p1a/README.md`、`ui-foundation.md`、`check-dist-guards.md`、`test-plan.md`
> 证据：本文件 + `screens/`（生产子路径 `preview:prod` 截图）
> Owner：实现规划师

## 1. 完成范围

- Preflight：`check-dist` 的 F1（`data-id` 假 id）与 F2（canonical 只校验前缀）。
- Design foundation：`--mid/--wide/--ease/新 gutter`、`Base.astro` 的 `width` prop、4 项导航、页脚结构、`PageHead`、`.btn`、`.more`、`.page-head`、`.tag-index`、`.archive-*`、`.toc`、`about-lead`、reduced-motion 基础规则；标签/归档列表标题链接的整行点击热区（≥44px，P2 修复）。
- 页面：新增 `/archive/`；改版 `/tags/`、`/tags/[tag]/`；`/about/` 换壳；404 换壳。
- 数据：`getArchiveGroups()`、`getPostsByTag()`。
- PageHead：新增 `meta?: boolean`；归档/标签索引/标签详情按数据是否存在显式传值，0 文章/0 标签时不再留下空的 meta 横线。
- 404：`og:type/title/description/site_name` 也收进 `!is404`，产物不再有任何 OG/Twitter 卡片；`check-dist` 新增对应守卫（注入 `og:title` 会 FAIL）。
- 文档：README/AGENTS/TROUBLESHOOTING 同步；`tsconfig.json` 排除 `docs/`，让 `astro check` 不被设计工具脚本的提示污染；AGENTS 明确“标签详情 getStaticPaths 只生成已发布标签”是内容页规则的例外。

## 2. 验证命令与结果

### 2.1 类型检查

```text
npm run check
Result (24 files):
- 0 errors
- 0 warnings
- 0 hints
```

### 2.2 生产子路径 verify

```text
npm run verify
[check-dist] base=/xin-s-blog files=100
  artifacts  OK (5/5)
  links      OK (internal=245, anchors=15)
  drafts     OK (published=4)
  seo        OK (posts=4)
  rss/sitemap OK
  size       CSS 13.9/18.0 KB · JS 0.0/3.0 KB · fonts 1.37/1.50 MB · max HTML 20.2/30.0 KB · dist 1.6/2.6 MB
  inline JS  1.5 KB (theme script, not budgeted)
  result     PASS
[verify] PASS
```

### 2.3 F1/F2 故障注入

用最终 `dist` 的临时副本（`DIST_DIR` 指向副本，不改产物），旧脚本来自 `HEAD` 的 `check-dist.mjs`：

| 用例 | 旧门禁 | 新门禁 |
| --- | --- | --- |
| `data-id="nope"` + `href="#nope"` | `links OK (internal=246, anchors=16)`，**PASS（假阴性）** | `FAIL links ... 锚点 #nope 在 index.html 中找不到 id` |
| 文章 canonical 改成站点根 | `seo OK`，**PASS（假阴性）** | `FAIL seo ... 期望 .../posts/math-xor/，实际 .../` |
| 文章 canonical 缺尾斜杠 | — | `FAIL seo ... 期望 .../posts/math-xor/，实际 .../posts/math-xor` |
| 中文标签详情 canonical 指到 `/tags/` | — | `FAIL seo tags/算法/index.html ... 期望 .../tags/%E7%AE%97%E6%B3%95/，实际 .../tags/` |
| 未注入的最终 dist | PASS | `seo OK (posts=4)`，PASS |

实现：`idsIn()` 复用开始标签 + `attrsOf()`，只收集属性名严格等于 `id` 的值；canonical 对每个 `*/index.html` 目录式页面按 `relDist` 推导期望 URL（`encodeURI` 保留中文百分号编码），做精确比较；404 不参与；额外禁止 query/hash。sitemap 检查补上 `/archive/`。404 的 OG/Twitter 卡也已全部移除，并加门禁：临时副本的 `404.html` 注入 `og:title` → `FAIL seo 404.html 不应有 OG/Twitter 卡片`；未注入 PASS。

### 2.4 浏览器矩阵

生产子路径 `npm run preview:prod` 下跑 headless Chrome（CDP），7 个页面 × 5 个宽度（320/390/768/1024/1440） × 亮色，390/1440 加暗色，共 49 次；另加无 JS + 系统暗色、减少动效、打印 3 次。合计 **52 次，0 失败**。

每次检查：`scrollWidth === innerWidth`、无元素越界、h1 恰好 1 个、无重复 id、无缺失页内锚点、导航 4 项且同一行、页脚无 notes/now 链接、亮暗 token 正确、1440 下 measure 页 shell 内容宽 672px / mid 页 736px。

页面数据断言：

- `/archive/`：2026 年 10 月 1 篇 + 9 月 3 篇；全站编号 `01–04`；月份计数 `01/03`；≤640px 阅读时长列 `display:none`。
- `/tags/`：6 个标签，计数 `02/01/01/01/01/01`；算法最近一篇为 `连续四个整数的异或和性质`；≤640px“最近”列隐藏。
- `/tags/算法/`：h1 `#算法`，2 条 toc；canonical 精确匹配百分号编码 URL。
- `/about/`：`about-lead` 文案以“我是”开头，prose 三个 h2 不变；无 notes/now 链接。
- 404：`robots noindex`，无 canonical、无 OG/Twitter 卡片；`40[4]` 标记保留；不存在路径返回 HTTP 404。
- 无 JS + 系统暗色：`data-theme` 缺失时入口②生效，`--paper` 为 `#111214`，无横向溢出。
- 减少动效：`.theme-toggle` 的计算过渡时长为 `1e-05s`（0.01ms）。
- 打印：`--paper` 强制 `#ffffff`，主题开关与 skip link 为 `display:none`。

补充（2026-10-23，P2 修复后）：`/tags/` 与 `/archive/` 的标题链接原先只有文字大小（390 下分别约 27px / 26px 高），已改为整行 overlay：390 下 `elementFromPoint` 命中标签名/标题，1440 下标签索引“最近”链接仍独立命中自己的文章，归档行的 tag 链接仍优先于整行标题；320/390/1440 无横向溢出，列表行高未变。

补充（2026-10-23，P4 修复后）：`PageHead` 的 `meta` 现在由页面显式传入；用临时路由渲染“有 slot 但 `meta={false}`”的空状态，产物无 `page-head__meta` 容器；正常归档/标签页仍保留“04 篇 / 最近更新”行，关于页仍无 meta 行。

截图（`screens/`）：

- 改后：home 1440/390；archive 1440 light/dark、390、320；tags 1440/390；tag 1440；about 1440；404 390；post 1440。
- 改前对照：home 1440/390、post 1440/390（用 P1a 前的 dist 副本）。
- 特殊状态：archive 390 无 JS 暗色、tags 390 打印（暗色主题下仍白底）。

## 3. 允许的差异 / 与设计稿的偏差

1. **measure 页内容列宽 30rem → 42rem（宽度 A 已确认）**：旧 `.shell` 把 `max-width: 42rem` 当盒宽，1440 下扣掉两侧 6rem gutter 后正文只有 30rem；P1a 按 `design-contract.md` 把 token 当内容列宽（`max-width: calc(内容宽 + 2 × gutter)`），正文回到 42rem。可见变化不只文字列：首页 Hero/文章列表、文章正文/文章头都随壳内容宽变宽。2026-10-23 用户选择 **A：接受这个契约预期变化**，并在本地试用后确认通过。
2. 归档标题 h4 单独使用衬线（设计稿的 h4 全局衬线）；没有把 h4 并进全局 h1~h3，避免改动文章正文的 h4。
3. 标签索引排序按契约 `count desc → localeCompare(zh)`，实际顺序为算法、工具、其它、题解、Git、GitHub；设计原型的手写顺序是算法、题解、工具、Git、GitHub、其它，属于原型占位差异。
4. 关于页导语沿用原文的 `<strong>小鑫</strong>` 强调，设计原型无强调。
5. 归档页描述未放“标签”链接（`PageHead` 的 description 是字符串）；文案保留“可以去标签页”。

## 4. 未覆盖 / 风险

- 真机 iOS Safari / Android Chrome、读屏（NVDA/VoiceOver）未实测；P1e 计划覆盖。
- 打印只验证了 print 媒体下的 CSS 计算值与截图，未用实体打印机/PDF 阅读器逐页检查。
- F3（`srcset` 未检查）按契约不在本次做。
- `--wide` 只定义未启用；首页/文章切 wide 留到 P1c/P1d，届时需要重新跑全量视觉回归。
- `docs/next-phase/design/` 仍是设计参考，生产 CSS 没有 import 其中的 `base.css`。
- 用户已本地验收通过；P1a 分支的提交/推送按用户安排执行。

## 5. 结论

P1a 的壳、tokens、归档/标签/关于/404 与 F1/F2 门禁已按契约实现，`npm run verify` PASS，体积在 P0 预算内，浏览器矩阵 52/52 通过。用户 2026-10-23 本地验收“没什么问题”，P1a 标“已验收”；分支提交/推送按用户安排执行。

# P0 实施文档：内容基础层与质量门禁

> 状态：已验收 · 2026-10-23
> 上游：`docs/next-phase/implementation-plan.md` 的 P0；设计契约已批准
> 下游：P1a
> Owner：实现规划师
> 复核/证据：`review.md`（通过；两个 P2 边界项不阻塞 P1a）；当前命令/体积以根 README + verify 输出为准。
> 目标：为 P1a–P1e 提供统一数据层、草稿预览和生产子路径验证；**P0 不改变视觉**。

## 1. 为什么先做 P0

P0 之前，首页、文章页、标签页、RSS 各自 `getCollection` + 过滤 + 排序；草稿预览与 README 矛盾；本地 build 默认 `/`，不能代表线上 `/xin-s-blog/`。如果先做设计改版，后面每加一个路由/组件都会放大这些问题。P0 先把“内容怎么取、草稿怎么预览、产物怎么验”定死，P1 只改表现层。

## 2. 范围

### P0a · 内容数据层 + 草稿预览

- 新增 `src/lib/posts.ts`，集中发布过滤、排序、按 slug 查找、相邻文章、标签聚合。
- 首页/文章/标签/RSS 全部改用数据层，删除重复的 `getCollection` 逻辑。
- `draft: true` 在 dev 可打开、带“草稿预览”标记；build 不生成；首页/标签/RSS 始终排除草稿。
- 修正 README 关于草稿的失真描述。

### P0b · 生产子路径验证 + 体积门禁

- 新增 `scripts/check-dist.mjs`：检查子路径根绝对链接、内部链接/锚点、草稿泄漏、canonical/OG、RSS/sitemap、体积预算。
- 新增 `scripts/verify.mjs`：用 `BASE_PATH=/xin-s-blog/`、`SITE_URL=https://lucky-xiaoxin.github.io`、`TZ=Etc/UTC` 构建，再跑 `check-dist`。
- 新增 `scripts/preview.mjs`：用同款生产参数启动 `astro preview`，避免 verify 产物在默认 base `/` 下 404。
- `package.json` 增加 `check:dist` / `verify` / `preview:prod`。
- CI 的 build job 在 build 后加 `npm run check:dist`；PR 门禁与 main 发布共用。
- 记录基线预算，后续 P1 不得超。

## 3. 非目标（P0 明确不做）

- 不改首页/文章页/标签页/归档页的视觉；不新增 `/archive/` 页面（P1a）。
- 不做 TOC、H2 编号、代码标题栏、图注、相关文章（P1d）。
- 不做 notes/now collection 与页面（P1b）。
- 不做设计 tokens/宽壳/新导航（P1a）。
- 不做复制按钮、JSON-LD、OG 补全、打印/减少动效（P1d/P1e）。
- 不新增依赖、不新增运行时 JS、不引入第三方脚本。
- 不改任何文章内容。

## 4. 文件地图

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/lib/posts.ts` | 新增 | 唯一内容访问层 |
| `src/pages/index.astro` | 改 | 使用 `getPublishedPosts` |
| `src/pages/posts/[...slug].astro` | 改 | dev 草稿路径、按 slug 查找、相邻文章 |
| `src/pages/tags/index.astro` | 改 | 使用 `getAllTags` |
| `src/pages/tags/[tag].astro` | 改 | 使用 `getPublishedPosts` |
| `src/pages/rss.xml.js` | 改 | 使用 `getPublishedPosts` |
| `scripts/check-dist.mjs` | 新增 | 产物检查，Node 内置，无依赖 |
| `scripts/verify.mjs` | 新增 | 生产子路径构建 + check-dist |
| `scripts/preview.mjs` | 新增 | 用生产参数预览 verify 产物（`preview:prod`） |
| `package.json` | 改 | 增加 `check:dist` / `verify` / `preview:prod` |
| `.github/workflows/deploy.yml` | 改 | build 后跑 `check:dist` |
| `README.md` | 改 | 草稿行为、verify 用法 |
| `AGENTS.md` | 改 | 数据层/草稿/verify 约定 |
| `TROUBLESHOOTING.md` | 改 | 新增报错对照 |

## 5. 依赖与顺序

```
P0a 数据层 + 草稿预览
        │
        ▼
P0b verify + check-dist + CI
        │
        ▼
P1a design foundation
```

- P0a 与 P0b 可以同一分支分两个 commit，也可以拆两个 PR；**P0b 依赖 P0a**，因为 check-dist 要用数据层后的真实产物。
- P0b 合入后，P1a 的每个 PR 都必须先跑 `npm run verify`。

## 6. 验收（P0 整体）

1. `npm run check`：0 error / 0 warning。
2. `npm run verify`：通过；输出当前 CSS/JS/字体/HTML/dist 数值。
3. 子路径：`BASE_PATH=/xin-s-blog/` 构建后，HTML 站内链接/资源都带前缀；无根绝对 `/xxx`。check-dist 只自动扫 HTML `href/src`，CSS `url()`/`srcset` 需预览确认。
4. 草稿：dev 能打开 `/posts/<draft>/` 并显示标记；build 的 `dist/posts/<draft>/` 不存在；首页/标签/RSS/sitemap 不含草稿。
5. 数据层：`getCollection` 的发布过滤/排序只出现在 `src/lib/posts.ts`（grep 可验证）；各页面/RSS 行为与改前一致。
6. 链接/锚点：`check-dist` 能发现故意注入的坏链/根绝对链接/草稿泄漏（测试方法见 `test-plan.md`）。
7. 体积：CSS gzip ≤18KB、站内 JS ≤3KB、字体 ≤1.5MB、最大 HTML ≤30KB、dist ≤2.6MB；不高于改前基线。
8. 视觉：除 dev 草稿标记外，现有页面截图与改前一致；无 CSS/JS 行为变化。
9. 文档：README/AGENTS/TROUBLESHOOTING 与实际行为一致。
10. 回滚：revert P0 merge commit；无数据迁移、无外部状态。

## 7. 主要风险

| 风险 | 对策 |
| --- | --- |
| dev 草稿页生成后，文章页仍用“已发布列表”查找 → `post` 为 undefined | 文章页查找/相邻文章显式传 `includeDrafts: import.meta.env.DEV` |
| `getStaticPaths` 在 build 误带草稿 | 只用 `getPostsForStaticPaths()`；build 验收检查 dist 无草稿 |
| `check-dist` 误报外部链接/协议链接 | 明确跳过 `http(s):`、`mailto:`、`tel:`、`data:`、`//`、`#`；allowlist 可扩展 |
| 子路径映射把 URL 编码/尾斜杠判错 | 先 decodeURIComponent，再按 `dir/index.html` → `path.html` 顺序解析；用真实中文标签测试 |
| 体积预算把字体/HTML 算错 | 明确 gzip/raw 口径；输出当前值/上限，失败可定位 |
| CI 多跑一次检查导致时间变长 | 只在 build 后跑 check-dist，不重复 build；timeout 15 分钟已有余量 |
| 本地 verify 与 CI 环境不同 | verify 显式设置 `TZ=Etc/UTC`、`SITE_URL`、`BASE_PATH`，与 deploy.yml 对齐 |
| 为了草稿预览改坏 build | dev 分支只在 `import.meta.env.DEV` 生效；build 测试必须覆盖 |

## 8. 文档索引

- `data-and-draft.md`：`src/lib/posts.ts` API、调用点、草稿预览行为、边界。
- `verify.md`：`verify.mjs` / `check-dist.mjs` 的检查项、预算、输出、CI 接入。
- `test-plan.md`：测试矩阵、临时 fixture、故障注入、证据清单。

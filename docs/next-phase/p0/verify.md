# P0b 契约：`verify` 与产物检查

> 状态：已验收 · 2026-10-23（P0b 已实现；复核见 `review.md`）。本文定义脚本行为、检查项、预算与 CI 接入；当前命令/基线以根 README 为准。

## 1. 目标

- 一条命令在**生产子路径**下构建并验证产物，提前发现“本地 `/` 好、线上 `/xin-s-blog/` 404”。
- 把草稿泄漏、坏链、缺 canonical/OG、产物超预算变成机器可判定的失败。
- 不新增依赖；只用 Node 内置模块（`fs`、`path`、`zlib`、`child_process`）。

## 2. 命令与文件

| 命令/文件 | 作用 |
| --- | --- |
| `npm run check:dist` | 只检查已有 `dist`（CI build 后使用；单独运行时默认 base=/） |
| `npm run verify` | `check` + 生产子路径 build + `check-dist`（本地使用） |
| `npm run preview:prod` | 用生产参数预览 verify 产物（不参与 CI） |
| `scripts/check-dist.mjs` | 产物检查；可读 `DIST_DIR`/`BASE_PATH`/`SITE_URL` |
| `scripts/verify.mjs` | 设置环境、串行执行 check/build/check-dist |
| `scripts/preview.mjs` | 设置生产环境并启动 `astro preview` |
| `.github/workflows/deploy.yml` | build job 在 build 后跑 `npm run check:dist` |

### 环境

`verify` 必须显式设置（允许被外部 env 覆盖）：

- `TZ=Etc/UTC`（与 CI 一致，避免日期差一天）
- `SITE_URL=https://lucky-xiaoxin.github.io`
- `BASE_PATH=/xin-s-blog`
- `DIST_DIR=dist`（check-dist）
- 运行 `npm run build` 时，`prebuild` 会跑字体子集；不要跳过。

`check:dist` 单独运行时默认 `BASE_PATH=/`（与普通 build 一致）；生产子路径由 `verify`/CI 显式传入。

### 跨平台

- Windows 使用 `npm.cmd`，其它平台 `npm`；或 `shell: true` 并只传命令字符串。
- 子进程 `stdio: 'inherit'`，保留颜色/输出；失败时返回码透传。
- `verify` 任一步失败立即退出，不继续跑 check-dist。

## 3. `check-dist` 检查项

### 3.1 必需产物

- `dist/index.html`
- `dist/404.html`（Astro 固定扁平 404）
- `dist/rss.xml`
- `dist/sitemap-index.xml`
- `dist/sitemap-0.xml`

缺失 → 失败并列出缺哪个。

### 3.2 子路径与根绝对链接

扫描 `dist` 下所有 `.html`：

- 提取 `href="..."` / `src="..."`（属性名大小写不敏感；单双引号均可）。
- 跳过：
  - `http:` / `https:` / `mailto:` / `tel:` / `data:` / `blob:` / `javascript:`
  - `//` 开头（协议相对）
  - 纯 `#...`
  - 空字符串
- 站内根绝对路径（以 `/` 开头）必须带 `BASE_PATH` 前缀（P0 为 `/xin-s-blog`）：
  - `/xin-s-blog/...` 通过；
  - `/`、`/_astro/...`、`/posts/...`、`/tags/...` 等不带前缀 → 失败，打印文件 + 属性值。
- 允许 `BASE_PATH` 精确等于 `/xin-s-blog`（无尾斜杠）作为站点根；也允许 `/xin-s-blog/`。
- `BASE_PATH=/` 时（本地特殊测试）跳过前缀要求；`verify` 不使用 `/`。

### 3.3 内部链接/锚点可解析

对每个站内链接：

1. 去 query、去 hash；`decodeURIComponent`。
2. 去掉 `BASE_PATH` 前缀，得到站内路径。
3. 映射到 `dist` 文件：
   - `/` → `dist/index.html`
   - 以 `/` 结尾 → `dist/<path>/index.html`
   - 有扩展名 → `dist/<path>`
   - 无扩展名 → 先试 `dist/<path>/index.html`，再试 `dist/<path>.html`
4. 目标不存在 → 失败（文件 + 属性值 + 解析后的路径）。
5. 有 hash：
   - 读取目标 HTML，检查 `id="<hash>"`（同时接受原始与 decode 后的值；HTML 实体先解码）。
   - 同页 `#hash` 也在当前 HTML 查 id。
   - 找不到 → 失败（文件 + `#hash`）。
6. 纯 `#` 跳过。

注意：

- 中文标签 URL 是百分号编码；必须 decode 后再映射。
- Astro `trailingSlash: 'always'` 下目录索引；不要假设 `.html` 直接存在。
- 不要检查 `<link rel="canonical">`/`og:image` 这类绝对 URL 的内部性；它们是外链。
- 可选：扫描 CSS 中 `url(...)` 的资源是否存在（字体/图片）；P0 可做但不作为主失败项。

### 3.4 草稿泄漏

- 读取 `src/content/posts/**/*.md`（P0 无子目录，但按递归写）。
- 用简单 frontmatter 正则找 `draft: true`（大小写不敏感，允许引号/空格）；slug = 相对路径去 `.md`，统一 `/`。
- 检查：
  - `dist/posts/<slug>/index.html` 不存在；
  - `dist/rss.xml` 不包含该草稿 URL（标题子串不作判据，避免常见词误报）；
  - `dist/sitemap-0.xml` 不包含该 slug；
  - `dist/index.html`/标签页不包含该草稿 URL（标题子串不作判据）。
- 若 build 后仍有草稿页 → 失败，打印 slug + 源文件。
- `draft: false`/缺省不算草稿。

### 3.5 canonical / OG

对每个 `dist/posts/**/index.html`：

- 有 `<link rel="canonical" href="...">`；
- canonical 是绝对 URL，包含 `SITE_URL + BASE_PATH`；
- 有 `og:title`、`og:description`、`og:image`；
- 有 `<title>` 和 `meta name="description"`。

对 `dist/404.html`：

- 有 `<meta name="robots" content="noindex">`；
- **没有** canonical / `og:url`（避免指向死地址）。

### 3.6 RSS / sitemap

- `rss.xml`：存在 XML 声明/`<rss`/`<channel>`；至少包含所有已发布文章的链接；不含草稿。
- `sitemap-index.xml` 存在；`sitemap-0.xml` 存在。
- sitemap 包含 `SITE_URL + BASE_PATH`；包含所有已发布文章、`/tags/`、`/about/` 等实际生成的页面；不含 `/404/`。
- 不做完整 XML 解析（避免依赖）；字符串/正则检查足够，不承诺 XML schema 校验。

### 3.7 体积预算

口径：

| 指标 | 口径 | 当前基线（2026-10-23） | 上限 |
| --- | --- | --- | --- |
| CSS | 所有 `.css` **gzip** 总和 | 13.0 KB | 18 KB |
| JS | 所有 `.js` **gzip** 总和；内联主题脚本单独报告，不计入失败（P0） | 0 KB | 3 KB |
| 字体 | `.woff2/.woff/.ttf` 原始大小总和 | 1.36 MB | 1.5 MB |
| 最大 HTML | 单个 `.html` 原始大小最大值 | 20.1 KB | 30 KB |
| `dist` | 全部文件原始大小总和（P0 无内容图） | 1.5 MB | 2.6 MB |

- 用 `zlib.gzipSync` 计算 gzip，不要在数值里混用 KB/MB；输出统一 KB 或 MB，保留 1 位小数。
- 超限 → 失败，打印“当前 / 上限 / 超出”。
- 字体/HTML/dist 用字节，避免浮点误差。
- P1 加入设计 CSS/notes/now 后，重新评估上限；P0 不改预算。

### 3.8 输出

成功时打印简短表格：

```
[check-dist] base=/xin-s-blog files=NN
  artifacts  OK (5/5)
  links      OK (internal=NN, anchors=NN)
  drafts     OK (published=NN)
  seo        OK (posts=NN)
  rss/sitemap OK
  size       CSS 13.0/18.0 KB · JS 0.0/3.0 KB · fonts 1.36/1.50 MB · max HTML 20.1/30.0 KB · dist 1.5/2.6 MB
  inline JS  1.5 KB (theme script, not budgeted)
  result     PASS
```

数字随内容增长，以实际输出为准。

失败时：

- 逐条打印 `FAIL <check> <file> <detail>`；
- 最后打印失败数量；
- `process.exitCode = 1`。

### 3.9 可测试性

- `check-dist` 读取 `DIST_DIR` 环境变量，默认 `dist`；测试时把 dist 复制到临时目录并注入故障，避免污染真实产物。
- `BASE_PATH` 可覆盖；P0 测试用 `/xin-s-blog`。
- 不在检查脚本里执行 build；只读。

## 4. CI 接入

在 `.github/workflows/deploy.yml` 的 build job：

```
- name: Check dist
  run: npm run check:dist
```

位置：`npm run build` 之后、`configure-pages`/`upload-pages-artifact` 之前。PR 和 main 都跑；失败不发布。

- 不把 `verify` 放进 CI（会重复 build）；CI 已有 build，直接 check-dist。
- 保持现有 `permissions`、`timeout`、`concurrency` 不变。
- PR 门禁和 main 部署共用 build job；不要新增 deploy 权限给 build。

## 5. 文档同步

- README 本地开发部分增加 `npm run verify` 的说明与预算表。
- AGENTS 增补：新增路由/资源必须过 verify；不要引入根绝对链接；字体/图片放对目录。
- TROUBLESHOOTING 增加：
  - “verify 报 root-absolute link” → 用 `u()`；
  - “verify 报 draft leak” → 检查 frontmatter/`getStaticPaths`；
  - “verify 报 size” → 看输出哪一项，不要直接抬上限；
  - “verify 报 missing anchor” → 检查标题 id/TOC 链接。

## 6. 非目标

- 不做完整 HTML/XML schema 校验；
- 不做外链可用性检查（P2 单独做）；
- 不做 Lighthouse/视觉回归（P1e/P2）；
- 不做图片尺寸/alt 检查（P1d/P1e）；
- 不自动修复，只报告。

## 7. 验收

- 在干净 build 上 PASS，输出数值与基线一致。
- 故意注入以下故障，均能 FAIL 并定位：
  1. 根绝对链接 `/nope/`；
  2. 不存在的内部链接 `/posts/nope/`；
  3. 不存在的锚点 `#nope`；
  4. 把草稿 HTML 放进 `dist/posts/<draft>/`；
  5. 删除一个文章页的 canonical；
  6. 删除 `rss.xml` 或 sitemap；
  7. 把 CSS/字体/HTML 人为增大超限（在临时 dist 副本里）。
- CI 的 PR 构建在 check-dist 失败时阻断合并；main 失败不发布。

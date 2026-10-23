# P0 独立复核记录

> 状态：已验收 · 2026-10-23
> 上游：P0 实现（main）；下游：P1a；Owner：复核者
> 复核者只读代码、跑命令、做临时故障注入；没有修改 P0 代码。
> 结论：**P0 通过，无阻塞项。** 两个 `check-dist` 边界问题作为 P2 跟进，不挡 P1a。

## 1. 复核范围

- 提交：`11de8f7`（数据层/草稿）、`9f29296`（verify/check-dist）、`87538e2`（误报修复/preview）、`f29f8cb`（文档）。
- 文件：`src/lib/posts.ts`、`src/pages/**`、`scripts/verify.mjs`、`scripts/check-dist.mjs`、`scripts/preview.mjs`、workflow、README/AGENTS/TROUBLESHOOTING。
- 方法：读代码 + `npm run verify` + 临时草稿 dev/build 实测 + 临时 dist 故障注入；测试后清理。

## 2. 实测结果

### 2.1 门禁

`npm run verify` 通过：

```
[check-dist] base=/xin-s-blog files=99
  artifacts  OK (5/5)
  links      OK (internal=209, anchors=14)
  drafts     OK (published=4)
  seo        OK (posts=4)
  rss/sitemap OK
  size       CSS 13.0/18.0 KB · JS 0.0/3.0 KB · fonts 1.36/1.50 MB · max HTML 20.1/30.0 KB · dist 1.5/2.6 MB
  inline JS  1.5 KB (theme script, not budgeted)
  result     PASS
```

### 2.2 草稿 dev 预览

临时草稿 `__p0-dev-check.md`（`draft: true`）：

- `/posts/__p0-dev-check/`：200；页面含“草稿预览”。
- 首页：不出现草稿标题。
- `/rss.xml`：不出现草稿 slug。
- 测试后删除临时文件。

### 2.3 草稿 build 排除

临时草稿 `__p0-build-check.md` 存在时跑 `npm run verify`：

- `dist/posts/__p0-build-check/index.html` 不存在。
- `rss.xml` / `sitemap-0.xml` 不含草稿。
- `check-dist` 的 drafts 检查 OK。
- 测试后删除临时文件。

### 2.4 故障注入（临时 dist 副本）

| 注入 | 结果 |
| --- | --- |
| 根绝对链接 `href="/nope/"` | `check-dist` FAIL，定位 `index.html` + 缺少 base 前缀 |
| 内部链接到不存在页面 | 可被 links 检查捕获（同类逻辑） |
| 缺失锚点 `href="#nope"` | FAIL，提示找不到 id |
| 删除文章 canonical | FAIL seo |
| 随机 40KB CSS | FAIL size，CSS 52.1/18.0 KB |
| 草稿页放进 dist | FAIL drafts，打印 slug + 源文件 |
| 删除 rss/sitemap | 必需产物/检查会失败（契约项） |

## 3. 发现（不阻塞 P1a）

### F1 · `idsIn` 会把 `data-id` 当成 `id`（P2）

> 已修（2026-10-23，P1a preflight）：`idsIn()` 改为解析开始标签 + `attrsOf()`，只收集属性名严格等于 `id` 的值；注入证据见 `p1a/review.md` §2.3。

`scripts/check-dist.mjs` 的 `idsIn()` 用 `\bid\s*=` 匹配 id。`data-id="nope"` 也会命中，导致 `<a href="#nope">` 被误判为有效锚点。

实测：在临时 dist 的 `index.html` 注入 `<div data-id="nope"></div><a href="#nope">`，`check-dist` 的 links 仍 PASS。

影响：未来组件使用 `data-id` 时，可能放过坏锚点。当前站点没有 `data-id`，不影响 P0。

建议修法：复用 `attrsOf()` 解析每个标签，只在属性名严格等于 `id` 时收集；或正则改为 `(?:^|\s)id\s*=`。放在 P1d（TOC/锚点变多）之前或 P1e 一起做。

### F2 · canonical 只校验前缀，不校验页面（P2）

> 已修（2026-10-23，P1a preflight）：每个 `*/index.html` 按路径推导期望 URL 做精确比较（404 除外），中文标签页按百分号编码匹配；注入证据见 `p1a/review.md` §2.3。

`check-dist` 目前只要求 canonical 以 `SITE_ROOT` 开头。实测把 `math-xor` 的 canonical 改成站点根 `https://lucky-xiaoxin.github.io/xin-s-blog/`，仍然 PASS。

影响：canonical 指错页面时不会被门禁发现。

建议修法：从 `relDist(file)` 推导期望 URL（`posts/<slug>/index.html` → `SITE_ROOT + posts/<slug>/`），与 canonical 做精确比较。放在 P1e（SEO 补全）一起做。

### F3 · `srcset` 未检查（P2）

`linkAttrs()` 只取 `href`/`src`。以后接入真实配图，`srcset` 里的资源路径不会被 check-dist 检查。P1d/P1e 引入图片时评估；当前 P0 无图片，不影响。

## 4. 未覆盖

- `npm run preview:prod` 的浏览器实际访问：脚本存在，但本次未启动浏览器验证。
- 真机/读屏：P0 无视觉变化，不在 P0 验收范围。
- F3（`srcset` 未检查）仍未覆盖；P1d/P1e 引入真实配图时再评估。
- 外链可用性、Lighthouse、视觉回归：P2/P1e。

## 5. 结论

- 数据层收口、草稿 dev/build 行为、生产子路径 verify、故障检测均按契约工作。
- P0 可以作为 P1a 的基础；F1/F2 已在 P1a preflight 修复，F3 留待图片阶段。
- 下一步：P1a design foundation（已实现，见 `p1a/review.md`）。

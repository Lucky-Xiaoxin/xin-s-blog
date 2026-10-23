# P1a Preflight：`check-dist` 两个假阴性修复

> 状态：实施中 · 2026-10-23（F1/F2 已修，验证待用户试用确认）
> 上游：`p0/review.md` F1/F2
> 下游：P1a 归档/标签/404 新增链接与页面；P1d TOC/锚点
> Owner：实现规划师
> 复核/证据：`review.md` §2.3（注入前后对照）

P1a 会新增 `/archive/`、标签详情、404 等页面和链接；在扩大 check-dist 的覆盖面之前，先修掉两个已知假阴性。**建议单独一个小 PR `fix/check-dist-guards`，不混 UI。**

## 1. F1：`data-id` 被当成 `id`

### 现状

`scripts/check-dist.mjs` 的 `idsIn()` 用：

```js
/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
```

`data-id="nope"` 也会匹配，导致 `<a href="#nope">` 被误判为有效锚点。

### 实测

临时 dist 注入：

```html
<div data-id="nope"></div>
<a href="#nope">bad</a>
```

`check-dist` 的 links 仍 PASS —— 假阴性。

### 契约

- 只收集**属性名严格等于 `id`** 的值。
- 推荐复用 `attrsOf(tag)`：遍历开始标签，检查 `Object.hasOwn(attrs, 'id')`；不要再用 `\bid` 正则。
- 保留 HTML 实体解码；`id` 值里的 `&amp;` 等仍要 decode 后再比较。
- 不把 `name` 当 `id`；不把 `data-id` 当 `id`。

### 验收

- 注入 `data-id="nope"` + `href="#nope"` → links FAIL（找不到 id）。
- 正常 `id="nope"` + `href="#nope"` → links PASS。
- 现有 `internal=209, anchors=14` 基线不下降；不产生新误报。

## 2. F2：canonical 只校验前缀

### 现状

`check-dist` 只检查：

```js
canonical.startsWith(SITE_ROOT)
```

把 `posts/math-xor/index.html` 的 canonical 改成站点根 `https://lucky-xiaoxin.github.io/xin-s-blog/`，仍然 PASS。

### 契约

- 对每个 `posts/**/index.html`，从文件路径推导期望 URL：
  - `posts/math-xor/index.html` → `SITE_ROOT + posts/math-xor/`
  - 嵌套 slug 同理，保留 `/` 分段。
- 将 canonical 与期望值做**精确比较**（统一去掉末尾多余 `/` 再比，或统一补 `/`；二选一，测试固定）。
- 仍要求：
  - canonical 存在；
  - 是绝对 URL；
  - 以 `SITE_URL + BASE_PATH` 开头（保留现有断言作为额外保护）；
  - 不含 query/hash（可加）。
- 不要求非文章页的 canonical（P1a 可顺手加 `/archive/`、`/tags/`、`/about/` 的精确检查；若加，必须覆盖所有实际生成页面，包括标签详情）。
- 404 仍不生成 canonical。

### 验收

- 正确 canonical → PASS。
- 把某文章 canonical 改成站点根 / 另一篇文章 / 缺尾斜杠 → FAIL。
- 中文标签详情若加 canonical 检查，编码/解码后精确匹配。
- 现有 4 篇文章 PASS。

## 3. F3（记录，不在本次做）

`linkAttrs()` 目前只取 `href`/`src`，不检查 `srcset`。P1d/P1e 引入真实配图时再评估；本次不改。

## 4. 测试方法

用临时 dist 副本，避免污染产物：

1. 复制 `dist` 到临时目录。
2. 用 Node 修改 HTML（注入 data-id / 改 canonical）。
3. 以 Node 包装器设置 `DIST_DIR`、`BASE_PATH=/xin-s-blog`、`SITE_URL` 后 import/执行 `check-dist.mjs`（Git Bash 下不要直接 `BASE_PATH=/xin-s-blog`，会被 MSYS 改写；用 Node 内设置或 `MSYS2_ENV_CONV_EXCL`）。
4. 断言退出码/输出；清理临时目录。

## 5. 不做

- 不改体积预算。
- 不引入 HTML/XML 解析依赖。
- 不做完整 schema 校验。
- 不改 CI 流程；`npm run check:dist` 仍由 build job 调用。

## 6. 交付

- `scripts/check-dist.mjs` 小改。
- `p0/review.md` 的 F1/F2 标记为已修（或新增 `p1a/review.md` 记录）。
- 在 PR 正文附上“修复前 FAIL/PASS、修复后 PASS/FAIL”的注入证据。
- 不合并进 UI PR 时，单独 `fix/check-dist-guards` 分支；合并后再开 P1a UI 分支。

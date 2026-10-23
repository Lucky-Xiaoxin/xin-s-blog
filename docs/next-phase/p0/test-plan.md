# P0 测试计划与证据清单

> 状态：已验收 · 2026-10-23（P0 测试已执行，T5–T11 已在临时 dist 上做过；复核见 `review.md`）。

## 1. 测试矩阵

| 编号 | 测什么 | 方法 | 预期 |
| --- | --- | --- | --- |
| T1 | 数据层行为不变 | 改前/改后对比首页/标签/RSS/上下篇 | 4 篇文章顺序、标签计数、RSS 条目、上下篇一致 |
| T2 | dev 草稿预览 | 临时草稿文件 + `npm run dev` | `/posts/<draft>/` 200；显示“草稿预览”；首页/标签/RSS 不含 |
| T3 | build 排除草稿 | `npm run verify` / build | `dist/posts/<draft>/` 不存在；rss/sitemap 不含 |
| T4 | 生产子路径 | `npm run verify` | HTML 站内链接/资源带 `/xin-s-blog/`；无根绝对 `/...` |
| T5 | 坏链检测 | 临时 dist 副本注入 `/posts/nope/` | `check-dist` 失败，定位文件+链接 |
| T6 | 根绝对链接检测 | 临时 dist 副本注入 `href="/nope/"` | 失败，提示加 base |
| T7 | 锚点检测 | 临时 dist 副本注入 `href="#nope"` | 失败，提示缺 id |
| T8 | 草稿泄漏检测 | 临时 dist 副本放入草稿页 | 失败，打印 slug/源文件 |
| T9 | canonical/OG | 删除临时副本某文章 canonical | 失败 |
| T10 | RSS/sitemap | 删除临时副本 `rss.xml` / sitemap | 失败 |
| T11 | 体积预算 | 临时副本放大 CSS/HTML | 失败，打印当前/上限 |
| T12 | 视觉无回归 | 改前/改后截图对比（首页/文章/标签/404） | 除 dev 草稿标记外无差异 |
| T13 | 无新增 JS | 检查 dist | 无 `.js` 产物；主题仍内联 |
| T14 | CI 门禁 | PR 触发 build | `check-dist` 失败阻断；main 失败不发布 |
| T15 | 帮助文档 | README/AGENTS/TROUBLESHOOTING | 断言与行为一致 |

## 2. 测试前置

- 分支：`feat/content-foundation`（P0a）、`ci/verify-dist`（P0b）；按实际拆分支。
- 工作区干净；`npm ci` 已安装。
- Node 20.3+/22+。
- 不修改现有文章；临时草稿/临时 dist 在测试后删除。
- 截图基线：改前在 1440/390 截首页/文章/标签/404，存到临时目录（不要提交大图）。

## 3. 具体步骤

### T1 数据层行为不变

1. 改前记录：
   - 首页文章顺序（4 篇）；
   - `/tags/` 每个 tag 的计数；
   - `/rss.xml` 的 item 标题/日期；
   - 文章页上下篇标题。
2. 改后重复；逐项对比。
3. 预期：完全一致；只有 dev 草稿页是新增。

### T2 dev 草稿预览

1. 新建 `src/content/posts/__p0-draft-preview-test.md`：

```yaml
---
title: 'P0 草稿预览测试'
description: '临时文件，测试后删除'
pubDate: 2026-10-22
tags: ['其它']
draft: true
---
草稿正文。
```

2. `npm run dev`，打开 `http://localhost:4321/posts/__p0-draft-preview-test/`。
3. 检查：
   - 200；标题正确；有“草稿预览”标记；
   - 首页不出现；
   - `/tags/` 不增加计数；
   - `/rss.xml` 不出现；
   - 标签页不出现。
4. 删除临时文件；重启 dev 或等热更新。

### T3 build 排除草稿

1. 同 T2 建临时草稿。
2. `npm run verify`。
3. 检查：
   - `dist/posts/__p0-draft-preview-test/index.html` 不存在；
   - `dist/rss.xml` / `sitemap-0.xml` 不含该 slug/标题；
   - `check-dist` 的 drafts 检查 PASS。
4. 删除临时文件，再跑一次 verify 确认 PASS。

### T4 生产子路径

1. `npm run verify`。
2. 检查 `dist/index.html` 的 CSS/JS/导航链接：
   - 应为 `/xin-s-blog/_astro/...`、`/xin-s-blog/posts/...`、`/xin-s-blog/tags/...`；
   - 不应出现 `/_astro/...`、`/posts/...`。
3. `npm run preview:prod`，访问 `http://localhost:4321/xin-s-blog/`；点导航/文章/标签/RSS。
4. 检查 `robots.txt` 的 sitemap 地址指向 `/xin-s-blog/sitemap-index.xml`。
5. 预期：全部 200；无 404。

### T5–T8 故障注入

1. 把 `dist` 复制到临时目录（如 `%TEMP%/p0-dist-test` 或 `/tmp/p0-dist-test`）。
2. 注入故障：
   - T5：在 `index.html` 加 `<a href="/xin-s-blog/posts/nope/">坏链</a>`；
   - T6：加 `<a href="/nope/">根绝对</a>`；
   - T7：加 `<a href="#nope">锚点</a>`；
   - T8：把 T2 草稿 HTML 复制到 `posts/__p0-draft-preview-test/index.html`。
3. 运行 `DIST_DIR=<临时目录> BASE_PATH=/xin-s-blog node scripts/check-dist.mjs`。
4. 预期：退出码 1；输出对应 FAIL；不改真实 dist。
5. 清理临时目录。

### T9–T11 产物完整性/预算

1. 复制 dist 到临时目录。
2. T9：删除某文章页的 `<link rel="canonical">`；check-dist 失败。
3. T10：删除 `rss.xml` / `sitemap-index.xml`；失败。
4. T11：复制一份大文件/追加重复 CSS 使 CSS gzip 超 18KB；失败，打印当前/上限。
5. 清理。

### T12 视觉无回归

1. 改前：1440/390 截首页、文章（math-xor）、标签、404；亮色即可（P0 不改 CSS）。
2. 改后：同视口/同主题截图。
3. 对比：除 dev 草稿页外，允许 0 像素差异；若有差异，说明原因（字体加载/滚动条）并记录。
4. P0 不应新增设计样式；如果出现按钮/颜色/间距变化，视为越界。

### T13 无新增 JS

- `find dist -name '*.js'` 应为 0（当前无独立 JS）。
- `dist/index.html` 仍有主题内联脚本；`aria-checked`/`data-theme` 行为不变。
- 若新增 JS，P0 失败（复制按钮属于 P1）。

### T14 CI

- 推 PR 后，build job 依次：install → check → build → check-dist。
- 故意在分支里制造坏链（或依赖 T5 的本地验证），确认 PR 失败；恢复后再跑。
- main 合并后 deploy 只在 build 成功后执行；check-dist 失败不发布。
- 不改 workflow 权限/并发。

### T15 文档

- README：草稿预览说明与 `npm run verify` 用法；
- AGENTS：数据层唯一入口、dev/build 草稿、verify 门槛；
- TROUBLESHOOTING：新报错对照（root-absolute、draft leak、size、missing anchor）。
- 逐条核对，不写未验证的断言。

## 4. 证据清单（PR 正文附）

- [ ] `npm run check` 输出（0 error / 0 warning）。
- [ ] `npm run verify` 成功输出（含体积表）。
- [ ] T2 dev 草稿页截图（可见标记）。
- [ ] T3 `dist` 无草稿的 `find`/`ls` 输出。
- [ ] T5–T11 至少各一条失败输出（证明检查有效）。
- [ ] T12 改前/改后截图对比（首页/文章/标签/404）。
- [ ] `git diff --stat`（只应包含 P0 文件）。
- [ ] CI PR run 链接/截图（check-dist 步骤）。
- [ ] 未覆盖风险列表。

## 5. 退出标准

- 所有 T1–T15 通过，或未通过项有明确说明/用户接受。
- 没有临时测试文件/临时 dist 残留。
- 代码只包含 P0 范围；没有视觉改版、没有 notes/now、没有新依赖/JS。
- 文档与实际行为一致。
- 用户本地确认后，才 push/开 PR。

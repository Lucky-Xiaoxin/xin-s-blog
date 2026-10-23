# P1b 门禁：`check-dist` 新增检查

> 状态：实施中 · 2026-10-23（P1b 门禁已按此实现并跑完注入，待用户本地试用确认）
> 上游：`p0/verify.md`、`p1a/check-dist-guards.md`（F1/F2 已修）、`p1b/content-model.md`、`p1b/pages-and-feed.md`
> 下游：`npm run verify`、CI build job
> Owner：实现规划师
> 复核/证据：`review.md` §3.3（G1–G11 注入表）

P0/P1a 的 `check-dist` 已覆盖：必需产物、站内链接/锚点、文章草稿泄漏、目录式 canonical 精确匹配、文章 OG、404 noindex/无 OG、RSS/sitemap、体积。P1b 要把 notes/now 纳入同一套门禁，**不引入 XML/HTML 重依赖**，继续用现有 `startTags`/`attrsOf`/正则。

## 1. 必需产物

`REQUIRED` 增加：

```text
notes/index.html
notes/rss.xml
now/index.html
```

- 输出行改为动态计数：`artifacts OK (8/8)`，不要再硬编码 `5/5`。
- 不把 `/notes/#...` 或 `/notes/rss.xml` 当 HTML 页面；前者不是产物，后者只检查文件存在/内容。
- 如果 `/now/` 是空状态，`now/index.html` 仍必须存在（路由静态生成）。

## 2. notes/pages 源扫描

新增常量：

```js
const NOTES_DIR = path.join(ROOT, 'src', 'content', 'notes');
const PAGES_DIR = path.join(ROOT, 'src', 'content', 'pages');
```

### 2.1 notes

- 只收**顶层** `*.md`，与 `glob({ pattern: '*.md' })` 一致；子目录里的 `.md` 不算 note。
- 跳过 `_` 前缀文件（模板）。
- 每条记录：
  - `id`：文件名去 `.md`（`YYYY-MM-DD-slug`）；
  - `draft`：frontmatter `draft: true`（沿用现有正则）；
  - `source`：仓库相对路径，用于报错。
- 断言 `id` 匹配 `^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$`；不匹配直接 `fail('drafts', source, '碎碎念文件名非法')`，避免后续锚点检查出现奇怪字符串。

### 2.2  now

- 读取 `src/content/pages/now.md`（不存在则 `fail('drafts', 'src/content/pages/now.md', 'now.md 缺失')`）。
- 记录 `draft` 布尔；不需要解析正文。
- 其它 `pages/*.md` 首版不参与门禁（以后 about 迁移再扩展）。

## 3. 草稿泄漏

现有文章泄漏检查保留；新增两条。

### 3.1 notes

- 目标文件：所有 HTML + `dist/rss.xml` + `dist/notes/rss.xml` + `dist/sitemap-0.xml`（`leakTargets` 扩展）。
- 对每条 **draft** note，检查：
  - HTML 中不得出现 `id="n-<id>"`（精确属性）；
  - HTML/XML 中不得出现 `#n-<id>`（锚点链接）。
- 报错示例：`dist/notes/index.html 包含草稿 note 2026-10-20-wip 的锚点`。
- 不按正文子串判定（正文可能被用户复制到别处，容易误报）；锚点是唯一 URL 标识。

### 3.2 now

- 若 `now.md` 为 draft：
  - `dist/now/index.html` 不得含 `now-status` 类；
  - 不得含 `now-body` 类；
  - （可选）不得含 `updatedDate` 渲染出的 `YYYY.MM.DD` 字符串——但该字符串可能出现在页脚年份等位置，**不作为主判据**。
- 用 `startTags` + `attrsOf` 解析 `class` token，不要只做全文 `includes('now-status')`（避免正文/代码误报）。
- 首版已发布的 now 正文为空，本来就**没有** `.now-body`；不能把“缺 `.now-body`”当失败。判定草稿泄漏的哨兵是 `now-status`（以及有正文时的 `now-body`）。
- 报错示例：`dist/now/index.html 渲染了草稿 now 的状态/正文`。

## 4. notes 锚点 / RSS 交叉校验

`notes/rss.xml` 存在时：

1. XML 声明、`<rss>`、`<channel>` 存在（与主 RSS 同款）。
2. 对每条 **published** note：feed 必须包含 `#n-<id>`。
3. 对每条 **draft** note：feed 不得包含 `#n-<id>`。
4. 提取 feed 中所有 `#n-...` 锚点（`/notes/#n-...` 或 `#n-...`）：
   - 每个锚点必须能在 `dist/notes/index.html` 的 id 集合中找到；
   - 锚点数量应与 published notes 数量一致（允许 0）。
5. `<item>` 数量应与 published notes 数量一致（0 也合法）。
6. 主 `dist/rss.xml`：
   - 现有“每篇已发布文章链接存在”保留；
   - 新增：不得包含 `#n-` 或 `/notes/` 的 note 锚点（主 feed 只发文章）。

> 说明：feed 的 `link` 使用带子路径的绝对路径（`/xin-s-blog/notes/#n-...`）。校验时先按 `BASE_PATH` 去掉前缀，再取 hash；不要假设 feed 里一定是纯 `#n-`。

## 5. sitemap

现有 `expected` 集合增加：

```text
SITE_ROOT + 'notes/'
SITE_ROOT + 'now/'
```

- 断言 sitemap 包含两项；不要求 `/notes/rss.xml`。
- 断言 sitemap 不含 `#n-`（锚点不进 sitemap）。
- 现有 `404` 排除、文章 URL、标签 URL 检查保留。
- `/notes/`、`/now/` 的 canonical 由现有 `expectedCanonical()` 自动覆盖（所有 `*/index.html`），不需要新代码；但故障注入必须验证。

## 6. 重复 id（notes 页）

新增 `dom` 检查：

- 先只查 `dist/notes/index.html`（锚点最密集、最容易出问题）；如果实现证明全站无噪声，P2 再扩到所有 HTML。
- 用 `startTags` + `attrsOf` 统计每个 `id` 出现次数；>1 即 fail。
- 报错：`dist/notes/index.html 重复 id: n-2026-10-22-a`。
- 同日多条 note 的锚点必须不同；重复说明 `noteAnchor()` 或 id 处理有 bug。

输出行：

```text
dom        OK (notes)
```

## 7. canonical / OG / 体积

- **canonical**：P1a 的 F2 已按目录式页面精确比较；`/notes/`、`/now/` 自动纳入。新增页面若 canonical 指到根/错路径，必须 FAIL。
- **OG**：notes/now 由 Base 生成 website OG；本阶段不新增逐页 OG 断言。文章 OG 检查保留。
- **404**：保留 noindex、无 canonical/OG；P1b 不重新引入。
- **体积**：预算不变（CSS ≤18KB gzip、JS ≤3KB、字体 ≤1.5MB、max HTML ≤30KB、dist ≤2.6MB）。notes 页会随条数增长，先用 10 条测试 HTML；超限先定位，不抬上限。

## 8. 故障注入（实施后必须跑）

用最终 `dist` 的临时副本（`DIST_DIR` 指向副本，不改产物），逐项注入：

| 编号 | 注入 | 期望 |
| --- | --- | --- |
| G1 | 未注入的最终 dist | PASS；`artifacts` 含 notes/now；`dom OK` |
| G2 | 在 `notes/index.html` 注入 `<li id="n-<draft-id>">` | `FAIL drafts`（草稿锚点） |
| G3 | 在 `notes/rss.xml` 注入 `#n-<draft-id>` | `FAIL drafts` |
| G4 | 从 `sitemap-0.xml` 删除 `/notes/` 或 `/now/` | `FAIL sitemap` |
| G5 | 把 `notes/index.html` 的 canonical 改成站点根 | `FAIL seo` |
| G6 | 在 `notes/index.html` 复制一个已有 note id | `FAIL dom`（重复 id） |
| G7 | `now.md` 为 draft，但手工在 `now/index.html` 注入 `class="now-status"` | `FAIL drafts` |
| G8 | 把 `notes/rss.xml` 某条链接改成不存在的 `#n-2099-01-01-nope` | `FAIL rss` |
| G9 | 在主 `rss.xml` 注入 `#n-<published-id>` | `FAIL rss`（主 feed 混入 notes） |
| G10 | 删除 `notes/rss.xml` | `FAIL artifacts` |
| G11 | 在 `404.html` 注入 `og:title` | `FAIL seo`（P1a 回归） |

- 注入脚本只改临时副本；跑完删除副本。
- 证据：每条记录“注入内容 → 实际输出 → 退出码”；写进 `review.md`，不只写“已测”。
- 环境：`DIST_DIR`、`BASE_PATH=/xin-s-blog`、`SITE_URL=https://lucky-xiaoxin.github.io`。Git Bash 下注意 MSYS 路径转换；优先在 Node 包装脚本里设 env（与 `verify.mjs` 同款），不要内联 `BASE_PATH=...` 直接跑。

## 9. 实现顺序

1. 抽 `notes`/`now` 源扫描（复用现有 frontmatter 解析）。
2. 扩展 `leakTargets` 与草稿检查（G2/G3/G7）。
3. 加 notes RSS 交叉校验（G8/G9）。
4. 扩展 sitemap expected（G4）。
5. 加 `dom` 重复 id（G6）。
6. 改 artifacts 动态计数（G10）。
7. 跑 G1–G11，写 `review.md`。

## 10. 不做

- 不引入 `xml2js`/`cheerio`/`jsdom` 等解析依赖；生成物结构可控，现有正则足够。
- 不检查 notes 正文语义/字数（数据层已 warning）。
- 不检查 now 的小节结构（允许用户增减）。
- 不做逐条 notes OG/JSON-LD（本阶段不做）。

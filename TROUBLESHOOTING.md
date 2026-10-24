# 排错手册（报错原文 → 人话 → 修法）

这个站从建站到现在的**每一种真实报错**都记录在这里。遇到构建红了、线上怪，先来这里对号入座。

## 先记住三条原则

1. **构建失败 ≠ 网站坏了。** CI 是门禁：任何一步红，线上继续是上一次成功的版本，你没有能力推坏线上。
2. **看报错里的 `Location:` 行**，它直接指出文件和行号（js-yaml 行号从 0 数，报 5 就是第 6 行）。
3. **一次只改一处，改完就 `npm run build`**，让机器告诉你修没修好。

## 数据流（全站就这一张图）

```
你写 src/content/posts/*.md（frontmatter + 正文）
        │  规则由 src/content.config.ts 校验（写错字段名会拦你）
        ▼
npm run check    → 类型检查（const.ts/页面代码写错类型会拦）
npm run build    → Markdown 编译成 HTML（KaTeX 公式、Shiki 高亮都在这一步完成）
        │           产物进 dist/（这个目录不用管，随时可重建）
        ▼
npm run check:dist → 产物检查（链接/锚点/草稿泄漏/SEO/RSS/体积）
        │           npm run verify = check + 生产子路径 build + check:dist
        ▼
git push origin main → GitHub Actions 跑 check + build + check:dist → 全绿才发布
        ▼
https://lucky-xiaoxin.github.io/xin-s-blog/（HTML 有约 10 分钟浏览器缓存）
```

`npm run check:dist` 默认按普通 build（`base=/`）检查；`npm run verify` 会用生产子路径重新构建并检查。verify 之后预览用 `npm run preview:prod`，不是 `npm run preview`。

## 对号入座表

| 报错原文（关键词） | 人话 | 修法 |
|---|---|---|
| `bad indentation of a mapping entry` | frontmatter 的 YAML 语法错了 | 看 Location 行号（从 0 数）。惯犯：`tags: ['a']['b']`（多个数组拼接）→ 改成 `tags: ['a', 'b']`；值里有 `: ` 没加引号；用了 Tab |
| `Duplicate id "xxx" found in ...` | **大概率是假警报**：另一个文件的 YAML 错误中断了同步，重试时误报重复 | 先修掉当次的 `bad indentation`，这个警告会自己消失（实测验证过，别为它改文件） |
| `Unrecognized key(s) in object: 'xxx'` | frontmatter 字段名拼错（如 `updatedDat`） | 对照 `src/content.config.ts` 里的六个字段名改回来。这是 `.strict()` 在保护你 |
| `pubTime 须为零填充 24h 制` | 写了 `'9:5'` 这种 | 改成 `'09:05'` 格式，必须两位:两位 |
| `[TAG_SHAPE] 标签「xxx」未登记形状` | 用了新标签但没登记徽章形状 | 去 `src/const.ts` 的 `TAG_SHAPE` 加一行 `新标签: '形状名'`。不修也能发布，只是徽章变圆形 |
| `InvalidContentEntryDataError ... title/description` | 必填字段漏了 | frontmatter 补上 `title` 和 `description` |
| 公式在页面上**标红** | KaTeX 语法错（如 `\foo` 不存在的命令） | 只影响那一个公式，不挡发布。中文、→、≤ 可直接写，不用 \text |
| 推完 GitHub，线上刷新没变 | 浏览器缓存（约 10 分钟） | 博客页 Ctrl+F5；在 github.com 上刷新、关浏览器重开都没用 |
| `could not read Username` / GCM 弹窗 | git 推送凭据过期 | 跟着弹窗登录一次 GitHub 即可 |
| Actions 页面里 run 红了 | 构建门禁拦下了一次有问题的发布 | 点进 run 看是哪一步：check 红=类型错，build 红=多半是 frontmatter，check:dist 红=按 FAIL 后的类别找对应行。线上没坏，修好再推 |
| `npm run preview` 后访问 `/xin-s-blog/` 404 | preview 默认按 base=/ 启动，而 dist 是 verify 的生产子路径产物 | 改用 `npm run preview:prod`；普通 `npm run build` 的产物才用 `npm run preview` |
| `FAIL seo 404.html 缺少 robots noindex` 与 `FAIL rss ... 缺少已发布文章链接` 同时出现 | shell 里设了 `BASE_URL` 环境变量。Astro 把它当成站点 base，站内链接前缀与 404 判定一起坏掉（`u()` 拼出的是那个变量的值） | 子路径只认 `BASE_PATH`；本地脚本要指预览地址就换个变量名（如 `PREVIEW_URL`）。清掉 `BASE_URL` 后重跑 `npm run verify` 即可恢复 |
| `FAIL links ... 根绝对链接缺少 /xin-s-blog 前缀` | 站内链接写成了 `/posts/...` 这类根绝对路径 | 用 `src/const.ts` 的 `u()`/`resolveHref()` 生成；文章正文资源用相对路径，不要用 `/` 开头 |
| `FAIL drafts ... 草稿页被生成` / `包含草稿` | `draft: true` 的文章漏进了产物 | 查 frontmatter 的 `draft`；文章/笔记等内容页的 `getStaticPaths` 只能调 `getPostsForStaticPaths()`（标签详情例外，只调 `getPublishedPosts()`），列表/RSS 只能调 `getPublishedPosts()` |
| `FAIL links ... 锚点 #xxx 在 ... 中找不到 id` | 页内链接指向不存在的标题 id | 检查 TOC/锚点拼写，确认目标页生成了对应 `id`；同页 `#xxx` 也会被查。锚点只认真实 `id` 属性，`data-id` 不算 |
| `FAIL seo ...` | 文章页缺 canonical/OG/description，或 404 页多了 canonical/OG/Twitter 卡片 | 查 `src/layouts/Base.astro` 的 head；404 只保留 noindex，不要 canonical、`og:*`、`twitter:*` |
| `FAIL seo ... canonical 与页面地址不一致` | canonical 指错页面、缺尾斜杠，或改页面路径后没同步 | 目录式页面的 canonical 必须精确等于 `SITE_URL + BASE_PATH + 页面路径/`；优先让 `Base.astro` 统一生成，不要在页面里手写。404 例外，不生成 canonical |
| `FAIL seo ... canonical 不是 https://... 下的绝对地址`，且两边只差 host 大小写 | `SITE_URL` 的 host 大小写与 URL 规范化后的 canonical 不一致（GitHub 用户名可能带大写） | `check-dist` 已把 `SITE_URL` 归一化为 URL origin；仍报就检查 `SITE_URL` 的 scheme/host 是否写错。不要用字符串大小写硬比 |
| `FAIL rss ...` / `FAIL sitemap ...` | RSS/sitemap 缺已发布文章，或 sitemap 混入了 `/404/` | 检查 `src/lib/posts.ts` 的 `getPublishedPosts()`、`src/pages/rss.xml.js` 和 `@astrojs/sitemap` 的路由输出 |
| `FAIL size ... 当前 X 上限 Y，超出 Z` | 产物超预算（CSS/JS/字体/最大 HTML/dist） | 看是哪一项；先确认新增内容是否必要，不要直接抬 `scripts/check-dist.mjs` 里的上限。基线见 README |
| `[notes] 碎碎念 xxx 的 date 与文件名日期不一致` / `正文为空` / `文件名须为 YYYY-MM-DD-slug.md` | 碎碎念的数据层校验没过（故意挡发布） | 改文件名或 `date` 让两者一致；正文至少写一句话；slug 用小写字母/数字/连字符 |
| `[notes] 碎碎念 xxx 超过 800 字` / `日期在未来` | 只是警告，不挡发布 | 超长就考虑写成文章；未来日期不会自动隐藏 |
| `InvalidContentEntryDataError ... notes → ...` | 碎碎念 frontmatter 字段写错（多写 `title`/`tags` 等） | 碎碎念只认 `date`/`time`/`draft` 三个字段；要标题就写成文章 |
| `FAIL drafts ... 包含草稿 note ... 的锚点` | 草稿碎碎念的锚点漏进了页面/feed | 列表用 `getNotesForPage()`（dev 含草稿、build 只取已发布），feed 用 `getPublishedNotes()` |
| `FAIL drafts ... 渲染了草稿 now 的状态/正文` | `now.md` 是草稿，但产物里渲染出了 `.now-status`/`.now-body` | `/now/` 必须传 `includeDrafts: import.meta.env.DEV`；build 里草稿只能走空状态 |
| `FAIL rss ... 缺少已发布碎碎念链接` / `锚点 #n-xxx 在 notes/index.html 中找不到 id` | 碎碎念 feed 的链接与页面对不上 | 链接必须用**绝对 URL**：`@astrojs/rss` 会给相对链接补尾斜杠，把 `#n-xxx` 变成 `#n-xxx/`（页面上没有这个 id） |
| `FAIL rss ... 不应包含碎碎念锚点` | 主 `/rss.xml` 混进了碎碎念 | 主 feed 只发文章；碎碎念走独立的 `/notes/rss.xml` |
| `FAIL dom ... 重复 id: n-xxx` | `/notes/` 里两条碎碎念用了同一个锚点 | 锚点只由文件名决定（`n-<文件名>`），文件名重了就是重了 |
| `FAIL artifacts ... notes/rss.xml 必需产物缺失` | `/notes/rss.xml` 路由没生成 | 确认 `src/pages/notes/rss.xml.js` 存在且 `GET` 能返回；0 条碎碎念时也必须生成（0 item 是合法的） |
| 文章页 404 | 文件名改了（旧 URL 消失）或 draft 还是 true | Pages 没有重定向机制，改文件名=换 URL，别改已发布文章的文件名 |
| 标题里个别字显示成系统宋体 | 两种成因：① 这个字没进子集扫描范围（子集只收 .astro/.ts/.js 全文与 md 的 frontmatter/标题/引用行，且 dev 会话中途新写的字要等下次重启才纳入）② 源字体本来就没有这个字的字形（生僻字/韩文等） | ①重启 `npm run dev` 或重跑 `npm run build` 自动重建子集；②构建日志会打 `[subset-fonts] ⚠ 源字体缺字…`，无解、只回退，不挡发布，介意就换措辞 |
| 构建日志出现 `[vite] WARN ... ../assets/fonts/noto-serif-sc-subset-*.woff2 ... didn't resolve` | 字体子集没生成：直接跑了 `astro build`/`astro dev` 绕过了 npm 脚本（注意是 WARN 不是 error，产物会带病生成） | 用 `npm run build` / `npm run dev`（会自动先跑子集），或先手动 `node scripts/subset-fonts.mjs` |

## 这个仓库的地图（一共就这几个地方）

| 位置 | 管什么 | 你会在里面改什么 |
|---|---|---|
| `src/content/posts/` | 文章本体 | **99% 的日常就在这**，其余都可以不碰 |
| `src/content/notes/` | 碎碎念（`YYYY-MM-DD-slug.md`，复制 `_template.md` 起稿） | 写短句、设 `draft` |
| `src/content/pages/now.md` | 「现在」页内容（导语 + 最后更新日 + 可选小节） | 每月覆盖更新一次 |
| `src/const.ts` | 站名/导航/标签形状/日期格式 | 新标签登记 TAG_SHAPE |
| `src/content.config.ts` | 文章/碎碎念/静态页的"格式法律" | 想加新字段时才动 |
| `src/pages/` | URL 结构（文件名即路由） | 基本不动 |
| `src/styles/global.css` | 全站外观（顶部是颜色/字体令牌） | 改配色字体 |
| `astro.config.mjs` | 构建器配置（域名/前缀/公式/高亮） | 基本不动 |
| `.github/workflows/deploy.yml` | 发布流水线 | 基本不动 |

## 还是搞不定？

把**报错原文整段**复制发给 AI 助手，并附一句「我在改 X，构建报这个，线上没坏」。报错信息足够具体时，黑盒就变白盒了——这个站的所有历史问题都是这么定位的。

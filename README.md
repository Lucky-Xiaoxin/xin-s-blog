# 个人博客原型（Astro + GitHub Pages）

**线上地址：https://lucky-xiaoxin.github.io/xin-s-blog/**

计算机专业学生的技术笔记本站。构建产物是纯静态文件，直接由 GitHub Pages 托管。

## 本地开发

```bash
node -v            # 需要 22.23.4+（Astro 7 的最低 Node），见 package.json 的 engines
npm install
npm run dev        # http://localhost:4321/
npm run build      # 产出到 dist/（默认 base=/）
npm run check:dist # 只检查已有 dist/（默认与普通 build 一致）
npm run audit      # 依赖审计；high/critical 会返回非零
npm run preview    # 预览普通 dist/（配合上面的 build），端口看输出
npm run verify     # check + 生产子路径构建 + 产物检查（链接/草稿/SEO/体积）
npm run preview:prod # 预览 verify 的生产子路径产物（/xin-s-blog/）
```

`npm run verify` 用线上同款参数（`BASE_PATH=/xin-s-blog/`、`SITE_URL=https://lucky-xiaoxin.github.io`、`TZ=Etc/UTC`）重新构建，再跑 `scripts/check-dist.mjs`：检查必需产物、站内链接/锚点、草稿泄漏、canonical/OG、RSS/sitemap 与体积预算。任何一项失败都会返回非零退出码；CI 会先跑 `npm run audit`，build 后再以同款线上参数跑 `npm run check:dist`。

`npm run check:dist` 默认按 `BASE_PATH=/` 检查普通 `npm run build` 的产物；要检查生产子路径请用 `npm run verify`（它会自动以 `/xin-s-blog/` 重建），或显式传入 `BASE_PATH`/`SITE_URL`。`npm run preview` 对应普通构建，`npm run preview:prod` 对应 verify 的产物。（Windows Git Bash 下手动覆盖 `BASE_PATH` 时先 `export MSYS2_ENV_CONV_EXCL=BASE_PATH`，否则 `/xin-s-blog` 会被 shell 改写成 `C:/...`；直接跑 `npm run verify` / `npm run check:dist` / `npm run preview:prod` 不受影响。）

### 体积预算（2026-10-25 基线）

| 指标 | 口径 | 当前 | 上限 |
| --- | --- | --- | --- |
| CSS | 所有 `.css` gzip 总和 | 14.6 KB | 18 KB |
| JS | 所有 `.js` gzip 总和 | 0.0 KB | 3 KB |
| 字体 | `.woff2/.woff/.ttf` 原始大小总和 | 1.40 MB | 1.5 MB |
| 最大 HTML | 单个 `.html` 原始大小 | 20.3 KB | 30 KB |
| `dist` | 全部文件原始大小总和 | 1.6 MB | 2.6 MB |

内联主题脚本约 1.5 KB，只报告、不计入 JS 预算（P0 不加运行时 JS）。超限先定位是哪一项、确认新增内容是否必要，不要直接抬上限。

## 日常流程

构建红了、线上表现不对，先查 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)：每种真实遇到过的报错都有「报错原文 → 人话 → 修法」对照表。

### 写一篇博客（直推 main）

1. 一键建稿：`npm run new -- <文件名>`，或双击仓库根目录的「新建文章.bat」按提示输入。脚本会在 `src/content/posts/` 生成带注释的 frontmatter 模板，自动填好当天日期和本机时间（`pubTime` 纯显示用，删掉整行即不显示）。文件名即 URL，只用小写字母、数字、连字符。
2. 动笔前扫一眼 [docs/writing-style.md](./docs/writing-style.md)：frontmatter 字段、正文骨架、标题层级、公式/代码/链接的写法、语气与中文排版、发布前自查。不知道怎么下笔就直接照抄 [docs/example.md](./docs/example.md)。
3. 用了新标签：去 `src/const.ts` 的 `TAG_SHAPE` 登记形状，否则构建告警、徽章回退圆形。有配图：图片文件放 `src/content/posts/` 内，正文用相对路径引用。
4. 没写完设 `draft: true`——草稿不进目录页、不进标签、不进 RSS、不生成线上页面；`npm run dev` 可直接打开 `/posts/<文件名>/` 预览，页面会显示“草稿预览”。
5. 定稿后把 `draft` 删掉或改 `false`，commit 并 push 到 `main`：Actions 会依次跑类型检查、构建、发布，约一分钟后线上即更新。
6. 安全网：CI 任何一步失败都不会发布，线上继续服务上一次成功的产物——所以写博客不必开分支，推坏了补一版再推即可。

### 写一条碎碎念（直推 main）

碎碎念是带日期的短句（1–5 句），只出现在 `/notes/` 这条时间流里，不生成独立页面、也不进主 RSS。

1. 复制 `src/content/notes/_template.md` 为 `src/content/notes/YYYY-MM-DD-slug.md`（日期与文件名必须一致，slug 用小写字母/数字/连字符）。
2. frontmatter 只有三个字段：`date`（必填，`YYYY-MM-DD`）、`time`（可选，`HH:MM`，纯显示）、`draft`（可选）。正文不能为空；超过 800 字会在构建时提醒你写成文章。
3. 发布：删掉或改成 `draft: false`。草稿不进 `/notes/`、不进碎碎念 feed，`npm run dev` 里可见并带「草稿预览」。
4. 写错字段（比如给碎碎念加 `title`）会让构建直接失败——这是故意的，别绕过。

碎碎念的锚点是 `n-<文件名>`（如 `n-2026-10-22-design-agent`），只由文件名决定，回填旧碎碎念不会让既有锚点漂移。

### 更新「现在」页（直推 main）

`src/content/pages/now.md` 是「我最近在做什么」的单页，每月覆盖更新一次：

```markdown
---
title: '现在'
description: 'emo中……'      # 页面导语，也是 meta description
updatedDate: 2026-10-23      # 页面显示的「最后更新于」
draft: false
---
```

正文可以为空（首版就是空的，页面只显示页头 + 状态行）；想分节就在下面写 `## 在学` / `## 在做` 等小节，页面会自动变成两列并给标题编 `01…` 序号。`draft: true` 时线上只显示空状态（不显示日期与正文），上线前记得改回 `false`。

### 改框架（分支 + PR）

主题、组件、配置的改动影响整站，走这条路：

1. `git switch -c feat/xxx` 开分支，本地 `npm run dev` 验证。
2. 提交前跑 `npm run verify` 和 `npm run audit`——合起来等同 CI 的 check + 构建 + `check:dist` + 依赖审计，本地过了线上基本就过。
3. push 分支，在 GitHub 上开 PR、自查改动说明后合并到 `main`，合并即触发发布。
4. 改坏了要回滚：revert 那个 merge commit 再推 `main`，Pages 会重新发布旧版内容。

## 改成你自己的

| 要改什么 | 位置 |
| --- | --- |
| 站名、作者、简介、导航、社交链接 | `src/const.ts` |
| 写文章 | `npm run new -- <文件名>` 或双击「新建文章.bat」（也可手动在 `src/content/posts/` 建 `.md`，文件名即 URL） |
| 写碎碎念 | 复制 `src/content/notes/_template.md` 为 `src/content/notes/YYYY-MM-DD-slug.md` |
| 更新「现在」页 | `src/content/pages/now.md`（`description` = 导语，`updatedDate` = 最后更新日，正文可空） |
| 配色、字体、排版 | `src/styles/global.css` 顶部的令牌 |
| 明暗模式（配色/开关/记忆） | 深色令牌在 `global.css`，有两个必须逐字一致的入口：`:root[data-theme='dark']`（脚本/手动）与 `@media (prefers-color-scheme: dark)` 里的 `:root:not([data-theme='light'])`（无 JS 兜底），改一处要改两处；开关与脚本在 `src/layouts/Base.astro` |
| 页面结构 | `src/layouts/Base.astro`、`src/pages/` |
| 分享预览图 | 替换 `public/og.png`（1200×630） |
| frontmatter 字段 | `src/content.config.ts`（写错字段构建会报错） |
| 站点域名 | `.github/workflows/deploy.yml` 的 `SITE_URL`（`astro.config.mjs` 里的默认值只影响本地构建） |

文章格式（完整规范见 [docs/writing-style.md](./docs/writing-style.md)，可照抄的示例见 [docs/example.md](./docs/example.md)）：

```markdown
---
title: '文章标题'
description: '摘要，会出现在目录页、SEO 描述和 RSS 里'
pubDate: 2026-09-19
pubTime: '21:30'          # 可选，24h 制零填充，仅显示用；排序/RSS 只认 pubDate
updatedDate: 2026-09-25   # 可选
tags: ['算法', '题解']
draft: true               # 可选，草稿：dev 可预览、不发布
---
```

文章正文引用图片等资源：放在 `src/content/posts/` 里与文章同目录（或子目录）并用相对路径引用（如 `![图](./diagram.png)`），构建时会自动处理并带上子路径前缀。不要用 `/` 开头的根绝对路径——构建不会为它补前缀，部署后会 404。

数学公式：行内用 `$f(x)≤81d$`，独立成行用 `$$…$$`，由 KaTeX 在构建期排版成静态 HTML + MathML（字体随产物本地打包，浏览器端不执行 KaTeX；MathML 让读屏能读到公式）。KaTeX 原生支持 Unicode：中文、`→`、`≤`、`≥`、`<` 直接写就行；只有 undefined 命令（如 `\foo`）这类真语法错才会标红显示，不阻塞发布。长公式、代码块和表格会在构建期包一层可聚焦的横向滚动容器：各屏都比正文两侧略宽（`--bleed`），内容超出时在容器内横向滚动，不会把整页撑宽。写特别长的独立公式时，优先拆成多个 `$$` 块，阅读体验最好。

## 视觉规范

- 默认纯白底 + 单一正红 `#D81E1E`（深色下提亮为 `#EF3B3B` 保证对比度），其余只有黑、灰两级——例外是开关上的月亮描边用暗紫 `#2E1065`；不用阴影、渐变（唯一例外：文章题记的硬边"雕刻"——亮色内陷、深色凸出，配左侧 2px 红规线）。明暗模式：页头右侧胶囊开关切换，轨道两端嵌几何描边的月亮（左·暗紫）与太阳（右·白），可见侧即当前模式；首次访问跟随系统 `prefers-color-scheme`，手动选择后写入 `localStorage` 跨页记忆；禁用 JS 时由 `@media (prefers-color-scheme: dark)` 兜底继续跟随系统。深色令牌在 `global.css` 里有两个必须逐字一致的入口（`:root[data-theme='dark']` 与 `@media` 下的 `:root:not([data-theme='light'])`），全站唯一运行时的 JS 就是主题这一小段。
- 导航 4 项：目录 / 归档 / 标签 / 关于。`/archive/` 按年月分组（全站连续编号、移动端隐藏阅读时长），`/tags/` 是按使用频率排序的索引列表（不是标签云），`/tags/[tag]/` 用紧凑目录列表。`/notes/`（碎碎念）与 `/now/`（现在）**不进主导航**，只从页脚与关于页进入。
- 碎碎念：按月份分组（`2026 年 10 月`），组内按日期倒序（同日有时间在前）；每条左侧是衬线日期，右边是正文，末尾一个 `#` 是锚点链接（点它或从 feed 进来会看到左侧 2px 红规线）。不显示编号——回填旧条目不会让编号重排。
- 现在页：页头一行状态（红点 + 最后更新于），正文有 `##` 小节时桌面分两列、编号 `01…`，40rem 以下单列。
- 首页：卷首（圆/方/三角构图 + 三格图例：文章数 / 碎碎念数 / 现在状态）→ 开卷（最新文章）＋页边（最近 3 条碎碎念 + 现在一行）→ 编号目录（全部文章 `01…`）。图例与页边的计数、日期全部来自数据层，页面上不写死数字；空状态不留空框——0 碎碎念显示 `00 · 暂无`，没有 now 就少一格图例。
- 宽度：正文 `--measure: 42rem`；归档/标签/关于/404 用 `--mid: 46rem`；**首页用 `--wide: 58rem`**（P1c 已切，文章页仍是 measure，P1d 再切）。页面壳宽 = 内容宽 + 两侧 `--gutter`，`--gutter` 为 `clamp(1.25rem, 6vw, 4.5rem)`。注意：P1a 已按契约把 measure 页正文从旧 30rem 修正到 42rem（用户选择 A），并已在本地验收通过。
- 标题：拉丁用 Bodoni Moda、中文用思源宋体（Noto Serif SC），不走 Google CDN；中文衬线是**构建产物**——`dev`/`build` 启动前由 `scripts/subset-fonts.mjs` 从 npm 依赖里的源字体按站内标题用字现生成（每字重几十 KB，产物 gitignore 不入库），所以**dev 会话中途新写的标题用字要等下次重启 dev 或下一次构建才进子集**，期间那几个字回退系统宋体。正文用系统无衬线，等宽留给代码与元信息（日期/计数）。
- 首页卷首（圆/方/三角构图 + 三格图例）在 `src/components/Frontispiece.astro`，开卷/页边/目录分别在 `Opening.astro`、`MarginNotes.astro`、`Contents.astro`；页边摘要由 `src/lib/notes.ts` 的 `noteExcerpt()` 统一生成。标签类别到形状的映射在 `src/const.ts` 的 `TAG_SHAPE`，标签徽章在 `src/components/Badge.astro`。文章印记（列表 48px、文章页 104px）＝外框（分类形状）+ 内芯（文章 id 哈希）+ 红点（内芯特征点）：规则在 `const.ts` 的 `SEAL_CORES`/`sealFor`，渲染在 `src/components/Seal.astro`。新标签要登记进 `TAG_SHAPE`，否则构建时会告警且徽章回退为圆形。
- 代码高亮由 Shiki 在构建期完成，明暗两套 token 色随 HTML 一起产出：亮色色值内联在 `style` 里，暗色色值与两侧的字体风格（粗体/斜体/下划线）走 `--shiki-dark` / `--shiki-light-*` CSS 变量，浏览器切换只改属性、不重跑高亮。
- 代码块、独立公式、表格由 `astro.config.mjs` 的 `rehypeScrollable` 在构建期包一层 `.scroll-x`（`tabindex=0`、`role=region`、带 `aria-label`）；各屏用 `--bleed` 向两侧小幅突破正文，内容超出时在容器内横向滚动。全部是构建期 HTML，不增加客户端 JS。

## 部署到 GitHub Pages

日常发布只有一件事：push 到 `main`，Actions 自动构建发布。workflow 只在 `main` 上部署，其它分支手动触发（workflow_dispatch）不会上线。

### 子路径与域名

- **子路径**：workflow 把仓库名注入为 `BASE_PATH`（本站是 `/xin-s-blog/`），站内链接与资源前缀由 `src/const.ts` 的 `u()` 统一处理；本地不带前缀也能直接跑（默认 `/`）。以后若改用 `<用户名>.github.io` 仓库，把 `deploy.yml` 里的 `BASE_PATH` 改成 `/`。
- **域名**：RSS、sitemap 与 canonical 的绝对地址由 `SITE_URL` 生成，`deploy.yml` 的 Build 步骤会无条件注入 `https://<仓库所属用户名>.github.io`；`astro.config.mjs` 里 `site` 的默认值只影响本地构建。`BASE_PATH` 取自仓库名，GitHub 上改名（**Settings → General → Repository name**）后自动跟随，不用动代码。

用自定义域名的话，在 `deploy.yml` 里把 `SITE_URL` 改成 `https://你的域名`、`BASE_PATH` 改成 `/`，再加 `public/CNAME` 和对应的 DNS 记录，并同步 `public/robots.txt` 里的 Sitemap 地址。

### 首次上线记录（2026-09-24 完成，留作历史参考）

1. 新建空仓库 `Lucky-Xiaoxin/xin-s-blog`（无分支）。仓库名统一用小写，避免项目站子路径的大小写歧义。
2. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**（不是 Deploy from a branch）。这要在第一次 push 之前做，顺序反了会得到一个失败的 deploy 任务；已经失败的话，补设后在 Actions 里 **Re-run jobs** 即可，不必重新提交。
3. 本地分支原是 `master`，用 `git branch -M main` 改名（workflow 只监听 `main`）后 `git remote add origin` 再推送。推送要 GitHub 身份凭据：HTTPS 走 Git Credential Manager 的登录弹窗（或 Personal Access Token），SSH 则先把公钥加到账户。
4. 现在若需重接远程，用 `git remote set-url origin <新地址>`；直接重跑 `git remote add` 会报 `already exists`。
5. Actions 两个 job 都绿后，访问地址在 **Settings → Pages** 页面底部，形如 `https://<用户名>.github.io/<仓库名>/`。

## 已知边界

- 中文标签会生成百分号编码的 URL（`/tags/%E7%AE%97%E6%B3%95/`），访问正常；但 Pages 没有重定向机制，改文章文件名或标签名会让旧链接 404。
- 正文按相对路径引用的图片会在构建期被 Astro 自动优化（转 webp），但不做尺寸缩放；`public/` 只放站点级文件。
- 字体产物共 **77 个文件 / 1.40 MB**（整个 `dist` 原始大小 1.60 MB）：woff2 29 个 527 KB、woff 28 个 404 KB、ttf 20 个 502 KB。构成是 Noto 子集 2（思源宋体 400/500，构建期生成）+ Bodoni Moda 16（latin / latin-ext / math / symbols 四子集 × 两字重 × woff2+woff）+ KaTeX 59（20 个字符族 × 最多三档）。
- 其中 **ttf 502 KB 加 woff 里约 393 KB 是死重**——现代浏览器只请求 woff2，只有 `KaTeX_Size3-Regular` 没有 woff2（上游就没给），它的 woff 是唯一真会被下载的 woff。原因是 `katex.min.css` 每条 `src` 都写了 woff2→woff→ttf 三档，Vite 为 CSS 里引用到的每个 `url()` 都落一份产物，于是三档全进 `dist`。这是上游 CSS 的行为、不是本项目配错；要瘦产物只能构建后按清单删文件，属于新增构建步骤，未做。另外 KaTeX 的字体只在页面真有公式时才懒加载，无公式的页面一份都不下载。
- 配图链路从未被真实使用过：4 篇文章零图片，上一条「相对路径图片自动转 webp」是按 Astro 的行为写的、不是实测结论。第一次真放配图时留意产物里的 URL 前缀对不对。
- 依赖与审计：Astro 7；根 `katex` 固定 0.18.9，`package.json` 的 `overrides` 把 `rehype-katex`/`micromark-extension-math` 的嵌套版本也锁到同一版（`npm ls katex` 应只剩一个）。CI 会跑 `npm run audit`，high/critical 直接红；**不要跑 `npm audit fix --force`**，它会把 `rehype-katex` 降到 1.2.0。
- 碎碎念 feed 在 `/notes/rss.xml` 生成并有门禁校验，但页面上**不放订阅入口**（P1b 契约的决定），要订阅得手动访问该 URL；页脚的 `RSS` 仍指主文章 feed `/rss.xml`。
- 部署链路已跑通一次：Actions run #1 的 build 与 deploy 全绿，线上页面、CSS、字体、中文标签页、RSS 绝对地址、自定义 404 均验证为 200。
- 桌面/移动视口已用无头 Chrome 做过亮暗走查（含公式、代码块、短页页脚）；真机（iOS Safari / Android Chrome）和读屏实测仍未覆盖。

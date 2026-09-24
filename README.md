# 个人博客原型（Astro + GitHub Pages）

计算机专业学生的技术笔记本站。构建产物是纯静态文件，直接由 GitHub Pages 托管。

## 本地开发

```bash
node -v            # 需要 18.20.8+ / 20.3+ / 22+，见 package.json 的 engines
npm install
npm run dev        # http://localhost:4321/
npm run build      # 产出到 dist/
npm run preview    # 预览 dist/，实际端口看命令输出
```

## 改成你自己的

| 要改什么 | 位置 |
| --- | --- |
| 站名、作者、简介、导航、社交链接 | `src/const.ts` |
| 写文章 | 在 `src/content/posts/` 新建 `.md`，文件名即 URL |
| 配色、字体、排版 | `src/styles/global.css` 顶部的令牌 |
| 页面结构 | `src/layouts/Base.astro`、`src/pages/` |
| 分享预览图 | 替换 `public/og.png`（1200×630） |
| frontmatter 字段 | `src/content.config.ts`（写错字段构建会报错） |
| 站点域名 | `.github/workflows/deploy.yml` 的 `SITE_URL`（`astro.config.mjs` 里的默认值只影响本地构建） |

文章格式：

```markdown
---
title: '文章标题'
description: '摘要，会出现在目录页、SEO 描述和 RSS 里'
pubDate: 2026-09-19
updatedDate: 2026-09-25   # 可选
tags: ['算法', '题解']
draft: true               # 可选，不发布
---
```

文章正文引用图片等资源：放在 `src/content/posts/` 里与文章同目录（或子目录）并用相对路径引用（如 `![图](./diagram.png)`），构建时会自动处理并带上子路径前缀。不要用 `/` 开头的根绝对路径——构建不会为它补前缀，部署后会 404。

## 视觉规范

- 纯白底 + 单一正红 `#D81E1E`，其余只有黑、灰两级；不用阴影、渐变和深色模式。
- 标题 Bodoni Moda（几何高对比衬线），通过 `@fontsource/bodoni-moda` 打进仓库，不走 Google CDN；中文回退到本地思源宋体/宋体。正文用系统无衬线，等宽只留给代码。
- 首页的圆/方/三角构图在 `src/components/Hero.astro`；标签类别到形状的映射在 `src/const.ts` 的 `TAG_SHAPE`，形状本身在 `src/components/Badge.astro`。新标签要登记进 `TAG_SHAPE`，否则构建时会告警且徽章回退为圆形。
- 代码高亮由 Shiki 在构建期完成，浏览器端零 JS。

## 部署到 GitHub Pages

日常发布只有一件事：push 到 `main`，Actions 自动构建发布。workflow 只在 `main` 上部署，其它分支手动触发（workflow_dispatch）不会上线。

### 子路径与域名

- **子路径**：workflow 把仓库名注入为 `BASE_PATH`（本站是 `/xin-s-blog/`），站内链接与资源前缀由 `src/const.ts` 的 `u()` 统一处理；本地不带前缀也能直接跑（默认 `/`）。以后若改用 `<用户名>.github.io` 仓库，把 `deploy.yml` 里的 `BASE_PATH` 改成 `/`。
- **域名**：RSS、sitemap 与 canonical 的绝对地址由 `SITE_URL` 生成，`deploy.yml` 的 Build 步骤会无条件注入 `https://<仓库所属用户名>.github.io`；`astro.config.mjs` 里 `site` 的默认值只影响本地构建。`BASE_PATH` 取自仓库名，GitHub 上改名（**Settings → General → Repository name**）后自动跟随，不用动代码。

用自定义域名的话，在 `deploy.yml` 里把 `SITE_URL` 改成 `https://你的域名`、`BASE_PATH` 改成 `/`，再加 `public/CNAME` 和对应的 DNS 记录。

### 首次上线记录（2026-09-24 完成，留作历史参考）

1. 新建空仓库 `Lucky-Xiaoxin/xin-s-blog`（无分支）。仓库名统一用小写，避免项目站子路径的大小写歧义。
2. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**（不是 Deploy from a branch）。这要在第一次 push 之前做，顺序反了会得到一个失败的 deploy 任务；已经失败的话，补设后在 Actions 里 **Re-run jobs** 即可，不必重新提交。
3. 本地分支原是 `master`，用 `git branch -M main` 改名（workflow 只监听 `main`）后 `git remote add origin` 再推送。推送要 GitHub 身份凭据：HTTPS 走 Git Credential Manager 的登录弹窗（或 Personal Access Token），SSH 则先把公钥加到账户。
4. 现在若需重接远程，用 `git remote set-url origin <新地址>`；直接重跑 `git remote add` 会报 `already exists`。
5. Actions 两个 job 都绿后，访问地址在 **Settings → Pages** 页面底部，形如 `https://<用户名>.github.io/<仓库名>/`。

## 已知边界

- 中文标签会生成百分号编码的 URL（`/tags/%E7%AE%97%E6%B3%95/`），访问正常；但 Pages 没有重定向机制，改文章文件名或标签名会让旧链接 404。
- 正文按相对路径引用的图片会在构建期被 Astro 自动优化（转 webp），但不做尺寸缩放；`public/` 只放站点级文件。
- 部署链路已跑通一次：Actions run #1 的 build 与 deploy 全绿，线上 `https://lucky-xiaoxin.github.io/xin-s-blog/` 的页面、CSS、24 个字体文件（12 组 woff2 + woff 兜底）、中文标签页、RSS 绝对地址均验证为 200，不存在的返回自定义 404 页。
- 未覆盖的是浏览器里的视觉走查和真机移动适配，这两项需要人眼看。

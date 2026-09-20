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
| frontmatter 字段 | `src/content.config.ts`（写错字段构建会报错） |
| 站点域名 | `astro.config.mjs` 的 `SITE_URL` |

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

## 视觉规范

- 纯白底 + 单一正红 `#D81E1E`，其余只有黑、灰两级；不用阴影、渐变和深色模式。
- 标题 Bodoni Moda（几何高对比衬线），通过 `@fontsource/bodoni-moda` 打进仓库，不走 Google CDN；中文回退到本地思源宋体/宋体。正文用系统无衬线，等宽只留给代码。
- 首页的圆/方/三角构图在 `src/components/Hero.astro`；标签类别到形状的映射在 `src/const.ts` 的 `TAG_SHAPE`，形状本身在 `src/components/Badge.astro`。
- 代码高亮由 Shiki 在构建期完成，浏览器端零 JS。

## 部署到 GitHub Pages

下面第 2 步要在第一次 push 之前做，顺序反了会得到一个失败的 deploy 任务。

1. 远程仓库 `https://github.com/Lucky-Xiaoxin/xin-s-blog`（空仓库，无分支）。仓库名统一用小写，避免项目站子路径的大小写歧义。
2. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**（不是 Deploy from a branch）。
3. 本仓库已经 `git init` 并有过提交，只需改名分支、接上远程、推送：

   ```bash
   git branch -M main    # 当前是 master；workflow 只监听 main，不改名不会触发部署
   git remote add origin https://github.com/Lucky-Xiaoxin/xin-s-blog.git
   git push -u origin main
   ```

   推送要 GitHub 身份凭据：HTTPS 走 Git Credential Manager 的登录弹窗（或 Personal Access Token），SSH 则先把公钥加到账户。

4. 到仓库 **Actions** 页面看这次运行。两个 job 都绿了之后，访问地址在 **Settings → Pages** 页面底部，形如 `https://<用户名>.github.io/<仓库名>/`。
5. 之后每次 push 到 `main` 都会自动重新构建发布。首次若因 Pages 源码没设成 Actions 而失败，去第 2 步设好后在 Actions 里 **Re-run jobs** 即可，不必重新提交。

### 部署前确认三件事

- **子路径**：仓库名 `xin-s-blog`，workflow 会把 `BASE_PATH` 注入为 `/xin-s-blog/`；站内链接与资源前缀由 `src/const.ts` 的 `u()` 统一处理，本地不带前缀也能直接跑。以后若改用 `<用户名>.github.io` 仓库，把 `deploy.yml` 里的 `BASE_PATH` 改成 `/`。
- **仓库名大小写**：项目站子路径对大小写敏感的风险不好排查，所以统一用小写。如果远程仓库当前还是 `Xin-s-blog`，去 GitHub 的 **Settings → General → Repository name** 改成 `xin-s-blog`；`BASE_PATH` 取自仓库名，改完自动跟随，不用动代码。
- **域名**：`astro.config.mjs` 的 `site` 默认值已是 `https://lucky-xiaoxin.github.io`，RSS 和 sitemap 的绝对地址由它生成；workflow 会用仓库所属用户名覆盖成同一个值。

用自定义域名的话，`SITE_URL` 填 `https://你的域名`、`BASE_PATH` 填 `/`，再加 `public/CNAME` 和对应的 DNS 记录。

## 已知边界

- 中文标签会生成百分号编码的 URL（`/tags/%E7%AE%97%E6%B3%95/`），访问正常；但 Pages 没有重定向机制，改文章文件名或标签名会让旧链接 404。
- 图片目前手动放 `public/`，没有压缩或自动缩放流程。
- 部署链路已跑通一次：Actions run #1 的 build 与 deploy 全绿，线上 `https://lucky-xiaoxin.github.io/xin-s-blog/` 的页面、CSS、12 个字体文件、中文标签页、RSS 绝对地址均验证为 200，不存在的返回自定义 404 页。
- 未覆盖的是浏览器里的视觉走查和真机移动适配，这两项需要人眼看。

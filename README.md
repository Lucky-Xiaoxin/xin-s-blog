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

1. 在 GitHub 建**空仓库**（不要勾选自动生成 README 或 .gitignore）。仓库名就是站点子路径，例如 `zhangsan.github.io` 或 `my-blog`。
2. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**（不是 Deploy from a branch）。
3. 本仓库已经 `git init` 并有过提交，所以只需改名分支、接上远程、推送：

   ```bash
   git branch -M main    # 当前是 master；workflow 只监听 main，不改名不会触发部署
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

   推送要 GitHub 身份凭据：HTTPS 走 Git Credential Manager 的登录弹窗（或 Personal Access Token），SSH 则先把公钥加到账户。

4. 到仓库 **Actions** 页面看这次运行。两个 job 都绿了之后，访问地址在 **Settings → Pages** 页面底部，形如 `https://<用户名>.github.io/<仓库名>/`。
5. 之后每次 push 到 `main` 都会自动重新构建发布。首次若因 Pages 源码没设成 Actions 而失败，去第 2 步设好后在 Actions 里 **Re-run jobs** 即可，不必重新提交。

### 部署前要改的两处

- **子路径**：仓库名是 `<用户名>.github.io` 时，把 `.github/workflows/deploy.yml` 里的 `BASE_PATH` 改成 `/`；其他仓库名保持 `/${{ github.event.repository.name }}`。站内链接和资源前缀由 `src/const.ts` 的 `u()` 自动处理，本地不带前缀也能直接跑。
- **域名**：`astro.config.mjs` 的 `SITE_URL` 默认值和 `src/const.ts` 里的 `author`、`handle`、`SOCIALS` 换成真实信息。workflow 会用仓库所属用户名覆盖 `SITE_URL`，但 RSS 和 sitemap 里的绝对地址来自 `site`，两者要对得上。

用自定义域名的话，`SITE_URL` 填 `https://你的域名`、`BASE_PATH` 填 `/`，再加 `public/CNAME` 和对应的 DNS 记录。

## 已知边界

- 中文标签会生成百分号编码的 URL（`/tags/%E7%AE%97%E6%B3%95/`），访问正常；但 Pages 没有重定向机制，改文章文件名或标签名会让旧链接 404。
- 图片目前手动放 `public/`，没有压缩或自动缩放流程。
- 部署流程本身依赖 GitHub Actions，尚未在真实仓库上跑通过一次；本地构建与预览已验证。

## 当前状态

原型内的 5 篇文章、作者名与联系方式都是占位示例，用于演示排版效果。

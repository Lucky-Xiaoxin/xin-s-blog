# 个人博客原型（Astro + GitHub Pages）

计算机专业学生的技术笔记本站。构建产物是纯静态文件，直接由 GitHub Pages 托管。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 产出到 dist/
npm run preview    # 预览构建结果
```

## 改成你自己的

| 要改什么 | 位置 |
| --- | --- |
| 站名、作者、简介、导航 | `src/const.ts` |
| 写文章 | 在 `src/content/posts/` 新建 `.md`，文件名即 URL |
| 配色、字体、排版 | `src/styles/global.css` 顶部的令牌 |
| 页面结构 | `src/layouts/Base.astro`、`src/pages/` |
| frontmatter 字段 | `src/content.config.ts`（写错字段构建会报错） |

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

深色模式跟随系统 `prefers-color-scheme`，代码高亮由 Shiki 在构建期完成，浏览器端零 JS。

## 部署到 GitHub Pages

1. 在 GitHub 建一个仓库（名字就是站点子路径，例如 `zhangsan.github.io` 或 `my-blog`）。
2. 把本地推上去：

   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**（不是 Deploy from a branch）。
4. 之后每次 push 到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

仓库名是 `<用户名>.github.io` 时，把 workflow 里的 `BASE_PATH` 改成 `/`；其他名字保持 `/${{ github.event.repository.name }}`，站点的链接和资源前缀会自动处理。

上线后记得把 `astro.config.mjs` 的 `SITE_URL` 默认值和 `src/const.ts` 里的 `@zhangsan`、社交链接换成真实地址——RSS 和 sitemap 需要绝对域名。

## 当前状态

原型内的 5 篇文章、作者名与联系方式都是占位示例，用于演示排版效果。

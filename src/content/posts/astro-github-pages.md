---
title: '从 Jekyll 到 Astro：把博客重新搬回 GitHub Pages'
description: '记录了这次迁移的原因：本地装 Ruby 的折腾、构建速度，以及为什么最后选了 Astro 而不是继续用 Jekyll。'
pubDate: 2026-09-12
tags: ['建站', 'Astro', 'GitHub Pages']
---

> 这是一篇示例文章，用来演示博客的排版效果。内容随时可以替换成你自己的。

我原来的博客是 Jekyll 建的。它的问题不在 Jekyll 本身，而在 Windows 上把 Ruby 工具链装起来那一整套过程——每次换机器都要重来一遍 `ridkinstall`，然后继续失败。

## 迁移前想清楚三件事

1. **文章格式不能变。** 换生成器最容易丢的就是历史文章的 frontmatter，所以先把所有 `.md` 的字段统一成 `title / description / pubDate / tags` 四种。
2. **产出必须是纯静态文件。** 这样 GitHub Pages 才能直接托管，不需要额外的服务端。
3. **子路径要能配置。** 项目站是 `user.github.io/仓库名/`，资源前缀不能写死成根路径。

## Astro 的对应做法

内容集合（Content Collections）负责校验 frontmatter，写错字段名会在构建阶段直接报错，而不是像以前那样悄悄生成一个空标题页面：

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
```

子路径则交给 `base` 环境变量处理，本地开发时是 `/`，CI 里是仓库名：

```js
export default defineConfig({
  base: process.env.BASE_PATH || '/',
});
```

## 结果

| | Jekyll | Astro |
| --- | --- | --- |
| 本地环境 | Ruby + Bundler | Node |
| 25 篇文章冷构建 | 12.4s | 1.8s |
| 语法高亮 | Rouge | Shiki |

Shiki 是这里最值得提的一处：它在构建期就把代码变成带颜色的 `<span>`，浏览器端不需要再跑 `highlight.js`，正文里的代码块因此和文字一样是静态的。

## 还没解决的问题

图片目前还是手动放进 `public/`，没有压缩流程。下一步大概会加个 `pnpm imgs` 脚本批量转 WebP。

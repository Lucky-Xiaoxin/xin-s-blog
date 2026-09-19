import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages 的项目站部署在 https://<user>.github.io/<repo>/ 下，
// 因此构建时需要把仓库名作为 base 路径注入（见 .github/workflows/deploy.yml）。
export default defineConfig({
  site: process.env.SITE_URL || 'https://zhangsan.github.io',
  base: process.env.BASE_PATH || '/',
  // 输出 posts/slug/index.html 的目录形式，GitHub Pages 对目录索引的支持最稳
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      wrap: false,
    },
  },
});

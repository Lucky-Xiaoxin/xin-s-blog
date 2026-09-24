import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vitesseLight from '@shikijs/themes/vitesse-light';

// GitHub Pages 的项目站部署在 https://<user>.github.io/<repo>/ 下，
// 因此构建时需要把仓库名作为 base 路径注入（见 .github/workflows/deploy.yml）。
export default defineConfig({
  site: process.env.SITE_URL || 'https://lucky-xiaoxin.github.io',
  base: process.env.BASE_PATH || '/',
  // 输出 posts/slug/index.html 的目录形式，GitHub Pages 对目录索引的支持最稳
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // vitesse-light 原 token 色在 --surface 代码背景上多处不达 WCAG AA，
      // 以下替色为保色相压暗至 >=4.6:1（global.css 的 .astro-code 覆写了背景色）
      theme: {
        ...vitesseLight,
        colorReplacements: {
          '#a0ada0': '#627162',
          '#999999': '#707070',
          '#59873a': '#507934',
          '#998418': '#7f6d14',
          '#99841877': '#766b36',
          '#2e8f82': '#27786d',
          '#2e808f': '#2c7987',
          '#22863a': '#207e36',
          '#ab5e3f': '#a45a3c',
          '#b05a78': '#a6506e',
          '#b07d48': '#8c6339',
          '#b56959': '#a65a4a',
          '#b5695977': '#a05c4b',
          '#bda437': '#7e6d25',
          '#e36209': '#b24d07',
        },
      },
      wrap: false,
    },
  },
});

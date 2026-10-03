import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vitesseLight from '@shikijs/themes/vitesse-light';
import vitesseDark from '@shikijs/themes/vitesse-dark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
    // 数学公式构建期排版（浏览器零 JS）；throwOnError/strict 关闭：
    // 坏公式在页面上标红，而不是炸掉构建挡住发布
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: false, output: 'html' }]],
    shikiConfig: {
      // 明暗双主题：亮色色值内联、暗色色值走 --shiki-dark，字体风格两侧都走 --shiki-*-font-* 变量
      // （global.css 必须同时消费 light/dark 两侧，缺 light 侧会丢代码粗体/斜体）
      // 由 global.css 按 data-theme 切换（代码块背景统一覆写为 --surface）
      themes: {
        // light：vitesse-light 原 token 色在 --surface 代码背景上多处不达 WCAG AA，
        // 以下替色为保色相压暗至 >=4.6:1
        light: {
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
        // dark：vitesse-dark 上同样的修补——暗底不达 4.6:1 的几个 token 做保色相提亮
        dark: {
          ...vitesseDark,
          colorReplacements: {
            '#758575dd': '#8a9a8a', // 注释
            '#666666': '#8a8a8a', // 标点
            '#6872ab': '#7c86bd', // 类型名
            '#b8a96577': '#a3924f', // 属性名标点
            '#c98a7d77': '#c98a7d', // 字符串标点（去掉半透明）
          },
        },
      },
      wrap: false,
    },
  },
});

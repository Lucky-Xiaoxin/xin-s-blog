// 把 src/<方向>/<页面>.html 片段套上共享页头页脚，输出到 <方向>/<页面>.html。
// 设计原型的构建工具，不进入站点生产构建。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DIRECTIONS = {
  d1: {
    label: '方向一 · 卷首',
    css: 'd1.css',
    pages: {
      home: { title: '首页', nav: 'home', full: true, shell: 'wide' },
      post: { title: '文章', shell: 'wide' },
      archive: { title: '归档', nav: 'archive', shell: 'mid' },
      tags: { title: '标签', nav: 'tags', shell: 'mid' },
      notes: { title: '碎碎念', shell: 'mid' },
      now: { title: '现在', shell: 'mid' },
      about: { title: '关于', nav: 'about', shell: 'mid' },
    },
  },
  d2: {
    label: '方向二 · 测绘',
    css: 'd2.css',
    pages: {
      home: { title: '首页', nav: 'home', full: true, shell: 'wide' },
      post: { title: '文章', shell: 'wide' },
      archive: { title: '归档', nav: 'archive', shell: 'mid' },
      tags: { title: '标签', nav: 'tags', shell: 'mid' },
      notes: { title: '碎碎念', shell: 'mid' },
      now: { title: '现在', shell: 'mid' },
      about: { title: '关于', nav: 'about', shell: 'mid' },
    },
  },
  d3: {
    label: '方向三 · 页边',
    css: 'd3.css',
    pages: {
      home: { title: '首页', nav: 'home', full: true, shell: 'wide' },
      post: { title: '文章', shell: 'wide' },
      archive: { title: '归档', nav: 'archive', shell: 'mid' },
      tags: { title: '标签', nav: 'tags', shell: 'mid' },
      notes: { title: '碎碎念', shell: 'mid' },
      now: { title: '现在', shell: 'mid' },
      about: { title: '关于', nav: 'about', shell: 'mid' },
    },
  },
};

const NAV = [
  { file: 'home', label: '目录', key: 'home' },
  { file: 'archive', label: '归档', key: 'archive' },
  { file: 'tags', label: '标签', key: 'tags' },
  { file: 'about', label: '关于', key: 'about' },
];

const toggle = `
          <button
            class="theme-toggle"
            type="button"
            role="switch"
            aria-checked="false"
            aria-label="深色模式"
            title="切换到深色模式"
          >
            <svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="4.6" />
              <path d="M12 1.6v2M12 20.4v2M1.6 12h2M20.4 12h2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M19.3 4.7l-1.4 1.4M6.1 17.9l-1.4 1.4" />
            </svg>
          </button>`;

function navMarkup(active) {
  return NAV.map(
    (item) =>
      `              <a href="${item.file}.html"${
        active === item.key ? ' aria-current="page"' : ''
      }>${item.label}</a>`,
  ).join('\n');
}

function header({ full, active, shell }) {
  const headerShell = full ? 'shell shell--wide' : shell;
  if (full) {
    return `<header class="masthead masthead--full">
      <div class="${headerShell}">
        <div class="masthead__row">
          <h1 class="brand"><a href="home.html">二进制与诗<span class="dot">.</span></a></h1>
          <span class="masthead__handle label">@Xiaoxin</span>
        </div>
        <p class="tagline">一个佛大计算机学生的笔记站 · 计算机系统、算法题解与开发工具的个人笔记。</p>
        <div class="nav-bar">
          <nav class="nav" aria-label="主导航">
${navMarkup(active)}
          </nav>${toggle}
        </div>
      </div>
    </header>`;
  }
  return `<header class="masthead masthead--compact">
      <div class="${headerShell}">
        <a class="brand" href="home.html">二进制与诗<span class="dot">.</span></a>
        <div class="nav-bar">
          <nav class="nav" aria-label="主导航">
${navMarkup(active)}
          </nav>${toggle}
        </div>
      </div>
    </header>`;
}

function footer(direction, shell) {
  return `<footer class="colophon">
      <div class="${shell}">
        <div class="colophon__row label">
          <span>© 2026 小鑫</span>
          <nav class="colophon__nav" aria-label="页脚导航">
            <a href="notes.html">碎碎念</a><span class="sep">/</span>
            <a href="now.html">现在</a><span class="sep">/</span>
            <a href="https://github.com/Lucky-Xiaoxin" rel="noopener">GitHub</a><span class="sep">/</span>
            <a href="mailto:yggdya@163.com">Email</a><span class="sep">/</span>
            <a href="#">RSS</a>
          </nav>
        </div>
        <p class="colophon__note meta">Astro 构建 · GitHub Pages 托管 · 订阅 RSS<span class="proto-note">设计原型 ${direction.label} · 非线上版本</span></p>
      </div>
    </footer>`;
}

const themeHead = `<script>
      (function () {
        var q = new URLSearchParams(location.search);
        var t = q.get('theme');
        if (t !== 'dark' && t !== 'light') {
          try { t = localStorage.getItem('xin-blog-proto-theme'); } catch (e) {}
        }
        if (t !== 'dark' && t !== 'light') {
          t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', t);
      })();
    </script>`;

const themeScript = `<script>
      (function () {
        var root = document.documentElement;
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;
        function sync() {
          var dark = root.getAttribute('data-theme') === 'dark';
          toggle.setAttribute('aria-checked', dark ? 'true' : 'false');
          toggle.setAttribute('title', dark ? '切换到浅色模式' : '切换到深色模式');
        }
        toggle.addEventListener('click', function () {
          var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          root.setAttribute('data-theme', next);
          try { localStorage.setItem('xin-blog-proto-theme', next); } catch (e) {}
          sync();
        });
        sync();
      })();
    </script>`;

for (const [dir, config] of Object.entries(DIRECTIONS)) {
  const outDir = path.join(root, dir);
  for (const [file, meta] of Object.entries(config.pages)) {
    const bodyPath = path.join(root, 'src', dir, `${file}.html`);
    if (!existsSync(bodyPath)) {
      console.warn(`[render] 跳过 ${dir}/${file}：没有片段`);
      continue;
    }
    const body = readFileSync(bodyPath, 'utf8').trim();
    const shellClass =
      meta.shell === 'wide' ? 'shell shell--wide' : meta.shell === 'mid' ? 'shell shell--mid' : 'shell';
    const html = `<!doctype html>
<html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>设计原型 · ${config.label} · ${meta.title}</title>
    <meta name="description" content="二进制与诗的下一阶段设计原型，非线上版本。" />
    <link rel="stylesheet" href="../assets/base.css" />
    <link rel="stylesheet" href="../assets/${config.css}" />
    ${themeHead}
  </head>
  <body class="direction-${dir} page-${file} ${dir}-${file}">
    <a class="skip" href="#main">跳到正文</a>
${header({ ...meta, shell: shellClass })}
    <main id="main">
      <div class="${shellClass}">
${body}
      </div>
    </main>
${footer(config, shellClass)}
${themeScript}
  </body>
</html>
`;
    writeFileSync(path.join(outDir, `${file}.html`), html);
    console.log(`[render] ${dir}/${file}.html`);
  }
}

// 全量自检 + 总览截图。只启动本脚本自己拉起的 Chrome，结束时会按 PID 关闭。
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screens = path.join(root, 'screens');
mkdirSync(screens, { recursive: true });

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4174;
const DEBUG_PORT = 9223;
const DIRS = ['d1', 'd2', 'd3'];
const PAGES = ['home', 'post', 'archive', 'tags', 'notes', 'now', 'about'];
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  let file = path.join(root, decodeURIComponent((req.url || '/').split('?')[0]));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const profile = path.join(os.tmpdir(), `xin-blog-design-chrome-${Date.now()}`);
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitEndpoint() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) return res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome 调试端口未就绪');
}

const version = await waitEndpoint();

async function pageSocket() {
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const targets = await res.json();
    const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (page) return page.webSocketDebuggerUrl;
    await sleep(100);
  }
  throw new Error('没有可用的 page target');
}

const ws = new WebSocket(await pageSocket());
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
const waiters = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id) {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
    else p.resolve(msg.result);
    return;
  }
  const list = waiters.get(msg.method);
  if (list?.length) list.shift()(msg.params);
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function waitEvent(method) {
  return new Promise((resolve) => {
    if (!waiters.has(method)) waiters.set(method, []);
    waiters.get(method).push(resolve);
  });
}

await send('Page.enable');
await send('Runtime.enable');

async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
    screenWidth: width,
    screenHeight: height,
  });
}

async function navigate(url) {
  const loaded = waitEvent('Page.loadEventFired');
  await send('Page.navigate', { url });
  await Promise.race([
    loaded,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`load timeout: ${url}`)), 5000)),
  ]);
  await send('Runtime.evaluate', {
    expression: 'document.fonts.ready.then(() => true)',
    awaitPromise: true,
    returnByValue: true,
  });
  await sleep(90);
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const auditScript = `(() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.classList.contains('skip')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      let p = el.parentElement;
      let scrollable = false;
      while (p) {
        const ps = getComputedStyle(p);
        if (/(auto|scroll)/.test(ps.overflowX)) { scrollable = true; break; }
        p = p.parentElement;
      }
      if (!scrollable) {
        bad.push({ tag: el.tagName, cls: String(el.className).slice(0, 60), left: Math.round(r.left), right: Math.round(r.right) });
      }
    }
  }
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const missingAnchors = [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute('href').slice(1))
    .filter((id) => id && !document.getElementById(id));
  return {
    theme: doc.getAttribute('data-theme'),
    fonts: document.fonts.status,
    h1: document.querySelectorAll('h1').length,
    scrollWidth: doc.scrollWidth,
    innerWidth: vw,
    bad: bad.slice(0, 8),
    dupes,
    missingAnchors,
  };
})()`;

async function audit() {
  let checks = 0;
  const failures = [];
  for (const dir of DIRS) {
    for (const page of PAGES) {
      const widths = [320, 390, 768, 1024, 1440];
      for (const width of widths) {
        for (const theme of width === 1440 || width === 390 ? ['light', 'dark'] : ['light']) {
          checks++;
          console.log(`[audit] ${dir}/${page} ${width} ${theme}`);
          await setViewport(width, width === 320 ? 800 : width === 390 ? 844 : 1000);
          const url = `http://127.0.0.1:${PORT}/${dir}/${page}.html?theme=${theme}`;
          await navigate(url);
          const r = await evaluate(auditScript);
          const problems = [];
          if (r.theme !== theme) problems.push(`theme=${r.theme}`);
          if (r.fonts !== 'loaded') problems.push(`fonts=${r.fonts}`);
          if (r.h1 !== 1) problems.push(`h1=${r.h1}`);
          if (r.scrollWidth > r.innerWidth + 1) problems.push(`scrollWidth ${r.scrollWidth}>${r.innerWidth}`);
          if (r.bad.length) problems.push(`overflow ${JSON.stringify(r.bad)}`);
          if (r.dupes.length) problems.push(`dupe ids ${r.dupes.join(',')}`);
          if (r.missingAnchors.length) problems.push(`missing anchors ${r.missingAnchors.join(',')}`);
          if (problems.length) failures.push({ page: `${dir}/${page}`, width, theme, problems });
        }
      }
    }
  }
  for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light']]) {
    checks++;
    console.log(`[audit] index.html ${width} ${theme}`);
    await setViewport(width, width === 390 ? 844 : 1000);
    await navigate(`http://127.0.0.1:${PORT}/index.html?theme=${theme}`);
    const r = await evaluate(auditScript);
    const problems = [];
    if (r.theme !== theme) problems.push(`theme=${r.theme}`);
    if (r.fonts !== 'loaded') problems.push(`fonts=${r.fonts}`);
    if (r.h1 !== 1) problems.push(`h1=${r.h1}`);
    if (r.scrollWidth > r.innerWidth + 1) problems.push(`scrollWidth ${r.scrollWidth}>${r.innerWidth}`);
    if (r.bad.length) problems.push(`overflow ${JSON.stringify(r.bad)}`);
    if (r.dupes.length) problems.push(`dupe ids ${r.dupes.join(',')}`);
    if (r.missingAnchors.length) problems.push(`missing anchors ${r.missingAnchors.join(',')}`);
    if (problems.length) failures.push({ page: 'index.html', width, theme, problems });
  }
  return { checks, failures };
}

const result = await audit();
console.log(`[audit] ${result.checks} 次检查，${result.failures.length} 个问题`);
if (result.failures.length) {
  for (const f of result.failures) console.log(JSON.stringify(f));
}

const SHOTS = [
  ['home', 1440, 1000, 'light'],
  ['home', 390, 844, 'light'],
  ['post', 1440, 1000, 'light'],
  ['post', 1440, 1000, 'dark'],
  ['post', 390, 844, 'light'],
  ['notes', 1440, 1000, 'light'],
  ['now', 1440, 1000, 'light'],
  ['archive', 1440, 1000, 'light'],
  ['tags', 1440, 1000, 'light'],
];

for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [390, 844, 'light']]) {
  await setViewport(width, height);
  await navigate(`http://127.0.0.1:${PORT}/index.html?theme=${theme}`);
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const name = `overview-${width}-${theme}`;
  const png = path.join(screens, `${name}.png`);
  writeFileSync(png, Buffer.from(shot.data, 'base64'));
  await sharp(png).webp({ quality: 82 }).toFile(path.join(screens, `${name}.webp`));
  rmSync(png);
  console.log(`[shot] ${name}.webp`);
}

for (const dir of DIRS) {
  for (const [page, width, height, theme] of SHOTS) {
    await setViewport(width, height);
    const url = `http://127.0.0.1:${PORT}/${dir}/${page}.html?theme=${theme}`;
    await navigate(url);
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const name = `${dir}-${page}-${width}-${theme}`;
    const png = path.join(screens, `${name}.png`);
    writeFileSync(png, Buffer.from(shot.data, 'base64'));
    await sharp(png).webp({ quality: 82 }).toFile(path.join(screens, `${name}.webp`));
    rmSync(png);
    console.log(`[shot] ${name}.webp`);
  }
}

writeFileSync(
  path.join(screens, 'audit.json'),
  JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2),
);

try {
  await send('Browser.close');
} catch {}
await sleep(400);
if (process.platform === 'win32' && !chrome.killed) {
  await new Promise((resolve) => {
    const killer = spawn('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    killer.on('exit', resolve);
  });
} else {
  chrome.kill();
}
server.close();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {}
console.log('[done] 截图与自检结果在 docs/next-phase/design/screens/');

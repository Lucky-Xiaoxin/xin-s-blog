// 抓文章内页细节（公式 / 图注 / 代码 / 表格）。只用于设计评审。
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
const PORT = 4176;
const DEBUG_PORT = 9224;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let file = path.join(root, decodeURIComponent((req.url || '/').split('?')[0]));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const profile = path.join(os.tmpdir(), `xin-blog-detail-${Date.now()}`);
const chrome = spawn(CHROME, [
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
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
    } catch {}
    await sleep(100);
  }
  if (!target) throw new Error('no page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  const waiters = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
      return;
    }
    const list = waiters.get(msg.method);
    if (list?.length) list.shift()(msg.params);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const waitEvent = (method) => new Promise((resolve) => {
    if (!waiters.has(method)) waiters.set(method, []);
    waiters.get(method).push(resolve);
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });

  for (const dir of ['d1', 'd2', 'd3']) {
    for (const section of ['s2', 's3']) {
      const loaded = waitEvent('Page.loadEventFired');
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${dir}/post.html?theme=light&v=${section}#${section}` });
      await Promise.race([loaded, sleep(6000).then(() => { throw new Error('load timeout'); })]);
      await evaluate('document.fonts.ready.then(() => true)');
      await evaluate(`document.getElementById('${section}')?.scrollIntoView({ block: 'start' }); true`);
      await sleep(250);
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const name = `${dir}-post-${section}`;
      const png = path.join(screens, `${name}.png`);
      writeFileSync(png, Buffer.from(shot.data, 'base64'));
      await sharp(png).webp({ quality: 82 }).toFile(path.join(screens, `${name}.webp`));
      rmSync(png);
      console.log(`[detail] ${name}.webp`);
    }
  }
  await send('Browser.close');
} finally {
  await sleep(300);
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const k = spawn('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      k.on('exit', resolve);
    });
  } else {
    chrome.kill();
  }
  server.close();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

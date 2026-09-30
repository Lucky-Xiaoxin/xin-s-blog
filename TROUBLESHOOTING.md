# 排错手册（报错原文 → 人话 → 修法）

这个站从建站到现在的**每一种真实报错**都记录在这里。遇到构建红了、线上怪，先来这里对号入座。

## 先记住三条原则

1. **构建失败 ≠ 网站坏了。** CI 是门禁：任何一步红，线上继续是上一次成功的版本，你没有能力推坏线上。
2. **看报错里的 `Location:` 行**，它直接指出文件和行号（js-yaml 行号从 0 数，报 5 就是第 6 行）。
3. **一次只改一处，改完就 `npm run build`**，让机器告诉你修没修好。

## 数据流（全站就这一张图）

```
你写 src/content/posts/*.md（frontmatter + 正文）
        │  规则由 src/content.config.ts 校验（写错字段名会拦你）
        ▼
npm run check    → 类型检查（const.ts/页面代码写错类型会拦）
npm run build    → Markdown 编译成 HTML（KaTeX 公式、Shiki 高亮都在这一步完成）
        │           产物进 dist/（这个目录不用管，随时可重建）
        ▼
git push origin main → GitHub Actions 自动跑上面两步 → 全绿才发布
        ▼
https://lucky-xiaoxin.github.io/xin-s-blog/（HTML 有约 10 分钟浏览器缓存）
```

## 对号入座表

| 报错原文（关键词） | 人话 | 修法 |
|---|---|---|
| `bad indentation of a mapping entry` | frontmatter 的 YAML 语法错了 | 看 Location 行号（从 0 数）。惯犯：`tags: ['a']['b']`（多个数组拼接）→ 改成 `tags: ['a', 'b']`；值里有 `: ` 没加引号；用了 Tab |
| `Duplicate id "xxx" found in ...` | **大概率是假警报**：另一个文件的 YAML 错误中断了同步，重试时误报重复 | 先修掉当次的 `bad indentation`，这个警告会自己消失（实测验证过，别为它改文件） |
| `Unrecognized key(s) in object: 'xxx'` | frontmatter 字段名拼错（如 `updatedDat`） | 对照 `src/content.config.ts` 里的六个字段名改回来。这是 `.strict()` 在保护你 |
| `pubTime 须为零填充 24h 制` | 写了 `'9:5'` 这种 | 改成 `'09:05'` 格式，必须两位:两位 |
| `[TAG_SHAPE] 标签「xxx」未登记形状` | 用了新标签但没登记徽章形状 | 去 `src/const.ts` 的 `TAG_SHAPE` 加一行 `新标签: '形状名'`。不修也能发布，只是徽章变圆形 |
| `InvalidContentEntryDataError ... title/description` | 必填字段漏了 | frontmatter 补上 `title` 和 `description` |
| 公式在页面上**标红** | KaTeX 语法错（如 `\foo` 不存在的命令） | 只影响那一个公式，不挡发布。中文、→、≤ 可直接写，不用 \text |
| 推完 GitHub，线上刷新没变 | 浏览器缓存（约 10 分钟） | 博客页 Ctrl+F5；在 github.com 上刷新、关浏览器重开都没用 |
| `could not read Username` / GCM 弹窗 | git 推送凭据过期 | 跟着弹窗登录一次 GitHub 即可 |
| Actions 页面里 run 红了 | 构建门禁拦下了一次有问题的发布 | 点进 run 看是哪一步：check 红=类型错，build 红=多半是 frontmatter。线上没坏，修好再推 |
| 文章页 404 | 文件名改了（旧 URL 消失）或 draft 还是 true | Pages 没有重定向机制，改文件名=换 URL，别改已发布文章的文件名 |

## 这个仓库的地图（一共就这几个地方）

| 位置 | 管什么 | 你会在里面改什么 |
|---|---|---|
| `src/content/posts/` | 文章本体 | **99% 的日常就在这**，其余都可以不碰 |
| `src/const.ts` | 站名/导航/标签形状/日期格式 | 新标签登记 TAG_SHAPE |
| `src/content.config.ts` | 文章的"格式法律" | 想加新字段时才动 |
| `src/pages/` | URL 结构（文件名即路由） | 基本不动 |
| `src/styles/global.css` | 全站外观（顶部是颜色/字体令牌） | 改配色字体 |
| `astro.config.mjs` | 构建器配置（域名/前缀/公式/高亮） | 基本不动 |
| `.github/workflows/deploy.yml` | 发布流水线 | 基本不动 |

## 还是搞不定？

把**报错原文整段**复制发给 AI 助手，并附一句「我在改 X，构建报这个，线上没坏」。报错信息足够具体时，黑盒就变白盒了——这个站的所有历史问题都是这么定位的。

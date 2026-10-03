# AGENTS.md

This file provides guidance to the AI agent when working with code in this repository.

Astro 5 静态博客，部署为 GitHub Pages **项目站**（子路径 `/xin-s-blog/`）。维护者是大三学生，单人使用，全程中文交流（文档、注释、commit message 均中文）。

## 交付双轨（用户明确要求，不可混用）

- **写/改文章**（`src/content/posts/`）：直推 main 即可。但**文章是用户的内容，未经同意不要代写代改**；发现语法错只报告，让他自己修（学习导向）。
- **框架改动**（其余一切）：`git switch -c xxx` 分支 → 本地 `npm run check && npm run build` → push → 用 GitHub MCP 建 PR（正文含摘要/明细/测试计划）→ 合并 → `git pull` 同步 main。

Commit 前缀风格：`ci: / fix: / style: / docs: / content:` + 中文描述。

## 非显而易见的约定

- `pubTime`（`'HH:MM'`）是**刻意纯显示字段**，不参与日期运算——排序用 pubDate(+pubTime 作 tiebreaker)、RSS 只认 pubDate。不要"顺手"把它并进 pubDate，会重新引入时区坑。
- 站内链接必须走 `src/const.ts` 的 `u()`/`resolveHref()` 补子路径前缀；文章正文资源用相对路径（`/` 开头构建不补前缀，线上必 404）。
- `SITE_URL`/`BASE_PATH` 由 `.github/workflows/deploy.yml` 构建期注入，`astro.config.mjs` 的默认值**只影响本地**——改域名/改路径要改 deploy.yml。
- 构建时出现 `Duplicate id "xxx"` 警告多半是**假警报**：其他文件 YAML 错误中断同步所致，先修真正的 `bad indentation`，它会自己消失（详见 TROUBLESHOOTING.md）。
- KaTeX 配了 `throwOnError: false`：坏公式页面标红但不挡发布，这是有意的。
- 明暗主题三处联动：`Base.astro` 里 `<head>` 内联脚本负责首屏防闪色（别挪位置、别改成打包脚本）→ `data-theme='dark'` 属性驱动 `global.css` 的深色令牌 → Shiki 双主题：亮色色值内联、暗色色值与两侧字体风格走 `--shiki-dark`/`--shiki-light-*` 变量（global.css 的 `.astro-code span` 必须消费 light 侧字体变量，删掉它就丢代码粗体/斜体）；改代码高亮配色要同改 `astro.config.mjs` 的 `themes`。
- 中文字体是构建期子集：`scripts/subset-fonts.mjs`（predev/prebuild 自动跑）扫描 src 下 .astro/.ts/.js 全文 + md 的 frontmatter/标题行/引用行，裁出思源宋体子集写进 `src/assets/fonts/`（已 gitignore）。正文刻意不收（走系统无衬线）；新增「非 h1~h3/brand/摘要/引用」的衬线用例时，必须让它的文案落进上述扫描来源，否则那个字会静默回退系统宋体。
- 文章印记是确定性映射：`const.ts` 的 `sealHash` + `SEAL_CORES`——名单按几何相容性筛选（红点/内芯必须完整落在外框内，triangle/rhombus/hexagon 各有剔除项，semicircle 的 tri/axis 红点由 `Seal.astro` 的 `FRAME_DOTS` 按框覆写）；重排名单、改哈希或换 `TAG_SHAPE` 都会换掉既有文章的印记（有意为之才能动）；新增内芯必须先过一遍框内几何验证再加。
- deploy job 有 `if: github.ref == 'refs/heads/main'` 守卫、`pages: write` 只给 deploy job——不要"简化"回顶层权限。
- README 与 TROUBLESHOOTING.md 是维护者的主要参照，**行为变更后必须同步更新**（历史审计曾发现多处文档失真；改完核对每条可验证断言）。

## 工作流杂项

- 建稿用 `npm run new -- <文件名>` 或双击根目录「新建文章.bat」，不要手抄 frontmatter。
- 新标签必须登记进 `src/const.ts` 的 `TAG_SHAPE`，否则构建告警。
- Node 需 20.3+/22+（`@shikijs/themes` 要求 >=20）。
- agent shell 里 `git push` 凭据通常已缓存；若报 `/dev/tty` 错误，让用户在输入框用 `! git push` 代跑一次。
- GitHub Pages HTML 有约 10 分钟浏览器缓存：用户说"推上去没变"先让他 Ctrl+F5 再排查。
- 不要提议添加 LICENSE（用户已明确拒绝）。
- CI 门禁 = `astro check` + `astro build`，任一失败不发布、线上保持旧版——不存在"推坏线上"，但也不要跳过 check 直推框架改动。

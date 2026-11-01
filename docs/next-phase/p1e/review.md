# P1e 验收记录

> 状态：实施中 · 2026-11-01（实现与本地验证完成；待用户本地试用确认后合并，合并后状态改「已验收」）
> 证据：本记录 + `screens/` 截图；分支 `feat/seo-a11y-print`，提交 ①SEO ②可访问性 ③打印 ④文档

## 1. 跑了什么、结果

| 命令 | 结果 |
| --- | --- |
| `npm run check` | 0 error / 0 warning / 0 hint |
| `npm run verify` | **PASS**——artifacts 8/8、links 307+19 锚点、drafts 无泄漏(published=4, notes=1)、seo OK(posts=4)、rss/sitemap OK、dom OK；体积 CSS 15.2/18KB · JS 0/3KB · 字体 1.42/1.5MB · max HTML 26.6/30KB(JSON-LD 使其 +1.4KB) · dist 1.7/2.6MB |
| `npm run audit` | 0 vulnerabilities |

浏览器实测基于 `preview:prod`（生产子路径产物），ZCode 内置浏览器；视口 1440/390/320。

## 2. 实测结果（契约逐条）

### F5 中文小字 ≥12px（计算样式实测）

| 位置 | 改前 | 实测 |
| --- | --- | --- |
| 卷首图例 `.frontispiece__legend a` | 10–11px | **12px**（320/390/1440 一致，不再随视口缩小） |
| 页边头 `.margin-notes__head a`（全部碎碎念 →） | 10px | **12px** |
| 导航 `.nav a`（320/390） | 11px | **12px**（320 靠缩 gap 单行放下） |
| `.label`（页脚/把手） | 11px | **12px**；页脚字距 0.2em→0.05em（0.2em 只给拉丁大写） |
| `.tag` | 11px | **12px** |
| P1d 同类（契约界线覆盖的遗漏点） | 11px | spec dt / 印记图注 / pager「更早/更新」均 **12px** |
| 等宽日期/计数（评审确认保留） | 11–12px | 未动 ✓ |

### F6 热区（原始矩形 + ::after/::before 扩边 = 有效命中区）

| 目标 | 有效命中 | 达标 |
| --- | --- | --- |
| 标签 `a.tag` | 54×47 | ✓ |
| 「全部碎碎念 →」 | 96×47 | ✓ |
| 「看看 →」 | 54×49 | ✓ |
| 页脚链接 | 高 51 | ✓（P1a 已有扩边，未改） |
| 主题开关 | 55×44（原 40 高） | ✓ |

相邻热区重叠检测（扩边后两两求交）：相邻标签 **ox=0**、相邻页脚链接 **ox=0**、开关×导航 **ox=0**、页边头×碎碎念首行 **oy=0**（头距 0.35→0.9rem 与扩边量互为 mirror）。全部不重叠；`gap` 镜像规则写入 CSS 注释。

### N3 图例「现在」格截断（故障注入）

now description 临时注入超长文案（scrollWidth 1549px）→ 实测截断至 clientWidth 301px、`text-overflow: ellipsis` 生效，三格高度保持 44/44/46，320–1440 无横向滚动；截图 `screens/n3-injection-390-ellipsis.png`。**已还原**为「emo中……」并重建。

### F15 tagline

1440 实测 `.tagline` 单行（`taglineLines: 1`），无孤行；`<title>` 为「二进制与诗 — 计算机系统、算法与开发工具，一个本科生的手记。」；`SITE.description` 仅存于 meta description / og:description（引用点已核实）。

### SEO

- 文章页 JSON-LD：`BlogPosting`（headline/datePublished/dateModified/author/keywords/mainEntityOfPage）+ `BreadcrumbList`（目录→首个标签→文章，3 级）均 `JSON.parse` 通过。
- OG：`og:locale=zh_CN`、`og:image:width=1200`、`og:image:height=630` 全页面就位；文章页 `article:published_time` / `article:modified_time` / `article:tag`（每标签一条）齐全。
- check-dist 新门禁自检：4 篇文章页全部通过（含「JSON-LD 缺失/不可解析/缺 @type/缺 BlogPosting/缺 BreadcrumbList」五种失败路径的规则覆盖）。
- 回归项（契约 §1 摸底确认已存在）：sitemap 无 404、canonical/404 noindex、reduced-motion、打印隐藏——check-dist 全绿即回归通过。

### 主题

亮/暗截图（`screens/home-1440-light.png`、`home-1440-dark.png`、`article-1440-light.png`、`article-1440-dark.png`）渲染正常；开关切换后 `data-theme`/`aria-checked`/`title` 三者同步（N1 无回归）。

## 3. 失败注入汇总

| 注入 | 表现 |
| --- | --- |
| dev 草稿标题含 `</script>` | 产物 JSON-LD 中为 `\u003c/script>`，脚本结构不逃逸；两块 JSON-LD `JSON.parse` 通过，headline 反序列化后还原出原始 `</script>`；草稿已删 |
| now 描述超长 | 见 N3，布局不破；已还原 |
| 打印规则 | `dist` CSS 中确认 `.prose .scroll-x,.prose pre,.prose table,.prose img{break-inside:avoid}` 存在 |

## 4. 允许差异（d1 视觉对照）

- tagline 文案与 d1 不同：2026-11-01 用户选定 A 文案、单行显示（F15 有意变更）。
- 中文小字普遍 +1px（F5 有意变更）；页边头与首条碎碎念间距 +0.55rem（F6 热区间距要求）。
- 图例「现在」格长文案截断（N3，d1 无此场景）。
- 其余布局/几何/配色与 d1 一致（对照 `../design/screens/d1-*`，截图见 `screens/`）。

## 5. 未覆盖

| 项 | 状态 |
| --- | --- |
| 键盘 Tab 全流程 | IAB 自动化环境中 Tab 焦点被外壳拦截（环境限制，非站点问题）；已验证 skip 链接可达且 `:focus-visible` 生效。**完整走查请用户本地试用时按 Tab 查看** |
| 打印 PDF 目测 | break-inside 规则已进产物（grep 验证）；纸面分页效果请用户本地打印/存 PDF 确认 |
| 读屏抽查 | 未做；建议用户真机阶段顺带开启 VoiceOver/TalkBack 走一遍首页 |
| 真机走查 | 按 Q2 约定：合并上线后用户执行一分钟清单（见 §6） |

## 6. 真机一分钟清单（上线后执行）

手机访问线上站，横竖屏各看一遍四样：**首页 / 任一文章 / 标签页 / 碎碎念页**——看小字是否清楚、标签和按钮是否好点。任何不对劲截图反馈，开独立小修。

## 7. 结论

P1e 范围内 12 项全部实现，命令级门禁与浏览器实测全绿，体积预算余量健康（CSS 15.2/18KB，JSON-LD 增量被 max HTML 预算吸收）。**阶段达标，待用户本地试用确认后 push/PR/合并。**

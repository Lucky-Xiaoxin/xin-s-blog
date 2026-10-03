---
title: 'Github配置代理'            # 必填：文章标题（目录页、浏览器标签、RSS 都用它）
description: '解决Github连接不稳定的问题'      # 必填：一句话摘要（目录页卡片、RSS、分享预览用）
pubDate: 2026-09-30  # 发布日期，脚本已自动填，发布前可手改
pubTime: '20:35'     # 发布时间 24h 制，仅显示用；不要显示就删整行
tags: ['工具','Git','GitHub']       # 从下面清单挑，可多个；新标签须先去 src/const.ts 的 TAG_SHAPE 登记形状
# ── 可用标签（按徽章形状分组）────────────────────────
#  △ 三角: 算法 / 题解 / 单调栈
#  ⬡ 六边: 计算机系统 / CSAPP / 读书笔记 / 其它
#  □ 方形: Go / 后端 / 课程实验
#  ◇ 菱: 建站 / Astro / GitHub Pages
#  ◠ 半圆: 工具 / Git / Github / Linux / 效率
# 未登记的标签会回退成 ○ 圆形并在构建时告警
draft: false          # 草稿箱：true 时不进目录页/RSS；定稿改成 false 或删整行
---

<!-- github-remote-ques：正文从这里开始…… -->
<!-- 公式：$行内$ 或 $$独立成行$$，KaTeX 语法——中文、→、≤、≥ 可直接写；真语法错（如 \foo）页面标红，不挡发布 -->

## Watt Toolkit代理

> *也是写给自己看别老去翻 Deepseek 记录*

先检查**有没有**代理

```bash
git config --global --get http.proxy
git config --global --get https.proxy
```

然后开工具配置代理

```bash
# git config --global http.proxy 127.0.0.1:你的代理端口
# git config --global https.proxy 127.0.0.1:你的代理端口
# Watt Toolkit默认是 26561
git config --global http.proxy 127.0.0.1:26561
git config --global https.proxy 127.0.0.1:26561
```

要清除配置

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```


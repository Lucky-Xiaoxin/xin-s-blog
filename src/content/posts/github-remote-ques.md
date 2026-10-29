---
title: 'GitHub 配置代理'                  # 文章标题（目录页、浏览器标签、RSS 都用它）
description: '解决 GitHub 连接不稳定的问题'   # 一句话摘要（目录页卡片、RSS、分享预览用）
pubDate: 2026-09-30                      # 发布日期；排序和 RSS 只认它
pubTime: '20:35'                         # 发布时间 24h 制，仅显示用；不要显示就删整行
tags: ['工具', 'Git', 'GitHub']           # 清单见 src/const.ts 的 TAG_SHAPE，新标签须先去那里登记形状
updatedDate: 2026-10-29                  # 可选：最后一次修订的日期
draft: false                             # 草稿箱：true 时不进目录页/RSS；定稿改成 false 或删整行
---

> *也是写给自己看，别老去翻 DeepSeek 记录*

## 什么时候用

`git clone` 卡住、`git push` 一直转圈、连 GitHub 首页都打不开的时候，先考虑代理。

## 先检查有没有配过

别急着设，先看看是不是早就配过了——重复设置容易把自己绕晕：

```bash
git config --global --get http.proxy
git config --global --get https.proxy
```

两条命令都不输出，就是没配过。

## 开 Watt Toolkit 再设

Watt Toolkit 默认端口是 26561，开好工具之后：

```bash
git config --global http.proxy 127.0.0.1:26561
git config --global https.proxy 127.0.0.1:26561
```

端口以工具界面显示的为准，被别的软件占了就换一个。

## 清除配置

不用代理了就撤掉：

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

代理算是给自己加的手刹，用完记得拆。

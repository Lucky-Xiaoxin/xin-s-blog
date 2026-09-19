---
title: '我的 Linux 桌面工作流（2026 版）'
description: '大三这一年把日常开发从 Windows 挪到了 Arch + Hyprland，记录一下真正节省时间的几个配置。'
pubDate: 2026-06-30
tags: ['工具', 'Linux', '效率']
---

> 这是一篇示例文章，用来演示博客的排版效果。内容随时可以替换成你自己的。

先说结论：**换桌面省下的是"来回切换上下文"的时间，不是编译时间。** 换完之后我的 `npm i` 反而更慢了，但一天里被打断的次数明显少了。

## 真正有用的四件事

- **Hyprland + 固定工位。** 1 = 编码，2 = 终端，3 = 浏览器，4 = 聊天。规则写死后就不再需要 `Alt+Tab` 找窗口。
- **`zellij` 代替 `tmux` 手搓布局。** 内置状态栏和浮层，少写 200 行配置。
- **`ripgrep` + `fzf` 作为默认搜索。** VS Code 里的全局搜索我基本不用了。
- **`direnv`。** 每个仓库一个 `.envrc`，进目录自动加载 JDK/Node 版本，比手动 `nvm use` 可靠。

## 一段配置片段

```nix
# 让 dnf/pacman 之外的手动工具也有稳定的 PATH 入口
home.sessionPath = [ "$HOME/.local/bin" "$HOME/go/bin" ];
home.packages = with pkgs; [ ripgrep fzf zellij direnv hyprland ];
```

## 放弃的东西

- **i3**：平铺逻辑够用，但缺动画让人更找不到窗口。
- **NixOS**：声明式很爽，但课程实验要的某些闭源驱动我搞不定，暂时退回 Arch。
- **终端里写代码**：试过 NeoVim 两个月，最后只留下了 `nvim` 作为 git 的 `$EDITOR`。

> 工具链的边际收益递减得很早。第四周之后，我花在配置上的时间已经超过省下的时间——所以现在的规则是：**只在被同一个问题烦到第三次时才改配置。**

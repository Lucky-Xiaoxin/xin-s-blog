---
title: '用 Go 写一个 60 行的静态文件服务器，顺手搞懂路径穿越'
description: '课程实验要求手搓一个 HTTP 静态服务器。记录一下怎么在 60 行里同时避免被 ../ 打穿。'
pubDate: 2026-07-19
tags: ['Go', '后端', '课程实验']
---

> 这是一篇示例文章，用来演示博客的排版效果。内容随时可以替换成你自己的。

实验要求"不使用第三方框架"，于是 `net/http` 的 `FileServer` 被禁用了。重新写一遍反而第一次真正理解了 URL 到磁盘路径的映射。

## 最小心智模型

```go
func staticHandler(root string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // r.URL.Path 已由 ServeMux 清理过 ../，但不要依赖这个前提
        clean := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
        target := filepath.Join(root, clean)

        // 关键一步：拼接后必须仍在 root 之内
        if !strings.HasPrefix(target, filepath.Clean(root)+string(os.PathSeparator)) {
            http.Error(w, "forbidden", http.StatusForbidden)
            return
        }

        info, err := os.Stat(target)
        if err != nil || info.IsDir() {
            http.Error(w, "not found", http.StatusNotFound)
            return
        }
        http.ServeFile(w, r, target)
    }
}
```

## 三个容易漏的点

- **`filepath.Join` 已经内置 `Clean`**，所以 `%2e%2e%2f` 解码后的 `../` 会被吃掉——但只在你**先 Join 再校验**的前提下成立。先校验再 Join 就可能被绕过。
- **目录要单独挡掉**。否则请求 `root/../` 会命中一个目录，`ServeFile` 会尝试生成目录列表。
- **Windows 上还有反斜杠**。`filepath.Clean` 在 Windows 会把 `/` 换成 `\`，测试时两种写法都跑一遍。

> 后来才知道 `http.FileServer` 内部做的就是同一件事：先 `path.Clean`、再 `os.Open`，并且对 `..` 有特殊分支。

## 还没做

`Range` 请求和 `ETag` 直接交给 `ServeFile` 了，但 MIME 类型目前靠后缀猜，遇到无扩展名的文件就返回 `application/octet-stream`。等老师放行 `mime.TypeByExtension` 之后再补。

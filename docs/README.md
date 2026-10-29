# docs 索引

本站的说明文档都在这里，分两类：

| 文档 | 放什么 | 给谁看 |
| --- | --- | --- |
| [writing-style.md](writing-style.md) | **写文章的规范**：frontmatter、正文骨架、标题层级、公式/代码/链接的写法、语气与排版、发布前自查 | 维护者自己（写之前扫一眼） |
| [example.md](example.md) | 一篇**可照抄的示例文章**：把上面每条规则都用一遍 | 维护者自己（不知道长什么样时看这个） |
| [next-phase/](next-phase/README.md) | 站点改版的阶段规划、契约、验收记录 | agent 与维护者（改框架时查） |

## 怎么用

1. 写新文章：`npm run new -- <文件名>` 建稿 → 复制 [example.md](example.md) 的骨架 → 对照 [writing-style.md](writing-style.md) 逐条过。
2. 改旧文章：同样按 [writing-style.md](writing-style.md) 过一遍，**不要**顺手改作者的意思；只做结构与格式的规范化。
3. 改框架（样式、组件、路由、构建）：看 [next-phase/README.md](next-phase/README.md)，走分支 + PR。

规范和示例本身也受同一条规矩约束：文档里不留过期的事实快照。标签清单看 `src/const.ts` 的 `TAG_SHAPE`，命令与体积看根目录 README。

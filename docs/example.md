<!--
示例文章：把 docs/writing-style.md 的每条规则都用了一遍。

用法：把下面 `---` 开始的全部内容复制到 src/content/posts/<你的文件名>.md，
然后改 title / description / pubDate / pubTime / tags，并把 draft 改成 false（或删掉整行）。
文件名只用小写字母、数字和连字符，它就是这篇文章的网址。
-->

---
title: '单调栈：从暴力 O(n^2) 到一遍过'          # 文章标题（目录页、浏览器标签、RSS 都用它）
description: '下一个更大元素，用单调栈把 O(n^2) 压到 O(n)，顺便记一下我踩过的两个坑'   # 一句话摘要（目录页卡片、RSS、分享预览用）
pubDate: 2026-10-29                             # 发布日期；排序和 RSS 只认它
pubTime: '21:30'                                # 发布时间 24h 制，仅显示用；不要显示就删整行
tags: ['算法', '单调栈']                        # 清单见 src/const.ts 的 TAG_SHAPE，新标签须先去那里登记形状
updatedDate: 2026-10-29                         # 可选：最后一次修订的日期
draft: true                                     # 草稿箱：true 时不进目录页/RSS；定稿改成 false 或删整行
---

> *又是被单调栈统治的一天*

前两天刷题碰到「下一个更大元素」，我上来就写了 $O(n^2)$ 的暴力，提交超时，被队友笑了一路。

后来重写成一遍过，才发现自己卡住的地方根本不是单调栈，而是**没想清楚栈里存的是值还是下标**。

## 题目

给一个整数数组 $a$，对每个位置 $i$，求出它右边第一个比 $a_i$ 大的元素的下标；不存在则记为 $-1$。

对应 LeetCode 496：[Next Greater Element I](https://leetcode.cn/problems/next-greater-element-i/)

## 思路

### 暴力做法

对每个位置都往右扫一遍，碰到第一个更大的就停：

```cpp
for (int i = 0; i < n; ++i) {
  for (int j = i + 1; j < n; ++j) {
    if (a[j] > a[i]) { ans[i] = j; break; }
  }
}
```

时间复杂度 $O(n^2)$，$n$ 一大就超时。

### 单调栈做法

从左往右扫，用一个栈存**下标**，并让它对应的值保持单调递减：

1. 当前值比栈顶大，就把栈顶下标弹出来，答案就是当前下标
2. 一直弹到当前值不再比栈顶大为止
3. 当前下标入栈

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> nextGreater(const vector<int>& a) {
  int n = (int)a.size();
  vector<int> ans(n, -1);
  stack<int> st;  // 存下标，对应的值单调递减

  for (int i = 0; i < n; ++i) {
    while (!st.empty() && a[st.top()] < a[i]) {
      ans[st.top()] = i;   // i 就是栈顶位置右边第一个更大的
      st.pop();
    }
    st.push(i);
  }
  return ans;
}
```

每个下标进栈一次、出栈最多一次，所以：

| 做法 | 时间复杂度 | 空间复杂度 | 代码量 |
| --- | --- | --- | --- |
| 暴力 | $O(n^2)$ | $O(1)$ | 少 |
| 单调栈 | $O(n)$ | $O(n)$ | 多几行 |

## 踩过的坑

- **栈里存值还是存下标**：存值就找不到答案的位置，只能事后再扫一遍，复杂度又退回去了。存下标才能在弹栈时直接写 `ans[st.top()] = i`。
- **相等的时候弹不弹**：上面用的是 `a[st.top()] < a[i]`，严格小于。本题要的是右边第一个比它**大**的，相等不算，所以不弹；如果题目改成"大于等于"，条件就换成 `<=`。

## 结论

单调栈其实就一句话：**被新元素盖过的旧元素，立刻出栈结算**。

剩下的活儿就交给栈去做。

😴

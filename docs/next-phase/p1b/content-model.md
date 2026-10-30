# P1b 内容模型：notes 与 pages

> 状态：已验收 · 2026-10-24（内容模型已按此实现并通过验收复核）
> 上游：`notes-contract.md`、`now-contract.md`、`design-contract.md` §5.4/§6.8
> 下游：`src/content.config.ts`、`src/lib/notes.ts`、`src/lib/now.ts`、`/notes/`、`/now/`
> Owner：实现规划师
> 复核/证据：`review.md` §2（数据层校验用例）、§5（字体子集抽查）

本文把上游契约里容易歧义的地方钉死：锚点、排序、校验、草稿、日期语义、字体子集来源。语义冲突时以本文 + `AGENTS.md` 不变量为准；要改先改本文并征得用户同意。

## 1. 两个 collection

| collection | 目录 | 文件 | 用途 |
| --- | --- | --- | --- |
| `notes` | `src/content/notes/` | 顶层 `*.md` | 碎碎念流；不生成独立页面 |
| `pages` | `src/content/pages/` | 顶层 `*.md` | 静态页内容；首版只有 `now.md` |

两个 collection 都用 `.strict()`：写错字段（例如给 note 加 `title`）直接构建失败，不静默忽略。

### 1.1 notes schema

```ts
// 注意：js-yaml 会把未加引号的 2026-10-22 解析成 Date 对象，
// 所以先归一化再校验；不能只写 z.string()，否则自然写法会直接失败。
const dateOnly = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date 须为 YYYY-MM-DD（只写日期，不带时间/时区）')
    .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'date 不是有效日期')
    .transform((s) => new Date(`${s}T00:00:00Z`)),
);

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    date: dateOnly,
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time 须为零填充 24h 制，如 09:30')
      .optional(),
    draft: z.boolean().default(false),
  }).strict(),
});
```

- **没有** `title`、`description`、`tags`；需要标题就写成文章。
- `date` 只接受 `YYYY-MM-DD`，由 transform 固定为 UTC 零点。不要让 `z.coerce.date()` 接受带时区的字符串——那会让“文件名日期”和“显示日期”在负时区差一天。
- YAML 的未引号日期会先变成 `Date`，`preprocess` 取它的 UTC 日期字符串再校验；带时间的写法会在文件名一致性检查（N2）处报错，而不是悄悄换日。
- `time` 只用于显示；不参与 RSS `pubDate`、不参与日期运算；小时 00–23、分钟 00–59。
- 正文为空（`body.trim() === ''`）在数据层校验时报错，schema 本身看不到 body。

### 1.2 pages schema

```ts
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    updatedDate: dateOnly,
    draft: z.boolean().default(false),
  }).strict(),
});
```

- `updatedDate` 与 notes 同一套 UTC 日期；页面显示 `最后更新于 YYYY.MM.DD`。
- `title` 首版固定“现在”；`description` 同时用作 `<meta name="description">` 和 now 页导语，**首版为用户定的单行状态 `emo中……`**。
- 以后 about 迁进 `pages` 时可以复用；首版不迁。

## 2. 文件命名与锚点（已定）

### 2.1 命名

- notes 必须是**顶层**文件：`src/content/notes/YYYY-MM-DD-slug.md`，例如 `2026-10-22-design-agent.md`。
- `slug` 用小写字母、数字、连字符；不要中文、空格、下划线、大写。
- 以 `_` 开头的文件（如 `_template.md`）是模板，**永远不是 note**：`notes.ts` 在过滤/排序/校验前就排除。
- 同一天可以有多条，只要 slug 不同；文件名不会重复，所以 id 不会重复。

### 2.2 锚点

```text
anchor = 'n-' + id
id     = 文件名去掉 .md
例：2026-10-22-design-agent.md → #n-2026-10-22-design-agent
```

- **永远带 slug**，不做“同一天第一条只写 `n-2026-10-22`、第二条才加 slug”的简写。
- 理由：简写规则必须先定“哪条算第一条”；以后插入一条更早的同日 note，既有锚点会漂移，RSS/外部链接会断。
- 锚点只由文件名决定，与发布时间、排序、草稿状态无关。
- `/notes/` 的月份小节 id 为 `notes-YYYY-MM`（如 `notes-2026-10`），与 note 锚点区分。

## 3. 排序与分组

### 3.1 note 排序（固定）

```text
date 倒序
→ 同日 time 倒序（无 time 视为 ''，排在同日有时间的后面）
→ 同日同 time 按 id 倒序（稳定兜底）
```

- 日期比较用 `Date.valueOf()`（UTC 零点），不用本地 getter。
- `time` 是零填充 `HH:MM`，可直接 `localeCompare`。
- 排序结果同时用于 `/notes/`、notes RSS、首页最近 3 条（P1c）；不要在各页面各自写一套。

### 3.2 月份分组

- 按 `date` 的 **UTC** 年/月分组；月份倒序；组内沿用 3.1 的排序。
- 月份标题：`YYYY 年 M 月`（如 `2026 年 10 月`）；不补零。
- 月份小节 id：`notes-YYYY-MM`；`aria-labelledby` 指向标题。
- 月份计数从当前列表推导，不写死。

## 4. 校验、警告与错误信息

数据层统一在 `src/lib/notes.ts` 的 `loadNotes()` 里执行；所有页面/RSS 都走它，避免“notes 页校验了、RSS 没校验”。

| 编号 | 条件 | 级别 | 行为/提示（建议文案） |
| --- | --- | --- | --- |
| N1 | `id` 不匹配 `^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$` | error | `碎碎念文件名须为 YYYY-MM-DD-slug.md（小写/数字/连字符）：<id>` |
| N2 | `id` 前 10 位与 `date.toISOString().slice(0,10)` 不一致 | error | `碎碎念 <id> 的 date 与文件名日期不一致：date=YYYY-MM-DD` |
| N3 | 正文去空白后为空 | error | `碎碎念 <id> 正文为空` |
| N4 | 去空白后字符数 > 800 | warning | `碎碎念 <id> 超过 800 字，考虑写成文章` |
| N5 | `date` 晚于构建日（UTC） | warning | `碎碎念 <id> 日期在未来；不会自动隐藏` |
| N6 | schema 出现未知字段（title/description/tags 等） | error | Zod 报错；`.strict()` 默认信息即可 |
| N7 | `time` 不是合法 `HH:MM`（00–23 / 00–59） | error | Zod 自定义文案 |
| N8 | `date` 不是 `YYYY-MM-DD` 或不是有效日期 | error | Zod 自定义文案 |

- error 让 `npm run build` / `npm run verify` 失败；warning 只打印，不阻断（与文章“坏公式标红不挡发布”的哲学一致，但字段错误必须挡）。
- 校验对**所有** notes 执行（包括 draft），在过滤草稿之前；草稿写错也要在 dev/build 暴露。
- 重复 id 在文件系统层面不可能；重复锚点由 `/notes/` 的重复 id 门禁兜底。

### 4.1 pages 校验

- schema 已保证 `title`/`description` 非空、`updatedDate` 为合法日期。
- `now.md` 的**正文允许为空**：首版只有 `description: 'emo中……'`，页面只渲染页头 + 最后更新，不渲染 `.now-body`/`.now-foot`。
- 如果以后写正文，建议 4–6 个 `##`（在学/在做/在读/最近），每节 1–3 条，总量约 1 屏；两列样式只在有正文时启用。
- 不做 `updatedDate` 未来日期警告（它不是发布时间，只是状态日期）。

## 5. 草稿行为

| 场景 | dev（`import.meta.env.DEV`） | build / verify |
| --- | --- | --- |
| `/notes/` 列表 | 含草稿，条目旁显示“草稿预览” | 不含草稿 |
| `/notes/rss.xml` | 只含已发布（feed 不随 dev 变） | 只含已发布 |
| `/now/` | 草稿可预览，页头显示“草稿预览” | 草稿 → 空状态，不渲染正文/日期 |
| 首页最近 notes / notes 计数（P1c） | 只算已发布 | 只算已发布 |
| 字体子集 | 扫描所有 notes/pages（含草稿） | 同左；避免发布前才发现缺字 |

- 不为 notes 生成独立页面，所以不存在“草稿 note 页泄漏”；泄漏点是列表/RSS/首页数据。
- 不推荐“把 draft 改成 false 预览再改回”；dev 已支持。
- `now.md` 首版内容已定（单行 `emo中……`，`draft: false`）；若用户以后改回草稿，push 前需明确接受 `/now/` 的空状态。

## 6. 数据 API（`src/lib/notes.ts` / `src/lib/now.ts`）

### 6.1 notes

```ts
export type Note = CollectionEntry<'notes'>;

/** 面向读者：已发布，按 3.1 排序 */
export async function getPublishedNotes(): Promise<Note[]>;

/** /notes/ 页面：dev 含草稿，build 只含已发布 */
export async function getNotesForPage(): Promise<Note[]>;

/** 首页（P1c）：已发布最近 N 条；N 由调用方传，默认不写死 */
export async function getRecentNotes(limit: number): Promise<Note[]>;

/** 分组：按 UTC 年月倒序，组内已排序 */
export interface NoteMonth {
  key: string;      // YYYY-MM
  year: number;
  month: number;
  label: string;    // YYYY 年 M 月
  notes: Note[];
}
export function groupNotesByMonth(notes: Note[]): NoteMonth[];

/** 锚点：唯一来源，页面/RSS/check 都用它 */
export function noteAnchor(note: Note): string; // `n-${note.id}`
```

- 页面不要直接 `getCollection('notes')`；过滤/排序/校验只在 `notes.ts`。
- 页面需要“已发布计数/最近日期”时从 `getPublishedNotes()` 推导，不要用含草稿的列表计数。
- `render(note)` 在页面 frontmatter 里预计算（`Promise.all`），模板里只渲染组件，避免在模板中 await。

### 6.2 now

```ts
export type Page = CollectionEntry<'pages'>;

export async function getNow(
  opts: { includeDrafts?: boolean } = {},
): Promise<Page | undefined>;
```

- `getEntry('pages', 'now')`；不存在返回 `undefined`。
- `draft: true` 且 `includeDrafts !== true` → `undefined`。
- `/now/` 传 `includeDrafts: import.meta.env.DEV`；首页（P1c）只取已发布（不传或 `false`），用于图例/一行摘要。
- now 摘要用 `data.description`，不要从正文截断。

## 7. 模板与内容交接

### 7.1 notes 模板

新增 `src/content/notes/_template.md`：

```md
---
date: 2026-01-01
time: '00:00'
draft: true
---

<!-- 复制本文件为 YYYY-MM-DD-slug.md，改 date/time，写 1–5 句；_ 开头的文件不会显示。 -->
```

- `_template.md` 必须能被 schema 通过（有合法 date），但永远被 `notes.ts` 排除；不会出现在页面/RSS。
- 首版 **0 条真实 note（用户 2026-10-23 确认）**，`/notes/` 显示空状态；测试用临时中性夹具，发布前删除；不代写。

### 7.2 now 内容（首版已定）

新增 `src/content/pages/now.md`，首版为用户确认的单行状态，**正文为空**：

```md
---
title: '现在'
description: 'emo中……'
updatedDate: 2026-10-23
draft: false
---
```

- `updatedDate` 填实际发布日（实施当天为 2026-10-23，可改）；页面显示 `最后更新于 2026.10.23`。
- 正文为空时不渲染 `.now-body`/`.now-foot`；页面只有页头 + 状态行，不留空框。
- 以后想写小节，在 `---` 下面加 `## 在学` 等 Markdown；两列/编号样式自动启用。
- 不提交“看起来像真事”的示例（课程、比赛名次、读书进度等）。

## 8. 字体子集来源

`scripts/subset-fonts.mjs` 现在只扫 `src/content/posts`；P1b 增加：

| 目录 | 收什么 | 为什么 |
| --- | --- | --- |
| `src/content/notes` | frontmatter 全文、`^#{1,6}\s` 标题行、`^>` 引用行 | note 日期/月份标题在 `.astro`（已扫）；note 内引用走衬线；正文段落继续不收 |
| `src/content/pages` | 同上 | now 未来写 `h2`（在学/在做/在读/最近）或引用时走衬线；首版单行导语走无衬线，正文段落不收 |

- 扫描规则与 posts 保持一致，不新造一套。
- 递归扫描子目录（图片目录不影响的 `.md` 来源）；`_template.md` 也扫，多收无害。
- 验收：构建后 `scripts/subset-fonts.mjs` 无缺字 warning；用 fontkit 抽查 notes 夹具引用行的中文字符（以及以后 now 小节标题字符）在子集里；浏览器 computed font-family 命中 `Noto Serif SC`。
- 如果用户新增 now 小节标题不在子集里，构建日志会警告；不要静默回退系统宋体。

## 9. 非目标

- 不做 notes 的 title/summary/tags/categories。
- 不做 note 独立 URL、逐条 OG、逐条 JSON-LD。
- 不做 now 历史版本、now RSS、多语言。
- 不做自动从外部平台同步。

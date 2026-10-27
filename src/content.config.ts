import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// 只写日期的字段统一走这里：YAML 会把未加引号的 2026-10-22 解析成 Date 对象，
// 先归一化成 YYYY-MM-DD 再校验，最后固定成 UTC 零点——
// 不能用 z.coerce.date()，那会接受带时区的字符串，让日期在负时区差一天。
const dateOnly = z.preprocess(
  (v) => {
    if (!(v instanceof Date)) return v;
    // YAML 的 date-only 会解析成 UTC 零点；带时间/时区的值会偏离零点，
    // 直接截成 ISO 日期会让日期悄悄差一天，这里回退成带时间的字符串交给 regex 报错。
    const atUtcMidnight =
      v.getUTCHours() === 0 &&
      v.getUTCMinutes() === 0 &&
      v.getUTCSeconds() === 0 &&
      v.getUTCMilliseconds() === 0;
    return atUtcMidnight ? v.toISOString().slice(0, 10) : v.toISOString();
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date 须为 YYYY-MM-DD（只写日期，不带时间/时区）')
    .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'date 不是有效日期')
    .transform((s) => new Date(`${s}T00:00:00Z`)),
);

// 时间只做显示/排序，不参与 Date 运算；统一校验零填充 24h 制。
const timeOfDay = (field: string) =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${field} 须为零填充 24h 制，如 09:30`);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: dateOnly,
    pubTime: timeOfDay('pubTime').optional(),
    updatedDate: dateOnly.optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }).strict(),
});

// 碎碎念：短时间流，不生成独立页面；只有 date/time/draft 三个字段
const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    date: dateOnly,
    time: timeOfDay('time').optional(),
    draft: z.boolean().default(false),
  }).strict(),
});

// 静态页内容（首版只有 now.md）
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    updatedDate: dateOnly,
    draft: z.boolean().default(false),
  }).strict(),
});

export const collections = { posts, notes, pages };

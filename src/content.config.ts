import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    pubTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'pubTime 须为零填充 24h 制，如 09:30')
      .optional(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }).strict(),
});

// 只写日期的字段统一走这里：YAML 会把未加引号的 2026-10-22 解析成 Date 对象，
// 先归一化成 YYYY-MM-DD 再校验，最后固定成 UTC 零点——
// 不能用 z.coerce.date()，那会接受带时区的字符串，让「文件名日期」和「显示日期」在负时区差一天。
const dateOnly = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date 须为 YYYY-MM-DD（只写日期，不带时间/时区）')
    .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'date 不是有效日期')
    .transform((s) => new Date(`${s}T00:00:00Z`)),
);

// 碎碎念：短时间流，不生成独立页面；只有 date/time/draft 三个字段
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

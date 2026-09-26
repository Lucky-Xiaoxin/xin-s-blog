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

export const collections = { posts };

import { getCollection, type CollectionEntry } from 'astro:content';
import { byNewest } from '../const';

export type Post = CollectionEntry<'posts'>;

async function listPosts(includeDrafts: boolean): Promise<Post[]> {
  const posts = includeDrafts
    ? await getCollection('posts')
    : await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(byNewest);
}

/** 面向读者的列表/RSS 只取已发布文章，按 byNewest 排序 */
export async function getPublishedPosts(): Promise<Post[]> {
  return listPosts(false);
}

/** getStaticPaths 专用：dev 含草稿用于本地预览，build 只生成已发布文章 */
export async function getPostsForStaticPaths(): Promise<Post[]> {
  return listPosts(import.meta.env.DEV);
}

export async function getPostBySlug(
  slug: string,
  opts: { includeDrafts?: boolean } = {},
): Promise<Post | undefined> {
  const posts = await listPosts(opts.includeDrafts ?? false);
  return posts.find((post) => post.id === slug);
}

export async function getAdjacentPosts(
  slug: string,
  opts: { includeDrafts?: boolean } = {},
): Promise<{ older?: Post; newer?: Post }> {
  const posts = await listPosts(opts.includeDrafts ?? false);
  const index = posts.findIndex((post) => post.id === slug);
  if (index === -1) return {};
  return { older: posts[index + 1], newer: index > 0 ? posts[index - 1] : undefined };
}

export interface TagSummary {
  tag: string;
  count: number;
  latest: Post;
}

export async function getAllTags(): Promise<TagSummary[]> {
  const posts = await getPublishedPosts();
  const tags = new Map<string, TagSummary>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const entry = tags.get(tag);
      if (entry) entry.count += 1;
      else tags.set(tag, { tag, count: 1, latest: post });
    }
  }
  return [...tags.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh'),
  );
}

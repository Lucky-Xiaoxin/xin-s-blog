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

/** “最近更新”口径：每篇取 updatedDate ?? pubDate，再取最大值 */
export function latestUpdate(posts: Post[]): Date | undefined {
  let latest: Date | undefined;
  for (const post of posts) {
    const date = post.data.updatedDate ?? post.data.pubDate;
    if (!latest || date > latest) latest = date;
  }
  return latest;
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

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.tags.includes(tag));
}

export interface ArchiveMonth {
  month: number;
  posts: Post[];
}

export interface ArchiveYear {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

/** 归档只含已发布文章；年/月倒序，组内 byNewest（UTC getter，与 formatDay 同源） */
export async function getArchiveGroups(): Promise<ArchiveYear[]> {
  const posts = await getPublishedPosts();
  const years = new Map<number, Map<number, Post[]>>();
  for (const post of posts) {
    const year = post.data.pubDate.getUTCFullYear();
    const month = post.data.pubDate.getUTCMonth() + 1;
    let months = years.get(year);
    if (!months) {
      months = new Map();
      years.set(year, months);
    }
    const list = months.get(month);
    if (list) list.push(post);
    else months.set(month, [post]);
  }
  return [...years.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => {
      const grouped = [...months.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, list]) => ({ month, posts: list.sort(byNewest) }));
      return {
        year,
        count: grouped.reduce((total, group) => total + group.posts.length, 0),
        months: grouped,
      };
    });
}

import { getEntry, type CollectionEntry } from 'astro:content';

export type Page = CollectionEntry<'pages'>;

/**
 * 读取 now 页内容。
 * dev 传 includeDrafts: true 可预览草稿；build 传 false（或不传）时草稿一律视为没有内容。
 */
export async function getNow(
  opts: { includeDrafts?: boolean } = {},
): Promise<Page | undefined> {
  const entry = await getEntry('pages', 'now');
  if (!entry) return undefined;
  if (entry.data.draft && opts.includeDrafts !== true) return undefined;
  return entry;
}

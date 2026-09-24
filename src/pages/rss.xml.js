import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE, byNewest, u } from '../const';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(byNewest);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(u('/'), context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      link: u(`/posts/${post.id}/`),
    })),
  });
}

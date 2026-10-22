import rss from '@astrojs/rss';
import { SITE, u } from '../const';
import { getPublishedPosts } from '../lib/posts';

export async function GET(context) {
  const posts = await getPublishedPosts();

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

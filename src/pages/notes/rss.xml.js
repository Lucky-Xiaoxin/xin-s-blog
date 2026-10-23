import rss from '@astrojs/rss';
import { SITE, formatDay, u } from '../../const';
import { getPublishedNotes, noteAnchor } from '../../lib/notes';

export async function GET(context) {
  // feed 面向订阅者：只含已发布碎碎念，dev 也不混入草稿
  const notes = await getPublishedNotes();

  return rss({
    title: `碎碎念 · ${SITE.title}`,
    description: '短、带时间、随时记。',
    site: new URL(u('/notes/'), context.site),
    items: notes.map((note) => ({
      // 没有标题字段，日期就是标题
      title: note.data.time
        ? `${formatDay(note.data.date)} ${note.data.time}`
        : formatDay(note.data.date),
      description: note.body,
      // pubDate 只到日期：time 是纯显示字段，不并进 Date，避免时区语义
      pubDate: note.data.date,
      // 必须是绝对 URL：@astrojs/rss 对相对链接会补尾斜杠，
      // 把 #n-xxx 变成 #n-xxx/，锚点就失效了
      link: new URL(`${u('/notes/')}#${noteAnchor(note)}`, context.site).href,
    })),
  });
}

import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/** 文件名（去 .md）须为 YYYY-MM-DD-slug：小写字母/数字/连字符 */
const NOTE_ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 超过这个字数就提醒写成文章（只警告，不挡发布） */
const MAX_NOTE_LENGTH = 800;

/** 排序：日期倒序 → 同日 time 倒序（无 time 视为空，排在有时间的后面）→ 同 time 按 id 倒序 */
function byNewest(a: Note, b: Note) {
  return (
    b.data.date.valueOf() - a.data.date.valueOf() ||
    (b.data.time ?? '').localeCompare(a.data.time ?? '') ||
    b.id.localeCompare(a.id)
  );
}

/**
 * 读取全部碎碎念并做校验。
 * 校验对所有 note 生效（含草稿），且在过滤草稿之前——草稿写错也要在 dev/build 暴露。
 * 错误直接抛出会让构建失败；警告只打印。
 */
async function loadNotes(): Promise<Note[]> {
  const all = await getCollection('notes');
  // `_` 前缀是模板，永远不是 note：在过滤/排序/校验之前就排除
  const notes = all.filter((note) => !note.id.startsWith('_'));

  for (const note of notes) {
    const body = note.body ?? '';

    if (!NOTE_ID_RE.test(note.id)) {
      throw new Error(
        `[notes] 碎碎念文件名须为 YYYY-MM-DD-slug.md（小写/数字/连字符）：${note.id}`,
      );
    }

    const date = note.data.date.toISOString().slice(0, 10);
    if (note.id.slice(0, 10) !== date) {
      throw new Error(
        `[notes] 碎碎念 ${note.id} 的 date 与文件名日期不一致：date=${date}`,
      );
    }

    if (!body.trim()) {
      throw new Error(`[notes] 碎碎念 ${note.id} 正文为空`);
    }

    if (body.trim().length > MAX_NOTE_LENGTH) {
      console.warn(
        `[notes] 碎碎念 ${note.id} 超过 ${MAX_NOTE_LENGTH} 字，考虑写成文章`,
      );
    }

    if (note.data.date.valueOf() > Date.now()) {
      console.warn(`[notes] 碎碎念 ${note.id} 日期在未来；不会自动隐藏`);
    }
  }

  return notes.sort(byNewest);
}

/** 面向读者的列表/RSS 只取已发布碎碎念 */
export async function getPublishedNotes(): Promise<Note[]> {
  const notes = await loadNotes();
  return notes.filter((note) => !note.data.draft);
}

/** 页面专用：dev 含草稿用于本地预览，build 只含已发布 */
export async function getNotesForPage(): Promise<Note[]> {
  const notes = await loadNotes();
  return import.meta.env.DEV ? notes : notes.filter((note) => !note.data.draft);
}

/** 首页等场景用：已发布最近 N 条 */
export async function getRecentNotes(limit: number): Promise<Note[]> {
  const notes = await getPublishedNotes();
  return notes.slice(0, limit);
}

export interface NoteMonth {
  /** YYYY-MM */
  key: string;
  year: number;
  month: number;
  /** YYYY 年 M 月（不补零） */
  label: string;
  notes: Note[];
}

/** 按 UTC 年月分组，月份倒序，组内沿用列表排序 */
export function groupNotesByMonth(notes: Note[]): NoteMonth[] {
  const groups = new Map<string, NoteMonth>();
  for (const note of notes) {
    const year = note.data.date.getUTCFullYear();
    const month = note.data.date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, year, month, label: `${year} 年 ${month} 月`, notes: [] };
      groups.set(key, group);
    }
    group.notes.push(note);
  }
  return [...groups.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((group) => ({ ...group, notes: group.notes.sort(byNewest) }));
}

/** 锚点唯一来源：n-<文件名>，只由文件名决定，与排序/草稿无关 */
export function noteAnchor(note: Note): string {
  return `n-${note.id}`;
}

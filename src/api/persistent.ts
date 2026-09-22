// 永久写入（跨聊天保留）。目标是一本“角色附加世界书”：先确保一本永久库世界书存在，
// 再把它作为附加世界书绑定到当前角色卡上（存在 world_info.charLore 中），并在需要时
// 一并加入全局启用。这样无论开启多少个新聊天，只要还是这张卡，库始终生效。

import { saveCharacterDebounced, saveSettingsDebounced, this_chid } from '@sillytavern/script';
import { world_info } from '@sillytavern/scripts/world-info';
import { getCharaFilename } from '@sillytavern/scripts/utils';
import { addEntries, createWorldbook, globalEnabledWorldbooks, setGlobalSelection, worldbookExists } from './worldbook';

/** 默认永久库名称 */
export function defaultPersistentBookName(): string {
  const name = getCurrentCharFilename();
  return name ? `提炼库_${name}` : '提炼库';
}

/** 当前角色卡文件名（无扩展名）；无角色卡时返回空 */
export function getCurrentCharFilename(): string {
  try {
    return getCharaFilename(this_chid) ?? '';
  } catch {
    return '';
  }
}

/** 读取当前角色已绑定的附加世界书列表 */
export function getCharAdditionalWorldbooks(): string[] {
  const filename = getCurrentCharFilename();
  if (!filename) {
    return [];
  }
  const charLore = (world_info as unknown as { charLore?: { name: string; extraBooks: string[] }[] }).charLore ?? [];
  return charLore.find((e) => e.name === filename)?.extraBooks ?? [];
}

/** 确认永久库存在且绑定到当前角色，返回库名 */
export async function ensurePersistentBook(preferredName?: string): Promise<string> {
  const name = (preferredName && preferredName.trim()) || defaultPersistentBookName();
  if (!worldbookExists(name)) {
    await createWorldbook(name);
  }
  attachToCharacter(name);
  return name;
}

/** 把某世界书加入当前角色的附加世界书列表 */
function attachToCharacter(bookName: string): void {
  const filename = getCurrentCharFilename();
  if (!filename) {
    return; // 没有角色卡时只保证库存在，不绑定
  }
  const charLore = (world_info as unknown as { charLore?: { name: string; extraBooks: string[] }[] }).charLore ??
    ((world_info as unknown as { charLore: { name: string; extraBooks: string[] }[] }).charLore = []);
  const entry = charLore.find((e) => e.name === filename);
  if (entry) {
    if (!entry.extraBooks.includes(bookName)) {
      entry.extraBooks.push(bookName);
    }
  } else {
    charLore.push({ name: filename, extraBooks: [bookName] });
  }
  saveCharacterDebounced();
  saveSettingsDebounced();
}

/** 把永久库加入全局启用清单（可选） */
export function enableGlobally(bookName: string): void {
  const cur = globalEnabledWorldbooks();
  if (!cur.includes(bookName)) {
    setGlobalSelection([...cur, bookName]);
  }
}

/** 永久写入：把提炼条目写入角色附加的永久库（跨聊天保留）。 */
export async function writePermanent(
  entries: { name: string; content: string; light: 'blue' | 'green'; keys: string[] }[],
  preferredName?: string,
  alsoGlobally = false,
): Promise<string> {
  const book = await ensurePersistentBook(preferredName);
  await addEntries(book, entries);
  if (alsoGlobally) {
    enableGlobally(book);
  }
  return book;
}

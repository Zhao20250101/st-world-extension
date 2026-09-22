// 楼层读取 + 临时写入（聊天级世界书）。
// “临时”指的是写入当前聊天的聊天世界书（chat lorebook），它绑定在 chat_metadata 上，
// 开启新的聊天（新 chat 文件）即不会继承，从而满足“仅当前聊天生效，新聊天清空”。

import {
  chat,
  chat_metadata,
  getCurrentChatId,
  name1,
  name2,
  saveMetadata,
} from '@sillytavern/script';
import { createNewWorldInfo, METADATA_KEY, world_names } from '@sillytavern/scripts/world-info';
import { addEntries, loadEntries, worldbookExists } from './worldbook';
import { parseFloorRange } from '../logic';
import type { LoreEntry } from '../types';

export { parseFloorRange };

export interface FloorSegment {
  start: number;
  end: number;
  text: string;
  count: number;
}

/** 读取当前聊天在楼层范围内的对话文本（用于提炼）。 */
export function getFloorSegment(start: number, end: number): string {
  const lines: string[] = [];
  for (let i = start; i <= end && i < chat.length; i++) {
    const mes = chat[i];
    if (!mes) {
      continue;
    }
    const who = mes.is_user ? name1 : mes.is_system ? '系统' : mes.name || name2;
    const body = mes.mes != null ? String(mes.mes).trim() : '';
    if (!body && !mes.is_user && !mes.is_system) {
      continue;
    }
    lines.push(`[#${i}] ${who}: ${body}`);
  }
  return lines.join('\n');
}

/** 当前聊天最大楼层索引 */
export function maxFloorIndex(): number {
  return chat.length - 1;
}

/** 当前是否已打开聊天 */
export function hasChat(): boolean {
  return getCurrentChatId() !== undefined && chat.length > 0;
}

// ---------------------------------------------------------------------------
// 聊天级世界书（临时写入的目标）
// ---------------------------------------------------------------------------

/** 读取当前聊天的聊天世界书名称；没有则返回 null */
export function getChatLorebook(): string | null {
  const stored = chat_metadata?.[METADATA_KEY];
  if (typeof stored === 'string' && world_names.includes(stored)) {
    return stored;
  }
  return null;
}

/** 为当前聊天设置聊天世界书名称 */
async function bindChatLorebook(name: string | null): Promise<void> {
  if (name === null) {
    delete chat_metadata[METADATA_KEY];
  } else {
    chat_metadata[METADATA_KEY] = name;
  }
  await saveMetadata();
}

/** 获取当前聊天的聊天世界书，不存在则自动创建一本绑定的（临时库）。 */
export async function getOrCreateChatLorebook(): Promise<string> {
  const existing = getChatLorebook();
  if (existing) {
    return existing;
  }
  const chatId = getCurrentChatId() ?? 'chat';
  const base = `临时库_${String(chatId).replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 60)}`;
  let name = base;
  let n = 1;
  while (worldbookExists(name)) {
    name = `${base}_${n++}`;
  }
  await createNewWorldInfo(name, { interactive: false });
  await bindChatLorebook(name);
  return name;
}

/** 临时写入：把提炼出的条目写入当前聊天的聊天世界书（新聊天自动清空）。 */
export async function writeTemporary(entries: { name: string; content: string; light: 'blue' | 'green'; keys: string[] }[]): Promise<string> {
  const book = await getOrCreateChatLorebook();
  await addEntries(book, entries);
  return book;
}

/** 列出当前聊天世界书的条目（用于在界面展示蓝灯/绿灯） */
export async function listChatLorebookEntries(): Promise<{ book: string | null; entries: LoreEntry[] }> {
  const book = getChatLorebook();
  if (!book) {
    return { book: null, entries: [] };
  }
  return { book, entries: await loadEntries(book) };
}

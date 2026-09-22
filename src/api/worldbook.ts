// SillyTavern 世界书（World Info / Lorebook）读写封装。
// API 全部基于 @sillytavern/scripts/world-info 的导出，与酒馆助手（JS-Slash-Runner）
// 针对同一 ST 版本（>=1.12.13）的用法一致。

import {
  createNewWorldInfo,
  getWorldInfoSettings,
  loadWorldInfo,
  saveWorldInfo,
  selected_world_info,
  world_names,
} from '@sillytavern/scripts/world-info';
import { saveSettingsDebounced } from '@sillytavern/script';
import type { LoreEntry } from '../types';
import { buildNewEntry, classify } from '../logic';

/** 所有可用的世界书名称 */
export function listWorldbooks(): string[] {
  return [...world_names];
}

/** 是否存在同名世界书 */
export function worldbookExists(name: string): boolean {
  return world_names.includes(name);
}

/** 新建一个世界书（已存在则返回 false） */
export async function createWorldbook(name: string): Promise<boolean> {
  return createNewWorldInfo(name, { interactive: false });
}

/** 当前已全局启用的世界书名称 */
export function globalEnabledWorldbooks(): string[] {
  return [...selected_world_info];
}

/** 加载某本世界书并返回其条目（已按显示顺序排序） */
export async function loadEntries(bookName: string): Promise<LoreEntry[]> {
  const data = (await loadWorldInfo(bookName)) as { entries?: Record<string, any> } | null;
  if (!data || !data.entries) {
    return [];
  }
  const list = Object.values(data.entries)
    .filter((e) => e && typeof e === 'object')
    .map((e) => toLoreEntry(e as Record<string, any>));
  list.sort((a, b) => (a.order - b.order) || (a.uid - b.uid));
  return list;
}

/** 把某条原始世界书条目转换为内部结构 */
function toLoreEntry(raw: Record<string, any>): LoreEntry {
  const type: LoreEntry['type'] = raw.constant ? 'constant' : raw.vectorized ? 'vectorized' : 'selective';
  return {
    uid: Number(raw.uid ?? 0),
    display_index: Number(raw.displayIndex ?? raw.uid ?? 0),
    comment: String(raw.comment ?? ''),
    content: String(raw.content ?? ''),
    enabled: !raw.disable,
    type,
    keys: Array.isArray(raw.key) ? raw.key.map(String) : [],
    position: Number(raw.position ?? 4),
    role: raw.role ?? 0,
    depth: Number(raw.depth ?? 4),
    order: Number(raw.order ?? 100),
    raw: { ...raw },
  };
}

export { classify };

/** 切换某条目的启用状态（开启/关闭）。disable=true 为关闭。 */
export async function setEntryEnabled(bookName: string, uid: number, enabled: boolean): Promise<void> {
  const data = (await loadWorldInfo(bookName)) as { entries?: Record<string, any> } | null;
  if (!data || !data.entries) {
    throw new Error(`世界书「${bookName}」不存在或为空`);
  }
  const entry = data.entries[String(uid)];
  if (!entry) {
    throw new Error(`世界书「${bookName}」中不存在 uid=${uid} 的条目`);
  }
  entry.disable = !enabled;
  await saveWorldInfo(bookName, data);
}

/** 向世界书追加多条条目，自动分配 uid；返回成功追加的条目标题 */
export async function addEntries(
  bookName: string,
  entries: Array<{ name: string; content: string; light: 'blue' | 'green'; keys: string[] }>,
): Promise<string[]> {
  if (!world_names.includes(bookName)) {
    throw new Error(`世界书「${bookName}」不存在`);
  }
  const data = (await loadWorldInfo(bookName)) as { entries?: Record<string, any> } | null;
  const entryMap: Record<string, any> = data?.entries ?? {};
  const usedUids = new Set<number>();
  for (const key of Object.keys(entryMap)) {
    usedUids.add(Number(key));
  }
  let nextUid = 0;
  const written: string[] = [];
  for (const e of entries) {
    while (usedUids.has(nextUid)) {
      nextUid += 1;
    }
    usedUids.add(nextUid);
    entryMap[String(nextUid)] = buildNewEntry(e, nextUid);
    written.push(e.name);
    nextUid += 1;
  }
  await saveWorldInfo(bookName, { entries: entryMap });
  return written;
}

/** 读取/设置世界书全局激活清单（供“把永久库加入全局启用”使用） */
export function setGlobalSelection(list: string[]): void {
  selected_world_info.splice(0, selected_world_info.length, ...list);
  Object.assign(getWorldInfoSettings().world_info, { globalSelect: list });
  saveSettingsDebounced();
}

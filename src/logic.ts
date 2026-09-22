// 纯逻辑（不依赖 SillyTavern），便于独立单元测试。
import type { ExtractedEntry, LoreEntry, WiLight } from './types';

// ---------------------------------------------------------------------------
// 楼层区间解析
// ---------------------------------------------------------------------------
/** 把 "12" 或 "5-20" 解析为 [start,end]（含端点，0 起，可负数=倒数）。返回 null 表示非法。 */
export function parseFloorRange(input: string, maxIndex: number): { start: number; end: number } | null {
  const clamp = (v: number) => Math.min(maxIndex, Math.max(-1, v < 0 ? maxIndex + v + 1 : v));
  const s = String(input).trim();
  if (s === '') {
    return null;
  }
  if (/^-?\d+$/.test(s)) {
    const i = clamp(Number(s));
    return { start: i, end: i };
  }
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) {
    return null;
  }
  let a = clamp(Number(m[1]));
  let b = clamp(Number(m[2]));
  if (a > b) {
    const t = a;
    a = b;
    b = t;
  }
  return { start: a, end: b };
}

// ---------------------------------------------------------------------------
// 蓝灯/绿灯分类
// ---------------------------------------------------------------------------
/** 根据条目判定“灯”状态：blue=恒定(蓝灯), green=关键词(绿灯), vector=向量, off=关闭 */
export function classify(entry: LoreEntry): WiLight {
  if (!entry.enabled) {
    return 'off';
  }
  switch (entry.type) {
    case 'constant':
      return 'blue';
    case 'vectorized':
      return 'vector';
    case 'selective':
      return 'green';
  }
}

// ---------------------------------------------------------------------------
// 新条目构造（蓝灯=constant 常驻；绿灯=selective 关键字）
// ---------------------------------------------------------------------------
export function buildNewEntry(
  e: { name: string; content: string; light: 'blue' | 'green'; keys: string[] },
  uid: number,
): Record<string, any> {
  const blue = e.light === 'blue';
  return {
    uid,
    displayIndex: uid,
    comment: e.name,
    content: e.content,
    constant: blue,
    vectorized: false,
    selective: !blue,
    key: blue ? [] : e.keys.map((k) => String(k)),
    keysecondary: [],
    selectiveLogic: 0,
    addMemo: true,
    order: 100,
    position: 4, // at_depth，系统角色
    disable: false,
    excludeRecursion: false,
    preventRecursion: false,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: 0,
    probability: 100,
    useProbability: true,
    depth: 4,
    group: '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automationId: '',
    role: 0,
    sticky: null,
    cooldown: null,
    delay: null,
  };
}

// ---------------------------------------------------------------------------
// 提炼结果的 JSON 解析
// ---------------------------------------------------------------------------
/** 从模型输出中解析条目 JSON（鲁棒：剥离代码块 / 取首个数组） */
export function parseExtractionResult(raw: string): ExtractedEntry[] {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    text = fence[1].trim();
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('模型没有返回可解析的 JSON 数组');
  }
  const jsonText = text.slice(start, end + 1);
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('模型返回的 JSON 无法解析');
  }
  if (!Array.isArray(data)) {
    throw new Error('模型返回的不是 JSON 数组');
  }
  const out: ExtractedEntry[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const it = item as Record<string, any>;
    const name = sanitizeName(it.name);
    const content = typeof it.content === 'string' ? it.content.trim() : '';
    if (!name || !content) {
      continue;
    }
    const light: ExtractedEntry['light'] = it.light === 'blue' ? 'blue' : 'green';
    const keys = Array.isArray(it.keys) ? it.keys.map(String).filter((k) => k.length > 0) : [];
    out.push({ name, content, light, keys });
  }
  return out;
}

function sanitizeName(v: unknown): string {
  if (typeof v !== 'string') {
    return '';
  }
  const s = v.trim();
  return s.length > 60 ? s.slice(0, 60) : s;
}

// ---------------------------------------------------------------------------
// HTML 转义
// ---------------------------------------------------------------------------
export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
export function escapeAttr(s: unknown): string {
  return escapeHtml(s);
}

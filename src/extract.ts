// 提炼逻辑：构造提示词、并发起一次静默生成、解析返回的 JSON。

import type { ExtractDirection, ExtractedEntry } from './types';
import { getFloorSegment } from './api/chat';
import { quietGenerate } from './api/generate';
import { parseExtractionResult } from './logic';

const DIRECTION_LABEL: Record<ExtractDirection, string> = {
  character: '人物',
  worldview: '世界观',
};

const JSON_INSTRUCTIONS = `你必须严格只输出一个 JSON 数组，不要输出任何其它文字、前后缀或 markdown 代码块围栏。
数组中的每个元素是一个世界书条目对象，结构如下：
{
  "name": "条目标题（世界书中显示的条目名）",
  "content": "条目正文，使用简洁明确的中文陈述句，直接陈述设定，不要出现第一人称或对话；内容控制在 100~300 字",
  "light": "blue 或 green",
  "keys": ["触发关键词", ...]
}
规则：
- 提炼方向为「人物」时，一条目对应一个被提及的角色或 NPC；light 用 green，keys 填入该角色的名字/称呼/别名做触发关键词，保证关键词出现时该条目被激活。
- 提炼方向为「世界观」时，把地理、势力、组织、时间线、规则、物品等世界观设定整合成条目；light 用 blue（恒定常驻），keys 填入空数组 []。
- 只提炼所选楼层文本里确实存在的信息，不要臆造；没有值得提炼的信息就输出空数组 []。

请针对下面这些历史楼层内容进行提炼：`;

/** 构建提炼提示词 */
export function buildExtractionPrompt(direction: ExtractDirection, start: number, end: number, extraInstruction?: string): string {
  const floors = getFloorSegment(start, end);
  if (!floors.trim()) {
    throw new Error('所选楼层区间没有可用的对话内容');
  }
  const lines = [
    `请从下面的历史对话中提炼「${DIRECTION_LABEL[direction]}」相关设定。`,
    extraInstruction ? extraInstruction : '',
    JSON_INSTRUCTIONS,
    '【历史楼层内容】',
    '```',
    floors,
    '```',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

/** 提炼主流程：返回解析后的条目 */
export async function extract(
  direction: ExtractDirection,
  start: number,
  end: number,
): Promise<ExtractedEntry[]> {
  const prompt = buildExtractionPrompt(direction, start, end);
  const raw = await quietGenerate(prompt);
  const entries = parseExtractionResult(raw);
  if (entries.length === 0) {
    throw new Error('在所选楼层中没有提炼出任何可写入的设定');
  }
  return entries;
}

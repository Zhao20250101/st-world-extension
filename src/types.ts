/** 世界书条目的“灯”分类：
 *  - blue   蓝灯：恒定/常驻条目（constant），始终注入上下文
 *  - green  绿灯：关键词触发条目（selective），命中 key 才注入
 *  - vector 向量条目（vectorized）
 *  - off    已禁用（enabled=false）
 */
export type WiLight = 'blue' | 'green' | 'vector' | 'off';

export interface LoreEntry {
  uid: number;
  display_index: number;
  comment: string;
  content: string;
  enabled: boolean;
  /** 蓝绿灯判定基于原始条目的 constant/selective/vectorized 三态 */
  type: 'constant' | 'selective' | 'vectorized';
  keys: string[];
  position: number;
  role: number;
  depth: number;
  order: number;
  /** 该条目的完整原始字段（写回时原样透传） */
  raw: Record<string, unknown>;
}

/** 提炼方向 */
export type ExtractDirection = 'character' | 'worldview';

/** 提炼得到的、待写入的一条世界书条目（UI 预览用） */
export interface ExtractedEntry {
  /** 条目标题（comment） */
  name: string;
  /** 条目正文 */
  content: string;
  /** 蓝灯或绿灯 */
  light: 'blue' | 'green';
  /** 绿灯时的触发关键词 */
  keys: string[];
}

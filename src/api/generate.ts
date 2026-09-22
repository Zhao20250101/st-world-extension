// AI 提炼：调用 SillyTavern 的静默生成（quiet generation），不注入聊天界面。

import { ST } from '../st';

/**
 * 用酒馆当前所用后端做一次静默文本生成。
 * generateQuietPrompt(quiet_prompt, quiet_to_loud, skip_wian)。
 */
export async function quietGenerate(prompt: string): Promise<string> {
  const generateQuietPrompt = ST.generateQuietPrompt;
  if (typeof generateQuietPrompt !== 'function') {
    throw new Error('酒馆当前版本没有可用的 generateQuietPrompt 接口，无法提炼');
  }
  const output = await generateQuietPrompt(prompt, false, true);
  if (typeof output !== 'string' || output.length === 0) {
    throw new Error('模型没有返回内容，提炼失败');
  }
  return output.trim();
}

// SillyTavern 运行时访问层。
// 通过全局 SillyTavern.getContext()（回退到 window 全局）读取酒馆 API，
// 使打包产物不含对酒馆核心脚本的相对导入，从而可经 CDN URL 加载。

const g: any = globalThis;

function ctx(): any {
  const st = g.SillyTavern;
  if (st && typeof st.getContext === 'function') {
    return st.getContext();
  }
  return g;
}

function pick(name: string): any {
  const c = ctx();
  return c && c[name] !== undefined ? c[name] : g[name];
}

export const ST = {
  get chat() {
    return pick('chat');
  },
  get chat_metadata() {
    return pick('chat_metadata');
  },
  get name1() {
    return pick('name1');
  },
  get name2() {
    return pick('name2');
  },
  get this_chid() {
    return pick('this_chid');
  },
  get eventSource() {
    return pick('eventSource');
  },
  get event_types() {
    return pick('event_types');
  },
  get getCurrentChatId() {
    return pick('getCurrentChatId');
  },
  get saveMetadata() {
    return pick('saveMetadata');
  },
  get saveSettingsDebounced() {
    return pick('saveSettingsDebounced');
  },
  get saveCharacterDebounced() {
    return pick('saveCharacterDebounced');
  },
  get generateQuietPrompt() {
    return pick('generateQuietPrompt');
  },
  get world_names() {
    return pick('world_names');
  },
  get selected_world_info() {
    return pick('selected_world_info');
  },
  get world_info() {
    return pick('world_info');
  },
  get METADATA_KEY() {
    return pick('METADATA_KEY');
  },
  get getWorldInfoSettings() {
    return pick('getWorldInfoSettings');
  },
  get createNewWorldInfo() {
    return pick('createNewWorldInfo');
  },
  get saveWorldInfo() {
    return pick('saveWorldInfo');
  },
  get loadWorldInfo() {
    return pick('loadWorldInfo');
  },
  get getCharaFilename() {
    return pick('getCharaFilename');
  },
};

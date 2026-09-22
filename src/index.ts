// 世界书灯 LoreLamp —— 插件入口。
import cssText from './ui.css?inline';
import { ST } from './st';
import { initUI, refreshContext } from './ui';

// 内联注入样式，使单文件即可经 CDN 加载并带样式。
const styleEl = document.createElement('style');
styleEl.textContent = cssText;
document.head.appendChild(styleEl);

ST.eventSource.on(ST.event_types.APP_READY, initUI);
// 切换/载入聊天后刷新楼层与临时库提示
ST.eventSource.on('chatLoaded', refreshContext);
ST.eventSource.on(ST.event_types.CHAT_CHANGED, refreshContext);

const SILENT_RETRY_MS = 800;
async function tryInitEarly(): Promise<void> {
  if ($('#chat').length && (globalThis as any).SillyTavern) {
    initUI();
    return;
  }
  setTimeout(tryInitEarly, SILENT_RETRY_MS);
}
// 保险：若 APP_READY 已在导入前触发
void tryInitEarly();

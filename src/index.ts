// 世界书灯 LoreLamp —— 插件入口。
import './ui.css';
import { eventSource, event_types } from '@sillytavern/script';
import { initUI, refreshContext } from './ui';

eventSource.on(event_types.APP_READY, initUI);
// 切换/载入聊天后刷新楼层与临时库提示
eventSource.on('chatLoaded', refreshContext);
eventSource.on(event_types.CHAT_CHANGED, refreshContext);

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

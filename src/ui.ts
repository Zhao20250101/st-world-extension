// 浮动控制面板：世界书拉取/蓝绿灯/开关 + 楼层提炼 + 临时/永久写入。
import type { ExtractedEntry, LoreEntry } from './types';
import { loadEntries, listWorldbooks, setEntryEnabled, worldbookExists } from './api/worldbook';
import { maxFloorIndex, hasChat, listChatLorebookEntries } from './api/chat';
import { defaultPersistentBookName, writePermanent } from './api/persistent';
import { writeTemporary } from './api/chat';
import { classify, escapeAttr, escapeHtml, parseFloorRange } from './logic';
import { extract } from './extract';

const PANEL_ID = 'LoreLampPanel';
const TOGGLE_ID = 'LoreLampToggle';
const FAB_ID = 'LoreLampFab';
const MORE_ID = 'LoreLampMore';
const QUICK_ID = 'LoreLampQuick';
const FAB_POS_KEY = 'lorelamp_fab_pos';
const PREVIEW_ROWS: ExtractedEntry[] = [];

let worldbookList: string[] = [];

export function initUI(): void {
  if ($(`#${TOGGLE_ID}`).length) {
    return;
  }
  $('body').append(buildFab()).append(buildPanel());
  wirePanel();
  wireFab();
  applyFabPosition();
  onContextChanged();
}

// ---------------------------------------------------------------- 悬浮球
function buildFab(): JQuery<HTMLElement> {
  return $(`
  <div id="${FAB_ID}">
    <div id="${QUICK_ID}" class="lorelamp-quick" style="display:none">
      <button data-act="panel">📖 打开面板</button>
      <button data-act="x_char">⚡ 提炼最近20层·人物</button>
      <button data-act="x_view">⚡ 提炼最近20层·世界观</button>
    </div>
    <button id="${TOGGLE_ID}" class="lorelamp-ball fa-solid fa-book-open" title="世界书灯 LoreLamp"></button>
    <button id="${MORE_ID}" class="lorelamp-more" title="快捷操作">＋</button>
  </div>`);
}

function wireFab(): void {
  $(`#${MORE_ID}`).on('click', (e) => {
    e.stopPropagation();
    $(`#${QUICK_ID}`).toggle();
  });
  $(`#${QUICK_ID} button`).on('click', function () {
    const act = $(this).attr('data-act');
    $(`#${QUICK_ID}`).hide();
    if (act === 'x_char') {
      void quickExtract('character');
    } else if (act === 'x_view') {
      void quickExtract('worldview');
    } else {
      openPanel();
    }
  });
  // 点击球外部时收起快捷菜单
  $(document).on('click', function (e) {
    const fab = document.getElementById(FAB_ID);
    if (fab && !fab.contains(e.target as Node)) {
      $(`#${QUICK_ID}`).hide();
    }
  });
  const fab = document.getElementById(FAB_ID);
  if (fab) {
    initDrag(fab);
  }
}

function initDrag(fab: HTMLElement): void {
  let dragging = false;
  let moved = 0;
  let sx = 0;
  let sy = 0;
  let startLeft = 0;
  let startTop = 0;

  fab.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(`#${QUICK_ID}`) || target.closest(`#${MORE_ID}`)) {
      return;
    }
    if (!target.closest(`#${TOGGLE_ID}`)) {
      return;
    }
    dragging = true;
    moved = 0;
    const r = fab.getBoundingClientRect();
    startLeft = r.left;
    startTop = r.top;
    sx = e.clientX;
    sy = e.clientY;
    $(`#${TOGGLE_ID}`).addClass('lorelamp-grabbing');
    try {
      fab.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    e.preventDefault();
  });

  fab.addEventListener('pointermove', (e) => {
    if (!dragging) {
      return;
    }
    moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
    const style = fab.style;
    style.left = `${startLeft + (e.clientX - sx)}px`;
    style.top = `${startTop + (e.clientY - sy)}px`;
    style.right = 'auto';
    style.bottom = 'auto';
  });

  const onUp = (e: PointerEvent) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    $(`#${TOGGLE_ID}`).removeClass('lorelamp-grabbing');
    const style = fab.style;
    if (style.left) {
      const r = fab.getBoundingClientRect();
      const pos = {
        right: Math.max(0, Math.round(window.innerWidth - r.right)),
        bottom: Math.max(0, Math.round(window.innerHeight - r.bottom)),
      };
      try {
        localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
      } catch {
        /* ignore */
      }
    }
    try {
      fab.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // 没有发生拖拽，视为点击
    if (moved < 6) {
      togglePanel();
    }
  };
  fab.addEventListener('pointerup', onUp);
  fab.addEventListener('pointercancel', () => {
    dragging = false;
  });
}

function applyFabPosition(): void {
  const fab = document.getElementById(FAB_ID);
  if (!fab) {
    return;
  }
  let pos: { right?: number; bottom?: number } | null = null;
  try {
    pos = JSON.parse(localStorage.getItem(FAB_POS_KEY) || 'null');
  } catch {
    /* ignore */
  }
  if (pos && typeof pos.right === 'number' && typeof pos.bottom === 'number') {
    const style = fab.style;
    style.left = 'auto';
    style.top = 'auto';
    style.right = `${Math.max(0, pos.right)}px`;
    style.bottom = `${Math.max(0, pos.bottom)}px`;
  }
}

function togglePanel(): void {
  $(`#${PANEL_ID}`).toggle();
  $(`#${QUICK_ID}`).hide();
  if ($(`#${PANEL_ID}`).is(':visible')) {
    onContextChanged();
  }
}

function openPanel(): void {
  $(`#${PANEL_ID}`).show();
  $(`#${QUICK_ID}`).hide();
  onContextChanged();
}

/** 快捷提炼：取最近 20 层，按指定方向提炼，结果在面板预览（不直接写入）。 */
async function quickExtract(direction: 'character' | 'worldview'): Promise<void> {
  if (!hasChat()) {
    toastr.warning('请先打开一个聊天。');
    return;
  }
  const end = maxFloorIndex();
  const start = Math.max(0, end - 19);
  openPanel();
  $(`#lorelamp-floor`).val(`${start}-${end}`);
  $('input[name="lorelamp-dir"]').prop('checked', false);
  $(`input[name="lorelamp-dir"][value="${direction}"]`).prop('checked', true);
  await handleExtract();
}

function onContextChanged(): void {
  refreshWorldbookList();
  refreshFloors();
  refreshTempBadge();
}

/** 供外部（如聊天切换事件）调用来刷新当前上下文 */
export function refreshContext(): void {
  if ($(`#${PANEL_ID}`).is(':visible')) {
    onContextChanged();
  }
}

// ---------------------------------------------------------------- 面板骨架
function buildPanel(): JQuery<HTMLElement> {
  return $(`
  <div id="${PANEL_ID}" class="lorelamp-panel">
    <div class="lorelamp-header">
      <span>世界书灯 · LoreLamp</span>
      <button class="fa-solid fa-xmark lorelamp-close"></button>
    </div>

    <div class="lorelamp-section">
      <h4>① 世界书与灯</h4>
      <div class="lorelamp-row">
        <select id="lorelamp-book"></select>
        <button id="lorelamp-refresh" class="fa-solid fa-rotate" title="刷新"></button>
      </div>
      <div id="lorelamp-chatbook" class="lorelamp-hint"></div>
      <div id="lorelamp-entrylist"></div>
    </div>

    <div class="lorelamp-section">
      <h4>② 楼层提炼</h4>
      <div class="lorelamp-row">
        <label>楼层(可 3-20)</label>
        <input id="lorelamp-floor" type="text" value="" placeholder="例如 3-20 或 12">
        <span id="lorelamp-floormax" class="lorelamp-hint"></span>
      </div>
      <div class="lorelamp-row">
        <label>方向</label>
        <label><input type="radio" name="lorelamp-dir" value="character" checked> 人物</label>
        <label><input type="radio" name="lorelamp-dir" value="worldview"> 世界观</label>
      </div>
      <div class="lorelamp-row">
        <label>写入</label>
        <label><input type="radio" name="lorelamp-mode" value="temp" checked> 临时(仅本聊天)</label>
        <label><input type="radio" name="lorelamp-mode" value="perm"> 永久(跨聊天)</label>
      </div>
      <div id="lorelamp-permbox" class="lorelamp-row lorelamp-hidden">
        <label>永久库名</label>
        <input id="lorelamp-permname" type="text" value="">
      </div>
      <div class="lorelamp-row">
        <button id="lorelamp-extract" class="lorelamp-btn lorelamp-btn-main">提炼楼层</button>
      </div>
    </div>

    <div class="lorelamp-section">
      <h4>③ 提炼结果预览</h4>
      <div id="lorelamp-preview">
        <div class="lorelamp-hint">点击「提炼楼层」后，这里会显示拟写入的条目，可在左侧勾选。</div>
      </div>
      <div id="lorelamp-preview-actions" class="lorelamp-hidden">
        <button id="lorelamp-write" class="lorelamp-btn lorelamp-btn-main">写入世界书</button>
      </div>
    </div>
  </div>`);
}

function wirePanel(): void {
  $(`#${PANEL_ID}`).find('.lorelamp-close').on('click', togglePanel);
  $(`#lorelamp-book`).on('change', refreshEntryList);
  $(`#lorelamp-refresh`).on('click', () => { refreshWorldbookList(); refreshEntryList(); });
  $('input[name="lorelamp-mode"]').on('change', () => {
    const isPerm = $('input[name="lorelamp-mode"]:checked').val() === 'perm';
    $(`#lorelamp-permbox`).toggleClass('lorelamp-hidden', !isPerm);
    if (isPerm) {
      $(`#lorelamp-permname`).val($(`#lorelamp-permname`).val() || defaultPersistentBookName());
    }
  });
  $(`#lorelamp-extract`).on('click', handleExtract);
  $(`#lorelamp-write`).on('click', handleWrite);
}

// ---------------------------------------------------------------- 世界书/灯
function refreshWorldbookList(): void {
  worldbookList = listWorldbooks();
  const $sel = $(`#lorelamp-book`);
  const prev = String($sel.val() ?? '');
  $sel.empty();
  if (worldbookList.length === 0) {
    $sel.append($('<option value="">').text('（没有世界书）'));
  } else {
    worldbookList.forEach((name) => $sel.append($('<option>').attr('value', name).text(name)));
    if (prev && worldbookList.includes(prev)) {
      $sel.val(prev);
    }
  }
  refreshTempBadge();
}

async function refreshTempBadge(): Promise<void> {
  const { book, entries } = await listChatLorebookEntries();
  const $badge = $(`#lorelamp-chatbook`);
  if (book) {
    const blue = entries.filter((e) => classify(e) === 'blue').length;
    const green = entries.filter((e) => classify(e) === 'green').length;
    $badge.html(`当前聊天临时库：<b>${escapeHtml(book)}</b>（蓝灯 ${blue} · 绿灯 ${green}）`);
  } else {
    $badge.text('当前聊天还没有临时库，临时提炼时会自动创建。');
  }
}

async function refreshEntryList(): Promise<void> {
  const book = String($(`#lorelamp-book`).val() ?? '');
  const $list = $(`#lorelamp-entrylist`);
  $list.empty();
  if (!book || !worldbookExists(book)) {
    $list.html('<div class="lorelamp-hint">选择一本世界书以查看条目。</div>');
    return;
  }
  let entries: LoreEntry[];
  try {
    entries = await loadEntries(book);
  } catch (e) {
    $list.html(`<div class="lorelamp-hint">加载失败：${escapeHtml(String(e))}</div>`);
    return;
  }
  if (entries.length === 0) {
    $list.html('<div class="lorelamp-hint">这本世界书是空的。</div>');
    return;
  }
  entries.sort((a, b) => a.order - b.order || a.uid - b.uid);
  for (const e of entries) {
    $list.append(buildEntryRow(book, e));
  }
}

function buildEntryRow(book: string, e: LoreEntry): JQuery<HTMLElement> {
  const light = classify(e);
  const dotColor = light === 'blue' ? '#58a6ff' : light === 'green' ? '#3fb950' : light === 'vector' ? '#a371f7' : '#6e7681';
  const lightLabel = light === 'blue' ? '蓝灯' : light === 'green' ? '绿灯' : light === 'vector' ? '向量' : '关闭';
  const keys = e.type === 'selective' && e.keys.length ? `<span class="lorelamp-keys">${escapeHtml(e.keys.join('、'))}</span>` : '';
  return $(
    `<div class="lorelamp-entry">
       <span class="lorelamp-dot" style="background:${dotColor}"></span>
       <span class="lorelamp-entry-name" title="${escapeHtml(e.content)}">${escapeHtml(e.comment || `(uid ${e.uid})`)}</span>${keys}
       <label class="lorelamp-switch" title="${lightLabel}">
         <input type="checkbox" data-book="${escapeAttr(book)}" data-uid="${e.uid}" ${e.enabled ? 'checked' : ''}>
         <span class="lorelamp-slider"></span>
       </label>
     </div>`,
  ).find('input[type=checkbox]').on('change', function () {
    const uid = Number($(this).attr('data-uid'));
    const enabled = (this as HTMLInputElement).checked;
    setEntryEnabled(book, uid, enabled)
      .then(() => refreshTempBadge())
      .catch((err) => {
        toastr.error(`开关失败：${err}`);
        (this as HTMLInputElement).checked = !enabled;
      });
  }).end();
}

// ---------------------------------------------------------------- 楼层/提炼
function refreshFloors(): void {
  $(`#lorelamp-floormax`).text(hasChat() ? `共 ${maxFloorIndex() + 1} 层(0-${maxFloorIndex()})` : '（未打开聊天）');
}

async function handleExtract(): Promise<void> {
  if (!hasChat()) {
    toastr.warning('请先打开一个聊天。');
    return;
  }
  const parsed = parseFloorRange(String($(`#lorelamp-floor`).val() ?? ''), maxFloorIndex());
  if (!parsed) {
    toastr.warning('楼层格式不对，例如 3-20 或 12。');
    return;
  }
  const direction = $('input[name="lorelamp-dir"]:checked').val() as 'character' | 'worldview';
  const btn = $(`#lorelamp-extract`);
  btn.prop('disabled', true).text('提炼中…');
  try {
    const entries = await extract(direction, parsed.start, parsed.end);
    PREVIEW_ROWS.length = 0;
    PREVIEW_ROWS.push(...entries);
    renderPreview();
    toastr.success(`提炼出 ${entries.length} 条设定。`);
  } catch (e) {
    PREVIEW_ROWS.length = 0;
    renderPreview();
    toastr.error(`提炼失败：${e}`);
  } finally {
    btn.prop('disabled', false).text('提炼楼层');
  }
}

function renderPreview(): void {
  const $pv = $(`#lorelamp-preview`);
  $pv.empty();
  const $actions = $(`#lorelamp-preview-actions`);
  if (PREVIEW_ROWS.length === 0) {
    $pv.html('<div class="lorelamp-hint">点击「提炼楼层」后，这里会显示拟写入的条目。</div>');
    $actions.addClass('lorelamp-hidden');
    return;
  }
  $actions.removeClass('lorelamp-hidden');
  PREVIEW_ROWS.forEach((en, i) => {
    const lightLabel = en.light === 'blue' ? '蓝灯' : '绿灯';
    const color = en.light === 'blue' ? '#58a6ff' : '#3fb950';
    const keys = en.keys.length ? `<div class="lorelamp-keys">关键词：${escapeHtml(en.keys.join('、'))}</div>` : '';
    $pv.append($(
      `<div class="lorelamp-preview-entry">
         <label><input type="checkbox" data-pidx="${i}" checked> 写入</label>
         <span class="lorelamp-dot" style="background:${color}"></span><b>${lightLabel}</b>
         <div class="lorelamp-name">${escapeHtml(en.name)}</div>
         <div class="lorelamp-content">${escapeHtml(en.content)}</div>
         ${keys}
       </div>`,
    ));
  });
}

// ---------------------------------------------------------------- 写入
async function handleWrite(): Promise<void> {
  if (PREVIEW_ROWS.length === 0) {
    toastr.warning('没有可写入的内容，请先提炼。');
    return;
  }
  const chosen: ExtractedEntry[] = [];
  $(`#lorelamp-preview input[type=checkbox]:checked`).each((_, el) => {
    const idx = Number($(el).attr('data-pidx'));
    if (PREVIEW_ROWS[idx]) {
      chosen.push(PREVIEW_ROWS[idx]);
    }
  });
  if (chosen.length === 0) {
    toastr.warning('请至少勾选一条想写入的设定。');
    return;
  }
  const isPerm = $('input[name="lorelamp-mode"]:checked').val() === 'perm';
  const btn = $(`#lorelamp-write`);
  btn.prop('disabled', true).text('写入中…');
  try {
    let target: string;
    if (isPerm) {
      const permName = String($(`#lorelamp-permname`).val() ?? '').trim() || defaultPersistentBookName();
      target = await writePermanent(chosen, permName, false);
    } else {
      target = await writeTemporary(chosen);
    }
    PREVIEW_ROWS.length = 0;
    renderPreview();
    refreshWorldbookList();
    refreshEntryList();
    refreshTempBadge();
    toastr.success(`已写入 ${chosen.length} 条到「${target}」。`);
  } catch (e) {
    toastr.error(`写入失败：${e}`);
  } finally {
    btn.prop('disabled', false).text('写入世界书');
  }
}

// ---------------------------------------------------------------- 工具
// （escapeHtml / escapeAttr 来自 ./logic）

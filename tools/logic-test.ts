// 纯逻辑单元测试（通过 esbuild 打包后在 Node 中运行）。
// 运行：npx esbuild tools/logic-test.ts --bundle --platform=node --format=esm --outfile=/tmp/logic-test.mjs && node /tmp/logic-test.mjs
import { buildNewEntry, classify, escapeHtml, parseExtractionResult, parseFloorRange } from '../src/logic';
import type { LoreEntry } from '../src/types';

let pass = 0;
let fail = 0;
function check(cond: boolean, msg: string): void {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('  ✗ FAIL:', msg);
  }
}

function mk(partial: Partial<LoreEntry>): LoreEntry {
  return { uid: 1, display_index: 0, comment: '', content: '', enabled: true, type: 'selective', keys: [], position: 4, role: 0, depth: 4, order: 100, raw: {}, ...partial };
}

console.log('== parseFloorRange ==');
check(JSON.stringify(parseFloorRange('3-20', 30)) === JSON.stringify({ start: 3, end: 20 }), 'range 3-20');
check(JSON.stringify(parseFloorRange('12', 30)) === JSON.stringify({ start: 12, end: 12 }), 'single 12');
check(parseFloorRange('', 30) === null, 'empty -> null');
check(parseFloorRange('abc', 30) === null, 'garbage -> null');
check(JSON.stringify(parseFloorRange('-2', 9)) === JSON.stringify({ start: 8, end: 8 }), 'negative -2 -> 8');
check(JSON.stringify(parseFloorRange('5-2', 30)) === JSON.stringify({ start: 2, end: 5 }), 'reversed 5-2 -> 2,5');
check(JSON.stringify(parseFloorRange('0-99', 9)) === JSON.stringify({ start: 0, end: 9 }), 'clamp upper 0-99 -> 0,9');

console.log('== classify ==');
check(classify(mk({ type: 'constant' })) === 'blue', 'constant -> blue');
check(classify(mk({ type: 'selective' })) === 'green', 'selective -> green');
check(classify(mk({ type: 'vectorized' })) === 'vector', 'vectorized -> vector');
check(classify(mk({ enabled: false })) === 'off', 'disabled -> off');

console.log('== buildNewEntry ==');
const blue = buildNewEntry({ name: '世界', content: 'c', light: 'blue', keys: [] }, 1);
check(blue.constant === true && blue.selective === false && blue.key.length === 0, 'blue: constant, no keys');
check(blue.comment === '世界' && blue.disable === false, 'blue: comment/disable');
const green = buildNewEntry({ name: '角色', content: 'c', light: 'green', keys: ['Alice', 'A'] }, 2);
check(green.constant === false && green.selective === true && green.key.join(',') === 'Alice,A', 'green: selective with keys');

console.log('== parseExtractionResult ==');
const raw = '```json\n[{"name":"甲","content":"内容一","light":"green","keys":["甲","甲哥"]},{"name":"乙","content":"内容二","light":"blue","keys":[]}]\n```';
const out = parseExtractionResult(raw);
check(out.length === 2, '2 entries from fenced json');
check(out[0].light === 'green' && out[0].keys.join(',') === '甲,甲哥', 'entry0 green/keys');
check(out[1].light === 'blue' && out[1].keys.length === 0, 'entry1 blue/no keys');
const out2 = parseExtractionResult('[{"name":"丙","content":"x","light":"green","keys":["丙"]}]');
check(out2.length === 1 && out2[0].name === '丙', '1 entry from bare array');
try {
  parseExtractionResult('这不是 JSON');
  check(false, 'should throw on non-json');
} catch {
  check(true, 'throws on non-json');
}
try {
  parseExtractionResult('{"a":1}');
  check(false, 'should throw on non-array object');
} catch {
  check(true, 'throws on non-array object');
}

console.log('== escapeHtml ==');
check(escapeHtml('<b>"x"</b>') === '&lt;b&gt;&quot;x&quot;&lt;/b&gt;', 'escape html');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}

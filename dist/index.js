import{saveSettingsDebounced as j,getCurrentChatId as J,chat as y,chat_metadata as S,name1 as lt,name2 as it,saveMetadata as st,this_chid as ct,saveCharacterDebounced as dt,generateQuietPrompt as W,eventSource as N,event_types as G}from"../../../世界/script.js";import{world_names as k,loadWorldInfo as O,saveWorldInfo as U,createNewWorldInfo as Y,selected_world_info as _,getWorldInfoSettings as ut,METADATA_KEY as L,world_info as B}from"../../../世界/scripts/world-info.js";import{getCharaFilename as pt}from"../../../世界/scripts/utils.js";function mt(t,e){const o=i=>Math.min(e,Math.max(-1,i<0?e+i+1:i)),n=String(t).trim();if(n==="")return null;if(/^-?\d+$/.test(n)){const i=o(Number(n));return{start:i,end:i}}const r=n.match(/^(\d+)\s*-\s*(\d+)$/);if(!r)return null;let a=o(Number(r[1])),l=o(Number(r[2]));if(a>l){const i=a;a=l,l=i}return{start:a,end:l}}function C(t){if(!t.enabled)return"off";switch(t.type){case"constant":return"blue";case"vectorized":return"vector";case"selective":return"green"}}function ft(t,e){const o=t.light==="blue";return{uid:e,displayIndex:e,comment:t.name,content:t.content,constant:o,vectorized:!1,selective:!o,key:o?[]:t.keys.map(n=>String(n)),keysecondary:[],selectiveLogic:0,addMemo:!0,order:100,position:4,disable:!1,excludeRecursion:!1,preventRecursion:!1,matchPersonaDescription:!1,matchCharacterDescription:!1,matchCharacterPersonality:!1,matchCharacterDepthPrompt:!1,matchScenario:!1,matchCreatorNotes:!1,delayUntilRecursion:0,probability:100,useProbability:!0,depth:4,group:"",groupOverride:!1,groupWeight:100,scanDepth:null,caseSensitive:null,matchWholeWords:null,useGroupScoring:null,automationId:"",role:0,sticky:null,cooldown:null,delay:null}}function ht(t){let e=t.trim();const o=e.match(/```(?:json)?\s*([\s\S]*?)```/);o&&(e=o[1].trim());const n=e.indexOf("["),r=e.lastIndexOf("]");if(n===-1||r===-1||r<=n)throw new Error("模型没有返回可解析的 JSON 数组");const a=e.slice(n,r+1);let l;try{l=JSON.parse(a)}catch{throw new Error("模型返回的 JSON 无法解析")}if(!Array.isArray(l))throw new Error("模型返回的不是 JSON 数组");const i=[];for(const s of l){if(!s||typeof s!="object")continue;const c=s,p=bt(c.name),b=typeof c.content=="string"?c.content.trim():"";if(!p||!b)continue;const ot=c.light==="blue"?"blue":"green",rt=Array.isArray(c.keys)?c.keys.map(String).filter(at=>at.length>0):[];i.push({name:p,content:b,light:ot,keys:rt})}return i}function bt(t){if(typeof t!="string")return"";const e=t.trim();return e.length>60?e.slice(0,60):e}function u(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function gt(t){return u(t)}function yt(){return[...k]}function A(t){return k.includes(t)}async function $t(t){return Y(t,{interactive:!1})}function vt(){return[..._]}async function z(t){const e=await O(t);if(!e||!e.entries)return[];const o=Object.values(e.entries).filter(n=>n&&typeof n=="object").map(n=>wt(n));return o.sort((n,r)=>n.order-r.order||n.uid-r.uid),o}function wt(t){const e=t.constant?"constant":t.vectorized?"vectorized":"selective";return{uid:Number(t.uid??0),display_index:Number(t.displayIndex??t.uid??0),comment:String(t.comment??""),content:String(t.content??""),enabled:!t.disable,type:e,keys:Array.isArray(t.key)?t.key.map(String):[],position:Number(t.position??4),role:t.role??0,depth:Number(t.depth??4),order:Number(t.order??100),raw:{...t}}}async function kt(t,e,o){const n=await O(t);if(!n||!n.entries)throw new Error(`世界书「${t}」不存在或为空`);const r=n.entries[String(e)];if(!r)throw new Error(`世界书「${t}」中不存在 uid=${e} 的条目`);r.disable=!o,await U(t,n)}async function q(t,e){if(!k.includes(t))throw new Error(`世界书「${t}」不存在`);const n=(await O(t))?.entries??{},r=new Set;for(const i of Object.keys(n))r.add(Number(i));let a=0;const l=[];for(const i of e){for(;r.has(a);)a+=1;r.add(a),n[String(a)]=ft(i,a),l.push(i.name),a+=1}return await U(t,{entries:n}),l}function xt(t){_.splice(0,_.length,...t),Object.assign(ut().world_info,{globalSelect:t}),j()}function Et(t,e){const o=[];for(let n=t;n<=e&&n<y.length;n++){const r=y[n];if(!r)continue;const a=r.is_user?lt:r.is_system?"系统":r.name||it,l=r.mes!=null?String(r.mes).trim():"";!l&&!r.is_user&&!r.is_system||o.push(`[#${n}] ${a}: ${l}`)}return o.join(`
`)}function v(){return y.length-1}function M(){return J()!==void 0&&y.length>0}function H(){const t=S?.[L];return typeof t=="string"&&k.includes(t)?t:null}async function St(t){t===null?delete S[L]:S[L]=t,await st()}async function _t(){const t=H();if(t)return t;const e=J()??"chat",o=`临时库_${String(e).replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g,"_").slice(0,60)}`;let n=o,r=1;for(;A(n);)n=`${o}_${r++}`;return await Y(n,{interactive:!1}),await St(n),n}async function Lt(t){const e=await _t();return await q(e,t),e}async function Ct(){const t=H();return t?{book:t,entries:await z(t)}:{book:null,entries:[]}}function T(){const t=Q();return t?`提炼库_${t}`:"提炼库"}function Q(){try{return pt(ct)??""}catch{return""}}async function It(t){const e=t&&t.trim()||T();return A(e)||await $t(e),Pt(e),e}function Pt(t){const e=Q();if(!e)return;const o=B.charLore??(B.charLore=[]),n=o.find(r=>r.name===e);n?n.extraBooks.includes(t)||n.extraBooks.push(t):o.push({name:e,extraBooks:[t]}),dt(),j()}function Nt(t){const e=vt();e.includes(t)||xt([...e,t])}async function Ot(t,e,o=!1){const n=await It(e);return await q(n,t),o&&Nt(n),n}async function At(t){if(typeof W!="function")throw new Error("酒馆当前版本没有可用的 generateQuietPrompt 接口，无法提炼");const e=await W(t,!1,!0);if(typeof e!="string"||e.length===0)throw new Error("模型没有返回内容，提炼失败");return e.trim()}const Mt={character:"人物",worldview:"世界观"},Tt=`你必须严格只输出一个 JSON 数组，不要输出任何其它文字、前后缀或 markdown 代码块围栏。
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

请针对下面这些历史楼层内容进行提炼：`;function Dt(t,e,o,n){const r=Et(e,o);if(!r.trim())throw new Error("所选楼层区间没有可用的对话内容");return[`请从下面的历史对话中提炼「${Mt[t]}」相关设定。`,"",Tt,"【历史楼层内容】","```",r,"```"].filter(l=>l!=="").join(`
`)}async function Rt(t,e,o){const n=Dt(t,e,o),r=await At(n),a=ht(r);if(a.length===0)throw new Error("在所选楼层中没有提炼出任何可写入的设定");return a}const f="LoreLampPanel",h="LoreLampToggle",w="LoreLampFab",D="LoreLampMore",m="LoreLampQuick",K="lorelamp_fab_pos",d=[];let g=[];function X(){$(`#${h}`).length||($("body").append(Wt()).append(Jt()),Gt(),Bt(),jt(),x())}function Wt(){return $(`
  <div id="${w}">
    <div id="${m}" class="lorelamp-quick" style="display:none">
      <button data-act="panel">📖 打开面板</button>
      <button data-act="x_char">⚡ 提炼最近20层·人物</button>
      <button data-act="x_view">⚡ 提炼最近20层·世界观</button>
    </div>
    <button id="${h}" class="lorelamp-ball fa-solid fa-book-open" title="世界书灯 LoreLamp"></button>
    <button id="${D}" class="lorelamp-more" title="快捷操作">＋</button>
  </div>`)}function Bt(){$(`#${D}`).on("click",e=>{e.stopPropagation(),$(`#${m}`).toggle()}),$(`#${m} button`).on("click",function(){const e=$(this).attr("data-act");$(`#${m}`).hide(),e==="x_char"?F("character"):e==="x_view"?F("worldview"):Z()}),$(document).on("click",function(e){const o=document.getElementById(w);o&&!o.contains(e.target)&&$(`#${m}`).hide()});const t=document.getElementById(w);t&&Ft(t)}function Ft(t){let e=!1,o=0,n=0,r=0,a=0,l=0;t.addEventListener("pointerdown",s=>{const c=s.target;if(c.closest(`#${m}`)||c.closest(`#${D}`)||!c.closest(`#${h}`))return;e=!0,o=0;const p=t.getBoundingClientRect();a=p.left,l=p.top,n=s.clientX,r=s.clientY,$(`#${h}`).addClass("lorelamp-grabbing");try{t.setPointerCapture(s.pointerId)}catch{}s.preventDefault()}),t.addEventListener("pointermove",s=>{if(!e)return;o=Math.max(o,Math.hypot(s.clientX-n,s.clientY-r));const c=t.style;c.left=`${a+(s.clientX-n)}px`,c.top=`${l+(s.clientY-r)}px`,c.right="auto",c.bottom="auto"});const i=s=>{if(!e)return;if(e=!1,$(`#${h}`).removeClass("lorelamp-grabbing"),t.style.left){const p=t.getBoundingClientRect(),b={right:Math.max(0,Math.round(window.innerWidth-p.right)),bottom:Math.max(0,Math.round(window.innerHeight-p.bottom))};try{localStorage.setItem(K,JSON.stringify(b))}catch{}}try{t.releasePointerCapture(s.pointerId)}catch{}o<6&&V()};t.addEventListener("pointerup",i),t.addEventListener("pointercancel",()=>{e=!1})}function jt(){const t=document.getElementById(w);if(!t)return;let e=null;try{e=JSON.parse(localStorage.getItem(K)||"null")}catch{}if(e&&typeof e.right=="number"&&typeof e.bottom=="number"){const o=t.style;o.left="auto",o.top="auto",o.right=`${Math.max(0,e.right)}px`,o.bottom=`${Math.max(0,e.bottom)}px`}}function V(){$(`#${f}`).toggle(),$(`#${m}`).hide(),$(`#${f}`).is(":visible")&&x()}function Z(){$(`#${f}`).show(),$(`#${m}`).hide(),x()}async function F(t){if(!M()){toastr.warning("请先打开一个聊天。");return}const e=v(),o=Math.max(0,e-19);Z(),$("#lorelamp-floor").val(`${o}-${e}`),$('input[name="lorelamp-dir"]').prop("checked",!1),$(`input[name="lorelamp-dir"][value="${t}"]`).prop("checked",!0),await et()}function x(){R(),Yt(),E()}function tt(){$(`#${f}`).is(":visible")&&x()}function Jt(){return $(`
  <div id="${f}" class="lorelamp-panel">
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
  </div>`)}function Gt(){$(`#${f}`).find(".lorelamp-close").on("click",V),$("#lorelamp-book").on("change",I),$("#lorelamp-refresh").on("click",()=>{R(),I()}),$('input[name="lorelamp-mode"]').on("change",()=>{const t=$('input[name="lorelamp-mode"]:checked').val()==="perm";$("#lorelamp-permbox").toggleClass("lorelamp-hidden",!t),t&&$("#lorelamp-permname").val($("#lorelamp-permname").val()||T())}),$("#lorelamp-extract").on("click",et),$("#lorelamp-write").on("click",zt)}function R(){g=yt();const t=$("#lorelamp-book"),e=String(t.val()??"");t.empty(),g.length===0?t.append($('<option value="">').text("（没有世界书）")):(g.forEach(o=>t.append($("<option>").attr("value",o).text(o))),e&&g.includes(e)&&t.val(e)),E()}async function E(){const{book:t,entries:e}=await Ct(),o=$("#lorelamp-chatbook");if(t){const n=e.filter(a=>C(a)==="blue").length,r=e.filter(a=>C(a)==="green").length;o.html(`当前聊天临时库：<b>${u(t)}</b>（蓝灯 ${n} · 绿灯 ${r}）`)}else o.text("当前聊天还没有临时库，临时提炼时会自动创建。")}async function I(){const t=String($("#lorelamp-book").val()??""),e=$("#lorelamp-entrylist");if(e.empty(),!t||!A(t)){e.html('<div class="lorelamp-hint">选择一本世界书以查看条目。</div>');return}let o;try{o=await z(t)}catch(n){e.html(`<div class="lorelamp-hint">加载失败：${u(String(n))}</div>`);return}if(o.length===0){e.html('<div class="lorelamp-hint">这本世界书是空的。</div>');return}o.sort((n,r)=>n.order-r.order||n.uid-r.uid);for(const n of o)e.append(Ut(t,n))}function Ut(t,e){const o=C(e),n=o==="blue"?"#58a6ff":o==="green"?"#3fb950":o==="vector"?"#a371f7":"#6e7681",r=o==="blue"?"蓝灯":o==="green"?"绿灯":o==="vector"?"向量":"关闭",a=e.type==="selective"&&e.keys.length?`<span class="lorelamp-keys">${u(e.keys.join("、"))}</span>`:"";return $(`<div class="lorelamp-entry">
       <span class="lorelamp-dot" style="background:${n}"></span>
       <span class="lorelamp-entry-name" title="${u(e.content)}">${u(e.comment||`(uid ${e.uid})`)}</span>${a}
       <label class="lorelamp-switch" title="${r}">
         <input type="checkbox" data-book="${gt(t)}" data-uid="${e.uid}" ${e.enabled?"checked":""}>
         <span class="lorelamp-slider"></span>
       </label>
     </div>`).find("input[type=checkbox]").on("change",function(){const l=Number($(this).attr("data-uid")),i=this.checked;kt(t,l,i).then(()=>E()).catch(s=>{toastr.error(`开关失败：${s}`),this.checked=!i})}).end()}function Yt(){$("#lorelamp-floormax").text(M()?`共 ${v()+1} 层(0-${v()})`:"（未打开聊天）")}async function et(){if(!M()){toastr.warning("请先打开一个聊天。");return}const t=mt(String($("#lorelamp-floor").val()??""),v());if(!t){toastr.warning("楼层格式不对，例如 3-20 或 12。");return}const e=$('input[name="lorelamp-dir"]:checked').val(),o=$("#lorelamp-extract");o.prop("disabled",!0).text("提炼中…");try{const n=await Rt(e,t.start,t.end);d.length=0,d.push(...n),P(),toastr.success(`提炼出 ${n.length} 条设定。`)}catch(n){d.length=0,P(),toastr.error(`提炼失败：${n}`)}finally{o.prop("disabled",!1).text("提炼楼层")}}function P(){const t=$("#lorelamp-preview");t.empty();const e=$("#lorelamp-preview-actions");if(d.length===0){t.html('<div class="lorelamp-hint">点击「提炼楼层」后，这里会显示拟写入的条目。</div>'),e.addClass("lorelamp-hidden");return}e.removeClass("lorelamp-hidden"),d.forEach((o,n)=>{const r=o.light==="blue"?"蓝灯":"绿灯",a=o.light==="blue"?"#58a6ff":"#3fb950",l=o.keys.length?`<div class="lorelamp-keys">关键词：${u(o.keys.join("、"))}</div>`:"";t.append($(`<div class="lorelamp-preview-entry">
         <label><input type="checkbox" data-pidx="${n}" checked> 写入</label>
         <span class="lorelamp-dot" style="background:${a}"></span><b>${r}</b>
         <div class="lorelamp-name">${u(o.name)}</div>
         <div class="lorelamp-content">${u(o.content)}</div>
         ${l}
       </div>`))})}async function zt(){if(d.length===0){toastr.warning("没有可写入的内容，请先提炼。");return}const t=[];if($("#lorelamp-preview input[type=checkbox]:checked").each((n,r)=>{const a=Number($(r).attr("data-pidx"));d[a]&&t.push(d[a])}),t.length===0){toastr.warning("请至少勾选一条想写入的设定。");return}const e=$('input[name="lorelamp-mode"]:checked').val()==="perm",o=$("#lorelamp-write");o.prop("disabled",!0).text("写入中…");try{let n;if(e){const r=String($("#lorelamp-permname").val()??"").trim()||T();n=await Ot(t,r,!1)}else n=await Lt(t);d.length=0,P(),R(),I(),E(),toastr.success(`已写入 ${t.length} 条到「${n}」。`)}catch(n){toastr.error(`写入失败：${n}`)}finally{o.prop("disabled",!1).text("写入世界书")}}N.on(G.APP_READY,X);N.on("chatLoaded",tt);N.on(G.CHAT_CHANGED,tt);const qt=800;async function nt(){if($("#chat").length&&globalThis.SillyTavern){X();return}setTimeout(nt,qt)}nt();
//# sourceMappingURL=index.js.map

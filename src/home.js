/* ================================================================
   居家版：居家復能治療師、居家服務員、家屬在家使用
   - 機構類型「居家」：每天都可練習、執行者改為家屬／居服員／外籍看護／長輩自己
   - 「團體介入」改為「生活中練習」：把練習放進起床、上廁所、吃飯、看電視等日常時刻
   - 評估多一段「居家環境與照顧資源」
   ================================================================ */
const isHome = () => true;   // 居家版：固定為居家情境
const homeRole = () => Store.DB.meta.homeRole || '治療師';
const isFamily = () => isHome() && homeRole() === '家屬';
const HOME_ROLES = [
  ['治療師', '居家復能治療師', '評估、開計畫，教家屬和居服員怎麼陪練；把「家人版連結」傳給家屬，每週回傳紀錄'],
  ['居家服務員', '居服督導／居服員', '依計畫在服務時段陪長輩練習並勾選，也能把生活中練習交給家屬'],
  ['家屬', '家屬自己用', '照治療師給的計畫每天陪長輩練，或自己挑幾個簡單的練習開始'],
];
const HOME_EXECUTORS = ['家屬', '居家服務員', '外籍看護', '長輩自己', '治療師'];
const execList = () => isHome() ? HOME_EXECUTORS : EXECUTORS;
const defaultExecutor = () => isHome() ? (homeRole() === '居家服務員' ? '居家服務員' : '家屬') : '照顧服務員';

/* ---------- 生活中練習（居家版取代團體） ---------- */
const ROUTINES = [
  ['起床後', '先坐在床邊動動腳踝 10 下，坐穩 30 秒再站起來', 'assets/ex/ankle-circle.jpg'],
  ['上廁所時', '起身前先扶好扶手，自己站起來、自己拉褲子，家人只在旁邊看', 'assets/ex/toilet-transfer.jpg'],
  ['吃飯時', '自己拿湯匙或筷子吃，家人不代勞；飯後自己把碗拿到流理台', 'assets/ex/adl_feed.jpg'],
  ['洗澡、穿衣時', '自己做得到的部分自己做，家人只幫最後一步', 'assets/ex/adl_dress.jpg'],
  ['看電視時', '廣告時間做坐姿抬膝或扶椅踮腳，一段廣告做一組', 'assets/ex/seated-march.jpg'],
  ['做家務時', '一起摺衣服、擦桌子、挑菜，讓長輩負責一件事', 'assets/ex/towel-folding.jpg'],
  ['散步、外出時', '每天走到巷口或公園，和鄰居打招呼再走回家', 'assets/ex/walking-program.jpg'],
  ['聊天時', '一起看老照片、說說今天的日期和天氣', 'assets/ex/cog_ro.jpg'],
  ['興趣時間', '畫畫、唱歌、種花、寫書法，做長輩喜歡的事', 'assets/ex/grp_art.jpg'],
  ['睡前', '慢慢深呼吸 5 次，回想今天做到了哪些事', 'assets/ex/breathing.jpg'],
];
const ROUTINE_IMG = Object.fromEntries(ROUTINES.map(r => [r[0], r[2]]));
const routineHow = t => ROUTINES.find(r => r[0] === t)?.[1] || '';
/* 評估建議的團體 → 居家對應的生活時刻 */
const GRP2ROUTINE = { '運動團體':'看電視時', '認知團體':'聊天時', '懷舊團體':'聊天時', '社交團體':'散步、外出時', '手工藝團體':'做家務時', '藝術團體':'興趣時間', '音樂團體':'興趣時間', '園藝團體':'興趣時間' };
const mapGrp = t => isHome() ? (GRP2ROUTINE[t] || t) : t;
const grpTypes = () => isHome() ? ROUTINES.map(r => r[0]) : GROUP_TYPES;
const grpImg = t => (isHome() ? ROUTINE_IMG[t] : GROUP_IMG[t]) || GROUP_IMG[t] || (isHome() ? CAT_IMG['日常功能'] : GROUP_IMG._);
const GL = () => isHome() ? { sec:'生活中練習', tag:'生活中', unit:'時刻', hint:'把練習放進每天本來就會做的事，不用另外找時間', rate:'生活中練習執行率', ok:'有做到', part:'部分做到', skip:'沒做到' }
                         : { sec:'團體介入', tag:'團體', unit:'團體', hint:'勾選要參加的團體即可，不需填活動紀錄', rate:'團體參與率', ok:'有參加', part:'部分參與', skip:'未參加' };

/* ---------- 居家環境與照顧資源 ---------- */
const HOME_ENV = [
  { k:'bathSlip', n:'浴室地面濕滑、沒有止滑墊', dev:['防滑措施'], fix:'浴室鋪止滑墊或貼止滑條' },
  { k:'toiletBar', n:'馬桶旁沒有扶手、馬桶太低', dev:['馬桶扶手架', '馬桶增高器'], fix:'加裝馬桶扶手或增高座' },
  { k:'showerSeat', n:'站著洗澡、沒有洗澡椅', dev:['洗澡椅', '長柄沐浴刷'], fix:'改坐洗澡椅洗澡' },
  { k:'threshold', n:'門檻、高低差（浴室、房門、大門）', dev:['斜坡板（門檻）'], fix:'門檻貼醒目膠帶或加斜坡板' },
  { k:'stairs', n:'樓梯沒有扶手或只有一側', dev:['固定式扶手'], fix:'樓梯兩側加裝扶手' },
  { k:'night', n:'夜間走道、廁所太暗', dev:['感應夜燈與大面板開關'], fix:'臥室到廁所裝感應夜燈' },
  { k:'clutter', n:'走道堆放雜物、電線、地毯會絆倒', dev:[], fix:'清出走道、固定電線、移除小地毯' },
  { k:'bed', n:'床太高或太低、起身沒地方扶', dev:['床邊扶手與起身拉繩'], fix:'床高調到坐著時膝蓋約 90 度，床邊加扶手' },
  { k:'chair', n:'常坐的椅子太軟太低、沒有扶手', dev:[], fix:'換成有扶手、坐面較硬的椅子' },
  { k:'reach', n:'常用物品放太高或太低', dev:['穿衣棒與長柄取物夾'], fix:'常用物品放在腰到肩膀的高度' },
];
const CARE_OPTS = { carer:['配偶', '子女', '媳婦／女婿', '外籍看護', '其他親友', '獨居'], hours:['無', '每週 1–5 小時', '每週 6–10 小時', '每週 11 小時以上'] };
function homeEnvProblem(a){
  const e = a?.env || {}, hit = HOME_ENV.filter(x => e[x.k]);
  return hit.length ? { code:'env', text:`居家環境有 ${hit.length} 項跌倒風險（${hit.map(x => x.n.split('、')[0]).join('、')}）`, ex:[], dev:[...new Set(hit.flatMap(x => x.dev))], grp:[], referral:'', fix:hit.map(x => x.fix) } : null;
}
function homeEnvHTML(){
  return `<p class="hint">到長輩家實際走一趟：臥室 → 廁所 → 浴室 → 客廳 → 大門。勾選有的情形，系統會建議環境調整與輔具。</p>
    <div class="env-grid">${HOME_ENV.map(x => F.check('env.' + x.k, `${esc(x.n)}<small>${esc(x.fix)}</small>`)).join('')}</div>
    <div class="form-grid g3">${F.field('主要照顧者', F.select('care.carer', CARE_OPTS.carer))}${F.field('居家服務時數', F.select('care.hours', CARE_OPTS.hours))}${F.field('白天誰陪長輩', F.input('care.day', { ph:'例：太太、外籍看護' }))}
      ${F.field('照顧者能陪練的時間', F.input('care.time', { ph:'例：晚飯後 20 分鐘' }), { cls:'span2' })}${F.field('照顧者的擔心', F.input('care.worry', { ph:'例：怕他跌倒、腰不好扶不動' }))}</div>`;
}
function homeEnvDocBlocks(a, H){
  const f = !!a, e = a?.env || {}, c = a?.care || {};
  return [H('居家環境與照顧資源'),
    { t:'table', head:['居家環境（有的請勾）', '建議調整'], widths:[4.5, 4.5], fs:9, rows:HOME_ENV.map(x => [`${f && e[x.k] ? '☑' : BOX} ${x.n}`, x.fix]) },
    { t:'kv', rows:[['主要照顧者', f ? c.carer || '' : ''], ['居家服務時數', f ? c.hours || '' : ''], ['白天誰陪長輩', f ? c.day || '' : ''], ['能陪練的時間', f ? c.time || '' : ''], ['照顧者的擔心', f ? c.worry || '' : '']] }];
}

/* ---------- 家人版連結：把計畫壓縮進網址，傳給家屬或居服員用手機勾選 ---------- */
async function packShare(obj){
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let out = bytes;
  if (typeof CompressionStream !== 'undefined') out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let bin = ''; for (let i = 0; i < out.length; i += 32768) bin += String.fromCharCode(...out.subarray(i, i + 32768));
  return (out === bytes ? 'j' : 'z') + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function unpackShare(s){
  const kind = s[0], b = Uint8Array.from(atob(s.slice(1).replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0));
  const raw = kind === 'z' ? new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : b;
  return JSON.parse(new TextDecoder().decode(raw));
}
function sharePayload(pl){
  const c = Store.get('clients', pl.clientId);
  return { v:1, id:pl.id, n:c.name, by:pl.author || '', r:pl.role || '', s:pl.startDate, e:pl.endDate, cau:c.caution || '',
    g:(pl.goals || []).map(g => g.text).filter(Boolean),
    i:(pl.items || []).map(it => ({ id:it.id, n:it.name, d:it.dose || '', t:it.times || 1, w:it.days || [], x:it.executor || '', h:it.how || '', c:it.caution || '', img:itemImg(it) || '' })),
    r2:(pl.groups || []).map(g => ({ id:'g:' + g.type, n:g.type, h:g.note || (isHome() ? routineHow(g.type) : ''), w:g.days?.length ? g.days : defaultDays(), img:grpImg(g.type), grp:!isHome() })) };
}
async function shareLink(planId){
  const pl = Store.get('plans', planId), c = Store.get('clients', pl.clientId);
  const url = location.href.split('#')[0] + '#/share/' + await packShare(sharePayload(pl));
  openModal('傳給家屬／居服員', `<p>把這個連結用 LINE 傳給陪長輩練習的人，對方用手機打開就能看到<b>今天要練什麼（附圖）</b>，點一下就能勾選。</p>
    <div class="notice">${icon('alert', 16)} 連結裡含有「${esc(c.name)}」的名字與練習內容，<b>只傳給家屬或負責的居服員</b>。對方的勾選紀錄只存在他自己的手機，可以按「傳回紀錄」把一週結果用 LINE 傳回給您。計畫修改後請重新傳一次連結。</div>
    <textarea class="inp" rows="4" readonly onclick="this.select()">${esc(url)}</textarea>
    <div class="btn-row">${btn('複製連結', `markShared('${pl.id}');navigator.clipboard.writeText(${esc(JSON.stringify(url))}).then(()=>toast('已複製，可以貼到 LINE'))`, { k:'primary' })}<a class="btn" href="https://line.me/R/msg/text/?${encodeURIComponent(`${c.name} 的居家練習（點開就能勾選）：\n${url}`)}" target="_blank" rel="noopener" onclick="markShared('${pl.id}')">用 LINE 傳送</a><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">先預覽</a></div>
    <p class="hint">連結長度約 ${url.length} 字元。家屬按「傳回紀錄」後，您會收到一段文字和一個連結，點連結就能把紀錄匯入這裡。</p>`, {});
}
function markShared(id){ const p = Store.get('plans', id); if (!p) return; p.sharedAt = new Date().toISOString(); Store.upsert('plans', p); Store.flush();
}

/* 家人版頁面：不需要登入、不讀主資料庫；勾選存在這支手機 */
const SH = { data:null, key:'', day:null };
const shGet = () => { try { return JSON.parse(localStorage.getItem(SH.key) || '{}'); } catch(e){ return {}; } };
const shSet = o => { try { localStorage.setItem(SH.key, JSON.stringify(o)); } catch(e){ toast('手機儲存空間不足，無法儲存', 'err'); } };
async function pageShare(code){
  document.body.classList.add('share-mode');
  try { SH.data = await unpackShare(code); } catch(e){ $('#main').innerHTML = `<section class="card">${empty('連結不完整或已損壞，請請治療師重新傳一次。')}</section>`; return; }
  SH.key = 'rehabh:share:' + SH.data.id; renderShare();
}
function renderShare(){
  const D = SH.data, d = SH.day || todayISO(), rec = shGet(), wd = weekday(d);
  const items = [...D.i.map(x => ({ ...x, kind:'i' })), ...D.r2.map(x => ({ ...x, kind:'r', d:'', t:1, x:'' }))].filter(x => (x.w || []).includes(wd) && d >= D.s && d <= D.e);
  const done = items.filter(x => rec[d + '|' + x.id]).length;
  document.title = D.n + ' 的居家練習';
  $('#main').innerHTML = `<div class="sh">
    <header class="sh-h"><div class="logo">${LOGO_SVG}</div><div><b>${esc(D.n)} 的居家練習</b><small>${D.by ? `由 ${esc(D.by)}${D.r ? '（' + esc(D.r) + '）' : ''} 開立｜` : ''}${rocDate(D.s)}～${rocDate(D.e)}</small></div></header>
    ${D.g.length ? `<section class="sh-goal"><b>我們一起努力的目標</b>${D.g.map(g => `<p>${esc(g)}</p>`).join('')}</section>` : ''}
    ${D.cau ? `<p class="sh-cau">⚠ ${esc(D.cau)}</p>` : ''}
    <div class="sh-who"><span>我是</span>${['家屬', '居家服務員', '外籍看護', '長輩自己'].map(w => `<button type="button" class="chip ${shWho() === w ? 'hl' : ''}" onclick="shSetWho('${w}')">${w}</button>`).join('')}</div>
    <div class="sh-day"><button class="btn" onclick="SH.day=addDays('${d}',-1);renderShare()">${icon('back', 16)}前一天</button><b>${d === todayISO() ? '今天' : rocDate(d).slice(-5)}（週${WEEKDAYS[wd]}）</b><button class="btn" onclick="SH.day=addDays('${d}',1);renderShare()" ${d >= todayISO() ? 'disabled' : ''}>後一天</button></div>
    <p class="sh-prog">${items.length ? `已完成 <b>${done}</b>／${items.length}　${done === items.length ? '<span class="card-done">✓ 今天都做完了，辛苦了！</span>' : '做完點一下，再點＝做一部分，再點＝沒做'}` : '今天沒有排定的練習，休息一下。'}</p>
    <div class="sh-list">${items.map(x => { const s = rec[d + '|' + x.id] || ''; return `<article class="sh-it ${s ? 's-' + s : ''}"><img src="${esc(x.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div class="sh-tx">${x.kind === 'r' ? `<span class="grp-tag">${x.grp ? '團體' : '生活中'}</span>` : ''}<b>${esc(x.n)}</b>${x.d ? `<span class="sh-dose">${esc(x.d)}${x.t > 1 ? `，一天 ${x.t} 次` : ''}</span>` : ''}${x.h ? `<small>${esc(x.h)}</small>` : ''}${x.c ? `<small class="warn-t">注意：${esc(x.c)}</small>` : ''}${x.x ? `<small class="muted">陪練：${esc(x.x)}</small>` : ''}</div>
      <button class="sh-btn" onclick="shTap('${d}','${esc(x.id)}')" aria-label="${esc(x.n)}：${s ? ST_LABEL[s] : '尚未記錄'}">${s ? SYM[s] + '<small>' + ST_LABEL[s] + '</small>' : '<small>點我</small>完成'}</button></article>`; }).join('')}</div>
    <section class="card sh-note"><h2>今天的狀況 <small>選填</small></h2><textarea class="inp" rows="2" placeholder="例：今天膝蓋有點痛，只做一半" onchange="const r=shGet();r['note|${d}']=this.value;shSet(r);toast('已記下')">${esc(rec['note|' + d] || '')}</textarea></section>
    <div class="btn-row sh-foot">${btn('傳回這週紀錄給治療師', 'shReport()', { k:'primary', i:'upload' })}${btn('印出這週勾選表', 'window.print()', { i:'print' })}</div>
    <p class="hint">紀錄只存在這支手機。換手機或清除瀏覽資料會不見，請每週按「傳回紀錄」。</p></div>`;
}
const shWho = () => { try { return localStorage.getItem('rehabh:shareWho') || '家屬'; } catch(e){ return '家屬'; } };
function shSetWho(w){ try { localStorage.setItem('rehabh:shareWho', w); } catch(e){} renderShare(); }
function shTap(d, id){ const r = shGet(), k = d + '|' + id, n = NEXT[r[k] || '']; if (n) r[k] = n; else delete r[k]; shSet(r); renderShare(); }
async function shReport(){
  const D = SH.data, rec = shGet(), end = SH.day || todayISO(), start = addDays(end, -6), lines = [`【${D.n} 居家練習紀錄】${rocDate(start)}～${rocDate(end)}（${shWho()}）`];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(end, -i), wd = weekday(d); if (d < D.s || d > D.e) continue;
    const its = [...D.i, ...D.r2].filter(x => (x.w || []).includes(wd)); if (!its.length) continue;
    const mk = its.map(x => `${x.n}${SYM[rec[d + '|' + x.id]] || '－'}`).join('、');
    lines.push(`${rocDate(d).slice(-5)}（${WEEKDAYS[wd]}）${mk}${rec['note|' + d] ? '｜' + rec['note|' + d] : ''}`);
  }
  lines.push('✓完成 △部分 ✕沒做 －未記錄');
  // 匯入用連結：近 14 天的勾選與備註（治療師點開即可匯入）
  const from = addDays(end, -13), r = {}, notes = {};
  for (const [k, v] of Object.entries(rec)) { const [d, id] = k.split('|'); if (d === 'note') { if (id >= from && id <= end && v) notes[id] = v; } else if (d >= from && d <= end) r[k] = v; }
  const link = location.href.split('#')[0] + '#/import/' + await packShare({ v:1, id:D.id, n:D.n, by:shWho(), from, to:end, r, notes });
  lines.push('', '治療師點這個連結就能匯入紀錄：', link);
  const txt = lines.join('\n');
  openModal('傳回紀錄', `<p>以下文字已整理好（含匯入連結），複製後貼到和治療師的 LINE 對話即可。</p><textarea class="inp" rows="10" readonly onclick="this.select()">${esc(txt)}</textarea>
    <div class="btn-row">${btn('複製', `navigator.clipboard.writeText(${esc(JSON.stringify(txt))}).then(()=>toast('已複製'))`, { k:'primary' })}<a class="btn" href="https://line.me/R/msg/text/?${encodeURIComponent(txt)}" target="_blank" rel="noopener">用 LINE 傳送</a></div>`, {});
}
/* 治療師端：點家屬傳回的連結，把紀錄匯入對應的計畫 */
async function importReturn(code){
  let R; try { R = await unpackShare(code); } catch(e){ $('#main').innerHTML = `<section class="card">${empty('紀錄連結不完整，請家屬重新按一次「傳回紀錄」。')}</section>`; return; }
  const p = Store.get('plans', R.id);
  setTitle('匯入家屬傳回的紀錄', R.n || '');
  if (!p) { $('#main').innerHTML = `<section class="card">${empty(`這份紀錄的計畫（${esc(R.n || '')}）不在這台電腦或瀏覽器裡。請用開立計畫的那台電腦打開這個連結。`, `<a class="btn" href="#/">回首頁</a>`)}</section>`; return; }
  const c = Store.get('clients', p.clientId), ids = new Set(checkables(p).map(x => x.id));
  let n = 0, changed = 0;
  for (const [k, st] of Object.entries(R.r || {})) {
    const [d, id] = k.split('|'); if (!ids.has(id) || !['ok', 'part', 'skip'].includes(st)) continue;
    const cur = Store.all('checks').find(x => x.clientId === p.clientId && x.itemId === id && x.date === d);
    if (cur?.status === st) { n++; continue; }
    Store.upsert('checks', { ...(cur || { clientId:p.clientId, planId:p.id, itemId:id, date:d }), status:st, by:`${R.by || '家屬'}（回傳）` }); n++; changed++;
  }
  const nn = Object.entries(R.notes || {});
  for (const [d, t] of nn) {
    const wk = weekStart(d), w = Store.all('weekNotes').find(x => x.planId === p.id && x.week === wk) || { planId:p.id, clientId:p.clientId, week:wk, note:'' };
    const line = `${rocDate(d).slice(-5)} ${R.by || '家屬'}：${t}`; if (!(w.note || '').includes(line)) { w.note = [w.note, line].filter(Boolean).join('\n'); Store.upsert('weekNotes', w); }
  }
  p.lastReturn = new Date().toISOString(); Store.upsert('plans', p); await Store.flush();
  $('#main').innerHTML = `<section class="card"><h2>已匯入 ${esc(c?.name || R.n)} 的居家練習紀錄</h2>
    <p>${rocDate(R.from)}～${rocDate(R.to)}，由<b>${esc(R.by || '家屬')}</b>傳回：共 ${n} 筆勾選（${changed} 筆新增或更新）${nn.length ? `、${nn.length} 則狀況備註（已加到每週備註）` : ''}。</p>
    <div class="btn-row"><a class="btn primary" href="#/client/${p.clientId}/check">看執行紀錄與趨勢</a><a class="btn" href="#/">回首頁</a></div></section>`;
  history.replaceState(null, '', location.pathname + location.search + '#/client/' + p.clientId + '/check');   // 重新整理時不會重複匯入
}

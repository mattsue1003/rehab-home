/* ================================================================
   頁面：首頁（待辦）→ 個案 → 初評 → 訓練目標 → 每次訪視紀錄 → 居家指導 → 結案／延案 → 表單
   編輯中的內容即時存檔（不需要按儲存）
   ================================================================ */
const me = () => Store.DB.meta.therapist || {};
const thName = () => me().name || '';
let saveTimer = null;
function autosave(coll){
  S.onEdit = (p, el) => { Store.upsert(coll, S.edit); S.dirty = false; flashSaved(); if (S.live) S.live(p, el); };
}
function flashSaved(){ const el = $('#saved'); if (!el) return; el.textContent = '✓ 已自動儲存'; el.classList.add('on'); clearTimeout(saveTimer); saveTimer = setTimeout(() => el.classList.remove('on'), 1400); }
const savedTag = () => `<span id="saved" class="saved" aria-live="polite"></span>`;

/* 片語按鈕：點一下把文字帶入欄位（set＝取代、add＝接在後面） */
function chips(path, list, mode = 'add'){
  if (!list?.length) return '';
  return `<div class="chips">${list.map(t => `<button type="button" class="chip-b" data-p="${esc(path)}" data-t="${esc(t)}" data-m="${mode}" onclick="chipIn(this)">${mode === 'set' ? '' : '+ '}${esc(t)}</button>`).join('')}</div>`;
}
function chipIn(b){
  const p = b.dataset.p, t = b.dataset.t, m = b.dataset.m, cur = String(V(p) ?? '').trim();
  const sep = /content|advice|assess|closing/.test(p) ? '；' : '、';
  const v = m === 'set' || !cur ? t : cur.includes(t) ? cur : cur.replace(/[。；、，]$/, '') + sep + t;
  setPath(S.edit, p, v);
  const el = document.querySelector(`[data-bind="${CSS.escape(p)}"]`); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles:true })); el.focus(); }
  else S.onEdit && S.onEdit(p);
}
const scoreOpts = () => Array.from({ length:10 }, (_, i) => [i + 1, String(i + 1)]);

/* ---------------- 首頁 ---------------- */
function pageHome(){
  const m = Store.DB.meta;
  if (!m.therapist?.name && !m.setupDone) return pageSetup();
  setTitle(APP_TITLE, rocDate(todayISO()) + '（星期' + WEEKDAYS[weekday(todayISO())] + '）');
  const cs = Store.all('clients'), today = todayISO();
  const act = cs.map(c => ({ c, ep:activeEp(c.id) })).filter(x => x.ep);
  const closed = cs.map(c => ({ c, ep:lastEp(c.id) })).filter(x => x.ep?.status === '已結案');
  const todo = [];
  for (const { c, ep } of [...act, ...closed]) for (const t of epStatus(ep).tips) todo.push({ c, ep, t });
  todo.sort((a, b) => (a.t.k === 'red' ? 0 : 1) - (b.t.k === 'red' ? 0 : 1));
  const tabOf = a => ({ visit:'visits', goals:'goals', close:'close', guide:'guide' }[a] || 'visits');
  const todoCard = `<section class="card"><h2>待處理 ${todo.length ? `<small>${todo.length} 件</small>` : ''}</h2>${todo.length ? `<ul class="todo">${todo.map(({ c, t }) => `<li><span class="tt"><span class="dot ${t.k}"></span><a href="#/case/${c.id}/${tabOf(t.a)}"><b>${esc(c.name)}</b></a> <small>${esc(t.t)}</small></span><a class="btn sm" href="#/case/${c.id}/${tabOf(t.a)}">處理</a></li>`).join('')}</ul>` : empty(cs.length ? '✓ 目前沒有待處理事項' : '尚無個案')}</section>`;
  const week = act.map(({ c, ep }) => ({ c, ep, s:epStatus(ep) })).sort((a, b) => (a.s.next || '0').localeCompare(b.s.next || '0'));
  const visitCard = `<section class="card"><h2>近期訪視 <small>依「每週 1 次」推算下次日期</small></h2>${week.length ? `<ul class="todo">${week.map(({ c, ep, s }) => `<li><span class="tt"><a href="#/case/${c.id}/visits"><b>${esc(c.name)}</b></a> <small>${s.n ? `已訪 ${s.n}／${s.cap} 次｜下次約 ${rocDate(s.next).slice(-5)}${s.next < today ? '（已超過）' : ''}` : '尚未初評'}</small><span class="mini-bar"><i style="width:${pct(s.n, s.cap) || 0}%"></i></span></span><a class="btn sm primary" href="#/visit/new/${ep.id}">${s.n ? `寫第 ${s.n + 1} 次` : '寫初評'}紀錄</a></li>`).join('')}</ul>` : empty('沒有服務中的個案')}</section>`;
  const startCard = `<section class="card guide"><h2>還沒有個案資料</h2><p>可以先載入 <b>3 個模擬個案</b>：一位剛初評、一位進行到第二組、一位剛結案，看看目標怎麼寫、每次紀錄怎麼貼到照管系統。看完可一鍵清除。</p><div class="btn-row">${btn('載入 3 個模擬個案', 'loadDemo()', { k:'primary', i:'users' })}${btn('新增個案', 'editClient()', { i:'plus' })}</div></section>`;
  return `${cs.length ? `<div class="grid2">${todoCard}${visitCard}</div>` : startCard}${flowHTML()}${rulesCard()}`;
}
function flowHTML(){
  return `<div class="flow5">${[['初評', '最想做到的事、居家環境、照顧者'], ['訓練目標', '3–5 項，5 大要素，第一組結束前完成'], ['每次訪視紀錄', '五個欄位一鍵複製到照管系統'], ['居家指導', '圖文指導用 LINE 傳給案家，案家回填次數'], ['結案／延案', '前後分數、結案報告 7 個工作天內']].map(([t, d], i) => `<span class="f5"><span class="sn">${i + 1}</span><span><b>${t}</b><small>${d}</small></span></span>`).join('<span class="fa">→</span>')}</div>`;
}
function rulesCard(open){
  return `<details class="card rules" ${open ? 'open' : ''}><summary><h2>CA07 規則速查 <small>衛福部長照專業服務操作指引、紀錄表-1（114/9/1 修訂）</small></h2></summary>
  <div class="rule-grid">
    <div><b>給付</b><p>3 次訪視（含評估）為 1 組，4,500 元。同一目標上限 12 次或 6 個月，原則每週 1 次，每次約 50–60 分鐘。</p></div>
    <div><b>目標</b><p>個案／家屬自選的日常活動，不是「能走路」「手會動」。3–5 項訓練目標，第一組結束前寫完。每項含：執行活動、方式／環境、協助程度、時限、可測量。</p></div>
    <div><b>指導對象</b><p>要納入主要照顧者（家屬或外籍家庭看護工），而且固定同一人（組）。</p></div>
    <div><b>每次紀錄</b><p>照管系統必填：復能目標達成情形、復能目標、指導對象、服務內容、指導建議摘要。每次都要交書面指導紀錄給案家，可用 LINE、照片或影片連結。</p></div>
    <div><b>結案</b><p>達成目標、照顧者已習得技巧、一組服務後仍無明顯進步、無法配合、無意願或潛力、狀況改變。結案後 7 個工作天內完成報告並登錄系統。</p></div>
    <div><b>延案與重啟</b><p>延案須在剩 4 次前提出，最多原核定組數的 1/2，需服務中有進步且預期原計畫內無法達成。同碼別新目標需間隔 90 天。</p></div>
  </div><p class="hint">各縣市作業規定可能略有不同，請以所屬照管中心公告為準。</p></details>`;
}
/* 第一次使用：填治療師資料 */
function pageSetup(){
  setTitle(APP_TITLE, '開始使用');
  return `<section class="card setup"><h2>開始使用</h2>
    <p>這是給 <b>CA07 居家復能</b>治療師用的紀錄工具：寫好訓練目標、每次訪視的照管系統欄位一鍵複製，指導單用 LINE 傳給案家。<b>資料只存在這台裝置的瀏覽器，不會上傳。</b></p>
    <div class="form-grid"><div class="field"><label class="lbl">您的姓名（印在表單與指導單上）</label><input class="inp" id="su-name" placeholder="例：林○君"></div>
    <div class="field"><label class="lbl">職稱</label><select class="inp" id="su-title">${PRO_ROLES.slice(0, 4).map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field"><label class="lbl">單位名稱（選填，印在表單抬頭）</label><input class="inp" id="su-org" placeholder="例：○○物理治療所"></div>
    <div class="field"><label class="lbl">聯絡電話（選填，印在指導單上）</label><input class="inp" id="su-ph" placeholder="例：0912-345-678"></div></div>
    <div class="btn-row">${btn('開始使用', 'setupDone()', { k:'primary' })}${btn('先看模擬個案', 'setupDone(true)')}</div></section>`;
}
function setupDone(demo){
  Store.setMeta('therapist', { name:$('#su-name')?.value.trim() || '', title:$('#su-title')?.value || '', phone:$('#su-ph')?.value.trim() || '' });
  const o = $('#su-org')?.value.trim(); if (o) Store.setMeta('orgName', o);
  Store.setMeta('setupDone', true); renderShell(); if (demo) loadDemo(); else route();
}

/* ---------------- 個案名冊 ---------------- */
function pageClients(){
  setTitle('個案', `${Store.all('clients').length} 位`);
  const rows = Store.all('clients').map(c => ({ c, ep:lastEp(c.id) })).sort((a, b) => ((a.ep?.status === '已結案') - (b.ep?.status === '已結案')) || a.c.name.localeCompare(b.c.name));
  return `<div class="toolbar"><span class="sp"></span>${btn('新增個案', 'editClient()', { k:'primary', i:'plus' })}</div>
  <section class="card"><table class="tbl" id="ctable"><thead><tr><th>姓名</th><th>狀態</th><th>進度</th><th>主要照顧者</th><th></th></tr></thead><tbody>${rows.map(({ c, ep }) => { const s = ep ? epStatus(ep) : null; return `<tr><td><a href="#/case/${c.id}"><b>${esc(c.name)}</b></a><br><small class="muted">${esc([c.gender, ageAt(c.birth) != null ? ageAt(c.birth) + '歲' : '', c.dx].filter(Boolean).join('・'))}</small></td>
    <td>${!ep ? badge('未建立期程', 'amber') : ep.status === '已結案' ? badge('已結案', '') : badge('服務中', 'green')}</td><td>${s ? `${s.n}／${s.cap} 次${s.tips.some(t => t.k === 'red') ? ' ' + badge('待處理', 'red') : ''}` : ''}</td><td>${esc(ep?.carer?.name ? `${ep.carer.name}（${ep.carer.rel || ''}）` : '')}</td><td><a class="btn sm" href="#/case/${c.id}">開啟</a></td></tr>`; }).join('') || `<tr><td colspan="5">${empty('還沒有個案', btn('新增個案', 'editClient()', { k:'primary' }))}</td></tr>`}</tbody></table></section>`;
}
function editClient(id){
  const c = id ? Store.get('clients', id) : null;
  S.edit = c ? clone(c) : { name:'', gender:'', birth:'', dx:'', cms:'', phone:'', address:'' };
  S.onEdit = null;
  openModal(c ? '編輯基本資料' : '新增個案', `<div class="form-grid">${F.field('姓名', F.input('name', { ph:'例：王○德' }), { req:true })}${F.field('性別', F.radios('gender', ['男', '女']))}${F.field('出生日期', F.date('birth'))}${F.field('長照需要等級', F.select('cms', CMS_LEVELS.slice(1)))}${F.field('主要診斷', F.input('dx', { ph:'例：右側中風、左髖骨折術後' }), { cls:'span2' })}${F.field('聯絡電話', F.input('phone'))}${F.field('地址（選填）', F.input('address'))}</div>
    ${c ? '' : '<p class="hint">建立後會同時開一個 CA07 服務期程，接著填照會資料與初評。</p>'}`,
    { extra:c ? btn('刪除個案', `deleteClient('${c.id}')`, { k:'danger ghost' }) : '', onSave:() => {
      if (!S.edit.name?.trim()) { toast('請填寫姓名', 'err'); return false; }
      const saved = Store.upsert('clients', S.edit); S.dirty = false;
      if (!c) { Store.upsert('episodes', newEpisode(saved.id)); App.go(`#/case/${saved.id}/assess`); } else route();
    }, restore:() => { S.dirty = false; route(); } });
}
function newEpisode(cid, o = {}){
  const prev = lastEp(cid);
  return { clientId:cid, code:'CA07', status:'服務中', referDate:todayISO(), startDate:todayISO(), groups:2, freq:'每週 1 次', problems:[], serviceGoal:'', nhi:'無', nhiNote:'',
    caseMgr:prev?.caseMgr || '', aUnit:prev?.aUnit || '', carer:prev ? clone(prev.carer || {}) : { name:'', rel:'', type:'個案家屬' }, assess:{ pri:[{}, {}, {}] }, goals:[], guide:[], closing:{}, extend:{}, ...o };
}
async function deleteClient(cid){
  const c = Store.get('clients', cid); if (!c || !askConfirm(`確定刪除「${c.name}」與所有紀錄？`)) return;
  await Folder.snapshot('刪除前');
  for (const col of ['episodes', 'visits', 'returns']) Store.all(col).filter(x => x.clientId === cid).forEach(x => Store.remove(col, x.id));
  Store.remove('clients', cid); closeModal(true); toast('已刪除'); App.go('#/clients');
}

/* ---------------- 個案頁（分頁） ---------------- */
const CTABS = [['assess', '照會與初評'], ['goals', '訓練目標'], ['visits', '訪視紀錄'], ['guide', '居家指導'], ['close', '結案／延案'], ['forms', '表單']];
function pageCase(cid, tab = '', epId){
  const c = Store.get('clients', cid); if (!c) { App.go('#/clients'); return ''; }
  let ep = epId ? Store.get('episodes', epId) : activeEp(cid) || lastEp(cid);
  if (!ep) { ep = Store.upsert('episodes', newEpisode(cid)); }
  const st = epStatus(ep);
  if (!tab) tab = !st.n ? 'assess' : st.goals.length < 3 ? 'goals' : 'visits';
  setTitle(c.name, [c.gender, ageAt(c.birth) != null ? ageAt(c.birth) + '歲' : '', c.dx, c.cms].filter(Boolean).join('・'));
  const eps = Store.all('episodes').filter(e => e.clientId === cid).sort(byDate('startDate'));
  const body = { assess:tAssess, goals:tGoals, visits:tVisits, guide:tGuide, close:tClose, forms:tForms }[tab] || tVisits;
  S.edit = clone(ep); autosave('episodes'); S.live = null;
  const head = `<div class="case-head"><div><b>CA07 ${esc(CODES[0][1])}</b> ${ep.status === '已結案' ? badge('已結案 ' + rocDate(ep.closing?.date || ''), '') : badge('服務中', 'green')}
      <small>${rocDate(ep.startDate)} 起｜核定 ${ep.groups} 組（${st.cap} 次）｜已訪 ${st.n} 次${st.n && ep.status !== '已結案' ? `｜下次約 ${rocDate(st.next).slice(-5)}` : ''}</small>
      <span class="mini-bar wide"><i style="width:${pct(st.n, st.cap) || 0}%"></i></span></div>
    <div class="btn-row">${eps.length > 1 ? `<select class="inp sm" aria-label="服務期程" onchange="App.go('#/case/${cid}/${tab}?ep='+this.value)">${eps.map(e => `<option value="${e.id}" ${e.id === ep.id ? 'selected' : ''}>${rocDate(e.startDate)} 期程${e.status === '已結案' ? '（結案）' : ''}</option>`).join('')}</select>` : ''}${btn('基本資料', `editClient('${c.id}')`, { k:'sm', i:'edit' })}${ep.status !== '已結案' ? `<a class="btn sm primary" href="#/visit/new/${ep.id}">${icon('plus', 14)}<span>寫訪視紀錄</span></a>` : ''}</div></div>
    ${st.tips.length ? `<div class="tips">${st.tips.map(t => `<a class="tip ${t.k}" href="#/case/${cid}/${({ visit:'visits' }[t.a] || t.a)}${epId ? '?ep=' + epId : ''}">${icon('alert', 15)}<span>${esc(t.t)}</span></a>`).join('')}</div>` : ''}`;
  return `<div class="toolbar"><a class="btn" href="#/clients">${icon('back', 16)}個案</a><span class="sp"></span>${savedTag()}</div>${head}
    <div class="tabs t6">${CTABS.map(([k, l], i) => `<a href="#/case/${c.id}/${k}${epId ? '?ep=' + epId : ''}" class="${tab === k ? 'on' : ''}"><span class="tn-n">${i + 1}</span>${l}</a>`).join('')}</div>${body(c, ep, st)}`;
}

/* ---------- 1. 照會與初評 ---------- */
function tAssess(c, ep){
  const sec = (t, h, o = '') => `<section class="card"><h2>${t}${o ? ` <small>${o}</small>` : ''}</h2>${h}</section>`;
  const end = ep.startDate ? addMonths(ep.startDate, Math.min(RULE.maxMonths, Math.ceil((+ep.groups || 1) * RULE.perGroup / 4.3))) : '';
  return `${sec('照會資料', `<div class="form-grid">
      ${F.field('照會日期', F.date('referDate'))}${F.field('初次進場（第一次訪視）', F.date('startDate'))}
      ${F.field('照專／A 個管員', F.input('caseMgr', { ph:'例：陳個管' }))}${F.field('A 單位', F.input('aUnit'))}
      ${F.field('核定組數', F.select('groups', [1, 2, 3, 4].map(n => [n, `${n} 組（${n * RULE.perGroup} 次）`]), { blank:false, t:'num' }), { hint:'CA07 每組 3 次（含評估）' })}${F.field('頻率', F.input('freq', { ph:'每週 1 次' }), { hint:end ? `依組數推估約至 ${rocDate(end)}` : '' })}
      ${F.field('問題清單項目', `<div class="pills wrap">${PROBLEMS.map(p => F.checkArr('problems', p, p)).join('')}</div>`, { cls:'span2', hint:'請對應照管系統已勾選的問題清單' })}
      ${F.field('同期間是否接受健保復健', F.radios('nhi', ['無', '有']) + F.input('nhiNote', { ph:'有的話：醫院／診所、頻率，如 W1.3 醫院復健' }), { cls:'span2' })}
      ${F.field('個案（或家屬）最希望改善的日常生活活動項目（專業服務目標）', F.text('serviceGoal', { rows:2, ph:'例：希望白天可以自己走到浴室上廁所，不用再穿尿布（3 個月內）' }) + `<div class="copy-row">${copyBtn(ep.serviceGoal || '', '專業服務目標')}<small class="muted">照管系統「專業服務目標管理」用</small></div>`, { cls:'span2', hint:'寫清楚活動內容與預期期程，與個案及家屬一起討論決定' })}</div>`)}
  ${sec('最想做到的事', `<p class="hint">先開放式地問：「現在生活中，哪些事是您覺得重要、最想自己做到的？」再請個案（或家屬）為目前的表現與滿意度打 1–10 分。可直接轉成訓練目標。</p>
    <table class="tbl qa"><thead><tr><th>活動</th><th>重要性</th><th>目前表現</th><th>滿意度</th><th></th></tr></thead><tbody>${(ep.assess.pri || []).map((r, i) => `<tr><td>${F.input(`assess.pri.${i}.act`, { ph:'例：自己走去廁所' })}</td><td>${F.select(`assess.pri.${i}.imp`, scoreOpts(), { t:'num' })}</td><td>${F.select(`assess.pri.${i}.perf`, scoreOpts(), { t:'num' })}</td><td>${F.select(`assess.pri.${i}.sat`, scoreOpts(), { t:'num' })}</td><td>${btn('設為目標', `priToGoal(${i})`, { k:'sm' })}</td></tr>`).join('')}</tbody></table>
    <div class="btn-row">${(ep.assess.pri || []).length < 5 ? btn('再加一列', 'S.edit.assess.pri.push({});Store.upsert("episodes",S.edit);rerender(()=>pageCase(S.edit.clientId,"assess",S.edit.id))', { k:'sm', i:'plus' }) : ''}</div>`, '個案自選、最重視的活動')}
  ${sec('個案能力狀況與特殊需求', `<div class="form-grid">
      ${F.field('主訴', F.text('assess.complaint', { rows:2 }), { cls:'span2' })}
      ${F.field('主要診斷／開刀史／用藥', F.text('assess.dx', { rows:2 }))}${F.field('過去病史', F.text('assess.history', { rows:2 }))}
      ${F.field('目前能力狀況（ADL／IADL、行動）', F.text('assess.ability', { rows:3 }) + chips('assess.ability', ['床上翻身坐起需少量協助', '使用四腳拐室內短距離行走', '轉位需一人扶持', '進食可自行', '洗澡需他人協助', '穿脫衣需部分協助', '目前包尿布']), { cls:'span2' })}
      ${F.field('認知、溝通、情緒行為', F.text('assess.mind', { rows:2 }) + chips('assess.mind', ['認知清楚可配合指令', '短期記憶差需重複提示', '表達清楚', '情緒低落、擔心跌倒', '動機佳']))}
      ${F.field('特殊照護需求', F.text('assess.special', { rows:2 }) + chips('assess.special', ['無', '皮膚易破損', '吞嚥困難', '疼痛', '營養不良', '鼻胃管']))}
      ${F.field('居家環境描述', F.text('assess.env', { rows:3 }) + chips('assess.env', ['透天厝，臥室在二樓', '公寓有電梯', '浴室門檻約 5 公分', '浴室無扶手', '走道堆放雜物', '夜間照明不足', '床太低', '已有洗澡椅']), { cls:'span2' })}
      ${F.field('家庭狀況（同住者）', F.text('assess.family', { rows:2, ph:'例：與兒子、媳婦同住，白天媳婦在家' }), { cls:'span2' })}</div>`)}
  ${sec('主要照顧者', `<div class="form-grid">
      ${F.field('姓名', F.input('carer.name', { ph:'例：王○芳' }))}${F.field('與個案關係', F.input('carer.rel', { ph:'例：媳婦' }))}
      ${F.field('身分', F.radios('carer.type', ['個案家屬', '外籍家庭看護工', '其他']))}${F.field('可配合練習的時段', F.input('carer.time', { ph:'例：早餐後、午睡起來' }))}
      ${F.field('照顧技巧評估', F.text('carer.skill', { rows:2 }) + chips('carer.skill', ['轉位時協助過多', '轉位方式正確', '不清楚如何協助行走', '會替個案完成所有事', '學習意願高', '照顧負荷大']), { cls:'span2' })}</div>
      <p class="hint">接受指導的主要照顧者應固定同一人（組），才能累積學習成效。</p>`, '指導對象要納入主要照顧者')}
  ${sec('專業服務潛力評估', `<div class="form-grid">${[['learn', '個案學習能力'], ['stable', '病情穩定度'], ['motive', '個案及家屬動機'], ['coop', '訓練配合度']].map(([k, l]) => F.field(l, F.radios('assess.pot.' + k, ['佳', '普通', '差']))).join('')}
      ${F.field('評估結果與主要問題', F.text('assess.summary', { rows:3, ph:'例：個案有意願自己如廁，主要困難為坐站轉位與害怕跌倒；浴室門檻與缺乏扶手為環境阻礙。' }), { cls:'span2' })}</div>`)}
  <details class="card"><summary><h2>標準化量表 <small>選填：巴氏量表、IADL</small></h2></summary>
    <div class="form-grid">${BARTHEL.map(it => F.field(it.n, F.select('assess.adl.' + it.k, it.opts.map(([v, l]) => [v, `${v} 分｜${l}`]), { t:'num' }))).join('')}</div>
    <p><b>巴氏量表：${scoreBarthel(ep.assess)?.total ?? '—'}</b> 分</p>
    <div class="form-grid">${IADL.map(it => F.field(it.n, F.select('assess.iadl.' + it.k, it.opts.map(([l], i) => [i, l]), { t:'num' }))).join('')}</div></details>
  <div class="btn-row end"><a class="btn primary" href="#/case/${c.id}/goals">下一步：訓練目標 →</a></div>`;
}
function priToGoal(i){
  const r = S.edit.assess.pri[i]; if (!r?.act?.trim()) return toast('請先填寫活動', 'err');
  if ((S.edit.goals || []).length >= 5) return toast('訓練目標最多 5 項', 'err');
  S.edit.goals.push(newGoal({ activity:r.act.trim(), pre:r.perf || '' })); Store.upsert('episodes', S.edit);
  toast('已加入訓練目標，請補上方式、協助程度與可測量標準'); App.go(`#/case/${S.edit.clientId}/goals`);
}

/* ---------- 2. 訓練目標 ---------- */
function newGoal(o = {}){ return { id:Store.newId(), cat:'', subject:'個案', when:'12 週內', activity:'', how:'', assist:'在旁人監督下', measure:'', short:'', who:['個案', S.edit?.carer?.type === '外籍家庭看護工' ? '外籍家庭看護工' : '個案家屬'], whoOther:'', pre:'', post:'', ...o }; }
function tGoals(c, ep){
  S.live = (p) => {
    const m = p.match(/^goals\.(\d+)\.(\w+)/); if (!m) return;
    if (m[2] === 'cat' || m[2] === 'who') return rerender(() => pageCase(c.id, 'goals', S.edit.id));
    const g = S.edit.goals[+m[1]]; g.text = composeGoal(g); Store.upsert('episodes', S.edit);
    const pv = $('#gp-' + m[1]); if (pv) pv.innerHTML = goalPreview(g);
    const gc = $('#goals-copy'); if (gc) gc.textContent = goalsText(S.edit) || '（尚未完成目標）';
  };
  const n = (ep.goals || []).length;
  return `<section class="card notice-card"><b>寫目標的原則</b>　個案（或家屬）自選的<b>日常活動</b>，含<b>執行活動、方式／環境、協助程度、時限、可測量</b>五個要素。12 週內以 <b>3–5 項</b>為原則，第一組服務結束前完成。服務介入前分數由個案或家屬自評（1 最差、10 最好）。</section>
  ${(ep.goals || []).map((g, i) => goalCard(g, i)).join('')}
  <div class="btn-row">${n < 5 ? btn(n ? '新增一項目標' : '新增第一項目標', 'addGoal()', { k:n ? '' : 'primary', i:'plus' }) : '<span class="muted">已有 5 項目標（上限）</span>'}</div>
  <section class="card"><h2>照管系統「復能目標」欄 <small>每次服務紀錄都要填</small></h2><pre class="sysbox" id="goals-copy">${esc(goalsText(ep) || '（尚未完成目標）')}</pre><div class="copy-row">${copyBtn(goalsText(ep), '復能目標')}</div></section>
  <div class="btn-row end"><a class="btn primary" href="#/visit/new/${ep.id}">寫訪視紀錄 →</a></div>`;
}
function goalCard(g, i){
  const C = CAT[g.cat] || {}, p = `goals.${i}`;
  return `<section class="card goal-c"><div class="gc-top"><h2><span class="gnum">目標 ${i + 1}</span>${g.cat ? esc(g.cat) : '<span class="muted">選擇類別</span>'}</h2><span class="sp"></span>${i ? btn('上移', `moveGoal(${i},-1)`, { k:'sm ghost' }) : ''}${btn('刪除', `delGoal(${i})`, { k:'sm ghost danger' })}</div>
    <div class="field"><label class="lbl">目標類別（單選）</label><div class="pills wrap cats">${GOAL_CATS.map(x => `<label class="pill sm"><input type="radio" name="${p}.cat" value="${esc(x)}" data-bind="${p}.cat" ${g.cat === x ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div></div>
    <div class="form-grid g5">
      ${F.field('誰要做到', F.radios(p + '.subject', ['個案', '照顧者']))}
      ${F.field('① 時限', F.select(p + '.when', WHEN, { blank:false }))}
      ${F.field('② 執行活動（日常活動）', F.input(p + '.activity', { ph:'例：白天自己走到浴室上廁所' }) + chips(p + '.activity', C.act, 'set'), { cls:'span2' })}
      ${F.field('③ 執行方式／環境／輔具', F.input(p + '.how', { ph:'例：使用四腳拐並扶著馬桶旁扶手' }) + chips(p + '.how', C.how), { cls:'span2' })}
      ${F.field('④ 協助程度', F.select(p + '.assist', ASSIST, { blank:false }))}
      ${F.field('⑤ 可測量（次數、頻率、時間）', F.input(p + '.measure', { ph:'例：一天至少 4 次' }) + chips(p + '.measure', C.meas))}
    </div>
    <div class="goal-preview" id="gp-${i}">${goalPreview(g)}</div>
    ${C.ex ? `<p class="hint ex">範例：${esc(C.ex)}</p>` : ''}
    <div class="form-grid">
      ${F.field('短期目標（過程中的子目標，選填）', F.text(p + '.short', { rows:2, ph:'例：2 週內，能抓床邊扶手自己坐起並站到床邊' }), { cls:'span2' })}
      ${F.field('指導對象（可複選，應含主要照顧者）', `<div class="pills wrap">${WHO.map(w => F.checkArr(p + '.who', w, w)).join('')}</div>${(g.who || []).includes('其他') ? F.input(p + '.whoOther', { ph:'其他：請說明' }) : ''}`)}
      ${F.field('服務介入前執行情形（自評 1–10）', F.select(p + '.pre', scoreOpts(), { t:'num' }), { hint:'由個案或家屬自評，結案時再評一次' })}
    </div></section>`;
}
function goalPreview(g){
  const t = composeGoal(g), is = goalIssues(g);
  return `<div class="gp-t">${t ? esc(t) : '<span class="muted">填完上面的欄位，這裡會組成一句完整的目標</span>'}</div>${is.length ? `<ul class="gp-is">${is.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<div class="gp-ok">✓ 五大要素齊全</div>'}`;
}
function addGoal(){ if ((S.edit.goals || []).length >= 5) return; S.edit.goals.push(newGoal()); Store.upsert('episodes', S.edit); rerender(() => pageCase(S.edit.clientId, 'goals', S.edit.id)); setTimeout(() => document.querySelectorAll('.goal-c').forEach((el, i, a) => i === a.length - 1 && el.scrollIntoView({ behavior:'smooth', block:'start' })), 50); }
function delGoal(i){ if (!askConfirm('刪除這項目標？')) return; S.edit.goals.splice(i, 1); Store.upsert('episodes', S.edit); rerender(() => pageCase(S.edit.clientId, 'goals', S.edit.id)); }
function moveGoal(i, d){ const g = S.edit.goals; [g[i], g[i + d]] = [g[i + d], g[i]]; Store.upsert('episodes', S.edit); rerender(() => pageCase(S.edit.clientId, 'goals', S.edit.id)); }

/* ---------- 3. 訪視紀錄（列表） ---------- */
function tVisits(c, ep, st){
  const vs = epVisits(ep), goals = st.goals;
  return `<section class="card"><h2>訪視紀錄 <small>每次服務都要填，照管系統五個欄位可一鍵複製</small></h2>
    ${vs.length ? `<table class="tbl"><thead><tr><th>次別</th><th>日期／時間</th><th>達成情形</th><th>本次重點</th><th></th></tr></thead><tbody>${vs.map((v, i) => `<tr><td class="nowrap"><b>第 ${i + 1} 次</b><br><small class="muted">${visitLabel(i + 1)}</small></td><td class="nowrap">${rocDate(v.date)}<br><small class="muted">${esc(v.start || '')}–${esc(v.end || '')}</small></td>
      <td>${goals.map((g, gi) => v.status?.[g.id] ? `<span class="ach ${achK(v.status[g.id])}">${gi + 1} ${esc(v.status[g.id])}</span>` : '').join(' ') || '<span class="muted">—</span>'}</td><td><small>${esc((v.content?.next || v.advice?.act || '').slice(0, 60))}</small></td><td><a class="btn sm" href="#/visit/${v.id}">開啟</a></td></tr>`).join('')}</tbody></table>` : empty('還沒有訪視紀錄。第一次訪視（初評）也要寫一筆。')}
    ${ep.status !== '已結案' ? `<div class="btn-row"><a class="btn primary" href="#/visit/new/${ep.id}">${icon('plus', 16)}<span>寫第 ${vs.length + 1} 次紀錄（${visitLabel(vs.length + 1)}）</span></a></div>` : ''}</section>
    ${goals.length && vs.length ? `<section class="card"><h2>目標進展</h2><div class="tbl-wrap"><table class="tbl qa"><thead><tr><th>目標</th>${vs.map((v, i) => `<th class="c">${i + 1}</th>`).join('')}</tr></thead><tbody>${goals.map((g, gi) => `<tr><td><b>${gi + 1}. ${esc(g.cat)}</b><br><small>${esc(g.activity)}</small></td>${vs.map(v => `<td class="c"><span class="ach ${achK(v.status?.[g.id])}">${esc((v.status?.[g.id] || '—').replace('部分', '部分'))}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : ''}`;
}
const achK = s => !s ? '' : s === ACHIEVE()[0] ? 'ok' : s === ACHIEVE().at(-1) ? 'no' : 'mid';

/* ---------- 訪視紀錄（編輯） ---------- */
function pageVisitEdit(id, epId){
  let v = id ? Store.get('visits', id) : null;
  const ep = Store.get('episodes', v ? v.episodeId : epId); if (!ep) { App.go('#/'); return ''; }
  const c = Store.get('clients', ep.clientId), vs = epVisits(ep);
  const idx = v ? vs.findIndex(x => x.id === v.id) : vs.length, n = idx + 1, prev = vs[idx - 1];
  if (!v) {
    const now = new Date(), hh = d => String(d.getHours()).padStart(2, '0') + ':' + String(Math.floor(d.getMinutes() / 10) * 10).padStart(2, '0');
    v = { episodeId:ep.id, clientId:ep.clientId, date:todayISO(), start:hh(now), end:hh(new Date(now.getTime() + 60 * 6e4)), who:prev?.who ? [...prev.who] : [...new Set((ep.goals || []).flatMap(g => g.who || []))].slice(0, 3), whoOther:prev?.whoOther || '', carerName:prev?.carerName || ep.carer?.name || '', status:{}, gnote:{}, content:{}, advice:{} };
    if (!v.who.length) v.who = ['個案', '個案家屬'];
    if (n === 1) v.content = { follow:'初次訪視', scene:'', next:'' };
    if (ep.guide?.length) v.advice.homework = guideText(ep);
  }
  S.edit = clone(v); S.ep = ep;
  S.onEdit = (p) => {
    if (!S.edit.id) { const r = Store.upsert('visits', S.edit); S.edit = r; history.replaceState(null, '', '#/visit/' + r.id); S.lastHash = '#/visit/' + r.id; }
    else Store.upsert('visits', S.edit);
    S.dirty = false; flashSaved(); sysRefresh();
    if (/^who/.test(p)) { const o = $('#who-other'); if (o) o.hidden = !(S.edit.who || []).includes('其他'); }
  };
  setTitle(`${c.name}｜第 ${n} 次訪視`, visitLabel(n) + `（核定 ${epApproved(ep)} 次）`);
  const goals = (ep.goals || []).filter(g => g.activity), rets = returnsFor(ep, prev?.date, id ? v.date : null);
  const follow = [prev?.content?.next ? '上次建議：' + prev.content.next : '', rets.text].filter(Boolean);
  return `<div class="toolbar"><a class="btn" href="#/case/${c.id}/visits">${icon('back', 16)}${esc(c.name)}</a><span class="sp"></span>${savedTag()}${exportBar('visit1', () => visitDoc(S.ep, Store.get('visits', S.edit.id) || S.edit, n), ['pdf', 'word'])}</div>
  <div class="visit-layout"><div class="visit-main">
  <section class="card"><h2>第 ${n} 次｜${visitLabel(n)}</h2>${voiceTipHTML()}${n === 1 ? `<p class="notice">${icon('alert', 16)} 第一次訪視：完成評估，並與個案及照顧者確認<b>服務內容、訓練目標與結案條件</b>（操作指引要求第一次訪視時說明）。</p>` : ''}
    <div class="form-grid">${F.field('服務日期', F.date('date'))}${F.field('起訖時間', `<div class="row2">${F.input('start', { type:'time' })}<span>–</span>${F.input('end', { type:'time' })}</div>`, { hint:'每次服務約 50–60 分鐘' })}
    ${F.field('指導對象（可複選）', `<div class="pills wrap">${WHO.map(w => F.checkArr('who', w, w)).join('')}</div><div id="who-other" ${(v.who || []).includes('其他') ? '' : 'hidden'}>${F.input('whoOther', { ph:'其他：請說明' })}</div>`, { cls:'span2' })}
    ${F.field('接受指導的照顧者姓名', F.input('carerName', { ph:'固定同一人（組）' }), { hint:prev && prev.carerName && v.carerName && prev.carerName !== v.carerName ? '⚠ 與上次不同，學習之照顧者應固定' : '' })}</div></section>
  <section class="card"><h2>各目標達成情形 <small>照管系統「復能目標達成情形」</small></h2>
    ${goals.length ? goals.map((g, i) => `<div class="vg"><div class="vg-h"><b>目標 ${i + 1}｜${esc(g.cat)}</b><small>${esc(g.text || composeGoal(g))}</small></div>
      ${F.radios(`status.${g.id}`, ACHIEVE(), { cls:'ach-pills' })}${F.input(`gnote.${g.id}`, { ph:'本次表現（具體／量化），例：扶扶手可自行站起 5 次，第 4 次起需口頭提示' })}</div>`).join('') : `<p>${badge('尚未設定訓練目標', 'amber')} 第一次訪視可先寫評估與說明；目標請在第一組結束前完成。<a href="#/case/${c.id}/goals">去設定目標 →</a></p>`}</section>
  <section class="card"><h2>服務內容 <small>照管系統「服務內容」</small></h2>
    ${CONTENT_PARTS.map(([k, l, ch]) => F.field(l, F.text('content.' + k, { rows:2 }) + chips('content.' + k, k === 'follow' ? [...follow, ...ch] : ch))).join('')}</section>
  <section class="card"><h2>指導建議摘要 <small>照管系統「指導建議摘要」</small></h2>
    ${ADVICE_PARTS.map(([k, l, ch]) => F.field(l, F.text('advice.' + k, { rows:k === 'homework' ? 3 : 2 }) + chips('advice.' + k, ch) + (k === 'homework' ? `<div class="btn-row">${ep.guide?.length ? btn('帶入居家指導項目', 'fillHomework()', { k:'sm' }) : ''}<a class="btn sm" href="#/case/${c.id}/guide">編輯居家指導（附圖）</a></div>` : ''))).join('')}</section>
  <div class="btn-row end">${S.edit.id ? btn('刪除這次紀錄', `delVisit('${S.edit.id}')`, { k:'danger ghost' }) : ''}<a class="btn primary" href="#/case/${c.id}/visits">完成</a></div>
  </div><button type="button" class="btn primary sys-jump" onclick="document.querySelector('.visit-side').scrollIntoView({behavior:'smooth'})">${icon('clip', 16)}<span>貼到照管系統</span></button><aside class="visit-side"><section class="card sys"><h2>貼到照管系統</h2><div id="sysf">${sysHTML()}</div></section></aside></div>`;
}
function sysHTML(){
  return systemFields(S.ep, S.edit).map(([k, t, hint]) => `<div class="sysf"><div class="sysf-h"><b>${k}</b>${t ? copyBtn(t, k) : ''}</div>${hint ? `<small class="muted">${esc(hint)}</small>` : t ? `<pre class="sysbox">${esc(t)}</pre><small class="muted">${t.length} 字</small>` : '<small class="muted">（尚未填寫）</small>'}</div>`).join('');
}
function sysRefresh(){ const el = $('#sysf'); if (el) el.innerHTML = sysHTML(); }
function delVisit(id){ if (!askConfirm('刪除這次訪視紀錄？')) return; const v = Store.get('visits', id); Store.remove('visits', id); S.dirty = false; App.go(`#/case/${v.clientId}/visits`); }
/* 服務內容的「個案表現」：各目標本次表現自動併入 */
const _textOf = textOf;
function visitContent(ep, v){
  const goals = (ep.goals || []).filter(g => g.activity), gl = goals.map((g, i) => v.gnote?.[g.id]?.trim() ? `目標${i + 1}（${g.cat}）${v.status?.[g.id] ? v.status[g.id] + '，' : ''}${v.gnote[g.id].trim()}` : '').filter(Boolean);
  const c = { ...(v.content || {}) }; if (gl.length) c.perf = [gl.join('；'), c.perf].filter(Boolean).join('；');
  return _textOf(c, CONTENT_PARTS);
}
function fillHomework(){ S.edit.advice = { ...(S.edit.advice || {}), homework:guideText(S.ep) }; const el = document.querySelector('[data-bind="advice.homework"]'); if (el) el.value = S.edit.advice.homework; S.onEdit('advice.homework'); }
function guideText(ep){ return (ep.guide || []).map((x, i) => `${i + 1}.${x.name}：${[x.dose, x.freq].filter(Boolean).join('，')}`).join('\n'); }
/* 案家回填（上次訪視之後） */
function returnsFor(ep, since, until){
  const rs = Store.all('returns').filter(r => r.episodeId === ep.id), recs = rs.flatMap(r => r.recs.map(x => ({ ...x, who:r.signer })));
  const sel = recs.filter(x => (!since || x.date > since) && (!until || x.date <= until)); if (!sel.length) return { recs:[], text:'' };
  const days = new Set(sel.map(x => x.date)).size, by = {};
  for (const x of sel) by[x.itemId] = (by[x.itemId] || 0) + (+x.times || 0);
  const names = Object.entries(by).map(([id, t]) => `${(ep.guide || []).find(g => g.id === id)?.name || '練習'} ${t} 次`).join('、');
  const d = sel.map(x => x.date).sort();
  return { recs:sel, text:`案家回報 ${rocDate(d[0]).slice(-5)}～${rocDate(d.at(-1)).slice(-5)} 共 ${days} 天有練習（${names}）` };
}

/* ---------- 4. 居家指導 ---------- */
function tGuide(c, ep){
  const goals = (ep.goals || []).filter(g => g.activity), sug = [...new Set(goals.flatMap(g => CAT[g.cat]?.lib || []))].filter(id => findItem(id) && !(ep.guide || []).some(x => x.exId === id));
  const rets = Store.all('returns').filter(r => r.episodeId === ep.id).sort(byDate('receivedAt'));
  return `<section class="card notice-card"><b>居家指導紀錄</b>　每次服務都要交付書面指導給個案與主要照顧者，可用 LINE、照片或影片連結，方便反覆查看。案家在手機上回填<b>日期、次數、簽名</b>，傳回後就是「居家指導紀錄表」的執行紀錄。訓練以日常活動為主，居家運動是輔助。</section>
  <section class="card"><h2>交付練習內容 <small>${(ep.guide || []).length} 項</small></h2>
    ${(ep.guide || []).map((x, i) => `<div class="gd"><div class="gd-img">${itemImg(x) ? `<img src="${esc(itemImg(x))}" alt="" loading="lazy">` : `<span class="noimg-l">${icon('heart', 24)}</span>`}</div><div class="gd-b">
      <div class="gd-h"><b>${i + 1}. ${esc(x.name)}</b><span class="sp"></span>${btn('移除', `delGuide(${i})`, { k:'sm ghost danger' })}</div>
      <div class="form-grid">${F.field('對應目標', F.select(`guide.${i}.goalId`, goals.map((g, gi) => [g.id, `目標 ${gi + 1}｜${g.cat}`])))}${F.field('次數／時間', F.input(`guide.${i}.dose`, { ph:'例：10 下 × 2 組' }))}${F.field('頻率', F.input(`guide.${i}.freq`, { ph:'例：每天早晚各一次' }))}
      ${F.field('說明（給案家看）', F.text(`guide.${i}.how`, { rows:2 }), { cls:'span2' })}${F.field('注意事項', F.text(`guide.${i}.caution`, { rows:2 }), { cls:'span2' })}</div></div></div>`).join('') || empty('還沒有指導項目。可以從下方建議或項目庫加入，也可以自訂一項（例如「白天每 2 小時走去廁所一次」）。')}
    ${sug.length ? `<div class="field"><label class="lbl">依目標建議</label><div class="sug-row">${sug.slice(0, 10).map(id => { const e = findItem(id); return `<button type="button" class="sug" onclick="addGuide('${id}')"><img src="${esc(e.img)}" alt="" loading="lazy"><span>+ ${esc(e.name)}</span></button>`; }).join('')}</div></div>` : ''}
    <div class="btn-row">${btn('從項目庫挑選', 'openGuidePicker()', { i:'clip' })}${btn('自訂一項', 'addGuide()', { i:'plus' })}</div></section>
  <section class="card"><h2>給案家的話 <small>顯示在指導單最上方</small></h2>${F.text('guideMsg', { rows:2, ph:'例：阿伯這週表現很好！請媳婦白天每 2 小時提醒阿伯自己走去廁所，旁邊看著就好，不用扶。' })}
    <div class="btn-row">${btn('用 LINE 傳給案家', `shareGuide('${ep.id}')`, { k:'primary', i:'upload' })}${exportBar('guideDoc', () => guideDoc(Store.get('episodes', ep.id)), ['pdf', 'word'])}</div>
    <p class="hint">${ep.sharedAt ? `上次傳送：${rocDate(ep.sharedAt.slice(0, 10))}。修改內容後請重新傳一次。` : '尚未傳送。'}</p></section>
  <section class="card"><h2>案家回填的執行紀錄 <small>${rets.length} 次傳回</small></h2>${rets.length ? retTable(ep, rets) : empty('案家按「傳回給治療師」後，點對方傳來的連結就會匯入這裡。')}</section>`;
}
function retTable(ep, rets){
  const by = {}; for (const r of rets) for (const x of r.recs) { const d = (by[x.date] = by[x.date] || { it:[], s:new Set() }); d.it.push(`${(ep.guide || []).find(g => g.id === x.itemId)?.name || '（已移除的項目）'} ${x.times} 次`); if (r.signer) d.s.add(r.signer); }
  return `<table class="tbl"><thead><tr><th>日期</th><th>練習內容與次數</th><th>簽名</th></tr></thead><tbody>${Object.keys(by).sort().reverse().map(d => `<tr><td class="nowrap">${rocDate(d)}（${WEEKDAYS[weekday(d)]}）</td><td>${esc(by[d].it.join('、'))}</td><td>${esc([...by[d].s].join('、'))}</td></tr>`).join('')}</tbody></table>`;
}
function mkGuide(exId){ const e = exId ? findItem(exId) : null; const g = (S.edit.goals || []).find(x => x.activity && (CAT[x.cat]?.lib || []).includes(exId)); return { id:Store.newId(), exId:exId || '', name:e?.name || '自訂練習', dose:e?.dose || '', freq:'每天', how:e?.how || '', steps:e?.steps || '', caution:e?.caution || '', img:e?.img || '', goalId:g?.id || '' }; }
function addGuide(exId){
  let x = mkGuide(exId);
  if (!exId) { const nm = prompt('自訂練習名稱（例：白天每 2 小時走去廁所一次）'); if (!nm?.trim()) return; x.name = nm.trim(); }
  (S.edit.guide = S.edit.guide || []).push(x); Store.upsert('episodes', S.edit); if (!$('#gpick')) rerender(() => pageCase(S.edit.clientId, 'guide', S.edit.id)); toast('已加入：' + x.name);
}
function delGuide(i){ S.edit.guide.splice(i, 1); Store.upsert('episodes', S.edit); rerender(() => pageCase(S.edit.clientId, 'guide', S.edit.id)); }
let gpk = { q:'', cat:'' };
function openGuidePicker(){ openModal('從項目庫挑選', `<div id="gpick">${gpickBody()}</div>`, { wide:true, saveLabel:'完成', onSave:() => rerender(() => pageCase(S.edit.clientId, 'guide', S.edit.id)), restore:() => rerender(() => pageCase(S.edit.clientId, 'guide', S.edit.id)) }); }
function gpickBody(){
  const have = new Set((S.edit.guide || []).map(x => x.exId));
  const list = allItems().filter(e => (!gpk.cat || e.cat === gpk.cat) && (!gpk.q || (e.name + e.how).includes(gpk.q)));
  return `<div class="toolbar"><input class="inp" placeholder="搜尋" aria-label="搜尋" value="${esc(gpk.q)}" oninput="gpk.q=this.value;clearTimeout(window._gq);window._gq=setTimeout(()=>{const el=$('#gpick');el.innerHTML=gpickBody();const i=el.querySelector('input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"></div>
    <div class="pills cats">${['', ...ITEM_CATS].map(cat => `<label class="pill sm"><input type="radio" name="gpc" ${gpk.cat === cat ? 'checked' : ''} onchange="gpk.cat='${cat}';$('#gpick').innerHTML=gpickBody()"><span>${cat || '全部'}</span></label>`).join('')}</div>
    <div class="pgrid">${list.map(e => `<button type="button" class="pcard ${have.has(e.id) ? 'pc-on' : ''}" onclick="${have.has(e.id) ? '' : `addGuide('${e.id}');$('#gpick').innerHTML=gpickBody()`}">${e.img ? `<img src="${esc(e.img)}" alt="" loading="lazy">` : ''}${wcBadge(e)}<b>${esc(e.name)}</b><small>${have.has(e.id) ? '✓ 已加入' : esc(e.cat)}</small></button>`).join('')}</div>`;
}

/* ---------- 5. 結案／延案 ---------- */
function tClose(c, ep, st){
  const goals = st.goals, cl = ep.closing || {}, closed = ep.status === '已結案', half = Math.max(1, Math.floor((+ep.groups || 1) / 2));
  S.live = p => { if (/^closing\.(reason|reported)|^extend\.(applied)/.test(p)) rerender(() => pageCase(c.id, 'close', S.edit.id)); };
  const outcome = closingText(ep);
  return `${closed ? `<section class="card ok-card"><h2>已於 ${rocDate(cl.date)} 結案</h2><ul class="todo">
      <li><span class="tt">結案報告與照管系統登錄期限：<b>${rocDate(st.due)}</b>（結案後 ${RULE.reportDays} 個工作天，未扣國定假日）</span>${F.check('closing.reported', '已完成')}</li>
      <li><span class="tt">同碼別重啟新目標：<b>${rocDate(st.restart)}</b> 之後（間隔 ${RULE.restartDays} 天）。結案後建議 1–2 個月追蹤一次，確認效果是否維持。</span>${todayISO() >= st.restart ? btn('開新的服務期程', `restartEp('${c.id}')`, { k:'sm primary' }) : ''}</li></ul></section>` : ''}
  <section class="card"><h2>目標達成與前後分數 <small>服務介入後分數由個案或家屬自評，於整組服務完成後填寫</small></h2>
    ${goals.length ? `<table class="tbl qa"><thead><tr><th>目標</th><th>介入前</th><th>介入後</th><th>最後達成情形</th></tr></thead><tbody>${goals.map((g, i) => { const gi = ep.goals.indexOf(g); return `<tr><td><b>${i + 1}. ${esc(g.cat)}</b><br><small>${esc(g.text || composeGoal(g))}</small></td><td class="c"><b>${esc(g.pre || '—')}</b></td><td>${F.select(`goals.${gi}.post`, scoreOpts(), { t:'num' })}</td><td>${F.select(`goals.${gi}.final`, ACHIEVE(), {})}<small class="muted">${st.last?.status?.[g.id] ? '最近一次：' + esc(st.last.status[g.id]) : ''}</small></td></tr>`; }).join('')}</tbody></table>` : empty('尚未設定訓練目標')}</section>
  <section class="card"><h2>服務成果</h2><div class="form-grid">
    ${F.field('個案於服務期滿之活動表現情形', F.text('closing.outcome', { rows:4, ph:'針對每項目標描述目前執行現狀，並可建議未來執行活動的方式' }) + `<div class="btn-row">${btn('依目標與紀錄產生草稿', 'draftOutcome()', { k:'sm' })}</div>`, { cls:'span2' })}
    ${F.field('介入內容與期間的執行、配合狀況', F.text('closing.process', { rows:3 }) + chips('closing.process', ['照顧者全程參與並能回覆示教', '案家每週回報居家練習', '照顧者配合度佳', '個案動機佳', '期間曾因身體不適暫停練習']), { cls:'span2' })}
    ${F.field('個案滿意度（1–10）', F.select('closing.sat', scoreOpts(), { t:'num' }))}${F.field('照顧負荷', F.radios('closing.burden', ['減輕', '持平', '加重']))}</div></section>
  <section class="card"><h2>${closed ? '結案資料' : '結案'}</h2><div class="form-grid">
    ${F.field('結案日期', F.date('closing.date'))}${F.field('結案原因', F.radios('closing.reason', CLOSE_REASONS))}
    ${(cl.reason || '') === '其他' ? F.field('其他原因說明', F.input('closing.other'), { cls:'span2' }) : ''}
    ${F.field('原因分析', F.text('closing.analysis', { rows:2 }) + chips('closing.analysis', ['個案已能在監督下完成自選活動', '照顧者已習得協助技巧，可提供最少協助', '同一目標經一組服務後仍未有明顯進步', '個案與照顧者無法配合指導訓練', '個案住院，狀況改變', '個案已無意願']), { cls:'span2' })}
    ${F.field('結案建議', F.text('closing.suggest', { rows:2 }) + chips('closing.suggest', ['持續依居家指導單每日練習', '將練習融入每日作息', '轉介輔具評估', '轉介居家無障礙環境評估（CC01）', '轉介營養照護（CB01）', '建議使用日間照顧或社區據點', '建議持續門診復健']), { cls:'span2' })}</div>
    <div class="sysf"><div class="sysf-h"><b>照管系統「專業服務目標管理」：結束服務原因及服務介入後表現</b>${copyBtn(outcome, '結案說明')}</div><pre class="sysbox">${esc(outcome)}</pre></div>
    <div class="btn-row">${closed ? btn('取消結案（改回服務中）', 'reopenEp()', { k:'ghost' }) : btn('確認結案', 'closeEp()', { k:'primary', i:'check' })}${exportBar('closeDoc', () => closeDoc(Store.get('episodes', ep.id)), ['pdf', 'word'])}</div></section>
  ${closed ? '' : `<section class="card"><h2>延案申請 <small>需在剩 ${RULE.extendBefore} 次前提出，由照管中心核定</small></h2>
    <p>目前已訪 ${st.n}／${st.cap} 次，剩 <b>${st.left}</b> 次。延案最多原核定組數的 1/2（${ep.groups} 組 → 最多 ${half} 組）。</p>
    <div class="form-grid">${F.field('申請條件（須同時符合）', `<div class="pills wrap">${F.check('extend.c1', '服務過程有進步（含照顧者），但預期未能在原計畫內達成')}${F.check('extend.c2', '申請時仍在出院後 6 個月內')}</div>`, { cls:'span2' })}
    ${F.field('延長週數', F.num('extend.weeks', { min:1 }))}${F.field('延長次數', F.num('extend.times', { min:1, max:half * RULE.perGroup }), { hint:`最多 ${half * RULE.perGroup} 次` })}
    ${F.field('原因', F.text('extend.reason', { rows:2 }), { cls:'span2' })}${F.field('預期效益', F.text('extend.benefit', { rows:2 }), { cls:'span2' })}
    ${F.field('', F.check('extend.applied', '已向照專／A 個管提出') + (ep.extend?.applied ? F.date('extend.date') : ''), { cls:'span2' })}</div>
    ${ep.extend?.applied ? `<div class="btn-row">${btn('照管中心已核定：增加組數', 'approveExt()', { k:'primary' })}</div>` : ''}
    <p class="hint">不打算延案的話可以按：${btn('不延案，不再提醒', "S.edit.extendChecked=true;Store.upsert('episodes',S.edit);route()", { k:'sm ghost' })}</p></section>`}`;
}
function closingText(ep){
  const cl = ep.closing || {}, goals = (ep.goals || []).filter(g => g.activity);
  const r = cl.reason === '其他' ? (cl.other || '其他') : cl.reason || '';
  return [r ? `結案原因：${r}${cl.analysis ? '（' + cl.analysis + '）' : ''}` : '', goals.length ? '目標達成：' + goals.map((g, i) => `目標${i + 1}${g.final || ''}${g.pre ? `（自評 ${g.pre}→${g.post || '?'} 分）` : ''}`).join('、') : '', cl.outcome ? '服務介入後表現：' + cl.outcome : '', cl.suggest ? '建議：' + cl.suggest : ''].filter(Boolean).join('\n');
}
function draftOutcome(){
  const ep = S.edit, vs = epVisits(ep), last = vs.at(-1);
  const t = (ep.goals || []).filter(g => g.activity).map((g, i) => `目標${i + 1}（${g.cat}）：${last?.gnote?.[g.id] || '（請描述目前執行現狀）'}${g.final || last?.status?.[g.id] ? '，' + (g.final || last.status[g.id]) : ''}。`).join('\n');
  S.edit.closing = { ...(S.edit.closing || {}), outcome:t }; Store.upsert('episodes', S.edit); rerender(() => pageCase(ep.clientId, 'close', ep.id)); toast('已產生草稿，請再修改成實際狀況');
}
function closeEp(){
  const e = S.edit, cl = e.closing || {};
  if (!cl.reason) return toast('請選擇結案原因', 'err');
  if ((e.goals || []).some(g => g.activity && !g.post) && !askConfirm('還有目標沒有填「介入後分數」，仍要結案嗎？')) return;
  e.closing = { ...cl, date:cl.date || todayISO() }; e.status = '已結案'; Store.upsert('episodes', e); toast('已結案，請在 7 個工作天內完成結案報告'); route();
}
function reopenEp(){ if (!askConfirm('改回服務中？')) return; S.edit.status = '服務中'; Store.upsert('episodes', S.edit); route(); }
function approveExt(){ const n = +prompt('照管中心核定增加幾組？', '1'); if (!n || n < 1) return; S.edit.groups = (+S.edit.groups || 1) + n; S.edit.extend = { ...S.edit.extend, approved:n, approvedAt:todayISO() }; Store.upsert('episodes', S.edit); toast(`已增加 ${n} 組`); route(); }
function restartEp(cid){ const ep = Store.upsert('episodes', newEpisode(cid)); App.go(`#/case/${cid}/assess?ep=${ep.id}`); }

/* ---------- 6. 表單 ---------- */
function tForms(c, ep){
  const vs = epVisits(ep);
  const row = (t, d, key, fn, kinds = ['pdf', 'word']) => `<div class="exp-row"><span><b>${t}</b><small>${d}</small></span>${exportBar(key, fn, kinds)}</div>`;
  return `<section class="card"><h2>表單輸出 <small>依衛福部操作指引附錄一與紀錄表-1（114/9/1 修訂）的格式</small></h2>
    ${row('專業服務紀錄表-1', '照會資料、12 次服務簽名欄、3–5 項訓練目標與前後分數、服務成果', 'f-rec1', () => rec1Doc(Store.get('episodes', ep.id)))}
    ${row('評估表暨服務計畫', '初評內容、主要問題、目標與服務計畫', 'f-assess', () => assessPlanDoc(Store.get('episodes', ep.id)))}
    ${row('居家指導紀錄表', '交付練習內容（附圖）與案家執行紀錄', 'f-guide', () => guideDoc(Store.get('episodes', ep.id)))}
    ${row('結案報告', '期程、前後表現、介入內容、結案原因與建議', 'f-close', () => closeDoc(Store.get('episodes', ep.id)))}
    ${row('服務合約書', '執行原則、收費、暫停與結案條件、申訴管道', 'f-contract', () => contractDoc(Store.get('episodes', ep.id)))}</section>
  <section class="card"><h2>每次服務紀錄表</h2>${vs.length ? vs.map((v, i) => row(`第 ${i + 1} 次`, rocDate(v.date) + '　' + visitLabel(i + 1), 'f-v' + i, () => visitDoc(Store.get('episodes', ep.id), Store.get('visits', v.id), i + 1))).join('') : empty('還沒有訪視紀錄')}</section>
  <section class="card"><h2>空白表單 <small>到宅手寫用</small></h2>${row('專業服務紀錄表-1（空白）', '', 'b-rec1', () => rec1Doc(null))}${row('服務紀錄表（空白）', '', 'b-visit', () => visitDoc(null, null, ''))}${row('居家指導紀錄表（空白）', '', 'b-guide', () => guideDoc(null))}</section>`;
}

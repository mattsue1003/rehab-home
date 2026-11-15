/* ================================================================
   App：外框、路由、首頁、設定
   ================================================================ */
const APP_TITLE = '居家復能計畫與練習紀錄';
/* 標誌：拄著拐杖向前走的長輩＋向上箭頭（找回能力、往前一步） */
const LOGO_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9.5" cy="4.2" r="2.1"/><path d="M9.2 7.4L8.3 13"/><path d="M8.3 13l-1.7 4-1.2 4"/><path d="M8.3 13l2.4 3.4.5 4.6"/><path d="M9 8.9l3.2 2.6"/><path d="M12.2 11.2l.9 9.8"/><path d="M15.5 17.5l5-7"/><path d="M17.6 10.3h2.9v2.9"/></svg>`;
/* 依身分顯示不同的選單：治療師管理多位個案；居服員、家屬以「今天要練什麼」為主 */
const navItems = () => {
  const r = homeRole();
  if (r === '家屬') return [['#/', 'check', '今天的練習'], ['#/clients', 'users', '長輩資料'], ['#/library', 'clip', '練習項目庫'], ['#/settings', 'gear', '設定與備份']];
  if (r === '居家服務員') return [['#/', 'check', '今日陪練'], ['#/clients', 'users', '服務對象'], ['#/library', 'clip', '練習項目庫'], ['#/settings', 'gear', '設定與備份']];
  return [['#/', 'home', '首頁'], ['#/clients', 'users', '個案名冊'], ['#/today', 'check', '今日練習'], ['#/library', 'clip', '練習項目庫'], ['#/settings', 'gear', '設定與備份']];
};
const App = {
  currentUserId(){ try { return localStorage.getItem('rehabh:who') || ''; } catch(e){ return ''; } },
  setWho(v){ try { localStorage.setItem('rehabh:who', v.trim()); } catch(e){} toast('記錄者：' + (v.trim() || '（未填）')); },
  go(h){ location.hash = h; },
  toast,
};
function renderShell(){
  $('#side').innerHTML = `
    <div class="brand"><div class="logo">${LOGO_SVG}</div><div class="b-txt"><div class="b1">${APP_TITLE}</div><div class="b2">${esc([Store.DB.meta.orgName, Store.DB.meta.homeRole ? homeRole() + '模式' : ''].filter(Boolean).join('｜'))}${Store.DB.meta.homeRole ? ' <a href="#/settings" class="b2-link">更換</a>' : ''}</div></div></div>
    <nav>${navItems().map(([h, i, l]) => `<a href="${h}">${icon(i)}<span>${l}</span></a>`).join('')}<a href="javascript:void(0)" class="m-report" onclick="document.body.classList.remove('nav-open');window.openReport&&openReport()">${icon('flag')}<span>回報錯誤／建議</span></a></nav>
    <div class="side-foot">${folderStatusHTML()}</div>`;
  $('#top').innerHTML = `<button class="icon-btn only-m" onclick="document.body.classList.toggle('nav-open')" aria-label="選單">${icon('menu')}</button>
    <div class="top-title" id="top-title"></div><span class="sp"></span>
    <label class="who"><span class="who-l">記錄者</span><input class="inp sm" value="${esc(App.currentUserId())}" placeholder="記錄者姓名" aria-label="記錄者姓名" onchange="App.setWho(this.value)"></label>`;
  // 手機：底部分頁列＋側欄遮罩
  let bn = $('#bnav'); if (!bn) { bn = document.createElement('nav'); bn.id = 'bnav'; bn.setAttribute('aria-label', '主要功能'); document.body.appendChild(bn); }
  bn.innerHTML = navItems().filter(x => x[0] !== '#/settings').slice(0, 4).map(([h, i, l]) => `<a href="${h}">${icon(i, 22)}<span>${l.replace('練習項目庫', '項目庫').replace('今天的練習', '今天練習')}</span></a>`).join('')
    + `<button type="button" onclick="document.body.classList.toggle('nav-open')">${icon('menu', 22)}<span>更多</span></button>`;
  if (!$('#scrim')) { const s = document.createElement('div'); s.id = 'scrim'; s.onclick = () => document.body.classList.remove('nav-open'); document.body.appendChild(s); }
}
function setTitle(t, sub = ''){ $('#top-title').innerHTML = `<b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`; document.title = t + '｜' + APP_TITLE; }
function navActive(){
  let cur = location.hash || '#/'; try { cur = decodeURIComponent(cur); } catch(e){}
  if (/^#\/(client|assess|plan)\b/.test(cur)) cur = '#/clients';
  document.querySelectorAll('#side nav a, #bnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === cur));
  document.body.classList.remove('nav-open');
}
const ROUTES = [
  [/^#?\/?$/, () => pageHome()],
  [/^#\/clients$/, () => pageClients()],
  [/^#\/client\/([^/?]+)(?:\/(\w+))?$/, m => pageClient(m[1], m[2] || 'assess')],
  [/^#\/assess\/new\/([^/?]+)(?:\?(.*))?$/, m => pageAssessEdit(null, m[1], new URLSearchParams(m[2] || '').get('type'))],
  [/^#\/assess\/([^/?]+)$/, m => pageAssessEdit(m[1])],
  [/^#\/plan\/new\/([^/?]+)(?:\?(.*))?$/, m => pagePlanEdit(null, m[1], new URLSearchParams(m[2] || ''))],
  [/^#\/plan\/([^/?]+)$/, m => pagePlanEdit(m[1])],
  [/^#\/today$/, () => pageToday()],
  [/^#\/library$/, () => pageLibrary()],
  [/^#\/settings$/, () => pageSettings()],
  [/^#\/share\/(.+)$/, m => { pageShare(m[1]); return null; }],
  [/^#\/import\/(.+)$/, m => { importReturn(m[1]); return null; }],
];
let ignoreHash = false;
function route(){
  let h = location.hash || '#/'; try { h = decodeURIComponent(h); } catch(e){}
  document.body.classList.toggle('share-mode', /^#\/share\//.test(h));
  for (const [re, fn] of ROUTES) { const m = h.match(re); if (m) { S.edit = null; S.onEdit = null; S.dirty = false; const html = fn(m); if (html != null) $('#main').innerHTML = html; window.scrollTo(0, 0); S.lastHash = h; navActive(); return; } }
  location.hash = '#/';
}
window.addEventListener('hashchange', () => {
  if (ignoreHash) { ignoreHash = false; return; }
  if (S.dirty && !askConfirm('目前編輯的內容尚未儲存，確定要離開嗎？')) { ignoreHash = true; location.hash = S.lastHash; return; }
  route();
});
window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
/* 手機版：表格改為卡片（每格加上欄名），流程列捲到目前步驟 */
function mobilize(root = document.getElementById('main')){
  if (!root) return;
  root.querySelectorAll('table.tbl:not(.qa)').forEach(t => {
    const hs = [...t.querySelectorAll('thead th')].map(th => th.innerText.replace(/\s+/g, ' ').trim());
    if (!hs.length) return; t.classList.add('stk');
    t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
      if (td.hasAttribute('data-label')) return;
      td.setAttribute('data-label', td.colSpan > 1 ? '' : hs[i] || '');
      // 長內容、按鈕、輸入框佔整行；短數值兩欄並排
      if (td.colSpan > 1 || td.querySelector('.btn,.exp,input:not([type=radio]):not([type=checkbox]),select,textarea,.mini-bar') || td.innerText.trim().length + (hs[i] || '').length > 13) td.classList.add('w');
    }));
  });
  root.querySelectorAll('.flow-steps').forEach(f => { const c = f.querySelector('.fs.cur'); if (c && f.scrollWidth > f.clientWidth) f.scrollLeft = Math.max(0, c.offsetLeft - f.offsetLeft - 40); });
}
if (typeof MutationObserver !== 'undefined' && document.getElementById) new MutationObserver(() => { clearTimeout(mobilize._t); mobilize._t = setTimeout(() => mobilize(), 30); }).observe(document.getElementById('main') || document.body, { childList:true, subtree:true });
function rerender(fn){ const y = window.scrollY; $('#main').innerHTML = fn(); window.scrollTo(0, y); }

/* ---------------- 首頁 ---------------- */
function pageHome(){
  const m = Store.DB.meta;
  if (!m.homeRole) return pageSetup();
  if (homeRole() !== '治療師') return pageToday();   // 居服員、家屬：首頁就是今天的練習
  setTitle(APP_TITLE, rocDate(todayISO()) + '（星期' + WEEKDAYS[weekday(todayISO())] + '）');
  const today = todayISO(), cs = Store.all('clients').filter(c => c.status !== '結案');
  const noAssess = [], noPlan = [], ending = [], noShare = [], quiet = [], noConsent = [], recent = [];
  for (const c of cs) {
    const p = activePlan(c.id);
    if (!Logic.lastAssessment(c.id)) noAssess.push(c); else if (!p) noPlan.push(c);
    if (!c.consentDate) noConsent.push(c);
    if (!p) continue;
    if (p.endDate <= addDays(today, 14)) ending.push({ c, p });
    if (!p.sharedAt) noShare.push({ c, p });
    else { const last = p.lastReturn || p.sharedAt; if (diffDays(last.slice(0, 10), today) > 7) quiet.push({ c, p, last }); }
    const st = planStats(p, addDays(today, -6), today); recent.push({ c, p, st });
  }
  const li = (c, t, h, k, lbl = '前往') => `<li><span class="tt"><a href="#/client/${c.id}"><b>${esc(c.name)}</b></a> <small class="muted">${t}</small></span>${/^#/.test(h) ? `<a class="btn sm ${k || ''}" href="${h}">${lbl}</a>` : btn(lbl, h, { k:'sm ' + (k || '') })}</li>`;
  const todos = [...noAssess.map(c => li(c, '尚未評估', `#/assess/new/${c.id}`, 'primary', '進行初評')),
    ...noPlan.map(c => li(c, '已評估，尚未開立計畫', `#/client/${c.id}/plan`, 'primary', '開立計畫')),
    ...noShare.map(({ c, p }) => li(c, '計畫還沒傳給家屬／居服員', `shareLink('${p.id}')`, 'primary', '傳家人版連結')),
    ...quiet.map(({ c, p, last }) => li(c, `${p.lastReturn ? '最近一次回傳是 ' + rocDate(last.slice(0, 10)) : '傳出連結後還沒收到紀錄'}，可提醒家屬按「傳回紀錄」`, `#/client/${c.id}/check`, '', '看紀錄')),
    ...ending.map(({ c, p }) => li(c, p.endDate < today ? `計畫已於 ${rocDate(p.endDate)} 到期，請再評估` : `計畫將於 ${rocDate(p.endDate)} 結束，請安排再評估`, `#/assess/new/${c.id}`, '', '再評估')),
    ...noConsent.map(c => li(c, '尚未記錄參與同意書簽署日期', `#/client/${c.id}/export`, '', '同意書'))];
  const todoCard = `<section class="card"><h2>待處理 ${todos.length ? `<small>${todos.length} 件</small>` : ''}</h2>${todos.length ? `<ul class="todo">${todos.join('')}</ul>` : empty(cs.length ? '✓ 目前沒有待處理事項' : '尚無資料')}</section>`;
  const recCard = `<section class="card"><h2>近 7 天在家練習情形 <small>家屬、居服員的勾選與回傳</small></h2>${recent.length ? `<ul class="todo">${recent.sort((a, b) => (a.st.ok + a.st.part + a.st.skip ? a.st.rate : -1) - (b.st.ok + b.st.part + b.st.skip ? b.st.rate : -1)).map(({ c, p, st }) => `<li><span class="tt"><a href="#/client/${c.id}/check"><b>${esc(c.name)}</b></a> <small class="muted">${st.ok + st.part + st.skip ? `執行率 ${st.rate}%（${st.ok + st.part}/${st.exp}）` : '近 7 天還沒收到紀錄'}${p.lastReturn ? `｜${rocDate(p.lastReturn.slice(0, 10)).slice(-5)} 收到回傳` : ''}</small></span>${st.ok + st.part + st.skip ? `<span class="mini-bar"><i style="width:${st.rate}%"></i></span>` : ''}</li>`).join('')}</ul>` : empty('開立計畫並傳出家人版連結後，這裡會顯示每位長輩在家練習的情形')}</section>`;
  const flow = `<div class="flow5">${[['到宅評估', '最想做到的事＋居家環境'], ['開立計畫', '目標＋練習＋生活中練習'], ['傳家人版連結', '家屬、居服員手機勾選'], ['收回紀錄', '家屬按「傳回紀錄」'], ['再評估／結案', '看進步、調整計畫']].map(([t, d], i) => `<span class="f5"><span class="sn">${i + 1}</span><span><b>${t}</b><small>${d}</small></span></span>`).join('<span class="fa">→</span>')}</div>`;
  const startCard = `<section class="card guide"><h2>還沒有個案資料</h2><p>可以先載入 <b>3 個居家模擬個案</b>，看看從到宅評估、開立計畫、家屬每天勾選、傳回紀錄到再評估的完整流程；看完可一鍵清除。</p><div class="btn-row">${btn('載入 3 個模擬個案', 'loadDemo()', { k:'primary', i:'users' })}<a class="btn" href="#/clients">直接新增個案</a></div></section>`;
  const blank = `<section class="card"><h2>空白表單 <small>到宅時手寫用</small></h2><div class="exp-row"><span>空白居家復能評估表</span>${exportBar('blankAssess', () => assessDoc(null, null))}</div><div class="exp-row"><span>空白復能計畫參與同意書</span>${exportBar('blankConsent', () => consentDoc(null))}</div></section>`;
  return cs.length ? `<div class="grid2">${todoCard}${recCard}</div>${demoGuideHTML()}${flow}${blank}` : `${flow}${startCard}${blank}`;
}
/* 第一次使用：選身分 */
function pageSetup(){
  setTitle(APP_TITLE, '開始使用');
  return `<section class="card setup"><h2>開始使用：請選擇您的身分</h2>
    <p>系統會依身分調整首頁與用語。<b>之後可在「設定與備份」更換，資料都會保留。</b></p>
    <div class="form-grid"><div class="field"><label class="lbl">您的名字（勾選時會記上，可之後修改）</label><input class="inp" id="whoName" placeholder="例：林○君、王○琪（女兒）"></div>
    <div class="field"><label class="lbl">單位名稱（選填，會印在表單抬頭）</label><input class="inp" id="orgName" placeholder="例：○○居家復能團隊"></div></div>
    <div class="choice c3">${HOME_ROLES.map(([k, t, d]) => `<button class="choice-b" onclick="setupRole('${k}')"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    <p class="hint">治療師傳來的「家人版連結」不需要選身分，用手機直接打開就能勾選。</p></section>`;
}
function setupRole(r){
  Store.setMeta('orgType', '居家'); Store.setMeta('homeRole', r);
  const n = $('#orgName')?.value.trim(); if (n) Store.setMeta('orgName', n);
  const w = $('#whoName')?.value.trim(); if (w) { try { localStorage.setItem('rehabh:who', w); } catch(e){} }
  renderShell(); route();
}
function setRole(r){ Store.setMeta('homeRole', r); todayWho = null; renderShell(); route(); toast(`已切換為${r}模式`); }

/* ---------------- 設定 ---------------- */
function pageSettings(){
  setTitle('設定與備份');
  const m = Store.DB.meta;
  return `<div class="grid2">
  <section class="card"><h2>身分與單位</h2>
    <div class="field"><label class="lbl">我是</label><div class="pills">${HOME_ROLES.map(([k]) => `<label class="pill"><input type="radio" name="hr" ${homeRole() === k ? 'checked' : ''} onchange="setRole('${k}')"><span>${k}</span></label>`).join('')}</div>
      <p class="hint">${esc(HOME_ROLES.find(x => x[0] === homeRole())?.[2] || '')}</p></div>
    <div class="field"><label class="lbl">單位名稱（選填，印在表單抬頭）</label><input class="inp" value="${esc(m.orgName || '')}" onchange="Store.setMeta('orgName',this.value.trim());renderShell();toast('已更新')"></div>
  </section>
  <section class="card"><h2>📁 儲存資料夾</h2>${folderCardHTML(false)}</section>
  <section class="card"><h2>資料備份與還原</h2>
    <p>資料只存在<b>這台電腦的這個瀏覽器</b>。請定期匯出備份到隨身碟或雲端硬碟。${m.lastBackup ? `<br>上次備份：${rocDate(m.lastBackup)}` : '<br>' + badge('尚未備份', 'red')}</p>
    <div class="btn-row">${btn('匯出備份', 'backup(false)', { k:'primary', i:'download' })}${btn('匯出加密備份', 'backup(true)', { i:'download' })}</div>
    <div class="btn-row">${btn('匯入／合併', `$('#imp').click()`, { i:'upload' })}<input type="file" id="imp" accept=".json" hidden onchange="importFile(this.files[0],false);this.value=''">${btn('以備份檔完全取代', `$('#imp2').click()`, { k:'danger ghost' })}<input type="file" id="imp2" accept=".json" hidden onchange="importFile(this.files[0],true);this.value=''"></div>
  </section></div>
  <section class="card"><h2>示範與重設</h2><p class="hint">示範資料皆為虛構、已去識別化。</p><div class="btn-row">${btn('載入 3 個模擬個案', 'loadDemo()')}${btn('清除模擬個案', 'clearDemoClients()')}${btn('清除全部資料', 'wipeAll()', { k:'danger' })}</div></section>`;
}
async function backup(enc){
  await Folder.ensure();
  const data = Store.exportAll(); let out = JSON.stringify(data), name = `居家復能備份_${todayISO()}.json`;
  if (enc) { const pw = prompt('請設定備份密碼（至少6碼，遺失無法復原）：'); if (!pw) return; if (pw.length < 6) return toast('密碼至少6碼', 'err'); if (prompt('請再輸入一次密碼：') !== pw) return toast('兩次密碼不一致', 'err'); out = await encryptJSON(data, pw); name = name.replace('.json', '_加密.json'); }
  await download(name, out, 'application/json'); Store.setMeta('lastBackup', new Date().toISOString()); route();
}
async function importFile(file, replace){
  if (!file) return;
  try {
    let data = JSON.parse(await file.text());
    if (data.enc) { const pw = prompt('此為加密備份，請輸入密碼：'); if (!pw) return; try { data = await decryptJSON(data, pw); } catch(e){ return toast('密碼錯誤或檔案損壞', 'err'); } }
    if (replace && !askConfirm('將以備份檔完全取代目前所有資料，無法復原。確定？')) return;
    const r = Store.mergeImport(data, replace); Store.flush(); toast(replace ? `已還原 ${r.added} 筆` : `合併完成：新增 ${r.added}、更新 ${r.updated} 筆`); renderShell(); route();
  } catch(e){ toast('匯入失敗：' + e.message, 'err'); }
}
async function wipeAll(){ if (!askConfirm('將刪除本機所有資料，無法復原。建議先匯出備份。確定？')) return; if (prompt('請輸入「確認刪除」：') !== '確認刪除') return; await Folder.snapshot('刪除前'); Store.clearAll(); Store.flush(); toast('已清除'); renderShell(); App.go('#/'); route(); }
function clearDemo(){ let n = 0; for (const c of COLLECTIONS) for (const r of Store.DB[c]) if (r.demo && !r.deleted) { Store.remove(c, r.id); n++; } toast(`已清除 ${n} 筆示範資料`); route(); }

async function init(){ await Store.load(); await Folder.init(); renderShell(); route(); }
document.addEventListener('DOMContentLoaded', init);

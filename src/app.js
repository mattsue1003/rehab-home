/* ================================================================
   App：外框、路由、設定
   ================================================================ */
const APP_TITLE = '居家復能目標與服務紀錄';
/* 標誌：拄著拐杖向前走的長輩＋向上箭頭（找回能力、往前一步） */
const LOGO_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9.5" cy="4.2" r="2.1"/><path d="M9.2 7.4L8.3 13"/><path d="M8.3 13l-1.7 4-1.2 4"/><path d="M8.3 13l2.4 3.4.5 4.6"/><path d="M9 8.9l3.2 2.6"/><path d="M12.2 11.2l.9 9.8"/><path d="M15.5 17.5l5-7"/><path d="M17.6 10.3h2.9v2.9"/></svg>`;
const navItems = () => [['#/', 'home', '首頁'], ['#/clients', 'users', '個案'], ['#/library', 'clip', '練習項目庫'], ['#/rules', 'rx', 'CA07 規則'], ['#/settings', 'gear', '設定與備份']];
const App = {
  currentUserId(){ return thName(); },
  go(h){ location.hash = h; },
  toast,
};
function renderShell(){
  $('#side').innerHTML = `
    <div class="brand"><div class="logo">${LOGO_SVG}</div><div class="b-txt"><div class="b1">${APP_TITLE}</div><div class="b2">${esc([Store.DB.meta.orgName, thName()].filter(Boolean).join('｜') || 'CA07 居家復能')}</div></div></div>
    <nav>${navItems().map(([h, i, l]) => `<a href="${h}">${icon(i)}<span>${l}</span></a>`).join('')}<a href="javascript:void(0)" class="m-report" onclick="document.body.classList.remove('nav-open');window.openReport&&openReport()">${icon('flag')}<span>回報錯誤／建議</span></a></nav>
    <div class="side-foot">${folderStatusHTML()}</div>`;
  $('#top').innerHTML = `<button class="icon-btn only-m" onclick="document.body.classList.toggle('nav-open')" aria-label="選單">${icon('menu')}</button>
    <div class="top-title" id="top-title"></div><span class="sp"></span>`;
  let bn = $('#bnav'); if (!bn) { bn = document.createElement('nav'); bn.id = 'bnav'; bn.setAttribute('aria-label', '主要功能'); document.body.appendChild(bn); }
  bn.innerHTML = navItems().slice(0, 4).map(([h, i, l]) => `<a href="${h}">${icon(i, 22)}<span>${l.replace('練習項目庫', '項目庫').replace('CA07 規則', '規則')}</span></a>`).join('')
    + `<button type="button" onclick="document.body.classList.toggle('nav-open')">${icon('menu', 22)}<span>更多</span></button>`;
  if (!$('#scrim')) { const s = document.createElement('div'); s.id = 'scrim'; s.onclick = () => document.body.classList.remove('nav-open'); document.body.appendChild(s); }
}
function setTitle(t, sub = ''){ $('#top-title').innerHTML = `<b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`; document.title = t + '｜' + APP_TITLE; }
function navActive(){
  let cur = location.hash || '#/'; try { cur = decodeURIComponent(cur); } catch(e){}
  if (/^#\/(case|visit)\b/.test(cur)) cur = '#/clients';
  document.querySelectorAll('#side nav a, #bnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === cur));
  document.body.classList.remove('nav-open');
}
const ROUTES = [
  [/^#?\/?$/, () => pageHome()],
  [/^#\/clients$/, () => pageClients()],
  [/^#\/case\/([^/?]+)(?:\/(\w+))?(?:\?ep=(\w+))?$/, m => pageCase(m[1], m[2] || '', m[3])],
  [/^#\/visit\/new\/([^/?]+)$/, m => pageVisitEdit(null, m[1])],
  [/^#\/visit\/([^/?]+)$/, m => pageVisitEdit(m[1])],
  [/^#\/library$/, () => pageLibrary()],
  [/^#\/rules$/, () => { setTitle('CA07 規則速查', '居家復能（IADLs 復能、ADLs 復能照護）'); return rulesCard(true) + sourcesCard(); }],
  [/^#\/settings$/, () => pageSettings()],
  [/^#\/share\/(.+)$/, m => { pageShare(m[1]); return null; }],
  [/^#\/import\/(.+)$/, m => { importReturn(m[1]); return null; }],
];
let ignoreHash = false;
function route(){
  let h = location.hash || '#/'; try { h = decodeURIComponent(h); } catch(e){}
  document.body.classList.toggle('share-mode', /^#\/share\//.test(h));
  if ($('#modal').innerHTML) { $('#modal').innerHTML = ''; modalCfg = null; }
  for (const [re, fn] of ROUTES) { const m = h.match(re); if (m) { S.edit = null; S.onEdit = null; S.live = null; S.dirty = false; const html = fn(m); if (html != null) $('#main').innerHTML = html; window.scrollTo(0, 0); S.lastHash = h; navActive(); return; } }
  location.hash = '#/';
}
window.addEventListener('hashchange', () => {
  if (ignoreHash) { ignoreHash = false; return; }
  if (S.dirty && !askConfirm('目前編輯的內容尚未儲存，確定要離開嗎？')) { ignoreHash = true; location.hash = S.lastHash; return; }
  route();
});
window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
/* 手機版：表格改為卡片（每格加上欄名） */
function mobilize(root = document.getElementById('main')){
  if (!root) return;
  root.querySelectorAll('table.tbl:not(.qa)').forEach(t => {
    const hs = [...t.querySelectorAll('thead th')].map(th => th.innerText.replace(/\s+/g, ' ').trim());
    if (!hs.length) return; t.classList.add('stk');
    t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
      if (td.hasAttribute('data-label')) return;
      td.setAttribute('data-label', td.colSpan > 1 ? '' : hs[i] || '');
      if (td.colSpan > 1 || td.querySelector('.btn,.exp,input:not([type=radio]):not([type=checkbox]),select,textarea,.mini-bar') || td.innerText.trim().length + (hs[i] || '').length > 13) td.classList.add('w');
    }));
  });
}
if (typeof MutationObserver !== 'undefined' && document.getElementById) new MutationObserver(() => { clearTimeout(mobilize._t); mobilize._t = setTimeout(() => mobilize(), 30); }).observe(document.getElementById('main') || document.body, { childList:true, subtree:true });
function rerender(fn){ const y = window.scrollY; $('#main').innerHTML = fn(); window.scrollTo(0, y); }

function sourcesCard(){
  return `<section class="card"><h2>依據的公開文件</h2><ul class="src">
    <li>衛生福利部《長照專業服務操作指引－操作篇（共通操作指引）》，111 年 12 月：目標 5 大要素、長短期目標範例、結案與延案條件、90 天重啟原則。</li>
    <li>衛生福利部《長照專業服務操作指引－附錄一》：服務合約書、評估表（含結案紀錄）暨服務計畫、服務紀錄表、居家指導紀錄表參考格式；CA07 為 3 次訪視（含評估）1 給付單位 4,500 元。</li>
    <li>「專業服務紀錄表-1」（114 年 9 月 1 日修訂）：目標類別單選、指導對象可複選且應含主要照顧者、服務介入前後 1–10 分、結案與延案欄位。</li>
    <li>照管系統服務紀錄必填欄位（109 年 2 月 1 日起）：復能目標達成情形、復能目標、指導對象、服務內容、指導建議摘要；各欄寫法參考縣市專業服務作業須知。</li>
    <li>行政院核定《長期照顧十年計畫 3.0（115–124 年）》：「積極長照復能」為八大目標之一，提升長照專業（含復能）服務使用率。</li></ul>
    <p class="hint">本工具只協助整理與複製文字，正式紀錄仍以照管系統登錄內容為準。</p></section>`;
}

/* ---------------- 設定 ---------------- */
function pageSettings(){
  setTitle('設定與備份');
  const m = Store.DB.meta, t = m.therapist || {};
  const set = k => `Store.setMeta('therapist',{...(Store.DB.meta.therapist||{}),${k}:this.value.trim()});renderShell();toast('已更新')`;
  return `<div class="grid2">
  <section class="card"><h2>治療師與單位 <small>印在表單與指導單上</small></h2><div class="form-grid">
    <div class="field"><label class="lbl">姓名</label><input class="inp" value="${esc(t.name || '')}" onchange="${set('name')}"></div>
    <div class="field"><label class="lbl">職稱</label><input class="inp" value="${esc(t.title || '')}" list="roles" onchange="${set('title')}"><datalist id="roles">${PRO_ROLES.map(r => `<option>${r}</option>`).join('')}</datalist></div>
    <div class="field"><label class="lbl">證書字號（選填）</label><input class="inp" value="${esc(t.license || '')}" onchange="${set('license')}"></div>
    <div class="field"><label class="lbl">聯絡電話（選填）</label><input class="inp" value="${esc(t.phone || '')}" onchange="${set('phone')}"></div>
    <div class="field span2"><label class="lbl">單位名稱（選填）</label><input class="inp" value="${esc(m.orgName || '')}" onchange="Store.setMeta('orgName',this.value.trim());renderShell();toast('已更新')"></div></div></section>
  <section class="card"><h2>照管系統選項</h2><div class="field"><label class="lbl">「復能目標達成情形」下拉選單的選項（用頓號分隔，由好到差）</label><input class="inp" value="${esc(ACHIEVE().join('、'))}" onchange="Store.setMeta('achieveOpts',this.value.split(/[、,，]/).map(x=>x.trim()).filter(Boolean));toast('已更新')"><p class="hint">預設為「達成、部分達成、未達成」。如果您所在縣市的系統選項不同，可在這裡改成一樣的文字。</p></div>
    <div class="field"><label class="lbl">表單簽名欄</label>${signPrefHTML()}</div></section>
  <section class="card"><h2>📁 儲存資料夾</h2>${folderCardHTML(false)}</section>
  <section class="card"><h2>資料備份與還原</h2>
    <p>資料只存在<b>這台裝置的這個瀏覽器</b>。請定期匯出備份到隨身碟或雲端硬碟。${m.lastBackup ? `<br>上次備份：${rocDate(m.lastBackup)}` : '<br>' + badge('尚未備份', 'red')}</p>
    <div class="btn-row">${btn('匯出備份', 'backup(false)', { k:'primary', i:'download' })}${btn('匯出加密備份', 'backup(true)', { i:'download' })}</div>
    <div class="btn-row">${btn('匯入／合併', `$('#imp').click()`, { i:'upload' })}<input type="file" id="imp" accept=".json" hidden onchange="importFile(this.files[0],false);this.value=''">${btn('以備份檔完全取代', `$('#imp2').click()`, { k:'danger ghost' })}<input type="file" id="imp2" accept=".json" hidden onchange="importFile(this.files[0],true);this.value=''"></div>
  </section></div>
  <section class="card"><h2>示範與重設</h2><p class="hint">示範資料皆為虛構、已去識別化。</p><div class="btn-row">${btn('載入 3 個模擬個案', 'loadDemo()')}${btn('清除模擬個案', 'clearDemo()')}${btn('清除全部資料', 'wipeAll()', { k:'danger' })}</div></section>`;
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

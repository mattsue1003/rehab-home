/* ================================================================
   居家指導：治療師 → 案家（LINE 連結，圖文指導單）→ 案家回填日期、次數、簽名 → 傳回匯入
   連結內容壓縮後放在網址 # 之後，不經過任何伺服器
   ================================================================ */
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
const baseURL = () => location.href.split('#')[0];
function guidePayload(ep){
  const c = Store.get('clients', ep.clientId), t = me();
  return { v:2, ep:ep.id, n:c.callName || c.name, th:t.name || '', tt:t.title || '', ph:t.phone || '', org:Store.DB.meta.orgName || '', at:todayISO(), msg:ep.guideMsg || '',
    g:(ep.goals || []).filter(g => g.activity).map(g => g.text || composeGoal(g)),
    i:(ep.guide || []).map(x => ({ id:x.id, x:x.exId || '', n:x.name, d:x.dose || '', f:x.freq || '', h:x.how || '', s:x.steps || '', c:x.caution || '' })) };
}
async function shareGuide(epId){
  const ep = Store.get('episodes', epId), c = Store.get('clients', ep.clientId);
  if (!(ep.guide || []).length) return toast('請先加入至少一項練習', 'err');
  const url = baseURL() + '#/share/' + await packShare(guidePayload(ep));
  const msg = `${c.callName || c.name} 的居家練習指導（點開看圖文說明，做完記一下次數）：\n${url}`;
  openModal('用 LINE 傳給案家', `<p>案家用手機打開就能看到<b>每項練習的圖片與做法</b>，練完記下<b>日期、次數</b>並簽名，再按「傳回給治療師」。</p>
    <div class="notice">${icon('alert', 16)} 連結裡含有「${esc(c.callName || c.name)}」的稱呼與練習內容，<b>只傳給個案本人與主要照顧者</b>。不含身分證字號、地址、病史。內容修改後請重新傳一次。</div>
    <div class="field"><label class="lbl">指導單上的稱呼</label><input class="inp" value="${esc(c.callName || '')}" placeholder="例：王伯伯（不填就用姓名）" onchange="const x=Store.get('clients','${c.id}');x.callName=this.value.trim();Store.upsert('clients',x);closeModal(true);shareGuide('${ep.id}')"></div>
    <textarea class="inp" rows="3" readonly onclick="this.select()">${esc(url)}</textarea>
    <div class="btn-row"><a class="btn primary" href="https://line.me/R/msg/text/?${encodeURIComponent(msg)}" target="_blank" rel="noopener" onclick="markShared('${ep.id}')">用 LINE 傳送</a>${btn('複製連結', `markShared('${ep.id}');copyText(${esc(JSON.stringify(msg))})`)}<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">先預覽</a></div>`, {});
}
function markShared(id){ const e = Store.get('episodes', id); if (!e) return; e.sharedAt = new Date().toISOString(); Store.upsert('episodes', e); Store.flush(); if (S.edit?.id === id) S.edit.sharedAt = e.sharedAt; }

/* ---------- 案家看到的頁面（不讀主資料庫；紀錄存在這支手機） ---------- */
const SH = { d:null, key:'', day:null };
const shGet = () => { try { return JSON.parse(localStorage.getItem(SH.key) || '{}'); } catch(e){ return {}; } };
const shSet = o => { try { localStorage.setItem(SH.key, JSON.stringify(o)); } catch(e){ toast('手機儲存空間不足，無法儲存', 'err'); } };
async function pageShare(code){
  document.body.classList.add('share-mode');
  try { SH.d = await unpackShare(code); } catch(e){ SH.d = null; }
  if (!SH.d || SH.d.v !== 2) { $('#main').innerHTML = `<section class="card">${empty(SH.d ? '這是舊版的連結，請治療師重新傳一次新的指導單。' : '連結不完整或已損壞，請治療師重新傳一次。')}</section>`; return; }
  SH.key = 'rehabh:g:' + SH.d.ep; renderShare();
}
function renderShare(){
  const D = SH.d, d = SH.day || todayISO(), r = shGet(), signer = r.signer || '';
  const cnt = id => +(r[d + '|' + id] || 0), done = D.i.filter(x => cnt(x.id) > 0).length;
  document.title = D.n + ' 的居家練習';
  $('#main').innerHTML = `<div class="sh">
    <header class="sh-h"><div class="logo">${LOGO_SVG}</div><div><b>${esc(D.n)} 的居家練習</b><small>${esc([D.org, D.th ? `${D.th}${D.tt ? ' ' + D.tt : ''}` : '', D.ph].filter(Boolean).join('｜'))}｜${rocDate(D.at)} 更新</small></div></header>
    ${D.msg ? `<section class="sh-msg">${esc(D.msg)}</section>` : ''}
    ${D.g.length ? `<details class="sh-goal"><summary><b>我們一起努力的目標</b>（${D.g.length} 項，點開看）</summary>${D.g.map((g, i) => `<p>${i + 1}. ${esc(g)}</p>`).join('')}</details>` : ''}
    <div class="sh-day"><button class="btn" onclick="SH.day=addDays('${d}',-1);renderShare()">${icon('back', 16)}前一天</button><b>${d === todayISO() ? '今天' : rocDate(d).slice(-5)}（週${WEEKDAYS[weekday(d)]}）</b><button class="btn" onclick="SH.day=addDays('${d}',1);renderShare()" ${d >= todayISO() ? 'disabled' : ''}>後一天</button></div>
    <p class="sh-prog">${done ? `已練習 <b>${done}</b>／${D.i.length} 項` : '做完一次就按「＋1」，記下做了幾次'}</p>
    <div class="sh-list">${D.i.map(x => { const e = x.x ? findItem(x.x) : null, n = cnt(x.id); return `<article class="sh-it2 ${n ? 's-ok' : ''}">
      ${e?.img ? `<img src="${esc(e.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="sh-tx"><b>${esc(x.n)}</b>${x.d || x.f ? `<span class="sh-dose">${esc([x.d, x.f].filter(Boolean).join('，'))}</span>` : ''}${x.h ? `<small>${esc(x.h)}</small>` : ''}${x.s ? `<details><summary>步驟</summary><small>${esc(x.s)}</small></details>` : ''}${x.c ? `<small class="warn-t">注意：${esc(x.c)}</small>` : ''}</div>
      <div class="sh-cnt"><button type="button" aria-label="減一次" onclick="shAdd('${esc(x.id)}',-1)" ${n ? '' : 'disabled'}>－</button><span><b>${n}</b><small>次</small></span><button type="button" class="plus" aria-label="加一次" onclick="shAdd('${esc(x.id)}',1)">＋1</button></div></article>`; }).join('')}</div>
    <section class="card sh-note"><h2>簽名 <small>居家指導紀錄表需要</small></h2><input class="inp" value="${esc(signer)}" placeholder="陪練的人：例 王○芳（媳婦）" onchange="const r=shGet();r.signer=this.value.trim();shSet(r);toast('已記下')"></section>
    <div class="btn-row sh-foot">${btn('傳回給治療師', 'shReport()', { k:'primary', i:'upload' })}</div>
    <p class="hint">紀錄只存在這支手機。請在治療師下次來之前按「傳回給治療師」，用 LINE 傳出去。</p></div>`;
}
function shAdd(id, k){ const r = shGet(), key = (SH.day || todayISO()) + '|' + id, n = Math.max(0, (+r[key] || 0) + k); if (n) r[key] = n; else delete r[key]; shSet(r); renderShare(); }
async function shReport(){
  const D = SH.d, r = shGet();
  if (!r.signer) { toast('請先在「簽名」寫上您的名字', 'err'); document.querySelector('.sh-note input')?.focus(); return; }
  const recs = Object.entries(r).filter(([k]) => k.includes('|')).map(([k, v]) => { const [date, itemId] = k.split('|'); return [date, itemId, +v]; }).filter(x => x[2] > 0 && x[0] >= addDays(todayISO(), -30)).sort((a, b) => a[0].localeCompare(b[0]));
  if (!recs.length) return toast('還沒有記錄任何練習', 'err');
  const name = id => D.i.find(x => x.id === id)?.n || '';
  const byDay = {}; recs.forEach(([d, id, n]) => (byDay[d] = byDay[d] || []).push(`${name(id)} ${n} 次`));
  const lines = [`【${D.n} 居家練習紀錄】簽名：${r.signer}`, ...Object.entries(byDay).map(([d, a]) => `${rocDate(d).slice(-5)}（${WEEKDAYS[weekday(d)]}）${a.join('、')}`)];
  const link = baseURL() + '#/import/' + await packShare({ v:2, ep:D.ep, n:D.n, s:r.signer, r:recs });
  lines.push('', '治療師點這個連結就能匯入：', link);
  const txt = lines.join('\n');
  openModal('傳回給治療師', `<p>紀錄已整理好，按「用 LINE 傳送」選擇治療師就可以了。</p><textarea class="inp" rows="8" readonly onclick="this.select()">${esc(txt)}</textarea>
    <div class="btn-row"><a class="btn primary" href="https://line.me/R/msg/text/?${encodeURIComponent(txt)}" target="_blank" rel="noopener">用 LINE 傳送</a>${btn('複製', `copyText(${esc(JSON.stringify(txt))})`)}</div>`, {});
}
/* ---------- 治療師端：匯入案家傳回的紀錄 ---------- */
async function importReturn(code){
  let R; try { R = await unpackShare(code); } catch(e){ R = null; }
  setTitle('匯入案家傳回的紀錄', R?.n || '');
  if (!R || R.v !== 2) { $('#main').innerHTML = `<section class="card">${empty('紀錄連結不完整或是舊版，請案家重新按一次「傳回給治療師」。')}</section>`; return; }
  const ep = Store.get('episodes', R.ep);
  if (!ep) { $('#main').innerHTML = `<section class="card">${empty(`這份紀錄（${esc(R.n || '')}）的個案不在這台裝置裡。請用建立個案的那台電腦或平板打開這個連結。`, `<a class="btn" href="#/">回首頁</a>`)}</section>`; return; }
  const ids = new Set((ep.guide || []).map(x => x.id)), old = Store.all('returns').filter(x => x.episodeId === ep.id);
  const seen = new Set(old.flatMap(x => x.recs.map(y => y.date + '|' + y.itemId)));
  const recs = R.r.filter(([d, id]) => ids.has(id)).map(([date, itemId, times]) => ({ date, itemId, times }));
  /* 同一天同一項以最新回傳為準 */
  for (const o of old) { const before = o.recs.length; o.recs = o.recs.filter(y => !recs.some(x => x.date === y.date && x.itemId === y.itemId)); if (o.recs.length !== before) Store.upsert('returns', o); }
  const fresh = recs.filter(x => !seen.has(x.date + '|' + x.itemId)).length;
  Store.upsert('returns', { episodeId:ep.id, clientId:ep.clientId, signer:R.s || '', recs, receivedAt:new Date().toISOString() });
  ep.lastReturn = new Date().toISOString(); Store.upsert('episodes', ep); await Store.flush();
  const days = new Set(recs.map(x => x.date)).size;
  $('#main').innerHTML = `<section class="card"><h2>已匯入 ${esc(Store.get('clients', ep.clientId)?.name || R.n)} 的居家練習紀錄</h2>
    <p>簽名：<b>${esc(R.s || '')}</b>｜共 ${days} 天、${recs.length} 筆（新增 ${fresh} 筆）。下次寫訪視紀錄時，「追蹤前次情況」會出現這段回報可以直接帶入。</p>
    <div class="btn-row"><a class="btn primary" href="#/case/${ep.clientId}/guide">看執行紀錄</a><a class="btn" href="#/visit/new/${ep.id}">寫訪視紀錄</a></div></section>`;
  history.replaceState(null, '', location.pathname + location.search + '#/case/' + ep.clientId + '/guide');
}

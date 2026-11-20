/* ================================================================
   語音輸入：長文字欄位旁的麥克風鈕（瀏覽器內建語音辨識，zh-TW）
   - Chrome／Edge／Safari 會把語音送到 Google／微軟／Apple 轉成文字，轉好的文字只存在本機
   - 第一次使用先說明隱私；設定可關閉；不支援的瀏覽器改提示用鍵盤或系統語音輸入
   ================================================================ */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
ICON_PATHS.mic = 'M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8';
const UA = navigator.userAgent || '';
const PLATFORM = /Android/i.test(UA) ? 'android' : /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/i.test(UA) && navigator.maxTouchPoints > 1) ? 'ios' : /Windows/i.test(UA) ? 'windows' : /Macintosh/i.test(UA) ? 'mac' : 'other';
const voiceOn = () => !!SpeechRec && Store.DB.meta.voice !== false;
const VOICE_SERVICE = () => /Edg\//.test(UA) ? '微軟' : PLATFORM === 'ios' || (/Safari/.test(UA) && !/Chrome|Chromium|Edg/.test(UA)) ? 'Apple' : 'Google';
function sysVoiceTip(){
  return { android:'點欄位後，按 Gboard 鍵盤上的麥克風說話；在 Gboard 設定下載「中文（台灣）」離線語音，就能在手機上轉文字。',
    windows:'點欄位後按 Win＋H 開啟 Windows 語音輸入（需先在「設定 › 時間與語言 › 語音」加入中文）。',
    ios:'點欄位後，按鍵盤上的麥克風說話。', mac:'點欄位後，按兩下 fn（或 🌐）鍵開啟聽寫。', other:'可以使用鍵盤或系統內建的語音輸入。' }[PLATFORM];
}

/* 在 #main 的長文字欄位後面加上麥克風列 */
const MIC_SEL = 'textarea[data-bind], input[data-bind^="gnote."]';
function addMics(root = document.getElementById('main')){
  if (!root || !voiceOn() || document.body.classList.contains('share-mode')) return;
  root.querySelectorAll(MIC_SEL).forEach(el => {
    if (el.dataset.mic || el.readOnly) return;
    el.dataset.mic = '1'; if (!el.id) el.id = 'v' + Math.random().toString(36).slice(2, 9);
    const row = document.createElement('div'); row.className = 'mic-row';
    row.innerHTML = `<button type="button" class="mic" data-for="${el.id}" onclick="micToggle(this)" aria-label="語音輸入" title="用說的輸入（再按一次停止）">${icon('mic', 15)}<span>說話輸入</span></button><span class="mic-live" aria-live="polite"></span>`;
    el.insertAdjacentElement('afterend', row);
  });
}
if (typeof MutationObserver !== 'undefined' && document.getElementById) new MutationObserver(() => { clearTimeout(addMics._t); addMics._t = setTimeout(() => addMics(), 40); }).observe(document.getElementById('main') || document.body, { childList:true, subtree:true });

let REC = null;
function micToggle(b){
  const same = REC?.btn === b;
  if (REC) stopMic();
  if (same) return;
  if (!Store.DB.meta.voiceOk) return voiceConsent(b);
  startMic(b);
}
function voiceConsent(b){
  openModal('語音輸入', `<p>說話的內容會經由 <b>${VOICE_SERVICE()}</b> 的語音服務轉成文字（需要網路），轉好的文字只存在這台裝置，和其他紀錄一樣不會上傳。</p>
    <div class="notice warn">${icon('alert', 16)} 說話時請<b>不要說出個案全名、身分證字號、地址或電話</b>，用「個案」「伯伯」「照顧者」等稱呼即可。</div>
    <p class="hint">說完再按一次按鈕停止。轉出的文字會接在欄位原本的內容後面，可以再修改。不想用的話可以在「設定與備份」關閉麥克風鈕；也可以改用系統語音輸入：${esc(sysVoiceTip())}</p>`,
    { saveLabel:'我知道了，開始說話', onSave:() => { Store.setMeta('voiceOk', true); setTimeout(() => document.contains(b) && startMic(b), 50); } });
}
const joinText = (base, add) => { base = (base || '').replace(/\s+$/, ''); if (!add) return base; return base ? base + (/[。，；、！？：\n]$/.test(base) ? '' : '；') + add : add; };
function startMic(b){
  const el = document.getElementById(b.dataset.for); if (!el) return;
  const r = new SpeechRec(), live = b.parentElement.querySelector('.mic-live'), base = el.value;
  r.lang = 'zh-TW'; r.interimResults = true; r.maxAlternatives = 1;
  r.continuous = PLATFORM !== 'android';   // Android 連續模式常重複結果：改為說一段自動停止
  let finals = '';
  const put = v => { el.value = v; el.dispatchEvent(new Event('input', { bubbles:true })); };
  r.onresult = e => {
    if (!document.contains(el)) return stopMic();
    const all = [...e.results];
    finals = all.filter(x => x.isFinal).map(x => x[0].transcript.trim()).filter(Boolean).join('，');
    const interim = all.filter(x => !x.isFinal).map(x => x[0].transcript).join('');
    if (finals) put(joinText(base, finals));
    live.textContent = interim ? '…' + interim : '';
  };
  r.onerror = e => {
    const m = { 'not-allowed':'請允許這個網站使用麥克風（網址列左邊的鎖頭圖示可以設定）', 'service-not-allowed':'這個瀏覽器目前不能使用語音辨識，請改用鍵盤的語音輸入', network:'語音辨識需要網路，請確認連線', 'no-speech':'沒有聽到聲音，請再按一次並靠近麥克風說話', 'audio-capture':'找不到麥克風', 'language-not-supported':'這個瀏覽器不支援中文（台灣）語音辨識' }[e.error];
    if (m) toast(m, e.error === 'no-speech' ? '' : 'err');
  };
  r.onend = () => {
    if (finals && document.contains(el) && !/[。！？]$/.test(el.value)) { el.value = el.value.replace(/[，；、]$/, '') + '。'; el.dispatchEvent(new Event('input', { bubbles:true })); }
    cleanup();
  };
  const cleanup = () => { b.classList.remove('on'); b.querySelector('span').textContent = '說話輸入'; live.textContent = ''; if (REC?.r === r) REC = null; };
  try { r.start(); } catch(e){ toast('無法啟動語音輸入：' + e.message, 'err'); return; }
  REC = { r, btn:b, cleanup };
  b.classList.add('on'); b.querySelector('span').textContent = '聆聽中…按此停止'; live.textContent = '請開始說話';
}
function stopMic(){ if (!REC) return; const { r } = REC; try { r.stop(); } catch(e){} setTimeout(() => REC?.r === r && REC.cleanup(), 1500); }
window.addEventListener('hashchange', () => { if (REC) { try { REC.r.abort(); } catch(e){} REC.cleanup(); } });

/* 設定頁區塊與不支援時的提示 */
function voiceSettingsHTML(){
  if (!SpeechRec) return `<p>這個瀏覽器不支援網頁內的語音辨識，所以不會顯示麥克風鈕。</p><p class="hint">${esc(sysVoiceTip())}</p>`;
  return `<label class="chk"><input type="checkbox" ${Store.DB.meta.voice !== false ? 'checked' : ''} onchange="Store.setMeta('voice',this.checked);toast(this.checked?'已開啟麥克風鈕':'已關閉麥克風鈕')"><span>在長文字欄位旁顯示「說話輸入」麥克風鈕</span></label>
    <p class="hint">語音會經由 ${VOICE_SERVICE()} 的語音服務轉成文字（需要網路），轉好的文字只存在這台裝置。請不要說出個案全名、身分證字號、地址。也可以改用系統語音輸入：${esc(sysVoiceTip())}</p>`;
}
const voiceTipHTML = () => SpeechRec ? '' : `<p class="hint mic-tip">${icon('mic', 14)} 想用說的輸入？${esc(sysVoiceTip())}</p>`;

/* ================================================================
   表單：依衛福部《長照專業服務操作指引》附錄一與「專業服務紀錄表-1」（114/9/1 修訂）
   ep 為 null 時輸出空白表單（到宅手寫用）
   ================================================================ */
const ck = on => on ? '☑' : '☐';
const thLine = () => { const t = me(); return [t.name, t.title, t.license ? '證書字號 ' + t.license : ''].filter(Boolean).join('　'); };
const cOf = ep => ep ? Store.get('clients', ep.clientId) || {} : {};
const whoLine = (sel = [], other = '') => WHO.map(w => `${ck(sel.includes(w))}${w}${w === '其他' && other ? '：' + other : ''}`).join('　');
const epEnd = ep => ep?.status === '已結案' ? ep.closing?.date : (epVisits(ep).at(-1)?.date || '');
function rec1Doc(ep){
  const c = cOf(ep), vs = ep ? epVisits(ep) : [], goals = ep ? (ep.goals || []).filter(g => g.activity) : [], cl = ep?.closing || {}, x = ep?.extend || {};
  const cell = i => { const v = vs[i]; return v ? `${rocDate(v.date)}\n${v.start || ''}–${v.end || ''}` : ''; };
  const rows = Array.from({ length:6 }, (_, i) => [String(i + 1), cell(i), '', '', String(i + 7), cell(i + 6), '', '']);
  const blocks = [
    { t:'kv', cols:2, rows:[['個案姓名', c.name || ''], ['身分證字號', ''], ['A 個管員', ep?.caseMgr || ''], ['照顧組合', `${ck(!!ep)}CA07（IADLs 復能、ADLs 復能照護）`],
      ['服務期程', ep ? `頻率：${ep.freq || '每週 1 次'}　總組數：${ep.groups} 組（${epApproved(ep)} 次）` : '頻率：____週服務 1 次　總組數：____組'], ['專業服務目標管理起迄日', ep ? `${rocDate(ep.startDate)}～${rocDate(epEnd(ep))}` : '']] },
    { t:'kv', cols:1, rows:[['問題清單項目', (ep?.problems || []).join('、')], ['同期間是否接受健保復健服務', ep ? (ep.nhi === '有' ? `☑有：${ep.nhiNote || ''}` : '☑無') : '☐無　☐有：＿＿＿＿醫院/診所/治療所，復健時間、頻率：＿＿＿＿'], ['個案（或家屬）最希望改善的日常生活活動項目（專業服務目標）', ep?.serviceGoal || '']] },
    { t:'p', small:true, text:'服務期程原則：同一目標不超過 12 次（每週至多 1 次為原則），並於 6 個月內完成訓練目標。結案原則：同一訓練目標經過 1 組服務介入後，仍未有明顯進步，或個案與照顧者無法配合指導訓練；經評估後，個案已無意願／潛力。' },
    { t:'table', head:['次', '服務日期／時間', '專業人員簽名', '個案或家屬簽名', '次', '服務日期／時間', '專業人員簽名', '個案或家屬簽名'], rows, widths:[0.5, 1.7, 1.4, 1.4, 0.5, 1.7, 1.4, 1.4], center:[0, 4], rowH:11, fs:9 },
    { t:'h', text:'訓練目標（服務期程 12 週內以 3–5 項為原則；目標單選，指導對象可複選）' },
  ];
  const n = Math.max(3, goals.length);
  for (let i = 0; i < n; i++) {
    const g = goals[i] || {};
    blocks.push({ t:'kv', cols:1, rows:[[`目標 ${i + 1}`, GOAL_CATS.map(x => ck(g.cat === x) + x).join(' ')], ['訓練目標說明（含執行方式及協助程度）', [g.text || (g.activity ? composeGoal(g) : ''), g.short ? '短期：' + g.short : ''].filter(Boolean).join('\n')],
      ['指導對象（應含主要照顧者）', whoLine(g.who, g.whoOther)], ['服務介入前目標活動執行情形（最差 1 分，最佳 10 分）', g.pre ? String(g.pre) : ''], ['服務介入後目標活動執行情形（最差 1 分，最佳 10 分）', g.post ? String(g.post) : '']] });
  }
  blocks.push({ t:'h', text:'服務成果' }, { t:'kv', cols:1, rows:[['個案於服務期滿之活動表現情形', cl.outcome || ''],
    ['結案', CLOSE_REASONS.map(r => `${cl.reason === r && ep?.status === '已結案' ? '●' : '○'}${r}${r === '其他' && cl.other ? '：' + cl.other : ''}`).join('　')],
    ['申請延案', x.applied ? `☑ ${x.weeks || '＿'} 週內，${x.times || '＿'} 次（至多原數量之 1/2 次數）\n原因：${x.reason || ''}\n預期效益：${x.benefit || ''}` : '☐ ＿＿週內，＿＿次（至多原數量之 1/2 次數）　原因：　　預期效益：']] },
    { t:'sign', items:['個案或家屬簽名'] });
  return { title:'專業服務紀錄表-1', sub:'依衛生福利部 114 年 9 月 1 日修訂格式　' + thLine(), blocks };
}
function assessPlanDoc(ep){
  const c = cOf(ep), a = ep.assess || {}, cr = ep.carer || {}, vs = epVisits(ep), goals = (ep.goals || []).filter(g => g.activity), b = scoreBarthel(a), id = scoreIADL(a), pot = a.pot || {};
  return { title:'評估表暨服務計畫', sub:`CA07 IADLs 復能、ADLs 復能照護　${thLine()}`, blocks:[
    { t:'kv', cols:3, rows:[['照會日期', rocDate(ep.referDate)], ['評估日期', rocDate(vs[0]?.date || '')], ['結案日期', ep.status === '已結案' ? rocDate(ep.closing?.date) : '']] },
    { t:'h', text:'服務提供者與個案基本資料' },
    { t:'kv', cols:2, rows:[['轉介者（照專／A 個管）', ep.caseMgr || ''], ['A 單位', ep.aUnit || ''], ['服務單位', Store.DB.meta.orgName || ''], ['專業人員／電話', [me().name, me().phone].filter(Boolean).join('　')],
      ['姓名', c.name || ''], ['性別／生日', [c.gender, rocDate(c.birth)].filter(Boolean).join('　')], ['長照需要等級', c.cms || ''], ['居住地', c.address || ''], ['主要照顧者', [cr.name, cr.rel, cr.type].filter(Boolean).join('　')], ['聯絡電話', c.phone || '']] },
    { t:'h', text:'個案能力狀況與特殊需求' },
    { t:'kv', cols:1, rows:[['主訴', a.complaint || ''], ['主要診斷／開刀史／用藥', [c.dx, a.dx].filter(Boolean).join('；')], ['過去病史', a.history || ''], ['目前能力狀況', a.ability || ''], ['認知、溝通、情緒行為', a.mind || ''], ['特殊照護需求', a.special || ''], ['居家環境描述', a.env || ''], ['家庭狀況（同住者）', a.family || ''],
      ['主要照顧者照顧技巧', [cr.skill, cr.time ? '可配合時段：' + cr.time : ''].filter(Boolean).join('；')], ['標準化量表', [b ? `巴氏量表 ${b.total} 分（${b.level}）` : '', id ? `IADL ${id.total} 分` : ''].filter(Boolean).join('　')]] },
    { t:'h', text:'專業服務問題評值：個案或家屬最重視的活動' },
    { t:'table', head:['活動', '重要性', '目前表現', '滿意度'], rows:(a.pri || []).filter(r => r.act).map(r => [r.act, r.imp || '', r.perf || '', r.sat || '']), widths:[4, 1, 1, 1], center:[1, 2, 3] },
    { t:'kv', cols:2, rows:[['個案學習能力', pot.learn || ''], ['病情穩定度', pot.stable || ''], ['個案及家屬動機', pot.motive || ''], ['訓練配合度', pot.coop || '']] },
    { t:'h', text:'初評結果與服務計畫' },
    { t:'kv', cols:1, rows:[['評估結果與主要問題', a.summary || ''], ['專業服務目標', ep.serviceGoal || ''], ['服務期程', `${ep.freq || '每週 1 次'}，${ep.groups} 組（${epApproved(ep)} 次），${rocDate(ep.startDate)} 起`]] },
    { t:'table', head:['#', '類別', '訓練目標', '指導對象', '介入前'], rows:goals.map((g, i) => [String(i + 1), g.cat, [g.text || composeGoal(g), g.short ? '短期：' + g.short : ''].filter(Boolean).join('\n'), (g.who || []).join('、'), g.pre || '']), widths:[0.4, 1.1, 5, 1.6, 0.8], center:[0, 4], fs:9.5 },
    { t:'kv', cols:1, rows:[['個案及照顧者指導項目', (ep.guide || []).map((x, i) => `${i + 1}. ${x.name}（${[x.dose, x.freq].filter(Boolean).join('，')}）`).join('\n')]] },
    { t:'sign', items:['個案或家屬', '專業人員'] }] };
}
function visitDoc(ep, v, n){
  const c = cOf(ep), goals = ep ? (ep.goals || []).filter(g => g.activity) : [];
  const blocks = [
    { t:'kv', cols:2, rows:[['姓名', c.name || ''], ['生日', rocDate(c.birth)], ['專業人員', thLine()], ['聯絡電話', me().phone || ''], ['服務項目', `${ck(!!ep)}CA07　☐CA08　☐CB01　☐CB02　☐CB03　☐CB04　☐CC01　☐CD02`], ['服務次數和時間', v ? `第 ${n} 次（${visitLabel(n)}）　${rocDate(v.date)}　${v.start || ''}–${v.end || ''}` : '第［　］次　服務日期：　　　起訖時間：']] },
    { t:'kv', cols:1, rows:[['服務指導對象', v ? whoLine(v.who, v.whoOther) + (v.carerName ? `　照顧者姓名：${v.carerName}` : '') : whoLine() + '　照顧者姓名：']] },
    { t:'h', text:'復能目標與達成情形' },
    { t:'table', head:['#', '復能目標', '本次達成情形', '本次表現'], rows:goals.length ? goals.map((g, i) => [String(i + 1), g.text || composeGoal(g), v?.status?.[g.id] || '', v?.gnote?.[g.id] || '']) : [['', '', '', ''], ['', '', '', ''], ['', '', '', '']], widths:[0.4, 4.2, 1.3, 3], center:[0, 2], rowH:ep ? 0 : 14, fs:9.5 },
    { t:'h', text:'訓練紀錄（服務內容）' }, { t:'p', text:v ? textOf(v.content, CONTENT_PARTS.filter(([k]) => k !== 'perf')) + (v.content?.perf ? '\n其他表現：' + v.content.perf : '') || '' : '\n\n\n\n' },
    { t:'h', text:'指導建議摘要' }, { t:'p', text:v ? textOf(v.advice, ADVICE_PARTS) || '' : '\n\n\n' },
    { t:'p', small:true, text:'學習之照顧者應為同一人（組），以達學習成效。相關服務紀錄應依長期照顧服務法或各該專門職業醫事人員法規規定留存。' },
    { t:'sign', items:['案家', '專業人員'] }];
  return { title:'服務紀錄表', sub:v ? `${c.name}　第 ${n} 次` : '每次服務均需填寫', blocks };
}
function guideDoc(ep){
  const c = cOf(ep), items = ep ? (ep.guide || []) : [], rets = ep ? Store.all('returns').filter(r => r.episodeId === ep.id) : [];
  const recs = rets.flatMap(r => r.recs.map(x => ({ ...x, s:r.signer }))).sort(byDate('date'));
  const rows = recs.map(x => [rocDate(x.date), items.find(g => g.id === x.itemId)?.name || '', String(x.times), x.s || '', '']);
  while (rows.length < Math.max(8, recs.length)) rows.push(['', '', '', '', '']);
  return { title:'居家指導紀錄表', sub:'促進專業人員與照顧者溝通，確保服務時段以外個案也能自行訓練', big:false, blocks:[
    { t:'kv', cols:2, rows:[['個案姓名', c.name || ''], ['專業人員', thLine()], ['專業人員聯絡電話', me().phone || ''], ['服務指導對象', ep ? [...new Set((ep.goals || []).flatMap(g => g.who || []))].join('、') + (ep.carer?.name ? `（照顧者：${ep.carer.name}）` : '') : '☐個案　☐照顧者：＿＿＿＿　☐居服員　☐其他']] },
    ...(ep?.guideMsg ? [{ t:'p', text:ep.guideMsg }] : []),
    { t:'h', text:`交付練習內容${ep?.sharedAt ? `（${rocDate(ep.sharedAt.slice(0, 10))} 交付）` : ''}` },
    items.length ? { t:'items', items:items.map(x => ({ img:itemImg(x), name:x.name, type:(ep.goals || []).find(g => g.id === x.goalId)?.cat || '', dose:x.dose, freq:x.freq, executor:'', how:x.how, steps:x.steps, caution:x.caution })) } : { t:'p', text:'（以說明或圖示表示，包含執行次數／時間／頻率等注意事項）\n\n\n\n' },
    { t:'h', text:'執行紀錄（案家填寫）' },
    { t:'table', head:['日期', '練習項目', '次數', '案家簽名', '專業人員簽章'], rows, widths:[1.2, 3, 0.8, 1.6, 1.6], center:[0, 2], rowH:9 },
    { t:'p', small:true, text:'備註 1：學習之照顧者應為同一人（組），以達學習成效。備註 2：同一服務目標之居家指導紀錄表應裝訂成同一份，以利檢視學習之照顧者執行情形。以 LINE 等通訊軟體溝通者可免填此表。' }] };
}
function closeDoc(ep){
  const c = cOf(ep), cl = ep.closing || {}, vs = epVisits(ep), goals = (ep.goals || []).filter(g => g.activity), end = cl.date || vs.at(-1)?.date || todayISO();
  const months = ep.startDate ? Math.max(0.5, Math.round(diffDays(ep.startDate, end) / 30.4 * 10) / 10) : '';
  return { title:'結案報告', sub:`${c.name || ''}　${thLine()}`, blocks:[
    { t:'kv', cols:2, rows:[['計畫起訖時間', `${rocDate(ep.startDate)}～${rocDate(end)}`], ['服務總月份', months ? `約 ${months} 個月` : ''], ['服務項目', 'CA07 IADLs 復能、ADLs 復能照護'], ['服務次數', `${vs.length} 次（核定 ${epApproved(ep)} 次）`]] },
    { t:'h', text:'個案表現變化（介入前後）' },
    { t:'table', head:['#', '訓練目標', '介入前', '介入後', '達成情形'], rows:goals.map((g, i) => [String(i + 1), g.text || composeGoal(g), g.pre || '', g.post || '', g.final || '']), widths:[0.4, 5, 0.8, 0.8, 1.2], center:[0, 2, 3, 4], fs:9.5 },
    { t:'kv', cols:1, rows:[['服務期滿之活動表現情形', cl.outcome || ''], ['介入內容', [(ep.guide || []).map(x => x.name).join('、'), cl.process].filter(Boolean).join('\n')], ['結案原因', [cl.reason === '其他' ? cl.other || '其他' : cl.reason, cl.analysis].filter(Boolean).join('：')], ['結案建議（居家練習、轉介）', cl.suggest || ''],
      ['個人層次成效', [cl.sat ? `個案滿意度 ${cl.sat} 分（10 分最滿意）` : '', cl.burden ? `照顧負荷${cl.burden}` : ''].filter(Boolean).join('；')]] },
    { t:'sign', items:['個案或家屬', '專業人員'] }] };
}
function contractDoc(ep){
  const c = cOf(ep), org = Store.DB.meta.orgName || '＿＿＿＿＿＿', n = ep?.groups || '＿＿';
  const P = t => ({ t:'p', text:t });
  return { title:'專業服務合約書', sub:'依衛生福利部長照專業服務操作指引附錄一參考格式', keepSign:true, blocks:[
    P(`個案　${c.name || '＿＿＿＿＿＿'}　同意接受由社區整合型服務中心（A 單位）${ep?.aUnit ? '「' + ep.aUnit + '」' : ''}於　${ep ? rocDate(ep.referDate) : '　　年　　月　　日'}　轉介並委託「${org}」之專業人員　${me().name || '＿＿＿＿'}　所提供之專業服務；並已充分了解執行原則、服務項目、收費標準、暫停服務與結案條件、服務單位義務責任、意見反應及申訴管道，願意遵守，在任何時間有權利停止服務。若已符合結案條件，或出現拒絕配合專業服務練習或執行所教導照顧技巧之情形，經本單位與照管中心或 A 單位確認後，得終止服務。`),
    { t:'h', text:'執行原則' },
    P(`1. 由專業人員依照管中心或 A 單位核定之專業服務項目提供服務，共 ${n} 組，每組 3 次，每次約 50–60 分鐘。必要時經專業人員評估後申請延案，由照管中心核准。\n2. 以復能為導向的專業服務強調短期、密集的介入，同一專業服務目標上限不超過 6 個月或 12 次，以每週服務 1 次為原則。\n3. 進行性退化疾病、特殊照護需求或心智障礙類個案，經照管中心跨專業個案研討會審查後，期程可調整至 1 年內（次數仍以 12 次為上限）。\n4. 同一碼別重啟新目標需間隔 90 天。\n5. 為達學習成效，學習之照顧者應為同一人（組）。`),
    { t:'h', text:'服務項目與收費' },
    P('☑ CA07 IADLs 復能、ADLs 復能照護：3 次訪視（含評估）為 1 給（支）付單位，4,500 元。\n部分負擔：一般戶自付 16%；中低收入戶自付 5%；低收入戶不需自付。超出核定次數或給付金額者，費用由案家完全自付。'),
    { t:'h', text:'暫停服務' },
    P('有下列情形之一者先暫停服務，仍未改善時終止服務：(1) 經婉拒後仍要求從事本契約以外之服務；(2) 對服務人員有言詞侮辱或侵權行為，致其生命、身體、自由、財產有受損害之虞；(3) 案家環境具危險性或其他緊急情況，危險原因消失時即恢復服務。'),
    { t:'h', text:'結案條件（符合任一項即結束服務）' },
    P('(1) 個案習得應用輔具、環境與活動調整技巧，完成訓練目標。(2) 照顧者已習得相關照顧技巧。(3) 同一活動目標經數次（如一組）介入後仍未有明顯進步。(4) 經數次（如一組）介入，個案與照顧者無法配合。(5) 經評估個案已無意願／潛力，或狀況變化致無法繼續。(6) 心智障礙類個案完成階段性目標。'),
    { t:'h', text:'服務單位義務責任' },
    P('依專業法規提供服務；遵循防疫及感控規範；對個案及照顧者隱私負保密責任；依約定時間到達，不無故中斷服務；不得有遺棄、虐待、侵害隱私、推銷販售借貸或巧立名目收費等行為。'),
    { t:'h', text:'意見反應及申訴管道' },
    P(`單位：${org}　電話：${me().phone || '＿＿＿＿＿＿'}\n縣市政府照顧管理中心：1966`),
    { t:'sign', items:['立同意書人', '代理人（與個案關係：　　　）', '專業人員'] }] };
}

/* ================================================================
   示範資料：三位在家的長輩（虛構、去識別化；demo:true，可一鍵清除）
   1. 王○蘭：與女兒同住、居服每週三次；初評 → 再評 → 再評（計畫 v1 → v2 → v3）
   2. 陳○水：輕度失智、外籍看護照顧；初評 → 再評；家屬超過 7 天沒傳回紀錄（示範提醒）
   3. 張○雄：與太太同住、太太擔心扶不動；剛完成到宅評估，計畫還沒傳給家屬
   每個計畫期間都有每天的勾選紀錄（含生活中練習），今天只記錄一部分，方便示範
   ================================================================ */
const DEMO_GUIDE = [
  { id:'dl_c1', stage:'評估 3 次', text:'女兒下班後陪練、居服員週一三五上午陪練。三次評估功能與「最想做到的事」逐步進步，目標從「自己上廁所」延伸到「走去市場買菜」。', tabs:[['assess', '看三次評估趨勢'], ['check', '看每週執行率'], ['export', '看居家練習單']] },
  { id:'dl_c2', stage:'評估 2 次', text:'輕度失智、外籍看護照顧。練習多放在散步、聊天、摺毛巾等生活中；家屬已超過 7 天沒傳回紀錄，首頁會提醒。', tabs:[['assess', '看評估與居家環境'], ['check', '看紀錄'], ['plan', '看生活中練習']] },
  { id:'dl_c3', stage:'剛開立計畫', text:'巴金森、坐輪椅；太太腰不好怕扶不動。評估勾選了床高、夜燈等居家環境問題，系統建議輔具與省力移位；計畫還沒傳給家屬。', tabs:[['assess', '看居家環境評估'], ['plan', '看計畫與傳連結']] },
];
function loadDemo(){
  for (const c of COLLECTIONS) for (const r of Store.DB[c]) if (r.demo && !r.deleted) Store.remove(c, r.id); // 先清掉舊版示範資料
  if (!Store.DB.meta.orgType) Store.setMeta('orgType', '居家');
  if (!Store.DB.meta.homeRole) Store.setMeta('homeRole', '治療師');
  if (!Store.DB.meta.orgName) Store.setMeta('orgName', '示範居家復能團隊（資料皆為虛構）');
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const T = todayISO(), ago = n => addDays(T, -n), put = (c, o) => Store.upsert(c, { ...o, demo:true }), iso = n => new Date(Date.now() - n * 864e5).toISOString();
  const keys = BARTHEL.map(x => x.k);
  const C = [
    { id:'dl_c1', name:'王○蘭', gender:'女', birth:'1942-03-15', diagnosis:'腦中風（右側偏癱）、高血壓', aids:'四腳拐', caution:'右肩疼痛，勿拉扯右手', status:'服務中', consentDate:ago(170) },
    { id:'dl_c2', name:'陳○水', gender:'男', birth:'1938-08-02', diagnosis:'輕度失智症、高血壓', aids:'助行器', caution:'午後易焦躁，外出需有人陪', status:'服務中', consentDate:ago(100) },
    { id:'dl_c3', name:'張○雄', gender:'男', birth:'1950-11-20', diagnosis:'巴金森氏症、姿勢性低血壓', aids:'輪椅（短距離助行器）', caution:'起身前先坐 30 秒', status:'服務中' },
  ];
  C.forEach(c => put('clients', c));
  const mkA = (c, o) => {
    const a = { clientId:c.id, assessor:'林○君', role:'物理治療師', iadl:{}, spmsq:{ items:Array(10).fill(''), edu:'' }, pain:{}, physio:'', strength:'', expect:'', summary:'', env:{}, care:{}, ...o, adl:Object.fromEntries(keys.map((k, i) => [k, o.adl[i]])) };
    const sg = suggestFromAssessment(a, c); a.problemSel = Object.fromEntries(sg.map(s => [s.code, true])); a.problems = sg; a.customProblems = '';
    return put('assessments', a);
  };
  const it = (id, ex, o = {}) => ({ ...mkItem(ex), id, ...o });
  const rt = (type, who, days, note) => ({ type, freq:'', note:note || routineHow(type), who, days:days || [1, 2, 3, 4, 5, 6, 7] });
  const review = (pl, gid, gas, current, note) => { const g = pl.goals.find(x => x.id === gid); return { goalId:gid, planId:pl.id, activity:g.activity, text:g.text, measure:'', baseline:g.baseline, target:g.target, current, gas, note }; };
  // 紀錄者依執行者：家屬、居服員、看護、長輩自己；時間錯開（上午練習、下午生活中）
  const BY = { '家屬':'王○琪（女兒）', '居家服務員':'黃○英（居服員）', '外籍看護':'Siti（看護）', '長輩自己':'長輩自己', '治療師':'林○君（治療師）' };
  const byFor = (p, x) => p.clientId === 'dl_c2' && /家屬|外籍看護/.test(x.executor || x.who || '') ? 'Siti（看護）' : p.clientId === 'dl_c3' && /家屬/.test(x.executor || x.who || '') ? '李○美（太太）' : BY[x.executor || x.who] || BY['家屬'];
  const ck = (p, x, d, i, status) => { const r = put('checks', { clientId:p.clientId, planId:p.id, itemId:x.id, date:d, status, by:byFor(p, x) }); const m = x.group ? 960 + i * 7 : 570 + i * 17; r.updatedAt = new Date(`${d}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`).toISOString(); };
  // 每日勾選：完成率隨時間提高（base→top）；只填到 until（之後代表家屬還沒傳回）
  const fill = (p, from, to, base, top, until = T) => {
    const span = Math.max(1, diffDays(from, to));
    for (let d = from; d <= to && d < until; d = addDays(d, 1)) checkables(p).forEach((x, i) => {
      if (!scheduled(p, x, d) || rnd() < 0.05) return;
      const okP = Math.min(0.95, base + (top - base) * diffDays(from, d) / span + (x.group ? 0.08 : 0)), r = rnd();
      ck(p, x, d, i, r < okP ? 'ok' : r < okP + (1 - okP) * 0.6 ? 'part' : 'skip');
    });
  };
  // 今天只記錄約一半（上午已做），其餘留給使用者試點
  const fillToday = p => { const its = checkables(p).filter(x => scheduled(p, x, T)); its.forEach((x, i) => { if (i % 2 === 0) ck(p, x, T, i, i === 2 ? 'part' : 'ok'); }); };
  const notes = (p, list) => list.forEach(([d, n]) => put('weekNotes', { planId:p.id, clientId:p.clientId, week:weekStart(ago(d)), note:n, by:'家屬' }));

  /* ---------- 1. 王○蘭：與女兒同住；初評 → 再評 → 再評 ---------- */
  const W = C[0], wTxt = { physio:'右側偏癱，右手精細動作差；血壓穩定。住公寓 3 樓有電梯。', strength:'喜歡唱老歌、畫畫，個性積極。', expect:'女兒希望媽媽能自己上廁所，不要包尿布。', pain:{ nrs:3, site:'右肩' },
    care:{ carer:'子女', hours:'每週 6–10 小時', day:'居服員（週一三五上午）、女兒下班後', time:'晚飯後 20 分鐘', worry:'怕她跌倒' } };
  const w1 = mkA(W, { ...wTxt, date:ago(170), type:'初評', adl:[10, 10, 5, 0, 0, 10, 5, 5, 10, 10],
    phy:{ tug:24, cs30:5, note:'使用四腳拐' }, env:{ bathSlip:true, toiletBar:true, threshold:true, night:true },
    copm:[{ activity:'自己上廁所', area:'自我照顧', imp:10, perf:2, sat:2 }, { activity:'自己走去市場買菜', area:'自我照顧', imp:8, perf:1, sat:1 }, { activity:'畫畫', area:'休閒', imp:6, perf:4, sat:3 }],
    summary:'如廁需他人協助、下肢肌力與平衡不足、跌倒風險高；浴室濕滑、馬桶無扶手。先以如廁自立為首要目標，並調整浴廁環境。' });
  const wp1 = put('plans', { id:'dl_p1', clientId:W.id, assessmentId:w1.id, version:1, status:'已結束', startDate:ago(168), endDate:ago(87), author:'林○君', role:'物理治療師', problems:[], sharedAt:iso(168), lastReturn:iso(88),
    goals:[newGoal({ id:'g1', activity:'自己上廁所', when:'12 週內', how:'扶著馬桶旁的扶手', assist:'在旁人監督下（不需碰觸）', scene:'白天自己去廁所，不再需要包尿布', measure:'每天 3 次中有 2 次成功', baseline:'需女兒扶持並協助拉褲子（自評表現 2/10）' }),
      newGoal({ id:'g2', activity:'自己走去市場買菜', when:'12 週內', how:'使用四腳拐', assist:'在旁人監督下（不需碰觸）', scene:'從臥室走到餐桌，和女兒一起吃晚飯', measure:'中途不休息', baseline:'室內走 10 公尺就要休息（自評表現 1/10）' })],
    items:[it('i1', 'sit-to-stand', { dose:'5 下 × 2 組', executor:'家屬' }), it('i2', 'single-leg-stance-supported', { executor:'居家服務員', days:[1, 3, 5] }), it('i3', 'toilet-transfer', { times:2, executor:'家屬' }), it('i5', 'forward-walking-line', { executor:'治療師', days:[2], dose:'10 公尺 × 2 趟' })],
    groups:[rt('上廁所時', '家屬'), rt('看電視時', '長輩自己'), rt('興趣時間', '家屬', [6, 7], '週末和孫女一起畫畫 20 分鐘')],
    devices:['馬桶扶手架', '防滑措施', '感應夜燈與大面板開關'], note:'居家環境調整：浴室鋪止滑墊或貼止滑條；加裝馬桶扶手或增高座；門檻貼醒目膠帶或加斜坡板；臥室到廁所裝感應夜燈' });
  fill(wp1, wp1.startDate, wp1.endDate, 0.45, 0.7);
  notes(wp1, [[160, '右肩痛，扶桌單腳站常只做一半；上廁所還需要幫忙拉褲子。'], [130, '坐站可以做滿 5 下，偶爾頭暈要休息。'], [100, '馬桶扶手裝好了，可以自己坐上馬桶。']]);
  const w2 = mkA(W, { ...wTxt, date:ago(86), type:'再評', adl:[10, 10, 5, 5, 0, 10, 5, 10, 10, 10],
    phy:{ tug:19.5, cs30:7, note:'使用四腳拐' }, env:{ threshold:true },
    copm:[{ activity:'自己上廁所', area:'自我照顧', imp:10, perf:5, sat:5 }, { activity:'自己走去市場買菜', area:'自我照顧', imp:8, perf:2, sat:2 }, { activity:'畫畫', area:'休閒', imp:6, perf:5, sat:4 }],
    goalReview:[review(wp1, 'g1', -1, '監督下可坐上馬桶，拉褲子仍需少量協助', '有進步，尚未達成'), review(wp1, 'g2', 0, '可從臥室走到餐桌，中途不休息', '達成')],
    summary:'坐站、TUG 進步；浴室止滑、馬桶扶手、夜燈已完成。室內步行目標達成，往社區延伸；如廁仍需少量協助。' });
  const wp2 = put('plans', { id:'dl_p1b', clientId:W.id, assessmentId:w2.id, version:2, copyOf:wp1.id, status:'已結束', startDate:ago(85), endDate:ago(3), author:'林○君', role:'物理治療師', problems:[], sharedAt:iso(85), lastReturn:iso(4),
    goals:[newGoal({ id:'g1', activity:'自己上廁所', when:'12 週內', how:'扶著馬桶旁的扶手', assist:'在旁人監督下（不需碰觸）', scene:'白天自己去廁所，不再需要包尿布', measure:'每天 3 次中有 2 次成功', baseline:'拉褲子仍需少量協助（自評表現 5/10）' }),
      newGoal({ id:'g2b', activity:'自己走去市場買菜', when:'12 週內', how:'使用四腳拐', assist:'在旁人監督下（不需碰觸）', scene:'從家門口走到巷口便利商店（約 100 公尺）買早餐', measure:'中途休息不超過 1 次', baseline:'可在室內走 30 公尺（自評表現 2/10）' })],
    items:[it('i1', 'sit-to-stand', { dose:'8 下 × 2 組', executor:'家屬' }), it('i2', 'single-leg-stance-supported', { executor:'居家服務員', days:[1, 3, 5] }), it('i3', 'toilet-transfer', { times:2, executor:'長輩自己' }), it('i10', 'adl_dress', { executor:'居家服務員', days:[1, 3, 5] }), it('i5', 'forward-walking-line', { executor:'治療師', days:[2], dose:'30 公尺 × 2 趟' })],
    groups:[rt('上廁所時', '長輩自己'), rt('看電視時', '長輩自己'), rt('散步、外出時', '家屬', [6, 7], '週末和女兒走到巷口，再走回家'), rt('興趣時間', '家屬', [6, 7], '週末和孫女一起畫畫 20 分鐘')],
    devices:['防滑措施'], note:'居家環境調整：門檻貼醒目膠帶或加斜坡板' });
  fill(wp2, wp2.startDate, wp2.endDate, 0.6, 0.85);
  notes(wp2, [[70, '上廁所已經可以自己拉褲子，女兒只在旁邊看。'], [42, '週末走到巷口來回，中途休息 1 次。'], [14, '這週全部都做完，媽媽說想自己去便利商店買早餐。']]);
  const w3 = mkA(W, { ...wTxt, pain:{ nrs:2, site:'右肩' }, date:ago(2), type:'再評', adl:[10, 10, 5, 10, 0, 15, 5, 10, 10, 10],
    phy:{ tug:15.8, cs30:9, note:'使用四腳拐' }, physio:'右側偏癱，右手精細動作進步；血壓穩定。', env:{},
    copm:[{ activity:'自己上廁所', area:'自我照顧', imp:10, perf:7, sat:8 }, { activity:'自己走去市場買菜', area:'自我照顧', imp:8, perf:5, sat:5 }, { activity:'畫畫', area:'休閒', imp:6, perf:6, sat:6 }],
    goalReview:[review(wp2, 'g1', 1, '監督下可自行完成如廁，每天 3 次都成功', '已達成，略優於目標'), review(wp2, 'g2b', 0, '可走到巷口便利商店，中途休息 1 次', '達成')],
    summary:'如廁目標達成，改為維持；三次評估巴氏 65 → 75 → 85、TUG 24 → 19.5 → 15.8 秒。目標延伸到市場買菜，並加入畫畫的生活目標。' });
  const wp3 = put('plans', { id:'dl_p1c', clientId:W.id, assessmentId:w3.id, version:3, copyOf:wp2.id, status:'執行中', startDate:ago(1), endDate:addDays(ago(1), 83), author:'林○君', role:'物理治療師', problems:[], sharedAt:iso(1),
    goals:[newGoal({ id:'g2c', activity:'自己走去市場買菜', when:'12 週內', how:'使用四腳拐', assist:'可獨立', scene:'從家門口走到巷口市場，買一小袋菜回家煮給女兒吃', measure:'中途休息不超過 1 次', baseline:'可走到便利商店，中途休息 1 次（自評表現 5/10）' }),
      newGoal({ id:'g3', activity:'畫畫', when:'8 週內', how:'使用加粗握柄的畫筆', assist:'可獨立', scene:'用右手畫一張生日賀卡送給孫女', measure:'完成 1 件作品', baseline:'右手握筆 5 分鐘就累，作品要別人幫忙完成（自評表現 6/10）' })],
    items:[it('i1', 'sit-to-stand', { dose:'10 下 × 3 組', executor:'長輩自己' }), it('i6', 'tandem-stance', { executor:'居家服務員', days:[1, 3, 5] }), it('i7', 'carry-light-object-walk', { executor:'家屬' }), it('i8', 'walking-program', { executor:'治療師', days:[2], dose:'10 分鐘' }), it('i9', 'grip-towel', { executor:'長輩自己' })],
    groups:[rt('散步、外出時', '家屬', null, '每天晚飯前和女兒走到巷口，提一小袋東西回家'), rt('看電視時', '長輩自己'), rt('興趣時間', '長輩自己', null, '用加粗握柄的畫筆塗色 15 分鐘')],
    devices:['防滑措施'], note:'如廁目標已達成，改為維持；新增持物步行為上市場做準備。' });
  fill(wp3, wp3.startDate, T, 0.75, 0.8); fillToday(wp3);

  /* ---------- 2. 陳○水：輕度失智、外籍看護照顧；初評 → 再評 ---------- */
  const K = C[1], kTxt = { physio:'夜尿 2–3 次，聽力稍差。住透天一樓。', strength:'喜歡下象棋、聊以前務農的事。', expect:'兒子希望爸爸維持走路能力、不要走失。', spmsq:{ items:['c', 'c', 'x', 'c', 'x', 'c', 'x', 'x', 'c', 'x'], edu:'low' },
    care:{ carer:'外籍看護', hours:'無', day:'外籍看護 Siti', time:'上午散步時、午餐後', worry:'怕他自己出門走失' } };
  const k1 = mkA(K, { ...kTxt, assessor:'陳○宏', role:'職能治療師', date:ago(100), type:'初評', adl:[10, 15, 5, 10, 0, 10, 5, 10, 10, 5],
    phy:{ tug:15.2, cs30:9 }, env:{ night:true, clutter:true },
    copm:[{ activity:'和朋友下象棋', area:'休閒', imp:9, perf:'', sat:'' }, { activity:'自己去公園散步', area:'休閒', imp:'', perf:'', sat:'' }],
    summary:'下肢肌力尚可，平衡與定向感需維持；夜間走道暗、客廳堆雜物。無法穩定自評分數，最想做到的事只記錄活動。' });
  const kp1 = put('plans', { id:'dl_p2', clientId:K.id, assessmentId:k1.id, version:1, status:'已結束', startDate:ago(98), endDate:ago(15), author:'陳○宏', role:'職能治療師', problems:[], sharedAt:iso(98), lastReturn:iso(16),
    goals:[newGoal({ id:'g4', activity:'自己去公園散步', when:'12 週內', how:'使用助行器', assist:'在旁人監督下（不需碰觸）', scene:'從家門口走到巷口公園，和老朋友打招呼再走回家', measure:'每週 3 次、自己找到回家的路', baseline:'需陪同並提示方向' }),
      newGoal({ id:'g5', activity:'和朋友下象棋', when:'8 週內', how:'', assist:'在口頭提示下', scene:'在公園涼亭和老朋友下完一盤象棋', measure:'每週 2 次、全程參與', baseline:'下到一半會忘記輪到誰' })],
    items:[it('i20', 'sit-to-stand', { dose:'10 下 × 2 組', executor:'外籍看護' }), it('i21', 'standing-weight-shift', { executor:'外籍看護' }), it('i23', 'walking-program', { executor:'外籍看護', dose:'到公園來回約 15 分鐘' })],
    groups:[rt('散步、外出時', '外籍看護', null, '上午到巷口公園，讓長輩自己帶路回家'), rt('聊天時', '家屬', [6, 7], '週末兒子回來，一起看老照片、聊以前種田的事'), rt('做家務時', '外籍看護', [1, 3, 5], '一起摺衣服，讓長輩負責摺毛巾')],
    devices:['防走失定位裝置', '感應夜燈與大面板開關'], note:'居家環境調整：臥室到廁所裝感應夜燈；清出走道、固定電線、移除小地毯' });
  fill(kp1, kp1.startDate, kp1.endDate, 0.5, 0.75);
  notes(kp1, [[80, '下午比較焦躁，散步改到上午後配合度變好。'], [45, '象棋可以下完一盤，需要提醒輪到誰。'], [20, '散步回程在路口會猶豫，需要提示方向。']]);
  const k2 = mkA(K, { ...kTxt, assessor:'陳○宏', role:'職能治療師', date:ago(14), type:'再評', adl:[10, 15, 5, 10, 0, 10, 5, 10, 10, 5],
    phy:{ tug:13.8, cs30:10 }, env:{},
    copm:[{ activity:'和朋友下象棋', area:'休閒', imp:9, perf:'', sat:'' }, { activity:'自己去公園散步', area:'休閒', imp:'', perf:'', sat:'' }, { activity:'幫家人摺毛巾', area:'生產活動', imp:'', perf:'', sat:'' }],
    goalReview:[review(kp1, 'g4', -1, '可走到公園，回程路口需提示方向', '有進步，尚未達成'), review(kp1, 'g5', 0, '每週下 2 盤，全程參與', '達成')],
    summary:'體能維持並略進步（TUG 15.2 → 13.8 秒）；夜燈與走道已改善。象棋目標達成改為維持，散步延續並增加路口辨識，新增「幫家人摺毛巾」的生活角色。' });
  const kp2 = put('plans', { id:'dl_p2b', clientId:K.id, assessmentId:k2.id, version:2, copyOf:kp1.id, status:'執行中', startDate:ago(13), endDate:addDays(ago(13), 83), author:'陳○宏', role:'職能治療師', problems:[], sharedAt:iso(13), lastReturn:iso(10),
    goals:[newGoal({ id:'g4', activity:'自己去公園散步', when:'12 週內', how:'使用助行器，路口貼上記號', assist:'在旁人監督下（不需碰觸）', scene:'從家門口走到巷口公園，和老朋友打招呼再走回家', measure:'每週 3 次、自己找到回家的路', baseline:'回程路口需提示方向' }),
      newGoal({ id:'g7', activity:'幫家人摺毛巾', when:'8 週內', how:'', assist:'在口頭提示下', scene:'午餐後幫家人摺好全家的毛巾，放回浴室', measure:'每週 3 次、摺完 10 條', baseline:'摺 3 條就分心' })],
    items:[it('i20', 'sit-to-stand', { dose:'10 下 × 2 組', executor:'外籍看護' }), it('i21', 'standing-weight-shift', { executor:'外籍看護' }), it('i22', 'cloth-folding', { executor:'外籍看護', days:[1, 3, 5] }), it('i23', 'walking-program', { executor:'外籍看護', dose:'到公園來回約 15 分鐘' })],
    groups:[rt('散步、外出時', '外籍看護', null, '上午到巷口公園，路口讓長輩自己認記號、帶路回家'), rt('聊天時', '家屬', [6, 7], '週末兒子回來，一起看老照片、聊以前種田的事')],
    devices:['防走失定位裝置'] });
  fill(kp2, kp2.startDate, T, 0.7, 0.8, ago(10));   // 10 天前之後家屬還沒傳回 → 首頁提醒
  notes(kp2, [[12, '摺毛巾可以摺 6 條，會主動問還有沒有。']]);

  /* ---------- 3. 張○雄：與太太同住；剛完成到宅評估，計畫還沒傳給家屬 ---------- */
  const Z = C[2];
  const z1 = mkA(Z, { date:ago(6), type:'初評', adl:[5, 5, 0, 5, 0, 5, 0, 5, 10, 10],
    phy:{ tug:28, cs30:4, note:'無法單腳站與前後腳站' }, pain:{ nrs:2, site:'下背' }, env:{ bed:true, chair:true, night:true, showerSeat:true },
    care:{ carer:'配偶', hours:'每週 1–5 小時', day:'太太', time:'午餐、晚餐前', worry:'腰不好，怕扶不動他' },
    physio:'步態小碎步、起步困難；起身易頭暈；吞嚥偶嗆咳。床太低、常坐的沙發太軟。', strength:'以前是木工，手很巧。', expect:'太太希望他能自己移位，減輕照顧負擔。',
    copm:[{ activity:'自己從輪椅移到椅子', area:'自我照顧', imp:9, perf:3, sat:2 }, { activity:'做木工小物', area:'休閒', imp:6, perf:2, sat:3 }],
    summary:'移位與行走需中度協助，跌倒風險極高；床與沙發太低軟、夜間昏暗。以安全移位為優先，教太太省力的協助方式。' });
  const zp = put('plans', { id:'dl_p3', clientId:Z.id, assessmentId:z1.id, version:1, status:'執行中', startDate:ago(4), endDate:addDays(ago(4), 83), author:'林○君', role:'物理治療師', problems:[],
    goals:[newGoal({ id:'g6', activity:'自己從輪椅移到椅子', when:'12 週內', how:'先坐 30 秒再起身，扶著椅子扶手', assist:'在少量協助下', scene:'從輪椅移到餐桌椅子上，和太太一起吃晚飯', measure:'每天午餐、晚餐各 1 次', baseline:'需中度協助（自評表現 3/10）' })],
    items:[it('i14', 'sit-pivot-transfer', { times:2, executor:'家屬' }), it('i15', 'sit-to-stand', { dose:'5 下 × 2 組', caution:'起身前先坐 30 秒，頭暈即停', executor:'居家服務員', days:[2, 4] }), it('i16', 'wc_brake', { executor:'長輩自己' }), it('i17', 'oral_exercise', { executor:'長輩自己' })],
    groups:[rt('起床後', '家屬'), rt('吃飯時', '長輩自己'), rt('興趣時間', '長輩自己', [1, 3, 5], '坐在桌前做小木工或砂紙打磨 20 分鐘')],
    devices:['移位腰帶與人力移位吊帶', '移位滑板', '床邊扶手與起身拉繩', '洗澡椅'], note:'居家環境調整：床高調到坐著時膝蓋約 90 度，床邊加扶手；換成有扶手、坐面較硬的椅子；臥室到廁所裝感應夜燈；改坐洗澡椅洗澡' });
  fill(zp, zp.startDate, T, 0.4, 0.5); fillToday(zp);

  for (const pl of Store.all('plans').filter(x => x.demo)) { pl.problems = planProblemsFor(Store.get('assessments', pl.assessmentId), pl.goals).map(x => x.text); Store.upsert('plans', pl); }
  Store.flush(); renderShell(); toast('已載入 3 個居家模擬個案'); App.go('#/'); route();
}
function demoGuideHTML(){
  if (!Store.all('clients').some(c => c.demo)) return '';
  return `<section class="card guide"><h2>示範導覽 <small>三個模擬個案停在流程的不同階段，點按鈕直接看該步驟</small></h2>
    <div class="guide-grid">${DEMO_GUIDE.map((g, i) => { const c = Store.get('clients', g.id); if (!c) return ''; return `<div class="guide-c"><div class="gc-top"><span class="sn">${i + 1}</span><b>${esc(c.name)}</b>${badge(g.stage, 'green')}</div><small>${esc(c.diagnosis)}</small><p>${esc(g.text)}</p><div class="btn-row">${g.tabs.map(([t, l]) => `<a class="btn sm" href="#/client/${c.id}/${t}">${l}</a>`).join('')}</div></div>`; }).join('')}</div>
    <p class="hint">「今日練習」可依「誰來陪練」篩選；個案頁的「傳家人版連結」可以預覽家屬手機上看到的畫面。看完到「個案名冊」按「清除模擬個案」即可開始正式使用。</p></section>`;
}

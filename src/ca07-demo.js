/* ================================================================
   示範資料：三位居家復能個案（虛構、去識別化；demo:true，可一鍵清除）
   1. 王○德：右側中風，第二組進行中（已訪 4 次），案家每週回填
   2. 陳○妹：左髖骨折術後，剛初評，目標只寫了 2 項、有一項缺要素（示範提醒）
   3. 林○珠：巴金森，3 天前結案，結案報告還沒登錄（示範 7 個工作天期限）
   ================================================================ */
function loadDemo(){
  for (const c of COLLECTIONS) for (const r of Store.DB[c]) if (r.demo && !r.deleted) Store.remove(c, r.id);
  if (!Store.DB.meta.orgName) Store.setMeta('orgName', '示範居家復能團隊（資料皆為虛構）');
  if (!Store.DB.meta.therapist?.name) Store.setMeta('therapist', { name:'林○君', title:'職能治療師', phone:'' });
  Store.setMeta('setupDone', true);
  const T = todayISO(), ago = n => addDays(T, -n), put = (c, o) => Store.upsert(c, { ...o, demo:true });
  const G = (o) => { const g = { id:'g' + Math.random().toString(36).slice(2, 8), subject:'個案', when:'12 週內', assist:'在旁人監督下', short:'', whoOther:'', post:'', ...o }; g.text = composeGoal(g); return g; };
  const lib = (id, o = {}) => { const e = findItem(id); return { id:'gd' + Math.random().toString(36).slice(2, 8), exId:id, name:e.name, dose:e.dose, freq:'每天', how:e.how, steps:e.steps, caution:e.caution, img:e.img, goalId:'', ...o }; };

  /* ---------- 1. 王○德 ---------- */
  put('clients', { id:'dm_c1', name:'王○德', callName:'王伯伯', gender:'男', birth:'1946-05-12', dx:'右側中風（左側無力）、高血壓', cms:'第5級', phone:'' });
  const g1 = [G({ cat:'上廁所', activity:'白天自己走到浴室上廁所', how:'使用四腳拐並扶著馬桶旁扶手', measure:'一天至少 4 次', who:['個案', '個案家屬'], pre:3, short:'4 週內，能抓床邊扶手自己坐起並站到床邊，不需家屬扶持' }),
    G({ cat:'移位', when:'8 週內', activity:'自己從床上坐起並站起', how:'抓床邊扶手、床加高到膝蓋高度', assist:'可獨立', measure:'每天起床時，連續 2 週', who:['個案', '個案家屬'], pre:4 }),
    G({ cat:'走路', activity:'從臥室走到客廳看電視', how:'使用四腳拐，走道移除地上電線', measure:'每天至少 3 趟，期間沒有跌倒', who:['個案', '個案家屬'], pre:3 })];
  const gd1 = [lib('toilet-transfer', { dose:'坐下站起 5 次', freq:'每天上午、下午各 1 回', goalId:g1[0].id }), lib('sit-to-stand', { dose:'10 下 × 2 組', freq:'每天早晚', goalId:g1[1].id }), lib('walking-program', { dose:'臥室到客廳來回 1 趟', freq:'每天 3 次', goalId:g1[2].id }),
    { id:'gd_c1x', exId:'', name:'白天每 2 小時走去廁所一次', dose:'家屬在旁邊看，不要扶', freq:'白天', how:'用四腳拐走到浴室，扶馬桶旁扶手坐下、站起。家屬站在左後方，只在快失去平衡時才出手。', steps:'', caution:'地上保持乾燥；晚上改用床邊便盆椅', img:'', goalId:g1[0].id }];
  const ep1 = put('episodes', { id:'dm_e1', clientId:'dm_c1', code:'CA07', status:'服務中', referDate:ago(33), startDate:ago(28), groups:2, freq:'每週 1 次', caseMgr:'陳個管', aUnit:'○○社區整合型服務中心',
    problems:['上廁所問題', '移位問題', '走路問題', '跌倒風險'], nhi:'無', serviceGoal:'王伯伯希望白天可以自己走去浴室上廁所，不用再穿尿布、也不用每次叫媳婦扶（3 個月內）。',
    carer:{ name:'王○芳', rel:'媳婦', type:'個案家屬', time:'早餐後、午睡起來', skill:'轉位時協助過多，會整個抱起；學習意願高' },
    assess:{ complaint:'不想一直包尿布，想自己去廁所', dx:'110 年右側中風；高血壓服藥控制', history:'糖尿病（口服藥）', ability:'床上翻身坐起需少量協助；使用四腳拐室內短距離行走需一人扶持；目前白天包尿布', mind:'認知清楚可配合指令；擔心跌倒', special:'無', env:'透天厝一樓臥室，到浴室約 8 公尺；浴室門檻約 3 公分；馬桶旁已裝扶手；走道有延長線', family:'與兒子、媳婦同住，白天媳婦在家',
      pri:[{ act:'自己走去廁所', imp:10, perf:3, sat:2 }, { act:'自己下床', imp:8, perf:4, sat:4 }, { act:'到客廳看電視', imp:6, perf:3, sat:3 }], pot:{ learn:'佳', stable:'佳', motive:'佳', coop:'佳' }, summary:'個案有強烈意願自己如廁，主要困難為床邊坐站與行走平衡、害怕跌倒；照顧者協助過多。環境：走道延長線需移除。',
      adl:{ feeding:10, transfer:10, grooming:5, toilet:5, bathing:0, mobility:10, stairs:0, dressing:5, bowel:10, bladder:5 } },
    goals:g1, guide:gd1, guideMsg:'王伯伯這週進步很多！請芳姐白天每 2 小時提醒伯伯自己走去廁所，站在旁邊看就好，不用扶。', sharedAt:new Date(Date.now() - 7 * 864e5).toISOString() });
  const V = (n, d, o) => put('visits', { id:'dm_v1' + n, episodeId:'dm_e1', clientId:'dm_c1', date:ago(d), start:'14:00', end:'15:00', who:['個案', '個案家屬'], carerName:'王○芳', ...o });
  const st = (a, b, c) => ({ [g1[0].id]:a, [g1[1].id]:b, [g1[2].id]:c });
  V(1, 28, { status:{}, gnote:{}, content:{ follow:'初次訪視', finding:'媳婦轉位時整個抱起，個案沒有出力的機會；走道有延長線', scene:'於臥室床邊與浴室實際走一趟', perf:'抓床邊扶手坐起需少量協助；扶四腳拐走到浴室需一人扶持，約 3 分鐘', why:'', next:'與個案及家屬確認訓練目標與結案條件；下次教導床邊坐站' },
    advice:{ act:'說明服務內容、目標與結案條件；示範床邊坐起的正確協助方式', caution:'走道延長線改沿牆固定；練習時旁邊要有人', homework:'1.坐到站訓練：10 下 × 2 組，每天早晚' } });
  V(2, 21, { status:st('未達成', '部分達成', '未達成'), gnote:{ [g1[1].id]:'抓扶手可自行坐起，站起時需口頭提示身體前傾' }, content:{ follow:'案家回報一週練習 5 天；延長線已移除', finding:'個案站起時重心太後面', scene:'於臥室床邊實際練習', perf:'', why:'床加高後站起較省力', next:'下次練習扶馬桶扶手坐下站起' },
    advice:{ act:'床腳墊高約 5 公分；示範並請媳婦回覆示教「只在旁邊看、快倒才扶」', caution:'站起後先站穩數到 5 再走', homework:'1.坐到站訓練：10 下 × 2 組，每天早晚\n2.馬桶轉位練習：坐下站起 5 次，每天上午、下午各 1 回' } });
  V(3, 14, { status:st('部分達成', '部分達成', '部分達成'), gnote:{ [g1[0].id]:'白天可在監督下走到浴室如廁 2 次，其餘仍穿尿布', [g1[1].id]:'早上起床可自己坐起站起，下午疲累時需少量扶持', [g1[2].id]:'可在監督下走到客廳 1 趟' }, content:{ follow:'案家回報練習 6 天；媳婦已能改為從旁監督', finding:'下午疲累時步態變慢', scene:'模擬日常時段，從臥室走到浴室如廁一次', perf:'', why:'照顧者改為從旁監督後，個案主動性提升', next:'下次加入「白天每 2 小時如廁」的作息練習' },
    advice:{ act:'建立固定如廁時間表貼在床頭；教導轉身坐下的步驟', caution:'下午練習前先休息；頭暈要立即坐下', homework:'1.馬桶轉位練習：坐下站起 5 次，每天上午、下午各 1 回\n2.室內步行計畫：臥室到客廳來回 1 趟，每天 3 次\n3.白天每 2 小時走去廁所一次' } });
  V(4, 7, { status:st('部分達成', '達成', '部分達成'), gnote:{ [g1[0].id]:'白天可在監督下自己走到浴室如廁 3 次', [g1[1].id]:'連續一週每天早上自己坐起站起，不需扶持', [g1[2].id]:'可在監督下走到客廳 2 趟，無跌倒' }, content:{ follow:'案家回報 7 天都有練習；白天尿布改為只在外出時穿', finding:'轉身坐下馬桶時偶有重心不穩', scene:'於浴室實際操作如廁全程', perf:'', why:'固定時間表讓個案與家屬都容易執行', next:'下次練習轉身與穿脫褲子' },
    advice:{ act:'示範轉身時先用四腳拐跨小步、手扶扶手再坐下', caution:'浴室地面保持乾燥、穿防滑鞋', homework:'1.馬桶轉位練習：坐下站起 5 次，每天上午、下午各 1 回\n2.室內步行計畫：臥室到客廳來回 1 趟，每天 3 次\n3.白天每 2 小時走去廁所一次' } });
  const rec = []; for (let d = 6; d >= 1; d--) { rec.push({ date:ago(d), itemId:gd1[0].id, times:2 }, { date:ago(d), itemId:gd1[3].id, times:d % 3 ? 4 : 3 }); if (d % 2) rec.push({ date:ago(d), itemId:gd1[2].id, times:3 }); }
  put('returns', { episodeId:'dm_e1', clientId:'dm_c1', signer:'王○芳（媳婦）', recs:rec, receivedAt:new Date(Date.now() - 864e5).toISOString() });

  /* ---------- 2. 陳○妹 ---------- */
  put('clients', { id:'dm_c2', name:'陳○妹', callName:'陳奶奶', gender:'女', birth:'1940-09-03', dx:'左髖骨折術後（人工髖關節）', cms:'第4級' });
  put('episodes', { id:'dm_e2', clientId:'dm_c2', code:'CA07', status:'服務中', referDate:ago(9), startDate:ago(5), groups:1, freq:'每週 1 次', caseMgr:'李個管', aUnit:'○○社區整合型服務中心', problems:['洗澡問題', '穿脫衣物問題', '跌倒風險'], nhi:'有', nhiNote:'○○醫院復健科，W2.5 物理治療',
    serviceGoal:'陳奶奶希望可以自己洗澡、自己穿褲子，不用麻煩女兒（2 個月內）。', carer:{ name:'陳○玲', rel:'女兒', type:'個案家屬', time:'晚上', skill:'擔心奶奶跌倒，洗澡都幫忙完成' },
    assess:{ complaint:'洗澡和穿褲子都要女兒幫忙，覺得很不好意思', ability:'助行器室內行走可獨立；洗澡需他人協助；穿褲子需他人協助穿過腳', env:'公寓有電梯；浴室無扶手、無洗澡椅；浴室門檻約 5 公分', family:'獨居，女兒每天晚上來', pri:[{ act:'自己洗澡', imp:9, perf:2, sat:2 }, { act:'自己穿褲子', imp:8, perf:4, sat:3 }, {}], pot:{ learn:'佳', stable:'佳', motive:'佳', coop:'普通' } },
    goals:[G({ cat:'洗澡', when:'8 週內', activity:'自己洗身體前側與雙手', how:'坐在洗澡椅上並使用長柄刷，浴室加裝扶手', measure:'每週至少 3 次', who:['個案', '個案家屬'], pre:2 }), G({ cat:'穿脫衣物', when:'8 週內', activity:'自己穿脫褲子', how:'', assist:'在口頭提示或事前準備下', measure:'', who:['個案'], pre:4 })], guide:[] });
  put('visits', { id:'dm_v21', episodeId:'dm_e2', clientId:'dm_c2', date:ago(5), start:'19:00', end:'20:00', who:['個案', '個案家屬'], carerName:'陳○玲', status:{}, gnote:{},
    content:{ follow:'初次訪視', finding:'浴室無扶手與洗澡椅；女兒擔心跌倒而替個案完成', scene:'於浴室模擬進出與坐下', perf:'扶牆可跨過門檻；無法彎腰洗下肢', why:'', next:'建議購置洗澡椅、加裝扶手；下次練習穿褲子' }, advice:{ act:'說明服務內容、目標與結案條件；說明髖關節術後動作禁忌', caution:'彎腰不超過 90 度、雙腳不交叉', homework:'' } });

  /* ---------- 3. 林○珠（已結案） ---------- */
  put('clients', { id:'dm_c3', name:'林○珠', callName:'林阿嬤', gender:'女', birth:'1944-12-20', dx:'巴金森氏症', cms:'第6級' });
  const g3 = [G({ cat:'移位', activity:'從椅子上站起來', how:'椅子加高並有扶手，數「1、2、3」口令', measure:'一天至少 5 次', who:['個案', '外籍家庭看護工'], pre:3, post:7, final:'達成' }),
    G({ cat:'進食(含吞嚥)', when:'8 週內', activity:'自己吃完午、晚兩餐', how:'使用加重湯匙與防滑碗，坐在餐桌前', measure:'吃完碗內八成飯菜，過程中不嗆咳', who:['個案', '外籍家庭看護工'], pre:4, post:7, final:'達成' }),
    G({ cat:'走路', activity:'從臥室走到餐桌吃飯', how:'使用助行器、地上貼腳步標記', measure:'每天午、晚餐各 1 趟', who:['個案', '外籍家庭看護工'], pre:3, post:5, final:'部分達成' })];
  put('episodes', { id:'dm_e3', clientId:'dm_c3', code:'CA07', status:'已結案', referDate:ago(52), startDate:ago(45), groups:2, freq:'每週 1 次', caseMgr:'陳個管', aUnit:'○○社區整合型服務中心', problems:['移位問題', '進食問題', '走路問題'], nhi:'無',
    serviceGoal:'林阿嬤希望可以自己從椅子站起來、自己走到餐桌吃飯（2 個月內）。', carer:{ name:'阿妮', rel:'外籍看護', type:'外籍家庭看護工' }, assess:{ pri:[] }, goals:g3,
    guide:[lib('sit-to-stand', { goalId:g3[0].id }), lib('adl_feed', { goalId:g3[1].id }), lib('metronome-stepping', { goalId:g3[2].id })],
    closing:{ date:ago(3), reason:'達成目標', analysis:'個案已能在監督下完成自選活動，照顧者已習得協助技巧', outcome:'目標1（移位）：椅子加高後可自行站起，一天 6–8 次。\n目標2（進食）：使用加重湯匙可自己吃完午、晚餐，未再嗆咳。\n目標3（走路）：使用助行器可在監督下走到餐桌，凍結步態時需口令提示。', process:'外籍看護全程參與並能回覆示教；每週以 LINE 回報練習', suggest:'持續依居家指導單每日練習；將練習融入每日作息', sat:8, burden:'減輕', reported:false } });
  [45, 38, 31, 24, 17, 10].forEach((d, i) => put('visits', { id:'dm_v3' + i, episodeId:'dm_e3', clientId:'dm_c3', date:ago(d), start:'10:00', end:'11:00', who:['個案', '外籍家庭看護工'], carerName:'阿妮',
    status:i ? { [g3[0].id]:i > 3 ? '達成' : '部分達成', [g3[1].id]:i > 4 ? '達成' : '部分達成', [g3[2].id]:i > 2 ? '部分達成' : '未達成' } : {}, gnote:{}, content:{ follow:i ? '外籍看護回報每天都有練習' : '初次訪視', scene:'於客廳與餐桌實際練習', next:'' }, advice:{ act:'示範口令提示', caution:'凍結步態時先停下、數拍子再走' } }));
  Store.flush(); toast('已載入 3 個模擬個案'); App.go('#/'); route();
}

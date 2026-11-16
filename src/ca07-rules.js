/* ================================================================
   CA07 居家復能：規則、目標設定、照管系統欄位
   依據：衛福部《長照專業服務操作指引》操作篇與附錄一（111 年 12 月）、
         專業服務紀錄表-1（114 年 9 月 1 日修訂）、各縣市照管系統服務紀錄欄位說明
   ================================================================ */
const isRes = () => false, isHome = () => true, term = () => '個案';
const allItems = () => [...LIBRARY, ...Store.all('library')];
const findItem = id => allItems().find(e => e.id === id);
const itemImg = it => it?.img || (it?.exId && findItem(it.exId)?.img) || '';
const POSTURES = [['', '全部姿勢'], ['坐姿', '坐姿／輪椅可做'], ['臥姿', '床上（臥姿）'], ['站姿', '需站立']];
const postOk = (e, post) => !post || (e.tags || []).includes(post);
const wcBadge = e => (e.tags || []).includes('坐姿') ? '<span class="pc-wc">輪椅可做</span>' : '';

/* ---------- 給付規則（CA07） ---------- */
const RULE = { perGroup:3, price:4500, maxVisits:12, maxMonths:6, restartDays:90, reportDays:7, extendBefore:4 };
const CODES = [['CA07', 'IADLs 復能、ADLs 復能照護']];

/* ---------- 紀錄表-1 的目標類別（單選，順序同官方表單） ---------- */
const GOAL_CATS = ['進食(含吞嚥)', '洗澡', '個人修飾', '穿脫衣物', '大便控制', '小便控制', '上廁所', '移位', '走路', '上下樓梯', '使用電話', '購物', '備餐', '處理家務', '洗衣服', '外出', '服用藥物', '處理財務', '皮膚傷口照顧', '管路照顧', '營養', '其他'];
/* 協助程度：依紀錄表-1 填寫說明的分級 */
const ASSIST = ['可獨立', '在旁人監督下', '在口頭提示或事前準備下', '在少量協助下', '在中度協助下', '在照顧者協助下'];
const WHEN = ['2 週內', '4 週內', '6 週內', '8 週內', '12 週內', '3 個月內', '6 個月內'];
/* 指導對象：應納入主要照顧者（家屬或外籍家庭看護工為主） */
const WHO = ['個案', '個案家屬', '外籍家庭看護工', '居家服務員', '其他'];
const ACHIEVE = () => Store.DB.meta.achieveOpts?.length ? Store.DB.meta.achieveOpts : ['達成', '部分達成', '未達成'];
const CLOSE_REASONS = ['達成目標', '個案狀況改變，不能繼續', '個案/家屬拒絕', '其他'];
/* 照管系統問題清單常見項目（實際以照管系統勾選內容為準） */
const PROBLEMS = ['進食問題', '洗澡問題', '個人修飾問題', '穿脫衣物問題', '大小便控制問題', '上廁所問題', '移位問題', '走路問題', '上下樓梯問題', '使用電話問題', '購物或外出問題', '備餐問題', '處理家務問題', '用藥問題', '處理財務問題', '溝通問題', '短期記憶障礙', '疼痛問題', '不動症候群風險', '皮膚照護問題', '水分及營養問題', '吞嚥問題', '管路照顧問題', '跌倒風險', '居住環境障礙', '照顧負荷過重', '輔具使用問題', '社會參與需協助'];

/* ---------- 每一類：常用活動、方式／環境、可測量、範例、可搭配的居家練習 ---------- */
const CAT = {
  '進食(含吞嚥)':{ act:['自己吃完一餐', '自己用湯匙吃飯', '自己拿杯子喝水'], how:['使用加粗湯匙與防滑碗', '坐在餐桌前、雙腳踩地', '食物切小塊、調整質地'], meas:['每日三餐', '吃完碗內八成以上的飯菜', '30 分鐘內吃完', '過程中不嗆咳'],
    ex:'個案在 8 週內，使用加粗湯匙與防滑碗並坐在餐桌前，在照顧者從旁監督下，自己吃完午、晚兩餐碗內八成的飯菜，過程中不嗆咳。', lib:['adl_feed', 'spoon-scoop', 'cup-to-mouth', 'swallow-chin-tuck', 'oral_exercise'] },
  '洗澡':{ act:['自己在浴室洗澡', '自己洗身體前側與手臂', '進出浴室'], how:['坐在洗澡椅上、旁有扶手', '使用長柄刷', '浴室鋪防滑墊'], meas:['每週至少 3 次', '30 分鐘內完成', '洗完不需他人補洗'],
    ex:'個案在 12 週內，坐在洗澡椅上並使用長柄刷，在照顧者從旁監督下，自己洗完身體前側與雙手，每週至少 3 次。', lib:['shower-chair-transfer', 'shower-step-entry', 'adl_groom'] },
  '個人修飾':{ act:['自己刷牙洗臉', '自己梳頭', '自己刮鬍子'], how:['坐在洗手台前', '牙刷柄加粗', '物品放在固定位置'], meas:['每天早晚', '10 分鐘內完成', '不需他人補做'],
    ex:'個案在 4 週內，坐在洗手台前並使用加粗牙刷，在口頭提示下，每天早晚自己刷牙洗臉，不需他人補做。', lib:['adl_groom', 'grip-towel', 'wrist-flex-extension'] },
  '穿脫衣物':{ act:['自己穿脫上衣', '自己穿脫褲子', '自己穿脫鞋襪'], how:['坐在有扶手的椅子上', '先穿患側、先脫健側', '使用穿襪器、魔鬼氈鞋'], meas:['每天早上', '10 分鐘內完成', '一週至少 5 天'],
    ex:'個案在 8 週內，坐在有扶手的椅子上並依「先穿患側」的順序，在口頭提示下自己穿好上衣與褲子，一週至少 5 天。', lib:['adl_dress', 'button-board', 'zipper-practice', 'sock-aid-practice', 'shoe-donning'] },
  '大便控制':{ act:['定時坐馬桶排便', '自己表達便意'], how:['早餐後固定時間', '使用便盆椅', '腳下放小凳子'], meas:['每天一次', '一週失禁不超過 1 次'],
    ex:'個案在 8 週內，於每天早餐後固定時間坐便盆椅，在照顧者提醒下完成排便，一週失禁不超過 1 次。', lib:['adl_toiletschedule', 'breathing-diaphragmatic'] },
  '小便控制':{ act:['定時上廁所小便', '夜間自己用尿壺'], how:['白天每 2 小時提醒一次', '床邊放尿壺與夜燈'], meas:['白天不尿濕', '一週尿濕不超過 2 次'],
    ex:'個案在 6 週內，在照顧者白天每 2 小時提醒下自己去上廁所小便，白天尿濕一週不超過 2 次。', lib:['adl_toiletschedule', 'adl_toilet'] },
  '上廁所':{ act:['白天自己走到浴室上廁所', '自己穿脫褲子與擦拭', '自己坐上、起身離開馬桶'], how:['使用四腳拐', '扶著馬桶旁扶手', '使用馬桶增高座'], meas:['白天每次如廁', '一天至少 4 次', '連續 2 週'],
    ex:'個案在 12 週內，使用四腳拐並扶著馬桶旁扶手，在照顧者從旁監督下，白天自己走到浴室上廁所，一天至少 4 次。', lib:['toilet-transfer', 'adl_toilet', 'sit-to-stand', 'adl_toiletschedule'] },
  '移位':{ act:['自己從床上坐起並站起', '床與輪椅之間轉位', '從椅子上站起來'], how:['抓床邊扶手', '輪椅先拉煞車、掀腳踏板', '椅子加高、有扶手'], meas:['每天起床時', '一天至少 5 次', '不需他人扶持'],
    ex:'個案在 4 週內，抓著床邊扶手，在照顧者從旁監督下，每天早上自己從床上坐起並站到床邊，不需他人扶持。', lib:['supine-to-sit', 'bed-rolling', 'bed-scoot', 'sit-pivot-transfer', 'sit-to-stand', 'wc_brake', 'wc-armrest-sit-to-stand'] },
  '走路':{ act:['從臥室走到客廳', '走到餐桌吃飯', '在家中走動'], how:['使用四腳拐', '使用助行器', '沿著走道扶手'], meas:['每天至少 3 趟', '每次約 10 公尺', '連續 2 週無跌倒'],
    ex:'個案在 12 週內，使用四腳拐，在照顧者從旁監督下，每天自己從臥室走到客廳看電視至少 3 趟，期間沒有跌倒。', lib:['walking-program', 'adl_walkmeal', 'side-step', 'turning-practice', 'carry-light-object-walk', 'home-entry-walking'] },
  '上下樓梯':{ act:['自己上下樓到二樓臥室', '自己上下門口台階'], how:['扶著扶手、一階一步', '上樓好腳先、下樓患腳先'], meas:['每天至少 1 趟', '不需他人扶持'],
    ex:'個案在 12 週內，扶著扶手並以「上樓好腳先、下樓患腳先」的方式，在照顧者從旁監督下，每天自己上下樓一趟。', lib:['stairs-handrail', 'step-up', 'stair-descent-practice', 'lateral-step-up'] },
  '使用電話':{ act:['自己打電話給家人', '自己接聽電話'], how:['手機設定快速撥號與大字體', '常用電話貼在牆上'], meas:['每週至少 3 次', '不需他人協助撥號'],
    ex:'個案在 4 週內，使用設定好快速撥號的手機，自己打電話給女兒，每週至少 3 次，不需他人協助撥號。', lib:['phone-dial'] },
  '購物':{ act:['到附近商店買日用品', '自己付錢與確認找零'], how:['事先寫好購物清單', '由家屬陪同步行前往'], meas:['每週 1 次', '買齊清單上的物品'],
    ex:'個案在 12 週內，帶著購物清單，在家屬陪同下走到巷口商店買齊日用品並自己付錢，每週 1 次。', lib:['money-change', 'outdoor-walk', 'carry-light-object-walk'] },
  '備餐':{ act:['自己加熱飯菜', '自己準備簡單早餐', '自己泡茶'], how:['坐在流理台旁的高腳椅', '使用微波爐', '常用物品放在腰到肩的高度'], meas:['每天早餐', '一週至少 4 天', '過程無燙傷'],
    ex:'個案在 8 週內，坐在流理台旁的高腳椅並使用微波爐，在照顧者從旁監督下，自己加熱早餐，一週至少 4 天。', lib:['kitchen-task-sequence', 'counter-reaching-standing', 'jar-key', 'reaching-cup'] },
  '處理家務':{ act:['自己摺衣服', '自己擦桌子', '掃客廳地板'], how:['坐在桌前', '使用長柄掃把'], meas:['每天 1 次', '一週至少 3 天'],
    ex:'個案在 8 週內，坐在餐桌前，自己摺好家人洗好的衣物，一週至少 3 天。', lib:['cloth-folding', 'sweeping', 'floor-pickup-safe'] },
  '洗衣服':{ act:['自己晾衣服', '自己操作洗衣機'], how:['衣架改放低', '洗衣籃放在椅子上'], meas:['每週 2 次', '一次晾完一籃'],
    ex:'個案在 8 週內，把洗衣籃放在椅子上並使用降低的曬衣桿，自己晾完一籃衣服，每週 2 次。', lib:['laundry-basket-lift', 'pinch-clip', 'towel-wring', 'overhead-reach-light'] },
  '外出':{ act:['走到社區據點參加活動', '到公園散步', '自己上下車'], how:['使用助行器', '由家屬陪同', '搭乘復康巴士'], meas:['每週 2 次', '來回約 300 公尺'],
    ex:'個案在 12 週內，使用助行器，在家屬陪同下走到社區關懷據點參加活動，每週 2 次。', lib:['outdoor-walk', 'car-transfer-sim', 'home-entry-walking', 'walking-program'] },
  '服用藥物':{ act:['自己按時服藥', '自己分裝一週藥盒'], how:['使用一週分格藥盒', '設定手機鬧鐘提示'], meas:['每日三餐飯後', '一週漏服不超過 1 次'],
    ex:'個案在 4 週內，使用分格藥盒與手機鬧鐘提示，自己在三餐飯後服藥，一週漏服不超過 1 次。', lib:['iadl_meds', 'calendar-memo'] },
  '處理財務':{ act:['自己記帳', '自己付錢找零'], how:['使用大字記帳本', '錢包分格放鈔票與零錢'], meas:['每週記帳 1 次', '付錢不出錯'],
    ex:'個案在 8 週內，使用分格錢包，自己在早餐店付錢並確認找零，每週至少 2 次。', lib:['money-change', 'calendar-memo'] },
  '皮膚傷口照顧':{ act:['照顧者定時協助翻身', '自己每天檢查皮膚'], how:['使用減壓床墊', '床邊貼翻身時間表'], meas:['每 2 小時一次', '無新增壓傷'],
    ex:'照顧者在 4 週內，依床邊翻身時間表並使用減壓床墊，每 2 小時協助個案翻身一次，期間無新增壓傷。', lib:['bed-rolling', 'wc_pressure_relief', 'wc-pushup-relief', 'wc-side-lean-relief'] },
  '管路照顧':{ act:['照顧者正確灌食', '照顧者正確清潔管路'], how:['依指導步驟卡操作', '灌食時抬高床頭 30 度以上'], meas:['每次灌食', '回覆示教全部步驟正確'],
    ex:'照顧者在 2 週內，依指導步驟卡並抬高床頭 30 度以上，獨立為個案完成每次灌食，回覆示教全部步驟正確。', lib:[] },
  '營養':{ act:['照顧者準備適合質地的餐點', '個案吃完建議餐量'], how:['依食物質地分級準備', '少量多餐'], meas:['每餐吃完三分之二以上', '一週量一次體重'],
    ex:'照顧者在 4 週內，依指導的食物質地準備每餐，個案每餐可吃完建議餐量的三分之二以上。', lib:['oral_exercise', 'swallow-chin-tuck'] },
  '其他':{ act:[], how:[], meas:['每天', '一週至少 3 次'], ex:'', lib:[] },
};
/* 只寫身體功能、沒寫活動時提醒（操作指引：「能走路」「手會動」不是日常活動目標） */
const BODY_ONLY = /^(?:可以|能夠?|可)?(?:走路|行走|站立?|站穩|手會動|手能動|肌力|平衡|關節|力氣|體力|復健|走得?穩)/;
function composeGoal(g){
  const act = (g.activity || '').trim().replace(/[。，]$/, ''); if (!act) return '';
  const clean = x => (x || '').trim().replace(/[。，、]+$/, '');
  const a = g.assist === '可獨立' ? '可獨立' + act.replace(/^自己/, '') : (g.assist || '') + act;
  return `${g.subject || '個案'}在 ${g.when || '12 週內'}，${clean(g.how) ? clean(g.how) + '，' : ''}${a}${clean(g.measure) ? '，' + clean(g.measure) : ''}。`;
}
/* 目標檢查：5 大要素 */
function goalIssues(g){
  const out = [];
  if (!g.cat) out.push('選一個目標類別');
  if (!g.activity?.trim()) out.push('寫出要做到的日常活動');
  else if (BODY_ONLY.test(g.activity.trim()) && !/去|到|上廁所|吃|洗|穿|拿|煮|買|看|聊|參加/.test(g.activity)) out.push('目前寫的是身體功能，請寫成日常活動（例如「走到浴室上廁所」）');
  if (!g.how?.trim()) out.push('寫出執行方式／環境或輔具');
  if (!g.assist) out.push('選擇協助程度');
  if (!g.when) out.push('選擇時限');
  if (!g.measure?.trim()) out.push('寫出可測量的標準（次數、頻率、時間）');
  if (!g.who?.length) out.push('勾選指導對象');
  else if (!g.who.some(w => w !== '個案')) out.push('指導對象應納入主要照顧者');
  if (!g.pre) out.push('請個案／家屬自評目前表現（1–10 分）');
  return out;
}

/* ---------- 服務期程計算 ---------- */
const epVisits = ep => Store.all('visits').filter(v => v.episodeId === ep.id).sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')));
const epApproved = ep => (+ep.groups || 1) * RULE.perGroup;
const visitLabel = n => `第 ${Math.ceil(n / RULE.perGroup)} 組第 ${(n - 1) % RULE.perGroup + 1} 次`;
const activeEp = cid => Store.all('episodes').filter(e => e.clientId === cid && e.status !== '已結案').sort(byDate('startDate')).at(-1) || null;
const lastEp = cid => Store.all('episodes').filter(e => e.clientId === cid).sort(byDate('startDate')).at(-1) || null;
function addWorkDays(iso, n){ let d = iso, k = 0; while (k < n) { d = addDays(d, 1); if (weekday(d) <= 5) k++; } return d; }
/* 整體達成情形（照管系統一筆紀錄只有一個下拉選單）：全部達成→達成；有進展→部分達成；否則未達成 */
function overallAchieve(st){
  const o = ACHIEVE(), v = Object.values(st || {}).filter(Boolean); if (!v.length) return '';
  if (v.every(x => x === o[0])) return o[0];
  if (v.some(x => x !== o.at(-1))) return o[1] || o[0];
  return o.at(-1);
}
/* 一個服務期程的狀態與提醒 */
function epStatus(ep){
  const vs = epVisits(ep), n = vs.length, cap = Math.min(epApproved(ep), RULE.maxVisits), today = todayISO(), last = vs.at(-1);
  const goals = (ep.goals || []).filter(g => g.activity);
  const tips = [];
  if (ep.status === '已結案') {
    const due = addWorkDays(ep.closing?.date || today, RULE.reportDays), restart = addDays(ep.closing?.date || today, RULE.restartDays);
    if (!ep.closing?.reported) tips.push({ k:due < today ? 'red' : 'amber', t:`結案報告與照管系統登錄期限：${rocDate(due)}（結案後 ${RULE.reportDays} 個工作天）`, a:'close' });
    return { n, cap, left:0, goals, tips, due, restart, last };
  }
  if (!n) tips.push({ k:'amber', t:'尚未進行第一次訪視（初評）', a:'visit' });
  if (n && goals.length < 3) tips.push({ k:n >= RULE.perGroup - 1 ? 'red' : 'amber', t:`訓練目標目前 ${goals.length} 項：第一組服務結束前要完成 3–5 項`, a:'goals' });
  const bad = goals.filter(g => goalIssues(g).length);
  if (bad.length) tips.push({ k:'amber', t:`有 ${bad.length} 項目標還缺要素或分數`, a:'goals' });
  const left = cap - n;
  if (n && left > 0 && left <= RULE.extendBefore + 1 && !ep.extend?.applied && !ep.extendChecked) tips.push({ k:left < RULE.extendBefore ? 'red' : 'amber', t:left >= RULE.extendBefore ? `剩 ${left} 次：如需延案，請在剩 ${RULE.extendBefore} 次（含）之前向照專／A 個管提出` : `只剩 ${left} 次：如需延案請盡快與照專／A 個管確認（原則上應在剩 ${RULE.extendBefore} 次前提出）`, a:'close' });
  if (n >= cap) tips.push({ k:'red', t:`已用完核定的 ${cap} 次，請完成結案或延案`, a:'close' });
  if (ep.startDate && addMonths(ep.startDate, RULE.maxMonths) <= addDays(today, 14)) tips.push({ k:'amber', t:`服務期程將於 ${rocDate(addMonths(ep.startDate, RULE.maxMonths))} 屆滿 6 個月`, a:'close' });
  if (n >= RULE.perGroup && last?.status && Object.values(last.status).length && Object.values(last.status).every(x => x === ACHIEVE().at(-1))) tips.push({ k:'amber', t:'經過一組服務仍未有明顯進步：可評估是否結案或調整目標', a:'goals' });
  if (n && !ep.sharedAt) tips.push({ k:'amber', t:'居家指導還沒傳給案家（每次服務要交付書面指導紀錄）', a:'guide' });
  const next = last ? addDays(last.date, 7) : null;
  return { n, cap, left, goals, tips, next, last };
}

/* ---------- 照管系統五個必填欄位 ---------- */
const CONTENT_PARTS = [
  ['follow', '追蹤前次情況', ['案家回報上週居家練習情形', '上次交代的作業已完成', '上次交代的作業僅部分完成', '本週身體狀況穩定', '本週有跌倒／不適事件']],
  ['finding', '問題發現及原因分析', ['照顧者協助過多，個案練習機會少', '環境有障礙（門檻、照明、扶手不足）', '個案擔心跌倒而不敢嘗試', '輔具尺寸或使用方式不正確', '耐力不足，做到後段需休息', '認知記憶影響步驟順序']],
  ['scene', '實際執行目標活動之情境', ['於臥室床邊實際練習', '於浴室實際操作', '於客廳至餐桌動線實際走一趟', '於廚房實際操作', '模擬日常時段實際演練']],
  ['perf', '個案表現（具體／量化）', ['可獨立完成', '在監督下完成', '需口頭提示 1–2 次', '需少量扶持完成', '完成時間約 分鐘', '連續完成 次']],
  ['why', '成功／不成功原因分析', ['調整環境後動作較穩', '改用輔具後可自行完成', '分段練習後較能記住步驟', '照顧者改為從旁監督後，個案主動性提升', '疲勞時表現下降', '疼痛影響動作']],
  ['next', '後續具體建議與措施', ['下次加入實際情境練習', '下次評估輔具需求', '建議照顧者減少協助、改為從旁監督', '建議轉介輔具或居家無障礙評估', '下次調整訓練目標難度']],
];
const ADVICE_PARTS = [
  ['act', '措施／訓練活動內容', ['示範並請照顧者回覆示教', '教導分段完成動作', '調整物品擺放位置', '教導正確使用輔具', '建立固定練習時段']],
  ['caution', '注意事項', ['練習時旁邊要有人', '地面保持乾燥、穿防滑鞋', '頭暈或胸悶要立即停止', '動作放慢，不要急', '輪椅轉位前一定先拉煞車']],
  ['homework', '交代作業', []],
];
const textOf = (o, parts) => parts.map(([k, l]) => o?.[k]?.trim() ? `${l}：${o[k].trim()}` : '').filter(Boolean).join('\n');
const goalsText = ep => (ep.goals || []).filter(g => g.activity).map((g, i) => `${i + 1}.${g.text || composeGoal(g)}`).join('\n');
const whoText = v => (v.who || []).map(w => w === '其他' && v.whoOther ? v.whoOther : w === '個案家屬' && v.carerName ? `個案家屬（${v.carerName}）` : w).join('、');
function systemFields(ep, v){
  const goals = (ep.goals || []).filter(g => g.activity);
  const st = goals.map((g, i) => v.status?.[g.id] ? `目標${i + 1}${v.status[g.id]}` : '').filter(Boolean).join('、');
  return [
    ['復能目標達成情形', overallAchieve(v.status), st ? `下拉選單請選「${overallAchieve(v.status)}」（${st}）` : '請先在上方點選各目標的達成情形'],
    ['復能目標', goalsText(ep), ''],
    ['指導對象', whoText(v), ''],
    ['服務內容', visitContent(ep, v), ''],
    ['指導建議摘要', textOf(v.advice, ADVICE_PARTS), ''],
  ];
}
async function copyText(t, label = ''){
  try { await navigator.clipboard.writeText(t); toast(`已複製${label ? '「' + label + '」' : ''}，可以貼到照管系統`); }
  catch(e){ const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('已複製'); } catch(e2){ toast('無法自動複製，請手動選取', 'err'); } ta.remove(); }
}
const COPY = {}; let copyN = 0;
const copyBtn = (text, label) => { const k = 'c' + (++copyN); COPY[k] = [text, label]; return `<button type="button" class="btn sm copy" onclick="copyText(...COPY['${k}'])">${icon('clip', 14)}<span>複製</span></button>`; };

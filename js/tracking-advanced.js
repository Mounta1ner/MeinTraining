/* Local event log, scheduled misses and optional Make me feel it ledger. */
S.activityEvents=Array.isArray(S.activityEvents)?S.activityEvents:[];
S.financeLedger=Array.isArray(S.financeLedger)?S.financeLedger:[];
S.financeSettlements=Array.isArray(S.financeSettlements)?S.financeSettlements:[];
S.financeSeen=S.financeSeen||{};
S.financeEnabled=S.financeEnabled===true||S.penalty?.enabled===true;
S.financeStart=S.financeStart||iso(new Date());
S.homeVisible=S.homeVisible||{};
if(!S.homeOrder.includes('finance'))S.homeOrder.push('finance');
const money=n=>Number(n||0).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const cents=n=>Math.round((+n||0)*100);
const timestamp=()=>new Date().toISOString();
const localDay=t=>iso(new Date(t));
// v2.8.3: authoritative persisted classification, independent of legacy penalty fields.
const FINANCE_TYPES_KEY='meintraining-finance-types-v1';
function financeTypesRead(){try{const o=JSON.parse(localStorage.getItem(FINANCE_TYPES_KEY)||'{}');return o&&typeof o==='object'?o:{}}catch(_){return {}}}
const financeTypes=financeTypesRead();
function financeKey(kind,id){return kind+':'+String(id)}
function finance281Init(x,kind){
 const valid=t=>['positive','negative','neutral'].includes(t);
 const saved=kind?financeTypes[financeKey(kind,x.id)]:undefined;
 if(!x.finance281||!valid(x.finance281.type)){
  const done=Number(x.penaltyDone)||0,miss=Number(x.penaltyMiss)||0;
  x.finance281={type:done>0&&miss===0?'negative':miss>0&&done===0?'positive':'neutral',amount:done>0&&miss===0?done:miss>0&&done===0?miss:0};
 }
 if(valid(saved))x.finance281.type=saved;
 return x.finance281;
}
function finance281Apply(x,kind){const f=finance281Init(x,kind);
 x.penaltyDone=f.type==='negative'?f.amount:0;
 x.penaltyMiss=f.type==='positive'?f.amount:0;
}
function finance281Set(kind,id,key,value){
 if(kind!=='plan'&&kind!=='habit')return;
 const x=(kind==='plan'?S.plans:S.habits).find(a=>String(a.id)===String(id));
 if(!x){toast('Aktivität oder Plan nicht gefunden');return;}
 const f=finance281Init(x,kind);
 if(key==='type'){
  if(!['positive','negative','neutral'].includes(value))return;
  f.type=value;
  financeTypes[financeKey(kind,x.id)]=value;
  try{localStorage.setItem(FINANCE_TYPES_KEY,JSON.stringify(financeTypes));}catch(_){toast('Bewertung konnte nicht gespeichert werden');return;}
 }else if(key==='amount'){
  const n=Number(value);if(!Number.isFinite(n)||n<0||n>10000){toast('Betrag zwischen 0 und 10.000 €');render();return;}f.amount=n;
 }else return;
 x.finance281Explicit=true;
 finance281Apply(x,kind);
 save();render();
}

function addActivityEvent(id,type='done',when=timestamp(),source='app',eventId){
 const h=S.habits.find(x=>x.id===id);if(!h)return;finance281Apply(h,'habit');
 const uid=eventId||'act-'+when+'-'+Math.random().toString(36).slice(2);
 if(S.activityEvents.some(e=>e.id===uid))return;
 S.activityEvents.push({id:uid,habitId:id,name:h.name,type,at:when,source:source});
 if(S.financeEnabled){const amount=cents(type==='done'?h.penaltyDone:h.penaltyMiss);if(amount)bookFinance(uid,'Aktivität',id,h.name,type,amount,when)}
}
function bookFinance(uid,category,targetId,name,type,amount,at=timestamp()){
 if(!S.financeEnabled||!amount||S.financeLedger.some(e=>e.id===uid))return;
 S.financeLedger.push({id:uid,category,targetId,name,type,cents:amount,at});
}
const originalTrackHabit=trackHabit;
trackHabit=function(id,done){const h=S.habits.find(x=>x.id===id);if(!h)return;
 // avoid duplicated legacy balance: ledger is the sole financial source from version 2.5 onward
 const pen=S.penalty;const old=pen.enabled;pen.enabled=false;
 try{originalTrackHabit(id,done)}finally{pen.enabled=old}
 addActivityEvent(id,done?'done':'skip');save();if(S.financeEnabled&&tab==='today')render();
};
// Native events have already been recorded by Android. Preserve timestamp from widget.
function importWidgetEvents(){try{const raw=window.AndroidBridge?.drainEvents?.();if(!raw)return;const events=JSON.parse(raw);let modified=false;
 for(const ev of events){if(!ev||!ev.id||!ev.date||!/^\d{4}-\d{2}-\d{2}$/.test(ev.date))continue;
 const h=S.habits.find(x=>x.id===ev.id);if(!h)continue;
 const at=ev.timestamp?new Date(ev.timestamp).toISOString():ev.date+'T12:00:00.000Z';
 const uid='android-'+ev.timestamp+'-'+ev.id;if(S.activityEvents.some(x=>x.id===uid))continue;
 const date=ev.date;
 S.habitLog[date]=S.habitLog[date]||{};
 const old=S.habitLog[date][ev.id];S.habitLog[date][ev.id]=(typeof old==='number'?old:old===true?1:0)+1;
 h.doneCount=(+h.doneCount||0)+1;addActivityEvent(ev.id,'done',at,'widget',uid);modified=true}
 if(modified){save();render()}
 }catch(e){console.warn('Widget events',e)}}
// Bridge focus listener sees this new definition because original listener registered the identifier indirectly.
// Existing startup call to old function executes before reassignment; a fresh check picks up later events.
window.addEventListener('focus',importWidgetEvents);
setTimeout(importWidgetEvents,1300);
function justDate(d){return new Date(d+'T12:00:00')}
function monday(d){let n=justDate(d);n.setDate(n.getDate()-wd(n));return n}
function nextDay(date,add){let d=justDate(date);d.setDate(d.getDate()+add);return iso(d)}
function bornDay(obj){const key=String(obj.id||'');const millis=Number(key.substring(1,14));const valid=millis>1500000000000&&millis<Date.now()+864e5;return obj.createdAt?.slice(0,10)||(valid?iso(new Date(millis)):S.financeStart)}
function habitCountOn(day,id){const v=S.habitLog[day]?.[id];return typeof v==='number'?v:v===true?1:0}
function scheduledMisses(today=iso()){
 S.plans.forEach(x=>finance281Apply(x,'plan'));S.habits.forEach(x=>finance281Apply(x,'habit'));
 const misses=[],until=nextDay(today,-1),seen=new Set();
 const maxDays=365,start=nextDay(today,-maxDays);
 const put=(key,category,obj,day)=>{if(seen.has(key))return;seen.add(key);misses.push({id:'miss:'+key,category,targetId:obj.id,name:obj.name,type:'miss',date:day,at:day+'T23:59:59',cents:cents(obj.penaltyMiss)})};
 // Fixed-day schedules: one incomplete scheduled plan = one miss. Activities: one missed occurrence per scheduled day.
 S.plans.forEach(p=>{const first=bornDay(p);if(p.days?.length){for(let day=start;day<=until;day=nextDay(day,1))if(day>=first&&p.days.includes(wd(justDate(day)))&&planPct(p,day)<100)put('p:'+p.id+':'+day,'Plan',p,day)}
 else{ // weekly quota evaluated only once the entire week is over
 let m=monday(start);for(let w=iso(m);nextDay(w,6)<today;w=nextDay(w,7)){
 const end=nextDay(w,6);if(first>end)continue;
 let done=0;for(let day=w;day<=end;day=nextDay(day,1))if(planPct(p,day)>=100)done++;
 for(let i=done;i<Math.min(7,Math.max(1,+p.pw||1));i++)put('p:'+p.id+':'+w+':'+i,'Plan',p,end);
 }} });
 S.habits.forEach(h=>{const first=bornDay(h);if(h.mode==='days'&&h.targetDays?.length){for(let day=start;day<=until;day=nextDay(day,1))if(day>=first&&h.targetDays.includes(wd(justDate(day)))&&habitCountOn(day,h.id)<1)put('h:'+h.id+':'+day,'Aktivität',h,day)}
 else if(h.mode==='week'){for(let w=iso(monday(start));nextDay(w,6)<today;w=nextDay(w,7)){const end=nextDay(w,6);if(first>end)continue;let done=0;for(let day=w;day<=end;day=nextDay(day,1))done+=habitCountOn(day,h.id);for(let i=done;i<Math.min(31,Math.max(1,+h.weeklyTarget||1));i++)put('h:'+h.id+':'+w+':'+i,'Aktivität',h,end)}}
 });
 return misses;
}
function missedTrainingTotal(){return scheduledMisses().length}
function financeMissedEvents(){return scheduledMisses().filter(x=>!S.financeSeen[x.id])}
function ensureMisses(){let changed=false;for(const m of scheduledMisses()){
 if(S.financeSeen[m.id])continue;S.financeSeen[m.id]=true;changed=true;
 if(S.financeEnabled&&m.date>=S.financeStart&&m.cents)bookFinance(m.id,m.category,m.targetId,m.name,'miss',m.cents,m.at);
 }if(changed)save() }
function activeLedger(){return S.financeLedger.filter(x=>!S.financeSettlements.some(z=>z.ids?.includes(x.id)))}
function remainingMoney(){return activeLedger().reduce((sum,x)=>sum+x.cents,0)/100}
function financeHome(){if(!S.financeEnabled||S.homeVisible?.finance===false)return '';ensureMisses();return `<div class="c mf-compact"><div class="r" style="justify-content:space-between"><div><h3>⚡ Make me feel it</h3><strong>${money(remainingMoney())}</strong><div class="mu">Noch offen</div></div><button class="b g" onclick="go('hist')">Details →</button></div></div>`}
function financialSettingRow(kind,x){finance281Init(x,kind);const f=x.finance281,id=JSON.stringify(x.id);
 return `<div class="mf-row"><b>${esc(x.name)}</b><label>Bewertung <select onchange="finance281Set('${kind}',${id},'type',this.value)">${[['positive','Positiv – bei Auslassen buchen'],['negative','Negativ – bei Erledigt buchen'],['neutral','Neutral – keine Buchung']].map(([k,v])=>`<option value="${k}" ${f.type===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Betrag (€) <input class="mf-input" type="number" min="0" max="10000" step="0.01" value="${f.amount}" onchange="finance281Set('${kind}',${id},'amount',this.value)"></label></div>`}
function financeSettings(){return `<div class="c"><h3>⚡ Make me feel it</h3><label class="r"><input type="checkbox" ${S.financeEnabled?'checked':''} onchange="toggleFinance(this.checked)"> Aktivieren</label><p class="mu">Negativ: Betrag bei Erfassung. Positiv: Betrag bei verpasster geplanter Einheit, nach Ablauf des Tages bzw. der Woche. Neutral: keine Buchung. Bestehende Buchungen bleiben erhalten.</p><h4>Trainingspläne</h4>${S.plans.map(x=>financialSettingRow('plan',x)).join('')||'<p>Keine Pläne</p>'}<h4>Aktivitäten</h4>${S.habits.map(x=>financialSettingRow('habit',x)).join('')||'<p>Keine Aktivitäten</p>'}<p>Offen: <b>${money(remainingMoney())}</b></p></div>`}
function toggleFinance(flag){S.financeEnabled=flag;S.penalty.enabled=flag;if(flag&&!S.financeActivatedAt){S.financeActivatedAt=timestamp();S.financeStart=iso()}save();render()}
const _vSetAdvanced=vSet;
vSet=function(){return _vSetAdvanced()+financeSettings()}
const _vTodayAdvanced=vToday;
vToday=function(){const body=_vTodayAdvanced();const finances=financeHome();if(!finances)return body;
 // Honor order of Home modules; insert finance according to chosen position.
 const order=S.homeOrder||[];let chunks=document.createElement('template');chunks.innerHTML=body;
 let nodes=[...chunks.content.children];let fin=document.createElement('section');fin.dataset.module='finance';fin.className='home-section';fin.innerHTML=finances;
 const dst=order.indexOf('finance');let before=nodes.find(x=>order.indexOf(x.dataset.module)>dst&&x.dataset.module);if(before)before.before(fin);else{const ex=nodes.find(x=>x.classList.contains('home-extras'));if(ex)ex.before(fin);else chunks.content.appendChild(fin)}
 return chunks.innerHTML;
}
// Direct total counts for activity histories including legacy checkpoints where timestamps did not exist.
function activityHistoryRows(){return [...S.activityEvents].sort((a,b)=>b.at.localeCompare(a.at))}
function activityBarChart(id){let values=[];for(let i=13;i>=0;i--){const d=nextDay(iso(),-i);values.push(habitCountOn(d,id))}const max=Math.max(1,...values);return `<div class="activity-bars" role="img" aria-label="14 Tage Aktivitäten">${values.map((n,i)=>`<span style="height:${Math.max(2,Math.round(n/max*100))}%" title="${nextDay(iso(),i-13)}: ${n}×"></span>`).join('')}</div><small class="mu">Letzte 14 Tage</small>`}
function activityHistory(){return `<div class="c"><h3>🎯 Aktivitäten, Zeitstempel & Historie</h3><p class="mu">Neue Einträge enthalten Datum und Uhrzeit. Historische Einträge aus älteren Versionen haben keine rückwirkend rekonstruierbare Uhrzeit.</p>${S.habits.map(h=>{const events=activityHistoryRows().filter(x=>x.habitId===h.id);return `<details><summary style="padding:11px 0;cursor:pointer"><b>${esc(h.name)}</b> · ${h.doneCount||0}× erledigt</summary>${activityBarChart(h.id)}<div class="fin-list">${events.slice(0,15).map(e=>`<div class="settingsRow" style="border-bottom:1px solid var(--bd)"><span style="flex:1">${new Date(e.at).toLocaleString('de-AT')}</span><span>${e.type==='done'?'✓ Erledigt':'✗ Ausgelassen'}${e.source==='widget'?' · Widget':''}</span></div>`).join('')||'<p class="mu">Noch keine Einträge mit Zeitstempel.</p>'}</div></details>`}).join('')}<button class="b g" style="margin-top:12px" onclick="exportActivityHistory()">📥 Alle Einträge als CSV exportieren</button></div>`}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}
function triggerDownload(name,text){const blob=new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},2000)}
function exportActivityHistory(){const rows=[['Datum','Uhrzeit','ISO-Zeitstempel','Aktivität','Aktion','Quelle']];for(let e of activityHistoryRows()){let d=new Date(e.at);rows.push([d.toLocaleDateString('de-AT'),d.toLocaleTimeString('de-AT'),e.at,e.name,e.type==='done'?'Erledigt':'Ausgelassen',e.source])}triggerDownload('Mein_Training_Aktivitaeten.csv',rows.map(row=>row.map(csvCell).join(';')).join('\r\n'))}
function financeHistory(){ensureMisses();let ledger=S.financeLedger.slice().reverse().slice(0,100);const sum=remainingMoney();return `<div class="c"><h3>⚡ Make me feel it · Verlauf</h3><p><strong>${money(sum)}</strong> offen · ${S.financeLedger.length} Buchungen</p><div class="r"><button class="b g" onclick="settleFinance()">✓ Als beglichen zurücksetzen</button><button class="chip" onclick="exportFinance()">CSV exportieren</button></div><h4 style="margin:12px 0 7px">Buchungen</h4><div class="fin-list"><table class="fin-events"><thead><tr><th>Zeit</th><th>Quelle</th><th>Grund</th><th>Betrag</th></tr></thead><tbody>${ledger.map(e=>`<tr><td>${esc(new Date(e.at).toLocaleDateString('de-AT'))}</td><td>${esc(e.name)}</td><td>${e.type==='miss'?'Verpasst':'Erledigt'}</td><td>${money(e.cents/100)}</td></tr>`).join('')}</tbody></table></div><h4>Spenden-Vorschläge</h4><div class="r"><a class="b g" target="_blank" rel="noopener noreferrer" href="https://lichtinsdunkel.org/">Licht ins Dunkel ↗</a><a class="b g" target="_blank" rel="noopener noreferrer" href="https://www.wingsforlife.com/de/">Wings for Life ↗</a></div><p class="mu" style="margin-top:15px">Entwickler unterstützen: Marvin Berger</p><div class="r"><code style="flex:1;overflow-wrap:anywhere">AT55 1912080529408009</code><button class="chip" onclick="copyDeveloperIban()">📋 IBAN kopieren</button></div><p class="mu">Die Links führen zur jeweiligen Spendenorganisation. Es wird keine Überweisung automatisch gestartet.</p></div>`}
function copyDeveloperIban(){const text='AT551912080529408009';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast('IBAN kopiert')).catch(()=>copyFallback(text));else copyFallback(text)}
function copyFallback(text){const x=document.createElement('textarea');x.value=text;document.body.appendChild(x);x.select();const done=document.execCommand('copy');x.remove();toast(done?'IBAN kopiert':'IBAN bitte manuell kopieren')}
function settleFinance(){if(!confirm('Offene Beträge als beglichen markieren und auf 0,00 € zurücksetzen? Die Historie bleibt erhalten.'))return;const ids=activeLedger().map(e=>e.id);S.financeSettlements.push({at:timestamp(),ids,amount:cents(remainingMoney())});save();render()}
function exportFinance(){let rows=[['Zeitstempel','Kategorie','Quelle','Aktion','Betrag EUR','Beglichen']];for(let e of S.financeLedger)rows.push([e.at,e.category,e.name,e.type,(e.cents/100).toFixed(2),S.financeSettlements.some(s=>s.ids.includes(e.id))?'Ja':'Nein']);triggerDownload('Mein_Training_Spendenkonto.csv',rows.map(r=>r.map(csvCell).join(';')).join('\r\n'))}
const _vHistAdvanced=vHist;
vHist=function(){return _vHistAdvanced()+activityHistory()+financeHistory()}
const _vPlansAdvanced=vPlans;
vPlans=function(){ // show effective intensity when listing saved plans as well
 let h=_vPlansAdvanced();return h;
}
const _tickAdvanced=tick;
tick=function(date,id,i,n){let plan=S.plans.find(x=>x.id===id),before=plan?planPct(plan,date):0;_tickAdvanced(date,id,i,n);if(plan)finance281Apply(plan,'plan');if(S.financeEnabled&&plan&&before<100&&planPct(plan,date)===100){bookFinance('plan-done:'+id+':'+date,'Plan',id,plan.name,'done',cents(plan.penaltyDone),timestamp());save()}}
const _tickNextAdvanced=tickNext;
tickNext=function(date,id,i,max){const p=S.plans.find(x=>x.id===id),before=p?planPct(p,date):0;_tickNextAdvanced(date,id,i,max);if(p)finance281Apply(p,'plan');if(S.financeEnabled&&p&&before<100&&planPct(p,date)===100){bookFinance('plan-done:'+id+':'+date,'Plan',id,p.name,'done',cents(p.penaltyDone),timestamp());save()}}

// Render once again after optional finance and activity history features are fully installed.
render();

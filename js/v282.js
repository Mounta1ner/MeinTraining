/* Mein Training 2.8.2 - Dashboard and favorites, additive, no storage migration */
(function(){
S.exerciseHistory=Array.isArray(S.exerciseHistory)?S.exerciseHistory:[];
S.activityEvents=Array.isArray(S.activityEvents)?S.activityEvents:[];
S.ui=S.ui||{};
const day=d=>iso(new Date(d));
const shift=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return iso(x)};
const today=()=>iso();
const getHistory=()=>S.exerciseHistory.filter(x=>x.at&&x.id);
const workoutEvents=()=>getHistory().map(x=>({date:day(x.at),at:x.at,name:x.name||ex(x.id)?.n||'Übung',reps:Number(x.reps)||0,seconds:Number(x.seconds)||0,unit:x.unit||((Number(x.reps)||0)>0?'reps':'completion'),source:x.planId?'plan':'favorite',id:x.id}));
const habitEvents=()=>S.activityEvents.filter(x=>x.at).map(x=>({...x,date:day(x.at)}));
function plannedOn(d){const weekday=wd(new Date(d+'T12:00:00'));
 const plans=S.plans.filter(p=>Array.isArray(p.days)&&p.days.includes(weekday));
 const habits=S.habits.filter(h=>h.mode==='days'&&h.targetDays?.includes(weekday));
 return {plans,habits};}
function isComplete(d){const x=plannedOn(d);const due=x.plans.length+x.habits.length;
 return {due,done:x.plans.filter(p=>planPct(p,d)>=100).length+x.habits.filter(h=>habitCountOn(d,h.id)>0).length};}
function dashboardStats(){let run=0,best=0,miss=0,seen=false;const now=today();
 for(let i=364;i>=0;i--){const d=shift(now,-i),x=isComplete(d);if(!x.due)continue;
  if(i>0)miss+=x.due-x.done;
  if(x.done===x.due){run++;best=Math.max(best,run);seen=true}
  else if(i>0){run=0;seen=true}
 }
 const recent=shift(now,-29);
 const planCount=Object.keys(S.log||{}).reduce((n,d)=>n+S.plans.reduce((v,p)=>v+p.items.reduce((k,it,i)=>k+Math.min(Number((S.log[d]?.[p.id]||{})[i])||0,effective(it,p).sets),0),0),0);
 const total=planCount+getHistory().filter(x=>!x.planId).length+habitEvents().filter(x=>x.type==='done').length;
 const lastMonth=habitEvents().filter(x=>x.type==='done'&&day(x.at)>=recent).length+getHistory().filter(x=>day(x.at)>=recent&&!x.planId).length+
 Object.keys(S.log||{}).filter(d=>d>=recent).reduce((n,d)=>n+S.plans.reduce((v,p)=>v+p.items.reduce((k,it,i)=>k+(Number((S.log[d]?.[p.id]||{})[i])||0),0),0),0);
 return {run,best,miss,total,lastMonth};}
function statTile(icon,value,label){return `<div class="d282-stat"><div>${icon} <strong>${value}</strong></div><small>${label}</small></div>`;}
function lastTraining(){const events=workoutEvents().sort((a,b)=>b.at.localeCompare(a.at));const e=events[0];
 if(e)return `${new Date(e.at).toLocaleDateString('de-AT')} · ${esc(e.name)}`;
 const dates=Object.keys(S.log||{}).filter(d=>S.plans.some(p=>planPct(p,d)>0)).sort().reverse();return dates.length?`${new Date(dates[0]+'T12:00:00').toLocaleDateString('de-AT')} · Trainingsplan`:'Noch kein Training erfasst';}
function activityType(id){const h=S.habits.find(x=>x.id===id);return h?.finance281?.type||'neutral'}
function activityColor(t){return t==='positive'?'#22a447':t==='negative'?'#dc3545':'#278bd4'}
function chart(){const mode=S.ui.d282Mode||'exercises',show=!!S.ui.d282Activities,days=Array.from({length:14},(_,i)=>shift(today(),i-13));
 const workouts=workoutEvents(),habits=habitEvents().filter(x=>x.type==='done');
 const values=days.map(d=>workouts.filter(x=>x.date===d).reduce((n,x)=>n+(mode==='reps'?(x.unit==='reps'?x.reps:0):1),0));
 const act=days.map(d=>habits.filter(x=>x.date===d));const max=Math.max(1,...values,...(show&&mode==='exercises'?act.map(a=>a.length):[0]));
 const bars=days.map((d,i)=>{const h=Math.max(2,Math.round(values[i]/max*110));
 const actBars=show&&mode==='exercises'?['positive','negative','neutral'].map(t=>{const n=act[i].filter(x=>activityType(x.habitId)===t).length;return `<span class="d282-bar" style="height:${Math.max(2,n/max*110)}px;background:${activityColor(t)}"></span>`}).join(''):'';
 return `<button class="d282-day" onclick="d282Day('${d}')" aria-label="${d}: ${values[i]}"><span class="d282-columns"><span class="d282-bar" style="height:${h}px;background:#f97316"></span>${actBars}</span><small>${d.slice(8)}</small></button>`;}).join('');
 const activityRow=show&&mode==='reps'?`<div class="d282-activity-row">${days.map((d,i)=>`<button onclick="d282Day('${d}')" class="d282-day"><span>${act[i].map(x=>`<i style="background:${activityColor(activityType(x.habitId))}"></i>`).join('')}</span><small>${d.slice(8)}</small></button>`).join('')}</div>`:'';
 return `<div class="c"><h3>📊 Trainingsentwicklung · letzte 14 Tage</h3><div class="d282-switch"><button class="chip ${mode==='reps'?'on':''}" onclick="d282Mode('reps')">Wiederholungen</button><button class="chip ${mode==='exercises'?'on':''}" onclick="d282Mode('exercises')">Übungen</button></div><label class="settingsRow"><input type="checkbox" ${show?'checked':''} onchange="d282Activities(this.checked)"> Aktivitäten anzeigen</label><div class="d282-chart">${bars}</div>${activityRow}<p class="mu" style="font-size:12px">Orange: Übungen · Grün: positiv · Rot: negativ · Blau: neutral. Tag antippen für Details.</p></div>`;}
window.d282Mode=x=>{S.ui.d282Mode=x;save();render()};window.d282Activities=x=>{S.ui.d282Activities=x;save();render()};
window.d282Day=d=>{const w=workoutEvents().filter(x=>x.date===d),a=habitEvents().filter(x=>x.date===d);
 const rows=[...w.map(x=>`${esc(x.name)} · ${x.unit==='reps'?x.reps+' Wdh.':x.unit==='seconds'?x.seconds+' Sek.':'1 Einheit'}`),...a.map(x=>`${esc(x.name)} · ${x.type==='done'?'Erledigt':'Ausgelassen'}`)];
 v27Modal(`<h2>${new Date(d+'T12:00:00').toLocaleDateString('de-AT')}</h2>${rows.map(x=>`<div class="settingsRow">${x}</div>`).join('')||'<p>Keine Einträge</p>'}`);};
function activitiesCard(){const events=habitEvents();return `<div class="c"><h3>⚡ Aktivitäten</h3>${S.habits.map(h=>{const rows=events.filter(x=>x.habitId===h.id).sort((a,b)=>b.at.localeCompare(a.at));const moneyTotal=S.financeLedger.filter(x=>x.targetId===h.id&&x.category==='Aktivität').reduce((s,x)=>s+x.cents,0)/100;
 return `<details><summary>${esc(h.name)} · ${rows.filter(x=>x.type==='done').length}× · ${money(moneyTotal)}</summary>${activityBarChart(h.id)}<div class="fin-list">${rows.slice(0,30).map(x=>`<div class="settingsRow">${new Date(x.at).toLocaleString('de-AT')} · ${x.type==='done'?'Erledigt':'Ausgelassen'}</div>`).join('')||'<p>Keine Einträge</p>'}</div></details>`}).join('')||'<p>Keine Aktivitäten</p>'}</div>`;}
const oldHistory=vHist;
vHist=function(){const s=dashboardStats();const legacy=oldHistory();
 // Keep the existing plan, challenge, weight and finance sections but suppress duplicated activity cards and large old stat tiles.
 const tpl=document.createElement('template');tpl.innerHTML=legacy;
 [...tpl.content.querySelectorAll('.c')].forEach(el=>{const h=el.querySelector('h3')?.textContent||'';if(/Aktivitäten|Zeitstempel|Historie/.test(h)&&!/Gewicht|Finanz/.test(h))el.remove()});
 const cards=[...tpl.content.children].filter(el=>!el.querySelector?.('.d282-stat'));
 const filtered=cards.filter(el=>{const text=el.textContent||'';if(el.tagName==='H2'&&/Verlauf|Statistiken/.test(text))return false;if(el.classList?.contains('r')&&el.querySelectorAll('.c').length>=3)return false;const heading=el.querySelector?.('h3')?.textContent||'';if(/Aktivitäten|Zeitstempel/.test(heading))return false;return true}).map(el=>el.outerHTML).join('');
 return `<h2>Dashboard</h2><h3>Geplante Aktivitäten</h3><div class="d282-stats">${statTile('🔥',s.run,'Tage Serie')}${statTile('🏆',s.best,'Beste Serie')}${statTile('⏭️',s.miss,'Ausgelassen')}</div><h3>Alle Aktivitäten und Übungen</h3><div class="d282-stats">${statTile('✅',s.total,'Absolviert gesamt')}${statTile('📅',s.lastMonth,'Letzte 30 Tage')}</div><p class="mu">💪 Zuletzt trainiert: ${lastTraining()}</p>${chart()}${filtered}${activitiesCard()}`;};
const oldNav=nav;nav=function(){oldNav();const b=document.querySelectorAll('#nav button')[3];if(b){const text=b.lastChild;if(text?.nodeType===3)text.textContent='Dashboard';}};
const oldFAQ=v27FAQ;v27FAQ=function(){return oldFAQ()+`<details><summary>Wie zählt das Dashboard?</summary><p>Serie: alle fälligen geplanten Pläne und Aktivitäten eines Tages müssen abgeschlossen sein. Ausgelassen: fällige Einheiten ohne Abschluss bis zum Ende des Tages. Absolviert: erfasste Übungssätze und Aktivitäten; die letzten 30 Tage verwenden denselben Zähler im Zeitraum. Wiederholungen nur bei tatsächlich gespeicherter Menge.</p></details>`};
// Favorite quick action: one completed session, no invented repetition count.
window.d282Quick=id=>{const e=ex(id);if(!e)return;S.exerciseHistory.push({id,name:e.n,at:new Date().toISOString(),unit:'completion',reps:0,source:'favorite'});save();toast('✓ '+e.n+' erfasst');render()};
window.d282Start=id=>{const e=ex(id);if(!e)return;if(e.br){brOpen(id);return;}S.ui.d282Current={id,kind:unit(e)==='Wdh.'?'reps':'seconds',count:0,elapsed:0,running:false};d282CounterView();};
let timer=null;
function d282CounterView(){const c=S.ui.d282Current;if(!c)return;const e=ex(c.id);v27Modal(`<h2>${esc(e?.n||'Übung')}</h2><p>${c.kind==='reps'?'Wiederholungen':'Zeit'} erfassen</p><button class="v27Counter" onclick="d282Tap()" id="d282Counter">${c.kind==='reps'?c.count:d282Time(c.elapsed)}</button><div class="r" style="margin-top:10px"><button class="chip" onclick="d282Minus()">−1</button>${c.kind==='seconds'?`<button class="chip" onclick="d282Toggle()">${c.running?'Pause':'▶ Start'}</button>`:''}<button class="b" onclick="d282Save()">✓ Speichern</button><button class="chip" onclick="d282Cancel()">Schließen</button></div>`,false)}
function d282Time(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
window.d282Tap=()=>{const c=S.ui.d282Current;if(!c)return;if(c.kind==='reps'){c.count++;document.getElementById('d282Counter').textContent=c.count;}else d282Toggle();};
window.d282Minus=()=>{const c=S.ui.d282Current;if(!c)return;if(c.kind==='reps')c.count=Math.max(0,c.count-1);else c.elapsed=Math.max(0,c.elapsed-1);d282CounterView()};
window.d282Toggle=()=>{const c=S.ui.d282Current;if(!c)return;c.running=!c.running;clearInterval(timer);if(c.running)timer=setInterval(()=>{c.elapsed++;const b=document.getElementById('d282Counter');if(b)b.textContent=d282Time(c.elapsed)},1000);d282CounterView()};
window.d282Cancel=()=>{clearInterval(timer);S.ui.d282Current=null;v27CloseModal()};
window.d282Save=()=>{const c=S.ui.d282Current;if(!c)return;clearInterval(timer);if((c.kind==='reps'?c.count:c.elapsed)<=0)return toast('Noch keine Wiederholung oder Zeit erfasst');const e=ex(c.id);S.exerciseHistory.push({id:c.id,name:e.n,at:new Date().toISOString(),unit:c.kind,reps:c.kind==='reps'?c.count:0,seconds:c.kind==='seconds'?c.elapsed:0,source:'favorite'});S.ui.d282Current=null;save();v27CloseModal();toast('✓ Gespeichert');render()};
// Override only favorite buttons, preserving existing favorite descriptions.
const oldFav=favHtml;favHtml=function(){let html=oldFav();return html.replace(/onclick="brOpen\('([^']+)'\)"/g,(_,id)=>`onclick="d282Start('${id}')"`).replace(/onclick="v28StartExercise\('([^']+)'\)"/g,(_,id)=>`onclick="d282Quick('${id}')"`).replace(/(<button class="b"[^>]*onclick="d282Quick\('([^']+)'\)"[^>]*>)([^<]*)(<\/button>)/g,(_,open,id,label,close)=>`${open}✓ Tracken${close}<button class="b g" onclick="d282Start('${id}')">▶ Start</button>`)};
})();

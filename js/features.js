// v2 feature module, data preserved in trainingsplan-v1
S.ui=S.ui||{};S.palette=S.palette||(S.theme==='dark-gold'?'gold':'petrol');S.mode=S.mode||(S.theme==='dark-gold'?'dark':S.theme==='light'?'light':S.theme==='dark'?'dark':'auto');S.weights=S.weights||[];
S.homeOrder=S.homeOrder||['plans','activities','bpm','weight','breath'];S.homeVisible=S.homeVisible||{};
S.habits.forEach(h=>{h.mode=h.mode||(h.targetDays&&h.targetDays.length?'days':'any');h.weeklyTarget=h.weeklyTarget||3});
S.plans.forEach(p=>{p.name=p.name.replace(/\s*\(Anfänger\)/g,'')});
// Fix missing progressive overload helper in original supplied index
function effective(it,p){
 const lvl=Math.max(0,PROG_LEVELS.indexOf(getPlanLevel(p)));
 const e=ex(it.ex), timed=e&&(isT(e)||isM(e));
 const sets=Math.min(6,Math.max(1,(+it.sets||1)+Math.floor(lvl/2)));
 const reps=Math.max(1,Math.round((+it.reps||1)*(timed?(1+0.12*lvl):(1+0.08*lvl))));
 return {...it,sets,reps};
}
// Repeatable actions never toggle prior completion off: each tap records another occurrence.
function trackHabit(id,isDone){
 const h=S.habits.find(x=>x.id===id);if(!h)return;
 const d=iso(),today=S.habitLog[d]||(S.habitLog[d]={});
 if(isDone){today[id]=(typeof today[id]==='number'?today[id]:(today[id]===true?1:0))+1;h.doneCount=(+h.doneCount||0)+1;if(S.penalty.enabled)S.penalty.balance+=(+h.penaltyDone||0)}
 else {today[id]=false;h.missedCount=(+h.missedCount||0)+1;if(S.penalty.enabled)S.penalty.balance+=(+h.penaltyMiss||0)}
 save();syncWidgets();render();
}
function habitSetup(){return `<div class="settingsRow"><label>Rhythmus <select id="hm" onchange="document.getElementById('hw').style.display=this.value==='week'?'':'none';document.getElementById('act_days_box').style.display=this.value==='days'?'':'none'">${[['any','Jederzeit, beliebig oft'],['week','Ziel pro Woche'],['days','Feste Wochentage']].map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label id="hw" style="display:none">Mal pro Woche <input id="act_week" type="number" min="1" max="30" value="3" style="width:76px"></label></div>`}
const _addHabit=addHabit;
addHabit=function(name,miss,done,days){const mode=document.getElementById('hm')?.value||'any',target=Math.max(1,+document.getElementById('act_week')?.value||3);_addHabit(name,miss,done,mode==='days'?days:[]);const h=S.habits[S.habits.length-1];if(h){h.mode=mode;h.weeklyTarget=target;save()}};
const _today=vToday;
vToday=function(){
 const src=_today();
 const actIndex=src.indexOf('🎯 Aktivitäten & Routinen');
 const actCard=src.lastIndexOf('<div class="c"',actIndex);
 // The generated date, rest controls and plan are the original first block.
 const planHTML=src.slice(0,actCard);
 const tail=src.slice(actCard);
 // Split activities at the exact generated closing-card boundary using a DOM parser.
 const template=document.createElement('template');template.innerHTML=tail;
 const parts=[...template.content.children];
 const activity=parts.shift();
 const extras=parts.map(x=>x.outerHTML).join('');
 const chunks={plans:planHTML,activities:activity?activity.outerHTML:'',bpm:bpmCard(),weight:weightQuick(),breath:breathHint()};
 const keys=['plans','activities','weight','bpm','breath'];
 const order=[...new Set([...(S.homeOrder||keys),...keys])];
 return order.filter(k=>keys.includes(k)&&S.homeVisible?.[k]!==false).map(k=>`<section class="home-section" data-module="${k}">${chunks[k]||''}</section>`).join('')+`<section class="home-extras">${extras}</section>`;
};

function setPalette(x){S.palette=x;save();applyTheme();render()}
function setMode(x){S.mode=x;S.theme=x;save();applyTheme();render()}
const _settings=vSet;
vSet=function(){
 let h=_settings();
 // Remove previous theme card entirely. All choices now live in this one card.
 const themeStart=h.indexOf('<div class="c">');const themeEnd=h.indexOf('</div>',themeStart);
 if(themeStart>=0&&themeEnd>themeStart){const box=document.createElement('template');box.innerHTML=h;const first=box.content.querySelector('.c');if(first)first.remove();h=box.innerHTML}
 const keys={plans:'Heute & Trainingsplan',activities:'Aktivitäten & Routinen',weight:'Gewicht erfassen',bpm:'BPM Metronom',breath:'Atemübungen',finance:'Make me feel it'};
 const order=[...new Set([...(S.homeOrder||[]),...Object.keys(keys)])];S.homeOrder=order;
 const rows=order.map((k,i)=>`<div class="settingsRow"><input aria-label="${keys[k]||k} anzeigen" type="checkbox" ${S.homeVisible?.[k]===false?'':'checked'} onchange="S.homeVisible['${k}']=this.checked;save();render()"><b style="flex:1">${keys[k]||k}</b><button class="chip" onclick="moveHome(${i},-1)" aria-label="Hoch">↑</button><button class="chip" onclick="moveHome(${i},1)" aria-label="Runter">↓</button></div>`).join('');
 return `<h2>Einstellungen</h2><div class="c"><h3>Darstellung</h3><div class="r">${[['auto','🌓 Auto'],['light','☀️ Hell'],['dark','🌙 Dunkel']].map(([k,v])=>`<button class="chip ${S.mode===k?'on':''}" onclick="setMode('${k}')">${v}</button>`).join('')}</div><h3 style="margin-top:14px">Farbschema</h3><div class="r">${[['petrol','Petrol'],['gold','Schwarz/Gold'],['orange','Weiß/Orange']].map(([k,v])=>`<button class="chip ${S.palette===k?'on':''}" onclick="setPalette('${k}')">${v}</button>`).join('')}</div></div><div class="c"><h3>Persönliche Daten</h3><label>Körpergröße (cm)<input id="bodyHeight" type="number" min="80" max="240" step="1" value="${S.height||''}" onchange="setHeight(this.value)"></label><p class="mu">Wird für die BMI-Berechnung im Gewichtsverlauf verwendet.</p></div><div class="c"><h3>Home konfigurieren</h3><p class="mu">Jeder Bereich kann ein- oder ausgeblendet und verschoben werden.</p>${rows}</div><div class="c"><h3>Android Widgets</h3><p class="mu">Aktivität für jedes 1×1 Widget direkt beim Hinzufügen auswählen. Für ein anderes Widget dieselbe Kachel erneut hinzufügen.</p></div>`+h.replace(/^<h2>Einstellungen<\/h2>/,'');
};
function setHeight(input){const v=+input; if(input&&(!Number.isFinite(v)||v<80||v>240)){toast('Größe zwischen 80 und 240 cm eingeben');return}S.height=v||0;save();render()}

function moveHome(i,dir){const j=i+dir;if(j<0||j>=S.homeOrder.length)return;[S.homeOrder[i],S.homeOrder[j]]=[S.homeOrder[j],S.homeOrder[i]];save();render()}
const _plans=vPlans;
vPlans=function(){return _plans().replace('Standardpläne für Einsteiger','Kuratierte Trainingspläne')+`<div class="c"><h3>Weitere Trainingspläne</h3>${CURATED.map((p,i)=>`<div class="settingsRow"><b style="flex:1">${esc(p[0])}</b><button class="chip" onclick="addCurated(${i})">+ Hinzufügen</button></div>`).join('')}</div>`};
const CURATED=window.FITNESS_CATALOG.plans.curated;
function addCurated(n){const t=CURATED[n];if(!t)return;const names=t[1].split(',');const items=names.map(n=>{let x=EX.find(e=>e.n.toLowerCase()===n.toLowerCase())||EX.find(e=>e.n.toLowerCase().includes(n.toLowerCase()));return x?{ex:x.id,sets:isT(x)?2:3,reps:isT(x)?25:10,kg:0}:null}).filter(Boolean);if(!items.length){toast('Keine passenden Übungen gefunden');return}S.plans.push({id:'p'+Date.now(),name:t[0],days:[],pw:3,items,level:'Anfänger'});save();render();toast('Plan angelegt')}
const _edit=vEdit;
vEdit=function(){return _edit().replace('</h2>',`</h2><p class="mu">Die Leistungsstufe ändert Sätze und Wdh./Dauer automatisch. Basiswerte sind hier editierbar.</p>`)};
// Language: safe DOM text translation for existing German interface, without rewriting workout content or field values.
const TRANSLATIONS={'Home':'Home','Pläne':'Plans','Übungen':'Exercises','Verlauf':'History','Einstellungen':'Settings','Meine Pläne':'My plans','Neue Aktivität erstellen':'Create activity','Neue Aktivität':'New activity','Abhaken':'Complete','Erledigt':'Completed','Auslassen':'Skip','Bearbeiten':'Edit','Speichern':'Save','Abbrechen':'Cancel','Löschen':'Delete','Meine Aktivitäten':'My activities','Diese Woche':'This week','Trainingspläne':'Workout plans','Aktivitäten':'Activities','Sprache / Language':'Language','Farben und Helligkeit getrennt':'Colors and brightness separately','Home konfigurieren':'Configure home','Gewicht':'Weight','Größe':'Height','Aktuelles Gewicht':'Current weight','Gewicht erfassen':'Track weight','Ziel pro Woche':'Weekly target','Mal pro Woche':'Times per week','Jederzeit, beliebig oft':'Any time, unlimited','Feste Wochentage':'Fixed weekdays','Kuratierte Trainingspläne':'Curated workout plans','Weitere Trainingspläne':'More workout plans','Plan importieren':'Import plan','Neuer Plan':'New plan','Absolviert':'Completed','Start':'Start','Stufe':'Level','Zurück':'Back','Trainingsplan':'Workout plan','BPM Metronom':'BPM metronome','Historie':'History','Sichtbarkeit und Reihenfolge der Bereiche auf Home.':'Show/hide and order additional modules.'};
function translateDOM(){document.documentElement.lang=S.lang==='en'?'en':'de';if(S.lang!=='en')return;
 const a=document.getElementById('app');if(!a)return;const walk=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);let nd;while(nd=walk.nextNode()){const t=nd.nodeValue,trim=t.trim();if(TRANSLATIONS[trim])nd.nodeValue=t.replace(trim,TRANSLATIONS[trim]);else if(trim.startsWith('Home,'))nd.nodeValue=t.replace('Home,','Home,')}
 document.querySelectorAll('nav button').forEach(b=>{const txt=b.lastChild;if(txt&&txt.nodeType===3&&TRANSLATIONS[txt.textContent.trim()])txt.textContent=TRANSLATIONS[txt.textContent.trim()]});
}
const _render=render;
render=function(){_render();const n=document.querySelector('#act_days_box');if(n&&!document.getElementById('hm'))n.insertAdjacentHTML('beforebegin',habitSetup());if(n)n.style.display='none';if(tab==='today')organizeHome();applyI18N();};
function bpmCard(){return `<div class="c bpm-card"><div class="bpm-layout"><div class="bpm-controls"><h3>🥁 BPM · Metronom</h3><label style="display:block;margin:7px 0">Beats/Minute <input type="number" id="bpmVal" style="max-width:112px" min="30" max="240" value="${S.bpm||100}" onchange="S.bpm=Math.max(30,Math.min(240,+this.value||100));save();if(bpmTimer)bpmStart()"></label><div class="r"><label class="mu"><input type="checkbox" id="bpmSound" ${S.bpmSound!==false?'checked':''} onchange="S.bpmSound=this.checked;save()"> Ton</label><button class="b" onclick="bpmTimer?bpmStop():bpmStart()" id="bpmBtn">${bpmTimer?'Stopp':'Start'}</button></div></div><div id="beatCircle">${S.bpm||100}</div></div></div>`}

let bpmTimer=null,bpmNext=0,audioCtx=null;
function bpmStop(){clearInterval(bpmTimer);bpmTimer=null;const b=document.getElementById('bpmBtn');if(b)b.textContent='Start'}
function bpmStart(){bpmStop();S.bpm=Math.max(30,Math.min(240,+document.getElementById('bpmVal')?.value||S.bpm||100));save();bpmNext=performance.now();function tick(){const now=performance.now();while(now>=bpmNext){beat();bpmNext+=60000/S.bpm}}tick();bpmTimer=setInterval(tick,15);const b=document.getElementById('bpmBtn');if(b)b.textContent='Stopp'}
function beat(){const el=document.getElementById('beatCircle');if(el){el.textContent=S.bpm;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');setTimeout(()=>el.classList.remove('pulse'),120)}if(S.bpmSound!==false){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type='triangle';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(320,t+.06);g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.085);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.09)}catch(e){}}}
function weightQuick(){const entry=S.weights.at(-1),bmi=entry&&S.height?entry.kg/(S.height/100)**2:null;return `<div class="c"><div class="r" style="justify-content:space-between"><h3>⚖️ Gewicht</h3><button class="chip" onclick="go('hist')">📈 Verlauf →</button></div><label class="mu" for="weightVal">Gewicht (kg)</label><div class="weight-entry"><button class="stepper" aria-label="Gewicht minus 0,1 kg" onclick="weightStep(-0.1)">−</button><input aria-label="Gewicht in Kilogramm" id="weightVal" type="number" min="20" max="400" step="0.1" inputmode="decimal" value="${entry?entry.kg:''}"><button class="stepper" aria-label="Gewicht plus 0,1 kg" onclick="weightStep(0.1)">+</button><button class="b weight-save" onclick="addWeight()">Speichern</button></div><p class="mu" style="margin:8px 0 0">${entry?'Letzter Wert: '+entry.kg.toFixed(1)+' kg':'Noch keine Einträge'}${bmi?' · BMI '+bmi.toFixed(1):''}</p></div>`}
function weightStep(v){const el=document.getElementById('weightVal');if(!el)return;const current=Number(el.value)||S.weights.at(-1)?.kg||70;el.value=(Math.max(20,Math.min(400,Math.round((current+v)*10)/10))).toFixed(1)}

function addWeight(){const val=+document.getElementById('weightVal')?.value;if(!(val>=20&&val<=400)){toast('Gewicht zwischen 20 und 400 kg eingeben');return}S.weights.push({date:new Date().toISOString(),kg:val});S.weights.sort((a,b)=>a.date.localeCompare(b.date));save();render()}
function weightChart(){const ar=S.weights.slice(-30);if(ar.length<2)return '<small class="mu">Nach zwei Einträgen erscheint der Verlauf.</small>';const min=Math.min(...ar.map(x=>x.kg))-1,max=Math.max(...ar.map(x=>x.kg))+1;const pts=ar.map((x,i)=>`${12+i*296/(ar.length-1)},${110-(x.kg-min)/(max-min)*95}`).join(' ');return `<svg role="img" aria-label="Gewichtsverlauf" viewBox="0 0 320 130" style="width:100%;height:auto"><line x1="12" y1="110" x2="308" y2="110" stroke="var(--bd)"/><polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${ar.map((x,i)=>`<circle cx="${12+i*296/(ar.length-1)}" cy="${110-(x.kg-min)/(max-min)*95}" r="3" fill="var(--ac)"><title>${x.date.slice(0,10)}: ${x.kg} kg</title></circle>`).join('')}</svg><small class="mu">${ar[0].date.slice(0,10)} bis ${ar.at(-1).date.slice(0,10)}</small>`}
const _hist=vHist;
vHist=function(){return `<div class="c"><h3>Gewichtsverlauf</h3>${weightChart()}<div style="max-height:180px;overflow:auto">${S.weights.slice().reverse().map((x,i)=>`<div class="settingsRow"><span style="flex:1">${x.date.slice(0,10)}</span><b>${x.kg.toFixed(1)} kg</b><button class="chip" onclick="deleteWeight('${x.date}')">✕</button></div>`).join('')}</div></div>`+_hist()};
function deleteWeight(date){S.weights=S.weights.filter(x=>x.date!==date);save();render()}
function breathHint(){return `<div class="c"><h3>🌬️ Atemübungen nach Zweck</h3><div class="r" style="flex-wrap:wrap;gap:8px"><button class="b g" onclick="openBreath('Entspannen')">🌿 Entspannen</button><button class="b g" onclick="openBreath('Fokussieren')">🎯 Fokussieren</button><button class="b g" onclick="openBreath('Runterkommen')">🌙 Runterkommen</button></div></div>`}
function openBreath(purpose){cat='Atmen';reg='Alle Regionen';eq='';sub=purpose==='Fokussieren'?'Konzentration':purpose==='Runterkommen'?'Schlaf':'Beruhigung';opn=null;go('lib')}


function syncWidgets(){try{if(window.AndroidBridge?.sync)window.AndroidBridge.sync(JSON.stringify({habit:S.habits.find(x=>x.id===S.widgetHabit)?.name||'Aktivität',habitId:S.widgetHabit||'',snapshot:JSON.stringify({habits:S.habits,habitLog:S.habitLog,penalty:S.penalty}),plan:S.plans[0]?.name||'Kein Plan',next:(S.plans[0]?.items||[]).map(x=>ex(x.ex)?.n).find(Boolean)||'Training starten'}))}catch(e){}}
window.addEventListener('focus',()=>{try{let cmd=window.AndroidBridge?.consumeAction?.();if(cmd==='start')go('today')}catch(e){}});


// Central language dictionary. New UI: use tr('key') rather than German literals.
const I18N=window.FITNESS_CATALOG.translations;
function tr(key,values={}){let text=(I18N[S.lang]||I18N.de)[key]||I18N.de[key]||key;return text.replace(/\{(\w+)\}/g,(_,k)=>String(values[k]??''));}
function switchLanguage(code){S.lang=code==='en'?'en':'de';save();render();}
function applyI18N(){const root=document.getElementById('app');if(!root)return;document.documentElement.lang=S.lang==='en'?'en':'de';const trans=I18N.en;const rev=Object.fromEntries(Object.entries(I18N.de).map(([k,v])=>[v,k]));const should=S.lang==='en';const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const raw=node.nodeValue,clean=raw.trim();if(!clean)continue;const key=rev[clean];if(key&&should)node.nodeValue=raw.replace(clean,trans[key]||clean);}
const buttons=document.querySelectorAll('#nav button');const labels=['home','plans','exercises','history'];buttons.forEach((b,i)=>{const last=b.lastChild;if(last?.nodeType===3&&labels[i])last.textContent=tr(labels[i])});
}
// Full home zones: split the pre-existing Home output into actual sections,
// then apply the saved order to both legacy and new modules.
function organizeHome(){ /* Sections are ordered by vToday() at render time. */ }


function importWidgetEvents(){ /* implemented in tracking-advanced.js */ }


S.qi=((S.qi==null?-1:S.qi)+1)%QUOTES.length;save();applyTheme();render();syncWidgets();

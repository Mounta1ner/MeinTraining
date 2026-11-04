/* Mein Training 2.7: additive functionality; legacy data stays under trainingsplan-v1. */
const V27_DEFAULT_ORDER=['plans','activities','favorites','pause','quote','weight','bpm','breath','challenge','streak','finance'];
S.v27=S.v27||{};
S.v27.notifications=S.v27.notifications||{training:false,activities:false,weekly:false,streak:false,time:'18:00'};
S.v27.badges=S.v27.badges||[];
S.v27.challenge=S.v27.challenge||null;
S.v27.challengeEvents=S.v27.challengeEvents||[];
S.v27.onboarded=Boolean(S.v27.onboarded);
S.v27.restSeconds=S.v27.restSeconds||45;
S.v27.restOn=S.v27.restOn!==false;
const v27EffectiveOriginal=effective;effective=function(it,p){return p?.intro?{...it,sets:it.sets||1,reps:it.reps||10}:v27EffectiveOriginal(it,p)};
// Expand home order without changing the existing arrangement, never delete saved preferences.
S.homeOrder=[...new Set([...(S.homeOrder||[]),...V27_DEFAULT_ORDER])];
const V27_QUOTES=[
 ['Der beste Zeitpunkt zum Starten ist jetzt.','Motivation'],
 ['Es ist egal, wie schnell du gehst, solange du nicht stehen bleibst.','Motivation'],
 ['Der Wille ist der Anfang von allem.','Motivation'],
 ['Just do it.','Motivation'],
 ['Wir müssen uns alle zwischen zwei Dingen entscheiden: Dem Schmerz der Disziplin oder dem Schmerz des Bedauerns.','Motivation']
];
for(const q of V27_QUOTES)if(!QUOTES.some(x=>x[0]===q[0]))QUOTES.push(q);
const v27s=(de,en)=>S.lang==='en'?en:de;
function v27Text(k){return tr(k)}
function v27Save(){save();syncWidgets()}
function v27Clip(html){const t=document.createElement('template');t.innerHTML=html;return t}
function v27HomeParts(){ // Extract old rendered blocks with a real browser parser.
 const t=v27Clip(_today());const chunks={plans:[],activities:[],favorites:[],pause:[],quote:[]};let context='plans';
 for(const child of [...t.content.children]){
  const title=(child.querySelector('h3')?.textContent||'').toLowerCase(),body=child.textContent||'';
  if(child.tagName==='H2'&&body.trim().startsWith('Home'))continue;
  if(child.classList.contains('sc')&&body.includes('Pause-Timer'))context='pause';
  else if(title.includes('aktivitäten & routinen'))context='activities';
  else if(title.includes('favoriten')||body.includes('Als Favorit'))context='favorites';
  else if(child.classList.contains('c')&&/text-align:\s*center/.test(child.getAttribute('style')||'')&&(!title||title.includes('spruch')))context='quote';
  else if(context==='pause')context='plans';
  chunks[context].push(child.outerHTML);
  // No bleed from activities to the subsequent entries.
  if(context==='activities')context='plans';
 }
 return Object.fromEntries(Object.entries(chunks).map(([k,v])=>[k,v.join('')]));
}
function v27BadgeCard(){const records=S.plans.filter(p=>v27CompletionCount(p.id)>=3).map(p=>({p,streak:v27Streak(p)}));const active=records.filter(x=>x.streak>=1);
 const hab=S.habits.filter(h=>(h.doneCount||0)>=3);
 if(!active.length&&!hab.length)return '';
 return `<div class="c"><h3>🔥 ${v27s('Trainingsserien & Meilensteine','Training streaks & milestones')}</h3>${active.map(({p,streak})=>`<div class="settingsRow"><b style="flex:1">${esc(p.name)}</b><span>🔥 ${streak} ${v27s('Wochen','weeks')}</span></div>`).join('')}${hab.map(h=>`<span class="chip" style="display:inline-block;margin:3px">⭐ ${esc(h.name)} · ${h.doneCount||0}×</span>`).join('')}</div>`;
}
function v27CompletionCount(pid){return Object.keys(S.log||{}).filter(d=>{const p=S.plans.find(x=>x.id===pid);return p&&planPct(p,d)>=100}).length}
function v27Streak(p){let streak=0;const now=new Date();now.setHours(12,0,0,0);const base=new Date(now);base.setDate(base.getDate()-wd(base));
 let allComplete=0;
 for(let k=0;k<52;k++){const start=new Date(base);start.setDate(start.getDate()-7*k);const end=new Date(start);end.setDate(end.getDate()+6);let done=0;
 for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);if(planPct(p,iso(d))>=100)done++}
 const required=p.days?.length?p.days.length:(+p.pw||1);
 if(done>=required){streak++;allComplete+=done}else if(k===0)continue;else break;
 }return streak;
}
function v27ChallengeGoal(){const c=S.v27.challenge;if(!c)return 0;return Math.min(c.goal,Math.max([5,10,15][c.level]||5,((c.best||0)+[2,4,6][c.level])))}
function v27ChallengeCard(){const c=S.v27.challenge;if(!c)return '';
 const p=Math.min(100,Math.round(100*(c.best||0)/c.goal));return `<div class="c"><h3>💪 ${v27s('Liegestütz-Challenge','Push-up challenge')}</h3><div class="r"><b>${c.best||0} / ${c.goal}</b><span class="mu">${p}%</span></div><div class="bar"><i style="width:${p}%"></i></div><p class="mu">${v27s('Nächste Einheit','Next session')}: <b>${v27ChallengeGoal()}</b> · ${v27s('Persönlicher Rekord','Personal best')}: <b>${c.best||0}</b></p><button class="b" onclick="v27Counter()">▶ ${v27s('Challenge starten','Start challenge')}</button> <button class="chip" onclick="v27ConfigureChallenge()">✎</button> <button class="chip" onclick="v27DeleteChallenge()">✕</button></div>`}
function v27Home(){const blocks=v27HomeParts();const cards={...blocks,weight:weightQuick(),bpm:bpmCard(),breath:breathHint(),streak:v27BadgeCard(),challenge:v27ChallengeCard(),finance:financeHome()};
 // Use original helper for favorite content, independent from plan/activities.
 cards.favorites=(S.fav||[]).length?favHtml():'';cards.quote=quoteHtml();
 cards.pause=`<div class="c"><h3>⏳ ${v27Text('pause')}</h3><div class="r">${[30,60,90].map(n=>`<button class="chip" onclick="tmStart(${n},'Pause')">${n}s</button>`).join('')}</div></div>`;
 return S.homeOrder.filter(k=>S.homeVisible?.[k]!==false).map(k=>!cards[k]?'':`<section data-module="${k}" class="home-section">${cards[k]}</section>`).join('');
}
vToday=v27Home;
// Consistent labels even in legacy navigation after each render.
const v27OldNav=nav;
nav=function(){v27OldNav();const btns=document.querySelectorAll('#nav button');const labels=[['home','🏠'],['plans','📋'],['exercises','💪'],['history','📈']];btns.forEach((b,i)=>{if(!labels[i])return;b.innerHTML=`<span style="font-size:24px;display:block;line-height:1.15">${labels[i][1]}</span>${v27Text(labels[i][0])}`;});};
// Header/footer is now outside Home; page-imprint only in Settings.
const v27OldSet=vSet;
vSet=function(){const t=v27Clip(v27OldSet());const legacy=[...t.content.querySelectorAll('.c')].filter(e=>/Kalender-Erinnerung|Pläne sichern|Verlauf sichern/.test(e.querySelector('h3')?.textContent||'')).map(x=>x.outerHTML).join('');
 const titles={plans:v27Text('workout'),activities:v27Text('activities'),favorites:v27Text('favorites'),pause:v27Text('pause'),quote:'Motivationsspruch',weight:v27Text('weight'),bpm:'BPM',breath:v27Text('breathing'),challenge:'Liegestütz-Challenge',streak:'Streaks',finance:'Make me feel it'};
 const order=S.homeOrder.map((k,i)=>`<div class="settingsRow"><label style="flex:1"><input type="checkbox" ${S.homeVisible?.[k]===false?'':'checked'} onchange="S.homeVisible['${k}']=this.checked;v27Save();render()"> ${titles[k]||esc(k)}</label><button class="chip" onclick="moveHome(${i},-1)">↑</button><button class="chip" onclick="moveHome(${i},1)">↓</button></div>`).join('');
 return `<h2>${v27Text('settings')}</h2><div class="c"><h3>${v27s('Darstellung','Appearance')}</h3><div class="r">${[['auto','Auto'],['light',v27Text('light')],['dark',v27Text('dark')]].map(([k,v])=>`<button class="chip ${S.mode===k?'on':''}" onclick="setMode('${k}')">${v}</button>`).join('')}</div><p>${v27s('Farbschema','Color palette')}</p><div class="r">${[['petrol','Petrol'],['gold','Schwarz/Gold'],['orange','Weiß/Orange']].map(([k,v])=>`<button class="chip ${S.palette===k?'on':''}" onclick="setPalette('${k}')">${v}</button>`).join('')}</div><h3 style="margin-top:12px">${v27Text('language')}</h3><button class="chip" onclick="switchLanguage('de')">Deutsch</button> <button class="chip" onclick="switchLanguage('en')">English</button></div>
 <div class="c"><h3>${v27Text('homeConfig')}</h3>${order}</div><div class="c"><h3>${v27s('Persönliche Daten','Personal settings')}</h3><label>${v27Text('weightHistory')} / ${v27s('Körpergröße (cm)','Height (cm)')}<input type="number" min="80" max="240" value="${S.height||''}" onchange="setHeight(this.value)"></label></div>
 ${v27NotificationSettings()}<div class="c"><h3>${v27s('Training','Workout')}</h3><label>${v27s('Automatische Pause nach Satz/Übung','Automatic rest after set/exercise')} <input type="checkbox" ${S.v27.restOn?'checked':''} onchange="S.v27.restOn=this.checked;v27Save()"></label><label>${v27s('Pausendauer in Sekunden','Rest length in seconds')}<input type="number" min="5" max="300" value="${S.v27.restSeconds}" onchange="S.v27.restSeconds=Math.max(5,Math.min(300,+this.value||45));v27Save()"></label><button class="chip" onclick="v27ConfigureChallenge()">💪 ${v27s('Liegestütz-Challenge konfigurieren','Configure push-up challenge')}</button></div>
 <div class="c"><h3>FAQ</h3>${v27FAQ()}</div><div class="c"><h3>${v27Text('privacy')}</h3><details><summary>${v27s('Datenschutzhinweise anzeigen','Read privacy information')}</summary>${v27Privacy()}</details><h3 style="margin-top:14px">${v27s('Impressum','Imprint')}</h3><p>Marvin Berger · <a href="mailto:marvin.berger@gmail.com">marvin.berger@gmail.com</a></p></div>${legacy}<div class="c"><h3>Native Android Widgets</h3><p class="mu">${v27s('Beim Hinzufügen jedes 1×1-Widgets kannst du eine eigene Aktivität auswählen. Die App zuvor einmal öffnen.','Choose a different activity for each 1×1 widget when adding it. Open the app once first.')}</p></div>`;
};
function v27FAQ(){return [
 [v27s('Wie funktioniert die Intensität?','How do intensity levels work?'),v27s('Stufen verändern die wirksamen Sätze und Wiederholungen. Beim Planbearbeiten bleiben die Basiswerte erhalten.','Levels adapt effective sets and reps; editable base values are retained.')],
 [v27s('Wie verwende ich Favoriten?','How do I use favorites?'),v27s('Bei Übungen ★ wählen. Die Favoriten erscheinen automatisch auf Home, wenn aktiviert.','Tap ★ on an exercise. Favorites appear on Home when enabled.')],
 [v27s('Was bedeuten geplante Einheiten?','What are scheduled sessions?'),v27s('Feste Tage sind nach Tagesabschluss fällig. Flexible Wochenziele werden nach Wochenabschluss ausgewertet.','Fixed days end at midnight; flexible targets are evaluated after the week ends.')],
 [v27s('Wie werden Streaks berechnet?','How are streaks calculated?'),v27s('Nur erfüllte Wochen zählen. Die Anzeige erscheint nach mindestens 3 erfolgreichen Trainingseinheiten.','Only completed weeks count. Visible after at least three successful sessions.')],
 [v27s('Wie funktionieren Erinnerungen?','How do reminders work?'),v27s('In der Android-App einzeln aktivieren. Die nächsten 14 Tage werden lokal geplant, ohne externen Push-Dienst.','Enable each type in Android settings. The coming 14 days are scheduled locally.')],
 [v27s('Wie sichere ich Daten?','How can I back up my data?'),v27s('Verwende die vorhandenen Exportfunktionen. Die Übertragung erfolgt nur, wenn du Daten selbst weitergibst.','Use existing export functions. Transfer only occurs if you share exported data.')]
 ].map(([title,answer])=>`<details><summary>${esc(title)}</summary><p>${esc(answer)}</p></details>`).join('')}
function v27Privacy(){return `<p>${v27s('Trainingseinheiten, Aktivitäten, Gewicht und Einstellungen werden lokal im Browser- oder App-Speicher des Geräts gespeichert. Die App benötigt kein Benutzerkonto und sendet keine dieser Aufzeichnungen an einen eigenen Server.','Exercises, activity, weight and settings are stored locally in the device browser or app storage. No account or own backend is required.')}</p><p>${v27s('Wenn du einen Sicherungscode, Export oder Link selbst kopierst, weiterleitest oder öffnest, bestimmst du Empfänger und Absicherung. Externe Seiten können eigene Datenverarbeitungen vornehmen.','If you copy or share an export or open a link, you control destination and security. External sites may process data under their own terms.')}</p><p>${v27s('Löschen der App-Daten entfernt lokal gespeicherte Aufzeichnungen. Optionale lokale Android-Benachrichtigungen werden erst nach Zustimmung aktiviert.','Clearing app data removes local records. Optional Android notifications are enabled only by permission.')}</p>`}
function v27NotificationSettings(){const n=S.v27.notifications,options=[['training',v27s('Trainingstage','Training days')],['activities',v27s('Aktivitäten','Activities')],['weekly',v27s('Wochenziel','Weekly target')],['streak',v27s('Streak-Erinnerungen','Streak reminders')]];
 return `<div class="c"><h3>🔔 ${v27s('Lokale Benachrichtigungen','Local notifications')}</h3><p class="mu">${v27s('Standardmäßig aus. Android fragt gegebenenfalls nach Berechtigung. Auf der Web-App werden keine Android-Meldungen angezeigt.','Off by default. Android may request permission. The website does not send Android notifications.')}</p>${options.map(([k,title])=>`<label class="settingsRow"><input type="checkbox" data-reminder="${k}" ${n[k]?'checked':''}> ${title}</label>`).join('')}<label>${v27s('Uhrzeit','Time')}<input type="time" id="v27ReminderTime" value="${n.time||'18:00'}"></label><button class="b" onclick="v27ApplyReminders()">${v27Text('save')}</button></div>`}
async function v27ApplyReminders(){const n=S.v27.notifications;document.querySelectorAll('[data-reminder]').forEach(e=>n[e.dataset.reminder]=e.checked);n.time=document.getElementById('v27ReminderTime')?.value||'18:00';v27Save();await v27ScheduleNotifications();render()}
async function v27ScheduleNotifications(){const plugin=window.Capacitor?.Plugins?.LocalNotifications;if(!plugin)return;
 try{const n=S.v27.notifications;const active=['training','activities','weekly','streak'].some(k=>n[k]);if(active){let perm=await plugin.checkPermissions();if(perm.display!=='granted'){perm=await plugin.requestPermissions();if(perm.display!=='granted'){toast(v27s('Bitte Android-Benachrichtigungen erlauben.','Please allow Android notifications.'));return}}}
 const existing=await plugin.getPending();const owned=existing.notifications.filter(x=>x.id>=27000&&x.id<27500);if(owned.length)await plugin.cancel({notifications:owned.map(x=>({id:x.id}))});if(!active)return;
 const [h,m]=(n.time||'18:00').split(':').map(Number),list=[];let id=27000;
 for(let d=0;d<14;d++){const at=new Date();at.setDate(at.getDate()+d);at.setHours(h,m,0,0);if(at<=new Date())continue;const weekday=wd(at),key=iso(at);
 const add=(title,body)=>list.push({id:id++,title,body,schedule:{at}});
 if(n.training&&S.plans.some(p=>p.days.length?p.days.includes(weekday):true))add(v27s('Training ist fällig','Workout time'),v27s('Du kannst deinen Trainingsplan heute abhaken.','Your workout is ready today.'));
 if(n.activities&&S.habits.some(a=>a.mode==='days'?a.targetDays.includes(weekday):a.mode!=='week'))add(v27s('Aktivität nicht vergessen','Activity reminder'),v27s('Ein kleiner Schritt zählt.','Every step counts.'));
 if(n.weekly&&weekday===6)add(v27s('Wochenziel prüfen','Check weekly goal'),v27s('Wie viele Einheiten fehlen noch?','How many sessions are left?'));
 if(n.streak&&weekday===5)add(v27s('Bleib dran!','Keep going!'),v27s('Deine Trainingsserie freut sich über eine weitere Einheit.','Keep your streak going.'));
 }if(list.length)await plugin.schedule({notifications:list});
 }catch(e){console.warn('Local notifications',e);toast(v27s('Android-Erinnerung konnte nicht geplant werden.','Could not schedule native reminder.'))}}
// First run welcomes only truly new installations; an existing v2.6 local state is not overwritten.
function v27Welcome(){let hasHistory=S.plans.length||S.habits.length||S.fav.length||Object.keys(S.log).length||S.weights.length;
 if(hasHistory){S.v27.onboarded=true;v27Save();return}
 v27Modal(`<h2>${v27s('Gut, dass du hier bist!','Glad you are here!')}</h2><p>${v27s('Der erste Schritt ist wichtig, wähle dein Level und wir starten gleich los.','The first step is important. Choose your level and let’s get moving.')}</p><select id="v27IntroLevel"><option value="0">${v27s('Anfänger','Beginner')} · 5 × / 15 s</option><option value="1">${v27s('Fortgeschritten','Intermediate')} · 10 × / 30 s</option><option value="2">${v27s('Intensiv','Intense')} · 15 × / 50 s</option></select><p class="mu">Liegestütze + Abfahrtshocke</p><button class="b" onclick="v27StartOnboarding()">${v27s('Los geht’s','Let’s go')}</button>`,false)
}
function v27StartOnboarding(){const idx=+document.getElementById('v27IntroLevel')?.value||0,levels=[0,2,3],puid='p'+Date.now();const push=ex('e4');
 let ski=all().find(x=>/Abfahrtshocke|Wandsitzen/.test(x.n));if(!ski){ski={id:'c_intro_ski',n:'Abfahrtshocke',al:['Ski squat hold'],c:'Dehnung',m:'Wand',d:'In sicherem Stand in die Abfahrtshocke sinken und kurz halten.',s:'Aufrecht',e:'Abfahrtshocke halten',g:'Beinkraft',x:'Bei Kniebeschwerden Belastung reduzieren',fig:['24,7,24,13,24,27,24,36,24,44,24,20,24,27','24,12,24,18,24,32,32,34,32,44,24,25,24,32']};S.custom.push(ski)}
 const p={id:puid,name:v27s('Dein erster Schritt','Your first step'),days:[],pw:1,level:PROG_LEVELS[levels[idx]],items:[{ex:'e4',sets:1,reps:[5,10,15][idx],kg:0},{ex:ski.id,sets:1,reps:[15,30,50][idx],kg:0}],intro:true};S.plans.push(p);S.v27.onboarded=true;S.v27.introPlan=puid;v27Save();v27CloseModal();go('today')}
// Achievements on reaching 100% are emitted once for each plan and local date.
function v27Milestone(kind,id,n){for(const goal of [3,5,10,25,50])if(n===goal){const key=kind+':'+id+':'+goal;if(S.v27.badges.some(x=>x.key===key))return;S.v27.badges.push({key,at:new Date().toISOString(),name:'⭐ '+goal+' '+v27s('Abschlüsse','completions')});v27Save();v27Toast(v27s('⭐ Neuer Meilenstein!','⭐ New milestone!'))}}
function v27Toast(t){toast(t)}
let V27_DONE_RAF=0;
function v27Celebrate(t){clearTimeout(V27_DONE_RAF);V27_DONE_RAF=setTimeout(()=>v27Modal(`<h2>🏆 ${v27s('Geschafft!','Completed!')}</h2><p>${esc(t)}</p><button class="b" onclick="v27CloseModal()">${v27s('Weiter','Continue')}</button>`,false),90)}
const v27Tick=tick, v27TickNext=tickNext;
function v27OnPlanProgress(dt,pid,before){const p=S.plans.find(x=>x.id===pid);if(!p)return;
 const after=planPct(p,dt),dayKey=dt,pctCount=v27CompletionCount(pid);
 if(before<100&&after>=100){v27Milestone('plan',pid,pctCount);v27Celebrate(v27s('Plan abgeschlossen: ','Workout complete: ')+p.name);}
}
tick=function(dt,pid,i,n){const p=S.plans.find(x=>x.id===pid),before=p?planPct(p,dt):0;const old=((S.log[dt]||{})[pid]||{})[i]||0;
 v27Tick(dt,pid,i,n);v27OnPlanProgress(dt,pid,before);
 const effectiveIt=p&&p.items[i]?effective(p.items[i],p):null;
 if(p&&S.v27.restOn&&(old<n)&&n<=effectiveIt?.sets&&planPct(p,dt)<100){tmStart(S.v27.restSeconds,'Pause',()=>{v27GoSound()})}
};
tickNext=function(dt,pid,i,max){const p=S.plans.find(x=>x.id===pid),before=p?planPct(p,dt):0;v27TickNext(dt,pid,i,max);v27OnPlanProgress(dt,pid,before);
 if(p&&S.v27.restOn&&planPct(p,dt)<100)tmStart(S.v27.restSeconds,'Pause',()=>{v27GoSound()});};
function v27GoSound(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(610,AC.currentTime);o.frequency.setValueAtTime(900,AC.currentTime+.12);g.gain.value=.17;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.3)}catch(e){}}
const v27OldTmTick=tmTick;
tmTick=function(){const was=tm?.end&&tm.end-Date.now()<=0;v27OldTmTick();if(was)v27GoSound()};
const v27TrackHabit=trackHabit;
trackHabit=function(id,done){v27TrackHabit(id,done);const h=S.habits.find(x=>x.id===id);if(h&&done){v27Milestone('habit',id,h.doneCount||0)};};
function v27Modal(html,closable=true){let node=document.getElementById('v27Overlay');if(!node){node=document.createElement('div');node.id='v27Overlay';document.body.appendChild(node)}node.innerHTML=`<div class="v27Modal">${html}${closable?`<button class="chip" onclick="v27CloseModal()">✕ ${v27Text('close')}</button>`:''}</div>`;node.style.display='flex'}
function v27CloseModal(){const n=document.getElementById('v27Overlay');if(n)n.style.display='none'}
function v27ConfigureChallenge(){const c=S.v27.challenge;v27Modal(`<h2>${v27s('Liegestütz-Challenge','Push-up challenge')}</h2><label>${v27s('Ziel Wiederholungen','Target repetitions')}<input id="v27Goal" type="number" min="5" max="500" value="${c?.goal||50}"></label><label>${v27Text('level')}<select id="v27Level">${[0,1,2].map(i=>`<option value="${i}" ${c?.level===i?'selected':''}>${[v27s('Anfänger','Beginner'),v27s('Fortgeschritten','Intermediate'),v27s('Intensiv','Intense')][i]}</option>`).join('')}</select></label><p class="mu">${v27s('Schrittweise um +2 / +4 / +6 Wiederholungen steigern, je nach Startlevel.','Progress by +2 / +4 / +6 reps based on level.')}</p><button class="b" onclick="v27SaveChallenge()">${v27Text('save')}</button>`)}
function v27SaveChallenge(){const goal=+document.getElementById('v27Goal')?.value,level=+document.getElementById('v27Level')?.value||0;if(!Number.isInteger(goal)||goal<5||goal>500)return toast('Ziel: 5–500');S.v27.challenge={goal,level,best:S.v27.challenge?.best||0};v27Save();v27CloseModal();render()}
function v27DeleteChallenge(){if(!confirm(v27s('Challenge entfernen?','Delete challenge?')))return;S.v27.challenge=null;v27Save();render()}
function v27Counter(){const c=S.v27.challenge;if(!c)return;let left=v27ChallengeGoal();v27Modal(`<h2>${v27s('Tippe pro Liegestütz einmal','Tap once per push-up')}</h2><button class="v27Counter" id="v27CountButton" onclick="v27CountTap()">${left}</button><button style="margin-top:18px" class="chip" onclick="v27CloseModal()">${v27s('Schließen','Close')}</button>`,false);document.getElementById('v27CountButton').dataset.left=left;document.getElementById('v27CountButton').dataset.total=left}
function v27CountTap(){const btn=document.getElementById('v27CountButton');let left=+btn.dataset.left-1;if(left<0)return;btn.dataset.left=left;btn.textContent=left;if(left===0){const c=S.v27.challenge,n=+btn.dataset.total;c.best=Math.max(c.best||0,n);S.v27.challengeEvents.push({at:new Date().toISOString(),count:n});if(n>=c.goal){S.v27.badges.push({key:'challenge:'+Date.now(),at:new Date().toISOString(),name:'🏆 Push-up Challenge'})}v27Save();v27Celebrate(v27s('Liegestütze geschafft: ','Push-ups completed: ')+n);}}
// Preserve the original history and append the new ordering: activities, weight, finance collapsible.
const v27OriginalHistory=_hist;
vHist=function(){const old=v27OriginalHistory();const weights=`<div class="c"><h3>${v27Text('weightHistory')}</h3>${weightChart()}<div style="max-height:160px;overflow:auto">${S.weights.slice().reverse().map(w=>`<div class="settingsRow">${esc(w.date.slice(0,10))} · <b>${(+w.kg).toFixed(1)} kg</b></div>`).join('')}</div><p class="mu">${v27s('BMI ist ein Richtwert; Muskelmasse wird nicht berücksichtigt.','BMI is only a rough estimate and does not account for muscle mass.')}</p></div>`;
 const finance=`<div class="c"><details><summary><b>⚡ Make me feel it · ${v27Text('history')}</b></summary>${financeHistory()}</details></div>`;
 const challenge=S.v27.challenge?`<div class="c"><h3>💪 Challenge · ${v27Text('history')}</h3>${S.v27.challengeEvents.slice(-30).reverse().map(x=>`<div class="settingsRow">${new Date(x.at).toLocaleString(S.lang==='en'?'en-GB':'de-AT')} · ${x.count}×</div>`).join('')}</div>`:'';
 const milestones=S.v27.badges.length?`<div class="c"><h3>🏆 ${v27s('Erfolge','Achievements')}</h3>${S.v27.badges.map(x=>`<span class="chip" style="display:inline-block;margin:3px">${esc(x.name)}</span>`).join('')}</div>`:'';
 return old+activityHistory()+weights+challenge+milestones+finance;
};
// Add challenge creation from Plans tab without replacing its existing functionality.
const v27Plans=vPlans;
vPlans=function(){return v27Plans()+`<div class="c"><h3>💪 Liegestütz-Challenge</h3><button class="b g" onclick="v27ConfigureChallenge()">${v27s('Ziel festlegen','Set target')}</button></div>`};
const v27RenderFinal=render;
render=function(){v27RenderFinal();document.title='Mein Training';if(tab==='set')document.querySelectorAll('#app details').forEach(x=>x.classList.add('v27Details'))};
// Native widget queue consumes actual events. Existing legacy event map remains valid.
function v27WidgetSync(){try{window.AndroidBridge?.sync?.(JSON.stringify({habits:S.habits,plans:S.plans,palette:S.palette,theme:S.mode}))}catch(e){}}
const v27SavedSync=syncWidgets;
syncWidgets=function(){v27SavedSync();v27WidgetSync()};
function v27ResumeWidgets(){try{importWidgetEvents()}catch(e){console.warn(e)}}
window.addEventListener('focus',()=>{v27ResumeWidgets();v27WidgetSync();v27ScheduleNotifications()});
setTimeout(()=>{v27WidgetSync();v27ResumeWidgets();v27ScheduleNotifications();if(!S.v27.onboarded)v27Welcome();render()},160);
v27Save();render();

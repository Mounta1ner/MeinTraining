/* Mein Training 2.8: additive fixes; legacy storage key and catalog IDs unchanged. */
(function(){
 'use strict';
 S.exerciseHistory=Array.isArray(S.exerciseHistory)?S.exerciseHistory:[];
 const previousApplyTheme=applyTheme;
 applyTheme=function(){previousApplyTheme();const palette=['petrol','gold','orange'].includes(S.palette)?S.palette:'petrol';
 const icon='./assets/icon-'+palette+'-32.png';
 const logo=document.getElementById('v28HeaderLogo');if(logo)logo.src='./assets/icon-'+palette+'-192.png';
 const favicon=document.querySelector('link[rel="icon"]');if(favicon)favicon.href=icon;
 try{window.AndroidBridge?.sync?.(JSON.stringify({palette}));}catch(_){}
 };
 const originalSettings=vSet;
 vSet=function(){let html=originalSettings();if(!html.includes('financeEnabled')&&!html.includes('toggleFinance(this.checked)'))html+=financeSettings();return html;};
 const originalHistory=vHist;
 vHist=function(){const html=originalHistory();const rows=S.exerciseHistory.slice(-60).reverse().map(e=>`<div class="settingsRow">${esc(new Date(e.at).toLocaleString(S.lang==='en'?'en-GB':'de-AT'))} · ${esc(e.name)} · ${e.reps}×</div>`).join('');return html+(rows?`<div class="c"><h3>Absolvierte Einzelübungen</h3>${rows}</div>`:'');};
 window.v28TrackExercise=function(id,reps=1){const e=ex(id);if(!e)return;const n=Math.max(1,Math.min(999,Math.round(Number(reps)||1)));S.exerciseHistory.push({id:e.id,name:e.n,reps:n,at:new Date().toISOString()});save();try{navigator.vibrate?.(70)}catch(_){}toast('✓ '+e.n+' erfasst');render();};
 window.v28StartExercise=function(id,reps){const e=ex(id);if(!e)return;const n=Math.max(1,Math.min(999,Math.round(Number(reps)||10)));v27Modal(`<h2>${esc(e.n)}</h2><p>Tippe einmal pro Wiederholung.</p><button class="v27Counter" id="v28Counter" data-id="${esc(e.id)}" data-total="${n}" data-left="${n}" onclick="v28TapExercise()">${n}</button><button class="chip" onclick="v27CloseModal()">Schließen</button>`,false);};
 window.v28TapExercise=function(){const b=document.getElementById('v28Counter');if(!b)return;const n=Math.max(0,Number(b.dataset.left)-1);b.dataset.left=n;b.textContent=n;if(!n){const id=b.dataset.id,total=Number(b.dataset.total);v27CloseModal();v28TrackExercise(id,total);}};
 // Display Make Me Feel It even if v27 rebuilt settings from selected legacy sections.
 const previousFAQ=v27FAQ;
 v27FAQ=function(){return previousFAQ().concat([[v27s('Wie wird die Intensität berechnet?','How is intensity calculated?'),v27s('Die Basiswerte bleiben unverändert. Pro Stufe steigen Wiederholungen um 8 %, zeitbasierte Werte um 12 %. Alle zwei Stufen kommt ein Satz hinzu, maximal sechs Sätze. Die Werte werden gerundet.','Base values remain unchanged. Reps increase by 8% per level, time values by 12%. One set is added every two levels, capped at six; values are rounded.')]]);};

 window.v28StartPlanSet=function(id,reps,day,planId,index){
  const e=ex(id);if(!e)return;
  const n=Math.max(1,Math.min(999,Math.round(Number(reps)||1)));
  v27Modal(`<h2>${esc(e.n)}</h2><p>Satz: Tippe einmal je Wiederholung.</p><button class="v27Counter" id="v28Counter" data-id="${esc(e.id)}" data-total="${n}" data-left="${n}" onclick="v28TapExercise()">${n}</button><button class="chip" onclick="v27CloseModal()">Schließen</button>`,false);
  const b=document.getElementById('v28Counter');b.dataset.day=day;b.dataset.plan=planId;b.dataset.index=index;
 };
 const oldTap=window.v28TapExercise;
 window.v28TapExercise=function(){const b=document.getElementById('v28Counter');if(!b)return;
  const day=b.dataset.day,plan=b.dataset.plan,index=b.dataset.index;
  if(!plan){oldTap();return;}
  const n=Math.max(0,Number(b.dataset.left)-1);b.dataset.left=n;b.textContent=n;
  if(n===0){const id=b.dataset.id,total=Number(b.dataset.total);v27CloseModal();
   S.exerciseHistory.push({id,name:ex(id)?.n||id,reps:total,at:new Date().toISOString(),planId:plan});
   save();tickNext(day,plan,Number(index),Math.max(1,effective(S.plans.find(p=>p.id===plan).items[Number(index)],S.plans.find(p=>p.id===plan)).sets));
   toast('✓ Satz abgeschlossen');try{navigator.vibrate?.(90)}catch(_){}
  }
 };
 // Optional, conservative push-up program. Progress every third completed session, no forced daily escalation.
 function v28PushPlan(){const c=S.v27?.challenge;if(!c)return null;
  const state=S.v28Push||(S.v28Push={base:Math.max(2,Math.min(30,Math.floor((c.best||5)*0.6))),completed:0,events:[]});
  const step=Math.floor(state.completed/3),base=Math.min(c.goal, state.base+step);
  const sets=[base,Math.max(1,base-2),Math.max(1,base-1),Math.max(1,base-3),Math.max(1,base-1)];
  return sets;
 }
 window.v28PushStart=function(){const sets=v28PushPlan();if(!sets)return toast('Bitte zuerst Challenge-Ziel festlegen');
  S.v28Push.index=0;save();v28PushNext();
 };
 window.v28PushNext=function(){const sets=v28PushPlan();if(!sets)return;const i=S.v28Push.index||0;
  if(i>=sets.length){S.v28Push.completed++;S.v28Push.events.push({at:new Date().toISOString(),sets});save();v27CloseModal();toast('✓ Trainingseinheit abgeschlossen');render();return;}
  const n=sets[i];v27Modal(`<h2>Liegestütze · Satz ${i+1}/${sets.length}</h2><p>Tippe jede Wiederholung an. Zwischen den Sätzen ausreichend pausieren.</p><button class="v27Counter" id="v28PushCounter" data-left="${n}" onclick="v28PushTap()">${n}</button><button class="chip" onclick="v27CloseModal()">Training unterbrechen</button>`,false);
 };
 window.v28PushTap=function(){const b=document.getElementById('v28PushCounter');if(!b)return;const n=Math.max(0,Number(b.dataset.left)-1);b.dataset.left=n;b.textContent=n;
  if(n===0){S.v28Push.index++;save();v28PushNext();}
 };
 const oldPlans=vPlans;
 vPlans=function(){const html=oldPlans();const sets=v28PushPlan();return html+(sets?`<div class="c"><h3>Liegestütz-Trainingsplan</h3><p>5 Sätze: ${sets.join(' / ')} Wiederholungen. Steigerung nach je 3 abgeschlossenen Einheiten.</p><button class="b" onclick="v28PushStart()">▶ Training starten</button><p class="mu">Pausen nach Bedarf; bei Überlastung abbrechen.</p></div>`:'');};
})();

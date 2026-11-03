
// Format: Name|Alias1,Alias2|Kategorie|Material|Beschreibung|Start|Ende
const EX = window.FITNESS_CATALOG.exercises;
const isM=e=>!!e&&(e.sub==="Ausdauer"||!!e.br);const unit=e=>isM(e)?"Min.":isT(e)?"Sek.":"Wdh.";
const DAYS=["Mo","Di","Mi","Do","Fr","Sa","So"];

// --- INITIAL STATE ---
let S = { custom: [], plans: [], log: {}, habits: [], habitLog: {}, fav: [], penalty: { enabled: false, balance: 0.0 }, ui: { actCompact: false }, lang: "de", theme: "auto" };
try {
  const t = localStorage.getItem("trainingsplan-v1");
  if (t) {
    const parsed = JSON.parse(t);
    S = Object.assign(S, parsed);
    if (!S.habits) S.habits = [];
    if (!S.habitLog) S.habitLog = {};
    if (!S.fav) S.fav = [];
    if (!S.penalty) S.penalty = { enabled: false, balance: 0.0 };
    if (!S.ui) S.ui = { actCompact: false };
  }
} catch(e) {}

function save(){try{localStorage.setItem("trainingsplan-v1",JSON.stringify(S))}catch(e){toast("Speichern im Browser nicht möglich (Speicher voll?).")}}

// Navigation & Back-Button
let navHistory = [];
function go(t, pushHist = true) {
  if (pushHist && tab !== t) navHistory.push(tab);
  tab = t;
  ed = null;
  const bb = document.getElementById("navBackBtn");
  if (bb) bb.style.display = (tab !== "today" || navHistory.length > 0) ? "inline-flex" : "none";
  render();
}
function appBack() {
  if (ed) { ed = null; render(); return; }
  if (rm) { rm = null; render(); return; }
  if (cf) { cf = false; render(); return; }
  if (opn) { opn = null; render(); return; }
  if (typeof chAct !== "undefined" && chAct) { chAct = false; render(); return; }
  if (navHistory.length > 0) {
    const prev = navHistory.pop();
    go(prev, false);
  } else {
    go("today", false);
  }
}

// Touch-optimiertes Einklappen von Übungsbeschreibungen
function closeDet(id) {
  if (opn === id) opn = null;
  tdo[id] = false;
  render();
}

// Progressions-Stufen
const PROG_LEVELS = ["Anfänger", "Amateur", "Fortgeschritten", "Intensiv", "Intensiv L2", "Intensiv L3", "Intensiv L4"];
function getPlanLevel(p) { return p.level || "Anfänger"; }
function setPlanLevel(pid, lvl) {
  const p = S.plans.find(x => x.id === pid);
  if (!p) return;
  p.level = lvl;
  save();
  render();
  toast(p.name + ": Stufe auf " + lvl + " geändert");
}
function planRecentDoneCount(p) {
  let count = 0;
  const now = new Date();
  for (let k = 0; k < 14; k++) {
    const d = new Date(now);
    d.setDate(now.getDate() - k);
    if (planPct(p, iso(d)) >= 100) count++;
  }
  return count;
}
function levelUpPlan(pid) {
  const p = S.plans.find(x => x.id === pid);
  if (!p) return;
  const curIdx = PROG_LEVELS.indexOf(getPlanLevel(p));
  if (curIdx < PROG_LEVELS.length - 1) {
    p.level = PROG_LEVELS[curIdx + 1];
    save();
    render();
    toast("🎉 " + p.name + " auf Stufe " + p.level + " erhöht!");
  }
}

// Aktivitäten / Gewohnheiten Tracking
let chAct = false;
function trackHabitLegacy(id, isDone) {
  const h = S.habits.find(x => x.id === id);
  if (!h) return;
  const dt = iso(new Date());
  S.habitLog[dt] = S.habitLog[dt] || {};
  const prev = S.habitLog[dt][id];
  if (prev === isDone) {
    delete S.habitLog[dt][id];
    if (isDone) h.doneCount = Math.max(0, (h.doneCount || 1) - 1);
    else h.missedCount = Math.max(0, (h.missedCount || 1) - 1);
  } else {
    S.habitLog[dt][id] = isDone;
    if (isDone) {
      h.doneCount = (h.doneCount || 0) + 1;
      if (S.penalty.enabled && h.penaltyDone) S.penalty.balance += (+h.penaltyDone || 0);
    } else {
      h.missedCount = (h.missedCount || 0) + 1;
      if (S.penalty.enabled && h.penaltyMiss) S.penalty.balance += (+h.penaltyMiss || 0);
    }
  }
  save();
  render();
}
function addHabit(name, missRate, doneRate, days) {
  if (!name.trim()) { toast("Bitte einen Namen für die Aktivität angeben."); return; }
  const newH = {
    mode: window.habitMode || "days", weeklyTarget: +document.getElementById("act_week")?.value || 3,
    id: "h" + Date.now(),
    name: name.trim(),
    targetDays: days,
    doneCount: 0,
    missedCount: 0,
    penaltyMiss: +missRate || 1.0,
    penaltyDone: +doneRate || 0.0
  };
  S.habits.push(newH);
  chAct = false;
  save();
  render();
  toast("Aktivität '" + newH.name + "' angelegt.");
}
function delHabit(id) {
  if (confirm("Möchtest du diese Aktivität wirklich löschen?")) {
    S.habits = S.habits.filter(x => x.id !== id);
    save();
    render();
    toast("Aktivität gelöscht.");
  }
}
function resetHabitStats(id) {
  const h = S.habits.find(x => x.id === id);
  if (!h) return;
  if (confirm("Statistik für '" + h.name + "' wirklich auf 0 zurücksetzen?")) {
    h.doneCount = 0;
    h.missedCount = 0;
    save();
    render();
    toast("Statistik zurückgesetzt.");
  }
}

// Make Me Feel It Spendenfunktion
function resetPenalty() {
  if (confirm("Hast du den Betrag von " + (S.penalty.balance||0).toFixed(2) + " € gespendet und möchtest das Konto auf 0,00 € zurücksetzen?")) {
    S.penalty.balance = 0.0;
    save();
    render();
    toast("Konto auf 0,00 € zurückgesetzt – vielen Dank für deine Spende! ❤️");
  }
}

// Erweiterte Statistik für Verlauf
function statsExt() {
  let total = 0, lastMonth = 0, missed = 0;
  const now = new Date();
  const thirtyDays = new Date(now.getTime() - 30 * 864e5);
  Object.keys(S.log).forEach(d => {
    const dt = new Date(d + "T12:00:00");
    S.plans.forEach(p => {
      if (planPct(p, d) >= 100) {
        total++;
        if (dt >= thirtyDays && dt <= now) lastMonth++;
      }
    });
  });
  const fixed = S.plans.filter(p => p.days && p.days.length);
  for (let k = 1; k <= 45; k++) {
    const d = new Date(now);
    d.setDate(now.getDate() - k);
    const dateStr = iso(d);
    const w = wd(d);
    fixed.forEach(p => {
      if (p.days.includes(w) && planPct(p, dateStr) < 100) missed++;
    });
  }
  return { total, lastMonth, missed, run: stats().run, best: stats().best };
}

const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const all=()=>EX.concat(S.custom);
const ex=id=>all().find(x=>x.id===id);
const iso=d=>{d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const wd=d=>(d.getDay()+6)%7;
let tab="today",ed=null,q="",eq="",cat="Alle",opn=null,cf=false;

function planPct(p,date){const l=(S.log[date]||{})[p.id]||{};let t=0,d=0;p.items.forEach((it,i)=>{const x=effective(it,p),n=+x.sets;t+=n;d+=Math.min(n,l[i]||0)});return t?Math.round(d/t*100):0}
function nav(){document.getElementById("nav").innerHTML=[["today","Home","⌂"],["plans","Pläne","📋"],["lib","Übungen","💪"],["hist","Verlauf","📈"]].map(([k,v,i])=>`<button class="${tab===k?"on":""}" onclick="go('${k}')"><span style="font-size:24px;display:block;line-height:1.15">${i}</span>${v}</button>`).join("")}
// go() navigation is defined above; preserve history and back button.
function render(){nav();const a=document.getElementById("app");a.innerHTML={today:vToday,plans:vPlans,lib:vLib,hist:vHist,set:vSet}[tab]();if(tab==="lib"&&cf){cvInit("cvS");cvInit("cvE")}if(tab==="hist")try{cntUp()}catch(e){}}

function vToday(){
 const now=new Date(),dt=iso(now),w=wd(now);
 const ps=S.plans.filter(p=>p.days.length?p.days.includes(w):(p.flexAlways||weekDone(p)<(p.pw||1)||planPct(p,dt)>0));
 let h=`<h2>Home, ${DAYS[w]} ${now.toLocaleDateString("de-AT")}</h2><div class="r sc" style="margin-bottom:6px"><span class="mu" style="flex:none">Pause-Timer:</span>${[30,60,90].map(s=>`<button class="chip" onclick="tmStart(${s},'Pause')">${s} s</button>`).join("")}</div>`;

 // 1. Vorschlag zur Stufenerhöhung (Progression)
 ps.forEach(p=>{
   if(planRecentDoneCount(p)>=3 && PROG_LEVELS.indexOf(getPlanLevel(p)) < PROG_LEVELS.length-1){
     const nextLvl = PROG_LEVELS[PROG_LEVELS.indexOf(getPlanLevel(p))+1];
     h+=`<div class="c" style="border:1.5px solid var(--mc);background:linear-gradient(135deg,var(--card),var(--ac2))"><div class="r" style="justify-content:space-between"><b>⭐ Stufen-Erhöhung empfohlen!</b><span class="chip on" style="font-size:11px">${getPlanLevel(p)} ➔ ${nextLvl}</span></div><p class="mu" style="font-size:13px;margin:4px 0 8px">Du hast „${esc(p.name)}“ in den letzten 2 Wochen mehrfach gemeistert. Bereit für die nächste Stufe?</p><button class="b" onclick="levelUpPlan('${p.id}')">Auf Stufe „${nextLvl}“ erhöhen</button></div>`;
   }
 });

 // 2. Heutiger Plan (einklappbar)
 if(!S.plans.length){
   h+=`<div class="c" style="text-align:center;padding:16px 12px"><p style="font-weight:600;margin-bottom:4px">Noch keine Pläne zugewiesen</p><p class="mu" style="font-size:13px;margin-bottom:12px">Wähle einen der vorbereiteten Standardpläne (z. B. Büro-Fit, Bauch-Beine-Po, Läufer) oder erstelle deinen eigenen Plan.</p><button class="b" onclick="go('plans')">📋 Zu den Plänen & Vorlagen</button></div>`;
 } else if(!ps.length){
   h+=`<div class="c mu">Für heute ist kein Training fällig. Du hast ${S.plans.length} aktive Pläne.</div>`;
 } else {
   ps.forEach(p=>{const l=((S.log[dt]||{})[p.id])||{};const pc=planPct(p,dt);
    const isCol = S.ui["planCol_"+p.id];
    h+=`<div class="c">
      <div class="r" style="cursor:pointer;justify-content:space-between;user-select:none" onclick="S.ui['planCol_${p.id}']=!S.ui['planCol_${p.id}'];save();render()">
        <div style="flex:1">
          <h3 style="display:inline-block">${esc(p.name)}</h3>
          <span class="chip" style="font-size:11px;padding:2px 8px;margin-left:6px">${getPlanLevel(p)}</span>
        </div>
        <span style="font-size:18px;color:var(--mu);min-width:32px;text-align:right">${isCol?"▼":"▲"}</span>
      </div>
      <div class="r" style="margin-top:7px"><span class="mu">Stufe:</span><select aria-label="Leistungsstufe" style="width:auto;max-width:195px" onchange="setPlanLevel('${p.id}',this.value)">${PROG_LEVELS.map(l=>`<option ${getPlanLevel(p)===l?"selected":""}>${l}</option>`).join("")}</select></div><div class="bar" style="margin-top:6px"><i style="width:${pc}%"></i></div>
      <div class="r" style="justify-content:space-between;margin-top:4px"><span class="mu" style="font-size:13px">${pc>=100?"✓ Fertig für heute":pc+"% geschafft"}</span><span class="mu" style="font-size:12px">${p.items.length} Übungen</span></div>
      ${p.days.length?"":(()=>{const d=weekDone(p),n=p.pw||1;return`<div class="mu" style="margin-top:4px;font-size:13px">📆 Diese Woche: ${"●".repeat(Math.min(d,n))}${"○".repeat(Math.max(0,n-d))} <b>${d} von ${n}</b>${d>=n?" · 🎉 Wochenziel erreicht":" · noch "+(n-d)}</div>`})()}
      
      <div style="${isCol?"display:none":""};margin-top:10px">
    `;
    p.items.forEach((it,i)=>{const e=ex(it.ex);if(!e)return;const dn=l[i]||0;it=effective(it,p);
     h+=`<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--bd)"><div class="r" style="justify-content:space-between"><b style="cursor:pointer" onclick="tg('${p.id}_${i}')">${esc(e.n)} ${tdo[p.id+"_"+i]?"▲":"▼"}</b> <span class="mu" style="font-size:13px">${it.sets} × ${it.reps}${unit(e)!=="Wdh."?" "+unit(e):""}${+it.kg?" · "+it.kg+" kg":""}</span></div><div class="r" style="margin-top:6px">`;
     for(let s=1;s<=it.sets;s++)h+=`<button class="set ${dn>=s?"on":""}" onclick="tick('${dt}','${p.id}',${i},${s})">${s}</button>`;
     h+=`${e.br?`<button class="b" onclick="brOpen('${e.id}',${it.reps},'${dt}','${p.id}',${i})">🌬️ ${it.reps} min</button>`:unit(e)!=="Wdh."?`<button class="b g" onclick="holdT('${dt}','${p.id}',${i})">▶ ${it.reps} ${unit(e)==="Min."?"min":"s"}</button>`:""}</div>${tdo[p.id+"_"+i]?`<div class="c" style="background:var(--bg)">${detTxt(e)}<div style="margin-top:10px;text-align:right"><button class="b g" style="min-height:44px;padding:6px 14px;border-radius:8px" onclick="closeDet('${p.id}_${i}')">▲ Beschreibung einklappen</button></div></div>`:""}</div>`});
    h+=`</div></div>`});
 }

 // 3. Aktivitäten & Routinen (Tracking, Erstellen, Kompakt vs. Ausgeklappt)
 const habitsDue = (S.habits||[]);
 const habitLogToday = S.habitLog[dt] || {};
 const dueCount = habitsDue.length;
 const doneHabitCount = habitsDue.filter(hb=>habitLogToday[hb.id]===true).length;

 h+=`<div class="c">
   <div class="r" style="justify-content:space-between;align-items:center">
     <div><h3>🎯 Aktivitäten & Routinen</h3><span class="mu" style="font-size:12px">${dueCount ? (doneHabitCount + " von " + dueCount + " heute erledigt") : "Noch keine Aktivitäten angelegt"}</span></div>
     <div class="r" style="gap:6px">
       <button class="b g" style="font-size:12px;padding:4px 10px;min-height:36px" onclick="chAct=!chAct;render()">+ Neu</button>
       ${dueCount ? `<button class="chip ${S.ui.actCompact?"":"on"}" style="font-size:12px;padding:4px 10px;min-height:36px" onclick="S.ui.actCompact=!S.ui.actCompact;save();render()">${S.ui.actCompact?"Kompakt ▼":"Alle ▲"}</button>` : ""}
     </div>
   </div>
 `;

 if(typeof chAct !== "undefined" && chAct){
   h+=`<div class="c" style="background:var(--bg);margin-top:10px">
     <h4 style="margin:0 0 6px">Neue Aktivität erstellen</h4>
     <input id="act_name" placeholder="z. B. 2.5L Wasser trinken, 10 Min Physio, 7000 Schritte">
     <div class="r" style="margin-top:8px">
       <span class="mu" style="font-size:13px">Wochentage:</span>
       <div class="r" id="act_days_box">${DAYS.map((d,i)=>`<button type="button" class="chip on" data-d="${i}" onclick="this.classList.toggle('on')">${d}</button>`).join("")}</div>
     </div>
     <div class="r" style="margin-top:10px">
       <button class="b" onclick="const days=[...document.querySelectorAll('#act_days_box .chip.on')].map(b=>+b.dataset.d);addHabit(document.getElementById('act_name').value, 0, 0, days)">Aktivität speichern</button>
       <button class="b g" onclick="chAct=false;render()">Abbrechen</button>
     </div>
   </div>`;
 }

 h+=`<div style="margin-top:8px">`;
 if(!S.habits.length){
   h+=`<div class="mu" style="font-size:13px">Tippe oben auf <b>„+ Neu“</b>, um deine erste tägliche Aktivität oder Physio-Routine anzulegen.</div>`;
 } else if(!habitsDue.length){
   h+=`<div class="mu" style="font-size:13px">Für heute sind keine Aktivitäten geplant (${S.habits.length} insgesamt angelegt).</div>`;
 } else if(S.ui.actCompact){
   h+=`<div class="r" style="gap:6px;flex-wrap:wrap">`+habitsDue.map(hb=>{
     const isD = habitLogToday[hb.id]===true || (+habitLogToday[hb.id]||0)>0;
     return `<button class="chip ${isD?"on":""}" style="min-height:38px;font-size:13px" onclick="trackHabit('${hb.id}', true)">${isD?"✓ ":"○ "}${esc(hb.name)} ${+habitLogToday[hb.id]||0}×</button>`;
   }).join("")+`</div>`;
 } else {
   h+=habitsDue.map(hb=>{
     const isD = habitLogToday[hb.id]===true || (+habitLogToday[hb.id]||0)>0;
     return `<div class="r" style="margin-top:8px;padding:6px 0;border-bottom:1px solid var(--bd);align-items:center">
       <span style="flex:1"><b>${esc(hb.name)}</b><br><span class="mu" style="font-size:12px">✓ ${hb.doneCount||0}× absolviert · ✗ ${hb.missedCount||0}× ausgelassen</span></span>
       <div class="r" style="gap:6px">
         <button class="b ${isD?"":"g"}" style="min-height:40px;padding:6px 12px;font-size:13px" onclick="trackHabit('${hb.id}', true)">${isD?"✓ Noch einmal":"Abhaken"}</button>
         <button class="b g" style="min-height:40px;padding:6px 10px;font-size:13px;color:var(--mc)" onclick="trackHabit('${hb.id}', false)">Auslassen</button>
         <button class="x" style="font-size:14px;min-width:32px" onclick="delHabit('${hb.id}')" title="Aktivität löschen">✕</button>
       </div>
     </div>`;
   }).join("");
 }
 h+=`</div></div>`;

 h+=doneWeekHtml()+quoteHtml()+favHtml();

 return h;
}
function tick(dt,pid,i,s){S.log[dt]=S.log[dt]||{};const l=S.log[dt][pid]=S.log[dt][pid]||{},p=S.plans.find(x=>x.id===pid),was=p?planPct(p,dt):0;l[i]=(l[i]||0)>=s?s-1:s;save();render();if(p&&was<100&&planPct(p,dt)>=100){toast("Plan geschafft für heute – stark! 💪");try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}}}

function vPlans(){
 if(ed)return vEdit();
 let h=`<h2>Meine Pläne</h2><div class="r"><button class="b" onclick="newPlan()">+ Neuer Plan</button><button class="b g" onclick="imp()">Plan importieren</button></div>`;
 S.plans.forEach(p=>{h+=`<div class="c"><h3>${esc(p.name)}</h3><div class="r" style="margin:4px 0 6px"><span class="mu">${p.days.length?p.days.map(d=>DAYS[d]).join(", "):p.pw+"× pro Woche (flexibel)"} · ${p.items.length} Übungen · Stufe:</span><select style="width:auto;padding:2px 8px;font-size:12px" onchange="setPlanLevel('${p.id}', this.value)">${PROG_LEVELS.map(l=>`<option value="${l}" ${getPlanLevel(p)===l?"selected":""}>${l}</option>`).join("")}</select></div>${bodyMap(p.items)}
 <div class="r" style="margin-top:8px"><button class="b g" onclick="editPlan('${p.id}')">Bearbeiten</button><button class="b g" onclick="share('${p.id}')">Teilen</button>${cdel===p.id?`<button class="b" style="background:#dc2626;color:#fff" onclick="delPlan('${p.id}')">Wirklich löschen</button><button class="b g" onclick="cdel=null;render()">Abbrechen</button>`:`<button class="x" onclick="delPlan('${p.id}')" title="Löschen">🗑</button>`}</div></div>`});
 h+=`<h2 style="margin-top:22px">Kuratierte Trainingspläne</h2><p class="mu">Startvorschläge, die Gewichte bitte anpassen. Bei Beschwerden oder Vorerkrankungen vorher mit Therapeutin, Therapeut oder Arzt abklären.</p>`+TPL.map((t,i)=>`<div class="c"><h3>${esc(t[0])}</h3><div class="mu">${esc(t[3])}</div><div class="mu" style="margin-top:4px">${t[1].split(",").map(d=>DAYS[d]).join(", ")} · ${t[2].split(";").length} Übungen</div><p class="mu" style="font-size:13px">${esc(t[2].split(";").map(s=>s.split(",")[0]).join(", "))}</p>${bodyMap(t[2].split(";").map(s=>({ex:(EX.find(x=>x.n===s.split(",")[0])||{}).id})))}<button class="b g" onclick="addTpl(${i})">Übernehmen</button></div>`).join("");
 return h}
const isT=e=>!!e&&(e.c==="Dehnung"||["Unterarmstütz","Seitstütz","Wandsitzen","Einbeinstand","Tandemstand","Standwaage","Storchstand","Kissen-Balance","Hoher Stütz","Zehenstand halten","Flamingo-Stand","Tiefe Hocke halten","Wandstütz","Nacken-Isometrie","Greifkraft-Training","Kurzer Fuß"].includes(e.n));
const TPL=window.FITNESS_CATALOG.plans.templates;
function addTpl(i){const t=TPL[i];const items=t[2].split(";").map(s=>{const[n,a,b,c]=s.split(",");const e=EX.find(x=>x.n===n);return e?{ex:e.id,sets:+a,reps:+b,kg:+c}:null}).filter(Boolean);const d=t[1].split(",").map(Number);S.plans.push({id:"p"+Date.now()+i,name:t[0].replace(/\s*\(Anfänger\)/g,""),days:d,pw:d.length,items,level:"Anfänger"});save();toast(t[0]+" übernommen");render()}
let tdo={},cdel=null,reg="Alle Regionen",sub="Alle";function tg(k){tdo[k]=!tdo[k];render()}
function detTxt(e){return`<div class="r" style="margin-top:4px">${fig(e,0,110)}${fig(e,1,110)}</div><p class="mu" style="font-size:13px;margin:6px 0 0">${legend(e)}</p><p>${esc(e.d||"")}</p>${e.s?`<p><b>Start:</b> ${esc(e.s)}<br><b>Ende:</b> ${esc(e.e)}</p>`:""}${e.l?`<p><b>Genauere Anleitung:</b> ${esc(e.l)}</p>`:""}${e.g?`<p><b>Gut bei / Ziel:</b> ${esc(e.g)}</p>`:""}${e.x?`<p><b>Eher nicht machen bei:</b> ${esc(e.x)}</p>`:""}${ytHtml(e)}<a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.n+" Übung Anleitung")}">▶ Videos auf YouTube suchen</a>`}
const REG={"Nacken":/Nack|Halswirbel/,"Schulter":/Schulter|Rotatoren/,"Arm/Hand":/Arm|Bizeps|Trizeps|Handgelenk|Unterarm|Ellbogen|Greifkraft|Tennisarm/,"Rücken":/Rücken|Wirbelsäule|Haltung/,"Rumpf/Bauch":/Rumpf|Bauch/,"Hüfte/Gesäß":/Hüft|Gesäß|Leiste|Becken/,"Knie/Oberschenkel":/Knie|Oberschenkel|Beinkraft/,"Wade/Fuß":/Wade|Fuß|Sprunggelenk|Achilles|Zehen/,"Ganzkörper":/Ganzkörper|Ausdauer|Aufwärmen|Koordination/};
const inReg=(e,r)=>r==="Alle Regionen"||(REG[r]?REG[r].test((e.n||"")+" "+(e.g||"")):true);
function cpId(i){const t=document.getElementById(i);t.focus();t.select();t.setSelectionRange(0,t.value.length);const ok=()=>toast("Kopiert"),fb=()=>{try{document.execCommand("copy")?ok():toast("Bitte den markierten Text manuell kopieren")}catch(e){toast("Bitte den markierten Text manuell kopieren")}};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t.value).then(ok,fb);else fb()}
function expHist(){const rows=["Datum;Plan;Übung;Sätze erledigt;Sätze geplant;Wdh./Sek.;kg;Erfüllung %"];
Object.keys(S.log).sort().forEach(d=>S.plans.forEach(p=>{const l=(S.log[d]||{})[p.id];if(!l)return;p.items.forEach((it,i)=>{const e=ex(it.ex),dn=Math.min(+it.sets,l[i]||0);if(dn)rows.push([d,p.name,e?e.n:"?",dn,it.sets,it.reps,it.kg,Math.round(dn/it.sets*100)].join(";"))})}));
const cu=S.custom.map(c=>({...c,img:undefined,draw:undefined})),code=btoa(unescape(encodeURIComponent(JSON.stringify({log:S.log,plans:S.plans,cu}))));
document.getElementById("app").innerHTML=`<h2>Verlauf exportieren</h2><div class="c"><h3>Tabelle (für Excel oder Notizen)</h3><p class="mu">Spalten durch Semikolon getrennt. Kopieren und in Excel oder eine Tabelle einfügen. Es werden nur Einträge mit erledigten Sätzen aufgelistet.</p><textarea rows="8" id="csv" readonly>${esc(rows.join("\n"))}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cpId('csv')">Tabelle kopieren</button></div></div><div class="c"><h3>Sicherungscode</h3><p class="mu">Enthält Verlauf, Pläne und eigene Übungen (ohne Fotos). Auf einem anderen Gerät unter „Verlauf importieren“ einfügen.</p><textarea rows="4" id="cd" readonly>${code}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cpId('cd')">Code kopieren</button></div></div><button class="b g" onclick="render()">Zurück</button>`}
function impHist(){document.getElementById("app").innerHTML=`<h2>Verlauf importieren</h2><div class="c"><p class="mu">Der Code fügt Verlauf, fehlende Pläne und eigene Übungen hinzu. Vorhandene Einträge bleiben erhalten, bei Doppelungen zählt der höhere Wert.</p><textarea rows="6" id="cd" placeholder="Code hier einfügen"></textarea><div class="r" style="margin-top:8px"><button class="b" onclick="doImpH()">Importieren</button><button class="b g" onclick="render()">Abbrechen</button></div></div>`}
function doImpH(){try{const o=JSON.parse(decodeURIComponent(escape(atob(document.getElementById("cd").value.trim()))));(o.cu||[]).forEach(c=>{if(!S.custom.some(x=>x.id===c.id))S.custom.push(c)});(o.plans||[]).forEach(p=>{if(!S.plans.some(x=>x.id===p.id))S.plans.push(p)});Object.keys(o.log||{}).forEach(d=>{S.log[d]=S.log[d]||{};Object.keys(o.log[d]).forEach(pid=>{const a=S.log[d][pid]=S.log[d][pid]||{},b=o.log[d][pid];Object.keys(b).forEach(i=>{a[i]=Math.max(a[i]||0,b[i])})})});save();toast("Verlauf importiert");go("hist")}catch(e){toast("Der Code ist ungültig.")}}
function bodyMap(items){
const cnt={};Object.keys(REG).forEach(r=>{if(r==="Ganzkörper")return;cnt[r]=items.filter(it=>{const e=ex(it.ex);return e&&inReg(e,r)}).length});
const fo=n=>n?Math.min(1,.35+.2*n):.8,fc=n=>n?"var(--ac)":"var(--bd)";
const sh=(r,x,y,w,h,rx)=>{const n=cnt[r]||0;return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fc(n)}" fill-opacity="${fo(n)}"/>`};
const ci=(r,x,y,rr)=>{const n=cnt[r]||0;return`<circle cx="${x}" cy="${y}" r="${rr}" fill="${fc(n)}" fill-opacity="${fo(n)}"/>`};
const body=(cx,back)=>`<g transform="translate(${cx} 0)"><circle cx="0" cy="10" r="8" fill="var(--bd)" fill-opacity=".8"/>${sh("Nacken",-3,17,6,6,2)}${sh(back?"Rücken":"Rumpf/Bauch",-12,24,24,30,5)}${ci("Schulter",-14,27,6)}${ci("Schulter",14,27,6)}${sh("Arm/Hand",-25,32,7,28,3)}${sh("Arm/Hand",18,32,7,28,3)}${sh("Hüfte/Gesäß",-12,54,24,11,4)}${sh("Knie/Oberschenkel",-12,66,11,22,4)}${sh("Knie/Oberschenkel",1,66,11,22,4)}${sh("Wade/Fuß",-11,89,9,19,4)}${sh("Wade/Fuß",2,89,9,19,4)}</g>`;
const txt=Object.keys(cnt).filter(r=>cnt[r]).sort((a,b)=>cnt[b]-cnt[a]).map(r=>r+" ("+cnt[r]+")").join(" · ");
return`<div class="r" style="margin-top:8px;flex-wrap:nowrap;align-items:flex-start"><svg viewBox="0 0 140 110" width="120" height="94" style="flex:none">${body(35,0)}${body(105,1)}</svg><div class="mu" style="font-size:13px"><b>Angesprochen:</b> ${txt||"–"}<br><span style="font-size:11px">Links Vorderseite, rechts Rückseite. Je dunkler, desto mehr Übungen. Die Zuordnung entsteht automatisch aus den Übungen.</span></div></div>`}
let tm=null,tmi=null,AC=null;
function tmBar(){let b=document.getElementById("tmr");if(!b){b=document.createElement("div");b.id="tmr";b.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px)));background:var(--ac);color:var(--bg);padding:6px 8px 6px 16px;border-radius:12px;z-index:8;display:none;gap:8px;align-items:center;font-weight:700;white-space:nowrap";b.innerHTML='<span id="tmt"></span><button class="x" style="color:var(--bg);min-width:36px;min-height:36px" onclick="tmStop()">✕</button>';document.body.appendChild(b)}return b}
function tmTick(){if(!tm)return;const r=Math.ceil((tm.end-Date.now())/1000);if(r<=0){const a=tm.auto,l=tm.label;tmStop();beep();toast(l+": Zeit abgelaufen");if(a)a();return}tmBar().style.display="flex";document.getElementById("tmt").textContent=tm.label+": "+r+" s"}
function tmStart(s,label,auto){tmStop();try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume()}catch(e){}tm={end:Date.now()+s*1000,label,auto};tmi=setInterval(tmTick,250);tmTick()}
function tmStop(){clearInterval(tmi);tmi=null;tm=null;const b=document.getElementById("tmr");if(b)b.style.display="none"}
function beep(){try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}try{if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=880;g.gain.value=.15;o.start();setTimeout(()=>o.stop(),350)}catch(e){}}
function holdT(dt,pid,i){const p=S.plans.find(x=>x.id===pid),it=p&&effective(p.items[i],p),e=it&&ex(it.ex);if(!e)return;tmStart(unit(e)==="Min."?+it.reps*60:+it.reps,e.n,()=>tickNext(dt,pid,i,+it.sets))}
function tickNext(dt,pid,i,max){S.log[dt]=S.log[dt]||{};const l=S.log[dt][pid]=S.log[dt][pid]||{},p=S.plans.find(x=>x.id===pid),was=p?planPct(p,dt):0;if((l[i]||0)<max){l[i]=(l[i]||0)+1;save();if(tab==="today")render();if(p&&was<100&&planPct(p,dt)>=100)toast("Plan geschafft für heute – stark! 💪")}}
let rm=null;
function remOpen(pid){const p=S.plans.find(x=>x.id===pid);if(!p)return;const d=new Date();d.setDate(d.getDate()+56);const D={1:[2],2:[1,4],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5],7:[0,1,2,3,4,5,6]};rm={pid,days:p.days.length?p.days.slice():(D[p.pw]||[0,2,4]).slice(),time:"18:00",dur:45,pre:10,mode:"count",count:12,until:iso(d)};remView()}
function rmDay(i){rm.days=rm.days.includes(i)?rm.days.filter(x=>x!==i):rm.days.concat(i).sort();remView()}
function remView(){const p=S.plans.find(x=>x.id===rm.pid);if(!p){rm=null;render();return}
document.getElementById("app").innerHTML=`<h2>Erinnerung im Kalender</h2><div class="c"><b>${esc(p.name)}</b><p class="mu">Erstellt eine Kalenderdatei mit wiederkehrenden Terminen. Nach dem Öffnen fragt dein Handy, ob die Termine hinzugefügt werden sollen. Danach erinnert dich der Kalender, auch wenn die App geschlossen ist.</p><p class="mu">Wochentage</p><div class="r">${DAYS.map((d,i)=>`<button class="chip ${rm.days.includes(i)?"on":""}" onclick="rmDay(${i})">${d}</button>`).join("")}</div><p class="mu">Uhrzeit</p><input type="time" value="${rm.time}" oninput="rm.time=this.value"><p class="mu">Dauer</p><select onchange="rm.dur=+this.value">${[15,30,45,60,90].map(v=>`<option value="${v}" ${rm.dur===v?"selected":""}>${v} Min.</option>`).join("")}</select><p class="mu">Erinnerung</p><select onchange="rm.pre=+this.value">${[[0,"Zur Startzeit"],[10,"10 Min. vorher"],[30,"30 Min. vorher"],[60,"1 Std. vorher"],[120,"2 Std. vorher"]].map(([v,l])=>`<option value="${v}" ${rm.pre===v?"selected":""}>${l}</option>`).join("")}</select><p class="mu">Die Termine enden</p><div class="r"><button class="chip ${rm.mode==="count"?"on":""}" onclick="rm.mode='count';remView()">nach Anzahl</button><button class="chip ${rm.mode==="until"?"on":""}" onclick="rm.mode='until';remView()">an einem Datum</button></div>${rm.mode==="count"?`<p class="mu">Anzahl Termine insgesamt</p><input type="number" min="1" max="200" value="${rm.count}" oninput="rm.count=+this.value||1">`:`<p class="mu">Letzter Tag</p><input type="date" value="${rm.until}" oninput="rm.until=this.value">`}</div><div class="r"><button class="b" onclick="makeIcs()">Kalenderdatei erstellen</button><button class="b g" onclick="rm=null;render()">Abbrechen</button></div>`}
function makeIcs(){const p=S.plans.find(x=>x.id===rm.pid);if(!p)return;
if(!rm.days.length){toast("Bitte mindestens einen Wochentag wählen.");return}
if(!/^\d\d:\d\d$/.test(rm.time||"")){toast("Bitte eine Uhrzeit wählen.");return}
const [hh,mm]=rm.time.split(":").map(Number),now=new Date(),pad=n=>String(n).padStart(2,"0");let d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hh,mm);
for(let k=0;k<9&&(!rm.days.includes(wd(d))||d<=now);k++)d.setDate(d.getDate()+1);
const f=x=>x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+"T"+pad(x.getHours())+pad(x.getMinutes())+pad(x.getSeconds());
let rule="FREQ=WEEKLY;BYDAY="+rm.days.map(i=>["MO","TU","WE","TH","FR","SA","SU"][i]).join(",");
if(rm.mode==="until"){var ruleG=null;const u=new Date((rm.until||"")+"T23:59:59");if(isNaN(u)||u<d){toast("Das Enddatum liegt vor dem ersten Termin ("+d.toLocaleDateString("de-AT")+").");return}rule+=";UNTIL="+f(u);ruleG=rule.split(";UNTIL=")[0]+";UNTIL="+u.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z"}else rule+=";COUNT="+Math.max(1,Math.min(200,rm.count||1));
const end=new Date(d.getTime()+rm.dur*60000),q=t=>String(t).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
const desc=p.items.map(it=>{const e=ex(it.ex);return "• "+(e?e.n:"?")+" "+it.sets+" × "+it.reps+(e&&unit(e)!=="Wdh."?" "+unit(e):"")+(+it.kg?" · "+it.kg+" kg":"")}).join("\n");
const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Mein Training//DE","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT","UID:"+p.id+"-"+Date.now()+"@mein-training","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,""),"DTSTART:"+f(d),"DTEND:"+f(end),"RRULE:"+rule,"SUMMARY:"+q("Training: "+p.name),"DESCRIPTION:"+q(desc),"BEGIN:VALARM","TRIGGER:"+(rm.pre?"-PT"+rm.pre+"M":"PT0S"),"ACTION:DISPLAY","DESCRIPTION:"+q("Training: "+p.name),"END:VALARM","END:VEVENT","END:VCALENDAR"];
const fold=l=>{let o="";while(l.length>60){o+=l.slice(0,60)+"\r\n ";l=l.slice(60)}return o+l},txt=L.map(fold).join("\r\n")+"\r\n",fn="Mein-Training-"+p.name.replace(/[^A-Za-z0-9äöüÄÖÜß-]+/g,"-")+".ics";
try{const b=new Blob([txt],{type:"text/calendar;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000)}catch(e){}
const first=d.toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})+" um "+rm.time+" Uhr",tz=(Intl.DateTimeFormat().resolvedOptions().timeZone)||"Europe/Vienna",gcal="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent("Training: "+p.name)+"&dates="+f(d)+"/"+f(end)+"&details="+encodeURIComponent(desc)+"&recur="+encodeURIComponent("RRULE:"+(typeof ruleG==="string"?ruleG:rule))+"&ctz="+encodeURIComponent(tz);
document.getElementById("app").innerHTML=`<h2>Kalenderdatei erstellt</h2><div class="c"><p>Erster Termin: <b>${esc(first)}</b>, danach jeweils ${rm.days.map(i=>DAYS[i]).join(", ")}, ${rm.mode==="count"?rm.count+" Termine insgesamt":"bis "+new Date(rm.until+"T12:00").toLocaleDateString("de-AT")}.</p><p class="mu"><b>iPhone:</b> Tippe nach dem Download auf die Datei (Safari-Download oder Dateien-App) und wähle „Alle hinzufügen“.<br><b>Android:</b> Öffne die heruntergeladene Datei (Benachrichtigung oder Downloads) mit dem Google Kalender.</p></div><div class="c"><h3>Direkt in Google Kalender</h3><p class="mu">Alternative ohne Datei: öffnet Google Kalender mit dem fertig ausgefüllten wiederkehrenden Termin. Die Erinnerung stellst du dort im Termin ein.</p><a class="b" style="display:inline-block;text-decoration:none" target="_blank" rel="noopener" href="${gcal}">📅 In Google Kalender öffnen</a></div><div class="c"><h3>Hat kein Download gestartet?</h3><p class="mu">Dann kopiere den Text, speichere ihn in einer Textdatei mit der Endung .ics und öffne diese. In manchen Vorschauen und eingebetteten Ansichten sind Downloads gesperrt, auf deiner eigenen Adresse (GitHub) funktionieren sie.</p><textarea rows="5" id="ics" readonly>${esc(txt)}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cpId('ics')">Text kopieren</button></div></div><button class="b g" onclick="rm=null;render()">Fertig</button>`}
function setTheme(k){if(k==='dark-gold'){S.palette='gold';S.mode='dark'}else{S.mode=k;S.theme=k}save();applyTheme();render()}
function vSet(){
 const t=S.theme||"auto";
 return `<h2>Einstellungen</h2>
 <div class="c">
   <h3>Darstellung & Design</h3>
   <div class="r">${[["auto","🌓 Auto"],["light","☀️ Hell"],["dark","🌙 Dunkel"],["dark-gold","✨ Schwarz / Gold"]].map(([k,l])=>`<button class="chip ${t===k?"on":""}" onclick="setTheme('${k}')">${l}</button>`).join("")}</div>
   <p class="mu">„Schwarz / Gold“ bietet ein edles OLED-Tiefschwarz mit warmen Gold-Akzenten.</p>
 </div>

 <div class="c">
   <h3>Sprache / Language</h3>
   <div class="r">
     <button class="chip ${S.lang==='de'?'on':''}" onclick="switchLanguage('de')">🇩🇪 Deutsch</button>
     <button class="chip ${S.lang==='en'?'on':''}" onclick="switchLanguage('en')">🇬🇧 English</button>
   </div>
 </div>

 <div class="c">
   <h3>Kalender-Erinnerung (.ics Export)</h3>
   <p class="mu">Erstellt wiederkehrende Kalendertermine mit Erinnerung, die du direkt im Kalender deines Handys übernimmst.</p>
   ${S.plans.length?S.plans.map(p=>`<div class="r" style="margin-top:8px"><span style="flex:1">${esc(p.name)}</span><button class="b g" onclick="remOpen('${p.id}')">📅 Termine (.ics)</button></div>`).join(""):`<p class="mu">Lege zuerst einen Plan an.</p>`}
 </div>

 <div class="c">
   <h3>Pläne sichern & übertragen</h3>
   <div class="r"><button class="b g" onclick="expPlans()">Alle Pläne exportieren</button><button class="b g" onclick="imp()">Pläne importieren</button></div>
 </div>

 <div class="c">
   <h3>Verlauf sichern</h3>
   <div class="r"><button class="b g" onclick="expHist()">Verlauf exportieren</button><button class="b g" onclick="impHist()">Verlauf importieren</button></div>
 </div>`;
}

function expPlans(){const cu=S.custom.map(c=>({...c,img:undefined,draw:undefined})),code=btoa(unescape(encodeURIComponent(JSON.stringify({plans:S.plans,cu}))));
const txt=S.plans.map(p=>p.name+" ("+(p.days.length?p.days.map(d=>DAYS[d]).join(", "):p.pw+"× pro Woche")+")\n"+p.items.map(it=>{const e=ex(it.ex);return "  • "+(e?e.n:"?")+": "+it.sets+" × "+it.reps+(e&&unit(e)!=="Wdh."?" "+unit(e):"")+(+it.kg?" · "+it.kg+" kg":"")}).join("\n")).join("\n\n");
document.getElementById("app").innerHTML=`<h2>Pläne exportieren</h2><div class="c"><h3>Sicherungscode</h3><p class="mu">Enthält alle Pläne und eigene Übungen (ohne Fotos und Zeichnungen). Auf einem anderen Gerät unter „Pläne importieren“ einfügen.</p><textarea rows="4" id="cd" readonly>${code}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cpId('cd')">Code kopieren</button></div></div><div class="c"><h3>Als Text</h3><p class="mu">Zum Ausdrucken oder Weitergeben, z. B. an die Therapeutin oder den Therapeuten.</p><textarea rows="8" id="ptx" readonly>${esc(txt)}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cpId('ptx')">Text kopieren</button></div></div><button class="b g" onclick="render()">Zurück</button>`}
function cvInit(id){const c=document.getElementById(id);if(!c)return;const x=c.getContext("2d");x.lineWidth=6;x.lineCap="round";x.lineJoin="round";x.strokeStyle="#f97316";let dr=false;const pt=ev=>{const r=c.getBoundingClientRect();return[(ev.clientX-r.left)*c.width/r.width,(ev.clientY-r.top)*c.height/r.height]};
c.onpointerdown=ev=>{ev.preventDefault();dr=true;try{c.setPointerCapture(ev.pointerId)}catch(e){}const[a,b]=pt(ev);x.beginPath();x.moveTo(a,b);x.lineTo(a+.1,b+.1);x.stroke();x.beginPath();x.moveTo(a,b);c.dataset.dirty="1"};
c.onpointermove=ev=>{if(!dr)return;const[a,b]=pt(ev);x.lineTo(a,b);x.stroke();x.beginPath();x.moveTo(a,b)};c.onpointerup=c.onpointercancel=()=>{dr=false}}
function cvClear(id){const c=document.getElementById(id);if(!c)return;c.getContext("2d").clearRect(0,0,c.width,c.height);c.dataset.dirty=""}
const QUOTES=[["Auch der längste Weg beginnt mit dem ersten Schritt.","Laozi"],["Steter Tropfen höhlt den Stein.","Sprichwort"],["Übung macht den Meister.","Sprichwort"],["Ein gesunder Geist wohnt in einem gesunden Körper.","Juvenal"],["Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.","Seneca"],["Der Anfang ist die Hälfte des Ganzen.","Aristoteles zugeschrieben"],["Gehen ist die beste Medizin.","Hippokrates zugeschrieben"],["Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die zweitbeste ist jetzt.","Sprichwort"],["Wer rastet, der rostet.","Sprichwort"],["Der Weg ist das Ziel.","Sprichwort"]];
function quoteHtml(){const q=QUOTES[(S.qi||0)%QUOTES.length];return`<div class="c" style="text-align:center;background:linear-gradient(160deg,var(--ac2),var(--card))"><div style="font-size:15px;font-style:italic">„${esc(q[0])}“</div><div class="mu" style="font-size:12px;margin-top:6px">${esc(q[1])}</div></div>`}
function stats(){let total=0;Object.keys(S.log).forEach(d=>S.plans.forEach(p=>{if(planPct(p,d)>=100)total++}));
const fixed=S.plans.filter(p=>p.days.length),born=p=>+String(p.id).slice(1,14)||0,now=new Date();now.setHours(12,0,0,0);let run=0,best=0;const first=fixed.length?Math.min(...fixed.map(born)):Date.now(),n=Math.min(400,Math.max(0,Math.ceil((now.getTime()-first)/864e5)));
for(let k=n;k>=0;k--){const d=new Date(now);d.setDate(now.getDate()-k);const end=new Date(d);end.setHours(23,59,59);const pl=fixed.filter(p=>p.days.includes(wd(d))&&born(p)<=end.getTime());if(!pl.length)continue;const ok=pl.every(p=>planPct(p,iso(d))>=100);if(k===0&&!ok)continue;if(ok){run++;best=Math.max(best,run)}else run=0}
return{total,run,best}}
function statsHtml(){const s=stats(),c=(n,l,i)=>`<div class="c" style="flex:1;min-width:90px;text-align:center;padding:10px 6px"><div style="font-size:22px">${i}</div><div style="font-size:26px;font-weight:800" data-n="${n}">${n}</div><div class="mu" style="font-size:12px">${l}</div></div>`;
return`<div class="r" style="flex-wrap:nowrap;gap:8px">${c(s.run,"Serie laut Plan","🔥")}${c(s.best,"Beste Serie","🏆")}${c(s.total,"Trainings gesamt","✅")}</div>${S.plans.some(p=>!p.days.length)?`<div class="c" style="padding:10px;text-align:center">📆 Wochenserie: <b data-n="${weekStreak()}">${weekStreak()}</b> Wochen in Folge Wochenziel erreicht</div>`:""}<p class="mu" style="font-size:12px;margin:0 0 6px">Serie: aufeinanderfolgende geplante Trainingstage, an denen du alle Pläne mit festen Wochentagen komplett abgehakt hast. Ein noch offener heutiger Tag unterbricht sie nicht. Trainings gesamt: alle Tage, an denen ein Plan zu 100 % geschafft wurde.</p>`}
function cntUp(){document.querySelectorAll("[data-n]").forEach(el=>{const t=+el.dataset.n,t0=performance.now(),st=now=>{const p=Math.min(1,(now-t0)/700);el.textContent=Math.round(t*p);if(p<1)requestAnimationFrame(st)};requestAnimationFrame(st)})}
const subOk=e=>sub==="Alle"||(cat!=="Fitnessstudio"&&cat!=="Atmen")||(cat==="Atmen"?(e.sub||"").indexOf(sub)>=0:e.sub===sub);
function isFav(id){return(S.fav||[]).includes(id)}
function togFav(id){S.fav=isFav(id)?S.fav.filter(x=>x!==id):(S.fav||[]).concat(id);save();render();toast(isFav(id)?"Als Favorit gemerkt – erscheint unter „Home“":"Favorit entfernt")}
function favHtml(){
  const f=(S.fav||[]).map(ex).filter(Boolean);
  if(!f.length) return `<div class="c mu" style="font-size:13px">⭐ <b>Favoriten:</b> Tippe in der Übungsliste bei einer Übung auf „☆ Als Favorit“, um sie hier für den Schnellstart abzulegen.</div>`;
  return `<div class="c">
    <h3>⭐ Meine Favoriten (Schnellstart)</h3>
    <p class="mu" style="font-size:12px;margin:2px 0 8px">Absolviere einzelne Übungen direkt per Fingertipp (Zeit/Wdh):</p>
    ${f.map(e=>`
      <div class="r" style="margin-top:8px;padding:6px 0;border-bottom:1px solid var(--bd);align-items:center">
        <span style="flex:1"><b>${esc(e.n)}</b><br><span class="mu" style="font-size:12px">${esc(e.c)}${e.br?" · "+e.br.min+" Min.":""}</span></span>
        <div class="r" style="gap:6px">
          ${e.br ? `<button class="b" style="min-height:38px;padding:4px 10px;font-size:13px" onclick="brOpen('${e.id}')">🌬️ Start</button>` : `<button class="b" style="min-height:38px;padding:4px 10px;font-size:13px" onclick="toast('✓ 1 Satz ${esc(e.n)} erfasst!');try{navigator.vibrate&&navigator.vibrate(100)}catch(x){}}">✓ Tracken</button>`}
          <button class="b g" style="min-height:38px;padding:4px 8px;font-size:13px" onclick="tg('fav_${e.id}')">Info</button>
          <button class="x" style="font-size:14px;min-width:32px" onclick="togFav('${e.id}')" title="Aus Favoriten entfernen">✕</button>
        </div>
      </div>
      ${tdo["fav_"+e.id]?`<div class="c" style="background:var(--bg)">${detTxt(e)}<div style="margin-top:10px;text-align:right"><button class="b g" style="min-height:44px;padding:6px 14px;border-radius:8px" onclick="closeDet('fav_${e.id}')">▲ Beschreibung einklappen</button></div></div>`:""}
    `).join("")}
  </div>`;
}
let BR=null;const BRC={E:"var(--ac)",e:"var(--ac)",A:"var(--mc)",H:"var(--mu)"};
function orbSvg(i){const r=i==="0"?9:17;return`<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="24" r="21" fill="none" stroke="var(--bd)" stroke-width="1.5"/><circle cx="24" cy="24" r="${r+4}" fill="var(--ac)" opacity=".2"/><circle cx="24" cy="24" r="${r}" fill="var(--ac)" opacity=".9"/></svg>`}
function brPh(p){let lv=.55;const sip=p.indexOf("e")>=0;return p.split(" ").map(x=>{const k=x[0],a=lv;if(k==="E")lv=sip?.88:1;else if(k==="e")lv=1;else if(k==="A")lv=.55;return{k,s:+x.slice(1),a,b:lv,l:k==="E"?"Einatmen":k==="e"?"Nachatmen":k==="A"?"Ausatmen":(lv>.7?"Halten":"Pause")}})}
function brFmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function brOpen(id,min,dt,pid,ix){const e=ex(id);if(!e||!e.br)return;brClose();BR={e,min:min||e.br.min,ph:brPh(e.br.p),state:"idle",el:0,last:0,i:-1,dt,pid,ix};const o=document.createElement("div");o.id="brov";o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;z-index:30;background:var(--bg);overflow:auto;-webkit-overflow-scrolling:touch";document.body.appendChild(o);brView()}
function brClose(){try{BR&&BR.wl&&BR.wl.release&&BR.wl.release().catch(()=>{})}catch(e){}BR=null;const o=document.getElementById("brov");if(o)o.remove()}
function brView(){const o=document.getElementById("brov");if(!o||!BR)return;const e=BR.e,st=BR.state,pat=BR.ph.map(x=>x.l+" "+x.s+" s").join(" · ");
const ctl=st==="idle"?`<div class="r" style="justify-content:center">${[1,2,3,5,10,15].map(m=>`<button class="chip ${BR.min===m?"on":""}" onclick="BR.min=${m};brView()">${m} Min.</button>`).join("")}</div><div class="r" style="justify-content:center;margin-top:10px"><button class="chip ${S.brCue===false?"":"on"}" onclick="S.brCue=S.brCue===false;save();brView()">🔔 Signal ${S.brCue===false?"aus":"an"}</button></div><div class="r" style="justify-content:center;margin-top:12px"><button class="b" style="font-size:18px;padding:14px 40px" onclick="brStart()">▶ Start</button></div>`:st==="done"?`<div class="r" style="justify-content:center"><button class="b" onclick="brClose()">Fertig</button></div>`:`<div class="r" style="justify-content:center"><button class="b" onclick="brPause()">${st==="run"?"⏸ Pause":"▶ Weiter"}</button><button class="b g" onclick="brClose()">Beenden</button></div>`;
o.innerHTML=`<div style="max-width:520px;margin:0 auto;padding:max(14px,max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px))) 16px 32px;text-align:center"><div class="r" style="justify-content:space-between;flex-wrap:nowrap"><b style="font-size:18px;text-align:left">${esc(e.n)}</b><button class="x" onclick="brClose()" aria-label="Schließen">✕</button></div><div class="mu">${esc(e.g.split(",").slice(0,3).join(", "))}</div><svg viewBox="0 0 300 300" style="width:min(82vw,340px);height:auto;display:block;margin:6px auto"><circle cx="150" cy="150" r="132" fill="none" stroke="var(--bd)" stroke-width="8"/><circle id="brArc" cx="150" cy="150" r="132" fill="none" stroke="var(--ac)" stroke-width="8" stroke-linecap="round" stroke-dasharray="829.4" stroke-dashoffset="829.4" transform="rotate(-90 150 150)"/><circle id="brGlow" cx="150" cy="150" r="72" fill="var(--ac)" opacity=".2"/><circle id="brOrb" cx="150" cy="150" r="58" fill="var(--ac)" opacity=".92"/><text id="brLbl" x="150" y="142" text-anchor="middle" font-size="17" font-weight="700" fill="#fff" stroke="rgba(0,0,0,.28)" stroke-width="3" paint-order="stroke">${st==="done"?"Geschafft":"Bereit"}</text><text id="brCnt" x="150" y="184" text-anchor="middle" font-size="44" font-weight="800" fill="#fff" stroke="rgba(0,0,0,.28)" stroke-width="3" paint-order="stroke"></text></svg><div id="brHint" class="mu" style="min-height:20px"></div><div id="brRem" style="font-size:30px;font-weight:800;margin-top:4px">${brFmt(BR.min*60000-BR.el)}</div><div class="bar" style="margin:8px 0"><i id="brBar" style="width:${Math.min(100,BR.el/(BR.min*600))}%"></i></div><div id="brCy" class="mu" style="margin-bottom:12px"></div>${ctl}<p class="mu" style="margin-top:16px;font-size:13px"><b>Rhythmus:</b> ${pat}</p>${st==="idle"?`<p class="mu" style="font-size:13px">${esc(e.d)}</p><p class="mu" style="font-size:12px"><b>Eher nicht bei:</b> ${esc(e.x)}</p>`:""}</div>`}
function brDraw(){if(!BR)return;const q=n=>document.getElementById(n);if(!q("brOrb"))return;const cyc=BR.ph.reduce((a,x)=>a+x.s,0)*1000;let t=BR.el%cyc,i=0;while(i<BR.ph.length-1&&t>=BR.ph[i].s*1000){t-=BR.ph[i].s*1000;i++}
const ph=BR.ph[i],pr=t/(ph.s*1000),lv=ph.a+(ph.b-ph.a)*(.5-.5*Math.cos(Math.PI*pr)),r=105*lv,col=BRC[ph.k],hi=BR.e.br.hi;
q("brOrb").setAttribute("r",r);q("brGlow").setAttribute("r",r+14);q("brOrb").setAttribute("fill",col);q("brGlow").setAttribute("fill",col);q("brArc").setAttribute("stroke-dashoffset",829.4*(1-pr));q("brArc").setAttribute("stroke",col);
q("brLbl").textContent=ph.l;q("brCnt").textContent=Math.ceil(ph.s-t/1000);q("brHint").textContent=ph.k==="A"?(hi[1]||""):(ph.k==="E"||ph.k==="e")?(hi[0]||""):"";
q("brRem").textContent=brFmt(BR.min*60000-BR.el);q("brBar").style.width=Math.min(100,BR.el/(BR.min*600))+"%";q("brCy").textContent="Atemzug "+(Math.floor(BR.el/cyc)+1);return i}
function brCue(k){if(S.brCue===false)return;try{navigator.vibrate&&navigator.vibrate(k==="A"?[80]:k==="H"?[30]:[50])}catch(e){}try{if(!AC)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type="sine";o.frequency.value=k==="A"?392:k==="H"?330:523;g.gain.value=.001;o.connect(g);g.connect(AC.destination);g.gain.exponentialRampToValueAtTime(.12,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.start();o.stop(t+.4)}catch(e){}}
function brStart(){BR.state="run";BR.el=0;BR.i=-1;BR.last=performance.now();try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume()}catch(e){}try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(w=>{if(BR)BR.wl=w}).catch(()=>{})}catch(e){}brView();requestAnimationFrame(brLoop)}
function brPause(){if(BR.state==="run"){BR.state="pause"}else{BR.state="run";BR.last=performance.now();requestAnimationFrame(brLoop)}brView();brDraw()}
function brLoop(){if(!BR||BR.state!=="run")return;const n=performance.now();BR.el+=n-BR.last;BR.last=n;if(BR.el>=BR.min*60000){BR.el=BR.min*60000;brFinish();return}const i=brDraw();if(i!==BR.i){BR.i=i;brCue(BR.ph[i].k)}requestAnimationFrame(brLoop)}
function brFinish(){BR.state="done";try{BR.wl&&BR.wl.release&&BR.wl.release().catch(()=>{})}catch(e){}brView();brCue("A");try{navigator.vibrate&&navigator.vibrate([150,80,150])}catch(e){}if(BR.pid){const p=S.plans.find(x=>x.id===BR.pid);if(p&&p.items[BR.ix])tickNext(BR.dt,BR.pid,BR.ix,+effective(p.items[BR.ix],p).sets)}}
const ADD6_RAW=`Laufen|Joggen,Jogging,Dauerlauf,Running,Laufen im Freien,Ausdauerlauf|Fitnessstudio|Laufschuhe|Starte mit 5 Minuten zügigem Gehen. Laufe dann in einem Tempo, bei dem du dich noch in ganzen Sätzen unterhalten kannst. Als Anfänger wechselst du zwischen Laufen und Gehen und verlängerst die Laufphasen langsam. Zum Schluss 5 Minuten locker gehen und leicht dehnen.|Aufrecht stehen, Blick nach vorn, Schultern locker|Lockerer, gleichmäßiger Laufschritt|Ausdauer, Herz-Kreislauf, Stressabbau, Stimmung, Gewichtskontrolle, Oberschenkel, Wade, Fuß, Hüfte, Knochen, Abnehmen|Akute Schmerzen oder Verletzungen an Knie, Schienbein, Achillessehne, Fuß oder Hüfte; Fieber oder Infekt; bekannte Herz-Kreislauf-Erkrankungen, starkes Übergewicht oder lange Trainingspause: vorher ärztlich abklären; bei stechendem Schmerz sofort abbrechen; nicht bei Glatteis oder schlechter Sicht|28,7,26,13,24,26,17,34,11,36,21,19,24,24;M24 26L31 31L29 38M26 13L31 19L35 15|28,7,26,13,24,26,31,31,29,38,31,19,35,15;M24 26L18 34L11 36M26 13L21 19L24 24|Worauf du beim richtigen Laufen achtest. Haltung: aufrecht, der Blick geht 20 bis 30 Meter nach vorn, Schultern locker und tief, der Oberkörper ist leicht nach vorn geneigt (aus den Fußgelenken, nicht aus der Hüfte). Arme: im Ellbogen etwa im rechten Winkel gebeugt, locker neben dem Körper vor und zurück, die Hände entspannt. Schritt: lieber kurze, schnelle Schritte als weites Ausgreifen. Der Fuß landet möglichst unter dem Körper, nicht weit davor. Ob Ferse oder Mittelfuß ist weniger wichtig als eine weiche, leise Landung. Tempo: gerade so schnell, dass du dich noch unterhalten kannst, besonders am Anfang. Aufbau: Wechsle als Anfänger zwischen Gehen und Laufen und verlängere die Laufphasen von Woche zu Woche, zum Beispiel von 2 Minuten bis hin zu 30 Minuten am Stück. Plane 2 bis 3 Einheiten pro Woche mit Ruhetagen dazwischen. Steigere nicht Umfang und Tempo gleichzeitig, als grobe Faustregel höchstens etwa 10 % mehr pro Woche. Schuhe und Boden: passende Laufschuhe aus dem Fachhandel, Wald- und Feldwege sind gelenkschonender als Asphalt. Schmerz: Muskelkater ist normal, stechende Schmerzen in Gelenken oder Sehnen nicht. Dann pausieren und bei anhaltenden Beschwerden abklären lassen.|Ausdauer`;
ADD6_RAW.split("\n").forEach(l=>{const[n,al,c,m,d,s,e2,g,x,fa,fb,t,sub]=l.split("|");EX.push({id:"e"+EX.length,n,al:al.split(","),c,m,d,s,e:e2,g,x,l:t||"",sub:sub||"",fig:[drawFig(fa),drawFig(fb)]})});
EX.find(e=>e.n==="Laufen").yt={id:"XQ0hB29DMpo",t:"Joggen: Meine 5 Tipps zum Einstieg ins Lauftraining (ARD Gesund, Dr. Julia Fischer)"};
function ytHtml(e){return e.yt?`<div style="margin:8px 0"><a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${e.yt.id}">▶ Video: ${esc(e.yt.t)}</a> <button class="chip" onclick="ytPlay('${e.id}')">Hier abspielen</button><div id="yt_${e.id}"></div></div>`:""}
function ytPlay(id){const e=ex(id),d=document.getElementById("yt_"+id);if(!e||!d)return;d.innerHTML='<div style="position:relative;padding-top:56.25%;margin-top:8px"><iframe src="https://www.youtube-nocookie.com/embed/'+e.yt.id+'" title="Video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p class="mu" style="font-size:12px">Startet das Video nicht, öffne es über den Link.</p>'}
function weekDone(p,ref){const r=ref||new Date(),m=new Date(r.getFullYear(),r.getMonth(),r.getDate()-wd(r));let n=0;for(let i=0;i<7;i++){const d=new Date(m);d.setDate(m.getDate()+i);if(planPct(p,iso(d))>=100)n++}return n}
function doneWeekHtml(){const dt=iso(),l=S.plans.filter(p=>!p.days.length&&weekDone(p)>=(p.pw||1)&&planPct(p,dt)<=0).map(p=>p.name);return l.length?`<div class="mu" style="font-size:13px;margin:6px 0">✅ Wochenziel erreicht: ${l.map(esc).join(", ")}</div>`:""}
function weekStreak(){const fl=S.plans.filter(p=>!p.days.length);if(!fl.length)return 0;const born=p=>+String(p.id).slice(1,14)||0;let n=0;const now=new Date();for(let k=0;k<60;k++){const r=new Date(now.getFullYear(),now.getMonth(),now.getDate()-7*k),end=new Date(r.getFullYear(),r.getMonth(),r.getDate()-wd(r)+6,23,59,59),pl=fl.filter(p=>born(p)<=end.getTime());if(!pl.length)break;if(pl.every(p=>weekDone(p,r)>=(p.pw||1)))n++;else if(k>0)break}return n}
function toast(m){const d=document.createElement("div");d.textContent=m;d.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px)));background:var(--tx);color:var(--bg);padding:10px 16px;border-radius:10px;z-index:9;max-width:90%";document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function addToPlan(id){const v=document.getElementById("ap_"+id).value,e=ex(id),t=isT(e),it={ex:id,sets:isM(e)?1:t?2:3,reps:e&&e.br?e.br.min:isM(e)?15:t?30:10,kg:0};let m;if(v==="new"){const n="Neuer Plan "+(S.plans.length+1);S.plans.push({id:"p"+Date.now(),name:n,days:[],pw:3,items:[it]});m="„"+n+"“ angelegt (unter Pläne umbenennbar)"}else{const p=S.plans.find(x=>x.id===v);if(!p)return;p.items.push(it);m="Zu „"+p.name+"“ hinzugefügt"}save();toast(m);render()}
function newPlan(){ed={id:"p"+Date.now(),name:"",days:[],pw:3,items:[],mode:"days"};q="";render()}
function editPlan(id){ed=JSON.parse(JSON.stringify(S.plans.find(p=>p.id===id)));ed.mode=ed.days.length?"days":"week";q="";render()}
function delPlan(id){if(cdel!==id){cdel=id;render();return}cdel=null;S.plans=S.plans.filter(p=>p.id!==id);save();toast("Plan gelöscht");render()}
function vEdit(){
 const res=q?all().filter(m).slice(0,8):[];
 function m(e){return mt(e,q)}
 let h=`<h2>${S.plans.some(p=>p.id===ed.id)?"Plan bearbeiten":"Neuer Plan"}</h2><div class="c"><label class="mu">Name</label><input value="${esc(ed.name)}" oninput="ed.name=this.value" placeholder="z. B. Knie-Reha">
 <p class="mu">Wann soll der Plan fällig sein?</p><div class="r"><button class="chip ${ed.mode==="week"?"":"on"}" onclick="ed.mode='days';render()">Feste Wochentage</button><button class="chip ${ed.mode==="week"?"on":""}" onclick="ed.mode='week';render()">Mal pro Woche</button></div><div class="r" style="margin-top:8px;${ed.mode==="week"?"display:none":""}">${DAYS.map((d,i)=>`<button class="chip ${ed.days.includes(i)?"on":""}" onclick="tgl(${i})">${d}</button>`).join("")}</div>
 ${ed.mode==="week"?`<p class="mu">Wie oft pro Woche?</p><div class="r"><button class="chip" onclick="ed.pw=Math.max(1,ed.pw-1);render()">−</button><b style="font-size:22px;min-width:34px;text-align:center">${ed.pw}</b><button class="chip" onclick="ed.pw=Math.min(7,ed.pw+1);render()">+</button><span class="mu">× pro Woche</span></div><p class="mu" style="font-size:13px">Der Plan steht ab Montag unter „Home“ als fällig, bis du ihn so oft abgehakt hast wie hier eingestellt.</p>`:""}</div>
 <div class="c"><div class="r" style="justify-content:space-between"><b>Leistungsstufe</b><select style="width:auto;max-width:210px" onchange="ed.level=this.value;render()">${PROG_LEVELS.map(l=>`<option ${getPlanLevel(ed)===l?'selected':''}>${l}</option>`).join('')}</select></div><p class="mu" style="font-size:12px">Die Grundwerte bleiben editierbar. Die wirksamen Sätze und Wiederholungen werden darunter angezeigt.</p></div>
 <div class="c"><b>Übungen im Plan</b>`;
 ed.items.forEach((it,i)=>{const e=ex(it.ex);h+=`<div class="r" style="margin-top:8px"><span style="flex:1 1 100%"><b>${esc(e?e.n:"?")}</b></span>
 <input class="n" type="number" min="1" value="${it.sets}" oninput="ed.items[${i}].sets=+this.value||1" title="Sets"><span class="mu">Sets</span>
 <input class="n" type="number" min="1" value="${it.reps}" oninput="ed.items[${i}].reps=+this.value||1" title="Wdh."><span class="mu">${unit(e)}</span>
 <span class="effective-dose">→ ${effective(it,ed).sets} × ${effective(it,ed).reps} ${unit(e)} </span>
 <input class="n" type="number" min="0" step="0.5" value="${it.kg}" oninput="ed.items[${i}].kg=+this.value||0" title="kg"><span class="mu">kg</span><button class="x" onclick="ed.items.splice(${i},1);render()">✕</button></div>`});
 h+=`${ed.items.length?bodyMap(ed.items):""}</div><div class="c"><b>Übung hinzufügen</b><input placeholder="Suchen (z. B. Squat, Plank, Brücke)" value="${esc(q)}" oninput="q=this.value;rs(this)">
 <div id="res">${resHtml(res)}</div></div><div class="r"><button class="b" onclick="savePlan()">Speichern</button><button class="b g" onclick="ed=null;render()">Abbrechen</button></div>`;
 return h}
function resHtml(r){return r.map(e=>`<div class="r" style="margin-top:6px"><span style="flex:1">${esc(e.n)} <span class="mu">${esc(e.c)}</span></span><button class="b g" onclick="addIt('${e.id}')">+</button></div>`).join("")}
function rs(inp){const s=q.toLowerCase();document.getElementById("res").innerHTML=resHtml(s?all().filter(e=>mt(e,s)).slice(0,8):[]);}
function tgl(i){ed.days=ed.days.includes(i)?ed.days.filter(x=>x!==i):ed.days.concat(i).sort();render()}
function addIt(id){ed.items.push({ex:id,sets:3,reps:10,kg:0});q="";render()}
function savePlan(){if(!ed.name.trim()){toast("Bitte einen Namen eingeben.");return}if(!ed.items.length){toast("Bitte mindestens eine Übung hinzufügen.");return}
 if(ed.mode==="week"){ed.days=[];ed.pw=Math.max(1,Math.min(7,ed.pw||1))}else if(!ed.days.length){toast("Bitte mindestens einen Wochentag wählen oder „Mal pro Woche“ nutzen.");return}delete ed.mode;const i=S.plans.findIndex(p=>p.id===ed.id);if(i>=0)S.plans[i]=ed;else S.plans.push(ed);save();ed=null;render()}

function share(id){const p=S.plans.find(x=>x.id===id);const cu=S.custom.filter(c=>p.items.some(i=>i.ex===c.id)).map(c=>({...c,img:undefined,draw:undefined}));
 const code=btoa(unescape(encodeURIComponent(JSON.stringify({p,cu}))));
 const a=document.getElementById("app");a.innerHTML=`<h2>Plan teilen</h2><div class="c"><p>Schicke diesen Code an die andere Person. Sie fügt ihn unter „Plan importieren“ ein.</p><textarea rows="6" id="cd" readonly>${code}</textarea><div class="r" style="margin-top:8px"><button class="b" onclick="cp()">Code kopieren</button><button class="b g" onclick="render()">Zurück</button></div></div>`}
function cp(){cpId("cd")}
function imp(){document.getElementById("app").innerHTML=`<h2>Plan importieren</h2><div class="c"><textarea rows="6" id="cd" placeholder="Code hier einfügen"></textarea><div class="r" style="margin-top:8px"><button class="b" onclick="doImp()">Importieren</button><button class="b g" onclick="render()">Abbrechen</button></div></div>`}
function doImp(){try{const o=JSON.parse(decodeURIComponent(escape(atob(document.getElementById("cd").value.trim()))));
 o.cu.forEach(c=>{if(!S.custom.some(x=>x.id===c.id))S.custom.push(c)});(o.plans||[o.p]).forEach((p,i)=>{p.id="p"+Date.now()+i;S.plans.push(p)});save();go("plans")}catch(e){toast("Der Code ist ungültig.")}}

function vLib(){
 const s=eq.toLowerCase();
 const list=all().filter(e=>(cat==="Alle"||e.c===cat)&&subOk(e)&&inReg(e,reg)&&(!s||mt(e,s)));
 let h=`<h2>Übungen</h2><input placeholder="Suchen: Name, Beschwerde oder Ziel (z. B. Squat, Knie, Rücken, Balance)" value="${esc(eq)}" oninput="eq=this.value;lib2()"><div class="r sc" style="margin:8px 0">${["Alle","Kraft","Rumpf","Gleichgewicht","Mobilisation","Dehnung","Schnelligkeit","Fitnessstudio","Atmen","Eigene"].map(c=>`<button class="chip ${cat===c?"on":""}" onclick="cat='${c}';sub='Alle';render()">${c}</button>`).join("")}</div>
 ${(cat==="Fitnessstudio"||cat==="Atmen")?`<div class="r sc" style="margin:0 0 8px">${(cat==="Atmen"?["Alle","Beruhigung","Konzentration","Energie","Schlaf"]:["Alle","Ausdauer","Krafttraining"]).map(s=>`<button class="chip ${sub===s?"on":""}" onclick="sub='${s}';render()">${s}</button>`).join("")}</div>`:""}<div class="r sc" style="margin:0 0 8px"><span class="mu" style="flex:none">Körperregion:</span>${["Alle Regionen",...Object.keys(REG)].map(r=>`<button class="chip ${reg===r?"on":""}" onclick="reg='${r}';render()">${r}</button>`).join("")}</div><button class="b g" onclick="cf=!cf;render()">+ Eigene Übung</button>${cf?cForm():""}<div id="ll">${libList(list)}</div>`;return h}
function lib2(){const s=eq.toLowerCase();document.getElementById("ll").innerHTML=libList(all().filter(e=>(cat==="Alle"||e.c===cat)&&subOk(e)&&inReg(e,reg)&&(!s||mt(e,s))))}
function libList(l){if(!l.length)return`<div class="c mu">Nichts gefunden.</div>`;return l.map(e=>{const o=opn===e.id;
 return`<div class="c"><div class="r" onclick="opn=opn==='${e.id}'?null:'${e.id}';render()" style="cursor:pointer;flex-wrap:nowrap">${fig(e,0,44)}${fig(e,1,44)}<div style="flex:1"><h3>${esc(e.n)}${e.br?` <small style="font-size:11px;color:var(--ac)">· ${esc((e.sub||'').replace(/Beruhigung/g,'Entspannen').replace(/Konzentration/g,'Fokussieren').replace(/Schlaf/g,'Runterkommen'))}</small>`:''}</h3><div class="mu">${esc(e.c)} · ${esc(e.m||"–")}</div></div><span>${o?"▲":"▼"}</span></div>
 ${o?`<div class="r" style="margin-top:8px">${fig(e,0,110)}${fig(e,1,110)}</div><p class="mu" style="font-size:13px;margin:6px 0 0">${legend(e)}</p><p>${esc(e.d||"")}</p>${e.s?`<p><b>Start:</b> ${esc(e.s)}<br><b>Ende:</b> ${esc(e.e)}</p>`:""}${e.l?`<p><b>Genauere Anleitung:</b> ${esc(e.l)}</p>`:""}${e.g?`<p><b>Gut bei / Ziel:</b> ${esc(e.g)}</p>`:""}${e.x?`<p><b>Eher nicht machen bei:</b> ${esc(e.x)}</p><p class="mu">Allgemeine Hinweise, sie ersetzen keine Anweisung deiner Therapeutin, deines Therapeuten oder deines Arztes.</p>`:""}${e.al.filter(Boolean).length?`<p class="mu">Auch bekannt als: ${esc(e.al.join(", "))}</p>`:""}
 <div class="r" style="margin:8px 0">${e.br?`<button class="b" onclick="brOpen('${e.id}')">▶ Atemübung starten</button>`:""}<button class="chip" onclick="togFav('${e.id}')">${isFav(e.id)?"★ Favorit":"☆ Als Favorit"}</button></div>
 <div class="r" style="margin:8px 0"><select id="ap_${e.id}" style="flex:1;min-width:140px">${S.plans.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}<option value="new">+ Neuer Plan</option></select><button class="b" onclick="addToPlan('${e.id}')">Zu Plan hinzufügen</button></div>
 ${ytHtml(e)}<a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.n+" Übung Anleitung")}">▶ Videos auf YouTube suchen</a>
 ${e.id[0]==="c"?`<div><button class="x" onclick="delEx('${e.id}')">🗑 Eigene Übung löschen</button></div>`:""}`:""}</div>`}).join("")}
function drawFig(s){return s}
function figSvg(s,e){
const p=s.split(";"),[hx,hy,sx,sy,px,py,kx,ky,fx,fy,ex,ey,wx,wy]=p[0].split(",").map(Number),t=(e.n||"")+" "+(e.g||""),A=r=>REG[r]&&REG[r].test(t),
leg=A("Knie/Oberschenkel"),calf=A("Wade/Fuß"),hip=A("Hüfte/Gesäß"),arm=A("Arm/Hand"),sho=A("Schulter"),trk=A("Rumpf/Bauch")||A("Rücken"),nk=A("Nacken");
const L=(a,b,c,d,w,bw,on,o)=>{const col=on?"var(--mc)":"var(--bb)",k=f=>[a+(c-a)*f,b+(d-b)*f],m1=k(.22),m2=k(.78);return`<g stroke="${col}" stroke-linecap="round" opacity="${o||1}"><path d="M${a} ${b}L${c} ${d}" stroke-width="${w}"/><path d="M${m1[0]} ${m1[1]}L${m2[0]} ${m2[1]}" stroke-width="${bw}"/></g>`};
let x="",th="";
(p[1]||"").split("M").filter(Boolean).forEach(sub=>{const q=[...sub.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);
if(/[QZ]/.test(sub)||q.length<3){th+=`<path d="M${sub}" fill="${/Z/.test(sub)?"var(--bd)":"none"}" stroke="var(--mu)" stroke-width="1.3" opacity=".7"/>`;return}
const a=Math.hypot(q[0][0]-sx,q[0][1]-sy)<Math.hypot(q[0][0]-px,q[0][1]-py);
for(let i=0;i<q.length-1;i++){const[u,v]=q[i],[u2,v2]=q[i+1];x+=a?L(u,v,u2,v2,i?2:2.4,i?2.6:3.4,arm,.8):L(u,v,u2,v2,i?(i>1?2:2.8):3.6,i?(i>1?2:3.8):5.2,i>1?false:(i?calf:leg),.8)}});
x+=L(px,py,kx,ky,3.6,5.2,leg)+L(kx,ky,fx,fy,2.8,3.8,calf)+L(sx,sy,px,py,5,6.6,trk)+L(hx,hy,sx,sy,2,2,nk)+L(sx,sy,ex,ey,2.4,3.4,arm)+L(ex,ey,wx,wy,2,2.6,arm);
x+=`<circle cx="${px}" cy="${py}" r="2.8" fill="${hip?"var(--mc)":"var(--bb)"}"/><circle cx="${sx}" cy="${sy}" r="2.7" fill="${sho?"var(--mc)":"var(--bb)"}"/><circle cx="${hx}" cy="${hy}" r="3.2" fill="var(--bb)"/>`;
if(p[2]==="d")x+=`<circle cx="${wx}" cy="${wy}" r="2.6" fill="var(--tx)"/>`;
return`<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke-linecap="round"><path d="M2 44.6H46" stroke="var(--bd)" stroke-width="1.2"/>${th}${x}</svg>`}
function legend(e){const t=(e.n||"")+" "+(e.g||""),r=Object.keys(REG).filter(k=>k!=="Ganzkörper"&&REG[k].test(t));return r.length?"<span style='color:var(--mc)'>●</span> Beansprucht (orange): "+r.join(", "):""}
function applyTheme(){const t=S.theme,r=document.documentElement;r.setAttribute("data-theme",t||"auto");r.setAttribute("data-palette",S.palette||"petrol");r.setAttribute("data-mode",S.mode||"auto");const b=document.getElementById("thb");if(b)b.textContent=t==="light"?"☀️ Hell":t==="dark"?"🌙 Dunkel":"🌓 Auto"}
function theme(){S.theme=S.theme==="light"?"dark":S.theme==="dark"?"auto":"light";save();applyTheme()}
function fig(e,w,z){const c=e.fig&&e.fig[w];return`<div class="fg" style="width:${z}px;height:${z}px">${c?(c.slice(0,2)==="BR"?orbSvg(c[2]):figSvg(c,e)):(e.draw&&e.draw[w]?`<img src="${e.draw[w]}" alt="" style="width:100%;height:100%;object-fit:contain">`:e.img&&!w?`<img src="${e.img}" alt="" style="width:100%;height:100%;object-fit:cover">`:`<svg viewBox="0 0 40 40" width="${z*0.5}" height="${z*0.5}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".35"><circle cx="20" cy="8" r="4"/><path d="M20 12v12M20 16l-8 6M20 16l8 6M20 24l-6 12M20 24l6 12"/></svg>`)}${z>60?`<span class="mu fl">${w?"Ende":"Start"}</span>`:""}</div>`}
function cForm(){return`<div class="c"><label class="mu">Name</label><input id="cn"><label class="mu">Beschreibung</label><textarea id="cd2" rows="3"></textarea><label class="mu">Foto</label><input type="file" id="cf" accept="image/*"><label class="mu">Start- und Endposition zeichnen (mit dem Finger)</label><div class="r" style="flex-wrap:nowrap;align-items:flex-start"><div style="flex:1"><div class="mu">Start</div><canvas id="cvS" class="cv" width="240" height="240"></canvas><button class="chip" style="margin-top:6px" onclick="cvClear('cvS')">Löschen</button></div><div style="flex:1"><div class="mu">Ende</div><canvas id="cvE" class="cv" width="240" height="240"></canvas><button class="chip" style="margin-top:6px" onclick="cvClear('cvE')">Löschen</button></div></div><div class="r" style="margin-top:8px"><button class="b" onclick="addEx()">Speichern</button></div></div>`}
function addEx(){const n=document.getElementById("cn").value.trim();if(!n){toast("Bitte einen Namen eingeben.");return}
 const d=document.getElementById("cd2").value,f=document.getElementById("cf").files[0],ds=["cvS","cvE"].map(id=>{const c=document.getElementById(id);return c&&c.dataset.dirty?c.toDataURL("image/png"):""});
 const fin=img=>{S.custom.push({id:"c"+Date.now(),n,al:[],c:"Eigene",m:"",d,s:"",e:"",img,draw:ds.some(Boolean)?ds:undefined});save();cf=false;cat="Eigene";render()};
 if(!f)return fin();const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,500/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);fin(c.toDataURL("image/jpeg",.7))};im.src=r.result};r.readAsDataURL(f)}
function delEx(id){if(cdel!==id){cdel=id;toast("Zum Löschen noch einmal tippen");return}cdel=null;S.custom=S.custom.filter(c=>c.id!==id);save();render()}

function vHist(){
 const now=new Date();
 const ext = statsExt();
 let h=`<h2>Verlauf & Statistiken</h2>`;
 
 h+=`<div class="r" style="gap:8px;flex-wrap:wrap">
   <div class="c" style="flex:1;min-width:130px;text-align:center;padding:12px 6px">
     <div style="font-size:24px">🔥</div>
     <div style="font-size:26px;font-weight:800">${ext.run} Tage</div>
     <div class="mu" style="font-size:12px">Serie laut Plan</div>
   </div>
   <div class="c" style="flex:1;min-width:130px;text-align:center;padding:12px 6px">
     <div style="font-size:24px">🏆</div>
     <div style="font-size:26px;font-weight:800">${ext.best} Tage</div>
     <div class="mu" style="font-size:12px">Beste Serie</div>
   </div>
   <div class="c" style="flex:1;min-width:130px;text-align:center;padding:12px 6px">
     <div style="font-size:24px">✅</div>
     <div style="font-size:26px;font-weight:800">${ext.total}</div>
     <div class="mu" style="font-size:12px">Gesamt absolviert</div>
   </div>
   <div class="c" style="flex:1;min-width:130px;text-align:center;padding:12px 6px">
     <div style="font-size:24px">📅</div>
     <div style="font-size:26px;font-weight:800">${ext.lastMonth}</div>
     <div class="mu" style="font-size:12px">Im letzten Monat</div>
   </div>
   <div class="c" style="flex:1;min-width:130px;text-align:center;padding:12px 6px">
     <div style="font-size:24px">⚠️</div>
     <div style="font-size:26px;font-weight:800;color:var(--mc)">${typeof missedTrainingTotal==='function'?missedTrainingTotal():ext.missed}</div>
     <div class="mu" style="font-size:12px">Verpasste Trainings</div>
   </div>
 </div>`;

 h+=`<div class="c"><h3>🎯 Aktivitäten & Gewohnheiten Verlauf</h3>`;
 if(!S.habits || !S.habits.length){
   h+=`<div class="mu">Noch keine Aktivitäten angelegt. Lege unter „Home“ Aktivitäten an.</div>`;
 } else {
   S.habits.forEach(hb=>{
     h+=`<div style="margin-top:10px;padding-bottom:10px;border-bottom:1px solid var(--bd)">
       <div class="r" style="justify-content:space-between;align-items:center">
         <b>${esc(hb.name)}</b>
         <button class="b g" style="font-size:11px;padding:3px 8px;min-height:30px" onclick="resetHabitStats('${hb.id}')">🔄 Zähler zurücksetzen</button>
       </div>
       <div class="r" style="margin-top:6px;gap:16px;font-size:13px">
         <span style="color:var(--ok)">✓ Absolviert: <b>${hb.doneCount||0}×</b></span>
         <span style="color:var(--mc)">✗ Ausgelassen: <b>${hb.missedCount||0}×</b></span>
       </div>
     </div>`;
   });
 }
 h+=`</div>`;

 const mon=new Date(now);mon.setDate(now.getDate()-wd(now));
 h+=`<div class="c"><h3>Diese Woche</h3>`;
 if(!S.plans.length)h+=`<div class="mu">Noch keine Pläne zugewiesen.</div>`;
 S.plans.forEach(p=>{const tgt=p.days.length||p.pw||1;let done=0;for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);if(planPct(p,iso(d))>0)done++}
  const pc=Math.min(100,Math.round(done/tgt*100));h+=`<div style="margin-top:8px"><b>${esc(p.name)}</b> <span class="chip" style="font-size:11px;padding:1px 6px">${getPlanLevel(p)}</span> <span class="mu">${done} von ${tgt} Einheiten · ${pc}%</span><div class="bar"><i style="width:${pc}%"></i></div></div>`});
 h+=`</div>`;

 const ds=Object.keys(S.log).sort().reverse();
 if(!ds.length)h+=`<div class="c mu">Sobald du Sets abhakst, erscheinen sie hier.</div>`;
 ds.forEach(d=>{const rows=S.plans.filter(p=>planPct(p,d)>0);if(!rows.length)return;
  h+=`<div class="c"><b>${new Date(d+"T12:00").toLocaleDateString("de-AT",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</b>`;
  rows.forEach(p=>{const pc=planPct(p,d);h+=`<div style="margin-top:6px">${esc(p.name)} <span class="chip" style="font-size:11px">${getPlanLevel(p)}</span> <span class="mu">${pc}%</span><div class="bar"><i style="width:${pc}%"></i></div></div>`});h+=`</div>`});
 return h}



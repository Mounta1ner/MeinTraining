/* Mein Training v3.0 - Modul 1: Detailliertes Satz-Tracking (S.setLog), Last-Time & Kraftkurve */
(function () {
  'use strict';

  // --- 1. STATE INITIALISIERUNG (abwärtskompatibel in trainingsplan-v1) ---
  S.setLog = S.setLog || {};
  S.setDrafts = S.setDrafts || {};
  S.workoutFeedback = S.workoutFeedback || {};
  S.ui = S.ui || {};
  S.ui.v3SetEditorOpen = S.ui.v3SetEditorOpen || {};
  S.ui.v3ChartMetric = S.ui.v3ChartMetric || 'maxKg';

  const RPE_LABELS = {
    1: S.lang === 'en' ? '🟢 Too easy' : '🟢 Zu leicht',
    2: S.lang === 'en' ? '🟡 Just right' : '🟡 Genau richtig',
    3: S.lang === 'en' ? '🟠 Very hard' : '🟠 Sehr anstrengend',
    4: S.lang === 'en' ? '🔴 Discomfort' : '🔴 Beschwerden'
  };

  // Hilfsfunktionen für Einheiten & Default-Werte
  function isTimedEx(e) {
    return !!e && (isT(e) || isM(e));
  }

  function toSeconds(e, val) {
    if (!isTimedEx(e)) return 0;
    return unit(e) === 'Min.' ? Math.round((+val || 0) * 60) : Math.round(+val || 0);
  }

  function ensureSetArray(dt, pid, idx) {
    S.setLog[dt] = S.setLog[dt] || {};
    S.setLog[dt][pid] = S.setLog[dt][pid] || {};
    if (!Array.isArray(S.setLog[dt][pid][idx])) {
      S.setLog[dt][pid][idx] = [];
    }
    return S.setLog[dt][pid][idx];
  }

  function ensureDraftObj(dt, pid, idx) {
    S.setDrafts[dt] = S.setDrafts[dt] || {};
    S.setDrafts[dt][pid] = S.setDrafts[dt][pid] || {};
    S.setDrafts[dt][pid][idx] = S.setDrafts[dt][pid][idx] || {};
    return S.setDrafts[dt][pid][idx];
  }

  // Liefert die Ziel-/Vorbelegungswerte für einen bestimmten Satz s (1-basiert)
  window.v3GetSetTarget = function (dt, pid, idx, setNum) {
    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return { reps: 10, kg: 0, sec: 0 };
    const it = effective(p.items[idx], p);
    const e = ex(it.ex);
    const logged = (((S.setLog[dt] || {})[pid] || {})[idx] || []).find(x => x.set === setNum);
    if (logged) {
      return {
        reps: isTimedEx(e) ? (unit(e) === 'Min.' ? +(logged.sec / 60).toFixed(1) : logged.sec || logged.reps) : logged.reps,
        kg: +logged.kg || 0,
        sec: +logged.sec || 0
      };
    }
    const draft = (((S.setDrafts[dt] || {})[pid] || {})[idx] || {})[setNum];
    if (draft) {
      return {
        reps: +draft.reps || +it.reps || 1,
        kg: draft.kg !== undefined ? +draft.kg : (+it.kg || 0),
        sec: toSeconds(e, +draft.reps || +it.reps || 1)
      };
    }
    // Fallback: Vorheriger Satz von heute oder effektive Plan-Werte
    const prevLogged = (((S.setLog[dt] || {})[pid] || {})[idx] || []).find(x => x.set === setNum - 1);
    if (prevLogged) {
      return {
        reps: isTimedEx(e) ? (unit(e) === 'Min.' ? +(prevLogged.sec / 60).toFixed(1) : prevLogged.sec || prevLogged.reps) : prevLogged.reps,
        kg: +prevLogged.kg || 0,
        sec: +prevLogged.sec || 0
      };
    }
    return {
      reps: +it.reps || 1,
      kg: +it.kg || 0,
      sec: toSeconds(e, +it.reps || 1)
    };
  };

  // Synchronisiert S.setLog[dt][pid][idx] mit der erledigten Satzanzahl in S.log[dt][pid][idx]
  window.v3SyncSetLog = function (dt, pid, idx, overrideValues) {
    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return;
    const it = effective(p.items[idx], p);
    const e = ex(it.ex);
    const doneCount = Number(((S.log[dt] || {})[pid] || {})[idx]) || 0;
    const arr = ensureSetArray(dt, pid, idx);
    const drafts = ensureDraftObj(dt, pid, idx);

    // 1. Wenn Sätze abgewählt wurden: Überschüssige Sätze in Drafts sichern und aus setLog entfernen
    for (let k = arr.length - 1; k >= 0; k--) {
      if (arr[k].set > doneCount) {
        const rem = arr[k];
        drafts[rem.set] = {
          reps: isTimedEx(e) ? (unit(e) === 'Min.' ? +(rem.sec / 60).toFixed(1) : rem.sec || rem.reps) : rem.reps,
          kg: rem.kg
        };
        arr.splice(k, 1);
      }
    }

    // 2. Neu hinzugekommene Sätze bis doneCount auffüllen
    for (let s = 1; s <= doneCount; s++) {
      let existing = arr.find(x => x.set === s);
      const target = window.v3GetSetTarget(dt, pid, idx, s);
      const useOverride = overrideValues && overrideValues.set === s ? overrideValues : null;
      const rawVal = useOverride && useOverride.reps !== undefined ? +useOverride.reps : target.reps;
      const kgVal = useOverride && useOverride.kg !== undefined ? +useOverride.kg : target.kg;
      const secVal = isTimedEx(e) ? toSeconds(e, rawVal) : 0;
      const repsVal = isTimedEx(e) ? rawVal : Math.max(1, Math.round(rawVal));

      if (!existing) {
        arr.push({
          set: s,
          reps: repsVal,
          kg: Math.max(0, +kgVal || 0),
          sec: secVal,
          at: new Date().toISOString()
        });
      } else if (useOverride) {
        existing.reps = repsVal;
        existing.kg = Math.max(0, +kgVal || 0);
        existing.sec = secVal;
        existing.at = new Date().toISOString();
      }
    }

    arr.sort((a, b) => a.set - b.set);
  };

  // --- 2. HOOKS FÜR TICK & TICKNEXT ---
  const _prevTick = tick;
  tick = function (dt, pid, i, s) {
    _prevTick(dt, pid, i, s);
    window.v3SyncSetLog(dt, pid, i);
    save();
    if (tab === 'today') render();
  };

  const _prevTickNext = tickNext;
  tickNext = function (dt, pid, i, max) {
    _prevTickNext(dt, pid, i, max);
    window.v3SyncSetLog(dt, pid, i);
    save();
    if (tab === 'today') render();
  };

  // --- 3. INLINE SATZ-EDITOR AUF HOME ---
  window.v3ToggleSetEditor = function (dt, pid, idx) {
    const key = pid + '_' + idx;
    S.ui.v3SetEditorOpen[key] = !S.ui.v3SetEditorOpen[key];
    render();
  };

  window.v3UpdateSetValue = function (dt, pid, idx, setNum, field, rawValue) {
    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return;
    const e = ex(p.items[idx].ex);
    const val = Math.max(0, Number(rawValue) || 0);
    const drafts = ensureDraftObj(dt, pid, idx);
    const currentTarget = window.v3GetSetTarget(dt, pid, idx, setNum);

    drafts[setNum] = {
      reps: field === 'reps' ? Math.max(1, val) : currentTarget.reps,
      kg: field === 'kg' ? val : currentTarget.kg
    };

    // Falls der Satz heute bereits abgehakt ist, direkt im S.setLog aktualisieren
    const doneCount = Number(((S.log[dt] || {})[pid] || {})[idx]) || 0;
    if (setNum <= doneCount) {
      window.v3SyncSetLog(dt, pid, idx, {
        set: setNum,
        reps: drafts[setNum].reps,
        kg: drafts[setNum].kg
      });
    }
    save();
    render();
  };

  window.v3StepSetValue = function (dt, pid, idx, setNum, field, delta) {
    const target = window.v3GetSetTarget(dt, pid, idx, setNum);
    const base = field === 'kg' ? (+target.kg || 0) : (+target.reps || 1);
    const next = field === 'kg'
      ? Math.max(0, Math.round((base + delta) * 10) / 10)
      : Math.max(1, Math.round(base + delta));
    window.v3UpdateSetValue(dt, pid, idx, setNum, field, next);
  };

  window.v3ApplyFirstSetToAll = function (dt, pid, idx) {
    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return;
    const it = effective(p.items[idx], p);
    const first = window.v3GetSetTarget(dt, pid, idx, 1);
    const drafts = ensureDraftObj(dt, pid, idx);
    const doneCount = Number(((S.log[dt] || {})[pid] || {})[idx]) || 0;

    for (let s = 1; s <= it.sets; s++) {
      drafts[s] = { reps: first.reps, kg: first.kg };
      if (s <= doneCount) {
        window.v3SyncSetLog(dt, pid, idx, { set: s, reps: first.reps, kg: first.kg });
      }
    }
    save();
    toast(S.lang === 'en' ? 'Copied set 1 values to all sets for today' : 'Werte von Satz 1 für heute auf alle Sätze übertragen');
    render();
  };

  window.v3SaveSetAsPlanDefault = function (dt, pid, idx) {
    const p = S.plans.find(x => x.id === pid);
    if (!p || !p.items[idx]) return;
    const first = window.v3GetSetTarget(dt, pid, idx, 1);
    p.items[idx].kg = +first.kg || 0;
    save();
    toast(S.lang === 'en' ? 'Working weight (' + p.items[idx].kg + ' kg) saved as plan default' : 'Arbeitsgewicht (' + p.items[idx].kg + ' kg) als Plan-Standard gespeichert');
    render();
  };

  // --- 4. „LETZTES MAL“ (LAST TIME) LOGIK ---
  window.v3LastPerformance = function (exId, beforeDate = iso()) {
    const e = ex(exId);
    if (!e) return null;
    const u = unit(e);

    // 1. Suche in S.setLog (neues detailliertes Satz-Log)
    const setDates = Object.keys(S.setLog || {}).filter(d => d < beforeDate).sort().reverse();
    for (const d of setDates) {
      const plansOnDay = S.setLog[d] || {};
      for (const pid of Object.keys(plansOnDay)) {
        const p = S.plans.find(x => x.id === pid);
        const itemsObj = plansOnDay[pid] || {};
        for (const idxStr of Object.keys(itemsObj)) {
          const idx = Number(idxStr);
          const itemExId = p?.items?.[idx]?.ex;
          if (itemExId !== exId) continue;
          const sets = itemsObj[idx];
          if (!Array.isArray(sets) || !sets.length) continue;

          const count = sets.length;
          const repsList = sets.map(s => +s.reps || 0);
          const kgList = sets.map(s => +s.kg || 0);
          const maxKg = Math.max(0, ...kgList);
          const uniformReps = repsList.every(r => r === repsList[0]);
          const uniformKg = kgList.every(k => k === kgList[0]);

          let summary = '';
          if (uniformReps && uniformKg) {
            summary = `${count} × ${repsList[0]}${u !== 'Wdh.' ? ' ' + u : ''}${maxKg > 0 ? ' · ' + maxKg + ' kg' : ''}`;
          } else if (uniformKg) {
            summary = `${count} Sätze (${repsList.join('/')}${u !== 'Wdh.' ? ' ' + u : ''})${maxKg > 0 ? ' · ' + maxKg + ' kg' : ''}`;
          } else {
            const bestSet = sets.reduce((best, cur) => ((+cur.kg || 0) > (+best.kg || 0) ? cur : best), sets[0]);
            summary = `${count} Sätze · Spitze: ${bestSet.reps}${u !== 'Wdh.' ? ' ' + u : ''} × ${bestSet.kg} kg`;
          }

          const fb = S.workoutFeedback?.[d]?.[pid]?.rpe;
          const rpeText = fb && RPE_LABELS[fb] ? ` – ${RPE_LABELS[fb].replace(/^[^\s]+\s/, '')}` : '';
          const dateLabel = new Date(d + 'T12:00:00').toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });

          return {
            date: d,
            dateLabel,
            summary,
            rpeText,
            text: `${S.lang === 'en' ? 'Last time' : 'Letztes Mal'} (${dateLabel}): ${summary}${rpeText}`
          };
        }
      }
    }

    // 2. Fallback: Suche in S.exerciseHistory (Einzelübungen / Favoriten / v28 Counter)
    const hist = (S.exerciseHistory || [])
      .filter(x => x.id === exId && x.at && iso(new Date(x.at)) < beforeDate)
      .sort((a, b) => b.at.localeCompare(a.at));

    if (hist.length) {
      const last = hist[0];
      const d = iso(new Date(last.at));
      const sameDay = hist.filter(x => iso(new Date(x.at)) === d);
      const dateLabel = new Date(d + 'T12:00:00').toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
      const val = last.unit === 'seconds' ? `${last.seconds} Sek.` : `${last.reps || 1} Wdh.`;
      const summary = sameDay.length > 1 ? `${sameDay.length} × ${val}` : val;
      return {
        date: d,
        dateLabel,
        summary,
        rpeText: '',
        text: `${S.lang === 'en' ? 'Last time' : 'Letztes Mal'} (${dateLabel}): ${summary}`
      };
    }

    // 3. Fallback: Legacy S.log (für bestehende Trainingsdaten vor v3.0)
    const legacyDates = Object.keys(S.log || {}).filter(d => d < beforeDate).sort().reverse();
    for (const d of legacyDates) {
      for (const p of S.plans) {
        const l = (S.log[d] || {})[p.id];
        if (!l) continue;
        for (let i = 0; i < p.items.length; i++) {
          if (p.items[i].ex === exId && (l[i] || 0) > 0) {
            const eff = effective(p.items[i], p);
            const doneSets = l[i];
            const dateLabel = new Date(d + 'T12:00:00').toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
            const summary = `${doneSets} × ${eff.reps}${u !== 'Wdh.' ? ' ' + u : ''}${+eff.kg ? ' · ' + eff.kg + ' kg' : ''}`;
            const fb = S.workoutFeedback?.[d]?.[p.id]?.rpe;
            const rpeText = fb && RPE_LABELS[fb] ? ` – ${RPE_LABELS[fb].replace(/^[^\s]+\s/, '')}` : '';
            return {
              date: d,
              dateLabel,
              summary,
              rpeText,
              text: `${S.lang === 'en' ? 'Last time' : 'Letztes Mal'} (${dateLabel}): ${summary}${rpeText}`
            };
          }
        }
      }
    }

    return null;
  };

  // --- 5. HOME-RENDERING ERWEITERN (LAST TIME + INLINE SATZ-EDITOR) ---
  function renderSetEditorHtml(dt, p, idx) {
    const it = effective(p.items[idx], p);
    const e = ex(it.ex);
    if (!e) return '';
    const u = unit(e);
    const doneCount = Number(((S.log[dt] || {})[p.id] || {})[idx]) || 0;
    const showKg = !e.br;

    let rows = '';
    for (let s = 1; s <= it.sets; s++) {
      const t = window.v3GetSetTarget(dt, p.id, idx, s);
      const isDone = s <= doneCount;
      rows += `
        <div class="v3-set-row ${isDone ? 'done' : ''}">
          <button type="button" class="set ${isDone ? 'on' : ''}" style="width:36px;height:36px;font-size:13px" onclick="tick('${dt}','${p.id}',${idx},${s})" title="Satz ${s} abhaken">${s}</button>
          <div class="v3-set-ctrl">
            <span class="mu" style="font-size:11px">${u}</span>
            <div class="v3-mini-stepper">
              <button type="button" onclick="v3StepSetValue('${dt}','${p.id}',${idx},${s},'reps',${u === 'Sek.' ? -5 : -1})">−</button>
              <input type="number" min="1" step="${u === 'Min.' ? '0.5' : '1'}" value="${t.reps}" onchange="v3UpdateSetValue('${dt}','${p.id}',${idx},${s},'reps',this.value)" aria-label="Satz ${s} ${u}">
              <button type="button" onclick="v3StepSetValue('${dt}','${p.id}',${idx},${s},'reps',${u === 'Sek.' ? 5 : 1})">+</button>
            </div>
          </div>
          ${showKg ? `
          <div class="v3-set-ctrl">
            <span class="mu" style="font-size:11px">kg</span>
            <div class="v3-mini-stepper">
              <button type="button" onclick="v3StepSetValue('${dt}','${p.id}',${idx},${s},'kg',-2.5)">−</button>
              <input type="number" min="0" step="0.5" value="${t.kg}" onchange="v3UpdateSetValue('${dt}','${p.id}',${idx},${s},'kg',this.value)" aria-label="Satz ${s} kg">
              <button type="button" onclick="v3StepSetValue('${dt}','${p.id}',${idx},${s},'kg',2.5)">+</button>
            </div>
          </div>` : ''}
        </div>`;
    }

    return `
      <div class="v3-set-editor">
        <div class="r" style="justify-content:space-between;margin-bottom:6px">
          <b style="font-size:13px">${S.lang === 'en' ? 'Set values for today' : 'Satz-Werte für heute'} (${esc(e.n)})</b>
          <span class="mu" style="font-size:11px">${S.lang === 'en' ? 'Plan baseline stays protected' : 'Plan-Basis bleibt geschützt'}</span>
        </div>
        ${rows}
        <div class="r" style="margin-top:8px;justify-content:space-between">
          <button type="button" class="chip" style="font-size:12px;padding:6px 10px" onclick="v3ApplyFirstSetToAll('${dt}','${p.id}',${idx})">${S.lang === 'en' ? '↕ Copy set 1 to all' : '↕ Satz 1 auf alle'}</button>
          ${showKg ? `<button type="button" class="chip" style="font-size:12px;padding:6px 10px" onclick="v3SaveSetAsPlanDefault('${dt}','${p.id}',${idx})">${S.lang === 'en' ? '💾 Save kg as plan default' : '💾 kg als Plan-Standard'}</button>` : ''}
        </div>
      </div>`;
  }


  // Sicherstellen, dass v27.js weder trackHabit noch Make me feel it überschreibt
  if (typeof window.v3MasterTrackHabit === 'function') {
    window.trackHabit = window.v3MasterTrackHabit;
    trackHabit = window.v3MasterTrackHabit;
  }

  const _prevVToday = vToday;
  vToday = function () {
    const html = _prevVToday();
    const dt = iso(new Date());
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    // Finde alle Übungsblöcke in den heutigen Plänen anhand des Toggle-Attributs onclick="tg('pid_idx')"
    const titles = tpl.content.querySelectorAll('b[onclick^="tg(\'"]');
    titles.forEach(bEl => {
      const m = (bEl.getAttribute('onclick') || '').match(/^tg\('([^']+)_(\d+)'\)$/);
      if (!m) return;
      const pid = m[1];
      const idx = Number(m[2]);
      const p = S.plans.find(x => x.id === pid);
      if (!p || !p.items[idx]) return;
      const it = p.items[idx];
      const e = ex(it.ex);
      if (!e) return;

      const headerRow = bEl.closest('.r');
      const container = headerRow?.parentElement;
      if (!headerRow || !container) return;

      // 1. „Letztes Mal“-Anzeige unter der Übungszeile einfügen
      const lastPerf = window.v3LastPerformance(e.id, dt);
      if (lastPerf) {
        const lastDiv = document.createElement('div');
        lastDiv.className = 'mu v3-last-perf';
        lastDiv.textContent = lastPerf.text;
        headerRow.after(lastDiv);
      }

      // 2. Heutige geloggte Sätze als kompakte Chips anzeigen (falls vorhanden)
      const loggedToday = (((S.setLog[dt] || {})[pid] || {})[idx] || []);
      if (loggedToday.length > 0) {
        const u = unit(e);
        const pillsDiv = document.createElement('div');
        pillsDiv.className = 'v3-today-pills';
        pillsDiv.innerHTML = loggedToday.map(s => {
          const val = isTimedEx(e) ? `${s.reps} ${u}` : `${s.reps}×`;
          const kg = +s.kg > 0 ? ` ${s.kg}kg` : '';
          return `<span class="v3-set-pill">#${s.set}: ${val}${kg}</span>`;
        }).join('');
        if (lastPerf && headerRow.nextSibling) {
          headerRow.nextSibling.after(pillsDiv);
        } else {
          headerRow.after(pillsDiv);
        }
      }

      // 3. Button „✎ Satz-Werte“ in die Satz-Button-Reihe einfügen
      const setBtn = container.querySelector('button.set');
      const actionRow = setBtn?.parentElement;
      const editorKey = pid + '_' + idx;
      const isOpen = !!S.ui.v3SetEditorOpen[editorKey];

      if (actionRow && !e.br) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'chip v3-edit-btn' + (isOpen ? ' on' : '');
        editBtn.setAttribute('onclick', `v3ToggleSetEditor('${dt}','${pid}',${idx})`);
        editBtn.innerHTML = S.lang === 'en' ? '✎ Set values' : '✎ Satz-Werte';
        actionRow.appendChild(editBtn);
      }

      // 4. Geöffneten Inline-Editor einhängen
      if (isOpen && !e.br) {
        const editorWrap = document.createElement('div');
        editorWrap.innerHTML = renderSetEditorHtml(dt, p, idx);
        if (actionRow) {
          actionRow.after(editorWrap.firstElementChild);
        } else {
          container.appendChild(editorWrap.firstElementChild);
        }
      }
    });

    // Make me feel it Kachel auf Home immer mit aktuellem Ledger synchronisieren
    if (typeof window.financeHome === 'function') {
      const existingFin = tpl.content.querySelector('section[data-module="finance"]');
      if (S.homeVisible?.finance === false || !S.financeEnabled) {
        if (existingFin) existingFin.remove();
      } else {
        const finHtml = window.financeHome();
        if (existingFin && finHtml) {
          existingFin.innerHTML = finHtml;
        }
      }
    }

    return tpl.innerHTML;
  };

  // --- 6. KRAFT- & VOLUMENVERLAUF IM DASHBOARD (vHist) ---
  function getTrackedExercisesForChart() {
    const map = new Map();

    // Aus S.setLog sammeln
    Object.keys(S.setLog || {}).sort().forEach(d => {
      const plansObj = S.setLog[d] || {};
      Object.keys(plansObj).forEach(pid => {
        const p = S.plans.find(x => x.id === pid);
        const itemsObj = plansObj[pid] || {};
        Object.keys(itemsObj).forEach(idxStr => {
          const idx = Number(idxStr);
          const sets = itemsObj[idx];
          if (!Array.isArray(sets) || !sets.length) return;
          const exId = p?.items?.[idx]?.ex;
          const e = ex(exId);
          if (!e) return;
          if (!map.has(exId)) map.set(exId, { e, pointsByDate: {} });
          const entry = map.get(exId);
          const dayList = entry.pointsByDate[d] || (entry.pointsByDate[d] = []);
          sets.forEach(s => dayList.push({ reps: +s.reps || 0, kg: +s.kg || 0, sec: +s.sec || 0 }));
        });
      });
    });

    // Fallback: Aus Legacy S.log ergänzen, falls für diesen Tag noch kein S.setLog vorliegt
    Object.keys(S.log || {}).sort().forEach(d => {
      S.plans.forEach(p => {
        const l = (S.log[d] || {})[p.id];
        if (!l) return;
        p.items.forEach((rawIt, idx) => {
          const doneSets = Number(l[idx]) || 0;
          if (doneSets <= 0) return;
          const exId = rawIt.ex;
          const e = ex(exId);
          if (!e) return;
          if (!map.has(exId)) map.set(exId, { e, pointsByDate: {} });
          const entry = map.get(exId);
          if (entry.pointsByDate[d]) return; // S.setLog hat Vorrang
          const eff = effective(rawIt, p);
          const dayList = (entry.pointsByDate[d] = []);
          for (let s = 0; s < doneSets; s++) {
            dayList.push({ reps: +eff.reps || 0, kg: +eff.kg || 0, sec: toSeconds(e, eff.reps) });
          }
        });
      });
    });

    return [...map.entries()].map(([id, data]) => {
      const series = Object.keys(data.pointsByDate).sort().map(d => {
        const sets = data.pointsByDate[d];
        const maxKg = Math.max(0, ...sets.map(s => s.kg));
        const maxReps = Math.max(0, ...sets.map(s => s.reps));
        const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
        const volume = sets.reduce((sum, s) => sum + (s.kg > 0 ? s.reps * s.kg : s.reps), 0);
        const e1rm = Math.max(0, ...sets.map(s => s.kg > 0 ? Math.round(s.kg * (1 + s.reps / 30) * 10) / 10 : 0));
        return { date: d, maxKg, maxReps, totalReps, volume: Math.round(volume * 10) / 10, e1rm, setsCount: sets.length };
      });
      const hasWeight = series.some(x => x.maxKg > 0);
      return { id, name: data.e.n, unit: unit(data.e), hasWeight, series };
    });
  }

  window.v3SelectChartEx = function (exId) {
    S.ui.v3ChartExId = exId;
    save();
    render();
  };

  window.v3SelectChartMetric = function (metric) {
    S.ui.v3ChartMetric = metric;
    save();
    render();
  };

  window.v3StrengthChartCard = function () {
    const tracked = getTrackedExercisesForChart();
    if (!tracked.length) {
      return `<div class="c" data-v3-section="strengthChart">
        <h3>📈 ${S.lang === 'en' ? 'Strength & performance progress' : 'Kraft- & Leistungsverlauf'}</h3>
        <p class="mu">${S.lang === 'en' ? 'Once you complete sets in a workout plan, your strength, 1RM, and volume curve per exercise will appear here.' : 'Sobald du Sätze in einem Trainingsplan abhakst, erscheint hier deine Kraft-, 1RM- und Volumenkurve pro Übung.'}</p>
      </div>`;
    }

    const selected = tracked.find(x => x.id === S.ui.v3ChartExId) || tracked[0];
    S.ui.v3ChartExId = selected.id;

    // Automatischer Metrik-Fallback für reine Eigengewichtsübungen (0 kg)
    let metric = S.ui.v3ChartMetric || 'maxKg';
    if (!selected.hasWeight && (metric === 'maxKg' || metric === 'e1rm')) {
      metric = 'totalReps';
    }

    const metricMeta = {
      maxKg: { label: S.lang === 'en' ? 'Max weight' : 'Max. Gewicht', unit: 'kg' },
      e1rm: { label: S.lang === 'en' ? 'Estimated 1RM' : 'Geschätztes 1RM', unit: 'kg' },
      volume: { label: selected.hasWeight ? (S.lang === 'en' ? 'Volume (kg×reps)' : 'Volumen (kg×Wdh.)') : (S.lang === 'en' ? 'Total volume' : 'Gesamt-Volumen'), unit: selected.hasWeight ? 'kg' : selected.unit },
      totalReps: { label: (S.lang === 'en' ? 'Total ' : 'Summe ') + selected.unit, unit: selected.unit }
    };
    const curMeta = metricMeta[metric] || metricMeta.maxKg;
    const ptsData = selected.series.slice(-30);

    let chartSvg = '';
    if (ptsData.length < 2) {
      const only = ptsData[0];
      chartSvg = `<p class="mu" style="margin:10px 0">Erster Datenpunkt am ${only.date}: <b>${only[metric]} ${curMeta.unit}</b>. Nach einer zweiten Trainingseinheit wird die Kurve gezeichnet.</p>`;
    } else {
      const vals = ptsData.map(x => Number(x[metric]) || 0);
      const rawMin = Math.min(...vals);
      const rawMax = Math.max(...vals);
      const pad = rawMax === rawMin ? Math.max(1, rawMax * 0.1) : (rawMax - rawMin) * 0.15;
      const min = Math.max(0, rawMin - pad);
      const max = rawMax + pad;
      const coords = ptsData.map((x, i) => {
        const cx = (14 + i * 292 / (ptsData.length - 1)).toFixed(1);
        const cy = (112 - ((Number(x[metric]) || 0) - min) / (max - min || 1) * 92).toFixed(1);
        return { cx, cy, val: x[metric], date: x.date };
      });
      const poly = coords.map(c => `${c.cx},${c.cy}`).join(' ');

      chartSvg = `
        <svg role="img" aria-label="Kraftverlauf ${esc(selected.name)}" viewBox="0 0 320 132" style="width:100%;height:auto;margin-top:6px">
          <line x1="14" y1="20" x2="306" y2="20" stroke="var(--bd)" stroke-dasharray="3,3"/>
          <line x1="14" y1="66" x2="306" y2="66" stroke="var(--bd)" stroke-dasharray="3,3"/>
          <line x1="14" y1="112" x2="306" y2="112" stroke="var(--bd)"/>
          <polyline points="${poly}" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          ${coords.map(c => `<circle cx="${c.cx}" cy="${c.cy}" r="3.5" fill="var(--ac)"><title>${c.date}: ${c.val} ${curMeta.unit}</title></circle>`).join('')}
        </svg>
        <div class="r" style="justify-content:space-between;font-size:12px" class="mu">
          <span class="mu">${ptsData[0].date} (${ptsData[0][metric]} ${curMeta.unit})</span>
          <b style="color:var(--ac)">PR: ${rawMax} ${curMeta.unit}</b>
          <span class="mu">${ptsData.at(-1).date} (${ptsData.at(-1)[metric]} ${curMeta.unit})</span>
        </div>`;
    }

    const metricButtons = selected.hasWeight
      ? [['maxKg', 'Max kg'], ['e1rm', '1RM (Epley)'], ['volume', 'Volumen'], ['totalReps', selected.unit]]
      : [['totalReps', 'Summe ' + selected.unit], ['volume', 'Volumen']];

    return `<div class="c" data-v3-section="strengthChart">
      <h3>📈 ${S.lang === 'en' ? 'Strength & performance progress' : 'Kraft- & Leistungsverlauf'}</h3>
      <div class="r" style="margin:8px 0">
        <select aria-label="Übung für Kraftverlauf wählen" onchange="v3SelectChartEx(this.value)">
          ${tracked.map(t => `<option value="${esc(t.id)}" ${t.id === selected.id ? 'selected' : ''}>${esc(t.name)} (${t.series.length} Einh.)</option>`).join('')}
        </select>
      </div>
      <div class="r" style="gap:6px;margin-bottom:6px">
        ${metricButtons.map(([k, lbl]) => `<button type="button" class="chip ${metric === k ? 'on' : ''}" style="font-size:12px;padding:6px 12px" onclick="v3SelectChartMetric('${k}')">${esc(lbl)}</button>`).join('')}
      </div>
      ${chartSvg}
    </div>`;
  };

  // --- 7. DASHBOARD & SETTINGS INTEGRATION (INKL. SORTIERUNG) ---
  function ensureStrengthInHistoryOrder() {
    S.ui.historyOrder = Array.isArray(S.ui.historyOrder) ? S.ui.historyOrder : [];
    if (!S.ui.historyOrder.includes('strengthChart')) {
      const chartIdx = S.ui.historyOrder.indexOf('chart');
      if (chartIdx >= 0) S.ui.historyOrder.splice(chartIdx + 1, 0, 'strengthChart');
      else S.ui.historyOrder.push('strengthChart');
    }
  }

  const _prevVHist = vHist;
  vHist = function () {
    ensureStrengthInHistoryOrder();
    const html = _prevVHist();
    // Falls v282.js die Karte bereits über den eigenen Gruppen-Mechanismus gerendert hat:
    if (html.includes('data-v3-section="strengthChart"')) return html;
    if (S.ui.historyVisible && S.ui.historyVisible.strengthChart === false) return html;

    const cardHtml = window.v3StrengthChartCard();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    // Füge die Karte nach 'Trainingsentwicklung' (oder am Ende gemäß S.ui.historyOrder) ein
    const nodes = [...tpl.content.children];
    const devCard = nodes.find(el => /trainingsentwicklung/i.test(el.querySelector?.('h3')?.textContent || ''));
    const wrapper = document.createElement('template');
    wrapper.innerHTML = cardHtml;
    if (devCard) {
      devCard.after(wrapper.content.firstElementChild);
    } else {
      tpl.content.appendChild(wrapper.content.firstElementChild);
    }
    return tpl.innerHTML;
  };

  const _prevVSet = vSet;
  vSet = function () {
    ensureStrengthInHistoryOrder();
    const html = _prevVSet();
    if (html.includes("d282ToggleHistory('strengthChart'")) return html;

    // Falls v282.js noch nicht manuell gepatcht wurde, ergänze die Zeile in "Verlauf Reihung und Anzeige konfigurieren"
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const histSummary = [...tpl.content.querySelectorAll('summary')].find(s => /Verlauf Reihung|Configure history/i.test(s.textContent || ''));
    const container = histSummary?.parentElement?.querySelector('div');
    if (container) {
      const idx = S.ui.historyOrder.indexOf('strengthChart');
      const checked = S.ui.historyVisible?.strengthChart === false ? '' : 'checked';
      const row = document.createElement('div');
      row.className = 'settingsRow';
      row.innerHTML = `<label style="flex:1"><input type="checkbox" ${checked} onchange="d282ToggleHistory('strengthChart',this.checked)"> Kraft- & Leistungsverlauf</label><button class="chip" onclick="d282MoveHistory(${idx},-1)">↑</button><button class="chip" onclick="d282MoveHistory(${idx},1)">↓</button>`;
      container.appendChild(row);
    }
    return tpl.innerHTML;
  };

  // --- 8. BACKUP-EXPORT & IMPORT UM S.setLog ERWEITERN ---
  const _prevExpHist = expHist;
  expHist = function () {
    _prevExpHist();
    const cdEl = document.getElementById('cd');
    if (cdEl) {
      const cu = S.custom.map(c => ({ ...c, img: undefined, draw: undefined }));
      const payload = { log: S.log, setLog: S.setLog, workoutFeedback: S.workoutFeedback, plans: S.plans, cu };
      cdEl.value = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    }
  };

  const _prevDoImpH = doImpH;
  doImpH = function () {
    const raw = document.getElementById('cd')?.value?.trim() || '';
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (o.setLog && typeof o.setLog === 'object') {
        Object.keys(o.setLog).forEach(d => {
          S.setLog[d] = Object.assign(S.setLog[d] || {}, o.setLog[d]);
        });
      }
      if (o.workoutFeedback && typeof o.workoutFeedback === 'object') {
        Object.keys(o.workoutFeedback).forEach(d => {
          S.workoutFeedback[d] = Object.assign(S.workoutFeedback[d] || {}, o.workoutFeedback[d]);
        });
      }
    } catch (_) {}
    _prevDoImpH();
  };
})();

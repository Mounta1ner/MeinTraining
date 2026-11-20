/* Mein Training v3.0 - Modul 3: RPE-Belastungs-Feedback, Schmerzschutz & Smarte Progression */
(function () {
  'use strict';

  S.workoutFeedback = S.workoutFeedback || {};
  S.ui = S.ui || {};
  S.ui.v3DeloadAck = S.ui.v3DeloadAck || {};

  const RPE_ITEMS = [
    { rpe: 1, icon: '🟢', label: 'Zu leicht', labelEn: 'Too easy', sub: 'Deutlich Reserven übrig', subEn: 'Plenty of reserve left' },
    { rpe: 2, icon: '🟡', label: 'Genau richtig', labelEn: 'Just right', sub: 'Gute Trainingsbelastung', subEn: 'Optimal training load' },
    { rpe: 3, icon: '🟠', label: 'Sehr anstrengend', labelEn: 'Very hard', sub: 'Am Limit trainiert', subEn: 'Trained near limit' },
    { rpe: 4, icon: '🔴', label: 'Schmerz / Beschwerden', labelEn: 'Pain / Discomfort', sub: 'Gelenk- oder Muskelbeschwerden', subEn: 'Joint or muscle discomfort' }
  ];

  function nowIsoTimestamp() {
    return typeof timestamp === 'function' ? timestamp() : new Date().toISOString();
  }

  // Merker für den zuletzt abgeschlossenen Plan (für v27Celebrate)
  let lastCompletedContext = { dt: iso(), pid: null };

  // --- 1. STUFE REDUZIEREN (DELOAD / SCHMERZSCHUTZ) ---
  window.levelDownPlan = function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    const curIdx = PROG_LEVELS.indexOf(getPlanLevel(p));
    // Markiere den Schmerz-Hinweis für das letzte Feedback-Datum als bearbeitet
    const latestFb = getLatestPlanFeedback(p.id);
    if (latestFb) {
      S.ui.v3DeloadAck[pid] = latestFb.date;
    }
    if (curIdx > 0) {
      p.level = PROG_LEVELS[curIdx - 1];
      save();
      render();
      toast('🛡️ ' + p.name + ': Stufe gelenkschonend auf „' + p.level + '“ gesenkt');
    } else {
      save();
      render();
      toast('ℹ️ ' + p.name + ' ist bereits auf der Einstiegsstufe „' + getPlanLevel(p) + '“');
    }
  };

  window.v3DismissDeload = function (pid, dateStr) {
    S.ui.v3DeloadAck = S.ui.v3DeloadAck || {};
    S.ui.v3DeloadAck[pid] = dateStr;
    save();
    render();
    toast('Stufe wird für heute beibehalten');
  };

  // --- 2. RPE-FEEDBACK SPEICHERN & ABFRAGE-UI ---
  window.v3SaveWorkoutFeedback = function (dt, pid, rpe, closeModalAfter = true) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    const val = Number(rpe);
    if (![1, 2, 3, 4].includes(val)) return;

    S.workoutFeedback[dt] = S.workoutFeedback[dt] || {};
    S.workoutFeedback[dt][pid] = {
      rpe: val,
      at: nowIsoTimestamp()
    };

    // Falls neues Feedback abgegeben wird, evtl. alte Deload-Bestätigung für diesen Tag zurücksetzen
    if (val === 4 && S.ui.v3DeloadAck?.[pid] === dt) {
      delete S.ui.v3DeloadAck[pid];
    }

    save();

    const meta = RPE_ITEMS.find(x => x.rpe === val);
    if (val === 4) {
      toast('🔴 Beschwerden vermerkt – beim nächsten Training wird eine Schonstufe vorgeschlagen.');
    } else if (meta) {
      toast(`${meta.icon} Bewertung gespeichert: ${meta.label}`);
    }

    if (closeModalAfter && typeof v27CloseModal === 'function') {
      v27CloseModal();
    }
    if (window.WP && WP.active && typeof window.v3RenderPlayer === 'function') {
      window.v3RenderPlayer();
    }
    render();
  };

  window.v3RenderRpeSelectorHtml = function (dt, pid, closeModalOnSelect = true) {
    const currentRpe = S.workoutFeedback?.[dt]?.[pid]?.rpe || 0;
    return `
      <div class="v3-rpe-box">
        <div class="v3-rpe-title">${S.lang === 'en' ? 'How did the workout feel today?' : 'Wie hat sich das Training heute angefühlt?'}</div>
        <div class="v3-rpe-grid">
          ${RPE_ITEMS.map(item => `
            <button type="button" class="v3-rpe-btn rpe-${item.rpe} ${currentRpe === item.rpe ? 'on' : ''}"
              onclick="v3SaveWorkoutFeedback('${dt}','${pid}',${item.rpe},${closeModalOnSelect})">
              <span class="v3-rpe-icon">${item.icon}</span>
              <span class="v3-rpe-text">
                <b>${esc(S.lang === 'en' ? item.labelEn : item.label)}</b>
                <small>${esc(S.lang === 'en' ? item.subEn : item.sub)}</small>
              </span>
            </button>
          `).join('')}
        </div>
      </div>`;
  };

  window.v3OpenFeedbackModal = function (dt, pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    v27Modal(`
      <h2>💬 ${S.lang === 'en' ? 'Workout feedback' : 'Trainings-Feedback'}</h2>
      <p class="mu" style="margin:0 0 10px">${esc(p.name)} · ${new Date(dt + 'T12:00:00').toLocaleDateString('de-AT')}</p>
      ${window.v3RenderRpeSelectorHtml(dt, pid, true)}
      <button type="button" class="chip" style="margin-top:12px;width:100%" onclick="v27CloseModal()">Schließen</button>
    `, false);
  };

  // --- 3. INTEGRATION IN V27CELEBRATE (HOME) & WORKOUT-PLAYER ---
  if (typeof v27OnPlanProgress === 'function') {
    const _prevOnPlanProgress = v27OnPlanProgress;
    v27OnPlanProgress = function (dt, pid, before) {
      const p = S.plans.find(x => x.id === pid);
      if (p && before < 100 && planPct(p, dt) >= 100) {
        lastCompletedContext = { dt, pid };
      }
      _prevOnPlanProgress(dt, pid, before);
    };
  }

  if (typeof v27Celebrate === 'function') {
    const _prevCelebrate = v27Celebrate;
    v27Celebrate = function (t) {
      const text = String(t || '');
      const isPlanCompletion = text.startsWith('Plan abgeschlossen: ') || text.startsWith('Workout complete: ');

      if (!isPlanCompletion) {
        _prevCelebrate(t);
        return;
      }

      // Falls der Vollbild-Workout-Player gerade offen ist, zeigen wir die RPE-Auswahl direkt im Player-Abschluss-Screen
      if (window.WP && WP.active) {
        clearTimeout(V27_DONE_RAF);
        return;
      }

      const planName = text.replace(/^(Plan abgeschlossen:\s*|Workout complete:\s*)/, '').trim();
      const matchedPlan = S.plans.find(x => x.id === lastCompletedContext.pid) || S.plans.find(x => x.name === planName);
      if (!matchedPlan) {
        _prevCelebrate(t);
        return;
      }

      const dt = lastCompletedContext.dt || iso();
      clearTimeout(V27_DONE_RAF);
      V27_DONE_RAF = setTimeout(() => {
        v27Modal(`
          <h2>🏆 ${v27s('Geschafft!', 'Completed!')}</h2>
          <p style="margin:0 0 8px"><b>${esc(matchedPlan.name)}</b> (${getPlanLevel(matchedPlan)})</p>
          ${window.v3RenderRpeSelectorHtml(dt, matchedPlan.id, true)}
          <button type="button" class="b g" style="width:100%;margin-top:12px" onclick="v27CloseModal()">${v27s('Überspringen / Weiter', 'Skip / Continue')}</button>
        `, false);
      }, 90);
    };
  }

  // Integration in den Abschluss-Screen des Vollbild-Workout-Players (v3_workout.js)
  if (typeof window.v3RenderPlayer === 'function') {
    const _prevRenderPlayer = window.v3RenderPlayer;
    window.v3RenderPlayer = function () {
      _prevRenderPlayer();
      if (!window.WP || WP.state !== 'done') return;
      const ov = document.getElementById('v3PlayerOv');
      const wrap = ov?.querySelector('.v3-player-wrap');
      const closeBtn = wrap?.querySelector('button[onclick="v3ClosePlayer()"]');
      if (!wrap || !closeBtn || wrap.querySelector('.v3-rpe-box')) return;

      const rpeContainer = document.createElement('div');
      rpeContainer.innerHTML = window.v3RenderRpeSelectorHtml(WP.dt, WP.planId, false);
      closeBtn.before(rpeContainer.firstElementChild);
    };
  }

  // --- 4. AUSWERTUNGS-LOGIK FÜR SMARTE PROGRESSION & SCHMERZSCHUTZ ---
  function getLatestPlanFeedback(pid) {
    const dates = Object.keys(S.workoutFeedback || {}).sort().reverse();
    for (const d of dates) {
      const fb = S.workoutFeedback[d]?.[pid];
      if (fb && Number(fb.rpe) >= 1 && Number(fb.rpe) <= 4) {
        return { date: d, rpe: Number(fb.rpe), at: fb.at };
      }
    }
    return null;
  }

  window.v3EvaluatePlanProgression = function (p, refDateStr = iso()) {
    if (!p) return { action: 'none' };
    const curLevel = getPlanLevel(p);
    const curIdx = PROG_LEVELS.indexOf(curLevel);

    // 1. Prüfe das allerletzte Feedback des Plans auf Schmerz / Beschwerden (rpe === 4)
    const latestFb = getLatestPlanFeedback(p.id);
    if (latestFb && latestFb.rpe === 4 && S.ui.v3DeloadAck?.[p.id] !== latestFb.date) {
      const prevLevel = curIdx > 0 ? PROG_LEVELS[curIdx - 1] : curLevel;
      return {
        action: 'deload',
        latestDate: latestFb.date,
        curLevel,
        prevLevel,
        canLower: curIdx > 0
      };
    }

    // 2. Prüfe die letzten 14 Tage für eine Stufen-Erhöhung (Level-Up)
    if (curIdx >= PROG_LEVELS.length - 1) {
      return { action: 'none' };
    }

    const refDate = new Date(refDateStr + 'T12:00:00');
    let doneCount = 0;
    let goodRpeCount = 0;
    let hasPainIn14Days = false;

    for (let k = 0; k < 14; k++) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - k);
      const dStr = iso(d);
      const completed = planPct(p, dStr) >= 100;
      const rpe = Number(S.workoutFeedback?.[dStr]?.[p.id]?.rpe) || 0;

      if (rpe === 4) {
        hasPainIn14Days = true;
      }
      if (completed) {
        doneCount++;
        if (rpe === 1 || rpe === 2) {
          goodRpeCount++;
        }
      }
    }

    // Empfehle Level-Up nur, wenn: >= 3 Abschlüsse in 14 Tagen, davon >= 2 mit RPE <= 2 und KEIN RPE === 4
    if (doneCount >= 3 && goodRpeCount >= 2 && !hasPainIn14Days) {
      return {
        action: 'levelup',
        doneCount,
        goodRpeCount,
        curLevel,
        nextLevel: PROG_LEVELS[curIdx + 1]
      };
    }

    return { action: 'none', doneCount, goodRpeCount, hasPainIn14Days };
  };

  // --- 5. HOME-ANSICHT ÜBERSCHREIBEN (WARN- & EMPFEHLUNGSKARTEN) ---
  function buildProgressionCardHtml(p, evalRes) {
    if (evalRes.action === 'deload') {
      const dateFormatted = new Date(evalRes.latestDate + 'T12:00:00').toLocaleDateString('de-AT');
      return `
        <div class="c v3-deload-card" style="border:1.5px solid var(--mc)">
          <div class="r" style="justify-content:space-between">
            <b>🔴 ${S.lang === 'en' ? 'Joint & pain protection' : 'Rücksicht auf Gelenke & Beschwerden'}</b>
            <span class="chip" style="font-size:11px;padding:2px 8px;border-color:var(--mc);color:var(--mc)">${esc(evalRes.curLevel)}${evalRes.canLower ? ' ➔ ' + esc(evalRes.prevLevel) : ''}</span>
          </div>
          <p class="mu" style="font-size:13px;margin:6px 0 10px">
            Beim letzten Training von „<b>${esc(p.name)}</b>“ (${dateFormatted}) wurden Beschwerden gemeldet. Möchtest du die Stufe heute vorsichtshalber um 1 Level senken?
          </p>
          <div class="r" style="gap:8px">
            ${evalRes.canLower
              ? `<button type="button" class="b" style="background:var(--mc);color:#fff" onclick="levelDownPlan('${p.id}')">Stufe reduzieren (${esc(evalRes.prevLevel)})</button>`
              : `<button type="button" class="b" style="background:var(--mc);color:#fff" onclick="v3DismissDeload('${p.id}','${evalRes.latestDate}')">Verstanden (Gewicht/Umfang reduzieren)</button>`}
            <button type="button" class="chip" style="font-size:12px;padding:8px 12px" onclick="v3DismissDeload('${p.id}','${evalRes.latestDate}')">Stufe heute beibehalten</button>
          </div>
        </div>`;
    }

    if (evalRes.action === 'levelup') {
      return `
        <div class="c v3-levelup-card" style="border:1.5px solid var(--ac);background:linear-gradient(135deg,var(--card),var(--ac2))">
          <div class="r" style="justify-content:space-between">
            <b>⭐ ${S.lang === 'en' ? 'Level-up recommended!' : 'Stufen-Erhöhung empfohlen!'}</b>
            <span class="chip on" style="font-size:11px;padding:2px 8px">${esc(evalRes.curLevel)} ➔ ${esc(evalRes.nextLevel)}</span>
          </div>
          <p class="mu" style="font-size:13px;margin:6px 0 10px">
            Du hast „<b>${esc(p.name)}</b>“ in den letzten 14 Tagen ${evalRes.doneCount}× absolviert und ${evalRes.goodRpeCount}× als gut machbar bewertet – ohne Beschwerden. Bereit für die nächste Stufe?
          </p>
          <button type="button" class="b" onclick="levelUpPlan('${p.id}')">Auf Stufe „${esc(evalRes.nextLevel)}“ erhöhen</button>
        </div>`;
    }

    return '';
  }

  const _prevVTodayProgression = vToday;
  vToday = function () {
    const html = _prevVTodayProgression();
    const now = new Date();
    const dt = iso(now);
    const w = wd(now);
    const duePlans = S.plans.filter(p =>
      p.days.length ? p.days.includes(w) : (p.flexAlways || weekDone(p) < (p.pw || 1) || planPct(p, dt) > 0)
    );

    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    // 1. Entferne die alte pauschale Stufen-Erhöhungs-Karte aus app.js
    const oldLevelUpBtns = tpl.content.querySelectorAll('button[onclick^="levelUpPlan(\'"]');
    oldLevelUpBtns.forEach(btn => {
      const card = btn.closest('.c');
      if (card) card.remove();
    });

    // 2. Erzeuge die neuen smarten Progressions- bzw. Schmerz-Warnkarten
    const newCardsHtml = duePlans
      .map(p => buildProgressionCardHtml(p, window.v3EvaluatePlanProgression(p, dt)))
      .filter(Boolean)
      .join('');

    if (newCardsHtml) {
      const planSection = tpl.content.querySelector('section[data-module="plans"]') || tpl.content;
      const wrapper = document.createElement('template');
      wrapper.innerHTML = newCardsHtml;
      planSection.prepend(...wrapper.content.children);
    }

    // 3. Zeige auf jeder Plan-Karte auf Home den heutigen RPE-Status (oder einen Button zum Bewerten bei 100%)
    const selects = tpl.content.querySelectorAll('select[onchange^="setPlanLevel(\'"]');
    selects.forEach(sel => {
      const m = (sel.getAttribute('onchange') || '').match(/^setPlanLevel\('([^']+)'/);
      if (!m) return;
      const pid = m[1];
      const p = S.plans.find(x => x.id === pid);
      if (!p) return;

      const planCard = sel.closest('.c');
      if (!planCard) return;

      const pc = planPct(p, dt);
      const fbToday = S.workoutFeedback?.[dt]?.[pid]?.rpe;
      const meta = RPE_ITEMS.find(x => x.rpe === fbToday);

      if (pc >= 100 || fbToday) {
        const fbRow = document.createElement('div');
        fbRow.className = 'r v3-home-rpe-row';
        fbRow.innerHTML = meta
          ? `<span class="mu" style="font-size:12px">${S.lang === 'en' ? "Today's rating:" : 'Heutiges Empfinden:'} <b>${meta.icon} ${esc(S.lang === 'en' ? meta.labelEn : meta.label)}</b></span>
             <button type="button" class="chip" style="font-size:11px;padding:4px 10px" onclick="v3OpenFeedbackModal('${dt}','${pid}')">✎ ${S.lang === 'en' ? 'Change' : 'Ändern'}</button>`
          : `<span class="mu" style="font-size:12px">${S.lang === 'en' ? 'How was the intensity today?' : 'Wie war die Belastung heute?'}</span>
             <button type="button" class="chip on" style="font-size:11px;padding:4px 10px" onclick="v3OpenFeedbackModal('${dt}','${pid}')">💬 ${S.lang === 'en' ? 'Rate workout' : 'Training bewerten'}</button>`;

        const progressRow = planCard.querySelector('.bar')?.nextElementSibling;
        if (progressRow) progressRow.after(fbRow);
        else planCard.appendChild(fbRow);
      }
    });

    return tpl.innerHTML;
  };
})();

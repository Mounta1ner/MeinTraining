/* Mein Training / Bond v3.0 & v4.1.2 - Modul 4: Joker-System, Pausier-Modus, Heatmap & Kompakte Übungskarten ("Details"-Accordion + Indikations-Suche ohne x) */
(function () {
  'use strict';

  S.ui = S.ui || {};
  S.ui.settingsOpen = S.ui.settingsOpen || {};
  S.ui.exDetailsOpen = S.ui.exDetailsOpen || {};
  S.jokers = S.jokers || { usedDates: [] };
  if (!Array.isArray(S.jokers.usedDates)) S.jokers.usedDates = [];
  S.pauseMode = S.pauseMode || { active: false, reason: '', until: '', ranges: [] };
  if (!Array.isArray(S.pauseMode.ranges)) S.pauseMode.ranges = [];

  function shiftDate(dStr, deltaDays) {
    const dt = new Date(dStr + 'T12:00:00');
    dt.setDate(dt.getDate() + deltaDays);
    return iso(dt);
  }

  function formatShortDate(dStr) {
    try {
      return new Date(dStr + 'T12:00:00').toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' });
    } catch (_) {
      return dStr;
    }
  }

  // --- 1. JOKER & PAUSIER-MODUS HELFER ---
  window.v3IsDatePaused = function (dStr) {
    if (S.pauseMode?.active && dStr <= iso()) {
      if (!S.pauseMode.until || dStr <= S.pauseMode.until) return true;
    }
    return (S.pauseMode?.ranges || []).some(r => r && r.from && dStr >= r.from && (!r.to || dStr <= r.to));
  };

  window.v3IsDateProtected = function (dStr) {
    return (S.jokers?.usedDates || []).includes(dStr) || window.v3IsDatePaused(dStr);
  };

  window.v3GetJokerStats = function () {
    const max = 2;
    const monthPrefix = iso().slice(0, 7);
    const usedThisMonth = (S.jokers?.usedDates || []).filter(d => String(d).startsWith(monthPrefix)).length;
    return { max, used: usedThisMonth, remaining: Math.max(0, max - usedThisMonth) };
  };

  window.v3UseStreakJoker = function (dStr) {
    const st = window.v3GetJokerStats();
    if (st.remaining <= 0) {
      toast('Diesen Monat sind bereits alle Joker aufgebraucht.');
      return;
    }
    if (!S.jokers.usedDates.includes(dStr)) {
      S.jokers.usedDates.push(dStr);
      save();
      render();
      toast('🃏 Joker eingesetzt – Serie geschützt!');
    }
  };

  window.v3TogglePauseMode = function (enable, reason = 'Regeneration / Urlaub', until = '') {
    if (enable) {
      S.pauseMode.active = true;
      S.pauseMode.reason = reason;
      S.pauseMode.until = until;
      S.pauseMode.ranges.push({ from: iso(), to: until || '', reason });
      toast('⏸️ Pausier-Modus aktiviert');
    } else {
      S.pauseMode.active = false;
      const lastRange = S.pauseMode.ranges[S.pauseMode.ranges.length - 1];
      if (lastRange && !lastRange.to) lastRange.to = iso();
      toast('▶️ Pausier-Modus beendet');
    }
    save();
    render();
  };

  function getDayCompletionInfo(dStr) {
    const weekday = wd(new Date(dStr + 'T12:00:00'));
    const duePlans = (S.plans || []).filter(p => Array.isArray(p.days) && p.days.includes(weekday));
    const dueHabits = (S.habits || []).filter(h => h.mode === 'days' && Array.isArray(h.targetDays) && h.targetDays.includes(weekday));
    const due = duePlans.length + dueHabits.length;
    const donePlans = duePlans.filter(p => planPct(p, dStr) >= 100);
    const doneHabits = dueHabits.filter(h => (typeof habitCountOn === 'function' ? habitCountOn(dStr, h.id) : (S.habitLog?.[dStr]?.[h.id] ? 1 : 0)) > 0);
    return {
      due,
      done: donePlans.length + doneHabits.length,
      missedPlans: duePlans.filter(p => planPct(p, dStr) < 100),
      missedHabits: dueHabits.filter(h => (typeof habitCountOn === 'function' ? habitCountOn(dStr, h.id) : (S.habitLog?.[dStr]?.[h.id] ? 1 : 0)) <= 0)
    };
  }

  function getRecentEndangeredDays(lookbackDays = 7) {
    const todayStr = iso();
    const list = [];
    for (let i = 1; i <= lookbackDays; i++) {
      const d = shiftDate(todayStr, -i);
      if (window.v3IsDateProtected(d)) continue;
      const info = getDayCompletionInfo(d);
      if (info.due > 0 && info.done < info.due) {
        list.push({ date: d, missedPlans: info.missedPlans, missedHabits: info.missedHabits });
      }
    }
    return list;
  }

  if (typeof scheduledMisses === 'function') {
    const _origScheduledMisses = scheduledMisses;
    scheduledMisses = function (today = iso()) {
      const raw = _origScheduledMisses(today);
      return raw.filter(m => !window.v3IsDateProtected(m.date));
    };
  }

  if (typeof stats === 'function') {
    stats = function () {
      let total = 0;
      Object.keys(S.log || {}).forEach(d => S.plans.forEach(p => { if (planPct(p, d) >= 100) total++; }));
      const fixed = S.plans.filter(p => p.days && p.days.length);
      const born = p => +String(p.id).slice(1, 14) || 0;
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      let run = 0, best = 0;
      const first = fixed.length ? Math.min(...fixed.map(born)) : Date.now();
      const n = Math.min(400, Math.max(0, Math.ceil((now.getTime() - first) / 864e5)));

      for (let k = n; k >= 0; k--) {
        const d = new Date(now);
        d.setDate(now.getDate() - k);
        const dStr = iso(d);
        const end = new Date(d);
        end.setHours(23, 59, 59);
        const pl = fixed.filter(p => p.days.includes(wd(d)) && born(p) <= end.getTime());
        if (!pl.length) continue;
        const ok = pl.every(p => planPct(p, dStr) >= 100);
        if (ok) {
          run++;
          best = Math.max(best, run);
        } else if (window.v3IsDateProtected(dStr) || k === 0) {
          continue;
        } else {
          run = 0;
        }
      }
      return { total, run, best };
    };
  }

  if (typeof v27Streak === 'function') {
    v27Streak = function (p) {
      let streak = 0;
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      const base = new Date(now);
      base.setDate(base.getDate() - wd(base));

      for (let k = 0; k < 52; k++) {
        const start = new Date(base);
        start.setDate(start.getDate() - 7 * k);
        let done = 0;
        let protectedCount = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dStr = iso(d);
          if (planPct(p, dStr) >= 100) {
            done++;
          } else if (window.v3IsDateProtected(dStr) && (p.days?.length ? p.days.includes(wd(d)) : true)) {
            protectedCount++;
          }
        }
        const required = p.days?.length ? p.days.length : (+p.pw || 1);
        if (done + protectedCount >= required) {
          streak++;
        } else if (k === 0) {
          continue;
        } else {
          break;
        }
      }
      return streak;
    };
  }

  window.v3ComputeProtectedDashboardStats = function () {
    let run = 0, best = 0, miss = 0;
    const now = iso();
    for (let i = 364; i >= 0; i--) {
      const d = shiftDate(now, -i);
      const info = getDayCompletionInfo(d);
      if (!info.due) continue;

      if (info.done === info.due) {
        run++;
        best = Math.max(best, run);
      } else if (window.v3IsDateProtected(d)) {
        continue;
      } else if (i > 0) {
        miss += (info.due - info.done);
        run = 0;
      }
    }
    return { run, best, miss };
  };

  window.v3DuplicatePlan = function (pid) {
    const p = S.plans.find(x => x.id === pid);
    if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = 'p' + Date.now();
    copy.name = p.name + ' (Kopie)';
    delete copy.intro;
    S.plans.push(copy);
    save();
    render();
    toast(`📋 Plan „${copy.name}“ angelegt`);
  };

  // --- 2. INDIKATIONS-SUCHE (OHNE KONTRAINDIKATIONS-FELD 'x') ---
  function normSearch(val) {
    return String(val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss');
  }

  window.v281SearchPositive = function (e, rawQuery) {
    const qNorm = normSearch(rawQuery).trim();
    if (!qNorm) return true;
    const terms = qNorm.split(/\s+/).filter(Boolean);
    const aliases = Array.isArray(e?.al) ? e.al.join(' ') : (e?.al || '');
    const tags = Array.isArray(e?.tags) ? e.tags.join(' ') : '';
    const equip = (e?.m && e.m !== '–' && e.m !== '-') ? e.m : '';

    // Positiver Such-Index: n, al, c, sub, g, r, d, m, tags – bewusst OHNE e.x!
    const haystack = normSearch([
      e?.n,
      aliases,
      e?.c,
      e?.sub,
      e?.g,
      e?.r,
      e?.d,
      equip,
      tags
    ].join(' '));

    return terms.every(term => haystack.includes(term.replace(/^#/, '')));
  };

  window.v281Search = function (e, text) {
    return window.v281SearchPositive(e, text);
  };

  // --- 3. KOMPAKTE ÜBUNGSKARTEN & EINKLAPPBARES "DETAILS"-ACCORDION ---
  window.bondToggleExDetails = function (id, opened) {
    S.ui = S.ui || {};
    S.ui.exDetailsOpen = S.ui.exDetailsOpen || {};
    S.ui.exDetailsOpen[id] = !!opened;
    save();
  };

  function buildExerciseDetailsHtml(e) {
    const isEn = S.lang === 'en';
    const blocks = [];

    if (e.l) {
      blocks.push(`<div class="bond-det-row"><strong>${isEn ? 'Detailed instructions:' : 'Genauere Anleitung:'}</strong><p style="margin:4px 0 0">${esc(e.l)}</p></div>`);
    }
    if (e.s || e.e) {
      let seHtml = '<div class="bond-det-row bond-det-se">';
      if (e.s) seHtml += `<div><strong>Start:</strong> ${esc(e.s)}</div>`;
      if (e.e) seHtml += `<div style="margin-top:4px"><strong>${isEn ? 'End:' : 'Ende:'}</strong> ${esc(e.e)}</div>`;
      seHtml += '</div>';
      blocks.push(seHtml);
    }
    if (e.g) {
      blocks.push(`<div class="bond-det-row"><strong>${isEn ? 'Good for / Goal:' : 'Trainingsziel / Gut für:'}</strong> <span>${esc(e.g)}</span></div>`);
    }
    if (e.r) {
      blocks.push(`
        <div class="bond-det-reha">
          <span class="bond-badge-reha">✚ Reha &amp; Beschwerden</span>
          <div><strong>${isEn ? 'Helpful for complaints / Rehab:' : 'Hilft bei Beschwerden / Reha:'}</strong> ${esc(e.r)}</div>
        </div>
      `);
    }
    if (e.x) {
      blocks.push(`
        <div class="bond-det-warn">
          <span>⚠️ <strong>${isEn ? 'Caution / Not suitable for:' : 'Vorsicht / Nicht geeignet bei:'}</strong> ${esc(e.x)}</span>
        </div>
      `);
    }
    if (Array.isArray(e.al) && e.al.length > 0) {
      blocks.push(`<div class="mu" style="font-size:12px;margin-top:8px">${isEn ? 'Also known as:' : 'Auch bekannt als:'} ${esc(e.al.join(', '))}</div>`);
    }

    if (!blocks.length) return '';

    const isOpen = !!S.ui?.exDetailsOpen?.[e.id];
    return `
      <details class="bond-ex-details" ${isOpen ? 'open' : ''} ontoggle="window.bondToggleExDetails('${esc(e.id)}', this.open)">
        <summary class="bond-ex-summary">
          <span>ℹ️ Details</span>
          <span class="bond-ex-chevron">${isOpen ? '▲' : '▼'}</span>
        </summary>
        <div class="bond-ex-body">
          ${blocks.join('')}
        </div>
      </details>
    `;
  }

  function enhanceLibraryCards(container) {
    if (!container || typeof all !== 'function') return;
    const byName = new Map();
    all().forEach(item => { if (item && item.n) byName.set(item.n.trim(), item); });

    container.querySelectorAll('.c').forEach(card => {
      if (card.dataset.bondCardEnhanced === '1') return;
      const titleEl = card.querySelector('b, h3');
      if (!titleEl) return;
      const rawTitle = titleEl.textContent.replace(/^🧠\s*/, '').trim();
      const exObj = byName.get(rawTitle);
      if (!exObj) return;
      if (typeof window.v3IsMindExercise === 'function' && window.v3IsMindExercise(exObj)) return;

      card.dataset.bondCardEnhanced = '1';

      // Kompakte Badges: Kategorie + Subkategorie, Equipment nur wenn != "–"
      const badgeRow = document.createElement('div');
      badgeRow.className = 'r';
      badgeRow.style.cssText = 'gap:6px;margin:4px 0 8px;flex-wrap:wrap';

      const catText = [exObj.c, exObj.sub].filter(Boolean).join(' · ');
      if (catText) {
        const cChip = document.createElement('span');
        cChip.className = 'chip';
        cChip.style.cssText = 'padding:2px 9px;font-size:11px;font-weight:600';
        cChip.textContent = catText;
        badgeRow.appendChild(cChip);
      }

      if (exObj.m && exObj.m !== '–' && exObj.m !== '-') {
        const mChip = document.createElement('span');
        mChip.className = 'chip on';
        mChip.style.cssText = 'padding:2px 9px;font-size:11px';
        mChip.textContent = '🏋️ ' + exObj.m;
        badgeRow.appendChild(mChip);
      }

      // Langtexte aus offener Standard-Ansicht entfernen
      [...card.querySelectorAll('p, div')].forEach(el => {
        const txt = (el.textContent || '').trim();
        if (/^(Genauere Anleitung:|Detailed instructions:|Gut bei|Good for|Eher nicht|Avoid if|Auch bekannt als:|Also known as:|Start:|Ende:)/i.test(txt)) {
          el.remove();
        }
      });

      const headerAnchor = titleEl.closest('.r') || titleEl;
      headerAnchor.after(badgeRow);

      const detailsHtml = buildExerciseDetailsHtml(exObj);
      if (detailsHtml) {
        const tmp = document.createElement('div');
        tmp.innerHTML = detailsHtml;
        const detailsNode = tmp.firstElementChild;
        const actionBtn = card.querySelector('button.b, select');
        const actionWrap = actionBtn ? (actionBtn.closest('.r') || actionBtn) : null;
        if (actionWrap) actionWrap.before(detailsNode);
        else card.appendChild(detailsNode);
      }
    });
  }

  if (typeof vLib === 'function') {
    const _prevVLibUx = vLib;
    vLib = function () {
      const html = _prevVLibUx();
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      enhanceLibraryCards(tpl.content);
      return tpl.innerHTML;
    };
  }
})();

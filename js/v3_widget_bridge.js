/* Bond (v3.0) - Modul 7 (Schritt 2B): Android Home-Screen Widget & Deep-Link Reminder-Brücke */
(function () {
  'use strict';

  const WIDGET_PAYLOAD_KEY = 'bond_widget_payload_v1';
  const DB = window.BOND_MIND_DB || {};

  // --- 1. AKTUELLEN WIDGET-ZUSTAND BERECHNEN ---
  window.v3BuildBondWidgetPayload = function () {
    const todayStr = iso();
    const weekday = wd(new Date());

    // A) Offene geplante Körper-/Mental-Pläne heute prüfen
    const duePlans = (S.plans || []).filter(p => Array.isArray(p.days) && p.days.includes(weekday));
    const openPlans = duePlans.filter(p => planPct(p, todayStr) < 100);

    // B) Aktive 21–30 Tage Mind-Gewohnheitspläne prüfen
    const activeMindIds = Object.keys(S.mindState?.activePlanProgress || {});
    let openHabitDrill = null;
    for (const pid of activeMindIds) {
      const prog = S.mindState.activePlanProgress[pid];
      const mp = (DB.MIND_PLANS || []).find(p => p.id === pid);
      if (!prog || !mp || typeof DB.getPlanDrillAndReminderStatus !== 'function') continue;

      const daysSinceStart = Math.max(0, Math.floor((Date.now() - new Date(prog.startedAt).getTime()) / 86400000));
      const status = DB.getPlanDrillAndReminderStatus(pid, daysSinceStart, (prog.completedDays || []).length);
      const doneToday = prog.lastCompletedDate === todayStr;

      if (!doneToday && status.isReminderDueToday && status.drillForToday) {
        openHabitDrill = {
          planId: mp.id,
          planTitle: mp.title,
          drillId: status.drillForToday.id,
          drillTitle: status.drillForToday.title,
          durationMinutes: status.drillForToday.durationMinutes || 3
        };
        break;
      }
    }

    // C) Offene Tages-Aktivitäten (Habits) prüfen
    const dueHabits = (S.habits || []).filter(h => {
      if (h.mode === 'days') return Array.isArray(h.targetDays) && h.targetDays.includes(weekday);
      return true;
    });
    const openHabits = dueHabits.filter(h => {
      const cnt = typeof habitCountOn === 'function' ? habitCountOn(todayStr, h.id) : (S.habitLog?.[todayStr]?.[h.id] ? 1 : 0);
      return cnt <= 0;
    });

    // D) Aktuellen Erlaubnissatz & Reflexionsfrage rotierend ermitteln
    const modules = DB.ALL_MIND_MODULES || [];
    const latestEval = S.mindState?.evaluations?.[0];
    const driverInfo = DB.STRESS_DRIVER_INFO || {};
    const offsetVal = Number(S.mindState?.impulseOffset) || 0;
    const dayIndex = Math.floor(Date.now() / 86400000) + offsetVal;

    const driverEntries = Object.values(driverInfo).filter(d => d && d.permissionThought);
    const fallbackThoughts = [
      'Ich darf gute 80 % leisten, klare Grenzen setzen und im Hier und Jetzt handeln.',
      'Fortschritt entsteht durch Dranbleiben in Graustufen – nicht durch Perfektion.',
      'Ein Gedanke ist nur ein Vorschlag meines Gehirns, keine Tatsache.',
      'Ich muss heute nicht alles lösen – nur den nächsten machbaren Schritt.'
    ];
    const thoughtPool = driverEntries.length
      ? driverEntries.map(d => d.permissionThought)
      : fallbackThoughts;

    let driverName = '';
    let permissionThought = thoughtPool[Math.abs(dayIndex) % thoughtPool.length];
    if (latestEval?.dominantDrivers?.[0] && driverInfo[latestEval.dominantDrivers[0]]) {
      driverName = driverInfo[latestEval.dominantDrivers[0]].name;
      if (offsetVal === 0) {
        permissionThought = driverInfo[latestEval.dominantDrivers[0]].permissionThought;
      }
    }

    const mod = modules.length ? modules[Math.abs(dayIndex) % modules.length] : null;
    const reflectionQuestion = mod?.compactCard?.reflectionQuestion || 'Welcher eine Schritt bringt mir heute am meisten Ruhe und Klarheit?';

    // E) Status-Zeile & Tap-Ziel (Deep-Link) für das Widget bestimmen
    let statusLine = '✓ Heute alles erledigt – stark dran geblieben!';
    let hasOpenReminder = false;
    let tapAction = 'quick_check'; // 'open_drill' | 'open_home' | 'quick_check'
    let targetId = '';

    if (openHabitDrill) {
      hasOpenReminder = true;
      statusLine = `🧠 Offen: ${openHabitDrill.drillTitle} (${openHabitDrill.durationMinutes} Min.)`;
      tapAction = 'open_drill';
      targetId = openHabitDrill.drillId;
    } else if (openPlans.length > 0) {
      hasOpenReminder = true;
      const firstPlan = openPlans[0];
      const pct = Math.round(planPct(firstPlan, todayStr));
      statusLine = `⏳ Plan offen: ${firstPlan.name} (${pct}%)`;
      tapAction = 'open_home';
      targetId = firstPlan.id;
    } else if (openHabits.length > 0) {
      hasOpenReminder = true;
      statusLine = `⚡ Noch ${openHabits.length} ${openHabits.length === 1 ? 'Routine' : 'Routinen'} offen (${openHabits[0].name})`;
      tapAction = 'open_home';
      targetId = openHabits[0].id;
    }

    return {
      appName: 'BOND · Body & Mind Training',
      updatedAt: new Date().toISOString(),
      date: todayStr,
      statusLine,
      hasOpenReminder,
      driverName,
      permissionThought,
      reflectionQuestion,
      tapAction,
      targetId
    };
  };

  // --- 2. SYNCHRONISATION MIT LOCALSTORAGE & NATIVER ANDROID-BRIDGE ---
  window.v3SyncBondWidget = function () {
    const payload = window.v3BuildBondWidgetPayload();
    const jsonStr = JSON.stringify(payload);

    try {
      localStorage.setItem(WIDGET_PAYLOAD_KEY, jsonStr);
    } catch (_) {}

    // Falls in Capacitor / Android WebView ausgeführt: direkte Übergabe an native Bridge
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.updateBondFocusWidget === 'function') {
        window.AndroidBridge.updateBondFocusWidget(jsonStr);
      } else if (window.AndroidBridge && typeof window.AndroidBridge.syncWidgets === 'function') {
        window.AndroidBridge.syncWidgets(jsonStr);
      }
      if (window.AndroidBridge && typeof window.AndroidBridge.sync === 'function') {
        window.AndroidBridge.sync(JSON.stringify({
          plan: payload.appName,
          next: `${payload.statusLine}\n„${payload.permissionThought}“\n${payload.reflectionQuestion}`,
          palette: S.palette || 'petrol'
        }));
      }
    } catch (e) {
      console.warn('Bond Widget Bridge Hinweis:', e);
    }

    return payload;
  };

  // Klinke uns in das bestehende syncWidgets() und save() der App ein
  if (typeof window.syncWidgets === 'function') {
    const _origSyncWidgets = window.syncWidgets;
    window.syncWidgets = function () {
      _origSyncWidgets();
      window.v3SyncBondWidget();
    };
  }

  const _origSaveWidget = save;
  save = function () {
    _origSaveWidget();
    window.v3SyncBondWidget();
  };

  // --- 3. DEEP-LINK ROUTER BEIM ÖFFNEN ÜBER DAS ANDROID-WIDGET ---
  function handleWidgetDeepLink() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const action = params.get('bondWidgetAction') || localStorage.getItem('bond_pending_widget_action');
      const targetId = params.get('targetId') || localStorage.getItem('bond_pending_widget_target') || '';
      if (!action) return;

      localStorage.removeItem('bond_pending_widget_action');
      localStorage.removeItem('bond_pending_widget_target');

      if (params.has('bondWidgetAction')) {
        params.delete('bondWidgetAction');
        params.delete('targetId');
        const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }

      setTimeout(() => {
        if (action === 'open_drill' && targetId && typeof window.v3OpenMindDrill === 'function') {
          window.v3OpenMindDrill(targetId);
        } else if (action === 'quick_check' && typeof window.v3OpenQuickCheckModal === 'function') {
          window.v3OpenQuickCheckModal();
        } else if (action === 'open_home' && typeof go === 'function') {
          go('today');
        }
      }, 250);
    } catch (_) {}
  }

  // --- 4. LIVE-VORSCHAU IM EINSTELLUNGSPUNKT „NATIVE ANDROID WIDGETS“ ---
  const _prevVSetWidget = vSet;
  vSet = function () {
    const html = _prevVSetWidget();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const widgetCard = [...tpl.content.querySelectorAll('.c')].find(c =>
      /Native Android Widgets/i.test(c.querySelector('h3, summary')?.textContent || '')
    );

    if (widgetCard) {
      const body = widgetCard.querySelector('details > div') || widgetCard;
      const p = window.v3BuildBondWidgetPayload();
      const previewBox = document.createElement('div');
      previewBox.style.cssText = 'margin-top:10px;padding:12px;border-radius:14px;border:1.5px solid var(--ac);background:var(--bg)';
      previewBox.innerHTML = `
        <div class="r" style="justify-content:space-between;margin-bottom:6px">
          <small style="font-weight:700;color:var(--ac)">📱 Vorschau: BOND · Body & Mind Training & Reminder (4×2 Widget)</small>
          <button type="button" class="chip" style="padding:3px 8px;font-size:11px" onclick="v3SyncBondWidget();toast('Widget-Daten synchronisiert')">↻ Sync</button>
        </div>
        <div style="font-size:12px;font-weight:700;color:${p.hasOpenReminder ? 'var(--mc)' : 'var(--ok)'};margin-bottom:4px">
          ${esc(p.statusLine)}
        </div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">„${esc(p.permissionThought)}“</div>
        <div class="mu" style="font-size:12px">Reflexion: ${esc(p.reflectionQuestion)}</div>
      `;
      body.appendChild(previewBox);
    }

    return tpl.innerHTML;
  };

  window.v3SyncBondWidget();
  handleWidgetDeepLink();
})();

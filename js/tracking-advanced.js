/* Local event log, scheduled misses and Make me feel it ledger (v3.0 Fixed & Synced). */
S.activityEvents = Array.isArray(S.activityEvents) ? S.activityEvents : [];
S.financeLedger = Array.isArray(S.financeLedger) ? S.financeLedger : [];
S.financeSettlements = Array.isArray(S.financeSettlements) ? S.financeSettlements : [];
S.financeSeen = S.financeSeen || {};
S.penalty = S.penalty || { enabled: false, balance: 0.0 };
S.financeEnabled = S.financeEnabled === true || S.penalty.enabled === true;
if (!S.financeStart) {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  S.financeStart = iso(d);
}
S.homeVisible = S.homeVisible || {};
S.homeOrder = S.homeOrder || ['plans', 'mindImpulse', 'activities', 'bpm', 'weight', 'breath', 'finance'];
if (!S.homeOrder.includes('mindImpulse')) {
  const pi = S.homeOrder.indexOf('plans');
  S.homeOrder.splice(pi >= 0 ? pi + 1 : 0, 0, 'mindImpulse');
}
if (!S.homeOrder.includes('finance')) S.homeOrder.push('finance');

const money = n => Number(n || 0).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const cents = n => Math.round((+n || 0) * 100);
const timestamp = () => new Date().toISOString();
const localDay = t => iso(new Date(t));

const FINANCE_TYPES_KEY = 'meintraining-finance-types-v1';
function financeTypesRead() {
  try {
    const o = JSON.parse(localStorage.getItem(FINANCE_TYPES_KEY) || '{}');
    return o && typeof o === 'object' ? o : {};
  } catch (_) {
    return {};
  }
}
const financeTypes = financeTypesRead();
function financeKey(kind, id) {
  return kind + ':' + String(id);
}

function finance281Init(x, kind) {
  if (!x) return { type: 'neutral', amount: 0 };
  const valid = t => ['positive', 'negative', 'neutral'].includes(t);
  const saved = kind ? financeTypes[financeKey(kind, x.id)] : undefined;
  const done = Number(x.penaltyDone) || 0;
  const miss = Number(x.penaltyMiss) || 0;

  if (!x.finance281 || !valid(x.finance281.type)) {
    let type = 'neutral';
    let amount = 0;
    if (miss > 0 && done === 0) {
      type = 'positive';
      amount = miss;
    } else if (done > 0 && miss === 0) {
      type = 'negative';
      amount = done;
    } else if (miss > 0 || done > 0) {
      type = miss >= done ? 'positive' : 'negative';
      amount = Math.max(miss, done);
    }
    x.finance281 = { type, amount };
  }

  if (valid(saved)) {
    x.finance281.type = saved;
  }

  // Wenn Positiv oder Negativ gewählt ist, aber Betrag noch 0 ist, setze Standard 1,00 € (sofern nicht bewusst 0 gesetzt)
  if ((x.finance281.type === 'positive' || x.finance281.type === 'negative') && !(Number(x.finance281.amount) > 0) && !x.finance281ExplicitZero) {
    x.finance281.amount = Math.max(done, miss, 1);
  }

  return x.finance281;
}

function finance281Apply(x, kind) {
  if (!x) return;
  const f = finance281Init(x, kind);
  const amt = Math.max(0, Number(f.amount) || 0);
  x.penaltyDone = f.type === 'negative' ? amt : 0;
  x.penaltyMiss = f.type === 'positive' ? amt : 0;
}

function syncLegacyPenaltyBalance() {
  S.penalty = S.penalty || { enabled: false, balance: 0 };
  S.penalty.enabled = !!S.financeEnabled;
  S.penalty.balance = remainingMoney();
}

function finance281Set(kind, id, key, value) {
  if (kind !== 'plan' && kind !== 'habit') return;
  const x = (kind === 'plan' ? S.plans : S.habits).find(a => String(a.id) === String(id));
  if (!x) {
    toast('Aktivität oder Plan nicht gefunden');
    return;
  }
  const f = finance281Init(x, kind);
  const isLiveInput = key === 'amountInput';

  if (key === 'type') {
    if (!['positive', 'negative', 'neutral'].includes(value)) return;
    f.type = value;
    x.finance281ExplicitNeutral = (value === 'neutral');
    if ((value === 'positive' || value === 'negative') && !(Number(f.amount) > 0)) {
      f.amount = 1;
      x.finance281ExplicitZero = false;
    }
    if (value === 'positive' || value === 'negative') {
      S.financeEnabled = true;
      if (S.penalty) S.penalty.enabled = true;
      if (!S.financeActivatedAt) S.financeActivatedAt = timestamp();
    }
    financeTypes[financeKey(kind, x.id)] = value;
    try {
      localStorage.setItem(FINANCE_TYPES_KEY, JSON.stringify(financeTypes));
    } catch (_) {}
  } else if (key === 'amount' || key === 'amountInput') {
    const normalized = String(value ?? '').replace(',', '.');
    if (isLiveInput && normalized.trim() === '') return;
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0 || n > 10000) {
      if (!isLiveInput) {
        toast('Betrag zwischen 0 und 10.000 €');
        render();
      }
      return;
    }
    f.amount = n;
    x.finance281ExplicitZero = (n === 0);
    // Wenn Betrag > 0 eingegeben wird und Bewertung noch auf Neutral stand -> automatisch auf Positiv schalten
    if (n > 0 && f.type === 'neutral') {
      f.type = 'positive';
      x.finance281ExplicitNeutral = false;
      financeTypes[financeKey(kind, x.id)] = 'positive';
      try {
        localStorage.setItem(FINANCE_TYPES_KEY, JSON.stringify(financeTypes));
      } catch (_) {}
    }
    if (n > 0 && !S.financeEnabled) {
      S.financeEnabled = true;
      if (S.penalty) S.penalty.enabled = true;
      if (!S.financeActivatedAt) S.financeActivatedAt = timestamp();
    }
  } else {
    return;
  }

  x.finance281Explicit = true;
  finance281Apply(x, kind);
  ensureMisses();
  ensureCompletedPlanBookings();
  syncLegacyPenaltyBalance();
  save();

  if (isLiveInput) {
    const openEl = document.getElementById('mfSettingsOpenTotal');
    if (openEl) openEl.textContent = money(remainingMoney());
    return;
  }
  render();
}
window.finance281Set = finance281Set;

function bookFinance(uid, category, targetId, name, type, amount, at = timestamp()) {
  if (!S.financeEnabled || !amount || amount <= 0) return false;
  const existing = S.financeLedger.find(e => e.id === uid);
  if (existing) {
    existing.cents = amount;
    syncLegacyPenaltyBalance();
    return false;
  }
  S.financeLedger.push({ id: uid, category, targetId, name, type, cents: amount, at });
  syncLegacyPenaltyBalance();
  return true;
}
window.bookFinance = bookFinance;

// Zentrale Buchungsfunktion für Aktivitäten (Abhaken = 'done', Auslassen = 'skip')
function v3ProcessHabitFinance(id, type = 'done', when = timestamp(), source = 'app', eventId) {
  const h = S.habits.find(x => String(x.id) === String(id));
  if (!h) return;
  finance281Apply(h, 'habit');

  const uid = eventId || 'act-' + when + '-' + Math.random().toString(36).slice(2, 8);
  const dayStr = localDay(when);

  if (!S.activityEvents.some(e => e.id === uid)) {
    S.activityEvents.push({ id: uid, habitId: h.id, name: h.name, type, at: when, source });
  }

  // Falls die Aktivität eine aktive Bewertung (Positiv/Negativ) mit Betrag > 0 hat, ist Make me feel it aktiv
  const f = h.finance281 || { type: 'neutral', amount: 0 };
  if ((f.type === 'positive' || f.type === 'negative') && Number(f.amount) > 0 && S.financeExplicitlyDisabled !== true) {
    S.financeEnabled = true;
    if (S.penalty) S.penalty.enabled = true;
  }

  if (!S.financeEnabled) return;

  if (type === 'done') {
    // 1. Falls "Positiv" (bei Auslassen buchen) und heute zuvor auf "Auslassen" geklickt wurde -> heutige Strafbuchung stornieren!
    if (f.type === 'positive') {
      const beforeLen = S.financeLedger.length;
      S.financeLedger = S.financeLedger.filter(e => {
        if (String(e.targetId) !== String(h.id)) return true;
        if (e.type !== 'skip' && e.type !== 'miss') return true;
        return localDay(e.at) !== dayStr && !String(e.id).endsWith(':' + dayStr);
      });
      if (S.financeLedger.length < beforeLen) {
        syncLegacyPenaltyBalance();
        toast(`✓ Auslassen-Buchung für „${h.name}“ heute aufgehoben`);
      }
    }
    // 2. Falls "Negativ" (bei Erledigt buchen) -> Betrag sofort buchen!
    const amountCents = cents(h.penaltyDone);
    if (amountCents > 0) {
      if (bookFinance(uid, 'Aktivität', h.id, h.name, 'done', amountCents, when)) {
        toast(`⚡ +${money(amountCents / 100)} in Make me feel it gebucht (${h.name})`);
      }
    }
  } else {
    // type === 'skip' (Button "Auslassen" geklickt)
    // 1. Falls "Negativ" (bei Erledigt buchen) und heute versehentlich abgehakt wurde -> letzte heutige Done-Buchung stornieren
    if (f.type === 'negative') {
      const idx = [...S.financeLedger].reverse().findIndex(e => String(e.targetId) === String(h.id) && e.type === 'done' && localDay(e.at) === dayStr);
      if (idx >= 0) {
        const realIdx = S.financeLedger.length - 1 - idx;
        S.financeLedger.splice(realIdx, 1);
        syncLegacyPenaltyBalance();
        toast(`↩️ Heutige Buchung für „${h.name}“ storniert`);
      }
    }
    // 2. Falls "Positiv" (bei Auslassen buchen) -> Betrag sofort buchen (1x pro Tag beim Auslassen)!
    const amountCents = cents(h.penaltyMiss);
    if (amountCents > 0) {
      const skipUid = 'skip:h:' + h.id + ':' + dayStr;
      S.financeSeen['miss:h:' + h.id + ':' + dayStr] = true;
      if (bookFinance(skipUid, 'Aktivität', h.id, h.name, 'skip', amountCents, when)) {
        toast(`⚡ +${money(amountCents / 100)} wegen Auslassen gebucht (${h.name})`);
      }
    }
  }
  syncLegacyPenaltyBalance();
}
window.addActivityEvent = v3ProcessHabitFinance;
window.v3ProcessHabitFinance = v3ProcessHabitFinance;

window.v3MasterTrackHabit = function (id, isDone) {
  const h = S.habits.find(x => String(x.id) === String(id));
  if (!h) return;
  const d = iso();
  const today = S.habitLog[d] || (S.habitLog[d] = {});
  if (isDone) {
    today[h.id] = (typeof today[h.id] === 'number' ? today[h.id] : (today[h.id] === true ? 1 : 0)) + 1;
    h.doneCount = (+h.doneCount || 0) + 1;
  } else {
    today[h.id] = false;
    h.missedCount = (+h.missedCount || 0) + 1;
  }
  v3ProcessHabitFinance(h.id, isDone ? 'done' : 'skip');
  save();
  if (typeof syncWidgets === 'function') syncWidgets();
  render();
};
trackHabit = window.v3MasterTrackHabit;

function importWidgetEvents() {
  try {
    const raw = window.AndroidBridge?.drainEvents?.();
    if (!raw) return;
    const events = JSON.parse(raw);
    let modified = false;
    for (const ev of events) {
      if (!ev || !ev.id || !ev.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) continue;
      const h = S.habits.find(x => x.id === ev.id);
      if (!h) continue;
      const at = ev.timestamp ? new Date(ev.timestamp).toISOString() : ev.date + 'T12:00:00.000Z';
      const uid = 'android-' + ev.timestamp + '-' + ev.id;
      if (S.activityEvents.some(x => x.id === uid)) continue;
      const date = ev.date;
      S.habitLog[date] = S.habitLog[date] || {};
      const old = S.habitLog[date][ev.id];
      S.habitLog[date][ev.id] = (typeof old === 'number' ? old : old === true ? 1 : 0) + 1;
      h.doneCount = (+h.doneCount || 0) + 1;
      v3ProcessHabitFinance(ev.id, 'done', at, 'widget', uid);
      modified = true;
    }
    if (modified) {
      save();
      render();
    }
  } catch (e) {
    console.warn('Widget events', e);
  }
}

window.addEventListener('focus', importWidgetEvents);
setTimeout(importWidgetEvents, 1300);

function justDate(d) { return new Date(d + 'T12:00:00'); }
function monday(d) { let n = justDate(d); n.setDate(n.getDate() - wd(n)); return n; }
function nextDay(date, add) { let d = justDate(date); d.setDate(d.getDate() + add); return iso(d); }
function bornDay(obj) {
  const key = String(obj?.id || '');
  const millis = Number(key.substring(1, 14));
  const valid = millis > 1500000000000 && millis < Date.now() + 864e5;
  return obj?.createdAt?.slice(0, 10) || (valid ? iso(new Date(millis)) : S.financeStart);
}
function habitCountOn(day, id) {
  const v = S.habitLog[day]?.[id];
  return typeof v === 'number' ? v : v === true ? 1 : 0;
}

function scheduledMisses(today = iso()) {
  S.plans.forEach(x => finance281Apply(x, 'plan'));
  S.habits.forEach(x => finance281Apply(x, 'habit'));
  const misses = [];
  const until = nextDay(today, -1);
  const seen = new Set();
  const maxDays = 365;
  const start = nextDay(today, -maxDays);

  const put = (key, category, obj, day) => {
    if (seen.has(key)) return;
    seen.add(key);
    misses.push({
      id: 'miss:' + key,
      category,
      targetId: obj.id,
      name: obj.name,
      type: 'miss',
      date: day,
      at: day + 'T23:59:59',
      cents: cents(obj.penaltyMiss)
    });
  };

  S.plans.forEach(p => {
    const first = bornDay(p);
    if (p.days?.length) {
      for (let day = start; day <= until; day = nextDay(day, 1)) {
        if (day >= first && p.days.includes(wd(justDate(day))) && planPct(p, day) < 100) {
          put('p:' + p.id + ':' + day, 'Plan', p, day);
        }
      }
    } else {
      let m = monday(start);
      for (let w = iso(m); nextDay(w, 6) < today; w = nextDay(w, 7)) {
        const end = nextDay(w, 6);
        if (first > end) continue;
        let done = 0;
        for (let day = w; day <= end; day = nextDay(day, 1)) {
          if (planPct(p, day) >= 100) done++;
        }
        for (let i = done; i < Math.min(7, Math.max(1, +p.pw || 1)); i++) {
          put('p:' + p.id + ':' + w + ':' + i, 'Plan', p, end);
        }
      }
    }
  });

  S.habits.forEach(h => {
    const first = bornDay(h);
    if (h.mode === 'days' && h.targetDays?.length) {
      for (let day = start; day <= until; day = nextDay(day, 1)) {
        if (day >= first && h.targetDays.includes(wd(justDate(day))) && habitCountOn(day, h.id) < 1) {
          put('h:' + h.id + ':' + day, 'Aktivität', h, day);
        }
      }
    } else if (h.mode === 'week') {
      for (let w = iso(monday(start)); nextDay(w, 6) < today; w = nextDay(w, 7)) {
        const end = nextDay(w, 6);
        if (first > end) continue;
        let done = 0;
        for (let day = w; day <= end; day = nextDay(day, 1)) {
          done += habitCountOn(day, h.id);
        }
        for (let i = done; i < Math.min(31, Math.max(1, +h.weeklyTarget || 1)); i++) {
          put('h:' + h.id + ':' + w + ':' + i, 'Aktivität', h, end);
        }
      }
    }
  });

  return misses;
}

function missedTrainingTotal() { return scheduledMisses().length; }
function financeMissedEvents() { return scheduledMisses().filter(x => !S.financeSeen[x.id]); }

function ensureMisses() {
  if (!S.financeEnabled) return;
  let changed = false;
  for (const m of scheduledMisses()) {
    if (!m.cents || m.cents <= 0) continue;
    // Prüfe ob am selben Tag bereits manuell 'skip' gebucht wurde
    const manualSkipId = 'skip:h:' + m.targetId + ':' + m.date;
    if (S.financeLedger.some(e => e.id === manualSkipId)) {
      S.financeSeen[m.id] = true;
      continue;
    }
    if (S.financeSeen[m.id] && S.financeLedger.some(e => e.id === m.id)) continue;
    if (m.date >= S.financeStart || m.date >= bornDay({ id: m.targetId })) {
      bookFinance(m.id, m.category, m.targetId, m.name, 'miss', m.cents, m.at);
      S.financeSeen[m.id] = true;
      changed = true;
    }
  }
  if (changed) {
    syncLegacyPenaltyBalance();
    save();
  }
}

function ensureCompletedPlanBookings() {
  if (!S.financeEnabled) return;
  let changed = false;
  S.plans.forEach(p => {
    finance281Apply(p, 'plan');
    const doneCents = cents(p.penaltyDone);
    Object.keys(S.log || {}).forEach(day => {
      if (planPct(p, day) >= 100) {
        // Falls Plan heute geschafft wurde, etwaige Miss-Buchung für diesen Tag entfernen
        const missId = 'miss:p:' + p.id + ':' + day;
        const mIdx = S.financeLedger.findIndex(e => e.id === missId);
        if (mIdx >= 0) {
          S.financeLedger.splice(mIdx, 1);
          changed = true;
        }
        if (doneCents > 0) {
          const uid = 'plan-done:' + p.id + ':' + day;
          if (!S.financeLedger.some(e => e.id === uid)) {
            bookFinance(uid, 'Plan', p.id, p.name, 'done', doneCents, day + 'T18:00:00.000Z');
            changed = true;
          }
        }
      }
    });
  });
  if (changed) {
    syncLegacyPenaltyBalance();
    save();
  }
}
window.ensureMisses = ensureMisses;
window.ensureCompletedPlanBookings = ensureCompletedPlanBookings;

function activeLedger() {
  return S.financeLedger.filter(x => !S.financeSettlements.some(z => z.ids?.includes(x.id)));
}
function remainingMoney() {
  return activeLedger().reduce((sum, x) => sum + (Number(x.cents) || 0), 0) / 100;
}
window.activeLedger = activeLedger;
window.remainingMoney = remainingMoney;

function financeHome() {
  if (!S.financeEnabled || S.homeVisible?.finance === false) return '';
  ensureMisses();
  ensureCompletedPlanBookings();
  syncLegacyPenaltyBalance();
  return `<div class="c mf-compact"><div class="r" style="justify-content:space-between"><div><h3>⚡ Make me feel it</h3><strong>${money(remainingMoney())}</strong><div class="mu">Noch offen</div></div><button class="b g" onclick="go('hist')">Details →</button></div></div>`;
}
window.financeHome = financeHome;

function financialSettingRow(kind, x) {
  finance281Init(x, kind);
  finance281Apply(x, kind);
  const f = x.finance281;
  const id = encodeURIComponent(String(x.id));
  return `<div class="mf-row">
    <b>${esc(x.name)}</b>
    <label>Bewertung
      <select data-item-id="${id}" onchange="finance281Set('${kind}',decodeURIComponent(this.dataset.itemId),'type',this.value)">
        ${[
          ['positive', 'Positiv – bei Auslassen buchen'],
          ['negative', 'Negativ – bei Erledigt buchen'],
          ['neutral', 'Neutral – keine Buchung']
        ].map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </label>
    <label>Betrag (€)
      <input class="mf-input" type="number" min="0" max="10000" step="0.5" value="${f.amount}" data-item-id="${id}"
        oninput="finance281Set('${kind}',decodeURIComponent(this.dataset.itemId),'amountInput',this.value)"
        onchange="finance281Set('${kind}',decodeURIComponent(this.dataset.itemId),'amount',this.value)">
    </label>
  </div>`;
}

function financeSettings() {
  ensureMisses();
  ensureCompletedPlanBookings();
  syncLegacyPenaltyBalance();
  return `<div class="c" id="v3MakeMeFeelItSettingsCard">
    <h3>⚡ Make me feel it</h3>
    <label class="r"><input type="checkbox" ${S.financeEnabled ? 'checked' : ''} onchange="toggleFinance(this.checked)"> Aktivieren</label>
    <p class="mu"><b>Positiv:</b> Betrag wird gebucht, wenn du eine Aktivität auf „Auslassen“ setzt oder einen geplanten Tag verpasst.<br><b>Negativ:</b> Betrag wird sofort beim „Abhaken / Erledigen“ gebucht.<br><b>Neutral:</b> Keine Buchung.</p>
    <h4>Trainingspläne</h4>
    ${S.plans.map(x => financialSettingRow('plan', x)).join('') || '<p class="mu">Keine Pläne</p>'}
    <h4>Aktivitäten</h4>
    ${S.habits.map(x => financialSettingRow('habit', x)).join('') || '<p class="mu">Keine Aktivitäten</p>'}
    <p style="margin-top:10px">Aktuell offen: <b id="mfSettingsOpenTotal" style="color:var(--ac);font-size:16px">${money(remainingMoney())}</b></p>
  </div>`;
}
window.financeSettings = financeSettings;

function toggleFinance(flag) {
  S.financeEnabled = !!flag;
  S.financeExplicitlyDisabled = !flag;
  if (S.penalty) S.penalty.enabled = !!flag;
  if (flag && !S.financeActivatedAt) {
    S.financeActivatedAt = timestamp();
    const d = new Date();
    d.setDate(d.getDate() - 7);
    S.financeStart = iso(d);
  }
  if (flag) {
    ensureMisses();
    ensureCompletedPlanBookings();
  }
  syncLegacyPenaltyBalance();
  save();
  render();
}
window.toggleFinance = toggleFinance;

const _vSetAdvanced = vSet;
vSet = function () {
  return _vSetAdvanced() + financeSettings();
};

// financeHome() is rendered directly in app.js Home slot

function activityHistoryRows() {
  return [...S.activityEvents].sort((a, b) => b.at.localeCompare(a.at));
}
function activityBarChart(id) {
  let values = [];
  for (let i = 13; i >= 0; i--) {
    const d = nextDay(iso(), -i);
    values.push(habitCountOn(d, id));
  }
  const max = Math.max(1, ...values);
  return `<div class="activity-bars" role="img" aria-label="14 Tage Aktivitäten">${values.map((n, i) => `<span style="height:${Math.max(2, Math.round((n / max) * 100))}%" title="${nextDay(iso(), i - 13)}: ${n}×"></span>`).join('')}</div><small class="mu">Letzte 14 Tage</small>`;
}
function activityHistory() {
  return `<div class="c"><h3>🎯 Aktivitäten, Zeitstempel & Historie</h3><p class="mu">Neue Einträge enthalten Datum und Uhrzeit.</p>${S.habits.map(h => {
    const events = activityHistoryRows().filter(x => x.habitId === h.id);
    return `<details><summary style="padding:11px 0;cursor:pointer"><b>${esc(h.name)}</b> · ${h.doneCount || 0}× erledigt</summary>${activityBarChart(h.id)}<div class="fin-list">${events.slice(0, 15).map(e => `<div class="settingsRow" style="border-bottom:1px solid var(--bd)"><span style="flex:1">${new Date(e.at).toLocaleString('de-AT')}</span><span>${e.type === 'done' ? '✓ Erledigt' : '✗ Ausgelassen'}${e.source === 'widget' ? ' · Widget' : ''}</span></div>`).join('') || '<p class="mu">Noch keine Einträge mit Zeitstempel.</p>'}</div></details>`;
  }).join('')}<button class="b g" style="margin-top:12px" onclick="exportActivityHistory()">📥 Alle Einträge als CSV exportieren</button></div>`;
}
function csvCell(x) { return '"' + String(x ?? '').replace(/"/g, '""') + '"'; }
function triggerDownload(name, text) {
  const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 2000);
}
function exportActivityHistory() {
  const rows = [['Datum', 'Uhrzeit', 'ISO-Zeitstempel', 'Aktivität', 'Aktion', 'Quelle']];
  for (let e of activityHistoryRows()) {
    let d = new Date(e.at);
    rows.push([d.toLocaleDateString('de-AT'), d.toLocaleTimeString('de-AT'), e.at, e.name, e.type === 'done' ? 'Erledigt' : 'Ausgelassen', e.source]);
  }
  triggerDownload('BOND_Aktivitaeten.csv', rows.map(row => row.map(csvCell).join(';')).join('\r\n'));
}
function financeHistory() {
  ensureMisses();
  ensureCompletedPlanBookings();
  syncLegacyPenaltyBalance();
  let ledger = S.financeLedger.slice().reverse().slice(0, 100);
  const sum = remainingMoney();
  return `<div class="c"><h3>⚡ Make me feel it · Verlauf</h3><p><strong>${money(sum)}</strong> offen · ${S.financeLedger.length} Buchungen</p><div class="r"><button class="b g" onclick="settleFinance()">✓ Als beglichen zurücksetzen</button><button class="chip" onclick="exportFinance()">CSV exportieren</button></div><h4 style="margin:12px 0 7px">Buchungen</h4><div class="fin-list"><table class="fin-events"><thead><tr><th>Zeit</th><th>Quelle</th><th>Grund</th><th>Betrag</th></tr></thead><tbody>${ledger.map(e => `<tr><td>${esc(new Date(e.at).toLocaleDateString('de-AT'))}</td><td>${esc(e.name)}</td><td>${e.type === 'miss' ? 'Verpasst' : e.type === 'skip' ? 'Ausgelassen' : 'Erledigt'}</td><td>${money(e.cents / 100)}</td></tr>`).join('')}</tbody></table></div><h4>Spenden-Vorschläge</h4><div class="r"><a class="b g" target="_blank" rel="noopener noreferrer" href="https://lichtinsdunkel.org/">Licht ins Dunkel ↗</a><a class="b g" target="_blank" rel="noopener noreferrer" href="https://www.wingsforlife.com/de/">Wings for Life ↗</a></div><p class="mu" style="margin-top:15px">Entwickler unterstützen: Marvin Berger</p><div class="r"><code style="flex:1;overflow-wrap:anywhere">AT55 1912080529408009</code><button class="chip" onclick="copyDeveloperIban()">📋 IBAN kopieren</button></div><p class="mu">Die Links führen zur jeweiligen Spendenorganisation. Es wird keine Überweisung automatisch gestartet.</p></div>`;
}
function copyDeveloperIban() {
  const text = 'AT551912080529408009';
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast('IBAN kopiert')).catch(() => copyFallback(text));
  else copyFallback(text);
}
function copyFallback(text) {
  const x = document.createElement('textarea');
  x.value = text;
  document.body.appendChild(x);
  x.select();
  const done = document.execCommand('copy');
  x.remove();
  toast(done ? 'IBAN kopiert' : 'IBAN bitte manuell kopieren');
}
function settleFinance() {
  if (!confirm('Offene Beträge als beglichen markieren und auf 0,00 € zurücksetzen? Die Historie bleibt erhalten.')) return;
  const ids = activeLedger().map(e => e.id);
  S.financeSettlements.push({ at: timestamp(), ids, amount: cents(remainingMoney()) });
  syncLegacyPenaltyBalance();
  save();
  render();
}
window.settleFinance = settleFinance;
window.resetPenalty = settleFinance;

function exportFinance() {
  let rows = [['Zeitstempel', 'Kategorie', 'Quelle', 'Aktion', 'Betrag EUR', 'Beglichen']];
  for (let e of S.financeLedger) {
    rows.push([e.at, e.category, e.name, e.type, (e.cents / 100).toFixed(2), S.financeSettlements.some(s => s.ids.includes(e.id)) ? 'Ja' : 'Nein']);
  }
  triggerDownload('BOND_Spendenkonto.csv', rows.map(r => r.map(csvCell).join(';')).join('\r\n'));
}
const _vHistAdvanced = vHist;
vHist = function () {
  return _vHistAdvanced() + activityHistory() + financeHistory();
};

const _tickAdvanced = tick;
tick = function (date, id, i, n) {
  let plan = S.plans.find(x => x.id === id);
  let before = plan ? planPct(plan, date) : 0;
  _tickAdvanced(date, id, i, n);
  if (plan) finance281Apply(plan, 'plan');
  ensureCompletedPlanBookings();
  if (S.financeEnabled && plan && before < 100 && planPct(plan, date) === 100 && cents(plan.penaltyDone) > 0) {
    toast(`⚡ +${money(plan.penaltyDone)} in Make me feel it gebucht (${plan.name})`);
  }
  if (tab === 'today') render();
};

const _tickNextAdvanced = tickNext;
tickNext = function (date, id, i, max) {
  const p = S.plans.find(x => x.id === id);
  const before = p ? planPct(p, date) : 0;
  _tickNextAdvanced(date, id, i, max);
  if (p) finance281Apply(p, 'plan');
  ensureCompletedPlanBookings();
  if (S.financeEnabled && p && before < 100 && planPct(p, date) === 100 && cents(p.penaltyDone) > 0) {
    toast(`⚡ +${money(p.penaltyDone)} in Make me feel it gebucht (${p.name})`);
  }
  if (tab === 'today') render();
};

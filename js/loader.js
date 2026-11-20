/* Offline-first & Over-the-Air (OTA) Catalog Loader for GitHub Pages and Capacitor APK (v3.1 - JSON Mind Architecture) */
(async function () {
  'use strict';

  const CATALOG_CACHE_KEY = 'mt_catalog_cache_v1';
  const MIND_CACHE_KEY = 'mt_mind_cache_v1';
  const CATALOG_META_KEY = 'mt_catalog_meta_v1';
  const REMOTE_URL_KEY = 'mt_remote_data_url';
  const ADMIN_STORAGE_KEY = 'mt_admin_catalog_overrides_v1';
  const ADMIN_MIND_KEY = 'mt_admin_mind_overrides_v1';

  const DEFAULT_REMOTE_DATA_BASE = 'https://mounta1ner.github.io/MeinTraining/data/';

  // Entschlackte Modul-Liste (v3_mind_data entfällt, da jetzt in data/mind.json)
  const modules = [
    'app',
    'features',
    'tracking-advanced',
    'v27',
    'v28',
    'v282',
    'v3_tracking',
    'v3_workout',
    'v3_progression',
    'v3_ux',
    'v3_admin',
    'v3_mind',
    'v3_widget_bridge'
  ];

  // Sauberes JSON-Objekt für „Laufen“ (ersetzt ADD6_RAW aus app.js)
  const LAUFEN_FALLBACK_EX = {
    id: 'e131',
    n: 'Laufen',
    al: ['Joggen', 'Jogging', 'Dauerlauf', 'Running', 'Laufen im Freien', 'Ausdauerlauf'],
    c: 'Fitnessstudio',
    sub: 'Ausdauer',
    m: 'Laufschuhe',
    d: 'Starte mit 5 Minuten zügigem Gehen. Laufe dann in einem Tempo, bei dem du dich noch in ganzen Sätzen unterhalten kannst. Als Anfänger wechselst du zwischen Laufen und Gehen und verlängerst die Laufphasen langsam. Zum Schluss 5 Minuten locker gehen und leicht dehnen.',
    s: 'Aufrecht stehen, Blick nach vorn, Schultern locker',
    e: 'Lockerer, gleichmäßiger Laufschritt',
    g: 'Ausdauer, Herz-Kreislauf, Stressabbau, Stimmung, Gewichtskontrolle, Oberschenkel, Wade, Fuß, Hüfte, Knochen, Abnehmen',
    x: 'Akute Schmerzen oder Verletzungen an Knie, Schienbein, Achillessehne, Fuß oder Hüfte; Fieber oder Infekt; bekannte Herz-Kreislauf-Erkrankungen, starkes Übergewicht oder lange Trainingspause: vorher ärztlich abklären; bei stechendem Schmerz sofort abbrechen; nicht bei Glatteis oder schlechter Sicht',
    l: 'Worauf du beim richtigen Laufen achtest. Haltung: aufrecht, der Blick geht 20 bis 30 Meter nach vorn, Schultern locker und tief, der Oberkörper ist leicht nach vorn geneigt (aus den Fußgelenken, nicht aus der Hüfte). Arme: im Ellbogen etwa im rechten Winkel gebeugt, locker neben dem Körper vor und zurück, die Hände entspannt. Schritt: lieber kurze, schnelle Schritte als weites Ausgreifen. Der Fuß landet möglichst unter dem Körper, nicht weit davor. Ob Ferse oder Mittelfuß ist weniger wichtig als eine weiche, leise Landung. Tempo: gerade so schnell, dass du dich noch unterhalten kannst, besonders am Anfang. Aufbau: Wechsle als Anfänger zwischen Gehen und Laufen und verlängere die Laufphasen von Woche zu Woche, zum Beispiel von 2 Minuten bis hin zu 30 Minuten am Stück. Plane 2 bis 3 Einheiten pro Woche mit Ruhetagen dazwischen. Steigere nicht Umfang und Tempo gleichzeitig, als grobe Faustregel höchstens etwa 10 % mehr pro Woche. Schuhe und Boden: passende Laufschuhe aus dem Fachhandel, Wald- und Feldwege sind gelenkschonender als Asphalt. Schmerz: Muskelkater ist normal, stechende Schmerzen in Gelenken oder Sehnen nicht. Dann pausieren und bei anhaltenden Beschwerden abklären lassen.',
    fig: [
      '28,7,26,13,24,26,17,34,11,36,21,19,24,24;M24 26L31 31L29 38M26 13L31 19L35 15',
      '28,7,26,13,24,26,31,31,29,38,31,19,35,15;M24 26L18 34L11 36M26 13L21 19L24 24'
    ],
    yt: {
      id: 'XQ0hB29DMpo',
      t: 'Joggen: Meine 5 Tipps zum Einstieg ins Lauftraining (ARD Gesund, Dr. Julia Fischer)'
    }
  };

  function normalizeBaseUrl(url) {
    const clean = String(url || '').trim();
    if (!clean) return '';
    return clean.endsWith('/') ? clean : clean + '/';
  }

  window.v3GetRemoteDataBase = function () {
    const custom = normalizeBaseUrl(localStorage.getItem(REMOTE_URL_KEY));
    if (custom) return custom;
    const isCapacitorOrLocal =
      !!window.Capacitor ||
      !!window.AndroidBridge ||
      location.protocol === 'capacitor:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';
    if (isCapacitorOrLocal) {
      return normalizeBaseUrl(DEFAULT_REMOTE_DATA_BASE);
    }
    return './data/';
  };

  // Baut aus dem geladenen mind.json Objekt die globale Schnittstelle window.BOND_MIND_DB inkl. Auswertungs-Engine auf
  window.v3InitBondMindDb = function (rawMindData) {
    const data = rawMindData && typeof rawMindData === 'object' ? rawMindData : {};
    const STRESS_SCALE_OPTIONS = Array.isArray(data.STRESS_SCALE_OPTIONS) ? data.STRESS_SCALE_OPTIONS : [];
    const STRESS_DRIVER_QUESTIONS = Array.isArray(data.STRESS_DRIVER_QUESTIONS) ? data.STRESS_DRIVER_QUESTIONS : [];
    const STRESS_DRIVER_INFO = data.STRESS_DRIVER_INFO || {};
    const PERSONALITY_QUESTIONS = Array.isArray(data.PERSONALITY_QUESTIONS) ? data.PERSONALITY_QUESTIONS : [];
    const PERSONALITY_TYPE_INFO = data.PERSONALITY_TYPE_INFO || {};
    const MIND_DRILLS = data.MIND_DRILLS || {};
    const MIND_PLANS = Array.isArray(data.MIND_PLANS) ? data.MIND_PLANS : [];
    const QUICK_CHECK_OPTIONS = Array.isArray(data.QUICK_CHECK_OPTIONS) ? data.QUICK_CHECK_OPTIONS : [];
    const MIND_EXERCISES = Array.isArray(data.MIND_EXERCISES) ? data.MIND_EXERCISES : [];
    const MIND_CURATED_PLANS = Array.isArray(data.MIND_CURATED_PLANS) ? data.MIND_CURATED_PLANS : [];
    const SIGNAL_PATTERNS = Array.isArray(data.SIGNAL_PATTERNS) ? data.SIGNAL_PATTERNS : [];
    const ALL_MIND_MODULES = Array.isArray(data.ALL_MIND_MODULES) ? data.ALL_MIND_MODULES : [];

    // Lokale Admin-Overrides für Mind-Übungen anwenden
    try {
      const ovRaw = localStorage.getItem(ADMIN_MIND_KEY);
      if (ovRaw) {
        const ovList = JSON.parse(ovRaw);
        if (Array.isArray(ovList)) {
          ovList.forEach(ov => {
            if (!ov || !ov.id) return;
            const idx = MIND_EXERCISES.findIndex(x => x.id === ov.id);
            if (idx >= 0) MIND_EXERCISES[idx] = Object.assign({}, MIND_EXERCISES[idx], ov);
            else MIND_EXERCISES.push(ov);
          });
        }
      }
    } catch (_) {}

    function getModulesForPlan(planId) {
      return ALL_MIND_MODULES.filter(mod => mod.linkedPlanId === planId);
    }

    function evaluateAndRecordAssessment(driverAnswers, personalityAnswers, currentHistory) {
      const driverScores = { perfection: 0, please: 0, independent: 0, control: 0, endure: 0 };
      Object.keys(STRESS_DRIVER_INFO).forEach(driverId => {
        driverScores[driverId] = (STRESS_DRIVER_INFO[driverId].questionIds || []).reduce(
          (sum, qId) => sum + (driverAnswers[qId] ?? 0), 0
        );
      });
      const sortedDrivers = Object.keys(driverScores).sort((a, b) => driverScores[b] - driverScores[a]);
      const highDrivers = sortedDrivers.filter(d => driverScores[d] >= 9);
      const dominantDrivers = highDrivers.length >= 2 ? highDrivers : sortedDrivers.slice(0, 2);

      const typeCounts = { logician: 0, persister: 0, dreamer: 0, empath: 0, doer: 0, rebel: 0 };
      Object.values(personalityAnswers || {}).forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      const sortedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
      const primaryPersonality = sortedTypes[0] || 'logician';
      const secondaryPersonality = typeCounts[sortedTypes[1]] > 0 ? sortedTypes[1] : undefined;

      const scoredPlans = MIND_PLANS.map(plan => {
        let matchScore = 0;
        dominantDrivers.forEach((driver, idx) => {
          if ((plan.targetDrivers || []).includes(driver)) matchScore += idx === 0 ? 4 : 2;
        });
        if ((plan.targetPersonalities || []).includes(primaryPersonality)) matchScore += 2;
        if (secondaryPersonality && (plan.targetPersonalities || []).includes(secondaryPersonality)) matchScore += 1;
        return { planId: plan.id, matchScore };
      }).sort((a, b) => b.matchScore - a.matchScore);

      const recommendedPlanIds = scoredPlans.slice(0, 2).map(p => p.planId);
      const additionalPlanIds = scoredPlans.slice(2).map(p => p.planId);

      const previousEval = currentHistory?.evaluations?.[0];
      let scoreDeltaToPrevious;
      if (previousEval) {
        scoreDeltaToPrevious = {};
        Object.keys(driverScores).forEach(d => {
          scoreDeltaToPrevious[d] = driverScores[d] - (previousEval.driverScores?.[d] ?? 0);
        });
      }

      const latestEntry = {
        id: 'eval_' + Date.now(),
        timestamp: new Date().toISOString(),
        driverScores,
        dominantDrivers,
        primaryPersonality,
        secondaryPersonality,
        recommendedPlanIds,
        additionalPlanIds,
        scoreDeltaToPrevious
      };

      return {
        latestEntry,
        updatedHistory: Object.assign({}, currentHistory, {
          evaluations: [latestEntry, ...(currentHistory?.evaluations || [])]
        })
      };
    }

    function runAndRecordQuickCheck(situationId, currentHistory, completedDrillId, userNote) {
      const situation = QUICK_CHECK_OPTIONS.find(opt => opt.id === situationId) || QUICK_CHECK_OPTIONS[0];
      const targetedDrills = (situation?.targetedDrillIds || []).map(id => MIND_DRILLS[id]).filter(Boolean);
      const historyEntry = {
        id: 'qc_' + Date.now(),
        timestamp: new Date().toISOString(),
        situationId: situation?.id || '',
        situationLabel: situation?.situationLabel || '',
        recommendedDrillIds: situation?.targetedDrillIds || [],
        completedDrillId,
        userNote
      };
      return {
        situation,
        targetedDrills,
        historyEntry,
        updatedHistory: Object.assign({}, currentHistory, {
          quickChecks: [historyEntry, ...(currentHistory?.quickChecks || [])]
        })
      };
    }

    function getPlanDrillAndReminderStatus(planId, daysSinceStart, completedDaysCount) {
      const plan = MIND_PLANS.find(p => p.id === planId) || MIND_PLANS[0];
      const drills = plan?.drills || [];
      const drillForToday = drills[Math.max(0, daysSinceStart) % Math.max(1, drills.length)];
      const habitDays = plan?.habitDurationDays || 21;
      const isHabitEstablished = completedDaysCount >= habitDays;

      if (!isHabitEstablished) {
        return {
          phase: 'habit_building',
          isReminderDueToday: true,
          drillForToday,
          progressPercent: Math.min(100, Math.round((completedDaysCount / habitDays) * 100))
        };
      }
      const daysAfterCompletion = Math.max(0, daysSinceStart - habitDays);
      const interval = Math.max(1, plan?.postPlanReminderIntervalDays || 3);
      return {
        phase: 'ongoing_maintenance',
        isReminderDueToday: daysAfterCompletion % interval === 0,
        drillForToday,
        progressPercent: 100
      };
    }

    window.BOND_MIND_DB = {
      version: data.version || '3.1.0',
      STRESS_SCALE_OPTIONS,
      STRESS_DRIVER_QUESTIONS,
      STRESS_DRIVER_INFO,
      PERSONALITY_QUESTIONS,
      PERSONALITY_TYPE_INFO,
      MIND_DRILLS,
      MIND_PLANS,
      QUICK_CHECK_OPTIONS,
      MIND_EXERCISES,
      MIND_CURATED_PLANS,
      SIGNAL_PATTERNS,
      ALL_MIND_MODULES,
      getModulesForPlan,
      evaluateAndRecordAssessment,
      runAndRecordQuickCheck,
      getPlanDrillAndReminderStatus
    };
    return window.BOND_MIND_DB;
  };

  function validateCatalogData(data) {
    return (
      Array.isArray(data) &&
      Array.isArray(data[0]) &&
      data[0].length > 0 &&
      data[1] &&
      Array.isArray(data[1].templates) &&
      Array.isArray(data[1].curated) &&
      data[2] &&
      data[2].de
    );
  }

  function readCachedCatalog() {
    try {
      const raw = localStorage.getItem(CATALOG_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return validateCatalogData(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeCachedCatalog(dataArray) {
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(dataArray));
    } catch (_) {}
  }

  function readCachedMind() {
    try {
      const raw = localStorage.getItem(MIND_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.ALL_MIND_MODULES) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function writeCachedMind(mindObj) {
    try {
      if (mindObj && typeof mindObj === 'object') {
        localStorage.setItem(MIND_CACHE_KEY, JSON.stringify(mindObj));
      }
    } catch (_) {}
  }

  function readCatalogMeta() {
    try {
      return JSON.parse(localStorage.getItem(CATALOG_META_KEY) || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function writeCatalogMeta(metaPatch) {
    try {
      const next = Object.assign(readCatalogMeta(), metaPatch);
      localStorage.setItem(CATALOG_META_KEY, JSON.stringify(next));
      return next;
    } catch (_) {
      return {};
    }
  }

  async function fetchBundledCatalog() {
    const [exRes, plRes, trRes] = await Promise.all([
      fetch('./data/exercises.json', { cache: 'no-cache' }),
      fetch('./data/plans.json', { cache: 'no-cache' }),
      fetch('./data/translations.json', { cache: 'no-cache' })
    ]);
    if (!exRes.ok || !plRes.ok || !trRes.ok) {
      throw Error('Katalog-Dateien konnten nicht geladen werden');
    }
    const data = await Promise.all([exRes.json(), plRes.json(), trRes.json()]);
    if (!validateCatalogData(data)) throw Error('Ungültig strukturierte Katalogdaten');
    return data;
  }

  async function fetchBundledMind() {
    try {
      const res = await fetch('./data/mind.json', { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  function buildCleanOfficialExerciseList(rawExercises) {
    const list = [];
    const seenIds = new Set();
    let laufenSeen = false;

    for (const item of rawExercises) {
      if (!item || !item.id || String(item.id)[0] === 'c') continue;
      if (item.n === 'Laufen') {
        if (laufenSeen) continue;
        laufenSeen = true;
        if (!item.yt) item.yt = LAUFEN_FALLBACK_EX.yt;
      }
      if (seenIds.has(item.id)) {
        const idx = list.findIndex(x => x.id === item.id);
        if (idx >= 0) list[idx] = item;
      } else {
        seenIds.add(item.id);
        list.push(item);
      }
    }

    // Falls „Laufen“ noch nicht in exercises.json gespeichert war, einmalig sauber mit fester ID einfügen
    if (!laufenSeen) {
      const copy = Object.assign({}, LAUFEN_FALLBACK_EX);
      if (seenIds.has(copy.id)) {
        const maxNum = Math.max(131, ...list.filter(x => /^e\d+$/.test(x.id)).map(x => Number(x.id.slice(1)) || 0));
        copy.id = 'e' + (maxNum + 1);
      }
      seenIds.add(copy.id);
      list.push(copy);
    }

    try {
      const adminRaw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminRaw) {
        const adminList = JSON.parse(adminRaw);
        if (Array.isArray(adminList)) {
          adminList.forEach(ov => {
            if (!ov || !ov.id) return;
            const idx = list.findIndex(x => x.id === ov.id);
            if (idx >= 0) list[idx] = Object.assign({}, list[idx], ov);
            else list.push(ov);
          });
        }
      }
    } catch (_) {}

    return list;
  }

  function computeCatalogFingerprint(exercisesArray, mindObj) {
    try {
      const mLen = mindObj ? JSON.stringify(mindObj).length : 0;
      return exercisesArray.length + ':' + JSON.stringify(exercisesArray).length + ':' + mLen;
    } catch (_) {
      return String(exercisesArray.length);
    }
  }

  let syncInProgress = false;
  window.v3SyncCatalogNow = async function (silent = true) {
    if (syncInProgress) return false;
    syncInProgress = true;
    const base = window.v3GetRemoteDataBase();

    try {
      const bust = '?t=' + Date.now();
      const exRes = await fetch(base + 'exercises.json' + bust, { cache: 'no-store' });
      if (!exRes.ok) throw Error('HTTP ' + exRes.status);
      const remoteExercises = await exRes.json();
      if (!Array.isArray(remoteExercises) || !remoteExercises.length) {
        throw Error('Ungültiges exercises.json Format');
      }

      let remotePlans = window.FITNESS_CATALOG?.plans;
      let remoteTrans = window.FITNESS_CATALOG?.translations;
      let remoteMind = window.FITNESS_CATALOG?.mind;

      try {
        const [pRes, tRes, mRes] = await Promise.all([
          fetch(base + 'plans.json' + bust, { cache: 'no-store' }),
          fetch(base + 'translations.json' + bust, { cache: 'no-store' }),
          fetch(base + 'mind.json' + bust, { cache: 'no-store' })
        ]);
        if (pRes.ok) {
          const pJson = await pRes.json();
          if (pJson && Array.isArray(pJson.templates)) remotePlans = pJson;
        }
        if (tRes.ok) {
          const tJson = await tRes.json();
          if (tJson && tJson.de) remoteTrans = tJson;
        }
        if (mRes.ok) {
          const mJson = await mRes.json();
          if (mJson && Array.isArray(mJson.ALL_MIND_MODULES)) {
            remoteMind = mJson;
            writeCachedMind(remoteMind);
            window.v3InitBondMindDb(remoteMind);
          }
        }
      } catch (_) {}

      const mergedOfficial = buildCleanOfficialExerciseList(remoteExercises);
      const oldFp = readCatalogMeta().fingerprint || '';
      const newFp = computeCatalogFingerprint(mergedOfficial, remoteMind);

      writeCachedCatalog([mergedOfficial, remotePlans, remoteTrans]);
      writeCatalogMeta({
        lastCheck: new Date().toISOString(),
        lastSource: base,
        count: mergedOfficial.length,
        fingerprint: newFp
      });

      if (typeof EX !== 'undefined' && Array.isArray(EX)) {
        EX.splice(0, EX.length, ...mergedOfficial);
        if (typeof window.v3InjectMindExercises === 'function') {
          window.v3InjectMindExercises();
        }
      }
      if (window.FITNESS_CATALOG) {
        window.FITNESS_CATALOG.exercises = mergedOfficial;
        if (remotePlans) window.FITNESS_CATALOG.plans = remotePlans;
        if (remoteTrans) window.FITNESS_CATALOG.translations = remoteTrans;
        if (remoteMind) window.FITNESS_CATALOG.mind = remoteMind;
      }

      const hasChanged = newFp !== oldFp;
      if (hasChanged) {
        if (typeof render === 'function') render();
        if (typeof toast === 'function') toast('✨ Body- & Mind-Katalog aktualisiert');
      } else if (!silent) {
        if (typeof render === 'function') render();
        if (typeof toast === 'function') toast(`✓ Katalog ist auf dem neuesten Stand (${EX.length} Übungen)`);
      }
      return true;
    } catch (err) {
      console.warn('OTA Katalog-Sync Hinweis:', err.message);
      if (!silent && typeof toast === 'function') {
        toast('⚠️ Online-Katalog derzeit nicht erreichbar – lokaler Offline-Stand aktiv.');
      }
      return false;
    } finally {
      syncInProgress = false;
    }
  };

  window.v3SaveRemoteUrl = function (urlValue) {
    const clean = normalizeBaseUrl(urlValue);
    if (!clean) {
      localStorage.removeItem(REMOTE_URL_KEY);
      if (typeof toast === 'function') toast('Standard-Update-Quelle wiederhergestellt');
    } else {
      localStorage.setItem(REMOTE_URL_KEY, clean);
      if (typeof toast === 'function') toast('Update-URL gespeichert: ' + clean);
    }
    window.v3SyncCatalogNow(false);
  };

  try {
    let initialData = readCachedCatalog();
    if (!initialData) {
      initialData = await fetchBundledCatalog();
      writeCachedCatalog(initialData);
    }

    let initialMind = readCachedMind();
    if (!initialMind) {
      initialMind = await fetchBundledMind();
      if (initialMind) writeCachedMind(initialMind);
    }
    window.v3InitBondMindDb(initialMind || {});

    const cleanInitialEx = buildCleanOfficialExerciseList(initialData[0]);
    window.FITNESS_CATALOG = {
      exercises: cleanInitialEx,
      plans: initialData[1],
      translations: initialData[2],
      mind: initialMind
    };

    try {
      const tStr = JSON.stringify(window.FITNESS_CATALOG.translations || {})
        .replace(/MEIN TRAINING/g, 'BOND')
        .replace(/Mein Training/g, 'BOND');
      window.FITNESS_CATALOG.translations = JSON.parse(tStr);
    } catch (_) {}

    for (const file of modules) {
      await new Promise((resolve, reject) => {
        const element = document.createElement('script');
        element.src = './js/' + file + '.js';
        element.onload = resolve;
        element.onerror = () => reject(Error(file + ' konnte nicht geladen werden'));
        document.body.appendChild(element);
      });
    }

    if (typeof render === 'function') render();

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    setTimeout(() => window.v3SyncCatalogNow(true), 900);
    window.addEventListener('focus', () => window.v3SyncCatalogNow(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') window.v3SyncCatalogNow(true);
    });
  } catch (error) {
    console.error(error);
    document.getElementById('app').innerHTML =
      '<section class="c"><h2>App konnte nicht starten</h2><p>Bitte öffne die App über GitHub Pages oder einen lokalen Webserver.</p><p class="mu"></p></section>';
    document.querySelector('#app .mu').textContent = error.message;
  }
})();
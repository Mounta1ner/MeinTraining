/* Bond (v3.0) - Mind Database, Evaluation Engine, Quick Check & 14 Deep-Dive Modules */
(function () {
  'use strict';

// ----------------------------------------------------------------------------
// 2. INITIAL-EVALUIERUNG TEIL 1: 25 FRAGEN STRESSVERSCHÄRFENDE GEDANKEN
// Antwortskala: 0 = trifft nicht zu | 1 = etwas | 2 = ziemlich | 3 = voll zu
// ----------------------------------------------------------------------------

const STRESS_SCALE_OPTIONS = [
  { value: 0, label: 'trifft nicht zu' },
  { value: 1, label: 'trifft etwas zu' },
  { value: 2, label: 'trifft ziemlich zu' },
  { value: 3, label: 'trifft voll zu' },
];

const STRESS_DRIVER_QUESTIONS = [
  { id: 1, text: 'Am liebsten mache ich alles selber.' },
  { id: 2, text: 'Aufgeben kommt für mich niemals in Frage.' },
  { id: 3, text: 'Es ist entsetzlich, wenn etwas nicht so läuft, wie ich will oder geplant habe.' },
  { id: 4, text: 'Ich muss unter allen Umständen durchhalten.' },
  { id: 5, text: 'Wenn ich mich wirklich anstrenge, dann schaffe ich es.' },
  { id: 6, text: 'Es ist nicht akzeptabel, wenn ich eine Arbeit nicht schaffe oder einen Termin nicht einhalte.' },
  { id: 7, text: 'Ich muss den Druck (Angst, Schmerzen, etc.) auf jeden Fall aushalten.' },
  { id: 8, text: 'Ich muss immer für den Betrieb / meine Aufgaben da sein.' },
  { id: 9, text: 'Man muss wirklich hart gegen sich selber sein.' },
  { id: 10, text: 'Es ist wichtig, dass ich alles unter Kontrolle habe.' },
  { id: 11, text: 'Ich will die anderen nicht enttäuschen.' },
  { id: 12, text: 'Es gibt nichts Schlimmeres, als Fehler zu machen.' },
  { id: 13, text: 'Auf mich muss 100%iger Verlass sein.' },
  { id: 14, text: 'Es ist schrecklich, wenn andere mir böse sind.' },
  { id: 15, text: 'Starke Menschen brauchen keine Hilfe.' },
  { id: 16, text: 'Ich will mit allen Leuten gut auskommen.' },
  { id: 17, text: 'Es ist schlimm, wenn andere mich kritisieren.' },
  { id: 18, text: 'Wenn ich mich auf andere verlasse, bin ich verlassen.' },
  { id: 19, text: 'Es ist wichtig, dass mich andere mögen.' },
  { id: 20, text: 'Bei Entscheidungen muss ich mir 100% sicher sein.' },
  { id: 21, text: 'Ich muss ständig daran denken, was alles passieren könnte.' },
  { id: 22, text: 'Ohne mich geht es nicht.' },
  { id: 23, text: 'Ich muss immer alles richtig machen.' },
  { id: 24, text: 'Es ist schrecklich, auf andere angewiesen zu sein.' },
  { id: 25, text: 'Es ist ganz fürchterlich, wenn ich nicht weiß, was auf mich zukommt.' },
];

const STRESS_DRIVER_INFO = {
  perfection: {
    name: 'Sei perfekt!',
    questionIds: [6, 8, 12, 13, 22], // Hinweis: Frage 23 stützt diesen Wert inhaltlich ebenfalls
    riskDescription: 'Hoher Eigendruck, Perfektionismus-Schleifen und Angst vor Fehlern.',
    permissionThought: 'Ich darf Fehler als Lernchance sehen und Aufgaben mit 80 % Aufwand abschließen.',
  },
  please: {
    name: 'Sei beliebt!',
    questionIds: [11, 14, 16, 17, 19],
    riskDescription: 'Schwierigkeiten beim Nein-Sagen, Überanpassung und Angst vor Kritik.',
    permissionThought: 'Ich darf klare Grenzen setzen, auch wenn nicht jeder sofort einverstanden ist.',
  },
  independent: {
    name: 'Sei unabhängig!',
    questionIds: [1, 15, 18, 22, 24],
    riskDescription: 'Alles selbst erledigen wollen, kaum Delegation und Misstrauen in fremde Hilfe.',
    permissionThought: 'Ich darf Aufgaben abgeben und um Unterstützung bitten.',
  },
  control: {
    name: 'Behalte Kontrolle!',
    questionIds: [3, 10, 20, 21, 25],
    riskDescription: 'Ständiges Sorgen über Eventualitäten und Blockade bei Ungewissheit.',
    permissionThought: 'Ich darf im Hier und Jetzt handeln, auch wenn nicht alle Faktoren bekannt sind.',
  },
  endure: {
    name: 'Halte durch!',
    questionIds: [2, 4, 5, 7, 9],
    riskDescription: 'Übergehen eigener Warnsignale, Härte gegen sich selbst bis zur Erschöpfung.',
    permissionThought: 'Ich darf rechtzeitig Pausen einlegen und für meine Erholung sorgen.',
  },
};

// ----------------------------------------------------------------------------
// 3. INITIAL-EVALUIERUNG TEIL 2: PERSÖNLICHKEITSTYP-FRAGEN (6 TYPEN)
// ----------------------------------------------------------------------------

const PERSONALITY_QUESTIONS = [
  {
    id: 'pq_1',
    prompt: 'Welches Grundbedürfnis ist dir in Zusammenarbeit und Alltag am wichtigsten?',
    options: [
      { label: 'Anerkennung für Leistung, klare Fakten und logische Struktur', type: 'logician' },
      { label: 'Anerkennung für meine Meinung, Erfahrung und klare Prinzipien', type: 'persister' },
      { label: 'Zugehörigkeit ohne Bedrängung, Ruhe und Zeit für mich', type: 'dreamer' },
      { label: 'Bestätigung als Mensch, Harmonie und ein gutes Miteinander', type: 'empath' },
      { label: 'Bewunderung für Mut, Tempo und sichtbare Ergebnisse', type: 'doer' },
      { label: 'Anerkennung für Individualität, Humor, Freiraum und neue Ideen', type: 'rebel' },
    ],
  },
  {
    id: 'pq_2',
    prompt: 'Welches Muster zeigst du am ehesten, wenn du stark unter Stress gerätst?',
    options: [
      { label: 'Ich werde überkritisch, perfektionistisch und kontrolliere alles selbst.', type: 'logician' },
      { label: 'Ich werde skeptisch, beharre auf Regeln und weise auf Schwachstellen hin.', type: 'persister' },
      { label: 'Ich ziehe mich innerlich zurück, werde ruhig und warte ab.', type: 'dreamer' },
      { label: 'Ich will es allen recht machen, opfere mich auf und fühle mich schnell überlastet.', type: 'empath' },
      { label: 'Ich werde ungeduldig, mache Druck und schiebe lästige Details von mir weg.', type: 'doer' },
      { label: 'Ich fühle mich eingeengt, verzögere Pflichten oder gehe in den Widerstand.', type: 'rebel' },
    ],
  },
  {
    id: 'pq_3',
    prompt: 'Welche Art der Kommunikation liegt dir bei neuen Aufgaben am meisten?',
    options: [
      { label: 'Sachlich, auf Daten basiert: „Was denkst du, klingt das logisch?“', type: 'logician' },
      { label: 'Verlässlich und wertebewusst: „Wie schätzt du das aus deiner Erfahrung ein?“', type: 'persister' },
      { label: 'Gelassen, klar umrissen mit konkreten To-dos und Zeit zum Nachdenken.', type: 'dreamer' },
      { label: 'Persönlich, wertschätzend mit Blick auf das Gefühl im Team oder der Familie.', type: 'empath' },
      { label: 'Kurz, direkt auf den Punkt: „Lass uns direkt starten und schauen, was geht!“', type: 'doer' },
      { label: 'Spielerisch, offen für unkonventionelle Wege ohne starres Korsett.', type: 'rebel' },
    ],
  },
];

// ----------------------------------------------------------------------------
// 4. GEZIELTE EINZEL-ÜBUNGEN (DRILLS FÜR PLÄNE & QUICK CHECK)
// ----------------------------------------------------------------------------

const MIND_DRILLS = {
  drill_muss_ich_6_questions: {
    id: 'drill_muss_ich_6_questions',
    title: 'Der 6-Fragen-Aufgabenfilter & AUZ-Check',
    durationMinutes: 5,
    type: 'reflection',
    shortInstruction:
      'Nimm eine Aufgabe, die dich gerade drückt, und prüfe: 1. Warum muss sie getan werden? 2. Passt sie in mein Zeitbudget? 3. Was passiert in 4 Wochen, wenn ich sie lasse? 4. Wer ist wirklich die richtige Person dafür? 5. Übertreibe ich Wichtigkeit/Tempo? 6. Welche Geschichte erzähle ich mir aus Angst, Unsicherheit oder Zweifel (AUZ)?',
    reflectionPrompt: 'Welche Aufgabe kannst du heute streichen, kürzen oder dort lassen, wo sie hingehört?',
  },
  drill_10_sec_breath: {
    id: 'drill_10_sec_breath',
    title: '10-Sekunden-Atempause & Tag-zu-Tag-Fokus',
    durationMinutes: 2,
    type: 'breathing_body',
    shortInstruction:
      'Halte sofort inne. Nimm 3 tiefe Atemzüge und richte deinen Fokus 10 Sekunden lang auf deine Fußsohlen am Boden oder deine Hände. Dadurch bleibt dein rationales Gehirn online. Kümmere dich heute nur um das, was heute ansteht.',
    reflectionPrompt: 'Welcher konkrete Schritt ist heute im Hier und Jetzt wirklich nötig – und welche Sorge darf bis morgen warten?',
  },
  drill_circle_of_influence: {
    id: 'drill_circle_of_influence',
    title: 'Einflussbereich vs. Interessenbereich trennen',
    durationMinutes: 4,
    type: 'action',
    shortInstruction:
      'Ordne dein aktuelles Ärgernis ein: Hast du direkte Kontrolle (eigenes Verhalten -> Gewohnheit ändern), indirekte Kontrolle (Verhalten anderer -> Einflussmethode ändern) oder keine Kontrolle (Fakten akzeptieren & eigene Haltung wählen)?',
    reflectionPrompt: 'Was ist der allererste kleine Schritt, der zu 100 % in deinem eigenen Einflussbereich liegt?',
  },
  drill_name_the_emotion: {
    id: 'drill_name_the_emotion',
    title: 'Gefühle als Besucher benennen',
    durationMinutes: 3,
    type: 'observation',
    shortInstruction:
      'Tritt innerlich einen Schritt zurück (Selbstwahrnehmung): Du bist nicht deine Stimmung. Benenne das aktuelle Gefühl präzise (z. B. gereizt, überfordert, verunsichert, entmutigt). Sobald es benannt ist, verliert es seine Übermacht.',
    reflectionPrompt: 'Welches Gefühl ist gerade zu Besuch – und welches Bedürfnis zeigt es dir an?',
  },
  drill_no_why_questions: {
    id: 'drill_no_why_questions',
    title: 'Lösungsfragen statt „Warum?“-Falle',
    durationMinutes: 4,
    type: 'action',
    shortInstruction:
      'Verzichte im nächsten Gespräch komplett auf „Warum“-Fragen (lösen Rechtfertigung aus) und Suggestivfragen. Nutze Paraphrasieren („Habe ich richtig verstanden, dass...?“) oder die Wunderfrage („Wenn das Problem über Nacht gelöst wäre, was wäre morgen dein erster Schritt?“).',
    reflectionPrompt: 'Mit welcher offenen „Wie“- oder „Was“-Frage kannst du dein Gegenüber heute selbst ins Denken bringen?',
  },
  drill_mother_of_all_questions: {
    id: 'drill_mother_of_all_questions',
    title: '3-Schritte-Verantwortungsgespräch & Pause aushalten',
    durationMinutes: 5,
    type: 'action',
    shortInstruction:
      '1. Bitte um Selbsteinschätzung zum Thema (loben bei Einsicht!). 2. Erfrage den persönlichen Nutzen der Regel/Aufgabe für den anderen. 3. Stelle die „Mutter aller Fragen“: „Prima. Was genau wirst du also tun, um das Problem zu lösen?“ – und halte danach die Gesprächspause konsequent aus!',
    reflectionPrompt: 'Bei welchem Thema übernimmst du gerade fremde Verantwortung, statt die Lösung durch Abwarten einzufordern?',
  },
  drill_aerobic_brain_reset: {
    id: 'drill_aerobic_brain_reset',
    title: '20-Minuten Default-Mode-Bewegung',
    durationMinutes: 20,
    type: 'breathing_body',
    shortInstruction:
      'Geh 15–20 Minuten moderat spazieren oder locker laufen – komplett ohne Handy, Musik oder Podcast. Das entlastet deinen präfrontalen Kortex, versorgt den Hippocampus mit Sauerstoff und aktiviert das Ruhezustandsnetzwerk für kreative Geistesblitze.',
    reflectionPrompt: 'Welcher Gedanke oder Lösungsansatz ist dir aufgetaucht, als dein Kopf im Leerlauf sein durfte?',
  },
  drill_gtd_next_action: {
    id: 'drill_gtd_next_action',
    title: 'Open Loops schließen & Next Action definieren',
    durationMinutes: 5,
    type: 'action',
    shortInstruction:
      'Schreibe alles Unfertige aus dem Kopf auf. Dauert etwas unter 5 Minuten -> sofort erledigen. Für das wichtigste offene Thema (dein „Frog“): Definiere das gewünschte Ergebnis in einem Satz und lege die nächste physisch sichtbare Handlung fest.',
    reflectionPrompt: 'Welcher konkrete 5-Minuten-Startschritt bringt heute deinen wichtigsten „großen Stein“ ins Rollen?',
  },
  drill_bias_decision_check: {
    id: 'drill_bias_decision_check',
    title: 'Denkfehler- & Entscheidungs-Check',
    durationMinutes: 5,
    type: 'reflection',
    shortInstruction:
      'Prüfe vor deiner Entscheidung: 1. Ist es vor 21 Uhr und bist du satt? 2. Hältst du nur aus Verlustaversion an Altem fest? 3. Fehlen wichtige Fakten (Vollständigkeits-Illusion)? 4. Was ist Plan B, falls sich die Wahl als falsch herausstellt?',
    reflectionPrompt: 'Wie würdest du entscheiden, wenn du heute bei null starten würdest und noch nichts investiert hättest?',
  },
};

// ----------------------------------------------------------------------------
// 5. MIND-PLÄNE KATALOG (MINDESTENS 21-30 TAGE + ENDLOS-REMINDER)
// ----------------------------------------------------------------------------

const MIND_PLANS = [
  {
    id: 'plan_mind_stress_freedom',
    title: 'Gelassenheit & Innere Antreiber entschärfen',
    subtitle: 'Befreie dich von Perfektionismus, Harmoniezwang und Dauer-Anspannung',
    category: 'Mind',
    level: 1,
    prerequisites: [],
    buildsInto: ['plan_mind_focus_priorities', 'plan_mind_proactive_resilience'],
    targetDrivers: ['perfection', 'please', 'endure'],
    targetPersonalities: ['logician', 'empath', 'persister'],
    habitDurationDays: 28,
    postPlanReminderIntervalDays: 3,
    drills: [
      MIND_DRILLS.drill_name_the_emotion,
      MIND_DRILLS.drill_muss_ich_6_questions,
      MIND_DRILLS.drill_10_sec_breath,
    ],
  },
  {
    id: 'plan_mind_proactive_resilience',
    title: 'Der 30-Tage Proaktivitäts- & Ruhe-Plan',
    subtitle: 'Fokus auf deinen Einflussbereich statt Sorgen über Unkontrollierbares',
    category: 'Mind',
    level: 1,
    prerequisites: [],
    buildsInto: ['plan_mind_clear_decisions'],
    targetDrivers: ['control', 'endure'],
    targetPersonalities: ['dreamer', 'persister', 'empath'],
    habitDurationDays: 30, // Klassischer 30-Tage-Test
    postPlanReminderIntervalDays: 4,
    drills: [
      MIND_DRILLS.drill_circle_of_influence,
      MIND_DRILLS.drill_10_sec_breath,
      MIND_DRILLS.drill_name_the_emotion,
    ],
  },
  {
    id: 'plan_mind_focus_priorities',
    title: 'Fokus, Große Steine & Aufgaben-Filter',
    subtitle: 'Schließe offene Schleifen, sag souverän Nein und schütze deine Kernzeit',
    category: 'Mind',
    level: 2,
    prerequisites: ['plan_mind_stress_freedom'],
    buildsInto: ['plan_mind_leadership_communication'],
    targetDrivers: ['independent', 'perfection', 'please'],
    targetPersonalities: ['doer', 'logician', 'rebel'],
    habitDurationDays: 21,
    postPlanReminderIntervalDays: 3,
    drills: [
      MIND_DRILLS.drill_muss_ich_6_questions,
      MIND_DRILLS.drill_gtd_next_action,
      MIND_DRILLS.drill_aerobic_brain_reset,
    ],
  },
  {
    id: 'plan_mind_leadership_communication',
    title: 'Fragetechnik, Verantwortung & Miteinander',
    subtitle: 'Lösungen im Gespräch wecken, richtig delegieren und Typen verstehen',
    category: 'Mind',
    level: 2,
    prerequisites: ['plan_mind_focus_priorities'],
    buildsInto: [],
    targetDrivers: ['independent', 'control', 'please'],
    targetPersonalities: ['doer', 'empath', 'persister', 'logician'],
    habitDurationDays: 28,
    postPlanReminderIntervalDays: 5,
    drills: [
      MIND_DRILLS.drill_no_why_questions,
      MIND_DRILLS.drill_mother_of_all_questions,
      MIND_DRILLS.drill_circle_of_influence,
    ],
  },
  {
    id: 'plan_mind_clear_decisions',
    title: 'Klare Entscheidungen & Brain-Body-Boost',
    subtitle: 'Denkfehler umgehen und durch Bewegung Gedächtnis & Kreativität stärken',
    category: 'Mind',
    level: 2,
    prerequisites: [],
    buildsInto: [],
    targetDrivers: ['control', 'perfection'],
    targetPersonalities: ['logician', 'dreamer', 'rebel'],
    habitDurationDays: 21,
    postPlanReminderIntervalDays: 4,
    drills: [
      MIND_DRILLS.drill_bias_decision_check,
      MIND_DRILLS.drill_aerobic_brain_reset,
      MIND_DRILLS.drill_gtd_next_action,
    ],
  },
];

// ----------------------------------------------------------------------------
// 6. QUICK CHECK: AKUTE SITUATIONEN -> GEZIELTE SOFORT-ÜBUNGEN
// ----------------------------------------------------------------------------

const QUICK_CHECK_OPTIONS = [
  {
    id: 'qc_overwhelmed_tasks',
    category: 'Überlastung & Druck',
    situationLabel: 'Mein To-do-Berg wächst mir über den Kopf & ich kann schwer Nein sagen.',
    shortDiagnostic: 'Gefahr der Zuverlässigkeits-Falle: Bis zu 25 % aller Aufgaben brauchen gar keine Bearbeitung.',
    targetedDrillIds: ['drill_muss_ich_6_questions', 'drill_gtd_next_action'],
    relatedPlanId: 'plan_mind_focus_priorities',
  },
  {
    id: 'qc_acute_worry_fear',
    category: 'Angst & Grübeln',
    situationLabel: 'Ich mache mir Sorgen um die Zukunft oder lasse mich von Hektik anstecken.',
    shortDiagnostic: 'Ungewissheit + soziale Übertragung schalten das logische Denken offline. Achtsamkeit holt dich ins Jetzt.',
    targetedDrillIds: ['drill_10_sec_breath', 'drill_circle_of_influence'],
    relatedPlanId: 'plan_mind_proactive_resilience',
  },
  {
    id: 'qc_anger_external',
    category: 'Angst & Grübeln',
    situationLabel: 'Ich ärgere mich massiv über Fehler anderer oder Umstände, die mich blockieren.',
    shortDiagnostic: 'Deine Energie steckt im Interessenbereich. Zwischen Reiz und Reaktion liegt deine Wahlfreiheit.',
    targetedDrillIds: ['drill_circle_of_influence', 'drill_name_the_emotion'],
    relatedPlanId: 'plan_mind_proactive_resilience',
  },
  {
    id: 'qc_difficult_conversation',
    category: 'Gespräch & Konflikt',
    situationLabel: 'Jemand hält Absprachen nicht ein oder schiebt Verantwortung auf mich zurück.',
    shortDiagnostic: 'Nimm den Ball nicht selbst an! Nutze Selbsteinschätzung, persönlichen Nutzen und die „Mutter aller Fragen“.',
    targetedDrillIds: ['drill_mother_of_all_questions', 'drill_no_why_questions'],
    relatedPlanId: 'plan_mind_leadership_communication',
  },
  {
    id: 'qc_brain_fog_block',
    category: 'Fokus & Energie',
    situationLabel: 'Mein Kopf ist dicht, ich springe zwischen 10 Dingen und finde keine Lösung.',
    shortDiagnostic: 'Dein präfrontaler Kortex ist durch Multitasking überlastet. Bewegung aktiviert das Ruhezustandsnetzwerk.',
    targetedDrillIds: ['drill_aerobic_brain_reset', 'drill_gtd_next_action'],
    relatedPlanId: 'plan_mind_clear_decisions',
  },
  {
    id: 'qc_decision_doubt',
    category: 'Fokus & Energie',
    situationLabel: 'Ich grüble über eine Entscheidung oder ärgere mich über einen gemachten Fehler.',
    shortDiagnostic: 'Achtung vor Rückschaufehler, Verlustaversion und Entscheidungen nach 21 Uhr.',
    targetedDrillIds: ['drill_bias_decision_check', 'drill_10_sec_breath'],
    relatedPlanId: 'plan_mind_clear_decisions',
  },
];

// ----------------------------------------------------------------------------
// 7. LOGIK-FUNKTIONEN (AUSWERTUNG, PLAN-SORTIERUNG, REMINDER & VERLAUF)
// ----------------------------------------------------------------------------

/**
 * Wertet die Initial-Evaluierung aus, trennt Pläne in "Hervorgehoben" vs. "Weitere"
 * und speichert das Ergebnis automatisch im User-Verlauf (inkl. Delta zum Vortest).
 */
function evaluateAndRecordAssessment(driverAnswers, personalityAnswers, currentHistory) {
  // 1. Stress-Antreiber exakt nach Checklisten-Schlüssel summieren (je 0-15 Punkte)
  const driverScores = {
    perfection: 0,
    please: 0,
    independent: 0,
    control: 0,
    endure: 0,
  };

  (Object.keys(STRESS_DRIVER_INFO)).forEach((driverId) => {
    driverScores[driverId] = STRESS_DRIVER_INFO[driverId].questionIds.reduce(
      (sum, qId) => sum + (driverAnswers[qId] ?? 0),
      0
    );
  });

  // Top-Antreiber bestimmen (absteigend sortiert; mindestens Top 2 oder alle >= 9 Punkte)
  const sortedDrivers = (Object.keys(driverScores)).sort(
    (a, b) => driverScores[b] - driverScores[a]
  );
  const highDrivers = sortedDrivers.filter((d) => driverScores[d] >= 9);
  const dominantDrivers =
    highDrivers.length >= 2 ? highDrivers : sortedDrivers.slice(0, 2);

  // 2. Persönlichkeitstyp bestimmen
  const typeCounts = {
    logician: 0,
    persister: 0,
    dreamer: 0,
    empath: 0,
    doer: 0,
    rebel: 0,
  };
  Object.values(personalityAnswers).forEach((type) => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const sortedTypes = (Object.keys(typeCounts)).sort(
    (a, b) => typeCounts[b] - typeCounts[a]
  );
  const primaryPersonality = sortedTypes[0] || 'logician';
  const secondaryPersonality =
    typeCounts[sortedTypes[1]] > 0 ? sortedTypes[1] : undefined;

  // 3. Pläne bewerten & aufteilen in "Hervorgehoben" (recommended) und "Weitere" (additional)
  const scoredPlans = MIND_PLANS.map((plan) => {
    let matchScore = 0;
    dominantDrivers.forEach((driver, idx) => {
      if (plan.targetDrivers.includes(driver)) {
        matchScore += idx === 0 ? 4 : 2;
      }
    });
    if (plan.targetPersonalities.includes(primaryPersonality)) matchScore += 2;
    if (secondaryPersonality && plan.targetPersonalities.includes(secondaryPersonality)) {
      matchScore += 1;
    }
    return { planId: plan.id, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);

  // Top 2-3 Pläne werden für den User hervorgehoben, der Rest bleibt darunter sichtbar
  const recommendedPlanIds = scoredPlans.slice(0, 2).map((p) => p.planId);
  const additionalPlanIds = scoredPlans.slice(2).map((p) => p.planId);

  // 4. Delta zur vorigen Evaluierung im Verlauf berechnen (falls vorhanden)
  const previousEval = currentHistory.evaluations[0];
  let scoreDeltaToPrevious;
  if (previousEval) {
    scoreDeltaToPrevious = {};
    (Object.keys(driverScores)).forEach((d) => {
      scoreDeltaToPrevious[d] = driverScores[d] - (previousEval.driverScores[d] ?? 0);
    });
  }

  const latestEntry = {
    id: `eval_${Date.now()}`,
    timestamp: new Date().toISOString(),
    driverScores,
    dominantDrivers,
    primaryPersonality,
    secondaryPersonality,
    recommendedPlanIds,
    additionalPlanIds,
    scoreDeltaToPrevious,
  };

  return {
    latestEntry,
    updatedHistory: {
      ...currentHistory,
      evaluations: [latestEntry, ...currentHistory.evaluations],
    },
  };
}

/**
 * Führt einen Quick Check durch, gibt die gezielten Sofort-Übungen zurück
 * und speichert den Eintrag im Quick-Check-Verlauf des Users.
 */
function runAndRecordQuickCheck(situationId, currentHistory, completedDrillId, userNote) {
  const situation =
    QUICK_CHECK_OPTIONS.find((opt) => opt.id === situationId) || QUICK_CHECK_OPTIONS[0];

  const targetedDrills = situation.targetedDrillIds
    .map((id) => MIND_DRILLS[id])
    .filter(Boolean);

  const historyEntry = {
    id: `qc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    situationId: situation.id,
    situationLabel: situation.situationLabel,
    recommendedDrillIds: situation.targetedDrillIds,
    completedDrillId,
    userNote,
  };

  return {
    situation,
    targetedDrills,
    historyEntry,
    updatedHistory: {
      ...currentHistory,
      quickChecks: [historyEntry, ...currentHistory.quickChecks],
    },
  };
}

/**
 * Steuert die tägliche Übung während der 21-30 Tage Gewohnheitsphase UND
 * liefert auch nach Plan-Abschluss weiterhin periodische Reminder-Übungen.
 */
function getPlanDrillAndReminderStatus(planId, daysSinceStart, completedDaysCount) {
  const plan = MIND_PLANS.find((p) => p.id === planId) || MIND_PLANS[0];
  const drillIndex = Math.max(0, daysSinceStart) % plan.drills.length;
  const drillForToday = plan.drills[drillIndex];

  const isHabitEstablished = completedDaysCount >= plan.habitDurationDays;

  if (!isHabitEstablished) {
    return {
      phase: 'habit_building',
      isReminderDueToday: true, // Während des Gewohnheitsaufbaus täglicher Impuls
      drillForToday,
      progressPercent: Math.min(100, Math.round((completedDaysCount / plan.habitDurationDays) * 100)),
    };
  }

  // Nach Abschluss der 21-30 Tage: Weiterlaufende Erhaltungs-Reminder im Intervall
  const daysAfterCompletion = Math.max(0, daysSinceStart - plan.habitDurationDays);
  const isReminderDueToday =
    daysAfterCompletion % plan.postPlanReminderIntervalDays === 0;

  return {
    phase: 'ongoing_maintenance',
    isReminderDueToday,
    drillForToday,
    progressPercent: 100,
  };
}


const PERSONALITY_TYPE_INFO = {
  logician: {
    name: 'Logiker (Analytiker)',
    strengths: 'Strukturiert, faktenorientiert, zuverlässig und logisch denkend.',
    stressPattern: 'Neigt unter Stress zu Überkontrolle, Perfektionismus und Kritik an Details.',
    communicationTip: 'Sachlich, klar gegliedert und mit nachvollziehbaren Fakten arbeiten.'
  },
  persister: {
    name: 'Beharrer (Werteorientiert)',
    strengths: 'Engagiert, prinzipientreu, gewissenhaft und beobachtungsstark.',
    stressPattern: 'Wird unter Stress skeptisch, beharrt starr auf Regeln und fokussiert auf Fehler.',
    communicationTip: 'Erfahrung und Werte anerkennen und auf Augenhöhe nach Einschätzung fragen.'
  },
  dreamer: {
    name: 'Träumer (Reflektierter Ruhepuls)',
    strengths: 'Ruhig, fantasievoll, besonnen und tiefgehend reflektierend.',
    stressPattern: 'Zieht sich unter Stress innerlich zurück und wartet passiv ab.',
    communicationTip: 'Klare, überschaubare Schritte ohne Hektik vorgeben und Zeit zum Nachdenken lassen.'
  },
  empath: {
    name: 'Empathiker (Einfühlsam)',
    strengths: 'Warmherzig, mitfühlend, harmoniefördernd und beziehungsstark.',
    stressPattern: 'Opfert sich unter Stress für andere auf, sagt schwer Nein und fühlt sich schnell überfordert.',
    communicationTip: 'Wertschätzung als Mensch zeigen, aber klare Grenzen für die eigene Belastbarkeit setzen.'
  },
  doer: {
    name: 'Macher (Umsetzungsstark)',
    strengths: 'Tatkräftig, mutig, anpassungsfähig und ergebnisorientiert.',
    stressPattern: 'Wird unter Stress ungeduldig, macht Druck und überspringt wichtige Details.',
    communicationTip: 'Kurz, direkt auf den Punkt kommen und rasch sichtbare Umsetzungsschritte ermöglichen.'
  },
  rebel: {
    name: 'Rebell (Kreativ & Spontan)',
    strengths: 'Kreativ, humorvoll, spielerisch und stark im Querdenken.',
    stressPattern: 'Fühlt sich unter Druck eingeengt, schiebt Pflichten auf oder geht in den Widerstand.',
    communicationTip: 'Freiraum, Abwechslung und spielerische Perspektiven statt starrer Vorschriften nutzen.'
  }
};


  const MIND_CONTENT_PACKAGE_A = [
  // ==========================================================================
  // MODUL 1: STRESS-ANTREIBER & KOHÄRENZGEFÜHL (BURNOUT-SCHUTZ)
  // ==========================================================================
  {
    id: 'mind_mod_stress_drivers',
    linkedPlanId: 'plan_mind_stress_freedom',
    linkedDrillIds: ['drill_name_the_emotion', 'drill_muss_ich_6_questions'],
    subCategory: 'Mentales Training & Resilienz',
    level: 1,
    prerequisites: [],
    buildsInto: ['mind_mod_proactivity', 'mind_mod_muss_ich_filter'],
    targetDrivers: ['perfection', 'please', 'independent', 'control', 'endure'],
    targetPersonalities: ['logician', 'persister', 'empath', 'doer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Innere Stress-Antreiber entschärfen',
      subtitle: 'Wie du unbewusste „Ich muss“-Gesetze im Kopf erkennst und löst',
      readingTimeMinutes: 3,
      coreInsight:
        'Nicht die Arbeit allein macht uns fertig, sondern innere Gebote wie „Sei perfekt!“, „Sei beliebt!“ oder „Mach alles selbst!“. Wer sie erkennt, kann sie durch bewusste Erlaubnissätze ersetzen.',
      quickActionToday:
        'Achte heute auf jeden Gedanken mit „Ich muss unbedingt…“ und ersetze ihn einmal bewusst durch „Ich entscheide mich für 80 % Aufwand.“',
      reflectionQuestion:
        'Welcher deiner inneren Antreiber kostet dich aktuell im Alltag den höchsten Preis?',
      takeawayQuote:
        'Du musst nicht alles selbst und zu 100 % perfekt machen, um verlässlich und wertvoll zu sein.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die 5 stressverschärfenden Denkmuster',
          points: [
            '1. Sei perfekt!: Fehler sind verboten, Termine heilig, 100 % Verlass ist Pflicht.',
            '2. Sei beliebt!: Niemanden enttäuschen wollen, Harmoniezwang, Angst vor Kritik oder Ärger anderer.',
            '3. Sei unabhängig!: „Am liebsten mache ich alles selbst“ – Hilfe anzunehmen wirkt wie Schwäche.',
            '4. Behalte Kontrolle!: Ungewissheit ist unerträglich, ständiges Grübeln über Eventualitäten.',
            '5. Halte durch!: Härte gegen sich selbst, Schmerzen und Druck werden ignoriert, Aufgeben ist tabu.',
          ],
        },
        {
          heading: 'Burnout-Schutz: Das Kohärenzgefühl stärken',
          points: [
            'Perfektionismus, Misstrauen gegenüber fremder Hilfe und Selbstwert nur über Arbeitseinsatz sind die größten Treiber für Erschöpfung und Zynismus.',
            'Gesund bleibt, wer 3 Faktoren sichert: 1. Verstehbarkeit (Warum tue ich das?), 2. Bewältigbarkeit (Habe ich die Ressourcen?), 3. Sinnhaftigkeit (Kann ich selbst mitgestalten?).',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Antreiber-Satz ertappen',
          description: 'Merke auf, sobald du innerlich Sätze hörst wie „Ohne mich geht es nicht“ oder „Es wäre schrecklich, wenn jemand unzufrieden ist“.',
        },
        {
          stepNumber: 2,
          title: 'Realitätscheck durchführen',
          description: 'Frage dich nüchtern: Was passiert real im schlimmsten Fall, wenn ich hier nicht zu 100 % perfekt bin oder Nein sage?',
        },
        {
          stepNumber: 3,
          title: 'Erlaubnissatz aktivieren',
          description: 'Formuliere aktiv die Gegen-Erlaubnis (z. B. „Ich darf heute um Hilfe bitten“ oder „Gute 80 % reichen hier völlig“).',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Du übernimmst abends noch die Aufgabe eines Kollegen, weil du denkst: „Wenn ich mich auf andere verlasse, bin ich verlassen“ (Sei unabhängig!).',
          betterApproach: 'Du übergibst die Aufgabe mit klarem Zielrahmen, akzeptierst einen anderen Lösungsweg und schützt deinen Feierabend.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du sagst nach einer harten Woche zu einem stressigen Treffen Ja, nur um niemanden vor den Kopf zu stoßen (Sei beliebt!).',
          betterApproach: 'Du sagst ehrlich und freundlich ab – ein bewusstes Nein nach außen ist ein bewusstes Ja zu deiner Familie und Erholung.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Selbstbeobachtung',
          dailyMicroTask: 'Notiere abends 1 Situation, in der dich ein „Ich muss“-Gedanke unter Druck gesetzt hat.',
          repeatingReminderPrompt: 'Stress-Check: Welcher innere Antreiber wollte heute das Steuer übernehmen?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Erlaubnissätze testen',
          dailyMicroTask: 'Wende einmal täglich deinen persönlichen Erlaubnissatz bei einer kleinen Aufgabe an.',
          repeatingReminderPrompt: 'Denk an deinen Erlaubnissatz: Wo reichen heute entspannte 80 % statt 100 % Perfektion?',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Verhaltensanker',
          dailyMicroTask: 'Prüfe deine Hauptbelastung auf Verstehbarkeit, Bewältigbarkeit und Sinnhaftigkeit. Hole dir aktiv Unterstützung oder grenze dich ab.',
          repeatingReminderPrompt: 'Erhaltungs-Impuls: Machst du gerade etwas nur aus falschem Pflichtgefühl? Lass den Ball dort, wo er hingehört.',
        },
      ],
      extraReflectionQuestions: [
        'Wo versuche ich gerade, ein strukturelles Problem durch noch mehr eigene Überstunden zu lösen?',
        'Welchen meiner Antreiber halte ich fälschlicherweise für eine unverzichtbare Stärke, obwohl er mich auslaugt?',
      ],
      quiz: [
        {
          question: 'Welcher innere Antreiber steckt hinter dem Gedanken: „Es ist ganz fürchterlich, wenn ich nicht weiß, was auf mich zukommt“?',
          options: ['Sei beliebt!', 'Behalte Kontrolle!', 'Halte durch!'],
          correctIndex: 1,
          explanation: 'Der Antreiber „Behalte Kontrolle!“ verlangt 100 % Sicherheit und erzeugt starken Stress bei Ungewissheit.',
        },
        {
          question: 'Welche drei Säulen bilden das stressschützende Kohärenzgefühl?',
          options: [
            'Tempo, Disziplin und Ausdauer',
            'Verstehbarkeit, Bewältigbarkeit und Sinnhaftigkeit (Mitgestaltbarkeit)',
            'Perfektion, Unabhängigkeit und Kontrolle',
          ],
          correctIndex: 1,
          explanation: 'Wenn Aufgaben nachvollziehbar sind, Ressourcen bereitstehen und man selbstbestimmt gestalten kann, sinkt das Burnout-Risiko massiv.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 2: PROAKTIVITÄT & DER EIGENE EINFLUSSBEREICH
  // ==========================================================================
  {
    id: 'mind_mod_proactivity',
    linkedPlanId: 'plan_mind_proactive_resilience',
    linkedDrillIds: ['drill_circle_of_influence', 'drill_name_the_emotion'],
    subCategory: 'Mentales Training & Resilienz',
    level: 1,
    prerequisites: ['mind_mod_stress_drivers'],
    buildsInto: ['mind_mod_muss_ich_filter', 'mind_mod_fear_emotions'],
    targetDrivers: ['control', 'endure', 'please'],
    targetPersonalities: ['persister', 'empath', 'dreamer', 'doer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Proaktivität & Dein Einflussbereich',
      subtitle: 'Zwischen Reiz und Reaktion liegt deine Freiheit zu wählen',
      readingTimeMinutes: 3,
      coreInsight:
        'Du bist nicht deine Stimmung. Wer seine Energie an Dinge verschwendet, die er nicht ändern kann (Interessenbereich), landet in der Opferrolle – wer im eigenen Einflussbereich handelt, wird stärker.',
      quickActionToday:
        'Wenn dich heute etwas ärgert, frage dich sofort: „Habe ich darauf direkte, indirekte oder keine Kontrolle?“ und setze 1 Schritt, der komplett bei dir liegt.',
      reflectionQuestion:
        'Über welchen Umstand beklagst du dich aktuell, statt deinen eigenen ersten Schritt zu wählen?',
      takeawayQuote:
        'Wer nicht selbst agiert, wird von den Umständen regiert – zwischen Reiz und Reaktion wählst du.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die letzte Freiheit des Menschen (Reiz vs. Reaktion)',
          points: [
            'Selbstwahrnehmung erlaubt es uns, uns wie aus einer oberen Zimmerecke selbst zu beobachten: Wir sind nicht unsere Gefühle, Stimmungen oder Gedanken.',
            'Viktor Frankl erkannte selbst unter extremsten Bedingungen: Zwischen dem äußeren Reiz und unserer Reaktion liegt ein Raum, in dem wir unsere Antwort frei nach unseren Werten wählen können.',
            'Sprache verrät unsere Haltung („Du bist, was du sagst“): Reaktive Sprache („Ich muss“, „Die anderen sind schuld“) gibt Macht ab; proaktive Sprache („Ich wähle“, „Ich schlage vor“) übernimmt das Steuer.',
          ],
        },
        {
          heading: 'Interessenbereich vs. Einflussbereich & 3 Kontroll-Zonen',
          points: [
            'Interessenbereich: Alles, was uns beschäftigt, wir aber nicht steuern können (Wetter, Vergangenheit, Fehler anderer). Fokus hierauf macht ohnmächtig und verkleinert den Einfluss.',
            'Einflussbereich: Alles, worauf wir aktiv einwirken können. Fokus hierauf vergrößert unseren Spielraum täglich.',
            'Die 3 Problem-Arten: 1. Direkte Kontrolle (eigenes Verhalten -> Gewohnheit ändern), 2. Indirekte Kontrolle (Verhalten anderer -> Einflussmethode ändern), 3. Keine Kontrolle (Fakten annehmen & Verantwortung für den eigenen Gesichtsausdruck übernehmen).',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Abstand einnehmen (Kamera-Perspektive)',
          description: 'Beobachte deine aktuelle Emotion von außen, ohne sofort impulsiv zu reagieren.',
        },
        {
          stepNumber: 2,
          title: 'Kontroll-Zone bestimmen',
          description: 'Prüfe: Liegt das Problem unter direkter, indirekter oder keiner Kontrolle?',
        },
        {
          stepNumber: 3,
          title: 'Ersten eigenen Schritt setzen',
          description: 'Ändere deine Gewohnheit, deine Kommunikationsweise oder deine innere Haltung – verzichte komplett auf Vorwürfe und Ausreden.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Eine Nachbarabteilung liefert ständig unvollständige Infos. Du regst dich täglich im Team-Chat darüber auf (Fokus im Interessenbereich).',
          betterApproach: 'Indirekte/Direkte Kontrolle nutzen: Du erstellst eine einfache Pflichtfeld-Vorlage oder klärst im kurzen Gespräch den gemeinsamen Nutzen.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du stehst auf dem Weg in den Urlaub im Stau oder das Wetter schlägt um, und die gereizte Stimmung verdirbt allen den Tag.',
          betterApproach: 'Keine Kontrolle akzeptieren: Du übernimmst „Verantwortung für deinen Gesichtsausdruck“ und machst im Auto ein Hörspiel oder Ratespiel an.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Tag 1–10: Sprach- & Impulskontrolle',
          dailyMicroTask: 'Achte den ganzen Tag auf deine Sprache. Streiche Ausreden, Vorwürfe und „Ich muss“-Sätze.',
          repeatingReminderPrompt: 'Sprach-Check: Redest du heute über Hindernisse (reaktiv) oder über deinen nächsten Schritt (proaktiv)?',
        },
        {
          stageLabel: 'Tag 11–20: Einflussbereich ausdehnen',
          dailyMicroTask: 'Nimm täglich ein kleines Ärgernis und definiere den 1. Schritt, der zu 100 % in deiner Hand liegt.',
          repeatingReminderPrompt: 'Fokus-Frage: Liegt das Thema, das dich gerade beschäftigt, in deinem Einflussbereich?',
        },
        {
          stageLabel: 'Tag 21–30 & Langzeit-Erhalt: Der 30-Tage-Proaktivitäts-Test',
          dailyMicroTask: 'Gehe kleine Verpflichtungen dir selbst oder anderen gegenüber ein und halte sie zu 100 % ein. Sei Vorbild statt Kritiker.',
          repeatingReminderPrompt: 'Proaktivitäts-Anker: Zwischen Reiz und Reaktion liegt deine Wahl. Welchen Wert willst du heute vorleben?',
        },
      ],
      extraReflectionQuestions: [
        'In welcher Situation verhalte ich mich erfahrungsgemäß oft reaktiv – und wie will ich beim nächsten Mal proaktiv antworten?',
        'Wem gebe ich aktuell Macht über meine Laune, weil ich ihn für meine Situation verantwortlich mache?',
      ],
      quiz: [
        {
          question: 'Was passiert laut Stephen Covey, wenn wir unsere meiste Zeit und Energie auf unseren „Interessenbereich“ (statt den Einflussbereich) richten?',
          options: [
            'Wir lösen die Probleme anderer schneller.',
            'Wir geraten in eine Opferrolle und unser eigener Einflussbereich schrumpft.',
            'Wir gewinnen mehr Überblick und Gelassenheit.',
          ],
          correctIndex: 1,
          explanation: 'Wer sich auf Dinge ohne eigene Kontrolle (Schwächen anderer, Umstände) fixiert, verbraucht Energie negativ und verkleinert seinen Handlungsspielraum.',
        },
        {
          question: 'Wie löst man proaktiv ein Problem, über das man „keine Kontrolle“ hat?',
          options: [
            'Indem man noch härter dagegen ankämpft.',
            'Indem man einen Schuldigen sucht.',
            'Indem man es annimmt und die Verantwortung für die eigene Haltung („den eigenen Gesichtsausdruck“) übernimmt.',
          ],
          correctIndex: 2,
          explanation: 'Bei unveränderbaren Fakten liegt unsere Freiheit darin, wie wir innerlich und äußerlich damit umgehen.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 3: „MUSS ICH ODER MUSS ICH NICHT?“ (6 FILTERFRAGEN & ABGRENZUNG)
  // ==========================================================================
  {
    id: 'mind_mod_muss_ich_filter',
    linkedPlanId: 'plan_mind_focus_priorities',
    linkedDrillIds: ['drill_muss_ich_6_questions'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 2,
    prerequisites: ['mind_mod_stress_drivers', 'mind_mod_proactivity'],
    buildsInto: ['mind_mod_gtd_focus'],
    targetDrivers: ['perfection', 'independent', 'please', 'endure'],
    targetPersonalities: ['doer', 'logician', 'empath'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: '„Muss ich oder muss ich nicht?“',
      subtitle: 'Wie du mit 6 Fragen bis zu 25 % unnötigen Aufgaben-Ballast abwirfst',
      readingTimeMinutes: 4,
      coreInsight:
        'Gerade zuverlässige Leistungsträger brennen aus, weil sie alles sofort erledigen. Dabei haben bis zu 25 % aller Aufgaben gar keinen triftigen Grund oder gehören zu jemand anderem.',
      quickActionToday:
        'Nimm eine Aufgabe von deiner Liste und frage dich: „Welche Folge hätte es in 4 Wochen, wenn diese Aufgabe gar nicht erledigt würde?“',
      reflectionQuestion:
        'Welche Geschichte erzählst du dir aus Angst, Unsicherheit oder Zweifel (AUZ), warum du nicht Nein sagen kannst?',
      takeawayQuote:
        'Dass du eine Aufgabe lösen kannst, heißt noch lange nicht, dass es deine Aufgabe ist.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die Zuverlässigkeits-Falle & das Zeit-Portfolio',
          points: [
            'Wer immer sofort erreichbar ist, jedes To-do abarbeitet und als Experte überall einspringt, bezahlt dafür oft mit dem Verlust von Sport, Beziehungen und Erholung.',
            'Studien zeigen: Ein Viertel aller Aufgaben hat keinen triftigen Grund.',
            'Zeitbudget-Portfolio: Teile deine Zeit wie ein Investor in feste Prozent-Kategorien ein (z. B. Kernprojekte, Team, Tagesgeschäft/Mails, Weiterentwicklung) und gleiche Soll und Ist ab.',
          ],
        },
        {
          heading: 'Die AUZ-Liste & das diplomatische Nein',
          points: [
            'Oft treiben uns innere Geschichten an: „Man hält mich für unhöflich“ oder „Ich wirke inkompetent“. Eine AUZ-Liste (Angst, Unsicherheit, Zweifel) entlarvt diese Annahmen im Abgleich mit der Realität.',
            'Ein Nein muss nicht hart klingen: Kläre Wert, Priorität und Ressourcen („Im Grunde müsste ich gerade ablehnen, außer Thema X darf dafür warten“).',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Sinn- & 4-Wochen-Prüfung (Fragen 1 & 3)',
          description: '1. Warum muss das überhaupt getan werden? 3. Was passiert real in 4 Wochen, wenn es liegen bleibt?',
        },
        {
          stepNumber: 2,
          title: 'Zeitbudget- & Zuständigkeits-Prüfung (Fragen 2 & 4)',
          description: '2. Passt es in mein Prozent-Zeitbudget? 4. Wer will das Ergebnis – und wer ist wirklich die richtige Person dafür?',
        },
        {
          stepNumber: 3,
          title: 'Bedeutungs- & AUZ-Prüfung (Fragen 5 & 6)',
          description: '5. Übertreibe ich gerade Tempo oder Perfektion? 6. Welche Geschichte erzähle ich mir selbst (Angst, Unsicherheit, Zweifel)?',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein Kollege bittet dich „kurz“ um ein Daten-Update, das dich 2 Stunden kostet. Du sagst sofort Ja, um hilfsbereit zu wirken.',
          betterApproach: 'Du nutzt eine professionelle Alternative: „Ich kann aktuell nicht in noch ein Thema einsteigen – ich nehme es für nächste Woche ins Backlog oder du wendest dich direkt an Y.“',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du opferst dein Lauftraining, um am Abend noch eine völlig unwichtige organisatorische Kleinigkeit perfekt vorzubereiten.',
          betterApproach: 'Der 4-Wochen-Test zeigt: In einem Monat interessiert diese Kleinigkeit niemanden mehr – deine Gesundheit und dein Ausgleich haben Vorrang.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Der 4-Wochen-Filter',
          dailyMicroTask: 'Stelle jedem neuen To-do die 4-Wochen-Frage und streiche täglich mindestens eine Schein-Dringlichkeit.',
          repeatingReminderPrompt: 'Filter-Check: Was passiert in 4 Wochen, wenn du diese Aufgabe heute einfach weglässt?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Verantwortung dort lassen, wo sie hingehört',
          dailyMicroTask: 'Prüfe bei jeder Anfrage: „Bin ich die richtige Person dafür?“ Gib mindestens 1 Thema zurück oder delegiere es.',
          repeatingReminderPrompt: 'Zuständigkeits-Check: Löst du gerade das Problem von jemand anderem auf Kosten deiner eigenen Ziele?',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Langzeit-Erhalt: AUZ-Check & Zeit-Portfolio',
          dailyMicroTask: 'Gleiche dein reales Zeitbudget mit deinen Wunsch-Prozenten ab und entlarve falsche Pflicht-Geschichten (AUZ).',
          repeatingReminderPrompt: 'AUZ-Reminder: Welche Geschichte erzählst du dir gerade, warum du vermeintlich „nicht Nein sagen kannst“?',
        },
      ],
      extraReflectionQuestions: [
        'Wie viel Prozent meiner Woche fließt aktuell in reaktive Kleinarbeit statt in meine wichtigsten Schlüsselziele?',
        'Welche konkrete Formulierung nutze ich morgen, wenn jemand ein ungeplantes Thema bei mir abladen möchte?',
      ],
      quiz: [
        {
          question: 'Wie viel Prozent aller typischen Aufgaben haben laut Studien eigentlich keinen triftigen Grund?',
          options: ['Rund 5 %', 'Bis zu 25 % (ein Viertel)', 'Über 80 %'],
          correctIndex: 1,
          explanation: 'Bis zu ein Viertel aller Aufgaben im Arbeitsalltag kann ohne negativen Effekt gestrichen oder ignoriert werden.',
        },
        {
          question: 'Welche Frage hilft am besten gegen vorschnellen Aktionismus bei neuen Anfragen?',
          options: [
            'Wie kann ich das noch heute Nacht fertigstellen?',
            'Welche Folge hätte es in vier Wochen, wenn diese Aufgabe nicht gelöst würde?',
            'Wer könnte mich kritisieren, wenn ich frage?',
          ],
          correctIndex: 1,
          explanation: 'Die 4-Wochen-Perspektive trennt sofort echte Prioritäten von kurzfristigem Lärm.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 4: „MIND LIKE WATER“, GTD-WORKFLOW & GROSSE STEINE ZUERST
  // ==========================================================================
  {
    id: 'mind_mod_gtd_focus',
    linkedPlanId: 'plan_mind_focus_priorities',
    linkedDrillIds: ['drill_gtd_next_action'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 2,
    prerequisites: ['mind_mod_muss_ich_filter'],
    buildsInto: [],
    targetDrivers: ['perfection', 'control', 'independent'],
    targetPersonalities: ['logician', 'doer', 'rebel', 'dreamer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Kopf frei & „Eat that Frog“',
      subtitle: 'Wie du offene Schleifen schließt und die großen Steine zuerst bewegst',
      readingTimeMinutes: 4,
      coreInsight:
        'Unser Kopf ist zum Denken da, nicht zum Speichern: Zu viele unklare „Open Loops“ überlasten deinen mentalen Arbeitsspeicher (RAM). Man managt nicht Zeit, sondern immer nur die nächste konkrete Handlung (Next Action).',
      quickActionToday:
        'Bestimme für dein größtes aufgeschobenes Thema („Frog“) in 1 Satz das gewünschte Endergebnis und lege den allerersten physischen 5-Minuten-Schritt fest.',
      reflectionQuestion:
        'Welches Thema schiebst du gerade nur deshalb vor dir her, weil der konkrete nächste Handlungsschritt noch gar nicht definiert ist?',
      takeawayQuote:
        'Fülle dein Glas zuerst mit den großen Steinen – sonst machen Kies und Sand es randvoll.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Warum wir aufschieben: Open Loops & fehlende Next Action',
          points: [
            'Jede ungeklärte Aufgabe im Kopf belegt Arbeitsspeicher (RAM) und hält uns im ständigen Alarmmodus.',
            '„Mind like water“: Wie Wasser auf einen Steinwurf angemessen reagiert und danach sofort wieder spiegelglatt wird, reagiert ein aufgeräumter Geist ruhig und kreativ.',
            'Wir prokrastinieren meist nicht aus Faulheit, sondern weil das Ziel schwammig ist und die nächste physisch sichtbare Handlung (Next Action) fehlt.',
          ],
        },
        {
          heading: 'Große Steine (Quadrant 2) & „Eat that Frog“',
          points: [
            'Quadrant-2-Tätigkeiten (wichtig, aber noch nicht dringend) entscheiden über deinen langfristigen Erfolg in Beruf, Gesundheit und Familie.',
            'Eat that Frog: Starte den Tag mit der größten, wichtigsten Aufgabe. Was du vermeidest, wächst im Kopf an und erzeugt eine Schicht aus Schuldgefühlen.',
            'ABCDE-Priorisierung: A = Sofort & extrem wichtig, B = Nach A, C = Nebensächlich, D = Delegieren für Fokus, E = Eliminieren.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Capture (Sammeln)',
          description: 'Schreibe alles Unfertige aus deinem Kopf an möglichst wenigen zentralen Orten (Inbox/Notizbuch) auf.',
        },
        {
          stepNumber: 2,
          title: 'Clarify (Klären & 5-Minuten-Regel)',
          description: 'Beschreibe in 1 Satz, wie Erfolg aussieht, und definiere die nächste sichtbare Handlung. Dauert sie unter 5 Minuten -> sofort erledigen! Falscher Empfänger -> delegieren. Sonst -> auf die Prioritätenliste.',
        },
        {
          stepNumber: 3,
          title: 'Eat that Frog (Tagesstart)',
          description: 'Beginne den Morgen mit deiner wichtigsten A-Aufgabe (dem größten Stein), bevor du in fremde Nachrichten eintauchst.',
        },
        {
          stepNumber: 4,
          title: 'Weekly Review (Freitags-Clear-Decks)',
          description: 'Nimm dir 1x pro Woche feste Zeit, um alle Listen zu leeren, „Warten auf“-Punkte zu prüfen und veraltete Ideen zu löschen.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Auf deiner Liste steht „Projektstrategie Q3“ – weil das riesig wirkt, beantwortest du lieber 30 leichte E-Mails.',
          betterApproach: 'Du brichst es auf die Next Action herunter: „Entwurf-Dokument öffnen und 3 Kernziele als Stichpunkte notieren“ – und startest damit als Erstes am Morgen.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Im Kopf schwirren 15 Dinge (Steuer, Kinderarzt-Termin, Geschenk besorgen, Reparatur) und ruinieren deine Entspannung am Feierabend.',
          betterApproach: '5 Minuten Brain-Dump in eine Liste, den 2-Minuten-Anruf sofort erledigen, dem Rest ein festes Datum geben -> der Kopf ist sofort frei für die Familie.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Die 5-Minuten- & Next-Action-Regel',
          dailyMicroTask: 'Erledige Aufgaben unter 5 Minuten sofort und schreibe auf deine Liste keine Schlagworte, sondern nur konkrete physische Handlungen.',
          repeatingReminderPrompt: 'Next-Action-Check: Ist bei deinem wichtigsten Thema der allererste physische Schritt klar definiert?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Eat that Frog am Morgen',
          dailyMicroTask: 'Lege am Vorabend deine 1 wichtigste A-Aufgabe fest und arbeite morgens konzentriert daran, bevor du Kleinkram erledigst.',
          repeatingReminderPrompt: 'Morgen-Fokus: Welcher „große Stein“ (Frog) kommt heute zuerst in dein Glas?',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Langzeit-Erhalt: Das Weekly Review',
          dailyMicroTask: 'Führe jeden Freitag ein kurzes Review durch: Inbox auf 0, offene Schleifen schließen, nächste Woche im Kalender vorprüfen.',
          repeatingReminderPrompt: 'Mind-like-Water-Review: Leere deinen mentalen Arbeitsspeicher – welche offenen Schleifen kannst du heute schließen?',
        },
      ],
      extraReflectionQuestions: [
        'Welche Aufgabe auf meiner Liste ist eigentlich längst überholt und darf heute komplett gelöscht werden (Kategorie E)?',
        'Beendet jedes meiner Meetings das Gespräch mit einer klaren „Next Action“ und einer verantwortlichen Person?',
      ],
      quiz: [
        {
          question: 'Warum schieben Menschen große, wichtige Projekte am häufigsten vor sich her?',
          options: [
            'Weil ihnen das Thema völlig egal ist.',
            'Weil das Zielbild noch nicht in einem Satz geklärt ist und die konkrete nächste sichtbare Handlung (Next Action) fehlt.',
            'Weil sie zu wenig E-Mails lesen.',
          ],
          correctIndex: 1,
          explanation: 'Ohne definierte „Next Action“ weiß das Gehirn nicht, womit es konkret starten soll, und weicht auf leichte Routineaufgaben aus.',
        },
        {
          question: 'Was besagt die „2-bis-5-Minuten-Regel“ im Selbstmanagement?',
          options: [
            'Man sollte alle 5 Minuten seine E-Mails prüfen.',
            'Aufgaben, die ich selbst in unter 5 Minuten erledigen kann, werden beim Klären sofort erledigt statt aufgeschrieben.',
            'Jedes Meeting darf maximal 5 Minuten dauern.',
          ],
          correctIndex: 1,
          explanation: 'Bei Kleinstaufgaben unter 5 Minuten wäre der Verwaltungs- und Erinnerungsaufwand größer als die sofortige Erledigung.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 5: ANGST & UNGEWISSHEIT STOPPEN + GEFÜHLE REGULIEREN
  // ==========================================================================
  {
    id: 'mind_mod_fear_emotions',
    linkedPlanId: 'plan_mind_proactive_resilience',
    linkedDrillIds: ['drill_10_sec_breath', 'drill_name_the_emotion'],
    subCategory: 'Mentales Training & Resilienz',
    level: 2,
    prerequisites: ['mind_mod_proactivity'],
    buildsInto: [],
    targetDrivers: ['control', 'please', 'endure'],
    targetPersonalities: ['dreamer', 'empath', 'persister', 'logician'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Ruhe im Sturm & Gefühle steuern',
      subtitle: 'Wie du Ungewissheit im Hier und Jetzt stoppst und Gefühle als Besucher lenkst',
      readingTimeMinutes: 4,
      coreInsight:
        'Angst entsteht fast immer durch gedankliches Vorwegnehmen der Zukunft oder soziale Ansteckung mit fremder Hektik. Wer seinen Körper 10 Sekunden erdet und Gefühle präzise benennt, holt sofort sein rationales Denken zurück.',
      quickActionToday:
        'Halte heute bei innerer Unruhe 10 Sekunden inne, spüre deine Fußsohlen am Boden, nimm 3 ruhige Atemzüge und benenne das Gefühl laut oder im Stillen: „Gerade ist Anspannung zu Besuch.“',
      reflectionQuestion:
        'Welche Sorge beschäftigt dich gerade, obwohl sie gar nicht heute, sondern erst in Tagen oder Wochen relevant wird?',
      takeawayQuote:
        'Du bist nicht das Wetter, sondern der Himmel. Gefühle sind Besucher – sie kommen, liefern eine Information und ziehen wieder weiter.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Warum Ungewissheit das rationale Gehirn abschaltet',
          points: [
            'Bei Ungewissheit oder Hektik schlägt die Amygdala (Alarmzentrum) an und fährt den präfrontalen Kortex (logisches Planen) herunter.',
            'Gefühle sind außerdem sozial ansteckend: Wenn wir unbewusst die Hektik anderer übernehmen, geraten wir in fremden Stress.',
            'Sobald wir einen Schritt zurücktreten und die Emotion präzise benennen („Name it to tame it“), übernimmt wieder das Bewusstsein die Steuerung.',
          ],
        },
        {
          heading: 'Tag-für-Tag-Fokus statt Zukunfts-Grübeln',
          points: [
            'Sorgen leben fast immer in einem fiktiven „Was wäre, wenn…“-Zukunftsszenario, in dem wir heute noch gar nicht handeln können.',
            'Der Fokus auf den heutigen Tag („Was steht heute konkret an?“) entzieht dem Katastrophenfilm sofort die Energie.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          actionTitle: 'Körper-Anker setzen (10 Sekunden)',
          instruction: 'Unterbrich das Gedankenkarussell physisch: Spüre beide Fußsohlen fest am Boden und nimm 3 ruhige Atemzüge mit verlängerter Ausatmung.',
        },
        {
          stepNumber: 2,
          actionTitle: 'Gefühl präzise benennen',
          instruction: 'Sage dir innerlich: „Ich bemerke gerade das Gefühl von [z. B. Überforderung / Ungeduld / Unsicherheit].“ Trenne dein Ich von der Emotion.',
        },
        {
          stepNumber: 3,
          actionTitle: 'Fremde Hektik abgrenzen',
          instruction: 'Prüfe kurz: „Gehört diese Anspannung wirklich mir – oder habe ich sie gerade von jemand anderem übernommen?“',
        },
        {
          stepNumber: 4,
          actionTitle: 'Auf den heutigen Schritt reduzieren',
          instruction: 'Frage dich: „Was ist heute im Hier und Jetzt wirklich dran?“ und setze nur diesen einen nächsten Schritt um.',
        },
      ],
      dosAndDonts: [
        {
          doThis: 'Gefühle als nützliche Signale wahrnehmen, benennen und annehmen, ohne sofort impulsiv zu handeln.',
          avoidThis: 'Emotionen wegdrücken („Ich darf keine Angst/Wut haben“) oder sich komplett mit ihnen identifizieren („Ich bin ein Versager“).',
        },
        {
          doThis: 'Dich auf die Aufgaben konzentrieren, die heute in deiner Hand liegen.',
          avoidThis: 'In schlaflosen Stunden gedanklich Probleme lösen wollen, die erst nächste Woche entscheidbar sind.',
        },
      ],
      selfCheckList: [
        'Ich erkenne frühzeitig an körperlichen Signalen (flacher Atem, enge Schultern), wenn Unruhe aufsteigt.',
        'Ich kann zwischen meinen eigenen Gefühlen und der Hektik meines Umfelds unterscheiden.',
        'Ich nutze eine kurze Atem- und Erdungspause, bevor ich in heiklen Lagen antworte.',
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein Kollege stürmt panisch ins Büro und überträgt seine Hektik auf dich – plötzlich machst du Flüchtigkeitsfehler.',
          betterApproach: '10 Sekunden Fußsohlen spüren, tief ausatmen und innerlich sagen: „Das ist seine Hektik, nicht meine. Ich arbeite meinen Punkt ruhig zu Ende.“',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Abends im Bett kreisen die Gedanken um alle offenen Themen der nächsten Woche.',
          betterApproach: 'Gedanken kurz auf einen Zettel für morgen parken, Hand auf den Bauch legen und 5 ruhige Atemzüge im Hier und Jetzt nehmen.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Der 10-Sekunden-Erdungs-Anker',
          dailyMicroTask: 'Setze zweimal täglich bewusst für 10 Sekunden den Fokus auf deine Fußsohlen und 3 ruhige Atemzüge.',
          repeatingReminderPrompt: '10-Sekunden-Anker: Spüre kurz den Boden unter deinen Füßen und atme ruhig aus.',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Gefühle als Besucher benennen',
          dailyMicroTask: 'Wenn heute Ärger, Stress oder Sorge auftaucht, benenne das Gefühl mit einem präzisen Wort.',
          repeatingReminderPrompt: 'Emotions-Check: Welches Gefühl ist gerade zu Besuch – und welche Botschaft bringt es?',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–30) & Langzeit-Erhalt: Tag-für-Tag-Fokus',
          dailyMicroTask: 'Stoppe Zukunfts-Grübeln konsequent mit der Frage: „Was ist heute mein einziger nächster Schritt?“',
          repeatingReminderPrompt: 'Hier-und-Jetzt-Check: Kümmere dich heute nur um das, was heute dran ist.',
        },
      ],
      extraReflectionQuestions: [
        'Wann habe ich zuletzt die Unruhe einer anderen Person unbewusst wie einen Schwamm aufgesaugt?',
        'Welches Gefühl meldet sich bei mir besonders oft – und welches unerfüllte Bedürfnis (z. B. Ruhe, Klarheit, Wertschätzung) steckt dahinter?',
      ],
      quiz: [
        {
          question: 'Was passiert im Gehirn, wenn wir ein starkes unangenehmes Gefühl präzise beim Namen nennen?',
          options: [
            'Das Gefühl wird dadurch doppelt so stark.',
            'Die Aktivität im Alarmzentrum (Amygdala) sinkt und das rationale Bewusstsein (präfrontaler Kortex) übernimmt wieder die Steuerung.',
            'Es hat keinerlei Auswirkung.',
          ],
          correctIndex: 1,
          explanation: 'Neurowissenschaftliche Studien („Name it to tame it“) zeigen, dass das bewusste Benennen einer Emotion die Stressreaktion messbar beruhigt.',
        },
        {
          question: 'Was ist das wirksamste Gegenmittel gegen endloses Zukunfts-Grübeln?',
          options: [
            'Noch mehr mögliche Katastrophen durchspielen, bis man auf alles vorbereitet ist.',
            'Den Fokus über eine kurze Körper-Erdung zurück ins Hier und Jetzt holen und nur den heutigen Schritt festlegen.',
            'Die Sorgen komplett verdrängen und schneller arbeiten.',
          ],
          correctIndex: 1,
          explanation: 'Handeln ist nur in der Gegenwart möglich. Die Erdung im Körper holt den Geist aus der fiktiven Zukunft zurück in die Handlungsfähigkeit.',
        },
      ],
    },
  },
];

  const MIND_CONTENT_PACKAGE_B = [
  // ==========================================================================
  // MODUL 6: KOGNITIVE DENKFEHLER (RÜCKSCHAUFEHLER, WYSIATI & STORY-FALLE)
  // ==========================================================================
  {
    id: 'mind_mod_cognitive_biases',
    linkedPlanId: 'plan_mind_clear_decisions',
    linkedDrillIds: ['drill_bias_decision_check'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 1,
    prerequisites: [],
    buildsInto: ['mind_mod_biological_traps', 'mind_mod_decision_matrix'],
    targetDrivers: ['perfection', 'control'],
    targetPersonalities: ['logician', 'persister', 'doer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Denkfehler entlarven: Rückschau & Story-Falle',
      subtitle: 'Warum unser Gehirn im Nachhinein alles „schon vorher wusste“',
      readingTimeMinutes: 3,
      coreInsight:
        'Wir halten unvollständige Infos für das ganze Bild und bewerten Entscheidungen oft unfair nach dem Ergebnis statt nach dem Prozess (Rückschaufehler). Zudem glauben wir einer guten Story eher als nüchternen Wahrscheinlichkeiten.',
      quickActionToday:
        'Frage dich heute bei einer schnellen Einschätzung: „Welche wichtige Information fehlt mir gerade komplett – und bewerte ich hier den Prozess oder nur das glückliche/unglückliche Ergebnis?“',
      reflectionQuestion:
        'Bei welchem vergangenen Fehler bist du zu hart zu dir, weil du heute Dinge weißt, die damals noch gar nicht absehbar waren?',
      takeawayQuote:
        'Eine gute Entscheidung kann durch Pech scheitern – und ein schlechtes Risiko durch Glück gewinnen. Bewerte den Prozess, nicht nur den Ausgang.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Vollständigkeits-Illusion & Fragen-Ersetzung',
          points: [
            'Wir verwenden die Informationen, die wir gerade haben, so, als wären sie vollständig, und unterschätzen unsere eigene Unwissenheit massiv.',
            'Ist eine Frage zu komplex, ersetzt das Gehirn sie unbemerkt durch eine leichter zu beantwortende Frage (z. B. Bauchgefühl statt Wahrscheinlichkeit).',
            'Eine plausible, gut klingende Geschichte ziehen wir echten statistischen Wahrscheinlichkeiten fast immer vor.',
          ],
        },
        {
          heading: 'Rückschaufehler (Hindsight Bias) & Erfolgs-Illusion',
          points: [
            'Im Nachhinein korrigiert unser Gedächtnis frühere Einschätzungen automatisch in Richtung des tatsächlichen Ergebnisses – Fehler wirken plötzlich „offensichtlich“.',
            'Das gilt auch umgekehrt: Wer ein viel zu hohes Risiko eingeht und durch reines Glück gewinnt, hält seine Entscheidung rückblickend fälschlicherweise für genial.',
            'Unwissende überschätzen sich besonders stark, und der Anteil von Zufall und Glück am Erfolg wird regelmäßig unterschätzt.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Blinde Flecken suchen',
          description: 'Frage vor dem Urteil aktiv: „Welche Daten fehlen mir hier noch, die meine Sicht komplett drehen würden?“',
        },
        {
          stepNumber: 2,
          title: 'Story von Wahrscheinlichkeit trennen',
          description: 'Lass dich nicht von einer runden Erzählung blenden, sondern prüfe die nüchterne Basis-Wahrscheinlichkeit.',
        },
        {
          stepNumber: 3,
          title: 'Entscheidungstagebuch statt Rückschau',
          description: 'Notiere bei wichtigen Weichenstellungen kurz deine Gründe vorab, um sie später fair am damaligen Wissensstand zu messen.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein gut geplantes Projekt scheitert an einem unvorhersehbaren Ausfall. Im Review heißt es sofort: „Das hätte man doch wissen müssen!“ (Rückschaufehler).',
          betterApproach: 'Ihr trennt sauber zwischen Entscheidungsqualität (was war damals bekannt?) und neu gewonnenen Erkenntnissen für die Zukunft.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du hörst einen begeisterten Erfahrungsbericht eines Bekannten über ein Investment oder eine Kur und hältst den Erfolg sofort für garantiert (Plausibilitäts-Falle).',
          betterApproach: 'Du prüfst nüchtern die echten Wahrscheinlichkeiten und fragst dich, wie viele Gegenbeispiele du gerade nicht siehst.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Unwissenheit einkalkulieren',
          dailyMicroTask: 'Stelle dir einmal täglich bei einer Meinung die Frage: „Was weiß ich hier eigentlich noch nicht?“',
          repeatingReminderPrompt: 'Denkfehler-Check: Behandelst du dein aktuelles Teilwissen gerade so, als wäre es die ganze Wahrheit?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Fragen-Substitutions-Stopp',
          dailyMicroTask: 'Prüfe bei schwierigen Entscheidungen, ob du wirklich die Sachfrage beantwortest oder nur nach Sympathie entscheidest.',
          repeatingReminderPrompt: 'Story-Filter: Klingt die Geschichte nur plausibel – oder sprechen auch die Fakten dafür?',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Langzeit-Erhalt: Prozess-Fairness',
          dailyMicroTask: 'Bewerte Erfolge und Misserfolge der Woche nach der Qualität der Vorbereitung statt nur nach dem Zufallsergebnis.',
          repeatingReminderPrompt: 'Rückschau-Schutz: Urteile heute fair – niemand konnte im Vorfeld wissen, was erst hinterher sichtbar wurde.',
        },
      ],
      extraReflectionQuestions: [
        'Wo hatte ich in letzter Zeit einfach nur Glück und habe es fälschlicherweise als eigene Meisterleistung verbucht?',
        'Welche schwierige Frage in meinem Leben ersetze ich gerade durch eine bequeme Ersatzfrage?',
      ],
      quiz: [
        {
          question: 'Was beschreibt der „Rückschaufehler“ (Hindsight Bias)?',
          options: [
            'Dass man sich an alte Namen schlecht erinnert.',
            'Dass man im Nachhinein seine frühere Einschätzung an das tatsächliche Ergebnis anpasst und glaubt, man hätte es von Anfang an gewusst.',
            'Dass man immer nur in die Vergangenheit schaut.',
          ],
          correctIndex: 1,
          explanation: 'Sobald ein Ergebnis bekannt ist, überschreibt das Gehirn die frühere Unsicherheit und bewertet nur noch den Ausgang statt des Entscheidungsprozesses.',
        },
        {
          question: 'Wie reagiert unser Gehirn typischerweise auf unvollständige Informationen?',
          options: [
            'Es wartet automatisch, bis 100 % aller Daten vorliegen.',
            'Es behandelt die vorhandenen Informationen so, als wären sie vollständig, und bevorzugt eine plausible Geschichte gegenüber echten Wahrscheinlichkeiten.',
            'Es verweigert jede Entscheidung.',
          ],
          correctIndex: 1,
          explanation: 'Eigene Unwissenheit wird im Alltag fast immer unterschätzt, solange sich aus den wenigen Fakten eine stimmige Geschichte bauen lässt.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 7: BIOLOGISCHE FALLEN (ANKER, VERLUST, AUTORITÄT & 21-UHR-REGEL)
  // ==========================================================================
  {
    id: 'mind_mod_biological_traps',
    linkedPlanId: 'plan_mind_clear_decisions',
    linkedDrillIds: ['drill_bias_decision_check'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 2,
    prerequisites: ['mind_mod_cognitive_biases'],
    buildsInto: ['mind_mod_decision_matrix'],
    targetDrivers: ['control', 'please', 'perfection'],
    targetPersonalities: ['logician', 'persister', 'empath', 'doer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Biologische Fallen & die 21-Uhr-Regel',
      subtitle: 'Verlustangst, Ankereffekt, Autoritätsfalle und der richtige Entscheidungs-Moment',
      readingTimeMinutes: 4,
      coreInsight:
        'Die Angst vor Verlust ist biologisch stärker als die Lust auf Gewinn. Zudem manipulieren uns alte Zahlen (Anker), Vorgesetzten-Meinungen, Hunger und späte Uhrzeiten: Triff keine Entscheidungen nach 21 Uhr!',
      quickActionToday:
        'Vertage jede schwierige Entscheidung, die heute nach 21:00 Uhr oder mit leerem Magen auftaucht, konsequent auf den nächsten Morgen.',
      reflectionQuestion:
        'An welchem Projekt oder welcher Gewohnheit hältst du nur deshalb fest, weil du den bisherigen Aufwand nicht als Verlust abschreiben willst?',
      takeawayQuote:
        'Keine Entscheidung mit Hunger, keine Entscheidung nach 21 Uhr – und kein Festhalten an alten Mustern, die heute nicht mehr passen.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die 6 biologischen Entscheidungs-Fallen',
          points: [
            '1. Verlustaversion: Ein drohender Verlust wiegt psychologisch deutlich schwerer als eine gleich hohe Gewinnchance.',
            '2. Anker-Falle: Neue Schätzungen (z. B. das Jahresbudget) kleben unbewusst an alten Zahlen, selbst ohne sachlichen Bezug.',
            '3. Relativitäts- & Sichtbarkeitsfalle: Absolute Zahlen wirken stärker als Relationen; sichtbares Bargeld steuert unser Handeln stärker als abstrakte Kartenzahlungen.',
            '4. Musterfalle: Unser Gehirn liebt schnelle Mustererkennung und stülpt alte Lösungswege über völlig neue Probleme.',
            '5. Autoritätsfalle: Die vermutete Meinung des Vorgesetzten wird vorauseilend in die eigene Entscheidung eingebaut, um nicht anzuecken.',
            '6. Gerechtigkeitsfalle: Objektive und subjektive Fairness weichen voneinander ab – ein „Mehr“ für andere wird nur akzeptiert, wenn auch mehr Risiko oder Anstrengung sichtbar ist.',
          ],
        },
        {
          heading: 'Körperliches Timing: Hunger & Uhrzeit',
          points: [
            'Ernährungsdruck verzerrt Urteile: Ohne Hunger treffen Menschen nachweislich positivere und ausgewogenere Entscheidungen.',
            'No decision after 9pm: Abends ab 21:00 Uhr ist die Willenskraft erschöpft und Sorgen wirken überdimensional – wichtige Entscheidungen gehören in den ausgeruhten Vormittag.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Biologie-Check (Satt & vor 21 Uhr?)',
          description: 'Prüfe deinen körperlichen Zustand: Bist du hungrig, übermüdet oder ist es nach 21 Uhr? Wenn ja -> Entscheidung vertagen.',
        },
        {
          stepNumber: 2,
          title: 'Anker & Autorität ausblenden',
          description: 'Frage dich: „Wie würde ich kalkulieren, wenn ich die Vorjahreszahl und die Wunschmeinung meines Chefs nicht kennen würde?“',
        },
        {
          stepNumber: 3,
          title: 'Verlust-Blickwinkel umdrehen',
          description: 'Prüfe nicht nur, was du bei einer Veränderung verlierst, sondern auch, was es dich kostet, wenn alles beim Alten bleibt.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'In der Budget- oder Projektplanung übernimmt das Team einfach die Werte des Vorjahres plus 5 % (Anker) und passt den Vorschlag an die vermutete Chef-Meinung an (Autoritätsfalle).',
          betterApproach: 'Du lässt das Team zuerst unabhängig vom Vorjahresanker den echten Bedarf schätzen und erst am Ende mit den Rahmenbedingungen abgleichen.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Um 22:30 Uhr führst du übermüdet eine Grundsatzdiskussion über Finanzen oder Erziehung und triffst aus Verlustangst eine vorschnelle Entscheidung.',
          betterApproach: 'Du wendest die 21-Uhr-Regel an: „Lass uns jetzt schlafen und morgen nach dem Frühstück ausgeruht entscheiden.“',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Die 21-Uhr- & Hunger-Sperre',
          dailyMicroTask: 'Triff nach 21:00 Uhr und vor den Mahlzeiten keinerlei Grundsatz- oder Kaufentscheidungen.',
          repeatingReminderPrompt: 'Biologie-Anker: Nach 21 Uhr wird nicht mehr gegrübelt oder entschieden – morgen früh sieht die Welt klarer aus.',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Anker- & Autoritäts-Detektor',
          dailyMicroTask: 'Notiere bei Preis-, Zeit- oder Budgetfragen zuerst deine eigene Zahl auf, bevor du dir die Zahlen anderer ansiehst.',
          repeatingReminderPrompt: 'Unabhängigkeits-Check: Ist das gerade deine eigene Einschätzung oder nur der Anker / die Meinung einer Autorität?',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Langzeit-Erhalt: Muster- & Verlust-Check',
          dailyMicroTask: 'Hinterfrage einmal pro Woche ein altes Routine-Muster: „Würde ich das heute neu starten, wenn ich noch nichts investiert hätte?“',
          repeatingReminderPrompt: 'Muster-Bremse: Wendest du gerade ein altes Muster auf ein neues Problem an – oder hältst du nur aus Verlustangst fest?',
        },
      ],
      extraReflectionQuestions: [
        'Wo mache ich etwas Abstraktes (z. B. digitale Ausgaben oder Zeiteinsatz) für mich wieder greifbar und sichtbar wie Bargeld?',
        'In welchem Meeting habe ich zuletzt meine echte Einschätzung zurückgehalten, um der vermuteten Meinung von oben nicht zu widersprechen?',
      ],
      quiz: [
        {
          question: 'Worin besteht die sogenannte „Autoritätsfalle“ bei Entscheidungen?',
          options: [
            'Dass Führungskräfte immer recht haben.',
            'Dass man die vermutete Meinung des Vorgesetzten vorauseilend verinnerlicht und in die eigene Entscheidung einbaut, um nicht zu widersprechen.',
            'Dass man gar keine Regeln mehr befolgt.',
          ],
          correctIndex: 1,
          explanation: 'Aus biologischem Harmonie- und Sicherheitsstreben passen Menschen ihre Analyse oft unbewusst an die erwartete Haltung Ranghöherer an.',
        },
        {
          question: 'Welche beiden biologischen Grundregeln schützen sofort vor schlechten Alltagsentscheidungen?',
          options: [
            'Immer unter Zeitdruck und möglichst spät nachts entscheiden.',
            'Keine Entscheidungen nach 21:00 Uhr und keine wichtigen Entscheidungen mit Hunger treffen.',
            'Immer den erstbesten Preisanker akzeptieren.',
          ],
          correctIndex: 1,
          explanation: 'Sowohl Ernährungsdruck (Hunger) als auch nächtliche Erschöpfung nach 21 Uhr verzerren die Risikowahrnehmung und Selbstkontrolle.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 8: DIE MULTITASKING-LÜGE & FOKUS-SCHUTZ
  // ==========================================================================
  {
    id: 'mind_mod_multitasking_focus',
    linkedPlanId: 'plan_mind_focus_priorities',
    linkedDrillIds: ['drill_gtd_next_action', 'drill_aerobic_brain_reset'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 1,
    prerequisites: [],
    buildsInto: ['mind_mod_gtd_focus', 'mind_mod_smart_implementation'],
    targetDrivers: ['perfection', 'please', 'endure'],
    targetPersonalities: ['doer', 'rebel', 'logician'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Die Multitasking-Lüge & Fokus-Schutz',
      subtitle: 'Warum ständiges Mail-Checken alle 5 Minuten dein Gehirn erschöpft',
      readingTimeMinutes: 3,
      coreInsight:
        'Zwei Denkaufgaben gleichzeitig gehen nicht („Denken × 2 = Nein“, „Denken + Bewegen = Ja“). Wer alle 5 Minuten Mails prüft, hält sein Gehirn im Dauer-Alarmmodus, verliert Gedächtnisleistung und wird ungeduldig.',
      quickActionToday:
        'Schalte für einen 45-Minuten-Block alle Benachrichtigungen und das Mail-Programm komplett aus und arbeite nur an einem einzigen Thema.',
      reflectionQuestion:
        'Wie oft unterbrichst du dich selbst bei konzentrierter Arbeit durch einen schnellen Blick aufs Handy oder Postfach?',
      takeawayQuote:
        'Echte Entspannung für den Kopf entsteht nicht durch Zehn-Dinge-gleichzeitig, sondern durch konzentriertes Single-Tasking.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Was beim „Multitasking“ wirklich im Gehirn passiert',
          points: [
            'Streng genommen erledigt das Gehirn beim Multitasking keine zwei Denkaufgaben gleichzeitig, sondern der präfrontale Kortex springt im Millisekundentakt zwischen Aufgaben hin und her.',
            'Telefonieren beim Autofahren ist für die Reaktionsfähigkeit gefährlicher als Alkohol; selbst routinierte Fahrer verlieren unter Stress ihre kognitive Kontrolle.',
            'Was hingegen hervorragend funktioniert: Denken + Bewegen (z. B. ein Konzept beim Gehen durchdenken).',
          ],
        },
        {
          heading: 'Die 5-Minuten-Mail-Falle & der Erwartungsmodus',
          points: [
            'Im Schnitt kontrollieren Wissensarbeiter alle 5 Minuten ihre E-Mails auf Neuigkeiten – mit jeweils mindestens 1 Minute direkter Ablenkung und Rüstzeit.',
            'Die Folgen: Das Gehirn bleibt in ständiger Erwartungshaltung, die Aufmerksamkeit sinkt, das Gedächtnis leidet, alles wirkt gleich dringend, und es entsteht Ungeduld sowie Oberflächlichkeit.',
            'Konzentriertes Arbeiten an einer einzigen Aufgabe (Single-Tasking) wirkt dagegen beruhigend und baut Stress ab.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Störquellen für 1 Block kappen',
          description: 'Schließe Mail-Tab und Messenger komplett, statt sie nur im Hintergrund offen zu lassen.',
        },
        {
          stepNumber: 2,
          title: 'Single-Tasking-Fenster setzen',
          description: 'Widme dich für 30 bis 60 Minuten ausschließlich einem klar definierten Thema ohne Wechsel.',
        },
        {
          stepNumber: 3,
          title: 'Kommunikation bündeln',
          description: 'Prüfe und beantworte Nachrichten gebündelt zu festen Zeiten (z. B. 2–3x täglich) statt im 5-Minuten-Takt.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Während eines Online-Meetings tippst du nebenbei E-Mails und liest eine Chat-Nachricht – am Ende weißt du weder, was im Meeting beschlossen wurde, noch ist die Mail fehlerfrei.',
          betterApproach: 'Entweder 100 % präsent im Meeting (und in den letzten Minuten konkrete Next Actions festlegen) oder das Meeting absagen, wenn dein Beitrag nicht nötig ist.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du spielst mit den Kindern oder sprichst mit deinem Partner, schaust aber alle paar Minuten kurz aufs Smartphone – du bist körperlich da, aber mental im Erwartungsmodus.',
          betterApproach: 'Handy außer Sichtweite legen: 30 Minuten ungeteilte Aufmerksamkeit wirken intensiver als 3 Stunden halbherziges Nebeneinander.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Raus aus dem 5-Minuten-Mail-Takt',
          dailyMicroTask: 'Lasse dein E-Mail-Postfach morgens in der ersten Stunde geschlossen und bearbeite zuerst deinen Fokus-Block.',
          repeatingReminderPrompt: 'Fokus-Schutz: Ist dein Postfach gerade zu, damit dein Gehirn aus dem Erwartungsmodus kommt?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Single-Tasking als Entspannung',
          dailyMicroTask: 'Erledige täglich mindestens eine anspruchsvolle Aufgabe im reinen Single-Tasking (0 Tab-Wechsel für 45 Minuten).',
          repeatingReminderPrompt: 'Single-Tasking-Impuls: Denken × 2 = Nein. Gib deinem Kopf heute die Ruhe einer einzigen Aufgabe.',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Langzeit-Erhalt: Präsent im Moment',
          dailyMicroTask: 'Halte 1 Abend pro Woche komplett frei vom Notebook und schalte 30 Minuten vor dem Schlafen TV und Internet ab.',
          repeatingReminderPrompt: 'Präsenz-Anker: Bist du gerade mit voller Aufmerksamkeit bei der einen Sache – oder springt dein Kopf zwischen zehn Tabs?',
        },
      ],
      extraReflectionQuestions: [
        'Welche wiederkehrende Ablenkung stiehlt mir im Alltag die meiste Tiefenkonzentration?',
        'Wie fühlt sich mein Energielevel am Abend an, wenn ich tagsüber konzentriert an wenigen Themen gearbeitet habe statt an zwanzig gleichzeitig?',
      ],
      quiz: [
        {
          question: 'Welche Kombination von gleichzeitigen Tätigkeiten funktioniert für das menschliche Gehirn problemlos?',
          options: [
            'Zwei komplexe Denkaufgaben gleichzeitig (z. B. Bericht schreiben und einem Fachgespräch zuhören).',
            'Denken und moderate Bewegung (z. B. beim Spazierengehen über ein Problem nachdenken).',
            'Alle 5 Minuten zwischen E-Mails, Telefonaten und Konzeptarbeit wechseln.',
          ],
          correctIndex: 1,
          explanation: 'Zwei Denkprozesse blockieren denselben präfrontalen Kortex („Denken × 2 = NO“), während Bewegung und Denken verschiedene Areale nutzen und sich sogar fördern.',
        },
        {
          question: 'Was passiert, wenn man durchschnittlich alle 5 Minuten kurz seine E-Mails oder Nachrichten prüft?',
          options: [
            'Man spart am Ende des Tages viel Zeit.',
            'Das Gehirn bleibt in einem permanenten Erwartungsmodus, wodurch Aufmerksamkeit, Gedächtnisleistung und Priorisierungsfähigkeit sinken.',
            'Man wird automatisch kreativer.',
          ],
          correctIndex: 1,
          explanation: 'Ständige Mikro-Unterbrechungen verhindern Tiefenkonzentration und erzeugen chronische Ungeduld sowie geistige Erschöpfung.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 9: DER 7-SCHRITTE-ENTSCHEIDUNGSPROZESS & LEBENS-KOMPASS
  // ==========================================================================
  {
    id: 'mind_mod_decision_matrix',
    linkedPlanId: 'plan_mind_clear_decisions',
    linkedDrillIds: ['drill_bias_decision_check', 'drill_circle_of_influence'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 3,
    prerequisites: ['mind_mod_cognitive_biases', 'mind_mod_biological_traps'],
    buildsInto: [],
    targetDrivers: ['control', 'perfection', 'please'],
    targetPersonalities: ['logician', 'persister', 'dreamer', 'empath'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Souverän entscheiden & Dein Lebens-Kompass',
      subtitle: 'Der 7-Schritte-Prozess für schwere Weichenstellungen und ein Leben ohne Reue',
      readingTimeMinutes: 4,
      coreInsight:
        'Vermiedene Entscheidungen erzeugen Dauerstress. Wer Szenarien, eigene Motive und einen Plan B klärt, eine Nacht darüber schläft und sich an seinen Lebenswerten orientiert, entscheidet schnell und ruhig.',
      quickActionToday:
        'Nimm eine aufgeschobene Entscheidung, kläre in 3 Stichpunkten den schlimmsten Fall inklusive Plan B, schlafe eine Nacht darüber und entscheide morgen Vormittag.',
      reflectionQuestion:
        'Wenn du dir vorstellst, du hast noch rund 2.000 Samstage im Leben: Bringt dich deine aktuelle Richtung dorthin, wo du wirklich sein willst?',
      takeawayQuote:
        'Triff Entscheidungen bewusst – auch ein bewusstes Nein ist ein bewusstes Ja zu deinen wahren Zielen.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Der 7-Schritte-Ablauf für sichere Entscheidungen',
          points: [
            '1. Szenarien-Übersicht: Verschiedene Varianten und deren konkrete Folgen durchspielen.',
            '2. Versteckte Motive klären: Welcher Wunsch steckt eigentlich dahinter (Wunsch nach Anerkennung, nach Ruhe, nach Sicherheit oder Macht)?',
            '3. Pro & Kontra schriftlich gegenüberstellen.',
            '4. Informationslücken prüfen: Was fehlt noch, was sollte man vorab noch herausfinden?',
            '5. Eine Nacht darüber schlafen, um akute Emotionen abzukühlen.',
            '6. Plan B definieren: Welche Alternativen gibt es, falls sich die Entscheidung im Nachhinein als falsch herausstellt?',
            '7. Zügig entscheiden: Sobald das Notwendige bekannt ist, entschlossen ins Handeln gehen.',
          ],
        },
        {
          heading: 'Memento Mori, Leitbild & Was Menschen am Ende bereuen',
          points: [
            'Vor dem Tod bereuen Menschen am häufigsten: Nicht den eigenen Träumen gefolgt zu sein (Leben nach Erwartungen anderer), zu viel gearbeitet zu haben, Gefühle/Liebe nicht ausgedrückt zu haben, Groll mitgetragen zu haben (statt für den eigenen Seelenfrieden zu vergeben) und sich Glück nicht erlaubt zu haben.',
            'Zeit-Anker: Zähle deine verbleibenden Samstage (z. B. ~2.000) und setze dich einmal im Quartal allein hin, um zu prüfen, ob du auf diesem Weg weitergehen willst.',
            'Leitbild & Rollen: Visualisiere deine eigene Grabrede (Wofür stehst du? Welche Rollen als Partner, Elternteil, Freund, Kollege sind dir zentral?) und teile dein Leitbild mit deinen wichtigsten Menschen.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Wunsch & Szenarien aufdecken',
          description: 'Schreibe die Optionen mit ihren Folgen auf und benenne ehrlich dein Hauptmotiv (Ruhe, Anerkennung, Wachstum).',
        },
        {
          stepNumber: 2,
          title: 'Fehlende Infos + Plan B sichern',
          description: 'Hole die letzte fehlende Kerninfo ein und lege fest, wie du gegensteuerst, falls die Wahl falsch war.',
        },
        {
          stepNumber: 3,
          title: '1 Nacht schlafen -> Entscheiden',
          description: 'Nach einer Nacht Abstand wird am nächsten Morgen ohne weiteres Grübeln entschieden und gehandelt.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Du zögerst wochenlang bei einer Stellen- oder Projektentscheidung, weil du 100 % Sicherheit suchst (Antreiber „Behalte Kontrolle!“).',
          betterApproach: 'Du durchläufst die 7 Schritte, erkennst deinen Plan B (im schlimmsten Fall Rückkehr oder Kurskorrektur nach 6 Monaten) und triffst nach einer Nacht Schlaf die klare Wahl.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Ihr lebt im Alltagstrott nur noch organisatorisch nebeneinander her und schiebt gemeinsame Träume auf „irgendwann später“.',
          betterApproach: 'Beim Quartals-Check-in nehmt ihr euch Zeit für euer gemeinsames Leitbild und plant aktiv gemeinsame Erlebnisse ein, auf die ihr euch freut.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Kleine Entscheidungen beschleunigen',
          dailyMicroTask: 'Triff Alltagsentscheidungen sofort nach kurzem Nutzen/Aufwand-Check; schlafe bei großen Themen exakt 1 Nacht darüber.',
          repeatingReminderPrompt: 'Entscheidungs-Impuls: Fehlen dir wirklich noch Fakten – oder zögerst du nur, obwohl alles Notwendige bekannt ist?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Rollen- & Reue-Audit',
          dailyMicroTask: 'Bewerte deine Zufriedenheit in deinen wichtigsten Lebensrollen (Partner, Familie, Beruf, Freund) und setze 1 bewusste Handlung für Beziehung & Freude.',
          repeatingReminderPrompt: 'Lebens-Kompass: Lebst du heute miteinander statt nur nebeneinander – und erlaubst du dir Freude auf dem Weg?',
        },
        {
          stageLabel: 'Woche 3 (Tag 15–21) & Quartals-Erhalt: Der 2.000-Samstage-Check',
          dailyMicroTask: 'Nimm dir 15 Minuten in Stille: Prüfe, ob dein aktueller Zeiteinsatz deinen langfristigen Prinzipien entspricht, und lass alten Groll los.',
          repeatingReminderPrompt: 'Quartals- & Wochen-Anker: Wenn du auf diesen Tag zurückblickst – hast du nach deinen eigenen Werten oder nach fremden Erwartungen gelebt?',
        },
      ],
      extraReflectionQuestions: [
        'Welchen alten Groll trage ich noch mit mir herum, obwohl mir Vergebung vor allem meinen eigenen inneren Frieden zurückgeben würde?',
        'Welche regelmäßige Handlung, die ich ab heute setze, bringt meiner Zukunft den größtmöglichen positiven Output?',
      ],
      quiz: [
        {
          question: 'Warum gehört zum 7-Schritte-Entscheidungsprozess die Frage nach den „dahinterliegenden Wünschen“ (z. B. Anerkennung, Ruhe, Macht)?',
          options: [
            'Damit man anderen die Schuld geben kann.',
            'Weil uns oft unbewusste emotionale Motive steuern – erst wenn wir sie kennen, können wir prüfen, ob die Option dieses Bedürfnis überhaupt erfüllt.',
            'Weil Fakten bei Entscheidungen keine Rolle spielen.',
          ],
          correctIndex: 1,
          explanation: 'Klarheit über die eigenen Antreiber und Bedürfnisse verhindert, dass wir aus falschen Motiven (z. B. reinem Prestigedenken) gegen unsere Lebensqualität entscheiden.',
        },
        {
          question: 'Was hilft im Entscheidungsprozess am besten gegen die Angst, einen Fehler zu machen?',
          options: [
            'Auf 100 % Sicherheit warten und gar nicht entscheiden.',
            'Vorab einen konkreten Plan B (Alternativen bei Fehlentscheidung) durchdenken, eine Nacht darüber schlafen und dann schnell entscheiden.',
            'Die Entscheidung immer auf andere abschieben.',
          ],
          correctIndex: 1,
          explanation: 'Wer weiß, wie er im Fall eines Irrtums korrigieren kann, verliert die Lähmung und gewinnt Handlungssicherheit.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 10: VOM VORSATZ ZUR TAT (SMART, WENN-DANN-PLÄNE & „DO IT BAD FIRST“)
  // ==========================================================================
  {
    id: 'mind_mod_smart_implementation',
    linkedPlanId: 'plan_mind_focus_priorities',
    linkedDrillIds: ['drill_gtd_next_action'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 2,
    prerequisites: ['mind_mod_multitasking_focus'],
    buildsInto: [],
    targetDrivers: ['perfection', 'endure'],
    targetPersonalities: ['dreamer', 'rebel', 'logician', 'doer'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Umsetzungskraft: „Do it bad first“ & Wenn-Dann-Pläne',
      subtitle: 'Wie du Perfektionismus-Blockaden sprengst und Ziele im Alltag verankerst',
      readingTimeMinutes: 3,
      coreInsight:
        'Wenn du etwas aufschiebst, weil es noch nicht perfekt wird: Mach den ersten Entwurf bewusst schlecht („Do it bad first“)! Kombiniere klare SMART-Ziele mit „Wenn-X-dann-Y“-Plänen und 30 Minuten täglichem Lernen.',
      quickActionToday:
        'Starte eine aufgeschobene Aufgabe heute mit dem ausdrücklichen Ziel, in 10 Minuten eine „unperfekte Rohversion“ aufzuschreiben.',
      reflectionQuestion:
        'Was würde die Person, die du in einem Jahr sein möchtest, heute ganz konkret tun, um deinem Ziel einen Schritt näherzukommen?',
      takeawayQuote:
        'Man produziert nur dann keinen Ausschuss, wenn man gar nichts produziert – starte unperfekt und bleib täglich in Bewegung.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'SMART-Ziele & die „Do it bad first“-Regel',
          points: [
            'SMART definieren: Specific (echte Zahlen statt „mehr Erfolg“), Measurable (messbar), Attainable (herausfordernd, aber machbar), Realistic (ehrlich zu Ressourcen und Hürden), Time-bound (feste Deadline statt „irgendwann“).',
            'Perfektionismus-Bremse lösen: Wenn du etwas hinauszögerst, weil es nicht gut genug scheint, mach es zuerst schlecht – korrigieren lässt sich nur etwas, das bereits existiert.',
            'Zinseszins des Lernens:Schon ½ Stunde tägliches Training in einem Fachgebiet führt über die Zeit zu profundem Expertenwissen; 10 Minuten tägliche Bewegung halten das Momentum aufrecht.',
          ],
        },
        {
          heading: 'Implementation Intentions (Wenn-Dann) & Coping Plans',
          points: [
            'Ein Vorsatz ohne Wann und Wo bleibt ein Wunsch: Lege eine spezifische Zeit und einen Auslöser fest („Wenn Situation X eintritt, dann mache ich Y“).',
            'Coping Plans (Plan B): Überlege dir vorab eine Ausweich-Variante für den Fall, dass dein ursprünglicher Zeitplan durch den Alltag durchkreuzt wird.',
            'Ein guter Plan sagt dir nicht nur, was du tun willst, sondern auch klar, was du nicht mehr tun willst.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Ziel SMART aufschreiben & visualisieren',
          description: 'Fixiere schriftlich, was konkret verbessert wird, wer davon profitiert und bis wann es messbar steht.',
        },
        {
          stepNumber: 2,
          title: 'Wenn-Dann-Anker + Plan B (Coping Plan) bauen',
          description: 'Formuliere: „Immer wenn [Auslöser], mache ich [Schritt]“ – plus: „Falls [Störung] dazwischenkommt, weiche ich auf [Kurzvariante] aus.“',
        },
        {
          stepNumber: 3,
          title: 'Mit Rohversion starten („Do it bad first“)',
          description: 'Gehe sofort in die erste Aktivität (Prototyp/Entwurf), statt endlos in der Theorie zu planen.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Du willst ein neues Konzept oder Tool bauen, wartest aber seit Wochen auf den „perfekten freien Nachmittag“, um es direkt fehlerfrei aufzusetzen.',
          betterApproach: 'Du nutzt „Do it bad first“: In 15 Minuten skizzierst du einen groben Prototypen und holst dir frühzeitig Feedback.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Dein 45-Minuten-Lauf fällt komplett aus, weil ein Termin länger gedauert hat – dadurch reißt deine gesamte Wochenroutine ab.',
          betterApproach: 'Dein Coping Plan (Plan B) greift: „Wenn ich abends keine 45 Minuten Zeit habe, mache ich mindestens 10 Minuten Bewegung oder Kräftigung zu Hause.“',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Der 10-Minuten-Rohbau („Do it bad first“)',
          dailyMicroTask: 'Überwinde tägliches Aufschieben, indem du dir für den Start ausdrücklich eine unperfekte 10-Minuten-Skizze erlaubst.',
          repeatingReminderPrompt: 'Start-Impuls: Warte nicht auf Perfektion – mach heute in 10 Minuten den ersten unperfekten Entwurf!',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Wenn-Dann-Ketten & Coping Plan',
          dailyMicroTask: 'Kombiniere deine wichtigste Gewohnheit fest mit einem Alltags-Trigger („Wenn X, dann Y“) und halte deinen 10-Minuten-Notfallplan bereit.',
          repeatingReminderPrompt: 'Plan-B-Anker: Auch wenn der Tag anders lief als geplant – welche 10-Minuten-Minimalvariante hält dein Momentum heute am Leben?',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Tägliches Momentum',
          dailyMicroTask: 'Investiere täglich einen kleinen Block (10–30 Minuten) in deine Weiterentwicklung oder dein Kernziel – Langzeitziel vor Kurzzeit-Bequemlichkeit.',
          repeatingReminderPrompt: 'Momentum-Check: Welche kleine Handlung tut heute die Person, die du in Zukunft sein willst?',
        },
      ],
      extraReflectionQuestions: [
        'Welches meiner aktuellen Ziele ist noch ein vager Wunsch („mehr Sport“, „besser organisieren“) statt wirklich SMART und terminiert?',
        'Wie lautet mein konkreter Coping Plan (Plan B), wenn meine Woche durch Krankheit, Kinder oder Arbeitsdruck voll wird?',
      ],
      quiz: [
        {
          question: 'Wofür steht ein „Coping Plan“ bei der Umsetzung von Gewohnheiten und Zielen?',
          options: [
            'Für das Aufgeben eines Ziels beim ersten Hindernis.',
            'Für einen vorab festgelegten Plan B (Ausweichplan), damit man die Gewohnheit zu einer anderen Zeit oder in kleinerer Form trotzdem durchführt, wenn sich der Tagesplan ändert.',
            'Für eine Liste von Ausreden.',
          ],
          correctIndex: 1,
          explanation: 'Wer vorab plant, wie er auf Störungen reagiert (z. B. 10 Minuten Kurztraining statt Komplettausfall), bricht seine Gewohnheitskette nicht ab.',
        },
        {
          question: 'Welche Strategie hilft sofort, wenn man eine Aufgabe aus Perfektionismus immer weiter hinausschiebt?',
          options: [
            '„Do it bad first“ – bewusst mit einer unperfekten Rohversion starten, da man nur Vorhandenes verbessern kann.',
            'Noch drei Wochen länger recherchieren.',
            'Warten, bis man zu 100 % motiviert ist.',
          ],
          correctIndex: 0,
          explanation: 'Nur Aktivität bringt Fortschritt – ein schneller Prototyp oder Rohentwurf nimmt dem Gehirn die Startangst.',
        },
      ],
    },
  },
];

  const MIND_CONTENT_PACKAGE_C = [
  // ==========================================================================
  // MODUL 11: FRAGETECHNIK & TAKTISCHE VERHANDLUNG
  // ==========================================================================
  {
    id: 'mind_mod_question_negotiation',
    linkedPlanId: 'plan_mind_leadership_communication',
    linkedDrillIds: ['drill_no_why_questions'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 2,
    prerequisites: [],
    buildsInto: ['mind_mod_responsibility_delegation', 'mind_mod_personality_relationships'],
    targetDrivers: ['control', 'independent', 'please'],
    targetPersonalities: ['doer', 'logician', 'persister', 'empath'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Fragetechnik & Taktische Verhandlung',
      subtitle: 'Wie du ohne „Warum“-Fragen führst, spiegelst und souverän verhandelst',
      readingTimeMinutes: 4,
      coreInsight:
        '„Warum“-Fragen drängen Menschen in die Rechtfertigung, Suggestivfragen wirken dominant. Wer die letzten 2–3 Wörter spiegelt, Emotionen benennt und offene „Wie/Was“-Fragen oder die Wunderfrage nutzt, öffnet jedes Gespräch.',
      quickActionToday:
        'Streiche heute das Wort „Warum“ aus deinen Gesprächen und nutze stattdessen einmal die Frage: „Was genau ist dir an diesem Punkt besonders wichtig?“',
      reflectionQuestion:
        'In welchem Gespräch versuchst du gerade durch Argumente zu gewinnen, statt dein Gegenüber durch kluge Fragen selbst auf die Lösung kommen zu lassen?',
      takeawayQuote:
        'Frage einen Satz mehr, bevor du antwortest – und halbiere im Zweifel deine eigene Redezeit.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die 4 Erfolgsfaktoren & 2 Tabus der Fragetechnik',
          points: [
            'Gute Fragen schaffen Wertschätzung, liefern relevante Infos, fördern eigene Lösungen beim Gegenüber und räumen Missverständnisse vorab aus.',
            'Tabu 1 – Keine WARUM-Fragen („Warum haben Sie das so gemacht?“): Wirkt anklagend und wenig verständnisvoll.',
            'Tabu 2 – Keine Suggestivfragen („Sie sind doch sicher auch der Meinung, dass…“): Wirkt dominant und blockiert echte Offenheit.',
            'Einfühlende Fragen: Problemorientiert („Was wurde bisher unternommen?“), Paraphrasierend („Habe ich richtig verstanden, Sie meinen…?“), Verbalisierend („Wie fühlt sich das für Sie an?“), Skalierend („Auf einer Skala von 1 bis 10…“).',
            'Fordernde & lösungsorientierte Fragen: Zielorientiert („Woran erkennen Sie, dass das Ziel erreicht ist?“), Ressourcenorientiert („Was würde ein guter Freund raten? Wann trat das Problem nicht auf?“), Hypothetische Wunderfrage („Angenommen, das Problem wäre über Nacht gelöst – was wäre morgen Ihr erster Schritt?“).',
          ],
        },
        {
          heading: 'Psychologie-Hacks für Verhandlungen (Never Split the Difference)',
          points: [
            'Mirroring & Labeling: Wiederhole ruhig die letzten 2–3 Schlüsselwörter und spiegle die wahrgenommene Emotion („Es wirkt, als wäre Ihnen Punkt X besonders wichtig…“).',
            'Die Macht des „Nein“ & „Das stimmt“: Eine Frage, auf die das Gegenüber „Nein“ sagen darf, gibt ihm Kontrolle und Sicherheit. Ein ehrliches „Das stimmt“ nach einer Zusammenfassung schafft echten Rapport (während ein bloßes „Ja“ oft nur Abwimmeln ist).',
            'Kalibrierte Fragen: „Wie soll ich das umsetzen?“, „Was hat uns in diese Situation gebracht?“, „Wie können wir das gemeinsam lösen?“',
            'Zahlen-Psychologie: Nenne bei Preisen nie als Erster den Wert. Nutze eine Range (deren unterer Wert über deinem Ziel liegt) und krumme, genaue Zahlen (wirken präzise durchkalkuliert).',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Spiegeln & Verstehen sichern',
          description: 'Wiederhole die letzten 2–3 Wörter oder paraphrasiere die Sicht des anderen, bis du ein überzeugtes „Das stimmt“ erhältst.',
        },
        {
          stepNumber: 2,
          title: 'Vom Problem zur Skalierung',
          description: 'Frage nach der Einschätzung auf einer Skala von 1–10 und was es für +2 Punkte bräuchte.',
        },
        {
          stepNumber: 3,
          title: 'Wunderfrage oder Kalibrierte „Wie“-Frage stellen',
          description: 'Übergib das Nachdenken durch „Wie können wir das lösen?“ oder „Was wäre morgen anders, wenn das Problem über Nacht gelöst wäre?“',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein Lieferant oder Kollege stellt eine überzogene Forderung, und du gehst sofort in den direkten Gegenangriff.',
          betterApproach: 'Du spiegelst ruhig seine Sorge, holst ein „Das stimmt“ ab und fragst kalibriert: „Wie soll ich das unter diesen Budgetvorgaben konkret darstellen?“',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Zu Hause herrscht dicke Luft, und du fragst genervt: „Warum sagst du denn nicht gleich, was los ist?“',
          betterApproach: 'Du nutzt eine verbalisierende Frage: „Für mich fühlt es sich an, als wäre der Tag heute extrem anstrengend für dich gewesen – wie geht es dir gerade?“',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Das „Warum“-Fasten & Paraphrasieren',
          dailyMicroTask: 'Ersetze jedes „Warum“ durch „Was/Wie“ und sichere in 1 Gespräch täglich das Verständnis mit „Habe ich richtig verstanden, dass…?“ ab.',
          repeatingReminderPrompt: 'Frage-Impuls: Keine Warum-Fragen heute! Frag nach dem „Wie“ oder „Was“ und höre aktiv zu.',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Mirroring & Emotionen spiegeln',
          dailyMicroTask: 'Wiederhole in Gesprächen bewusst die letzten 2–3 Schlüsselwörter deines Gegenübers und benenne seine Emotion wertfrei.',
          repeatingReminderPrompt: 'Rapport-Anker: Spiegle zuerst das Gefühl und die Sicht deines Gegenübers, bis du ein „Das stimmt“ hörst.',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Wunderfrage & Kalibrierung',
          dailyMicroTask: 'Setze bei festgefahrenen Themen gezielt die Wunderfrage, Skalierungsfragen (+2 Stufen) oder „Wie soll ich das tun?“ ein.',
          repeatingReminderPrompt: 'Gesprächs-Meisterschaft: Stelle heute eine Frage mehr, bevor du antwortest, und halbiere deine eigene Textmenge.',
        },
      ],
      extraReflectionQuestions: [
        'Bei welchem Thema kann ich mir heute selbst die Ressourcenfrage stellen: „Was würde mir ein kluger Freund in dieser Lage raten?“',
        'Wo sage ich in Verhandlungen zu schnell „Ja“, statt über eine ruhige „Wie“-Frage die Grenzen auszuloten?',
      ],
      quiz: [
        {
          question: 'Warum sollte man in Führung und Alltag auf „Warum“-Fragen („Warum haben Sie das so gemacht?“) verzichten?',
          options: [
            'Weil sie grammatikalisch falsch sind.',
            'Weil sie wenig verständnisvoll wirken und das Gegenüber sofort in eine defensive Rechtfertigungshaltung drängen.',
            'Weil sie zu kurz sind.',
          ],
          correctIndex: 1,
          explanation: '„Warum“-Fragen nach Fehlern suchen nach Schuld in der Vergangenheit, während „Wie“- und „Was“-Fragen den Blick auf die Lösung richten.',
        },
        {
          question: 'Was ist das Besondere an der hypothetischen „Wunderfrage“ („Angenommen, das Problem wäre über Nacht verschwunden – was wäre das Erste, was Sie morgen tun würden?“)?',
          options: [
            'Sie lenkt vom Thema ab.',
            'Die Antwort nennt fast immer exakt den nächsten konkreten Handlungsschritt, mit dem man schon heute starten kann.',
            'Sie funktioniert nur bei Kindern.',
          ],
          correctIndex: 1,
          explanation: 'Indem die mentale Blockade kurz ausgeblendet wird, erkennt das Gehirn sofort die erste sichtbare Handlung in Richtung Zielzustand.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 12: DAS 3-SCHRITTE-VERANTWORTUNGSGESPRÄCH & 5 STUFEN DER DELEGATION
  // ==========================================================================
  {
    id: 'mind_mod_responsibility_delegation',
    linkedPlanId: 'plan_mind_leadership_communication',
    linkedDrillIds: ['drill_mother_of_all_questions'],
    subCategory: 'Selbstmanagement & Fokus',
    level: 3,
    prerequisites: ['mind_mod_question_negotiation'],
    buildsInto: [],
    targetDrivers: ['independent', 'control', 'perfection'],
    targetPersonalities: ['doer', 'logician', 'persister', 'empath'],
    lifeAreas: ['beruf', 'familie'],

    compactCard: {
      title: 'Verantwortungsgespräch & Richtig Delegieren',
      subtitle: 'Mit 3 Schritten, der „Mutter aller Fragen“ und 5 Delegationsstufen führen',
      readingTimeMinutes: 4,
      coreInsight:
        'Nimm anderen das Denken nicht ab! Führe in 3 Schritten (1. Selbsteinschätzung, 2. Persönlicher Nutzen, 3. „Was genau werden Sie tun?“ + Pause!) und kläre beim Delegieren immer Ziele, Nicht-Ziele und Holzwege.',
      quickActionToday:
        'Wenn heute jemand mit einem Problem zu dir kommt, stelle die „Mutter aller Fragen“: „Was genau wirst du tun, um das zu lösen?“ – und schweige danach mindestens 10 Sekunden lang!',
      reflectionQuestion:
        'Welche Aufgabe erledigst du aktuell noch selbst oder nimmst sie als Rückdelegation wieder an, obwohl der Ball eigentlich bei jemand anderem liegt?',
      takeawayQuote:
        'Wer nach einer Frage die Stille nicht aushält, nimmt dem anderen die Verantwortung und die Chance zu wachsen.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Das 3-Schritte-Ablaufdiagramm für Verantwortungsgespräche',
          points: [
            'Schritt I – Problemdefinition: Thema benennen und um Selbsteinschätzung bitten („Wie sehen Sie da im Moment Ihre Leistung?“). Beharrt das Gegenüber darauf, alles sei perfekt, erst sanft („Genügt der Stand?“), dann schärfer („Läuft alles 100 % perfekt?“) hinterfragen. Bei Einsicht für die Selbstkritik loben und konkretisieren lassen; bei totalem Beharren Wechsel zur klaren Ich-Botschaft („Das sehe ich anders – Folgendes müssen Sie verbessern…“).',
            'Schritt II – Motivationslage & Nutzen klären: Nach Gründen fragen (echten Hilfebedarf unterstützen, Ausreden nicht durchgehen lassen). Danach den Sinn erfragen („Weshalb gibt es diese Aufgabe/Regel?“) und Brücken bauen, bis der andere seinen persönlichen Nutzen erkennt (loben!).',
            'Schritt III – Lösung & „Mutter aller Fragen“: Fragen: „Prima. Was genau werden Sie also tun, um das Problem zu lösen?“ PLUS: PAUSE! Fällt nichts ein -> Pause ruhig verlängern oder auf morgen früh vertagen. Kommt eine untaugliche Idee -> durch räumliche („Was passiert in der Nachbarabteilung?“) oder zeitliche („Was passiert in einem halben Jahr?“) Fragen den Denkfehler selbst erkennen lassen. Gute Lösung loben, zusammenfassen lassen, schriftlich festhalten. Kommt auch am Folgetag nichts -> Diagnose: Kann nicht (beibringen!) vs. Will nicht (falsche Position!).',
          ],
        },
        {
          heading: 'Die 5 Stufen der Delegation & Rückdelegation vermeiden',
          points: [
            'Stufe 1: Detailbeschreibung & To-dos vorgeben | Stufe 2: Aufgabe mit detaillierter Vorstellung übergeben | Stufe 3: Mitarbeiter bereitet vor, Entscheidung gemeinsam | Stufe 4: Mitarbeiter erledigt selbst und informiert | Stufe 5: Vollständige Delegation im eigenen Ermessen.',
            'Rahmen vorab klären: Der Empfänger muss das Ziel selbst sehen und beschreiben können. Kläre Richtlinien, Ressourcen, Zeitrahmen, Ziele, Nicht-Ziele sowie bereits bekannte Fallen und Holzwege.',
            'Psychologische Sicherheit: Führung bedeutet, in der ersten Reihe sichtbar den Kopf für das Team hinzuhalten (Schutzfunktion) – das weckt Mut und Eigeninitiative.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Selbsteinschätzung & eigenen Nutzen wecken (Schritt I & II)',
          description: 'Lass das Gegenüber den Stand selbst bewerten und herausarbeiten, welchen Vorteil es selbst hat, wenn die Aufgabe gut läuft.',
        },
        {
          stepNumber: 2,
          title: '„Mutter aller Fragen“ + Pause aushalten (Schritt III)',
          description: 'Frage: „Was genau wirst du tun, um das zu lösen?“ und warte geduldig ab, bis ein durchdachter eigener Vorschlag kommt.',
        },
        {
          stepNumber: 3,
          title: 'Mit Ziele/Nicht-Ziele-Rahmen übergeben',
          description: 'Lass das Gegenüber kurz zusammenfassen, was es ab heute anders macht, und vereinbare einen klaren Zeitpunkt für das nächste kurze Update.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein Mitarbeiter präsentiert einen unbrauchbaren Lösungsvorschlag. Du korrigierst ihn sofort selbst und diktierst ihm die richtige Lösung.',
          betterApproach: 'Du stellst eine zeitliche/räumliche Folgenfrage: „Wenn wir das so machen – was passiert dann in 6 Monaten bei der Abrechnung?“ Er erkennt den Fehler selbst, du lobst ihn dafür und lässt ihn die Lösung anpassen.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du übernimmst zu Hause alle Planungsaufgaben allein, weil du denkst, die anderen denken ohnehin nicht an die Details.',
          betterApproach: 'Du übergibst einen kompletten Verantwortungsbereich (inkl. Ziel, Zeitrahmen und bekannten Stolperfallen) und fragst: „Wie möchtest du das für dich planen?“',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): „Wer hat den Ball?“ & Pause halten',
          dailyMicroTask: 'Beantworte Rückdelegationen mit „Wie würdest du es lösen?“ und halte nach der „Mutter aller Fragen“ konsequent die Gesprächspause aus.',
          repeatingReminderPrompt: 'Pausen-Anker: Nach der Frage „Was genau wirst du tun?“ gehört das Schweigen dir – lass den anderen denken!',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Ziele, Nicht-Ziele & Holzwege klären',
          dailyMicroTask: 'Nenne bei jeder Aufgabenübergabe explizit: 1. Das Ziel, 2. Das Nicht-Ziel, 3. Bekannte Fallen/Holzwege, 4. Die Deadline.',
          repeatingReminderPrompt: 'Delegations-Check: Weiß dein Gegenüber nicht nur, was das Ziel ist, sondern auch, was ausdrücklich NICHT das Ziel ist?',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Das 3-Schritte-Gespräch',
          dailyMicroTask: 'Führe Kritik- und Entwicklungsgespräche strikt über Selbsteinschätzung -> persönlichen Nutzen -> eigenen Lösungsvorschlag.',
          repeatingReminderPrompt: 'Führungs-Impuls: Lobe heute ehrliche Selbstkritik und hilf durch zeitliche/räumliche Fragen beim Selbsterkennen von Fehlern.',
        },
      ],
      extraReflectionQuestions: [
        'Bei welchem Teammitglied oder Familienmitglied sollte ich von Delegationsstufe 1–2 endlich auf Stufe 3 oder 4 hochschalten?',
        'Habe ich bei meinem letzten schwierigen Gespräch geprüft, ob die Person den persönlichen Nutzen der Regel überhaupt verstanden hat?',
      ],
      quiz: [
        {
          question: 'Was tut man im 3-Schritte-Gespräch, wenn das Gegenüber auf die „Mutter aller Fragen“ („Was genau werden Sie tun?“) eine Lösung vorschlägt, die nichts taugt?',
          options: [
            'Man bricht das Gespräch sofort ab und macht es selbst.',
            'Man stellt gezielte Fragen nach den räumlichen („Was passiert in der Nachbarabteilung?“) oder zeitlichen („Was passiert in einem halben Jahr?“) Auswirkungen, damit die Person den Denkfehler selbst erkennt.',
            'Man ignoriert den Fehler und lobt trotzdem.',
          ],
          correctIndex: 1,
          explanation: 'Durch räumliche und zeitliche Konsequenzfragen erkennt das Gegenüber die Schwachstelle selbst, behält die Verantwortung und lernt für die Zukunft dazu.',
        },
        {
          question: 'Welche Informationen gehören neben dem eigentlichen Ziel zwingend zu einer sauberen Aufgaben-Delegation?',
          options: [
            'Nur ein Zuruf zwischen Tür und Angel ohne Zeitrahmen.',
            'Richtlinien, Ressourcen, Zeitrahmen/Beurteilungskriterien, Nicht-Ziele sowie bereits bekannte Fallen und Holzwege.',
            'Eine Liste aller Fehler aus dem letzten Jahr.',
          ],
          correctIndex: 1,
          explanation: 'Erst wenn Rahmen, Nicht-Ziele und bekannte Sackgassen transparent sind, kann der Empfänger die Aufgabe sicher und selbstständig ins Ziel bringen.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 13: 6 PERSÖNLICHKEITSTYPEN, LEBENSMOTIVE & STARKE BEZIEHUNGEN
  // ==========================================================================
  {
    id: 'mind_mod_personality_relationships',
    linkedPlanId: 'plan_mind_leadership_communication',
    linkedDrillIds: ['drill_no_why_questions', 'drill_name_the_emotion'],
    subCategory: 'Mentales Training & Resilienz',
    level: 2,
    prerequisites: ['mind_mod_question_negotiation'],
    buildsInto: [],
    targetDrivers: ['please', 'control', 'perfection'],
    targetPersonalities: ['logician', 'persister', 'dreamer', 'empath', 'doer', 'rebel'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Menschen lesen & Starke Beziehungen',
      subtitle: 'Die 6 Persönlichkeitstypen, 16 Lebensmotive und die 70/30-Beziehungsregel',
      readingTimeMinutes: 4,
      coreInsight:
        'Jeder Mensch funkt auf einem anderen Kanal (Denken, Fühlen oder Handeln) und hat eigene Grundbedürfnisse. In Beziehungen gilt: Miteinander statt nebeneinander leben, 70 % Wertschätzung als Basis für 30 % Kritik und auf Verhalten statt auf Ausreden achten.',
      quickActionToday:
        'Überlege dir für eine wichtige Person in deinem Alltag, welches Grundbedürfnis (z. B. Anerkennung für Leistung, Meinung, Harmonie, Ruhe, Mut oder Freiraum) sie hat, und gib ihr heute genau auf diesem Kanal positives Feedback.',
      reflectionQuestion:
        'Wo erwartest du von deinem Partner, Kind oder Kollegen unbewusst, dass er genauso tickt wie du – statt sein eigenes Grundbedürfnis zu respektieren?',
      takeawayQuote:
        'Vergib zweimal von ganzem Herzen – beim dritten Mal glaube dem Verhaltensmuster, nicht der Erklärung.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Die 6 Persönlichkeitstypen & ihre Stressmuster',
          points: [
            '1. Logiker (Analytiker | Kanal: Denken): Braucht Anerkennung für Leistung & Wissen, liebt Daten/Struktur. Stress: Perfektionismus, Überkontrolle. Frage: „Was denkst du, klingt das logisch?“',
            '2. Beharrer (Werteorientiert | Kanal: Denken): Braucht Anerkennung für Meinung, Erfahrung & Regeln. Stress: Misstrauen, unbeugsames Beharren. Frage: „Wie siehst du das aus deiner Erfahrung?“',
            '3. Träumer (Ruhig | Kanal: Handeln/Denken): Braucht Zugehörigkeit trotz Distanz, Ruhe & klare To-dos. Stress: Passivität, innerer Rückzug. Frage: „Zu welchem Schluss kommst du?“',
            '4. Empathiker (Einfühlsam | Kanal: Fühlen): Braucht Bestätigung als Person, Harmonie & Nähe. Stress: Überanpassung, allen recht machen, Opferhaltung. Frage: „Was ist dir dabei menschlich wichtig?“',
            '5. Macher (Aktiv | Kanal: Handeln): Braucht Bewunderung für Mut, Tempo & Ergebnisse. Stress: Ungeduld, Druck, Grenzen überschreiten. Frage: „Wie starten wir am schnellsten?“',
            '6. Rebell (Kreativ | Kanal: Handeln/Fühlen): Braucht Anerkennung für Individualität, Humor & Freiraum. Stress: Verzögerung, Widerstand gegen Regeln. Frage: „Wie machen wir das auf coole, neue Art?“',
            '3 typische Spannungsfelder: Planung & Details (Logiker vs. Macher) | Regeln & Freiraum (Beharrer vs. Rebell) | Nähe & Emotionalität (Empathiker vs. Träumer).',
          ],
        },
        {
          heading: '16 Lebensmotive & Goldene Regeln für Partnerschaft und Team',
          points: [
            '16 intrinsische Grundbedürfnisse (Reiss-Profil): Macht, Unabhängigkeit, Neugier, Anerkennung, Ordnung, Sparen, Ehre, Idealismus, Beziehungen, Familie, Status, Wettkampf/Revanche, Schönheit, Körperliche Aktivität, Essen, Ruhe.',
            '70/30-Feedback-Regel: Es braucht im Alltag rund 70 % positives Feedback (Wertschätzung für Konkretes), damit 30 % kritisches Feedback konstruktiv aufgenommen werden können.',
            'Klartext-Formel bei Konflikten: „Say what happened (Beobachtung) – say what landed (Wirkung bei mir) – say what you need (konkreter Wunsch).“',
            'Miteinander statt nebeneinander: Schlechte Laune offen kommunizieren, gemeinsame Zukunft planen, Balance aus Gemeinsam- und Einzelzeit halten. „Believe behaviour, not explanation“ (Glaube dem Verhalten, nicht den Ausreden).',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Typ & Grundbedürfnis erkennen',
          description: 'Beobachte bei 3 Menschen in deinem Umfeld: Welche 2 Anteile zeigen sie häufig, und ist ihr Grundbedürfnis aktuell erfüllt?',
        },
        {
          stepNumber: 2,
          title: 'Auf dem passenden Kanal ansprechen',
          description: 'Biete dem Logiker Fakten, dem Empathiker persönliche Wärme, dem Macher schnelles Handeln und dem Träumer Ruhe und klare To-dos.',
        },
        {
          stepNumber: 3,
          title: 'Eigene Grundbedürfnisse kommunizieren',
          description: 'Sorge aktiv dafür, dass auch deine eigenen Bedürfnisse bekannt sind („Say what happened – say what landed – say what you need“).',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Ein „Macher“ überrollt im Meeting einen „Logiker“ und einen „Träumer“ mit spontanen Schnellschüssen – der Logiker geht in die Überkontrolle, der Träumer schaltet stumm ab.',
          betterApproach: 'Du gibst dem Logiker vorab die Daten zur Analyse, holst die Einschätzung des Träumers mit klaren To-dos ab und lässt den Macher die schnelle Pilot-Umsetzung treiben.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Nach einer stressigen Woche lebt ihr am Wochenende nur stumm nebeneinander her, und jeder frisst seinen Frust in sich hinein.',
          betterApproach: 'Ihr sprecht die Stimmung kurz offen an, stimmt die Balance aus Einzelzeit (Erholung/Sport) und bewusster gemeinsamer Familienzeit ab und drückt Wertschätzung aktiv aus.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Der 3-Personen-Kompass',
          dailyMicroTask: 'Beobachte bei 3 Personen im Umfeld ihre Hauptanteile und füttere gezielt ihr Grundbedürfnis (z. B. Lob für Wissen, Erfahrung, Person oder Mut).',
          repeatingReminderPrompt: 'Menschenkenntnis-Impuls: Welches Grundbedürfnis braucht dein Gegenüber heute, um aus dem Stressmodus zu kommen?',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Das 70/30-Konto aufladen',
          dailyMicroTask: 'Sprich täglich mindestens eine ehrliche, konkrete Anerkennung im Job oder in der Familie aus, wenn dir etwas positiv auffällt.',
          repeatingReminderPrompt: 'Beziehungs-Konto: Hast du heute schon für 70 % Wertschätzung gesorgt, bevor du Kritik äußerst?',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Miteinander statt Nebeneinander',
          dailyMicroTask: 'Nutze bei Reibung die 3-Satz-Formel („Was ist passiert – wie kam es an – was brauche ich“) und plane bewusste Qualitätszeit ein.',
          repeatingReminderPrompt: 'Beziehungs-Anker: Lebt ihr heute bewusst miteinander statt nur nebeneinander? Gehe davon aus, dass jeder einen Kampf kämpft, den du nicht siehst.',
        },
      ],
      extraReflectionQuestions: [
        'Wie gut sind meine eigenen Grundbedürfnisse derzeit gewährleistet – und wie kann ich selbst besser dafür sorgen, dass sie beachtet werden?',
        'Bei welchem Menschen in meinem Umfeld liegt ein klassisches Spannungsfeld vor (Details vs. Tempo, Regeln vs. Freiraum, Nähe vs. Distanz)?',
      ],
      quiz: [
        {
          question: 'Welches Stressmuster zeigt der Persönlichkeitstyp „Empathiker“ (Einfühlsam) typischerweise unter Druck?',
          options: [
            'Er wird zum aggressiven Grenzüberschreiter und schiebt Verantwortung ab.',
            'Er wird aufopfernd, überangepasst, will es allen recht machen und rutscht bei Überlastung in eine mutlos klagende Opferhaltung.',
            'Er beharrt stur auf Paragrafen und Zahlen.',
          ],
          correctIndex: 1,
          explanation: 'Da das Grundbedürfnis des Empathikers Harmonie und Bestätigung als Person ist, stellt er unter Stress eigene Prioritäten zurück, bis er erschöpft ist.',
        },
        {
          question: 'Wie lautet das gesunde Verhältnis von positivem zu kritischem Feedback, damit Kritik auf der Beziehungsebene überhaupt angenommen werden kann?',
          options: [
            '10 % positives Feedback zu 90 % Kritik („Nicht geschimpft ist gelobt genug“).',
            'Rund 70 % positives/wertschätzendes Feedback als Basis, um 30 % kritisches Feedback konstruktiv aufnehmen zu können.',
            'Man sollte überhaupt kein Feedback geben.',
          ],
          correctIndex: 1,
          explanation: 'Der Empfänger entscheidet über die Beziehungsebene, wie eine Botschaft ankommt – erst eine tragfähige Basis aus echter Anerkennung macht offen für Korrekturen.',
        },
      ],
    },
  },

  // ==========================================================================
  // MODUL 14: BRAIN, BODY, SCHLAF & DOPAMIN-SCHUTZ
  // ==========================================================================
  {
    id: 'mind_mod_brain_body_sleep',
    linkedPlanId: 'plan_mind_clear_decisions',
    linkedDrillIds: ['drill_aerobic_brain_reset'],
    subCategory: 'Mentales Training & Resilienz',
    level: 1,
    prerequisites: [],
    buildsInto: ['mind_mod_multitasking_focus', 'mind_mod_smart_implementation'],
    targetDrivers: ['endure', 'perfection', 'control'],
    targetPersonalities: ['logician', 'doer', 'dreamer', 'persister', 'empath', 'rebel'],
    lifeAreas: ['beruf', 'familie', 'selbst'],

    compactCard: {
      title: 'Brain & Body: Bewegung, Schlaf & Dopamin',
      subtitle: 'Wie du durch moderaten Sport neue Gehirnzellen bildest und deinen Fokus schützt',
      readingTimeMinutes: 4,
      coreInsight:
        'Bewegung lässt im Hippocampus neue Gehirnzellen wachsen (Neurogenese), entspannt das überlastete Vorderhirn und schaltet das Ruhezustandsnetzwerk für Geistesblitze ein. Kombiniert mit gutem Schlaf und Dopamin-Balance bleibt dein Geist jahrzehntelang jung.',
      quickActionToday:
        'Bewege dich heute mindestens 15–30 Minuten moderat (aerob: zügiges Gehen oder lockeres Laufen) und schalte 30 Minuten vor dem Schlafen alle Bildschirme ab.',
      reflectionQuestion:
        'Wo versuchst du gerade geistige Müdigkeit mit Zucker, Koffein oder Handy-Scrollen zu bekämpfen, obwohl dein Gehirn eigentlich Sauerstoff, Bewegung oder Schlaf bräuchte?',
      takeawayQuote:
        'Bewege deinen Körper jeden Tag – selbst 10 Minuten halten dein Gehirn jung, räumen Stress ab und wecken kreative Ideen.',
    },

    deepDiveDrawer: {
      theoryBlocks: [
        {
          heading: 'Neurogenese, Hippocampus & das Ruhezustandsnetzwerk',
          points: [
            'Ab dem 40. Lebensjahr schrumpft das Gehirnvolumen normalerweise um ca. 5 % pro Jahrzehnt; Eiweißablagerungen und freie Radikale schädigen die Neuronen.',
            'Der Hippocampus speichert frisches Wissen bis zu 2 Jahre lang (bevor es ins Langzeitgedächtnis der Hirnrinde wandert), steuert über Platzzellen die räumliche Orientierung und bildet im Gyrus dentatus ein Leben lang neue Nervenzellen (Neurogenese).',
            'Moderate aerobe Bewegung (Gehen, Dauerlaufen, Schwimmen mit guter Sauerstoffzufuhr) steigert den Blutfluss im Hippocampus, erhöht das schützende N-Acetylaspartat (NAA) und hält das glymphatische System (Müllabfuhr des Gehirns gegen Demenz/Alzheimer) aktiv.',
            'Synaptogenese (Vernetzung der neuen Zellen): Neue Synapsen entstehen optimal, wenn körperliche Aktivität mit neuen geistigen Lerninhalten kombiniert wird.',
            'Kreativitäts-Boost: Beim Sport konzentriert man sich auf eine simple Bewegung -> der durch Multitasking gestresste präfrontale Kortex erholt sich, und das Ruhezustandsnetzwerk verknüpft im Hintergrund Ideen zu plötzlichen Geistesblitzen.',
          ],
        },
        {
          heading: 'Dopamin-Balance, Schlaf-Hygiene & Brain-Food',
          points: [
            'Dopamin-Schutz: Ständige Überstimulation (z. B. durch ungesunde Überernährung oder Suchtreize) führt zum Abbau von Dopamin-Rezeptoren – das Belohnungssystem stumpft ab. Sport erhöht Dopamin auf natürliche Weise, ohne die Rezeptoren zu überfordern.',
            'Schlafmangel-Folgen: Zu wenig Schlaf schwächt die kognitive Kontrolle, senkt Willenskraft, Ordnung und Stimmung und steigert den Heißhunger auf Zucker.',
            'Die 6 Einschlaf-Hindernisse vermeiden: 1. Helles Bildschirmlicht (TV/Handy 30 Min. vorher aus), 2. Zu spätes großes Essen, 3. Zu viel Koffein/Zucker, 4. Intensives Abendtraining, 5. Alkohol, 6. Zu warmes Schlafzimmer.',
            'Brain-Food für die Nervenzellen: Spinat/Grünes, Eier, Fisch, Avocado, Beeren, dunkle Schokolade und Walnüsse.',
          ],
        },
      ],
      stepByStepProcess: [
        {
          stepNumber: 1,
          title: 'Aerobe Bewegung im Alltag verankern',
          description: 'Bewege dich täglich mindestens 10–30 Minuten moderat (oder 4x pro Woche 30+ Min. Ausdauer/Kraft), sodass dein Gehirn optimal mit Sauerstoff durchblutet wird.',
        },
        {
          stepNumber: 2,
          title: 'Move & Learn kombinieren (Synapsen-bau)',
          description: 'Nutze die geistige Frische nach der Bewegung für neues Lernen (Lesen, Kopfrechnen, Strategiearbeit), um neue Neuronen direkt zu verschalten.',
        },
        {
          stepNumber: 3,
          title: 'Abend-Abschaltroutine für das glymphatische System',
          description: '30 Minuten vor dem Schlafen Bildschirme aus, kühles Schlafzimmer sichern und dem Gehirn im Schlaf Zeit zum Aufräumen (Kurz- zu Langzeitgedächtnis) geben.',
        },
      ],
      everydayExamples: [
        {
          area: 'Beruf',
          typicalTrap: 'Du sitzt 9 Stunden durchgehend in Meetings und vor dem Laptop, bist abends geistig völlig leer und findest keine kreative Lösung für ein Problem.',
          betterApproach: 'Du nutzt einen 20-minütigen Spaziergang ohne Handy: Dein präfrontaler Kortex fährt herunter, das Ruhezustandsnetzwerk schaltet sich ein, und die Lösung fällt dir unterwegs ein.',
        },
        {
          area: 'Familie & Alltag',
          typicalTrap: 'Du schläfst zu wenig, schaust bis kurz vor Mitternacht aufs Handy und wunderst dich am nächsten Tag über Heißhunger auf Süßes und dünne Nerven.',
          betterApproach: 'Du führst die 30-Minuten-Bildschirmsperre vor dem Schlafen und 1 notebookfreien Abend pro Woche ein – Willenskraft und gute Laune kehren zurück.',
        },
      ],
      habitTrainingStages: [
        {
          stageLabel: 'Woche 1 (Tag 1–7): Tägliche Bewegung & Ruhezustandsnetzwerk',
          dailyMicroTask: 'Bewege deinen Körper jeden Tag mindestens 10–20 Minuten an der frischen Luft – ohne Kopfhörer oder Bildschirm.',
          repeatingReminderPrompt: 'Brain-Body-Impuls: Gönn deinem Hippocampus heute frischen Sauerstoff und deinem Vorderhirn eine Pause durch Bewegung!',
        },
        {
          stageLabel: 'Woche 2 (Tag 8–14): Schlaf-Schutz & 30-Minuten-Screen-Off',
          dailyMicroTask: 'Schalte 30 Minuten vor dem Schlafen TV und Handy ab und vermeide spätes schweres Essen oder Alkohol.',
          repeatingReminderPrompt: 'Schlaf-Anker: 30 Minuten vor dem Schlafen Bildschirme aus – lass dein Gehirn heute Nacht ungestört aufräumen.',
        },
        {
          stageLabel: 'Woche 3–4 (Tag 15–28) & Langzeit-Erhalt: Move + Learn + Brain-Food',
          dailyMicroTask: 'Kombiniere 4x pro Woche Sport mit geistigem Lernen (Neues erfahren, Lesen, Kopfrechnen) und integriere gezielt Brain-Food (Walnüsse, Beeren, Fisch, Grünes).',
          repeatingReminderPrompt: 'Longevity-Check: Kombination aus Bewegung und neuem Lernen baut neue Synapsen – was hast du heute für Körper und Geist getan?',
        },
      ],
      extraReflectionQuestions: [
        'Welche der 6 typischen Einschlaf-Hindernisse (Licht, spätes Essen, Koffein/Zucker, späte Belastung, Alkohol, Wärme) bremst meine Erholung aktuell am stärksten?',
        'Wie kann ich langweilige Sitz-Meetings oder Denkblockaden öfter in Geh-Einheiten umwandeln?',
      ],
      quiz: [
        {
          question: 'Unter welcher Bedingung werden die durch Bewegung im Hippocampus neu gebildeten Nervenzellen (Neurogenese) optimal zu neuen Synapsen verschaltet?',
          options: [
            'Wenn man sich nach dem Sport wochenlang geistig gar nicht mehr anstrengt.',
            'Wenn körperliche Aktivität mit neuen geistigen Lerninhalten kombiniert wird (Synaptogenese).',
            'Nur bei extremem anaerobem Hochleistungssport bis zur völligen Erschöpfung.',
          ],
          correctIndex: 1,
          explanation: 'Bewegung liefert den Zell-Rohstoff im Hippocampus, und neues Lernen verschaltet diese frischen Neuronen zu dauerhaften neuronalen Netzwerken.',
        },
        {
          question: 'Warum kommen uns beim lockeren Laufen oder Spazierengehen oft plötzlich kreative Ideen, auf die wir am Schreibtisch nicht gekommen sind?',
          options: [
            'Weil sich beim Sport das Netzwerk für Multitasking (präfrontaler Kortex) erholt und gleichzeitig das „Ruhezustandsnetzwerk“ aktiv wird, das Regionen im Hintergrund neu verknüpft.',
            'Weil man beim Laufen schneller tippen kann.',
            'Weil das Gehirn beim Gehen komplett abgeschaltet ist.',
          ],
          correctIndex: 0,
          explanation: 'Der Fokus auf eine gleichmäßige Bewegung entlastet das Vorderhirn und startet das Ruhezustandsnetzwerk, das für kreative Geistesblitze sorgt.',
        },
      ],
    },
  },
];

  const ALL_MIND_MODULES = [
    ...MIND_CONTENT_PACKAGE_A,
    ...MIND_CONTENT_PACKAGE_B,
    ...MIND_CONTENT_PACKAGE_C
  ];

  function getModulesForPlan(planId) {
    return ALL_MIND_MODULES.filter(mod => mod.linkedPlanId === planId);
  }

  // Globale Schnittstelle für v3_mind.js & die gesamte App
  window.BOND_MIND_DB = {
    STRESS_SCALE_OPTIONS,
    STRESS_DRIVER_QUESTIONS,
    STRESS_DRIVER_INFO,
    PERSONALITY_QUESTIONS,
    PERSONALITY_TYPE_INFO,
    MIND_DRILLS,
    MIND_PLANS,
    QUICK_CHECK_OPTIONS,
    MIND_CONTENT_PACKAGE_A,
    MIND_CONTENT_PACKAGE_B,
    MIND_CONTENT_PACKAGE_C,
    ALL_MIND_MODULES,
    getModulesForPlan,
    evaluateAndRecordAssessment,
    runAndRecordQuickCheck,
    getPlanDrillAndReminderStatus
  };
})();

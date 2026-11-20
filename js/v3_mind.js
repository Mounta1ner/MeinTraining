/* Bond (v3.0) - Modul 6: Body & Mind Navigation, Situations-Coach, Quick Check, Einstiegs-Test, 14 Deep-Dive-Module & Home-Kacheln */
(function () {
  'use strict';
  if (!S.lang || (S.lang !== 'de' && S.lang !== 'en')) S.lang = 'de';
  const DB = window.BOND_MIND_DB || {};

  // --- 1. STATE INITIALISIERUNG ---
  S.ui = S.ui || {};
  S.ui.libDomain = S.ui.libDomain || 'body'; // 'body' | 'mind'
  S.ui.planDomain = S.ui.planDomain || 'body'; // 'body' | 'mind'
  S.ui.mindView = S.ui.mindView || 'all';   // 'all' | 'drills' | 'modules'
  S.homeVisible = S.homeVisible || {};
  S.homeOrder = Array.isArray(S.homeOrder) ? S.homeOrder : ['plans', 'mindImpulse', 'activities', 'bpm', 'weight', 'breath', 'finance'];
  if (!S.homeOrder.includes('mindImpulse')) {
    const pIdx = S.homeOrder.indexOf('plans');
    S.homeOrder.splice(pIdx >= 0 ? pIdx + 1 : 0, 0, 'mindImpulse');
  }
  S.mindJournal = Array.isArray(S.mindJournal) ? S.mindJournal : [];

  S.mindState = S.mindState || {
    evaluations: [],
    quickChecks: [],
    activePlanProgress: {},
    completedQuizzes: {},
    checkedSelfItems: {},
    impulseOffset: 0
  };
  if (!Array.isArray(S.mindState.evaluations)) S.mindState.evaluations = [];
  if (!Array.isArray(S.mindState.quickChecks)) S.mindState.quickChecks = [];
  if (!S.mindState.activePlanProgress || typeof S.mindState.activePlanProgress !== 'object') S.mindState.activePlanProgress = {};
  if (!S.mindState.completedQuizzes || typeof S.mindState.completedQuizzes !== 'object') S.mindState.completedQuizzes = {};
  if (!S.mindState.checkedSelfItems || typeof S.mindState.checkedSelfItems !== 'object') S.mindState.checkedSelfItems = {};

  const MIND_CATEGORIES = ['Denkfehler', 'Alltags-Hürden', 'Mentales Training', 'Wissens-Module'];

  // --- 2. DIE 12 PRAXIS-DRILLS (m0 - m11) + GEZIELTE ENGINE-DRILLS IN EX INTEGRIEREN ---
  const MIND_EXERCISES = [
    {
      id: 'm0',
      n: 'Katastrophisieren stoppen',
      al: ['Worst-Case-Denken', 'Katastrophendenken', 'Teufelskreis', 'Sorgen-Spirale'],
      c: 'Denkfehler',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#denkfehler', '#sorgen', '#realitätscheck', '#gelassenheit'],
      d: 'Wenn das Gehirn aus einer Unsicherheit sofort den schlimmstmöglichen Ausgang konstruiert: Unterbrich die Spirale mit dem 3-Szenarien-Realitätscheck.',
      s: 'Automatischer Gedanke: „Wenn das schiefgeht, ist alles verloren – eine Katastrophe!“',
      mPos: 'Prüf-Frage: „Was ist 1. das Schlimmste, 2. das Beste und 3. das Wahrscheinlichste? Wie blicke ich in einem Jahr darauf?“',
      e: 'Ziel-Gedanke: „Selbst wenn es holprig wird, ist es lösbar. Ich richte meinen Fokus auf den wahrscheinlichsten Ausgang und meinen nächsten Schritt.“',
      g: 'Stressabbau, Beruhigung, Perspektivwechsel, Sorgen-Stopp, Fokus',
      x: 'Nicht während akuter Panik erzwingen – zuerst 60 Sek. über verlängerte Ausatmung den Körper beruhigen.',
      l: 'Unser Gehirn überschätzt Gefahren evolutionär bedingt massiv. Indem du bewusst das schlimmste, beste und wahrscheinlichste Szenario nebeneinanderstellst, verliert das Katastrophenbild sofort seine emotionale Übermacht.',
      fig: ['MD_STORM', 'MD_CLARITY'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Katastrophen-Gedanken unzensiert benennen', sec: 30 },
        { label: '2. Prüf-Frage: Wahrscheinlichstes Szenario dagegenhalten', sec: 45 },
        { label: '3. Konkreten ersten Handlungsschritt festlegen', sec: 30 }
      ]
    },
    {
      id: 'm1',
      n: 'Gedankenlesen entlarven',
      al: ['Mind Reading', 'Projektion', 'Was denken andere', 'Ablehnungs-Fokus'],
      c: 'Denkfehler',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#denkfehler', '#beziehungen', '#selbstwert', '#kommunikation'],
      d: 'Wir unterstellen anderen oft negative Urteile über uns, obwohl wir nur deren Mimik oder knappe Antworten interpretieren. Trenne Beobachtung von Spekulation.',
      s: 'Automatischer Gedanke: „Die Person war kurz angebunden – bestimmt ist sie verärgert über mich oder hält mich für unfähig.“',
      mPos: 'Prüf-Frage: „Welche harten Beweise habe ich? Welche 3 neutralen Erklärungen (Stress, Zeitdruck, Ablenkung) haben gar nichts mit mir zu tun?“',
      e: 'Ziel-Gedanke: „Ich kann keine Gedanken lesen. Solange nichts ausgesprochen ist, gehe ich von neutralen Gründen aus oder frage offen nach.“',
      g: 'Soziale Sicherheit, Kommunikation, Gelassenheit, Selbstvertrauen',
      x: 'Wenn bereits ein offener Konflikt ausgesprochen wurde – dann direkt die Übung „Unbequeme Themen ansprechen“ nutzen.',
      l: 'In über 80 % der Fälle hat die knappe Reaktion einer anderen Person mit deren eigenem Stresslevel zu tun. Das Sammeln von drei neutralen Alternativ-Erklärungen durchbricht den Tunnelblick sofort.',
      fig: ['MD_KNOT', 'MD_SHIELD'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Eigene Unterstellung / Vermutung aufdecken', sec: 30 },
        { label: '2. Drei neutrale Erklärungen ohne Selbstbezug finden', sec: 45 },
        { label: '3. Entscheiden: Direkt nachfragen oder abhaken', sec: 25 }
      ]
    },
    {
      id: 'm2',
      n: 'Schwarz-Weiß-Denken auflösen',
      al: ['Alles-oder-Nichts', 'Perfektionismus-Falle', 'Graustufen-Training'],
      c: 'Denkfehler',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#denkfehler', '#perfektionismus', '#dranbleiben', '#konsistenz'],
      d: 'Wer nur 100 % oder 0 % kennt, gibt nach kleinen Abweichungen komplett auf. Trainiere das Denken in realistischen Prozent-Stufen.',
      s: 'Automatischer Gedanke: „Jetzt habe ich den Plan einmal nicht perfekt geschafft – jetzt ist die ganze Woche ruiniert.“',
      mPos: 'Prüf-Frage: „Wo auf einer Skala von 0 % bis 100 % stehe ich wirklich? Was wäre heute eine gute 60-%- oder 70-%-Lösung statt 0 %?“',
      e: 'Ziel-Gedanke: „Erfolg entsteht durch Kontinuität in Graustufen. Gute 70 % schlagen perfekte 0 % jedes Mal.“',
      g: 'Dranbleiben, Gewohnheiten, Frustrationstoleranz, Selbstmitgefühl',
      x: 'Nicht als Ausrede nutzen, um klare Prioritäten dauerhaft zu schleifen – Ziel bleibt der nächste machbare Schritt.',
      l: 'Perfektionismus ist oft versteckte Prokrastination. Sobald du von „Ganz oder gar nicht“ auf „Was geht heute realistisch?“ umschaltest, bleibt deine Serie lebendig.',
      fig: ['MD_KNOT', 'MD_TARGET'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Extrem-Urteil („Alles kaputt / 0 %“) erkennen', sec: 25 },
        { label: '2. Auf der Skala von 0 bis 100 % realistisch einordnen', sec: 40 },
        { label: '3. Heutige 70-%-Lösung definieren und umsetzen', sec: 30 }
      ]
    },
    {
      id: 'm3',
      n: 'Emotionale Beweisführung prüfen',
      al: ['Gefühl ist kein Fakt', 'Emotional Reasoning', 'Hochstapler-Syndrom'],
      c: 'Denkfehler',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#denkfehler', '#emotionen', '#selbstvertrauen', '#klarheit'],
      d: 'Nur weil sich etwas bedrohlich oder überfordernd anfühlt, ist das noch kein Beweis dafür, dass du es nicht schaffst. Trenne Gefühl von Fakten.',
      s: 'Automatischer Gedanke: „Ich fühle mich unsicher und nervös – also bin ich schlecht vorbereitet und werde scheitern.“',
      mPos: 'Prüf-Frage: „Welche objektiven Fakten und bisherigen Erfahrungen widersprechen meinem momentanen Bauchgefühl?“',
      e: 'Ziel-Gedanke: „Ein Gefühl ist eine kurzfristige Reaktion meines Nervensystems, kein Tatsachenbericht über meine Kompetenz.“',
      g: 'Selbstvertrauen, Prüfungsangst, Auftrittssicherheit, Fokus',
      x: 'Körperliche Warnsignale (z. B. echter Schmerz oder Erschöpfung) ernst nehmen – hier geht es um Selbstzweifel-Gefühle.',
      l: 'Lampenfieber oder Unsicherheit vor neuen Aufgaben zeigen nur, dass dir etwas wichtig ist. Ein nüchterner Blick auf deine bisherigen Erfahrungen erdet das Urteil.',
      fig: ['MD_STORM', 'MD_SCALE'],
      figMid: 'MD_CLARITY',
      phases: [
        { label: '1. Gefühl benennen („Ich spüre gerade Unsicherheit“)', sec: 30 },
        { label: '2. Drei objektive Fakten & frühere Erfolge dagegenstellen', sec: 45 },
        { label: '3. Trotz Gefühl ruhig den ersten Schritt tun', sec: 25 }
      ]
    },
    {
      id: 'm4',
      n: 'Den „Muss“-Druck entschärfen',
      al: ['Innere Antreiber', 'Sollte-Tyrannei', 'Selbstkritik abbauen'],
      c: 'Denkfehler',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#denkfehler', '#druck', '#selbstkritik', '#energie'],
      d: 'Starre „Ich muss / Ich darf nicht“-Sätze erzeugen Dauerstress und inneren Widerstand. Formuliere Zwang in selbstbestimmte Entscheidungen um.',
      s: 'Automatischer Gedanke: „Ich muss heute alles perfekt abarbeiten und darf mir keine Pause oder Fehler erlauben.“',
      mPos: 'Prüf-Frage: „Wie verändert sich der Druck, wenn ich ‚Ich muss…‘ durch ‚Ich entscheide mich heute für…, weil mir … wichtig ist‘ ersetze?“',
      e: 'Ziel-Gedanke: „Ich handle aus klarer Priorität statt aus innerer Peitsche – und spreche mit mir wie mit einem geschätzten Freund.“',
      g: 'Stressreduktion, Innere Ruhe, Motivation, Burnout-Prävention',
      x: '–',
      l: 'Worte wie „müssen“ signalisieren dem Gehirn Ohnmacht. Der Wechsel zu „Ich wähle / Mir ist wichtig“ aktiviert das präfrontale Entscheidungszentrum und senkt Cortisol.',
      fig: ['MD_KNOT', 'MD_CLARITY'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Inneren „Ich muss / Ich sollte“-Satz aufspüren', sec: 25 },
        { label: '2. In bewusste Wahl („Ich entscheide mich für…“) übersetzen', sec: 40 },
        { label: '3. Freundschafts-Test: Würde ich so mit einem Freund reden?', sec: 25 }
      ]
    },
    {
      id: 'm5',
      n: 'Unbequeme Themen ansprechen (B-W-W)',
      al: ['Schwieriges Gespräch', 'Konflikt ansprechen', 'Feedback geben', 'Klartext reden'],
      c: 'Alltags-Hürden',
      m: 'Gesprächs-Leitfaden',
      execMode: 'sequence',
      tags: ['#alltag', '#kommunikation', '#konflikt', '#mut', '#gespräch'],
      d: 'Geführte 3-Minuten-Vorbereitung direkt vor einem heiklen Gespräch im Job oder Alltag nach der B-W-W-Formel (Beobachtung – Wirkung – Wunsch).',
      s: 'Ausgangslage: Anspannung vor dem Gespräch; Gefahr, das Thema aus Harmoniebedürfnis zu verschweigen oder vorwurfsvoll zu starten.',
      mPos: 'Strukturierung: 1. Beobachtung (neutraler Fakt), 2. Wirkung („Bei mir führt das zu…“), 3. Konkreter Wunsch („Mir wäre wichtig, dass…“).',
      e: 'Zielhaltung: Ruhiger Puls, klarer erster Einstiegssatz – verbindlich in der Sache und respektvoll im Ton.',
      g: 'Konfliktfähigkeit, Souveränität, Führung, Beziehungsklärung, Selbstbehauptung',
      x: 'Nicht im ersten Ärger-Impuls starten – bei starker Wut zuerst „Akute Reiz-Reaktions-Pause“ durchführen.',
      l: 'Beispiel-Satzbau: „Mir ist aufgefallen, dass [konkrete Beobachtung ohne ‚immer/nie‘]. Bei mir führt das dazu, dass [Wirkung]. Ich wünsche mir für das nächste Mal, dass wir [konkreter Wunsch]. Wie siehst du das?“',
      fig: ['MD_STORM', 'MD_BRIDGE'],
      figMid: 'MD_CLARITY',
      phases: [
        { label: '1. Körper beruhigen: 3× tief einatmen & lang ausatmen', sec: 40 },
        { label: '2. Neutrale Beobachtung & eigene Wirkung formulieren', sec: 50 },
        { label: '3. Konkreten Wunsch + ersten Einstiegssatz festlegen', sec: 50 },
        { label: '4. Mentale Probe: Den ersten Satz ruhig aussprechen', sec: 30 }
      ]
    },
    {
      id: 'm6',
      n: 'Klare Grenzen setzen & Nein sagen',
      al: ['Nein sagen', 'Abgrenzung', 'Überlastung stoppen', 'Ohne Rechtfertigung'],
      c: 'Alltags-Hürden',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#alltag', '#grenzen', '#selbstschutz', '#kommunikation'],
      d: 'Lerne, Anfragen freundlich, aber bestimmt abzulehnen – ohne dich in langen Ausreden oder Schuldgefühlen zu verfangen.',
      s: 'Ausgangslage: Automatischer Impuls, trotz vollem Kalender „Ja“ zu sagen oder sich minutenlang zu rechtfertigen.',
      mPos: 'Strukturierung: Dank/Wertschätzung + klares „Nein / Passt aktuell nicht rein“ + optional knappe Alternative (ohne falsche Ausreden).',
      e: 'Zielhaltung: Ein kurzes, freundliches Nein. Jedes Nein zu Überlastung ist ein klares Ja zu meinen wichtigsten Aufgaben und meiner Familie.',
      g: 'Abgrenzung, Zeitmanagement, Selbstachtung, Stressschutz',
      x: '–',
      l: 'Lange Rechtfertigungen laden das Gegenüber nur zum Verhandeln ein. Starke Sätze sind kurz: „Danke, dass du an mich denkst. Aktuell habe ich dafür keine Kapazität, damit meine laufenden Projekte sauber fertig werden.“',
      fig: ['MD_KNOT', 'MD_SHIELD'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Automatischen „Ja-Impuls“ stoppen & Bedenkzeit nehmen', sec: 30 },
        { label: '2. Klaren Absage-Satz ohne Rechtfertigungs-Schleife bauen', sec: 45 },
        { label: '3. Kurzes Unbehagen akzeptieren & standhaft bleiben', sec: 30 }
      ]
    },
    {
      id: 'm7',
      n: 'Prokrastination knacken (2-Min-Start)',
      al: ['Aufschieberitis stoppen', 'Startwiderstand überwinden', '2-Minuten-Regel', 'Anfangen'],
      c: 'Alltags-Hürden',
      m: 'Sofort-Starter',
      execMode: 'sequence',
      tags: ['#alltag', '#fokus', '#produktivität', '#umsetzung'],
      d: 'Aufschieben ist kein Zeitproblem, sondern ein Emotionsproblem vor großen Aufgaben. Senke die Startschwelle so tief, dass dein Gehirn nicht mehr streikt.',
      s: 'Ausgangslage: Die Aufgabe wirkt riesig und unangenehm; das Gehirn sucht Ablenkung am Handy oder in Nebensächlichkeiten.',
      mPos: 'Strukturierung: Schneide eine winzige 2-Minuten-Scheibe ab (z. B. nur Datei öffnen und 3 Stichworte tippen).',
      e: 'Zielhaltung: Ich muss die Aufgabe jetzt nicht fertigmachen – ich arbeite nur 120 Sekunden am allerersten Schritt.',
      g: 'Umsetzungskraft, Fokus, Disziplin, Selbstwirksamkeit',
      x: '–',
      l: 'Der Zeigarnik-Effekt zeigt: Sobald das Gehirn eine Aufgabe auch nur für 2 Minuten begonnen hat, sinkt der innere Widerstand drastisch und der Arbeitsfluss setzt ein.',
      fig: ['MD_KNOT', 'MD_TARGET'],
      figMid: 'MD_CLARITY',
      phases: [
        { label: '1. Ablenkung weglegen & Start-Unlust als normal akzeptieren', sec: 20 },
        { label: '2. Lächerlich kleinen 2-Minuten-Startschritt definieren', sec: 30 },
        { label: '3. Jetzt sofort loslegen: 120 Sekunden Fokus-Start!', sec: 120 }
      ]
    },
    {
      id: 'm8',
      n: 'Akute Reiz-Reaktions-Pause (90 Sek.)',
      al: ['Impulskontrolle', 'Wut-Stopp', 'Trigger meistern', 'Nicht sofort reagieren'],
      c: 'Alltags-Hürden',
      m: 'Akut-Drill',
      execMode: 'sequence',
      tags: ['#alltag', '#emotionen', '#impulskontrolle', '#ruhe'],
      d: 'Wenn dich eine Aussage, E-Mail oder Situation akut triggert: Überbrücke die 90-sekündige biochemische Adrenalin-Welle, bevor du reagierst.',
      s: 'Ausgangslage: Puls steigt, Kiefer spannt an, starker Drang sofort scharf zurückzuschießen oder sich zu verteidigen.',
      mPos: 'Strukturierung: 1. Physisch stoppen (Hände weg vom Gerät), 2. Ausatmen verlängern, 3. Fragen: „Welche Reaktion dient meinem Ziel morgen noch?“',
      e: 'Zielhaltung: Zwischen Reiz und Reaktion liegt mein Freiraum. Ich antworte überlegt statt impulsiv.',
      g: 'Emotionsregulation, Souveränität, Gelassenheit, Konfliktlösung',
      x: '–',
      l: 'Nach der Hirnforscherin Jill Bolte Taylor dauert die rein chemische Stresswelle von Adrenalin im Blut nur rund 90 Sekunden – sofern wir sie nicht durch neue Wutgedanken weiter anfeuern.',
      fig: ['MD_STORM', 'MD_SHIELD'],
      figMid: 'MD_CLARITY',
      phases: [
        { label: '1. Stopp: Nicht tippen / nicht sofort kontern, Schultern senken', sec: 30 },
        { label: '2. Adrenalin abbauen: Ruhig 4 Sek. ein-, 6 Sek. ausatmen', sec: 45 },
        { label: '3. Souveräne Antwort wählen, die deinem Ziel nützt', sec: 30 }
      ]
    },
    {
      id: 'm9',
      n: 'Grübel-Stopp & Feierabend-Shutdown',
      al: ['Abschalten nach der Arbeit', 'Kopf frei bekommen', 'Gedankenkarussell stoppen'],
      c: 'Mentales Training',
      m: 'Abend-Routine',
      execMode: 'sequence',
      tags: ['#mental', '#abschalten', '#erholung', '#schlaf', '#familie'],
      d: 'Schließe am Ende des Arbeitstages die offenen mentalen Tabs im Kopf, damit du zuhause und am Abend wirklich präsent bist.',
      s: 'Ausgangslage: Körperlich im Feierabend, aber gedanklich noch bei unerledigten Aufgaben, Problemen oder Gesprächen.',
      mPos: 'Strukturierung: 1. Offene Punkte auf einen „Parkplatz für morgen“ schreiben, 2. Eine gelungene Sache von heute anerkennen, 3. Bewusstes Schluss-Signal.',
      e: 'Zielhaltung: Meine Aufgaben für morgen sind sicher geparkt. Jetzt bin ich mit voller Aufmerksamkeit im Hier und Jetzt.',
      g: 'Mentale Regeneration, Schlafqualität, Präsenz in der Familie, Stressabbau',
      x: '–',
      l: 'Das Gehirn grübelt vor allem dann weiter, wenn es befürchtet, etwas Wichtiges zu vergessen. Sobald offene Punkte für den nächsten Tag kurz fixiert sind, gibt das Arbeitsgedächtnis Ruhe.',
      fig: ['MD_STORM', 'MD_CLARITY'],
      figMid: 'MD_BRIDGE',
      phases: [
        { label: '1. Offene Schleifen kurz als Notiz für morgen parken', sec: 45 },
        { label: '2. Rückblick: Was habe ich heute gut bewältigt?', sec: 35 },
        { label: '3. Feierabend-Anker: Tief ausatmen & Rollenwechsel spüren', sec: 30 }
      ]
    },
    {
      id: 'm10',
      n: 'Mentales Kontrastieren (WOOP-Drill)',
      al: ['WOOP-Methode', 'Wenn-Dann-Plan', 'Hindernisse meistern', 'Mentale Vorbereitung'],
      c: 'Mentales Training',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#mental', '#ziele', '#disziplin', '#gewohnheiten'],
      d: 'Wissenschaftlich belegte Methode (Gabriele Oettingen), um gute Vorsätze durch konkrete Wenn-Dann-Pläne gegen Alltags-Hindernisse abzusichern.',
      s: 'Ausgangslage: Ein Vorhaben ist geplant (z. B. Training, ruhige Reaktion, Fokus), droht aber bei Müdigkeit oder Stress unterzugehen.',
      mPos: 'Strukturierung: Wunsch (Wish) -> Bestes Ergebnis (Outcome) -> Reales inneres Hindernis (Obstacle) -> Wenn-Dann-Plan (Plan).',
      e: 'Zielhaltung: „Wenn [mein typisches Hindernis] auftritt, dann werde ich sofort [meine konkrete Gegenhandlung] ausführen.“',
      g: 'Zielerreichung, Disziplin, Selbststeuerung, Durchhaltevermögen',
      x: '–',
      l: 'Reines positives Denken senkt oft die Handlungsenergie. Erst die ehrliche Kombination aus Wunschbild und dem realistischen inneren Hindernis verankert den Wenn-Dann-Automatismus im Gehirn.',
      fig: ['MD_SCALE', 'MD_TARGET'],
      figMid: 'MD_CLARITY',
      phases: [
        { label: '1. Wunsch & bestes Gefühl nach der Umsetzung vorstellen', sec: 30 },
        { label: '2. Größtes inneres Hindernis (z. B. Müdigkeit/Ausrede) benennen', sec: 40 },
        { label: '3. Festen „Wenn [Hindernis], dann [Handlung]“-Satz bilden', sec: 40 }
      ]
    },
    {
      id: 'm11',
      n: 'Kontrollkreis-Fokus (Einfluss vs. Akzeptanz)',
      al: ['Circle of Control', 'Stoischer Fokus', 'Gelassenheit', 'Energie schützen'],
      c: 'Mentales Training',
      m: 'Mentale Übung',
      execMode: 'sequence',
      tags: ['#mental', '#gelassenheit', '#fokus', '#resilienz'],
      d: 'Höre auf, mentale Energie an Dinge zu verschwenden, die du nicht ändern kannst. Bündle 100 % deiner Kraft auf deinen direkten Einflussbereich.',
      s: 'Ausgangslage: Ärger, Sorge oder Frust über äußere Umstände, Entscheidungen anderer oder vergangene Ereignisse.',
      mPos: 'Strukturierung: Ziehe eine klare Trennlinie: Was liegt außerhalb meiner Kontrolle (Akzeptieren)? Was liegt in meiner Hand (Anpacken)?',
      e: 'Zielhaltung: Ich lasse das Unbeeinflussbare stehen und richte meine volle Energie auf meine eigene Haltung und meinen nächsten Schritt.',
      g: 'Resilienz, Fokus, Innere Stärke, Energie-Management',
      x: '–',
      l: 'Frag dich in jeder stressigen Lage: „Kann ich das direkt durch mein heutiges Handeln beeinflussen?“ Wenn nein: bewusst abhaken. Wenn ja: nächsten konkreten Schritt terminieren.',
      fig: ['MD_KNOT', 'MD_TARGET'],
      figMid: 'MD_SHIELD',
      phases: [
        { label: '1. Was liegt außerhalb meiner Kontrolle? (Bewusst loslassen)', sec: 30 },
        { label: '2. Was liegt zu 100 % in meiner Hand? (Eigene Hebel sammeln)', sec: 45 },
        { label: '3. Einen konkreten Hebel für heute auswählen', sec: 30 }
      ]
    }
  ];

  // Kuratierte Kurzpläne (ergänzend zu den 5 großen 21-30 Tage Gewohnheitsplänen aus BOND_MIND_DB)
  const MIND_CURATED_PLANS = [
    {
      name: '🧠 Denkfehler-Detox (Kognitive Klarheit)',
      days: [0, 2, 4],
      pw: 3,
      desc: 'Erkenne und entschärfe die 5 häufigsten Denkfehler im Alltag (Katastrophisieren, Gedankenlesen, Schwarz-Weiß-Denken, Gefühls-Beweise & Muss-Druck).',
      items: [
        { ex: 'm0', sets: 1, reps: 105, kg: 0 },
        { ex: 'm1', sets: 1, reps: 100, kg: 0 },
        { ex: 'm2', sets: 1, reps: 95, kg: 0 },
        { ex: 'm3', sets: 1, reps: 100, kg: 0 },
        { ex: 'm4', sets: 1, reps: 90, kg: 0 }
      ]
    },
    {
      name: '🗣️ Souverän in schwierige Gespräche & Grenzen',
      days: [1, 3, 6],
      pw: 3,
      desc: 'Kombiniert Atem-Beruhigung mit klaren Werkzeugen für unbequeme Themen (B-W-W), Abgrenzung ohne Schuldgefühle und Impulskontrolle.',
      items: [
        { ex: 'e123', sets: 1, reps: 3, kg: 0 },
        { ex: 'm5', sets: 1, reps: 170, kg: 0 },
        { ex: 'm6', sets: 1, reps: 105, kg: 0 },
        { ex: 'm8', sets: 1, reps: 105, kg: 0 }
      ]
    },
    {
      name: '🎯 Fokus, Umsetzung & Anti-Aufschieberitis',
      days: [0, 1, 2, 3, 4],
      pw: 5,
      desc: 'Täglicher 5-Minuten-Mental-Start: Fokus-Atmung, 2-Minuten-Startrampe gegen Prokrastination, WOOP-Hindernis-Plan und Kontrollkreis-Fokus.',
      items: [
        { ex: 'e127', sets: 1, reps: 3, kg: 0 },
        { ex: 'm7', sets: 1, reps: 170, kg: 0 },
        { ex: 'm10', sets: 1, reps: 110, kg: 0 },
        { ex: 'm11', sets: 1, reps: 105, kg: 0 }
      ]
    },
    {
      name: '🌙 Bond Abend-Shutdown (Body & Mind)',
      days: [],
      pw: 4,
      desc: 'Verbindet körperliches Entspannen (Nacken & lange Ausatmung) mit dem mentalen Feierabend-Shutdown gegen nächtliches Grübeln.',
      items: [
        { ex: 'm9', sets: 1, reps: 110, kg: 0 },
        { ex: 'm0', sets: 1, reps: 105, kg: 0 },
        { ex: 'e28', sets: 1, reps: 30, kg: 0 },
        { ex: 'e122', sets: 1, reps: 4, kg: 0 }
      ]
    }
  ];

  // Konvertiert auch die 9 Drills aus BOND_MIND_DB.MIND_DRILLS in EX-kompatible Einträge,
  // damit sie in Plänen, Timern und der Suche überall nahtlos funktionieren!
  function buildDbDrillExercises() {
    if (!DB.MIND_DRILLS) return [];
    return Object.values(DB.MIND_DRILLS).map(dr => ({
      id: dr.id,
      n: dr.title,
      al: [dr.type],
      c: dr.type === 'breathing_body' ? 'Mentales Training' : dr.type === 'action' ? 'Alltags-Hürden' : 'Denkfehler',
      m: `${dr.durationMinutes} Min. Drill`,
      execMode: 'sequence',
      tags: ['#mind', '#drill', '#' + dr.type],
      d: dr.shortInstruction,
      s: 'Ausgangspunkt: Akuter Impuls oder anstehende Situation wahrnehmen.',
      mPos: dr.shortInstruction,
      e: 'Reflexions-Kern: ' + dr.reflectionPrompt,
      g: 'Mentale Klarheit, Selbststeuerung, Fokus',
      x: '–',
      fig: [dr.type === 'breathing_body' ? 'MD_STORM' : 'MD_KNOT', 'MD_CLARITY'],
      figMid: 'MD_SCALE',
      phases: [
        { label: '1. Anleitung aufnehmen & innehalten', sec: 30 },
        { label: '2. Übung anwenden (' + dr.title + ')', sec: Math.max(45, (dr.durationMinutes || 2) * 30) },
        { label: '3. Reflexion: ' + dr.reflectionPrompt, sec: 30 }
      ]
    }));
  }

  function injectMindExercisesIntoCatalog() {
    if (typeof EX === 'undefined' || !Array.isArray(EX)) return;
    const combined = [...MIND_EXERCISES, ...buildDbDrillExercises()];
    combined.forEach(mEx => {
      const idx = EX.findIndex(x => x && x.id === mEx.id);
      if (idx < 0) EX.push(Object.assign({}, mEx));
      else EX[idx] = Object.assign({}, mEx, EX[idx]);
    });
  }

  injectMindExercisesIntoCatalog();

  if (typeof window.v3SyncCatalogNow === 'function') {
    const _origSync = window.v3SyncCatalogNow;
    window.v3SyncCatalogNow = async function (silent) {
      const res = await _origSync(silent);
      injectMindExercisesIntoCatalog();
      return res;
    };
  }

  window.v3IsMindExercise = function (e) {
    if (!e) return false;
    const id = String(e.id || '');
    return MIND_CATEGORIES.includes(e.c) || id.startsWith('m') || id.startsWith('drill_') || e.domain === 'mind';
  };

  window.v3IsMindOrBreath = function (e) {
    if (!e) return false;
    return window.v3IsMindExercise(e) || e.c === 'Atmen';
  };

  // --- 3. SVG-GRAFIKEN FÜR MIND-ÜBUNGEN ---
  window.v3MindSvg = function (code) {
    const headBase = `
      <circle cx="24" cy="18" r="10.5" fill="none" stroke="var(--bb)" stroke-width="1.8"/>
      <path d="M12 42 C12 33 36 33 36 42" fill="none" stroke="var(--bb)" stroke-width="2" stroke-linecap="round"/>`;

    switch (code) {
      case 'MD_STORM':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          ${headBase}
          <path d="M19 16 C21 12 27 12 28 16 C29 19 21 18 22 22" stroke="var(--mc)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M25 8 L22 13 L26 13 L23 18" stroke="var(--mc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      case 'MD_KNOT':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          ${headBase}
          <path d="M18 17 C18 13 30 13 30 18 C30 22 19 22 19 17 C19 14 27 21 28 15" stroke="var(--mc)" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      case 'MD_SCALE':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          <line x1="24" y1="10" x2="24" y2="38" stroke="var(--ac)" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="12" y1="18" x2="36" y2="18" stroke="var(--ac)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M12 18 L9 27 L15 27 Z" fill="var(--mc)" opacity="0.85"/>
          <path d="M36 18 L33 27 L39 27 Z" fill="var(--ok)" opacity="0.85"/>
          <line x1="17" y1="38" x2="31" y2="38" stroke="var(--bb)" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;
      case 'MD_CLARITY':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          ${headBase}
          <circle cx="24" cy="18" r="4.5" fill="var(--ac)" opacity="0.25"/>
          <path d="M20.5 18 L23 20.5 L28 15.5" stroke="var(--ok)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="24" y1="3" x2="24" y2="5.5" stroke="var(--ac)" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="7" x2="14" y2="9" stroke="var(--ac)" stroke-width="2" stroke-linecap="round"/>
          <line x1="36" y1="7" x2="34" y2="9" stroke="var(--ac)" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      case 'MD_SHIELD':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          <path d="M24 7 L37 12 V23 C37 32 31 38 24 41 C17 38 11 32 11 23 V12 L24 7 Z" fill="var(--ac2)" stroke="var(--ac)" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M19 24 L22.5 27.5 L29.5 20.5" stroke="var(--ok)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      case 'MD_TARGET':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          <circle cx="24" cy="24" r="15" stroke="var(--bb)" stroke-width="1.8"/>
          <circle cx="24" cy="24" r="9.5" stroke="var(--ac)" stroke-width="2"/>
          <circle cx="24" cy="24" r="4" fill="var(--ok)"/>
          <path d="M33 15 L40 8 M36 8 H40 V12" stroke="var(--mc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      case 'MD_BRIDGE':
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
          <circle cx="14" cy="18" r="5" stroke="var(--ac)" stroke-width="2"/>
          <circle cx="34" cy="18" r="5" stroke="var(--ok)" stroke-width="2"/>
          <path d="M7 36 C7 29 21 29 21 36" stroke="var(--ac)" stroke-width="2" stroke-linecap="round"/>
          <path d="M27 36 C27 29 41 29 41 36" stroke="var(--ok)" stroke-width="2" stroke-linecap="round"/>
          <path d="M18 14 Q24 8 30 14" stroke="var(--mc)" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">${headBase}<circle cx="24" cy="18" r="4" fill="var(--ac)"/></svg>`;
    }
  };

  const _prevFigSvg = figSvg;
  figSvg = function (s, e) {
    if (typeof s === 'string' && s.startsWith('MD_')) return window.v3MindSvg(s);
    return _prevFigSvg(s, e);
  };

  const _prevFig = fig;
  fig = function (e, w, z) {
    const c = e && e.fig && e.fig[w];
    if (typeof c === 'string' && c.startsWith('MD_')) {
      const lbl = w ? (window.v3IsMindExercise(e) ? 'Ziel' : 'Ende') : (window.v3IsMindExercise(e) ? 'Impuls' : 'Start');
      return `<div class="fg" style="width:${z}px;height:${z}px">${window.v3MindSvg(c)}${z > 60 ? `<span class="mu fl">${lbl}</span>` : ''}</div>`;
    }
    return _prevFig(e, w, z);
  };

  // --- 4. DYNAMISCHER SITUATIONS-COACH (EINGABE BEEINFLUSST ÜBUNG AKTIV!) ---
  const SIGNAL_PATTERNS = [
    { regex: /\b(muss|müssen|darf nicht|sollte|pflicht)\b/i, label: '„Muss“-Druck / Antreiber', tip: 'Formuliere „Ich muss…“ in „Ich entscheide mich heute für…, weil mir … wichtig ist“ um.', suggestedEx: 'm4' },
    { regex: /\b(katastrophe|ruiniert|alles verloren|schrecklich|furchtbar|eskaliert)\b/i, label: 'Katastrophisieren', tip: 'Stelle dem Worst-Case das wahrscheinlichste Szenario und deinen nächsten 10-Minuten-Schritt gegenüber.', suggestedEx: 'm0' },
    { regex: /\b(immer|nie|alles|nichts|komplett|total|perfekt)\b/i, label: 'Schwarz-Weiß-Denken', tip: 'Denke in Prozent-Stufen: Eine gute 70-%-Lösung schlägt perfekte 0 %.', suggestedEx: 'm2' },
    { regex: /\b(denkt bestimmt|sauer auf mich|hält mich für|enttäuschen|alle mögen)\b/i, label: 'Gedankenlesen / Harmoniezwang', tip: 'Sammle 3 neutrale Erklärungen ohne Selbstbezug – du kannst keine Gedanken lesen.', suggestedEx: 'm1' },
    { regex: /\b(aufschieb|prokrastin|keine lust|zu viel|überfordert|berg)\b/i, label: 'Startwiderstand / Überlastung', tip: 'Schneide eine winzige 2-Minuten-Startscheibe ab oder streiche Unwichtiges mit dem 4-Wochen-Filter.', suggestedEx: 'm7' },
    { regex: /\b(gespräch|ansprechen|konflikt|kritik|nein sagen|grenze|chef|kollege)\b/i, label: 'Gesprächs- & Abgrenzungs-Hürde', tip: 'Nutze die B-W-W-Formel (Beobachtung – Wirkung – Wunsch) ohne „Warum“-Fragen.', suggestedEx: 'm5' }
  ];

  function analyzeSituationInput(text, stressLevel) {
    const clean = String(text || '').trim();
    const detected = SIGNAL_PATTERNS.filter(p => p.regex.test(clean));
    const needsBreathFirst = Number(stressLevel) >= 7;

    // Extrahiere "Ich muss X" für automatischen Umbau
    const mussMatch = clean.match(/ich\s+muss\s+([^.!?,]+)/i);
    const extractedMuss = mussMatch ? mussMatch[1].trim() : '';

    return {
      clean,
      stressLevel: Number(stressLevel) || 5,
      detected,
      needsBreathFirst,
      extractedMuss
    };
  }

  let MD_SESSION = null;

  window.v3OpenMindDrill = function (exId, dt = iso(), pid = '', itemIdx = -1, prefillSituation = '') {
    const e = ex(exId);
    if (!e) return;

    MD_SESSION = {
      exId: e.id,
      e,
      dt,
      pid,
      itemIdx,
      step: 1, // 1: Situation & Stress-Check, 1.5: Akut-Atem-Pause (falls Stress >= 7), 2: Dynamischer Baukasten, 3: Personalisierter Leitsatz & Timer
      stressLevel: 5,
      triggerNote: prefillSituation || '',
      // Strukturierte Felder für dynamische Satz-Generierung:
      bwwObs: '',
      bwwEffect: '',
      bwwWish: '',
      probPercent: 25,
      woopWish: '',
      woopObstacle: '',
      checkNote: '',
      reframeNote: '',
      breathDone: false
    };

    v3RenderMindDrillModal();
  };

  function captureMindDrillInputs() {
    if (!MD_SESSION) return;
    const val = id => document.getElementById(id)?.value;
    if (val('v3MdTrigger') !== undefined) MD_SESSION.triggerNote = val('v3MdTrigger');
    if (val('v3MdStress') !== undefined) MD_SESSION.stressLevel = Number(val('v3MdStress')) || 5;
    if (val('v3MdBwwObs') !== undefined) MD_SESSION.bwwObs = val('v3MdBwwObs');
    if (val('v3MdBwwEff') !== undefined) MD_SESSION.bwwEffect = val('v3MdBwwEff');
    if (val('v3MdBwwWish') !== undefined) MD_SESSION.bwwWish = val('v3MdBwwWish');
    if (val('v3MdProb') !== undefined) MD_SESSION.probPercent = Number(val('v3MdProb'));
    if (val('v3MdWoopWish') !== undefined) MD_SESSION.woopWish = val('v3MdWoopWish');
    if (val('v3MdWoopObs') !== undefined) MD_SESSION.woopObstacle = val('v3MdWoopObs');
    if (val('v3MdCheck') !== undefined) MD_SESSION.checkNote = val('v3MdCheck');
    if (val('v3MdReframe') !== undefined) MD_SESSION.reframeNote = val('v3MdReframe');
  }

  // Baut aus den Eingaben von Schritt 1 & 2 automatisch den personalisierten Leitsatz für Schritt 3
  function buildDynamicTargetSentence(session) {
    const id = session.exId;
    const analysis = analyzeSituationInput(session.triggerNote, session.stressLevel);

    if (id === 'm5' && (session.bwwObs || session.bwwEffect || session.bwwWish)) {
      const obs = session.bwwObs.trim() || '[konkrete Beobachtung]';
      const eff = session.bwwEffect.trim() || '[Wirkung bei mir]';
      const wish = session.bwwWish.trim() || '[konkreter Wunsch]';
      return `„Mir ist aufgefallen, dass ${obs}. Bei mir führt das dazu, dass ${eff}. Ich wünsche mir für das nächste Mal, dass ${wish}. Wie siehst du das?“`;
    }
    if (id === 'm4' && analysis.extractedMuss) {
      const reason = session.checkNote.trim() || 'es mir persönlich wichtig ist';
      return `„Ich entscheide mich heute bewusst dafür, ${analysis.extractedMuss}, weil ${reason} – und erlaube mir dabei eine gesunde 80-%-Lösung.“`;
    }
    if (id === 'm10' && (session.woopWish || session.woopObstacle)) {
      const w = session.woopWish.trim() || session.triggerNote.trim() || 'mein Vorhaben umsetzen';
      const o = session.woopObstacle.trim() || 'Müdigkeit oder Ablenkung';
      const act = session.checkNote.trim() || 'starte ich sofort mit dem 2-Minuten-Einstieg';
      return `„Mein Ziel ist: ${w}. Wenn mir ${o} dazwischenkommt, dann ${act}.“`;
    }
    if ((id === 'm0' || id === 'm2') && session.triggerNote.trim()) {
      const p = session.probPercent;
      const alt = session.checkNote.trim() || 'ich konzentriere mich auf den nächsten machbaren 70-%-Schritt';
      return `„Auch wenn mir ‚${session.triggerNote.trim()}‘ Sorgen macht (geschätzte Wahrscheinlichkeit: ${p} %): ${alt}.“`;
    }
    if (session.checkNote.trim() && session.triggerNote.trim()) {
      return `„Ausgangslage: ${session.triggerNote.trim()} ➔ Mein Fokus jetzt: ${session.checkNote.trim()}.“`;
    }
    return (session.e.e || '').replace(/^[^:]+:\s*/, '');
  }

  window.v3MindSetStep = function (nextStep) {
    if (!MD_SESSION) return;
    captureMindDrillInputs();

    // Stress-Weiche: Wenn von Schritt 1 weitergegangen wird und Stress >= 7 ist, erst Atem-Reset einschalten!
    if (MD_SESSION.step === 1 && nextStep === 2 && MD_SESSION.stressLevel >= 7 && !MD_SESSION.breathDone) {
      MD_SESSION.step = 1.5;
      v3RenderMindDrillModal();
      return;
    }

    // Beim Übergang in Schritt 3 den dynamischen Satz generieren (falls Nutzer noch keinen eigenen überschrieben hat)
    if (nextStep === 3 && !MD_SESSION.reframeNote.trim()) {
      MD_SESSION.reframeNote = buildDynamicTargetSentence(MD_SESSION);
    }

    MD_SESSION.step = nextStep;
    v3RenderMindDrillModal();
  };

  window.v3StartPersonalizedMindTimer = function () {
    if (!MD_SESSION) return;
    captureMindDrillInputs();
    const targetSentence = MD_SESSION.reframeNote.trim() || buildDynamicTargetSentence(MD_SESSION);
    const sit = MD_SESSION.triggerNote.trim();
    const e = MD_SESSION.e;

    // Erstelle personalisierte Timer-Balken mit den eingegebenen Texten des Nutzers!
    const customPhases = [
      {
        label: sit ? `1. Situation annehmen: „${sit.slice(0, 55)}${sit.length > 55 ? '…' : ''}“` : '1. Ausgangslage wahrnehmen & ruhig atmen',
        sec: 30
      },
      {
        label: MD_SESSION.checkNote.trim()
          ? `2. Prüf-Fokus: „${MD_SESSION.checkNote.trim().slice(0, 55)}“`
          : '2. Perspektivwechsel & Struktur festigen',
        sec: 45
      },
      {
        label: `3. Leitsatz verankern: ${targetSentence.slice(0, 65)}${targetSentence.length > 65 ? '…' : ''}`,
        sec: 40
      }
    ];

    const tempId = e.id;
    const origPhases = e.phases;
    e.phases = customPhases;
    v27CloseModal();
    v3OpenSequenceTimer(tempId, null, () => {
      e.phases = origPhases;
    });
  };

  window.v3AdoptMindStepAsHabit = function () {
    if (!MD_SESSION) return;
    captureMindDrillInputs();
    const sentence = (MD_SESSION.reframeNote.trim() || buildDynamicTargetSentence(MD_SESSION)).replace(/^„|“$/g, '');
    const shortTitle = sentence.length > 58 ? sentence.slice(0, 55) + '…' : sentence;

    S.habits = Array.isArray(S.habits) ? S.habits : [];
    const newHabit = {
      id: 'h' + Date.now(),
      name: '🧠 ' + shortTitle,
      mode: 'daily',
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      doneCount: 0,
      missedCount: 0
    };
    S.habits.push(newHabit);
    save();
    toast('📌 Als täglicher Mind-Fokus auf deinen Home-Screen übernommen!');
  };

  window.v3CompleteMindDrill = function () {
    if (!MD_SESSION) return;
    captureMindDrillInputs();
    if (!MD_SESSION.reframeNote.trim()) {
      MD_SESSION.reframeNote = buildDynamicTargetSentence(MD_SESSION);
    }

    const e = MD_SESSION.e;
    const entry = {
      id: 'mj_' + Date.now(),
      exId: e.id,
      name: e.n,
      cat: e.c,
      at: new Date().toISOString(),
      stressLevel: MD_SESSION.stressLevel,
      trigger: MD_SESSION.triggerNote.trim(),
      check: [MD_SESSION.bwwObs, MD_SESSION.bwwEffect, MD_SESSION.bwwWish, MD_SESSION.checkNote].filter(Boolean).join(' · '),
      reframe: MD_SESSION.reframeNote.trim()
    };

    S.mindJournal.push(entry);

    if (MD_SESSION.pid && MD_SESSION.itemIdx >= 0) {
      const p = S.plans.find(x => x.id === MD_SESSION.pid);
      if (p && p.items[MD_SESSION.itemIdx]) {
        const eff = effective(p.items[MD_SESSION.itemIdx], p);
        tickNext(MD_SESSION.dt, MD_SESSION.pid, MD_SESSION.itemIdx, +eff.sets || 1);
      }
    } else {
      S.exerciseHistory = Array.isArray(S.exerciseHistory) ? S.exerciseHistory : [];
      S.exerciseHistory.push({
        id: e.id,
        name: e.n,
        reps: 1,
        unit: 'completion',
        at: entry.at,
        source: 'mind'
      });
    }

    save();
    MD_SESSION = null;
    v27CloseModal();
    toast(`🧠 Mental-Drill „${e.n}“ abgeschlossen!`);
    render();
  };

  function v3RenderMindDrillModal() {
    if (!MD_SESSION) return;
    const { e, step } = MD_SESSION;
    const analysis = analyzeSituationInput(MD_SESSION.triggerNote, MD_SESSION.stressLevel);

    let stepContent = '';

    if (step === 1) {
      stepContent = `
        <div class="v3-mind-step-card">
          <div class="r" style="flex-wrap:nowrap;gap:12px">
            ${fig(e, 0, 72)}
            <div>
              <span class="v3-type-badge seq">Schritt 1 von 3 · Situations-Check</span>
              <h3 style="margin:4px 0">${esc(e.c === 'Denkfehler' ? 'Gedanken & Auslöser erfassen' : 'Konkrete Situation beschreiben')}</h3>
            </div>
          </div>
          <p class="v3-mind-quote">„${esc((e.s || '').replace(/^[^:]+:\s*/, ''))}“</p>
          <label class="mu" style="font-size:12px;display:block;margin-top:8px">
            Deine aktuelle Situation oder dein spontaner Gedanke (steuert die nächsten Schritte):
            <textarea id="v3MdTrigger" rows="2" style="margin-top:4px" placeholder="z. B. Ich muss morgen ein heikles Gespräch führen / Ich schiebe Aufgabe X vor mir her...">${esc(MD_SESSION.triggerNote)}</textarea>
          </label>
          <label class="mu" style="font-size:12px;display:block;margin-top:10px">
            Aktuelles Anspannungs-Level: <b id="v3MdStressVal" style="color:var(--ac)">${MD_SESSION.stressLevel} / 10</b>
            ${MD_SESSION.stressLevel >= 7 ? '<span style="color:var(--mc)"> (Hoch -> schaltet 40s Atem-Beruhigung vor!)</span>' : ''}
            <input id="v3MdStress" type="range" min="1" max="10" value="${MD_SESSION.stressLevel}" style="margin-top:4px"
              oninput="document.getElementById('v3MdStressVal').textContent=this.value+' / 10'">
          </label>
          <div class="r" style="justify-content:flex-end;margin-top:12px">
            <button type="button" class="b" onclick="v3MindSetStep(2)">Weiter zur Analyse →</button>
          </div>
        </div>`;
    } else if (step === 1.5) {
      // Automatische Stress-Weiche bei Anspannung >= 7
      stepContent = `
        <div class="v3-mind-step-card" style="border-color:var(--mc)">
          <span class="v3-type-badge seq">⚡ Stress-Weiche aktiv (Level ${MD_SESSION.stressLevel}/10)</span>
          <h3 style="margin:6px 0">Zuerst 40 Sekunden Nervensystem beruhigen</h3>
          <p class="mu" style="font-size:13px">
            Bei hoher Anspannung ist das logische Denken blockiert. Nimm dir 40 Sekunden für den <b>Physiologischen Seufzer</b> (2× kurz durch die Nase einatmen, doppelt so lang durch den Mund ausatmen).
          </p>
          <div class="r" style="gap:8px;margin-top:12px">
            <button type="button" class="b" style="flex:1" onclick="v27CloseModal();v3OpenPhaseTimer('e123', 40, ()=>{MD_SESSION.breathDone=true;MD_SESSION.step=2;v3RenderMindDrillModal();})">
              🌬️ 40s Atem-Reset starten
            </button>
            <button type="button" class="chip" onclick="MD_SESSION.breathDone=true;v3MindSetStep(2)">Überspringen →</button>
          </div>
        </div>`;
    } else if (step === 2) {
      // Dynamischer Baukasten je nach Übung & erkannten Signalwörtern!
      let detectedHtml = '';
      if (analysis.detected.length > 0) {
        detectedHtml = `
          <div style="margin:8px 0;padding:8px 10px;border-radius:10px;background:var(--ac2);font-size:12px">
            <b>🔍 Erkannte Denkmuster in deiner Eingabe:</b>
            ${analysis.detected.map(d => `<div style="margin-top:3px">• <b>${esc(d.label)}:</b> ${esc(d.tip)}</div>`).join('')}
          </div>`;
      }

      let interactiveBuilderHtml = '';
      if (e.id === 'm5') {
        // B-W-W Gesprächsbaukasten
        interactiveBuilderHtml = `
          <label class="mu" style="font-size:12px;margin-top:6px">1. Neutrale Beobachtung (Was genau ist passiert – ohne „immer/nie“?):
            <input id="v3MdBwwObs" value="${esc(MD_SESSION.bwwObs)}" placeholder="z. B. die letzten zwei Übergaben kamen erst kurz vor Feierabend">
          </label>
          <label class="mu" style="font-size:12px;margin-top:6px">2. Wirkung bei dir (Was löst das konkret aus?):
            <input id="v3MdBwwEff" value="${esc(MD_SESSION.bwwEffect)}" placeholder="z. B. ich dadurch unter Zeitdruck gerate und nichts mehr prüfen kann">
          </label>
          <label class="mu" style="font-size:12px;margin-top:6px">3. Konkreter Wunsch (Was schlägst du für die Zukunft vor?):
            <input id="v3MdBwwWish" value="${esc(MD_SESSION.bwwWish)}" placeholder="z. B. wir uns bis 14:00 Uhr kurz abstimmen">
          </label>`;
      } else if (e.id === 'm10') {
        // WOOP Baukasten
        interactiveBuilderHtml = `
          <label class="mu" style="font-size:12px;margin-top:6px">Wunsch (Was willst du konkret erreichen?):
            <input id="v3MdWoopWish" value="${esc(MD_SESSION.woopWish || MD_SESSION.triggerNote)}" placeholder="z. B. heute 20 Min. trainieren / ruhig im Meeting bleiben">
          </label>
          <label class="mu" style="font-size:12px;margin-top:6px">Inneres Hindernis (Was hält dich typischerweise davon ab?):
            <input id="v3MdWoopObs" value="${esc(MD_SESSION.woopObstacle)}" placeholder="z. B. Müdigkeit um 18 Uhr / spontane Ausreden">
          </label>
          <label class="mu" style="font-size:12px;margin-top:6px">Dann-Handlung (Deine sofortige Gegenreaktion):
            <input id="v3MdCheck" value="${esc(MD_SESSION.checkNote)}" placeholder="z. B. ziehe ich sofort die Laufschuhe an und starte 5 Minuten">
          </label>`;
      } else if (e.id === 'm0' || e.id === 'm2') {
        // Realitäts- & Graustufen-Regler (0-100%)
        interactiveBuilderHtml = `
          <label class="mu" style="font-size:12px;margin-top:8px">
            Realitäts-Regler: Wie hoch ist die realistische Wahrscheinlichkeit / Ziel-Stufe? <b id="v3MdProbLbl" style="color:var(--ac)">${MD_SESSION.probPercent} %</b>
            <input id="v3MdProb" type="range" min="0" max="100" step="5" value="${MD_SESSION.probPercent}"
              oninput="document.getElementById('v3MdProbLbl').textContent=this.value+' %'">
          </label>
          <label class="mu" style="font-size:12px;margin-top:6px">
            Dein realistischerer Blickwinkel / deine heutige 70-%-Lösung:
            <textarea id="v3MdCheck" rows="2" placeholder="z. B. Selbst wenn es holprig wird, finde ich eine Lösung...">${esc(MD_SESSION.checkNote)}</textarea>
          </label>`;
      } else {
        interactiveBuilderHtml = `
          <label class="mu" style="font-size:12px;margin-top:8px">
            ${analysis.extractedMuss ? `Warum wählst du „${esc(analysis.extractedMuss)}“ bewusst (oder was lässt du weg)?` : 'Deine Antwort auf die Prüf-Frage (wird in deinen Leitsatz übernommen):'}
            <textarea id="v3MdCheck" rows="3" style="margin-top:4px" placeholder="Deine Gedanken / Gegenbeweise / nächster Schritt...">${esc(MD_SESSION.checkNote)}</textarea>
          </label>`;
      }

      stepContent = `
        <div class="v3-mind-step-card">
          <div class="r" style="flex-wrap:nowrap;gap:12px">
            <div class="fg" style="width:72px;height:72px">${window.v3MindSvg(e.figMid || 'MD_SCALE')}<span class="mu fl">Prüfung</span></div>
            <div>
              <span class="v3-type-badge">Schritt 2 von 3 · Übergang & Umbau</span>
              <h3 style="margin:4px 0">${esc(e.c === 'Denkfehler' ? 'Realitäts-Check & Gegenfrage' : 'Strategie & Strukturierung')}</h3>
            </div>
          </div>
          ${MD_SESSION.triggerNote.trim() ? `<div class="mu" style="font-size:12px;margin-top:6px">Deine Ausgangslage: <i>„${esc(MD_SESSION.triggerNote.trim())}“</i></div>` : ''}
          ${detectedHtml}
          <p class="v3-mind-question">${esc((e.mPos || e.d || '').replace(/^[^:]+:\s*/, ''))}</p>
          ${interactiveBuilderHtml}
          <div class="r" style="justify-content:space-between;margin-top:12px">
            <button type="button" class="chip" onclick="v3MindSetStep(1)">← Zurück</button>
            <button type="button" class="b" onclick="v3MindSetStep(3)">Leitsatz erstellen →</button>
          </div>
        </div>`;
    } else {
      // Schritt 3: Personalisierter Leitsatz, Timer-Start & Übernahme als Tages-Fokus
      const generated = MD_SESSION.reframeNote || buildDynamicTargetSentence(MD_SESSION);
      stepContent = `
        <div class="v3-mind-step-card">
          <div class="r" style="flex-wrap:nowrap;gap:12px">
            ${fig(e, 1, 72)}
            <div>
              <span class="v3-type-badge" style="background:var(--ok);color:#fff">Schritt 3 von 3 · Dein Ergebnis</span>
              <h3 style="margin:4px 0">Persönlicher Leitsatz & Aktion</h3>
            </div>
          </div>
          <label class="mu" style="font-size:12px;display:block;margin-top:10px">
            Dein formulierter Leitsatz / Gesprächseinstieg (kannst du direkt anpassen):
            <textarea id="v3MdReframe" rows="3" style="margin-top:4px;font-weight:600;border-color:var(--ac)">${esc(generated)}</textarea>
          </label>
          <div class="r" style="gap:6px;margin-top:10px">
            <button type="button" class="b g" style="flex:1;font-size:12px;padding:8px" onclick="v3StartPersonalizedMindTimer()">⏱️ Mit diesem Satz im Timer üben</button>
            <button type="button" class="chip" style="flex:1;font-size:12px;padding:8px" onclick="v3AdoptMindStepAsHabit()">📌 Auf Home anpinnen</button>
          </div>
          <div class="r" style="justify-content:space-between;margin-top:12px">
            <button type="button" class="chip" onclick="v3MindSetStep(2)">← Zurück</button>
            <button type="button" class="b" onclick="v3CompleteMindDrill()">✓ Drill abschließen & speichern</button>
          </div>
        </div>`;
    }

    v27Modal(`
      <div class="r" style="justify-content:space-between;flex-wrap:nowrap;margin-bottom:6px">
        <div>
          <small class="mu">🧠 BOND · Body & Mind Coach</small>
          <h2 style="margin:0">${esc(e.n)}</h2>
        </div>
        <button type="button" class="x" onclick="MD_SESSION=null;v27CloseModal()">✕</button>
      </div>
      <div class="r" style="gap:6px;margin-bottom:10px">
        ${[1, 2, 3].map(n => `<button type="button" class="chip ${Math.floor(step) === n ? 'on' : ''}" style="flex:1;padding:6px;font-size:12px" onclick="v3MindSetStep(${n})">${n}. ${['Situation', 'Umbau', 'Leitsatz'][n - 1]}</button>`).join('')}
      </div>
      ${stepContent}
    `, false);
  }

  // --- 5. SITUATIONS-QUICK-CHECK UI („WAS BRAUCHST DU GERADE?“) ---
  window.v3OpenQuickCheckModal = function (preselectedSitId = '') {
    const options = DB.QUICK_CHECK_OPTIONS || [];
    if (!options.length) return;
    const selectedId = preselectedSitId || options[0].id;
    const activeOpt = options.find(o => o.id === selectedId) || options[0];
    const drills = (activeOpt.targetedDrillIds || []).map(id => DB.MIND_DRILLS?.[id]).filter(Boolean);
    const linkedMod = (DB.ALL_MIND_MODULES || []).find(m => m.linkedPlanId === activeOpt.relatedPlanId);

    v27Modal(`
      <div class="r" style="justify-content:space-between;flex-wrap:nowrap;margin-bottom:6px">
        <div>
          <small class="mu">⚡ BOND · Akut-Hilfe</small>
          <h2 style="margin:0">Situations-Quick-Check</h2>
        </div>
        <button type="button" class="x" onclick="v27CloseModal()">✕</button>
      </div>
      <p class="mu" style="font-size:13px;margin:2px 0 8px">Wähle aus, was dich im Moment am meisten beschäftigt:</p>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        ${options.map(opt => `
          <button type="button" class="v3-rpe-btn ${opt.id === activeOpt.id ? 'on' : ''}" style="padding:8px 12px" onclick="v3OpenQuickCheckModal('${opt.id}')">
            <div class="v3-rpe-text">
              <small style="color:var(--ac);font-weight:700">${esc(opt.category)}</small>
              <b style="font-size:13px">${esc(opt.situationLabel)}</b>
            </div>
          </button>
        `).join('')}
      </div>

      <div class="v3-mind-step-card" style="border-color:var(--ac)">
        <div class="mu" style="font-size:12px"><b>🔍 Sofort-Einordnung:</b> ${esc(activeOpt.shortDiagnostic)}</div>
        <div style="margin-top:8px">
          <b style="font-size:13px">🎯 Empfohlene Sofort-Drills:</b>
          ${drills.map(dr => `
            <div style="margin-top:6px;padding:8px;border-radius:10px;background:var(--card);border:1px solid var(--bd)">
              <div class="r" style="justify-content:space-between">
                <b>${esc(dr.title)} <small class="mu">(${dr.durationMinutes} Min.)</small></b>
                <button type="button" class="b" style="padding:5px 10px;min-height:34px;font-size:12px" onclick="v3ExecuteQuickCheckDrill('${activeOpt.id}','${dr.id}')">▶ Starten</button>
              </div>
              <p class="mu" style="font-size:12px;margin:4px 0 0">${esc(dr.shortInstruction)}</p>
            </div>
          `).join('')}
        </div>
        ${linkedMod ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bd);font-size:12px">
            📖 Passendes Hintergrund-Modul: <b>${esc(linkedMod.compactCard.title)}</b>
            <button type="button" class="chip" style="padding:3px 8px;font-size:11px;margin-left:6px" onclick="v27CloseModal();v3OpenModuleDrawer('${linkedMod.id}')">Lesen & Quiz</button>
          </div>` : ''}
      </div>
    `, false);
  };

  window.v3ExecuteQuickCheckDrill = function (sitId, drillId) {
    if (typeof DB.runAndRecordQuickCheck === 'function') {
      const res = DB.runAndRecordQuickCheck(sitId, S.mindState, drillId, '');
      S.mindState = res.updatedHistory;
      save();
    }
    v27CloseModal();
    v3OpenMindDrill(drillId);
  };

  // --- 6. EINSTIEGS-CHECK (25 ANTREIBER-FRAGEN + 3 PERSÖNLICHKEITSTYP-FRAGEN) ---
  let ASSESS = null;

  window.v3OpenMindAssessment = function () {
    const prevEval = S.mindState.evaluations[0];
    ASSESS = {
      step: 0, // 0..4 = 5 Blöcke à 5 Fragen, 5 = 3 Persönlichkeitsfragen, 6 = Auswertung
      driverAnswers: {},
      personalityAnswers: {}
    };
    v3RenderAssessmentModal();
  };

  window.v3SetAssessDriverAns = function (qId, val) {
    if (!ASSESS) return;
    ASSESS.driverAnswers[qId] = Number(val);
    v3RenderAssessmentModal();
  };

  window.v3SetAssessPersAns = function (qId, typeId) {
    if (!ASSESS) return;
    ASSESS.personalityAnswers[qId] = typeId;
    v3RenderAssessmentModal();
  };

  window.v3FinishMindAssessment = function () {
    if (!ASSESS || typeof DB.evaluateAndRecordAssessment !== 'function') return;
    const res = DB.evaluateAndRecordAssessment(ASSESS.driverAnswers, ASSESS.personalityAnswers, S.mindState);
    S.mindState = res.updatedHistory;
    save();
    ASSESS.result = res.latestEntry;
    ASSESS.step = 6;
    v3RenderAssessmentModal();
  };

  window.v3ActivateHabitMindPlan = function (mindPlanId) {
    const mp = (DB.MIND_PLANS || []).find(p => p.id === mindPlanId);
    if (!mp) return;

    // 1. In S.mindState.activePlanProgress aktivieren (für 21-30 Tage Gewohnheits-Reminder auf Home)
    S.mindState.activePlanProgress[mp.id] = {
      planId: mp.id,
      startedAt: iso(),
      completedDays: [],
      isHabitEstablished: false
    };

    // 2. Ebenfalls als regulären Plan in S.plans übernehmen (falls noch nicht vorhanden), damit er in Pläne & Home erscheint
    if (!S.plans.some(p => p.mindPlanRef === mp.id)) {
      S.plans.push({
        id: 'p' + Date.now(),
        mindPlanRef: mp.id,
        name: '🧠 ' + mp.title,
        days: [0, 2, 4], // Mo, Mi, Fr (oder täglich über die Home-Gewohnheitskachel)
        pw: 3,
        level: 'Anfänger',
        items: mp.drills.map(dr => ({
          ex: dr.id,
          sets: 1,
          reps: Math.max(60, (dr.durationMinutes || 3) * 30),
          kg: 0
        }))
      });
    }

    save();
    toast(`🎯 Gewohnheits-Plan „${mp.title}“ (${mp.habitDurationDays} Tage) gestartet!`);
    v27CloseModal();
    render();
  };

  function v3RenderAssessmentModal() {
    if (!ASSESS) return;
    const questions = DB.STRESS_DRIVER_QUESTIONS || [];
    const scale = DB.STRESS_SCALE_OPTIONS || [];
    const persQs = DB.PERSONALITY_QUESTIONS || [];

    if (ASSESS.step < 5) {
      const startIdx = ASSESS.step * 5;
      const slice = questions.slice(startIdx, startIdx + 5);
      const answeredCount = Object.keys(ASSESS.driverAnswers).length;

      v27Modal(`
        <div class="r" style="justify-content:space-between;flex-wrap:nowrap">
          <div>
            <small class="mu">🧭 Einstiegs-Check · Teil 1 (Block ${ASSESS.step + 1}/5)</small>
            <h2 style="margin:0">Innere Stress-Antreiber</h2>
          </div>
          <button type="button" class="x" onclick="ASSESS=null;v27CloseModal()">✕</button>
        </div>
        <div class="bar" style="margin:8px 0 10px"><i style="width:${Math.round((answeredCount / 25) * 100)}%"></i></div>
        <p class="mu" style="font-size:12px;margin:0 0 8px">Wie stark treffen diese Aussagen spontan auf dich zu?</p>

        ${slice.map(q => `
          <div style="padding:8px 0;border-bottom:1px solid var(--bd)">
            <div style="font-size:13px;font-weight:600;margin-bottom:5px">${q.id}. ${esc(q.text)}</div>
            <div class="r" style="gap:4px">
              ${scale.map(opt => `
                <button type="button" class="chip ${ASSESS.driverAnswers[q.id] === opt.value ? 'on' : ''}"
                  style="flex:1;padding:5px 4px;font-size:11px;text-align:center"
                  onclick="v3SetAssessDriverAns(${q.id}, ${opt.value})">
                  <b>${opt.value}</b><br><span style="font-size:10px">${esc(opt.label.replace('trifft ', ''))}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <div class="r" style="justify-content:space-between;margin-top:12px">
          ${ASSESS.step > 0 ? `<button type="button" class="chip" onclick="ASSESS.step--;v3RenderAssessmentModal()">← Zurück</button>` : '<span></span>'}
          <button type="button" class="b" onclick="ASSESS.step++;v3RenderAssessmentModal()">Weiter (${ASSESS.step + 1}/5) →</button>
        </div>
      `, false);
      return;
    }

    if (ASSESS.step === 5) {
      v27Modal(`
        <div class="r" style="justify-content:space-between;flex-wrap:nowrap">
          <div>
            <small class="mu">🧭 Einstiegs-Check · Teil 2 (Letzter Schritt)</small>
            <h2 style="margin:0">Dein Kommunikations- & Stresstyp</h2>
          </div>
          <button type="button" class="x" onclick="ASSESS=null;v27CloseModal()">✕</button>
        </div>
        ${persQs.map((pq, idx) => `
          <div style="margin:10px 0;padding:8px;border-radius:12px;background:var(--bg);border:1px solid var(--bd)">
            <div style="font-size:13px;font-weight:700;margin-bottom:6px">${idx + 1}. ${esc(pq.prompt)}</div>
            <div style="display:flex;flex-direction:column;gap:5px">
              ${pq.options.map(opt => `
                <button type="button" class="v3-rpe-btn ${ASSESS.personalityAnswers[pq.id] === opt.type ? 'on' : ''}" style="padding:7px 10px"
                  onclick="v3SetAssessPersAns('${pq.id}', '${opt.type}')">
                  <span style="font-size:12px">${esc(opt.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div class="r" style="justify-content:space-between;margin-top:12px">
          <button type="button" class="chip" onclick="ASSESS.step=4;v3RenderAssessmentModal()">← Zurück</button>
          <button type="button" class="b" onclick="v3FinishMindAssessment()">✨ Auswertung & Plan-Empfehlung</button>
        </div>
      `, false);
      return;
    }

    // Step 6: Auswertung & maßgeschneiderte Empfehlungen
    const res = ASSESS.result || S.mindState.evaluations[0];
    const driverInfo = DB.STRESS_DRIVER_INFO || {};
    const persInfo = DB.PERSONALITY_TYPE_INFO?.[res.primaryPersonality];
    const recPlans = (res.recommendedPlanIds || []).map(id => (DB.MIND_PLANS || []).find(p => p.id === id)).filter(Boolean);

    v27Modal(`
      <div class="r" style="justify-content:space-between;flex-wrap:nowrap">
        <div>
          <small class="mu">✨ Dein persönliches Bond Mind-Profil</small>
          <h2 style="margin:0">Auswertung & Empfehlung</h2>
        </div>
        <button type="button" class="x" onclick="ASSESS=null;v27CloseModal();render()">✕</button>
      </div>

      <div class="v3-mind-step-card" style="margin-top:8px">
        <b>🔥 Deine stärksten Stress-Antreiber (0–15 Pkt.):</b>
        ${Object.entries(res.driverScores).sort((a, b) => b[1] - a[1]).map(([dKey, score]) => {
          const info = driverInfo[dKey];
          const isTop = res.dominantDrivers.includes(dKey);
          const delta = res.scoreDeltaToPrevious?.[dKey];
          const deltaTxt = delta ? ` (${delta > 0 ? '+' + delta : delta} zum Vortest)` : '';
          return `
            <div style="margin-top:6px">
              <div class="r" style="justify-content:space-between;font-size:12px">
                <span>${isTop ? '⚠️ ' : ''}<b>${esc(info?.name || dKey)}</b></span>
                <span><b>${score} / 15</b>${esc(deltaTxt)}</span>
              </div>
              <div class="bar"><i style="width:${Math.round((score / 15) * 100)}%;background:${isTop ? 'var(--mc)' : 'var(--ac)'}"></i></div>
            </div>`;
        }).join('')}

        ${res.dominantDrivers[0] && driverInfo[res.dominantDrivers[0]] ? `
          <div class="v3-mind-target" style="margin-top:10px;font-size:13px">
            💡 <b>Dein wichtigster Erlaubnissatz:</b><br>
            „${esc(driverInfo[res.dominantDrivers[0]].permissionThought)}“
          </div>` : ''}
      </div>

      ${persInfo ? `
        <div class="v3-mind-step-card" style="margin-top:8px">
          <b>🎭 Haupt-Persönlichkeitstyp: ${esc(persInfo.name)}</b>
          <p class="mu" style="font-size:12px;margin:4px 0"><b>Stärke:</b> ${esc(persInfo.strengths)}<br><b>Stressmuster:</b> ${esc(persInfo.stressPattern)}</p>
        </div>` : ''}

      <h3 style="margin:12px 0 6px">🎯 Empfohlene 21–30 Tage Gewohnheits-Pläne:</h3>
      ${recPlans.map(mp => `
        <div style="padding:10px;border-radius:12px;border:1.5px solid var(--ac);background:var(--card);margin-bottom:8px">
          <b>${esc(mp.title)}</b> <small class="mu">(${mp.habitDurationDays} Tage Aufbau)</small>
          <p class="mu" style="font-size:12px;margin:4px 0 8px">${esc(mp.subtitle)}</p>
          <button type="button" class="b" style="width:100%" onclick="v3ActivateHabitMindPlan('${mp.id}')">+ Diesen Gewohnheits-Plan starten</button>
        </div>
      `).join('')}
    `, false);
  }

  // --- 7. DEEP-DIVE DRAWER & INTERAKTIVES QUIZ FÜR ALLE 14 MODULE ---
  window.v3OpenModuleDrawer = function (modId) {
    const mod = (DB.ALL_MIND_MODULES || []).find(m => m.id === modId);
    if (!mod) return;
    const c = mod.compactCard;
    const d = mod.deepDiveDrawer;
    const checkedMap = S.mindState.checkedSelfItems[mod.id] || {};
    const quizAnswers = S.mindState.completedQuizzes[mod.id] || {};

    v27Modal(`
      <div class="r" style="justify-content:space-between;flex-wrap:nowrap">
        <div>
          <small class="mu">📖 ${esc(mod.subCategory)} · Stufe ${mod.level} · ${c.readingTimeMinutes} Min.</small>
          <h2 style="margin:0">${esc(c.title)}</h2>
        </div>
        <button type="button" class="x" onclick="v27CloseModal()">✕</button>
      </div>
      <p class="mu" style="margin:4px 0 10px">${esc(c.subtitle)}</p>

      <div class="v3-mind-target" style="font-size:13px">💡 <b>Merksatz:</b> „${esc(c.takeawayQuote)}“</div>

      ${(d.theoryBlocks || []).map(tb => `
        <div class="v3-mind-step-card" style="margin-top:8px">
          <b>📘 ${esc(tb.heading)}</b>
          <ul style="margin:6px 0 0;padding-left:18px;font-size:13px">
            ${(tb.points || []).map(pt => `<li style="margin-bottom:4px">${esc(pt)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}

      ${(d.stepByStepProcess || []).length ? `
        <div class="v3-mind-step-card" style="margin-top:8px">
          <b>🪜 Schritt-für-Schritt-Anwendung:</b>
          ${d.stepByStepProcess.map(st => `
            <div style="margin-top:6px;font-size:13px">
              <b>${st.stepNumber}. ${esc(st.title || st.actionTitle)}:</b> ${esc(st.description || st.instruction)}
            </div>
          `).join('')}
        </div>` : ''}

      ${(d.everydayExamples || []).length ? `
        <div class="v3-mind-step-card" style="margin-top:8px">
          <b>💼 Alltags-Beispiele (Falle vs. Besserer Weg):</b>
          ${d.everydayExamples.map(exItem => `
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--bd);font-size:12px">
              <b>${esc(exItem.area)}:</b><br>
              <span style="color:var(--mc)">❌ Typische Falle:</span> ${esc(exItem.typicalTrap)}<br>
              <span style="color:var(--ok)">✅ Besserer Weg:</span> ${esc(exItem.betterApproach)}
            </div>
          `).join('')}
        </div>` : ''}

      ${(d.selfCheckList || []).length ? `
        <div class="v3-mind-step-card" style="margin-top:8px">
          <b>☑️ Selbst-Check:</b>
          ${d.selfCheckList.map((item, idx) => `
            <label class="settingsRow" style="font-size:12px;margin:6px 0">
              <input type="checkbox" ${checkedMap[idx] ? 'checked' : ''} onchange="v3ToggleModuleSelfCheck('${mod.id}',${idx},this.checked)">
              <span>${esc(item)}</span>
            </label>
          `).join('')}
        </div>` : ''}

      ${(d.quiz || []).length ? `
        <div class="v3-mind-step-card" style="margin-top:8px;border-color:var(--ac)">
          <b>🎯 Wissens-Check (Quiz):</b>
          ${d.quiz.map((qz, qIdx) => {
            const chosen = quizAnswers[qIdx];
            const isAnswered = chosen !== undefined;
            return `
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bd)">
                <div style="font-size:13px;font-weight:600;margin-bottom:5px">${qIdx + 1}. ${esc(qz.question)}</div>
                ${qz.options.map((opt, oIdx) => {
                  let bgStyle = '';
                  if (isAnswered) {
                    if (oIdx === qz.correctIndex) bgStyle = 'border-color:var(--ok);background:var(--ac2);';
                    else if (oIdx === chosen) bgStyle = 'border-color:var(--mc);';
                  }
                  return `<button type="button" class="v3-rpe-btn" style="padding:6px 10px;margin-bottom:4px;font-size:12px;${bgStyle}"
                    onclick="v3AnswerModuleQuiz('${mod.id}',${qIdx},${oIdx})">${esc(opt)}</button>`;
                }).join('')}
                ${isAnswered ? `<div class="mu" style="font-size:12px;margin-top:4px">${chosen === qz.correctIndex ? '✅ Richtig! ' : '💡 Auflösung: '}${esc(qz.explanation)}</div>` : ''}
              </div>`;
          }).join('')}
        </div>` : ''}

      <div class="r" style="gap:8px;margin-top:12px">
        ${mod.linkedDrillIds?.[0] ? `<button type="button" class="b" style="flex:1" onclick="v27CloseModal();v3OpenMindDrill('${mod.linkedDrillIds[0]}')">🧠 Passenden Drill starten</button>` : ''}
        ${mod.linkedPlanId ? `<button type="button" class="b g" style="flex:1" onclick="v3ActivateHabitMindPlan('${mod.linkedPlanId}')">+ Gewohnheits-Plan starten</button>` : ''}
      </div>
    `, false);
  };

  window.v3ToggleModuleSelfCheck = function (modId, idx, checked) {
    S.mindState.checkedSelfItems[modId] = S.mindState.checkedSelfItems[modId] || {};
    S.mindState.checkedSelfItems[modId][idx] = !!checked;
    save();
  };

  window.v3AnswerModuleQuiz = function (modId, qIdx, optIdx) {
    S.mindState.completedQuizzes[modId] = S.mindState.completedQuizzes[modId] || {};
    S.mindState.completedQuizzes[modId][qIdx] = optIdx;
    save();
    v3OpenModuleDrawer(modId);
  };

  // --- 8. ZUSATZ-KACHELN AUF HOME (REFLEXIONS-IMPULS & GEWOHNHEITS-REMINDER) ---
  function getDailyMindImpulse() {
    const modules = DB.ALL_MIND_MODULES || [];
    const latestEval = S.mindState.evaluations[0];
    const driverInfo = DB.STRESS_DRIVER_INFO || {};
    const dayIndex = Math.floor(Date.now() / 86400000) + (Number(S.mindState.impulseOffset) || 0);

    let permissionThought = 'Ich darf gute 80 % leisten, klare Grenzen setzen und im Hier und Jetzt handeln.';
    let driverName = '';
    if (latestEval && latestEval.dominantDrivers?.[0] && driverInfo[latestEval.dominantDrivers[0]]) {
      const topDriver = driverInfo[latestEval.dominantDrivers[0]];
      driverName = topDriver.name;
      permissionThought = topDriver.permissionThought;
    }

    const mod = modules.length ? modules[Math.abs(dayIndex) % modules.length] : null;
    return {
      driverName,
      permissionThought,
      reflectionQuestion: mod?.compactCard?.reflectionQuestion || 'Welcher eine Schritt bringt mir heute am meisten Ruhe und Klarheit?',
      quickAction: mod?.compactCard?.quickActionToday || '',
      moduleId: mod?.id || '',
      moduleTitle: mod?.compactCard?.title || 'Tages-Reflexion'
    };
  }

  window.v3NextMindImpulse = function () {
    S.mindState.impulseOffset = (Number(S.mindState.impulseOffset) || 0) + 1;
    save();
    render();
  };

  window.v3SaveQuickHomeReflection = function () {
    const inp = document.getElementById('v3HomeMindReflInput');
    const text = inp?.value?.trim();
    if (!text) {
      toast('Bitte einen kurzen Gedanken eingeben');
      return;
    }
    const imp = getDailyMindImpulse();
    S.mindJournal.push({
      id: 'mj_' + Date.now(),
      exId: imp.moduleId || 'daily_impulse',
      name: 'Tages-Reflexion: ' + imp.moduleTitle,
      cat: 'Mentales Training',
      at: new Date().toISOString(),
      trigger: imp.reflectionQuestion,
      check: '',
      reframe: text
    });
    save();
    if (inp) inp.value = '';
    toast('📓 Reflexion im Mental-Logbuch gespeichert!');
    render();
  };

  window.v3CompleteHabitPlanDay = function (planId, drillId) {
    const prog = S.mindState.activePlanProgress[planId];
    if (!prog) return;
    const todayNum = Math.max(1, Math.floor((Date.now() - new Date(prog.startedAt).getTime()) / 86400000) + 1);
    if (!prog.completedDays.includes(todayNum)) {
      prog.completedDays.push(todayNum);
    }
    prog.lastCompletedDate = iso();
    save();
    v3OpenMindDrill(drillId);
  };

  function renderHomeMindCardsHtml() {
    const imp = getDailyMindImpulse();
    const activeIds = Object.keys(S.mindState.activePlanProgress || {});
    let habitReminderHtml = '';

    activeIds.forEach(pid => {
      const prog = S.mindState.activePlanProgress[pid];
      const mp = (DB.MIND_PLANS || []).find(p => p.id === pid);
      if (!prog || !mp || typeof DB.getPlanDrillAndReminderStatus !== 'function') return;

      const daysSinceStart = Math.max(0, Math.floor((Date.now() - new Date(prog.startedAt).getTime()) / 86400000));
      const status = DB.getPlanDrillAndReminderStatus(pid, daysSinceStart, (prog.completedDays || []).length);
      const doneToday = prog.lastCompletedDate === iso();

      // Prüfe ob der Nutzer >= 2 Tage nicht dran geblieben ist
      const lastDoneMs = prog.lastCompletedDate ? new Date(prog.lastCompletedDate + 'T12:00:00').getTime() : new Date(prog.startedAt).getTime();
      const daysMissed = Math.floor((Date.now() - lastDoneMs) / 86400000);
      const nudgeHtml = (!doneToday && daysMissed >= 2)
        ? `<div style="margin:6px 0;padding:7px 9px;border-radius:8px;background:var(--ac2);font-size:12px">
             💡 <b>Dranbleib-Impuls (${daysMissed} Tage Pause):</b> Kein Alles-oder-Nichts! Ein kurzer 2-Minuten-Durchgang heute hält deine neue Gewohnheit lebendig.
           </div>`
        : '';

      if (status.isReminderDueToday || !doneToday) {
        habitReminderHtml += `
          <div class="c" style="border-left:4px solid ${doneToday ? 'var(--ok)' : 'var(--mc)'}">
            <div class="r" style="justify-content:space-between">
              <b>🔥 ${esc(mp.title)}</b>
              <span class="chip ${doneToday ? 'on' : ''}" style="font-size:11px;padding:2px 8px">
                ${status.phase === 'ongoing_maintenance' ? 'Erhaltungs-Impuls' : `Tag ${(prog.completedDays || []).length}/${mp.habitDurationDays} (${status.progressPercent}%)`}
              </span>
            </div>
            <div class="bar" style="margin:6px 0"><i style="width:${status.progressPercent}%"></i></div>
            ${nudgeHtml}
            <div style="font-size:13px;margin-top:4px">
              Heutiger Drill: <b>${esc(status.drillForToday.title)}</b> <small class="mu">(${status.drillForToday.durationMinutes} Min.)</small>
            </div>
            <div class="r" style="margin-top:8px;gap:8px">
              <button type="button" class="b ${doneToday ? 'g' : ''}" style="padding:7px 12px;min-height:38px;font-size:13px"
                onclick="v3CompleteHabitPlanDay('${mp.id}','${status.drillForToday.id}')">
                ${doneToday ? '✓ Heute erledigt (Nochmal üben)' : '▶ Heutigen Mind-Drill starten'}
              </button>
            </div>
          </div>`;
      }
    });

    const impulseCardHtml = `
      <div class="c" style="border-left:4px solid var(--ac)">
        <div class="r" style="justify-content:space-between">
          <b>🧠 Dein Mind-Impuls heute</b>
          <div class="r" style="gap:4px">
            <button type="button" class="chip" style="padding:3px 9px;font-size:11px" onclick="v3OpenQuickCheckModal()">⚡ Quick-Check</button>
            <button type="button" class="chip" style="padding:3px 8px;font-size:11px" onclick="v3NextMindImpulse()" title="Nächster Impuls">↻</button>
          </div>
        </div>
        ${imp.driverName ? `<div class="mu" style="font-size:11px;margin-top:3px">Erlaubnissatz für Antreiber <b>„${esc(imp.driverName)}“</b>:</div>` : ''}
        <div style="font-size:13px;font-weight:600;color:var(--ac);margin:3px 0 6px">„${esc(imp.permissionThought)}“</div>
        <div style="font-size:13px;margin-bottom:6px"><b>Reflexionsfrage:</b> ${esc(imp.reflectionQuestion)}</div>
        <div class="r" style="gap:6px;flex-wrap:nowrap">
          <input id="v3HomeMindReflInput" style="flex:1;font-size:13px;padding:7px 10px" placeholder="Kurzer Gedanke für dein Mental-Logbuch...">
          <button type="button" class="b g" style="padding:7px 12px;min-height:38px;font-size:12px" onclick="v3SaveQuickHomeReflection()">Notieren</button>
        </div>
      </div>`;

    return habitReminderHtml + impulseCardHtml;
  }
  window.v3RenderHomeMindSlot = renderHomeMindCardsHtml;

  // --- 9. NAVIGATION & ÜBUNGSANSICHT IN „💪 BODY“ UND „🧠 MIND“ ---
  window.v3GoDomain = function (domain) {
    S.ui.libDomain = domain === 'mind' ? 'mind' : 'body';
    if (domain === 'mind') {
      if (!['Alle', ...MIND_CATEGORIES, 'Atmen', 'Eigene'].includes(cat)) cat = 'Alle';
      reg = 'Alle Regionen';
    } else if (MIND_CATEGORIES.includes(cat)) {
      cat = 'Alle';
    }
    opn = null;
    save();
    if (tab !== 'lib') go('lib');
    else render();
  };

  function replaceMeinTrainingInObject(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(k => {
      if (typeof obj[k] === 'string') {
        obj[k] = obj[k]
          .replace(/Mein Training/g, 'BOND')
          .replace(/MEIN TRAINING/g, 'BOND');
      } else if (typeof obj[k] === 'object') {
        replaceMeinTrainingInObject(obj[k]);
      }
    });
  }

  function applyBondBrandingEverywhere() {
    document.title = 'BOND – Body & Mind Training';
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute('content', 'BOND');
    const appNameMeta = document.querySelector('meta[name="application-name"]');
    if (appNameMeta) appNameMeta.setAttribute('content', 'BOND');

    if (window.FITNESS_CATALOG && window.FITNESS_CATALOG.translations) {
      replaceMeinTrainingInObject(window.FITNESS_CATALOG.translations);
    }

    const titleEl = document.getElementById('appHeaderTitle') || document.querySelector('header b');
    if (titleEl) {
      titleEl.innerHTML = 'BOND <small style="font-weight:500;opacity:.78;letter-spacing:.02em;text-transform:none">· Body &amp; Mind Training</small>';
    }

    // Ersetze evtl. verbleibende Textknoten mit "Mein Training" im Header oder App-Container
    const rootNodes = [document.querySelector('header'), document.getElementById('app'), document.getElementById('v27Overlay')].filter(Boolean);
    rootNodes.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && /Mein Training|MEIN TRAINING/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue
            .replace(/MEIN TRAINING/g, 'BOND')
            .replace(/Mein Training/g, 'BOND');
        }
      }
    });
  }

  function updateBondHeader() {
    applyBondBrandingEverywhere();
  }
  updateBondHeader();

  const _prevNavMind = nav;
  nav = function () {
    _prevNavMind();
    updateBondHeader();
    const navEl = document.getElementById('nav');
    if (!navEl) return;

    const isEn = S.lang === 'en';
    const isBodyActive = tab === 'lib' && S.ui.libDomain !== 'mind';
    const isMindActive = tab === 'lib' && S.ui.libDomain === 'mind';

    navEl.innerHTML = [
      { active: tab === 'today', onclick: "go('today')", icon: '🏠', label: isEn ? 'Home' : 'Home' },
      { active: tab === 'plans', onclick: "go('plans')", icon: '📋', label: isEn ? 'Plans' : 'Pläne' },
      { active: isBodyActive, onclick: "v3GoDomain('body')", icon: '💪', label: 'Body' },
      { active: isMindActive, onclick: "v3GoDomain('mind')", icon: '🧠', label: 'Mind' },
      { active: tab === 'hist', onclick: "go('hist')", icon: '📈', label: 'Dashboard' }
    ].map(item => `
      <button type="button" class="${item.active ? 'on' : ''}" onclick="${item.onclick}">
        <span style="font-size:22px;display:block;line-height:1.15">${item.icon}</span>${item.label}
      </button>
    `).join('');
  };

  window.v3DeleteMindJournalEntry = function (id) {
    S.mindJournal = (S.mindJournal || []).filter(x => x.id !== id);
    save();
    render();
  };

  function renderMindJournalCard() {
    const entries = (S.mindJournal || []).slice().reverse();
    return `
      <div class="c">
        <details ${S.ui.v3MindJournalOpen ? 'open' : ''} ontoggle="S.ui.v3MindJournalOpen=this.open;save()">
          <summary style="font-weight:700;cursor:pointer">📓 Mein Mental-Logbuch (${entries.length} Einträge)</summary>
          <div style="margin-top:10px">
            <p class="mu" style="font-size:12px;margin-top:0">Alle Reflexionen bleiben zu 100 % privat und lokal auf deinem Gerät gespeichert.</p>
            ${entries.length ? entries.slice(0, 30).map(en => `
              <div class="v3-journal-entry">
                <div class="r" style="justify-content:space-between">
                  <b>🧠 ${esc(en.name)}</b>
                  <span class="mu" style="font-size:11px">${new Date(en.at).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} <button type="button" class="x" style="min-width:24px;min-height:24px;font-size:13px" onclick="v3DeleteMindJournalEntry('${esc(en.id)}')">✕</button></span>
                </div>
                ${en.trigger ? `<div style="font-size:12px;margin-top:4px"><span class="mu">Auslöser/Frage:</span> ${esc(en.trigger)}</div>` : ''}
                ${en.check ? `<div style="font-size:12px;margin-top:2px"><span class="mu">Prüfung:</span> ${esc(en.check)}</div>` : ''}
                ${en.reframe ? `<div style="font-size:12px;margin-top:2px;color:var(--ac)"><b>Leitsatz / Notiz:</b> ${esc(en.reframe)}</div>` : ''}
              </div>
            `).join('') : '<p class="mu" style="font-size:13px">Noch keine Einträge – starte oben einen Drill oder notiere deinen Tages-Impuls.</p>'}
          </div>
        </details>
      </div>`;
  }

  function renderMindModulesSection(searchQuery) {
    const mods = (DB.ALL_MIND_MODULES || []).filter(m => {
      if (!searchQuery) return true;
      const hay = [m.compactCard.title, m.compactCard.subtitle, m.compactCard.coreInsight, m.subCategory].join(' ').toLowerCase();
      return hay.includes(searchQuery);
    });
    if (!mods.length) return '';

    return `
      <h3 style="margin:16px 0 6px">📚 Wissens- & Deep-Dive-Module (${mods.length})</h3>
      <p class="mu" style="font-size:12px;margin:0 0 8px">Kompakte Impulse mit ausklappbarer Theorie, Alltagsbeispielen, Selbst-Check & Quiz.</p>
      ${mods.map(m => {
        const c = m.compactCard;
        const quizDone = Object.keys(S.mindState.completedQuizzes[m.id] || {}).length > 0;
        return `
          <div class="c" style="border-left:3px solid var(--ac)">
            <div class="r" style="justify-content:space-between">
              <small class="mu">${esc(m.subCategory)} · Stufe ${m.level} · ${c.readingTimeMinutes} Min.</small>
              ${quizDone ? '<span class="chip on" style="font-size:10px;padding:2px 7px">✓ Quiz gelöst</span>' : ''}
            </div>
            <h3 style="margin:3px 0">${esc(c.title)}</h3>
            <p class="mu" style="font-size:13px;margin:4px 0">${esc(c.coreInsight)}</p>
            <div style="font-size:12px;padding:6px 8px;border-radius:8px;background:var(--bg);margin:6px 0">
              ⚡ <b>Heute:</b> ${esc(c.quickActionToday)}
            </div>
            <div class="r" style="gap:6px;margin-top:8px">
              <button type="button" class="b g" style="padding:7px 12px;min-height:38px;font-size:13px" onclick="v3OpenModuleDrawer('${m.id}')">📖 Deep-Dive & Quiz öffnen</button>
              ${m.linkedDrillIds?.[0] ? `<button type="button" class="chip" style="padding:7px 11px;font-size:12px" onclick="v3OpenMindDrill('${m.linkedDrillIds[0]}')">🧠 Drill</button>` : ''}
            </div>
          </div>`;
      }).join('')}`;
  }

  vLib = function () {
    if (S.ui.libDomain !== 'mind') {
      const s = eq.toLowerCase();
      const bodyCats = ['Alle', 'Kraft', 'Rumpf', 'Gleichgewicht', 'Mobilisation', 'Dehnung', 'Schnelligkeit', 'Fitnessstudio', 'Atmen', 'Eigene'];
      if (!bodyCats.includes(cat)) cat = 'Alle';

      const list = all().filter(e =>
        !window.v3IsMindExercise(e) &&
        (cat === 'Alle' || e.c === cat) &&
        subOk(e) &&
        inReg(e, reg) &&
        (!s || v281Search(e, s))
      );

      return `
        <div class="v3-domain-switch">
          <button type="button" class="chip on" onclick="v3GoDomain('body')">💪 Body · Körper (${all().filter(e => !window.v3IsMindExercise(e)).length})</button>
          <button type="button" class="chip" onclick="v3GoDomain('mind')">🧠 Mind · Geist (${all().filter(e => window.v3IsMindOrBreath(e)).length + (DB.ALL_MIND_MODULES?.length || 0)})</button>
        </div>
        <h2>💪 Body · Körper-Übungen</h2>
        <input placeholder="Suchen: Name, Beschwerde, #Hashtag oder Ziel (z. B. Squat, Knie, Rücken)" value="${esc(eq)}" oninput="eq=this.value;lib2()">
        <div class="r sc" style="margin:8px 0">
          ${bodyCats.map(c => `<button class="chip ${cat === c ? 'on' : ''}" onclick="cat='${c}';sub='Alle';render()">${c}</button>`).join('')}
        </div>
        ${(cat === 'Fitnessstudio' || cat === 'Atmen') ? `
          <div class="r sc" style="margin:0 0 8px">
            ${(cat === 'Atmen' ? ['Alle', 'Beruhigung', 'Konzentration', 'Energie', 'Schlaf'] : ['Alle', 'Ausdauer', 'Krafttraining']).map(s => `<button class="chip ${sub === s ? 'on' : ''}" onclick="sub='${s}';render()">${s}</button>`).join('')}
          </div>` : ''}
        <div class="r sc" style="margin:0 0 8px">
          <span class="mu" style="flex:none">Körperregion:</span>
          ${['Alle Regionen', ...Object.keys(REG)].map(r => `<button class="chip ${reg === r ? 'on' : ''}" onclick="reg='${r}';render()">${r}</button>`).join('')}
        </div>
        <button class="b g" onclick="cf=!cf;render()">+ Eigene Body-Übung</button>
        ${cf ? cForm() : ''}
        <div id="ll">${libList(list)}</div>`;
    }

    // MIND-ANSICHT
    const s = eq.toLowerCase();
    const mindCats = ['Alle', 'Denkfehler', 'Alltags-Hürden', 'Mentales Training', 'Wissens-Module', 'Atmen'];
    if (!mindCats.includes(cat)) cat = 'Alle';

    const latestEval = S.mindState.evaluations[0];
    const topDriverName = latestEval?.dominantDrivers?.[0] ? DB.STRESS_DRIVER_INFO?.[latestEval.dominantDrivers[0]]?.name : '';

    const list = all().filter(e => {
      if (cat === 'Wissens-Module') return false;
      const isMindItem = window.v3IsMindOrBreath(e);
      if (!isMindItem) return false;
      if (cat !== 'Alle' && e.c !== cat) return false;
      return !s || v281Search(e, s);
    });

    return `
      <div class="v3-domain-switch">
        <button type="button" class="chip" onclick="v3GoDomain('body')">💪 Body · Körper (${all().filter(e => !window.v3IsMindExercise(e)).length})</button>
        <button type="button" class="chip on" onclick="v3GoDomain('mind')">🧠 Mind · Geist (${all().filter(e => window.v3IsMindOrBreath(e)).length + (DB.ALL_MIND_MODULES?.length || 0)})</button>
      </div>
      <h2>🧠 Mind · Mentales Training & Klarheit</h2>

      <div class="r" style="gap:8px;margin:8px 0">
        <button type="button" class="b" style="flex:1" onclick="v3OpenQuickCheckModal()">⚡ Situations-Quick-Check</button>
        <button type="button" class="b g" style="flex:1" onclick="v3OpenMindAssessment()">🧭 ${latestEval ? 'Antreiber-Check (' + esc(topDriverName) + ')' : 'Einstiegs-Check starten'}</button>
      </div>

      <input placeholder="Suchen: Katastrophisieren, Nein sagen, Gespräch, 21 Uhr, #denkfehler..." value="${esc(eq)}" oninput="eq=this.value;lib2()">
      <div class="r sc" style="margin:8px 0">
        ${mindCats.map(c => `<button class="chip ${cat === c ? 'on' : ''}" onclick="cat='${c}';sub='Alle';render()">${c}</button>`).join('')}
      </div>

      ${renderMindJournalCard()}
      ${cat !== 'Wissens-Module' ? `<h3 style="margin:14px 0 6px">🎯 Interaktive Praxis-Drills (${list.length})</h3><div id="ll">${libList(list)}</div>` : '<div id="ll"></div>'}
      ${(cat === 'Alle' || cat === 'Wissens-Module') ? renderMindModulesSection(s) : ''}`;
  };

  lib2 = function () {
    const s = eq.toLowerCase();
    const el = document.getElementById('ll');
    if (!el) return;
    if (S.ui.libDomain === 'mind') {
      const list = cat === 'Wissens-Module' ? [] : all().filter(e => {
        const isMindItem = window.v3IsMindOrBreath(e);
        if (!isMindItem) return false;
        if (cat !== 'Alle' && e.c !== cat) return false;
        return !s || v281Search(e, s);
      });
      el.innerHTML = libList(list);
    } else {
      const list = all().filter(e =>
        !window.v3IsMindExercise(e) &&
        (cat === 'Alle' || e.c === cat) &&
        subOk(e) &&
        inReg(e, reg) &&
        (!s || v281Search(e, s))
      );
      el.innerHTML = libList(list);
    }
  };

  const _prevDetTxtMind = detTxt;
  detTxt = function (e) {
    const html = _prevDetTxtMind(e);
    if (!window.v3IsMindExercise(e)) return html;
    return `
      <div class="v3-mind-cta-box">
        <div class="r" style="justify-content:space-between;align-items:center">
          <div>
            <b>🧠 Interaktiver Situations-Coach</b>
            <div class="mu" style="font-size:12px">Deine Situation eingeben ➔ Analyse & Umbau ➔ Leitsatz & Timer</div>
          </div>
          <button type="button" class="b" onclick="v3OpenMindDrill('${e.id}')">🧠 Drill starten</button>
        </div>
      </div>` + html;
  };

  // --- 10. HOME-INTEGRATION (ZUSATZ-KACHELN & PLAN-DRILL-BUTTONS) ---
  const _prevVTodayMind = vToday;
  vToday = function () {
    const html = _prevVTodayMind();
    const dt = iso(new Date());
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    // 1. Bei Mind-Übungen im Plan direkt den Button „🧠 Situations-Drill“ einblenden
    const titles = tpl.content.querySelectorAll('b[onclick^="tg(\'"]');
    titles.forEach(bEl => {
      const m = (bEl.getAttribute('onclick') || '').match(/^tg\('([^']+)_(\d+)'\)$/);
      if (!m) return;
      const pid = m[1];
      const idx = Number(m[2]);
      const p = S.plans.find(x => x.id === pid);
      const e = ex(p?.items?.[idx]?.ex);
      if (!e || !window.v3IsMindExercise(e)) return;

      if (!bEl.textContent.includes('🧠')) bEl.innerHTML = '🧠 ' + bEl.innerHTML;

      const container = bEl.closest('.r')?.parentElement;
      const setBtn = container?.querySelector('button.set');
      const actionRow = setBtn?.parentElement;
      if (!actionRow) return;

      const drillBtn = document.createElement('button');
      drillBtn.type = 'button';
      drillBtn.className = 'b';
      drillBtn.style.cssText = 'padding:6px 12px;min-height:38px;font-size:13px';
      drillBtn.setAttribute('onclick', `v3OpenMindDrill('${e.id}','${dt}','${pid}',${idx})`);
      drillBtn.innerHTML = '🧠 Situations-Drill';
      actionRow.appendChild(drillBtn);
    });

    // 2. Fallback falls mindImpulse noch nicht über den nativen app.js Slot gerendert wurde
    const showMindImpulse = S.homeVisible?.mindImpulse !== false && S.ui?.homeVisible?.mindImpulse !== false;
    if (showMindImpulse && !tpl.content.querySelector('section[data-module="mindImpulse"]')) {
      const mindSec = document.createElement('section');
      mindSec.className = 'home-module home-section';
      mindSec.setAttribute('data-module', 'mindImpulse');
      mindSec.innerHTML = renderHomeMindCardsHtml();
      const planSec = tpl.content.querySelector('section[data-module="plans"]');
      if (planSec) planSec.after(mindSec);
      else tpl.content.prepend(mindSec);
    }

    return tpl.innerHTML;
  };

  if (typeof window.organizeHome === 'function') {
    const _prevOrganizeHome = window.organizeHome;
    window.organizeHome = function () {
      _prevOrganizeHome();
      const appEl = document.getElementById('app');
      if (!appEl || tab !== 'today') return;
      const order = Array.isArray(S.homeOrder) ? S.homeOrder : [];
      const secs = [...appEl.querySelectorAll(':scope > [data-module]')];
      secs.forEach(sec => {
        const k = sec.getAttribute('data-module');
        if (S.homeVisible && S.homeVisible[k] === false) sec.remove();
      });
      const rem = [...appEl.querySelectorAll(':scope > [data-module]')];
      if (rem.length > 1 && order.length) {
        rem.sort((a, b) => {
          const ia = order.indexOf(a.getAttribute('data-module'));
          const ib = order.indexOf(b.getAttribute('data-module'));
          return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        });
        const extras = appEl.querySelector(':scope > .home-extras');
        rem.forEach(sec => {
          if (extras) extras.before(sec);
          else appEl.appendChild(sec);
        });
      }
    };
  }

  // --- 11. BODY / MIND UMSCHALTER UNTER „PLÄNE“ (vPlans) ---
  window.v3SetPlanDomain = function (dom) {
    S.ui.planDomain = dom === 'mind' ? 'mind' : 'body';
    save();
    render();
  };

  window.v3AddMindPlanTemplate = function (idx) {
    const tpl = MIND_CURATED_PLANS[idx];
    if (!tpl) return;
    S.plans.push({
      id: 'p' + Date.now() + idx,
      name: tpl.name,
      days: tpl.days.slice(),
      pw: tpl.pw || 3,
      items: JSON.parse(JSON.stringify(tpl.items)),
      level: 'Anfänger'
    });
    save();
    toast(`🧠 Plan „${tpl.name}“ zu deinen Plänen hinzugefügt!`);
    render();
  };

  const _prevVPlansMind = vPlans;
  vPlans = function () {
    const html = _prevVPlansMind();
    if (ed) return html;

    const planDom = S.ui.planDomain === 'mind' ? 'mind' : 'body';
    const switchHtml = `
      <div class="v3-domain-switch">
        <button type="button" class="chip ${planDom === 'body' ? 'on' : ''}" onclick="v3SetPlanDomain('body')">💪 Body · Trainingspläne</button>
        <button type="button" class="chip ${planDom === 'mind' ? 'on' : ''}" onclick="v3SetPlanDomain('mind')">🧠 Mind · Mental- & Gewohnheitspläne</button>
      </div>`;

    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    // 1. Domain-Umschalter ganz oben auf der Pläne-Seite einfügen
    const switchWrap = document.createElement('template');
    switchWrap.innerHTML = switchHtml;
    tpl.content.prepend(...switchWrap.content.children);

    if (planDom === 'body') {
      // Im Body-Modus bleiben "Meine Pläne" + "Kuratierte Trainingspläne" + "Weitere Trainingspläne" sichtbar
      return tpl.innerHTML;
    }

    // Im Mind-Modus: Entferne die Body-Vorlagen ab "Kuratierte Trainingspläne" (bzw. "Weitere Trainingspläne" / "Liegestütz-Trainingsplan")
    const children = [...tpl.content.children];
    const curatedIdx = children.findIndex(el => el.tagName === 'H2' && /Kuratierte Trainingspläne|Curated workout plans/i.test(el.textContent || ''));
    if (curatedIdx >= 0) {
      for (let i = curatedIdx; i < children.length; i++) {
        children[i].remove();
      }
    } else {
      children.forEach(el => {
        const txt = el.querySelector?.('h3')?.textContent || '';
        if (/Weitere Trainingspläne|More workout plans|Liegestütz-Trainingsplan/i.test(txt)) {
          el.remove();
        }
      });
    }

    const latestEval = S.mindState.evaluations[0];
    const recIds = latestEval?.recommendedPlanIds || [];
    const habitPlans = (DB.MIND_PLANS || []).slice().sort((a, b) => {
      const aRec = recIds.includes(a.id) ? 1 : 0;
      const bRec = recIds.includes(b.id) ? 1 : 0;
      return bRec - aRec;
    });

    const mindPlansHtml = `
      <h2 style="margin-top:22px">🧠 BOND · 21–30 Tage Gewohnheits-Pläne (Mind)</h2>
      <p class="mu">Strukturierte Gewohnheits-Pläne mit täglichem Mikro-Drill auf Home und automatischer Auffrischung nach Abschluss.</p>
      ${habitPlans.map(mp => {
        const isRec = recIds.includes(mp.id);
        const isActive = !!S.mindState.activePlanProgress[mp.id];
        return `
          <div class="c" style="border-left:4px solid ${isRec ? 'var(--mc)' : 'var(--ac)'}">
            <div class="r" style="justify-content:space-between">
              <h3>${esc(mp.title)}</h3>
              <span class="chip ${isRec ? 'on' : ''}" style="font-size:11px;padding:3px 8px">${isRec ? '⭐ Für dich empfohlen' : `${mp.habitDurationDays} Tage`}</span>
            </div>
            <div class="mu" style="margin-top:4px">${esc(mp.subtitle)}</div>
            <div class="mu" style="margin-top:6px;font-size:12px">
              🔄 ${mp.habitDurationDays} Tage Aufbau · danach alle ${mp.postPlanReminderIntervalDays} Tage Auffrischung · Drills:
              <b>${(mp.drills || []).map(d => d.title).join(' · ')}</b>
            </div>
            <div class="r" style="margin-top:10px">
              <button type="button" class="b ${isActive ? 'g' : ''}" onclick="v3ActivateHabitMindPlan('${mp.id}')">
                ${isActive ? '✓ Aktiv (Auf Home anzeigen)' : `+ ${mp.habitDurationDays}-Tage-Gewohnheit starten`}
              </button>
            </div>
          </div>`;
      }).join('')}

      <h2 style="margin-top:22px">🗣️ BOND · Fokus- & Alltags-Routinen (Mind)</h2>
      ${MIND_CURATED_PLANS.map((mp, idx) => `
        <div class="c" style="border-left:4px solid var(--ac)">
          <div class="r" style="justify-content:space-between">
            <h3>${esc(mp.name)}</h3>
            <span class="chip" style="font-size:11px;padding:3px 8px">🧠 Mind</span>
          </div>
          <div class="mu" style="margin-top:4px">${esc(mp.desc)}</div>
          <div class="mu" style="margin-top:6px;font-size:12px">
            📅 ${mp.days.length ? mp.days.map(d => DAYS[d]).join(', ') : mp.pw + '× pro Woche (flexibel)'} ·
            <b>${mp.items.map(it => ex(it.ex)?.n || it.ex).join(' · ')}</b>
          </div>
          <div class="r" style="margin-top:10px">
            <button type="button" class="b g" onclick="v3AddMindPlanTemplate(${idx})">+ Mental-Plan übernehmen</button>
          </div>
        </div>
      `).join('')}`;

    const wrap = document.createElement('template');
    wrap.innerHTML = mindPlansHtml;
    tpl.content.appendChild(wrap.content);

    return tpl.innerHTML;
  };


  // =========================================================================
  // 12. ZENTRALE DE / EN ÜBERSETZUNGS-ENGINE (AUS data/translations.json)
  // =========================================================================
  const DAY_DE_TO_EN = { 'Mo': 'Mon', 'Di': 'Tue', 'Mi': 'Wed', 'Do': 'Thu', 'Fr': 'Fri', 'Sa': 'Sat', 'So': 'Sun' };

  function translateDynamicPattern(str) {
    let s = str;
    // Home header: "Home, Di 17.11.2026"
    s = s.replace(/^Home,\s*(Mo|Di|Mi|Do|Fr|Sa|So)\b/, (_, d) => `Home, ${DAY_DE_TO_EN[d] || d}`);
    // Counts & progress
    s = s.replace(/(\d+)\s+von\s+(\d+)\s+heute erledigt/g, '$1 of $2 completed today');
    s = s.replace(/(\d+)\s+von\s+(\d+)\s+Einheiten/g, '$1 of $2 sessions');
    s = s.replace(/(\d+)\s+von\s+(\d+)\s+Jokern frei/g, '$1 of $2 jokers left');
    s = s.replace(/(\d+)\s+von\s+(\d+)/g, '$1 of $2');
    s = s.replace(/(\d+)%\s+geschafft/g, '$1% completed');
    s = s.replace(/✓\s*Fertig für heute/g, '✓ Done for today');
    s = s.replace(/(\d+)\s+Übungen/g, '$1 exercises');
    s = s.replace(/(\d+)×\s+pro Woche\s*\(flexibel\)/g, '$1× per week (flexible)');
    s = s.replace(/(\d+)×\s+pro Woche/g, '$1× per week');
    s = s.replace(/✓\s*(\d+)×\s*absolviert\s*·\s*✗\s*(\d+)×\s*ausgelassen/g, '✓ $1× completed · ✗ $2× skipped');
    s = s.replace(/(\d+)×\s*erledigt/g, '$1× completed');
    s = s.replace(/Letzter Wert:\s*/g, 'Last entry: ');
    s = s.replace(/Letztes Mal\s*\(/g, 'Last time (');
    s = s.replace(/Diese Woche:/g, 'This week:');
    s = s.replace(/Wochenziel erreicht/g, 'Weekly goal reached');
    s = s.replace(/·\s*noch\s+(\d+)/g, '· $1 left');
    s = s.replace(/Für heute ist kein Training fällig\.\s*Du hast\s+(\d+)\s+aktive Pläne\./g, 'No workout due today. You have $1 active plans.');
    s = s.replace(/Body\s*·\s*Körper\s*\((\d+)\)/g, 'Body ($1)');
    s = s.replace(/Mind\s*·\s*Geist\s*\((\d+)\)/g, 'Mind ($1)');
    s = s.replace(/Interaktive Praxis-Drills\s*\((\d+)\)/g, 'Interactive practice drills ($1)');
    s = s.replace(/Wissens-\s*&\s*Deep-Dive-Module\s*\((\d+)\)/g, 'Knowledge & deep-dive modules ($1)');
    s = s.replace(/Mein Mental-Logbuch\s*\((\d+)\s+Einträge\)/g, 'My mental journal ($1 entries)');
    s = s.replace(/BOND\s*·\s*21–30 Tage Gewohnheits-Pläne\s*\(Mind\)/g, 'BOND · 21–30 Day Habit Plans (Mind)');
    s = s.replace(/BOND\s*·\s*Fokus-\s*&\s*Alltags-Routinen\s*\(Mind\)/g, 'BOND · Focus & Everyday Routines (Mind)');
    s = s.replace(/\+\s*(\d+)-Tage-Gewohnheit starten/g, '+ Start $1-day habit plan');
    s = s.replace(/✓\s*Aktiv\s*\(Auf Home anzeigen\)/g, '✓ Active (Shown on Home)');
    s = s.replace(/⭐\s*Für dich empfohlen/g, '⭐ Recommended for you');
    s = s.replace(/(\d+)\s+Tage Aufbau\s*·\s*danach alle\s+(\d+)\s+Tage Auffrischung\s*·\s*Drills:/g, '$1 days build-up · then refresh every $2 days · Drills:');
    s = s.replace(/Tag\s+(\d+)\/(\d+)\s*\((\d+)%\)/g, 'Day $1/$2 ($3%)');
    s = s.replace(/Heutiger Drill:/g, "Today's drill:");
    s = s.replace(/▶\s*Heutigen Mind-Drill starten/g, "▶ Start today's Mind drill");
    s = s.replace(/✓\s*Heute erledigt\s*\(Nochmal üben\)/g, '✓ Done today (Practice again)');
    s = s.replace(/Erlaubnissatz für Antreiber/g, 'Permission thought for driver');
    s = s.replace(/Aktivitäts-Heatmap\s*\(Letzte\s+(\d+)\s+Wochen\)/g, 'Activity heatmap (Last $1 weeks)');
    s = s.replace(/(\d+)\s+aktive Tage/g, '$1 active days');
    s = s.replace(/(\d+)\/(\d+)\s+Joker frei/g, '$1/$2 jokers left');
    s = s.replace(/(\d+)\s+Wo\./g, '$1 wks');
    s = s.replace(/Zuletzt trainiert:/g, 'Last workout:');
    s = s.replace(/Noch kein Training erfasst/g, 'No workout recorded yet');
    s = s.replace(/(\d+)\s+Buchungen/g, '$1 bookings');
    s = s.replace(/offen\s*·/g, 'open ·');
    s = s.replace(/Satz\s+(\d+)\s+von\s+(\d+)/g, 'Set $1 of $2');
    s = s.replace(/Runde\s+(\d+)\/(\d+)/g, 'Round $1/$2');
    s = s.replace(/Schritt\s+(\d+)\s+von\s+(\d+)/g, 'Step $1 of $2');
    s = s.replace(/Angesprochen:/g, 'Targeted:');
    s = s.replace(/Beansprucht \(orange\):/g, 'Targeted muscles (orange):');
    s = s.replace(/Auch bekannt als:/g, 'Also known as:');
    s = s.replace(/Admin:\s*Übungskatalog-Studio\s*\((\d+)\s+Übungen\)/g, 'Admin: Exercise Catalog Studio ($1 exercises)');
    return s;
  }

  let _i18nBusy = false;
  let _cachedCatalogRef = null;
  let _cachedRevMap = {};

  function getCatalogReverseMap() {
    const catTrans = window.FITNESS_CATALOG?.translations;
    if (!catTrans || !catTrans.de || !catTrans.en) return {};
    if (_cachedCatalogRef === catTrans) return _cachedRevMap;
    const rev = {};
    for (const [k, deVal] of Object.entries(catTrans.de)) {
      if (typeof deVal === 'string' && typeof catTrans.en[k] === 'string') {
        rev[deVal] = catTrans.en[k];
      }
    }
    _cachedCatalogRef = catTrans;
    _cachedRevMap = rev;
    return rev;
  }

  window.v3ApplyFullI18N = function (customRoot) {
    document.documentElement.lang = S.lang === 'en' ? 'en' : 'de';
    if (S.lang !== 'en' || _i18nBusy) return;
    _i18nBusy = true;

    try {
      const catTrans = window.FITNESS_CATALOG?.translations || {};
      const revCatalog = getCatalogReverseMap();
      const phMap = catTrans.placeholders || {};

      const roots = customRoot
        ? [customRoot]
        : [
            document.getElementById('app'),
            document.getElementById('v27Overlay'),
            document.getElementById('v3PlayerOv'),
            document.getElementById('v3PhaseOv'),
            document.getElementById('brov'),
            document.getElementById('tmr')
          ].filter(Boolean);

      // 1. <option>-Werte absichern + placeholder, title & aria-label aus data/translations.json übersetzen
      roots.forEach(rt => {
        rt.querySelectorAll?.('option').forEach(opt => {
          if (!opt.hasAttribute('value')) {
            opt.setAttribute('value', (opt.textContent || '').trim());
          }
        });
        rt.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el => {
          ['placeholder', 'title', 'aria-label'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (!val) return;
            if (phMap[val]) {
              el.setAttribute(attr, phMap[val]);
            } else if (revCatalog[val]) {
              el.setAttribute(attr, revCatalog[val]);
            }
          });
        });
      });

      // 2. Alle Textknoten über data/translations.json übersetzen (inkl. Emoji-Prefix & dynamischer Muster)
      const emojiPrefixRegex = /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}✓✗★☆▲▼▶⏸⏹⏭️🔄📋📤📥📦📱📲🗓️🛡️🃏⏸️▶️⚡🧠💪🏠📈⚖️🥁🌬️🌿🎯🌙🔒🛠️🎨🏋️🦵🔥🖨️🖼️💬🔴🟠🟡🟢🏆⏳ℹ️📓📖🧭🪜☑️✅❌💡📌💼🔍🗣️⭐]+\s*)/u;

      roots.forEach(rt => {
        const walker = document.createTreeWalker(rt, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
          const parentTag = node.parentElement?.tagName;
          if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'CODE' || parentTag === 'TEXTAREA') continue;

          const raw = node.nodeValue;
          if (!raw || !raw.trim()) continue;
          const trimmed = raw.trim();

          // A) Direkter Treffer in data/translations.json
          const direct = revCatalog[trimmed];
          if (direct && direct !== trimmed) {
            node.nodeValue = raw.replace(trimmed, direct);
            continue;
          }

          // B) Treffer mit führendem Emoji/Symbol (z. B. "🎯 Aktivitäten & Routinen")
          const emMatch = trimmed.match(emojiPrefixRegex);
          if (emMatch) {
            const prefix = emMatch[1];
            const rest = trimmed.slice(prefix.length).trim();
            const mappedRest = revCatalog[rest];
            if (mappedRest && mappedRest !== rest) {
              node.nodeValue = raw.replace(trimmed, prefix + mappedRest);
              continue;
            }
          }

          // C) Dynamische Muster (Zahlen, Daten, Fortschritt, Sätze)
          const dyn = translateDynamicPattern(trimmed);
          if (dyn !== trimmed) {
            node.nodeValue = raw.replace(trimmed, dyn);
          }
        }
      });
    } finally {
      _i18nBusy = false;
    }
  };

  // Überschreibe applyI18N global, sodass alle Aufrufe die neue Voll-Engine nutzen
  window.applyI18N = function () {
    window.v3ApplyFullI18N();
    nav();
  };
  applyI18N = window.applyI18N;

  // Auch nach lib2() (Live-Suche) und v27Modal() automatisch übersetzen
  const _prevLib2I18N = lib2;
  lib2 = function () {
    _prevLib2I18N.apply(this, arguments);
    window.v3ApplyFullI18N();
  };

  if (typeof window.v27Modal === 'function') {
    const _prevV27ModalI18N = window.v27Modal;
    window.v27Modal = function () {
      const res = _prevV27ModalI18N.apply(this, arguments);
      window.v3ApplyFullI18N(document.getElementById('v27Overlay'));
      return res;
    };
    v27Modal = window.v27Modal;
  }

  // MutationObserver für dynamisch nachgeladene Overlays (Workout-Player, Phasen-Timer, Atem-Overlay)
  try {
    const i18nObserver = new MutationObserver(() => {
      if (S.lang === 'en' && !_i18nBusy) {
        window.v3ApplyFullI18N();
      }
    });
    i18nObserver.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}


  if (typeof render === 'function') {
    const _prevRenderMindBrand = render;
    render = function () {
      const res = _prevRenderMindBrand.apply(this, arguments);
      applyBondBrandingEverywhere();
      window.v3ApplyFullI18N();
      return res;
    };
  }

  render();
})();

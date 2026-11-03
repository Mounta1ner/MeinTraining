# Mein Training v2.4 – modularisiert

## Struktur
- `www/index.html`: HTML-Struktur und Bootstrapping
- `www/css/style.css`: komplettes Design
- `www/data/exercises.json`: Übungskatalog mit IDs, Beschreibungen, Atemübungen und Figuren
- `www/data/plans.json`: kuratierte Trainingspläne und Planvorlagen
- `www/data/translations.json`: DE/EN-Wörterbuch
- `www/js/loader.js`: lädt die JSON-Dateien bevor die App gestartet wird
- `www/js/app.js`: bestehende App-/Trainingsfunktionen
- `www/js/features.js`: zusätzliche Funktionen (Home, BMI, Widgets, i18n)

### Vorschau und Website
`index.html` nicht über `file://`/Doppelklick starten, weil JSON-Dateien per `fetch` geladen werden. Lokal z.B. `python3 -m http.server 8000 --directory www` und `http://localhost:8000` öffnen. Alternativ `www` als GitHub-Pages-Site publizieren. Falls das Repository-Root statt `www` veröffentlicht wird, GitHub Pages entsprechend konfigurieren oder statische Inhalte ins Root spiegeln.

### Android
`npm install`, `npx cap add android`, `npx cap sync android`, `python3 apply_native.py`. GitHub Actions enthält einen Debug-APK/AAB-Build. `webDir: www`: alle Daten und Skripte werden offline in das Android-Paket kopiert. Für Play Store benötigt man ein signiertes Release-AAB.

### Persistenz und Kompatibilität
Persönliche Daten liegen unverändert im `localStorage` unter `trainingsplan-v1` und werden nicht in den JSON-Katalog geschrieben. Gleichbleibende Übungs-IDs und Planvorlagen ermöglichen Migration, ohne bestehende Nutzerdaten absichtlich zurückzusetzen. Die Android-Widgets bleiben nativ.

### Inhaltspflege
Neue Übungen als JSON-Objekte mit eindeutiger `id` in `data/exercises.json` hinzufügen. Den gleichen Namen oder ID nicht überschreiben, sonst können ältere gespeicherte Pläne ins Leere zeigen. Vorlagen unter `data/plans.json` pflegen, Übersetzungen unter `data/translations.json`. Bei Webveröffentlichung reicht ein neuer Deploy. APKs müssen neu gebaut werden.

## Version 2.5: Erweiterte Funktionen
Intensitätsstufe beim Bearbeiten; schmaleres BPM-Metronom; Gewicht + / -; verpasste Einheiten und Aktivitäten (feste Tage + Wochenziel, kein automatisch verpasster Tag bei jederzeitiger Aktivität); freiwilliges Make me feel it; Zeitstempel-Historie und CSV-Export.
**Zählregeln:** Verpasste feste Tages-Termine ab dem Folgetag, Wochenfehlschläge erst nach Ende der Woche. Rückblick der verpassten Einheiten auf die letzten 365 Tage begrenzt. Vor Aktivierung des Spendenmodus werden Versäumnisse nicht nachträglich gebucht. Neu abgeschlossene Aktivitäten erhalten Zeitstempel, ältere Einträge behalten nur ihre bisherigen Summen/Tageszähler.
**Spendenmodus:** Historie der gebuchten Beträge wird beim Zurücksetzen als beglichen markiert, nicht gelöscht; der angezeigte offene Betrag enthält nur noch nicht beglichene Ereignisse. Keine Überweisungen werden aus der App ausgelöst. Browser-Speicherung ist best effort und keine Finanzbuchhaltung. Der Kopierbutton übernimmt die vom Entwickler bereitgestellte IBAN unverändert.
**Android:** Native 1x1 Widget-Ereignisse werden nach App-Öffnung importiert; für Play Store ist weiterhin eine echte Geräte- und Release-AAB-Prüfung notwendig.

## Version 2.6
- Original-Symbol als Launcher-Icon in fünf dpi-Stufen sowie Web-Favicon.
- Make me feel it: Auch abgeschlossene Aktivitäten legen sofort Einträge im Finanzjournal an, wenn ein positiver Betrag für Erledigt hinterlegt ist.
- Widget 1x1: beim Hinzufügen pro Instanz eine Aktivität auswählen. Separate Android Widget IDs werden einzeln gespeichert; Tippen schreibt die passende Aktivität in die native Ereigniswarteschlange.
- Bereits eingefügte ältere Widgets entfernen und nach dem Update neu hinzufügen. App zumindest einmal öffnen, damit die Aktivitätsliste an Android übertragen wird.

## Version 2.7 zusammengeführt, NICHT neu aufgebaut
Die Originaldateien aus v2.6 (`app.js`, `features.js`, `tracking-advanced.js`, `loader.js`, `exercises.json`, `plans.json`, `translations.json`, `style.css`) sind im Paket vorhanden; Funktionsänderungen liegen überwiegend in `www/js/v27.js`.

**Persönliche Daten:** Speicherort und Schlüssel `localStorage["trainingsplan-v1"]` sind unverändert. Ein vorhandenes Android-App-Update mit der gleichen applicationId sollte WebView-Daten grundsätzlich behalten. **Vor dem Test Entwicklungsstand sichern!** Deswegen 2.7 auf einem separaten GitHub-Branch testen und nicht App-Daten löschen.

**Neue Funktionen:** Home-Module getrennt schalt- und sortierbar, keine Datumsüberschrift/kein Impressum auf Home, Onboarding bei leerem Nutzerzustand, Einführungsplan (Liegestütz/Abfahrtshocke), Erfolgsmeldungen, Live-Liegestütz-Challenge, Meilensteine, Wochenstreaks, Pausentimer mit Go-Ton, lokales Android-Notification-Opt-In, FAQ/Datenschutzhinweise, native per-Widget-Aktivitätswahl und Designfarben.

**Workflow:** Neuen GitHub-Branch `development-v2.7` erstellen, gesamten ZIP-Inhalt ins Repo-Root hochladen (auch `.github/workflows/android.yml` und `pages.yml`). Unter **Actions** `Mein Training - Android APK/AAB` manuell auf `development-v2.7` ausführen. Entstehen bei Erfolg Debug APK und AAB; Google Play benötigt ein signiertes Release-AAB.

**Web:** Unter **Settings → Pages** `Source: GitHub Actions` wählen und den Workflow `Mein Training - Website Test` ausführen. Alternativ im Repo `python3 -m http.server 8000 --directory www`, dann `http://localhost:8000` öffnen. Direktes `file://` funktioniert wegen JSON-fetch nicht.

**Android 13+:** Die vier Erinnerungsarten sind bei Erststart AUS. Der Android-Dialog erscheint erst bei Aktivierung. Planungszeitraum 14 Tage, erneute Planung bei nächstem App-Start. Genauigkeit abhängig von Android-Akkuverwaltung; es sind lokale Erinnerungen, keine Cloud-Push-Benachrichtigungen. 

**Widgets:** Bei jedem 1×1-Widget ist durch Android-Konfiguration eine **separate Aktivität** auswählbar. Tippen erfasst einen Zeitstempel ohne Öffnen der App; Einträge werden beim nächsten Start importiert. 4×2 bleibt eine Planvorschau, die die App öffnet. Bestehende alte Widgets nach Update gegebenenfalls neu einrichten. Accent-Farbe der Widgetbeschriftung passt sich an; das Homescreen-Launcher-Icon kann Android nicht dynamisch über Web-CSS einfärben und bleibt das Originalmotiv.

**Qualität und Grenzen:** Tests mit Node prüfen Syntax, vorhandene 132 Übungs-IDs, fünf kuratierte und drei Standardpläne, JSON und Speicher-Key. Java-Compiler sowie echter UI-/Gerätetest müssen im GitHub-Workflow bzw. am Smartphone erfolgen. Die vollständige englische Übersetzung der alten, umfangreichen Übungsanleitungen ist noch nicht abgeschlossen. Die Trainings-Challenge nutzt vorsichtige allgemeine Zielstufen, kein medizinisches Reha-Protokoll. Android-Systemzeit und -Zeitzone bestimmen Datumswechsel und Erinnerungszeiten.

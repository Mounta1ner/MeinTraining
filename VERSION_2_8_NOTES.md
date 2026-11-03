# Mein Training 2.8 - Teststand

Weiterentwicklung aus den bereitgestellten v2.7-Quelldateien, kein Neubau.

## Implementiert
- Aktivitaeten-Tageszaehler, Suchfeld, Favoriten-Tracking und Einzeluebungsverlauf.
- Wiederholungszaehler auch in Plan-Saetzen, bei Abschluss wird der naechste Satz markiert.
- Make Me Feel It Einstellungen wieder eingeblendet, bestehende Finanzlogik weiterverwendet.
- Optionaler Liegestuetz-Trainingsplan mit fuenf unterschiedlichen Satzgroessen, Steigerung nach drei abgeschlossenen Einheiten.
- Android-Widget-Konfiguration mit verbessertem Abstand und Kontrast; Toast-Feedback als Best-Effort (Android kann Hintergrund-Toasts unterdruecken).
- Android/Web-Icons, Version 2.8, GitHub-Workflows fuer development-v2.8.

## Tests und Grenzen
- npm run verify prueft Syntax, Katalog, Vorlagen, Loader und Speicherschluessel.
- JSON- und ZIP-Integritaet werden zusaetzlich geprueft.
- Keine vollstaendigen Browser-Interaktionstests oder Android-Gradle-/Geraetetests in dieser Umgebung.
- Die native Widget-Konfiguration und Toasts muessen auf einem echten Android-Geraet getestet werden.
- Die neue Challenge-Progression ist eine allgemeine Beispiel-Logik, keine medizinische Empfehlung.
- Keine Migration oder Loeschung bestehender Daten; localStorage-Key trainingsplan-v1 bleibt erhalten.
- Vor Upgrade Sicherung exportieren und Branch development-v2.7 behalten.

## Farbschema-Icons
Das Header-Icon und Browser-Favicon wechseln mit Petrol/Gold/Orange. Android-Launcher-Icon und installierte PWA-Icons wechseln noch nicht dynamisch; diese benoetigen gesonderte native Integration bzw. Neuinstallation.

## Android-Launcher-Icon
Native Umschaltung zwischen Petrol/Gold/Orange ueber Android activity-alias integriert. Die MainActivity behaelt ihre Daten und Identitaet. Android-Launcher koennen Icons verzoegert aktualisieren. Auf einem echten Android-Geraet testen.

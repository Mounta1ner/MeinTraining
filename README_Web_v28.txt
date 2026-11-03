Mein Training 2.8: Web/iOS-Anpassung

Diese Dateien sind ein Patch fuer das bereits vorhandene vollstaendige GitHub-Paket
Mein_Training_v2_8_Dynamische_Android_Icons_GitHub.

Wichtig: Dies ist NICHT das gesamte App-Projekt.

Anwendung:
1. Bestehendes v2.8-GitHub-Paket auf dem PC entpacken.
2. apply_web_v28.py in den entpackten Projekt-Hauptordner kopieren.
3. Dort ausfuehren: python apply_web_v28.py
4. Die dadurch aktualisierten Projektdateien in den GitHub-Branch hochladen.

Geaendert werden:
- www/js/tracking-advanced.js (IBAN an zwei Stellen)
- www/index.html (iOS-Header und Skripteinbindung)
- www/css/ios-v28.css
- www/manifest.webmanifest
- www/version.json
- www/js/web-version-v28.js

Bestehende lokale Trainingsdaten werden nicht geloescht.
Der bisherige Service Worker wird nicht ersetzt. Bestehende Cache-Regeln muessen
vor einer Freigabe auf iOS und Android getestet werden.

Fuer die iOS-Installation muss www/assets/apple-touch-icon.png aus dem
bereits erzeugten v2.8-Gesamtpaket vorhanden sein.

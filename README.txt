Bine's KreativWerkstatt – Korrekturpaket

Enthaltene Dateien:
- index.html
- js/products.js
- js/shop.js
- kontakt.html
- js/contact.js
- js/email-service.js
- data/store.json

Kategorie-Buttons:
Die Shop-Filterung wurde angepasst, damit Kategorie-IDs aus store.json berücksichtigt werden. Für „3D Druck“ und „Sublimation“ gibt es ergänzende Sammelregeln.

Kontaktformular:
contact.js übergibt Name und E-Mail unter mehreren gebräuchlichen EmailJS-Variablennamen.

WICHTIG für EmailJS:
Damit der Name in der empfangenen E-Mail sichtbar ist, muss das EmailJS-Template diese Variablen verwenden:
- From Name: {{from_name}} (oder {{sender_name}})
- Reply To: {{reply_to}}
- Inhalt: {{subject}}, {{message}}, {{phone}}, {{sent_at}}

Das Template kann nicht automatisch durch diese Website-Dateien geändert werden. Bitte in EmailJS kontrollieren, dass die Variablen im E-Mail-Template eingebunden sind.

Installation:
1. ZIP entpacken.
2. Dateien in die entsprechenden Pfade des GitHub-Repositorys kopieren und ersetzen.
3. Commit/Push auf den Branch main.
4. Nach dem Deploy die Seite neu laden (ggf. Strg+F5).

Die Änderungen sind noch nicht auf GitHub veröffentlicht.

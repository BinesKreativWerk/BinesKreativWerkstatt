# Bine's KreativWerkstatt – GitHub Pages

Dieses Projekt ist für GitHub Pages vorbereitet.

## Veröffentlichung

1. Ein neues GitHub-Repository anlegen, z. B. `BineKreativWerkstatt`.
2. Den kompletten Inhalt dieses Ordners in das Repository hochladen.
3. Auf den Branch `main` committen.
4. Unter **Settings → Pages** als Quelle **GitHub Actions** auswählen, falls GitHub das nicht automatisch gesetzt hat.
5. Nach dem erfolgreichen Workflow erscheint die öffentliche Pages-Adresse.

Eine fertige Workflow-Datei liegt unter `.github/workflows/pages.yml`.

## Wichtig

- Der GitHub-Token für das Admin-Login steht **nicht** im Projekt.
- EmailJS-Schlüssel werden erst in `js/email-config.js` eingetragen.
- Der EmailJS Public Key darf bei einer statischen Website öffentlich sein; private Geheimnisse gehören nicht in das Repository.
- `server.py` wird für die lokale Vorschau in PyCharm verwendet und ist für GitHub Pages nicht erforderlich.

## Lokale Vorschau

In PyCharm `server.py` starten und anschließend die angezeigte lokale Adresse öffnen.

## Admin


## Versand nach Gewicht
Jeder Artikel besitzt `weightGrams`. Im Admin unter **Produkte** das Gewicht in Gramm eintragen. Unter **Versand** können je Versandart Gewichtsgruppen definiert werden, z. B. `500=4.95`, `1000=6.95`, `*=9.95`. Das Gesamtgewicht aller Mengen bestimmt automatisch die Versandstufe; kostenloser Versand ab Bestellwert bleibt zusätzlich möglich.

# Bine's KreativWerkstatt – GitHub Pages mit Website-Admin

## Shop veröffentlichen
1. Alle Dateien dieses Ordners in das Repository `Bine's KreativWerkstatt/Bine's KreativWerkstatt-Shop` hochladen.
2. GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**.
3. Shop: `https://bine-kreativwerkstatt.github.io/Bine's KreativWerkstatt-Shop/`
4. Admin: `https://bine-kreativwerkstatt.github.io/Bine's KreativWerkstatt-Shop/admin/`

## Admin einmalig einrichten
Der Adminbereich arbeitet direkt mit der GitHub Contents API. Es wird kein Passwort im Shopcode gespeichert.

1. GitHub öffnen → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Einen neuen Token nur für `Bine's KreativWerkstatt/Bine's KreativWerkstatt-Shop` erstellen.
3. Repository permission **Contents: Read and write** auswählen.
4. Token kopieren.
5. `/admin/` öffnen und Token einfügen.

Der Token wird nur in `sessionStorage` gespeichert und beim Schließen des Tabs/Abmelden entfernt. Niemals den Token in Dateien oder Commits eintragen.

## Im Adminbereich möglich
- Produkte hinzufügen, duplizieren und löschen
- Produktname, Beschreibung, Kategorie, Preis, Bestand, SKU und Sortierung ändern
- Produkt sichtbar/unsichtbar schalten
- Personalisierbar und hervorgehoben einstellen
- mehrere Produktbilder direkt hochladen und entfernen
- Gutscheincodes als Prozent, Eurobetrag oder Gratisversand verwalten
- Hermes- und DHL-Kosten sowie Freigrenzen ändern
- Shoptexte und Weiterleitungs-E-Mail ändern
- alle Änderungen mit einem Klick veröffentlichen

## E-Mail-Versand mit EmailJS
Die Weiterleitungsadresse ist standardmäßig:

`[DEINE E-MAIL-ADRESSE]`

Sie kann im Admin unter **Shop & E-Mail** geändert werden. Zusätzlich müssen einmalig in `js/email-config.js` die EmailJS-Werte eingetragen werden:

```js
window.EMAILJS_CONFIG = {
  publicKey: "DEINE_PUBLIC_KEY",
  serviceId: "DEINE_SERVICE_ID",
  contactTemplateId: "DEINE_KONTAKT_TEMPLATE_ID",
  orderTemplateId: "DEINE_BESTELL_TEMPLATE_ID",
  shopEmail: "[DEINE E-MAIL-ADRESSE]"
};
```

In beiden EmailJS-Templates muss als Empfänger die Variable `{{to_email}}` verwendet werden.

## PyCharm
Das Projekt kann weiterhin in PyCharm bearbeitet werden. Zum lokalen Testen `index.html` über **Open in Browser** starten. Da `data/store.json` per `fetch()` geladen wird, nicht per Doppelklick als `file://` öffnen.

## Hinweis zu Bestellungen
Der statische Shop sendet Bestellanfragen per EmailJS. Er speichert keine Bestellungen zentral in einer Datenbank. Für eine echte Bestellverwaltung mit Zahlungsstatus wäre später ein Datenbankdienst erforderlich.

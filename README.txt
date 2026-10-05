Bine’s KreativWerkstatt – Produktverwaltung komplett

Im Produkt-Editor sind jetzt alle vier Funktionen zusammen:
- ⭐ Hauptbild auswählen: Dieses Bild erscheint direkt in der Shop-Übersicht.
- 🗑️ Einzelnes Produktbild löschen: Nur das ausgewählte Bild wird entfernt.
- ➕ Mehrere neue Produktbilder hinzufügen.
- 🗑️ Komplettes Produkt löschen: mit Sicherheitsabfrage.

Ablauf:
1. Im Admin Produkt bearbeiten.
2. Hauptbild markieren oder Bilder hinzufügen.
3. Einzelne Bilder können mit „🗑️ Bild löschen“ entfernt werden.
4. Ein Produkt kann mit „Produkt löschen“ entfernt werden.
5. Danach oben „Änderungen veröffentlichen“ drücken.

Bilddateien, die nicht mehr von einem Produkt verwendet werden, werden beim Veröffentlichen
auch aus assets/products/ entfernt. Wird ein Bild noch von einem anderen Produkt verwendet,
wird es nicht gelöscht.

Bitte ersetzen:
- admin/admin.js
- js/product.js
- js/shop.js

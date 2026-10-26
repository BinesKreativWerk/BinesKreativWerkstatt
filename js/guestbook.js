
"use strict";

const GUESTBOOK_API = "https://bines-gaestebuch.dornheim.workers.dev/entries";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

async function getEntries() {
  const response = await fetch(GUESTBOOK_API, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Die Gästebucheinträge konnten nicht geladen werden.");
  }

  const data = await response.json();
  return Array.isArray(data.entries) ? data.entries : [];
}

async function addGuestEntry() {
  const nameField = document.getElementById("guest-name");
  const messageField = document.getElementById("guest-message");

  const name = nameField?.value.trim();
  const message = messageField?.value.trim();

  if (!name || !message) {
    alert("Bitte Name und Nachricht eintragen.");
    return;
  }

  if (name.length > 80 || message.length > 3000) {
    alert("Der Name darf höchstens 80 und die Nachricht höchstens 3000 Zeichen haben.");
    return;
  }

  try {
    const response = await fetch(GUESTBOOK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, message })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.details || result.error ||
        "Dein Eintrag konnte nicht gespeichert werden."
      );
    }

    nameField.value = "";
    messageField.value = "";

    alert(
      result.message ||
      "Vielen Dank! Dein Eintrag wartet auf Freigabe."
    );

    await renderGuestbook();
  } catch (error) {
    console.error("Gästebuch-Fehler:", error);
    alert(
      "Der Eintrag konnte nicht gesendet werden. " +
      "Bitte prüfe deine Internetverbindung oder versuche es später erneut."
    );
  }
}

async function renderGuestbook() {
  const box = document.getElementById("guestbook-list");
  if (!box) return;

  box.innerHTML = '<p class="muted">Gästebucheinträge werden geladen …</p>';

  try {
    const entries = await getEntries();

    box.innerHTML = entries.length
      ? entries.map(entry => `
          <article class="guest-entry">
            <b>${escapeHtml(entry.name)}</b>
            <small>${escapeHtml(entry.date || "")}</small>
            <p>${escapeHtml(entry.text ?? entry.message ?? "")}</p>
          </article>
        `).join("")
      : '<p class="muted">Noch keine freigegebenen Gästebucheinträge vorhanden.</p>';
  } catch (error) {
    console.error("Gästebuch-Ladefehler:", error);
    box.innerHTML =
      '<p class="muted">Das Gästebuch ist momentan nicht erreichbar. Bitte versuche es später erneut.</p>';
  }
}

document.addEventListener("DOMContentLoaded", renderGuestbook);

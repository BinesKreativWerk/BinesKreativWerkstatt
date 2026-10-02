"use strict";

function showContactStatus(message, type) {
  const status = document.getElementById("contact-status");
  if (!status) return;
  status.textContent = message;
  status.className = "form-status" + (type ? " " + type : "");
}

async function submitContactForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const originalText = button?.textContent || "Nachricht senden";

  if (!window.BineMail) {
    showContactStatus("Der E-Mail-Dienst ist auf dieser Seite nicht geladen. Bitte die Seite neu laden.", "error");
    return;
  }

  const name = document.getElementById("contact-name")?.value.trim() || "";
  const email = document.getElementById("contact-email")?.value.trim() || "";
  const phone = document.getElementById("contact-phone")?.value.trim() || "";
  const subject = document.getElementById("contact-subject")?.value.trim() || "";
  const message = document.getElementById("contact-message")?.value.trim() || "";

  if (!name || !email || !subject || !message) {
    showContactStatus("Bitte alle Pflichtfelder ausfüllen.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Wird gesendet …";
  showContactStatus("", "");

  const params = {
    from_name: name,
    reply_to: email,
    phone,
    subject,
    message,
    sent_at: new Date().toLocaleString("de-DE")
  };

  try {
    await window.BineMail.sendContact(params);
    form.reset();
    showContactStatus("Anfrage wurde erfolgreich gesendet. Vielen Dank!", "success");
  } catch (error) {
    console.error("EmailJS Fehler bei der Preisanfrage/Kontaktanfrage:", error);
    const reason = error?.text || error?.message || "Unbekannter EmailJS-Fehler";
    showContactStatus("Die Anfrage konnte nicht gesendet werden. EmailJS meldet: " + reason, "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productName = params.get("anfrage");
  if (!productName) return;

  const subject = document.getElementById("contact-subject");
  const message = document.getElementById("contact-message");
  if (subject && !subject.value) subject.value = `Preisanfrage: ${productName}`;
  if (message && !message.value) {
    message.value = `Ich interessiere mich für das Produkt „${productName}“ und möchte gerne den Preis erfahren.`;
  }
});

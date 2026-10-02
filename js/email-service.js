"use strict";

(function () {
  function getConfig() {
    return window.EMAILJS_CONFIG || {};
  }

  function isConfigured() {
    const c = getConfig();
    return Boolean(c.publicKey && c.serviceId);
  }

  function ensureReady(templateId) {
    if (!window.emailjs) {
      throw new Error("EmailJS konnte nicht geladen werden. Bitte die Internetverbindung prüfen oder die Seite neu laden.");
    }
    if (!isConfigured()) {
      throw new Error("EmailJS ist nicht konfiguriert. Bitte js/email-config.js prüfen.");
    }
    if (!templateId) {
      throw new Error("Die EmailJS-Template-ID fehlt in js/email-config.js.");
    }
  }

  function init() {
    const c = getConfig();
    if (!window.emailjs || !isConfigured()) return false;
    try {
      window.emailjs.init({ publicKey: c.publicKey });
      return true;
    } catch (e) {
      console.error("EmailJS Initialisierung fehlgeschlagen", e);
      return false;
    }
  }

  async function sendContact(params) {
    const c = getConfig();
    const contactTemplateId = "template_q4j1x73";
    ensureReady(contactTemplateId);
    // Die Kontakt-/Preisanfrage verwendet das neu erstellte EmailJS-Template.
    return window.emailjs.send(c.serviceId, contactTemplateId, params);
  }

  async function sendOrder(params) {
    const c = getConfig();
    ensureReady(c.orderTemplateId);
    return window.emailjs.send(c.serviceId, c.orderTemplateId, params);
  }

  window.BineMail = { init, isConfigured, sendContact, sendOrder, getConfig };
  document.addEventListener("DOMContentLoaded", init);
})();

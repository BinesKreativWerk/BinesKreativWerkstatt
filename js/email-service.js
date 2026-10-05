"use strict";

(function () {
  function getConfig() {
    return window.EMAILJS_CONFIG || {};
  }

  function isConfigured() {
    const c = getConfig();
    return Boolean(c.publicKey && c.serviceId && !String(c.publicKey).startsWith("DEINE_") && !String(c.serviceId).startsWith("DEINE_"));
  }

  function ensureReady(templateId) {
    if (!window.emailjs) {
      throw new Error("EmailJS konnte nicht geladen werden. Bitte Internetverbindung prüfen.");
    }
    if (!isConfigured()) {
      throw new Error("EmailJS ist nicht eingerichtet. Bitte js/email-config.js prüfen.");
    }
    if (!templateId || String(templateId).startsWith("DEINE_")) {
      throw new Error("Die passende EmailJS-Template-ID fehlt.");
    }
  }

  function init() {
    const c = getConfig();
    if (!window.emailjs || !isConfigured()) return false;
    window.emailjs.init({ publicKey: c.publicKey });
    return true;
  }

  async function sendContact(params) {
    const c = getConfig();
    // Kontakt- und Preisanfragen verwenden das aktuell eingerichtete Template.
    ensureReady("template_q4j1x73");
    return window.emailjs.send(c.serviceId, "template_q4j1x73", params);
  }

  async function sendOrder(params) {
    const c = getConfig();
    ensureReady(c.orderTemplateId);
    return window.emailjs.send(c.serviceId, c.orderTemplateId, params);
  }

  window.BineMail = { init, isConfigured, sendContact, sendOrder, getConfig };
  document.addEventListener("DOMContentLoaded", init);
})();

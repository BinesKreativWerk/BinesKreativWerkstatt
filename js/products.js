"use strict";

var products = [];
var shippingMethods = {};
var couponCodes = {};
var siteSettings = {};
window.BINE_STORE_READY = false;

async function loadStoreData() {
  try {
    const response = await fetch("data/store.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Shopdaten konnten nicht geladen werden (${response.status}).`);
    const data = await response.json();
    siteSettings = data.site || {};
    window.BINE_CATEGORIES = Array.isArray(data.categories) ? data.categories : [];
    products = (data.products || [])
      .filter(product => product.visible !== false)
      .map(product => ({ ...product, weightGrams: Math.max(0, Number(product.weightGrams) || 0) }))
      .sort((a, b) => (a.sort || 9999) - (b.sort || 9999));

    const shippingList = Array.isArray(data.shippingMethods) ? data.shippingMethods : [];
    shippingMethods = Object.fromEntries(shippingList.map(item => [item.key, {
      label: item.label,
      price: Number(item.price) || 0,
      freeFrom: Number(item.freeFrom) || 0,
      weightTiers: Array.isArray(item.weightTiers) ? item.weightTiers.map(t => ({
        maxGrams: t.maxGrams === null || t.maxGrams === '' ? null : Number(t.maxGrams),
        price: Number(t.price) || 0
      })).filter(t => t.price >= 0) : []
    }]));

    const couponList = Array.isArray(data.couponCodes) ? data.couponCodes : [];
    couponCodes = Object.fromEntries(couponList
      .filter(item => item.active !== false && item.code)
      .map(item => [String(item.code).trim().toUpperCase(), {
        type: item.type,
        value: Number(item.value) || 0,
        label: item.label || item.code
      }]));

    if (window.EMAILJS_CONFIG && siteSettings.contactEmail) {
      window.EMAILJS_CONFIG.shopEmail = siteSettings.contactEmail;
    }
    const shopName = document.getElementById("site-shop-name");
    const tagline = document.getElementById("site-tagline");
    const heroTitle = document.getElementById("site-hero-title");
    const heroText = document.getElementById("site-hero-text");
    const contactEmail = document.getElementById("site-contact-email");
    if (shopName && siteSettings.shopName) shopName.textContent = siteSettings.shopName;
    if (tagline && siteSettings.tagline) tagline.textContent = siteSettings.tagline;
    if (heroTitle && siteSettings.heroTitle) heroTitle.textContent = siteSettings.heroTitle;
    if (heroText && siteSettings.heroText) heroText.textContent = siteSettings.heroText;
    if (contactEmail && siteSettings.contactEmail) contactEmail.textContent = siteSettings.contactEmail;

    window.BINE_STORE_READY = true;
    window.dispatchEvent(new CustomEvent("bine-store-ready", { detail: data }));
  } catch (error) {
    console.error(error);
    const productList = document.getElementById("product-list");
    const detail = document.getElementById("product-detail");
    const message = '<div class="warning">Shopdaten konnten nicht geladen werden. Starte die Seite über PyCharms lokalen Webserver oder GitHub Pages.</div>';
    if (productList) productList.innerHTML = message;
    if (detail) detail.innerHTML = message;
  }
}

loadStoreData();

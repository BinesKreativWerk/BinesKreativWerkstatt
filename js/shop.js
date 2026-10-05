"use strict";

const CART_KEY = "bine_kreativwerkstatt_cart";
const SHIPPING_KEY = "bine_kreativwerkstatt_shipping";
const COUPON_KEY = "bine_kreativwerkstatt_coupon";
const FSK_KEY = "bine_kreativwerkstatt_fsk18_confirmed";
const FSK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let cart = readJson(CART_KEY, []);
let currentCategory = "Alle";

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function getProduct(id) {
  return products.find(product => product.id === Number(id));
}

function firstImage(product) {
  return product?.image || (Array.isArray(product?.images) ? product.images[0] : (typeof product?.images === "string" ? product.images.split(",").map(x => x.trim()).filter(Boolean)[0] : "")) || "assets/logo.png";
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(id, quantity = 1, note = "") {
  const product = getProduct(id);
  if (!product) return;
  if (product.priceOnRequest) {
    window.location.href = `kontakt.html?anfrage=${encodeURIComponent(product.name)}`;
    return;
  }
  if (Number(product.stock) <= 0) {
    alert("Dieser Artikel ist derzeit nicht verfügbar.");
    return;
  }
  if (product.category === "FSK 18" && !isFskConfirmed()) {
    requestFskAccess();
    return;
  }

  const requestedQty = Math.max(1, Number(quantity) || 1);
  const qty = Math.min(requestedQty, Math.max(1, Number(product.stock) || requestedQty));
  const cleanNote = String(note || "").trim();
  const existing = cart.find(item => item.id === product.id && item.note === cleanNote);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, qty, note: cleanNote });
  saveCart();
  openCart();
}

function changeQty(id, amount, encodedNote = "") {
  const note = decodeURIComponent(encodedNote || "");
  const item = cart.find(entry => entry.id === Number(id) && entry.note === note);
  if (!item) return;
  item.qty += Number(amount);
  if (item.qty <= 0) cart = cart.filter(entry => entry !== item);
  saveCart();
}

function removeItem(id, encodedNote = "") {
  const note = decodeURIComponent(encodedNote || "");
  cart = cart.filter(entry => !(entry.id === Number(id) && entry.note === note));
  saveCart();
}

function clearCart() {
  if (!cart.length) return;
  if (window.confirm("Warenkorb wirklich vollständig leeren?")) {
    cart = [];
    localStorage.removeItem(CART_KEY);
    renderCart();
  }
}

function openCart() {
  document.getElementById("cart")?.classList.remove("hidden");
  renderCart();
}

function closeCart() {
  document.getElementById("cart")?.classList.add("hidden");
}

function getShippingMethod() {
  return localStorage.getItem(SHIPPING_KEY) || "hermes";
}

function setShippingMethod(method) {
  if (!shippingMethods[method]) return;
  localStorage.setItem(SHIPPING_KEY, method);
  renderCart();
}

function getCoupon() {
  return (localStorage.getItem(COUPON_KEY) || "").trim().toUpperCase();
}

function applyCoupon() {
  const input = document.getElementById("coupon-code");
  const code = (input?.value || "").trim().toUpperCase();
  if (!code) {
    localStorage.removeItem(COUPON_KEY);
    renderCart();
    return;
  }
  if (!couponCodes[code]) {
    localStorage.removeItem(COUPON_KEY);
    renderCart();
    alert("Dieser Gutscheincode ist ungültig.");
    return;
  }
  localStorage.setItem(COUPON_KEY, code);
  renderCart();
  alert(`Gutscheincode ${code} wurde angewendet.`);
}

function clearCoupon() {
  localStorage.removeItem(COUPON_KEY);
  const input = document.getElementById("coupon-code");
  if (input) input.value = "";
  renderCart();
}

function calculateCart() {
  const validCart = cart.filter(item => {
    const product = getProduct(item.id);
    return product && !product.priceOnRequest;
  });
  if (validCart.length !== cart.length) {
    cart = validCart;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  const subtotal = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + Number(product?.price || 0) * item.qty;
  }, 0);

  const coupon = getCoupon();
  const couponData = couponCodes[coupon];
  let discount = 0;
  if (couponData?.type === "percent") discount = subtotal * couponData.value / 100;
  if (couponData?.type === "fixed") discount = couponData.value;
  discount = Math.min(subtotal, Math.max(0, discount));

  const totalWeightGrams = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (Number(product?.weightGrams) || 0) * item.qty;
  }, 0);

  const shippingKey = getShippingMethod();
  const shipping = shippingMethods[shippingKey] || Object.values(shippingMethods)[0] || {
    label: "Versand", price: 0, freeFrom: 0, weightTiers: []
  };

  let shippingCost = 0;
  let shippingTier = null;
  if (subtotal > 0 && subtotal < Number(shipping.freeFrom || 0)) {
    const tiers = Array.isArray(shipping.weightTiers) ? [...shipping.weightTiers] : [];
    tiers.sort((a,b) => (a.maxGrams == null ? Infinity : Number(a.maxGrams)) - (b.maxGrams == null ? Infinity : Number(b.maxGrams)));
    if (tiers.length) {
      shippingTier = tiers.find(t => t.maxGrams == null || totalWeightGrams <= Number(t.maxGrams)) || tiers[tiers.length - 1];
      shippingCost = Number(shippingTier?.price || 0);
    } else {
      shippingCost = Number(shipping.price || 0);
    }
  }
  if (couponData?.type === "shipping") shippingCost = 0;

  return {
    subtotal, discount, coupon, couponData, shippingKey, shipping,
    shippingCost, shippingTier, totalWeightGrams,
    total: Math.max(0, subtotal - discount + shippingCost)
  };
}
function renderCart() {
  const itemBox = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");
  const count = document.getElementById("cart-count");
  if (!count) return;

  count.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
  if (!itemBox || !summary) return;

  const totals = calculateCart();
  itemBox.innerHTML = cart.length ? cart.map(item => {
    const product = getProduct(item.id);
    const note = encodeURIComponent(item.note || "");
    const lineTotal = product.price * item.qty;
    return `
      <article class="cart-item">
        <b>${escapeHtml(product.name)}</b>
        <div>${product.price.toFixed(2)} € × ${item.qty} = ${lineTotal.toFixed(2)} €</div>
        ${item.note ? `<small>Wunsch: ${escapeHtml(item.note)}</small>` : ""}
        <div class="cart-row-actions">
          <button type="button" aria-label="Menge verringern" onclick="changeQty(${item.id}, -1, '${note}')">−</button>
          <button type="button" aria-label="Menge erhöhen" onclick="changeQty(${item.id}, 1, '${note}')">+</button>
          <button type="button" aria-label="Artikel entfernen" onclick="removeItem(${item.id}, '${note}')">Entfernen</button>
        </div>
      </article>`;
  }).join("") : '<p class="muted">Dein Warenkorb ist leer.</p>';

  const couponInput = document.getElementById("coupon-code");
  const shippingSelect = document.getElementById("shipping-method");
  if (couponInput && document.activeElement !== couponInput) couponInput.value = totals.coupon;
  if (shippingSelect) shippingSelect.value = totals.shippingKey;

  const couponText = totals.couponData
    ? `${escapeHtml(totals.couponData.label)} (${escapeHtml(totals.coupon)})`
    : "Kein Gutschein aktiv";

  summary.innerHTML = `
    <p>Zwischensumme: <b>${totals.subtotal.toFixed(2)} €</b></p>
    <p>Rabatt: <b>−${totals.discount.toFixed(2)} €</b><br><small>${couponText}</small></p>
    <p>${escapeHtml(totals.shipping.label)}: <b>${totals.shippingCost.toFixed(2)} €</b><br><small>Kostenlos ab ${totals.shipping.freeFrom.toFixed(2)} €</small></p>
    <h3>Gesamt: ${totals.total.toFixed(2)} €</h3>`;
}


function buildOrderText() {
  const totals = calculateCart();
  const lines = cart.map(item => {
    const product = getProduct(item.id);
    if (!product) return "";
    return `${product.name} | Menge: ${item.qty} | Einzelpreis: ${product.price.toFixed(2)} € | Summe: ${(product.price * item.qty).toFixed(2)} €${item.note ? ` | Wunsch: ${item.note}` : ""}`;
  }).filter(Boolean);
  lines.push("");
  lines.push(`Zwischensumme: ${totals.subtotal.toFixed(2)} €`);
  lines.push(`Gutschein: ${totals.coupon || "kein Code"}`);
  lines.push(`Rabatt: -${totals.discount.toFixed(2)} €`);
  lines.push(`Gesamtgewicht: ${totals.totalWeightGrams.toLocaleString("de-DE")} g`);
  lines.push(`Versand: ${totals.shipping.label}${totals.shippingTier ? ` – Gewichtsgruppe: ${totals.shippingTier.maxGrams == null ? "letzte Stufe" : `bis ${Number(totals.shippingTier.maxGrams).toLocaleString("de-DE")} g`}` : ""} (${totals.shippingCost.toFixed(2)} €)`);
  lines.push(`Gesamt: ${totals.total.toFixed(2)} €`);
  return lines.join("\n");
}

function ensureOrderModal() {
  if (document.getElementById("order-modal")) return;
  const wrapper = document.createElement("div");
  wrapper.id = "order-modal";
  wrapper.className = "order-modal hidden";
  wrapper.innerHTML = `
    <div class="order-card" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <h2 id="order-title">Bestellanfrage senden</h2>
      <p>Die Bestellung wird als E-Mail an Bine's KreativWerkstatt gesendet. Eine Zahlung erfolgt erst nach persönlicher Bestätigung.</p>
      <form id="order-form" onsubmit="submitOrderEmail(event)">
        <input type="hidden" id="order-details" name="order_details">
        <input type="hidden" id="order-total" name="order_total">
        <input type="hidden" id="order-coupon" name="coupon">
        <input type="hidden" id="order-shipping" name="shipping">

        <div class="order-grid">
          <div><label for="order-firstname">Vorname *</label><input id="order-firstname" name="first_name" required autocomplete="given-name"></div>
          <div><label for="order-lastname">Nachname *</label><input id="order-lastname" name="last_name" required autocomplete="family-name"></div>
          <div class="wide"><label for="order-email">E-Mail *</label><input id="order-email" type="email" name="reply_to" required autocomplete="email"></div>
          <div class="wide"><label for="order-phone">Telefon (optional)</label><input id="order-phone" type="tel" name="phone" autocomplete="tel"></div>
          <div class="wide"><label for="order-street">Straße und Hausnummer *</label><input id="order-street" name="street" required autocomplete="street-address"></div>
          <div><label for="order-zip">PLZ *</label><input id="order-zip" name="postal_code" required inputmode="numeric" autocomplete="postal-code"></div>
          <div><label for="order-city">Ort *</label><input id="order-city" name="city" required autocomplete="address-level2"></div>
          <div class="wide"><label for="order-notes">Zusätzliche Nachricht</label><textarea id="order-notes" name="customer_message" rows="4"></textarea></div>
        </div>

        <h3>Bestellübersicht</h3>
        <pre id="order-preview" class="order-preview"></pre>

        <label class="consent-check">
          <input type="checkbox" required>
          Ich bestätige die Richtigkeit meiner Angaben und stimme der Übermittlung per E-Mail zur Bearbeitung meiner Bestellanfrage zu.
        </label>

        <div class="order-actions">
          <button class="main-btn" id="order-submit-btn" type="submit">Bestellung per E-Mail senden</button>
          <button class="outline-btn" type="button" onclick="closeOrderModal()">Abbrechen</button>
        </div>
        <p id="order-status" class="form-status" role="status" aria-live="polite"></p>
      </form>
      <small class="muted">Der E-Mail-Versand erfolgt über EmailJS. Zugangsdaten stehen in js/email-config.js.</small>
    </div>`;
  document.body.appendChild(wrapper);
}

function checkout() {
  if (!cart.length) {
    alert("Der Warenkorb ist leer.");
    return;
  }
  ensureOrderModal();
  const totals = calculateCart();
  document.getElementById("order-preview").textContent = buildOrderText();
  document.getElementById("order-details").value = buildOrderText();
  document.getElementById("order-total").value = `${totals.total.toFixed(2)} €`;
  document.getElementById("order-coupon").value = totals.coupon || "kein Code";
  document.getElementById("order-shipping").value = `${totals.shipping.label} – ${totals.shippingCost.toFixed(2)} €`;
  document.getElementById("order-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeOrderModal() {
  document.getElementById("order-modal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function submitOrderEmail(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById("order-submit-btn");
  const status = document.getElementById("order-status");
  const originalText = button.textContent;
  const totals = calculateCart();

  document.getElementById("order-details").value = buildOrderText();
  document.getElementById("order-total").value = `${totals.total.toFixed(2)} €`;
  document.getElementById("order-coupon").value = totals.coupon || "kein Code";
  document.getElementById("order-shipping").value = `${totals.shipping.label} – ${totals.shippingCost.toFixed(2)} €`;

  button.disabled = true;
  button.textContent = "Wird gesendet …";
  status.textContent = "";
  status.className = "form-status";

  const params = {
    to_email: window.BineMail?.getConfig().shopEmail || "",
    first_name: document.getElementById("order-firstname").value.trim(),
    last_name: document.getElementById("order-lastname").value.trim(),
    reply_to: document.getElementById("order-email").value.trim(),
    phone: document.getElementById("order-phone").value.trim(),
    street: document.getElementById("order-street").value.trim(),
    postal_code: document.getElementById("order-zip").value.trim(),
    city: document.getElementById("order-city").value.trim(),
    customer_message: document.getElementById("order-notes").value.trim(),
    order_details: buildOrderText(),
    order_total: `${totals.total.toFixed(2)} €`,
    coupon: totals.coupon || "kein Code",
    shipping: `${totals.shipping.label} – ${totals.shippingCost.toFixed(2)} €`,
    sent_at: new Date().toLocaleString("de-DE")
  };

  try {
    await window.BineMail.sendOrder(params);
    localStorage.setItem("bine_kreativwerkstatt_last_order", JSON.stringify({createdAt:new Date().toISOString(), cart, totals}));
    status.textContent = "Bestellanfrage wurde erfolgreich per E-Mail gesendet.";
    status.classList.add("success");
    cart = [];
    localStorage.removeItem(CART_KEY);
    renderCart();
    form.reset();
  } catch (error) {
    console.error(error);
    status.textContent = error?.message || "Bestellung konnte nicht gesendet werden.";
    status.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}


function isFskConfirmed() {
  const timestamp = Number(localStorage.getItem(FSK_KEY));
  return Number.isFinite(timestamp) && Date.now() - timestamp < FSK_MAX_AGE_MS;
}

function calculateAge(dateString) {
  const birth = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function showAgeModal() {
  const modal = document.getElementById("age-modal");
  const checkbox = document.getElementById("age-confirm-checkbox");
  const birthday = document.getElementById("age-birthday");
  const button = document.getElementById("age-confirm-btn");
  if (checkbox) checkbox.checked = false;
  if (birthday) birthday.value = "";
  if (button) button.disabled = true;
  modal?.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function hideAgeModal() {
  document.getElementById("age-modal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function toggleAgeConfirmButton() {
  const checkbox = document.getElementById("age-confirm-checkbox");
  const birthday = document.getElementById("age-birthday");
  const button = document.getElementById("age-confirm-btn");
  if (button) button.disabled = !(checkbox?.checked && birthday?.value);
}

function requestFskAccess() {
  if (isFskConfirmed()) {
    filterProducts("FSK 18");
    return;
  }
  currentCategory = "FSK 18";
  document.getElementById("age-warning")?.classList.remove("hidden");
  renderProducts([]);
  scrollToShop();
  showAgeModal();
}

function confirmFskAge() {
  const checkbox = document.getElementById("age-confirm-checkbox");
  const birthday = document.getElementById("age-birthday");
  if (!checkbox?.checked || !birthday?.value) {
    alert("Bitte gib dein Geburtsdatum an und bestätige die Altersangabe.");
    return;
  }
  if (calculateAge(birthday.value) < 18) {
    alert("Der FSK-18-Bereich darf nur von volljährigen Personen betreten werden.");
    return;
  }
  localStorage.setItem(FSK_KEY, String(Date.now()));
  hideAgeModal();
  filterProducts("FSK 18");
}

function declineFskAge() {
  hideAgeModal();
  currentCategory = "Alle";
  document.getElementById("age-warning")?.classList.add("hidden");
  renderProducts(products.filter(product => product.category !== "FSK 18"));
}

function scrollToShop() {
  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
}

function renderCategoryButtons() {
  const container = document.getElementById("category-buttons");
  if (!container) return;

  const categories = Array.isArray(window.BINE_CATEGORIES)
    ? window.BINE_CATEGORIES
        .filter(category => category && category.active !== false && category.name)
        .sort((a, b) => Number(a.sort || 999) - Number(b.sort || 999))
    : [];

  const buttons = [{ name: "Alle", label: "Alle", sort: 0 }, ...categories];
  container.innerHTML = buttons.map(category => {
    const name = String(category.name);
    const label = String(category.label || name);
    if (name === "FSK 18") {
      return '<button type="button" onclick="requestFskAccess()">🔞 FSK 18</button>';
    }
    return `<button type="button" onclick="filterProducts(${JSON.stringify(name)})">${escapeHtml(label)}</button>`;
  }).join("");
}

function renderProducts(list) {
  const container = document.getElementById("product-list");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="page">Keine Produkte angezeigt.</div>';
    return;
  }
  container.innerHTML = list.map(product => `
    <article class="product-card">
      <a href="product.html?id=${product.id}">
        <img src="${firstImage(product)}" alt="${escapeHtml(product.name)}">
        <h3>${escapeHtml(product.name)}</h3>
      </a>
      <span class="badge">${escapeHtml(product.category)}</span>
      ${product.customizable ? '<span class="badge">Personalisierbar</span>' : ""}
      <p>${escapeHtml(product.description)}</p>
      ${product.priceOnRequest ? '<strong>Preis auf Anfrage</strong>' : `<strong>${product.price.toFixed(2)} €</strong>`}
      ${product.priceOnRequest ? `<a class="main-btn" href="kontakt.html?anfrage=${encodeURIComponent(product.name)}">Preis anfragen</a>` : `<button type="button" ${Number(product.stock)<=0?"disabled":""} onclick="addToCart(${product.id})">${Number(product.stock)<=0?"Nicht verfügbar":"In den Warenkorb"}</button>`}
    </article>`).join("");
}

function filterProducts(category) {
  currentCategory = category;
  if (category === "FSK 18" && !isFskConfirmed()) {
    requestFskAccess();
    return;
  }
  document.getElementById("age-warning")?.classList.add("hidden");
  const list = category === "Alle"
    ? products.filter(product => product.category !== "FSK 18")
    : products.filter(product => product.category === category);
  renderProducts(list);
  scrollToShop();
}

function searchProducts() {
  const query = (document.getElementById("search")?.value || "").toLowerCase().trim();
  let list = products.filter(product => product.category !== "FSK 18" || isFskConfirmed());
  if (currentCategory !== "Alle") list = list.filter(product => product.category === currentCategory);
  if (query) list = list.filter(product => `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query));
  renderProducts(list);
}

function initShopPage() {
  renderCategoryButtons();
  renderProducts(products.filter(product => product.category !== "FSK 18"));
  renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.BINE_STORE_READY) initShopPage();
  else window.addEventListener("bine-store-ready", initShopPage, { once: true });
});

"use strict";

const params = new URLSearchParams(window.location.search);
let product = null;
const detail = document.getElementById("product-detail");
const FSK_KEY = "bine_kreativwerkstatt_fsk18_confirmed";
const FSK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

function productImages(){
  const raw = product?.images;
  const list = Array.isArray(raw)
    ? raw
    : (typeof raw === "string"
      ? raw.split(",").map(x=>x.trim()).filter(Boolean)
      : []);
  const all = [...list, product?.image].filter(Boolean);
  return [...new Set(all)];
}

function mediaKind(url, mime = ""){
  const m = String(mime || "").toLowerCase();
  const u = String(url || "").split("?")[0].toLowerCase();
  if (m.startsWith("video/") || /\.(mp4|webm|ogg)$/.test(u)) return "video";
  if (m === "image/gif" || /\.gif$/.test(u)) return "gif";
  return "image";
}

function createMedia(url, mime = "", className = ""){
  const kind = mediaKind(url, mime);

  if (kind === "video"){
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (className) video.className = className;
    return video;
  }

  const image = document.createElement("img");
  image.src = url;
  image.alt = escapeHtml(product?.name || "Produkt");
  if (className) image.className = className;
  return image;
}

function setMainImage(index){
  const images = productImages();
  const src = images[index];
  if (!src) return;

  const main = document.getElementById("main-product-media");
  if (main){
    main.innerHTML = "";
    main.appendChild(createMedia(src, "", "main-product-image"));
  }

  document.querySelectorAll(".thumb").forEach((thumb,i)=>{
    thumb.classList.toggle("active",i===index);
  });
}

function isFskConfirmed(){
  const timestamp = Number(localStorage.getItem(FSK_KEY));
  return Number.isFinite(timestamp) &&
    Date.now()-timestamp<FSK_MAX_AGE_MS;
}

function calculateAge(value){
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear()-birth.getFullYear();
  const md = now.getMonth()-birth.getMonth();
  if(md<0||(md===0&&now.getDate()<birth.getDate())) age--;
  return age;
}

function showAgeModal(){
  document.getElementById("age-modal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");
  const box=document.getElementById("age-confirm-checkbox");
  const date=document.getElementById("age-birthday");
  const button=document.getElementById("age-confirm-btn");
  if(box) box.checked=false;
  if(date) date.value="";
  if(button) button.disabled=true;
}

function hideAgeModal(){
  document.getElementById("age-modal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function toggleAgeConfirmButton(){
  const box=document.getElementById("age-confirm-checkbox");
  const date=document.getElementById("age-birthday");
  const button=document.getElementById("age-confirm-btn");
  if(button) button.disabled=!(box?.checked&&date?.value);
}

function confirmFskAge(){
  const box=document.getElementById("age-confirm-checkbox");
  const date=document.getElementById("age-birthday");
  if(!box?.checked||!date?.value){
    alert("Bitte gib dein Geburtsdatum an und bestätige die Altersangabe.");
    return;
  }
  if(calculateAge(date.value)<18){
    alert("Dieses Produkt darf nur von volljährigen Personen angesehen werden.");
    return;
  }
  localStorage.setItem(FSK_KEY,String(Date.now()));
  hideAgeModal();
  renderProduct();
}

function declineFskAge(){
  window.location.href="index.html";
}

function renderProduct(){
  if(!product){
    detail.innerHTML='<div class="page">Produkt nicht gefunden.</div>';
    return;
  }

  if(product.category==="FSK 18"&&!isFskConfirmed()){
    detail.innerHTML='<div class="page"><h2>🔞 Altersbestätigung erforderlich</h2><p>Dieses Produkt ist ausschließlich für Erwachsene bestimmt.</p><button class="main-btn" onclick="showAgeModal()">Alter bestätigen</button></div>';
    return;
  }

  const images = productImages();
  if(!images.length){
    images.push("");
  }

  detail.innerHTML=`
    <article class="detail-card">
      <div class="gallery">
        <div id="main-product-media" class="main-product-media"></div>
        <div class="thumbs">
          ${images.map((src,index)=>{
            const kind=mediaKind(src);
            const thumbTag=kind==="video"
              ? `<span class="media-thumb-video">▶ VIDEO</span>`
              : `<img src="${escapeHtml(src)}" alt="Ansicht ${index+1}">`;
            return `<button class="thumb ${index===0?"active":""}" type="button" onclick="setMainImage(${index})">${thumbTag}</button>`;
          }).join("")}
        </div>
      </div>
      <div>
        <span class="badge">${escapeHtml(product.category)}</span>
        ${product.customizable?'<span class="badge">Personalisierbar</span>':""}
        <h2>${escapeHtml(product.name)}</h2>
        <p>${escapeHtml(product.description)}</p>
        ${product.priceOnRequest
          ? '<div class="price">Preis auf Anfrage</div>'
          : `<div class="price">${Number(product.price).toFixed(2)} €</div>`}
        <p class="muted">${Number(product.stock)>0?`Auf Lager: ${product.stock}`:"Derzeit nicht verfügbar"}</p>
        ${product.priceOnRequest
          ? `<a class="main-btn" href="kontakt.html?anfrage=${encodeURIComponent(product.name)}">Preis anfragen</a>`
          : `<div class="qty"><button onclick="changeDetailQty(-1)">−</button><span id="detail-qty">1</span><button onclick="changeDetailQty(1)">+</button></div>
             ${product.customizable?'<textarea id="note" placeholder="Farbe, Name oder Wunschmotiv"></textarea>':""}
             <button class="main-btn" ${Number(product.stock)<=0?'disabled':''} onclick="addDetailToCart()">In den Warenkorb</button>`}
      </div>
    </article>`;

  setMainImage(0);
}

function changeDetailQty(amount){
  const box=document.getElementById("detail-qty");
  if(!box)return;
  box.textContent=String(Math.max(1,Number(box.textContent)+amount));
}

function addDetailToCart(){
  if(product.category==="FSK 18"&&!isFskConfirmed()){
    showAgeModal();
    return;
  }
  addToCart(
    product.id,
    Number(document.getElementById("detail-qty")?.textContent||1),
    document.getElementById("note")?.value||""
  );
  alert("Produkt wurde zum Warenkorb hinzugefügt.");
}

function initProductPage(){
  product=products.find(item=>item.id===Number(params.get("id")));
  renderProduct();
  renderCart();
}

document.addEventListener("DOMContentLoaded",()=>{
  if(window.BINE_STORE_READY) initProductPage();
  else window.addEventListener("bine-store-ready",initProductPage,{once:true});
});

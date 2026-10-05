"use strict";

const params = new URLSearchParams(window.location.search);
let product = null;
const detail = document.getElementById("product-detail");
const FSK_KEY = "bine_kreativwerkstatt_fsk18_confirmed";
const FSK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}
function productMedia(){
  const out=[];
  if(Array.isArray(product?.media)) out.push(...product.media.filter(m=>m&&m.src).map(m=>({src:String(m.src),type:m.type||guessMediaType(m.src),name:m.name||""})));
  else if(Array.isArray(product?.images)) out.push(...product.images.filter(Boolean).map(src=>({src:String(src),type:"image"})));
  else if(typeof product?.images==="string") out.push(...product.images.split(",").map(x=>x.trim()).filter(Boolean).map(src=>({src,type:"image"})));
  if(product?.image&&!out.some(m=>m.src===product.image)) out.unshift({src:product.image,type:"image"});
  return [...new Map(out.map(m=>[m.src,m])).values()];
}
function guessMediaType(src){const ext=String(src||"").split("?")[0].split(".").pop()?.toLowerCase();return ["mp4","webm","ogg","mov"].includes(ext)?"video":"image";}
function isFskConfirmed(){const timestamp=Number(localStorage.getItem(FSK_KEY));return Number.isFinite(timestamp)&&Date.now()-timestamp<FSK_MAX_AGE_MS;}
function calculateAge(value){const birth=new Date(`${value}T00:00:00`);if(Number.isNaN(birth.getTime()))return-1;const now=new Date();let age=now.getFullYear()-birth.getFullYear();const md=now.getMonth()-birth.getMonth();if(md<0||(md===0&&now.getDate()<birth.getDate()))age--;return age;}
function showAgeModal(){document.getElementById("age-modal")?.classList.remove("hidden");document.body.classList.add("modal-open");const box=document.getElementById("age-confirm-checkbox"),date=document.getElementById("age-birthday"),button=document.getElementById("age-confirm-btn");if(box)box.checked=false;if(date)date.value="";if(button)button.disabled=true;}
function hideAgeModal(){document.getElementById("age-modal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function toggleAgeConfirmButton(){const box=document.getElementById("age-confirm-checkbox"),date=document.getElementById("age-birthday"),button=document.getElementById("age-confirm-btn");if(button)button.disabled=!(box?.checked&&date?.value);}
function confirmFskAge(){const box=document.getElementById("age-confirm-checkbox"),date=document.getElementById("age-birthday");if(!box?.checked||!date?.value){alert("Bitte gib dein Geburtsdatum an und bestätige die Altersangabe.");return;}if(calculateAge(date.value)<18){alert("Dieses Produkt darf nur von volljährigen Personen angesehen werden.");return;}localStorage.setItem(FSK_KEY,String(Date.now()));hideAgeModal();renderProduct();}
function declineFskAge(){window.location.href="index.html";}
function setMainMedia(index){
  const media=productMedia(), item=media[index], box=document.getElementById("main-product-media");
  if(!box||!item)return;
  box.innerHTML=item.type==="video"?`<video class="main-product-video" src="${escapeHtml(item.src)}" controls playsinline preload="metadata"></video>`:`<img id="main-product-image" class="main-product-image" src="${escapeHtml(item.src)}" alt="${escapeHtml(product.name)}">`;
  document.querySelectorAll(".thumb").forEach((thumb,i)=>thumb.classList.toggle("active",i===index));
}
function renderProduct(){
 if(!product){detail.innerHTML='<div class="page">Produkt nicht gefunden.</div>';return;}
 if(product.category==="FSK 18"&&!isFskConfirmed()){detail.innerHTML='<div class="page"><h2>🔞 Altersbestätigung erforderlich</h2><p>Dieses Produkt ist ausschließlich für Erwachsene bestimmt.</p><button class="main-btn" onclick="showAgeModal()">Alter bestätigen</button></div>';return;}
 const media=productMedia();
 const first=media[0];
 const firstMarkup=first?.type==="video"?`<video class="main-product-video" src="${escapeHtml(first.src)}" controls playsinline preload="metadata"></video>`:`<img id="main-product-image" class="main-product-image" src="${escapeHtml(first?.src||"assets/logo.png")}" alt="${escapeHtml(product.name)}">`;
 detail.innerHTML=`<article class="detail-card"><div class="gallery"><div id="main-product-media" class="main-product-media">${firstMarkup}</div><div class="thumbs">${media.map((m,index)=>`<button class="thumb ${index===0?"active":""}" type="button" onclick="setMainMedia(${index})" aria-label="Medium ${index+1}">${m.type==="video"?`<span class="video-thumb"><span>▶</span><small>Video</small></span>`:`<img src="${escapeHtml(m.src)}" alt="Ansicht ${index+1}">`}</button>`).join("")}</div></div><div><span class="badge">${escapeHtml(product.category)}</span>${product.customizable?'<span class="badge">Personalisierbar</span>':""}<h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.description)}</p>${product.priceOnRequest ? '<div class="price">Preis auf Anfrage</div>' : `<div class="price">${Number(product.price).toFixed(2)} €</div>`}<p class="muted">${Number(product.stock)>0?`Auf Lager: ${product.stock}`:"Derzeit nicht verfügbar"}</p>${product.priceOnRequest?`<a class="main-btn" href="kontakt.html?anfrage=${encodeURIComponent(product.name)}">Preis anfragen</a>`:`<div class="qty"><button onclick="changeDetailQty(-1)">−</button><span id="detail-qty">1</span><button onclick="changeDetailQty(1)">+</button></div>${product.customizable?'<textarea id="note" placeholder="Farbe, Name oder Wunschmotiv"></textarea>':""}<button class="main-btn" ${Number(product.stock)<=0?'disabled':''} onclick="addDetailToCart()">In den Warenkorb</button>`}</div></article>`;
}
function changeDetailQty(amount){const box=document.getElementById("detail-qty");if(!box)return;box.textContent=String(Math.max(1,Number(box.textContent)+amount));}
function addDetailToCart(){if(product.category==="FSK 18"&&!isFskConfirmed()){showAgeModal();return;}addToCart(product.id,Number(document.getElementById("detail-qty")?.textContent||1),document.getElementById("note")?.value||"");alert("Produkt wurde zum Warenkorb hinzugefügt.");}
function initProductPage(){product=products.find(item=>item.id===Number(params.get("id")));renderProduct();renderCart();}
document.addEventListener("DOMContentLoaded",()=>{if(window.BINE_STORE_READY)initProductPage();else window.addEventListener("bine-store-ready",initProductPage,{once:true});});

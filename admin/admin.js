
"use strict";

const state = {
  token: sessionStorage.getItem("bkw_admin_token") || "",
  owner: localStorage.getItem("bkw_repo_owner") || "", repo: localStorage.getItem("bkw_repo_name") || "",
  branch: localStorage.getItem("bkw_repo_branch") || "main", data: null, sha: null, view: "overview", pendingDeletes: []
};
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => `${Number(n||0).toFixed(2).replace(".",",")} €`;
const today = () => new Date().toISOString().slice(0,10);

function ensureData(input){
  const d=input || state.data || {};
  state.data=d;
  d.products ||= []; d.shippingMethods ||= []; d.couponCodes ||= []; d.categories ||= [];
  d.management ||= {}; d.management.orders ||= []; d.management.customers ||= [];
  d.management.gallery ||= []; d.management.guestbook ||= [];
  d.products.forEach(p => { p.weightGrams = Math.max(0, Number(p.weightGrams) || 0); });
  d.shippingMethods.forEach(s => {
    s.weightTiers = Array.isArray(s.weightTiers) ? s.weightTiers.map(t => ({ maxGrams: t.maxGrams === null || t.maxGrams === "" ? null : Number(t.maxGrams), price: Number(t.price) || 0 })) : [];
  });
  if(!d.site) d.site={};
  d.shopName ||= "Bine's KreativWerkstatt"; d.tagline ||= "3D Druck • Handarbeit • Sublimation";
  d.contactEmail ||= "[DEINE E-MAIL-ADRESSE]";
  d.categories.sort((a,b)=>(a.sort||999)-(b.sort||999));
  return d;
}
function status(msg,type=""){const e=$("#saveStatus");e.textContent=msg;e.className=`status ${type}`;}
function loginStatus(msg,type=""){const e=$("#loginStatus");e.textContent=msg;e.className=`status ${type}`;}
function headers(){return {"Accept":"application/vnd.github+json","Authorization":`Bearer ${state.token}`,"X-GitHub-Api-Version":"2022-11-28"};}
function apiBase(){return `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}`;}
async function gh(path,opt={}){
  const r=await fetch(apiBase()+path,{...opt,headers:{...headers(),...(opt.headers||{})}});
  if(!r.ok){let m=r.statusText;try{m=(await r.json()).message||m}catch{}throw Error(`${r.status}: ${m}`)}
  return r.status===204?null:r.json();
}
function b64Text(s){const b=new TextEncoder().encode(s);let x="";b.forEach(v=>x+=String.fromCharCode(v));return btoa(x)}
function fromB64(s){const b=atob(s.replace(/\n/g,""));return new TextDecoder().decode(Uint8Array.from(b,c=>c.charCodeAt(0)))}
function fileB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(file)})}
function repoReady(){return state.owner&&state.repo&&state.token}

async function discoverShopRepo(){
  // Das Shop-Repository ist bekannt: BinesKreativWerk/BinesKreativWerkstatt.
  // Fine-grained Tokens werden deshalb nicht über /user/repos gesucht.
  const names = ["BinesKreativWerkstatt", "BinesKreativWerk"];
  for(const name of names){
    try{
      const meta = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(name)}`,
        {headers:headers()}
      );
      if(!meta.ok) continue;
      const repo = await meta.json();
      const branch = repo.default_branch || "main";
      const f = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(name)}/contents/data/store.json?ref=${encodeURIComponent(branch)}`,
        {headers:headers()}
      );
      if(f.ok) return {repo,branch};
    }catch{}
  }
  throw Error("Das Repository BinesKreativWerkstatt wurde gefunden, aber data/store.json konnte nicht gelesen werden. Prüfe Contents: Read and write.");
}

async function loadGitHub(){
 const r=await gh(`/contents/data/store.json?ref=${encodeURIComponent(state.branch)}`);
 state.sha=r.sha; state.data=ensureData(JSON.parse(fromB64(r.content))); 
}
async function saveGitHub(){
  const content=JSON.stringify(ensureData(),null,2);
  const body={message:"Shopverwaltung aktualisiert – Bine's KreativWerkstatt",content:b64Text(content),branch:state.branch};
  if(state.sha) body.sha=state.sha;
  try{
    const r=await gh("/contents/data/store.json",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    state.sha=r.content?.sha||state.sha;
  }catch(e){
    if(!String(e.message||"").includes("409")) throw e;
    const fresh=await gh(`/contents/data/store.json?ref=${encodeURIComponent(state.branch)}`);
    state.sha=fresh.sha;
    const r=await gh("/contents/data/store.json",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,sha:state.sha})});
    state.sha=r.content?.sha||state.sha;
  }
  // Entfernte Medien erst beim Veröffentlichen aus GitHub löschen.
  const stillUsed=new Set();
  ensureData().products.forEach(p=>{
    getProductMedia(p).forEach(m=>{if(m.src) stillUsed.add(m.src)});
    if(p.image) stillUsed.add(p.image);
  });
  const unique=[...new Set(state.pendingDeletes||[])].filter(path=>path && !stillUsed.has(path));
  for(const path of unique){
    try{
      const current=await gh(`/contents/${encodePath(path)}?ref=${encodeURIComponent(state.branch)}`);
      await gh(`/contents/${encodePath(path)}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`Produktmedium gelöscht – ${path}`,sha:current.sha,branch:state.branch})});
    }catch(e){
      console.warn("Medium konnte nicht gelöscht werden:",path,e);
    }
  }
  state.pendingDeletes=[];
}
function encodePath(path){return String(path).split("/").map(encodeURIComponent).join("/");}
function enter(){
 $("#loginView").classList.add("hidden");$("#dashboardView").classList.remove("hidden");$("#logoutBtn").classList.remove("hidden");
 $("#modeText").textContent="Verbunden mit GitHub – Änderungen können veröffentlicht werden.";
 render();
}
async function login(){
 state.owner=$("#repoOwner").value.trim();
 state.token=$("#githubToken").value.trim();
 if(!state.owner||!state.token){loginStatus("Bitte GitHub-Benutzername und Token eintragen.","error");return}
 $("#loginBtn").disabled=true;loginStatus("GitHub wird geprüft und das Shop-Repository gesucht …");
 try{
   const me=await fetch("https://api.github.com/user",{headers:headers()});
   if(!me.ok)throw Error("GitHub-Benutzername oder Token ist ungültig.");
   const user=await me.json();
   if(user.login.toLowerCase()!==state.owner.toLowerCase())throw Error(`Der Token gehört zu „${user.login}“, nicht zu „${state.owner}“.`);
   const found=await discoverShopRepo();
   state.repo=found.repo.name; state.branch=found.branch;
   localStorage.setItem("bkw_repo_owner",state.owner);
   localStorage.setItem("bkw_repo_name",state.repo);
   localStorage.setItem("bkw_repo_branch",state.branch);
   $("#repoName").value=state.repo;
   $("#repoSelectWrap").classList.remove("hidden");
   await loadGitHub();
   sessionStorage.setItem("bkw_admin_token",state.token);
   enter();loginStatus("");
 }catch(e){loginStatus("GitHub-Anmeldung fehlgeschlagen: "+e.message,"error")}
 finally{$("#loginBtn").disabled=false}
}

function safeFileName(name){
  const ext=(String(name).split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const base=(String(name).replace(/\.[^.]+$/,"").toLowerCase()
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)) || "produktbild";
  return `${base}.${ext||"jpg"}`;
}
async function uploadRepoFile(path,file,message){
  if(!repoReady()) throw Error("Bitte zuerst mit GitHub verbinden.");
  const content=await fileB64(file);
  let sha;
  try{
    const old=await gh(`/contents/${path}?ref=${encodeURIComponent(state.branch)}`);
    sha=old.sha;
  }catch(e){}
  const body={message,content,branch:state.branch};
  if(sha) body.sha=sha;
  const r=await gh(`/contents/${path}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  return r.content?.path || path;
}
async function uploadProductMedia(files,productId){
  const list=Array.from(files||[]);
  if(!list.length) return [];
  if(list.length>10) throw Error("Bitte höchstens 10 Medien gleichzeitig auswählen.");
  const allowedImages=["image/jpeg","image/png","image/webp","image/gif"];
  const allowedVideos=["video/mp4","video/webm","video/ogg"];
  const maxImage=10*1024*1024;
  const maxVideo=50*1024*1024;
  const uploaded=[];
  for(let i=0;i<list.length;i++){
    const file=list[i];
    const isVideo=allowedVideos.includes(file.type);
    const isImage=allowedImages.includes(file.type);
    if(!isImage&&!isVideo) throw Error(`„${file.name}“ ist kein unterstütztes Medium. Erlaubt sind JPG, PNG, WebP, GIF, MP4, WebM und OGG.`);
    const max=isVideo?maxVideo:maxImage;
    if(file.size>max) throw Error(`„${file.name}“ ist zu groß. Maximum: ${isVideo?"50 MB":"10 MB"}.`);
    const ext=(file.name.split(".").pop()|| (isVideo?"mp4":"jpg")).toLowerCase().replace(/[^a-z0-9]/g,"") || (isVideo?"mp4":"jpg");
    const base=safeFileName(file.name).replace(/\.[^.]+$/i,"")||"produktmedium";
    const filename=`${base}-${productId}-${Date.now()}-${i+1}.${ext}`;
    const path=`assets/products/${filename}`;
    await uploadRepoFile(path,file,`Produktmedium hochgeladen – ${filename}`);
    uploaded.push({src:path,type:isVideo?"video":"image",name:file.name});
  }
  return uploaded;
}
async function save(){
  if(!repoReady()){status("Bitte zuerst mit GitHub verbinden.","error");return;}
  $("#saveBtn").disabled=true;
  status("Änderungen werden zu GitHub veröffentlicht …");
  try{
    await saveGitHub();
    status("Erfolgreich veröffentlicht.","ok");
  }catch(e){
    status("Veröffentlichung fehlgeschlagen: "+e.message,"error");
  }finally{
    $("#saveBtn").disabled=false;
  }
}
function logout(){sessionStorage.removeItem("bkw_admin_token");location.reload()}

function nav(){
 document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));$("#view-"+state.view).classList.remove("hidden");renderView()})
}
function render(){nav();renderView();renderCards()}
function renderCards(){
 const d=ensureData(), orders=d.management.orders, low=d.products.filter(p=>Number(p.stock||0)<=Number(p.lowStock||3)).length;
 $("#dashboardCards").innerHTML=[
  ["Produkte",d.products.length],["Sichtbar",d.products.filter(p=>p.visible!==false).length],["Bestellungen",orders.length],
  ["Offen",orders.filter(o=>!["done","cancelled"].includes(o.status)).length],["Kunden",d.management.customers.length],["Niedriger Bestand",low]
 ].map(x=>`<div class="metric"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")
}
function renderView(){const fn={overview:overview,products:products,categories:categories,orders:orders,production:production,customers:customers,invoices:invoices,statistics:statistics,coupons:coupons,shipping:shipping,gallery:gallery,guestbook:guestbook,settings:settings,backup:backup}[state.view];fn&&fn()}
function panel(title,body,actions=""){return `<div class="panel"><div class="panel-head"><h2>${title}</h2><div class="toolbar">${actions}</div></div>${body}</div>`}
function btn(text,cls="",attr=""){return `<button class="${cls||"outline-btn"}" ${attr}>${text}</button>`}

function overview(){
 const d=ensureData(),o=d.management.orders;
 const revenue=o.reduce((s,x)=>s+Number(x.total||0),0),open=o.filter(x=>!["done","cancelled"].includes(x.status)).length;
 $("#view-overview").innerHTML=panel("Willkommen im Dashboard",`<p class="muted">Hier verwaltest du Bine's KreativWerkstatt in einem Bereich. Die Verwaltung ist in Produkte, Kategorien, Bestellungen, Produktion, Kunden, Rechnungen, Statistik, Gutscheine, Versand, Galerie, Gästebuch, Einstellungen und Backups aufgeteilt.</p><div class="dashboard-cards"><div class="metric"><b>${money(revenue)}</b><span>Bestellumsatz</span></div><div class="metric"><b>${open}</b><span>Offene Vorgänge</span></div><div class="metric"><b>${d.categories.length}</b><span>Kategorien</span></div><div class="metric"><b>${d.couponCodes.length}</b><span>Gutscheine</span></div></div>`) +
 panel("Schnellzugriff",`<div class="toolbar">${btn("+ Produkt","main-btn",'data-go="products"')} ${btn("+ Bestellung","main-btn",'data-go="orders"')} ${btn("+ Kunde","outline-btn",'data-go="customers"')} ${btn("Statistik","outline-btn",'data-go="statistics"')} ${btn("Backup","outline-btn",'data-go="backup"')}</div>`);
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{state.view=b.dataset.go;document.querySelector(`[data-view="${state.view}"]`).click()})
}

function products(){
 const d=ensureData();
 $("#view-products").innerHTML=panel("Produkte",`<div class="toolbar"><button id="addProduct" class="main-btn">+ Neues Produkt</button><input id="productSearch" class="filter-input" placeholder="Produkt suchen …"></div>`) + `<div id="productGrid" class="product-grid"></div>`;
 const draw=()=>{$("#productGrid").innerHTML=d.products.slice().sort((a,b)=>(a.sort||999)-(b.sort||999)).map((p,i)=>`<article class="product-card" data-product="${p.id}">
 <div class="product-top"><img class="thumb" src="../${esc(p.image||"assets/logo.png")}"><div><h3>${esc(p.name)}</h3><div class="product-meta">${esc(p.category||"")} · ${p.priceOnRequest?"Preis auf Anfrage":money(p.price)} · ${Number(p.weightGrams||0).toLocaleString("de-DE")} g</div><div>${p.visible!==false?'<span class="badge ok">sichtbar</span>':'<span class="badge off">ausgeblendet</span>'} ${p.stock<=3?'<span class="badge warn">Bestand niedrig</span>':''}</div></div></div>
 <div class="product-actions">${btn("Bearbeiten","outline-btn",'data-edit="'+p.id+'"')} ${btn("Duplizieren","outline-btn",'data-dup="'+p.id+'"')} ${btn(p.visible!==false?"Ausblenden":"Einblenden","outline-btn",'data-toggle="'+p.id+'"')} ${btn("Löschen","outline-btn danger",'data-del="'+p.id+'"')}</div></article>`).join("")||'<div class="empty">Noch keine Produkte.</div>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>productModal(Number(b.dataset.edit)));
 document.querySelectorAll("[data-dup]").forEach(b=>b.onclick=()=>duplicateProduct(Number(b.dataset.dup)));
 document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const p=d.products.find(x=>x.id==b.dataset.toggle);p.visible=p.visible===false;renderView();renderCards()});
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const p=d.products.find(x=>x.id==b.dataset.del);if(!p)return;if(confirm("Produkt wirklich löschen? Das Produkt und seine nicht anderweitig verwendeten Medien werden beim Veröffentlichen entfernt.")){getProductMedia(p).forEach(m=>{if(m.src&&!state.pendingDeletes.includes(m.src))state.pendingDeletes.push(m.src)});d.products=d.products.filter(x=>x.id!=b.dataset.del);renderView();renderCards()}});
 $("#productSearch").oninput=e=>document.querySelectorAll(".product-card").forEach(c=>c.style.display=c.textContent.toLowerCase().includes(e.target.value.toLowerCase())?"":"none");
 };
 draw();$("#addProduct").onclick=()=>productModal(null);
}
function getProductMedia(p){
  const out=[];
  if(Array.isArray(p?.media)) out.push(...p.media.filter(m=>m&&m.src).map(m=>({src:String(m.src),type:m.type||guessMediaType(m.src),name:m.name||""})));
  else if(Array.isArray(p?.images)) out.push(...p.images.filter(Boolean).map(src=>({src:String(src),type:"image",name:""})));
  else if(typeof p?.images==="string") out.push(...p.images.split(",").map(x=>x.trim()).filter(Boolean).map(src=>({src,type:"image",name:""})));
  if(p?.image && !out.some(m=>m.src===p.image)) out.unshift({src:p.image,type:"image",name:""});
  return [...new Map(out.map(m=>[m.src,m])).values()];
}
function guessMediaType(src){
  const ext=String(src||"").split("?")[0].split(".").pop()?.toLowerCase();
  return ["mp4","webm","ogg","mov"].includes(ext)?"video":"image";
}
function mediaThumbHtml(m,i,mainImage){
  const isVideo=m.type==="video";
  const preview=isVideo
    ? `<video src="../${esc(m.src)}" muted preload="metadata" style="width:110px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #ccc"></video>`
    : `<img src="../${esc(m.src)}" alt="${esc(m.name||`Medium ${i+1}`)}" style="width:110px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #ccc">`;
  const mainControl=isVideo?`<span class="muted" style="font-size:.85em">Video</span>`:`<label class="check" style="margin:0"><input type="radio" name="mainMedia" value="${esc(m.src)}" ${mainImage===m.src?"checked":""}> ⭐ Hauptbild</label>`;
  return `<div class="media-item" data-media-src="${esc(m.src)}" style="display:flex;flex-direction:column;gap:6px;width:140px;padding:8px;border:1px solid #ddd;border-radius:10px;background:#fff">${preview}${mainControl}<button type="button" class="outline-btn danger media-delete" data-media-delete="${esc(m.src)}">🗑️ Löschen</button></div>`;
}
function productModal(id){
 const d=ensureData(), p=id?d.products.find(x=>x.id===id):{
   id:Math.max(0,...d.products.map(x=>Number(x.id)||0))+1,
   name:"Neues Produkt",category:d.categories[0]?.name||"3D Druck",price:0,priceOnRequest:false,
   image:"assets/products/product-01.jpg",images:["assets/products/product-01.jpg"],media:[{src:"assets/products/product-01.jpg",type:"image"}],
   description:"",visible:true,customizable:false,featured:false,stock:0,
   sku:"BKW-"+String(Date.now()).slice(-4),sort:d.products.length+1,weightGrams:0
 };
 let media=getProductMedia(p);
 let mainImage=p.image||media.find(m=>m.type==="image")?.src||"";
 const cats=d.categories.map(c=>`<option ${c.name===p.category?"selected":""}>${esc(c.name)}</option>`).join("");
 openModal(id?"Produkt bearbeiten":"Neues Produkt",`<form id="productForm" class="form-grid">
<label class="wide">Name<input name="name" value="${esc(p.name)}" required></label>
<label>Kategorie<select name="category">${cats}</select></label>
<label>Preis (€)<input name="price" type="number" step=".01" min="0" value="${Number(p.price||0)}"></label>
<label class="check"><input name="priceOnRequest" type="checkbox" ${p.priceOnRequest?"checked":""}> Preis auf Anfrage</label>
<label>Bestand<input name="stock" type="number" value="${Number(p.stock||0)}"></label>
<label>Gewicht (g)<input name="weightGrams" type="number" min="0" step="1" value="${Number(p.weightGrams||0)}" required></label>
<label>Artikelnummer<input name="sku" value="${esc(p.sku||"")}"></label>
<label>Sortierung<input name="sort" type="number" value="${Number(p.sort||1)}"></label>
<label class="wide">Beschreibung<textarea name="description">${esc(p.description||"")}</textarea></label>
<label class="check"><input name="visible" type="checkbox" ${p.visible!==false?"checked":""}> Im Shop sichtbar</label>
<label class="check"><input name="featured" type="checkbox" ${p.featured?"checked":""}> Hervorgehoben</label>
<label class="check"><input name="customizable" type="checkbox" ${p.customizable?"checked":""}> Personalisierbar</label>
<div class="wide upload-box" style="border:1px solid #ddd;border-radius:12px;padding:12px">
  <b>Produktmedien</b>
  <div style="margin:6px 0 10px;color:#666;font-size:.92em">Bilder: JPG, PNG, WebP, GIF · Videos: MP4, WebM, OGG · Bilder max. 10 MB · Videos max. 50 MB</div>
  <input id="productMediaFiles" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg" multiple>
  <div id="productMediaPreview" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">${media.map((m,i)=>mediaThumbHtml(m,i,mainImage)).join("")}</div>
  <div id="productUploadStatus" style="margin-top:8px"></div>
  <div class="muted" style="margin-top:8px">⭐ Das markierte Bild ist das Hauptbild und wird direkt in der Shopübersicht angezeigt. Videos können nicht Hauptbild sein.</div>
</div>
<div class="wide toolbar">${btn("Abbrechen","outline-btn",'type="button" id="cancelModal"')}<button class="main-btn" id="saveProductBtn">Speichern</button></div></form>`);

 const preview=$("#productMediaPreview"), fileInput=$("#productMediaFiles"), uploadStatus=$("#productUploadStatus");
 const rerenderMedia=()=>{
   preview.innerHTML=media.map((m,i)=>mediaThumbHtml(m,i,mainImage)).join("")||'<div class="muted">Noch keine Medien vorhanden.</div>';
   preview.querySelectorAll("[data-media-delete]").forEach(b=>b.onclick=()=>{
     const src=b.dataset.mediaDelete;
     if(!confirm("Dieses Medium wirklich löschen?")) return;
     media=media.filter(m=>m.src!==src);
     if(src===mainImage) mainImage=media.find(m=>m.type==="image")?.src||"";
     if(id && !state.pendingDeletes.includes(src)) state.pendingDeletes.push(src);
     rerenderMedia();
   });
   preview.querySelectorAll('input[name="mainMedia"]').forEach(r=>r.onchange=()=>{mainImage=r.value;rerenderMedia()});
 };
 $("#cancelModal").onclick=closeModal;
 rerenderMedia();
 fileInput.onchange=()=>{
   const files=Array.from(fileInput.files||[]);
   if(!files.length){uploadStatus.textContent="";return;}
   uploadStatus.textContent=`${files.length} Medium${files.length===1?"":"ien"} ausgewählt. Beim Speichern werden sie zu GitHub hochgeladen.`;
 };
 $("#productForm").onsubmit=async e=>{
   e.preventDefault();
   const f=new FormData(e.target), saveBtn=$("#saveProductBtn"); saveBtn.disabled=true; uploadStatus.textContent="";
   try{
     const files=fileInput.files;
     if(files&&files.length){
       uploadStatus.textContent=`${files.length} Medium${files.length===1?"":"ien"} werden zu GitHub hochgeladen …`;
       const uploaded=await uploadProductMedia(files,p.id);
       media=[...media,...uploaded.filter(x=>!media.some(m=>m.src===x.src))];
       if(!mainImage) mainImage=uploaded.find(m=>m.type==="image")?.src||"";
       rerenderMedia();
       uploadStatus.textContent="Medien hochgeladen. Produktdaten gespeichert – jetzt veröffentlichen.";
     }
     const images=media.filter(m=>m.type!=="video").map(m=>m.src);
     const videos=media.filter(m=>m.type==="video").map(m=>m.src);
     if(mainImage&&!images.includes(mainImage)) mainImage=images[0]||"";
     const n={...p,id:p.id,name:f.get("name"),category:f.get("category"),price:Number(f.get("price")||0),priceOnRequest:f.has("priceOnRequest"),stock:Number(f.get("stock")||0),weightGrams:Math.max(0,Number(f.get("weightGrams")||0)),sku:f.get("sku"),sort:Number(f.get("sort")||1),description:f.get("description"),visible:f.has("visible"),featured:f.has("featured"),customizable:f.has("customizable"),image:mainImage,images, videos, media};
     if(id) Object.assign(p,n); else d.products.push(n);
     closeModal(); renderView(); renderCards();
     status("Produkt gespeichert. Jetzt oben „Änderungen veröffentlichen“ drücken.","ok");
   }catch(err){uploadStatus.textContent=`Fehler: ${err.message}`;status(`Produkt konnte nicht gespeichert werden: ${err.message}`,"error");saveBtn.disabled=false;}
 };
}
function duplicateProduct(id){const d=ensureData(),p=d.products.find(x=>x.id===id);if(!p)return;const q=JSON.parse(JSON.stringify(p));q.id=Math.max(0,...d.products.map(x=>Number(x.id)||0))+1;q.sku=(q.sku||"BKW")+"-K";q.name+=" – Kopie";q.sort=d.products.length+1;d.products.push(q);renderView();renderCards()}
function openModal(title,body){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML=""}
$("#modalClose").onclick=closeModal;

function categories(){
 const d=ensureData();
 $("#view-categories").innerHTML=panel("Kategorien",`<div class="toolbar"><button id="addCat" class="main-btn">+ Kategorie</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Sort</th><th>Name</th><th>Shop-Anzeige</th><th>Status</th><th>Produkte</th><th></th></tr></thead><tbody>${d.categories.map((c,i)=>`<tr><td>${c.sort||i+1}</td><td>${esc(c.name)}</td><td>${esc(c.label||c.name)}</td><td>${c.active!==false?"sichtbar":"aus"}</td><td>${d.products.filter(p=>p.category===c.name).length}</td><td>${btn("Bearbeiten","outline-btn",'data-cat="'+i+'"')}</td></tr>`).join("")}</tbody></table></div>`);
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>catModal(Number(b.dataset.cat)));
 $("#addCat").onclick=()=>catModal(null)
}
function catModal(i){
 const d=ensureData(),c=i===null?{id:"",name:"Neue Kategorie",label:"Neue Kategorie",sort:d.categories.length+1,active:true}:d.categories[i];
 openModal("Kategorie",`<form id="catForm" class="form-grid"><label>Name<input name="name" value="${esc(c.name)}" required></label><label>Sortierung<input name="sort" type="number" value="${Number(c.sort||1)}"></label><label class="wide">Anzeige<input name="label" value="${esc(c.label||c.name)}"></label><label class="check"><input name="active" type="checkbox" ${c.active!==false?"checked":""}> Sichtbar</label><div class="wide"><button class="main-btn">Speichern</button></div></form>`);
 $("#catForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=f.get("name").trim();if(d.categories.some((x,j)=>j!==i&&x.name.toLowerCase()===name.toLowerCase()))return alert("Kategorie existiert bereits.");if(i===null)d.categories.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name,label:f.get("label")||name,sort:Number(f.get("sort")||1),active:f.has("active")});else{const old=c.name;Object.assign(c,{name,label:f.get("label")||name,sort:Number(f.get("sort")||1),active:f.has("active")});d.products.forEach(p=>{if(p.category===old)p.category=name})}closeModal();renderView()}
}

function orders(){
 const d=ensureData(),o=d.management.orders;
 $("#view-orders").innerHTML=panel("Bestellungen",`<div class="toolbar"><button id="addOrder" class="main-btn">+ Bestellung</button><input id="orderSearch" class="filter-input" placeholder="Suche …"></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Nr.</th><th>Datum</th><th>Kunde</th><th>Betrag</th><th>Status</th><th>Zahlung</th><th></th></tr></thead><tbody id="ordersBody"></tbody></table></div>`);
 const draw=()=>{$("#ordersBody").innerHTML=o.map((x,i)=>`<tr><td>${esc(x.number||("BKW-"+(i+1).toString().padStart(4,"0")))}</td><td>${esc(x.date||"")}</td><td>${esc(x.customer||"")}</td><td>${money(x.total)}</td><td><span class="badge">${esc(x.status||"neu")}</span></td><td>${esc(x.payment||"offen")}</td><td>${btn("Bearbeiten","outline-btn",'data-order="'+i+'"')}</td></tr>`).join("")||'<tr><td colspan="7">Keine Bestellungen.</td></tr>';document.querySelectorAll("[data-order]").forEach(b=>b.onclick=()=>orderModal(Number(b.dataset.order)))};
 draw();$("#addOrder").onclick=()=>orderModal(null);
}
function orderModal(i){
 const d=ensureData(),o=i===null?{number:"BKW-"+Date.now().toString().slice(-6),date:today(),customer:"",email:"",phone:"",address:"",items:"",total:0,status:"new",payment:"offen",carrier:"",tracking:"",invoice:"",notes:""}:d.management.orders[i];
 openModal(i===null?"Bestellung anlegen":"Bestellung bearbeiten",`<form id="orderForm" class="form-grid">
<label>Bestellnummer<input name="number" value="${esc(o.number)}"></label><label>Datum<input name="date" type="date" value="${esc(o.date)}"></label><label>Kunde<input name="customer" value="${esc(o.customer)}"></label><label>E-Mail<input name="email" value="${esc(o.email)}"></label><label>Telefon<input name="phone" value="${esc(o.phone)}"></label><label>Status<select name="status">${["new","confirmed","material_ordered","production","ready","shipped","done","cancelled"].map(x=>`<option ${x===o.status?"selected":""}>${x}</option>`).join("")}</select></label><label>Gesamt (€)<input name="total" type="number" step=".01" value="${Number(o.total||0)}"></label><label>Zahlung<select name="payment">${["offen","bezahlt","storniert"].map(x=>`<option ${x===o.payment?"selected":""}>${x}</option>`).join("")}</select></label><label>Versand<input name="carrier" value="${esc(o.carrier)}"></label><label>Tracking<input name="tracking" value="${esc(o.tracking)}"></label><label>Rechnung<input name="invoice" value="${esc(o.invoice)}"></label><label>Fällig am<input name="due" type="date" value="${esc(o.due||"")}"></label><label class="wide">Anschrift<textarea name="address">${esc(o.address)}</textarea></label><label class="wide">Artikel / Leistungen<textarea name="items">${esc(o.items)}</textarea></label><label class="wide">Interne Notizen<textarea name="notes">${esc(o.notes)}</textarea></label><div class="wide toolbar"><button class="main-btn">Speichern</button>${i!==null?btn("Löschen","outline-btn danger",'type="button" id="deleteOrder"'):""}</div></form>`);
 $("#orderForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n={number:f.get("number"),date:f.get("date"),customer:f.get("customer"),email:f.get("email"),phone:f.get("phone"),address:f.get("address"),items:f.get("items"),total:Number(f.get("total")||0),status:f.get("status"),payment:f.get("payment"),carrier:f.get("carrier"),tracking:f.get("tracking"),invoice:f.get("invoice"),due:f.get("due"),notes:f.get("notes")};i===null?d.management.orders.push(n):Object.assign(o,n);closeModal();renderView();renderCards()};
 if(i!==null)$("#deleteOrder").onclick=()=>{if(confirm("Bestellung löschen?")){d.management.orders.splice(i,1);closeModal();renderView();renderCards()}}
}

function production(){
 const d=ensureData(),statuses=[["new","Neu"],["confirmed","Bestätigt"],["material_ordered","Material"],["production","Produktion"],["ready","Fertig"],["shipped","Versendet"]];
 $("#view-production").innerHTML=panel("Produktion",`<p class="muted">Bestellungen nach Produktionsstatus.</p><div class="kanban">${statuses.map(([key,label])=>`<div class="kanban-col"><h3>${label}</h3>${d.management.orders.filter(o=>o.status===key).map(o=>`<div class="order-item"><b>${esc(o.number)}</b><br>${esc(o.customer)}<br>${money(o.total)}</div>`).join("")||'<span class="muted">Leer</span>'}</div>`).join("")}</div>`)
}
function customers(){
 const d=ensureData(),map={};d.management.orders.forEach(o=>{const k=o.email||o.customer||"Unbekannt";map[k] ||= {name:o.customer,email:o.email,orders:0,revenue:0};map[k].orders++;map[k].revenue+=Number(o.total||0)});
 $("#view-customers").innerHTML=panel("Kunden",`<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>E-Mail</th><th>Bestellungen</th><th>Umsatz</th></tr></thead><tbody>${Object.values(map).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${x.orders}</td><td>${money(x.revenue)}</td></tr>`).join("")||'<tr><td colspan="4">Noch keine Bestellkunden.</td></tr>'}</tbody></table></div>`)
}
function invoices(){
 const d=ensureData();$("#view-invoices").innerHTML=panel("Rechnungen & Lieferscheine",`<p class="muted">Dokumente werden aus deinen Bestellungen vorbereitet. Zum PDF-Export kannst du den Druckdialog des Browsers verwenden.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Rechnung</th><th>Bestellung</th><th>Kunde</th><th>Betrag</th><th>Zahlung</th><th></th></tr></thead><tbody>${d.management.orders.map((o,i)=>`<tr><td>${esc(o.invoice||"–")}</td><td>${esc(o.number)}</td><td>${esc(o.customer)}</td><td>${money(o.total)}</td><td>${esc(o.payment||"offen")}</td><td>${btn("Dokument","outline-btn",'data-doc="'+i+'"')}</td></tr>`).join("")||'<tr><td colspan="6">Keine Dokumente.</td></tr>'}</tbody></table></div>`);
 document.querySelectorAll("[data-doc]").forEach(b=>b.onclick=()=>printInvoice(d.management.orders[Number(b.dataset.doc)]))
}
function printInvoice(o){const w=open("","_blank");w.document.write(`<html><head><title>${esc(o.invoice||o.number)}</title><style>body{font-family:Arial;padding:40px;color:#111}h1{color:#a91532}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #ddd}</style></head><body><h1>Bine's KreativWerkstatt</h1><h2>${esc(o.invoice?"Rechnung "+o.invoice:"Bestellung "+o.number)}</h2><p>${esc(o.date||today())}</p><p><b>Kunde:</b><br>${esc(o.customer)}<br>${esc(o.address)}<br>${esc(o.email)}</p><table><tr><td>Artikel / Leistungen</td><td>${esc(o.items)}</td></tr><tr><td>Gesamt</td><td>${money(o.total)}</td></tr><tr><td>Zahlungsstatus</td><td>${esc(o.payment||"offen")}</td></tr></table><script>print()<\/script></body></html>`);w.document.close()}

function statistics(){
 const d=ensureData(),o=d.management.orders,revenue=o.reduce((s,x)=>s+Number(x.total||0),0),cats={};d.products.forEach(p=>cats[p.category]=(cats[p.category]||0)+1);
 const vals=Array.from({length:12},(_,m)=>o.filter(x=>new Date(x.date||today()).getMonth()===m).reduce((s,x)=>s+Number(x.total||0),0)),max=Math.max(1,...vals);
 $("#view-statistics").innerHTML=panel("Statistik",`<div class="dashboard-cards"><div class="metric"><b>${money(revenue)}</b><span>Umsatz</span></div><div class="metric"><b>${o.length}</b><span>Bestellungen</span></div><div class="metric"><b>${d.management.customers.length}</b><span>Portal-Kunden</span></div><div class="metric"><b>${d.products.filter(p=>p.featured).length}</b><span>Highlights</span></div></div><div class="panel"><h3>Umsatz pro Monat</h3><div class="chart">${vals.map((v,i)=>`<div class="bar" style="height:${Math.max(4,v/max*100)}%"><span>${i+1}</span></div>`).join("")}</div></div><div class="panel"><h3>Produkte nach Kategorie</h3><div class="stat-list">${Object.entries(cats).map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div></div>`)
}
function coupons(){
 const d=ensureData();$("#view-coupons").innerHTML=panel("Gutscheine",`<button id="addCoupon" class="main-btn">+ Gutschein</button><div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Typ</th><th>Wert</th><th>Status</th><th></th></tr></thead><tbody>${d.couponCodes.map((c,i)=>`<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.type)}</td><td>${c.type==="percent"?c.value+" %":money(c.value)}</td><td>${c.active?"aktiv":"inaktiv"}</td><td>${btn("Bearbeiten","outline-btn",'data-coupon="'+i+'"')}</td></tr>`).join("")}</tbody></table></div>`);
 document.querySelectorAll("[data-coupon]").forEach(b=>b.onclick=()=>couponModal(Number(b.dataset.coupon)));$("#addCoupon").onclick=()=>couponModal(null)
}
function couponModal(i){const d=ensureData(),c=i===null?{code:"BKW",type:"percent",value:10,label:"",active:true}:d.couponCodes[i];openModal("Gutschein",`<form id="couponForm" class="form-grid"><label>Code<input name="code" value="${esc(c.code)}"></label><label>Typ<select name="type"><option value="percent">Prozent</option><option value="fixed">Euro</option><option value="shipping">Versand gratis</option></select></label><label>Wert<input name="value" type="number" step=".01" value="${c.value||0}"></label><label>Bezeichnung<input name="label" value="${esc(c.label||"")}"></label><label class="check"><input name="active" type="checkbox" ${c.active!==false?"checked":""}> Aktiv</label><div class="wide"><button class="main-btn">Speichern</button></div></form>`);$("#couponForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n={code:f.get("code").trim().toUpperCase(),type:f.get("type"),value:Number(f.get("value")||0),label:f.get("label"),active:f.has("active")};i===null?d.couponCodes.push(n):Object.assign(c,n);closeModal();renderView()}
}
function shipping(){
 const d=ensureData();
 const tierText=s=>Array.isArray(s.weightTiers)&&s.weightTiers.length?s.weightTiers.slice().sort((a,b)=>(a.maxGrams==null?Infinity:a.maxGrams)-(b.maxGrams==null?Infinity:b.maxGrams)).map(t=>t.maxGrams==null?`ab ${money(t.price)}`:`bis ${Number(t.maxGrams).toLocaleString("de-DE")} g: ${money(t.price)}`).join(" · "):"keine Gewichtsgruppen – Standardpreis";
 $("#view-shipping").innerHTML=panel("Versandarten",`<p class="muted">Der Versandpreis wird aus dem Gesamtgewicht aller Artikel berechnet. Lege pro Versandart Gewichtsgruppen an, z. B. <b>bis 500 g</b>, <b>bis 1.000 g</b> und <b>ab 1.000 g</b>. Kostenloser Versand ab einem Bestellwert bleibt zusätzlich möglich.</p><button id="addShip" class="main-btn">+ Versandart</button><div class="table-wrap"><table class="data-table"><thead><tr><th>Schlüssel</th><th>Bezeichnung</th><th>Standardpreis</th><th>Gratis ab</th><th>Gewichtsgruppen</th><th></th></tr></thead><tbody>${d.shippingMethods.map((s,i)=>`<tr><td>${esc(s.key)}</td><td>${esc(s.label)}</td><td>${money(s.price)}</td><td>${money(s.freeFrom)}</td><td>${esc(tierText(s))}</td><td>${btn("Bearbeiten","outline-btn",'data-ship="'+i+'"')}</td></tr>`).join("")}</tbody></table></div>`);
 document.querySelectorAll("[data-ship]").forEach(b=>b.onclick=()=>shipModal(Number(b.dataset.ship)));$("#addShip").onclick=()=>shipModal(null)
}
function shipModal(i){
 const d=ensureData(),s=i===null?{key:"neu",label:"Neue Versandart",price:0,freeFrom:0,weightTiers:[]}:d.shippingMethods[i];
 const tiers=(s.weightTiers||[]).map(t=>`${t.maxGrams==null?"*":t.maxGrams}=${t.price}`).join("\n");
 openModal("Versandart",`<form id="shipForm" class="form-grid"><label>Schlüssel<input name="key" value="${esc(s.key)}" required></label><label>Bezeichnung<input name="label" value="${esc(s.label)}" required></label><label>Standardpreis (€)<input name="price" type="number" step=".01" value="${s.price||0}"></label><label>Kostenfrei ab (€)<input name="freeFrom" type="number" step=".01" value="${s.freeFrom||0}"></label><label class="wide">Gewichtsgruppen (g = €)<textarea name="weightTiers" rows="6" placeholder="500=4.95\n1000=6.95\n*=9.95">${esc(tiers)}</textarea><small class="muted">Eine Zeile pro Stufe. Beispiel: <b>500=4.95</b> bedeutet bis 500 g. Mit <b>*=9.95</b> legst du die letzte Stufe für alles darüber fest.</small></label><div class="wide"><button class="main-btn">Speichern</button></div></form>`);
 $("#shipForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const parsed=String(f.get("weightTiers")||"").split(/\n|;/).map(x=>x.trim()).filter(Boolean).map(line=>{const [limit,price]=line.split("=").map(x=>x.trim());return {maxGrams:limit==="*"||limit===""?null:Math.max(0,Number(limit)),price:Math.max(0,Number(price))};}).filter(x=>x.price>=0&&!Number.isNaN(x.price)&&(x.maxGrams===null||!Number.isNaN(x.maxGrams))).sort((a,b)=>(a.maxGrams==null?Infinity:a.maxGrams)-(b.maxGrams==null?Infinity:b.maxGrams));const n={key:f.get("key").trim(),label:f.get("label").trim(),price:Number(f.get("price")||0),freeFrom:Number(f.get("freeFrom")||0),weightTiers:parsed};i===null?d.shippingMethods.push(n):Object.assign(s,n);closeModal();renderView()}
}
function gallery(){
 const d=ensureData();$("#view-gallery").innerHTML=panel("Auftragsgalerie",`<button id="addGallery" class="main-btn">+ Referenzauftrag</button><div class="table-wrap"><table class="data-table"><thead><tr><th>Titel</th><th>Kategorie</th><th>Datum</th><th>Kunde</th><th>Freigabe</th><th></th></tr></thead><tbody>${d.management.gallery.map((g,i)=>`<tr><td>${esc(g.title)}</td><td>${esc(g.category)}</td><td>${esc(g.date)}</td><td>${esc(g.customer||"anonym")}</td><td>${g.consent?"freigegeben":"nicht freigegeben"}</td><td>${btn("Bearbeiten","outline-btn",'data-gallery="'+i+'"')}</td></tr>`).join("")||'<tr><td colspan="6">Noch keine Galerieeinträge.</td></tr>'}</tbody></table></div>`);
 document.querySelectorAll("[data-gallery]").forEach(b=>b.onclick=()=>galleryModal(Number(b.dataset.gallery)));$("#addGallery").onclick=()=>galleryModal(null)
}
function galleryModal(i){const d=ensureData(),g=i===null?{title:"",category:"3D-Druck",date:today(),customer:"",description:"",consent:false,visible:true,tags:""}:d.management.gallery[i];openModal("Auftragsgalerie",`<form id="galleryForm" class="form-grid"><label class="wide">Titel<input name="title" value="${esc(g.title)}"></label><label>Kategorie<input name="category" value="${esc(g.category)}"></label><label>Datum<input name="date" type="date" value="${esc(g.date)}"></label><label>Kundenname / Kürzel<input name="customer" value="${esc(g.customer||"")}"></label><label class="wide">Beschreibung<textarea name="description">${esc(g.description||"")}</textarea></label><label class="wide">Schlagwörter<input name="tags" value="${esc(g.tags||"")}></label><label class="check"><input name="visible" type="checkbox" ${g.visible!==false?"checked":""}> Öffentlich sichtbar</label><label class="check"><input name="consent" type="checkbox" ${g.consent?"checked":""}> Veröffentlichung freigegeben</label><div class="wide"><button class="main-btn">Speichern</button></div></form>`);$("#galleryForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n={title:f.get("title"),category:f.get("category"),date:f.get("date"),customer:f.get("customer"),description:f.get("description"),tags:f.get("tags"),visible:f.has("visible"),consent:f.has("consent")};i===null?d.management.gallery.push(n):Object.assign(g,n);closeModal();renderView()}
}
function guestbook(){
 const d=ensureData(), entries=d.management.guestbook;
 $("#view-guestbook").innerHTML=panel("Gästebuch moderieren",`<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Eintrag</th><th>Datum</th><th>Status</th><th></th></tr></thead><tbody>${entries.map((g,i)=>`<tr><td>${esc(g.name)}</td><td>${esc(g.text)}</td><td>${esc(g.date)}</td><td>${g.approved?"freigegeben":"wartet"}</td><td>${btn(g.approved?"Ausblenden":"Freigeben","outline-btn",'data-gb="'+i+'')}</td></tr>`).join("")||'<tr><td colspan="5">Keine Gästebucheinträge im Management-Speicher.</td></tr>'}</tbody></table></div>`);
 document.querySelectorAll("[data-gb]").forEach(b=>b.onclick=()=>{entries[Number(b.dataset.gb)].approved=!entries[Number(b.dataset.gb)].approved;renderView()})
}
function settings(){
 const d=ensureData(),site=d.site||{};
 $("#view-settings").innerHTML=panel("Shop & E-Mail",`<form id="settingsForm" class="form-grid"><label>Shopname<input name="shopName" value="${esc(d.shopName||site.shopName)}"></label><label>Untertitel<input name="tagline" value="${esc(d.tagline||site.tagline)}"></label><label class="wide">E-Mail<input name="email" value="${esc(d.contactEmail||site.contactEmail)}"></label><label class="wide">Hero-Titel<input name="heroTitle" value="${esc(d.heroTitle||site.heroTitle)}"></label><label class="wide">Hero-Text<textarea name="heroText">${esc(site.heroText||"")}</textarea></label><div class="wide"><button class="main-btn">Übernehmen</button></div></form><p class="muted">EmailJS Service-ID, Template-ID und Public Key bleiben separat in <code>js/email-config.js</code>.</p>`);
 $("#settingsForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);d.shopName=f.get("shopName");d.tagline=f.get("tagline");d.contactEmail=f.get("email");d.heroTitle=f.get("heroTitle");d.site={...(d.site||{}),shopName:d.shopName,tagline:d.tagline,contactEmail:d.contactEmail,heroTitle:d.heroTitle,heroText:f.get("heroText")};status("Einstellungen übernommen – noch nicht veröffentlicht.","ok");}
}
function backup(){
 $("#view-backup").innerHTML=panel("Backup & Wiederherstellung",`<div class="backup-box"><div class="panel"><h3>Export</h3><p class="muted">Sichere die komplette Shop-Konfiguration als JSON.</p><button id="exportBtn" class="main-btn">Backup herunterladen</button></div><div class="panel"><h3>Import</h3><p class="muted">Importiere eine zuvor gespeicherte JSON-Datei.</p><input id="importFile" type="file" accept="application/json"></div></div><div class="panel"><h3>Veröffentlichung</h3><p class="muted">Nach Änderungen immer „Alles veröffentlichen“ drücken, wenn du mit GitHub verbunden bist.</p><button id="backupSave" class="main-btn">Jetzt veröffentlichen</button></div>`);
 $("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(ensureData(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bine-kreativwerkstatt-backup.json";a.click();URL.revokeObjectURL(a.href)};
 $("#importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state.data=ensureData(JSON.parse(await f.text()));render();status("Backup importiert – bitte veröffentlichen.","ok")}catch(err){status("Backup ungültig: "+err.message,"error")}};
 $("#backupSave").onclick=save;
}

$("#loginBtn").onclick=login;$("#logoutBtn").onclick=logout;$("#saveBtn").onclick=save;$("#reloadBtn").onclick=async()=>{try{await loadGitHub();render();status("Neu geladen.","ok")}catch(e){status(e.message,"error")}};
$("#repoOwner").value=state.owner;$("#repoName").value=state.repo||"";
if(state.token&&state.owner){
  discoverShopRepo().then(found=>{state.repo=found.repo.name;state.branch=found.branch;return loadGitHub()}).then(()=>{enter()}).catch(()=>{sessionStorage.removeItem("bkw_admin_token");state.token=""});
}
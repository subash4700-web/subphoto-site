// ===== Tema (mørk default) =====
(function(){if(localStorage.getItem('subphoto_theme')==='light')document.body.classList.add('light');})();

// ===== Fælles logik for alle sider =====
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const C=window.CONFIG;
// --- admin ---
const FOCAL=JSON.parse(localStorage.getItem('subphoto_focal')||'{}');
const ORDER=JSON.parse(localStorage.getItem('subphoto_order')||'{}');
const HERO_OVERRIDE=JSON.parse(localStorage.getItem('subphoto_hero')||'{}');
const EVENTS_OVERRIDE=JSON.parse(localStorage.getItem('subphoto_events')||'{}');
const TEXT_OVERRIDE=JSON.parse(localStorage.getItem('subphoto_text')||'{}');
const EXTRA_EVENTS=JSON.parse(localStorage.getItem('subphoto_extra_events')||'{}');
const DELETED=JSON.parse(localStorage.getItem('subphoto_deleted')||'{}');
const EKSTRA_BILLEDER=JSON.parse(localStorage.getItem('subphoto_extra_billeder')||'{}');
const HIDDEN_KAT=JSON.parse(localStorage.getItem('subphoto_hidden_kat')||'[]');
const HIDDEN_EVENTS=JSON.parse(localStorage.getItem('subphoto_hidden_events')||'{}');
const SESSION_PATHS=new Map(); // basename → object URL (session only)
const SESSION_FILES=new Map(); // basename → {File, katId} (session only)
const ADMIN=new URLSearchParams(location.search).has('admin') || localStorage.getItem('subphoto_admin')==='1';
document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key.toLowerCase()==='a'){ e.preventDefault(); localStorage.setItem('subphoto_admin', localStorage.getItem('subphoto_admin')==='1'?'0':'1'); location.reload(); }});
// Tema-toggle knap
document.addEventListener('DOMContentLoaded',()=>{
  const nav=document.querySelector('.nav');
  if(!nav) return;
  const btn=document.createElement('button');
  btn.className='theme-toggle';
  const isLight=()=>document.body.classList.contains('light');
  btn.textContent=isLight()?'Mørk':'Lys';
  btn.onclick=()=>{ document.body.classList.toggle('light'); localStorage.setItem('subphoto_theme',isLight()?'light':'dark'); btn.textContent=isLight()?'Mørk':'Lys'; };
  nav.appendChild(btn);
});
const baseName=s=>String(s).split('/').pop();
const focalStyle=s=>{const bn=baseName(s),pos=FOCAL[bn]||(C.centerpoints||{})[bn];return pos?`object-position:${pos};`:'';};
function toast(msg){let t=document.createElement("div");t.style.cssText="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;z-index:9999;opacity:1;transition:opacity .4s";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),400)},2000);}
function setFocal(img){
  return e=>{ const r=img.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,Math.round((e.clientX-r.left)/r.width*100)));
    const y=Math.max(0,Math.min(100,Math.round((e.clientY-r.top)/r.height*100)));
    const pos=`${x}% ${y}%`; img.style.objectPosition=pos;
    FOCAL[img.dataset.src]=pos; localStorage.setItem('subphoto_focal',JSON.stringify(FOCAL));
    toast(`centerpoint: ${pos}`);
  };
}
let _sel=new Set(), _adminCtx=null;
const PAGE=document.body.dataset.page||"index.html";
const HERO_PAGES=["index.html","galleri.html"];
const NAV=[["index.html","Hjem"],["om.html","Om mig"],["galleri.html","Galleri","sub"],["prisliste.html","Prisliste"],["anmeldelser.html","Anmeldelser"],["kontakt.html","Kontakt"]];
document.title = C.brand+" — "+(document.body.dataset.title||C.tagline);
if($("#expYears")) $("#expYears").textContent = new Date().getFullYear()-C.startYear;

/* header */
(function(){
  const h=document.createElement("header"); h.id="hd";
  if(!HERO_PAGES.includes(PAGE)) h.classList.add("scrolled");
  const sub=C.kategorier.map(k=>`<li><a href="galleri.html#${k.id}">${k.navn}</a></li>`).join("");
  const items=NAV.map(([href,navn,type])=>{
    const active=href===PAGE?'active':'';
    if(type==="sub") return `<li class="has-sub"><a class="upper ${active}" href="${href}">${navn} ▾</a><ul class="sub">${sub}</ul></li>`;
    return `<li><a class="upper ${active}" href="${href}">${navn}</a></li>`;
  }).join("");
  h.innerHTML=`<div class="wrap nav"><a href="index.html" class="brand">${C.brand}</a>
    <button class="burger" aria-label="menu">☰</button><ul class="menu">${items}</ul></div>`;
  document.body.prepend(h);
  if(HERO_PAGES.includes(PAGE)) addEventListener("scroll",()=>h.classList.toggle("scrolled",scrollY>60));
  const menu=h.querySelector(".menu");
  h.querySelector(".burger").onclick=()=>menu.classList.toggle("open");
  menu.querySelectorAll("a").forEach(a=>a.onclick=()=>menu.classList.remove("open"));
})();

/* footer */
(function(){
  const f=document.createElement("footer");
  f.innerHTML=`<div class="wrap"><a href="index.html" class="brand">${C.brand}</a>
    <p>${C.tagline}</p><p style="margin-top:8px;opacity:.7">© 2026 ${C.brand} · Subash Suntharalingam · subphoto.dk · ${C.tlf}</p></div>`;
  document.body.appendChild(f);
})();

/* lightbox */
let lbList=[],lbIdx=0;
(function(){
  const lb=document.createElement("div"); lb.className="lb"; lb.id="lb";
  lb.innerHTML=`<span class="close">×</span><span class="nav-btn prev">‹</span><img alt=""><span class="nav-btn next">›</span>`;
  document.body.appendChild(lb);
  lb.querySelector(".close").onclick=()=>lb.classList.remove("open");
  lb.querySelector(".next").onclick=()=>lbStep(1); lb.querySelector(".prev").onclick=()=>lbStep(-1);
  lb.onclick=e=>{ if(e.target===lb) lb.classList.remove("open"); };
  document.addEventListener("keydown",e=>{ if(!lb.classList.contains("open"))return; if(e.key==="Escape")lb.classList.remove("open"); if(e.key==="ArrowRight")lbStep(1); if(e.key==="ArrowLeft")lbStep(-1); });
})();
function openLb(list,i){ lbList=list;lbIdx=i; const lb=$("#lb"); lb.querySelector("img").src=list[i]; lb.classList.add("open"); }
function lbStep(d){ lbIdx=(lbIdx+d+lbList.length)%lbList.length; $("#lb img").src=lbList[lbIdx]; }

/* hero (forside) */
if($("#slides")){
  const slidesEl=$("#slides"); let cur=0;
  const heroSlides=C.heroSlides||[];
  heroSlides.forEach((s,i)=>{
    const d=document.createElement("div");
    d.className="slide"+(i===0?" active":"");
    const src=HERO_OVERRIDE[`hero/${s.kat}/${i}`]||s.src;
    d.style.backgroundImage=`url('${src}')`;
    const bp=FOCAL[baseName(src)]; if(bp) d.style.backgroundPosition=bp;
    d.dataset.src=baseName(src); d.dataset.kat=s.kat;
    slidesEl.appendChild(d);
  });
  const katNavn=id=>(C.kategorier.find(k=>k.id===id)||{navn:id}).navn;
  const show=i=>{const sl=$$(".slide");cur=(i+sl.length)%sl.length;sl.forEach((s,n)=>s.classList.toggle("active",n===cur));
    const active=sl[cur]; $("#heroTag").textContent=C.tagline;$("#heroTitle").textContent=katNavn(active?.dataset.kat||'');$("#heroCount").textContent=`${cur+1} / ${sl.length}`;};
  show(0);$("#nextSlide").onclick=()=>show(cur+1);$("#prevSlide").onclick=()=>show(cur-1);setInterval(()=>show(cur+1),5500);
  if(ADMIN){
    const heroSection=slidesEl.closest("section")||slidesEl.parentElement;
    heroSection.style.cursor="crosshair";
    heroSection.addEventListener("click",e=>{
      if(e.target.closest("button"))return;
      const active=$(".slide.active"); if(!active)return;
      const r=active.getBoundingClientRect();
      const x=Math.max(0,Math.min(100,Math.round((e.clientX-r.left)/r.width*100)));
      const y=Math.max(0,Math.min(100,Math.round((e.clientY-r.top)/r.height*100)));
      const pos=`${x}% ${y}%`; active.style.backgroundPosition=pos;
      FOCAL[active.dataset.src]=pos; localStorage.setItem('subphoto_focal',JSON.stringify(FOCAL));
      toast(`hero centerpoint: ${pos}`);
    });
  }
}

/* kategori-kort */
function deleteKat(e,katId,navn){
  e.preventDefault(); e.stopPropagation();
  if(!confirm(`Slet galleriet "${navn}"?\n\nGalleriet skjules fra siden. Det kan genoprettes via "Nulstil alt".`)) return;
  if(!HIDDEN_KAT.includes(katId)) HIDDEN_KAT.push(katId);
  localStorage.setItem('subphoto_hidden_kat',JSON.stringify(HIDDEN_KAT));
  e.target.closest('.galcard').remove();
  toast(`"${navn}" slettet — husk at gemme.`);
}
function deleteEvent(e,katId,eventId,navn){
  e.preventDefault(); e.stopPropagation();
  const extraIdx=(EXTRA_EVENTS[katId]||[]).findIndex(ev=>ev.id===eventId);
  if(extraIdx>-1){
    if(!confirm(`Slet eventet "${navn}" permanent?\n\nDette event blev tilføjet i admin-panelet og kan ikke genoprettes.`)) return;
    EXTRA_EVENTS[katId].splice(extraIdx,1);
    localStorage.setItem('subphoto_extra_events',JSON.stringify(EXTRA_EVENTS));
    delete ORDER[katId+"/"+eventId]; localStorage.setItem('subphoto_order',JSON.stringify(ORDER));
    if(EVENTS_OVERRIDE[katId]) delete EVENTS_OVERRIDE[katId][eventId];
    localStorage.setItem('subphoto_events',JSON.stringify(EVENTS_OVERRIDE));
    delete TEXT_OVERRIDE[katId+"/"+eventId]; localStorage.setItem('subphoto_text',JSON.stringify(TEXT_OVERRIDE));
  } else {
    if(!confirm(`Slet eventet "${navn}"?\n\nEventet skjules fra siden. Det kan genoprettes via "Nulstil alt".`)) return;
    if(!HIDDEN_EVENTS[katId]) HIDDEN_EVENTS[katId]=[];
    if(!HIDDEN_EVENTS[katId].includes(eventId)) HIDDEN_EVENTS[katId].push(eventId);
    localStorage.setItem('subphoto_hidden_events',JSON.stringify(HIDDEN_EVENTS));
  }
  e.target.closest('.galcard').remove();
  toast(`"${navn}" slettet ✓`);
}
if($("#catgrid")){
  const visKat=ADMIN?C.kategorier:C.kategorier.filter(k=>!HIDDEN_KAT.includes(k.id));
  $("#catgrid").innerHTML=visKat.map(k=>{
    const cover=HERO_OVERRIDE["cover/"+k.id]||k.hero;
    const delBtn=ADMIN?`<button type="button" class="gal-del-btn" title="Slet galleri" onclick="deleteKat(event,'${k.id}',${JSON.stringify(k.navn).replace(/"/g,'&quot;')})">✕</button>`:'';
    const hidden=HIDDEN_KAT.includes(k.id)?' gal-hidden':'';
    return `<a class="galcard${hidden}" href="galleri.html#${k.id}"><div class="imgwrap">${delBtn}<img src="${cover}" alt="${k.navn}" style="${focalStyle(cover)}"></div><h3>${k.navn}</h3><div class="se">Se galleri</div></a>`;
  }).join("");
  // Hvis hash allerede matcher, triggrer hashchange ikke — tving renderFokus
  $$("#catgrid .galcard").forEach(a=>a.addEventListener("click",e=>{
    const targetHash=a.getAttribute("href").split("#")[1];
    if(location.hash==="#"+targetHash&&typeof renderFokus==="function"){ e.preventDefault(); renderFokus(); }
  }));
}

/* ratings */
if($("#ratings")) $("#ratings").innerHTML=(C.ratings||[]).map(r=>{
  const inner=`<div class="stars">★★★★★</div><div class="plat">${r.navn}</div><div class="note">${r.note}</div>`;
  return r.url?`<a class="rating" href="${r.url}" target="_blank" rel="noopener">${inner}</a>`:`<div class="rating">${inner}</div>`;
}).join("");



/* ===== FOKUS + ADMIN MANAGE ===== */
function getAllEvents(k){
  const extra=EXTRA_EVENTS[k.id]||[];
  const poolNames=(EVENTS_OVERRIDE[k.id]||{})['_pool']||[];
  const pool=poolNames.length?[{id:'_pool',navn:'Løse billeder',cover:null}]:[];
  return [...k.events,...extra,...pool];
}

function addNewEvent(katId){
  const modal=document.createElement("div"); modal.className="text-modal";
  modal.innerHTML=`<div class="text-modal-box"><h3>Nyt event</h3>
    <input id="newEvNavn" placeholder="Fx Maria &amp; Peter 2024">
    <div class="actions"><button class="sec" id="newEvCancel">Annuller</button><button id="newEvSave">Opret</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector("#newEvNavn").focus();
  modal.querySelector("#newEvCancel").onclick=()=>modal.remove();
  modal.querySelector("#newEvSave").onclick=()=>{
    const val=modal.querySelector("#newEvNavn").value.trim(); if(!val){toast("Skriv et navn");return;}
    const id='event-'+Date.now();
    if(!EXTRA_EVENTS[katId]) EXTRA_EVENTS[katId]=[];
    EXTRA_EVENTS[katId].push({id,navn:val,cover:null});
    if(!EVENTS_OVERRIDE[katId]) EVENTS_OVERRIDE[katId]={};
    EVENTS_OVERRIDE[katId][id]=[];
    localStorage.setItem('subphoto_extra_events',JSON.stringify(EXTRA_EVENTS));
    localStorage.setItem('subphoto_events',JSON.stringify(EVENTS_OVERRIDE));
    toast(`"${val}" oprettet`); modal.remove(); renderFokus();
  };
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
  modal.querySelector("#newEvNavn").addEventListener("keydown",e=>{if(e.key==="Enter")modal.querySelector("#newEvSave").click();if(e.key==="Escape")modal.remove();});
}

function getEventBilledNames(k,eventId){
  const eo=EVENTS_OVERRIDE[k.id]; if(eo&&eo[eventId]!==undefined) return [...eo[eventId]];
  const ev=(k.events||[]).find(e=>e.id===eventId); return ev?ev.billeder.map(b=>baseName(b)):[];
}

function renderBilledGrid(billeder,orderKey,altTekst,k,eventId){
  _sel.clear(); _adminCtx={k,eventId,billeder,orderKey};
  const container=$("#fokusImgs"); container.style.display='';
  const deletedSet=new Set(DELETED[orderKey]||[]);
  const visible=billeder.filter(b=>!deletedSet.has(baseName(b)));
  if(ADMIN){
    container.innerHTML=visible.map((src,i)=>{
      const isSession=src.startsWith('blob:');
      return `<div class="img-sel-wrap${isSession?' session-upload':''}" data-src="${baseName(src)}" data-i="${i}" draggable="true"><img src="${src}" style="${isSession?'':focalStyle(src)}" alt="${altTekst}" onerror="this.closest('.img-sel-wrap').remove()">${isSession?'<div class="session-badge">Ikke gemt</div>':''}<div class="sel-overlay"></div></div>`;
    }).join("");
    // Fjern gammel upload-zone hvis den eksisterer
    const oldZone=document.getElementById("uploadZone"); if(oldZone) oldZone.remove();
    // Upload-zone
    const zone=document.createElement("div"); zone.id="uploadZone"; zone.className="upload-zone";
    zone.innerHTML=`<input type="file" id="uploadInput" accept="image/*" multiple style="display:none"><label for="uploadInput">+ Tilføj billeder</label>`;
    container.parentNode.insertBefore(zone,container.nextSibling);
    zone.querySelector("#uploadInput").onchange=e=>handleUpload(e.target.files,k,orderKey,eventId);
    zone.ondragover=e=>{e.preventDefault();zone.classList.add("dz-over");};
    zone.ondragleave=()=>zone.classList.remove("dz-over");
    zone.ondrop=e=>{e.preventDefault();zone.classList.remove("dz-over");handleUpload(e.dataTransfer.files,k,orderKey,eventId);};
    const wrappers=[...container.querySelectorAll(".img-sel-wrap")];
    wrappers.forEach(wrap=>{
      const img=wrap.querySelector("img");
      const ov=wrap.querySelector(".sel-overlay");
      ov.addEventListener("click",e=>{
        if(e.altKey){ setFocal(img)(e); return; }
        wrap.classList.toggle("selected");
        const bn=wrap.dataset.src; _sel.has(bn)?_sel.delete(bn):_sel.add(bn);
        updateAdminToolbar();
      });
      wrap.addEventListener("dragstart",e=>{ e.dataTransfer.effectAllowed="move"; setTimeout(()=>wrap.classList.add("dragging"),0); });
      wrap.addEventListener("dragend",()=>{ wrap.classList.remove("dragging"); wrappers.forEach(w=>w.classList.remove("drag-over")); });
      wrap.addEventListener("dragover",e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; wrap.classList.add("drag-over"); });
      wrap.addEventListener("dragleave",()=>wrap.classList.remove("drag-over"));
      wrap.addEventListener("drop",e=>{ e.stopPropagation(); wrap.classList.remove("drag-over");
        const dr=container.querySelector(".dragging"); if(!dr||dr===wrap) return;
        const p=wrap.parentNode; const fi=[...p.children].indexOf(dr); const ti=[...p.children].indexOf(wrap);
        fi<ti?p.insertBefore(dr,wrap.nextSibling):p.insertBefore(dr,wrap);
        ORDER[orderKey]=[...p.querySelectorAll(".img-sel-wrap")].map(w=>w.dataset.src);
        localStorage.setItem('subphoto_order',JSON.stringify(ORDER)); toast("Rækkefølge gemt"); });
    });
    injectAdminToolbar();
  } else {
    const oldZone=document.getElementById("uploadZone"); if(oldZone) oldZone.remove();
    container.innerHTML=visible.map((src,i)=>`<img src="${src}" data-i="${i}" data-src="${baseName(src)}" style="${focalStyle(src)}" alt="${altTekst}" onerror="this.remove()">`).join("");
    container.querySelectorAll("img").forEach(img=>{ img.onclick=()=>openLb(visible,+img.dataset.i); });
  }
}

function injectAdminToolbar(){
  let tb=$("#adminToolbar");
  if(!tb){
    tb=document.createElement("div"); tb.id="adminToolbar"; tb.className="admin-toolbar";
    tb.innerHTML=`<span class="sel-count" id="selCount">0 valgt</span>
      <button class="sec" id="tbSelAll">Vælg alle</button>
      <button class="sec" id="tbSelClear">Ryd valg</button>
      <div class="manage-wrap"><button id="managBtn">Administrér ▾</button>
        <div class="manage-menu" id="managMenu"></div></div>`;
    const fi=$("#fokusImgs"); fi.parentNode.insertBefore(tb,fi);
    tb.querySelector("#tbSelAll").onclick=()=>{
      $$("#fokusImgs .img-sel-wrap").forEach(w=>{w.classList.add("selected");_sel.add(w.dataset.src);}); updateAdminToolbar(); };
    tb.querySelector("#tbSelClear").onclick=()=>{
      $$("#fokusImgs .img-sel-wrap").forEach(w=>w.classList.remove("selected")); _sel.clear(); updateAdminToolbar(); };
    tb.querySelector("#managBtn").onclick=e=>{ e.stopPropagation(); $("#managMenu").classList.toggle("open"); };
    document.addEventListener("click",()=>{ const m=$("#managMenu"); if(m) m.classList.remove("open"); });
  }
  updateAdminToolbar();
}

function updateAdminToolbar(){
  const tb=$("#adminToolbar"); if(!tb||!_adminCtx) return;
  const {k,eventId}=_adminCtx; const n=_sel.size;
  $("#selCount").textContent=n===0?"0 valgt":`${n} billede${n!==1?"r":""} valgt`;
  const hasEvs=k&&k.events&&k.events.length&&eventId;
  const otherEvs=hasEvs?getAllEvents(k).filter(e=>e.id!==eventId):[];
  if(hasEvs&&eventId!=='_pool'&&!otherEvs.find(e=>e.id==='_pool')) otherEvs.push({id:'_pool',navn:'Bryllup — ingen event'});
  const moveHtml=hasEvs
    ?`<div class="manage-group-label">Flyt til event</div>${otherEvs.length
        ?otherEvs.map(ev=>`<div class="manage-item" data-moveto="${ev.id}">→ ${TEXT_OVERRIDE[k.id+"/"+ev.id]||ev.navn}</div>`).join("")
        :"<div class='manage-item disabled'>Ingen andre events</div>"}`
    :"";
  $("#managMenu").innerHTML=`${moveHtml}
    <div class="manage-item" id="menuCover">Sæt som cover</div>
    <div class="manage-item" id="menuHero">Sæt som hero</div>
    <div class="manage-item" id="menuText">Rediger tekst</div>
    <div class="manage-item" id="menuGalCover">Sæt som galleri cover</div>
    <div class="manage-item" id="menuSync">🔄 Sync mappe</div>
    <div class="manage-item manage-danger" id="menuDelete">Fjern fra galleri</div>
    <div class="manage-item manage-danger" id="menuResetGal">Nulstil galleri-data</div>`;
  $("#managMenu").querySelectorAll("[data-moveto]").forEach(el=>el.onclick=e=>{e.stopPropagation();movePhotosToEvent(el.dataset.moveto);});
  $("#menuCover").onclick=e=>{e.stopPropagation();setCoverAction();};
  $("#menuHero").onclick=e=>{e.stopPropagation();setHeroAction();};
  $("#menuText").onclick=e=>{e.stopPropagation();editTextAction();};
  $("#menuGalCover").onclick=e=>{e.stopPropagation();setGalCoverAction();};
  $("#menuDelete").onclick=e=>{e.stopPropagation();deleteSelectedPhotos();};
  $("#menuSync").onclick=e=>{e.stopPropagation();syncFolderAction();};
  $("#menuResetGal").onclick=e=>{e.stopPropagation();resetGalleryData();};
}

function movePhotosToEvent(targetEventId){
  const {k,eventId,billeder}=_adminCtx; if(!_sel.size){toast("Vælg mindst ét billede");return;}
  const toMove=[..._sel];
  if(!EVENTS_OVERRIDE[k.id]) EVENTS_OVERRIDE[k.id]={};
  EVENTS_OVERRIDE[k.id][eventId]=billeder.map(b=>baseName(b)).filter(bn=>!toMove.includes(bn));
  const targetNames=getEventBilledNames(k,targetEventId);
  EVENTS_OVERRIDE[k.id][targetEventId]=[...targetNames,...toMove];
  localStorage.setItem('subphoto_events',JSON.stringify(EVENTS_OVERRIDE));
  const tev=getAllEvents(k).find(e=>e.id===targetEventId);
  const targetNavn=TEXT_OVERRIDE[k.id+"/"+targetEventId]||(tev?.navn)||targetEventId;
  toast(`${toMove.length} billede(r) flyttet til ${targetNavn}`);
  _sel.clear(); renderFokus();
}

function setCoverAction(){
  const {k,eventId,billeder}=_adminCtx;
  if(_sel.size!==1){toast("Vælg præcis ét billede som cover");return;}
  const path=billeder.find(b=>baseName(b)===[..._sel][0]);
  HERO_OVERRIDE[`${k.id}/${eventId}`]=path;
  localStorage.setItem('subphoto_hero',JSON.stringify(HERO_OVERRIDE));
  toast("Cover-billede gemt ✓"); $("#managMenu")?.classList.remove("open");
}

function setHeroAction(){
  const {k,billeder}=_adminCtx;
  if(_sel.size!==1){toast("Vælg præcis ét billede som hero");return;}
  const path=billeder.find(b=>baseName(b)===[..._sel][0]);
  HERO_OVERRIDE[`hero/${k.id}`]=path;
  localStorage.setItem('subphoto_hero',JSON.stringify(HERO_OVERRIDE));
  toast("Hero-billede gemt ✓"); $("#managMenu")?.classList.remove("open");
}

function editTextAction(){
  const {k,eventId}=_adminCtx; if(!eventId){toast("Åbn et specifikt event for at redigere tekst");return;}
  const key=k.id+"/"+eventId; const ev=getAllEvents(k).find(e=>e.id===eventId);
  const curNavn=TEXT_OVERRIDE[key]||(ev?.navn)||'';
  const modal=document.createElement("div"); modal.className="text-modal";
  modal.innerHTML=`<div class="text-modal-box"><h3>Rediger event-navn</h3>
    <input id="editNavn" value="${curNavn}" placeholder="Fx Maria &amp; Peter 2024">
    <div class="actions"><button class="sec" id="editCancel">Annuller</button><button id="editSave">Gem</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector("#editNavn").focus();
  modal.querySelector("#editCancel").onclick=()=>modal.remove();
  modal.querySelector("#editSave").onclick=()=>{
    const val=modal.querySelector("#editNavn").value.trim();
    if(val){ TEXT_OVERRIDE[key]=val; localStorage.setItem('subphoto_text',JSON.stringify(TEXT_OVERRIDE)); toast("Navn gemt ✓"); }
    modal.remove(); renderFokus();
  };
  modal.onclick=e=>{ if(e.target===modal) modal.remove(); };
  modal.querySelector("#editNavn").addEventListener("keydown",e=>{ if(e.key==="Enter") modal.querySelector("#editSave").click(); if(e.key==="Escape") modal.remove(); });
  $("#managMenu")?.classList.remove("open");
}

function handleUpload(files,k,orderKey,eventId){
  const newNames=[]; const katId=k.id;
  for(const file of [...files]){ if(!file.type.startsWith('image/')) continue; SESSION_PATHS.set(file.name,URL.createObjectURL(file)); SESSION_FILES.set(file.name,{file,katId}); idbSaveFile(katId,file); newNames.push(file.name); }
  if(!newNames.length) return;
  if(!EVENTS_OVERRIDE[katId]) EVENTS_OVERRIDE[katId]={};
  const key=eventId||'_uploads';
  const cur=eventId?getEventBilledNames(k,eventId):(EVENTS_OVERRIDE[katId]['_uploads']||[]);
  EVENTS_OVERRIDE[katId][key]=[...cur,...newNames.filter(n=>!cur.includes(n))];
  localStorage.setItem('subphoto_events',JSON.stringify(EVENTS_OVERRIDE));
  toast(`${newNames.length} billede(r) tilføjet — kopier filerne til billeder/${katId}/ for permanent lagring`);
  renderFokus();
}

function setGalCoverAction(){
  const {k}=_adminCtx; if(_sel.size!==1){toast("Vælg præcis ét billede");return;}
  const bn=[..._sel][0];
  const {billeder}=_adminCtx;
  const src=billeder.find(b=>baseName(b)===bn)||bn;
  if(src.startsWith('blob:')){toast("Billedet er ikke gemt til disk — kopier det til billeder/"+k.id+"/ og tryk Gem først");return;}
  HERO_OVERRIDE["cover/"+k.id]=src;
  localStorage.setItem('subphoto_hero',JSON.stringify(HERO_OVERRIDE));
  toast(`Galleri cover sat til ${bn}`);
}

async function syncFolderAction(){
  const {k}=_adminCtx||{}; if(!k){toast("Åbn et galleri først");return;}
  if(!('showDirectoryPicker' in window)){toast("Ikke understøttet i denne browser");return;}
  try{
    const root=await getSiteRoot();
    const billedDir=await root.getDirectoryHandle('billeder');
    const katDir=await billedDir.getDirectoryHandle(k.id);
    const existing=new Set([...k.billeder,...(EKSTRA_BILLEDER[k.id]||[])].map(baseName));
    const newFiles=[];
    for await(const [name,entry] of katDir.entries()){
      if(entry.kind==='file'&&/\.(jpg|jpeg|png|webp|gif)$/i.test(name)&&!existing.has(name)) newFiles.push(name);
    }
    if(!newFiles.length){toast("Ingen nye billeder fundet");return;}
    if(!EKSTRA_BILLEDER[k.id]) EKSTRA_BILLEDER[k.id]=[];
    newFiles.forEach(n=>EKSTRA_BILLEDER[k.id].push(`billeder/${k.id}/${n}`));
    localStorage.setItem('subphoto_extra_billeder',JSON.stringify(EKSTRA_BILLEDER));
    toast(`${newFiles.length} nye billeder tilføjet ✓ — tryk Gem`);
    renderFokus();
  }catch(e){if(e.name!=='AbortError')toast("Fejl: "+e.message);}
}

function resetGalleryData(){
  const {k,eventId}=_adminCtx||{};
  if(!k) return;
  const label=eventId?`event "${eventId}" i ${k.navn}`:k.navn;
  if(!confirm(`Nulstil al gemt data for ${label}? (rækkefølge, uploads, sletninger)\nOriginale billeder fra data.js gendannes.`)) return;
  if(eventId){
    if(EVENTS_OVERRIDE[k.id]) delete EVENTS_OVERRIDE[k.id][eventId];
    delete ORDER[k.id+"/"+eventId];
    if(DELETED[k.id+"/"+eventId]) delete DELETED[k.id+"/"+eventId];
  } else {
    delete ORDER[k.id];
    if(EVENTS_OVERRIDE[k.id]) delete EVENTS_OVERRIDE[k.id]['_uploads'];
    if(DELETED[k.id]) delete DELETED[k.id];
  }
  localStorage.setItem('subphoto_order',JSON.stringify(ORDER));
  localStorage.setItem('subphoto_events',JSON.stringify(EVENTS_OVERRIDE));
  localStorage.setItem('subphoto_deleted',JSON.stringify(DELETED));
  toast(`${label} nulstillet ✓`);
  renderFokus();
}

function deleteSelectedPhotos(){
  const {orderKey}=_adminCtx; if(!_sel.size){toast("Vælg mindst ét billede");return;}
  if(!confirm(`Fjern ${_sel.size} billede(r) fra galleriet?`)) return;
  if(!DELETED[orderKey]) DELETED[orderKey]=[];
  [..._sel].forEach(bn=>{if(!DELETED[orderKey].includes(bn))DELETED[orderKey].push(bn);});
  localStorage.setItem('subphoto_deleted',JSON.stringify(DELETED));
  toast(`${_sel.size} billede(r) fjernet`); _sel.clear(); renderFokus();
}

function renderFokus(){
  const fk=$("#fokus"); if(!fk) return;
  const hash=location.hash.replace("#","");
  const [katId,eventId]=hash.split("/");
  const k=C.kategorier.find(x=>x.id===katId);
  const catgridSection=$("#catgridSection");
  const pageHeroTitle=$("#pageHeroTitle");
  if(!k){ fk.style.display="none"; if(catgridSection)catgridSection.style.display="block"; if(pageHeroTitle)pageHeroTitle.textContent="Galleri"; return; }
  fk.style.display="block";
  if(catgridSection)catgridSection.style.display="none";
  if(pageHeroTitle)pageHeroTitle.textContent=k.navn;

  const setPriser=()=>{ $("#fokusPriser").innerHTML=k.pakker.map(p=>`<div class="price"><h3>${p.navn}</h3><div class="amount">${p.pris}</div><ul>${p.punkter.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join(""); $("#fokusRing").href="tel:"+C.tlfRaw; };

  if(k.events&&k.events.length&&!eventId){
    const existTb=$("#adminToolbar"); if(existTb) existTb.remove(); _adminCtx=null;
    $("#fokusNavn").innerHTML=k.navn; $("#fokusTitle").textContent=k.navn+" hos Sub Photo";
    $("#fokusImgs").style.display='block';
    $("#fokusImgs").innerHTML=`<div class="homecats" id="eventGrid"></div>`;
    const allEvs=getAllEvents(k); const allPaths=k.events.flatMap(e=>e.billeder);
    const hiddenEvSet=new Set(HIDDEN_EVENTS[katId]||[]);
    const visEvs=ADMIN?allEvs:allEvs.filter(ev=>!hiddenEvSet.has(ev.id));
    $("#eventGrid").innerHTML=visEvs.map(ev=>{
      const eoNames=(EVENTS_OVERRIDE[katId]||{})[ev.id]||[];
      const coverOverride=HERO_OVERRIDE[`${katId}/${ev.id}`];
      let cover=coverOverride||ev.cover||null;
      if(!cover&&eoNames.length){ cover=allPaths.find(p=>baseName(p)===eoNames[0])||null; }
      const navn=TEXT_OVERRIDE[katId+"/"+ev.id]||ev.navn;
      const delBtn=ADMIN?`<button type="button" class="gal-del-btn" title="Slet event" onclick="deleteEvent(event,'${katId}','${ev.id}',${JSON.stringify(navn).replace(/"/g,'&quot;')})">✕</button>`:'';
      const hidden=hiddenEvSet.has(ev.id)?' gal-hidden':'';
      return cover
        ?`<a class="galcard${hidden}" href="#${katId}/${ev.id}"><div class="imgwrap">${delBtn}<img src="${cover}" alt="${navn}" style="${focalStyle(cover)}"></div><h3>${navn}</h3><div class="se">Se billeder</div></a>`
        :`<a class="galcard event-empty${hidden}" href="#${katId}/${ev.id}"><div class="imgwrap">${delBtn}<div class="empty-cover">${navn[0]}</div></div><h3>${navn}</h3><div class="se">Se billeder</div></a>`;
    }).join("");
    if(ADMIN){ const btn=document.createElement("div"); btn.className="add-event-card"; btn.innerHTML=`<button onclick="addNewEvent('${katId}')">+ Tilføj event</button>`; $("#eventGrid").appendChild(btn); }
    setPriser(); window.scrollTo({top:0,behavior:"instant"}); return;
  }

  if(k.events&&eventId){
    const ev=getAllEvents(k).find(e=>e.id===eventId); if(!ev){ fk.style.display="none"; return; }
    const navn=TEXT_OVERRIDE[katId+"/"+eventId]||ev.navn;
    $("#fokusNavn").innerHTML=`<a href="#${katId}">${k.navn}</a><span class="bc-sep">›</span>${navn}`;
    $("#fokusTitle").textContent=navn;
    const orderKey=`${katId}/${eventId}`;
    const eoNames=EVENTS_OVERRIDE[katId]?.[eventId];
    let billeder;
    if(eoNames!==undefined){ const allPaths=k.events.flatMap(e=>e.billeder); billeder=eoNames.map(bn=>allPaths.find(p=>baseName(p)===bn)||SESSION_PATHS.get(bn)||`billeder/${katId}/${bn}`); }
    else { const stored=ORDER[orderKey]; billeder=stored?stored.map(bn=>ev.billeder.find(b=>baseName(b)===bn)||SESSION_PATHS.get(bn)||`billeder/${katId}/${bn}`):[...(ev.billeder||[])]; }
    renderBilledGrid(billeder,orderKey,navn,k,eventId);
    setPriser(); window.scrollTo({top:0,behavior:"instant"}); return;
  }

  const existTb=$("#adminToolbar"); if(existTb) existTb.remove(); _adminCtx=null;
  $("#fokusNavn").innerHTML=k.navn; $("#fokusTitle").textContent=k.navn+" hos Sub Photo";
  const stored=ORDER[katId];
  const uploadedNames=(EVENTS_OVERRIDE[katId]||{})['_uploads']||[];
  const ekstra=(EKSTRA_BILLEDER[katId]||[]);
  const allKnown=[...k.billeder,...ekstra];
  const realPath=bn=>allKnown.find(b=>baseName(b)===bn);
  let billeder=stored?stored.map(bn=>realPath(bn)||SESSION_PATHS.get(bn)||`billeder/${katId}/${bn}`):[...allKnown];
  uploadedNames.forEach(bn=>{if(!billeder.find(b=>baseName(b)===bn))billeder.push(realPath(bn)||SESSION_PATHS.get(bn)||`billeder/${katId}/${bn}`);});
  renderBilledGrid(billeder,katId,k.navn,k,null);
  setPriser(); window.scrollTo({top:0,behavior:"instant"});
}
if($("#fokus")){
  idbLoadFiles().then(()=>renderFokus());
  addEventListener("hashchange",renderFokus);
  $("#fokusClear").onclick=e=>{ e.preventDefault(); history.replaceState(null,"",location.pathname); renderFokus(); };
}

/* prisliste / faq / anmeldelser */
if($("#prisGrupper")) $("#prisGrupper").innerHTML=C.kategorier.filter(k=>!k.skjulFraPrisliste).map(k=>`<div class="pris-grp" id="pris-${k.id}"><h3 class="cat-h">${k.prislisteNavn||k.navn}</h3>
  <div class="prices">${k.pakker.map(p=>`<div class="price"><h3>${p.navn}</h3><div class="amount">${p.pris}</div><ul>${p.punkter.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div></div>`).join("");
if($("#faq")) $("#faq").innerHTML=C.faq.map(f=>`<div><h3>${f.sp}</h3><p>${f.sv}</p></div>`).join("");
if($("#reviews")) $("#reviews").innerHTML=C.anmeldelser.map(a=>`<div class="review"><p>„${a.tekst}"</p><div class="who">${a.navn}</div></div>`).join("");

/* ---- Fil-persistens (File System Access API + IndexedDB) ---- */
function _idb(){return new Promise((res,rej)=>{const r=indexedDB.open('subphoto-fh',2);r.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains('h'))db.createObjectStore('h');if(!db.objectStoreNames.contains('files'))db.createObjectStore('files');};r.onsuccess=e=>res(e.target.result);r.onerror=rej;});}
async function idbGet(k){const db=await _idb();return new Promise((res,rej)=>{const r=db.transaction('h').objectStore('h').get(k);r.onsuccess=()=>res(r.result);r.onerror=rej;});}
async function idbSet(k,v){const db=await _idb();return new Promise((res,rej)=>{const t=db.transaction('h','readwrite');t.objectStore('h').put(v,k);t.oncomplete=res;t.onerror=rej;});}
async function idbSaveFile(katId,file){try{const buf=await file.arrayBuffer();const db=await _idb();await new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put({buf,type:file.type,katId},`${katId}/${file.name}`);t.oncomplete=res;t.onerror=rej;});}catch(e){}}
async function idbDeleteFile(katId,name){try{const db=await _idb();await new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').delete(`${katId}/${name}`);t.oncomplete=res;t.onerror=rej;});}catch(e){}}
let _filesLoaded=false;
async function idbLoadFiles(){
  if(_filesLoaded) return; _filesLoaded=true;
  try{
    const db=await _idb();
    await new Promise((res,rej)=>{
      const req=db.transaction('files').objectStore('files').openCursor();
      req.onsuccess=e=>{
        const cur=e.target.result; if(!cur){res();return;}
        const key=String(cur.key); const {buf,type,katId}=cur.value;
        const name=key.slice(katId.length+1);
        if(!SESSION_PATHS.has(name)){
          const url=URL.createObjectURL(new Blob([buf],{type}));
          SESSION_PATHS.set(name,url);
          SESSION_FILES.set(name,{file:new File([buf],name,{type}),katId});
        }
        cur.continue();
      };
      req.onerror=rej;
    });
  }catch(e){}
}

function applyOverrides(d, overwrite=true){
  const merge=(target,src)=>{
    if(overwrite){ Object.assign(target,src); return; }
    Object.keys(src).forEach(k=>{ if(!(k in target)) target[k]=src[k]; });
  };
  if(d.centerpoints)merge(FOCAL,d.centerpoints);
  if(d.raekkefoelge)merge(ORDER,d.raekkefoelge);
  if(d.heroes)merge(HERO_OVERRIDE,d.heroes);
  if(d.events)merge(EVENTS_OVERRIDE,d.events);
  if(d.tekst)merge(TEXT_OVERRIDE,d.tekst);
  if(d.extra_events)merge(EXTRA_EVENTS,d.extra_events);
  if(d.deleted)merge(DELETED,d.deleted);
  if(d.ekstra_billeder)merge(EKSTRA_BILLEDER,d.ekstra_billeder);
  if(d.hidden_kat) d.hidden_kat.forEach(id=>{if(!HIDDEN_KAT.includes(id))HIDDEN_KAT.push(id);});
  if(d.hidden_events) Object.entries(d.hidden_events).forEach(([katId,ids])=>{if(!HIDDEN_EVENTS[katId])HIDDEN_EVENTS[katId]=[];ids.forEach(id=>{if(!HIDDEN_EVENTS[katId].includes(id))HIDDEN_EVENTS[katId].push(id);});});
  [['subphoto_focal',FOCAL],['subphoto_order',ORDER],['subphoto_hero',HERO_OVERRIDE],['subphoto_events',EVENTS_OVERRIDE],['subphoto_text',TEXT_OVERRIDE],['subphoto_extra_events',EXTRA_EVENTS],['subphoto_deleted',DELETED],['subphoto_extra_billeder',EKSTRA_BILLEDER],['subphoto_hidden_kat',HIDDEN_KAT],['subphoto_hidden_events',HIDDEN_EVENTS]].forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
}

function adminData(){return{centerpoints:FOCAL,raekkefoelge:ORDER,heroes:HERO_OVERRIDE,events:EVENTS_OVERRIDE,tekst:TEXT_OVERRIDE,extra_events:EXTRA_EVENTS,deleted:DELETED,ekstra_billeder:EKSTRA_BILLEDER,hidden_kat:HIDDEN_KAT,hidden_events:HIDDEN_EVENTS};}

async function getSiteRoot(){
  let h=await idbGet('siteRoot').catch(()=>null);
  if(h){ const p=await h.queryPermission({mode:'readwrite'}); if(p==='granted'||await h.requestPermission({mode:'readwrite'})==='granted') return h; }
  toast('Vælg subphoto-site mappen');
  h=await showDirectoryPicker({mode:'readwrite'});
  await idbSet('siteRoot',h); return h;
}

async function saveUploadedFiles(){
  if(!SESSION_FILES.size) return true;
  if(!('showDirectoryPicker' in window)) return false;
  try{
    const root=await getSiteRoot();
    const billedDir=await root.getDirectoryHandle('billeder',{create:false});
    for(const [name,{file,katId}] of SESSION_FILES){
      const katDir=await billedDir.getDirectoryHandle(katId,{create:true});
      const fh=await katDir.getFileHandle(name,{create:true});
      const w=await fh.createWritable(); await w.write(file); await w.close();
      await idbDeleteFile(katId,name);
    }
    SESSION_FILES.clear(); return true;
  }catch(e){ if(e.name!=='AbortError') console.error(e); return false; }
}

async function saveToFile(){
  const json=JSON.stringify(adminData(),null,2);
  if('showSaveFilePicker' in window){
    try{
      let handle=await idbGet('adminFile').catch(()=>null);
      let ok=false;
      if(handle){ const p=await handle.queryPermission({mode:'readwrite'}); ok=p==='granted'||await handle.requestPermission({mode:'readwrite'})==='granted'; }
      if(!ok){ alert('Vælg din "subphoto-site" mappe og gem filen der (samme sted som index.html) — ellers husker admin-panelet ikke dine ændringer næste gang.'); handle=await showSaveFilePicker({suggestedName:'subphoto-admin.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]}); await idbSet('adminFile',handle); }
      const w=await handle.createWritable(); await w.write(json); await w.close();
      // Gem uploadede billedfiler til disk efter JSON er gemt
      if(SESSION_FILES.size){
        const filesOk=await saveUploadedFiles();
        toast(filesOk?'Gemt til disk ✓':'JSON gemt ✓ — kopier billedfilerne manuelt til billeder/[kategori]/');
      } else { toast('Gemt til disk ✓'); }
      return;
    }catch(e){ if(e.name==='AbortError') return; }
  }
  alert('Filen downloades nu til din Downloads-mappe.\n\nFlyt den bagefter ind i din "subphoto-site" mappe (samme sted som index.html) — ellers husker admin-panelet ikke dine ændringer næste gang.');
  const bl=new Blob([json],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download='subphoto-admin.json'; a.click();
  toast('Downloadet — kopier filen til subphoto-site/');
}

async function tryAutoLoad(){
  await idbLoadFiles();
  if(!('showSaveFilePicker' in window)) return;
  try{
    const handle=await idbGet('adminFile').catch(()=>null); if(!handle) return;
    const perm=await handle.queryPermission({mode:'read'}); if(perm!=='granted') return;
    const file=await handle.getFile();
    const d=JSON.parse(await file.text());
    applyOverrides(d);
    renderFokus();
  }catch(e){}
}

/* admin-bar */
if(ADMIN){
  const bar=document.createElement("div"); bar.className="adminbar";
  bar.innerHTML=`<b>ADMIN</b> · galleri: <b>klik</b>=vælg · <b>træk</b>=flyt · <b>Alt+klik</b>=centerpoint · hero: <b>klik</b>=centerpoint · <button type="button" id="saveBtn">💾 Gem</button> <button type="button" id="clrAll">Nulstil alt</button>`;
  document.body.appendChild(bar);
  bar.querySelector("#saveBtn").onclick=()=>saveToFile();
  bar.querySelector("#clrAll").onclick=()=>{ if(confirm("Nulstil ALT (centerpoints, rækkefølge, heroes, events, tekst, slettede gallerier)?")){ ["subphoto_focal","subphoto_order","subphoto_hero","subphoto_events","subphoto_text","subphoto_extra_events","subphoto_deleted","subphoto_hidden_kat","subphoto_hidden_events"].forEach(k=>localStorage.removeItem(k)); idbSet('adminFile',null).catch(()=>{}); location.reload(); } };
  tryAutoLoad();
}

/* kontakt */
if($("#kForm")){
  $("#kTlf").textContent=C.tlf; $("#kTlf").href="tel:"+C.tlfRaw;
  $("#kEmail").textContent=C.kontakt.email; $("#kEmail").href="mailto:"+C.kontakt.email;
  $("#kBy").textContent=C.kontakt.by; $("#kIg").textContent=C.kontakt.instagram;
  $("#sendBtn").onclick=()=>{const f=$("#kForm");const[navn,mail,besked]=$$("#kForm input,#kForm textarea").map(x=>x.value);
    if(!f.reportValidity())return;location.href=`mailto:${C.kontakt.email}?subject=${encodeURIComponent("Henvendelse fra "+navn)}&body=${encodeURIComponent(besked+"\n\n"+navn+" ("+mail+")")}`;};
}

import { createBackend } from "./backend.js";
const STATUS = {
  ok:   {label:"Funcionando", short:"Funciona", color:"#43d68f"},
  weak: {label:"Fraca / falhando", short:"Fraca", color:"#f5b53f"},
  out:  {label:"Queimada", short:"Queimada", color:"#ff5a5f"},
  custom:{label:"Outro marcador", short:"Outro", color:"#8fb3ff"},
  multi:{label:"Poste com várias lâmpadas", short:"Múltiplo", color:"#ffcf6e"},
  missing:{label:"Deveria ter poste", short:"Deveria ter", color:"#d08cff"}
};
const TOKENS = ["ok","weak","out","multi","missing","custom"];
const EXTRA = new Set(["custom","missing"]);
const DEFAULT_MULTI = ["ok","ok","out"];
function lampsOf(p){ return p.status==="multi" ? (Array.isArray(p.lamps)&&p.lamps.length?p.lamps:DEFAULT_MULTI) : (EXTRA.has(p.status) ? [] : [p.status]); }
function lampWord(n){ return n+" lâmpada"+(n===1?"":"s"); }
function describeLamps(ls){
  const c={ok:0,weak:0,out:0}; ls.forEach(x=>c[x]++);
  const parts=[]; if(c.ok) parts.push(c.ok+(c.ok>1?" funcionando":" funcionando")); if(c.weak) parts.push(c.weak+(c.weak>1?" fracas":" fraca")); if(c.out) parts.push(c.out+(c.out>1?" queimadas":" queimada"));
  return lampWord(ls.length)+": "+parts.join(", ");
}
function bulbSVG(st,cx,cy,r){
  const c=STATUS[st].color;
  const glow = st==="out" ? "" : `<circle class="halo" cx="${cx}" cy="${cy}" r="${r*1.7}" fill="${c}" opacity="${st==='ok'?0.4:0.22}"/>`;
  if(st==="out") return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a1216" stroke="${c}" stroke-width="2"/><path d="M${cx-r*.5} ${cy-r*.5}l${r} ${r}M${cx+r*.5} ${cy-r*.5}l${-r} ${r}" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/>`;
  return glow+`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`+(st==="weak"?`<path d="M${cx} ${cy-r}a${r} ${r} 0 0 1 0 ${2*r}z" fill="#0b1020" opacity=".55"/>`:"");
}
function multiSVG(ls, cls){
  const n=ls.length, xs = n===2?[9,31]:n===3?[6,20,34]:[5,15,25,35].slice(0,n), r=n>=4?4.3:5, y=10;
  const drops=xs.map(x=>`<path d="M${x} 16.5 V${y+r-1}" stroke="#ece8dc" stroke-width="1.6" opacity=".85"/>`).join("");
  return `<svg class="lamp wide ${cls||''}" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 39 V16.5 M${xs[0]} 16.5 H${xs[xs.length-1]}" stroke="#ece8dc" stroke-width="2" stroke-linecap="round" fill="none" opacity=".85"/>${drops}
    ${ls.map((st,i)=>bulbSVG(st,xs[i],y,r)).join("")}</svg>`;
}
const ORDER = ["ok","weak","out"];
const CENTER = [-21.9836, -47.8826];

function lampSVG(st, cls, lamps){
  if(st==="multi") return multiSVG(lamps||DEFAULT_MULTI, cls);
  if(st==="missing") return `<svg class="lamp ${cls||''}" viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 39 V22" stroke="#d08cff" stroke-width="2" stroke-dasharray="2.5 2.5" stroke-linecap="round"/>
    <circle cx="15" cy="13" r="8.5" fill="rgba(11,16,32,.85)" stroke="#d08cff" stroke-width="2" stroke-dasharray="3 2.4"/>
    <path d="M15 9v8M11 13h8" stroke="#d08cff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const c = STATUS[st].color;
  if(st==="custom") return `<svg class="lamp ${cls||''}" viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 39 C15 39 4 25 4 15 a11 11 0 0 1 22 0 C26 25 15 39 15 39z" fill="${c}" stroke="#0b1020" stroke-width="1.5"/>
    <path d="M15 8.5 l2 4.2 4.5.6-3.3 3.1.8 4.5L15 18.7l-4 2.2.8-4.5-3.3-3.1 4.5-.6z" fill="#0b1020"/></svg>`;
  const glow = st==="out" ? "" : `<circle class="halo" cx="15" cy="13" r="12" fill="${c}" opacity="${st==='ok'?0.45:0.25}"/>`;
  const bulb = st==="out"
    ? `<circle cx="15" cy="13" r="7" fill="#2a1216" stroke="${c}" stroke-width="2.5"/><path d="M11.5 9.5l7 7M18.5 9.5l-7 7" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`
    : `<circle cx="15" cy="13" r="7" fill="${c}"/>` + (st==="weak" ? `<path d="M15 6a7 7 0 0 1 0 14z" fill="#0b1020" opacity=".55"/>` : "");
  return `<svg class="lamp ${cls||''}" viewBox="0 0 30 40" aria-hidden="true">${glow}
    <path d="M15 39 L15 22" stroke="#ece8dc" stroke-width="2" stroke-linecap="round" opacity=".85"/>
    ${bulb}</svg>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function fmt(ts){ if(!ts) return "—"; const d=new Date(ts); return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"})+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
function uid(){ return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

// tokens
TOKENS.forEach(st=>{ const b=document.getElementById("tk-"+st); b.innerHTML = `<em class="badge zero" id="bd-${st}" aria-label="quantidade">0</em>` + lampSVG(st,"") + `<span>${STATUS[st].short}</span>`; });
function countTypes(){ const c={}; TOKENS.forEach(t=>c[t]=0); for(const p of points.values()) if(c[p.status]!==undefined) c[p.status]++; return c; }

// ---------- map ----------
const map = L.map("map",{zoomControl:true,preferCanvas:true,attributionControl:true,zoomSnap:0.5,maxZoom:21,minZoom:14,tap:false})
  .setView(CENTER, 16.5);
map.zoomControl.setPosition("topright");
map.attributionControl.setPrefix(false);
const baseVector = L.layerGroup().addTo(map);
const tilesOSM = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxNativeZoom:19,maxZoom:21,attribution:"© colaboradores do OpenStreetMap"});
const tilesSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxNativeZoom:19,maxZoom:21,attribution:"Imagens © Esri, Maxar, Earthstar Geographics"});
const BASES = {"Noturno":baseVector,"Ruas (OpenStreetMap)":tilesOSM,"Satélite":tilesSat};
L.control.layers(BASES,null,{position:"topright",collapsed:true}).addTo(map);
let baseMode="Noturno";
map.on("baselayerchange",e=>{ baseMode=e.name; document.body.dataset.base = baseMode==="Noturno"?"night":baseMode==="Satélite"?"sat":"osm"; if(typeof placeLabels==="function") placeLabels(); });
document.body.dataset.base="night";
const baseRenderer = L.canvas({padding:0.5});

fetch("campus.json").then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(drawBase).catch(()=>{
  const e=document.getElementById("empty-map"); e.hidden=false;
  e.textContent="Mapa-base do campus ainda não carregado. Os marcadores funcionam normalmente.";
});

function drawBase(g){
  map.attributionControl.addAttribution("Mapa-base © colaboradores do OpenStreetMap");
  const style = f=>{
    const k=f.properties.k;
    if(k==="bldg") return {renderer:baseRenderer,color:"#2c3760",weight:1,fillColor:"#1d2542",fillOpacity:1};
    if(k==="green") return {renderer:baseRenderer,stroke:false,fillColor:"#0f1d1c",fillOpacity:1};
    if(k==="water") return {renderer:baseRenderer,stroke:false,fillColor:"#12264a",fillOpacity:1};
    if(k==="park") return {renderer:baseRenderer,color:"#20304a",weight:1,fillColor:"#13203a",fillOpacity:1};
    if(k==="area") return {renderer:baseRenderer,stroke:false,fillColor:"#121a30",fillOpacity:1};
    if(k==="campus") return {renderer:baseRenderer,color:"#ffcf6e",weight:1.2,opacity:.35,dashArray:"4 6",fill:false};
    if(k==="road") return {renderer:baseRenderer,color:"#3b4670",weight:5,lineCap:"round",lineJoin:"round"};
    if(k==="minor") return {renderer:baseRenderer,color:"#34406a",weight:3.5,lineCap:"round",lineJoin:"round"};
    if(k==="path") return {renderer:baseRenderer,color:"#566294",weight:1.6,dashArray:"3 4",lineCap:"round"};
    return {renderer:baseRenderer,color:"#2a3354",weight:1};
  };
  const layers = ["area","campus","green","park","water","road","minor","path","bldg"];
  layers.forEach(k=>{
    const feats = g.features.filter(f=>f.properties.k===k);
    if(feats.length) L.geoJSON({type:"FeatureCollection",features:feats},{style,interactive:false}).addTo(baseVector);
  });
  // OSM street lamps as faint reference dots
  const lamps = g.features.filter(f=>f.properties.k==="lamp");
  if(lamps.length){
    const lg=L.layerGroup(lamps.map(f=>L.circleMarker([f.geometry.coordinates[1],f.geometry.coordinates[0]],
      {renderer:baseRenderer,radius:2.2,stroke:false,fillColor:"#8a91ad",fillOpacity:.7,interactive:false})));
    lg.addTo(baseVector);
  }
  buildLabels(g);
  buildRefs(g);
  if(g.bbox){ const b=L.latLngBounds([g.bbox[1],g.bbox[0]],[g.bbox[3],g.bbox[2]]); map.fitBounds(b,{padding:[10,10]}); map.setMaxBounds(b.pad(0.35)); }
}


// ---------- labels (collision-aware) ----------
const LBL_MIN={area:15.5,bldg:16.5,street:16.5,poi:17.5,stop:17.5};
const LBL_PRI={area:1,bldg:2,street:3,stop:4,poi:5};
let LABELS=[];
const lblPane=map.createPane("labels"); lblPane.style.zIndex=450; lblPane.style.pointerEvents="none";
function shortName(n,z){
  if(z>=18.5) return n;
  const m=n.match(/\s[-–]\s([A-Z0-9][\w\/.]{1,12})$/); if(m) return m[1];
  n=n.replace(/^Departamento de /,"Depto. ").replace(/^Laboratório /,"Lab. ").replace(/^Avenida /,"Av. ").replace(/^Rua /,"R. ").replace(/^Professor /,"Prof. ");
  return n.length>34 && z<18 ? n.slice(0,32)+"…" : n;
}
function buildLabels(g){
  LABELS=(g.labels||[]).slice().sort((a,b)=>LBL_PRI[a.t]-LBL_PRI[b.t]).map(l=>{
    const el=document.createElement("div"); el.className="lbl lbl-"+l.t; lblPane.appendChild(el);
    return {...l,el,shown:""};
  });
  map.on("zoomend moveend",placeLabels); placeLabels();
}
function placeLabels(){
  const z=map.getZoom(), size=map.getSize(), placed=[];
  const fs = z>=18.5?12:z>=17.5?11:10.5;
  for(const l of LABELS){
    let show=z>=LBL_MIN[l.t];
    let pt=null,box=null;
    if(show){
      const cp=map.latLngToContainerPoint([l.c[1],l.c[0]]);
      if(cp.x<-80||cp.y<-40||cp.x>size.x+80||cp.y>size.y+40) show=false;
      else{
        const txt=shortName(l.n,z);
        if(l.shown!==txt){ l.el.textContent=txt; l.shown=txt; }
        const w=txt.length*fs*0.56+6, h=fs+4;
        const a=Math.abs((l.a||0)*Math.PI/180);
        const bw=w*Math.cos(a)+h*Math.sin(a), bh=w*Math.sin(a)+h*Math.cos(a);
        box=[cp.x-bw/2,cp.y-bh/2,cp.x+bw/2,cp.y+bh/2];
        if(placed.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1])) show=false;
        else { placed.push(box); pt=map.latLngToLayerPoint([l.c[1],l.c[0]]); }
      }
    }
    l.el.hidden=!show;
    if(show){ l.el.style.fontSize=fs+"px"; l.el.style.transform=`translate(${pt.x}px,${pt.y}px) translate(-50%,-50%) rotate(${l.a||0}deg)`; }
  }
}

// ---------- reference: what is near a point ----------
let REF={bld:[],st:[],poi:[]};
function buildRefs(g){
  for(const f of g.features){
    const p=f.properties;
    if(p.name && f.geometry.type==="Polygon") REF.bld.push({n:p.name,r:f.geometry.coordinates});
    else if(p.n && f.geometry.type==="LineString") REF.st.push({n:p.n,c:f.geometry.coordinates});
  }
  REF.poi=(g.labels||[]).filter(l=>l.t==="poi"||l.t==="stop");
  render();
}
function toXY(lng,lat,lat0){ return [lng*111320*Math.cos(lat0*Math.PI/180), lat*110540]; }
function segDist(p,a,b){ const dx=b[0]-a[0],dy=b[1]-a[1]; const L=dx*dx+dy*dy; let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy); }
function inRing(p,ring){ let c=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const a=ring[i],b=ring[j]; if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
function lineDist(p,coords,lat0){ let m=Infinity; for(let i=0;i<coords.length-1;i++) m=Math.min(m,segDist(p,toXY(coords[i][0],coords[i][1],lat0),toXY(coords[i+1][0],coords[i+1][1],lat0))); return m; }
function nearby(lat,lng){
  if(!REF.bld.length && !REF.st.length) return null;
  const p=toXY(lng,lat,lat);
  let best=null;
  for(const b of REF.bld){
    for(const r of b.r){
      const inside=inRing([lng,lat],r);
      const d=inside?0:lineDist(p,r,lat);
      if(!best||d<best.d) best={n:b.n,d};
    }
  }
  for(const q of REF.poi){ const d=Math.hypot(...[0,1].map(i=>p[i]-toXY(q.c[0],q.c[1],lat)[i])); if(!best||d<best.d-5) best={n:q.n,d}; }
  let st=null;
  for(const s of REF.st){ const d=lineDist(p,s.c,lat); if(!st||d<st.d) st={n:s.n,d}; }
  const out={};
  if(best && best.d<=120) out.perto=best.n, out.dist=Math.round(best.d);
  if(st && st.d<=60) out.via=st.n;
  return out;
}
function refText(r){
  if(!r) return "";
  const parts=[];
  if(r.via) parts.push(r.via);
  if(r.perto) parts.push(r.dist<=3?`junto a ${r.perto}`:`a ${r.dist} m de ${r.perto}`);
  return parts.join(" · ");
}

// ---------- state ----------
const points = new Map();   // id -> data
const markers = new Map();  // id -> L.marker
let backend = null, user = null, isAdmin = false, access = undefined, users = [];
let unsubAccess = null, unsubUsers = null, afterLogin = false;
const canEdit = () => !!user && (isAdmin || (access && access.status==="aprovado"));
const pendingIds = new Set();
let syncMeta = {pending:false, fromCache:true, error:null};
let selectedId = null, armedStatus = null, movingId = null;

function iconFor(p, id){
  const cls = ["pin-icon","m-"+p.status]; if(pendingIds.has(id)) cls.push("pending"); if(movingId===id) cls.push("moving");
  const tag = p.status==="custom" ? `<span class="pin-tag${p.nome?"":" empty"}">${esc(p.nome||"sem nome")}</span>` : "";
  return L.divIcon({className:cls.join(" "),html:lampSVG(p.status,"pin",lampsOf(p))+tag,iconSize:p.status==="multi"?[40,40]:[30,40],iconAnchor:p.status==="multi"?[20,39]:[15,39]});
}
function render(){
  // markers
  for(const [id,m] of markers){ if(!points.has(id)){ m.remove(); markers.delete(id); } }
  for(const [id,p] of points){
    let m = markers.get(id);
    if(!m){
      m = L.marker([p.lat,p.lng],{icon:iconFor(p,id),draggable:false,keyboard:true,title:p.status==="custom"?(p.nome||"Outro marcador"):p.status==="multi"?describeLamps(lampsOf(p)):STATUS[p.status].label,riseOnHover:true});
      m.on("click",()=>openPoint(id));
      m.on("dragend",()=>{ const ll=m.getLatLng(); savePoint(id,{...points.get(id),lat:+ll.lat.toFixed(7),lng:+ll.lng.toFixed(7),updatedAt:Date.now()}); });
      m.addTo(map); markers.set(id,m);
    } else {
      if(!m.dragging || !m.dragging._draggable || !m.dragging._draggable._moving){ const ll=m.getLatLng(); if(ll.lat!==p.lat||ll.lng!==p.lng) m.setLatLng([p.lat,p.lng]); }
      m.setIcon(iconFor(p,id));
    }
    if(movingId===id) m.dragging.enable(); else if(m.dragging) m.dragging.disable();
  }
  // tally
  const n={ok:0,weak:0,out:0}; for(const p of points.values()) lampsOf(p).forEach(x=>n[x]++);
  const byType=countTypes();
  TOKENS.forEach(t=>{ const b=document.getElementById("bd-"+t); if(b){ b.textContent=byType[t]; b.classList.toggle("zero",!byType[t]); } });
  const totalMarks=points.size;
  document.getElementById("n-total").textContent = totalMarks+" marcaç"+(totalMarks===1?"ão":"ões")+" · "+lampWord(n.ok+n.weak+n.out);
  renderSync();
  const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest("#sheet input");
  if(!document.getElementById("sheet").hidden && !typing){
    if(sheetMode==="point" && selectedId){ if(points.has(selectedId)) openPoint(selectedId,true); else closeSheet(); }
    if(sheetMode==="sum") openSummary(true);
  }
}
function renderSync(){
  const el=document.getElementById("sync");
  el.className="sync";
  if(!backend){ el.textContent="conectando…"; return; }
  if(backend.mode==="demo"){ el.textContent="demonstração · só neste aparelho"; el.classList.add("warn"); return; }
  if(syncMeta.error){ el.textContent="erro de conexão"; el.classList.add("bad"); return; }
  const k=pendingIds.size;
  if(k && !navigator.onLine){ el.textContent=`offline · ${k} a enviar`; el.classList.add("warn"); }
  else if(k){ el.textContent=`enviando ${k}…`; el.classList.add("warn"); }
  else if(!navigator.onLine){ el.textContent="offline"; el.classList.add("warn"); }
  else el.textContent = syncMeta.fromCache ? "sincronizando…" : "salvo ✓";
}
window.addEventListener("online",renderSync); window.addEventListener("offline",renderSync);

// ---------- persistence ----------
function stamp(data, isNew){
  const d={...data, updatedBy:user.uid, updatedByName:user.name};
  if(isNew || !d.createdBy){ d.createdBy=user.uid; d.createdByName=user.name; }
  for(const k of Object.keys(d)) if(d[k]===undefined) delete d[k];
  return d;
}
function writeError(e){
  const c=e&&e.code||"";
  if(/permission/.test(c)) toast("Sem permissão para salvar esta alteração.");
  else toast("Não foi possível salvar ("+(c||"erro")+").");
}
function savePoint(id, data){
  if(!requireLogin()) return;
  const isNew=!points.has(id);
  if(!isNew && !canEditPoint(points.get(id))){ toast("Só quem marcou ou um administrador pode alterar este ponto."); return; }
  const d=stamp(data,isNew);
  points.set(id,d); pendingIds.add(id); render();
  backend.set(id,d).catch(e=>{ writeError(e); });
}
function removePoint(id){
  if(!requireLogin()) return;
  const old=points.get(id);
  points.delete(id); render();
  backend.remove(id).catch(e=>{ writeError(e); if(old){ points.set(id,old); render(); } });
}
function canEditPoint(p){ return canEdit() && (isAdmin || p.createdBy===user.uid); }
function canDelete(p){ return canEditPoint(p); }
function nearestExisting(latlng){
  let best=null;
  for(const [id,p] of points){ const d=map.distance(latlng,[p.lat,p.lng]); if(!best||d<best.d) best={id,d}; }
  return best;
}
function addPoint(latlng, status, skipDupCheck){
  if(!requireLogin()) return;
  if(!skipDupCheck && status!=="custom"){
    const near=nearestExisting(latlng);
    if(near && near.d<4){
      confirmSheet(`Já existe um marcador a ${Math.max(1,Math.round(near.d))} m daqui. Pode ser o mesmo poste.`,
        "Marcar mesmo assim", ()=>addPoint(latlng,status,true), "Ver o existente", ()=>openPoint(near.id));
      return;
    }
  }
  const now=Date.now(); const id=uid();
  const data={lat:+latlng.lat.toFixed(7),lng:+latlng.lng.toFixed(7),status,createdAt:now,updatedAt:now,history:[{s:status,t:now}]};
  if(status==="multi"){ data.lamps=DEFAULT_MULTI.slice(); data.history=[{s:"multi",l:data.lamps.slice(),t:now}]; }
  savePoint(id,data);
  const m=markers.get(id); if(m && m._icon){ m._icon.animate?.([{transform:m._icon.style.transform+" translateY(-14px)"},{transform:m._icon.style.transform}],{duration:260,easing:"ease-out"}); }
  if(status==="custom"){ arm(null); openPoint(id,false,true); }
  else if(status==="multi"){ arm(null); openPoint(id); toast("Poste múltiplo marcado · ajuste as lâmpadas"); }
  else if(status==="missing") toast("Ponto sem poste marcado");
  else toast(STATUS[status].label+" marcada");
}
function setLamps(id, lamps){
  const p=points.get(id); if(!p) return;
  if(p.status==="multi" && JSON.stringify(p.lamps)===JSON.stringify(lamps)) return;
  const now=Date.now(); const history=(p.history||[]).concat([{s:"multi",l:lamps.slice(),t:now}]).slice(-30);
  savePoint(id,{...p,status:"multi",lamps:lamps.slice(),updatedAt:now,history});
}
function setName(id, nome){
  const p=points.get(id); nome=(nome||"").trim().slice(0,80);
  if(!p||(p.nome||"")===nome) return;
  savePoint(id,{...p,nome,updatedAt:Date.now()});
}
function setStatus(id, status){
  const p=points.get(id); if(!p||p.status===status) return;
  const now=Date.now(); const history=(p.history||[]).concat([{s:status,t:now}]).slice(-30);
  savePoint(id,{...p,status,updatedAt:now,history});
}

// ---------- backend ----------
render();
createBackend().then(b=>{
  backend=b;
  if(b.mode==="demo"){ const db=document.getElementById("demo-banner"); db.hidden=false; db.onclick=()=>db.hidden=true; }
  b.onAuth(async u=>{
    user=u; isAdmin=false; access=undefined; users=[];
    unsubAccess&&unsubAccess(); unsubUsers&&unsubUsers(); unsubAccess=unsubUsers=null;
    renderUser();
    if(u){
      isAdmin=await b.isAdmin(u.uid);
      unsubAccess=b.watchMyAccess(u.uid, a=>{
        const was=access&&access.status; access=a; renderUser(); render();
        if(was && was!=="aprovado" && a && a.status==="aprovado") toast("Seu acesso foi aprovado. Você já pode marcar!");
        if(afterLogin){ afterLogin=false; if(!canEdit()) openAccessSheet(); else toast("Pronto, você já pode marcar"); }
      });
      if(isAdmin) unsubUsers=b.watchUsers(list=>{ users=list; renderUser(); if(sheetMode==="requests") openRequests(); });
      renderUser();
    }
    render();
  });
  b.subscribe((docs,meta)=>{
    syncMeta={pending:meta.pending,fromCache:meta.fromCache,error:null};
    const seen=new Set(); pendingIds.clear();
    for(const d of docs){ seen.add(d.id); if(d.pending) pendingIds.add(d.id); if(d.data && STATUS[d.data.status]) points.set(d.id,d.data); }
    for(const id of [...points.keys()]) if(!seen.has(id)) points.delete(id);
    render();
  }, err=>{ syncMeta.error=err; renderSync(); toast("Falha ao carregar os dados: "+(err&&err.code||"erro")); });
  renderSync();
}).catch(e=>{ console.error(e); toast("Não foi possível iniciar o banco de dados."); });

// ---------- placing: drag from dock ----------
const hint=document.getElementById("hint");
const defaultHint=hint.innerHTML;
let drag=null;
const LIFT=56; // px above the finger, so the finger doesn't hide the spot
document.querySelectorAll(".token").forEach(btn=>{
  btn.addEventListener("pointerdown",e=>{
    if(e.button!==0 && e.pointerType==="mouse") return;
    btn.setPointerCapture(e.pointerId);
    drag={st:btn.dataset.status,x0:e.clientX,y0:e.clientY,moved:false,ghost:null,lift:e.pointerType==="touch"?LIFT:0};
  });
  btn.addEventListener("pointermove",e=>{
    if(!drag) return;
    if(!drag.moved && Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)<8) return;
    if(!drag.moved){ drag.moved=true; const g=document.createElement("div"); g.className="ghost"; g.innerHTML=lampSVG(drag.st,"pin"); const gw=drag.st==="multi"?58:44; g.style.width=gw+"px"; g.firstChild.style.width=gw+"px"; g.firstChild.style.height="58px"; document.body.appendChild(g); drag.ghost=g; hint.innerHTML=drag.st==="custom"?"Solte no local · depois você dá um nome":drag.st==="missing"?"Solte onde deveria haver um poste":"Solte sobre o poste · a ponta do marcador indica o local"; }
    drag.ghost.style.left=e.clientX+"px"; drag.ghost.style.top=(e.clientY-drag.lift)+"px";
  });
  const end=e=>{
    if(!drag) return;
    const d=drag; drag=null;
    if(d.ghost){ d.ghost.remove(); hint.innerHTML=defaultHint;
      if(e.type==="pointerup"){
        const rect=map.getContainer().getBoundingClientRect();
        const x=e.clientX-rect.left, y=e.clientY-d.lift-rect.top;
        const dockTop=document.querySelector(".dock").getBoundingClientRect().top;
        if(x>=0&&y>=0&&x<=rect.width&&(e.clientY-d.lift)<dockTop-4) addPoint(map.containerPointToLatLng([x,y]), d.st);
      }
    } else if(e.type==="pointerup"){ arm(armedStatus===d.st?null:d.st); }
  };
  btn.addEventListener("pointerup",end); btn.addEventListener("pointercancel",end);
  btn.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); arm(armedStatus===btn.dataset.status?null:btn.dataset.status); }});
});
function arm(st){
  armedStatus=st;
  document.querySelectorAll(".token").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.status===st)));
  if(st) updateHint(); else hint.innerHTML=defaultHint;
  map.getContainer().style.cursor = st ? "crosshair" : "";
}
map.on("click",e=>{
  if(movingId){ return; }
  if(armedStatus){ addPoint(e.latlng, armedStatus); }
});

// ---------- sheet ----------
const sheet=document.getElementById("sheet"), scrim=document.getElementById("scrim");
let sheetMode=null;
scrim.addEventListener("click",closeSheet);
function showSheet(html, mode){ sheet.innerHTML=`<div class="grab"></div><div class="inner">${html}</div>`; sheet.hidden=false; scrim.hidden=(mode==="point"&&false); sheetMode=mode; }
function closeSheet(){ sheet.hidden=true; scrim.hidden=true; sheetMode=null; selectedId=null; }

function openPoint(id, refresh, focusName){
  openPointInner(id, refresh, focusName);
  if(sheetMode==="point" && selectedId===id) decorate(id);
}
function decorate(id){
  const p=points.get(id); if(!p) return;
  const meta=sheet.querySelector(".meta");
  if(meta && (p.createdByName||p.updatedByName)){
    const w=document.createElement("div"); w.className="who";
    const c=p.createdByName||"—", u=p.updatedByName||c;
    w.textContent = u!==c ? `Marcado por ${c} · última alteração por ${u}` : `Marcado por ${c}`;
    meta.after(w);
  }
  const del=sheet.querySelector("#b-del");
  if(del && !canDelete(p)){ const n=document.createElement("span"); n.className="note"; n.style.alignSelf="center"; n.textContent=!user?"Entre para editar.":!canEdit()?"Seu acesso ainda não foi aprovado.":"Só quem marcou ou um administrador pode alterar ou excluir este ponto."; del.replaceWith(n); }
  if(!canEditPoint(p)){ sheet.querySelectorAll(".seg button,.presets button,.lampset button,#b-move,#b-multi,#b-found,#c-nome,.chips button").forEach(b=>b.disabled=true); }
}
function openPointInner(id, refresh, focusName){
  if(movingId) return;
  const p=points.get(id); if(!p) return;
  selectedId=id;
  if(p.status==="custom") return openCustom(id,p,focusName);
  if(p.status==="multi") return openMulti(id,p);
  if(p.status==="missing") return openMissing(id,p);
  const hist=histHTML(p);
  showSheet(`
    <div><h2>Poste · ${STATUS[p.status].label}</h2>
    ${(()=>{const t=refText(nearby(p.lat,p.lng)); return t?`<div class="place">${esc(t)}</div>`:"";})()}
    <div class="meta">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)} · atualizado ${fmt(p.updatedAt)}</div></div>
    <div class="seg" role="group" aria-label="Condição">
      ${ORDER.map(s=>`<button data-s="${s}" style="--c:${STATUS[s].color}" aria-pressed="${p.status===s}">${lampSVG(s,"")}<span>${STATUS[s].short}</span></button>`).join("")}
    </div>
    <button class="btn" id="b-multi">Este poste tem mais de uma lâmpada</button>
    <div class="row">
      <button class="btn" id="b-move">Ajustar posição</button>
      <button class="btn danger" id="b-del">Excluir</button>
    </div>
    <div class="row"><button class="btn primary" id="b-close">Pronto</button></div>
    ${hist?`<div class="hist">Histórico<ol>${hist}</ol></div>`:""}
  `,"point");
  scrim.hidden=false;
  sheet.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>setStatus(id,b.dataset.s)));
  sheet.querySelector("#b-multi").addEventListener("click",()=>setLamps(id,[p.status,p.status]));
  sheet.querySelector("#b-close").addEventListener("click",closeSheet);
  sheet.querySelector("#b-move").addEventListener("click",()=>startMove(id));
  const del=sheet.querySelector("#b-del");
  del.addEventListener("click",()=>{
    if(del.classList.contains("armed")){ removePoint(id); closeSheet(); toast("Marcação excluída"); }
    else { del.classList.add("armed"); del.textContent="Toque de novo para excluir"; setTimeout(()=>{ if(del.isConnected){ del.classList.remove("armed"); del.textContent="Excluir"; } },3500); }
  });
}
function histHTML(p){
  return (p.history||[]).slice().reverse().map(h=>{
    if(h.s==="multi"&&h.l) return `<li>${h.l.map(x=>`<span class="dot" style="background:${STATUS[x].color}"></span>`).join("")}${fmt(h.t)} · ${esc(describeLamps(h.l))}</li>`;
    return `<li><span class="dot" style="background:${STATUS[h.s]?.color||'#888'}"></span>${fmt(h.t)} · ${esc(STATUS[h.s]?.label||h.s)}</li>`;
  }).join("");
}
const PRESETS=[["ok","out"],["ok","ok","out"],["ok","ok"],["ok","ok","ok"]];
function openMulti(id,p){
  const ls=lampsOf(p).slice();
  const place=refText(nearby(p.lat,p.lng));
  const hist=histHTML(p);
  showSheet(`
    <div><h2>Poste com ${lampWord(ls.length)}</h2>
    ${place?`<div class="place">${esc(place)}</div>`:""}
    <div class="meta">${esc(describeLamps(ls))} · atualizado ${fmt(p.updatedAt)}</div></div>
    <div class="field">Combinações rápidas
      <div class="presets">${PRESETS.map((pr,i)=>`<button type="button" data-i="${i}" aria-pressed="${JSON.stringify(pr)===JSON.stringify(ls)}">${multiSVG(pr,"")}<span>${esc(describeLamps(pr).replace(/^\d+ lâmpadas: /,""))}</span></button>`).join("")}</div>
    </div>
    <div class="field">Toque em cada lâmpada para trocar a condição
      <div class="lampset">${ls.map((st,i)=>`<button type="button" data-k="${i}" style="--c:${STATUS[st].color}" aria-label="Lâmpada ${i+1}: ${STATUS[st].label}">${lampSVG(st,"")}<span>${i+1} · ${STATUS[st].short}</span></button>`).join("")}
        ${ls.length<4?`<button type="button" class="add" id="m-add" aria-label="Adicionar lâmpada">+</button>`:""}
      </div>
    </div>
    <div class="row">
      ${ls.length>2?`<button class="btn" id="m-rem">Remover uma lâmpada</button>`:""}
      <button class="btn" id="b-move">Ajustar posição</button>
      <button class="btn danger" id="b-del">Excluir</button>
    </div>
    <div class="row"><button class="btn primary" id="b-close">Pronto</button></div>
    ${hist?`<div class="hist">Histórico<ol>${hist}</ol></div>`:""}
  `,"point");
  scrim.hidden=false;
  const NEXT={ok:"weak",weak:"out",out:"ok"};
  sheet.querySelectorAll(".presets button").forEach(b=>b.addEventListener("click",()=>setLamps(id,PRESETS[+b.dataset.i])));
  sheet.querySelectorAll(".lampset button[data-k]").forEach(b=>b.addEventListener("click",()=>{ const k=+b.dataset.k; const nl=ls.slice(); nl[k]=NEXT[nl[k]]; setLamps(id,nl); }));
  sheet.querySelector("#m-add")?.addEventListener("click",()=>setLamps(id,ls.concat(["ok"])));
  sheet.querySelector("#m-rem")?.addEventListener("click",()=>setLamps(id,ls.slice(0,-1)));
  sheet.querySelector("#b-close").addEventListener("click",closeSheet);
  sheet.querySelector("#b-move").addEventListener("click",()=>startMove(id));
  const del=sheet.querySelector("#b-del");
  del.addEventListener("click",()=>{
    if(del.classList.contains("armed")){ removePoint(id); closeSheet(); toast("Marcação excluída"); }
    else { del.classList.add("armed"); del.textContent="Toque de novo para excluir"; setTimeout(()=>{ if(del.isConnected){ del.classList.remove("armed"); del.textContent="Excluir"; } },3500); }
  });
}
function openMissing(id,p){
  const place=refText(nearby(p.lat,p.lng));
  showSheet(`
    <div><h2>Deveria ter poste</h2>
    ${place?`<div class="place">${esc(place)}</div>`:""}
    <div class="meta">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)} · marcado ${fmt(p.createdAt)}</div></div>
    <p class="note">Trecho de circulação sem iluminação onde um poste é necessário.</p>
    <button class="btn" id="b-found">Na verdade tem poste aqui</button>
    <div class="row">
      <button class="btn" id="b-move">Ajustar posição</button>
      <button class="btn danger" id="b-del">Excluir</button>
    </div>
    <div class="row"><button class="btn primary" id="b-close">Pronto</button></div>
  `,"point");
  scrim.hidden=false;
  sheet.querySelector("#b-found").addEventListener("click",()=>{ const q=points.get(id); const now=Date.now(); savePoint(id,{...q,status:"ok",updatedAt:now,history:(q.history||[]).concat([{s:"ok",t:now}])}); });
  sheet.querySelector("#b-close").addEventListener("click",closeSheet);
  sheet.querySelector("#b-move").addEventListener("click",()=>startMove(id));
  const del=sheet.querySelector("#b-del");
  del.addEventListener("click",()=>{
    if(del.classList.contains("armed")){ removePoint(id); closeSheet(); toast("Marcação excluída"); }
    else { del.classList.add("armed"); del.textContent="Toque de novo para excluir"; setTimeout(()=>{ if(del.isConnected){ del.classList.remove("armed"); del.textContent="Excluir"; } },3500); }
  });
}
function openCustom(id,p,focusName){
  const used=[...new Set([...points.values()].filter(q=>q.status==="custom"&&q.nome).map(q=>q.nome))].slice(0,8);
  const place=refText(nearby(p.lat,p.lng));
  showSheet(`
    <div><h2>${esc(p.nome||"Outro marcador")}</h2>
    ${place?`<div class="place">${esc(place)}</div>`:""}
    <div class="meta">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)} · atualizado ${fmt(p.updatedAt)}</div></div>
    <label class="field" for="c-nome">Nome do marcador
      <input id="c-nome" type="text" maxlength="80" autocomplete="off" enterkeyhint="done" placeholder="Ex.: ponto de apoio, câmera, trecho escuro" value="${esc(p.nome||"")}">
    </label>
    ${used.length?`<div class="chips" aria-label="Nomes já usados">${used.map(u=>`<button type="button" data-n="${esc(u)}">${esc(u)}</button>`).join("")}</div>`:""}
    <div class="row">
      <button class="btn" id="b-move">Ajustar posição</button>
      <button class="btn danger" id="b-del">Excluir</button>
    </div>
    <div class="row"><button class="btn primary" id="b-close">Salvar</button></div>
  `,"point");
  scrim.hidden=false;
  const inp=sheet.querySelector("#c-nome");
  const commitName=()=>setName(id,inp.value);
  inp.addEventListener("change",commitName);
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); commitName(); closeSheet(); toast("Marcador salvo"); }});
  sheet.querySelectorAll(".chips button").forEach(b=>b.addEventListener("click",()=>{ inp.value=b.dataset.n; commitName(); }));
  sheet.querySelector("#b-close").addEventListener("click",()=>{ commitName(); closeSheet(); toast("Marcador salvo"); });
  sheet.querySelector("#b-move").addEventListener("click",()=>{ commitName(); startMove(id); });
  const del=sheet.querySelector("#b-del");
  del.addEventListener("click",()=>{
    if(del.classList.contains("armed")){ removePoint(id); closeSheet(); toast("Marcação excluída"); }
    else { del.classList.add("armed"); del.textContent="Toque de novo para excluir"; setTimeout(()=>{ if(del.isConnected){ del.classList.remove("armed"); del.textContent="Excluir"; } },3500); }
  });
  if(focusName) setTimeout(()=>inp.focus(),60);
}
function startMove(id){
  closeSheet(); movingId=id; arm(null); render();
  hint.innerHTML=`Arraste o marcador até a posição certa · <button class="btn" id="b-done" style="padding:4px 10px;margin-left:6px">Concluir</button>`;
  document.getElementById("b-done").addEventListener("click",()=>{ movingId=null; hint.innerHTML=defaultHint; render(); });
}

// ---------- summary ----------
document.getElementById("open-sum").addEventListener("click",()=>openSummary());
function openSummary(refresh){
  const everything=[...points.entries()];
  const all=everything.filter(([,p])=>!EXTRA.has(p.status));
  const missing=everything.filter(([,p])=>p.status==="missing");
  const others=everything.filter(([,p])=>p.status==="custom").sort((a,b)=>(a[1].nome||"").localeCompare(b[1].nome||"","pt-BR"));
  const n={ok:0,weak:0,out:0}; all.forEach(([,p])=>lampsOf(p).forEach(x=>n[x]++));
  const tot=all.length||0; const nl=n.ok+n.weak+n.out; const pct=s=> nl? Math.round(n[s]*1000/nl)/10 : 0;
  const nMulti=all.filter(([,p])=>p.status==="multi").length;
  const polesHit=all.filter(([,p])=>lampsOf(p).some(x=>x!=="ok")).length;
  const last = all.reduce((m,[,p])=>Math.max(m,p.updatedAt||0),0);
  const first = all.reduce((m,[,p])=>Math.min(m,p.createdAt||Infinity),Infinity);
  const byType=countTypes(); const nAll=everything.length;
  const firstAll=everything.reduce((m,[,p])=>Math.min(m,p.createdAt||Infinity),Infinity);
  const lastAll=everything.reduce((m,[,p])=>Math.max(m,p.updatedAt||0),0);
  const byAuthor={}; everything.forEach(([,q])=>{ const k=q.createdByName||"Sem identificação"; byAuthor[k]=(byAuthor[k]||0)+1; });
  const contrib=Object.entries(byAuthor).sort((x,y)=>y[1]-x[1]);
  const nameCounts={}; others.forEach(([,q])=>{ const k=q.nome||"sem nome"; nameCounts[k]=(nameCounts[k]||0)+1; });
  const TYPE_LABEL={ok:"Postes funcionando",weak:"Postes com luz fraca",out:"Postes queimados",multi:"Postes múltiplos",missing:"Deveria ter poste",custom:"Outros marcadores"};
  showSheet(`
    <div class="sum"><h2>${nAll} marcaç${nAll===1?"ão":"ões"}</h2>
    <div class="meta">${nAll?`de ${fmt(firstAll)} a ${fmt(lastAll)}`:"nenhuma marcação ainda"}</div></div>
    <div class="types">${TOKENS.map(t=>`<div class="type">${lampSVG(t,"")}<div><b>${byType[t]}</b><span>${TYPE_LABEL[t]}</span></div></div>`).join("")}</div>

    <div class="sec">
      <h3>Lâmpadas <em>${nl} em ${tot} poste${tot===1?"":"s"}${nMulti?` · ${nMulti} múltiplo${nMulti>1?"s":""}`:""}</em></h3>
      <div class="bar" aria-hidden="true">${ORDER.map(s=>`<div style="width:${pct(s)}%;background:${STATUS[s].color}"></div>`).join("")}</div>
      <div class="stats">${ORDER.map(s=>`<div class="stat" style="--c:${STATUS[s].color}"><b>${n[s]}</b><span>${STATUS[s].label}</span><small>${pct(s).toLocaleString("pt-BR")}%</small></div>`).join("")}</div>
      <p class="note">${tot? `<b style="color:var(--ink)">${(pct("weak")+pct("out")).toLocaleString("pt-BR",{maximumFractionDigits:1})}%</b> das lâmpadas estão com iluminação comprometida (fraca ou queimada). <b style="color:var(--ink)">${polesHit} de ${tot}</b> poste${tot===1?"":"s"} ${polesHit===1?"tem":"têm"} ao menos uma lâmpada com problema. Postes múltiplos contam cada lâmpada.` : "Nenhum poste marcado ainda."}</p>
    </div>

    <div class="sec">
      <h3>${lampSVG("missing","")}Deveria ter poste <em>${missing.length}</em></h3>
      ${missing.length?`<ul class="others">${missing.map(([,q])=>`<li><span class="dot" style="background:none;border:1.5px dashed #d08cff"></span><span>${esc(refText(nearby(q.lat,q.lng))||(q.lat.toFixed(5)+", "+q.lng.toFixed(5)))}</span></li>`).join("")}</ul>`:`<p class="note">Nenhum trecho sem poste marcado ainda.</p>`}
    </div>

    <div class="sec">
      <h3>${lampSVG("custom","")}Outros marcadores <em>${others.length}</em></h3>
      ${others.length?`<div class="chipcount">${Object.entries(nameCounts).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`<span>${esc(k)} · ${v}</span>`).join("")}</div>
      <ul class="others">${others.map(([,q])=>`<li><span class="dot" style="background:#8fb3ff"></span><span>${esc(q.nome||"sem nome")} <small>${esc(refText(nearby(q.lat,q.lng))||"")}</small></span></li>`).join("")}</ul>`:`<p class="note">Nenhum outro marcador ainda.</p>`}
    </div>
    <div class="sec">
      <h3>Colaboradores <em>${contrib.length}</em></h3>
      ${contrib.length?`<ol class="contrib">${contrib.slice(0,10).map(([name,c])=>`<li><span>${esc(name)}</span><em>${c}</em></li>`).join("")}</ol>`:`<p class="note">Ninguém marcou ainda.</p>`}
    </div>
    <div class="row">
      <button class="btn" id="x-csv">Baixar planilha (CSV)</button>
      <button class="btn" id="x-geo">Baixar mapa (GeoJSON)</button>
    </div>
    ${isAdmin?`<div class="row"><label class="btn" for="x-imp">Importar backup (GeoJSON)</label><input type="file" id="x-imp" accept=".json,.geojson,application/json" hidden></div>`:""}
    <div class="row"><button class="btn primary" id="x-close">Voltar ao mapa</button></div>
    <p class="note">O CSV abre no Excel. O GeoJSON abre no QGIS, Google My Maps ou geojson.io, para montar mapas da apresentação.</p>
  `,"sum");
  scrim.hidden=false;
  sheet.querySelector("#x-close").addEventListener("click",closeSheet);
  sheet.querySelector("#x-csv").addEventListener("click",()=>exportFile("csv"));
  sheet.querySelector("#x-geo").addEventListener("click",()=>exportFile("geojson"));
  sheet.querySelector("#x-imp")?.addEventListener("change",e=>{ const f=e.target.files[0]; if(f) importFile(f); });
}
async function importFile(file){
  let g; try{ g=JSON.parse(await file.text()); }catch(e){ toast("Arquivo inválido: não é um GeoJSON."); return; }
  const feats=(g&&g.features)||[]; let n=0, skipped=0;
  for(const f of feats){
    const pr=f.properties||{}, c=f.geometry&&f.geometry.coordinates;
    const st=pr.condicao; if(!c||!STATUS[st]){ skipped++; continue; }
    const t0=Date.parse(pr.primeiro_registro)||Date.now(), t1=Date.parse(pr.ultima_atualizacao)||t0;
    const id=(pr.id&&/^[\w-]{1,60}$/.test(pr.id))?pr.id:uid();
    const data={lat:+(+c[1]).toFixed(7),lng:+(+c[0]).toFixed(7),status:st,createdAt:t0,updatedAt:t1,history:Array.isArray(pr.historico)?pr.historico.slice(-30):[{s:st,t:t0}]};
    if(st==="multi") data.lamps=Array.isArray(pr.lampadas)&&pr.lampadas.length?pr.lampadas.slice(0,4):DEFAULT_MULTI.slice();
    if(st==="custom") data.nome=String(pr.nome||"").slice(0,80);
    if(points.has(id)) { skipped++; continue; }
    const d=stamp(data,true); if(pr.marcado_por) d.createdByName=String(pr.marcado_por).slice(0,80);
    points.set(id,d); pendingIds.add(id);
    backend.set(id,d).catch(writeError); n++;
  }
  render(); toast(`${n} marcações importadas${skipped?` · ${skipped} ignoradas (repetidas ou inválidas)`:""}`);
}
async function exportFile(kind){
  const rows=[...points.entries()].sort((a,b)=>(a[1].createdAt||0)-(b[1].createdAt||0));
  const stamp=new Date().toISOString().slice(0,10);
  let data, filename;
  if(kind==="csv"){
    const iso=t=>t?new Date(t).toLocaleString("pt-BR"):"";
    const lines=[["id","tipo","nome","latitude","longitude","condicao","n_lampadas","lamp_funcionando","lamp_fracas","lamp_queimadas","via","referencia","distancia_m","primeiro_registro","ultima_atualizacao","n_registros","marcado_por","alterado_por"].join(";")];
    rows.forEach(([id,p])=>lines.push([id,p.status==="custom"?"outro":p.status==="missing"?"deveria_ter":p.status==="multi"?"poste_multiplo":"poste",(p.nome||"").replace(/[;\r\n]+/g," "),String(p.lat).replace(".",","),String(p.lng).replace(".",","),(p.status==="custom"?"":p.status==="missing"?"Deveria ter poste":p.status==="multi"?describeLamps(lampsOf(p)):STATUS[p.status].label),...(ls=>[ls.length||"",ls.filter(x=>x==="ok").length,ls.filter(x=>x==="weak").length,ls.filter(x=>x==="out").length])(lampsOf(p)),...(r=>[r.via||"",r.perto||"",r.perto!=null&&r.dist!=null?r.dist:""])(nearby(p.lat,p.lng)||{}),iso(p.createdAt),iso(p.updatedAt),(p.history||[]).length,(p.createdByName||"").replace(/;/g," "),(p.updatedByName||"").replace(/;/g," ")].join(";")));
    data="﻿"+lines.join("\r\n"); filename=`postes-ufscar-${stamp}.csv`;
  } else {
    data=JSON.stringify({type:"FeatureCollection",features:rows.map(([id,p])=>({type:"Feature",geometry:{type:"Point",coordinates:[p.lng,p.lat]},
      properties:{id,marcado_por:p.createdByName||"",alterado_por:p.updatedByName||"",tipo:p.status==="custom"?"outro":p.status==="missing"?"deveria_ter":p.status==="multi"?"poste_multiplo":"poste",nome:p.nome||"",...(nearby(p.lat,p.lng)||{}),condicao:p.status,condicao_label:p.status==="multi"?describeLamps(lampsOf(p)):STATUS[p.status].label,lampadas:lampsOf(p),cor:STATUS[p.status].color,primeiro_registro:new Date(p.createdAt).toISOString(),ultima_atualizacao:new Date(p.updatedAt).toISOString(),historico:p.history||[]}}))},null,1);
    filename=`postes-ufscar-${stamp}.geojson`;
  }
  const blob=new Blob([data],{type:kind==="csv"?"text/csv;charset=utf-8":"application/geo+json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
  toast("Arquivo gerado");
}

// ---------- conta, ajuda e confirmação ----------
function renderUser(){
  const b=document.getElementById("user-btn");
  if(user){
    b.textContent=(user.name||"?").trim().charAt(0).toUpperCase();
    b.title=user.name+(isAdmin?" (administrador)":canEdit()?"":" (aguardando aprovação)");
    b.classList.add("signed"); b.classList.toggle("admin",isAdmin); b.classList.toggle("waiting",!canEdit());
    const pend=isAdmin?users.filter(u=>u.status==="pendente").length:0;
    if(pend){ const e=document.createElement("em"); e.className="req-badge"; e.textContent=pend; b.appendChild(e); b.title+=` · ${pend} pedido(s) de acesso`; }
  }
  else { b.textContent="Entrar"; b.title="Entrar para marcar"; b.classList.remove("signed","admin","waiting"); }
}
function requireLogin(){
  if(!user){ openLogin(); return false; }
  if(canEdit()) return true;
  openAccessSheet(); return false;
}
function openAccessSheet(){
  arm(null);
  const st=access&&access.status;
  let body;
  if(access===undefined) body=`<p class="note">Verificando seu acesso…</p>`;
  else if(!st) body=`
    <div class="place">Para manter a qualidade do levantamento, cada colaborador é aprovado pelo responsável pelo projeto. Envie seu pedido abaixo.</div>
    <label class="field" for="r-msg">Conte rapidamente seu vínculo com a UFSCar (opcional)
      <input id="r-msg" type="text" maxlength="200" placeholder="Ex.: aluna de Educação Física, servidor do DeFMH">
    </label>
    <button class="btn primary" id="r-send">Pedir acesso</button>`;
  else if(st==="pendente") body=`<div class="place">Seu pedido foi enviado em ${fmt(access.pedidoEm)} e está aguardando aprovação. Assim que for aprovado, você poderá marcar (não precisa recarregar a página).</div>`;
  else if(st==="recusado") body=`<div class="place">Seu pedido não foi aprovado. Se achar que foi um engano, fale com o responsável pelo projeto.</div>`;
  else body=`<div class="place">Seu acesso está liberado.</div>`;
  showSheet(`
    <div><h2>${st==="pendente"?"Aguardando aprovação":st==="recusado"?"Acesso não aprovado":"Pedir acesso para marcar"}</h2><div class="meta">${esc(user.name)} · ${esc(user.email||"")}</div></div>
    ${body}
    <div class="row"><button class="btn" id="r-out">Sair da conta</button><button class="btn" id="r-close">Voltar ao mapa</button></div>
  `,"access");
  scrim.hidden=false;
  sheet.querySelector("#r-close").addEventListener("click",closeSheet);
  sheet.querySelector("#r-out").addEventListener("click",async()=>{ await backend.signOut(); closeSheet(); toast("Você saiu"); });
  sheet.querySelector("#r-send")?.addEventListener("click",async()=>{
    const btn=sheet.querySelector("#r-send"); btn.disabled=true;
    try{ await backend.requestAccess(user, sheet.querySelector("#r-msg").value.trim()); toast("Pedido enviado"); }
    catch(e){ btn.disabled=false; toast("Não foi possível enviar o pedido ("+(e&&e.code||"erro")+")."); }
  });
}
function openRequests(){
  const by=st=>users.filter(u=>u.status===st).sort((a,b)=>(b.pedidoEm||0)-(a.pedidoEm||0));
  const item=(u,btns)=>`<li class="req"><div><b>${esc(u.nome||"Sem nome")}</b><span>${esc(u.email||"")}</span>${u.mensagem?`<span class="msg">“${esc(u.mensagem)}”</span>`:""}<small>pedido em ${fmt(u.pedidoEm)}${u.decididoEm?` · decidido em ${fmt(u.decididoEm)}${u.decididoPor?` por ${esc(u.decididoPor)}`:""}`:""}</small></div><div class="req-btns">${btns(u)}</div></li>`;
  const pend=by("pendente"), ok=by("aprovado"), no=by("recusado");
  showSheet(`
    <div><h2>Pedidos de acesso</h2><div class="meta">${pend.length} pendente${pend.length===1?"":"s"} · ${ok.length} aprovado${ok.length===1?"":"s"} · ${no.length} recusado${no.length===1?"":"s"}</div></div>
    <div class="sec"><h3>Pendentes <em>${pend.length}</em></h3>
      ${pend.length?`<ul class="reqs">${pend.map(u=>item(u,u=>`<button class="btn" data-a="recusado" data-u="${u.uid}">Recusar</button><button class="btn primary" data-a="aprovado" data-u="${u.uid}">Aprovar</button>`)).join("")}</ul>`:`<p class="note">Nenhum pedido aguardando.</p>`}</div>
    <div class="sec"><h3>Aprovados <em>${ok.length}</em></h3>
      ${ok.length?`<ul class="reqs">${ok.map(u=>item(u,u=>`<button class="btn danger" data-a="recusado" data-u="${u.uid}">Remover acesso</button>`)).join("")}</ul>`:`<p class="note">Ninguém aprovado ainda.</p>`}</div>
    ${no.length?`<div class="sec"><h3>Recusados <em>${no.length}</em></h3><ul class="reqs">${no.map(u=>item(u,u=>`<button class="btn" data-a="aprovado" data-u="${u.uid}">Aprovar</button>`)).join("")}</ul></div>`:""}
    <div class="row"><button class="btn primary" id="q-close">Voltar ao mapa</button></div>
  `,"requests");
  scrim.hidden=false;
  sheet.querySelector("#q-close").addEventListener("click",closeSheet);
  sheet.querySelectorAll(".req-btns button").forEach(b=>b.addEventListener("click",async()=>{
    b.disabled=true;
    try{ await backend.setUserStatus(b.dataset.u,b.dataset.a,user); toast(b.dataset.a==="aprovado"?"Acesso aprovado":"Acesso removido"); }
    catch(e){ b.disabled=false; toast("Não foi possível alterar ("+(e&&e.code||"erro")+")."); }
  }));
}
function openLogin(){
  arm(null);
  showSheet(`
    <div><h2>Entre para marcar</h2><div class="place">Qualquer pessoa pode ver o mapa. Para marcar ou alterar pontos, entre com sua conta Google e peça acesso: o responsável pelo projeto aprova cada colaborador.</div></div>
    <button class="btn primary" id="l-google">${GOOGLE_G} Entrar com Google</button>
    <p class="note"><b>Privacidade:</b> guardamos seu nome e o identificador da sua conta junto de cada ponto que você marcar, para mostrar quem contribuiu e permitir revisar as marcações. Seu e-mail não aparece para outros colaboradores. Os dados são usados somente para o levantamento da iluminação do campus.</p>
    <div class="row"><button class="btn" id="l-close">Agora não</button></div>
  `,"login");
  scrim.hidden=false;
  sheet.querySelector("#l-close").addEventListener("click",closeSheet);
  sheet.querySelector("#l-google").addEventListener("click",async()=>{
    try{ afterLogin=true; await backend.signIn(); closeSheet(); }
    catch(e){ afterLogin=false; toast("Não foi possível entrar ("+(e&&e.code||"erro")+")."); }
  });
}
function openAccount(){
  showSheet(`
    <div><h2>${esc(user.name)}</h2><div class="meta">${esc(user.email||"")}${isAdmin?" · administrador":""}</div></div>
    <p class="note">Você marcou <b style="color:var(--ink)">${[...points.values()].filter(p=>p.createdBy===user.uid).length}</b> pontos.${!canEdit()?` Seu acesso para marcar ${access&&access.status==="pendente"?"está aguardando aprovação":"ainda não foi liberado"}.`:""}</p>
    ${isAdmin?`<button class="btn" id="a-req">Pedidos de acesso${users.filter(u=>u.status==="pendente").length?` · <b style="color:var(--accent)">${users.filter(u=>u.status==="pendente").length} pendente(s)</b>`:""}</button>`:""}
    ${!canEdit()?`<button class="btn" id="a-acc">${access&&access.status?"Ver meu pedido":"Pedir acesso para marcar"}</button>`:""}
    <div class="row"><button class="btn" id="a-out">Sair</button><button class="btn primary" id="a-close">Voltar ao mapa</button></div>
  `,"account");
  scrim.hidden=false;
  sheet.querySelector("#a-close").addEventListener("click",closeSheet);
  sheet.querySelector("#a-req")?.addEventListener("click",openRequests);
  sheet.querySelector("#a-acc")?.addEventListener("click",openAccessSheet);
  sheet.querySelector("#a-out").addEventListener("click",async()=>{ await backend.signOut(); closeSheet(); toast("Você saiu"); });
}
document.getElementById("user-btn").addEventListener("click",()=>{ if(!backend) return; user?openAccount():openLogin(); });
document.getElementById("help-btn").addEventListener("click",openHelp);
function openHelp(){
  const row=(st,txt)=>`<li>${lampSVG(st,"")}<div><b>${STATUS[st].label}</b><span>${txt}</span></div></li>`;
  showSheet(`
    <div><h2>Como marcar</h2><div class="place">Use os mesmos critérios que todo mundo, para o levantamento ser comparável.</div></div>
    <ul class="legend">
      ${row("ok","A lâmpada acende e ilumina bem o entorno.")}
      ${row("weak","Acende, mas fraca, piscando, ou ilumina pouco (difícil enxergar o chão).")}
      ${row("out","Apagada à noite ou visivelmente queimada.")}
      ${row("multi","Poste com 2 a 4 lâmpadas. Marque a condição de cada uma.")}
      ${row("missing","Trecho de calçada ou caminho usado à noite, escuro e sem poste, onde deveria haver um.")}
      ${row("custom","Qualquer outra coisa relevante, com nome livre (ponto de apoio, câmera, buraco na calçada...).")}
    </ul>
    <p class="note"><b>Dicas:</b> marque à noite, depois das 19 h. Antes de marcar, veja se o poste já não está no mapa. Se você mesmo marcou, toque nele para atualizar. Se foi outra pessoa e a condição mudou, avise o responsável pelo projeto. O botão ◎ mostra onde você está (use com cuidado: o GPS erra alguns metros).</p>
    <div class="row"><button class="btn primary" id="h-close">Entendi</button></div>
  `,"help");
  scrim.hidden=false;
  sheet.querySelector("#h-close").addEventListener("click",closeSheet);
}
function confirmSheet(msg, yesLabel, onYes, altLabel, onAlt){
  showSheet(`
    <div><h2>Confirme</h2><div class="place">${esc(msg)}</div></div>
    <div class="row"><button class="btn" id="c-alt">${esc(altLabel||"Cancelar")}</button><button class="btn primary" id="c-yes">${esc(yesLabel)}</button></div>
    <div class="row"><button class="btn" id="c-no">Cancelar</button></div>
  `,"confirm");
  scrim.hidden=false;
  sheet.querySelector("#c-yes").addEventListener("click",()=>{ closeSheet(); onYes(); });
  sheet.querySelector("#c-alt").addEventListener("click",()=>{ closeSheet(); (onAlt||(()=>{}))(); });
  sheet.querySelector("#c-no").addEventListener("click",closeSheet);
}
const GOOGLE_G=`<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 7.2-9.6 7.2-16.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.7 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;

// ---------- GPS ----------
let gps=null, gpsDot=null, gpsAcc=null, gpsFirst=true, lastFix=null;
const LocateCtl=L.Control.extend({options:{position:"topright"},onAdd(){
  const a=L.DomUtil.create("a","leaflet-bar locate-btn"); a.href="#"; a.title="Mostrar onde estou"; a.setAttribute("role","button"); a.innerHTML="◎";
  L.DomEvent.on(a,"click",e=>{ L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e); toggleGPS(a); });
  return a; }});
map.addControl(new LocateCtl());
function toggleGPS(btn){
  if(gps!==null){ navigator.geolocation.clearWatch(gps); gps=null; gpsDot?.remove(); gpsAcc?.remove(); gpsDot=gpsAcc=null; lastFix=null; btn.classList.remove("on"); updateHint(); return; }
  if(!navigator.geolocation){ toast("Este navegador não informa a localização."); return; }
  btn.classList.add("on"); gpsFirst=true;
  gps=navigator.geolocation.watchPosition(pos=>{
    const ll=[pos.coords.latitude,pos.coords.longitude], acc=pos.coords.accuracy;
    lastFix={latlng:L.latLng(ll),acc};
    if(!gpsDot){ gpsAcc=L.circle(ll,{radius:acc,color:"#6ea8ff",weight:1,fillOpacity:.12,interactive:false}).addTo(map); gpsDot=L.circleMarker(ll,{radius:7,color:"#fff",weight:2,fillColor:"#3d8bff",fillOpacity:1,interactive:false}).addTo(map); }
    else { gpsDot.setLatLng(ll); gpsAcc.setLatLng(ll).setRadius(acc); }
    if(gpsFirst){ gpsFirst=false; map.setView(ll,Math.max(map.getZoom(),18)); }
    updateHint();
  },err=>{ toast(err.code===1?"Permissão de localização negada.":"Não foi possível obter a localização."); btn.classList.remove("on"); gps!==null&&navigator.geolocation.clearWatch(gps); gps=null; },{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
}
function updateHint(){
  if(!armedStatus||movingId) return;
  const base=`Toque no mapa para marcar <b>${armedStatus==="custom"?"um local (nome livre)":armedStatus==="missing"?"onde deveria ter poste":STATUS[armedStatus].label.toLowerCase()}</b>`;
  hint.innerHTML = base + (lastFix?` · <button class="btn gps-here" id="gps-here" style="padding:4px 10px">Marcar onde estou (±${Math.round(lastFix.acc)} m)</button>`:" · toque de novo no botão para cancelar");
  document.getElementById("gps-here")?.addEventListener("click",()=>{ if(lastFix&&armedStatus) addPoint(lastFix.latlng,armedStatus); });
}

// ---------- toast ----------
var tt=null;
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.hidden=false; clearTimeout(tt); tt=setTimeout(()=>t.hidden=true,2400); }

// keep the screen awake while mapping, if allowed
(async()=>{ try{ if(navigator.wakeLock){ let lock=await navigator.wakeLock.request("screen"); document.addEventListener("visibilitychange",async()=>{ if(document.visibilityState==="visible"){ try{ lock=await navigator.wakeLock.request("screen"); }catch(e){} } }); } }catch(e){} })();


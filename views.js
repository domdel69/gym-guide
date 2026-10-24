/* Guides, suivi, réglages, démarrage. */
function viewGuides(){
  const g=GUIDES.find(x=>x.id===S.guide)||GUIDES[0];
  const seg=GUIDES.map(x=>`<button role="tab" data-act="guide" data-id="${x.id}" aria-selected="${x.id===g.id}">${esc(x.tab)}</button>`).join('');
  const blocks=g.blocks.map(b=>`<div class="card"><h3>${esc(b.h)}</h3>${b.p?`<p class="mute" style="margin-top:6px">${esc(b.p)}</p>`:''}${b.ul?`<ul>${b.ul.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}</div>`).join('');
  return `<h1>${esc(g.title)}</h1><div class="seg" role="tablist">${seg}</div>${blocks}`;
}

function spark(vals){
  if(vals.length<2)return '';
  const mn=Math.min(...vals),mx=Math.max(...vals),r=(mx-mn)||1;
  const pts=vals.map((v,i)=>[4+i*(92/(vals.length-1)),36-((v-mn)/r)*30]);
  const l=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}"/><circle cx="${l[0].toFixed(1)}" cy="${l[1].toFixed(1)}" r="2.4"/></svg>`;
}
function viewProgress(){
  const dates=Object.keys(Store.d.log).sort();
  const items=Object.keys(EX).map(id=>({id,h:Store.history(id)})).filter(x=>x.h.length);
  if(!items.length)return `<h1>Suivi</h1><div class="card"><p>Rien d’enregistré pour l’instant. Coche une série dans une station : les reps et les charges apparaissent ici.</p></div>`;
  const cards=items.map(({id,h})=>{
    const ex=EX[id],top=s=>s.reduce((m,x)=>Math.max(m,x.kg??0),0),topReps=s=>s.reduce((m,x)=>Math.max(m,x.reps??0),0);
    const useKg=ex.kind==='lift'||ex.kind==='assist'||false;
    const series=h.slice().reverse().slice(-12).map(x=>useKg?top(x.sets):topReps(x.sets));
    const l=h[0];
    const best=useKg?Math.max(...h.map(x=>top(x.sets))):Math.max(...h.map(x=>topReps(x.sets)));
    return `<div class="card"><h3>${esc(ex.en)}</h3><div class="mute small">${esc(ex.fr)}</div>
      <p style="margin:8px 0 2px">Dernière fois (${fmtDate(l.date)}) : ${l.sets.map(s=>(s.reps!=null?s.reps:'')+(s.kg?'×'+s.kg+' kg':'')).join(' · ')}</p>
      <div class="small mute">${useKg?'Meilleure charge':'Meilleur nombre de reps'} : <b style="color:var(--ink)">${best}${useKg?' kg':''}</b> · ${h.length} séance${h.length>1?'s':''}</div>${spark(series)}</div>`}).join('');
  return `<h1>Suivi</h1><p class="mute">${dates.length} jour${dates.length>1?'s':''} d’entraînement enregistré${dates.length>1?'s':''}. Courbe : meilleure charge par séance (ou reps pour les exercices au poids du corps).</p>${cards}`;
}

function viewSettings(){
  const s=Store.d.settings;
  const vids=Object.keys(EX).map(id=>{const v=Store.videoId(id),custom=!!s.videos[id];
    return `<div class="cfg"><div class="l"><span>${esc(EX[id].en)}</span><span class="mute small">${custom?'modifiée':'par défaut'}</span></div>
      <input type="text" id="v-${id}" data-vid="${id}" value="https://youtu.be/${esc(v)}" inputmode="url" autocapitalize="off" autocomplete="off" aria-label="Vidéo ${esc(EX[id].en)}"></div>`}).join('');
  return `<h1>Réglages</h1>
   <div class="card"><h3>Séance</h3>
    <label class="switch"><span>Garder l’écran allumé en station</span><input type="checkbox" data-opt="awake" ${s.awake?'checked':''}></label>
    <label class="switch"><span>Son à la fin du repos</span><input type="checkbox" data-opt="sound" ${s.sound?'checked':''}></label></div>
   <div class="card"><h3>Sauvegarde</h3>
    <p class="mute small">Tes séries sont enregistrées sur ce téléphone seulement. Exporte un fichier de temps en temps.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="export">Exporter</button><button class="btn" data-act="copy">Copier</button><label class="btn" for="imp">Importer</label><input id="imp" type="file" accept="application/json,.json" hidden></div></div>
   <div class="card"><h3>Vidéos</h3><p class="mute small">Colle un lien YouTube ou un identifiant. Vide : retour à la vidéo par défaut. Si une vidéo refuse la lecture intégrée, remplace-la ici.</p>${vids}</div>
   <div class="card"><h3>Application</h3><p class="mute small">Version ${window.APP_VERSION||'1'}</p><button class="btn" data-act="update">Chercher une mise à jour</button></div>`;
}

async function exportBackup(){
  const text=Store.exportJson(),name='gym-guide-'+Store.today()+'.json';
  try{const f=new File([text],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
window.onViewAct=async(a)=>{
  if(a==='export')exportBackup();
  else if(a==='copy'){try{await navigator.clipboard.writeText(Store.exportJson());toast('Copié')}catch(e){toast('Copie impossible : utilise Exporter')}}
  else if(a==='update'){try{const r=await navigator.serviceWorker.getRegistration();if(r){await r.update();toast('Vérifié. Ferme et rouvre l’app si une version est prête.')}else toast('Pas de mode hors ligne ici')}catch(e){toast('Vérification impossible')}}
};
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.vid){const id=t.dataset.vid,raw=t.value.trim();
    if(!raw){delete Store.d.settings.videos[id];Store.save();toast('Vidéo par défaut rétablie');render();return}
    const p=Store.parseYt(raw);if(!p){toast('Lien YouTube invalide');render();return}
    if(p===EX[id].yt)delete Store.d.settings.videos[id];else Store.d.settings.videos[id]=p;Store.save();toast('Vidéo enregistrée');render()}
  else if(t.dataset.opt){Store.d.settings[t.dataset.opt]=t.checked;Store.save()}
  else if(t.id==='imp'&&t.files[0]){const r=new FileReader();r.onload=()=>{try{Store.importJson(r.result);toast('Sauvegarde importée');render()}catch(x){toast('Fichier non reconnu')}};r.readAsText(t.files[0])}
});

render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

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

/* ---------- Suivi ---------- */
const nf=v=>String(Number(Number(v).toFixed(1))).replace('.',',');
const noKg=k=>k==='reps'||k==='time';
const setTxt=(s,kind)=>(s.reps!=null?s.reps:'–')+(kind==='time'?' s':'')+(noKg(kind)||s.kg==null||s.kg===''?'':' × '+nf(s.kg)+' kg');
const kgOf=(sets,kind)=>{const k=sets.map(x=>x.kg).filter(v=>v!=null&&v!=='');return k.length?(kind==='assist'?Math.min(...k):Math.max(...k)):null};
const repsOf=sets=>{const r=sets.map(x=>x.reps).filter(v=>v!=null);return r.length?Math.max(...r):null};

/* Courbe SVG : dates proportionnelles au temps, valeurs annotées. */
function chart(pts,{title,unit,note}){
  const W=320,H=170,L=38,R=14,T=20,B=28;
  if(!pts.length)return '';
  const head=`<div class="chart-h"><h3>${esc(title)}</h3>${note?`<span class="mute small">${esc(note)}</span>`:''}</div>`;
  const vals=pts.map(p=>p.v);let mn=Math.min(...vals),mx=Math.max(...vals);
  if(mn===mx){mn-=1;mx+=1}else{const pad=(mx-mn)*.12;mn-=pad;mx+=pad}
  const raw=(mx-mn)/3,pw=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pw,step=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*pw;
  mn=Math.floor(mn/step+1e-9)*step;mx=Math.ceil(mx/step-1e-9)*step;
  const ticks=[];for(let v=mn;v<=mx+1e-9;v+=step)ticks.push(v);
  const t=pts.map(p=>Date.parse(p.date)),t0=t[0],t1=t[t.length-1];
  const X=i=>t1>t0?L+(t[i]-t0)/(t1-t0)*(W-L-R):L+(W-L-R)/2;
  const Y=v=>T+(1-(v-mn)/(mx-mn))*(H-T-B);
  const grid=ticks.map(v=>`<line class="grid" x1="${L}" x2="${W-R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="${L-5}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end">${nf(v)}</text>`).join('');
  const line=pts.length>1?`<polyline class="line" points="${pts.map((p,i)=>X(i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ')}"/>`:'';
  const maxI=vals.indexOf(Math.max(...vals));
  const show=i=>pts.length<=8||i===0||i===pts.length-1||i===maxI;
  const dots=pts.map((p,i)=>`<circle class="${i===pts.length-1?'cur':''}" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.6"/>`+
    (show(i)?`<text class="val" x="${Math.min(W-R-6,Math.max(L+6,X(i))).toFixed(1)}" y="${(Y(p.v)-8).toFixed(1)}" text-anchor="middle">${nf(p.v)}</text>`:'')).join('');
  const dd=d=>d.slice(8)+'.'+d.slice(5,7);
  const xl=`<text x="${X(0).toFixed(1)}" y="${H-8}" text-anchor="${pts.length>1?'start':'middle'}">${dd(pts[0].date)}</text>`+(pts.length>1?`<text x="${X(pts.length-1).toFixed(1)}" y="${H-8}" text-anchor="end">${dd(pts[pts.length-1].date)}</text>`:'');
  const label=`${title} : `+pts.map(p=>fmtDate(p.date)+' '+nf(p.v)+(unit||'')).join(', ');
  return `<div class="card chart">${head}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${grid}${line}${dots}${xl}</svg>${pts.length<2?'<p class="mute small">Une seule séance pour l’instant : la courbe se dessine dès la deuxième.</p>':''}</div>`;
}

function viewExercise(id){
  const inf=Store.info(id),h=Store.history(id);
  const back=`<div class="top"><button class="btn sm" data-act="pback">‹ Suivi</button></div>`;
  if(!h.length)return back+`<h1>${esc(inf.en)}</h1><div class="card"><p>Aucune série enregistrée.</p></div>`;
  const asc=h.slice().reverse(),kind=inf.kind;
  const kgPts=noKg(kind)?[]:asc.map(x=>({date:x.date,v:kgOf(x.sets,kind)})).filter(p=>p.v!=null);
  const repPts=asc.map(x=>({date:x.date,v:repsOf(x.sets)})).filter(p=>p.v!=null);
  const best=kgPts.length?(kind==='assist'?Math.min(...kgPts.map(p=>p.v)):Math.max(...kgPts.map(p=>p.v))):null;
  const rows=h.map(x=>`<li><b>${fmtDay(x.date)}</b> <span class="mute small">${x.sids.map(sid=>esc(Store.sessTitle(x.date,sid).split(' : ')[0])).join(', ')}</span><div>${x.sets.map(s=>esc(setTxt(s,kind))).join(' · ')}${kind==='assist'?' <span class="mute small">(assistance)</span>':''}</div></li>`).join('');
  return back+`<h1>${esc(inf.en)}</h1><div class="mute">${esc(inf.fr)}${inf.live?'':' · ancien exercice'}</div>
   <p class="small mute" style="margin-top:8px">${h.length} séance${h.length>1?'s':''}${best!=null?` · ${kind==='assist'?'assistance la plus basse':'meilleure charge'} : <b style="color:var(--ink)">${nf(best)} kg</b>`:''}</p>
   ${kgPts.length?chart(kgPts,{title:kind==='assist'?'Assistance (kg)':'Charge (kg)',unit:' kg',note:kind==='assist'?'Plus bas = mieux. Valeur la plus basse de chaque séance.':'Charge la plus haute de chaque séance.'}):''}
   ${chart(repPts,{title:kind==='time'?'Durée (s)':'Répétitions',unit:kind==='time'?' s':' reps',note:kind==='time'?'Durée la plus longue de chaque séance.':'Meilleure série de chaque séance.'})}
   <div class="card"><h3>Historique</h3><ul class="plain">${rows}</ul></div>`;
}

function viewProgress(){
  const P=S.prog;
  if(P.ex)return viewExercise(P.ex);
  const ss=Store.sessions();
  if(!ss.length)return `<h1>Suivi</h1><div class="card"><p>Rien d’enregistré pour l’instant. Coche une série dans une station : les séances, les reps et les charges apparaissent ici. L’échauffement et les exercices sans reps ni charge ne sont pas suivis.</p></div>`;
  const seg=`<div class="seg" role="tablist"><button role="tab" data-act="pmode" data-m="sessions" aria-selected="${P.mode==='sessions'}">Séances</button><button role="tab" data-act="pmode" data-m="exercises" aria-selected="${P.mode==='exercises'}">Exercices</button></div>`;
  if(P.mode==='sessions'){
    const list=ss.map(x=>{const key='ps-'+x.date+'-'+x.sid,n=x.exs.reduce((m,e)=>m+e.sets.length,0);
      const lines=x.exs.map(e=>{const inf=Store.info(e.ex);return `<li><button class="lnk" data-act="exdetail" data-ex="${esc(e.ex)}">${esc(inf.en)} ›</button><div>${e.sets.map(s=>esc(setTxt(s,inf.kind))).join(' · ')}${inf.kind==='assist'?' <span class="mute small">(assistance)</span>':''}</div></li>`}).join('');
      return `<details class="card fold" data-k="${esc(key)}"${S.open[key]?' open':''}><summary><span class="sm"><b>${fmtDay(x.date)}</b><span class="mute">${esc(x.title)}</span></span><span class="sr small">${x.exs.length} exercice${x.exs.length>1?'s':''} · ${n} série${n>1?'s':''}</span></summary><ul class="plain">${lines}</ul></details>`}).join('');
    return `<h1>Suivi</h1>${seg}<p class="mute small">${ss.length} séance${ss.length>1?'s':''} enregistrée${ss.length>1?'s':''}. Touche une séance pour voir le détail, un exercice pour voir sa courbe.</p>${list}`;
  }
  const {live,old}=Store.trackedIds();
  const card=id=>{const inf=Store.info(id),h=Store.history(id),l=h[0],kind=inf.kind;
    const ser=h.slice().reverse().slice(-12).map(x=>noKg(kind)?repsOf(x.sets):kgOf(x.sets,kind)).filter(v=>v!=null);
    return `<button class="home-card ex" data-act="exdetail" data-ex="${esc(id)}"><span class="hc-t"><b>${esc(inf.en)}</b><span>${esc(inf.fr)}</span><span class="small">${fmtDate(l.date)} : ${l.sets.map(s=>esc(setTxt(s,kind))).join(' · ')}</span></span><span class="chev" aria-hidden="true">›</span></button>`};
  return `<h1>Suivi</h1>${seg}<p class="mute small">Touche un exercice pour voir l’évolution des reps et de la charge.</p>
   <div class="list">${live.map(card).join('')}</div>${old.length?`<h2>Anciens exercices</h2><div class="list">${old.map(card).join('')}</div>`:''}`;
}

/* ---------- Réglages ---------- */
function fold(key,title,body){return `<details class="card fold" data-k="${key}"${S.open[key]?' open':''}><summary><h3>${title}</h3></summary><div class="fold-b">${body}</div></details>`}
function viewSettings(){
  const s=Store.d.settings,ud=Store.undoInfo();
  const vids=Object.keys(EX).map(id=>{const v=Store.videoId(id),custom=!!s.videos[id];
    return `<div class="cfg"><div class="l"><span>${esc(EX[id].en)}</span><span class="mute small">${custom?'modifiée':(EX[id].yt?'par défaut':'aucune')}</span></div>
      <input type="text" id="v-${id}" data-vid="${id}" value="${v?'https://youtu.be/'+esc(v):''}" placeholder="Lien YouTube" inputmode="url" autocapitalize="off" autocomplete="off" aria-label="Vidéo ${esc(EX[id].en)}"></div>`}).join('');
  const prev=(window.RELEASES||[]).filter(v=>v!==window.APP_VERSION);
  const inArchive=location.pathname.includes('/releases/');
  return `<h1>Réglages</h1>
   <div class="card"><h3>Séance</h3>
    <label class="switch"><span>Garder l’écran allumé en station</span><input type="checkbox" data-opt="awake" ${s.awake?'checked':''}></label>
    <label class="switch"><span>Son à la fin du repos</span><input type="checkbox" data-opt="sound" ${s.sound?'checked':''}></label></div>
   <div class="card"><h3>Application</h3><p class="mute small">Version ${window.APP_VERSION||'?'}. Tes séries enregistrées ne sont pas touchées.</p><button class="btn" data-act="update">Forcer la mise à jour</button>
    ${prev.length&&!inArchive?`<details class="sub" data-k="versions"${S.open.versions?' open':''}><summary>Versions précédentes</summary><p class="mute small">Si la dernière version pose problème, ouvre une version précédente. Le journal est partagé : tes séries restent visibles.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${prev.map(v=>`<a class="btn sm" href="releases/${esc(v)}/">Version ${esc(v)}</a>`).join('')}</div></details>`:''}</div>
   ${fold('program','Programme',progBody())}
   ${fold('backup','Sauvegarde',`<p class="mute small">Tes séries sont enregistrées sur ce téléphone seulement. Exporte un fichier de temps en temps.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="export">Exporter</button><button class="btn" data-act="copy">Copier</button><label class="btn" for="imp">Importer</label><input id="imp" type="file" accept="application/json,.json" hidden></div>
    <p class="mute small" style="margin-top:14px">Effacer supprime toutes les séries enregistrées sur ce téléphone. Les liens vidéo et les options sont conservés. Exporte d’abord si tu veux garder une copie.</p>
    <button class="btn" data-act="clearlog">Effacer le journal</button>
    ${ud?`<p class="mute small" style="margin-top:14px">Dernier état conservé : ${esc(ud.why)}, le ${esc(fmtDate(ud.at.slice(0,10)))}.</p><button class="btn" data-act="undo">Annuler (restaurer cet état)</button>`:''}`)}
   ${fold('print','À imprimer',`<p class="mute small">Une feuille A4 par séance, avec cases pour noter reps et charges. Pour les jours où le téléphone est à plat.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="${PB}seance-a.pdf" target="_blank" rel="noopener">Séance A</a><a class="btn" href="${PB}seance-b.pdf" target="_blank" rel="noopener">Séance B</a><a class="btn" href="${PB}seance-c.pdf" target="_blank" rel="noopener">Séance C</a><a class="btn" href="${PB}routine-maison.pdf" target="_blank" rel="noopener">Maison</a></div>`)}
   ${fold('videos','Vidéos',`<p class="mute small">Colle un lien YouTube ou un identifiant. Vide : retour à la vidéo par défaut. Si une vidéo refuse la lecture intégrée, remplace-la ici.</p>${vids}`)}`;
}

function progBody(){
  const st=Store.d.settings.start,x=weekOf(Store.today()),n=nextCheck(),cs=checksList();
  const state=!st?'Pas de date de départ.':x.before?`Départ dans ${x.before} jour${x.before>1?'s':''}.`:x.done?'Les 12 semaines sont passées.':`Aujourd’hui : semaine ${x.w} / 12.`;
  const hist=cs.length?`<ul class="plain">${cs.slice().reverse().map(c=>`<li><b>${fmtDay(c.date)}</b>${c.waist!=null?' : '+esc(nf(c.waist))+' cm':''} <button class="lnk" data-act="checkdel" data-d="${esc(c.date)}" aria-label="Supprimer la mesure du ${fmtDate(c.date)}">Supprimer</button></li>`).join('')}</ul>`:'<p class="mute small">Aucune mesure notée.</p>';
  return `<p class="mute small">Date de la première séance : elle fixe la semaine 1 du programme de 12 semaines (deux blocs de 6 semaines, semaines 6 et 12 allégées).</p>
   <input type="date" class="datein" data-start value="${st?esc(st):''}" aria-label="Date de la première séance">
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-act="startnow">Aujourd’hui</button><button class="btn" data-act="startclear">Effacer la date</button></div>
   <p class="small" style="margin-top:8px">${state}${st?` Semaine 1 : ${fmtDate(st)}. Fin du programme : ${fmtDate(addDays(st,83))}.`:''}</p>
   <h3 style="margin-top:16px">Mesures et photos</h3>
   <p class="mute small">Tour de taille et photos (face, profil, dos) toutes les 6 semaines.${n?` Prochaines : ${fmtDate(n.due)}.`:''} Les chiffres restent sur ce téléphone.</p>
   <div class="inline"><input id="waist" inputmode="decimal" placeholder="Tour de taille (cm), optionnel" aria-label="Tour de taille en centimètres"><button class="btn" data-act="checkdone">Mesure faite aujourd’hui</button></div>${hist}`;
}
async function exportBackup(){
  const text=Store.exportJson(),name='gym-guide-'+Store.today()+'.json';
  try{const f=new File([text],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
window.onViewAct=async(a,b)=>{
  if(a==='pmode'){S.prog.mode=b.dataset.m;S.prog.ex=null;render()}
  else if(a==='exdetail'){S.tab='progress';S.prog.ex=b.dataset.ex;persist();scrollTo(0,0);render()}
  else if(a==='pback'){S.prog.ex=null;scrollTo(0,0);render()}
  else if(a==='undo'){if(confirm('Restaurer l’état conservé ? L’état actuel sera conservé à sa place.')){try{Store.undo();toast('État restauré');render()}catch(e){toast('Rien à restaurer')}}}
  else if(a==='startnow'){Store.d.settings.start=Store.today();Store.save();toast('Départ : aujourd’hui');render()}
  else if(a==='startclear'){Store.d.settings.start=null;Store.save();toast('Date effacée');render()}
  else if(a==='checkdone'){const el=$('#waist'),v=el&&el.value.trim()?num(el.value):null,td=Store.today();
    Store.d.checks=(Store.d.checks||[]).filter(c=>c.date!==td);Store.d.checks.push(v!=null?{date:td,waist:v}:{date:td});Store.save();toast('Mesure notée');render()}
  else if(a==='checkdel'){Store.d.checks=(Store.d.checks||[]).filter(c=>c.date!==b.dataset.d);Store.save();render()}
  else if(a==='export')exportBackup();
  else if(a==='copy'){try{await navigator.clipboard.writeText(Store.exportJson());toast('Copié')}catch(e){toast('Copie impossible : utilise Exporter')}}
  else if(a==='clearlog'){const n=Store.dates().length;if(confirm('Effacer le journal ('+n+' jour'+(n>1?'s':'')+' enregistré'+(n>1?'s':'')+') ? Cette action est définitive.')){Store.clearLog();toast('Journal effacé');render()}}
  else if(a==='update'){try{toast('Mise à jour en cours…');const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()));setTimeout(()=>location.reload(),600)}catch(e){location.reload()}}
};
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.act==='inp'){const m=/^([rw])(\d+)$/.exec(t.id);
    if(m&&S.sess&&S.st!==null){const sess=sessOf(S.sess),it=E(sess,sess.stations[S.st][S.exi]),k=+m[2];
      Store.setSet(curDate(),sess.id,it.ex,k,m[1]==='r'?{reps:num(t.value)}:{kg:num(t.value)})}
    return}
  if(t.dataset.vid){const id=t.dataset.vid,raw=t.value.trim();
    if(!raw){delete Store.d.settings.videos[id];Store.save();toast('Vidéo par défaut rétablie');render();return}
    const p=Store.parseYt(raw);if(!p){toast('Lien YouTube invalide');render();return}
    if(p===EX[id].yt)delete Store.d.settings.videos[id];else Store.d.settings.videos[id]=p;Store.save();toast('Vidéo enregistrée');render()}
  else if(t.dataset.start!==undefined){Store.d.settings.start=t.value||null;Store.save();toast(t.value?'Date de départ enregistrée':'Date effacée');render()}
  else if(t.dataset.opt){Store.d.settings[t.dataset.opt]=t.checked;Store.save()}
  else if(t.id==='imp'&&t.files[0]){const r=new FileReader();r.onload=()=>{try{Store.importJson(r.result);toast('Sauvegarde importée');render()}catch(x){toast('Fichier non reconnu')}};r.readAsText(t.files[0])}
});

render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  const had=!!navigator.serviceWorker.controller;let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had||reloaded)return;if(S.st!==null||T){toast('Mise à jour prête : ferme et rouvre l’app après ta séance');return}reloaded=true;location.reload()});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{r.update().catch(()=>{});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update().catch(()=>{})})}).catch(()=>{});
}

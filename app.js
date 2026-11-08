/* Gym Guide : état, séances, minuteur de repos. */
const $=s=>document.querySelector(s);
const ui=(Store.d.ui=Store.d.ui||{tab:'train'});
const S={tab:ui.tab||'train',sess:null,date:null,st:null,exi:0,guide:(window.GUIDES[0]||{}).id,vid:false,prog:{mode:'sessions',ex:null},open:{}};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate=d=>{const[y,m,j]=d.split('-');return j+'.'+m+'.'+y};
const DAYS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
const fmtDay=d=>{const[y,m,j]=d.split('-');return DAYS[new Date(+y,m-1,+j).getDay()]+' '+j+'.'+m+'.'+y};
const PB=location.pathname.includes('/releases/')?'../../print/':'print/';
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null};
const persist=()=>{const u=(Store.d.ui=Store.d.ui||{});u.tab=S.tab;delete u.sess;Store.save()};
const sessOf=id=>SESSIONS.find(s=>s.id===id)||SESSIONS[0];
const toTop=()=>{const a=document.getElementById('app');if(a)a.scrollTop=0};
const toast=(m)=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)};

/* Zone visible (iOS laisse parfois la page décalée après le clavier ou un défilement) : le corps suit la zone visible, la barre d’onglets se masque pendant la saisie. */
(()=>{const vv=window.visualViewport,r=document.documentElement.style;
  const fit=()=>{if(!vv)return;const kb=window.innerHeight-vv.height>120&&vv.scale<=1.01;
    if(kb){r.setProperty('--vvt',Math.round(vv.offsetTop)+'px');r.setProperty('--vvb',Math.round(window.innerHeight-vv.offsetTop-vv.height)+'px')}
    else{r.removeProperty('--vvt');r.removeProperty('--vvb')}};
  if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}fit();
  const typing=t=>!!t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  document.addEventListener('focusin',e=>{if(typing(e.target))document.body.classList.add('kb')});
  document.addEventListener('focusout',e=>{if(typing(e.target))setTimeout(()=>{if(!typing(document.activeElement)){document.body.classList.remove('kb');window.scrollTo(0,0);fit()}},150)});
  window.addEventListener('pageshow',fit);window.addEventListener('orientationchange',()=>setTimeout(fit,300));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){window.scrollTo(0,0);fit()}});
})();

const ICONS={
 train:'<path d="M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5"/>',
 guides:'<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 8h6M9 12h6"/>',
 progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'};
const TABS=[['train','Accueil'],['progress','Suivi'],['guides','Guides'],['settings','Réglages']];

/* ---------- séances ---------- */
const curDate=()=>S.date||Store.today();
/* Exercice effectif d’une station : l’exercice prévu, ou la variante choisie pour cette date (it.alt). */
const E=(sess,it,date=curDate())=>{if(!it.alt)return it;const id=Store.pickGet(date,sess.id,it.ex),a=id&&it.alt.find(x=>x.ex===id);
  return a&&EX[id]?Object.assign({},it,a,{alt:it.alt,base:it.ex}):it};
const stationDone=(sess,i,date=curDate())=>sess.stations[i].every(it=>setsDone(sess,it,date)>=E(sess,it,date).sets);
function setsDone(sess,it,date){return Store.get(date,sess.id,E(sess,it,date).ex).filter(s=>s&&s.done).length}
const fmtMS=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const first=r=>(String(r).match(/\d+/)||[''])[0];

/* ---------- programme : semaine, semaine allégée, mesures ---------- */
const D0=d=>{const[y,m,j]=d.split('-').map(Number);return Math.round(Date.UTC(y,m-1,j)/864e5)};
const addDays=(d,n)=>{const t=new Date((D0(d)+n)*864e5);return t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+String(t.getUTCDate()).padStart(2,'0')};
const DELOAD_TXT='Mêmes exercices et mêmes charges, 2 séries au lieu de 3–4, sans élévations latérales, sans bras en option, sans finisseur.';
const PHASE=w=>w===1?{blk:1,name:'Calibrage',note:'3–4 répétitions en réserve. Note tes charges de départ.'}
  :w===6?{blk:1,name:'Semaine allégée',dl:true,note:'Bilan du bloc 1 : exporte ton journal (Réglages > Sauvegarde) et envoie-le à Claude pour écrire le bloc 2.'}
  :w===12?{blk:2,name:'Semaine allégée',dl:true,note:'Dernière semaine du programme : bilan complet avec Claude ensuite.'}
  :{blk:w<6?1:2,name:'Progression',note:'2 répétitions en réserve, dernière série jusqu’à 1.'};
/* Où en est-on à une date : null (pas de date de départ), {before}, {w,d} (semaine 1 à 12) ou {done}. */
const weekOf=date=>{const st=Store.d.settings.start;if(!st)return null;const d=D0(date)-D0(st);
  if(d<0)return{before:-d};const w=Math.floor(d/7)+1;return w>12?{done:true,d}:{w,d}};
function progCard(){
  const x=weekOf(Store.today());
  if(!x)return `<div class="card"><h3>Programme</h3><p class="mute small">Définis la date de ta première séance pour suivre les semaines du programme.</p><button class="btn" data-act="goprog">Définir la date de départ</button></div>`;
  if(x.before)return `<div class="card"><h3>Programme</h3><p class="mute small">Départ le ${fmtDate(Store.d.settings.start)} : dans ${x.before} jour${x.before>1?'s':''}.</p></div>`;
  if(x.done)return `<div class="card"><h3>Programme terminé</h3><p class="mute small">Les 12 semaines sont passées. Exporte ton journal (Réglages > Sauvegarde) et fais le bilan avec Claude.</p></div>`;
  return '';
}
function sessBanner(date){
  const x=weekOf(date);if(!x||!x.w)return '';const p=PHASE(x.w);
  return `<div class="note${p.dl?' deload':''}"><b>Semaine ${x.w} / 12 · ${p.name}.</b> ${esc(p.dl?DELOAD_TXT:p.note)}</div>`;
}
const checksList=()=>(Store.d.checks||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
/* Mesures et photos : toutes les 6 semaines à partir du départ, puis de la dernière mesure. */
function nextCheck(){
  const st=Store.d.settings.start;if(!st)return null;const c=checksList(),last=c.length?c[c.length-1].date:null;
  const due=addDays(last&&last>=st?last:st,42);return{due,off:D0(due)-D0(Store.today())}}
function checkCard(){
  const n=nextCheck();if(!n||n.off>7)return '';
  const t=n.off<0?`En retard de ${-n.off} jour${-n.off>1?'s':''} (prévu le ${fmtDate(n.due)})`:n.off===0?'À faire aujourd’hui':`À faire d’ici le ${fmtDate(n.due)} (dans ${n.off} jour${n.off>1?'s':''})`;
  return `<div class="card"><h3>Mesures et photos</h3><p class="small"><b>${t}</b></p><p class="mute small">Tour de taille et photos de face, de profil et de dos, comme la série de départ.</p>
   <div class="inline"><input id="waist" inputmode="decimal" placeholder="Tour de taille (cm), optionnel" aria-label="Tour de taille en centimètres"><button class="btn primary" data-act="checkdone">Fait aujourd’hui</button></div></div>`;
}

/* Accueil : séance du jour en grand, semaine du lundi au dimanche, puis toutes les séances. */
const SLET={a:'A',b:'B',c:'C',home:'M'};
const mondayOf=d=>addDays(d,-((new Date(D0(d)*864e5).getUTCDay()+6)%7));
const GYM=['a','b','c'];
/* Séances salle faites dans chacune des 12 semaines du programme (semaine 1 = date de départ). */
function progWeeks(){const st=Store.d.settings.start;if(!st)return[];
  return Array.from({length:12},(_,i)=>{let n=0;for(let k=0;k<7;k++){const dt=addDays(st,7*i+k);n+=GYM.filter(g=>Store.countDone(dt,g)>0).length}return n})}
function weekMap(){const mo=mondayOf(Store.today()),days=[];
  for(let i=0;i<7;i++){const dt=addDays(mo,i);days.push({dt,sids:SESSIONS.map(x=>x.id).filter(id=>Store.countDone(dt,id)>0)})}
  return days}
/* Séance proposée : A puis B tant qu’elles manquent cette semaine (2 séances salle, C compte pour une), sinon la routine maison ; 48 h entre deux séances salle. */
function suggest(days){
  const td=Store.today(),all=days.flatMap(d=>d.sids),gym=all.filter(i=>GYM.includes(i)),home=all.filter(i=>i==='home').length;
  const doneToday=(days.find(d=>d.dt===td)||{sids:[]}).sids;
  if(doneToday.length){const id=doneToday[doneToday.length-1];return{done:true,sid:id,gym:GYM.includes(id)}}
  const ydt=addDays(td,-1),yGym=(days.find(d=>d.dt===ydt)||{sids:[]}).sids.some(i=>GYM.includes(i));
  let sid=null;
  if(gym.length<2)sid=!all.includes('a')&&!all.includes('c')?'a':!all.includes('b')?'b':'a';
  if(gym.length<2&&all.includes('c')&&!all.includes('a'))sid=!all.includes('b')?'b':'a';
  if(sid&&yGym)return{sid:'home',why:'Séance salle hier : 48 h de repos entre deux séances salle.',alt:sid};
  if(sid)return{sid,alt:null};
  return{sid:'home',why:home>=3?'Semaine salle faite et routine maison faite 3 fois.':'Semaine salle faite : la routine maison complète la semaine.',alt:null}}
function viewHome(){
  const card=sid=>{const s=sessOf(sid),ld=Store.lastDate(sid);
    return `<button class="home-card" data-act="sess" data-id="${sid}"><span class="hc-t"><b>${esc(s.title)}</b><span>${esc(s.dur)} · ${esc(s.focus)}</span><span class="small">${ld?'Dernière fois : '+fmtDay(ld):'Pas encore faite'}</span></span><span class="chev" aria-hidden="true">›</span></button>`};
  const days=weekMap(),sg=suggest(days),td=Store.today(),x=weekOf(td),inProg=x&&x.w,p=inProg?PHASE(x.w):null;
  const all=days.flatMap(d=>d.sids),ng=all.filter(i=>GYM.includes(i)).length,nh=all.filter(i=>i==='home').length;
  const sess=sessOf(sg.sid);
  const kick=inProg?`Semaine ${x.w} / 12 · Bloc ${p.blk} · ${p.name}`:fmtDay(td);
  const pw=inProg?progWeeks():[],wn=inProg?pw[x.w-1]:0;
  const bar=inProg?`<span class="prog wk" aria-hidden="true">${pw.map((n,i)=>`<i class="${n>=2?'full':n===1?'half':''}${i+1===x.w?' cur':''}${i+1===6||i+1===12?' dl':''}"></i>`).join('')}</span><span class="hero-wk">Semaine ${x.w} du programme : ${Math.min(wn,2)}/2 séances salle</span>`:'';
  const hero=`<button class="hero${sg.done?' done':''}" data-act="sess" data-id="${sg.sid}"><span class="hero-k">${esc(kick)}</span>
   <b class="hero-t">${sg.done?esc(sess.title)+' faite ✓':esc(sess.title)}</b>
   <span class="hero-s">${esc(sess.dur)} · ${esc(sess.focus)}</span>
   ${sg.why?`<span class="hero-w">${esc(sg.why)}</span>`:''}
   ${sg.done&&sg.gym?'<span class="hero-w">Repos conseillé : 48 h avant la prochaine séance salle.</span>':''}
   <span class="hero-n">Cette semaine : ${ng}/2 séances salle · ${nh} maison</span>${bar}
   <span class="hero-go">${sg.done?'Voir ou modifier ›':'Commencer ›'}</span></button>`+
   (sg.alt?`<button class="btn hero-alt" data-act="sess" data-id="${sg.alt}">Faire quand même la ${esc(sessOf(sg.alt).title)}</button>`:'');
  const strip=`<h2>Cette semaine</h2><div class="wstrip" role="list">`+days.map(d=>{const dd=d.dt.slice(8).replace(/^0/,''),dn=DAYS[new Date(D0(d.dt)*864e5).getUTCDay()].replace('.','');
    return `<div class="wd${d.dt===td?' today':''}${d.sids.length?' has':''}${d.dt>td?' fut':''}" role="listitem" aria-label="${esc(fmtDay(d.dt))}${d.sids.length?' : '+d.sids.map(i=>sessOf(i).title).join(', '):''}"><small>${esc(dn)}</small><b>${dd}</b><span>${d.sids.length?d.sids.map(i=>SLET[i]||'').join(' '):'·'}</span></div>`}).join('')+`</div>`;
  return `<h1>Gym Guide</h1>
   ${hero}${inProg&&p.dl?`<div class="note deload"><b>Semaine allégée.</b> ${esc(DELOAD_TXT)}</div>`:''}${strip}${progCard()}${checkCard()}
   <h2>Toutes les séances</h2><div class="list">${card('a')}${card('b')}${card('c')}${card('home')}</div>`;
}
/* Écran d'une séance : nouvelle séance en haut, puis toutes les séances enregistrées, de la plus récente à la plus ancienne. */
const swipe=(dt,sid,html)=>`<div class="sw"><div class="sw-bg"><button class="sw-del" data-act="swdel" data-d="${dt}" data-s="${esc(sid)}">Supprimer</button></div><div class="sw-front">${html}</div></div>`;
window.swipe=swipe;
function viewChoice(sess){
  const td=Store.today(),dts=Store.sessionDates(sess.id);
  const items=dts.map(dt=>{const n=Store.countDone(dt,sess.id),sd=sess.stations.filter((_,i)=>stationDone(sess,i,dt)).length;
    return swipe(dt,sess.id,`<button class="home-card" data-act="start" data-d="${dt}"><span class="hc-t"><b>${fmtDay(dt)}${dt===td?' · aujourd’hui':''}</b><span>${sd}/${sess.stations.length} stations · ${n} série${n>1?'s':''}</span></span><span class="edit-tag">Modifier</span><span class="chev" aria-hidden="true">›</span></button>`)}).join('');
  return `<div class="top"><button class="btn sm" data-act="home">‹ Accueil</button></div>
   <h1>${esc(sess.title)}</h1><div class="mute">${esc(sess.dur)} · ${esc(sess.focus)}</div>
   <div class="choices"><button class="choice primary" data-act="fresh"><b>Nouvelle séance</b><span>${fmtDay(td)} · les chiffres de la dernière fois sont proposés</span></button></div>
   <h2>Séances précédentes</h2>
   ${items?'<p class="mute small">Glisse une séance vers la droite pour la supprimer.</p>':''}
   ${items?`<div class="list">${items}</div>`:'<p class="mute small">Aucune séance enregistrée pour l’instant.</p>'}`;
}
const hasStr=sess=>!!(sess.stretch&&sess.stretch.length);
const nSt=sess=>sess.stations.length+(hasStr(sess)?1:0);
const strAllDone=(sess,date)=>hasStr(sess)&&sess.stretch.every(id=>Store.strGet(date,sess.id).includes(id));
const strMin=sess=>Math.max(1,Math.round(sess.stretch.reduce((n,id)=>n+STRETCH[id].t*(STRETCH[id].side?2:1)+10,0)/60));
const isWarm=(sess,i)=>!!sess.stations[i][0].warm;
function stLabel(sess,i){let n=0,w=0;for(let k=0;k<=i;k++){if(isWarm(sess,k))w++;else n++}
  const tw=sess.stations.filter((_,k)=>isWarm(sess,k)).length,tn=sess.stations.length-tw;
  return isWarm(sess,i)?{n:String(w),txt:'Échauffement '+w+' / '+tw}:{n:String(n),txt:'Station '+n+' / '+tn}}
function viewTrain(){
  if(S.sess===null)return viewHome();
  const sess=sessOf(S.sess);
  if(S.date===null)return viewChoice(sess);
  if(S.st!==null)return viewStation(sess,S.st);
  const done=sess.stations.filter((_,i)=>stationDone(sess,i)).length;
  const hasWarm=sess.stations.some((_,i)=>isWarm(sess,i));
  const strRow=hasStr(sess)?(()=>{const sd=strAllDone(sess,curDate()),ids=sess.stretch;
    return `<h2>Étirements · ${strMin(sess)} min</h2><button class="row${sd?' done':''}" data-act="open" data-i="${sess.stations.length}"><span class="num">${sd?'✓':'🧘'}</span><span class="t"><b>Étirements</b><span>${ids.map(id=>esc(STRETCH[id].fr)).join(' · ')}</span></span><span class="sr">${ids.length}</span></button>`})():'';
  const rows=sess.stations.map((st,i)=>{
    const d=stationDone(sess,i),head=hasWarm&&(i===0||isWarm(sess,i-1)!==isWarm(sess,i))?`<h2>${isWarm(sess,i)?'Échauffement · 6 min':'Séance'}</h2>`:'';
    return head+`<button class="row${d?' done':''}" data-act="open" data-i="${i}"><span class="num">${d?'✓':stLabel(sess,i).n}</span><span class="t">${st.length>1?'<span class="ss">Superset</span>':''}`+
      st.map(r=>{const it=E(sess,r);return `<b>${esc(EX[it.ex].en)}</b><span>${esc(EX[it.ex].fr)}</span>`+(r.alt?`<span class="alt-hint">⇄ ${r.alt.length+1} variantes</span>`:'')}).join('')+
      `</span><span class="sr">${st.map(r=>{const it=E(sess,r);return it.sets>1||EX[it.ex].kind!=='tick'?`${it.sets}×${esc(it.reps)}`:esc(it.reps)}).join('<br>')}</span></button>`}).join('');
  const edit=S.date!==Store.today();
  return `<div class="top"><button class="btn sm" data-act="choice">‹ Retour</button></div>
   <h1>${esc(sess.title)}</h1><div class="mute">${esc(sess.sub)}</div>
   ${edit?`<div class="note editing">Modification de la séance du <b>${fmtDay(S.date)}</b>. Les changements remplacent les chiffres enregistrés ce jour-là.</div>`:''}
   ${sessBanner(curDate())}
   <p class="mute small" style="margin-top:10px">${esc(sess.intro)}</p>
   <div class="small mute">${edit?fmtDate(S.date):'Aujourd’hui'} : ${done}/${sess.stations.length} stations faites</div>
   <div class="list">${rows}${strRow}</div>`;
}

function viewStation(sess,si){
  if(hasStr(sess)&&si>=sess.stations.length)return viewStretch(sess,si);
  const st=sess.stations[si],raw=st[Math.min(S.exi,st.length-1)],date=curDate(),it=E(sess,raw,date),ex=EX[it.ex];
  const prog=sess.stations.map((_,i)=>`<i class="${stationDone(sess,i)?'on':''}${i===si?' cur':''}"></i>`).join('')+(hasStr(sess)?`<i class="${strAllDone(sess,date)?'on':''}"></i>`:'');
  const ssBar=st.length>1?`<div class="ss-bar"><span class="ss">Superset</span><span class="mute small">alterne les deux exercices</span></div>`:'';
  const tabs=st.length>1?`<div class="ex-tabs">`+st.map((x,k)=>`<button data-act="ex" data-k="${k}" aria-selected="${k===S.exi}">${esc(EX[E(sess,x,date).ex].en)}<small>${setsDone(sess,x,date)}/${E(sess,x,date).sets} séries</small></button>`).join('')+`</div>`:'';
  const prev=Store.last(it.ex,date),logged=Store.get(date,sess.id,it.ex);
  const kind=ex.kind;let sets='';const firstOpen=(()=>{for(let k=0;k<it.sets;k++)if(!(logged[k]&&logged[k].done))return k;return -1})();
  for(let k=0;k<it.sets;k++){
    const s=logged[k]||{},ps=prev&&(prev.sets[k]||prev.sets[prev.sets.length-1]);
    const pre=S.date===Store.today()?ps:null;
    const r=s.reps!=null?s.reps:(pre&&pre.reps!=null?pre.reps:''),w=s.kg!=null?s.kg:(pre&&pre.kg!=null?pre.kg:'');
    const cls='set'+(s.done?' done':'')+(kind==='tick'?' t1':'')+(!s.done&&k===firstOpen?' cur':'');
    sets+=`<div class="${cls}"><span class="n">${k+1}</span>`+
     (kind==='tick'?`<span>${esc(it.reps)}</span>`:
      `<div><label for="r${k}">${kind==='time'?'Durée (s)':'Reps'}</label><input id="r${k}" inputmode="numeric" pattern="[0-9]*" value="${esc(r)}" placeholder="${ps&&ps.reps!=null?ps.reps:first(it.reps)}" data-act="inp"></div>`+
      (kind==='time'?`<button class="go" data-act="cd" data-k="${k}" aria-label="Lancer le minuteur de la série ${k+1}">▶</button>`:kind==='reps'?`<div class="mute small"></div>`:`<div><label for="w${k}">${kind==='assist'?'Assist. kg':'kg'}</label><input id="w${k}" inputmode="decimal" value="${esc(w)}" placeholder="${ps&&ps.kg!=null?esc(ps.kg):'kg'}" data-act="inp"></div>`))+
     `<button class="ok" data-act="tick" data-k="${k}" aria-pressed="${!!s.done}" aria-label="Série ${k+1} faite">✓</button></div>`;
  }
  const mm=kind==='tick'&&String(it.reps).match(/^(\d+(?:[.,]\d+)?)\s*min/),dsec=mm?(Store.durGet(it.ex)||Math.round(parseFloat(mm[1].replace(',','.'))*60)):0;
  const durCard=mm?`<div class="durcard"><span class="mute">Minuteur</span><button class="btn sm" data-act="cdm" data-d="-30" aria-label="30 secondes de moins">−30 s</button><b>${fmtMS(dsec)}</b><button class="btn sm" data-act="cdm" data-d="30" aria-label="30 secondes de plus">+30 s</button><button class="shold dgo" data-act="cdc">▶ Lancer</button></div>`:'';
  const lastTxt=prev?`Dernière fois (${fmtDate(prev.date)}) : `+prev.sets.map(s=>(s.reps!=null?s.reps:'')+(s.kg!=null&&s.kg!==''?'×'+s.kg+' kg':'')).join(' · '):'Première fois : note tes charges de départ.';
  const vid=Store.videoId(it.ex),vok=/^[A-Za-z0-9_-]{11}$/.test(vid);
  const video=!vok?`<div class="novid"><span>Pas de vidéo par défaut.</span><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.en+' form')}" target="_blank" rel="noopener">Chercher une démo ↗</a></div>`:S.vid&&vok?`<iframe src="https://www.youtube-nocookie.com/embed/${vid}?playsinline=1&rel=0&autoplay=1" title="${esc(ex.en)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    :`<button class="play" data-act="vid" aria-label="Lire la vidéo"></button>`;
  const chips=raw.alt?`<div class="alts"><span class="mute small">Variante : choisis selon ce qui est libre</span><div class="chips">`+[{ex:raw.ex}].concat(raw.alt).filter(o=>o.ex!==it.ex).map(o=>`<button class="chip" data-act="alt" data-base="${esc(raw.ex)}" data-ex="${esc(o.ex)}">${esc(EX[o.ex].en)}${o.ex===raw.ex?'<small>prévu</small>':''}</button>`).join('')+`</div></div>`:'';
  const note=Store.noteGet(it.ex);
  const vidFold=`<details class="card fold" data-k="vid"${S.open.vid?' open':''}><summary><h3>Vidéo</h3></summary><div class="fold-b"><div class="video">${video}</div>
   <div class="vlinks">${vok?`<a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">Ouvrir sur YouTube ↗</a>`:'<span></span>'}<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.en+' form')}" target="_blank" rel="noopener">Autres démos ↗</a></div></div></details>`;
  const noteFold=`<details class="card fold" data-k="notes"${S.open.notes?' open':''}><summary><h3>Notes</h3>${note?`<span class="npv">${esc(note.split(/\n+/).map(x=>x.trim()).filter(Boolean).join(' · '))}</span>`:''}</summary><div class="fold-b">
   <textarea id="exnote" data-ex="${esc(it.ex)}" rows="3" placeholder="Réglage de la machine, sensations, rappel…" aria-label="Notes sur ${esc(ex.en)}">${esc(note)}</textarea>
   <p class="mute small">Valable pour cet exercice dans toutes les séances. Reste sur ce téléphone.</p></div></details>`;
  const last=si===nSt(sess)-1;
  const editBar=date!==Store.today()?`<div class="note editing">Modification de la séance du <b>${fmtDay(date)}</b></div>`:'';
  return `<div class="top"><button class="btn sm" data-act="list">‹ Liste</button><span class="mute small">${stLabel(sess,si).txt}</span></div>${editBar}
   <div class="prog">${prog}</div>${ssBar}${tabs}
   <div class="name-en">${esc(ex.en)}</div><div class="name-fr">${esc(ex.fr)}</div>${chips}
   <div class="target"><span class="mute">Objectif</span><b>${kind==='tick'&&it.sets===1?esc(it.reps):it.sets+' × '+esc(it.reps)}</b></div>
   ${durCard}<div class="sets">${sets}</div><div class="last">${esc(lastTxt)}</div>
   <div class="navbtns"><button class="btn big" data-act="prev"${si===0?' disabled':''}>‹ Préc.</button><button class="btn big primary${firstOpen<0?' ready':''}" data-act="next">${last?'Terminer ✓':'Station suivante ›'}</button></div>
   ${it.note?`<div class="note">${esc(it.note)}</div>`:''}${ex.note?`<div class="note">${esc(ex.note)}</div>`:''}
   ${vidFold}${noteFold}
   <ul class="cues">${ex.cues.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
   <div class="avoid"><b>À éviter :</b> ${esc(ex.avoid)}</div>`;
}

function viewStretch(sess,si){
  const date=curDate(),ids=sess.stretch,done=Store.strGet(date,sess.id),all=strAllDone(sess,date);
  const prog=sess.stations.map((_,i)=>`<i class="${stationDone(sess,i)?'on':''}"></i>`).join('')+`<i class="cur"></i>`;
  const tiles=ids.map((id,k)=>{const t=STRETCH[id],d=done.includes(id);
    return `<article class="stile${d?' done':''}" style="--c:${t.c}"><span class="sn">${k+1}</span>
     <button class="sck" data-act="stk" data-id="${id}" aria-pressed="${d}" aria-label="${esc(t.en)} : fait"></button>
     <div class="simg"><img src="img/stretch/${id}-0.jpg" alt="${esc(t.en)}, début" loading="lazy"><img src="img/stretch/${id}-1.jpg" alt="" loading="lazy"></div>
     <div class="sname">${esc(t.en)}</div><div class="sfr">${esc(t.fr)}</div>
     <div><span class="zone">${esc(t.zone)}</span></div>
     <button class="shold" data-act="sth" data-id="${id}" aria-label="Lancer le minuteur de ${t.t} secondes">▶ ${t.t} s<small>${esc(t.side||'')}</small></button>
     <p class="scue">${esc(t.cue)}</p></article>`}).join('');
  const editBar=date!==Store.today()?`<div class="note editing">Modification de la séance du <b>${fmtDay(date)}</b></div>`:'';
  return `<div class="top"><button class="btn sm" data-act="list">‹ Liste</button><span class="mute small">Étirements</span></div>${editBar}
   <div class="prog">${prog}</div>
   <h1>Étirements</h1><div class="mute">${ids.length} étirements · environ ${strMin(sess)} min. Tiens chaque position, respire, sans douleur. Le bouton noir lance le minuteur.</div>
   <div class="sgrid">${tiles}</div><p class="mute small">Photos : Free Exercise DB (domaine public). Les deux images alternent : début et fin du mouvement.</p>
   <div class="navbtns"><button class="btn big" data-act="prev">‹ Préc.</button><button class="btn big primary${all?' ready':''}" data-act="next">Terminer ✓</button></div>`;
}
function onTick(k){
  const sess=sessOf(S.sess),st=sess.stations[S.st],date=curDate(),it=E(sess,st[S.exi],date),ex=EX[it.ex];
  const cur=Store.get(date,sess.id,it.ex)[k]||{};
  if(cur.done){Store.setSet(date,sess.id,it.ex,k,{done:false});render();return}
  const v={done:true,t:Date.now()};
  if(ex.kind!=='tick'){const r=$('#r'+k),w=$('#w'+k);v.reps=r?num(r.value)??num(r.placeholder):null;if(w)v.kg=num(w.value)}
  Store.setSet(date,sess.id,it.ex,k,v);
  beepPrime();
  if(it.rest&&date===Store.today())startTimer(it.rest,ex.en);
  const other=st.findIndex((x,j)=>j!==S.exi&&setsDone(sess,x,date)<E(sess,x,date).sets);
  if(st.length>1&&other>=0&&S.exi!==other&&setsDone(sess,st[other],date)<=setsDone(sess,st[S.exi],date)){S.exi=other;S.vid=false;S.open.vid=S.open.notes=false;toTop()}
  render();
}
function goStation(i){S.st=i;S.exi=0;S.vid=false;S.open.vid=S.open.notes=false;toTop();wake();render()}

/* ---------- minuteur de repos (basé sur l’heure de fin, survit à la mise en veille) ---------- */
let T=null,tick=null,tmo=null,actx=null,aud=null,audOk=false,wavUrl=null,sndErr='';
/* Bip de fin de repos. Deux modes (Réglages) :
   - prioritaire (défaut) : élément <audio> (canal « lecture » d’iOS : audible même en mode silencieux ; peut mettre la musique en pause un instant) ;
   - mélangé : Web Audio en session « ambient » (ne coupe pas la musique, mais muet en mode silencieux).
   Robustesse : la session audio est fixée explicitement à chaque amorçage et à chaque bip, un élément <audio> neuf est débloqué à chaque coche
   (iOS peut invalider l’ancien après une interruption), et tout est réinitialisé au changement de mode. */
const sndMode=()=>Store.d.settings.soundMode==='mix'?'mix':'priority';
function makeWav(){const sr=22050,tones=[[0,880],[.25,880],[.5,1100]],n=Math.floor(sr*.7),b=new ArrayBuffer(44+n*2),v=new DataView(b);
  const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const t=i/sr;let x=0;for(const[o,f]of tones){const u=t-o;if(u>=0&&u<.17){const env=Math.min(1,u/.006,(.17-u)/.02);x+=(Math.sin(2*Math.PI*f*u)+.35*Math.sin(2*Math.PI*f*2*u))*env*.78}}v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true)}
  return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
const audSession=t=>{try{if(navigator.audioSession&&navigator.audioSession.type!==t)navigator.audioSession.type=t}catch(e){}};
const sessType=()=>{try{return navigator.audioSession?navigator.audioSession.type:'n/a'}catch(e){return 'n/a'}};
const newAud=()=>{wavUrl=wavUrl||makeWav();const a=new Audio(wavUrl);a.preload='auto';a.volume=1;return a};
function resetSound(){try{if(aud){aud.pause();aud.removeAttribute('src');aud.load()}}catch(e){}aud=null;audOk=false;sndErr='';
  try{if(actx&&actx.close)actx.close()}catch(e){}actx=null}
const getCtx=()=>{if(!actx||actx.state==='closed')actx=new(window.AudioContext||window.webkitAudioContext)();return actx};
function beepPrime(){/* à appeler depuis un geste de l’utilisateur */
  try{
    if(sndMode()==='priority'){audSession('playback');
      const a=newAud();a.muted=true;const p=a.play();
      if(p&&p.then)p.then(()=>{a.pause();a.currentTime=0;a.muted=false;aud=a;audOk=true;sndErr=''}).catch(e=>{audOk=false;sndErr=String(e&&e.name||e)});
      else{aud=a;audOk=true}}
    else audSession('ambient');
    const c=getCtx();if(c.state!=='running')c.resume()}catch(e){sndErr=String(e&&e.message||e)}}
function webBeep(type,due){try{audSession(type);const c=getCtx();
  const go=()=>{if(due&&Date.now()-due>LATE)return;if(c.state!=='running'){sndErr='Web Audio '+c.state;return}
    [0,.25,.5].forEach(o=>{const os=c.createOscillator(),g=c.createGain();os.type='triangle';os.frequency.value=o===.5?1100:880;g.gain.value=.7;os.connect(g);g.connect(c.destination);os.start(c.currentTime+o);os.stop(c.currentTime+o+.15)})};
  if(c.state==='running')go();else{const p=c.resume();if(p&&p.then)p.then(go,e=>{sndErr=String(e&&e.name||e)});else go()}}catch(e){sndErr=String(e&&e.message||e)}}
function beep(test,due){
  if(!test&&!Store.d.settings.sound)return;
  const fresh=()=>test||!due||Date.now()-due<=LATE;
  if(sndMode()==='priority'){audSession('playback');
    const fallback=e=>{sndErr=String(e&&e.name||e);audOk=false;aud=null;if(fresh())webBeep('playback',due)};
    try{const a=aud||newAud();a.muted=false;a.currentTime=0;const p=a.play();
      if(p&&p.then)p.then(()=>{audOk=true;aud=a;sndErr='';if(!fresh())a.pause()}).catch(fallback)}catch(e){fallback(e)}}
  else webBeep('ambient',due);
  try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
function sndStatus(){return 'Mode '+sndMode()+' · session '+sessType()+' · audio '+(audOk?'prêt':'non amorcé')+' · Web Audio '+(actx?actx.state:'—')+(sndErr?' · erreur : '+sndErr:'')}
const TLBL={rest:['Repos','Repos terminé'],hold:['Tiens','Terminé'],cd:['Minuteur','Terminé']};
function armTimer(){clearTimeout(tmo);if(T&&!T.fired)tmo=setTimeout(drawTimer,Math.max(0,T.end-Date.now())+15)}
function startTimer(sec,label,mode){mode=mode===true?'hold':(mode||'rest');T={end:Date.now()+sec*1000,label,mode,fired:false};clearInterval(tick);tick=setInterval(drawTimer,250);armTimer();drawTimer()}
function stopTimer(){T=null;clearInterval(tick);clearTimeout(tmo);$('#timer').hidden=true;$('#timer').className='timer'}
/* Le bip n’est jamais joué en retard : s’il n’a pas pu partir à l’heure (iOS suspend la page quand l’écran se verrouille ou qu’une autre app passe devant), on affiche « terminé » sans son. */
const LATE=2500;
function drawTimer(){
  const el=$('#timer');document.body.classList.toggle('hastimer',!!T);if(!T){el.hidden=true;return}
  const now=Date.now(),left=Math.ceil((T.end-now)/1000),over=left<=0;
  if(over&&!T.fired){T.fired=true;if(now-T.end<=LATE)beep(false,T.end)}
  const m=Math.floor(Math.max(left,0)/60),s=Math.max(left,0)%60,L=TLBL[T.mode]||TLBL.rest;
  el.hidden=false;el.className='timer'+(over?' end':'');
  el.innerHTML=`<div><span class="t" aria-live="off">${m}:${String(s).padStart(2,'0')}</span><span class="lbl">${over?L[1]:L[0]}${T.label?'<b>'+esc(T.label)+'</b>':''}</span>`+
   (over?'':`<button data-act="tm" data-d="-15">−15</button><button data-act="tm" data-d="15">+15</button>`)+`<button data-act="tmstop">${over?'OK':'Passer'}</button></div>`;
}
/* ---------- écran allumé ---------- */
let lock=null;
async function wake(){try{if(Store.d.settings.awake&&'wakeLock' in navigator&&!lock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(S.st!==null)wake();drawTimer()}});

/* ---------- rendu et événements ---------- */
function render(){
  $('#tabbar').innerHTML=TABS.map(([id,l])=>`<button data-act="tab" data-id="${id}" aria-current="${S.tab===id}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg>${l}</button>`).join('');
  const v={train:viewTrain,guides:()=>viewGuides(),progress:()=>viewProgress(),settings:()=>viewSettings()}[S.tab];
  $('#app').innerHTML=v();
}
function onAct(e){
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,sess=sessOf(S.sess);
  if(a==='inp')return;
  if(a==='tab'){if(S.tab==='progress'&&b.dataset.id==='progress')S.prog.ex=null;S.tab=b.dataset.id;S.st=null;if(S.tab==='train'){S.sess=null;S.date=null}persist();toTop();render()}
  else if(a==='sess'){S.sess=b.dataset.id;S.st=null;S.date=null;toTop();render()}
  else if(a==='fresh'){const td=Store.today(),n=Store.countDone(td,S.sess);
    if(n&&!confirm('Une séance existe déjà aujourd’hui ('+n+' série'+(n>1?'s':'')+'). La remplacer par une séance vide ? L’ancienne reste récupérable dans Réglages > Sauvegarde > Annuler.'))return;
    if(n)Store.resetSession(td,S.sess);S.date=td;S.st=null;toTop();render()}
  else if(a==='start'){S.date=b.dataset.d;S.st=null;toTop();render()}
  else if(a==='choice'){S.date=null;S.st=null;toTop();render()}
  else if(a==='home'){S.sess=null;S.date=null;S.st=null;toTop();render()}
  else if(a==='open')goStation(+b.dataset.i);
  else if(a==='list'){S.st=null;render()}
  else if(a==='ex'){S.exi=+b.dataset.k;S.vid=false;S.open.vid=S.open.notes=false;render()}
  else if(a==='vid'){S.vid=true;render()}
  else if(a==='sndtest'){resetSound();beepPrime();setTimeout(()=>{beep(true);setTimeout(()=>{const el=$('#sndstat');if(el)el.textContent=sndStatus();toast(sndErr?'Son : erreur '+sndErr:'Son lancé')},350)},250)}
  else if(a==='swdel'){const dt=b.dataset.d,sid=b.dataset.s,t=Store.sessTitle(dt,sid).split(' : ')[0];
    if(!confirm('Supprimer la séance « '+t+' » du '+fmtDay(dt)+' ? Seules les données de cette séance sont effacées. Récupérable dans Réglages > Sauvegarde > Annuler.'))return;
    Store.deleteSession(dt,sid);if(S.date===dt&&S.sess===sid)S.date=null;render();toast('Séance supprimée')}
  else if(a==='goprog'){S.tab='settings';S.open.program=true;S.st=null;persist();toTop();render()}
  else if(a==='alt'){Store.pickSet(curDate(),sess.id,b.dataset.base,b.dataset.ex);S.vid=false;S.open.vid=S.open.notes=false;render()}
  else if(a==='tick')onTick(+b.dataset.k);
  else if(a==='prev'&&S.st>0)goStation(S.st-1);
  else if(a==='next'){if(S.st<nSt(sess)-1)goStation(S.st+1);else{S.st=null;toTop();render();toast('Séance terminée. Bien joué.')}}
  else if(a==='cd'||a==='cdm'||a==='cdc'){const st=sess.stations[S.st],it=E(sess,st[S.exi],curDate()),ex=EX[it.ex];
    if(a==='cd'){const r=$('#r'+b.dataset.k),sec=Math.round(num(r&&r.value)??num(r&&r.placeholder)??45);beepPrime();startTimer(Math.max(5,sec),ex.en+' · série '+(+b.dataset.k+1),'hold')}
    else{const mm=String(it.reps).match(/^(\d+(?:[.,]\d+)?)\s*min/),cur=Store.durGet(it.ex)||Math.round(parseFloat((mm?mm[1]:'1').replace(',','.'))*60);
      if(a==='cdm'){Store.durSet(it.ex,Math.max(30,cur+ +b.dataset.d));render()}else{beepPrime();startTimer(cur,ex.en,'cd')}}}
  else if(a==='stk'){Store.strToggle(curDate(),sess.id,b.dataset.id);render()}
  else if(a==='sth'){const t=STRETCH[b.dataset.id];beepPrime();startTimer(t.t,t.en,'hold')}
  else if(a==='tm'&&T){T.end+=+b.dataset.d*1000;T.fired=false;armTimer();drawTimer()}
  else if(a==='tmstop')stopTimer();
  else if(a==='guide'){S.guide=b.dataset.id;render()}
  else if(window.onViewAct)window.onViewAct(a,b,e);
}
document.addEventListener('click',onAct);
document.addEventListener('toggle',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.k;if(k)S.open[k]=e.target.open},true);

/* Glisser une tuile vers la droite : découvre « Supprimer ». Un toucher sur une tuile ouverte la referme. */
(()=>{let g=null,moved=false;const W=96;
  const rel=f=>setTimeout(()=>{if(!f.classList.contains('open')&&!f.style.transform)f.parentNode.classList.remove('act')},260);
  const close=()=>document.querySelectorAll('.sw-front.open').forEach(f=>{f.classList.remove('open');f.style.transform='';rel(f)});
  document.addEventListener('pointerdown',e=>{if(g)end();moved=false;const f=e.target.closest('.sw-front');if(!f||e.target.closest('.sw-del'))return;
    if(!f.classList.contains('open'))close();g={f,x:e.clientX,y:e.clientY,pid:e.pointerId,open:f.classList.contains('open'),dx:0,lock:null};moved=false});
  document.addEventListener('pointermove',e=>{if(!g)return;if(e.pointerType==='mouse'&&e.buttons===0){end();return}const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(g.lock===null){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.5)g.lock='x';else if(Math.abs(dy)>8){g=null;return}else return}
    moved=true;g.f.parentNode.classList.add('act');const base=g.open?W:0;g.dx=Math.max(0,Math.min(W+24,base+dx));g.f.style.transition='none';g.f.style.transform='translateX('+g.dx+'px)'});
  const end=()=>{if(!g)return;const f=g.f;f.style.transition='';
    if(g.lock==='x'){setTimeout(()=>{moved=false},400);const o=g.dx>56;f.classList.toggle('open',o);f.style.transform=o?'translateX('+W+'px)':'';if(!o)rel(f)}g=null};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  /* Filet de sécurité (iOS peut perdre le pointerup sur un <summary>) : la fin du toucher termine toujours le geste. */
  document.addEventListener('touchend',end,true);document.addEventListener('touchcancel',end,true);
  document.addEventListener('click',e=>{if(moved){moved=false;e.preventDefault();e.stopPropagation();return}
    const f=e.target.closest('.sw-front.open');if(f&&!e.target.closest('.sw-del')){e.preventDefault();e.stopPropagation();close()}},true);
})();

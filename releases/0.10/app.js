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
const toast=(m)=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)};

const ICONS={
 train:'<path d="M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5"/>',
 guides:'<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 8h6M9 12h6"/>',
 progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'};
const TABS=[['train','Accueil'],['progress','Suivi'],['guides','Guides'],['settings','Réglages']];

/* ---------- séances ---------- */
const curDate=()=>S.date||Store.today();
const stationDone=(sess,i,date=curDate())=>sess.stations[i].every(it=>setsDone(sess,it,date)>=it.sets);
function setsDone(sess,it,date){return Store.get(date,sess.id,it.ex).filter(s=>s&&s.done).length}
const first=r=>(String(r).match(/\d+/)||[''])[0];

function viewHome(){
  const card=sid=>{const s=sessOf(sid),ld=Store.lastDate(sid);
    return `<button class="home-card" data-act="sess" data-id="${sid}"><span class="hc-t"><b>${esc(s.title)}</b><span>${esc(s.dur)} · ${esc(s.focus)}</span><span class="small">${ld?'Dernière fois : '+fmtDay(ld):'Pas encore faite'}</span></span><span class="chev" aria-hidden="true">›</span></button>`};
  return `<h1>Gym Guide</h1><div class="mute">${fmtDay(Store.today())}</div>
   <h2>À la salle</h2><div class="list">${card('a')}${card('b')}${card('c')}</div>
   <h2>À la maison</h2><div class="list">${card('home')}</div>`;
}
/* Écran d'une séance : nouvelle séance en haut, puis toutes les séances enregistrées, de la plus récente à la plus ancienne. */
function viewChoice(sess){
  const td=Store.today(),dts=Store.sessionDates(sess.id);
  const items=dts.map(dt=>{const n=Store.countDone(dt,sess.id),sd=sess.stations.filter((_,i)=>stationDone(sess,i,dt)).length;
    return `<button class="home-card" data-act="start" data-d="${dt}"><span class="hc-t"><b>${fmtDay(dt)}${dt===td?' · aujourd’hui':''}</b><span>${sd}/${sess.stations.length} stations · ${n} série${n>1?'s':''}</span></span><span class="edit-tag">Modifier</span><span class="chev" aria-hidden="true">›</span></button>`}).join('');
  return `<div class="top"><button class="btn sm" data-act="home">‹ Accueil</button></div>
   <h1>${esc(sess.title)}</h1><div class="mute">${esc(sess.dur)} · ${esc(sess.focus)}</div>
   <div class="choices"><button class="choice primary" data-act="fresh"><b>Nouvelle séance</b><span>${fmtDay(td)} · les chiffres de la dernière fois sont proposés</span></button></div>
   <h2>Séances précédentes</h2>
   ${items?`<div class="list">${items}</div>`:'<p class="mute small">Aucune séance enregistrée pour l’instant.</p>'}`;
}
const isWarm=(sess,i)=>!!sess.stations[i][0].warm;
function stLabel(sess,i){let n=0,w=0;for(let k=0;k<=i;k++){if(isWarm(sess,k))w++;else n++}
  const tw=sess.stations.filter((_,k)=>isWarm(sess,k)).length,tn=sess.stations.length-tw;
  return isWarm(sess,i)?{n:'É'+w,txt:'Échauffement '+w+' / '+tw}:{n:String(n),txt:'Station '+n+' / '+tn}}
function viewTrain(){
  if(S.sess===null)return viewHome();
  const sess=sessOf(S.sess);
  if(S.date===null)return viewChoice(sess);
  if(S.st!==null)return viewStation(sess,S.st);
  const done=sess.stations.filter((_,i)=>stationDone(sess,i)).length;
  const hasWarm=sess.stations.some((_,i)=>isWarm(sess,i));
  const rows=sess.stations.map((st,i)=>{
    const d=stationDone(sess,i),head=hasWarm&&(i===0||isWarm(sess,i-1)!==isWarm(sess,i))?`<h2>${isWarm(sess,i)?'Échauffement · 6 min':'Séance'}</h2>`:'';
    return head+`<button class="row${d?' done':''}" data-act="open" data-i="${i}"><span class="num">${d?'✓':stLabel(sess,i).n}</span><span class="t">`+
      st.map(it=>`<b>${esc(EX[it.ex].en)}</b><span>${esc(EX[it.ex].fr)}</span>`).join('')+
      `</span><span class="sr">${st.map(it=>it.sets>1||EX[it.ex].kind!=='tick'?`${it.sets}×${esc(it.reps)}`:esc(it.reps)).join('<br>')}</span></button>`}).join('');
  const edit=S.date!==Store.today();
  return `<div class="top"><button class="btn sm" data-act="choice">‹ Retour</button></div>
   <h1>${esc(sess.title)}</h1><div class="mute">${esc(sess.sub)}</div>
   ${edit?`<div class="note editing">Modification de la séance du <b>${fmtDay(S.date)}</b>. Les changements remplacent les chiffres enregistrés ce jour-là.</div>`:''}
   <p class="mute small" style="margin-top:10px">${esc(sess.intro)}</p>
   <div class="small mute">${edit?fmtDate(S.date):'Aujourd’hui'} : ${done}/${sess.stations.length} stations faites</div>
   <div class="list">${rows}</div>`;
}

function viewStation(sess,si){
  const st=sess.stations[si],it=st[Math.min(S.exi,st.length-1)],ex=EX[it.ex],date=curDate();
  const prog=sess.stations.map((_,i)=>`<i class="${stationDone(sess,i)?'on':''}${i===si?' cur':''}"></i>`).join('');
  const tabs=st.length>1?`<div class="ex-tabs">`+st.map((x,k)=>`<button data-act="ex" data-k="${k}" aria-selected="${k===S.exi}">${esc(EX[x.ex].en)}<small>${setsDone(sess,x,date)}/${x.sets} séries</small></button>`).join('')+`</div>`:'';
  const prev=Store.last(it.ex,date),logged=Store.get(date,sess.id,it.ex);
  const kind=ex.kind;let sets='';
  for(let k=0;k<it.sets;k++){
    const s=logged[k]||{},ps=prev&&(prev.sets[k]||prev.sets[prev.sets.length-1]);
    const pre=S.date===Store.today()?ps:null;
    const r=s.reps!=null?s.reps:(pre&&pre.reps!=null?pre.reps:''),w=s.kg!=null?s.kg:(pre&&pre.kg!=null?pre.kg:'');
    const cls='set'+(s.done?' done':'')+(kind==='tick'?' t1':'');
    sets+=`<div class="${cls}"><span class="n">${k+1}</span>`+
     (kind==='tick'?`<span>${esc(it.reps)}</span>`:
      `<div><label for="r${k}">Reps</label><input id="r${k}" inputmode="numeric" pattern="[0-9]*" value="${esc(r)}" placeholder="${ps&&ps.reps!=null?ps.reps:first(it.reps)}" data-act="inp"></div>`+
      (kind==='reps'?`<div class="mute small">${it.side?'':''}</div>`:`<div><label for="w${k}">${kind==='assist'?'Assist. kg':'kg'}</label><input id="w${k}" inputmode="decimal" value="${esc(w)}" placeholder="${ps&&ps.kg!=null?esc(ps.kg):'kg'}" data-act="inp"></div>`))+
     `<button class="ok" data-act="tick" data-k="${k}" aria-pressed="${!!s.done}" aria-label="Série ${k+1} faite">✓</button></div>`;
  }
  const lastTxt=prev?`Dernière fois (${fmtDate(prev.date)}) : `+prev.sets.map(s=>(s.reps!=null?s.reps:'')+(s.kg!=null&&s.kg!==''?'×'+s.kg+' kg':'')).join(' · '):'Première fois : note tes charges de départ.';
  const vid=Store.videoId(it.ex),vok=/^[A-Za-z0-9_-]{11}$/.test(vid);
  const video=!vok?`<div class="novid"><span>Pas de vidéo par défaut.</span><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.en+' form')}" target="_blank" rel="noopener">Chercher une démo ↗</a></div>`:S.vid&&vok?`<iframe src="https://www.youtube-nocookie.com/embed/${vid}?playsinline=1&rel=0&autoplay=1" title="${esc(ex.en)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    :`<button class="play" data-act="vid" aria-label="Lire la vidéo"></button>`;
  const last=si===sess.stations.length-1;
  const editBar=date!==Store.today()?`<div class="note editing">Modification de la séance du <b>${fmtDay(date)}</b></div>`:'';
  return `<div class="top"><button class="btn sm" data-act="list">‹ Liste</button><span class="mute small">${stLabel(sess,si).txt}</span></div>${editBar}
   <div class="prog">${prog}</div>${tabs}
   <div class="name-en">${esc(ex.en)}</div><div class="name-fr">${esc(ex.fr)}</div>
   <div class="video">${video}</div>
   <div class="vlinks">${vok?`<a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">Ouvrir sur YouTube ↗</a>`:'<span></span>'}<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.en+' form')}" target="_blank" rel="noopener">Autres démos ↗</a></div>
   <div class="target"><span class="mute">Objectif</span><b>${kind==='tick'&&it.sets===1?esc(it.reps):it.sets+' × '+esc(it.reps)}</b></div>
   <div class="sets">${sets}</div><div class="last">${esc(lastTxt)}</div>
   ${it.note?`<div class="note">${esc(it.note)}</div>`:''}${ex.note?`<div class="note">${esc(ex.note)}</div>`:''}
   <ul class="cues">${ex.cues.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
   <div class="avoid"><b>À éviter :</b> ${esc(ex.avoid)}</div>
   <div class="navbtns"><button class="btn big" data-act="prev"${si===0?' disabled':''}>‹ Préc.</button><button class="btn big primary" data-act="next">${last?'Terminer ✓':'Station suivante ›'}</button></div>`;
}

function onTick(k){
  const sess=sessOf(S.sess),st=sess.stations[S.st],it=st[S.exi],ex=EX[it.ex],date=curDate();
  const cur=Store.get(date,sess.id,it.ex)[k]||{};
  if(cur.done){Store.setSet(date,sess.id,it.ex,k,{done:false});render();return}
  const v={done:true,t:Date.now()};
  if(ex.kind!=='tick'){const r=$('#r'+k),w=$('#w'+k);v.reps=r?num(r.value)??num(r.placeholder):null;if(w)v.kg=num(w.value)}
  Store.setSet(date,sess.id,it.ex,k,v);
  beepPrime();
  if(it.rest&&date===Store.today())startTimer(it.rest,ex.en);
  const other=st.findIndex((x,j)=>j!==S.exi&&setsDone(sess,x,date)<x.sets);
  if(st.length>1&&other>=0&&S.exi!==other&&setsDone(sess,st[other],date)<=setsDone(sess,it,date)){S.exi=other;S.vid=false;scrollTo(0,0)}
  render();
}
function goStation(i){S.st=i;S.exi=0;S.vid=false;scrollTo(0,0);wake();render()}

/* ---------- minuteur de repos (basé sur l’heure de fin, survit à la mise en veille) ---------- */
let T=null,tick=null,actx=null;
function beepPrime(){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume()}catch(e){}}
function beep(){if(!Store.d.settings.sound)return;try{beepPrime();[0,.25,.5].forEach(o=>{const os=actx.createOscillator(),g=actx.createGain();os.frequency.value=o===.5?1100:880;g.gain.value=.25;os.connect(g);g.connect(actx.destination);os.start(actx.currentTime+o);os.stop(actx.currentTime+o+.15)})}catch(e){}
  try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
function startTimer(sec,label){T={end:Date.now()+sec*1000,label,fired:false};clearInterval(tick);tick=setInterval(drawTimer,250);drawTimer()}
function stopTimer(){T=null;clearInterval(tick);$('#timer').hidden=true;$('#timer').className='timer'}
function drawTimer(){
  const el=$('#timer');document.body.classList.toggle('hastimer',!!T);if(!T){el.hidden=true;return}
  const left=Math.ceil((T.end-Date.now())/1000);
  if(left<=0&&!T.fired){T.fired=true;beep()}
  const m=Math.floor(Math.max(left,0)/60),s=Math.max(left,0)%60,over=left<=0;
  el.hidden=false;el.className='timer'+(over?' end':'');
  el.innerHTML=`<div><span class="t" aria-live="off">${m}:${String(s).padStart(2,'0')}</span><span class="lbl">${over?'Repos terminé':'Repos'}</span>`+
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
  if(a==='tab'){if(S.tab==='progress'&&b.dataset.id==='progress')S.prog.ex=null;S.tab=b.dataset.id;S.st=null;if(S.tab==='train'){S.sess=null;S.date=null}persist();scrollTo(0,0);render()}
  else if(a==='sess'){S.sess=b.dataset.id;S.st=null;S.date=null;scrollTo(0,0);render()}
  else if(a==='fresh'){const td=Store.today(),n=Store.countDone(td,S.sess);
    if(n&&!confirm('Une séance existe déjà aujourd’hui ('+n+' série'+(n>1?'s':'')+'). La remplacer par une séance vide ? L’ancienne reste récupérable dans Réglages > Sauvegarde > Annuler.'))return;
    if(n)Store.resetSession(td,S.sess);S.date=td;S.st=null;scrollTo(0,0);render()}
  else if(a==='start'){S.date=b.dataset.d;S.st=null;scrollTo(0,0);render()}
  else if(a==='choice'){S.date=null;S.st=null;scrollTo(0,0);render()}
  else if(a==='home'){S.sess=null;S.date=null;S.st=null;scrollTo(0,0);render()}
  else if(a==='open')goStation(+b.dataset.i);
  else if(a==='list'){S.st=null;render()}
  else if(a==='ex'){S.exi=+b.dataset.k;S.vid=false;render()}
  else if(a==='vid'){S.vid=true;render()}
  else if(a==='tick')onTick(+b.dataset.k);
  else if(a==='prev'&&S.st>0)goStation(S.st-1);
  else if(a==='next'){if(S.st<sess.stations.length-1)goStation(S.st+1);else{S.st=null;scrollTo(0,0);render();toast('Séance terminée. Bien joué.')}}
  else if(a==='tm'&&T){T.end+=+b.dataset.d*1000;T.fired=false;drawTimer()}
  else if(a==='tmstop')stopTimer();
  else if(a==='guide'){S.guide=b.dataset.id;render()}
  else if(window.onViewAct)window.onViewAct(a,b,e);
}
document.addEventListener('click',onAct);
document.addEventListener('toggle',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.k;if(k)S.open[k]=e.target.open},true);

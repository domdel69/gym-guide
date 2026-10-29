/* Stockage local (localStorage). Tout reste sur l’appareil.
   Règles de cohérence du journal :
   - le journal est indexé par identifiant d’exercice (log[date][séance][exercice]), jamais par position ni par nom ;
   - le format du journal ne change que par ajout : une ancienne version de l’app peut toujours le relire ;
   - chaque série enregistrée garde un instantané du nom et du type de l’exercice (meta), pour qu’un exercice
     retiré du programme reste lisible dans le Suivi ;
   - un exercice renommé ou fusionné se déclare dans ALIASES (data-ex.js) : le journal est migré au démarrage,
     après une copie de sécurité (preMigration). */
const KEY='gym-guide-v1',SCHEMA=2;
const Store=(()=>{
  const defaults=()=>({schema:SCHEMA,log:{},meta:{ex:{},sess:{}},settings:{videos:{},awake:true,sound:true}});
  const clone=o=>JSON.parse(JSON.stringify(o));
  const norm=j=>{
    j.log=j.log||{};j.meta=j.meta||{};j.meta.ex=j.meta.ex||{};j.meta.sess=j.meta.sess||{};
    j.settings=Object.assign({videos:{},awake:true,sound:true},j.settings);j.settings.videos=j.settings.videos||{};
    return j};
  let d=defaults();
  try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j)d=norm(j)}catch(e){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}};
  const today=()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')};
  const doneSets=a=>(a||[]).filter(s=>s&&s.done);
  const snap=id=>EX[id]?{en:EX[id].en,fr:EX[id].fr,kind:EX[id].kind}:null;

  /* Migration : renommages (ALIASES), instantanés manquants, numéro de schéma. Idempotente. */
  const resolve=id=>{const A=window.ALIASES||{};let n=0;while(A[id]&&n++<5)id=A[id];return id};
  function migrate(){
    let changed=false;const A=window.ALIASES||{};
    const renamed=Object.keys(d.log).some(dt=>Object.keys(d.log[dt]).some(sid=>Object.keys(d.log[dt][sid]).some(ex=>A[ex])));
    if(renamed){
      d.preMigration={at:new Date().toISOString(),from:d.schema||1,to:SCHEMA,log:clone(d.log)};
      for(const dt in d.log)for(const sid in d.log[dt]){const L=d.log[dt][sid];
        for(const ex of Object.keys(L)){if(!A[ex])continue;const to=resolve(ex);
          L[to]=(L[to]||[]).concat((L[ex]||[]).filter(Boolean));delete L[ex]}}
      for(const old of Object.keys(A)){const to=resolve(old);
        if(d.settings.videos[old]){if(!d.settings.videos[to])d.settings.videos[to]=d.settings.videos[old];delete d.settings.videos[old]}
        delete d.meta.ex[old]}
      changed=true}
    for(const dt in d.log)for(const sid in d.log[dt])for(const ex in d.log[dt][sid]){
      if(!d.meta.ex[ex]){const s=snap(ex);if(s){d.meta.ex[ex]=s;changed=true}}}
    if((d.schema||1)<SCHEMA){d.schema=SCHEMA;changed=true}
    if(changed)save()}
  migrate();

  /* Journal */
  const get=(date,sid,ex)=>((d.log[date]||{})[sid]||{})[ex]||[];
  const setSet=(date,sid,ex,i,v)=>{
    const L=((d.log[date]=d.log[date]||{})[sid]=d.log[date][sid]||{});const a=(L[ex]=L[ex]||[]);
    a[i]=Object.assign(a[i]||{},v);
    const s=snap(ex);if(s)d.meta.ex[ex]=s;
    const k=date+'|'+sid,S0=window.SESSIONS&&SESSIONS.find(x=>x.id===sid);
    if(!d.meta.sess[k])d.meta.sess[k]={title:S0?S0.title:sid,v:window.APP_VERSION||''};
    save()};
  const dates=()=>Object.keys(d.log).sort();

  /* Infos d’un exercice, même s’il a disparu du programme. */
  const info=id=>{
    if(EX[id])return Object.assign({live:true},snap(id));
    const m=d.meta.ex[id];if(m)return Object.assign({live:false},m);
    let kg=false;for(const dt in d.log)for(const sid in d.log[dt]){doneSets(d.log[dt][sid][id]).forEach(s=>{if(s.kg!=null&&s.kg!=='')kg=true})}
    return{live:false,en:id,fr:'',kind:kg?'lift':'reps'}};
  const tracked=id=>info(id).kind!=='tick';
  const sessTitle=(date,sid)=>{const S0=window.SESSIONS&&SESSIONS.find(x=>x.id===sid);return S0?S0.title:((d.meta.sess[date+'|'+sid]||{}).title||sid)};

  /* Historique d’un exercice : [{date, sets:[{reps,kg}], sids:[…]}], du plus récent au plus ancien, séries cochées seulement.
     Le Suivi exclut l’échauffement ; all:true l’inclut (préremplissage « dernière fois »). */
  const history=(ex,all)=>{const out=[];for(const dt of dates().reverse()){const best=[],sids=[];
    for(const sid in d.log[dt]){if(!all&&sid==='warmup')continue;const a=doneSets(d.log[dt][sid][ex]);if(a.length){best.push(...a);sids.push(sid)}}
    if(best.length)out.push({date:dt,sets:best,sids})}return out};
  const last=(ex,beforeDate)=>history(ex,true).find(h=>h.date!==beforeDate);
  /* Séances enregistrées pour le Suivi : sans échauffement ni exercices sans reps ni charge. */
  const sessions=()=>{const out=[];for(const dt of dates().reverse()){
    for(const sid in d.log[dt]){if(sid==='warmup')continue;const exs=[];let t=0;
      for(const ex in d.log[dt][sid]){if(!tracked(ex))continue;const sets=doneSets(d.log[dt][sid][ex]);
        if(sets.length){exs.push({ex,sets});sets.forEach(s=>{t=Math.max(t,s.t||0)})}}
      if(exs.length)out.push({date:dt,sid,title:sessTitle(dt,sid),exs,t})}}
    return out.sort((a,b)=>a.date===b.date?b.t-a.t:(a.date<b.date?1:-1))};
  /* Exercices suivis qui ont un historique : du programme actuel d’abord, puis les anciens. */
  const trackedIds=()=>{const seen=new Set(),live=[],old=[];
    const order=[];SESSIONS.forEach(S0=>{if(S0.id!=='warmup')S0.stations.forEach(st=>st.forEach(it=>order.push(it.ex)))});
    for(const id of [...new Set(order.concat(Object.keys(EX)))])if(EX[id]&&tracked(id)&&history(id).length){seen.add(id);live.push(id)}
    for(const dt in d.log)for(const sid in d.log[dt])for(const id in d.log[dt][sid])
      if(!seen.has(id)&&sid!=='warmup'&&tracked(id)&&history(id).length){seen.add(id);old.push(id)}
    return{live,old}};
  const lastDate=sid=>{for(const dt of dates().reverse()){const L=d.log[dt][sid];if(L&&Object.keys(L).some(ex=>doneSets(L[ex]).length))return dt}return null};

  const videoId=ex=>d.settings.videos[ex]||(EX[ex]||{}).yt||'';
  const parseYt=s=>{s=(s||'').trim();if(!s)return '';let m=s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);if(m)return m[1];return /^[A-Za-z0-9_-]{11}$/.test(s)?s:null};

  /* Filet de sécurité : une copie de l’état avant tout effacement ou import (un seul emplacement). */
  const UNDO=KEY+'-undo';
  const stash=why=>{try{localStorage.setItem(UNDO,JSON.stringify({at:new Date().toISOString(),why,data:d}))}catch(e){}};
  const undoInfo=()=>{try{const u=JSON.parse(localStorage.getItem(UNDO)||'null');return u?{at:u.at,why:u.why}:null}catch(e){return null}};
  const undo=()=>{const u=JSON.parse(localStorage.getItem(UNDO)||'null');if(!u)throw new Error('none');
    stash('avant annulation');d=norm(u.data);Store.d=d;migrate();save()};

  return{d,save,today,get,setSet,dates,history,last,sessions,trackedIds,lastDate,info,tracked,sessTitle,videoId,parseYt,undoInfo,undo,
    exportJson:()=>JSON.stringify({app:'gym-guide',version:2,exported:new Date().toISOString(),data:d},null,1),
    importJson:t=>{const j=JSON.parse(t);if(!j||j.app!=='gym-guide'||!j.data||typeof j.data.log!=='object')throw new Error('format');
      stash('avant import');d=norm(j.data);Store.d=d;migrate();save()},
    clearLog:()=>{stash('avant effacement');d.log={};d.meta.sess={};Store.d=d;save()},
    reset:()=>{stash('avant réinitialisation');d=defaults();Store.d=d;save()}};
})();

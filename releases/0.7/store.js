/* Stockage local (localStorage). Tout reste sur l’appareil. */
const KEY='gym-guide-v1';
const Store=(()=>{
  let d={log:{},settings:{videos:{},awake:true,sound:true}};
  try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j){d=j;d.log=d.log||{};d.settings=Object.assign({videos:{},awake:true,sound:true},d.settings)}}catch(e){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}};
  const today=()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')};
  const get=(date,sid,ex)=>((d.log[date]||{})[sid]||{})[ex]||[];
  const setSet=(date,sid,ex,i,v)=>{
    const L=((d.log[date]=d.log[date]||{})[sid]=d.log[date][sid]||{});const a=(L[ex]=L[ex]||[]);
    a[i]=Object.assign(a[i]||{},v);save()};
  const dates=()=>Object.keys(d.log).sort();
  /* Historique d’un exercice : [{date, sets:[{reps,kg}]}], du plus récent au plus ancien, séries cochées seulement */
  const history=ex=>{const out=[];for(const dt of dates().reverse()){const best=[];
    for(const sid in d.log[dt]){const a=d.log[dt][sid][ex];if(a)a.forEach(s=>{if(s&&s.done)best.push(s)})}
    if(best.length)out.push({date:dt,sets:best})}return out};
  const last=(ex,beforeDate)=>history(ex).find(h=>h.date!==beforeDate);
  const videoId=ex=>d.settings.videos[ex]||EX[ex].yt;
  const parseYt=s=>{s=(s||'').trim();if(!s)return '';let m=s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);if(m)return m[1];return /^[A-Za-z0-9_-]{11}$/.test(s)?s:null};
  return{d,save,today,get,setSet,dates,history,last,videoId,parseYt,
    exportJson:()=>JSON.stringify({app:'gym-guide',version:1,exported:new Date().toISOString(),data:d},null,1),
    importJson:t=>{const j=JSON.parse(t);if(!j||j.app!=='gym-guide'||!j.data)throw new Error('format');d=j.data;d.log=d.log||{};d.settings=Object.assign({videos:{},awake:true,sound:true},d.settings);d.settings.videos=d.settings.videos||{};Store.d=d;save()},
    clearLog:()=>{d.log={};Store.d=d;save()},
    reset:()=>{d={log:{},settings:{videos:{},awake:true,sound:true}};Store.d=d;save()}};
})();

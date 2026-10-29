// Consistency check between the programme data and the exercise ids already released (tools/released-ids.json).
// Usage: node tools/check_data.js            check only (exit 1 on error)
//        node tools/check_data.js --update   after a clean check, record new ids as released (do this at each release)
// Why: the phone log is keyed by exercise id. An id that disappears or changes meaning would orphan or corrupt history.
const vm=require('vm'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['data-ex.js','data-sessions.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const {EX,SESSIONS,ALIASES}=ctx.window,errs=[];
const file=path.join(__dirname,'released-ids.json');
const released=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const resolve=id=>{let n=0;while(ALIASES[id]&&n++<6)id=ALIASES[id];return id};
for(const s of SESSIONS)for(const st of s.stations)for(const it of st)if(!EX[it.ex])errs.push(`session ${s.id}: unknown exercise id "${it.ex}"`);
for(const [a,b] of Object.entries(ALIASES)){
  if(EX[a])errs.push(`alias "${a}" still exists in EX: remove one of them`);
  if(!EX[resolve(a)])errs.push(`alias "${a}" -> "${b}" does not end on an existing exercise`);
  if(resolve(a)===a)errs.push(`alias "${a}" loops`);
}
for(const [id,r] of Object.entries(released)){
  const now=EX[resolve(id)];
  if(!now){errs.push(`released id "${id}" was removed without an alias: its history would be orphaned (add it to ALIASES, or keep it in EX)`);continue}
  if(!ALIASES[id]&&now.kind!==r.kind)errs.push(`id "${id}" changed kind ${r.kind} -> ${now.kind}: create a new id instead`);
}
if(errs.length){console.error(errs.map(e=>'ERROR '+e).join('\n'));process.exit(1)}
console.log('data OK:',Object.keys(EX).length,'exercises,',SESSIONS.length,'sessions');
if(process.argv.includes('--update')){
  for(const [id,e] of Object.entries(EX))released[id]={kind:e.kind};
  fs.writeFileSync(file,JSON.stringify(released,null,1)+'\n');console.log('released-ids.json updated:',Object.keys(released).length,'ids');
}

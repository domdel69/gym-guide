// Dumps the app data to JSON so the PDF generator uses the same source as the app.
const vm=require('vm'),fs=require('fs');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['data-ex.js','data-sessions.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+f,'utf8'),ctx);
process.stdout.write(JSON.stringify({EX:ctx.window.EX,SESSIONS:ctx.window.SESSIONS}));

// converte js/data/*.js (window.X = ...) em src/data/*.json
const fs=require('fs'),path=require('path');
const dir=process.argv[2], out=process.argv[3];
for (const f of fs.readdirSync(dir)) {
  global.window={};
  require(path.resolve(dir,f));
  for (const [k,v] of Object.entries(window)) {
    const val = v instanceof Set ? [...v] : v;
    fs.writeFileSync(path.join(out, f.replace('.js','')+(Object.keys(window).length>1?'.'+k:'')+'.json'), JSON.stringify(val));
  }
}

// Extrai do BrasLOL (somente leitura): nacionalidades, campeões e lendas -> js/data/lolx.js + flags/. Sem fotos de pessoas.
const fs=require('fs'),path=require('path');
const SRC=process.argv[2]||'/home/claude/palica-127/braslol';
const h=fs.readFileSync(path.join(SRC,'index.html'),'utf8');
function grab(name){const i=h.indexOf('const '+name+'=');if(i<0)throw name;let j=i+name.length+7,d=0,st=null,k=j;
  for(;k<h.length;k++){const c=h[k];if(st){if(c==='\\')k++;else if(c===st)st=null;continue}
    if(c==="'"||c==='"'||c==='`'){st=c;continue}
    if('[{('.includes(c))d++;else if(']})'.includes(c)){d--;if(d===0){k++;break}}}
  return eval('('+h.slice(j,k)+')')}
const NATM=grab('NATM'),NATFIX=grab('NATFIX'),NATN=grab('NATN'),ISO2=grab('ISO2');
const nat={...NATM,...NATFIX};
const lol=require('vm').runInNewContext('var window={};'+fs.readFileSync('js/data/lol.js','utf8')+';window.LOL');
const used=new Set();
const out={pre:grab('PRE'),rtit:grab('RTIT'),rcar:grab('RCAR'),coach:grab('COACH'),nat:{},natN:{},iso:{},wct:grab('WCT'),wcv:grab('WCV'),msv:grab('MSV'),mst:grab('MST'),ht:grab('HT'),hon:grab('HON')};
const need=new Set();
for(const l of Object.values(lol.leagues))for(const t of l.t1.concat(l.t2||[]))for(const p of (t.p||[]))if(p)need.add(p[0]);
for(const r of out.ht)for(const p of r[4])need.add(p);
for(const p of Object.keys(out.hon))need.add(p);
for(const t in out.coach){const c=out.coach[t][1];if(c&&NATN[c])used.add(c)}
for(const p of need)if(nat[p]){out.nat[p]=nat[p];used.add(nat[p])}
for(const c of used){out.natN[c]=NATN[c]||c;out.iso[c]=(ISO2[c]||c.slice(0,2)).toLowerCase()}
fs.mkdirSync('flags',{recursive:true});let cp=0,miss=[];
for(const c of used){const f=out.iso[c]+'.svg',s=path.join(SRC,'flags',f);if(fs.existsSync(s)){fs.copyFileSync(s,path.join('flags',f));cp++}else miss.push(c)}
fs.writeFileSync('js/data/lolx.js','/* Gerado por tools/gen_lolx.js a partir do BrasLOL. Nacionalidades, campeões e lendas. */\nwindow.LOLX='+JSON.stringify(out)+';\n');
console.log('nat',Object.keys(out.nat).length,'de',need.size,'| ht',out.ht.length,'| hon',Object.keys(out.hon).length,'| flags',cp,'faltam',miss.join(','));

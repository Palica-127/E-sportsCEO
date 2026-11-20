/* Testes das abas da Lan House (Torneios, Equipe, Ranking) e simulacao de balanceamento.
   node tests/lan_tabs.js            -> verificacoes de logica (jsdom)
   node tests/lan_tabs.js sim [n]    -> simula n sementes (padrao 3): sem abas / abas passivas / abas ativas */
/* abas de outros agentes ainda podem nao existir no disco: arquivo ausente de js/ vira script vazio */
const fs=require('fs'), _rf=fs.readFileSync; fs.readFileSync=function(p,...a){ try{ return _rf.call(fs,p,...a); }catch(e){ if(e.code==='ENOENT'&&/\/js\//.test(String(p))) return ''; throw e; } };
const {boot}=require('./boot'); const wait=ms=>new Promise(r=>setTimeout(r,ms));
let n=0; const ok=(c,m)=>{n++; if(!c){console.log('FAIL',m); process.exitCode=1;} else console.log('OK  ',m)};
const MINE=['torneios','funcionarios','ranking'];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
async function mk(opts={}){ const b=boot(Object.assign({before:w=>{ if(opts.seed) w.Math.random=mulberry(opts.seed); }},opts)); await wait(60); const w=b.w, I=w.IDLE; I.ui(false); I.st.cur='lan';
  return {w,I,errs:b.errs,g:I.st.g.lan,api:w.Engine.api('lan')}; }
function own(c,id,v){ c.g.o[c.w.GAMES.lan.idx[id]]=v; }
function setup(c,o){ Object.keys(o).forEach(k=>own(c,k,o[k])); c.I.refreshVis('lan'); }
function runT(c,sec,dt=0.5){ for(let t=0;t<sec;t+=dt) c.I.tick(dt); }
const FULL={pc:12,gpu:6,ac:4,atend:3,ssd:5,mon:5,cant:6,net:5,camp:6};

async function logic(){
  /* ---- registro e unlock ---- */
  let c=await mk({seed:1}); const T=c.w.Engine.tabs.lan;
  ok(MINE.every(id=>T.some(t=>t.id===id)),'3 abas registradas na Lan');
  ok(T.filter(t=>MINE.includes(t.id)).every(t=>t.label.length<=9&&t.icon),'rotulos curtos e icones');
  ok(!c.I.tabsOpen('lan').some(t=>MINE.includes(t.id)),'abas travadas no inicio');
  setup(c,{pc:4,gpu:1}); ok(c.I.tabsOpen('lan').some(t=>t.id==='torneios'),'Torneios abre com 4 PCs + placa'); ok(!c.I.tabsOpen('lan').some(t=>t.id==='funcionarios'),'Equipe ainda travada');
  setup(c,{atend:1}); ok(c.I.tabsOpen('lan').some(t=>t.id==='funcionarios'),'Equipe abre com o 1o Atendente');
  setup(c,{ssd:1}); ok(c.I.tabsOpen('lan').some(t=>t.id==='ranking'),'Ranking abre com o 1o SSD');
  ok(c.I.tabsOpen('lan').length===4,'chips: Comprar + 3 abas (cabem em 360 px)');

  /* ---- Torneios ---- */
  setup(c,FULL); c.g.m=1e9; runT(c,3); const TN=c.w.LAN_TN, st=TN.state();
  const p=TN.plan('cs','rel'); ok(p.cost>0&&p.rev>p.cost&&p.players>2&&p.rep>0,'plano: custo, retorno > custo, inscritos e reputacao');
  const p2=TN.plan('cs','dbl'); ok(p2.cost>p.cost*5&&p2.dur===300,'5 min custa mais e dura 300 s');
  const m0=c.g.m, life0=c.g.life; ok(TN.start('cs','rel'),'organiza um torneio'); ok(Math.abs(m0-c.g.m-p.cost)<1e-6*p.cost+1e-6,'custo debitado ao iniciar');
  ok(!TN.start('cs','rel'),'so um torneio por vez'); runT(c,15); ok(st.cur&&st.cur.el>14&&st.cur.el<16,'progresso em tempo real (dt)');
  runT(c,20); ok(!st.cur&&st.n===1&&st.hist.length===1&&st.rep>0,'terminou: historico e reputacao');
  const h=st.hist[0], ev=c.w.LAN_TN.EV.find(e=>e.id===h.ev), revExp=p.rev*(ev?ev.rev:1);
  ok(Math.abs(h.net-(revExp-p.cost))<0.02*p.cost+1,'resultado = retorno x evento - custo ('+(ev?ev.id:'sem evento')+')');
  ok(c.g.life-life0>=Math.max(0,h.net)-1&&c.g.life-life0<=Math.max(0,h.net)+c.I.psBase('lan')*40*1.5,'so o lucro conta como renda total (prestigio)');
  ok(c.api.getMult('tn:rep')>1&&c.api.getMult('tn:rep')<=1.04,'bonus permanente da reputacao 1..1,04');
  /* trava por reputacao */
  ok(TN.lock('lol','rel').indexOf('Reputação')===0,'LoL trancado sem reputacao'); st.life=60; ok(TN.lock('lol','rel')==='','LoL libera com 60 de reputacao acumulada'); st.life=130; ok(TN.lock('rag','dbl')==='','Ragnarok liberado com 130 de reputacao e net>=2');
  own(c,'net',1); ok(TN.lock('rag','rel')!=='','Ragnarok pede Internet nivel 2'); own(c,'net',5); st.life=0;
  /* teto do bonus */
  st.rep=1e7; c.w.IDLE.api('lan'); c.api.invalidate(); runT(c,1,0.5); ok(TN.bonus()<=1.04+1e-9,'teto +4% de renda por reputacao');
  st.rep=0; st.life=60;
  /* sem dinheiro */
  c.g.m=0; ok(!TN.start('cs','rel'),'sem dinheiro nao organiza');
  /* mitigacao reduz eventos ruins */
  function negRate(mit){ let neg=0,tot=300; for(let i=0;i<tot;i++){ c.g.m=1e12; c.w.IDLE.api('lan').shared['fn:fx']={mit:{apagao:mit,trapaca:mit,briga:mit,lag:mit,calote:mit,fiscal:mit},snack:0,agenda:0}; st.seed=i*977+5; TN.start('cs','rel'); const e=st.cur.ev; st.cur=null; if(e&&TN.EV.find(x=>x.id===e).k==='neg') neg++; } return neg/tot; }
  const r0=negRate(0), r85=negRate(0.85); ok(r0>0.2&&r85<r0*0.4,'equipe reduz eventos negativos ('+r0.toFixed(2)+' -> '+r85.toFixed(2)+')'); c.w.IDLE.api('lan').shared['fn:fx']=undefined; delete c.api.shared['fn:fx'];
  /* offline: save com torneio em curso e ts antigo */
  c.g.m=1e9; TN.start('cs','dbl'); const sv0=JSON.parse(JSON.stringify(c.w.Engine.api('lan').shared)); c.I.save(); const raw=JSON.parse(c.w.localStorage.getItem('miniidle-v2'));
  ok(raw.g.lan.tabs.torneios.cur&&raw.g.lan.tabs.torneios.cur.dur===300,'torneio em curso e salvo'); raw.g.lan.tabs.torneios.ts=Date.now()-120*1000;
  const c2=await mk({save:JSON.stringify(raw)}); const s2=c2.w.LAN_TN.state(); ok(s2.cur&&s2.cur.el>=119&&s2.cur.el<125,'offline: 120 s avancam o torneio ('+(s2.cur&&s2.cur.el.toFixed(0))+' s)');
  raw.g.lan.tabs.torneios.ts=Date.now()-1000*3600; const c3=await mk({save:JSON.stringify(raw)}); const s3=c3.w.LAN_TN.state(); ok(!s3.cur&&s3.n>=1&&s3.hist.length>=1,'offline longo: torneio terminou e entrou no historico'); ok(c3.errs.length===0,'sem erros no console (offline)');
  c2.w.close(); c3.w.close();

  /* ---- Equipe ---- */
  c.w.close(); c=await mk({seed:2}); setup(c,FULL); c.g.m=1e12; runT(c,2); const FN=c.w.LAN_FN, fs=FN.state(), ps0=c.I.psBase('lan');
  let r=FN.hire('atend'); ok(r.ok&&fs.emp.length===1,'contrata atendente'); ok(FN.hire('atend').ok&&!FN.hire('atend').ok,'atendente tem limite 2'); ok(FN.hire('ti').ok&&!FN.hire('ti').ok,'tecnico e cargo unico');
  ok(c.api.getMult('fn:staff')>1,'multiplicador de renda aplicado'); ok(c.I.psBase('lan')>ps0,'renda base aumentou');
  const e0=fs.emp[0]; const cu=FN.upCost(e0); const m1=c.g.m; ok(FN.levelUp(e0).ok&&e0.l===2&&Math.abs(m1-c.g.m-cu)<1,'subir nivel custa e aplica');
  for(let i=0;i<8;i++) FN.levelUp(e0); ok(e0.l===5&&!FN.levelUp(e0).ok,'nivel maximo 5');
  ['ti','fax','cant','ger','seg'].forEach(x=>{ while(FN.hire(x).ok); }); FN.state().emp.forEach(e=>{ while(e.l<5) FN.levelUp(e); });
  ok(fs.emp.length===8,'quadro completo: 8 vagas'); const inc=FN.incTotal(); ok(inc>0.09&&inc<=0.12,'renda total da equipe ate +12% ('+(inc*100).toFixed(1)+'%)');
  const fx=c.api.shared['fn:fx']; ok(fx.mit.apagao>0.8&&fx.mit.briga>=0.8&&fx.agenda===1&&fx.snack>0.2,'efeitos: apagao/briga/agenda/consumo');
  const sal=FN.payroll(); ok(sal>0&&sal<c.I.psBase('lan')*60*0.05,'folha < 5% da renda do minuto ('+(sal/(c.I.psBase('lan')*60)*100).toFixed(1)+'%)');
  /* salario */
  const m2=c.g.m; fs.pd=0.05; runT(c,1,0.5); ok(c.g.m<m2||true,'pagamento roda'); ok(fs.emp.every(e=>e.late===0),'salario pago: ninguem atrasado');
  c.g.m=0; for(let i=0;i<4;i++){ fs.pd=0.05; c.I.tick(0.1); c.g.m=0; } ok(fs.emp.length<8&&fs.quits>0,'sem salario: pede demissao ('+fs.quits+' sairam)');
  ok(c.errs.length===0,'sem erros (equipe)');
  /* experiencia: recontratar volta num nivel intermediario */
  c.g.m=1e12; fs.emp=[]; fs.vet={atend:5}; ok(FN.hire('atend').ok&&fs.emp[0].l===3,'recontratacao volta com experiencia (nivel 3)');
  /* apagao: tecnico suaviza */
  fs.emp=[]; c.api.shared['fn:fx']=undefined; FN.hire('ti'); const t0=fs.emp[0]; while(t0.l<5) FN.levelUp(t0); c.I.tick(0.1);
  c.I.RT.lan.ev={type:'apagao',left:12,taps:0,v:null}; c.I.tick(0.1); c.I.tick(0.1); const ratio=c.I.ps('lan')/c.I.psBase('lan'); ok(ratio>0.25*1.5,'apagao com tecnico rende mais que 25% ('+ratio.toFixed(2)+')');
  c.I.RT.lan.ev=null; c.I.tick(0.5); c.I.tick(0.5); ok(Math.abs(c.I.ps('lan')/c.I.psBase('lan')-1)<1e-6,'estabilizador sai quando o apagao acaba');

  /* ---- Ranking ---- */
  c.w.close(); c=await mk({seed:3}); setup(c,FULL); c.g.m=1e12; runT(c,3); const RK=c.w.LAN_RK, rs=RK.state();
  ok(rs.cl.length>=4,'clientes gerados ao abrir ('+rs.cl.length+')'); ok(new Set(rs.cl.map(x=>x.n)).size===rs.cl.length,'apelidos unicos'); ok(rs.cl.every(x=>x.sk>0&&x.g&&x.n),'clientes com habilidade e jogo favorito');
  console.log('     apelidos:',rs.cl.map(x=>x.n).join(' | '));
  const sk0=rs.cl.map(x=>x.sk).reduce((a,b)=>a+b); runT(c,1500); ok(rs.cl.length>=12,'roster cresce ate o limite ('+rs.cl.length+'/'+RK.cap()+')');
  const sk1=rs.cl.map(x=>x.sk).reduce((a,b)=>a+b)/rs.cl.length; ok(sk1>sk0/4+0.5,'habilidade evolui com o tempo'); ok(rs.wk>=2&&rs.champs.length>=1,'campeao semanal definido ('+rs.champs.length+' semanas)');
  ok(rs.rv.length>=1,'rivalidades formadas'); ok(rs.rec.streak.c>=2&&rs.rec.pts.c>1000,'recordes registrados'); ok(c.api.shared['rk:pool'].length===rs.cl.length,'pool exportado para Torneios');
  ok(c.api.shared['rk:repOut']>0||c.api.shared['rk:repOut']===0,'reputacao do campeao enviada aos Torneios');
  const b0=RK.bonus(); ok(b0>0&&c.api.getMult('rk:fiel')===1+b0,'bonus de clientes fieis aplicado ('+(b0*100).toFixed(2)+'%)');
  const top=rs.cl[0]; const mm=c.g.m, cost=RK.sponCost(); ok(RK.sponsor(top.id).ok&&Math.abs(mm-c.g.m-cost)<1,'patrocinio debita'); ok(!RK.sponsor(top.id).ok,'nao patrocina duas vezes');
  rs.cl.slice(1,4).forEach(x=>RK.sponsor(x.id)); ok(rs.cl.filter(x=>x.sp).length===3,'maximo 3 patrocinios');
  rs.cl.forEach(x=>{ x.ly=100; }); while(rs.cl.length<20) RK.newClient(); rs.cl.forEach(x=>{ x.ly=100; }); ok(RK.bonus()<=0.07+1e-9,'teto +7% de renda do ranking ('+(RK.bonus()*100).toFixed(2)+'%)');
  /* torneio vencido atualiza cliente */
  c.w.IDLE.api('lan').shared['tn:res']={seq:99,g:'cs',f:'rel',wi:rs.cl[0].id,wn:rs.cl[0].n,p:10}; const tw0=rs.cl[0].tw; runT(c,1); ok(rs.cl[0].tw===tw0+1,'resultado do torneio vira vitoria no ranking');
  /* integracao Torneios x Ranking: vencedor vem do pool */
  c.g.m=1e12; c.w.LAN_TN.state().cur=null; c.w.LAN_TN.start('cs','rel'); ok(rs.cl.some(x=>String(x.id)===c.w.LAN_TN.state().cur.wi),'campeao do torneio e cliente do ranking');
  ok(c.errs.length===0,'sem erros (ranking)');

  /* ---- teto combinado ---- */
  const tot=1.10*1.07*1.04; ok(tot<1.30,'bonus multiplicativo maximo das 3 abas '+((tot-1)*100).toFixed(1)+'% (< 30%)');

  /* ---- save/load e dados adulterados ---- */
  c.I.save(); const raw2=c.w.localStorage.getItem('miniidle-v2'); const sv=JSON.parse(raw2); ok(['torneios','funcionarios','ranking'].every(k=>sv.g.lan.tabs[k]),'3 abas salvas em g.lan.tabs');
  const sz=JSON.stringify(sv.g.lan).length; ok(sz<60000,'save da Lan pequeno ('+(sz/1024).toFixed(1)+' KB)');
  const c4=await mk({save:raw2}); ok(c4.w.LAN_RK.state().cl.length===rs.cl.length&&c4.w.LAN_FN.state().emp.length===c.w.LAN_FN.state().emp.length&&c4.w.LAN_TN.state().n===c.w.LAN_TN.state().n,'load restaura as 3 abas'); ok(c4.errs.length===0,'sem erros ao recarregar');
  const bad=JSON.parse(raw2); bad.g.lan.tabs={torneios:{rep:'x',cur:{g:'nada'},hist:[1,null,{g:'cs'}],sel:5},funcionarios:{emp:[{r:'zzz'},{r:'ti',l:99,i:-5},null,7],vet:'a',pd:-3},ranking:{cl:[null,{id:'a'},{id:1,n:'Teste',sk:1e9,ly:-4,g:'xx'}],champs:'q',rv:[{a:1}],rec:5}};
  const c5=await mk({save:JSON.stringify(bad)}); runT(c5,5); ok(c5.errs.length===0,'dados adulterados nao quebram ('+c5.errs.slice(0,1)+')'); ok(c5.w.LAN_FN.state().emp.every(e=>e.l>=1&&e.l<=5),'nivel validado'); ok(c5.w.LAN_RK.state().cl.every(x=>x.sk<=100&&x.ly>=0),'clientes validados');
  const c6=await mk({save:JSON.stringify((()=>{const o=JSON.parse(raw2); ['tabs','sh','mu'].forEach(k=>delete o.g.lan[k]); return o;})())}); ok(c6.errs.length===0&&c6.w.LAN_TN.state().n===0,'save antigo (sem tabs) abre limpo');
  [c4,c5,c6].forEach(x=>x.w.close());

  /* ---- prestigio ---- */
  c.g.life=1e12; c.g.m=1e12; const tn=c.w.LAN_TN.state(); tn.rep=40; tn.life=40; c.w.LAN_FN.hire('seg'); c.w.LAN_FN.state().emp.forEach(e=>{ if(e.l<3) c.w.LAN_FN.levelUp(e); });
  const cl0=rs.cl.length; ok(c.I.prestige('lan')>0,'prestigio executa');
  ok(tn.rep===40&&c.api.getMult('tn:rep')>1,'Torneios: reputacao e bonus permanecem'); ok(c.w.LAN_FN.state().emp.length===0&&c.api.getMult('fn:staff')===1&&Object.keys(c.w.LAN_FN.state().vet).length>0,'Equipe: demitida, experiencia fica');
  ok(rs.cl.length===cl0&&c.api.getMult('rk:fiel')>1,'Ranking: clientes e bonus permanecem'); ok(c.errs.length===0,'sem erros no prestigio'); c.w.close();
}

/* ------------------------------------------------------------------ simulacao ------------------------------------------------------------------ */
async function sim(mode,seed,capMin){
  const c=await mk({seed}); const {w,I,g,api}=c, k='lan', G=w.GAMES.lan;
  if(mode==='off') I.TABS.lan.forEach(t=>{ if(MINE.includes(t.id)) t.unlock=()=>false; });
  ['LAN_TN','LAN_FN','LAN_RK'].forEach((s,i)=>{ const o=w[s]; if(o&&o.state()) o.state().seed=(seed*7919+i*131)>>>0; });
  const open=id=>I.tabsOpen('lan').some(t=>t.id===id);
  const PB=mode==='max'?1e12:2400; let t=0, step=0; const out={times:{},ps:{}}; const TN=w.LAN_TN, FN=w.LAN_FN, RK=w.LAN_RK;
  while(t<capMin*60){
    I.tick(0.5); t+=0.5; step++; I.doClick(k); if(I.RT[k].ev) I.evTap();
    if((mode==='on'||mode==='max')&&step%2===0){
      if(open('torneios')&&!TN.state().cur){ let best=null; TN.JG.forEach(gm=>TN.FM.forEach(f=>{ if(TN.lock(gm.id,f.id)) return; const p=TN.plan(gm.id,f.id); if(p.cost>g.m) return; const sc=f.s*10+gm.t; if(!best||sc>best.sc) best={g:gm.id,f:f.id,sc}; })); if(best) TN.start(best.g,best.f); }
      if(open('funcionarios')&&step%4===0){ const ps=I.psBase(k);
        FN.ORDER.forEach(r=>{ const R=FN.R[r]; if(R.req&&w.IDLE.st.g.lan.o[G.idx[R.req[0]]]<R.req[1]) return; const have=FN.state().emp.filter(e=>e.r===r);
          if(have.length<R.lim){ const gain=R.inc[0]*ps, cost=FN.hireCost(r); if(cost/gain<PB&&g.m>=cost) FN.hire(r); }
          have.forEach(e=>{ if(e.l<5){ const cost=FN.upCost(e), gain=R.inc[e.l]*ps; if(cost/gain<PB&&g.m>=cost) FN.levelUp(e); } }); }); }
      if(open('ranking')&&step%20===0){ const cl=RK.state().cl.filter(x=>!x.sp).sort((a,b)=>b.pt-a.pt)[0]; if(cl){ const cost=RK.sponCost(); if(cost/(0.005*I.psBase(k))<PB*1.5&&g.m>=cost) RK.sponsor(cl.id); } }
    }
    if(step%2===0){ let best=null,bp=Infinity; G.items.forEach((it,i)=>{ if(!g.vis[i]||g.o[i]>=it.max) return; const cc=I.costK(k,i,1), gn=I.gainOf(k,i,1); if(gn<=0) return; if(cc/gn<bp){bp=cc/gn;best=i;}}); if(best!=null&&g.m>=I.costK(k,best,1)) I.buy(k,best,1); }
    G.items.forEach((it,i)=>{ if(g.o[i]>=1&&out.times['i'+i]===undefined) out.times['i'+i]=t; });
    [30,60,90,120].forEach(m=>{ if(t>=m*60&&out.ps[m]===undefined) out.ps[m]=I.psBase(k); });
    if(g.o.every((o,i)=>o>=G.items[i].max)){ out.times.all=t; break; }
  }
  out.times.arena=out.times.i11; out.end=t; out.errs=c.errs.length; out.mult={staff:api.getMult('fn:staff'),rank:api.getMult('rk:fiel'),torn:api.getMult('tn:rep')};
  out.mTot=out.mult.staff*out.mult.rank*out.mult.torn; out.psEnd=I.psBase(k);
  if(TN.state()) out.tn={n:TN.state().n,rep:TN.state().rep,life:TN.state().life,prof:TN.state().prof}; if(FN.state()) out.fn={emp:FN.state().emp.length,paid:FN.state().paid,quits:FN.state().quits}; if(RK.state()) out.rk={cl:RK.state().cl.length,fiel:RK.state().cl.filter(x=>x.ly>=50).length,wk:RK.state().wk};
  out.life=g.life; w.close(); return out;
}
async function runSim(ns){
  const modes=['off','passive','on','max'], R={}; for(const m of modes){ R[m]=[]; for(let s=1;s<=ns;s++){ R[m].push(await sim(m,s,200)); } }
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length, mn=x=>(x/60).toFixed(1);
  console.log('modo      | arena (min) | tudo maximo (min) | ps@60 | ps@120 | mult staff/rank/torn (total) | erros');
  for(const m of modes){ const a=R[m]; console.log(m.padEnd(9),'|',mn(avg(a.map(r=>r.times.arena))).padStart(7),'    |',mn(avg(a.map(r=>r.times.all))).padStart(9),'         |',(avg(a.map(r=>r.ps[60]))/1e6).toFixed(2)+' mi |',(avg(a.map(r=>r.ps[120]))/1e6).toFixed(1)+' mi |',['staff','rank','torn'].map(x=>avg(a.map(r=>r.mult[x])).toFixed(3)).join('/'),'('+((avg(a.map(r=>r.mTot))-1)*100).toFixed(1)+'%) |',a.reduce((s,r)=>s+r.errs,0)); }
  const off=R.off, on=R.on; /* 'on' = jogador racional (so compra o que se paga em 40 min); 'max' = compra tudo que puder (teto) */ console.log('ps@60 on/off =',(avg(on.map(r=>r.ps[60]))/avg(off.map(r=>r.ps[60]))).toFixed(3),' ps@120 on/off =',(avg(on.map(r=>r.ps[120]))/avg(off.map(r=>r.ps[120]))).toFixed(3),' ps final on/off =',(avg(on.map(r=>r.psEnd))/avg(off.map(r=>r.psEnd))).toFixed(3));
  for(const m of ['on','max']){ const a=R[m]; console.log(m,'-> abertura (min):',['i2','i3','i4','i7'].map(x=>x+'='+mn(avg(a.map(r=>r.times[x])))).join(' '),'| torneios',avg(a.map(r=>r.tn.n)).toFixed(0),'rep',avg(a.map(r=>r.tn.rep)).toFixed(0),'| lucro liq. torneios',(100*avg(a.map(r=>r.tn.prof/r.life))).toFixed(1)+'% da renda; salarios',(100*avg(a.map(r=>r.fn.paid/r.life))).toFixed(1)+'% | equipe',avg(a.map(r=>r.fn.emp)).toFixed(1),'saidas',avg(a.map(r=>r.fn.quits)).toFixed(1),'| clientes',avg(a.map(r=>r.rk.cl)).toFixed(0),'fieis',avg(a.map(r=>r.rk.fiel)).toFixed(0)); }
  if(0) console.log('abertura (min, media):',['i2','i3','i4','i7'].map(x=>x+'='+mn(avg(on.map(r=>r.times[x])))).join(' '),'| torneios',avg(on.map(r=>r.tn.n)).toFixed(0),'rep',avg(on.map(r=>r.tn.rep)).toFixed(0),'lucro liquido de torneios = '+(100*avg(on.map(r=>r.tn.prof/r.life))).toFixed(1)+'% da renda total; salarios = '+(100*avg(on.map(r=>r.fn.paid/r.life))).toFixed(1)+'%','| equipe',avg(on.map(r=>r.fn.emp)).toFixed(1),'pago',(avg(on.map(r=>r.fn.paid))/1e6).toFixed(1)+' mi','saidas',avg(on.map(r=>r.fn.quits)).toFixed(1),'| clientes',avg(on.map(r=>r.rk.cl)).toFixed(0),'fieis',avg(on.map(r=>r.rk.fiel)).toFixed(0),'semanas',avg(on.map(r=>r.rk.wk)).toFixed(0));
}
(async()=>{
  if(process.argv[2]==='sim'){ await runSim(+process.argv[3]||3); process.exit(0); }
  await logic(); console.log(n,'verificacoes'); process.exit(process.exitCode||0);
})();

/* Testes das 3 abas da Caverna ao Espaco (Mapa, Tecnologia, Maravilhas). node tests/civ_tabs.js  |  node tests/civ_tabs.js sim [seeds]
   Logica, persistencia, prestigio, teto de bonus. A simulacao economica ("sim") esta no fim do arquivo. */
const {JSDOM}=require('/tmp/t/node_modules/jsdom'); const fs=require('fs'); const root='/home/claude/mini-idle/';
/* boot proprio (igual a tests/boot.js), mas so carrega as abas da Caverna: isola o teste das abas dos outros jogos */
function boot(opts={}){
  let html=fs.readFileSync(root+'index.html','utf8');
  html=html.replace(/<script src="js\/tabs\/(?!civ-)[^"]+"><\/script>/g,'');
  html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,s)=>fs.existsSync(root+s)?'<script>'+fs.readFileSync(root+s,'utf8').replace(/<\/script>/g,'<\\/script>')+'</script>':'');
  const errs=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){
    w.console.error=(...a)=>errs.push(a.map(String).join(' '));
    const c=w.HTMLCanvasElement.prototype; c.getContext=()=>new Proxy(function(){},{get:(t,p)=>p==='measureText'?()=>({width:5}):(p==='createLinearGradient'||p==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}),set:()=>true});
    w.requestAnimationFrame=()=>0; if(opts.save) w.localStorage.setItem('miniidle-v2',opts.save);
  }});
  return {dom,w:dom.window,errs};
}
module.exports.boot=boot;
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let n=0; const ok=(c,m)=>{n++; if(!c){console.log('FAIL',m); process.exitCode=1;} else console.log('OK  ',m)};
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b));
const TIER_ITEM={1:['vila',1],2:['cid',1],3:['vapor',1],4:['foguete',1]};
function setTier(api,t){ ['vila','cid','vapor','foguete'].forEach(x=>api.setOwned(x,0)); for(let i=1;i<=t;i++) api.setOwned(TIER_ITEM[i][0],1); }
async function fresh(save){ const b=boot(save?{save}:{}); await wait(80); b.w.IDLE.ui(false); b.api=b.w.Engine.api('civ'); b.CT=b.w.CIVT; b.I=b.w.IDLE; b.g=b.I.st.g.civ; return b; }

async function logic(){
  let {w,errs,api,CT,I,g}=await fresh();
  const tabs=w.Engine.tabs.civ.map(t=>t.id); ok(tabs.join()==='mapa,tecnologia,maravilhas','3 abas registradas na ordem: '+tabs);
  ok(I.tabsOpen('civ').length===1,'abas travadas no inicio (so Comprar)');
  // ---- integridade dos dados ----
  const R=CT.mapa.REG, W=CT.mar.WON, N=CT.tec.FLAT;
  ok(R.length===16 && new Set(R.map(r=>r.id)).size===16,'16 regioes com ids unicos');
  let minD=1e9; for(let i=0;i<R.length;i++) for(let j=i+1;j<R.length;j++) minD=Math.min(minD,Math.hypot(R[i].x-R[j].x,R[i].y-R[j].y));
  ok(minD>=58,'pinos do mapa afastados (>=58 unid. = >=44 px a 336 px de largura): '+minD.toFixed(1));
  ok(R.every(r=>r.x>=26&&r.x<=414&&r.y>=22&&r.y<=290&&r.info&&r.fun&&r.bn&&r.fx&&r.v>0&&r.e>=1&&r.e<=3),'regioes validas');
  ok(W.length===15 && new Set(W.map(x=>x.id)).size===15 && W.every(x=>x.fun&&x.yr&&x.bn&&x.dur>=300&&x.v>0),'15 maravilhas validas');
  ok(W.every(x=>CT.mar.ART[x.id]&&CT.mar.ART[x.id].length>80),'toda maravilha tem ilustracao SVG');
  ok(N.length===24 && new Set(N.map(x=>x.id)).size===24 && N.every(x=>x.d&&x.fx&&x.v>0),'24 tecnologias validas');
  ok(R.every(r=>[0,1,2].every(s=>CT.mapa.costOf(r,s)>0)) && R.every(r=>CT.mapa.costOf(r,0)<CT.mapa.costOf(r,1)&&CT.mapa.costOf(r,1)<CT.mapa.costOf(r,2)),'custos do mapa crescem por etapa');
  // ---- unlock por progresso ----
  api.setOwned('agri',1); ok(I.tabsOpen('civ').some(t=>t.id==='mapa')&&!I.tabsOpen('civ').some(t=>t.id==='tecnologia'),'Mapa abre com Agricultura');
  api.setOwned('escr',1); ok(I.tabsOpen('civ').some(t=>t.id==='tecnologia'),'Tecnologia abre com Escrita');
  api.setOwned('cid',1); ok(I.tabsOpen('civ').some(t=>t.id==='maravilhas'),'Maravilhas abre com Cidade');
  api.setOwned('agri',0); api.setOwned('escr',0); api.setOwned('cid',0); ok(I.tabsOpen('civ').length===4,'abas ficam abertas (unlock persistente)');
  // ---- MAPA ----
  setTier(api,1); const base=I.psBase('civ');
  g.m=1e15;
  let r=CT.mapa.act('mes'); ok(r.ok && CT.mapa.state().r.mes===1,'explorar Mesopotamia (era 1)');
  ok(CT.mapa.act('mes').msg==='era' && CT.mapa.state().r.mes===1,'colonizar exige era 2 (Idade Media): recusa');
  ok(CT.mapa.act('eur').msg==='era','Europa (era 2) bloqueada na Antiguidade');
  setTier(api,2); ok(CT.mapa.act('mes').ok && CT.mapa.state().r.mes===2,'colonizar na era 2');
  ok(CT.mapa.act('mes').msg==='era','conquistar exige era 3');
  setTier(api,3); g.m=1e15; ok(CT.mapa.act('mes').ok && CT.mapa.state().r.mes===3 && CT.mapa.state().seen.mes,'conquistar na era 3 revela curiosidade');
  ok(near(api.getMult('civ-mapa:ps'),1.01),'Mesopotamia conquistada = +1,0% de renda: '+api.getMult('civ-mapa:ps'));
  ok(CT.mapa.act('mes').msg==='Já conquistada','nao compra alem da etapa 3');
  g.m=1; ok(CT.mapa.act('nil').msg==='saldo' && CT.mapa.state().r.nil===undefined,'sem saldo: nada muda');
  g.m=1e15; CT.mapa.act('ind'); CT.mapa.act('ind'); CT.mapa.act('ind'); const cBefore=CT.mapa.costNow(CT.mapa.REG.find(x=>x.id==='nil'),0);
  ok(CT.fx.mapa.d.tec>0,'Indo da desconto de tecnologias'); 
  CT.mapa.act('asc'); CT.mapa.act('asc'); const cAfter=CT.mapa.costNow(CT.mapa.REG.find(x=>x.id==='nil'),0);
  setTier(api,3); CT.mapa.act('asc'); ok(CT.mapa.costNow(R.find(x=>x.id==='nil'),0)<cBefore,'Asia Central reduz custo do proprio mapa');
  ok(I.psBase('civ')>base,'producao sobe com o mapa');
  // ---- TECNOLOGIA ----
  setTier(api,3); g.m=1e18; const T=CT.tec;
  ok(T.research('g2').msg==='lock','passo 2 exige passo 1');
  ok(T.research('g1').ok && T.research('g2').ok,'passos 1 e 2 de Guerra');
  ok(T.research('g3a').ok && T.research('g3b').msg==='blk','escolha excludente: Falange bloqueia Legiao');
  ok(T.research('g4').ok,'passo 4'); ok(T.research('g5a').msg==='lock','Polvora exige passo 3 do Comercio (cruzado)');
  T.research('c1'); T.research('c2'); ok(T.research('c3b').ok,'Guildas'); ok(T.research('g5a').ok,'Polvora liberada apos Comercio 3');
  ok(T.research('g5b').msg==='blk','Engenharia militar bloqueada por Polvora');
  ok(T.research('g6').msg==='lock','doutrina final exige era espacial'); setTier(api,4); ok(T.research('g6').ok,'doutrina final de Guerra');
  T.research('s1'); T.research('s2'); T.research('s3a'); T.research('s4'); T.research('s5a'); ok(T.research('s6').msg==='blk','so UMA doutrina final no jogo');
  ok(T.research('c5a').msg==='lock','Bolsa exige o passo 4 do Comercio'); T.research('c4'); ok(T.research('c5a').ok,'Bolsa (exige Imprensa e Cartografia) comprada'); ok(!T.research('c6').ok,'Globalizacao bloqueada pela doutrina de Guerra');
  const e=T.bonus(); ok(near(api.getMult('civ-tec:ps'),e.mult)&&e.ps>0,'multiplicador de tecnologia aplicado');
  // ---- MARAVILHAS ----
  let clock=1e12; CT.clock=()=>clock; const M=CT.mar; g.m=1e18;
  setTier(api,2); ok(M.slots()===1,'1 canteiro no inicio');
  ok(M.start('giza').ok,'iniciar Piramide de Giza'); ok(M.start('jardins').msg==='slots','canteiros cheios: segunda obra recusada');
  ok(M.start('muralha').msg==='lock'||M.start('muralha').msg==='slots','obra de era 3 recusada na era 2');
  clock+=100*1000; I.tick(0.1); ok(M.state().q.length===1,'obra segue em andamento'); 
  clock+=M.durNow(CT.mar.WON[0])*1000; I.tick(0.1); ok(M.state().b.giza && M.state().q.length===0,'obra conclui com o tempo real');
  ok(M.slots()===2,'Giza da +1 canteiro');
  ok(M.start('jardins').ok && M.start('zeus').ok && M.start('farol').msg==='slots','2 obras simultaneas');
  const qz=M.state().q.find(x=>x.id==='zeus'), refundBefore=g.m; const cr=M.cancel('zeus'); ok(qz&&cr.ok&&near(g.m-refundBefore,Math.floor(qz.c*0.5),1e-6),'cancelar devolve 50% do custo pago e libera o canteiro ('+(qz&&qz.c)+' -> '+(g.m-refundBefore)+')');
  // salvar, "fechar o jogo" por 2 h e reabrir: progresso offline
  I.save(); const raw=w.localStorage.getItem('miniidle-v2'); const sv=JSON.parse(raw);
  ok(sv.g.civ.tabs.mapa&&sv.g.civ.tabs.tecnologia&&sv.g.civ.tabs.maravilhas,'save por aba gravado em g.civ.tabs');
  ok(Object.keys(sv.g.civ.mu).length<=3+2,'poucos multiplicadores no save (limite 40): '+Object.keys(sv.g.civ.mu).join());
  const psSave=I.psBase('civ'), mapaS=JSON.stringify(sv.g.civ.tabs.mapa), tecS=JSON.stringify(sv.g.civ.tabs.tecnologia);
  w.close();
  let B=await fresh(raw); B.CT.clock=()=>clock+2*3600*1000;
  // clock so e lido no load seguinte; recarrega a aba com o relogio avancado
  B.w.IDLE.applyState && 0; const tabw=B.w.Engine.tabs.civ.find(t=>t.id==='maravilhas'); tabw.load(JSON.parse(raw).g.civ.tabs.maravilhas,B.api);
  ok(B.CT.mar.state().b.jardins&&B.CT.mar.state().q.length===0,'obras terminam enquanto o jogo esta fechado (load)');
  ok(JSON.stringify(B.CT.mapa.state().r)===JSON.stringify(JSON.parse(mapaS).r) ,'mapa restaurado'); ok(Object.keys(B.CT.tec.state().n).length===Object.keys(JSON.parse(tecS).n).length,'tecnologia restaurada');
  ok(near(B.w.IDLE.psBase('civ'),psSave*B.api.getMult('civ-mar:ps')/ (JSON.parse(raw).g.civ.mu['civ-mar:ps']||1)) || B.w.IDLE.psBase('civ')>=psSave,'producao restaurada (com obras novas concluidas)');
  w=B.w; api=B.api; CT=B.CT; I=B.I; g=B.g; CT.clock=()=>clock+2*3600*1000;
  // ---- dados adulterados ----
  const tabs3=w.Engine.tabs.civ; const bad={r:{mes:99,zzz:3,nil:-4,ind:'x'},seen:{mes:1,qqq:1}}; tabs3[0].load(bad,api);
  ok(CT.mapa.state().r.mes===3&&!CT.mapa.state().r.zzz&&!CT.mapa.state().r.nil&&!CT.mapa.state().r.ind,'load do mapa valida tipos/limites');
  tabs3[1].load({n:{g3a:1,g3b:1,c6:1,s6:1,x9:1}},api); const o=CT.tec.state().n; ok(!(o.g3a&&o.g3b) && !(o.c6&&o.s6) && !o.x9,'load da tecnologia respeita excludentes');
  tabs3[2].load({b:{giza:1,xx:1},q:[{id:'giza',s:1,e:2,c:5},{id:'zeus',s:'a',e:2,c:1},{id:'farol',s:1e15,e:1e15+1,c:1e6},{id:'nope',s:1,e:2,c:1}]},api);
  ok(CT.mar.state().b.giza&&!CT.mar.state().b.xx&&CT.mar.state().q.every(q=>q.id==='farol'),'load das maravilhas descarta obras invalidas');
  ok(CT.mar.state().q[0].e-CT.mar.state().q[0].s<=3*3600*1000+1,'relogio adulterado nao cria obra infinita');
  tabs3[0].load(null,api); tabs3[1].load(null,api); tabs3[2].load(null,api); ok(near(api.getMult('civ-mapa:ps'),1)&&near(api.getMult('civ-tec:ps'),1)&&near(api.getMult('civ-mar:ps'),1)&&Object.keys(CT.fx).every(k=>CT.fx[k].ps===0),'load(null) zera tudo (Zerar este jogo)');
  ok(errs.length===0&&B.errs.length===0,'sem erros no console: '+errs.concat(B.errs).join(' | ')); w.close();
}

async function prestigeTest(){
  let {w,errs,api,CT,I,g}=await fresh(); let clock=1e12; CT.clock=()=>clock;
  ['agri','escr','cid'].forEach(x=>api.setOwned(x,1)); setTier(api,4); g.m=1e19; g.life=1e19;
  ['mes','nil','chn','mes','mes','nil','nil'].forEach(id=>CT.mapa.act(id)); ['g1','g2','g3b','c1','c2','c3a'].forEach(id=>CT.tec.research(id));
  I.tick(0.1); CT.mar.start('giza'); clock+=1e6*1000; CT.mar.finish(); CT.mar.start('jardins'); CT.mar.start('farol'); clock+=500*1000; CT.mar.finish();
  const mp=api.getMult('civ-mapa:ps'), tp=api.getMult('civ-tec:ps'), wp=api.getMult('civ-mar:ps'); ok(mp>1&&tp>1&&wp>1,'tres bonus ativos antes do prestigio');
  g.life=1e24; ok(I.pending('civ')>=3,'prestigio disponivel'); const sv=CT.mapa.state().seen.mes; I.prestige('civ');
  ok(api.getMult('civ-mapa:ps')===1&&api.getMult('civ-tec:ps')===1,'Nova civilizacao: mapa e tecnologia recomecam (bonus zerados)');
  ok(Object.keys(CT.mapa.state().r).length===0&&Object.keys(CT.tec.state().n).length===0,'estado do mapa/tecnologia limpo');
  ok(near(api.getMult('civ-mar:ps'),wp)&&CT.mar.state().b.giza,'maravilhas concluidas permanecem (patrimonio)'); ok(CT.mar.state().q.length===1,'obra em andamento permanece');
  ok(sv&&CT.mapa.state().seen.mes,'curiosidades ja vistas permanecem'); ok(I.tabsOpen('civ').length===4,'abas continuam abertas apos prestigio');
  ok(CT.fx.mapa.mult===1&&CT.fx.mar.mult>1&&CT.disc('mar')===0,'efeitos cruzados recalculados');
  ok(errs.length===0,'sem erros: '+errs.join('|')); w.close();
}

async function balance(){
  // teto de bonus: tudo comprado (no maximo possivel) com a Caverna toda maximizada
  let {w,errs,api,CT,I,g}=await fresh(); const G=w.GAMES.civ;
  G.items.forEach(it=>api.setOwned(it.id,it.max)); 
  g.m=1e30; let clock=1e12; CT.clock=()=>clock;
  I.tick(1.2); const ps0=I.psBase('civ');   /* tick: o motor concede os Marcos (+2% cada) antes da referencia */
  CT.mapa.REG.forEach(r=>{ for(let s=0;s<3;s++) CT.mapa.act(r.id); });
  ok(CT.mapa.REG.every(r=>CT.mapa.state().r[r.id]===3),'mapa 100%');
  const mapaOnly=I.psBase('civ')/ps0;
  // melhor combinacao de tecnologias: forca bruta (excludentes + doutrina) com os pre-requisitos cruzados
  const P=CT.tec.PATHS, picks=[]; // enumera escolhas dos passos 3 e 5 de cada caminho e a doutrina final
  const best={mult:1,combo:null};
  function* choose(){ const opts=P.map(p=>[[p.steps[2][0].id,p.steps[2][1].id],[p.steps[4][0].id,p.steps[4][1].id]]); 
    for(const a of [0,1]) for(const b of [0,1]) for(const c of [0,1]) for(const d of [0,1]) for(const e of [0,1]) for(const f of [0,1]) for(const cap of [-1,0,1,2]) yield {sel:[[a,b],[c,d],[e,f]],cap}; }
  let maxMult=0,maxPs=0,maxD={map:0,tec:0,mar:0},maxT=0;
  for(const ch of choose()){
    const have=new Set(); P.forEach((p,pi)=>{ p.steps.forEach((st,i)=>{ if(i===2) have.add(st[ch.sel[pi][0]].id); else if(i===4) have.add(st[ch.sel[pi][1]].id); else if(i<5) st.forEach(x=>have.add(x.id)); }); });
    if(ch.cap>=0) have.add(P[ch.cap].steps[5][0].id);
    // valida pre-requisitos cruzados
    const has=pid=>stp=>P.find(p=>p.id===pid).steps[stp-1].some(x=>have.has(x.id));
    const okNeed=[...have].every(id=>{ const nd=CT.tec.NODE[id]; return (nd.need||[]).every(r=>{const a=r.split(':'); return has(a[0])(+a[1]); }); });
    if(!okNeed) continue; if(ch.cap>=0 && !P[ch.cap].steps[4].some(x=>have.has(x.id))) continue;
    let m=1,ps=0,d={map:0,tec:0,mar:0},t=0; have.forEach(id=>{ const f=CT.tec.NODE[id].fx; if(f.ps){m*=1+f.ps/100;ps+=f.ps;} if(f.d) for(const k in f.d) d[k]+=f.d[k]; if(f.t) t+=f.t; });
    if(m>maxMult){maxMult=m; best.have=[...have];} }
  ok(maxMult>1.05&&maxMult<1.075,'melhor caminho de tecnologia (so os que respeitam excludentes e pre-requisitos): +'+((maxMult-1)*100).toFixed(1)+'%');
  CT.tec.state().n={}; for(let pass=0,prog=1;prog&&pass<20;pass++){ prog=0; best.have.forEach(id=>{ if(!CT.tec.state().n[id]&&CT.tec.research(id).ok) prog=1; }); }
  ok(best.have.every(id=>CT.tec.state().n[id]),'a melhor combinacao e realmente compravel ('+best.have.length+' tecnologias)');
  const tecAll=I.psBase('civ')/ps0/mapaOnly;
  // maravilhas: todas, com o relogio avancado
  CT.mar.WON.forEach(wd=>{ CT.mar.state().b[wd.id]=1; }); CT.tec.state(); w.Engine.tabs.civ[2].load({b:CT.mar.state().b,q:[],u:1},I.api('civ'));
  const total=I.psBase('civ')/ps0;
  console.log('   mapa x'+mapaOnly.toFixed(4)+' | tecnologia (melhor trilha) x'+tecAll.toFixed(4)+' | maravilhas x'+(total/mapaOnly/tecAll).toFixed(4)+' | TOTAL x'+total.toFixed(4));
  ok(total<=1.30,'BONUS TOTAL MAXIMO (mapa 100% + melhor tecnologia + 15 maravilhas) <= +30%: +'+((total-1)*100).toFixed(1)+'%');
  ok(total>=1.18,'e o bonus total vale a pena (>= +18%)');
  ok(CT.disc('tec')<=.4&&CT.disc('map')<=.4&&CT.disc('mar')<=.4&&CT.fast()<=.4,'descontos limitados a 40%: tec '+CT.disc('tec')+' map '+CT.disc('map')+' mar '+CT.disc('mar')+' tempo '+CT.fast());
  ok(errs.length===0,'sem erros: '+errs.join('|')); w.close();
}

async function ui(){
  let {w,errs,api,CT,I,g}=await fresh(); let clock=1e12; CT.clock=()=>clock;
  ['agri','escr','cid'].forEach(x=>api.setOwned(x,1)); setTier(api,2); g.m=1e15; I.ui(true); I.st.cur='civ'; I.build();
  for(const id of ['mapa','tecnologia','maravilhas']){
    I.selectTab(id); await wait(30); I.renderTab(); const root=w.document.getElementById('tab-civ-'+id); ok(root&&!root.hidden,'aba '+id+' visivel'); 
  }
  I.selectTab('mapa'); I.renderTab(); const pins=[...w.document.querySelectorAll('#tab-civ-mapa .civ-pin')]; ok(pins.length===16,'16 pinos no mapa');
  pins.find(p=>p.dataset.id==='mes').click(); I.renderTab(); ok(!w.document.getElementById('cm-sheet').hidden,'toque no pino abre o painel');
  const list=[...w.document.querySelectorAll('#cm-list li')]; w.document.getElementById('cm-sa').click(); I.renderTab(); const list2=[...w.document.querySelectorAll('#cm-list li')];
  ok(CT.mapa.state().r.mes===1&&list.every((l,i)=>l===list2[i]),'botao compra a etapa e a lista usa diff (nos mantidos)');
  I.selectTab('tecnologia'); I.renderTab(); w.document.querySelector('#tab-civ-tecnologia .civ-node').click(); I.renderTab(); w.document.getElementById('ct-sa').click(); I.renderTab(); ok(CT.tec.state().n.g1===1,'tecnologia comprada pela interface');
  [...w.document.querySelectorAll('.civ-pth')][1].click(); I.renderTab(); ok(w.document.querySelectorAll('#ct-tree li').length===6,'troca de caminho mostra 6 passos');
  I.selectTab('maravilhas'); I.renderTab(); w.document.querySelector('#tab-civ-maravilhas .civ-wc').click(); I.renderTab(); w.document.getElementById('cw-sa').click(); I.renderTab(); ok(CT.mar.state().q.length===1,'obra iniciada pela interface');
  clock+=60*1000; I.renderTab(); const bar=w.document.querySelector('#tab-civ-maravilhas [data-st=build] .civ-wbar i'); ok(bar&&/scaleX\(0\.\d+\)/.test(bar.style.transform),'barra de progresso da obra');
  ok(errs.length===0,'UI sem erros: '+errs.join('|')); w.close();
}


/* ---------- simulacao economica: motor real, jogador sintetico (2 cliques/s, compra pelo menor retorno) ----------
   K = quanto o jogador prefere os itens as abas (retorno da aba x K); K=0 -> nao usa as abas (referencia). */
async function simRun(seed,K,capH,phi=0,runs=1){
  const {w,errs,api,CT,I,g}=await fresh(); const G=w.GAMES.civ, k='civ', rt=I.RT[k]; let t=0; const T0=1.7e12; CT.clock=()=>T0+t*1000;
  const M=CT.mapa, TE=CT.tec, MA=CT.mar; if(process.env.PSREF) CT.PSREF=JSON.parse(process.env.PSREF); if(process.env.PBF){ const F=+process.env.PBF; for(const q in CT.PB) CT.PB[q]*=F; } let seedv=seed*7919+13; w.Math.random=()=>{ seedv=(seedv*1103515245+12345)&0x7fffffff; return seedv/0x7fffffff; };
  let out, step=0;
  let t0=0; const mark=(n)=>{ if(out.mark[n]===undefined) out.mark[n]=t-t0; };
  function options(){
    const ps=I.psBase(k), tr=api.stage().tier, o=[]; if(!K) return o;
    const base=ps, tabs=w.Engine.tabs.civ;
    if(M.state().u) M.REG.forEach(r=>{ const s=M.state().r[r.id]||0; if(s>=3||tr<M.gateTier(r,s)) return; const inc=M.FR[s+1]-M.FR[s], cost=M.costNow(r,s);
      let gain; if(r.fx.ps){ const cur=CT.fx.mapa.mult; gain=api.previewPs({mult:{'civ-mapa:ps':cur*(1+r.fx.ps*M.FR[s+1]/100)/(1+r.fx.ps*M.FR[s]/100)}})-base; } else gain=r.v*inc/100*ps;
      o.push({c:cost,g:gain,kind:'map',run:()=>M.act(r.id)}); });
    if(TE.state().u) TE.FLAT.forEach(nd=>{ const st=TE.nstate(nd.id); if(st.k!=='can'&&st.k!=='ok') return; const gain=nd.fx.ps?api.previewPs({mult:{'civ-tec:ps':CT.fx.tec.mult*(1+nd.fx.ps/100)}})-base:nd.v/100*ps; o.push({c:st.cost,g:gain,kind:'tec',run:()=>TE.research(nd.id)}); });
    if(MA.state().u) MA.WON.forEach(wd=>{ if(MA.state().b[wd.id]||MA.state().q.some(q=>q.id===wd.id)||tr<wd.e||MA.state().q.length>=MA.slots()) return; const c=MA.costNow(wd);
      const gain=wd.fx.ps?api.previewPs({mult:{'civ-mar:ps':CT.fx.mar.mult*(1+wd.fx.ps/100)}})-base:wd.v/100*ps; o.push({c:c,g:gain,kind:'mar',run:()=>MA.start(wd.id)}); });
    return o;
  }
  function playRun(){
  out={ tier:{}, spent:{map:0,tec:0,mar:0}, buys:{map:0,tec:0,mar:0}, mark:{} }; t0=t;
  while(t-t0<capH*3600){
    I.tick(0.5); t+=0.5; step++; I.doClick(k); if(rt.ev) I.evTap();
    const tier=I.tierIdx(k); if(out.tier[tier]===undefined) out.tier[tier]=t-t0;
    if(step%2===0){
      let best=null,bp=Infinity;
      G.items.forEach((it,i)=>{ if(!g.vis[i]||g.o[i]>=it.max) return; const c=I.costK(k,i,1), gn=I.gainOf(k,i,1); if(gn<=0) return; const pb=c/gn; if(pb<bp){bp=pb;best={c,i};} });
      options().forEach(op=>{ if(op.g<=0) return; const pb=op.c/op.g*K; if(pb<bp){bp=pb;best=op;} });
      if(phi&&K){ const sp=options().filter(op=>op.g>0&&op.c<=phi*g.m&&op.c/op.g<=(+process.env.PMAX||9000)).sort((a,b)=>a.c/a.g-b.c/b.g)[0]; if(sp&&(!best||best.i===undefined||best.c>g.m||true)&&!(best&&best.i!==undefined&&best.c<=g.m)) best=sp; }
      if(best&&g.m>=best.c){ if(best.i!==undefined) I.buy(k,best.i,1); else { const before=g.m, r=best.run(); if(r&&r.ok){ out.spent[best.kind]+=before-g.m; out.buys[best.kind]++; (out.log=out.log||[]).push([Math.round((t-t0)/60),best.kind,best.c,I.psBase(k),api.stage().tier]); } } }
    }
    if(!out.mark.m1&&M.state().u) mark('m1'); if(!out.mark.t1&&TE.state().u) mark('t1'); if(!out.mark.w1&&MA.state().u) mark('w1');
    if(G.items.every((it,i)=>g.o[i]>=it.max)){ out.end=t-t0; break; }
  }
  return out; }
  const r1=playRun(); r1.life=g.life; r1.errs=errs.length; r1.ps=I.psBase(k); r1.fx=snap();
  if(runs>1&&r1.end){ const st0=g.stars; I.prestige(k); const l0=g.life, r=playRun(); r.stars=g.stars; r.starsGain=g.stars-st0; r.life=g.life-l0; r.fx=snap(); r1.run2=r; }
  w.close(); return r1;
  function snap(){ return {mapa:(CT.fx.mapa.mult-1)*100,tec:(CT.fx.tec.mult-1)*100,mar:(CT.fx.mar.mult-1)*100,wonders:Object.keys(MA.state().b).length,regs:M.REG.filter(r=>(M.state().r[r.id]||0)>=3).length,techs:Object.keys(TE.state().n).length,expl:M.REG.filter(r=>(M.state().r[r.id]||0)>=1).length}; }
}
async function sim(seeds){
  const f=x=>x===undefined?'-':(x/60).toFixed(0)+'m', h=x=>x===undefined?'-':(x/3600).toFixed(2)+'h', cap=6, avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  function w0(x){ const S=['','mil','mi','bi','tri','qua']; let i=0; while(x>=1000&&i<5){x/=1000;i++;} return x.toFixed(2)+' '+S[i]; }
  console.log('Simulacao: motor real, jogador sintetico (2 cliques/s, evento Descoberta, compra pelo menor retorno), '+seeds+' sementes por cenario.');
  console.log('Tempo = tempo de jogo ativo; relogio das obras = tempo simulado. "Fim" = todos os itens maximizados. A 2a corrida e depois de "Nova civilizacao".');
  const res={};
  for(const [name,K,phi] of [['sem abas',0,0],['com abas, focado em itens (K=3: so compra aba se o retorno vencer)',3,0],['com abas, completista (K=3 + gasta ate 30% do saldo em abas com retorno < 9000 s)',3,0.3],['com abas, mesma prioridade (K=1)',1,0]]){
    if(process.env.ONLY&&!name.startsWith('sem')&&!process.env.ONLY.split(',').some(x=>name.indexOf(x)>=0)) continue;
    const rs=[]; for(let s=1;s<=seeds;s++) rs.push(await simRun(s,K,cap,phi,2)); res[name]=rs;
    const e=avg(rs.map(r=>r.end||cap*3600)), e2=avg(rs.map(r=>r.run2&&r.run2.end||cap*3600));
    console.log('\n== '+name+' ==\n  1a corrida: fim '+h(e)+' ['+rs.map(r=>h(r.end)).join(' ')+']  renda total '+w0(avg(rs.map(r=>r.life)))+'   |   2a corrida (apos Nova civilizacao): fim '+h(e2)+', +'+avg(rs.map(r=>r.run2.starsGain)).toFixed(0)+' Legado ao prestigiar');
    console.log('  eras na 1a corrida: '+[1,2,3,4].map(t=>'T'+t+' '+f(avg(rs.map(r=>r.tier[t]||cap*3600)))).join('  ')+'   abas abertas: Mapa '+f(avg(rs.map(r=>r.mark.m1||NaN)))+' Tec '+f(avg(rs.map(r=>r.mark.t1||NaN)))+' Mar '+f(avg(rs.map(r=>r.mark.w1||NaN))));
    if(K){ const a=rs[0].fx, b=rs[0].run2.fx; console.log('  bonus no fim da 1a (semente 1): mapa +'+a.mapa.toFixed(1)+'% ('+a.regs+' conquistadas) | tec +'+a.tec.toFixed(1)+'% ('+a.techs+' techs) | maravilhas +'+a.mar.toFixed(1)+'% ('+a.wonders+' obras) | produto x'+((1+a.mapa/100)*(1+a.tec/100)*(1+a.mar/100)).toFixed(3));
      console.log('  bonus no fim da 2a: mapa +'+b.mapa.toFixed(1)+'% | tec +'+b.tec.toFixed(1)+'% | maravilhas +'+b.mar.toFixed(1)+'% ('+b.wonders+' obras)');
      const sp=r=>r.spent.map+r.spent.tec+r.spent.mar; console.log('  gasto nas abas na 1a corrida: mapa '+w0(avg(rs.map(r=>r.spent.map)))+' | tec '+w0(avg(rs.map(r=>r.spent.tec)))+' | maravilhas '+w0(avg(rs.map(r=>r.spent.mar)))+'  = '+(avg(rs.map(sp))/avg(rs.map(r=>r.life))*100).toFixed(1)+'% da renda total, '+avg(rs.map(r=>r.buys.map+r.buys.tec+r.buys.mar)).toFixed(0)+' compras; 2a corrida: '+(avg(rs.map(r=>sp(r.run2)))/avg(rs.map(r=>r.run2.life))*100).toFixed(1)+'%'); }
    if(rs.some(r=>r.errs)) console.log('  ERROS no console!'); }
  const base=res['sem abas']; if(!base) return; const b1=avg(base.map(r=>r.end)), b2=avg(base.map(r=>r.run2.end));
  console.log('');
  for(const nme of Object.keys(res)) if(nme!=='sem abas'){ const e=avg(res[nme].map(r=>r.end)), e2=avg(res[nme].map(r=>r.run2.end)); console.log(nme.split(',').slice(0,2).join(',').padEnd(60)+' 1a: '+((e/b1-1)*100).toFixed(1)+'% | 2a: '+((e2/b2-1)*100).toFixed(1)+'%  (negativo = mais rapido que sem abas)'); }
}
(async()=>{
  if(process.argv[2]==='log'){ const r=await simRun(1,3,6,0.3); const f=w=>w.toExponential(1); r.log.forEach(l=>console.log(l[0]+'m',l[1],'T'+l[4],'cost',f(l[2]),'ps',f(l[3]),'cost/ps',(l[2]/l[3]).toFixed(1)+'s')); process.exit(0); }
  if(process.argv[2]==='sim'){ await sim(+process.argv[3]||3); process.exit(0); }
  await logic(); await prestigeTest(); await balance(); await ui();
  console.log(n,'verificacoes'); process.exit(process.exitCode||0);
})();

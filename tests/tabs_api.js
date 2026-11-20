/* Testa a API de abas com a aba de exemplo (Cofre) e uma aba defeituosa. node tests/tabs_api.js */
const {boot}=require('./boot'); const path=require('path'); const assert=require('assert');
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let n=0; const ok=(c,m)=>{n++; if(!c){console.log('FAIL',m); process.exitCode=1;} else console.log('OK  ',m)};
(async()=>{
  const ex=[path.join(__dirname,'example-tab.js'),path.join(__dirname,'bad-tab.js')];
  let {w,errs}=boot({extra:ex}); await wait(80); const I=w.IDLE; I.ui(false);
  ok(w.Engine.tabs.lan.map(t=>t.id).join()==='cofre,ruim','registerTab registra na ordem');
  ok(typeof w.Engine.registerTab==='function' && w.Engine.version===1,'Engine.registerTab exposto');
  let threw=false; try{ w.Engine.registerTab('lan',{id:'cofre'}) }catch(e){threw=true} ok(threw,'id repetido e rejeitado');
  threw=false; try{ w.Engine.registerTab('xx',{id:'a'}) }catch(e){threw=true} ok(threw,'jogo desconhecido e rejeitado');
  ok(I.tabsOpen('lan').length===2,'abas: Comprar + Ruim (Cofre ainda travada por unlock)'); // ruim sempre aberta
  const g=I.st.g.lan; g.m=1e6; I.buy('lan',0,1);
  ok(I.tabsOpen('lan').some(t=>t.id==='cofre'),'unlock(api) libera a aba');
  const api=w.Engine.api('lan'); const ps0=I.psBase('lan');
  ok(api.spend(5) && g.m<1e6,'api.spend gasta'); ok(!api.spend(1e12),'api.spend recusa sem saldo');
  const m0=g.m; api.earn(100); ok(Math.abs(g.m-m0-100)<1e-6,'api.earn ganha'); ok(g.life>=100,'earn conta na renda total');
  api.earn(50,false); ok(g.life<g.t+1e6,'earn(v,false) nao conta como renda');
  api.mult('t:x',2); ok(Math.abs(I.psBase('lan')/ps0-2)<1e-9,'api.mult dobra a producao'); api.mult('t:x',1); ok(Math.abs(I.psBase('lan')/ps0-1)<1e-9,'api.mult(id,1) remove');
  api.temp('t:tmp',3,5); ok(Math.abs(I.ps('lan')/ps0-3)<1e-9,'api.temp multiplica'); for(let i=0;i<60;i++) I.tick(0.1); ok(Math.abs(I.ps('lan')/ps0-1)<1e-6,'api.temp expira');
  api.setExtra('t','pc',2); ok(I.psBase('lan')>ps0,'api.setExtra adiciona unidades'); api.setExtra('t','pc',0); ok(Math.abs(I.psBase('lan')-ps0)<1e-9,'setExtra(0) remove');
  ok(api.previewPs({mult:{a:2}})>I.psBase('lan')*1.99,'previewPs nao altera o estado'); ok(Math.abs(I.psBase('lan')-ps0)<1e-9,'estado intacto apos previewPs');
  api.shared.foo=7; ok(g.sh.foo===7,'api.shared e persistente (g.sh)');
  ok(api.unlock('cofre1')===true && api.isUnlocked('cofre1') && api.unlock('cofre1')===false,'api.unlock concede conquista uma vez');
  ok(api.unlock('nao_existe')===false,'api.unlock ignora id desconhecido');
  const st=api.stage(); ok(typeof st.tier==='number','api.stage()');
  // tick e erros isolados
  for(let i=0;i<30;i++) I.tick(0.1); ok(true,'tick segue com aba defeituosa');
  ok(errs.filter(e=>/aba lan:ruim/.test(e)).length<=5 && errs.filter(e=>/aba lan:ruim:update/.test(e)).length===1,'erro de aba logado uma vez por funcao: '+errs.length);
  // UI: troca de aba, render, lista com diff
  I.ui(true); I.st.cur='lan'; I.build(); I.selectTab('cofre'); await wait(50);
  const chips=[...w.document.querySelectorAll('#subtabs .subtab')].map(b=>b.dataset.t); ok(chips.join()==='main,cofre,ruim','chips das abas');
  ok(w.document.getElementById('tab-lan-cofre').hidden===false && w.document.getElementById('rows').offsetParent!==undefined,'raiz da aba visivel');
  ok(w.document.getElementById('app').classList.contains('sub'),'app.sub na subaba');
  const btn=w.document.getElementById('cf-b'); btn.click(); btn.click(); btn.click(); I.renderTab();
  const lis=[...w.document.querySelectorAll('#cf-l li')]; ok(lis.length===3,'lista de 3 itens');
  btn.click(); I.renderTab(); const lis2=[...w.document.querySelectorAll('#cf-l li')]; ok(lis2.length===4 && lis.every((l,i)=>l===lis2[i]),'lista com diff mantem os nos');
  ok(w.COFRE.box()===40 && Math.abs(api.getMult('cofre:bonus')-1.04)<1e-9,'estado e multiplicador da aba');
  // save / load
  I.save(); const raw=w.localStorage.getItem('miniidle-v2'); const sv=JSON.parse(raw);
  ok(sv.g.lan.tabs.cofre && sv.g.lan.tabs.cofre.box===40,'save namespaced por aba (g.lan.tabs.cofre)'); ok(sv.g.lan.mu['cofre:bonus']===1.04,'multiplicador permanente salvo (g.mu)'); ok(sv.tab.lan==='cofre','aba ativa salva');
  ok(!('ruim' in sv.g.lan.tabs),'aba com save() que lanca nao quebra o save');
  const exp=I.exportSave(); ok(exp.indexOf('MI2:')===0,'exportSave ok');
  w.close();
  let b2=boot({extra:ex,save:raw}); await wait(80); ok(b2.w.COFRE.box()===40,'load restaura o estado da aba depois de recarregar');
  ok(Math.abs(b2.w.Engine.api('lan').getMult('cofre:bonus')-1.04)<1e-9,'multiplicador reaplicado');
  // save antigo sem tabs/sh/mu migra
  const old=JSON.parse(raw); delete old.tab; for(const k of ['lan','civ','esp']){ delete old.g[k].tabs; delete old.g[k].sh; delete old.g[k].mu; }
  let b3=boot({extra:ex,save:JSON.stringify(old)}); await wait(80); ok(b3.w.COFRE.box()===0 && b3.w.IDLE.st.g.lan.sh && b3.w.IDLE.st.g.lan.tabs,'save antigo (sem campos) abre com padroes');
  // zerar jogo chama load(null)
  console.log(n,'verificacoes'); process.exit(process.exitCode||0);
})();

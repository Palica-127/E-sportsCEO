/* Regras do Mercado/Liga/prestigio/migracao no motor real (jsdom). node tests/esp_logic.js */
const {boot}=require('./boot'); const wait=ms=>new Promise(r=>setTimeout(r,ms)); let n=0; const ok=(c,m)=>{n++; if(!c){console.log('FAIL',m); process.exitCode=1;} else console.log('OK  ',m)};
(async()=>{
  let {w,errs}=boot(); await wait(80); let I=w.IDLE; I.ui(false); const k='esp', g=I.st.g[k], M=w.MKT, L=w.LIGA, A=w.Engine.api(k), G=w.GAMES.esp;
  ok(g.sh.region===undefined,'jogo novo: regiao ainda nao escolhida'); ok(g.sh.division==='T2','jogo novo comeca na T2');
  g.sh.region='BR'; g.m=1e15; for(let i=0;i<3;i++) I.buy(k,0,1); ok(g.o[0]===3,'3 titulares genericos');
  I.tick(0.1); const v=M.view(); ok(v.st.filter(x=>x&&!x.real).length===3 && v.st[0].n==='Amador 1' && v.st[3]===null,'vagas genericas "Amador N" e vazias');
  const P=w.PLAYERS, by=(l,r,o)=>P.filter(p=>p.l===l&&p.r===r).sort((a,b)=>a.o-b.o);
  const lowTop=by('CBLOL','TOP')[0], starTop=by('CBLOL','TOP').pop();
  ok(M.avail(starTop,M.ctx()).ok===false && /promoção/.test(M.avail(starTop,M.ctx()).why),'estrela do CBLOL bloqueada na T2');
  ok(M.avail(lowTop,M.ctx()).ok===true,'jogador de menor nota liberado na T2');
  const imp=by('LCS','MID').pop(); ok(M.avail(imp,M.ctx()).ok===false && /promoção/.test(M.avail(imp,M.ctx()).why),'import bloqueado na T2');
  const ps0=I.psBase(k); let r=M.hire(lowTop.id,false); ok(r.ok,'contratou real na funcao certa: '+r.msg);
  ok(g.o[0]===3,'real substituiu generico (titulares continuam 3)'); ok(I.psBase(k)>ps0,'real produz mais que o generico');
  const mid=by('CBLOL','MID')[0]; r=M.hire(mid.id,false); ok(r.ok && g.o[0]===3,'real em vaga generica mantem contagem'); 
  const adc=by('CBLOL','ADC')[0]; r=M.hire(adc.id,false); ok(r.ok && g.o[0]===4,'real em vaga vazia soma 1 titular');
  r=M.hire(adc.id,false); ok(!r.ok,'nao contrata duas vezes o mesmo');
  const adc2=by('CBLOL','ADC')[1]; r=M.hire(adc2.id,false); ok(!r.ok && r.need==='replace','vaga com real pede confirmacao de troca');
  const m1=g.m; r=M.hire(adc2.id,false,true); ok(r.ok,'troca confirmada'); ok(g.m>m1-M.price(adc2,'BR')+1,'troca devolve 50% do anterior');
  // dispensar
  const before=g.m, paid=M.state().s[0].paid; r=M.fire(false,0); ok(r.ok && Math.abs(g.m-before-Math.floor(paid*0.5))<1,'dispensar devolve 50%'); ok(g.o[0]===3 && M.state().s[0]===null,'vaga liberada e contagem cai');
  // preco: crescimento exponencial por nota
  const pr=o=>M.price({o,l:'CBLOL'},'BR'); ok(pr(80)>pr(76)*5 && pr(90)>pr(86)*5 && pr(96)>pr(90)*20,'preco cresce exponencialmente com a nota');
  ok(M.price({o:85,l:'LCK'},'BR')>=1.49*M.price({o:85,l:'CBLOL'},'BR'),'import tem agio de 50%');
  ok(M.mult(74)<1.2 && M.mult(96)>2.9 && M.mult(74)>1,'multiplicador 74~pouco, 96~muito');
  // reservas
  const sub=by('CBLOL','SUP')[0]; const ps1=I.psBase(k); r=M.hire(sub.id,true); ok(r.ok && I.psBase(k)>ps1,'reserva real da bonus de renda'); 
  const sub2=by('CBLOL','JNG')[0], sub3=by('CBLOL','TOP')[1]; M.hire(sub2.id,true); r=M.hire(sub3.id,true); ok(!r.ok && r.need==='full','so 2 reservas');
  // liga: promover manualmente
  const ST=L.state(); ST.on=1; g.o[0]=5; I.tick(0.1);
  // simula promocao
  ST.div='T1'; ST.ti.promo=1; g.sh.division='T1'; I.tick(0.1);
  ok(M.avail(starTop,M.ctx()).ok===true,'estrela liberada apos promocao');
  const lck=P.filter(p=>p.l==='LCK'&&p.r==='MID').sort((a,b)=>b.o-a.o)[0]; ok(!M.avail(lck,M.ctx()).ok && /MSI ou o Mundial/.test(M.avail(lck,M.ctx()).why),'LCK/LPL travados sem torneio internacional');
  g.sh.intl=1; ST.intl=1; ok(M.avail(lck,M.ctx()).ok,'LCK/LPL liberam depois de disputar internacional');
  const lcs1=by('LCS','TOP').pop(), lec1=by('LEC','JNG').pop(), lcs2=by('LCS','ADC').pop();
  r=M.hire(lcs1.id,false); ok(r.ok,'import 1: '+r.msg); r=M.hire(lec1.id,false); ok(r.ok,'import 2'); r=M.hire(lcs2.id,false,true); ok(!r.ok && /Limite/.test(r.msg),'limite de 2 importados (titulares+reservas)');
  ok(g.sh.imports===2,'shared.imports=2');
  // contrato x.roster
  const X=I.sceneX(k); ok(Array.isArray(X.roster.starters)&&X.roster.starters.length===5&&X.roster.subs.length===2,'x.roster com 5 titulares e 2 reservas');
  ok(X.roster.starters.every(s=>s===null||(typeof s.n==='string'&&['TOP','JNG','MID','ADC','SUP'].includes(s.r)&&typeof s.real==='boolean'&&typeof s.o==='number')),'itens de x.roster no formato');
  ok(X.roster.starters[0].r==='TOP' && X.roster.starters[1].r==='JNG' && X.roster.starters.map(s=>s&&s.r).join()==='TOP,JNG,MID,ADC,SUP','ordem TOP,JNG,MID,ADC,SUP');
  ok(['T2','T1','MSI','MUNDIAL'].includes(X.division) && X.region==='Brasil','x.division e x.region'); ok(Array.isArray(X.roster.subs)&&X.roster.subs[0].real===true,'reserva real em x.roster.subs');
  // salvar/recarregar
  I.save(); const raw=w.localStorage.getItem('miniidle-v2'); const jr=JSON.stringify(M.state().s);
  // prestigio: contratados ficam, genericos reiniciam
  g.life=1e30; g.stars=0; const nRealS=M.state().s.filter(Boolean).length; const sub0=JSON.stringify(M.state().b);
  const res=I.prestige(k); ok(res>=3,'prestigio ocorre'); ok(JSON.stringify(M.state().s)===jr && JSON.stringify(M.state().b)===sub0,'prestigio: contratados permanecem'); ok(g.o[0]===nRealS && g.o[1]===2,'prestigio: genericos reiniciam (o[tit]=reais)');
  ok(g.o[2]===0 && g.o[3]===0,'prestigio: coach/treino zeram'); ok(L.state().div==='T2' && g.sh.division==='T2','prestigio: divisao volta a T2'); ok(L.state().ti.promo===1 && g.sh.intl===1,'prestigio: trofeus e passaporte internacional ficam');
  ok(I.psBase(k)>0 && Math.abs(A.getMult('liga:promo')-1.10)<1e-9,'bonus permanente da promocao reaplicado');
  w.close();
  // recarrega
  let b=boot({save:raw}); await wait(80); I=b.w.IDLE; ok(JSON.stringify(b.w.MKT.state().s)===jr,'save: elenco igual apos recarregar'); ok(b.w.IDLE.st.g.esp.sh.region==='BR','save: regiao mantida'); 
  // save antigo sem nada dos novos campos
  const old=JSON.parse(raw); for(const kk of ['lan','civ','esp']){ delete old.g[kk].tabs; delete old.g[kk].sh; delete old.g[kk].mu; } delete old.tab;
  let b2=boot({save:JSON.stringify(old)}); await wait(80); const g2=b2.w.IDLE.st.g.esp;
  ok(g2.sh.region==='BR' && g2.sh.division==='T2' && b2.w.MKT.state().s.every(x=>x===null),'save antigo: migra para Brasil/T2 sem elenco'); ok(b2.errs.length===0,'save antigo sem erros: '+b2.errs.join('|').slice(0,200));
  // save adulterado
  const bad=JSON.parse(raw); bad.g.esp.tabs.mercado={s:[{id:'nao_existe',paid:1},{id:'chovy',paid:'x'},null,null,null],b:[7,null]}; bad.g.esp.tabs.liga={ser:{k:'xxx',r:9},ti:7,div:'Z'}; bad.g.esp.sh={region:'ZZ'};
  let b3=boot({save:JSON.stringify(bad)}); await wait(80); ok(b3.w.MKT.state().s.every(x=>x===null) && b3.errs.length===0,'save adulterado e ignorado sem erro: '+b3.errs.join('|').slice(0,200));
  // zerar jogo
  b3.w.IDLE.st.cur='esp'; console.log(n,'verificacoes'); process.exit(process.exitCode||0);
})();

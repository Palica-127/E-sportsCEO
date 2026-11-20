/* Simulador do Time de eSports: roda o MOTOR REAL (jsdom, sem UI) com um jogador sintetico ativo.
   uso: node tests/sim.js [regiao=BR] [seeds=5] [capH=6] [verbose] */
const {boot}=require('./boot');
const region=process.argv[2]||'BR', seeds=+process.argv[3]||5, capH=+process.argv[4]||6, verbose=process.argv[5]==='v';
async function run(seed){
  const {w,errs}=boot(); await new Promise(r=>setTimeout(r,60)); const I=w.IDLE; I.ui(false); const k='esp';
  I.st.cur=k; const g=I.st.g[k]; g.sh.region=region;
  const M=w.MKT, LG=w.LIGA, G=w.GAMES.esp, ST=LG.state(); ST.seed=seed*7919+13;
  Object.assign(G.mk,JSON.parse(process.env.MK||'{}')); Object.assign(G.lg,JSON.parse(process.env.LG||'{}'));
  const F=+process.env.ITEMF||1, F0=+process.env.ITEM0||3; G.items.forEach((it,i)=>{ if(i>=F0) it.c0*=F; });
  const rt=I.RT[k];
  const ev={}; const mark=(n,t)=>{ if(ev[n]===undefined){ev[n]=t;} };
  let t=0, dt=0.5, step=0, hist=[];
  while(t<capH*3600){
    I.tick(dt); t+=dt; step++;
    I.doClick(k); // 2 cliques/s
    if(rt.ev) I.evTap();
    if(step%2===0){
      // decisao
      const o=g.o; let best=null,bp=Infinity;
      G.items.forEach((it,i)=>{ if(!g.vis[i]||o[i]>=it.max) return; const n=1; const c=I.costK(k,i,n); const gn=I.gainOf(k,i,n); if(gn<=0) return; const pb=c/gn; if(pb<bp){bp=pb;best={t:'i',i,c};}});
      const c=M.ctx(); const S=M.state();
      (process.env.NOMKT?[]:w.PLAYERS).forEach(p=>{ const av=M.avail(p,c); if(!av.ok) return;
        for(const sub of [false,true]){
          const cost=sub?M.subPrice(p,c.reg):M.price(p,c.reg); if(cost>g.m*40) continue;
          const own=S.s.concat(S.b).some(e=>e&&e.id===p.id); if(own) continue;
          if(!sub){const e=S.s[M.ROLES.indexOf(p.r)]; if(e && w.PLAYERS.find(q=>q.id===e.id).o>=p.o) continue;}
          else {if(S.b.indexOf(null)<0) continue;}
          if(M.isImp(p,c.reg) && M.nImp()>=G.mk.importMax && !(!sub&&S.s[M.ROLES.indexOf(p.r)]&&S.s[M.ROLES.indexOf(p.r)].imp)) continue;
          const gn=M.gain(p.id,sub); if(gn<=0) continue; let net=cost; if(!sub){const e=S.s[M.ROLES.indexOf(p.r)]; if(e) net-=Math.floor(e.paid*G.mk.refund);} 
          const pb=net/gn; if(pb<bp){bp=pb;best={t:'m',id:p.id,sub,c:net};}
        }});
      if((!best||bp>(+process.env.PB||900)) && !process.env.NOMKT){ // fase 2: estrelas (busca forca)
        let pick=null,pd=0; const c2=M.ctx(); const byid=id=>w.PLAYERS.find(q=>q.id===id);
        w.PLAYERS.forEach(p=>{ const av=M.avail(p,c2); if(!av.ok) return; if(S.s.concat(S.b).some(e=>e&&e.id===p.id)) return;
          const slot=M.ROLES.indexOf(p.r), e=S.s[slot], cur=e?byid(e.id).o:(M.view().st[slot]?w.GAMES.esp.mk.genNota:40);
          if(p.o<=cur) return; let net=M.price(p,c2.reg)-(e?Math.floor(e.paid*G.mk.refund):0); let drop=null;
          if(M.isImp(p,c2.reg) && M.nImp()>=G.mk.importMax && !(e&&e.imp)){ // libera um import mais fraco
            let low=null; S.s.forEach((x,i)=>{ if(x&&x.imp&&(!low||byid(x.id).o<byid(S.s[low].id).o)) low=i; });
            if(low===null||byid(S.s[low].id).o>=p.o-3) return; drop=low; net-=Math.floor(S.s[low].paid*G.mk.refund); }
          if(net>g.m) return;
          const d=p.o-cur; if(d>pd){pd=d;pick={id:p.id,drop};} });
        if(pick&&pick.drop!=null) M.fire(false,pick.drop);
        if(pick){ M.hire(pick.id,false,true); best=null; }
      }
      if(best && g.m>=best.c){ if(best.t==='i') I.buy(k,best.i,1); else { let r=M.hire(best.id,best.sub,true); } }
    }
    const L=LG.state();
    if(L.on) mark('on',t); if(L.div==='T1') mark('T1',t); if(L.played.msi) mark('msi',t); if(L.ti.msi) mark('msiW',t); if(L.played.wd) mark('wd',t); if(L.ti.wd){ mark('wdW',t); break; }
    if(step%(+process.env.HE||1200)===0){ hist.push([Math.round(t/60), +LG.strength().toFixed(1), I.fmt(I.psBase(k)), L.div+(L.ser?'/'+L.ser.k:''), M.state().s.filter(Boolean).length, M.state().b.filter(Boolean).length, I.tierIdx(k)]); }
  }
  if(process.env.DUMP){const S=M.state();console.log(JSON.stringify(LG.state().log),LG.state().fail,'S',LG.strength().toFixed(1),'t',Math.round(t/60),'roster',S.s.concat(S.b).filter(Boolean).map(e=>e.id+'@'+w.PLAYERS.find(p=>p.id===e.id).o+' paid '+I.fmt(e.paid)).join('; '),'ps',I.fmt(I.psBase(k)),'items',g.o.join(','));}
  return {ev,hist,errs,t,items:g.o.join(',')};
}
const res=[];
(async()=>{for(let s=(+process.env.SEED0||1);s<(+process.env.SEED0||1)+seeds;s++){ const r=await run(s); res.push(r); const f=n=>r.ev[n]===undefined?'-':(r.ev[n]/60).toFixed(0)+'m';
  console.log('seed',s,'regiao',region,'inscr',f('on'),'T1',f('T1'),'MSI',f('msi'),'MSIw',f('msiW'),'Mundial',f('wd'),'TITULO',f('wdW'),'(',(r.t/3600).toFixed(2),'h )', r.errs.length?('ERR '+r.errs[0]):'');
  if(verbose&&s===1) r.hist.forEach(h=>console.log(h.join(' | '))); }
process.exit(0);})();

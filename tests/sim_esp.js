/* Simulacao do MOTOR REAL do Time de eSports (jsdom, sem UI) com 3 perfis de jogador.
   uso: node tests/sim_esp.js [perfil=ativo|casual|ocioso|todos] [sementes=9] [regiao=BR] [semMercado]
   Metas (docs/ESPORTS_ECONOMIA.md 8.1): ativo 2,5-3,5 h; casual ~4 h (3,6-4,8); caixa minimo > 0; intervalo sem compra < 20 min. */
const { boot } = require('./boot');
const wait = ms => new Promise(r => setTimeout(r, ms));
const BOT = { polemica: 1, viral: 0, lesao: 1, proposta: 1, bootcamp: 0, rival: 1, vazamento: 0, briga: 0, collab: 0, reality: 0, compra: 1, vaquinha: 0, ativacao: 0, internet: 0, staff: 0 };
const PROFILE = { ativo: [1e18, 0], casual: [180, 1620], ocioso: [60, 3600] };

async function run(profile, seed, region, market) {
  const { w, errs } = boot(); await wait(40);
  const I = w.IDLE; I.ui(false); const k = 'esp', g = I.st.g[k], X = w.SEMANA, M = w.MKT, EC = w.ECO, C = EC.C, G = w.GAMES.esp;
  g.sh.region = region; I.st.cur = k; const s = X.state(); s.seed = (seed * 7919 + 13) >>> 0; s.rc = 0;
  const A = w.Engine.api(k), L = w.ESPX.liga;
  const [session, gap] = PROFILE[profile];
  const R = { seed, t: 0, mile: {}, minR: 1e18, buys: [], resc: 0, ev: 0, warn: 0 };
  let wall = 0;
  const mark = (n) => { if (R.mile[n] === undefined) R.mile[n] = wall; };
  const idx = id => G.idx[id];
  const nAmat = () => { const v = M.view(); return v ? v.st.filter(x => x && !x.real).length : 0; };
  function Sbase() { return X.strength(A, null, true, true); }
  function netNow() { return X.econ().saldo; }
  function buyBest() { /* equivale a Team.shop() do simulador de referencia */
    let n = 0;
    while (n++ < 60) {
      const costs = X.costs(), reserve = 3 * costs, money = g.m, base = X.econ(), baseNet = base.saldo, st = L.state();
      let best = null;
      const consider = (name, cost, dS, dN, fn, force) => {
        if (cost > money - reserve) return;
        if (name !== 'arena' && name !== 'smm' && dN < -0.5 * Math.max(1, baseNet) && baseNet > 0) return;
        let score;
        if (force) score = 1e9 / cost; else if (name === 'arena' || name === 'smm') { if (dN * 70 < cost) return; score = dN * 35 / cost; } else score = dS / cost;
        if (score <= 0) return;
        if (!best || score > best.score) best = { score, fn, name, cost };
      };
      const nt = g.o[idx('tit')];
      if (nt < 5) consider('tit', 800 * Math.pow(1.5, nt), 1, 0, () => I.buy(k, idx('tit'), 1), true);
      if (nt >= 5 || true) {
        const star0 = A.shared.star || 0, soc0 = base.inc.social;
        ['treino', 'house', 'equip', 'arena', 'coach', 'anal', 'psi', 'smm'].forEach(id => {
          const i = idx(id), it = G.items[i]; if (nt < 5 || !g.vis[i] || g.o[i] >= it.max) return;
          if (id === 'arena' && st.div !== 'T1') return;
          const cost = it.c0 * Math.pow(it.g, g.o[i]); let dS = 0, dN = 0;
          if (id === 'treino') dS = 1 + 2 * nAmat() / 5; else if (id === 'house') dS = 0.8 + 1 * nAmat() / 5; else if (id === 'equip') dS = 0.8;
          else if (id === 'coach' || id === 'anal' || id === 'psi') { dS = 1.5; dN = -C.staffSal[id]; }
          else if (id === 'smm') dN = soc0 * 0.5 - C.staffSal.smm;
          if (it.up) dN -= C.upkeep * cost;
          if (id === 'arena') { const ar = g.o[i]; dN += (C.arenaRev[ar + 1] - C.arenaRev[ar]) * (0.4 + 0.6 * 0.6) + 5 * Math.pow(Math.max(0, w.SEMANA.state().F), 1.2) * 0.25 - C.upkeep * cost; }
          consider(id, cost, dS, dN, () => I.buy(k, i, 1));
        });
        if (market && nt >= 5) {
          const c = M.ctx(), S = M.state(), v = M.view();
          w.PLAYERS.forEach(p => {
            const slot = M.ROLES.indexOf(p.r), old = S.s[slot], oldx = v.st[slot];
            if (!M.avail(p, c).ok) return;
            if (S.s.some(e => e && e.id === p.id)) return;
            const cur = oldx ? oldx.o : 40; if (p.o <= cur + 1.5) return;
            const imp = M.isImp(p, c.reg);
            if (imp && (M.nImp() - (old && old.imp ? 1 : 0) + 1) > G.mk.importMax) return;
            const cost = M.price(p, c.reg) - (old ? Math.floor(old.paid * 0.6) : 0);
            const dSal = M.salary(p, c.reg) - (oldx ? oldx.sal : 0);
            const dStar = Math.max(0, p.o - 80) - (oldx && oldx.real ? Math.max(0, oldx.o - 80) : 0);
            const dN = -dSal + 0.3 * Math.pow(w.SEMANA.state().seg, 0.75) * (dStar / 40);
            consider('real', cost, (p.o - cur) / 5, dN, () => M.hire(p.id, !!old));
          });
        }
      }
      if (!best) break;
      best.fn(); R.buys.push(wall);
    }
  }
  function focusActive() {
    const f = X.state(), L1 = L.state(), ser = L1.ser, costs = X.costs(), cdd = f.cd;
    const av = id => X.focusAvail(id).ok;
    const last = L1.on && !ser && L1.gi === (L1.div === 'T1' ? 9 : 8) - 1;
    if (f.M < 42 && av('descanso')) return 'descanso';
    if (ser && ser.r === 0 && (ser.k === 'msi' || ser.k === 'worlds') && av('bootcamp')) return 'bootcamp';
    if ((ser || last) && av('scrims')) return 'scrims';
    if (f.of.length < 2 && f.con.length < X.slots() && av('negociar') && cdd.negociar <= 0) return 'negociar';
    if (g.m / Math.max(1, costs) < 4) return 'conteudo';
    if (av('imprensa') && f.F < 450) return 'imprensa';
    if (f.forma[1] <= 1 && av('treino')) return 'treino';
    return 'conteudo';
  }
  function act(online) { /* decisoes do jogador no inicio de cada semana */
    if (!online) return;
    const f = X.state();
    if (f.ev) { X.choose(BOT[f.ev.id] || 0); R.ev++; }
    buyBest(); X.autoAccept();
    const a = X.setFocus(focusActive()); if (!a.ok) X.setFocus('conteudo');
  }
  let lastWk = -1, done = false;
  const step = (dt) => { I.tick(dt); wall += dt; R.minR = Math.min(R.minR, g.m); const st = L.state();
    if (st.on) mark('5tit'); if (st.div === 'T1') mark('promo'); if (st.played.msi) mark('intl'); if (st.ti.msi) mark('msi');
    if (X.state().con.some(c => c.t >= 4)) mark('banco'); if (X.state().con.some(c => c.t >= 5)) mark('nexa');
    if (st.ti.wd) { mark('titulo'); done = true; } };
  const TMAX = 24 * 3600; let started = false;
  while (!done && wall < TMAX) {
    const tEnd = wall + session; if (!started) { started = true; }
    buyBest(); X.autoAccept();
    while (!done && wall < tEnd && wall < TMAX) {
      const f = X.state();
      if (f.wk !== lastWk || f.ev) { lastWk = f.wk; act(true); }
      step(0.5);
    }
    if (done || gap === 0) break;
    const off = Math.min(gap, 14400); const wk0 = X.state().wk, r0 = X.state().st.resg;
    I.creditAway(off); wall += gap; if (X.state().st.resg > r0) R.resc++;
    lastWk = -1; if (L.state().ti.wd) { mark('titulo'); done = true; }
  }
  R.t = wall; R.done = done; R.errs = errs.slice(0, 3); R.resc += X.state().st.resg; R.wk = X.state().wk; R.cash = g.m;
  R.gapMax = (() => { const b = [0].concat(R.buys, [R.t]); let m = 0; for (let i = 1; i < b.length; i++) m = Math.max(m, b[i] - b[i - 1]); return m; })();
  w.close(); return R;
}
const q = (a, p) => { const v = a.slice().sort((x, y) => (x == null) - (y == null) || x - y); return v[Math.min(v.length - 1, Math.floor(p * (v.length - 1) + 0.5))]; };
const fh = t => t == null ? '   -   ' : t >= 3600 ? (t / 3600).toFixed(2) + ' h' : Math.round(t / 60) + ' min';
(async () => {
  const which = process.argv[2] || 'todos', N = +process.argv[3] || 9, region = process.argv[4] || 'BR', market = process.argv[5] !== 'semMercado';
  const perfis = which === 'todos' ? ['ativo', 'casual', 'ocioso'] : [which]; const out = {};
  for (const pf of perfis) {
    const rows = []; for (let sd = 1; sd <= N; sd++) rows.push(await run(pf, sd, region, market));
    const tt = rows.map(r => r.done ? r.t : null), med = q(tt, 0.5), md = k => q(rows.map(r => r.mile[k] == null ? null : r.mile[k]), 0.5);
    out[pf] = { med, p25: q(tt, .25), p75: q(tt, .75), rows };
    console.log(`${pf.padEnd(7)} ${market ? 'com' : 'sem'} Mercado ${region}: titulo ${fh(med)} (p25 ${fh(q(tt, .25))} - p75 ${fh(q(tt, .75))}) | 5tit ${fh(md('5tit'))} promo ${fh(md('promo'))} banco ${fh(md('banco'))} intl ${fh(md('intl'))} msi ${fh(md('msi'))} | caixa min R$ ${Math.round(Math.min(...rows.map(r => r.minR)))} | resgates ${rows.reduce((a, r) => a + r.resc, 0)} | maior intervalo sem compra ${fh(Math.max(...rows.map(r => r.gapMax)))} | eventos/run ${(rows.reduce((a, r) => a + r.ev, 0) / rows.length).toFixed(0)} | titulos ${rows.filter(r => r.done).length}/${rows.length}`);
    const er = rows.filter(r => r.errs.length); if (er.length) console.log('  ERROS:', er[0].errs);
  }
  process.exit(0);
})();

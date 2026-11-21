/* Interface: barra superior, seletor de jogo, 5 abas e navegação inferior. Re-renderiza a aba atual a cada mudança. */
const hex = (o, c = '') => `<span class="hx ${o >= 85 ? 't4' : o >= 75 ? 't3' : o >= 65 ? 't2' : ''} ${c}">${Math.round(o)}</span>`;
const ANOS = a => a == null ? '—' : a + ' anos';
(function () {
  'use strict';
  const O = window.Org;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = { tab: 'org', game: 'lol', squad: 't1', mk: { role: '', liga: '', q: '', n: 30, pay: false, asc: false }, ligaVer: null, aberto: null, resetArm: false, ren: null, arm: null };

  const TABS = [['org', '🏢', 'Início'], ['calendario', '📅', 'Calendário'], ['elenco', '👥', 'Elenco'], ['mercado', '🛒', 'Mercado'], ['estrutura', '🛍️', 'Loja'], ['negocios', '📣', 'Negócios'], ['ligas', '🏆', 'Torneios'], ['hall', '👑', 'Campeões']];

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  const res = r => { toast(r.msg); render(); };

  const SIMBOLOS = ['🐺', '🦅', '🐉', '🦁', '🐍', '🦈', '🐻', '🦊', '🔥', '⚡', '👑', '💀', '🚀', '🌊', '⭐', '🛡️', '⚔️', '🎯', '🧠', '🌋'];
  const CORES = ['#7c8cff', '#ef6b57', '#4cc38a', '#f0a53c', '#b077f0', '#5aa0ff', '#ff6fa8', '#e9edf5', '#22d3ee', '#a3e635'];
  const FORMAS = [['escudo', 'Escudo'], ['circulo', 'Círculo'], ['hex', 'Hexágono'], ['quad', 'Quadrado']];
  const logo = (l, sz) => l.img ? `<span class="logo f-${l.f} img${l.cut ? ' cut' : ''}" style="--c:${l.c};--sz:${sz || 40}px;background-image:url(${l.img})" role="img" aria-label="Logo"></span>` : `<span class="logo f-${l.f}" style="--c:${l.c};--sz:${sz || 40}px">${l.s}</span>`;
  function logoEditor(l) {
    return `<div class="lg-prev">${logo(l, 72)}</div><div class="chips"><label class="chip up">📷 ${l.img ? 'Trocar imagem' : 'Enviar imagem'}<input type="file" id="logo-file" accept="image/*" hidden></label>${l.img ? '<button class="chip" data-act="lg-rm">Remover imagem</button>' : ''}</div>${l.src ? `<div class="chips"><button class="chip ${l.cut ? 'on' : ''}" data-act="lg-cut">✂️ ${l.cut ? 'Fundo removido + contorno branco' : 'Fundo original'}</button></div>${l.cut ? `<label class="fld">Sensibilidade da remoção de fundo<input type="range" id="logo-tol" min="10" max="110" value="${l.tol || 45}"></label>` : ''}` : ''}<div class="chips">${SIMBOLOS.map(x => `<button class="chip sym ${l.s === x ? 'on' : ''}" data-act="lg" data-k="s" data-id="${x}">${x}</button>`).join('')}</div>`
      + `<div class="chips">${CORES.map(c => `<button class="chip cor ${l.c === c ? 'on' : ''}" style="background:${c}" data-act="lg" data-k="c" data-id="${c}" aria-label="cor ${c}"></button>`).join('')}</div>`
      + `<div class="chips">${FORMAS.map(([f, n]) => `<button class="chip ${l.f === f ? 'on' : ''}" data-act="lg" data-k="f" data-id="${f}">${n}</button>`).join('')}</div>`;
  }
  const SU = { step: 1, nome: '', logo: { s: '🐺', c: '#7c8cff', f: 'escudo' }, game: 'lol', regiao: null, role: '', q: '', n: 24 };
  function vSetup() {
    const S = O.get();
    if (S.setup === 'config') {
      if (SU.step === 1) return `<section class="card wiz"><h2>Crie sua organização</h2><label class="fld">Nome da org<input id="su-nome" value="${esc(SU.nome)}" maxlength="24" placeholder="Ex.: Pantera Esports"></label>${logoEditor(SU.logo)}<button class="btn" style="margin-top:12px" data-act="su-next">Continuar</button></section>`;
      const gs = Object.values(O.GAMES), D = O.dataOf(SU.game), regs = Object.entries(D.leagues);
      if (!SU.regiao || !D.leagues[SU.regiao]) SU.regiao = D.inicio;
      return `<section class="card wiz"><h2>${logo(SU.logo, 34)} ${esc(SU.nome || 'Sua org')}: onde começar?</h2><p class="hint">Você começa em UM jogo. Os outros vão abrindo com o tempo (e custam licença).</p>
        <div class="chips">${gs.map(g => `<button class="chip ${SU.game === g.id ? 'on' : ''}" data-act="su-game" data-id="${g.id}">${g.icone} ${g.curto}</button>`).join('')}</div>
        <h3>Região</h3><div class="chips">${regs.map(([k, v]) => `<button class="chip ${SU.regiao === k ? 'on' : ''}" data-act="su-reg" data-id="${k}">${v.nome}</button>`).join('')}</div>
        <div class="row2"><button class="btn alt" data-act="su-back">Voltar</button><button class="btn" data-act="su-go">Criar org</button></div></section>`;
    }
    // estrela
    const g = S.inicio, roles = O.GAMES[g].roles; let lista = O.pool(g).slice().sort((a, b) => b.o - a.o);
    if (SU.role) lista = lista.filter(p => p.r === SU.role); if (SU.q) lista = lista.filter(p => p.n.toLowerCase().includes(SU.q.toLowerCase()));
    if (S.tent <= 0) lista = lista.filter(p => O.chanceEstrela(p.o) >= 0.8);
    const pc = c => c >= 0.995 ? '100%' : c < 0.01 ? '<1%' : Math.round(c * 100) + '%';
    return `<section class="card wiz"><h2>⭐ Escolha a estrela da org</h2><p class="hint">Um jogador famoso vira a cara da ${esc(S.org.nome)}: dá seguidores, reputação e patrocínios melhores. Quem aceita entra sem taxa de contratação e por 40% do salário (acredita no projeto), mas jogador bom costuma recusar org nova. ${S.tent > 0 ? `Você tem <b>${S.tent}</b> convite(s) (cada recusa gasta um).` : 'Convites acabaram: só aceitam os mais acessíveis.'} </p>
      <div class="chips"><button class="chip ${!SU.role ? 'on' : ''}" data-act="su-role" data-id="">Todas</button>${roles.map(r => `<button class="chip ${SU.role === r ? 'on' : ''}" data-act="su-role" data-id="${r}">${r}</button>`).join('')}</div>
      <input id="su-q" placeholder="Buscar jogador" value="${esc(SU.q)}"><button class="btn ghost" style="margin-top:8px" data-act="su-sem">Começar sem estrela</button></section>`
      + `<section class="card"><h2>${lista.length} jogadores</h2>` + lista.slice(0, SU.n).map(p => { const ch = O.chanceEstrela(p.o), f = O.fee(p.o);
        return `<div class="slot">${avatar(p.n)}<span class="role ri${Math.max(0, roles.indexOf(p.r))}">${p.r}</span><div class="who"><b><a href="#" data-act="ficha" data-id="p:${esc(p.n)}">${esc(p.n)}</a></b><small>${esc(p.t)} · ${p.l} · ${ANOS(p.a)} · aceita: ${pc(ch)}</small></div>${hex(p.o)}<button class="mini buy" data-act="su-convite" data-id="${p.id}">${O.money(O.salarioDe({ o: p.o, estrela: true }))}/sem</button></div>`; }).join('')
      + (lista.length > SU.n ? '<button class="btn alt" data-act="su-mais">Mostrar mais</button>' : '') + '</section>';
  }
  const hue = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const ini = t => { const w = (String(t).match(/[A-Za-zÀ-ÿ0-9]+/g) || ['?']); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 3)).toUpperCase(); };
  const slug = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  /* Organizações com rebrand (mesma org, nomes por período [nome, de, até; 0 = atual]). Títulos e logo seguem a org (porte do BrasLOL). */
  const ORGS = [
    { cur: 'Dplus KIA', nm: [['MiraGe Gaming', 2016, 2017], ['DAMWON Gaming', 2017, 2020], ['DWG KIA', 2021, 2021], ['Dplus KIA', 2022, 0]] },
    { cur: 'T1', nm: [['SK Telecom T1', 2013, 2019], ['T1', 2019, 0]] },
    { cur: 'DRX', nm: [['Longzhu Gaming', 2016, 2017], ['Kingzone DragonX', 2017, 2019], ['DragonX', 2019, 2019], ['DRX', 2020, 0]] },
    { cur: 'Weibo Gaming', nm: [['Suning Gaming', 2016, 2019], ['Suning', 2020, 2021], ['Weibo Gaming', 2022, 0]] },
    { cur: 'BLG', nm: [['Bilibili Gaming', 2017, 2023], ['BLG', 2023, 0]] },
    { cur: 'G2', nm: [['Gamers2', 2014, 2015], ['G2 Esports', 2015, 0]] },
    { cur: 'Gen.G', nm: [['KSV', 2017, 2018], ['Gen.G', 2018, 0]] },
    { cur: 'TSM', nm: [['Team SoloMid', 2009, 2019], ['TSM', 2019, 0]] },
    { cur: 'NAVI', nm: [['Natus Vincere', 2009, 2022], ['NAVI', 2022, 0]] },
    { cur: 'Ninjas in Pyjamas', nm: [['NiP', 2012, 0], ['Ninjas in Pyjamas', 2012, 0]] },
  ];
  const kn = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const ORGIX = (() => { const m = {}; ORGS.forEach(o => { m[kn(o.cur)] = o; o.nm.forEach(x => { m[kn(x[0])] = o; }); }); return m; })();
  const orgOf = n => (n == null ? null : ORGIX[kn(n)] || null), orgCur = n => { const o = orgOf(n); return o ? o.cur : n; };
  const orgPast = n => { const o = orgOf(n); return o ? o.nm.filter(x => kn(x[0]) !== kn(o.cur)) : []; };
  /* nomes diferentes com o mesmo logo (o nome exibido continua o original) e fallback por prefixo (filial, versão antiga do nome) */
  const LOGOALIAS = { 'royal-never-give-up': 'royal-club', 'star-horn-royal-club': 'royal-club', 'samsung-white': 'samsung-galaxy', 'sk-telecom-t1': 't1', 'skt': 't1', 'g2-esports': 'g2', 'damwon-gaming': 'dplus-kia', 'dwg-kia': 'dplus-kia', 'bilibili-gaming': 'blg', 'kingzone-dragonx': 'drx', 'gen-g-academy': 'gen-g-global-academy', 'gen-g-esports': 'gen-g' };
  const logoOf = s0 => { const L = window.LOGOS; if (!L) return ''; let sl = L.has(s0) ? s0 : LOGOALIAS[s0] || s0; if (L.has(sl)) return sl;
    const o = orgOf(s0); if (o) { const c = slug(o.cur); if (L.has(c)) return c; }
    let b = ''; L.forEach(x => { if ((sl.startsWith(x + '-') || x.startsWith(sl + '-')) && x.length > b.length && (sl.startsWith(x + '-') || !b)) b = x; }); return b; };
  const crest = (n, sz) => { const sl = logoOf(slug(n)); return sl
    ? `<span class="crest ${sz || 'sm'} real" data-act="ficha" data-id="${esc(n)}"><img src="logos/${sl}.${(window.LOGOX || {})[sl] || 'webp'}" alt="${esc(n)}" loading="lazy" decoding="async"></span>`
    : `<span class="crest ${sz || 'sm'}" data-act="ficha" data-id="${esc(n)}" style="--h:${hue(n)}">${esc(ini(n))}</span>`; };
  const crestT = (c, i, sz) => c.teams[i].eu ? logo(O.get().org.logo, { sm: 26, md: 44, lg: 60 }[sz || 'sm']) : crest(O.nome(c, i), sz);
  const DG = () => O.dataOf(UI.game);
  /* ---------- Cabeçalho ---------- */
  function header() {
    const S = O.get(), pre = S.setup === 'config', G = O.GAMES[UI.game], reg = !pre && O.dataOf(UI.game) ? O.dataOf(UI.game).leagues[O.regiaoDe(UI.game)].nome : '';
    $('top').innerHTML = `${logo(pre ? SU.logo : S.org.logo, 40)}<div class="top-l"><small>${pre ? 'Nova organização' : esc(G.curto + ' · ' + reg)}</small><b>${esc(pre ? (SU.nome || 'Sua org') : S.org.nome)}</b></div><div class="season"><small>Semana ${S.org.semana} · ${S.org.ano}</small><b>${O.money(S.org.caixa)}</b></div>${pre || S.setup ? '' : `<button class="hplay ${PL.on ? 'on' : ''}" data-act="play" aria-label="${PL.on ? 'Parar' : 'Avançar'}">${PL.on ? '⏸' : '▶'}</button>`}`;
    document.body.classList.toggle('setup', !!S.setup);
    $('games').innerHTML = Object.values(O.GAMES).map(g =>
      `<button class="chip ${g.id === UI.game ? 'on' : ''}" data-act="game" data-id="${g.id}">${g.icone} ${g.curto}${O.aberto(g.id) ? '' : ' 🔒'}</button>`).join('');
    $('nav').innerHTML = TABS.map(([id, ic, nm]) => `<button class="${id === UI.tab ? 'on' : ''}" data-act="tab" data-id="${id}"><span>${ic}</span>${nm}</button>`).join('');
  }


  /* ---------- LoL: bandeiras, fichas, campeões e lendas (dados do BrasLOL, sem fotos) ---------- */
  const X = () => window.LOLX || null;
  function bandeira(n) { const x = X(); if (!x || UI.game !== 'lol' && n !== true) return ''; const c = x.nat[n]; return c && x.iso[c] ? `<img class="flag" src="flags/${x.iso[c]}.svg" alt="${esc(x.natN[c] || c)}" title="${esc(x.natN[c] || c)}" loading="lazy" onerror="this.remove()">` : ''; }
  const fotoSlug = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  function avatar(n) { const ini = String(n).replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'; let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    const f = (window.FOTOS || []).find(x => x.slice(0, x.lastIndexOf('.')) === fotoSlug(n)); // fotos/<nick>.jpg que o próprio usuário colocou
    return `<span class="av" data-act="ficha" data-id="p:${esc(n)}" style="--h:${h}">${f ? `<img src="fotos/${f}" alt="">` : ini}</span>`; }
  function achaTime(nome) { const L = (O.dataOf('lol') || {}).leagues || {}; for (const k in L) for (const tier of ['t1', 't2']) for (const t of (L[k][tier] || [])) if (t.n === nome) return { t, liga: L[k].nome, tier: tier.toUpperCase() }; return null; }
  function titulos(nome) {
    const x = X(); if (!x) return { wc: [], msi: [] };
    const al = new Set([nome]); x.ht.forEach(r => { if (r[0] === nome) al.add(r[3]); }); const og = orgOf(nome); if (og) og.nm.forEach(n => al.add(n[0]));
    const ys = o => Object.keys(o).filter(y => al.has(o[y])).map(Number);
    return { wc: ys(x.wct), wcv: ys(x.wcv), msi: ys(x.msv), msiv: ys(x.mst) };
  }

  const TT = { w: ['🏆', 'Mundial'], m: ['🥇', 'MSI'], l: ['🏅', 'Liga'], c: ['🎖️', 'Copa'], f: ['🥈', 'First Stand'] };
  function achaJog(nick) { const L = (O.dataOf('lol') || {}).leagues || {}; for (const k in L) for (const tier of ['t1', 't2']) for (const t of (L[k][tier] || [])) { const i = (t.p || []).findIndex(p => p && p[0] === nick); if (i >= 0) return { p: t.p[i], i, time: t.n, liga: L[k].nome }; } return null; }
  function fichaJog(nick) {
    const x = X(), j = achaJog(nick), roles = (O.GAMES.lol || {}).roles || [], hon = x.hon[nick] || {}, tit = x.rtit[nick] || [], car = x.rcar[nick] || [], c = x.nat[nick], now = new Date().getFullYear();
    let h = `<div class="mh">${avatar(nick)}<div><h2>${esc(nick)} </h2><small>${bandeira(nick)} ${c ? esc(x.natN[c] || c) : ''}${j ? ' · ' + roles[j.i] + ' · ' + ANOS(j.p[2]) : ''}</small></div><button class="mini" data-act="fecha">✕</button></div>`;
    if (j) h += `<div class="kvs"><div><small>Nota</small><b>${j.p[1]}</b></div><div><small>Time</small><b class="sm">${esc(j.time)}</b></div><div><small>Liga</small><b class="sm">${esc(j.liga)}</b></div><div><small>Salário</small><b class="sm">${O.money(O.salary(j.p[1]))}/sem</b></div></div>`;
    const w = tit.filter(t => t[1] === 'w').length, m = tit.filter(t => t[1] === 'm').length || (hon.msi || []).length, l = tit.filter(t => t[1] === 'l').length;
    if (tit.length || hon.wc) h += `<div class="kvs"><div><small>Mundiais</small><b>${Math.max(w, (hon.wc || []).length)}</b></div><div><small>MSI</small><b>${m}</b></div><div><small>Ligas</small><b>${Math.max(l, hon.lg || 0)}</b></div><div><small>Copas</small><b>${tit.filter(t => t[1] === 'c' || t[1] === 'f').length}</b></div></div>`;
    if (car.length) h += '<h3>Carreira</h3><div class="car">' + car.map(([t, a, b]) => `<div class="cr">${crest(t, 'sm')}<b><a href="#" data-act="ficha" data-id="${esc(t)}">${esc(t)}</a></b><small>${a}${b ? (b === a ? '' : '–' + b) : '–hoje'}</small></div>`).join('') + '</div>';
    if (tit.length) h += '<h3>Títulos</h3><div class="trof">' + tit.slice().sort((a, b) => b[0] - a[0]).map(([y, k, n]) => `<p>${(TT[k] || ['🏅'])[0]} <b>${y}</b> ${esc(n)}</p>`).join('') + '</div>';
    if ((hon.mv || []).length) h += '<h3>MVPs</h3><div class="trof">' + hon.mv.map(([y, n]) => `<p>⭐ <b>${y}</b> ${esc(n)}</p>`).join('') + '</div>';
    if (!j && !car.length && !tit.length && !hon.wc) h += '<p class="hint">Sem dados de carreira.</p>';
    return h;
  }

  /* Fichas dos outros jogos (CS2, Dota, Valorant, FF, R6, EA FC, WR): dados vêm de DATA do jogo + HIST do jogo */
  function achaTimeG(nome) { const L = (O.dataOf(UI.game) || {}).leagues || {}; for (const k in L) for (const tier of ['t1', 't2']) for (const t of (L[k][tier] || [])) if (t.n === nome) return { t, liga: L[k].nome, tier: tier.toUpperCase() }; return null; }
  function achaJogG(nick) { const L = (O.dataOf(UI.game) || {}).leagues || {}; for (const k in L) for (const tier of ['t1', 't2']) for (const t of (L[k][tier] || [])) { const i = (t.p || []).findIndex(p => p && p[0] === nick); if (i >= 0) return { p: t.p[i], i, time: t.n, liga: L[k].nome }; } return null; }
  const mesmoTime = (a, b) => a === b || orgCur(a) === orgCur(b);
  function fichaTimeG(nome) {
    const f = achaTimeG(nome), H = (window.HIST || {})[UI.game] || {}, T = H.torneios || [], MAIN = H.main || '', roles = DG().roles || [], TIPOS = H.tipos || {};
    const g = T.filter(t => t.c && mesmoTime(t.c, nome)).sort((a, b) => b.a - a.a), vi = T.filter(t => t.v && mesmoTime(t.v, nome)).sort((a, b) => b.a - a.a), pr = g.filter(t => t.tp === MAIN);
    let h = `<div class="mh">${crest(nome, 'lg')}<div><h2>${esc(nome)}</h2><small>${f ? esc(f.liga) + ' · ' + f.tier : 'Time'} · ${esc(O.GAMES[UI.game].curto)}</small>${orgPast(nome).length ? `<small class="hint">Antes: ${orgPast(nome).map(x => esc(x[0]) + ' (' + x[1] + (x[2] && x[2] !== x[1] ? '–' + x[2] : '') + ')').join(' · ')}</small>` : ''}</div><button class="mini" data-act="fecha">✕</button></div>`;
    if (f && f.t.p && f.t.p.length) {
      const ps = f.t.p, ovr = (ps.reduce((a, p) => a + p[1], 0) / ps.length).toFixed(1), idade = ps.some(p => p[2] == null) ? '—' : (ps.reduce((a, p) => a + p[2], 0) / ps.length).toFixed(1);
      h += `<div class="kvs"><div><small>Força</small><b>${ovr}</b></div><div><small>Idade média</small><b>${idade}</b></div><div><small>${esc(TIPOS[MAIN] || 'Títulos')}</small><b>${pr.length}</b></div><div><small>Títulos</small><b>${g.length}</b></div></div>`;
      h += `<h3>Line-up</h3><div class="lineup">` + ps.map((p, i) => `<div class="lp">${avatar(p[0])}<i class="role ri${i}">${roles[i] || ''}</i><b><a href="#" data-act="ficha" data-id="p:${esc(p[0])}">${esc(p[0])}</a></b>${flagIso(p[3])}<small>${ANOS(p[2])}</small>${hex(p[1])}</div>`).join('') + '</div>';
    } else if (!f) h += '<p class="hint">Time fora das ligas deste jogo.</p>';
    if (g.length) h += '<h3>Troféus</h3><div class="trof">' + g.map(t => `<p>${t.tp === MAIN ? '🏆' : '🥇'} <b>${t.a}</b> ${esc(t.n)}${t.v ? ` <small>vs ${esc(t.v)}${t.p ? ' · ' + esc(t.p) : ''}</small>` : ''}</p>`).join('') + '</div>';
    if (vi.length) h += `<h3>Vice</h3><div class="trof"><p class="hint">${vi.map(t => esc(t.n)).join(' · ')}</p></div>`;
    if (!g.length && !vi.length) h += '<p class="hint">Sem títulos no histórico levantado.</p>';
    return h;
  }
  function fichaJogG(nick) {
    const j = achaJogG(nick), H = (window.HIST || {})[UI.game] || {}, T = H.torneios || [], MAIN = H.main || '', roles = DG().roles || [];
    const tit = T.filter(t => (t.r || []).includes(nick)).sort((a, b) => b.a - a.a), mv = T.filter(t => t.mvp && t.mvp[0] === nick).sort((a, b) => b.a - a.a);
    const bo = Object.keys(H.bo || {}).sort((a, b) => b - a).map(y => [y, H.bo[y].findIndex(r => r[0] === nick)]).filter(r => r[1] >= 0);
    const iso = j && j.p[3] || (mv[0] && mv[0].mvp[2]) || (bo.length && H.bo[bo[0][0]][bo[0][1]][1]) || '';
    let h = `<div class="mh">${avatar(nick)}<div><h2>${esc(nick)} </h2><small>${flagIso(iso)} ${j ? roles[j.i] + ' · ' + ANOS(j.p[2]) + ' · ' : ''}${esc(O.GAMES[UI.game].curto)}</small></div><button class="mini" data-act="fecha">✕</button></div>`;
    if (j) h += `<div class="kvs"><div><small>Nota</small><b>${j.p[1]}</b></div><div><small>Time</small><b class="sm"><a href="#" data-act="ficha" data-id="${esc(j.time)}">${esc(j.time)}</a></b></div><div><small>Liga</small><b class="sm">${esc(j.liga)}</b></div><div><small>Salário</small><b class="sm">${O.money(O.salary(j.p[1]))}/sem</b></div></div>`;
    if (tit.length || mv.length || bo.length) h += `<div class="kvs"><div><small>${esc((H.tipos || {})[MAIN] || 'Principais')}</small><b>${tit.filter(t => t.tp === MAIN).length}</b></div><div><small>Títulos</small><b>${tit.length}</b></div><div><small>MVPs</small><b>${mv.length}</b></div><div><small>Top 10 do ano</small><b>${bo.length}</b></div></div>`;
    if (tit.length) h += '<h3>Títulos</h3><div class="trof">' + tit.map(t => `<p>${t.tp === MAIN ? '🏆' : '🥇'} <b>${t.a}</b> ${esc(t.n)} <small>${crest(t.c, 'sm')} ${esc(t.c)}</small></p>`).join('') + '</div>';
    if (mv.length) h += '<h3>MVPs</h3><div class="trof">' + mv.map(t => `<p>⭐ <b>${t.a}</b> ${esc(t.n)}</p>`).join('') + '</div>';
    if (bo.length) h += `<h3>${esc(H.boNome || 'Top do ano')}</h3><div class="trof">` + bo.map(([y, i]) => `<p>${i === 0 ? '🥇' : '🏅'} <b>${y}</b> ${i + 1}º lugar</p>`).join('') + '</div>';
    if (!j && !tit.length && !mv.length && !bo.length) h += '<p class="hint">Sem dados de carreira.</p>';
    return h;
  }
  function ficha(nome) {
    if (UI.game !== 'lol') return String(nome).startsWith('p:') ? fichaJogG(nome.slice(2)) : fichaTimeG(nome);
    if (String(nome).startsWith('p:')) return fichaJog(nome.slice(2));
    const f = achaTime(nome), tt = titulos(nome), x = X(), roles = (O.GAMES.lol || {}).roles || [];
    let h = `<div class="mh">${crest(nome, 'lg')}<div><h2>${esc(nome)}</h2><small>${f ? esc(f.liga) + ' · ' + f.tier : 'Time'}</small>${orgPast(nome).length ? `<small class="hint">Antes: ${orgPast(nome).map(x => esc(x[0]) + ' (' + x[1] + (x[2] && x[2] !== x[1] ? '–' + x[2] : '') + ')').join(' · ')}</small>` : ''}</div><button class="mini" data-act="fecha">✕</button></div>`;
    if (f && f.t.p) {
      const ovr = (f.t.p.reduce((a, p) => a + p[1], 0) / f.t.p.length).toFixed(1), idade = f.t.p.some(p => p[2] == null) ? '—' : (f.t.p.reduce((a, p) => a + p[2], 0) / f.t.p.length).toFixed(1);
      h += `<div class="kvs"><div><small>Força</small><b>${ovr}</b></div><div><small>Idade média</small><b>${idade}</b></div><div><small>Mundiais</small><b>${tt.wc.length}</b></div><div><small>MSI</small><b>${tt.msi.length}</b></div></div>`;
      h += `<h3>Line-up</h3><div class="lineup">` + f.t.p.map((p, i) => `<div class="lp">${avatar(p[0])}<i class="role ri${i}">${roles[i] || ''}</i><b><a href="#" data-act="ficha" data-id="p:${esc(p[0])}">${esc(p[0])}</a></b>${bandeira(p[0])}<small>${ANOS(p[2])}</small>${hex(p[1])}</div>`).join('') + '</div>';
    }
    const co = x && x.coach[nome]; if (co) h += `<h3>Técnico</h3><div class="lp">${avatar(co[0])}<b>${esc(co[0])}</b>${bandeira(co[0]) || (x.iso[co[1]] ? `<img class="flag" src="flags/${x.iso[co[1]]}.svg" alt="${esc(x.natN[co[1]] || co[1])}" title="${esc(x.natN[co[1]] || co[1])}" onerror="this.remove()">` : '')}<small>${(x.natN[co[1]] || '')}${co[2] ? ' · ' + (new Date().getFullYear() - +co[2].slice(0, 4)) + ' anos' : ''}</small></div>`;
    if (x && (tt.wc.length || tt.msi.length || (tt.wcv || []).length)) {
      h += '<h3>Troféus</h3><div class="trof">' + (tt.wc.length ? `<p>🏆 Mundial: <b>${tt.wc.sort().join(', ')}</b></p>` : '') + (tt.msi.length ? `<p>🥇 MSI: <b>${tt.msi.sort().join(', ')}</b></p>` : '') + ((tt.wcv || []).length ? `<p class="hint">Vice no Mundial: ${tt.wcv.sort().join(', ')}</p>` : '') + '</div>';
    }
    return h;
  }
  function modal() { let m = document.getElementById('modal'); if (!UI.ficha) { if (m) m.remove(); return; } if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); } m.innerHTML = `<div class="mbox" role="dialog">${ficha(UI.ficha)}</div>`; }
  function lineupHT(tipo, y) { const x = X(); const r = x && x.ht.find(r => r[1] === tipo && r[2] === +y); return r ? r[4] : null; }

  const flagIso = c => c ? `<img class="flag" src="flags/${String(c).toLowerCase()}.svg" alt="${esc(c)}" title="${esc(c)}" loading="lazy" onerror="this.remove()">` : '';
  /* ---------- Hall: história real (HIST/LOLX, até 2026) + registro simulado do jogo (2027+, Org.histDe) ---------- */
  const LOCAL_TP = new Set(['EPL', 'Liga', 'Outros', 'REG', 'WRL']), TAGEU = { campeao: 'campeã', vice: 'vice-campeã', semi: 'semifinalista', quartas: 'eliminada nas quartas', oitavas: 'eliminada nas oitavas' };
  const crestN = (n, sz) => n === O.get().org.nome ? logo(O.get().org.logo, { sm: 26, md: 44, lg: 60 }[sz || 'sm']) : crest(n, sz);
  const simTag = t => t.sim ? ' <i class="sim">simulado</i>' : '';
  function histG(game) { // HIST real + torneios simulados, bola de ouro, time do ano e honras
    const H0 = (window.HIST || {})[game], sim = O.histDe(game); if (!H0 && !sim.torneios.length) return null;
    const H = Object.assign({ nome: O.GAMES[game].nome, main: '', tipos: {}, torneios: [] }, H0);
    H.tipos = Object.assign({}, H.tipos); sim.torneios.forEach(t => { if (!H.tipos[t.tp]) H.tipos[t.tp] = t.tp === 'REG' ? 'Ligas regionais (simulado)' : t.tp; });
    H.torneios = H.torneios.concat(sim.torneios); if (Object.keys(sim.bo).length || H.bo) H.bo = Object.assign({}, H.bo, sim.bo);
    H.toy = sim.toy; H.hon = sim.hon; return H;
  }
  function histL() { // LoL: Mundial e MSI reais (LOLX) + simulados
    const x = X(); if (!x) return null; const sim = O.histDe('lol'), tor = [];
    const add = (tp, nm, cm, vm) => Object.keys(cm).forEach(y => tor.push({ n: nm + ' ' + y, a: +y, tp, c: cm[y], v: vm[y] || '' }));
    add('WORLDS', 'Mundial', x.wct, x.wcv); add('MSI', 'MSI', x.msv, x.mst);
    const H = { nome: 'League of Legends', main: 'WORLDS', tipos: { WORLDS: 'Mundial', MSI: 'MSI' }, torneios: tor.concat(sim.torneios), boL: Object.assign({}, x.pre, sim.boLol), toy: sim.toy, hon: sim.hon };
    if (sim.torneios.some(t => t.tp === 'REG')) H.tipos.REG = 'Ligas regionais (simulado)';
    return H;
  }
  const mvpTxt = t => t.mvp ? `<small>⭐ MVP: ${t.sim ? `<a href="#" data-act="ficha" data-id="p:${esc(t.mvp[0])}">${esc(t.mvp[0])}</a> (${esc(t.mvp[1])})` : esc(t.mvp[0])}</small>` : '';
  function torRow(t, ano) { // linha de um torneio (real ou simulado); ano=false esconde a coluna do ano
    return `<div class="hrow">${ano === false ? '' : `<span class="yr">${t.a}</span>`}<div class="who"><b>${crestN(t.c, 'sm')} 🏆 ${esc(t.c)} <small>${esc(t.p || '')}</small></b><small>${esc(t.n)}${t.v ? ' · vice: ' + esc(t.v) : ''}${simTag(t)}</small>${t.s && t.s.length ? `<small>semifinalistas: ${t.s.map(esc).join(', ')}</small>` : ''}${mvpTxt(t)}${t.eu ? `<small class="mine">⭐ Sua org: ${TAGEU[t.eu] || t.eu}</small>` : ''}${t.r ? `<div class="lu">${t.r.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}</div></div>`;
  }
  function vTit(H) { // títulos por time (título principal = H.main; rebrand via orgCur)
    const MAIN = H.main, TIPOS = H.tipos || {}, cm = {};
    H.torneios.forEach(t => { const k = orgCur(t.c); (cm[k] = cm[k] || { M: 0, o: 0 })[t.tp === MAIN ? 'M' : 'o']++; });
    return `<section class="card"><h2>Títulos por time</h2><p class="hint">${esc(TIPOS[MAIN] || MAIN)} e demais torneios levantados (inclui os simulados a partir de 2027).</p>` + Object.entries(cm).sort((a, b) => b[1].M - a[1].M || b[1].o - a[1].o).map(([n, c]) => `<div class="tb"><span>${c.M}</span>${crestN(n)}<b>${esc(n)}</b><em>${c.M ? c.M + ' ' + (TIPOS[MAIN] || MAIN) + ' · ' : ''}${c.o} outros</em></div>`).join('') + '</section>';
  }
  function boRows(H, y, lol) { const R = (O.GAMES.lol || {}).roles || [];
    return lol ? ((H.boL || {})[y] || []).map(r => ({ n: r[0], t: r[1], role: R[r[2]] || '' })) : ((H.bo || {})[y] || []).map(r => ({ n: r[0], iso: r[1], t: r[4] || '' })); }
  function vAno(H, bon, lol) { // "Ver por ano": ◀ ▶ + chips de anos; torneios do ano agrupados por tipo (internacionais primeiro), Bola de Ouro e time do ano
    const anos = [...new Set(H.torneios.map(t => t.a).concat(Object.keys((lol ? H.boL : H.bo) || {}).map(Number)))].sort((a, b) => a - b);
    if (!anos.length) return '<section class="card empty"><p>Sem registros.</p></section>';
    const y = anos.includes(+UI.hy) ? +UI.hy : anos[anos.length - 1], i = anos.indexOf(y), tipos = Object.keys(H.tipos || {});
    const nav = `<div class="ynav"><button class="chip sym" data-act="hy" data-id="${anos[i - 1] || ''}" ${i ? '' : 'disabled'} aria-label="Ano anterior">◀</button><div class="yv"><b>${y}</b><small>${y > 2026 ? 'simulado' : 'história real'}</small></div><button class="chip sym" data-act="hy" data-id="${anos[i + 1] || ''}" ${i < anos.length - 1 ? '' : 'disabled'} aria-label="Próximo ano">▶</button></div>`;
    const chips = `<div class="chips scroll yrc">${anos.map(a => `<button class="chip ${a === y ? 'on' : ''}" data-act="hy" data-id="${a}">${a}${a > 2026 ? ' <i>sim</i>' : ''}</button>`).join('')}</div>`;
    const T = H.torneios.filter(t => t.a === y), grupo = L => [...new Set(L.map(t => t.tp))].sort((a, b) => (b === H.main) - (a === H.main) || tipos.indexOf(a) - tipos.indexOf(b)).map(tp => `<h3 class="gh">${esc(H.tipos[tp] || tp)}</h3>` + L.filter(t => t.tp === tp).map(t => torRow(t, false)).join('')).join('');
    const intl = T.filter(t => !LOCAL_TP.has(t.tp)), loc = T.filter(t => LOCAL_TP.has(t.tp)), bo = boRows(H, y, lol), toy = (H.toy || {})[y];
    let h = chips + nav;
    h += `<section class="card"><h2>🌍 Internacionais · ${y}</h2>${intl.length ? grupo(intl) : '<p class="hint">Nenhum internacional registrado neste ano.</p>'}</section>`;
    if (loc.length) h += `<section class="card"><h2>🏟️ Ligas e regionais · ${y}</h2>${grupo(loc)}</section>`;
    if (bo.length) h += `<section class="card"><h2>🥇 ${esc(bon)} · ${y}</h2>` + bo.slice(0, 3).map((r, k) => `<div class="hrow"><span class="yr">${['🥇', '🥈', '🥉'][k]}</span><div class="who"><b>${r.iso ? flagIso(r.iso) : (lol ? bandeira(r.n) || '' : '')}<a href="#" data-act="ficha" data-id="p:${esc(r.n)}">${esc(r.n)}</a></b>${r.t || r.role ? `<small>${esc(r.t)}${r.role ? ' · ' + r.role : ''}</small>` : ''}</div></div>`).join('') + '</section>';
    if (toy && toy.length) h += `<section class="card"><h2>⭐ Time do ano · ${y} <i class="sim">simulado</i></h2>` + toy.map(([r, n, t]) => `<div class="tb"><span class="role">${esc(r)}</span><b><a href="#" data-act="ficha" data-id="p:${esc(n)}">${esc(n)}</a></b><em>${esc(t)}</em></div>`).join('') + '</section>';
    return h;
  }
  function vHallGen() {
    const H = histG(UI.game);
    const PREMIO = { lol: 'Golden Crown', cs2: 'Golden Rifle', valorant: 'Radiant Award', ff: 'Golden Booyah', dota2: 'Golden Aegis', r6: 'Golden Shield', fifa: "Ballon d'Or", wr: 'Golden Rift' }, BON = H && (H.boNome || PREMIO[UI.game]) || 'Bola de Ouro';
    if (!H) return `<section class="card empty"><h2>${O.GAMES[UI.game].nome}</h2><p>Histórico deste jogo ainda não foi levantado.</p></section>`;
    const TIPOS = H.tipos || {}, MAIN = H.main || '', sub = ['tor', 'tit', H.bo ? 'bo' : '', 'leg', 'ano'].includes(UI.hall) ? UI.hall : 'tor', fl = UI.hf && TIPOS[UI.hf] ? UI.hf : '';
    const chips = `<div class="chips">${[['tor', '🏆 Torneios'], ['tit', '🏅 Títulos por time'], ...(H.bo ? [['bo', '🥇 ' + BON]] : []), ['leg', '⭐ Lendas'], ['ano', '📅 Ver por ano']].map(([k, n]) => `<button class="chip ${k === sub ? 'on' : ''}" data-act="hall" data-id="${k}">${n}</button>`).join('')}</div>`;
    const all = H.torneios;
    if (sub === 'ano') return chips + vAno(H, BON, false);
    if (sub === 'tit') return chips + vTit(H);
    if (sub === 'bo') {
      const ya = Object.keys(H.bo).sort((a, b) => b - a)[0], top = H.bo[ya];
      const hero = `<div class="hero"><div class="k">${esc(BON)} · ${ya}</div><div class="nm">${esc(top[0][0])}</div><div class="tm">${flagIso(top[0][1])}${top[0][4] ? esc(top[0][4]) : top[0][2] != null ? top[0][2] + ' pts' : 'Melhor do mundo'}</div></div>` +
        `<div class="podium">${[1, 0, 2].filter(i => top[i]).map(i => `<div class="pd">${hex(top[i][3] != null ? top[i][3] : 90 - i * 3, i ? 'dk' : 't4')}<b>${esc(top[i][0])}</b><small>${i + 1}º ${flagIso(top[i][1])}</small></div>`).join('')}</div>`;
      return chips + hero + `<section class="card"><h2>${esc(BON)} · Top 10 do ano${H.boNota ? '' : ' (HLTV)'}</h2>${H.boNota ? `<p class="hint">${esc(H.boNota)}</p>` : ''}<p class="hint">A partir de 2027 o prêmio é calculado no jogo, por nota, títulos e MVPs do ano.</p>` + Object.keys(H.bo).sort((a, b) => b - a).map(y => `<div class="hrow"><span class="yr">${y}</span><div class="who"><b>${flagIso(H.bo[y][0][1])}🥇 <a href="#" data-act="ficha" data-id="p:${esc(H.bo[y][0][0])}">${esc(H.bo[y][0][0])}</a>${H.bo[y][0][4] ? ` <small>${esc(H.bo[y][0][4])}</small>` : ''}</b><div class="lu">${H.bo[y].slice(1).map((r, i) => `<span>${i + 2}º ${flagIso(r[1])}<a href="#" data-act="ficha" data-id="p:${esc(r[0])}">${esc(r[0])}</a>${r[3] != null ? ` <small>${r[3]}</small>` : ''}</span>`).join('')}</div></div></div>`).join('') + '</section>';
    }
    if (sub === 'leg') {
      const L = {}; const g = n => { const k = n.toLowerCase().replace('device', 'dev1ce'); return (L[k] = L[k] || { n: n === 'device' ? 'dev1ce' : n, bo1: [], top: 0, mvp: [], iso: '', maj: [], oth: [] }); };
      Object.entries(H.bo || {}).forEach(([y, a]) => { if (+y < 2027) a.forEach((r, i) => { const o = g(r[0]); o.top++; o.iso = o.iso || r[1]; if (!i) o.bo1.push(y); }); });
      all.forEach(t => { if (t.sim) return; if (t.mvp) g(t.mvp[0]).mvp.push(t.a + ' ' + (t.tp === MAIN ? '🥇' : '')); if (t.r) t.r.forEach(n => g(n)[t.tp === MAIN ? 'maj' : 'oth'].push(t.a)); });
      Object.entries(H.hon || {}).forEach(([n, h]) => { const o = g(n); (h.w || []).forEach(y => o.maj.push(y)); (h.a || []).forEach(y => o.oth.push(y)); (h.v || []).forEach(([y, k]) => o.mvp.push(y + ' ' + (k === 'w' ? '🥇' : ''))); (h.b || []).forEach(y => o.bo1.push(y)); o.top += h.t || 0; });
      const arr = Object.values(L).map(o => ({ ...o, pts: o.bo1.length * 5 + o.mvp.length * 1.5 + o.top * .6 + o.maj.length * 2 + o.oth.length * .8 })).sort((a, b) => b.pts - a.pts).slice(0, 25);
      return chips + `<section class="card"><h2>Lendas</h2><p class="hint">Ranking por MVPs, títulos principais e demais títulos (line-ups conferidas até 2026; de 2027 em diante contam os títulos simulados)${H.bo ? ', nº 1 do ano e Top 10' : ''}.</p>` + arr.map(o => `<div class="leg">${avatar(o.n)}<div class="who"><b>${flagIso(o.iso)}<a href="#" data-act="ficha" data-id="p:${esc(o.n)}">${esc(o.n)}</a></b><small>${[o.bo1.length ? '🥇 #1 do ano: ' + o.bo1.join(', ') : '', o.top ? o.top + ' no Top 10' : '', o.maj.length ? '🏆 ' + o.maj.length + ' ' + (TIPOS[MAIN] || MAIN) + ' (' + o.maj.join(', ') + ')' : '', o.oth.length ? '🥈 ' + o.oth.length + ' outros títulos' : ''].filter(Boolean).join(' · ')}</small>${o.mvp.length ? `<small>⭐ ${o.mvp.length} MVP${o.mvp.length > 1 ? 's' : ''}: ${o.mvp.join(', ')}</small>` : ''}</div></div>`).join('') + '</section>';
    }
    const lista = all.filter(t => !fl || t.tp === fl).sort((a, b) => b.a - a.a);
    return chips + `<div class="chips">${[['', 'Todos'], ...Object.entries(TIPOS)].map(([k, n]) => `<button class="chip ${k === fl ? 'on' : ''}" data-act="hfil" data-id="${k}">${n}</button>`).join('')}</div><section class="card"><h2>${esc(H.nome)} · ${lista.length} torneios</h2>` + lista.map(t => torRow(t)).join('') + '</section>';
  }
  function vHall() {
    if (UI.game !== 'lol') return vHallGen();
    const x = X(), H = histL(); if (!x || !H) return '<section class="card empty"><p>Sem dados.</p></section>';
    const hasReg = H.torneios.some(t => t.tp === 'REG'), subs = ['wc', 'msi', 'tit', hasReg ? 'reg' : '', 'bo', 'leg', 'ano'], sub = subs.includes(UI.hall) ? UI.hall : 'wc';
    const chips = `<div class="chips">${[['wc', '🏆 Mundial'], ['msi', '🥇 MSI'], ['tit', '🏅 Títulos por time'], ...(hasReg ? [['reg', '🏟️ Ligas']] : []), ['bo', '🥇 Golden Crown'], ['leg', '⭐ Lendas'], ['ano', '📅 Ver por ano']].map(([k, n]) => `<button class="chip ${k === sub ? 'on' : ''}" data-act="hall" data-id="${k}">${n}</button>`).join('')}</div>`;
    if (sub === 'ano') return chips + vAno(H, 'Golden Crown', true);
    if (sub === 'tit') return chips + vTit(H);
    if (sub === 'reg') return chips + `<section class="card"><h2>Ligas regionais · ${H.torneios.filter(t => t.tp === 'REG').length} splits simulados</h2>` + H.torneios.filter(t => t.tp === 'REG').sort((a, b) => b.a - a.a || b.sp - a.sp).map(t => torRow(t)).join('') + '</section>';
    if (sub === 'bo') {
      const R = (O.GAMES.lol || {}).roles || [];
      return chips + '<section class="card"><h2>Golden Crown · Top 10 do ano</h2><p class="hint">A partir de 2027 o prêmio é calculado no jogo, por nota, títulos e MVPs do ano.</p>' + Object.keys(H.boL).sort((a, b) => b - a).map(y => `<div class="hrow"><span class="yr">${y}</span><div class="who"><b>${bandeira(H.boL[y][0][0]) || ''}🥇 <a href="#" data-act="ficha" data-id="p:${esc(H.boL[y][0][0])}">${esc(H.boL[y][0][0])}</a></b><small>${esc(H.boL[y][0][1])}</small><div class="lu">${H.boL[y].slice(1).map((r, i) => `<span>${i + 2}º ${bandeira(r[0]) || ''}<a href="#" data-act="ficha" data-id="p:${esc(r[0])}">${esc(r[0])}</a> <small>${R[r[2]] || ''}</small></span>`).join('')}</div></div></div>`).join('') + '</section>';
    }
    if (sub === 'leg') {
      const hon = {}; Object.entries(x.hon).forEach(([n, o]) => { hon[n] = { wc: (o.wc || []).slice(), msi: (o.msi || []).slice(), lg: o.lg || 0, mv: (o.mv || []).slice() }; });
      Object.entries(H.hon || {}).forEach(([n, h]) => { const o = hon[n] = hon[n] || { wc: [], msi: [], lg: 0, mv: [] }; (h.w || []).forEach(y => o.wc.push(y)); (h.a || []).forEach(y => o.msi.push(y)); o.lg += h.l || 0; (h.v || []).forEach(([y, k]) => o.mv.push([y, k === 'w' ? 'MVP Mundial' : 'MVP MSI'])); (h.b || []).forEach(y => o.mv.push([y, 'Golden Crown'])); });
      const arr = Object.entries(hon).map(([n, o]) => ({ n, o, pts: (o.wc || []).length * 3 + (o.msi || []).length * 2 + (o.lg || 0) * .5 + (o.mv || []).length })).sort((a, b) => b.pts - a.pts).slice(0, 60);
      return chips + '<section class="card"><h2>Lendas</h2><p class="hint">Inclui títulos, MVPs e Golden Crown simulados a partir de 2027.</p>' + arr.map(({ n, o }) => `<div class="leg">${avatar(n)}<div class="who"><b><a href="#" data-act="ficha" data-id="p:${esc(n)}">${esc(n)}</a> ${bandeira(n) || ''}</b><small>${(o.wc || []).length ? '🏆 ' + o.wc.length + ' Mundial (' + o.wc.join(', ') + ') ' : ''}${(o.msi || []).length ? '🥇 ' + o.msi.length + ' MSI ' : ''}${o.lg ? '🏅 ' + o.lg + ' ligas ' : ''}</small>${(o.mv || []).length ? `<small>⭐ ${o.mv.map(m => m[0] + ' ' + esc(m[1].replace(/^MVP /, 'MVP '))).slice(0, 4).join(' · ')}</small>` : ''}</div></div>`).join('') + '</section>';
    }
    const tp = sub === 'wc' ? 'WORLDS' : 'MSI', lista = H.torneios.filter(t => t.tp === tp).sort((a, b) => b.a - a.a);
    return chips + `<section class="card"><h2>${sub === 'wc' ? 'Campeões do Mundial' : 'Campeões do MSI'}</h2>` + lista.map(t => {
      const lu = t.sim ? null : lineupHT(sub === 'wc' ? 'Mundial' : 'MSI', t.a);
      return `<div class="hrow"><span class="yr">${t.a}</span><div class="who"><b>${crestN(t.c, 'sm')} 🏆 ${esc(t.c)} <small>${esc(t.p || '')}</small></b><small>vice: ${esc(t.v || '—')}${simTag(t)}</small>${t.s && t.s.length ? `<small>semifinalistas: ${t.s.map(esc).join(', ')}</small>` : ''}${mvpTxt(t)}${t.eu ? `<small class="mine">⭐ Sua org: ${TAGEU[t.eu] || t.eu}</small>` : ''}${lu ? `<div class="lu">${lu.map(n => `<span>${bandeira(n) || ''}<a href="#" data-act="ficha" data-id="p:${esc(n)}">${esc(n)}</a></span>`).join('')}</div>` : ''}</div></div>`;
    }).join('') + '</section>';
  }
  /* chaves (brackets) em colunas */
  function bracket(cols) {
    return '<div class="bracket">' + cols.map(c => `<div class="bcol"><h4>${esc(c.t)}</h4>` + c.m.map(m => `<div class="bm ${m.p ? 'pend' : ''}"><div class="${m.w === m.a ? 'win' : ''} ${m.ea ? 'eu' : ''}">${m.ca || ''}<span>${esc(m.a)}</span></div><div class="${m.w === m.b ? 'win' : ''} ${m.eb ? 'eu' : ''}">${m.cb || ''}<span>${esc(m.b)}</span></div></div>`).join('') + '</div>').join('') + '</div>';
  }

  /* ---------- Abas ---------- */
  function vOrg() {
    const S = O.get(), p = O.projecao(UI.game), po = O.projecaoOrg();
    const ev = vEvento();
    const regs = Object.entries(DG() ? DG().leagues : {}).map(([k, v]) => `<option value="${k}" ${k === O.regiaoDe(UI.game) ? 'selected' : ''}>${v.nome} · ${v.regiao}</option>`).join('');
    return ev + `<section class="card"><h2>Sua organização</h2>${S.estrela ? `<p class="hint">⭐ Estrela: <b>${esc(S.estrela.n)}</b> (${S.estrela.o})</p>` : ''}
      <label class="fld">Nome da org<input id="orgnome" value="${esc(S.org.nome)}" maxlength="24"></label>
      <label class="fld">Região de ${O.GAMES[UI.game].curto} (trocar reinicia as competições deste jogo)<select id="regiao">${regs}</select></label>
      <details><summary class="hint">Editar logo</summary>${logoEditor(S.org.logo)}</details><div class="kv"><span>Reputação</span><b>${S.org.rep.toFixed(2)}</b></div><div class="kv"><span>Seguidores</span><b>${S.social.seg.toLocaleString('pt-BR')}</b></div><div class="kv"><span>Patrocínios + redes (por semana)</span><b class="pos">${O.money(O.rendaPatro() + O.rendaSocial())}</b></div>
    </section>
    <section class="card"><h2>Semana da org</h2>
      <div class="kv"><span>Receita prevista</span><b class="pos">${O.money(po.receita)}</b></div>
      <div class="kv"><span>Despesa prevista</span><b class="neg">${O.money(po.despesa)}</b></div>
      <div class="kv"><span>Saldo</span><b class="${po.saldo >= 0 ? 'pos' : 'neg'}">${O.money(po.saldo)}</b></div>
      <div class="kv"><span>Só ${O.GAMES[UI.game].curto}: receita / folha</span><b>${O.money(p.receita)} / ${O.money(p.despesa)}</b></div>
      ${playCtl()}
    </section>
    <section class="card"><h2>Histórico</h2><ul class="log">${O.get().log.slice(0, 8).map(l => `<li>${esc(l)}</li>`).join('') || '<li>Nada ainda.</li>'}</ul></section>
    <section class="card"><button class="btn ghost" data-act="reset">${UI.resetArm ? 'Tem certeza? Toque de novo' : 'Zerar jogo'}</button></section>`;
  }

  const SQ_IDS = ['t1', 't2', 'acad'];
  function squadTabs() {
    const S = O.get();
    return `<div class="chips">${SQ_IDS.map(id => `<button class="chip ${id === UI.squad ? 'on' : ''}" data-act="squad" data-id="${id}">${O.SQUADS[id].nome.replace(/ \(.*\)/, '')}${S.games[UI.game].squads[id].on ? '' : ' 🔒'}</button>`).join('')}</div>`;
  }
  function gameGuard() {
    const S = O.get();
    if (!O.aberto(UI.game)) { const d = O.desbloqueio(UI.game), falta = d.sem - S.tempo, G = O.GAMES[UI.game];
      return `<section class="card empty"><h2>🔒 ${G.icone} ${G.nome}</h2><p>Você começou em outro jogo. Abrir um time aqui custa ${O.money(d.custo)}${falta > 0 ? ` e fica disponível em ${falta} semana(s).` : ' e já está disponível.'}</p>`
        + `<button class="btn" data-act="abrirjogo" ${falta > 0 || S.org.caixa < d.custo ? 'disabled' : ''}>Abrir time de ${G.curto}</button></section>`; }
    if (O.GAMES[UI.game].ativo) return '';
    return `<section class="card empty"><h2>${O.GAMES[UI.game].icone} ${O.GAMES[UI.game].nome}</h2><p>Sem dados para este jogo.</p></section>`;
  }
  function vElenco() {
    const g = gameGuard(); if (g) return g;
    const S = O.get(), q = S.games[UI.game].squads[UI.squad], d = O.SQUADS[UI.squad], roles = O.GAMES[UI.game].roles;
    let h = squadTabs();
    if (!q.on) {
      h += `<section class="card empty"><h2>${d.nome}</h2>` + (d.semDados ? '<p>Ainda sem dados desta divisão no BrasLOL.</p>' :
        `<p>Criar este time custa ${O.money(d.licenca)} de licença.</p><button class="btn" data-act="ativar">Criar time</button>`) + '</section>';
      return h;
    }
    h += `<section class="card"><div class="kv"><span>Força</span><b>${O.forca(UI.game, UI.squad).toFixed(1)}</b></div>
      <div class="kv"><span>Folha semanal</span><b>${O.money(O.folha(UI.game, UI.squad))}</b></div></section>` + vTreino(q) + `<section class="card"><h2>Titulares</h2>`;
    h += q.slots.map((p, i) => {
      const nT = roles.length, titulo = i < nT ? roles[i] : 'RES', cls = i < nT ? 'ri' + i : 'ri9';
      return `<div class="slot">${p ? `${avatar(p.n)}<span class="role ${cls}">${titulo}</span><div class="who"><b>${p.estrela ? '⭐ ' : ''}<a href="#" data-act="ficha" data-id="p:${esc(p.n)}">${esc(p.n)}</a> ${p.c ? flagIso(p.c) : bandeira(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${ANOS(p.a)}</small><small class="${p.ct <= 8 ? 'neg' : ''}">⏳ ${p.ct === undefined ? O.CONTRATO : p.ct} sem. de contrato</small>${trnHtml(p, UI.squad, i < nT, `data-slot="${i}"`)}<div class="acts"><button class="mini" data-act="ren-abrir" data-slot="${i}">Renovar ▾</button>${p.estrela ? '' : `<button class="mini ${UI.arm === 'v' + i ? 'warn' : ''}" data-act="vender" data-slot="${i}">${UI.arm === 'v' + i ? 'Confirmar venda?' : 'Vender ' + O.money(O.valorVenda(p))}</button>`}${['t1', 't2', 'acad'].filter(x => x !== UI.squad && S.games[UI.game].squads[x].on).map(x => `<button class="mini" data-act="mover" data-slot="${i}" data-id="${x}">→ ${x === 'acad' ? 'Academy' : x.toUpperCase()}</button>`).join('')}</div>${UI.ren && UI.ren.slot === i ? renPanel(p, i) : ''}</div>${hex(p.o)}${p.estrela ? '' : `<button class="mini" data-act="dispensar" data-slot="${i}" aria-label="Dispensar ${esc(p.n)}">✕</button>`}`
        : `<span class="role ${cls} off">${titulo}</span><div class="who"><small>Vaga aberta</small></div>`}</div>${i === nT - 1 ? '</section><section class="card"><h2>Reservas</h2>' : ''}`;
    }).join('') + '</section>';
    return h + vBase(roles);
  }
  const estrelas = v => '★'.repeat(v.estrelas) + '☆'.repeat(5 - v.estrelas) + (v.incerto ? '?' : '');
  const potTxt = (p, g) => { const v = O.potVisivel(p, g); return `${estrelas(v)} ${v.incerto ? v.lo + '–' + v.hi : v.est}`; };
  /* linha de treino de um jogador: foco (botão que troca), barra de XP, tendência, potencial e moral */
  function trnHtml(p, sq, tit, ref) {
    const F = O.FOCOS[p.foco] || O.FOCOS.bal, need = O.xpNecessario(p.o), room = p.pot != null && p.o >= p.pot, td = O.tendencia(p, UI.game, sq, tit), tr = p.tr && O.TRACOS[p.tr];
    const pct = room ? 100 : Math.min(100, Math.round((p.xp || 0) / need * 100)), mo = Math.round(p.mo == null ? 70 : p.mo);
    return `<div class="trn"><button class="mini fc" data-act="foco-j" ${ref} data-sq="${sq}" title="${esc(F.desc)} Toque para trocar.">${F.icone} ${F.nome}</button><div class="bar ${room ? 'max' : ''}" title="Progresso até a próxima nota"><i style="width:${pct}%"></i></div>`
      + `<small class="tnd">${td.s} ${room ? (p.a >= 30 ? 'em declínio' : 'no potencial') : 'XP ' + Math.floor(p.xp || 0) + '/' + need + ' · +' + td.anual.toFixed(1).replace('.', ',') + '/ano'}</small>`
      + `<small class="tnd">Pot. ${potTxt(p, UI.game)} · Moral ${O.moralRot(mo)} ${mo}${tr ? ' · ' + tr.nome : ''}</small></div>`;
  }
  function renPanel(p, slot) {
    const R = UI.ren, pr = O.propostaRenovar(p, R.oferta, R.anos), neg = p.neg > 0;
    return `<div class="negoc"><small>Negociar renovação${neg ? ' (ele não quer conversar por ' + p.neg + ' sem.)' : ''}</small><div class="chips">${[1, 2, 3].map(n => `<button class="chip ${R.anos === n ? 'on' : ''}" data-act="ren-anos" data-id="${n}">${n} ano${n > 1 ? 's' : ''}</button>`).join('')}</div>`
      + `<div class="chips">${Object.entries(O.OFERTAS).map(([k, v]) => `<button class="chip ${R.oferta === k ? 'on' : ''}" data-act="ren-of" data-id="${k}">${v.nome}</button>`).join('')}</div>`
      + `<small>Luvas ${O.money(pr.custo)} · chance de aceitar ${Math.round(pr.chance * 100)}%${R.oferta === 'baixa' ? ' (recusa deixa o jogador chateado)' : R.oferta === 'alta' ? ' (melhora a moral)' : ''}</small><div class="acts"><button class="mini buy" data-act="ren-ok" data-slot="${slot}" ${neg ? 'disabled' : ''}>Propor</button><button class="mini" data-act="ren-abrir" data-slot="${slot}">Fechar</button></div></div>`;
  }
  function vTreino(q) {
    const S = O.get(), g = UI.game, casa = O.infraNivel('casa', g), nn = (S.noticias || []).filter(x => x.g === g).slice(0, 5);
    return `<section class="card"><h2>🏋️ Treino</h2><p class="hint">Cada jogador treina toda semana: o XP vira +1 de nota até o potencial. Jovens evoluem rápido, veteranos só mantêm. Gaming house nível ${casa} (+${casa * 10}% de XP)${S.foco === 'treino' ? ' e Foco da semana em treino (+25%)' : ''}.</p>`
      + `<div class="chips"><small class="hint" style="align-self:center">Foco de todos:</small>${Object.values(O.FOCOS).map(f => `<button class="chip" data-act="foco-all" data-id="${f.id}" title="${esc(f.desc)}">${f.icone} ${f.nome}</button>`).join('')}</div>`
      + (nn.length ? '<ul class="log">' + nn.map(x => `<li class="${x.k}">${x.k === 'up' ? '📈' : x.k === 'down' ? '📉' : '•'} ${esc(x.t)}</li>`).join('') + '</ul>' : '<p class="hint">As evoluções aparecem aqui.</p>') + '</section>';
  }
  function vBase(roles) {
    const S = O.get(), g = UI.game, nv = O.infraNivel('base', g), bs = (S.base || {})[g] || [];
    let h = `<section class="card"><h2>🌱 Base</h2>` + (nv ? `<p class="hint">Nível ${nv} · ${bs.length}/${O.capBase(nv)} jovens · manter custa ${O.money(O.custoBase(g))}/sem. Quem completa ${O.BASE_ANO_MAX} anos sai: promova, venda ou dispense. A cada split a base revela ${nv >= 3 ? '1 a 3' : 'um'} jovem(ns).</p>` : '<p class="hint">Compre a Categoria de base na aba Loja para revelar jovens.</p>');
    h += bs.map(p => `<div class="slot"><span class="role ri${Math.max(0, roles.indexOf(p.r))}">${p.r}</span><div class="who"><b>${p.genio ? '💎 ' : ''}${esc(p.n)} ${p.c ? flagIso(p.c) : ''}</b><small class="${p.a >= O.BASE_ANO_MAX - 1 ? 'neg' : ''}">${ANOS(p.a)}${p.a >= O.BASE_ANO_MAX - 1 ? ' · último ano na base' : ''}</small>${trnHtml(p, 'base', true, `data-id="${p.id}"`)}<div class="acts"><button class="mini buy" data-act="base" data-id="${p.id}">Promover</button><button class="mini ${UI.arm === 'bv' + p.id ? 'warn' : ''}" data-act="base-v" data-id="${p.id}">${UI.arm === 'bv' + p.id ? 'Confirmar venda?' : 'Vender ' + O.money(O.valorVenda(p))}</button><button class="mini" data-act="base-d" data-id="${p.id}">Dispensar</button></div></div>${hex(p.o)}</div>`).join('');
    return h + '</section>';
  }
  function vMercado() {
    const g = gameGuard(); if (g) return g;
    const S = O.get(), m = UI.mk, roles = O.GAMES[UI.game].roles;
    let lista = O.livres(UI.game);
    if (m.role) lista = lista.filter(p => p.r === m.role);
    if (m.liga) lista = lista.filter(p => p.l === m.liga);
    if (m.pay) lista = lista.filter(p => O.fee(p.o) <= S.org.caixa);
    if (m.q) lista = lista.filter(p => p.n.toLowerCase().includes(m.q.toLowerCase()));
    lista.sort((a, b) => m.asc ? a.o - b.o : b.o - a.o); const tot = lista.length;
    const ligas = Object.keys(DG().leagues);
    return squadTabs() + `<section class="card"><div class="chips">
      <button class="chip ${m.pay ? 'on' : ''}" data-act="mpay">💰 Posso pagar</button><button class="chip ${m.asc ? 'on' : ''}" data-act="masc">${m.asc ? '↑ Mais baratos' : '↓ Melhores'}</button><button class="chip ${!m.role ? 'on' : ''}" data-act="mrole" data-id="">Todas</button>${roles.map(r => `<button class="chip ${m.role === r ? 'on' : ''}" data-act="mrole" data-id="${r}">${r}</button>`).join('')}</div>
      <div class="row2"><select id="mliga"><option value="">Todas as ligas</option>${ligas.map(l => `<option ${m.liga === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input id="mq" placeholder="Buscar nome" value="${esc(m.q)}"></div></section>
      <section class="card"><h2>${tot} jogadores</h2>` + lista.slice(0, m.n).map(p => `<div class="slot"><span class="role ri${roles.indexOf(p.r)}">${p.r}</span>
        ${avatar(p.n)}<div class="who"><b><a href="#" data-act="ficha" data-id="p:${esc(p.n)}">${esc(p.n)}</a> ${p.c ? flagIso(p.c) : bandeira(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${ANOS(p.a)} · ${O.money(O.salary(p.o))}/sem</small></div>${hex(p.o)}
        <button class="mini buy" data-act="contratar" data-id="${p.id}" ${S.org.caixa >= O.fee(p.o) ? '' : 'disabled'}>${O.money(O.fee(p.o))}</button></div>`).join('')
      + (tot > m.n ? `<button class="btn alt" data-act="mais">Mostrar mais</button>` : '') + '</section>';
  }
  function trilha(c, sq) {
    const intlNome = sq === 't1' ? (c.phase === 'intl' ? O.intlDef(c.game)[c.intl.tipo].nome : (Object.values(O.intlDef(c.game))[(c.split % 2 === 1 ? 0 : 1)] || {}).nome) : null;
    const et = ['Pré-split', 'Fase regular', 'Playoffs', intlNome || 'Fim do split', 'Entressafra'];
    let now = c.phase === 'reg' ? 1 : c.phase === 'po' ? 2 : c.phase === 'intl' ? 3 : (c.split > 0 && c.phase === 'off' ? 4 : 0);
    return `<ul class="trk">${et.map((t, i) => `<li class="${i < now ? 'done' : i === now ? 'now' : ''}"><i></i>${esc(t)}</li>`).join('')}</ul>`;
  }
  /* Calendário geral: junta todos os times ativos de todos os jogos (as abas de jogo servem só para gestão) */
  function vCalendario() {
    const S = O.get(), T = [];
    for (const gi of Object.keys(O.GAMES)) {
      if (!O.aberto(gi)) continue;
      for (const sq of SQ_IDS) {
        if (!S.games[gi].squads[sq].on) continue;
        const c = O.compFor(gi, sq); if (!c) continue;
        T.push({ gi, sq, c, G: O.GAMES[gi], ag: O.agenda(gi, sq, 12), meu: O.forca(gi, sq), tag: `${O.GAMES[gi].icone} ${O.GAMES[gi].curto} · ${O.SQUADS[sq].nome.replace(/ \(.*\)/, '')}` });
      }
    }
    if (!T.length) return '<section class="card empty"><h2>Calendário</h2><p>Crie um time na aba Elenco para entrar no calendário.</p></section>';
    let h = `<section class="card"><div class="banner"><div><small>Calendário geral</small><br><b>${T.length} time${T.length > 1 ? 's' : ''} em competição</b></div><div><small>Semana ${S.org.semana}</small><br><b>${S.org.ano}</b></div></div>`
      + '<ul class="ag">' + T.map(x => `<li><span class="dt">${esc(x.tag)}</span><span class="lb">${esc(O.dataOf(x.gi).leagues[x.c.reg].nome)} · ${x.c.split ? 'Split ' + x.c.split : 'Pré-temporada'}<small>${FASE[x.c.phase](x.c)}</small></span></li>`).join('') + '</ul></section>';
    // próxima partida de cada time, da mais próxima para a mais distante
    const prox = T.map(x => ({ x, nx: x.ag.find(a => a.tipo === 'jogo' || a.tipo === 'po' || a.tipo === 'int') })).filter(r => r.nx).sort((a, b) => a.nx.em - b.nx.em);
    if (prox.length) {
      h += '<section class="card"><h2>Próximas partidas</h2>' + prox.map(({ x, nx }) => {
        const op = x.c.teams.find(t => !t.eu && O.nomeT(t) === nx.op), pw = op ? O.probVit(x.meu, op.f) : null;
        return `<div class="m"><span class="zb g">${esc(x.tag)}</span>${nx.tipo === 'jogo' ? '' : ' <span class="zb g">' + esc(nx.tipo === 'int' ? 'Internacional' : 'Mata-mata') + '</span>'}<div class="mt"><div class="tn">${logo(S.org.logo, 34)}<span>${esc(S.org.nome)}</span></div><div class="sc"><em>VS</em></div><div class="tn b">${op ? crest(op.n, 'md') : ''}<span>${esc(nx.op && op ? nx.op : nx.label)}</span></div></div>`
          + (pw !== null ? `<div class="od"><i style="flex:${Math.round(pw * 100)}"></i><i class="o2" style="flex:${Math.round((1 - pw) * 100)}"></i></div><div class="ol"><span>Chance de vitória <b>${Math.round(pw * 100)}%</b></span><span>Força ${x.meu.toFixed(1)} x ${op.f.toFixed(1)}</span></div>` : `<div class="ol"><span>${esc(nx.label)}</span><span>${nx.op ? esc(nx.op) : ''}</span></div>`)
          + `<div class="kv"><span>Data</span><b>${nx.data.txt} · ${nx.ano}</b></div><div class="kv"><span>Faltam</span><b>${nx.em} semana(s)</b></div></div>`;
      }).join('') + playCtl() + '</section>';
    } else h += `<section class="card">${playCtl()}</section>`;
    // mês atual com os jogos de todos os times
    const td = O.dataDe(S.org.semana, S.org.ano, 1), mes = td.m, n = O.MDN[mes], base = O.MDN.slice(0, mes).reduce((a, b) => a + b, 0), f = new Date(Date.UTC(S.org.ano, mes, 1)).getUTCDay();
    const evs = {}; T.forEach(x => x.ag.forEach(a => { if (a.ano === S.org.ano && a.data.m === mes) { const k = a.tipo === 'int' ? 'int' : 'ev'; if (evs[a.data.d] !== 'int') evs[a.data.d] = k; } }));
    const cells = []; for (let i = 0; i < f; i++) cells.push('<i></i>');
    for (let d = 1; d <= n; d++) { const past = base + d < td.doy; cells.push(`<span class="${base + d === td.doy ? 'td' : ''}${evs[d] ? ' ev ' + (evs[d] === 'int' ? 'int' : '') : ''}${past ? ' past' : ''}">${d}</span>`); }
    h += `<section class="card"><h2>Calendário</h2><p class="dbm">${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mes]} ${S.org.ano}</p><div class="dbcg">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<b>${x}</b>`).join('')}${cells.join('')}</div><p class="dblg"><span><i></i>Jogo</span><span><i class="t"></i>Internacional</span></p></section>`;
    // agenda unificada
    const ags = T.flatMap(x => x.ag.map(a => ({ ...a, tag: x.tag }))).sort((a, b) => a.em - b.em).slice(0, 16);
    h += '<section class="card"><h2>Agenda</h2><ul class="ag">' + ags.map(x => `<li><span class="dt">${x.data.txt}</span><span class="lb">${esc(x.label)}<small>${esc(x.tag)}${x.op ? ' · ' + (x.tipo === 'jogo' ? 'vs ' : '') + esc(x.op) : ''}</small></span><span class="em">em ${x.em} sem.</span></li>`).join('') + '</ul></section>';
    // resultados recentes de todos os jogos
    const rs = T.flatMap(x => x.c.last.map((m, i) => ({ m, tag: x.tag, i }))).sort((a, b) => (b.m.y - a.m.y) || (b.m.s - a.m.s) || (a.i - b.i)).slice(0, 10);
    if (rs.length) h += '<section class="card"><h2>Resultados</h2>' + rs.map(({ m, tag }) => { const [a, b2] = m.pl.split('-'); return `<div class="m"><div class="mt"><div class="tn ${m.v ? 'win' : 'lose'}">${logo(S.org.logo, 28)}<span>${esc(S.org.nome)}</span></div><div class="sc">${a}<i>-</i>${b2}</div><div class="tn b ${m.v ? 'lose' : 'win'}">${crest(m.op, 'sm')}<span>${esc(m.op)}</span></div></div><div class="ol"><span>${esc(tag)} · ${esc(m.f)}</span><span>${m.s}/${m.y}</span></div></div>`; }).join('') + '</section>';
    return h;
  }
  /* ---------- Avanço contínuo (para ao clicar em Parar ou quando surgir um evento importante) ---------- */
  const PL = { on: false, h: null, vel: 1, auto: (() => { try { return localStorage.getItem('esc-auto') === '1'; } catch (e) { return false; } })() }, VEL = [900, 450, 150], VELN = ['1x', '2x', '6x'];
  function playCtl() {
    return `<button class="btn play ${PL.on ? 'on' : ''}" data-act="play">${PL.on ? '⏸ Parar' : '▶ Avançar'}</button>
      <div class="chips" style="margin-top:8px;justify-content:center"><button class="chip ${PL.auto ? 'on' : ''}" data-act="auto" aria-pressed="${PL.auto}">⏩ Pular partidas</button></div>
      <div class="chips" style="margin-top:8px;justify-content:center">${VELN.map((n, i) => `<button class="chip ${PL.vel === i ? 'on' : ''}" data-act="vel" data-id="${i}">${n}</button>`).join('')}<button class="chip" data-act="avancar" data-n="1" ${PL.on ? 'disabled' : ''}>+1 semana</button></div>
      <p class="hint" style="text-align:center">${PL.auto ? 'Modo automático: não para nas suas partidas.' : 'Para na semana em que você tem partida (qualquer time seu) e mostra o confronto.'} Também para em eventos (contrato, fim de split, decisão...).</p>`;
  }
  function playStop(msg) { PL.on = false; clearTimeout(PL.h); if (msg) toast(msg); render(); }
  function playTick() {
    if (!PL.on || PT.on) return; const r = O.passo({ parar: !PL.auto });
    if (r.parou) { ptAbrir(r); return; }
    render();
    if (r.motivo || O.get().setup) playStop(r.motivo || ''); else PL.h = setTimeout(playTick, VEL[PL.vel]);
  }
  function playToggle() { if (PL.on) { playStop(); return; } if (PT.on) return; if (O.get().setup) return; PL.on = true; render(); PL.h = setTimeout(playTick, 120); }
  /* ---------- Partida: o avanço para quando o usuário joga; modal de confronto + simulação rápida narrada ---------- */
  const PT = { on: false, fila: [], i: 0, fase: 'pre', r: null, det: null, g: 0, p: 0, hold: 0, h: null };
  const PT_MS = { moba: 1500, rounds: 1700, ff: 1300, gols: 1800 }, PT_TICK = 70;
  const ptFmtTxt = d => { const f = O.GAMES[d.game] && ({ moba: 'jogos', rounds: 'mapas', ff: 'quedas', gols: 'jogos' })[d.fmt || ({ lol: 'moba', wr: 'moba', dota2: 'moba', cs2: 'rounds', valorant: 'rounds', r6: 'rounds', ff: 'ff', fifa: 'gols' })[d.game]];
    return d.bo > 1 ? `Melhor de ${d.bo} · ${f}` : ({ cs2: 'Mapa único', valorant: 'Mapa único', r6: 'Mapa único', ff: 'Partida de pontos da rodada' })[d.game] || 'Partida única'; };
  const ptAtual = () => (PT.det && PT.det[PT.i]) || PT.fila[PT.i];
  function ptConfronto(d, placar, res) { // reaproveita .m .mt .tn .sc .od .ol
    const S = O.get(), pw = d.p, cls = res == null ? ['', ''] : res ? ['win', 'lose'] : ['lose', 'win'];
    return `<div class="m"><span class="zb g">${esc(d.tag || '')}</span><div class="mt"><div class="tn ${cls[0]}">${logo(S.org.logo, 34)}<span>${esc(d.euNome)}</span></div><div class="sc" id="pt-sc">${placar || '<em>VS</em>'}</div><div class="tn b ${cls[1]}">${crest(d.op, 'md')}<span>${esc(d.op)}</span></div></div>`
      + `<div class="od"><i style="flex:${Math.round(pw * 100)}"></i><i class="o2" style="flex:${Math.round((1 - pw) * 100)}"></i></div><div class="ol"><span>Chance de vitória <b>${Math.round(pw * 100)}%</b></span><span>Força ${d.fMeu.toFixed(1)} x ${d.fOp.toFixed(1)}</span></div></div>`;
  }
  const ptPlacar = () => { const d = ptAtual(); if (!d || !d.nar) return ''; const n = d.nar; let a = 0, b = 0;
    n.jogos.forEach((j, k) => { if (PT.fase === 'fim' || k < PT.g || (k === PT.g && PT.p >= 1)) { if (j.venc === 'm') a++; else b++; } }); return `${a}<i>-</i>${b}`; };
  function ptValor(j, m, f) { // valor ao vivo de uma métrica do jogo j com o jogo f (0..1) concluído
    if (f >= 1) return [m.a, m.b];
    if (m.fixo) return null;
    if (m.seq) { const k = Math.round(j.seq.length * f), s = j.seq.slice(0, k), a = s.filter(x => x === 'm').length; return [a, s.length - a]; }
    if (m.gols) { const min = 90 * f, g = j.gols.filter(x => x[0] <= min); return [g.filter(x => x[1] === 'm').length, g.filter(x => x[1] === 'o').length]; }
    return [Math.floor(m.a * f), Math.floor(m.b * f)];
  }
  function ptLinha(j, f, done) {
    const ms = j.m.map(m => { const v = ptValor(j, m, f), w = done && j.venc; const cls = (x) => done && ((x === 'a' && j.venc === 'm') || (x === 'b' && j.venc === 'o')) ? ' w' : '';
      return `<div class="pgk"><span class="a${cls('a')}">${v ? v[0] : '·'}</span><small>${esc(m.n)}</small><span class="b${cls('b')}">${v ? v[1] : '·'}</span></div>`; }).join('');
    const s = j.seq ? Math.round(j.seq.length * f) : 0, dots = j.seq ? `<div class="dots" aria-hidden="true">${j.seq.slice(0, s).map(x => `<i class="${x}"></i>`).join('')}</div>` : '';
    const clock = j.gols && !done ? ` · ${Math.round(90 * f)}'` : '';
    return `<div class="pg ${done ? 'done' : 'now'}"><div class="pgh"><b>${esc(j.lbl)}</b><small>${esc(j.sub)}${clock}</small>${done ? `<span class="pgv ${j.venc === 'm' ? 'pos' : 'neg'}">${j.venc === 'm' ? (j.booyah ? 'Booyah!' : 'Vitória') : 'Derrota'}</span>` : ''}</div>${ms}${dots}</div>`;
  }
  function ptLive() {
    const d = ptAtual(), n = d && d.nar; if (!n) return '';
    const fim = PT.fase === 'fim', rows = n.jogos.map((j, k) => (!fim && k > PT.g) ? '' : ptLinha(j, fim || k < PT.g ? 1 : PT.p, fim || k < PT.g)).join('');
    const ms = n.momentos.filter(m => fim || m.g < PT.g || (m.g === PT.g && m.p <= PT.p));
    const feed = ms.length ? `<ul class="pf" aria-live="polite">${ms.map((m, k) => `<li class="${m.lado === 'm' ? 'me' : 'op'}${k === ms.length - 1 && !fim ? ' nw' : ''}"><i></i>${n.jogos.length > 1 ? `<small>${n.fmt === 'rounds' ? 'M' : 'J'}${m.g + 1}</small>` : ''}<span>${esc(m.txt)}</span></li>`).join('')}</ul>` : '';
    return rows + feed;
  }
  function ptResultado(d) {
    const n = d.nar, e = d.efeito || { caixa: 0, rep: 0, seg: 0 }, mv = n.mvp, sg = (x, f) => (x >= 0 ? '+' : '−') + f(Math.abs(x));
    const kv = [`<div class="kv"><span>Premiação</span><b class="${e.caixa > 0 ? 'pos' : ''}">${e.caixa > 0 ? '+' + O.money(e.caixa) : '—'}</b></div>`];
    if (Math.abs(e.rep) >= 0.005) kv.push(`<div class="kv"><span>Reputação</span><b class="${e.rep >= 0 ? 'pos' : 'neg'}">${sg(e.rep, x => x.toFixed(2).replace('.', ','))}</b></div>`);
    kv.push(`<div class="kv"><span>Torcida (seguidores)</span><b class="${e.seg >= 0 ? 'pos' : 'neg'}">${sg(e.seg * 100, x => x.toFixed(1).replace('.', ',') + '%')}</b></div>`);
    return `<div class="pt-res ${d.v ? 'w' : 'l'}"><b>${d.v ? 'Vitória' : 'Derrota'}</b><span>${d.meus} <i>-</i> ${d.deles}</span></div>`
      + `<div class="pt-mvp">${avatar(mv.n)}<div><small>⭐ MVP da partida</small><b>${esc(mv.n)}</b><small>${esc([mv.r, mv.time].filter(Boolean).join(' · '))} · ${esc(mv.stat)}</small></div></div>`
      + `<div class="pt-fx">${kv.join('')}${(d.notas || []).map(x => `<p class="hint">${esc(x)}</p>`).join('')}</div>`;
  }
  function ptHtml() {
    const d = ptAtual(), q = PT.fila.length, ult = PT.i >= q - 1;
    const topo = `<div class="pt-h"><div><small>${esc(d.tag || '')}</small><b>${esc(d.fase)}</b></div>${q > 1 ? `<span class="chip on pt-q">${PT.i + 1}/${q}</span>` : ''}</div>`;
    if (PT.fase === 'pre') return topo + `<p class="pt-mot">${esc(PT.motivo && q === 1 ? PT.motivo : `Partida: ${d.tag} vs ${d.op}`)}</p>` + ptConfronto(d) + `<p class="hint" style="text-align:center">${esc(ptFmtTxt(d))}</p>`
      + `<div class="pt-btns row"><button class="btn" data-act="p-sim">▶ Simular rápido</button><button class="btn alt" data-act="p-pular">⏭ Pular (só resultado)</button></div>`;
    if (PT.fase === 'sim') return topo + ptConfronto(d, ptPlacar()) + `<div id="pt-live">${ptLive()}</div><div class="pt-btns"><button class="btn alt" data-act="p-pular">⏭ Pular animação</button></div>`;
    return topo + ptConfronto(d, ptPlacar(), d.v) + `<div id="pt-live">${ptLive()}</div>` + ptResultado(d) + `<div class="pt-btns"><button class="btn" data-act="p-cont">${ult ? 'Continuar' : `Próxima partida (${PT.i + 2}/${q})`}</button></div>`;
  }
  function ptDesenha() {
    let m = $('partida'); if (!PT.on) { if (m) m.remove(); return; }
    if (!m) { m = document.createElement('div'); m.id = 'partida'; document.body.appendChild(m); }
    m.innerHTML = `<div class="mbox pt" role="dialog" aria-modal="true" aria-label="Partida">${ptHtml()}</div>`;
    const bx = m.firstChild; if (PT.fase === 'fim') bx.scrollTop = 0;
  }
  function ptAbrir(r) { PT.on = true; PT.fila = r.partidas; PT.motivo = r.motivo; PT.i = 0; PT.fase = 'pre'; PT.r = null; PT.det = null; PT.g = 0; PT.p = 0; clearTimeout(PL.h); ptDesenha(); }
  function ptResolve() { // resolve a semana de verdade uma única vez (o resultado vem do motor); a fila usa os detalhes devolvidos
    if (PT.r) return; PT.r = O.passo(); PT.det = PT.fila.map(f => PT.r.partidas.find(x => x.key === f.key) || f);
  }
  function ptParar() { clearInterval(PT.h); PT.h = null; }
  function ptTick() {
    const d = ptAtual(), n = d && d.nar; if (!PT.on || PT.fase !== 'sim' || !n) return ptParar();
    if (PT.hold > 0) { if (--PT.hold === 0) { PT.g++; PT.p = 0; if (PT.g >= n.jogos.length) { ptParar(); PT.fase = 'fim'; ptDesenha(); return; } } }
    else { PT.p = Math.min(1, PT.p + PT_TICK / PT_MS[n.fmt]); if (PT.p >= 1) PT.hold = 5; }
    const lv = $('pt-live'), sc = $('pt-sc'); if (lv) lv.innerHTML = ptLive(); if (sc) sc.innerHTML = ptPlacar();
  }
  function ptSim() { ptResolve(); if (!ptAtual().nar) return ptCont(); PT.fase = 'sim'; PT.g = 0; PT.p = 0; PT.hold = 0; ptDesenha(); ptParar(); PT.h = setInterval(ptTick, PT_TICK); }
  function ptPular() { ptResolve(); ptParar(); if (!ptAtual().nar) return ptCont(); PT.fase = 'fim'; ptDesenha(); }
  function ptCont() {
    ptParar(); PT.i++;
    if (PT.i < PT.fila.length) { PT.fase = 'pre'; ptDesenha(); return; }
    PT.on = false; ptDesenha(); const r = PT.r, S = O.get(); render();
    if (PL.on && !(r && r.motivo) && !S.setup) PL.h = setTimeout(playTick, 250); else if (PL.on) playStop(r && r.motivo || ''); else if (r && r.motivo) toast(r.motivo);
  }
  const ptJogoAtual = () => { const d = PT.on && ptAtual(); if (d && O.GAMES[d.game]) UI.game = d.game; };   // as fichas abertas por cima do modal usam o jogo da partida
  function vEvento() {
    const S = O.get(); if (!S.evento) return '';
    const e = O.EVENTOS.find(x => x.id === S.evento.id);
    return `<section class="card ev"><h2>⚡ Evento</h2><p>${esc(e.txt)}</p><p class="hint">Expira em ${S.evento.sem} semanas.</p>` + e.ops.map((o, i) => `<button class="btn ${i ? 'alt' : ''}" style="margin-top:6px" data-act="evento" data-id="${i}">${esc(o.t)}</button>`).join('') + '</section>';
  }
  function vNegocios() {
    const S = O.get(), foco = [['nenhum', '😴 Normal', 'Sem efeito.'], ['treino', '🏋️ Treino', '+1 de força em todos os times e +25% de XP de treino dos jogadores.'], ['midia', '📣 Mídia', 'Seguidores crescem +2% por semana (R$ 3 mil/sem).']];
    let h = vEvento() + `<section class="card"><h2>🎯 Foco da semana</h2><div class="chips">${foco.map(([id, nm]) => `<button class="chip ${S.foco === id ? 'on' : ''}" data-act="foco" data-id="${id}">${nm}</button>`).join('')}</div><p class="hint">${foco.find(x => x[0] === S.foco)[2]}${S.buff ? ' Bootcamp ativo: +' + S.buff.f + ' de força por ' + S.buff.sem + ' sem.' : ''}</p></section>`;
    h += `<section class="card"><h2>📱 Redes sociais</h2><div class="kv"><span>Seguidores</span><b>${S.social.seg.toLocaleString('pt-BR')}</b></div><div class="kv"><span>Renda semanal (anúncios)</span><b class="pos">${O.money(O.rendaSocial())}</b></div><p class="hint">Vitórias e títulos fazem a base de fãs crescer.</p></section>`;
    h += `<section class="card"><h2>🤝 Patrocinadores (${S.patro.length}/3)</h2>` + (S.patro.map(x => `<div class="slot"><div class="who"><b>${esc(x.n)}</b><small>${x.sem} semanas restantes</small></div><b class="pos">${O.money(x.pay)}/sem</b></div>`).join('') || '<p class="hint">Nenhum patrocinador ainda.</p>') + '</section>';
    h += `<section class="card"><h2>Propostas</h2><p class="hint">Mudam a cada 6 semanas e pagam mais com reputação alta.</p>` + O.ofertas().map(o => `<div class="slot"><div class="who"><b>${esc(o.n)}</b><small>${o.sem} semanas</small></div><b>${O.money(o.pay)}/sem</b><button class="mini buy" data-act="patro" data-id="${o.id}" ${S.patro.length >= 3 ? 'disabled' : ''}>Fechar</button></div>`).join('') + '</section>';
    return h;
  }
  function vEstrutura() {
    const S = O.get(), eg = UI.estGame || UI.game, gn = O.GAMES[eg];
    const chipsJ = `<section class="card"><h2>🎮 Estrutura de qual jogo?</h2><div class="chips">` + Object.keys(O.GAMES).filter(k => O.GAMES[k].ativo).map(k => `<button class="chip ${k === eg ? 'on' : ''}" data-act="estgame" data-id="${k}">${O.GAMES[k].icone} ${O.GAMES[k].curto}</button>`).join('') + `</div><p class="hint">Gaming house, equipe de apoio e reforços valem só para o jogo escolhido (${esc(gn.curto)}). Seguidores e merch valem para a org toda.</p></section>`;
    const ativos = S.itens.map(x => `<div class="kv"><span>${esc(x.nome)}${x.g ? ' · ' + esc(O.GAMES[x.g].curto) : ''}</span><b>${x.f ? '+' + x.f + ' força · ' : ''}${x.pay ? '<span class="pos">' + O.money(x.pay) + '/sem</span> · ' : ''}${x.sem} sem</b></div>`).join('');
    const loja = `<section class="card"><h2>🛍️ Loja da semana</h2><p class="hint">O estoque muda a cada 4 semanas (próxima troca em ${4 - S.lojaSem}). Reforços somam no máximo +4 de força.</p>` +
      O.lojaItens().map(it => { const tem = O.itemAtivo(it, eg);
        return `<div class="slot infra"><div class="ic">${it.icone}</div><div class="who"><b>${it.nome}</b><small>${it.desc}</small></div><button class="mini buy" data-act="loja" data-id="${it.id}" data-g="${eg}" ${tem || S.org.caixa < it.c ? 'disabled' : ''}>${tem ? 'ATIVO' : O.money(it.c)}</button></div>`; }).join('') + '</section>' +
      (ativos ? `<section class="card"><h2>Ativos</h2>${ativos}</section>` : '');
    return chipsJ + loja + `<h2 class="sec">Instalações permanentes · ${esc(gn.curto)}</h2>` + `<section class="card"><div class="kv"><span>Bônus de força</span><b>+${O.infraBonus(eg).toFixed(1)}</b></div><div class="kv"><span>Manutenção semanal</span><b>${O.money(O.upkeepSemanal())}</b></div></section>` +
      O.INFRA.map(it => { const n = O.infraNivel(it.id, eg), max = n >= it.max, c = O.infraCusto(it, eg);
        return `<section class="card infra"><div class="ic">${it.icone}</div><div class="who"><b>${it.nome}</b><small>${it.desc}</small><div class="bar"><i style="width:${n / it.max * 100}%"></i></div><small>Nível ${n}/${it.max}${it.bonus ? ' · +' + it.bonus + ' de força por nível' : ''}</small></div>
          <button class="mini buy" data-act="infra" data-id="${it.id}" data-g="${eg}" ${max || S.org.caixa < c ? 'disabled' : ''}>${max ? 'MAX' : O.money(c)}</button></section>`; }).join('');
  }
  const FASE = { off: c => `Entretemporada: ${c.wk} sem. para o próximo split`, wait: () => 'Aguardando inscrição: complete os titulares', reg: c => `Próxima: rodada ${c.round + 1} de ${c.sched.length}`, po: () => 'Playoffs', intl: c => `${O.intlDef(c.game)[c.intl.tipo].nome}: ${c.intl.alive.length} times vivos` };
  function vComp() {
    const S = O.get(), q = S.games[UI.game].squads[UI.squad], d = O.SQUADS[UI.squad];
    if (!q.on) return `<section class="card empty"><h2>${d.nome}</h2><p>${d.semDados ? 'Ainda sem dados desta divisão.' : 'Crie este time na aba Elenco para entrar na competição.'}</p></section>`;
    const c = O.compFor(UI.game, UI.squad); if (!c) return '';
    const rows = O.classificacao(c), nome = i => esc(O.nome(c, i)), est = ['Quartas', 'Semifinal', 'Final'];
    let h = `<section class="card"><h2>${c.split ? 'Split ' + c.split : 'Pré-temporada'} · ${DG().leagues[c.reg].nome} ${O.SQUADS[UI.squad].nome}</h2><p class="hint">${FASE[c.phase](c)}</p>`;
    if (c.phase === 'wait') h += `<p class="warn">Faltam titulares: contrate no Mercado.</p>`;
    h += rows.map(r => `<div class="tb ${r.eu ? 'eu' : ''} ${r.pos === 6 ? 'cut' : ''}"><span>${r.pos}</span>${crestT(c, r.i)}<b>${esc(r.n)}</b><em>${r.w}V ${r.l}D</em></div>`).join('') + '<p class="hint">Os 6 primeiros vão aos playoffs.</p></section>';
    if (c.phase === 'po' && c.po) {
      const cols = est.map((t, st) => ({ t, m: c.po.res.filter(r => r.st === st).map(r => ({ a: O.nome(c, r.a), b: O.nome(c, r.b), w: O.nome(c, r.w), ca: crestT(c, r.a), cb: crestT(c, r.b) }))
        .concat(c.po.stage === st ? c.po.pares.map(([a, b]) => ({ a: O.nome(c, a), b: O.nome(c, b), p: 1, ca: crestT(c, a), cb: crestT(c, b) })) : []) })).filter(k => k.m.length);
      h += `<section class="card wide"><h2>Playoffs</h2>${bracket(cols)}</section>`;
    }
    if (c.phase === 'intl' && c.intl) {
      const I = c.intl, nm = i => O.nomeT(I.teams[i]), ordem = [], by = {};
      I.res.forEach(r => { if (!by[r.st]) { by[r.st] = []; ordem.push(r.st); } by[r.st].push({ a: nm(r.a), b: nm(r.b), w: nm(r.w), ea: I.teams[r.a].eu, eb: I.teams[r.b].eu }); });
      const pend = I.alive.length > 1 ? I.alive.filter((_, k) => k % 2 === 0).map((a, k) => ({ a: nm(a), b: nm(I.alive[2 * k + 1]), p: 1, ea: I.teams[a].eu, eb: I.teams[I.alive[2 * k + 1]].eu })) : [];
      const cols = ordem.slice(-3).map(t => ({ t, m: by[t] })); if (pend.length) cols.push({ t: 'A jogar', m: pend });
      h += `<section class="card wide"><h2>🌍 ${O.intlDef(c.game)[I.tipo].nome}</h2><p class="hint">${I.teams.length} times · bolsa ${O.money(O.intlDef(c.game)[I.tipo].bolsa)}</p>${bracket(cols)}</section>`;
    }
    if (c.last.length) h += `<section class="card"><h2>Seus últimos jogos</h2>` + c.last.slice(0, 6).map(m => `<div class="tb"><span>${m.v ? '✅' : '❌'}</span>${crest(m.op)}<b>vs ${esc(m.op)}</b><em>${m.pl} · ${esc(m.f)}</em></div>`).join('') + '</section>';
    const ih = (S.intlHist || []).filter(x => (x.g || 'lol') === UI.game); if (ih.length && UI.squad === 't1') h += `<section class="card"><h2>Títulos internacionais</h2>` + ih.slice(0, 6).map(x => `<div class="tb"><span>${x.y}</span><b>🌍 ${esc(x.nome || (x.tipo === 'MSI' ? 'MSI' : 'Mundial'))}: ${esc(x.camp)}</b><em>${x.eu === 'campeao' ? 'você!' : x.eu ? 'você: ' + x.eu : esc(x.reg || '')}</em></div>`).join('') + '</section>';
    if (c.hist.length) h += `<section class="card"><h2>Campeões</h2>` + c.hist.slice(0, 5).map(x => `<div class="tb"><span>${x.y}</span><b>🏆 ${esc(x.camp)}</b><em>${x.eu === 'campeao' ? 'você!' : x.eu ? 'você: ' + x.eu : ''}</em></div>`).join('') + '</section>';
    return h;
  }
  function vLigas() {
    const g = gameGuard(); if (g) return g;
    const S = O.get(), L = DG().leagues, mineK = O.regiaoDe(UI.game), ver = UI.ligaVer && L[UI.ligaVer] ? UI.ligaVer : mineK;
    const sel = `<div class="chips">${Object.keys(L).map(k => `<button class="chip ${k === ver ? 'on' : ''}" data-act="liga" data-id="${k}">${L[k].nome}</button>`).join('')}</div>`;
    return squadTabs() + vComp() + '<h3 class="sec">Explorar ligas</h3>' + sel
      + `<section class="card"><h2>${L[ver].nome} · ${L[ver].regiao}</h2>` + (() => { const mine = ver === mineK, Lg = mine ? O.ligaSync(UI.game) : null, t1 = mine ? Lg.d1 : L[ver].t1, t2 = mine ? Lg.d2 : L[ver].t2; return '<h3>T1</h3>' + t1.map(t => timeRow(ver, 1, t)).join('') + '<h3>T2</h3>' + (t2.map(t => timeRow(ver, 2, t)).join('') || '<p class="hint">Sem times.</p>'); })() + '</section>';
  }
  function timeRow(lg, tier, t) {
    const key = lg + tier + t.n, open = UI.aberto === key;
    const f = t.p ? (t.p.reduce((a, p) => a + p[1], 0) / t.p.length).toFixed(1) : '—';
    const roles = DG().roles;
    return `<div class="team"><button data-act="time" data-id="${esc(key)}">${crest(t.n)}<b data-act="ficha" data-id="${esc(t.n)}">${esc(t.n)}</b><em>${f} ${open ? '▴' : '▾'}</em></button>${open ? `<div class="ros">${(t.p || []).map((p, i) => `<span><i class="role ri${i}">${roles[i]}</i>${bandeira(p[0])}<a href="#" data-act="ficha" data-id="p:${esc(p[0])}">${esc(p[0])}</a> <small>${p[2] == null ? '—' : p[2] + 'a'}</small> <em>${p[1]}</em></span>`).join('') || '<small>Elenco ainda não cadastrado.</small>'}<button class="mini" data-act="ficha" data-id="${esc(t.n)}">📋 Ficha do time</button></div>` : ''}</div>`;
  }

  /* ---------- Render e eventos ---------- */
  const VIEWS = { calendario: vCalendario, negocios: vNegocios, org: vOrg, elenco: vElenco, mercado: vMercado, estrutura: vEstrutura, ligas: vLigas, hall: vHall };
  function render() { header(); const sc = $('main').scrollTop; $('main').innerHTML = O.get().setup ? vSetup() : VIEWS[UI.tab](); $('main').scrollTop = sc; modal(); const yc = document.querySelector('.yrc .chip.on'); if (yc) { const w = yc.parentNode; w.scrollLeft = yc.offsetLeft - (w.clientWidth - yc.offsetWidth) / 2; } }

  document.addEventListener('click', e => {
    const tn = e.target.closest('.tn > span:not(.crest):not(.logo)'); // nome do time nos confrontos abre a ficha
    if (tn && !e.target.closest('[data-act]')) { const nm = tn.textContent.trim(); if (nm && nm !== O.get().org.nome) { ptJogoAtual(); UI.ficha = nm; render(); } return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id, S = O.get();
    if (a === 'play') playToggle();
    else if (a === 'p-sim') ptSim();
    else if (a === 'p-pular') ptPular();
    else if (a === 'p-cont') ptCont();
    else if (a === 'auto') { PL.auto = !PL.auto; try { localStorage.setItem('esc-auto', PL.auto ? '1' : '0'); } catch (e) {} render(); }
    else if (a === 'ficha') { ptJogoAtual(); UI.ficha = id; render(); }
    else if (a === 'fecha') { UI.ficha = null; render(); }
    else if (a === 'hall') { UI.hall = id; render(); }
    else if (a === 'hfil') { UI.hf = id; render(); }
    else if (a === 'hy') { if (id) UI.hy = +id; render(); }
    else if (a === 'vel') { PL.vel = +id; render(); }
    else if (a === 'lg-rm') { const l = S.setup === 'config' ? SU.logo : S.org.logo; delete l.img; delete l.raw; delete l.src; delete l.proc; l.cut = false; O.save(); render(); }
    else if (a === 'lg-cut') { const l = S.setup === 'config' ? SU.logo : S.org.logo; l.cut = !l.cut; l.img = l.cut ? l.proc : l.raw; O.save(); render(); }
    else if (a === 'lg') { const l = S.setup === 'config' ? SU.logo : S.org.logo; l[b.dataset.k] = id; O.save(); render(); }
    else if (a === 'su-next') { SU.nome = ($('su-nome') || {}).value || SU.nome; SU.step = 2; render(); }
    else if (a === 'su-back') { SU.step = 1; render(); }
    else if (a === 'su-game') { SU.game = id; SU.regiao = null; render(); }
    else if (a === 'su-reg') { SU.regiao = id; render(); }
    else if (a === 'su-go') { const r = O.iniciar({ nome: SU.nome, logo: SU.logo, game: SU.game, regiao: SU.regiao }); UI.game = SU.game; UI.squad = 't1'; res(r); }
    else if (a === 'su-role') { SU.role = id; SU.n = 24; render(); }
    else if (a === 'su-mais') { SU.n += 24; render(); }
    else if (a === 'su-sem') { res(O.semEstrela()); UI.tab = 'org'; }
    else if (a === 'su-convite') { const p = O.pool(S.inicio).find(x => x.id === id); if (p) { const r = O.convidarEstrela(p); res(r); if (r.ok) UI.tab = 'org'; } }
    else if (a === 'abrirjogo') res(O.abrirJogo(UI.game));
    else if (a === 'tab') { UI.tab = id; UI.resetArm = false; $('main').scrollTop = 0; render(); }
    else if (a === 'game') { UI.game = id; UI.ligaVer = null; UI.aberto = null; UI.mk = { role: '', liga: '', q: '', n: 30, pay: false, asc: false }; render(); }
    else if (a === 'squad') { UI.squad = id; render(); }
    else if (a === 'ativar') res(O.ativarSquad(UI.game, UI.squad));
    else if (a === 'dispensar') res(O.dispensar(UI.game, UI.squad, +b.dataset.slot));
    else if (a === 'contratar') { const p = O.pool(UI.game).find(x => x.id === id); if (p) res(O.contratar(UI.game, UI.squad, p)); }
    else if (a === 'ren-abrir') { const sl = +b.dataset.slot; UI.ren = UI.ren && UI.ren.slot === sl ? null : { slot: sl, anos: 2, oferta: 'justa' }; render(); }
    else if (a === 'ren-anos') { UI.ren.anos = +id; render(); }
    else if (a === 'ren-of') { UI.ren.oferta = id; render(); }
    else if (a === 'ren-ok') { const r = O.renovar(UI.game, UI.squad, +b.dataset.slot, UI.ren.oferta, UI.ren.anos); if (r.ok) UI.ren = null; res(r); }
    else if (a === 'foco-j') { const sq = b.dataset.sq, ref = b.dataset.id || b.dataset.slot, p = sq === 'base' ? (S.base[UI.game] || []).find(x => x.id === ref) : S.games[UI.game].squads[sq].slots[+ref], ids = Object.keys(O.FOCOS); if (p) res(O.trocarFoco(UI.game, sq, ref, ids[(ids.indexOf(p.foco) + 1) % ids.length])); }
    else if (a === 'foco-all') res(O.focoEquipe(UI.game, UI.squad, id));
    else if (a === 'vender') { const k = 'v' + b.dataset.slot; if (UI.arm === k) { UI.arm = null; res(O.vender(UI.game, UI.squad, +b.dataset.slot)); } else { UI.arm = k; clearTimeout(UI.armH); UI.armH = setTimeout(() => { UI.arm = null; if (UI.tab === 'elenco') render(); }, 3000); render(); } }
    else if (a === 'base-v') { const k = 'bv' + id; if (UI.arm === k) { UI.arm = null; res(O.venderBase(UI.game, id)); } else { UI.arm = k; clearTimeout(UI.armH); UI.armH = setTimeout(() => { UI.arm = null; if (UI.tab === 'elenco') render(); }, 3000); render(); } }
    else if (a === 'base-d') res(O.dispensarBase(UI.game, id));
    else if (a === 'mover') res(O.mover(UI.game, UI.squad, id, +b.dataset.slot));
    else if (a === 'base') res(O.promoverBase(UI.game, UI.squad, id));
    else if (a === 'foco') res(O.setFoco(id));
    else if (a === 'patro') res(O.aceitarPatro(id));
    else if (a === 'evento') res(O.escolherEvento(+id));
    else if (a === 'estgame') { UI.estGame = id; render(); }
    else if (a === 'infra') res(O.comprarInfra(id, b.dataset.g || UI.game));
    else if (a === 'loja') res(O.comprarLoja(id, b.dataset.g || UI.game));
    else if (a === 'avancar') {
      if (+b.dataset.n === 1 && !PL.auto && !PT.on) { const r = O.passo({ parar: true }); if (r.parou) { ptAbrir(r); return; } toast(r.motivo || '1 semana passou.'); render(); return; }
      O.avancar(+b.dataset.n); toast(+b.dataset.n + ' semana(s) passaram.'); render(); }
    else if (a === 'mrole') { UI.mk.role = id; UI.mk.n = 30; render(); }
    else if (a === 'mpay') { UI.mk.pay = !UI.mk.pay; UI.mk.n = 30; render(); }
    else if (a === 'masc') { UI.mk.asc = !UI.mk.asc; UI.mk.n = 30; render(); }
    else if (a === 'mais') { UI.mk.n += 30; render(); }
    else if (a === 'liga') { UI.ligaVer = id; UI.aberto = null; render(); }
    else if (a === 'time') { UI.aberto = UI.aberto === id ? null : id; render(); }
    else if (a === 'reset') { if (UI.resetArm) { playStop(); O.reset(); SU.step = 1; SU.nome = ''; UI.resetArm = false; toast('Jogo zerado.'); } else { UI.resetArm = true; setTimeout(() => { UI.resetArm = false; if (UI.tab === 'org') render(); }, 3000); } render(); }
  });
  /* Remove o fundo (preenche a partir das bordas com a cor mais parecida com a do canto) e desenha contorno branco em volta */
  function recortar(srcUrl, tol) {
    return new Promise(ok => { const im = new Image(); im.onload = () => {
      const n = 256, M = 14, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d', { willReadFrequently: true });
      const k = Math.min((n - 2 * M) / im.width, (n - 2 * M) / im.height); x.drawImage(im, (n - im.width * k) / 2, (n - im.height * k) / 2, im.width * k, im.height * k);
      const d = x.getImageData(0, 0, n, n), px = d.data, bg = new Uint8Array(n * n), dist = (i, r, g, b) => Math.hypot(px[i] - r, px[i + 1] - g, px[i + 2] - b);
      // cor do fundo = mediana da borda do desenho (ignora margens transparentes)
      const bor = []; for (let t = 0; t < n; t++) for (const [xx, yy] of [[t, M], [t, n - M - 1], [M, t], [n - M - 1, t]]) { const i = (yy * n + xx) * 4; if (px[i + 3] > 200) bor.push([px[i], px[i + 1], px[i + 2]]); }
      const med = ch => { const v = bor.map(p => p[ch]).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : 255; }, R0 = med(0), G0 = med(1), B0 = med(2);
      const st = []; const isBg = i => px[i + 3] < 40 || dist(i, R0, G0, B0) < tol;
      for (let t = 0; t < n; t++) for (const p of [t, (n - 1) * n + t, t * n, t * n + n - 1]) if (!bg[p] && isBg(p * 4)) { bg[p] = 1; st.push(p); }
      while (st.length) { const p = st.pop(), px0 = p % n, py0 = (p / n) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = px0 + dx, yy = py0 + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue; const q = yy * n + xx; if (!bg[q] && isBg(q * 4)) { bg[q] = 1; st.push(q); } } }
      // tira o "halo": pixels de borda parecidos com o fundo também saem (1 passada)
      const bg2 = bg.slice(); for (let yy = 1; yy < n - 1; yy++) for (let xx = 1; xx < n - 1; xx++) { const p = yy * n + xx; if (!bg[p] && (bg[p - 1] || bg[p + 1] || bg[p - n] || bg[p + n]) && dist(p * 4, R0, G0, B0) < tol * 1.9) bg2[p] = 1; }
      for (let p = 0; p < n * n; p++) if (bg2[p]) px[p * 4 + 3] = 0;
      x.putImageData(d, 0, 0);
      const sil = document.createElement('canvas'); sil.width = sil.height = n; const sx = sil.getContext('2d'); sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, n, n);
      const o = document.createElement('canvas'); o.width = o.height = n; const ox = o.getContext('2d'), r = 7;
      for (let a = 0; a < 32; a++) ox.drawImage(sil, Math.cos(a * Math.PI / 16) * r, Math.sin(a * Math.PI / 16) * r);
      ox.drawImage(c, 0, 0); let u = o.toDataURL('image/webp', 0.9); if (!u.startsWith('data:image/webp')) u = o.toDataURL('image/png'); ok(u); };
      im.onerror = () => ok(null); im.src = srcUrl; });
  }
  function lerLogo(file) { // guarda a original reduzida e já gera a versão sem fundo + contorno branco
    if (!file || !/^image\//.test(file.type)) { toast('Escolha um arquivo de imagem.'); return; }
    if (file.size > 8e6) { toast('Imagem grande demais (máx. 8 MB).'); return; }
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = async () => {
      const mk = (n, crop) => { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), m = Math.min(im.width, im.height);
        if (crop) x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, n, n); else { const k = Math.min(n / im.width, n / im.height); x.drawImage(im, (n - im.width * k) / 2, (n - im.height * k) / 2, im.width * k, im.height * k); }
        let u = c.toDataURL('image/webp', 0.85); return u.startsWith('data:image/webp') ? u : c.toDataURL('image/png'); };
      const l = O.get().setup === 'config' ? SU.logo : O.get().org.logo; l.raw = mk(128, true); l.src = mk(256, false); l.tol = l.tol || 45;
      l.proc = await recortar(l.src, l.tol); l.cut = !!l.proc; l.img = l.cut ? l.proc : l.raw; O.save(); render(); toast(l.cut ? 'Fundo removido e contorno branco aplicado.' : 'Logo atualizado.'); };
      im.onerror = () => toast('Não consegui abrir essa imagem.'); im.src = fr.result; };
    fr.readAsDataURL(file);
  }
  document.addEventListener('change', e => {
    if (e.target.id === 'logo-tol') { const l = O.get().setup === 'config' ? SU.logo : O.get().org.logo; l.tol = +e.target.value; recortar(l.src, l.tol).then(u => { if (u) { l.proc = u; if (l.cut) l.img = u; O.save(); render(); } }); return; }
    if (e.target.id === 'logo-file') { lerLogo(e.target.files[0]); e.target.value = ''; return; }
    if (e.target.id === 'regiao') { O.trocarRegiao(e.target.value, UI.game); UI.ligaVer = null; toast('Região trocada: competições deste jogo reiniciadas.'); render(); }
    else if (e.target.id === 'mliga') { UI.mk.liga = e.target.value; UI.mk.n = 30; render(); }
    else if (e.target.id === 'orgnome') { O.get().org.nome = e.target.value.trim() || 'Minha Org'; O.save(); header(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'su-nome') { SU.nome = e.target.value; header(); }
    else if (e.target.id === 'su-q') { SU.q = e.target.value; SU.n = 24; const pos = e.target.selectionStart; render(); const el = $('su-q'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
    else if (e.target.id === 'mq') { UI.mk.q = e.target.value; UI.mk.n = 30; const pos = e.target.selectionStart; render(); const el = $('mq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
  });

  if (!O.load()) O.comecar();
  UI.game = O.get().inicio || 'lol';
  render();
  UI.__logo = () => (O.get().setup === 'config' ? SU.logo : O.get().org.logo);
  window.OrgUI = UI;
})();

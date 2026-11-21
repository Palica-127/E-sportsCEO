/* Interface: barra superior, seletor de jogo, 5 abas e navegação inferior. Re-renderiza a aba atual a cada mudança. */
(function () {
  'use strict';
  const O = window.Org;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = { tab: 'org', game: 'lol', squad: 't1', mk: { role: '', liga: '', q: '', n: 30, pay: false, asc: false }, ligaVer: null, aberto: null, resetArm: false };

  const TABS = [['org', '🏢', 'Início'], ['calendario', '📅', 'Calendário'], ['elenco', '👥', 'Elenco'], ['mercado', '🛒', 'Mercado'], ['estrutura', '🏠', 'Estrutura'], ['negocios', '📣', 'Negócios'], ['ligas', '🏆', 'Torneios']];

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
        return `<div class="slot"><span class="role ri${Math.max(0, roles.indexOf(p.r))}">${p.r}</span><div class="who"><b>${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos · aceita: ${pc(ch)}</small></div><span class="ovr">${p.o}</span><button class="mini buy" data-act="su-convite" data-id="${p.id}">${O.money(O.salarioDe({ o: p.o, estrela: true }))}/sem</button></div>`; }).join('')
      + (lista.length > SU.n ? '<button class="btn alt" data-act="su-mais">Mostrar mais</button>' : '') + '</section>';
  }
  const hue = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const ini = t => { const w = (String(t).match(/[A-Za-zÀ-ÿ0-9]+/g) || ['?']); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 3)).toUpperCase(); };
  const slug = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const crest = (n, sz) => { const sl = slug(n); return window.LOGOS && window.LOGOS.has(sl)
    ? `<span class="crest ${sz || 'sm'} real"><img src="logos/${sl}.webp" alt="${esc(n)}" loading="lazy" decoding="async"></span>`
    : `<span class="crest ${sz || 'sm'}" style="--h:${hue(n)}">${esc(ini(n))}</span>`; };
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
      <div class="kv"><span>Folha semanal</span><b>${O.money(O.folha(UI.game, UI.squad))}</b></div></section><section class="card"><h2>Titulares</h2>`;
    h += q.slots.map((p, i) => {
      const nT = roles.length, titulo = i < nT ? roles[i] : 'RES', cls = i < nT ? 'ri' + i : 'ri9';
      return `<div class="slot">${p ? `<span class="role ${cls}">${titulo}</span><div class="who"><b>${p.estrela ? '⭐ ' : ''}${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos${p.pot ? ' · pot. ' + p.pot : ''}</small><small class="${p.ct <= 8 ? 'neg' : ''}">⏳ ${p.ct === undefined ? O.CONTRATO : p.ct} sem. de contrato</small><div class="acts"><button class="mini" data-act="renovar" data-slot="${i}">Renovar ${O.money(O.custoRenovar(p))}</button>${['t1', 't2', 'acad'].filter(x => x !== UI.squad && S.games[UI.game].squads[x].on).map(x => `<button class="mini" data-act="mover" data-slot="${i}" data-id="${x}">→ ${x === 'acad' ? 'Academy' : x.toUpperCase()}</button>`).join('')}</div></div><span class="ovr">${p.o}</span>${p.estrela ? '' : `<button class="mini" data-act="dispensar" data-slot="${i}" aria-label="Dispensar ${esc(p.n)}">✕</button>`}`
        : `<span class="role ${cls} off">${titulo}</span><div class="who"><small>Vaga aberta</small></div>`}</div>${i === nT - 1 ? '</section><section class="card"><h2>Reservas</h2>' : ''}`;
    }).join('') + '</section>';
    const bs = (S.base || {})[UI.game] || [];
    h += `<section class="card"><h2>🌱 Base</h2>` + (O.infraNivel('base') ? '' : '<p class="hint">Compre a Categoria de base na aba Estrutura para revelar jovens.</p>')
      + bs.map(p => `<div class="slot"><span class="role ri${Math.max(0, roles.indexOf(p.r))}">${p.r}</span><div class="who"><b>${esc(p.n)}</b><small>${p.a} anos · potencial ${p.pot}</small></div><span class="ovr">${p.o}</span><button class="mini buy" data-act="base" data-id="${p.id}">Promover</button></div>`).join('') + '</section>';
    return h;
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
        <div class="who"><b>${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos · ${O.money(O.salary(p.o))}/sem</small></div><span class="ovr">${p.o}</span>
        <button class="mini buy" data-act="contratar" data-id="${p.id}" ${S.org.caixa >= O.fee(p.o) ? '' : 'disabled'}>${O.money(O.fee(p.o))}</button></div>`).join('')
      + (tot > m.n ? `<button class="btn alt" data-act="mais">Mostrar mais</button>` : '') + '</section>';
  }
  function trilha(c, sq) {
    const intlNome = sq === 't1' ? (c.phase === 'intl' ? O.intlDef(c.game)[c.intl.tipo].nome : (Object.values(O.intlDef(c.game))[(c.split % 2 === 1 ? 0 : 1)] || {}).nome) : null;
    const et = ['Pré-split', 'Fase regular', 'Playoffs', intlNome || 'Fim do split', 'Entressafra'];
    let now = c.phase === 'reg' ? 1 : c.phase === 'po' ? 2 : c.phase === 'intl' ? 3 : (c.split > 0 && c.phase === 'off' ? 4 : 0);
    return `<ul class="trk">${et.map((t, i) => `<li class="${i < now ? 'done' : i === now ? 'now' : ''}"><i></i>${esc(t)}</li>`).join('')}</ul>`;
  }
  function vCalendario() {
    const g = gameGuard(); if (g) return g;
    const S = O.get(), q = S.games[UI.game].squads[UI.squad];
    let h = squadTabs();
    if (!q.on) return h + `<section class="card empty"><h2>${O.SQUADS[UI.squad].nome}</h2><p>Crie este time na aba Elenco para entrar no calendário.</p></section>`;
    const c = O.compFor(UI.game, UI.squad); if (!c) return h;
    const ag = O.agenda(UI.game, UI.squad, 10), eu = c.teams.findIndex(t => t.eu), meu = O.forca(UI.game, UI.squad);
    const lg = O.dataOf(UI.game).leagues[c.reg];
    h += `<section class="card"><div class="banner"><div><small>${esc(O.GAMES[UI.game].nome)} · ${esc(lg.nome)}</small><br><b>${c.split ? 'Split ' + c.split : 'Pré-temporada'}</b></div><div><small>${O.SQUADS[UI.squad].nome.replace(/ \(.*\)/, '')}</small><br><b>${S.org.ano}</b></div></div>${trilha(c, UI.squad)}<p class="hint">${FASE[c.phase](c)}</p></section>`;
    const nx = ag.find(x => x.tipo === 'jogo' || x.tipo === 'po' || x.tipo === 'int');
    if (nx) {
      const op = c.teams.find(t => !t.eu && O.nomeT(t) === nx.op), pw = op ? O.probVit(meu, op.f) : null;
      h += `<section class="card"><h2>Próxima partida</h2><div class="m">${nx.tipo === 'jogo' ? '' : '<span class="zb g">' + esc(nx.tipo === 'int' ? 'Internacional' : 'Mata-mata') + '</span>'}<div class="mt"><div class="tn">${logo(S.org.logo, 34)}<span>${esc(S.org.nome)}</span></div><div class="sc"><em>VS</em></div><div class="tn b">${op ? crest(op.n, 'md') : ''}<span>${esc(nx.op && op ? nx.op : nx.label)}</span></div></div>`
        + (pw !== null ? `<div class="od"><i style="flex:${Math.round(pw * 100)}"></i><i class="o2" style="flex:${Math.round((1 - pw) * 100)}"></i></div><div class="ol"><span>Chance de vitória <b>${Math.round(pw * 100)}%</b></span><span>Força ${meu.toFixed(1)} x ${op.f.toFixed(1)}</span></div>` : `<div class="ol"><span>${esc(nx.label)}</span><span>${nx.op ? esc(nx.op) : ''}</span></div>`)
        + `</div><div class="kv"><span>Data</span><b>${nx.data.txt} · ${nx.ano}</b></div><div class="kv"><span>Faltam</span><b>${nx.em} semana(s)</b></div>${playCtl()}</section>`;
    }
    // mês atual
    const td = O.dataDe(S.org.semana, S.org.ano, 1), mes = td.m, n = O.MDN[mes], base = O.MDN.slice(0, mes).reduce((a, b) => a + b, 0), f = new Date(Date.UTC(S.org.ano, mes, 1)).getUTCDay();
    const evs = {}; ag.forEach(x => { if (x.ano === S.org.ano && x.data.m === mes) evs[x.data.d] = x.tipo === 'int' ? 'int' : 'ev'; });
    const cells = []; for (let i = 0; i < f; i++) cells.push('<i></i>');
    for (let d = 1; d <= n; d++) { const past = base + d < td.doy; cells.push(`<span class="${base + d === td.doy ? 'td' : ''}${evs[d] ? ' ev ' + (evs[d] === 'int' ? 'int' : '') : ''}${past ? ' past' : ''}">${d}</span>`); }
    h += `<section class="card"><h2>Calendário</h2><p class="dbm">${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mes]} ${S.org.ano}</p><div class="dbcg">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<b>${x}</b>`).join('')}${cells.join('')}</div><p class="dblg"><span><i></i>Jogo</span><span><i class="t"></i>Internacional</span></p></section>`;
    h += `<section class="card"><h2>Agenda</h2><ul class="ag">` + (ag.map(x => `<li><span class="dt">${x.data.txt}</span><span class="lb">${esc(x.label)}${x.op ? `<small>${x.tipo === 'jogo' ? 'vs ' : ''}${esc(x.op)}</small>` : ''}</span><span class="em">em ${x.em} sem.</span></li>`).join('') || '<li><span class="lb">Nada agendado.</span></li>') + '</ul></section>';
    if (c.last.length) h += `<section class="card"><h2>Resultados</h2>` + c.last.slice(0, 5).map(m => { const [a, b2] = m.pl.split('-'); return `<div class="m"><div class="mt"><div class="tn ${m.v ? 'win' : 'lose'}">${logo(S.org.logo, 28)}<span>${esc(S.org.nome)}</span></div><div class="sc">${a}<i>-</i>${b2}</div><div class="tn b ${m.v ? 'lose' : 'win'}">${crest(m.op, 'sm')}<span>${esc(m.op)}</span></div></div><div class="ol"><span>${esc(m.f)}</span><span>${m.s}/${m.y}</span></div></div>`; }).join('') + '</section>';
    return h;
  }
  /* ---------- Avanço contínuo (para ao clicar em Parar ou quando surgir um evento importante) ---------- */
  const PL = { on: false, h: null, vel: 1 }, VEL = [900, 450, 150], VELN = ['1x', '2x', '6x'];
  function playCtl() {
    return `<button class="btn play ${PL.on ? 'on' : ''}" data-act="play">${PL.on ? '⏸ Parar' : '▶ Avançar'}</button>
      <div class="chips" style="margin-top:8px;justify-content:center">${VELN.map((n, i) => `<button class="chip ${PL.vel === i ? 'on' : ''}" data-act="vel" data-id="${i}">${n}</button>`).join('')}<button class="chip" data-act="avancar" data-n="1" ${PL.on ? 'disabled' : ''}>+1 semana</button></div>
      <p class="hint" style="text-align:center">Avança sozinho até você parar ou surgir um evento (contrato, fim de split, decisão...).</p>`;
  }
  function playStop(msg) { PL.on = false; clearTimeout(PL.h); if (msg) toast(msg); render(); }
  function playTick() {
    if (!PL.on) return; const r = O.passo(); render();
    if (r.motivo || O.get().setup) playStop(r.motivo || ''); else PL.h = setTimeout(playTick, VEL[PL.vel]);
  }
  function playToggle() { if (PL.on) { playStop(); return; } if (O.get().setup) return; PL.on = true; render(); PL.h = setTimeout(playTick, 120); }
  function vEvento() {
    const S = O.get(); if (!S.evento) return '';
    const e = O.EVENTOS.find(x => x.id === S.evento.id);
    return `<section class="card ev"><h2>⚡ Evento</h2><p>${esc(e.txt)}</p><p class="hint">Expira em ${S.evento.sem} semanas.</p>` + e.ops.map((o, i) => `<button class="btn ${i ? 'alt' : ''}" style="margin-top:6px" data-act="evento" data-id="${i}">${esc(o.t)}</button>`).join('') + '</section>';
  }
  function vNegocios() {
    const S = O.get(), foco = [['nenhum', '😴 Normal', 'Sem efeito.'], ['treino', '🏋️ Treino', '+1 de força em todos os times.'], ['midia', '📣 Mídia', 'Seguidores crescem +2% por semana (R$ 3 mil/sem).']];
    let h = vEvento() + `<section class="card"><h2>🎯 Foco da semana</h2><div class="chips">${foco.map(([id, nm]) => `<button class="chip ${S.foco === id ? 'on' : ''}" data-act="foco" data-id="${id}">${nm}</button>`).join('')}</div><p class="hint">${foco.find(x => x[0] === S.foco)[2]}${S.buff ? ' Bootcamp ativo: +' + S.buff.f + ' de força por ' + S.buff.sem + ' sem.' : ''}</p></section>`;
    h += `<section class="card"><h2>📱 Redes sociais</h2><div class="kv"><span>Seguidores</span><b>${S.social.seg.toLocaleString('pt-BR')}</b></div><div class="kv"><span>Renda semanal (anúncios)</span><b class="pos">${O.money(O.rendaSocial())}</b></div><p class="hint">Vitórias e títulos fazem a base de fãs crescer.</p></section>`;
    h += `<section class="card"><h2>🤝 Patrocinadores (${S.patro.length}/3)</h2>` + (S.patro.map(x => `<div class="slot"><div class="who"><b>${esc(x.n)}</b><small>${x.sem} semanas restantes</small></div><b class="pos">${O.money(x.pay)}/sem</b></div>`).join('') || '<p class="hint">Nenhum patrocinador ainda.</p>') + '</section>';
    h += `<section class="card"><h2>Propostas</h2><p class="hint">Mudam a cada 6 semanas e pagam mais com reputação alta.</p>` + O.ofertas().map(o => `<div class="slot"><div class="who"><b>${esc(o.n)}</b><small>${o.sem} semanas</small></div><b>${O.money(o.pay)}/sem</b><button class="mini buy" data-act="patro" data-id="${o.id}" ${S.patro.length >= 3 ? 'disabled' : ''}>Fechar</button></div>`).join('') + '</section>';
    return h;
  }
  function vEstrutura() {
    const S = O.get();
    return `<section class="card"><div class="kv"><span>Bônus de força</span><b>+${O.infraBonus().toFixed(1)}</b></div><div class="kv"><span>Manutenção semanal</span><b>${O.money(O.upkeepSemanal())}</b></div></section>` +
      O.INFRA.map(it => { const n = O.infraNivel(it.id), max = n >= it.max, c = O.infraCusto(it);
        return `<section class="card infra"><div class="ic">${it.icone}</div><div class="who"><b>${it.nome}</b><small>${it.desc}</small><div class="bar"><i style="width:${n / it.max * 100}%"></i></div><small>Nível ${n}/${it.max}${it.bonus ? ' · +' + it.bonus + ' de força por nível' : ''}</small></div>
          <button class="mini buy" data-act="infra" data-id="${it.id}" ${max || S.org.caixa < c ? 'disabled' : ''}>${max ? 'MAX' : O.money(c)}</button></section>`; }).join('');
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
      h += `<section class="card"><h2>Playoffs</h2>` + c.po.res.map(r => `<div class="tb"><span>${est[r.st]}</span>${crestT(c, r.w)}<b>${nome(r.a)} x ${nome(r.b)}</b><em>${nome(r.w)}</em></div>`).join('')
        + c.po.pares.map(([a, b]) => `<div class="tb pend"><span>${est[c.po.stage]}</span><b>${nome(a)} x ${nome(b)}</b><em>a jogar</em></div>`).join('') + '</section>';
    }
    if (c.phase === 'intl' && c.intl) {
      const I = c.intl, nm = i => esc(O.nomeT(I.teams[i]));
      h += `<section class="card"><h2>🌍 ${O.intlDef(c.game)[I.tipo].nome}</h2><p class="hint">${I.teams.length} times · bolsa ${O.money(O.intlDef(c.game)[I.tipo].bolsa)}</p>` + I.res.slice(-8).map(r => `<div class="tb"><span>${r.st}</span><b>${nm(r.a)} x ${nm(r.b)}</b><em>${nm(r.w)}</em></div>`).join('')
        + (I.alive.length > 1 ? I.alive.map((a, k) => k % 2 ? '' : `<div class="tb pend"><span>a jogar</span><b>${nm(a)} x ${nm(I.alive[k + 1])}</b><em>${I.teams[a].eu || I.teams[I.alive[k + 1]].eu ? 'você' : ''}</em></div>`).join('') : '') + '</section>';
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
    return `<div class="team"><button data-act="time" data-id="${esc(key)}">${crest(t.n)}<b>${esc(t.n)}</b><em>${f}</em></button>${open ? `<div class="ros">${(t.p || []).map((p, i) => `<span><i class="role ri${i}">${roles[i]}</i>${esc(p[0])} <em>${p[1]}</em></span>`).join('') || '<small>Elenco ainda não cadastrado.</small>'}</div>` : ''}</div>`;
  }

  /* ---------- Render e eventos ---------- */
  const VIEWS = { calendario: vCalendario, negocios: vNegocios, org: vOrg, elenco: vElenco, mercado: vMercado, estrutura: vEstrutura, ligas: vLigas };
  function render() { header(); const sc = $('main').scrollTop; $('main').innerHTML = O.get().setup ? vSetup() : VIEWS[UI.tab](); $('main').scrollTop = sc; }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id, S = O.get();
    if (a === 'play') playToggle();
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
    else if (a === 'renovar') res(O.renovar(UI.game, UI.squad, +b.dataset.slot));
    else if (a === 'mover') res(O.mover(UI.game, UI.squad, id, +b.dataset.slot));
    else if (a === 'base') res(O.promoverBase(UI.game, UI.squad, id));
    else if (a === 'foco') res(O.setFoco(id));
    else if (a === 'patro') res(O.aceitarPatro(id));
    else if (a === 'evento') res(O.escolherEvento(+id));
    else if (a === 'infra') res(O.comprarInfra(id));
    else if (a === 'avancar') { O.avancar(+b.dataset.n); toast(+b.dataset.n + ' semana(s) passaram.'); render(); }
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

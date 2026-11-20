/* Interface: barra superior, seletor de jogo, 5 abas e navegação inferior. Re-renderiza a aba atual a cada mudança. */
(function () {
  'use strict';
  const O = window.Org;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = { tab: 'org', game: 'lol', squad: 't1', mk: { role: '', liga: '', q: '', n: 30, pay: false, asc: false }, ligaVer: null, aberto: null, resetArm: false };

  const TABS = [['org', '🏢', 'Org'], ['elenco', '👥', 'Elenco'], ['mercado', '🛒', 'Mercado'], ['estrutura', '🏠', 'Estrutura'], ['negocios', '📣', 'Negócios'], ['ligas', '🏆', 'Ligas']];

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  const res = r => { toast(r.msg); render(); };

  const DG = () => O.dataOf(UI.game);
  /* ---------- Cabeçalho ---------- */
  function header() {
    const S = O.get();
    $('top').innerHTML = `<div class="top-l"><b>${esc(S.org.nome)}</b><span>Semana ${S.org.semana} · ${S.org.ano}</span></div><div class="cash">${O.money(S.org.caixa)}</div>`;
    $('games').innerHTML = Object.values(O.GAMES).map(g =>
      `<button class="chip ${g.id === UI.game ? 'on' : ''}" data-act="game" data-id="${g.id}" ${g.ativo ? '' : 'aria-disabled="true"'}>${g.icone} ${g.curto}${g.ativo ? '' : ' <i>em breve</i>'}</button>`).join('');
    $('nav').innerHTML = TABS.map(([id, ic, nm]) => `<button class="${id === UI.tab ? 'on' : ''}" data-act="tab" data-id="${id}"><span>${ic}</span>${nm}</button>`).join('');
  }

  /* ---------- Abas ---------- */
  function vOrg() {
    const S = O.get(), p = O.projecao(UI.game);
    const ev = vEvento();
    const regs = Object.entries(DG() ? DG().leagues : {}).map(([k, v]) => `<option value="${k}" ${k === O.regiaoDe(UI.game) ? 'selected' : ''}>${v.nome} · ${v.regiao}</option>`).join('');
    return ev + `<section class="card"><h2>Sua organização</h2>
      <label class="fld">Nome da org<input id="orgnome" value="${esc(S.org.nome)}" maxlength="24"></label>
      <label class="fld">Região de ${O.GAMES[UI.game].curto} (trocar reinicia as competições deste jogo)<select id="regiao">${regs}</select></label>
      <div class="kv"><span>Reputação</span><b>${S.org.rep.toFixed(2)}</b></div><div class="kv"><span>Seguidores</span><b>${S.social.seg.toLocaleString('pt-BR')}</b></div><div class="kv"><span>Patrocínios + redes (por semana)</span><b class="pos">${O.money(O.rendaPatro() + O.rendaSocial() - O.custoFoco())}</b></div>
    </section>
    <section class="card"><h2>Semana (${O.GAMES[UI.game].curto})</h2>
      <div class="kv"><span>Receita prevista</span><b class="pos">${O.money(p.receita)}</b></div>
      <div class="kv"><span>Despesa prevista</span><b class="neg">${O.money(p.despesa)}</b></div>
      <div class="kv"><span>Saldo</span><b class="${p.saldo >= 0 ? 'pos' : 'neg'}">${O.money(p.saldo)}</b></div>
      <div class="row2"><button class="btn" data-act="avancar" data-n="1">Avançar 1 semana</button><button class="btn alt" data-act="avancar" data-n="4">Avançar 4</button></div>
      <button class="btn" style="margin-top:8px" data-act="proximo">Ir até a próxima partida</button>
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
      return `<div class="slot">${p ? `<span class="role ${cls}">${titulo}</span><div class="who"><b>${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos${p.pot ? ' · pot. ' + p.pot : ''}</small><small class="${p.ct <= 8 ? 'neg' : ''}">⏳ ${p.ct === undefined ? O.CONTRATO : p.ct} sem. de contrato</small><div class="acts"><button class="mini" data-act="renovar" data-slot="${i}">Renovar ${O.money(O.custoRenovar(p))}</button>${['t1', 't2', 'acad'].filter(x => x !== UI.squad && S.games[UI.game].squads[x].on).map(x => `<button class="mini" data-act="mover" data-slot="${i}" data-id="${x}">→ ${x === 'acad' ? 'Academy' : x.toUpperCase()}</button>`).join('')}</div></div><span class="ovr">${p.o}</span><button class="mini" data-act="dispensar" data-slot="${i}" aria-label="Dispensar ${esc(p.n)}">✕</button>`
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
    h += rows.map(r => `<div class="tb ${r.eu ? 'eu' : ''} ${r.pos === 6 ? 'cut' : ''}"><span>${r.pos}</span><b>${esc(r.n)}</b><em>${r.w}V ${r.l}D</em></div>`).join('') + '<p class="hint">Os 6 primeiros vão aos playoffs.</p></section>';
    if (c.phase === 'po' && c.po) {
      h += `<section class="card"><h2>Playoffs</h2>` + c.po.res.map(r => `<div class="tb"><span>${est[r.st]}</span><b>${nome(r.a)} x ${nome(r.b)}</b><em>${nome(r.w)}</em></div>`).join('')
        + c.po.pares.map(([a, b]) => `<div class="tb pend"><span>${est[c.po.stage]}</span><b>${nome(a)} x ${nome(b)}</b><em>a jogar</em></div>`).join('') + '</section>';
    }
    if (c.phase === 'intl' && c.intl) {
      const I = c.intl, nm = i => esc(O.nomeT(I.teams[i]));
      h += `<section class="card"><h2>🌍 ${O.intlDef(c.game)[I.tipo].nome}</h2><p class="hint">${I.teams.length} times · bolsa ${O.money(O.intlDef(c.game)[I.tipo].bolsa)}</p>` + I.res.slice(-8).map(r => `<div class="tb"><span>${r.st}</span><b>${nm(r.a)} x ${nm(r.b)}</b><em>${nm(r.w)}</em></div>`).join('')
        + (I.alive.length > 1 ? I.alive.map((a, k) => k % 2 ? '' : `<div class="tb pend"><span>a jogar</span><b>${nm(a)} x ${nm(I.alive[k + 1])}</b><em>${I.teams[a].eu || I.teams[I.alive[k + 1]].eu ? 'você' : ''}</em></div>`).join('') : '') + '</section>';
    }
    if (c.last.length) h += `<section class="card"><h2>Seus últimos jogos</h2>` + c.last.slice(0, 6).map(m => `<div class="tb"><span>${m.v ? '✅' : '❌'}</span><b>vs ${esc(m.op)}</b><em>${m.pl} · ${esc(m.f)}</em></div>`).join('') + '</section>';
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
    return `<div class="team"><button data-act="time" data-id="${esc(key)}"><b>${esc(t.n)}</b><em>${f}</em></button>${open ? `<div class="ros">${(t.p || []).map((p, i) => `<span><i class="role ri${i}">${roles[i]}</i>${esc(p[0])} <em>${p[1]}</em></span>`).join('') || '<small>Elenco ainda não cadastrado.</small>'}</div>` : ''}</div>`;
  }

  /* ---------- Render e eventos ---------- */
  const VIEWS = { negocios: vNegocios, org: vOrg, elenco: vElenco, mercado: vMercado, estrutura: vEstrutura, ligas: vLigas };
  function render() { header(); const sc = $('main').scrollTop; $('main').innerHTML = VIEWS[UI.tab](); $('main').scrollTop = sc; }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id, S = O.get();
    if (a === 'tab') { UI.tab = id; UI.resetArm = false; $('main').scrollTop = 0; render(); }
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
    else if (a === 'proximo') { const n = O.avancarAteJogo(); toast(`${n} semana(s) até a próxima partida.`); render(); }
    else if (a === 'mrole') { UI.mk.role = id; UI.mk.n = 30; render(); }
    else if (a === 'mpay') { UI.mk.pay = !UI.mk.pay; UI.mk.n = 30; render(); }
    else if (a === 'masc') { UI.mk.asc = !UI.mk.asc; UI.mk.n = 30; render(); }
    else if (a === 'mais') { UI.mk.n += 30; render(); }
    else if (a === 'liga') { UI.ligaVer = id; UI.aberto = null; render(); }
    else if (a === 'time') { UI.aberto = UI.aberto === id ? null : id; render(); }
    else if (a === 'reset') { if (UI.resetArm) { O.reset(); UI.resetArm = false; toast('Jogo zerado.'); } else { UI.resetArm = true; setTimeout(() => { UI.resetArm = false; if (UI.tab === 'org') render(); }, 3000); } render(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'regiao') { O.trocarRegiao(e.target.value, UI.game); UI.ligaVer = null; toast('Região trocada: competições deste jogo reiniciadas.'); render(); }
    else if (e.target.id === 'mliga') { UI.mk.liga = e.target.value; UI.mk.n = 30; render(); }
    else if (e.target.id === 'orgnome') { O.get().org.nome = e.target.value.trim() || 'Minha Org'; O.save(); header(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'mq') { UI.mk.q = e.target.value; UI.mk.n = 30; const pos = e.target.selectionStart; render(); const el = $('mq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
  });

  O.load();
  render();
  window.OrgUI = UI;
})();

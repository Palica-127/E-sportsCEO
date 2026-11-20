/* Interface: barra superior, seletor de jogo, 5 abas e navegação inferior. Re-renderiza a aba atual a cada mudança. */
(function () {
  'use strict';
  const O = window.Org;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = { tab: 'org', game: 'lol', squad: 't1', mk: { role: '', liga: '', q: '', n: 30, pay: false, asc: false }, ligaVer: null, aberto: null, resetArm: false };

  const TABS = [['org', '🏢', 'Org'], ['elenco', '👥', 'Elenco'], ['mercado', '🛒', 'Mercado'], ['estrutura', '🏠', 'Estrutura'], ['ligas', '🏆', 'Ligas']];

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  const res = r => { toast(r.msg); render(); };

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
    const regs = Object.entries(window.LOL.leagues).map(([k, v]) => `<option value="${k}" ${k === S.org.regiao ? 'selected' : ''}>${v.nome} · ${v.regiao}</option>`).join('');
    return `<section class="card"><h2>Sua organização</h2>
      <label class="fld">Nome da org<input id="orgnome" value="${esc(S.org.nome)}" maxlength="24"></label>
      <label class="fld">Região (liga de origem)<select id="regiao">${regs}</select></label>
      <div class="kv"><span>Reputação</span><b>${S.org.rep.toFixed(2)}</b></div>
    </section>
    <section class="card"><h2>Semana (${O.GAMES[UI.game].curto})</h2>
      <div class="kv"><span>Receita prevista</span><b class="pos">${O.money(p.receita)}</b></div>
      <div class="kv"><span>Despesa prevista</span><b class="neg">${O.money(p.despesa)}</b></div>
      <div class="kv"><span>Saldo</span><b class="${p.saldo >= 0 ? 'pos' : 'neg'}">${O.money(p.saldo)}</b></div>
      <div class="row2"><button class="btn" data-act="avancar" data-n="1">Avançar 1 semana</button><button class="btn alt" data-act="avancar" data-n="4">Avançar 4</button></div>
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
    return `<section class="card empty"><h2>${O.GAMES[UI.game].icone} ${O.GAMES[UI.game].nome}</h2><p>Esqueleto pronto, falta preencher os dados deste jogo (ligas, times e jogadores). Por enquanto só o LoL está ativo.</p></section>`;
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
      const titulo = i < 5 ? roles[i] : 'RES';
      return `<div class="slot">${p ? `<span class="role r-${titulo}">${titulo}</span><div class="who"><b>${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos</small></div><span class="ovr">${p.o}</span><button class="mini" data-act="dispensar" data-slot="${i}" aria-label="Dispensar ${esc(p.n)}">✕</button>`
        : `<span class="role r-${titulo} off">${titulo}</span><div class="who"><small>Vaga aberta</small></div>`}</div>${i === 4 ? '</section><section class="card"><h2>Reservas</h2>' : ''}`;
    }).join('') + '</section>';
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
    const ligas = Object.keys(window.LOL.leagues);
    return squadTabs() + `<section class="card"><div class="chips">
      <button class="chip ${m.pay ? 'on' : ''}" data-act="mpay">💰 Posso pagar</button><button class="chip ${m.asc ? 'on' : ''}" data-act="masc">${m.asc ? '↑ Mais baratos' : '↓ Melhores'}</button><button class="chip ${!m.role ? 'on' : ''}" data-act="mrole" data-id="">Todas</button>${roles.map(r => `<button class="chip ${m.role === r ? 'on' : ''}" data-act="mrole" data-id="${r}">${r}</button>`).join('')}</div>
      <div class="row2"><select id="mliga"><option value="">Todas as ligas</option>${ligas.map(l => `<option ${m.liga === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input id="mq" placeholder="Buscar nome" value="${esc(m.q)}"></div></section>
      <section class="card"><h2>${tot} jogadores</h2>` + lista.slice(0, m.n).map(p => `<div class="slot"><span class="role r-${p.r}">${p.r}</span>
        <div class="who"><b>${esc(p.n)}</b><small>${esc(p.t)} · ${p.l} · ${p.a} anos · ${O.money(O.salary(p.o))}/sem</small></div><span class="ovr">${p.o}</span>
        <button class="mini buy" data-act="contratar" data-id="${p.id}" ${S.org.caixa >= O.fee(p.o) ? '' : 'disabled'}>${O.money(O.fee(p.o))}</button></div>`).join('')
      + (tot > m.n ? `<button class="btn alt" data-act="mais">Mostrar mais</button>` : '') + '</section>';
  }
  function vEstrutura() {
    const S = O.get();
    return `<section class="card"><div class="kv"><span>Bônus de força</span><b>+${O.infraBonus().toFixed(1)}</b></div><div class="kv"><span>Manutenção semanal</span><b>${O.money(O.upkeepSemanal())}</b></div></section>` +
      O.INFRA.map(it => { const n = O.infraNivel(it.id), max = n >= it.max, c = O.infraCusto(it);
        return `<section class="card infra"><div class="ic">${it.icone}</div><div class="who"><b>${it.nome}</b><small>${it.desc}</small><div class="bar"><i style="width:${n / it.max * 100}%"></i></div><small>Nível ${n}/${it.max} · +${it.bonus} de força por nível</small></div>
          <button class="mini buy" data-act="infra" data-id="${it.id}" ${max || S.org.caixa < c ? 'disabled' : ''}>${max ? 'MAX' : O.money(c)}</button></section>`; }).join('');
  }
  function vLigas() {
    const g = gameGuard(); if (g) return g;
    const S = O.get(), L = window.LOL.leagues, ver = UI.ligaVer || S.org.regiao;
    const sel = `<div class="chips">${Object.keys(L).map(k => `<button class="chip ${k === ver ? 'on' : ''}" data-act="liga" data-id="${k}">${L[k].nome}</button>`).join('')}</div>`;
    let h = sel;
    if (ver === S.org.regiao && S.games[UI.game].squads[UI.squad].on) {
      const rows = O.tabela(UI.game, UI.squad);
      h += `<section class="card"><h2>Tabela por força · ${UI.squad === 't2' ? 'T2' : 'T1'} ${L[ver].nome}</h2><p class="hint">Provisório: ainda não há partidas, a posição vem da força do elenco.</p>` +
        rows.map(r => `<div class="tb ${r.eu ? 'eu' : ''}"><span>${r.pos}</span><b>${esc(r.n)}</b><em>${r.f.toFixed(1)}</em></div>`).join('') + '</section>' + squadTabs();
    }
    h += `<section class="card"><h2>${L[ver].nome} · ${L[ver].regiao}</h2><h3>T1</h3>` + L[ver].t1.map(t => timeRow(ver, 1, t)).join('') + '<h3>T2</h3>' + (L[ver].t2.map(t => timeRow(ver, 2, t)).join('') || '<p class="hint">Sem times.</p>') + '</section>';
    return h;
  }
  function timeRow(lg, tier, t) {
    const key = lg + tier + t.n, open = UI.aberto === key;
    const f = t.p ? (t.p.reduce((a, p) => a + p[1], 0) / t.p.length).toFixed(1) : '—';
    const roles = window.LOL.roles;
    return `<div class="team"><button data-act="time" data-id="${esc(key)}"><b>${esc(t.n)}</b><em>${f}</em></button>${open ? `<div class="ros">${(t.p || []).map((p, i) => `<span><i class="role r-${roles[i]}">${roles[i]}</i>${esc(p[0])} <em>${p[1]}</em></span>`).join('') || '<small>Elenco ainda não cadastrado.</small>'}</div>` : ''}</div>`;
  }

  /* ---------- Render e eventos ---------- */
  const VIEWS = { org: vOrg, elenco: vElenco, mercado: vMercado, estrutura: vEstrutura, ligas: vLigas };
  function render() { header(); const sc = $('main').scrollTop; $('main').innerHTML = VIEWS[UI.tab](); $('main').scrollTop = sc; }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id, S = O.get();
    if (a === 'tab') { UI.tab = id; UI.resetArm = false; $('main').scrollTop = 0; render(); }
    else if (a === 'game') { if (O.GAMES[id].ativo) UI.game = id; else { UI.game = id; toast('Este jogo ainda é só esqueleto.'); } render(); }
    else if (a === 'squad') { UI.squad = id; render(); }
    else if (a === 'ativar') res(O.ativarSquad(UI.game, UI.squad));
    else if (a === 'dispensar') res(O.dispensar(UI.game, UI.squad, +b.dataset.slot));
    else if (a === 'contratar') { const p = O.poolLol().find(x => x.id === id); if (p) res(O.contratar(UI.game, UI.squad, p)); }
    else if (a === 'infra') res(O.comprarInfra(id));
    else if (a === 'avancar') { O.avancar(+b.dataset.n); toast(+b.dataset.n + ' semana(s) passaram.'); render(); }
    else if (a === 'mrole') { UI.mk.role = id; UI.mk.n = 30; render(); }
    else if (a === 'mpay') { UI.mk.pay = !UI.mk.pay; UI.mk.n = 30; render(); }
    else if (a === 'masc') { UI.mk.asc = !UI.mk.asc; UI.mk.n = 30; render(); }
    else if (a === 'mais') { UI.mk.n += 30; render(); }
    else if (a === 'liga') { UI.ligaVer = id; UI.aberto = null; render(); }
    else if (a === 'time') { UI.aberto = UI.aberto === id ? null : id; render(); }
    else if (a === 'reset') { if (UI.resetArm) { O.reset(); UI.resetArm = false; toast('Jogo zerado.'); } else { UI.resetArm = true; setTimeout(() => { UI.resetArm = false; if (UI.tab === 'org') render(); }, 3000); } render(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'regiao') { O.get().org.regiao = e.target.value; UI.ligaVer = null; O.save(); render(); }
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

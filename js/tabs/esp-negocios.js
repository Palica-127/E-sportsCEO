/* Aba NEGOCIOS do Time de eSports: patrocinio (ofertas, contratos, metas e multas), redes sociais e financas.
   Toda a logica vive em esp-semana.js (ESPX.semana); aqui so a tela. */
(function () {
'use strict';
var E = ECO, C = E.C, fm = E.fmtM, UI = null, T = null, sigs = {};
function X() { return window.ESPX.semana; }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pct(v) { return Math.round(v * 100) + '%'; }
function setHtml(node, key, sig, fn) { if (sigs[key] === sig) return; sigs[key] = sig; node.innerHTML = fn(); }

function mount(root, api) {
  root.classList.add('ng');
  root.innerHTML = '<section class="lgc" aria-labelledby="ngPt"><b id="ngPt">Patrocínio</b><small id="ngSl"></small><div id="ngOf"></div><h4 class="ng-h">Contratos ativos</h4><div id="ngCo"></div></section>' +
    '<section class="lgc" aria-labelledby="ngRt"><b id="ngRt">Redes sociais</b><div id="ngRd"></div></section>' +
    '<section class="lgc" aria-labelledby="ngFt"><b id="ngFt">Finanças</b><div id="ngFi"></div></section>';
  UI = { sl: root.querySelector('#ngSl'), of: root.querySelector('#ngOf'), co: root.querySelector('#ngCo'), rd: root.querySelector('#ngRd'), fi: root.querySelector('#ngFi') };
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b) return;
    var i = +b.dataset.i, act = b.dataset.act, x = X(), r;
    if (act === 'acc') { r = x.accept(i, null); if (r.need === 'swap') x.openSwap(i); else if (!r.ok) api.toast(r.why); }
    else if (act === 'ref') x.refuse(i);
    else if (act === 'ren') { var s = x.state(); s.ren = s.ren ? 0 : 1; api.toast(s.ren ? 'Renovação automática ligada.' : 'Renovação automática desligada.'); }
    api.invalidate();
  });
}
function offerHtml(o, i, full) {
  var x = X(), mw = x.metaWarn(o);
  return '<article class="ng-c"><div class="ng-t"><b>' + esc(x.brand(o.t)) + '</b><span>' + fm(o.v) + '/sem</span></div>' +
    '<p>' + o.prazo + ' semanas · luvas de ' + fm(2 * o.v) + ' · expira em ' + o.vida + ' sem' + (mw ? '<br>' + esc(mw) : '<br>Sem meta de vitórias.') + '</p>' +
    '<div class="ng-b"><button type="button" class="btn pri" data-act="acc" data-i="' + i + '">' + (full ? 'Trocar' : 'Aceitar') + '</button><button type="button" class="btn" data-act="ref" data-i="' + i + '">Recusar</button></div></article>';
}
function conHtml(c, i) {
  var t = C.tiers[c.t - 1], h = c.h.slice(-8), wr = h.length ? h.reduce(function (a, b) { return a + b; }, 0) / h.length : 0, risk = t[4] && h.length >= 4 && wr < t[4];
  return '<article class="ng-c" data-risk="' + (risk || c.st ? 1 : 0) + '"><div class="ng-t"><b>' + esc(t[0]) + '</b><span>' + fm(c.v) + '/sem' + (c.v < c.v0 ? ' (reduzido)' : '') + '</span></div>' +
    '<p>Restam ' + c.rest + ' sem · revisão em ' + c.rev + ' sem' + (t[4] ? '<br>Meta ' + pct(t[4]) + ' · você vence ' + (h.length ? pct(wr) : '--') + ' nos últimos ' + h.length + ' jogos' : '<br>Sem meta de vitórias') +
    (c.st ? '<br><b>Aviso: ' + esc(t[0]) + ' está de olho em vocês.</b>' : '') + (risk && !c.st ? '<br><b>Risco de aviso na próxima revisão.</b>' : '') + '<br>Multa de rescisão: ' + fm(2 * c.v0) + '</p></article>';
}
function render(api) {
  if (!UI) return;
  var x = X(), s = x.state(), e = x.econ(), U = api.ui, sl = x.slots(), nxt = s.F < C.slotsF[1] ? C.slotsF[1] : s.F < C.slotsF[2] ? C.slotsF[2] : 0;
  U.text(UI.sl, 'Vagas de contrato: ' + s.con.length + '/' + sl + (nxt ? ' · próxima vaga com Fama ' + nxt + ' (você tem ' + Math.floor(s.F) + ')' : ' · todas liberadas'));
  var full = s.con.length >= sl;
  setHtml(UI.of, 'of', JSON.stringify(s.of) + full + Math.round(e.expWR * 100), function () {
    return s.of.length ? s.of.map(function (o, i) { return offerHtml(o, i, full); }).join('') : '<p class="ng-e">Sem ofertas no quadro. Uma nova chega a cada 4 semanas; o foco Negociar traz uma na hora.</p>';
  });
  setHtml(UI.co, 'co', JSON.stringify(s.con) + s.ren, function () {
    return (s.con.length ? s.con.map(conHtml).join('') : '<p class="ng-e">Nenhum contrato ativo.</p>') +
      '<button type="button" class="btn ng-ren" data-act="ren" aria-pressed="' + (s.ren ? 'true' : 'false') + '">Renovação automática: ' + (s.ren ? 'ligada' : 'desligada') + '</button>';
  });
  var inc = e.inc, g = s.gh.length ? e.gross : inc.sum;
  setHtml(UI.rd, 'rd', Math.round(s.seg) + ',' + api.owned('smm') + ',' + Math.round(inc.social), function () {
    var cap = Math.min(8e6, 2000 * Math.pow(1 + s.F, 1.5));
    return '<div class="stat"><span>Seguidores</span><b>' + api.fmt(s.seg) + '</b></div><div class="stat"><span>Teto pela sua Fama</span><b>' + api.fmt(cap) + '</b></div>' +
      '<div class="stat"><span>Publi e redes por semana</span><b>' + fm(inc.social) + '</b></div><div class="stat"><span>Social media</span><b>' + (api.owned('smm') ? 'contratado (x1,5)' : 'não contratado') + '</b></div>' +
      '<small>Foco Conteúdo triplica o crescimento e dá x1,5 de publi. Jogadores de nota alta e o Social media multiplicam o resultado.</small>';
  });
  var cp = e.costs, rn = isFinite(e.runway) ? Math.floor(e.runway) + ' semanas' : 'sem risco';
  setHtml(UI.fi, 'fi', [Math.round(inc.sum), Math.round(e.costsTotal), Math.round(api.money() / 1000)].join(), function () {
    var l = s.last;
    return '<div class="stat"><span>Direitos de TV</span><b>' + fm(inc.tv) + '</b></div><div class="stat"><span>Patrocínio</span><b>' + fm(inc.spons) + '</b></div>' +
      '<div class="stat"><span>Redes sociais</span><b>' + fm(inc.social) + '</b></div><div class="stat"><span>Loja e camisa</span><b>' + fm(inc.loja) + '</b></div><div class="stat"><span>Bilheteria</span><b>' + fm(inc.ticket) + '</b></div>' +
      '<div class="stat"><span>Salários (elenco e reservas)</span><b>-' + fm(cp.sal) + '</b></div><div class="stat"><span>Staff</span><b>-' + fm(cp.staff) + '</b></div><div class="stat"><span>Manutenção da estrutura</span><b>-' + fm(cp.upkeep) + '</b></div>' +
      '<div class="stat ng-sum"><span>Saldo por semana (média)</span><b data-tone="' + (e.saldo >= 0 ? 'ok' : 'bad') + '">' + (e.saldo >= 0 ? '+' : '-') + fm(Math.abs(e.saldo)) + '</b></div>' +
      '<div class="stat"><span>Caixa dura</span><b>' + rn + '</b></div>' +
      (l ? '<small>Última semana (' + l.wk + '): receita ' + fm(l.gross) + ', despesa ' + fm(l.cost) + ', resultado ' + (l.net >= 0 ? '+' : '') + fm(l.net) + '. Prêmios entram só no fim dos splits e torneios.</small>' : '');
  });
  var badge = s.of.length > 0 || s.con.some(function (c) { return c.st > 0; });
  var lbl = badge ? 'Negócios •' : 'Negócios'; if (T && T.label !== lbl) T.label = lbl;
}
T = Engine.registerTab('esp', {
  id: 'negocios', label: 'Negócios', icon: '💼',
  mount: mount, render: render,
  update: function (dt, api) { var s = X() && X().state(); if (!s || !T) return; var b = s.of.length > 0 || s.con.some(function (c) { return c.st > 0; }), lbl = b ? 'Negócios •' : 'Negócios'; if (T.label !== lbl) T.label = lbl; }
});
})();

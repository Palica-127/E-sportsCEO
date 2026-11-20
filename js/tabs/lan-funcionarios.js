/* Aba EQUIPE (Funcionarios) da Lan House (plugin: Engine.registerTab). Regras e numeros: docs/TABS_LAN.md.
   Contrate e melhore atendente, tecnico, gerente, faxineiro, seguranca e cantineiro. Salario recorrente;
   efeitos: mais renda (api.mult, teto +12%), menos eventos ruins nos torneios, apagao mais leve e agenda automatica. */
(function () {
'use strict';
var INC_CAP = 0.12, MIT_CAP = 0.85, PAY_EVERY = 60, MAXL = 5, GROW = 1.7;
var R = {
  atend: { n: 'Atendente', ic: '🧑‍💼', lim: 2, req: null, k: 10, inc: [0.007, 0.004, 0.003, 0.002, 0.002], sal: 0.0018, snack: 0.04, d: 'Cobra, serve e separa briga de mouse.' },
  ti: { n: 'Técnico de TI', ic: '🧑‍💻', lim: 1, req: ['ssd', 1, 'SSD'], k: 12, inc: [0.003, 0.002, 0.002, 0.001, 0.001], sal: 0.0022, mit: { apagao: 0.18, lag: 0.10, trapaca: 0.06 }, d: 'Formata, desentope e culpa o cliente.' },
  fax: { n: 'Faxineiro', ic: '🧹', lim: 1, req: ['mon', 1, 'Monitor gamer'], k: 8, inc: [0.004, 0.002, 0.002, 0.001, 0.001], sal: 0.0012, mit: { briga: 0.03, fiscal: 0.04 }, d: 'Lan limpa, cliente fica mais tempo.' },
  cant: { n: 'Cantineiro', ic: '🥟', lim: 1, req: ['cant', 1, 'Cantina'], k: 12, inc: [0.005, 0.003, 0.002, 0.002, 0.001], sal: 0.0015, snack: 0.08, d: 'Coxinha quentinha e fiado controlado.' },
  ger: { n: 'Gerente', ic: '👔', lim: 1, req: ['net', 1, 'Internet'], k: 20, inc: [0.008, 0.005, 0.004, 0.003, 0.002], sal: 0.003, cut: 0.04, mit: { fiscal: 0.08 }, d: 'Nível 3: repete torneios sozinho.' },
  seg: { n: 'Segurança', ic: '🦺', lim: 2, req: ['camp', 1, 'Campeonato de CS'], k: 25, inc: [0.002, 0.001, 0.001, 0.0005, 0.0005], sal: 0.0025, mit: { briga: 0.09, calote: 0.08, trapaca: 0.05 }, d: 'Olha feio. Funciona.' }
};
var ORDER = ['atend', 'ti', 'fax', 'cant', 'ger', 'seg'];
var NAMES = ['Tio Zé', 'Dona Marlene', 'Kauã Pen Drive', 'Jéssica do Balcão', 'Seu Raimundo', 'Naldinho Formatador', 'Dayane Orkut', 'Léo Cabeludo', 'Tia Fátima', 'Rodolfo Ping Baixo', 'Cleiton do Cabo', 'Bia Moderadora', 'Seu Genivaldo', 'Mateus Sem Lag', 'Dona Neide', 'Wesley Fiado', 'Thaís Headset', 'Jorginho Antivírus', 'Edvaldo Tela Azul', 'Tati do Caixa', 'Gilberto Gelado', 'Marcão da Porta'];
var PH = {
  atend: ['"Pacote de 5 horas ou avulso, campeão?"', '"Quem pediu o PC 7? Tá liberado."', '"A mãe do Dudu ligou. De novo."', '"Aqui não é creche, mas tá lotado de criança."', '"Fecha o Orkut que a fila tá grande!"'],
  ti: ['"Já tentou desligar e ligar? Pois é."', '"O vírus veio num pen drive. Sempre vem."', '"Esse mouse não tem conserto. Tem funeral."', '"Formatei de novo. Os saves? Que saves?"', '"O ping tá ótimo. É o seu que tá ruim."'],
  fax: ['"Quem derramou Guaraná no teclado?"', '"Tem coxinha na cadeira 4. Eu não vi nada."', '"Passei pano até no mouse. De nada."', '"Esse carpete tem história. E mancha."', '"Cheiro de lan limpa: pinho e suor."'],
  cant: ['"Coxinha acabou. Pastel? Também."', '"Anota no caderninho que sábado ele paga."', '"Guaraná gelado, aqui, só nessa lan."', '"Hoje o salgado tá quentinho de verdade."', '"Quem pediu mais um refil de 2 litros?"'],
  ger: ['"Planilha em dia, caixa sem furo. Quase."', '"Reunião às 14h. Só eu vou."', '"Precisamos aumentar o ticket médio."', '"Alvará? Tá na gaveta. Em algum lugar."', '"Vou mandar um e-mail pra todo mundo ficar de olho."'],
  seg: ['"Aqui não entra briga. Entra no máximo reclamação."', '"Fiscalizando a porta desde as 8h."', '"Chuteira na rua, por favor."', '"O moleque de boné tá com cara de cheater."', '"Torcida? Fica atrás da faixa amarela."']
};
var HIRE = ['{n} começou hoje. Já pediu o Wi-Fi.', '{n} bateu o ponto e perguntou onde fica o café.', '{n} chegou de uniforme novo. O crachá veio torto.'];
var QUIT = ['{n} pediu as contas e foi jogar Habbo.', '{n} avisou: "Sem salário nem o Orkut me segura".', '{n} deixou o crachá em cima do balcão e sumiu.'];
var UP = ['{n} subiu de nível e pediu uma cadeira melhor.', '{n} ganhou um crachá dourado.', '{n} agora é "funcionário do mês" (todo mês).'];

var S = null, UI = null, apiR = null, arm = { k: '', until: 0 }, tf = 1, achT = 0;
function fresh() { return { v: 1, seed: (Math.random() * 4294967296) >>> 0, pd: PAY_EVERY, emp: [], vet: {}, hired: 0, quits: 0, nid: 1, paid: 0 }; }
function rnd() { S.seed = (S.seed + 0x6D2B79F5) | 0; var t = Math.imul(S.seed ^ (S.seed >>> 15), 1 | S.seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function num(v, d, lo, hi) { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
function pct(n) { return (Math.round(n * 1000) / 10).toString().replace('.', ',') + '%'; }
function P(api) { return Math.max(2, api.psBase()); }
function reqOk(api, r) { return !r.req || api.owned(r.req[0]) >= r.req[1]; }
function count(role) { var n = 0; S.emp.forEach(function (e) { if (e.r === role) n++; }); return n; }
function slots() { var o = []; ORDER.forEach(function (r) { for (var i = 0; i < R[r].lim; i++) o.push({ key: r + ':' + i, r: r, i: i }); }); return o; }
function empAt(role, i) { var k = 0, f = null; S.emp.forEach(function (e) { if (e.r === role) { if (k === i) f = e; k++; } }); return f; }
function hireCost(api, role) { return R[role].k * P(api); }
function upCost(api, e) { return R[e.r].k * Math.pow(GROW, e.l) * P(api); }
function salRate(e) { return R[e.r].sal * (1 + 0.3 * (e.l - 1)); }
function cut() { var c = 0; S.emp.forEach(function (e) { if (R[e.r].cut) c += R[e.r].cut * e.l; }); return Math.min(0.2, c); }
function payroll(api) { var s = 0; S.emp.forEach(function (e) { s += salRate(e); }); return s * (1 - cut()) * P(api) * PAY_EVERY; }
function incTotal() { var t = 0; S.emp.forEach(function (e) { for (var i = 0; i < e.l; i++) t += R[e.r].inc[i]; }); return Math.min(INC_CAP, t); }
function say(e) { var a = PH[e.r]; return a[(e.i + e.id + Math.floor(apiR.now() / 30)) % a.length]; }
function fill(t, n) { return t.replace('{n}', n); }
function effects(api) {
  var snack = 0, mit = {}, agenda = 0;
  S.emp.forEach(function (e) {
    var r = R[e.r]; if (r.snack) snack += r.snack * e.l;
    if (r.mit) for (var k in r.mit) mit[k] = (mit[k] || 0) + r.mit[k] * e.l;
    if (e.r === 'ger' && e.l >= 3) agenda = 1;
  });
  for (var k2 in mit) mit[k2] = Math.min(MIT_CAP, Math.round(mit[k2] * 1000) / 1000);
  api.mult('fn:staff', 1 + incTotal());
  api.shared['fn:fx'] = { snack: Math.min(0.6, snack), mit: mit, agenda: agenda, inc: incTotal() };
  if (UI) UI.dirty = true; api.invalidate();
}
function updVet(e) { if (e.l > (S.vet[e.r] || 0)) S.vet[e.r] = e.l; }
function hire(api, role) {
  var r = R[role]; if (!r || !reqOk(api, r) || count(role) >= r.lim) return { ok: false, msg: 'Vaga indisponível' };
  var c = hireCost(api, role); if (!api.spend(c)) return { ok: false, msg: 'Faltam ' + api.cur + ' ' + api.fmt(c - api.money()) };
  var used = {}; S.emp.forEach(function (e) { used[e.i] = 1; });
  var i = (rnd() * NAMES.length) | 0, g = 0; while (used[i] && g++ < NAMES.length) i = (i + 1) % NAMES.length;
  var e = { id: S.nid++, r: role, i: i, l: Math.max(1, Math.ceil((S.vet[role] || 0) / 2)), late: 0 };
  S.emp.push(e); S.hired++; effects(api);
  return { ok: true, msg: fill(HIRE[(rnd() * HIRE.length) | 0], NAMES[i]), e: e, cost: c };
}
function levelUp(api, e) {
  if (e.l >= MAXL) return { ok: false, msg: 'Nível máximo' };
  var c = upCost(api, e); if (!api.spend(c)) return { ok: false, msg: 'Faltam ' + api.cur + ' ' + api.fmt(c - api.money()) };
  e.l++; updVet(e); effects(api); return { ok: true, msg: fill(UP[(rnd() * UP.length) | 0], NAMES[e.i]), cost: c };
}
function remove(api, e, quit) {
  updVet(e); S.emp = S.emp.filter(function (x) { return x !== e; }); if (quit) S.quits++; effects(api);
}
function payday(api) {
  var pr = P(api) * PAY_EVERY * (1 - cut()), n = 0;
  S.emp.slice().forEach(function (e) {
    var due = salRate(e) * pr;
    if (api.spend(due)) { e.late = 0; S.paid += due; return; }
    e.late++;
    if (e.late >= 2) { api.toast(fill(QUIT[(rnd() * QUIT.length) | 0], NAMES[e.i]) + ' Contrate de novo quando puder.', { ms: 4500 }); api.sfx('no'); remove(api, e, true); api.unlock('fnquit'); }
    else { n++; }
  });
  if (n) { api.toast('Salário atrasado! ' + n + (n > 1 ? ' funcionários estão' : ' funcionário está') + ' de cara feia.', { ms: 3500 }); api.sfx('no'); }
}
function autoBlackout(api) {
  var m = (S.emp.length && api.shared['fn:fx'] && api.shared['fn:fx'].mit && api.shared['fn:fx'].mit.apagao) || 0, b = api.psBase();
  if (m > 0 && b > 0 && api.ps() / b / tf < 0.3) {
    var f = Math.pow(0.25, -m); if (tf !== f) { tf = f; } api.temp('fn:estab', f, 0.35);
  } else if (tf !== 1) { tf = 1; api.temp('fn:estab', 1, 0); }
}
function ach(api) {
  if (S.hired >= 1) api.unlock('fn1');
  if (ORDER.every(function (r) { return count(r) >= R[r].lim; })) api.unlock('fnfull');
  if (S.emp.some(function (e) { return e.l >= MAXL; })) api.unlock('fn5');
}

/* ---------- interface ---------- */
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function armed(api, k) { return arm.k === k && api.now() < arm.until; }
function mount(root, api) {
  apiR = api; root.classList.add('lan-root');
  root.innerHTML =
    '<section class="lan-card" aria-label="Folha de pagamento"><div class="lan-r2"><b>Folha da equipe</b><span class="lan-tag" data-r="inc"></span></div>' +
    '<div class="lan-r2 lan-sm2"><span data-r="pay"></span><span data-r="next"></span></div><div class="lan-bar" role="presentation"><i data-r="bar"></i></div>' +
    '<small class="lan-sm" data-r="fx"></small></section><ul class="lan-list lan-emps" data-r="list" aria-label="Cargos"></ul>';
  var q = function (k) { return root.querySelector('[data-r="' + k + '"]'); };
  UI = { root: root, inc: q('inc'), pay: q('pay'), next: q('next'), bar: q('bar'), fx: q('fx'), host: q('list'), dirty: true };
  UI.list = api.list(UI.host, { key: function (s) { return s.key; }, create: function (s) {
    var li = el('li', 'lan-emp'); li.dataset.role = s.r; li.dataset.slot = s.i;
    li.innerHTML = '<span class="lan-av" aria-hidden="true"></span><div class="lan-ei"><b></b><span class="lan-pips" aria-hidden="true"></span><small class="lan-ef"></small><i class="lan-ph"></i></div>' +
      '<div class="lan-ea"><button type="button" class="btn lan-b1" data-act="main"></button><button type="button" class="btn lan-b2" data-act="fire">Dispensar</button></div>';
    var c = li.children, ei = c[1].children, ea = c[2].children;
    return { el: li, u: { av: c[0], nm: ei[0], pips: ei[1], ef: ei[2], ph: ei[3], b1: ea[0], b2: ea[1] }, update: function () {} };
  } });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function effLine(r, e) {
  var t = [], l = e ? e.l : 1;
  t.push('+' + pct(R_inc(r, l)) + ' de renda');
  if (R[r].snack) t.push('consumo +' + Math.round(R[r].snack * l * 100) + '%');
  if (R[r].mit) { var k = Object.keys(R[r].mit)[0]; t.push({ apagao: 'apagão −', briga: 'briga −', fiscal: 'fiscal −' }[k] + Math.round(R[r].mit[k] * l * 100) + '%'); }
  if (R[r].cut) t.push('salários −' + Math.round(R[r].cut * l * 100) + '%');
  if (r === 'ger') t.push(l >= 3 ? 'agenda automática ✔' : 'agenda no nível 3');
  return t.join(' · ');
}
function R_inc(r, l) { var t = 0; for (var i = 0; i < l; i++) t += R[r].inc[i]; return t; }
function render(api) {
  if (!UI || !S) return;
  var U = api.ui, sl = slots().filter(function (s) { return reqOk(api, R[s.r]) || s.i === 0; });
  var late = S.emp.some(function (e) { return e.late > 0; });
  U.text(UI.inc, '+' + pct(incTotal()) + ' de renda'); U.text(UI.pay, 'Folha: ' + api.cur + ' ' + api.fmt(payroll(api)) + '/min');
  U.text(UI.next, late ? '⚠ atrasada' : S.emp.length ? 'próximo pagamento: ' + api.fmtT(S.pd) : 'sem funcionários'); U.bar(UI.bar, S.emp.length ? 1 - S.pd / PAY_EVERY : 0);
  var F = api.shared['fn:fx'] || {}, m = F.mit || {}, bits = [];
  if (m.apagao) bits.push('apagão −' + Math.round(m.apagao * 100) + '%'); if (m.briga) bits.push('briga −' + Math.round(m.briga * 100) + '%'); if (m.trapaca) bits.push('trapaça −' + Math.round(m.trapaca * 100) + '%');
  if (F.snack) bits.push('consumo +' + Math.round(F.snack * 100) + '%'); if (F.agenda) bits.push('agenda automática');
  U.text(UI.fx, bits.length ? 'Efeitos nos torneios e na lan: ' + bits.join(' · ') : 'Contrate para reduzir apagões e confusão nos torneios. Sem pagar o salário, o funcionário pede as contas.');
  UI.list.set(sl);
  sl.forEach(function (s) {
    var node = UI.host.querySelector('[data-role="' + s.r + '"][data-slot="' + s.i + '"]'); paint(api, node, s);
  });
}
function paint(api, li, s) {
  if (!li) return; var U = api.ui, r = R[s.r], e = empAt(s.r, s.i), c = li.children, ei = c[1].children, ea = c[2].children, ok = reqOk(api, r);
  var prev = s.i > 0 && !empAt(s.r, s.i - 1);
  if (e) {
    var cost = upCost(api, e), key = 'f:' + e.id, a = armed(api, key);
    U.text(c[0], r.ic); U.text(ei[0], NAMES[e.i] + ' · ' + r.n); U.text(ei[1], '●'.repeat(e.l) + '○'.repeat(MAXL - e.l)); U.attr(ei[1], 'aria-hidden', 'true');
    U.text(ei[2], 'Nível ' + e.l + '/' + MAXL + ' · ' + effLine(s.r, e) + ' · salário ' + api.cur + ' ' + api.fmt(salRate(e) * P(api) * (1 - cut()) * PAY_EVERY) + '/min' + (e.late ? ' · ⚠ atrasado' : ''));
    U.text(ei[3], say(e)); U.hide(ei[3], false);
    U.hide(ea[1], false); U.text(ea[1], a ? 'Confirmar?' : 'Dispensar'); U.attr(ea[1], 'aria-label', (a ? 'Confirmar dispensa de ' : 'Dispensar ') + NAMES[e.i]); U.data(ea[1], 'arm', a ? '1' : '0');
    U.data(ea[0], 'id', String(e.id)); U.data(ea[1], 'id', String(e.id)); U.data(ea[0], 'kind', 'up');
    if (e.l >= MAXL) { U.text(ea[0], 'Nível máximo'); U.attr(ea[0], 'aria-disabled', 'true'); }
    else { U.text(ea[0], '▲ Nível ' + (e.l + 1) + ' · ' + api.cur + ' ' + api.fmt(cost)); U.attr(ea[0], 'aria-disabled', api.money() >= cost ? 'false' : 'true'); }
    U.data(li, 'st', 'emp');
  } else {
    var hc = hireCost(api, s.r), lvl = Math.max(1, Math.ceil((S.vet[s.r] || 0) / 2));
    U.text(c[0], ok && !prev ? r.ic : '🔒'); U.text(ei[0], r.n + (r.lim > 1 ? ' (vaga ' + (s.i + 1) + '/' + r.lim + ')' : ''));
    U.text(ei[1], ''); U.text(ei[2], ok ? r.d + ' ' + effLine(s.r, { l: lvl }) + (lvl > 1 ? ' · volta no nível ' + lvl : '') : 'Libera com ' + r.req[2] + ' (nível ' + r.req[1] + ').');
    U.text(ei[3], ''); U.hide(ei[3], true);
    U.hide(ea[1], true); U.data(ea[0], 'kind', 'hire'); U.data(ea[0], 'role', s.r);
    if (!ok) { U.text(ea[0], '🔒 Travado'); U.attr(ea[0], 'aria-disabled', 'true'); }
    else if (prev) { U.text(ea[0], 'Contrate a vaga anterior'); U.attr(ea[0], 'aria-disabled', 'true'); }
    else { U.text(ea[0], 'Contratar · ' + api.cur + ' ' + api.fmt(hc)); U.attr(ea[0], 'aria-disabled', api.money() >= hc ? 'false' : 'true'); }
    U.data(li, 'st', ok ? 'free' : 'lock');
  }
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b || !S) return;
  var li = b.closest('.lan-emp'), role = li && li.dataset.role, slot = li ? +li.dataset.slot : 0, emp = empAt(role, slot), r;
  if (b.dataset.act === 'main') {
    if (b.getAttribute('aria-disabled') === 'true') {
      api.sfx('no');
      if (!emp) { var rr = R[role]; api.toast(!reqOk(api, rr) ? 'Libera com ' + rr.req[2] : slot > 0 && !empAt(role, slot - 1) ? 'Contrate a vaga anterior primeiro' : 'Faltam ' + api.cur + ' ' + api.fmt(Math.max(0, hireCost(api, role) - api.money()))); }
      else api.toast(emp.l >= MAXL ? 'Esse já é o melhor da lan' : 'Faltam ' + api.cur + ' ' + api.fmt(Math.max(0, upCost(api, emp) - api.money())));
      return;
    }
    r = emp ? levelUp(api, emp) : hire(api, role); api.toast(r.msg); if (r.ok) { api.sfx('buy'); api.buzz(10); ach(api); api.save(); } else api.sfx('no');
  } else if (b.dataset.act === 'fire' && emp) {
    var key = 'f:' + emp.id;
    if (armed(api, key)) { arm.k = ''; remove(api, emp, false); api.toast(NAMES[emp.i] + ' foi dispensado. Sem refund, mas sem rancor.'); api.sfx('no'); api.save(); }
    else { arm.k = key; arm.until = api.now() + 4; api.toast('Toque de novo para dispensar ' + NAMES[emp.i]); }
  }
  api.invalidate();
}

Engine.registerTab('lan', {
  id: 'funcionarios', label: 'Equipe', icon: '🧑‍💼',
  ach: [
    { id: 'fn1', ic: '🧑‍💼', n: 'Carteira assinada', d: 'Contrate seu primeiro funcionário na aba Equipe.' },
    { id: 'fnfull', ic: '🏢', n: 'Quadro completo', d: 'Preencha todas as vagas da equipe.' },
    { id: 'fn5', ic: '🥇', n: 'Funcionário do mês', d: 'Leve um funcionário ao nível 5.' },
    { id: 'fnquit', ic: '📦', n: 'Pediu as contas', d: 'Deixe um funcionário sem salário até ele sair.' }
  ],
  unlock: function (api) { return api.owned('atend') >= 1; },
  mount: mount,
  load: function (d, api) {
    S = fresh(); tf = 1;
    if (d && typeof d === 'object') {
      S.seed = (+d.seed || S.seed) >>> 0; S.pd = num(d.pd, PAY_EVERY, 1, PAY_EVERY); S.hired = Math.floor(num(d.hired, 0, 0, 1e9)); S.quits = Math.floor(num(d.quits, 0, 0, 1e9)); S.paid = num(d.paid, 0, 0, 1e30);
      if (d.vet && typeof d.vet === 'object') ORDER.forEach(function (r) { var v = Math.floor(num(d.vet[r], 0, 0, MAXL)); if (v) S.vet[r] = v; });
      var cnt = {}, ids = {};
      if (Array.isArray(d.emp)) d.emp.slice(0, 12).forEach(function (e) {
        if (!e || !R[e.r]) return; cnt[e.r] = (cnt[e.r] || 0) + 1; if (cnt[e.r] > R[e.r].lim) return;
        var id = Math.floor(num(e.id, 0, 1, 1e9)) || S.nid; while (ids[id]) id++; ids[id] = 1;
        S.emp.push({ id: id, r: e.r, i: Math.floor(num(e.i, 0, 0, NAMES.length - 1)), l: Math.floor(num(e.l, 1, 1, MAXL)), late: Math.floor(num(e.late, 0, 0, 1)) });
      });
      S.nid = Math.floor(num(d.nid, 1, 1, 1e9)); S.emp.forEach(function (e) { if (e.id >= S.nid) S.nid = e.id + 1; updVet(e); });
    }
    effects(api);
  },
  save: function () { return S; },
  update: function (dt, api) {
    if (!S) return; apiR = api;
    if (S.emp.length) { S.pd -= dt; if (S.pd <= 0) { S.pd += PAY_EVERY; payday(api); if (S.pd <= 0) S.pd = PAY_EVERY; } } else S.pd = PAY_EVERY;
    autoBlackout(api);
    achT += dt; if (achT > 2) { achT = 0; ach(api); }
  },
  render: render,
  onPrestige: function (api) { /* a lan foi vendida: a equipe sai, mas a experiencia (vet) fica e reduz o recomeço */
    S.emp.forEach(updVet); S.emp = []; S.pd = PAY_EVERY; tf = 1; effects(api);
  }
});
window.LAN_FN = { R: R, ORDER: ORDER, state: function () { return S; }, hire: function (r) { return hire(apiR, r); }, levelUp: function (e) { return levelUp(apiR, e); }, payday: function () { payday(apiR); }, incTotal: incTotal, payroll: function () { return payroll(apiR); }, upCost: function (e) { return upCost(apiR, e); }, hireCost: function (r) { return hireCost(apiR, r); }, remove: function (e, q) { remove(apiR, e, q); } };
})();

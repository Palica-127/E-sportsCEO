// Testes de treino, base, idade, moral, venda e renovação + simulação de equilíbrio: node tests/treino.js
global.window = global; require('../js/data/lol.js'); require('../js/data/outros.js'); require('../js/data/nomes.js'); require('../js/core.js');
const fs = require('fs'), path = require('path');
let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) falhas++; };
const O = Org, G = 'lol', ROLES = O.GAMES.lol.roles;
const mem = {}; global.localStorage = { setItem: (k, x) => { mem[k] = x; }, getItem: k => mem[k] || null };
/* org nova com 5 titulares jovens (<= 22 anos) e caixa folgado */
function novo(seed, opt = {}) {
  O.set(O.novoJogo()); const S = O.get(); S.seed = seed; S.org.caixa = 9e7;
  const liv = O.livres(G).filter(p => p.a != null && p.a <= (opt.idadeMax || 22)).sort((a, b) => a.o - b.o);
  for (const r of ROLES) { const c = liv.filter(p => p.r === r); O.contratar(G, 't1', c[Math.floor(c.length * 0.4)]); }
  for (const [k, n] of Object.entries(opt.infra || {})) for (let i = 0; i < n; i++) O.comprarInfra(k, G);
  S.org.caixa = opt.caixa || 9e7; return S;
}
const tit = () => O.titulares(G, 't1'), soma = () => tit().reduce((a, p) => a + p.o, 0);
const manter = () => { for (const p of tit()) if (p) p.ct = 300; };

// ---- campos de treino e potencial
{ const S = novo(1); const p = tit()[0];
  ok(p.pot >= p.o && p.xp === 0 && p.foco === 'bal' && p.mo === 70 && 'tr' in p, 'contratado recebe pot, xp, foco, moral e traço');
  const j = O.potVisivel(Object.assign({}, p, { a: 17, tmp: 0 }), G), v = O.potVisivel(Object.assign({}, p, { a: 25, tmp: 0, pot: p.o + 1 }), G);
  ok(j.incerto && j.hi - j.lo >= 8 && !v.incerto && v.lo === v.hi, 'potencial: jovem de 17 tem margem grande, veterano de 25 é exato (' + j.lo + '-' + j.hi + ')');
  const q = Object.assign({}, p, { a: 18, pot: 85, o: 70, tmp: 0 }), w0 = O.potVisivel(q, G); q.tmp = 78; const w1 = O.potVisivel(q, G);
  ok(w1.hi - w1.lo < w0.hi - w0.lo, 'margem de erro diminui com o tempo no clube (' + (w0.hi - w0.lo) + ' → ' + (w1.hi - w1.lo) + ')');
  let dentro = true; for (let a = 16; a <= 24; a++) for (let i = 0; i < 40; i++) { const x = { id: 'z' + i, o: 60, pot: 60 + i, a, tmp: 0 }, v2 = O.potVisivel(x, G); if (x.pot < v2.lo || x.pot > v2.hi || v2.estrelas < 1 || v2.estrelas > 5) dentro = false; }
  ok(dentro, 'potencial real sempre dentro da faixa mostrada; estrelas de 1 a 5');
}
// ---- treino semanal
{ const S = novo(2); const p = tit()[0]; p.a = 18; p.o = 65; p.pot = 85; p.xp = 0; const o0 = p.o; let subiu = 0, xpOk = true;
  for (let i = 0; i < 52; i++) { O.avancar(1); manter(); if (p.xp < 0 || p.xp >= O.xpNecessario(p.o)) xpOk = false; }
  ok(p.o > o0 && p.o - o0 <= 8, 'jovem de 18 evolui em 1 ano (' + o0 + ' → ' + p.o + ')'); ok(xpOk, 'barra de XP sempre entre 0 e o necessário');
  ok(S.noticias.some(n => n.t.includes(p.n) && /subiu para \d+/.test(n.t)), 'mensagem "X subiu para N" registrada');
  ok(p.a === 19, 'idade sobe +1 ao fim do ano (18 → ' + p.a + ')');
  const v = tit()[1]; v.a = 28; v.o = 80; v.pot = 80; v.xp = 0; const ov = v.o; O.avancar(26); ok(v.o === ov && O.ganhoXp(v, G, 't1', true) === 0, 'veterano no potencial só mantém a nota');
  p.pot = p.o; O.avancar(30); manter(); ok(p.o <= p.pot, 'nunca passa do potencial');
  const velho = tit()[2]; velho.a = 24; velho.o = 70; velho.pot = 80; ok(O.ganhoXp(velho, G, 't1', true) < O.ganhoXp(Object.assign({}, velho, { a: 18 }), G, 't1', true) * 0.5, 'veterano ganha muito menos XP que jovem');
}
// ---- idade: só o usuário envelhece, +1 por ano
{ const S = novo(3, { infra: { base: 1 } }); const a0 = tit().map(p => p.a); S.base.lol = [{ id: 'bx', n: 'Teste', o: 60, pot: 80, a: 17, r: 'TOP', c: 'BR', t: 'Base', l: 'Base' }];
  const dados0 = JSON.stringify(LOL.leagues);
  O.avancar(52); manter(); O.avancar(52); manter();
  ok(tit().every((p, i) => p.a === a0[i] + 2), 'titulares envelhecem 1 ano por ano de jogo (2 anos: +2)');
  ok(S.base.lol[0].a === 19, 'jovem da base também envelhece');
  ok(JSON.stringify(LOL.leagues) === dados0, 'pros das ligas (dados) não são tocados pelo treino');
  O.avancar(52 * 2); ok(!S.base.lol.some(x => x.id === 'bx'), 'quem completa 21 anos na base sai dela');
}
// ---- focos e moral
{ const mk = f => { const p = { id: 'f' + f, n: 'F', o: 70, pot: 90, a: 19, xp: 0, mo: 70, foco: f, tr: null, tmp: 0 }; return p; };
  novo(4); const g = f => O.ganhoXp(mk(f), G, 't1', true);
  ok(g('mec') > g('bal') && g('bal') > g('men') && g('men') > g('fis'), 'XP por foco: mecânica > equilibrado > mentalidade > físico');
  const S = O.get(); const A = tit()[0], B = tit()[1]; A.foco = 'mec'; B.foco = 'men'; for (let i = 0; i < 30; i++) { O.avancar(1); manter(); }
  ok(A.mo < B.mo - 4, 'mecânica desgasta a moral e mentalidade sobe (' + A.mo.toFixed(0) + ' x ' + B.mo.toFixed(0) + ')');
  const f0 = O.forca(G, 't1'); tit().forEach(p => { p.foco = 'men'; p.mo = 70; }); const f1 = O.forca(G, 't1'); ok(f1 > f0 - 1 && O.bonusEquipe(G, 't1') <= 0.3 + 0.45 + 0.7, 'liderança/mentalidade dão um pequeno bônus de força limitado');
  tit().forEach(p => { p.foco = 'bal'; p.tr = null; p.mo = 100; }); const bm = O.bonusEquipe(G, 't1'); tit().forEach(p => { p.mo = 0; }); ok(bm <= 0.7 && O.bonusEquipe(G, 't1') >= -1, 'bônus de moral limitado entre -1 e +0,7');
  ok(O.trocarFoco(G, 't1', 0, 'fis').ok && tit()[0].foco === 'fis' && !O.trocarFoco(G, 't1', 0, 'xx').ok, 'troca de foco por jogador');
  ok(O.focoEquipe(G, 't1', 'mec').ok && tit().every(p => p.foco === 'mec'), 'foco para o time inteiro');
  tit()[0].mo = 20; ok(O.tendencia(tit()[0], G, 't1', true).s === '↓', 'moral muito baixa mostra tendência ↓');
}
// ---- estrutura e foco da semana: mais XP com retornos decrescentes
{ const S = novo(5); const p = { id: 'e', n: 'E', o: 70, pot: 90, a: 19, xp: 0, mo: 70, foco: 'bal', tr: null, tmp: 0 };
  const xpCasa = n => { S.infra.lol = { casa: n }; return O.ganhoXp(p, G, 't1', true); }; const x = [0, 1, 2, 3, 4, 5].map(xpCasa);
  ok(x.every((v, i) => !i || v > x[i - 1]), 'cada nível da gaming house aumenta o XP (' + x.map(v => v.toFixed(2)).join(' < ') + ')');
  ok(x[1] - x[0] > x[5] - x[4], 'retornos decrescentes: o 1º nível rende mais que o 5º (+' + (x[1] - x[0]).toFixed(3) + ' x +' + (x[5] - x[4]).toFixed(3) + ')');
  S.infra.lol = { casa: 5, nutri: 3, academia: 3 }; S.foco = 'treino'; p.foco = 'mec'; ok(O.ganhoXp(p, G, 't1', true) / O.ganhoXp(Object.assign({}, p, { foco: 'bal' }), G, 't1', true) < 1.31 && O.ganhoXp(p, G, 't1', true) < x[0] * 2.2, 'com tudo no máximo o XP não passa de ~2x o básico (' + (O.ganhoXp(p, G, 't1', true) / x[0]).toFixed(2) + 'x)');
  S.foco = 'nenhum'; S.infra.lol = {}; const b = O.ganhoXp(p, G, 't1', true); S.foco = 'treino'; ok(O.ganhoXp(p, G, 't1', true) > b, 'foco da semana "treino" acelera o XP');
  ok(O.ganhoXp(p, G, 't1', false) < O.ganhoXp(p, G, 't1', true), 'reservas treinam um pouco menos');
}
// ---- treina bem vs não treina: mais forte, com diferença limitada
{ const res = {};
  for (const [nome, cfg] of [['nao', {}], ['bem', { infra: { casa: 5, nutri: 2, academia: 2 }, foco: 'treino', pf: 'mec' }]]) {
    let s = 0, n = 0;
    for (const seed of [11, 12, 13, 14]) { const S = novo(seed, { infra: cfg.infra }); if (cfg.foco) O.setFoco(cfg.foco); if (cfg.pf) tit().forEach(p => { p.foco = cfg.pf; }); const i0 = soma(); for (let y = 0; y < 4; y++) { O.avancar(52); manter(); S.org.caixa = 9e7; } s += soma() - i0; n++; }
    res[nome] = s / n;
  }
  ok(res.bem > res.nao + 1.5, 'quem treina bem fica mais forte em 4 anos (+' + res.bem.toFixed(1) + ' x +' + res.nao.toFixed(1) + ' de nota somada)');
  ok(res.bem < res.nao * 2.2 + 3, 'a vantagem do treino é limitada (não vira bola de neve)');
}
// ---- envelhecimento de veteranos
{ const dec = (foco, aca) => { let t = 0; for (let seed = 20; seed < 40; seed++) { const S = novo(seed, { idadeMax: 40 }); S.infra.lol = { academia: aca }; tit().forEach(p => { p.a = 31; p.o = 80; p.pot = 80; p.foco = foco; }); for (let y = 0; y < 3; y++) { O.avancar(52); manter(); } t += tit().reduce((a, p) => a + (80 - p.o), 0); } return t / 20 / 5; };
  const d0 = dec('bal', 0), d1 = dec('fis', 3); ok(d0 > 1 && d1 < d0, 'veteranos de 31+ perdem nota com os anos, e o foco Físico + academia reduz a queda (' + d0.toFixed(1) + ' → ' + d1.toFixed(1) + ' por jogador em 3 anos)');
}
// ---- base: nomes, países, idades, potencial
{ const flagsOk = c => fs.existsSync(path.join(__dirname, '..', 'flags', c.toLowerCase() + '.svg'));
  ok(Object.keys(NOMES.paises).every(flagsOk), 'todo país da lista de nomes tem bandeira em flags/');
  ok(Object.values(NOMES.pesos).every(w => Object.keys(w).every(c => NOMES.paises[c])), 'todo país dos pesos tem lista de nomes');
  const medias = {}, cont = {}, gen = {}; let nomes = [], idadeOk = true, roleOk = true, bandOk = true, regiaoOk = true;
  for (const g of Object.keys(O.GAMES)) {
    for (const nv of [1, 3, 5]) { let n = 0, pot = 0, o = 0, ciclos = 0, gn = 0;
      for (let seed = 1; seed <= 60; seed++) { O.set(O.novoJogo()); const S = O.get(); S.seed = seed * 7 + nv; S.games[g].aberto = true; S.games[g].squads.t1.on = true; S.infra[g] = { base: nv }; S.base[g] = [];
        O.gerarBase(g); const l = S.base[g]; ciclos++; for (const p of l) { n++; pot += p.pot; o += p.o; if (p.genio) gn++; nomes.push([g, p]); if (p.a < 16 || p.a > 19) idadeOk = false; if (!O.GAMES[g].roles.includes(p.r)) roleOk = false; if (!flagsOk(p.c)) bandOk = false; if (p.pot < p.o + 3 || p.pot > 96) idadeOk = false; } }
      medias[g + nv] = { n: n / ciclos, pot: pot / n, o: o / n, gn };
    } }
  ok(idadeOk && roleOk && bandOk, 'jovens: 16–19 anos, papel do jogo, bandeira existente, pot. entre nota+3 e 96');
  const m = k => medias['lol' + k];
  ok(m(5).pot > m(1).pot + 8 && m(5).o > m(1).o + 5, 'nível da base melhora potencial e nota (pot ' + m(1).pot.toFixed(1) + ' → ' + m(3).pot.toFixed(1) + ' → ' + m(5).pot.toFixed(1) + ')');
  ok(m(1).n === 1 && m(5).n > 1.4 && m(5).n <= 3, 'base alta revela mais de um jovem por ciclo (nv1 ' + m(1).n.toFixed(2) + ', nv5 ' + m(5).n.toFixed(2) + ')');
  const ge = Object.entries(medias).filter(([k]) => k.endsWith('5')).reduce((a, [, v]) => a + v.gn, 0), tot5 = Object.entries(medias).filter(([k]) => k.endsWith('5')).reduce((a, [, v]) => a + v.n * 60, 0);
  ok(ge > 0 && ge / tot5 < 0.15, 'gênios existem mas são raros no nível 5 (' + ge + ' em ' + Math.round(tot5) + ')');
  O.set(O.novoJogo()); { const S0 = O.get(), vistos = new Set(); S0.games.lol.squads.t1.on = true; S0.infra.lol = { base: 5 }; for (let i = 0; i < 80; i++) { S0.seed = 900 + i * 13; S0.base.lol = []; O.gerarBase('lol'); S0.base.lol.forEach(p => vistos.add(p.n.toLowerCase())); } ok(vistos.size > 120, 'nomes variados na região CBLOL (' + vistos.size + ' distintos em ~160 jovens)'); }
  const plaus = nomes.every(([, p]) => /^[A-Za-zÀ-ÿ0-9_ ]{2,20}$/.test(p.n) && !/(.)\1\1/.test(p.n)); ok(plaus, 'nomes legíveis (sem lixo de sílabas aleatórias)');
  const base = new Set(); for (const c in NOMES.paises) NOMES.paises[c].a.forEach(x => base.add(x.toLowerCase()));
  const prontos = nomes.filter(([, p]) => base.has(p.n.toLowerCase())).length; ok(prontos > nomes.length * 0.3, 'boa parte vem dos apelidos por país (' + Math.round(prontos / nomes.length * 100) + '%)');
  // nacionalidade segue a região
  O.set(O.novoJogo()); let S = O.get(); S.org.regiao = 'LCK'; const nac = {}; for (let i = 0; i < 300; i++) nac[(() => { S.seed = i + 1; return O.get() && (function () { S.infra.lol = { base: 1 }; S.base.lol = []; S.games.lol.squads.t1.on = true; O.gerarBase('lol'); return S.base.lol[0].c; })(); })()] = 1;
  ok(Object.keys(nac).includes('KR'), 'região LCK revela coreanos'); S.org.regiao = 'CBLOL'; let br = 0; for (let i = 0; i < 100; i++) { S.seed = i + 500; S.base.lol = []; O.gerarBase('lol'); if (S.base.lol[0].c === 'BR') br++; } ok(br > 70, 'região CBLOL revela sobretudo brasileiros (' + br + '%)');
  // cheia: não revela; sem nível: nada
  O.set(O.novoJogo()); S = O.get(); S.games.lol.squads.t1.on = true; S.infra.lol = { base: 2 }; for (let i = 0; i < 10; i++) O.gerarBase('lol'); ok(S.base.lol.length === O.capBase(2) && O.capBase(2) === 3 && O.capBase(5) === 5, 'base respeita o limite por nível');
  S.infra.lol = {}; S.base.lol = []; O.gerarBase('lol'); ok(S.base.lol.length === 0, 'sem a categoria de base não há jovens');
}
// ---- promover, vender, dispensar e revenda
{ const S = novo(6, { infra: { base: 2 } }); S.base.lol = []; for (let i = 0; i < 4; i++) O.gerarBase(G);
  const b = S.base.lol; ok(b.length >= 1, 'base cheia de jovens'); const j = b[0], c0 = S.org.caixa, pv = O.valorVenda(j);
  ok(O.venderBase(G, j.id).ok && S.org.caixa === c0 + pv && !S.base.lol.some(x => x.id === j.id), 'vender jovem da base entra dinheiro (' + O.money(pv) + ')');
  if (S.base.lol[0]) { const k = S.base.lol[0]; ok(O.dispensarBase(G, k.id).ok && !S.base.lol.some(x => x.id === k.id), 'dispensar jovem da base'); }
  const q = S.games.lol.squads.t1.slots[0], fee0 = q.fee, cx = S.org.caixa; q.o += 6; q.pot = Math.max(q.pot, q.o); const vv = O.valorVenda(q);
  ok(vv > fee0 * 0.6 * 2, 'jogador que evoluiu vale bem mais que o preço pago (' + O.money(fee0) + ' → venda ' + O.money(vv) + ')');
  const antes = S.games.lol.squads.t1.slots[0].id; ok(O.vender(G, 't1', 0).ok && !S.games.lol.squads.t1.slots[0] && S.org.caixa === cx + vv, 'vender jogador do elenco'); ok(!O.livres(G).some(p => p.id === antes), 'vendido não volta ao mercado');
  ok(!O.vender(G, 't1', 0).ok, 'vaga vazia não vende');
  const x = S.games.lol.squads.t1.slots[1]; const cheio = O.valorVenda(Object.assign({}, x, { ct: 104 })), curto = O.valorVenda(Object.assign({}, x, { ct: 4 })); ok(curto < cheio, 'contrato curto desvaloriza a venda');
  const est = S.games.lol.squads.t1.slots[2]; est.estrela = true; ok(!O.vender(G, 't1', 2).ok, 'estrela não pode ser vendida');
  const jv = { id: 'bz', n: 'Joia', o: 66, pot: 90, a: 17, r: 'MID', c: 'BR', t: 'Base', l: 'Base' }; ok(O.valorVenda(jv) > O.valorVenda(Object.assign({}, jv, { pot: 68 })) * 2, 'potencial alto valoriza o jovem');
  S.base.lol = [Object.assign({}, jv)]; const lv = S.games.lol.squads.t1.slots.slice(0, 5).map(p => p && p.id); S.games.lol.squads.t1.slots[3] = null; S.games.lol.squads.t1.slots[5] = null;
  ok(O.promoverBase(G, 't1', 'bz').ok && S.games.lol.squads.t1.slots.some(p => p && p.id === 'bz' && p.pot === 90 && p.fee === 0 && p.ct === 104), 'promover mantém potencial e traços e dá contrato');
}
// ---- renovação com negociação
{ const S = novo(7); const p = tit()[0]; p.ct = 30; const c0 = p.ct;
  const a = O.propostaRenovar(p, 'baixa', 2), b = O.propostaRenovar(p, 'justa', 2), c = O.propostaRenovar(p, 'alta', 2);
  ok(a.custo <= b.custo && b.custo <= c.custo && a.chance < b.chance && b.chance <= c.chance, 'oferta baixa é mais barata mas arriscada; generosa é segura');
  ok(O.propostaRenovar(p, 'justa', 1).custo <= b.custo && O.propostaRenovar(p, 'justa', 3).custo >= b.custo, 'contrato mais longo custa mais');
  ok(O.renovar(G, 't1', 0).ok && p.ct === c0 + 104, 'renovar padrão = oferta justa por 2 anos (+104 semanas)');
  let rec = 0, acc = 0; for (let i = 0; i < 60; i++) { p.neg = 0; p.mo = 70; p.ct = 30; const r = O.renovar(G, 't1', 0, 'baixa', 1); if (r.ok) acc++; else if (r.recusou) { rec++; ok(p.neg === 4 && p.mo === 62, 'recusa deixa o jogador chateado (moral -8) e bloqueia novas conversas'); break; } }
  ok(rec === 1, 'oferta baixa pode ser recusada (' + acc + ' aceitas antes)'); ok(!O.renovar(G, 't1', 0, 'justa', 2).ok, 'após recusa ele não quer conversar logo');
  p.neg = 0; p.mo = 50; p.ct = 30; ok(O.renovar(G, 't1', 0, 'alta', 3).ok && p.mo === 60 && p.ct === 30 + 156, 'oferta generosa melhora a moral e renova por 3 anos');
  S.org.caixa = 0; p.neg = 0; ok(!O.renovar(G, 't1', 0, 'alta', 3).ok || O.propostaRenovar(p, 'alta', 3).custo === 0, 'sem caixa não renova');
}
// ---- custo da base e save/migração
{ const S = novo(8, { infra: { base: 3 } }); S.base.lol = []; const sem = O.projecao(G).despesa; O.gerarBase(G); O.gerarBase(G); ok(O.custoBase(G) === 3 * 400 + S.base.lol.length * 250 && O.projecao(G).despesa === sem - 3 * 400 + O.custoBase(G), 'manter a base custa por semana (' + O.money(O.custoBase(G)) + ')');
  const old = O.novoJogo(); old.games.lol.squads.t1.on = true; old.games.lol.squads.t1.slots[0] = { id: 'lol-CBLOL-1-0-0', n: 'Velho', o: 70, a: 19, r: 'TOP', t: 'X', l: 'Y', fee: 1000, ct: 50 }; old.base.lol = [{ id: 'b1', n: 'Kaka', o: 60, pot: 75, a: 17, r: 'MID', t: 'Base', l: 'Base' }]; delete old.noticias; delete old.vendidos;
  mem['org-v1'] = JSON.stringify(old); ok(O.load(), 'save antigo carrega'); const g = O.get(), pv = g.games.lol.squads.t1.slots[0];
  ok(pv.pot >= 70 && pv.pot <= 96 && pv.xp === 0 && pv.foco === 'bal' && pv.mo === 70 && Array.isArray(g.noticias) && Array.isArray(g.vendidos) && g.base.lol[0].foco === 'bal' && g.base.lol[0].mo === 70, 'migração completa pot/xp/foco/moral/traço dos jogadores e da base');
  O.avancar(5); ok(Number.isFinite(O.get().org.caixa), 'save migrado joga normalmente');
  novo(9); O.save(); const t0 = JSON.stringify(O.get().games); O.set(O.novoJogo()); O.load(); ok(JSON.stringify(O.get().games) === t0, 'save e load preservam treino e moral');
}
// ---- equilíbrio econômico: 8 anos com treino + base não quebram a economia
{ const rodar = (seed, treina) => { const S = novo(seed, { caixa: 3e6, infra: treina ? { casa: 3, nutri: 1, base: 3 } : {} }); S.org.caixa = 3e6; O.ofertas(); if (treina) { O.setFoco('treino'); tit().forEach(p => { p.foco = 'mec'; }); }
      const hist = []; let c0 = S.org.caixa; for (let y = 0; y < 8; y++) { O.avancar(52); manter(); S.base.lol && S.base.lol.slice().forEach(p => { if (p.a >= 19 && p.pot >= 76) { const r = O.promoverBase(G, 't1', p.id); if (!r.ok) O.venderBase(G, p.id); } }); hist.push(Math.round(S.org.caixa / 1000)); }
      const f = O.forca(G, 't1'); return { f, caixa: S.org.caixa, folha: O.folha(G, 't1'), hist }; };
  const A = [], B = []; for (const seed of [31, 32, 33, 34, 35]) { A.push(rodar(seed, false)); B.push(rodar(seed, true)); }
  const med = (L, k) => L.reduce((a, x) => a + x[k], 0) / L.length;
  console.log('     caixa (mil) por ano, sem treino/base: ', A[0].hist.join(' '), '| com treino/base:', B[0].hist.join(' '));
  console.log('     força média: sem ' + med(A, 'f').toFixed(1) + ' | com ' + med(B, 'f').toFixed(1) + ' ; folha média: sem ' + O.money(med(A, 'folha')) + ' | com ' + O.money(med(B, 'folha')));
  ok([...A, ...B].every(r => Number.isFinite(r.caixa) && r.hist.every(Number.isFinite)), 'economia finita em 8 anos');
  ok(med(B, 'f') > med(A, 'f'), 'com treino e base o time fica mais forte (' + med(B, 'f').toFixed(1) + ' x ' + med(A, 'f').toFixed(1) + ')');
  ok(med(B, 'f') - med(A, 'f') < 9, 'mas a vantagem de força é moderada (<9 pontos): ' + (med(B, 'f') - med(A, 'f')).toFixed(1));
  ok(med(B, 'folha') < med(A, 'folha') * 3 + 20000, 'a folha não explode com a evolução dos jogadores');
  ok(med(B, 'caixa') < 5e7, 'o caixa não explode (' + O.money(med(B, 'caixa')) + ')'); { const S = O.get(); ok(O.custoBase(G) < O.projecao(G).receita * 0.6, 'custo semanal da base (' + O.money(O.custoBase(G)) + ') é bem menor que a receita-base do time (' + O.money(O.projecao(G).receita) + ')'); }
}
console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);

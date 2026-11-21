// Trace determinístico (semente fixa) para conferir o port Godot: node tests/trace.js [anos]
global.window = global; require('../js/data/lol.js'); require('../js/data/outros.js'); require('../js/data/lolx.js'); require('../js/data/nomes.js'); require('../js/core.js');
const O = Org, anos = +process.argv[2] || 3, jogo = process.argv[3] || 'lol';
O.set(O.novoJogo()); const S = O.get(); S.seed = 424242; O.mundoSync();
O.iniciar({ game: jogo, nome: 'Teste', regiao: undefined }); O.semEstrela();
const reg = O.regiaoDe(jogo), roles = O.GAMES[jogo].roles;
const livres = O.livres(jogo).filter(p => p.o <= 74).sort((a, b) => b.o - a.o || (a.id < b.id ? -1 : 1));
for (const r of roles) { const p = livres.find(x => x.r === r); O.contratar(jogo, 't1', p); }
O.comprarInfra('base', jogo); O.comprarInfra('casa', jogo); O.setFoco('treino');
const out = [];
for (let w = 1; w <= 52 * anos; w++) {
  if (w % 100 === 0) S.games[jogo].squads.t1.slots.forEach((p, i) => { if (p) O.renovar(jogo, 't1', i, 'justa', 2); });
  O.avancar(1);
  if (w % 52 === 0) out.push(`ano ${S.org.ano} cx=${S.org.caixa} rep=${S.org.rep.toFixed(4)} seg=${S.social.seg} seed=${S.seed} logN=${S.logN} forca=${O.forca(jogo, 't1').toFixed(3)} mundo=${S.mundo.n} apos=${S.mundo.apos.length}`);
}
const sl = S.games[jogo].squads.t1.slots.map(p => p ? `${p.n}:${p.o}/${p.pot}/${p.a}` : '-').join(',');
out.push('elenco ' + sl); out.push('base ' + (S.base[jogo] || []).map(p => `${p.n}:${p.o}/${p.pot}`).join(','));
out.push('intl ' + S.intlHist.map(x => `${x.y}${x.tipo}:${x.camp}`).join(' | '));
const c = S.comp[jogo + '-t1']; out.push('hist ' + c.hist.map(h => `${h.y}s${h.s}:${h.camp}>${h.vice}${h.eu ? '*' + h.eu : ''}`).join(' | '));
out.push('log ' + S.log.slice(0, 6).join(' // '));
out.push('reg ' + Object.keys(S.reg[jogo] || {}).map(y => y + ':' + S.reg[jogo][y].length).join(',') + ' bo=' + Object.keys(S.bo[jogo] || {}).join(',') + ' hon=' + Object.keys(S.hon[jogo] || {}).length);
console.log(out.join('\n'));

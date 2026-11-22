import { useState } from 'react';
import { GAMES } from '../../engine/games';
import { moeda } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { COMODOS, KITS, ORDEM_COMODOS, QUARTOS, SEDES, construir, custoComodo, custoSede, diasObra, mudarSede, trocarKit, usados } from '../../engine/sede';
import { NOME_COMODO } from '../../engine/staff';
import type { ComodoId, State } from '../../engine/types';
import { act, useGame } from '../../store';
import { Bar, Panel } from '../common';

const FOTO = ['casa-mediana', 'casa-grande', 'mansao', 'predio'];
const GRADE: [number, number][] = [[2, 2], [3, 2], [4, 2], [3, 3]];

/** desenho isométrico da sede: cada cômodo construído aparece na planta */
function Planta({ s }: { s: State }) {
  const [cols, rows] = GRADE[s.sede.nivel];
  const TW = 150, TH = 76, H = 30;
  type Cel = { id: string; nome: string; ico: string; cor: string; nivel: number; obra: boolean; vazio: boolean };
  const cels: Cel[] = [{ id: 'quartos', nome: 'Quartos', ico: '🛏', cor: '#94a3b8', nivel: 1, obra: false, vazio: false }];
  for (const id of ORDEM_COMODOS) {
    const c = s.sede.comodos[id];
    if (!c) continue;
    cels.push({ id, nome: NOME_COMODO[id], ico: COMODOS[id].ico, cor: COMODOS[id].cor, nivel: c.nivel, obra: !!(c.obraAte && c.obraAte > s.dia), vazio: false });
  }
  while (cels.length < SEDES[s.sede.nivel].vagas + 1) cels.push({ id: 'vazio' + cels.length, nome: 'Vaga livre', ico: '+', cor: '#64748b', nivel: 0, obra: false, vazio: true });
  const pos = cels.slice(0, cols * rows).map((c, i) => ({ c, col: i % cols, row: Math.floor(i / cols) }));
  const P = (col: number, row: number) => [(col - row) * TW / 2, (col + row) * TH / 2];
  const xs = pos.flatMap(p => { const [x] = P(p.col, p.row); return [x - TW / 2, x + TW / 2]; });
  const ys = pos.flatMap(p => { const [, y] = P(p.col, p.row); return [y - TH / 2 - H - 30, y + TH / 2]; });
  const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60, minY = Math.min(...ys) - (s.sede.nivel === 3 ? 160 : 40), maxY = Math.max(...ys) + 50;
  const dia = (x: number, y: number) => `${x},${y - TH / 2} ${x + TW / 2},${y} ${x},${y + TH / 2} ${x - TW / 2},${y}`;
  const [gx, gy] = P((cols - 1) / 2, (rows - 1) / 2);
  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}>
      <defs>
        <pattern id="obra" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="rgba(0,0,0,.35)" /><rect width="6" height="12" fill="rgba(242,192,55,.75)" /></pattern>
        <radialGradient id="chao" cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#2f4a3a" /><stop offset="1" stopColor="#1b2a22" /></radialGradient>
      </defs>
      {/* terreno */}
      <polygon points={dia(gx, gy).split(' ').map(pt => { const [x, y] = pt.split(',').map(Number); return `${gx + (x - gx) * (cols + rows) * 0.62},${gy + (y - gy) * (cols + rows) * 0.62}`; }).join(' ')} fill="url(#chao)" opacity=".9" />
      {s.sede.nivel === 2 && (() => { const [x, y] = P(cols, rows - 1); return <g><polygon points={dia(x + 10, y + 6)} fill="#1e88c8" stroke="#9fd8f5" strokeWidth="3" /><text x={x + 10} y={y + 12} textAnchor="middle" fontSize="16" fill="#e0f4ff" fontFamily="Saira" fontWeight="700">PISCINA</text></g>; })()}
      {s.sede.nivel === 3 && [4, 3, 2, 1].map(k => { const [x, y] = P((cols - 1) / 2, (rows - 1) / 2); return <polygon key={k} points={dia(x, y - k * 36 - 40)} fill="none" stroke="rgba(160,190,230,.25)" strokeWidth="2" transform={`scale(1) translate(0,0)`} />; })}
      {pos.sort((a, b) => a.col + a.row - (b.col + b.row)).map(({ c, col, row }) => {
        const [x, y] = P(col, row);
        const l = [x - TW / 2, y], t = [x, y - TH / 2], r = [x + TW / 2, y];
        return (
          <g key={c.id}>
            <polygon points={dia(x, y)} fill={c.vazio ? 'rgba(255,255,255,.04)' : c.cor} opacity={c.vazio ? 1 : 0.55} stroke={c.vazio ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.35)'} strokeWidth="2" strokeDasharray={c.vazio ? '8 6' : undefined} />
            {!c.vazio && <>
              <polygon points={`${l[0]},${l[1]} ${t[0]},${t[1]} ${t[0]},${t[1] - H} ${l[0]},${l[1] - H}`} fill="#cfd8e6" opacity=".85" />
              <polygon points={`${t[0]},${t[1]} ${r[0]},${r[1]} ${r[0]},${r[1] - H} ${t[0]},${t[1] - H}`} fill="#a9b6c9" opacity=".85" />
              <polygon points={`${l[0]},${l[1] - H} ${t[0]},${t[1] - H} ${r[0]},${r[1] - H} ${t[0]},${t[1] - H + 6} `} fill="rgba(255,255,255,.25)" />
            </>}
            {c.obra && <polygon points={dia(x, y)} fill="url(#obra)" opacity=".85" />}
            <text x={x} y={y + 10} textAnchor="middle" fontSize={c.vazio ? 30 : 32} fill={c.vazio ? 'rgba(255,255,255,.4)' : '#fff'}>{c.ico}</text>
            <text x={x} y={y + 30} textAnchor="middle" fontSize="11" fontFamily="Saira" fontWeight="700" fill="#fff" style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,.7)', strokeWidth: 3 }}>{c.obra ? 'EM OBRA' : c.nome.toUpperCase()}{!c.vazio && c.id !== 'quartos' && !c.obra ? ` · ${c.nivel}` : ''}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SedeTela() {
  const s = useGame()!;
  const [msg, setMsg] = useState('');
  const T = SEDES[s.sede.nivel];
  const nJog = s.jogos.reduce((a, g) => a + s.teams[s.orgTeams[g]!].elenco.length, 0);
  const faz = (f: () => string | null, ok: string) => { const e = act(f); setMsg(e ?? ok); };
  return (
    <div className="sede">
      <div>
        <div className="sede-vis">
          <img className="sv-capa" src={`/sede/${FOTO[s.sede.nivel]}.webp`} alt="" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
          <div className="sv-t"><b>{T.nome}</b><small>{s.sede.posse === 'compra' ? 'Própria' : 'Alugada'} · {usados(s)}/{T.vagas} cômodos · {nJog}/{QUARTOS[s.sede.nivel]} camas</small></div>
          <Planta s={s} />
        </div>
        {s.sede.mudancaAte && s.sede.mudancaAte > s.dia && <div className="alerta meh" style={{ marginTop: 10 }}><b>!</b>Mudança em andamento até {fmtData(s.sede.mudancaAte, false)}: treino atrapalhado.</div>}
        {nJog > QUARTOS[s.sede.nivel] && <div className="alerta bad" style={{ marginTop: 10 }}><b>!</b>Casa lotada: {nJog} jogadores para {QUARTOS[s.sede.nivel]} camas. A moral cai.</div>}
        <div style={{ height: 20 }} />
        <Panel title="Periféricos">
          {s.jogos.map(g => {
            const k = s.kits[g] ?? { nivel: 0, desgaste: 0 };
            const reforma = k.desgaste >= 60;
            const prox = KITS[Math.min(3, k.nivel + (reforma ? 0 : 1))];
            return (
              <div key={g} className="kit">
                <span className="gtag" style={{ ['--g' as string]: GAMES[g].cor }}>{GAMES[g].curto}</span>
                <div><b>Kit {KITS[k.nivel].nome}</b>{k.patro && <small> · fornecido por {k.patro}</small>}<div className="mut sm">{KITS[k.nivel].desc}</div><div className="row sm">Desgaste <Bar v={100 - k.desgaste} /></div></div>
                <button className="btn sm" disabled={k.nivel === 3 && !reforma} onClick={() => faz(() => trocarKit(s, g), 'Kit atualizado.')}>{reforma ? 'Reformar' : `Kit ${prox.nome}`} · {moeda(k.patro ? Math.round(prox.custo * 0.3) : prox.custo)}</button>
              </div>
            );
          })}
        </Panel>
      </div>
      <div>
        <Panel title="Cômodos" right={<span className="mut">Custo semanal da sede: {moeda(custoSede(s))}</span>}>
          {ORDEM_COMODOS.map(id => {
            const c = s.sede.comodos[id as ComodoId];
            const info = COMODOS[id];
            const obra = c?.obraAte && c.obraAte > s.dia;
            const nivel = c?.nivel ?? 0;
            return (
              <div key={id} className={'comodo ' + (c ? '' : 'off')} style={{ ['--c' as string]: info.cor }}>
                <span className="cm-ic">{info.ico}</span>
                <div><b>{NOME_COMODO[id]}</b><span className="niveis">{[1, 2, 3].map(n => <i key={n} className={n <= nivel ? 'on' : ''} />)}</span><p>{obra ? `Em obra até ${fmtData(c!.obraAte!, false)}` : info.desc}</p></div>
                {nivel < 3 && !obra ? <button className="btn sm" onClick={() => faz(() => construir(s, id), `Obra iniciada: ${NOME_COMODO[id]}. Fica pronta em ${diasObra(nivel + 1)} dias.`)}>{nivel ? 'Melhorar' : 'Construir'} · {moeda(custoComodo(id, nivel + 1))}</button> : <span className="mut sm">{obra ? 'em obra' : 'máximo'}</span>}
              </div>
            );
          })}
        </Panel>
        <div style={{ height: 20 }} />
        <Panel title="Mudar de sede">
          <div className="sedes-op">
            {SEDES.map((x, i) => (
              <div key={x.nome} className={'sop ' + (i === s.sede.nivel ? 'on' : '')}>
                <b>{x.nome}</b><p>{x.desc}</p>
                <small>{x.vagas} cômodos · {QUARTOS[i]} camas</small>
                {i !== s.sede.nivel || s.sede.posse === 'aluguel' ? <>
                  {i !== s.sede.nivel && <button className="btn ghost sm" onClick={() => faz(() => mudarSede(s, i, 'aluguel'), `Mudança para ${x.nome} marcada (7 dias).`)}>Alugar · {moeda(x.aluguel * 4)}/mês</button>}
                  <button className="btn sm" onClick={() => faz(() => mudarSede(s, i, 'compra'), `${x.nome} comprada!`)}>Comprar · {moeda(x.compra)}</button>
                </> : <small className="pos">Sua sede (própria)</small>}
              </div>
            ))}
          </div>
          <p className="mut sm" style={{ marginTop: 10 }}>Ao vender uma sede própria você recebe 80% do valor. Mudar leva 7 dias e atrapalha o treino.</p>
        </Panel>
        {msg && <div className="retorno">{msg}</div>}
      </div>
    </div>
  );
}

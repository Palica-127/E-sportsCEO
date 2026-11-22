import { custosFixos, folhaSemanal, moeda, receitasFixas } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { useGame } from '../../store';
import { Linha, Panel } from '../common';

export function Financas() {
  const s = useGame()!;
  const rec = receitasFixas(s);
  const desp = { 'Salários': folhaSemanal(s), ...custosFixos(s) };
  const tr = Object.values(rec).reduce((a, b) => a + b, 0), td = Object.values(desp).reduce((a, b) => a + b, 0);
  const hist = s.fin.slice(-26);
  
  return (
    <div className="fin">
      <div className="fin-top">
        <Panel title="Caixa"><b className={'big-n ' + (s.org.caixa < 0 ? 'neg' : '')}>{moeda(s.org.caixa)}</b></Panel>
        <Panel title="Saldo por semana"><b className={'big-n ' + (tr - td < 0 ? 'neg' : 'pos')}>{tr - td >= 0 ? '+' : ''}{moeda(tr - td)}</b><small className="mut">sem contar premiações</small></Panel>
      </div>
      <div className="two">
        <Panel title="Receitas semanais">{Object.entries(rec).map(([k, v]) => <div key={k} className="kv"><span>{k}</span><b className="pos">{moeda(v)}</b></div>)}<div className="kv tot"><span>Total</span><b>{moeda(tr)}</b></div></Panel>
        <Panel title="Despesas semanais">{Object.entries(desp).map(([k, v]) => <div key={k} className="kv"><span>{k}</span><b className="neg">{moeda(v)}</b></div>)}<div className="kv tot"><span>Total</span><b>{moeda(td)}</b></div></Panel>
      </div>
      <Panel title="Patrocinadores">
        {s.patro.length === 0 ? <p className="mut">Nenhum patrocinador ainda. As propostas chegam pela caixa de entrada.</p> :
          s.patro.map(p => <div key={p.id} className="kv"><span>{p.marca}</span><b>{moeda(p.semanal)}/sem · até {fmtData(p.ate, false)}</b></div>)}
      </Panel>
      <Panel title="Caixa nas últimas semanas">
        {hist.length < 2 ? <p className="mut">O gráfico aparece depois de algumas semanas.</p> : (
          <>
            <Linha vals={hist.map(h => Math.round(h.caixa / 1000))} w={1300} h={140} />
            <p className="mut" style={{ marginTop: 6 }}>Valores em R$ mil · de {moeda(hist[0].caixa)} para {moeda(hist[hist.length - 1].caixa)}</p>
          </>
        )}
      </Panel>
    </div>
  );
}

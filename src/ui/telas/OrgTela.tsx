import { useState } from 'react';
import { act, setState, useGame } from '../../store';
import { Escudo, Panel } from '../common';
import { Modalidades } from './Expansao';

export function OrgTela() {
  const s = useGame()!;
  const [conf, setConf] = useState(false);
  function setCor(c: string) {
    act(st => { st.org.cor = c; for (const g of st.jogos) st.teams[st.orgTeams[g]!].cor = c; });
  }
  function setLogo(f: File) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 160;
      const x = c.getContext('2d')!; const k = Math.min(160 / img.width, 160 / img.height);
      x.drawImage(img, (160 - img.width * k) / 2, (160 - img.height * k) / 2, img.width * k, img.height * k);
      const url = c.toDataURL('image/png');
      act(st => { st.org.logo = url; });
    };
    img.src = URL.createObjectURL(f);
  }
  return (
    <div className="orgtela">
      <Modalidades />
      <Panel title="Identidade">
        <div className="org-form">
          <div className="org-preview">{s.org.logo ? <img src={s.org.logo} width={110} height={110} className="crest-img" /> : <Escudo sigla={s.org.sigla} cor={s.org.cor} size={110} />}<strong>{s.org.nome}</strong></div>
          <div className="fields">
            <label>Cor<input type="color" value={s.org.cor.startsWith('#') ? s.org.cor : '#d4af37'} onChange={e => setCor(e.target.value)} /></label>
            <label className="file">Trocar logo<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setLogo(e.target.files[0])} /></label>
            {s.org.logo && <button className="btn ghost sm" onClick={() => act(st => { st.org.logo = undefined; })}>Usar escudo gerado</button>}
          </div>
        </div>
      </Panel>
      <Panel title="Carreira">
        <p className="mut">O jogo salva sozinho neste navegador.</p>
        {!conf ? <button className="btn ghost" onClick={() => setConf(true)}>Apagar carreira e começar de novo</button> :
          <div className="row"><span>Tem certeza? Não dá para desfazer.</span><button className="btn danger" onClick={() => { localStorage.removeItem('esportsceo-v2'); setState(null); }}>Apagar</button><button className="btn ghost" onClick={() => setConf(false)}>Cancelar</button></div>}
      </Panel>
    </div>
  );
}

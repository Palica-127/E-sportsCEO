#!/usr/bin/env python3
"""Dota 2: completa os elencos com os jogadores inscritos no The International (Liquipedia).

Muitos times do Dota não têm página própria na Liquipedia, ou a página está no meio da troca de jogadores
depois do TI. Para esses, usa o elenco inscrito no TI e nas eliminatórias regionais (convites, eliminatórias
fechadas e abertas), que vem com posição (1 a 5) e país de cada jogador.
Só preenche times que ainda não têm elenco real em src/data/elencos.json; quem já está em outro time fica lá.

Uso: python tools/elencos_ti.py --contato=SEU_CONTATO [--ano=2026]
"""
import json, os, re, sys, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import buscar_fotos as bf
OPC = {a.split('=')[0]: (a.split('=', 1)[1] if '=' in a else True) for a in sys.argv[1:] if a.startswith('--')}
sys.argv = sys.argv[:1]
import buscar_elencos as be

ANO = OPC.get('--ano', '2026')
REG = ['Europe', 'China', 'Southeast Asia', 'South America', 'North America']

def participantes():
    pgs = {f'The International/{ANO}': 0}
    for r in REG:
        pgs[f'The International/{ANO}/{r}'] = 1
        for k in (1, 2): pgs[f'The International/{ANO}/{r}/Open Qualifier {k}'] = 2
    url = 'https://liquipedia.net/dota2/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'formatversion': '2', 'prop': 'revisions',
                                                                            'rvprop': 'content', 'rvslots': 'main', 'titles': '|'.join(pgs)})
    d = bf.get(url, 3.0)
    tx = {p['title']: p['revisions'][0]['slots']['main']['content'] for p in d['query']['pages'] if p.get('revisions')}
    out = {}
    for pg, nivel in pgs.items():
        t = tx.get(pg, ''); i = t.find('==Participants==')
        t = re.split(r'\{\{tabs dynamic/tab\|2\}\}', t[i:] if i >= 0 else '')[0]  # aba 2 = inscritos sem jogar
        for m in re.finditer(r'\{\{Opponent\|([^\n|}]+)\n\|players=\{\{Persons\n(.*?)\n\}\}', t, re.S):
            js = []
            for pl in re.findall(r'\{\{Person\|([^}]*)\}\}', m.group(2)):
                ps = pl.split('|'); kv = dict(x.split('=', 1) for x in ps if '=' in x); pos = [x for x in ps if '=' not in x]
                if pos and kv.get('role'): js.append({'nick': pos[0].strip(), 'role': kv['role'], 'nat': kv.get('flag')})
            nome = m.group(1).strip()
            if len(js) >= 5 and nivel < out.get(nome, (9, None))[0]: out[nome] = (nivel, sorted(js, key=lambda j: j['role'])[:5])
    return {n: js for n, (_, js) in out.items()}

def main():
    contato = OPC.get('--contato') or os.environ.get('LIQUIPEDIA_CONTATO')
    if not contato or contato is True: sys.exit('Rode com --contato=seu@email.com (ou o link do seu GitHub): a Liquipedia exige contato no User-Agent.')
    bf.UA = f'EsportsCEO-hobby-game/1.0 (fan-made esports manager; {contato})'
    TP = participantes()
    el = json.loads((be.DADOS / 'elencos.json').read_text(encoding='utf-8'))
    atuais = be.dados_atuais('dota2'); rel = []
    over = {t: [x + [2] if x and len(x) < 6 else x for x in ps] for t, ps in el.get('dota2', {}).items() if t in atuais}
    feitos = []
    for t in atuais:
        if t in over or t not in TP: continue
        over[t] = be.monta_time('dota2', atuais, t, [{'nick': j['nick'], 'nat': j['nat']} for j in TP[t]], rel, 5, prio=1); feitos.append(t)
    be.dedup('dota2', over, rel)
    el['dota2'] = over
    (be.DADOS / 'elencos.json').write_text(json.dumps(el, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(feitos)} elencos do TI {ANO}: {", ".join(feitos) or "nenhum"}')
    for l in rel: print(' ', l)

if __name__ == '__main__':
    main()

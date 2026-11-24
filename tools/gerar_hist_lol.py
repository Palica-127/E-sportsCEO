#!/usr/bin/env python3
"""Gera src/data/hist_lol.json (mesmo formato dos outros hist_*.json) a partir de src/data/lolx.json
(Mundial/MSI: campeão, vice, elencos, MVPs; ranking anual de melhores jogadores) + títulos de liga do BrasLOL."""
import json
from pathlib import Path
D = Path(__file__).resolve().parent.parent / 'src' / 'data'
X = json.loads((D / 'lolx.json').read_text(encoding='utf-8'))
LT = [
 ['T1','LCK Winter',[2014]],['T1','LCK Summer',[2013,2015,2019]],['T1','LCK Spring',[2015,2016,2017,2019,2020,2022]],
 ['Gen.G','LCK Summer',[2016,2022,2023]],['Gen.G','LCK Spring',[2023,2024]],['Gen.G','LCK Cup',[2025]],['Gen.G','LCK',[2025]],
 ['Hanwha Life','LCK Summer',[2024]],['KT Rolster','LCK Summer',[2014,2018]],
 ['Dplus KIA','LCK Summer',[2020,2021]],['Dplus KIA','LCK Spring',[2021]],
 ['DN SOOPers','LCK Spring',[2018]],['DN SOOPers','LCK Summer',[2017]],
 ['EDward Gaming','LPL Spring',[2014,2015]],['EDward Gaming','LPL Summer',[2014,2016,2017,2021]],
 ['LGD Gaming','LPL Summer',[2015]],['Team WE','LPL Spring',[2017]],['Oh My God','LPL Spring',[2013]],
 ['Invictus Gaming','LPL Spring',[2019]],['Top Esports','LPL Summer',[2020]],
 ['JD Gaming','LPL Spring',[2020,2023]],['JD Gaming','LPL Summer',[2022,2023]],
 ['BLG','LPL Spring',[2024]],['BLG','LPL Summer',[2024]],
 ['Fnatic','LEC Spring',[2013,2014,2015,2018]],['Fnatic','LEC Summer',[2013,2015,2018]],
 ['G2','LEC Spring',[2016,2017,2019,2020,2022,2024]],['G2','LEC Summer',[2016,2017,2019,2020,2023,2024,2025]],['G2','LEC Winter',[2023,2024]],
 ['Movistar KOI','LEC Spring',[2021,2023,2025]],['Movistar KOI','LEC Summer',[2021]],['Karmine Corp','LEC Winter',[2025]],
 ['Cloud9','LCS Summer',[2013,2022]],['Cloud9','LCS Spring',[2014,2020,2021,2023]],
 ['Team Liquid','LCS Spring',[2018,2019,2024]],['Team Liquid','LCS Summer',[2018,2019]],['Team Liquid','LTA Split 1',[2025]],
 ['FlyQuest','LCS Summer',[2024]],['FlyQuest','LTA Split 2',[2025]],['FlyQuest','LTA Split 3',[2025]],['FlyQuest','LTA Final',[2025]],
 ['FURIA','LTA Sul Split 2',[2025]],['Vivo Keyd Stars','LTA Sul Split 3',[2025]],
 ['CTBC Flying Oyster','LCP Kickoff',[2025]],['CTBC Flying Oyster','LCP Mid-Season',[2025]],['CTBC Flying Oyster','LCP Final',[2025]],
 ['paiN Gaming','CBLOL',[2013]],['paiN Gaming','CBLOL Split 2',[2015]],['paiN Gaming','CBLOL Split 1',[2021]],['paiN Gaming','CBLOL Split 2',[2024]],
 ['RED Canids','CBLOL Split 1',[2017,2022]],['RED Canids','CBLOL Split 2',[2021]],
 ['LOUD','CBLOL Split 2',[2022,2023]],['LOUD','CBLOL Split 1',[2023,2024]],['LOUD','CBLOL Cup',[2026]],
 ['Vivo Keyd Stars','CBLOL Split 1',[2014]],['FURIA','CBLOL Split 1',[2026]],['LOS','CBLOL Split 2',[2017]],
]
ros = {(k, y): (n, r) for _, k, y, n, r in X['ht']}  # elencos campeões conhecidos
mvp = {}
for nick, h in X['hon'].items():
    for y, txt in h.get('mv', []):
        if txt in ('MVP Mundial', 'MVP MSI'): mvp[(txt[4:], y)] = nick
tor = []
for tp, cmp, vc, nome in (('Mundial', 'wct', 'wcv', 'Worlds'), ('MSI', 'mst', 'msv', 'MSI')):
    for a, c in X[cmp].items():
        a = int(a); t = {'n': f'{nome} {a}', 'a': a, 'tp': tp, 'c': c, 'v': X[vc].get(str(a), ''), 'p': ''}
        if (tp, a) in ros: t['r'] = ros[(tp, a)][1]
        m = mvp.get(('Mundial' if tp == 'Mundial' else 'MSI', a))
        if m: t['mvp'] = [m, c, '']
        tor.append(t)
for team, k, ys in LT:
    for a in ys: tor.append({'n': f'{k} {a}', 'a': a, 'tp': 'Liga', 'c': team, 'v': '', 'p': ''})
tor.sort(key=lambda t: (t['a'], t['tp'] != 'Liga', t['n']))
bo = {y: [[n, '', 0, 0] for n, _, _ in lst] for y, lst in X['pre'].items()}
out = {'lol': {'nome': 'League of Legends', 'main': 'Mundial', 'tipos': {'Mundial': 'Worlds', 'MSI': 'MSI', 'Liga': 'Ligas'},
               'torneios': tor, 'bo': bo, 'boNome': 'Melhor Jogador do Ano'}}
(D / 'hist_lol.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(len(tor), 'torneios')

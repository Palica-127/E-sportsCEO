#!/usr/bin/env python3
"""Troca as ligas de um jogo em src/data/outros.json pelos campeonatos reais (Liquipedia, temporada 2026).

Só mexe nos jogos pedidos. Times que já existiam mantêm os jogadores; times novos ganham jogadores
provisórios (gerados, com semente fixa) até o tools/buscar_liquipedia.py trazer o elenco real.
Também grava o nome real das ligas e dos internacionais e o prêmio do campeão (R$, ver PRECO_USD)
e registra em entrada/liquipedia_alias.json a página de cada time na Liquipedia.

Uso: python tools/ligas_reais.py ff
Depois: python tools/buscar_liquipedia.py ff --todos --contato=...   e   python tools/importar_imagens.py
"""
import json, random, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
OUTROS = RAIZ / 'src' / 'data' / 'outros.json'
ALIAS = RAIZ / 'entrada' / 'liquipedia_alias.json'
# prêmio do campeão em R$ no jogo = US$ real x PRECO_USD. Calibrado pelo LoL: Mundial real paga ~US$ 1 mi
# ao campeão e o jogo paga R$ 4 mi.
PRECO_USD = 4

# Fonte: Liquipedia (tabelas de premiação, em ordem de classificação). Página só quando difere do nome.
# Times sem página na Liquipedia ficam com jogadores provisórios.
REAIS = {
 'ff': {
  'fonte': 'FFWS Brasil 2026 Split 2 (+ E1 Sports do Split 1), FFWS LATAM 2026 Split 2, FFWS SEA 2026 Fall',
  'ligas': [
   ('BR', 'FFWS Brasil', 'Brasil', 44_081,
    ['Fluxo W7M', 'LOUD', 'RUSH Gaming', 'Influence Rage', 'Team Solid', 'LOS', 'Alpha7 Esports', 'RISE Gaming'],
    ['SX TET', 'CPT VOX', 'INTZ', 'AFG E-Sports', 'Loops Esports', 'Civis', 'E1 Sports']),
   ('LA', 'FFWS LATAM', 'América Latina', 40_000,
    ['LYON', 'Blue Cheese', 'GunDynasty', 'HNS Esport', 'Bloody Brothers', 'Estorm DRK', 'Leviatán', 'Quisqueya FD'],
    ['Nova Legión', 'CACM Esports', '9z Team', 'Infinity', 'NF E-Sport', 'Docelunas', 'Chill Esports']),
   ('SE', 'FFWS SEA', 'Sudeste Asiático', 95_000,
    ['Bigetron by Vitality', 'GOW', 'P Esports', 'All Gamers Global', 'Team Flash', 'RRQ Kazu', 'ONIC Olympus', 'Buriram United Esports'],
    ['MBR Omega', 'Secret WAG', 'Team Falcons', 'Twisted Minds', 'Team Akkee', 'Team Vamos', 'Maqna Esports Club']),
  ],
  'intl': {'A': ('Esports World Cup', 300_000), 'B': ('FFWS Global Finals', 350_000)},
  'paginas': {'RUSH Gaming': 'RUSH Gaming (Mobile)'},
  'sem_pagina': ['RISE Gaming', 'SX TET', 'AFG E-Sports', 'Civis'],
 },
}

SYL = ['ka','ro','zi','le','mo','tu','vex','dra','ni','sho','bal','tor','xe','pa','ru','fu','gi','lo','ze','ky','na','do','mi','sa','vo','jin','rex','blu','cri','pho','tek','lum','zor','hex','ori','ax']
SUF = ['', '', '', 'x', 'z', 'o', 'y', '1', '7', 'ii', 'zz']
def nick(r, usados):
    while True:
        n = ''.join(r.choice(SYL) for _ in range(r.choice([2, 2, 3]))) + r.choice(SUF)
        n = n.capitalize() if r.random() < .5 else n
        if n.lower() not in usados: usados.add(n.lower()); return n

def aplica(g, dados, cfg):
    jogo = dados[g]
    antigos = {t['n']: t for L in jogo['leagues'].values() for t in L['t1'] + L['t2']}
    usados = {str(p[0]).lower() for t in antigos.values() for p in t['p']}
    r = random.Random(f'ligas-reais-{g}')
    nroles = len(jogo['roles'])
    def time(nome, base):
        if nome in antigos: return antigos[nome]
        return {'n': nome, 'p': [[nick(r, usados), max(55, min(90, round(base + r.uniform(-4, 4)))), r.randint(17, 28)] for _ in range(nroles)]}
    ligas, novos = {}, []
    for key, nome, regiao, premio, t1, t2 in cfg['ligas']:
        assert len(set(t1 + t2)) == 15 and len(t1) == 8, (g, key)
        novos += [n for n in t1 + t2 if n not in antigos]
        ligas[key] = {'nome': nome, 'regiao': regiao, 'premio': premio * PRECO_USD,
                      't1': [time(n, 80 - i * 1.2) for i, n in enumerate(t1)],
                      't2': [time(n, 70 - i * 1.0) for i, n in enumerate(t2)]}
    saem = [n for n in antigos if n not in {t['n'] for L in ligas.values() for t in L['t1'] + L['t2']}]
    jogo['leagues'] = ligas
    jogo['inicio'] = jogo['inicio'] if jogo['inicio'] in ligas else next(iter(ligas))
    for k, (nome, premio) in cfg['intl'].items():
        jogo['intl'][k]['nome'] = nome
        jogo['intl'][k]['premio'] = premio * PRECO_USD
        jogo['intl'][k]['vagas'] = {rk: v for rk, v in zip(ligas, jogo['intl'][k]['vagas'].values())}
    return novos, saem

def main():
    jogos = sys.argv[1:] or list(REAIS)
    dados = json.loads(OUTROS.read_text(encoding='utf-8'))
    alias = json.loads(ALIAS.read_text(encoding='utf-8')) if ALIAS.exists() else {}
    for g in jogos:
        cfg = REAIS[g]
        novos, saem = aplica(g, dados, cfg)
        alias.setdefault(g, {}).update(cfg.get('paginas', {}))
        print(f'[{g}] {cfg["fonte"]}')
        print(f'  entram ({len(novos)}): {", ".join(novos)}')
        print(f'  saem ({len(saem)}): {", ".join(saem)}')
    OUTROS.write_text(json.dumps(dados, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    ALIAS.write_text(json.dumps(alias, ensure_ascii=False, indent=1), encoding='utf-8')

if __name__ == '__main__':
    main()

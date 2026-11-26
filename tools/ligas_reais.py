#!/usr/bin/env python3
"""Troca as ligas de um jogo em src/data/outros.json pelos campeonatos reais (Liquipedia, temporada 2026).

Os dados ficam em tools/ligas_reais.json (fonte de cada jogo, times na ordem da classificação, prêmio do
campeão em US$, nomes dos internacionais). Só mexe nos jogos pedidos.
  - Times que já existiam mantêm os jogadores; times novos ganham jogadores provisórios (gerados, semente
    fixa) até o tools/buscar_liquipedia.py trazer o elenco real.
  - EA FC: cada time já vem com o pro real (nick, idade, país, nome), gravado também em elencos.json.
  - Prêmio do campeão no jogo = US$ real x PRECO_USD (R$).
  - Grava a página de cada time na Liquipedia em entrada/liquipedia_alias.json e, quando as regiões
    mudam, o sorteio de nacionalidade dos jogadores gerados (src/data/nomes.json).

Uso: python tools/ligas_reais.py ff wr fifa      (cs2, valorant, dota2, r6: só nomes, prêmios e logos)
Depois: python tools/buscar_liquipedia.py ff wr --todos --contato=...   e   python tools/importar_imagens.py
"""
import json, random, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'src' / 'data'
CFG = Path(__file__).resolve().parent / 'ligas_reais.json'
ALIAS = RAIZ / 'entrada' / 'liquipedia_alias.json'
# Calibrado pelo LoL: o Mundial real paga ~US$ 1 mi ao campeão e o jogo paga R$ 4 mi.
PRECO_USD = 4

SYL = ['ka','ro','zi','le','mo','tu','vex','dra','ni','sho','bal','tor','xe','pa','ru','fu','gi','lo','ze','ky','na','do','mi','sa','vo','jin','rex','blu','cri','pho','tek','lum','zor','hex','ori','ax']
SUF = ['', '', '', 'x', 'z', 'o', 'y', '1', '7', 'ii', 'zz']
def nick(r, usados):
    while True:
        n = ''.join(r.choice(SYL) for _ in range(r.choice([2, 2, 3]))) + r.choice(SUF)
        n = n.capitalize() if r.random() < .5 else n
        if n.lower() not in usados: usados.add(n.lower()); return n

def chave(s): return ''.join(c for c in str(s).lower() if c.isalnum())

def so_nomes(g, jogo, cfg):
    """jogos com times já reais: só nome, prêmio e logo dos internacionais (e das ligas, se houver)"""
    for rid, v in cfg.get('ligas_info', {}).items():
        L = jogo['leagues'][rid]
        if 'nome' in v: L['nome'] = v['nome']
        if 'premio_usd' in v: L['premio'] = v['premio_usd'] * PRECO_USD
        if 'logo' in v: L['logo'] = v['logo']
    for k, v in cfg['intl'].items():
        I = jogo['intl'][k]
        I['nome'] = v['nome']; I['premio'] = v['premio_usd'] * PRECO_USD
        if v.get('logo'): I['logo'] = v['logo']
    return [], []

def aplica(g, jogo, cfg, elencos):
    if 'ligas' not in cfg: return so_nomes(g, jogo, cfg)
    antigos = {t['n']: t for L in jogo['leagues'].values() for t in L['t1'] + L['t2']}
    nota_antiga = {chave(p[0]): p[1] for t in antigos.values() for p in t['p']}
    usados = {str(p[0]).lower() for t in antigos.values() for p in t['p']}
    r = random.Random(f'ligas-reais-{g}')
    nroles = len(jogo['roles'])
    reais = {}
    def time(item, base):
        nota = lambda nk: nota_antiga.get(chave(nk)) or max(55, min(90, round(base)))
        if isinstance(item, dict):  # EA FC: o pro real já vem junto
            p = [item['nick'], nota(item['nick']), item.get('idade'), item.get('nat')]
            reais[item['n']] = [p + [item.get('nome')]]
            return {'n': item['n'], 'p': [p]}
        if item in antigos: return antigos[item]
        return {'n': item, 'p': [[nick(r, usados), max(55, min(90, round(base + r.uniform(-4, 4)))), r.randint(17, 28)] for _ in range(nroles)]}
    ligas = {}
    for L in cfg['ligas']:
        t1, t2 = L['t1'], L['t2']
        nomes = [x['n'] if isinstance(x, dict) else x for x in t1 + t2]
        assert len(set(nomes)) == 15 and len(t1) == 8, (g, L['id'], len(set(nomes)))
        ligas[L['id']] = {'nome': L['nome'], 'regiao': L['regiao'], 'premio': L['premio_usd'] * PRECO_USD, **({'logo': L['logo']} if L.get('logo') else {}),
                          't1': [time(n, 80 - i * 1.2) for i, n in enumerate(t1)],
                          't2': [time(n, 70 - i * 1.0) for i, n in enumerate(t2)]}
    novos_nomes = {t['n'] for L in ligas.values() for t in L['t1'] + L['t2']}
    entram = [n for n in novos_nomes if n not in antigos]
    saem = [n for n in antigos if n not in novos_nomes]
    jogo['leagues'] = ligas
    if jogo['inicio'] not in ligas: jogo['inicio'] = next(iter(ligas))
    for k, v in cfg['intl'].items():
        jogo['intl'][k]['nome'] = v['nome']
        jogo['intl'][k]['premio'] = v['premio_usd'] * PRECO_USD
        if v.get('logo'): jogo['intl'][k]['logo'] = v['logo']
        jogo['intl'][k]['vagas'] = dict(zip(ligas, jogo['intl'][k]['vagas'].values()))
    if reais: elencos[g] = reais  # EA FC: o elenco inteiro vem daqui
    elif g in elencos: elencos[g] = {t: ps for t, ps in elencos[g].items() if t in novos_nomes}
    return entram, saem

def main():
    todos = json.loads(CFG.read_text(encoding='utf-8'))
    jogos = sys.argv[1:] or list(todos)
    outros = json.loads((DADOS / 'outros.json').read_text(encoding='utf-8'))
    elencos = json.loads((DADOS / 'elencos.json').read_text(encoding='utf-8'))
    nomes = json.loads((DADOS / 'nomes.json').read_text(encoding='utf-8'))
    alias = json.loads(ALIAS.read_text(encoding='utf-8')) if ALIAS.exists() else {}
    for g in jogos:
        cfg = todos[g]
        entram, saem = aplica(g, outros[g], cfg, elencos)
        if cfg.get('paginas'): alias.setdefault(g, {}).update(cfg['paginas'])
        if cfg.get('cluster'): nomes['cluster'][g] = cfg['cluster']
        print(f'[{g}] {cfg["fonte"]}')
        print(f'  entram ({len(entram)}): {", ".join(sorted(entram))}')
        print(f'  saem ({len(saem)}): {", ".join(sorted(saem))}')
    (DADOS / 'outros.json').write_text(json.dumps(outros, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (DADOS / 'elencos.json').write_text(json.dumps(elencos, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (DADOS / 'nomes.json').write_text(json.dumps(nomes, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    ALIAS.write_text(json.dumps(alias, ensure_ascii=False, indent=1), encoding='utf-8')

if __name__ == '__main__':
    main()

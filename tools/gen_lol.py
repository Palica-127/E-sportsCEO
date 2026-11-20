#!/usr/bin/env python3
"""Gera js/data/lol.js a partir do BrasLOL (index.html do repositório do usuário).
Uso: python3 tools/gen_lol.py /caminho/para/braslol/index.html js/data/lol.js
Extrai: DATA (times T1 por liga, 5 jogadores 'Nome nota idade' na ordem TOP,JNG,MID,ADC,SUP),
D2N (nomes dos times T2 por liga) e D2P (jogadores dos times T2: [nome, nota, idade])."""
import re, json, subprocess, sys, tempfile, os
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf8').read()
def grab(name):
    m = re.search(r'const ' + name + r'\s*=\s*\{', s); st = m.end() - 1; d = 0
    for p in range(st, len(s)):
        c = s[p]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
    return s[m.start():p + 1] + ';'
js = grab('DATA') + '\n' + grab('D2N') + '\n' + grab('D2P') + '\nconsole.log(JSON.stringify({DATA,D2N,D2P}));'
tmp = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False); tmp.write(js); tmp.close()
raw = json.loads(subprocess.run(['node', tmp.name], capture_output=True, text=True, check=True).stdout); os.unlink(tmp.name)
NOMES = {'CBLOL': ('CBLOL', 'Brasil'), 'LCS': ('LCS', 'América do Norte'), 'LEC': ('LEC', 'Europa'),
         'LCK': ('LCK', 'Coreia'), 'LPL': ('LPL', 'China'), 'LCP': ('LCP', 'Ásia-Pacífico')}
leagues = {}
for k, (nome, reg) in NOMES.items():
    t1 = []
    for t in raw['DATA'][k]:
        pl = []
        for p in t[1:6]:
            m = re.match(r'^(.*) (\d+) (\d+)$', p); pl.append([m.group(1), int(m.group(2)), int(m.group(3))])
        t1.append({'n': t[0], 'p': pl})
    def ok(p): return p if p and len(p) == 5 and all(p) else None   # elenco T2 incompleto vira 'sem elenco'
    t2 = [{'n': n, 'p': ok(raw['D2P'].get(n))} for n in raw['D2N'].get(k, [])]
    leagues[k] = {'nome': nome, 'regiao': reg, 't1': t1, 't2': t2}
body = json.dumps({'roles': ['TOP', 'JNG', 'MID', 'ADC', 'SUP'], 'leagues': leagues}, ensure_ascii=False, separators=(',', ':'))
open(out, 'w', encoding='utf8').write('/* Dados do LoL extraídos do BrasLOL (tools/gen_lol.py). Jogador = [nome, nota, idade]; ordem TOP,JNG,MID,ADC,SUP. */\nwindow.LOL=' + body + ';\n')
print({k: (len(v['t1']), len(v['t2'])) for k, v in leagues.items()})

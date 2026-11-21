#!/usr/bin/env python3
"""Lista os escudos da pasta logos/ em js/data/logos.js e escreve logos/FALTAM.txt (times sem escudo, por jogo).
Coloque logos/<slug>.webp|png|jpg|svg (slug = nome do time em minúsculas com hífens: 'Team Liquid' -> team-liquid.png) e rode: python3 tools/gen_logos.py"""
import os, re, json, subprocess, unicodedata
R = os.path.join(os.path.dirname(__file__), '..'); d = os.path.join(R, 'logos')
EXT = ('.webp', '.png', '.jpg', '.jpeg', '.svg')
files = sorted(f for f in os.listdir(d) if f.lower().endswith(EXT))
slugs = [os.path.splitext(f)[0] for f in files]
ext = {os.path.splitext(f)[0]: os.path.splitext(f)[1][1:] for f in files if not f.lower().endswith('.webp')}
open(os.path.join(R, 'js', 'data', 'logos.js'), 'w').write(
    '/* Gerado por tools/gen_logos.py. Escudos em logos/<slug>.<ext> (os do LoL vieram do BrasLOL; os demais o próprio usuário coloca). */\n'
    'window.LOGOS=new Set(' + json.dumps(slugs) + ');\nwindow.LOGOX=' + json.dumps(ext) + ';\n')
def sl(n):
    n = unicodedata.normalize('NFD', n.lower()); n = ''.join(c for c in n if not unicodedata.combining(c))
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', n))
js = "global.window=global;require('%s/js/data/outros.js');console.log(JSON.stringify(Object.fromEntries(Object.entries(DATA).map(([g,v])=>[g,[...new Set(Object.values(v.leagues).flatMap(L=>[...L.t1,...L.t2].map(t=>t.n)))]]))))" % R
dados = json.loads(subprocess.check_output(['node', '-e', js]))
S = set(slugs); out = []
for g, ns in dados.items():
    f = [n for n in ns if sl(n) not in S]
    out.append('== %s: %d de %d times sem escudo ==' % (g, len(f), len(ns)))
    out += ['  %s.png   (%s)' % (sl(n), n) for n in sorted(f)]
open(os.path.join(d, 'FALTAM.txt'), 'w').write('\n'.join(out) + '\n')
print(len(slugs), 'escudos;', sum(1 for l in out if l.startswith('  ')), 'times sem escudo (ver logos/FALTAM.txt)')

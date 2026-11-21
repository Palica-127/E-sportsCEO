#!/usr/bin/env python3
"""Importa logos e fotos jogados em entrada/ com qualquer nome.

Reconhece o time/jogador pelo nome do arquivo, recorta as bordas vazias, remove o fundo
dos logos (quando é uma cor lisa), redimensiona para 256 px, salva em webp e atualiza as listas
usadas pelo jogo (src/data/logos.LOGOS.json e src/data/fotos.json). No fim, regenera a lista de pendências.

Uso: python3 tools/importar_imagens.py [--dry]   (precisa do Pillow: pip install pillow)
"""
import difflib, json, re, subprocess, sys, unicodedata
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'src' / 'data'
LIXO = re.compile(r'\b(logo|logos|allmode|lightmode|darkmode|light|dark|std|square|icon|full|profile|photo|foto|player|official|oficial|esports?|gaming|team|club|clan|new|vector|transparent|png|jpe?g|webp|svg|\d{4}|\d+px|v\d+)\b')

def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def limpa(nome):
    base = re.sub(r'[_\.]+', ' ', Path(nome).stem.lower())
    return slug(LIXO.sub(' ', base)) or slug(base)

def alvos_times():
    lol = json.loads((DADOS / 'lol.json').read_text())
    out = json.loads((DADOS / 'outros.json').read_text())
    nomes = set()
    for L in lol['leagues'].values():
        for t in L['t1'] + L['t2']: nomes.add(t['n'])
    for g in out.values():
        for L in g['leagues'].values():
            for t in L['t1'] + L['t2']: nomes.add(t['n'])
    return {slug(n): n for n in nomes}

def alvos_jogadores():
    lol = json.loads((DADOS / 'lol.json').read_text())
    out = json.loads((DADOS / 'outros.json').read_text())
    nicks = {}
    for L in lol['leagues'].values():
        for t in L['t1'] + L['t2']:
            for p in (t['p'] or []): nicks[slug(str(p[0])).replace('-', '')] = str(p[0])
    for g in out.values():
        for L in g['leagues'].values():
            for t in L['t1'] + L['t2']:
                for p in (t['p'] or []): nicks[slug(str(p[0])).replace('-', '')] = str(p[0])
    return nicks

def casa(nome, alvos, junto=False):
    chave = limpa(nome)
    if junto: chave = chave.replace('-', '')
    if chave in alvos: return chave, 1.0
    # compara também com os nomes dos alvos limpos do mesmo jeito ("Team Liquid" -> "liquid")
    limpos = {}
    for k, v in alvos.items():
        c = limpa(v)
        if junto: c = c.replace('-', '')
        limpos.setdefault(c, k)
    if chave in limpos: return limpos[chave], 0.95
    # tenta também o nome sem limpar e prefixos
    m = difflib.get_close_matches(chave, list(alvos) + list(limpos), n=1, cutoff=0.72)
    if m: return limpos.get(m[0], m[0]), difflib.SequenceMatcher(None, chave, m[0]).ratio()
    for a in alvos:
        if len(a) >= 3 and (chave.startswith(a + '-') or chave.endswith('-' + a) or chave == a): return a, 0.75
    return None, 0

def tira_fundo(im):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    cantos = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    if any(c[3] < 10 for c in cantos): return im  # já é transparente
    ref = cantos[0]
    if max(max(abs(c[i] - ref[i]) for i in range(3)) for c in cantos) > 18: return im  # fundo não é liso
    # preenche a partir das bordas tudo que for parecido com a cor do fundo
    from collections import deque
    vis = bytearray(w * h); q = deque()
    for x in range(w): q.extend([(x, 0), (x, h - 1)])
    for y in range(h): q.extend([(0, y), (w - 1, y)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if vis[i]: continue
        vis[i] = 1
        c = px[x, y]
        if max(abs(c[k] - ref[k]) for k in range(3)) > 28: continue
        px[x, y] = (c[0], c[1], c[2], 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    return im

def prepara(arq, logo):
    im = Image.open(arq)
    im = tira_fundo(im) if logo else im.convert('RGBA')
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    if logo:
        lado = max(im.size)
        q = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
        q.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
        im = q
    else:  # foto: recorte quadrado priorizando o rosto (parte de cima)
        lado = min(im.size)
        x = (im.width - lado) // 2
        im = im.crop((x, 0, x + lado, lado))
    im.thumbnail((256, 256), Image.LANCZOS)
    return im

def main():
    dry = '--dry' in sys.argv
    times, jogs = alvos_times(), alvos_jogadores()
    logos = set(json.loads((DADOS / 'logos.LOGOS.json').read_text()))
    fotos = set(json.loads((DADOS / 'fotos.json').read_text()))
    duvidas = []
    for pasta, logo in [('logos', True), ('fotos', False)]:
        for arq in sorted((RAIZ / 'entrada' / pasta).glob('*')):
            if arq.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'): continue
            alvo, conf = casa(arq.name, times if logo else jogs, junto=not logo)
            if not alvo:
                duvidas.append(f'  ? {pasta}/{arq.name}: não reconheci. Renomeie para o nome do {"time" if logo else "jogador"}.')
                continue
            quem = (times if logo else jogs)[alvo]
            aviso = '' if conf >= 0.9 else f'  (confira: {int(conf * 100)}% de certeza)'
            print(f'  ✓ {pasta}/{arq.name} -> {quem}{aviso}')
            if dry: continue
            destino = RAIZ / 'public' / pasta / f'{alvo}.webp'
            prepara(arq, logo).save(destino, 'WEBP', quality=88)
            (logos if logo else fotos).add(alvo)
            arq.unlink()
    if not dry:
        (DADOS / 'logos.LOGOS.json').write_text(json.dumps(sorted(logos)))
        (DADOS / 'fotos.json').write_text(json.dumps(sorted(fotos)))
        subprocess.run(['node', str(RAIZ / 'tools' / 'pendencias.mjs')], check=False)
    if duvidas: print('\n'.join(['', 'Não reconhecidos:'] + duvidas))

if __name__ == '__main__':
    main()

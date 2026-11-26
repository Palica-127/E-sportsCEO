#!/usr/bin/env python3
"""Desenha os troféus dos jogos que não têm foto livre (public/trofeus/<jogo>-<A|B|liga>.png).

São troféus ORIGINAIS, inspirados no formato de cada competição (sem copiar o desenho oficial):
peça torneada com sombreado metálico, alças, base e uma gema com a cor do jogo.
Uso: python tools/gerar_trofeus.py      (precisa de Pillow e numpy)
"""
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
DEST = RAIZ / 'public' / 'trofeus'
K = 4                     # supersampling
W, H = 160, 220           # tamanho final

METAL = {'ouro': ((255, 214, 120), (150, 95, 25)), 'prata': ((240, 244, 250), (110, 118, 132)),
         'bronze': ((240, 170, 120), (120, 62, 30)), 'grafite': ((170, 176, 190), (40, 44, 56))}

def perfil(pts, n):
    """pontos (y 0..1, raio 0..1) -> raio por linha (interpolação suave)"""
    ys = np.linspace(0, 1, n)
    py, pr = zip(*pts)
    r = np.interp(ys, py, pr)
    k = max(1, n // 120)  # suaviza as quinas
    r = np.convolve(np.pad(r, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')
    return r

def torneado(pts, larg, alt, metal, faixas=()):
    """renderiza um sólido de revolução: imagem RGBA larg x alt"""
    hi, lo = (np.array(c, float) for c in METAL[metal])
    r = perfil(pts, alt) * larg / 2
    dr = np.gradient(r)
    img = np.zeros((alt, larg, 4))
    xs = np.arange(larg) - larg / 2 + 0.5
    for y in range(alt):
        if r[y] < 1: continue
        n = xs / r[y]
        dentro = np.abs(n) <= 1
        nx = np.clip(n, -1, 1); nz = np.sqrt(1 - nx ** 2)
        ny = -np.clip(dr[y] * 0.9, -1.5, 1.5)          # inclinação do perfil: anéis claros/escuros
        nn = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
        L = np.array([-0.45, -0.55, 0.7]); L /= np.linalg.norm(L)
        dif = np.clip((nx * L[0] + ny * L[1] + nz * L[2]) / nn, 0, 1)
        env = 0.5 + 0.5 * np.sin(nx * 5.2 + 0.8)       # reflexo do ambiente (faixas)
        spec = np.exp(-((nx + 0.42) / 0.11) ** 2) * 0.9 + np.exp(-((nx - 0.62) / 0.07) ** 2) * 0.35
        t = np.clip(0.18 + 0.55 * dif + 0.3 * env * nz, 0, 1)[:, None]
        cor = lo * (1 - t) + hi * t + spec[:, None] * 255 * 0.55
        borda = np.clip((1 - np.abs(n)) * r[y] / 1.2, 0, 1)
        img[y, :, :3] = np.clip(cor, 0, 255)
        img[y, :, 3] = np.where(dentro, borda * 255, 0)
    for (y0, y1, cor) in faixas:  # anéis coloridos (esmalte)
        a, b = int(y0 * alt), int(y1 * alt)
        sombra = img[a:b, :, :3].mean(axis=2, keepdims=True) / 255
        img[a:b, :, :3] = np.clip(np.array(cor, float) * (0.35 + 0.9 * sombra), 0, 255)
    return Image.fromarray(img.astype('uint8'), 'RGBA')

def alca(d, cx, cy, rx, ry, lado, cor, esp):
    box = (cx - rx, cy - ry, cx + rx, cy + ry)
    ini, fim = (100, 260) if lado < 0 else (-80, 80)
    d.arc(box, ini, fim, fill=cor, width=esp)

def gema(base, cx, cy, raio, cor, forma='losango'):
    cor = np.array(cor, float)
    g = Image.new('RGBA', base.size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    if forma == 'losango': pts = [(cx, cy - raio * 1.3), (cx + raio, cy), (cx, cy + raio * 1.3), (cx - raio, cy)]
    elif forma == 'estrela':
        pts = [(cx + math.cos(math.pi / 2 + i * math.pi / 5) * (raio * 1.3 if i % 2 == 0 else raio * 0.55),
                cy - math.sin(math.pi / 2 + i * math.pi / 5) * (raio * 1.3 if i % 2 == 0 else raio * 0.55)) for i in range(10)]
    elif forma == 'hex': pts = [(cx + math.cos(i * math.pi / 3) * raio, cy + math.sin(i * math.pi / 3) * raio) for i in range(6)]
    else: pts = [(cx + math.cos(i * math.pi / 16) * raio, cy + math.sin(i * math.pi / 16) * raio) for i in range(32)]
    d.polygon(pts, fill=tuple(int(c) for c in cor * 0.55) + (255,), outline=(255, 240, 200, 255), width=max(2, int(raio * 0.12)))
    inner = [(cx + (x - cx) * 0.62, cy + (y - cy) * 0.62 - raio * 0.08) for x, y in pts]
    d.polygon(inner, fill=tuple(int(min(255, c * 1.1 + 20)) for c in cor) + (255,))
    d.ellipse((cx - raio * 0.42, cy - raio * 0.7, cx - raio * 0.05, cy - raio * 0.3), fill=(255, 255, 255, 190))
    base.alpha_composite(g)

# formatos (perfil: y de cima para baixo, raio relativo à largura do troféu)
TACA = [(0, .78), (.04, .82), (.08, .74), (.30, .56), (.42, .30), (.48, .13), (.62, .10), (.66, .2), (.70, .12), (.76, .14), (.80, .36), (.86, .40)]
CALICE = [(0, .60), (.03, .66), (.20, .58), (.34, .40), (.42, .16), (.47, .10), (.60, .09), (.64, .18), (.68, .10), (.74, .12), (.80, .40), (.86, .44)]
FLAUTA = [(0, .30), (.04, .38), (.22, .34), (.36, .24), (.44, .12), (.52, .08), (.64, .08), (.68, .16), (.72, .09), (.78, .12), (.82, .34), (.86, .38)]
TIGELA = [(0, .92), (.03, .96), (.10, .90), (.24, .62), (.32, .28), (.38, .14), (.58, .11), (.62, .22), (.66, .12), (.74, .14), (.80, .42), (.86, .46)]
GLOBO = [(0, .02), (.04, .42), (.10, .62), (.18, .66), (.26, .58), (.33, .34), (.39, .14), (.42, .10), (.58, .09), (.62, .2), (.66, .1), (.74, .14), (.80, .40), (.86, .44)]

def trofeu(nome, forma, metal, cor, gema_forma='losango', alcas=True, topo=None, faixa=None):
    w, h = W * K, H * K
    corpo = torneado(forma, int(w * 0.72), int(h * 0.86), metal,
                     faixas=[(faixa[0], faixa[1], cor)] if faixa else ())
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ox, oy = (w - corpo.width) // 2, int(h * 0.10)
    if alcas:
        a = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(a)
        hi, lo = METAL[metal]
        topo_y = oy + int(corpo.height * forma[1][0]) + int(corpo.height * 0.05)
        cx = w // 2; larg = corpo.width * forma[0][1] / 2
        for lado in (-1, 1):
            for k, c in ((0, lo), (6 * K // 4, hi)):
                alca(d, cx + lado * int(larg * 0.80), topo_y + int(corpo.height * 0.11), int(larg * 0.42), int(corpo.height * 0.12), lado, c + (255,), 7 * K - k)
        img.alpha_composite(a)
    img.alpha_composite(corpo, (ox, oy))
    # plinto
    d = ImageDraw.Draw(img)
    py = oy + int(corpo.height * 0.86) - 2
    pw = int(w * 0.46)
    for i, c in enumerate([(30, 30, 38), (52, 52, 64)]):
        d.rounded_rectangle((w // 2 - pw // 2 + i * 6, py + i * 4, w // 2 + pw // 2 - i * 6, h - 6 * K), radius=4 * K, fill=c + (255,))
    d.rectangle((w // 2 - pw // 2 + 10, py + int((h - py) * 0.42), w // 2 + pw // 2 - 10, py + int((h - py) * 0.56)), fill=tuple(cor) + (255,))
    # gema no corpo
    gy = oy + int(corpo.height * (0.17 if forma is not GLOBO else 0.17))
    gema(img, w // 2, gy, int(w * 0.075), cor, gema_forma)
    if topo:  # enfeite no topo (estrela/losango)
        gema(img, w // 2, oy - int(h * 0.02), int(w * 0.06), cor, topo)
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=60))
    img = img.resize((W, H), Image.LANCZOS)
    img = img.crop(img.getbbox())
    img.save(DEST / f'{nome}.png')
    return img

# cores dos jogos
C = {'cs2': (230, 160, 40), 'dota2': (200, 40, 40), 'valorant': (255, 70, 85), 'ff': (255, 150, 20),
     'r6': (60, 140, 230), 'fifa': (40, 200, 120), 'wr': (70, 170, 255)}
FEITOS = {
    # jogo-tipo: (formato, metal, gema, alças, enfeite do topo, faixa de esmalte)
    'cs2-A': (CALICE, 'prata', 'hex', True, None, (.06, .10)),
    'cs2-B': (FLAUTA, 'prata', 'estrela', False, 'losango', (.30, .34)),
    'cs2-liga': (TACA, 'bronze', 'hex', True, None, None),
    'dota2-A': (CALICE, 'bronze', 'circulo', True, None, (.06, .10)),
    'dota2-liga': (TACA, 'grafite', 'circulo', True, None, None),
    'valorant-A': (CALICE, 'ouro', 'losango', False, 'losango', (.06, .10)),
    'valorant-B': (FLAUTA, 'ouro', 'losango', False, 'estrela', (.30, .34)),
    'valorant-liga': (TACA, 'prata', 'losango', True, None, None),
    'ff-B': (GLOBO, 'ouro', 'estrela', False, None, (.30, .34)),
    'ff-liga': (TACA, 'ouro', 'estrela', True, None, (.06, .10)),
    'r6-A': (TIGELA, 'prata', 'hex', True, None, (.06, .10)),
    'r6-B': (CALICE, 'ouro', 'hex', True, 'losango', (.06, .10)),
    'r6-liga': (TACA, 'prata', 'hex', True, None, None),
    'fifa-A': (TIGELA, 'prata', 'circulo', True, None, (.06, .10)),
    'fifa-B': (GLOBO, 'ouro', 'circulo', False, None, (.30, .34)),
    'fifa-liga': (TACA, 'prata', 'circulo', True, None, None),
    'wr-A': (CALICE, 'prata', 'losango', True, None, (.06, .10)),
    'wr-B': (TIGELA, 'prata', 'losango', True, 'losango', (.06, .10)),
    'wr-liga': (TACA, 'bronze', 'losango', True, None, None),
}

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for nome, (forma, metal, gf, alcas, topo, faixa) in FEITOS.items():
        trofeu(nome, forma, metal, C[nome.split('-')[0]], gf, alcas, topo, faixa)
        print('  ✓', nome)

if __name__ == '__main__':
    main()

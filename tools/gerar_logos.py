#!/usr/bin/env python3
"""Desenha logos ORIGINAIS (escudo/hexágono/círculo com as iniciais) para times reais que não têm logo
público em lugar nenhum. Grava em entrada/logos/<slug>.png; depois rode tools/importar_imagens.py.
Uso: python tools/gerar_logos.py "Find Dog" "SANE4KA" ...     (precisa de Pillow)
"""
import colorsys, hashlib, math, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, str(Path(__file__).resolve().parent))
import buscar_fotos as bf

RAIZ = Path(__file__).resolve().parent.parent
S, K = 256, 4
FONTES = ['C:/Windows/Fonts/bahnschrift.ttf', 'C:/Windows/Fonts/impact.ttf', 'C:/Windows/Fonts/arialbd.ttf', 'DejaVuSans-Bold.ttf']

def fonte(tam):
    for f in FONTES:
        try:
            ft = ImageFont.truetype(f, tam)
            if 'bahnschrift' in f:
                try: ft.set_variation_by_name('Bold')
                except Exception: pass
            return ft
        except OSError: continue
    return ImageFont.load_default()

def sigla(nome):
    palavras = [p for p in re.split(r'[\s&_\-]+', nome) if p]
    if len(palavras) == 1:
        p = palavras[0]
        if len(p) <= 4: return p
        m = re.match(r'([A-Za-z]+)(\d+)$', p)          # Real1 -> R1
        return m.group(1)[0] + m.group(2) if m else p[:3]
    return ''.join(p if p.isdigit() else p[0] for p in palavras[:3])  # 74 CLUB -> 74C

def forma(tipo, c, r):
    if tipo == 'escudo':
        return [(c - r, c - r * .85), (c + r, c - r * .85), (c + r, c + r * .05), (c, c + r), (c - r, c + r * .05)]
    n = {'hex': 6, 'losango': 4, 'oct': 8}.get(tipo)
    if n: return [(c + r * math.cos(math.pi / 2 + i * 2 * math.pi / n), c - r * math.sin(math.pi / 2 + i * 2 * math.pi / n)) for i in range(n)]
    return None

def logo(nome, i=None):
    h = hashlib.md5(nome.encode()).digest()
    i = h[0] if i is None else i
    hue = (i * 0.618034 + h[2] / 2550) % 1        # cores bem espalhadas entre os times da mesma leva
    cor = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(hue, .75, .95))
    escura = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(hue, .8, .35))
    tipo = ['escudo', 'hex', 'circulo', 'escudo', 'oct', 'losango'][i % 6]
    W = S * K; c = W / 2; r = W * .46
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    # gradiente vertical recortado pela forma
    grad = Image.new('RGBA', (W, W))
    gd = ImageDraw.Draw(grad)
    for y in range(W):
        t = y / W
        gd.line([(0, y), (W, y)], fill=tuple(int(cor[i] * (1 - t) + escura[i] * t) for i in range(3)) + (255,))
    mask = Image.new('L', (W, W), 0); md = ImageDraw.Draw(mask)
    pts = forma(tipo, c, r)
    borda = int(W * .035)
    if pts:
        md.polygon(pts, fill=255)
        ImageDraw.Draw(img).polygon(pts, fill=(240, 240, 245, 255))
        mask2 = Image.new('L', (W, W), 0); ImageDraw.Draw(mask2).polygon(forma(tipo, c, r - borda * 1.6), fill=255)
    else:
        md.ellipse((c - r, c - r, c + r, c + r), fill=255)
        ImageDraw.Draw(img).ellipse((c - r, c - r, c + r, c + r), fill=(240, 240, 245, 255))
        rr = r - borda * 1.6
        mask2 = Image.new('L', (W, W), 0); ImageDraw.Draw(mask2).ellipse((c - rr, c - rr, c + rr, c + rr), fill=255)
    img.paste(grad, (0, 0), mask2)
    # faixa diagonal de brilho
    brilho = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(brilho).polygon([(0, W * .55), (W, W * .15), (W, W * .32), (0, W * .72)], fill=(255, 255, 255, 38))
    sem = Image.new('RGBA', (W, W), (0, 0, 0, 0)); sem.paste(brilho, (0, 0), mask2)
    img.alpha_composite(sem)
    # iniciais
    txt = sigla(nome).upper()
    d = ImageDraw.Draw(img)
    tam = int(W * (.42 if len(txt) <= 2 else .32 if len(txt) == 3 else .25))
    ft = fonte(tam)
    bb = d.textbbox((0, 0), txt, font=ft)
    x = c - (bb[0] + bb[2]) / 2; y = c - (bb[1] + bb[3]) / 2 - (W * .03 if tipo == 'escudo' else 0)
    sombra = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).text((x + W * .012, y + W * .015), txt, font=ft, fill=(0, 0, 0, 140))
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(W * .006)))
    d.text((x, y), txt, font=ft, fill=(255, 255, 255, 255), stroke_width=int(W * .008), stroke_fill=escura + (255,))
    img = img.resize((S, S), Image.LANCZOS)
    dest = RAIZ / 'entrada' / 'logos' / f'{bf.slug(nome)}.png'
    img.save(dest)
    return dest

if __name__ == '__main__':
    for i, n in enumerate(sys.argv[1:]):
        print('  ✓', n, '->', logo(n, i).name)

#!/usr/bin/env python3
"""Lista as imagens da pasta fotos/ em js/data/fotos.js. Coloque fotos/<nick>.jpg (minúsculas, sem espaços/símbolos: ZywOo -> zywoo.jpg) e rode: python3 tools/gen_fotos.py"""
import os, json
d = os.path.join(os.path.dirname(__file__), '..', 'fotos')
fs = sorted(f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
open(os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'fotos.js'), 'w').write('window.FOTOS = ' + json.dumps(fs) + '; // gerado por tools/gen_fotos.py\n')
print(len(fs), 'fotos')

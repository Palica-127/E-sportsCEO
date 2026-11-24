#!/usr/bin/env python3
"""Baixa as fotos dos jogadores REAIS do jogo e salva em public/fotos/<chave>.webp.

Só busca foto de quem é jogador de verdade: todo o LoL (lol.json) e, nos outros jogos, os elencos
REAL / FC_PROS de tools/gen_outros.py. Os demais nicks são gerados (fictícios) e continuam com o avatar,
para não colar o rosto de uma pessoa real num personagem inventado.

Fontes (tentadas em ordem; a seguinte só cobre quem a anterior não achou):
  - LoL: Leaguepedia (lol.fandom.com), API Cargo (Players + PlayerImages).
  - CS2, Valorant, R6, Dota 2: prosettings.net (página do jogador; confere o jogo pelo título),
    depois Wikidata/Wikimedia Commons, depois Liquipedia.
  - Free Fire, EA FC: Wikidata/Wikimedia Commons, depois Liquipedia.
  - HLTV não é usada: não tem API pública e bloqueia acesso automatizado.
  A Liquipedia pede no máximo 1 requisição a cada 2 s; se ela devolver a página de bloqueio, o script pula.

Uso:
  python tools/buscar_fotos.py                 # todos os jogos
  python tools/buscar_fotos.py lol cs2         # só alguns
  python tools/buscar_fotos.py --refazer       # ignora o cache e baixa de novo quem já tem foto

Precisa do Pillow (pip install pillow) e do curl. Atualiza src/data/fotos.json e public/fotos/CREDITOS.txt.
"""
import ast, html, io, json, re, shutil, subprocess, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'src' / 'data'
DEST = RAIZ / 'public' / 'fotos'
UA = 'EsportsCEO-hobby-game/1.0 (fan-made esports manager; player portrait importer)'

LIQUI = {'cs2': 'counterstrike', 'dota2': 'dota2', 'valorant': 'valorant', 'ff': 'freefire',
         'r6': 'rainbowsix', 'fifa': 'easportsfc', 'wr': 'wildrift'}
PROSET = {'cs2': 'CS2', 'valorant': 'VALORANT', 'r6': 'Rainbow Six', 'dota2': 'Dota'}
WD_JOGO = {'cs2': r'counter.?strike|cs:?go|cs2', 'valorant': r'valorant', 'r6': r'rainbow six|siege', 'dota2': r'dota',
           'ff': r'free ?fire', 'fifa': r'fifa|ea sports fc|fc pro|football', 'wr': r'wild rift', 'lol': r'league of legends'}
FONTES = {'lol': ['leaguepedia'], 'cs2': ['prosettings', 'wikidata', 'liquipedia'], 'valorant': ['prosettings', 'wikidata', 'liquipedia'],
          'r6': ['prosettings', 'wikidata', 'liquipedia'], 'dota2': ['prosettings', 'wikidata', 'liquipedia'],
          'ff': ['wikidata', 'liquipedia'], 'fifa': ['wikidata', 'liquipedia'], 'wr': ['wikidata', 'liquipedia']}

class Bloqueado(Exception): pass

def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def chave(nick): return slug(str(nick)).replace('-', '')

_ult = {}
def _espera(host, t):
    w = _ult.get(host, 0) + t - time.time()
    if w > 0: time.sleep(w)

def get(url, host_wait=0.0, binario=False, referer=None, texto=False):
    host = urllib.parse.urlparse(url).netloc
    _espera(host, host_wait)
    cab = {'User-Agent': UA, 'Accept-Encoding': 'gzip'}
    if referer: cab['Referer'] = referer
    req = urllib.request.Request(url, headers=cab)
    for tent in range(6):
        try:
            try:
                with urllib.request.urlopen(req, timeout=40) as r:
                    dados = r.read()
                    if r.headers.get('Content-Encoding') == 'gzip':
                        import gzip; dados = gzip.decompress(dados)
            except urllib.error.HTTPError as e:
                if e.code == 404: return None
                if e.code == 429 and 'liquipedia' in host: raise Bloqueado(host)
                raise
            _ult[host] = time.time()
            if binario: return dados
            txt = dados.decode('utf-8', 'replace')
            if texto: return txt
            if 'Rate Limited' in txt[:400] or 'Your IP address has been temporarily blocked' in txt:
                raise Bloqueado(host)
            if txt.lstrip().startswith('<'): raise RuntimeError('resposta HTML inesperada')
            d = json.loads(txt)
            if isinstance(d, dict) and 'error' in d:
                raise RuntimeError(f"API: {d['error'].get('code')} {d['error'].get('info', '')[:80]}")
            return d
        except Bloqueado:
            raise
        except Exception as e:
            _ult[host] = time.time()
            if tent == 5: raise
            pausa = 45 * (tent + 1) if 'rate' in str(e).lower() else 10 * (tent + 1)
            print(f'    ! {e} — tentando de novo em {pausa} s', flush=True); time.sleep(pausa)

def baixa_imagem(url, espera, referer):
    """Imagens via curl: a CDN da Fandom recusa o urllib do Python mesmo com os mesmos cabeçalhos."""
    if not shutil.which('curl'): return get(url, espera, binario=True, referer=referer)
    host = urllib.parse.urlparse(url).netloc
    _espera(host, espera)
    cmd = ['curl', '-sfL', '--max-time', '40', '-A', UA] + (['-e', referer] if referer else []) + [url]
    for tent in range(3):
        r = subprocess.run(cmd, capture_output=True)
        _ult[host] = time.time()
        if r.returncode == 0 and r.stdout: return r.stdout
        time.sleep(5 * (tent + 1))
    raise RuntimeError(f'curl falhou (código {r.returncode})')

# ---------- quem é real ----------
def _literal(src, nome):
    m = re.search(r'^' + nome + r'\s*=\s*', src, re.M)
    if not m: return None
    i, d = m.end(), 0
    for j in range(i, len(src)):
        c = src[j]
        if c in '[{(': d += 1
        elif c in ']})':
            d -= 1
            if d == 0: return ast.literal_eval(src[i:j + 1])

def nicks_reais():
    src = (RAIZ / 'tools' / 'gen_outros.py').read_text(encoding='utf-8')
    real = _literal(src, 'REAL') or {}
    res = {g: {n for v in d.values() for n in v} for g, d in real.items()}
    res['fifa'] = set(_literal(src, 'FC_PROS') or [])
    return res

def jogadores():
    """{game: [(nick, time)]} — só jogadores reais."""
    lol = json.loads((DADOS / 'lol.json').read_text(encoding='utf-8'))
    out = json.loads((DADOS / 'outros.json').read_text(encoding='utf-8'))
    reais = nicks_reais()
    res = {'lol': []}
    for L in lol['leagues'].values():
        for t in L['t1'] + L['t2']: res['lol'] += [(str(p[0]), t['n']) for p in (t['p'] or [])]
    for g, v in out.items():
        res[g] = []
        for L in v['leagues'].values():
            for t in L['t1'] + L['t2']: res[g] += [(str(p[0]), t['n']) for p in (t['p'] or []) if str(p[0]) in reais.get(g, ())]
    return res

def prepara(dados):
    im = Image.open(io.BytesIO(dados)).convert('RGBA')
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    lado = min(im.size)  # quadrado priorizando o rosto (parte de cima)
    x = (im.width - lado) // 2
    im = im.crop((x, 0, x + lado, lado))
    im.thumbnail((256, 256), Image.LANCZOS)
    return im

def lotes(xs, n):
    for i in range(0, len(xs), n): yield xs[i:i + n]

def q(s): return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"

# ---------- Leaguepedia ----------
LP = 'https://lol.fandom.com/api.php?'
def cargo(**kw):
    kw.update(action='cargoquery', format='json', limit='500')
    return [r['title'] for r in get(LP + urllib.parse.urlencode(kw), 8.0).get('cargoquery', [])]

def peso_arquivo(nome):
    anos = [int(a) for a in re.findall(r'(20\d\d)', nome)]
    split = re.search(r'Split (\d)', nome)
    return (max(anos) if anos else 0, int(split.group(1)) if split else (4 if re.search(r'Worlds|WC|MSI', nome) else 0))

def urls_leaguepedia(g, lista):
    achados = {}
    nicks = sorted({n for n, _ in lista})
    time_de = {}
    for n, t in lista: time_de.setdefault(n.lower(), set()).add(slug(t))
    pagina = {}
    for lote in lotes(nicks, 40):
        for r in cargo(tables='Players', fields='ID,OverviewPage,Team,IsRetired', where=f"ID IN ({','.join(q(n) for n in lote)})"):
            nl = (r.get('ID') or '').lower()
            if nl not in time_de: continue
            mesmo_time = any(tt in slug(r.get('Team') or '') or slug(r.get('Team') or '') in tt for tt in time_de[nl] if tt)
            nota = (2 if mesmo_time else 0) + (0 if r.get('IsRetired') == '1' else 1)
            if nl not in pagina or nota > pagina[nl][1]: pagina[nl] = (r['OverviewPage'], nota)
    paginas = {v[0]: k for k, v in pagina.items()}
    arquivo = {}
    for lote in lotes(sorted(paginas), 40):
        for r in cargo(tables='PlayerImages', fields='FileName,Link', where=f"Link IN ({','.join(q(p) for p in lote)})"):
            f = r.get('FileName') or ''
            if not f or r['Link'] not in paginas: continue
            if r['Link'] not in arquivo or peso_arquivo(f) > peso_arquivo(arquivo[r['Link']]): arquivo[r['Link']] = f
    por_arquivo = {f: pg for pg, f in arquivo.items()}
    for lote in lotes(sorted(por_arquivo), 50):
        d = get(LP + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url',
                                             'titles': '|'.join('File:' + f for f in lote)}), 1.0)
        norm = {x['to']: x['from'] for x in d.get('query', {}).get('normalized', [])}
        for pg in d.get('query', {}).get('pages', {}).values():
            ii = pg.get('imageinfo')
            if not ii: continue
            f = norm.get(pg['title'], pg['title'])[5:].replace('_', ' ')
            p = por_arquivo.get(f) or por_arquivo.get(pg['title'][5:])
            if p: achados[chave(paginas[p])] = (ii[0]['url'], 'https://lol.fandom.com/wiki/' + urllib.parse.quote(p.replace(' ', '_')))
    return achados

# ---------- prosettings.net ----------
def urls_prosettings(g, lista):
    achados = {}
    nome_jogo = PROSET[g]
    for n in sorted({n for n, _ in lista}):
        pag = f'https://prosettings.net/players/{slug(n)}/'
        h = get(pag, 1.5, texto=True)
        if not h: continue
        tit = html.unescape((re.search(r'<title>([^<]*)', h) or [None, ''])[1])
        # confere nick e jogo no título ("ZywOo CS2 Settings, Crosshair & Config")
        if nome_jogo.lower() not in tit.lower() or chave(tit.split(' ' + nome_jogo.split()[0])[0]) != chave(n): continue
        m = re.search(r'<img[^>]*width="220" height="220"[^>]*>', h)
        if not m: continue
        cand = re.findall(r'(https://prosettings\.net/wp-content/uploads/\S+?\.(?:png|webp|jpe?g))\s+(\d+)w', m.group(0))
        if not cand: continue
        url = max(cand, key=lambda c: int(c[1]))[0]
        achados[chave(n)] = (url, pag)
        print(f'    · {n}', flush=True)
    return achados

# ---------- Wikidata / Commons ----------
def urls_wikidata(g, lista):
    nicks = sorted({n for n, _ in lista})
    achados = {}
    for lote in lotes(nicks, 120):
        vals = ' '.join(json.dumps(n) + '@en' for n in lote)
        consulta = f'''SELECT ?l ?item ?img ?desc WHERE {{ VALUES ?l {{ {vals} }}
          ?item rdfs:label|skos:altLabel|wdt:P742 ?l ; wdt:P31 wd:Q5 ; wdt:P106 wd:Q4379701 ; wdt:P18 ?img ;
                schema:description ?desc . FILTER(LANG(?desc) = "en") }}'''
        d = get('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': consulta, 'format': 'json'}), 2.0)
        por_nick = {}
        for b in d['results']['bindings']:
            if not re.search(WD_JOGO[g], b['desc']['value'], re.I): continue  # outro jogo (ex.: "Trap" do StarCraft)
            por_nick.setdefault(b['l']['value'], {})[b['item']['value']] = b['img']['value']
        for n, itens in por_nick.items():
            if len(itens) != 1: continue  # ambíguo: dois jogadores com o mesmo nick
            item, img = next(iter(itens.items()))
            arq = urllib.parse.unquote(img.rsplit('/', 1)[1])
            url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(arq) + '?width=500'
            achados[chave(n)] = (url, 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(arq.replace(' ', '_')))
    return achados

# ---------- Liquipedia ----------
def urls_liquipedia(g, lista):
    wiki = LIQUI[g]
    api = f'https://liquipedia.net/{wiki}/api.php?'
    achados = {}
    nicks = sorted({n for n, _ in lista})
    for lote in lotes(nicks, 50):
        d = get(api + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'redirects': '1', 'prop': 'pageimages',
                                              'piprop': 'original', 'titles': '|'.join(lote)}), 2.1)
        qy = d.get('query', {})
        volta = {}
        for x in qy.get('normalized', []) + qy.get('redirects', []): volta[x['to']] = volta.get(x['from'], x['from'])
        for pg in qy.get('pages', {}).values():
            orig = pg.get('original', {}).get('source')
            if not orig or 'missing' in pg: continue
            nick = volta.get(pg['title'], pg['title'])
            achados[chave(nick)] = (orig, f'https://liquipedia.net/{wiki}/' + urllib.parse.quote(pg['title'].replace(' ', '_')))
    return achados

BUSCA = {'leaguepedia': urls_leaguepedia, 'prosettings': urls_prosettings, 'wikidata': urls_wikidata, 'liquipedia': urls_liquipedia}
ESPERA = {'leaguepedia': 1.0, 'prosettings': 1.5, 'wikidata': 1.0, 'liquipedia': 2.1}

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    refazer = '--refazer' in sys.argv
    DEST.mkdir(parents=True, exist_ok=True)
    fotos = set(json.loads((DADOS / 'fotos.json').read_text(encoding='utf-8')))
    cred_arq = DEST / 'CREDITOS.txt'
    creditos = {}
    if cred_arq.exists():
        for l in cred_arq.read_text(encoding='utf-8').splitlines():
            if '\t' in l: k, v = l.split('\t', 1); creditos[k] = v
    todos = jogadores()
    feitos = set() if refazer else set(fotos)
    for g in (args or list(todos)):
        if not todos.get(g):
            print(f'[{g}] nenhum jogador real (só nicks fictícios) — nada a buscar'); continue
        for fonte in FONTES[g]:
            lista = [(n, t) for n, t in todos[g] if chave(n) not in feitos]
            if not lista: break
            print(f'[{g}] {fonte}: {len(lista)} jogadores sem foto', flush=True)
            cache = RAIZ / 'entrada' / f'.cache_fotos_{g}_{fonte}.json'
            if fonte == 'leaguepedia' and not cache.exists() and (RAIZ / 'entrada' / f'.cache_fotos_{g}.json').exists():
                cache = RAIZ / 'entrada' / f'.cache_fotos_{g}.json'  # cache da versão anterior
            if cache.exists() and not refazer:
                achados = {k: tuple(v) for k, v in json.loads(cache.read_text(encoding='utf-8')).items()}
            else:
                try:
                    achados = BUSCA[fonte](g, lista)
                except Bloqueado as e:
                    print(f'  x {e} bloqueou o acesso (rate limit) — pulando esta fonte'); continue
                except Exception as e:
                    print(f'  x não consegui consultar {fonte}: {e}'); continue
                cache.parent.mkdir(parents=True, exist_ok=True)
                cache.write_text(json.dumps(achados), encoding='utf-8')
            achados = {k: v for k, v in achados.items() if k not in feitos and k in {chave(n) for n, _ in lista}}
            print(f'  {len(achados)} fotos encontradas', flush=True)
            for k, (url, origem) in sorted(achados.items()):
                try:
                    prepara(baixa_imagem(url, ESPERA[fonte], origem)).save(DEST / f'{k}.webp', 'WEBP', quality=86)
                except Exception as e:
                    print(f'  ! {k}: {e}'); continue
                fotos.add(k); feitos.add(k); creditos[k] = origem
                print(f'  ✓ {k}', flush=True)
                (DADOS / 'fotos.json').write_text(json.dumps(sorted(fotos)), encoding='utf-8')
        faltam = sorted({n for n, _ in todos[g] if chave(n) not in fotos})
        if faltam: print(f'[{g}] sem foto ({len(faltam)}): ' + ', '.join(faltam[:60]) + (' ...' if len(faltam) > 60 else ''))
        cred_arq.write_text('Fotos de jogadores — origem de cada uma (Leaguepedia/Liquipedia: CC BY-SA; Wikimedia Commons: ver a página do arquivo; prosettings.net)\n' +
                            '\n'.join(f'{k}\t{v}' for k, v in sorted(creditos.items())) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()

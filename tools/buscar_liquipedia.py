#!/usr/bin/env python3
"""Elencos reais e logos pela API oficial da Liquipedia (Free Fire, EA FC, Wild Rift e o que faltou de outros jogos).

Respeita os termos de uso da API da Liquipedia (https://liquipedia.net/api-terms-of-use):
  - User-Agent identificado com um contato (obrigatório: --contato=... ou variável LIQUIPEDIA_CONTATO)
  - só action=query (nada de action=parse), no máximo 1 pedido a cada 3 s, gzip, até 50 páginas por pedido
  - tudo fica em cache (entrada/.cache_liqui_*.json): rodar de novo não repete pedidos (--refazer força)
Se a Liquipedia responder "Rate Limited", o script para na hora, sem insistir.

O que faz:
  1. acha a página de cada time do jogo na Liquipedia (nome igual, redirecionamento, variações ou
     entrada/liquipedia_alias.json)
  2. lê o elenco ativo da página (SquadPlayer sem data de saída, sem técnico/analista/reserva)
  3. lê a página de cada jogador: nome real, nacionalidade, data de nascimento
  4. grava em src/data/elencos.json (o mesmo formato do buscar_elencos.py)
  5. baixa o logo dos times que ainda não têm para entrada/logos/ (depois: python tools/importar_imagens.py)

Uso:
  python tools/buscar_liquipedia.py --contato=seu@email.com                 (ff fifa wr)
  python tools/buscar_liquipedia.py ff --times=LOUD,Fluxo --mostrar --contato=...   (teste: só mostra, não grava)
  python tools/buscar_liquipedia.py cs2 dota2 --contato=...   (só os times que ainda não têm elenco real)
  Opções: --sem-logos  --so-logos  --todos (refaz também times que já têm elenco real)  --refazer
Relatório em entrada/liquipedia_relatorio.txt.
"""
import json, os, re, sys, time, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import buscar_fotos as bf
import buscar_elencos as be

RAIZ = bf.RAIZ
DADOS = RAIZ / 'src' / 'data'
CACHE = RAIZ / 'entrada'
ESPERA = 3.0  # segundos entre pedidos (a Liquipedia pede no mínimo 2)
ROLES_N = {'ff': 4, 'fifa': 1, 'wr': 5, 'cs2': 5, 'dota2': 5, 'valorant': 5, 'r6': 5}
WIKI = dict(bf.LIQUI)

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
OPC = {a.split('=')[0]: (a.split('=', 1)[1] if '=' in a else True) for a in sys.argv[1:] if a.startswith('--')}
REFAZER = '--refazer' in OPC
MOSTRAR = '--mostrar' in OPC

# ---------------------------------------------------------------- acesso à API
def api(g, **params):
    url = f'https://liquipedia.net/{WIKI[g]}/api.php?' + urllib.parse.urlencode({'format': 'json', 'formatversion': '2', **params})
    return bf.get(url, ESPERA)

def paginas(g, titulos, nome_cache):
    """{título pedido: {'titulo': final, 'texto': wikitexto}} para os que existem; redirecionamentos seguidos."""
    arq = CACHE / f'.cache_liqui_{g}_{nome_cache}.json'
    cache = json.loads(arq.read_text(encoding='utf-8')) if arq.exists() and not REFAZER else {}
    faltam = sorted({t for t in titulos if t and t not in cache})
    for lote in bf.lotes(faltam, 50):
        d = api(g, action='query', prop='revisions', rvprop='content', rvslots='main', redirects='1', titles='|'.join(lote))
        qy = d.get('query', {})
        volta = {}
        for x in qy.get('normalized', []) + qy.get('redirects', []): volta[x['to']] = volta.get(x['from'], x['from'])
        for t in lote: cache[t] = None
        for pg in qy.get('pages', []):
            if pg.get('missing') or not pg.get('revisions'): continue
            orig = volta.get(pg['title'], pg['title'])
            cache[orig] = {'titulo': pg['title'], 'texto': pg['revisions'][0]['slots']['main']['content']}
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
        print(f'    {len(cache)}/{len(set(titulos) | set(cache))} páginas', flush=True)
    return {t: cache[t] for t in titulos if cache.get(t)}

# ---------------------------------------------------------------- wikitexto
def templates(txt, nome_re):
    """[(inicio, fim, nome, params)] de cada {{Template|...}} cujo nome casa com nome_re (aceita aninhados)."""
    res = []
    for m in re.finditer(r'\{\{\s*(' + nome_re + r')\s*(?=[|}\n])', txt, re.I):
        i, d, j = m.start(), 0, m.start()
        while j < len(txt) - 1:
            par = txt[j:j + 2]
            if par == '{{': d += 1; j += 2; continue
            if par == '}}':
                d -= 1; j += 2
                if d == 0: break
                continue
            j += 1
        corpo = txt[m.end():j - 2]
        res.append((i, j, m.group(1).strip(), params(corpo)))
    return res

def params(corpo):
    """divide 'a=1|b={{x|y}}|c' nos | de primeiro nível -> {'a': '1', 'b': '{{x|y}}', 1: 'c'}"""
    partes, d, buf = [], 0, ''
    i = 0
    while i < len(corpo):
        dois = corpo[i:i + 2]
        if dois in ('{{', '[['): d += 1; buf += dois; i += 2; continue
        if dois in ('}}', ']]'): d -= 1; buf += dois; i += 2; continue
        if corpo[i] == '|' and d == 0: partes.append(buf); buf = ''; i += 1; continue
        buf += corpo[i]; i += 1
    partes.append(buf)
    res, pos = {}, 1
    for p in partes:
        if '=' in p and not p.lstrip().startswith('{{'):
            k, v = p.split('=', 1); res[k.strip().lower()] = v.strip()
        elif p.strip():
            res[pos] = p.strip(); pos += 1
    return res

def limpa(v):
    v = re.sub(r'<ref[^>]*/>|<ref.*?</ref>|<!--.*?-->', '', v or '', flags=re.S)
    v = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', v)
    v = re.sub(r'\{\{[^{}]*\}\}', '', v)
    return v.strip()

FORA = re.compile(r'former|inactive|loan|organi[sz]ation|staff|management|retired|academy|stand.?in', re.I)
NAO_JOGA = re.compile(r'coach|analyst|manager|owner|ceo|staff|streamer|content|creator|substitute|sub\b|bench|reserve|stand.?in|psych|perform', re.I)

def elenco_ativo(txt):
    """jogadores do elenco ativo, na ordem da página: [{'nick', 'link', 'nat', 'nome', 'role'}]"""
    blocos = templates(txt, r'(?:Active|Former|Inactive)?Squad(?:Table)?')
    blocos = [b for b in blocos if not re.match(r'squad ?(player|person)', b[2], re.I)]
    titulos = [(m.start(), m.group(1)) for m in re.finditer(r'^=+\s*(.*?)\s*=+\s*$', txt, re.M)]
    out = []
    for i, _, nome_t, p in templates(txt, r'Squad ?Player|SquadPerson|Squad/Player'):
        bloco = min((b for b in blocos if b[0] < i < b[1]), key=lambda b: b[1] - b[0], default=None)
        if bloco:
            bn, bp = bloco[2], bloco[3]
            if FORA.search(bn) or FORA.search(str(bp.get('status', '')) + ' ' + str(bp.get('type', ''))): continue
        sec = next((t for pos, t in reversed(titulos) if pos < i), '')
        if FORA.search(sec) or re.search(r'coach|staff', sec, re.I): continue
        if any(limpa(p.get(k)) for k in ('leavedate', 'inactivedate', 'leavedatedisplay')): continue
        role = limpa(p.get('role') or p.get('position') or '')
        if NAO_JOGA.search(role) or limpa(p.get('captain', '')) == 'coach': continue
        nick = limpa(p.get('id') or p.get(1) or '')
        if not nick: continue
        out.append({'nick': nick, 'link': limpa(p.get('link')) or nick, 'nat': (limpa(p.get('flag')) or '').lower() or None,
                    'nome': limpa(p.get('name')) or None, 'role': role})
    vistos, res = set(), []
    for j in out:
        if bf.chave(j['nick']) not in vistos: vistos.add(bf.chave(j['nick'])); res.append(j)
    return res

def secao_ativos(txt):
    """número da seção "Active" logo abaixo de "Player Roster" (numeração do MediaWiki: cabeçalhos do wikitexto em ordem)"""
    txt = re.sub(r'<!--.*?-->', '', txt, flags=re.S)
    heads = [h.strip() for h in re.findall(r'^=+\s*(.*?)\s*=+\s*$', txt, re.M)]
    for i, h in enumerate(heads):
        if re.match(r'player roster|roster', h, re.I):
            for k in range(i + 1, len(heads)):
                if re.match(r'active|current', heads[k], re.I): return k + 1
            return i + 1
    return None

_ult_parse = [0.0]
ESPERA_PARSE = 31.0  # a Liquipedia permite action=parse só 1 vez a cada 30 s
def elenco_montado(g, titulo, txt):
    """Elencos automáticos ({{ActiveSquadAuto}}): pede só a seção "Active" já montada (action=parse) e lê a tabela."""
    import html as H
    arq = CACHE / f'.cache_liqui_{g}_parse.json'
    cache = json.loads(arq.read_text(encoding='utf-8')) if arq.exists() and not REFAZER else {}
    sec = secao_ativos(txt)
    if sec is None: return []
    if titulo not in cache:
        w = _ult_parse[0] + ESPERA_PARSE - time.time()
        if w > 0: print(f'    (esperando {int(w)} s — regra da Liquipedia)', flush=True); time.sleep(w)
        d = api(g, action='parse', page=titulo, prop='text', section=str(sec), disablelimitreport='1', disableeditsection='1')
        _ult_parse[0] = time.time()
        cache[titulo] = d.get('parse', {}).get('text', '')
        arq.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
    h = cache[titulo]
    out = []
    for tab in re.findall(r'<table.*?</table>', h, re.S):
        cab = [re.sub(r'<[^>]+>', '', c).strip().lower() for c in re.findall(r'<th[^>]*>(.*?)</th>', tab, re.S)]
        for tr in re.findall(r'<tr[^>]*row--body[^>]*>(.*?)</tr>', tab, re.S) or re.findall(r'<tr[^>]*>(.*?)</tr>', tab, re.S)[1:]:
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
            if not tds: continue
            col = {cab[i] if i < len(cab) else str(i): v for i, v in enumerate(tds)}
            idc = col.get('id', tds[0])
            a = re.search(r'<a href="[^"]*"[^>]*? title="([^"]+)"[^>]*>(.*?)</a>', idc, re.S)  # inclui link de página inexistente (class="new")
            if not a: continue
            pais = re.search(r'<span class="flag"><img alt="([^"]+)"', idc)
            txtc = lambda k: H.unescape(re.sub(r'<sup.*?</sup>|<[^>]+>', '', col.get(k, ''), flags=re.S)).strip()
            role = txtc('position') or txtc('role') or txtc('')  # às vezes a coluna da função não tem título
            if NAO_JOGA.search(role) or txtc('leave date') or txtc('inactive date'): continue
            nick = H.unescape(re.sub(r'<[^>]+>', '', a.group(2))).strip()
            existe = '(page does not exist)' not in a.group(1)
            out.append({'nick': nick, 'link': H.unescape(a.group(1)) if existe else None, 'nat': be.iso(pais.group(1)) if pais else None,
                        'nome': txtc('name') or None, 'role': role})
    return out

def infobox(txt, nome_re):
    t = templates(txt, nome_re)
    return {k: limpa(v) for k, v in t[0][3].items() if isinstance(k, str)} if t else {}

# ordem das funções no jogo
ROLE_KEYS = {
    'wr': [('TOP', r'top|baron'), ('JNG', r'jungl'), ('MID', r'mid'), ('ADC', r'bot|adc|carry|dragon|duo'), ('SUP', r'supp')],
    'ff': [('IGL', r'igl|leader|captain|shot.?call'), ('RUSH', r'rush|entry|assault|flank'), ('SNP', r'snip'), ('SUP', r'supp|bomb|grenad')],
    'dota2': [('POS1', r'^\s*1\s*$|carry|safe|pos.?1'), ('POS2', r'^\s*2\s*$|mid|pos.?2'), ('POS3', r'^\s*3\s*$|off.?lan|pos.?3'),
              ('POS4', r'^\s*4\s*$|soft|pos.?4'), ('POS5', r'^\s*5\s*$|hard|pos.?5')],
    'cs2': [('IGL', r'igl|in.?game|leader|captain'), ('AWP', r'awp|snip'), ('ENT', r'entry|rifl'), ('LUR', r'lurk'), ('SUP', r'supp')],
    'valorant': [('DUE', r'duel'), ('INI', r'initi'), ('CTR', r'contr|smok'), ('SEN', r'sentin'), ('FLX', r'flex')],
    'r6': [('ENT', r'entry'), ('FLX', r'flex|igl|leader'), ('ANC', r'anchor'), ('ROM', r'roam'), ('SUP', r'supp|hard.?break')],
}
def ordena(g, js, n):
    keys = ROLE_KEYS.get(g)
    if not keys: return js[:n]
    vagas, resto = [None] * len(keys), []
    for j in js:
        k = next((i for i, (_, rx) in enumerate(keys) if vagas[i] is None and re.search(rx, j['role'] or '', re.I)), None)
        if k is None: resto.append(j)
        else: vagas[k] = j
    for i in range(len(vagas)):
        if vagas[i] is None and resto: vagas[i] = resto.pop(0)
    return [j for j in vagas if j][:n]

def nat_iso(v):
    if not v: return None
    v = v.strip().lower()
    if len(v) == 2: return 'gb' if v == 'uk' else v
    return be.iso(v)

# ---------------------------------------------------------------- times
def alias():
    arq = CACHE / 'liquipedia_alias.json'
    return json.loads(arq.read_text(encoding='utf-8')) if arq.exists() else {}

def variacoes(nome):
    base = re.sub(r'\s+(Esports|E-Sports|Gaming|Team|Club|LATAM|Global|Wild)$', '', nome, flags=re.I)
    base = re.sub(r'^Team\s+', '', base)
    vs = [nome, base, f'{base} Esports', f'{base} Gaming', f'Team {base}', nome.replace('Vivo ', '')]
    return [v for i, v in enumerate(vs) if v and v not in vs[:i]]

def acha_times(g, nomes, rel):
    al = alias().get(g, {})
    achados, acabou = {}, set()
    for rodada in range(6):
        pedir = {}
        for t in nomes:
            if t in achados or t in acabou: continue
            cands = ([al[t]] if t in al else []) + variacoes(t)
            if rodada < len(cands): pedir[t] = cands[rodada]
        if not pedir: break
        pg = paginas(g, list(pedir.values()), 'times')
        for t, tit in pedir.items():
            p = pg.get(tit)
            if not p: continue
            ib = infobox(p['texto'], r'Infobox team')
            if not ib: continue  # página de desambiguação ou de outra coisa
            if ib.get('disbanded'): acabou.add(t); rel.append(f'[{g}] ? {t}: a página "{p["titulo"]}" diz que o time acabou — elenco mantido'); continue
            achados[t] = p
            if p['titulo'] != t: rel.append(f'[{g}]   ({t} = "{p["titulo"]}" na Liquipedia)')
    for t in nomes:
        if t not in achados and t not in acabou: rel.append(f'[{g}] ? {t}: não achei a página do time — elenco mantido (dá para indicar em entrada/liquipedia_alias.json)')
    return achados

# ---------------------------------------------------------------- logos
def logos(g, achados, rel):
    tem = set(json.loads((DADOS / 'logos.LOGOS.json').read_text(encoding='utf-8')))
    pasta = CACHE / 'logos'; pasta.mkdir(parents=True, exist_ok=True)
    quer = {}
    for t, p in achados.items():
        if bf.slug(t) in tem or any(pasta.glob(bf.slug(t) + '.*')): continue
        ib = infobox(p['texto'], r'Infobox team')
        arq = ib.get('image') or ib.get('imagedark')
        if arq: quer[t] = 'File:' + re.sub(r'^(File|Image):', '', arq, flags=re.I).strip()
        else: quer[t] = None
    urls = {}
    sem = [t for t, a in quer.items() if a is None]
    if sem:  # logo guardado no modelo {{Team|...}}: um único action=parse com todos eles
        w = _ult_parse[0] + ESPERA_PARSE - time.time()
        if w > 0: time.sleep(w)
        txt = ''.join(f'<div class="lq-t">{{{{Team|{achados[t]["titulo"]}}}}}</div>' for t in sem)
        d = api(g, action='parse', text=txt, contentmodel='wikitext', prop='text', disablelimitreport='1')
        _ult_parse[0] = time.time()
        blocos = re.findall(r'<div class="lq-t">(.*?)</div>\s*(?=<div class="lq-t">|$)', d.get('parse', {}).get('text', ''), re.S)
        for t, b in zip(sem, blocos):
            src = re.search(r'<img[^>]+src="(/commons/images/[^"]+)"', b)
            if not src or 'filler' in src.group(1).lower(): rel.append(f'[{g}] ? {t}: página sem logo'); continue
            m = re.match(r'/commons/images/thumb/(.+?)/\d+px-[^/]+$', src.group(1))
            quer[t] = 'icone:' + t
            urls[quer[t]] = 'https://liquipedia.net/commons/images/' + (m.group(1) if m else src.group(1).split('/commons/images/', 1)[1])
    quer = {t: a for t, a in quer.items() if a}
    if not quer: return 0
    for lote in bf.lotes(sorted({a for a in quer.values() if not a.startswith('icone:')}), 50):
        d = api(g, action='query', prop='imageinfo', iiprop='url', titles='|'.join(lote))
        qy = d.get('query', {})
        volta = {x['to']: x['from'] for x in qy.get('normalized', [])}
        for pg in qy.get('pages', []):
            ii = pg.get('imageinfo')
            if ii: urls[volta.get(pg['title'], pg['title'])] = ii[0]['url']
    n = 0
    for t, arq in sorted(quer.items()):
        url = urls.get(arq)
        if not url: rel.append(f'[{g}] ? {t}: não achei o arquivo {arq}'); continue
        ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or '.png'
        if ext == '.svg': rel.append(f'[{g}] ? {t}: logo só em SVG ({url}) — baixe e converta à mão'); continue
        try:
            dados = bf.baixa_imagem(url, ESPERA, f'https://liquipedia.net/{WIKI[g]}/')
        except Exception as e:
            rel.append(f'[{g}] ! {t}: logo não baixou ({e})'); continue
        (pasta / f'{bf.slug(t)}{ext}').write_bytes(dados); n += 1
        print(f'  ✓ logo {t}', flush=True)
        with open(CACHE / 'logos' / 'CREDITOS_liquipedia.txt', 'a', encoding='utf-8') as f: f.write(f'{bf.slug(t)}\t{url}\n')
    return n

# ---------------------------------------------------------------- principal
def processa(g, saida, rel):
    atuais = be.dados_atuais(g)
    over = {t: ps for t, ps in saida.get(g, {}).items() if t in atuais}  # times que saíram do jogo não disputam jogadores
    nomes = list(atuais)
    if '--times' in OPC: nomes = [t for t in nomes if t in OPC['--times'].split(',')]
    elif g in be.FONTES and '--todos' not in OPC: nomes = [t for t in nomes if t not in over]  # só o que as outras fontes não acharam
    if g == 'fifa': nomes = [t for t in nomes if not re.search(r' (II|III|IV|V|VI)$', t)]  # "Team Liquid II" usa o logo da org
    print(f'[{g}] {len(nomes)} times — procurando as páginas na Liquipedia ({WIKI[g]})', flush=True)
    achados = acha_times(g, nomes, rel)
    if g == 'fifa' and '--so-logos' not in OPC:
        rel.append('[fifa] elencos do EA FC vêm do tools/ligas_reais.py (um pro por time); aqui só os logos')
        OPC['--so-logos'] = True
    if '--so-logos' not in OPC:
        auto = [t for t, p in achados.items() if not elenco_ativo(p['texto'])]
        if auto: print(f'[{g}] {len(auto)} times com elenco automático: ~{len(auto) * 31 // 60 + 1} min (1 página a cada 30 s)', flush=True)
        elencos = {}
        for t, p in achados.items():
            js = elenco_ativo(p['texto']) or elenco_montado(g, p['titulo'], p['texto'])
            elencos[t] = ordena(g, js, ROLES_N[g])
        for t, js in list(elencos.items()):
            if len(js) < ROLES_N[g]:
                rel.append(f'[{g}] ? {t}: só {len(js)} titular(es) na página — elenco mantido'); del elencos[t]
        print(f'[{g}] lendo {sum(map(len, elencos.values()))} páginas de jogadores', flush=True)
        pj = paginas(g, [j['link'] for js in elencos.values() for j in js if j['link']], 'jogadores')
        for js in elencos.values():
            for j in js:
                ib = infobox((pj.get(j['link'] or '') or {}).get('texto', ''), r'Infobox player')
                j['nasc'] = (re.search(r'\d{4}-\d{2}-\d{2}', ib.get('birth_date', '')) or [None])[0]
                j['nat'] = nat_iso(ib.get('country')) or nat_iso(j['nat'])
                j['nome'] = ib.get('romanized_name') or ib.get('name') or j['nome']
        if MOSTRAR:
            for t, js in elencos.items():
                print(f'  {t} ({achados[t]["titulo"]}): ' + ' | '.join(f'{j["nick"]} [{j["role"] or "-"}] {j["nat"] or "?"} {j["nasc"] or "?"} {j["nome"] or ""}' for j in js))
        else:
            novo = {t: [p + [2] if p else None for p in ps] for t, ps in over.items()}  # o que já estava tem prioridade igual
            for t, js in elencos.items(): novo[t] = be.monta_time(g, atuais, t, js, rel, ROLES_N[g], prio=2)
            be.dedup(g, novo, rel)
            saida[g] = novo
            print(f'[{g}] {len(elencos)} elencos reais da Liquipedia', flush=True)
    if '--sem-logos' not in OPC and not MOSTRAR:
        print(f'[{g}] {logos(g, achados, rel)} logos novos em entrada/logos/', flush=True)

def main():
    contato = OPC.get('--contato') or os.environ.get('LIQUIPEDIA_CONTATO')
    if not contato or contato is True:
        sys.exit('A Liquipedia exige um contato no User-Agent. Rode com --contato=seu@email.com (ou o link do seu GitHub).')
    bf.UA = f'EsportsCEO-hobby-game/1.0 (fan-made esports manager; {contato})'
    jogos = ARGS or ['ff', 'fifa', 'wr']
    saida = json.loads(be.SAIDA.read_text(encoding='utf-8')) if be.SAIDA.exists() else {}
    rel = []
    for g in jogos:
        if g not in WIKI: rel.append(f'[{g}] jogo desconhecido'); continue
        try:
            processa(g, saida, rel)
        except bf.Bloqueado:
            rel.append(f'[{g}] a Liquipedia respondeu "Rate Limited" — parei para não piorar o bloqueio. Tente de novo mais tarde (o que já veio ficou no cache).')
            print(rel[-1]); break
        if not MOSTRAR: be.SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (CACHE / 'liquipedia_relatorio.txt').write_text('\n'.join(rel) + '\n', encoding='utf-8')
    print('\n'.join(rel))
    if not MOSTRAR: print('\nPróximos passos: python tools/importar_imagens.py  e  python tools/buscar_fotos.py ' + ' '.join(jogos))

if __name__ == '__main__':
    main()

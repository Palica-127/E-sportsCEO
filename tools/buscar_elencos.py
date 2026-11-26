#!/usr/bin/env python3
"""Pesquisa os elencos reais (titulares, nome verdadeiro, nacionalidade e idade) e grava src/data/elencos.json.

O jogo aplica elencos.json por cima de lol.json / outros.json ao montar o mundo (src/engine/games.ts),
então os geradores antigos continuam valendo para o resto. Formato:
  { "<jogo>": { "<nome do time no jogo>": [[nick, nota, idade, nac_iso2, nome_real], ...] } }
A ordem dos jogadores segue as funções do jogo (LoL: TOP, JNG, MID, ADC, SUP).

Nota: quem já estava no jogo mantém a nota; quem chega ganha a média do time (−1).

Fontes:
  - lol:      Leaguepedia (API Cargo: Teams + Players)
  - valorant: vlr.gg (página do time) + prosettings.net (aniversário)
  - r6:       siege.gg (página do time)
  - cs2:      prosettings.net (página do time e do jogador)
  - dota2:    OpenDota (times ativos e jogadores atuais; sem aniversário nem nome real)
  Free Fire, EA FC e Wild Rift: tools/buscar_liquipedia.py (API oficial da Liquipedia; ver entrada/COMO_BUSCAR_LIQUIPEDIA.txt)

Uso: python tools/buscar_elencos.py lol valorant ...   (--refazer ignora o cache)
Gera também entrada/elencos_relatorio.txt com o que mudou e o que ficou de fora.
"""
import datetime, json, re, sys, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import buscar_fotos as bf  # get(), slug(), chave(), _literal()

RAIZ = bf.RAIZ
DADOS = RAIZ / 'src' / 'data'
SAIDA = DADOS / 'elencos.json'
CACHE = RAIZ / 'entrada'
HOJE = datetime.date.today()
REFAZER = '--refazer' in sys.argv

PAISES = {
 'brazil': 'br', 'argentina': 'ar', 'chile': 'cl', 'uruguay': 'uy', 'paraguay': 'py', 'peru': 'pe', 'colombia': 'co', 'mexico': 'mx',
 'venezuela': 've', 'ecuador': 'ec', 'bolivia': 'bo', 'costa rica': 'cr', 'guatemala': 'gt', 'puerto rico': 'pr', 'dominican republic': 'do',
 'united states': 'us', 'usa': 'us', 'canada': 'ca', 'south korea': 'kr', 'korea': 'kr', 'republic of korea': 'kr', 'china': 'cn',
 'taiwan': 'tw', 'hong kong': 'hk', 'macau': 'mo', 'japan': 'jp', 'vietnam': 'vn', 'viet nam': 'vn', 'thailand': 'th', 'philippines': 'ph',
 'indonesia': 'id', 'malaysia': 'my', 'singapore': 'sg', 'australia': 'au', 'new zealand': 'nz', 'india': 'in', 'pakistan': 'pk',
 'mongolia': 'mn', 'kazakhstan': 'kz', 'kyrgyzstan': 'kg', 'uzbekistan': 'uz', 'russia': 'ru', 'ukraine': 'ua', 'belarus': 'by',
 'latvia': 'lv', 'lithuania': 'lt', 'estonia': 'ee', 'finland': 'fi', 'sweden': 'se', 'norway': 'no', 'denmark': 'dk', 'iceland': 'is',
 'germany': 'de', 'austria': 'at', 'switzerland': 'ch', 'france': 'fr', 'belgium': 'be', 'netherlands': 'nl', 'luxembourg': 'lu',
 'united kingdom': 'gb', 'england': 'gb', 'scotland': 'gb', 'wales': 'gb', 'ireland': 'ie', 'spain': 'es', 'portugal': 'pt', 'italy': 'it',
 'poland': 'pl', 'czech republic': 'cz', 'czechia': 'cz', 'slovakia': 'sk', 'hungary': 'hu', 'romania': 'ro', 'bulgaria': 'bg',
 'serbia': 'rs', 'croatia': 'hr', 'slovenia': 'si', 'bosnia and herzegovina': 'ba', 'montenegro': 'me', 'north macedonia': 'mk',
 'albania': 'al', 'kosovo': 'xk', 'greece': 'gr', 'cyprus': 'cy', 'turkey': 'tr', 'türkiye': 'tr', 'israel': 'il', 'armenia': 'am',
 'georgia': 'ge', 'azerbaijan': 'az', 'moldova': 'md', 'saudi arabia': 'sa', 'united arab emirates': 'ae', 'jordan': 'jo',
 'lebanon': 'lb', 'egypt': 'eg', 'morocco': 'ma', 'tunisia': 'tn', 'algeria': 'dz', 'kuwait': 'kw', 'qatar': 'qa', 'bahrain': 'bh',
 'iraq': 'iq', 'iran': 'ir', 'syria': 'sy', 'oman': 'om', 'south africa': 'za', 'nigeria': 'ng', 'cambodia': 'kh', 'myanmar': 'mm',
 'laos': 'la', 'bangladesh': 'bd', 'nepal': 'np', 'sri lanka': 'lk',
}
def iso(pais):
    if not pais: return None
    p = pais.strip().lower()
    if len(p) == 2: return p
    return PAISES.get(p)

def idade(nasc):
    try: d = datetime.date.fromisoformat(nasc[:10])
    except Exception: return None
    return HOJE.year - d.year - ((HOJE.month, HOJE.day) < (d.month, d.day))

def cache_json(nome, fn):
    arq = CACHE / f'.cache_elencos_{nome}.json'
    if arq.exists() and not REFAZER: return json.loads(arq.read_text(encoding='utf-8'))
    v = fn(); arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(v, ensure_ascii=False), encoding='utf-8'); return v

def dados_atuais(g):
    """{time: [[nick, nota, idade, nat?], ...]} do jogo, antes do overlay"""
    if g == 'lol': d = json.loads((DADOS / 'lol.json').read_text(encoding='utf-8'))
    else: d = json.loads((DADOS / 'outros.json').read_text(encoding='utf-8'))[g]
    res = {}
    for L in d['leagues'].values():
        for t in L['t1'] + L['t2']: res[t['n']] = [list(p) for p in (t['p'] or [])]
    return res

def nota_de(g, atuais, time, nick):
    for ps in atuais.values():
        for p in ps:
            if bf.chave(p[0]) == bf.chave(nick) and p[1] is not None: return int(p[1])
    ns = [int(p[1]) for p in atuais.get(time, []) if p[1] is not None]
    return max(55, round(sum(ns) / len(ns)) - 1) if ns else 70

# ---------------------------------------------------------------- LoL
ROLES_LOL = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']
# nome no jogo -> página do time na Leaguepedia, quando o nome não bate direto
ALIAS_LOL = {'Leviatán': 'Leviatan', '7REX Team': '7REX', 'paiN Academy': 'PaiN Gaming Academy', 'Vitality': 'Team Vitality',
             'Hanwha Life': 'Hanwha Life Esports', 'DRX': 'Kiwoom DRX', 'WE Academy': 'Team WE Academy', 'LGD Youth': 'LGD Gaming Young Team',
             'AL Young': "Anyone's Legend.Young", 'SN Cybercore': 'SN CyberCore Esports', 'TT Gaming': 'ThunderTalk Gaming'}
def cargo(**kw): return bf.cargo(**kw)
def q(s): return bf.q(s)

PAGINA_LOL = {}  # nome no jogo -> página do time na Leaguepedia (usado também pelo buscar_tecnicos)
def lol(rel):
    atuais = dados_atuais('lol')
    times = list(atuais)
    nicks = sorted({str(p[0]) for ps in atuais.values() for p in ps})
    CAMPOS = 'ID,OverviewPage,Name,Country,Nationality,Birthdate,Team,Role,IsRetired,IsSubstitute,IsTrainee'
    def jog_por_nick():
        out = []
        for lote in bf.lotes(nicks, 90):
            out += cargo(tables='Players', fields=CAMPOS, where=f"ID IN ({','.join(q(n) for n in lote)})")
        return out
    por_nick = cache_json('lol_nicks', jog_por_nick)
    def times_por_nome():
        out = []
        for lote in bf.lotes(times, 60):
            lst = ','.join(q(t) for t in lote)
            out += cargo(tables='Teams', fields='Name,OverviewPage,Short,IsDisbanded,RenamedTo,Region', where=f"Name IN ({lst}) OR Short IN ({lst}) OR OverviewPage IN ({lst})")
        return out
    tms = cache_json('lol_times', times_por_nome)
    # nome no jogo -> página do time na Leaguepedia
    pagina = {}
    by = {}
    for r in tms:
        for k in ('Name', 'Short', 'OverviewPage'):
            if r.get(k): by.setdefault(r[k].lower(), []).append(r)
    time_do_nick = {}
    for r in por_nick:
        if r.get('IsRetired') != '1' and r.get('Team'): time_do_nick.setdefault(r['ID'].lower(), set()).add(r['Team'])
    for t, ps in atuais.items():
        if t in ALIAS_LOL: pagina[t] = ALIAS_LOL[t]; continue
        cands = [r for r in by.get(t.lower(), []) if r.get('IsDisbanded') != '1'] or by.get(t.lower(), [])
        voto = {}
        for p in ps:
            for tm in time_do_nick.get(str(p[0]).lower(), ()): voto[tm] = voto.get(tm, 0) + 1
        if len(cands) == 1: pagina[t] = cands[0]['OverviewPage']
        elif cands:
            pagina[t] = max(cands, key=lambda r: voto.get(r['OverviewPage'], 0))['OverviewPage']
        elif voto and max(voto.values()) >= 3: pagina[t] = max(voto, key=voto.get)
        else: rel.append(f'[lol] ? {t}: não achei o time na Leaguepedia — elenco mantido')
        if t in pagina and pagina[t] in [r['OverviewPage'] for r in tms if r.get('IsDisbanded') == '1']:
            rel.append(f'[lol] ! {t} ({pagina[t]}) consta como DESFEITO na Leaguepedia')
    PAGINA_LOL.clear(); PAGINA_LOL.update(pagina)
    paginas = sorted(set(pagina.values()))
    def rosters():
        out = []
        for lote in bf.lotes(paginas, 40):
            out += cargo(tables='Players', fields=CAMPOS, where=f"Team IN ({','.join(q(p) for p in lote)}) AND (IsRetired IS NULL OR IsRetired = '0')")
        return out
    import hashlib
    jog = cache_json('lol_rosters_' + hashlib.md5('|'.join(paginas).encode()).hexdigest()[:10], rosters)
    por_time = {}
    for r in jog:
        if r.get('Role') in ROLES_LOL: por_time.setdefault(r['Team'], []).append(r)
    res = {}
    for t, pg in pagina.items():
        lst = por_time.get(pg, [])
        antes = {bf.chave(p[0]) for p in atuais[t]}
        linha = []
        for i, role in enumerate(ROLES_LOL):
            cs = [r for r in lst if r['Role'] == role]
            if not cs: linha.append(None); continue
            # titular: não reserva, não trainee; empate: quem já estava no jogo
            cs.sort(key=lambda r: (r.get('IsSubstitute') == '1', r.get('IsTrainee') == '1', bf.chave(r['ID']) not in antes))
            linha.append(cs[0])
        if sum(1 for x in linha if x) < 3:
            rel.append(f'[lol] ? {t} ({pg}): só {sum(1 for x in linha if x)} titulares na Leaguepedia — elenco mantido'); continue
        novo = []
        for i, r in enumerate(linha):
            if r is None:  # função sem jogador listado: mantém quem estava
                p = atuais[t][i] if i < len(atuais[t]) else None
                if p: novo.append([p[0], p[1], p[2] if len(p) > 2 else None, p[3] if len(p) > 3 else None, None, 0])
                continue
            nat = iso(r.get('Country')) or iso(r.get('Nationality'))
            novo.append([r['ID'], nota_de('lol', atuais, t, r['ID']), idade(r.get('Birthdate') or ''), nat, r.get('Name') or None, 2])
        saiu = [p[0] for p in atuais[t] if bf.chave(p[0]) not in {bf.chave(x[0]) for x in novo}]
        entrou = [x[0] for x in novo if bf.chave(x[0]) not in antes]
        if saiu or entrou: rel.append(f'[lol] {t}: saem {", ".join(saiu) or "—"} | entram {", ".join(entrou) or "—"}')
        res[t] = novo
    return res

# ---------------------------------------------------------------- utilidades HTML
import html as _html
def pagina(url, espera=1.5):
    return bf.get(url, espera, texto=True)

def texto_limpo(h):
    return [l.strip() for l in _html.unescape(re.sub(r'<[^>]+>', '\n', h)).split('\n') if l.strip()]

MESES = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}
_ps_cache = None
def prosettings_info(nick, nome_jogo):
    """{'nasc': 'AAAA-MM-DD', 'pais': 'Brazil', 'nome': ..., 'time': ...} do prosettings, conferindo nick e jogo"""
    global _ps_cache
    arq = CACHE / '.cache_elencos_prosettings.json'
    if _ps_cache is None: _ps_cache = json.loads(arq.read_text(encoding='utf-8')) if arq.exists() and not REFAZER else {}
    k = f'{nome_jogo}|{bf.chave(nick)}'
    if k in _ps_cache: return _ps_cache[k]
    info = {}
    h = pagina(f'https://prosettings.net/players/{bf.slug(nick)}/')
    if h:
        tit = _html.unescape((re.search(r'<title>([^<]*)', h) or [None, ''])[1])
        if nome_jogo.lower() in tit.lower() and bf.chave(tit.split(' ' + nome_jogo.split()[0])[0]) == bf.chave(nick):
            L = texto_limpo(h)
            for i, l in enumerate(L[:-1]):
                if l == 'Birthday' and 'nasc' not in info:
                    m = re.match(r'([A-Za-z]+) (\d{1,2}), (\d{4})', L[i + 1])
                    if m and m.group(1).lower() in MESES: info['nasc'] = f'{m.group(3)}-{MESES[m.group(1).lower()]:02d}-{int(m.group(2)):02d}'
                elif l == 'Country' and 'pais' not in info: info['pais'] = L[i + 1]
                elif l == 'Team' and 'time' not in info: info['time'] = L[i + 1]
            m = re.search(r'([^.>]{2,60}?) &#8220;' + re.escape(nick) + r'&#8221; ([^.<]{2,60}?) was born', h, re.I) or \
                re.search(r'([^.>]{2,60}?) “' + re.escape(nick) + r'” ([^.<]{2,60}?) was born', _html.unescape(h), re.I)
            if m: info['nome'] = f'{m.group(1).strip()} {m.group(2).strip()}'
    _ps_cache[k] = info
    arq.write_text(json.dumps(_ps_cache, ensure_ascii=False), encoding='utf-8')
    return info

def casa_nome(nome, opcoes):
    """acha o nome do time numa lista de nomes de outra fonte: igual, ou igual sem o sufixo (Esports/Gaming...).
    Sem aproximação: "Shopify Rebellion" casava com o time feminino "Shopify Rebellion Gold"."""
    SUF = r'-(esports|gaming|team|club|e-sports|gg)$'
    lim = lambda s: re.sub(SUF + r'|^(team)-', '', bf.slug(s)).replace('-', '')
    suf = lambda s: (re.search(SUF, bf.slug(s)) or [None, None])[1]
    exato = {bf.slug(o).replace('-', ''): o for o in opcoes}
    if bf.slug(nome).replace('-', '') in exato: return exato[bf.slug(nome).replace('-', '')]
    for o in opcoes:
        # "Oxygen Esports" x "Oxygen Gaming": sufixos diferentes = organizações diferentes
        if lim(o) == lim(nome) and not (suf(o) and suf(nome) and suf(o) != suf(nome)): return o
    return None

def monta_time(g, atuais, t, jogadores, rel, n_roles, prio=2):
    """jogadores: [{nick, nat, nome, nasc}] na ordem da fonte -> linha do elencos.json"""
    antes = {bf.chave(p[0]) for p in atuais[t]}
    novo = []
    for j in jogadores[:n_roles]:
        velho = next((p for p in atuais[t] if bf.chave(p[0]) == bf.chave(j['nick'])), None)
        ida = idade(j.get('nasc') or '') or (velho[2] if velho and len(velho) > 2 else None)
        nat = j.get('nat') or (velho[3] if velho and len(velho) > 3 else None)
        novo.append([j['nick'], nota_de(g, atuais, t, j['nick']), ida, nat, j.get('nome') or None, prio])
    saiu = [p[0] for p in atuais[t] if bf.chave(p[0]) not in {bf.chave(x[0]) for x in novo}]
    entrou = [x[0] for x in novo if bf.chave(x[0]) not in antes]
    if saiu or entrou: rel.append(f'[{g}] {t}: saem {", ".join(map(str, saiu)) or "—"} | entram {", ".join(entrou) or "—"}')
    return novo

# ---------------------------------------------------------------- Valorant (vlr.gg)
VLR = 'https://www.vlr.gg'
VLR_REG = ['north-america', 'brazil', 'la-s', 'la-n', 'europe', 'mena', 'korea', 'japan', 'asia-pacific', 'oceania', 'gc', 'china']
def valorant(rel):
    atuais = dados_atuais('valorant')
    def ranking():
        times = {}
        for r in VLR_REG:
            h = pagina(f'{VLR}/rankings/{r}')
            for tid, sl, nome in re.findall(r'href="/team/(\d+)/([^"]+)"[^>]*>\s*<img[^>]*alt="([^"]+)"', h or ''):
                times.setdefault(_html.unescape(nome), f'/team/{tid}/{sl}')
        return times
    times = cache_json('valorant_ranking', ranking)
    res = {}
    for t in atuais:
        nome = casa_nome(t, times)
        if not nome: rel.append(f'[valorant] ? {t}: time não achado no vlr.gg — elenco mantido'); continue
        def elenco(url=times[nome]):
            h = pagina(VLR + url) or ''
            a = h.find('wf-module-label'); b = h.find('>\n\t\t\t\t\tstaff', a)
            bloco = h[a:b if b > 0 else len(h)]
            out = []
            for it in re.split(r'class="team-roster-item"', bloco)[1:]:
                papel = re.search(r'team-roster-item-name-role[^>]*>\s*([^<]+?)\s*<', it)
                if papel and papel.group(1).strip().lower() in ('sub', 'inactive', 'stand-in', 'substitute'): continue
                nick = re.search(r'team-roster-item-name-alias">\s*(?:<i[^>]*></i>)?\s*([^<]+?)\s*<', it)
                if not nick: continue
                nat = re.search(r'flag mod-([a-z]{2})', it)
                real = re.search(r'team-roster-item-name-real">\s*([^<]+?)\s*<', it)
                out.append({'nick': _html.unescape(nick.group(1)), 'nat': nat.group(1) if nat else None,
                            'nome': _html.unescape(real.group(1)) if real else None})
            return out
        js = cache_json(f'valorant_time_{bf.slug(t)}', elenco)
        if len(js) < 4: rel.append(f'[valorant] ? {t} ({nome}): só {len(js)} titulares no vlr.gg — elenco mantido'); continue
        for j in js[:5]:
            info = prosettings_info(j['nick'], 'VALORANT')
            if info.get('nasc'): j['nasc'] = info['nasc']
        res[t] = monta_time('valorant', atuais, t, js, rel, 5)
        if nome != t: rel.append(f'[valorant]   ({t} = "{nome}" no vlr.gg)')
    return res

# ---------------------------------------------------------------- R6 (siege.gg)
SGG = 'https://siege.gg'
SGG_COMPS = ['186-north-america-league-2026-stage-2', '185-europe-mena-league-2026-stage-2', '187-south-america-league-2026-stage-2',
             '189-apac-north-league-2026-stage-2', '188-apac-asia-league-2026-stage-2', '190-apac-oceania-league-2026-stage-2',
             '195-challenger-league-2026', '194-euro-league-and-cup-fall-2026', '297-eml-challenger-circuit-2026-playoffs',
             '299-sal-challenger-circuit-2026-playoffs', '296-na-open-cup-finals-2026', '183-esports-world-cup-2026', '298-blast-major-osaka-2026',
             '93-europe-mena-league-2026-challenger-series', '94-north-america-league-2026-challenger-series', '95-south-america-league-2026-challenger-series']
def r6(rel):
    atuais = dados_atuais('r6')
    def times_sgg():
        times = {}
        for c in SGG_COMPS:
            h = pagina(f'{SGG}/competitions/{c}') or ''
            for u, nome in re.findall(r'href="(?:https://siege\.gg)?/teams/(\d+-[a-z0-9-]+)"[^>]*>\s*([^<]{2,40}?)\s*<', h):
                times.setdefault(_html.unescape(nome), '/teams/' + u)
            for u in re.findall(r'href="(?:https://siege\.gg)?/teams/(\d+-([a-z0-9-]+))"', h):
                times.setdefault(u[1].replace('-', ' '), '/teams/' + u[0])
        return times
    times = cache_json('r6_times', times_sgg)
    res = {}
    for t in atuais:
        nome = casa_nome(t, times)
        if not nome: rel.append(f'[r6] ? {t}: time não achado no siege.gg — elenco mantido'); continue
        def elenco(url=times[nome]):
            h = pagina(SGG + url) or ''
            a = h.find('roster roster--row'); b = h.find('</section>', a)
            out = []
            for u, nk, fl, real in re.findall(r'<h3[^>]*><a href="(/players/[^"]+)"[^>]*>([^<]+)</a></h3><span[^>]*><gg-flag flag="[^"]*/flags/([a-z-]+)\.svg"[^>]*></gg-flag>\s*([^<]*)</span>', h[a:b] if a > 0 else ''):
                hp = pagina(SGG + u) or ''
                m = re.search(r'<h1[^>]*pg-title[^>]*>([^<]+)</h1>', hp)
                out.append({'nick': _html.unescape(m.group(1).strip()) if m else nk, 'nat': fl[:2] if len(fl) >= 2 else None,
                            'nome': _html.unescape(real.strip()) or None})
            return out
        js = cache_json(f'r6_time_{bf.slug(t)}', elenco)
        if len(js) < 4: rel.append(f'[r6] ? {t} ({nome}): só {len(js)} jogadores no siege.gg — elenco mantido'); continue
        for j in js[:5]:
            info = prosettings_info(j['nick'], 'Rainbow Six')
            if info.get('nasc'): j['nasc'] = info['nasc']
        res[t] = monta_time('r6', atuais, t, js, rel, 5)
        if bf.slug(nome) != bf.slug(t): rel.append(f'[r6]   ({t} = "{nome}" no siege.gg)')
    return res

# ---------------------------------------------------------------- CS2 (prosettings.net)
def cs2(rel):
    atuais = dados_atuais('cs2')
    reais = bf.nicks_reais().get('cs2', set())
    res = {}
    for t, ps in atuais.items():
        if all(str(p[0]) in reais for p in ps):  # elenco real (HLTV, nov/2026): só completa os dados
            js = [{'nick': str(p[0])} for p in ps]
        else:
            def elenco(t=t):
                h = pagina(f'https://prosettings.net/teams/{bf.slug(t)}/') or ''
                a = h.find('CS2 Player Roster')
                if a < 0: return []
                b = h.find('Player Roster', a + 20)
                return [_html.unescape(n) for n in re.findall(r'href="https://prosettings\.net/players/[^"]+/"[^>]*>\s*(?:<[^>]+>\s*)*([^<\s][^<]*?)\s*<', h[a:b if b > 0 else a + 20000])]
            nicks = list(dict.fromkeys(cache_json(f'cs2_time_{bf.slug(t)}', elenco)))
            # só quem o prosettings ainda dá como jogador do time (a lista do time pode estar velha)
            js = [{'nick': n} for n in nicks if casa_nome(t, [prosettings_info(n, 'CS2').get('time') or '-'])]
            if len(js) < 5:
                rel.append(f'[cs2] ? {t}: elenco não confirmado no prosettings ({len(js)} jogadores) — mantido'); continue
        fonte_real = all(str(p[0]) in reais for p in ps)
        for j in js:
            info = prosettings_info(j['nick'], 'CS2')
            j['nasc'] = info.get('nasc'); j['nat'] = iso(info.get('pais')); j['nome'] = info.get('nome')
        res[t] = monta_time('cs2', atuais, t, js, rel, 5, prio=2 if fonte_real else 1)
    return res

# ---------------------------------------------------------------- Dota 2 (OpenDota)
OD = 'https://api.opendota.com/api'
def dota2(rel):
    atuais = dados_atuais('dota2')
    times = cache_json('dota2_times', lambda: bf.get(OD + '/teams', 1.2))
    pros = {p['account_id']: p for p in cache_json('dota2_pros', lambda: bf.get(OD + '/proPlayers', 1.2))}
    agora = datetime.datetime.now().timestamp()
    ativos = [t for t in times if t.get('last_match_time') and agora - t['last_match_time'] < 300 * 86400]  # jogou nos últimos ~10 meses
    por_nome = {}
    for t in sorted(ativos, key=lambda t: -(t.get('rating') or 0)):
        for n in (t.get('name'), t.get('tag')):
            if n: por_nome.setdefault(n, t)
    res = {}
    for t in atuais:
        nome = casa_nome(t, por_nome)
        if not nome: rel.append(f'[dota2] ? {t}: sem time ativo com esse nome no OpenDota — elenco mantido'); continue
        tid = por_nome[nome]['team_id']
        js = cache_json(f'dota2_time_{tid}', lambda tid=tid: bf.get(f'{OD}/teams/{tid}/players', 1.2))
        cur = sorted([p for p in js if p.get('is_current_team_member')], key=lambda p: -(p.get('games_played') or 0))
        if len(cur) < 4: rel.append(f'[dota2] ? {t} ({nome}): só {len(cur)} jogadores atuais no OpenDota — elenco mantido'); continue
        jog = []
        for p in cur[:5]:
            pro = pros.get(p['account_id'], {})
            jog.append({'nick': pro.get('name') or p.get('name'), 'nat': (pro.get('country_code') or '').lower() or None})
        res[t] = monta_time('dota2', atuais, t, jog, rel, 5)
        if bf.slug(nome) != bf.slug(t): rel.append(f'[dota2]   ({t} = "{nome}" no OpenDota)')
    return res

FONTES = {'lol': lol, 'valorant': valorant, 'r6': r6, 'cs2': cs2, 'dota2': dota2}

def dedup(g, over, rel):
    """cada jogador fica num time só. Prioridade: fonte principal (2) > lista de time do prosettings (1) >
    vaga mantida do elenco antigo (0) > time não pesquisado (-1). Os outros lugares viram vaga aberta (null)."""
    for t, ps in dados_atuais(g).items():
        if t not in over: over[t] = [[p[0], p[1], p[2] if len(p) > 2 else None, p[3] if len(p) > 3 else None, None, -1] for p in ps]
    melhor = {}
    for t, ps in over.items():
        for p in ps:
            if p:
                k = bf.chave(p[0])
                if k not in melhor or p[5] > melhor[k][1]: melhor[k] = (t, p[5])
    for t, ps in over.items():
        for i, p in enumerate(ps):
            # dois fictícios com o mesmo nick (prioridade -1 nos dois) não são a mesma pessoa
            if p and melhor[bf.chave(p[0])][0] != t and melhor[bf.chave(p[0])][1] >= 0:
                rel.append(f'[{g}] {t}: {p[0]} está em {melhor[bf.chave(p[0])][0]} — vaga aberta')
                ps[i] = None
    # times não pesquisados e sem conflito saem do arquivo; tira a marca de prioridade
    for t in list(over):
        if all(p is None or p[5] == -1 for p in over[t]) and all(p is not None for p in over[t]): del over[t]; continue
        over[t] = [p[:5] if p else None for p in over[t]]

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')] or list(FONTES)
    saida = json.loads(SAIDA.read_text(encoding='utf-8')) if SAIDA.exists() else {}
    rel = []
    for g in args:
        if g not in FONTES: rel.append(f'[{g}] use tools/buscar_liquipedia.py {g}'); continue
        print(f'[{g}] pesquisando…', flush=True)
        try:
            saida[g] = FONTES[g](rel)
        except bf.Bloqueado as e:
            rel.append(f'[{g}] {e} bloqueou o acesso — nada mudou'); continue
        dedup(g, saida[g], rel)
        print(f'[{g}] {len(saida[g])} times atualizados', flush=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (CACHE / 'elencos_relatorio.txt').write_text('\n'.join(rel) + '\n', encoding='utf-8')
    print('\n'.join(rel))

if __name__ == '__main__':
    main()

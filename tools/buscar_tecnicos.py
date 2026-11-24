#!/usr/bin/env python3
"""Pesquisa os técnicos reais dos times do jogo e grava src/data/tecnicos.json + fotos.

Formato: { "<jogo>": { "<time no jogo>": {"nick", "nome", "nat", "nasc", "foto": bool} } }
Fotos em public/fotos/staff/<jogo>/<chave>.webp (chave = nick sem acento/hífen).

Fontes:
  - lol:      Leaguepedia (Players com Role = Coach, do cache do buscar_elencos) + fotos locais do BrasLOL
              (D:/Projeto/BrasLOL/fotos_tecnicos, se existir) + PlayerImages da Leaguepedia
  - valorant: vlr.gg (página do time, item "head coach"/"coach")
  Os outros jogos não têm fonte aberta com técnico (siege.gg, prosettings e OpenDota não listam a comissão).

Uso: python tools/buscar_tecnicos.py lol valorant
"""
import io, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import buscar_fotos as bf
import buscar_elencos as be

SAIDA = be.DADOS / 'tecnicos.json'
FOTOS = bf.RAIZ / 'public' / 'fotos' / 'staff'
BRASLOL = Path('D:/Projeto/BrasLOL/fotos_tecnicos')
LOLX = json.loads((be.DADOS / 'lolx.json').read_text(encoding='utf-8'))
ISO3 = LOLX.get('iso', {})  # 'KOR' -> 'kr'

def nat3(c):
    if not c: return None
    c = str(c)
    return (ISO3.get(c) or (c.lower() if len(c) == 2 else None))

def salva_foto(g, nick, dados):
    d = FOTOS / g; d.mkdir(parents=True, exist_ok=True)
    bf.prepara(dados).save(d / f'{bf.chave(nick)}.webp', 'WEBP', quality=82)

def lol(rel):
    be.lol([])  # só para preencher be.PAGINA_LOL (usa o cache)
    import glob
    linhas = []
    for f in glob.glob(str(be.CACHE / '.cache_elencos_lol_rosters*.json')):
        linhas += json.loads(Path(f).read_text(encoding='utf-8'))
    coaches = {}
    for r in linhas:
        if r.get('Role') == 'Coach' and r.get('Team'): coaches.setdefault(r['Team'], {})[r['ID']] = r
    principal = {t: v[0] for t, v in LOLX.get('coach', {}).items()}  # técnico principal conhecido (BrasLOL)
    res = {}
    for t, pg in be.PAGINA_LOL.items():
        cs = list(coaches.get(pg, {}).values())
        if not cs: rel.append(f'[lol] ? {t}: sem técnico listado na Leaguepedia'); continue
        pref = principal.get(t)
        cs.sort(key=lambda r: (r['ID'] != pref, r['ID'].lower()))
        r = cs[0]
        res[t] = {'nick': r['ID'], 'nome': r.get('Name') or None, 'nat': be.iso(r.get('Country')) or be.iso(r.get('Nationality')),
                  'nasc': r.get('Birthdate') or None, 'pagina': pg}
    # fotos: BrasLOL local primeiro, depois Leaguepedia
    falta = []
    for t, c in res.items():
        loc = BRASLOL / f"{bf.chave(c['nick'])}.png"
        if (FOTOS / 'lol' / f"{bf.chave(c['nick'])}.webp").exists(): c['foto'] = True
        elif loc.exists(): salva_foto('lol', c['nick'], loc.read_bytes()); c['foto'] = True
        else: falta.append((c['nick'], c['pagina']))
    if falta:
        try:
            urls = bf.urls_leaguepedia('lol', falta)
        except Exception as e:
            urls = {}; rel.append(f'[lol] fotos da Leaguepedia falharam: {e}')
        for t, c in res.items():
            u = urls.get(bf.chave(c['nick']))
            if c.get('foto') or not u: continue
            try: salva_foto('lol', c['nick'], bf.baixa_imagem(u[0], 1.0, u[1])); c['foto'] = True
            except Exception as e: rel.append(f'[lol] foto de {c["nick"]}: {e}')
    for c in res.values(): c.pop('pagina', None)
    return res

def valorant(rel):
    times = json.loads((be.CACHE / '.cache_elencos_valorant_ranking.json').read_text(encoding='utf-8'))
    res = {}
    for t in be.dados_atuais('valorant'):
        nome = be.casa_nome(t, times)
        if not nome: continue
        def staff(url=times[nome]):
            h = be.pagina(be.VLR + url) or ''
            out = []
            for it in re.split(r'class="team-roster-item"', h)[1:]:
                papel = re.search(r'team-roster-item-name-role[^>]*>\s*([^<]+?)\s*<', it)
                if not papel or 'coach' not in papel.group(1).lower(): continue
                nick = re.search(r'team-roster-item-name-alias">\s*(?:<i[^>]*></i>)?\s*([^<]+?)\s*<', it)
                if not nick: continue
                nat = re.search(r'flag mod-([a-z]{2})', it)
                real = re.search(r'team-roster-item-name-real">\s*([^<]+?)\s*<', it)
                img = re.search(r'<img src="([^"]+)"', it)
                out.append({'papel': papel.group(1).strip().lower(), 'nick': be._html.unescape(nick.group(1)),
                            'nat': nat.group(1) if nat else None, 'nome': be._html.unescape(real.group(1)) if real else None,
                            'img': ('https:' + img.group(1)) if img and img.group(1).startswith('//') else (img.group(1) if img else None)})
            return out
        cs = be.cache_json(f'tecnicos_valorant_{bf.slug(t)}', staff)
        if not cs: rel.append(f'[valorant] ? {t}: sem técnico no vlr.gg'); continue
        cs.sort(key=lambda c: (c['papel'] not in ('head coach', 'coach'), c['papel']))
        c = cs[0]
        info = be.prosettings_info(c['nick'], 'VALORANT') if False else {}
        res[t] = {'nick': c['nick'], 'nome': c['nome'], 'nat': c['nat'], 'nasc': info.get('nasc')}
        img = c.get('img') or ''
        if img and 'base/ph/sil' not in img and img.startswith('http'):
            try: salva_foto('valorant', c['nick'], bf.baixa_imagem(img, 1.0, be.VLR + times[nome])); res[t]['foto'] = True
            except Exception as e: rel.append(f'[valorant] foto de {c["nick"]}: {e}')
    return res

FONTES = {'lol': lol, 'valorant': valorant}

def main():
    jogos = [a for a in sys.argv[1:] if not a.startswith('--')] or list(FONTES)
    saida = json.loads(SAIDA.read_text(encoding='utf-8')) if SAIDA.exists() else {}
    rel = []
    for g in jogos:
        if g not in FONTES: rel.append(f'[{g}] sem fonte aberta com técnicos'); continue
        print(f'[{g}] pesquisando…', flush=True)
        saida[g] = FONTES[g](rel)
        rel.append(f'[{g}] {len(saida[g])} técnicos, {sum(1 for c in saida[g].values() if c.get("foto"))} com foto')
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('\n'.join(rel))

if __name__ == '__main__':
    main()

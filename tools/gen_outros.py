#!/usr/bin/env python3
"""Gera js/data/outros.js: ligas dos outros jogos (CS2, Dota 2, Valorant, Free Fire, R6, EA FC, Wild Rift).
Nomes de organizações são reais (aprox.); jogadores (nicks, notas, idades) são GERADOS e fictícios, com semente fixa.
Uso: python3 tools/gen_outros.py js/data/outros.js"""
import json, random, sys
out = sys.argv[1]
ROLES = {'cs2': ['IGL','AWP','ENT','LUR','SUP'], 'dota2': ['POS1','POS2','POS3','POS4','POS5'], 'valorant': ['DUE','INI','CTR','SEN','FLX'],
         'ff': ['IGL','RUSH','SNP','SUP'], 'r6': ['ENT','FLX','ANC','ROM','SUP'], 'fifa': ['JOG'], 'wr': ['TOP','JNG','MID','ADC','SUP']}
# (chave, nome da liga, região, T1 (8), T2 (7))
L = {
 'cs2': [('AM','Américas','Américas','FURIA,paiN Gaming,MIBR,Imperial,Fluxo,Team Liquid,NRG,9z Team','Legacy,RED Canids,Sharks Esports,Case Esports,Keyd Stars,Isurus,ODDIK'),
         ('EU','Europa','Europa','Vitality,NAVI,FaZe Clan,G2 Esports,Team Spirit,MOUZ,Falcons,Heroic','Astralis,BIG,Eternal Fire,GamerLegion,Ninjas in Pyjamas,Apeks,ENCE'),
         ('AP','Ásia-Pacífico','Ásia-Pacífico','The MongolZ,TYLOO,Lynn Vision,Rare Atom,Ground Zero,Rooster,ORDER,Grayhound','Chinggis Warriors,Wildcard,Divine,Paradox,Bad News Eagles,TeamOne,Renegades')],
 'dota2': [('SA','Am. do Sul','América do Sul','Heroic,paiN Gaming,Wildcard,beastcoast,Infinity,Thunder Predator,RED Canids,Team Waska','Furia Dota,Leviatán,Yawara,Gaimin SA,Elevate,Case Esports,Keyd Stars'),
           ('EU','Europa/CEI','Europa e CEI','Team Spirit,Team Liquid,Tundra Esports,Gaimin Gladiators,BetBoom Team,Falcons,PARIVISION,Aurora','Nigma Galaxy,OG,Entity,Natus Vincere,1w Team,Team Secret,Cloud9'),
           ('AS','China/SEA','China e Sudeste Asiático','Xtreme Gaming,Team Tidebound,Azure Ray,Talon Esports,BOOM Esports,Team Nemesis,Aster,Vici Gaming','Execration,Geek Fam,Rex Regum Qeon,Invictus Gaming,EHOME,Team SMG,Neon Esports')],
 'valorant': [('AM','VCT Américas','Américas','LOUD,FURIA,MIBR,Leviatán,Sentinels,100 Thieves,Cloud9,NRG','KRÜ Esports,Evil Geniuses,ENVY,Shopify Rebellion,Oxygen Esports,Sharks Esports,2Game'),
              ('EM','VCT EMEA','EMEA','Fnatic,Team Heretics,Team Vitality,Karmine Corp,FUT Esports,Team Liquid,BBL Esports,Gentle Mates','Natus Vincere,Apeks,GIANTX,Movistar KOI,ULF Esports,Eternal Fire,Futbolist'),
              ('PC','VCT Pacífico','Pacífico','Paper Rex,DRX,T1,Gen.G,Rex Regum Qeon,Talon Esports,Team Secret,ZETA DIVISION','DetonatioN FocusMe,Global Esports,BOOM Esports,FULL SENSE,Nongshim RedForce,Bleed Esports,Sengoku Gaming')],
 'ff': [('BR','Brasil','Brasil','LOUD,Corinthians,Fluxo,Vivo Keyd Stars,FURIA,Black Dragons,Team Liquid,Los Grandes','Flamengo,RED Canids,INTZ,paiN Gaming,Sharks Esports,KaBuM!,Vasco'),
        ('LA','América Latina','América Latina','Rebirth Esports,Dynamo,Cloud9 LATAM,Nova Esports,Infinity,Furious Gaming,Thunder Predator,Isurus','Tigres,Vorax,Estral,Leviatán,Marcos Gaming,Pixel Esports,Gaimin LATAM'),
        ('SE','Sudeste Asiático','Sudeste Asiático','EVOS Esports,Todak,Bigetron,ONIC Esports,Rex Regum Qeon,Alter Ego,Team Secret,Buriram United','Vampire Esports,Geek Fam,Talon Esports,Fire Flux,Habibi,Phoenix Force,Ghost')],
 'r6': [('AM','Américas','Américas','FaZe Clan,FURIA,Team Liquid,DarkZero Esports,Shopify Rebellion,M80,100 Thieves,LOUD','Fluxo W7M,Wildcard Gaming,Spacestation,Cloud9,Black Dragons,INTZ,Los Grandes'),
        ('EU','Europa/MENA','Europa e MENA','G2 Esports,Team BDS,Team Secret,Falcons,Virtus.pro,Heroic,Natus Vincere,Gentle Mates','Fnatic,Team Heretics,Twisted Minds,Geekay Esports,Shifters,Movistar KOI,Vitality'),
        ('AP','Ásia-Pacífico','Ásia-Pacífico','Team Falcons APAC,Rex Regum Qeon,Talon Esports,Nongshim,Alpha Esports,ZETA DIVISION,Burmese Ghouls,Alter Ego','Detonation,DeToNator,Wildcard,Bleed Esports,Geek Fam,Team Flash,Sengoku')],
 'fifa': ['JOG'], 'wr': ['TOP','JNG','MID','ADC','SUP']}
# (chave, nome da liga, região, T1 (8), T2 (7))
L = {
 'cs2': [('AM','Américas','Américas','FURIA,paiN Gaming,MIBR,Imperial,Fluxo,Team Liquid,NRG,9z Team','Legacy,RED Canids,Sharks Esports,Case Esports,Keyd Stars,Isurus,ODDIK'),
         ('EU','Europa','Europa','Vitality,NAVI,FaZe Clan,G2 Esports,Team Spirit,MOUZ,Falcons,Heroic','Astralis,BIG,Eternal Fire,GamerLegion,Ninjas in Pyjamas,Apeks,ENCE'),
         ('AP','Ásia-Pacífico','Ásia-Pacífico','The MongolZ,TYLOO,Lynn Vision,Rare Atom,Ground Zero,Rooster,ORDER,Grayhound','Chinggis Warriors,Wildcard,Divine,Paradox,Bad News Eagles,TeamOne,Renegades')],
 'dota2': [('SA','Am. do Sul','América do Sul','Heroic,paiN Gaming,Wildcard,beastcoast,Infinity,Thunder Predator,RED Canids,Team Waska','Furia Dota,Leviatán,Yawara,Gaimin SA,Elevate,Case Esports,Keyd Stars'),
           ('EU','Europa/CEI','Europa e CEI','Team Spirit,Team Liquid,Tundra Esports,Gaimin Gladiators,BetBoom Team,Falcons,PARIVISION,Aurora','Nigma Galaxy,OG,Entity,Natus Vincere,1w Team,Team Secret,Cloud9'),
           ('AS','China/SEA','China e Sudeste Asiático','Xtreme Gaming,Team Tidebound,Azure Ray,Talon Esports,BOOM Esports,Team Nemesis,Aster,Vici Gaming','Execration,Geek Fam,Rex Regum Qeon,Invictus Gaming,EHOME,Team SMG,Neon Esports')],
 'valorant': [('AM','VCT Américas','Américas','LOUD,FURIA,MIBR,Leviatán,Sentinels,100 Thieves,Cloud9,NRG','KRÜ Esports,Evil Geniuses,ENVY,Shopify Rebellion,Oxygen Esports,Sharks Esports,2Game'),
              ('EM','VCT EMEA','EMEA','Fnatic,Team Heretics,Team Vitality,Karmine Corp,FUT Esports,Team Liquid,BBL Esports,Gentle Mates','Natus Vincere,Apeks,GIANTX,Movistar KOI,ULF Esports,Eternal Fire,Futbolist'),
              ('PC','VCT Pacífico','Pacífico','Paper Rex,DRX,T1,Gen.G,Rex Regum Qeon,Talon Esports,Team Secret,ZETA DIVISION','DetonatioN FocusMe,Global Esports,BOOM Esports,FULL SENSE,Nongshim RedForce,Bleed Esports,Sengoku Gaming')],
 'ff': [('BR','Brasil','Brasil','LOUD,Corinthians,Fluxo,Vivo Keyd Stars,FURIA,Black Dragons,Team Liquid,Los Grandes','Flamengo,RED Canids,INTZ,paiN Gaming,Sharks Esports,KaBuM!,Vasco'),
        ('LA','América Latina','América Latina','Rebirth Esports,Dynamo,Cloud9 LATAM,Nova Esports,Infinity,Furious Gaming,Thunder Predator,Isurus','Tigres,Vorax,Estral,Leviatán,Marcos Gaming,Pixel Esports,Gaimin LATAM'),
        ('SE','Sudeste Asiático','Sudeste Asiático','EVOS Esports,Todak,Bigetron,ONIC Esports,Rex Regum Qeon,Alter Ego,Team Secret,Buriram United','Vampire Esports,Geek Fam,Talon Esports,Fire Flux,Habibi,Phoenix Force,Ghost')],
 'r6': [('AM','Américas','Américas','w7m esports,FURIA,Team Liquid,Oxygen Esports,Wolves Esports,Elevate,Soniqs,M80','Black Dragons,Los Grandes,Nova Esports,Ninjas in Pyjamas,Dignitas,Spacestation,Cloud9'),
        ('EU','Europa','Europa','G2 Esports,Team BDS,FaZe Clan,Falcons,Virtus.pro,Heroic,Natus Vincere,Gentle Mates','Team Secret,Rebels Gaming,Movistar KOI,Vitality,MNM Gaming,Evil Geniuses,Fnatic'),
        ('AP','Ásia-Pacífico','Ásia-Pacífico','Team Falcons APAC,Rex Regum Qeon,Talon Esports,Nongshim,Alpha Esports,ZETA DIVISION,Burmese Ghouls,Alter Ego','Detonation,DeToNator,Wildcard,Bleed Esports,Geek Fam,Team Flash,Sengoku')],
 'fifa': [('BR','Brasil','Brasil','Flamengo,Corinthians,FURIA,paiN Gaming,LOUD,Fluxo,Vasco,Palmeiras','Santos,São Paulo,Grêmio,Cruzeiro,Athletico,Sharks Esports,Keyd Stars'),
          ('EU','Europa','Europa','Team Falcons,Team Vitality,G2 Esports,Fnatic,Karmine Corp,Heroic,Gentle Mates,Alpine','Eintracht,Wolfsburg,Sevilla,Real Betis,Ajax,Rennes,Benfica'),
          ('GL','Global','Global','FC Barcelona,Manchester City,PSG,Inter,LAFC,Al-Hilal,Flamengo Global,Boca Juniors','Corinthians Global,River Plate,Galatasaray,Celtic,Cruz Azul,Seattle Sounders,Urawa')],
 'wr': [('BR','Brasil','Brasil','LOUD,paiN Gaming,FURIA,RED Canids,INTZ,KaBuM!,Los Grandes,Netshoes Miners','Flamengo,Fluxo,Vivo Keyd Stars,Black Dragons,Corinthians,Sharks Esports,Team Liquid'),
        ('AS','Ásia','Ásia','Team Flash,SBTC Esports,Burmese Ghouls,Saigon Phantom,Talon Esports,Rex Regum Qeon,Alter Ego,Gen.G','Vikings,Hanwha Life,Dplus,ONIC Esports,EVOS Esports,Bigetron,Geek Fam'),
        ('EU','Europa/Américas','Europa e Américas','Fnatic,Team Heretics,Karmine Corp,Cloud9,Dignitas,Team Liquid Wild,100 Thieves Wild,Gentle Mates','Misfits,Excel,Rebels,Sentinels,Evil Geniuses,NRG,Shopify Rebellion')],
}
# bolsas internacionais: (nome1, nome2) por jogo; vagas por região (somam 8 e 16)
INTL = {'cs2': ('IEM Major', 'Mundial CS2'), 'dota2': ('The International Qualifiers', 'The International'), 'valorant': ('Masters', 'Champions'),
        'ff': ('Free Fire World Series', 'Free Fire Mundial'), 'r6': ('Six Invitational', 'Mundial R6'), 'fifa': ('FC Pro Open', 'FC Pro Mundial'), 'wr': ('Wild Rift Icons', 'Wild Rift Mundial')}
VAG1, VAG2 = (3, 3, 2), (6, 6, 4)
SYL = ['ka','ro','zi','le','mo','tu','vex','dra','ni','sho','bal','tor','xe','pa','ru','fu','gi','lo','ze','ky','na','do','mi','sa','vo','jin','rex','blu','cri','pho','tek','lum','zor','hex','ori','ax']
SUF = ['', '', '', 'x', 'z', 'o', 'y', '1', '7', 'ii', 'zz']
def nick(r, usados):
    while True:
        n = ''.join(r.choice(SYL) for _ in range(r.choice([2, 2, 3]))) + r.choice(SUF)
        n = n.capitalize() if r.random() < .5 else n
        if n not in usados: usados.add(n); return n
# Elencos REAIS (R6, Year 11, confirmados em SiegeGG/Ubisoft/100T). Nota = f(ranking SiegeGG Top 20 do Year 10) ou tier do time; idade em branco.
# Funções (ENT..SUP) seguem a ordem listada: NÃO são as funções reais.
SGG20 = ['Handyy','Noa','jume','Stompn','Jv92','Paluh','Kanzen','Shaiiko','Cyber','Dodez','Hotancold','dfuzr','Ambi','Gunnar','Reeps96','Solotov','Loira','Kheyze','FelipoX','Adrian']
# CS2: elencos de nov/2026 (HLTV, ranking Valve de 2/11/2026, clutchking.gg). Nota: top do HLTV Top 20 de 2025 (ZywOo 1º, ropz 3º, mezii 5º, flameZ 7º, NiKo 18º) ou tier do time.
HLTV20 = {'ZywOo': 95, 'ropz': 92, 'mezii': 90, 'flameZ': 89, 'NiKo': 84}
REAL = {'cs2': {'MOUZ': ['torzsi','xertioN','Spinx','xelex','PR'], 'Vitality': ['apEX','ZywOo','flameZ','mezii','ropz'],
  'FURIA': ['FalleN','yuurih','YEKINDAR','KSCERATO','molodoy'], 'Team Spirit': ['donk','magixx','sh1ro','tN1R','zont1x'],
  'Falcons': ['karrigan','kyousuke','m0NESY','NiKo','TeSeS'],
  '9z Team': ['max','HUASOPEEK','luchov','meyern','dgt'], 'paiN Gaming': ['vsm','biguzera','piriajr','snow','saffee'],
  'The MongolZ': ['bLitz','Techno','mzinho','910','cobrazera'], 'Astralis': ['HooXi','phzy','jabbi','Staehr','ryu'],
  'NAVI': ['Aleksib','b1t','iM','w0nderful','makazze'], 'Heroic': ['nilo','susp','Chr1zN','MartinezSa','Brollan'],
  'FaZe Clan': ['Twistzz','JBOEN','frozen','jcobbb','Neityu'], 'G2 Esports': ['huNter-','NertZ','r1nkle','HeavyGod','MATYS'],
  'Team Liquid': ['EliGE','NAF','JT','malbsMd','Jorko'], 'MIBR': ['brnz4n','insani','nqz','LNZ','venomzera']},
 'dota2': {'Team Spirit': ['Yatoro','Larl','Collapse','not_me','rue'], 'Aurora': ['Nightfall','Mikoto','Ws','Mira','kaori'],
  'BetBoom Team': ['Kiritych','gpk','MieRo','Save-','Kataomi'], 'Team Liquid': ['m1CKe','Nisha','Ace','Boxi','tOfu']},
 'valorant': {'100 Thieves': ['Asuna','Timotino','vora','bang','Cryo'], 'LOUD': ['DaviH','lukxo','erde','Darker','tkzin'],
  'NRG': ['skuba','brawk','Ethan','mada','keiko'], 'Karmine Corp': ['LewN','dos9','Avez','SUYGETSU','N4RRATE'], 'Nongshim RedForce': ['Ivy','Rb','Francis','Xross','Dambi'],
  'Paper Rex': ['something','f0rsakeN','d4v41','Jinggg','invy'], 'T1': ['Meteor','stax','Munchkin','iZu','BuZz'],
  'BBL Esports': ['Rosé','Crewen','Lar0k','Loita','lovers rock']},
 'r6': {'FaZe Clan': ['Cyber','soulz1','KDS','Handyy','VITAKING'], 'FURIA': ['HerdsZ','Loira','DiasLucas','volpz','Bokzera'],
  'Team Liquid': ['Kheyze','FelipoX','Nade','Maia','Jv92'], 'LOUD': ['resetz','stemp','Gabu7z','live','Flastry'],
  'DarkZero Esports': ['Fultz','Kyno','njr','J9O','Nuers'], '100 Thieves': ['Hotancold','GMZ','SpiriTz','Atom','Kason'],
  'Cloud9': ['Centir','Focal','Ewzy','Eddy','Kixhro']}}
# EA FC: pros reais do circuito FC Pro 2026 (EA/FUTWIZ/Red Bull). Nota por ranking mundial quando citado; sem time real (as orgs da liga são fictícias para este jogo).
FC_RANK = {'Levi de Weerd': 6, 'GuiBarros': 7, 'Tekkz': 12, 'Umut': 21, 'LJR Peixoto': 23, 'HHezerS': 24, 'Yaskow': 49, 'Lukas': 62, 'AnasBadr': 70, 'tuga810': 81}
FC_PROS = ['Vejrgang','ManuBachoore','PHzin','nicolas99fc','Levi de Weerd','GuiBarros','Tekkz','Jafonso','Umut','Emre Yilmaz','Obrun','Yuval','Brice','LJR Peixoto','HHezerS','AboFawzi','The 1OS','Karimisbak','MarwanMC9','Bonanno','Yaskow','Lukas','AlihanLion','Darkley11','Nassada','Stingray','Caccia','Exeed','GugaFerrez','AnasBadr','tuga810']
_fc = iter(FC_PROS)
def real_time(g, nm, base):
    ps = []
    for k, n in enumerate(REAL[g][nm]):
        o = HLTV20[n] if g == 'cs2' and n in HLTV20 else round(92 - SGG20.index(n) * 0.8) if n in SGG20 else max(55, min(90, round(base - 4 - k * 0.5)))
        ps.append([n, o, None])
    return {'n': nm, 'p': ps}
res = {}
for gi, (g, regs) in enumerate(L.items()):
    r = random.Random(1000 + gi); used = set(); lig = {}
    for key, nome, regiao, t1, t2 in regs:
        def time(nm, base):
            if nm in REAL.get(g, {}): return real_time(g, nm, base)
            if g == 'fifa':
                n = next(_fc, None)
                if n: return {'n': nm, 'p': [[n, round(92 - (FC_RANK[n] - 1) * 0.25) if n in FC_RANK else max(60, min(90, round(base + 2))), None]]}
            return {'n': nm, 'p': [[nick(r, used), max(55, min(90, round(base + r.uniform(-4, 4)))), r.randint(17, 30)] for _ in ROLES[g]]}
        a = t1.split(','); b = t2.split(',')
        assert len(set(a + b)) == 15, (g, key)
        # nenhum nome repetido na mesma liga; força decrescente por posição + ruído
        lig[key] = {'nome': nome, 'regiao': regiao, 't1': [time(n, 80 - i * 1.2 + r.uniform(-1.5, 1.5)) for i, n in enumerate(a)], 't2': [time(n, 70 - i * 1.0 + r.uniform(-1.5, 1.5)) for i, n in enumerate(b)]}
    ks = list(lig)
    n1, n2 = INTL[g]
    res[g] = {'roles': ROLES[g], 'inicio': ks[0], 'leagues': lig,
              'intl': {'A': {'nome': n1, 'bolsa': 600000, 'rep': 0.3, 'semanas': 3, 'vagas': dict(zip(ks, VAG1))},
                       'B': {'nome': n2, 'bolsa': 1500000, 'rep': 0.6, 'semanas': 4, 'vagas': dict(zip(ks, VAG2))}}}
open(out, 'w', encoding='utf8').write('/* Dados dos outros jogos (tools/gen_outros.py). Orgs reais; jogadores GERADOS (fictícios). Jogador = [nick, nota, idade]. */\nwindow.DATA=' + json.dumps(res, ensure_ascii=False, separators=(',', ':')) + ';\n')
print({g: sum(len(l['t1']) + len(l['t2']) for l in v['leagues'].values()) for g, v in res.items()})

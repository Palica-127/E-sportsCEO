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
 'cs2': [('AM','Américas','Américas','FURIA,paiN Gaming,MIBR,Imperial,DENDELE,Team Liquid,NRG,9z Team','Legacy,RED Canids,Sharks Esports,Case Esports,Keyd Stars,Isurus,ODDIK'),
         ('EU','Europa','Europa','MOUZ,Vitality,Team Spirit,Aurora,Falcons,FUT,NAVI,G2 Esports','FaZe Clan,Astralis,Heroic,Eternal Fire,GamerLegion,Ninjas in Pyjamas,ENCE'),
         ('AP','Ásia-Pacífico','Ásia-Pacífico','The MongolZ,TYLOO,Lynn Vision,Rare Atom,Ground Zero,Rooster,ORDER,Grayhound','Chinggis Warriors,Wildcard,Divine,Paradox,Bad News Eagles,TeamOne,Renegades')],
 'dota2': [('SA','Am. do Sul','América do Sul','Heroic,paiN Gaming,Wildcard,beastcoast,Infinity,Thunder Predator,RED Canids,Team Waska','Furia Dota,Leviatán,Yawara,Gaimin SA,Elevate,Case Esports,Keyd Stars'),
           ('EU','Europa/CEI','Europa e CEI','Team Spirit,Team Liquid,1w Team,Team Yandex,BetBoom Team,LGD Gaming,PARIVISION,Aurora','Nigma Galaxy,OG,Entity,Natus Vincere,Gaimin Gladiators,Team Secret,Cloud9'),
           ('AS','China/SEA','China e Sudeste Asiático','Xtreme Gaming,Team Tidebound,Azure Ray,Talon Esports,BOOM Esports,Team Nemesis,Aster,Vici Gaming','Execration,Geek Fam,Rex Regum Qeon,Invictus Gaming,EHOME,Team SMG,Neon Esports')],
 'valorant': [('AM','VCT Américas','Américas','LOUD,FURIA,MIBR,Leviatán,Sentinels,100 Thieves,G2 Esports,NRG','KRÜ Esports,Cloud9,ENVY,Shopify Rebellion,Oxygen Esports,Sharks Esports,2Game'),
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
 'cs2': [('AM','Américas','Américas','FURIA,paiN Gaming,MIBR,Imperial,DENDELE,Team Liquid,NRG,9z Team','Legacy,RED Canids,Sharks Esports,Case Esports,Keyd Stars,Isurus,ODDIK'),
         ('EU','Europa','Europa','MOUZ,Vitality,Team Spirit,Aurora,Falcons,FUT,NAVI,G2 Esports','FaZe Clan,Astralis,Heroic,Eternal Fire,GamerLegion,Ninjas in Pyjamas,ENCE'),
         ('AP','Ásia-Pacífico','Ásia-Pacífico','The MongolZ,TYLOO,Lynn Vision,Rare Atom,Ground Zero,Rooster,ORDER,Grayhound','Chinggis Warriors,Wildcard,Divine,Paradox,Bad News Eagles,TeamOne,Renegades')],
 'dota2': [('SA','Am. do Sul','América do Sul','Heroic,paiN Gaming,Wildcard,beastcoast,Infinity,Thunder Predator,RED Canids,Team Waska','Furia Dota,Leviatán,Yawara,Gaimin SA,Elevate,Case Esports,Keyd Stars'),
           ('EU','Europa/CEI','Europa e CEI','Team Spirit,Team Liquid,1w Team,Team Yandex,BetBoom Team,LGD Gaming,PARIVISION,Aurora','Nigma Galaxy,OG,Entity,Natus Vincere,Gaimin Gladiators,Team Secret,Cloud9'),
           ('AS','China/SEA','China e Sudeste Asiático','Xtreme Gaming,Team Tidebound,Azure Ray,Talon Esports,BOOM Esports,Team Nemesis,Aster,Vici Gaming','Execration,Geek Fam,Rex Regum Qeon,Invictus Gaming,EHOME,Team SMG,Neon Esports')],
 'valorant': [('AM','VCT Américas','Américas','LOUD,FURIA,MIBR,Leviatán,Sentinels,100 Thieves,G2 Esports,NRG','KRÜ Esports,Cloud9,ENVY,Shopify Rebellion,Oxygen Esports,Sharks Esports,2Game'),
              ('EM','VCT EMEA','EMEA','Fnatic,Team Heretics,Team Vitality,Karmine Corp,FUT Esports,Team Liquid,BBL Esports,Gentle Mates','Natus Vincere,Apeks,GIANTX,Movistar KOI,ULF Esports,Eternal Fire,Futbolist'),
              ('PC','VCT Pacífico','Pacífico','Paper Rex,DRX,T1,Gen.G,Rex Regum Qeon,Talon Esports,Team Secret,ZETA DIVISION','DetonatioN FocusMe,Global Esports,BOOM Esports,FULL SENSE,Nongshim RedForce,Bleed Esports,Sengoku Gaming')],
 'ff': [('BR','Brasil','Brasil','LOUD,Corinthians,Fluxo,Vivo Keyd Stars,FURIA,Black Dragons,Team Liquid,Los Grandes','Flamengo,RED Canids,INTZ,paiN Gaming,Sharks Esports,KaBuM!,Vasco'),
        ('LA','América Latina','América Latina','Rebirth Esports,Dynamo,Cloud9 LATAM,Nova Esports,Infinity,Furious Gaming,Thunder Predator,Isurus','Tigres,Vorax,Estral,Leviatán,Marcos Gaming,Pixel Esports,Gaimin LATAM'),
        ('SE','Sudeste Asiático','Sudeste Asiático','EVOS Esports,Todak,Bigetron,ONIC Esports,Rex Regum Qeon,Alter Ego,Team Secret,Buriram United','Vampire Esports,Geek Fam,Talon Esports,Fire Flux,Habibi,Phoenix Force,Ghost')],
 'r6': [('AM','Américas','Américas','Fluxo W7M,FURIA,Team Liquid,Oxygen Esports,Wolves Esports,Elevate,Soniqs,M80','Black Dragons,Los Grandes,Nova Esports,Ninjas in Pyjamas,Dignitas,Spacestation,Cloud9'),
        ('EU','Europa','Europa','G2 Esports,Team BDS,FaZe Clan,Falcons,Virtus.pro,Heroic,Natus Vincere,Gentle Mates','Team Secret,Rebels Gaming,Movistar KOI,Vitality,MNM Gaming,Evil Geniuses,Fnatic'),
        ('AP','Ásia-Pacífico','Ásia-Pacífico','Team Falcons APAC,Rex Regum Qeon,Talon Esports,Nongshim,Alpha Esports,ZETA DIVISION,Burmese Ghouls,Alter Ego','Detonation,DeToNator,Wildcard,Bleed Esports,Geek Fam,Team Flash,Sengoku')],
 'fifa': [('BR','Brasil','Brasil','Flamengo,Corinthians,FURIA,paiN Gaming,LOUD,Fluxo,Vasco,Palmeiras','Santos,São Paulo,Grêmio,Cruzeiro,Athletico,Sharks Esports,Keyd Stars'),
          ('EU','Europa','Europa','Team Falcons,Team BDS,G2 Esports,Fnatic,Karmine Corp,Heroic,Gentle Mates,Alpine','Eintracht,Wolfsburg,Sevilla,Real Betis,Ajax,Rennes,Benfica'),
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
  'The MongolZ': ['bLitz','Techno','nin9','910','cobrazera'], 'Astralis': ['phzy','siuhy','Staehr','ryu','cmtry'],
  'NAVI': ['Aleksib','b1t','iM','w0nderful','makazze'], 'Heroic': ['nilo','susp','Chr1zN','MartinezSa','Brollan'],
  'FaZe Clan': ['Twistzz','JBOEN','frozen','jcobbb','Neityu'], 'G2 Esports': ['huNter-','NertZ','r1nkle','HeavyGod','MATYS'],
  'Team Liquid': ['EliGE','NAF','JT','malbsMd','Jorko'], 'MIBR': ['tomaszin','insani','nqz','LNZ','venomzera'],
  'Aurora': ['XANTARES','woxic','Jimpphat','kyxsan','Wicadia'], 'FUT': ['SunPayus','xfl0ud','dem0n','Krabeni','dziugss'], 'Legacy': ['arT','dumau','latto','n1ssim','try'], 'DENDELE': ['WOOD7','Tuurtle','naitte','pesadelo','matios'],
  'NRG': ['nitr0','Sonic','Grim','Jeorge','hallzerk'], 'Imperial': ['chelo','VINI','decenty','noway','saadzin'],
  'Eternal Fire': ['MisteM','regali','soulfly','Kvem','jottAAA'], 'Ninjas in Pyjamas': ['stavn','sjuush','Krimbo','adamb','xKacpersky'],
  'GamerLegion': ['REZ','shalfey','Tauson','FL4MUS','hypex'], 'TYLOO': ['JamYoung','Jee','Mercury','Moseyuh','Zero'],
  'Lynn Vision': ['Westmelon','z4KR','Starry','EmiliaQAQ','C4LLM3SU3'], 'Rare Atom': ['Summer','kaze','ChildKing','L1haNg','3gl']},
 'dota2': {'Team Spirit': ['Yatoro','Larl','Batyuk','not_me','rue'], 'Aurora': ['skiter','Mikoto','Ws','Mira','kaori'],
  'BetBoom Team': ['Kiritych','gpk','MieRo','Save-','Kataomi'], 'Team Liquid': ['m1CKe','Malr1ne','Wisper','Boxi','tOfu'],
  '1w Team': ['Pure','bzm','33','Ari','Whitemon'], 'Xtreme Gaming': ['Ame','Xm','zeal','XinQ','BoBoKa']},
 'ff': {'LOUD': ['HAK','Nickz7','GUAXA7','Trap'], 'Fluxo': ['Giuh','Butzin','MT7','Bops']},
 'valorant': {'100 Thieves': ['Asuna','Timotino','vora','bang','Cryo'], 'LOUD': ['DaviH','basic','cortezia','Bati','cauanzin'],
  'NRG': ['zekken','eeiu','skuba','Ethan','mada'], 'Sentinels': ['johnqt','brawk','OXY','canezerra','keiko'], 'Leviatán': ['Neon','blowz','spikeziN','lukxo','erde'], 'Karmine Corp': ['LewN','dos9','Avez','SUYGETSU','N4RRATE'], 'Nongshim RedForce': ['Ivy','Rb','Francis','Xross','UdoTan'],
  'Paper Rex': ['something','f0rsakeN','PatMen','Primmie','invy'], 'T1': ['TenZ','crashies','iZu','stax','BuZz'],
  'BBL Esports': ['ComeBack','VenTT','oroni','Loita','Lar0k'],
  'Team Vitality': ['Sayonara','Jamppi','jawgemo','PROFEK','Chronicle'], 'G2 Esports': ['kiNgg','leaf','Sato','HYUNMIN','trent']},
 'r6': {'FaZe Clan': ['Cyber','soulz1','KDS','Handyy','VITAKING'], 'FURIA': ['HerdsZ','Loira','DiasLucas','volpz','Bokzera'],
  'Team Liquid': ['Kheyze','FelipoX','Nade','Maia','Jv92'], 'LOUD': ['resetz','stemp','Gabu7z','live','Flastry'],
  'DarkZero Esports': ['Fultz','Kyno','njr','J9O','Nuers'], '100 Thieves': ['Yoggah','GMZ','SpiriTz','Atom','Panbazou'],
  'Cloud9': ['Centir','Focal','Ewzy','Eddy','Kixhro'],
  'Fluxo W7M': ['L0BIN','Paluh','Dotz','Hatez','Fntzy'], 'Falcons': ['LikEfac','jume','Solotov','Yuzus','BriD'], 'G2 Esports': ['Stompn','Benjamaster','Shaiiko','Doki','Alem4o']}}
# EA FC: pros reais do circuito FC Pro 2026 (EA/FUTWIZ/Red Bull). Nota por ranking mundial quando citado; sem time real (as orgs da liga são fictícias para este jogo).
FC_RANK = {'Vejrgang': 1, 'RVPLegend': 2, 'Levi de Weerd': 9, 'GuiBarros': 14, 'Tekkz': 18, 'Umut': 21, 'LJR Peixoto': 23, 'HHezerS': 24, 'Yaskow': 49, 'Lukas': 62, 'AnasBadr': 70, 'tuga810': 81}
FC_PROS = ['RVPLegend','LevyFinn','Vejrgang','ManuBachoore','PHzin','nicolas99fc','Levi de Weerd','GuiBarros','Tekkz','Jafonso','Umut','Emre Yilmaz','Obrun','Yuval','Brice','LJR Peixoto','HHezerS','AboFawzi','The 1OS','Karimisbak','MarwanMC9','Bonanno','Yaskow','Lukas','AlihanLion','Darkley11','Nassada','Stingray','Caccia','Exeed','GugaFerraz','AnasBadr','tuga810']
# clubes reais (Liquipedia FC Pro 26 / Sportskeeda EWC 2026 / EA FC Pro); quem não tem fonte mantém o clube fictício
FC_CLUB = {'Vejrgang':'Team Falcons','ManuBachoore':'Team Liquid','PHzin':'Tuzzy Esports','Levi de Weerd':'Team Vitality','RVPLegend':'HYPERSPIRIT','GuiBarros':'RBLZ Gaming',
 'Tekkz':'RBLZ Gaming','Jafonso':'Man City Esports','Umut':'RBLZ Gaming','Emre Yilmaz':'Team Liquid','Obrun':'Exeed','Yuval':'Gaimin Gladiators',
 'Brice':'Team Vitality','LJR Peixoto':'Twisted Minds','AboFawzi':'Twisted Minds','Nassada':'SC Freiburg'}
_fcn = {}
# liga de cada pro pelo clube real (EU = clubes europeus; BR = pros brasileiros sem clube europeu; GL = resto)
_pref = {'EU': ['RVPLegend','LevyFinn','Vejrgang','ManuBachoore','Levi de Weerd','Emre Yilmaz','Umut','Tekkz','GuiBarros','Brice','Nassada','Jafonso','Yuval','Obrun'],
         'GL': ['LJR Peixoto','AboFawzi','PHzin'],
         'BR': ['nicolas99fc','GugaFerraz','Darkley11','Caccia']}
_rest = [x for x in FC_PROS if not any(x in v for v in _pref.values())]
_q = {k: list(v) for k, v in _pref.items()}
for _i, _x in enumerate(_rest): _q[('BR', 'EU', 'GL')[_i % 3]].append(_x)
_fq = {k: iter(v) for k, v in _q.items()}
# Nacionalidades (ISO2) só onde a fonte ou o nome do jogador deixam claro; o resto fica em branco.
NAC = {}
def _n(iso, *nicks):
    for n in nicks: NAC[n] = iso
_n('FR','apEX','ZywOo','Neityu'); _n('IL','flameZ','xertioN','HeavyGod','NertZ'); _n('GB','mezii','Tekkz'); _n('EE','ropz')
_n('BR','FalleN','yuurih','KSCERATO','vsm','biguzera','piriajr','snow','brnz4n','insani','nqz','LNZ','venomzera','DaviH','lukxo','tkzin','HerdsZ','Loira','DiasLucas','volpz','Bokzera','resetz','stemp','Gabu7z','live','Flastry','PHzin','GuiBarros','LJR Peixoto')
_n('KZ','molodoy'); _n('LV','YEKINDAR'); _n('RU','donk','sh1ro','magixx','m0NESY','Collapse'); _n('UA','zont1x','b1t','w0nderful','r1nkle','Yatoro')
_n('BA','NiKo','huNter-'); _n('DK','karrigan','TeSeS','HooXi','jabbi','Staehr','Chr1zN','Vejrgang','JBOEN'); _n('FI','Aleksib'); _n('RO','iM')
_n('SE','nilo','susp','Brollan'); _n('ES','MartinezSa'); _n('CA','Twistzz','NAF'); _n('SK','frozen','MATYS'); _n('PL','jcobbb')
_n('US','EliGE','Asuna','vora','bang','Cryo','skuba','brawk','Ethan','mada'); _n('ZA','JT'); _n('GT','malbsMd'); _n('BG','Jorko'); _n('HU','torzsi'); _n('CZ','Spinx')
_n('UY','max','dgt'); _n('CL','HUASOPEEK'); _n('AR','luchov','meyern','tomaszin'); _n('AR','try'); _n('US','nitr0','Grim','Jeorge'); _n('ZA','Sonic','MisteM'); _n('NO','hallzerk'); _n('BR','chelo','VINI','decenty','noway','saadzin'); _n('RO','regali'); _n('TR','soulfly','jottAAA'); _n('UA','Kvem'); _n('DK','stavn','sjuush'); _n('DE','Krimbo'); _n('SE','adamb'); _n('PL','xKacpersky'); _n('MN','nin9'); _n('NL','Levi de Weerd','ManuBachoore','Emre Yilmaz'); _n('RO','RVPLegend'); _n('DE','LevyFinn','Umut'); _n('GB','Tekkz'); _n('AR','nicolas99fc'); _n('IT','HHezerS'); _n('BR','GuiBarros','GugaFerraz'); _n('DK','Vejrgang'); _n('BR','HAK','Nickz7','GUAXA7','Trap','Giuh','Butzin','MT7','Bops'); _n('BR','lukxo','erde','DaviH','spikeziN','blowz'); _n('CA','TenZ'); _n('FI','Jamppi'); _n('RU','Chronicle'); _n('UA','Yatoro','Mira','Batyuk'); _n('SK','skiter'); _n('ID','Mikoto'); _n('MY','Ws','zeal'); _n('RU','Malr1ne','Larl','not_me','Pure'); _n('IL','33'); _n('CN','Ame','Xm','XinQ','BoBoKa'); _n('CN','JamYoung','Jee','Mercury','Moseyuh','Zero','Westmelon','z4KR','Starry','EmiliaQAQ','C4LLM3SU3','Summer','ChildKing','L1haNg','3gl'); _n('MY','kaze'); _n('RU','sh1ro','magixx','donk'); _n('BY','tN1R'); _n('LV','YEKINDAR'); _n('IL','flameZ'); _n('EE','ropz'); _n('FI','Aleksib'); _n('UA','b1t','w0nderful'); _n('BR','WOOD7','Tuurtle','naitte','pesadelo','matios','L0BIN','Paluh','Dotz','Hatez','Fntzy','Alem4o'); _n('FR','LikEfac','BriD'); _n('DE','jume'); _n('TR','Solotov'); _n('GB','Yuzus','Doki'); _n('US','Stompn'); _n('DK','Benjamaster'); _n('PL','siuhy'); _n('UA','cmtry'); _n('LT','ryu','dziugss'); _n('SE','phzy'); _n('BR','arT','dumau','latto','n1ssim'); _n('TR','XANTARES','woxic','xfl0ud'); _n('FI','Jimpphat','Derke','Jamppi'); _n('ES','SunPayus'); _n('RU','Chronicle'); _n('US','valyn','trent','leaf'); _n('MN','bLitz','Techno','mzinho','910','cobrazera')
_n('KR','Meteor','stax','Munchkin','iZu','BuZz','Ivy','Rb','Francis','Xross','Dambi'); _n('RU','something'); _n('ID','f0rsakeN'); _n('MY','d4v41'); _n('SG','Jinggg')
_n('TR','Rosé','Crewen','Lar0k','Loita','lovers rock'); _n('NL','ManuBachoore','Levi de Weerd'); _n('PT','Jafonso')
# idades em 20/11/2026 só com data de nascimento conferida (ZywOo 09/11/2000, donk 25/01/2007, NiKo 16/02/1997, yuurih 22/12/1999)
AGE = {'ZywOo': 26, 'donk': 19, 'NiKo': 29, 'yuurih': 26, 'FalleN': 35, 'Vejrgang': 20, 'Levi de Weerd': 22, 'HAK': 24, 'Bops': 21, 'Butzin': 21, 'Giuh': 20, 'MT7': 20, 'Ame': 29, 'karrigan': 36, 'Hatez': 23, 'Fntzy': 23, 'Paluh': 26, 'Dotz': 25, 'L0BIN': 24}
def real_time(g, nm, base):
    ps = []
    for k, n in enumerate(REAL[g][nm]):
        o = HLTV20[n] if g == 'cs2' and n in HLTV20 else round(92 - SGG20.index(n) * 0.8) if n in SGG20 else max(55, min(90, round(base - 4 - k * 0.5)))
        ps.append([n, o, AGE.get(n), NAC[n]] if n in NAC else [n, o, AGE.get(n)])
    return {'n': nm, 'p': ps}
res = {}
for gi, (g, regs) in enumerate(L.items()):
    r = random.Random(1000 + gi); used = set(); lig = {}
    for key, nome, regiao, t1, t2 in regs:
        def time(nm, base):
            if nm in REAL.get(g, {}): return real_time(g, nm, base)
            if g == 'fifa':
                n = next(_fq[key], None)
                if n:
                    if n in FC_CLUB:
                        c = FC_CLUB[n]; _fcn[c] = _fcn.get(c, 0) + 1
                        nm = c if _fcn[c] == 1 else c + ' ' + 'I' * _fcn[c]
                    return {'n': nm, 'p': [[n, round(92 - (FC_RANK[n] - 1) * 0.25) if n in FC_RANK else max(60, min(90, round(base + 2))), AGE.get(n)] + ([NAC[n]] if n in NAC else [])]}
            return {'n': nm, 'p': [[nick(r, used), max(55, min(90, round(base + r.uniform(-4, 4)))), r.randint(17, 30)] for _ in ROLES[g]]}
        a = t1.split(','); b = t2.split(',')
        assert len(set(a + b)) == 15, (g, key)
        # nenhum nome repetido na mesma liga; força decrescente por posição + ruído
        lig[key] = {'nome': nome, 'regiao': regiao, 't1': [time(n, 80 - i * 1.2 + r.uniform(-1.5, 1.5)) for i, n in enumerate(a)], 't2': [time(n, 70 - i * 1.0 + r.uniform(-1.5, 1.5)) for i, n in enumerate(b)]}
    ks = list(lig)
    n1, n2 = INTL[g]
    res[g] = {'roles': ROLES[g], 'inicio': ks[0], 'leagues': lig,
              'intl': {'A': {'nome': n1, 'bolsa': 300000, 'rep': 0.3, 'semanas': 3, 'vagas': dict(zip(ks, VAG1))},
                       'B': {'nome': n2, 'bolsa': 750000, 'rep': 0.6, 'semanas': 4, 'vagas': dict(zip(ks, VAG2))}}}
open(out, 'w', encoding='utf8').write('/* Dados dos outros jogos (tools/gen_outros.py). Orgs reais; jogadores GERADOS (fictícios). Jogador = [nick, nota, idade]. */\nwindow.DATA=' + json.dumps(res, ensure_ascii=False, separators=(',', ':')) + ';\n')
print({g: sum(len(l['t1']) + len(l['t2']) for l in v['leagues'].values()) for g, v in res.items()})

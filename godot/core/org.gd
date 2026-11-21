extends Node
## Núcleo do eSports CEO (port de js/core.js). Estado em Org.S (Dictionary), sem UI aqui.
## Números vindos do JSON são float: use int()/floori() nos índices.

const M32 := 0xFFFFFFFF
var GAMES = {
	"lol": {"id": "lol", "nome": "League of Legends", "curto": "LoL", "icone": "⚔️", "subs": 2, "roles": ["TOP", "JNG", "MID", "ADC", "SUP"]},
	"cs2": {"id": "cs2", "nome": "Counter-Strike 2", "curto": "CS2", "icone": "🔫", "subs": 2, "roles": ["IGL", "AWP", "ENT", "LUR", "SUP"]},
	"dota2": {"id": "dota2", "nome": "Dota 2", "curto": "Dota 2", "icone": "🛡️", "subs": 2, "roles": ["POS1", "POS2", "POS3", "POS4", "POS5"]},
	"valorant": {"id": "valorant", "nome": "Valorant", "curto": "Valorant", "icone": "🎯", "subs": 2, "roles": ["DUE", "INI", "CTR", "SEN", "FLX"]},
	"ff": {"id": "ff", "nome": "Free Fire", "curto": "Free Fire", "icone": "🔥", "subs": 2, "roles": ["IGL", "RUSH", "SNP", "SUP"]},
	"r6": {"id": "r6", "nome": "Rainbow Six Siege", "curto": "R6", "icone": "🛰️", "subs": 2, "roles": ["ENT", "FLX", "ANC", "ROM", "SUP"]},
	"fifa": {"id": "fifa", "nome": "EA FC (FIFA)", "curto": "EA FC", "icone": "⚽", "subs": 1, "roles": ["JOG"]},
	"wr": {"id": "wr", "nome": "Wild Rift", "curto": "Wild Rift", "icone": "📱", "subs": 2, "roles": ["TOP", "JNG", "MID", "ADC", "SUP"]},
}
var SQUADS = {
	"t1": {"id": "t1", "nome": "Time principal (T1)", "licenca": 0, "premio": 300000},
	"t2": {"id": "t2", "nome": "Time T2", "licenca": 250000, "premio": 75000},
	"acad": {"id": "acad", "nome": "Academy", "licenca": 150000, "premio": 25000},
}
var INFRA = [
	{"id": "casa", "nome": "Gaming house", "icone": "🏠", "max": 5, "base": 60000, "bonus": 0.8, "desc": "Moradia e centro de treino do time."},
	{"id": "perif", "nome": "Teclados e mouses", "icone": "⌨️", "max": 5, "base": 15000, "bonus": 0.4, "desc": "Periféricos de ponta para todo o elenco."},
	{"id": "fone", "nome": "Fones e monitores", "icone": "🎧", "max": 5, "base": 12000, "bonus": 0.3, "desc": "Áudio e tela com taxa de atualização alta."},
	{"id": "psi", "nome": "Psicólogo", "icone": "🧠", "max": 3, "base": 40000, "bonus": 0.6, "desc": "Cuida da cabeça do elenco em fase ruim."},
	{"id": "nutri", "nome": "Nutricionista", "icone": "🥗", "max": 3, "base": 30000, "bonus": 0.4, "desc": "Alimentação e sono sob controle."},
	{"id": "academia", "nome": "Academia", "icone": "🏋️", "max": 3, "base": 35000, "bonus": 0.4, "desc": "Preparo físico e prevenção de lesões."},
	{"id": "base", "nome": "Categoria de base", "icone": "🌱", "max": 5, "base": 50000, "bonus": 0.0, "desc": "Revela jovens talentos a cada split (nível maior = jovens melhores)."},
	{"id": "cozinha", "nome": "Cozinha", "icone": "🍳", "max": 3, "base": 20000, "bonus": 0.3, "desc": "Comida caseira na gaming house."},
]
var LOJA = [
	{"id": "lanche", "nome": "Pizza e integração", "icone": "🍕", "tipo": "buff", "f": 0.8, "sem": 3, "c": 12000, "desc": "+0,8 de força por 3 semanas."},
	{"id": "boot", "nome": "Bootcamp intensivo", "icone": "🏕️", "tipo": "buff", "f": 1.5, "sem": 6, "c": 45000, "desc": "+1,5 de força por 6 semanas."},
	{"id": "coach", "nome": "Coach convidado", "icone": "🎓", "tipo": "buff", "f": 2.2, "sem": 4, "c": 95000, "desc": "+2,2 de força por 4 semanas."},
	{"id": "analista", "nome": "Analista de dados", "icone": "📊", "tipo": "buff", "f": 1.0, "sem": 10, "c": 60000, "desc": "+1 de força por 10 semanas."},
	{"id": "ads", "nome": "Campanha de anúncios", "icone": "📣", "tipo": "seg", "v": 1.12, "c": 25000, "desc": "+12% de seguidores agora."},
	{"id": "influ", "nome": "Collab com influencer", "icone": "🤳", "tipo": "seg", "v": 1.3, "c": 70000, "desc": "+30% de seguidores agora."},
	{"id": "camisa", "nome": "Linha de camisas", "icone": "👕", "tipo": "merch", "pay": 2500, "sem": 12, "c": 24000, "desc": "Vende R$ 2,5 mil/sem por 12 semanas (retorna R$ 30 mil)."},
	{"id": "skin", "nome": "Pacote de skins da org", "icone": "🎨", "tipo": "merch", "pay": 6000, "sem": 16, "c": 80000, "desc": "Rende R$ 6 mil/sem por 16 semanas (retorna R$ 96 mil)."},
	{"id": "stream", "nome": "Estúdio de streaming", "icone": "🎥", "tipo": "merch", "pay": 4500, "sem": 20, "c": 70000, "desc": "Rende R$ 4,5 mil/sem por 20 semanas (retorna R$ 90 mil)."},
]
const LOJA_N := 5
const LOJA_CICLO := 4
const BUFF_MAX := 4
const INFRA_MULT := 2.6
const UPKEEP := 0.004
const CICLO := 26
const PRE := 3
const CONTRATO := 104
const PREMIO_PCT := {"campeao": 1.0, "vice": 0.5, "semi": 0.25, "quartas": 0.1}
const INTL := {
	"MSI": {"nome": "MSI", "bolsa": 600000, "rep": 0.4, "semanas": 3, "vagas": {"LCK": 2, "LPL": 2, "LEC": 1, "LCS": 1, "CBLOL": 1, "LCP": 1}},
	"WORLDS": {"nome": "Mundial", "bolsa": 1500000, "rep": 0.8, "semanas": 4, "vagas": {"LCK": 3, "LPL": 3, "LEC": 3, "LCS": 2, "CBLOL": 2, "LCP": 3}},
}
const PCT_INTL := {"campeao": 1.0, "vice": 0.5, "semi": 0.25, "quartas": 0.1, "oitavas": 0.04}
const ANO_SIM := 2027
const REG_ANOS := 8
const REG_MAX := 24
const BASE_ANO_MAX := 21
const SAVE_PATH := "user://org-v1.json"

var S: Dictionary = {}
var LOL: Dictionary = {}
var DATA: Dictionary = {}
var LOLX: Dictionary = {}
var NOMES: Dictionary = {}
var HIST: Dictionary = {}
var ULT: Array = []
var ult_serie = null
var _pool = {}
var testando = false  # true nos testes headless: não grava o save

# ---------- utilidades (equivalentes ao JS) ----------
func jr(x) -> int: return int(floor(x + 0.5))   # Math.round
func cl(x, a, b): return max(a, min(b, x))
func s32(x: int) -> int:
	x &= M32
	return x - 0x100000000 if x >= 0x80000000 else x
func imul(a: int, b: int) -> int: return ((a & M32) * (b & M32)) & M32
func fee(o) -> int: return jr(15000.0 * pow(1.3, o - 70) / 1000.0) * 1000
func salary(o) -> int: return jr(fee(o) / 50.0)
func money(n) -> String:
	var a = absf(n); var sg = "-" if n < 0 else ""
	if a >= 1e6: return sg + "R$ " + ("%.1f" if a >= 1e7 else "%.2f") % (a / 1e6) + " mi"
	if a >= 1e3:
		var t: String = ("%.0f" if a >= 1e5 else "%.1f") % (a / 1e3)
		t = t.replace(".", ",")
		if t.ends_with(",0"): t = t.substr(0, t.length() - 2)
		return sg + "R$ " + t + " mil"
	return sg + "R$ " + str(jr(a))
func ativo(g) -> bool: return data_of(g) != null
func slots_de(g) -> int: return GAMES[g].roles.size() + GAMES[g].subs
func nT(g) -> int: return GAMES[g].roles.size()
func hs(s) -> float:  # hash 0..1 (não gasta a semente do jogo)
	var h = 2166136261
	for c in str(s).to_utf32_buffer().to_int32_array(): h = imul(h ^ c, 16777619)
	h ^= h >> 15; h = imul(h, 2246822519); h ^= h >> 13
	return float(h & M32) / 4294967296.0
func fnv(s: String) -> int:  # hash FNV (muHash / hashS)
	var h = 2166136261
	for c in s.to_utf32_buffer().to_int32_array(): h = imul(h ^ c, 16777619)
	return h & M32
func rnd() -> float:  # mulberry32 com estado salvo no jogo
	S.seed = s32(int(S.seed) + 0x6D2B79F5)
	return _mb(int(S.seed))
func _mb(t: int) -> float:
	t &= M32
	var r = imul(t ^ (t >> 15), 1 | t)
	r = (r ^ ((r + imul(r ^ (r >> 7), 61 | r)) & M32)) & M32
	return float((r ^ (r >> 14)) & M32) / 4294967296.0
func rngf(seed: int) -> Callable:  # prng(seed) independente (narrar)
	var st = [seed & M32]
	return func():
		st[0] = (st[0] + 0x6D2B79F5) & M32
		return _mb(st[0])
func pick_(a):  return a[floori(rnd() * a.size())]

# ---------- dados ----------
func _norm(v):  # float inteiro -> int (índices, ids), recursivo
	match typeof(v):
		TYPE_FLOAT:
			if v == floor(v) and absf(v) < 9.0e15: return int(v)
			return v
		TYPE_ARRAY:
			for i in v.size(): v[i] = _norm(v[i])
			return v
		TYPE_DICTIONARY:
			for k in v.keys(): v[k] = _norm(v[k])
			return v
	return v
func _load_json(name: String):
	var f = FileAccess.open("res://data/" + name, FileAccess.READ)
	if f == null: return {}
	return _norm(JSON.parse_string(f.get_as_text()))
func carregar_dados() -> void:
	if not LOL.is_empty(): return
	LOL = _load_json("lol.LOL.json"); DATA = _load_json("outros.DATA.json"); LOLX = _load_json("lolx.LOLX.json"); NOMES = _load_json("nomes.NOMES.json")
	HIST = {}
	for f in ["hist", "hist_dota", "hist_ff", "hist_fifa", "hist_r6", "hist_val", "hist_wr"]:
		var h = _load_json(f + ".HIST.json")
		if typeof(h) == TYPE_DICTIONARY: HIST.merge(h, true)
func data_of(g):
	carregar_dados(); mundo_sync()
	var d = LOL if g == "lol" else DATA.get(g, null)
	if d != null and not d.has("inicio"):
		d["inicio"] = "CBLOL" if d.leagues.has("CBLOL") else d.leagues.keys()[0]
	return d
func raw_data(g):
	carregar_dados(); return LOL if g == "lol" else DATA.get(g, null)
func D(g): return data_of(g)
func regiao_de(g) -> String:
	if g == "lol": return S.org.regiao
	var r = S.games[g].get("regiao", null)
	return r if r != null and D(g).leagues.has(r) else D(g).inicio
func region(g = "lol"): return D(g).leagues[regiao_de(g)]
func intl_def(g): return INTL if g == "lol" else D(g).intl
func media_time(pl) -> float:
	if pl == null or pl.size() == 0: return 70.0
	var s = 0.0
	for p in pl: s += p[1]
	return s / pl.size()
func pool(g) -> Array:
	if _pool.has(g): return _pool[g]
	var out = []; var roles = D(g).roles; var id0 = "" if g == "lol" else g + "-"
	for lg in D(g).leagues:
		var L = D(g).leagues[lg]
		for tier in [["t1", 1, "T1"], ["t2", 2, "T2"]]:
			var ti = 0
			for t in L.get(tier[0], []):
				var i = 0
				for p in (t.get("p", []) if t.get("p") != null else []):
					if p != null:
						out.append({"id": "%s%s-%d-%d-%d%s" % [id0, lg, tier[1], ti, i, ("~" + str(p[4])) if p.size() > 4 and p[4] else ""], "n": p[0], "o": p[1], "a": p[2], "c": p[3] if p.size() > 3 else null, "r": roles[i] if i < roles.size() else "", "t": t.n, "l": lg, "tier": tier[2]})
					i += 1
				ti += 1
	_pool[g] = out
	return out
func contratados(g) -> Dictionary:
	var ids = {}
	for sq in S.games[g].squads.values():
		for p in sq.slots:
			if p != null: ids[p.id] = true
	return ids
func livres(g) -> Array:
	if D(g) == null: return []
	var used = contratados(g); var vend = {}
	for v in S.get("vendidos", []): vend[v] = true
	return pool(g).filter(func(p): return not used.has(p.id) and not vend.has(p.id))

# ---------- Estado ----------
func novo_jogo() -> Dictionary:
	var games = {}
	for g in GAMES:
		var mk = func(): return {"on": false, "slots": _vazios(slots_de(g))}
		var t1 = mk.call(); t1.on = true
		games[g] = {"squads": {"t1": t1, "t2": mk.call(), "acad": mk.call()}}
	var J = {"v": 1, "seed": (int(Time.get_unix_time_from_system() * 1000.0) & 0x7fffffff) | 1,
		"org": {"nome": "Minha Org", "caixa": 500000, "rep": 1.0, "semana": 1, "ano": 2026, "regiao": "CBLOL", "logo": {"s": "🐺", "c": "#7c8cff", "f": "escudo"}},
		"setup": null, "tempo": 0, "inicio": "lol", "ordem": [], "tent": 0, "estrela": null, "infra": {}, "games": games, "comp": {}, "ligas": {}, "base": {}, "noticias": [], "vendidos": [],
		"patro": [], "ofertas": [], "ofertaSem": 0, "social": {"seg": 5000}, "foco": "nenhum", "buff": null, "aporte": 0, "itens": [], "loja": [], "lojaSem": 0, "evento": null, "intlHist": [],
		"reg": {}, "hon": {}, "bo": {}, "pts": {}, "log": [], "logN": 0, "dir": {}}
	J["mundo"] = novo_mundo(J.org.ano)
	return J
func _vazios(n: int) -> Array:
	var a = []; a.resize(n); a.fill(null); return a
func _ready() -> void:
	carregar_dados(); S = novo_jogo()
func reset_estado() -> void: S = novo_jogo()
func save() -> void:
	if testando: return
	var f = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f: f.store_string(JSON.stringify(S))
func tem_save() -> bool: return FileAccess.file_exists(SAVE_PATH)
func load_save() -> bool:
	if not FileAccess.file_exists(SAVE_PATH): return false
	var s = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if typeof(s) != TYPE_DICTIONARY or not s.has("org") or not s.has("games"): return false
	s = _norm(s)
	var b = novo_jogo()
	for k in b:
		if not s.has(k): s[k] = b[k]
	for g in b.games:
		if not s.games.has(g): s.games[g] = b.games[g]
	for k in ["reg", "hon", "bo", "pts", "infra", "comp", "ligas", "base"]:
		if typeof(s[k]) != TYPE_DICTIONARY: s[k] = {}
	for g in s.games:
		for q in s.games[g].squads.values():
			for p in q.slots:
				if p != null: iniciar_jogador(p)
		for p in s.base.get(g, []): iniciar_jogador(p)
	S = s; ajustar_mundo(S); _pool.clear(); mundo_sync()
	return true
func comecar() -> void:
	S = novo_jogo(); S.setup = "config"; mundo_sync(); save()
func aberto(g) -> bool: return S.games[g].get("aberto", true) != false
func desbloqueio(g) -> Dictionary:
	var i = max(0, S.ordem.find(g)); return {"sem": 26 * (i + 1), "custo": 150000 * (i + 1)}
func iniciar(cfg: Dictionary) -> Dictionary:
	var g = cfg.get("game", "")
	if not GAMES.has(g) or not ativo(g): return {"ok": false, "msg": "Jogo inválido."}
	S.org.nome = str(cfg.get("nome", "")).strip_edges().left(24) if str(cfg.get("nome", "")).strip_edges() != "" else "Minha Org"
	if cfg.has("logo"): S.org.logo = cfg.logo
	S.org.caixa = 600000
	var reg = cfg.get("regiao", null)
	if reg == null or not D(g).leagues.has(reg): reg = D(g).inicio
	S.inicio = g
	if g == "lol": S.org.regiao = reg
	else: S.games[g]["regiao"] = reg
	S.ordem = GAMES.keys().filter(func(x): return x != g)
	for x in GAMES:
		S.games[x]["aberto"] = x == g; S.games[x].squads.t1.on = x == g
	S.setup = "estrela"; S.tent = 3; save()
	return {"ok": true, "msg": "Org criada."}
func chance_estrela(o) -> float: return max(0.003, 1.0 / (1.0 + exp((o - 76) / 3.2)))
func convidar_estrela(p: Dictionary) -> Dictionary:
	if S.setup != "estrela": return {"ok": false, "msg": "Fora da hora."}
	var f = fee(p.o); var ch = chance_estrela(p.o)
	if S.tent <= 0:
		if ch < 0.8: return {"ok": false, "msg": "Sem tentativas: escolha alguém mais acessível."}
	else:
		S.tent -= 1
		if rnd() >= ch:
			var t: Array
			if ch < 0.03: t = ["%s riu e desligou a chamada." % p.n, "%s nem respondeu: sua org ainda não existe pro mundo." % p.n, "%s: \"quando vocês forem campeões, a gente conversa.\"" % p.n]
			elif ch < 0.3: t = ["%s recusou: prefere um projeto mais estabelecido." % p.n, "%s recusou: já tem proposta melhor." % p.n]
			else: t = ["%s recusou: a proposta não bateu." % p.n, "%s pediu mais tempo e acabou recusando." % p.n]
			save(); return {"ok": false, "recusou": true, "msg": t[floori(rnd() * t.size())]}
	S.org.caixa += f; var r = contratar(S.inicio, "t1", p); S.org.caixa -= f
	if not r.ok: return r
	for x in S.games[S.inicio].squads.t1.slots:
		if x != null and x.id == p.id: x["estrela"] = true; x["fee"] = 0
	S.estrela = {"id": p.id, "n": p.n, "o": p.o}; S.social.seg = 5000 + max(0, p.o - 55) * 500; S.org.rep += max(0.0, (p.o - 70) / 40.0)
	S.setup = null; log_("%s aceitou ser a estrela da org!" % p.n); save()
	return {"ok": true, "msg": "%s aceitou ser a estrela da %s!" % [p.n, S.org.nome]}
func sem_estrela() -> Dictionary:
	if S.setup == "estrela": S.setup = null; save()
	return {"ok": true, "msg": "Começando sem estrela."}
func abrir_jogo(g) -> Dictionary:
	if aberto(g): return {"ok": false, "msg": "Já aberto."}
	var d = desbloqueio(g)
	if S.tempo < d.sem: return {"ok": false, "msg": "Disponível em %d semanas." % (d.sem - S.tempo)}
	if S.org.caixa < d.custo: return {"ok": false, "msg": "Caixa insuficiente."}
	S.org.caixa -= d.custo; S.games[g]["aberto"] = true; S.games[g].squads.t1.on = true; log_("Abriu o time de " + GAMES[g].curto); save()
	return {"ok": true, "msg": "Time de %s aberto!" % GAMES[g].nome}
func log_(msg: String) -> void:
	S.logN = int(S.get("logN", 0)) + 1
	S.log.push_front("S%d/%d: %s" % [S.org.semana, S.org.ano, msg])
	if S.log.size() > 40: S.log.resize(40)
	if msg.begins_with("Proposta de ") or msg.begins_with("Novo evento") or msg.begins_with("Evento"): return   # já chegam pela caixa de entrada
	if ": campeão" in msg: feed(msg, "", "titulo", 3)
	else: feed(msg, "", "org", 1)

# ---------- Org: estrutura, times, elenco ----------
func infra_nivel(id, g) -> int: return int(S.infra.get(g, {}).get(id, 0))
func infra_bonus(g) -> float:
	var t = 0.0
	for it in INFRA: t += infra_nivel(it.id, g) * it.bonus
	return t
func infra_investido() -> float:
	var t = 0.0
	for g in GAMES:
		for it in INFRA:
			for l in infra_nivel(it.id, g): t += it.base * pow(INFRA_MULT, l)
	return t
func infra_custo(it, g) -> int: return jr(it.base * pow(INFRA_MULT, infra_nivel(it.id, g)) / 1000.0) * 1000
func upkeep_semanal() -> int: return jr(infra_investido() * UPKEEP * (1.0 - 0.06 * staff_nivel("gerente")))
func comprar_infra(id, g) -> Dictionary:
	var it = null
	for x in INFRA:
		if x.id == id: it = x
	if it == null: return {"ok": false, "msg": "Item inválido."}
	if not GAMES.has(g): return {"ok": false, "msg": "Jogo inválido."}
	if infra_nivel(id, g) >= it.max: return {"ok": false, "msg": "Nível máximo."}
	var c = infra_custo(it, g)
	if S.org.caixa < c: return {"ok": false, "msg": "Caixa insuficiente."}
	if not S.infra.has(g): S.infra[g] = {}
	S.org.caixa -= c; S.infra[g][id] = infra_nivel(id, g) + 1
	log_("%s: %s nível %d" % [GAMES[g].curto, it.nome, S.infra[g][id]]); save()
	return {"ok": true, "msg": "%s (%s) agora no nível %d." % [it.nome, GAMES[g].curto, S.infra[g][id]]}
func ativar_squad(g, sq) -> Dictionary:
	var q = S.games[g].squads[sq]; var d = SQUADS[sq]
	if not aberto(g): return {"ok": false, "msg": "Abra este jogo primeiro."}
	if q.on: return {"ok": false, "msg": "Já ativo."}
	if S.org.caixa < d.licenca: return {"ok": false, "msg": "Caixa insuficiente."}
	S.org.caixa -= d.licenca; q.on = true; log_("%s criado (%s)" % [d.nome, GAMES[g].curto]); save()
	return {"ok": true, "msg": d.nome + " criado."}
func _vaga(q, g, r) -> int:  # slot para um jogador de função r (titular da função, senão reserva)
	var n = nT(g); var idx: int = GAMES[g].roles.find(r)
	var slot = idx if idx >= 0 and q.slots[idx] == null else -1
	if slot < 0:
		for i in range(n, q.slots.size()):
			if q.slots[i] == null: slot = i; break
	return slot
func contratar(g, sq, player) -> Dictionary:
	var q = S.games[g].squads.get(sq)
	if q == null or not q.on: return {"ok": false, "msg": "Ative esse time primeiro."}
	var f = fee(player.o)
	if S.org.caixa < f: return {"ok": false, "msg": "Caixa insuficiente."}
	var slot = _vaga(q, g, player.r)
	if slot < 0: return {"ok": false, "msg": "Titular da função e reservas já ocupados."}
	q.slots[slot] = iniciar_jogador({"id": player.id, "n": player.n, "o": player.o, "a": player.a, "c": player.c, "r": player.r, "t": player.t, "l": player.l, "fee": f, "ct": CONTRATO})
	S.org.caixa -= f; log_("Contratou %s (%d) para o %s" % [player.n, player.o, SQUADS[sq].nome]); save()
	return {"ok": true, "msg": "%s contratado%s." % [player.n, " como reserva" if slot >= nT(g) else ""]}
func dispensar(g, sq, slot) -> Dictionary:
	var q = S.games[g].squads[sq]; var p = q.slots[slot]
	if p == null: return {"ok": false, "msg": "Vaga vazia."}
	if p.get("estrela", false): return {"ok": false, "msg": "A estrela da org não pode ser dispensada."}
	var back = jr(p.get("fee", 0) * 0.4); q.slots[slot] = null; S.org.caixa += back; log_("Dispensou " + p.n); save()
	return {"ok": true, "msg": "%s dispensado. Devolução: %s." % [p.n, money(back)]}
func mover(g, de, para, slot) -> Dictionary:
	var a = S.games[g].squads[de]; var b = S.games[g].squads[para]; var p = a.slots[slot]
	if p == null: return {"ok": false, "msg": "Vaga vazia."}
	if not b.on: return {"ok": false, "msg": "Crie o outro time primeiro."}
	var t = _vaga(b, g, p.r)
	if t < 0: return {"ok": false, "msg": "Sem vaga livre no outro time."}
	b.slots[t] = p; a.slots[slot] = null; log_("%s: %s → %s" % [p.n, SQUADS[de].nome, SQUADS[para].nome]); save()
	return {"ok": true, "msg": "%s movido para o %s." % [p.n, SQUADS[para].nome]}

# ---------- Patrocínios, redes sociais, foco e eventos ----------
const MARCAS := ["TurboByte", "Café Pixel", "NeoBank", "Lanches Zap", "Gamer Chair Pro", "EnergiaMax", "FibraNet", "Skin&Co", "Pixel Drinks", "Arena Seguros"]
const EVENTOS := [
	{"id": "collab", "txt": "Um influenciador propõe uma collab com a sua org.", "ops": [{"t": "Aceitar (R$ 20 mil)", "c": 20000, "f": "seg", "v": 1.15}, {"t": "Recusar"}]},
	{"id": "viral", "txt": "Um clipe do seu time viralizou!", "ops": [{"t": "Aproveitar a fama", "f": "seg", "v": 1.2}]},
	{"id": "boot", "txt": "Uma empresa oferece um bootcamp de treino.", "ops": [{"t": "Pagar R$ 30 mil (+1,5 de força por 8 semanas)", "c": 30000, "f": "buff", "v": 1.5}, {"t": "Recusar"}]},
	{"id": "fisc", "txt": "Fiscalização: imposto atrasado.", "ops": [{"t": "Pagar R$ 15 mil", "c": 15000}, {"t": "Contestar (50%: pagar R$ 30 mil)", "f": "risco"}]},
	{"id": "pol", "txt": "Uma polêmica nas redes envolve um jogador.", "ops": [{"t": "Nota oficial (R$ 8 mil)", "c": 8000}, {"t": "Ignorar (-8% seguidores)", "f": "seg", "v": 0.92}]},
	{"id": "vaq", "txt": "Fãs organizam uma vaquinha para a org.", "ops": [{"t": "Aceitar R$ 10 mil", "f": "caixa", "v": 10000}]},
]
func ganho_rep(d) -> float: return d * max(0.15, 1.0 - S.org.rep / 9.0)
func seguidores(m) -> void:
	var g = 1.0 + (m - 1.0) / (1.0 + S.social.seg / 5e5) if m > 1 else m
	S.social.seg = cl(jr(S.social.seg * g), 500, 10000000)
func renda_social() -> int: return jr(S.social.seg * 0.003 * (1.0 + 0.05 * staff_nivel("marketing")))
func custo_foco() -> int: return 3000 if S.foco == "midia" else 0
func ofertas() -> Array:
	if S.ofertas.is_empty():
		for i in 3:
			var id = "p" + str(floori(rnd() * 1e9)); var n = MARCAS[floori(rnd() * MARCAS.size())]
			var pay = jr(8000 * pow(S.org.rep, 0.8) * (1 + (max(0, S.estrela.o - 70) / 100.0 if S.estrela != null else 0.0)) * (0.8 + rnd() * 0.6) / 500.0) * 500
			S.ofertas.append({"id": id, "n": n, "pay": pay, "sem": [26, 52, 78][floori(rnd() * 3)]})
	return S.ofertas
func renda_patro() -> int:
	var t = 0
	for x in S.patro: t += x.pay
	return t
func aceitar_patro(id) -> Dictionary:
	var o = null
	for x in ofertas():
		if x.id == id: o = x
	if o == null: return {"ok": false, "msg": "Oferta expirou."}
	if S.patro.size() >= 3: return {"ok": false, "msg": "Máximo de 3 patrocinadores."}
	S.ofertas = S.ofertas.filter(func(x): return x != o)
	S.patro.append({"id": o.id, "n": o.n, "pay": o.pay, "sem": o.sem}); log_("Patrocínio: %s (%s/sem)" % [o.n, money(o.pay)]); save()
	return {"ok": true, "msg": "%s fechado: %s por semana." % [o.n, money(o.pay)]}
func set_foco(f) -> Dictionary:
	if not ["nenhum", "treino", "midia"].has(f): return {"ok": false, "msg": "Foco inválido."}
	S.foco = f; save(); return {"ok": true, "msg": "Foco da semana definido."}
func escolher_evento(i: int) -> Dictionary:
	var ev = S.evento
	if ev == null: return {"ok": false, "msg": "Sem evento."}
	var e = null
	for x in EVENTOS:
		if x.id == ev.id: e = x
	if i < 0 or i >= e.ops.size(): return {"ok": false, "msg": "Opção inválida."}
	var op = e.ops[i]
	if op.has("c") and S.org.caixa < op.c: return {"ok": false, "msg": "Caixa insuficiente."}
	if op.has("c"): S.org.caixa -= op.c
	var f = op.get("f", "")
	if f == "seg": seguidores(op.v)
	elif f == "buff": S.buff = {"f": op.v, "sem": 8}
	elif f == "caixa": S.org.caixa += op.v
	elif f == "risco" and rnd() < 0.5: S.org.caixa -= 30000
	S.evento = null; log_("Evento: %s → %s" % [e.txt.trim_suffix("."), op.t.split(" (")[0]]); save()
	return {"ok": true, "msg": "Decisão tomada."}
func semanal_org() -> void:
	for x in S.patro: x.sem -= 1
	for x in S.patro.filter(func(x): return x.sem <= 0): log_("Patrocínio com %s terminou" % x.n)
	S.patro = S.patro.filter(func(x): return x.sem > 0)
	seguidores(1 + 0.002 + 0.0004 * S.org.rep + (max(0, S.estrela.o - 60) * 0.00004 if S.estrela != null else 0.0) + (0.02 if S.foco == "midia" else 0.0))
	if S.buff != null:
		S.buff.sem -= 1
		if S.buff.sem <= 0: S.buff = null
	if S.aporte > 0: S.aporte -= 1
	if S.org.caixa < 0 and not S.aporte:
		var algum = false
		for g in GAMES:
			if ativo(g) and prontos(g, "t1"): algum = true
		if not algum: S.org.caixa += 300000; S.aporte = 52; log_("Aporte emergencial: investidores injetaram R$ 300 mil na org")
	for x in S.itens: x.sem -= 1
	S.itens = S.itens.filter(func(x): return x.sem > 0)
	S.lojaSem += 1
	if S.lojaSem >= LOJA_CICLO: S.lojaSem = 0; S.loja = []; loja_itens()
	S.ofertaSem += 1
	if S.ofertaSem >= 6: S.ofertaSem = 0; S.ofertas = []; ofertas()
	if S.evento != null:
		S.evento.sem -= 1
		if S.evento.sem <= 0: S.evento = null; log_("Evento expirou sem decisão")
	if S.evento == null and rnd() < 0.12:
		var e = EVENTOS[floori(rnd() * EVENTOS.size())]; S.evento = {"id": e.id, "sem": 4}; log_("Novo evento: " + e.txt); _msg_evento(e)
func bonus_temp(g) -> float:
	var t = (1.0 if S.foco == "treino" else 0.0) + (S.buff.f if S.buff != null else 0.0)
	for x in S.itens:
		if x.get("g") == null or x.get("g") == g: t += x.get("f", 0.0)
	return min(BUFF_MAX, t)
func renda_merch() -> int:
	var t = 0
	for x in S.itens: t += int(x.get("pay", 0))
	return jr(t * (1.0 + 0.05 * staff_nivel("marketing")))
func loja_itens() -> Array:
	if S.loja.is_empty():
		var ids = LOJA.map(func(x): return x.id)
		while S.loja.size() < LOJA_N:
			var k = floori(rnd() * ids.size()); S.loja.append(ids[k]); ids.remove_at(k)
	var out = []
	for id in S.loja:
		for x in LOJA:
			if x.id == id: out.append(x)
	return out
func item_ativo(it, g) -> bool:
	if it.tipo == "seg": return false
	for x in S.itens:
		if x.id == it.id and (it.tipo != "buff" or x.get("g") == g): return true
	return false
func comprar_loja(id, g) -> Dictionary:
	var it = null
	for x in loja_itens():
		if x.id == id: it = x
	if it == null: return {"ok": false, "msg": "Item fora de estoque."}
	if it.tipo == "buff" and not GAMES.has(g): return {"ok": false, "msg": "Escolha o jogo do reforço."}
	if S.org.caixa < it.c: return {"ok": false, "msg": "Caixa insuficiente."}
	if item_ativo(it, g): return {"ok": false, "msg": "Você já tem esse item ativo."}
	S.org.caixa -= it.c
	if it.tipo == "seg": seguidores(it.v)
	else: S.itens.append({"id": it.id, "nome": it.nome, "f": it.get("f", 0.0), "pay": it.get("pay", 0), "sem": it.sem, "g": g if it.tipo == "buff" else null})
	if it.tipo != "buff": S.loja = S.loja.filter(func(x): return x != id)
	log_("Loja: %s%s" % [it.nome, (" (" + GAMES[g].curto + ")") if it.tipo == "buff" else ""]); save()
	return {"ok": true, "msg": it.nome + " comprado."}

func _msg_evento(e: Dictionary) -> void:
	var ops = []
	for i in e.ops.size(): ops.append({"t": e.ops[i].t, "k": "evento", "a": i, "eid": e.id})
	msg("evento", "Evento", e.txt + " (decida em até 4 semanas)", ops)

# ---------- Treino, desenvolvimento e base ----------
var FOCOS = {
	"bal": {"id": "bal", "nome": "Equilibrado", "icone": "⚖️", "xp": 1.0, "desc": "Treino variado: sem bônus e sem custo."},
	"mec": {"id": "mec", "nome": "Mecânica", "icone": "🖱️", "xp": 1.3, "desc": "+30% de XP, mas desgasta a moral."},
	"men": {"id": "men", "nome": "Mentalidade", "icone": "🧠", "xp": 0.9, "desc": "-10% de XP; sobe a moral e dá +0,1 de força ao time (liderança)."},
	"fis": {"id": "fis", "nome": "Físico", "icone": "💪", "xp": 0.8, "desc": "-20% de XP; evita a queda por idade e protege a moral."},
}
var TRACOS = {
	"esf": {"nome": "Esforçado", "desc": "+15% de XP."},
	"pro": {"nome": "Prodígio", "desc": "Evolui muito rápido até os 20 anos e depois desacelera."},
	"lid": {"nome": "Líder", "desc": "+0,15 de força ao time (até +0,45)."},
	"frio": {"nome": "Cabeça fria", "desc": "A moral nunca cai abaixo de 55."},
	"rel": {"nome": "Relaxado", "desc": "-15% de XP, mas moral mais estável."},
}
var TR_IDS = ["esf", "pro", "lid", "frio", "rel"]
func xp_necessario(o) -> int: return jr(10 + max(0, o - 60) * 0.9)
func idade_xp(a) -> float:
	if a <= 17: return 1.2
	if a <= 18: return 1.1
	if a <= 19: return 1.0
	if a <= 20: return 0.9
	if a <= 21: return 0.8
	if a <= 22: return 0.65
	if a <= 23: return 0.5
	if a <= 24: return 0.4
	if a <= 25: return 0.3
	if a <= 26: return 0.22
	if a <= 27: return 0.16
	if a <= 28: return 0.12
	return 0.08
func pot_inicial(p) -> int:
	var a = 25 if p.get("a") == null else p.a; var lo: float; var hi: float
	if a <= 17: lo = 6; hi = 14
	elif a <= 18: lo = 5; hi = 12
	elif a <= 19: lo = 4; hi = 10
	elif a <= 20: lo = 3; hi = 8
	elif a <= 21: lo = 2; hi = 6
	elif a <= 23: lo = 1; hi = 3
	elif a <= 25: lo = 0; hi = 2
	else: lo = 0; hi = 0
	return min(96, p.o + jr(lo + (hi - lo) * hs(str(p.id) + "pot")))
func iniciar_jogador(p):
	if p.get("pot") == null: p["pot"] = pot_inicial(p)
	if p.pot < p.o: p.pot = p.o
	if p.get("xp") == null: p["xp"] = 0.0
	if not FOCOS.has(p.get("foco", "")): p["foco"] = "bal"
	if p.get("mo") == null: p["mo"] = 70.0
	if not p.has("tr"):
		var k = hs(str(p.id) + "tr")
		p["tr"] = null if k < 0.4 else TR_IDS[min(TR_IDS.size() - 1, floori((k - 0.4) / 0.6 * TR_IDS.size()))]
	if p.get("tmp") == null: p["tmp"] = 0
	return p
func pot_visivel(p, g = "lol") -> Dictionary:
	var a = 25 if p.get("a") == null else p.a; var w: int = cl(jr(23 - a), 0, 6)
	w = max(0, w - floori(p.get("tmp", 0) / 26.0) - floori(infra_nivel("base", g) / 2.0))
	if scouted(p): w = 0
	var pot = pot_inicial(p) if p.get("pot") == null else p.pot
	var est = cl(jr(pot + (hs(str(p.id) + "v") * 2 - 1) * w), p.o, 99) if w else pot
	return {"est": est, "lo": max(p.o, est - w), "hi": est + w, "incerto": w > 0, "estrelas": cl(jr((est - 60) / 7.0), 1, 5)}
func ganho_xp(p, g, sq, titular) -> float:
	iniciar_jogador(p); var room = p.pot - p.o
	if room <= 0: return 0.0
	var a = 24 if p.get("a") == null else p.a; var f = FOCOS[p.foco]
	var tr = 1.0
	match p.get("tr"):
		"esf": tr = 1.15
		"rel": tr = 0.85
		"pro": tr = 1.25 if a <= 20 else 0.85
	var raw = 1.0 + infra_nivel("casa", g) * 0.10 + infra_nivel("nutri", g) * 0.04 + infra_nivel("academia", g) * 0.04 * (2 if p.foco == "fis" else 1) + (0.25 if S.foco == "treino" else 0.0) + (infra_nivel("base", g) * 0.05 if sq == "base" else 0.0)
	var M = 1.0 + (raw - 1.0) / (1.0 + (raw - 1.0) * 0.6) if raw > 1 else raw
	var mor = 0.7 + cl(p.mo, 0, 100) / 100.0 * 0.5; var rf = 1.0 if room >= 6 else 0.4 + 0.6 * room / 6.0
	return idade_xp(a) * f.xp * tr * M * mor * rf * (1.0 if titular else 0.85)
func tendencia(p, g, sq, titular) -> Dictionary:
	iniciar_jogador(p); var x = ganho_xp(p, g, sq, titular); var anual = x * 52 / xp_necessario(p.o)
	if p.o >= p.pot: return {"s": "↓" if (p.get("a", 0) if p.get("a") != null else 0) >= 30 else "→", "anual": 0}
	if p.mo < 30: return {"s": "↓", "anual": anual}
	return {"s": "↑" if anual >= 2 else "→", "anual": anual}
func moral_rot(mo) -> String: return "Motivado" if mo >= 75 else "Normal" if mo >= 55 else "Desanimado" if mo >= 35 else "Revoltado"
func noticia(txt, g, tipo = "info") -> void:
	S.noticias.push_front({"s": S.org.semana, "y": S.org.ano, "g": g, "t": txt, "k": tipo})
	if S.noticias.size() > 20: S.noticias.resize(20)
func atualiza_moral(p, g, sq, tit) -> void:
	var c = S.comp.get(g + "-" + sq); var res = 0.0
	if c != null and c.last.size() >= 3:
		var l = c.last.slice(0, 5); var v = 0
		for x in l:
			if x.v: v += 1
		res = (float(v) / l.size() - 0.5) * 16
	var ext = {"men": 6, "mec": -4, "fis": 2}.get(p.foco, 0)
	var tgt = 62 + infra_nivel("psi", g) * 6 + infra_nivel("casa", g) * 1.5 + (8 if tit else -10) + res + (4 if p.get("tr") == "lid" else 0) + (3 if p.get("tr") == "rel" else 0) + (6 if p.get("estrela", false) else 0) + ext + staff_nivel("preparador") * 2
	p.mo = cl(p.mo + (tgt - p.mo) * 0.12, 55 if p.get("tr") == "frio" else 0, 100)
	if p.get("neg", 0) > 0: p.neg -= 1
func treina_um(p, g, sq, tit) -> void:
	iniciar_jogador(p); p.tmp += 1; atualiza_moral(p, g, sq, tit)
	var x = ganho_xp(p, g, sq, tit) * (1.0 + 0.06 * staff_nivel("tecnico")); p["rate"] = x; p.xp += x
	while p.o < p.pot and p.xp >= xp_necessario(p.o):
		p.xp -= xp_necessario(p.o); p.o += 1
		if p.get("estrela", false) and S.estrela != null: S.estrela.o = p.o
		noticia("%s subiu para %d" % [p.n, p.o], g, "up")
		if p.o >= p.pot: noticia("%s atingiu o seu potencial (%d)" % [p.n, p.o], g, "info")
	if p.o >= p.pot: p.xp = 0.0
func aniversario() -> void:
	for g in GAMES:
		var dec = func(p):
			if p == null or p.get("a") == null: return
			p.a += 1
			if p.a >= 30:
				var pr = min(0.9, (p.a - 29) * 0.25) * (0.4 if p.foco == "fis" else 1.0) * (1 - 0.1 * infra_nivel("academia", g) - 0.05 * infra_nivel("nutri", g))
				if rnd() < pr:
					p.o -= 1; p.pot = min(p.o if p.get("pot") == null else p.pot, p.o); noticia("%s perdeu rendimento com a idade (%d)" % [p.n, p.o], g, "down")
		for q in S.games[g].squads.values():
			for p in q.slots: dec.call(p)
		var lst: Array = S.base.get(g, [])
		for p in lst: dec.call(p)
		var novo = []
		for p in lst:
			if p.a >= BASE_ANO_MAX: log_("%s saiu da base (%d anos)" % [p.n, p.a]); noticia("%s saiu da base por idade" % p.n, g, "down")
			else: novo.append(p)
		S.base[g] = novo
func treinar_semana() -> void:
	for g in GAMES:
		for sq in SQUADS:
			var sl = S.games[g].squads[sq].slots
			for i in sl.size():
				if sl[i] != null: treina_um(sl[i], g, sq, i < nT(g))
		for p in S.base.get(g, []): treina_um(p, g, "base", true)
	if S.org.semana == 52: aniversario()
func acha_j(g, sq, ref):
	if sq == "base":
		for x in S.base.get(g, []):
			if x.id == ref: return x
		return null
	return S.games[g].squads[sq].slots[int(ref)]
func trocar_foco(g, sq, ref, foco) -> Dictionary:
	if not FOCOS.has(foco): return {"ok": false, "msg": "Foco inválido."}
	var p = acha_j(g, sq, ref)
	if p == null: return {"ok": false, "msg": "Jogador não encontrado."}
	p.foco = foco; save(); return {"ok": true, "msg": "%s: foco em %s." % [p.n, FOCOS[foco].nome]}
func foco_equipe(g, sq, foco) -> Dictionary:
	if not FOCOS.has(foco): return {"ok": false, "msg": "Foco inválido."}
	var n = 0
	for p in S.games[g].squads[sq].slots:
		if p != null: p.foco = foco; n += 1
	save(); return {"ok": true, "msg": ("Todo o elenco treina " + FOCOS[foco].nome + ".") if n else "Sem jogadores neste time."}
func bonus_equipe(g, sq) -> float:
	var t = titulares(g, sq).filter(func(p): return p != null)
	if t.is_empty(): return 0.0
	var mo = 0.0; var lid = 0; var men = 0
	for p in t:
		mo += p.get("mo", 70.0)
		if p.get("tr") == "lid": lid += 1
		if p.get("foco") == "men": men += 1
	mo /= t.size()
	return cl((mo - 70) * 0.03, -1, 0.7) + min(0.45, lid * 0.15) + min(0.3, men * 0.1)
func premio_jovem(p) -> float: return min(8.0, (p.pot - p.o) * 0.5) if (p.get("a") != null and p.a <= 22 and p.pot > p.o) else 0.0
func valor_jogador(p) -> float: return 15000.0 * pow(1.3, p.o + premio_jovem(p) - 70)
func valor_venda(p) -> int:
	var ct = CONTRATO if p.get("ct") == null else p.ct
	return int(max(500, jr(valor_jogador(p) * 0.6 * cl(0.5 + ct / float(CONTRATO) * 0.5, 0.5, 1) * (1.0 + 0.04 * staff_nivel("diretor")) / 500.0) * 500))
func vender(g, sq, slot) -> Dictionary:
	var q = S.games[g].squads[sq]; var p = q.slots[slot]
	if p == null: return {"ok": false, "msg": "Vaga vazia."}
	if p.get("estrela", false): return {"ok": false, "msg": "A estrela da org não pode ser vendida."}
	var v = valor_venda(p); q.slots[slot] = null; S.org.caixa += v; S.vendidos.append(p.id)
	var lucro: int = v - int(p.get("fee", 0))
	log_("Vendeu %s (%d) por %s%s" % [p.n, p.o, money(v), (((" (lucro " if lucro >= 0 else " (prejuízo ") + money(absi(lucro)) + ")") if p.get("fee", 0) else "")]); save()
	return {"ok": true, "msg": "%s vendido por %s." % [p.n, money(v)]}
var OFERTAS = {"baixa": {"nome": "Baixa", "m": 0.7, "ch": 0.45}, "justa": {"nome": "Justa", "m": 1.0, "ch": 0.92}, "alta": {"nome": "Generosa", "m": 1.4, "ch": 1.0}}
func custo_renovar(p) -> int: return jr(fee(p.o) * 0.5 / 1000.0) * 1000
func proposta_renovar(p, oferta = "justa", anos = 2) -> Dictionary:
	iniciar_jogador(p); var of = OFERTAS.get(oferta, OFERTAS.justa)
	if not [1, 2, 3].has(anos): anos = 2
	var custo = jr(custo_renovar(p) * of.m * (0.6 if anos == 1 else 1.4 if anos == 3 else 1.0) / 1000.0) * 1000
	var ch = of.ch + (p.mo - 60) / 100.0 - (0.3 if p.mo < 25 and oferta != "alta" else 0.0)
	if p.get("estrela", false): ch = 1.0
	return {"custo": custo, "chance": cl(ch, 0.05, 1), "anos": anos}
func renovar(g, sq, slot, oferta = "justa", anos = 2) -> Dictionary:
	var p = S.games[g].squads[sq].slots[slot]
	if p == null: return {"ok": false, "msg": "Vaga vazia."}
	if not OFERTAS.has(oferta): oferta = "justa"
	var pr = proposta_renovar(p, oferta, anos)
	if p.get("neg", 0) > 0: return {"ok": false, "msg": "%s não quer conversar agora (tente em %d sem.)." % [p.n, p.neg]}
	if S.org.caixa < pr.custo: return {"ok": false, "msg": "Caixa insuficiente."}
	if pr.chance < 1 and rnd() >= pr.chance:
		p.mo = max(0, p.mo - 8); p["neg"] = 4; log_(p.n + " recusou a renovação"); save()
		return {"ok": false, "recusou": true, "msg": "%s recusou a proposta e ficou chateado." % p.n}
	S.org.caixa -= pr.custo; p.ct = p.get("ct", 0) + 52 * pr.anos
	if oferta == "alta": p.mo = min(100, p.mo + 10)
	log_("Renovou %s (+%d ano%s)" % [p.n, pr.anos, "s" if pr.anos > 1 else ""]); save()
	return {"ok": true, "msg": "%s renovado por mais %d ano%s (%s)." % [p.n, pr.anos, "s" if pr.anos > 1 else "", money(pr.custo)]}
func cap_base(nv) -> int: return 3 + (1 if nv >= 3 else 0) + (1 if nv >= 5 else 0)
func custo_base(g) -> int:
	var nv = infra_nivel("base", g); return (nv * 400 + S.base.get(g, []).size() * 250) if nv else 0
func sem_acento(s: String) -> String:
	return s.replace("á", "a").replace("à", "a").replace("â", "a").replace("ã", "a").replace("ä", "a").replace("é", "e").replace("ê", "e").replace("è", "e").replace("í", "i").replace("ó", "o").replace("ô", "o").replace("õ", "o").replace("ú", "u").replace("ü", "u").replace("ç", "c").replace("ñ", "n").replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U").replace("Ç", "C").replace("Ã", "A").replace("Õ", "O").replace("Ê", "E").replace("Ô", "O").replace("Â", "A")
func capit(s: String) -> String: return s.left(1).to_upper() + s.substr(1)
func sortear_pais(g) -> String:
	if NOMES.is_empty(): return "BR"
	var cl_ = NOMES.cluster.get(g, {}).get(regiao_de(g), "GLOBAL"); var w = NOMES.pesos.get(cl_, NOMES.pesos.GLOBAL)
	var tot = 0.0
	for v in w.values(): tot += v
	var x = rnd() * tot
	for c in w:
		x -= w[c]
		if x <= 0: return c
	return w.keys()[0]
func nome_base(g, c) -> String:
	var P = NOMES.paises.get(c, NOMES.paises.get("BR"))
	var usados = {}
	for p in pool(g): usados[str(p.n).to_lower()] = true
	for q in S.games[g].squads.values():
		for p in q.slots:
			if p != null: usados[str(p.n).to_lower()] = true
	for p in S.base.get(g, []): usados[str(p.n).to_lower()] = true
	for t in 12:
		var r = rnd(); var nm = sem_acento(pick_(P.n)); var n: String
		if r < 0.4: n = pick_(P.a)
		elif r < 0.58: n = capit(nm.left(3 + floori(rnd() * 3)).to_lower() + pick_(P.get("suf", [""])))
		elif r < 0.74: n = capit(nm) + pick_(["7", "10", "99", "9", "1", "22", "77"])
		elif r < 0.88: n = capit(nm) + pick_(P.get("tag", ["gg", "tv", "jr", "pro", "xd"]))
		else: n = "x" + capit(nm)
		if not usados.has(n.to_lower()): return n
	return pick_(P.a) + str(floori(rnd() * 90 + 10))
func novo_jovem(g, nv) -> Dictionary:
	var roles = GAMES[g].roles; var r = roles[floori(rnd() * roles.size())]; var c = sortear_pais(g)
	var u = rnd(); var a = 16 if u < 0.15 else 17 if u < 0.5 else 18 if u < 0.8 else 19
	var o = jr(52 + nv * 2.2 + (a - 16) * 1.5 + rnd() * 5)
	var pot: float = 66 + nv * 3 + (rnd() + rnd() - 1) * 7; var genio = rnd() < 0.01 + 0.012 * nv
	if genio: pot += 8 + rnd() * 6
	var potc: int = int(cl(jr(pot), o + 3, 96))
	var k = rnd(); var tr = null if k < 0.35 else TR_IDS[floori((k - 0.35) / 0.65 * TR_IDS.size())]
	return {"id": "b" + str(floori(rnd() * 1e9)), "n": nome_base(g, c), "o": o, "pot": potc, "a": a, "r": r, "c": c, "t": "Base", "l": "Base", "tr": tr, "xp": 0.0, "mo": 75.0, "foco": "bal", "tmp": 0, "genio": genio}
func gerar_base(game = null) -> void:
	for g in ([game] if game != null else GAMES.keys()):
		var nv = infra_nivel("base", g)
		if not nv: continue
		if not ativo(g) or not S.games[g].squads.t1.on: continue
		if not S.base.has(g): S.base[g] = []
		var lst: Array = S.base[g]; var cap = cap_base(nv)
		var n = 1 + (1 if nv >= 3 and rnd() < 0.3 + 0.15 * (nv - 3) else 0) + (1 if nv >= 5 and rnd() < 0.3 else 0)
		if lst.size() >= cap: log_("Base (%s): cheia, promova, venda ou dispense para revelar novos jovens" % GAMES[g].curto); continue
		while n > 0 and lst.size() < cap:
			n -= 1
			var p = novo_jovem(g, nv); lst.append(p); var v = pot_visivel(p, g)
			log_("Base (%s): revelou %s%s (%s, %d anos, nota %d, potencial %s%s%s)" % [GAMES[g].curto, p.n, ", uma JOIA RARA" if p.genio else "", p.c, p.a, p.o, "★".repeat(v.estrelas), "☆".repeat(5 - v.estrelas), "?" if v.incerto else ""])
func evoluir(game = null) -> void:
	for g in ([game] if game != null else GAMES.keys()):
		var salto = func(p):
			if p == null or p.get("pot") == null or p.o >= p.pot or (p.get("a") != null and p.a > 22) or rnd() >= 0.15: return
			p.o += 1; p.xp = 0.0
			if p.get("estrela", false) and S.estrela != null: S.estrela.o = p.o
			noticia("%s evoluiu além do esperado e subiu para %d" % [p.n, p.o], g, "up")
		for q in S.games[g].squads.values():
			for p in q.slots: salto.call(p)
		for p in S.base.get(g, []): salto.call(p)
func promover_base(g, sq, id) -> Dictionary:
	var lst: Array = S.base.get(g, []); var i = -1
	for k in lst.size():
		if lst[k].id == id: i = k
	var q = S.games[g].squads[sq]
	if i < 0: return {"ok": false, "msg": "Jovem não encontrado."}
	if not q.on: return {"ok": false, "msg": "Ative esse time primeiro."}
	var p = lst[i]; var t = _vaga(q, g, p.r)
	if t < 0: return {"ok": false, "msg": "Sem vaga livre nesse time."}
	var np: Dictionary = p.duplicate(true); np["fee"] = 0; np["ct"] = CONTRATO; np["t"] = SQUADS[sq].nome.split(" (")[0]; np["l"] = S.org.nome
	q.slots[t] = np; lst.remove_at(i); log_("Promoveu %s da base" % p.n); save()
	return {"ok": true, "msg": "%s promovido da base." % p.n}
func _acha_base(g, id) -> int:
	var lst: Array = S.base.get(g, [])
	for k in lst.size():
		if lst[k].id == id: return k
	return -1
func vender_base(g, id) -> Dictionary:
	var i = _acha_base(g, id)
	if i < 0: return {"ok": false, "msg": "Jovem não encontrado."}
	var p = S.base[g][i]; var v = valor_venda(p); S.base[g].remove_at(i); S.org.caixa += v; log_("Vendeu %s da base por %s" % [p.n, money(v)]); save()
	return {"ok": true, "msg": "%s vendido por %s." % [p.n, money(v)]}
func dispensar_base(g, id) -> Dictionary:
	var i = _acha_base(g, id)
	if i < 0: return {"ok": false, "msg": "Jovem não encontrado."}
	var p = S.base[g][i]; S.base[g].remove_at(i); log_("Dispensou %s da base" % p.n); save()
	return {"ok": true, "msg": "%s dispensado da base." % p.n}
func contratos() -> void:
	for g in GAMES:
		for sq in SQUADS:
			var sl = S.games[g].squads[sq].slots
			for i in sl.size():
				var p = sl[i]
				if p == null: continue
				p.ct = (CONTRATO if p.get("ct") == null else p.ct) - 1
				if p.ct == 8: log_("Contrato de %s acaba em 8 semanas" % p.n)
				if p.ct <= 0:
					if p.get("estrela", false): S.estrela = null
					sl[i] = null; log_("%s saiu: contrato acabou" % p.n)
func salario_de(p) -> int: return jr(salary(p.o) * (0.4 if p.get("estrela", false) else 1.0))
func folha(g, sq) -> int:
	var t = 0
	for p in S.games[g].squads[sq].slots:
		if p != null: t += salario_de(p)
	return t
func titulares(g, sq) -> Array: return S.games[g].squads[sq].slots.slice(0, nT(g))
func prontos(g, sq) -> bool:
	var q = S.games[g].squads[sq]
	if not q.on: return false
	for p in titulares(g, sq):
		if p == null: return false
	return true
func forca(g, sq) -> float:
	var st = titulares(g, sq); var s = 0.0
	for p in st: s += 55.0 if p == null else float(p.o)
	return s / st.size() + infra_bonus(g) + bonus_temp(g) + bonus_equipe(g, sq) + staff_nivel("analista") * 0.5

# ---------- Competições ----------
func prob_vit(fa, fb) -> float: return 1.0 / (1.0 + exp(-(fa - fb) / 4.0))
func serie(n, fa, fb) -> Array:
	var alvo = int(ceil(n / 2.0)); var a = 0; var b = 0; var p = prob_vit(fa, fb)
	while a < alvo and b < alvo:
		if rnd() < p: a += 1
		else: b += 1
	return [a, b]
func round_robin(n) -> Array:
	var t = []
	for i in n: t.append(i)
	if n % 2: t.append(-1)
	var m = t.size(); var rounds = []
	for r in m - 1:
		var par = []
		for i in m / 2:
			var a = t[i]; var b = t[m - 1 - i]
			if a >= 0 and b >= 0: par.append([a, b])
		rounds.append(par); t.insert(1, t.pop_back())
	return rounds
func liga_sync(g = "lol") -> Dictionary:
	mundo_sync(); var k = regiao_de(g)
	if S.ligas.has(g) and S.ligas[g].reg == k:
		if S.ligas[g].mv != S.mundo.n: mundo_refrescar_liga(S.ligas[g], g)
		return S.ligas[g]
	var L = region(g)
	var cp = func(t): return {"n": t.n, "b": media_time(t.get("p")), "p": t.get("p")}
	var d1 = []; var d2 = []; var d3 = []
	for t in L.t1: d1.append(cp.call(t)); d3.append({"n": t.n + " Academy", "b": max(60.0, media_time(t.get("p")) - 8), "p": null})
	for t in L.t2: d2.append(cp.call(t))
	S.ligas[g] = {"reg": k, "mv": S.mundo.n, "d1": d1, "d2": d2, "d3": d3}
	return S.ligas[g]
func div_de(g, sq) -> Array:
	var Lg = liga_sync(g); return Lg.d1 if sq == "t1" else Lg.d2 if sq == "t2" else Lg.d3
func times_de(g, sq) -> Array:
	var out = []
	for t in div_de(g, sq): out.append({"n": t.n, "b": t.b, "f": t.b, "eu": false})
	out.append({"n": null, "b": 0, "f": 0, "eu": true}); return out
func nova_comp(g, sq) -> Dictionary:
	return {"reg": regiao_de(g), "game": g, "sq": sq, "teams": times_de(g, sq), "phase": "off", "wk": PRE, "split": 0, "round": 0, "sched": [], "w": [], "l": [], "po": null, "intl": null, "last": [], "hist": [], "aviso": false}
func comp_for(g, sq):
	if D(g) == null: return null
	var q = S.games[g].squads.get(sq)
	if q == null or not q.on: return null
	var k: String = g + "-" + sq; var c = S.comp.get(k)
	if c != null and c.reg == regiao_de(g): return c
	S.comp[k] = nova_comp(g, sq); return S.comp[k]
func nome_t(t) -> String: return S.org.nome if t.eu else t.n
func nome(c, i) -> String: return nome_t(c.teams[int(i)])
func f_t(c, t) -> float: return forca(c.game, c.sq) if t.eu else float(t.f)
func classificacao(c) -> Array:
	var rows = []
	for i in c.teams.size():
		var t = c.teams[i]; rows.append({"i": i, "n": nome_t(t), "w": c.w[i], "l": c.l[i], "f": f_t(c, t), "eu": t.eu})
	rows.sort_custom(func(a, b):
		if a.w != b.w: return a.w > b.w
		if a.l != b.l: return a.l < b.l
		if a.f != b.f: return a.f > b.f
		return a.i < b.i)
	for k in rows.size(): rows[k]["pos"] = k + 1
	return rows
func iniciar_split(c) -> void:
	c.split += 1; c.teams = times_de(c.game, c.sq)
	for t in c.teams:
		if not t.eu: t.f = t.b + (rnd() * 3 - 1.5)
	c.sched = round_robin(c.teams.size()); c.round = 0; c.phase = "reg"; c.po = null
	c.w = []; c.l = []
	for t in c.teams: c.w.append(0); c.l.append(0)
	c.aviso = false
	log_("%s %s (%s): split %d começou" % [GAMES[c.game].curto, SQUADS[c.sq].nome, c.reg, c.split])
func tag_de(g, sq) -> String: return "%s · %s" % [GAMES[g].curto, SQUADS[sq].nome.split(" (")[0]]
func elenco_de(g, sq) -> Array:
	var out = []; var st = titulares(g, sq)
	for i in st.size():
		if st[i] != null: out.append({"n": st[i].n, "r": GAMES[g].roles[i], "o": st[i].o})
	return out
func time_real(g, n):
	var d = D(g)
	if d == null: return null
	for k in d.leagues:
		for dv in ["t1", "t2"]:
			for t in d.leagues[k].get(dv, []):
				if t.n == n and t.get("p") != null: return t
	return null
func elenco_op(g, n) -> Array:
	var t = time_real(g, n); var roles = GAMES[g].roles; var out = []
	for i in roles.size():
		if t != null and i < t.p.size() and t.p[i] != null: out.append({"n": t.p[i][0], "r": roles[i], "o": t.p[i][1]})
		else: out.append({"n": "%s do %s" % [roles[i], n], "r": roles[i], "o": 70})
	return out
func jogo(c, T, a, b, n, fase, ctx, bonus) -> int:
	var sr = serie(n, f_t(c, T[a]), f_t(c, T[b])); var wa: int = sr[0]; var wb: int = sr[1]
	var venc = a if wa > wb else b
	var eu = -1
	for i in T.size():
		if T[i].eu: eu = i; break
	ult_serie = [wa, wb]
	if a == eu or b == eu:
		var op = b if a == eu else a; var meus = wa if a == eu else wb; var deles = wb if a == eu else wa
		c.last.push_front({"s": S.org.semana, "y": S.org.ano, "op": nome_t(T[op]), "v": venc == eu, "pl": "%d-%d" % [meus, deles], "f": fase})
		if c.last.size() > 8: c.last.resize(8)
		seguidores(1.012 if venc == eu else 0.997)
		if bonus and venc == eu: S.org.caixa += jr(SQUADS[c.sq].premio * 0.01)
		ctx.jogou = true
		var fm = f_t(c, T[eu]); var fo = f_t(c, T[op])
		ULT.append({"key": c.game + "-" + c.sq, "game": c.game, "sq": c.sq, "tag": tag_de(c.game, c.sq), "fase": fase, "bo": n, "euNome": S.org.nome, "op": nome_t(T[op]), "fMeu": fm, "fOp": fo, "p": prob_vit(fm, fo), "meus": meus, "deles": deles, "v": venc == eu, "s": S.org.semana, "y": S.org.ano, "meusJ": elenco_de(c.game, c.sq), "opJ": elenco_op(c.game, nome_t(T[op]))})
	return venc
func iniciar_playoffs(c) -> void:
	var rs = classificacao(c).map(func(r): return r.i); var seeds = rs.slice(0, 6)
	c.po = {"stage": 0, "seeds": seeds, "rs": rs, "res": [], "lugar": {}}
	c.po["pares"] = [[seeds[2], seeds[5]], [seeds[3], seeds[4]]]; c.phase = "po"
func jogar_playoffs(c, ctx) -> void:
	var po = c.po; var eu = -1
	for i in c.teams.size():
		if c.teams[i].eu: eu = i
	var nome_fase = "Final" if po.stage == 2 else ("Semifinal" if po.stage == 1 else "Quartas")
	var bo = 5 if po.stage == 2 else 3; var venc = []
	for par in po.pares:
		var a: int = par[0]; var b: int = par[1]
		var w = jogo(c, c.teams, a, b, bo, "Playoffs · " + nome_fase, ctx, true); var l = b if w == a else a
		venc.append(w); po.res.append({"st": po.stage, "a": a, "b": b, "w": w})
		po.lugar[str(l)] = "vice" if po.stage == 2 else ("semi" if po.stage == 1 else "quartas")
	if po.stage == 0:
		var ord = venc.duplicate(); ord.sort_custom(func(x, y): return po.seeds.find(y) < po.seeds.find(x))
		po.pares = [[po.seeds[0], ord[0]], [po.seeds[1], ord[1]]]; po.stage = 1
	elif po.stage == 1:
		po.pares = [[venc[0], venc[1]]]; po.stage = 2
	else: finalizar(c, venc[0], eu)
func finalizar(c, campeao, eu) -> void:
	var po = c.po; po.lugar[str(campeao)] = "campeao"; var vice = -1
	for k in po.lugar:
		if po.lugar[k] == "vice": vice = int(k); break
	var meu = po.lugar.get(str(eu))
	if meu == "campeao": seguidores(1.25); patro_titulo(c)
	if meu != null:
		var bolsa = jr(SQUADS[c.sq].premio * PREMIO_PCT[meu])
		S.org.caixa += bolsa
		S.org.rep = cl(S.org.rep + ganho_rep({"campeao": 0.3, "vice": 0.15, "semi": 0.08, "quartas": 0.04}[meu] * (1.0 if c.sq == "t1" else 0.3)), 0.5, 10)
		log_("%s %s: %s (+%s)" % [GAMES[c.game].curto, SQUADS[c.sq].nome, {"campeao": "CAMPEÃO", "vice": "vice-campeão", "semi": "semifinalista", "quartas": "eliminado nas quartas"}[meu], money(bolsa)])
	else:
		S.org.rep = cl(S.org.rep - 0.03 * (1.0 if c.sq == "t1" else 0.3), 0.5, 10); log_("%s %s: fora dos playoffs" % [GAMES[c.game].curto, SQUADS[c.sq].nome])
	c.hist.push_front({"y": S.org.ano, "s": c.split, "camp": nome(c, campeao), "vice": nome(c, vice), "eu": meu})
	feed("%s é campeão da liga principal de %s (%s)" % [nome(c, campeao), GAMES[c.game].curto, SQUADS[c.sq].nome] if vice < 0 else "%s bate %s e é campeão de %s" % [nome(c, campeao), nome(c, vice), GAMES[c.game].curto], c.game, "titulo", 3 if int(campeao) == int(eu) else 2)
	if c.hist.size() > 12: c.hist.resize(12)
	reg_final(c, campeao, vice, po, meu)
	var pr = func(i): return po.rs.find(i)
	var com = func(k):
		var r = []
		for x in po.lugar:
			if po.lugar[x] == k: r.append(int(x))
		r.sort_custom(func(x, y): return pr.call(x) < pr.call(y)); return r
	var ordem = [campeao, vice]; ordem.append_array(com.call("semi")); ordem.append_array(com.call("quartas"))
	for i in po.rs:
		if not po.lugar.has(str(i)) and i != campeao: ordem.append(i)
	c.po = null; c.phase = "off"
	if c.sq == "t1": gerar_base(c.game); evoluir(c.game)
	c.wk = max(2, CICLO - c.sched.size() - 3)
	if c.sq == "t1":
		var ks = intl_def(c.game).keys(); iniciar_intl(c, ks[0] if c.split % 2 == 1 else ks[1], ordem)
func sim_rapida(times) -> Array:
	var n: int = times.size(); var w = []; w.resize(n); w.fill(0)
	for rd in round_robin(n):
		for par in rd:
			var sr = serie(1, times[par[0]].f, times[par[1]].f); w[par[0] if sr[0] > sr[1] else par[1]] += 1
	var rs = []
	for i in n: rs.append(i)
	rs.sort_custom(func(a, b):
		if w[b] != w[a]: return w[b] < w[a]
		if times[b].f != times[a].f: return times[b].f < times[a].f
		return a < b)
	var s = rs.slice(0, 6)
	var v = func(a, b, bo):
		var sr = serie(bo, times[a].f, times[b].f); return a if sr[0] > sr[1] else b
	var q1: int = v.call(s[2], s[5], 3); var q2: int = v.call(s[3], s[4], 3)
	var ord = [q1, q2]; ord.sort_custom(func(x, y): return s.find(y) < s.find(x))
	var f1: int = v.call(s[0], ord[0], 3); var f2: int = v.call(s[1], ord[1], 3)
	var pl = serie(5, times[f1].f, times[f2].f); var camp = f1 if pl[0] > pl[1] else f2; var vice = f2 if camp == f1 else f1
	var semis = [s[0], ord[0], s[1], ord[1]].filter(func(x): return x != f1 and x != f2)
	semis.sort_custom(func(x, y): return rs.find(x) < rs.find(y))
	var quartas = []
	for k in 2:
		var base = [s[2], s[3]][k]; var alt = [s[5], s[4]][k]; var qq: int = [q1, q2][k]
		quartas.append(alt if base == qq else base)
	quartas.sort_custom(func(x, y): return rs.find(x) < rs.find(y))
	var dentro = {camp: true, vice: true}
	for x in semis: dentro[x] = true
	for x in quartas: dentro[x] = true
	var res = [camp, vice]; res.append_array(semis); res.append_array(quartas)
	for i in rs:
		if not dentro.has(i): res.append(i)
	sim_pl = "%d-%d" % [max(pl[0], pl[1]), min(pl[0], pl[1])]
	return res
var sim_pl = ""   # placar da final da última sim_rapida
func sortear(arr) -> Array:
	var a = arr.duplicate()
	var i = a.size() - 1
	while i > 0:
		var j = floori(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; i -= 1
	return a
func iniciar_intl(c, tipo, ordem) -> void:
	var I = intl_def(c.game)[tipo]; var q = []
	for reg in I.vagas:
		if reg == c.reg:
			for k in min(int(I.vagas[reg]), ordem.size()):
				var t = c.teams[ordem[k]]
				q.append({"n": null, "f": 0, "eu": true, "reg": reg} if t.eu else {"n": t.n, "f": t.f, "eu": false, "reg": reg})
		else:
			var times = []
			for t in D(c.game).leagues[reg].t1: times.append({"n": t.n, "f": media_time(t.get("p")) + rnd() * 3 - 1.5})
			var ord = sim_rapida(times); var pl = sim_pl; reg_simul(c.game, reg, c.split, times, ord, pl)
			for k in min(int(I.vagas[reg]), ord.size()): q.append({"n": times[ord[k]].n, "f": times[ord[k]].f, "eu": false, "reg": reg})
	var T = sortear(q); var alive = []
	for i in T.size(): alive.append(i)
	var intl = {"tipo": tipo, "teams": T, "alive": alive, "res": [], "lugar": {}}
	var tem_eu = false
	for t in T:
		if t.eu: tem_eu = true
	c.intl = intl
	if tem_eu: c.phase = "intl"; log_("%s: classificado para o %s!" % [GAMES[c.game].curto, I.nome]); return
	while intl.alive.size() > 1: etapa_intl(c, intl, {"jogou": false})
	finalizar_intl(c, intl)
func etapa_intl(c, intl, ctx) -> void:
	var n: int = intl.alive.size(); var I = intl_def(c.game)[intl.tipo]
	var fase = "Final" if n == 2 else "Semifinal" if n == 4 else "Quartas" if n == 8 else "Oitavas"; var bo = 5 if n <= 4 else 3; var venc = []
	for k in range(0, n, 2):
		var a: int = intl.alive[k]; var b: int = intl.alive[k + 1]; var w = jogo(c, intl.teams, a, b, bo, I.nome + " · " + fase, ctx, false)
		venc.append(w); intl.res.append({"st": fase, "a": a, "b": b, "w": w}); intl.lugar[str(b if w == a else a)] = "vice" if n == 2 else "semi" if n == 4 else "quartas" if n == 8 else "oitavas"
	intl.alive = venc
func finalizar_intl(c, intl) -> void:
	var I = intl_def(c.game)[intl.tipo]; var camp: int = intl.alive[0]; var eu = -1
	for i in intl.teams.size():
		if intl.teams[i].eu: eu = i
	intl.lugar[str(camp)] = "campeao"; var meu = intl.lugar.get(str(eu))
	if meu == "campeao": seguidores(1.5)
	if meu != null:
		var bolsa = jr(I.bolsa * PCT_INTL[meu]); S.org.caixa += bolsa; S.org.rep = cl(S.org.rep + ganho_rep(I.rep * PCT_INTL[meu] * 2), 0.5, 10)
		log_("%s %s: %s (+%s)" % [GAMES[c.game].curto, I.nome, {"campeao": "CAMPEÃO", "vice": "vice-campeão", "semi": "semifinalista", "quartas": "eliminado nas quartas", "oitavas": "eliminado nas oitavas"}[meu], money(bolsa)])
	else: log_("%s %s %d: campeão %s" % [GAMES[c.game].curto, I.nome, S.org.ano, nome_t(intl.teams[camp])])
	S.intlHist.push_front({"g": c.game, "nome": I.nome, "y": S.org.ano, "tipo": intl.tipo, "camp": nome_t(intl.teams[camp]), "reg": intl.teams[camp].get("reg"), "eu": meu})
	if S.intlHist.size() > 30: S.intlHist.resize(30)
	reg_intl(c, intl, camp, meu)
	c.intl = null; c.phase = "off"; c.wk = max(2, CICLO - c.sched.size() - 3 - I.semanas)
	if intl.tipo == intl_def(c.game).keys()[1]: promo_rebaixa(c)
func promo_rebaixa(c) -> void:
	var Lg = liga_sync(c.game)
	if Lg.d2.is_empty(): return
	var rs = classificacao(c).map(func(r): return r.i) if c.teams.size() else []
	var pior = null; rs.reverse()
	for i in rs:
		if not c.teams[i].eu: pior = c.teams[i]; break
	var sobe = null; var c2 = S.comp.get(c.game + "-t2")
	if c2 != null and c2.hist.size() and c2.hist[0].y == S.org.ano:
		for t in Lg.d2:
			if t.n == c2.hist[0].camp: sobe = c2.hist[0].camp
	if sobe == null:
		var times = []
		for t in Lg.d2: times.append({"n": t.n, "f": t.b + rnd() * 3 - 1.5})
		sobe = times[sim_rapida(times)[0]].n
	var out = null; var up = null
	if pior != null:
		for t in Lg.d1:
			if t.n == pior.n: out = t
	for t in Lg.d2:
		if t.n == sobe: up = t
	if out == null or up == null: return
	Lg.d1 = Lg.d1.filter(func(t): return t != out); Lg.d1.append(up); Lg.d2 = Lg.d2.filter(func(t): return t != up); Lg.d2.append(out)
	log_("Fim do ano: %s sobe para o T1 e %s cai para o T2" % [up.n, out.n])
func semana_comp(c) -> bool:
	var ctx = {"jogou": false}
	if c.phase == "off":
		c.wk -= 1
		if c.wk > 0: return false
		c.phase = "wait"
	if c.phase == "wait":
		if prontos(c.game, c.sq): iniciar_split(c)
		elif not c.aviso: c.aviso = true; log_("%s: split à espera, complete os titulares para se inscrever" % SQUADS[c.sq].nome)
		return false
	if c.phase == "reg":
		for par in c.sched[c.round]:
			var a: int = par[0]; var b: int = par[1]
			var w = jogo(c, c.teams, a, b, 1, "Rodada %d" % (c.round + 1), ctx, true); c.w[w] += 1; c.l[b if w == a else a] += 1
		c.round += 1
		if c.round >= c.sched.size(): iniciar_playoffs(c)
	elif c.phase == "po": jogar_playoffs(c, ctx)
	elif c.phase == "intl":
		etapa_intl(c, c.intl, ctx)
		if c.intl.alive.size() == 1: finalizar_intl(c, c.intl)
	return ctx.jogou

# ---------- Registro histórico (2027+) ----------
func placar_s() -> String:
	if ult_serie == null: return ""
	return "%d-%d" % [max(ult_serie[0], ult_serie[1]), min(ult_serie[0], ult_serie[1])]
func kind_intl(g, t) -> String: return "w" if intl_def(g).keys().find(t) == 1 else "a"
func roster_of(g, nm, sq = null) -> Array:  # [[nick, nota, papel, país]]
	var out = []
	if nm == null: return out
	if nm == S.org.nome:
		var q = S.games[g].squads[sq if sq != null else "t1"]
		if q != null and q.on:
			for i in nT(g):
				var p = q.slots[i]
				if p != null: out.append([p.n, p.o, i, p.get("c") if p.get("c") != null else ""])
		return out
	var d = D(g); var lg = S.ligas.get(g); var fontes = []
	if lg != null: fontes.append_array([lg.d1, lg.d2, lg.d3])
	for k in d.leagues: fontes.append(d.leagues[k].t1); fontes.append(d.leagues[k].get("t2", []))
	for L in fontes:
		for t in L:
			if t.n == nm and t.get("p") != null:
				var i = 0
				for p in t.p:
					out.append([p[0], p[1], i, p[3] if p.size() > 3 and p[3] != null else ""]); i += 1
				return out
	return out
func mvp_de(ros):
	if ros.is_empty(): return null
	var w = []; var tot = 0.0
	for p in ros: var x = pow(max(1, p[1] - 45), 3); w.append(x); tot += x
	var r = rnd() * tot; var i = 0
	while i < ros.size() - 1:
		r -= w[i]
		if r <= 0: break
		i += 1
	return ros[i]
func honra(g, n, k, v, d) -> void:
	if not S.hon.has(g): S.hon[g] = {}
	if not S.hon[g].has(n): S.hon[g][n] = {}
	var h = S.hon[g][n]
	if k == "l" or k == "t": h[k] = max(0, h.get(k, 0) + d)
	else:
		if not h.has(k): h[k] = []
		var a: Array = h[k]
		if d > 0: a.append(v)
		else:
			var js = JSON.stringify(v)
			for i in a.size():
				if JSON.stringify(a[i]) == js: a.remove_at(i); break
func pontua(g, n, p) -> void:
	if p == 0: return
	if not S.pts.has(g): S.pts[g] = {}
	S.pts[g][n] = S.pts[g].get(n, 0) + p
func reg_push(g, rec, kind, rs) -> void:
	var y: int = S.org.ano
	if y < ANO_SIM: return
	var ys = str(y)
	if not S.reg.has(g): S.reg[g] = {}
	if not S.reg[g].has(ys): S.reg[g][ys] = []
	var L: Array = S.reg[g][ys]; var i = -1
	for k in L.size():
		var x = L[k]
		if x.k == rec.k and x.t == rec.t and x.get("sp") == rec.get("sp") and x.get("q") == rec.get("q"): i = k; break
	if i >= 0:
		var o = L[i]
		for n in o.get("r", []): honra(g, n, kind, y, -1)
		if o.get("m") != null and kind != "l": honra(g, o.m[0], "v", [y, kind], -1)
		L.remove_at(i)
	elif rec.k == "r" and L.size() >= REG_MAX: return
	var P: Array = {"w": [10, 4, 2, 6], "a": [5, 2, 1, 3], "l": [2, 1, 0, 1.5]}[kind]
	for p in rs.c: pontua(g, p[0], P[0]); honra(g, p[0], kind, y, 1)
	for p in rs.v: pontua(g, p[0], P[1])
	for a in rs.s:
		for p in a: pontua(g, p[0], P[2])
	if rec.get("m") != null:
		pontua(g, rec.m[0], P[3])
		if kind != "l": honra(g, rec.m[0], "v", [y, kind], 1)
	if kind != "l": rec["r"] = rs.c.map(func(p): return p[0])
	L.append(rec)
func _rec(d: Dictionary) -> Dictionary:  # remove chaves com valor nulo (como undefined no JS)
	for k in d.keys():
		if d[k] == null: d.erase(k)
	return d
func reg_final(c, campeao, vice, po, meu) -> void:
	if S.org.ano < ANO_SIM: return
	var g = c.game; var sp = 1 if c.split % 2 == 1 else 2; var q = c.sq
	var sem = []
	for k in po.lugar:
		if po.lugar[k] == "semi": sem.append(int(k))
	var nm = func(i): return nome(c, i)
	var ros = func(i): return roster_of(g, nome(c, i), q)
	var m = mvp_de(ros.call(campeao))
	var rec = _rec({"k": "r", "t": c.reg, "q": null if q == "t1" else q, "sp": sp, "c": nome(c, campeao), "v": nome(c, vice), "s": sem.map(nm), "m": [m[0], nome(c, campeao)] if m != null else null, "p": placar_s(), "eu": meu})
	reg_push(g, rec, "l", {"c": ros.call(campeao), "v": ros.call(vice), "s": sem.map(ros)})
func reg_simul(g, reg, split, times, ord, pl) -> void:
	if S.org.ano < ANO_SIM or not D(g).leagues.has(reg): return
	var sp = 1 if split % 2 == 1 else 2
	var nm = func(i): return times[i].n
	var ros = func(i): return roster_of(g, times[i].n)
	var m = mvp_de(ros.call(ord[0])); var sem = [ord[2], ord[3]]
	reg_push(g, _rec({"k": "r", "t": reg, "sp": sp, "c": nm.call(ord[0]), "v": nm.call(ord[1]), "s": sem.map(nm), "m": [m[0], nm.call(ord[0])] if m != null else null, "p": pl}), "l", {"c": ros.call(ord[0]), "v": ros.call(ord[1]), "s": sem.map(ros)})
func reg_intl(c, intl, camp, meu) -> void:
	if S.org.ano < ANO_SIM: return
	var g = c.game; var T = intl.teams
	var nm = func(i): return nome_t(T[i])
	var ros = func(i): return roster_of(g, nome_t(T[i]), "t1")
	var vice = -1; var sem = []
	for k in intl.lugar:
		if intl.lugar[k] == "vice": vice = int(k)
		if intl.lugar[k] == "semi": sem.append(int(k))
	var m = mvp_de(ros.call(camp))
	reg_push(g, _rec({"k": "i", "t": intl.tipo, "c": nome_t(T[camp]), "v": nome_t(T[vice]), "s": sem.map(nm), "m": [m[0], nome_t(T[camp])] if m != null else null, "p": placar_s(), "eu": meu}), kind_intl(g, intl.tipo), {"c": ros.call(camp), "v": ros.call(vice), "s": sem.map(ros)})
func sim_intl_off(g, ti) -> void:
	var d = D(g)
	if d == null or S.org.ano < ANO_SIM: return
	var ks: Array = intl_def(g).keys(); var tipo = ks[ti]; var I = intl_def(g)[tipo]; var q = []; var reg0 = regiao_de(g)
	var lg = S.ligas.get(g)
	if lg != null and lg.reg != reg0: lg = null
	for reg in I.vagas:
		var L = d.leagues.get(reg)
		if L == null: continue
		var times = []
		for t in (lg.d1 if (reg == reg0 and lg != null) else L.t1): times.append({"n": t.n, "f": media_time(t.get("p")) + rnd() * 3 - 1.5})
		var ord = sim_rapida(times); var pl = sim_pl
		reg_simul(g, reg, ti + 1, times, ord, pl)
		for k in min(int(I.vagas[reg]), ord.size()): q.append({"n": times[ord[k]].n, "f": times[ord[k]].f, "eu": false, "reg": reg})
	if q.size() < 2: return
	var T = sortear(q); var alive = []
	for i in T.size(): alive.append(i)
	var intl = {"tipo": tipo, "teams": T, "alive": alive, "res": [], "lugar": {}}; var c = {"game": g, "sq": "t1", "reg": reg0, "teams": T, "last": []}
	while intl.alive.size() > 1: etapa_intl(c, intl, {"jogou": false})
	intl.lugar[str(intl.alive[0])] = "campeao"; reg_intl(c, intl, intl.alive[0], null)
func reg_semana() -> void:
	var w: int = S.org.semana
	if S.org.ano < ANO_SIM or (w != 20 and w != 46): return
	for g in GAMES:
		if not ativo(g) or S.games[g].squads.t1.on: continue
		sim_intl_off(g, 0 if w == 20 else 1)
func calc_bo(g, y) -> void:
	var d = D(g); var pts: Dictionary = S.pts.get(g, {}); var roles = GAMES[g].roles; var cand = {}; var lg = S.ligas.get(g)
	var add = func(n, o, r, t, c):
		var sc: float = (o - 60) * 0.9 + pts.get(n, 0) + (rnd() + rnd() - 1) * 3
		if not cand.has(n) or cand[n].sc < sc: cand[n] = {"n": n, "o": o, "r": r, "t": t, "c": c if c != null else "", "sc": sc}
	for k in d.leagues:
		var src = lg.d1 if (lg != null and lg.reg == k) else d.leagues[k].t1
		for t in src:
			var i = 0
			for p in (t.get("p") if t.get("p") != null else []):
				add.call(p[0], p[1], i, t.n, p[3] if p.size() > 3 else null); i += 1
	var q = S.games[g].squads.t1
	if q.on:
		for i in roles.size():
			var p = q.slots[i]
			if p != null: add.call(p.n, p.o, i, S.org.nome, p.get("c"))
	var arr: Array = cand.values(); arr.sort_custom(func(a, b): return a.sc > b.sc)
	var top = arr.slice(0, 10); var toy = []
	for i in roles.size():
		for x in arr:
			if x.r == i: toy.append([roles[i], x.n, x.t]); break
	if not S.bo.has(g): S.bo[g] = {}
	S.bo[g][str(y)] = {"t": top.map(func(x): return [x.n, x.t, x.o, jr(x.sc), x.r, x.c]), "a": toy}
	for i in top.size():
		honra(g, top[i].n, "t", 0, 1)
		if i == 0: honra(g, top[i].n, "b", y, 1)
func reg_fim_ano(y) -> void:
	if y < ANO_SIM: return
	for g in GAMES:
		if ativo(g): calc_bo(g, y)
	S.pts = {}
	for g in S.reg.keys():
		for a in S.reg[g].keys():
			if int(a) < y - REG_ANOS:
				var L: Array = S.reg[g][a].filter(func(x): return x.k == "i")
				if L.size(): S.reg[g][a] = L
				else: S.reg[g].erase(a)
const TPMAP := {"cs2": {"A": "IEM", "B": "Major"}, "dota2": {"A": "Major", "B": "TI"}, "valorant": {"A": "Masters", "B": "Champions"}, "ff": {"A": "EWC", "B": "Mundial"}, "r6": {"A": "Major", "B": "SI"}, "fifa": {"A": "EWC", "B": "Mundial"}, "wr": {"A": "Horizon", "B": "Icons"}, "lol": {"MSI": "MSI", "WORLDS": "WORLDS"}}
const PTS_BO := [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
func nome_reg(g, x, y) -> String:
	if x.k == "i": return "%s %d" % [intl_def(g)[x.t].nome, y]
	var lgn = D(g).leagues.get(x.t, {}).get("nome", x.t)
	return "%s%s %d Split %d" % [lgn, " T2" if x.get("q") == "t2" else " Academy" if x.get("q") == "acad" else "", y, x.sp]
func hist_de(g) -> Dictionary:
	var R: Dictionary = S.reg.get(g, {}); var tor = []; var bo = {}; var toy = {}
	var anos = R.keys().map(func(a): return int(a)); anos.sort()
	for y in anos:
		for x in R[str(y)]:
			var tp = (TPMAP.get(g, {}).get(x.t, x.t)) if x.k == "i" else "REG"
			tor.append({"n": nome_reg(g, x, y), "a": y, "tp": tp, "c": S.org.nome if x.get("eu") == "campeao" else x.c, "v": S.org.nome if x.get("eu") == "vice" else x.v, "p": x.get("p", ""), "mvp": x.get("m"), "s": x.get("s", []), "eu": x.get("eu"), "sim": 1, "k": x.k, "t": x.t, "sp": x.get("sp")})
	for y in S.bo.get(g, {}):
		var B = S.bo[g][y]; var arr = []
		for i in B.t.size(): arr.append([B.t[i][0], B.t[i][5] if B.t[i].size() > 5 else "", PTS_BO[i], B.t[i][2], B.t[i][1]])
		bo[y] = arr; toy[y] = B.a
	return {"torneios": tor, "bo": bo, "toy": toy, "hon": S.hon.get(g, {})}

# ---------- Calendário ----------
const MDN := [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MES := ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
func data_de(semana, ano, dia = 6) -> Dictionary:
	var doy: int = min(365, (semana - 1) * 7 + dia); var m = 0; var doy0 = doy
	while doy > MDN[m]: doy -= MDN[m]; m += 1
	return {"d": doy, "m": m, "y": ano, "doy": doy0, "txt": "%d %s" % [doy, MES[m]]}
func em_semanas(em) -> Dictionary:
	var abs_: int = S.org.semana + em; return {"semana": ((abs_ - 1) % 52) + 1, "ano": S.org.ano + (abs_ - 1) / 52}
func agenda(g, sq, n = 8) -> Array:
	var c = comp_for(g, sq)
	if c == null: return []
	var eu = -1
	for i in c.teams.size():
		if c.teams[i].eu: eu = i
	var out = []
	var push = func(em, tipo, label, op = null):
		var w = em_semanas(em); out.append({"em": em, "tipo": tipo, "label": label, "op": op, "semana": w.semana, "ano": w.ano, "data": data_de(w.semana, w.ano)})
	var tot: int = c.sched.size() if c.sched.size() else (c.teams.size() if c.teams.size() % 2 else c.teams.size() - 1)
	var em0 = null; var k0 = 0; var split: int = c.split
	if c.phase == "off": em0 = c.wk + 1; split += 1; push.call(c.wk, "ini", "Início do split %d" % split)
	elif c.phase == "wait": em0 = 2; split += 1; push.call(1, "ini", "Início do split %d" % split)
	elif c.phase == "reg": em0 = 1; k0 = c.round
	var em = em0
	if em0 != null:
		for k in range(k0, tot):
			var par = null
			if k < c.sched.size():
				for pr in c.sched[k]:
					if pr[0] == eu or pr[1] == eu: par = pr
			var op = nome_t(c.teams[par[1] if par[0] == eu else par[0]]) if par != null else null
			if k < c.sched.size() and par == null: push.call(em, "folga", "Rodada %d" % (k + 1), "Folga")
			else: push.call(em, "jogo", "Rodada %d" % (k + 1), op)
			em += 1
		for i in 3: push.call(em + i, "po", "Playoffs · " + ["Quartas", "Semifinal", "Final"][i], "se classificar")
		em += 3
	elif c.phase == "po":
		var st: int = c.po.stage
		for i in 3:
			if i >= st: push.call(i - st + 1, "po", "Playoffs · " + ["Quartas", "Semifinal", "Final"][i], "a seguir" if i == st else null)
		em = 3 - st + 1
	elif c.phase == "intl":
		push.call(1, "int", intl_def(c.game)[c.intl.tipo].nome, "%d times vivos" % c.intl.alive.size()); em = 2
	if c.sq == "t1" and c.phase != "intl":
		var ks: Array = intl_def(c.game).keys(); var sp: int = c.split if (c.phase == "reg" or c.phase == "po") else split
		push.call(em, "int", intl_def(c.game)[ks[0 if sp % 2 == 1 else 1]].nome, "se classificar")
	return out.filter(func(x): return x.em >= 1).slice(0, n)

# ---------- Partida (espiar, narrar) ----------
const FMT := {"lol": "moba", "wr": "moba", "dota2": "moba", "cs2": "rounds", "valorant": "rounds", "r6": "rounds", "ff": "ff", "fifa": "gols"}
func motivo_partida(p) -> String: return "Partida: %s vs %s%s" % [p[0].tag, p[0].op, (" (+%d na fila)" % (p.size() - 1)) if p.size() > 1 else ""]
func pendente_de(c):
	var T = c.teams; var a = null; var b = null; var bo = 1; var fase = ""
	if c.phase == "reg":
		var par = null
		for pr in c.sched[c.round]:
			if T[pr[0]].eu or T[pr[1]].eu: par = pr
		if par == null: return null
		a = par[0]; b = par[1]; fase = "Rodada %d" % (c.round + 1)
	elif c.phase == "po":
		var po = c.po; var par = null
		for pr in po.pares:
			if T[pr[0]].eu or T[pr[1]].eu: par = pr
		if par == null: return null
		a = par[0]; b = par[1]; fase = "Playoffs · " + ("Final" if po.stage == 2 else "Semifinal" if po.stage == 1 else "Quartas"); bo = 5 if po.stage == 2 else 3
	elif c.phase == "intl":
		var intl = c.intl; var n: int = intl.alive.size(); T = intl.teams
		for k in range(0, n, 2):
			var x = intl.alive[k]; var y = intl.alive[k + 1]
			if T[x].eu or T[y].eu: a = x; b = y
		if a == null: return null
		fase = intl_def(c.game)[intl.tipo].nome + " · " + ("Final" if n == 2 else "Semifinal" if n == 4 else "Quartas" if n == 8 else "Oitavas"); bo = 5 if n <= 4 else 3
	else: return null
	var eu = a if T[a].eu else b; var op = b if eu == a else a; var fm = f_t(c, T[eu]); var fo = f_t(c, T[op])
	return {"key": c.game + "-" + c.sq, "game": c.game, "sq": c.sq, "tag": tag_de(c.game, c.sq), "fase": fase, "bo": bo, "euNome": S.org.nome, "op": nome_t(T[op]), "opReg": T[op].get("reg"), "fMeu": fm, "fOp": fo, "p": prob_vit(fm, fo),
		"tipo": "reg" if c.phase == "reg" else "po" if c.phase == "po" else "intl", "fmt": FMT[c.game]}
func partidas_semana() -> Array:
	var out = []
	for g in GAMES:
		if not ativo(g): continue
		for sq in SQUADS:
			var c = comp_for(g, sq)
			if c == null: continue
			var p = pendente_de(c)
			if p != null: out.append(p)
	return out
const MAPAS := {"cs2": ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Overpass"], "valorant": ["Ascent", "Haven", "Bind", "Split", "Lotus", "Sunset", "Icebox", "Abyss"], "r6": ["Bank", "Clubhouse", "Consulate", "Kafe", "Oregon", "Chalet", "Skyscraper", "Villa"]}
const MOMENTOS_LOL := ["Barão roubado por {p}! {t} vira o jogo", "Pentakill de {p}!", "Solo kill de {p} no meio da rota", "First blood de {p}", "Teamfight decisivo: {t} leva 4 por 1", "Alma do dragão dá a vantagem ao {t}", "{p} salva o time com um flash perfeito", "Gank certeiro de {p} muda o mapa"]
const MOMENTOS := {
	"dota2": ["Roshan roubado por {p}!", "Rampage de {p}!", "Buyback decisivo de {p}", "Teamfight espetacular: {t} limpa o time inimigo", "{p} acerta o Ravage perfeito", "Torre de T3 cai: {t} abre o high ground"],
	"cs2": ["Clutch 1v3 de {p}!", "Ace de {p}!", "AWP de {p} abre o round", "Retake perfeito do {t}", "Round de eco vira vitória do {t}", "{p} faz um 4K de pistola"],
	"valorant": ["Clutch 1v3 de {p}!", "Ace de {p}!", "Defuse no último segundo por {p}", "Ultimate de {p} vira o round", "Retake perfeito do {t}"],
	"r6": ["Clutch 1v2 de {p}!", "Ace de {p}!", "Plant com 5 vivos: {t} controla o mapa", "Rappel surpresa de {p} desmonta a defesa", "Hard breach de {p} abre o site"],
	"ff": ["{p} derruba 3 de uma vez na zona", "Rotação perfeita do {t} para o círculo final", "Granada de {p} limpa o squad inimigo", "{p} assume a liderança e carrega o squad", "Emote de {p} depois do knock: o {t} está voando"],
}
func _momentos_de(g) -> Array: return MOMENTOS_LOL if (g == "lol" or g == "wr") else MOMENTOS[g]
func narrar(d) -> Dictionary:  # monta o "filme" da partida a partir do resultado já decidido; não usa o sorteio do jogo
	var R = rngf(fnv("%s|%d|%d|%s|%s|%d-%d" % [d.key, d.y, d.s, d.op, d.fase, d.meus, d.deles])); var fmt: String = FMT[d.game]
	var ri = func(a, b): return a + floori(R.call() * (b - a + 1))
	var eq = "m" if d.v else "o"
	var nm = func(l): return d.euNome if l == "m" else d.op
	var pl = func(l): return d.get("meusJ", []) if l == "m" else d.get("opJ", [])
	var total: int = d.meus + d.deles
	var sh = func(a):
		var i: int = a.size() - 1
		while i > 0:
			var j = floori(R.call() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; i -= 1
		return a
	var pick = func(a): return a[floori(R.call() * a.size())]
	var w_min: int = min(d.meus, d.deles); var lst = []
	for i in total - 1: lst.append("x" if i < w_min else "w")
	sh.call(lst); var ord = []
	for k in lst: ord.append(eq if k == "w" else ("o" if eq == "m" else "m"))
	ord.append(eq)
	var mapas: Array = sh.call(MAPAS[d.game].duplicate()) if MAPAS.has(d.game) else []
	var jogos = []
	for i in ord.size():
		var w: String = ord[i]; var l = "o" if w == "m" else "m"
		var so = func(x, y): return [x, y] if w == "m" else [y, x]
		if fmt == "moba":
			var esc = 0.6 if d.game == "wr" else 1.0; var kW = jr((12 + ri.call(0, 16)) * esc); var apertado: bool = R.call() < 0.2
			var kL: int = kW + ri.call(1, 4) if apertado else max(2, kW - ri.call(3, jr(14 * esc)))
			var tW: int = ri.call(8, 11); var tL: int = ri.call(0, 6)
			var mn: int = ri.call(11, 19) if d.game == "wr" else ri.call(30, 46) if d.game == "dota2" else ri.call(25, 40)
			var kk: Array = so.call(kW, kL); var tt: Array = so.call(tW, tL)
			jogos.append({"lbl": "Jogo %d" % (i + 1), "sub": "%d min" % mn, "venc": w, "m": [{"n": "Abates", "a": kk[0], "b": kk[1], "live": 1}, {"n": "Torres", "a": tt[0], "b": tt[1], "live": 1}]})
		elif fmt == "rounds":
			var alvo = 7 if d.game == "r6" else 13; var ot: bool = R.call() < 0.12
			var wr: int = ((16 if d.game == "cs2" else 8 if d.game == "r6" else 14 + ri.call(0, 1)) if ot else alvo)
			var lr: int = ((12 + ri.call(0, 2) if d.game == "cs2" else wr - 2) if ot else ri.call(min(2, alvo - 1), alvo - 1 - (0 if d.game == "r6" else 1)))
			var seq = []
			for k in wr - 1: seq.append(w)
			for k in lr: seq.append(l)
			sh.call(seq); seq.append(w)
			var rr: Array = so.call(wr, lr)
			jogos.append({"lbl": "Mapa %d" % (i + 1), "sub": mapas[i % mapas.size()] + (" · prorrogação" if ot else ""), "venc": w, "seq": seq, "m": [{"n": "Rounds", "a": rr[0], "b": rr[1], "seq": 1}]})
		elif fmt == "ff":
			var pw: int = 1 if R.call() < 0.4 else ri.call(2, 4); var pp = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]; var pl2: int = min(12, pw + ri.call(1, 7))
			var kW: int = ri.call(3, 12); var kL: int = ri.call(1, 11)
			if pp[pw - 1] + kW <= pp[pl2 - 1] + kL: kW = pp[pl2 - 1] + kL - pp[pw - 1] + 1
			var a1: Array = so.call(pw, pl2); var a2: Array = so.call(kW, kL); var a3: Array = so.call(pp[pw - 1] + kW, pp[pl2 - 1] + kL)
			jogos.append({"lbl": ("Queda %d" % (i + 1)) if total > 1 else "Partida da rodada", "sub": "Booyah!" if pw == 1 else "%dº lugar" % pw, "venc": w, "booyah": pw == 1, "m": [{"n": "Pontos", "a": a3[0], "b": a3[1], "live": 1}, {"n": "Abates", "a": a2[0], "b": a2[1], "live": 1}, {"n": "Posição", "a": a1[0], "b": a1[1], "fixo": 1, "pos": 1}]})
		else:
			var gW: int = ri.call(1, 4); var gL: int = ri.call(0, gW - 1); var gg: Array = so.call(gW, gL); var gols = []
			for k in gW: gols.append([ri.call(3, 90), w])
			for k in gL: gols.append([ri.call(3, 90), l])
			gols.sort_custom(func(x, y): return x[0] < y[0])
			jogos.append({"lbl": ("Jogo %d" % (i + 1)) if total > 1 else "Partida", "sub": "90 min", "venc": w, "gols": gols, "m": [{"n": "Gols", "a": gg[0], "b": gg[1], "live": 1, "gols": 1}]})
	var momentos = []; var nM: int = min(5, 3 + ri.call(0, 2)); var usados = {}
	var jogador = func(l, melhor):
		var a: Array = pl.call(l)
		if a.is_empty(): return nm.call(l)
		if melhor:
			var b = a.duplicate(); b.sort_custom(func(x, y): return x.o > y.o); b = b.slice(0, 2)
			return b[floori(R.call() * min(2, a.size()))].n
		return a[floori(R.call() * a.size())].n
	if fmt == "gols":
		var todos = []
		for gi in jogos.size():
			for gl in jogos[gi].gols: todos.append({"g": gi, "p": gl[0] / 90.0, "lado": gl[1], "min": gl[0]})
		var esc: Array
		if todos.size() <= nM: esc = todos
		else:
			var meio: Array = sh.call(todos.slice(1, todos.size() - 1)).slice(0, nM - 2); esc = [todos[0], todos[todos.size() - 1]]; esc.append_array(meio)
		esc.sort_custom(func(x, y): return x.g < y.g or (x.g == y.g and x.p < y.p))
		for x in esc:
			var p: String = jogador.call(x.lado, true); var t: String = nm.call(x.lado); var txt: String
			if x.min >= 88: txt = "Gol nos acréscimos de %s! (%s)" % [p, t]
			else: txt = pick.call(["Gol de %s aos %d' (%s)" % [p, x.min, t], "Golaço de %s de fora da área aos %d'" % [p, x.min], "Pênalti convertido por %s aos %d'" % [p, x.min], "%s desvia de cabeça e balança a rede aos %d'" % [p, x.min]])
			momentos.append({"g": x.g, "p": x.p, "lado": x.lado, "txt": txt})
		while momentos.size() < 3:
			var gi: int = ri.call(0, jogos.size() - 1); var l: String = pick.call(["m", "o"]); var p: String = jogador.call(l, true)
			momentos.append({"g": gi, "p": 0.2 + R.call() * 0.6, "lado": l, "txt": pick.call(["Defesa milagrosa de %s" % p, "Bola na trave de %s!" % p, "%s controla o ritmo no meio" % p])})
	else:
		var tpl = _momentos_de(d.game)
		for k in nM - 1:
			var gi: int = 0 if k == 0 else ri.call(0, jogos.size() - 1)
			var l: String = jogos[gi].venc if R.call() < 0.62 else ("o" if jogos[gi].venc == "m" else "m"); var t: String
			t = pick.call(tpl)
			while usados.has(t) and usados.size() < tpl.size(): t = pick.call(tpl)
			usados[t] = true
			momentos.append({"g": gi, "p": 0.12 + R.call() * 0.7, "lado": l, "txt": t.replace("{p}", jogador.call(l, false)).replace("{t}", nm.call(l))})
		var suf = "a série!" if total > 1 else "a partida!"
		var fim: String = "Booyah! {t} leva os pontos da rodada!" if fmt == "ff" else ("Nexus caindo: {t} fecha " if fmt == "moba" else "Round final: {t} fecha ") + suf
		momentos.append({"g": jogos.size() - 1, "p": 0.93, "lado": eq, "txt": fim.replace("{t}", nm.call(eq))})
	momentos.sort_custom(func(x, y): return x.g < y.g or (x.g == y.g and x.p < y.p))
	var lm: String = eq if R.call() < 0.85 else ("o" if eq == "m" else "m")
	var a: Array = pl.call(lm)
	if a.is_empty(): a = [{"n": nm.call(lm), "r": "", "o": 70}]
	var pesos = []; var soma = 0.0
	for x in a: var pz = max(1, x.o - 55); pesos.append(pz); soma += pz
	var r0: float = R.call() * soma; var mi = 0
	while mi < a.size() - 1 and r0 >= pesos[mi]: r0 -= pesos[mi]; mi += 1
	var mv = a[mi]; var vit = lm == eq; var stat = ""
	var totj = func(side):
		var s = 0
		for j in jogos: s += j.m[0]["a" if side == "m" else "b"]
		return s
	if fmt == "moba":
		var ks: int = totj.call(lm); var k: int = max(1, jr(ks * (0.18 + R.call() * 0.2))); var mor: int = ri.call(0, 2 * total) if vit else ri.call(2, 3 * total + 2); var asv: int = jr(ks * (0.5 + R.call() * 0.4))
		stat = "KDA %d/%d/%d" % [k, mor, asv]
	elif fmt == "rounds":
		var rs: int = totj.call(lm); stat = "%d abates · rating %.2f" % [max(3, jr(rs * (0.9 + R.call() * 0.5))), (1.15 + R.call() * 0.45) if vit else (0.95 + R.call() * 0.3)]
	elif fmt == "ff":
		var ks: int = totj.call(lm); stat = "%d abates · %d de dano" % [max(2, jr(ks * (0.3 + R.call() * 0.3))), jr(500 + R.call() * 900)]
	else:
		var gl: int = totj.call(lm)
		stat = ("%d gol%s · %d finalizações" % [gl, "s" if gl > 1 else "", ri.call(3, 9)]) if gl else ("%d finalizações · %d defesas" % [ri.call(2, 7), ri.call(1, 5)])
	return {"fmt": fmt, "bo": d.bo, "placar": [d.meus, d.deles], "venc": eq, "jogos": jogos, "momentos": momentos, "mvp": {"n": mv.n, "r": mv.r, "lado": lm, "time": nm.call(lm), "stat": stat}}

# ---------- Economia semanal e avanço do tempo ----------
func projecao(g) -> Dictionary:
	var receita = 0; var despesa = 0
	for sq in SQUADS:
		var q = S.games[g].squads[sq]
		if not q.on: continue
		if prontos(g, sq): receita += jr(8000 * pow(S.org.rep, 0.5) * (1.0 if sq == "t1" else 0.2))
		despesa += folha(g, sq)
	despesa += custo_base(g)
	return {"receita": receita, "despesa": despesa, "saldo": receita - despesa}
func projecao_org() -> Dictionary:
	var receita = renda_patro() + renda_social() + renda_merch(); var despesa = upkeep_semanal() + custo_foco() + staff_folha() + scout_folha()
	for g in GAMES:
		if ativo(g):
			var p = projecao(g); receita += p.receita; despesa += p.despesa
	return {"receita": receita, "despesa": despesa, "saldo": receita - despesa}
func avancar(semanas: int) -> bool:
	var jogou = false
	for i in semanas:
		S.org.caixa += projecao_org().saldo
		ULT = []
		for g in GAMES:
			if not ativo(g): continue
			for sq in SQUADS:
				var c = comp_for(g, sq)
				if c == null: continue
				var n0 = ULT.size(); var cx0 = S.org.caixa; var rep0 = S.org.rep; var seg0 = S.social.seg; var l0: int = S.logN
				if semana_comp(c): jogou = true
				if ULT.size() > n0:
					var d = ULT[n0]; d["efeito"] = {"caixa": S.org.caixa - cx0, "rep": S.org.rep - rep0, "seg": float(S.social.seg) / seg0 - 1.0}
					var notas = []
					for x in S.log.slice(0, min(S.logN - l0, S.log.size())):
						var rx = RegEx.new(); rx.compile("^S\\d+/\\d+: "); notas.append(rx.sub(x, ""))
					d["notas"] = notas
		reg_semana(); treinar_semana(); contratos(); semanal_org(); S.tempo += 1; fin_tick(); vestiario_tick(); propostas_tick(); contrato_tick(); orc_tick()
		S.org.semana += 1
		if S.org.semana > 52: S.org.semana = 1; S.org.ano += 1; reg_fim_ano(S.org.ano - 1); dir_virada(S.org.ano - 1); fin_ano_fechar(S.org.ano - 1)
		mundo_tick()
	save(); return jogou
var _rx_imp: RegEx
func passo(parar := false) -> Dictionary:
	if parar:
		var pend = partidas_semana()
		if pend.size(): return {"parou": true, "jogou": false, "partidas": pend, "motivo": motivo_partida(pend), "semana": S.org.semana, "ano": S.org.ano}
	if _rx_imp == null:
		_rx_imp = RegEx.new(); _rx_imp.compile("(?i)Contrato|saiu|terminou|revelou|classificado|CAMPE|vice-|semifinalista|eliminado|fora dos playoffs|Fim do ano|Novo evento|Abriu|aceitou|split \\d+ começou|split à espera|pode ser aberto|promoveu")
	var n0: int = S.logN; var tinha_ev: bool = S.evento != null; var jogou = avancar(1)
	for g in S.ordem:
		if not aberto(g) and S.tempo == desbloqueio(g).sem: log_("%s já pode ser aberto (aba do jogo)" % GAMES[g].nome)
	var novas: Array = S.log.slice(0, min(S.logN - n0, S.log.size())); var motivo = null
	if S.evento != null and not tinha_ev: motivo = "Novo evento: decida na aba Negócios."
	elif S.org.caixa < 0: motivo = "Caixa negativo!"
	else:
		for x in novas:
			if _rx_imp.search(x) != null:
				var rx = RegEx.new(); rx.compile("^S\\d+/\\d+: "); motivo = rx.sub(x, ""); break
	var ps = []
	for d in ULT:
		var dd: Dictionary = d.duplicate(); dd["nar"] = narrar(d); ps.append(dd)
	return {"jogou": jogou, "motivo": motivo, "semana": S.org.semana, "ano": S.org.ano, "partidas": ps}
func avancar_ate_jogo() -> int:
	var n = 0
	while n < 60:
		n += 1
		if avancar(1): break
	return n
func trocar_regiao(k, g = "lol") -> void:
	if g == "lol": S.org.regiao = k
	else: S.games[g]["regiao"] = k
	for key in S.comp.keys():
		if key.begins_with(g + "-"): S.comp.erase(key)
	S.ligas.erase(g); save()

# ---------- Mundo que envelhece ----------
func novo_mundo(ano) -> Dictionary: return {"y": ano, "n": 0, "s": null, "ov": {}, "apos": []}
func ajustar_mundo(s) -> void:
	var ano: int = s.org.get("ano", 2026)
	if not s.has("mundo") or typeof(s.mundo) != TYPE_DICTIONARY: s["mundo"] = novo_mundo(ano); return
	var m = s.mundo
	if not m.get("y"): m.y = ano
	m.n = int(m.get("n", 0)); if not m.has("ov"): m.ov = {}
	if not m.has("apos"): m.apos = []
	if not m.has("s"): m.s = null
const PERF := {
	"lol": {"pk": 23, "dec0": 26, "dec": 1.0, "r50": 29.5, "rs": 1.4, "rmin": 23, "max": 36, "m": 22.5},
	"cs2": {"pk": 25, "dec0": 28, "dec": 0.9, "r50": 31.5, "rs": 1.7, "rmin": 24, "max": 40, "m": 25},
	"dota2": {"pk": 25, "dec0": 29, "dec": 0.7, "r50": 32, "rs": 1.8, "rmin": 25, "max": 40, "m": 24},
	"valorant": {"pk": 24, "dec0": 27, "dec": 1.0, "r50": 30, "rs": 1.5, "rmin": 24, "max": 37, "m": 23.5},
	"ff": {"pk": 23, "dec0": 28, "dec": 0.6, "r50": 30, "rs": 1.7, "rmin": 23, "max": 38, "m": 23.5},
	"r6": {"pk": 25, "dec0": 28, "dec": 0.8, "r50": 31, "rs": 1.7, "rmin": 24, "max": 38, "m": 24},
	"fifa": {"pk": 24, "dec0": 30, "dec": 0.4, "r50": 33, "rs": 2, "rmin": 25, "max": 40, "m": 23},
	"wr": {"pk": 23, "dec0": 26, "dec": 0.9, "r50": 29, "rs": 1.4, "rmin": 23, "max": 35, "m": 23},
}
const MU_OFF := 3
const MU_GANHO := 0.8
const MU_REV := 0.3
var MU = {"idx": {}, "ap": null, "apN": -1, "nicks0": null, "nicks": {}}
func mu_hf(s, k) -> float: return float(fnv(str(s) + "|" + str(k))) / 4294967296.0
func mrnd() -> float:
	var M = S.mundo
	if M.s == null:
		var h = s32(fnv(str(S.seed) + "mundo")); M.s = h if h != 0 else 777
	M.s = s32(int(M.s) + 0x6D2B79F5); return _mb(int(M.s))
func mgau() -> float: return (mrnd() + mrnd() + mrnd() - 1.5) * 2
const FLAGS_OK := "AR AU BA BE BG BR BY CA CL CN CO CZ DE DK EE ES FI FR GB GR GT HK HR HU ID IL IT JP KR KZ LT LV MN MX MY NL NO PE PL PT RO RS RU SA SE SG SI SK TH TR TW UA US UY VN ZA"
const FLAG_REG := {"CBLOL": ["BR"], "LCS": ["US", "CA", "KR"], "LEC": ["DE", "FR", "ES", "DK", "SE", "PL"], "LCK": ["KR"], "LPL": ["CN"], "LCP": ["TW", "VN", "JP", "AU", "HK"]}
func _flag_ok(f) -> bool: return FLAGS_OK.split(" ").has(str(f).to_upper())
func mu_indice(g):
	if MU.idx.has(g): return MU.idx[g]
	var d = raw_data(g)
	if d == null: MU.idx[g] = null; return null
	var id0 = "" if g == "lol" else g + "-"; var slots = []; var grp = {}; var flags = {}; var todas = {}
	if MU.nicks0 == null: MU.nicks0 = {}
	for lg in d.leagues:
		var L = d.leagues[lg]; flags[lg] = []
		for tk in [["t1", 1], ["t2", 2]]:
			var ti = 0
			for t in L.get(tk[0], []):
				var tp = t.get("p") if t.get("p") != null else []
				var rows = tp.filter(func(r): return r != null); var base = 0.0
				if rows.size():
					for r in rows: base += r[1]
					base /= rows.size()
				var tm = {"base": base, "nome": t.n}
				var i = 0
				for row in tp:
					if row != null:
						MU.nicks0[str(row[0]).to_lower()] = true
						var s = {"id": "%s%s-%d-%d-%d" % [id0, lg, tk[1], ti, i], "row": row, "orig": row.duplicate(), "lg": lg, "tier": "T1" if tk[1] == 1 else "T2", "tm": tm, "i": i}
						var gk: String = lg + "|" + s.tier
						if not grp.has(gk): grp[gk] = {"n": 0, "soma": 0.0}
						grp[gk].n += 1; grp[gk].soma += row[1]; slots.append(s)
						var fl = row[3] if row.size() > 3 and row[3] != null else null
						if fl == null and LOLX.has("nat") and LOLX.has("iso"):
							var nc = LOLX.nat.get(row[0]); if nc != null: fl = LOLX.iso.get(nc)
						if fl != null and _flag_ok(fl): flags[lg].append(str(fl).to_upper()); todas[str(fl).to_upper()] = 1
					i += 1
				ti += 1
	for k in grp: grp[k]["alvo"] = grp[k].soma / grp[k].n
	for tb in ["nat", "hon", "rtit"]:
		for n in LOLX.get(tb, {}): MU.nicks0[str(n).to_lower()] = true
	MU.idx[g] = {"d": d, "slots": slots, "grp": grp, "flags": flags, "todas": todas.keys()}
	return MU.idx[g]
func mu_escreve(s, e) -> void:
	var row: Array = s.row; row.clear()
	for v in s.orig: row.append(v)
	if e == null: return
	while row.size() < 6: row.append(null)
	row[1] = e[0]; row[2] = e[1]; row[3] = s.orig[3] if s.orig.size() > 3 else null; row[4] = 0; row[5] = e[2]
	if e.size() > 3 and e[3]:
		row[0] = e[4]; row[3] = e[5]; row[4] = e[3]; MU.nicks[str(e[4]).to_lower()] = true
func mundo_sync() -> void:
	if not S.has("mundo"): ajustar_mundo(S)
	var M = S.mundo
	if is_same(MU.ap, M) and MU.apN == M.n: return
	MU.ap = M; MU.apN = M.n; MU.nicks = MU.nicks0.duplicate() if MU.nicks0 != null else {}
	for g in GAMES:
		if not MU.idx.has(g): mu_indice(g)
	MU.nicks = MU.nicks0.duplicate() if MU.nicks0 != null else {}
	for g in GAMES:
		var I = MU.idx.get(g)
		if I == null: continue
		var ov = M.ov.get(g, {})
		for s in I.slots: mu_escreve(s, ov.get(s.id))
		_pool.erase(g)
const NOMES_G := {
	"lat": [["du","ka","ga","pe","ra","lu","ti","ne","ze","bi","vi","ma","jo","fe","ro","ca","da","le","to","mi","san","mar","ric","cris","fer","ale","guil","nan"], ["du","io","nho","zin","ka","to","nd","el","lo","xo","ex","ito","ao","z","ry","ke","ni","ba","co","dy"]],
	"kr": [["ka","min","hyun","seo","woo","ji","tae","sung","joon","yoo","dong","han","ryu","shin","bae","gyu","do","ha"], ["ng","jun","ho","min","su","won","woo","hyuk","sang","ki","ri","do","ya","seo"]],
	"cn": [["xiao","ming","zhe","yu","hao","jun","wei","lin","chen","tian","kai","long","feng","shi","yan","bo","ze","an"], ["ng","long","xi","hao","yu","an","kun","ze","xin","tao","lei","ye","wen"]],
	"jp": [["ha","ru","ki","sa","to","ko","ya","mi","ta","ro","shi","no","ke","ju","ryu","ren","hi"], ["to","ki","ro","ya","ta","mi","ru","ma","shi","ko","na","ji","su"]],
	"sea": [["an","minh","tuan","nam","duc","khoa","hieu","phuc","long","son","bao","kien","tri","vy","nat","pop","boom","arm","non","dewa","riz","putra","ald","faj","bay","haf"], ["h","ng","an","ky","ky","o","i","ra","ko","ny","zy","dy","tan","ki","ri"]],
	"sla": [["vla","ki","sa","ni","mi","ro","ale","dmi","ste","ma","bo","zo","pa","ja","ti","ko","an","vo","da","ruz"], ["d","ril","sha","ko","lav","ek","ik","ic","ski","ov","ya","vich","ton","zer","nik","an","tek","mir"]],
	"nor": [["ox","fre","ja","ni","mal","el","sig","ste","hen","ma","ba","jo","lu","ku","ri","ha","tor","vik","ras","kri"], ["ke","x","ar","ik","mus","ne","dor","ten","ard","son","by","ner","ler","ee","z","ie"]],
	"ang": [["ja","ty","bre","cal","ry","no","hu","za","ke","mi","jax","ash","cole","dex","nate","finn","reed","max","kai","lo"], ["x","den","son","vin","sh","lex","ton","ley","ck","n","dy","ro","z","rr","ze"]],
	"med": [["ale","gio","lu","ma","pa","el","ni","ro","fa","da","ste","vi","ba","xe","jo","ti","zo","co"], ["ex","ic","ou","ro","is","ano","ino","eo","ch","oux","ty","ni","la","ac","ot","y"]],
	"tr": [["ka","em","bu","ey","ce","ya","er","tu","ha","me","os","ber","alp","ay","can"], ["ner","han","kan","ar","ay","gur","ra","lp","can","ti","ze","du","sal","is"]],
}
var GRUPO = {}
func _grupo() -> void:
	if not GRUPO.is_empty(): return
	for par in [["lat", "br pt ar mx cl co pe uy es gt sv ve ec bo py cr pa do cu"], ["kr", "kr"], ["cn", "cn hk tw mn"], ["jp", "jp"], ["sea", "vn th id my sg ph kh"], ["sla", "ru ua by kz pl cz sk rs hr si bg ro hu lt lv ee ba mk me al ge am az uz"], ["nor", "se dk no fi de nl be at ch is ie"], ["ang", "us ca gb au nz za in"], ["med", "fr it gr cy mt lu"], ["tr", "tr sa il ae eg ma tn dz jo lb"]]:
		for c in par[1].split(" "): GRUPO[c] = par[0]
func mu_nick(flag) -> String:
	_grupo(); var T = NOMES_G[GRUPO.get(str(flag).to_lower(), "ang")]
	var pk = func(a): return a[floori(mrnd() * a.size())]
	for t in 40:
		var n: String = pk.call(T[0]) + pk.call(T[1])
		if mrnd() < 0.2: n += pk.call(T[1])
		var r = mrnd(); n = n if r < 0.3 else (n.to_upper() if (r < 0.34 and n.length() <= 4) else n.left(1).to_upper() + n.substr(1))
		if n.length() < 3 or n.length() > 10 or MU.nicks.has(n.to_lower()): continue
		return n
	var n2: String = pk.call(T[0]) + pk.call(T[1]) + str(floori(mrnd() * 90 + 10))
	while MU.nicks.has(n2.to_lower()): n2 = pk.call(T[0]) + pk.call(T[1]) + str(floori(mrnd() * 90 + 10))
	return n2.left(1).to_upper() + n2.substr(1)
func idade_base(g, nick, o) -> int: return int(cl(jr(PERF[g].m + (mu_hf(g + str(nick), "a1") + mu_hf(g + str(nick), "a2") - 1) * 8 + (o - 70) * 0.05), 17, PERF[g].max - 6))
func pot_base(g, nick, a, o) -> int: return o if a >= PERF[g].pk else o + jr(pow(mu_hf(g + str(nick), "p"), 1.3) * (PERF[g].pk - a) * 1.1)
func evol_ovr(P, o, a, pot, rev) -> int:
	var d: float
	if a <= P.pk:
		var r = 0.5 if a <= 19 else 0.42 if a <= 21 else 0.36 if a <= 23 else 0.3
		d = max(0, pot - o) * r + mgau() * (1.3 if a <= 21 else 0.9)
	elif a <= P.dec0: d = max(0, pot - o) * 0.15 + mgau() * 0.9
	else: d = -P.dec * (1 + 0.15 * (a - P.dec0 - 1)) + mgau() * 0.9
	return int(cl(floori(o + d + rev + mrnd()), 42, 98))
func mu_aposenta(P, a, o) -> bool: return a >= P.max or (a >= P.rmin and mrnd() < 1.0 / (1.0 + exp(-(a - P.r50 + (70 - o) * 0.06) / P.rs)))
func mu_regen(g, I, s, ano, adj) -> Array:
	var G = I.grp[s.lg + "|" + s.tier]
	var pot: float = G.alvo + 0.6 * ((s.tm.base if s.tm.base else G.alvo) - G.alvo) + MU_OFF + adj + mgau() * (2.5 if G.n < 12 else 5)
	if mrnd() < (0.04 if G.n < 12 else 0.08): pot += 6 + mrnd() * 4
	pot = jr(cl(pot, 58, 96))
	var fl: Array = I.flags[s.lg] if I.flags[s.lg].size() else FLAG_REG.get(s.lg, I.todas if I.todas.size() else ["BR", "US", "KR", "DE", "CN"])
	var flag = fl[floori(mrnd() * fl.size())]
	var r = mrnd(); var a = 16 if r < 0.15 else 17 if r < 0.45 else 18 if r < 0.75 else 19
	var o = int(cl(jr(pot - (4 + mrnd() * 4 if G.n < 12 else 9 + mrnd() * 7)), 46, 76)); var nick = mu_nick(flag)
	MU.nicks[nick.to_lower()] = true
	var ger = (s.row[4] if s.row.size() > 4 and s.row[4] != null else 0) + 1
	return [o, a, int(pot), ger, nick, flag, ano]
func mu_donos() -> Dictionary:
	var own = {}
	for g in GAMES:
		for q in S.games[g].squads.values():
			for p in q.slots:
				if p != null and p.get("id") != null:
					var k: String = g + "|" + str(p.id)
					if not own.has(k): own[k] = []
					own[k].append(p)
	return own
func mundo_virar_ano() -> void:
	var M = S.mundo; M.y += 1; var ano: int = M.y; M.n += 1; MU.apN = M.n
	var own = mu_donos(); var apos_log = []
	for g in GAMES:
		var I = mu_indice(g)
		if I == null: continue
		var P = PERF[g]
		if not M.ov.has(g): M.ov[g] = {}
		var ov = M.ov[g]; var grp = {}; var fila = []
		var pots = []
		for s in I.slots: pots.append(s.row[5] if s.row.size() > 5 and s.row[5] != null else s.row[1])
		pots.sort(); var lenda = pots[floori(pots.size() * 0.85)]
		var atual = {}
		for s in I.slots:
			var k: String = s.lg + "|" + s.tier
			if not atual.has(k): atual[k] = [0.0, 0]
			atual[k][0] += s.row[1]; atual[k][1] += 1
		for s in I.slots:
			var row: Array = s.row; var rid: String = s.id + (("~" + str(row[4])) if row.size() > 4 and row[4] else ""); var dono = own.get(g + "|" + rid); var o0: int = row[1]
			var gk: String = s.lg + "|" + s.tier; var GI = I.grp[gk]; var A = atual[gk]
			var rev: float = MU_REV * (1.6 if GI.n < 12 else 1.0) * (GI.alvo - A[0] / A[1])
			var a: int = (row[2] if row.size() > 2 and row[2] != null else idade_base(g, row[0], o0)) + 1
			var pot: int = row[5] if row.size() > 5 and row[5] != null else pot_base(g, row[0], a - 1, o0)
			var o = evol_ovr(P, o0, a, pot, rev)
			var ret: bool = dono == null and mu_aposenta(P, a, o)
			if not grp.has(gk): grp[gk] = {"soma": 0.0, "n": 0, "ret": 0}
			var G = grp[gk]; G.n += 1
			if ret: G.ret += 1
			else: G.soma += o
			fila.append({"s": s, "o": o, "a": a, "pot": pot, "ret": ret, "dono": dono, "o0": o0})
		for x in fila:
			var s = x.s; var row: Array = s.row; var gk: String = s.lg + "|" + s.tier; var G = grp[gk]; var alvo: float = I.grp[gk].alvo
			if x.ret:
				if x.pot >= lenda:
					var fl = ""
					if row.size() > 3 and row[3] != null: fl = str(row[3])
					elif LOLX.has("iso") and LOLX.has("nat") and LOLX.nat.get(row[0]) != null: fl = str(LOLX.iso.get(LOLX.nat[row[0]], ""))
					M.apos.push_front([ano, g, row[0], x.a, max(x.o, x.pot), fl.to_upper(), s.tm.nome]); if M.apos.size() > 60: M.apos.resize(60)
					apos_log.append({"g": g, "nick": row[0], "a": x.a, "pot": x.pot})
				var adj: float = cl((alvo - (G.soma + G.ret * (alvo - 6)) / G.n) * MU_GANHO * (1.8 if G.n < 12 else 1.0), -6, 7)
				var e = mu_regen(g, I, s, ano, adj); ov[s.id] = e; mu_escreve(s, e)
			else:
				var e: Array = ov[s.id].duplicate() if ov.has(s.id) else []
				while e.size() < 3: e.append(null)
				e[0] = x.o; e[1] = x.a; e[2] = x.pot; ov[s.id] = e
				while row.size() < 6: row.append(null)
				row[1] = x.o; row[2] = x.a; row[5] = x.pot
				if row[4] == null: row[4] = 0
				if e.size() < 4: row[3] = s.orig[3] if s.orig.size() > 3 else null
				if x.dono != null:
					for p in x.dono:
						if p.get("a") == null: p["a"] = x.a
		_pool.erase(g)
	if S.estrela != null:
		for v in own.values():
			for p in v:
				if p.get("estrela", false): S.estrela.o = p.o
	if not dir_off: mundo_mercado(own)
	for g in S.ligas: mundo_refrescar_liga(S.ligas[g], g)
	apos_log = apos_log.filter(func(x): return aberto(x.g)); apos_log.sort_custom(func(x, y): return y.pot < x.pot)
	for x in apos_log.slice(0, 3): log_("%s se aposentou aos %d anos (%s)" % [x.nick, x.a, GAMES[x.g].curto])
func mu_entrada(s) -> Array:
	var r: Array = s.row
	var fl = r[3] if r.size() > 3 else null
	return [r[1], r[2] if r.size() > 2 and r[2] != null else 22, r[5] if r.size() > 5 and r[5] != null else r[1], max(1, int(r[4]) if r.size() > 4 and r[4] != null else 1), r[0], fl, 0]
func mundo_mercado(own: Dictionary) -> void:
	var M = S.mundo; var ano: int = M.y
	for g in GAMES:
		var I = mu_indice(g)
		if I == null: continue
		var ov: Dictionary = M.ov[g]; var porgrupo = {}
		for s in I.slots:
			var rid: String = s.id + (("~" + str(s.row[4])) if s.row.size() > 4 and s.row[4] else "")
			if own.has(g + "|" + rid): continue
			var gk: String = s.lg + "|" + s.tier
			if not porgrupo.has(gk): porgrupo[gk] = []
			porgrupo[gk].append(s)
		var gks = porgrupo.keys(); gks.sort()
		var feitas = 0
		for gk in gks:
			var L: Array = porgrupo[gk]
			if L.size() < 8: continue
			var n: int = maxi(1, int(L.size() / 14))
			for _k in n:
				var sa = L[floori(mrnd() * L.size())]
				if sa.row[1] < I.grp[gk].alvo + 2: continue
				var opts = L.filter(func(x): return x.tm != sa.tm and x.i == sa.i and x.tm.base > sa.tm.base - 1.5)
				if opts.is_empty(): continue
				var sb = opts[floori(mrnd() * opts.size())]
				if mrnd() > 0.7: continue
				var ea = mu_entrada(sa); var eb = mu_entrada(sb)
				var ta = sa.tm.nome; var tb = sb.tm.nome
				ov[sa.id] = eb; ov[sb.id] = ea
				mu_escreve(sa, eb); mu_escreve(sb, ea)
				feitas += 1
				if aberto(g) and ea[0] >= I.grp[gk].alvo + 6 and feitas <= 4:
					feed("%s (%s) deixa %s e fecha com %s; %s faz o caminho inverso" % [ea[4], GAMES[g].curto, ta, tb, eb[4]], g, "info", 2 if ea[0] >= I.grp[gk].alvo + 10 else 1)
		_pool.erase(g)
func mundo_tick() -> void:
	mundo_sync()
	while S.mundo.y < S.org.ano:
		var n0 = S.mundo.apos.size(); mundo_virar_ano(); _feed_mundo(n0)
func mundo_refrescar_liga(Lg, g) -> void:
	var d = raw_data(g); var L = d.leagues.get(Lg.reg) if d != null else null; Lg.mv = S.mundo.n
	if L == null: return
	var todos = {}; var t1 = {}
	for t in L.get("t2", []): todos[t.n] = t
	for t in L.t1: todos[t.n] = t; t1[t.n] = t
	var up = func(t):
		var m = todos.get(t.n)
		if m != null: t.p = m.get("p"); t.b = media_time(m.get("p"))
	for t in Lg.d1: up.call(t)
	for t in Lg.d2: up.call(t)
	for t in Lg.d3:
		var m = t1.get(str(t.n).trim_suffix(" Academy"))
		if m != null: t.b = max(60.0, media_time(m.get("p")) - 8)
func aposentados(g = null) -> Array:
	var out = []
	for x in S.mundo.apos:
		if g == null or x[1] == g: out.append({"ano": x[0], "g": x[1], "nick": x[2], "idade": x[3], "o": x[4], "flag": x[5]})
	return out

func _feed_mundo(_n0) -> void:
	var y: int = S.mundo.y
	for x in S.mundo.apos:
		if x[0] == y and x[4] >= 80: feed("%s (%s) anuncia a aposentadoria aos %d anos, com pico de %d" % [x[2], GAMES[x[1]].curto, x[3], x[4]], x[1], "aposent", 2)
	for g in S.mundo.ov:
		var best = null
		for id in S.mundo.ov[g]:
			var e: Array = S.mundo.ov[g][id]
			if e.size() > 6 and e[3] and e[6] == y and (best == null or e[2] > best[2]): best = e
		if best != null: feed("Nova revelação em %s: %s (%da, potencial %d)" % [GAMES[g].curto, best[4], best[1], best[2]], g, "talento", 2)

# ---------- Diretoria: objetivos anuais e confiança (novo no Godot) ----------
var dir_off = false   # os testes de paridade com o JS desligam isto
const DIR_RANK := {"campeao": 4, "vice": 3, "semi": 2, "quartas": 1}
func _dir_rank_ano(g, ano) -> int:
	var c = comp_for(g, "t1")
	if c == null: return 0
	var best = 0
	for h in c.hist:
		if h.y == ano and h.eu != null: best = max(best, DIR_RANK.get(h.eu, 0))
	return best
func dir_garantir() -> void:
	if dir_off: return
	if not (S.get("dir") is Dictionary) or S.dir.is_empty() or S.dir.ano != S.org.ano: dir_gerar()
func dir_gerar() -> void:
	var conf = 60.0; var hist = []
	if S.get("dir") is Dictionary and not S.dir.is_empty(): conf = S.dir.conf; hist = S.dir.get("hist", [])
	var g: String = S.inicio; var rep: float = S.org.rep; var objs = []
	var alvo_pos = 1 if rep < 2.0 else 2 if rep < 4.0 else 3 if rep < 6.0 else 4
	objs.append({"id": "pos", "g": g, "alvo": alvo_pos, "txt": {1: "Chegar aos playoffs", 2: "Chegar às semifinais", 3: "Chegar à final", 4: "Ser campeão"}[alvo_pos] + " em " + GAMES[g].curto + " (time principal)", "ok": false})
	var cx0: int = int(S.org.caixa)
	objs.append({"id": "caixa", "base": cx0, "alvo": cx0 + max(120000, int(cx0 * 0.15)), "txt": "Fechar o ano com caixa maior", "ok": false})
	var sg0: int = int(S.social.seg)
	objs.append({"id": "seg", "base": sg0, "alvo": int(sg0 * 1.2) + 500, "txt": "Crescer 20% em seguidores", "ok": false})
	objs.append({"id": "elenco", "alvo": 1, "txt": "Manter todos os times principais com titulares completos no fim do ano", "ok": false})
	S.dir = {"ano": S.org.ano, "conf": conf, "objs": objs, "hist": hist}
func dir_prog(o: Dictionary) -> Dictionary:   # {atual, meta, frac, ok, txt}
	match o.id:
		"pos":
			var r = _dir_rank_ano(o.g, S.org.ano); var nomes = ["fora", "quartas", "semi", "final", "campeão"]
			return {"frac": clampf(float(r) / o.alvo, 0.0, 1.0), "ok": r >= o.alvo, "txt": "melhor: " + nomes[r]}
		"caixa":
			var f: float = float(S.org.caixa - o.base) / float(max(1, o.alvo - o.base))
			return {"frac": clampf(f, 0.0, 1.0), "ok": S.org.caixa >= o.alvo, "txt": "%s / %s" % [money(S.org.caixa), money(o.alvo)]}
		"seg":
			var f2: float = float(S.social.seg - o.base) / float(max(1, o.alvo - o.base))
			return {"frac": clampf(f2, 0.0, 1.0), "ok": S.social.seg >= o.alvo, "txt": "%s / %s" % [str(int(S.social.seg)), str(int(o.alvo))]}
		"elenco":
			var tot = 0; var cheios = 0
			for g in GAMES:
				if not ativo(g) or not aberto(g): continue
				tot += 1
				if not titulares(g, "t1").has(null): cheios += 1
			return {"frac": float(cheios) / max(1, tot), "ok": cheios == tot, "txt": "%d de %d times completos" % [cheios, tot]}
	return {"frac": 0.0, "ok": false, "txt": ""}
func dir_virada(ano_ant: int) -> void:   # chamado quando o ano vira; avalia o ano que acabou e sorteia os novos objetivos
	if dir_off: return
	if not (S.get("dir") is Dictionary) or S.dir.is_empty() or S.dir.ano != ano_ant:
		dir_gerar(); return
	var oks = 0; var linhas = []
	for o in S.dir.objs:
		var p = dir_prog(o); o["ok"] = p.ok
		if p.ok: oks += 1
		linhas.append({"txt": o.txt, "ok": p.ok})
	var conf: float = S.dir.conf + oks * 10.0 - (S.dir.objs.size() - oks) * 12.0
	conf = clampf(conf, 0.0, 100.0)
	var premio = oks * 50000
	if premio > 0: S.org.caixa += premio
	if oks == S.dir.objs.size(): S.org.rep = cl(S.org.rep + 0.1, 0.5, 10)
	if conf <= 15.0: S.org.rep = cl(S.org.rep - 0.1, 0.5, 10)
	var h: Array = S.dir.get("hist", []); h.push_front({"ano": ano_ant, "oks": oks, "total": S.dir.objs.size(), "conf": int(conf), "premio": premio})
	log_("Diretoria %d: %d de %d objetivos cumpridos%s. Confiança %d%%." % [ano_ant, oks, S.dir.objs.size(), (" (bônus " + money(premio) + ")") if premio > 0 else "", int(conf)])
	msg("diretoria", "Balanço da diretoria %d" % ano_ant, "%d de %d objetivos cumpridos. Confiança da diretoria: %d%% (%s).%s" % [oks, S.dir.objs.size(), int(conf), dir_rotulo(conf), (" Bônus de " + money(premio) + ".") if premio > 0 else ""])
	S.dir = {"ano": S.org.ano, "conf": conf, "objs": [], "hist": h.slice(0, 10)}
	dir_gerar()
func dir_rotulo(conf: float) -> String:
	return "Confiança total" if conf >= 85.0 else "Satisfeita" if conf >= 60.0 else "Cautelosa" if conf >= 35.0 else "Descontente" if conf > 15.0 else "Em crise"

# ---------- Finanças e patrocínios (novo no Godot) ----------
func patro_bonus(x) -> int: return int(x.pay) * 3          # prêmio por título do time principal
func patro_multa(x) -> int: return int(x.pay) * 4          # custo de rescindir
func rescindir_patro(id) -> Dictionary:
	for i in S.patro.size():
		if S.patro[i].id == id:
			var m = patro_multa(S.patro[i])
			if S.org.caixa < m: return {"ok": false, "msg": "Caixa insuficiente para a multa de %s." % money(m)}
			S.org.caixa -= m; log_("Rescindiu o patrocínio com %s (multa %s)" % [S.patro[i].n, money(m)]); S.patro.remove_at(i); save(); return {"ok": true, "msg": "Contrato rescindido."}
	return {"ok": false, "msg": "Contrato não encontrado."}
func patro_titulo(c) -> void:   # chamado quando o time principal é campeão
	if dir_off or c.sq != "t1": return
	var t = 0
	for x in S.patro: t += patro_bonus(x)
	if t > 0: S.org.caixa += t; log_("Bônus de patrocinadores pelo título: +%s" % money(t))
func fin_tick() -> void:
	var h: Array = S.get("fin", [])
	h.append(int(S.org.caixa)); if h.size() > 52: h = h.slice(h.size() - 52)
	S["fin"] = h
	var pf: Array = S.get("perf", []); pf.append(forca_media()); if pf.size() > 52: pf = pf.slice(pf.size() - 52)
	S["perf"] = pf
func fin_resumo() -> Dictionary:
	var comp = 0; var folha_t = 0; var base_t = 0; var por_jogo = []
	for g in GAMES:
		if not ativo(g): continue
		var p = projecao(g); comp += p.receita
		var fj = 0
		for sq in SQUADS:
			if S.games[g].squads[sq].on: fj += folha(g, sq)
		folha_t += fj; base_t += custo_base(g)
		if p.receita > 0 or p.despesa > 0: por_jogo.append([g, p.saldo])
	var rec = [["Patrocínios", renda_patro()], ["Seguidores e redes", renda_social()], ["Loja e itens", renda_merch()], ["Competições e streaming", comp]]
	var des = [["Salários", folha_t], ["Estrutura e base", base_t], ["Manutenção da org", upkeep_semanal()], ["Comissão técnica", staff_folha()], ["Olheiros", scout_folha()], ["Foco de mídia", custo_foco()]]
	return {"rec": rec, "des": des, "por_jogo": por_jogo}

# ---------- Comissão técnica e vestiário (novo no Godot) ----------
const STAFF := {
	"tecnico": {"nome": "Treinador principal", "desc": "Cada nível: +6% na evolução dos jogadores.", "max": 5},
	"analista": {"nome": "Analista de desempenho", "desc": "Cada nível: +0.5 de força dos times em partida.", "max": 5},
	"preparador": {"nome": "Preparador mental", "desc": "Cada nível: +2 no alvo de moral do elenco.", "max": 5},
	"marketing": {"nome": "Gerente de marketing", "desc": "Cada nível: +5% de renda de redes e loja.", "max": 5},
	"gerente": {"nome": "Gerente financeiro", "desc": "Cada nível: -6% na manutenção da estrutura.", "max": 5},
	"diretor": {"nome": "Diretor esportivo", "desc": "Cada nível: +4% no valor de venda de jogadores.", "max": 5}}
func staff_nivel(id) -> int:
	if dir_off: return 0
	var s = S.get("staff"); return int(s.get(id, 0)) if s is Dictionary else 0
func staff_custo(id) -> int: return 30000 * (staff_nivel(id) + 1)
func staff_folha() -> int:
	if dir_off: return 0
	var t = 0
	for id in STAFF: t += staff_nivel(id) * 2500
	return t
func contratar_staff(id) -> Dictionary:
	if not STAFF.has(id): return {"ok": false, "msg": "Cargo inválido."}
	var n = staff_nivel(id)
	if n >= STAFF[id].max: return {"ok": false, "msg": "Já está no nível máximo."}
	var c = staff_custo(id)
	if S.org.caixa < c: return {"ok": false, "msg": "Caixa insuficiente (%s)." % money(c)}
	S.org.caixa -= c
	if not (S.get("staff") is Dictionary): S["staff"] = {}
	S.staff[id] = n + 1; log_("%s agora no nível %d" % [STAFF[id].nome, n + 1]); save()
	return {"ok": true, "msg": "%s: nível %d." % [STAFF[id].nome, n + 1]}
func dispensar_staff(id) -> Dictionary:
	var n = staff_nivel(id)
	if n <= 0: return {"ok": false, "msg": "Cargo vazio."}
	S.staff[id] = n - 1; save(); return {"ok": true, "msg": "%s reduzido para o nível %d." % [STAFF[id].nome, n - 1]}
func conversar(g, sq, i) -> Dictionary:   # conversa individual: sobe a moral, com intervalo de 4 semanas
	var p = S.games[g].squads[sq].slots[i]
	if p == null: return {"ok": false, "msg": "Vaga vazia."}
	if S.tempo < int(p.get("conv", -99)) + 4: return {"ok": false, "msg": "%s já conversou há pouco (espere %d sem.)." % [p.n, int(p.get("conv", -99)) + 4 - S.tempo]}
	p["conv"] = S.tempo; p.mo = min(100.0, p.mo + 10.0); save()
	return {"ok": true, "msg": "Conversa com %s: moral subiu." % p.n}
func vestiario_tick() -> void:
	if dir_off: return
	for g in GAMES:
		if not ativo(g) or not aberto(g): continue
		var t = titulares(g, "t1").filter(func(p): return p != null)
		if t.size() < 2: continue
		var baixos = t.filter(func(p): return p.mo < 45)
		if baixos.size() >= 1 and rnd() < 0.10:
			var a = baixos[floori(rnd() * baixos.size())]; var b = t[floori(rnd() * t.size())]
			if b != a:
				a.mo = max(0.0, a.mo - 5.0); b.mo = max(0.0, b.mo - 5.0); noticia("Discussão no vestiário: %s e %s" % [a.n, b.n], g, "down"); log_("%s: discussão entre %s e %s" % [GAMES[g].curto, a.n, b.n])
		else:
			var m = 0.0
			for p in t: m += p.mo
			if m / t.size() > 80.0 and rnd() < 0.06:
				for p in t: p.mo = min(100.0, p.mo + 3.0)
				noticia("Elenco unido: o ambiente está ótimo", g, "up")

# ---------- Olheiros e propostas de transferência (novo no Godot) ----------
const SCOUT_MAX := 5
func scout_nivel() -> int:
	if dir_off: return 0
	var s = S.get("scout"); return int(s.get("n", 0)) if s is Dictionary else 0
func scout_custo() -> int: return 40000 * (scout_nivel() + 1)
func scout_folha() -> int: return scout_nivel() * 4000
func contratar_scout() -> Dictionary:
	var n = scout_nivel()
	if n >= SCOUT_MAX: return {"ok": false, "msg": "Rede de olheiros no máximo."}
	var c = scout_custo()
	if S.org.caixa < c: return {"ok": false, "msg": "Caixa insuficiente (%s)." % money(c)}
	S.org.caixa -= c
	if not (S.get("scout") is Dictionary): S["scout"] = {"n": 0, "lst": {}, "ids": {}}
	S.scout.n = n + 1; log_("Rede de olheiros no nível %d" % (n + 1)); save()
	return {"ok": true, "msg": "Olheiros: nível %d." % (n + 1)}
func reduzir_scout() -> Dictionary:
	var n = scout_nivel()
	if n <= 0: return {"ok": false, "msg": "Sem olheiros."}
	S.scout.n = n - 1; save(); return {"ok": true, "msg": "Olheiros reduzidos para o nível %d." % (n - 1)}
func scouted(p) -> bool:
	if dir_off: return false
	var s = S.get("scout"); return s is Dictionary and s.get("ids", {}).has(str(p.id))
func scout_lista(g) -> Array:   # jovens promissores com potencial revelado; troca a cada 8 semanas
	var n = scout_nivel()
	if n <= 0: return []
	if not (S.scout.get("lst") is Dictionary): S.scout["lst"] = {}
	if not (S.scout.get("ids") is Dictionary): S.scout["ids"] = {}
	var ciclo: int = S.tempo / 8; var cur = S.scout.lst.get(g)
	if cur == null or cur.ciclo != ciclo or cur.n != n:
		var cand: Array = livres(g).filter(func(p): return p.get("a") != null and p.a <= 22 and p.o >= 55)
		cand.sort_custom(func(a, b): return pot_inicial(a) > pot_inicial(b) or (pot_inicial(a) == pot_inicial(b) and a.id < b.id))
		var k = 2 + 2 * n; var off = (ciclo * 3) % max(1, cand.size() - k)
		var ids = []
		for p in cand.slice(off, off + k):
			ids.append(str(p.id)); S.scout.ids[str(p.id)] = true
		cur = {"ciclo": ciclo, "n": n, "ids": ids}; S.scout.lst[g] = cur
	var out = []; var byid = {}
	for p in pool(g): byid[str(p.id)] = p
	for id in cur.ids:
		if byid.has(id) and livres(g).any(func(p): return str(p.id) == id): out.append(byid[id])
	return out
func propostas_tick() -> void:
	if dir_off: return
	var pr: Array = S.get("propostas", [])
	for x in pr: x.sem -= 1
	pr = pr.filter(func(x): return x.sem > 0)
	if S.tempo % 6 == 0 and pr.size() < 3 and rnd() < 0.6:
		var cands = []
		for g in GAMES:
			if not ativo(g) or not aberto(g): continue
			for sq in ["t1", "t2"]:
				for p in S.games[g].squads[sq].slots:
					if p != null and not p.get("estrela", false) and p.o >= 62 and not pr.any(func(x): return x.id == p.id): cands.append([g, sq, p])
		if cands.size():
			var c = cands[floori(rnd() * cands.size())]; var g2 = c[0]; var p2 = c[2]
			var lgs = D(g2).leagues.keys(); var L = D(g2).leagues[lgs[floori(rnd() * lgs.size())]]
			var tm = L.t1[floori(rnd() * L.t1.size())].n
			pr.append({"g": g2, "sq": c[1], "id": p2.id, "nick": p2.n, "o": p2.o, "time": tm, "valor": jr(valor_venda(p2) * (1.15 + rnd() * 0.5) / 500.0) * 500, "sem": 3})
			log_("Proposta de %s por %s: %s" % [tm, p2.n, money(pr[pr.size() - 1].valor)])
			msg("proposta", "Proposta por %s" % p2.n, "O %s quer contratar %s (nota %d) por %s. A oferta vale por 3 semanas." % [tm, p2.n, p2.o, money(pr[pr.size() - 1].valor)], [{"t": "Vender por " + money(pr[pr.size() - 1].valor), "k": "prop_sim", "pid": p2.id}, {"t": "Recusar", "k": "prop_nao", "pid": p2.id}], g2)
	S["propostas"] = pr
func aceitar_proposta(i) -> Dictionary:
	var pr: Array = S.get("propostas", [])
	if i >= pr.size(): return {"ok": false, "msg": "Proposta expirou."}
	var x = pr[i]; var q = S.games[x.g].squads[x.sq]
	for k in q.slots.size():
		var p = q.slots[k]
		if p != null and p.id == x.id:
			q.slots[k] = null; S.org.caixa += x.valor; S.vendidos.append(p.id); log_("Vendeu %s para o %s por %s" % [p.n, x.time, money(x.valor)])
			S.propostas = pr.filter(func(y): return y.id != x.id); save(); return {"ok": true, "msg": "%s vendido ao %s por %s." % [p.n, x.time, money(x.valor)]}
	S.propostas = pr.filter(func(y): return y.id != x.id); return {"ok": false, "msg": "O jogador não está mais no elenco."}
func recusar_proposta(i) -> void:
	var pr: Array = S.get("propostas", [])
	if i < pr.size(): pr.remove_at(i); S["propostas"] = pr; save()

# ---------- Orçamento por jogo e relatório anual (bloco 5, só Godot) ----------
func orc_de(g) -> int:
	var o = S.get("orc"); return int(o.get(g, 0)) if o is Dictionary else 0
func orc_set(g, v) -> void:
	var o: Dictionary = S.get("orc", {}); o[g] = maxi(0, int(v)); S["orc"] = o; save()
func folha_jogo(g) -> int:
	var t = 0
	for sq in SQUADS:
		if S.games[g].squads[sq].on: t += folha(g, sq)
	return t
func orc_tick() -> void:
	if dir_off or S.tempo % 8 != 0: return
	for g in GAMES:
		if not ativo(g) or not aberto(g): continue
		var b = orc_de(g)
		if b > 0 and folha_jogo(g) > b:
			msg("diretoria", "Orçamento estourado em %s" % GAMES[g].curto, "A folha de %s é de %s por semana, acima do orçamento de %s. Reduza gastos ou aumente o limite em Finanças." % [GAMES[g].curto, money(folha_jogo(g)), money(b)], [], g)
func fin_ano_fechar(ano_ant) -> void:
	if dir_off: return
	var ini: int = int(S.get("fin_ini", S.org.caixa)); var fim: int = int(S.org.caixa)
	var h: Array = S.get("fin_anos", []); h.push_front({"ano": ano_ant, "ini": ini, "fim": fim}); S["fin_anos"] = h.slice(0, 10); S["fin_ini"] = fim
	msg("diretoria", "Relatório financeiro de %d" % ano_ant, "O caixa foi de %s para %s (%s%s) ao longo do ano." % [money(ini), money(fim), "+" if fim >= ini else "-", money(absi(fim - ini))], [], "")

func forca_media() -> float:
	var t = 0.0; var n = 0
	for g in GAMES:
		if not ativo(g) or not aberto(g): continue
		var q = S.games[g].squads.t1
		if q.on and titulares(g, "t1").all(func(p): return p != null): t += forca(g, "t1"); n += 1
	return snappedf(t / n, 0.1) if n else 0.0

# ---------- Central de informação: caixa de entrada, notícias e notificações (novo no Godot) ----------
const FEED_MAX := 150
const INBOX_MAX := 60
func feed(txt: String, g = "", tipo = "info", imp := 1) -> void:
	var f: Array = S.get("feed", [])
	f.push_front({"s": S.org.semana, "y": S.org.ano, "g": g, "t": txt, "k": tipo, "i": imp})
	if f.size() > FEED_MAX: f.resize(FEED_MAX)
	S["feed"] = f
func msg(tipo: String, titulo: String, txt: String, ops: Array = [], g = "") -> void:
	var ib: Array = S.get("inbox", [])
	S["inbox_n"] = int(S.get("inbox_n", 0)) + 1
	ib.push_front({"id": S.inbox_n, "tp": tipo, "ti": titulo, "tx": txt, "s": S.org.semana, "y": S.org.ano, "lida": false, "ops": ops, "g": g, "res": ""})
	if ib.size() > INBOX_MAX: ib.resize(INBOX_MAX)
	S["inbox"] = ib
func inbox_nao_lidas() -> int:
	var n = 0
	for m in S.get("inbox", []):
		if not m.lida: n += 1
	return n
func msg_achar(id) -> Variant:
	for m in S.get("inbox", []):
		if int(m.id) == int(id): return m
	return null
func msg_ler(id) -> void:
	var m = msg_achar(id)
	if m != null and not m.lida: m.lida = true
func msg_todas_lidas() -> void:
	for m in S.get("inbox", []): m.lida = true
	save()
func msg_agir(id, i) -> Dictionary:
	var m = msg_achar(id)
	if m == null or m.res != "": return {"ok": false, "msg": "Esta mensagem já foi respondida."}
	var op: Dictionary = m.ops[i]; var r: Dictionary = {"ok": false, "msg": "Ação indisponível."}
	match op.k:
		"prop_sim", "prop_nao":
			var pr: Array = S.get("propostas", []); var ix = -1
			for k in pr.size():
				if pr[k].id == op.pid: ix = k
			if ix < 0: r = {"ok": false, "msg": "A proposta expirou."}
			elif op.k == "prop_sim": r = aceitar_proposta(ix)
			else: recusar_proposta(ix); r = {"ok": true, "msg": "Proposta recusada."}
		"renov":
			var f = achar_jog(op.pid)
			if f == null: r = {"ok": false, "msg": "Jogador não está mais no elenco."}
			else: r = renovar(f[0], f[1], f[2], op.of, 2)
		"lib":
			var f2 = achar_jog(op.pid)
			if f2 == null: r = {"ok": false, "msg": "Jogador não está mais no elenco."}
			else: r = vender(f2[0], f2[1], f2[2])
		"conv":
			var f3 = achar_jog(op.pid)
			if f3 == null: r = {"ok": false, "msg": "Jogador não está mais no elenco."}
			else:
				var p3 = f3[3]; var bonus: int = int(op.v)
				if S.org.caixa < bonus: r = {"ok": false, "msg": "Caixa insuficiente para o bônus."}
				else:
					S.org.caixa -= bonus; p3.mo = min(100.0, p3.mo + 30.0); p3.erase("pedido"); r = {"ok": true, "msg": "%s aceitou ficar (bônus %s)." % [p3.n, money(bonus)]}
		"ign":
			var f4 = achar_jog(op.pid)
			if f4 != null: f4[3].mo = max(0.0, f4[3].mo - 6.0); f4[3].erase("pedido")
			r = {"ok": true, "msg": "Você ignorou."}
		"evento":
			if S.evento != null and S.evento.id == op.eid: r = escolher_evento(int(op.a))
			else: r = {"ok": false, "msg": "O evento já expirou."}
	m.res = op.t if r.ok else "Expirou"
	m.lida = true; save(); return r

# ---------- Contratos e insatisfação (bloco 3, só Godot) ----------
func achar_jog(id):
	for g in GAMES:
		for sq in SQUADS:
			var sl = S.games[g].squads[sq].slots
			for i in sl.size():
				if sl[i] != null and sl[i].get("id") == id: return [g, sq, i, sl[i]]
	return null
func contrato_tick() -> void:
	if dir_off: return
	for g in GAMES:
		if not ativo(g) or not aberto(g): continue
		for sq in ["t1", "t2"]:
			for p in S.games[g].squads[sq].slots:
				if p == null or p.get("estrela", false): continue
				if p.get("ct") == 26 and p.o >= 55:
					var c1 = proposta_renovar(p, "justa", 2); var c2 = proposta_renovar(p, "alta", 2)
					msg("diretoria", "Contrato de %s termina em 6 meses" % p.n, "%s (nota %d, %s) fica livre em 26 semanas. Renovar agora evita perdê-lo de graça. Humor atual: %d." % [p.n, p.o, GAMES[g].curto, int(p.mo)],
						[{"t": "Renovar (%s)" % money(c1.custo), "k": "renov", "pid": p.id, "of": "justa"}, {"t": "Generosa (%s)" % money(c2.custo), "k": "renov", "pid": p.id, "of": "alta"}, {"t": "Deixar para depois", "k": "ign", "pid": p.id}], g)
				elif p.mo < 22 and not p.get("pedido", false) and rnd() < 0.05:
					p["pedido"] = true; var b: int = jr(fee(p.o) * 0.15 / 1000.0) * 1000
					msg("evento", "%s pede para sair" % p.n, "%s está insatisfeito (humor %d) e quer deixar a org. Você pode liberá-lo pelo valor de mercado, tentar convencê-lo com um bônus ou ignorar (o clima piora)." % [p.n, int(p.mo)],
						[{"t": "Liberar (%s)" % money(valor_venda(p)), "k": "lib", "pid": p.id}, {"t": "Bônus %s" % money(b), "k": "conv", "pid": p.id, "v": b}, {"t": "Ignorar", "k": "ign", "pid": p.id}], g)
	if S.org.caixa < 0 and S.tempo % 4 == 0 and rnd() < 0.5:
		msg("diretoria", "Caixa no vermelho", "A org está com %s em caixa. Venda jogadores, corte staff ou renegocie patrocínios antes que a diretoria perca a confiança." % money(S.org.caixa), [], "")

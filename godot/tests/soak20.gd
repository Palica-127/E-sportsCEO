extends SceneTree
# Soak: 6 anos com todos os jogos abertos, renderizando todas as abas todo ano.
func _initialize() -> void:
	var O = root.get_node("Org"); O.testando = true
	var m: Control = load("res://scenes/main.tscn").instantiate(); root.add_child(m); root.size = Vector2i(720, 1280)
	run(O, m)
func run(O, m) -> void:
	await process_frame
	O.iniciar({"game": "lol", "nome": "Soak", "regiao": "CBLOL"}); O.sem_estrela(); O.S.org.caixa = 50000000
	for g in O.GAMES:
		if not O.ativo(g): continue
		O.S.games[g]["aberto"] = true; O.S.games[g].squads.t1.on = true; O.S.games[g].squads.t2.on = true
		O.comprar_infra("base", g)
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 76)
		lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
		for sq in ["t1", "t2"]:
			for r in O.GAMES[g].roles:
				for p in lv:
					if p.r == r and O.S.games[g].squads[sq].slots[O.GAMES[g].roles.find(r)] == null: O.contratar(g, sq, p); lv.erase(p); break
	m.auto = false; var parou := 0; var res := 0
	for w in 52 * 10:
		if w % 13 == 12:
			for g in O.GAMES:
				if not O.ativo(g): continue
				var lv2: Array = O.livres(g).filter(func(p): return p.o <= 78)
				lv2.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
				for sq in ["t1", "t2"]:
					var sl = O.S.games[g].squads[sq].slots
					for i in sl.size():
						if sl[i] != null and sl[i].get("ct", 99) < 30 and not sl[i].get("estrela", false): O.renovar(g, sq, i, "alta", 2)
						if sl[i] == null and i < O.GAMES[g].roles.size():
							for p in lv2:
								if p.r == O.GAMES[g].roles[i]: O.contratar(g, sq, p); lv2.erase(p); break
		var r: Dictionary = O.passo(true)
		if r.get("parou", false):
			parou += 1; r = O.passo(false)
			for d in r.partidas: res += 1; var n: Dictionary = d.nar; assert(n.jogos.size() > 0 and n.mvp.n != "")
		if w % 52 == 51:
			for g in ["lol", "cs2", "ff", "fifa", "wr"]:
				m.game = g
				for t in ["org", "elenco", "mercado", "cal", "ligas", "neg", "hall", "inbox", "noticias", "fin", "rank", "legado", "mundo"]:
					m.tab = t; var t0 = Time.get_ticks_msec(); m.render(); var dt = Time.get_ticks_msec() - t0
					if dt > 250: print("LENTO ", t, " ", g, " ", dt, "ms")
			var js = JSON.stringify(O.S); var back = JSON.parse_string(js)
			assert(typeof(back) == TYPE_DICTIONARY and back.has("mundo"))
			print("ano ", O.S.org.ano, " save=", js.length() / 1024, "KB feed=", O.S.get("feed", []).size(), " inbox=", O.S.get("inbox", []).size())
	print("soak ok parou=%d resultados=%d ano=%d caixa=%d" % [parou, res, O.S.org.ano, O.S.org.caixa])
	m.game = "lol"; m.tab = "hall"; m.render(); await process_frame; await process_frame; DirAccess.make_dir_recursive_absolute("/tmp/shots"); root.get_texture().get_image().save_png("/tmp/shots/hall_lol.png")
	m.game = "cs2"; m.render(); await process_frame; await process_frame; root.get_texture().get_image().save_png("/tmp/shots/hall_cs2.png")
	quit()

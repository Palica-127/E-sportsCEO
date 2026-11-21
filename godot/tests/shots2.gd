extends SceneTree
var m: Control
func shot(n: String) -> void:
	await process_frame; await process_frame; root.get_texture().get_image().save_png("/tmp/shots/%s.png" % n)
func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("/tmp/shots"); var O = root.get_node("Org"); O.testando = true
	m = load("res://scenes/main.tscn").instantiate(); root.add_child(m); root.size = Vector2i(720, 1280); run(O)
func run(O) -> void:
	await process_frame
	O.iniciar({"game": "lol", "nome": "Palica Esports", "regiao": "CBLOL"}); O.sem_estrela(); m.game = "lol"
	for g in ["lol", "cs2", "ff"]:
		m.game = g; m.tab = "ligas"; O.S.games[g]["aberto"] = true; O.S.games[g].squads.t1.on = true
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 76); lv.sort_custom(func(a, b): return a.o > b.o)
		for r in O.GAMES[g].roles:
			for p in lv:
				if p.r == r: O.contratar(g, "t1", p); break
	m.game = "lol"; for i in 8: O.passo(false)
	m.render(); await shot("10_ligas_lol")
	m.ficha_time("T1", "lol"); await shot("11_ficha_t1")
	m.ficha_jog("Faker", "lol"); await shot("12_ficha_faker")
	m.ficha_time("FURIA", "cs2"); await shot("13_ficha_furia_cs2")
	m.ficha_jog("FalleN", "cs2"); await shot("14_ficha_fallen")
	m.game = "lol"; m.tab = "hall"; m.render(); await shot("15_hall")
	m.ficha_time("LOUD", "lol"); await shot("16_ficha_loud")
	print("shots2 ok"); quit()

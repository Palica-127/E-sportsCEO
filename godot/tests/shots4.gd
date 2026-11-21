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
	for g in ["lol", "cs2"]:
		O.S.games[g]["aberto"] = true; O.S.games[g].squads.t1.on = true
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 76); lv.sort_custom(func(a, b): return a.o > b.o)
		for r in O.GAMES[g].roles:
			for p in lv:
				if p.r == r: O.contratar(g, "t1", p); break
	for i in 6: O.passo(false)
	for t in ["org", "elenco", "mercado", "cal", "ligas", "neg", "hall", "mundo"]:
		m.tab = t; m.render(); await shot("30_" + t)
	m._menu_mais(); await shot("31_mais")
	print("shots4 ok"); quit()

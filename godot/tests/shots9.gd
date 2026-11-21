extends SceneTree
func _initialize() -> void:
	run()
func run() -> void:
	var w = int(OS.get_environment("SW")) if OS.get_environment("SW") != "" else 720
	var h = int(OS.get_environment("SH")) if OS.get_environment("SH") != "" else 1280
	root.size = Vector2i(w, h)
	var O = root.get_node("Org"); O.testando = true
	var m = load("res://scenes/main.tscn").instantiate(); root.add_child(m)
	await process_frame; await process_frame
	O.iniciar({"game": "lol", "nome": "127 Thieves", "regiao": "CBLOL"}); O.sem_estrela(); O.S.org.caixa = 12450000
	for g in ["lol", "cs2"]:
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 80)
		lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
		for r in O.GAMES[g].roles:
			for p in lv:
				if p.r == r and O.S.games[g].squads.t1.slots[O.GAMES[g].roles.find(r)] == null: O.contratar(g, "t1", p); lv.erase(p); break
	for i in 30: O.passo(false)
	var tabs = OS.get_environment("TABS").split(",") if OS.get_environment("TABS") != "" else ["org"]
	for t in tabs:
		m.tab = t; m.render(); await process_frame; await process_frame; await create_timer(0.3).timeout
		root.get_viewport().get_texture().get_image().save_png("/tmp/shots/v2_%s_%d.png" % [t, w])
	quit()

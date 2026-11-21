extends SceneTree
# Smoke test visual: xvfb-run godot --path godot --script tests/shots.gd  (grava PNGs em /tmp/shots)
var m: Control
func shot(n: String) -> void:
	await process_frame; await process_frame
	var img := root.get_texture().get_image(); img.save_png("/tmp/shots/%s.png" % n)
func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("/tmp/shots")
	var O = root.get_node("Org"); O.testando = true
	var sc: PackedScene = load("res://scenes/main.tscn"); m = sc.instantiate(); root.add_child(m)
	root.size = Vector2i(720, 1280)
	run()
func run() -> void:
	var O = root.get_node("Org")
	await shot("00_setup")
	m.cfg.nome = "Palica Esports"; O.iniciar({"game": "lol", "nome": "Palica Esports", "regiao": "CBLOL"}); m.game = "lol"; m.render()
	await shot("01_estrela")
	O.sem_estrela(); m.render()
	var lv: Array = O.livres("lol").filter(func(p): return p.o <= 74)
	lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	for r in O.GAMES.lol.roles:
		for p in lv:
			if p.r == r: O.contratar("lol", "t1", p); break
	O.comprar_infra("base", "lol"); m.render()
	await shot("02_org")
	for t in ["elenco", "mercado", "cal", "ligas", "neg", "hall"]:
		m.tab = t; m.render(); await shot("03_" + t)
	m.tab = "org"; m.auto = false
	for i in 40:
		var r: Dictionary = O.passo(true)
		if r.get("parou", false): m.mostra_pre(r); await shot("04_pre"); m._simular(); await shot("05_res"); m.close_modal(); break
	m.tab = "elenco"; m.render(); m.ficha_slot("lol", "t1", 0); await shot("06_ficha")
	print("shots ok"); quit()

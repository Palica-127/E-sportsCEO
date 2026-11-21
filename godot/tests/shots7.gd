extends SceneTree
func _init():
	var m = load("res://scenes/main.tscn").instantiate(); root.add_child(m)
	await process_frame; await process_frame
	m.tab = "fin"
	for md in ["x"]:
		m.rank_modo = md; m.render(); await process_frame; await process_frame
		root.get_viewport().get_texture().get_image().save_png("/tmp/shots/fin.png")
	quit()

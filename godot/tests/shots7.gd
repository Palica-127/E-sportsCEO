extends SceneTree
func _init():
	var m = load("res://scenes/main.tscn").instantiate(); root.add_child(m)
	await process_frame; await process_frame
	m.tab = "rank"
	for md in ["orgs","rec"]:
		m.rank_modo = md; m.render(); await process_frame; await process_frame
		root.get_viewport().get_texture().get_image().save_png("/tmp/shots/rank_%s.png" % md)
	quit()

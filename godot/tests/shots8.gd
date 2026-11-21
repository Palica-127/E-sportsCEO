extends SceneTree
func _init():
	root.size = Vector2i(1920, 1080)
	var m = load("res://scenes/main.tscn").instantiate(); root.add_child(m)
	await process_frame; await process_frame
	m.tab = "legado"; m.render(); await create_timer(0.4).timeout
	root.get_viewport().get_texture().get_image().save_png("/tmp/shots/wide.png")
	quit()

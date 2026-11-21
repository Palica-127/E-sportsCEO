extends Control
## Interface do eSports CEO (Godot). Tudo é montado por código; render() refaz a tela atual.

const TABS := [["org", "Org"], ["elenco", "Elenco"], ["mercado", "Mercado"], ["cal", "Agenda"], ["ligas", "Ligas"], ["neg", "Negócios"], ["hall", "Hall"], ["mundo", "Mundo"]]
const NAV_MAIN := [["org", "Painel"], ["elenco", "Elenco"], ["mercado", "Mercado"], ["cal", "Agenda"]]
const NAV_MORE := [["ligas", "Ligas e tabelas"], ["fin", "Finanças"], ["neg", "Negócios e patrocínios"], ["hall", "Hall da fama"], ["mundo", "Mundo e revelações"]]
const BG := Color("0a0d16"); const SURF := Color("131929"); const SURF2 := Color("1b2338"); const LINE := Color("27314a")
const CARD := SURF; const ACC := Color("4f8cff"); const ACC2 := Color("22d3ee"); const TXT := Color("eef1ff"); const DIM := Color("8a94b8")
const OK := Color("3ddc97"); const BAD := Color("ff5d6c"); const GOLD := Color("ffc857")
const GCOL := {"lol": Color("c89b3c"), "cs2": Color("f5a623"), "dota2": Color("e0453a"), "valorant": Color("ff4655"), "ff": Color("ff8a00"), "r6": Color("4cc3ff"), "fifa": Color("3ddc84"), "wr": Color("4aa8ff")}
var O: Node
var tab = "org"; var game = "lol"; var squad = "t1"
var content: VBoxContainer; var top: Label; var topsub: Label; var topchips: HBoxContainer; var gbar: HBoxContainer; var nav: HBoxContainer; var scroll: ScrollContainer
var modal_layer: Control
var play = false; var auto = false; var timer: Timer; var vel = 0.45
var merc = {"role": "", "pay": true, "n": 25, "liga": ""}
var hy = 0; var hall_mode = "ano"; var fm = ""   # ano do Hall; modo
var toast_lbl: Label; var cfg = {"nome": "Minha Org", "game": "lol", "regiao": ""}

func _ready() -> void:
	O = get_node("/root/Org"); O.carregar_dados()
	set_theme(_build_theme())
	var bg = ColorRect.new(); bg.color = BG; bg.set_anchors_preset(Control.PRESET_FULL_RECT); add_child(bg)
	var root = VBoxContainer.new(); root.set_anchors_preset(Control.PRESET_FULL_RECT); root.add_theme_constant_override("separation", 0); add_child(root)
	# cabeçalho
	var hb = PanelContainer.new(); hb.add_theme_stylebox_override("panel", _sbf(SURF, 0, LINE, 0, 16, 2)); root.add_child(hb)
	var tv = VBoxContainer.new(); tv.add_theme_constant_override("separation", 4); hb.add_child(tv)
	top = Label.new(); top.add_theme_font_size_override("font_size", 34); top.add_theme_color_override("font_color", TXT); top.clip_text = true; tv.add_child(top)
	topsub = Label.new(); topsub.add_theme_color_override("font_color", DIM); topsub.add_theme_font_size_override("font_size", 22); tv.add_child(topsub)
	topchips = HBoxContainer.new(); topchips.add_theme_constant_override("separation", 8); tv.add_child(topchips)
	# barra de jogos
	var gp = PanelContainer.new(); gp.add_theme_stylebox_override("panel", _sbf(BG, 0, LINE, 0, 8, 0)); root.add_child(gp)
	var gs = ScrollContainer.new(); gs.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; gs.custom_minimum_size.y = 62; gp.add_child(gs)
	gbar = HBoxContainer.new(); gbar.add_theme_constant_override("separation", 8); gs.add_child(gbar)
	var mg = MarginContainer.new(); mg.size_flags_vertical = Control.SIZE_EXPAND_FILL; for k in ["left", "right"]: mg.add_theme_constant_override("margin_" + k, 14)
	root.add_child(mg)
	scroll = ScrollContainer.new(); scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL; scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; mg.add_child(scroll)
	content = VBoxContainer.new(); content.size_flags_horizontal = Control.SIZE_EXPAND_FILL; content.add_theme_constant_override("separation", 14); scroll.add_child(content)
	# navegação inferior
	var np = PanelContainer.new(); np.add_theme_stylebox_override("panel", _sbf(SURF, 0, LINE, 0, 6, 2, true)); root.add_child(np)
	nav = HBoxContainer.new(); nav.add_theme_constant_override("separation", 4); np.add_child(nav)
	modal_layer = Control.new(); modal_layer.set_anchors_preset(Control.PRESET_FULL_RECT); modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE; add_child(modal_layer)
	toast_lbl = Label.new(); toast_lbl.visible = false; toast_lbl.add_theme_color_override("font_color", GOLD); toast_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM); toast_lbl.position.y -= 150; toast_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD; toast_lbl.custom_minimum_size.x = 640; toast_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; add_child(toast_lbl)
	timer = Timer.new(); timer.one_shot = false; timer.timeout.connect(_tick); add_child(timer)
	auto = FileAccess.file_exists("user://auto") 
	if O.tem_save() and O.load_save(): pass
	else: O.reset_estado(); O.comecar()
	if O.S.get("inicio") != null and O.GAMES.has(O.S.inicio): game = O.S.inicio if O.aberto(O.S.inicio) else "lol"
	render()

# ---------- tema ----------
func _sbf(c: Color, r := 14, bc = null, bw := 0, m := 14, bt := -1, topline := false) -> StyleBoxFlat:
	var s = StyleBoxFlat.new(); s.bg_color = c; s.set_corner_radius_all(r); s.set_content_margin_all(m)
	if bc != null:
		if bt >= 0 and bw == 0:   # só uma linha (topo ou base)
			if topline: s.border_width_top = bt
			else: s.border_width_bottom = bt
		else: s.set_border_width_all(bw)
		s.border_color = bc
	return s
func _sb(c: Color, r := 14) -> StyleBoxFlat: return _sbf(c, r, null, 0, 12)
func _build_theme() -> Theme:
	var th = Theme.new(); th.default_font_size = 26
	th.set_color("font_color", "Label", TXT)
	for st in ["Button", "OptionButton", "CheckButton"]:
		th.set_color("font_color", st, TXT); th.set_color("font_hover_color", st, TXT); th.set_color("font_pressed_color", st, Color.WHITE); th.set_color("font_focus_color", st, TXT); th.set_color("font_disabled_color", st, Color("5a6485"))
		th.set_color("font_hover_pressed_color", st, Color.WHITE)
	th.set_stylebox("normal", "Button", _sbf(SURF2, 12, LINE, 1, 12)); th.set_stylebox("hover", "Button", _sbf(Color("222c46"), 12, LINE, 1, 12))
	th.set_stylebox("pressed", "Button", _sbf(ACC, 12, null, 0, 12)); th.set_stylebox("hover_pressed", "Button", _sbf(ACC, 12, null, 0, 12))
	th.set_stylebox("disabled", "Button", _sbf(Color("10162a"), 12, LINE, 1, 12)); th.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	for k in ["normal", "hover", "pressed", "disabled", "focus", "hover_pressed"]: th.set_stylebox(k, "OptionButton", th.get_stylebox("normal" if k != "focus" else "focus", "Button"))
	th.set_stylebox("normal", "LineEdit", _sbf(SURF2, 12, LINE, 1, 14)); th.set_stylebox("focus", "LineEdit", _sbf(SURF2, 12, ACC, 2, 14)); th.set_color("font_color", "LineEdit", TXT)
	th.set_stylebox("panel", "PopupMenu", _sbf(SURF2, 12, LINE, 1, 10)); th.set_stylebox("hover", "PopupMenu", _sbf(ACC, 8, null, 0, 8)); th.set_font_size("font_size", "PopupMenu", 26); th.set_constant("v_separation", "PopupMenu", 14)
	th.set_stylebox("panel", "PanelContainer", _sbf(SURF, 16, LINE, 1, 14))
	var gr = StyleBoxFlat.new(); gr.bg_color = Color(1, 1, 1, 0.12); gr.set_corner_radius_all(6); gr.content_margin_left = 6; gr.content_margin_right = 6
	th.set_stylebox("grabber", "VScrollBar", gr); th.set_stylebox("grabber_highlight", "VScrollBar", gr); th.set_stylebox("grabber_pressed", "VScrollBar", gr); th.set_stylebox("scroll", "VScrollBar", StyleBoxEmpty.new())
	th.set_stylebox("separator", "HSeparator", _sbf(LINE, 0, null, 0, 0)); th.set_constant("separation", "HSeparator", 10)
	return th
func chip_style(b: Button, c: Color, sel: bool) -> void:   # botão "pílula" colorido
	b.add_theme_stylebox_override("normal", _sbf(c if sel else SURF2, 22, LINE if not sel else null, 1 if not sel else 0, 10))
	b.add_theme_stylebox_override("hover", _sbf(c if sel else Color("222c46"), 22, null, 0, 10)); b.add_theme_stylebox_override("pressed", _sbf(c, 22, null, 0, 10)); b.add_theme_stylebox_override("hover_pressed", _sbf(c, 22, null, 0, 10))
	b.add_theme_color_override("font_color", Color("0a0d16") if sel and c.get_luminance() > 0.45 else TXT); b.add_theme_color_override("font_pressed_color", Color("0a0d16") if c.get_luminance() > 0.45 else Color.WHITE)
	b.add_theme_color_override("font_hover_color", Color("0a0d16") if sel and c.get_luminance() > 0.45 else TXT); b.add_theme_color_override("font_hover_pressed_color", Color("0a0d16") if c.get_luminance() > 0.45 else Color.WHITE)

# ---------- helpers de UI ----------
func lbl(p, t, size := 0, col = null, wrap := true) -> Label:
	var l = Label.new(); l.text = str(t); if wrap: l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if size: l.add_theme_font_size_override("font_size", size)
	if col != null: l.add_theme_color_override("font_color", col)
	p.add_child(l); return l
func btn(p, t, cb: Callable, dis := false, accent := false) -> Button:
	var b = Button.new(); b.text = t; b.disabled = dis; b.pressed.connect(cb); b.custom_minimum_size.y = 58
	if accent:
		b.add_theme_stylebox_override("normal", _sbf(ACC, 12, null, 0, 12)); b.add_theme_stylebox_override("hover", _sbf(Color("6ba0ff"), 12, null, 0, 12)); b.add_theme_stylebox_override("pressed", _sbf(Color("3a6fd8"), 12, null, 0, 12)); b.add_theme_color_override("font_color", Color.WHITE)
	p.add_child(b); return b
func card(title := "", parent = null, accent = null) -> VBoxContainer:
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sbf(SURF, 16, LINE, 1, 16)); (parent if parent != null else content).add_child(pc)
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", 10); pc.add_child(v)
	if title != "":
		var h = hrow(v); var bar = ColorRect.new(); bar.color = accent if accent != null else ACC; bar.custom_minimum_size = Vector2(5, 28); h.add_child(bar)
		lbl(h, title, 28, TXT)
	return v
func rowbtn(p, cb: Callable) -> Array:   # linha clicável com conteúdo livre: [botão, HBox interno]
	var b = Button.new(); b.custom_minimum_size.y = 78; b.pressed.connect(cb); p.add_child(b)
	var mc = MarginContainer.new(); mc.set_anchors_preset(Control.PRESET_FULL_RECT); for k in ["left", "right"]: mc.add_theme_constant_override("margin_" + k, 12)
	for k in ["top", "bottom"]: mc.add_theme_constant_override("margin_" + k, 6)
	b.add_child(mc); var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 12); h.alignment = BoxContainer.ALIGNMENT_CENTER; mc.add_child(h); return [b, h]
func ignore_mouse(n: Node) -> void:
	for c in n.get_children():
		if c is Control and not (c is Button and c != n): c.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ignore_mouse(c)
func hrow(p) -> HBoxContainer:
	var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 10); p.add_child(h); return h
func pill(p, t, col = null, fill = false) -> Label:   # etiqueta arredondada
	var l = Label.new(); l.text = str(t); l.add_theme_font_size_override("font_size", 20)
	var c = col if col != null else DIM
	l.add_theme_color_override("font_color", Color("0a0d16") if fill else c)
	var s = _sbf(c if fill else Color(c.r, c.g, c.b, 0.14), 20, null, 0, 6); s.content_margin_left = 12; s.content_margin_right = 12; l.add_theme_stylebox_override("normal", s)
	p.add_child(l); return l
func kpi(p, items: Array) -> void:   # linha de indicadores [rótulo, valor, cor]
	var h = hrow(p); h.add_theme_constant_override("separation", 10)
	for it in items:
		var pc = PanelContainer.new(); pc.size_flags_horizontal = Control.SIZE_EXPAND_FILL; pc.add_theme_stylebox_override("panel", _sbf(SURF2, 14, LINE, 1, 12)); h.add_child(pc)
		var v = VBoxContainer.new(); v.add_theme_constant_override("separation", 2); pc.add_child(v)
		lbl(v, it[0], 18, DIM, false); lbl(v, it[1], 28, it[2] if it.size() > 2 else TXT, false)
func bar(p, titulo, val, mx, col = null, txt := "") -> void:   # barra de progresso rotulada
	var h = hrow(p)
	if titulo != "": var l = lbl(h, titulo, 22, DIM, false); l.custom_minimum_size.x = 215; l.size_flags_horizontal = Control.SIZE_FILL
	var pb = ProgressBar.new(); pb.min_value = 0; pb.max_value = mx; pb.value = val; pb.show_percentage = false; pb.custom_minimum_size.y = 16; pb.size_flags_horizontal = Control.SIZE_EXPAND_FILL; pb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	pb.add_theme_stylebox_override("background", _sbf(SURF2, 8, null, 0, 0)); pb.add_theme_stylebox_override("fill", _sbf(col if col != null else ACC, 8, null, 0, 0)); h.add_child(pb)
	var t = lbl(h, txt if txt != "" else str(int(val)), 22, TXT, false); t.custom_minimum_size.x = 70; t.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT; t.size_flags_horizontal = Control.SIZE_FILL
func chips(p, items: Array, sel, cb: Callable) -> void:
	var f = HFlowContainer.new(); f.add_theme_constant_override("h_separation", 8); f.add_theme_constant_override("v_separation", 8); p.add_child(f)
	for it in items:
		var b = Button.new(); b.text = str(it[1]); b.toggle_mode = true; var on = (str(it[0]) == str(sel)); b.button_pressed = on; b.custom_minimum_size.y = 52
		chip_style(b, ACC, on); b.pressed.connect(cb.bind(it[0])); f.add_child(b)
func toast(t: String) -> void:
	toast_lbl.text = t; toast_lbl.visible = true; toast_lbl.add_theme_stylebox_override("normal", _sbf(Color("0a0d16e6"), 14, GOLD, 1, 14))
	get_tree().create_timer(2.6).timeout.connect(func(): toast_lbl.visible = false)
func res(r: Dictionary) -> void:  # mostra o resultado de uma ação e redesenha
	toast(r.get("msg", "")); render()
func modal(title: String) -> VBoxContainer:
	for c in modal_layer.get_children(): c.queue_free()
	modal_layer.mouse_filter = Control.MOUSE_FILTER_STOP
	var dim = ColorRect.new(); dim.color = Color(0, 0, 0, 0.78); dim.set_anchors_preset(Control.PRESET_FULL_RECT); modal_layer.add_child(dim)
	var mc = MarginContainer.new(); mc.set_anchors_preset(Control.PRESET_FULL_RECT)
	for s in ["left", "right"]: mc.add_theme_constant_override("margin_" + s, 20)
	for s in ["top", "bottom"]: mc.add_theme_constant_override("margin_" + s, 70)
	modal_layer.add_child(mc)
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sbf(SURF, 20, ACC, 2, 18)); mc.add_child(pc)
	var sc = ScrollContainer.new(); sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; pc.add_child(sc)
	var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.add_theme_constant_override("separation", 10); sc.add_child(v)
	var h = hrow(v); lbl(h, title, 32, TXT); var x = Button.new(); x.text = "X"; x.custom_minimum_size = Vector2(64, 58); x.pressed.connect(close_modal); h.add_child(x)
	return v
func close_modal() -> void:
	for c in modal_layer.get_children(): c.queue_free()
	modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE; render()
func clear(n: Node) -> void:
	for c in n.get_children(): n.remove_child(c); c.queue_free()
func stars(n) -> String: return "★".repeat(int(n)) + "☆".repeat(5 - int(n))
func gname(g) -> String: return O.GAMES[g].curto

# ---------- render ----------
func render() -> void:
	var S = O.S
	clear(content); clear(gbar); clear(nav); clear(topchips)
	if S.setup == "config": top.text = "Nova org"; topsub.text = "Configure e comece"; vsetup(); return
	if S.setup == "estrela": top.text = S.org.nome; topsub.text = "Convide uma estrela"; vestrela(); return
	top.text = S.org.nome
	topsub.text = "Semana %d · %d" % [S.org.semana, S.org.ano]
	pill(topchips, "Caixa " + O.money(S.org.caixa), OK if S.org.caixa >= 0 else BAD, true)
	pill(topchips, "Rep %.1f" % S.org.rep, GOLD); pill(topchips, _fmt_n(S.social.seg) + " seg.", ACC2)
	for g in O.GAMES:
		if not O.ativo(g): continue
		if O.aberto(g):
			var b = Button.new(); b.text = gname(g); b.toggle_mode = true; var on = (g == game); b.button_pressed = on; b.custom_minimum_size = Vector2(0, 50); chip_style(b, GCOL.get(g, ACC), on)
			b.pressed.connect(func(): game = g; squad = "t1"; render()); gbar.add_child(b)
	var mais_on = not NAV_MAIN.any(func(t): return t[0] == tab)
	for t in NAV_MAIN:
		_nav_btn(t[1], t[0] == tab, func(): tab = t[0]; render())
	_nav_btn("Mais", mais_on, _menu_mais)
	match tab:
		"org": vorg()
		"elenco": velenco()
		"mercado": vmercado()
		"cal": vcal()
		"ligas": vligas()
		"fin": vfin()
		"neg": vneg()
		"hall": vhall()
		"mundo": vmundo()
	scroll.scroll_vertical = 0
func _nav_btn(t: String, on: bool, cb: Callable) -> void:
	var b = Button.new(); b.text = t; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 68; b.add_theme_font_size_override("font_size", 23)
	var n = _sbf(Color(ACC.r, ACC.g, ACC.b, 0.18) if on else Color(0, 0, 0, 0), 14, null, 0, 10)
	for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, n)
	b.add_theme_color_override("font_color", ACC2 if on else DIM); b.add_theme_color_override("font_hover_color", ACC2 if on else TXT); b.add_theme_color_override("font_pressed_color", ACC2)
	b.pressed.connect(cb); nav.add_child(b)
func _menu_mais() -> void:
	var v = modal("Mais")
	for t in NAV_MORE:
		var b = btn(v, t[1], func(): tab = t[0]; close_modal(), false, t[0] == tab); b.custom_minimum_size.y = 76
func _fmt_n(n) -> String: return "%.1f mi" % (n / 1e6) if n >= 1e6 else "%.1f mil" % (n / 1e3) if n >= 1e4 else str(int(n))

# ---------- Início de jogo ----------
func vsetup() -> void:
	var c = card("Sua organização")
	var le = LineEdit.new(); le.text = cfg.nome; le.custom_minimum_size.y = 60; le.text_changed.connect(func(t): cfg.nome = t); c.add_child(le)
	lbl(c, "Jogo inicial", 26, DIM)
	var its = []
	for g in O.GAMES:
		if O.ativo(g): its.append([g, gname(g)])
	chips(c, its, cfg.game, func(id): cfg.game = id; cfg.regiao = ""; render())
	lbl(c, "Região", 26, DIM)
	var regs = []
	for k in O.D(cfg.game).leagues: regs.append([k, O.D(cfg.game).leagues[k].get("nome", k)])
	if cfg.regiao == "" or not O.D(cfg.game).leagues.has(cfg.regiao): cfg.regiao = O.D(cfg.game).inicio
	chips(c, regs, cfg.regiao, func(id): cfg.regiao = id; render())
	btn(c, "Criar org", func():
		var r: Dictionary = O.iniciar({"game": cfg.game, "nome": cfg.nome, "regiao": cfg.regiao}); game = cfg.game; render(), false, true)
func vestrela() -> void:
	var c = card("Convide uma estrela")
	lbl(c, "Tentativas: %d. Estrelas aceitam menos; a chance depende da nota. Quem aceitar entra sem taxa e vira o rosto da org." % O.S.tent, 24, DIM)
	btn(c, "Começar sem estrela", func(): O.sem_estrela(); render())
	var g: String = O.S.inicio; var lst: Array = O.livres(g).filter(func(p): return p.tier == "T1")
	lst.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	var c2 = card("Candidatos")
	for p in lst.slice(0, 15):
		var h = hrow(c2); lbl(h, "%s  %s  nota %d  (%d%%)" % [p.n, p.r, p.o, jr100(O.chance_estrela(p.o))], 24)
		btn(h, "Convidar", func(): var r: Dictionary = O.convidar_estrela(p); toast(r.msg); render())
func jr100(x) -> int: return int(round(x * 100))

# ---------- Org ----------
func vorg() -> void:
	var S = O.S; var pr: Dictionary = O.projecao_org()
	kpi(content, [["SALDO / SEMANA", O.money(pr.saldo), OK if pr.saldo >= 0 else BAD], ["RECEITA", O.money(pr.receita), TXT], ["DESPESA", O.money(pr.despesa), TXT]])
	var c = card()
	var h = hrow(c)
	var b1 = btn(h, "Parar" if play else "Avançar", _toggle_play, false, true); b1.custom_minimum_size.y = 72; b1.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b1.add_theme_font_size_override("font_size", 30)
	var b2 = btn(h, "+1 semana", func(): _manual(1)); b2.custom_minimum_size.y = 72
	var b3 = btn(h, "Até o jogo", _ate_jogo); b3.custom_minimum_size.y = 72
	var h2 = hrow(c)
	var tg = CheckButton.new(); tg.text = "Pular partidas"; tg.button_pressed = auto; tg.size_flags_horizontal = Control.SIZE_EXPAND_FILL; tg.toggled.connect(func(on):
		auto = on
		if on: FileAccess.open("user://auto", FileAccess.WRITE).store_string("1")
		else: DirAccess.remove_absolute(ProjectSettings.globalize_path("user://auto"))); h2.add_child(tg)
	lbl(h2, "Velocidade", 22, DIM, false)
	var sp = OptionButton.new(); sp.add_item("1x"); sp.add_item("2x"); sp.add_item("6x"); sp.selected = [0.45, 0.22, 0.07].find(vel) if [0.45, 0.22, 0.07].has(vel) else 0
	sp.item_selected.connect(func(i): vel = [0.45, 0.22, 0.07][i]; if play: timer.start(vel)); h2.add_child(sp)
	# próximo jogo (o mais cedo entre todos os jogos)
	var prox = null
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		for sq in O.SQUADS:
			if O.comp_for(g, sq) == null: continue
			for a in O.agenda(g, sq, 3):
				a["g"] = g; a["tag"] = O.tag_de(g, sq)
				if a.tipo != "ini" and (prox == null or a.em < prox.em): prox = a
	var cp = card("Próximo jogo", null, GOLD)
	if prox == null: lbl(cp, "Nada agendado: complete os titulares de um time.", 24, DIM)
	else:
		var hp = hrow(cp); pill(hp, gname(prox.g), GCOL.get(prox.g, ACC), true); pill(hp, prox.tag, DIM); pill(hp, "em %d sem." % prox.em if prox.em > 0 else "esta semana", GOLD)
		lbl(cp, "%s%s" % [prox.label, ("  ×  " + str(prox.op)) if prox.op != null else ""], 30, TXT)
		lbl(cp, str(prox.data.txt), 22, DIM)
	vdiretoria()
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		var cg = card(O.GAMES[g].nome, null, GCOL.get(g, ACC))
		for sq in O.SQUADS:
			var cpt = O.comp_for(g, sq)
			if cpt == null: continue
			var st: String = {"off": "entressafra", "wait": "aguardando titulares", "reg": "rodada %d" % (cpt.round + 1), "po": "playoffs", "intl": "internacional"}[cpt.phase]
			var hh = hrow(cg); lbl(hh, O.SQUADS[sq].nome, 24, TXT, false); var sl = Control.new(); sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL; hh.add_child(sl); pill(hh, st, ACC2)
			var fo: float = O.forca(g, sq); bar(cg, "Força", fo, 100.0, nota_col(fo), "%.1f" % fo)
	var cn = card("Notícias", null, ACC2)
	for l in S.log.slice(0, 8): lbl(cn, l, 21, DIM)
	var cr = card()
	btn(cr, "Tem certeza? Toque de novo" if fm == "reset" else "Nova org (apaga o save)", func():
		if fm == "reset": fm = ""; O.reset_estado(); O.comecar(); render()
		else: fm = "reset"; render())
func _toggle_play() -> void:
	play = not play
	if play: timer.start(vel)
	else: timer.stop()
	render()
func _manual(n: int) -> void:
	for i in n:
		var r: Dictionary = O.passo(not auto)
		if r.get("parou", false): mostra_pre(r); return
		_depois(r)
	render()
func _ate_jogo() -> void:
	for i in 60:
		var r: Dictionary = O.passo(not auto)
		if r.get("parou", false): mostra_pre(r); return
		if r.get("partidas", []).size() or r.get("motivo") != null: _depois(r); break
	render()
func _tick() -> void:
	if modal_layer.get_child_count() > 0: return
	var r: Dictionary = O.passo(not auto)
	if r.get("parou", false): timer.stop(); mostra_pre(r); return
	_depois(r)
	if play: render()
func _depois(r: Dictionary) -> void:
	if r.get("partidas", []).size() and not auto: timer.stop(); mostra_res(r.partidas); return
	if r.get("motivo") != null:
		play = false; timer.stop(); toast(str(r.motivo))
func mostra_pre(r: Dictionary) -> void:
	var v = modal("Partida na semana %d" % r.semana)
	for p in r.partidas:
		var c = card("", v)
		lbl(c, p.tag, 24, DIM); var hv = hrow(c); hv.add_child(crest(p.euNome, 56)); lbl(hv, "vs", 26, DIM); hv.add_child(crest(p.op, 56)); lbl(c, "%s  vs  %s" % [p.euNome, p.op], 30, TXT)
		lbl(c, "%s · Bo%d · força %.1f x %.1f · chance %d%%" % [p.fase, p.bo, p.fMeu, p.fOp, jr100(p.p)], 24)
	btn(v, "Simular partida", func(): _simular(), false, true)
func _simular() -> void:
	var r: Dictionary = O.passo(false); for c in modal_layer.get_children(): c.queue_free()
	if r.get("partidas", []).size(): mostra_res(r.partidas)
	else: close_modal()
func mostra_res(ps: Array) -> void:
	var v = modal("Resultado")
	for d in ps:
		var nar: Dictionary = d.nar; var c = card("", v)
		lbl(c, d.tag + " · " + d.fase, 22, DIM)
		var hv = hrow(c); hv.add_child(crest(d.euNome, 56)); hv.add_child(crest(d.op, 56)); lbl(c, "%s %d x %d %s" % [d.euNome, d.meus, d.deles, d.op], 34, OK if d.v else BAD)
		lbl(c, "VITÓRIA" if d.v else "DERROTA", 26, OK if d.v else BAD)
		for j in nar.jogos:
			var t = "%s (%s)" % [j.lbl, j.sub]; for m in j.m: t += "  %s %d-%d" % [m.n, m.a, m.b]
			lbl(c, t, 22)
		for m in nar.momentos: lbl(c, "• " + m.txt, 22, DIM)
		lbl(c, "MVP: %s (%s) · %s" % [nar.mvp.n, nar.mvp.time, nar.mvp.stat], 24, GOLD)
		var e = d.get("efeito")
		if e != null: lbl(c, "Caixa %s · Rep %+.2f · Torcida %+.1f%%" % [O.money(e.caixa), e.rep, e.seg * 100], 22, DIM)
		for n in d.get("notas", []): lbl(c, "→ " + n, 22, GOLD)
	btn(v, "Continuar", close_modal_continue, false, true)
func close_modal_continue() -> void:
	close_modal()
	if play: timer.start(vel)

# ---------- Elenco ----------
func velenco() -> void:
	var g = game; var S = O.S
	var c0 = card()
	var its = []
	for sq in O.SQUADS: its.append([sq, O.SQUADS[sq].nome.split(" (")[0] + ("" if S.games[g].squads[sq].on else " +")])
	chips(c0, its, squad, func(id): squad = id; render())
	var q = S.games[g].squads[squad]
	if not q.on:
		var c = card(O.SQUADS[squad].nome)
		lbl(c, "Criar este time custa %s de licença." % O.money(O.SQUADS[squad].licenca))
		btn(c, "Criar time", func(): res(O.ativar_squad(g, squad)), false, true)
		return
	var c = card("%s · força %.1f" % [O.SQUADS[squad].nome, O.forca(g, squad)])
	lbl(c, "Folha %s/sem · moral média %s" % [O.money(O.folha(g, squad)), O.moral_rot(_moral_media(g, squad))], 22, DIM)
	lbl(c, "Foco de treino do time:", 22, DIM)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(c, fs, "", func(id): res(O.foco_equipe(g, squad, id)))
	var roles = O.GAMES[g].roles; var n = roles.size()
	for i in q.slots.size():
		var p = q.slots[i]; var tit = "Titular" if i < n else "Reserva"; var rl: String = roles[i] if i < n else "RES"
		var row = hrow(c)
		if p == null:
			lbl(row, "%s — vaga vazia (%s)" % [rl, tit], 24, DIM); continue
		var tr: Dictionary = O.tendencia(p, g, squad, i < n)
		row.queue_free()
		var rb = rowbtn(c, func(): ficha_slot(g, squad, i)); var rr: HBoxContainer = rb[1]
		var av = avatar(p.n, 56, g); rr.add_child(av)
		var cv = VBoxContainer.new(); cv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; cv.add_theme_constant_override("separation", 0); rr.add_child(cv)
		var l1 = Label.new(); l1.text = p.n; l1.add_theme_font_size_override("font_size", 28); cv.add_child(l1)
		var l2 = Label.new(); l2.text = "%s · %sa · %s · pot %d · contrato %d" % [rl, str(p.get("a", "?")), tr.s, p.pot, int(p.get("ct", O.CONTRATO))]; l2.add_theme_font_size_override("font_size", 19); l2.add_theme_color_override("font_color", DIM); l2.clip_text = true; cv.add_child(l2)
		var ov = Label.new(); ov.text = str(p.o); ov.add_theme_font_size_override("font_size", 32); ov.add_theme_color_override("font_color", nota_col(p.o)); ov.custom_minimum_size.x = 56; ov.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; rr.add_child(ov)
		ignore_mouse(rb[0])
	_base_card(g)
func _moral_media(g, sq) -> float:
	var t: Array = O.titulares(g, sq).filter(func(p): return p != null)
	if t.is_empty(): return 70.0
	var s = 0.0
	for p in t: s += p.mo
	return s / t.size()
func ficha_slot(g, sq, i) -> void:
	var p = O.S.games[g].squads[sq].slots[i]
	if p == null: return
	var v = modal("%s · %s" % [p.n, O.GAMES[g].roles[i] if i < O.nT(g) else "Reserva"])
	var pv: Dictionary = O.pot_visivel(p, g); var tr: Dictionary = O.tendencia(p, g, sq, i < O.nT(g))
	lbl(v, "Nota %d · potencial %s%s · idade %s · %s" % [p.o, stars(pv.estrelas), "?" if pv.incerto else "", str(p.get("a", "?")), str(p.get("c", ""))], 26)
	lbl(v, "Moral: %s (%d) · XP %d/%d · tendência %s (%+.1f/ano)" % [O.moral_rot(p.mo), p.mo, p.xp, O.xp_necessario(p.o), tr.s, tr.anual], 24, DIM)
	if p.get("tr") != null: lbl(v, "Traço: %s — %s" % [O.TRACOS[p.tr].nome, O.TRACOS[p.tr].desc], 22, GOLD)
	lbl(v, "Contrato: %d semanas · salário %s/sem · valor de venda %s" % [int(p.get("ct", O.CONTRATO)), O.money(O.salario_de(p)), O.money(O.valor_venda(p))], 22, DIM)
	lbl(v, "Foco de treino:", 24)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(v, fs, p.foco, func(id): O.trocar_foco(g, sq, i, id); ficha_slot(g, sq, i))
	lbl(v, "Renovar contrato:", 24)
	for of in O.OFERTAS:
		var pr: Dictionary = O.proposta_renovar(p, of, 2)
		btn(v, "%s · 2 anos · %s · aceita %d%%" % [O.OFERTAS[of].nome, O.money(pr.custo), jr100(pr.chance)], func(): var r: Dictionary = O.renovar(g, sq, i, of, 2); toast(r.msg); ficha_slot(g, sq, i))
	if not p.get("estrela", false):
		btn(v, "Vender (%s)" % O.money(O.valor_venda(p)), func(): var r: Dictionary = O.vender(g, sq, i); toast(r.msg); close_modal())
		btn(v, "Dispensar", func(): var r: Dictionary = O.dispensar(g, sq, i); toast(r.msg); close_modal())
		for o in O.SQUADS:
			if o != sq and O.S.games[g].squads[o].on: btn(v, "Mover para " + O.SQUADS[o].nome, func(): var r: Dictionary = O.mover(g, sq, o, i); toast(r.msg); close_modal())
func _base_card(g) -> void:
	var nv: int = O.infra_nivel("base", g)
	var c = card("Categoria de base (nível %d)" % nv)
	if nv == 0: lbl(c, "Compre a Categoria de base em Negócios para revelar jovens a cada split.", 22, DIM); return
	lbl(c, "Vagas %d/%d · custo %s/sem" % [O.S.base.get(g, []).size(), O.cap_base(nv), O.money(O.custo_base(g))], 22, DIM)
	for p in O.S.base.get(g, []):
		var pv: Dictionary = O.pot_visivel(p, g); var b = Button.new(); b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.custom_minimum_size.y = 64; b.clip_text = true
		b.text = "%s %s (%s) %da · nota %d · pot %s%s" % [p.r, p.n, p.c, p.a, p.o, stars(pv.estrelas), "?" if pv.incerto else ""]
		b.pressed.connect(func(): ficha_base(g, p)); c.add_child(b)
func ficha_base(g, p) -> void:
	var v = modal("%s (base)" % p.n)
	var pv: Dictionary = O.pot_visivel(p, g)
	lbl(v, "%s · %s · %d anos · nota %d · potencial %s%s%s" % [p.r, p.c, p.a, p.o, stars(pv.estrelas), "?" if pv.incerto else "", " · JOIA RARA" if p.get("genio", false) else ""], 24)
	lbl(v, "Moral %s · XP %d/%d" % [O.moral_rot(p.mo), p.mo, O.xp_necessario(p.o)], 22, DIM)
	if p.get("tr") != null: lbl(v, "Traço: %s — %s" % [O.TRACOS[p.tr].nome, O.TRACOS[p.tr].desc], 22, GOLD)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(v, fs, p.foco, func(id): O.trocar_foco(g, "base", p.id, id); ficha_base(g, p))
	for sq in O.SQUADS:
		if O.S.games[g].squads[sq].on: btn(v, "Promover para " + O.SQUADS[sq].nome, func(): var r: Dictionary = O.promover_base(g, sq, p.id); toast(r.msg); close_modal(), false, true)
	btn(v, "Vender (%s)" % O.money(O.valor_venda(p)), func(): var r: Dictionary = O.vender_base(g, p.id); toast(r.msg); close_modal())
	btn(v, "Dispensar", func(): var r: Dictionary = O.dispensar_base(g, p.id); toast(r.msg); close_modal())

# ---------- Mercado ----------
func vmercado() -> void:
	var g = game; var roles: Array = O.GAMES[g].roles
	var c = card("Mercado · contratar para " + O.SQUADS[squad].nome)
	if not O.S.games[g].squads[squad].on: lbl(c, "Crie esse time na aba Elenco.", 24, DIM); return
	var its = [["", "Todos"]]; for r in roles: its.append([r, r])
	chips(c, its, merc.role, func(id): merc.role = id; merc.n = 25; render())
	var tg = CheckButton.new(); tg.text = "Só quem posso pagar"; tg.button_pressed = merc.pay; tg.toggled.connect(func(on): merc.pay = on; render()); c.add_child(tg)
	var lst: Array = O.livres(g).filter(func(p): return (merc.role == "" or p.r == merc.role) and (not merc.pay or O.S.org.caixa >= O.fee(p.o)))
	lst.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	var c2 = card("%d jogadores" % lst.size())
	for p in lst.slice(0, merc.n):
		var rb = rowbtn(c2, func(): ficha_mercado(g, p)); var rr: HBoxContainer = rb[1]
		rr.add_child(crest(p.t, 48))
		var cv = VBoxContainer.new(); cv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; cv.add_theme_constant_override("separation", 0); rr.add_child(cv)
		var l1 = Label.new(); l1.text = p.n; l1.add_theme_font_size_override("font_size", 27); l1.clip_text = true; cv.add_child(l1)
		var l2 = Label.new(); l2.text = "%s · %sa · %s" % [p.r, str(p.get("a", "?")), p.t]; l2.add_theme_font_size_override("font_size", 19); l2.add_theme_color_override("font_color", DIM); l2.clip_text = true; cv.add_child(l2)
		var ov = Label.new(); ov.text = str(p.o); ov.add_theme_font_size_override("font_size", 30); ov.add_theme_color_override("font_color", nota_col(p.o)); ov.custom_minimum_size.x = 50; ov.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; rr.add_child(ov)
		var pg = Label.new(); pg.text = O.money(O.fee(p.o)); pg.add_theme_font_size_override("font_size", 21); pg.add_theme_color_override("font_color", OK if O.S.org.caixa >= O.fee(p.o) else BAD); pg.custom_minimum_size.x = 100; pg.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT; rr.add_child(pg)
		ignore_mouse(rb[0])
	if lst.size() > merc.n: btn(c2, "Mostrar mais", func(): merc.n += 25; render())
func ficha_mercado(g, p) -> void:
	var v = modal(p.n)
	var pv: Dictionary = O.pot_visivel(O.iniciar_jogador(p.duplicate()), g)
	lbl(v, "%s · %s (%s) · nota %d · %s anos · %s" % [p.r, p.t, p.l, p.o, str(p.get("a", "?")), str(p.get("c", ""))], 26)
	lbl(v, "Potencial %s%s (%d–%d)" % [stars(pv.estrelas), "?" if pv.incerto else "", pv.lo, pv.hi], 24, DIM)
	lbl(v, "Contratação %s · salário %s/sem" % [O.money(O.fee(p.o)), O.money(O.salary(p.o))], 24)
	btn(v, "Contratar para " + O.SQUADS[squad].nome, func(): var r: Dictionary = O.contratar(g, squad, p); toast(r.msg); close_modal(), false, true)

# ---------- Agenda (calendário geral: todos os jogos juntos) ----------
func vcal() -> void:
	var itens = []; var res_l = []
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		for sq in O.SQUADS:
			var c = O.comp_for(g, sq)
			if c == null: continue
			for a in O.agenda(g, sq, 6): a["tag"] = O.tag_de(g, sq); itens.append(a)
			for l in c.last: var x: Dictionary = l.duplicate(); x["tag"] = O.tag_de(g, sq); res_l.append(x)
	itens.sort_custom(func(a, b): return a.em < b.em)
	var c1 = card("Próximas partidas", null, GOLD)
	if itens.is_empty(): lbl(c1, "Nada agendado: complete os titulares de um time.", 24, DIM)
	for a in itens.slice(0, 12):
		var rw = PanelContainer.new(); rw.add_theme_stylebox_override("panel", _sbf(SURF2, 12, LINE, 1, 10)); c1.add_child(rw)
		var hh = hrow(rw)
		var dv = VBoxContainer.new(); dv.custom_minimum_size.x = 92; hh.add_child(dv)
		var dtxt = str(a.data.txt).split(" ")
		lbl(dv, dtxt[0] if dtxt.size() > 0 else "", 34, GOLD, false); lbl(dv, dtxt[1] if dtxt.size() > 1 else "", 19, DIM, false)
		var mv = VBoxContainer.new(); mv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; mv.add_theme_constant_override("separation", 2); hh.add_child(mv)
		lbl(mv, "%s%s" % [a.label, ("  ×  " + str(a.op)) if a.op != null else ""], 25)
		lbl(mv, "%s · em %d sem." % [a.tag, a.em], 19, DIM)
	var c2 = card("Resultados", null, ACC2)
	if res_l.is_empty(): lbl(c2, "Ainda sem jogos.", 24, DIM)
	res_l.sort_custom(func(a, b): return a.y * 100 + a.s > b.y * 100 + b.s)
	for r in res_l.slice(0, 20):
		var hh = hrow(c2); var pl_ = pill(hh, "V" if r.v else "D", OK if r.v else BAD, true); pl_.custom_minimum_size.x = 44; pl_.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		var mv = VBoxContainer.new(); mv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; mv.add_theme_constant_override("separation", 0); hh.add_child(mv)
		lbl(mv, "vs %s" % r.op, 25); lbl(mv, "%s · S%d/%d · %s" % [r.tag, r.s, r.y, r.f], 19, DIM)
		lbl(hh, str(r.pl), 22, OK if r.v else BAD, false)

# ---------- Ligas ----------
func vligas() -> void:
	var g = game; var its = []
	for sq in O.SQUADS:
		if O.S.games[g].squads[sq].on: its.append([sq, O.SQUADS[sq].nome.split(" (")[0]])
	var c0 = card(); chips(c0, its, squad, func(id): squad = id; render())
	var c = O.comp_for(g, squad)
	if c == null: lbl(card(), "Ative esse time.", 24, DIM); return
	var cc = card("%s · %s · split %d" % [gname(g), O.regiao_de(g), c.split])
	if c.phase == "reg" or c.phase == "po":
		var cls: Array = O.classificacao(c); var k = 0
		for r in cls:
			k += 1; time_row(cc, r.n, "   %d-%d · %.1f" % [r.w, r.l, r.f]); cc.get_child(cc.get_child_count() - 1).move_child(cc.get_child(cc.get_child_count() - 1).get_child(1), 1); (cc.get_child(cc.get_child_count() - 1).get_child(1) as Button).text = "%d. %s   %d-%d · %.1f" % [r.pos, r.n, r.w, r.l, r.f]
	else: lbl(cc, "Fase: " + {"off": "entressafra", "wait": "aguardando titulares", "intl": "internacional"}.get(c.phase, c.phase), 24, DIM)
	if c.phase == "intl":
		var ci = card("Internacional: " + O.intl_def(g)[c.intl.tipo].nome)
		for i in c.intl.alive: time_row(ci, O.nome_t(c.intl.teams[i]))
	var ch = card("Campeões recentes")
	for h in c.hist: lbl(ch, "%d · split %d · %s (vice %s)%s" % [h.y, h.s, h.camp, h.vice, (" · você: " + str(h.eu)) if h.eu != null else ""], 22)
	var ci2 = card("Internacionais")
	for x in O.S.intlHist.filter(func(x): return x.g == g).slice(0, 10): lbl(ci2, "%d · %s · %s%s" % [x.y, x.nome, x.camp, (" · você: " + str(x.eu)) if x.eu != null else ""], 22)

# ---------- Negócios ----------
func vneg() -> void:
	var S = O.S; var g = game
	if S.evento != null:
		var e = null
		for x in O.EVENTOS:
			if x.id == S.evento.id: e = x
		var ce = card("Evento"); lbl(ce, e.txt, 26); lbl(ce, "Expira em %d sem." % S.evento.sem, 20, DIM)
		for i in e.ops.size(): var ii = i; btn(ce, e.ops[i].t, func(): res(O.escolher_evento(ii)))
	var cf = card("Foco da semana")
	chips(cf, [["nenhum", "Nenhum"], ["treino", "Treino (+custo de moral)"], ["midia", "Mídia (R$ 3 mil/sem)"]], S.foco, func(id): res(O.set_foco(id)))
	var cp = card("Patrocínios (%d/3) · renda %s/sem" % [S.patro.size(), O.money(O.renda_patro())])
	for x in S.patro:
		var hh = hrow(cp); pill(hh, "ATIVO", OK, true)
		var vv0 = VBoxContainer.new(); vv0.size_flags_horizontal = Control.SIZE_EXPAND_FILL; hh.add_child(vv0); lbl(vv0, x.n, 26); lbl(vv0, "%s/sem · %d sem. · título: +%s" % [O.money(x.pay), x.sem, O.money(O.patro_bonus(x))], 19, DIM)
		btn(hh, "Rescindir", func(): res(O.rescindir_patro(x.id)))
	for o in O.ofertas():
		var h = hrow(cp); var vv = VBoxContainer.new(); vv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(vv); lbl(vv, o.n, 26); lbl(vv, "%s/sem · %d sem. · título: +%s" % [O.money(o.pay), o.sem, O.money(O.patro_bonus(o))], 19, DIM); btn(h, "Fechar", func(): res(O.aceitar_patro(o.id)))
	var ci = card("Estrutura · " + gname(g))
	for it in O.INFRA:
		var nv: int = O.infra_nivel(it.id, g); var h = hrow(ci); var vv = VBoxContainer.new(); vv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; vv.add_theme_constant_override("separation", 4); h.add_child(vv)
		lbl(vv, it.nome, 26); lbl(vv, it.desc, 19, DIM); bar(vv, "Nível", nv, it.max, ACC2, "%d/%d" % [nv, it.max])
		btn(h, "Máximo" if nv >= it.max else O.money(O.infra_custo(it, g)), func(): res(O.comprar_infra(it.id, g)), nv >= it.max)
	var cl_ = card("Loja (renova a cada 4 sem.)")
	for it in O.loja_itens():
		var h = hrow(cl_); lbl(h, "%s\n%s" % [it.nome, it.desc], 22)
		btn(h, "Ativo" if O.item_ativo(it, g) else O.money(it.c), func(): res(O.comprar_loja(it.id, g)), O.item_ativo(it, g))
	for it in S.itens: lbl(cl_, "Ativo: %s (%d sem.)" % [it.nome, it.sem], 20, DIM)
	var ca = card("Abrir novos jogos")
	var algum = false
	for x in S.ordem:
		if O.aberto(x): continue
		algum = true; var d: Dictionary = O.desbloqueio(x); var falta: int = d.sem - S.tempo; var h = hrow(ca)
		lbl(h, "%s · %s" % [O.GAMES[x].nome, ("em %d sem." % falta) if falta > 0 else "disponível"], 22)
		btn(h, O.money(d.custo), func(): var r: Dictionary = O.abrir_jogo(x); toast(r.msg); if r.ok: game = x; render(), falta > 0 or S.org.caixa < d.custo)
	if not algum: lbl(ca, "Todos os jogos abertos.", 22, DIM)

# ---------- Hall ----------
func vhall() -> void:
	var g = game; var H: Dictionary = O.hist_de(g); var real: Dictionary = O.HIST.get(g, {})
	var tor: Array = []
	if g == "lol":  # história real do LoL (Mundial e MSI) vem do LOLX
		for y in O.LOLX.get("wct", {}):
			tor.append({"n": "Mundial " + str(y), "a": int(y), "tp": "WORLDS", "c": O.LOLX.wct[y], "v": O.LOLX.get("wcv", {}).get(y, "?"), "p": ""})
		for y in O.LOLX.get("mst", {}):
			tor.append({"n": "MSI " + str(y), "a": int(y), "tp": "MSI", "c": O.LOLX.mst[y], "v": O.LOLX.get("msv", {}).get(y, "?"), "p": ""})
	for t in real.get("torneios", []): tor.append(t)
	for t in H.torneios: tor.append(t)
	var anos = {}
	for t in tor: anos[int(t.a)] = true
	for y in O.S.bo.get(g, {}): anos[int(y)] = true
	var ys: Array = anos.keys(); ys.sort(); ys.reverse()
	if ys.is_empty(): lbl(card("Hall"), "Sem histórico para este jogo ainda.", 24, DIM); return
	if hy == 0 or not ys.has(hy): hy = ys[0]
	var cm = card()
	chips(cm, [["ano", "Por ano"], ["lendas", "Lendas"]], hall_mode, func(id): hall_mode = id; render())
	if hall_mode == "lendas": vlendas(g); return
	var cn = card("Torneios por ano")
	var h = hrow(cn)
	var i: int = ys.find(hy)
	btn(h, "◀", func(): hy = ys[min(i + 1, ys.size() - 1)]; render(), i >= ys.size() - 1)
	lbl(h, str(hy), 34, GOLD).horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	btn(h, "▶", func(): hy = ys[max(i - 1, 0)]; render(), i <= 0)
	var ya = []; for y in ys.slice(0, 40): ya.append([y, str(y)])
	chips(cn, ya.slice(0, 16), hy, func(id): hy = int(id); render())
	for t in tor:
		if int(t.a) != hy: continue
		var ct = card("%s%s" % [t.n, " (simulado)" if t.get("sim", 0) else ""])
		time_row(ct, t.c, "   (campeão)"); lbl(ct, "Vice: %s%s" % [str(t.v), (" · " + str(t.p)) if str(t.get("p", "")) != "" else ""], 22, DIM)
		if t.get("mvp") != null:
			var hm = hrow(ct); hm.add_child(avatar(t.mvp[0], 40, g)); lbl(hm, "MVP: %s (%s)" % [t.mvp[0], t.mvp[1]], 22, DIM)
	var B = O.S.bo.get(g, {}).get(str(hy))
	if B != null:
		var cb = card("Bola de Ouro %d (Top 10)" % hy)
		for k in B.t.size():
			var hb = hrow(cb); hb.add_child(avatar(B.t[k][0], 40, g)); lbl(hb, "%d. %s (%s) · nota %s" % [k + 1, B.t[k][0], B.t[k][1], str(B.t[k][2])], 22, GOLD if k == 0 else TXT)
		var ctoy = card("Time do ano %d" % hy)
		for x in B.a: lbl(ctoy, "%s · %s (%s)" % [x[0], x[1], x[2]], 22)
	var cl_ = card("Aposentadorias de lendas")
	var ap: Array = O.aposentados(g)
	if ap.is_empty(): lbl(cl_, "Nenhuma ainda.", 22, DIM)
	for x in ap.slice(0, 10): lbl(cl_, "%d · %s (%da) · pico %d" % [x.ano, x.nick, x.idade, x.o], 22)

# ---------- Logos, bandeiras e fotos ----------
const ORGS := [
	{"cur": "Dplus KIA", "nm": [["MiraGe Gaming", 2016, 2017], ["DAMWON Gaming", 2017, 2020], ["DWG KIA", 2021, 2021], ["Dplus KIA", 2022, 0]]},
	{"cur": "T1", "nm": [["SK Telecom T1", 2013, 2019], ["T1", 2019, 0]]},
	{"cur": "DRX", "nm": [["Longzhu Gaming", 2016, 2017], ["Kingzone DragonX", 2017, 2019], ["DragonX", 2019, 2019], ["DRX", 2020, 0]]},
	{"cur": "Weibo Gaming", "nm": [["Suning Gaming", 2016, 2019], ["Suning", 2020, 2021], ["Weibo Gaming", 2022, 0]]},
	{"cur": "BLG", "nm": [["Bilibili Gaming", 2017, 2023], ["BLG", 2023, 0]]},
	{"cur": "G2", "nm": [["Gamers2", 2014, 2015], ["G2 Esports", 2015, 0]]},
	{"cur": "Gen.G", "nm": [["KSV", 2017, 2018], ["Gen.G", 2018, 0]]},
	{"cur": "TSM", "nm": [["Team SoloMid", 2009, 2019], ["TSM", 2019, 0]]},
	{"cur": "NAVI", "nm": [["Natus Vincere", 2009, 2022], ["NAVI", 2022, 0]]},
	{"cur": "Ninjas in Pyjamas", "nm": [["NiP", 2012, 0], ["Ninjas in Pyjamas", 2012, 0]]},
]
const LOGOALIAS := {"royal-never-give-up": "royal-club", "star-horn-royal-club": "royal-club", "samsung-white": "samsung-galaxy", "sk-telecom-t1": "t1", "skt": "t1", "g2-esports": "g2", "damwon-gaming": "dplus-kia", "dwg-kia": "dplus-kia", "bilibili-gaming": "blg", "kingzone-dragonx": "drx", "gen-g-academy": "gen-g-global-academy", "gen-g-esports": "gen-g"}
var _logo_idx = null; var _tex = {}; var _orgix = {}
func kn(s) -> String:
	var r = RegEx.create_from_string("[^a-z0-9]"); return r.sub(str(s).to_lower(), "", true)
func slug(n) -> String:
	var r = RegEx.create_from_string("[^a-z0-9]+"); var t: String = r.sub(O.sem_acento(str(n)).to_lower(), "-", true)
	return t.trim_prefix("-").trim_suffix("-")
func org_of(n):
	if _orgix.is_empty():
		for o in ORGS:
			_orgix[kn(o.cur)] = o
			for x in o.nm: _orgix[kn(x[0])] = o
	return _orgix.get(kn(n))
func org_cur(n) -> String:
	var o = org_of(n); return o.cur if o != null else str(n)
func org_past(n) -> Array:
	var o = org_of(n); var out = []
	if o != null:
		for x in o.nm:
			if kn(x[0]) != kn(o.cur): out.append(x)
	return out
func logo_of(s0: String) -> String:
	if _logo_idx == null: _logo_idx = O._load_json("logos.idx.json")
	var idx: Dictionary = _logo_idx
	var sl: String = s0 if idx.has(s0) else LOGOALIAS.get(s0, s0)
	if idx.has(sl): return sl
	var o = org_of(s0)
	if o != null and idx.has(slug(o.cur)): return slug(o.cur)
	var b = ""
	for x in idx:
		if (sl.begins_with(x + "-") or x.begins_with(sl + "-")) and x.length() > b.length() and (sl.begins_with(x + "-") or b == ""): b = x
	return b
func logo_tex(n):
	var sl = logo_of(slug(n))
	if sl == "": return null
	if _tex.has(sl): return _tex[sl]
	var f: String = _logo_idx[sl]; var p = "res://assets/logos/" + f
	_tex[sl] = load(p) if ResourceLoader.exists(p) else null
	return _tex[sl]
func flag_tex(iso):
	if iso == null or str(iso) == "": return null
	var k = "f:" + str(iso).to_lower()
	if _tex.has(k): return _tex[k]
	var p = "res://assets/flags/%s.svg" % str(iso).to_lower()
	_tex[k] = load(p) if ResourceLoader.exists(p) else null
	return _tex[k]
func hue(t) -> float:
	var h = 0
	for c in str(t).to_utf32_buffer().to_int32_array(): h = (h * 31 + c) % 360
	return h / 360.0
func ini(t) -> String:
	var w = RegEx.create_from_string("[A-Za-zÀ-ÿ0-9]+").search_all(str(t)); if w.is_empty(): return "?"
	return (w[0].get_string().left(1) + w[1].get_string().left(1) if w.size() > 1 else w[0].get_string().left(3)).to_upper()
func crest(n, sz := 48, cb = null) -> Control:  # escudo clicável (abre a ficha do time); sem logo: círculo com iniciais
	var b = Button.new(); b.custom_minimum_size = Vector2(sz, sz); b.flat = true; b.focus_mode = Control.FOCUS_NONE
	var tx = logo_tex(n)
	if tx != null:
		var t = TextureRect.new(); t.texture = tx; t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE; t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED; t.set_anchors_preset(Control.PRESET_FULL_RECT); t.mouse_filter = Control.MOUSE_FILTER_IGNORE; b.add_child(t)
	else:
		b.flat = false; b.add_theme_stylebox_override("normal", _sb(Color.from_hsv(hue(n), 0.45, 0.55), sz / 2)); b.add_theme_stylebox_override("hover", _sb(Color.from_hsv(hue(n), 0.45, 0.65), sz / 2)); b.add_theme_stylebox_override("pressed", _sb(Color.from_hsv(hue(n), 0.45, 0.65), sz / 2))
		b.text = ini(n); b.add_theme_font_size_override("font_size", int(sz * 0.36)); b.add_theme_color_override("font_color", Color.WHITE)
	if str(n) != O.S.org.nome: b.pressed.connect(cb if cb != null else func(): ficha_time(str(n), game))
	return b
func avatar(nick, sz := 52, g = null) -> Control:  # avatar clicável (abre a ficha do jogador)
	var b = Button.new(); b.custom_minimum_size = Vector2(sz, sz); b.focus_mode = Control.FOCUS_NONE
	var ini2: String = RegEx.create_from_string("[^A-Za-z0-9]").sub(str(nick), "", true).left(2).to_upper()
	b.text = ini2 if ini2 != "" else "?"
	for st in ["normal", "hover", "pressed"]: b.add_theme_stylebox_override(st, _sb(Color.from_hsv(hue(nick), 0.35, 0.5), sz / 2))
	b.add_theme_font_size_override("font_size", int(sz * 0.38)); b.add_theme_color_override("font_color", Color.WHITE)
	b.pressed.connect(func(): ficha_jog(str(nick), g if g != null else game)); return b
func flag_ctl(iso, w := 36) -> Control:
	var tx = flag_tex(iso)
	if tx == null: var e = Control.new(); e.custom_minimum_size = Vector2(0, 0); return e
	var t = TextureRect.new(); t.texture = tx; t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE; t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED; t.custom_minimum_size = Vector2(w, w * 0.7); t.size_flags_vertical = Control.SIZE_SHRINK_CENTER; return t
func nota_col(o) -> Color: return GOLD if o >= 85 else Color("5ee6a8") if o >= 75 else Color("8fb4ff") if o >= 65 else DIM
func nat_iso(nick, g):  # (código ISO minúsculo, nome do país) de um jogador do LoL via LOLX
	var X = O.LOLX; var c = X.nat.get(nick)
	if c == null: return ["", ""]
	return [X.iso.get(c, ""), X.natN.get(c, c)]
func time_row(p, nome, extra := "", cb = null) -> HBoxContainer:
	var h = hrow(p); h.add_child(crest(nome, 44))
	var b = Button.new(); b.flat = true; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.text = str(nome) + extra; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 48; b.clip_text = true
	if str(nome) != O.S.org.nome: b.pressed.connect(cb if cb != null else func(): ficha_time(str(nome), game))
	h.add_child(b); return h

# ---------- Fichas ----------
func acha_time(nome, g):
	var L = O.D(g).leagues
	for k in L:
		for tier in ["t1", "t2"]:
			for t in L[k].get(tier, []):
				if t.n == nome: return {"t": t, "liga": L[k].get("nome", k), "tier": tier.to_upper()}
	return null
func acha_jog(nick, g):
	var L = O.D(g).leagues
	for k in L:
		for tier in ["t1", "t2"]:
			for t in L[k].get(tier, []):
				var tp = t.get("p")
				if tp == null: continue
				for i in tp.size():
					if tp[i] != null and tp[i][0] == nick: return {"p": tp[i], "i": i, "time": t.n, "liga": L[k].get("nome", k)}
	return null
func kvs(p, items: Array) -> void:
	var f = HFlowContainer.new(); f.add_theme_constant_override("h_separation", 10); p.add_child(f)
	for it in items:
		var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sb(Color("151a30"), 10)); f.add_child(pc)
		var v = VBoxContainer.new(); pc.add_child(v)
		var a = Label.new(); a.text = str(it[0]); a.add_theme_font_size_override("font_size", 18); a.add_theme_color_override("font_color", DIM); v.add_child(a)
		var b = Label.new(); b.text = str(it[1]); b.add_theme_font_size_override("font_size", 26); v.add_child(b)
func titulos_lol(nome) -> Dictionary:
	var X = O.LOLX; var al = {nome: true}
	for r in X.ht:
		if r[0] == nome: al[r[3]] = true
	var og = org_of(nome)
	if og != null:
		for n in og.nm: al[n[0]] = true
	var ys = func(o):
		var out = []
		for y in o:
			if al.has(o[y]): out.append(int(y))
		out.sort(); return out
	return {"wc": ys.call(X.wct), "wcv": ys.call(X.wcv), "msi": ys.call(X.mst), "msiv": ys.call(X.msv)}
func _jogs(p, ps: Array, roles: Array, g) -> void:
	for i in ps.size():
		var pl = ps[i]; if pl == null: continue
		var h = hrow(p); h.add_child(avatar(pl[0], 48, g))
		var r = Label.new(); r.text = roles[i] if i < roles.size() else ""; r.custom_minimum_size.x = 70; r.add_theme_color_override("font_color", ACC); h.add_child(r)
		var iso = nat_iso(pl[0], g)[0] if g == "lol" else (pl[3] if pl.size() > 3 else "")
		var b = Button.new(); b.flat = true; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.text = str(pl[0]); b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.clip_text = true; b.pressed.connect(func(): ficha_jog(str(pl[0]), g)); h.add_child(b)
		h.add_child(flag_ctl(iso)); var a = Label.new(); a.text = (str(pl[2]) + "a") if pl[2] != null else "—"; a.add_theme_color_override("font_color", DIM); h.add_child(a)
		var n = Label.new(); n.text = str(int(pl[1])); n.custom_minimum_size.x = 44; n.add_theme_color_override("font_color", nota_col(pl[1])); h.add_child(n)
func ficha_time(nome, g) -> void:
	var f = acha_time(nome, g); var roles: Array = O.GAMES[g].roles; var v = modal(str(nome))
	var hd = hrow(v); hd.move_to_front(); hd.add_child(crest(nome, 90, func(): pass))
	var hv = VBoxContainer.new(); hv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; hd.add_child(hv)
	lbl(hv, ("%s · %s" % [f.liga, f.tier]) if f != null else "Time", 24, DIM); lbl(hv, O.GAMES[g].curto, 22, DIM)
	var pas = org_past(nome)
	if pas.size():
		var t = "Antes: "; var parts = []
		for x in pas: parts.append("%s (%d%s)" % [x[0], x[1], ("–%d" % x[2]) if x[2] and x[2] != x[1] else ""])
		lbl(hv, t + " · ".join(parts), 20, DIM)
	var H: Dictionary = O.HIST.get(g, {}); var T: Array = H.get("torneios", []); var MAIN: String = H.get("main", "")
	var ganhos = []; var vices = []
	for t in T:
		if t.get("c") != null and (t.c == nome or org_cur(t.c) == org_cur(nome)): ganhos.append(t)
		if t.get("v") != null and (t.v == nome or org_cur(t.v) == org_cur(nome)): vices.append(t)
	ganhos.sort_custom(func(a, b): return a.a > b.a); vices.sort_custom(func(a, b): return a.a > b.a)
	var tl = {}
	if g == "lol": tl = titulos_lol(nome)
	if f != null and f.t.get("p") != null and f.t.p.size():
		var ps: Array = f.t.p; var idade = "—"
		if not ps.any(func(p): return p[2] == null):
			var s = 0.0
			for p in ps: s += p[2]
			idade = "%.1f" % (s / ps.size())
		var items = [["Força", "%.1f" % O.media_time(ps)], ["Idade média", idade]]
		if g == "lol": items.append_array([["Mundiais", tl.wc.size()], ["MSI", tl.msi.size()]])
		else: items.append_array([[H.get("tipos", {}).get(MAIN, "Principais"), ganhos.filter(func(t): return t.tp == MAIN).size()], ["Títulos", ganhos.size()]])
		kvs(v, items); lbl(v, "Line-up", 28, TXT); _jogs(v, ps, roles, g)
	elif f == null: lbl(v, "Time fora das ligas deste jogo.", 22, DIM)
	if g == "lol" and O.LOLX.coach.has(nome):
		var co: Array = O.LOLX.coach[nome]; lbl(v, "Técnico", 28, TXT); var h = hrow(v); h.add_child(avatar(co[0], 48, g)); lbl(h, str(co[0]), 26); h.add_child(flag_ctl(O.LOLX.iso.get(co[1], "")))
	if g == "lol":
		if tl.wc.size() or tl.msi.size():
			lbl(v, "Troféus", 28, TXT)
			if tl.wc.size(): lbl(v, "Mundial: " + ", ".join(tl.wc.map(func(y): return str(y))), 24, GOLD)
			if tl.msi.size(): lbl(v, "MSI: " + ", ".join(tl.msi.map(func(y): return str(y))), 24, GOLD)
			if tl.wcv.size(): lbl(v, "Vice no Mundial: " + ", ".join(tl.wcv.map(func(y): return str(y))), 20, DIM)
	else:
		if ganhos.size():
			lbl(v, "Troféus", 28, TXT)
			for t in ganhos: lbl(v, "%s %d  %s%s" % ["★" if t.tp == MAIN else "•", t.a, t.n, ("  vs %s%s" % [t.v, (" · " + str(t.p)) if t.get("p") else ""]) if t.get("v") else ""], 22, GOLD if t.tp == MAIN else TXT)
		if vices.size(): lbl(v, "Vice: " + " · ".join(vices.map(func(t): return t.n)), 20, DIM)
		if ganhos.is_empty() and vices.is_empty(): lbl(v, "Sem títulos no histórico levantado.", 22, DIM)
	var sim = []   # títulos simulados (2027+)
	for t in O.hist_de(g).torneios:
		if t.c == nome: sim.append(t)
	if sim.size():
		lbl(v, "Títulos no jogo (simulado)", 26, TXT)
		for t in sim: lbl(v, "%d  %s" % [t.a, t.n], 22, GOLD)
func ficha_jog(nick, g) -> void:
	var j = acha_jog(nick, g); var roles: Array = O.GAMES[g].roles; var v = modal(str(nick))
	var iso = ""; var pais = ""
	if g == "lol": var ni: Array = nat_iso(nick, g); iso = ni[0]; pais = ni[1]
	elif j != null and j.p.size() > 3 and j.p[3] != null: iso = str(j.p[3])
	var hd = hrow(v); hd.add_child(avatar(nick, 90, g));
	var hv = VBoxContainer.new(); hv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; hd.add_child(hv)
	var l1 = hrow(hv); l1.add_child(flag_ctl(iso, 44)); lbl(l1, pais, 22, DIM)
	lbl(hv, ("%s · %s · %s" % [roles[j.i] if j.i < roles.size() else "", (str(j.p[2]) + " anos") if j.p[2] != null else "—", O.GAMES[g].curto]) if j != null else O.GAMES[g].curto, 22, DIM)
	if j != null:
		kvs(v, [["Nota", j.p[1]], ["Time", j.time], ["Liga", j.liga], ["Salário", O.money(O.salary(j.p[1])) + "/sem"]])
		time_row(v, j.time, "   (ver time)", func(): ficha_time(j.time, g))
	var sim: Dictionary = O.S.hon.get(g, {}).get(nick, {})
	if g == "lol":
		var X = O.LOLX; var hon: Dictionary = X.hon.get(nick, {}); var tit: Array = X.rtit.get(nick, []); var car: Array = X.rcar.get(nick, [])
		var wc: Array = hon.get("wc", []).duplicate(); var msi: Array = hon.get("msi", []).duplicate(); var lg: int = int(hon.get("lg", 0)); var mv: Array = hon.get("mv", []).duplicate()
		wc.append_array(sim.get("w", [])); msi.append_array(sim.get("a", [])); lg += int(sim.get("l", 0))
		for x in sim.get("v", []): mv.append([x[0], "MVP Mundial" if x[1] == "w" else "MVP MSI"])
		for y in sim.get("b", []): mv.append([y, "Golden Crown"])
		if wc.size() or msi.size() or lg or tit.size(): kvs(v, [["Mundiais", wc.size()], ["MSI", msi.size()], ["Ligas", max(lg, tit.filter(func(t): return t[1] == "l").size())], ["MVPs", mv.size()]])
		if car.size():
			lbl(v, "Carreira", 28, TXT)
			for c in car: time_row(v, c[0], "   %d%s" % [c[1], ("–" + str(c[2])) if c[2] and c[2] != c[1] else "–hoje"])
		if wc.size(): lbl(v, "Mundial: " + ", ".join(wc.map(func(y): return str(y))), 24, GOLD)
		if msi.size(): lbl(v, "MSI: " + ", ".join(msi.map(func(y): return str(y))), 24, GOLD)
		if tit.size():
			lbl(v, "Títulos", 28, TXT); var ts = tit.duplicate(); ts.sort_custom(func(a, b): return a[0] > b[0])
			for t in ts.slice(0, 25): lbl(v, "%d  %s" % [t[0], t[2]], 20)
		if mv.size():
			lbl(v, "MVPs e prêmios", 28, TXT)
			for m in mv: lbl(v, "★ %s  %s" % [str(m[0]), str(m[1])], 20)
		if j == null and car.is_empty() and tit.is_empty() and wc.is_empty(): lbl(v, "Sem dados de carreira.", 22, DIM)
	else:
		var H: Dictionary = O.HIST.get(g, {}); var T: Array = H.get("torneios", []); var MAIN: String = H.get("main", "")
		var tit = T.filter(func(t): return t.get("r") != null and t.r.has(nick)); tit.sort_custom(func(a, b): return a.a > b.a)
		var mv = T.filter(func(t): return t.get("mvp") != null and t.mvp[0] == nick); mv.sort_custom(func(a, b): return a.a > b.a)
		var bo = []
		for y in H.get("bo", {}):
			var rows: Array = H.bo[y]
			for i in rows.size():
				if rows[i][0] == nick: bo.append([int(y), i])
		for y in O.S.bo.get(g, {}):
			var rows: Array = O.S.bo[g][y].t
			for i in rows.size():
				if rows[i][0] == nick: bo.append([int(y), i])
		bo.sort_custom(func(a, b): return a[0] > b[0])
		var sw: int = sim.get("w", []).size() + sim.get("a", []).size()
		if tit.size() or mv.size() or bo.size() or sw: kvs(v, [[H.get("tipos", {}).get(MAIN, "Principais"), tit.filter(func(t): return t.tp == MAIN).size() + sim.get("w", []).size()], ["Títulos", tit.size() + sw], ["MVPs", mv.size() + sim.get("v", []).size()], ["Top 10", bo.size()]])
		if tit.size():
			lbl(v, "Títulos", 28, TXT)
			for t in tit: lbl(v, "%s %d  %s  (%s)" % ["★" if t.tp == MAIN else "•", t.a, t.n, t.c], 22, GOLD if t.tp == MAIN else TXT)
		if mv.size():
			lbl(v, "MVPs", 28, TXT)
			for t in mv: lbl(v, "★ %d  %s" % [t.a, t.n], 22)
		if bo.size():
			lbl(v, H.get("boNome", "Top do ano"), 28, TXT)
			for x in bo: lbl(v, "%s %d · %dº lugar" % ["★" if x[1] == 0 else "•", x[0], x[1] + 1], 22, GOLD if x[1] == 0 else TXT)
		if j == null and tit.is_empty() and mv.is_empty() and bo.is_empty(): lbl(v, "Sem dados de carreira.", 22, DIM)
	if sim.size() and g != "lol": lbl(v, "No jogo (simulado): %d título(s), %d MVP(s)" % [sim.get("w", []).size() + sim.get("a", []).size(), sim.get("v", []).size()], 22, DIM)

# ---------- Lendas (Hall) e aba Mundo ----------
func lendas(g) -> Array:  # [{n, pts, partes:[texto]}] ordenado
	var sim: Dictionary = O.S.hon.get(g, {}); var out = {}
	var add = func(n, pts, parte):
		if not out.has(n): out[n] = {"n": n, "pts": 0.0, "p": []}
		out[n].pts += pts; out[n].p.append(parte)
	if g == "lol":
		for n in O.LOLX.hon:
			var h: Dictionary = O.LOLX.hon[n]; var wc: int = h.get("wc", []).size(); var msi: int = h.get("msi", []).size(); var lg: int = int(h.get("lg", 0)); var mv: int = h.get("mv", []).size()
			if wc: add.call(n, wc * 3, "%d Mundial" % wc)
			if msi: add.call(n, msi * 2, "%d MSI" % msi)
			if lg: add.call(n, lg * 0.5, "%d ligas" % lg)
			if mv: add.call(n, mv, "%d MVP" % mv)
	else:
		var H: Dictionary = O.HIST.get(g, {}); var MAIN: String = H.get("main", ""); var cont = {}
		for t in H.get("torneios", []):
			for n in t.get("r", []):
				if not cont.has(n): cont[n] = [0, 0, 0]
				if t.tp == MAIN: cont[n][0] += 1
				else: cont[n][1] += 1
			if t.get("mvp") != null:
				if not cont.has(t.mvp[0]): cont[t.mvp[0]] = [0, 0, 0]
				cont[t.mvp[0]][2] += 1
		for n in cont:
			var c: Array = cont[n]
			if c[0]: add.call(n, c[0] * 3, "%d %s" % [c[0], H.get("tipos", {}).get(MAIN, "principais")])
			if c[1]: add.call(n, c[1], "%d outros" % c[1])
			if c[2]: add.call(n, c[2], "%d MVP" % c[2])
	for n in sim:   # honras simuladas (2027+)
		var s: Dictionary = sim[n]; var w: int = s.get("w", []).size(); var a: int = s.get("a", []).size(); var l: int = int(s.get("l", 0)); var v: int = s.get("v", []).size(); var b: int = s.get("b", []).size()
		if w + a: add.call(n, w * 3 + a * 2, "%d título(s) no jogo" % (w + a))
		if l: add.call(n, l * 0.5, "%d ligas no jogo" % l)
		if v: add.call(n, v, "%d MVP no jogo" % v)
		if b: add.call(n, b * 2, "%d Bola de Ouro" % b)
	var arr: Array = out.values(); arr.sort_custom(func(a, b): return a.pts > b.pts or (a.pts == b.pts and str(a.n) < str(b.n))); return arr
func vlendas(g) -> void:
	var c = card("Lendas")
	lbl(c, "Ranking por títulos, MVPs e prêmios (histórico real + o que acontece no seu jogo).", 20, DIM)
	for x in lendas(g).slice(0, 40):
		var h = hrow(c); h.add_child(avatar(x.n, 44, g))
		var b = Button.new(); b.flat = true; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.clip_text = true; b.text = "%s\n%s" % [x.n, " · ".join(x.p)]; b.add_theme_font_size_override("font_size", 22); b.pressed.connect(func(): ficha_jog(str(x.n), g)); h.add_child(b)
		if g == "lol": h.add_child(flag_ctl(nat_iso(x.n, g)[0]))
func vmundo() -> void:
	var g = game; var S = O.S
	var c1 = card("Melhores jogadores · " + gname(g))
	var pl: Array = O.pool(g).duplicate(); pl.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	for p in pl.slice(0, 12):
		var h = hrow(c1); h.add_child(avatar(p.n, 44, g)); var b = Button.new(); b.flat = true; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.clip_text = true
		b.text = "%s · %s · %sa" % [p.n, p.t, str(p.get("a", "?"))]; b.pressed.connect(func(): ficha_jog(str(p.n), g)); h.add_child(b); var n = Label.new(); n.text = str(p.o); n.add_theme_color_override("font_color", nota_col(p.o)); h.add_child(n)
	var c2 = card("Revelações (jovens que entraram no mundo)")
	var ov: Dictionary = S.mundo.ov.get(g, {}); var rev = []
	for id in ov:
		var e: Array = ov[id]
		if e.size() > 3 and e[3]: rev.append([id, e])
	rev.sort_custom(func(a, b): return a[1][2] > b[1][2])
	var porid = {}
	for p in O.pool(g): porid[str(p.id).split("~")[0]] = p
	if rev.is_empty(): lbl(c2, "Ainda ninguém: os primeiros regens aparecem na virada do ano.", 20, DIM)
	for r in rev.slice(0, 12):
		var e: Array = r[1]; var pp = porid.get(r[0]); var h = hrow(c2); h.add_child(avatar(e[4], 44, g))
		var b = Button.new(); b.flat = true; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.clip_text = true
		b.text = "%s · %s · %da · %d/%d" % [e[4], pp.t if pp != null else "", e[1], e[0], e[2]]; b.pressed.connect(func(): ficha_jog(str(e[4]), g)); h.add_child(b); h.add_child(flag_ctl(e[5]))
	var c3 = card("Aposentadorias de lendas")
	var ap: Array = O.aposentados(g)
	if ap.is_empty(): lbl(c3, "Nenhuma ainda.", 20, DIM)
	for x in ap.slice(0, 12): lbl(c3, "%d · %s (%da) · pico %d" % [x.ano, x.nick, x.idade, x.o], 22)
	var c4 = card("Notícias do elenco")
	var ns: Array = S.noticias.filter(func(x): return x.g == g)
	if ns.is_empty(): lbl(c4, "Sem notícias.", 20, DIM)
	for x in ns.slice(0, 15): lbl(c4, "S%d/%d · %s" % [x.s, x.y, x.t], 20, OK if x.k == "up" else BAD if x.k == "down" else TXT)

# ---------- Diretoria ----------
func vdiretoria() -> void:
	O.dir_garantir()
	var D = O.S.get("dir")
	if not (D is Dictionary) or D.is_empty(): return
	var c = card("Diretoria · objetivos de %d" % D.ano, null, GOLD)
	var conf: float = D.conf
	var col = OK if conf >= 60 else GOLD if conf >= 35 else BAD
	bar(c, "Confiança", conf, 100.0, col, "%d%%" % int(conf))
	lbl(c, O.dir_rotulo(conf), 22, col)
	for o in D.objs:
		var p: Dictionary = O.dir_prog(o)
		var h = hrow(c); pill(h, "OK" if p.ok else "...", OK if p.ok else DIM, p.ok)
		var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.add_theme_constant_override("separation", 4); h.add_child(v)
		lbl(v, o.txt, 23)
		bar(v, "", p.frac, 1.0, OK if p.ok else ACC, "%d%%" % int(p.frac * 100))
		lbl(v, p.txt, 19, DIM)
	var hs: Array = D.get("hist", [])
	if hs.size():
		var x = hs[0]; lbl(c, "Último balanço (%d): %d/%d cumpridos, confiança %d%%" % [x.ano, x.oks, x.total, x.conf], 19, DIM)

# ---------- Finanças ----------
func vfin() -> void:
	var S = O.S; var R: Dictionary = O.fin_resumo(); var pr: Dictionary = O.projecao_org()
	kpi(content, [["CAIXA", O.money(S.org.caixa), OK if S.org.caixa >= 0 else BAD], ["SALDO / SEM", O.money(pr.saldo), OK if pr.saldo >= 0 else BAD], ["PROJEÇÃO 12 SEM", O.money(S.org.caixa + pr.saldo * 12), TXT]])
	var ch = card("Caixa nas últimas semanas", null, ACC2)
	var hist: Array = S.get("fin", [])
	if hist.size() < 2: lbl(ch, "O gráfico aparece depois de algumas semanas de jogo.", 22, DIM)
	else:
		var mx = 1; var mn = hist[0]
		for v in hist: mx = max(mx, v); mn = min(mn, v)
		var span = max(1, mx - min(mn, 0))
		var row = HBoxContainer.new(); row.add_theme_constant_override("separation", 2); row.custom_minimum_size.y = 170; ch.add_child(row)
		for v in hist.slice(max(0, hist.size() - 30)):
			var col = VBoxContainer.new(); col.size_flags_horizontal = Control.SIZE_EXPAND_FILL; col.alignment = BoxContainer.ALIGNMENT_END; row.add_child(col)
			var b = ColorRect.new(); b.color = ACC if v >= 0 else BAD; b.custom_minimum_size.y = max(3.0, 160.0 * abs(v) / span); col.add_child(b)
		lbl(ch, "Pico %s · mínimo %s" % [O.money(mx), O.money(mn)], 19, DIM)
	var cr = card("Receitas por semana", null, OK)
	var tr = 0
	for x in R.rec: tr += x[1]
	for x in R.rec:
		bar(cr, x[0], x[1], max(1, tr), OK, O.money(x[1]))
	var cd = card("Despesas por semana", null, BAD)
	var td = 0
	for x in R.des: td += x[1]
	for x in R.des:
		bar(cd, x[0], x[1], max(1, td), BAD, O.money(x[1]))
	if R.por_jogo.size():
		var cj = card("Resultado por jogo", null, GOLD)
		for x in R.por_jogo:
			var h = hrow(cj); pill(h, gname(x[0]), GCOL.get(x[0], ACC), true); var sl = Control.new(); sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(sl); lbl(h, O.money(x[1]), 24, OK if x[1] >= 0 else BAD, false)

extends Control
## Interface do eSports CEO (Godot). Tudo é montado por código; render() refaz a tela atual.

const TABS := [["org", "Org"], ["elenco", "Elenco"], ["mercado", "Mercado"], ["cal", "Agenda"], ["ligas", "Ligas"], ["neg", "Negócios"], ["hall", "Hall"], ["mundo", "Mundo"]]
const NAV_ICON := {"org": "home", "elenco": "users", "mercado": "search", "cal": "calendar", "ligas": "list", "neg": "brief", "hall": "trophy", "mundo": "globe", "inbox": "mail", "noticias": "news", "fin": "coin", "legado": "star", "rank": "chart"}
const NAV_MAIN := [["org", "Painel"], ["elenco", "Elenco"], ["mercado", "Mercado"], ["cal", "Agenda"]]
const NAV_MORE := [["inbox", "Caixa de entrada"], ["noticias", "Central de notícias"], ["ligas", "Ligas e tabelas"], ["fin", "Finanças"], ["neg", "Negócios e patrocínios"], ["legado", "Legado e metas"], ["rank", "Rankings e recordes"], ["hall", "Hall da fama"], ["mundo", "Mundo e revelações"]]
const BG := Color("080812"); const SURF := Color("0e0f1f"); const SURF2 := Color("15162b"); const LINE := Color("201f3e")
const CARD := SURF; const ACC := Color("7c4dff"); const ACC2 := Color("a78bfa"); const TXT := Color("eef0ff"); const DIM := Color("8c8fb3")
const OK := Color("3ddc97"); const BAD := Color("ff5d6c"); const GOLD := Color("ffc857")
const GCOL := {"lol": Color("c89b3c"), "cs2": Color("f5a623"), "dota2": Color("e0453a"), "valorant": Color("ff4655"), "ff": Color("ff8a00"), "r6": Color("4cc3ff"), "fifa": Color("3ddc84"), "wr": Color("4aa8ff")}
var O: Node
var tab = "org"; var game = "lol"; var squad = "t1"
var side: VBoxContainer; var side_p: PanelContainer; var nav_p: PanelContainer; var mgc: MarginContainer; var wide = false
var hero: Hero; var mono: Mono; var topbar_p: PanelContainer; var topbar_h: HBoxContainer; var gp_p: PanelContainer
var content: VBoxContainer; var top: Label; var topsub: Label; var topchips: Container; var gbar: HBoxContainer; var nav: HBoxContainer; var scroll: ScrollContainer
var modal_layer: Control
var play = false; var auto = false; var timer: Timer; var vel = 0.45
var merc = {"role": "", "pay": true, "n": 25, "liga": ""}
var hy = 0; var hall_mode = "ano"; var fm = ""   # ano do Hall; modo
var toast_lbl: Label; var cfg = {"nome": "Minha Org", "game": "lol", "regiao": ""}

func _ready() -> void:
	O = get_node("/root/Org"); O.carregar_dados(); _fonts()
	set_theme(_build_theme())
	var bg = ColorRect.new(); bg.color = BG; bg.set_anchors_preset(Control.PRESET_FULL_RECT); add_child(bg)
	var root = VBoxContainer.new(); root.set_anchors_preset(Control.PRESET_FULL_RECT); root.add_theme_constant_override("separation", 0); add_child(root)
	# cabeçalho (banner da org)
	hero = Hero.new(); root.add_child(hero)
	var hm = MarginContainer.new(); for k in ["left", "right"]: hm.add_theme_constant_override("margin_" + k, 16)
	hm.add_theme_constant_override("margin_top", 12); hm.add_theme_constant_override("margin_bottom", 14); hero.add_child(hm)
	var tv = VBoxContainer.new(); tv.add_theme_constant_override("separation", 10); hm.add_child(tv)
	var hr = HBoxContainer.new(); hr.add_theme_constant_override("separation", 14); tv.add_child(hr)
	mono = Mono.new(); mono.fnt = F_H; hr.add_child(mono)
	var nv = VBoxContainer.new(); nv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; nv.size_flags_vertical = Control.SIZE_SHRINK_CENTER; nv.add_theme_constant_override("separation", 0); hr.add_child(nv)
	top = Label.new(); top.add_theme_font_size_override("font_size", 46); top.add_theme_color_override("font_color", Color.WHITE); top.clip_text = true; if F_H != null: top.add_theme_font_override("font", F_H)
	nv.add_child(top)
	topsub = Label.new(); topsub.add_theme_color_override("font_color", DIM); topsub.add_theme_font_size_override("font_size", 23); nv.add_child(topsub)
	var tc = HFlowContainer.new(); tc.add_theme_constant_override("h_separation", 8); tc.add_theme_constant_override("v_separation", 6); tv.add_child(tc); topchips = tc
	# corpo: barra lateral (PC) + coluna direita (topo, abas de jogo, conteúdo)
	var rw = HBoxContainer.new(); rw.size_flags_vertical = Control.SIZE_EXPAND_FILL; rw.add_theme_constant_override("separation", 0); root.add_child(rw)
	side_p = PanelContainer.new(); side_p.add_theme_stylebox_override("panel", _sbf(Color("0b0b18"), 0, LINE, 0, 0)); side_p.custom_minimum_size.x = 230; side_p.visible = false; rw.add_child(side_p)
	var ssc = ScrollContainer.new(); ssc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; side_p.add_child(ssc)
	side = VBoxContainer.new(); side.size_flags_horizontal = Control.SIZE_EXPAND_FILL; side.add_theme_constant_override("separation", 4); ssc.add_child(side)
	var rv = VBoxContainer.new(); rv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; rv.size_flags_vertical = Control.SIZE_EXPAND_FILL; rv.add_theme_constant_override("separation", 0); rw.add_child(rv)
	topbar_p = PanelContainer.new(); topbar_p.add_theme_stylebox_override("panel", _sbf(Color("0b0b18"), 0, LINE, 0, 10, 2)); topbar_p.visible = false; rv.add_child(topbar_p)
	var tsc = ScrollContainer.new(); tsc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER; tsc.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; tsc.custom_minimum_size.y = 76; topbar_p.add_child(tsc)
	topbar_h = HBoxContainer.new(); topbar_h.add_theme_constant_override("separation", 14); topbar_h.size_flags_horizontal = Control.SIZE_EXPAND_FILL; tsc.add_child(topbar_h)
	gp_p = PanelContainer.new(); gp_p.add_theme_stylebox_override("panel", _sbf(BG, 0, LINE, 0, 8, 0)); rv.add_child(gp_p)
	var gs = ScrollContainer.new(); gs.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; gs.custom_minimum_size.y = 62; gp_p.add_child(gs)
	gbar = HBoxContainer.new(); gbar.add_theme_constant_override("separation", 8); gs.add_child(gbar)
	var mg = MarginContainer.new(); mg.size_flags_vertical = Control.SIZE_EXPAND_FILL; mg.size_flags_horizontal = Control.SIZE_EXPAND_FILL; for k in ["left", "right"]: mg.add_theme_constant_override("margin_" + k, 14)
	rv.add_child(mg); mgc = mg
	scroll = ScrollContainer.new(); scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL; scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; mg.add_child(scroll)
	content = VBoxContainer.new(); content.size_flags_horizontal = Control.SIZE_EXPAND_FILL; content.add_theme_constant_override("separation", 14); scroll.add_child(content)
	# navegação inferior
	var np = PanelContainer.new(); np.add_theme_stylebox_override("panel", _sbf(SURF, 0, LINE, 0, 6, 2, true)); root.add_child(np); nav_p = np
	nav = HBoxContainer.new(); nav.add_theme_constant_override("separation", 4); np.add_child(nav)
	modal_layer = Control.new(); modal_layer.set_anchors_preset(Control.PRESET_FULL_RECT); modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE; add_child(modal_layer)
	toast_lbl = Label.new(); toast_lbl.visible = false; toast_lbl.add_theme_color_override("font_color", GOLD); toast_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM); toast_lbl.position.y -= 150; toast_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD; toast_lbl.custom_minimum_size.x = 640; toast_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; add_child(toast_lbl)
	timer = Timer.new(); timer.one_shot = false; timer.timeout.connect(_tick); add_child(timer)
	auto = FileAccess.file_exists("user://auto") 
	if O.tem_save() and O.load_save(): pass
	else: O.reset_estado(); O.comecar()
	if O.S.get("inicio") != null and O.GAMES.has(O.S.inicio): game = O.S.inicio if O.aberto(O.S.inicio) else "lol"
	get_viewport().size_changed.connect(_ajusta_largura)
	_ajusta_largura(); render()

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
	if F_B != null: th.default_font = F_B
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
		var h = hrow(v); var bar = ColorRect.new(); bar.color = accent if accent != null else ACC; bar.custom_minimum_size = Vector2(4, 24); bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER; h.add_child(bar)
		var tl = lbl(h, title.to_upper(), 27, TXT)
		if F_H != null: tl.add_theme_font_override("font", F_H)
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
		lbl(v, it[0], 17, DIM, false); var kv = lbl(v, it[1], 32, it[2] if it.size() > 2 else TXT, false)
		if F_H != null: kv.add_theme_font_override("font", F_H)
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
	var oc: Color = Color.from_hsv(hue(S.org.nome), 0.62, 1.0)
	mono.txt = ini(S.org.nome); mono.col = oc; mono.queue_redraw(); hero.acc = oc; hero.queue_redraw()
	rchip(topchips, "coin", O.money(S.org.caixa), OK if S.org.caixa >= 0 else BAD)
	rchip(topchips, "star", "%.1f" % S.org.rep, GOLD); rchip(topchips, "users", _fmt_n(S.social.seg), ACC)
	var nl: int = O.inbox_nao_lidas()
	if nl > 0:
		var ib = Button.new(); ib.text = "Msgs %d" % nl; ib.custom_minimum_size.y = 34; ib.add_theme_font_size_override("font_size", 20); chip_style(ib, BAD, true); ib.pressed.connect(func(): tab = "inbox"; render()); topchips.add_child(ib)
	for g in O.GAMES:
		if not O.ativo(g): continue
		if O.aberto(g):
			var b = Button.new(); b.text = gname(g); b.toggle_mode = true; var on = (g == game); b.button_pressed = on; b.custom_minimum_size = Vector2(0, 54); _gtab(b, GCOL.get(g, ACC), on)
			b.pressed.connect(func(): game = g; squad = "t1"; render()); gbar.add_child(b)
	hero.visible = not wide; topbar_p.visible = wide; gp_p.visible = not (wide and tab == "org")
	clear(side); side_p.visible = wide; nav_p.visible = not wide
	if wide: _topbar(); _sidebar()
	var mais_on = not NAV_MAIN.any(func(t): return t[0] == tab)
	for t in NAV_MAIN:
		_nav_btn(t[1], t[0] == tab, func(): tab = t[0]; render(), NAV_ICON.get(t[0], ""))
	_nav_btn("Mais", mais_on, _menu_mais, "more")
	match tab:
		"org": vorg()
		"elenco": velenco()
		"mercado": vmercado()
		"cal": vcal()
		"ligas": vligas()
		"inbox": vinbox()
		"noticias": vnoticias()
		"fin": vfin()
		"neg": vneg()
		"legado": vlegado()
		"rank": vrank()
		"hall": vhall()
		"mundo": vmundo()
	scroll.scroll_vertical = 0
	content.modulate.a = 0.0; create_tween().tween_property(content, "modulate:a", 1.0, 0.16)
func _ajusta_largura() -> void:
	var win: Window = get_window(); var ws: Vector2i = win.size
	var want := Vector2i(2200, 1238) if (ws.y > 0 and float(ws.x) / float(ws.y) >= 1.25) else Vector2i(720, 1280)
	if win.content_scale_size != want: win.content_scale_size = want
	var w: float = float(want.x) if want.x > want.y else get_viewport_rect().size.x
	var nw: bool = want.x > want.y
	var avail: float = w - (230.0 if nw else 0.0)
	var m: int = maxi(18, int((avail - 2000.0) / 2.0)) if nw else 14
	for k in ["left", "right"]: mgc.add_theme_constant_override("margin_" + k, m)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER if nw else ScrollContainer.SCROLL_MODE_DISABLED
	if nw != wide: wide = nw; render()
func _side_btn(t: String, on: bool, cb: Callable, icon := "") -> void:
	var b = Button.new(); b.text = t; b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.custom_minimum_size.y = 58; b.add_theme_font_size_override("font_size", 23)
	var n = _sbf(Color(ACC.r, ACC.g, ACC.b, 0.14) if on else Color(0, 0, 0, 0), 12, null, 0, 14); n.content_margin_left = 56
	for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, n)
	var fc: Color = ACC if on else TXT
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color"]: b.add_theme_color_override(k, fc)
	if F_H != null: b.add_theme_font_override("font", F_H)
	b.add_theme_font_size_override("font_size", 27)
	var ic = ico(icon, 26, fc); ic.position = Vector2(16, 16); b.add_child(ic)
	b.pressed.connect(cb); side.add_child(b)
func _gtab(b: Button, c: Color, on: bool) -> void:   # aba de jogo (sublinhado na cor do jogo)
	var n = _sbf(Color(c.r, c.g, c.b, 0.12) if on else Color(0, 0, 0, 0), 0, c if on else Color(0, 0, 0, 0), 0, 12, 4)
	for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, n)
	var fc: Color = Color.WHITE if on else DIM
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color"]: b.add_theme_color_override(k, fc)
	if F_H != null: b.add_theme_font_override("font", F_H)
	b.add_theme_font_size_override("font_size", 28 if on else 25)
func _nav_btn(t: String, on: bool, cb: Callable, icon := "") -> void:
	var b = Button.new(); b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 78
	var n = _sbf(Color(ACC.r, ACC.g, ACC.b, 0.10) if on else Color(0, 0, 0, 0), 14, null, 0, 6)
	for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, n)
	var v = VBoxContainer.new(); v.set_anchors_preset(Control.PRESET_FULL_RECT); v.alignment = BoxContainer.ALIGNMENT_CENTER; v.add_theme_constant_override("separation", 3); v.mouse_filter = Control.MOUSE_FILTER_IGNORE; b.add_child(v)
	var ic = ico(icon, 30, ACC if on else DIM); v.add_child(ic)
	var l = Label.new(); l.text = t; l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; l.add_theme_font_size_override("font_size", 20); l.add_theme_color_override("font_color", ACC if on else DIM)
	if F_H != null: l.add_theme_font_override("font", F_H)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE; v.add_child(l)
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

# ---------- Org (painel: ver ua.part) ----------
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
	vvestiario(g, squad)
	vstaff()
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
	vtransf()
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
	var co = card("Orçamento semanal de salários", null, ACC)
	lbl(co, "Defina um teto por jogo (0 = sem limite). Estourar gera aviso da diretoria.", 19, DIM)
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		var fj: int = O.folha_jogo(g); var ob: int = O.orc_de(g); var ho = hrow(co)
		lbl(ho, "%s  %s" % [O.GAMES[g].curto, O.money(fj)], 22, BAD if ob > 0 and fj > ob else TXT).size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn(ho, "-", func(): O.orc_set(g, ob - 10000); render(), ob <= 0)
		lbl(ho, O.money(ob) if ob > 0 else "livre", 22, GOLD)
		btn(ho, "+", func(): O.orc_set(g, ob + 10000 if ob > 0 else max(10000, int(ceil(fj / 10000.0)) * 10000)); render())
	var ca = O.S.get("fin_anos", [])
	if ca.size():
		var cy = card("Relatório anual", null, GOLD)
		for x in ca:
			var d: int = x.fim - x.ini
			var hy2 = hrow(cy); lbl(hy2, str(x.ano), 24, TXT).size_flags_horizontal = Control.SIZE_EXPAND_FILL; lbl(hy2, "%s%s" % ["+" if d >= 0 else "-", O.money(absi(d))], 24, OK if d >= 0 else BAD)
	if R.por_jogo.size():
		var cj = card("Resultado por jogo", null, GOLD)
		for x in R.por_jogo:
			var h = hrow(cj); pill(h, gname(x[0]), GCOL.get(x[0], ACC), true); var sl = Control.new(); sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(sl); lbl(h, O.money(x[1]), 24, OK if x[1] >= 0 else BAD, false)

# ---------- Vestiário e comissão técnica ----------
func vvestiario(g, sq) -> void:
	var q = O.S.games[g].squads[sq]; var c = card("Vestiário", null, ACC2)
	var tem = false
	for i in q.slots.size():
		var p = q.slots[i]
		if p == null: continue
		tem = true; var h = hrow(c); var nm = lbl(h, p.n, 22, TXT, false); nm.custom_minimum_size.x = 150; nm.clip_text = true
		var pb = ProgressBar.new(); pb.max_value = 100; pb.value = p.mo; pb.show_percentage = false; pb.custom_minimum_size.y = 14; pb.size_flags_horizontal = Control.SIZE_EXPAND_FILL; pb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		var mc = OK if p.mo >= 70 else GOLD if p.mo >= 45 else BAD
		pb.add_theme_stylebox_override("background", _sbf(SURF2, 8, null, 0, 0)); pb.add_theme_stylebox_override("fill", _sbf(mc, 8, null, 0, 0)); h.add_child(pb)
		var b = btn(h, "Conversar", func(): res(O.conversar(g, sq, i))); b.custom_minimum_size = Vector2(150, 48); b.add_theme_font_size_override("font_size", 21)
	if not tem: lbl(c, "Contrate jogadores para ver o clima do elenco.", 21, DIM)
func vstaff() -> void:
	var c = card("Comissão técnica", null, GOLD)
	lbl(c, "Vale para todos os seus times. Salário: R$ 2,5 mil por nível por semana.", 19, DIM)
	for id in O.STAFF:
		var d: Dictionary = O.STAFF[id]; var n: int = O.staff_nivel(id)
		var h = hrow(c); var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.add_theme_constant_override("separation", 4); h.add_child(v)
		lbl(v, d.nome, 25); lbl(v, d.desc, 18, DIM); bar(v, "", n, d.max, GOLD, "%d/%d" % [n, d.max])
		var bb = VBoxContainer.new(); h.add_child(bb)
		btn(bb, "Máximo" if n >= d.max else O.money(O.staff_custo(id)), func(): res(O.contratar_staff(id)), n >= d.max)
		if n > 0: var bd = btn(bb, "Reduzir", func(): res(O.dispensar_staff(id))); bd.custom_minimum_size.y = 44; bd.add_theme_font_size_override("font_size", 20)

# ---------- Olheiros e propostas (aba Mercado) ----------
func vtransf() -> void:
	var g = game; var n: int = O.scout_nivel()
	var pr: Array = O.S.get("propostas", [])
	if pr.size():
		var cp = card("Propostas recebidas", null, OK)
		for i in pr.size():
			var x = pr[i]; var h = hrow(cp); var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(v)
			lbl(v, "%s quer %s" % [x.time, x.nick], 25); lbl(v, "%s · nota %d · %s · expira em %d sem." % [gname(x.g), x.o, O.money(x.valor), x.sem], 19, DIM)
			var bb = VBoxContainer.new(); h.add_child(bb)
			btn(bb, "Vender", func(): res(O.aceitar_proposta(i)), false, true)
			var br = btn(bb, "Recusar", func(): O.recusar_proposta(i); render()); br.custom_minimum_size.y = 44; br.add_theme_font_size_override("font_size", 20)
	var c = card("Olheiros · nível %d/%d" % [n, O.SCOUT_MAX], null, ACC2)
	lbl(c, "Descobrem jovens promissores com potencial revelado. A lista renova a cada 8 semanas. Salário: R$ 4 mil por nível por semana.", 19, DIM)
	var h2 = hrow(c)
	btn(h2, "Máximo" if n >= O.SCOUT_MAX else "Contratar nível · " + O.money(O.scout_custo()), func(): res(O.contratar_scout()), n >= O.SCOUT_MAX, true)
	if n > 0: btn(h2, "Reduzir", func(): res(O.reduzir_scout()))
	if n > 0:
		var lst: Array = O.scout_lista(g)
		if lst.is_empty(): lbl(c, "Nenhum alvo no momento para " + gname(g) + ".", 21, DIM)
		for p in lst:
			var pv: Dictionary = O.pot_visivel(p, g)
			var rb = rowbtn(c, func(): ficha_mercado(g, p)); var rr: HBoxContainer = rb[1]
			rr.add_child(crest(p.t, 44))
			var cv = VBoxContainer.new(); cv.size_flags_horizontal = Control.SIZE_EXPAND_FILL; cv.add_theme_constant_override("separation", 0); rr.add_child(cv)
			var l1 = Label.new(); l1.text = p.n; l1.add_theme_font_size_override("font_size", 26); cv.add_child(l1)
			var l2 = Label.new(); l2.text = "%s · %sa · %s · pot %d" % [p.r, str(p.get("a", "?")), p.t, pv.est]; l2.add_theme_font_size_override("font_size", 19); l2.add_theme_color_override("font_color", DIM); l2.clip_text = true; cv.add_child(l2)
			var ov = Label.new(); ov.text = str(p.o); ov.add_theme_font_size_override("font_size", 28); ov.add_theme_color_override("font_color", nota_col(p.o)); rr.add_child(ov)
			ignore_mouse(rb[0])

# ---------- Central de informação (UI) ----------
var inbox_open = -1; var inbox_filtro = "todas"; var news_filtro = "todas"
const TP_COR := {"proposta": Color("3ddc97"), "evento": Color("ffc857"), "diretoria": Color("4f8cff"), "info": Color("8a94b8")}
func vinbox() -> void:
	var ib: Array = O.S.get("inbox", [])
	var c0 = card()
	chips(c0, [["todas", "Todas"], ["naolidas", "Não lidas (%d)" % O.inbox_nao_lidas()]], inbox_filtro, func(id): inbox_filtro = id; render())
	if O.inbox_nao_lidas() > 0: btn(c0, "Marcar todas como lidas", func(): O.msg_todas_lidas(); render())
	var vis = ib.filter(func(m): return inbox_filtro == "todas" or not m.lida)
	if vis.is_empty():
		var ce = card(); lbl(ce, "Nenhuma mensagem. Propostas, eventos e balanços da diretoria chegam aqui.", 22, DIM)
	for m in vis.slice(0, 30):
		var col: Color = TP_COR.get(m.tp, DIM)
		var c = card("", null, col)
		var h = hrow(c)
		if not m.lida: pill(h, "NOVA", col, true)
		pill(h, str(m.tp).capitalize(), col)
		var sl = Control.new(); sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(sl); lbl(h, "S%d/%d" % [m.s, m.y], 19, DIM, false)
		var tb = Button.new(); tb.flat = true; tb.alignment = HORIZONTAL_ALIGNMENT_LEFT; tb.text = m.ti; tb.add_theme_font_size_override("font_size", 27); tb.pressed.connect(func(): inbox_open = -1 if inbox_open == int(m.id) else int(m.id); O.msg_ler(m.id); render()); c.add_child(tb)
		if inbox_open == int(m.id) or (m.res == "" and m.ops.size() and not m.lida):
			lbl(c, m.tx, 23, TXT)
			if m.res != "": pill(c, "Respondida: " + m.res, OK)
			else:
				for i in m.ops.size():
					var ii = i; btn(c, m.ops[i].t, func(): res(O.msg_agir(m.id, ii)), false, i == 0)
func vnoticias() -> void:
	var c0 = card()
	var its = [["todas", "Todas"], ["org", "Minha org"], ["titulo", "Títulos"]]
	for g in O.GAMES:
		if O.ativo(g): its.append([g, gname(g)])
	chips(c0, its, news_filtro, func(id): news_filtro = id; render())
	var fd: Array = O.S.get("feed", []).filter(func(x): return news_filtro == "todas" or (news_filtro == "org" and x.k == "org") or (news_filtro == "titulo" and x.k == "titulo") or x.g == news_filtro)
	var c = card("Central de notícias", null, ACC2)
	if fd.is_empty(): lbl(c, "Sem notícias ainda. Avance algumas semanas.", 22, DIM)
	for x in fd.slice(0, 40):
		var h = hrow(c)
		var cor = GOLD if x.i >= 3 else ACC if x.i == 2 else DIM
		var bar_ = ColorRect.new(); bar_.color = cor; bar_.custom_minimum_size = Vector2(4, 0); h.add_child(bar_)
		var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.add_theme_constant_override("separation", 0); h.add_child(v)
		lbl(v, x.t, 23 if x.i >= 2 else 21, TXT if x.i >= 2 else DIM)
		lbl(v, "S%d/%d%s" % [x.s, x.y, (" · " + gname(x.g)) if x.g != "" else ""], 17, DIM, false)

# ---------- Rankings, recordes e rivalidades (bloco 4) ----------
var rank_modo = "orgs"
func _rank_pontos(g) -> Dictionary:
	var H: Dictionary = O.hist_de(g); var real: Dictionary = O.HIST.get(g, {}); var P = {}; var tit = {}
	var all: Array = []
	all.append_array(real.get("torneios", [])); all.append_array(H.torneios)
	if g == "lol":
		for y in O.LOLX.get("wct", {}): all.append({"a": int(y), "c": O.LOLX.wct[y], "v": O.LOLX.get("wcv", {}).get(y, "?")})
		for y in O.LOLX.get("mst", {}): all.append({"a": int(y), "c": O.LOLX.mst[y], "v": O.LOLX.get("msv", {}).get(y, "?")})
	for t in all:
		var c = org_cur(str(t.c)); var v = org_cur(str(t.v))
		P[c] = P.get(c, 0) + 5; tit[c] = tit.get(c, 0) + 1
		if v != "" and v != "?": P[v] = P.get(v, 0) + 2
	return {"p": P, "t": tit, "all": all}
func vrank() -> void:
	var g = game; var S = O.S; var me: String = S.org.nome
	var c0 = card()
	chips(c0, [["orgs", "Orgs"], ["rec", "Recordes"], ["riv", "Rivalidades"]], rank_modo, func(id): rank_modo = id; render())
	var R = _rank_pontos(g); var P: Dictionary = R.p
	if rank_modo == "orgs":
		var c = card("Ranking de orgs · " + gname(g))
		lbl(c, "Pontos: título = 5, vice = 2 (histórico real e simulado).", 20, DIM)
		var arr = P.keys(); arr.sort_custom(func(a, b): return P[a] > P[b] or (P[a] == P[b] and a < b))
		if arr.is_empty(): lbl(c, "Sem histórico ainda.", 22, DIM)
		var mypos = arr.find(me)
		for i in min(15, arr.size()):
			var h = hrow(c); lbl(h, "%d." % (i + 1), 24, GOLD); lbl(h, arr[i], 24, TXT if arr[i] != me else GOLD).size_flags_horizontal = Control.SIZE_EXPAND_FILL
			lbl(h, "%d pts · %d tít." % [P[arr[i]], R.t.get(arr[i], 0)], 22, TXT if arr[i] != me else GOLD)
		if mypos >= 15: lbl(c, "Sua org: %dº lugar (%d pts)" % [mypos + 1, P[me]], 24, GOLD)
		elif mypos < 0: lbl(c, "Sua org ainda não pontuou neste jogo.", 22, DIM)
	elif rank_modo == "rec":
		var c = card("Recordes da " + me)
		var tit = 0; var vic = 0; var best = 0; var seq = 0; var anos = {}
		for t in R.all:
			if org_cur(str(t.c)) == me: tit += 1; anos[int(t.a)] = true
			elif org_cur(str(t.v)) == me: vic += 1
		var ys = anos.keys(); ys.sort()
		for i in ys.size():
			seq = seq + 1 if i > 0 and ys[i] == ys[i - 1] + 1 else 1
			best = max(best, seq)
		for kv in [["Títulos", tit], ["Vice-campeonatos", vic], ["Anos com título", ys.size()], ["Maior sequência de anos com título", best]]:
			var h = hrow(c); lbl(h, kv[0], 24, TXT).size_flags_horizontal = Control.SIZE_EXPAND_FILL; lbl(h, str(kv[1]), 28, GOLD)
		var c2 = card("Recordes do mundo")
		var top = P.keys(); top.sort_custom(func(a, b): return R.t.get(a, 0) > R.t.get(b, 0))
		if top.size(): lbl(c2, "Mais títulos: %s (%d)" % [top[0], R.t.get(top[0], 0)], 24, TXT)
		var pl: Array = O.pool(g).duplicate(); pl.sort_custom(func(a, b): return a.o > b.o)
		if pl.size(): lbl(c2, "Maior nota atual: %s (%d) · %s" % [pl[0].n, pl[0].o, pl[0].t], 24, TXT)
		if S.mundo.apos.size():
			var ap = O.aposentados(g)
			if ap.size(): lbl(c2, "Aposentado com maior pico: %s (%d)" % [ap[0].nick, ap[0].o], 24, TXT)
	else:
		var c = card("Rivalidades da " + me)
		lbl(c, "Quem mais cruzou seu caminho em finais.", 20, DIM)
		var riv = {}
		for t in R.all:
			var tc = org_cur(str(t.c)); var tv = org_cur(str(t.v))
			if tc == me and tv != "": riv[tv] = riv.get(tv, [0, 0]); riv[tv][0] += 1
			elif tv == me: riv[tc] = riv.get(tc, [0, 0]); riv[tc][1] += 1
		var ks = riv.keys(); ks.sort_custom(func(a, b): return riv[a][0] + riv[a][1] > riv[b][0] + riv[b][1])
		if ks.is_empty(): lbl(c, "Nenhuma final disputada ainda.", 22, DIM)
		for k in ks.slice(0, 10):
			var h = hrow(c); lbl(h, k, 24, TXT).size_flags_horizontal = Control.SIZE_EXPAND_FILL; lbl(h, "%d vit. · %d der." % [riv[k][0], riv[k][1]], 22, TXT)

# ---------- Legado e metas de longo prazo (bloco 6) ----------
const LEG_NIVEIS := [[0, "Org em formação"], [15, "Competidora"], [45, "Potência regional"], [100, "Gigante dos esports"], [200, "Dinastia"], [350, "Lenda viva"]]
func _legado_dados() -> Dictionary:
	var S = O.S; var me: String = S.org.nome; var tit = 0; var vice = 0; var anos = {}; var jogos = 0
	for g in O.GAMES:
		if not O.ativo(g): continue
		jogos += 1
		for t in O.hist_de(g).torneios:
			if org_cur(str(t.c)) == me: tit += 1; anos[int(t.a)] = true
			elif org_cur(str(t.v)) == me: vice += 1
	var pts: int = tit * 12 + vice * 4 + int(S.org.rep * 6) + jogos * 3 + int(S.social.seg / 50000.0)
	return {"tit": tit, "vice": vice, "anos": anos.size(), "jogos": jogos, "pts": pts}
func vlegado() -> void:
	var S = O.S; var D = _legado_dados(); var nv = LEG_NIVEIS[0]; var prox = null
	for x in LEG_NIVEIS:
		if D.pts >= x[0]: nv = x
		elif prox == null: prox = x
	var c = card("Legado da " + S.org.nome, null, GOLD)
	lbl(c, nv[1], 38, GOLD)
	lbl(c, "%d pontos de legado" % D.pts, 22, DIM)
	if prox != null: bar(c, "Próximo: " + prox[1], D.pts - nv[0], prox[0] - nv[0], GOLD, "%d/%d" % [D.pts, prox[0]])
	lbl(c, "Pontos: título 12, vice 4, reputação, jogos ativos e seguidores.", 18, DIM)
	var cm = card("Metas de longo prazo", null, ACC)
	var metas = [
		["Conquistar 3 títulos", D.tit, 3], ["Conquistar 10 títulos", D.tit, 10], ["Conquistar 25 títulos", D.tit, 25],
		["Ter 4 jogos ativos", D.jogos, 4], ["Ter 8 jogos ativos", D.jogos, 8],
		["Alcançar reputação 3", int(S.org.rep * 10), 30], ["Alcançar reputação 6", int(S.org.rep * 10), 60],
		["Chegar a 1 milhão de seguidores", int(S.social.seg), 1000000],
		["Acumular R$ 5 milhões em caixa", int(S.org.caixa), 5000000], ["Acumular R$ 50 milhões em caixa", int(S.org.caixa), 50000000],
		["Anos com título: 5", D.anos, 5]]
	var feitas = 0
	for m in metas:
		var ok: bool = m[1] >= m[2]; if ok: feitas += 1
		bar(cm, m[0], min(m[1], m[2]), m[2], OK if ok else ACC, "Feito" if ok else "%d/%d" % [min(m[1], m[2]), m[2]] if m[2] < 100000 else _fmt_n(m[1]))
	lbl(cm, "%d de %d metas concluídas" % [feitas, metas.size()], 22, GOLD)

# ======================================================================
#  SISTEMA VISUAL v2 — "Arena": fontes, ícones vetoriais e componentes
# ======================================================================
var F_B: Font = null; var F_BS: Font = null; var F_H: Font = null
func _fonts() -> void:
	for p in [["F_B", "Barlow-Medium"], ["F_BS", "Barlow-SemiBold"], ["F_H", "Rajdhani-Bold"]]:
		var path = "res://assets/fonts/%s.ttf" % p[1]
		if ResourceLoader.exists(path): set(p[0], load(path))
const ROLE_COL := [Color("ff6b6b"), Color("ffb347"), Color("5ee6a8"), Color("5cc8ff"), Color("b28cff"), Color("8a94b8"), Color("8a94b8")]

class Ico extends Control:
	var kind = ""; var col = Color.WHITE
	func _init(k := "", sz := 24, c := Color.WHITE) -> void:
		kind = k; col = c; custom_minimum_size = Vector2(sz, sz); mouse_filter = Control.MOUSE_FILTER_IGNORE
		size_flags_horizontal = Control.SIZE_SHRINK_CENTER; size_flags_vertical = Control.SIZE_SHRINK_CENTER
	func _pl(pts: Array, w := 2.0) -> void: draw_polyline(PackedVector2Array(pts), col, w, true)
	func _ln(a: Vector2, b: Vector2, w := 2.0) -> void: draw_line(a, b, col, w, true)
	func _draw() -> void:
		var s: float = minf(size.x, size.y) / 24.0
		draw_set_transform(Vector2.ZERO, 0.0, Vector2(s, s))
		var w = 2.0
		match kind:
			"home":
				_pl([Vector2(3, 11), Vector2(12, 3), Vector2(21, 11)]); _pl([Vector2(5.5, 9.5), Vector2(5.5, 20.5), Vector2(18.5, 20.5), Vector2(18.5, 9.5)]); _pl([Vector2(10, 20.5), Vector2(10, 14.5), Vector2(14, 14.5), Vector2(14, 20.5)])
			"users":
				draw_arc(Vector2(12, 8), 3.8, 0, TAU, 24, col, w, true); draw_arc(Vector2(12, 23), 8.5, PI, TAU, 24, col, w, true)
			"search":
				draw_arc(Vector2(10.5, 10.5), 6.5, 0, TAU, 28, col, w, true); _ln(Vector2(15.5, 15.5), Vector2(21, 21), 2.4)
			"calendar":
				draw_rect(Rect2(3, 5, 18, 16), col, false, w, true); _ln(Vector2(3, 10), Vector2(21, 10)); _ln(Vector2(8, 3), Vector2(8, 7)); _ln(Vector2(16, 3), Vector2(16, 7))
				draw_rect(Rect2(7, 13, 3, 3), col); draw_rect(Rect2(14, 13, 3, 3), col)
			"more":
				for y in [6, 12, 18]: _ln(Vector2(4, y), Vector2(20, y), 2.4)
			"coin":
				draw_arc(Vector2(12, 12), 8.5, 0, TAU, 28, col, w, true); _ln(Vector2(12, 7), Vector2(12, 17)); _pl([Vector2(14.5, 9), Vector2(10.5, 9), Vector2(9.5, 10.5), Vector2(10.5, 12), Vector2(13.5, 12), Vector2(14.5, 13.5), Vector2(13.5, 15), Vector2(9.5, 15)], 1.6)
			"star":
				var pts = []
				for i in 10:
					var a: float = -PI / 2 + i * PI / 5.0; var r: float = 10.0 if i % 2 == 0 else 4.4
					pts.append(Vector2(12 + cos(a) * r, 12.6 + sin(a) * r))
				draw_colored_polygon(PackedVector2Array(pts), col)
			"trophy":
				_pl([Vector2(7, 4), Vector2(17, 4), Vector2(16, 10.5), Vector2(12, 13.5), Vector2(8, 10.5), Vector2(7, 4)]); _pl([Vector2(7, 6), Vector2(4, 6), Vector2(4, 8.5), Vector2(7.6, 10.4)]); _pl([Vector2(17, 6), Vector2(20, 6), Vector2(20, 8.5), Vector2(16.4, 10.4)]); _ln(Vector2(12, 13.5), Vector2(12, 18)); _ln(Vector2(8, 20), Vector2(16, 20), 2.4)
			"mail":
				draw_rect(Rect2(3, 5.5, 18, 13), col, false, w, true); _pl([Vector2(3, 6.5), Vector2(12, 13.5), Vector2(21, 6.5)])
			"chart":
				draw_rect(Rect2(4, 13, 4, 7), col); draw_rect(Rect2(10, 8, 4, 12), col); draw_rect(Rect2(16, 4, 4, 16), col)
			"news":
				draw_rect(Rect2(4, 4, 16, 16), col, false, w, true); _ln(Vector2(8, 9), Vector2(16, 9)); _ln(Vector2(8, 13), Vector2(16, 13)); _ln(Vector2(8, 17), Vector2(13, 17))
			"list":
				for y in [6, 12, 18]: draw_circle(Vector2(5, y), 1.5, col); _ln(Vector2(9, y), Vector2(21, y))
			"brief":
				draw_rect(Rect2(3, 8, 18, 12), col, false, w, true); _pl([Vector2(9, 8), Vector2(9, 5), Vector2(15, 5), Vector2(15, 8)]); _ln(Vector2(3, 13), Vector2(21, 13))
			"globe":
				draw_arc(Vector2(12, 12), 9, 0, TAU, 28, col, w, true); _ln(Vector2(3, 12), Vector2(21, 12), 1.6); _ln(Vector2(12, 3), Vector2(12, 21), 1.6)
				var e = []
				for i in 25: var a: float = i * TAU / 24.0; e.append(Vector2(12 + cos(a) * 4.2, 12 + sin(a) * 9))
				_pl(e, 1.6)
			"up": _ln(Vector2(12, 19), Vector2(12, 5)); _pl([Vector2(6, 11), Vector2(12, 5), Vector2(18, 11)])
			"down": _ln(Vector2(12, 5), Vector2(12, 19)); _pl([Vector2(6, 13), Vector2(12, 19), Vector2(18, 13)])
			"flat": _ln(Vector2(5, 12), Vector2(19, 12)); _pl([Vector2(14, 7), Vector2(19, 12), Vector2(14, 17)])
			"chev": _pl([Vector2(9, 5), Vector2(16, 12), Vector2(9, 19)], 2.4)
			"plus": _ln(Vector2(12, 5), Vector2(12, 19), 2.4); _ln(Vector2(5, 12), Vector2(19, 12), 2.4)
			"check": _pl([Vector2(5, 12.5), Vector2(10, 17.5), Vector2(19, 7)], 2.6)
			"clock":
				draw_arc(Vector2(12, 12), 9, 0, TAU, 28, col, w, true); _pl([Vector2(12, 6.5), Vector2(12, 12), Vector2(16, 14)])
			"bolt":
				draw_colored_polygon(PackedVector2Array([Vector2(13, 2), Vector2(5, 13.5), Vector2(11, 13.5), Vector2(10, 22), Vector2(19, 10), Vector2(13, 10)]), col)
			"shield":
				_pl([Vector2(12, 3), Vector2(20, 6), Vector2(19, 13), Vector2(12, 21), Vector2(5, 13), Vector2(4, 6), Vector2(12, 3)])
			"mood":
				draw_arc(Vector2(12, 12), 9, 0, TAU, 28, col, w, true); draw_circle(Vector2(9, 10), 1.2, col); draw_circle(Vector2(15, 10), 1.2, col); draw_arc(Vector2(12, 12.5), 4.5, 0.25, PI - 0.25, 12, col, 1.8, true)
			"bell":
				draw_arc(Vector2(12, 10), 6, PI, TAU, 16, col, w, true); _ln(Vector2(6, 10), Vector2(6, 16)); _ln(Vector2(18, 10), Vector2(18, 16)); _ln(Vector2(4, 17), Vector2(20, 17)); draw_arc(Vector2(12, 19.5), 2.2, 0, PI, 8, col, w, true)
			"gear":
				draw_arc(Vector2(12, 12), 3.6, 0, TAU, 20, col, w, true); draw_arc(Vector2(12, 12), 7.6, 0, TAU, 28, col, w, true)
				for i in 8: var a: float = i * TAU / 8.0; _ln(Vector2(12 + cos(a) * 7.6, 12 + sin(a) * 7.6), Vector2(12 + cos(a) * 10.2, 12 + sin(a) * 10.2), 2.6)
			"play":
				draw_colored_polygon(PackedVector2Array([Vector2(7, 4), Vector2(20, 12), Vector2(7, 20)]), col)
			"pause":
				draw_rect(Rect2(6, 4, 4, 16), col); draw_rect(Rect2(14, 4, 4, 16), col)
			"fwd":
				draw_colored_polygon(PackedVector2Array([Vector2(4, 5), Vector2(13, 12), Vector2(4, 19)]), col); draw_colored_polygon(PackedVector2Array([Vector2(12, 5), Vector2(21, 12), Vector2(12, 19)]), col)
			"swap":
				_ln(Vector2(4, 8), Vector2(19, 8)); _pl([Vector2(15, 4), Vector2(19, 8), Vector2(15, 12)]); _ln(Vector2(20, 16), Vector2(5, 16)); _pl([Vector2(9, 12), Vector2(5, 16), Vector2(9, 20)])
			_:
				draw_circle(Vector2(12, 12), 4, col)
class Hero extends PanelContainer:
	var c1 = Color("1a1236"); var c2 = Color("0a0a16"); var acc = Color("7c4dff"); var stripes = true; var crowd = false; var round_r = 0.0
	func _init() -> void: add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	func _rr(w: float, h: float, r: float) -> PackedVector2Array:
		var pts = PackedVector2Array()
		if r <= 0.5: return PackedVector2Array([Vector2(0, 0), Vector2(w, 0), Vector2(w, h), Vector2(0, h)])
		var cs = [Vector2(w - r, r), Vector2(w - r, h - r), Vector2(r, h - r), Vector2(r, r)]; var st = [-PI / 2, 0.0, PI / 2, PI]
		for k in 4:
			for i in 7: var a: float = st[k] + i * (PI / 2) / 6.0; pts.append(cs[k] + Vector2(cos(a), sin(a)) * r)
		return pts
	func _draw() -> void:
		var w: float = size.x; var h: float = size.y
		var poly: PackedVector2Array = _rr(w, h, round_r); var cols = PackedColorArray()
		for pt in poly: cols.append(c1.lerp(c2, clampf(pt.x / maxf(w, 1.0), 0.0, 1.0)))
		draw_polygon(poly, cols)
		if crowd:
			for i in 3:
				var x0: float = w * (0.38 + i * 0.2)
				draw_colored_polygon(PackedVector2Array([Vector2(x0, 0), Vector2(x0 + 40, 0), Vector2(x0 + 190, h), Vector2(x0 - 110, h)]), Color(acc.r, acc.g, acc.b, 0.07))
			var sd: int = 12345
			for i in 150:
				sd = (sd * 1103515245 + 12345) & 0x7fffffff; var px: float = w * 0.35 + (sd % 1000) / 1000.0 * w * 0.65
				sd = (sd * 1103515245 + 12345) & 0x7fffffff; var py: float = h * 0.45 + (sd % 1000) / 1000.0 * h * 0.55
				draw_circle(Vector2(px, py), 1.3 + (sd % 3) * 0.5, Color(0.8, 0.75, 1.0, 0.10 + (sd % 5) * 0.04))
		if stripes:
			for i in 3:
				var x: float = minf(w * 0.60 + i * 54.0, w - 40.0)
				draw_colored_polygon(PackedVector2Array([Vector2(x, 0), Vector2(x + 34, 0), Vector2(x - 34, h), Vector2(x - 68, h)]), Color(acc.r, acc.g, acc.b, 0.10 - i * 0.025))
		draw_rect(Rect2(round_r * 0.5, h - 3, w - round_r, 3), Color(acc.r, acc.g, acc.b, 0.85))
class Chart extends Control:
	var vals: Array = []; var labels: Array = []; var col = Color("7c4dff"); var fnt: Font = null
	func _draw() -> void:
		var pl: float = 44.0; var pb: float = 26.0; var w: float = size.x - pl - 6.0; var h: float = size.y - pb - 6.0
		for i in 4: draw_line(Vector2(pl, 6 + h * i / 3.0), Vector2(pl + w, 6 + h * i / 3.0), Color(1, 1, 1, 0.06), 1.0)
		if vals.size() < 2: return
		var mn: float = vals[0]; var mxv: float = vals[0]
		for v in vals: mn = minf(mn, v); mxv = maxf(mxv, v)
		var pad: float = maxf((mxv - mn) * 0.15, 1.0); mn -= pad; mxv += pad; var span: float = maxf(mxv - mn, 1.0); var pts = PackedVector2Array(); var n: int = vals.size()
		for i in n: pts.append(Vector2(pl + w * i / float(n - 1), 6 + h - h * (vals[i] - mn) / span))
		var fill = PackedVector2Array(pts); fill.append(Vector2(pl + w, 6 + h)); fill.append(Vector2(pl, 6 + h))
		draw_colored_polygon(fill, Color(col.r, col.g, col.b, 0.16)); draw_polyline(pts, col, 2.6, true)
		for i in n:
			if n <= 14 or i % maxi(1, n / 12) == 0: draw_circle(pts[i], 3.0, col)
		if fnt != null:
			for i in 4:
				var yv: float = mxv - span * i / 3.0
				draw_string(fnt, Vector2(0, 6 + h * i / 3.0 + 6), (("%.1f" % yv if span < 6.0 else str(int(yv))) if absf(yv) < 1000 else "%.1fk" % (yv / 1000.0) if absf(yv) < 1e6 else "%.1fM" % (yv / 1e6)), HORIZONTAL_ALIGNMENT_LEFT, pl - 4, 15, Color("8c8fb3"))
			for i in labels.size():
				var lx: float = pl + w * i / float(maxi(1, labels.size() - 1)); var ts: Vector2 = fnt.get_string_size(str(labels[i]), HORIZONTAL_ALIGNMENT_LEFT, -1, 16)
				draw_string(fnt, Vector2(clampf(lx - ts.x / 2.0, pl - 10.0, size.x - ts.x), size.y - 4), str(labels[i]), HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("8c8fb3"))
class Ring extends Control:
	var val = 0.0; var mx = 100.0; var col = Color("1fc8ff"); var track = Color("202a46"); var txt = ""; var sub = ""; var fnt: Font = null; var thick = 9.0
	func _draw() -> void:
		var c: Vector2 = size / 2.0; var r: float = minf(size.x, size.y) / 2.0 - thick
		draw_arc(c, r, 0, TAU, 64, track, thick, true)
		draw_arc(c, r, -PI / 2, -PI / 2 + TAU * clampf(val / maxf(mx, 0.001), 0.0, 1.0), 64, col, thick, true)
		if fnt != null:
			var fs: int = int(r * 0.95)
			var ts: Vector2 = fnt.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs)
			draw_string(fnt, Vector2(c.x - ts.x / 2.0, c.y + fs * 0.28), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("eef1ff"))
			if sub != "":
				var ss: Vector2 = fnt.get_string_size(sub, HORIZONTAL_ALIGNMENT_LEFT, -1, int(r * 0.30))
				draw_string(fnt, Vector2(c.x - ss.x / 2.0, c.y + fs * 0.28 + r * 0.42), sub, HORIZONTAL_ALIGNMENT_LEFT, -1, int(r * 0.30), Color("8a94b8"))
class Spark extends Control:
	var vals: Array = []; var col = Color("1fc8ff")
	func _draw() -> void:
		if vals.size() < 2: return
		var mn: float = vals[0]; var mxv: float = vals[0]
		for v in vals: mn = minf(mn, v); mxv = maxf(mxv, v)
		var span: float = maxf(mxv - mn, 1.0); var pts = PackedVector2Array(); var n: int = vals.size()
		for i in n: pts.append(Vector2(size.x * i / float(n - 1), size.y - 4.0 - (size.y - 8.0) * (vals[i] - mn) / span))
		var fill = PackedVector2Array(pts); fill.append(Vector2(size.x, size.y)); fill.append(Vector2(0, size.y))
		draw_colored_polygon(fill, Color(col.r, col.g, col.b, 0.14)); draw_polyline(pts, col, 2.4, true)
class Mono extends Control:
	var txt = "?"; var col = Color("1fc8ff"); var fnt: Font = null
	func _init() -> void: custom_minimum_size = Vector2(84, 84); mouse_filter = Control.MOUSE_FILTER_IGNORE; size_flags_vertical = Control.SIZE_SHRINK_CENTER
	func _draw() -> void:
		var c: Vector2 = size / 2.0; var r: float = minf(size.x, size.y) / 2.0 - 2.0; var pts = PackedVector2Array()
		for i in 6: var a: float = -PI / 2 + i * TAU / 6.0; pts.append(c + Vector2(cos(a), sin(a)) * r)
		draw_colored_polygon(pts, Color(col.r * 0.30, col.g * 0.30, col.b * 0.30, 1.0))
		var closed = PackedVector2Array(pts); closed.append(pts[0]); draw_polyline(closed, col, 3.0, true)
		if fnt != null:
			var fs: int = int(r * 0.72); var ts: Vector2 = fnt.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs)
			draw_string(fnt, Vector2(c.x - ts.x / 2.0, c.y + fs * 0.32), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color.WHITE)

func ico(k: String, sz := 24, col = null) -> Control: return Ico.new(k, sz, col if col != null else TXT)
func hl(p, t, size := 30, col = null, wrap := false) -> Label:   # texto de título (fonte esportiva)
	var l = lbl(p, t, size, col, wrap)
	if F_H != null: l.add_theme_font_override("font", F_H)
	return l
func ovr_badge(o, sz := 62, pot_txt := "") -> Control:   # selo de nota
	var c: Color = nota_col(o); var pc = PanelContainer.new(); pc.custom_minimum_size = Vector2(sz, sz * 0.86)
	pc.add_theme_stylebox_override("panel", _sbf(Color(c.r, c.g, c.b, 0.16), 12, c, 2, 2))
	var l = Label.new(); l.text = str(o); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", int(sz * 0.58)); l.add_theme_color_override("font_color", c)
	if F_H != null: l.add_theme_font_override("font", F_H)
	pc.add_child(l); return pc
func role_tag(rl: String, col: Color, w := 56) -> Control:
	var pc = PanelContainer.new(); pc.custom_minimum_size = Vector2(w, 0); pc.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	pc.add_theme_stylebox_override("panel", _sbf(Color(col.r, col.g, col.b, 0.18), 8, null, 0, 4))
	var l = Label.new(); l.text = rl; l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; l.add_theme_font_size_override("font_size", 21); l.add_theme_color_override("font_color", col)
	if F_H != null: l.add_theme_font_override("font", F_H)
	pc.add_child(l); return pc
func thin(p, val, mx, col, h := 8, w := 0) -> ProgressBar:   # barra fina
	var pb = ProgressBar.new(); pb.min_value = 0; pb.max_value = mx; pb.value = val; pb.show_percentage = false; pb.custom_minimum_size = Vector2(w, h)
	pb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	if w == 0: pb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pb.add_theme_stylebox_override("background", _sbf(Color("1a2340"), 6, null, 0, 0)); pb.add_theme_stylebox_override("fill", _sbf(col, 6, null, 0, 0)); p.add_child(pb); return pb
func sec(p, titulo: String, icon := "", right := "") -> void:   # cabeçalho de seção
	var h = hrow(p); h.add_theme_constant_override("separation", 8)
	var sp = Control.new(); sp.custom_minimum_size.x = 2; h.add_child(sp)
	if icon != "": h.add_child(ico(icon, 20, ACC))
	var l = hl(h, titulo.to_upper(), 23, DIM); l.size_flags_horizontal = Control.SIZE_FILL
	var ln = ColorRect.new(); ln.color = LINE; ln.custom_minimum_size.y = 2; ln.size_flags_horizontal = Control.SIZE_EXPAND_FILL; ln.size_flags_vertical = Control.SIZE_SHRINK_CENTER; h.add_child(ln)
	if right != "": lbl(h, right, 20, DIM, false).size_flags_horizontal = Control.SIZE_FILL
func seg(p, items: Array, sel, cb: Callable, col = null) -> void:   # controle segmentado
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sbf(Color("0a0f1d"), 14, LINE, 1, 4)); p.add_child(pc)
	var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 4); pc.add_child(h)
	var cc: Color = col if col != null else ACC
	for it in items:
		var on: bool = str(it[0]) == str(sel); var b = Button.new(); b.text = str(it[1]); b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 52; b.clip_text = true
		var sn = _sbf(cc if on else Color(0, 0, 0, 0), 11, null, 0, 8)
		for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, sn)
		var fc: Color = (Color("06101c") if cc.get_luminance() > 0.45 else Color.WHITE) if on else DIM
		for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color"]: b.add_theme_color_override(k, fc)
		if F_H != null: b.add_theme_font_override("font", F_H)
		b.add_theme_font_size_override("font_size", 25); b.pressed.connect(cb.bind(it[0])); h.add_child(b)
func rchip(p, icon: String, txt: String, col: Color) -> void:   # recurso do cabeçalho
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sbf(Color(0, 0, 0, 0.35), 12, Color(col.r, col.g, col.b, 0.45), 1, 7)); p.add_child(pc)
	var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 6); pc.add_child(h)
	h.add_child(ico(icon, 20, col)); var l = Label.new(); l.text = txt; l.add_theme_font_size_override("font_size", 23); l.add_theme_color_override("font_color", TXT)
	if F_H != null: l.add_theme_font_override("font", F_H)
	h.add_child(l)
func cardbtn(p, cb: Callable, stripe: Color, minh := 96) -> Array:   # cartão clicável com tarja lateral: [botão, HBox]
	var b = Button.new(); b.custom_minimum_size.y = minh; b.pressed.connect(cb); p.add_child(b)
	var n = _sbf(Color("101730"), 14, LINE, 1, 0); var hv = _sbf(Color("172041"), 14, stripe, 1, 0)
	for k in ["normal", "pressed"]: b.add_theme_stylebox_override(k, n)
	for k in ["hover", "hover_pressed"]: b.add_theme_stylebox_override(k, hv)
	var st = ColorRect.new(); st.color = stripe; st.set_anchors_preset(Control.PRESET_LEFT_WIDE); st.offset_left = 0; st.offset_right = 6; st.offset_top = 14; st.offset_bottom = -14; st.mouse_filter = Control.MOUSE_FILTER_IGNORE; b.add_child(st)
	var mc = MarginContainer.new(); mc.set_anchors_preset(Control.PRESET_FULL_RECT); mc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mc.add_theme_constant_override("margin_left", 20); mc.add_theme_constant_override("margin_right", 14); mc.add_theme_constant_override("margin_top", 8); mc.add_theme_constant_override("margin_bottom", 8)
	b.add_child(mc); var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 12); h.alignment = BoxContainer.ALIGNMENT_CENTER; mc.add_child(h)
	return [b, h]
func vstack(p, sep := 0, grow := true) -> VBoxContainer:
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", sep)
	if grow: v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.size_flags_vertical = Control.SIZE_SHRINK_CENTER; p.add_child(v); return v
func gap(p, h := 6) -> void:
	var c = Control.new(); c.custom_minimum_size.y = h; p.add_child(c)
func tile(p, icon: String, titulo: String, valor: String, col: Color, hist = null) -> void:   # indicador com ícone
	var pc = PanelContainer.new(); pc.size_flags_horizontal = Control.SIZE_EXPAND_FILL; pc.add_theme_stylebox_override("panel", _sbf(Color("101730"), 14, LINE, 1, 12)); p.add_child(pc)
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", 2); pc.add_child(v)
	var h = hrow(v); h.add_theme_constant_override("separation", 6); h.add_child(ico(icon, 18, col)); lbl(h, titulo.to_upper(), 17, DIM, false)
	hl(v, valor, 34, col)
	if hist is Array and hist.size() > 2:
		var sp = Spark.new(); sp.vals = hist.slice(max(0, hist.size() - 26)); sp.col = col; sp.custom_minimum_size.y = 34; v.add_child(sp)

# ======================================================================
#  PAINEL (início), barra superior e barra lateral — layout de referência
# ======================================================================
const MES_FULL := ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const WIDE_NAV := [["org", "Início", "home"], ["elenco", "Equipes", "users"], ["mercado", "Mercado", "search"], ["ligas", "Competições", "trophy"], ["cal", "Agenda", "calendar"], ["fin", "Finanças", "coin"], ["noticias", "Notícias", "news"], ["inbox", "Mensagens", "mail"], ["neg", "Negócios", "brief"], ["rank", "Rankings", "chart"], ["legado", "Conquistas", "star"], ["hall", "Hall da Fama", "trophy"], ["mundo", "Mundo", "globe"]]
var cls_game = ""
func org_cor() -> Color: return Color.from_hsv(hue(O.S.org.nome), 0.62, 1.0)
func ibtn(p, t: String, icon: String, cb: Callable, accent := false, minh := 56) -> Button:   # botão com ícone
	var b = Button.new(); b.custom_minimum_size.y = minh; b.pressed.connect(cb)
	var fc: Color = Color.WHITE
	var n = _sbf(ACC if accent else Color("1a1b36"), 12, null if accent else LINE, 0 if accent else 1, 10); n.content_margin_left = 48; n.content_margin_right = 18
	var hv = _sbf(Color("9366ff") if accent else Color("242549"), 12, null, 0, 10); hv.content_margin_left = 48; hv.content_margin_right = 18
	for k in ["normal", "pressed"]: b.add_theme_stylebox_override(k, n)
	for k in ["hover", "hover_pressed"]: b.add_theme_stylebox_override(k, hv)
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color"]: b.add_theme_color_override(k, fc)
	if F_H != null: b.add_theme_font_override("font", F_H)
	b.add_theme_font_size_override("font_size", 26); b.text = t
	var ic = ico(icon, 24, fc); ic.position = Vector2(15, minh / 2.0 - 12.0); b.add_child(ic); p.add_child(b); return b
func panel(p, titulo: String, icon := "", link := "", cb = null, pad := 16) -> VBoxContainer:   # painel com cabeçalho (ícone + título + link)
	var pc = PanelContainer.new(); pc.size_flags_horizontal = Control.SIZE_EXPAND_FILL; pc.size_flags_vertical = Control.SIZE_EXPAND_FILL; pc.add_theme_stylebox_override("panel", _sbf(SURF, 14, LINE, 1, pad)); p.add_child(pc)
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", 12); pc.add_child(v)
	if titulo != "":
		var h = hrow(v); h.add_theme_constant_override("separation", 10)
		if icon != "": h.add_child(ico(icon, 26, ACC))
		hl(h, titulo, 30, TXT)
		if link != "":
			var lb = Button.new(); lb.text = link + "  >"; lb.flat = true; lb.focus_mode = Control.FOCUS_NONE; lb.add_theme_font_size_override("font_size", 21); lb.add_theme_color_override("font_color", ACC2); lb.add_theme_color_override("font_hover_color", Color.WHITE)
			for k in ["normal", "hover", "pressed"]: lb.add_theme_stylebox_override(k, StyleBoxEmpty.new())
			if cb != null: lb.pressed.connect(cb)
			h.add_child(lb)
	return v
func _row(p, sep := 14) -> HBoxContainer:
	var h = HBoxContainer.new(); h.add_theme_constant_override("separation", sep); h.size_flags_horizontal = Control.SIZE_EXPAND_FILL; p.add_child(h); return h
func _col(p, ratio := 1.0, sep := 14) -> VBoxContainer:
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", sep); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.size_flags_vertical = Control.SIZE_EXPAND_FILL; v.size_flags_stretch_ratio = ratio; p.add_child(v); return v
func _ir(p, tab_id: String) -> Callable: return func(): tab = tab_id; render()

# ---------- dados do painel ----------
func _agenda_all(n := 6) -> Array:
	var itens = []
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		for sq in O.SQUADS:
			if O.comp_for(g, sq) == null: continue
			for a in O.agenda(g, sq, n): a["g"] = g; a["sq"] = sq; a["tag"] = O.tag_de(g, sq); itens.append(a)
	itens.sort_custom(func(a, b): return a.em < b.em)
	return itens
func _prox_jogo():
	for a in _agenda_all(3):
		if a.tipo != "ini": return a
	return null
func _valor_elenco() -> int:
	var t = 0
	for g in O.GAMES:
		for q in O.S.games[g].squads.values():
			for p in q.slots:
				if p != null: t += O.valor_venda(p)
	return t
func _moral_geral() -> float:
	var t = 0.0; var n = 0
	for g in O.GAMES:
		if not O.aberto(g) or not O.S.games[g].squads.t1.on: continue
		var ts: Array = O.titulares(g, "t1").filter(func(p): return p != null)
		for p in ts: t += p.mo; n += 1
	return t / n if n else 0.0
func _rotulos_meses(n: int) -> Array:
	var out = []; var sem: int = O.S.org.semana; var ano: int = O.S.org.ano
	for k in 5:
		var i: int = int(round((n - 1) * k / 4.0)); var w: int = ((sem - 1 - (n - 1 - i)) % 52 + 52) % 52 + 1
		out.append(O.MES[O.data_de(w, ano).m].capitalize())
	return out
func _delta_txt(vals: Array) -> float:
	if vals.size() < 2: return 0.0
	var a: float = vals[maxi(0, vals.size() - 5)]; return vals[vals.size() - 1] - a

# ---------- barra superior (PC) ----------
func _topbar() -> void:
	var S = O.S; clear(topbar_h); var oc: Color = org_cor(); var h = topbar_h
	var m = Mono.new(); m.fnt = F_H; m.txt = ini(S.org.nome); m.col = oc; m.custom_minimum_size = Vector2(54, 54); h.add_child(m)
	var v0 = vstack(h, 0, false); hl(v0, S.org.nome, 28, TXT); lbl(v0, "Organização de Esports", 17, DIM, false)
	_vsep(h)
	h.add_child(ico("coin", 34, OK if S.org.caixa >= 0 else BAD)); var v1 = vstack(h, 0, false); hl(v1, O.money(S.org.caixa), 28, TXT); lbl(v1, "Saldo Atual", 17, DIM, false)
	_vsep(h)
	h.add_child(ico("trophy", 34, GOLD)); var v2 = vstack(h, 0, false); hl(v2, O.money(_valor_elenco()), 28, TXT); lbl(v2, "Valor do Elenco", 17, DIM, false)
	var sp = Control.new(); sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL; h.add_child(sp)
	var hc = HBoxContainer.new(); hc.add_theme_constant_override("separation", 8); h.add_child(hc); _ctrl_buttons(hc)
	_vsep(h)
	var d: Dictionary = O.data_de(S.org.semana, S.org.ano)
	h.add_child(ico("calendar", 34, ACC2)); var v3 = vstack(h, 0, false); hl(v3, "%s de %d" % [MES_FULL[d.m], S.org.ano], 26, ACC2); lbl(v3, "Semana %d  |  dia %d" % [S.org.semana, d.d], 17, DIM, false)
	_vsep(h)
	var bell = Button.new(); bell.flat = true; bell.custom_minimum_size = Vector2(52, 52); bell.focus_mode = Control.FOCUS_NONE
	for k in ["normal", "hover", "pressed"]: bell.add_theme_stylebox_override(k, StyleBoxEmpty.new())
	var bi = ico("bell", 32, TXT); bi.position = Vector2(10, 10); bell.add_child(bi)
	var nl: int = O.inbox_nao_lidas()
	if nl > 0:
		var bd = Label.new(); bd.text = str(nl); bd.add_theme_font_size_override("font_size", 16); bd.add_theme_color_override("font_color", Color.WHITE); bd.add_theme_stylebox_override("normal", _sbf(BAD, 12, null, 0, 3)); bd.position = Vector2(30, 0); bd.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; bell.add_child(bd)
	bell.pressed.connect(_ir(self, "inbox") if false else func(): tab = "inbox"; render()); h.add_child(bell)
	var pf = Button.new(); pf.custom_minimum_size = Vector2(52, 52); pf.focus_mode = Control.FOCUS_NONE
	for k in ["normal", "hover", "pressed"]: pf.add_theme_stylebox_override(k, _sbf(Color("1a1b36"), 26, ACC, 2, 0))
	var pi = ico("users", 28, TXT); pi.position = Vector2(12, 12); pf.add_child(pi); pf.pressed.connect(_config); h.add_child(pf)
func _vsep(p) -> void:
	var c = ColorRect.new(); c.color = LINE; c.custom_minimum_size = Vector2(2, 44); c.size_flags_vertical = Control.SIZE_SHRINK_CENTER; p.add_child(c)
func _ctrl_buttons(h: Container) -> void:
	ibtn(h, "Parar" if play else "Avançar", "pause" if play else "play", _toggle_play, true, 52)
	ibtn(h, "+1 sem", "fwd", func(): _manual(1), false, 52)
	ibtn(h, "Até o jogo", "chev", _ate_jogo, false, 52)

# ---------- barra lateral (PC) ----------
func _sidebar() -> void:
	var S = O.S; var oc: Color = org_cor()
	gap(side, 18)
	var m = Mono.new(); m.fnt = F_H; m.txt = ini(S.org.nome); m.col = oc; m.custom_minimum_size = Vector2(112, 112); m.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; side.add_child(m)
	var nm = hl(side, S.org.nome.to_upper(), 34, TXT, true); nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	gap(side, 14)
	for t in WIDE_NAV:
		var on: bool = t[0] == tab or (t[0] == "elenco" and false)
		_side_btn(t[1], on, func(): tab = t[0]; render(), t[2])
	_side_btn("Configurações", false, _config, "gear")
	gap(side, 22)
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sbf(Color("12132a"), 14, LINE, 1, 14)); side.add_child(pc)
	var hh = HBoxContainer.new(); hh.add_theme_constant_override("separation", 12); pc.add_child(hh); hh.add_child(ico("globe", 40, DIM))
	var vv = vstack(hh, 0); lbl(vv, "Reputação Mundial", 20, DIM, false)
	var arr = _rank_pontos(game).p.keys(); var P: Dictionary = _rank_pontos(game).p; arr.sort_custom(func(a, b): return P[a] > P[b] or (P[a] == P[b] and a < b))
	var pos: int = arr.find(S.org.nome)
	hl(vv, ("#%d" % (pos + 1)) if pos >= 0 else "Rep %.1f" % S.org.rep, 38, TXT)
func _config() -> void:
	var v = modal("Configurações")
	var tg = CheckButton.new(); tg.text = "Pular partidas (simular direto)"; tg.button_pressed = auto; tg.toggled.connect(func(on):
		auto = on
		if on: FileAccess.open("user://auto", FileAccess.WRITE).store_string("1")
		else: DirAccess.remove_absolute(ProjectSettings.globalize_path("user://auto"))); v.add_child(tg)
	lbl(v, "Velocidade do avanço", 24, DIM)
	seg(v, [[0.45, "1x"], [0.22, "2x"], [0.07, "6x"]], vel, func(id): vel = float(id); if play: timer.start(vel); _config())
	gap(v, 10)
	btn(v, "Tem certeza? Toque de novo" if fm == "reset" else "Nova org (apaga o save)", func():
		if fm == "reset": fm = ""; O.reset_estado(); O.comecar(); close_modal()
		else: fm = "reset"; _config())

# ---------- painéis ----------
func _p_hero(p, prox) -> void:
	var S = O.S; var hr = Hero.new(); hr.crowd = true; hr.round_r = 14.0; hr.acc = org_cor(); hr.size_flags_horizontal = Control.SIZE_EXPAND_FILL; hr.size_flags_vertical = Control.SIZE_EXPAND_FILL; p.add_child(hr)
	var mc = MarginContainer.new(); for k in ["left", "right"]: mc.add_theme_constant_override("margin_" + k, 26)
	for k in ["top", "bottom"]: mc.add_theme_constant_override("margin_" + k, 18)
	hr.add_child(mc); var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 26); mc.add_child(h)
	var m = Mono.new(); m.fnt = F_H; m.txt = ini(S.org.nome); m.col = org_cor(); m.custom_minimum_size = Vector2(124, 124) if wide else Vector2(96, 96); h.add_child(m)
	var v = vstack(h, 4); v.alignment = BoxContainer.ALIGNMENT_CENTER
	var nm = hl(v, S.org.nome.to_upper(), 76 if wide else 46, Color.WHITE, true)
	var tg = Label.new(); var D = _legado_dados(); var nv = LEG_NIVEIS[0]
	for x in LEG_NIVEIS:
		if D.pts >= x[0]: nv = x
	tg.text = ("TEMPORADA %d  ·  %s" % [S.org.ano, nv[1]]).to_upper(); tg.add_theme_font_size_override("font_size", 22 if wide else 17); tg.add_theme_color_override("font_color", Color("b9b6e0"))
	if F_H != null:
		var fv = FontVariation.new(); fv.base_font = F_H; fv.spacing_glyph = 5; tg.add_theme_font_override("font", fv)
	v.add_child(tg)
	hr.custom_minimum_size.y = 170 if wide else 150
func _p_next(p, prox) -> void:
	var v = panel(p, "Próximo Compromisso", "calendar")
	if prox == null: lbl(v, "Nada agendado: complete os titulares de um time.", 22, DIM); return
	var h = hrow(v); var c1 = vstack(h, 2); hl(c1, str(prox.label), 32, TXT); lbl(c1, prox.tag, 20, DIM)
	var c2 = vstack(h, 0, false); c2.alignment = BoxContainer.ALIGNMENT_END
	var dl = hl(c2, str(prox.data.txt), 34, ACC2); dl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var dl2 = lbl(c2, "em %d sem." % prox.em if prox.em > 0 else "esta semana", 20, DIM, false); dl2.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var vs = hrow(v); vs.alignment = BoxContainer.ALIGNMENT_CENTER; vs.add_theme_constant_override("separation", 22)
	var a = vstack(vs, 2, false); a.add_child(crest(O.S.org.nome, 64)); a.get_child(0).size_flags_horizontal = Control.SIZE_SHRINK_CENTER; var al = lbl(a, O.S.org.nome, 19, TXT, false); al.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hl(vs, "VS", 26, DIM).size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var b = vstack(vs, 2, false)
	if prox.op != null:
		b.add_child(crest(str(prox.op), 64)); b.get_child(0).size_flags_horizontal = Control.SIZE_SHRINK_CENTER; var bl = lbl(b, str(prox.op), 19, TXT, false); bl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	else: lbl(b, "A definir", 20, DIM, false)
func _chart(p, vals: Array, col: Color, hmin := 120) -> void:
	var ch = Chart.new(); ch.fnt = F_B; ch.vals = vals; ch.col = col; ch.labels = _rotulos_meses(vals.size()) if vals.size() >= 2 else []
	ch.custom_minimum_size.y = hmin; ch.size_flags_horizontal = Control.SIZE_EXPAND_FILL; ch.size_flags_vertical = Control.SIZE_EXPAND_FILL; p.add_child(ch)
func _p_perf(p) -> void:
	var S = O.S; var v = panel(p, "Desempenho da Organização", "chart")
	var pf: Array = S.get("perf", []); var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 22); h.size_flags_vertical = Control.SIZE_EXPAND_FILL; v.add_child(h)
	var l = vstack(h, 4, false); l.custom_minimum_size.x = 200
	var fm_ = O.forca_media(); lbl(l, "Força Geral", 21, DIM, false)
	var hf = hrow(l); hl(hf, "%.0f" % fm_, 58, TXT); var dlt: float = _delta_txt(pf)
	if absf(dlt) >= 0.05: hf.add_child(ico("up" if dlt > 0 else "down", 22, OK if dlt > 0 else BAD)); hl(hf, "%+.1f" % dlt, 24, OK if dlt > 0 else BAD)
	lbl(l, "Moral da Equipe", 21, DIM, false)
	var mo: float = _moral_geral(); var hm = hrow(l); hm.add_child(ico("mood", 30, OK if mo >= 55 else GOLD if mo >= 35 else BAD)); hl(hm, O.moral_rot(mo) if mo > 0 else "—", 30, OK if mo >= 55 else GOLD if mo >= 35 else BAD)
	if pf.size() >= 3: _chart(h, pf, ACC)
	else: lbl(h, "O gráfico aparece depois de algumas semanas de jogo.", 21, DIM)
func _p_fin(p) -> void:
	var S = O.S; var v = panel(p, "Situação Financeira", "coin", "Ver relatório", _ir(self, "fin"))
	hl(v, O.money(S.org.caixa), 54, OK if S.org.caixa >= 0 else BAD)
	var hist: Array = S.get("fin", []); var hs = hrow(v); lbl(hs, "Saldo Atual", 21, DIM, false)
	if hist.size() >= 2 and hist[0] != 0:
		var pct: float = (hist[hist.size() - 1] - hist[0]) / absf(float(hist[0])) * 100.0
		var pl = lbl(hs, "%+.1f%%" % pct, 21, OK if pct >= 0 else BAD, false); pl.size_flags_horizontal = Control.SIZE_FILL
	if hist.size() >= 3: _chart(v, hist, OK, 110)
	else: lbl(v, "O gráfico aparece depois de algumas semanas de jogo.", 21, DIM)
func _p_teams(p) -> void:
	var v = panel(p, "Nossas Equipes", "shield", "Ver todas as equipes", _ir(self, "elenco"))
	var gr = GridContainer.new(); gr.columns = 8 if wide else 2; gr.add_theme_constant_override("h_separation", 12); gr.add_theme_constant_override("v_separation", 12); v.add_child(gr)
	for g in O.GAMES:
		if not O.ativo(g): continue
		var ab: bool = O.aberto(g); var col: Color = GCOL.get(g, ACC)
		var b = Button.new(); b.custom_minimum_size = Vector2(0, 150 if wide else 168); b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var n = _sbf(Color("11122a"), 12, col if g == game and ab else LINE, 2 if g == game and ab else 1, 0); var hv = _sbf(Color("191a3a"), 12, col, 1, 0)
		for k in ["normal", "pressed"]: b.add_theme_stylebox_override(k, n)
		for k in ["hover", "hover_pressed"]: b.add_theme_stylebox_override(k, hv)
		b.pressed.connect(func():
			if ab: game = g; squad = "t1"; tab = "elenco"
			else: tab = "neg"
			render())
		var vb = VBoxContainer.new(); vb.set_anchors_preset(Control.PRESET_FULL_RECT); vb.alignment = BoxContainer.ALIGNMENT_CENTER; vb.add_theme_constant_override("separation", 4); vb.mouse_filter = Control.MOUSE_FILTER_IGNORE; b.add_child(vb)
		var ic = PanelContainer.new(); ic.custom_minimum_size = Vector2(64, 64); ic.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; ic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ic.add_theme_stylebox_override("panel", _sbf(Color(col.r, col.g, col.b, 0.18 if ab else 0.07), 16, col if ab else LINE, 2, 4)); vb.add_child(ic)
		var il = Label.new(); il.text = gname(g); il.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; il.vertical_alignment = VERTICAL_ALIGNMENT_CENTER; il.add_theme_font_size_override("font_size", 26); il.add_theme_color_override("font_color", col if ab else DIM); il.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if F_H != null: il.add_theme_font_override("font", F_H)
		ic.add_child(il)
		var q1 = O.S.games[g].squads.t1
		var sub: String = ("Time Principal" if q1.on else "Sem time") if ab else "Não aberto"
		var t2 = lbl(vb, sub, 18, DIM, false); t2.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; t2.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if ab and q1.on:
			var fo: float = O.forca(g, "t1"); var mb = MarginContainer.new(); mb.add_theme_constant_override("margin_left", 16); mb.add_theme_constant_override("margin_right", 16); mb.mouse_filter = Control.MOUSE_FILTER_IGNORE; vb.add_child(mb)
			var pb = thin(mb, fo, 100.0, col, 8); pb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		gr.add_child(b)
func _p_matches(p) -> void:
	var v = panel(p, "Próximas Partidas", "trophy", "Ver agenda", _ir(self, "cal"))
	var it: Array = _agenda_all(4).filter(func(a): return a.tipo != "ini")
	if it.is_empty(): lbl(v, "Nada agendado: complete os titulares de um time.", 21, DIM)
	for a in it.slice(0, 3 if wide else 4):
		var rw = PanelContainer.new(); rw.add_theme_stylebox_override("panel", _sbf(Color("11122a"), 10, null, 0, 8)); v.add_child(rw)
		var h = hrow(rw); h.add_theme_constant_override("separation", 12)
		var d = vstack(h, 0, false); d.custom_minimum_size.x = 86; hl(d, str(a.data.txt), 26, TXT); lbl(d, "em %d sem." % a.em, 17, DIM, false)
		h.add_child(crest(O.S.org.nome, 40)); hl(h, "VS", 18, DIM)
		if a.op != null: h.add_child(crest(str(a.op), 40))
		var nv = vstack(h, 0); var ol = lbl(nv, str(a.op) if a.op != null else str(a.label), 21, TXT, false); ol.clip_text = true; ol.custom_minimum_size.x = 40
		var ll = lbl(nv, "%s · %s" % [gname(a.g), str(a.label)], 16, DIM, false); ll.clip_text = true; ll.custom_minimum_size.x = 40
func _p_class(p) -> void:
	var v = panel(p, "Classificações", "chart")
	var gs = []
	for g in O.GAMES:
		if O.ativo(g) and O.aberto(g) and O.comp_for(g, "t1") != null: gs.append([g, gname(g)])
	if gs.is_empty(): lbl(v, "Crie um time para ver a classificação.", 21, DIM); return
	if cls_game == "" or not gs.any(func(x): return x[0] == cls_game): cls_game = gs[0][0]
	var f = HFlowContainer.new(); f.add_theme_constant_override("h_separation", 6); f.add_theme_constant_override("v_separation", 6); v.add_child(f)
	for it in gs:
		var b = Button.new(); b.text = it[1]; b.custom_minimum_size.y = 42; var on: bool = it[0] == cls_game
		var sn = _sbf(ACC if on else Color("14152b"), 9, null, 0, 8)
		for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, sn)
		b.add_theme_font_size_override("font_size", 21); b.pressed.connect(func(): cls_game = it[0]; render()); f.add_child(b)
	var c = O.comp_for(cls_game, "t1")
	if c.phase != "reg" and c.phase != "po":
		lbl(v, "Fase: " + {"off": "entressafra", "wait": "aguardando titulares", "intl": "internacional"}.get(c.phase, c.phase), 21, DIM); return
	var hd = hrow(v); lbl(hd, "#", 18, DIM, false).custom_minimum_size.x = 44; lbl(hd, "Time", 18, DIM); var hv = lbl(hd, "V-D", 18, DIM, false); hv.custom_minimum_size.x = 70; hv.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var cls: Array = O.classificacao(c); var shown = 0
	for r in cls:
		if shown >= 8 and not r.eu: continue
		shown += 1
		var rp = PanelContainer.new(); rp.add_theme_stylebox_override("panel", _sbf(Color(ACC.r, ACC.g, ACC.b, 0.35) if r.eu else Color(0, 0, 0, 0), 8, null, 0, 5)); v.add_child(rp)
		var h = hrow(rp); h.add_theme_constant_override("separation", 10)
		hl(h, str(r.pos), 24, TXT).custom_minimum_size.x = 34; h.add_child(crest(r.n, 30)); lbl(h, r.n, 21, TXT, false).size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var vd = hl(h, "%d-%d" % [r.w, r.l], 24, TXT); vd.custom_minimum_size.x = 70; vd.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
func _p_news(p) -> void:
	var v = panel(p, "Notícias", "news", "Ver todas", _ir(self, "noticias"))
	var fd: Array = O.S.get("feed", [])
	if fd.is_empty():
		for l in O.S.log.slice(0, 5): lbl(v, str(l), 21, DIM)
		return
	var head = fd[0]
	for x in fd.slice(0, 12):
		if x.i >= 2: head = x; break
	var hh = hrow(v); hh.add_theme_constant_override("separation", 14)
	var th = Hero.new(); th.round_r = 10.0; th.crowd = true; th.acc = GCOL.get(head.g, ACC) if head.g != "" else ACC; th.custom_minimum_size = Vector2(170, 116); hh.add_child(th)
	var ti = ico("trophy" if head.k == "titulo" else "star" if head.k == "talento" else "news", 54, Color(1, 1, 1, 0.9))
	var tc = CenterContainer.new(); tc.add_child(ti); th.add_child(tc)
	var tv = vstack(hh, 4); hl(tv, str(head.t), 25, TXT, true); lbl(tv, "S%d · %d" % [head.s, head.y], 18, DIM, false)
	var k = 0
	for x in fd:
		if x == head: continue
		k += 1
		if k > 3: break
		var r = hrow(v); r.add_theme_constant_override("separation", 12); r.add_child(ico("trophy" if x.k == "titulo" else "star" if x.k == "talento" else "news", 24, ACC2))
		var rv = vstack(r, 0); lbl(rv, str(x.t), 20, TXT); lbl(rv, "S%d · %d" % [x.s, x.y], 16, DIM, false)
func _p_contracts(p) -> void:
	var v = panel(p, "Contratos Importantes", "brief", "Ver todos", _ir(self, "elenco"))
	var lst = []
	for g in O.GAMES:
		if not O.aberto(g): continue
		for sq in ["t1", "t2"]:
			var sl = O.S.games[g].squads[sq].slots
			for i in sl.size():
				if sl[i] != null and not sl[i].get("estrela", false): lst.append({"g": g, "sq": sq, "i": i, "p": sl[i], "ct": int(sl[i].get("ct", O.CONTRATO))})
	lst.sort_custom(func(a, b): return a.ct < b.ct or (a.ct == b.ct and a.p.o > b.p.o))
	if lst.is_empty(): lbl(v, "Contrate jogadores para acompanhar contratos.", 21, DIM); return
	for x in lst.slice(0, 3 if wide else 4):
		var h = hrow(v); h.add_theme_constant_override("separation", 12); h.add_child(avatar(x.p.n, 46, x.g))
		var vv = vstack(h, 0); lbl(vv, x.p.n, 24, TXT, false); lbl(vv, "%s · %s" % [gname(x.g), "Titular" if x.i < O.nT(x.g) else "Reserva"], 17, DIM, false)
		var w: Dictionary = O.em_semanas(x.ct); var dd: Dictionary = O.data_de(w.semana, w.ano)
		var dl = lbl(h, "%s" % dd.txt, 19, DIM, false); dl.size_flags_horizontal = Control.SIZE_FILL
		var soon: bool = x.ct <= 26
		var b = Button.new(); b.text = "Renovar" if soon else "Em %d sem." % x.ct; b.custom_minimum_size = Vector2(118, 44)
		var cc: Color = OK if soon else GOLD
		var sn = _sbf(Color(cc.r, cc.g, cc.b, 0.22), 10, cc, 1, 6)
		for k in ["normal", "hover", "pressed", "hover_pressed"]: b.add_theme_stylebox_override(k, sn)
		for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color"]: b.add_theme_color_override(k, cc)
		b.add_theme_font_size_override("font_size", 21); b.pressed.connect(func(): ficha_slot(x.g, x.sq, x.i)); h.add_child(b)

# ---------- Início ----------
func vorg() -> void:
	var S = O.S; var prox = _prox_jogo()
	if wide:
		var r1 = _row(content); _p_hero(_col(r1, 2.6, 0), prox); _p_next(_col(r1, 1.2, 0), prox)
		var r2 = _row(content); _p_perf(_col(r2, 1.5, 0)); _p_fin(_col(r2, 1.0, 0))
		var r3 = _row(content)
		var lc = _col(r3, 2.0); _p_teams(lc)
		var r4 = _row(lc); _p_matches(_col(r4, 1.0, 0)); _p_class(_col(r4, 1.0, 0))
		var rc = _col(r3, 1.0); _p_news(rc); _p_contracts(rc)
		vdiretoria()
	else:
		var cp = panel(content, "", "", "", null)
		var hc = hrow(cp); _ctrl_buttons(hc)
		for b in hc.get_children(): b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_p_hero(content, prox); _p_next(content, prox); _p_perf(content); _p_fin(content); _p_teams(content); _p_matches(content); _p_class(content); _p_news(content); _p_contracts(content); vdiretoria()

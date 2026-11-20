// Cena "Time de eSports": da garagem ao estadio lotado. Só formas de canvas, sem imagens.
// Contrato (DESIGN.md 4.4): o[0..12] = Titular, Reserva, Coach, Treino tatico, Gaming house, Equipamento,
// Analista, Patrocinio, Canal, Psicologo, Fa-clube, Arena, Titulo.
(function () {
  var TAU = Math.PI * 2;
  var R = []; // aleatórios fixos (sem Math.random por frame)
  for (var q = 0; q < 256; q++) { var z = Math.sin(q * 12.9898 + 78.233) * 43758.5453; R.push(z - Math.floor(z)); }
  var SHIRT = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ec407a', '#8bc34a', '#00bcd4'];
  var SKIN = ['#f2c9a0', '#d9a273', '#a8764b', '#7b4f32', '#f5d5b8'];
  var HAIR = ['#2b1b10', '#111', '#6b3a1e', '#d8b04a', '#8a2be2'];
  var SCR = ['#1e88e5', '#43a047', '#8e24aa', '#f4511e', '#00acc1'];
  var SPN = ['Padaria do Zé', 'EnergiMax', 'TurboNet', 'Posto Sol', 'Mega Byte'];
  var SPC = ['#c0392b', '#16a085', '#2980b9', '#d35400', '#8e44ad'];
  var MSG = ['GG!', 'vai time!!', 'que jogada', 'MVP', 'kkkkk', 'clutch!', 'bora bora', 'insano', 'hype!!', 'toma!', 'ace!!', 'campeão'];
  var NICK = ['lia', 'bob', 'zeca', 'ana', 'tito', 'ju'];
  var NCOL = ['#ff8a80', '#80d8ff', '#ccff90', '#ffe57f', '#ea80fc', '#a7ffeb'];
  var CONF = ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#fff'];
  var BEAM = ['#7df9ff', '#ff5ec4', '#ffd54a', '#7dff8a'];
  var CROWD = ['#e57373', '#64b5f6', '#fff176', '#81c784', '#ba68c8'];
  var FLOOR = ['#3b3f4a', '#3a3560', '#2a2f52', '#171430', '#171430'];
  var BACKF = ['#2b2e38', '#2a2d4a', '#232b4a', '#14102e', '#1a1236'];
  var GR = [['#2a2d37', '#1c1f27'], ['#2d313c', '#1f232c'], ['#2f3350', '#1f2238'], ['#2f3a5c', '#1e2744'],
            ['#33406a', '#212b4d'], ['#2b4a66', '#1b3350'], ['#2a5878', '#1b4060']];
  var CAP = ['Time de várzea', 'Circuito regional', 'Liga nacional', 'Classificado pro Mundial', 'Lenda dos eSports'];
  var ARN = ['', 'Auditório alugado', 'Ginásio', 'Arena 5 mil', 'Arena 20 mil'];
  var VIEW = [0, 100, 1000, 10000, 100000, 1000000, 3000000];
  var TRC = ['#b0703a', '#c0c6cf', '#e6b422', '#ffd54a', '#7de3ff', '#fff3a0'];
  var TICK = 'MARCA GLOBAL  *  MEGA BYTE  *  TURBONET  *  ENERGIMAX  *  POSTO SOL  *  PADARIA DO ZÉ  *  ';
  var bt = -99, bx = 0, by = 0, bn = 0; // estado do burst

  function cl(v, mx) { v = Math.floor(+v); return v > 0 ? (v > mx ? mx : v) : 0; } // NaN, negativo, > max e Infinity seguros
  function fmt(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' mi';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace('.', ',') + ' mil';
    return String(Math.floor(v));
  }
  function txt(ctx, s, x, y, font, col, al) { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); }
  function circ(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function star(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(x - s, y - 0.5, s * 2, 1); ctx.fillRect(x - 0.5, y - s, 1, s * 2); }

  // Titular sentado no setup. on=false: cadeira vazia (fantasma). eq 0..5, sp 0..6, live: streamer do time.
  function player(ctx, i, x, k, t, gy, on, eq, sp, live) {
    var sh = SHIRT[i % 10], sk = SKIN[(i * 3) % 5], b = Math.sin(t * 14 + i * 1.7), rg = BEAM[(Math.floor(t * 3) + i) % 4];
    ctx.save(); ctx.translate(x, gy); ctx.scale(k, k);
    if (!on) ctx.globalAlpha = 0.22;
    if (on && eq >= 5) { ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 3 + i); ctx.fillStyle = rg; ctx.fillRect(-18, -34, 36, 40); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#222'; ctx.fillRect(-10, -12, 13, 2);              // cadeira
    ctx.fillRect(-11, -26, 2, 15);
    ctx.fillStyle = '#223'; ctx.fillRect(-6, -11, 4, 11); ctx.fillRect(-1, -11, 4, 11); // pernas
    if (on) {
      ctx.fillStyle = sh; ctx.fillRect(-8, -29, 10, 15);                // torso
      if (sp > 0) { ctx.fillStyle = SPC[i % Math.min(5, sp)]; ctx.fillRect(-7, -27, 8, 4); ctx.fillStyle = '#fff'; ctx.fillRect(-6, -26, 4, 1); } // logo na camisa
      circ(ctx, -3, -33, 4, sk);
      ctx.fillStyle = HAIR[(i * 2) % 5]; ctx.fillRect(-7, -38, 8, 3);
      if (eq >= 3) { // headset
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-3, -34, 5, Math.PI, TAU); ctx.stroke();
        ctx.fillStyle = eq >= 5 ? rg : '#d33'; ctx.fillRect(-9, -35, 3, 5); ctx.fillStyle = '#111'; ctx.fillRect(-9, -31, 5, 1);
      }
    }
    ctx.fillStyle = '#6b4f33'; ctx.fillRect(-14, -14, 28, 3);           // mesa
    ctx.fillRect(-13, -11, 2, 11); ctx.fillRect(11, -11, 2, 11);
    if (on && eq >= 5) { ctx.fillStyle = rg; ctx.fillRect(-14, -11, 28, 1); } // LED RGB na mesa
    var big = eq >= 4;
    ctx.fillStyle = '#111'; ctx.fillRect(big ? 1 : 2, big ? -29 : -26, big ? 14 : 12, big ? 12 : 9); ctx.fillRect(7, -17, 2, 3); // monitor
    if (on) {
      ctx.fillStyle = SCR[i % 5]; ctx.fillRect(big ? 2 : 3, big ? -28 : -25, big ? 12 : 10, big ? 10 : 7);
      ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff';
      ctx.fillRect(4, -24, 3 + (b + 1) * 2, 1); ctx.fillRect(4, -22, 2 + (Math.sin(t * 9 + i) + 1) * 3, 1);
      ctx.globalAlpha = 1;
      if (eq >= 5) { ctx.fillStyle = rg; ctx.fillRect(1, big ? -30 : -27, 14, 1); }
    } else { ctx.fillStyle = '#0a0a0e'; ctx.fillRect(3, -25, 10, 7); }
    ctx.fillStyle = eq >= 5 ? rg : eq >= 2 ? '#7a8cff' : '#444'; ctx.fillRect(-6, -15.5, 11, 1.5); // teclado (mecânico/RGB)
    if (eq >= 1) { ctx.fillStyle = '#ccc'; ctx.fillRect(7, -15.5, 3, 2); ctx.strokeStyle = '#999'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(10, -14.5); ctx.lineTo(13, -14); ctx.stroke(); } // mouse
    if (on) { ctx.fillStyle = sk; ctx.fillRect(-3, -16 + b, 4, 2); ctx.fillRect(1, -16 - b, 4, 2); } // mãos digitando
    if (live) { // ring light + câmera do streamer
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(-3, -33, 9, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#222'; ctx.fillRect(-8, -48, 10, 6); circ(ctx, -3, -45, 2, '#6cf');
      if (Math.sin(t * 4) > 0) circ(ctx, 0, -47, 1, '#f33');
    }
    ctx.restore();
  }

  function reserve(ctx, i, x, gy, t) { // reserva de colete no banco
    var nod = Math.sin(t * 1.6 + i * 2);
    ctx.save(); ctx.translate(x, gy);
    ctx.fillStyle = '#223'; ctx.fillRect(-3, -13, 10, 3); ctx.fillRect(5, -11, 3, 11);
    ctx.fillStyle = SHIRT[(i * 4 + 2) % 10]; ctx.fillRect(-4, -28, 9, 16);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(-4, -28, 9, 14); ctx.fillStyle = '#c9a100'; ctx.fillRect(-1, -28, 3, 14); // colete
    circ(ctx, 0.5, -32 + nod * 0.4, 3.6, SKIN[(i * 2 + 1) % 5]);
    ctx.fillStyle = HAIR[(i + 3) % 5]; ctx.fillRect(-3, -37 + nod * 0.4, 7, 3);
    ctx.fillStyle = SKIN[(i * 2 + 1) % 5]; ctx.fillRect(3, -22, 6, 2);
    if (i === 0) { ctx.fillStyle = '#111'; ctx.fillRect(8, -24, 3, 5); ctx.fillStyle = '#6cf'; ctx.fillRect(9, -23, 1, 3); } // celular
    ctx.restore();
  }

  function coach(ctx, x, gy, t) {
    var bob = Math.sin(t * 2);
    ctx.save(); ctx.translate(x, gy); ctx.scale(1.1, 1.1);
    ctx.fillStyle = '#2b2f45'; ctx.fillRect(-5, -14, 4, 14); ctx.fillRect(1, -14, 4, 14);
    ctx.fillStyle = '#1f6feb'; ctx.fillRect(-7, -32, 14, 18); ctx.fillStyle = '#fff'; ctx.fillRect(-1, -32, 2, 18);
    circ(ctx, 0, -37, 5, SKIN[1]); ctx.fillStyle = '#c0392b'; ctx.fillRect(-5, -44, 10, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(-17, -30 + bob, 9, 12); ctx.fillStyle = '#888'; ctx.fillRect(-15, -27 + bob, 5, 1); ctx.fillRect(-15, -24 + bob, 5, 1); // prancheta
    ctx.strokeStyle = '#1f6feb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, -30); ctx.lineTo(11 + bob * 2, -42); ctx.stroke();
    ctx.restore();
  }

  function analyst(ctx, x, yb, t) { // mesinha com notebook e gráficos
    var i;
    ctx.fillStyle = '#5b4a3a'; ctx.fillRect(x - 24, yb - 14, 48, 3); ctx.fillRect(x - 22, yb - 11, 2, 11); ctx.fillRect(x + 20, yb - 11, 2, 11);
    ctx.fillStyle = '#3a3d4a'; ctx.fillRect(x + 5, yb - 32, 12, 18); // costas da cadeira/torso
    ctx.fillStyle = '#6a7a99'; ctx.fillRect(x + 4, yb - 30, 12, 16);
    circ(ctx, x + 10, yb - 36, 4.5, SKIN[2]); ctx.fillStyle = HAIR[1]; ctx.fillRect(x + 5, yb - 42, 10, 3);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.strokeRect(x + 6, yb - 37, 3, 2.5); // óculos
    ctx.fillStyle = '#222'; ctx.fillRect(x - 21, yb - 32, 22, 18); ctx.fillStyle = '#0d2a40'; ctx.fillRect(x - 19, yb - 30, 18, 14);
    for (i = 0; i < 5; i++) { ctx.fillStyle = i & 1 ? '#4fc3f7' : '#69f0ae'; var bh = 3 + (Math.sin(t * 2 + i * 1.3) + 1) * 3.5; ctx.fillRect(x - 17 + i * 3.4, yb - 17 - bh, 2.4, bh); }
    ctx.fillStyle = '#eee'; ctx.fillRect(x + 20 - 8, yb - 17, 7, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x + 12, yb - 19, 4, 5); // papeis e caneca
  }

  function psych(ctx, x, yb, t) { // sofá com psicólogo e caderno
    ctx.fillStyle = '#6a4f2f'; ctx.fillRect(x + 42, yb - 12, 7, 12); ctx.fillStyle = '#2e7d32'; // vaso
    circ(ctx, x + 45.5, yb - 17 + Math.sin(t * 1.5) * 0.5, 6, '#2e7d32'); circ(ctx, x + 41, yb - 14, 4, '#43a047');
    ctx.fillStyle = '#7a4a6a'; ctx.fillRect(x, yb - 28, 40, 14);        // encosto
    ctx.fillStyle = '#8d5a7c'; ctx.fillRect(x - 3, yb - 20, 5, 20); ctx.fillRect(x + 38, yb - 20, 5, 20); ctx.fillRect(x, yb - 14, 40, 10);
    circ(ctx, x + 20, yb - 33, 4.5, SKIN[3]); ctx.fillStyle = '#3c2a1c'; ctx.fillRect(x + 16, yb - 39, 9, 3);
    ctx.fillStyle = '#e8e1c8'; ctx.fillRect(x + 14, yb - 29, 12, 13);   // jaleco
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 23, yb - 23, 8, 6); ctx.fillStyle = '#555'; ctx.fillRect(x + 24, yb - 21, 5, 1); // caderno
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 27, yb - 19); ctx.lineTo(x + 29 + Math.sin(t * 3) * 1.2, yb - 21); ctx.stroke();
  }

  function facade(ctx, h, x0, yb, t) { // gaming house por nível 1..6
    var i, j, y, lit;
    if (h <= 0) return;
    if (h === 1) { // garagem do tio
      ctx.fillStyle = '#4a4e5a'; ctx.fillRect(x0 + 2, yb - 36, 54, 36); ctx.fillStyle = '#2f323b'; ctx.fillRect(x0, yb - 40, 58, 5);
      ctx.fillStyle = '#14161c'; ctx.fillRect(x0 + 8, yb - 30, 42, 30);
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(x0 + 14, yb - 20, 10, 8); ctx.fillRect(x0 + 32, yb - 20, 10, 8); ctx.globalAlpha = 1;
      ctx.fillStyle = '#8a8f99'; ctx.fillRect(x0 + 8, yb - 30, 42, 12); ctx.fillStyle = '#5d626c';
      for (i = 0; i < 3; i++) ctx.fillRect(x0 + 8, yb - 27 + i * 4, 42, 1);
    } else if (h === 2) { // apê alugado
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(x0 + 4, yb - 56, 50, 56); ctx.fillStyle = '#5d4037'; ctx.fillRect(x0 + 2, yb - 59, 54, 4);
      for (j = 0; j < 3; j++) for (k2 = 0; k2 < 2; k2++) {
        lit = R[(j * 2 + k2) * 7 & 255] > 0.3; y = yb - 52 + j * 17;
        ctx.globalAlpha = lit ? 0.8 + 0.2 * Math.sin(t * 2 + j + k2) : 1; ctx.fillStyle = lit ? '#ffe27a' : '#2a2030'; ctx.fillRect(x0 + 10 + k2 * 22, y, 14, 10); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#3e2723'; ctx.fillRect(x0 + 24, yb - 10, 10, 10);
    } else if (h === 3 || h === 4) { // casa de 2 andares (4: com chef)
      ctx.fillStyle = '#d7c6a5'; ctx.fillRect(x0 + 2, yb - 44, 54, 44);
      ctx.fillStyle = '#7a2e3a'; ctx.beginPath(); ctx.moveTo(x0 - 3, yb - 44); ctx.lineTo(x0 + 29, yb - 62); ctx.lineTo(x0 + 61, yb - 44); ctx.fill();
      for (k2 = 0; k2 < 2; k2++) { ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 2 + k2); ctx.fillStyle = '#ffe27a'; ctx.fillRect(x0 + 8 + k2 * 28, yb - 38, 14, 10); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#3e2723'; ctx.fillRect(x0 + 24, yb - 14, 10, 14);
      if (h === 3) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(x0 + 8, yb - 22, 12, 10); ctx.fillRect(x0 + 38, yb - 22, 12, 10); }
      else { // janela da cozinha com chef e vapor
        ctx.fillStyle = '#fff3d0'; ctx.fillRect(x0 + 6, yb - 24, 16, 13);
        ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 10, yb - 24, 8, 3); circ(ctx, x0 + 14, yb - 19, 3, SKIN[0]); ctx.fillRect(x0 + 10, yb - 16, 8, 5);
        ctx.fillStyle = '#ffe27a'; ctx.fillRect(x0 + 38, yb - 22, 12, 10);
        for (i = 0; i < 3; i++) { ctx.globalAlpha = 0.5 * (1 - ((t * 0.8 + i / 3) % 1)); circ(ctx, x0 + 24 + Math.sin(t + i) * 2, yb - 26 - ((t * 0.8 + i / 3) % 1) * 12, 2.2, '#fff'); }
        ctx.globalAlpha = 1; ctx.fillStyle = '#c0392b'; ctx.fillRect(x0 + 4, yb - 27, 20, 3);
      }
    } else { // 5 CT / 6 CT com academia
      var ht = h === 6 ? 70 : 56;
      ctx.fillStyle = '#1c2a44'; ctx.fillRect(x0, yb - ht, 58, ht); ctx.fillStyle = '#0f1a30'; ctx.fillRect(x0 - 2, yb - ht - 3, 62, 4);
      for (j = 0; j < (h === 6 ? 3 : 2); j++) for (k2 = 0; k2 < 3; k2++) {
        ctx.globalAlpha = 0.7 + 0.25 * Math.sin(t * 1.5 + j * 2 + k2); ctx.fillStyle = '#6fd8ff'; ctx.fillRect(x0 + 5 + k2 * 17, yb - ht + 8 + j * 17, 12, 11); ctx.globalAlpha = 1;
      }
      txt(ctx, 'CT', x0 + 29, yb - 3, 'bold 9px sans-serif', '#7df9ff', 'center');
      ctx.fillStyle = '#888'; ctx.fillRect(x0 + 46, yb - ht - 12, 1, 9); circ(ctx, x0 + 46.5, yb - ht - 12, 1.5, Math.sin(t * 4) > 0 ? '#f33' : '#733');
      if (h === 6) { // academia: esteira com atleta na janela de baixo
        ctx.fillStyle = '#ffe27a'; ctx.fillRect(x0 + 5, yb - 24, 48, 14); ctx.fillStyle = '#333'; ctx.fillRect(x0 + 8, yb - 13, 20, 2);
        var ru = Math.sin(t * 9); circ(ctx, x0 + 18, yb - 21, 2.5, SKIN[1]); ctx.fillStyle = '#e74c3c'; ctx.fillRect(x0 + 16, yb - 19, 4, 5);
        ctx.fillStyle = '#223'; ctx.fillRect(x0 + 16 + ru * 2, yb - 14, 2, 3); ctx.fillRect(x0 + 18 - ru * 2, yb - 14, 2, 3);
        ctx.fillStyle = '#111'; ctx.fillRect(x0 + 34, yb - 19, 12, 2); ctx.fillRect(x0 + 33, yb - 21, 3, 6); ctx.fillRect(x0 + 44, yb - 21, 3, 6); // halter
      }
    }
  }
  var k2 = 0;

  function spark(ctx, t) {
    var d = t - bt; if (d < 0 || d > 1) return;
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * TAU + R[i], sp = 60 + R[i + 20] * 70;
      ctx.globalAlpha = 1 - d; ctx.fillStyle = CONF[i % 6];
      ctx.fillRect(bx + Math.cos(a) * sp * d - 1.5, by + Math.sin(a) * sp * d + 90 * d * d - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function trophy(ctx, x, yb, s, col, t, i) {
    ctx.save(); ctx.translate(x, yb); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(5, -14); ctx.quadraticCurveTo(5, -6, 0, -5); ctx.quadraticCurveTo(-5, -6, -5, -14); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-6, -11, 2.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(6, -11, 2.5, 0, TAU); ctx.stroke();
    ctx.fillRect(-1, -5, 2, 3); ctx.fillStyle = '#5a4300'; ctx.fillRect(-4, -2, 8, 2);
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; ctx.fillRect(-3, -13, 1.5, 5); ctx.globalAlpha = 1;
    ctx.restore();
    if (Math.sin(t * 3 + i * 2) > 0.8) star(ctx, x + 4, yb - 14 * s, 2, '#fff');
  }

  SCENES.esp = {
    h: 230,
    draw: function (ctx, W, H, o, t) {
      o = o || [];
      var a = cl(o[0], 5), rs = cl(o[1], 2), ch = cl(o[2], 1), tr = cl(o[3], 6), h = cl(o[4], 6), eq = cl(o[5], 5),
          an = cl(o[6], 1), sp = cl(o[7], 6), cn = cl(o[8], 6), ps = cl(o[9], 1), fc = cl(o[10], 6), ar = cl(o[11], 4), ti = cl(o[12], 6);
      var gy = H - 46, cx = W / 2, i, j, k, g, x, y, id;
      var tier = ti > 0 ? 4 : ar > 0 ? 3 : sp > 0 ? 2 : ch > 0 ? 1 : 0;
      var YB = 128; // linha de base do cenário de fundo

      // ---- fundo ----
      g = ctx.createLinearGradient(0, 0, 0, gy);
      if (ar > 0) { g.addColorStop(0, '#0a0620'); g.addColorStop(1, '#1d1148'); }
      else { g.addColorStop(0, GR[h][0]); g.addColorStop(1, GR[h][1]); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy);
      if (ar === 0 && h <= 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.16; for (i = 0; i < 5; i++) ctx.fillRect(0, i * 6, W, 1); ctx.globalAlpha = 1; }

      // ---- arquibancada (arena própria 1..4) ----
      if (ar > 0) {
        var rows = [0, 2, 3, 4, 6][ar], nx = Math.floor((W - 6) / 7), fr = [0, 0.35, 0.6, 0.8, 0.96][ar];
        ctx.fillStyle = '#120c2e'; ctx.fillRect(0, YB - 4 - (rows - 1) * 9 - 8, W, (rows - 1) * 9 + 12);
        if (ar === 1) { ctx.fillStyle = '#8e1b2c'; ctx.fillRect(0, 20, 16, YB - 20); ctx.fillRect(W - 16, 20, 16, YB - 20); ctx.fillStyle = '#6d1422'; for (i = 0; i < 3; i++) { ctx.fillRect(3 + i * 5, 20, 1, YB - 20); ctx.fillRect(W - 13 + i * 5, 20, 1, YB - 20); } }
        if (ar === 2) for (i = 0; i < 6; i++) { ctx.fillStyle = SPC[i % 5]; ctx.fillRect(W * (i + 0.5) / 6 - 7, 0, 14, 20 + (i & 1) * 6); }
        for (j = 0; j < rows; j++) {
          y = YB - 4 - j * 9;
          for (k = 0; k < nx; k++) {
            id = (j * 80 + k) & 255;
            if (R[id] > fr) continue;
            var dy = fc > 0 ? Math.abs(Math.sin(t * 5 + k * 0.7 + j)) * 2.5 : Math.sin(t * 1.5 + k) * 0.6;
            ctx.fillStyle = CROWD[Math.floor(R[(id * 7) & 255] * 5)];
            ctx.fillRect(3 + k * 7 + (j & 1) * 3, y - dy, 4, 5);
            if (R[(id * 3) & 255] > 0.95 && Math.sin(t * 8 + id) > 0.85) { ctx.fillStyle = '#fff'; ctx.fillRect(3 + k * 7 + (j & 1) * 3, y - dy - 3, 2, 2); }
          }
        }
        if (ar >= 3) {
          ctx.fillStyle = '#2b2650'; ctx.fillRect(0, 0, W, 3);
          var nb = ar === 3 ? 3 : 6;
          for (i = 0; i < nb; i++) {
            var b0 = W * (i + 0.5) / nb, tx = b0 + Math.sin(t * 1.1 + i * 2.1) * W * 0.25;
            ctx.globalAlpha = 0.11; ctx.fillStyle = BEAM[i % 4];
            ctx.beginPath(); ctx.moveTo(b0 - 3, 3); ctx.lineTo(b0 + 3, 3); ctx.lineTo(tx + 22, gy); ctx.lineTo(tx - 22, gy); ctx.fill();
            ctx.globalAlpha = 1; circ(ctx, b0, 4, 3, BEAM[i % 4]);
          }
        }
      }

      // ---- chão de trás + gaming house ----
      ctx.fillStyle = BACKF[tier]; ctx.fillRect(0, YB, W, gy - YB);
      ctx.fillStyle = '#000'; ctx.globalAlpha = 0.22; ctx.fillRect(0, YB, W, 2); ctx.globalAlpha = 1;
      facade(ctx, h, 6, YB, t);
      if (h === 0) { // sem casa: lâmpada pelada e pôster
        var bxx = W * 0.55, sw2 = Math.sin(t * 1.5) * 3;
        ctx.fillStyle = '#888'; ctx.fillRect(bxx, 0, 1, 16);
        ctx.globalAlpha = 0.07; ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(bxx + sw2, 18); ctx.lineTo(bxx + sw2 - 45, gy); ctx.lineTo(bxx + sw2 + 45, gy); ctx.fill(); ctx.globalAlpha = 1;
        circ(ctx, bxx + sw2, 18, 3, '#ffe27a');
        if (tr === 0 && ti === 0) { ctx.fillStyle = '#e8d9a8'; ctx.fillRect(cx - 18, 52, 36, 46); circ(ctx, cx, 70, 9, '#c0392b'); txt(ctx, 'TIME', cx, 90, 'bold 8px sans-serif', '#333', 'center'); }
      }

      // ---- bandeirinhas (fã-clube) ----
      if (fc > 0) {
        var nf = fc * 5;
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(cx, 18, W, 2); ctx.stroke();
        for (i = 0; i < nf; i++) {
          var u = (i + 0.5) / nf; x = u * W; y = 2 + 8 * (1 - (2 * u - 1) * (2 * u - 1)) + Math.sin(t * 3 + i) * 0.8;
          ctx.fillStyle = CONF[i % 5]; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 8); ctx.fill();
        }
      }

      // ---- patrocinadores: min(n,5) logos; 6 = marca global no telão ----
      var ns = Math.min(5, sp);
      if (ns > 0) {
        var bw = Math.min(62, (W - 12) / ns - 4);
        for (i = 0; i < ns; i++) {
          x = cx - ns * (bw + 4) / 2 + i * (bw + 4) + 2; y = 24 + Math.sin(t * 2 + i) * 0.8;
          ctx.fillStyle = '#999'; ctx.fillRect(x + 3, 19, 1, 5); ctx.fillRect(x + bw - 4, 19, 1, 5);
          ctx.fillStyle = SPC[i]; ctx.fillRect(x, y, bw, 13);
          txt(ctx, SPN[i], x + bw / 2, y + 9.5, 'bold 7px sans-serif', '#fff', 'center');
        }
      }
      if (sp >= 6) {
        ctx.fillStyle = '#05030f'; ctx.fillRect(0, 39, W, 11); ctx.fillStyle = '#ffd54a'; ctx.fillRect(0, 39, W, 1); ctx.fillRect(0, 49, W, 1);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 39, W, 11); ctx.clip();
        txt(ctx, TICK, W - (t * 40) % (W + 330), 48, 'bold 8px sans-serif', '#ffd54a', 'left');
        ctx.restore();
      }

      // ---- zona central: treino tático (quadro/telões) e estante de troféus ----
      var zx0 = 72, zx1 = W - 96, zw = Math.max(60, zx1 - zx0), zc = zx0 + zw / 2, ty = sp >= 6 ? 54 : 42, bh = 44;
      if (tr > 0) {
        var wl = tr >= 3 ? zw * 0.46 : zw, nsc = tr >= 5 ? 3 : tr >= 4 ? 2 : tr >= 3 ? 1 : 0, sbh = tr >= 6 ? 32 : bh;
        ctx.fillStyle = '#caa56a'; ctx.fillRect(zx0 - 2, ty - 2, wl + 4, sbh + 4);
        ctx.fillStyle = '#1f5a3a'; ctx.fillRect(zx0, ty, wl, sbh);
        ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff'; ctx.fillRect(zx0 + wl / 2, ty, 1, sbh); ctx.globalAlpha = 1;
        txt(ctx, 'TÁTICA', zx0 + 3, ty + 8, '6px sans-serif', '#cfe', 'left');
        var nd = tr >= 2 ? 8 : 4, p0x = 0, p0y = 0;
        for (j = 0; j < nd; j++) {
          x = zx0 + 6 + R[(j * 5) & 255] * (wl - 12) + Math.sin(t * 0.9 + j) * 3; y = ty + 12 + R[(j * 5 + 1) & 255] * (sbh - 18) + Math.cos(t * 0.8 + j) * 2;
          circ(ctx, x, y, 2.3, j & 1 ? '#4fc3f7' : '#ff5252');
          if (j === 0) { p0x = x; p0y = y; }
          if (tr >= 2 && (j === 2 || j === 5)) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p0x, p0y); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1; p0x = x; p0y = y; }
        }
        if (nsc > 0) { // telas de VOD review
          var wr = zw - wl - 6, sw = wr / nsc - 2;
          for (i = 0; i < nsc; i++) {
            var sx = zx0 + wl + 6 + i * (sw + 2);
            ctx.fillStyle = '#111'; ctx.fillRect(sx, ty, sw, 26); ctx.fillStyle = SCR[(i + 1) % 5]; ctx.fillRect(sx + 1, ty + 1, sw - 2, 20);
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.7; circ(ctx, sx + 4 + ((t * 8 + i * 9) % (sw - 8)), ty + 6 + R[(i * 9) & 255] * 8 + Math.sin(t * 2 + i) * 2, 1.5, '#fff'); ctx.globalAlpha = 1;
            ctx.fillStyle = '#333'; ctx.fillRect(sx + 1, ty + 22, sw - 2, 3); ctx.fillStyle = '#f33'; ctx.fillRect(sx + 1, ty + 22, (sw - 2) * (((t * 0.1 + i * 0.3) % 1)), 3);
          }
        }
        if (tr >= 6) { // placar de scrim
          ctx.fillStyle = '#05030f'; ctx.fillRect(zx0, ty + 34, zw, 10);
          txt(ctx, 'SCRIM ' + (13 + Math.floor(t / 9) % 3) + ' x 7  ·  dieta e sono OK', zc, ty + 42, 'bold 7px sans-serif', '#9fe', 'center');
        }
      }
      if (ti > 0) { // estante de troféus
        var sy = YB - 2, tsp = Math.min(22, (zw - 4) / 6), tx0 = zc - tsp * 3 + tsp / 2;
        ctx.fillStyle = '#4a3320'; ctx.fillRect(zc - tsp * 3 - 2, sy, tsp * 6 + 4, 3);
        for (i = 0; i < ti; i++) {
          if (i === 5) { g = ctx.createRadialGradient(tx0 + i * tsp, sy - 10, 1, tx0 + i * tsp, sy - 10, 24); g.addColorStop(0, '#ffe27a'); g.addColorStop(1, 'rgba(255,200,50,0)'); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3); ctx.fillStyle = g; ctx.fillRect(tx0 + i * tsp - 24, sy - 34, 48, 48); ctx.globalAlpha = 1; }
          trophy(ctx, tx0 + i * tsp, sy, i === 5 ? 1.35 : 1, TRC[i], t, i);
        }
        if (ti >= 6 && Math.sin(t * 6) > -0.3) txt(ctx, 'CAMPEÃO MUNDIAL', zc, sy - 22, 'bold 8px sans-serif', '#ffd54a', 'center');
      }

      // ---- canal do time ----
      if (cn > 0) {
        var cxp = W - 92, cyp = 54, rws = Math.min(5, 1 + cn), ph = 14 + rws * 10, vv = VIEW[cn] * (0.92 + 0.08 * Math.sin(t * 1.3));
        ctx.globalAlpha = 0.9; ctx.fillStyle = '#14101f'; ctx.fillRect(cxp, cyp, 84, ph); ctx.globalAlpha = 1;
        ctx.fillStyle = cn >= 6 ? '#1a6fb0' : '#6a2bd9'; ctx.fillRect(cxp, cyp, 84, 12);
        if (cn >= 5) { ctx.strokeStyle = cn >= 6 ? '#7df9ff' : '#ffd54a'; ctx.lineWidth = 1.5; ctx.strokeRect(cxp, cyp, 84, ph); }
        if (Math.sin(t * 4) > -0.2) circ(ctx, cxp + 6, cyp + 6, 2.2, '#f33');
        txt(ctx, 'AO VIVO', cxp + 11, cyp + 9, 'bold 7px sans-serif', '#fff', 'left');
        txt(ctx, fmt(vv), cxp + 81, cyp + 9, 'bold 7px sans-serif', '#fff', 'right');
        if (cn >= 6) { ctx.fillStyle = '#7df9ff'; ctx.beginPath(); ctx.moveTo(cxp + 46, cyp + 3); ctx.lineTo(cxp + 50, cyp + 3); ctx.lineTo(cxp + 52, cyp + 6); ctx.lineTo(cxp + 48, cyp + 10); ctx.lineTo(cxp + 44, cyp + 6); ctx.fill(); }
        ctx.save(); ctx.beginPath(); ctx.rect(cxp, cyp + 12, 84, ph - 12); ctx.clip();
        var sc = t * 1.5, ix = Math.floor(sc), fx = sc - ix;
        for (k = 0; k < rws; k++) {
          var m = (ix + k) % 12, yy = cyp + 22 + k * 10 - fx * 10;
          txt(ctx, NICK[m % 6], cxp + 3, yy, 'bold 7px sans-serif', NCOL[m % 6], 'left');
          txt(ctx, MSG[m], cxp + 27, yy, '7px sans-serif', '#ddd', 'left');
        }
        ctx.restore();
      }

      // ---- chão ----
      ctx.fillStyle = FLOOR[tier]; ctx.fillRect(0, gy, W, H - gy);
      ctx.globalAlpha = 0.1; ctx.fillStyle = '#fff'; for (x = 0; x < W; x += 24) ctx.fillRect(x, gy, 1, H - gy); ctx.globalAlpha = 1;
      if (ar > 0) { for (i = 0; i < 12; i++) { ctx.fillStyle = BEAM[(i + Math.floor(t * 3)) % 4]; ctx.fillRect(i * W / 12, gy, W / 12 - 1, 2); } }
      else { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.25; ctx.fillRect(0, gy, W, 2); ctx.globalAlpha = 1; }

      // ---- legenda ----
      ctx.globalAlpha = 0.8; txt(ctx, CAP[tier] + (ar > 0 ? '  |  ' + ARN[ar] : ''), cx, gy + 9, 'bold 7px sans-serif', '#fff', 'center'); ctx.globalAlpha = 1;

      // ---- torcida da frente (fã-clube) ----
      var m2 = fc * 2, fx0 = 76, fx1 = W - 66;
      for (i = 0; i < m2; i++) {
        x = fx0 + (fx1 - fx0) * (i + 1) / (m2 + 1); y = H - 3 - Math.abs(Math.sin(t * 5 + i * 1.3)) * (fc >= 4 ? 11 : 8);
        ctx.fillStyle = SHIRT[(i + 3) % 10]; ctx.fillRect(x - 4, y - 12, 8, 12);
        circ(ctx, x, y - 16, 4, SKIN[i % 5]);
        ctx.strokeStyle = SKIN[i % 5]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, y - 10); ctx.lineTo(x - 7, y - 21); ctx.stroke();
        if (!(i & 1)) { ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y - 10); ctx.lineTo(x + 7, y - 26); ctx.stroke(); ctx.fillStyle = SHIRT[i % 10]; ctx.fillRect(x + 7, y - 26, 8, 5); }
      }
      if (fc >= 6) { for (i = 0; i < 2; i++) { x = i ? fx1 + 6 : fx0 - 6; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 7 + i); circ(ctx, x, H - 14, 10, '#ff3d3d'); ctx.globalAlpha = 1; circ(ctx, x, H - 14, 2.5, '#ffd0d0'); } } // sinalizadores

      // ---- staff da frente ----
      if (an > 0) analyst(ctx, 36, H - 4, t);
      if (ps > 0) psych(ctx, W - 60, H - 4, t);

      // ---- coach (um só), banco com reservas e titulares ----
      var RZ = 76, px0 = 6, px1 = W - RZ;
      if (ch > 0) coach(ctx, W - 16, gy, t);
      var bx0 = W - 70; // banco de reservas
      ctx.fillStyle = '#6b4f33'; ctx.fillRect(bx0, gy - 12, 38, 3); ctx.fillRect(bx0 + 2, gy - 9, 2, 9); ctx.fillRect(bx0 + 34, gy - 9, 2, 9);
      for (i = 0; i < rs; i++) reserve(ctx, i, bx0 + 10 + i * 17, gy, t);
      var s = Math.min(40, (px1 - px0) / 5), st0 = px0 + ((px1 - px0) - s * 5) / 2, kk = Math.min(1.2, (s - 4) / 28);
      for (i = 0; i < 5; i++) player(ctx, i, st0 + s * (i + 0.5), kk, t, gy, i < a, eq, sp, cn > 0 && i === 0 && a > 0);

      // ---- brilho e confetes do título ----
      if (ti >= 4) {
        var nc = 16 + (ti - 3) * 12;
        for (i = 0; i < nc; i++) {
          x = R[(i * 3) & 255] * W + Math.sin(t * 1.7 + i) * 10;
          y = ((t * (28 + R[(i * 5) & 255] * 30) + R[(i * 7) & 255] * (H + 30)) % (H + 30)) - 15;
          ctx.fillStyle = CONF[i % 6]; ctx.fillRect(x, y, 1.5 + Math.abs(Math.cos(t * 4 + i)) * 4, 3);
        }
      }
      spark(ctx, t);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    },
    burst: function (ctx, W, H, t) {
      bt = t; bx = W * (0.25 + 0.5 * R[bn & 255]); by = H * 0.45; bn++;
      spark(ctx, t);
    }
  };
})();

// Cena "Time de eSports": da garagem ao estadio lotado. Só formas de canvas, sem imagens.
// Contrato (DESIGN.md 4.4): o[0..13] = Titular, Reserva, Coach, Treino tatico, Gaming house, Equipamento,
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
  var MSG = ['GG!', 'vai time!!', 'gank mid!', 'MVP', 'kkkkk', 'clutch!', 'bora baron', 'sem flash', 'hype!!', 'dragão!', 'pentakill', 'campeão'];
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
  // Tema LoL (somente jargão/ambientação; formas genéricas): funções TOP, JNG, MID, ADC, SUP
  var RC = ['#e5534b', '#3fb950', '#58a6ff', '#f0a030', '#b07cf0'];
  var ROLEIX = { TOP: 0, JNG: 1, MID: 2, ADC: 3, SUP: 4 };
  var TB = ['#4a5a78', '#5aa9e6', '#6fd8a0', '#ffd54a', '#ff9f5a']; // moldura do telão por tier
  var FLC = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#ecf0f1', '#9b59b6'];
  var TWS = []; for (var q2 = 0; q2 <= 11; q2++) TWS.push(q2 + '/11');
  var S5X = [], S5Y = [], S4X = [], S4Y = [];
  for (q = 0; q < 10; q++) { var ra = q & 1 ? 0.45 : 1, an5 = -Math.PI / 2 + q * Math.PI / 5; S5X.push(Math.cos(an5) * ra); S5Y.push(Math.sin(an5) * ra); }
  for (q = 0; q < 8; q++) { var rb = q & 1 ? 0.38 : 1, an4 = -Math.PI / 2 + q * Math.PI / 4; S4X.push(Math.cos(an4) * rb); S4Y.push(Math.sin(an4) * rb); }
  var NC = Object.create(null), ncN = 0, DASH = [2, 2], NODASH = [];
  var PX = 0, PY = 0;

  function cl(v, mx) { v = Math.floor(+v); return v > 0 ? (v > mx ? mx : v) : 0; } // NaN, negativo, > max e Infinity seguros
  function fmt(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' mi';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace('.', ',') + ' mil';
    return String(Math.floor(v));
  }
  function txt(ctx, s, x, y, font, col, al) { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); }
  function circ(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function star(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(x - s, y - 0.5, s * 2, 1); ctx.fillRect(x - 0.5, y - s, 1, s * 2); }
  function poly(ctx, ax, ay, x, y, r, col) { // estrela de N pontas a partir de tabelas pré-calculadas
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + ax[0] * r, y + ay[0] * r);
    for (var n = 1; n < ax.length; n++) ctx.lineTo(x + ax[n] * r, y + ay[n] * r);
    ctx.closePath(); ctx.fill();
  }
  function dia(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); }
  function ent(arr, i) { var e = arr && arr[i]; return e && typeof e === 'object' ? e : null; }
  function roleIx(e, i) { var r = ROLEIX[String(e.r).toUpperCase()]; return r === undefined ? i % 5 : r; }
  function fit(s, n) { // trunca nome (com cache para não alocar por frame)
    s = s == null ? '' : String(s); var key = n + '|' + s, v = NC[key];
    if (v !== undefined) return v;
    if (ncN > 300) { NC = Object.create(null); ncN = 0; }
    v = s.length > n ? s.slice(0, Math.max(1, n - 1)) + '\u2026' : s; NC[key] = v; ncN++; return v;
  }
  function roleIcon(ctx, ri, cx, cy) { // ícone branco por função: TOP quadrado, JNG triângulo, MID círculo, ADC losango, SUP cruz
    ctx.fillStyle = '#fff';
    if (ri === 0) ctx.fillRect(cx - 2, cy - 2, 4, 4);
    else if (ri === 1) { ctx.beginPath(); ctx.moveTo(cx, cy - 2.6); ctx.lineTo(cx + 2.4, cy + 2); ctx.lineTo(cx - 2.4, cy + 2); ctx.fill(); }
    else if (ri === 2) { ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, TAU); ctx.fill(); }
    else if (ri === 3) dia(ctx, cx, cy, 2.8, '#fff');
    else { ctx.fillRect(cx - 0.8, cy - 2.4, 1.6, 4.8); ctx.fillRect(cx - 2.4, cy - 0.8, 4.8, 1.6); }
  }
  // plaquinha de nome sobre a cadeira. e=null: vaga fantasma (ri = função da vaga)
  function plaque(ctx, cx, y, pw, e, ri, t, i) {
    var x0 = cx - pw / 2, real = e && e.real === true;
    if (!e) {
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#0b0d16'; ctx.fillRect(x0, y, pw, 9);
      ctx.fillStyle = RC[ri]; ctx.fillRect(x0, y, 9, 9); roleIcon(ctx, ri, x0 + 4.5, y + 4.5);
      txt(ctx, 'vaga', x0 + 11, y + 6.6, '6px sans-serif', '#aab', 'left');
      ctx.globalAlpha = 1; return;
    }
    ctx.fillStyle = '#0b0d16'; ctx.globalAlpha = 0.9; ctx.fillRect(x0, y, pw, 9); ctx.globalAlpha = 1;
    ctx.fillStyle = RC[ri]; ctx.fillRect(x0, y, 9, 9); roleIcon(ctx, ri, x0 + 4.5, y + 4.5);
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 10, y, pw - 11, 9); ctx.clip();
    txt(ctx, fit(e.n, Math.max(3, Math.floor((pw - 12) / 3.5))), x0 + 11, y + 6.6, 'bold 6px sans-serif', real ? '#ffe27a' : '#fff', 'left');
    ctx.restore();
    ctx.strokeStyle = real ? '#ffd54a' : RC[ri]; ctx.lineWidth = real ? 1.3 : 0.8; ctx.strokeRect(x0 + 0.4, y + 0.4, pw - 0.8, 8.2);
    if (real) {
      poly(ctx, S5X, S5Y, x0 + pw - 1, y - 1.5, 4.2 + Math.sin(t * 4 + i) * 0.5, '#ffd54a');
      if (Math.sin(t * 3 + i * 2) > 0.85) star(ctx, x0 + pw + 2, y - 4, 2, '#fff');
    }
  }
  function label(ctx, s, cx, y, real, ri) { // nome do reserva
    var w = Math.min(26, s.length * 3.5 + 6);
    ctx.globalAlpha = 0.88; ctx.fillStyle = '#0b0d16'; ctx.fillRect(cx - w / 2, y, w, 8); ctx.globalAlpha = 1;
    ctx.fillStyle = RC[ri]; ctx.fillRect(cx - w / 2, y + 7, w, 1.2);
    txt(ctx, s, cx, y + 6, 'bold 6px sans-serif', real ? '#ffe27a' : '#fff', 'center');
    if (real) poly(ctx, S5X, S5Y, cx + w / 2, y, 3.2, '#ffd54a');
  }

  // Titular sentado no setup. on=false: cadeira vazia (fantasma). eq 0..5, sp 0..6, live: streamer do time.
  function player(ctx, i, x, k, t, gy, on, eq, sp, live, e) {
    var ri = e ? roleIx(e, i) : i % 5, real = !!e && e.real === true, hi = !!e && +e.o >= 90;
    var sh = e ? RC[ri] : SHIRT[i % 10], sk = SKIN[(i * 3) % 5], b = Math.sin(t * 14 + i * 1.7), rg = BEAM[(Math.floor(t * 3) + i) % 4];
    ctx.save(); ctx.translate(x, gy); ctx.scale(k, k);
    if (on && hi) { // aura sutil de craque (nota >= 90)
      ctx.globalAlpha = 0.09 + 0.04 * Math.sin(t * 2.2 + i); circ(ctx, -3, -24, 25, RC[ri]);
      ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 2.7 + i); circ(ctx, -3, -24, 16, RC[ri]);
      ctx.globalAlpha = 0.7; for (var q3 = 0; q3 < 3; q3++) star(ctx, -3 + Math.cos(t * 1.4 + q3 * 2.1 + i) * 21, -24 + Math.sin(t * 1.4 + q3 * 2.1 + i) * 18, 1.5, '#fff');
      ctx.globalAlpha = 1;
    }
    if (!on) ctx.globalAlpha = 0.22;
    if (on && eq >= 5) { ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 3 + i); ctx.fillStyle = rg; ctx.fillRect(-18, -34, 36, 40); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#222'; ctx.fillRect(-10, -12, 13, 2);              // cadeira
    ctx.fillRect(-11, -26, 2, 15);
    ctx.fillStyle = '#223'; ctx.fillRect(-6, -11, 4, 11); ctx.fillRect(-1, -11, 4, 11); // pernas
    if (on) {
      ctx.fillStyle = sh; ctx.fillRect(-8, -29, 10, 15);                // torso
      if (sp > 0) { ctx.fillStyle = SPC[i % Math.min(5, sp)]; ctx.fillRect(-7, -27, 8, 4); ctx.fillStyle = '#fff'; ctx.fillRect(-6, -26, 4, 1); } // logo na camisa
      if (real) { // uniforme de pro: gola e mangas douradas, estrela no peito, faixa na cabeça
        ctx.fillStyle = '#ffd54a'; ctx.fillRect(-8, -29, 10, 2); ctx.fillRect(-8, -29, 1.5, 15); ctx.fillRect(0.5, -29, 1.5, 15);
        poly(ctx, S5X, S5Y, -3, -18.5, 2.8, '#ffd54a');
      }
      circ(ctx, -3, -33, 4, sk);
      ctx.fillStyle = HAIR[(i * 2) % 5]; ctx.fillRect(-7, -38, 8, 3);
      if (real) { ctx.fillStyle = '#ffd54a'; ctx.fillRect(-7, -36, 8, 1); }
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

  function reserve(ctx, i, x, gy, t, e) { // reserva de colete no banco
    var nod = Math.sin(t * 1.6 + i * 2);
    ctx.save(); ctx.translate(x, gy);
    ctx.fillStyle = '#223'; ctx.fillRect(-3, -13, 10, 3); ctx.fillRect(5, -11, 3, 11);
    ctx.fillStyle = SHIRT[(i * 4 + 2) % 10]; ctx.fillRect(-4, -28, 9, 16);
    ctx.fillStyle = e ? RC[roleIx(e, i + 3)] : '#f1c40f'; ctx.fillRect(-4, -28, 9, 14); ctx.fillStyle = e && e.real === true ? '#ffd54a' : '#c9a100'; ctx.fillRect(-1, -28, 3, 14); // colete
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

  function lanePt(lane, f, l, r, tp, b) { // ponto na lane (0 topo, 1 meio, 2 base), f 0..1 da base azul à vermelha
    if (lane === 1) { PX = l + (r - l) * f; PY = b - (b - tp) * f; }
    else if (lane === 0) { if (f < 0.5) { PX = l; PY = b - (b - tp) * 2 * f; } else { PX = l + (r - l) * (2 * f - 1); PY = tp; } }
    else if (f < 0.5) { PX = l + (r - l) * 2 * f; PY = b; } else { PX = r; PY = b - (b - tp) * (2 * f - 1); }
  }
  var EF = [0.58, 0.74, 0.88], AF = [0.42, 0.26, 0.12];
  // telão: mapa de lanes minimalista + torres + objetivos (losango = dragão, estrela = barão); tela de campeão alternada
  function lolScreen(ctx, mx, my, mw, mh, t, nu, tier, ti, tw, dr, bn) {
    var i, j, l, r, tp, b, m2 = mh - 17, y1, y2;
    ctx.fillStyle = '#04060d'; ctx.fillRect(mx, my, mw, mh);
    if (ti > 0 && (Math.floor(t / 5) & 1)) { // tela de campeão
      ctx.fillStyle = '#2a1c05'; ctx.fillRect(mx, my, mw, mh);
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 4); ctx.fillStyle = '#ffd54a'; ctx.fillRect(mx, my + mh - 8, mw, 8); ctx.globalAlpha = 1;
      txt(ctx, 'CAMPEÃO', mx + mw / 2, my + 8, 'bold 6px sans-serif', '#ffd54a', 'center');
      trophy(ctx, mx + mw / 2, my + mh - 7, 1.05, '#ffd54a', t, 2);
      if (ti >= 6 && Math.sin(t * 5) > -0.4) txt(ctx, 'MUNDIAL', mx + mw / 2, my + mh - 1.5, 'bold 6px sans-serif', '#fff', 'center');
    } else {
      ctx.fillStyle = '#0c1a14'; ctx.fillRect(mx, my, mw, m2);
      l = mx + 5; r = mx + mw - 5; tp = my + 5; b = my + m2 - 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2f6fa8'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(l, tp); ctx.lineTo(r, b); ctx.stroke(); ctx.globalAlpha = 1; // rio
      ctx.strokeStyle = '#c9b57a'; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(l, b); ctx.lineTo(l, tp); ctx.lineTo(r, tp);   // top
      ctx.moveTo(l, b); ctx.lineTo(r, tp);                      // mid
      ctx.moveTo(l, b); ctx.lineTo(r, b); ctx.lineTo(r, tp);    // bot
      ctx.stroke(); ctx.lineCap = 'butt';
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) { // torres: aliadas azuis; inimigas laranja, cinza se derrubadas
        lanePt(i, AF[j], l, r, tp, b); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(PX - 1, PY - 1, 2, 2);
        lanePt(i, EF[j], l, r, tp, b); ctx.fillStyle = j * 3 + i < tw ? '#555' : '#ff7043'; ctx.fillRect(PX - 1, PY - 1, 2, 2);
      }
      for (i = 0; i < nu; i++) { lanePt(i % 3, (t * 0.1 + i * 0.27) % 1, l, r, tp, b); circ(ctx, PX, PY, 1.3, i & 1 ? '#aef' : '#fff'); } // movimento do time
      dia(ctx, l, b, 3.4, '#4fc3f7');
      dia(ctx, r, tp, 3.4, tw >= 11 ? (Math.sin(t * 6) > 0 ? '#ffd54a' : '#fff') : '#ff5252');
    }
    ctx.strokeStyle = TB[tier]; ctx.lineWidth = 1.2; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
    y1 = my + m2 + 1; y2 = y1 + 8;
    ctx.fillStyle = '#ff7043'; ctx.fillRect(mx + 3, y1 + 3, 4, 4); ctx.fillRect(mx + 3, y1 + 2, 1, 1); ctx.fillRect(mx + 6, y1 + 2, 1, 1); // ícone de torre
    txt(ctx, TWS[tw], mx + 9, y1 + 7, 'bold 6px sans-serif', '#fff', 'left');
    for (i = 0; i < 4; i++) { ctx.globalAlpha = i < dr ? 1 : 0.25; dia(ctx, mx + 5 + i * 5, y2 + 4, 2.1, '#ff9a3c'); }
    for (i = 0; i < 2; i++) { ctx.globalAlpha = i < bn ? 1 : 0.25; poly(ctx, S4X, S4Y, mx + mw - 11 + i * 6, y2 + 4, 2.8, '#c77dff'); }
    ctx.globalAlpha = 1;
  }


  /* ---- camada da economia semanal (campos opcionais de ex: focus, mood, wp, last, alert, net) ---- */
  var FGLY = { treino: '\u2699', conteudo: '\u25B6', descanso: 'Zz', scrims: 'VS', imprensa: '\u266A', negociar: '$', bootcamp: '\u2708' };
  var FCOL = { treino: '#4fc3f7', conteudo: '#ff5252', descanso: '#9aa7ff', scrims: '#ffb74d', imprensa: '#f48fb1', negociar: '#66bb6a', bootcamp: '#ffd54a' };
  function weekFx(ctx, W, H, gy, t, ex, o, st0, s) {
    if (!ex || typeof ex !== 'object') return;
    var f = typeof ex.focus === 'string' && FCOL[ex.focus] ? ex.focus : null, md = +ex.mood, wp = +ex.wp, al = cl(ex.alert, 2), i, x, y;
    var cx = st0 + s * 2.5;
    if (f) { // icone do foco sobre o time + efeitos simples
      var col = FCOL[f], by = gy - 78 + Math.sin(t * 2) * 1.5;
      ctx.globalAlpha = 0.92; ctx.fillStyle = '#0b0d16'; ctx.fillRect(cx - 14, by - 10, 28, 20);
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 14, by - 10, 28, 20); ctx.globalAlpha = 1;
      txt(ctx, FGLY[f], cx, by + 5, 'bold 12px sans-serif', col, 'center');
      if (f === 'descanso') for (i = 0; i < 3; i++) txt(ctx, 'z', cx + 18 + i * 7, by - 2 - ((t * 10 + i * 6) % 18), 'bold ' + (7 + i * 2) + 'px sans-serif', '#cdd5ff', 'left');
      else if (f === 'conteudo') { ctx.fillStyle = Math.sin(t * 5) > 0 ? '#ff5252' : '#7a1f1f'; ctx.beginPath(); ctx.arc(cx - 20, by - 6, 2.4, 0, TAU); ctx.fill(); }
      else if (f === 'scrims') for (i = 0; i < 5; i++) { ctx.fillStyle = i & 1 ? '#ff7043' : '#4fc3f7'; ctx.fillRect(st0 + s * (i + 0.5) + 10, gy - 14 - (i & 1) * 2, 4, 4); }
      else if (f === 'bootcamp') { ctx.fillStyle = '#8d6e63'; ctx.fillRect(W - 40, gy - 14, 14, 10); ctx.fillRect(W - 24, gy - 11, 11, 7); ctx.fillStyle = '#ffd54a'; ctx.fillRect(W - 36, gy - 16, 6, 2); }
    }
    if (isFinite(md)) { // barra de moral
      var bw = Math.min(70, W * 0.3), bx = 6, byy = gy + 14, v = Math.max(0, Math.min(100, md)) / 100;
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#0b0d16'; ctx.fillRect(bx - 1, byy - 1, bw + 2, 8); ctx.globalAlpha = 1;
      ctx.fillStyle = v < 0.4 ? '#ef5350' : v > 0.8 ? '#66bb6a' : '#ffca28'; ctx.fillRect(bx, byy, bw * v, 6);
      txt(ctx, v < 0.4 ? 'MORAL BAIXA' : v > 0.8 ? 'MORAL ALTA' : 'MORAL', bx + bw + 4, byy + 6, 'bold 6px sans-serif', '#fff', 'left');
      if (v < 0.4) for (i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(10,10,20,.35)'; ctx.fillRect(st0 + s * (i + 0.5) - 8, gy - 44, 14, 6); } // cabecas baixas (sombra)
      else if (v > 0.8) for (i = 0; i < 5; i++) { ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 4 + i)); star(ctx, st0 + s * (i + 0.5) - 3, gy - 52 - Math.abs(Math.sin(t * 4 + i)) * 3, 2, '#ffd54a'); ctx.globalAlpha = 1; }
    }
    if (isFinite(wp)) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, gy + 2, W, 2); ctx.fillStyle = '#7df9ff'; ctx.fillRect(0, gy + 2, W * Math.max(0, Math.min(1, wp)), 2); }
    if (al > 0) { // lampada de alerta de caixa
      var on = al >= 2 ? Math.sin(t * 8) > 0 : true; ctx.globalAlpha = on ? 1 : 0.3;
      circ(ctx, W - 14, 12, 7, al >= 2 ? '#ff2d2d' : '#ffb300'); ctx.globalAlpha = on ? 0.3 : 0; circ(ctx, W - 14, 12, 12, al >= 2 ? '#ff2d2d' : '#ffb300'); ctx.globalAlpha = 1;
      txt(ctx, '!', W - 14, 15.5, 'bold 10px sans-serif', '#fff', 'center');
    }
    if (ex.last === 'W' || ex.last === 'L') {
      if (ex.last === 'W') for (i = 0; i < 24; i++) { x = (i * 37 + t * 20) % W; y = ((t * 60 + i * 23) % (gy)); ctx.fillStyle = CONF[i % 6]; ctx.fillRect(x, y, 3, 3); }
      else { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 10); ctx.fillStyle = '#ff1a1a'; ctx.fillRect(0, 0, W, gy); ctx.globalAlpha = 1; }
      var net = +ex.net;
      if (isFinite(net)) { var lab = (ex.last === 'W' ? 'VITORIA ' : 'DERROTA ') + (net >= 0 ? '+' : '-') + 'R$' + fmt(Math.abs(net)); ctx.globalAlpha = 0.92; ctx.fillStyle = '#0b0d16'; var tw2 = Math.min(W - 8, lab.length * 5 + 12); ctx.fillRect(W / 2 - tw2 / 2, 56, tw2, 14); ctx.globalAlpha = 1; txt(ctx, lab, W / 2, 66, 'bold 8px sans-serif', ex.last === 'W' ? '#9dfc9d' : '#ff9d9d', 'center'); }
    }
  }

  SCENES.esp = {
    h: 230,
    draw: function (ctx, W, H, o, t, ex) {
      o = o || [];
      var ro = ex && ex.roster, ST = ro && ro.starters, SB = ro && ro.subs, hasS = false, hasB = false;
      var a = cl(o[0], 5), rs = cl(o[1], 2), ch = cl(o[2], 1), tr = cl(o[3], 6), h = cl(o[4], 6), eq = cl(o[5], 5),
          an = cl(o[6], 1), sp = cl(o[7], 6), cn = cl(o[8], 6), ps = cl(o[9], 1), fc = cl(o[10], 6), ar = cl(o[11], 4), ti = cl(o[12], 6);
      var gy = H - 46, cx = W / 2, i, j, k, g, x, y, id;
      for (i = 0; i < 5; i++) if (ent(ST, i)) hasS = true;
      for (i = 0; i < 2; i++) if (ent(SB, i)) hasB = true;
      var useS = !!ST && typeof ST === 'object' && (hasS || a === 0), useB = !!SB && typeof SB === 'object' && (hasB || rs === 0);
      var lvl = a + rs + ch + tr + h + eq + an + sp + cn + ps + fc + ar + ti;
      var tw = Math.min(11, Math.floor(lvl * 11 / 50)), dr = Math.min(4, Math.floor(lvl / 10)), bn2 = Math.min(2, Math.floor(lvl / 22));
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
        if (ar >= 2) { // bandeiras genéricas penduradas acima da arquibancada
          var fy = YB - 4 - (rows - 1) * 9 - 18, nfl = Math.floor(W / (ar >= 4 ? 13 : 17)), fw = W / nfl;
          ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, fy - 1); ctx.lineTo(W, fy - 1); ctx.stroke();
          for (i = 0; i < nfl; i++) {
            x = i * fw + 1; y = fy + Math.sin(t * 3 + i) * 0.7; var c1 = FLC[(i * 2) % 6], c2 = FLC[(i * 2 + 3) % 6], ty2 = i & 3;
            ctx.fillStyle = c1; ctx.fillRect(x, y, fw - 3, 8); ctx.fillStyle = c2;
            if (ty2 === 0) ctx.fillRect(x, y + 3, fw - 3, 2.5);
            else if (ty2 === 1) ctx.fillRect(x + (fw - 3) / 3, y, (fw - 3) / 3, 8);
            else if (ty2 === 2) circ(ctx, x + (fw - 3) / 2, y + 4, 2, c2);
            else { ctx.fillRect(x + 2, y + 3, fw - 7, 2); ctx.fillRect(x + (fw - 3) / 2 - 1, y + 1, 2, 6); }
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
      var MW = zw >= 200 ? 50 : 40, MH = tr >= 6 ? 34 : 44, mmx = zx0, showMap = zw >= 100;
      if (tr > 0) {
        var wl = tr >= 3 ? zw * 0.3 : (showMap ? zw - MW - 6 : zw), nsc = tr >= 5 ? 3 : tr >= 4 ? 2 : tr >= 3 ? 1 : 0, sbh = tr >= 6 ? 32 : bh;
        if (showMap) mmx = zx0 + wl + 6;
        ctx.fillStyle = '#caa56a'; ctx.fillRect(zx0 - 2, ty - 2, wl + 4, sbh + 4);
        ctx.fillStyle = '#1f5a3a'; ctx.fillRect(zx0, ty, wl, sbh);
        ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff'; ctx.fillRect(zx0 + wl / 2, ty, 1, sbh); ctx.globalAlpha = 1;
        txt(ctx, 'DRAFT', zx0 + 3, ty + 8, '6px sans-serif', '#cfe', 'left');
        var nd = tr >= 2 ? 8 : 4, p0x = 0, p0y = 0;
        for (j = 0; j < nd; j++) {
          x = zx0 + 6 + R[(j * 5) & 255] * (wl - 12) + Math.sin(t * 0.9 + j) * 3; y = ty + 12 + R[(j * 5 + 1) & 255] * (sbh - 18) + Math.cos(t * 0.8 + j) * 2;
          circ(ctx, x, y, 2.3, j & 1 ? '#4fc3f7' : '#ff5252');
          if (j === 0) { p0x = x; p0y = y; }
          if (tr >= 2 && (j === 2 || j === 5)) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p0x, p0y); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1; p0x = x; p0y = y; }
        }
        if (nsc > 0) { // telas de VOD review
          var vx0 = showMap ? mmx + MW + 4 : zx0 + wl + 6, wr = zx0 + zw - vx0;
          nsc = Math.min(nsc, Math.floor(wr / 18)); var sw = nsc > 0 ? wr / nsc - 2 : 0;
          for (i = 0; i < nsc; i++) {
            var sx = vx0 + i * (sw + 2);
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
      if (showMap) lolScreen(ctx, mmx, ty, MW, MH, t, Math.min(4, a), tier, ti, tw, dr, bn2);
      if (ti > 0) { // estante de troféus
        var sy = YB - 12, tsp = Math.min(22, (zw - 4) / 6), tx0 = zc - tsp * 3 + tsp / 2;
        ctx.fillStyle = '#4a3320'; ctx.fillRect(zc - tsp * 3 - 2, sy, tsp * 6 + 4, 3);
        for (i = 0; i < ti; i++) {
          if (i === 5) { g = ctx.createRadialGradient(tx0 + i * tsp, sy - 10, 1, tx0 + i * tsp, sy - 10, 24); g.addColorStop(0, '#ffe27a'); g.addColorStop(1, 'rgba(255,200,50,0)'); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3); ctx.fillStyle = g; ctx.fillRect(tx0 + i * tsp - 24, sy - 34, 48, 48); ctx.globalAlpha = 1; }
          trophy(ctx, tx0 + i * tsp, sy, i === 5 ? 1.35 : 1, TRC[i], t, i);
        }
        if (ti >= 6 && Math.sin(t * 6) > -0.3 && !(tr >= 6 && sp >= 6)) txt(ctx, 'CAMPEÃO MUNDIAL', zc, sy - 24, 'bold 8px sans-serif', '#ffd54a', 'center');
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
      for (i = 0; i < 2; i++) {
        var eb = useB ? ent(SB, i) : null;
        if (useB ? !eb : i >= rs) continue;
        reserve(ctx, i, bx0 + 10 + i * 17, gy, t, eb);
      }
      if (useB) for (i = 0; i < 2; i++) { var eb2 = ent(SB, i); if (eb2) label(ctx, fit(eb2.n, 6), bx0 + 10 + i * 17, gy - 44 - i * 9, eb2.real === true, roleIx(eb2, i + 3)); }
      var s = Math.min(40, (px1 - px0) / 5), st0 = px0 + ((px1 - px0) - s * 5) / 2, kk = Math.min(1.2, (s - 4) / 28);
      for (i = 0; i < 5; i++) {
        var es = useS ? ent(ST, i) : null, onp = useS ? !!es : i < a;
        player(ctx, i, st0 + s * (i + 0.5), kk, t, gy, onp, eq, sp, cn > 0 && i === 0 && onp, es);
      }
      if (useS) for (i = 0; i < 5; i++) { // plaquinhas de nome e função
        var e2 = ent(ST, i), lv = cn > 0 && i === 0 && e2;
        plaque(ctx, st0 + s * (i + 0.5), gy - (lv ? 50 : 40) * kk - 15, Math.min(s - 2, 42), e2, e2 ? roleIx(e2, i) : i, t, i);
      }

      // ---- brilho e confetes do título ----
      if (ti >= 4) {
        var nc = 16 + (ti - 3) * 12;
        for (i = 0; i < nc; i++) {
          x = R[(i * 3) & 255] * W + Math.sin(t * 1.7 + i) * 10;
          y = ((t * (28 + R[(i * 5) & 255] * 30) + R[(i * 7) & 255] * (H + 30)) % (H + 30)) - 15;
          ctx.fillStyle = CONF[i % 6]; ctx.fillRect(x, y, 1.5 + Math.abs(Math.cos(t * 4 + i)) * 4, 3);
        }
      }
      var sm = cl(o[13], 1);
      if (sm > 0) { x = 14; ctx.fillStyle = '#223'; ctx.fillRect(x - 4, gy - 12, 3, 12); ctx.fillRect(x + 1, gy - 12, 3, 12); ctx.fillStyle = '#9c27b0'; ctx.fillRect(x - 5, gy - 26, 10, 15); circ(ctx, x, gy - 31, 4, SKIN[1]); ctx.fillStyle = '#111'; ctx.fillRect(x + 4, gy - 22, 4, 6); ctx.fillStyle = Math.sin(t * 3) > 0 ? '#6cf' : '#9ef'; ctx.fillRect(x + 5, gy - 21, 2, 4); }
      weekFx(ctx, W, H, gy, t, ex, o, st0, s);
      spark(ctx, t);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    },
    burst: function (ctx, W, H, t) {
      bt = t; bx = W * (0.25 + 0.5 * R[bn & 255]); by = H * 0.45; bn++;
      spark(ctx, t);
    }
  };
})();

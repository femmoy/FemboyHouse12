// Видик: телевизор и видеомагнитофон. Кассеты рисуются на лету, а сигнал проходит через шейдер плёнки.
(() => {
  const { $, $$, esc, html, links, store, sound, clamp, reduce } = FH;
  const wm = FH.wm;
  const W = 480, H = 360;
  const TIT = '"Trebuchet MS", Tahoma, Verdana, sans-serif', UI = 'Tahoma, Verdana, sans-serif', MONO = 'Consolas, "Lucida Console", "DejaVu Sans Mono", monospace';
  const avatar = new Image(), shot = new Image();
  const loadArt = () => { if (!avatar.src) { avatar.src = 'avatar.webp'; shot.src = 'game.jpg'; } };

  const txt = (x, s, px, py, size, color = '#fff', o = {}) => {
    x.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} ${size}px ${o.font || TIT}`;
    x.textAlign = o.align || 'center';
    x.textBaseline = 'middle';
    if (o.stroke) { x.lineJoin = 'round'; x.lineWidth = o.width || size * .16; x.strokeStyle = o.stroke; x.strokeText(s, px, py); }
    if (o.shadow) { x.fillStyle = o.shadow; x.fillText(s, px + (o.sx || 3), py + (o.sy || 3)); }
    x.fillStyle = color;
    x.fillText(s, px, py);
  };
  const fade = (t, a, b, f = .5) => clamp(Math.min((t - a) / f, (b - t) / f), 0, 1);
  const seeded = (n, f) => Array.from({length: n}, (_, i) => f(i, ((i * 9301 + 49297) % 233280) / 233280, ((i * 7919 + 1013) % 104729) / 104729));
  const STARS = seeded(70, (i, a, b) => [a * W, b * H, .5 + (i % 3) * .5, i]);

  function drawImg(x, img, dx, dy, dw, dh) { if (img.complete && img.naturalWidth) x.drawImage(img, dx, dy, dw, dh); }
  function starburst(x, cx, cy, r, t, color, label, size = 22) {
    x.save(); x.translate(cx, cy); x.rotate(Math.sin(t * 2) * .12);
    x.beginPath();
    for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, q = i % 2 ? r * .74 : r; x.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    x.closePath(); x.fillStyle = color; x.fill();
    x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke();
    x.rotate(-.18);
    txt(x, label, 0, 0, size * (1 + Math.sin(t * 8) * .05), '#fff', {weight: 900, stroke: '#000', width: 4});
    x.restore();
  }
  function box3d(x, cx, cy, s, a) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    const w = Math.cos(a), side = Math.sin(a);
    const front = (px, sc, c) => { x.fillStyle = c; x.fillRect(px - 40 * Math.abs(sc), -30, 80 * Math.abs(sc), 62); };
    front(side * 40, side, '#d93f87');
    front(w * 0, w, '#f0609f');
    x.fillStyle = '#fff'; x.fillRect(-7 * Math.abs(w), -30, 14 * Math.abs(w), 62);
    x.fillStyle = '#ff8cc2'; x.fillRect(-46 * Math.max(Math.abs(w), .55), -46, 92 * Math.max(Math.abs(w), .55), 18);
    x.fillStyle = '#fff';
    x.beginPath(); x.ellipse(-14, -56, 15, 9, -.6, 0, 6.283); x.ellipse(14, -56, 15, 9, .6, 0, 6.283); x.fill();
    x.restore();
  }
  function catSide(x, px, py, s, t, o = {}) {
    x.save(); x.translate(px, py); x.scale(o.flip ? -s : s, s);
    const step = o.run ? Math.sin(t * 22) : 0;
    x.strokeStyle = '#2a2a44'; x.lineWidth = 2.500; x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = o.c || '#fff';
    x.beginPath(); x.moveTo(-24, -14); x.quadraticCurveTo(-42, -22 + step * 4, -38, -40); x.stroke();
    [[-16, step], [-6, -step], [8, -step], [18, step]].forEach(([lx, d]) => { x.beginPath(); x.moveTo(lx, -6); x.lineTo(lx + d * 7, 8); x.lineWidth = 6; x.strokeStyle = '#2a2a44'; x.stroke(); x.lineWidth = 3.500; x.strokeStyle = o.c || '#fff'; x.stroke(); });
    x.lineWidth = 2.500; x.strokeStyle = '#2a2a44';
    x.beginPath(); x.ellipse(0, -16, 27, 14, 0, 0, 6.283); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(17, -30); x.lineTo(16, -52); x.lineTo(27, -41); x.lineTo(37, -52); x.lineTo(38, -30); x.fill(); x.stroke();
    x.beginPath(); x.arc(28, -28, 15, 0, 6.283); x.fill(); x.stroke();
    x.fillStyle = '#14161f';
    if (o.wide) { x.beginPath(); x.arc(24, -30, 3, 0, 6.283); x.arc(34, -30, 3, 0, 6.283); x.fill(); }
    else { x.fillRect(21, -31, 6, 2.500); x.fillRect(31, -31, 6, 2.500); }
    x.fillStyle = '#ff8fb8'; x.beginPath(); x.moveTo(26, -24); x.lineTo(31, -24); x.lineTo(28.500, -21); x.fill();
    if (o.hat) {
      x.fillStyle = '#d6304a'; x.beginPath(); x.moveTo(14, -38); x.quadraticCurveTo(26, -64, 44, -42); x.closePath(); x.fill();
      x.fillStyle = '#fff'; x.fillRect(13, -41, 31, 6);
      x.beginPath(); x.arc(46, -44, 4, 0, 6.283); x.fill();
    }
    if (o.carry) { x.scale(.5, .5); box3d(x, 52, -128, 1, 0); }
    x.restore();
  }

  // ---------- камин: классический алгоритм огня с низким разрешением
  function makeFire() {
    const fw = 96, fh = 58, buf = new Uint8Array(fw * fh), c = document.createElement('canvas');
    c.width = fw; c.height = fh;
    const ctx = c.getContext('2d'), img = ctx.createImageData(fw, fh);
    const pal = Array.from({length: 37}, (_, i) => {
      const k = i / 36;
      return [clamp(k * 3.2, 0, 1) * 255, clamp(k * 3.2 - .9, 0, 1) * 235, clamp(k * 3.2 - 2.1, 0, 1) * 200, i < 2 ? 0 : 255];
    });
    for (let i = 0; i < fw; i++) buf[(fh - 1) * fw + i] = 36;
    return {
      c,
      step() {
        for (let px = 0; px < fw; px++) for (let py = 1; py < fh; py++) {
          const src = py * fw + px, v = buf[src];
          if (!v) { buf[src - fw] = 0; continue; }
          const r = Math.floor(Math.random() * 3), dst = src - r + 1 - fw;
          if (dst >= 0) buf[dst] = Math.max(0, v - (Math.random() < .84 ? 1 : 0));
        }
        const d = img.data;
        for (let i = 0; i < buf.length; i++) { const p = pal[buf[i]]; d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = p[3]; }
        ctx.putImageData(img, 0, 0);
      },
    };
  }
  let fire = null, fireLast = 0;

  // ---------- программы на кассетах (t: секунды записи)
  const P = {
    ident(x, t) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120a48'); g.addColorStop(.55, '#5a1e8c'); g.addColorStop(1, '#d9408c');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.save(); x.globalAlpha = .13; x.translate(W / 2, H / 2); x.rotate(t * .25);
      for (let i = 0; i < 12; i++) { x.rotate(6.283 / 12); x.fillStyle = i % 2 ? '#fff' : '#ff9ccb'; x.beginPath(); x.moveTo(0, 0); x.lineTo(420, -55); x.lineTo(420, 55); x.fill(); }
      x.restore();
      STARS.forEach(([a, b, r, i]) => { x.fillStyle = `rgba(255,255,255,${.4 + .5 * Math.sin(t * 2 + i)})`; x.fillRect(a, (b + t * (6 + r * 6)) % H, r * 2, r * 2); });
      const k = clamp((t - .4) / .8, 0, 1), s = k * (1 + Math.sin(k * 6.283) * .25 * (1 - k));
      const ax = W / 2, ay = 128, turn = Math.cos(t * 1.100);
      x.save(); x.translate(ax, ay); x.scale(s * Math.max(.1, Math.abs(turn)), s);
      x.beginPath(); x.arc(0, 0, 74, 0, 6.283); x.fillStyle = '#fff'; x.fill();
      x.beginPath(); x.arc(0, 0, 69, 0, 6.283); x.clip();
      drawImg(x, avatar, -69, -69, 138, 138);
      x.restore();
      if (t > 1.3) {
        const a = clamp((t - 1.3) / .5, 0, 1);
        x.globalAlpha = a;
        txt(x, 'ФЕМБОЙ ХАУС', W / 2, 244, 46, '#fff', {weight: 900, italic: true, stroke: '#2a0a4a', width: 8, shadow: '#ff5ca8', sx: 4, sy: 4});
        txt(x, 'ТЕЛЕКАНАЛ УЮТА', W / 2, 283, 20, '#ffe98a', {weight: 700, stroke: '#2a0a4a', width: 4});
        x.globalAlpha = 1;
      }
      x.fillStyle = 'rgba(10,6,40,.78)'; x.fillRect(0, 318, W, 30);
      const line = 'Уютный фембой-дом · игры, чат и рулетка идей · пиши идеи для видео в комментах · ставь лайки идеям, которые нравятся · ';
      x.font = `700 17px ${UI}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
      const lw = x.measureText(line).width;
      const off = (t * 70) % lw;
      x.fillText(line, -off, 334); x.fillText(line, lw - off, 334);
    },
    ad(x, t) {
      if (t < 3.8) {
        x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
        const a = 'ТЕБЕ СКУЧНО?';
        txt(x, a.slice(0, Math.floor(t * 12)), W / 2, 150, 44, '#fff', {weight: 900});
        if (t > 2) txt(x, 'ЕСТЬ РЕШЕНИЕ!', W / 2, 216, 28, '#ffd34d', {weight: 900});
      } else if (t < 10) {
        const k = (t - 3.8) / 6.2, z = 1.05 + k * .55;
        x.fillStyle = '#7fa8d8'; x.fillRect(0, 0, W, H);
        drawImg(x, shot, W / 2 - (W * z) / 2 - k * 40, H / 2 - (H * z) / 2 + k * 18, W * z, H * z);
        x.fillStyle = 'rgba(0,0,0,.62)'; x.fillRect(0, 288, W, 58);
        txt(x, 'МОЯ ИГРА В РОБЛОКСЕ', W / 2, 317, 28, '#fff', {weight: 900});
        starburst(x, 392, 72, 62, t, '#e0327f', 'НОВОЕ!', 20);
      } else if (t < 14.5) {
        const g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#5fd8ff'); g.addColorStop(1, '#ff9ccb');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(0, ((i * 34 + t * 90) % H), W, 11); }
        box3d(x, W / 2, 158, 1.6, t * 2);
        txt(x, 'ОДНА КОРОБКА', W / 2, 272, 40, '#fff', {weight: 900, stroke: '#a61e63', width: 7});
        if (t > 11.8) txt(x, 'ЧЕТЫРЕ БАЗЫ', W / 2, 318, 34, '#ffe14d', {weight: 900, stroke: '#a61e63', width: 6});
      } else if (t < 18) {
        x.fillStyle = '#b5e08a'; x.fillRect(0, 0, W, H);
        x.fillStyle = '#f7f4ea'; x.fillRect(0, 214, W, 70);
        for (let i = 0; i < 10; i++) { x.fillStyle = '#56b35a'; x.beginPath(); x.arc(((i * 90 - (t - 14.5) * 240) % 900 + 900) % 900 - 100, 188, 26, 0, 6.283); x.fill(); }
        catSide(x, 250, 262, 1.5, t, {run: true, hat: true, carry: true});
        txt(x, 'УКРАДИ ЕЁ!', W / 2, 76, 58, '#e0327f', {weight: 900, stroke: '#fff', width: 8});
      } else {
        x.fillStyle = '#16084a'; x.fillRect(0, 0, W, H);
        box3d(x, W / 2, 96, .95, t * 1.300);
        txt(x, 'УКРАСТЬ КОРОБКУ', W / 2, 186, 40, '#fff', {weight: 900, stroke: '#e0327f', width: 6});
        txt(x, 'ИГРАЙ В РОБЛОКСЕ', W / 2, 236, 28, '#ffe14d', {weight: 900});
        x.fillStyle = '#ff3b5c'; x.beginPath(); x.arc(420, 58, 36, 0, 6.283); x.fill();
        x.strokeStyle = '#fff'; x.lineWidth = 4; x.stroke();
        txt(x, '16+', 420, 59, 25, '#fff', {weight: 900});
        txt(x, 'Звонить не надо. Кнопка под телевизором.', W / 2, 306, 17, '#fff', {font: UI});
      }
    },
    chat(x, t) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a8fe0'); g.addColorStop(1, '#bfe6ff');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 130 + t * (18 + i * 5)) % 620) - 80, cy = 44 + i * 44;
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.beginPath(); x.ellipse(cx, cy, 50, 16, 0, 0, 6.283); x.ellipse(cx - 18, cy - 10, 24, 15, 0, 0, 6.283); x.ellipse(cx + 16, cy - 9, 22, 13, 0, 0, 6.283); x.fill();
      }
      const fx = W * .5 + Math.cos(t * .9) * 170, fy = 130 + Math.sin(t * 1.800) * 62;
      x.strokeStyle = 'rgba(255,255,255,.9)'; x.setLineDash([7, 9]); x.lineWidth = 3;
      x.beginPath();
      for (let i = 0; i < 26; i++) { const q = t - i * .05, px = W * .5 + Math.cos(q * .9) * 170, py = 130 + Math.sin(q * 1.800) * 62; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
      x.stroke(); x.setLineDash([]);
      x.save(); x.translate(fx, fy); x.rotate(Math.atan2(Math.cos(t * 1.800) * 112, -Math.sin(t * .9) * 153));
      x.fillStyle = '#fff'; x.strokeStyle = '#1b7fd0'; x.lineWidth = 2.500;
      x.beginPath(); x.moveTo(30, 0); x.lineTo(-24, -20); x.lineTo(-12, 0); x.lineTo(-24, 20); x.closePath(); x.fill(); x.stroke();
      x.restore();
      const line = t < 4.5 ? ['ЕСТЬ О ЧЁМ', 'ПОБОЛТАТЬ?'] : t < 9.5 ? ['ТЕЛЕГРАМ-ЧАТ', 'С ФЕМБОЯМИ'] : ['ОБЩАТЬСЯ', 'И ЗНАКОМИТЬСЯ'];
      txt(x, line[0], W / 2, 240, 40, '#fff', {weight: 900, stroke: '#0e4d90', width: 7});
      txt(x, line[1], W / 2, 287, 40, '#ffe14d', {weight: 900, stroke: '#0e4d90', width: 7});
      x.fillStyle = 'rgba(0,30,70,.7)'; x.fillRect(0, 322, W, 28);
      txt(x, 'В чате не пиши адрес и школу. Береги себя.', W / 2, 336, 16, '#fff', {font: UI});
    },
    toon(x, t) {
      const card = (a, b) => {
        x.fillStyle = '#17110a'; x.fillRect(0, 0, W, H);
        x.strokeStyle = '#d8c8a0'; x.lineWidth = 3; x.strokeRect(30, 30, W - 60, H - 60);
        x.lineWidth = 1; x.strokeRect(38, 38, W - 76, H - 76);
        txt(x, a, W / 2, b ? 150 : H / 2, 32, '#f2e6c4', {font: 'Georgia, "Times New Roman", serif'});
        if (b) txt(x, b, W / 2, 204, 25, '#f2e6c4', {font: 'Georgia, "Times New Roman", serif', weight: 400, italic: true});
      };
      const ground = (ox) => {
        x.fillStyle = '#1a1848'; x.fillRect(0, 0, W, H);
        x.fillStyle = '#fff8e4'; x.beginPath(); x.arc(388, 62, 26, 0, 6.283); x.fill();
        STARS.slice(0, 26).forEach(([a, b]) => { x.fillStyle = '#fff'; x.fillRect((a - ox * .1 + W) % W, b * .5, 2, 2); });
        for (let i = -1; i < 7; i++) {
          const hx = ((i * 118 - ox * .5) % 826 + 826) % 826 - 120;
          x.fillStyle = '#2c2666'; x.fillRect(hx, 150 + (i % 3) * 14, 90, 140);
          x.fillStyle = '#ffd27a'; x.fillRect(hx + 16, 180, 18, 18); x.fillRect(hx + 54, 214, 18, 18);
        }
        x.fillStyle = '#e9e2ff'; x.fillRect(0, 288, W, H - 288);
      };
      if (t < 4) card('КОТИК И КОРОБКА', 'немой мультфильм');
      else if (t < 7) card('Однажды ночью котик увидел…');
      else if (t < 13) {
        const k = (t - 7) / 6;
        ground(0);
        box3d(x, 360, 260, .6, 0);
        catSide(x, 40 + k * 240, 292, 1.150, t * .5, {hat: true, run: true, wide: k > .85});
        if (k > .85) txt(x, '!', 318, 196, 54, '#ffe14d', {weight: 900, stroke: '#000', width: 5});
      } else if (t < 16) card('Коробка!', 'Ничья. Пока что.');
      else if (t < 24) {
        const k = t - 16;
        ground(k * 170);
        catSide(x, 280, 292, 1.150, t, {hat: true, run: true, carry: true});
        catSide(x, 110 + Math.sin(k) * 26, 292, 1, t, {c: '#ff9ccb', run: true});
        catSide(x, 22 + Math.sin(k * 1.300) * 18, 292, 1, t, {c: '#8fe6b4', run: true});
      } else card('КОНЕЦ', 'Продолжение в Роблоксе');
      // царапины старой плёнки
      for (let i = 0; i < 2; i++) { x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(Math.random() * W, 0, 1, H); }
    },
    fire(x, t) {
      if (!fire) fire = makeFire();
      const now = performance.now();
      if (now - fireLast > 45) { fireLast = now; fire.step(); }
      x.fillStyle = '#2a1520'; x.fillRect(0, 0, W, H);
      for (let r = 0; r < 12; r++) for (let c = 0; c < 15; c++) {
        x.fillStyle = (r * 7 + c * 3) % 5 ? '#6b2f2a' : '#7a3a30';
        x.fillRect(c * 34 - (r % 2 ? 16 : 0) + 2, r * 24 + 2, 31, 21);
      }
      x.fillStyle = '#100808'; x.fillRect(116, 110, 248, 170);
      x.drawImage(fire.c, 122, 118, 236, 170);
      x.fillStyle = '#2c1a10';
      x.save(); x.translate(240, 270); x.rotate(.08); x.fillRect(-82, -9, 164, 19); x.rotate(-.2); x.fillRect(-74, -7, 148, 17); x.restore();
      x.fillStyle = '#4a2c18'; x.fillRect(90, 88, 300, 24);
      x.fillStyle = '#6d4426'; x.fillRect(84, 80, 312, 11);
      x.fillStyle = '#f6f0ff'; x.fillRect(84, 76, 312, 5);
      [[128, '#d6304a'], [240, '#2f8f5f'], [352, '#d6304a']].forEach(([sx, c]) => {
        x.fillStyle = c;
        x.beginPath(); x.moveTo(sx - 13, 112); x.lineTo(sx + 11, 112); x.lineTo(sx + 11, 146); x.quadraticCurveTo(sx + 11, 160, sx - 6, 158); x.lineTo(sx - 26, 158); x.quadraticCurveTo(sx - 30, 146, sx - 13, 142); x.closePath(); x.fill();
        x.fillStyle = '#fff'; x.fillRect(sx - 15, 110, 28, 8);
      });
      x.fillStyle = '#3a1f2e'; x.fillRect(0, 280, W, 80);
      x.fillStyle = '#8c2f45'; x.beginPath(); x.ellipse(240, 322, 192, 28, 0, 0, 6.283); x.fill();
      x.fillStyle = '#ffd27a'; x.beginPath(); x.ellipse(240, 322, 170, 22, 0, 0, 6.283); x.fill();
      x.fillStyle = '#8c2f45'; x.beginPath(); x.ellipse(240, 322, 150, 18, 0, 0, 6.283); x.fill();
      const b = Math.sin(t * 1.300) * 1.500;
      x.save(); x.translate(240, 306); x.scale(1.300, 1.300); x.translate(-240, -312);
      x.fillStyle = '#fff'; x.strokeStyle = '#1a1a30'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(204, 318); x.quadraticCurveTo(176, 322, 180, 296); x.stroke();
      x.beginPath(); x.ellipse(232, 312 - b * .4, 40, 19 + b * .5, 0, 0, 6.283); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(254, 302); x.lineTo(258, 280); x.lineTo(270, 292); x.lineTo(284, 280); x.lineTo(288, 302); x.fill(); x.stroke();
      x.beginPath(); x.arc(271, 308, 19, 0, 6.283); x.fill(); x.stroke();
      x.lineWidth = 2.500;
      x.beginPath(); x.moveTo(260, 307); x.quadraticCurveTo(264, 311, 268, 307); x.moveTo(274, 307); x.quadraticCurveTo(278, 311, 282, 307); x.stroke();
      x.fillStyle = '#d6304a'; x.beginPath(); x.moveTo(254, 296); x.quadraticCurveTo(268, 262, 290, 296); x.closePath(); x.fill();
      x.fillStyle = '#fff'; x.fillRect(252, 292, 40, 6);
      x.restore();
      x.fillStyle = `rgba(255,140,40,${.07 + Math.sin(t * 7.300) * .02 + Math.sin(t * 13.100) * .015})`; x.fillRect(0, 0, W, H);
    },
    secret(x, t) {
      x.fillStyle = '#05030c'; x.fillRect(0, 0, W, H);
      const z = 1 + t * .025;
      x.save(); x.translate(W / 2, 148); x.scale(z, z);
      x.beginPath(); x.arc(0, 0, 92, 0, 6.283); x.clip();
      drawImg(x, avatar, -92, -92, 184, 184);
      x.restore();
      if (t > 3) txt(x, 'ТЫ НАШЁЛ СЕКРЕТНУЮ ПЛЁНКУ', W / 2, 282, 24, '#fff', {weight: 900});
      if (t > 7) txt(x, 'За это котик очень тобой гордится.', W / 2, 314, 19, '#ffb6d5', {font: UI});
      if (t > 12) txt(x, 'Только не перематывай её назад.', W / 2, 340, 16, '#8f8fa8', {font: UI});
    },
  };

  const TAPES = [
    {id: 'ident', label: 'Заставка канала', lb: '#ffd9ec', len: 24, draw: P.ident, music: {bpm: 96, g: .06, type: 'triangle', lead: [72, 76, 79, 84, 0, 79, 76, 0, 77, 81, 84, 89, 0, 84, 81, 0, 76, 79, 84, 88, 0, 84, 79, 0, 74, 77, 81, 86, 84, 0, 0, 0], bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 60, 0, 0, 0, 48, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0, 55, 0, 0, 0]}},
    {id: 'ad', label: 'Реклама: Коробка', lb: '#fff0b0', len: 23, draw: P.ad, cta: {href: links.game, text: 'Понравилось? Настоящая игра ждёт в Роблоксе (пока что 16+).', btn: 'Играть в Роблоксе'}, music: {bpm: 150, g: .045, type: 'square', lead: [76, 76, 79, 76, 81, 79, 76, 74, 72, 72, 76, 72, 79, 76, 72, 71, 74, 74, 79, 74, 83, 79, 74, 72, 74, 0, 78, 0, 81, 0, 86, 0], bass: [40, 0, 52, 0, 40, 0, 52, 0, 36, 0, 48, 0, 36, 0, 48, 0, 43, 0, 55, 0, 43, 0, 55, 0, 38, 0, 50, 0, 38, 0, 50, 0]}},
    {id: 'chat', label: 'Реклама: Чат', lb: '#c9ecff', len: 15, draw: P.chat, cta: {href: links.tg, text: 'Заходи общаться и знакомиться.', btn: 'Открыть телеграм-чат'}, music: {bpm: 110, g: .06, type: 'triangle', lead: [79, 0, 76, 0, 72, 0, 76, 79, 81, 0, 77, 0, 72, 0, 77, 81, 79, 0, 76, 0, 74, 0, 71, 74, 72, 0, 0, 0, 0, 0, 0, 0], bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 53, 0, 60, 0, 48, 0, 55, 0, 43, 0, 50, 0, 48, 0, 0, 0, 0, 0, 0, 0]}},
    {id: 'toon', label: 'Мультик про коробку', lb: '#d2f5c8', len: 29, draw: P.toon, music: {bpm: 168, g: .05, type: 'triangle', lead: [72, 76, 79, 76, 84, 79, 76, 79, 71, 74, 77, 74, 83, 77, 74, 77, 69, 72, 76, 72, 81, 76, 72, 76, 67, 71, 74, 71, 79, 74, 71, 67], bass: [48, 0, 60, 0, 48, 0, 60, 0, 43, 0, 55, 0, 43, 0, 55, 0, 45, 0, 57, 0, 45, 0, 57, 0, 43, 0, 55, 0, 43, 0, 55, 0]}},
    {id: 'fire', label: 'Камин, 3 часа', lb: '#ffd2b0', len: 10800, draw: P.fire, crackle: true},
    {id: 'secret', label: 'НЕ СМОТРЕТЬ!!!', lb: '#ffffff', len: 20, draw: P.secret, secret: true, music: {bpm: 60, g: .07, type: 'sine', lead: [60, 0, 0, 0, 63, 0, 0, 0, 58, 0, 0, 0, 55, 0, 0, 0], bass: []}},
  ];
  const tapeOf = (id) => TAPES.find((t) => t.id === id);

  // ---------- телетекст
  const horoscope = ['Сегодня удачный день, чтобы украсть коробку.', 'Звёзды советуют перемотать кассету.', 'Сегодня снег ляжет на твой заголовок окна.', 'Вас ждёт неожиданная идея для видео.', 'Котик смотрит на вас с одобрением.', 'Не запускайте файлы из корзины. Просто не надо.', 'Хороший день, чтобы написать в чат.'];
  const PAGES = {
    100: () => ['{bM}{W}  ФЕМБОЙТЕКСТ                             ', '{bM}{Y}  телетекст канала уюта                  ', '', '{C} 101 {W}О ДОМЕ', '{C} 102 {W}ТЕЛЕГРАМ-ЧАТ', '{C} 103 {W}ИГРА: УКРАСТЬ КОРОБКУ', '{C} 104 {W}РУЛЕТКА ИДЕЙ', '{C} 105 {W}БЕРЕГИ СЕБЯ В ЧАТЕ', '', '{Y} 110 {W}ПОГОДА В ДОМЕ', '{Y} 111 {W}ГОРОСКОП ДЛЯ КОТИКОВ', '{Y} 120 {W}ПРОГРАММА ПЕРЕДАЧ', '', '{G} Набери номер страницы на пульте', '', '', '', '', '', '{bR}{W} 101 {bG}{W} 102 {bY}{K} 103 {bC}{K} 100                    '],
    101: () => ['{bB}{Y} О ДОМЕ                                  ', '', '{W} Уютный фембой-дом.', '{W} Игры, чат и рулетка идей.', '', '{C} Статус: {G}рад гостям', '', '{W} Здесь можно поболтать, поиграть', '{W} и предложить идею для видео.', '', '{Y} Страница 102: чат', '{Y} Страница 103: игра', '{Y} Страница 104: рулетка идей'],
    102: () => ['{bC}{K} ТЕЛЕГРАМ-ЧАТ                            ', '', '{W} Телеграм-чат с фембоями.', '{W} Заходи общаться и знакомиться.', '', '{G} В ЧАТЕ — ТОЛЬКО СВОИ.', '{G} ЛИЧНЫЕ ДАННЫЕ НЕ ПИШЕМ.', '', '{Y} Кнопка входа: значок на рабочем', '{Y} столе или окно профиля.', '', '{C} Правила на странице 105'],
    103: () => ['{bM}{W} УКРАСТЬ КОРОБКУ                         ', '', '{W} Игра в Роблоксе. Пока что {R}16+{W}.', '', '{Y} ОДНА КОРОБКА. ЧЕТЫРЕ БАЗЫ.', '', '{W} Размяться можно здесь же:', '{C} мини-игра на рабочем столе.', '', '{W} Реклама на кассете у телевизора.'],
    104: () => ['{bY}{K} РУЛЕТКА ИДЕЙ                            ', '', '{W} Пиши идеи для видео в комментах.', '', '{W} В следующих выпусках кручу рулетку.', '{W} Чья идея выпадет, про ту будет разбор.', '', '{Y} Чем больше комментариев у темы,', '{Y} тем выше её шанс выпасть.', '', '{C} Ставь лайки идеям, которые нравятся!'],
    105: () => ['{bR}{W} БЕРЕГИ СЕБЯ                             ', '', '{W} Не пиши в чате адрес и школу.', '{W} Не пиши другие личные данные.', '{W} Не отправляй фото незнакомцам.', '', '{Y} Давят или просят лишнего?', '{Y} Сразу расскажи админам.', '', '{G} И да, это важнее всех коробок.'],
    110: () => ['{bB}{W} ПОГОДА В ДОМЕ                           ', '', '{C} СЕГОДНЯ:  {W}снег', '{C} ЗАВТРА:   {W}снег', '{C} ВСЕГДА:   {W}снег', '', '{Y} На окнах ожидается до 10 пикселей.', '{Y} Трясите окна, если мешает.', '', '{G} Внутри тепло. Камин на кассете.'],
    111: () => ['{bM}{Y} ГОРОСКОП ДЛЯ КОТИКОВ                    ', '', '{W} ' + new Date().toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'}), '', '{C} ' + horoscope[new Date().getDate() % horoscope.length], '', '{Y} Счастливая кассета:', '{W} ' + TAPES[new Date().getDate() % 5].label],
    120: () => ['{bB}{Y} ПРОГРАММА ПЕРЕДАЧ                       ', '', '{Y} Кассеты на полке рядом:', '', ...TAPES.filter((t) => !t.secret).map((t, i) => `{C} ${i + 1}. {W}${t.label}`), '', '{G} Просьба перематывать кассеты!', '', '{W} Часы на видике так никто', '{W} и не настроил.'],
    777: () => ['{bR}{Y} ДОСТУП РАЗРЕШЁН                         ', '', '{W} Ты нашёл страницу 777.', '', '{G} На полке появилась кассета,', '{G} которую лучше не смотреть.'],
  };
  const TXT_COLORS = {W: '#fff', Y: '#ffff3c', C: '#3cffff', G: '#3cff3c', M: '#ff3cff', R: '#ff3c3c', B: '#3c3cff', K: '#000'};
  function drawTeletext(x, page, input, wait, t) {
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    const cw = W / 40, lh = H / 24;
    x.font = `700 ${Math.floor(lh * 1.05)}px ${MONO}`; x.textBaseline = 'middle'; x.textAlign = 'left';
    const put = (col, row, s, fg, bg) => {
      if (bg) { x.fillStyle = bg; x.fillRect(col * cw, row * lh, s.length * cw + 1, lh + 1); }
      x.fillStyle = fg;
      for (let i = 0; i < s.length; i++) x.fillText(s[i], (col + i) * cw, row * lh + lh * .55);
    };
    const now = new Date(), clock = now.toLocaleTimeString('ru-RU');
    const shown = wait > 0 ? String(100 + Math.floor(t * 9) % 30) : String(page);
    put(0, 0, `P${(input + '___').slice(0, 3)}`, '#fff');
    put(6, 0, 'ФЕМБОЙТЕКСТ', '#ffff3c');
    put(18, 0, shown, '#3cffff');
    put(30, 0, clock, '#fff');
    if (wait > 0) return;
    const lines = (PAGES[page] || (() => ['', '', '{R}   СТРАНИЦА НЕ НАЙДЕНА', '', '{W}   Попробуй 100']))();
    lines.forEach((line, i) => {
      let col = 0, fg = '#fff', bg = null;
      line.split(/(\{b?[A-Z]\})/).forEach((part) => {
        const m = part.match(/^\{(b?)([A-Z])\}$/);
        if (m) { if (m[1]) bg = TXT_COLORS[m[2]]; else fg = TXT_COLORS[m[2]]; return; }
        if (part) { put(col, i + 2, part, fg, bg); col += part.length; }
      });
    });
  }

  function drawTest(x, t) {
    const bars = ['#fff', '#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f', '#111'];
    x.fillStyle = '#777'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 30, 0); x.lineTo(i * 30, H); x.stroke(); }
    for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(0, i * 30); x.lineTo(W, i * 30); x.stroke(); }
    x.save(); x.beginPath(); x.arc(W / 2, H / 2, 165, 0, 6.283); x.clip();
    x.fillStyle = '#222'; x.fillRect(0, 0, W, H);
    bars.forEach((c, i) => { x.fillStyle = c; x.fillRect(75 + i * 41.250, 62, 42, 100); });
    for (let i = 0; i < 12; i++) { const v = Math.floor(i / 11 * 255); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(75 + i * 27.500, 162, 28, 40); }
    x.fillStyle = '#000'; x.fillRect(75, 202, 330, 22);
    for (let i = 0; i < 22; i++) { x.fillStyle = i % 2 ? '#fff' : '#000'; x.fillRect(75 + i * 15, 202, 15, 22); }
    x.fillStyle = '#c23'; x.fillRect(75, 224, 110, 50);
    x.fillStyle = '#2a8'; x.fillRect(185, 224, 110, 50);
    x.fillStyle = '#24c'; x.fillRect(295, 224, 110, 50);
    x.restore();
    x.lineWidth = 3; x.strokeStyle = '#fff'; x.beginPath(); x.arc(W / 2, H / 2, 165, 0, 6.283); x.stroke();
    x.beginPath(); x.moveTo(W / 2, 15); x.lineTo(W / 2, 345); x.moveTo(75, H / 2); x.lineTo(405, H / 2); x.lineWidth = 1; x.stroke();
    x.fillStyle = '#000'; x.fillRect(150, 36, 180, 26);
    txt(x, 'ФЕМБОЙ-ТВ', W / 2, 49, 18, '#fff', {font: MONO});
    x.fillStyle = '#000'; x.fillRect(180, 296, 120, 26);
    txt(x, new Date().toLocaleTimeString('ru-RU'), W / 2, 309, 18, '#fff', {font: MONO});
  }

  wm.register('tv', {
    title: 'Видик', icon: 'tv', w: 860, h: 640, minW: 420, minH: 360, dx: 10, dy: 0,
    mount(body, win) {
      loadArt();
      body.classList.add('tv');
      body.innerHTML = `<div class="tv-main">
          <div class="tv-set">
            <div class="tv-bezel"><div class="tv-glass"><canvas width="640" height="480" aria-label="Экран телевизора"></canvas></div></div>
            <div class="tv-side">
              <div class="tv-brand">КОТИК-16Ц<small>цветной</small></div>
              <button class="knob" type="button" data-a="ch+" aria-label="Следующий канал" title="Канал"></button><label>канал</label>
              <button class="knob" type="button" data-a="vol" aria-label="Громкость" title="Громкость"></button><label>громк.</label>
              <div class="tv-grille"></div>
              <i class="tv-led"></i>
              <button class="tv-power" type="button" data-a="power" aria-label="Питание">ВКЛ</button>
            </div>
          </div>
          <div class="vcr">
            <div class="vcr-top">
              <div class="vcr-slot"><div class="vcr-flap">ВМ-КОТ · VHS</div></div>
              <div class="vcr-vfd"><span class="vfd-main"></span><small class="vfd-sub"></small></div>
            </div>
            <div class="vcr-ctl">
              <button class="vbtn" type="button" data-t="rew" title="Перемотка назад" aria-label="Перемотка назад">◄◄</button>
              <button class="vbtn" type="button" data-t="play" title="Воспроизведение" aria-label="Воспроизведение">►</button>
              <button class="vbtn" type="button" data-t="pause" title="Пауза" aria-label="Пауза">❚❚</button>
              <button class="vbtn" type="button" data-t="stop" title="Стоп" aria-label="Стоп">■</button>
              <button class="vbtn" type="button" data-t="ff" title="Перемотка вперёд" aria-label="Перемотка вперёд">►►</button>
              <button class="vbtn eject" type="button" data-a="eject" title="Достать кассету" aria-label="Достать кассету">⏏</button>
              <button class="vbtn" type="button" data-a="clock" title="Настроить часы" aria-label="Настроить часы">ЧАСЫ</button>
              <label class="vcr-track">Трекинг<input class="xp-range" type="range" min="0" max="100" value="50" aria-label="Трекинг"></label>
              <button class="vbtn" type="button" data-a="auto" title="Настроить трекинг сам" aria-label="Автотрекинг">АВТО</button>
            </div>
          </div>
          <div class="tv-cta" hidden><span class="tv-cta-t"></span><a class="xp-btn def" target="_blank" rel="noopener noreferrer"></a></div>
        </div>
        <aside class="tv-aside">
          <div class="tv-panel"><h5>Кассеты</h5><div class="tv-shelf"></div></div>
          <div class="tv-panel"><h5>Пульт</h5>
            <div class="remote">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="rb" type="button" data-n="${n}">${n}</button>`).join('')}
              <button class="rb" type="button" data-a="ch-" aria-label="Канал назад">К−</button>
              <button class="rb" type="button" data-n="0">0</button>
              <button class="rb" type="button" data-a="ch+" aria-label="Канал вперёд">К+</button>
              <button class="rb wide" type="button" data-a="txt">Телетекст</button>
              <button class="rb wide" type="button" data-a="av">Видео (кассета)</button>
              <div class="remote-colors">
                <button class="rb" type="button" data-page="101" style="background:#d83a3a" aria-label="Страница 101"></button>
                <button class="rb" type="button" data-page="102" style="background:#2f9e33" aria-label="Страница 102"></button>
                <button class="rb" type="button" data-page="103" style="background:#e0b400" aria-label="Страница 103"></button>
                <button class="rb" type="button" data-page="100" style="background:#2aa8d8" aria-label="Страница 100"></button>
              </div>
            </div>
          </div>
          <p class="tv-tip">Вставь кассету и нажимай кнопки. Если плывут полосы, покрути трекинг.</p>
        </aside>`;

      const cv = $('.tv-glass canvas', body), src = document.createElement('canvas');
      src.width = W; src.height = H;
      const x = src.getContext('2d');
      const gl = FH.crt(cv);
      const fallback = gl ? null : cv.getContext('2d');
      const shelf = $('.tv-shelf', body), vfdMain = $('.vfd-main', body), vfdSub = $('.vfd-sub', body), flap = $('.vcr-flap', body), cta = $('.tv-cta', body), trackInput = $('.vcr-track input', body);

      // состояние
      let power = false, powerK = 0, input = 'AV', tape = null, state = 'stop', loading = 0, stateAt = 0;
      let positions = store.get('tvPos', {}), pos = 0, tracking = 50, needTrack = 50, auto = 0;
      let txtPage = 100, txtInput = '', txtWait = 0, chan = 1, clockSet = store.get('tvClock', false), vol = store.get('tvVol', .8), bandAt = .6, watched = 0;
      let raf = 0, last = 0, tSec = 0, lastStep = -1;

      // звук
      const ac = sound.ctx();
      let bus = null, hissG = null, whirrG = null, noiseBuf = null, toneG = null;
      if (ac) {
        bus = ac.createGain(); bus.gain.value = vol;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
        bus.connect(lp).connect(sound.master);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.500, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const h = ac.createBufferSource(); h.buffer = noiseBuf; h.loop = true;
        const hf = ac.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 1800;
        hissG = ac.createGain(); hissG.gain.value = 0;
        h.connect(hf).connect(hissG).connect(bus); h.start();
        const wo = ac.createOscillator(); wo.type = 'sawtooth'; wo.frequency.value = 190;
        const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 1500;
        whirrG = ac.createGain(); whirrG.gain.value = 0;
        wo.connect(wf).connect(whirrG).connect(bus); wo.start();
        const to = ac.createOscillator(); to.frequency.value = 1000;
        toneG = ac.createGain(); toneG.gain.value = 0;
        to.connect(toneG).connect(bus); to.start();
        win.audioNodes = [h, wo, to];
      }
      const tone = (m, g, type, len = .3) => {
        if (!bus) return;
        const t = ac.currentTime + .005, o = ac.createOscillator(), a = ac.createGain();
        o.type = type; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
        o.detune.value = (Math.random() - .5) * 18;
        a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .012); a.gain.exponentialRampToValueAtTime(.0001, t + len);
        o.connect(a).connect(bus); o.start(t); o.stop(t + len + .03);
      };
      const clunk = (g = .32, f = 600) => {
        if (!bus) return;
        const t = ac.currentTime, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), a = ac.createGain();
        s.buffer = noiseBuf; fl.type = 'lowpass'; fl.frequency.value = f;
        a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.0001, t + .09);
        s.connect(fl).connect(a).connect(bus); s.start(t, Math.random()); s.stop(t + .1);
        tone(40, g * .6, 'sine', .08);
      };
      const crackle = () => {
        if (!bus) return;
        const t = ac.currentTime, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), a = ac.createGain();
        s.buffer = noiseBuf; fl.type = 'bandpass'; fl.frequency.value = 1400 + Math.random() * 2600; fl.Q.value = 1.500;
        a.gain.setValueAtTime(.05 + Math.random() * .12, t); a.gain.exponentialRampToValueAtTime(.0001, t + .02 + Math.random() * .05);
        s.connect(fl).connect(a).connect(bus); s.start(t, Math.random()); s.stop(t + .09);
      };

      // ---------- полка
      function renderShelf() {
        const list = TAPES.filter((t) => !t.secret || store.get('secretTape', false));
        shelf.innerHTML = list.map((t) => `<button class="tp" type="button" data-tape="${t.id}" style="--lb:${t.lb}" ${tape === t ? 'disabled' : ''}><i></i><b>${esc(t.label)}</b></button>`).join('');
      }
      FH.onSecret = renderShelf;

      const savePos = () => { if (tape) { positions[tape.id] = pos; store.set('tvPos', positions); } };
      function setState(s) {
        if (s !== state) { state = s; stateAt = tSec; lastStep = -1; }
        $$('[data-t]', body).forEach((b) => b.classList.toggle('on', b.dataset.t === state));
        savePos();
      }
      function insert(id, from) {
        if (!power) powerOn();
        const t = tapeOf(id);
        if (!t) return;
        if (tape) eject(true);
        input = 'AV';
        // кассета едет с полки в щель
        const slot = $('.vcr-slot', body).getBoundingClientRect();
        if (from && !reduce && from.animate) {
          const r = from.getBoundingClientRect();
          const fly = html('<div class="fly-tape"></div>');
          fly.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px`;
          document.body.append(fly);
          fly.animate([{transform: 'none'}, {transform: `translate(${slot.left - r.left}px, ${slot.top - r.top}px) scale(.8, .7)`, opacity: .9}], {duration: 360, easing: 'cubic-bezier(.4,.1,.5,1)'}).onfinish = () => fly.remove();
          setTimeout(() => fly.remove(), 500);
        }
        flap.classList.add('open');
        setTimeout(() => flap.classList.remove('open'), 420);
        clunk(.36, 900);
        setTimeout(() => clunk(.24, 500), 330);
        tape = t;
        pos = positions[t.id] || 0;
        if (pos >= t.len) pos = 0;
        watched = 0;
        loading = 1.100;
        needTrack = 25 + Math.random() * 50;
        body.classList.add('has-tape');
        flap.textContent = 'КАССЕТА';
        renderShelf();
        setState('play');
        paintCta();
      }
      function eject(silent) {
        if (!tape) return;
        savePos();
        tape = null; pos = 0;
        setState('stop');
        if (!silent) { clunk(.36, 900); flap.classList.add('open'); setTimeout(() => flap.classList.remove('open'), 420); }
        body.classList.remove('has-tape');
        flap.textContent = 'ВМ-КОТ · VHS';
        renderShelf();
        paintCta();
      }
      function paintCta() {
        const c = tape && input === 'AV' && tape.cta;
        cta.hidden = !c;
        if (c) { $('.tv-cta-t', cta).textContent = c.text; const a = $('a', cta); a.href = c.href; a.textContent = c.btn; }
      }
      function powerOn() { power = true; body.classList.add('on'); clunk(.3, 300); $('.tv-power', body).textContent = 'ВЫКЛ'; }
      function powerOff() { power = false; body.classList.remove('on'); clunk(.25, 300); setState(tape && state === 'play' ? 'pause' : state); $('.tv-power', body).textContent = 'ВКЛ'; }
      function channel(d) {
        const list = ['AV', 1, 2, 3], i = list.indexOf(input === 'AV' ? 'AV' : chan);
        const next = list[(i + d + list.length) % list.length];
        if (next === 'AV') input = 'AV'; else { input = 'TV'; chan = next; }
        if (chan === 2 && input === 'TV' && FH.ach) FH.ach.give('teletext');
        clunk(.12, 1200);
        stateAt = tSec;
        paintCta();
      }
      function teletext(page) {
        if (!power) powerOn();
        input = 'TV'; chan = 2; txtPage = page; txtInput = ''; txtWait = .9;
        if (FH.ach) FH.ach.give('teletext');
        if (page === 777) FH.unlockSecret();
        paintCta();
      }
      function digit(n) {
        if (!power) powerOn();
        if (input === 'TV' && chan === 2) {
          txtInput += n;
          if (txtInput.length === 3) { const p = +txtInput; teletext(p); }
          return;
        }
        if (n >= 1 && n <= 3) { input = 'TV'; chan = n; stateAt = tSec; clunk(.12, 1200); if (n === 2 && FH.ach) FH.ach.give('teletext'); paintCta(); }
      }

      // ---------- кадр
      function drawOsd(text) {
        x.font = `700 26px ${MONO}`; x.textAlign = 'left'; x.textBaseline = 'top';
        x.fillStyle = 'rgba(0,0,0,.5)'; x.fillText(text, 23, 21);
        x.fillStyle = '#fff'; x.fillText(text, 21, 19);
      }
      const counter = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
      function drawSource() {
        if (input === 'TV') {
          if (chan === 1) drawTest(x, tSec);
          else if (chan === 2) drawTeletext(x, txtPage, txtInput, txtWait, tSec);
          else { x.fillStyle = '#222'; x.fillRect(0, 0, W, H); }
          if (tSec - stateAt < 2.500 && chan !== 2) drawOsd(`КАНАЛ ${chan}`);
          return;
        }
        if (!tape || state === 'stop' || loading > 0) {
          x.fillStyle = '#1a2fd0'; x.fillRect(0, 0, W, H);
          drawOsd('ВИДЕО 1');
          if (!tape) txt(x, 'НЕТ КАССЕТЫ', W / 2, H / 2, 30, '#fff', {font: MONO});
          else if (loading > 0) txt(x, 'ЗАГРУЗКА…', W / 2, H / 2, 30, '#fff', {font: MONO});
          else {
            txt(x, 'СТОП ■', W / 2, H / 2 - 18, 30, '#fff', {font: MONO});
            txt(x, tape.label.toUpperCase(), W / 2, H / 2 + 22, 18, '#bfd0ff', {font: MONO});
            if (pos >= tape.len - .1) txt(x, 'ПРОСЬБА ПЕРЕМОТАТЬ!', W / 2, H / 2 + 56, 18, '#ffe14d', {font: MONO});
          }
          return;
        }
        tape.draw(x, pos);
        const labels = {play: 'PLAY ►', pause: 'PAUSE ❚❚', ff: 'F.FWD ►►', rew: 'REW ◄◄'};
        if (tSec - stateAt < 3 || state !== 'play') {
          drawOsd(labels[state]);
          x.font = `700 20px ${MONO}`; x.textAlign = 'right'; x.textBaseline = 'bottom';
          x.fillStyle = '#fff'; x.fillText(counter(pos), W - 20, H - 18);
        }
      }

      function step(dt) {
        tSec += dt;
        powerK = clamp(powerK + (power ? dt * 3 : -dt * 4.500), 0, 1);
        if (loading > 0) loading -= dt;
        if (txtWait > 0) txtWait -= dt;
        if (auto) {
          tracking += (needTrack - tracking) * Math.min(1, dt * 3.500);
          trackInput.value = tracking;
          if (Math.abs(needTrack - tracking) < .6) { auto = 0; tracking = needTrack; }
        }
        if (tape && loading <= 0) {
          const fast = Math.max(16, tape.len / 25);
          if (state === 'play') { pos += dt; watched += dt; if (watched > 12 && FH.ach) FH.ach.give('tape'); if (tape.secret && watched > 8 && FH.ach) FH.ach.give('secretWatch'); }
          else if (state === 'ff') pos += dt * fast;
          else if (state === 'rew') pos -= dt * fast;
          if (pos >= tape.len) {
            pos = tape.len;
            if (state === 'play' || state === 'ff') { setState('stop'); clunk(.3, 800); }
          }
          if (pos <= 0) {
            pos = 0;
            if (state === 'rew') { setState('stop'); clunk(.34, 800); if (FH.ach) FH.ach.give('rewind'); }
          }
        }
        const isPlay = power && input === 'AV' && tape && loading <= 0;
        // звук
        if (bus) {
          const t = ac.currentTime, moving = isPlay && (state === 'ff' || state === 'rew');
          whirrG.gain.setTargetAtTime(moving ? .035 : 0, t, .05);
          const tuned = input === 'TV' && chan === 3;
          hissG.gain.setTargetAtTime(!power ? 0 : tuned ? .1 : isPlay && state === 'play' ? .012 + err() * .05 : .004, t, .05);
          toneG.gain.setTargetAtTime(power && input === 'TV' && chan === 1 ? .008 : 0, t, .05);
          if (isPlay && state === 'play' && tape.music) {
            const m = tape.music, st = Math.floor(pos * m.bpm / 60 * 2);
            if (st !== lastStep) {
              lastStep = st;
              const L = m.lead[st % m.lead.length], B = m.bass.length ? m.bass[st % m.bass.length] : 0;
              if (L) tone(L, m.g, m.type, .28);
              if (B) tone(B, m.g * 1.500, 'triangle', .3);
            }
          }
          if (isPlay && state === 'play' && tape.crackle && Math.random() < dt * 9) crackle();
        }
      }
      const err = () => clamp(Math.abs(tracking - needTrack) / 45, 0, 1);

      function render() {
        const isTape = input === 'AV' && tape && loading <= 0 && state !== 'stop';
        const o = {t: tSec, curve: .07, power: powerK, scan: .13, wobble: .15, chroma: .35, noise: .04, bands: 0, jitter: 0, snow: 0};
        bandAt = (bandAt + .0012 + (state === 'ff' || state === 'rew' ? .018 : 0)) % 1;
        o.bandAt = bandAt;
        if (isTape) {
          const e = err();
          o.wobble = .75 + e * 1.200; o.chroma = 1; o.noise = .14 + e * .75; o.bands = .03 + e * 1.100;
          if (state === 'pause') { o.bands = .55; o.bandAt = .22 + Math.sin(tSec * .4) * .02; o.jitter = 1; o.noise = .3; }
          if (state === 'ff' || state === 'rew') { o.bands = 1.100; o.noise = .55; o.wobble = 1.800; }
        } else if (input === 'AV') { o.wobble = .3; o.chroma = .55; o.noise = .06; if (loading > 0) { o.bands = 1; o.noise = .6; o.snow = .2; } }
        if (input === 'TV' && chan === 3) { o.snow = 1; o.noise = .4; }
        if (input === 'TV' && chan === 2) { o.chroma = .15; o.wobble = .06; o.scan = .08; }
        if (powerK > 0) drawSource();
        if (gl) gl.render(src, o);
        else {
          fallback.fillStyle = '#000'; fallback.fillRect(0, 0, cv.width, cv.height);
          if (powerK > 0) { fallback.globalAlpha = powerK; fallback.drawImage(src, 0, 0, cv.width, cv.height); fallback.globalAlpha = 1; }
        }
        paintVfd();
      }
      function paintVfd() {
        if (tape) { vfdMain.textContent = counter(pos); vfdSub.textContent = {play: 'PLAY', pause: 'PAUSE', ff: 'FF', rew: 'REW', stop: 'STOP'}[state]; vfdMain.className = 'vfd-main'; }
        else if (clockSet) { vfdMain.textContent = new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}); vfdSub.textContent = 'ЧАСЫ'; vfdMain.className = 'vfd-main'; }
        else { vfdMain.textContent = '12:00'; vfdSub.textContent = 'ЧАСЫ?'; vfdMain.className = 'vfd-main blink'; }
      }
      function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, .05);
        last = now;
        step(dt);
        render();
      }

      // ---------- управление
      body.addEventListener('click', (e) => {
        const tp = e.target.closest('[data-tape]');
        if (tp) { insert(tp.dataset.tape, tp); return; }
        const tr = e.target.closest('[data-t]');
        if (tr) {
          if (!tape) { sound.err(); return; }
          if (!power) powerOn();
          const s = tr.dataset.t;
          clunk(.14, 1400);
          if (s === 'stop') setState('stop');
          else if (s === 'pause') setState(state === 'pause' ? 'play' : 'pause');
          else setState(state === s ? 'play' : s);
          input = 'AV';
          paintCta();
          return;
        }
        const n = e.target.closest('[data-n]');
        if (n) { digit(n.dataset.n); clunk(.06, 2200); return; }
        const pg = e.target.closest('[data-page]');
        if (pg) { teletext(+pg.dataset.page); return; }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        const k = a.dataset.a;
        if (k === 'power') { if (power) powerOff(); else powerOn(); }
        if (k === 'ch+') { if (!power) powerOn(); channel(1); }
        if (k === 'ch-') { if (!power) powerOn(); channel(-1); }
        if (k === 'eject') eject();
        if (k === 'av') { if (!power) powerOn(); input = 'AV'; stateAt = tSec; paintCta(); }
        if (k === 'txt') teletext(100);
        if (k === 'auto') auto = 1;
        if (k === 'vol') {
          vol = vol > .9 ? .25 : vol + .25;
          if (bus) bus.gain.value = vol;
          store.set('tvVol', vol);
          a.style.transform = `rotate(${(vol - .5) * 220}deg)`;
        }
        if (k === 'clock') {
          clockSet = !clockSet;
          store.set('tvClock', clockSet);
          clunk(.1, 1800);
          if (clockSet && FH.ach) FH.ach.give('clock');
        }
      });
      $('[data-a=vol]', body).style.transform = `rotate(${(vol - .5) * 220}deg)`;
      trackInput.addEventListener('input', () => { tracking = +trackInput.value; auto = 0; });
      const onKey = (e) => {
        if (wm.active !== 'tv' || e.target.tagName === 'INPUT') return;
        if (/^[0-9]$/.test(e.key)) digit(e.key);
        if (e.key === ' ') { e.preventDefault(); if (tape) setState(state === 'play' ? 'pause' : 'play'); }
      };
      document.addEventListener('keydown', onKey);

      function fit() {
        const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.5);
        const w = Math.max(320, Math.round(r.width * d)), h = Math.max(240, Math.round(r.height * d));
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      }
      const ro = new ResizeObserver(fit);
      ro.observe($('.tv-glass', body));

      const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
      const halt = () => { cancelAnimationFrame(raf); raf = 0; };
      win.onHide = () => { halt(); if (hissG) { hissG.gain.value = 0; whirrG.gain.value = 0; toneG.gain.value = 0; } };
      win.onShow = run;
      win.onClose = () => {
        halt();
        savePos();
        ro.disconnect();
        document.removeEventListener('keydown', onKey);
        FH.onSecret = null;
        if (bus) { bus.gain.setTargetAtTime(0, ac.currentTime, .03); setTimeout(() => { (win.audioNodes || []).forEach((n) => { try { n.stop(); } catch (e) { /* уже стоит */ } }); try { bus.disconnect(); } catch (e) { /* уже отключено */ } }, 300); }
      };
      renderShelf();
      setState('stop');
      powerOn();
      run();
      requestAnimationFrame(fit);
    },
  });
})();

// Мини-игра по мотивам «Украсть коробку» в Роблоксе: схвати коробку в центре и донеси до своей базы.
(() => {
  const { $, clamp, coarse, reduce, store, sound, links } = FH;
  const wm = FH.wm;
  const ROUND = 60;
  const TEAMS = [
    {name: 'Ты', c: '#ffffff', ink: '#2a2a44', ribbon: '#e0327f'},
    {name: 'Розочка', c: '#ff9ccb', ink: '#a61e63', ribbon: '#a61e63'},
    {name: 'Льдинка', c: '#7fc8ff', ink: '#14609e', ribbon: '#14609e'},
    {name: 'Мята', c: '#8fe6b4', ink: '#1f7a4a', ribbon: '#1f7a4a'},
  ];
  // поле бывает лежачим и стоячим: на телефоне в вертикальном положении оно занимает весь экран
  let LW, LH, CX, CY, tall, BASES, BUSHES;
  function layout(portrait) {
    tall = portrait;
    LW = portrait ? 450 : 720; LH = portrait ? 720 : 450;
    CX = LW / 2; CY = LH / 2;
    const top = portrait ? 150 : 112, bot = LH - 102, right = LW - 112;
    BASES = [[112, bot], [112, top], [right, top], [right, bot]].map(([x, y], i) => ({...TEAMS[i], x, y}));
    BUSHES = portrait
      ? [{x: 112, y: 262, r: 20}, {x: right, y: 262, r: 20}, {x: 112, y: 458, r: 20}, {x: right, y: 458, r: 20}, {x: CX, y: 232, r: 18}, {x: CX, y: 488, r: 18}]
      : [{x: 262, y: 118, r: 20}, {x: 458, y: 118, r: 20}, {x: 262, y: 332, r: 20}, {x: 458, y: 332, r: 20}, {x: 196, y: CY, r: 18}, {x: 524, y: CY, r: 18}];
  }
  layout(false);

  function renderMap(s) {
    const c = document.createElement('canvas');
    c.width = LW * s; c.height = LH * s;
    const x = c.getContext('2d');
    x.scale(s, s);
    // трава в кубиках, как на карте в Роблоксе
    x.fillStyle = '#b5e08a';
    x.fillRect(0, 0, LW, LH);
    for (let j = 0; j < LH; j += 15) for (let i = 0; i < LW; i += 15) {
      x.fillStyle = (i + j) % 30 ? 'rgba(255,255,255,.1)' : 'rgba(70,150,60,.08)';
      x.beginPath(); x.arc(i + 7.5, j + 7.5, 4.200, 0, 6.283); x.fill();
    }
    // дорожки
    const path = (px, py, w, h) => {
      x.fillStyle = '#f7f4ea'; x.fillRect(px, py, w, h);
      x.strokeStyle = '#6fe0d8'; x.lineWidth = 2.500; x.strokeRect(px, py, w, h);
    };
    path(CX - 30, 26, 60, LH - 46);
    path(24, CY - 29, LW - 48, 58);
    x.fillStyle = '#f7f4ea'; x.fillRect(CX - 28, CY - 29, 56, 58);
    // базы
    BASES.forEach((b) => {
      const w = 150, h = 112, l = b.x - w / 2, t = b.y - h / 2;
      x.fillStyle = 'rgba(40,20,90,.14)';
      rr(x, l + 2, t + 4, w, h, 12); x.fill();
      x.fillStyle = '#e0d8f8'; rr(x, l, t, w, h, 12); x.fill();
      x.strokeStyle = '#7ad8e0'; x.lineWidth = 3; x.setLineDash([9, 6]); rr(x, l + 4, t + 4, w - 8, h - 8, 9); x.stroke(); x.setLineDash([]);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.beginPath(); x.arc(l + 33 + i * 42, t + 36 + j * 40, 12, 0, 6.283); x.fill();
      }
      x.fillStyle = b.c; x.strokeStyle = b.ink; x.lineWidth = 2;
      x.beginPath(); x.arc(b.x, b.y, 22, 0, 6.283); x.fill(); x.stroke();
      x.fillStyle = b.ink;
      x.font = '700 11px Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(b.name === 'Ты' ? 'ТЫ' : '★', b.x, b.y + 1);
    });
    // центральная площадка
    x.fillStyle = 'rgba(111,224,216,.32)';
    x.beginPath(); x.arc(CX, CY, 44, 0, 6.283); x.fill();
    x.strokeStyle = '#3fcfc6'; x.lineWidth = 4;
    x.beginPath(); x.arc(CX, CY, 37, 0, 6.283); x.stroke();
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(CX, CY, 30, 0, 6.283); x.fill();
    // кусты
    BUSHES.forEach((b) => {
      x.fillStyle = 'rgba(30,70,30,.22)';
      x.beginPath(); x.ellipse(b.x + 2, b.y + 7, b.r, b.r * .7, 0, 0, 6.283); x.fill();
      [[0, 0, 1], [-.6, .2, .66], [.6, .2, .66], [0, -.5, .66]].forEach(([dx, dy, k]) => {
        x.fillStyle = k === 1 ? '#56b35a' : '#6fca63';
        x.beginPath(); x.arc(b.x + dx * b.r, b.y + dy * b.r, b.r * k, 0, 6.283); x.fill();
      });
      x.fillStyle = 'rgba(255,255,255,.35)';
      x.beginPath(); x.arc(b.x - b.r * .3, b.y - b.r * .5, b.r * .2, 0, 6.283); x.fill();
    });
    // стены
    const wall = (px, py, w, h) => {
      const g = x.createLinearGradient(px, py, px, py + h);
      g.addColorStop(0, '#ffe7c4'); g.addColorStop(1, '#f2c896');
      x.fillStyle = g; x.fillRect(px, py, w, h);
    };
    wall(0, 0, LW, 22); wall(0, LH - 16, LW, 16); wall(0, 0, 16, LH); wall(LW - 16, 0, 16, LH);
    x.fillStyle = '#fff6e8';
    for (let i = 40; i < LW; i += 76) { x.fillRect(i, 2, 8, 18); x.fillRect(i, LH - 14, 8, 12); }
    for (let i = 40; i < LH - 20; i += 76) { x.fillRect(3, i, 10, 8); x.fillRect(LW - 13, i, 10, 8); }
    x.strokeStyle = 'rgba(120,80,40,.3)'; x.lineWidth = 1;
    x.strokeRect(16, 22, LW - 32, LH - 38);
    // вывеска, как на карте в игре
    x.fillStyle = 'rgba(40,0,40,.25)'; rr(x, CX - 112, 3, 224, 26, 3); x.fill();
    const sg = x.createLinearGradient(0, 0, 0, 26);
    sg.addColorStop(0, '#d14bb2'); sg.addColorStop(1, '#a42f90');
    x.fillStyle = sg; rr(x, CX - 114, 1, 228, 25, 3); x.fill();
    x.strokeStyle = '#ffe08a'; x.lineWidth = 1.500; rr(x, CX - 114, 1, 228, 25, 3); x.stroke();
    x.fillStyle = '#fff'; x.font = '900 14px "Trebuchet MS", Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('УКРАДИ КОРОБКУ!', CX, 14);
    return c;
  }
  function rr(x, l, t, w, h, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }

  function drawCat(x, p, t) {
    const bob = p.moving ? Math.sin(t * 16 + p.seed) * 2 : Math.sin(t * 2 + p.seed) * .6, R = 15;
    x.save();
    x.translate(p.x, p.y);
    x.fillStyle = 'rgba(30,30,70,.25)';
    x.beginPath(); x.ellipse(0, R - 2, R * .9, R * .4, 0, 0, 6.283); x.fill();
    x.translate(0, bob - 4);
    if (p.dash > 0) { x.globalAlpha = .4; x.fillStyle = p.base.c; x.beginPath(); x.arc(-p.fx * 16, -p.fy * 16, R, 0, 6.283); x.fill(); x.globalAlpha = 1; }
    if (p.stun > 0) x.globalAlpha = .55 + Math.sin(t * 30) * .3;
    x.strokeStyle = '#3a3f55'; x.lineWidth = 2; x.lineJoin = 'round';
    x.fillStyle = p.base.c;
    x.beginPath(); x.moveTo(-13, -8); x.lineTo(-13, -22); x.lineTo(-3, -13); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(13, -8); x.lineTo(13, -22); x.lineTo(3, -13); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.arc(0, 0, R, 0, 6.283); x.fill(); x.stroke();
    x.fillStyle = '#ffb6d5';
    x.fillRect(-11, 3, 5, 2); x.fillRect(6, 3, 5, 2);
    const look = p.fx || 0;
    x.fillStyle = '#14161f';
    x.beginPath(); x.ellipse(-5 + look * 2, -2, 2.300, 3.300, 0, 0, 6.283); x.fill();
    x.beginPath(); x.ellipse(5 + look * 2, -2, 2.300, 3.300, 0, 0, 6.283); x.fill();
    x.fillStyle = '#ff8fb8';
    x.beginPath(); x.moveTo(-2, 4); x.lineTo(2, 4); x.lineTo(0, 7); x.closePath(); x.fill();
    if (p.me) {
      x.fillStyle = '#d6304a';
      x.beginPath(); x.moveTo(-12, -11); x.quadraticCurveTo(0, -30, 13, -11); x.closePath(); x.fill();
      x.fillStyle = '#fff';
      x.beginPath(); x.ellipse(0, -11, 13, 3.200, 0, 0, 6.283); x.fill();
      x.beginPath(); x.arc(13, -21, 3.500, 0, 6.283); x.fill();
    }
    x.restore();
  }
  function drawBox(x, bx, by, scale = 1, t = 0) {
    x.save();
    x.translate(bx, by + Math.sin(t * 3) * 1.500);
    x.scale(scale, scale);
    x.fillStyle = 'rgba(40,20,60,.25)';
    x.beginPath(); x.ellipse(0, 13, 14, 4.500, 0, 0, 6.283); x.fill();
    x.strokeStyle = '#a61e63'; x.lineWidth = 1.800; x.lineJoin = 'round';
    x.fillStyle = '#f0609f'; rr(x, -13, -8, 26, 20, 2); x.fill(); x.stroke();
    x.fillStyle = '#ff8cc2'; rr(x, -15, -13, 30, 8, 2); x.fill(); x.stroke();
    x.fillStyle = '#fff'; x.fillRect(-3, -13, 6, 25);
    x.beginPath(); x.moveTo(0, -13); x.bezierCurveTo(-4, -24, -14, -21, -11, -16); x.bezierCurveTo(-9, -13, -3, -13, 0, -13); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(0, -13); x.bezierCurveTo(4, -24, 14, -21, 11, -16); x.bezierCurveTo(9, -13, 3, -13, 0, -13); x.fill(); x.stroke();
    x.restore();
  }

  wm.register('box', {
    title: 'Украсть коробку: мини-игра', icon: 'box', w: 760, h: 560, minW: 380, minH: 300, dx: 10, dy: 0,
    mount(body, win) {
      body.classList.add('bx');
      body.innerHTML = `<div class="bx-stage"><canvas></canvas>
          <button class="bx-dash" type="button" aria-label="Рывок" hidden>Рывок</button>
          <div class="bx-over" role="status"></div>
        </div>`;
      const stage = $('.bx-stage', body), cv = $('canvas', body), x = cv.getContext('2d'), over = $('.bx-over', body), dashBtn = $('.bx-dash', body);
      const [stL, stR] = win.addStatus(['', '']);
      let map = null, scale = 1, dpr = 1, raf = 0, last = 0, state = 'intro', timeLeft = ROUND, best = store.get('boxBest', 0);
      let players = [], box = null, parts = [], floats = [], t = 0, shake = 0, lastBeep = 99, keys = {}, stick = null;
      stR.textContent = `Рекорд: ${best}`;

      function fit() {
        const r = stage.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) return;
        dpr = Math.min(devicePixelRatio || 1, 2);
        // посреди раунда поле не перестраиваем, иначе игроки окажутся не там
        const wantTall = r.height > r.width * 1.1;
        if (wantTall !== tall && state !== 'play' && state !== 'pause') { layout(wantTall); players = []; }
        const k = Math.min(r.width / LW, r.height / LH);
        const w = Math.floor(LW * k), h = Math.floor(LH * k);
        cv.width = w * dpr; cv.height = h * dpr;
        cv.style.width = w + 'px'; cv.style.height = h + 'px';
        scale = k * dpr;
        map = renderMap(Math.max(.5, scale));
        draw();
      }

      function reset() {
        players = BASES.map((b, i) => ({base: b, me: i === 0, x: b.x, y: b.y, vx: 0, vy: 0, fx: 0, fy: 1, score: 0, dash: 0, cool: 0, stun: 0, safe: 0, moving: false, seed: i * 2, tx: b.x, ty: b.y, think: 0}));
        box = {x: CX, y: CY, carrier: null, wait: 0, pop: 1};
        parts = []; floats = [];
        timeLeft = ROUND;
        lastBeep = 99;
      }

      function setOver(html) {
        over.innerHTML = html;
        over.hidden = !html;
      }
      function intro() {
        state = 'intro';
        setOver(`<div class="bx-card">
          <h3>Украсть коробку</h3>
          <p>Схвати розовую коробку в центре и донеси до своей базы внизу слева. Соперники будут её отбирать. Коснись несущего, и коробка твоя.</p>
          <ul class="bx-keys">${coarse ? '<li><b>Веди пальцем</b> по полю, чтобы бежать</li><li><b>Рывок</b> кнопкой справа</li>' : '<li><b>WASD</b> или <b>стрелки</b>: бежать</li><li><b>Пробел</b>: рывок</li>'}</ul>
          <button class="xp-btn def big" type="button" data-go>Начать</button>
          <small>На раунд 60 секунд. Рекорд: ${best}</small>
        </div>`);
      }
      function start() {
        reset();
        state = 'play';
        setOver('');
        dashBtn.hidden = !coarse;
        sound.pick();
        last = performance.now();
        loop(last);
      }
      function pause() {
        if (state !== 'play') return;
        state = 'pause';
        cancelAnimationFrame(raf); raf = 0;
        setOver('<div class="bx-card sm"><h3>Пауза</h3><button class="xp-btn def big" type="button" data-resume>Продолжить</button></div>');
        keys = {};
      }
      function resume() {
        state = 'play';
        setOver('');
        last = performance.now();
        loop(last);
      }
      function finish() {
        state = 'end';
        cancelAnimationFrame(raf); raf = 0;
        dashBtn.hidden = true;
        const me = players[0], ranked = [...players].sort((a, b) => b.score - a.score), place = ranked.indexOf(me) + 1, top = me.score >= ranked[0].score;
        const record = me.score > best;
        if (FH.ach) {
          if (me.score >= 5) FH.ach.give('box5');
          if (top && me.score > 0) FH.ach.give('boxwin');
        }
        if (record) { best = me.score; store.set('boxBest', best); stR.textContent = `Рекорд: ${best}`; }
        if (top && me.score > 0) {
          sound.win();
          const r = cv.getBoundingClientRect();
          FH.fx.spawn(r.left + r.width / 2, r.top + r.height / 3, {kind: 'paper', n: 80, power: 520});
        } else sound.lose();
        setOver(`<div class="bx-card">
          <h3>${top && me.score > 0 ? 'Коробка твоя!' : 'Время вышло'}</h3>
          <p class="bx-res">Место: <b>${place}</b> из 4 · Украдено коробок: <b>${me.score}</b>${record ? ' · <b class="rec">новый рекорд</b>' : ''}</p>
          <ol class="bx-rank">${ranked.map((p) => `<li class="${p.me ? 'me' : ''}"><i style="background:${p.base.c}"></i>${p.base.name}<b>${p.score}</b></li>`).join('')}</ol>
          <div class="bx-acts"><button class="xp-btn big" type="button" data-go>Ещё раз</button><a class="xp-btn def big" href="${links.game}" target="_blank" rel="noopener noreferrer">Настоящая игра в Роблоксе</a></div>
        </div>`);
      }

      over.addEventListener('click', (e) => {
        if (e.target.closest('[data-go]')) start();
        if (e.target.closest('[data-resume]')) resume();
      });

      function scorePoint(p) {
        p.score++;
        floats.push({x: p.base.x, y: p.base.y - 30, t: 0, s: p.me ? '+1' : '+1', c: p.me ? '#e0327f' : p.base.ink});
        burst(p.base.x, p.base.y, p.base.c === '#ffffff' ? '#ff6fb0' : p.base.c, 26);
        if (p.me) { sound.win(); shake = 6; if (FH.ach) FH.ach.give('box1'); } else sound.lose();
        box.carrier = null;
        box.wait = .7;
        box.pop = 0;
        box.x = CX; box.y = CY;
      }
      function burst(px, py, c, n) {
        if (reduce) return;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.283, v = 40 + Math.random() * 170;
          parts.push({x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: .4 + Math.random() * .5, c, r: 1.500 + Math.random() * 2.500});
        }
      }
      function solid(p) {
        p.x = clamp(p.x, 32, LW - 32);
        p.y = clamp(p.y, tall ? 84 : 58, LH - 34);
        for (const b of BUSHES) {
          const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy), m = b.r + 13;
          if (d < m && d > 0) { p.x = b.x + dx / d * m; p.y = b.y + dy / d * m; }
        }
      }

      function update(dt) {
        t += dt;
        const secBefore = Math.ceil(timeLeft);
        timeLeft -= dt;
        if (Math.ceil(timeLeft) !== secBefore && timeLeft <= 5 && timeLeft > 0) sound.tick();
        if (timeLeft <= 0) { timeLeft = 0; finish(); return; }
        if (box.wait > 0) box.wait -= dt;
        box.pop = Math.min(1, box.pop + dt * 5);
        const me = players[0];

        players.forEach((p) => {
          p.cool = Math.max(0, p.cool - dt);
          p.dash = Math.max(0, p.dash - dt);
          p.safe = Math.max(0, p.safe - dt);
          p.stun = Math.max(0, p.stun - dt);
          let ax = 0, ay = 0;
          if (p.me) {
            ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
            ay = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
            if (stick) { const l = Math.hypot(stick.dx, stick.dy); if (l > 6) { ax = stick.dx / l; ay = stick.dy / l; } }
          } else {
            p.think -= dt;
            if (p.think <= 0) {
              p.think = .22 + Math.random() * .25;
              const c = box.carrier;
              if (c === p) { p.tx = p.base.x; p.ty = p.base.y; }
              else if (c) { p.tx = c.x + (Math.random() - .5) * 26; p.ty = c.y + (Math.random() - .5) * 26; }
              else if (box.wait <= 0) { p.tx = box.x + (Math.random() - .5) * 18; p.ty = box.y + (Math.random() - .5) * 18; }
              else { p.tx = CX + (Math.random() - .5) * 120; p.ty = CY + (Math.random() - .5) * 90; }
              if (c && c !== p && !c.me && Math.random() < .35) { p.tx = CX; p.ty = CY; }
            }
            ax = p.tx - p.x; ay = p.ty - p.y;
            if (Math.hypot(ax, ay) < 6) { ax = ay = 0; }
          }
          const l = Math.hypot(ax, ay);
          p.moving = l > 0 && p.stun <= 0;
          if (l > 0) { ax /= l; ay /= l; p.fx = ax; p.fy = ay; }
          const carrying = box.carrier === p;
          const base = p.me ? 178 : 126 + me.score * 4 + t * .3;
          const sp = (p.stun > 0 ? 0 : base) * (carrying ? .84 : 1) * (p.dash > 0 ? 2.500 : 1);
          p.x += ax * sp * dt; p.y += ay * sp * dt;
          solid(p);
          // соперники тоже делают рывки, когда коробка близко
          if (!p.me && p.cool <= 0 && box.carrier !== p && Math.hypot(p.x - box.x, p.y - box.y) < 90 && Math.random() < dt * 1.200) { p.dash = .16; p.cool = 2.800; }
        });
        // игроки расталкивают друг друга
        for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
          const a = players[i], b = players[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < 26 && d > 0) { const k = (26 - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
        }

        if (!box.carrier && box.wait <= 0) {
          const near = players.find((p) => p.stun <= 0 && Math.hypot(p.x - box.x, p.y - box.y) < 24);
          if (near) { box.carrier = near; near.safe = .5; if (near.me) sound.pick(); burst(box.x, box.y, '#ff8cc2', 10); }
        } else if (box.carrier) {
          const c = box.carrier;
          box.x = c.x; box.y = c.y - 30;
          if (c.safe <= 0) {
            const thief = players.find((p) => p !== c && p.stun <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < 29);
            if (thief) {
              box.carrier = thief;
              thief.safe = .9;
              c.stun = .55;
              burst(c.x, c.y, '#ffd34d', 12);
              if (thief.me) { sound.pick(); shake = 3; }
              else if (c.me) { sound.err(); shake = 5; }
            }
          }
          if (Math.hypot(c.x - c.base.x, c.y - c.base.y) < 34 && box.carrier === c) scorePoint(c);
        }

        parts = parts.filter((p) => (p.t += dt) < p.life);
        parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; });
        floats = floats.filter((f) => (f.t += dt) < 1);
        shake *= .88;
        stL.textContent = box.carrier === me ? 'Несёшь коробку, беги на базу!' : box.carrier ? `Коробка у соперника: ${box.carrier.base.name}` : 'Коробка свободна';
      }

      function draw() {
        if (!map) return;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.drawImage(map, 0, 0, cv.width, cv.height);
        x.setTransform(scale, 0, 0, scale, shake > .4 ? (Math.random() - .5) * shake * scale : 0, shake > .4 ? (Math.random() - .5) * shake * scale : 0);
        if (!players.length) { drawBox(x, CX, CY, 1, t); return; }

        // маяк над базой, когда несёшь коробку
        const me = players[0];
        if (box.carrier === me) {
          const k = (t * 1.600) % 1;
          x.strokeStyle = `rgba(224,50,127,${1 - k})`;
          x.lineWidth = 3;
          x.beginPath(); x.arc(me.base.x, me.base.y, 24 + k * 34, 0, 6.283); x.stroke();
        }
        if (box.wait > 0 || box.pop < 1) {
          x.strokeStyle = 'rgba(63,207,198,.7)'; x.lineWidth = 2;
          x.beginPath(); x.arc(CX, CY, 30 * Math.max(.2, box.pop), 0, 6.283); x.stroke();
        }
        [...players].sort((a, b) => a.y - b.y).forEach((p) => {
          drawCat(x, p, t);
          if (p.me) { x.fillStyle = '#e0327f'; x.beginPath(); x.moveTo(p.x - 5, p.y - 40); x.lineTo(p.x + 5, p.y - 40); x.lineTo(p.x, p.y - 33); x.closePath(); if (box.carrier !== p) x.fill(); }
        });
        if (box.wait <= 0) drawBox(x, box.x, box.y, box.pop, box.carrier ? 0 : t);

        parts.forEach((p) => { x.globalAlpha = 1 - p.t / p.life; x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill(); });
        x.globalAlpha = 1;
        floats.forEach((f) => {
          x.globalAlpha = 1 - f.t;
          x.fillStyle = f.c; x.font = '900 22px "Trebuchet MS", Tahoma, sans-serif'; x.textAlign = 'center';
          x.strokeStyle = '#fff'; x.lineWidth = 4;
          x.strokeText(f.s, f.x, f.y - f.t * 40); x.fillText(f.s, f.x, f.y - f.t * 40);
        });
        x.globalAlpha = 1;

        // счёт и время
        x.font = '700 12px Tahoma, sans-serif'; x.textBaseline = 'middle';
        players.forEach((p, i) => {
          const w = tall ? 98 : 102, px = tall ? 16 + i * 106 : i < 2 ? 22 + i * 106 : 490 + (i - 2) * 106;
          x.fillStyle = 'rgba(255,255,255,.9)'; rr(x, px, 30, w, 20, 10); x.fill();
          x.strokeStyle = p.base.ink; x.lineWidth = 1.500; rr(x, px, 30, w, 20, 10); x.stroke();
          x.fillStyle = p.base.c; x.beginPath(); x.arc(px + 11, 40, 6, 0, 6.283); x.fill(); x.stroke();
          x.fillStyle = '#222'; x.textAlign = 'left'; x.fillText(p.base.name, px + 21, 41);
          x.textAlign = 'right'; x.font = '900 13px Tahoma, sans-serif'; x.fillText(p.score, px + w - 8, 41); x.font = '700 12px Tahoma, sans-serif';
        });
        const low = timeLeft <= 10, ty = tall ? 54 : 31;
        x.fillStyle = low ? '#e0327f' : '#2a2a44'; rr(x, CX - 28, ty, 56, 22, 6); x.fill();
        x.fillStyle = '#fff'; x.font = '900 14px Tahoma, sans-serif'; x.textAlign = 'center'; x.fillText(Math.ceil(timeLeft), CX, ty + 12);

        // шкала рывка
        const cd = 1 - me.cool / 1.800;
        x.fillStyle = 'rgba(0,0,40,.35)'; rr(x, me.x - 14, me.y + 15, 28, 4, 2); x.fill();
        x.fillStyle = cd >= 1 ? '#4fd25a' : '#ffb43a'; rr(x, me.x - 14, me.y + 15, 28 * clamp(cd, .05, 1), 4, 2); x.fill();

        if (stick && stick.on) {
          x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3;
          x.beginPath(); x.arc(stick.ox, stick.oy, 38, 0, 6.283); x.stroke();
          x.fillStyle = 'rgba(255,255,255,.6)';
          const l = Math.min(38, Math.hypot(stick.dx, stick.dy)), a = Math.atan2(stick.dy, stick.dx);
          x.beginPath(); x.arc(stick.ox + Math.cos(a) * l, stick.oy + Math.sin(a) * l, 16, 0, 6.283); x.fill();
        }
      }

      function loop(now) {
        if (state !== 'play') return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, .05);
        last = now;
        update(dt);
        if (state === 'play') draw();
      }

      function dash() {
        const me = players[0];
        if (state !== 'play' || !me || me.cool > 0 || me.stun > 0) return;
        me.dash = .17; me.cool = 1.800;
        sound.tick();
      }

      const KEY = {ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'};
      const onDown = (e) => {
        if (wm.active !== 'box') return;
        if (e.target.tagName === 'INPUT') return;
        if (KEY[e.code]) { keys[KEY[e.code]] = true; if (state === 'play') e.preventDefault(); }
        if (e.code === 'Space') { if (state === 'play') { e.preventDefault(); dash(); } }
        if (e.code === 'KeyP' || e.code === 'Escape') { if (state === 'play') pause(); else if (state === 'pause') resume(); }
      };
      const onUp = (e) => { if (KEY[e.code]) keys[KEY[e.code]] = false; };
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);

      const toLogical = (e) => { const r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width * LW, y: (e.clientY - r.top) / r.height * LH}; };
      cv.addEventListener('pointerdown', (e) => {
        if (state !== 'play') return;
        const p = toLogical(e);
        stick = {on: true, ox: p.x, oy: p.y, dx: 0, dy: 0, id: e.pointerId};
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', (e) => {
        if (!stick || stick.id !== e.pointerId) return;
        const p = toLogical(e);
        stick.dx = p.x - stick.ox; stick.dy = p.y - stick.oy;
      });
      const stickEnd = () => { stick = null; };
      cv.addEventListener('pointerup', stickEnd);
      cv.addEventListener('pointercancel', stickEnd);
      dashBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); dash(); });

      win.setMenu([
        {label: 'Игра', items: () => [
          {label: 'Новая игра', action: start},
          {label: state === 'pause' ? 'Продолжить' : 'Пауза', key: 'P', disabled: state !== 'play' && state !== 'pause', action: () => (state === 'pause' ? resume() : pause())},
          {sep: true},
          {label: 'Настоящая игра в Роблоксе', icon: 'game', href: links.game},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
        {label: 'Справка', items: () => [{label: 'Правила', icon: 'help', action: () => { if (state === 'play') pause(); wm.msg({title: 'Правила', ico: 'box', sound: null, text: 'Хватай коробку в центре, неси на свою базу внизу слева и получай очко. Коснись соперника с коробкой, чтобы её отобрать. С коробкой бежишь чуть медленнее, зато рывок всегда с тобой.'}); }}]},
      ]);

      const ro = new ResizeObserver(fit);
      ro.observe(stage);
      win.onHide = () => pause();
      win.onClose = () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onDown);
        document.removeEventListener('keyup', onUp);
      };
      intro();
      requestAnimationFrame(fit);
    },
  });
})();

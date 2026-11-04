// Тренировочная рулетка идей: размер сектора зависит от числа комментариев, как и в настоящей.
(() => {
  const { $, $$, esc, store, sound, clamp, reduce, icon } = FH;
  const wm = FH.wm;
  const SAMPLE = [
    {t: 'Пример: обзор игры', n: 12},
    {t: 'Пример: ответы на вопросы', n: 7},
    {t: 'Пример: челлендж от зрителей', n: 18},
    {t: 'Пример: день из жизни', n: 4},
    {t: 'Пример: разбор комментариев', n: 9},
  ];
  const COLORS = ['#ff8ec4', '#6ccaf7', '#ffd75e', '#94e684', '#c5a6ff', '#ffa97a', '#7fe8d8', '#ff9d9d', '#a4b8ff', '#e2e87a'];
  const MAX = 24;

  wm.register('roulette', {
    title: 'Рулетка идей', icon: 'wheel', w: 790, h: 560, minW: 420, minH: 340, dx: 20, dy: 0,
    mount(body, win) {
      let ideas = store.get('ideas', null) || SAMPLE.map((x) => ({...x}));
      let rot = store.get('ideasRot', 0), spinning = false, raf = 0, lastIndex = -1, flap = 0, removeWin = store.get('ideasRemove', false);
      const hub = new Image();
      hub.src = 'avatar.webp';
      hub.onload = () => draw();

      body.classList.add('rl');
      body.innerHTML = `<div class="rl-wheel">
          <div class="rl-stage"><canvas></canvas></div>
          <button class="xp-btn def big rl-spin" type="button">${icon('wheel')}Крутить</button>
        </div>
        <div class="rl-side">
          <div class="rl-note"><b>Как это работает?</b> Настоящая рулетка крутится в выпусках: пиши идеи в комментах. Здесь можно потренироваться: список хранится только в твоём браузере и никуда не отправляется.</div>
          <form class="rl-add"><input class="xp-input" maxlength="42" placeholder="Новая идея…" aria-label="Новая идея" autocomplete="off"><button class="xp-btn" type="submit">Добавить</button></form>
          <div class="rl-head"><span>Идея</span><span>Комментарии</span><span>Шанс</span></div>
          <ul class="rl-list"></ul>
          <div class="rl-foot">
            <label><input type="checkbox" class="rl-rm" ${removeWin ? 'checked' : ''}>Убирать выпавшую идею</label>
            <button class="xp-btn" type="button" data-a="reset">Сбросить</button>
          </div>
        </div>
        <div class="rl-win" hidden role="status">
          <div class="rl-card">
            <small>Выпала идея</small>
            <b class="rl-w-t"></b>
            <p>Теперь напиши её в комментариях под видео. Чем больше там комментариев, тем выше шанс в настоящей рулетке.</p>
            <button class="xp-btn def" type="button" data-a="ok">Здорово!</button>
          </div>
        </div>`;

      const cv = $('canvas', body), ctx = cv.getContext('2d'), stage = $('.rl-stage', body);
      const list = $('.rl-list', body), spinBtn = $('.rl-spin', body), winBox = $('.rl-win', body);
      const [st1, st2] = win.addStatus(['', '']);
      let size = 300;

      const total = () => ideas.reduce((a, b) => a + b.n, 0) || 1;

      function persist() { store.set('ideas', ideas); }

      function renderList() {
        const T = total();
        list.innerHTML = ideas.map((it, i) => `<li>
          <i class="rl-dot" style="background:${COLORS[i % COLORS.length]}"></i>
          <span class="rl-t" title="${esc(it.t)}">${esc(it.t)}</span>
          <span class="rl-step"><button type="button" data-d="-1" data-i="${i}" aria-label="Меньше комментариев">−</button><input class="xp-input" inputmode="numeric" value="${it.n}" data-n="${i}" aria-label="Комментарии: ${esc(it.t)}"><button type="button" data-d="1" data-i="${i}" aria-label="Больше комментариев">+</button></span>
          <span class="rl-pct">${Math.round(it.n / T * 100)}%</span>
          <button type="button" class="rl-del" data-del="${i}" aria-label="Удалить: ${esc(it.t)}" title="Удалить">×</button>
        </li>`).join('') || '<li class="rl-empty">Добавь хотя бы одну идею</li>';
        st1.textContent = `Идей: ${ideas.length} из ${MAX}`;
        st2.textContent = `Комментариев: ${ideas.reduce((a, b) => a + b.n, 0)}`;
        spinBtn.disabled = ideas.length < 2;
      }

      function fit() {
        const r = stage.getBoundingClientRect();
        const s = Math.floor(Math.min(r.width, r.height));
        if (s < 40) return;
        size = s;
        const d = Math.min(devicePixelRatio || 1, 2);
        cv.width = s * d; cv.height = s * d;
        cv.style.width = cv.style.height = s + 'px';
        ctx.setTransform(d, 0, 0, d, 0, 0);
        draw();
      }

      function draw() {
        const c = size / 2, R = c - 10, T = total();
        ctx.clearRect(0, 0, size, size);
        // внешнее кольцо с лампочками
        ctx.beginPath(); ctx.arc(c, c + 2, R + 7, 0, 6.283);
        ctx.fillStyle = 'rgba(0,0,40,.28)'; ctx.fill();
        const ring = ctx.createLinearGradient(0, 0, 0, size);
        ring.addColorStop(0, '#ffe08a'); ring.addColorStop(.5, '#e9a63a'); ring.addColorStop(1, '#b8741a');
        ctx.beginPath(); ctx.arc(c, c, R + 7, 0, 6.283);
        ctx.fillStyle = ring; ctx.fill();

        let a = rot - Math.PI / 2;
        ideas.forEach((it, i) => {
          const sw = it.n / T * 6.283;
          ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, R, a, a + sw); ctx.closePath();
          ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.500; ctx.stroke();
          if (sw > .13) {
            ctx.save();
            const mid = ((a + sw / 2) % 6.283 + 6.283) % 6.283, flipped = mid > 1.571 && mid < 4.712;
            ctx.translate(c, c); ctx.rotate(a + sw / 2 + (flipped ? Math.PI : 0));
            ctx.textAlign = flipped ? 'left' : 'right'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#2a1a3c';
            const fs = clamp(Math.min(R * .072, sw * R * .3), 9, 15);
            ctx.font = `700 ${fs}px Tahoma, "Segoe UI", sans-serif`;
            let label = it.t.replace(/^Пример:\s*/, '');
            const maxW = R * .62;
            while (ctx.measureText(label).width > maxW && label.length > 3) label = label.slice(0, -2);
            if (label !== it.t.replace(/^Пример:\s*/, '')) label += '…';
            ctx.fillText(label, flipped ? 12 - R : R - 12, 0);
            ctx.restore();
          }
          a += sw;
        });

        // лампочки
        const now = performance.now();
        for (let i = 0; i < 24; i++) {
          const b = i / 24 * 6.283, on = spinning ? (Math.floor(now / 90) + i) % 2 : (Math.floor(now / 700) + i) % 3 === 0;
          ctx.beginPath(); ctx.arc(c + Math.cos(b) * (R + 3.500), c + Math.sin(b) * (R + 3.500), 2.600, 0, 6.283);
          ctx.fillStyle = on ? '#fffbe0' : '#a56c1a'; ctx.fill();
        }

        // ступица с аватаркой
        const hr = Math.max(20, R * .17);
        ctx.beginPath(); ctx.arc(c, c, hr + 3, 0, 6.283); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.save();
        ctx.beginPath(); ctx.arc(c, c, hr, 0, 6.283); ctx.clip();
        if (hub.complete && hub.naturalWidth) ctx.drawImage(hub, c - hr, c - hr, hr * 2, hr * 2);
        ctx.restore();

        // язычок
        ctx.save();
        ctx.translate(c, 3); ctx.rotate(flap);
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(0, 24); ctx.closePath();
        ctx.fillStyle = '#e0327f'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }

      // какая идея сейчас под язычком
      function indexAt() {
        const T = total(), turn = ((-rot % 6.283) + 6.283) % 6.283;
        let a = 0;
        for (let i = 0; i < ideas.length; i++) {
          a += ideas[i].n / T * 6.283;
          if (turn < a) return i;
        }
        return ideas.length - 1;
      }

      function spin() {
        if (spinning || ideas.length < 2) return;
        spinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = 'Крутится…';
        sound.ctx();
        const from = rot, dist = 6.283 * (6 + Math.random() * 4) + Math.random() * 6.283, dur = reduce ? 10 : 5200 + Math.random() * 1400, t0 = performance.now();
        lastIndex = indexAt();
        const step = (now) => {
          const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
          rot = from + dist * e;
          const idx = indexAt();
          if (idx !== lastIndex) { lastIndex = idx; flap = -.42; sound.tick(); }
          flap *= .84;
          draw();
          if (k < 1) { raf = requestAnimationFrame(step); return; }
          spinning = false;
          flap = 0;
          draw();
          store.set('ideasRot', rot % 6.283);
          finish(idx);
        };
        raf = requestAnimationFrame(step);
      }

      function finish(idx) {
        const it = ideas[idx];
        spinBtn.disabled = false;
        spinBtn.innerHTML = `${icon('wheel')}Крутить`;
        $('.rl-w-t', body).textContent = it.t;
        winBox.hidden = false;
        sound.win();
        if (FH.ach) FH.ach.give('spin');
        const r = stage.getBoundingClientRect();
        FH.fx.spawn(r.left + r.width / 2, r.top + r.height / 2, {kind: 'paper', n: 90, power: 560, life: 2.300});
        if (removeWin) { winBox.dataset.remove = idx; }
        $('[data-a=ok]', winBox).focus();
      }

      body.addEventListener('click', (e) => {
        const d = e.target.closest('[data-d]');
        if (d) {
          const it = ideas[+d.dataset.i];
          it.n = clamp(it.n + +d.dataset.d, 1, 999);
          persist(); renderList(); draw();
          return;
        }
        const del = e.target.closest('[data-del]');
        if (del) {
          ideas.splice(+del.dataset.del, 1);
          persist(); renderList(); draw();
          return;
        }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'ok') {
          winBox.hidden = true;
          if (winBox.dataset.remove !== undefined) {
            ideas.splice(+winBox.dataset.remove, 1);
            delete winBox.dataset.remove;
            persist(); renderList(); draw();
          }
        }
        if (a.dataset.a === 'reset') {
          ideas = SAMPLE.map((x) => ({...x}));
          store.del('ideas');
          renderList(); draw();
        }
      });
      body.addEventListener('change', (e) => {
        const i = e.target.dataset.n;
        if (i !== undefined) {
          ideas[+i].n = clamp(parseInt(e.target.value, 10) || 1, 1, 999);
          persist(); renderList(); draw();
        }
        if (e.target.classList.contains('rl-rm')) { removeWin = e.target.checked; store.set('ideasRemove', removeWin); }
      });
      $('.rl-add', body).addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = $('input', e.target), t = inp.value.trim();
        if (!t) return;
        if (ideas.length >= MAX) { sound.err(); wm.msg({title: 'Рулетка заполнена', ico: 'warn', sound: null, text: `В рулетке помещается ${MAX} идеи. Удали какую-нибудь, чтобы добавить новую.`}); return; }
        ideas.push({t, n: 1});
        inp.value = '';
        persist(); renderList(); draw();
        sound.click();
        list.scrollTop = list.scrollHeight;
      });
      spinBtn.addEventListener('click', spin);
      cv.addEventListener('click', spin);

      const ro = new ResizeObserver(fit);
      ro.observe(stage);
      win.onClose = () => { ro.disconnect(); cancelAnimationFrame(raf); };
      renderList();
      requestAnimationFrame(fit);
    },
  });
})();

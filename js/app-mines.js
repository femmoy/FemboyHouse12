// Сапёр: мордочка котика вместо смайлика и настоящие семисегментные цифры.
(() => {
  const { $, store, sound, coarse } = FH;
  const wm = FH.wm;
  const LEVELS = {
    easy: {w: 9, h: 9, m: 10, name: 'Новичок'},
    mid: {w: 16, h: 16, m: 40, name: 'Любитель'},
    hard: {w: 30, h: 16, m: 99, name: 'Профессионал'},
  };
  const SEG = {0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcfgd', '-': 'g'};
  const SHAPE = {
    a: 'M2 1h9l-2 2H4Z', b: 'M11.500 1.500v8l-1.500 1-1-1V3.500Z', c: 'M11.500 20.500v-8l-1.500-1-1 1v6Z',
    d: 'M2 21h9l-2-2H4Z', e: 'M1.500 20.500v-8l1.500-1 1 1v6Z', f: 'M1.500 1.500v8l1.500 1 1-1V3.500Z', g: 'M3 11l1.300-1.200h4.400L10 11l-1.300 1.200H4.300Z',
  };
  const led = (n) => {
    const s = n < 0 ? '-' + String(Math.min(99, -n)).padStart(2, '0') : String(Math.min(999, n)).padStart(3, '0');
    return [...s].map((c) => `<svg viewBox="0 0 13 22" aria-hidden="true">${Object.entries(SHAPE).map(([k, d]) => `<path d="${d}" fill="${SEG[c].includes(k) ? '#ff2a1a' : '#3c0a06'}"/>`).join('')}</svg>`).join('');
  };
  FH.led = led;
  const FACES = {
    ok: '<path d="M14 15c1.500-1 3-1 4 0M22 15c1-1 2.500-1 4 0" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/><path d="m18.500 21 1.500 1.500 1.500-1.500Z" fill="#ff8fb8" stroke="#3a3f55"/>',
    wow: '<circle cx="15.500" cy="15" r="2.200" fill="#111"/><circle cx="24.500" cy="15" r="2.200" fill="#111"/><circle cx="20" cy="23" r="2.300" fill="#ff8fb8" stroke="#3a3f55"/>',
    win: '<path d="M11 13.500h7l-.8 4h-5.400ZM22 13.500h7l-.8 4h-5.400ZM18 14.500h4" fill="#111" stroke="#111" stroke-width="1.200"/><path d="M16 21.500q4 3.500 8 0" stroke="#111" stroke-width="1.800" fill="none" stroke-linecap="round"/>',
    dead: '<path d="m13 12.500 5 5m0-5-5 5M22 12.500l5 5m0-5-5 5" stroke="#111" stroke-width="2" stroke-linecap="round"/><path d="M15 24q5-3.500 10 0" stroke="#111" stroke-width="1.800" fill="none" stroke-linecap="round"/>',
  };
  const face = (k) => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 14 7 3l8 5M31 14l2-11-8 5" fill="#fff" stroke="#3a3f55" stroke-width="1.800" stroke-linejoin="round"/><path d="m9 6 3 3-3 2ZM31 6l-3 3 3 2Z" fill="#ffb6d5"/><ellipse cx="20" cy="20" rx="14" ry="13" fill="#fff" stroke="#3a3f55" stroke-width="1.800"/><path d="M8 22h3M29 22h3" stroke="#ff9cc0" stroke-width="2" stroke-linecap="round"/>${FACES[k]}</svg>`;

  wm.register('mines', {
    title: 'Сапёр', icon: 'mine', w: 260, fit: true, dx: 60, dy: -30, cls: 'mn-win',
    mount(body, win) {
      let lvl = store.get('minesLvl', 'easy');
      if (!LEVELS[lvl]) lvl = 'easy';
      let grid = [], W, H, M, started = false, over = false, flags = 0, opened = 0, time = 0, timer = 0, flagMode = false;
      const best = store.get('minesBest', {});

      win.setMenu([
        {label: 'Игра', items: () => [
          {label: 'Новая игра', key: 'F2', action: () => newGame()},
          {sep: true},
          ...Object.entries(LEVELS).filter(([k]) => k !== 'hard' || innerWidth >= 560).map(([k, l]) => ({label: l.name, radio: lvl === k, action: () => { lvl = k; store.set('minesLvl', k); newGame(); }})),
          {sep: true},
          {label: 'Лучшее время', action: () => wm.msg({title: 'Лучшее время', ico: 'star', sound: null, text: Object.entries(LEVELS).map(([k, l]) => `${l.name}: ${best[k] ? best[k] + ' с' : 'ещё нет'}`).join(' · ')})},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
        {label: 'Справка', items: () => [
          {label: 'Как играть', icon: 'help', action: () => wm.msg({title: 'Как играть', ico: 'mine', sound: null, text: coarse ? 'Нажми на клетку, чтобы открыть её. Нажми и подержи, чтобы поставить флажок, или включи режим флажка кнопкой снизу. Цифра показывает, сколько мин рядом.' : 'Левая кнопка открывает клетку, правая ставит флажок. Цифра показывает, сколько мин рядом. Нажми на открытую цифру, когда флажков вокруг хватает, и соседние клетки откроются сами.'})},
        ]},
      ]);

      body.classList.add('mn');
      body.innerHTML = `<div class="mn-frame">
          <div class="mn-top">
            <div class="mn-led" data-l="m"></div>
            <button class="mn-face" type="button" aria-label="Новая игра" title="Новая игра"></button>
            <div class="mn-led" data-l="t"></div>
          </div>
          <div class="mn-grid" role="grid"></div>
        </div>
        ${coarse ? '<button class="xp-btn mn-flag" type="button" aria-pressed="false">Режим флажка: выкл.</button>' : ''}`;
      const gridEl = $('.mn-grid', body), faceBtn = $('.mn-face', body), ledM = $('[data-l=m]', body), ledT = $('[data-l=t]', body), flagBtn = $('.mn-flag', body);

      const setFace = (k) => { faceBtn.innerHTML = face(k); };
      const paintLed = () => { ledM.innerHTML = led(M - flags); ledT.innerHTML = led(time); };
      const cellEl = (i) => gridEl.children[i];

      function newGame() {
        const L = LEVELS[lvl];
        W = L.w; H = L.h; M = L.m;
        grid = Array.from({length: W * H}, () => ({mine: false, n: 0, open: false, flag: false, q: false}));
        started = false; over = false; flags = 0; opened = 0; time = 0;
        clearInterval(timer);
        gridEl.style.gridTemplateColumns = `repeat(${W}, var(--mc))`;
        const fitCell = innerWidth < 720 ? Math.min(32, Math.floor((innerWidth - 44) / W)) : 22;
        gridEl.style.setProperty('--mc', Math.max(18, fitCell) + 'px');
        gridEl.innerHTML = grid.map((_, i) => `<button type="button" class="mc" data-i="${i}" role="gridcell" aria-label="Клетка"></button>`).join('');
        setFace('ok');
        paintLed();
      }

      const around = (i) => {
        const x = i % W, y = Math.floor(i / W), out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const a = x + dx, b = y + dy;
          if (a >= 0 && a < W && b >= 0 && b < H) out.push(b * W + a);
        }
        return out;
      };

      function seed(safe) {
        const ban = new Set([safe, ...around(safe)]);
        let left = M;
        while (left > 0) {
          const i = Math.floor(Math.random() * grid.length);
          if (ban.has(i) || grid[i].mine) continue;
          grid[i].mine = true;
          left--;
        }
        grid.forEach((c, i) => { c.n = around(i).filter((j) => grid[j].mine).length; });
      }

      function paint(i) {
        const c = grid[i], el = cellEl(i);
        el.className = 'mc' + (c.open ? ' open' : '') + (c.open && c.n && !c.mine ? ` n${c.n}` : '');
        el.textContent = c.open && !c.mine && c.n ? c.n : '';
        el.innerHTML = c.flag && !c.open ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v9" stroke="#111" stroke-width="1.500"/><path d="M8.500 2 3 5l5.500 3Z" fill="#e0242a"/><path d="M4 13h8v1.500H4Z" fill="#111"/><path d="M6 11.500h4V13H6Z" fill="#111"/></svg>' : el.innerHTML;
        el.setAttribute('aria-label', c.open ? (c.mine ? 'Мина' : c.n ? `Рядом мин: ${c.n}` : 'Пусто') : c.flag ? 'Флажок' : 'Закрытая клетка');
      }

      function open(i) {
        const stack = [i];
        while (stack.length) {
          const k = stack.pop(), c = grid[k];
          if (c.open || c.flag) continue;
          c.open = true;
          opened++;
          paint(k);
          if (!c.n && !c.mine) stack.push(...around(k));
        }
      }

      function lose(i) {
        over = true;
        clearInterval(timer);
        setFace('dead');
        sound.boom();
        if (FH.ach) FH.ach.give('boom');
        grid.forEach((c, k) => {
          const el = cellEl(k);
          if (c.mine && !c.flag) {
            c.open = true;
            el.className = 'mc open' + (k === i ? ' hit' : '');
            el.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-mine"/></svg>';
          } else if (!c.mine && c.flag) {
            el.className = 'mc open wrong';
            el.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-mine"/><path d="m8 8 32 32M40 8 8 40" stroke="#e0242a" stroke-width="5"/></svg>';
          }
        });
      }
      function winGame() {
        over = true;
        clearInterval(timer);
        setFace('win');
        sound.win();
        if (FH.ach) FH.ach.give('mines');
        grid.forEach((c, k) => { if (c.mine && !c.flag) { c.flag = true; flags++; paint(k); } });
        paintLed();
        const r = gridEl.getBoundingClientRect();
        FH.fx.spawn(r.left + r.width / 2, r.top + r.height / 2, {kind: 'heart', n: 30, power: 260});
        if (!best[lvl] || time < best[lvl]) { best[lvl] = time; store.set('minesBest', best); }
      }

      function reveal(i) {
        const c = grid[i];
        if (over || c.flag || c.open) return;
        if (!started) {
          started = true;
          seed(i);
          timer = setInterval(() => { time = Math.min(999, time + 1); paintLed(); }, 1000);
        }
        if (c.mine) { c.open = true; lose(i); return; }
        open(i);
        sound.click();
        if (opened === W * H - M) winGame();
      }
      function toggleFlag(i) {
        const c = grid[i];
        if (over || c.open) return;
        c.flag = !c.flag;
        flags += c.flag ? 1 : -1;
        cellEl(i).innerHTML = '';
        paint(i);
        paintLed();
        sound.tick();
      }
      function chord(i) {
        const c = grid[i];
        if (over || !c.open || !c.n) return;
        const ns = around(i);
        if (ns.filter((j) => grid[j].flag).length !== c.n) return;
        ns.forEach((j) => { if (!over && !grid[j].flag && !grid[j].open) reveal(j); });
      }

      let press = 0, longDone = false;
      gridEl.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('.mc');
        if (!b || over) return;
        if (e.button === 0) setFace('wow');
        longDone = false;
        if (e.pointerType !== 'mouse') {
          press = setTimeout(() => { longDone = true; toggleFlag(+b.dataset.i); if (navigator.vibrate) navigator.vibrate(18); }, 380);
        }
      });
      const relax = () => { clearTimeout(press); if (!over) setFace('ok'); };
      addEventListener('pointerup', relax);
      addEventListener('pointercancel', relax);
      gridEl.addEventListener('click', (e) => {
        const b = e.target.closest('.mc');
        if (!b || longDone) { longDone = false; return; }
        const i = +b.dataset.i;
        if (flagMode && !grid[i].open) { toggleFlag(i); return; }
        if (grid[i].open) chord(i); else reveal(i);
      });
      gridEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const b = e.target.closest('.mc');
        if (b && !longDone) toggleFlag(+b.dataset.i);
      });
      faceBtn.addEventListener('click', () => newGame());
      if (flagBtn) flagBtn.addEventListener('click', () => {
        flagMode = !flagMode;
        flagBtn.setAttribute('aria-pressed', String(flagMode));
        flagBtn.textContent = `Режим флажка: ${flagMode ? 'вкл.' : 'выкл.'}`;
        flagBtn.classList.toggle('def', flagMode);
      });
      const onKey = (e) => { if (e.key === 'F2' && wm.active === 'mines') { e.preventDefault(); newGame(); } };
      document.addEventListener('keydown', onKey);
      win.onClose = () => {
        clearInterval(timer);
        clearTimeout(press);
        removeEventListener('pointerup', relax);
        removeEventListener('pointercancel', relax);
        document.removeEventListener('keydown', onKey);
      };
      newGame();
    },
  });
})();

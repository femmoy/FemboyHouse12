// Котик с аватарки живёт на рабочем столе: бегает за курсором, спит и подсказывает, куда нажать.
(() => {
  const { $, html, clamp, store, sound, coarse, reduce, wide, esc } = FH;
  const wm = FH.wm;

  const SVG = `<svg viewBox="0 0 64 70" aria-hidden="true">
    <path class="tail" d="M47 52c8 0 12-5 11-12-1-4-5-5-6-2 0 4-1 7-6 8Z" fill="#fff" stroke="#3a3f55" stroke-width="2" stroke-linejoin="round"/>
    <path class="leg-a" d="M21 54h9v9a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3Z" fill="#fff" stroke="#3a3f55" stroke-width="2"/>
    <path class="leg-b" d="M34 54h9v9a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3Z" fill="#fff" stroke="#3a3f55" stroke-width="2"/>
    <ellipse cx="32" cy="50" rx="16" ry="12" fill="#fff" stroke="#3a3f55" stroke-width="2"/>
    <path d="M18 43c5 3 23 3 28 0l2 6c-7 4-25 4-32 0Z" fill="#d6304a" stroke="#8c1c30" stroke-width="1.500" stroke-linejoin="round"/>
    <path d="M38 47l6 9 5-3-5-8Z" fill="#b81f3a" stroke="#8c1c30" stroke-width="1.200" stroke-linejoin="round"/>
    <path d="m26 46 .1.1M33 47l.1.1M23 45.500l.1.1" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <path d="M13 26 9 8l14 8ZM51 26l4-18-14 8Z" fill="#fff" stroke="#3a3f55" stroke-width="2" stroke-linejoin="round"/>
    <path d="m13 13 6 4-4 4ZM51 13l-6 4 4 4Z" fill="#ffc2dc"/>
    <path d="M10 28c0-11 10-18 22-18s22 7 22 18-10 17-22 17-22-6-22-17Z" fill="#fff" stroke="#3a3f55" stroke-width="2"/>
    <g class="eyes-awake"><path d="M17 25c3-2 8-2 10 0l-1 6c-3 2-6 2-8 0ZM37 25c2-2 7-2 10 0l-1 6c-2 2-5 2-8 0Z" fill="#14161f"/><path d="M15 21l12 3M49 21l-12 3" stroke="#14161f" stroke-width="2.400" stroke-linecap="round"/><circle cx="21" cy="27" r="1.200" fill="#fff"/><circle cx="41" cy="27" r="1.200" fill="#fff"/></g>
    <g class="eyes-sleep"><path d="M17 28q5 3 10 0M37 28q5 3 10 0" fill="none" stroke="#14161f" stroke-width="2.400" stroke-linecap="round"/></g>
    <path class="tongue" d="M29 36c1 4 5 4 6 0Z" fill="#ff8fb8" stroke="#3a3f55" stroke-width="1.500" stroke-linejoin="round"/>
    <path d="m29 34 3 2 3-2" fill="none" stroke="#3a3f55" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 34h5M12 37h4M47 34h5M48 37h4" stroke="#ff9cc0" stroke-width="1.800" stroke-linecap="round"/>
    <path d="M13 17C16 5 28-1 39 2c9 2 13 9 14 15-3-3-7-5-10-6l3 9-6-9c-9-2-20 1-27 6Z" fill="#d6304a" stroke="#8c1c30" stroke-width="1.500" stroke-linejoin="round"/>
    <circle cx="53" cy="21" r="5.500" fill="#fff" stroke="#c9d6f4"/>
    <path d="M9 19c6-7 13-9 24-9s18 2 22 7c1 3 0 5-3 5-6-5-12-6-20-6-8 0-14 2-20 7-3 0-4-2-3-4Z" fill="#fff" stroke="#c9d6f4"/>
  </svg>`;

  const TIPS = [
    {text: 'Похоже, вы ищете, с кем поболтать. Открыть телеграм-чат?', acts: [['Открыть', () => wm.open('tg')]]},
    {text: 'Пиши идеи для видео в комментах! А здесь можно потренироваться крутить рулетку.', acts: [['Покрутить', () => wm.open('roulette')]]},
    {text: 'Можно украсть коробку прямо тут. Я никому не скажу.', acts: [['Украсть', () => wm.open('box')]]},
    {text: 'Настоящая «Украсть коробку» живёт в Роблоксе. Пока что она 16+.', acts: [['Об игре', () => wm.open('game')]]},
    {text: 'В чате не пиши адрес и школу, ладно? Береги себя. Мяу.'},
    {text: 'Открой КотАмп. Там зимняя музыка, она совсем своя, сделана прямо в браузере.', acts: [['Послушать', () => wm.open('player')]]},
    {text: 'Если мешаю, уберёшь меня значком на панели задач. Но я обижусь. Шучу.'},
    {text: 'Снег копится на окнах. Потряси окно, и он слетит!'},
    {text: 'Обои можно поменять. Щёлкни правой кнопкой по столу.', acts: [['Показать', () => wm.open('display')]]},
    {text: 'На Видике есть камин на три часа. Я под ним сплю.', acts: [['Включить', () => wm.open('tv')]]},
    {text: 'У меня есть карманная версия. Покорми её рыбкой, пожалуйста.', acts: [['Покормить', () => wm.open('tama')]]},
    {text: 'Полосы на экране не сломались, это плёнка. Отключается значком кассеты.', acts: [['Настроить', () => wm.open('display')]]},
    {text: 'Ты уже нашёл все достижения?', acts: [['Показать', () => wm.open('ach')]]},
  ];

  const EDGE_Y = () => $('#desk').clientHeight - (wide() ? 62 : 48);

  FH.pet = (() => {
    let el = null, on = store.get('pet', true), live = false, raf = 0, last = 0;
    let x = 0, y = 0, tx = 0, ty = 0, mode = 'idle', idleT = 0, say = null, sayTimer = 0, tipI = Math.floor(Math.random() * TIPS.length), hasPointer = false, dragging = false, seen = 0;

    function build() {
      if (el) return;
      el = html(`<button class="pet" type="button" aria-label="Котик: нажми, чтобы получить подсказку"><span class="inner">${SVG}</span><span class="pet-z">z</span></button>`);
      // живёт внутри стола, под окнами: котик никогда не закрывает кнопки
      $('#desk').append(el);
      x = $('#desk').clientWidth * .58;
      y = EDGE_Y();
      place();
      el.addEventListener('click', () => {
        if (dragging) { dragging = false; return; }
        joy();
        sound.pick();
        tip();
      });
      // котика можно взять и перенести
      let sx, sy, ox, oy, held = false;
      el.addEventListener('pointerdown', (e) => {
        held = true; sx = e.clientX; sy = e.clientY; ox = x; oy = y;
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!held) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) < 6 && !dragging) return;
        dragging = true;
        setMode('idle');
        x = ox + dx; y = oy + dy;
        tx = x; ty = y;
        idleT = 0;
        place();
      });
      const up = () => {
        held = false;
        if (!dragging) return;
        // отпущенный котик возвращается вниз, на снег
        tx = x; ty = EDGE_Y();
        setMode('run');
        setTimeout(() => { dragging = false; }, 0);
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }
    function place() {
      if (!el) return;
      const W = innerWidth, H = $('#desk').clientHeight, s = el.offsetWidth || 64;
      x = clamp(x, 2, W - s - 2);
      y = clamp(y, 2, H - s - 2);
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      if (say) posSay();
    }
    function setMode(m) {
      if (mode === m) return;
      mode = m;
      el.classList.toggle('run', m === 'run');
      el.classList.toggle('sleep', m === 'sleep');
    }
    function joy() {
      if (!el) return;
      setMode('idle');
      idleT = 0;
      el.classList.remove('joy');
      void el.offsetWidth;
      el.classList.add('joy');
      setTimeout(() => el && el.classList.remove('joy'), 520);
      const r = el.getBoundingClientRect();
      FH.fx.spawn(r.left + r.width / 2, r.top + 8, {kind: 'heart', n: 5, power: 70, life: 1.200});
    }
    function hideSay() { if (say) { say.remove(); say = null; } clearTimeout(sayTimer); }
    function posSay() {
      const r = el.getBoundingClientRect(), w = say.offsetWidth, h = say.offsetHeight;
      say.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
      say.style.top = clamp(r.top - h - 10, 8, innerHeight - h - 50) + 'px';
    }
    function tip() {
      hideSay();
      const t = TIPS[tipI];
      tipI = (tipI + 1) % TIPS.length;
      say = html(`<div class="pet-say" role="status"><p>${esc(t.text)}</p></div>`);
      const acts = document.createElement('div');
      acts.className = 'acts';
      (t.acts || []).forEach(([label, fn]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'xp-btn def';
        b.textContent = label;
        b.addEventListener('click', () => { hideSay(); fn(); });
        acts.append(b);
      });
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'xp-btn';
      more.textContent = 'Ещё совет';
      more.addEventListener('click', tip);
      acts.append(more);
      const off = document.createElement('button');
      off.type = 'button';
      off.className = 'xp-btn';
      off.textContent = 'Закрыть';
      off.addEventListener('click', hideSay);
      acts.append(off);
      say.append(acts);
      document.body.append(say);
      posSay();
      sayTimer = setTimeout(hideSay, 16000);
    }

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !el) return;
      // котик бегает по низу стола и не лезет на окна, чтобы не закрывать ссылки
      if (e.target.closest && e.target.closest('.win, .pet')) return;
      hasPointer = true;
      tx = e.clientX - el.offsetWidth / 2;
      ty = EDGE_Y();
    }, {passive: true});

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      if (dragging) return;
      idleT += dt;
      if (coarse || !hasPointer) {
        // на телефоне котик гуляет сам по низу экрана
        if (mode !== 'run' && idleT > 5 + (seen % 3) * 3) {
          seen++;
          tx = 20 + Math.random() * Math.max(20, innerWidth - 90);
          ty = EDGE_Y();
          setMode('run');
        }
      }
      const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
      if (mode === 'run') {
        if (d < 8) { setMode('idle'); idleT = 0; }
        else {
          const sp = coarse ? 70 : 190;
          x += dx / d * sp * dt; y += dy / d * sp * dt;
          el.classList.toggle('flip', dx < 0);
          place();
        }
      } else if (hasPointer && !coarse && d > 130 && idleT > .7 && mode === 'idle') {
        setMode('run');
      } else if (hasPointer && !coarse && mode === 'sleep' && d > 300) {
        setMode('idle');
        idleT = 0;
      } else if (idleT > 14 && mode === 'idle') {
        setMode('sleep');
      }
    }
    function start() {
      live = true;
      if (!on) return;
      build();
      el.hidden = false;
      if (reduce) return;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function stop() {
      live = false;
      cancelAnimationFrame(raf); raf = 0;
      hideSay();
      if (el) el.hidden = true;
    }
    addEventListener('resize', () => { if (el) { y = Math.min(y, EDGE_Y()); place(); } });
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf); raf = 0;
      if (!document.hidden && live && on && el && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });

    const petBtn = $('#petBtn');
    petBtn.setAttribute('aria-pressed', String(on));
    return {
      get on() { return on; },
      set on(v) {
        on = v;
        store.set('pet', v);
        petBtn.setAttribute('aria-pressed', String(v));
        if (v && live) start(); else { cancelAnimationFrame(raf); raf = 0; hideSay(); if (el) el.hidden = true; }
      },
      start, stop, joy, hideSay,
    };
  })();
})();

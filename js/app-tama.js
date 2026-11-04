// Котогочи: карманный котик. Не умирает, зато помнит, сколько тебя не было.
(() => {
  const { $, store, sound, clamp } = FH;
  const wm = FH.wm;
  const HOUR = 3600000;
  const load = () => {
    const s = store.get('tama', null) || {food: 80, joy: 80, rest: 80, born: Date.now(), at: Date.now(), sleep: false, fed: 0};
    // пока тебя не было, котик проголодался и заскучал, но ниже десяти не падает
    const h = (Date.now() - s.at) / HOUR;
    s.food = Math.max(10, s.food - h * 5);
    s.joy = Math.max(10, s.joy - h * 4);
    s.rest = s.sleep ? Math.min(100, s.rest + h * 18) : Math.max(10, s.rest - h * 3);
    s.at = Date.now();
    return s;
  };

  wm.register('tama', {
    title: 'Котогочи', icon: 'tama', w: 320, fit: true, dx: -210, dy: -10, cls: 'tg-win',
    mount(body, win) {
      const s = load();
      let anim = null, animT = 0, timer = 0, frame = 0;
      body.classList.add('tama');
      body.innerHTML = `<div class="tama-egg">
          <div class="tama-lcd"><canvas width="48" height="36" aria-label="Экран Котогочи"></canvas></div>
          <div class="tama-keys">
            <button type="button" data-a="food" title="Покормить" aria-label="Покормить">🐟</button>
            <button type="button" data-a="play" title="Поиграть" aria-label="Поиграть">🎀</button>
            <button type="button" data-a="sleep" title="Спать или проснуться" aria-label="Спать или проснуться">🌙</button>
          </div>
        </div>
        <div class="tama-stats" role="status">
          <div>Сытость<u><i data-s="food"></i></u></div>
          <div>Радость<u><i data-s="joy"></i></u></div>
          <div>Бодрость<u><i data-s="rest"></i></u></div>
          <p class="tama-say"></p>
        </div>`;
      const cv = $('canvas', body), x = cv.getContext('2d'), say = $('.tama-say', body);
      const INK = '#26301c', px = (a, b, w = 1, h = 1) => x.fillRect(a, b, w, h);

      function catAt(ox, oy, eyes, mouth) {
        x.fillStyle = INK;
        // уши и голова
        px(ox, oy + 1, 2, 4); px(ox + 1, oy, 1, 2); px(ox + 14, oy + 1, 2, 4); px(ox + 14, oy, 1, 2);
        px(ox + 2, oy + 3, 12, 1); px(ox + 1, oy + 4, 1, 8); px(ox + 14, oy + 4, 1, 8); px(ox + 2, oy + 12, 12, 1);
        // шапка
        px(ox + 3, oy + 1, 10, 2); px(ox + 5, oy, 6, 1); px(ox + 12, oy, 3, 1);
        // глаза
        if (eyes === 'open') { px(ox + 4, oy + 6, 2, 2); px(ox + 10, oy + 6, 2, 2); }
        if (eyes === 'happy') { px(ox + 4, oy + 7); px(ox + 5, oy + 6); px(ox + 6, oy + 7); px(ox + 9, oy + 7); px(ox + 10, oy + 6); px(ox + 11, oy + 7); }
        if (eyes === 'shut') { px(ox + 4, oy + 7, 3, 1); px(ox + 9, oy + 7, 3, 1); }
        if (eyes === 'sad') { px(ox + 4, oy + 6); px(ox + 5, oy + 7); px(ox + 11, oy + 6); px(ox + 10, oy + 7); px(ox + 5, oy + 8, 1, 1); }
        // рот
        if (mouth === 'smile') { px(ox + 6, oy + 9); px(ox + 7, oy + 10, 2, 1); px(ox + 9, oy + 9); }
        if (mouth === 'flat') px(ox + 7, oy + 10, 2, 1);
        if (mouth === 'sad') { px(ox + 7, oy + 9, 2, 1); px(ox + 6, oy + 10); px(ox + 9, oy + 10); }
        if (mouth === 'open') px(ox + 7, oy + 9, 2, 2);
        // тело
        px(ox + 3, oy + 13, 1, 4); px(ox + 12, oy + 13, 1, 4); px(ox + 3, oy + 17, 10, 1); px(ox + 15, oy + 13, 1, 3); px(ox + 14, oy + 16);
      }
      function draw() {
        frame++;
        x.clearRect(0, 0, 48, 36);
        x.fillStyle = INK;
        // значки показателей вверху
        const low = [['food', 2], ['joy', 20], ['rest', 38]];
        low.forEach(([k, a]) => {
          if (s[k] < 35 && frame % 2) { px(a, 1, 8, 1); px(a, 3, 8, 1); px(a, 1, 1, 3); px(a + 7, 1, 1, 3); }
        });
        px(0, 5, 48, 1);
        px(0, 31, 48, 1);
        const walk = !s.sleep && !anim ? Math.round(Math.sin(frame * .5) * 6) : 0, by = anim === 'jump' ? (frame % 2 ? 7 : 11) : (frame % 2 ? 12 : 13);
        const cx = 16 + walk;
        if (s.sleep) {
          catAt(16, 13, 'shut', 'flat');
          // звёздочка и буквы z
          const z = frame % 4;
          px(36 + z, 11 - z, 3, 1); px(38 + z, 12 - z); px(37 + z, 13 - z); px(36 + z, 14 - z, 3, 1);
          x.globalCompositeOperation = 'difference';
          x.fillStyle = '#6f7f5c'; x.fillRect(0, 6, 48, 25);
          x.globalCompositeOperation = 'source-over';
          return;
        }
        const mood = Math.min(s.food, s.joy, s.rest);
        if (anim === 'food') {
          catAt(14, 13, 'happy', frame % 2 ? 'open' : 'flat');
          const f = Math.max(0, 8 - animT);
          px(34, 19, f, 3); px(33 + f, 18, 2, 5);
          px(36, 20);
        } else if (anim === 'jump') {
          catAt(16, by, 'happy', 'open');
          px(6, 8 + frame % 6, 2, 2); px(40, 8 + (frame + 3) % 6, 2, 2);
        } else {
          catAt(cx, by, mood < 35 ? 'sad' : frame % 9 === 0 ? 'shut' : 'open', mood < 35 ? 'sad' : mood > 65 ? 'smile' : 'flat');
        }
        // снежинки на фоне экрана
        for (let i = 0; i < 4; i++) px((i * 13 + 5) % 46, 7 + (frame + i * 7) % 23);
      }
      function paint() {
        ['food', 'joy', 'rest'].forEach((k) => {
          const b = $(`[data-s=${k}]`, body);
          b.style.width = s[k] + '%';
          b.classList.toggle('low', s[k] < 35);
        });
        const days = Math.floor((Date.now() - s.born) / (24 * HOUR));
        const age = days ? `Котику ${days} дн. ` : 'Котик только что родился. ';
        say.textContent = age + (s.sleep ? 'Тихо, спит.' : s.food < 35 ? 'Хочет рыбку!' : s.joy < 35 ? 'Скучает, поиграй с ним.' : s.rest < 35 ? 'Зевает, пора спать.' : 'Всем доволен.');
        s.at = Date.now();
        store.set('tama', s);
      }
      function act(k) {
        if (k === 'sleep') { s.sleep = !s.sleep; sound.tone(s.sleep ? 330 : 660, 0, .18, .08, 'square'); paint(); draw(); return; }
        if (s.sleep) { sound.err(); say.textContent = 'Котик спит. Сначала разбуди его луной.'; return; }
        if (k === 'food') {
          if (s.food > 96) { say.textContent = 'Котик сыт и отворачивается.'; return; }
          s.food = clamp(s.food + 22, 0, 100); s.rest = clamp(s.rest - 2, 0, 100);
          anim = 'food'; animT = 0;
          s.fed = (s.fed || 0) + 1;
          if (FH.ach) FH.ach.give('tama');
          sound.pick();
        }
        if (k === 'play') {
          s.joy = clamp(s.joy + 20, 0, 100); s.food = clamp(s.food - 4, 0, 100); s.rest = clamp(s.rest - 6, 0, 100);
          anim = 'jump'; animT = 0;
          sound.win();
          const r = cv.getBoundingClientRect();
          FH.fx.spawn(r.left + r.width / 2, r.top + 10, {kind: 'heart', n: 5, power: 70, life: 1.200});
        }
        paint();
      }
      body.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a); });
      timer = setInterval(() => {
        if (anim) { animT++; if (animT > 7) anim = null; }
        // живёт и пока окно открыто
        const dec = 1 / 240;
        s.food = Math.max(10, s.food - dec * 5);
        s.joy = Math.max(10, s.joy - dec * 4);
        s.rest = s.sleep ? Math.min(100, s.rest + dec * 18) : Math.max(10, s.rest - dec * 3);
        if (frame % 8 === 0) paint();
        draw();
      }, 450);
      win.onClose = () => { clearInterval(timer); paint(); };
      draw();
      paint();
    },
  });
})();

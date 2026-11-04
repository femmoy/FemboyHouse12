// Небольшие окна: чат, игра, о системе, просмотр рисунков.
(() => {
  const { $, $$, esc, icon, links, clamp, sound } = FH;
  const wm = FH.wm;
  const A = (href) => `href="${href}" target="_blank" rel="noopener noreferrer"`;

  wm.register('tg', {
    title: 'Телеграм-чат с фембоями', icon: 'tg', w: 470, fit: true, dx: -150, dy: -50,
    mount(body) {
      body.innerHTML = `<div class="dlg">
        <div class="dlg-i">${icon('tg')}</div>
        <div class="dlg-t">
          <h4>Открыть чат с фембоями?</h4>
          <p>Чат откроется в Телеграме. Там можно общаться и знакомиться с такими же, как ты.</p>
          <div class="tip"><b>💡 Совет:</b> не пиши в чате адрес, школу и другие личные данные, и не отправляй фото незнакомцам. Если кто-то давит или просит лишнего, сразу расскажи админам.</div>
        </div>
        <div class="btns">
          <a class="xp-btn def" ${A(links.tg)}>Открыть чат</a>
          <button class="xp-btn" type="button" data-x>Отмена</button>
        </div>
      </div>`;
    },
  });

  wm.register('game', {
    title: 'Украсть коробку — Roblox', icon: 'game', w: 520, fit: true, dx: 130, dy: 20,
    mount(body) {
      body.innerHTML = `<div class="dlg">
        <div class="shot"><img src="game.jpg" width="720" height="391" alt="Карта игры «Украсть коробку»: сверху, с четырьмя базами"><span class="age">16+</span></div>
        <div class="dlg-i">${icon('game')}</div>
        <div class="dlg-t">
          <h4>Украсть коробку 🎀 Ограбление</h4>
          <p>Моя игра в Роблоксе. Пока что она 16+.</p>
          <p>Хочешь размяться прямо здесь? В мини-игре можно украсть коробку, не выходя с этого сайта.</p>
        </div>
        <div class="btns">
          <a class="xp-btn def" ${A(links.game)}>Играть в Роблоксе</a>
          <button class="xp-btn" type="button" data-open="box">Мини-игра</button>
          <button class="xp-btn" type="button" data-x>Закрыть</button>
        </div>
      </div>`;
    },
  });

  wm.register('about', {
    title: 'Свойства системы', icon: 'props', w: 430, fit: true,
    mount(body, win) {
      const started = Date.now();
      body.innerHTML = `<div class="tabs" role="tablist"><button class="tab on" type="button" role="tab">Общие</button></div>
        <div class="sheet about">
          <div class="ab-logo">${icon('paw')}<div><b>Фембой хаус<sup>xp</sup></b><small>Домашний выпуск</small></div></div>
          <dl>
            <dt>Система</dt><dd>Фембой хаус, версия 2026<br>Сборка «уютная зима»</dd>
            <dt>Владелец</dt><dd>Белый котик в новогодней шапке</dd>
            <dt>Компьютер</dt><dd>Котик, 3.6 ГГц, мурчит<br>Снега: сколько нападает</dd>
            <dt>Этот экран</dt><dd class="ab-scr"></dd>
            <dt>Работает уже</dt><dd class="ab-up"></dd>
          </dl>
          <p class="ab-note">Это шуточная оболочка в духе старых компьютеров, а не настоящая система. Всё, что ты здесь делаешь, остаётся в твоём браузере.</p>
        </div>
        <div class="btns pad"><button class="xp-btn def" type="button" data-x>ОК</button></div>`;
      const up = $('.ab-up', body), scr = $('.ab-scr', body);
      const paint = () => {
        const s = Math.floor((Date.now() - started) / 1000);
        up.textContent = `${Math.floor(s / 60)} мин ${s % 60} с`;
        scr.textContent = `${innerWidth} × ${innerHeight} точек`;
      };
      paint();
      const t = setInterval(paint, 1000);
      win.onClose = () => clearInterval(t);
    },
  });

  const PICS = [
    {src: 'avatar.webp', name: 'avatar.webp', alt: 'Аватарка: белый котик в новогодней шапке'},
    {src: 'game.jpg', name: 'game.jpg', alt: 'Карта игры «Украсть коробку»'},
  ];
  wm.register('viewer', {
    title: 'Просмотр рисунков', icon: 'image', w: 620, h: 500, minW: 320, minH: 260, dx: -30, dy: 10,
    mount(body, win, args) {
      let i = Math.max(0, PICS.findIndex((p) => args && p.src === args.src)), zoom = 1;
      body.classList.add('vw');
      body.innerHTML = `<div class="vw-stage"><img alt=""></div>
        <div class="vw-bar">
          <button type="button" class="tbb sm" data-a="prev" title="Предыдущий">${icon('back')}</button>
          <button type="button" class="tbb sm" data-a="next" title="Следующий">${icon('fwd')}</button>
          <i class="tbsep"></i>
          <button type="button" class="vw-z" data-a="out" title="Уменьшить">−</button>
          <button type="button" class="vw-z wide" data-a="fit" title="По размеру окна">100%</button>
          <button type="button" class="vw-z" data-a="in" title="Увеличить">+</button>
        </div>`;
      const img = $('img', body), stage = $('.vw-stage', body), pct = $('[data-a=fit]', body);
      const paint = () => {
        const p = PICS[i];
        if (img.getAttribute('src') !== p.src) { img.src = p.src; img.alt = p.alt; }
        img.style.transform = `scale(${zoom})`;
        pct.textContent = Math.round(zoom * 100) + '%';
        win.setTitle(`${p.name} — Просмотр рисунков`);
      };
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'prev') { i = (i + PICS.length - 1) % PICS.length; zoom = 1; }
        if (a === 'next') { i = (i + 1) % PICS.length; zoom = 1; }
        if (a === 'in') zoom = clamp(zoom * 1.25, .25, 6);
        if (a === 'out') zoom = clamp(zoom / 1.25, .25, 6);
        if (a === 'fit') zoom = 1;
        paint();
      });
      stage.addEventListener('wheel', (e) => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.12 : .89), .25, 6); paint(); }, {passive: false});
      win.onArgs = (a) => { if (a) { i = Math.max(0, PICS.findIndex((p) => p.src === a.src)); zoom = 1; paint(); } };
      paint();
    },
  });

  // кнопки «Закрыть» и «Отмена» внутри окон
  document.addEventListener('click', (e) => {
    const x = e.target.closest('[data-x]');
    if (!x) return;
    const el = x.closest('.win');
    const w = el && wm.list().find((v) => v.el === el);
    if (w) { sound.click(); w.close(); }
  });
})();

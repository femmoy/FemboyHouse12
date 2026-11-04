// Оболочка: загрузка, вход, значки, «пуск», трей, контекстное меню, выход, заставка.
(() => {
  const { $, $$, wide, coarse, reduce, clamp, esc, links, store, sess, icon, sound, openMenu, closeMenus } = FH;
  const wm = FH.wm;
  const desk = $('#desk'), iconsBox = $('#icons');

  // ---------- запуск приложений (профиль, компьютер и корзина живут в одном проводнике)
  const aliases = {profile: 'home', computer: 'computer', bin: 'bin', docs: 'docs', pics: 'pics', c: 'c'};
  FH.launch = (id, args) => (aliases[id] ? wm.open('explorer', aliases[id]) : wm.open(id, args));
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open]');
    if (t && !t.classList.contains('dicon')) { e.preventDefault(); FH.launch(t.dataset.open); }
  });

  // ---------- значки рабочего стола
  const ICONS = [
    {id: 'profile', label: 'Фембой хаус', ico: 'avatar'},
    {id: 'tg', label: 'Телеграм-чат', ico: 'tg', lnk: true},
    {id: 'game', label: 'Украсть коробку', ico: 'game', lnk: true, badge: '16+'},
    {id: 'box', label: 'Мини-игра', ico: 'box'},
    {id: 'tv', label: 'Видик', ico: 'tv'},
    {id: 'roulette', label: 'Рулетка идей', ico: 'wheel'},
    {id: 'notes', label: 'Идеи.txt', ico: 'note'},
    {id: 'mines', label: 'Сапёр', ico: 'mine'},
    {id: 'paint', label: 'Рисовалка', ico: 'paint'},
    {id: 'player', label: 'КотАмп', ico: 'player'},
    {id: 'tama', label: 'Котогочи', ico: 'tama'},
    {id: 'computer', label: 'Мой компьютер', ico: 'computer'},
    {id: 'bin', label: 'Корзина', ico: 'binfull', right: true},
  ];
  const CW = 88, CH = 88, PAD = 8;
  let positions = store.get('icons', {});

  ICONS.forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dicon';
    b.dataset.open = d.id;
    b.innerHTML = `<span class="di">${icon(d.ico)}${d.lnk ? '<i class="ar"></i>' : ''}${d.badge ? `<i class="bdg">${d.badge}</i>` : ''}</span><span>${esc(d.label)}</span>`;
    d.el = b;
    b.addEventListener('click', (e) => {
      if (b.dragged) { b.dragged = false; return; }
      if (!e.ctrlKey) clearSel();
      b.classList.add('sel');
      if (coarse) FH.launch(d.id);
    });
    b.addEventListener('dblclick', () => FH.launch(d.id));
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); FH.launch(d.id); } });
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      clearSel(); b.classList.add('sel');
      openMenu([
        {label: 'Открыть', def: true, action: () => FH.launch(d.id)},
        d.id === 'bin' && {label: 'Очистить корзину', action: () => FH.launch('bin')},
        d.id === 'tg' && {label: 'Перейти в Телеграм', href: links.tg},
        d.id === 'game' && {label: 'Играть в Роблоксе', href: links.game},
        {sep: true},
        {label: 'Свойства', action: () => wm.msg({title: 'Свойства: ' + d.label, ico: d.ico === 'avatar' ? 'props' : d.ico, sound: null, html: `<h4>${esc(d.label)}</h4><p>Значок на рабочем столе Фембой хауса. Его можно перетаскивать, сайт запомнит, куда ты его поставил(а).</p>`})},
      ], e.clientX, e.clientY);
    });
    if (!coarse) dragIcon(b, d);
    iconsBox.append(b);
  });

  function clearSel() { $$('.dicon.sel').forEach((x) => x.classList.remove('sel')); }

  function layout() {
    if (!wide()) { ICONS.forEach((d) => { d.el.style.left = d.el.style.top = ''; }); return; }
    const W = desk.clientWidth, H = desk.clientHeight;
    const rows = Math.max(1, Math.floor((H - PAD) / CH)), cols = Math.max(1, Math.floor((W - PAD) / CW));
    const taken = new Set();
    const key = (c, r) => c + ':' + r;
    ICONS.forEach((d) => {
      const p = positions[d.id];
      if (p) { const c = clamp(p.c, 0, cols - 1), r = clamp(p.r, 0, rows - 1); taken.add(key(c, r)); d.c = c; d.r = r; } else d.c = null;
    });
    let c = 0, r = 0;
    ICONS.forEach((d) => {
      if (d.c === null) {
        if (d.right) { d.c = cols - 1; d.r = rows - 1; taken.add(key(d.c, d.r)); }
        else {
          while (taken.has(key(c, r))) { r++; if (r >= rows) { r = 0; c++; } }
          d.c = c; d.r = r;
          taken.add(key(c, r));
        }
      }
      d.el.style.left = PAD + d.c * CW + 'px';
      d.el.style.top = PAD + d.r * CH + 'px';
    });
  }

  function dragIcon(b, d) {
    let on = false, sx, sy, ox, oy, moved = false;
    b.addEventListener('pointerdown', (e) => {
      if (e.button || !wide()) return;
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY; ox = b.offsetLeft; oy = b.offsetTop;
      b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove', (e) => {
      if (!on) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true;
      b.classList.add('drag');
      b.style.left = ox + dx + 'px';
      b.style.top = oy + dy + 'px';
    });
    b.addEventListener('pointerup', () => {
      if (!on) return;
      on = false;
      if (!moved) return;
      b.classList.remove('drag');
      b.dragged = true;
      const W = desk.clientWidth, H = desk.clientHeight;
      const c = clamp(Math.round((b.offsetLeft - PAD) / CW), 0, Math.floor((W - PAD) / CW) - 1);
      const r = clamp(Math.round((b.offsetTop - PAD) / CH), 0, Math.floor((H - PAD) / CH) - 1);
      // занятую клетку меняем местами с тем, кто там стоял
      const other = ICONS.find((x) => x !== d && x.c === c && x.r === r);
      if (other) { positions[other.id] = {c: d.c, r: d.r}; }
      positions[d.id] = {c, r};
      store.set('icons', positions);
      layout();
    });
    b.addEventListener('pointercancel', () => { on = false; b.classList.remove('drag'); layout(); });
  }

  layout();
  addEventListener('resize', layout);

  // рамка выделения
  (() => {
    const mq = $('#marquee');
    let on = false, sx = 0, sy = 0;
    const bg = (t) => t === desk || t.id === 'icons' || t.id === 'snow' || t.closest('#wall');
    desk.addEventListener('pointerdown', (e) => {
      if (!bg(e.target)) return;
      clearSel();
      closeMenus();
      wm.blur();
      if (coarse || e.button) return;
      on = true; sx = e.clientX; sy = e.clientY;
      mq.style.cssText = `left:${sx}px;top:${sy}px;width:0;height:0`;
      mq.hidden = false;
      desk.setPointerCapture(e.pointerId);
    });
    desk.addEventListener('pointermove', (e) => {
      if (!on) return;
      const l = Math.min(sx, e.clientX), t = Math.min(sy, e.clientY), w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy);
      mq.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`;
      ICONS.forEach((d) => {
        const r = d.el.getBoundingClientRect();
        d.el.classList.toggle('sel', r.left < l + w && r.right > l && r.top < t + h && r.bottom > t);
      });
    });
    const end = () => { on = false; mq.hidden = true; };
    desk.addEventListener('pointerup', end);
    desk.addEventListener('pointercancel', end);
  })();

  // контекстное меню стола
  desk.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.win, .dicon')) return;
    e.preventDefault();
    openMenu([
      {label: 'Упорядочить значки', action: () => { positions = {}; store.del('icons'); layout(); }},
      {label: 'Обновить', action: refreshDesk},
      {sep: true},
      {label: 'Обои', sub: () => [...Object.entries(FH.scene.SKIES).map(([k, s]) => ({label: s.name, radio: FH.scene.sky === k, action: () => FH.scene.setSky(k)})), {sep: true}, {label: 'По времени суток', radio: FH.scene.sky === 'auto', action: () => FH.scene.setSky('auto')}]},
      {label: 'Снег', check: FH.scene.snow, action: () => { FH.scene.snow = !FH.scene.snow; }},
      {label: 'Гирлянды', check: FH.scene.garland, action: () => { FH.scene.garland = !FH.scene.garland; }},
      {label: 'Котик', check: FH.pet.on, action: () => { FH.pet.on = !FH.pet.on; }},
      {label: 'Плёнка', sub: () => [...Object.entries(FH.vhs.MODES).map(([k, m]) => ({label: m.name, radio: FH.vhs.mode === k, action: () => { FH.vhs.mode = k; }})), {sep: true}, {label: 'Сбой сейчас', disabled: FH.vhs.mode === 'off', action: () => FH.vhs.glitch('tear')}, {label: 'Перемотка', disabled: FH.vhs.mode === 'off', action: () => FH.vhs.rewind()}]},
      {sep: true},
      {label: 'Заставка сейчас', action: () => saver(store.get('saver', 'vcr'))},
      {label: 'Свойства', def: true, icon: 'display', action: () => wm.open('display')},
    ], e.clientX, e.clientY);
  });
  function refreshDesk() {
    iconsBox.style.visibility = 'hidden';
    sound.click();
    setTimeout(() => { iconsBox.style.visibility = ''; }, 160);
  }

  // ---------- панель быстрого запуска
  $('#quick').innerHTML = `<a href="${links.tg}" target="_blank" rel="noopener noreferrer" title="Телеграм-чат с фембоями" aria-label="Телеграм-чат с фембоями">${icon('tg')}</a>`
    + `<a href="${links.game}" target="_blank" rel="noopener noreferrer" title="Украсть коробку в Роблоксе" aria-label="Украсть коробку в Роблоксе">${icon('game')}</a>`
    + `<button type="button" data-open="roulette" title="Рулетка идей" aria-label="Рулетка идей">${icon('wheel')}</button>`;

  // ---------- меню «пуск»
  const menu = $('#smenu'), startBtn = $('#start');
  const prog = (id, label, ico) => ({label, icon: ico, action: () => FH.launch(id)});
  const programs = () => [
    {label: 'Игры', icon: 'folder', sub: [prog('box', 'Украсть коробку: мини-игра', 'box'), prog('mines', 'Сапёр', 'mine'), prog('tama', 'Котогочи', 'tama'), {label: 'Украсть коробку в Роблоксе', icon: 'game', href: links.game}]},
    {label: 'Стандартные', icon: 'folder', sub: [prog('notes', 'Блокнот', 'note'), prog('paint', 'Рисовалка', 'paint'), prog('cmd', 'Командная строка', 'cmd'), prog('viewer', 'Просмотр рисунков', 'image')]},
    {label: 'Служебные', icon: 'folder', sub: [prog('taskmgr', 'Диспетчер задач', 'taskmgr'), prog('display', 'Свойства экрана', 'display'), prog('about', 'О системе', 'props')]},
    {sep: true},
    prog('tv', 'Видик', 'tv'), prog('roulette', 'Рулетка идей', 'wheel'), prog('player', 'КотАмп', 'player'), prog('ach', 'Достижения', 'trophy'),
    {label: 'Телеграм-чат', icon: 'tg', href: links.tg},
  ];
  menu.innerHTML = `<header><img src="avatar.webp" alt=""><span>Фембой хаус<small>Рад гостям</small></span></header>
    <div class="scols">
      <div class="l">
        <a class="mi" href="${links.tg}" target="_blank" rel="noopener noreferrer">${icon('tg')}<span><b>Телеграм-чат</b><small>с фембоями</small></span></a>
        <a class="mi" href="${links.game}" target="_blank" rel="noopener noreferrer">${icon('game')}<span><b>Игра в Роблоксе</b><small>пока что 16+</small></span></a>
        <div class="sep"></div>
        <button class="mi" type="button" data-open="roulette">${icon('wheel')}<span>Рулетка идей</span></button>
        <button class="mi" type="button" data-open="box">${icon('box')}<span>Мини-игра</span></button>
        <button class="mi" type="button" data-open="tv">${icon('tv')}<span>Видик</span></button>
        <button class="mi" type="button" data-open="notes">${icon('note')}<span>Идеи для видео</span></button>
        <div class="sep"></div>
        <button class="mi all" type="button" id="allProg">Все программы</button>
      </div>
      <div class="r">
        <button class="mi" type="button" data-open="profile">${icon('avatar')}<span>Мой профиль</span></button>
        <button class="mi" type="button" data-open="docs">${icon('docs')}<span>Мои документы</span></button>
        <button class="mi" type="button" data-open="pics">${icon('pics')}<span>Мои рисунки</span></button>
        <button class="mi" type="button" data-open="computer">${icon('computer')}<span>Мой компьютер</span></button>
        <div class="sep"></div>
        <button class="mi thin" type="button" data-open="display">${icon('display')}<span>Оформление</span></button>
        <button class="mi thin" type="button" data-open="taskmgr">${icon('taskmgr')}<span>Диспетчер задач</span></button>
        <button class="mi thin" type="button" data-open="cmd">${icon('cmd')}<span>Командная строка</span></button>
        <div class="sep"></div>
        <button class="mi thin" type="button" data-open="ach">${icon('trophy')}<span>Достижения</span></button>
        <button class="mi thin" type="button" data-open="game">${icon('help')}<span>Об игре</span></button>
        <button class="mi thin" type="button" data-open="tg">${icon('info')}<span>О чате</span></button>
        <button class="mi thin" type="button" data-open="about">${icon('props')}<span>О системе</span></button>
      </div>
    </div>
    <footer><button type="button" id="logoff">${icon('off')}Завершение сеанса</button><button type="button" id="powerBtn">${icon('power')}Выключение</button></footer>`;
  FH.closeStart = () => { menu.hidden = true; startBtn.classList.remove('on'); startBtn.setAttribute('aria-expanded', 'false'); };
  const closeStart = FH.closeStart;
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePops();
    const show = menu.hidden;
    closeMenus();
    menu.hidden = !show;
    startBtn.classList.toggle('on', show);
    startBtn.setAttribute('aria-expanded', String(show));
    if (show) sound.click();
  });
  $('#allProg').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (wide()) openMenu(programs(), r.right - 2, r.bottom, {flipY: r.bottom});
    else openMenu(programs(), 6, r.top, {flipY: r.bottom});
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a.mi')) closeStart(); });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !e.target.closest('#smenu, #start, .ctx')) closeStart();
    if (!e.target.closest('.tpop, #volBtn, #clock')) closePops();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!menu.hidden) { closeStart(); startBtn.focus(); return; }
      if ($('.tpop')) { closePops(); return; }
      const a = wm.active && wm.get(wm.active);
      if (a && a.def.fit) a.close();
    }
    if (e.ctrlKey && e.key === 'Escape') startBtn.click();
    if (e.ctrlKey && e.shiftKey && e.key === 'Escape') wm.open('taskmgr');
  });
  $('#taskbar').addEventListener('contextmenu', (e) => {
    if (e.target.closest('.task')) return;
    e.preventDefault();
    openMenu([
      {label: 'Диспетчер задач', icon: 'taskmgr', action: () => wm.open('taskmgr')},
      {label: 'Свойства экрана', icon: 'display', action: () => wm.open('display')},
      {sep: true},
      {label: 'Свернуть все окна', action: () => wm.list().forEach((w) => wm.minimize(w.id))},
    ], e.clientX, e.clientY, {flipY: e.clientY});
  });

  // ---------- часы и календарь
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}); clock.title = new Date().toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}); };
  tick();
  setInterval(tick, 15000);

  let pop = null, popTimer = 0;
  function closePops() { if (pop) { pop.remove(); pop = null; clearInterval(popTimer); } }
  function showPop(el) { closePops(); pop = el; document.body.append(el); }

  clock.addEventListener('click', () => {
    if (pop && pop.classList.contains('calpop')) { closePops(); return; }
    const box = document.createElement('div');
    box.className = 'tpop calpop';
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    const marks = Array.from({length: 12}, (_, i) => { const a = i * 30 * Math.PI / 180, r0 = i % 3 ? 44 : 40; return `<line x1="${50 + Math.sin(a) * r0}" y1="${50 - Math.cos(a) * r0}" x2="${50 + Math.sin(a) * 47}" y2="${50 - Math.cos(a) * 47}" stroke="#1a4fb0" stroke-width="${i % 3 ? 1.500 : 3}"/>`; }).join('');
    box.innerHTML = `<div class="cal-clock"><svg viewBox="0 0 100 100" role="img" aria-label="Часы"><circle cx="50" cy="50" r="49" fill="#fff" stroke="#7f9db9"/>${marks}<line class="hh" x1="50" y1="50" x2="50" y2="26" stroke="#14163a" stroke-width="4" stroke-linecap="round"/><line class="mm" x1="50" y1="50" x2="50" y2="14" stroke="#14163a" stroke-width="3" stroke-linecap="round"/><line class="ss" x1="50" y1="56" x2="50" y2="10" stroke="#e0327f" stroke-width="1.300"/><circle cx="50" cy="50" r="3.500" fill="#e0327f"/></svg><b class="dt"></b></div><div class="cal-head"><button type="button" class="p" aria-label="Прошлый месяц">◀</button><span class="t"></span><button type="button" class="n" aria-label="Следующий месяц">▶</button></div><div class="cal"></div>`;
    const render = () => {
      $('.t', box).textContent = new Date(y, m, 1).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'}).replace(' г.', '');
      const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), prev = new Date(y, m, 0).getDate();
      let h = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => `<i>${d}</i>`).join('');
      for (let i = first - 1; i >= 0; i--) h += `<span class="muted">${prev - i}</span>`;
      for (let d = 1; d <= days; d++) h += `<span class="${d === now.getDate() && m === now.getMonth() && y === now.getFullYear() ? 'now' : ''}">${d}</span>`;
      for (let d = 1; (first + days + d - 1) % 7 !== 0; d++) h += `<span class="muted">${d}</span>`;
      $('.cal', box).innerHTML = h;
    };
    const hands = () => {
      const t = new Date(), S = t.getSeconds(), M = t.getMinutes() + S / 60, H = t.getHours() % 12 + M / 60;
      $('.hh', box).setAttribute('transform', `rotate(${H * 30} 50 50)`);
      $('.mm', box).setAttribute('transform', `rotate(${M * 6} 50 50)`);
      $('.ss', box).setAttribute('transform', `rotate(${S * 6} 50 50)`);
      $('.dt', box).textContent = t.toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long'});
    };
    $('.p', box).addEventListener('click', () => { m--; if (m < 0) { m = 11; y--; } render(); });
    $('.n', box).addEventListener('click', () => { m++; if (m > 11) { m = 0; y++; } render(); });
    render(); hands();
    showPop(box);
    popTimer = setInterval(hands, 1000);
  });

  // ---------- звук в трее
  const volBtn = $('#volBtn');
  const paintVol = () => { volBtn.setAttribute('aria-pressed', String(sound.on)); $('use', volBtn).setAttribute('href', sound.on ? '#i-vol' : '#i-mute'); };
  paintVol();
  volBtn.addEventListener('click', () => {
    if (pop && pop.classList.contains('volpop')) { closePops(); return; }
    const box = document.createElement('div');
    box.className = 'tpop volpop';
    box.innerHTML = `<h5>Громкость</h5><input class="xp-range" type="range" min="0" max="100" value="${Math.round(sound.vol * 100)}" aria-label="Громкость"><label><input type="checkbox" ${sound.on ? '' : 'checked'}>Выкл.</label>`;
    $('input[type=range]', box).addEventListener('input', (e) => { sound.vol = e.target.value / 100; });
    $('input[type=range]', box).addEventListener('change', () => sound.ding());
    $('input[type=checkbox]', box).addEventListener('change', (e) => { sound.on = !e.target.checked; paintVol(); if (sound.on) sound.ding(); });
    showPop(box);
  });

  // ---------- снег и котик в трее
  const snowBtn = $('#snowBtn');
  snowBtn.setAttribute('aria-pressed', String(FH.scene.snow));
  snowBtn.addEventListener('click', () => { FH.scene.snow = !FH.scene.snow; });
  $('#petBtn').addEventListener('click', () => { FH.pet.on = !FH.pet.on; });
  const vhsBtn = $('#vhsBtn');
  vhsBtn.setAttribute('aria-pressed', String(FH.vhs.mode !== 'off'));
  vhsBtn.addEventListener('click', () => {
    sound.click();
    if (FH.vhs.mode !== 'off') { store.set('vhsLast', FH.vhs.mode); FH.vhs.mode = 'off'; }
    else FH.vhs.mode = store.get('vhsLast', coarse ? 'soft' : 'normal');
  });

  // ---------- уведомление из трея
  const balloon = $('#balloon');
  let balloonTimer = 0, balloonAct = null;
  function showBalloon(ico, title, text, act) {
    $('#balloonT').innerHTML = `${icon(ico)}${esc(title)}`;
    $('#balloonP').textContent = text;
    balloonAct = act;
    balloon.hidden = false;
    sound.notify();
    clearTimeout(balloonTimer);
    balloonTimer = setTimeout(() => { balloon.hidden = true; }, 12000);
  }
  $('#balloonX').addEventListener('click', (e) => { e.stopPropagation(); balloon.hidden = true; clearTimeout(balloonTimer); });
  balloon.addEventListener('click', () => { balloon.hidden = true; clearTimeout(balloonTimer); if (balloonAct) balloonAct(); });
  FH.balloon = showBalloon;

  // ---------- заставка
  let saverEl = null, idleAt = performance.now();
  function saver(mode) {
    if (saverEl) return;
    closeStart();
    saverEl = document.createElement('div');
    saverEl.className = 'saver';
    const c = document.createElement('canvas');
    saverEl.append(c);
    document.body.append(saverEl);
    // видик на паузе показывает заставку через настоящий шейдер плёнки
    const gl = mode === 'vcr' ? FH.crt(c) : null;
    if (mode === 'vcr' && !gl) mode = 'cat';
    const src = gl ? document.createElement('canvas') : null, sx = src ? src.getContext('2d') : null;
    if (src) { src.width = 480; src.height = 360; }
    const x = gl ? null : c.getContext('2d');
    let raf = 0, W = 0, H = 0;
    const fit = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    fit();
    const img = new Image();
    img.src = 'avatar.webp';
    const sz = Math.min(220, Math.min(innerWidth, innerHeight) * .4);
    let px = Math.random() * (W - sz), py = Math.random() * (H - sz), vx = 130, vy = 104, hue = 0;
    const stars = Array.from({length: 240}, () => ({x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random()}));
    const vb = {x: 70, y: 44, vx: 58, vy: 44, hue: 320};
    let last = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      if (gl) {
        vb.x += vb.vx * dt; vb.y += vb.vy * dt;
        if (vb.x < 8 || vb.x > 340) { vb.vx = -vb.vx; vb.x = clamp(vb.x, 8, 340); vb.hue = (vb.hue + 70) % 360; }
        if (vb.y < 44 || vb.y > 226) { vb.vy = -vb.vy; vb.y = clamp(vb.y, 44, 226); vb.hue = (vb.hue + 70) % 360; }
        sx.fillStyle = '#1a2fd0'; sx.fillRect(0, 0, 480, 360);
        sx.save(); sx.beginPath(); sx.arc(vb.x + 66, vb.y + 44, 44, 0, 6.283); sx.clip();
        if (img.complete && img.naturalWidth) sx.drawImage(img, vb.x + 22, vb.y, 88, 88);
        sx.restore();
        sx.font = '700 17px "Trebuchet MS", Tahoma, sans-serif'; sx.textAlign = 'center'; sx.textBaseline = 'middle';
        sx.fillStyle = `hsl(${vb.hue},95%,78%)`; sx.fillText('ФЕМБОЙ ХАУС', vb.x + 66, vb.y + 104);
        sx.font = '700 26px Consolas, "Lucida Console", monospace'; sx.textAlign = 'left'; sx.textBaseline = 'top';
        sx.fillStyle = '#fff'; sx.fillText('PAUSE ❚❚', 22, 18);
        const t = now / 1000;
        gl.render(src, {t, curve: .07, power: 1, scan: .13, wobble: .8, chroma: 1, noise: .2, bands: .5, bandAt: .2 + Math.sin(t * .4) * .03, jitter: .8});
        return;
      }
      if (mode === 'stars') {
        x.fillStyle = 'rgba(0,0,12,.4)';
        x.fillRect(0, 0, W, H);
        x.fillStyle = '#fff';
        for (const s of stars) {
          s.z -= dt * .28;
          if (s.z <= .02) { s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; s.z = 1; }
          const k = .34 / s.z, sx = W / 2 + s.x * W * k, sy = H / 2 + s.y * W * k, r = (1 - s.z) * 3.200;
          x.globalAlpha = 1 - s.z;
          x.beginPath(); x.arc(sx, sy, r, 0, 6.283); x.fill();
        }
        x.globalAlpha = 1;
      } else {
        x.fillStyle = 'rgba(4,4,28,.2)';
        x.fillRect(0, 0, W, H);
        px += vx * dt; py += vy * dt;
        if (px < 0 || px + sz > W) { vx = -vx; px = clamp(px, 0, W - sz); hue = (hue + 60) % 360; }
        if (py < 0 || py + sz > H) { vy = -vy; py = clamp(py, 0, H - sz); hue = (hue + 60) % 360; }
        x.save();
        x.shadowColor = `hsl(${hue + 200},90%,70%)`;
        x.shadowBlur = 34;
        if (img.complete && img.naturalWidth) {
          x.beginPath(); x.arc(px + sz / 2, py + sz / 2, sz / 2, 0, 6.283);
          x.fillStyle = '#fff'; x.fill();
          x.clip();
          x.drawImage(img, px, py, sz, sz);
        }
        x.restore();
      }
    };
    raf = requestAnimationFrame(loop);
    const armed = performance.now();
    const quit = () => {
      if (performance.now() - armed < 500) return;
      cancelAnimationFrame(raf);
      removeEventListener('resize', fit);
      ['pointermove', 'pointerdown', 'keydown'].forEach((k) => removeEventListener(k, quit, true));
      saverEl.remove();
      saverEl = null;
      idleAt = performance.now();
    };
    addEventListener('resize', fit);
    ['pointermove', 'pointerdown', 'keydown'].forEach((k) => addEventListener(k, quit, true));
  }
  FH.saver = saver;
  ['pointermove', 'pointerdown', 'keydown'].forEach((k) => addEventListener(k, () => { idleAt = performance.now(); }, {passive: true}));
  setInterval(() => {
    const min = store.get('saverMin', 3), mode = store.get('saver', 'vcr');
    if (coarse || reduce || !min || mode === 'off' || saverEl || !loggedIn || document.hidden) return;
    if (performance.now() - idleAt > min * 60000) saver(mode);
  }, 5000);

  // ---------- синий экран
  FH.bsod = () => {
    closeStart();
    FH.pet.hideSay && FH.pet.hideSay();
    const el = document.createElement('div');
    el.className = 'bsod';
    el.setAttribute('role', 'alert');
    el.textContent = `Обнаружена проблема: слишком много уюта.
Работа компьютера остановлена, чтобы котик мог поспать.

ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:

*** STOP: 0x000000CA7 (0xC0FFEE, 0xBADF00D, 0x00000016, 0x00000000)

***  kotik.sys - адрес 0xFACADE, база 0xB0X0000, дата 03.11.2026

Если вы видите этот экран впервые, ничего страшного не случилось.
Это шутка, ваш настоящий компьютер в порядке.

Нажмите любую клавишу или щёлкните, чтобы перезагрузить.`;
    document.body.append(el);
    sound.err();
    if (FH.ach) FH.ach.give('bsod');
    const go = () => { removeEventListener('keydown', go); el.remove(); restart(); };
    el.addEventListener('click', go);
    addEventListener('keydown', go);
  };

  // «explorer.exe» из диспетчера задач: стол и панель пропадают и возвращаются
  FH.restartExplorer = () => {
    const t = $('#taskbar');
    iconsBox.style.visibility = 'hidden';
    t.style.visibility = 'hidden';
    closeStart();
    setTimeout(() => { iconsBox.style.visibility = ''; t.style.visibility = ''; sound.ding(); }, 1600);
  };

  // ---------- вход, выход, выключение
  const welcome = $('#welcome'), boot = $('#boot');
  let loggedIn = false;

  function enter(fast) {
    welcome.classList.add('out');
    setTimeout(() => { welcome.hidden = true; }, fast ? 0 : 520);
    sess.set('in', 1);
    loggedIn = true;
    if (!sess.get('counted')) { sess.set('counted', 1); store.set('visits', store.get('visits', 0) + 1); }
    FH.pet.start();
    if (!wm.get('explorer')) FH.launch('profile');
    FH.ach.give('first');
    FH.vhs.osd('PLAY ►');
    if (!fast && !sess.get('balloon')) setTimeout(() => {
      sess.set('balloon', 1);
      if (loggedIn) showBalloon('tg', 'У вас новое приглашение', 'Телеграм-чат с фембоями ждёт тебя. Нажми, чтобы открыть.', () => wm.open('tg'));
    }, 4500);
  }
  function showWelcome() {
    welcome.hidden = false;
    welcome.classList.remove('busy');
    welcome.classList.remove('out');
    $('#login').focus();
  }
  $('#login').addEventListener('click', () => {
    sound.chime();
    FH.vhs.blip(1);
    welcome.classList.add('busy');
    setTimeout(() => enter(false), reduce ? 300 : 1200);
  });

  function logout() {
    loggedIn = false;
    sound.bye();
    FH.vhs.osd('STOP ■');
    closeStart(); closeMenus(); closePops();
    balloon.hidden = true;
    FH.pet.stop();
    wm.list().forEach((w) => wm.close(w.id));
    sess.del('in');
    showWelcome();
  }

  function sysDialog(title, ico, buttons) {
    const root = document.documentElement;
    closeStart();
    root.classList.add('gray');
    const el = document.createElement('div');
    el.className = 'sysdlg';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = `<div class="sd-box"><div class="sd-top"><span>${esc(title)}</span>${icon(ico)}</div><div class="sd-mid">${buttons.map((b, i) => `<button class="sd-btn" type="button" data-i="${i}">${icon(b.ico)}<span>${esc(b.label)}</span></button>`).join('')}</div><div class="sd-bot"><button class="xp-btn" type="button" data-x>Отмена</button></div></div>`;
    const done = () => { el.remove(); root.classList.remove('gray'); removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(); } };
    addEventListener('keydown', onKey);
    $('[data-x]', el).addEventListener('click', done);
    $$('.sd-btn', el).forEach((b) => b.addEventListener('click', () => { done(); buttons[+b.dataset.i].action(); }));
    document.body.append(el);
    $('[data-x]', el).focus();
  }
  $('#logoff').addEventListener('click', () => sysDialog('Завершение сеанса', 'paw', [
    {label: 'Смена пользователя', ico: 'swap', action: logout},
    {label: 'Выход', ico: 'off', action: logout},
  ]));
  const powerDialog = () => sysDialog('Выключить компьютер', 'paw', [
    {label: 'Ждущий режим', ico: 'sleep', action: () => saver(store.get('saver', 'vcr') === 'off' ? 'vcr' : store.get('saver', 'vcr'))},
    {label: 'Выключение', ico: 'power', action: powerOff},
    {label: 'Перезагрузка', ico: 'restart', action: restart},
  ]);
  $('#powerBtn').addEventListener('click', powerDialog);
  $('#wPower').addEventListener('click', powerDialog);

  function powerOff() {
    loggedIn = false;
    sound.bye();
    wm.list().forEach((w) => wm.close(w.id));
    FH.pet.stop();
    sess.del('in');
    const el = document.createElement('div');
    el.className = 'poweroff';
    el.innerHTML = '<div>Теперь питание компьютера можно отключить.<small>Щёлкните, чтобы включить снова</small></div>';
    el.addEventListener('click', () => { el.remove(); runBoot(); });
    FH.vhs.powerOff(() => document.body.append(el));
  }
  function restart() {
    loggedIn = false;
    wm.list().forEach((w) => wm.close(w.id));
    FH.pet.stop();
    sess.del('in');
    FH.vhs.powerOff(runBoot);
  }

  function runBoot() {
    if (reduce) { boot.hidden = true; showWelcome(); return; }
    FH.vhs.powerOn();
    const post = $('#post'), logo = $('#bootlogo');
    boot.hidden = false;
    logo.hidden = true;
    post.hidden = false;
    post.textContent = '';
    welcome.hidden = false;
    welcome.classList.remove('busy', 'out');
    const lines = [
      'Фембой BIOS 5.1, уютная версия',
      '(C) 2026 Уют и котики',
      '',
      'Процессор: Котик 3.6 ГГц, мурчит',
      'Проверка памяти: 65536 КБ в порядке',
      'Найдено: 1 коробка, 4 базы, снег',
      'Загрузка системы...',
    ];
    let finished = false;
    const timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      boot.hidden = true;
      boot.removeEventListener('click', finish);
      removeEventListener('keydown', finish);
      $('#login').focus();
    };
    lines.forEach((l, i) => later(() => { post.textContent += l + '\n'; }, 60 + i * 90));
    later(() => { post.hidden = true; }, 950);
    later(() => { logo.hidden = false; }, 1120);
    later(finish, 2800);
    boot.addEventListener('click', finish);
    addEventListener('keydown', finish);
  }

  if (sess.get('in')) { boot.hidden = true; welcome.hidden = true; enter(true); }
  else if (sess.get('booted')) { boot.hidden = true; showWelcome(); }
  else { sess.set('booted', 1); runBoot(); }
})();

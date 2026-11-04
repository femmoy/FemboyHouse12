// Свойства экрана: обои, оформление окон, заставка. Настройки сохраняются в браузере.
(() => {
  const { $, $$, store, esc } = FH;
  const wm = FH.wm;
  const THEMES = [
    {id: '', name: 'Луна, голубая', a: '#0058ee', b: '#3a93ff', s: '#3ea53e'},
    {id: 'pink', name: 'Зефир, розовая', a: '#e8418f', b: '#ff8cc2', s: '#2f96ea'},
    {id: 'olive', name: 'Хвоя, оливковая', a: '#7f9a50', b: '#a8c070', s: '#d2822e'},
    {id: 'silver', name: 'Иней, серебристая', a: '#bfc3d4', b: '#e8eaf2', s: '#4aa94a'},
    {id: 'noir', name: 'Полночь, чёрная', a: '#1f1f2c', b: '#3c3c54', s: '#ee5ca0'},
  ];
  FH.setTheme = (id) => {
    if (id) document.documentElement.dataset.theme = id;
    else delete document.documentElement.dataset.theme;
    store.set('theme', id || null);
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = {pink: '#dc4690', olive: '#84a056', silver: '#bdc0d0', noir: '#232332'}[id] || '#245edb';
  };
  // тема из прошлого визита: цвет верхней полоски браузера тоже должен совпасть
  { const t = store.get('theme', null); if (t) FH.setTheme(t); }

  wm.register('display', {
    title: 'Свойства: Экран', icon: 'display', w: 440, fit: true, dx: -60, dy: 0,
    mount(body, win) {
      const before = {sky: FH.scene.sky, theme: store.get('theme', null), snow: FH.scene.snow, garland: FH.scene.garland, density: FH.scene.density, pet: FH.pet.on, saver: store.get('saver', 'vcr'), saverMin: store.get('saverMin', 3), vhs: FH.vhs.mode, osd: FH.vhs.showOsd};
      let tab = 'wall';
      body.innerHTML = `<div class="tabs" role="tablist">
          <button class="tab on" type="button" data-tab="wall">Рабочий стол</button>
          <button class="tab" type="button" data-tab="theme">Оформление</button>
          <button class="tab" type="button" data-tab="saver">Заставка</button>
          <button class="tab" type="button" data-tab="vhs">Плёнка</button>
        </div>
        <div class="sheet ds-sheet">
          <div class="ds-monitor"><div class="ds-screen"><i class="ds-hill a"></i><i class="ds-hill b"></i><i class="ds-win"><u></u></i><i class="ds-bar"><b></b></i></div><div class="ds-neck"></div><div class="ds-base"></div></div>
          <div class="ds-pane" data-p="wall">
            <label class="ds-l">Обои:</label>
            <div class="ds-list" role="listbox" data-list="sky"></div>
            <div class="ds-row"><label><input type="checkbox" data-opt="snow">Снег</label><label><input type="checkbox" data-opt="garland">Гирлянды</label><label><input type="checkbox" data-opt="pet">Котик</label></div>
            <div class="ds-row"><label class="ds-grow">Снегопад: <input class="xp-range" type="range" min="0.4" max="1.800" step="0.2" data-opt="density" aria-label="Снегопад"></label></div>
          </div>
          <div class="ds-pane" data-p="theme" hidden>
            <label class="ds-l">Оформление окон:</label>
            <div class="ds-list" role="listbox" data-list="theme"></div>
          </div>
          <div class="ds-pane" data-p="saver" hidden>
            <label class="ds-l">Заставка:</label>
            <div class="ds-row">
              <select class="xp-input" data-opt="saver" aria-label="Заставка"><option value="vcr">Видик на паузе</option><option value="cat">Прыгающий котик</option><option value="stars">Снежный полёт</option><option value="off">Нет</option></select>
              <button class="xp-btn" type="button" data-a="preview">Просмотр</button>
            </div>
            <div class="ds-row"><label>Включать через <select class="xp-input" data-opt="saverMin" aria-label="Минуты"><option value="1">1</option><option value="3">3</option><option value="5">5</option><option value="10">10</option></select> мин</label></div>
          </div>
          <div class="ds-pane" data-p="vhs" hidden>
            <label class="ds-l">Как сильно зажевало кассету:</label>
            <div class="ds-list" role="listbox" data-list="vhs">${Object.entries(FH.vhs.MODES).map(([k, m]) => `<button type="button" class="ds-i" data-vhs="${k}"><i class="ds-sw" style="background:repeating-linear-gradient(180deg,#223 0 2px,${k === 'off' ? '#223' : k === 'soft' ? '#556' : k === 'normal' ? '#99a' : '#eef'} 2px 3px)"></i>${esc(m.name)}</button>`).join('')}</div>
            <div class="ds-row"><label><input type="checkbox" data-opt="osd">Надписи на экране: PLAY, счётчик, дата</label></div>
            <div class="ds-row"><button class="xp-btn" type="button" data-a="glitch">Сбой сейчас</button><button class="xp-btn" type="button" data-a="rew">Перемотка</button></div>
          </div>
        </div>
        <div class="btns pad"><button class="xp-btn def" type="button" data-a="ok">ОК</button><button class="xp-btn" type="button" data-a="cancel">Отмена</button></div>`;

      const skyList = $('[data-list=sky]', body), themeList = $('[data-list=theme]', body);
      const skies = [...Object.entries(FH.scene.SKIES).map(([k, s]) => ({k, name: s.name, c: s.s})), {k: 'auto', name: 'По времени суток', c: ['#1f1a58', '#4e9bf0', '#e8637f', '#ffbe7a']}];
      skyList.innerHTML = skies.map((s) => `<button type="button" class="ds-i" data-sky="${s.k}"><i class="ds-sw" style="background:linear-gradient(180deg,${s.c.join(',')})"></i>${esc(s.name)}</button>`).join('');
      themeList.innerHTML = THEMES.map((t) => `<button type="button" class="ds-i" data-theme-id="${t.id}"><i class="ds-sw" style="background:linear-gradient(180deg,${t.b},${t.a})"></i>${esc(t.name)}</button>`).join('');

      const opt = (k) => $(`[data-opt=${k}]`, body);
      opt('snow').checked = FH.scene.snow;
      opt('garland').checked = FH.scene.garland;
      opt('pet').checked = FH.pet.on;
      opt('density').value = FH.scene.density;
      opt('saver').value = before.saver;
      opt('saverMin').value = String(before.saverMin);
      opt('osd').checked = FH.vhs.showOsd;

      function paint() {
        $$('[data-vhs]', body).forEach((b) => b.classList.toggle('on', b.dataset.vhs === FH.vhs.mode));
        $$('[data-sky]', body).forEach((b) => b.classList.toggle('on', b.dataset.sky === FH.scene.sky));
        const theme = store.get('theme', null) || '';
        $$('[data-theme-id]', body).forEach((b) => b.classList.toggle('on', b.dataset.themeId === theme));
        const key = FH.scene.sky === 'auto' ? 'night' : FH.scene.sky, s = FH.scene.SKIES[key] || FH.scene.SKIES.night;
        const scr = $('.ds-screen', body);
        scr.style.background = `linear-gradient(180deg, ${s.s[0]}, ${s.s[1]} 34%, ${s.s[2]} 58%, ${s.s[3]} 78%)`;
        $('.ds-hill.a', body).style.background = s.midA;
        $('.ds-hill.b', body).style.background = s.nearA;
      }
      body.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (t) {
          tab = t.dataset.tab;
          $$('.tab', body).forEach((b) => b.classList.toggle('on', b === t));
          $$('.ds-pane', body).forEach((p) => { p.hidden = p.dataset.p !== tab; });
          return;
        }
        const sk = e.target.closest('[data-sky]');
        if (sk) { FH.scene.setSky(sk.dataset.sky); paint(); return; }
        const th = e.target.closest('[data-theme-id]');
        if (th) { FH.setTheme(th.dataset.themeId); if (FH.ach) FH.ach.give('theme'); paint(); return; }
        const vh = e.target.closest('[data-vhs]');
        if (vh) { FH.vhs.mode = vh.dataset.vhs; paint(); return; }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'glitch') FH.vhs.glitch('tear');
        if (a.dataset.a === 'rew') FH.vhs.rewind();
        if (a.dataset.a === 'ok') win.close();
        if (a.dataset.a === 'cancel') { revert(); win.close(); }
        if (a.dataset.a === 'preview') { const m = opt('saver').value; FH.saver(m === 'off' ? 'cat' : m); }
      });
      body.addEventListener('change', (e) => {
        const k = e.target.dataset.opt;
        if (!k) return;
        if (k === 'snow') FH.scene.snow = e.target.checked;
        if (k === 'garland') FH.scene.garland = e.target.checked;
        if (k === 'pet') FH.pet.on = e.target.checked;
        if (k === 'density') FH.scene.density = +e.target.value;
        if (k === 'saver') store.set('saver', e.target.value);
        if (k === 'saverMin') store.set('saverMin', +e.target.value);
        if (k === 'osd') FH.vhs.showOsd = e.target.checked;
      });
      function revert() {
        FH.scene.setSky(before.sky);
        FH.setTheme(before.theme);
        FH.scene.snow = before.snow;
        FH.scene.garland = before.garland;
        FH.scene.density = before.density;
        FH.pet.on = before.pet;
        store.set('saver', before.saver);
        store.set('saverMin', before.saverMin);
        FH.vhs.mode = before.vhs;
        FH.vhs.showOsd = before.osd;
      }
      paint();
    },
  });
})();

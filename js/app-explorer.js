// Проводник. Его домашняя страница и есть профиль Фембой хауса.
(() => {
  const { $, $$, esc, icon, links, store, sound, coarse } = FH;
  const wm = FH.wm;

  const A = (href) => `href="${href}" target="_blank" rel="noopener noreferrer"`;

  const JUNK = [
    {name: 'скучная_идея.txt', ico: 'note', note: 'Текстовый файл, 2 КБ', say: 'Эта идея уже в корзине. Ей там спокойно.'},
    {name: 'понедельник.exe', ico: 'exe', note: 'Приложение, 7 дней', say: 'Понедельник удалён, но он всё равно вернётся.'},
    {name: 'мой_страх_сапёра.bmp', ico: 'image', note: 'Точечный рисунок, 99 мин', say: 'Рисунок повреждён. Он взорвался.'},
    {name: 'не_трогай.exe', ico: 'warn', note: 'Приложение, подозрительное', bsod: true},
  ];
  const binEmpty = () => store.get('binEmpty', false);

  const PLACES = {
    home: {
      title: 'Фембой хаус', ico: 'avatar', path: 'C:\\Фембой хаус', up: 'c', home: true,
      pane: [
        {t: 'Ссылки', main: true, links: [
          {label: 'Телеграм-чат', ico: 'tg', href: links.tg},
          {label: 'Игра в Роблоксе', ico: 'game', href: links.game},
          {label: 'Идеи для видео', ico: 'note', open: 'notes'},
          {label: 'Рулетка идей', ico: 'wheel', open: 'roulette'},
        ]},
        {t: 'Другие места', links: [
          {label: 'Мой компьютер', ico: 'computer', go: 'computer'},
          {label: 'Мои документы', ico: 'docs', go: 'docs'},
          {label: 'Корзина', ico: 'binfull', go: 'bin'},
        ]},
        {t: 'Подробнее', text: 'Игра пока что 16+. В чате — только свои, личные данные не пишем.'},
      ],
    },
    computer: {
      title: 'Мой компьютер', ico: 'computer', path: 'Мой компьютер', up: null,
      groups: [
        {t: 'Файлы на этом компьютере', items: [
          {name: 'Мои документы', ico: 'docs', note: 'Папка', go: 'docs'},
          {name: 'Мои рисунки', ico: 'pics', note: 'Папка', go: 'pics'},
          {name: 'Фембой хаус', ico: 'avatar', note: 'Мой профиль', go: 'home'},
        ]},
        {t: 'Жёсткие диски', items: [
          {name: 'Локальный диск (C:)', ico: 'drive', note: 'Уюта: сколько влезет', go: 'c', bar: 96},
        ]},
        {t: 'Устройства со съёмными носителями', items: [
          {name: 'Снежный привод (D:)', ico: 'snowdrive', note: 'Снег идёт', say: 'В приводе снег. Подождите, пока растает.'},
        ]},
      ],
    },
    c: {
      title: 'Локальный диск (C:)', ico: 'drive', path: 'C:\\', up: 'computer',
      groups: [{t: 'Папки', items: [
        {name: 'Фембой хаус', ico: 'folder', note: 'Папка с файлами', go: 'home'},
        {name: 'Мои документы', ico: 'docs', note: 'Папка', go: 'docs'},
        {name: 'Program Files', ico: 'folder', note: 'Программы', go: 'programs'},
      ]}],
    },
    programs: {
      title: 'Program Files', ico: 'folder', path: 'C:\\Program Files', up: 'c',
      groups: [{t: 'Программы', items: [
        {name: 'Мини-игра', ico: 'box', note: 'Украсть коробку', open: 'box'},
        {name: 'Рулетка идей', ico: 'wheel', note: 'Тренировочная', open: 'roulette'},
        {name: 'Сапёр', ico: 'mine', note: 'Игра', open: 'mines'},
        {name: 'Видик', ico: 'tv', note: 'Телевизор и кассеты', open: 'tv'},
        {name: 'Котогочи', ico: 'tama', note: 'Карманный котик', open: 'tama'},
        {name: 'Достижения', ico: 'trophy', note: 'Что уже найдено', open: 'ach'},
        {name: 'Рисовалка', ico: 'paint', note: 'Графический редактор', open: 'paint'},
        {name: 'КотАмп', ico: 'player', note: 'Музыкальный плеер', open: 'player'},
        {name: 'Блокнот', ico: 'note', note: 'Текстовый редактор', open: 'notes'},
        {name: 'Командная строка', ico: 'cmd', note: 'cmd.exe', open: 'cmd'},
        {name: 'Диспетчер задач', ico: 'taskmgr', note: 'taskmgr.exe', open: 'taskmgr'},
      ]}],
    },
    docs: {
      title: 'Мои документы', ico: 'docs', path: 'C:\\Мои документы', up: 'c',
      groups: [{t: 'Документы', items: [
        {name: 'Идеи.txt', ico: 'note', note: 'Как попасть в рулетку', open: 'notes'},
        {name: 'Мои рисунки', ico: 'pics', note: 'Папка', go: 'pics'},
        {name: 'Рулетка идей', ico: 'wheel', note: 'Ярлык', open: 'roulette'},
      ]}],
    },
    pics: {
      title: 'Мои рисунки', ico: 'pics', path: 'C:\\Мои документы\\Мои рисунки', up: 'docs',
      groups: [{t: 'Рисунки', thumbs: true, items: [
        {name: 'avatar.webp', ico: 'image', note: 'Котик в новогодней шапке', img: 'avatar.webp'},
        {name: 'game.jpg', ico: 'image', note: 'Карта «Украсть коробку»', img: 'game.jpg'},
      ]}],
    },
    bin: {
      title: 'Корзина', ico: 'binfull', path: 'Корзина', up: null,
      tasks: [{label: 'Очистить корзину', ico: 'bin', act: 'empty'}],
      groups: [{t: 'Удалённые файлы', items: JUNK}],
    },
  };
  const PANE_DEFAULT = [
    {t: 'Другие места', links: [
      {label: 'Фембой хаус', ico: 'avatar', go: 'home'},
      {label: 'Мой компьютер', ico: 'computer', go: 'computer'},
      {label: 'Мои документы', ico: 'docs', go: 'docs'},
      {label: 'Корзина', ico: 'binfull', go: 'bin'},
    ]},
  ];

  function homeHtml() {
    return `<section class="home">
      <div class="cover" aria-hidden="true"><svg viewBox="0 0 700 120" preserveAspectRatio="xMidYMax slice"><path d="M0 92C120 62 260 74 380 88s220-6 320-26v60H0Z" fill="#b9a6ea"/><path d="M0 106c150-22 300-14 440 0s190-4 260-12v28H0Z" fill="#f4eeff"/><g fill="#fff"><circle cx="60" cy="24" r="1.500"/><circle cx="130" cy="44" r="1"/><circle cx="210" cy="16" r="1.200"/><circle cx="290" cy="38" r="1.500"/><circle cx="360" cy="14" r="1"/><circle cx="440" cy="32" r="1.400"/><circle cx="520" cy="18" r="1"/><circle cx="590" cy="42" r="1.600"/><circle cx="660" cy="20" r="1.100"/></g><circle cx="610" cy="36" r="17" fill="#fff8e4"/><g transform="translate(470 88)"><path d="M0 0v-22l18-14 18 14V0Z" fill="#5d3a4c"/><path d="M-4-20 18-40l22 20-3 3L18-33-1-17Z" fill="#f6f0ff"/><rect x="6" y="-16" width="9" height="9" fill="#ffc15a"/><rect x="22" y="-16" width="9" height="9" fill="#ffc15a"/></g></svg></div>
      <div class="me">
        <div class="avatar"><img src="avatar.webp" width="102" height="102" alt="Аватарка Фембой хаус: белый котик в новогодней шапке"></div>
        <div class="me-t">
          <h1>Фембой хаус</h1>
          <p><i class="dot"></i> Статус: рад гостям</p>
        </div>
      </div>
      <p class="bio">Уютный фембой-дом 🏠💙 Игры, чат и рулетка идей</p>
      <h2>Мои ссылки</h2>
      <div class="links">
        <a class="row" ${A(links.tg)}>
          ${icon('tg')}
          <span><b>Телеграм-чат с фембоями</b><small>Заходи общаться и знакомиться</small></span>
          <span class="xp-btn def go">Открыть</span>
        </a>
        <a class="row" ${A(links.game)}>
          <span class="thumb"><img src="game.jpg" width="96" height="52" alt=""><i class="tag">16+</i></span>
          <span><b>Украсть коробку</b><small>Моя игра в Роблоксе (пока что 16+)</small></span>
          <span class="xp-btn def go">Играть</span>
        </a>
        <button class="row" type="button" data-open="roulette">
          ${icon('wheel')}
          <span><b>Рулетка идей для видео</b><small>Пиши идеи в комментах, а здесь потренируйся крутить</small></span>
          <span class="xp-btn go">Крутить</span>
        </button>
      </div>
      <h2>Ещё на этом компьютере</h2>
      <div class="tiles">
        <button type="button" data-open="box">${icon('box')}<span><b>Мини-игра</b><small>Укради коробку прямо тут</small></span></button>
        <button type="button" data-open="mines">${icon('mine')}<span><b>Сапёр</b><small>С котиком вместо смайлика</small></span></button>
        <button type="button" data-open="paint">${icon('paint')}<span><b>Рисовалка</b><small>Можно сохранить картинку</small></span></button>
        <button type="button" data-open="player">${icon('player')}<span><b>КотАмп</b><small>Зимняя музыка на синтезаторе</small></span></button>
        <button type="button" data-open="tv">${icon('tv')}<span><b>Видик</b><small>Кассеты, телетекст и камин</small></span></button>
        <button type="button" data-open="tama">${icon('tama')}<span><b>Котогочи</b><small>Покорми карманного котика</small></span></button>
      </div>
      <h2>Старый добрый интернет</h2>
      <div class="web90">
        <button class="b88 a" type="button" data-open="tv">СМОТРИ<br>НА ВИДИКЕ</button>
        <button class="b88 e" type="button" data-open="ach">ДОСТИЖЕНИЯ<br>ТУТ</button>
        <span class="b88 b">УЮТ<br>100%</span>
        <span class="b88 c">СНЕГ ИДЁТ</span>
        <span class="b88 d">PLAY ►</span>
        <span class="hits">Твой заход №<span>${FH.led(store.get('visits', 1))}</span></span>
      </div>
    </section>`;
  }

  wm.register('explorer', {
    title: 'Фембой хаус', icon: 'avatar', w: 780, h: 590, minW: 380, minH: 260, dx: 40, dy: -6,
    mount(body, win, start) {
      let hist = [], pos = -1, view = store.get('exView', 'tile'), selected = null;
      const cur = () => hist[pos];

      win.setMenu([
        {label: 'Файл', items: () => [
          {label: 'Открыть', disabled: !selected, action: () => selected && activate(selected)},
          {sep: true},
          cur() === 'bin' && !binEmpty() && {label: 'Очистить корзину', action: emptyBin},
          {label: 'Закрыть', action: () => win.close()},
        ]},
        {label: 'Вид', items: () => [
          {label: 'Плитка', radio: view === 'tile', action: () => setView('tile')},
          {label: 'Список', radio: view === 'list', action: () => setView('list')},
        ]},
        {label: 'Переход', items: () => [
          {label: 'Назад', disabled: pos <= 0, action: back},
          {label: 'Вперёд', disabled: pos >= hist.length - 1, action: fwd},
          {label: 'На уровень вверх', disabled: !PLACES[cur()].up, action: up},
          {sep: true},
          {label: 'Домой', icon: 'avatar', action: () => go('home')},
          {label: 'Мой компьютер', icon: 'computer', action: () => go('computer')},
        ]},
        {label: 'Справка', items: () => [{label: 'О системе', icon: 'props', action: () => wm.open('about')}]},
      ]);

      const tools = document.createElement('div');
      tools.className = 'ex-tools';
      tools.innerHTML = `<button type="button" class="tbb" data-a="back" title="Назад">${icon('back')}<span>Назад</span></button>
        <button type="button" class="tbb sm" data-a="fwd" title="Вперёд">${icon('fwd')}</button>
        <button type="button" class="tbb sm" data-a="up" title="Вверх">${icon('up')}</button>
        <i class="tbsep"></i>
        <button type="button" class="tbb" data-a="search" title="Поиск">${icon('search')}<span>Поиск</span></button>
        <button type="button" class="tbb" data-a="view" title="Вид">${icon('views')}<span>Вид</span></button>`;
      const addr = document.createElement('form');
      addr.className = 'ex-addr';
      addr.innerHTML = `<label>Адрес</label><div class="ex-path"><span class="ticon"></span><input class="xp-input" aria-label="Адрес" spellcheck="false"></div><button type="submit" class="tbb go">${icon('go')}<span>Переход</span></button>`;
      win.body.before(tools, addr);
      body.classList.add('ex-body');
      body.innerHTML = '<div class="explorer"><aside class="pane"></aside><div class="ex-main"></div></div>';
      const pane = $('.pane', body), main = $('.ex-main', body);
      const [stLeft, stRight] = win.addStatus(['', 'Мой компьютер']);

      const path = $('input', addr);
      addr.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = path.value.trim().toLowerCase();
        const hit = Object.entries(PLACES).find(([, p]) => p.path.toLowerCase() === q || p.title.toLowerCase() === q);
        if (hit) go(hit[0]);
        else if (q) { sound.err(); wm.msg({title: 'Адрес не найден', ico: 'err', sound: null, text: `Не удаётся найти «${path.value.trim()}». Проверьте написание и повторите попытку.`}); path.value = PLACES[cur()].path; }
      });

      tools.addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]');
        if (!b || b.disabled) return;
        const a = b.dataset.a;
        if (a === 'back') back();
        if (a === 'fwd') fwd();
        if (a === 'up') up();
        if (a === 'view') setView(view === 'tile' ? 'list' : 'tile');
        if (a === 'search') toggleSearch();
      });

      function setView(v) { view = v; store.set('exView', v); render(); }
      function back() { if (pos > 0) { pos--; render(); } }
      function fwd() { if (pos < hist.length - 1) { pos++; render(); } }
      function up() { const u = PLACES[cur()].up; if (u) go(u); }
      function go(p) {
        if (hist[pos] === p) { render(); return; }
        hist = hist.slice(0, pos + 1);
        hist.push(p);
        pos = hist.length - 1;
        render();
      }

      let searching = false, query = '';
      function toggleSearch() { searching = !searching; query = ''; render(); }

      function paneHtml(sections) {
        return sections.map((s, i) => `<div class="grp${s.main ? ' main' : ''}" data-g="${i}"><h3><button type="button" aria-expanded="true"><span>${esc(s.t)}</span><i></i></button></h3><div class="grp-b">`
          + (s.text ? `<p>${esc(s.text)}</p>` : `<ul>${s.links.map((l, j) => `<li>${l.href
            ? `<a ${A(l.href)}>${icon(l.ico)}<span>${esc(l.label)}</span></a>`
            : `<button type="button" class="lnk" data-j="${j}">${icon(l.ico)}<span>${esc(l.label)}</span></button>`}</li>`).join('')}</ul>`)
          + '</div></div>').join('');
      }

      function bindPane(sections) {
        $$('.grp', pane).forEach((g) => {
          const s = sections[+g.dataset.g], head = $('h3 button', g), b = $('.grp-b', g);
          head.addEventListener('click', () => {
            const shut = g.classList.toggle('shut');
            head.setAttribute('aria-expanded', String(!shut));
            b.hidden = shut;
          });
          $$('.lnk', g).forEach((x) => x.addEventListener('click', () => {
            const l = s.links[+x.dataset.j];
            if (l.go) go(l.go);
            else if (l.open) wm.open(l.open);
            else if (l.act === 'empty') emptyBin();
          }));
        });
      }

      function itemsOf(place) {
        const groups = place.groups ? place.groups.map((g) => ({...g, items: g.items})) : [];
        if (place === PLACES.bin && binEmpty()) groups[0].items = [];
        return groups;
      }

      function emptyBin() {
        wm.msg({title: 'Подтверждение удаления', ico: 'warn', buttons: ['Да', 'Нет'], sound: 'err', text: 'Вы действительно хотите удалить все объекты из корзины? Котик будет скучать по ним.'}).then((r) => {
          if (r === 'Да') { store.set('binEmpty', true); render(); }
        });
      }

      function activate(it) {
        if (it.go) go(it.go);
        else if (it.open) wm.open(it.open);
        else if (it.img) wm.open('viewer', {src: it.img, name: it.name});
        else if (it.bsod) FH.bsod();
        else if (it.say) wm.msg({title: it.name, ico: it.ico, text: it.say});
      }

      function itemHtml(it, k, thumbs) {
        const pic = thumbs && it.img ? `<span class="ex-thumb"><img src="${it.img}" alt=""></span>` : icon(it.ico);
        return `<button type="button" class="ex-item" data-k="${k}">${pic}<span><b>${esc(it.name)}</b>${it.note ? `<small>${esc(it.note)}</small>` : ''}${it.bar ? `<i class="ex-bar"><i style="width:${it.bar}%"></i></i>` : ''}</span></button>`;
      }

      function bindItems(flat) {
        $$('.ex-item', main).forEach((b) => {
          const it = flat[+b.dataset.k];
          b.addEventListener('click', () => {
            $$('.ex-item.sel', main).forEach((x) => x.classList.remove('sel'));
            b.classList.add('sel');
            selected = it;
            stLeft.textContent = it.note ? `${it.name}: ${it.note}` : it.name;
            if (coarse) activate(it);
          });
          b.addEventListener('dblclick', () => activate(it));
          b.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); activate(it); } });
        });
      }

      function render() {
        const key = cur(), place = PLACES[key];
        selected = null;
        win.setTitle(place.title);
        win.setIcon(place.ico);
        path.value = place.path;
        $('.ticon', addr).innerHTML = icon(place.ico);
        $('[data-a=back]', tools).disabled = pos <= 0;
        $('[data-a=fwd]', tools).disabled = pos >= hist.length - 1;
        $('[data-a=up]', tools).disabled = !place.up;
        $('[data-a=search]', tools).classList.toggle('on', searching);
        win.el.classList.toggle('ex-home', !!place.home && !searching);

        const tasks = place.tasks && !(key === 'bin' && binEmpty()) ? [{t: 'Задачи', main: true, links: place.tasks}] : [];
        const sections = [...tasks, ...(place.pane || PANE_DEFAULT)];
        if (searching) {
          pane.innerHTML = `<div class="grp main"><h3><button type="button"><span>Поиск</span></button></h3><div class="grp-b"><p class="ex-find"><label>Что ищем?<input class="xp-input" id="exq" value="${esc(query)}" autocomplete="off"></label></p></div></div>${paneHtml(PANE_DEFAULT)}`;
          $$('.grp[data-g]', pane).forEach((g) => { const s = PANE_DEFAULT[+g.dataset.g]; $$('.lnk', g).forEach((x) => x.addEventListener('click', () => { searching = false; go(s.links[+x.dataset.j].go); })); });
          const inp = $('#exq', pane);
          inp.addEventListener('input', () => { query = inp.value; renderSearch(); });
          setTimeout(() => inp.focus(), 20);
          renderSearch();
          return;
        }
        pane.innerHTML = paneHtml(sections);
        bindPane(sections);

        if (place.home) {
          main.className = 'ex-main';
          main.innerHTML = homeHtml();
          stLeft.textContent = 'Объектов: 3';
          stRight.textContent = 'Мой профиль';
          return;
        }
        const groups = itemsOf(place), flat = [];
        main.className = 'ex-main ex-files v-' + view;
        main.innerHTML = groups.map((g) => `<div class="ex-group"><h4>${esc(g.t)}</h4>${g.items.length
          ? `<div class="ex-grid">${g.items.map((it) => itemHtml(it, flat.push(it) - 1, g.thumbs)).join('')}</div>`
          : '<p class="ex-empty">Здесь пусто. Котик всё съел.</p>'}</div>`).join('');
        bindItems(flat);
        stLeft.textContent = `Объектов: ${flat.length}`;
        stRight.textContent = key === 'bin' ? 'Корзина' : 'Мой компьютер';
      }

      function renderSearch() {
        const q = query.trim().toLowerCase(), all = [];
        Object.values(PLACES).forEach((p) => (p.groups || []).forEach((g) => g.items.forEach((it) => { if (!all.includes(it) && it.name.toLowerCase().includes(q)) all.push(it); })));
        main.className = 'ex-main ex-files v-' + view;
        const res = q ? all : [];
        main.innerHTML = `<div class="ex-group"><h4>${q ? `Найдено: ${res.length}` : 'Введите название слева'}</h4><div class="ex-grid">${res.map((it, i) => itemHtml(it, i)).join('')}</div></div>`;
        bindItems(res);
        stLeft.textContent = q ? `Найдено объектов: ${res.length}` : 'Поиск';
      }

      win.onArgs = (p) => { searching = false; go(p); };
      hist = [start || 'home'];
      pos = 0;
      render();
    },
  });
})();

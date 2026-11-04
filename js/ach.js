// Достижения: повод заглянуть во все углы сайта. Хранятся только в этом браузере.
(() => {
  const { store, icon, esc, sound } = FH;
  const wm = FH.wm;
  const LIST = [
    {id: 'first', ico: 'cat', t: 'Рад гостям', d: 'Войти в Фембой хаус'},
    {id: 'chat', ico: 'tg', t: 'Свой человек', d: 'Открыть ссылку на телеграм-чат'},
    {id: 'roblox', ico: 'game', t: 'На дело', d: 'Открыть игру в Роблоксе'},
    {id: 'spin', ico: 'wheel', t: 'Крутящий момент', d: 'Покрутить рулетку идей'},
    {id: 'box1', ico: 'box', t: 'Первая кража', d: 'Донести коробку до базы в мини-игре'},
    {id: 'box5', ico: 'box', t: 'Рецидивист', d: 'Украсть 5 коробок за раунд'},
    {id: 'boxwin', ico: 'star', t: 'Король склада', d: 'Выиграть раунд мини-игры'},
    {id: 'mines', ico: 'mine', t: 'Сапёр без страха', d: 'Выиграть в Сапёра'},
    {id: 'boom', ico: 'err', t: 'Бывает', d: 'Подорваться в Сапёре'},
    {id: 'shake', ico: 'snowdrive', t: 'Стряхнул снег', d: 'Потрясти окно, чтобы снег слетел'},
    {id: 'tape', ico: 'tape', t: 'Видеолюбитель', d: 'Посмотреть кассету на Видике'},
    {id: 'rewind', ico: 'tv', t: 'Вежливый зритель', d: 'Перемотать кассету в начало'},
    {id: 'clock', ico: 'clock', t: 'Легенда', d: 'Настроить часы на видике. Никто этого не умел'},
    {id: 'teletext', ico: 'tv', t: 'Читатель', d: 'Открыть телетекст'},
    {id: 'secret', ico: 'tape', t: 'Знаю код', d: 'Найти секретную кассету'},
    {id: 'secretWatch', ico: 'tape', t: 'Зря смотрел', d: 'Посмотреть кассету, которую просили не смотреть'},
    {id: 'tama', ico: 'tama', t: 'Заботливый', d: 'Покормить Котогочи'},
    {id: 'bsod', ico: 'err', t: 'Слишком много уюта', d: 'Увидеть синий экран'},
    {id: 'cmd', ico: 'cmd', t: 'Хакер', d: 'Ввести 5 команд в командной строке'},
    {id: 'paint', ico: 'paint', t: 'Художник', d: 'Сохранить рисунок из Рисовалки'},
    {id: 'theme', ico: 'display', t: 'Модник', d: 'Сменить оформление окон'},
  ];
  let got = store.get('ach', {}), refresh = null;

  FH.ach = {
    give(id) {
      const a = LIST.find((x) => x.id === id);
      if (!a || got[id]) return;
      got[id] = Date.now();
      store.set('ach', got);
      if (refresh) refresh();
      if (FH.balloon) FH.balloon('trophy', `Достижение: ${a.t}`, a.d, () => wm.open('ach'));
      sound.ding();
    },
    has: (id) => !!got[id],
    reset() { got = {}; store.del('ach'); if (refresh) refresh(); },
  };

  // ссылки наружу считаем прямо по щелчку
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.href === FH.links.tg) FH.ach.give('chat');
    if (a.href === FH.links.game) FH.ach.give('roblox');
  }, true);

  wm.register('ach', {
    title: 'Достижения', icon: 'trophy', w: 560, h: 500, minW: 320, minH: 260, dx: 60, dy: 0,
    mount(body, win) {
      body.classList.add('ac');
      const paint = () => {
        const n = LIST.filter((a) => got[a.id]).length;
        body.innerHTML = `<div class="ac-head">${icon('trophy')}<span>${n} из ${LIST.length}</span><div class="ac-bar" role="progressbar" aria-valuenow="${n}" aria-valuemax="${LIST.length}"><i style="width:${n / LIST.length * 100}%"></i></div></div>
          <ul class="ac-list">${LIST.map((a) => `<li class="${got[a.id] ? '' : 'no'}">${icon(a.ico)}<span><b>${esc(a.t)}</b><small>${esc(a.d)}</small></span></li>`).join('')}</ul>`;
      };
      refresh = paint;
      win.onClose = () => { refresh = null; };
      win.setMenu([
        {label: 'Файл', items: () => [
          {label: 'Начать заново', action: () => wm.msg({title: 'Начать заново?', ico: 'warn', buttons: ['Да', 'Нет'], sound: 'err', text: 'Все достижения сбросятся. Котик запомнит.'}).then((r) => { if (r === 'Да') FH.ach.reset(); })},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
      ]);
      paint();
    },
  });
})();

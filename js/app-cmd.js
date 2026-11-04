// Командная строка: всё по-настоящему запускает окна сайта, остальное просто шутки.
(() => {
  const { $, esc, store, sound } = FH;
  const wm = FH.wm;

  const APPS = {
    profile: 'Профиль', tg: 'Телеграм-чат', game: 'Игра в Роблоксе', box: 'Мини-игра', roulette: 'Рулетка идей',
    notes: 'Блокнот', mines: 'Сапёр', paint: 'Рисовалка', player: 'КотАмп', taskmgr: 'Диспетчер задач',
    display: 'Свойства экрана', computer: 'Мой компьютер', about: 'О системе', tv: 'Видик', tama: 'Котогочи', ach: 'Достижения',
  };
  const TREE = `C:\\
├── Фембой хаус
│   ├── Телеграм-чат
│   └── Украсть коробку
├── Мои документы
│   ├── Идеи.txt
│   └── Мои рисунки
│       ├── avatar.webp
│       └── game.jpg
└── Program Files
    ├── КотАмп
    ├── Рисовалка
    └── Сапёр`;
  const CAT = `   /\\_/\\
  ( -.- )  мяу
  /  ~  \\
 (_)___(_)`;
  const HELP = `Доступные команды:
  help            этот список
  dir, tree       что лежит на диске
  start <имя>     запустить программу (start list покажет все)
  tg, game        открыть чат или игру
  idea            как предложить идею для видео
  snow on|off     включить или выключить снег
  pet on|off      включить или выключить котика
  sky <имя>       обои: night, dawn, day, dusk, spring, auto
  vhs <режим>     плёнка: off, soft, normal, heavy
  glitch, rewind  сбой на плёнке, перемотка
  color <имя>     цвет этого окна: white, green, pink, amber
  cat, whoami     кое-что важное
  date, time, ver дата, время, версия
  echo <текст>    повторить текст
  cls             очистить экран
  shutdown        не надо, но можно
  exit            закрыть окно`;

  wm.register('cmd', {
    title: 'Командная строка', icon: 'cmd', w: 640, h: 400, minW: 320, minH: 200, dx: 30, dy: 30,
    mount(body, win) {
      body.classList.add('cm');
      body.innerHTML = `<div class="cm-out" role="log" aria-live="polite"></div><form class="cm-line"><label for="cm-in">C:\\Фембой хаус&gt;</label><input id="cm-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Команда"></form>`;
      const out = $('.cm-out', body), inp = $('input', body), line = $('.cm-line', body);
      const hist = store.get('cmdHist', []);
      let hi = hist.length, matrix = 0, typed = 0;

      const print = (s, cls = '') => {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        d.textContent = s;
        out.append(d);
        body.scrollTop = body.scrollHeight;
      };
      const printHtml = (h) => { const d = document.createElement('div'); d.innerHTML = h; out.append(d); body.scrollTop = body.scrollHeight; };
      print('Фембой хаус [Версия 2026]\n(C) Уют и котики. Все мурчания защищены.\n\nВведите help, чтобы увидеть список команд.\n');

      const THEMES = {white: ['#000', '#d8d8d8'], green: ['#001a00', '#3ee84a'], pink: ['#1f0014', '#ff9ccb'], amber: ['#150c00', '#ffb43a']};
      const setColor = (k) => { const t = THEMES[k]; body.style.setProperty('--cm-bg', t[0]); body.style.setProperty('--cm-fg', t[1]); store.set('cmdColor', k); };
      const saved = store.get('cmdColor', 'white');
      if (THEMES[saved]) setColor(saved);

      const run = (raw) => {
        const s = raw.trim();
        printHtml(`<span class="cm-dim">C:\\Фембой хаус&gt;</span>${esc(raw)}`);
        if (!s) return;
        hist.push(s);
        if (hist.length > 40) hist.shift();
        store.set('cmdHist', hist);
        hi = hist.length;
        if (++typed >= 5 && FH.ach) FH.ach.give('cmd');
        const [cmdRaw, ...rest] = s.split(/\s+/), cmd = cmdRaw.toLowerCase(), arg = rest.join(' ');
        const a0 = (rest[0] || '').toLowerCase();
        switch (cmd) {
          case 'help': case '?': print(HELP); break;
          case 'cls': case 'clear': out.innerHTML = ''; break;
          case 'ver': print('Фембой хаус, версия 2026, сборка «уютная зима»'); break;
          case 'date': print(new Date().toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})); break;
          case 'time': print(new Date().toLocaleTimeString('ru-RU')); break;
          case 'whoami': print('гость\\рад_тебя_видеть'); break;
          case 'echo': print(arg); break;
          case 'cat': print(CAT); FH.pet.joy && FH.pet.joy(); break;
          case 'tree': print(TREE); break;
          case 'dir': case 'ls': print(` Содержимое папки C:\\Фембой хаус\n\n  <ПАПКА>    Мои документы\n  <ПАПКА>    Program Files\n  <ЯРЛЫК>    Телеграм-чат\n  <ЯРЛЫК>    Украсть коробку\n     212 Б   Идеи.txt\n\n  Свободно: сколько угодно уюта`); break;
          case 'tg': case 'telegram': wm.open('tg'); print('Открываю окно чата…'); break;
          case 'game': case 'roblox': wm.open('game'); print('Открываю окно игры…'); break;
          case 'idea': case 'ideas': print('Пиши идеи для видео в комментах. Чем больше комментариев у темы, тем выше её шанс выпасть в рулетке.'); break;
          case 'start': case 'open':
            if (a0 === 'list' || !a0) print('Можно запустить:\n' + Object.entries(APPS).map(([k, v]) => `  ${k.padEnd(10)} ${v}`).join('\n'));
            else if (APPS[a0]) { FH.launch(a0); print(`Запускаю: ${APPS[a0]}`); }
            else { print(`Не удаётся найти «${arg}». Посмотрите start list.`, 'cm-err'); sound.err(); }
            break;
          case 'snow':
            if (a0 === 'on' || a0 === 'off') { FH.scene.snow = a0 === 'on'; print(`Снег ${a0 === 'on' ? 'идёт' : 'остановлен'}.`); }
            else print(`Снег сейчас ${FH.scene.snow ? 'идёт' : 'не идёт'}. Укажите on или off.`);
            break;
          case 'pet':
            if (a0 === 'on' || a0 === 'off') { FH.pet.on = a0 === 'on'; print(`Котик ${a0 === 'on' ? 'здесь' : 'ушёл спать'}.`); }
            else print('Укажите on или off.');
            break;
          case 'sky':
            if (a0 === 'auto' || FH.scene.SKIES[a0]) { FH.scene.setSky(a0); print(`Обои: ${a0 === 'auto' ? 'по времени суток' : FH.scene.SKIES[a0].name}`); }
            else print('Есть такие: night, dawn, day, dusk, spring, auto.', 'cm-err');
            break;
          case 'color':
            if (THEMES[a0]) { setColor(a0); print('Готово.'); }
            else print('Есть такие: white, green, pink, amber.', 'cm-err');
            break;
          case 'vhs':
            if (FH.vhs.MODES[a0]) { FH.vhs.mode = a0; print(`Плёнка: ${FH.vhs.MODES[a0].name}`); }
            else print(`Плёнка сейчас: ${FH.vhs.MODES[FH.vhs.mode].name}. Есть такие: off, soft, normal, heavy.`);
            break;
          case 'glitch': FH.vhs.glitch('tear'); print('Плёнку зажевало. Это нормально.'); break;
          case 'rewind': FH.vhs.rewind(); print('Просьба перематывать кассеты.'); break;
          case 'konami': print('Код вводится стрелками и буквами на клавиатуре, а не здесь. Но попытка хорошая.'); break;
          case 'matrix': runMatrix(); break;
          case 'bsod': FH.bsod(); break;
          case 'sudo': print('Этого пользователя нет в списке sudoers. Об этом будет доложено котику.', 'cm-err'); break;
          case 'format': print('Форматировать уют нельзя.', 'cm-err'); sound.err(); break;
          case 'del': case 'rm': print('Отказано: это чья-то идея.', 'cm-err'); sound.err(); break;
          case 'shutdown': $('#powerBtn').click(); break;
          case 'exit': win.close(); break;
          default:
            print(`«${cmdRaw}» не является внутренней или внешней командой, исполняемой программой или котиком.`, 'cm-err');
            sound.err();
        }
      };

      function runMatrix() {
        if (matrix) return;
        let n = 0;
        matrix = setInterval(() => {
          print(Array.from({length: 48}, () => 'мяу01░▒'[Math.floor(Math.random() * 7)]).join(''), 'cm-dim');
          if (++n > 22) { clearInterval(matrix); matrix = 0; print('Вы проснулись. Следуйте за белым котиком.'); }
        }, 70);
      }

      line.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = inp.value;
        inp.value = '';
        run(v);
      });
      const CMDS = ['help', 'cls', 'ver', 'date', 'time', 'whoami', 'echo', 'cat', 'tree', 'dir', 'tg', 'game', 'idea', 'start', 'snow', 'pet', 'sky', 'vhs', 'glitch', 'rewind', 'color', 'matrix', 'shutdown', 'exit'];
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) inp.value = hist[--hi]; }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length - 1) inp.value = hist[++hi]; else { hi = hist.length; inp.value = ''; } }
        if (e.key === 'Tab') {
          e.preventDefault();
          const parts = inp.value.split(' ');
          if (parts.length === 1) { const m = CMDS.find((c) => c.startsWith(parts[0].toLowerCase())); if (m) inp.value = m + ' '; }
          else if (parts[0] === 'start') { const m = Object.keys(APPS).find((c) => c.startsWith(parts[1].toLowerCase())); if (m) inp.value = 'start ' + m; }
        }
        e.stopPropagation();
      });
      body.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
      win.onShow = () => setTimeout(() => inp.focus(), 30);
      win.onClose = () => clearInterval(matrix);
    },
  });
})();

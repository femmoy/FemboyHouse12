// Блокнот с идеями. Текст можно править, он хранится только в этом браузере.
(() => {
  const { $, store, save, sound } = FH;
  const wm = FH.wm;
  const ORIGINAL = `Пиши идеи для видео в комментах 💬

В следующих выпусках кручу рулетку идей.
Чья идея выпадет — про ту будет разбор.

Чем больше комментариев у темы,
тем выше её шанс выпасть.

Так что пиши и ставь лайки идеям, которые тебе нравятся!`;

  wm.register('notes', {
    title: 'Идеи.txt — Блокнот', icon: 'note', w: 500, h: 380, minW: 280, minH: 200, dx: -170, dy: 70,
    mount(body, win) {
      const cfg = store.get('note', {wrap: true, size: 13, status: true});
      body.classList.add('note');
      body.innerHTML = '<textarea class="note-t" spellcheck="false" aria-label="Текст блокнота"></textarea>';
      const ta = $('textarea', body);
      ta.value = store.get('noteText', ORIGINAL);
      const [st1, st2] = win.addStatus(['', '']);
      const stEl = st1.parentElement;
      let dirty = false;

      const paint = () => {
        ta.wrap = cfg.wrap ? 'soft' : 'off';
        ta.style.whiteSpace = cfg.wrap ? 'pre-wrap' : 'pre';
        ta.style.fontSize = cfg.size + 'px';
        stEl.hidden = !cfg.status;
        store.set('note', cfg);
      };
      const caret = () => {
        const before = ta.value.slice(0, ta.selectionStart).split('\n');
        st1.textContent = `Стр ${before.length}, стлб ${before[before.length - 1].length + 1}`;
        st2.textContent = `Знаков: ${ta.value.length}`;
      };
      const mark = () => win.setTitle(`${dirty ? '*' : ''}Идеи.txt — Блокнот`);

      ta.addEventListener('input', () => {
        store.set('noteText', ta.value);
        dirty = ta.value !== ORIGINAL;
        mark();
        caret();
      });
      ['keyup', 'click', 'focus'].forEach((k) => ta.addEventListener(k, caret));

      win.setMenu([
        {label: 'Файл', items: () => [
          {label: 'Вернуть исходный текст', disabled: !dirty, action: () => { ta.value = ORIGINAL; store.del('noteText'); dirty = false; mark(); caret(); }},
          {label: 'Сохранить как…', icon: 'save', action: () => save('Идеи.txt', new Blob([ta.value], {type: 'text/plain;charset=utf-8'}))},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
        {label: 'Правка', items: () => [
          {label: 'Выделить всё', key: 'Ctrl+A', action: () => { ta.focus(); ta.select(); }},
          {label: 'Копировать всё', action: () => { navigator.clipboard && navigator.clipboard.writeText(ta.value).then(() => sound.ding()).catch(() => sound.err()); }},
          {sep: true},
          {label: 'Время и дата', key: 'F5', action: stamp},
        ]},
        {label: 'Формат', items: () => [
          {label: 'Перенос по словам', check: cfg.wrap, action: () => { cfg.wrap = !cfg.wrap; paint(); }},
          {sep: true},
          {label: 'Шрифт крупнее', disabled: cfg.size >= 24, action: () => { cfg.size += 1; paint(); }},
          {label: 'Шрифт мельче', disabled: cfg.size <= 10, action: () => { cfg.size -= 1; paint(); }},
        ]},
        {label: 'Вид', items: () => [
          {label: 'Строка состояния', check: cfg.status, action: () => { cfg.status = !cfg.status; paint(); }},
        ]},
        {label: 'Справка', items: () => [
          {label: 'О блокноте', icon: 'note', action: () => wm.msg({title: 'О блокноте', ico: 'note', sound: null, text: 'Твой текст хранится только в этом браузере и никому не отправляется. Идеи для рулетки пиши в комментариях под видео.'})},
        ]},
      ]);

      function stamp() {
        const s = ta.selectionStart, t = new Date().toLocaleString('ru-RU');
        ta.setRangeText(t, s, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
        ta.focus();
      }
      ta.addEventListener('keydown', (e) => { if (e.key === 'F5') { e.preventDefault(); stamp(); } });

      dirty = ta.value !== ORIGINAL;
      mark();
      paint();
      caret();
    },
  });
})();

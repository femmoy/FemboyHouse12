// Диспетчер задач. График и память настоящие, а снег и котика можно по-настоящему снять с задачи.
(() => {
  const { $, $$, esc, icon, clamp } = FH;
  const wm = FH.wm;

  wm.register('taskmgr', {
    title: 'Диспетчер задач', icon: 'taskmgr', w: 430, h: 470, minW: 330, minH: 320, dx: 150, dy: 10,
    mount(body, win) {
      let tab = 'apps', sel = null, timer = 0;
      const hist = new Array(60).fill(0), histMem = new Array(60).fill(0);
      body.classList.add('tm');
      body.innerHTML = `<div class="tabs" role="tablist">
          <button class="tab on" type="button" data-tab="apps">Приложения</button>
          <button class="tab" type="button" data-tab="procs">Процессы</button>
          <button class="tab" type="button" data-tab="perf">Быстродействие</button>
        </div>
        <div class="sheet tm-sheet">
          <div class="tm-pane" data-p="list">
            <div class="tm-table"><div class="tm-head"></div><div class="tm-rows" role="listbox" tabindex="0"></div></div>
            <div class="btns tm-btns"><button class="xp-btn" type="button" data-a="end" disabled>Снять задачу</button><button class="xp-btn" type="button" data-a="go" disabled>Перейти</button></div>
          </div>
          <div class="tm-pane" data-p="perf" hidden>
            <div class="tm-graphs">
              <div><h6>Плавность</h6><b class="tm-big" data-v="fps"></b></div>
              <fieldset><legend>Загрузка снега и окон, по кадрам</legend><canvas data-c="cpu" height="90"></canvas></fieldset>
              <div><h6>Снежинки</h6><b class="tm-big" data-v="flakes"></b></div>
              <fieldset><legend>Падает снежинок прямо сейчас</legend><canvas data-c="mem" height="90"></canvas></fieldset>
            </div>
            <dl class="tm-info"><dt>Окон открыто</dt><dd data-v="wins"></dd><dt>Память страницы</dt><dd data-v="heap"></dd></dl>
          </div>
        </div>`;
      const [st1, st2, st3] = win.addStatus(['', '', '']);
      const rows = $('.tm-rows', body), head = $('.tm-head', body), endBtn = $('[data-a=end]', body), goBtn = $('[data-a=go]', body);

      const heapMb = () => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
      function procs() {
        const list = [
          {id: 'p:kernel', name: 'мурчание.sys', cpu: 1, mem: 4, lock: true},
          {id: 'p:explorer', name: 'explorer.exe', cpu: 1, mem: 18, act: () => FH.restartExplorer()},
          {id: 'p:snow', name: 'снег.exe', cpu: FH.scene.snow ? 3 : 0, mem: FH.scene.flakes ? 6 : 0, off: !FH.scene.snow, act: () => { FH.scene.snow = false; }},
          {id: 'p:lights', name: 'гирлянда.exe', cpu: FH.scene.garland ? 2 : 0, mem: 3, off: !FH.scene.garland, act: () => { FH.scene.garland = false; }},
          {id: 'p:cat', name: 'котик.exe', cpu: FH.pet.on ? 1 : 0, mem: 2, off: !FH.pet.on, act: () => { FH.pet.on = false; }},
          {id: 'p:uyut', name: 'уют.exe', cpu: 0, mem: 99, act: () => wm.msg({title: 'Отказано в доступе', ico: 'err', sound: 'err', text: 'Не удаётся завершить процесс: уют защищён котиком.'})},
        ];
        wm.list().forEach((w) => list.push({id: 'w:' + w.id, name: w.id + '.exe', cpu: 1, mem: 8, act: () => w.close()}));
        return list.filter((p) => !p.off);
      }

      function renderList() {
        const list = $('.tm-pane[data-p=list]', body);
        list.hidden = tab === 'perf';
        $('.tm-pane[data-p=perf]', body).hidden = tab !== 'perf';
        if (tab === 'perf') return;
        if (tab === 'apps') {
          head.innerHTML = '<span>Задача</span><span>Состояние</span>';
          const items = wm.list();
          rows.innerHTML = items.map((w) => `<button type="button" class="tm-row${sel === 'w:' + w.id ? ' sel' : ''}" data-id="w:${w.id}"><span>${icon(w.def.icon)}${esc($('.ttl', w.el).textContent)}</span><span>${w.el.classList.contains('min') ? 'Свёрнуто' : 'Работает'}</span></button>`).join('');
          goBtn.hidden = false;
        } else {
          head.innerHTML = '<span>Имя образа</span><span>ЦП</span><span>Память</span>';
          rows.innerHTML = procs().map((p) => `<button type="button" class="tm-row three${sel === p.id ? ' sel' : ''}" data-id="${p.id}"><span>${esc(p.name)}</span><span>${String(p.cpu).padStart(2, '0')}</span><span>${p.mem * 1000} КБ</span></button>`).join('');
          goBtn.hidden = true;
        }
        head.className = 'tm-head' + (tab === 'procs' ? ' three' : '');
        endBtn.textContent = tab === 'apps' ? 'Снять задачу' : 'Завершить процесс';
        const hasSel = !!sel && !!$(`.tm-row.sel`, rows);
        endBtn.disabled = !hasSel;
        goBtn.disabled = !hasSel;
      }

      body.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (t) {
          tab = t.dataset.tab;
          sel = null;
          $$('.tab', body).forEach((b) => b.classList.toggle('on', b === t));
          renderList();
          if (tab === 'perf') fitCanvases();
          return;
        }
        const r = e.target.closest('.tm-row');
        if (r) { sel = r.dataset.id; renderList(); return; }
        const a = e.target.closest('[data-a]');
        if (!a || !sel) return;
        if (a.dataset.a === 'go' && sel.startsWith('w:')) { const w = wm.get(sel.slice(2)); if (w) wm.open(w.id); return; }
        if (a.dataset.a === 'end') {
          if (tab === 'apps') { const w = wm.get(sel.slice(2)); if (w) w.close(); }
          else {
            const p = procs().find((x) => x.id === sel);
            if (p && p.lock) { wm.msg({title: 'Диспетчер задач', ico: 'warn', sound: 'err', text: 'Это системный процесс. Без мурчания ничего работать не будет.'}); return; }
            if (p && p.act) p.act();
          }
          sel = null;
          renderList();
        }
      });

      const cpuC = $('[data-c=cpu]', body), memC = $('[data-c=mem]', body);
      function fitCanvases() {
        [cpuC, memC].forEach((c) => { const w = c.clientWidth; if (w && c.width !== w) c.width = w; });
      }
      function graph(c, data, max, color) {
        const x = c.getContext('2d'), W = c.width, H = c.height;
        x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
        x.strokeStyle = '#0a5a1c'; x.lineWidth = 1;
        for (let i = 0; i < W; i += 16) { x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, H); x.stroke(); }
        for (let i = 0; i < H; i += 16) { x.beginPath(); x.moveTo(0, i + .5); x.lineTo(W, i + .5); x.stroke(); }
        x.strokeStyle = color; x.lineWidth = 1.500;
        x.beginPath();
        data.forEach((v, i) => { const px = i / (data.length - 1) * W, py = H - clamp(v / max, 0, 1) * (H - 3) - 1; if (i) x.lineTo(px, py); else x.moveTo(px, py); });
        x.stroke();
      }
      function tick() {
        const fps = FH.scene.fps, load = clamp(Math.round((1 - fps / 60) * 100) + 3, 1, 100), flakes = FH.scene.flakes;
        hist.push(load); hist.shift();
        histMem.push(flakes); histMem.shift();
        st1.textContent = `Процессов: ${procs().length}`;
        st2.textContent = `Загрузка ЦП: ${load}%`;
        st3.textContent = `Окон: ${wm.list().length}`;
        if (tab === 'perf') {
          fitCanvases();
          graph(cpuC, hist, 100, '#3ee84a');
          graph(memC, histMem, Math.max(40, ...histMem) * 1.15, '#ffd23a');
          $('[data-v=fps]', body).textContent = `${Math.round(fps)} к/с`;
          $('[data-v=flakes]', body).textContent = flakes;
          $('[data-v=wins]', body).textContent = wm.list().length;
          const h = heapMb();
          $('[data-v=heap]', body).textContent = h === null ? 'браузер не сообщает' : `${h} МБ`;
        } else if (document.activeElement && !document.activeElement.closest('.tm-rows')) renderList();
      }
      timer = setInterval(tick, 500);
      win.onClose = () => clearInterval(timer);
      win.setMenu([
        {label: 'Файл', items: () => [
          {label: 'Новая задача', sub: () => [
            {label: 'Рулетка идей', icon: 'wheel', action: () => wm.open('roulette')},
            {label: 'Мини-игра', icon: 'box', action: () => wm.open('box')},
            {label: 'Сапёр', icon: 'mine', action: () => wm.open('mines')},
            {label: 'Командная строка', icon: 'cmd', action: () => wm.open('cmd')},
          ]},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
        {label: 'Справка', items: () => [{label: 'О программе', icon: 'help', action: () => wm.msg({title: 'Диспетчер задач', ico: 'taskmgr', sound: null, text: 'Частота кадров, число снежинок и память настоящие. Остальные процессы придуманы для уюта, но снег, гирлянду и котика можно отключить по-настоящему.'})}]},
      ]);
      renderList();
      tick();
    },
  });
})();

// Рисовалка: инструменты как в старом Paint, отмена, заливка и сохранение в PNG.
(() => {
  const { $, $$, clamp, save, sound, coarse } = FH;
  const wm = FH.wm;
  const PALETTE = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7', '#ff6fb0', '#e0327f', '#58c4f4', '#1b7fd0', '#fff6d8', '#f4eeff', '#6c3fd1', '#14163a'];
  const G = (d, extra = '') => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" ${extra || 'fill="none" stroke="#222" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"'}/></svg>`;
  const TOOLS = [
    {id: 'pencil', label: 'Карандаш', g: G('m3 13 1-4 7-7 3 3-7 7Zm7-10 3 3')},
    {id: 'brush', label: 'Кисть', g: G('M12.500 2 7 8.500l1.500 1.500L14 4.500ZM6.500 9.500c-2 0-3 1.500-3 3 0 .8-.5 1.300-1.500 1.500 2.500 1 6 .5 6-2.500')},
    {id: 'spray', label: 'Распылитель', g: G('M6 7h5v7H6ZM7 7V5h3v2M4 3h.1M2 5h.1M4 6h.1M2 2h.1')},
    {id: 'eraser', label: 'Ластик', g: G('M6 14 2 10l7-7 5 5-6 6ZM5 7l5 5')},
    {id: 'fill', label: 'Заливка', g: G('m8 2 5.500 5.500L8 13 2.500 7.500ZM2.500 7.500h11M14 10.500c.8 1.200 1 2 1 2.500a1 1 0 0 1-2 0c0-.5.200-1.300 1-2.500Z')},
    {id: 'pick', label: 'Пипетка', g: G('m3 13 1-3 6-6 2 2-6 6ZM9 3l4 4M11 2l3 3')},
    {id: 'line', label: 'Линия', g: G('m3 13 10-10')},
    {id: 'rect', label: 'Прямоугольник', g: G('M2.500 4h11v8h-11Z')},
    {id: 'oval', label: 'Овал', g: G('M8 3.500c3 0 5.500 2 5.500 4.500S11 12.500 8 12.500 2.500 10.500 2.500 8 5 3.500 8 3.500Z')},
    {id: 'paw', label: 'Лапка', g: `<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-paw"/></svg>`},
  ];

  wm.register('paint', {
    title: 'безымянный — Рисовалка', icon: 'paint', w: 720, h: 540, minW: 340, minH: 300, dx: -40, dy: 0, keep: true,
    mount(body, win) {
      let tool = 'brush', fg = '#e0327f', bg = '#ffffff', size = 4, filled = false;
      const undo = [], redo = [];
      body.classList.add('pt');
      body.innerHTML = `<div class="pt-side">
          <div class="pt-tools">${TOOLS.map((t) => `<button type="button" class="pt-t" data-t="${t.id}" title="${t.label}" aria-label="${t.label}">${t.g}</button>`).join('')}</div>
          <div class="pt-opts">
            <div class="pt-sizes">${[2, 4, 8, 14].map((s) => `<button type="button" data-s="${s}" aria-label="Толщина ${s}"><i style="width:${s}px;height:${s}px"></i></button>`).join('')}</div>
            <label class="pt-fill"><input type="checkbox">Залить</label>
          </div>
        </div>
        <div class="pt-canvas"><canvas></canvas></div>
        <div class="pt-pal">
          <div class="pt-cur"><i class="b"></i><i class="f"></i></div>
          <div class="pt-swatches">${PALETTE.map((c) => `<button type="button" data-c="${c}" style="background:${c}" aria-label="Цвет ${c}"></button>`).join('')}</div>
        </div>`;
      const cv = $('canvas', body), ctx = cv.getContext('2d', {willReadFrequently: true}), hold = $('.pt-canvas', body);
      const [stL, stR] = win.addStatus([coarse ? 'Рисуй пальцем' : 'Левая кнопка: основной цвет. Правая: фоновый.', '']);

      function clear() { ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height); }
      const r0 = hold.getBoundingClientRect();
      cv.width = Math.max(320, Math.min(1000, coarse ? Math.floor(r0.width || 320) - 16 : 620));
      cv.height = Math.max(240, Math.min(800, coarse ? Math.floor(r0.height || 300) - 16 : 400));
      clear();

      const snap = () => { undo.push(ctx.getImageData(0, 0, cv.width, cv.height)); if (undo.length > 25) undo.shift(); redo.length = 0; };
      const doUndo = () => { if (!undo.length) return; redo.push(ctx.getImageData(0, 0, cv.width, cv.height)); ctx.putImageData(undo.pop(), 0, 0); };
      const doRedo = () => { if (!redo.length) return; undo.push(ctx.getImageData(0, 0, cv.width, cv.height)); ctx.putImageData(redo.pop(), 0, 0); };

      function paintUi() {
        $$('.pt-t', body).forEach((b) => b.classList.toggle('on', b.dataset.t === tool));
        $$('[data-s]', body).forEach((b) => b.classList.toggle('on', +b.dataset.s === size));
        $('.pt-cur .f', body).style.background = fg;
        $('.pt-cur .b', body).style.background = bg;
        $('.pt-fill', body).style.display = tool === 'rect' || tool === 'oval' ? '' : 'none';
        $('.pt-sizes', body).style.display = ['fill', 'pick', 'paw'].includes(tool) ? 'none' : '';
      }

      function floodFill(sx, sy, hex) {
        const w = cv.width, h = cv.height, img = ctx.getImageData(0, 0, w, h), d = img.data;
        const c = document.createElement('canvas').getContext('2d');
        c.fillStyle = hex; c.fillRect(0, 0, 1, 1);
        const [nr, ng, nb] = c.getImageData(0, 0, 1, 1).data;
        const p0 = (sy * w + sx) * 4, tr = d[p0], tg = d[p0 + 1], tb = d[p0 + 2];
        if (tr === nr && tg === ng && tb === nb) return;
        const same = (p) => Math.abs(d[p] - tr) < 26 && Math.abs(d[p + 1] - tg) < 26 && Math.abs(d[p + 2] - tb) < 26;
        const stack = [sx, sy];
        while (stack.length) {
          const y = stack.pop(), x0 = stack.pop();
          let x = x0, p = (y * w + x) * 4;
          while (x >= 0 && same(p)) { x--; p -= 4; }
          x++; p += 4;
          let up = false, dn = false;
          while (x < w && same(p)) {
            d[p] = nr; d[p + 1] = ng; d[p + 2] = nb; d[p + 3] = 255;
            if (y > 0) { const q = p - w * 4; if (same(q)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false; }
            if (y < h - 1) { const q = p + w * 4; if (same(q)) { if (!dn) { stack.push(x, y + 1); dn = true; } } else dn = false; }
            x++; p += 4;
          }
        }
        ctx.putImageData(img, 0, 0);
      }

      function stamp(x, y, c) {
        const s = 34, toes = [[-.55, -.15, .2, .28], [-.2, -.55, .22, .3], [.2, -.55, .22, .3], [.55, -.15, .2, .28]];
        ctx.fillStyle = c;
        toes.forEach(([dx, dy, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, dx * .6, 0, 6.283); ctx.fill(); });
        ctx.beginPath(); ctx.ellipse(x, y + .2 * s, .46 * s, .38 * s, 0, 0, 6.283); ctx.fill();
      }

      let drawing = false, sx = 0, sy = 0, lx = 0, ly = 0, base = null, col = fg, sprayT = 0;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) * cv.width / r.width), Math.floor((e.clientY - r.top) * cv.height / r.height)]; };

      function line(x0, y0, x1, y1, w, c) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x0 + .5, y0 + .5); ctx.lineTo(x1 + .5, y1 + .5); ctx.stroke();
      }
      function spray(x, y) {
        ctx.fillStyle = col;
        const R = size * 3 + 6;
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R;
          ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.300, 1.300);
        }
      }
      function shape(x, y, shift) {
        ctx.putImageData(base, 0, 0);
        let w = x - sx, h = y - sy;
        if (shift) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
        ctx.lineWidth = size; ctx.strokeStyle = col; ctx.fillStyle = col === fg ? bg : fg;
        if (tool === 'line') { line(sx, sy, x, y, size, col); return; }
        ctx.beginPath();
        if (tool === 'rect') ctx.rect(sx + .5, sy + .5, w, h);
        else ctx.ellipse(sx + w / 2, sy + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 6.283);
        if (filled) ctx.fill();
        ctx.stroke();
      }

      cv.addEventListener('pointerdown', (e) => {
        if (e.button > 2) return;
        e.preventDefault();
        const [x, y] = pos(e);
        col = e.button === 2 ? bg : fg;
        if (tool === 'pick') {
          const d = ctx.getImageData(clamp(x, 0, cv.width - 1), clamp(y, 0, cv.height - 1), 1, 1).data;
          const hex = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
          if (e.button === 2) bg = hex; else fg = hex;
          paintUi();
          return;
        }
        snap();
        if (tool === 'fill') { floodFill(clamp(x, 0, cv.width - 1), clamp(y, 0, cv.height - 1), col); return; }
        if (tool === 'paw') { stamp(x, y, col); sound.tick(); return; }
        drawing = true;
        sx = lx = x; sy = ly = y;
        cv.setPointerCapture(e.pointerId);
        if (['line', 'rect', 'oval'].includes(tool)) base = ctx.getImageData(0, 0, cv.width, cv.height);
        else if (tool === 'spray') { spray(x, y); sprayT = setInterval(() => spray(lx, ly), 40); }
        else line(x, y, x, y, tool === 'pencil' ? 1.500 : tool === 'eraser' ? size * 3 : size, tool === 'eraser' ? bg : col);
      });
      cv.addEventListener('pointermove', (e) => {
        const [x, y] = pos(e);
        stR.textContent = `${clamp(x, 0, cv.width)}, ${clamp(y, 0, cv.height)}`;
        if (!drawing) return;
        if (['line', 'rect', 'oval'].includes(tool)) shape(x, y, e.shiftKey);
        else if (tool === 'spray') { /* баллончик работает по таймеру */ }
        else line(lx, ly, x, y, tool === 'pencil' ? 1.500 : tool === 'eraser' ? size * 3 : size, tool === 'eraser' ? bg : col);
        lx = x; ly = y;
      });
      const end = () => { drawing = false; base = null; clearInterval(sprayT); };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('contextmenu', (e) => e.preventDefault());

      body.addEventListener('click', (e) => {
        const t = e.target.closest('[data-t]');
        if (t) { tool = t.dataset.t; paintUi(); return; }
        const s = e.target.closest('[data-s]');
        if (s) { size = +s.dataset.s; paintUi(); return; }
        const c = e.target.closest('[data-c]');
        if (c) { fg = c.dataset.c; paintUi(); }
      });
      body.addEventListener('contextmenu', (e) => {
        const c = e.target.closest('[data-c]');
        if (c) { e.preventDefault(); bg = c.dataset.c; paintUi(); }
      });
      $('.pt-fill input', body).addEventListener('change', (e) => { filled = e.target.checked; });

      const download = () => cv.toBlob((b) => { if (b) { save('рисунок.png', b); if (FH.ach) FH.ach.give('paint'); } }, 'image/png');
      win.setMenu([
        {label: 'Файл', items: () => [
          {label: 'Создать', action: () => { snap(); clear(); }},
          {label: 'Сохранить как PNG', icon: 'save', action: download},
          {sep: true},
          {label: 'Выход', action: () => win.close()},
        ]},
        {label: 'Правка', items: () => [
          {label: 'Отменить', key: 'Ctrl+Z', disabled: !undo.length, action: doUndo},
          {label: 'Вернуть', key: 'Ctrl+Y', disabled: !redo.length, action: doRedo},
        ]},
        {label: 'Рисунок', items: () => [
          {label: 'Очистить', action: () => { snap(); clear(); }},
          {label: 'Отразить по горизонтали', action: () => { snap(); const i = document.createElement('canvas'); i.width = cv.width; i.height = cv.height; i.getContext('2d').drawImage(cv, 0, 0); ctx.save(); ctx.scale(-1, 1); ctx.drawImage(i, -cv.width, 0); ctx.restore(); }},
          {label: 'Обратить цвета', action: () => { snap(); const m = ctx.getImageData(0, 0, cv.width, cv.height), d = m.data; for (let k = 0; k < d.length; k += 4) { d[k] = 255 - d[k]; d[k + 1] = 255 - d[k + 1]; d[k + 2] = 255 - d[k + 2]; } ctx.putImageData(m, 0, 0); }},
        ]},
        {label: 'Справка', items: () => [{label: 'О Рисовалке', icon: 'paint', action: () => wm.msg({title: 'О Рисовалке', ico: 'paint', sound: null, text: 'Рисунок остаётся на твоём устройстве. Чтобы он не пропал, сохрани его через меню «Файл».'})}]},
      ]);
      const onKey = (e) => {
        if (wm.active !== 'paint' || !(e.ctrlKey || e.metaKey)) return;
        if (e.code === 'KeyZ') { e.preventDefault(); doUndo(); }
        if (e.code === 'KeyY') { e.preventDefault(); doRedo(); }
      };
      document.addEventListener('keydown', onKey);
      paintUi();
    },
  });
})();

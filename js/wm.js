// Оконный менеджер: открытие, перетаскивание, размер, свёртывание, панель задач.
(() => {
  const { $, $$, wide, reduce, clamp, icon, esc, sound, openMenu } = FH;
  const desk = $('#desk'), tasks = $('#tasks'), ghost = $('#snapghost');
  const defs = {}, wins = {};
  let z = 10, active = null, cascade = 0, spawnId = 0;

  const glyph = {
    min: '<svg viewBox="0 0 12 12"><path d="M2 9.500h5.500"/></svg>',
    max: '<svg viewBox="0 0 12 12"><path d="M1.500 2.500h9v8h-9zM1.500 3.500h9"/></svg>',
    res: '<svg viewBox="0 0 12 12"><path d="M3.500 1.500h7v6h-2M3.500 2.500h7M1.500 4.500h7v6h-7zM1.500 5.500h7"/></svg>',
    close: '<svg viewBox="0 0 12 12"><path d="m2 2 8 8m0-8-8 8"/></svg>',
  };

  const register = (id, def) => { defs[id] = def; };
  const anim = (el, frames, ms, ease = 'cubic-bezier(.2,.75,.3,1)') => (reduce || !el.animate ? null : el.animate(frames, {duration: ms, easing: ease}));
  const isMax = (w) => w.el.classList.contains('max');
  const isMin = (w) => w.el.classList.contains('min');

  function build(id, d) {
    const el = document.createElement('section');
    el.className = 'win' + (d.fit ? ' fit' : '') + (d.cls ? ' ' + d.cls : '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', d.title);
    el.tabIndex = -1;
    el.hidden = true;
    const nomax = d.fit || d.nomax;
    el.innerHTML = `<div class="titlebar"><span class="ticon">${icon(d.icon)}</span><span class="ttl">${esc(d.title)}</span><div class="tbtns">`
      + `<button class="tb min" type="button" aria-label="Свернуть" title="Свернуть">${glyph.min}</button>`
      + (nomax ? '' : `<button class="tb maxb" type="button" aria-label="Развернуть" title="Развернуть">${glyph.max}</button>`)
      + `<button class="tb close" type="button" aria-label="Закрыть" title="Закрыть">${glyph.close}</button></div></div><div class="wbody"></div>`
      + (nomax ? '' : ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].map((k) => `<i class="rz rz-${k}" data-rz="${k}"></i>`).join(''));
    desk.append(el);
    const w = {
      id, def: d, el, open: false, btn: null, cap: null,
      bar: $('.titlebar', el), body: $('.wbody', el),
      close: () => close(id), focus: () => focus(id), minimize: () => minimize(id),
      setTitle(t) { $('.ttl', el).textContent = t; el.setAttribute('aria-label', t); if (w.btn) { $('span:last-child', w.btn).textContent = t; w.btn.title = t; } },
      setIcon(i) { $('.ticon', el).innerHTML = icon(i); if (w.btn) $('.ticon', w.btn).innerHTML = icon(i); },
      setMenu(items) { w.body.before(FH.menubar(items)); },
      addStatus(parts) {
        const s = document.createElement('div');
        s.className = 'status';
        s.innerHTML = parts.map((p) => `<span>${esc(p)}</span>`).join('') + (nomax ? '' : '<i class="grip"></i>');
        w.body.after(s);
        return $$('span', s);
      },
      toggleMax: () => toggleMax(w),
    };
    $('.close', w.bar).addEventListener('click', () => close(id));
    $('.min', w.bar).addEventListener('click', () => minimize(id));
    const mx = $('.maxb', w.bar);
    if (mx) mx.addEventListener('click', () => toggleMax(w));
    w.bar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.tb')) return;
      if (e.target.closest('.ticon')) { close(id); return; }
      if (mx) toggleMax(w);
    });
    w.bar.addEventListener('contextmenu', (e) => { e.preventDefault(); openMenu(sysMenu(w), e.clientX, e.clientY); });
    $('.ticon', w.bar).addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); openMenu(sysMenu(w), r.left, r.bottom); });
    el.addEventListener('pointerdown', () => focus(id), true);
    drag(w);
    $$('.rz', el).forEach((h) => resize(w, h));
    return w;
  }

  function sysMenu(w) {
    const max = isMax(w), can = !!$('.maxb', w.bar);
    return [
      {label: 'Восстановить', disabled: !isMin(w) && !max, action: () => { if (isMin(w)) restore(w); else if (max) toggleMax(w); }},
      {label: 'Свернуть', action: () => minimize(w.id)},
      can && {label: 'Развернуть', disabled: max, action: () => toggleMax(w)},
      {sep: true},
      {label: 'Закрыть', key: 'Esc', def: true, action: () => close(w.id)},
    ];
  }

  function place(w) {
    if (!wide()) return;
    const el = w.el, d = w.def, vw = desk.clientWidth, vh = desk.clientHeight;
    el.style.width = Math.min(d.w || 480, vw - 16) + 'px';
    if (d.h) el.style.height = Math.min(d.h, vh - 16) + 'px';
    const n = cascade++ % 5;
    const cx = (vw - el.offsetWidth) / 2 + (d.dx || 0) + n * 24, cy = (vh - el.offsetHeight) / 2 + (d.dy || 0) + n * 20 - 14;
    el.style.left = clamp(cx, vw > 960 ? 104 : 6, Math.max(6, vw - el.offsetWidth - 8)) + 'px';
    el.style.top = clamp(cy, 8, Math.max(8, vh - el.offsetHeight - 8)) + 'px';
    w.placed = true;
  }

  function open(id, args) {
    const d = defs[id];
    if (!d) return null;
    // окно открывают снова, пока оно ещё закрывается: сначала доводим закрытие до конца
    if (wins[id] && wins[id].finishClose) wins[id].finishClose();
    let w = wins[id];
    if (!w) w = wins[id] = build(id, d);
    const fresh = !w.mounted;
    if (fresh) { w.mounted = true; d.mount(w.body, w, args); }
    else if (args !== undefined && w.onArgs) w.onArgs(args);
    if (!w.open) {
      w.open = true;
      w.el.hidden = false;
      place(w);
      addTask(w);
      if (w.onShow) w.onShow();
      if (FH.vhs) FH.vhs.blip();
      anim(w.el, [{transform: 'scale(.93) translateY(10px)', opacity: 0}, {transform: 'none', opacity: 1}], 170);
    }
    if (isMin(w)) restore(w); else focus(id);
    FH.closeStart && FH.closeStart();
    return w;
  }

  function addTask(w) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'task';
    const title = $('.ttl', w.el).textContent;
    t.title = title;
    t.innerHTML = `<span class="ticon">${icon(w.def.icon)}</span><span>${esc(title)}</span>`;
    t.setAttribute('aria-label', title);
    t.addEventListener('click', () => {
      if (isMin(w)) restore(w);
      else if (active !== w.id) focus(w.id);
      else minimize(w.id);
      FH.closeStart && FH.closeStart();
    });
    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const r = t.getBoundingClientRect();
      openMenu(sysMenu(w), r.left, r.top, {flipY: r.top});
    });
    tasks.append(t);
    w.btn = t;
  }

  function topWindow() {
    return Object.values(wins).filter((x) => x.open && !isMin(x)).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
  }

  function close(id) {
    const w = wins[id];
    if (!w || !w.open) return;
    if (w.beforeClose && w.beforeClose() === false) return;
    w.open = false;
    if (w.btn) w.btn.remove();
    w.btn = null;
    let a = null;
    const finish = () => {
      if (!w.finishClose) return;
      w.finishClose = null;
      if (a) a.cancel();
      w.el.hidden = true;
      w.el.classList.remove('max', 'min');
      if (!w.def.keep) {
        if (w.onClose) w.onClose();
        w.el.remove();
        delete wins[id];
        if (w.def.temp) delete defs[id];
      }
    };
    w.finishClose = finish;
    a = anim(w.el, [{transform: 'none', opacity: 1}, {transform: 'scale(.96)', opacity: 0}], 110, 'ease-in');
    // в скрытой вкладке анимации могут не завершаться, поэтому страхуемся таймером
    if (a) { a.onfinish = finish; setTimeout(finish, 240); } else finish();
    if (active === id) {
      active = null;
      const t = topWindow();
      if (t) focus(t.id); else sync();
    }
  }

  function flyTo(w, reverse, done) {
    const b = w.btn && w.btn.getBoundingClientRect(), r = w.el.getBoundingClientRect();
    if (!b || !b.width || reduce || !w.el.animate) { done && done(); return; }
    const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height / 2);
    const far = {transform: `translate(${dx}px, ${dy}px) scale(.16)`, opacity: 0.1}, near = {transform: 'none', opacity: 1};
    const a = w.el.animate(reverse ? [far, near] : [near, far], {duration: 190, easing: 'cubic-bezier(.3,.6,.4,1)'});
    let ended = false;
    const end = () => { if (!ended) { ended = true; if (done) done(); } };
    a.onfinish = end;
    setTimeout(end, 300);
  }

  function minimize(id) {
    const w = wins[id];
    if (!w || !w.open || isMin(w)) return;
    if (active === id) active = null;
    flyTo(w, false, () => {
      w.el.classList.add('min');
      if (w.onHide) w.onHide();
    });
    const t = Object.values(wins).filter((x) => x.open && !isMin(x) && x !== w).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
    if (t) focus(t.id); else sync();
  }

  function restore(w) {
    w.el.classList.remove('min');
    focus(w.id);
    flyTo(w, true);
    if (w.onShow) w.onShow();
  }

  function focus(id) {
    const w = wins[id];
    if (!w || !w.open) return;
    if (active !== id) w.el.style.zIndex = ++z;
    active = id;
    sync();
  }

  function blur() { active = null; sync(); }

  function sync() {
    Object.values(wins).forEach((w) => {
      const on = active === w.id && w.open && !isMin(w);
      w.el.classList.toggle('inactive', w.open && !on);
      if (w.btn) w.btn.classList.toggle('act', on);
    });
  }

  function flip(w, change) {
    const a = w.el.getBoundingClientRect();
    change();
    const b = w.el.getBoundingClientRect();
    if (!b.width) return;
    anim(w.el, [
      {transformOrigin: '0 0', transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`},
      {transformOrigin: '0 0', transform: 'none'},
    ], 150);
  }

  function toggleMax(w, force) {
    const to = force === undefined ? !isMax(w) : force;
    flip(w, () => w.el.classList.toggle('max', to));
    const b = $('.maxb', w.bar);
    if (b) { b.innerHTML = to ? glyph.res : glyph.max; b.setAttribute('aria-label', to ? 'Восстановить' : 'Развернуть'); b.title = b.getAttribute('aria-label'); }
    if (w.onResize) w.onResize();
  }

  function drag(w) {
    let sx, sy, ox, oy, on = false, snap = false, lastY = 0, lastX = 0, lastT = 0;
    w.bar.addEventListener('pointerdown', (e) => {
      if (!wide() || e.target.closest('.tb') || e.button > 0) return;
      on = true;
      sx = e.clientX; sy = e.clientY;
      lastX = sx; lastY = sy; lastT = performance.now();
      if (!isMax(w)) { ox = w.el.offsetLeft; oy = w.el.offsetTop; }
      w.bar.setPointerCapture(e.pointerId);
    });
    w.bar.addEventListener('pointermove', (e) => {
      if (!on) return;
      const vw = desk.clientWidth, vh = desk.clientHeight;
      if (isMax(w)) {
        // тянем развёрнутое окно: оно возвращается к прошлому размеру прямо под курсором
        if (Math.abs(e.clientY - sy) < 6 && Math.abs(e.clientX - sx) < 6) return;
        const ratio = e.clientX / vw;
        w.el.classList.remove('max');
        const b = $('.maxb', w.bar);
        if (b) b.innerHTML = glyph.max;
        ox = clamp(e.clientX - w.el.offsetWidth * ratio, -40, vw - 60); oy = 0;
        sx = e.clientX; sy = e.clientY;
        if (w.onResize) w.onResize();
      }
      let nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
      // окна слегка прилипают к краям стола
      if (Math.abs(nx) < 10) nx = 0;
      if (Math.abs(nx + w.el.offsetWidth - vw) < 10) nx = vw - w.el.offsetWidth;
      if (Math.abs(ny + w.el.offsetHeight - vh) < 10) ny = vh - w.el.offsetHeight;
      w.el.style.left = clamp(nx, -w.el.offsetWidth + 90, vw - 90) + 'px';
      w.el.style.top = clamp(ny, 0, vh - 34) + 'px';
      const t = performance.now(), dt = Math.max(1, t - lastT);
      if (w.shake) w.shake(Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt);
      lastX = e.clientX; lastY = e.clientY; lastT = t;
      const can = !!$('.maxb', w.bar), wantSnap = can && e.clientY <= 2;
      if (wantSnap !== snap) { snap = wantSnap; ghost.hidden = !snap; ghost.style.zIndex = z + 1; }
    });
    const end = () => {
      if (!on) return;
      on = false;
      if (snap) { snap = false; ghost.hidden = true; toggleMax(w, true); }
    };
    w.bar.addEventListener('pointerup', end);
    w.bar.addEventListener('pointercancel', end);
  }

  function resize(w, h) {
    const k = h.dataset.rz, mw = w.def.minW || 300, mh = w.def.minH || 180;
    let on = false, sx, sy, ol, ot, ow, oh;
    h.addEventListener('pointerdown', (e) => {
      if (!wide() || isMax(w)) return;
      e.preventDefault();
      on = true;
      sx = e.clientX; sy = e.clientY;
      ol = w.el.offsetLeft; ot = w.el.offsetTop; ow = w.el.offsetWidth; oh = w.el.offsetHeight;
      h.setPointerCapture(e.pointerId);
    });
    h.addEventListener('pointermove', (e) => {
      if (!on) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (k.includes('e')) w.el.style.width = Math.max(mw, ow + dx) + 'px';
      if (k.includes('s')) w.el.style.height = Math.max(mh, oh + dy) + 'px';
      if (k.includes('w')) { const nw = Math.max(mw, ow - dx); w.el.style.width = nw + 'px'; w.el.style.left = ol + ow - nw + 'px'; }
      if (k.includes('n')) { const nh = Math.max(mh, oh - dy); w.el.style.height = nh + 'px'; w.el.style.top = Math.max(0, ot + oh - nh) + 'px'; }
      if (w.onResize) w.onResize();
    });
    const end = () => { on = false; };
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
  }

  addEventListener('resize', () => {
    const vw = desk.clientWidth, vh = desk.clientHeight;
    Object.values(wins).forEach((w) => {
      if (!w.open) return;
      if (wide() && !isMax(w)) {
        if (!w.el.style.width || !w.placed) place(w);
        w.el.style.width = Math.min(parseFloat(w.el.style.width) || w.def.w || 480, vw - 8) + 'px';
        w.el.style.left = clamp(w.el.offsetLeft, 0, Math.max(0, vw - w.el.offsetWidth)) + 'px';
        w.el.style.top = clamp(w.el.offsetTop, 0, Math.max(0, vh - 40)) + 'px';
      }
      if (w.onResize) w.onResize();
    });
  });

  // ---------- сообщения
  function msg({title = 'Фембой хаус', text = '', html: rich = '', ico = 'info', buttons = ['ОК'], sound: snd = 'ding', w = 380}) {
    return new Promise((resolve) => {
      const id = 'msg' + (++spawnId);
      if (snd && sound[snd]) sound[snd]();
      register(id, {
        title, icon: ico, w, fit: true, temp: true,
        mount(body, win) {
          body.innerHTML = `<div class="dlg"><div class="dlg-i">${icon(ico)}</div><div class="dlg-t">${rich || `<p>${esc(text)}</p>`}</div><div class="btns"></div></div>`;
          const row = $('.btns', body);
          buttons.forEach((label, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'xp-btn' + (i === 0 ? ' def' : '');
            b.textContent = label;
            b.addEventListener('click', () => { win.result = label; win.close(); });
            row.append(b);
          });
          win.onClose = () => resolve(win.result);
          setTimeout(() => { const f = $('.xp-btn', body); if (f) f.focus(); }, 30);
        },
      });
      open(id);
    });
  }

  FH.wm = {
    register, open, close, focus, minimize, blur, msg,
    get(id) { return wins[id]; },
    list() { return Object.values(wins).filter((w) => w.open); },
    defs() { return defs; },
    get active() { return active; },
    get z() { return z; },
  };
})();

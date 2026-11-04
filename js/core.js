// Общее для всего сайта: помощники, хранилище, звук, меню.
window.FH = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wide = () => matchMedia('(min-width: 721px)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };

  const links = {
    tg: 'https://t.me/+TvHIBSbaHPsyMTZi',
    game: 'https://www.roblox.com/games/76910515171203/Steal-the-Box-Heist',
  };

  const mkStore = (get) => ({
    get(k, d) { try { const v = get().getItem('fh-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { get().setItem('fh-' + k, JSON.stringify(v)); } catch (e) { /* без хранилища тоже работает */ } },
    del(k) { try { get().removeItem('fh-' + k); } catch (e) { /* ок */ } },
  });
  const store = mkStore(() => localStorage);
  const sess = mkStore(() => sessionStorage);

  const icon = (name, cls = '') => name === 'avatar'
    ? `<img class="${cls}" src="avatar.webp" alt="">`
    : `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const save = (name, blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  // ---------- звук: всё синтезируется на месте, мелодии свои
  const sound = (() => {
    let ac = null, master = null, on = store.get('sound', true), vol = store.get('vol', 0.8);
    const apply = () => { if (master) master.gain.value = on ? vol : 0; };
    const ctx = () => {
      try {
        if (!ac) {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          master = ac.createGain();
          master.connect(ac.destination);
          apply();
        }
        if (ac.state === 'suspended') ac.resume();
        return ac;
      } catch (e) { return null; }
    };
    const tone = (f, d, len, gain = 0.1, type = 'sine') => {
      const c = ctx();
      if (!c || !on) return;
      const t = c.currentTime + 0.01 + d, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + len + 0.05);
    };
    const seq = (notes, type, gain) => notes.forEach(([f, d, l]) => tone(f, d, l, gain, type));
    return {
      ctx, tone,
      get master() { ctx(); return master; },
      get on() { return on; },
      set on(v) { on = v; store.set('sound', v); apply(); },
      get vol() { return vol; },
      set vol(v) { vol = v; store.set('vol', v); apply(); },
      chime() {
        seq([[392, 0, 0.7], [523.25, 0.16, 0.7], [659.25, 0.32, 0.7], [783.99, 0.5, 0.8], [1046.5, 0.74, 1.7]], 'sine', 0.16);
        seq([[196, 0, 2.2], [261.63, 0.5, 2]], 'triangle', 0.07);
      },
      bye() { seq([[1046.5, 0, 0.5], [783.99, 0.18, 0.5], [659.25, 0.36, 0.6], [523.25, 0.56, 0.7], [392, 0.78, 1.3]], 'sine', 0.14); },
      click() { tone(1400, 0, 0.04, 0.03, 'square'); },
      tick() { tone(1900, 0, 0.03, 0.05, 'triangle'); },
      ding() { seq([[880, 0, 0.3], [1318.5, 0.09, 0.5]], 'sine', 0.13); },
      err() { seq([[311, 0, 0.18], [233, 0.13, 0.32]], 'triangle', 0.2); },
      notify() { seq([[783.99, 0, 0.25], [1174.66, 0.12, 0.45]], 'sine', 0.1); },
      pick() { seq([[660, 0, 0.1], [990, 0.06, 0.14]], 'square', 0.05); },
      win() { seq([[523.25, 0, 0.18], [659.25, 0.1, 0.18], [783.99, 0.2, 0.18], [1046.5, 0.3, 0.45]], 'square', 0.06); },
      lose() { seq([[392, 0, 0.2], [329.63, 0.14, 0.2], [261.63, 0.28, 0.45]], 'triangle', 0.14); },
      boom() {
        const c = ctx();
        if (!c || !on) return;
        const b = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4);
        const s = c.createBufferSource(), g = c.createGain();
        s.buffer = b; g.gain.value = 0.35;
        s.connect(g).connect(master);
        s.start();
      },
    };
  })();

  // ---------- меню: контекстные, выпадающие, вложенные
  const stack = [];
  let menuDone = null;
  function closeMenus(level = 0) {
    while (stack.length > level) stack.pop().remove();
    if (!level && menuDone) { const f = menuDone; menuDone = null; f(); }
  }
  function openMenu(items, x, y, opts = {}) {
    const level = opts.level || 0;
    closeMenus(level);
    if (!level) menuDone = opts.onClose || null;
    const m = document.createElement('div');
    m.className = 'ctx';
    m.setAttribute('role', 'menu');
    items.filter(Boolean).forEach((it) => {
      if (it.sep) { m.append(html('<div class="ctx-sep"></div>')); return; }
      const b = document.createElement(it.href ? 'a' : 'button');
      if (it.href) { b.href = it.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; } else b.type = 'button';
      b.className = 'ctx-i' + (it.def ? ' def' : '');
      b.setAttribute('role', 'menuitem');
      if (it.disabled) { b.setAttribute('aria-disabled', 'true'); b.classList.add('off'); }
      const mark = it.check !== undefined
        ? `<i class="ctx-mark">${it.check ? '✓' : ''}</i>`
        : it.radio !== undefined ? `<i class="ctx-mark">${it.radio ? '●' : ''}</i>`
        : `<i class="ctx-mark">${it.icon ? icon(it.icon) : ''}</i>`;
      b.innerHTML = `${mark}<span>${esc(it.label)}</span>${it.key ? `<kbd>${esc(it.key)}</kbd>` : ''}${it.sub ? '<i class="ctx-arrow">▶</i>' : ''}`;
      const openSub = () => {
        const r = b.getBoundingClientRect();
        openMenu(typeof it.sub === 'function' ? it.sub() : it.sub, r.right - 2, r.top - 2, {level: level + 1, flipX: r.left + 2});
      };
      b.addEventListener('pointerenter', () => {
        closeMenus(level + 1);
        if (it.sub) openSub();
        b.focus({preventScroll: true});
      });
      b.addEventListener('click', (e) => {
        if (it.disabled) { e.preventDefault(); return; }
        if (it.sub) { openSub(); return; }
        closeMenus();
        if (it.action) it.action();
      });
      m.append(b);
    });
    m.addEventListener('keydown', (e) => {
      const list = $$('.ctx-i:not(.off)', m), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      else if (e.key === 'ArrowRight' && list[i] && $('.ctx-arrow', list[i])) list[i].click();
      else if (e.key === 'ArrowLeft' && level) closeMenus(level);
      e.stopPropagation();
      if (e.key === 'Escape') closeMenus(level);
    });
    document.body.append(m);
    stack.push(m);
    const r = m.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    let l = x, t = y;
    if (l + r.width > vw) l = opts.flipX !== undefined ? opts.flipX - r.width : vw - r.width - 2;
    if (t + r.height > vh) t = opts.flipY !== undefined ? opts.flipY - r.height : vh - r.height - 2;
    m.style.left = Math.max(0, l) + 'px';
    m.style.top = Math.max(0, t) + 'px';
    if (opts.focus !== false) { const f = $('.ctx-i:not(.off)', m); if (f) f.focus({preventScroll: true}); }
    return m;
  }
  document.addEventListener('pointerdown', (e) => { if (stack.length && !e.target.closest('.ctx') && !e.target.closest('.mb-b')) closeMenus(); }, true);

  // строка меню окна: [{label, items: () => [...]}, ...]
  function menubar(defs) {
    const bar = document.createElement('div');
    bar.className = 'menubar';
    bar.setAttribute('role', 'menubar');
    let cur = null;
    const show = (b, d) => {
      const r = b.getBoundingClientRect();
      cur = b;
      $$('.mb-b', bar).forEach((x) => x.classList.toggle('on', x === b));
      openMenu(d.items(), r.left, r.bottom, {onClose: () => { cur = null; $$('.mb-b', bar).forEach((x) => x.classList.remove('on')); }});
    };
    defs.forEach((d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mb-b';
      b.textContent = d.label;
      b.addEventListener('click', () => { if (cur === b) closeMenus(); else show(b, d); });
      b.addEventListener('pointerenter', () => { if (cur && cur !== b) show(b, d); });
      bar.append(b);
    });
    return bar;
  }

  return { $, $$, wide, coarse, reduce, clamp, esc, html, links, store, sess, icon, save, sound, openMenu, closeMenus, menubar };
})();

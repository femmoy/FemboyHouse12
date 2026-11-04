// КотАмп: плеер со своими мелодиями. Весь звук синтезируется в браузере, файлов нет.
(() => {
  const { $, $$, clamp, store, sound, esc } = FH;
  const wm = FH.wm;

  const TRACKS = [
    {
      name: 'Снежный вальс', bpm: 112, spb: 6, bars: 32,
      chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
      arp: [0, 1, 2, 1, 2, 1], arpType: 'triangle', arpGain: .05, arpUp: 12,
      bass: [0], bassOct: [12], bassType: 'sine', bassGain: .14,
      lead: [76, 0, 0, 74, 72, 0, 72, 0, 0, 69, 0, 0, 67, 0, 0, 72, 76, 0, 79, 0, 0, 74, 0, 0, 81, 0, 0, 79, 76, 0, 77, 0, 0, 76, 72, 0, 76, 0, 0, 74, 72, 0, 74, 0, 72, 71, 0, 0],
      leadType: 'sine', leadGain: .13, leadLen: 2.2, bell: true,
    },
    {
      name: 'Уютный дом', bpm: 76, spb: 8, bars: 24, swing: .08,
      chords: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]],
      stabs: [0, 3, 6], arpType: 'triangle', arpGain: .045,
      bass: [0, 4], bassType: 'triangle', bassGain: .16,
      lead: [79, 0, 76, 0, 74, 0, 72, 0, 72, 0, 0, 69, 0, 72, 0, 0, 74, 0, 77, 0, 76, 0, 74, 0, 71, 0, 74, 0, 79, 0, 0, 0, 84, 0, 0, 79, 0, 76, 0, 0, 76, 0, 79, 0, 76, 0, 72, 0, 69, 0, 72, 0, 74, 0, 77, 0, 76, 0, 74, 0, 71, 0, 0, 0],
      leadType: 'sine', leadGain: .1, leadLen: 1.6, bell: true,
      drums: {k: [0, 5], s: [2, 6], h: [1, 3, 5, 7], soft: true},
    },
    {
      name: 'Коробка украдена', bpm: 138, spb: 16, bars: 24,
      chords: [[64, 67, 71], [60, 64, 67], [67, 71, 74], [62, 66, 69]],
      arp: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1], arpType: 'square', arpGain: .022, arpUp: 12,
      bass: [0, 4, 8, 12], bassOct: [0, 12], bassType: 'triangle', bassGain: .17,
      lead: [76, 0, 0, 0, 79, 0, 76, 0, 74, 0, 71, 0, 74, 0, 76, 0, 72, 0, 0, 0, 76, 0, 72, 0, 71, 0, 67, 0, 71, 0, 72, 0, 74, 0, 0, 0, 79, 0, 74, 0, 71, 0, 74, 0, 79, 0, 83, 0, 81, 0, 0, 0, 78, 0, 74, 0, 78, 0, 81, 0, 78, 0, 74, 0, 83, 0, 81, 0, 79, 0, 76, 0, 79, 0, 0, 0, 76, 0, 74, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 0, 0, 79, 0, 76, 0, 79, 0, 83, 0, 86, 0, 83, 0, 79, 0, 74, 0, 71, 0, 74, 0, 78, 0, 81, 0, 78, 0, 74, 0, 69, 0, 74, 0, 78, 0, 81, 0],
      leadType: 'square', leadGain: .05, leadLen: .45,
      drums: {k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14]},
    },
    {
      name: 'Звёздная тишина', bpm: 58, spb: 8, bars: 20,
      chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
      arp: [0, 2, 1, 3, 2, 3, 1, 2], arpType: 'sine', arpGain: .06, arpUp: 24, arpLen: 1.8,
      bass: [0], bassOct: [12], bassType: 'sine', bassGain: .12, bassLen: 3,
      lead: [84, 0, 0, 0, 81, 0, 0, 0, 83, 0, 0, 79, 0, 0, 0, 0, 81, 0, 0, 77, 0, 0, 76, 0, 79, 0, 0, 0, 76, 0, 0, 0],
      leadType: 'sine', leadGain: .08, leadLen: 2.6, bell: true,
    },
  ];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  wm.register('player', {
    title: 'КотАмп', icon: 'player', w: 372, fit: true, dx: 200, dy: -20, cls: 'kp-win',
    mount(body, win) {
      const c = sound.ctx();
      let cur = store.get('kpTrack', 0) % TRACKS.length, playing = false, stepN = 0, nextT = 0, sched = 0;
      let vol = store.get('kpVol', .8), shuffle = false, loop = true, raf = 0;
      const eq = store.get('kpEq', [0, 0, 0]);

      // цепочка: инструменты → эквалайзер → громкость → анализатор → общий выход
      let bus, gain, an, lows, mids, highs, noise, data, wowG, hissG, tapeLp, tapeOn = store.get('kpTape', true);
      if (c) {
        bus = c.createGain();
        lows = c.createBiquadFilter(); lows.type = 'lowshelf'; lows.frequency.value = 220;
        mids = c.createBiquadFilter(); mids.type = 'peaking'; mids.frequency.value = 1100; mids.Q.value = .9;
        highs = c.createBiquadFilter(); highs.type = 'highshelf'; highs.frequency.value = 4200;
        gain = c.createGain(); gain.gain.value = vol;
        an = c.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .72;
        tapeLp = c.createBiquadFilter(); tapeLp.type = 'lowpass';
        bus.connect(tapeLp).connect(lows).connect(mids).connect(highs).connect(gain).connect(an).connect(sound.master);
        data = new Uint8Array(an.frequencyBinCount);
        noise = c.createBuffer(1, c.sampleRate * .4, c.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        // плёнка: скорость чуть плавает, а в тишине слышно шипение
        const wow = c.createOscillator();
        wow.frequency.value = 5.300;
        wowG = c.createGain();
        wow.connect(wowG);
        wow.start();
        const hiss = c.createBufferSource(), hp = c.createBiquadFilter();
        hiss.buffer = noise; hiss.loop = true;
        hp.type = 'highpass'; hp.frequency.value = 3000;
        hissG = c.createGain();
        hiss.connect(hp).connect(hissG).connect(gain);
        hiss.start();
        win.tapeNodes = [wow, hiss];
        [lows, mids, highs].forEach((f, i) => { f.gain.value = eq[i]; });
      }

      body.classList.add('kp');
      body.innerHTML = `<div class="kp-main">
          <div class="kp-cass"><i></i><i></i></div>
          <div class="kp-screen">
            <div class="kp-time" aria-label="Время"></div>
            <canvas class="kp-vis" width="150" height="46"></canvas>
          </div>
          <div class="kp-title"><span></span></div>
          <input class="xp-range kp-seek" type="range" min="0" max="1000" value="0" aria-label="Позиция">
          <div class="kp-ctl">
            <button type="button" data-a="prev" aria-label="Предыдущая" title="Предыдущая"><svg viewBox="0 0 16 16"><path d="M3 3h2v10H3Zm11 0v10L6 8Z"/></svg></button>
            <button type="button" data-a="play" aria-label="Играть" title="Играть"><svg viewBox="0 0 16 16"><path d="M4 2.500v11L13.500 8Z"/></svg></button>
            <button type="button" data-a="pause" aria-label="Пауза" title="Пауза"><svg viewBox="0 0 16 16"><path d="M4 3h3v10H4Zm5 0h3v10H9Z"/></svg></button>
            <button type="button" data-a="stop" aria-label="Стоп" title="Стоп"><svg viewBox="0 0 16 16"><path d="M3.500 3.500h9v9h-9Z"/></svg></button>
            <button type="button" data-a="next" aria-label="Следующая" title="Следующая"><svg viewBox="0 0 16 16"><path d="M11 3h2v10h-2ZM2 3v10l8-5Z"/></svg></button>
            <label class="kp-vol" title="Громкость"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-vol"/></svg><input class="xp-range" type="range" min="0" max="100" value="${Math.round(vol * 100)}" aria-label="Громкость плеера"></label>
          </div>
          <div class="kp-eq">
            ${['Низ', 'Сер', 'Верх'].map((n, i) => `<label>${n}<input class="xp-range" type="range" min="-12" max="12" value="${eq[i]}" data-eq="${i}" aria-label="Эквалайзер: ${n}"></label>`).join('')}
            <div class="kp-tg">
              <button type="button" data-a="shuffle" aria-pressed="false">Случайно</button>
              <button type="button" data-a="loop" aria-pressed="true">Повтор</button>
              <button type="button" data-a="tape" aria-pressed="${tapeOn}">Плёнка</button>
            </div>
          </div>
        </div>
        <ol class="kp-list">${TRACKS.map((t, i) => `<li><button type="button" data-i="${i}"><span>${i + 1}. ${esc(t.name)}</span><small>${fmt(trackLen(t))}</small></button></li>`).join('')}</ol>`;
      const vis = $('.kp-vis', body), vx = vis.getContext('2d'), time = $('.kp-time', body), title = $('.kp-title span', body), seek = $('.kp-seek', body);
      const peaks = new Array(16).fill(0);
      let seeking = false;

      function trackLen(t) { return t.bars * t.spb * stepDur(t); }
      function stepDur(t) { return 60 / t.bpm * (t.spb === 6 ? .5 : t.spb === 8 ? .5 : .25); }
      function fmt(s) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

      function voice(type, f, t, len, g) {
        const o = c.createOscillator(), a = c.createGain();
        o.type = type; o.frequency.value = f;
        a.gain.setValueAtTime(.0001, t);
        a.gain.exponentialRampToValueAtTime(g, t + .012);
        a.gain.exponentialRampToValueAtTime(.0001, t + len);
        o.connect(a).connect(bus);
        wowG.connect(o.detune);
        o.onended = () => { try { wowG.disconnect(o.detune); } catch (e) { /* уже отключено */ } };
        o.start(t); o.stop(t + len + .03);
      }
      function applyTape() {
        store.set('kpTape', tapeOn);
        if (!c) return;
        wowG.gain.value = tapeOn ? 9 : 0;
        hissG.gain.value = tapeOn ? .011 : 0;
        tapeLp.frequency.value = tapeOn ? 6200 : 20000;
      }
      function hit(t, freq, q, len, g, type = 'highpass') {
        const s = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain();
        s.buffer = noise;
        fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
        a.gain.setValueAtTime(g, t);
        a.gain.exponentialRampToValueAtTime(.0001, t + len);
        s.connect(fl).connect(a).connect(bus);
        s.start(t); s.stop(t + len + .02);
      }
      function kick(t, g) {
        const o = c.createOscillator(), a = c.createGain();
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(44, t + .1);
        a.gain.setValueAtTime(g, t);
        a.gain.exponentialRampToValueAtTime(.0001, t + .2);
        o.connect(a).connect(bus);
        o.start(t); o.stop(t + .22);
      }

      function playStep(n, t) {
        const tr = TRACKS[cur], sd = stepDur(tr), inBar = n % tr.spb, bar = Math.floor(n / tr.spb);
        const ch = tr.chords[bar % tr.chords.length];
        const when = t + (tr.swing && n % 2 ? tr.swing * sd * 2 : 0);
        if (tr.arp) {
          const note = ch[tr.arp[inBar % tr.arp.length] % ch.length] + (tr.arpUp || 0);
          voice(tr.arpType, mtof(note), when, tr.arpLen || sd * 1.700, tr.arpGain);
        }
        if (tr.stabs && tr.stabs.includes(inBar)) ch.forEach((m) => voice(tr.arpType, mtof(m), when, sd * 2.600, tr.arpGain));
        if (tr.bass.includes(inBar)) {
          const oct = tr.bassOct ? tr.bassOct[tr.bass.indexOf(inBar) % tr.bassOct.length] : 0;
          voice(tr.bassType, mtof(ch[0] - 24 + oct), when, tr.bassLen || sd * 3, tr.bassGain);
        }
        const L = tr.lead[n % tr.lead.length];
        if (L) {
          voice(tr.leadType, mtof(L), when, tr.leadLen, tr.leadGain);
          if (tr.bell) voice('sine', mtof(L + 12), when, tr.leadLen * .5, tr.leadGain * .22);
        }
        if (tr.drums) {
          const dr = tr.drums, g = dr.soft ? .55 : 1;
          if (dr.k.includes(inBar)) kick(when, .42 * g);
          if (dr.s.includes(inBar)) hit(when, dr.soft ? 1500 : 1800, .7, .13, .15 * g, dr.soft ? 'bandpass' : 'highpass');
          if (dr.h.includes(inBar)) hit(when, 7000, .5, .035, .05 * g);
        }
      }
      function schedule() {
        const tr = TRACKS[cur];
        while (nextT < c.currentTime + .14) {
          if (stepN >= tr.bars * tr.spb) {
            clearInterval(sched); sched = 0;
            setTimeout(() => { if (!playing) return; if (shuffle || loop) next(); else stop(); }, Math.max(0, (nextT - c.currentTime) * 1000));
            return;
          }
          playStep(stepN, nextT);
          stepN++;
          nextT += stepDur(tr);
        }
      }

      function play() {
        if (!c) { wm.msg({title: 'КотАмп', ico: 'err', text: 'Этот браузер не умеет синтезировать звук.'}); return; }
        sound.ctx();
        if (!sound.on) FH.balloon('player', 'Звук выключен', 'Включи его значком динамика на панели задач.', null);
        if (playing) return;
        playing = true;
        nextT = c.currentTime + .05;
        clearInterval(sched);
        sched = setInterval(schedule, 25);
        schedule();
        paintState();
        draw();
      }
      function pause() {
        playing = false;
        clearInterval(sched); sched = 0;
        paintState();
      }
      function stop() { pause(); stepN = 0; paintTime(); }
      function select(i, autoplay = true) {
        const was = playing || autoplay;
        pause();
        cur = (i + TRACKS.length) % TRACKS.length;
        store.set('kpTrack', cur);
        stepN = 0;
        paintTrack();
        if (was) play(); else paintTime();
      }
      function next() { select(shuffle ? Math.floor(Math.random() * TRACKS.length) : cur + 1); }

      function paintTrack() {
        title.textContent = `${cur + 1}. ${TRACKS[cur].name} · ${TRACKS[cur].bpm} ударов в минуту · `;
        $('.kp-cass', body).dataset.t = TRACKS[cur].name;
        $$('.kp-list button', body).forEach((b, i) => b.classList.toggle('on', i === cur));
        paintTime();
      }
      function paintTime() {
        const tr = TRACKS[cur], s = Math.floor(stepN * stepDur(tr));
        const mm = String(Math.floor(s / 60)), ss = String(s % 60).padStart(2, '0');
        time.innerHTML = `<i class="kp-state ${playing ? 'pl' : ''}"></i>${digit(mm)}<b>:</b>${digit(ss)}`;
        if (!seeking) seek.value = Math.round(stepN / (tr.bars * tr.spb) * 1000);
      }
      // табло сапёра всегда даёт три цифры, здесь хватает двух
      function digit(v) { return FH.led(+v).replace(/^<svg[\s\S]*?<\/svg>/, ''); }
      function paintState() {
        $('[data-a=play]', body).classList.toggle('on', playing);
        body.classList.toggle('playing', playing);
        paintTime();
      }

      function draw() {
        cancelAnimationFrame(raf);
        const W = vis.width, H = vis.height, bars = 16, bw = Math.floor(W / bars);
        const paint = () => {
          raf = requestAnimationFrame(paint);
          if (!an) return;
          an.getByteFrequencyData(data);
          vx.clearRect(0, 0, W, H);
          let any = false;
          for (let i = 0; i < bars; i++) {
            const idx = Math.floor(Math.pow(i / bars, 1.6) * data.length * .7) + 1;
            const v = data[idx] / 255, h = Math.round(v * (H / 3)) * 3;
            peaks[i] = Math.max(peaks[i] - .55, h);
            if (h > 0 || peaks[i] > 0) any = true;
            for (let y = 0; y < h; y += 3) {
              const k = y / H;
              vx.fillStyle = k > .75 ? '#ff4040' : k > .5 ? '#ffd23a' : '#3ee84a';
              vx.fillRect(i * bw, H - y - 2, bw - 2, 2);
            }
            vx.fillStyle = '#d8e6ff';
            vx.fillRect(i * bw, H - peaks[i] - 3, bw - 2, 1);
          }
          if (playing) paintTime();
          if (!playing && !any) { cancelAnimationFrame(raf); raf = 0; }
        };
        paint();
      }

      body.addEventListener('click', (e) => {
        const i = e.target.closest('[data-i]');
        if (i) { select(+i.dataset.i); return; }
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'play') play();
        if (a === 'pause') { if (playing) pause(); else if (stepN) play(); }
        if (a === 'stop') stop();
        if (a === 'prev') select(cur - 1);
        if (a === 'next') next();
        if (a === 'shuffle') { shuffle = !shuffle; b.setAttribute('aria-pressed', String(shuffle)); }
        if (a === 'loop') { loop = !loop; b.setAttribute('aria-pressed', String(loop)); }
        if (a === 'tape') { tapeOn = !tapeOn; b.setAttribute('aria-pressed', String(tapeOn)); applyTape(); }
      });
      seek.addEventListener('input', () => { seeking = true; });
      seek.addEventListener('change', () => {
        seeking = false;
        const tr = TRACKS[cur];
        stepN = Math.floor(seek.value / 1000 * tr.bars * tr.spb);
        if (c) nextT = c.currentTime + .05;
        paintTime();
      });
      $('.kp-vol input', body).addEventListener('input', (e) => {
        vol = e.target.value / 100;
        if (gain) gain.gain.value = vol;
        store.set('kpVol', vol);
      });
      $$('[data-eq]', body).forEach((r) => r.addEventListener('input', () => {
        const i = +r.dataset.eq;
        eq[i] = +r.value;
        if (lows) [lows, mids, highs][i].gain.value = eq[i];
        store.set('kpEq', eq);
      }));

      win.onClose = () => {
        playing = false;
        clearInterval(sched);
        cancelAnimationFrame(raf);
        if (gain) {
          gain.gain.setTargetAtTime(0, c.currentTime, .05);
          setTimeout(() => {
            (win.tapeNodes || []).forEach((n) => n.stop());
            try { an.disconnect(); } catch (e) { /* уже отключено */ }
          }, 400);
        }
      };
      applyTape();
      paintTrack();
      paintState();
    },
  });
})();

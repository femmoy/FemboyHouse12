// Плёнка: всё, что делает сайт похожим на запись с видеокассеты.
(() => {
  const { $, html, coarse, reduce, store, sound } = FH;
  const root = document.documentElement;

  const MODES = {
    off: {name: 'Выключена'},
    soft: {name: 'Лёгкая', grain: .05, lines: .055, vig: .2, bands: .35, min: 24, max: 55},
    normal: {name: 'Обычная', grain: .08, lines: .09, vig: .3, bands: .7, min: 13, max: 34},
    heavy: {name: 'Зажёванная', grain: .13, lines: .13, vig: .38, bands: 1.2, min: 6, max: 16},
  };
  let mode = store.get('vhs', reduce ? 'off' : coarse ? 'soft' : 'normal');
  if (!MODES[mode]) mode = 'normal';
  let showOsd = store.get('vhsOsd', true), cheap = false;

  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="vhs-chroma" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="1.4" result="r2"/>
      <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="-.7" result="gb2"/>
      <feBlend in="r2" in2="gb2" mode="screen"/>
    </filter>
    <filter id="vhs-chroma-soft" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx=".8" result="r2"/>
      <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="-.4" result="gb2"/>
      <feBlend in="r2" in2="gb2" mode="screen"/>
    </filter>
    <filter id="vhs-tear" x="-2%" y="0" width="104%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence id="vhs-turb" type="fractalNoise" baseFrequency="0.0001 0.09" numOctaves="1" seed="3" result="n"/>
      <feColorMatrix in="n" values="1 0 0 0 0  0 0 0 0 .5  0 0 0 0 0  0 0 0 0 1" result="m"/>
      <feDisplacementMap id="vhs-disp" in="SourceGraphic" in2="m" scale="30" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs></svg>`);
  const turb = $('#vhs-turb'), disp = $('#vhs-disp');

  const box = html(`<div class="vhs" aria-hidden="true">
    <canvas class="vhs-noise"></canvas>
    <div class="vhs-roll"></div>
    <div class="vhs-lines"></div>
    <div class="vhs-flick"></div>
    <div class="vhs-vig"></div>
    <div class="vo vo-tr"><b class="vo-mode"></b><small class="vo-sub"></small></div>
    <div class="vo vo-bc"><span class="vo-date"></span></div>
    <div class="vo vo-br"><span>SP</span><span class="vo-count"></span></div>
  </div>`);
  document.body.append(box);
  const cv = $('.vhs-noise', box), x = cv.getContext('2d');
  const started = performance.now();

  // заготовки зерна: считать шум для каждого кадра слишком дорого
  const tiles = Array.from({length: 4}, () => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const t = c.getContext('2d'), img = t.createImageData(128, 128), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() < .5 ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.random() * 255;
    }
    t.putImageData(img, 0, 0);
    return c;
  });
  let patterns = [], cw = 0, ch = 0;
  function size() {
    const k = coarse ? 2.5 : 2;
    cw = Math.ceil(innerWidth / k);
    ch = Math.ceil(innerHeight / k);
    cv.width = cw; cv.height = ch;
    patterns = tiles.map((t) => x.createPattern(t, 'repeat'));
  }

  // ---------- кадр шума
  let raf = 0, lastDraw = 0, lastFrame = 0, bandY = 0, burst = 0, nextGlitch = 0, frames = 0, slow = 0, fpsT = 0, tearUntil = 0, rewinding = 0;
  const R = Math.random;
  function streaks(y, h, amp, colored) {
    for (let r = 0; r < h; r++) {
      if (R() > amp * .7) continue;
      const row = Math.floor(y + r);
      if (row < 0 || row >= ch) continue;
      const n = 1 + Math.floor(R() * 4 * amp);
      for (let i = 0; i < n; i++) {
        x.globalAlpha = Math.min(.75, (.08 + R() * .4) * amp);
        x.fillStyle = colored && R() < .3 ? (R() < .5 ? '#ff5ca8' : '#5cf0ff') : '#fff';
        x.fillRect(R() * cw, row, 6 + R() * R() * cw * .35, 1);
      }
    }
  }
  function draw(now, dt) {
    const m = MODES[mode];
    x.clearRect(0, 0, cw, ch);
    // зерно плёнки
    x.globalAlpha = Math.min(.45, m.grain * (1 + burst * 2.500));
    x.fillStyle = patterns[Math.floor(R() * patterns.length)];
    const ox = Math.floor(R() * 128), oy = Math.floor(R() * 128);
    x.translate(-ox, -oy);
    x.fillRect(0, 0, cw + 128, ch + 128);
    x.translate(ox, oy);
    // полоса трекинга медленно ползёт по экрану
    const speed = rewinding > now ? -2.2 : .045 + burst * .9;
    bandY = (bandY + speed * dt * ch + ch * 2) % (ch + 40);
    const breathe = Math.pow(.5 + .5 * Math.sin(now * .00041), 3);
    const amp = m.bands * (.18 + breathe * .82) + burst * 1.4;
    streaks(bandY - 20, 8 + 18 * amp, Math.min(1.2, amp), true);
    if (rewinding > now) for (let i = 0; i < 3; i++) streaks(((now * .3 + i * ch / 3) % ch), 12, 1.3, true);
    // шум переключения головок всегда живёт внизу кадра
    streaks(ch - 4, 4, Math.min(1, .35 + m.bands * .5), false);
    // выпадения плёнки
    if (R() < .22 * m.bands + burst * .5) {
      for (let i = 0, n = 1 + Math.floor(R() * 3); i < n; i++) {
        x.globalAlpha = .35 + R() * .5;
        x.fillStyle = '#fff';
        x.fillRect(R() * cw, R() * ch, 8 + R() * 70, 1);
      }
    }
    x.globalAlpha = 1;
    burst = Math.max(0, burst - dt * 1.700);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!lastFrame) { lastFrame = now; fpsT = now; }
    frames++;
    // если машина не тянет, сами снимаем дорогие фильтры
    if (now - fpsT > 2000) {
      const fps = frames * 1000 / (now - fpsT);
      frames = 0; fpsT = now;
      slow = fps < 34 ? slow + 1 : 0;
      if (slow >= 2 && !cheap) { cheap = true; root.classList.add('vhs-cheap'); }
    }
    if (now - lastDraw < 42) return;
    const dt = Math.min((now - lastDraw) / 1000, .1);
    lastDraw = now;
    draw(now, dt);
    if (now > nextGlitch) { glitch(); schedule(now); }
    if (tearUntil && now > tearUntil) { tearUntil = 0; root.classList.remove('vhs-tearing'); }
    else if (tearUntil && !(frames % 2)) {
      turb.setAttribute('seed', Math.floor(R() * 999));
      disp.setAttribute('scale', 16 + R() * 44);
    }
  }
  const schedule = (now) => { const m = MODES[mode]; nextGlitch = now + (m.min + R() * (m.max - m.min)) * 1000; };
  function start() {
    if (raf || mode === 'off' || document.hidden || reduce) return;
    lastDraw = performance.now();
    lastFrame = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => {
    stop();
    if (!document.hidden) {
      start();
      if (mode !== 'off') { blip(.8); osd('PLAY ►'); }
    }
  });
  addEventListener('resize', size);

  // ---------- сбои
  function tear(ms) {
    if (coarse || cheap || reduce) return;
    tearUntil = performance.now() + ms;
    root.classList.add('vhs-tearing');
  }
  function jump() {
    if (reduce) return;
    root.classList.remove('vhs-jump');
    void root.offsetWidth;
    root.classList.add('vhs-jump');
    setTimeout(() => root.classList.remove('vhs-jump'), 200);
  }
  function glitch(kind) {
    if (mode === 'off') return;
    const k = kind || ['tear', 'tear', 'jump', 'color'][Math.floor(R() * 4)];
    burst = Math.max(burst, .7 + R() * .5);
    if (k === 'tear') {
      tear(220 + R() * 420);
      const n = 2 + Math.floor(R() * 6);
      osd('', 'TRACKING ' + '▮'.repeat(n) + '▯'.repeat(8 - n), 1600);
    } else if (k === 'jump') jump();
    else {
      root.classList.add('vhs-wash');
      setTimeout(() => root.classList.remove('vhs-wash'), 340 + R() * 420);
    }
  }
  function blip(v = .35) { if (mode !== 'off') burst = Math.max(burst, v); }

  // ---------- надписи на экране
  const voMode = $('.vo-mode', box), voSub = $('.vo-sub', box), voDate = $('.vo-date', box), voCount = $('.vo-count', box);
  const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
  let osdTimer = 0;
  function paintClock() {
    const d = new Date(), s = Math.floor((performance.now() - started) / 1000);
    voDate.textContent = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    voCount.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  setInterval(paintClock, 1000);
  paintClock();
  function osd(text, sub = '', ms = 3600) {
    if (mode === 'off' || !showOsd) return;
    if (text) voMode.textContent = text;
    voSub.textContent = sub;
    box.classList.add('osd');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => box.classList.remove('osd'), ms);
  }

  // ---------- включение и выключение кинескопа
  function powerOn() {
    if (mode === 'off' || reduce) return;
    const el = html('<div class="crt-on"><i></i></div>');
    document.body.append(el);
    setTimeout(() => el.remove(), 900);
    burst = 1.4;
    setTimeout(() => osd('PLAY ►'), 500);
  }
  function powerOff(done) {
    if (mode === 'off' || reduce) { if (done) done(); return; }
    const el = html('<div class="crt-off"><i class="t"></i><i class="b"></i><i class="l"></i></div>');
    document.body.append(el);
    setTimeout(() => { if (done) done(); el.remove(); }, 620);
  }
  function rewind() {
    if (mode === 'off') return;
    rewinding = performance.now() + 1400;
    burst = 1.5;
    tear(1300);
    osd('REW ◄◄', '', 1700);
    const c = sound.ctx();
    if (c && sound.on) {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), t = c.currentTime;
      o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 1400;
      o.frequency.setValueAtTime(160, t); o.frequency.linearRampToValueAtTime(420, t + 1.2);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.035, t + .1); g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
      o.connect(f).connect(g).connect(sound.master);
      o.start(t); o.stop(t + 1.45);
    }
  }

  // ---------- код: вверх, вверх, вниз, вниз, влево, вправо, влево, вправо, B, A
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konami = 0;
  document.addEventListener('keydown', (e) => {
    konami = e.code === KONAMI[konami] ? konami + 1 : e.code === KONAMI[0] ? 1 : 0;
    if (konami === KONAMI.length) {
      konami = 0;
      FH.unlockSecret();
    }
  });
  FH.unlockSecret = () => {
    const was = store.get('secretTape', false);
    store.set('secretTape', true);
    rewind();
    if (FH.ach) FH.ach.give('secret');
    if (FH.onSecret) FH.onSecret();
    if (!was && FH.balloon) FH.balloon('tape', 'Найдена секретная кассета', 'Она появилась на полке рядом с Видиком.', () => FH.wm.open('tv'));
  };

  function apply() {
    root.classList.remove('vhs-soft', 'vhs-normal', 'vhs-heavy', 'vhs-cheap');
    cheap = false; slow = 0;
    box.hidden = mode === 'off';
    if (mode === 'off') { stop(); return; }
    const m = MODES[mode];
    root.classList.add('vhs-' + mode);
    box.style.setProperty('--vl', m.lines);
    box.style.setProperty('--vv', m.vig);
    size();
    schedule(performance.now());
    if (reduce) { lastDraw = 0; draw(performance.now(), 0); } else { stop(); start(); }
  }

  FH.vhs = {
    MODES,
    get mode() { return mode; },
    set mode(v) {
      mode = v;
      store.set('vhs', v);
      apply();
      const b = $('#vhsBtn');
      if (b) b.setAttribute('aria-pressed', String(v !== 'off'));
      if (v !== 'off') { blip(1); osd('PLAY ►', MODES[v].name.toUpperCase()); }
    },
    get showOsd() { return showOsd; },
    set showOsd(v) { showOsd = v; store.set('vhsOsd', v); if (!v) box.classList.remove('osd'); },
    glitch, blip, osd, powerOn, powerOff, rewind,
  };
  apply();

  // ---------- настоящий шейдер плёнки: им показывает телевизор и заставка
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
    uniform sampler2D tex;uniform vec2 res;uniform float t,noise,bands,wobble,chroma,jitter,curve,snow,power,bandAt,scan;
    varying vec2 v;
    float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    const mat3 toY=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312);
    const mat3 toR=mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703);
    void main(){
      vec2 p=v*2.-1.;
      p*=1.+curve*dot(p.yx,p.yx);
      p=p*.5+.5;
      if(power<.999){
        float ph=max(power*power,.004);
        p.y=(p.y-.5)/ph+.5;
        p.x=(p.x-.5)/max(smoothstep(0.,.25,power),.02)+.5;
      }
      if(p.x<0.||p.x>1.||p.y<0.||p.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}
      float y=p.y;
      float line=floor(y*res.y*.5);
      float w=(sin(y*11.+t*1.1)*.6+sin(y*47.+t*3.3)*.3+sin(y*131.+t*7.)*.1)*wobble*.0024;
      float d=abs(y-bandAt);
      d=min(d,1.-d);
      float band=smoothstep(.05+bands*.13,0.,d)*bands;
      w+=band*(rnd(vec2(line,floor(t*24.)))-.5)*.16;
      float hs=smoothstep(.03,.0,y);
      w+=hs*(.022+.016*sin(line*.9+t*30.));
      vec2 q=vec2(p.x+w,y+jitter*(rnd(vec2(floor(t*18.),3.))-.5)*.012);
      q.y=fract(q.y);
      vec3 s=texture2D(tex,q).rgb;
      float blur=(.0026+.0022*chroma)*chroma;
      vec3 c=vec3(0.);
      for(float i=-3.;i<=3.;i+=1.){c+=texture2D(tex,q+vec2(i*blur+.0032*chroma,0.)).rgb;}
      c/=7.;
      vec3 yq=toY*c;
      yq.x=(toY*s).x;
      yq.yz*=1.+.14*chroma;
      vec3 col=toR*yq;
      col=mix(col,vec3(dot(col,vec3(.33))),band*.5);
      float n=rnd(floor(vec2(p.x*res.x*.5,y*res.y*.5))+vec2(floor(t*30.)*1.7,floor(t*30.)));
      col+=(n-.5)*(.05+noise*.22);
      float row=rnd(vec2(line,floor(t*26.)));
      float seg=rnd(vec2(floor(p.x*38.+row*97.),line));
      float drop=step(1.-(.0035+noise*.03+band*.24),row)*step(.45,seg);
      col=mix(col,vec3(.96),drop*(.55+.4*seg));
      col+=band*(rnd(vec2(floor(p.x*res.x*.25),line+t))-.45)*.5;
      col=mix(col,vec3(rnd(floor(v*res*.5)+t*37.)),snow);
      col*=1.-scan*(.5+.5*sin(y*res.y*2.094));
      vec2 e=(v-.5)*1.45;
      col*=1.-dot(e,e)*.42;
      col=col*.94+.035;
      if(power<.999){col+=(1.-power)*1.2;}
      gl_FragColor=vec4(col,1.);
    }`;
  FH.crt = (canvas) => {
    let gl = null;
    try { gl = canvas.getContext('webgl', {alpha: false, antialias: false}) || canvas.getContext('experimental-webgl'); } catch (e) { /* покажем без шейдера */ }
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const U = {};
    ['res', 't', 'noise', 'bands', 'wobble', 'chroma', 'jitter', 'curve', 'snow', 'power', 'bandAt', 'scan'].forEach((k) => { U[k] = gl.getUniformLocation(pr, k); });
    return {
      render(src, o) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.uniform2f(U.res, 640, 480);
        ['t', 'noise', 'bands', 'wobble', 'chroma', 'jitter', 'curve', 'snow', 'power', 'bandAt', 'scan'].forEach((k) => gl.uniform1f(U[k], o[k] === undefined ? 0 : o[k]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  };
})();

// Живые обои: сцена из слоёв SVG, а всё, что двигается (снег, гирлянды, звёзды, дым), рисуется на холсте.
(() => {
  const { $, clamp, reduce, coarse, wide, store } = FH;
  const desk = $('#desk'), wall = $('#wall'), cv = $('#snow'), ctx = cv.getContext('2d');

  const SKIES = {
    night: {name: 'Снежная ночь', s: ['#0a0e30', '#1f1a58', '#54298a', '#c45aa6'], stars: 1, lit: 1, moon: 1, sun: 0, clouds: .1, aur: .8, far: '#332b78', farCap: '#a99ce4', midA: '#a292e6', midB: '#5f50b4', nearA: '#f7f0ff', nearB: '#bfaaf0', shade: '#a48fe8', pine: '#1d1a50', tree: '#1c5650', snow: '#f6f0ff', wood: '#5d3a4c', wood2: '#40283a', roof: '#3a2436'},
    dawn: {name: 'Рассвет', s: ['#3b6fc2', '#8ea8e6', '#f2b9cc', '#ffe4c4'], stars: .1, lit: .55, moon: 0, sun: .9, clouds: .75, aur: 0, far: '#7f8fce', farCap: '#f6f2ff', midA: '#f6e8f4', midB: '#c9c2e8', nearA: '#fffafa', nearB: '#e8d8ee', shade: '#d8c4e4', pine: '#47598f', tree: '#2f6a6a', snow: '#ffffff', wood: '#7a5050', wood2: '#5a3a3e', roof: '#4a3036'},
    day: {name: 'Морозный день', s: ['#1f66d6', '#4e9bf0', '#a8d6fb', '#eaf6ff'], stars: 0, lit: .12, moon: 0, sun: 1, clouds: 1, aur: 0, far: '#7ea3d8', farCap: '#ffffff', midA: '#f6fbff', midB: '#c8dcf4', nearA: '#ffffff', nearB: '#d6e6f8', shade: '#bcd4f0', pine: '#2a6a5a', tree: '#2a7a5a', snow: '#ffffff', wood: '#8f5e3e', wood2: '#6e4428', roof: '#54321e'},
    dusk: {name: 'Закат', s: ['#1a1650', '#6a2f8c', '#e8637f', '#ffbe7a'], stars: .5, lit: .95, moon: .5, sun: 0, clouds: .45, aur: .2, far: '#4a2f78', farCap: '#f0a8b8', midA: '#f0b8cc', midB: '#9a5fa8', nearA: '#fff0f0', nearB: '#eab4c8', shade: '#d490b4', pine: '#2a1a50', tree: '#2a4a58', snow: '#fff2f4', wood: '#5a3448', wood2: '#40243a', roof: '#3a2034'},
    spring: {name: 'Оттепель', s: ['#2266dd', '#4f97ee', '#9fd0fa', '#e4f4ff'], stars: 0, lit: .1, moon: 0, sun: 1, clouds: 1, aur: 0, far: '#6f9fcc', farCap: '#eef8ff', midA: '#a6ec5e', midB: '#5cb52a', nearA: '#8fdc48', nearB: '#3f8f1e', shade: '#6cc030', pine: '#1f6a30', tree: '#1f7a3a', snow: '#fbfffa', wood: '#8f5e3e', wood2: '#6e4428', roof: '#54321e'},
  };
  const autoSky = () => { const h = new Date().getHours(); return h < 6 || h >= 22 ? 'night' : h < 9 ? 'dawn' : h < 17 ? 'day' : 'dusk'; };

  // ---------- геометрия холмов: по ней же расставляются ёлки, гирлянда и подарки
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n1 = (v) => Math.round(v * 10) / 10;
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const sample = (segs) => {
    const out = [];
    segs.forEach((s) => { for (let i = 0; i <= 40; i++) { const t = i / 40; out.push([bez(s[0][0], s[1][0], s[2][0], s[3][0], t), bez(s[0][1], s[1][1], s[2][1], s[3][1], t)]); } });
    return out;
  };
  const yAt = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const a = pts[i - 1], b = pts[i], k = (x - a[0]) / Math.max(1, b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; } return pts[pts.length - 1][1]; };
  const midSegs = [[[-120, 610], [200, 530], [420, 560], [640, 590]], [[640, 590], [860, 620], [1040, 540], [1250, 520]], [[1250, 520], [1400, 505], [1500, 540], [1720, 520]]];
  const nearSegs = [[[-120, 770], [220, 680], [520, 700], [800, 745]], [[800, 745], [1060, 786], [1320, 700], [1720, 690]]];
  const midPts = sample(midSegs), nearPts = sample(nearSegs);
  const d3 = (segs) => `M${segs[0][0].join(' ')}` + segs.map((s) => `C${s[1].join(' ')} ${s[2].join(' ')} ${s[3].join(' ')}`).join('') + 'V1100H-120Z';

  const pine = (x, y, s, c = 'var(--pine)', cap = .85) => {
    const P = (a, b) => `${n1(x + a * s)} ${n1(y + b * s)}`;
    return `<path d="M${P(0, -62)}L${P(10, -43)}L${P(5, -43)}L${P(17, -24)}L${P(8, -24)}L${P(23, -4)}L${P(-23, -4)}L${P(-8, -24)}L${P(-17, -24)}L${P(-5, -43)}L${P(-10, -43)}Z" fill="${c}"/><rect x="${n1(x - 3 * s)}" y="${n1(y - 5 * s)}" width="${n1(6 * s)}" height="${n1(8 * s)}" fill="var(--wood2)"/>`
      + `<path d="M${P(0, -62)}L${P(7, -48)}L${P(2, -51)}L${P(0, -46)}L${P(-3, -51)}L${P(-7, -48)}ZM${P(-11, -29)}L${P(-5, -39)}L${P(0, -32)}L${P(5, -39)}L${P(11, -29)}L${P(5, -32)}L${P(0, -27)}L${P(-5, -32)}ZM${P(-15, -10)}L${P(-8, -21)}L${P(0, -13)}L${P(8, -21)}L${P(15, -10)}L${P(7, -14)}L${P(0, -9)}L${P(-7, -14)}Z" fill="var(--snow)" opacity="${cap}"/>`;
  };

  const lwin = (x, y, w, h, cat) => `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="var(--roof)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#w-win)"/>`
    + (cat ? `<path d="M${x + 10} ${y + h}v-11c0-3 1-5 3-6l-1-6 4 3h5l4-3-1 6c2 1 3 3 3 6v11Z" fill="#2a1a2c"/>` : '')
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#6c8cbc" style="opacity:calc(1 - var(--lit))"/>`
    + `<path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="var(--roof)" stroke-width="2.500"/>`
    + `<path d="M${x - 7} ${y + h + 3}q${w / 2 + 7} -7 ${w + 14} 0v5h-${w + 14}Z" fill="var(--snow)"/>`;

  const HX = 1030, HY = 556, TX = 1345, TY = 612;
  let icicles = '';
  for (let i = 0; i < 22; i++) {
    const left = i < 11, k = (left ? i : i - 11) / 10, ix = left ? -6 + k * 118 : 256 - k * 118, iy = -96 - k * 92, l = 7 + rnd() * 11;
    icicles += `<path d="M${n1(ix - 2.200)} ${n1(iy)}h4.400L${n1(ix)} ${n1(iy + l)}Z" fill="#e4f2ff" opacity=".9"/>`;
  }
  const house = `<g transform="translate(${HX} ${HY})">
    <ellipse cx="125" cy="4" rx="310" ry="70" fill="url(#w-warm)" style="opacity:var(--lit)"/>
    <rect x="176" y="-206" width="30" height="78" fill="var(--wood2)"/><path d="M176-190h30M176-172h30M191-206v16M184-190v18M198-190v18" stroke="var(--roof)" stroke-width="1.500"/>
    <path d="M169-206h44c3-11-10-16-22-14-12-2-25 3-22 14Z" fill="var(--snow)"/>
    <path d="M10-118h230V0H10Z" fill="var(--wood)"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M10 ${-98 + i * 20}h230" stroke="var(--wood2)" stroke-width="2.500"/><path d="M10 ${-97 + i * 20}h230" stroke="#fff" stroke-opacity=".08"/>`).join('')}
    <path d="M6-118 125-208l119 90Z" fill="var(--wood2)"/>
    <circle cx="125" cy="-146" r="17" fill="var(--roof)"/><circle cx="125" cy="-146" r="13" fill="url(#w-win)"/><circle cx="125" cy="-146" r="13" fill="#6c8cbc" style="opacity:calc(1 - var(--lit))"/><path d="M125-159v26M112-146h26" stroke="var(--roof)" stroke-width="2.500"/>
    <path d="M-18-104 125-222l143 118-13 7L125-200-5-97Z" fill="var(--roof)"/>
    <path d="M-26-101c-5-8 4-17 11-23L125-236 265-124c7 6 16 15 11 23-8 6-16 3-23-3-1 7-11 9-16 3-3 6-12 5-15-1L125-195 28-102c-4 7-14 6-17-1-5 6-14 5-17-1-6 6-13 8-20 3Z" fill="var(--snow)"/>
    <path d="M-12-118c30-24 92-76 137-110 12 9 28 22 44 35-20-15-34-25-44-31-44 34-104 83-137 106Z" fill="#fff" opacity=".55"/>
    ${icicles}
    ${lwin(34, -84, 50, 44, true)}${lwin(166, -84, 50, 44)}
    <path d="M166-84h25c-2 16-12 30-25 36ZM216-84h-25c2 16 12 30 25 36Z" fill="#d6304a" opacity=".55"/>
    <rect x="183" y="-34" width="16" height="9" rx="2" fill="#7a3a24"/><path d="M186-34c-3-7 0-10 5-14 5 4 8 7 5 14Z" fill="#2f7d4f"/><circle cx="191" cy="-46" r="1.800" fill="#e8344e"/>
    <path d="M100 0v-68q0-7 7-7h36q7 0 7 7V0Z" fill="var(--roof)"/><path d="M104 0v-66q0-5 5-5h32q5 0 5 5V0Z" fill="#a33752"/><path d="M110-62h30v22h-30ZM110-34h30V-6h-30Z" fill="none" stroke="#7d2238" stroke-width="2"/>
    <circle cx="125" cy="-50" r="10" fill="none" stroke="#2f7d4f" stroke-width="5.500"/><path d="m125-42-5 8 5-3 5 3Z" fill="#e8344e"/><circle cx="125" cy="-42" r="2.500" fill="#e8344e"/><circle cx="141" cy="-34" r="2" fill="#ffd34d"/>
    <path d="M-34 8c20-20 60-24 92-10 22-10 46-6 72 4 34-14 84-14 116 0 26-6 52 2 66 16 0 16-346 18-346-10Z" fill="var(--midA)"/>
  </g>`;

  const tierW = [[-228, 42], [-180, 64], [-124, 86], [-68, 110]];
  const tree = `<g transform="translate(${TX} ${TY})">
    <rect x="-11" y="-14" width="22" height="24" fill="var(--wood2)"/>
    ${tierW.map(([top, w], i) => { const b = top + 86; return `<path d="M0 ${top}L${w} ${b}Q${w / 2} ${b + 12} 0 ${b - 1}Q${-w / 2} ${b + 12} ${-w} ${b}Z" fill="var(--tree)"/><path d="M0 ${top}L${w * .55} ${top + 47}Q${w * .3} ${top + 40} ${w * .18} ${top + 52}Q0 ${top + 38} ${-w * .2} ${top + 53}Q${-w * .32} ${top + 40} ${-w * .55} ${top + 47}Z" fill="var(--snow)" opacity="${.95 - i * .03}"/>`; }).reverse().join('')}
    <path d="M-92 16c26-20 158-20 184 0 0 10-184 12-184 0Z" fill="var(--midA)"/>
    <path d="m0-254 5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" fill="#ffe14d" stroke="#fff4b0"/>
  </g>`;

  const gift = (x, y, w, h, c, r) => `<g transform="translate(${x} ${y})"><path d="M${-w / 2 - 8} 6q${w / 2 + 8} -14 ${w + 16} 0v10h-${w + 16}Z" fill="var(--shade)"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="2" fill="${c}"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h * .22}" fill="#fff" opacity=".2"/><rect x="${-w * .1}" y="${-h}" width="${w * .2}" height="${h}" fill="${r}"/><rect x="${-w / 2}" y="${-h * .58}" width="${w}" height="${h * .16}" fill="${r}"/><path d="M0 ${-h}c-6-14-22-13-19-4 2 6 14 5 19 4Zm0 0c6-14 22-13 19-4-2 6-14 5-19 4Z" fill="${r}"/><path d="M${-w / 2 - 2} ${-h + 3}q${w / 2 + 2} -8 ${w + 4} 0l-2 5q-8 3-12-1-8 5-14 0-8 4-13 0-6 3-11 0Z" fill="var(--snow)"/></g>`;

  const snowman = (x, y) => `<g transform="translate(${x} ${y})">
    <path d="M-52 10q52-18 104 0v10H-52Z" fill="var(--shade)"/>
    <circle cx="0" cy="-20" r="34" fill="var(--snow)"/><circle cx="0" cy="-66" r="25" fill="var(--snow)"/><circle cx="0" cy="-103" r="18" fill="var(--snow)"/>
    <path d="M-30-30a34 34 0 0 0 60 20A34 34 0 0 1-30-30ZM-22-74a25 25 0 0 0 44 16A25 25 0 0 1-22-74Z" fill="var(--shade)" opacity=".6"/>
    <circle cx="-6" cy="-106" r="2.500" fill="#1a1a2a"/><circle cx="7" cy="-106" r="2.500" fill="#1a1a2a"/><path d="m0-101 18 4-18 3Z" fill="#f2851e"/>
    <path d="M-9-92q9 5 18 0" fill="none" stroke="#1a1a2a" stroke-width="2" stroke-dasharray="1 3" stroke-linecap="round"/>
    <path d="M-20-84q20 8 40 0l1 7q-21 8-42 0Z" fill="#d6304a"/><path d="M8-80l4 22 9-3-5-20Z" fill="#b81f3a"/>
    <circle cy="-66" r="2.500" fill="#1a1a2a"/><circle cy="-52" r="2.500" fill="#1a1a2a"/>
    <path d="M-23-68-52-88m7 5-6 8M23-68l28-16m-8 5 8 7" stroke="#5a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-18-117c2-14 14-22 26-20 8 1 15 8 19 17l-6 3c-3-5-6-8-9-9l2 12Z" fill="#d6304a"/><circle cx="27" cy="-116" r="5" fill="#fff"/><path d="M-21-120q20-7 36 0l1 6q-19-6-38 0Z" fill="#fff"/>
  </g>`;

  const sign = (x, y) => `<g transform="translate(${x} ${y})">
    <rect x="-5" y="-66" width="10" height="72" fill="var(--wood2)"/>
    <path d="M-68-92h136l-4 40H-64Z" fill="var(--wood)" stroke="var(--wood2)" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="-77" text-anchor="middle" font-family="Trebuchet MS, Tahoma, sans-serif" font-weight="700" font-size="13" fill="#fff0c8">ФЕМБОЙ</text>
    <text x="0" y="-60" text-anchor="middle" font-family="Trebuchet MS, Tahoma, sans-serif" font-weight="700" font-size="13" fill="#fff0c8">ХАУС</text>
    <path d="M-72-92c10-9 30-8 40-4 16-6 38-5 54-1 12-5 34-5 50 5l-3 5c-18-3-30-1-41 0-16 4-30 1-40 0-14 3-30 3-55 0Z" fill="var(--snow)"/>
    <path d="M-30 6q30-12 60 0v8h-60Z" fill="var(--shade)"/>
  </g>`;

  const lamp = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="62" ry="15" fill="url(#w-warm)" style="opacity:var(--lit)"/>
    <rect x="-2.500" y="-92" width="5" height="96" fill="var(--roof)"/><rect x="-6" y="-8" width="12" height="11" rx="2" fill="var(--roof)"/>
    <path d="M-9-92h18l3-20H-12Z" fill="#fff2b8" stroke="var(--roof)" stroke-width="2.500"/><path d="M0-112v20M-5-112l-1 20M5-112l1 20" stroke="var(--roof)" stroke-width="1.200"/>
    <path d="M-15-111c4-11 26-11 30 0Z" fill="var(--snow)"/><path d="M-3-120c1-4 5-4 6 0Z" fill="var(--snow)"/>
  </g>`;
  const mailbox = (x, y) => `<g transform="translate(${x} ${y})">
    <rect x="-3" y="-30" width="6" height="34" fill="var(--wood2)"/>
    <path d="M-17-30v-11a9 9 0 0 1 9-9h15a9 9 0 0 1 9 9v11Z" fill="#2f8fe0" stroke="var(--roof)" stroke-width="1.500"/>
    <path d="m-8-37 16-6-3 13-3-5-4 3Z" fill="#fff"/><rect x="16" y="-52" width="2.500" height="16" fill="var(--roof)"/><path d="M18.500-52h11v7h-11Z" fill="#e8344e"/>
    <path d="M-19-47c3-9 29-10 37-1l-3 2c-9-2-20-2-31 1Z" fill="var(--snow)"/>
  </g>`;
  const sled = (x, y) => `<g transform="translate(${x} ${y})">
    <path d="M-52 10q52-14 104 0v8H-52Z" fill="var(--shade)" opacity=".7"/>
    <path d="M-44 10h74c12 0 20-5 22-15" fill="none" stroke="var(--roof)" stroke-width="4" stroke-linecap="round"/>
    <path d="M-30 10v-11M24 10v-11" stroke="var(--roof)" stroke-width="4"/>
    <rect x="-40" y="-8" width="74" height="8" rx="2" fill="#b0522a"/><rect x="-40" y="-15" width="74" height="4" rx="2" fill="#d97a3e"/>
    <rect x="-22" y="-36" width="30" height="24" rx="2" fill="#58c4f4"/><rect x="-11" y="-36" width="8" height="24" fill="#fff"/><path d="M-7-36c-3-9-12-8-11-3 1 3 8 3 11 3Zm0 0c3-9 12-8 11-3-1 3-8 3-11 3Z" fill="#fff"/>
    <path d="M52-6c10-12 22-8 30-1" fill="none" stroke="#d6304a" stroke-width="2.200"/>
  </g>`;
  const pond = (x, y) => `<g transform="translate(${x} ${y})">
    <ellipse cx="0" cy="0" rx="118" ry="23" fill="var(--midB)" opacity=".62"/><ellipse cx="0" cy="-3" rx="108" ry="18" fill="var(--far)" opacity=".5"/>
    <ellipse cx="34" cy="-4" rx="20" ry="5" fill="#fff8e4" style="opacity:var(--moon)"/><path d="M-70 2c20-6 38-7 56-5M-40 9c18-4 40-5 66-2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.800"/>
    <path d="M-104-13c-1-12 1-20 3-26M-97-11c0-10 3-16 6-20" fill="none" stroke="var(--pine)" stroke-width="2"/><ellipse cx="-101" cy="-41" rx="2.500" ry="7" fill="var(--wood2)"/><ellipse cx="-90" cy="-33" rx="2.500" ry="6" fill="var(--wood2)"/>
  </g>`;
  let paws = '';
  for (let i = 0; i < 13; i++) {
    const px = 352 + i * 17, py = yAt(nearPts, px) + 48 + Math.sin(i / 2) * 8 + (i % 2 ? 7 : 0);
    paws += `<g transform="translate(${n1(px)} ${n1(py)})" fill="var(--shade)"><ellipse rx="4" ry="2.800"/><circle cx="-3.500" cy="-3.500" r="1.100"/><circle cx="0" cy="-4.500" r="1.100"/><circle cx="3.500" cy="-3.500" r="1.100"/></g>`;
  }
  let steps = '';
  for (let i = 0; i < 11; i++) {
    const sx = HX + 125 - i * 8 + (i % 2 ? 7 : -7), sy = HY + 18 + i * 11;
    steps += `<ellipse cx="${sx}" cy="${sy}" rx="${n1(3.500 + i * .28)}" ry="${n1(1.800 + i * .16)}" fill="var(--midB)" opacity=".5"/>`;
  }
  const POLES = [40, 268, 496, 724, 948];
  const poleY = (x) => yAt(midPts, x) + 8;
  let poles = POLES.map((x) => { const y = poleY(x); return `<rect x="${x - 2.500}" y="${n1(y - 104)}" width="5" height="106" fill="var(--wood2)"/><rect x="${x - 15}" y="${n1(y - 96)}" width="30" height="4" fill="var(--wood2)"/><path d="M${x - 17} ${n1(y - 96)}c6-5 28-5 34 0Z" fill="var(--snow)"/>`; }).join('');
  POLES.forEach((x, i) => {
    const nx = i < POLES.length - 1 ? POLES[i + 1] : HX + 6, y0 = poleY(x) - 96, y1 = i < POLES.length - 1 ? poleY(nx) - 96 : HY - 92;
    [-13, 13].forEach((o) => { poles += `<path d="M${x + o} ${n1(y0)}Q${(x + nx) / 2 + o} ${n1(Math.max(y0, y1) + 24)} ${nx + (i < POLES.length - 1 ? o : 0)} ${n1(y1)}" fill="none" stroke="var(--roof)" stroke-width="1.300" opacity=".75"/>`; });
  });
  let village = '';
  const VILLAGE = [[196, 536, 1], [232, 530, .8], [262, 539, .9], [612, 544, 1], [646, 538, .8], [1458, 526, .9], [1492, 532, .8]];
  VILLAGE.forEach(([vx, vy, s]) => {
    village += `<g transform="translate(${vx} ${vy}) scale(${s})"><rect x="-13" y="-16" width="26" height="18" fill="var(--pine)"/><path d="M-17-15 0-30l17 15Z" fill="var(--farCap)"/><rect x="-8" y="-11" width="6" height="6" fill="#ffd27a" style="opacity:var(--lit)"/><rect x="3" y="-11" width="6" height="6" fill="#ffd27a" style="opacity:var(--lit)"/></g>`;
  });

  const wirePts = [];
  for (let x = -110; x <= 1710; x += 18) wirePts.push([x, yAt(nearPts, x) + 18 + Math.sin(x / 62) * 9]);
  const wire = 'M' + wirePts.map((p) => `${p[0]} ${n1(p[1])}`).join('L');

  let pinesFar = '', pinesMid = '';
  for (let i = 0; i < 46; i++) { const x = -90 + rnd() * 1780; pinesFar += pine(x, 560 - rnd() * 30, .5 + rnd() * .35, 'var(--pine)', .55); }
  for (let i = 0; i < 16; i++) { const x = -90 + rnd() * 980, s = .85 + rnd() * .75; pinesMid += pine(x, yAt(midPts, x) + 8, s); }
  [[1500, 1.5], [1580, 1.15], [1660, 1.6], [960, .8]].forEach(([x, s]) => { pinesMid += pine(x, yAt(midPts, x) + 8, s); });

  const lay = (d, inner) => `<svg class="lay" data-d="${d}" viewBox="0 0 1600 900" preserveAspectRatio="none">${inner}</svg>`;
  wall.innerHTML = `<div class="aurora"><i></i><i></i></div><div class="clouds"><i style="top:7%;--d:150s;--delay:-40s"></i><i style="top:19%;--w:260px;--d:190s;--delay:-120s;opacity:.8"></i><i style="top:32%;--w:320px;--d:230s;--delay:-20s;opacity:.6"></i></div>`
    + lay(6, `<defs>
        <radialGradient id="w-moon"><stop offset="0" stop-color="#fff2d0" stop-opacity=".55"/><stop offset=".32" stop-color="#ffe6c0" stop-opacity=".2"/><stop offset="1" stop-color="#ffe6c0" stop-opacity="0"/></radialGradient>
        <radialGradient id="w-sun"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".16" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
        <radialGradient id="w-warm"><stop offset="0" stop-color="#ffc66a" stop-opacity=".62"/><stop offset=".6" stop-color="#ff9f6a" stop-opacity=".16"/><stop offset="1" stop-color="#ff9f6a" stop-opacity="0"/></radialGradient>
        <linearGradient id="w-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b4"/><stop offset="1" stop-color="#ffae3e"/></linearGradient>
        <linearGradient id="w-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--midA)"/><stop offset=".5" stop-color="var(--midB)"/></linearGradient>
        <linearGradient id="w-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nearA)"/><stop offset=".62" stop-color="var(--nearB)"/></linearGradient>
        <linearGradient id="w-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--far)"/><stop offset="1" stop-color="var(--midB)"/></linearGradient>
      </defs>
      <path d="M760 128 742 112 778 112ZM742 112 728 88M742 112 750 70M778 112 774 70M778 112 794 88" fill="none" stroke="#fff" stroke-width="1" style="opacity:calc(var(--lit) * .22)"/>
      <g style="opacity:var(--moon)"><circle cx="1270" cy="150" r="190" fill="url(#w-moon)"/><circle cx="1270" cy="150" r="86" fill="none" stroke="#fff" stroke-width="2" opacity=".1"/><circle cx="1270" cy="150" r="118" fill="none" stroke="#fff" stroke-width="1" opacity=".06"/><circle cx="1270" cy="150" r="52" fill="#fff8e4"/><circle cx="1252" cy="134" r="11" fill="#efe2c6" opacity=".7"/><circle cx="1288" cy="168" r="15" fill="#efe2c6" opacity=".6"/><circle cx="1292" cy="128" r="6" fill="#efe2c6" opacity=".65"/><circle cx="1246" cy="172" r="6" fill="#efe2c6" opacity=".5"/></g>
      <g style="opacity:var(--sun)"><circle cx="1240" cy="170" r="240" fill="url(#w-sun)"/></g>`)
    + lay(12, `<path d="M-120 520 120 430 210 490 330 380 440 470 560 400 700 500 820 420 960 490 1100 400 1230 480 1370 390 1500 470 1720 410V1100H-120Z" fill="url(#w-far)"/>
      <path d="M330 380 379 420 360 412 345 428 328 412 310 426 298 414 286 420ZM560 400 596 428 578 424 566 436 552 424 538 432 522 426ZM820 420 876 448 852 442 838 454 820 442 802 452 790 442 778 448ZM1100 400 1158 436 1136 430 1120 444 1102 430 1082 442 1064 430 1044 436ZM1370 390 1428 426 1406 420 1390 434 1372 420 1352 432 1334 420 1314 426ZM120 430 164 460 146 454 132 466 118 454 100 462 84 446 66 450Z" fill="var(--farCap)"/>
      ${pinesFar}${village}`)
    + lay(22, `<path d="${d3(midSegs)}" fill="url(#w-mid)"/>
      <path d="M-120 650C200 590 500 640 800 660c300 20 600-30 920-50" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="26"/>
      ${poles}
      ${pinesMid}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const x = 838 + i * 25, y = yAt(midPts, x) + 26; return `<rect x="${x}" y="${n1(y - 28)}" width="6" height="30" fill="var(--wood2)"/><ellipse cx="${x + 3}" cy="${n1(y - 28)}" rx="6" ry="3" fill="var(--snow)"/>`; }).join('')}
      <path d="M838 ${n1(yAt(midPts, 838) + 10)}L1013 ${n1(yAt(midPts, 1013) + 10)}M838 ${n1(yAt(midPts, 838) + 20)}L1013 ${n1(yAt(midPts, 1013) + 20)}" stroke="var(--wood2)" stroke-width="3"/>
      ${house}${steps}${tree}
      ${mailbox(1006, yAt(midPts, 1006) + 24)}
      ${lamp(800, yAt(midPts, 800) + 22, 1)}`)
    + lay(38, `<path d="${d3(nearSegs)}" fill="url(#w-near)"/>
      <path d="M-120 830C200 760 520 800 860 830c300 26 560-30 860-50V1100H-120Z" fill="var(--shade)" opacity=".28"/>
      <path d="M-120 775C220 686 520 706 800 751c260 41 520-44 920-55" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="5"/>
      ${pine(1590, yAt(nearPts, 1590) + 24, 3)}${pine(-10, yAt(nearPts, -10) + 24, 2.700)}
      ${pond(300, yAt(nearPts, 300) + 54)}
      ${paws}
      <path d="${wire}" fill="none" stroke="#1f3a36" stroke-width="2.200" opacity=".85"/>
      ${snowman(590, yAt(nearPts, 590) + 4)}
      ${sled(748, yAt(nearPts, 748) + 28)}
      ${lamp(1044, yAt(nearPts, 1044) + 6, 1.350)}
      ${sign(900, yAt(nearPts, 900) + 6)}
      ${gift(1175, yAt(nearPts, 1175) + 6, 62, 48, '#d6304a', '#fff')}
      ${gift(1248, yAt(nearPts, 1248) + 10, 46, 34, '#ff7fb6', '#fff6d0')}
      ${gift(1118, yAt(nearPts, 1118) + 12, 40, 30, '#58c4f4', '#fff')}`);

  const lays = FH.$$('.lay', wall).map((el) => ({el, d: +el.dataset.d}));

  // ---------- то, что живёт на холсте (координаты в единицах сцены)
  const lights = [];
  const COLORS = ['#ffd27a', '#ff6f91', '#7fe0ff', '#ffe98a', '#9dff9a', '#ffb066'];
  wirePts.forEach((p, i) => { if (i % 3 === 0) lights.push({x: p[0], y: p[1] + 3, d: 38, c: COLORS[(i / 3) % COLORS.length], r: 10, p: i * 1.3, sp: 1.4 + (i % 4) * .3}); });
  tierW.forEach(([top, w], t) => {
    for (let i = 0; i < 6 + t * 3; i++) {
      const v = .28 + rnd() * .68, b = top + 86 * v, half = w * v * .86, x = (rnd() * 2 - 1) * half;
      lights.push({x: TX + x, y: TY + b, d: 22, c: COLORS[Math.floor(rnd() * COLORS.length)], r: 7, p: rnd() * 6, sp: 1 + rnd() * 2});
    }
  });
  for (let i = 0; i <= 12; i++) { const k = i / 12; lights.push({x: HX - 16 + 141 * k, y: HY - 95 - 118 * k, d: 22, c: i % 2 ? '#ffd27a' : '#ff8fb8', r: 7, p: i, sp: 1.8}); lights.push({x: HX + 266 - 141 * k, y: HY - 95 - 118 * k, d: 22, c: i % 2 ? '#ffd27a' : '#7fe0ff', r: 7, p: i + 2, sp: 1.8}); }
  lights.push({x: TX, y: TY - 238, d: 22, c: '#ffe98a', r: 18, p: 0, sp: 1.2});
  lights.push({x: 800, y: yAt(midPts, 800) + 22 - 102, d: 22, c: '#ffe0a0', r: 26, p: 0, sp: .3});
  lights.push({x: 1044, y: yAt(nearPts, 1044) + 6 - 138, d: 38, c: '#ffe0a0', r: 34, p: 2, sp: .3});
  VILLAGE.forEach(([vx, vy], i) => lights.push({x: vx, y: vy - 8, d: 12, c: '#ffd27a', r: 6, p: i, sp: .4}));
  const stars = [], sparks = [];
  [[760, 128], [742, 112], [778, 112], [728, 88], [750, 70], [774, 70], [794, 88]].forEach(([sx, sy], i) => stars.push({x: sx, y: sy, r: 2, p: i, sp: .5}));
  for (let i = 0; i < 170; i++) stars.push({x: rnd() * 1800 - 100, y: rnd() * rnd() * 375, r: .5 + rnd() * 1.100, p: rnd() * 6, sp: .4 + rnd() * 2});
  for (let i = 0; i < 46; i++) { const x = rnd() * 1800 - 100; sparks.push({x, y: yAt(nearPts, x) + 26 + rnd() * 150, p: rnd() * 6, sp: .5 + rnd() * 1.400}); }

  // заготовки свечения: рисовать картинку дешевле, чем считать градиент на каждый кадр
  const spriteCache = {};
  const sprite = (c) => {
    if (spriteCache[c]) return spriteCache[c];
    const s = document.createElement('canvas'), x = s.getContext('2d');
    s.width = s.height = 48;
    const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, '#fff'); g.addColorStop(.16, c); g.addColorStop(.42, c + '55'); g.addColorStop(1, c + '00');
    x.fillStyle = g; x.fillRect(0, 0, 48, 48);
    return (spriteCache[c] = s);
  };
  const flakeSprite = (() => {
    const s = document.createElement('canvas'), x = s.getContext('2d');
    s.width = s.height = 32;
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return s;
  })();

  // ---------- состояние
  let skyKey = store.get('sky', 'night'), sky = SKIES.night;
  let snowOn = store.get('snow', !reduce), garland = store.get('garland', true), density = store.get('density', 1);
  let W = 0, H = 0, S = 1, ox = 0, oy = 0, px = 0, py = 0, tx = 0, ty = 0;
  let flakes = [], raf = 0, last = 0, fps = 60, frames = 0, fpsT = 0;
  let mx = -999, my = -999, shoot = null, nextShoot = 9000;
  const parallax = !coarse && !reduce;

  function applySky() {
    const key = skyKey === 'auto' ? autoSky() : skyKey;
    sky = SKIES[key] || SKIES.night;
    const st = wall.style;
    sky.s.forEach((c, i) => st.setProperty('--s' + (i + 1), c));
    ['lit', 'moon', 'sun', 'clouds', 'aur', 'far', 'farCap', 'midA', 'midB', 'nearA', 'nearB', 'shade', 'pine', 'tree', 'snow', 'wood', 'wood2', 'roof'].forEach((k) => st.setProperty('--' + k, sky[k]));
    kick();
  }

  function size() {
    const d = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = desk.clientWidth; H = desk.clientHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    S = Math.max(W / 1600, H / 900);
    const sw = 1600 * S, sh = 900 * S;
    // дом и ёлка держатся в кадре даже на узком экране телефона
    ox = clamp(W / 2 - 1160 * S, W - sw, 0);
    oy = H - sh;
    lays.forEach((l) => { l.el.style.width = sw + 'px'; l.el.style.height = sh + 'px'; });
    applyLayers();
    const target = Math.round(clamp(W * H / 15000, 36, coarse ? 80 : 150) * density);
    while (flakes.length < target) flakes.push(newFlake(true));
    flakes.length = target;
    kick();
  }
  function applyLayers() { lays.forEach((l) => { l.el.style.transform = `translate3d(${ox + px * l.d}px, ${oy + py * l.d * .35}px, 0)`; }); }

  function newFlake(any) {
    const big = Math.random() < .05, z = Math.random();
    return {x: Math.random() * (W + 80) - 40, y: any ? Math.random() * H : -10 - Math.random() * 30, z, r: big ? 5 + Math.random() * 4 : .9 + z * 2.500, v: big ? 80 + Math.random() * 40 : 16 + z * 44, a: big ? .22 : .5 + z * .5, p: Math.random() * 6.283, big};
  }

  // ---------- снежная шапка на окнах: снежинки, долетевшие до заголовка, остаются на нём
  const BW = 4, CAPH = 18, BASE = 14;
  function capOf(w) {
    if (w.cap) return w.cap;
    const c = document.createElement('canvas');
    c.className = 'cap';
    w.el.append(c);
    const cap = w.cap = {c, x: c.getContext('2d'), h: null, width: 0, dirty: true, t: 0};
    w.shake = (speed) => {
      if (speed < 1.5 || !cap.h) return;
      let shed = 0;
      const r = w.el.getBoundingClientRect();
      for (let i = 0; i < cap.h.length; i++) { const lost = cap.h[i] * .22; cap.h[i] -= lost; shed += lost; if (lost > .35 && Math.random() < .3) FH.fx.spawn(r.left + i * BW, r.top - 2, {kind: 'snow', n: 1}); }
      if (shed) cap.dirty = true;
      if (shed > 25 && FH.ach) FH.ach.give('shake');
    };
    return cap;
  }
  function fitCap(cap, width) {
    if (cap.width === width) return;
    const d = Math.min(devicePixelRatio || 1, 2), nb = Math.ceil(width / BW) + 1, old = cap.h;
    cap.h = new Float32Array(nb);
    for (let i = 0; i < nb; i++) cap.h[i] = old ? old[Math.floor(i / nb * old.length)] : 1 + Math.random() * 1.800;
    cap.width = width;
    cap.c.width = width * d; cap.c.height = CAPH * d;
    cap.c.style.width = width + 'px';
    cap.x.setTransform(d, 0, 0, d, 0, 0);
    cap.dirty = true;
  }
  function drawCap(cap) {
    const x = cap.x, h = cap.h, nb = h.length, w = cap.width;
    x.clearRect(0, 0, w, CAPH);
    const edge = (i) => clamp(Math.min(i, nb - 1 - i) / 3, 0, 1);
    x.beginPath();
    x.moveTo(0, BASE + 1);
    for (let i = 0; i < nb - 1; i++) {
      const y0 = BASE - h[i] * edge(i), y1 = BASE - h[i + 1] * edge(i + 1);
      x.quadraticCurveTo(i * BW, y0, (i + .5) * BW, (y0 + y1) / 2);
    }
    x.lineTo(w, BASE + 1);
    x.closePath();
    const g = x.createLinearGradient(0, BASE - 12, 0, BASE + 2);
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#d8e2ff');
    x.fillStyle = g;
    x.shadowColor = 'rgba(0,0,50,.25)'; x.shadowBlur = 1.500; x.shadowOffsetY = 1;
    x.fill();
    x.shadowColor = 'transparent';
  }
  function settle(cap, i, r) {
    const add = .55 + r * .4;
    for (let k = -3; k <= 3; k++) {
      const j = i + k;
      if (j < 0 || j >= cap.h.length) continue;
      cap.h[j] = Math.min(10, cap.h[j] + add * (1 - Math.abs(k) / 4));
    }
    cap.dirty = true;
  }

  // ---------- кадр
  function draw(now, dt) {
    ctx.clearRect(0, 0, W, H);
    const ppx = (d) => ox + px * d, ppy = (d) => oy + py * d * .35;

    if (sky.stars > .02) {
      ctx.fillStyle = '#fff';
      const bx = ppx(6), by = ppy(6);
      for (const s of stars) {
        const a = sky.stars * (.45 + .55 * Math.sin(now * .001 * s.sp + s.p));
        if (a <= .03) continue;
        ctx.globalAlpha = a;
        const r = s.r * Math.max(1, S);
        ctx.fillRect(bx + s.x * S - r / 2, by + s.y * S - r / 2, r, r);
      }
      ctx.globalAlpha = 1;
      if (sky.stars > .4 && !reduce) {
        nextShoot -= dt * 1000;
        if (nextShoot <= 0 && !shoot) { shoot = {x: Math.random() * W * .7, y: Math.random() * H * .2, t: 0}; nextShoot = 16000 + Math.random() * 26000; }
        if (shoot) {
          shoot.t += dt;
          const k = shoot.t / .75, hx = shoot.x + k * 340, hy = shoot.y + k * 130;
          const g = ctx.createLinearGradient(hx - 110, hy - 42, hx, hy);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${Math.sin(Math.min(1, k) * 3.14) * .9})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.800;
          ctx.beginPath(); ctx.moveTo(hx - 110, hy - 42); ctx.lineTo(hx, hy); ctx.stroke();
          if (k >= 1) shoot = null;
        }
      }
    }

    // дым из трубы
    {
      const bx = ppx(22), by = ppy(22), cx = HX + 191, cy = HY - 214;
      for (let i = 0; i < 8; i++) {
        const k = (now * .00009 + i / 8) % 1, r = (7 + k * 34) * S;
        ctx.globalAlpha = (1 - k) * (k < .08 ? k * 12 : 1) * .24;
        ctx.drawImage(flakeSprite, bx + (cx + Math.sin(k * 5 + i) * 10 + k * 46) * S - r, by + (cy - k * 170) * S - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'lighter';
    const glow = .3 + sky.lit * .75;
    if (garland) for (const l of lights) {
      const a = (.6 + .4 * Math.sin(now * .001 * l.sp + l.p)) * glow, r = l.r * S;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite(l.c), ppx(l.d) + l.x * S - r * 1.6, ppy(l.d) + l.y * S - r * 1.6, r * 3.2, r * 3.2);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // искры на снегу
    ctx.fillStyle = '#fff';
    for (const s of sparks) {
      const a = Math.pow(Math.max(0, Math.sin(now * .001 * s.sp + s.p)), 26);
      if (a < .05) continue;
      const x = ppx(38) + s.x * S, y = ppy(38) + s.y * S, r = 3.500 * a * Math.max(1, S);
      ctx.globalAlpha = a;
      ctx.fillRect(x - r, y - .5, r * 2, 1); ctx.fillRect(x - .5, y - r, 1, r * 2);
    }
    ctx.globalAlpha = 1;

    if (snowOn) {
      const list = [];
      if (wide()) for (const w of FH.wm.list()) {
        if (w.el.classList.contains('min') || w.el.classList.contains('max')) continue;
        const cap = capOf(w), width = w.el.offsetWidth + 2;
        fitCap(cap, width);
        list.push({x0: w.el.offsetLeft, x1: w.el.offsetLeft + width, y: w.el.offsetTop, cap});
      }
      const wind = Math.sin(now / 9000) * 9 + Math.sin(now / 3100) * 4;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i], py0 = f.y;
        f.y += f.v * dt;
        f.x += (wind * (.4 + f.z) + Math.sin(now * .0011 + f.p) * 14) * dt;
        if (mx > -100) {
          const dx = f.x - mx, dy = f.y - my, q = dx * dx + dy * dy;
          if (q < 8100) { const k = (1 - q / 8100) * 90 * dt, l = Math.sqrt(q) || 1; f.x += dx / l * k; f.y += dy / l * k * .5; }
        }
        if (!f.big) for (const r of list) {
          if (py0 <= r.y && f.y > r.y && f.x >= r.x0 && f.x <= r.x1) {
            settle(r.cap, Math.floor((f.x - r.x0) / BW), f.r);
            flakes[i] = newFlake(false);
            break;
          }
        }
        const g = flakes[i];
        if (g.y > H + 12 || g.x < -60 || g.x > W + 60) { flakes[i] = newFlake(false); continue; }
        ctx.globalAlpha = g.a;
        ctx.drawImage(flakeSprite, g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
      }
      ctx.globalAlpha = 1;
      for (const r of list) if (r.cap.dirty && now - r.cap.t > 90) { drawCap(r.cap); r.cap.dirty = false; r.cap.t = now; }
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0, .05);
    last = now;
    frames++;
    if (now - fpsT > 500) { fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now; }
    if (parallax) {
      const nx = px + (tx - px) * .05, ny = py + (ty - py) * .05;
      if (Math.abs(nx - px) + Math.abs(ny - py) > .002) { px = nx; py = ny; applyLayers(); }
    }
    draw(now, dt);
    if (reduce && !snowOn) { cancelAnimationFrame(raf); raf = 0; }
  }
  function kick() {
    if (reduce && !snowOn) { draw(performance.now(), 0); return; }
    if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  addEventListener('resize', size);
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; }
    if (parallax) { tx = -(e.clientX / innerWidth - .5) * .9; ty = -(e.clientY / innerHeight - .5) * .9; }
  }, {passive: true});
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf); raf = 0;
    if (!document.hidden) kick();
  });

  applySky();
  size();

  FH.scene = {
    SKIES,
    get sky() { return skyKey; },
    setSky(k) { skyKey = k; store.set('sky', k); applySky(); },
    get snow() { return snowOn; },
    set snow(v) { snowOn = v; store.set('snow', v); $('#snowBtn').setAttribute('aria-pressed', String(v)); kick(); },
    get garland() { return garland; },
    set garland(v) { garland = v; store.set('garland', v); kick(); },
    get density() { return density; },
    set density(v) { density = v; store.set('density', v); size(); },
    get fps() { return fps; },
    get flakes() { return snowOn ? flakes.length : 0; },
  };
  // на случай смены времени суток при автообоях
  setInterval(() => { if (skyKey === 'auto') applySky(); }, 300000);

  // ---------- верхний слой для частиц: конфетти, сердечки, стряхнутый снег
  FH.fx = (() => {
    let c = null, x = null, parts = [], run = 0, t0 = 0;
    const PAPER = ['#ff6fb0', '#58c4f4', '#ffd34d', '#8ee67a', '#c7a4ff', '#ff9d6c', '#fff'];
    const ensure = () => {
      if (c) return;
      c = document.createElement('canvas');
      c.className = 'fx';
      document.body.append(c);
      x = c.getContext('2d');
    };
    const fit = () => { c.width = innerWidth; c.height = innerHeight; };
    function loop(now) {
      const dt = Math.min((now - t0) / 1000, .05);
      t0 = now;
      x.clearRect(0, 0, c.width, c.height);
      parts = parts.filter((p) => p.t < p.life);
      for (const p of parts) {
        p.t += dt;
        p.vy += p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.a += p.va * dt;
        const k = 1 - p.t / p.life;
        x.globalAlpha = Math.min(1, k * 2.500);
        if (p.kind === 'snow') {
          x.fillStyle = '#fff';
          x.beginPath(); x.arc(p.x, p.y, p.s, 0, 6.283); x.fill();
        } else if (p.kind === 'heart') {
          x.fillStyle = p.c;
          x.font = `${p.s * 3}px serif`;
          x.textAlign = 'center';
          x.fillText('♥', p.x, p.y);
        } else {
          x.save();
          x.translate(p.x, p.y); x.rotate(p.a);
          x.fillStyle = p.c;
          x.fillRect(-p.s, -p.s * .45 * Math.abs(Math.cos(p.a * 2)) - .5, p.s * 2, p.s * .9 * Math.abs(Math.cos(p.a * 2)) + 1);
          x.restore();
        }
      }
      x.globalAlpha = 1;
      if (parts.length) run = requestAnimationFrame(loop);
      else { run = 0; x.clearRect(0, 0, c.width, c.height); c.hidden = true; }
    }
    return {
      spawn(px0, py0, {kind = 'paper', n = 40, power = 420, life = 1.8} = {}) {
        if (reduce) return;
        ensure();
        c.hidden = false;
        if (c.width !== innerWidth || c.height !== innerHeight) fit();
        for (let i = 0; i < n; i++) {
          const a = kind === 'snow' ? 1.57 + (Math.random() - .5) : Math.random() * 6.283, v = kind === 'snow' ? 20 + Math.random() * 60 : power * (.25 + Math.random() * .75);
          parts.push({kind, x: px0, y: py0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'paper' ? 160 : kind === 'heart' ? 90 : 0), g: kind === 'snow' ? 240 : kind === 'heart' ? -40 : 520, s: kind === 'snow' ? .9 + Math.random() * 1.800 : 3 + Math.random() * 3.500, c: kind === 'heart' ? '#ff6fb0' : PAPER[i % PAPER.length], a: Math.random() * 6, va: (Math.random() - .5) * 12, t: 0, life: life * (.6 + Math.random() * .4)});
        }
        if (!run) { t0 = performance.now(); run = requestAnimationFrame(loop); }
      },
    };
  })();
})();

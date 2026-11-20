/*!
 * <bad-scroll-pipeline> — interactive, keyboard-driven walkthrough of a slow
 * scroll pipeline. Framework-free Web Component (classic script, no imports).
 *
 * Usage:
 *   <script src="/demos/bad-scroll-pipeline.js" defer></script>
 *   <bad-scroll-pipeline>fallback content (image / text) for no-JS readers</bad-scroll-pipeline>
 *
 * Attributes:
 *   step="0"         initial step (0-based)
 *   controls="none"  hide the button bar (e.g. in slides)
 *   theme="light|dark"  force a theme (default: follows prefers-color-scheme)
 *
 * Keyboard (when focused): → / Space / PageDown next · ← / PageUp prev ·
 *   Home first · End last · P play/pause
 *
 * JS API: el.next(), el.prev(), el.go(n), el.step, el.length,
 *   'stepchange' event (detail: { step }).
 *
 * Reveal.js: ScrollPipeline.bindReveal(Reveal) — the component then follows
 *   the `.fragment` elements placed inside it (one fragment per step after 0).
 *
 * Theming: override any of --sp-bg, --sp-fg, --sp-muted, --sp-line, --sp-box,
 *   --sp-main, --sp-main-soft, --sp-raster, --sp-raster-soft, --sp-screen,
 *   --sp-bad, --sp-font, --sp-mono, --sp-font-size on the element.
 */
(() => {
  if (customElements.get('bad-scroll-pipeline')) return;

  // ---------------------------------------------------------------- geometry
  const NODES = [
    { id: 'input',  x: 32,  y: 80,  w: 90,  h: 100, t: 'main',   title: 'Input',            sub: ['wheel events'],                   step: 1 },
    { id: 'tab',    x: 146, y: 80,  w: 130, h: 100, t: 'main',   title: 'Tab',              sub: ['style · layout', '· paint'],      step: 2 },
    { id: 'ir',     x: 352, y: 80,  w: 150, h: 100, t: 'main',   title: 'ImageRenderer',    sub: ['paints every layer', 'into one image'], step: 4 },
    { id: 'owc',    x: 524, y: 80,  w: 140, h: 100, t: 'main',   title: 'objectWillChange', sub: ['sent on', 'every frame'],         step: 5, mono: true },
    { id: 'canvas', x: 686, y: 80,  w: 120, h: 100, t: 'main',   title: 'Canvas',           sub: ['replays entire', 'draw list'],    step: 6 },
    { id: 'raster', x: 236, y: 270, w: 170, h: 70,  t: 'raster', title: 'RasterThread',     sub: ['layers + draw list'],             step: 3 },
    { id: 'screen', x: 850, y: 80,  w: 90,  h: 100, t: 'screen', title: 'Screen',           sub: [''],                               step: 7 },
  ];
  const ARROWS = {
    'a-in':     [[122, 130], [146, 130]],
    'a-commit': [[211, 180], [211, 305], [236, 305]],
    'a-raster': [[406, 305], [427, 305], [427, 180]],
    'a-ir':     [[502, 130], [524, 130]],
    'a-owc':    [[664, 130], [686, 130]],
    'a-screen': [[806, 130], [850, 130]],
  };
  const BADGE_POS = {
    input: [77, 56], tab: [211, 56], ir: [427, 56], owc: [594, 56],
    canvas: [746, 56], screen: [895, 56], raster: [321, 354],
  };
  const ALL_ARROWS = Object.keys(ARROWS);

  // ---------------------------------------------------------------- timelines
  const SCHEMATIC_FRAME = {
    title: 'One frame, step by step', note: 'schematic · not to scale', T: 1000,
    main: [
      { s: 0, e: 180, l: 'Tab', k: 'tab' },
      { s: 330, e: 520, l: 'ImageRenderer', k: 'ir' },
      { s: 520, e: 545, l: '', k: 'owc' },
      { s: 545, e: 900, l: 'Canvas', k: 'canvas' },
    ],
    raster: [{ s: 180, e: 330, l: 'RasterThread', k: 'raster' }],
    wheel: [60, 420, 760],
  };
  const FREEZES = [[200, 670], [1220, 1690], [2300, 2770]];
  const FREEZE_TL = {
    title: 'Scrolling for 3 s', note: 'to scale · freezes ~470 ms, 0.5–0.7 s apart', T: 3000, axis: true,
    main: FREEZES.map(([s, e]) => ({ s, e, l: 'frozen ~470 ms', k: 'freeze' })),
    raster: FREEZES.map(([s]) => ({ s, e: s + 70, l: '', k: 'raster' })),
    wheel: Array.from({ length: 40 }, (_, i) => 20 + i * 75),
  };

  const swipeSvg = (() => {
    const row = (y, label, deltas, scale) => {
      let s = `<text class="tl-row" x="20" y="${y + 19}">${label}</text>`;
      let x = 120;
      deltas.forEach((d) => {
        const w = d * scale;
        s += `<rect class="finger" x="${x}" y="${y}" width="${w}" height="28" rx="4"/>`;
        x += w + 4;
      });
      s += `<text class="tl-arrow" x="478" y="${y + 20}" text-anchor="middle">→</text>`;
      x = 520;
      deltas.forEach(() => {
        s += `<rect class="pagebar" x="${x}" y="${y}" width="118" height="28" rx="4"/>` +
             `<text class="blk-label" x="${x + 59}" y="${y + 18}" text-anchor="middle">↺ 100 px</text>`;
        x += 124;
      });
      return s;
    };
    return row(430, 'slow swipe', [4, 6, 5], 3) +
      row(480, 'fast swipe', [80, 120, 150], 0.88) +
      `<text class="tl-note" x="280" y="540" text-anchor="middle">your finger moved (illustrative)</text>` +
      `<text class="tl-note" x="706" y="540" text-anchor="middle">page moved: always 100 px per event, animation restarts</text>`;
  })();

  const idleRedraws = {
    title: 'Page standing still for 1 s', note: 'to scale', T: 1000, axis: true,
    labels: ['main', 'raster', 'input'],
    main: Array.from({ length: 60 }, (_, i) => ({ s: i * (1000 / 60), e: i * (1000 / 60) + 6, l: '', k: 'redraw' })),
    raster: [], wheel: [],
    extras: `<text class="tl-note strong" x="90" y="527">no input, nothing changed — still 60 redraws requested</text>`,
  };
  const canvasTL = {
    title: 'Canvas redraws for 1 s', note: 'to scale', T: 1000, axis: true,
    labels: ['main', 'raster', '60 Hz'],
    main: [0, 250, 500, 750].map((s) => ({ s, e: s + 250, l: 'Canvas ~250 ms', k: 'canvas' })),
    raster: [], wheel: [],
    extras: `<rect class="budget" x="80" y="510" width="${(16 / 1000) * 860}" height="22" rx="2"/>` +
      `<text class="tl-note strong" x="100" y="526">← one 60 Hz frame is ~16 ms · Canvas needs ~250 ms → ~4 updates per second</text>`,
  };

  // ---------------------------------------------------------------- steps
  const STEPS = [
    {
      title: 'The scroll pipeline',
      html: 'Five boxes on two threads. Four of them (orange) run on the <b>main thread</b>; only <code>RasterThread</code> (blue) has its own queue. The main thread is also the one that reads your trackpad.',
      active: null, flows: [], badges: {}, queue: 0,
      tl: { title: 'Main thread over time', note: '', T: 1000, custom: '<text class="tl-empty" x="480" y="480" text-anchor="middle">Press → to follow one scroll through the pipeline</text>' },
    },
    {
      title: 'Your scroll has to wait',
      html: 'You swipe. The wheel event arrives on the main thread — but the main thread is busy drawing. New scroll events <b>wait in the queue</b> until it is done.',
      active: ['input'], flows: ['a-in'], badges: { input: 'waiting' }, queue: 5,
      tl: {
        title: 'Main thread over time', note: 'schematic', T: 1000,
        main: [{ s: 120, e: 700, l: 'busy drawing the page', k: 'busy' }], raster: [],
        wheel: Array.from({ length: 16 }, (_, i) => 30 + i * 60),
      },
    },
    {
      title: 'Tab: style · layout · paint',
      html: '<code>Tab</code> computes style, layout and paint — on the main thread — and hands the result to the raster queue in one <code>CommitData</code> call with 10 arguments.',
      active: ['tab'], flows: ['a-commit'], badges: { tab: 'main thread' }, queue: 2,
      tl: { ...SCHEMATIC_FRAME, hot: 'tab' },
    },
    {
      title: 'RasterThread paints nothing',
      html: 'On its own queue, <code>RasterThread</code> only groups the page into layers and builds a draw list. <b>No pixels are made here</b>, so the extra thread barely helps.',
      active: ['raster'], flows: [], badges: { raster: 'builds draw list · paints no pixels' }, queue: 3,
      tl: { ...SCHEMATIC_FRAME, hot: 'raster' },
    },
    {
      title: 'Back to the main thread: ImageRenderer',
      html: 'The real pixel work comes back to the main thread. SwiftUI <code>ImageRenderer</code> paints <b>every layer into one big image</b>. Nothing is cut into tiles, so a small scroll can\'t reuse what is already painted. Slowest frame in the trace: <b>484 ms</b>.',
      active: ['ir'], flows: ['a-raster'], badges: { ir: 'whole layer → 1 image · no tiles' }, queue: 4,
      tl: { ...SCHEMATIC_FRAME, hot: 'ir' },
    },
    {
      title: 'objectWillChange on every frame',
      html: '<code>objectWillChange</code> is sent on <b>every frame</b>, even when nothing changed. The trace shows the engine making 60 frames per second while the page was standing still.',
      active: ['owc'], flows: ['a-ir'], badges: { owc: 'fires every frame' }, queue: 0, pulse: true,
      tl: idleRedraws,
    },
    {
      title: 'Canvas replays the whole draw list',
      html: 'SwiftUI <code>Canvas</code> replays the entire draw list. Before the fix (<code>eb5cd01</code>) one redraw took about <b>250 ms</b> — about 4 updates per second. A 60 Hz frame has about <b>16 ms</b>.',
      active: ['canvas'], flows: ['a-owc', 'a-screen'], badges: { canvas: '~250 ms per redraw' }, queue: 6,
      tl: canvasTL,
    },
    {
      title: 'Leave the painted area → freeze',
      html: 'The engine only draws a <b>2,400 px</b> area around the viewport. When the scroll leaves it, <code>Tab</code> lays out and paints the <i>whole page</i> again and it flows through every box: the screen freezes for <b>~470 ms</b>. The trace has <b>34 freezes</b> of 300–837 ms — frozen <b>15.9 s out of 30.6 s</b> of scrolling.',
      active: null, flows: [], badges: { tab: 're-layout whole page', ir: 'repaint every layer' }, queue: 1, freeze: true,
      tl: FREEZE_TL,
    },
    {
      title: 'Scrolling ignores your fingers',
      html: 'Every wheel event moves the page by the same <b>100 px</b> and restarts the scroll animation — no matter how slow or fast you swipe.',
      active: ['input', 'screen'], flows: ['a-in'], badges: { input: '+100 px / event' }, queue: 1,
      tl: { title: 'Two swipes, same result', note: 'illustrative', T: 1000, custom: swipeSvg },
    },
    {
      title: 'In short',
      html: 'The main thread draws the <b>entire page from scratch on every frame</b>, even when you only move it by a few pixels.',
      active: null, flows: [], freeze: true, pulse: true,
      badges: { input: 'waiting', ir: 'no tiles', owc: 'every frame', canvas: '~250 ms' }, queue: 1,
      tl: { ...FREEZE_TL, title: 'Result: frozen about half the time' },
    },
  ];

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function arrowSvg(id, pts) {
    const [a, b] = pts.slice(-2);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const s = 9;
    const p1 = [b[0] - s * Math.cos(ang - 0.45), b[1] - s * Math.sin(ang - 0.45)];
    const p2 = [b[0] - s * Math.cos(ang + 0.45), b[1] - s * Math.sin(ang + 0.45)];
    const end = [b[0] - 6 * Math.cos(ang), b[1] - 6 * Math.sin(ang)];
    const line = [...pts.slice(0, -1), end];
    const d = 'M' + line.map((p) => p.join(' ')).join(' L');
    return `<g class="arrow" data-id="${id}"><path d="${d}"/><polygon points="${b.join(',')} ${p1.join(',')} ${p2.join(',')}"/></g>`;
  }

  function nodeSvg(n) {
    const ty = n.h === 70 ? n.y + 28 : n.y + 34;
    let s = `<g class="node ${n.t}" data-id="${n.id}" data-step="${n.step}">` +
      `<rect class="box" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"/>` +
      `<text class="title${n.mono ? ' mono' : ''}" x="${n.x + n.w / 2}" y="${ty}" text-anchor="middle">${n.title}</text>`;
    n.sub.forEach((line, i) => {
      s += `<text class="sub"${n.id === 'screen' ? ' data-screen-sub' : ''} x="${n.x + n.w / 2}" y="${ty + 20 + i * 16}" text-anchor="middle">${line}</text>`;
    });
    if (n.id === 'input') {
      for (let i = 0; i < 8; i++) s += `<circle class="qdot" cx="${n.x + 10 + i * 10}" cy="${n.y + 80}" r="3.5"/>`;
    }
    return s + '</g>';
  }

  function badgeSvg(id, text) {
    const [cx, cy] = BADGE_POS[id];
    const w = text.length * 6.7 + 18;
    return `<g class="badge"><rect x="${cx - w / 2}" y="${cy - 11}" width="${w}" height="22" rx="11"/>` +
      `<text x="${cx}" y="${cy + 4}" text-anchor="middle">${esc(text)}</text></g>`;
  }

  function timelineSvg(spec) {
    const X0 = 80, WD = 860;
    const x = (t) => X0 + (t / spec.T) * WD;
    let s = `<text class="tl-title" x="20" y="410">${esc(spec.title)}</text>` +
      `<text class="tl-note" x="940" y="410" text-anchor="end">${esc(spec.note || '')}</text>`;
    if (spec.custom) return s + spec.custom;

    const labels = spec.labels || ['main', 'raster', 'wheel'];
    const rowY = [425, 466, 507];
    labels.forEach((l, i) => { s += `<text class="tl-row" x="72" y="${rowY[i] + 21}" text-anchor="end">${l}</text>`; });
    s += `<rect class="lane-bg main" x="${X0}" y="425" width="${WD}" height="33" rx="4"/>` +
         `<rect class="lane-bg raster" x="${X0}" y="466" width="${WD}" height="33" rx="4"/>`;

    const blocks = (list, y, cls) => list.forEach((b) => {
      const bx = x(b.s), bw = Math.max(1.5, x(b.e) - bx);
      const state = spec.hot ? (b.k === spec.hot ? ' hot' : ' dim') : '';
      s += `<rect class="blk ${cls} k-${b.k}${state}" x="${bx}" y="${y}" width="${bw}" height="33" rx="3"/>`;
      if (b.l && bw > b.l.length * 6.4 + 10) {
        s += `<text class="blk-label${state}" x="${bx + bw / 2}" y="${y + 21}" text-anchor="middle">${esc(b.l)}</text>`;
      }
    });
    blocks(spec.main, 425, 'm');
    blocks(spec.raster, 466, 'r');

    // wheel events: wait if they arrive while the main thread is busy
    const busy = spec.main.filter((b) => b.k !== 'redraw').map((b) => [b.s, b.e]).sort((a, b) => a[0] - b[0]);
    const merged = [];
    busy.forEach((iv) => {
      const last = merged[merged.length - 1];
      if (last && iv[0] <= last[1] + 1) last[1] = Math.max(last[1], iv[1]); else merged.push([...iv]);
    });
    const waits = new Set();
    (spec.wheel || []).forEach((t) => {
      const iv = merged.find(([a, b]) => t >= a && t < b);
      if (iv) waits.add(iv);
      s += `<circle class="tick${iv ? ' wait' : ''}" cx="${x(t)}" cy="515" r="3.5"/>`;
    });
    waits.forEach(([a, b]) => {
      s += `<line class="waitline" x1="${x(a)}" y1="528" x2="${x(b) - 4}" y2="528"/>` +
           `<polygon class="waithead" points="${x(b)},528 ${x(b) - 7},524 ${x(b) - 7},532"/>`;
    });
    if (waits.size && !spec.extras) {
      const [a, b] = [...waits][0];
      s += `<text class="tl-note bad" x="${(x(a) + x(b)) / 2}" y="546" text-anchor="middle">queued until the main thread is free</text>`;
    }
    if (spec.extras) s += spec.extras;

    if (spec.axis) {
      const stepMs = spec.T > 1000 ? 500 : 250;
      for (let t = 0; t <= spec.T; t += stepMs) {
        const label = t === 0 ? '0' : t >= 1000 ? `${t / 1000} s` : `${t} ms`;
        s += `<line class="axis" x1="${x(t)}" y1="552" x2="${x(t)}" y2="557"/>` +
             `<text class="tl-note" x="${x(t)}" y="572" text-anchor="${t === 0 ? 'start' : t === spec.T ? 'end' : 'middle'}">${label}</text>`;
      }
      s += `<line class="axis" x1="${X0}" y1="552" x2="${X0 + WD}" y2="552"/>`;
    }
    return s;
  }

  // ---------------------------------------------------------------- styles
  const CSS = `
  :host {
    --_bg: var(--sp-bg, #fbfaf7); --_fg: var(--sp-fg, #1f2328); --_muted: var(--sp-muted, #6b7280);
    --_line: var(--sp-line, #c3c7cd); --_box: var(--sp-box, #ffffff);
    --_main: var(--sp-main, #d9480f); --_main-soft: var(--sp-main-soft, #fff1e8);
    --_raster: var(--sp-raster, #1971c2); --_raster-soft: var(--sp-raster-soft, #e7f1fb);
    --_screen: var(--sp-screen, #2f9e44); --_bad: var(--sp-bad, #c92a2a);
    display: block; position: relative; box-sizing: border-box;
    background: var(--_bg); color: var(--_fg);
    font: var(--sp-font-size, 16px)/1.5 var(--sp-font, system-ui, -apple-system, "Segoe UI", sans-serif);
    border: 1px solid var(--_line); border-radius: 14px; padding: 14px 16px 12px;
    text-align: left; max-width: 100%;
  }
  @media (prefers-color-scheme: dark) {
    :host(:not([theme="light"])) {
      --_bg: var(--sp-bg, #16181d); --_fg: var(--sp-fg, #e6e6e6); --_muted: var(--sp-muted, #9aa0a6);
      --_line: var(--sp-line, #3a3f47); --_box: var(--sp-box, #1f232a);
      --_main: var(--sp-main, #ff8a4c); --_main-soft: var(--sp-main-soft, #3a2418);
      --_raster: var(--sp-raster, #5aa9f0); --_raster-soft: var(--sp-raster-soft, #15283d);
      --_screen: var(--sp-screen, #69db7c); --_bad: var(--sp-bad, #ff6b6b);
    }
  }
  :host([theme="dark"]) {
    --_bg: var(--sp-bg, #16181d); --_fg: var(--sp-fg, #e6e6e6); --_muted: var(--sp-muted, #9aa0a6);
    --_line: var(--sp-line, #3a3f47); --_box: var(--sp-box, #1f232a);
    --_main: var(--sp-main, #ff8a4c); --_main-soft: var(--sp-main-soft, #3a2418);
    --_raster: var(--sp-raster, #5aa9f0); --_raster-soft: var(--sp-raster-soft, #15283d);
    --_screen: var(--sp-screen, #69db7c); --_bad: var(--sp-bad, #ff6b6b);
  }
  :host(:focus) { outline: none; }
  :host(:focus-visible) { outline: 2px solid var(--_raster); outline-offset: 3px; }
  * { box-sizing: border-box; }
  code { font-family: var(--sp-mono, ui-monospace, "SF Mono", Menlo, monospace); font-size: .9em;
         background: color-mix(in srgb, var(--_fg) 8%, transparent); padding: .05em .35em; border-radius: 4px; }

  svg { display: block; width: 100%; height: auto; overflow: visible; user-select: none; -webkit-user-select: none; }
  svg text { fill: var(--_fg); font-family: inherit; }
  .lane { fill: transparent; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .lane.main { stroke: var(--_main); fill: color-mix(in srgb, var(--_main) 4%, transparent); }
  .lane.raster { stroke: var(--_raster); fill: color-mix(in srgb, var(--_raster) 4%, transparent); }
  .lane-label { font-size: 12px; font-weight: 700; letter-spacing: .08em; }
  .lane-label.main { fill: var(--_main); } .lane-label.raster { fill: var(--_raster); letter-spacing: .02em; }
  .lbl { font-size: 12px; fill: var(--_muted); }

  .node { cursor: pointer; transition: opacity .35s; }
  .node .box { fill: var(--_box); stroke-width: 1.6; transition: stroke-width .25s, fill .25s; }
  .node.main .box { stroke: var(--_main); fill: var(--_main-soft); }
  .node.raster .box { stroke: var(--_raster); fill: var(--_raster-soft); }
  .node.screen .box { stroke: var(--_screen); fill: color-mix(in srgb, var(--_screen) 12%, var(--_box)); }
  .node .title { font-size: 15px; font-weight: 700; }
  .node .title.mono { font-family: var(--sp-mono, ui-monospace, "SF Mono", Menlo, monospace); font-size: 12.5px; }
  .node .sub { font-size: 12px; fill: var(--_muted); }
  .node.hot .box { stroke-width: 3.5; }
  .node.dim { opacity: .28; }
  .node:hover .box { stroke-width: 3; }
  .qdot { fill: var(--_bad); opacity: 0; transition: opacity .2s; }
  .qdot.on { opacity: 1; }

  .arrow { transition: opacity .35s; }
  .arrow path { fill: none; stroke: var(--_line); stroke-width: 2.2; }
  .arrow polygon { fill: var(--_line); }
  .arrow.dim { opacity: .3; }
  .arrow.flow path { stroke: var(--_fg); stroke-dasharray: 6 5; animation: flow .5s linear infinite; }
  .arrow.flow polygon { fill: var(--_fg); }
  .frozen .arrow path { stroke: var(--_bad); stroke-dasharray: 6 5; animation: flow .35s linear infinite; }
  .frozen .arrow polygon { fill: var(--_bad); }
  @keyframes flow { to { stroke-dashoffset: -11; } }

  .pulse .node[data-id="owc"] .box { animation: pulse .5s ease-in-out infinite; }
  @keyframes pulse { 50% { stroke-width: 6; stroke-opacity: .55; } }

  .badge rect { fill: var(--_bad); }
  .badge text { fill: #fff; font-size: 12px; font-weight: 600; }
  .badges { transition: opacity .3s; }

  .freeze-overlay { opacity: 0; transition: opacity .12s; pointer-events: none; }
  .freeze-overlay rect { fill: var(--_bad); fill-opacity: .12; stroke: var(--_bad); stroke-width: 2.5; }
  .freeze-overlay text { fill: var(--_bad); font-size: 13px; font-weight: 800; letter-spacing: .06em; }
  .frozen .freeze-overlay { opacity: 1; }
  .frozen .node.screen .box { stroke: var(--_bad); fill: color-mix(in srgb, var(--_bad) 14%, var(--_box)); }
  .frozen [data-screen-sub] { fill: var(--_bad); font-weight: 700; }

  .scrollwin { opacity: 0; transition: opacity .35s; pointer-events: none; }
  .scrollwin.on { opacity: 1; }
  .scrollwin .frame { fill: transparent; stroke: var(--_line); stroke-dasharray: 5 4; }
  .scrollwin .page { fill: color-mix(in srgb, var(--_fg) 10%, transparent); }
  .scrollwin .band { fill: color-mix(in srgb, var(--_screen) 45%, transparent); stroke: var(--_screen); }
  .scrollwin .vp { fill: transparent; stroke: var(--_fg); stroke-width: 2.5; }
  .scrollwin .t { font-size: 12px; fill: var(--_muted); }
  .scrollwin .status { font-size: 12px; font-weight: 700; fill: var(--_bad); opacity: 0; }
  .frozen .scrollwin .status { opacity: 1; }
  .frozen .scrollwin .band { fill: color-mix(in srgb, var(--_bad) 35%, transparent); stroke: var(--_bad); }

  .tl-title { font-size: 13px; font-weight: 700; }
  .tl-note { font-size: 11.5px; fill: var(--_muted); }
  .tl-note.strong { fill: var(--_fg); font-weight: 600; }
  .tl-note.bad { fill: var(--_bad); font-weight: 600; }
  .tl-row { font-size: 12px; fill: var(--_muted); }
  .tl-empty { font-size: 15px; fill: var(--_muted); }
  .tl-arrow { font-size: 20px; fill: var(--_muted); }
  .lane-bg { fill: color-mix(in srgb, var(--_fg) 5%, transparent); }
  .blk { transition: opacity .3s; }
  .blk.m { fill: var(--_main); } .blk.r { fill: var(--_raster); }
  .blk.k-freeze { fill: var(--_bad); }
  .blk.dim, .blk-label.dim { opacity: .25; }
  .blk.hot { stroke: var(--_fg); stroke-width: 2; }
  .blk-label { font-size: 12px; font-weight: 600; fill: #fff !important; }
  .tick { fill: var(--_fg); } .tick.wait { fill: var(--_bad); }
  .waitline { stroke: var(--_bad); stroke-width: 1.5; stroke-dasharray: 3 3; } .waithead { fill: var(--_bad); }
  .axis { stroke: var(--_line); }
  .budget { fill: var(--_screen); }
  .finger { fill: var(--_raster); } .pagebar { fill: var(--_main); }

  .cap { min-height: 5.2em; margin-top: 6px; }
  .cap h3 { margin: 0 0 .15em; font-size: 1.05em; line-height: 1.3; }
  .cap h3 .n { color: var(--_muted); font-weight: 600; margin-right: .4em; font-variant-numeric: tabular-nums; }
  .cap p { margin: 0; color: var(--_fg); }

  .bar { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .bar button {
    font: inherit; font-size: 14px; line-height: 1; min-width: 36px; height: 32px; padding: 0 10px;
    border: 1px solid var(--_line); border-radius: 8px; background: var(--_box); color: var(--_fg); cursor: pointer;
  }
  .bar button:hover { border-color: var(--_fg); }
  .bar button:disabled { opacity: .4; cursor: default; }
  .dots { display: flex; gap: 5px; margin-left: 6px; flex-wrap: wrap; }
  .dots button { min-width: 0; width: 11px; height: 11px; padding: 0; border-radius: 50%;
                 background: var(--_line); border: none; }
  .dots button[aria-current="step"] { background: var(--_main); transform: scale(1.25); }
  .hint { margin-left: auto; font-size: 12px; color: var(--_muted); }
  kbd { font: 11px var(--sp-mono, ui-monospace, Menlo, monospace); border: 1px solid var(--_line);
        border-bottom-width: 2px; border-radius: 4px; padding: 0 4px; }
  :host([controls="none"]) .bar { display: none; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  @media (max-width: 560px) { .hint { display: none; } .cap { min-height: 7em; } }
  @media (prefers-reduced-motion: reduce) {
    .arrow.flow path, .frozen .arrow path, .pulse .node[data-id="owc"] .box { animation: none; }
    * { transition: none !important; }
  }`;

  // ---------------------------------------------------------------- element
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  class ScrollPipeline extends HTMLElement {
    static observedAttributes = ['step'];
    #i = 0; #ready = false; #timer = null; #raf = 0; #sw = null;
    keyboard = true;

    get step() { return this.#i; }
    get length() { return STEPS.length; }

    connectedCallback() {
      if (!this.#ready) this.#build();
      this.#ready = true;
      this.go(parseInt(this.getAttribute('step') || '0', 10) || 0, true);
    }
    disconnectedCallback() { this.pause(); cancelAnimationFrame(this.#raf); this.#raf = 0; }
    attributeChangedCallback(name, _o, v) { if (this.#ready && name === 'step') this.go(parseInt(v, 10) || 0); }

    #build() {
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
      this.setAttribute('role', 'group');
      this.setAttribute('aria-roledescription', 'interactive diagram');
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Slow scroll pipeline walkthrough. Use left and right arrow keys to step.');

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style>
      <svg viewBox="0 0 960 580" role="img" aria-hidden="true">
        <rect class="lane main" x="20" y="10" width="800" height="195" rx="12"/>
        <text class="lane-label main" x="34" y="32">MAIN THREAD</text>
        <rect class="lane raster" x="140" y="230" width="440" height="145" rx="12"/>
        <text class="lane-label raster" x="568" y="252" text-anchor="end">browser.raster.queue</text>
        <text class="lbl" x="219" y="252">CommitData · 10 arguments</text>
        <g class="freeze-overlay">
          <rect x="20" y="10" width="800" height="195" rx="12"/>
          <text x="806" y="32" text-anchor="end">MAIN THREAD FROZEN ~470 MS</text>
        </g>
        ${Object.entries(ARROWS).map(([id, p]) => arrowSvg(id, p)).join('')}
        ${NODES.map(nodeSvg).join('')}
        <g class="scrollwin">
          <rect class="frame" x="610" y="230" width="330" height="145" rx="12"/>
          <text class="t" x="624" y="252" style="font-weight:700;fill:var(--_fg)">Page vs painted area</text>
          <text class="t" x="624" y="272">green = 2,400 px already painted</text>
          <rect class="page" x="625" y="300" width="300" height="26" rx="4"/>
          <rect class="band" x="625" y="300" width="90" height="26"/>
          <rect class="vp" x="650" y="292" width="22" height="42" rx="3"/>
          <text class="t" x="625" y="350">top of page</text>
          <text class="t" x="925" y="350" text-anchor="end">bottom</text>
          <text class="status" x="775" y="368" text-anchor="middle">left the area → lay out + paint everything</text>
        </g>
        <g class="badges"></g>
        <g class="tl"></g>
      </svg>
      <div class="cap"><h3><span class="n"></span><span class="t"></span></h3><p></p></div>
      <div class="sr" aria-live="polite"></div>
      <div class="bar">
        <button type="button" data-act="prev" aria-label="Previous step" tabindex="-1">←</button>
        <button type="button" data-act="play" aria-label="Play" tabindex="-1">▶</button>
        <button type="button" data-act="next" aria-label="Next step" tabindex="-1">→</button>
        <div class="dots">${STEPS.map((s, i) => `<button type="button" data-go="${i}" tabindex="-1" aria-label="Step ${i + 1}: ${esc(s.title)}"></button>`).join('')}</div>
        <span class="hint"><kbd>←</kbd> <kbd>→</kbd> step · <kbd>P</kbd> play</span>
      </div>`;

      const $ = (sel) => root.querySelector(sel);
      this.$ = {
        svg: $('svg'), badges: $('.badges'), tl: $('.tl'), n: $('.cap .n'), t: $('.cap .t'), p: $('.cap p'),
        live: $('.sr'), play: $('[data-act=play]'), prev: $('[data-act=prev]'), next: $('[data-act=next]'),
        dots: [...root.querySelectorAll('.dots button')],
        nodes: [...root.querySelectorAll('.node')], arrows: [...root.querySelectorAll('.arrow')],
        qdots: [...root.querySelectorAll('.qdot')], sw: $('.scrollwin'),
        band: $('.scrollwin .band'), vp: $('.scrollwin .vp'), screenSub: $('[data-screen-sub]'),
      };

      // keep focus on the host so keys keep working after clicking a button
      root.addEventListener('mousedown', (e) => {
        if (e.target.closest('button,.node')) e.preventDefault();
        if (this.keyboard) this.focus({ preventScroll: true });
      });
      root.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b?.dataset.act === 'prev') { this.pause(); this.prev(); }
        else if (b?.dataset.act === 'next') { this.pause(); this.next(); }
        else if (b?.dataset.act === 'play') this.toggle();
        else if (b?.dataset.go) { this.pause(); this.go(+b.dataset.go); }
        else {
          const n = e.target.closest('.node');
          if (n) { this.pause(); this.go(+n.dataset.step); }
        }
      });
      this.addEventListener('keydown', (e) => {
        if (!this.keyboard || e.altKey || e.ctrlKey || e.metaKey) return;
        const k = e.key;
        let handled = true;
        if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { this.pause(); this.next(); }
        else if (k === 'ArrowLeft' || k === 'PageUp') { this.pause(); this.prev(); }
        else if (k === 'Home') { this.pause(); this.go(0); }
        else if (k === 'End') { this.pause(); this.go(STEPS.length - 1); }
        else if (k === 'p' || k === 'P') this.toggle();
        else handled = false;
        if (handled) { e.preventDefault(); e.stopPropagation(); }
      });
    }

    next() { this.go(this.#i + 1); }
    prev() { this.go(this.#i - 1); }

    go(n, silent = false) {
      n = Math.max(0, Math.min(STEPS.length - 1, n));
      const changed = n !== this.#i;
      this.#i = n;
      if (this.#ready) this.#render();
      if (changed && !silent) this.dispatchEvent(new CustomEvent('stepchange', { detail: { step: n }, bubbles: true }));
    }

    play() {
      if (this.#timer) return;
      if (this.#i === STEPS.length - 1) this.go(0);
      this.#timer = setInterval(() => (this.#i >= STEPS.length - 1 ? this.pause() : this.next()), 5000);
      this.$.play.textContent = '❚❚'; this.$.play.setAttribute('aria-label', 'Pause');
    }
    pause() {
      clearInterval(this.#timer); this.#timer = null;
      if (this.$) { this.$.play.textContent = '▶'; this.$.play.setAttribute('aria-label', 'Play'); }
    }
    toggle() { this.#timer ? this.pause() : this.play(); }

    #render() {
      const s = STEPS[this.#i], $ = this.$;
      const act = s.active ? new Set(s.active) : null;
      $.nodes.forEach((g) => {
        const id = g.dataset.id;
        g.classList.toggle('hot', !!act && act.has(id));
        g.classList.toggle('dim', !!act && !act.has(id));
      });
      const flows = new Set(s.flows);
      $.arrows.forEach((g) => {
        const id = g.dataset.id;
        g.classList.toggle('flow', flows.has(id));
        g.classList.toggle('dim', !!act && !flows.has(id) && !s.freeze);
      });
      $.svg.classList.toggle('pulse', !!s.pulse);
      $.badges.innerHTML = Object.entries(s.badges).map(([id, t]) => badgeSvg(id, t)).join('');
      $.tl.innerHTML = timelineSvg(s.tl);
      this.#setQueue(s.queue);
      $.n.textContent = `${this.#i + 1}/${STEPS.length}`;
      $.t.textContent = s.title;
      $.p.innerHTML = s.html;
      $.live.textContent = `Step ${this.#i + 1} of ${STEPS.length}: ${s.title}. ${$.p.textContent}`;
      $.prev.disabled = this.#i === 0;
      $.next.disabled = this.#i === STEPS.length - 1;
      $.dots.forEach((d, i) => d.setAttribute('aria-current', i === this.#i ? 'step' : 'false'));
      $.sw.classList.toggle('on', !!s.freeze);
      this.#setFrozen(false);
      $.screenSub.textContent = '';
      if (s.freeze) this.#startScroll(); else this.#stopScroll();
    }

    #setQueue(n) { this.$.qdots.forEach((d, i) => d.classList.toggle('on', i < n)); }
    #setFrozen(on) {
      this.$.svg.classList.toggle('frozen', on);
      this.$.screenSub.textContent = on ? 'frozen' : (STEPS[this.#i].freeze ? 'scrolling' : '');
      const sb = this.$.badges.querySelector('.badge-screen');
      if (on && !sb) this.$.badges.insertAdjacentHTML('beforeend', badgeSvg('screen', 'frozen ~470 ms').replace('class="badge"', 'class="badge badge-screen"'));
      if (!on && sb) sb.remove();
    }

    // --- the little "page vs painted area" animation (steps with freeze: true)
    #startScroll() {
      const X = 625, PAGE = 300, BAND = 90, VP = 22;
      if (reduceMotion()) {
        this.#drawScroll(X + 60, X + 60 + BAND / 2 - VP + 6, BAND);
        this.#setFrozen(true); this.#setQueue(8);
        return;
      }
      if (this.#raf) return;
      this.#sw = { pos: 20, center: 20 + VP / 2, phase: 'scroll', t: 0, last: performance.now() };
      const tick = (now) => {
        const st = this.#sw; const dt = Math.min(64, now - st.last); st.last = now;
        if (st.phase === 'scroll') {
          st.pos += 0.06 * dt;
          if (st.pos + VP > st.center + BAND / 2) { st.phase = 'freeze'; st.t = 0; this.#setFrozen(true); }
          if (st.pos > PAGE - VP) { st.pos = 0; st.center = VP / 2; }
          this.#setQueue(1);
        } else {
          st.t += dt;
          this.#setQueue(Math.min(8, 1 + Math.floor(st.t / 55)));
          if (st.t >= 470) { st.phase = 'scroll'; st.center = st.pos + VP / 2; this.#setFrozen(false); }
        }
        this.#drawScroll(X + st.center - BAND / 2, X + st.pos, BAND);
        this.#raf = requestAnimationFrame(tick);
      };
      this.#raf = requestAnimationFrame(tick);
    }
    #drawScroll(bandX, vpX, band) {
      const X = 625, END = 925;
      const bx = Math.max(X, bandX), bw = Math.max(0, Math.min(END, bandX + band) - bx);
      this.$.band.setAttribute('x', bx); this.$.band.setAttribute('width', bw);
      this.$.vp.setAttribute('x', vpX - 0);
    }
    #stopScroll() { cancelAnimationFrame(this.#raf); this.#raf = 0; }

    // --- Reveal.js integration: follow fragments placed inside the element
    static bindReveal(deck) {
      const sync = () => {
        const slide = deck.getCurrentSlide?.();
        if (!slide) return;
        slide.querySelectorAll('bad-scroll-pipeline').forEach((el) => {
          el.keyboard = false;
          el.go(el.querySelectorAll('.fragment.visible').length);
        });
      };
      ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden'].forEach((ev) => deck.on(ev, sync));
      if (deck.isReady?.()) sync();
    }
  }

  customElements.define('bad-scroll-pipeline', ScrollPipeline);
  window.ScrollPipeline = ScrollPipeline;
})();

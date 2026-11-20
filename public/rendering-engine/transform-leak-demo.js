const VIEW = 220;
const DOC_H = 420;
const SCROLL = 50;
const MAX_SCROLL = DOC_H - VIEW;
const BAR_H = (VIEW * VIEW) / DOC_H;
const barTop = (scroll) => (scroll / DOC_H) * VIEW;

const BLOCKS = {
  h1: { y: 10, h: 50, label: "My Blog", lines: 0, color: "var(--tld-b1)", line: 2 },
  p1: { y: 80, h: 140, label: "First paragraph", lines: 7, color: "var(--tld-b3)", line: 3 },
  p2: { y: 240, h: 160, label: "Second paragraph", lines: 8, color: "var(--tld-b2)", line: 4 },
};

const HTML_LINES = [
  "<html>",
  "  <body>",
  "    <h1>My Blog</h1>",
  "    <p>First paragraph</p>",
  "    <p>Second paragraph</p>",
  "  </body>",
  "</html>",
];

const LOOP = [
  "r.saveState()",
  "r.translateBy(x: 0, y: -scroll)",
  "for item in drawList {",
  "    item.execute(renderer: r)",
  "}",
  "r.restoreState()",
  "drawScrollbar(scroll: scroll)",
];

const TRANSFORM = {
  buggy: [
    "if let t = translation {",
    "    renderer.saveState()",
    "    renderer.translateBy(x: t.x, y: t.y)",
    "}",
    "for child in children {",
    "    child.execute(renderer: renderer)",
    "}",
    "renderer.restoreState()",
  ],
  fixed: [
    "renderer.saveState()",
    "if let t = translation {",
    "    renderer.translateBy(x: t.x, y: t.y)",
    "}",
    "for child in children {",
    "    child.execute(renderer: renderer)",
    "}",
    "renderer.restoreState()",
  ],
};

const GUTTER = {
  buggy: { 1: { mark: "!", cls: "warn" }, 7: { mark: "!", cls: "warn" } },
  fixed: { 0: { mark: "+", cls: "add" } },
};

const VERSION_LABEL = { buggy: "Before fix", fixed: "After fix" };

const QUIZ = [
  {
    label: "Nothing happens",
    feedback: (top) =>
      `Not quite. <code>restoreState()</code> only does nothing when the list is <b>empty</b>. Here ${esc(top.owner)}'s ${top.value}px is still on top.`,
  },
  {
    label: "It puts back the newest saved shift",
    correct: true,
    feedback: (top) =>
      `Yes! It puts back the newest one, no matter who wrote it down: <b>${esc(top.owner)}'s ${top.value}px</b>. Press → to see what that does.`,
  },
  {
    label: "The app crashes",
    feedback: () => "No crash. Core Graphics doesn't complain, which is why this bug was so quiet.",
  },
];

function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const tag = (name) => `<code>&lt;${name}&gt;</code>`;

function buildSteps(mode) {
  const fixed = mode === "fixed";
  const s = { shift: 0, saved: [], drawn: { h1: null, p1: null, p2: null }, count: { saves: 0, restores: 0, ignored: 0 } };
  const steps = [];

  const snap = (extra) => {
    steps.push({
      shift: s.shift,
      saved: s.saved.map((x) => ({ ...x })),
      drawn: { ...s.drawn },
      count: { ...s.count },
      focus: ["nums"],
      trail: ["Loop"],
      html: [],
      code: [],
      events: [],
      bar: false,
      ...extra,
    });
  };

  const enter = (owner) => {
    if (fixed) {
      s.saved.push({ owner, value: s.shift });
      s.count.saves += 1;
      return { type: "push", text: `${owner}: saveState() wrote down ${s.shift}px` };
    }
    return { type: "skip", text: `${owner}: no CSS transform, so no saveState()` };
  };

  const leave = (owner) => {
    s.count.restores += 1;
    if (s.saved.length === 0) {
      s.count.ignored += 1;
      return { type: "empty", text: `${owner}: restoreState() found the list empty, ignored` };
    }
    const entry = s.saved.pop();
    s.shift = entry.value;
    const own = entry.owner === owner;
    return {
      type: own ? "own" : "wrong",
      text: own
        ? `${owner}: restoreState() put back its own ${entry.value}px ✓`
        : `${owner}: restoreState() put back ${entry.owner}'s ${entry.value}px ✗`,
      entry: { ...entry, by: owner, ok: own },
    };
  };

  const draw = (key) => {
    s.drawn[key] = s.shift === SCROLL;
  };

  const call = { list: "loop", line: 3, call: true };
  const enterCode = fixed
    ? [call, { list: "transform", line: 0 }]
    : [call, { list: "transform", line: 0 }, { list: "transform", line: 1, skip: true }];
  const drawCode = [call, { list: "transform", line: 4 }, { list: "transform", line: 5 }];
  const leaveCode = [call, { list: "transform", line: 7 }];

  snap({
    heading: "Goal",
    text: `The user scrolled this page down <b>${SCROLL}px</b>. So the engine must draw every tag ${SCROLL}px higher than its place on the page. Let's watch the engine draw one frame.`,
    focus: ["html", "page"],
    trail: [],
  });

  s.saved.push({ owner: "Loop", value: 0 });
  s.count.saves += 1;
  snap({
    heading: "Loop writes down the shift",
    text: "Before drawing anything, the loop calls <code>saveState()</code>. It writes down the current shift, <b>0px</b>, so it can put it back when the frame is done.",
    code: [{ list: "loop", line: 0 }],
    focus: ["code", "nums"],
    events: [{ type: "push", text: "Loop: saveState() wrote down 0px" }],
  });

  s.shift = SCROLL;
  snap({
    heading: "Loop sets the shift",
    text: `<code>translateBy</code> sets the shift to <b>${SCROLL}px up</b>. Every tag drawn from now on moves up by this much. This one number is the whole scroll.`,
    code: [{ list: "loop", line: 1 }],
    focus: ["code", "nums"],
  });

  const outer = [enter("<html>"), enter("<body>")];
  snap({
    heading: `Enter ${tag("html")} and ${tag("body")}`,
    text: fixed
      ? `Each tag is drawn by its own <code>Transform</code>. ${tag("html")} and ${tag("body")} have no CSS transform, but the fixed code calls <code>saveState()</code> first anyway. Each writes down ${SCROLL}px.`
      : `Each tag is drawn by its own <code>Transform</code>. ${tag("html")} and ${tag("body")} have no CSS transform, so <code>if let t = translation</code> is false and <code>saveState()</code> is <b>skipped</b>. Nothing is written down.`,
    html: [0, 1],
    code: enterCode,
    focus: ["html", "code", "nums"],
    trail: ["Loop", "<html>", "<body>"],
    events: outer,
  });

  const h1In = enter("<h1>");
  snap({
    heading: `Enter ${tag("h1")}`,
    text: fixed
      ? `Same for ${tag("h1")}: <code>saveState()</code> writes down ${SCROLL}px.`
      : `Same for ${tag("h1")}: no CSS transform, so no <code>saveState()</code>. The only number written down is still the loop's 0px.`,
    html: [2],
    code: enterCode,
    focus: ["html", "code", "nums"],
    trail: ["Loop", "<html>", "<body>", "<h1>"],
    events: [h1In],
  });

  draw("h1");
  snap({
    heading: `Draw ${tag("h1")}`,
    text: `The <code>for</code> loop draws the heading. The shift is ${SCROLL}px, so “My Blog” lands in the right place ✓`,
    html: [2],
    code: drawCode,
    focus: ["html", "page"],
    trail: ["Loop", "<html>", "<body>", "<h1>"],
    fresh: "h1",
  });

  const top = s.saved[s.saved.length - 1];
  snap({
    heading: "Your turn: what happens next?",
    text: `${tag("h1")} is done, so its <code>Transform</code> calls <code>restoreState()</code>. Look at the saved shifts, then pick an answer (keys 1, 2, 3).`,
    html: [2],
    code: leaveCode,
    focus: ["nums", "code"],
    trail: ["Loop", "<html>", "<body>", "<h1>"],
    quiz: { owner: top.owner, value: top.value },
  });

  const h1Out = leave("<h1>");
  snap({
    heading: `Leave ${tag("h1")}`,
    text: fixed
      ? `<code>restoreState()</code> puts back the newest saved shift, which is ${tag("h1")}'s own ${SCROLL}px. The shift stays ${SCROLL}px, just as before ${tag("h1")}.`
      : `<code>restoreState()</code> doesn't check who wrote the number down. It puts back the newest one: <b>Loop's 0px</b>. The shift is now 0px. The scroll is gone, and we are still inside ${tag("body")}.`,
    html: [2],
    code: leaveCode,
    focus: ["nums"],
    trail: ["Loop", "<html>", "<body>", "<h1>"],
    events: [h1Out],
  });

  const p1In = enter("first <p>");
  draw("p1");
  snap({
    heading: `Enter and draw the first ${tag("p")}`,
    text: fixed
      ? `<code>saveState()</code> writes down ${SCROLL}px, then the paragraph is drawn with a ${SCROLL}px shift ✓`
      : `No <code>saveState()</code> again. The paragraph is drawn with a <b>0px</b> shift, so it lands ${SCROLL}px too low ✗. The dashed box shows where it should be.`,
    html: [3],
    code: [...enterCode, ...drawCode.slice(1)],
    focus: ["html", "nums", "page"],
    trail: ["Loop", "<html>", "<body>", "first <p>"],
    events: [p1In],
    fresh: "p1",
  });

  const p1Out = leave("first <p>");
  snap({
    heading: `Leave the first ${tag("p")}`,
    text: fixed
      ? `<code>restoreState()</code> puts back its own ${SCROLL}px.`
      : "<code>restoreState()</code> finds the list empty, so this time it really does nothing. The shift stays 0px.",
    html: [3],
    code: leaveCode,
    focus: ["nums"],
    trail: ["Loop", "<html>", "<body>", "first <p>"],
    events: [p1Out],
  });

  const p2In = enter("second <p>");
  draw("p2");
  const p2Out = leave("second <p>");
  snap({
    heading: `The second ${tag("p")}`,
    text: fixed
      ? `Same story: write down ${SCROLL}px, draw with a ${SCROLL}px shift ✓, put back its own ${SCROLL}px.`
      : `Same story: nothing written down, drawn with a 0px shift (${SCROLL}px too low ✗), restore ignored.`,
    html: [4],
    code: [...enterCode, ...drawCode.slice(1), leaveCode[1]],
    focus: ["html", "nums", "page"],
    trail: ["Loop", "<html>", "<body>", "second <p>"],
    events: [p2In, p2Out],
    fresh: "p2",
  });

  const outerOut = [leave("<body>"), leave("<html>")];
  snap({
    heading: `Leave ${tag("body")} and ${tag("html")}`,
    text: fixed
      ? `Each puts back its own ${SCROLL}px.`
      : "Both <code>restoreState()</code> calls find the list empty and are ignored.",
    html: [5, 6],
    code: leaveCode,
    focus: ["html", "nums"],
    trail: ["Loop", "<html>", "<body>"],
    events: outerOut,
  });

  const loopOut = leave("Loop");
  snap({
    heading: "Loop puts its shift back",
    text: fixed
      ? `The loop puts back its own 0px. Every <code>saveState()</code> had its own <code>restoreState()</code>: ${s.count.saves} and ${s.count.restores}.`
      : `The loop wants its 0px back, but ${tag("h1")} already took it, so this is ignored too. ${s.count.saves} <code>saveState()</code>, ${s.count.restores} <code>restoreState()</code>: ${s.count.ignored} had nothing to put back.`,
    code: [{ list: "loop", line: 5 }],
    focus: ["code", "nums"],
    events: [loopOut],
  });

  snap({
    heading: "Draw the scrollbar",
    text: "The scrollbar is drawn after the loop. It works out its spot from the scroll <b>number</b>, not from the shift, so it looks right even in the broken version. That's why this bug was easy to miss.",
    code: [{ list: "loop", line: 6 }],
    focus: ["code", "page"],
    bar: true,
    formula: true,
  });

  snap({
    heading: "Result: scroll the page",
    text: fixed
      ? "Both windows match: every tag moves with the scroll."
      : `${tag("h1")} and the scrollbar move, but both paragraphs stay frozen. They are always drawn after ${tag("h1")} took the loop's 0px.`,
    focus: ["html", "page"],
    trail: [],
    bar: true,
    result: true,
  });

  return steps;
}

function highlightSwift(line) {
  return esc(line)
    .replace(/\b(if|let|for|in)\b/g, '<span class="kw">$1</span>')
    .replace(/\b(saveState|restoreState|translateBy)\b/g, '<span class="fn">$1</span>');
}

function highlightHTML(line) {
  return esc(line).replace(/(&lt;\/?\w+&gt;)/g, '<span class="tag">$1</span>');
}

function boxSVG(block, shift, fresh) {
  const y = block.y - shift;
  let rows = "";
  for (let i = 0; i < block.lines; i += 1) {
    const w = i % 4 === 3 ? 90 : 160 - ((i * 23) % 30);
    rows += `<rect x="20" y="${34 + i * 15}" width="${w}" height="5" rx="2.5" fill="#fff" opacity="0.45"/>`;
  }
  const textY = block.lines === 0 ? block.h / 2 + 6 : 22;
  return `<g class="${fresh ? "fresh" : ""}" transform="translate(0 ${y})">
    <rect x="10" y="0" width="190" height="${block.h}" rx="5" fill="${block.color}"/>
    <text x="20" y="${textY}" fill="#fff" font-size="${block.lines === 0 ? 17 : 12}" font-weight="700">${block.label}</text>${rows}</g>`;
}

function ghostSVG(block, scroll) {
  const y = block.y - scroll;
  return `<rect class="ghost" x="10" y="${y}" width="190" height="${block.h}" rx="5"/>
    <rect x="112" y="${y - 9}" width="88" height="18" rx="9" fill="var(--tld-bad)"/>
    <text x="156" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">should be here</text>`;
}

function pageSVG(o) {
  const parts = [`<rect width="${VIEW}" height="${VIEW}" fill="var(--tld-page)"/>`];
  for (const key of ["h1", "p1", "p2"]) {
    if (o.shifts[key] === null) continue;
    parts.push(boxSVG(BLOCKS[key], o.shifts[key], o.fresh === key));
  }
  for (const key of o.ghosts) parts.push(ghostSVG(BLOCKS[key], SCROLL));
  if (o.bar !== null) {
    parts.push(`<rect x="208" y="2" width="7" height="${VIEW - 4}" rx="3.5" fill="var(--tld-border)" opacity="0.5"/>
      <rect x="208" y="${barTop(o.bar)}" width="7" height="${BAR_H}" rx="3.5" fill="var(--tld-fg)" opacity="0.55"/>`);
  }
  return `<svg viewBox="0 0 ${VIEW} ${VIEW}" role="img" aria-label="${o.label}">${parts.join("")}</svg>`;
}

const DARK_TOKENS = `
  --tld-bg: #17171a; --tld-fg: #ececf0; --tld-muted: #9a9aa3; --tld-panel: #222227;
  --tld-border: #3a3a42; --tld-accent: #6ea2ff; --tld-accent-fg: #0d0d10;
  --tld-highlight: rgba(110, 162, 255, 0.22); --tld-call: rgba(255, 255, 255, 0.07);
  --tld-ok: #4cc27f; --tld-bad: #ff6b61; --tld-warn: #e6a94a; --tld-kw: #d08bdc;
  --tld-tag: #7cc4d8; --tld-page: #0f0f12;
`;

const STYLE = `
:host {
  --tld-bg: #ffffff; --tld-fg: #1d1d1f; --tld-muted: #6b6b70; --tld-panel: #f5f5f7;
  --tld-border: #d9d9de; --tld-accent: #2f6fd6; --tld-accent-fg: #ffffff;
  --tld-highlight: rgba(47, 111, 214, 0.16); --tld-call: rgba(107, 107, 112, 0.12);
  --tld-ok: #1f8a4c; --tld-bad: #d0342c; --tld-warn: #a86a12; --tld-kw: #a626a4;
  --tld-tag: #1f6f8b; --tld-page: #ffffff;
  --tld-b1: #4a7fb5; --tld-b2: #b5862c; --tld-b3: #4f8f70;
  --tld-font: system-ui, -apple-system, "Segoe UI", sans-serif;
  --tld-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --tld-font-size: 15px;
  display: block; font-family: var(--tld-font); font-size: var(--tld-font-size);
  line-height: 1.45; letter-spacing: normal; text-transform: none; text-align: left;
  color: var(--tld-fg); container-type: inline-size; outline: none;
}
@media (prefers-color-scheme: dark) { :host(:not([theme="light"])) { ${DARK_TOKENS} } }
:host([theme="dark"]) { ${DARK_TOKENS} }
* { box-sizing: border-box; }
.wrap { background: var(--tld-bg); border: 1px solid var(--tld-border); border-radius: 12px; padding: 12px; }
:host(:focus-visible) .wrap { box-shadow: 0 0 0 3px var(--tld-highlight); border-color: var(--tld-accent); }
.top { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.title { font-weight: 700; font-size: 1.05em; }
button {
  font: inherit; font-size: 0.85em; line-height: 1.3; color: var(--tld-fg); background: var(--tld-panel);
  border: 1px solid var(--tld-border); border-radius: 8px; padding: 5px 11px; margin: 0; cursor: pointer;
  text-transform: none; letter-spacing: normal;
}
button:hover { border-color: var(--tld-accent); }
button:focus-visible { outline: 2px solid var(--tld-accent); outline-offset: 2px; }
.seg { display: inline-flex; border: 1px solid var(--tld-border); border-radius: 8px; overflow: hidden; }
.seg button { border: 0; border-radius: 0; }
.seg button + button { border-left: 1px solid var(--tld-border); }
.seg button[aria-pressed="true"] { background: var(--tld-accent); color: var(--tld-accent-fg); }
.grid {
  display: grid; gap: 10px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 1fr);
  grid-template-areas: "html code page" "nums code page";
  align-items: start;
}
[data-panel="html"] { grid-area: html; }
[data-panel="code"] { grid-area: code; }
[data-panel="nums"] { grid-area: nums; }
[data-panel="page"] { grid-area: page; }
@container (min-width: 900px) {
  .grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: "html code nums page"; }
  .grid pre { font-size: min(0.7em, 1.06cqi); }
}
.grid.result { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); grid-template-areas: "html page"; }
.grid.result [data-panel="code"], .grid.result [data-panel="nums"] { display: none; }
@container (max-width: 720px) {
  .grid { grid-template-columns: 1fr 1fr; grid-template-areas: "html page" "nums nums" "code code"; }
}
@container (max-width: 460px) {
  .grid, .grid.result { grid-template-columns: 1fr; grid-template-areas: "html" "page" "nums" "code"; }
}
section {
  background: var(--tld-panel); border: 1.5px solid var(--tld-border); border-radius: 10px; padding: 8px 10px;
  min-width: 0; transition: opacity 0.3s, border-color 0.3s;
}
section.dim { opacity: 0.32; }
section.focus { border-color: var(--tld-accent); }
h3 { margin: 0 0 6px; padding: 0; font-family: var(--tld-font); font-size: 0.7em; line-height: 1.3; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tld-muted); font-weight: 600; text-shadow: none; }
h3.sub { margin-top: 8px; }
.trail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; min-height: 22px; margin-bottom: 6px; font-size: 0.75em; color: var(--tld-muted); }
.chip { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--tld-border); background: var(--tld-bg); color: var(--tld-fg); font-family: var(--tld-mono); font-size: 0.95em; }
.chip.on { border-color: var(--tld-accent); color: var(--tld-accent); font-weight: 600; }
pre { margin: 0; padding: 0; background: none; box-shadow: none; width: auto; font-family: var(--tld-mono); font-size: 0.7em; line-height: 1.45; overflow-x: auto; transition: opacity 0.3s; }
pre.idle { opacity: 0.4; }
.ln { display: block; padding-right: 2px; border-radius: 4px; white-space: pre; }
.ln .g { display: inline-block; width: 1.4em; text-align: center; user-select: none; }
.ln .g.warn { color: var(--tld-warn); font-weight: 700; }
.ln .g.add, .ln .g.ok { color: var(--tld-ok); font-weight: 700; }
.ln .g.bad { color: var(--tld-bad); font-weight: 700; }
.ln.active { background: var(--tld-highlight); box-shadow: inset 3px 0 0 var(--tld-accent); }
.ln.call { background: var(--tld-call); }
.ln.skip { text-decoration: line-through; text-decoration-color: var(--tld-warn); opacity: 0.6; }
.kw { color: var(--tld-kw); }
.fn { color: var(--tld-accent); font-weight: 600; }
.tag { color: var(--tld-tag); font-weight: 600; }
.note { font-size: 0.68em; color: var(--tld-muted); margin: 6px 0 0; }
.shift { border-radius: 10px; padding: 6px 10px; border: 1.5px solid var(--tld-border); background: var(--tld-bg); }
.shift .val { font-weight: 700; font-size: 1.15em; font-family: var(--tld-mono); }
.shift.on .val { color: var(--tld-ok); }
.shift.off .val { color: var(--tld-muted); }
.shift .hint { font-size: 0.72em; color: var(--tld-muted); }
.shift.flash { animation: flash 0.7s ease-out; }
@keyframes flash { 0% { box-shadow: 0 0 0 6px var(--tld-highlight); } 100% { box-shadow: 0 0 0 0 transparent; } }
.saved { display: flex; flex-direction: column; gap: 4px; min-height: 28px; }
.entry { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; flex-wrap: wrap; background: var(--tld-bg); border: 1.5px solid var(--tld-border); border-radius: 8px; padding: 3px 8px; font-size: 0.78em; }
.entry b { font-family: var(--tld-mono); }
.entry span { color: var(--tld-muted); font-size: 0.9em; }
.entry.top { border-color: var(--tld-fg); }
.entry.taken { border-style: dashed; opacity: 0.6; animation: lift 0.6s ease-out; }
.entry.taken.bad { border-color: var(--tld-bad); opacity: 1; }
.entry.taken.bad span { color: var(--tld-bad); font-weight: 600; }
.entry.taken.ok span { color: var(--tld-ok); }
@keyframes lift { from { transform: translateY(14px); opacity: 1; } to { transform: none; } }
.empty { font-size: 0.78em; color: var(--tld-muted); border: 1px dashed var(--tld-border); border-radius: 8px; padding: 5px; text-align: center; }
.events { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.event { font-size: 0.72em; border-radius: 8px; padding: 3px 8px; border: 1px solid var(--tld-border); }
.event.push, .event.own { border-color: var(--tld-ok); color: var(--tld-ok); }
.event.wrong { border: 1.5px solid var(--tld-bad); color: var(--tld-bad); font-weight: 600; }
.event.skip, .event.empty { border-color: var(--tld-warn); color: var(--tld-warn); }
.counter { margin-top: 6px; font-family: var(--tld-mono); font-size: 0.72em; color: var(--tld-muted); }
.pages { display: grid; gap: 8px; }
.pages.two { grid-template-columns: 1fr 1fr; max-width: 520px; margin: 0 auto; }
.pages figure { margin: 0; }
.pages figcaption { font-size: 0.72em; color: var(--tld-muted); margin-bottom: 4px; }
svg { display: block; width: 100%; height: auto; border-radius: 6px; border: 1px solid var(--tld-border); font-family: var(--tld-font); }
svg .fresh { animation: appear 0.5s ease-out; }
@keyframes appear { from { opacity: 0; } to { opacity: 1; } }
svg .ghost { fill: none; stroke: var(--tld-bad); stroke-width: 1.5; stroke-dasharray: 5 4; }
.formula { margin-top: 8px; font-size: 0.76em; background: var(--tld-bg); border: 1px solid var(--tld-border); border-radius: 8px; padding: 6px 8px; }
.footer { margin-top: 8px; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.progress { flex: 1; min-width: 80px; height: 6px; background: var(--tld-panel); border: 1px solid var(--tld-border); border-radius: 999px; overflow: hidden; margin: 0 6px; }
.progress div { height: 100%; background: var(--tld-accent); transition: width 0.3s; }
.stepno { font-family: var(--tld-mono); font-size: 0.8em; color: var(--tld-muted); }
.caption { margin-top: 6px; min-height: 4.4em; }
.caption .h { font-weight: 700; }
.caption p { margin: 2px 0 0; }
.caption code, .formula code, .feedback code { font-family: var(--tld-mono); font-size: 0.9em; }
.quiz { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.quiz button { text-align: left; font-size: 0.9em; }
.quiz button kbd { margin-right: 6px; }
.quiz button.right { border-color: var(--tld-ok); color: var(--tld-ok); font-weight: 600; }
.quiz button.wrong { border-color: var(--tld-bad); color: var(--tld-bad); }
.feedback { margin: 6px 0 0; font-size: 0.9em; }
.keys { margin: 0; font-size: 0.72em; color: var(--tld-muted); flex: 1; text-align: right; }
@container (max-width: 720px) { .keys { display: none; } }
kbd { font-family: var(--tld-mono); font-size: 0.95em; border: 1px solid var(--tld-border); border-bottom-width: 2px; border-radius: 4px; padding: 0 4px; background: var(--tld-panel); color: var(--tld-fg); }
@media (prefers-reduced-motion: reduce) {
  section, pre, .progress div { transition: none; }
  .shift.flash, .entry.taken, svg .fresh { animation: none; }
}
`;

const TEMPLATE = `
<div class="wrap">
  <div class="top">
    <div class="title">Who undid the scroll?</div>
    <p class="keys"><kbd>←</kbd> <kbd>→</kbd> step · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> answer · <kbd>B</kbd> before/after fix · <kbd>P</kbd> play · <kbd>R</kbd> restart</p>
    <div class="seg" role="group" aria-label="Code version">
      <button type="button" data-mode="buggy"></button>
      <button type="button" data-mode="fixed"></button>
    </div>
  </div>
  <div class="grid">
    <section data-panel="html" aria-label="HTML page">
      <h3>The HTML page</h3>
      <pre class="html"></pre>
    </section>
    <section data-panel="code" aria-label="Swift code">
      <div class="trail"></div>
      <h3>Raster loop (Browser.swift)</h3>
      <pre class="loop"></pre>
      <h3 class="sub">Transform.execute (Transform.swift)</h3>
      <pre class="transform"></pre>
      <p class="note">Each tag has its own Transform. Simplified: top inset and type checks left out.</p>
    </section>
    <section data-panel="nums" aria-label="Shift and saved shifts">
      <div class="shift"></div>
      <h3 class="sub">Saved shifts (newest on top)</h3>
      <div class="saved"></div>
      <div class="events"></div>
      <div class="counter"></div>
    </section>
    <section data-panel="page" aria-label="Page">
      <h3>Window (scrolled ${SCROLL}px)</h3>
      <div class="pages"></div>
      <div class="formula" hidden>
        <code>barTop = (scroll ÷ docHeight) × windowHeight</code><br>
        <code>= (${SCROLL} ÷ ${DOC_H}) × ${VIEW} ≈ ${Math.round(barTop(SCROLL))}px</code><br>
        Uses the scroll <b>number</b>, not the shift.
      </div>
    </section>
  </div>
  <div class="footer">
    <div class="controls">
      <button type="button" data-act="first" aria-label="First step">⏮</button>
      <button type="button" data-act="prev" aria-label="Previous step">◀ Prev</button>
      <button type="button" data-act="play" aria-label="Play">▶ Play</button>
      <button type="button" data-act="next" aria-label="Next step">Next ▶</button>
      <div class="progress" aria-hidden="true"><div></div></div>
      <span class="stepno"></span>
    </div>
    <div class="caption" aria-live="polite"></div>
  </div>
</div>
`;

class TransformLeakDemo extends HTMLElement {
  static observedAttributes = ["mode"];

  constructor() {
    super();
    this.mode = "buggy";
    this.index = 0;
    this.steps = buildSteps(this.mode);
    this.answers = { buggy: null, fixed: null };
    this.timer = null;
    this.frame = 0;
    this.prev = { index: -1, mode: null };
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = `<style>${STYLE}</style>${TEMPLATE}`;
    this.$ = (selector) => this.root.querySelector(selector);
    this.bindEvents();
  }

  connectedCallback() {
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", "Step-by-step demo of the Transform restore bug. Use the arrow keys to step.");
    }
    if (!this.hasAttribute("data-prevent-swipe")) this.setAttribute("data-prevent-swipe", "");
    this.render();
  }

  disconnectedCallback() {
    this.stopPlay();
    this.stopResult();
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "mode" && (value === "buggy" || value === "fixed")) this.setMode(value, false);
  }

  bindEvents() {
    this.root.querySelectorAll("[data-mode]").forEach((b) => {
      b.addEventListener("click", () => this.setMode(b.dataset.mode, true));
    });
    const acts = {
      first: () => this.go(0),
      prev: () => this.go(this.index - 1),
      next: () => this.go(this.index + 1),
      play: () => this.togglePlay(),
    };
    this.root.querySelectorAll("[data-act]").forEach((b) => {
      b.addEventListener("click", () => acts[b.dataset.act]());
    });
    this.$(".caption").addEventListener("click", (e) => {
      const choice = e.target.closest("[data-choice]");
      if (choice) this.answer(Number(choice.dataset.choice));
    });
    this.addEventListener("keydown", (e) => this.onKey(e));
  }

  onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.key === "Tab" || e.key === "Escape") return;
    const target = e.composedPath()[0];
    if (target instanceof HTMLButtonElement && (e.key === "Enter" || e.key === " ")) {
      e.stopPropagation();
      return;
    }
    const actions = {
      ArrowRight: () => this.go(this.index + 1),
      ArrowLeft: () => this.go(this.index - 1),
      Home: () => this.go(0),
      End: () => this.go(this.steps.length - 1),
      " ": () => this.togglePlay(),
      p: () => this.togglePlay(),
      b: () => this.setMode(this.mode === "buggy" ? "fixed" : "buggy", true),
      r: () => {
        this.stopPlay();
        this.answers = { buggy: null, fixed: null };
        this.index = 0;
        this.render();
      },
    };
    if (this.steps[this.index].quiz) {
      QUIZ.forEach((_, i) => {
        actions[String(i + 1)] = () => this.answer(i);
      });
    }
    const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    action();
  }

  answer(choice) {
    this.answers[this.mode] = choice;
    this.render();
  }

  setMode(mode, reflect) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.steps = buildSteps(mode);
    this.index = Math.min(this.index, this.steps.length - 1);
    if (reflect && this.getAttribute("mode") !== mode) this.setAttribute("mode", mode);
    if (this.isConnected) this.render();
  }

  go(index) {
    const next = Math.max(0, Math.min(this.steps.length - 1, index));
    if (next === this.index) return;
    this.index = next;
    this.render();
  }

  togglePlay() {
    if (this.timer) {
      this.stopPlay();
      return;
    }
    if (this.index >= this.steps.length - 1) this.index = 0;
    this.timer = setInterval(() => {
      const step = this.steps[this.index];
      if (this.index >= this.steps.length - 1 || (step.quiz && this.answers[this.mode] === null)) {
        this.stopPlay();
        return;
      }
      this.go(this.index + 1);
    }, 3200);
    this.render();
  }

  stopPlay() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    if (this.isConnected) this.render();
  }

  render() {
    const step = this.steps[this.index];
    const forward = this.prev.mode === this.mode && this.prev.index === this.index - 1;

    this.root.querySelectorAll("[data-mode]").forEach((b) => {
      b.textContent = VERSION_LABEL[b.dataset.mode];
      b.setAttribute("aria-pressed", String(b.dataset.mode === this.mode));
    });
    this.$(".grid").classList.toggle("result", Boolean(step.result));
    this.root.querySelectorAll("[data-panel]").forEach((panel) => {
      const on = step.focus.includes(panel.dataset.panel);
      panel.classList.toggle("focus", on);
      panel.classList.toggle("dim", !on);
    });

    this.renderHTML(step);
    this.renderCode(step);
    this.renderNums(step, forward);
    this.renderPage(step, forward);
    this.renderCaption(step);

    const play = this.$('[data-act="play"]');
    play.textContent = this.timer ? "⏸ Pause" : "▶ Play";
    play.setAttribute("aria-label", this.timer ? "Pause" : "Play");
    this.$(".progress div").style.width = `${(this.index / (this.steps.length - 1)) * 100}%`;
    this.$(".stepno").textContent = `${this.index + 1} / ${this.steps.length}`;
    this.prev = { index: this.index, mode: this.mode };
  }

  renderHTML(step) {
    const marks = {};
    for (const key of ["h1", "p1", "p2"]) {
      const placed = step.drawn[key];
      if (placed === null) continue;
      marks[BLOCKS[key].line] = placed ? { mark: "✓", cls: "ok" } : { mark: "✗", cls: "bad" };
    }
    this.$(".html").innerHTML = HTML_LINES.map((line, i) => {
      const cls = step.html.includes(i) ? "active" : "";
      const g = marks[i];
      const mark = g ? `<span class="g ${g.cls}">${g.mark}</span>` : '<span class="g"></span>';
      return `<span class="ln ${cls}">${mark}${highlightHTML(line)}</span>`;
    }).join("");
  }

  renderCode(step) {
    this.$(".trail").innerHTML = step.trail.length
      ? `Inside: ${step.trail.map((r, i) => `<span class="chip ${i === step.trail.length - 1 ? "on" : ""}">${esc(r)}</span>`).join(" › ")}`
      : "";
    const paint = (selector, list, lines, gutter) => {
      const node = this.$(selector);
      node.classList.toggle("idle", !step.code.some((c) => c.list === list));
      node.innerHTML = lines
        .map((line, i) => {
          const hit = step.code.find((c) => c.list === list && c.line === i);
          const cls = hit ? (hit.skip ? "skip" : hit.call ? "call" : "active") : "";
          const g = gutter[i];
          const mark = g ? `<span class="g ${g.cls}">${g.mark}</span>` : '<span class="g"></span>';
          return `<span class="ln ${cls}">${mark}${highlightSwift(line)}</span>`;
        })
        .join("");
    };
    paint(".loop", "loop", LOOP, {});
    paint(".transform", "transform", TRANSFORM[this.mode], GUTTER[this.mode]);
  }

  renderNums(step, forward) {
    const previous = this.steps[this.index - 1];
    const changed = forward && previous && previous.shift !== step.shift;
    const shift = this.$(".shift");
    shift.className = `shift ${step.shift ? "on" : "off"} ${changed ? "flash" : ""}`;
    shift.innerHTML = `<h3>Shift now</h3><div class="val">${step.shift ? `${step.shift}px up` : "0px"}</div>
      <div class="hint">How far everything moves up.</div>`;

    const taken = step.events
      .filter((ev) => ev.entry)
      .map((ev) => {
        const e = ev.entry;
        const note = e.ok ? `put back by ${esc(e.by)} ✓` : `taken by ${esc(e.by)} ✗`;
        return `<div class="entry taken ${e.ok ? "ok" : "bad"}"><b>${e.value}px</b><span>${esc(e.owner)}'s · ${note}</span></div>`;
      })
      .join("");
    const list = [...step.saved]
      .reverse()
      .map((e, i) => `<div class="entry ${i === 0 ? "top" : ""}"><b>${e.value}px</b><span>written by ${esc(e.owner)}</span></div>`)
      .join("");
    const empty = step.saved.length === 0 ? '<div class="empty">empty</div>' : "";
    this.$(".saved").innerHTML = taken + list + empty;
    this.$(".events").innerHTML = step.events.map((ev) => `<div class="event ${ev.type}">${esc(ev.text)}</div>`).join("");
    const c = step.count;
    this.$(".counter").textContent = `saveState × ${c.saves} · restoreState × ${c.restores}${c.ignored ? ` (${c.ignored} ignored)` : ""}`;
  }

  renderPage(step, forward) {
    this.stopResult();
    const pages = this.$(".pages");
    this.$(".formula").hidden = !step.formula;
    if (step.result) {
      pages.classList.add("two");
      const fixed = this.mode === "fixed";
      const draw = (scroll) => {
        const expected = { h1: scroll, p1: scroll, p2: scroll };
        const actual = { h1: scroll, p1: fixed ? scroll : 0, p2: fixed ? scroll : 0 };
        pages.innerHTML = `
          <figure><figcaption>Should look like</figcaption>${pageSVG({ shifts: expected, ghosts: [], bar: scroll, label: "Expected page" })}</figure>
          <figure><figcaption>Engine draws</figcaption>${pageSVG({ shifts: actual, ghosts: [], bar: scroll, label: "Page drawn by the engine" })}</figure>`;
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        draw(SCROLL);
        return;
      }
      const start = performance.now();
      const tick = (t) => {
        draw(Math.round((MAX_SCROLL / 2) * (1 - Math.cos((t - start) / 1800))));
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
      return;
    }
    pages.classList.remove("two");
    const shifts = {};
    const ghosts = [];
    for (const key of ["h1", "p1", "p2"]) {
      const placed = step.drawn[key];
      shifts[key] = placed === null ? null : placed ? SCROLL : 0;
      if (placed === false) ghosts.push(key);
    }
    pages.innerHTML = pageSVG({
      shifts,
      ghosts,
      bar: step.bar ? SCROLL : null,
      fresh: forward ? step.fresh : null,
      label: "Window",
    });
  }

  stopResult() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  renderCaption(step) {
    let quizHTML = "";
    if (step.quiz) {
      const picked = this.answers[this.mode];
      const buttons = QUIZ.map((q, i) => {
        let cls = "";
        if (picked !== null && i === picked && !q.correct) cls = "wrong";
        if (picked !== null && q.correct) cls = "right";
        return `<button type="button" data-choice="${i}" class="${cls}" aria-pressed="${picked === i}"><kbd>${i + 1}</kbd>${q.label}</button>`;
      }).join("");
      const feedback = picked === null ? "" : `<p class="feedback">${QUIZ[picked].feedback(step.quiz)}</p>`;
      quizHTML = `<div class="quiz">${buttons}</div>${feedback}`;
    }
    this.$(".caption").innerHTML = `<div class="h">${step.heading}</div><p>${step.text}</p>${quizHTML}`;
  }
}

if (!customElements.get("transform-leak-demo")) {
  customElements.define("transform-leak-demo", TransformLeakDemo);
}

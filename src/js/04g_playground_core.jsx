/* ---------------- IT Playground: shared building blocks ---------------- */

// Everything the Playground tools have in common: the tool registry, the small
// store that keeps sandbox setups and solved scenarios on this device (kept apart
// from cert progress on purpose: the Playground never touches mastery, results,
// the daily goal or readiness), form controls, a collapsible card, the scenario
// picker and shell every guided-scenario tool uses, a "predict first" panel, the
// "share this setup" panel and the lesson "try it" link.
//
// A new tool lives in its own files and registers itself:
//   PLAYGROUND_EXTRA_TOOLS.push({ key, label, hue, blurb, Component });
// where Component receives { pick, onPick } (pick is a scenario id, 'sandbox' or
// '' for the picker). See the Playground notes in ROADMAP.md.

const PLAYGROUND_TOOLS = [
  { key: 'subnet', label: 'Subnet calculator', hue: COLOR.blue, ready: true,
    blurb: 'Network, broadcast and host range for any address and mask, with the working shown. Plus VLSM planning, a same-subnet checker, a subnetting drill and IPv6.' },
  { key: 'ipconfig', label: 'IP configuration lab', hue: COLOR.teal, ready: true,
    blurb: 'Hosts, a gateway and routers. Change an address, mask or route and ping to see exactly why traffic works or fails. Includes guided troubleshooting scenarios.' },
  { key: 'vlan', label: 'VLAN playground', hue: COLOR.orange, ready: true,
    blurb: 'Two switches, access and trunk ports, native VLANs, port security and a router on a stick. Ping across the network and watch each switch learn, flood, tag or drop the frame.' },
  { key: 'firewall', label: 'Firewall and port forwarding', hue: COLOR.pink, ready: true,
    blurb: 'Ordered allow and deny rules with an implicit deny, port forwards, NAT and stateful inspection. Fire test connections and see which rule matched and why one was blocked.' },
];
const PLAYGROUND_EXTRA_TOOLS = [];
function pgAllTools() { return PLAYGROUND_TOOLS.concat(PLAYGROUND_EXTRA_TOOLS.map((t) => ({ ready: true, ...t }))); }
function pgToolKeys() { return pgAllTools().map((t) => t.key); }
const PG_LEVEL_LABEL = { starter: 'Starter', core: 'Core', stretch: 'Stretch' };
const PG_LEVEL_HUE = { starter: COLOR.success, core: COLOR.blue, stretch: COLOR.orange };

function pgData() { return (typeof PLAYGROUND !== 'undefined' && PLAYGROUND) || {}; }
function pgScenarios(toolKey) { return pgData()[toolKey] || []; }

/* ---------- the little store: sandbox setups, solved scenarios, prediction score ---------- */

const PG_STORAGE_KEY = 'cert-study-hub-playground-v1';
let pgMemory = null;
function pgStoreRead() {
  if (pgMemory) return pgMemory;
  let raw = null;
  try { raw = JSON.parse(window.localStorage.getItem(PG_STORAGE_KEY)); } catch (e) { raw = null; }
  pgMemory = raw && typeof raw === 'object' ? raw : {};
  if (!pgMemory.solved || typeof pgMemory.solved !== 'object') pgMemory.solved = {};
  if (!pgMemory.sandbox || typeof pgMemory.sandbox !== 'object') pgMemory.sandbox = {};
  if (!pgMemory.predict || typeof pgMemory.predict !== 'object') pgMemory.predict = { right: 0, total: 0 };
  return pgMemory;
}
function pgStoreWrite(mutate) {
  const d = pgStoreRead();
  mutate(d);
  try { window.localStorage.setItem(PG_STORAGE_KEY, JSON.stringify(d)); } catch (e) { /* private mode or full: the Playground still works, it just forgets */ }
}
function pgMarkSolved(toolKey, id) {
  const key = `${toolKey}/${id}`;
  if (pgStoreRead().solved[key]) return false;
  pgStoreWrite((d) => { d.solved[key] = todayString(); });
  return true;
}
function pgIsSolved(toolKey, id) { return !!pgStoreRead().solved[`${toolKey}/${id}`]; }

// Everything that can be solved: [{ tool, id, level }]
function pgAllScenarioRefs() {
  const out = [];
  pgAllTools().forEach((t) => pgScenarios(t.key).forEach((s) => out.push({ tool: t.key, id: s.id, level: s.level })));
  return out;
}
function pgProgress() {
  const refs = pgAllScenarioRefs();
  const solved = refs.filter((r) => pgIsSolved(r.tool, r.id));
  return { total: refs.length, solved: solved.length, refs, solvedRefs: solved };
}
const PG_MILESTONES = [
  { key: 'first', icon: '🔧', label: 'First fix', test: (p) => p.solved >= 1 },
  { key: 'five', icon: '🛠️', label: 'Five fixes', test: (p) => p.solved >= 5 },
  { key: 'ten', icon: '⚙️', label: 'Ten fixes', test: (p) => p.solved >= 10 },
  { key: 'starters', icon: '🌱', label: 'All starter scenarios', test: (p) => p.refs.filter((r) => r.level === 'starter').every((r) => pgIsSolved(r.tool, r.id)) && p.refs.some((r) => r.level === 'starter') },
  { key: 'everyTool', icon: '🧭', label: 'A fix in every tool', test: (p) => pgAllTools().filter((t) => pgScenarios(t.key).length).every((t) => p.solvedRefs.some((r) => r.tool === t.key)) && p.solved > 0 },
  { key: 'stretch', icon: '🏔️', label: 'A stretch scenario', test: (p) => p.solvedRefs.some((r) => r.level === 'stretch') },
  { key: 'all', icon: '🏆', label: 'Every scenario', test: (p) => p.total > 0 && p.solved === p.total },
];

// A setup that survives reloads. `validate(topo)` must return true for anything safe to load.
function usePgSandbox(toolKey, makeDefault, validate) {
  const [topo, setTopo] = useState(() => {
    const saved = pgStoreRead().sandbox[toolKey];
    try { if (saved && validate(saved)) return saved; } catch (e) { /* fall through to the default */ }
    return makeDefault();
  });
  useEffect(() => { pgStoreWrite((d) => { d.sandbox[toolKey] = topo; }); }, [topo]);
  const reset = () => { pgStoreWrite((d) => { delete d.sandbox[toolKey]; }); setTopo(makeDefault()); };
  return [topo, setTopo, reset];
}

/* ---------- controls ---------- */

function pgInputStyle(invalid) {
  return {
    width: '100%', padding: '9px 8px', borderRadius: '10px', fontSize: '13.5px', minWidth: 0,
    border: `2px solid ${invalid ? COLOR.red : COLOR.border}`, background: COLOR.surface, color: COLOR.text,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };
}

// A card. `collapsible` turns the title into a button that folds the body away
// (the long editors use it so a phone screen is not one endless scroll).
function PgCard({ title, hue, right, children, style, collapsible, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  const showBody = !collapsible || open;
  return (
    <div style={{ boxShadow: SHADOW.card, background: tint(hue, 7), border: `2px solid color-mix(in srgb, ${hue} 38%, ${COLOR.border})`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', ...style }}>
      {(title || right) && (
        <div className="flex justify-between items-baseline" style={{ marginBottom: showBody ? '10px' : 0, gap: '8px' }}>
          {collapsible ? (
            <button className="btn-flat" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${title}, ${open ? 'collapse' : 'expand'}`}
              style={{ display: 'flex', alignItems: 'baseline', gap: '6px', padding: 0, textAlign: 'left', background: 'transparent', border: 'none' }}>
              <span className="itil-display" style={{ fontSize: '16px', color: ink(hue) }}>{title}</span>
              <span aria-hidden="true" style={{ fontSize: '12px', color: COLOR.muted }}>{open ? '▾' : '▸'}</span>
            </button>
          ) : (
            <div className="itil-display" style={{ fontSize: '16px', color: ink(hue) }}>{title}</div>
          )}
          {right}
        </div>
      )}
      {showBody ? children : null}
    </div>
  );
}

function PgField({ label, value, onChange, error, placeholder, hint, inputMode }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        style={pgInputStyle(!!error)}
      />
      {error ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.red, marginTop: '3px' }}>{error}</span> : null}
      {!error && hint ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, marginTop: '3px' }}>{hint}</span> : null}
    </label>
  );
}

function PgSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} style={{ ...pgInputStyle(false), fontFamily: 'inherit' }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function PgSegmented({ options, value, onChange, hue }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className="btn-flat"
            style={{
              flex: '1 1 0', minWidth: '72px', padding: '8px 6px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800,
              border: `2px solid ${active ? hue : COLOR.border}`, background: active ? tint(hue, 20) : 'transparent',
              color: active ? ink(hue) : COLOR.muted,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const pgPillStyle = { fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted };

/* ---------- ping/test result steps shared by every tool ---------- */

function PgSteps({ steps }) {
  return (
    <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: '12.5px', lineHeight: 1.5 }}>
      {steps.map((st, j) => (
        <li key={j} style={{ display: 'flex', gap: '6px', marginBottom: '3px', color: st.ok ? COLOR.text : ink(COLOR.red), fontWeight: st.ok ? 400 : 700 }}>
          <span aria-hidden="true" style={{ flexShrink: 0, width: '14px', color: st.ok ? ink(COLOR.success) : ink(COLOR.red) }}>{st.ok ? '✓' : '✕'}</span>
          <span>{st.text}</span>
        </li>
      ))}
    </ol>
  );
}

function PgDiagnosis({ diagnosis, heading }) {
  if (!diagnosis) return null;
  return (
    <div style={{ padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `1.5px solid ${COLOR.border}`, marginBottom: '10px', fontSize: '13px', lineHeight: 1.5 }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted }}>{heading || 'First thing that is wrong'}</div>
      <div style={{ fontWeight: 800, margin: '2px 0' }}>{diagnosis.title}</div>
      <div>{diagnosis.text}</div>
      <div style={{ marginTop: '4px' }}><strong>Try:</strong> {diagnosis.fix}</div>
    </div>
  );
}

/* ---------- predict first ---------- */

// Optional "predict before you run" step on a lab's run button. `compute()` must
// be pure (it is called to build the answer and again to run); `causes` maps a
// diagnosis code to a short plain-language cause. Score is kept on this device.
function PgPredict({ compute, causes, buttonLabel, onResult, resetKey }) {
  const [on, setOn] = useState(false);
  const [guess, setGuess] = useState(null);
  const [cause, setCause] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const store = pgStoreRead().predict;
  useEffect(() => { setGuess(null); setCause(null); setOptions([]); setFeedback(null); }, [resetKey]);
  const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const chooseGuess = (g) => {
    setGuess(g); setCause(null); setFeedback(null);
    if (g === 'fails') {
      const real = compute();
      const realCode = real.diagnosis ? real.diagnosis.code : null;
      const pool = Object.keys(causes).filter((c) => c !== realCode).sort();
      const seed = hash(`${real.summary || ''}${realCode}`);
      const picks = [];
      for (let i = 0; i < pool.length && picks.length < 3; i += 1) picks.push(pool[(seed + i * 7) % pool.length]);
      const uniq = picks.filter((c, i) => picks.indexOf(c) === i);
      const all = (realCode && causes[realCode] ? [realCode] : []).concat(uniq);
      all.sort((a, b) => hash(a + seed) - hash(b + seed));
      setOptions(all.slice(0, 4));
    }
  };
  const ready = !on || guess === 'works' || (guess === 'fails' && cause);
  const run = () => {
    const result = compute();
    const fails = result.verdict !== 'success';
    if (on && guess) {
      const realCode = result.diagnosis ? result.diagnosis.code : null;
      const verdictRight = (guess === 'fails') === fails;
      const right = verdictRight && (!fails || cause === realCode);
      pgStoreWrite((d) => { d.predict.total += 1; if (right) d.predict.right += 1; });
      setFeedback({ right, verdictRight, realCode, fails });
    } else setFeedback(null);
    onResult(result);
  };
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
        <input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); setGuess(null); setCause(null); setFeedback(null); }} style={{ width: '18px', height: '18px', accentColor: COLOR.primary }} />
        Predict first <span style={{ fontWeight: 500, color: COLOR.muted }}>(guess the outcome, then run it)</span>
      </label>
      {on && (
        <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', background: tint(COLOR.gold, 10), border: `1.5px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>What will happen?</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[['works', 'It will work'], ['fails', 'It will fail']].map(([k, l]) => (
              <button key={k} className="btn-flat" onClick={() => chooseGuess(k)}
                style={{ ...pgPillStyle, border: `2px solid ${guess === k ? COLOR.primary : COLOR.border}`, background: guess === k ? tint(COLOR.primary, 18) : 'transparent', color: guess === k ? ink(COLOR.primary) : COLOR.muted }}>{l}</button>
            ))}
          </div>
          {guess === 'fails' && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>Why?</div>
              {options.map((c) => (
                <button key={c} className="btn-flat" onClick={() => setCause(c)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '6px', padding: '8px 10px', borderRadius: '10px', fontSize: '12.5px', border: `2px solid ${cause === c ? COLOR.primary : COLOR.border}`, background: cause === c ? tint(COLOR.primary, 14) : 'transparent', color: COLOR.text }}>{causes[c]}</button>
              ))}
            </div>
          )}
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '6px' }}>Prediction score on this device: {store.right} / {store.total}</div>
        </div>
      )}
      <button className="btn-3d" disabled={!ready} onClick={run}
        style={{ width: '100%', padding: '11px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, marginBottom: '12px', opacity: ready ? 1 : 0.5 }}>
        {buttonLabel}
      </button>
      {feedback && (
        <div style={{ padding: '8px 12px', borderRadius: '12px', marginBottom: '10px', fontSize: '13px', fontWeight: 700, lineHeight: 1.45, background: tint(feedback.right ? COLOR.success : COLOR.orange, 14), border: `2px solid ${feedback.right ? COLOR.success : COLOR.orange}` }}>
          {feedback.right ? 'Good call: you predicted it exactly.'
            : feedback.verdictRight ? `You were right that it fails, but the cause was: ${causes[feedback.realCode] || 'something else'}.`
              : feedback.fails ? `Not quite: it fails${feedback.realCode && causes[feedback.realCode] ? ` (${causes[feedback.realCode]})` : ''}.` : 'Not quite: it actually works.'}
        </div>
      )}
    </div>
  );
}

/* ---------- reset / share ---------- */

function PgSharePanel({ topo, setTopo, reset, validate }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => {
    try {
      const t = JSON.parse(text);
      if (!validate(t)) { setMsg('That does not look like an exported setup for this tool.'); return; }
      setTopo(t); setMsg('Loaded.');
    } catch (e) { setMsg('That is not valid JSON.'); }
  };
  return (
    <PgCard title="Reset and share" hue={COLOR.pink}>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Your setup is remembered on this device. Export it as text to keep a copy or hand it to someone else.</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn-flat" onClick={() => { reset(); setMsg('Back to the starting setup.'); }} style={pgPillStyle}>Reset</button>
        <button className="btn-flat" onClick={() => { setText(JSON.stringify(topo, null, 2)); setOpen(true); setMsg(''); }} style={pgPillStyle}>Export this setup</button>
        <button className="btn-flat" onClick={() => { setText(''); setOpen(true); setMsg(''); }} style={pgPillStyle}>Import a setup</button>
      </div>
      {open && (
        <div style={{ marginTop: '10px' }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Setup JSON" rows={8} spellCheck={false}
            style={{ ...pgInputStyle(false), fontSize: '12px', resize: 'vertical' }} placeholder="Paste a setup here, then load it." />
          <button className="btn-flat" onClick={load} style={{ marginTop: '6px', fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.pink) }}>Load this setup</button>
        </div>
      )}
      {msg ? <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '6px' }}>{msg}</div> : null}
    </PgCard>
  );
}

/* ---------- the scenario picker and shell every guided tool uses ---------- */

function PgScenarioPicker({ tool, scenarios, onPick, intro, note, sandboxText }) {
  return (
    <div>
      <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginBottom: note ? '8px' : '12px' }}>{intro}</div>
      {note ? <div style={{ fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '12px' }}>{note}</div> : null}
      <button className="btn-flat" onClick={() => onPick('sandbox')}
        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '12px', padding: '14px 16px', borderRadius: '16px', background: tint(COLOR.gold, 10), border: `2px solid color-mix(in srgb, ${COLOR.gold} 45%, ${COLOR.border})`, color: COLOR.text, boxShadow: SHADOW.card }}>
        <div className="itil-display" style={{ fontSize: '15px', color: ink(COLOR.gold) }}>Free sandbox</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '3px' }}>{sandboxText}</div>
      </button>
      {['starter', 'core', 'stretch'].map((lv) => {
        const list = scenarios.filter((s) => s.level === lv);
        if (!list.length) return null;
        return (
          <div key={lv} style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink(PG_LEVEL_HUE[lv]), margin: '10px 0 6px' }}>{PG_LEVEL_LABEL[lv]}</div>
            {list.map((s) => {
              const done = pgIsSolved(tool, s.id);
              return (
                <button key={s.id} className="btn-flat" onClick={() => onPick(s.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '8px', padding: '12px 14px', borderRadius: '14px', background: tint(PG_LEVEL_HUE[lv], 8), border: `2px solid color-mix(in srgb, ${PG_LEVEL_HUE[lv]} 38%, ${COLOR.border})`, color: COLOR.text }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{s.title}</span>
                    {done && <span aria-label="Solved" style={{ color: ink(COLOR.success), flexShrink: 0 }}>✓ solved</span>}
                  </div>
                  <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.45 }}>{s.goal}</div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// A guided scenario: story, the lab (renderLab), goal tracking, hints, the fix, the lesson.
// isSolved(topo) is the scenario's goal; fixLines is the wording shown under "Show the fix".
function PgScenarioShell({ tool, scenario, onBack, renderLab, isSolved, fixLines }) {
  const [topo, setTopo] = useState(() => pgClone(scenario.topology));
  const [hintsShown, setHintsShown] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const solved = isSolved(topo);
  useEffect(() => { if (solved) pgMarkSolved(tool, scenario.id); }, [solved]);
  const reset = () => { setTopo(pgClone(scenario.topology)); setHintsShown(0); setShowFix(false); };
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title={scenario.title} hue={COLOR.gold} right={<span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLOR.muted }}>{PG_LEVEL_LABEL[scenario.level]}</span>}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{scenario.story}</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '6px' }}>Your job: find out what is wrong and fix it so the goal below turns green.</div>
      </PgCard>
      {renderLab(topo, setTopo, scenario)}
      {solved && (
        <PgCard title="Fixed!" hue={COLOR.success}>
          <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{scenario.lesson}</div>
          {scenario.related && scenario.related.length > 0 && <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '8px' }}>Related study: {scenario.related.join(' · ')}</div>}
        </PgCard>
      )}
      <PgCard title="Stuck?" hue={COLOR.orange}>
        {scenario.hints.slice(0, hintsShown).map((h, i) => <div key={i} style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}><strong>Hint {i + 1}:</strong> {h}</div>)}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hintsShown < scenario.hints.length && <button className="btn-flat" onClick={() => setHintsShown(hintsShown + 1)} style={{ ...pgPillStyle, border: `2px solid ${COLOR.orange}`, color: ink(COLOR.orange) }}>{hintsShown ? 'Another hint' : 'Give me a hint'}</button>}
          <button className="btn-flat" onClick={() => setShowFix(!showFix)} style={pgPillStyle}>{showFix ? 'Hide the answer' : 'Show the fix'}</button>
          <button className="btn-flat" onClick={reset} style={pgPillStyle}>Reset scenario</button>
        </div>
        {showFix && <ul style={{ margin: '10px 0 0', paddingLeft: '18px', listStyle: 'disc', fontSize: '13px', lineHeight: 1.55 }}>{fixLines(scenario).map((t, i) => <li key={i}>{t}</li>)}</ul>}
      </PgCard>
    </div>
  );
}

// The free sandbox: a remembered setup plus reset and share.
function PgSandboxShell({ tool, makeDefault, validate, onBack, renderLab, blurb }) {
  const [topo, setTopo, reset] = usePgSandbox(tool, makeDefault, validate);
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title="Free sandbox" hue={COLOR.gold}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{blurb}</div>
      </PgCard>
      {renderLab(topo, setTopo)}
      <PgSharePanel topo={topo} setTopo={setTopo} reset={reset} validate={validate} />
    </div>
  );
}

/* ---------- lesson "try it" links ---------- */

// Shown at the end of a lesson that a Playground tool or scenario illustrates.
// The links are data (data/playground.py LESSON_LINKS), checked by build.py.
function PlaygroundLessonLink({ lesson }) {
  // The lesson object comes straight from DATA, so identity tells us which track it belongs to.
  const trackKey = Object.keys(DATA).find((k) => (DATA[k].lessons || []).includes(lesson));
  const links = (pgData().lessonLinks || []).filter((l) => l.track === trackKey && l.lesson === lesson.id);
  if (!links.length) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      {links.map((l) => (
        <button key={`${l.tool}/${l.pick || ''}`} className="btn-flat"
          onClick={() => { window.location.hash = `/playground/${l.tool}${l.pick ? `/${l.pick}` : ''}`; }}
          style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '8px', padding: '12px 14px', borderRadius: '14px', background: tint(COLOR.success, 10), border: `2px solid color-mix(in srgb, ${COLOR.success} 40%, ${COLOR.border})`, color: COLOR.text }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(COLOR.success) }}>Try it in the Playground</div>
          <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '1px' }}>{l.label}</div>
          {l.blurb ? <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.45 }}>{l.blurb}</div> : null}
        </button>
      ))}
    </div>
  );
}

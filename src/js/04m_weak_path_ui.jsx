/* ---------------- weak subjects: report, study order and the path built from it ---------------- */

// The screens for src/js/03d_weak_path.js. The same view serves two scopes: one cert (its Path tab,
// scope = the cert's key) and every cert in the plan (opened from Home, scope = 'mix'). It is one
// short page: a header that holds the single next action (build the path, or continue it), the
// weak lessons as compact rows that open on demand, and two folded sections (the exam areas losing
// points, and the history of missed questions). Steps run through the same PathStepRunner as the
// course path.

const WEAK_TIER_HUE = { critical: COLOR.red, high: COLOR.orange, watch: COLOR.gold };
const WEAK_MIX_PER_CERT = 3;
const WEAK_MIX_LESSONS = 8;
const WEAK_HISTORY_PAGE = 8;

function PathPanelSwitch({ panel, onPanel, weakCount }) {
  if (!onPanel) return null;
  const items = [{ key: 'course', label: 'Course path' }, { key: 'weak', label: weakCount ? `Weak spots · ${weakCount}` : 'Weak spots' }];
  return <SegmentedControl options={items} value={panel} onChange={onPanel} style={{ marginBottom: '14px' }} />;
}

// A tier tag in the "incident severity" style: bordered mono, coloured by tier.
function WeakTierChip({ tier }) {
  const hue = WEAK_TIER_HUE[tier] || COLOR.gold;
  return <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 6px', borderRadius: 'var(--r-pill)', background: `color-mix(in srgb, ${hue} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${hue} 45%, transparent)`, color: ink(hue), whiteSpace: 'nowrap' }}>{WEAK_TIER_LABEL[tier] || tier}</span>;
}

// Cards are neutral; a tier shows as a coloured edge on the left.
function weakCardStyle(hue) {
  return { background: hue ? tint(hue, 6) : COLOR.surface, border: `1px solid ${hue ? `color-mix(in srgb, ${hue} 35%, ${COLOR.border})` : COLOR.border}`, borderLeft: hue ? `3px solid ${hue}` : `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', padding: '14px 16px', marginBottom: '12px' };
}

const weakPill = { fontSize: '12.5px', fontWeight: 700, padding: '7px 12px', borderRadius: 'var(--r-ctl)', border: `1px solid ${COLOR.border}`, color: COLOR.muted, background: 'transparent' };
const weakMiniLabel = { fontSize: '10.5px', textTransform: 'uppercase', color: COLOR.muted, margin: '12px 0 6px' };

function weakTag(text, hue) {
  return <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: ink(hue), padding: '2px 6px', borderRadius: 'var(--r-pill)', border: `1px solid color-mix(in srgb, ${hue} 45%, transparent)`, whiteSpace: 'nowrap' }}>{text}</span>;
}

// The correct answer of a question, as one line of text.
function questionAnswerText(q) {
  if (q.type === 'tf') return q.answer ? 'True' : 'False';
  if (q.type === 'ms') return (q.correct || []).map((i) => (q.options || [])[i]).filter(Boolean).join(' · ');
  return (q.options || [])[q.correct] || '';
}

const clampText = (s, n) => (s.length > n ? `${s.slice(0, n - 2)}…` : s);

// One weak lesson as a compact row. Closed it shows the title, a tier tag and the reason in two
// lines; open it shows the path steps (if the lesson is in the path) and what to go back to.
function WeakLessonRow({ item, rank, open, onToggle, certLabel, done, onStep, onRun }) {
  const hue = item.retired ? COLOR.success : (WEAK_TIER_HUE[item.tier] || COLOR.gold);
  const row = item.row;
  const prog = item.unit ? pathUnitProgress(item.unit, done) : null;
  const reason = item.retired ? 'Every question that put this lesson here is answered correctly now, so its steps count as done.' : item.reason;
  return (
    <div style={{ background: tint(hue, 5), border: `1px solid color-mix(in srgb, ${hue} 30%, ${COLOR.border})`, borderLeft: `3px solid ${hue}`, borderRadius: 'var(--r-card)', marginBottom: '8px' }}>
      <button onClick={onToggle} aria-expanded={open} className="btn-flat" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 'var(--r-card)', padding: '11px 12px', color: COLOR.text }}>
        <span aria-hidden="true" className="mono" style={{ flexShrink: 0, minWidth: '20px', fontSize: '12px', fontWeight: 700, color: ink(hue), paddingTop: '2px' }}>{String(rank).padStart(2, '0')}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '14.5px', fontWeight: 700, lineHeight: 1.3 }}>{item.title}</span>
          <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
            {certLabel && <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: COLOR.muted, padding: '2px 6px', borderRadius: 'var(--r-pill)', border: `1px solid ${COLOR.border}` }}>{certLabel}</span>}
            {item.retired ? weakTag('Mastered', COLOR.success) : <WeakTierChip tier={item.tier} />}
            {prog && !item.retired && <span className="mono" style={{ fontSize: '10.5px', color: COLOR.muted }}>{prog.done}/{prog.total} steps</span>}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: COLOR.muted, lineHeight: 1.45, marginTop: '5px', ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>{reason}</span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: '11px', color: COLOR.muted, paddingTop: '3px', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && (
        <div style={{ margin: '0 12px', padding: '4px 0 12px', borderTop: `1px solid ${COLOR.border}` }}>
          {item.unit && (
            <>
              <div style={weakMiniLabel}>Path steps</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {item.unit.steps.map((st) => {
                  const isDone = pathStepIsDone(done, st.id);
                  return (
                    <button key={st.id} className="btn-flat" onClick={() => onStep(item.unit, st)} aria-label={`${st.label}${isDone ? ', done' : ''}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, padding: '5px 10px', borderRadius: 'var(--r-pill)', border: `1px solid ${isDone ? COLOR.success : COLOR.border}`, color: isDone ? ink(COLOR.success) : COLOR.text, background: isDone ? tint(COLOR.success, 12) : 'transparent' }}>
                      <PathIcon kind={isDone ? 'check' : st.kind} size={14} /> {st.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {row ? (
            <>
              <div style={weakMiniLabel}>Reading</div>
              <div style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '6px' }}>Re-read <strong>{row.readings.lesson.title}</strong> ({row.readings.minutes} min).</div>
              <button className="btn-flat" onClick={() => onRun(row, 'read')} style={weakPill}>Open the lesson</button>
              {row.readings.resources.length > 0 && (
                <div style={{ fontSize: '12.5px', lineHeight: 1.6, marginTop: '8px' }}>
                  <span style={{ color: COLOR.muted }}>Official reading: </span>
                  {row.readings.resources.map((r, i) => (
                    <span key={r.url}>{i ? ' · ' : ''}<a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: ink(COLOR.primary), fontWeight: 700 }}>{r.label} ↗</a></span>
                  ))}
                </div>
              )}
              <div style={weakMiniLabel}>Flashcards</div>
              {row.cards.length > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {row.cards.slice(0, 6).map((c) => (
                      <span key={c.id} style={{ fontSize: '12px', padding: '3px 9px', borderRadius: 'var(--r-pill)', border: `1px solid ${row.tough.some((t) => t.id === c.id) ? COLOR.orange : COLOR.border}`, color: COLOR.text }}>{c.front}</span>
                    ))}
                    {row.cards.length > 6 && <span style={{ fontSize: '12px', color: COLOR.muted, padding: '3px 2px' }}>+ {row.cards.length - 6} more</span>}
                  </div>
                  <button className="btn-flat" onClick={() => onRun(row, 'cards')} style={weakPill}>Review these {row.cards.length} cards</button>
                </>
              ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>No flashcards map to this lesson.</div>}
              <div style={weakMiniLabel}>Questions you missed</div>
              {row.missed.length > 0 ? (
                <>
                  <ul style={{ margin: '0 0 8px', paddingLeft: '18px', listStyle: 'disc', fontSize: '12.5px', lineHeight: 1.5 }}>
                    {row.missed.slice(0, 3).map((m) => (
                      <li key={m.q.id} style={{ marginBottom: '3px' }}>
                        {clampText(m.q.question, 110)}
                        <span style={{ color: COLOR.muted }}>{m.misses > 1 ? ` · missed ${m.misses} times` : ''}</span>
                      </li>
                    ))}
                    {row.missed.length > 3 && <li style={{ color: COLOR.muted, listStyle: 'none', marginLeft: '-18px' }}>+ {row.missed.length - 3} more</li>}
                  </ul>
                  <button className="btn-flat" onClick={() => onRun(row, 'weakquiz')} style={weakPill}>Redo these {Math.min(row.missed.length, WEAK_FIX_QUESTIONS)}</button>
                </>
              ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>No missed questions here: this lesson was flagged by flashcards or games.</div>}
            </>
          ) : (
            <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '10px' }}>This lesson is no longer flagged by your latest results.</div>
          )}
        </div>
      )}
    </div>
  );
}

// The questions you have missed, newest first. Open a row to see the right answer and why; the
// button runs a short retry quiz over what is listed.
function MissedHistoryBody({ history, certLabelOf, multi, onRetry }) {
  const wrong = history.filter((h) => h.state === 'wrong').length;
  const [filter, setFilter] = useState(wrong ? 'wrong' : 'all');
  const [shown, setShown] = useState(WEAK_HISTORY_PAGE);
  const [openId, setOpenId] = useState(null);
  const list = history.filter((h) => filter === 'all' || h.state === filter);
  const visible = list.slice(0, shown);
  const first = visible[0];
  const retryList = first ? visible.filter((h) => h.trackKey === first.trackKey).slice(0, WEAK_FIX_QUESTIONS) : [];
  const idKey = (h) => `${h.trackKey}::${h.q.id}`;
  return (
    <div>
      <SegmentedControl
        options={[{ key: 'wrong', label: 'Still wrong', badge: wrong }, { key: 'fixed', label: 'Fixed', badge: history.length - wrong }, { key: 'all', label: 'All', badge: history.length }]}
        value={filter}
        onChange={(k) => { setFilter(k); setShown(WEAK_HISTORY_PAGE); setOpenId(null); }}
        style={{ marginBottom: '10px' }}
      />
      {list.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, padding: '6px 2px' }}>{filter === 'wrong' ? 'Nothing is still wrong. Nice.' : 'Nothing here yet.'}</div>}
      {visible.map((h) => {
        const open = openId === idKey(h);
        const stateHue = h.state === 'fixed' ? COLOR.success : COLOR.red;
        return (
          <div key={idKey(h)} style={{ borderTop: `1px solid ${COLOR.border}` }}>
            <button onClick={() => setOpenId(open ? null : idKey(h))} aria-expanded={open} className="btn-flat" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 0, padding: '10px 2px', color: COLOR.text }}>
              <span style={{ display: 'block', fontSize: '13px', lineHeight: 1.45, ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>{h.q.question}</span>
              <span className="mono" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '10.5px', color: COLOR.muted, marginTop: '4px' }}>
                <span style={{ color: ink(stateHue), fontWeight: 700 }}>{h.state === 'fixed' ? '✓ fixed' : '✕ still wrong'}</span>
                <span>missed {h.misses}×</span>
                {h.last && <span>last {formatDateShort(h.last)}</span>}
                {multi && <span>{certLabelOf(h.trackKey)}</span>}
              </span>
            </button>
            {open && (
              <div style={{ padding: '0 2px 12px', fontSize: '12.5px', lineHeight: 1.55 }}>
                <div><span style={{ color: COLOR.muted }}>Answer: </span><strong>{questionAnswerText(h.q)}</strong></div>
                {h.q.explanation && <div style={{ color: COLOR.muted, marginTop: '4px' }}>{h.q.explanation}</div>}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
        {retryList.length > 0 && (
          <button className="btn-flat" onClick={() => onRetry(retryList)} style={{ ...weakPill, color: ink(COLOR.primary), border: `1px solid ${COLOR.primary}` }}>
            Retry {retryList.length} question{retryList.length === 1 ? '' : 's'}{multi && first ? ` from ${certLabelOf(first.trackKey)}` : ''}
          </button>
        )}
        {list.length > shown && <button className="btn-flat" onClick={() => setShown((n) => n + WEAK_HISTORY_PAGE)} style={weakPill}>Show more ({list.length - shown} left)</button>}
      </div>
    </div>
  );
}

// props: scopeKey ('ccna', or 'mix' for every cert in the plan), trackKeys, title, resultsAll /
// seenLogAll (keyed by cert), srs, missLog, saved (this scope's stored path), api (storage for this
// scope: createWeakPath / completeWeakStep / clearWeakPath), makeApi(trackKey) (the handlers a step
// records through), and either panel/onPanel (a cert's Path tab) or onExit (opened from Home).
function WeakSubjectsView({ scopeKey, trackKeys, title, resultsAll, seenLogAll, srs, missLog, saved, speech, api, makeApi, panel, onPanel, onExit, exitLabel }) {
  const today = todayString();
  const multi = scopeKey === 'mix';
  const certLabelOf = (k) => (TRACKS.find((t) => t.key === k) || { label: k }).label;
  const analysis = useMemo(() => weakAnalyzeMany(trackKeys, resultsAll, seenLogAll, srs, missLog, today), [trackKeys.join(','), resultsAll, srs, missLog]);
  const weakUnits = useMemo(() => (saved ? buildWeakUnitsFor(scopeKey, saved.snapshot) : []), [scopeKey, saved]);
  const eff = useMemo(() => weakEffectiveDone(weakUnits, saved ? saved.snapshot : null, resultsAll, scopeKey, saved ? saved.done : {}, today), [weakUnits, saved, resultsAll]);
  const done = eff.done;
  const history = useMemo(() => missedHistory(trackKeys, resultsAll, missLog), [trackKeys.join(','), resultsAll, missLog]);
  const [session, setSession] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const [confirmRebuild, setConfirmRebuild] = useState(false);

  const startStep = (unit, step, adhoc) => { setCompletion(null); setSession({ unit, step, adhoc: !!adhoc, nonce: Date.now() }); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const runForRow = (row, kind) => {
    const unit = buildWeakUnits(row.trackKey, { units: buildWeakSnapshot({ units: [row] }, today, 1).units })[0];
    const step = unit && unit.steps.find((s) => s.kind === kind);
    if (step) startStep({ ...unit, trackKey: row.trackKey }, step, true);
  };
  const retryHistory = (list) => {
    const tk = list[0].trackKey;
    const ids = list.map((h) => h.q.id);
    const unit = { id: 'history', index: 0, weak: true, trackKey: tk, title: 'Missed questions', lesson: { id: 'history', title: 'Missed questions' }, poolIds: ids, steps: [] };
    startStep(unit, { id: 'weak::history::retry', kind: 'weakquiz', label: 'Retry your misses', missedIds: ids, poolIds: ids, count: ids.length }, true);
  };
  const finishStep = (pct) => {
    const { unit, step, adhoc } = session;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (adhoc) { setSession(null); return; }
    api.completeWeakStep(step.id, pct);
    setCompletion({ unit, step, pct });
    setSession(null);
  };

  if (session) {
    const tk = session.unit.trackKey || trackKeys[0];
    return (
      <PathStepRunner
        key={session.step.id + '-' + session.nonce}
        trackKey={tk} units={session.adhoc ? [session.unit] : weakUnits} unit={session.unit} step={session.step}
        results={(resultsAll && resultsAll[tk]) || {}} seenLog={(seenLogAll && seenLogAll[tk]) || {}} categories={DATA[tk].categories} speech={speech} api={makeApi(tk)}
        certLabel={multi ? certLabelOf(tk) : null}
        onDone={finishStep} onExit={() => setSession(null)} exitLabel="‹ Back to weak spots"
      />
    );
  }
  if (completion) {
    const doneNow = { ...done, [completion.step.id]: true };
    const unitComplete = pathUnitProgress(completion.unit, doneNow).complete;
    const nextNow = pathNextStep(weakUnits, doneNow);
    return (
      <PathStepComplete
        unit={completion.unit} step={completion.step} pct={completion.pct} unitComplete={unitComplete} testedOut={false}
        next={nextNow} onNext={() => startStep(nextNow.unit, nextNow.step)} onBack={() => setCompletion(null)} backLabel="Back to weak spots"
      />
    );
  }

  const overall = pathOverallProgress(weakUnits, done);
  const nextStep = pathNextStep(weakUnits, done);
  const outcome = saved ? weakPathOutcome(saved.snapshot, multi ? resultsAll : (resultsAll && resultsAll[trackKeys[0]]) || {}, scopeKey) : null;
  const build = () => { api.createWeakPath(buildWeakSnapshot(analysis, today, multi ? WEAK_MIX_LESSONS : undefined, multi ? WEAK_MIX_PER_CERT : undefined)); setConfirmRebuild(false); setOpenKey(null); };
  const hasProgress = overall.done > 0;
  const planCount = Math.min(analysis.units.length, multi ? WEAK_MIX_LESSONS : WEAK_MAX_UNITS);

  // One list: the lessons in the saved path first (in path order), then the other weak lessons.
  const rowKey = (r) => `${r.trackKey}::${r.unit.id}`;
  const byKey = new Map(analysis.units.map((r) => [rowKey(r), r]));
  const inPathKeys = new Set();
  const items = weakUnits.map((u) => {
    const k = `${u.trackKey}::${u.lessonId}`;
    inPathKeys.add(k);
    const row = byKey.get(k) || null;
    return { key: u.id, unit: u, row, tier: u.tier, title: u.title, reason: row ? row.reason : u.why, trackKey: u.trackKey, retired: eff.retired.has(u.id) };
  });
  const others = analysis.units.filter((r) => !inPathKeys.has(rowKey(r))).map((r) => ({ key: rowKey(r), unit: null, row: r, tier: r.tier, title: r.unit.title, reason: r.reason, trackKey: r.trackKey, retired: false }));
  const renderRow = (item, i) => (
    <WeakLessonRow key={item.key} item={item} rank={i + 1} open={openKey === item.key} certLabel={multi ? certLabelOf(item.trackKey) : null} done={done}
      onToggle={() => setOpenKey(openKey === item.key ? null : item.key)} onStep={startStep} onRun={runForRow} />
  );
  const statLine = `${analysis.totals.missed} missed · ${analysis.units.length} weak lesson${analysis.units.length === 1 ? '' : 's'} · ${analysis.totals.tough} tough card${analysis.totals.tough === 1 ? '' : 's'}`;
  const areas = analysis.categories.slice(0, 5);

  return (
    <div>
      {onExit
        ? <button onClick={onExit} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '10px', padding: 0 }}>{exitLabel || '‹ Back'}</button>
        : <PathPanelSwitch panel={panel} onPanel={onPanel} weakCount={analysis.units.length} />}

      <div style={weakCardStyle(saved || analysis.units.length ? COLOR.red : analysis.hasData ? COLOR.success : null)}>
        <div className="flex justify-between items-baseline" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600 }}>{title} weak spots</div>
          {analysis.hasData && <div className="mono" style={{ fontSize: '11px', color: COLOR.muted }}>{statLine}</div>}
        </div>

        {!analysis.hasData && !saved && (
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginTop: '6px' }}>Nothing to analyse yet. Answer some questions in the course path or in Practice first; every miss teaches this page where to send you.</div>
        )}
        {analysis.hasData && analysis.units.length === 0 && !saved && (
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginTop: '6px' }}>No weak spots right now. You have answered {analysis.attempted} questions and nothing stands out. This page flags a lesson as soon as the misses pile up.</div>
        )}

        {!saved && analysis.units.length > 0 && (
          <>
            <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, margin: '6px 0 12px' }}>
              Work through the lessons below from the most urgent down: a re-read, targeted flashcards, a quiz built around your misses and a retest.
            </div>
            <button onClick={build} style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-ctl)', border: 'none', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 800 }}>
              Build my weak-subjects path ({planCount} lesson{planCount === 1 ? '' : 's'})
            </button>
          </>
        )}

        {saved && (
          <>
            <div style={{ margin: '10px 0 6px' }}><TickBar value={overall.done} total={overall.total} ticks={12} label={`${overall.pct}% of the weak-subjects path`} /></div>
            <div className="mono" style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '12px' }}>
              {overall.done} of {overall.total} steps · {overall.unitsComplete} of {overall.unitCount} lessons done
              {eff.retired.size ? ` · ${eff.retired.size} mastered` : ''}
              {outcome && outcome.baseline ? ` · ${outcome.fixed} of ${outcome.baseline} misses fixed` : ''}
            </div>
            {nextStep ? (
              <button onClick={() => startStep(nextStep.unit, nextStep.step)}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-ctl)', border: 'none', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 800 }}>
                {hasProgress ? 'Continue' : 'Start'}: {nextStep.step.label}
              </button>
            ) : (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--r-card)', background: tint(COLOR.success, 14), border: `1px solid ${COLOR.success}`, fontSize: '13.5px', fontWeight: 800 }}>
                Path complete{outcome && outcome.baseline ? `: ${outcome.fixed} of ${outcome.baseline} missed questions are now answered correctly` : ''}. Rebuild to see what still needs work.
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
              {confirmRebuild ? (
                <>
                  <span style={{ fontSize: '12.5px', color: COLOR.muted }}>Replace this path and its progress?</span>
                  <button className="btn-flat" onClick={build} style={{ ...weakPill, color: ink(COLOR.red), border: `1px solid ${COLOR.red}` }}>Yes, rebuild</button>
                  <button className="btn-flat" onClick={() => setConfirmRebuild(false)} style={weakPill}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn-flat" onClick={() => (hasProgress && nextStep ? setConfirmRebuild(true) : build())} disabled={!analysis.units.length} style={{ ...weakPill, opacity: analysis.units.length ? 1 : 0.5 }}>Rebuild from my latest results</button>
                  <button className="btn-flat" onClick={api.clearWeakPath} style={weakPill}>Remove path</button>
                  <span className="mono" style={{ fontSize: '10.5px', color: COLOR.muted }}>built {formatDateShort(saved.snapshot.created) || saved.snapshot.created}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <>
          <SectionLabel first count={items.length}>In your path</SectionLabel>
          {items.map((it, i) => renderRow(it, i))}
        </>
      )}
      {others.length > 0 && (
        <>
          <SectionLabel first={!items.length} count={others.length}>{items.length ? 'Also weak, not in your path' : 'Weak lessons, most urgent first'}</SectionLabel>
          {others.map((it, i) => renderRow(it, items.length + i))}
        </>
      )}

      {areas.length > 0 && (
        <Disclosure label="Exam areas losing points" count={areas.length} summary={`${multi ? `${certLabelOf(areas[0].trackKey)} · ` : ''}${areas[0].label}`} style={{ marginTop: '14px' }}>
          {areas.map((c) => (
            <div key={`${c.trackKey}:${c.key}`} style={{ marginBottom: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700 }}>{multi ? `${certLabelOf(c.trackKey)} · ` : ''}{c.label}</span>
                <span style={{ color: COLOR.muted, whiteSpace: 'nowrap' }}>{c.missed} of {c.attempted} missed{c.marks ? ` · ${c.marks}% of exam` : ''}</span>
              </div>
              <TickBar value={c.missed} total={Math.max(1, c.attempted)} ticks={10} height={6} hue={c.pctMissed >= 50 ? COLOR.red : c.pctMissed >= 25 ? COLOR.orange : COLOR.gold} label={`${c.pctMissed}% missed`} />
            </div>
          ))}
        </Disclosure>
      )}

      {history.length > 0 && (
        <Disclosure label="Missed questions" count={history.length} summary={`${history.filter((h) => h.state === 'wrong').length} still wrong`} style={areas.length ? undefined : { marginTop: '14px' }}>
          <MissedHistoryBody history={history} multi={multi} certLabelOf={certLabelOf} onRetry={retryHistory} />
        </Disclosure>
      )}
    </div>
  );
}

/* ---------------- weak subjects: report, study order and the path built from it ---------------- */

// The screens for src/js/03d_weak_path.js. On a cert's Path tab a switch flips between the
// course path and "Weak spots": a report of which lessons your missed questions point at
// (with the readings, flashcards and questions to go back to), the exam areas you are
// losing points in, and a button that turns the ranking into a path in priority order.
// Steps run through the same PathStepRunner as the course path.

const WEAK_TIER_HUE = { critical: COLOR.red, high: COLOR.orange, watch: COLOR.gold };

function PathPanelSwitch({ panel, onPanel, weakCount }) {
  if (!onPanel) return null;
  const items = [{ key: 'course', label: 'Course path' }, { key: 'weak', label: weakCount ? `Weak spots · ${weakCount}` : 'Weak spots' }];
  return (
    <div role="tablist" aria-label="Path view" style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
      {items.map((it) => {
        const active = it.key === panel;
        const hue = it.key === 'weak' ? COLOR.red : COLOR.primary;
        return (
          <button key={it.key} role="tab" aria-selected={active} onClick={() => onPanel(it.key)} className="btn-flat"
            style={{ flex: 1, padding: '9px 6px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: `2px solid ${active ? hue : COLOR.border}`, background: active ? tint(hue, 16) : 'transparent', color: active ? ink(hue) : COLOR.muted }}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function WeakTierChip({ tier }) {
  const hue = WEAK_TIER_HUE[tier] || COLOR.gold;
  return <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: tint(hue, 18), color: ink(hue), whiteSpace: 'nowrap' }}>{WEAK_TIER_LABEL[tier] || tier}</span>;
}

function weakCardStyle(hue) {
  return { boxShadow: SHADOW.card, background: hue ? tint(hue, 6) : COLOR.surface, border: `2px solid ${hue ? `color-mix(in srgb, ${hue} 35%, ${COLOR.border})` : COLOR.border}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px' };
}

const weakPill = { fontSize: '12.5px', fontWeight: 800, padding: '7px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted, background: 'transparent' };

// One weak lesson: why it is flagged and what to go back to.
function WeakUnitCard({ row, rank, open, onToggle, onRun, inPath }) {
  const hue = WEAK_TIER_HUE[row.tier] || COLOR.gold;
  const rd = row.readings;
  return (
    <div style={weakCardStyle(hue)}>
      <button onClick={onToggle} aria-expanded={open} className="btn-flat" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 0 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div aria-hidden="true" style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', background: hue, color: COLOR.onAccent, fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{rank}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.3 }}>{row.unit.title}</span>
              <WeakTierChip tier={row.tier} />
              {inPath && <span style={{ fontSize: '10.5px', fontWeight: 800, color: ink(COLOR.success) }}>✓ in your path</span>}
            </div>
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.45 }}>{row.reason}</div>
          </div>
          <span aria-hidden="true" style={{ color: COLOR.muted, fontSize: '12px', paddingTop: '4px' }}>{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '6px' }}>1 · Reading</div>
          <div style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '6px' }}>Re-read <strong>{rd.lesson.title}</strong> ({rd.minutes} min).</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <button className="btn-flat" onClick={() => onRun('read')} style={weakPill}>Open the lesson</button>
          </div>
          {rd.resources.length > 0 && (
            <div style={{ fontSize: '12.5px', lineHeight: 1.6, marginBottom: '12px' }}>
              <span style={{ color: COLOR.muted }}>Official reading: </span>
              {rd.resources.map((r, i) => (
                <span key={r.url}>{i ? ' · ' : ''}<a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: ink(COLOR.primary), fontWeight: 700 }}>{r.label} ↗</a></span>
              ))}
            </div>
          )}
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLOR.muted, margin: '8px 0 6px' }}>2 · Flashcards</div>
          {row.cards.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {row.cards.map((c) => (
                  <span key={c.id} style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '999px', border: `1.5px solid ${row.tough.some((t) => t.id === c.id) ? COLOR.orange : COLOR.border}`, color: COLOR.text }}>{c.front}</span>
                ))}
              </div>
              <button className="btn-flat" onClick={() => onRun('cards')} style={weakPill}>Review these {row.cards.length} cards</button>
            </>
          ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>No flashcards map to this lesson.</div>}
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLOR.muted, margin: '14px 0 6px' }}>3 · Questions you missed</div>
          {row.missed.length > 0 ? (
            <>
              <ul style={{ margin: '0 0 8px', paddingLeft: '18px', listStyle: 'disc', fontSize: '12.5px', lineHeight: 1.5 }}>
                {row.missed.slice(0, 4).map((m) => (
                  <li key={m.q.id} style={{ marginBottom: '3px' }}>
                    {m.q.question.length > 110 ? `${m.q.question.slice(0, 108)}…` : m.q.question}
                    <span style={{ color: COLOR.muted }}>{m.misses > 1 ? ` · missed ${m.misses} times` : ''}</span>
                  </li>
                ))}
                {row.missed.length > 4 && <li style={{ color: COLOR.muted, listStyle: 'none', marginLeft: '-18px' }}>+ {row.missed.length - 4} more</li>}
              </ul>
              <button className="btn-flat" onClick={() => onRun('weakquiz')} style={weakPill}>Redo these {Math.min(row.missed.length, WEAK_FIX_QUESTIONS)}</button>
            </>
          ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>No missed questions here: this lesson was flagged by flashcards or games.</div>}
        </div>
      )}
    </div>
  );
}

function WeakSubjectsView({ track, trackKey, results, seenLog, srs, missLog, saved, categories, speech, api, panel, onPanel }) {
  const today = todayString();
  const analysis = useMemo(() => weakAnalyze(trackKey, results, seenLog, srs, missLog, today), [trackKey, results, srs, missLog]);
  const weakUnits = useMemo(() => (saved ? buildWeakUnits(trackKey, saved.snapshot) : []), [trackKey, saved]);
  const done = (saved && saved.done) || {};
  const [session, setSession] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [openKey, setOpenKey] = useState(() => (analysis.units[0] ? analysis.units[0].unit.id : null));
  const [confirmRebuild, setConfirmRebuild] = useState(false);

  const startStep = (unit, step, adhoc) => { setCompletion(null); setSession({ unit, step, adhoc: !!adhoc, nonce: Date.now() }); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const rowUnit = (row) => buildWeakUnits(trackKey, { units: buildWeakSnapshot({ units: [row] }, today, 1).units })[0];
  const runForRow = (row, kind) => {
    const unit = rowUnit(row);
    const step = unit && unit.steps.find((s) => s.kind === kind);
    if (step) startStep(unit, step, true);
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
    return (
      <PathStepRunner
        key={session.step.id + '-' + session.nonce}
        trackKey={trackKey} units={session.adhoc ? [session.unit] : weakUnits} unit={session.unit} step={session.step}
        results={results} seenLog={seenLog} categories={categories} speech={speech} api={api}
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
  const outcome = saved ? weakPathOutcome(saved.snapshot, results) : null;
  const inPath = new Set(saved ? saved.snapshot.units.map((u) => u.lessonId) : []);
  const build = () => { api.createWeakPath(buildWeakSnapshot(analysis, today)); setConfirmRebuild(false); setOpenKey(null); };
  const hasProgress = overall.done > 0;
  const plan = analysis.units.slice(0, WEAK_MAX_UNITS);

  return (
    <div>
      <PathPanelSwitch panel={panel} onPanel={onPanel} weakCount={analysis.units.length} />

      <div style={weakCardStyle(COLOR.red)}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{track.label} weak spots</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55 }}>
          Your missed questions, repeat misses and flashcards you rated as tough point back at the lessons below. Re-reading, the right flashcards and a quiz built around your misses, in the order that matters most.
        </div>
        {analysis.hasData && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[[analysis.totals.missed, 'questions missed'], [analysis.units.length, 'weak lessons'], [analysis.totals.tough, 'tough cards']].map(([n, l]) => (
              <div key={l} style={{ flex: '1 1 0', minWidth: '90px', border: `2px solid ${COLOR.border}`, borderRadius: '12px', padding: '6px 10px', background: COLOR.surface }}>
                <div style={{ fontSize: '19px', fontWeight: 900 }}>{n}</div>
                <div style={{ fontSize: '11px', color: COLOR.muted }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!analysis.hasData && (
        <div style={weakCardStyle()}>
          <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>Nothing to analyse yet</div>
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55 }}>Answer some questions in the course path or in Practice first. Every miss teaches this view where to send you.</div>
        </div>
      )}
      {analysis.hasData && analysis.units.length === 0 && !saved && (
        <div style={weakCardStyle(COLOR.success)}>
          <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>No weak spots right now</div>
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55 }}>You have answered {analysis.attempted} questions and nothing stands out as a problem. Keep going; this view will flag a lesson as soon as the misses pile up.</div>
        </div>
      )}

      {saved ? (
        <div style={weakCardStyle(COLOR.primary)}>
          <div className="flex justify-between items-baseline" style={{ marginBottom: '6px', gap: '8px' }}>
            <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600 }}>Your weak-subjects path</div>
            <div style={{ fontSize: '12px', color: COLOR.muted }}>built {formatDateShort(saved.snapshot.created) || saved.snapshot.created}</div>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ height: '100%', width: `${overall.pct}%`, background: COLOR.success }} />
          </div>
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>{overall.done} of {overall.total} steps · {overall.unitsComplete} of {overall.unitCount} lessons done{outcome && outcome.baseline ? ` · ${outcome.fixed} of ${outcome.baseline} missed questions fixed so far` : ''}</div>
          {weakUnits.map((u) => {
            const p = pathUnitProgress(u, done);
            return (
              <div key={u.id} style={{ border: `2px solid ${p.complete ? COLOR.success : COLOR.border}`, borderRadius: '12px', padding: '10px 12px', marginBottom: '8px', background: COLOR.surface }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800 }}>{u.index + 1}. {u.title}</span>
                  <WeakTierChip tier={u.tier} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {u.steps.map((st) => {
                    const isDone = pathStepIsDone(done, st.id);
                    return (
                      <button key={st.id} className="btn-flat" onClick={() => startStep(u, st)} aria-label={`${st.label}${isDone ? ', done' : ''}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, padding: '5px 10px', borderRadius: '999px', border: `2px solid ${isDone ? COLOR.success : COLOR.border}`, color: isDone ? ink(COLOR.success) : COLOR.text, background: isDone ? tint(COLOR.success, 12) : 'transparent' }}>
                        <PathIcon kind={isDone ? 'check' : st.kind} size={14} /> {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {nextStep ? (
            <button className="btn-3d" onClick={() => startStep(nextStep.unit, nextStep.step)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>
              {hasProgress ? 'Continue' : 'Start'}: {nextStep.step.label}
            </button>
          ) : (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(COLOR.success, 14), border: `2px solid ${COLOR.success}`, fontSize: '13.5px', fontWeight: 800, marginTop: '4px' }}>
              Path complete{outcome && outcome.baseline ? `: ${outcome.fixed} of ${outcome.baseline} missed questions are now answered correctly` : ''}. Rebuild to see what still needs work.
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {confirmRebuild ? (
              <>
                <span style={{ fontSize: '12.5px', color: COLOR.muted, alignSelf: 'center' }}>Replace this path and its progress?</span>
                <button className="btn-flat" onClick={build} style={{ ...weakPill, color: ink(COLOR.red), border: `2px solid ${COLOR.red}` }}>Yes, rebuild</button>
                <button className="btn-flat" onClick={() => setConfirmRebuild(false)} style={weakPill}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn-flat" onClick={() => (hasProgress && nextStep ? setConfirmRebuild(true) : build())} disabled={!analysis.units.length} style={{ ...weakPill, opacity: analysis.units.length ? 1 : 0.5 }}>Rebuild from my latest results</button>
                <button className="btn-flat" onClick={api.clearWeakPath} style={weakPill}>Remove path</button>
              </>
            )}
          </div>
        </div>
      ) : analysis.units.length > 0 && (
        <div style={weakCardStyle(COLOR.primary)}>
          <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>A new study order</div>
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginBottom: '10px' }}>
            Instead of course order, work through these lessons from the most urgent down. Each one gets a re-read, targeted flashcards, a quiz built around your misses and a retest.
          </div>
          <ol style={{ margin: '0 0 12px', paddingLeft: '20px', listStyle: 'decimal', fontSize: '13px', lineHeight: 1.6 }}>
            {plan.map((r) => <li key={r.unit.id}><strong>{r.unit.title}</strong> <WeakTierChip tier={r.tier} /></li>)}
          </ol>
          <button className="btn-3d" onClick={build} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 800 }}>
            Build my weak-subjects path ({plan.length} lesson{plan.length === 1 ? '' : 's'})
          </button>
        </div>
      )}

      {analysis.categories.length > 0 && (
        <div style={weakCardStyle()}>
          <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Where the exam points are leaking</div>
          {analysis.categories.slice(0, 5).map((c) => (
            <div key={c.key} style={{ marginBottom: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700 }}>{c.label}</span>
                <span style={{ color: COLOR.muted, whiteSpace: 'nowrap' }}>{c.missed} of {c.attempted} missed{c.marks ? ` · ${c.marks}% of exam` : ''}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(4, c.pctMissed)}%`, background: c.pctMissed >= 50 ? COLOR.red : c.pctMissed >= 25 ? COLOR.orange : COLOR.gold }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {analysis.units.length > 0 && (
        <div>
          <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, margin: '4px 0 8px' }}>What to review, most urgent first</div>
          {analysis.units.map((row, i) => (
            <WeakUnitCard key={row.unit.id} row={row} rank={i + 1} open={openKey === row.unit.id} inPath={inPath.has(row.unit.id)}
              onToggle={() => setOpenKey(openKey === row.unit.id ? null : row.unit.id)} onRun={(kind) => runForRow(row, kind)} />
          ))}
        </div>
      )}
    </div>
  );
}

// A card on Home: the cert(s) in the plan that have weak lessons, and a way in.
function HomeWeakSpotsCard({ summaries, trackLabel, onOpen }) {
  if (!summaries.length) return null;
  return (
    <div style={{ boxShadow: SHADOW.card, background: tint(COLOR.red, 7), border: `2px solid color-mix(in srgb, ${COLOR.red} 35%, ${COLOR.border})`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px' }}>
      <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, color: ink(COLOR.red), marginBottom: '4px' }}>Weak subjects</div>
      <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '10px' }}>Lessons your wrong answers point back at, with a path that studies them in priority order.</div>
      {summaries.slice(0, 3).map((s) => (
        <div key={s.trackKey} style={{ border: `2px solid ${COLOR.border}`, borderRadius: '12px', padding: '10px 12px', marginBottom: '8px', background: COLOR.surface }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{trackLabel(s.trackKey)}</div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, margin: '3px 0 6px', lineHeight: 1.45 }}>
            {s.units.slice(0, 2).map((u) => u.unit.title).join(' · ')}{s.units.length > 2 ? ` · +${s.units.length - 2} more` : ''}
          </div>
          <button className="btn-flat" onClick={() => onOpen(s.trackKey)} style={{ ...weakPill, color: ink(COLOR.red), border: `2px solid ${COLOR.red}` }}>Open the weak-subjects path ›</button>
        </div>
      ))}
    </div>
  );
}

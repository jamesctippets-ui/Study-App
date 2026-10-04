/* ---------------- Home study path (cross-cert) ---------------- */

// The Home tab's own learning path: one trail through every cert in the
// user's plan (see homePathRemaining in 03_helpers.js for how it is ordered).
// Steps run right here on Home using the same runner a cert's Path tab uses,
// and record to that cert's own progress; "Go deeper" opens the cert itself.

const HOME_PATH_MODE_LABELS = { interleave: 'Mix certs', block: 'One cert at a time' };

// Small colored cert tag shown on every step so a mixed trail stays legible.
function HomePathCertChip({ track }) {
  const accent = trackAccent(track.key);
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, color: accent, border: `1px solid ${accent}`, borderRadius: '999px', padding: '1px 7px', whiteSpace: 'nowrap' }}>
      {track.label}
    </span>
  );
}

// The collapsed Home card: progress, the up-next hero, and the next few steps.
function HomeStudyPath({ tracks, remaining, progress, mode, onSetMode, onStart, onOpenCert }) {
  const trackByKey = new Map(tracks.map((t) => [t.key, t]));
  const [first, ...rest] = remaining;
  const upcoming = rest.slice(0, HOME_PATH_UPCOMING);
  const later = rest.length - upcoming.length;
  const firstTrack = first ? trackByKey.get(first.trackKey) : null;
  const accent = firstTrack ? trackAccent(firstTrack.key) : COLOR.primary;
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
      <div className="flex justify-between items-baseline" style={{ marginBottom: '8px' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600 }}>Your study path</div>
        <div style={{ fontSize: '12px', color: COLOR.muted }}>{progress.done} of {progress.total} steps</div>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${progress.pct}%`, background: COLOR.success, borderRadius: '3px' }} />
      </div>
      <div className="flex gap-1" style={{ background: COLOR.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, marginBottom: '12px' }}>
        {HOME_PATH_MODES.map((m) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className="flex-1 btn-flat"
            style={{ padding: '5px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: mode === m ? COLOR.surfaceRaised : 'transparent', color: mode === m ? COLOR.text : COLOR.muted }}
          >
            {HOME_PATH_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {first && firstTrack ? (
        <React.Fragment>
          <button
            onClick={() => onStart(first)}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', background: accent, color: COLOR.onAccent, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '10px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {progress.done === 0 ? 'Start' : 'Continue'} · {firstTrack.label} · Unit {first.unit.index + 1}
              </span>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{first.step.label}</span>
            </span>
            <span style={{ fontSize: '18px' }}>›</span>
          </button>
          <button
            onClick={() => onOpenCert(firstTrack.key)}
            className="btn-flat"
            style={{ background: 'transparent', color: accent, fontSize: '11.5px', fontWeight: 600, padding: '8px 2px 0' }}
          >
            Go deeper in {firstTrack.label} ›
          </button>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.success, textAlign: 'center', padding: '6px 0' }}>
          Path complete — open any cert below to review it.
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: '10px', borderTop: `1px solid ${COLOR.border}`, paddingTop: '8px' }}>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '2px' }}>Coming up</div>
          {upcoming.map((e) => (
            <button
              key={e.trackKey + e.step.id}
              onClick={() => onStart(e)}
              className="btn-flat"
              style={{ width: '100%', textAlign: 'left', background: 'transparent', color: COLOR.text, display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}
            >
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: COLOR.surfaceRaised, color: COLOR.muted }}>
                <PathIcon kind={e.step.kind} size={15} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600 }}>{e.step.label}</span>
                <span style={{ display: 'block', fontSize: '10.5px', color: COLOR.muted }}>Unit {e.unit.index + 1} · {e.unit.title}</span>
              </span>
              {trackByKey.get(e.trackKey) && <HomePathCertChip track={trackByKey.get(e.trackKey)} />}
            </button>
          ))}
          {later > 0 && <div style={{ fontSize: '10.5px', color: COLOR.muted, paddingTop: '4px' }}>+ {later} more step{later === 1 ? '' : 's'} after these</div>}
        </div>
      )}
    </div>
  );
}

// A step running on Home (and the "step complete" screen after it). Takes
// over the Home tab while active, like a cert's own Path does on its tab.
function HomePathRun({ run, tracks, unitsByTrack, trackKeys, doneByTrack, mode, results, seenLog, speech, makeApi, onStart, onExit }) {
  const [completion, setCompletion] = useState(null);
  const track = tracks.find((t) => t.key === run.trackKey);
  const api = makeApi(run.trackKey);
  const units = unitsByTrack[run.trackKey] || [];

  const finish = (pct) => {
    const { unit, step } = run;
    if (step.kind === 'review') { onExit(); return; }
    const testedOut = step.kind === 'testout';
    const stepIds = testedOut ? unit.steps.map((s) => s.id) : [step.id];
    if (testedOut) api.completeSteps(stepIds, pct, 'testout');
    else api.completeStep(step.id, pct);
    // What's left once this step lands — doneByTrack hasn't re-rendered yet.
    const doneNow = { ...doneByTrack, [run.trackKey]: { ...(doneByTrack[run.trackKey] || {}) } };
    stepIds.forEach((id) => { doneNow[run.trackKey][id] = true; });
    const left = homePathRemaining(unitsByTrack, trackKeys, doneNow, mode);
    setCompletion({ pct, testedOut, next: left[0] || null, unitComplete: pathUnitProgress(unit, doneNow[run.trackKey]).complete });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (completion) {
    const nextTrack = completion.next ? tracks.find((t) => t.key === completion.next.trackKey) : null;
    return (
      <PathStepComplete
        unit={run.unit}
        step={run.step}
        pct={completion.pct}
        unitComplete={completion.unitComplete}
        testedOut={completion.testedOut}
        next={completion.next}
        nextLabel={completion.next && nextTrack ? `Next: ${nextTrack.label} · ${completion.next.step.label}` : null}
        onNext={() => onStart(completion.next)}
        onBack={onExit}
        backLabel="Back to Home"
      />
    );
  }

  return (
    <PathStepRunner
      key={run.step.id + '-' + run.nonce}
      trackKey={run.trackKey}
      units={units}
      unit={run.unit}
      step={run.step}
      results={results[run.trackKey] || {}}
      seenLog={seenLog[run.trackKey] || {}}
      categories={DATA[run.trackKey].categories}
      speech={speech}
      api={api}
      onDone={finish}
      onExit={onExit}
      exitLabel="‹ Back to Home"
      certLabel={track ? track.label : null}
    />
  );
}

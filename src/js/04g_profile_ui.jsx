/* ---------------- Profile: study stats, earned certs, plan ---------------- */

// The learner's own page: who they are (a display name and an avatar colour, both
// kept on this device with their progress), how much they have studied, their
// activity over the last twelve weeks, where each cert in their plan stands, the
// certs they have marked as passed, and their achievements. Everything here is
// read from data the app already tracks (results, spaced repetition, path
// progress, streak) plus the small activityLog added for the activity map.

const PROFILE_HUE_COLOR = {
  primary: COLOR.primary, blue: COLOR.blue, teal: COLOR.teal, success: COLOR.success,
  orange: COLOR.orange, pink: COLOR.pink, gold: COLOR.gold, red: COLOR.red,
};
const HEATMAP_WEEKS = 12;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function ProfileSection({ title, hue, right, children }) {
  return (
    <div style={{ boxShadow: SHADOW.card, background: tint(hue, 7), border: `2px solid color-mix(in srgb, ${hue} 38%, ${COLOR.border})`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px' }}>
      <div className="flex justify-between items-baseline" style={{ marginBottom: '10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', color: ink(hue) }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value, sub, hue }) {
  return (
    <div style={{ minWidth: 0, background: tint(hue, 13), border: `2px solid color-mix(in srgb, ${hue} 40%, ${COLOR.border})`, borderRadius: '14px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(hue) }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.15, marginTop: '2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '1px' }}>{sub}</div>}
    </div>
  );
}

// Twelve weeks of activity, one column per week, Monday at the top.
function ActivityMap({ log }) {
  const today = todayString();
  const dow = (new Date().getDay() + 6) % 7;            // Monday = 0
  const start = addDays(today, -(dow + 7 * (HEATMAP_WEEKS - 1)));
  const cells = [];
  for (let i = 0; i < HEATMAP_WEEKS * 7; i += 1) {
    const date = addDays(start, i);
    cells.push({ date, count: date > today ? null : (log[date] || 0) });
  }
  const level = (n) => (n >= 30 ? 4 : n >= 15 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0);
  const bg = (n) => (n === null ? 'transparent' : n === 0 ? COLOR.surfaceRaised : `color-mix(in srgb, ${COLOR.success} ${[0, 28, 52, 76, 100][level(n)]}%, ${COLOR.surfaceRaised})`);
  return (
    <div style={{ display: 'flex', gap: '6px' }} role="img" aria-label={`Study activity over the last ${HEATMAP_WEEKS} weeks`}>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: '3px', fontSize: '9.5px', color: COLOR.muted, paddingTop: '1px' }}>
        {DAY_LABELS.map((d, i) => <div key={i} style={{ height: '100%', display: 'flex', alignItems: 'center' }}>{d}</div>)}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: '3px' }}>
        {cells.map((c) => (
          <div
            key={c.date}
            title={c.count === null ? '' : `${formatDateShort(c.date)}: ${c.count} ${c.count === 1 ? 'action' : 'actions'}`}
            style={{ aspectRatio: '1 / 1', borderRadius: '3px', background: bg(c.count), border: c.date === today ? `1.5px solid ${COLOR.text}` : 'none' }}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileHeader({ profile, level, totalActions, firstDay, onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [hue, setHue] = useState(profile.hue);
  const color = PROFILE_HUE_COLOR[profile.hue] || COLOR.primary;
  const initial = (profile.name || 'You').trim().charAt(0).toUpperCase();
  const save = () => { onSave({ name: name.trim().slice(0, PROFILE_NAME_MAX), hue }); setEditing(false); };
  return (
    <div style={{ boxShadow: SHADOW.card, background: tint(color, 12), border: `2px solid color-mix(in srgb, ${color} 45%, ${COLOR.border})`, borderRadius: '18px', padding: '16px', marginBottom: '14px' }}>
      <div className="flex items-center" style={{ gap: '14px' }}>
        <div aria-hidden="true" style={{ width: '64px', height: '64px', borderRadius: '50%', background: color, color: COLOR.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, boxShadow: '0 5px 0 rgba(0,0,0,0.28)', flexShrink: 0 }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="itil-display" style={{ fontSize: '21px', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name || 'Your profile'}</div>
          <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '2px' }}>{firstDay ? `Studying since ${formatDateShort(firstDay)}` : 'Your study stats will build up here'}</div>
        </div>
        <button onClick={() => { setName(profile.name); setHue(profile.hue); setEditing((e) => !e); }} aria-expanded={editing} className="btn-flat" style={{ padding: '6px 12px', borderRadius: '10px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '12px', fontWeight: 700 }}>
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>
      {editing && (
        <div style={{ marginTop: '12px' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name or nickname" aria-label="Display name" maxLength={PROFILE_NAME_MAX} style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: `2px solid ${COLOR.border}`, background: COLOR.surface, color: COLOR.text, fontSize: '13px', marginBottom: '10px' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLOR.muted, marginBottom: '6px' }}>Avatar colour</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '12px' }}>
            {PROFILE_HUES.map((h) => (
              <button key={h} onClick={() => setHue(h)} aria-label={`Avatar colour ${h}`} aria-pressed={hue === h} className="btn-flat" style={{ width: '30px', height: '30px', borderRadius: '50%', background: PROFILE_HUE_COLOR[h], border: hue === h ? `3px solid ${COLOR.text}` : '3px solid transparent' }} />
            ))}
          </div>
          <button onClick={save} className="btn-3d" style={{ width: '100%', padding: '10px', borderRadius: '12px', background: color, color: COLOR.onAccent, fontSize: '13px', fontWeight: 800 }}>Save profile</button>
        </div>
      )}
      <div style={{ marginTop: '14px' }}>
        <div className="flex justify-between" style={{ fontSize: '12px', fontWeight: 800 }}>
          <span style={{ color: ink(color) }}>Level {level.level}</span>
          <span style={{ color: COLOR.muted, fontWeight: 600 }}>{level.into} / {level.span} to level {level.level + 1}</span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: COLOR.surfaceRaised, overflow: 'hidden', marginTop: '5px' }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.round((level.into / level.span) * 100))}%`, background: color, borderRadius: '4px' }} />
        </div>
        <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px' }}>{totalActions} study actions so far: every answer, card, game and step counts.</div>
      </div>
    </div>
  );
}

function ProfileView({ tracks, results, seenLog, srs, stats, certPlan, achievements, onSaveProfile, onToggleCompleted, onSelectTrack, onOpenCertPath, onOpenAchievements, onOpenData, onOpenGlossary }) {
  const log = stats.activityLog || {};
  const runs = useMemo(() => activityRuns(log), [log]);
  const totalActions = useMemo(() => Object.keys(log).reduce((n, d) => n + log[d], 0), [log]);
  const level = studyLevel(totalActions);
  const today = todayString();
  const week = useMemo(() => { let n = 0; for (let i = 0; i < 7; i += 1) n += log[addDays(today, -i)] || 0; return n; }, [log, today]);
  const bestDay = useMemo(() => Object.keys(log).reduce((m, d) => Math.max(m, log[d]), 0), [log]);

  const trackByKey = new Map(tracks.map((t) => [t.key, t]));
  const planKeys = certPlan.order.filter((k) => trackByKey.has(k));
  const certInfo = useMemo(() => {
    const out = {};
    planKeys.forEach((k) => {
      const units = buildPathUnits(k);
      const done = ((stats.path || {})[k] || {}).done || {};
      out[k] = {
        mastery: trackMastery(k, results),
        readiness: examReadiness(k, results, seenLog),
        path: units.length ? pathOverallProgress(units, done) : null,
      };
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKeys.join(','), results, seenLog, stats.path]);

  let attempted = 0;
  let correct = 0;
  tracks.forEach((t) => {
    const r = results[t.key] || {};
    Object.keys(r).forEach((id) => { attempted += 1; if (r[id] === 'correct') correct += 1; });
  });
  const cards = tracks.reduce((n, t) => n + Object.keys((srs || {})[t.key] || {}).length, 0);
  const steps = Object.keys(stats.path || {}).reduce((n, k) => n + Object.keys(((stats.path || {})[k] || {}).done || {}).length, 0);
  const earned = planKeys.filter((k) => certPlan.completed[k]).sort((a, b) => certPlan.completed[b].localeCompare(certPlan.completed[a]));
  const active = planKeys.filter((k) => !certPlan.completed[k]);
  const upcoming = active.filter((k) => certPlan.scheduled[k]).sort((a, b) => certPlan.scheduled[a].localeCompare(certPlan.scheduled[b]));
  const unlocked = achievements.filter((a) => a.unlocked);
  const studyingKey = active[0];

  return (
    <div>
      <ProfileHeader profile={stats.profile || { name: '', hue: 'primary' }} level={level} totalActions={totalActions} firstDay={runs.first} onSave={onSaveProfile} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <StatTile label="Day streak" value={`🔥 ${stats.streak.current}`} sub={`Best: ${Math.max(stats.streak.longest, stats.streak.current)} days`} hue={COLOR.orange} />
        <StatTile label="Days studied" value={runs.days} sub={`${week} actions this week`} hue={COLOR.success} />
        <StatTile label="Questions" value={attempted} sub={attempted ? `${Math.round((correct / attempted) * 100)}% last answered right` : 'Answer one to start'} hue={COLOR.blue} />
        <StatTile label="Cards reviewed" value={cards} sub="in spaced repetition" hue={COLOR.teal} />
        <StatTile label="Path steps" value={steps} sub={`${stats.counts.matchRoundsCompleted} match rounds`} hue={COLOR.primary} />
        <StatTile label="Exams passed" value={stats.counts.examsPassed + stats.counts.finalMocksPassed} sub={`${stats.counts.perfectQuizzes} perfect quizzes`} hue={COLOR.gold} />
      </div>

      <ProfileSection title="Activity" hue={COLOR.success} right={<span style={{ fontSize: '11.5px', color: COLOR.muted }}>Best day: {bestDay}</span>}>
        <ActivityMap log={log} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '10.5px', color: COLOR.muted, marginTop: '8px' }}>
          Less
          {[0, 28, 52, 76, 100].map((p) => <span key={p} style={{ width: '11px', height: '11px', borderRadius: '3px', background: p === 0 ? COLOR.surfaceRaised : `color-mix(in srgb, ${COLOR.success} ${p}%, ${COLOR.surfaceRaised})` }} />)}
          More
        </div>
      </ProfileSection>

      <ProfileSection title="Earned certifications" hue={COLOR.gold} right={<span style={{ fontSize: '11.5px', color: COLOR.muted }}>{earned.length} earned</span>}>
        {earned.length ? (
          <div className="flex flex-col gap-2">
            {earned.map((k) => {
              const t = trackByKey.get(k);
              const accent = trackAccent(k);
              return (
                <div key={k} className="flex items-center" style={{ gap: '12px', padding: '10px 12px', borderRadius: '12px', background: tint(accent, 14), border: `2px solid ${accent}` }}>
                  <span aria-hidden="true" style={{ width: '38px', height: '38px', borderRadius: '50%', background: accent, color: COLOR.onAccent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 rgba(0,0,0,0.28)', flexShrink: 0 }}><TabIcon kind="exam" size={20} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: ink(accent) }}>{t.label} · Passed</span>
                    <span style={{ display: 'block', fontSize: '12px', color: COLOR.muted }}>{t.subtitle} · {formatDateShort(certPlan.completed[k])}</span>
                  </span>
                  <button onClick={() => onToggleCompleted(k)} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, fontSize: '11.5px', fontWeight: 700, padding: 0 }}>Undo</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
            Passed an exam? Tap <strong>Mark as passed</strong> on a cert in your plan below and it appears here as an earned certification.
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="My plan" hue={COLOR.primary} right={<button onClick={onOpenCertPath} className="btn-flat" style={{ background: 'transparent', color: ink(COLOR.primary), fontSize: '12px', fontWeight: 800, padding: 0 }}>Manage ›</button>}>
        {active.length ? (
          <div className="flex flex-col gap-2">
            {active.map((k) => {
              const t = trackByKey.get(k);
              const accent = trackAccent(k);
              const info = certInfo[k] || {};
              const sched = certPlan.scheduled[k];
              const days = sched ? daysBetween(today, sched) : null;
              return (
                <div key={k} style={{ padding: '10px 12px', borderRadius: '12px', background: tint(accent, k === studyingKey ? 16 : 8), border: `2px solid ${k === studyingKey ? accent : `color-mix(in srgb, ${accent} 30%, ${COLOR.border})`}` }}>
                  <div className="flex justify-between items-baseline" style={{ gap: '8px' }}>
                    <button onClick={() => onSelectTrack(k)} className="btn-flat" style={{ background: 'transparent', padding: 0, textAlign: 'left', fontSize: '14px', fontWeight: 800, color: ink(accent) }}>{t.label}{k === studyingKey ? <span style={{ fontSize: '10.5px', marginLeft: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Studying now</span> : null}</button>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{info.mastery}%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '1px' }}>{t.subtitle}</div>
                  <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginTop: '8px' }}>
                    <div style={{ height: '100%', width: `${info.path ? info.path.pct : info.mastery || 0}%`, background: accent, borderRadius: '3px' }} />
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '5px', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{info.path ? `Path ${info.path.pct}% · ${info.path.unitsComplete}/${info.path.unitCount} units` : 'Practice-only cert'}</span>
                    <span>{info.readiness && info.readiness.label !== 'Not started' ? `${info.readiness.label} · ${info.readiness.score}% ready` : 'Not started'}</span>
                  </div>
                  <div className="flex justify-between items-center" style={{ marginTop: '6px', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: days !== null && days >= 0 && days <= 7 ? COLOR.gold : COLOR.muted }}>
                      {sched ? (days < 0 ? `Exam was ${-days}d ago` : days === 0 ? 'Exam today' : `Exam in ${days} days · ${formatDateShort(sched)}`) : 'No exam date set'}
                    </span>
                    <button onClick={() => onToggleCompleted(k)} className="btn-flat" style={{ padding: '3px 10px', borderRadius: '8px', border: `2px solid ${COLOR.success}`, background: 'transparent', color: COLOR.success, fontSize: '11.5px', fontWeight: 800 }}>Mark as passed</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
            Your plan is empty. Add the certs you are working toward from the menu and they show up here with progress and exam countdowns.
            <button onClick={onOpenCertPath} className="btn-3d" style={{ display: 'block', width: '100%', marginTop: '10px', padding: '10px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 800 }}>Build my plan</button>
          </div>
        )}
        {upcoming.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${COLOR.border}`, fontSize: '12px', color: COLOR.muted }}>
            Next exam: <strong style={{ color: COLOR.text }}>{trackByKey.get(upcoming[0]).label}</strong> on {formatDateShort(certPlan.scheduled[upcoming[0]])}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Achievements" hue={COLOR.pink} right={<button onClick={onOpenAchievements} className="btn-flat" style={{ background: 'transparent', color: ink(COLOR.pink), fontSize: '12px', fontWeight: 800, padding: 0 }}>See all ›</button>}>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '8px' }}>{unlocked.length} of {achievements.length} unlocked</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {achievements.map((a) => (
            <span key={a.id} title={`${a.title}: ${a.description}`} style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', background: a.unlocked ? tint(COLOR.pink, 18) : COLOR.surfaceRaised, border: `2px solid ${a.unlocked ? COLOR.pink : COLOR.border}`, filter: a.unlocked ? 'none' : 'grayscale(1)', opacity: a.unlocked ? 1 : 0.45 }}>{a.icon}</span>
          ))}
        </div>
      </ProfileSection>

      <div className="flex gap-2" style={{ marginBottom: '8px' }}>
        <button onClick={onOpenData} className="btn-flat flex-1" style={{ padding: '11px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 700 }}>Settings &amp; data</button>
        <button onClick={onOpenGlossary} className="btn-flat flex-1" style={{ padding: '11px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 700 }}>My terms</button>
      </div>
    </div>
  );
}

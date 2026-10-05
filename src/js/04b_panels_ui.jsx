/* ---------------- shared UI: overlay panels (about, glossary, terms) ---------------- */

// A single bottom-sheet, same visual pattern as every other panel, holding
// everything that isn't study content but still needs to live somewhere:
// what the app is, what's changed recently, and the legal basics (Terms,
// Privacy, disclaimer). Kept as one panel with collapsible sections rather
// than separate screens/routes — this is a single static HTML file with no
// real routing, and folding it into the existing hamburger menu (as an
// "About & Legal" link) means zero new header chrome. Content here
// reflects today's actual data footprint (no accounts, no PII, no cookies)
// and should be revisited if that ever changes — see LAUNCH_CHECKLIST.md.
function AboutSection({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ marginBottom: '10px' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '12px', fontSize: '13px', color: COLOR.text, fontWeight: 600 }}
      >
        {open ? '▾ ' : '▸ '}{title}
      </button>
      {open && (
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px', fontSize: '12.5px', lineHeight: 1.6, color: COLOR.muted }}>
          {children}
        </div>
      )}
    </div>
  );
}

// A cross-track term lookup — every flashcard's front across every
// visible track, deduplicated and alphabetized (buildGlossaryEntries in
// 03_helpers.js), so a term you half-remember from a different cert
// doesn't require guessing which track it lives in. Computed once per
// panel open (flashcards don't change mid-session) rather than on every
// keystroke; the search itself just filters that fixed list.
function GlossaryPanel({ onClose }) {
  useEscapeToClose(onClose);
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const [tab, setTab] = useState('terms');
  const entries = useMemo(() => buildGlossaryEntries(), []);
  const acronymEntries = useMemo(
    () => Object.keys(ACRONYMS).sort((a, b) => a.localeCompare(b)).map((k) => ({ key: k, exps: acronymExpansions(k) })),
    []
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.front.toLowerCase().includes(q) || e.back.toLowerCase().includes(q));
  }, [entries, query]);
  const filteredAcronyms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return acronymEntries;
    return acronymEntries.filter((a) => a.key.toLowerCase().includes(q) || a.exps.some((e) => e.toLowerCase().includes(q)));
  }, [acronymEntries, query]);
  const shown = filtered.slice(0, 200);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Glossary</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
          Every term across all {TRACKS.filter((t) => !t.hidden).length} tracks, in one searchable list — a term
          explained once here shows every track that uses it, not just whichever one you're currently in.
        </div>
        <div className="flex gap-1" style={{ background: COLOR.surface, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, marginBottom: '10px' }}>
          {[['terms', `Terms (${entries.length})`], ['acronyms', `Acronyms (${acronymEntries.length})`]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setExpandedKey(null); }}
              className="flex-1 btn-flat"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600, background: tab === k ? COLOR.surfaceRaised : 'transparent', color: tab === k ? COLOR.text : COLOR.muted }}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'terms' ? 'Search terms…' : 'Search acronyms or what they stand for…'}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${COLOR.border}`,
            background: COLOR.surface, color: COLOR.text, fontSize: '13px', marginBottom: '10px',
          }}
        />
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '8px' }}>
          {tab === 'terms'
            ? `${filtered.length} term${filtered.length === 1 ? '' : 's'}${filtered.length > shown.length ? ` (showing first ${shown.length})` : ''}`
            : `${filteredAcronyms.length} acronym${filteredAcronyms.length === 1 ? '' : 's'}`}
        </div>
        {tab === 'acronyms' && (
          <div className="flex flex-col gap-2">
            {filteredAcronyms.map((a) => (
              <div key={a.key} style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '9px 12px', display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                <span className="itil-display" style={{ fontSize: '14px', fontWeight: 700, color: COLOR.gold, minWidth: '56px' }}>{a.key}</span>
                <span style={{ fontSize: '13px', color: COLOR.text, lineHeight: 1.45 }}>{a.exps.join(' / ')}</span>
              </div>
            ))}
            {!filteredAcronyms.length && (
              <div style={{ fontSize: '12px', color: COLOR.muted, textAlign: 'center', padding: '20px 0' }}>No acronyms match "{query}".</div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2" style={{ display: tab === 'terms' ? undefined : 'none' }}>
          {shown.map((entry) => {
            const key = entry.front.toLowerCase();
            const open = expandedKey === key;
            return (
              <div key={key} style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '10px 12px' }}>
                <button
                  onClick={() => setExpandedKey(open ? null : key)}
                  className="btn-flat"
                  style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLOR.text }}>{entry.front}</div>
                  <div className="flex gap-1" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
                    {entry.tracks.map((tk) => {
                      const t = TRACKS.find((tt) => tt.key === tk);
                      const accent = trackAccent(tk);
                      return (
                        <span
                          key={tk}
                          style={{ fontSize: '10px', fontWeight: 700, color: accent, border: `1px solid ${accent}`, borderRadius: '999px', padding: '1px 6px' }}
                        >
                          {t ? t.label : tk}
                        </span>
                      );
                    })}
                  </div>
                </button>
                {open && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${COLOR.border}`, fontSize: '13px', color: COLOR.muted, lineHeight: 1.5 }}>
                    {entry.back}
                    {(() => {
                      const a = flyoutAcronyms({ front: entry.front, back: entry.back });
                      const all = [...a.lead, ...a.footer];
                      return all.length ? (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: COLOR.gold, lineHeight: 1.5 }}>
                          {all.map((k, i) => <React.Fragment key={k}>{i > 0 ? ' · ' : ''}<strong>{k}</strong> {acronymExpansions(k).join(' or ')}</React.Fragment>)}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
          {!shown.length && (
            <div style={{ fontSize: '12px', color: COLOR.muted, textAlign: 'center', padding: '20px 0' }}>
              No terms match "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutLegalPanel({ onClose }) {
  useEscapeToClose(onClose);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>About & Legal</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>

        <AboutSection title="About Cert Study Hub" defaultOpen>
          <p style={{ margin: '0 0 8px' }}>
            An independent study tool for IT certification exam prep — flashcards, timed quizzes, full mock
            exams, scenario-based practice (Mad Libs and mini case studies), and printable cheat sheets across
            Microsoft Azure/M365, CompTIA, ITIL, and a healthcare interoperability track.
          </p>
          <p style={{ margin: 0 }}>
            Found a wrong or outdated question, or have feedback? Reach out at{' '}
            <a href="mailto:james.c.tippets@gmail.com" style={{ color: COLOR.primary }}>james.c.tippets@gmail.com</a>.
          </p>
        </AboutSection>

        <AboutSection title="What's new">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Home is now a real dashboard led by your own cert path — add the certs you're working toward and Home tracks progress, exam readiness, and a scheduled-date countdown for each right on the landing screen, with a header hamburger reaching "Manage cert path" and a house icon returning Home from anywhere.</li>
            <li>New <strong>Case Study</strong> Quiz mode: a shared real-world scenario with several related questions answered in sequence, mirroring how associate/expert-level exams group multiple questions off one larger case instead of testing each fact in isolation — live across all 15 tracks.</li>
            <li><strong>Mad Libs</strong> scenarios grew to 79 across all 15 tracks (up from 49), alongside 50 new flashcards written to reference other terms by name, so the tap-to-define flyouts fire more often.</li>
            <li>"On the job" callouts (what a lesson means beyond the exam) and "Why this is tested" notes on trickier questions, plus new cross-course callouts that point out when a concept here is the exact same one another cert tests.</li>
            <li>Smarter default text-to-speech voice selection and smoother sentence-by-sentence playback for every 🔊 Listen button and Verbal Quiz.</li>
            <li>Quiz modes: <strong>Verbal Quiz</strong> (hands-free, audio-only), <strong>Commands</strong> (type real Azure CLI/PowerShell syntax), and <strong>Sequence</strong> (reorder the steps of a real procedure).</li>
            <li>A cross-track Glossary, per-category mastery trends, progress export/import, a daily streak, and 17 milestone achievements.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Terms of Use">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>This is an independent study aid, not an official course, and using it is not a guarantee of passing any exam.</li>
            <li>Content is provided "as is," reviewed for accuracy at the time it was written, but certification exam objectives change over time — always cross-check against the vendor's current official objectives before your exam.</li>
            <li>No account or sign-up is required. You're responsible for how you use the app; please don't attempt to disrupt, scrape at scale, or misrepresent the service.</li>
            <li>All questions, explanations, and study content are original writing, not reproductions of real exam questions.</li>
            <li>To the fullest extent permitted by law, the app is provided without warranty of any kind, and liability for its use is limited accordingly.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Privacy Policy">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>No accounts, no sign-up, and no personal information is collected by this app.</li>
            <li>Your progress (flashcard/quiz/exam results, streak, achievements) is stored either in this browser's local storage, on this device only, or — if you opened this inside a Claude artifact — synced through your own Claude account. It is never sent to a separate server run by this app.</li>
            <li>No cookies, no third-party analytics, and no ad tracking are used today. If that ever changes, this policy will be updated first, before it happens.</li>
            <li>You can download a full copy of your progress, or clear it, anytime from the ⚙ Data & Progress panel.</li>
            <li>If this app ever adds its own accounts or its own cloud sync, this policy will be rewritten to describe exactly what's collected, how long it's kept, and how to delete it.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Disclaimer & trademarks">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Microsoft, Azure, Microsoft 365, Microsoft Copilot, Entra ID, CompTIA, Cloud+, ITIL, AXELOS, HL7, and FHIR are trademarks of their respective owners. This app is not affiliated with, endorsed by, or sponsored by any of them — those names are used only to describe which exam (or, for the healthcare interoperability track, which industry standards) each track covers.</li>
            <li>Real Azure Portal screenshots shown in some lessons are sourced from Microsoft's own CC BY 4.0-licensed documentation, with attribution shown alongside each one.</li>
            <li>Passing a real certification exam depends on many factors beyond any single study tool. Nothing here is a guarantee of exam results.</li>
          </ul>
        </AboutSection>

        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '6px' }}>
          This is a first draft written for a small independent project, not legal advice — worth a proper review before wider release.
        </div>
      </div>
    </div>
  );
}

// A small flyout anchored directly under the term that was clicked (see
// TermTrigger in 02_portal_mockups.jsx, which renders this as the absolute-
// positioned child of the specific word's own relatively-positioned
// wrapper) — not a block appended below the whole paragraph/card. The
// `term-flyout` class is what useClickOutsideToClose looks for to know a
// click landed inside it rather than outside.
function TermFlyout({ term, triggerText, context, onClose, shift, arrowLeft }) {
  if (!term) return null;
  const s = shift || 0;
  const acr = flyoutAcronyms(term, triggerText);
  const ctx = `${context || ''} ${term.front || ''} ${term.back || ''} ${term.detail || ''}`;
  // The best-fitting meaning for this context first; any others are shown
  // quietly after it so an ambiguous acronym (CA, SAS...) never misleads.
  const meanings = (key) => acronymExpansions(key, ctx);
  const spell = (key) => meanings(key)[0];
  const alsoMeans = (key) => meanings(key).slice(1);
  return (
    <span
      className="term-flyout"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
        transform: s ? `translateX(${s}px)` : undefined,
        display: 'block', width: 'max-content', maxWidth: 'min(280px, 78vw)',
        background: COLOR.surfaceRaised, border: `1px solid ${COLOR.primary}`, borderRadius: '12px',
        padding: '10px 12px', boxShadow: SHADOW.card, textAlign: 'left', whiteSpace: 'normal',
        fontWeight: 400, fontStyle: 'normal',
      }}
    >
      <span
        style={{
          position: 'absolute', top: '-5px', left: `${arrowLeft != null ? arrowLeft : 14}px`, width: '9px', height: '9px',
          background: COLOR.surfaceRaised, borderLeft: `1px solid ${COLOR.primary}`, borderTop: `1px solid ${COLOR.primary}`,
          transform: 'rotate(45deg)',
        }}
      />
      <span className="flex justify-between items-start" style={{ display: 'flex', marginBottom: '4px', position: 'relative' }}>
        <span className="itil-display" style={{ fontSize: '13px', fontWeight: 600, color: COLOR.primary }}>{term.front}</span>
        <button onClick={onClose} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, padding: '0 0 0 8px', fontSize: '12px' }}>✕</button>
      </span>
      {acr.lead.map((k) => (term.acronymOnly ? (
        <span key={k} style={{ display: 'block', fontSize: '12.5px', lineHeight: 1.5, color: COLOR.text, position: 'relative' }}>
          Stands for <strong>{spell(k)}</strong>
          {alsoMeans(k).length > 0 && <span style={{ color: COLOR.muted, fontSize: '11px' }}> (also: {alsoMeans(k).join('; ')})</span>}
        </span>
      ) : (
        <span key={k} style={{ display: 'block', fontSize: '12px', lineHeight: 1.45, color: COLOR.gold, marginBottom: '4px', position: 'relative' }}>
          <strong>{k}</strong> stands for {spell(k)}
          {alsoMeans(k).length > 0 && <span style={{ color: COLOR.muted, fontSize: '11px' }}> (also: {alsoMeans(k).join('; ')})</span>}
        </span>
      )))}
      {term.back && <span style={{ display: 'block', fontSize: '12.5px', lineHeight: 1.5, color: COLOR.text, position: 'relative' }}>{term.back}</span>}
      {term.detail && (
        <span style={{ display: 'block', fontSize: '11.5px', lineHeight: 1.5, color: COLOR.muted, marginTop: '6px', borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '8px', position: 'relative' }}>
          {term.detail}
        </span>
      )}
      {acr.footer.length > 0 && (
        <span style={{ display: 'block', fontSize: '11.5px', lineHeight: 1.5, color: COLOR.muted, marginTop: '6px', paddingTop: '5px', borderTop: `1px solid ${COLOR.border}`, position: 'relative' }}>
          {acr.footer.map((k, i) => (
            <React.Fragment key={k}>{i > 0 ? ' · ' : ''}<strong>{k}</strong> {spell(k)}</React.Fragment>
          ))}
        </span>
      )}
    </span>
  );
}

// The single category filter used above Cards, Study (flat tracks), and
// both Quiz sub-views (Questions/Match) — a dropdown instead of a
// horizontally-scrolling chip row, since a phone-width chip row for a
// 5+ category track always needed a scroll-fade hint and a swipe just to
// see what else was available. Each category's live mastery % rides along
// in its option label instead of a hover-only tooltip, since a <select>'s
// options have no hover state worth relying on.
function CategoryFilterSelect({ categories, activeCat, onChange, masteryByCategory }) {
  return (
    <select
      value={activeCat}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', marginBottom: '18px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        border: `1px solid ${COLOR.primary}`, background: 'rgba(167,139,250,0.14)', color: COLOR.primary,
      }}
    >
      <option value="all">All categories</option>
      {categories.map((c) => (
        <option key={c.key} value={c.key}>{c.label} ({Math.round((masteryByCategory[c.key] || 0) * 100)}% mastered)</option>
      ))}
    </select>
  );
}


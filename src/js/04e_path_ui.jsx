/* ---------------- guided study path ---------------- */

function PathView({ track }) {
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
      <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>{track.label} study path</div>
      <div style={{ fontSize: '12.5px', color: COLOR.muted }}>Guided path coming together.</div>
    </div>
  );
}

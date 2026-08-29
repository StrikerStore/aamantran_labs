/**
 * Renders the schema-vs-HTML comparison returned by the backend.
 *
 * `error` findings mean something will silently render empty in production —
 * the failure mode this check exists for. `warn` findings are declarations the
 * HTML never reads, which is usually a typo on one side or the other but is
 * sometimes deliberate.
 *
 * Nothing here blocks a save. The backend's parse is a regex over Handlebars
 * source rather than a real compile, so it can be wrong — a developer who knows
 * better has to be able to carry on.
 */
export function Findings({ analysis }) {
  if (!analysis) return null;

  if (analysis.skipped) {
    return (
      <div className="finding warn" style={{ marginTop: 12 }}>
        <span>Could not read the template's HTML to check it — {analysis.skipped}</span>
      </div>
    );
  }

  const warnings = analysis.warnings || [];
  if (!warnings.length) {
    return (
      <div className="findings-ok">
        ✓ Schema matches the HTML — every key the template prints is declared, and
        everything declared is used.
      </div>
    );
  }

  const errors = warnings.filter((w) => w.level === 'error');
  const warns  = warnings.filter((w) => w.level !== 'error');

  return (
    <div className="findings">
      {[...errors, ...warns].map((w, i) => (
        <div key={`${w.kind}-${w.key}-${i}`} className={`finding ${w.level}`}>
          <span className="finding-key">{w.level === 'error' ? '✕' : '!'}</span>
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}

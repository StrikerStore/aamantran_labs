import { Panel } from './Panel';

/**
 * The seeded scenarios, with a record of which ones have been looked at.
 *
 * A template's happy path almost always works; what breaks is the `{{#if}}`
 * guard around an optional field. The tick marks exist because the failure mode
 * is not "the developer could not test the empty case" but "the developer
 * forgot there was one".
 */
export function ScenarioBar({ presets, presetKeys, activePreset, checked, busy, onApply, onClear }) {
  const total = presetKeys.length;
  const done  = checked.filter((k) => presetKeys.includes(k)).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <Panel
      title="Test scenarios"
      badge={
        <span className={`badge ${allDone ? 'badge-active' : 'badge-idle'}`}>
          {done}/{total} reviewed
        </span>
      }
    >
      <div className="scenario-meter">
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
        <span className="scenario-count">{pct}%</span>
        {done > 0 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>
            Reset ticks
          </button>
        )}
      </div>

      <div className="preset-grid">
        {presetKeys.map((key) => {
          const preset = presets[key];
          return (
            <button
              key={key}
              type="button"
              className={`preset ${activePreset === key ? 'on' : ''}`}
              disabled={busy}
              onClick={() => onApply(key)}
            >
              {checked.includes(key) && (
                <span className="preset-tick" aria-label="Reviewed">&#10003;</span>
              )}
              <b>{preset.label}</b>
              <span>{preset.hint}</span>
            </button>
          );
        })}
      </div>

      <p className="hint">
        Applying a scenario rebuilds the sandbox data and reloads the preview. Anything typed
        into Content below is replaced.
      </p>
    </Panel>
  );
}

import { useRef } from 'react';
import { Panel } from './Panel';

/**
 * The seeded values themselves.
 *
 * Presets cover the scenarios worth walking; this panel is for the one-off
 * check a preset cannot express: a very long name, a single cleared field,
 * a specific music track.
 */
export function ContentPanel({ form, setField, assets, busy, onSave, onReset }) {
  const audioRef = useRef(null);

  if (!form) return null;

  return (
    <Panel title="Content" defaultOpen={false}>
      <div className="row">
        <div className="field">
          <label className="label" htmlFor="groom">Groom name</label>
          <input
            id="groom"
            className="input"
            value={form.groomName}
            onChange={(e) => setField('groomName', e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="bride">Bride name</label>
          <input
            id="bride"
            className="input"
            value={form.brideName}
            onChange={(e) => setField('brideName', e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label className="label" htmlFor="ig">Instagram URL</label>
          <input
            id="ig"
            className="input"
            value={form.instagramUrl}
            onChange={(e) => setField('instagramUrl', e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="tag">Hashtag (no #)</label>
          <input
            id="tag"
            className="input"
            value={form.instagramHashtag}
            onChange={(e) => setField('instagramHashtag', e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label className="label" htmlFor="yt">YouTube URL</label>
          <input
            id="yt"
            className="input"
            value={form.socialYoutubeUrl}
            onChange={(e) => setField('socialYoutubeUrl', e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="site">Website URL</label>
          <input
            id="site"
            className="input"
            value={form.websiteUrl}
            onChange={(e) => setField('websiteUrl', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <span className="label">Guest features</span>
        <div className="btn-row">
          <label className="check">
            <input
              type="checkbox"
              checked={form.rsvpEnabled}
              onChange={(e) => setField('rsvpEnabled', e.target.checked)}
            />
            RSVP enabled
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.guestNotesEnabled}
              onChange={(e) => setField('guestNotesEnabled', e.target.checked)}
            />
            Guest wishes enabled
          </label>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="music">Background music</label>
        <select
          id="music"
          className="select"
          value={form.musicUrl}
          onChange={(e) => {
            setField('musicUrl', e.target.value);
            if (audioRef.current && e.target.value) {
              audioRef.current.src = e.target.value;
              audioRef.current.play().catch(() => {});
            }
          }}
        >
          <option value="">No music (tests the empty case)</option>
          {assets.map((a) => (
            <option key={a.id} value={a.url}>{a.name}</option>
          ))}
        </select>
        <audio
          ref={audioRef}
          controls
          style={{ width: '100%', marginTop: 10 }}
          src={form.musicUrl || undefined}
        />
        <p className="hint">
          Tracks come from the shared Aamantran library. Selecting one writes it to the music
          media slot, so <code>{'{{music_url}}'}</code> resolves.
        </p>
      </div>

      {form.customFields.length > 0 && (
        <div className="field">
          <span className="label">Custom field values</span>
          {form.customFields.map((f, i) => (
            <div className="field" key={f.fieldKey}>
              <label className="label" style={{ textTransform: 'none', letterSpacing: 0 }}>
                <code>{`{{${f.fieldKey}}}`}</code>
              </label>
              <textarea
                className="textarea"
                style={{ minHeight: 60 }}
                value={f.fieldValue}
                onChange={(e) => {
                  const next = [...form.customFields];
                  next[i] = { ...next[i], fieldValue: e.target.value };
                  setField('customFields', next);
                }}
              />
            </div>
          ))}
          <p className="hint">
            Clear one to check your <code>{'{{#if}}'}</code> fallback renders correctly.
          </p>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn btn-primary" disabled={busy} onClick={onSave}>
          Save content
        </button>
        <button className="btn" disabled={busy} onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </Panel>
  );
}

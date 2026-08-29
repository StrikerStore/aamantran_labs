import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { Findings } from '../components/Findings';

/**
 * Everything that fills the invite: the schema that declares custom keys, the
 * seeded values themselves, the music track, and the empty-state presets.
 *
 * The presets are the point of this page. A template's happy path almost always
 * works; what breaks is the `{{#if}}` guard around an optional field. One click
 * per scenario is cheaper than editing a dozen fields by hand.
 */
export default function Sandbox() {
  const toast = useToast();

  const [data, setData]       = useState(null);
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  const [schemaText, setSchemaText] = useState('');
  const [form, setForm] = useState(null);
  const [activePreset, setActivePreset] = useState('full');
  const [analysis, setAnalysis] = useState(null);
  const audioRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [sandbox, assetList] = await Promise.all([api.sandbox.get(), api.assets.list()]);
      setData(sandbox);
      setAssets(assetList.assets || []);

      if (sandbox.event?.template?.id) {
        const schema = await api.templates.getSchema(sandbox.event.template.id);
        setSchemaText(schema.fieldSchema ? JSON.stringify(schema.fieldSchema, null, 2) : '');
      }

      const c = sandbox.content;
      if (c) {
        setForm({
          groomName: sandbox.event?.groomName || '',
          brideName: sandbox.event?.brideName || '',
          instagramUrl:     c.links.instagramUrl     || '',
          instagramHashtag: c.links.instagramHashtag || '',
          socialYoutubeUrl: c.links.socialYoutubeUrl || '',
          websiteUrl:       c.links.websiteUrl       || '',
          rsvpEnabled:       c.toggles.rsvpEnabled,
          guestNotesEnabled: c.toggles.guestNotesEnabled,
          musicUrl: c.media?.find((m) => m.type === 'music')?.url || '',
          customFields: (c.customFields || []).map((f) => ({ ...f })),
        });
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function run(fn, msg) {
    setBusy(true);
    try {
      const res = await fn();
      if (msg) toast(msg, 'success');
      await load();
      return res;
    } catch (err) {
      toast(err.message, 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveContent() {
    await run(
      () => api.sandbox.save({
        groomName: form.groomName,
        brideName: form.brideName,
        links: {
          instagramUrl:     form.instagramUrl,
          instagramHashtag: form.instagramHashtag,
          socialYoutubeUrl: form.socialYoutubeUrl,
          websiteUrl:       form.websiteUrl,
        },
        toggles: {
          rsvpEnabled:       form.rsvpEnabled,
          guestNotesEnabled: form.guestNotesEnabled,
        },
        customFields: form.customFields,
        musicUrl: form.musicUrl,
      }),
      'Saved — refresh the invite to see it',
    );
  }

  async function saveSchema() {
    const templateId = data?.event?.template?.id;
    if (!templateId) return;

    let parsed = null;
    if (schemaText.trim()) {
      try {
        parsed = JSON.parse(schemaText);
      } catch (err) {
        toast(`Schema is not valid JSON — ${err.message}`, 'error');
        return;
      }
    }
    const res = await run(
      () => api.templates.putSchema(templateId, { fieldSchema: parsed }),
      'Schema saved — sample values re-derived for every declared key',
    );
    if (res?.analysis) setAnalysis(res.analysis);
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  if (!data?.event) {
    return (
      <div>
        <div className="page-head">
          <h1 className="page-title">Sandbox content</h1>
        </div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📭</div>
            Upload a template first — the sandbox fills itself once one is active.
          </div>
        </div>
      </div>
    );
  }

  const presets = data.presets || {};

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Sandbox content</h1>
        <p className="page-sub">
          Rendering <strong>{data.event.template?.name}</strong> at{' '}
          <code style={{ fontSize: '0.8rem' }}>/i/{data.event.slug}</code>
        </p>
      </div>

      {/* ── Presets ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Test scenarios</span>
        </div>
        <div className="card-body">
          <div className="preset-grid">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                className={`preset ${activePreset === key ? 'on' : ''}`}
                disabled={busy}
                onClick={async () => {
                  const res = await run(() => api.sandbox.preset(key), `Applied: ${preset.label}`);
                  if (res) setActivePreset(key);
                }}
              >
                <b>{preset.label}</b>
                <span>{preset.hint}</span>
              </button>
            ))}
          </div>
          <p className="hint">
            Applying a scenario rebuilds the sandbox data. Anything you typed below is replaced.
          </p>
        </div>
      </div>

      {/* ── Schema ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Field schema</span>
        </div>
        <div className="card-body">
          <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
            Declare your custom keys, person roles and media slots here. On save, every declared
            custom key is given a sample value automatically — that is what makes{' '}
            <code>{'{{your_key}}'}</code> render instead of staying blank.
          </p>
          <textarea
            className="textarea code"
            spellCheck="false"
            placeholder={'{\n  "customFields": [\n    { "key": "couple_story", "label": "Your story", "type": "textarea" }\n  ],\n  "mediaSlots": [\n    { "key": "couple_carousel", "type": "photo", "multiple": true }\n  ]\n}'}
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
          />
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" disabled={busy} onClick={saveSchema}>
              Save schema &amp; reseed
            </button>
          </div>

          <Findings analysis={analysis} />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {form && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Content</span>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="field">
                <label className="label">Groom name</label>
                <input className="input" value={form.groomName} onChange={(e) => setField('groomName', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Bride name</label>
                <input className="input" value={form.brideName} onChange={(e) => setField('brideName', e.target.value)} />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Instagram URL</label>
                <input className="input" value={form.instagramUrl} onChange={(e) => setField('instagramUrl', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Hashtag (no #)</label>
                <input className="input" value={form.instagramHashtag} onChange={(e) => setField('instagramHashtag', e.target.value)} />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">YouTube URL</label>
                <input className="input" value={form.socialYoutubeUrl} onChange={(e) => setField('socialYoutubeUrl', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Website URL</label>
                <input className="input" value={form.websiteUrl} onChange={(e) => setField('websiteUrl', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <span className="label">Guest features</span>
              <div className="row">
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

            {/* ── Music ── */}
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
                <option value="">— No music (tests the empty case) —</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.url}>{a.name}</option>
                ))}
              </select>
              <audio ref={audioRef} controls style={{ width: '100%', marginTop: 8 }} src={form.musicUrl || undefined} />
              <p className="hint">
                Tracks come from the shared Aamantran library. Selecting one writes it to the
                music media slot, so <code>{'{{music_url}}'}</code> resolves.
              </p>
            </div>

            {/* ── Custom field values ── */}
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
              <button className="btn btn-primary" disabled={busy} onClick={saveContent}>
                Save content
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => run(() => api.sandbox.reset(), 'Sandbox reset to the default dataset')}
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

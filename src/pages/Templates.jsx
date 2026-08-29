import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { CopyField } from '../components/CopyField';
import { Findings } from '../components/Findings';
import { absoluteInviteUrl } from '../lib/config';

/**
 * The dashboard: upload a ZIP, get a working invite link.
 *
 * Two distinct actions live here and the difference matters:
 *   - **Upload** creates a new sandbox template and activates it.
 *   - **Re-upload** replaces the files of an existing one, keeping every seeded
 *     value. That is the loop a developer repeats all day, so it is one click
 *     on the row rather than a nested screen.
 *
 * Everything after the upload happens on the Test page.
 */

/**
 * Cache the schema-vs-HTML scan the upload just returned.
 *
 * There is no read-only endpoint for it, so without this the Test page could
 * only offer "Suggest from HTML" to a developer who had saved a schema in that
 * same session — which is exactly the developer who least needs it.
 */
function rememberAnalysis(templateId, analysis) {
  if (!templateId || !analysis) return;
  try {
    localStorage.setItem(`lab_analysis_${templateId}`, JSON.stringify(analysis));
  } catch {
    /* Private mode or a full quota — suggestions are a convenience, not data. */
  }
}
export default function Templates() {
  const navigate = useNavigate();
  const toast = useToast();

  const [state, setState]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const newInputRef     = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetId = useRef(null);

  const load = useCallback(async () => {
    try {
      setState(await api.templates.list());
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function upload(file) {
    if (!file) return;
    if (!/\.zip$/i.test(file.name)) {
      toast('Please choose a .zip file', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('templateZip', file);
    fd.append('name', file.name.replace(/\.zip$/i, ''));

    setBusy(true);
    setProgress(0);
    try {
      const res = await api.templates.create(fd, setProgress);
      setAnalysis(res.analysis || null);
      rememberAnalysis(res.template?.id, res.analysis);
      const seeded = res.seeded?.counts;
      toast(
        `Uploaded and seeded — ${seeded?.functions ?? 0} functions, `
        + `${seeded?.customFields ?? 0} custom fields, ${seeded?.media ?? 0} media`,
        'success',
      );
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function replaceFiles(templateId, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append('templateZip', file);

    setBusy(true);
    setProgress(0);
    try {
      const res = await api.templates.replace(templateId, fd, setProgress);
      setAnalysis(res.analysis || null);
      rememberAnalysis(templateId, res.analysis);
      toast('Files replaced — reload the preview on the Test page', 'success');
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function run(fn, msg) {
    setBusy(true);
    try {
      await fn();
      if (msg) toast(msg, 'success');
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const templates = state?.templates || [];
  const urls  = state?.urls || {};
  const event = state?.event;
  const atLimit = templates.length >= (state?.limit ?? 0);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Templates</h1>
        <p className="page-sub">
          Upload a ZIP and it is extracted, seeded with a full wedding dataset, and given a
          private invite link — no publishing, no admin.
        </p>
      </div>

      {/* ── Live invite ─────────────────────────────────────────── */}
      {event && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Your invite link</span>
            <span className={`badge ${event.isPublished ? 'badge-active' : 'badge-idle'}`}>
              {event.isPublished ? 'Published' : 'Preview only'}
            </span>
          </div>
          <div className="card-body">
            <CopyField label="Preview link (signed, no publishing needed)" value={absoluteInviteUrl(urls.preview)} />
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => navigate('/test')}>
                Test template →
              </button>
              <button className="btn" onClick={() => window.open(urls.preview, '_blank', 'noreferrer')}>
                ↗ Open invite
              </button>
            </div>
            <p className="hint">
              This link never changes. Re-upload a ZIP and the sandbox renders your draft bundle
              directly, so there is no reload step — scenarios, schema and device previews all
              live on the Test page.
            </p>
          </div>
        </div>
      )}

      {/* ── Upload ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Upload a template</span>
        </div>
        <div className="card-body">
          <div
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onClick={() => !busy && !atLimit && newInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (!busy && !atLimit) upload(e.dataTransfer.files?.[0]);
            }}
          >
            {atLimit ? (
              <>Sandbox is full ({state.limit} templates). Delete one to upload another.</>
            ) : busy ? (
              <>Uploading… {progress != null ? `${progress}%` : ''}</>
            ) : (
              <>
                <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>📦</div>
                Drop your <strong>.zip</strong> here, or click to choose
              </>
            )}
          </div>
          {progress != null && (
            <div className="progress"><span style={{ width: `${progress}%` }} /></div>
          )}
          <input
            ref={newInputRef}
            type="file"
            accept=".zip"
            hidden
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
          />
          <p className="hint">
            Zip the folder containing <code>index.html</code>, your CSS/JS and <code>assets/</code>.
            Leave out <code>demo-data.js</code> and any local preview harness.
          </p>

          <Findings analysis={analysis} />
        </div>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Your sandbox templates</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {templates.length} / {state?.limit ?? 0}
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            Nothing uploaded yet.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Entry files</th>
                <th>Schema</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{t.slug}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem' }}>
                    <div>{t.desktopEntryFile || '—'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{t.mobileEntryFile || '(same)'}</div>
                  </td>
                  <td>
                    {t.hasSchema
                      ? <span className="badge badge-active">Declared</span>
                      : <span className="badge badge-idle">None</span>}
                  </td>
                  <td>
                    {t.isActive
                      ? <span className="badge badge-active">In sandbox</span>
                      : <span className="badge badge-idle">Idle</span>}
                  </td>
                  <td>
                    <div className="btn-row">
                      <button
                        className="btn btn-sm"
                        disabled={busy}
                        onClick={() => {
                          replaceTargetId.current = t.id;
                          replaceInputRef.current?.click();
                        }}
                      >
                        Re-upload
                      </button>
                      {!t.isActive && (
                        <button
                          className="btn btn-sm"
                          disabled={busy}
                          onClick={() => run(() => api.templates.activate(t.id, {}), `"${t.name}" is now in the sandbox`)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Delete "${t.name}" and its uploaded files?`)) return;
                          run(() => api.templates.remove(t.id), 'Template deleted');
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept=".zip"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (replaceTargetId.current) replaceFiles(replaceTargetId.current, file);
        }}
      />
    </div>
  );
}

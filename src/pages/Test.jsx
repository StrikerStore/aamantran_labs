import { Link } from 'react-router-dom';
import { useSandbox } from '../hooks/useSandbox';
import { ScenarioBar } from '../components/test/ScenarioBar';
import { SchemaPanel } from '../components/test/SchemaPanel';
import { ContentPanel } from '../components/test/ContentPanel';
import { DevicePreview } from '../components/test/DevicePreview';

/**
 * Everything needed to test a template against the real server render.
 *
 * Editing and previewing used to be two pages, which meant every change ended
 * in "now go to the other tab and refresh". Here the preview sits beside the
 * controls and every write reloads it, so the only manual step left is the one
 * that genuinely cannot be automated: scanning the QR on a real handset.
 */
export default function Test() {
  const s = useSandbox();

  if (s.loading) {
    return <div className="spinner-wrap"><div className="spinner" /></div>;
  }

  if (!s.event) {
    return (
      <div>
        <div className="page-head">
          <h1 className="page-title">Test</h1>
          <p className="page-sub">Live server render of whatever is in your sandbox.</p>
        </div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon">&#128237;</div>
            <p style={{ marginBottom: 16 }}>
              Nothing is in the sandbox yet &mdash; upload a ZIP and it seeds itself.
            </p>
            <Link className="btn btn-primary" to="/templates">Upload a template &rarr;</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head-row">
        <div className="page-head">
          <h1 className="page-title">Test</h1>
          <p className="page-sub">
            Rendering <strong>{s.event.template?.name}</strong> at{' '}
            <code>/i/{s.event.slug}</code>
          </p>
        </div>
        <div className="btn-row">
          <Link className="btn btn-sm" to="/templates">Re-upload ZIP &rarr;</Link>
        </div>
      </div>

      <div className="wb">
        <div className="wb-col">
          <ScenarioBar
            presets={s.presets}
            presetKeys={s.presetKeys}
            activePreset={s.activePreset}
            checked={s.checked}
            busy={s.busy}
            onApply={s.applyPreset}
            onClear={s.clearChecklist}
          />

          <SchemaPanel
            schemaText={s.schemaText}
            setSchemaText={s.setSchemaText}
            analysis={s.analysis}
            busy={s.busy}
            onSave={s.saveSchema}
            onSuggest={s.suggestSchema}
          />

          <ContentPanel
            form={s.form}
            setField={s.setField}
            assets={s.assets}
            busy={s.busy}
            onSave={s.saveContent}
            onReset={s.resetSandbox}
          />
        </div>

        <div className="wb-col wb-preview">
          <DevicePreview
            previewUrl={s.previewUrl}
            nonce={s.nonce}
            onReload={s.reloadPreview}
          />
        </div>
      </div>
    </div>
  );
}

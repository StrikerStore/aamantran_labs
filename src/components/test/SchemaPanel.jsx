import { Panel } from './Panel';
import { Findings } from '../Findings';

const PLACEHOLDER = `{
  "customFields": [
    { "key": "couple_story", "label": "Your story", "type": "textarea" }
  ],
  "mediaSlots": [
    { "key": "couple_carousel", "type": "photo", "multiple": true }
  ]
}`;

/**
 * Declares the template's own keys.
 *
 * An undeclared key is not an error anywhere. It simply renders as an empty
 * string, in the Lab and in production alike. "Suggest from HTML" turns that
 * silent failure into a starting point by reading back the key list the backend
 * already extracted when the ZIP was uploaded.
 */
export function SchemaPanel({ schemaText, setSchemaText, analysis, busy, onSave, onSuggest }) {
  const canSuggest = Boolean(analysis?.used);

  return (
    <Panel
      title="Field schema"
      defaultOpen={!schemaText.trim()}
      badge={
        <span className={`badge ${schemaText.trim() ? 'badge-active' : 'badge-idle'}`}>
          {schemaText.trim() ? 'Declared' : 'None'}
        </span>
      }
    >
      <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Declare your custom keys, person roles and media slots. On save, every declared key is
        given a sample value &mdash; that is what makes <code>{'{{your_key}}'}</code> render
        instead of staying blank.
      </p>

      <textarea
        className="textarea code"
        spellCheck="false"
        placeholder={PLACEHOLDER}
        value={schemaText}
        onChange={(e) => setSchemaText(e.target.value)}
      />

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={busy} onClick={onSave}>
          Save schema &amp; reseed
        </button>
        <button className="btn" disabled={busy || !canSuggest} onClick={onSuggest}>
          Suggest from HTML
        </button>
      </div>

      {!canSuggest && (
        <p className="hint">
          Suggestions appear once the template has been scanned &mdash; upload or re-upload the
          ZIP, or save the schema once.
        </p>
      )}

      <Findings analysis={analysis} />
    </Panel>
  );
}

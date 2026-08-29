/**
 * A short in-app reference. The full contract lives in guide.md, which is
 * handed over with the Lab credentials — this page covers the things a
 * developer looks up mid-task without leaving the tool.
 */
export default function Guide() {
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Guide</h1>
        <p className="page-sub">The short version. Your full copy is <code>guide.md</code>.</p>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">The loop</span></div>
        <div className="card-body">
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Build locally against your <code>demo-data.js</code> harness.</li>
            <li>Zip the folder — <code>index.html</code>, CSS, JS, <code>assets/</code>. Leave the harness out.</li>
            <li>Upload here. The sandbox seeds itself and gives you an invite link.</li>
            <li>Paste your <code>fieldSchema</code> so your custom keys get sample values.</li>
            <li>Fix → re-zip → <strong>Re-upload</strong> → refresh the invite tab. No reload step.</li>
            <li>Walk the test scenarios, then scan the QR on a real phone.</li>
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Variables you get for free</span></div>
        <div className="card-body">
          <table className="table">
            <tbody>
              <tr><td><code>{'{{groom_name}}'}</code> <code>{'{{bride_name}}'}</code></td><td>The couple</td></tr>
              <tr><td><code>{'{{<role>_name}}'}</code></td><td><code>groom_father_name</code>, <code>bride_mother_name</code>, grandparents…</td></tr>
              <tr><td><code>{'{{wedding_date_iso}}'}</code></td><td><code>YYYY-MM-DD</code> — use this one in JS</td></tr>
              <tr><td><code>{'{{#each functions}}'}</code></td><td><code>name</code>, <code>date</code>, <code>time</code>, <code>venue_name</code>, <code>venue_address</code>, <code>venue_map_url</code>, <code>dress_code</code>, <code>notes</code></td></tr>
              <tr><td><code>{'{{music_url}}'}</code></td><td>Whatever you picked in the music dropdown</td></tr>
              <tr><td><code>{'{{media_slots}}'}</code></td><td>With <code>has_media_slot</code> / <code>each_media_slot</code></td></tr>
              <tr><td><code>{'{{hashtag_raw}}'}</code></td><td>Stored bare — add the <code>#</code> yourself</td></tr>
              <tr><td><code>{'{{rsvp_enabled}}'}</code> <code>{'{{guest_notes_enabled}}'}</code></td><td>Wrap those blocks in these</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Two things that catch everyone</span></div>
        <div className="card-body">
          <p className="hint" style={{ marginTop: 0 }}>
            <strong>1. Undeclared keys render blank.</strong> A custom variable only exists once
            it is in <code>fieldSchema.customFields</code>. That is not a Lab quirk — it is exactly
            what happens in production.
          </p>
          <p className="hint">
            <strong>2. Custom keys sit at the top level</strong>, so one named <code>hashtag</code>
            silently overrides the built-in. Prefer <code>{'{{hashtag_raw}}'}</code>, and don't
            reuse built-in names.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Before you hand off</span></div>
        <div className="card-body">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Every scenario on the Sandbox page renders without gaps.</li>
            <li>No <code>demo-data.js</code>, <code>demo-helpers.js</code> or <code>preview.html</code> in the ZIP.</li>
            <li><code>index.html</code> references none of them.</li>
            <li>Asset paths are relative (<code>./assets/…</code>).</li>
            <li>RSVP and wish forms keep their <code>data-aamantran</code> and <code>data-field</code> attributes.</li>
            <li>Send your final <code>fieldSchema</code> along with the ZIP.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useToast } from './Toast';

/** A read-only value with a copy button — invite links, credentials, slugs. */
export function CopyField({ label, value }) {
  const toast = useToast();
  if (!value) return null;

  return (
    <div className="field">
      {label && <span className="label">{label}</span>}
      <div className="copy-row">
        <code>{value}</code>
        <button
          className="btn btn-sm"
          onClick={() => {
            navigator.clipboard.writeText(value).then(
              () => toast(`${label || 'Value'} copied`, 'success'),
              () => toast('Could not copy to clipboard', 'error'),
            );
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

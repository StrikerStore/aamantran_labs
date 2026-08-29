import { useState } from 'react';

/**
 * A card whose body collapses.
 *
 * The Test page stacks three of these in one column, so anything not being
 * worked on right now needs to be able to get out of the way of the preview.
 */
export function Panel({ title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card">
      <button
        type="button"
        className="panel-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="card-title">{title}</span>
        {badge}
        <span className={`panel-caret ${open ? 'open' : ''}`} aria-hidden="true">&#9656;</span>
      </button>
      {open && <div className="card-body">{children}</div>}
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getDeveloperInfo } from '../lib/auth';

export function Layout() {
  const navigate = useNavigate();
  const dev = getDeveloperInfo();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>🧪</span>
          <span>
            Template Lab
            <small>Aamantran</small>
          </span>
        </div>

        <NavLink to="/templates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Templates
        </NavLink>
        <NavLink to="/sandbox" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Sandbox content
        </NavLink>
        <NavLink to="/preview" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Preview &amp; devices
        </NavLink>
        <NavLink to="/guide" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Guide
        </NavLink>

        <div className="sidebar-foot">
          <div style={{ marginBottom: 8 }}>
            Signed in as <strong style={{ color: 'var(--text-secondary)' }}>{dev?.handle || '—'}</strong>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => { clearToken(); navigate('/', { replace: true }); }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

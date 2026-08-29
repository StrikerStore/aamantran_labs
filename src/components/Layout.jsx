import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getDeveloperInfo } from '../lib/auth';

const NAV = [
  { to: '/templates', icon: '📦', label: 'Templates' },
  { to: '/test',      icon: '🧪', label: 'Test' },
  { to: '/guide',     icon: '📖', label: 'Guide' },
];

export function Layout() {
  const navigate = useNavigate();
  const dev = getDeveloperInfo();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">🧪</span>
          <span className="brand-text">
            Template Lab
            <small>Aamantran</small>
          </span>
        </div>

        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-foot">
          <div style={{ marginBottom: 10 }}>
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

      <main className="main page-fade">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getDeveloperInfo } from '../lib/auth';

const NAV = [
  { to: '/templates', icon: '📦', label: 'Templates' },
  { to: '/test',      icon: '🧪', label: 'Test' },
  { to: '/guide',     icon: '📖', label: 'Guide' },
];

const STORE_KEY = 'aam_lab_sidebar';

function IconChevron() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M6.2 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h2.7M10.5 11 13.5 8l-3-3M13.5 8H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const dev = getDeveloperInfo();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORE_KEY) === 'collapsed');

  /* Persisting here rather than inside the setState updater: React may invoke
     an updater more than once for a single click (StrictMode double-invokes,
     and the update queue is replayed on re-render), so a write in there can
     run against a stale base and save the inverted value. */
  useEffect(() => {
    localStorage.setItem(STORE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <div className={`shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          {/* 80px source for a 38px slot, so it stays sharp on 2x displays. */}
          <img
            src="/logo-80.png"
            alt=""
            className="brand-mark"
            width="38"
            height="38"
            decoding="async"
          />
          <span className="brand-text">
            Template Lab
            <small>Aamantran</small>
          </span>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-tooltip={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconChevron />
          </button>
        </div>

        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            /* Styled CSS tooltip rather than `title`: the native one has a ~1s
               delay and cannot be themed. The label stays in the DOM for
               assistive tech either way, so the rail is never unlabelled. */
            data-tooltip={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-foot">
          <div className="signed-in-as">
            Signed in as <strong style={{ color: 'var(--text-secondary)' }}>{dev?.handle || '—'}</strong>
          </div>
          <button
            className="btn btn-sm signout-btn"
            onClick={() => { clearToken(); navigate('/', { replace: true }); }}
            aria-label="Sign out"
            data-tooltip="Sign out"
          >
            <IconLogout />
            <span className="signout-label">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main page-fade">
        <Outlet />
      </main>
    </div>
  );
}

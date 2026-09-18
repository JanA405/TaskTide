import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import useAuth from '../hooks/useAuth';

function roleLabel(role) {
  if (role === 'ROLE_ADMIN') return 'Administrator';
  if (role === 'ROLE_MANAGER') return 'Project Lead';
  return 'Team Member';
}

function MainLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const role = user?.roles?.[0];

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'TT';

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      path: '/dashboard',
      label: 'My Tasks',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
      ),
    },
    {
      path: '/reports',
      label: 'Analytics & Reports',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    {
      path: '/teams',
      label: 'Teams & Squads',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    ...(role === 'ROLE_ADMIN'
      ? [
          {
            path: '/admin',
            label: 'Admin Console',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            ),
          },
        ]
      : []),
  ];

  const currentNav = navItems.find((n) => n.path === location.pathname);

  return (
    <div className="layout">
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c.6 0 1.2-.2 1.7-.6 1.8-1.4 3.7-2.4 5.3-2.4 2.2 0 4 1.7 5 3.5 1 1.7 2.8 3.5 5 3.5 1.6 0 3.5-1 5.3-2.4.5-.4 1.1-.6 1.7-.6" />
              <path d="M2 18c.6 0 1.2-.2 1.7-.6 1.8-1.4 3.7-2.4 5.3-2.4 2.2 0 4 1.7 5 3.5 1 1.7 2.8 3.5 5 3.5 1.6 0 3.5-1 5.3-2.4.5-.4 1.1-.6 1.7-.6" />
            </svg>
          </div>
          <span className="logo-text">TaskTide</span>
          <span className="logo-tag">v2.0</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <strong>{user?.username || 'User'}</strong>
              <small>{roleLabel(role)}</small>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Sign Out">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen((o) => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="topbar-title">
            <span>Workspace</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--primary)' }}>{currentNav?.label || 'Overview'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="topbar-badge">
              <span className="badge-dot" style={{ background: '#16a34a', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 6 }}></span>
              Connected
            </div>
            <div
              className="avatar"
              style={{ width: 34, height: 34, fontSize: '0.8rem', cursor: 'pointer' }}
              title={user?.username}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import useAuth from '../hooks/useAuth';

const NAV = [
  { path: '/', label: 'Home', icon: '⊞' },
  { path: '/dashboard', label: 'My Tasks', icon: '✓' },
  { path: '/projects', label: 'Projects', icon: '◈' },
  { path: '/reports', label: 'Reports', icon: '▦' },
];
const MANAGER_NAV = [{ path: '/teams', label: 'Teams', icon: '◉' }];
const ADMIN_NAV = [{ path: '/admin', label: 'Admin', icon: '⚙' }];

function roleLabel(role) {
  if (role === 'ROLE_ADMIN') return 'Admin';
  if (role === 'ROLE_MANAGER') return 'Manager';
  return 'Member';
}

function MainLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const role = user?.roles?.[0];

  const navItems = [
    ...NAV,
    ...(role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER' ? MANAGER_NAV : []),
    ...(role === 'ROLE_ADMIN' ? ADMIN_NAV : []),
  ];

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="layout">
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span>ProjectFlow</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => { navigate(item.path); setOpen(false); }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
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
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(o => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="topbar-title">
            {navItems.find(n => n.path === location.pathname)?.label || 'ProjectFlow'}
          </span>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '.75rem' }}>{initials}</div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, reset } from '../store/authSlice';
import useAuth from '../hooks/useAuth';
import teamHero from '../assets/team_collaboration.jpg';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      navigate('/');
      dispatch(reset());
    }
  }, [isSuccess, navigate, dispatch]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (stored?.token) navigate('/');
  }, [navigate]);

  const fillDemoAccount = (username, password) => {
    setForm({ username, password });
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    dispatch(login(form));
  };

  return (
    <div className="auth-split-container">
      {/* Showcase Visual Panel */}
      <div className="auth-showcase-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2 12c.6 0 1.2-.2 1.7-.6 1.8-1.4 3.7-2.4 5.3-2.4 2.2 0 4 1.7 5 3.5 1 1.7 2.8 3.5 5 3.5 1.6 0 3.5-1 5.3-2.4.5-.4 1.1-.6 1.7-.6" />
              <path d="M2 18c.6 0 1.2-.2 1.7-.6 1.8-1.4 3.7-2.4 5.3-2.4 2.2 0 4 1.7 5 3.5 1 1.7 2.8 3.5 5 3.5 1.6 0 3.5-1 5.3-2.4.5-.4 1.1-.6 1.7-.6" />
            </svg>
          </div>
          <span className="logo-text">TaskTide</span>
        </div>

        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <img
            src={teamHero}
            alt="TaskTide Team Collaboration"
            className="auth-showcase-artwork"
            style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}
          />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 24, letterSpacing: '-0.02em' }}>
            Collaborate, Track & Deliver Together
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 460, margin: '8px auto 0' }}>
            Empower agile squads with team-assigned tasks, real-time progress tracking, document deliverables, and seamless manager review loops.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="topbar-badge" style={{ background: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 600 }}>
            👥 Agile Team Squads
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: 600 }}>
            📁 Deliverable Submissions
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(22, 163, 74, 0.08)', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 600 }}>
            🛡️ 3-Tier Governance
          </span>
        </div>
      </div>

      {/* Form Input Panel */}
      <div className="auth-form-panel">
        <div className="auth-box">
          <div className="auth-box-header">
            <h1>Welcome Back</h1>
            <p>Sign in with your credentials or select a pre-configured demo account below</p>
          </div>

          {/* 1-Click Quick Fill Demo Accounts */}
          <div className="demo-accounts-bar">
            <div className="demo-accounts-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Instant 1-Click Demo Accounts</span>
            </div>
            <div className="demo-chips-grid">
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('admin', 'admin123')}
                title="Log in as System Administrator"
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9333ea' }} />
                <div>
                  <div className="demo-chip-role">Admin</div>
                  <div className="demo-chip-user">admin</div>
                </div>
              </button>

              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('janz', 'manager123')}
                title="Log in as Project Manager"
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} />
                <div>
                  <div className="demo-chip-role">Manager</div>
                  <div className="demo-chip-user">janz</div>
                </div>
              </button>

              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('dev_alex', 'alex123')}
                title="Log in as Team Member"
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                <div>
                  <div className="demo-chip-role">Member</div>
                  <div className="demo-chip-user">dev_alex</div>
                </div>
              </button>
            </div>
          </div>

          {isError && (
            <div className="alert alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{message || 'Invalid username or password'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  placeholder="e.g. admin"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  style={{ paddingLeft: 40 }}
                />
                <svg
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              {errors.username && (
                <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {errors.username}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <svg
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {errors.password}
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '12px', fontSize: '0.95rem', marginTop: 8 }}
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner" /> : 'Sign In to Workspace'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            New to TaskTide?{' '}
            <span
              onClick={() => navigate('/register')}
              style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Create an account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

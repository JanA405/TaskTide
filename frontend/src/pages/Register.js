import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import projectHero from '../assets/project_planning.jpg';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'ROLE_MEMBER',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setRole = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setError('');
    setLoading(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            src={projectHero}
            alt="Project Planning & Sprints"
            className="auth-showcase-artwork"
            style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}
          />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 24, letterSpacing: '-0.02em' }}>
            Transform Ideas into Shipped Features
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 460, margin: '8px auto 0' }}>
            Coordinate roadmap milestones, automate task delegation across squads, and track delivery with enterprise visibility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="topbar-badge" style={{ background: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 600 }}>
            🚀 Instant Workspace
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: 600 }}>
            📊 Progress Tracking
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(22, 163, 74, 0.08)', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 600 }}>
            🛡️ Enterprise Auditing
          </span>
        </div>
      </div>

      {/* Form Input Panel */}
      <div className="auth-form-panel">
        <div className="auth-box">
          <div className="auth-box-header">
            <h1>Create Account</h1>
            <p>Select your team role and enter your details to get started</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Visual Role Selector Cards */}
            <div className="form-group">
              <label className="form-label">Select Your Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                <div
                  onClick={() => setRole('ROLE_MEMBER')}
                  style={{
                    border: form.role === 'ROLE_MEMBER' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: form.role === 'ROLE_MEMBER' ? '#f0fdf4' : '#ffffff',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>⚡</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: form.role === 'ROLE_MEMBER' ? '#16a34a' : 'var(--text)' }}>
                    Member
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Build & Deliver</div>
                </div>

                <div
                  onClick={() => setRole('ROLE_MANAGER')}
                  style={{
                    border: form.role === 'ROLE_MANAGER' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    background: form.role === 'ROLE_MANAGER' ? '#eef2ff' : '#ffffff',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>💼</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: form.role === 'ROLE_MANAGER' ? '#4f46e5' : 'var(--text)' }}>
                    Manager
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Lead & Review</div>
                </div>

                <div
                  onClick={() => setRole('ROLE_ADMIN')}
                  style={{
                    border: form.role === 'ROLE_ADMIN' ? '2px solid #9333ea' : '1px solid #e2e8f0',
                    background: form.role === 'ROLE_ADMIN' ? '#faf5ff' : '#ffffff',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>👑</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: form.role === 'ROLE_ADMIN' ? '#9333ea' : 'var(--text)' }}>
                    Admin
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Full System</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="fullName"
                  className="form-control"
                  placeholder="e.g. Alex Morgan"
                  value={form.fullName}
                  onChange={handleChange}
                  style={{ paddingLeft: 40 }}
                />
                <svg
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              {errors.fullName && (
                <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {errors.fullName}
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="username"
                    className="form-control"
                    placeholder="e.g. alexm"
                    value={form.username}
                    onChange={handleChange}
                    style={{ paddingLeft: 40 }}
                  />
                  <svg
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                    width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                {errors.username && (
                  <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    {errors.username}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Work Email</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="alex@company.com"
                    value={form.email}
                    onChange={handleChange}
                    style={{ paddingLeft: 40 }}
                  />
                  <svg
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                    width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                {errors.email && (
                  <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    {errors.email}
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingLeft: 40 }}
                />
                <svg
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
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
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Register New Workspace Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

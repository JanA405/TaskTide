import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import authHero from '../assets/auth_hero.jpg';

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
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
            src={authHero}
            alt="TaskTide Workspace Illustration"
            className="auth-showcase-artwork"
          />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: 24, letterSpacing: '-0.02em' }}>
            Start Building with Flow
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 440, margin: '8px auto 0' }}>
            Join your teammates and coordinate product backlogs, sprint cycles, and deliver on time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="topbar-badge" style={{ background: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 600 }}>
            ✓ Instant Setup
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: 600 }}>
            ✓ Automated Analytics
          </span>
          <span className="topbar-badge" style={{ background: 'rgba(22, 163, 74, 0.08)', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 600 }}>
            ✓ Unlimited Workspaces
          </span>
        </div>
      </div>

      {/* Form Input Panel */}
      <div className="auth-form-panel">
        <div className="auth-box">
          <div className="auth-box-header">
            <h1>Create Account</h1>
            <p>Get started with your TaskTide workspace</p>
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
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="fullName"
                className="form-control"
                placeholder="e.g. Alex Morgan"
                value={form.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {errors.fullName}
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  name="username"
                  className="form-control"
                  placeholder="e.g. alexm"
                  value={form.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    {errors.username}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="ROLE_MEMBER">Team Member</option>
                  <option value="ROLE_MANAGER">Project Manager</option>
                  <option value="ROLE_ADMIN">Administrator</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="alex@company.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <small style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {errors.email}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
              />
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

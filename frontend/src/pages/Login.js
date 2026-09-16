import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, reset } from '../store/authSlice';
import useAuth from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});

  // Only redirect after an explicit successful login action, not on initial mount
  useEffect(() => {
    if (isSuccess) {
      navigate('/');
      dispatch(reset());
    }
  }, [isSuccess, navigate, dispatch]);

  // If already logged in (token in storage), go home immediately
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (stored?.token) navigate('/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    dispatch(login(form));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ProjectFlow</h1>
          <p>Sign in to your workspace</p>
        </div>
        {isError && (
          <div className="alert alert-error" role="alert">
            {message || 'Invalid username or password'}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
            {errors.username && (
              <small style={{ color: 'var(--danger)', fontSize: '.78rem' }}>{errors.username}</small>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && (
              <small style={{ color: 'var(--danger)', fontSize: '.78rem' }}>{errors.password}</small>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', marginTop: 8 }}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Register
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;

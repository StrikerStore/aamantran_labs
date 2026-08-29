import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { isAuthenticated, saveToken } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [handle, setHandle]     = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);

  if (isAuthenticated()) {
    return <Navigate to={params.get('next') || '/templates'} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.auth.login(handle.trim(), password);
      saveToken(res.token);
      navigate(params.get('next') || '/templates', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-brand">
          <img src="/logo-80.png" alt="Aamantran" width="52" height="52" decoding="async" />
          <span className="login-brand-text">
            Template Lab
            <small>Aamantran</small>
          </span>
        </div>
        <div className="card-body">
          <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
            Sign in with the handle and password your Aamantran contact sent you.
          </p>

          <div className="field">
            <label className="label" htmlFor="handle">Handle or email</label>
            <input
              id="handle"
              className="input"
              autoFocus
              autoComplete="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}

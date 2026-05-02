import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Landmark, ShieldCheck, Eye, EyeOff, Zap, Star, Shield, Lock, Mail, ArrowLeft } from 'lucide-react';
import { loginUser, verifyLogin } from '../store/authActions';
import './Experience.css';

const ADMIN_EMAIL = 'durgaprasadch.in@gmail.com';

/* ── Account on Hold Screen ── */
const AccountOnHoldScreen = ({ message, onBack }) => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'inherit',
  }}>
    <div style={{
      width: '100%',
      maxWidth: '480px',
      textAlign: 'center',
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 28px',
        boxShadow: '0 0 40px rgba(234, 179, 8, 0.15)',
      }}>
        <Lock size={36} color="#facc15" />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: 800,
        color: 'var(--ink)',
        margin: '0 0 12px',
        letterSpacing: '-0.03em',
      }}>
        Account on Hold
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: '15px',
        color: 'var(--muted)',
        lineHeight: 1.6,
        margin: '0 0 32px',
      }}>
        {message || 'Your account has been placed on hold and cannot be accessed at this time.'}
      </p>

      {/* Info card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        textAlign: 'left',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          marginBottom: '16px',
        }}>
          What to do next
        </div>

        {[
          'Do not attempt to log in repeatedly — it may trigger a security lock.',
          'Check your registered email for a notice from FinFlow.',
          'Contact the admin directly for resolution.',
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: i < 2 ? '14px' : 0,
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#facc15',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Contact card */}
      <a
        href={`mailto:${ADMIN_EMAIL}?subject=FinFlow Account Hold — Access Request&body=Hi Admin,%0A%0AMy account has been placed on hold. Please assist me with restoring access.%0A%0AThank you.`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '24px',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.06)';
          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(37, 99, 235, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Mail size={18} color="var(--blue)" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Contact Admin
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue)' }}>
            {ADMIN_EMAIL}
          </div>
        </div>
        <ArrowRight size={16} color="var(--blue)" style={{ marginLeft: 'auto' }} />
      </a>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '12px 20px',
          color: 'var(--muted)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          margin: '0 auto',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--ink)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
      >
        <ArrowLeft size={15} /> Try a different account
      </button>
    </div>
  </div>
);

/* ── Main Login Component ── */
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, mfaRequired, userRole } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [accountOnHold, setAccountOnHold] = useState(false);
  const [holdMessage, setHoldMessage] = useState('');


  const clearLocalError = () => setLocalError('');

  const isAccountBlocked = (msg = '') => {
    const m = msg.toLowerCase();
    return m.includes('hold') || m.includes('suspend') || m.includes('blocked') || m.includes('restricted') || m.includes('frozen');
  };

  const redirectAfterLogin = (role) => {
    const requested = location.state?.from?.pathname;
    if (role === 'ADMIN') {
      if (requested && requested.startsWith('/admin')) return navigate(requested, { replace: true });
      return navigate('/admin/dashboard', { replace: true });
    }
    if (requested && requested !== '/') return navigate(requested, { replace: true });
    navigate('/applicant/dashboard', { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLocalError('');
    const userAgent = navigator.userAgent;
    const action = await dispatch(loginUser({ email, password, userAgent, ipAddress: 'Local Web Client' }));
    if (loginUser.fulfilled.match(action) && !action.payload.mfaRequired) {
      redirectAfterLogin(action.payload.role);
    } else if (loginUser.rejected.match(action)) {
      const msg = action.payload || 'Login failed. Please try again.';
      if (isAccountBlocked(msg)) {
        setHoldMessage(msg);
        setAccountOnHold(true);
      } else {
        setLocalError(msg);
      }
    }
  };

  const handleOtp = async (event) => {
    event.preventDefault();
    setLocalError('');
    const action = await dispatch(verifyLogin({ email, otp }));
    if (verifyLogin.fulfilled.match(action)) {
      redirectAfterLogin(action.payload.role || userRole);
    } else if (verifyLogin.rejected.match(action)) {
      setLocalError(action.payload || 'Verification failed. Please try again.');
    }
  };

  // Show the full hold screen
  if (accountOnHold) {
    return <AccountOnHoldScreen message={holdMessage} onBack={() => { setAccountOnHold(false); setHoldMessage(''); setLocalError(''); }} />;
  }

  return (
    <div className="auth-screen">
      <aside className="auth-art">
        <Link to="/" className="brand-mark" style={{ position: 'absolute', top: '48px', left: '64px' }}><Landmark size={24} /> FinFlow</Link>
        <div className="auth-art-content">
          <span className="eyebrow" style={{ color: 'var(--blue)', background: 'rgba(37, 99, 235, 0.1)', padding: '6px 12px', borderRadius: '4px' }}>
            <ShieldCheck size={15} /> SECURE COMMAND CENTER
          </span>
          <h1 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '32px', letterSpacing: '-0.04em' }}>Capital, minus the chaos.</h1>
          <p style={{ fontSize: '22px', opacity: 0.8, lineHeight: 1.5, maxWidth: '540px' }}>
            Your bank moves in days. We move in minutes. Experience funding that finally keeps up with your ambition.
          </p>

          <div style={{ marginTop: '56px', display: 'grid', gap: '28px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Zap size={24} color="var(--blue)" /> Funding at the speed of thought.
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Star size={24} color="var(--blue)" /> The bank said maybe. We said yes.
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Shield size={24} color="var(--blue)" /> High-end finance. Zero headaches.
            </div>
          </div>
        </div>
      </aside>

      <main className="auth-panel">
        <section className="auth-card">
          <h2>{mfaRequired ? 'Security Check' : 'Ready to Grow?'}</h2>
          <p>{mfaRequired ? 'Enter the six-digit code we sent to your inbox.' : 'Sign in to manage your capital and get things moving.'}</p>

          {localError && (
            <div className="alert" onClick={clearLocalError} style={{ cursor: 'pointer', marginBottom: '16px' }}>
              {localError}
            </div>
          )}

          {!mfaRequired ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="field">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
              </div>
              <div className="field password-field">
                <label>Password</label>
                <div className="input-group-v6">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Opening...' : 'Unlock Workspace'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleOtp}>
              <div className="field">
                <label>Security Code</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} minLength={4} maxLength={8} required inputMode="numeric" placeholder="123456" />
              </div>
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Enter Workspace'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="auth-foot">
            New here? <Link to="/signup">Join FinFlow</Link>. Forgot password? <Link to="/forgot-password">Reset it</Link>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;

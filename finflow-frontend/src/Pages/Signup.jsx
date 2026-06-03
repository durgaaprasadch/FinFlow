import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Landmark, MailCheck, Zap, Star, Shield, Eye, EyeOff } from 'lucide-react';
import { registerUser, resendSignupOtp, verifyRegistration } from '../store/authActions';
import './Experience.css';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', otp: '' });
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (pass) => {
    if (!pass) return { label: '', score: 0, color: '#e2e8f0' };
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score < 2) return { label: 'Weak', score, color: '#ef4444' };
    if (score === 2) return { label: 'Fair', score, color: '#f59e0b' };
    if (score === 3) return { label: 'Good', score, color: '#10b981' };
    return { label: 'Strong', score, color: '#059669' };
  };

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitDetails = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setNotice('Passwords do not match.');
    }
    const action = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(action)) {
      setNotice('Check your email for the code.');
      setStep('otp');
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    const action = await dispatch(verifyRegistration({ email: form.email, otp: form.otp }));
    if (verifyRegistration.fulfilled.match(action)) {
      navigate('/login', { replace: true });
    }
  };

  const resend = async () => {
    const action = await dispatch(resendSignupOtp(form.email));
    if (resendSignupOtp.fulfilled.match(action)) setNotice('Fresh code sent.');
  };

  return (
    <div className="auth-screen">
      <aside className="auth-art">
        <Link to="/" className="brand-mark" style={{ position: 'absolute', top: '48px', left: '64px' }}><Landmark size={24} /> FinFlow</Link>
        <div className="auth-art-content">
          <span className="eyebrow" style={{ color: 'var(--blue)', background: 'rgba(37, 99, 235, 0.1)', padding: '6px 12px', borderRadius: '4px' }}>
            <MailCheck size={15} /> VERIFIED FROM DAY ZERO
          </span>
          <h1 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '32px', letterSpacing: '-0.04em' }}>Your journey starts here.</h1>
          <p style={{ fontSize: '22px', opacity: 0.8, lineHeight: 1.5, maxWidth: '540px' }}>
            Join the next generation of digital finance. No paperwork, no waiting, just pure progress.
          </p>
          
          <div style={{ marginTop: '56px', display: 'grid', gap: '28px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Zap size={24} color="var(--blue)" /> 5-minute setup process.
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Star size={24} color="var(--blue)" /> Priority file processing.
            </div>
          </div>
        </div>
      </aside>

      <main className="auth-panel" style={{ overflowY: 'auto' }}>
        <section className="auth-card" style={{ padding: '40px 0' }}>
          <h2>{step === 'details' ? 'Join the Elite' : 'Security Check'}</h2>
          <p>{step === 'details' ? 'Create your workspace and start your application today.' : `We sent a code to ${form.email}.`}</p>
          {error && <div className="alert">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}

          {step === 'details' ? (
            <form className="auth-form" onSubmit={submitDetails}>
              <div className="field">
                <label>Full Name</label>
                <input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} required pattern="^[a-zA-Z\s]{2,100}$" placeholder="John Doe" />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} required pattern="^[6-9]\d{9}$" placeholder="9876543210" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                <div className="field password-field">
                  <label>Password</label>
                  <div className="input-group-v6">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={form.password} 
                      onChange={(event) => setField('password', event.target.value)} 
                      required 
                      autoComplete="new-password" 
                      placeholder="••••••••" 
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div style={{ height: '24px', marginTop: '8px' }}>
                    {form.password && (
                      <>
                        <div style={{ height: '4px', width: '100%', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(strength.score / 4) * 100}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: strength.color, marginTop: '4px', display: 'block' }}>{strength.label}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="field">
                  <label>Confirm Password</label>
                  <input 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={(event) => setField('confirmPassword', event.target.value)} 
                    required 
                    autoComplete="new-password" 
                    placeholder="••••••••" 
                    style={{ borderColor: form.confirmPassword && (form.password === form.confirmPassword ? '#10b981' : '#ef4444') }}
                  />
                  <div style={{ height: '24px', marginTop: '8px' }}>
                    {form.confirmPassword && (
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: form.password === form.confirmPassword ? '#10b981' : '#ef4444' 
                      }}>
                        {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Launch Application'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitOtp}>
              <div className="field">
                <label>Security Code</label>
                <input value={form.otp} onChange={(event) => setField('otp', event.target.value)} required inputMode="numeric" placeholder="123456" />
              </div>
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Enter'} <ArrowRight size={16} />
              </button>
              <button className="btn secondary" type="button" onClick={resend} disabled={loading}>Resend Code</button>
            </form>
          )}

          <p className="auth-foot">Already a member? <Link to="/login">Sign in</Link>.</p>
        </section>
      </main>
    </div>
  );
};

export default Signup;

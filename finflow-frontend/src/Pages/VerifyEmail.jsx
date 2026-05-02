import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Mail, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyRegistration, resendSignupOtp as resendOtp } from '../store/authActions';
import { clearError } from '../store/authSlice';
import useAuth from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './Experience.css';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAuth();
  const { showToast } = useToast();
  
  const email = location.state?.email || '';

  useEffect(() => {
    dispatch(clearError());
    if (!email) navigate('/signup');
  }, [dispatch, email, navigate]);

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    const resultAction = await dispatch(resendOtp(email));
    setResending(false);
    if (resendOtp.fulfilled.match(resultAction)) {
      setResendMessage('A new code has been transmitted.');
      setTimeout(() => setResendMessage(''), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(verifyRegistration({ email, otp }));
    if (verifyRegistration.fulfilled.match(resultAction)) {
      setSuccess(true);
      showToast('Verification Successful', 'Your account has been verified. Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 2500);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-art">
        <Link to="/" className="brand-mark">
          <Landmark size={28} />
          <span>FinFlow</span>
        </Link>
        
        <div className="art-content">
          <div className="eyebrow">Onboarding Journey</div>
          <h1>Confirm your <span className="text-gradient">identity.</span></h1>
          <p>We've dispatched a secure 6-digit verification code to your email. This ensures that your financial workspace remains exclusive and protected from the start.</p>
        </div>

        <div className="auth-foot" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '24px', opacity: 0.6, fontSize: '12px' }}>
            <span>&copy; 2026 FinFlow</span>
            <span>Identity Secured</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Identity Check</h2>
          <p>Transmit the verification code sent to <strong>{email}</strong>.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert">{error}</div>}
            {resendMessage && <div className="alert success">{resendMessage}</div>}
            {success && <div className="alert success">Identity confirmed. Welcome to the flow.</div>}
            
            <div className="field">
              <label>Security Code</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading || success || otp.length !== 6} className="btn primary full">
              {loading ? 'Confirming...' : 'Verify Identity'}
              {!loading && <ShieldCheck size={18} />}
            </button>
          </form>

          <div className="auth-foot">
            <p>Didn't receive the transmission?</p>
            <button 
              type="button"
              onClick={handleResend} 
              disabled={resending}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
            >
              {resending ? 'Transmitting...' : 'Resend Code'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;

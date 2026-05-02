import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyForgotPasswordOtp, resetPassword } from '../store/authActions';
import { clearError } from '../store/authSlice';
import './Experience.css';

const ResetPassword = () => {
  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [resetToken, setResetToken] = useState('');
  const [success, setSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const email = location.state?.email || '';

  useEffect(() => {
    dispatch(clearError());
    if (!email) navigate('/forgot-password');
  }, [dispatch, email, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(verifyForgotPasswordOtp({ email, otp }));
    if (!resultAction.error) {
      setResetToken(resultAction.payload.resetToken);
      setStep(2);
      dispatch(clearError());
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(resetPassword({ 
      resetToken, 
      newPassword: passwords.newPassword, 
      confirmPassword: passwords.confirmPassword 
    }));
    if (!resultAction.error) {
      setSuccess(true);
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
          <div className="eyebrow">Security Gateway</div>
          <h1>Fortify your <span className="text-gradient">access.</span></h1>
          <p>Establish a robust, unique password to secure your financial workspace. We recommend a combination of characters that is easy for you to remember but impossible for others to guess.</p>
        </div>

        <div className="auth-foot" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '24px', opacity: 0.6, fontSize: '12px' }}>
            <span>&copy; 2026 FinFlow</span>
            <span>Encryption Active</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2>Verification</h2>
                <p>Enter the 6-digit code transmitted to <strong>{email}</strong>.</p>

                <form onSubmit={handleVerifyOtp} className="auth-form">
                  {error && <div className="alert">{error}</div>}
                  
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

                  <button type="submit" disabled={loading || otp.length !== 6} className="btn primary full">
                    {loading ? 'Verifying...' : 'Continue'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2>New Key</h2>
                <p>Define your new credentials. Minimum 8 characters recommended.</p>

                <form onSubmit={handleResetPassword} className="auth-form">
                  {error && <div className="alert">{error}</div>}
                  {success && <div className="alert success">Credentials updated. Identity verified.</div>}
                  
                  <div className="field">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading || success} className="btn primary full">
                    {loading ? 'Updating...' : 'Update Password'}
                    {!loading && <ShieldCheck size={18} />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-foot">
            <Link to="/login">Identity already verified? Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

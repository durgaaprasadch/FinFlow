import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Zap, Shield, Check, Activity, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { forgotPassword } from '../store/authActions';
import { clearError } from '../store/authSlice';
import './Experience.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(forgotPassword(email));
    if (!resultAction.error) {
      setSuccess(true);
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
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
          <div className="eyebrow">Identity Recovery</div>
          <h1>Don't let a lost key slow your <span className="text-gradient">flow.</span></h1>
          <p>Security is our baseline. We'll verify your identity and get you back into your workspace in under two minutes.</p>
        </div>

        <div className="auth-foot" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '24px', opacity: 0.6, fontSize: '12px' }}>
            <span>&copy; 2026 FinFlow</span>
            <span>Security First</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Lost Access?</h2>
          <p>Provide your registered email address and we'll transmit a secure recovery link.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert">{error}</div>}
            {success && <div className="alert success">Transmission successful. Redirecting...</div>}
            
            <div className="field">
              <label>Recovery Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading || success} className="btn primary full">
              {loading ? 'Transmitting...' : 'Send Recovery Link'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-foot">
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Identity Check
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

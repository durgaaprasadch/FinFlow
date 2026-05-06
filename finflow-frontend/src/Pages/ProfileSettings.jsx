import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, ShieldAlert, ChevronRight, 
  Phone, Mail, Check, AlertTriangle, Lock, RefreshCw,
  Sun, Moon, LogOut
} from 'lucide-react';
import { authService } from '../api';
import { useToast } from '../hooks/useToast';
import { labelize } from '../utils/format';
import './ProfileSettings.css';
import './Experience.css';

const ProfileSettings = () => {
  const { user, userRole } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };
  
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [showDeleteOtp, setShowDeleteOtp] = useState(false);

  useEffect(() => {
    // The 'user' from Redux auth slice is the user's email
    setProfile(prev => ({ 
      ...prev, 
      fullName: user ? user.split('@')[0] : '', 
      email: user || '',
      phone: '' 
    }));
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile({ fullName: profile.fullName, phone: profile.phone });
      showToast("Protocol Success", "Institutional profile updated successfully", "success");
    } catch (err) {
      showToast("Update Blocked", err.message || "Failed to commit changes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateEmailUpdate = async () => {
    if (!newEmail) return showToast("Requirement", "Please enter a new email address", "warning");
    setLoading(true);
    try {
      await authService.initiateEmailUpdate(newEmail);
      setShowOtp(true);
      showToast("OTP Broadcast", "Verification code sent to " + newEmail, "success");
    } catch (err) {
      showToast("Link Failure", err.message || "Failed to initiate update", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailUpdate = async () => {
    if (!otp) return showToast("Validation", "Please enter the verification code", "warning");
    setLoading(true);
    try {
      await authService.confirmEmailUpdate({ newEmail, otp });
      showToast("Success", "Account email updated successfully", "success");
      setProfile(prev => ({ ...prev, email: newEmail }));
      setShowOtp(false);
      setNewEmail('');
      setOtp('');
    } catch (err) {
      showToast("Audit Failed", err.message || "Invalid or expired code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deletePassword) return showToast("Authorization", "Password required for high-risk operations", "warning");
    setLoading(true);
    try {
      await authService.requestDeleteAccount(profile.email, deletePassword);
      setShowDeleteOtp(true);
      showToast("Warning Sent", "A critical deletion code has been sent to your email", "warning");
    } catch (err) {
      showToast("Access Denied", err.response?.data?.message || "Authorization failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deleteOtp) return showToast("Final Check", "Please enter the deletion code", "warning");
    setLoading(true);
    try {
      await authService.verifyDeleteAccount(profile.email, deleteOtp);
      showToast("Account Terminated", "Your account records have been permanently removed", "success");
      localStorage.clear();
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err) {
      showToast("Terminal Failure", err.response?.data?.message || "Invalid OTP code", "error");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Personal Info', icon: User, desc: 'YOUR INFORMATION' },
    { id: 'security', label: 'Security & Email', icon: Shield, desc: 'ACCOUNT PROTECTION' },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, desc: 'ACCOUNT DELETION', type: 'danger' }
  ];

  return (
    <div className="ps-page" onClick={() => setUserMenuOpen(false)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div className="premium-header" style={{ marginBottom: 0 }}>
          <h1 className="premium-title" style={{ margin: 0 }}>Command center for your institutional identity.</h1>
          <p className="premium-sub" style={{ margin: 0 }}>Manage your personal profile, security preferences, and authorized devices.</p>
        </div>

        <button 
          className="btn-vip" 
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
        >
          <LogOut size={16} /> Terminate Session
        </button>
      </div>

      <div className="ps-grid">
        {/* ── Left Sidebar Nav ── */}
        <div className="ps-nav">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              className={`ps-nav-card ${activeTab === item.id ? 'ps-nav-card--active' : ''} ${item.type === 'danger' ? 'ps-nav-card--danger' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={20} style={{ color: item.type === 'danger' ? '#ef4444' : activeTab === item.id ? 'var(--blue)' : 'var(--muted)' }} />
              <div className="ps-nav-info">
                <p className={`ps-nav-label ${item.type === 'danger' ? 'tone-error' : ''}`}>{item.label}</p>
                <p className="ps-nav-desc">{item.desc}</p>
              </div>
              <ChevronRight size={14} style={{ opacity: activeTab === item.id ? 1 : 0 }} />
            </button>
          ))}
        </div>

        {/* ── Main Configuration Zone ── */}
        <div className="ps-content">

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="ps-section-head">
                <User size={24} /> Personal Info
              </div>
              
              <div className="ps-form-grid">
                <div className="ps-field-group">
                  <label className="ps-field-label">Full Display Name</label>
                  <div className="ps-input-box">
                    <input 
                      type="text" 
                      value={profile.fullName}
                      onChange={e => setProfile({...profile, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="ps-field-group">
                  <label className="ps-field-label">Verified Phone</label>
                  <div className="ps-input-box">
                    <input 
                      type="tel" 
                      value={profile.phone}
                      placeholder="+91 XXXXX XXXXX"
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                    />
                    <span className="ps-badge">VERIFIED</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-vip" 
                  onClick={handleUpdateProfile} 
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="ma-spin" size={16} /> : 'Commit Changes'}
                </button>
              </div>


            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="ps-section-head">
                <Shield size={24} /> Security & Email
              </div>

              <div className="ps-field-group">
                <label className="ps-field-label">Verified Protocol Email</label>
                <div className="ps-input-box" style={{ background: 'var(--surface-2)', borderStyle: 'dashed' }}>
                  <span>{profile.email}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} style={{ color: '#10b981' }} />
                    <span className="ps-badge">ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="ps-field-group" style={{ marginTop: '32px' }}>
                <label className="ps-field-label">Update Authorization Email</label>
                {!showOtp ? (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="ps-input-box" style={{ flex: 1 }}>
                      <input 
                        type="email" 
                        placeholder="Enter new email address"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                      />
                    </div>
                    <button className="btn-vip" onClick={handleInitiateEmailUpdate} disabled={loading}>
                      Update
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="ps-input-box" style={{ flex: 1, borderColor: 'var(--blue)' }}>
                      <input 
                        type="text" 
                        maxLength="6"
                        placeholder="000000"
                        style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '20px', fontWeight: 800 }}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                      />
                    </div>
                    <button className="btn-vip" onClick={handleConfirmEmailUpdate} disabled={loading}>
                      Verify Code
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="ps-section-head" style={{ color: '#ef4444' }}>
                <ShieldAlert size={24} /> Danger Zone
              </div>

              <div className="ps-danger-banner">
                <div className="ps-danger-text">
                  <h3>Account Deletion</h3>
                  <p>Permanently remove all loan history, documents, and identity records.</p>
                </div>
                {!showDeleteOtp ? (
                  <button className="ps-btn-danger" onClick={() => setShowDeleteOtp(true)}>
                    Initialize Deletion
                  </button>
                ) : null}
              </div>

              {showDeleteOtp && (
                <div className="df-card" style={{ marginTop: '24px', padding: '32px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Lock size={32} style={{ color: '#ef4444', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Security Authorization</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Confirm with password and verification code.</p>
                  </div>

                  <div className="ps-field-group">
                    <label className="ps-field-label">Confirm Account Email (Type: {profile.email})</label>
                    <div className="ps-input-box" style={{ borderColor: deleteEmailConfirm === profile.email ? '#10b981' : '#ef4444' }}>
                      <input 
                        type="email" 
                        placeholder="Type your email to confirm"
                        value={deleteEmailConfirm}
                        onChange={e => setDeleteEmailConfirm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ps-field-group">
                    <label className="ps-field-label">Current Password</label>
                    <div className="ps-input-box">
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ps-field-group">
                    <label className="ps-field-label">Terminal Deletion OTP</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="ps-input-box" style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          maxLength="6"
                          placeholder="000000"
                          style={{ textAlign: 'center', letterSpacing: '0.4em' }}
                          value={deleteOtp}
                          onChange={e => setDeleteOtp(e.target.value)}
                        />
                      </div>
                      <button 
                        className="ps-btn-danger" 
                        style={{ minWidth: '160px', opacity: (deleteEmailConfirm === profile.email) ? 1 : 0.5 }} 
                        onClick={deleteOtp ? handleConfirmDeletion : handleRequestDeletion} 
                        disabled={loading || (deleteEmailConfirm !== profile.email)}
                      >
                        {deleteOtp ? 'Verify & Delete' : 'Request OTP'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

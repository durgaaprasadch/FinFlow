import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, 
  CheckCircle2, AlertCircle, Key, ChevronRight, 
  Lock, ShieldAlert
} from 'lucide-react';
import { authService } from '../api';
import { useToast } from '../hooks/useToast';
import '../Pages/DashboardFocus.css';

const ProfileSettings = () => {
  const { user, userRole } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteOtp, setShowDeleteOtp] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('finflow_user') || (user + "@finflow.in");
    setProfile(prev => ({ ...prev, fullName: user, email }));
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile({ fullName: profile.fullName, phone: profile.phone });
      showToast("Success", "Profile updated successfully", "success");
    } catch (err) {
      showToast("Update Failed", err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateEmailUpdate = async () => {
    if (!newEmail) return showToast("Required", "Please enter a new email address", "warning");
    setLoading(true);
    try {
      await authService.initiateEmailUpdate(newEmail);
      setShowOtp(true);
      showToast("OTP Sent", "Verification code sent to " + newEmail, "success");
    } catch (err) {
      showToast("Error", err.message || "Failed to initiate email update", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailUpdate = async () => {
    if (!otp) return showToast("Required", "Please enter the OTP", "warning");
    setLoading(true);
    try {
      await authService.confirmEmailUpdate({ newEmail, otp });
      showToast("Success", "Email updated successfully", "success");
      setProfile(prev => ({ ...prev, email: newEmail }));
      setShowOtp(false);
      setNewEmail('');
      setOtp('');
    } catch (err) {
      showToast("Verification Failed", err.message || "Invalid or expired code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deletePassword) return showToast("Required", "Please enter your password to confirm", "warning");
    setLoading(true);
    try {
      await authService.requestDeleteAccount(profile.email, deletePassword);
      setShowDeleteOtp(true);
      showToast("Verification Sent", "A deletion code has been sent to your email", "success");
    } catch (err) {
      showToast("Request Failed", err.response?.data?.message || "Invalid password or request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deleteOtp) return showToast("Required", "Please enter the deletion OTP", "warning");
    setLoading(true);
    try {
      await authService.verifyDeleteAccount(profile.email, deleteOtp);
      showToast("Account Deleted", "Your account has been permanently removed", "success");
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      showToast("Deletion Failed", err.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Personal Info', icon: User, desc: 'Your information' },
    { id: 'security', label: 'Security & Email', icon: Shield, desc: 'Account protection' },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, desc: 'Account deletion', variant: 'danger' }
  ];

  return (
    <div className="dashboard-focus-container">
      <div className="dash-container">
        
        <header className="dash-header-v2">
          <div>
            <h1>Settings</h1>
            <div className="metrics-row">
              <div className="metric-v2">
                <label>Account Email</label>
                <strong>{user || 'test@finflow.in'}</strong>
              </div>
              <div className="metric-v2">
                <label>Role</label>
                <strong style={{ textTransform: 'uppercase' }}>
                  {profile.email === 'durgaprasadch.in@gmail.com' ? 'Super Admin' : userRole}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <div className="dash-grid-v2">
          {/* Sidebar Nav */}
          <div className="content-side">
            <div className="bento-widget" style={{ padding: '16px' }}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: activeTab === item.id ? 'var(--dash-accent)' : 'transparent',
                    color: activeTab === item.id ? '#ffffff' : 'inherit',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    textAlign: 'left'
                  }}
                >
                  <item.icon size={18} opacity={activeTab === item.id ? 1 : 0.5} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 850 }}>{item.label}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>{item.desc}</div>
                  </div>
                  <ChevronRight size={14} opacity={activeTab === item.id ? 1 : 0} />
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="content-main">
            {activeTab === 'profile' && (
              <div className="bento-widget">
                <h2><User size={18} /> Personal Info</h2>
                <form onSubmit={handleUpdateProfile} className="metrics-row" style={{ flexDirection: 'column', gap: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div className="metric-v2">
                      <label>Full Display Name</label>
                      <input 
                        type="text" 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dash-border)', padding: '12px', borderRadius: '8px', color: 'inherit', fontWeight: 700 }}
                        value={profile.fullName}
                        onChange={e => setProfile({...profile, fullName: e.target.value})}
                      />
                    </div>
                    <div className="metric-v2">
                      <label>Verified Phone</label>
                      <input 
                        type="tel" 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dash-border)', padding: '12px', borderRadius: '8px', color: 'inherit', fontWeight: 700 }}
                        value={profile.phone}
                        placeholder="+91 XXXXX XXXXX"
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn-vip" disabled={loading}>
                      {loading ? "Processing..." : "Commit Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bento-widget">
                <h2><Shield size={18} /> Security & Email</h2>
                <div className="bento-widget" style={{ background: 'rgba(37,99,235,0.03)', borderStyle: 'dashed', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 850, color: 'var(--dash-muted)', textTransform: 'uppercase' }}>Email Address</label>
                      <div style={{ fontSize: '20px', fontWeight: 850 }}>{profile.email}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: '20px' }}>VERIFIED</span>
                  </div>
                </div>

                {!showOtp ? (
                  <div className="metric-v2">
                    <label>Update Email</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <input 
                        type="email" 
                        placeholder="Enter new email"
                        style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dash-border)', padding: '12px', borderRadius: '8px', color: 'inherit', fontWeight: 700 }}
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                      />
                      <button className="btn-vip" onClick={handleInitiateEmailUpdate} disabled={loading}>
                        Update Email
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bento-widget" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="text" 
                        maxLength="6"
                        placeholder="000000"
                        style={{ flex: 1, minWidth: '150px', textAlign: 'center', letterSpacing: '0.5em', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dash-accent)', padding: '16px', borderRadius: '12px', color: 'inherit', fontWeight: 850, fontSize: '20px' }}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                      />
                      <button className="btn-vip" onClick={handleConfirmEmailUpdate} disabled={loading}>
                        Verify Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="bento-widget" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <h2 style={{ color: '#ef4444' }}><ShieldAlert size={18} /> High-Risk</h2>
                {!showDeleteConfirm && !showDeleteOtp ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--dash-muted)', margin: 0, fontWeight: 500 }}>
                      Permanently delete all data and account records.
                    </p>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-vip"
                      style={{ background: '#ef4444' }}
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <div className="bento-widget" style={{ border: '2px solid #ef4444' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <Lock size={32} style={{ color: '#ef4444', marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '20px', fontWeight: 850, margin: 0 }}>Authorization</h3>
                      <p style={{ color: 'var(--dash-muted)', fontSize: '14px' }}>Enter password to delete account.</p>
                    </div>
                    {!showDeleteOtp ? (
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input 
                          type="password" 
                          style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.02)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', color: 'inherit', fontWeight: 700 }}
                          placeholder="••••••••"
                          value={deletePassword}
                          onChange={e => setDeletePassword(e.target.value)}
                        />
                        <button className="btn-vip" style={{ background: '#ef4444' }} onClick={handleRequestDeletion} disabled={loading}>
                          Request OTP
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input 
                          type="text" 
                          maxLength="6"
                          placeholder="000000"
                          style={{ flex: 1, minWidth: '200px', textAlign: 'center', letterSpacing: '0.5em', background: 'rgba(255,255,255,0.05)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', color: 'inherit', fontWeight: 850, fontSize: '18px' }}
                          value={deleteOtp}
                          onChange={e => setDeleteOtp(e.target.value)}
                        />
                        <button className="btn-vip" style={{ background: '#ef4444' }} onClick={handleConfirmDeletion} disabled={loading}>
                          Verify & Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

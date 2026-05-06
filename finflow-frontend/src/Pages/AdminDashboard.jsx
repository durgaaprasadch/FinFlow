import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, CheckCircle2, Clock, Download, FileText, 
  RefreshCw, Search, ShieldCheck, Users, XCircle, 
  ChevronRight, BarChart3, Activity, ShieldAlert, Zap, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService, applicationService } from '../api';
import { formatDate, formatMoney, labelize, statusTone, unwrap, formatError } from '../utils/format';
import ApplicationTimeline from '../Components/ApplicationTimeline';
import AdminAnalytics from '../Components/AdminAnalytics';
import './AdminDashboard.css';

/**
 * TAB RESOLVER:
 * Extracts the current view from the URL path.
 * Used for role-based navigation and conditional rendering.
 */
const tabFromPath = (pathname) => pathname.split('/').filter(Boolean).at(-1) || 'dashboard';

const STATUS_LABELS = {
  SUBMITTED:    'Submitted',
  DOCS_VERIFIED:'Docs Verified',
  REVIEW:       'Under Review',
  APPROVED:     'Approved',
  REJECTED:     'Rejected',
  REUPLOAD:     'Action Required',
};
const statusLabel = (s = '') => STATUS_LABELS[s?.toUpperCase()] || (s || '').toLowerCase().replace(/_/g, ' ');

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPath(location.pathname);
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [modalError, setModalError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);

  /**
   * APPLICATION MASTER LOADER:
   * Fetches all submitted loan files from the internal queue.
   */
  const loadApps = async () => {
    setLoading(true);
    setError('');
    try {
      const data = unwrap(await adminService.getSubmittedApplications());
      setApps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load apps:', err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (app) => {
    setSelected(app);
    setError('');
    setSelectedDetails(null);
    setModalError('');
    setHistory([]);
    setHistoryLoading(true);
    try {
      // Fetch details and history in parallel
      const [detailsRes, historyRes] = await Promise.all([
        adminService.getApplicationDetails(app.applicantUsername),
        adminService.getApplicationDetails(app.applicantUsername + "/history")
      ]);

      const details = unwrap(detailsRes);
      if (!details) throw new Error('Risk profile not found for this applicant.');
      setSelectedDetails(details);

      const historyData = unwrap(historyRes);
      if (Array.isArray(historyData)) {
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Failed to fetch review data:', err);
      setModalError(formatError(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  const verifyDocs = async () => {
    if (!selected) return;
    setVerifying(true);
    setError('');
    try {
      await adminService.verifyDocuments(selected.applicantUsername, 'DOCS_VERIFIED', 'Verified by admin via dashboard');
      await loadApps();
      setSelected({ ...selected, status: 'DOCS_VERIFIED' });
      const details = unwrap(await adminService.getApplicationDetails(selected.applicantUsername));
      setSelectedDetails(details);
    } catch (err) {
      setModalError(formatError(err));
    } finally {
      setVerifying(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = unwrap(await adminService.getAllUsers());
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = () => {
      if (activeTab === 'users') void loadUsers();
      // analytics and fraud-detection also need the apps list
      else if (['dashboard', 'applications', 'analytics'].includes(activeTab)) void loadApps();
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const filteredApps = useMemo(() => apps.filter((app) => {
    const haystack = `${app.fullName || ''} ${app.applicantUsername || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'all' || app.status === status);
  }), [apps, query, status]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const haystack = `${user.fullName || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [users, query, roleFilter]);

  const saveDecision = async () => {
    if (!selected || !remarks.trim()) {
      setError('Add internal remarks before saving a decision.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await adminService.makeDecision(selected.applicantUsername, decision, remarks, selectedModules.join(','));
      setSelected(null);
      setRemarks('');
      setSelectedModules([]);
      await loadApps();
    } catch (err) {
      setModalError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadDocs = async (applicantId) => {
    try {
      const response = await adminService.downloadDocumentsZip(applicantId);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `applicant_${applicantId}_docs.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const promote = async (email) => {
    setLoading(true);
    try {
      await adminService.promoteUser(email);
      await loadUsers();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const demote = async (email) => {
    setLoading(true);
    try {
      await adminService.demoteUser(email);
      await loadUsers();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const setHold = async (userId, status) => {
    setLoading(true);
    try {
      await adminService.updateUserStatus(userId, status);
      await loadUsers();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'analytics') {
    return (
      <div className="ad-root">
        <header className="ad-hero">
          <div className="ad-hero-text">
            <span className="ad-kicker">Advanced Analytics</span>
            <h1 className="ad-title">Performance Metrics</h1>
            <p className="ad-subtitle">Real-time visualization of loan origination and portfolio health.</p>
          </div>
        </header>
        <div style={{ marginTop: '24px' }}>
          <AdminAnalytics apps={apps} />
        </div>
      </div>
    );
  }


  if (['settings', 'notifications'].includes(activeTab)) {
    return <AdminPlaceholder tab={activeTab} />;
  }

  return (
    <div className="ad-root">
      <header className="ad-hero">
        <motion.div 
          className="ad-hero-text"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="ad-kicker">OPERATIONAL WORKSPACE</span>
          <h1 className="ad-title">
            {activeTab === 'users' ? 'User Identity Control' : activeTab === 'dashboard' ? 'Executive Overview' : 'Underwriting Queue'}
          </h1>
          <p className="ad-subtitle">
            {activeTab === 'users'
              ? 'Manage platform users, verify credentials, and promote administrative leads.'
              : activeTab === 'dashboard'
                ? 'Consolidated view of application throughput, system health, and priority workloads.'
                : 'Process submitted loan files, evaluate risk markers, and execute final credit decisions.'}
          </p>
        </motion.div>
        <div className="ad-hero-actions">
          <button className="ad-btn ad-btn-secondary" onClick={activeTab === 'users' ? loadUsers : loadApps} disabled={loading}>
            <RefreshCw className={loading ? 'spin' : ''} size={16} /> Refresh
          </button>
        </div>
      </header>

      {error && <div className="ad-alert"><AlertCircle size={18} /> {error}</div>}

      {activeTab === 'dashboard' && (
        <motion.div 
          className="ad-dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="ad-kpi-grid">
            <KPI cardClass="kpi-blue" label="INCOMING" value={apps.filter(a => a.status === 'SUBMITTED').length} icon={ShieldCheck} footer="Verification Pending" />
            <KPI cardClass="kpi-amber" label="IN PROGRESS" value={apps.filter(a => ['DOCS_VERIFIED', 'REVIEW'].includes(a.status)).length} icon={Clock} footer="Under Review" />
            <KPI cardClass="kpi-purple" label="ACTION REQ" value={apps.filter(a => a.status === 'REUPLOAD').length} icon={Activity} footer="Re-upload Required" />
            <KPI cardClass="kpi-green" label="FINALIZED" value={apps.filter(a => a.status === 'APPROVED').length} icon={CheckCircle2} footer="Approvals Issued" />
            <KPI cardClass="kpi-red" label="DECLINED" value={apps.filter(a => a.status === 'REJECTED').length} icon={ShieldAlert} footer="Policy Rejections" />
          </div>

          <div className="ad-feed-section" style={{ marginTop: '48px' }}>
            <div className="ad-feed-header">
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Priority Action Feed</h3>
              <button className="ad-btn-text" onClick={() => navigate('/admin/applications')}>
                Review All <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="ad-feed-container">
              <AnimatePresence mode="popLayout">
                {apps.filter(a => a.status === 'SUBMITTED' || a.status === 'DOCS_VERIFIED').length > 0 ? (
                  apps.filter(a => a.status === 'SUBMITTED' || a.status === 'DOCS_VERIFIED').slice(0, 5).map((app, idx) => (
                    <motion.div 
                      key={app.id || app.applicationId || app.applicantUsername} 
                      className="ad-feed-item-new" 
                      onClick={() => handleReview(app)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="ad-feed-item-left">
                        <div className="ad-avatar-new">{app.fullName?.charAt(0) || 'A'}</div>
                        <div>
                          <div className="ad-feed-name-new">{app.fullName || 'Anonymous Applicant'}</div>
                          <div className="ad-feed-sub-new">{labelize(app.loanType)} • {formatMoney(app.loanAmount || app.requestedAmount)}</div>
                        </div>
                      </div>
                      <div className="ad-feed-item-right">
                        <span className={`ad-badge ${app.status.toLowerCase()}`}>{statusLabel(app.status)}</span>
                        <span className="ad-feed-time-new">{formatDate(app.submittedAt || app.updatedAt)}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="ad-empty-dashed">
                    <CheckCircle2 className="text-emerald" size={48} style={{ marginBottom: '16px' }} />
                    <p style={{ color: 'var(--muted)', fontSize: '16px' }}>Operational workload is currently clear.</p>
                    <p style={{ color: 'var(--faint)', fontSize: '14px', marginTop: '8px' }}>No applications require manual underwriting intervention right now.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="ad-quick-nav-section" style={{ marginTop: '48px' }}>
            <div className="ad-quick-nav-grid">
              <div className="ad-quick-nav-card" onClick={() => navigate('/admin/applications')}>
                <div className="ad-quick-nav-inner">
                  <Archive className="icon-blue" size={28} />
                  <div>
                    <p className="ad-quick-nav-title">Loan Archive</p>
                    <p className="ad-quick-nav-desc">Access full history</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </div>
              
              <div className="ad-quick-nav-card" onClick={() => navigate('/admin/users')}>
                <div className="ad-quick-nav-inner">
                  <Users className="icon-purple" size={28} />
                  <div>
                    <p className="ad-quick-nav-title">Identity Control</p>
                    <p className="ad-quick-nav-desc">Manage roles & permissions</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </div>
              
              <div className="ad-quick-nav-card" onClick={() => navigate('/admin/analytics')}>
                <div className="ad-quick-nav-inner">
                  <BarChart3 className="icon-emerald" size={28} />
                  <div>
                    <p className="ad-quick-nav-title">Analytics</p>
                    <p className="ad-quick-nav-desc">Deep dive into metrics</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab !== 'dashboard' && (
        <motion.section 
          className="table-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="ad-toolbar">
            <div className="ad-toolbar-left">
              <h2>{activeTab === 'users' ? 'Platform User Directory' : 'Application Master Queue'}</h2>
            </div>
            <div className="ad-toolbar-right">
              <div className="ad-search-wrap">
                <Search size={16} />
                <input className="ad-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name, email, or identity..." />
              </div>
              {activeTab === 'users' ? (
                <select className="ad-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="APPLICANT">Applicants</option>
                </select>
              ) : (
                <select className="ad-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">All States</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="DOCS_VERIFIED">Docs Verified</option>
                  <option value="REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="REUPLOAD">Action Required</option>
                </select>
              )}
            </div>
          </div>

          <div className="ad-panel-body no-pad">
            {activeTab === 'users' ? (
              <UsersTable users={filteredUsers} promote={promote} demote={demote} setHold={setHold} loading={loading} />
            ) : (
              <ApplicationsTable
                apps={filteredApps}
                open={handleReview}
                downloadDocs={downloadDocs}
              />
            )}
          </div>
        </motion.section>
      )}

      <AnimatePresence>
        {selected && (
          <div className="ad-modal-backdrop" onClick={() => { setSelected(null); setSelectedDetails(null); }}>
            <motion.div 
              className="ad-modal" 
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="ad-modal-head">
                <div>
                  <h2>{selected.fullName || 'Operational Review'}</h2>
                  <p>{selected.applicantUsername} • {labelize(selected.loanType)} • {formatMoney(selected.requestedAmount || selected.loanAmount)}</p>
                </div>
                <span className={`ad-badge ${selected.status.toLowerCase()}`}>{statusLabel(selected.status)}</span>
              </div>

              <div className="ad-modal-body">
                {modalError && (
                  <motion.div 
                    className="ad-alert ad-modal-alert"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={16} /> {modalError}
                  </motion.div>
                )}
                {selectedDetails && (
                  <div className="ad-info-section">
                    <h3>Risk Assessment Profile</h3>
                    <div className="ad-info-grid">
                      <InfoField label="Identity (PAN)" value={selectedDetails.panNumber} />
                      <InfoField label="Social (Aadhaar)" value={selectedDetails.aadhaarNumber} />
                      <InfoField label="Monthly Cashflow" value={formatMoney(selectedDetails.monthlyIncome)} />
                      <InfoField label="Employment Sector" value={labelize(selectedDetails.employmentType)} />
                      <InfoField label="Work Location" value={selectedDetails.companyName} wide />
                      <InfoField label="Residential Address" value={`${selectedDetails.addressLine1}, ${selectedDetails.city}, ${selectedDetails.state} ${selectedDetails.pincode}`} wide />
                    </div>
                  </div>
                )}

                <hr className="ad-divider" />

                <div className="ad-info-section">
                  <h3>Audit Trail & Progress</h3>
                  {historyLoading ? (
                    <div className="ad-empty" style={{ padding: '20px' }}>
                      <RefreshCw className="spin" size={20} />
                      <p>Loading history...</p>
                    </div>
                  ) : (
                    <ApplicationTimeline timeline={history} />
                  )}
                </div>

                {!['APPROVED', 'REJECTED'].includes(selected.status) && (
                  <>
                    <hr className="ad-divider" />
                    <div className="ad-info-section">
                      <h3>Operations Control</h3>
                      <div className="ad-decision-row">
                        <div className="ad-form-field">
                          <label className="ad-form-label">Compliance Step</label>
                          {selected.status === 'SUBMITTED' ? (
                            <button className="ad-btn ad-btn-primary ad-btn-wide" onClick={verifyDocs} disabled={verifying}>
                              <ShieldCheck size={16} /> {verifying ? 'Processing...' : 'Verify Documentation'}
                            </button>
                          ) : (
                            <div className="ad-info-value" style={{ color: '#22c980', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={14} /> Documentation Secure
                            </div>
                          )}
                        </div>
                        <div className="ad-form-field">
                          <label className="ad-form-label">Final Decision</label>
                          <select className="ad-form-select" value={decision} onChange={(event) => setDecision(event.target.value)}>
                            <option value="APPROVED">Approve Funding</option>
                            <option value="REJECTED">Decline Application</option>
                            <option value="REUPLOAD">Request Re-upload</option>
                          </select>
                        </div>
                        {decision === 'REUPLOAD' && (
                          <div className="ad-form-field wide" style={{ marginTop: '16px' }}>
                            <label className="ad-form-label">Flag Documents for Re-upload</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '8px' }}>
                              {['AADHAAR', 'PAN', 'SALARY_SLIP', 'BANK_STATEMENT', 'PHOTO'].map(mod => (
                                <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'var(--panel)', borderRadius: '6px', fontSize: '12px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedModules.includes(mod)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedModules([...selectedModules, mod]);
                                      else setSelectedModules(selectedModules.filter(m => m !== mod));
                                    }}
                                  />
                                  {mod.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="ad-form-field wide">
                          <label className="ad-form-label">Underwriter Remarks (Internal)</label>
                          <textarea 
                            className="ad-form-textarea" 
                            value={remarks} 
                            onChange={(event) => setRemarks(event.target.value)} 
                            placeholder="Detail the rationale for this decision..." 
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="ad-modal-footer">
                <button className="ad-btn ad-btn-secondary" onClick={() => { setSelected(null); setSelectedDetails(null); }}>Close Panel</button>
                <div className="ad-modal-footer-right">
                  <button className="ad-btn ad-btn-ghost" onClick={() => downloadDocs(selected.applicantUsername)}>
                    <Download size={14} /> Packet
                  </button>
                  {!['APPROVED', 'REJECTED'].includes(selected.status) && (
                    <button
                      className="ad-btn ad-btn-primary"
                      onClick={saveDecision}
                      disabled={loading || selected.status === 'SUBMITTED' || ['APPROVED', 'REJECTED'].includes(selected.status)}
                    >
                      {decision === 'APPROVED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />} 
                      {loading ? 'Saving...' : 'Finalize Decision'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Sub-Components ────────────────────────────────────────── */

const KPI = ({ cardClass, label, value, icon: Icon, footer }) => (
  <article className={`ad-metric-card ${cardClass}`}>
    <div className="ad-metric-inner">
      <div>
        <p className="ad-metric-label">{label}</p>
        <p className="ad-metric-value">{value}</p>
        <p className="ad-metric-footer">{footer}</p>
      </div>
      <div className="ad-metric-icon-wrap">
        <Icon size={48} strokeWidth={2} />
      </div>
    </div>
  </article>
);

const HealthRow = ({ name, status }) => (
  <div className="ad-health-row">
    <span>{name}</span>
    <div className={`ad-dot ${status}`}></div>
  </div>
);

const InfoField = ({ label, value, wide }) => (
  <div className={`ad-info-field ${wide ? 'wide' : ''}`}>
    <span className="ad-info-label">{label}</span>
    <div className="ad-info-value">{value || 'Not provided'}</div>
  </div>
);

const ApplicationsTable = ({ apps, open, downloadDocs }) => (
  <table className="ad-table">
    <thead>
      <tr>
        <th>Applicant Identity</th>
        <th>Loan Product</th>
        <th>Exposure</th>
        <th>Current State</th>
        <th>Timestamp</th>
        <th style={{ textAlign: 'right' }}>Management</th>
      </tr>
    </thead>
    <tbody>
      {apps.map((app) => (
        <tr key={app.id || app.applicationId || app.applicantUsername}>
          <td>
            <span className="ad-cell-name">{app.applicantUsername}</span>
            <span className="ad-cell-sub">{app.fullName || 'Identity Pending'}</span>
          </td>
          <td style={{ fontWeight: 500 }}>{app.loanType ? app.loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</td>
          <td style={{ fontWeight: 600 }}>{formatMoney(app.requestedAmount || app.loanAmount)}</td>
          <td><span className={`ad-badge ${app.status.toLowerCase()}`}>{statusLabel(app.status)}</span></td>
          <td style={{ color: 'var(--muted)' }}>{formatDate(app.submittedAt || app.updatedAt)}</td>
          <td style={{ textAlign: 'right' }}>
            <div className="ad-table-actions" style={{ justifyContent: 'flex-end' }}>
              <button 
                onClick={() => downloadDocs(app.applicantUsername)} 
                title="Download Docs"
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px 16px' }}
              >
                <Download size={16} />
              </button>
              <button 
                onClick={() => open(app)}
                style={{ background: 'transparent', border: 'none', color: 'var(--info)', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
              >
                {['APPROVED', 'REJECTED'].includes(app.status) ? 'View' : 'Review'}
              </button>
            </div>
          </td>
        </tr>
      ))}
      {!apps.length && <tr><td colSpan="6" className="ad-empty">No records matching criteria.</td></tr>}
    </tbody>
  </table>
);

const UsersTable = ({ users, promote, demote, setHold, loading }) => (
  <table className="ad-table">
    <thead>
      <tr>
        <th>Account Profile</th>
        <th>System Role</th>
        <th>Account Status</th>
        <th style={{ textAlign: 'right' }}>Operations</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.id || user.email}>
          <td>
            <span className="ad-cell-name">{user.email}</span>
            <span className="ad-cell-sub">{user.fullName || 'Unverified User'}</span>
          </td>
          <td>
            <span className={`ad-role-badge ${user.role.toLowerCase()}`}>
              {user.email === 'durgaprasadch.in@gmail.com' ? 'SUPER ADMIN' : user.role}
            </span>
          </td>
          <td><span className={`ad-badge ${user.status === 'ACTIVE' ? 'docs_verified' : 'closed'}`}>{user.status}</span></td>
          <td style={{ textAlign: 'right' }}>
            <div className="ad-table-actions" style={{ justifyContent: 'flex-end' }}>
              {user.email !== 'durgaprasadch.in@gmail.com' && (
                <>
                  {user.role !== 'ADMIN' ? (
                    <button 
                      onClick={() => promote(user.email)} 
                      disabled={loading}
                      style={{ background: 'transparent', border: 'none', color: 'var(--info)', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
                    >
                      Promote
                    </button>
                  ) : (
                    <button 
                      onClick={() => demote(user.email)} 
                      disabled={loading}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
                    >
                      Demote
                    </button>
                  )}
                  {user.status !== 'ON_HOLD' ? (
                    <button 
                      onClick={() => setHold(user.id, 'ON_HOLD')} 
                      disabled={loading}
                      style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
                    >
                      Hold
                    </button>
                  ) : (
                    <button 
                      onClick={() => setHold(user.id, 'ACTIVE')} 
                      disabled={loading}
                      style={{ background: 'transparent', border: 'none', color: 'var(--success)', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
                    >
                      Activate
                    </button>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      ))}
      {!users.length && <tr><td colSpan="4" className="ad-empty">No users resolved.</td></tr>}
    </tbody>
  </table>
);

const AdminPlaceholder = ({ tab }) => (
  <div className="ad-root">
    <header className="ad-hero">
      <div className="ad-hero-text">
        <span className="ad-kicker">Advanced Analytics</span>
        <h1 className="ad-title">{labelize(tab)} Interface</h1>
        <p className="ad-subtitle">This operation center is ready for microservice synchronization.</p>
      </div>
    </header>
    <section className="ad-panel" style={{ marginTop: '28px' }}>
      <div className="ad-placeholder-empty">
        <BarChart3 size={48} />
        <p>Telemetry data for <strong>{labelize(tab)}</strong> will appear here once the backend streaming endpoint is active.</p>
      </div>
    </section>
  </div>
);

export default AdminDashboard;

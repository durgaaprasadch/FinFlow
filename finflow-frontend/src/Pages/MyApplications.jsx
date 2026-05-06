import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Files, ChevronRight, Activity, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '../api';
import { formatDate, formatMoney, labelize, statusTone, unwrap, formatError } from '../utils/format';
import './MyApplications.css';
import './Experience.css';

const MyApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = unwrap(await applicationService.getHistory());
      setApps(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to withdraw this application? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      await applicationService.deleteById(id);
      await load();
      setSelectedApp(null);
    } catch (err) {
      setError(formatError(err));
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="ma-page">
      {/* ── Page Header ── */}
      <header className="ma-header">
        <div className="ma-header-content">
          <h1 className="premium-title">Your complete loan file history.</h1>
          <p className="premium-sub">Review the lifecycle of every application you’ve initiated on the FinFlow platform.</p>
        </div>
        <button className="ma-refresh-btn" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} size={16} />
          <span>Refresh</span>
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      {/* ── Application List ── */}
      <motion.section 
        className="ma-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="ma-panel-head">
          <div className="ma-panel-title">
            <h2>Application List</h2>
            <p>{apps.length} records found in your archive.</p>
          </div>
          <Activity size={20} color="var(--blue)" style={{ opacity: 0.5 }} />
        </div>

        <div className="ma-table-wrap">
          <table className="ma-table">
            <thead>
              <tr>
                <th>Account Identity</th>
                <th>Product Type</th>
                <th>Amount</th>
                <th>Current Status</th>
                <th>Last Update</th>
                <th style={{ textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {apps.map((app, index) => (
                  <motion.tr 
                    key={app.applicationId || app.id}
                    className="ma-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedApp(app)}
                  >
                    <td>
                      <div className="ma-identity">
                        <div className="ma-icon-box">
                          <Files size={14} />
                        </div>
                        <strong>{app.applicantUsername || 'Your Account'}</strong>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{labelize(app.loanType)}</span></td>
                    <td><strong style={{ color: 'var(--ink)' }}>{formatMoney(app.requestedAmount || app.amount)}</strong></td>
                    <td>
                      <span className={`ma-status-pill ${statusTone(app.status)}`}>
                        {labelize(app.status)}
                      </span>
                    </td>
                    <td><span style={{ color: 'var(--muted)', fontSize: '13px' }}>{formatDate(app.updatedAt || app.submittedAt)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="ma-management-actions">
                        {app.status === 'REUPLOAD' && (
                          <button 
                            className="ma-reupload-btn"
                            onClick={(e) => { e.stopPropagation(); navigate('/applicant/documents'); }}
                          >
                            <Upload size={14} />
                            <span>Re-upload</span>
                          </button>
                        )}
                        <button className="ma-action-btn">
                          <span>View</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              
              {!apps.length && !loading && (
                <tr>
                  <td colSpan="6">
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                      <p>No application history found. Your future financial records will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedApp && (
          <div className="ma-modal-overlay" onClick={() => setSelectedApp(null)}>
            <motion.div 
              className="ma-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="ma-modal-close" onClick={() => setSelectedApp(null)}><X /></button>
              
              <div className="ma-modal-head">
                <h3>{labelize(selectedApp.loanType)}</h3>
                <p>{selectedApp.applicantUsername || 'Account Application'}</p>
              </div>

              <div className="ma-modal-grid">
                <div className="ma-modal-stat">
                  <label>Requested Amount</label>
                  <strong>{formatMoney(selectedApp.requestedAmount || selectedApp.amount)}</strong>
                </div>
                <div className="ma-modal-stat">
                  <label>Current Status</label>
                  <span className={`ma-status-pill ${statusTone(selectedApp.status)}`}>
                    {labelize(selectedApp.status)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Last Updated</label>
                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{formatDate(selectedApp.updatedAt || selectedApp.submittedAt)}</p>
              </div>

              <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid var(--line)', fontSize: '14px' }}>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Your application has been {selectedApp.status.toLowerCase()}. 
                  All documents were reviewed by the underwriting team for compliance and eligibility.
                </p>
                {selectedApp.status === 'APPROVED' && (
                  <div style={{ marginTop: '16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}>
                    Disbursement initiated • Expected within 2 business days
                  </div>
                )}
              </div>

              <div className="ma-modal-footer">
                <button className="ma-modal-btn secondary" onClick={() => setSelectedApp(null)}>Close</button>
                {selectedApp.status === 'REUPLOAD' ? (
                  <button className="ma-modal-btn primary" style={{ background: '#ef4444' }} onClick={() => navigate('/applicant/documents')}>
                    <Upload size={16} /> Re-upload Now
                  </button>
                ) : ['DRAFT', 'SUBMITTED', 'DOCS_VERIFIED'].includes(selectedApp.status) ? (
                  <button className="ma-modal-btn primary" style={{ background: '#ef4444' }} onClick={() => handleDelete(selectedApp.applicationId || selectedApp.id)}>
                    Withdraw Application
                  </button>
                ) : (
                  <button className="ma-modal-btn primary">Download Sanction Letter</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyApplications;

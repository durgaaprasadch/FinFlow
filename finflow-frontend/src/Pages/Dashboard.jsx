import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowRight, Activity, CheckCircle2,
  AlertCircle, History, ExternalLink,
  User, Shield, Zap, Info
} from 'lucide-react';
import { applicationService, documentService } from '../api';
import { formatMoney, labelize, unwrap, formatError } from '../utils/format';
import './DashboardFocus.css';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [active, setActive] = useState(null);
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * DATA HYDRATION:
   * Fetches the latest loan status and document metadata on page load.
   * unwrap() is used to extract data from the axios response wrapper.
   */
  const load = async () => {
    setLoading(true);
    try {
      const status = unwrap(await applicationService.getStatus());
      setActive(status);
      try {
        const files = unwrap(await documentService.getUploadedFiles());
        setDocs(files?.documents || {});
      } catch { setDocs({}); }
    } catch (err) { setError(formatError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const uploadedCount = Object.keys(docs).length;
  const currentStatus = (active?.status || 'NONE').toUpperCase();

  const ribbonSteps = useMemo(() => [
    { key: 'DRAFT', label: 'Draft', completed: !!active },
    { key: 'SUBMITTED', label: 'Submitted', completed: ['SUBMITTED', 'PENDING', 'REVIEW', 'APPROVED', 'REJECTED'].includes(currentStatus) },
    { key: 'REVIEW', label: 'Review', completed: ['REVIEW', 'APPROVED', 'REJECTED'].includes(currentStatus) },
    { key: 'DECISION', label: 'Decision', completed: ['APPROVED', 'REJECTED'].includes(currentStatus) }
  ], [active, currentStatus]);

  const timeline = useMemo(() => {
    if (!active?.timeline) return [];
    return [...active.timeline].sort((a, b) => new Date(b.changedAt || b.time) - new Date(a.changedAt || a.time));
  }, [active]);

  if (loading) {
    return (
      <div className="dashboard-focus-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-focus-container">
      <div className="dash-container">

        {/* 1. VIP STATUS RIBBON */}
        <section className="dash-ribbon">
          <div className="ribbon-steps-v2">
            {ribbonSteps.map((step) => (
              <div key={step.key} className={`ribbon-step-v2 ${step.completed ? 'completed' : ''} ${currentStatus === step.key ? 'active' : ''}`}>
                <div className="step-dot-v2" />
                {step.label}
              </div>
            ))}
          </div>
          <div className="ribbon-status-msg">
            {currentStatus === 'APPROVED' ? 'Workflow Finalized' : ''}
          </div>
        </section>

        {/* 2. AUTHORITATIVE HEADER */}
        <header className="dash-header-v2">
          <div>
            <h1>Capital Dashboard</h1>
            <div className="metrics-row">
              <div className="metric-v2">
                <label>Total Capital</label>
                <strong>{formatMoney(active?.requestedAmount) || '₹0.00'}</strong>
              </div>
              <div className="metric-v2">
                <label>Doc Progress</label>
                <strong>{uploadedCount} / 5 Ready</strong>
              </div>
              <div className="metric-v2">
                <label>Current Status</label>
                <strong style={{ color: currentStatus === 'APPROVED' ? '#22c55e' : currentStatus === 'REJECTED' ? '#ef4444' : 'inherit' }}>
                  {labelize(currentStatus)}
                </strong>
              </div>
            </div>
          </div>
          <a href={currentStatus === 'REUPLOAD' ? "/applicant/documents" : "/applicant/apply"} className="btn-vip">
            {['APPROVED', 'REJECTED'].includes(currentStatus)
              ? 'Start New Loan Application'
              : currentStatus === 'REUPLOAD'
                ? 'Update File'
                : 'Manage Application'}
            <ArrowRight size={18} />
          </a>
        </header>

        {error && <div className="bento-widget" style={{ background: '#fff1f1', color: '#c53030', borderColor: '#feb2b2', marginBottom: '24px' }}>{error}</div>}

        {/* 3. OFFICIAL BENTO GRID */}
        <main className="dash-grid-v2">

          {/* Main Column: Activity Log */}
          <div className="content-main" style={{ gridColumn: 'span 2' }}>
            <section className="bento-widget">
              <h2><History size={18} /> Activity Timeline</h2>
              <table className="feed-table">
                <tbody>
                  {timeline.length > 0 ? timeline.map((event, i) => {
                    const status = (event.toStatus || event.status || 'DRAFT');
                    const tone = status.toUpperCase() === 'APPROVED' ? 'approved' : status.toUpperCase() === 'REJECTED' ? 'rejected' : 'pending';
                    return (
                      <tr key={i}>
                        <td style={{ width: '130px' }}>
                          <span className={`status-pill ${tone}`}>{labelize(status)}</span>
                        </td>
                        <td>
                          <div className="event-details">
                            <div>{event.reason || (status === 'REJECTED' ? 'Underwriting assessment flagged deviation.' : 'Official state transition verified.')}</div>
                            <div>Verified Ledger Entry</div>
                          </div>
                        </td>
                        <td className="event-time">
                          {new Date(event.changedAt || event.time).toLocaleString('en-IN', {
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: true
                          })}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Waiting for first official update.</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>

        </main>

        <footer style={{ marginTop: '80px', padding: '40px 0', borderTop: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--dash-muted)', fontWeight: 600 }}>
          <div>© 2026 FinFlow Enterprise · The Banking Interface</div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <span>Privacy Policy</span>
            <span>Service Terms</span>
            <span> Support</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Dashboard;

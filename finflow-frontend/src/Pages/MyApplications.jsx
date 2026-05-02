import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Files, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService } from '../api';
import { formatDate, formatMoney, labelize, statusTone, unwrap, formatError } from '../utils/format';
import './Experience.css';

const MyApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError(formatError(err));
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="dashboard-page">
      <section className="page-hero">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <span className="page-kicker">Account History</span>
          <h1>Your complete loan file history.</h1>
          <p>Review the lifecycle of every application you've initiated on the FinFlow platform.</p>
        </motion.div>
        <button className="btn secondary" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} size={16} /> Refresh
        </button>
      </section>

      {error && <div className="alert">{error}</div>}

      <motion.section 
        className="panel-premium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="panel-header-premium">
          <div>
            <h2>Application List</h2>
            <p>{apps.length} records found in your archive.</p>
          </div>
          <Activity size={20} color="var(--blue)" style={{ opacity: 0.5 }} />
        </div>
        <div className="panel-body table-wrap">
          <table className="data-table">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--blue)' }}>
                          <Files size={16} />
                        </div>
                        <strong>{app.applicantUsername || 'Your Account'}</strong>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{labelize(app.loanType)}</span></td>
                    <td><strong style={{ color: 'var(--ink)' }}>{formatMoney(app.requestedAmount || app.amount)}</strong></td>
                    <td><span className={`status-pill ${statusTone(app.status)}`}>{labelize(app.status)}</span></td>
                    <td><span style={{ color: 'var(--muted)', fontSize: '13px' }}>{formatDate(app.updatedAt || app.submittedAt)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {['DRAFT', 'SUBMITTED', 'DOCS_VERIFIED'].includes(app.status) && (
                        <button 
                          className="btn ghost danger sm" 
                          onClick={() => handleDelete(app.applicationId || app.id)}
                          disabled={loading}
                          title="Withdraw Application"
                        >
                          <Trash2 size={16} /> Withdraw
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!apps.length && !loading && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <p>No application history found. Your future financial records will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

export default MyApplications;

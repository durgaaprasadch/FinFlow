import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService } from '../api';
import { formatDateTime, labelize, unwrap, formatError } from '../utils/format';
import { 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  Search, 
  History as HistoryIcon 
} from 'lucide-react';
import './TimelineHistory.css';
import './Experience.css';

const TimelineHistory = () => {
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = unwrap(await applicationService.getStatus());
        setActive(data);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const timeline = useMemo(() => {
    const list = active?.timeline || [];
    if (!Array.isArray(list)) return [];
    return [...list]
      .filter(item => item && (item.toStatus || item.status))
      .sort((a, b) => 
        new Date(b.changedAt || b.time || 0) - new Date(a.changedAt || a.time || 0)
      );
  }, [active]);

  const getStatusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('VERIFIED')) return { icon: Check, tone: 'success' };
    if (s.includes('REJECTED') || s.includes('FAIL')) return { icon: AlertTriangle, tone: 'error' };
    if (s.includes('REUPLOAD') || s.includes('PENDING')) return { icon: RefreshCw, tone: 'warn' };
    return { icon: FileText, tone: 'neutral' };
  };

  return (
    <div className="th-page">
      {/* ── Header ── */}
      <header className="th-header" style={{ marginBottom: '48px' }}>
        <div className="th-kicker">
          <Search size={12} /> FINANCIAL RECORD
        </div>
        <h1 className="premium-title">Your complete loan file history.</h1>
        <p className="premium-sub" style={{ marginTop: '8px' }}>
          {active ? (
            <>Tracking progression for: <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{active.applicantUsername || 'Your Active Loan'}</span></>
          ) : (
            'Audit-grade transparency for your latest application status.'
          )}
        </p>
      </header>

      {error && <div className="alert warn" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div className="th-list">
        <AnimatePresence mode="popLayout">
          {timeline.map((item, index) => {
            const { icon: Icon, tone } = getStatusMeta(item.toStatus);
            const authorChar = item.changedBy ? item.changedBy.charAt(0).toUpperCase() : 'S';
            const authorColor = authorChar === 'S' ? '#f59e0b' : authorChar === 'A' ? '#10b981' : 'var(--blue)';

            return (
              <motion.div
                key={`${item.changedAt}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`th-item th-item--${tone}`}
              >
                <div className="th-dot">
                  <Icon size={20} className={tone === 'warn' ? 'ma-spin' : ''} />
                </div>

                <div className="th-card">
                  <div className="th-card-head">
                    <div className="th-flow">
                      {item.fromStatus && (
                        <>
                          <span className="th-status-pill th-status-pill--from">{labelize(item.fromStatus)}</span>
                          <span className="th-arrow">→</span>
                        </>
                      )}
                      <span className={`th-status-pill th-status-pill--${tone === 'neutral' ? 'to' : tone}`}>
                        {labelize(item.toStatus)}
                      </span>
                    </div>
                    <div className="th-time">
                      {formatDateTime(item.changedAt || item.time)}
                    </div>
                  </div>

                  <div className="th-reason">
                    {item.reason || 'Workflow state transitioned successfully in accordance with platform protocols.'}
                  </div>

                  <div className="th-footer">
                    <div className="th-author">
                      <div className="th-avatar" style={{ background: authorColor }}>
                        {authorChar}
                      </div>
                      <span className="th-author-name">
                        Verified by {authorChar === 'S' ? 'SYSTEM' : authorChar === 'A' ? 'ADMIN' : (active?.applicantUsername || 'USER')}
                      </span>
                    </div>
                    <div className="th-step">STEP {timeline.length - index}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {timeline.length > 3 && (
          <div className="relative flex items-center justify-center gap-x-4 text-zinc-400 hover:text-white cursor-pointer text-sm py-3" style={{ paddingLeft: '72px' }}>
            <span style={{ flex: 1, height: '1px', background: 'var(--line)' }}></span>
            {timeline.length - 3} more events (Step 1–{timeline.length - 3})
            <span style={{ flex: 1, height: '1px', background: 'var(--line)' }}></span>
          </div>
        )}

        {!loading && !timeline.length && (
          <div className="df-empty" style={{ padding: '80px 0' }}>
            <HistoryIcon size={40} strokeWidth={1} />
            <p>Your journey hasn't started yet. Submit an application to see the audit trail.</p>
          </div>
        )}

        {loading && (
          <div className="df-empty" style={{ padding: '80px 0' }}>
            <RefreshCw size={40} strokeWidth={1} className="ma-spin" />
            <p>Scanning the latest financial records...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineHistory;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService } from '../api';
import { formatDate, formatDateTime, labelize, unwrap, formatError } from '../utils/format';
import { History, ArrowRight, User, Clock, CheckCircle2, AlertCircle, RefreshCcw, FileText, Send } from 'lucide-react';
import { statusTone } from '../utils/format';
import './TimelineHistory.css';

const TimelineHistory = () => {
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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

  const timeline = [...(active?.timeline || [])].sort((a, b) => 
    new Date(b.changedAt) - new Date(a.changedAt)
  );

  const getStatusIcon = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('VERIFIED')) return <CheckCircle2 size={18} className="icon-success" />;
    if (s.includes('REJECTED') || s.includes('FAIL')) return <AlertCircle size={18} className="icon-error" />;
    if (s.includes('REUPLOAD') || s.includes('PENDING')) return <RefreshCcw size={18} className="icon-warn" />;
    if (s.includes('SUBMITTED')) return <Send size={18} className="icon-primary" />;
    return <FileText size={18} className="icon-muted" />;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    })
  };

  return (
    <div className="timeline-container">
      <header className="timeline-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="page-kicker"><History size={14} /> Audit Trail</span>
          <h1>Application Lifecycle</h1>
          <p>
            {active ? `Tracking progression for: ${active.applicantUsername || 'your account'}` : 'Detailed history of your application journey.'}
          </p>
        </motion.div>
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="alert"
        >
          {error}
        </motion.div>
      )}

      <div className="timeline-list">
        <AnimatePresence mode="popLayout">
          {timeline.map((item, index) => (
            <motion.div
              key={`${item.changedAt}-${index}`}
              custom={index}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              variants={cardVariants}
              className={`timeline-card tone-${statusTone(item.toStatus)}`}
            >
              <div className="timeline-marker">
                {getStatusIcon(item.toStatus)}
              </div>

              <div className="timeline-item-header">
                <div className="status-flow">
                  <span className="status-label status-from">{labelize(item.fromStatus)}</span>
                  <ArrowRight className="flow-arrow" size={14} />
                  <span className={`status-label status-to tone-${statusTone(item.toStatus)}`}>
                    {labelize(item.toStatus)}
                  </span>
                </div>
                <div className="timeline-time">
                  <Clock size={12} />
                  {formatDateTime(item.changedAt)}
                </div>
              </div>

              <div className="timeline-content">
                {item.reason || 'Workflow state transitioned successfully.'}
              </div>

              <div className="timeline-footer">
                <div className="author-info">
                  <div className={`avatar-lite tone-${statusTone(item.toStatus)}`}>
                    {item.changedBy ? item.changedBy.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="author-name">
                    {item.changedBy ? `Verified by ${item.changedBy}` : 'System Automated'}
                  </span>
                </div>
                <div className="step-indicator">Step {timeline.length - index}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !timeline.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-timeline"
          >
            <p>The timeline is empty. Start your application to see the journey unfold.</p>
          </motion.div>
        )}

        {loading && (
          <div className="empty-timeline">
            <p>Fetching audit trail...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineHistory;

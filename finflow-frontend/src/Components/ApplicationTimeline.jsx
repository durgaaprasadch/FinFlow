import React, { useState } from 'react';
import {
  Check, Clock, AlertCircle, FileCheck, ShieldCheck,
  FileText, UserCheck, Briefcase, CreditCard, Upload, Search, XCircle
} from 'lucide-react';
import '../Pages/DashboardFocus.css';

/* ── Status config (Official Registry) ─────────────────── */
const STATUS_CONFIG = {
  DRAFT: { icon: FileText, color: '#94a3b8', label: 'Draft Initialized', desc: 'System draft state enabled.' },
  SUBMITTED: { icon: FileCheck, color: '#3b82f6', label: 'System Submission', desc: 'System intake complete.' },
  DOCS_VERIFIED: { icon: ShieldCheck, color: '#10b981', label: 'Verified Ledger', desc: 'Underwriting verification passed.' },
  REVIEW: { icon: Search, color: '#f59e0b', label: 'Underwriting Review', desc: 'Internal systematic review active.' },
  REUPLOAD: { icon: AlertCircle, color: '#f97316', label: 'Information Required', desc: 'Document ledger update required.' },
  APPROVED: { icon: Check, color: '#22c55e', label: 'Approval Confirmed', desc: 'Final official clearance granted.' },
  REJECTED: { icon: XCircle, color: '#ef4444', label: 'Application Declined', desc: 'Systematic decline finalized.' },
};

const getConfig = (status = '') =>
  STATUS_CONFIG[status.toUpperCase()] || {
    icon: Clock,
    color: '#94a3b8',
    label: 'State Transition',
    desc: 'System activity update.',
  };

const formatTs = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
};

/* ── Official Progress Steps ───────────────────────────── */
const TRACKER_STEPS = [
  { key: 'DRAFT', label: 'Initiated' },
  { key: 'SUBMITTED', label: 'Intake' },
  { key: 'DOCS_VERIFIED', label: 'Verified' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'APPROVED', label: 'Final' }
];

const resolveStep = (status = '') => {
  if (['APPROVED', 'REJECTED', 'FAIL'].includes(status)) return 4;
  if (['REVIEW', 'REUPLOAD', 'DOCS_REUPLOADED'].includes(status)) return 3;
  if (['DOCS_VERIFIED', 'VERIFIED'].includes(status)) return 2;
  if (['SUBMITTED', 'DOCUMENTS_COMPLETED'].includes(status)) return 1;
  return 0;
};

const ApplicationTimeline = ({ timeline }) => {
  const [showAll, setShowAll] = useState(false);

  if (!timeline || timeline.length === 0) return null;

  const sorted = [...timeline].sort((a, b) => {
    const ta = new Date(b.changedAt || b.time);
    const tb = new Date(a.changedAt || a.time);
    return ta - tb;
  });

  // Keep the timeline clean by removing consecutive identical states
  const cleanTimeline = sorted.filter((event, index, arr) => {
    if (index === 0) return true;
    const currentStatus = (event.toStatus || event.status || '').toUpperCase();
    const prevStatus = (arr[index - 1].toStatus || arr[index - 1].status || '').toUpperCase();
    return currentStatus !== prevStatus;
  });

  const majorTimeline = cleanTimeline.filter(event => {
    const status = (event.toStatus || event.status || '').toUpperCase();
    return !!STATUS_CONFIG[status];
  });

  const displayTimeline = showAll ? cleanTimeline : (majorTimeline.length > 0 ? majorTimeline : cleanTimeline);

  const latestStatus = (sorted[0]?.toStatus || sorted[0]?.status || 'DRAFT').toUpperCase();
  const currentStep = resolveStep(latestStatus);
  const latestConfig = getConfig(latestStatus);

  return (
    <div className="system-timeline-wrapper">
      
      {/* ── Official Tracker ──────────────────────────── */}
      <div className="system-card">
        <div className="system-header">
          <h3>Lifecycle Status</h3>
          <span className="system-status-tag" style={{ color: latestConfig.color }}>
            {latestConfig.label}
          </span>
        </div>
        <div className="tracker-row">
          {TRACKER_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step.key} className={`tracker-node${isCompleted ? ' completed' : ''}${isCurrent ? ' active' : ''}`}>
                <div className="node-dot" />
                <span className="node-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Audit History Ledger ─────────────────────────── */}
      <div className="system-card">
        <div className="system-header">
          <h3>Audit History Log</h3>
          <span className="system-time">{cleanTimeline.length} Systematic Entries</span>
        </div>

        <div className="ledger-entries">
          {displayTimeline.map((event, index) => {
            const status = (event.toStatus || event.status || '').toUpperCase();
            const config = getConfig(status);
            const IconComp = config.icon;
            const ts = event.changedAt || event.time;
            const isLatest = index === 0;
            const actor = event.changedBy || 'SYSTEM';

            return (
              <div key={index} className={`system-step${isLatest ? ' active' : ''}`}>
                <div className="system-marker">
                  <div className="marker-circle-v2">
                    <IconComp size={14} />
                  </div>
                  {index < displayTimeline.length - 1 && <div className="marker-line-v2" />}
                </div>

                <div className="system-content-v2">
                  <div className="content-top-v2">
                    <span className="system-status-tag" style={{ color: isLatest ? config.color : 'inherit' }}>
                      {config.label}
                    </span>
                    <span className="system-time">{formatTs(ts)}</span>
                  </div>
                  <p className="system-reason">
                    {event.reason || config.desc}
                  </p>
                  <span className="system-actor">Verified by {actor}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {cleanTimeline.length > majorTimeline.length && (
          <button 
            onClick={() => setShowAll(!showAll)}
            style={{ 
              marginTop: '24px', 
              width: '100%', 
              padding: '12px', 
              background: 'transparent', 
              border: '1px dashed var(--line)', 
              borderRadius: '12px',
              color: 'var(--muted)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--line-strong)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            {showAll ? 'Collapse Detailed Audit Log' : `View Full Audit Trail (${cleanTimeline.length} entries)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default ApplicationTimeline;

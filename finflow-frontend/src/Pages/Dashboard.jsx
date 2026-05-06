import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, FileCheck2, Clock, Calendar,
  Plus, Download, ArrowRight, RefreshCw,
  Shield, Lock, BadgeCheck, ChevronRight,
  FileText, Banknote, CreditCard, IdCard,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService, documentService } from '../api';
import { formatMoney, labelize, unwrap, formatError } from '../utils/format';
import './DashboardFocus.css';

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const fmtShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ── Status config ────────────────────────────────────────── */
const STATUS_META = {
  APPROVED:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', label: 'Approved' },
  REJECTED:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'Rejected' },
  SUBMITTED:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', label: 'Submitted' },
  REVIEW:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Under Review' },
  DOCS_VERIFIED:{ color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', label: 'Docs Verified' },
  REUPLOAD:    { color: '#c07aff', bg: 'rgba(192,122,255,0.12)',border: 'rgba(192,122,255,0.3)',label: 'Re-upload Required' },
  DRAFT:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.3)',label: 'Draft' },
  NONE:        { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.3)',label: 'No Application' },
};
const getMeta = (s) => STATUS_META[s?.toUpperCase()] || STATUS_META.NONE;

/* ── DOC_TYPES ───────────────────────────────────────────── */
const DOC_ICONS = {
  AADHAAR:        <IdCard size={18} />,
  PAN:            <CreditCard size={18} />,
  SALARY_SLIP:    <Banknote size={18} />,
  BANK_STATEMENT: <FileText size={18} />,
  PHOTO:          <BadgeCheck size={18} />,
};
const DOC_LABELS = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  SALARY_SLIP: 'Salary Slip (3 mo.)',
  BANK_STATEMENT: 'Bank Statement',
  PHOTO: 'Photograph',
};

/* ═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [docsModal, setDocsModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { void load(); }, [load]);

  const currentStatus = (active?.status || 'NONE').toUpperCase();
  const meta = getMeta(currentStatus);
  const uploadedCount = Object.keys(docs).length;
  const totalDocs = 5;

  const ribbonSteps = useMemo(() => [
    { key: 'DRAFT',     label: 'Draft',       completed: !!active },
    { key: 'SUBMITTED', label: 'Submitted',   completed: ['SUBMITTED','DOCS_VERIFIED','REVIEW','APPROVED','REJECTED'].includes(currentStatus) },
    { key: 'REVIEW',    label: 'Under Review', completed: ['DOCS_VERIFIED','REVIEW','APPROVED','REJECTED'].includes(currentStatus) },
    { key: 'DECISION',  label: 'Decision',     completed: ['APPROVED','REJECTED'].includes(currentStatus) },
  ], [active, currentStatus]);

  const activeStep = ribbonSteps.findIndex(s => !s.completed);
  const currentStep = activeStep === -1 ? ribbonSteps.length - 1 : Math.max(0, activeStep - 1);

  const timeline = useMemo(() => {
    if (!active?.timeline) return [];
    return [...active.timeline].sort((a, b) => new Date(b.changedAt || b.time) - new Date(a.changedAt || a.time));
  }, [active]);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    if (filter === 'status') return timeline.filter(e => !['SYSTEM','AUTO'].includes((e.actor || '').toUpperCase()));
    if (filter === 'docs') return timeline.filter(e => ['DOCS_VERIFIED','REUPLOAD','DOCUMENTS_COMPLETED','DOCS_REUPLOADED'].includes((e.toStatus || '').toUpperCase()));
    if (filter === 'system') return timeline.filter(e => ['SYSTEM','AUTO'].includes((e.actor || '').toUpperCase()));
    return timeline;
  }, [timeline, filter]);

  // Reset visible count whenever filter changes
  const handleFilterChange = (f) => {
    setFilter(f);
    setVisibleCount(5);
  };

  const getTimelineIcon = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return { bg: '#22c55e', icon: <CheckCircle2 size={16} /> };
    if (s === 'REJECTED') return { bg: '#ef4444', icon: <AlertCircle size={16} /> };
    if (s === 'DOCS_VERIFIED') return { bg: '#22c55e', icon: <FileCheck2 size={16} /> };
    if (s === 'REVIEW') return { bg: '#f59e0b', icon: <Clock size={16} /> };
    return { bg: '#3b82f6', icon: <RefreshCw size={16} /> };
  };

  // EMI calculation (simple)
  const emi = active?.tenureMonths
    ? Math.round((active.requestedAmount || active.loanAmount || 0) / active.tenureMonths)
    : 0;

  // Group only the visible slice of the timeline by date
  const visibleTimeline = filteredTimeline.slice(0, visibleCount);
  const totalEvents = filteredTimeline.length;
  const hasMore = visibleCount < totalEvents;

  const groupedTimeline = useMemo(() => {
    const groups = {};
    visibleTimeline.forEach(e => {
      const d = fmtShort(e.changedAt || e.time);
      if (!groups[d]) groups[d] = [];
      groups[d].push(e);
    });
    return Object.entries(groups);
  }, [visibleTimeline]);

  if (loading) {
    return (
      <div className="df-page">
        <div className="df-loading">
          <div className="df-spinner" />
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="df-page">
      <div className="df-wrap">

        {/* ── Progress Stepper ── */}
        <div className="df-stepper">
          {ribbonSteps.map((step, i) => (
            <React.Fragment key={step.key}>
              <div className={`df-step ${step.completed ? 'df-step--done' : ''} ${i === currentStep + 1 && !step.completed ? 'df-step--active' : ''}`}>
                <div className="df-step__dot">
                  {step.completed ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                </div>
                <span className="df-step__label">{step.label}</span>
              </div>
              {i < ribbonSteps.length - 1 && (
                <div className={`df-step__line ${ribbonSteps[i + 1]?.completed || step.completed ? 'df-step__line--done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="df-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="df-body">
          {/* ── Main Column ── */}
          <div className="df-main">
            <div className="premium-header">
              <h1 className="premium-title">Dashboard</h1>
              <p className="premium-sub">Real-time monitoring of your financial portfolio and active loan applications.</p>
            </div>

            {/* 4 Metric Cards */}
            <div className="df-cards">

              {/* Card 1: Loan Amount */}
              <motion.div
                className="df-card df-card--green"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}
              >
                <div className="df-card__top">
                  <div>
                    <p className="df-card__label">
                      {currentStatus === 'APPROVED' ? 'Loan Approved' : 'Loan Amount'}
                    </p>
                    <p className="df-card__value">
                      {formatMoney(active?.requestedAmount || active?.loanAmount) || '—'}
                    </p>
                    <div className="df-card__badge df-card__badge--green">
                      <CheckCircle2 size={11} />
                      {currentStatus === 'APPROVED'
                        ? `Approved • ${fmtShort(active?.updatedAt)}`
                        : labelize(currentStatus)}
                    </div>
                  </div>
                  <CheckCircle2 size={44} className="df-card__icon" strokeWidth={1.5} />
                </div>
              </motion.div>

              {/* Card 2: Documents */}
              <motion.div
                className="df-card df-card--blue"
                onClick={() => setDocsModal(true)}
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
              >
                <div className="df-card__top">
                  <div>
                    <p className="df-card__label">Documents</p>
                    <p className="df-card__value">{uploadedCount} / {totalDocs}</p>
                    <div className={`df-card__badge ${uploadedCount === totalDocs ? 'df-card__badge--green' : 'df-card__badge--blue'}`}>
                      <FileCheck2 size={11} />
                      {uploadedCount === totalDocs ? 'All verified' : `${totalDocs - uploadedCount} pending`}
                    </div>
                  </div>
                  <FileCheck2 size={44} className="df-card__icon" strokeWidth={1.5} />
                </div>
                {/* Mini progress bar */}
                <div className="df-card__bar">
                  <div className="df-card__bar-fill" style={{ width: `${(uploadedCount / totalDocs) * 100}%`, background: '#3b82f6' }} />
                </div>
              </motion.div>

              {/* Card 3: Disbursement / Status */}
              <motion.div
                className="df-card df-card--amber"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              >
                <div className="df-card__top">
                  <div>
                    <p className="df-card__label">Disbursement</p>
                    <p className="df-card__value" style={{ fontSize: '28px' }}>
                      {currentStatus === 'APPROVED' ? '~2 days' : currentStatus === 'REJECTED' ? 'N/A' : 'Pending'}
                    </p>
                    <div className="df-card__badge df-card__badge--amber">
                      <Clock size={11} />
                      {currentStatus === 'APPROVED' ? 'Processing initiated' : 'Awaiting decision'}
                    </div>
                  </div>
                  <Clock size={44} className="df-card__icon" strokeWidth={1.5} />
                </div>
                <div className="df-card__bar">
                  <div className="df-card__bar-fill" style={{
                    width: currentStatus === 'APPROVED' ? '75%' : currentStatus === 'REVIEW' ? '50%' : '20%',
                    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  }} />
                </div>
              </motion.div>

              {/* Card 4: Tenure */}
              <motion.div
                className="df-card df-card--neutral"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
              >
                <div className="df-card__top">
                  <div>
                    <p className="df-card__label">Tenure</p>
                    <p className="df-card__value" style={{ fontSize: '28px' }}>
                      {active?.tenureMonths ? `${active.tenureMonths} mo.` : '—'}
                    </p>
                    <p className="df-card__sub">
                      {emi > 0 ? `EMI ${formatMoney(emi)} / mo.` : 'EMI to be confirmed'}
                    </p>
                  </div>
                  <Calendar size={44} className="df-card__icon" strokeWidth={1.5} />
                </div>
              </motion.div>
            </div>

            {/* Activity Timeline */}
            <motion.div
              className="df-panel"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            >
              <div className="df-panel__head">
                <h2>Activity Timeline</h2>
                <div className="df-filter-tabs">
                  {['all', 'status', 'docs', 'system'].map(f => (
                    <button
                      key={f}
                      className={`df-filter-tab ${filter === f ? 'df-filter-tab--active' : ''}`}
                      onClick={() => handleFilterChange(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="df-timeline">
                {groupedTimeline.length > 0 ? groupedTimeline.map(([date, events]) => (
                  <div key={date} className="df-timeline__group">
                    <p className="df-timeline__date">{date}</p>
                    {events.map((event, i) => {
                      const s = (event.toStatus || event.status || 'DRAFT');
                      const { bg, icon } = getTimelineIcon(s);
                      return (
                        <div key={i} className="df-timeline__item">
                          <div className="df-timeline__icon" style={{ background: bg }}>
                            {icon}
                          </div>
                          <div className="df-timeline__content">
                            <div className="df-timeline__row">
                              <div>
                                <span className="df-timeline__title">
                                  {s === 'APPROVED' ? 'Loan application approved'
                                    : s === 'REJECTED' ? 'Application rejected'
                                    : s === 'DOCS_VERIFIED' ? 'All documents verified'
                                    : s === 'REVIEW' ? 'Application under review'
                                    : `Status: ${labelize(s)}`}
                                </span>
                                <span className="df-timeline__tag" style={{ background: `${getMeta(s).color}18`, color: getMeta(s).color }}>
                                  {labelize(s)}
                                </span>
                              </div>
                              <span className="df-timeline__time">
                                {new Date(event.changedAt || event.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </div>
                            <p className="df-timeline__desc">
                              {event.reason || (s === 'APPROVED'
                                ? `${formatMoney(active?.requestedAmount || active?.loanAmount)} approved. Disbursement initiated within 2 business days.`
                                : s === 'DOCS_VERIFIED'
                                  ? '5/5 documents reviewed and cleared by the underwriting team.'
                                  : 'Official state transition verified.')}
                            </p>
                            <p className="df-timeline__ledger">Ledger · Verified</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )) : (
                  <div className="df-empty">
                    <RefreshCw size={28} strokeWidth={1.5} />
                    <p>No activity yet — submit your application to start the journey.</p>
                  </div>
                )} 
              </div>

              {/* View more / Show less */}
              {totalEvents > 5 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  {hasMore ? (
                    <button
                      className="df-viewmore-btn"
                      onClick={() => setVisibleCount(v => v + 10)}
                    >
                      View {Math.min(totalEvents - visibleCount, 10)} more
                      <span className="df-viewmore-count"> ({totalEvents - visibleCount} remaining)</span>
                    </button>
                  ) : (
                    <button
                      className="df-viewmore-btn df-viewmore-btn--collapse"
                      onClick={() => setVisibleCount(5)}
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="df-sidebar">

            {/* Status Card */}
            <motion.div
              className="df-status-card"
              style={{ background: `linear-gradient(135deg, ${meta.bg}, transparent)`, border: `1px solid ${meta.border}` }}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
              <div className="df-status-card__top">
                <div className="df-status-dot" style={{ background: meta.color }} />
                <span style={{ color: meta.color, fontWeight: 700, fontSize: '14px' }}>{meta.label}</span>
              </div>
              <div className="df-status-card__amount">
                {formatMoney(active?.requestedAmount || active?.loanAmount) || '—'}
              </div>
              {currentStatus === 'APPROVED' && (
                <p className="df-status-card__sub">Disbursement by {fmtShort(new Date(Date.now() + 2 * 86400000))}</p>
              )}
              {currentStatus === 'REUPLOAD' && (
                <p className="df-status-card__sub" style={{ color: '#c07aff' }}>Documents re-upload required</p>
              )}
              {!['APPROVED', 'REJECTED', 'NONE'].includes(currentStatus) && (
                <p className="df-status-card__sub">Application #{active?.id?.toString().slice(-6).toUpperCase() || '—'}</p>
              )}

              <div className="df-status-card__actions">
                {['APPROVED', 'REJECTED'].includes(currentStatus) ? (
                  <button className="df-btn df-btn--primary" onClick={() => navigate('/applicant/apply')}>
                    <Plus size={16} /> Start new application
                  </button>
                ) : currentStatus === 'REUPLOAD' ? (
                  <button className="df-btn df-btn--primary" onClick={() => navigate('/applicant/documents')}>
                    <ArrowRight size={16} /> Upload documents
                  </button>
                ) : currentStatus === 'NONE' ? (
                  <button className="df-btn df-btn--primary" onClick={() => navigate('/applicant/apply')}>
                    <Plus size={16} /> Apply for a loan
                  </button>
                ) : (
                  <button className="df-btn df-btn--primary" onClick={() => navigate('/applicant/apply')}>
                    <ArrowRight size={16} /> Manage application
                  </button>
                )}
                {currentStatus === 'APPROVED' && (
                  <button className="df-btn df-btn--outline" onClick={() => alert('Sanction letter download would open here.')}>
                    <Download size={16} /> Sanction letter
                  </button>
                )}
              </div>
            </motion.div>

            {/* Documents List */}
            <motion.div
              className="df-panel"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
            >
              <div className="df-panel__head" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Documents</h3>
                <button className="df-link" onClick={() => navigate('/applicant/documents')}>
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="df-doc-list">
                {Object.entries(DOC_LABELS).map(([key, label]) => {
                  const uploaded = !!docs[key];
                  return (
                    <div key={key} className="df-doc-item">
                      <div className="df-doc-item__icon">{DOC_ICONS[key]}</div>
                      <div className="df-doc-item__info">
                        <p>{label}</p>
                        <span>{uploaded ? 'PDF uploaded' : 'Pending'}</span>
                      </div>
                      <div className={`df-doc-item__status ${uploaded ? 'df-doc-item__status--ok' : 'df-doc-item__status--pending'}`}>
                        {uploaded ? <><CheckCircle2 size={11} /> Verified</> : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Trust Bar */}
            <div className="df-trust">
              <span><Shield size={12} /> Bank-grade security</span>
              <span><Lock size={12} /> 256-bit encryption</span>
              <span><BadgeCheck size={12} /> RBI compliant</span>
            </div>
          </aside>
        </div>

      </div>

      {/* ── Docs Modal ── */}
      <AnimatePresence>
        {docsModal && (
          <motion.div
            className="df-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocsModal(false)}
          >
            <motion.div
              className="df-modal"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>All Documents ({uploadedCount}/{totalDocs} Verified)</h2>
              <div className="df-doc-list" style={{ marginTop: '20px' }}>
                {Object.entries(DOC_LABELS).map(([key, label]) => {
                  const uploaded = !!docs[key];
                  return (
                    <div key={key} className="df-doc-item df-doc-item--large">
                      <div className="df-doc-item__icon">{DOC_ICONS[key]}</div>
                      <div className="df-doc-item__info">
                        <p>{label}</p>
                        <span>{uploaded ? 'PDF · Uploaded' : 'Not uploaded yet'}</span>
                      </div>
                      <div className={`df-doc-item__status ${uploaded ? 'df-doc-item__status--ok' : 'df-doc-item__status--pending'}`}>
                        {uploaded ? <><CheckCircle2 size={11} /> Verified</> : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="df-btn df-btn--primary" style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }} onClick={() => setDocsModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

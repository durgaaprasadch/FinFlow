import React, { useEffect, useState } from 'react';
import { 
  Download, 
  FileUp, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  IdCard, 
  FileBadge, 
  Briefcase, 
  Landmark, 
  UserCircle,
  X,
  Lock,
  ShieldAlert,
  Search,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { documentService, applicationService } from '../api';
import { labelize, unwrap, formatError } from '../utils/format';
import './Documents.css';
import './Experience.css';

const slots = [
  ['aadhaarFile', 'AADHAAR', 'Aadhaar card', IdCard],
  ['panFile', 'PAN', 'PAN card', FileBadge],
  ['salarySlipFile', 'SALARY_SLIP', 'Salary slip', Briefcase],
  ['bankStatementFile', 'BANK_STATEMENT', 'Bank statement', Landmark],
  ['photoFile', 'PHOTO', 'Passport photo', UserCircle],
];

const Documents = () => {
  const [files, setFiles] = useState({});
  const [selected, setSelected] = useState({});
  const [appStatus, setAppStatus] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [reuploadModules, setReuploadModules] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  
  const navigate = useNavigate();
  const isClosed = appStatus === 'APPROVED' || appStatus === 'REJECTED';
  const isSubmitted = ['SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'VERIFIED', 'FAIL'].includes(appStatus);
  const isReupload = appStatus === 'REUPLOAD';
  const isReuploaded = appStatus === 'DOCS_REUPLOADED';
  const isBlocked = (isClosed || isSubmitted || isReuploaded) && !isReupload;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const activeApp = unwrap(await applicationService.getStatus());
      
      // If no active application exists, don't show legacy files in the Registry
      if (!activeApp || activeApp.status === 'NO_ACTIVE_APPLICATION') {
        setAppStatus('NONE');
        setFiles({});
        setReuploadModules('');
        return;
      }

      setAppStatus(activeApp?.status);
      setReuploadModules(activeApp?.reuploadModules || '');

      const history = unwrap(await applicationService.getHistory());
      if (Array.isArray(history) && history.length) {
        const latestReupload = history.find(h => h.toStatus === 'REUPLOAD' || h.status === 'REUPLOAD');
        if (latestReupload) setRemarks(latestReupload.reason || latestReupload.comments || '');
      }

      const data = unwrap(await documentService.getUploadedFiles());
      setFiles(data?.documents || {});
    } catch (err) {
      setFiles({});
      setAppStatus('NONE');
      // If it's a 404/No Application error, we handle it silently to show empty state
      if (!err.message?.includes('not found') && !err.message?.includes('No active')) {
        setError(formatError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const upload = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      slots.forEach(([field, type]) => {
        const isTargeted = reuploadModules.includes(type);
        if (isReupload) {
          if (isTargeted && selected[field]) formData.append(field, selected[field]);
        } else if (selected[field]) {
          formData.append(field, selected[field]);
        }
      });
      
      if (!formData.entries().next().value) throw new Error("Please select at least one document to upload.");
      
      await documentService.uploadAll(formData);
      setMessage(`Documents uploaded. Synchronizing with cloud...`);
      setSelected({});
      await load();
      setLoading(false);
    } catch (err) {
      setError(formatError(err));
      setLoading(false);
    }
  };

  const downloadZip = async () => {
    const response = await documentService.downloadZip();
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'finflow-documents.zip';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? All uploaded documents and progress will be permanently removed.')) return;
    setLoading(true);
    try {
      await applicationService.deleteDraft();
      setMessage('Application withdrawn successfully.');
      setTimeout(() => navigate('/applicant/dashboard'), 1500);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const fileCount = Object.keys(files).length;

  return (
    <div className="dc-page">
      {/* ── Header ── */}
      <header className="dc-header">
        <div className="dc-header-content">
          <div className="dc-kicker"><Zap size={12} /> COMPLIANCE CENTER</div>
          <h1 className="premium-title">KYC files in one accountable packet.</h1>
          <p className="premium-sub">Submit your identity and income proofs. Our underwriting engine requires a complete five-file packet for verification.</p>
        </div>
        <div className="dc-header-actions">
          {appStatus && appStatus !== 'NONE' && appStatus !== 'null' && !isClosed && (
            <button className="dc-withdraw-btn" onClick={handleWithdraw} disabled={loading}>
              <X size={16} />
              <span>Withdraw Application</span>
            </button>
          )}
          <button className="dc-refresh-btn" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'ma-spin' : ''} size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ── Alerts ── */}
      <AnimatePresence>
        {appStatus === 'NONE' && (
          <div className="dc-alert dc-alert--locked">
            <Lock size={18} />
            No active application found. Please start a new application to upload documents.
          </div>
        )}
        {isClosed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="dc-alert dc-alert--locked">
            <ShieldAlert size={18} />
            This application is finalized (Approved/Rejected). No further documents can be uploaded.
          </motion.div>
        )}
        {error && <div className="alert warn" style={{ marginBottom: '2rem' }}>{error}</div>}
        {message && <div className="dc-alert dc-alert--success"><CheckCircle2 size={18} /> {message}</div>}
      </AnimatePresence>

      {/* ── Required Packet ── */}
      <section>
        <div className="dc-section-head">
          <div className="dc-section-title">
            <h2>Required Packet</h2>
            <span className="dc-count-badge">{fileCount}/5 Complete</span>
          </div>
          {isBlocked && (
            <div className="dc-lock-badge">
              <Lock size={14} /> Packet Locked
            </div>
          )}
        </div>

        <div className="dc-grid">
          {slots.map(([field, type, label, Icon]) => {
            const isTargeted = reuploadModules.includes(type);
            
            // Only consider a file 'Stored' if the application is in a state that acknowledges submissions
            const isActuallyInProcess = ['DOCUMENTS_COMPLETED', 'SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'VERIFIED', 'FAIL', 'REUPLOAD', 'DOCS_REUPLOADED'].includes(appStatus);
            const isStored = isActuallyInProcess && files[type] && files[type] !== '' && files[type] !== 'null';
            
            const statusLabel = isTargeted ? 'RE-UPLOAD REQUIRED' : isStored ? 'SUBMITTED' : 'PENDING';
            const statusClass = isTargeted ? 'dc-status-badge--targeted' : isStored ? 'dc-status-badge--submitted' : '';

            return (
              <div 
                key={type} 
                className={`dc-card ${isStored ? 'dc-card--stored' : ''}`}
                onClick={() => !isBlocked && document.getElementById(field).click()}
                style={{
                  ...(isBlocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  ...(isTargeted ? { borderColor: 'var(--red)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)' } : {})
                }}
              >
                <div className="dc-card-top">
                  <div className="dc-icon-box">
                    <Icon size={48} strokeWidth={1.2} />
                  </div>
                  <div className={`dc-status-badge ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
                <div className="dc-card-info" style={{ marginTop: 'auto' }}>
                  <h3>{label}</h3>
                  <p>{type.replace('_', ' ')}</p>
                  {isStored && (
                    <div style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                      <RefreshCw size={12} className="ma-spin" /> Secured on Cloud
                    </div>
                  )}
                </div>
                {selected[field] && (
                  <div style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700, marginTop: '8px' }}>
                    READY: {selected[field].name.substring(0, 20)}...
                  </div>
                )}
                <input 
                  id={field} 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={e => setSelected(p => ({ ...p, [field]: e.target.files[0] }))}
                  disabled={isBlocked}
                />
              </div>
            );
          })}
        </div>

        {!isBlocked && Object.keys(selected).length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <button className="btn-premium-primary" onClick={upload} disabled={loading}>
              <FileUp size={18} /> {loading ? 'Uploading...' : 'Upload Batch'}
            </button>
          </div>
        )}

        {!isSubmitted && fileCount === 5 && Object.keys(selected).length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <button 
              className="btn-premium-primary" 
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
              onClick={async () => {
                if (window.confirm('Ready for official review? Once submitted, your application will be locked for editing.')) {
                  setLoading(true);
                  try {
                    await applicationService.submitApplication();
                    setMessage('Application submitted for review.');
                    await load();
                  } catch (err) {
                    setError(formatError(err));
                  } finally {
                    setLoading(false);
                  }
                }
              }} 
              disabled={loading}
            >
              <ShieldCheck size={18} /> {loading ? 'Submitting...' : 'Final Submit Application'}
            </button>
          </div>
        )}
      </section>

      {/* ── Registry ── */}
      <section className="dc-registry">
        <div className="dc-registry-head">
          <div className="dc-registry-title">
            <h2>Registry</h2>
            <p>{appStatus === 'NONE' ? '0' : fileCount} of 5 documents secured on cloud.</p>
          </div>
          <button className="dc-zip-btn" onClick={downloadZip} disabled={fileCount === 0 || appStatus === 'NONE'}>
            <Download size={18} />
            Secure Backup (.zip)
          </button>
        </div>

        <table className="dc-table">
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Source File</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(([field, type, label]) => {
              const isTargeted = reuploadModules.includes(type);
              const isActuallyInProcess = ['DOCUMENTS_COMPLETED', 'SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'VERIFIED', 'FAIL', 'REUPLOAD', 'DOCS_REUPLOADED'].includes(appStatus);
              const isStored = isActuallyInProcess && files[type] && files[type] !== '' && files[type] !== 'null';
              
              return (
                <tr key={type} style={isTargeted ? { background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                  <td style={{ fontWeight: 600 }}>{label}</td>
                  <td className="dc-filename">{isStored ? files[type] : 'No source for this application'}</td>
                  <td>
                    <span className={`ma-status-pill ${isTargeted ? 'error' : isStored ? 'success' : 'warn'}`}>
                      {isTargeted ? 'Re-upload' : isStored ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Documents;

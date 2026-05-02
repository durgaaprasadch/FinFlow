import React, { useEffect, useState } from 'react';
import { Download, FileUp, RefreshCw, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { documentService, applicationService } from '../api';
import { labelize, unwrap, formatError } from '../utils/format';
import './Documents.css';

const slots = [
  ['aadhaarFile', 'AADHAAR', 'Aadhaar card'],
  ['panFile', 'PAN', 'PAN card'],
  ['salarySlipFile', 'SALARY_SLIP', 'Salary slip'],
  ['bankStatementFile', 'BANK_STATEMENT', 'Bank statement'],
  ['photoFile', 'PHOTO', 'Passport photo'],
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
  const navigate = useNavigate();
  const isClosed = appStatus === 'APPROVED' || appStatus === 'REJECTED';
  const isSubmitted = ['SUBMITTED', 'DOCS_VERIFIED', 'DOCS_PENDING', 'UPLOADED', 'PARTIAL', 'REVIEW', 'VERIFIED', 'FAIL', 'DOCS_REUPLOADED'].includes(appStatus);
  const isReupload = appStatus === 'REUPLOAD';
  const isReuploaded = appStatus === 'DOCS_REUPLOADED';

  const isBlocked = (isClosed || isSubmitted) && !isReupload || (error && (error.includes('No active application') || error.includes('not found')));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const activeApp = unwrap(await applicationService.getStatus());
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
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (isBlocked) {
      setSelected({});
    }
  }, [isBlocked]);

  const upload = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      slots.forEach(([field, type]) => {
        const isTargeted = reuploadModules.includes(type);

        if (isReupload) {
          if (isTargeted && !selected[field]) {
            throw new Error(`The document '${labelize(type)}' was specifically requested by the admin. Please attach it to proceed.`);
          }
          if (isTargeted) {
            formData.append(field, selected[field]);
          }
        } else {
          // Initial upload logic
          if (!selected[field]) {
            throw new Error('Attach every required document before uploading the initial packet.');
          }
          formData.append(field, selected[field]);
        }
      });
      const data = unwrap(await documentService.uploadAll(formData));
      setMessage(`Uploaded ${data?.documentsUploaded?.length || 5} documents.`);
      setSelected({});
      await load();
    } catch (err) {
      setError(formatError(err));
    } finally {
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

  return (
    <div className="dashboard-page">
      <section className="page-hero">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <span className="page-kicker">Compliance Center</span>
          <h1>KYC files in one accountable packet.</h1>
          <p>Submit your identity and income proofs. Our underwriting engine requires a complete five-file packet for verification.</p>
        </motion.div>
        <button className="btn secondary" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} size={16} /> Refresh
        </button>
      </section>

      {error && (
        <div className="alert warn">
          <ShieldCheck size={18} />
          {error.includes('No active application')
            ? 'Please start a new application from the dashboard before uploading documents.'
            : error}
        </div>
      )}
      {message && <div className="alert success"><CheckCircle2 size={18} /> {message}</div>}

      <motion.section
        className="documents-page-premium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="page-header-premium">
          <div className="header-info">
            <h2 className="page-title-premium">Required Packet</h2>
            <p className="page-subtitle-premium">Submit Aadhaar, PAN, and income proofs in a single accountable batch.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-premium-primary" onClick={upload} disabled={loading || isBlocked}>
              <FileUp size={18} /> {isClosed ? 'Packet Locked' : isSubmitted ? 'Under Review' : isBlocked ? 'Upload Blocked' : 'Upload Batch'}
            </button>
            {Object.keys(files).length >= 5 && !isSubmitted && !isClosed && (
              <button className="btn-premium-primary" onClick={() => navigate('/applicant/apply')} style={{ background: 'var(--green)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={18} /> Finalize Application
              </button>
            )}
          </div>
        </div>

        {isSubmitted && !isClosed && !isReupload && (
          <div className="alert warn" style={{ marginBottom: '2rem' }}>
            <ShieldCheck size={18} /> Application submitted, can't alter. Wait until docs reject or verified / reupload docs to upload docs again.
          </div>
        )}

        {isReupload && (
          <div className="alert warn" style={{ marginBottom: '2rem', border: '1px solid var(--orange)', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="var(--orange)" />
              <strong style={{ marginLeft: '8px' }}>Admin Feedback Required:</strong>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {remarks || "Admin has requested a re-upload of your documents. Please review your files and upload the correct packet."}
            </p>
          </div>
        )}

        {isClosed && (
          <div className="alert warn" style={{ marginBottom: '2rem' }}>
            <ShieldCheck size={18} /> This application is finalized (Approved/Rejected). No further documents can be uploaded.
          </div>
        )}

        <div className="documents-grid-premium">
          {slots.map(([field, type, labelName]) => {
            const isTargeted = reuploadModules.includes(type);
            const Tag = isBlocked ? 'div' : 'label';
            return (
              <Tag
                className={`document-card ${selected[field] ? 'selected' : ''} ${files[type] ? 'stored' : ''}`}
                key={field}
                style={{
                  ...(isBlocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  ...(isTargeted ? { border: '1px solid var(--red)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)' } : {})
                }}
              >
                <div className="doc-icon-wrapper">
                  {files[type] ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                </div>
                <div className="doc-details">
                  <div className="doc-name">{labelName}</div>
                  <div className="doc-type">{labelize(type)}</div>
                  <div className="doc-meta">
                    <span className={`status-pill-premium ${selected[field] ? 'verified' : isTargeted ? 'pending' : (files[type] || isReuploaded) ? 'verified' : 'pending'}`} style={isTargeted && !selected[field] ? { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)' } : {}}>
                      {isReuploaded ? 'RE-REVIEW' : selected[field] ? 'READY TO SYNC' : isTargeted ? 'RE-UPLOAD REQUIRED' : files[type] ? 'SUBMITTED' : 'PENDING'}
                    </span>
                    <span className="doc-date">
                      {selected[field] ? 'File Ready' : files[type] ? 'Secured' : 'Empty'}
                    </span>
                  </div>
                </div>
                {!isBlocked && (
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(event) => setSelected((current) => ({ ...current, [field]: event.target.files?.[0] }))}
                  />
                )}
                {selected[field] && (
                  <div className="selection-overlay">
                    <div className="file-name-pill">{selected[field].name}</div>
                  </div>
                )}
              </Tag>
            );
          })}
        </div>

        <div className="page-header-premium" style={{ marginTop: '4rem' }}>
          <div className="header-info">
            <h2 className="page-title-premium">Registry</h2>
            <p className="page-subtitle-premium">
              {isBlocked && error?.includes('No active application')
                ? 'Cloud registry is locked until an application is started.'
                : `${Object.keys(files).length} of 5 documents secured on cloud.`}
            </p>
          </div>
          <button className="btn secondary" onClick={downloadZip} disabled={!Object.keys(files).length}>
            <Download size={18} /> Secure Backup (.zip)
          </button>
        </div>

        <div className="panel-body table-wrap elevated-panel">
          <table className="data-table">
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
                const isReady = selected[field];
                const isStored = files[type] || isReuploaded;

                return (
                  <tr key={type}>
                    <td style={{ fontWeight: 600 }}>{label}</td>
                    <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                      {files[type] || 'No remote source found'}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${isReady ? 'good' : (isTargeted && !isReady) ? 'warn' : isStored ? 'good' : 'warn'}`}
                        style={isTargeted && !isReady ? { color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)' } : {}}
                      >
                        {isReuploaded ? 'Under Re-review' : isReady ? 'Ready for Update' : isTargeted ? 'Re-upload Required' : files[type] ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

export default Documents;

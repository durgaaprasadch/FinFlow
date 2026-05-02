import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RefreshCw, FileText, User, Briefcase, Landmark, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService } from '../api';
import { formatMoney, labelize, statusTone, unwrap, formatError } from '../utils/format';
import './Experience.css';

const defaultForm = {
  loanType: '',
  requestedAmount: '',
  tenureMonths: '',
  purpose: '',
  fullName: '',
  dob: '',
  gender: 'Male',
  maritalStatus: 'Single',
  panNumber: '',
  aadhaarNumber: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
  employmentType: 'SALARIED',
  companyName: '',
  designation: '',
  monthlyIncome: '',
  experienceYears: '',
};

const steps = [
  { label: 'Initial Request', icon: FileText },
  { label: 'Identity Verification', icon: User },
  { label: 'Financial Profile', icon: Briefcase },
  { label: 'Review & Finalize', icon: ShieldCheck },
];

/**
 * LOAN APPLICATION WIZARD:
 * Handles the 5-step digital onboarding process.
 * Uses local state to track steps and API services for patch updates.
 */
const LoanApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loanTypes, setLoanTypes] = useState(['PERSONAL_LOAN', 'HOME_LOAN', 'CAR_LOAN']);
  const [form, setForm] = useState({ ...defaultForm, ...(location.state || {}) });
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (field, value) => !isLocked && setForm((current) => ({ ...current, [field]: value }));

  const isLocked = active?.status &&
    !['DRAFT', 'PERSONAL_DETAILS_ADDED', 'EMPLOYMENT_DETAILS_ADDED', 'LOAN_DETAILS_ADDED', 'DOCUMENTS_COMPLETED', 'REUPLOAD'].includes(active.status) &&
    !['APPROVED', 'REJECTED'].includes(active.status) || active?.status === 'DOCS_REUPLOADED';

  const isClosed = ['APPROVED', 'REJECTED'].includes(active?.status);

  useEffect(() => {
    const boot = async () => {
      try {
        const types = unwrap(await applicationService.fetchLoanTypes());
        if (Array.isArray(types) && types.length) setLoanTypes(types);
      } catch {
        setLoanTypes(['PERSONAL_LOAN', 'HOME_LOAN', 'CAR_LOAN', 'EDUCATION_LOAN', 'BUSINESS_LOAN']);
      }
      try {
        const activeData = unwrap(await applicationService.getStatus());
        if (activeData) {
          setActive(activeData);

          // Only pre-fill if the application is NOT terminal (Closed/Approved/Rejected).
          // For terminal applications, we want the form to be clean (placeholders) for a new request.
          if (!['APPROVED', 'REJECTED'].includes(activeData.status)) {
            setForm((prev) => ({
              ...prev,
              loanType: activeData.loanType || prev.loanType,
              requestedAmount: activeData.requestedAmount || prev.requestedAmount,
              tenureMonths: activeData.tenureMonths || prev.tenureMonths,
              purpose: activeData.purpose || prev.purpose,
              fullName: activeData.fullName || prev.fullName,
              dob: activeData.dob || prev.dob,
              gender: activeData.gender || prev.gender,
              maritalStatus: activeData.maritalStatus || prev.maritalStatus,
              panNumber: activeData.panNumber || prev.panNumber,
              aadhaarNumber: activeData.aadhaarNumber || prev.aadhaarNumber,
              line1: activeData.line1 || prev.line1,
              city: activeData.city || prev.city,
              state: activeData.state || prev.state,
              pincode: activeData.pincode || prev.pincode,
              employmentType: activeData.employmentType || prev.employmentType,
              companyName: activeData.companyName || prev.companyName,
              designation: activeData.designation || prev.designation,
              monthlyIncome: activeData.monthlyIncome || prev.monthlyIncome,
              experienceYears: activeData.experienceYears || prev.experienceYears,
            }));

            const status = activeData.status;
            if (status === 'PERSONAL_DETAILS_ADDED') setStep(1);
            else if (status === 'EMPLOYMENT_DETAILS_ADDED') setStep(2);
            else if (status === 'LOAN_DETAILS_ADDED' || status === 'DOCUMENTS_COMPLETED') setStep(3);
            else if (status !== 'DRAFT') setStep(3);
          } else {
            // It's closed, keep step 0 and empty form
            setStep(0);
          }
        }
      } catch {
        setActive(null);
      }
    };
    void boot();
  }, []);

  const call = async (work, success, nextStep = step + 1) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = unwrap(await work());
      setActive(result);
      setMessage(success);
      setStep(Math.min(nextStep, steps.length - 1));
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to withdraw this application? This cannot be undone.")) return;
    setLoading(true);
    try {
      await applicationService.deleteDraft();
      setActive(null);
      setForm({ ...defaultForm });
      setStep(0);
      setMessage("Application withdrawn successfully.");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const startNew = async () => {
    setLoading(true);
    try {
      // Just reset frontend first, then the user will submit step 0 to create the draft in backend
      setActive(null);
      setForm({ ...defaultForm });
      setStep(0);
      setMessage("Starting fresh. Fill in your new loan requirements.");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitStep = (event) => {
    event.preventDefault();
    if (step === 0) {
      if (!form.loanType) {
        setError("Please select a valid Asset Category to proceed.");
        return;
      }
      if (!form.requestedAmount || Number(form.requestedAmount) <= 0) {
        setError("Please specify a valid Capital Requirement amount.");
        return;
      }
      return call(
        () => applicationService.createDraft(form.loanType, Number(form.requestedAmount), Number(form.tenureMonths), form.purpose),
        'Draft created. Now add applicant identity.'
      );
    }
    if (step === 1) {
      return call(
        () => applicationService.updatePersonalDetails({
          fullName: form.fullName,
          dob: form.dob || null,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          panNumber: form.panNumber.toUpperCase(),
          aadhaarNumber: form.aadhaarNumber,
          address: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode },
        }),
        'Personal details saved.'
      );
    }
    if (step === 2) {
      return call(
        () => applicationService.updateEmploymentDetails({
          employmentType: form.employmentType,
          companyName: form.companyName,
          designation: form.designation,
          monthlyIncome: Number(form.monthlyIncome),
          experienceYears: Number(form.experienceYears),
        }),
        'Employment profile saved. Redirecting to document center...',
        3
      ).then(() => {
        setTimeout(() => navigate('/applicant/documents'), 1500);
      });
    }
    if (step === 3) {
      const confirmed = window.confirm("Ready for official review? Please ensure all information provided is accurate. Once submitted, your application will be locked and cannot be edited while our team verifies your file.");
      if (!confirmed) return;
      return call(() => applicationService.submitApplication(), 'Application submitted for review.', 3);
    }
    return Promise.resolve();
  };

  return (
    <div className="flow-page">
      <section className="page-hero">
        <div>
          <span className="page-kicker">Loan application</span>
          <h1>{active ? 'Complete your file.' : 'Start your financial journey.'}</h1>
          <p>Each step is synchronized in real-time. Your progress is saved automatically at every milestone.</p>
        </div>
        <div className="header-actions">
          {/* Status pill removed as per UX requirement */}
          {active && !['APPROVED', 'REJECTED'].includes(active.status) && (
            <button className="btn ghost danger sm" type="button" onClick={handleDelete} disabled={loading}>
              Withdraw Application
            </button>
          )}
        </div>
      </section>

      {/* Application locked warning moved to Documents center as per UX requirement */}
      {error && <div className="alert"><ShieldCheck size={18} /> {error}</div>}
      {message && <div className="alert success"><CheckCircle2 size={18} /> {message}</div>}

      <div className="wizard">
        <aside className="wizard-rail">
          {steps.map((s, index) => (
            <button
              className={`wizard-step ${step === index ? 'active' : ''}`}
              key={s.label}
              type="button"
              onClick={() => setStep(index)}
              disabled={index > step && !active}
            >
              <small>{index + 1}</small>
              <span>{s.label}</span>
              {index < step && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
            </button>
          ))}
        </aside>

        <form className="panel-premium" onSubmit={submitStep}>
          <div className="panel-header-premium">
            <div>
              <h2>{steps[step].label}</h2>
              <p>{active ? (active.applicantUsername || 'Account') : 'Create a backend draft to begin.'}</p>
            </div>
            {loading && <RefreshCw className="spin" size={18} color="var(--blue)" />}
          </div>

          <div className="panel-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <div className="form-grid">
                    <div className="field">
                      <label>Asset Category</label>
                      <select value={form.loanType} onChange={(event) => setField('loanType', event.target.value)} required>
                        <option value="">-- SELECT CATEGORY --</option>
                        {loanTypes.map((type) => <option key={type} value={type}>{labelize(type).toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Capital Requirement</label>
                      <input type="number" min="10000" value={form.requestedAmount} onChange={(event) => setField('requestedAmount', event.target.value)} placeholder="e.g. 500,000" required />
                    </div>
                    <div className="field">
                      <label>Tenure (Months)</label>
                      <input type="number" min="6" max="120" value={form.tenureMonths} onChange={(event) => setField('tenureMonths', event.target.value)} placeholder="e.g. 36" />
                    </div>
                    <div className="field wide">
                      <label>Rationale / Purpose</label>
                      <textarea value={form.purpose} onChange={(event) => setField('purpose', event.target.value)} placeholder="Provide a brief explanation for this credit request..." />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="form-grid">
                    <div className="field"><label>Legal Full Name</label><input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} placeholder="As per PAN card" required /></div>
                    <div className="field"><label>Date of birth</label><input type="date" value={form.dob} onChange={(event) => setField('dob', event.target.value)} /></div>
                    <div className="field"><label>Gender</label><select value={form.gender} onChange={(event) => setField('gender', event.target.value)}><option value="">-- SELECT --</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></div>
                    <div className="field"><label>Marital status</label><select value={form.maritalStatus} onChange={(event) => setField('maritalStatus', event.target.value)}><option value="">-- SELECT --</option><option>SINGLE</option><option>MARRIED</option></select></div>
                    <div className="field"><label>PAN</label><input value={form.panNumber} onChange={(event) => setField('panNumber', event.target.value.toUpperCase())} pattern="^[A-Z]{5}\d{4}[A-Z]$" placeholder="ABCDE1234F" required /></div>
                    <div className="field"><label>Aadhaar</label><input value={form.aadhaarNumber} onChange={(event) => setField('aadhaarNumber', event.target.value)} pattern="^[2-9]\d{11}$" placeholder="12-digit number" required /></div>
                    <div className="field wide"><label>Residential Address</label><input value={form.line1} onChange={(event) => setField('line1', event.target.value)} placeholder="House/Flat No, Street, Area" /></div>
                    <div className="field"><label>City</label><input value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder="e.g. Mumbai" /></div>
                    <div className="field"><label>State</label><input value={form.state} onChange={(event) => setField('state', event.target.value)} placeholder="e.g. Maharashtra" /></div>
                    <div className="field"><label>Pincode</label><input value={form.pincode} onChange={(event) => setField('pincode', event.target.value)} placeholder="6-digit PIN" /></div>
                  </div>
                )}

                {step === 2 && (
                  <div className="form-grid">
                    <div className="field"><label>Employment type</label><select value={form.employmentType} onChange={(event) => setField('employmentType', event.target.value)}><option value="">-- SELECT STATUS --</option><option>SALARIED</option><option>SELF_EMPLOYED</option><option>BUSINESS</option></select></div>
                    <div className="field"><label>Company</label><input value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} placeholder="Company or Business name" /></div>
                    <div className="field"><label>Designation</label><input value={form.designation} onChange={(event) => setField('designation', event.target.value)} placeholder="Your job title" /></div>
                    <div className="field"><label>Monthly income</label><input type="number" value={form.monthlyIncome} onChange={(event) => setField('monthlyIncome', event.target.value)} placeholder="e.g. 75000" /></div>
                    <div className="field"><label>Experience years</label><input type="number" value={form.experienceYears} onChange={(event) => setField('experienceYears', event.target.value)} placeholder="e.g. 5" /></div>
                  </div>
                )}

                {step === 3 && (
                  <div className="empty-state">
                    <div>
                      <CheckCircle2 size={48} color="var(--green)" />
                      <h2 style={{ marginTop: '20px' }}>Ready to submit</h2>
                      <p>Your document packet is synced. Once you submit, the file moves to our underwriting team for final verification.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="panel-header-premium" style={{ borderTop: '1px solid var(--line)', borderBottom: 'none' }}>
            <button
              className="btn secondary"
              type="button"
              disabled={step === 0 || loading}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              <ArrowLeft size={16} /> Back
            </button>
            {!isLocked ? (
              <button className="btn primary" type="submit" disabled={loading}>
                {step === 3 ? 'Submit application' : step === 2 ? 'Upload Documents' : 'Save and continue'} <ArrowRight size={16} />
              </button>
            ) : isClosed ? (
              <button className="btn primary" type="button" onClick={startNew} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} /> Start New Application
              </button>
            ) : (
              <div className="lock-notice" style={{ color: 'var(--green)', background: 'rgba(16, 185, 129, 0.1)' }}>
                <ShieldCheck size={16} /> Application Locked for Review
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanApplication;

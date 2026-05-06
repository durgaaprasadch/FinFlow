import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle2, RefreshCw,
  ShieldCheck, FileText, User, Briefcase, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationService, documentService } from '../api';
import { formatMoney, labelize, statusTone, unwrap, formatError } from '../utils/format';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, startOfToday, parseISO
} from 'date-fns';
import './LoanApplication.css';

/* ── Custom Date Picker ────────────────────────────────── */
const CustomDatePicker = ({ value, onChange, label, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('days'); // 'days' | 'years'
  const [curr, setCurr] = useState(value ? parseISO(value) : startOfToday());
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const years = useMemo(() => {
    const start = 1950;
    const end = new Date().getFullYear();
    const arr = [];
    for (let i = end; i >= start; i--) arr.push(i);
    return arr;
  }, []);

  const monthStart = startOfMonth(curr);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleSelect = (d) => {
    if (disabled) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setIsOpen(false);
    setView('days');
  };

  const handleYearSelect = (y) => {
    const next = new Date(curr);
    next.setFullYear(y);
    setCurr(next);
    setView('days');
  };

  return (
    <div className="la-datepicker">
      <label>{label}</label>
      <div 
        className={`la-datepicker__trigger ${isOpen ? 'la-datepicker__trigger--open' : ''} ${disabled ? 'la-datepicker__trigger--disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Calendar size={16} />
        <span>{value ? format(parseISO(value), 'dd MMM yyyy') : 'Select Date'}</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="la-datepicker__pop"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <div className="la-datepicker__head">
              <button type="button" onClick={() => setCurr(subMonths(curr, 1))}><ArrowLeft size={14} /></button>
              <span onClick={() => setView(view === 'days' ? 'years' : 'days')} style={{ cursor: 'pointer' }}>
                {format(curr, view === 'days' ? 'MMMM yyyy' : 'yyyy')}
              </span>
              <button type="button" onClick={() => setCurr(addMonths(curr, 1))}><ArrowRight size={14} /></button>
            </div>

            {view === 'days' ? (
              <div className="la-datepicker__grid">
                {days.map(d => <div key={d} className="la-datepicker__day-name">{d}</div>)}
                {calendarDays.map((d, i) => {
                  const sameMonth = isSameMonth(d, monthStart);
                  const selected = value && isSameDay(d, parseISO(value));
                  return (
                    <div 
                      key={i} 
                      className={`la-datepicker__day ${!sameMonth ? 'la-datepicker__day--off' : ''} ${selected ? 'la-datepicker__day--active' : ''}`}
                      onClick={() => handleSelect(d)}
                    >
                      {format(d, 'd')}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="la-datepicker__years">
                {years.map(y => (
                  <div 
                    key={y} 
                    className={`la-datepicker__year ${curr.getFullYear() === y ? 'la-datepicker__year--active' : ''}`}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

const STEPS = [
  { label: 'Initial Request',      icon: FileText },
  { label: 'Identity Verification', icon: User },
  { label: 'Financial Profile',    icon: Briefcase },
  { label: 'Review & Finalize',    icon: ShieldCheck },
];

const LoanApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loanTypes, setLoanTypes] = useState(['PERSONAL_LOAN', 'HOME_LOAN', 'CAR_LOAN', 'EDUCATION_LOAN', 'BUSINESS_LOAN', 'GOLD_LOAN', 'TWO_WHEELER_LOAN']);
  const [form, setForm] = useState({ ...defaultForm, ...(location.state || {}) });
  const [active, setActive] = useState(null);
  const [docs, setDocs] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLocked = active?.status &&
    !['DRAFT', 'PERSONAL_DETAILS_ADDED', 'EMPLOYMENT_DETAILS_ADDED', 'LOAN_DETAILS_ADDED',
      'DOCUMENTS_COMPLETED', 'UPLOADED', 'PARTIAL', 'DOCS_PENDING', 'REUPLOAD'].includes(active.status) &&
    !['APPROVED', 'REJECTED'].includes(active.status) || active?.status === 'DOCS_REUPLOADED';

  const isClosed = ['APPROVED', 'REJECTED'].includes(active?.status);

  const setField = (field, value) => !isLocked && setForm(cur => ({ ...cur, [field]: value }));

  useEffect(() => {
    const boot = async () => {
      try {
        const types = unwrap(await applicationService.fetchLoanTypes());
        if (Array.isArray(types) && types.length) setLoanTypes(types);
      } catch {
        setLoanTypes(['PERSONAL_LOAN', 'HOME_LOAN', 'CAR_LOAN', 'EDUCATION_LOAN', 'BUSINESS_LOAN', 'GOLD_LOAN', 'TWO_WHEELER_LOAN']);
      }
      try {
        const activeData = unwrap(await applicationService.getStatus());
        if (activeData && activeData.status !== 'NO_ACTIVE_APPLICATION') {
          setActive(activeData);
          setMessage('Resuming your saved application draft.');
          // Only fetch documents if we have an active application
          try {
            const docData = unwrap(await documentService.getUploadedFiles());
            // Filter or verify docs belong to current application context if possible, 
            // but at minimum only show if application exists.
            setDocs(docData?.documents || {});
          } catch { setDocs({}); }

          if (!['APPROVED', 'REJECTED'].includes(activeData.status)) {
            setForm(prev => ({
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
            const s = activeData.status;
            // Always start at step 0 as per user request, regardless of status
            setStep(0);
          } else {
            setStep(0);
          }
        }
      } catch { setActive(null); }
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
      setStep(Math.min(nextStep, STEPS.length - 1));
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This cannot be undone.')) return;
    setLoading(true);
    try {
      await applicationService.deleteDraft();
      setActive(null);
      setForm({ ...defaultForm });
      setStep(0);
      setMessage('Application withdrawn successfully.');
    } catch (err) { setError(formatError(err)); }
    finally { setLoading(false); }
  };

  const startNew = async () => {
    setActive(null);
    setForm({ ...defaultForm });
    setStep(0);
    setDocs({});
    setMessage('Starting fresh. Fill in your new loan requirements.');
  };

  const validateStep = (s) => {
    if (s === 0) {
      if (!form.loanType) return 'Please select a loan category.';
      if (!form.requestedAmount || Number(form.requestedAmount) < 10000) return 'Min capital requirement is ₹10,000.';
      if (!form.tenureMonths || Number(form.tenureMonths) < 6) return 'Min tenure is 6 months.';
    }
    if (s === 1) {
      if (!form.fullName || form.fullName.length < 3) return 'Enter your full legal name.';
      if (!form.dob) return 'Date of birth is required.';
      if (!form.panNumber || !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.panNumber)) return 'Invalid PAN card number.';
      if (!form.aadhaarNumber || !/^[2-9]\d{11}$/.test(form.aadhaarNumber)) return 'Invalid Aadhaar number.';
      if (!form.city || !form.state || !form.pincode) return 'Complete address details are required.';
    }
    if (s === 2) {
      if (!form.companyName) return 'Company/Business name is required.';
      if (!form.designation) return 'Job title/Designation is required.';
      if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) return 'Valid monthly income is required.';
    }
    return null;
  };

  const submitStep = (e) => {
    e.preventDefault();
    const err = validateStep(step);
    if (err) { setError(err); return; }

    if (step === 0) {
      return call(
        () => applicationService.createDraft(form.loanType, Number(form.requestedAmount), Number(form.tenureMonths), form.purpose),
        'Draft created. Now add applicant identity.'
      );
    }
    if (step === 1) {
      return call(
        () => applicationService.updatePersonalDetails({
          fullName: form.fullName, dob: form.dob || null, gender: form.gender,
          maritalStatus: form.maritalStatus, panNumber: form.panNumber.toUpperCase(),
          aadhaarNumber: form.aadhaarNumber,
          address: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode },
        }),
        'Personal details saved.'
      );
    }
    if (step === 2) {
      return call(
        () => applicationService.updateEmploymentDetails({
          employmentType: form.employmentType, companyName: form.companyName,
          designation: form.designation, monthlyIncome: Number(form.monthlyIncome),
          experienceYears: Number(form.experienceYears),
        }),
        'Employment profile saved. Redirecting to document center...',
        3
      ).then(() => setTimeout(() => navigate('/applicant/documents'), 1500));
    }
    if (step === 3) {
      // Final submission validation
      const s0 = validateStep(0); if (s0) { setStep(0); setError(s0); return; }
      const s1 = validateStep(1); if (s1) { setStep(1); setError(s1); return; }
      const s2 = validateStep(2); if (s2) { setStep(2); setError(s2); return; }
      
      const docCount = Object.keys(docs).length;
      if (docCount < 5) {
        setError(`Please upload all 5 documents. Currently ${docCount}/5 uploaded.`);
        return;
      }

      if (!window.confirm('Ready for official review? Once submitted, your application will be locked for editing.')) return;
      return call(() => applicationService.submitApplication(), 'Application submitted for review.', 3);
    }
    return Promise.resolve();
  };

  /* ── Determine which steps are "done" ── */
  const stepDone = (i) => {
    if (!active) return false;
    const s = active.status;
    if (i === 0) return !!active;
    if (i === 1) return ['PERSONAL_DETAILS_ADDED', 'EMPLOYMENT_DETAILS_ADDED', 'LOAN_DETAILS_ADDED', 'DOCUMENTS_COMPLETED', 'SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'APPROVED', 'REJECTED'].includes(s);
    if (i === 2) return ['EMPLOYMENT_DETAILS_ADDED', 'LOAN_DETAILS_ADDED', 'DOCUMENTS_COMPLETED', 'SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'APPROVED', 'REJECTED'].includes(s);
    if (i === 3) return ['SUBMITTED', 'DOCS_VERIFIED', 'REVIEW', 'APPROVED', 'REJECTED'].includes(s);
    return false;
  };

  const stepBtnLabel = () => {
    if (step === 3) return 'Submit application';
    if (step === 2) return 'Upload Documents';
    return 'Save and continue';
  };

  return (
    <div className="la-page">

      {/* ── Header ── */}
        <div className="la-header">
          <span className="la-header__back" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft size={14} /> Dashboard
          </span>
          <h1 className="premium-title">Complete your file.</h1>
          <p className="premium-sub">Each step is synchronized in real-time. Your progress is saved automatically.</p>
          {active && !isClosed && (
            <button className="la-withdraw-btn" onClick={handleDelete} disabled={loading}>
              Withdraw
            </button>
          )}
        </div>

      {/* ── Alerts ── */}
      <div className="la-alerts">
        {error && <div className="la-alert la-alert--error"><ShieldCheck size={15} /> {error}</div>}
        {message && <div className="la-alert la-alert--success"><CheckCircle2 size={15} /> {message}</div>}
      </div>

      {/* ── Body ── */}
      <div className="la-body">
          {/* ... (rest of the code) ... */}

        {/* Step Rail */}
        <aside className="la-rail">
          <div className="la-rail__label">PIPELINE TRACKER</div>
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              className={`la-step ${step === i ? 'la-step--active' : ''} ${stepDone(i) ? 'la-step--done' : ''}`}
              onClick={() => setStep(i)}
              disabled={i > step && !active}
              type="button"
            >
              <div className="la-step__num">
                {stepDone(i) && step !== i
                  ? <CheckCircle2 size={14} />
                  : i + 1}
              </div>
              <span className="la-step__label">{s.label}</span>
              {stepDone(i) && step !== i && <CheckCircle2 size={14} className="la-step__check" />}
            </button>
          ))}
        </aside>

        {/* Form Area */}
        <form className="la-form-area" onSubmit={submitStep} id="la-form">
          <div className="la-form-head">
            <div>
              <h2>{STEPS[step].label}</h2>
              <p>{active ? (active.applicantUsername || active.fullName || 'Account') : 'Create a backend draft to begin.'}</p>
            </div>
            {loading && <RefreshCw size={18} className="la-spin" />}
          </div>

          <div className="la-form-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── STEP 0: Initial Request ── */}
                {step === 0 && (
                  <div className="la-grid">
                    <div className="la-field">
                      <label>Asset Category</label>
                      <select value={form.loanType} onChange={e => setField('loanType', e.target.value)} required>
                        <option value="">-- SELECT CATEGORY --</option>
                        {loanTypes.map(t => <option key={t} value={t}>{labelize(t).toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="la-field">
                      <label>Capital Requirement</label>
                      <input type="number" min="10000" value={form.requestedAmount} onChange={e => setField('requestedAmount', e.target.value)} placeholder="e.g. 500000" required />
                    </div>
                    <div className="la-field">
                      <label>Tenure (Months)</label>
                      <input type="number" min="6" max="120" value={form.tenureMonths} onChange={e => setField('tenureMonths', e.target.value)} placeholder="e.g. 36" />
                    </div>
                    <div className="la-field la-field--wide">
                      <label>Rationale / Purpose</label>
                      <textarea value={form.purpose} onChange={e => setField('purpose', e.target.value)} placeholder="Provide a brief explanation for this credit request..." rows={4} />
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Identity Verification ── */}
                {step === 1 && (
                  <div className="la-grid">
                    <div className="la-field"><label>Legal Full Name</label><input value={form.fullName} onChange={e => setField('fullName', e.target.value)} placeholder="As per PAN card" required /></div>
                    <div className="la-field">
                      <CustomDatePicker 
                        label="Date of Birth" 
                        value={form.dob} 
                        onChange={val => setField('dob', val)} 
                        disabled={isLocked}
                      />
                    </div>
                    <div className="la-field"><label>Gender</label>
                      <select value={form.gender} onChange={e => setField('gender', e.target.value)}>
                        <option value="">-- SELECT --</option>
                        <option>MALE</option><option>FEMALE</option><option>OTHER</option>
                      </select>
                    </div>
                    <div className="la-field"><label>Marital Status</label>
                      <select value={form.maritalStatus} onChange={e => setField('maritalStatus', e.target.value)}>
                        <option value="">-- SELECT --</option>
                        <option>SINGLE</option><option>MARRIED</option>
                      </select>
                    </div>
                    <div className="la-field"><label>PAN</label><input value={form.panNumber} onChange={e => setField('panNumber', e.target.value.toUpperCase())} pattern="^[A-Z]{5}\d{4}[A-Z]$" placeholder="ABCDE1234F" required /></div>
                    <div className="la-field"><label>Aadhaar</label><input value={form.aadhaarNumber} onChange={e => setField('aadhaarNumber', e.target.value)} pattern="^[2-9]\d{11}$" placeholder="12-digit number" required /></div>
                    <div className="la-field la-field--wide"><label>Residential Address</label><input value={form.line1} onChange={e => setField('line1', e.target.value)} placeholder="House/Flat No, Street, Area" /></div>
                    <div className="la-field"><label>City</label><input value={form.city} onChange={e => setField('city', e.target.value)} placeholder="e.g. Mumbai" /></div>
                    <div className="la-field"><label>State</label><input value={form.state} onChange={e => setField('state', e.target.value)} placeholder="e.g. Maharashtra" /></div>
                    <div className="la-field"><label>Pincode</label><input value={form.pincode} onChange={e => setField('pincode', e.target.value)} placeholder="6-digit PIN" /></div>
                  </div>
                )}

                {/* ── STEP 2: Financial Profile ── */}
                {step === 2 && (
                  <div className="la-grid">
                    <div className="la-field"><label>Employment Type</label>
                      <select value={form.employmentType} onChange={e => setField('employmentType', e.target.value)}>
                        <option value="">-- SELECT STATUS --</option>
                        <option>SALARIED</option><option>SELF_EMPLOYED</option><option>BUSINESS</option>
                      </select>
                    </div>
                    <div className="la-field"><label>Company</label><input value={form.companyName} onChange={e => setField('companyName', e.target.value)} placeholder="Company or Business name" /></div>
                    <div className="la-field"><label>Designation</label><input value={form.designation} onChange={e => setField('designation', e.target.value)} placeholder="Your job title" /></div>
                    <div className="la-field"><label>Monthly Income</label><input type="number" value={form.monthlyIncome} onChange={e => setField('monthlyIncome', e.target.value)} placeholder="e.g. 75000" /></div>
                    <div className="la-field"><label>Experience Years</label><input type="number" value={form.experienceYears} onChange={e => setField('experienceYears', e.target.value)} placeholder="e.g. 5" /></div>
                  </div>
                )}

                {/* ── STEP 3: Review & Finalize ── */}
                {step === 3 && (
                  <div className="la-review">
                    <div className="la-review__icon">
                      <CheckCircle2 size={52} strokeWidth={1.5} />
                    </div>
                    <h2>Ready to submit</h2>
                    <p>Your document packet is synced. Once you submit, the file moves to our underwriting team for final verification.</p>

                    <div className="la-review__checklist">
                      <div className="la-review__row">
                        <span>Application Progress</span>
                        <span className={`la-review__val ${(!validateStep(0) && !validateStep(1) && !validateStep(2) && Object.keys(docs).length === 5) ? 'la-review__val--green' : ''}`}>
                          {(!validateStep(0)
                            ? (1 + (!validateStep(1) ? 1 : 0) + (!validateStep(2) ? 1 : 0) + (Object.keys(docs).length === 5 ? 1 : 0))
                            : 0)} / 4
                        </span>
                      </div>
                      <div className="la-review__row">
                        <span>Active Application Docs</span>
                        <span className={`la-review__val ${(!validateStep(0) && Object.keys(docs).length === 5) ? 'la-review__val--green' : ''}`}>
                          {(!validateStep(0) ? Object.keys(docs).length : 0)} / 5
                        </span>
                      </div>
                      <div className="la-review__row">
                        <span>Auto-synced data</span>
                        <span className="la-review__val la-review__val--green">✓</span>
                      </div>
                      <div className="la-review__row">
                        <span>Current Loan Amount</span>
                        <span className={`la-review__val ${!form.requestedAmount ? 'la-review__val--red' : ''}`}>
                          {form.requestedAmount ? formatMoney(form.requestedAmount) : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </form>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="la-footer">
        <button
          type="button"
          className="la-btn la-btn--back"
          onClick={() => setStep(v => Math.max(0, v - 1))}
          disabled={step === 0 || loading}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {!isLocked ? (
          <button
            type="submit"
            form="la-form"
            className="la-btn la-btn--primary"
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="la-spin" /> : null}
            {stepBtnLabel()} <ArrowRight size={16} />
          </button>
        ) : isClosed ? (
          <button type="button" className="la-btn la-btn--primary" onClick={startNew} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'la-spin' : ''} /> Start New Application
          </button>
        ) : (
          <div className="la-locked">
            <ShieldCheck size={15} /> Application Locked for Review
          </div>
        )}
        </div>
    </div>
  );
};

export default LoanApplication;

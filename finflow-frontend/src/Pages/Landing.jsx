import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Zap,
  Coffee,
  Ghost,
  ShieldAlert,
  Sparkles,
  Quote,
  Flame,
  Fingerprint,
  Smile,
  Shield,
  Search,
  Star,
  Wind,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './LandingFocus.css';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

const loanTypes = [
  'Personal Loan',
  'Business Loan',
  'Education Loan',
  'Home Loan',
];

const steps = [
  ['The Honest Ask', 'Tell us how much you need. We won\'t ask for your firstborn, but we do need some numbers.'],
  ['The Paperwork (Wait, No)', 'Upload a few PDFs. No printers, no ink, no soul-crushing 1995 bureaucracy.'],
  ['The Human Check', 'A real person (who enjoys coffee and high-speed fiber) verifies your credentials.'],
  ['The Funding', 'The funds hit your account. Go ahead, make your traditional bank jealous.'],
];

const features = [
  [null, 'Unfairly Competent', 'We actually know what we\'re doing.'],
  [null, 'Zero Ghosting', 'Real-time status updates.'],
  [null, 'Elite Privacy', 'Encrypted and guarded.'],
  [null, 'Clean Flow', 'Designed for humans, not fax machines.'],
];

const testimonials = [
  {
    name: "Rahul S.",
    role: "Professional Dreamer & Bank-Hater",
    text: "Applied at 2 AM in my pajamas. Funded by 10 AM. My bank still thinks I live in the late nineties. Absolute wizards.",
  },
  {
    name: "Anita M.",
    role: "CEO of My Kitchen & Fax-Machine Survivor",
    text: "Zero fax machines. Zero stamps. Zero bureaucratic nightmares. It's like they actually realize my time has value.",
  },
  {
    name: "Deepak K.",
    role: "Serial Entrepreneur & Caffeine Addict",
    text: "The sarcasm in the FAQ made me trust them. Real humans, real speed, real money. This is how banking should feel.",
  }
];

const faqs = [
  {
    q: "How are interest rates determined?",
    a: "We use math, not magic. Rates are calculated based on your credit profile, income stability, and category. Typically 8.5% to 14.5% APR."
  },
  {
    q: "Who is eligible to apply for a loan?",
    a: "Anyone aged 21-60 with a steady income and a bank account. Basically, if you're a real person with a real job, you're in the club."
  },
  {
    q: "Why does it actually take 48 hours?",
    a: "Because quality control is a real thing. Our reviewers are fast, but they occasionally enjoy sleeping and eating like normal humans."
  },
  {
    q: "What if I have no documents?",
    a: "Then you're a financial ghost, and we don't lend to the supernatural. We need proof of identity (Aadhaar, PAN, etc.) to keep things legal."
  },
  {
    q: "Is my data safe or are you selling it?",
    a: "We use AES-256 encryption. We value your privacy more than your ex values your feelings. Your data stays with us."
  },
  {
    q: "Can I track my application at 3 AM?",
    a: "Absolutely. Our dashboard is live 24/7, even when our team is dreaming about beautiful, bug-free code."
  }
];

const LOAN_DATA = {
  'Personal Loan': { rate: 0.14, icon: <User size={18} /> },
  'Business Loan': { rate: 0.11, icon: <Landmark size={18} /> },
  'Education Loan': { rate: 0.085, icon: <Coffee size={18} /> },
  'Personal Loan': { rate: 0.14 },
  'Business Loan': { rate: 0.11 },
  'Education Loan': { rate: 0.085 },
  'Home Loan': { rate: 0.075 },
};

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const [amount, setAmount] = useState(250000);
  const [months, setMonths] = useState(36);
  const [loanType, setLoanType] = useState('Education Loan');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('finflow_theme') || 'dark';
    return saved === 'dark';
  });

  const toggleTheme = () => {
    const next = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('finflow_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const dashboardPath = (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') ? '/admin/dashboard' : '/applicant/dashboard';

  const emi = useMemo(() => {
    const annualRate = LOAN_DATA[loanType]?.rate || 0.11;
    const monthlyRate = annualRate / 12;
    const compound = (1 + monthlyRate) ** months;
    return Math.round((amount * monthlyRate * compound) / (compound - 1));
  }, [amount, months, loanType]);

  const applyPath = isAuthenticated ? '/applicant/apply' : '/signup';

  const getLoanTypeEnum = (type) => {
    return type.toUpperCase().replace(' ', '_');
  };

  const handleApply = () => {
    navigate(applyPath, {
      state: {
        requestedAmount: amount,
        tenureMonths: months,
        loanType: getLoanTypeEnum(loanType)
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className={`focus-page ${!isDarkMode ? 'light-mode' : ''}`}>
      <nav className="focus-nav">
        <Link to="/" className="focus-brand">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Landmark size={22} />
          </motion.div>
          <span>FinFlow</span>
        </Link>

        <div className="focus-links">
          <a href="#loans">The Cash</a>
          <a href="#process">The Path</a>
          <a href="#testimonials">The Hype</a>
          <a href="#faq">Curiosity</a>
        </div>

        <div className="focus-actions">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="focus-btn subtle"
            onClick={toggleTheme}
            style={{ width: '42px', padding: 0, borderRadius: '50%' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isDarkMode ? "dark" : "light"}
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {isAuthenticated ? (
            <button className="focus-btn primary shimmer-effect" onClick={() => navigate(dashboardPath)}>
              Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button className="focus-btn subtle" onClick={() => navigate('/login')}>Login</button>
              <button className="focus-btn primary shimmer-effect" onClick={() => navigate('/signup')}>Join the Club</button>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="focus-hero">
          <div className="hero-copy">
            <span className="hero-label">Finally, a bank that doesn't suck.</span>
            <h1 className="hero-title">
              Approved before your bank finishes saying ‘hello?’
            </h1>
            <p>
              100% digital. No paperwork. No ‘please hold.’ Just money.
            </p>

            <div className="hero-buttons">
              <button
                className="focus-btn primary large shimmer-effect"
                onClick={handleApply}
              >
                Fund My Future <ArrowRight size={18} />
              </button>
              <a className="focus-btn subtle large" href="#loans">Play with Numbers</a>
            </div>

            <div className="hero-proof">
              <span><CheckCircle2 size={16} /> 100% Digital</span>
              <span><CheckCircle2 size={16} /> Human-ish Speed</span>
              <span><CheckCircle2 size={16} /> Zero Fax Machines</span>
            </div>
          </div>

          <aside className="loan-card">
            <div className="loan-card-head">
              <div>
                <span>Calculate Your EMI</span>
                <strong>{loanType}</strong>
              </div>
            </div>

            <div className="clean-field">
              <span>Loan Category</span>
              <div className="custom-select-container">
                <div
                  className={`custom-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="trigger-val">
                    {loanType}
                  </div>
                  <ChevronDown size={18} className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} />
                </div>
                {isDropdownOpen && (
                  <div className="custom-options">
                    {Object.keys(LOAN_DATA).map((type) => (
                      <div
                        key={type}
                        className={`custom-option ${loanType === type ? 'selected' : ''}`}
                        onClick={() => {
                          setLoanType(type);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="option-info">
                          <span className="opt-name">{type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="range-block">
              <div>
                <span>Loan Amount</span>
                <strong>{formatMoney(amount)}</strong>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="50000"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </div>

            <div className="range-block">
              <div>
                <span>Tenure</span>
                <strong>{months} months</strong>
              </div>
              <input
                type="range"
                min="6"
                max="84"
                step="6"
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
              />
            </div>

            <div className="emi-box">
              <span>Estimated Monthly EMI</span>
              <strong>{formatMoney(emi)}</strong>
              <p>Actual EMI may vary based on final credit assessment and interest rates.</p>
            </div>

            <button className="focus-btn primary full shimmer-effect" onClick={handleApply}>
              Proceed with Application <ArrowRight size={16} />
            </button>
          </aside>
        </section>

        <section className="feature-row">
          {features.map(([Icon, title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="process-section" id="process">
          <div className="section-heading">
            <span>The Magic Trick</span>
            <h2>Four steps. No mystery. Zero government-style queues.</h2>
          </div>

          <div className="process-grid">
            {steps.map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>



        <section className="faq-section" id="testimonials" style={{ marginTop: '0' }}>
          <div className="faq-header">
            <span className="hero-label">The Hype</span>
            <h2>What people (probably) say about us</h2>
          </div>
          <div className="process-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {testimonials.map((t, idx) => (
              <article key={idx} style={{ minHeight: '260px', position: 'relative' }}>
                <p style={{ fontStyle: 'italic', fontSize: '16px', color: 'var(--text-color)' }}>"{t.text}"</p>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <strong style={{ display: 'block', color: 'var(--feature-title)' }}>{t.name}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--feature-text)' }}>{t.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="faq-header">
            <span className="hero-label">Curiosity Corner</span>
            <h2>Commonly Asked (and Answered)</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
              >
                <button className="faq-question" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                  {faq.q}
                  <ChevronDown size={20} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="faq-answer"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="final-focus"
        >
          <h2>Ready to change your life? Or just your balance?</h2>
          <p>Join thousands of people who decided that waiting in branches was a waste of perfectly good life.</p>
          <button className="focus-btn primary large shimmer-effect" onClick={handleApply}>
            Start the Flow <ArrowRight size={18} />
          </button>
        </motion.section>
      </main>

      <footer className="focus-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <Landmark size={28} />
              <span>FinFlow</span>
            </div>
            <p className="footer-desc">
              Making lending actually tolerable. One digital step at a time.
            </p>
            <div className="hero-proof" style={{ marginTop: '10px', background: 'none', border: 'none', padding: 0 }}>
              <Globe size={18} style={{ marginRight: '15px', color: 'var(--nav-text)', cursor: 'pointer' }} />
              <MessageSquare size={18} style={{ marginRight: '15px', color: 'var(--nav-text)', cursor: 'pointer' }} />
              <Mail size={18} style={{ marginRight: '15px', color: 'var(--nav-text)', cursor: 'pointer' }} />
              <Phone size={18} style={{ color: 'var(--nav-text)', cursor: 'pointer' }} />
            </div>
          </div>

          <div className="footer-col">
            <h4>The Money</h4>
            <div className="footer-links">
              <Link to="/#loans">Personal</Link>
              <Link to="/#loans">Business</Link>
              <Link to="/#process">How it Works</Link>
              <Link to="/#loans">The Calculator</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>The Boring Stuff</h4>
            <div className="footer-links">
              <Link to="/">About Us</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Legal Jargon</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>Talk to Us</h4>
            <div className="footer-links">
              <a href="mailto:support@finflow.com">Email a Human</a>
              <a href="tel:+1234567890">Call the Office</a>
              <span>Somewhere on Planet Earth</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} FinFlow Inc. (We're legit).</span>
          <span>Made with &hearts; and way too much caffeine.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

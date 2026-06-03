import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Moon,
  Sun,
  User,
  Landmark,
  Coffee,
  Home
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './LandingFocus.css';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

const LOAN_DATA = {
  'Personal Loan': { rate: 0.14 },
  'Business Loan': { rate: 0.11 },
  'Education Loan': { rate: 0.085 },
  'Car Loan': { rate: 0.095 },
};

const testimonials = [
  {
    name: "Rahul S.",
    text: `"Applied at 2 AM in my pajamas. Funded by 10 AM. My bank still thinks I live in the late nineties. Absolute wizards."`,
  },
  {
    name: "Anita M.",
    text: `"Zero fax machines. Zero stamps. Zero bureaucratic nightmares. It's like they actually realize my time has value."`,
  },
  {
    name: "Deepak K.",
    text: `"The sarcasm in the FAQ made me trust them. Real humans, real speed, real money. This is how banking should feel."`,
  }
];

const faqs = [
  {
    question: "Do you guys actually have money, or is this a scam?",
    answer: "We are backed by highly regulated, deeply audited, tier-1 financial institutions. We just don't dress like them or make you wait 6 weeks for a signature."
  },
  {
    question: "Do I need to visit a physical branch?",
    answer: "What is a branch? A piece of wood attached to a tree? No, please stay on your couch. We don't want to see you in person either."
  },
  {
    question: "What's the catch? Why is this so fast?",
    answer: "The 'catch' is that we use computers instead of fax machines. Your traditional bank could do it too, they just choose to enjoy watching you suffer."
  },
  {
    question: "Will you spam my email and sell my data?",
    answer: "Absolutely not. We make money by lending you money, not by selling your email address to questionable vitamin companies. Your secrets are safe."
  },
  {
    question: "What happens if I get rejected?",
    answer: "We tell you immediately. No stringing you along, no 'under review' purgatory. If we can't fund you, we'll reject you instantly so you can move on with your life."
  }
];

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`l-faq-item ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="l-faq-q">
        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{question}</h4>
        <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="l-faq-a">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();

  const { isAuthenticated, userRole } = useAuth();

  // Loan calculator state
  const [amount, setAmount] = useState(250000);
  const [months, setMonths] = useState(36);
  const [loanType, setLoanType] = useState('Education Loan');

  // Theme state initialization
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('finflow_theme') || 'dark';
    return saved === 'dark';
  });

  // Theme toggle logic
  const toggleTheme = () => {
    const next = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('finflow_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // User role path resolution
  const dashboardPath = (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') ? '/admin/dashboard' : '/applicant/dashboard';
  const applyPath = isAuthenticated ? '/applicant/apply' : '/signup';

  // EMI Calculation logic
  const emi = useMemo(() => {
    const annualRate = LOAN_DATA[loanType]?.rate || 0.11;
    const monthlyRate = annualRate / 12;
    const compound = (1 + monthlyRate) ** months;
    
    // Standard EMI formula: [P x R x (1+R)^N]/[(1+R)^N-1]
    return Math.round((amount * monthlyRate * compound) / (compound - 1));
  }, [amount, months, loanType]);

  // Application redirect logic
  const handleApply = () => {
    navigate(applyPath, {
      state: {
        requestedAmount: amount,
        tenureMonths: months,
        loanType: loanType.toUpperCase().replace(' ', '_')
      }
    });
  };

  return (
    <div className={`landing-wrapper ${!isDarkMode ? 'light-theme' : ''}`}>
      {/* NAVBAR */}
      <nav className="l-nav">
        <div className="l-nav-container">
          <div className="l-nav-left">
            <Link to="/" className="l-brand">
              <div className="l-brand-logo">F</div>
              <h1 className="l-brand-text">FinFlow</h1>
            </Link>
          </div>
          

          
          <div className="l-nav-links">
            <a href="#cash">The Cash</a>
            <a href="#path">The Path</a>
            <a href="#hype">The Hype</a>
            <a href="#faq">Curiosity</a>
          </div>

          <div className="l-nav-right">
            <button onClick={toggleTheme} className="l-theme-toggle">
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {isAuthenticated ? (
              <button className="l-btn-primary" onClick={() => navigate(dashboardPath)}>
                Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button className="l-btn-outline" onClick={() => navigate('/login')}>Login</button>
                <button className="l-btn-primary" onClick={() => navigate('/signup')}>Join the Club</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="l-hero-bg" id="cash">
        <div className="l-hero-container">
          {/* Left Content */}
          <div className="l-hero-content">
            <p className="l-hero-eyebrow">Finally, a bank that doesn't suck.</p>
            <h1 className="l-hero-title">
              Approved before<br/>your bank finishes<br/>saying <span className="l-text-gradient">'hello'</span>
            </h1>
            <p className="l-hero-desc">
              100% digital. No paperwork. No 'please hold.' Just money.
            </p>
            
            <div className="l-hero-actions">
              <button onClick={handleApply} className="l-btn-primary l-btn-large">
                Fund My Future <ArrowRight size={18} />
              </button>
              <a href="#cash" className="l-btn-outline l-btn-large">
                Play with Numbers
              </a>
            </div>
            
            <div className="l-hero-proof">
              <div className="l-proof-item"><CheckCircle2 className="l-text-emerald" size={18} /><span>100% Digital</span></div>
              <div className="l-proof-item"><CheckCircle2 className="l-text-emerald" size={18} /><span>Human-ish Speed</span></div>
              <div className="l-proof-item"><CheckCircle2 className="l-text-emerald" size={18} /><span>Zero Fax Machines</span></div>
            </div>
          </div>

          {/* EMI Calculator */}
          <div className="l-emi-card">
            <div className="l-emi-header">
              <div>
                <span className="l-emi-eyebrow">Calculate Your EMI</span>
                <h2 className="l-emi-title">{loanType}</h2>
              </div>
              <select 
                className="l-emi-select" 
                value={loanType} 
                onChange={(e) => setLoanType(e.target.value)}
              >
                {Object.keys(LOAN_DATA).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="l-emi-body">
              <div className="l-slider-group">
                <div className="l-slider-labels">
                  <span>Loan Amount</span>
                  <span className="l-slider-val">{formatMoney(amount)}</span>
                </div>
                <input type="range" min="50000" max="5000000" step="10000" value={amount} onChange={e => setAmount(Number(e.target.value))} className="l-slider" />
              </div>

              <div className="l-slider-group">
                <div className="l-slider-labels">
                  <span>Tenure</span>
                  <span className="l-slider-val">{months} months</span>
                </div>
                <input type="range" min="12" max="84" step="6" value={months} onChange={e => setMonths(Number(e.target.value))} className="l-slider" />
              </div>

              <div className="l-emi-result">
                <p className="l-result-eyebrow">ESTIMATED MONTHLY EMI</p>
                <p className="l-result-val">{formatMoney(emi)}</p>
                <p className="l-result-disclaimer">Actual EMI may vary based on final credit assessment and interest rates.</p>
              </div>

              <button onClick={handleApply} className="l-btn-white">
                Proceed with Application <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE PROPS */}
      <div className="l-props-container">
        <div className="l-prop-card">
          <h3>Unfairly Competent</h3>
          <p>We actually know what we're doing. It's shocking, we know.</p>
        </div>
        <div className="l-prop-card">
          <h3>Zero Ghosting</h3>
          <p>We give real-time updates. Better communication than your ex.</p>
        </div>
        <div className="l-prop-card">
          <h3>Fort Knox Privacy</h3>
          <p>We don't sell your data. Frankly, no one wants to buy your Spotify playlist.</p>
        </div>
        <div className="l-prop-card">
          <h3>Zero Anxiety</h3>
          <p>Our UI is so smooth it practically apologizes for making you type your own name.</p>
        </div>
      </div>

      {/* FOUR STEPS */}
      <div className="l-steps-bg" id="path">
        <div className="l-steps-header">
          <span className="l-text-cyan">The Magic Trick</span>
          <h2>Four steps. No mystery.<br/>Zero government-style queues.</h2>
        </div>

        <div className="l-steps-grid">
          <div className="l-step-card">
            <div className="l-step-num">01</div>
            <h3>The Honest Ask</h3>
            <p>Tell us how much you need. We won't ask for your firstborn, but we do need some numbers.</p>
          </div>
          <div className="l-step-card">
            <div className="l-step-num">02</div>
            <h3>The Paperwork (Wait, No)</h3>
            <p>Upload a few PDFs. No printers, no ink, no soul-crushing 1995 bureaucracy.</p>
          </div>
          <div className="l-step-card">
            <div className="l-step-num">03</div>
            <h3>The Human Check</h3>
            <p>A real person (who enjoys coffee and high-speed fiber) verifies your credentials.</p>
          </div>
          <div className="l-step-card">
            <div className="l-step-num">04</div>
            <h3>The Funding</h3>
            <p>The funds hit your account. Go ahead, make your traditional bank jealous.</p>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="l-testimonials-container" id="hype">
        <div className="l-testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="l-testimonial-card">
              <p className="l-quote">{t.text}</p>
              <p className="l-author">{t.name}</p>
            </div>
          ))}
        </div>

        <div className="l-faq-header" id="faq">
          <p className="l-text-cyan">Curiosity Corner</p>
          <h2>Commonly Asked (and Answered)</h2>
        </div>
        <div className="l-faq-body">
          <div className="l-faq-list">
            {faqs.map((f, i) => (
              <FAQItem key={i} question={f.question} answer={f.answer} />
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-grid">
          <div>
            <div className="l-footer-brand">
              <div className="l-brand-logo-small">F</div>
              <span>FinFlow</span>
            </div>
            <p className="l-footer-desc">Making lending actually tolerable.<br/>One digital step at a time.</p>
          </div>
          <div>
            <h4>The Money</h4>
            <div className="l-footer-links">
              <a href="#cash">Personal</a>
              <a href="#cash">Business</a>
              <a href="#path">How it Works</a>
              <a href="#cash">The Calculator</a>
            </div>
          </div>
          <div>
            <h4>The Boring Stuff</h4>
            <div className="l-footer-links">
              <a href="#">About Us (We're nerds)</a>
              <a href="#">Careers (We have snacks)</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Legal Jargon</a>
            </div>
          </div>
          <div>
            <h4>Talk to Us</h4>
            <div className="l-footer-links">
              <a href="#">Email a Human</a>
              <a href="#">Call the Office</a>
              <a href="#">Somewhere on Planet Earth</a>
            </div>
          </div>
        </div>
        <div className="l-footer-bottom">
          © {new Date().getFullYear()} FinFlow Inc. (A totally real company. Do not feed the bankers.)
        </div>
      </footer>
    </div>
  );
};

export default Landing;

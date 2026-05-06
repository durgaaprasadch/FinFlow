import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, IndianRupee, Target, Award, PieChart as PieIcon } from 'lucide-react';
import { formatMoney } from '../utils/format';

/* ── Colour palette ─────────────────────────────────────── */
const PALETTE = ['#4f7bff', '#22c980', '#f5a623', '#c07aff', '#ff6b6b', '#38bdf8'];

/* ── Mini Donut (proper, bounded size) ──────────────────── */
const DonutChart = ({ segments = [], size = 140, strokeWidth = 14 }) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const dashGap = circumference - dashLen;
        const dashOffset = circumference * 0.25 - offset * circumference;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        );
        offset += pct;
        return el;
      })}
    </svg>
  );
};

/* ── SVG Line Chart ──────────────────────────────────────── */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
const INITIAL_TREND_DATA = [18, 32, 27, 45, 38, 56]; 
const LineChart = ({ data = INITIAL_TREND_DATA }) => {
  const W = 560;
  const H = 160;
  const PAD = { top: 16, right: 20, bottom: 16, left: 20 };
  const maxVal = Math.max(...data, 1);

  const pts = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right),
    y: PAD.top + (1 - v / maxVal) * (H - PAD.top - PAD.bottom),
  }));

  const linePath = pts
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');

  const smooth = (arr) => {
    if (arr.length < 2) return linePath;
    let d = `M${arr[0].x},${arr[0].y}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const cp1x = arr[i].x + (arr[i + 1].x - arr[i].x) / 3;
      const cp1y = arr[i].y;
      const cp2x = arr[i + 1].x - (arr[i + 1].x - arr[i].x) / 3;
      const cp2y = arr[i + 1].y;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${arr[i + 1].x},${arr[i + 1].y}`;
    }
    return d;
  };

  const curvePath = smooth(pts);
  const areaPath = `${curvePath} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px' }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4f7bff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f7bff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1={PAD.left} y1={PAD.top + f * (H - PAD.top - PAD.bottom)}
            x2={W - PAD.right} y2={PAD.top + f * (H - PAD.top - PAD.bottom)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#lineGrad)" />
        {/* Line */}
        <path d={curvePath} fill="none" stroke="#4f7bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#0e1425" stroke="#4f7bff" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="2" fill="#4f7bff" />
          </g>
        ))}
      </svg>
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingLeft: `${PAD.left}px`,
        paddingRight: `${PAD.right}px`,
        marginTop: '8px',
      }}>
        {MONTHS.map(m => (
          <span key={m} style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Stat Row ────────────────────────────────────────────── */
const StatRow = ({ color, label, value, pct }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: '12px', color: 'var(--muted)' }}>{label}</span>
    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{value}</strong>
    <span style={{
      fontSize: '11px', fontWeight: 700,
      background: `${color}22`, color, borderRadius: '6px',
      padding: '2px 7px', minWidth: '38px', textAlign: 'center',
    }}>{pct}%</span>
  </div>
);

/* ── Progress Bar ────────────────────────────────────────── */
const ProgressBar = ({ label, value, max, color = '#4f7bff' }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: '999px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const AdminAnalytics = ({ apps = [] }) => {
  const stats = useMemo(() => {
    const total = apps.length || 0;
    const approved = apps.filter(a => a.status === 'APPROVED').length;
    const rejected = apps.filter(a => a.status === 'REJECTED').length;
    // Correctly count pending: everything that's not approved or rejected
    const pending = apps.filter(a => !['APPROVED', 'REJECTED'].includes(a.status)).length;
    // Use loanAmount as fallback — API may return either field name
    const amt = (a) => Number(a.requestedAmount) || Number(a.loanAmount) || 0;
    const totalAmt = apps.reduce((s, a) => s + amt(a), 0);
    const approvedAmt = apps.filter(a => a.status === 'APPROVED').reduce((s, a) => s + amt(a), 0);
    const atRiskAmt = apps.filter(a => !['APPROVED', 'REJECTED'].includes(a.status)).reduce((s, a) => s + amt(a), 0);
    const approvalRate = total ? Math.round((approved / total) * 100) : 0;

    // Loan type breakdown
    const byType = apps.reduce((acc, a) => {
      const t = (a.loanType || 'OTHER').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const typeEntries = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], i) => ({ label, value: count, color: PALETTE[i % PALETTE.length] }));

    return { total, approved, rejected, pending, totalAmt, approvedAmt, atRiskAmt, approvalRate, typeEntries };
  }, [apps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Applications', value: stats.total, color: '#4f7bff', sub: 'All time' },
          { label: 'Approval Rate', value: `${stats.approvalRate}%`, color: '#22c980', sub: `${stats.approved} approved` },
          { label: 'Total Exposure', value: formatMoney(stats.totalAmt), color: '#f5a623', sub: 'Loan book size' },
          { label: 'Disbursed Value', value: formatMoney(stats.approvedAmt), color: '#c07aff', sub: 'Approved applications' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            className="ad-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}88)` }} />
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', marginBottom: '10px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '12px', color: kpi.color, marginTop: '8px', fontWeight: 600 }}>{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 2: Line Chart + Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* Line Chart */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Origination Velocity</h2>
              <p>Application volume trend over the last 6 months</p>
            </div>
            <TrendingUp size={18} color="#4f7bff" />
          </div>
          <div className="ad-panel-body">
            <LineChart />
          </div>
        </div>

        {/* Donut + Portfolio Mix */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Portfolio Mix</h2>
              <p>Loan type distribution</p>
            </div>
            <PieIcon size={18} color="#c07aff" />
          </div>
          <div className="ad-panel-body">
            {stats.typeEntries.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DonutChart segments={stats.typeEntries} size={120} strokeWidth={12} />
                    <div style={{
                      position: 'absolute', textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    }}>
                      <strong style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                        {stats.approvalRate}%
                      </strong>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Approval
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {stats.typeEntries.map((seg, i) => (
                    <StatRow
                      key={i}
                      color={seg.color}
                      label={seg.label}
                      value={seg.value}
                      pct={Math.round((seg.value / stats.total) * 100)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: '13px' }}>
                No data yet — submit some applications to see the mix.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Performance Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Funnel */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Status Funnel</h2>
              <p>Application pipeline health</p>
            </div>
            <Award size={18} color="#22c980" />
          </div>
          <div className="ad-panel-body">
            <ProgressBar label="Approved" value={stats.approved} max={stats.total} color="#22c980" />
            <ProgressBar label="Rejected" value={stats.rejected} max={stats.total} color="#ff6b6b" />
            <ProgressBar label="Pending Review" value={stats.pending} max={stats.total} color="#f5a623" />
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Financial Metrics</h2>
              <p>Exposure and portfolio targets</p>
            </div>
            <IndianRupee size={18} color="#f5a623" />
          </div>
          <div className="ad-panel-body">
            {[
              { label: 'Total Loan Book', value: formatMoney(stats.totalAmt), color: '#4f7bff' },
              { label: 'Disbursed Amount', value: formatMoney(stats.approvedAmt), color: '#22c980' },
              // At-risk = sum of amounts for pending apps (not approved/rejected)
              { label: 'Pending Exposure', value: formatMoney(stats.atRiskAmt), color: '#f5a623' },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{m.label}</span>
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 700 }}>{m.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;

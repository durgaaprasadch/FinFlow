import React from 'react';
import { Bell, CheckCircle2, Clock3, Mail, FileWarning, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import './Experience.css';

const NOTIFICATION_TYPES = [
  {
    title: 'Application Updates',
    desc: 'Real-time status changes, underwriter decisions, and approval milestones.',
    icon: Bell,
    color: 'var(--blue)',
    status: 'Service Active'
  },
  {
    title: 'Identity & Access',
    desc: 'Multi-factor authentication events, signup verifications, and security alerts.',
    icon: Mail,
    color: 'var(--violet)',
    status: 'Monitoring'
  },
  {
    title: 'Compliance Requests',
    desc: 'Direct messages regarding document re-uploads or verification clarifications.',
    icon: FileWarning,
    color: 'var(--teal)',
    status: 'Priority'
  }
];

const Notifications = () => (
  <div className="dashboard-page">
    <section className="page-hero">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <span className="page-kicker">Communication Hub</span>
        <h1>Operational Alerts</h1>
        <p>The notification engine is synchronized with our microservices. Live event streaming will populate this feed as system actions occur.</p>
      </motion.div>
      <div className="status-pill good">
        <Zap size={14} /> System Online
      </div>
    </section>

    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
      <motion.section 
        className="panel-premium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="panel-header-premium">
          <div>
            <h2>Notification Streams</h2>
            <p>Unified feed for all platform activities.</p>
          </div>
          <Clock3 size={20} color="var(--blue)" style={{ opacity: 0.5 }} />
        </div>
        
        <div className="panel-body">
          <div className="notification-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {NOTIFICATION_TYPES.map((notif, index) => (
              <motion.div 
                key={notif.title}
                className="action-card-premium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ cursor: 'default' }}
              >
                <div 
                  className="action-icon-premium" 
                  style={{ 
                    background: `${notif.color}11`, 
                    color: notif.color,
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px'
                  }}
                >
                  <notif.icon size={22} />
                </div>
                <div className="action-info-premium" style={{ marginLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '16px' }}>{notif.title}</strong>
                    <span className="status-pill sm" style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--line)' }}>{notif.status}</span>
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>{notif.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="empty-state" style={{ marginTop: '48px', padding: '64px 24px', border: '1px dashed var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ opacity: 0.4 }}>
              <Bell size={48} style={{ marginBottom: '16px' }} />
              <h3>No new messages</h3>
              <p>Your inbox is current. We'll alert you here when your application moves to a new phase.</p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  </div>
);

export default Notifications;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, CheckCheck, BellRing } from 'lucide-react';
import { applicationService, notificationService } from '../api';
import { unwrap } from '../utils/format';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import '../Pages/DashboardFocus.css';

const TYPE_ICONS = {
  LOAN_STATUS:   '📋',
  LOGIN:         '🔐',
  REGISTRATION:  '🎉',
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    console.log('[NOTIF-DEBUG] Fetching notifications for user...', user);
    try {
      const res = await notificationService.getNotifications();
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('[NOTIF-FETCH-ERROR]', err);
      // If we're getting a 404 or connection error, let's at least show the user something went wrong
      if (!notifications.length) {
        setNotifications([{
          id: 'error-diag',
          title: 'Connectivity Alert',
          message: `Error: ${err.message || 'Network Failure'}. Target: ${err.config?.url || 'Unknown URL'}`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        }]);
      }
    }
  }, [user]);

  // Poll every 10 seconds so events show up quickly
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh immediately when dropdown is opened
  const handleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) fetchNotifications();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const formatTime = (ts) => {
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); }
    catch { return ''; }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="icon-button"
        style={{ position: 'relative' }}
        onClick={handleOpen}
        title="Notifications"
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="vip-notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="vip-dropdown-menu">
          {/* Header */}
          <div className="vip-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="name" style={{ fontSize: '13px', fontWeight: 700 }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--dash-accent)', fontSize: '11px' }}>({unreadCount} new)</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'transparent', border: 'none', color: 'var(--dash-accent)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: 'var(--dash-muted)',
                fontSize: '13px',
              }}>
                <Bell size={28} style={{ opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                No notifications yet.
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                  You'll see alerts here when something changes.
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`vip-notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                  style={{ cursor: !n.read ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.2, marginTop: '2px' }}>
                      {TYPE_ICONS[n.type] || '🔔'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span className="title" style={{ fontWeight: !n.read ? 700 : 600 }}>{n.title}</span>
                        {!n.read && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--dash-accent)', flexShrink: 0 }} />
                        )}
                      </div>
                      <span className="message">{n.message}</span>
                      <span className="time">{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="vip-dropdown-footer" style={{ textAlign: 'center' }}>
              <button
                onClick={fetchNotifications}
                style={{ background: 'transparent', border: 'none', color: 'var(--dash-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: '8px' }}
              >
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

import React, { useState } from 'react';
import { playClick, playSuccess } from '../utils/soundEngine';

const NotificationDrawer = ({ isOpen = false, onClose = () => {}, onSelectAction = () => {} }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Application Shortlisted',
      message: 'TechCorp Solutions shortlisted your profile for the Software Engineer drive.',
      time: '12m ago',
      category: 'Recruitment',
      unread: true,
      actionTab: 'applications'
    },
    {
      id: 2,
      title: 'New Campus Drive Published',
      message: 'Google Cloud Systems published Associate Software Engineer (Min CGPA: 7.00).',
      time: '1h ago',
      category: 'Drives',
      unread: true,
      actionTab: 'jobs'
    },
    {
      id: 3,
      title: 'Dossier Verification Complete',
      message: 'Your official PDF resume has been verified by the Central Placement Cell.',
      time: '3h ago',
      category: 'Credentials',
      unread: false,
      actionTab: 'scorecard'
    },
    {
      id: 4,
      title: 'Interview Assessment Scheduled',
      message: 'Round 2 Technical Architecture evaluation begins on Monday 10:00 AM.',
      time: '1d ago',
      category: 'Interview',
      unread: false,
      actionTab: 'applications'
    }
  ]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    playSuccess();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleItemClick = (n) => {
    playClick();
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
    );
    if (n.actionTab) {
      onSelectAction(n.actionTab);
    }
    onClose();
  };

  const displayedNotifs = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    return true;
  });

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header" style={{ padding: '20px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Notifications</h3>
              {unreadCount > 0 && (
                <span className="badge badge-accepted" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {unreadCount} New
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Campus hiring updates and drive alerts
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleMarkAllRead}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Mark Read
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                playClick();
                onClose();
              }}
              style={{ padding: '4px 10px', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              playClick();
              setFilter('all');
            }}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              playClick();
              setFilter('unread');
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayedNotifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>No Notifications</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>You're all caught up on placement activities.</div>
            </div>
          ) : (
            displayedNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: n.unread ? 'var(--brand-indigo-light)' : 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${n.unread ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {n.time}
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '4px 0' }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span className="tag-pill" style={{ fontSize: '10px' }}>{n.category}</span>
                  {n.unread && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-indigo)' }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;

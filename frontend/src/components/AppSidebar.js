import React from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
import { playClick } from '../utils/soundEngine';

const AppSidebar = ({
  activeTab = 'jobs',
  setActiveTab = () => {},
  jobCount = 0,
  appCount = 0,
  onOpenDossier = null
}) => {
  const { user, logout } = useAuth();

  const handleNav = (tabId) => {
    playClick();
    setActiveTab(tabId);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="app-sidebar">
      <div>
        {/* Workspace / College Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-box">⚡</div>
            <div>
              <div className="sidebar-brand-name">Apex Placement</div>
              <div className="sidebar-brand-sub">Enterprise Cloud v2.4</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">WORKSPACE</div>

          {user?.role === 'student' ? (
            <>
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => handleNav('jobs')}
              >
                <div className="sidebar-nav-item-left">
                  <span>💼</span>
                  <span>Eligible Drives</span>
                </div>
                {jobCount > 0 && (
                  <span className="sidebar-nav-badge">{jobCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => handleNav('applications')}
              >
                <div className="sidebar-nav-item-left">
                  <span>📑</span>
                  <span>My Applications</span>
                </div>
                {appCount > 0 && (
                  <span className="sidebar-nav-badge">{appCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'scorecard' ? 'active' : ''}`}
                onClick={() => handleNav('scorecard')}
              >
                <div className="sidebar-nav-item-left">
                  <span>🎯</span>
                  <span>ATS Readiness</span>
                </div>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleNav('analytics')}
              >
                <div className="sidebar-nav-item-left">
                  <span>📈</span>
                  <span>Placement Analytics</span>
                </div>
                <span className="badge badge-accepted" style={{ fontSize: '9px', padding: '1px 5px' }}>NEW</span>
              </button>

              {onOpenDossier && (
                <button
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() => {
                    playClick();
                    onOpenDossier();
                  }}
                >
                  <div className="sidebar-nav-item-left">
                    <span>🖨️</span>
                    <span>Official Dossier</span>
                  </div>
                  <span className="tag-pill" style={{ fontSize: '9px' }}>SEALED</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'drives' ? 'active' : ''}`}
                onClick={() => handleNav('drives')}
              >
                <div className="sidebar-nav-item-left">
                  <span>📊</span>
                  <span>Active Drives</span>
                </div>
                {jobCount > 0 && (
                  <span className="sidebar-nav-badge">{jobCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'publish' ? 'active' : ''}`}
                onClick={() => handleNav('publish')}
              >
                <div className="sidebar-nav-item-left">
                  <span>🚀</span>
                  <span>Publish Drive</span>
                </div>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleNav('analytics')}
              >
                <div className="sidebar-nav-item-left">
                  <span>📈</span>
                  <span>Cohort Analytics</span>
                </div>
                <span className="badge badge-accepted" style={{ fontSize: '9px', padding: '1px 5px' }}>NEW</span>
              </button>
            </>
          )}

          <div className="nav-group-title">SYSTEM PREFERENCES</div>
          <div style={{ padding: '4px 10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <ThemeToggle />
            <SoundToggle />
          </div>
        </nav>
      </div>

      {/* User Profile Capsule */}
      <div className="sidebar-footer">
        <div className="user-profile-capsule">
          <div className="user-info-cluster">
            <div className="user-avatar-circle">
              {getInitials(user?.name || user?.username)}
            </div>
            <div className="user-text-box">
              <div className="user-name-text">{user?.name || user?.username}</div>
              <div className="user-role-text">{user?.role}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              playClick();
              logout();
            }}
            title="Sign out"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;

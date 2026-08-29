import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppSidebar from './AppSidebar';
import CommandPalette from './CommandPalette';
import NotificationDrawer from './NotificationDrawer';
import PlacementAnalytics from './PlacementAnalytics';
import { playClick, playSuccess } from '../utils/soundEngine';

const RecruiterDashboard = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [applicantFilterStatus, setApplicantFilterStatus] = useState('ALL');
  const [applicantSearch, setApplicantSearch] = useState('');
  const [reviewViewMode, setReviewViewMode] = useState('table'); // 'table' | 'kanban'
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'publish' | 'analytics'

  // New Flagship States: Notifications & Batch Operations
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Job creation form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_cgpa: '',
    deadline: ''
  });

  const cleanBase = useMemo(() => (API_BASE_URL || '').replace(/\/+$/, ''), []);

  const handleSignOut = useCallback(() => {
    playClick();
    logout();
    navigate('/login');
    showToast('Signed out of recruiter portal.', 'info', 2000);
  }, [logout, navigate, showToast]);

  // Fetch recruiter's jobs
  const fetchJobs = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${cleanBase}/api/jobs/recruiter`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : (Array.isArray(res.data) ? res.data : []);

      setJobs(list);
    } catch (err) {
      console.error('Error fetching recruiter jobs:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast('Session expired. Please sign in again.', 'warning');
        handleSignOut();
        return;
      }
      showToast('Failed to load active job drives.', 'error');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [cleanBase, token, handleSignOut, showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Open applicant review modal
  const handleOpenApplicants = async (job) => {
    playClick();
    setSelectedJob(job);
    setApplicants([]);
    setSelectedApplicantIds([]);
    setApplicantFilterStatus('ALL');
    setApplicantSearch('');
    setApplicantsLoading(true);

    try {
      const res = await axios.get(`${cleanBase}/api/applications/job/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : (Array.isArray(res.data) ? res.data : []);

      setApplicants(list);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      showToast('Failed to retrieve candidate roster for this drive.', 'error');
      setApplicants([]);
    } finally {
      setApplicantsLoading(false);
    }
  };

  // Update applicant status
  const handleUpdateStatus = async (applicationId, newStatus, studentName) => {
    playClick();
    try {
      setUpdatingId(applicationId);
      await axios.put(
        `${cleanBase}/api/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      playSuccess();
      showToast(`Updated ${studentName || 'candidate'} to ${newStatus}`, 'success');

      setApplicants((prev) =>
        prev.map((app) => {
          const appId = app.application_id || app.id;
          if (appId === applicationId) {
            return { ...app, status: newStatus };
          }
          return app;
        })
      );
    } catch (err) {
      console.error('Error updating status:', err);
      const msg = err.response?.data?.message || 'Failed to update candidate status.';
      showToast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle selection of an applicant
  const handleToggleSelectApplicant = (appId) => {
    playClick();
    setSelectedApplicantIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  // Toggle select all filtered applicants
  const handleToggleSelectAll = (filteredList) => {
    playClick();
    const allIds = filteredList.map((a) => a.application_id || a.id);
    if (selectedApplicantIds.length === allIds.length && allIds.length > 0) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(allIds);
    }
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedApplicantIds.length === 0) return;
    playClick();
    setBatchUpdating(true);

    try {
      await Promise.all(
        selectedApplicantIds.map((appId) =>
          axios.put(
            `${cleanBase}/api/applications/${appId}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      playSuccess();
      showToast(`Successfully moved ${selectedApplicantIds.length} candidates to ${newStatus}!`, 'success');

      setApplicants((prev) =>
        prev.map((app) => {
          const appId = app.application_id || app.id;
          if (selectedApplicantIds.includes(appId)) {
            return { ...app, status: newStatus };
          }
          return app;
        })
      );
      setSelectedApplicantIds([]);
    } catch (err) {
      console.error('Batch update error:', err);
      showToast('Error occurred during batch update.', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  // Export CSV Roster
  const handleExportCSV = () => {
    playClick();
    if (!applicants.length) {
      showToast('No candidates available to export.', 'warning');
      return;
    }

    const headers = ['Applicant ID', 'Name', 'Email', 'Branch', 'CGPA', 'Status', 'Applied Date'];
    const rows = applicants.map((a) => [
      a.application_id || a.id,
      `"${a.name || a.username || ''}"`,
      a.email || '',
      `"${a.branch || ''}"`,
      a.cgpa || '',
      a.status || '',
      a.applied_at ? new Date(a.applied_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedJob?.title || 'Candidates'}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    playSuccess();
    showToast('Exported candidate roster CSV.', 'success');
  };

  // Create new job drive
  const handleCreateJob = async (e) => {
    e.preventDefault();
    playClick();

    if (!formData.title || !formData.description || !formData.min_cgpa || !formData.deadline) {
      showToast('Please complete all required drive parameters.', 'warning');
      return;
    }

    const cgpa = parseFloat(formData.min_cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      showToast('Minimum CGPA must be between 0.00 and 10.00.', 'warning');
      return;
    }

    try {
      setPosting(true);
      await axios.post(`${cleanBase}/api/jobs/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      playSuccess();
      showToast('Campus recruitment drive published successfully!', 'success');
      setFormData({ title: '', description: '', min_cgpa: '', deadline: '' });
      setActiveTab('drives');
      fetchJobs();
    } catch (err) {
      console.error('Error creating job:', err);
      const msg = err.response?.data?.message || 'Failed to publish job drive.';
      showToast(msg, 'error');
    } finally {
      setPosting(false);
    }
  };

  const getFullResumeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      if (applicantFilterStatus !== 'ALL' && app.status !== applicantFilterStatus) {
        return false;
      }
      if (applicantSearch.trim()) {
        const q = applicantSearch.toLowerCase();
        const name = (app.name || app.username || '').toLowerCase();
        const branch = (app.branch || '').toLowerCase();
        const email = (app.email || '').toLowerCase();
        return name.includes(q) || branch.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [applicants, applicantFilterStatus, applicantSearch]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted': return 'badge-accepted';
      case 'Shortlisted': return 'badge-shortlisted';
      case 'Interviewing': return 'badge-interviewing';
      case 'Rejected': return 'badge-rejected';
      default: return 'badge-applied';
    }
  };

  return (
    <div className="app-layout">
      {/* Enterprise Left Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobCount={jobs.length}
      />

      {/* Main Recruiter Workbench */}
      <main className="app-main">
        {/* Top Command Header */}
        <header className="app-top-header">
          <div className="header-breadcrumbs">
            <span>Apex Placement</span>
            <span>/</span>
            <span>Talent Console</span>
            <span>/</span>
            <span className="breadcrumb-active">
              {activeTab === 'drives' && 'Active Recruitment Drives'}
              {activeTab === 'publish' && 'Publish Campus Drive'}
              {activeTab === 'analytics' && 'Institutional Hiring Analytics'}
            </span>
          </div>

          <div className="header-actions">
            <div className="header-status-pill">
              <span className="pulse-dot" />
              <span>Recruiter Node Connected</span>
            </div>

            {/* Live Notification Bell Trigger */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', padding: '6px 12px' }}
              onClick={() => {
                playClick();
                setIsNotifOpen(true);
              }}
              title="Notifications"
            >
              <span>🔔</span>
              <span className="badge badge-accepted" style={{ fontSize: '10px', padding: '1px 5px', marginLeft: '4px' }}>
                1
              </span>
            </button>

            <CommandPalette
              eligibleJobs={jobs}
              onSelectJob={(job) => {
                handleOpenApplicants(job);
              }}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                playClick();
                fetchJobs();
              }}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="page-workbench">
          {/* Executive Metrics HUD */}
          <div className="hud-grid">
            <div className="hud-card">
              <div className="hud-label">
                <span>Active Drives</span>
                <span>📊</span>
              </div>
              <div className="hud-value">{jobs.length}</div>
              <div className="hud-subtext">Live institutional campaigns</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Total Candidates</span>
                <span>👥</span>
              </div>
              <div className="hud-value">
                {jobs.reduce((acc, curr) => acc + (curr.applicant_count || 0), 0)}
              </div>
              <div className="hud-subtext">Submissions across all active drives</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Avg. Cutoff CGPA</span>
                <span>🎯</span>
              </div>
              <div className="hud-value">
                {jobs.length
                  ? (jobs.reduce((acc, curr) => acc + parseFloat(curr.min_cgpa || 0), 0) / jobs.length).toFixed(2)
                  : '0.00'}
              </div>
              <div className="hud-subtext">Threshold index requirement</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Hiring Cycle</span>
                <span>⚡</span>
              </div>
              <div className="hud-value" style={{ color: 'var(--accent-emerald)' }}>Batch 2026</div>
              <div className="hud-subtext">Tier-1 Campus Placement Season</div>
            </div>
          </div>

          {/* TAB 1: ACTIVE DRIVES LIST */}
          {activeTab === 'drives' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem' }}>Active Placement Drives</h2>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab('publish')}
                >
                  + New Drive Campaign
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid var(--border-subtle)',
                    borderTopColor: 'var(--brand-primary)',
                    borderRadius: '50%',
                    margin: '0 auto 12px auto',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving your recruitment drives...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '60px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📢</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No Active Drives Posted</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                    Publish a placement drive to begin scanning student eligibility and accepting campus submissions.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('publish')}
                  >
                    Publish First Drive
                  </button>
                </div>
              ) : (
                <div className="drives-grid">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="drive-card-pro"
                      onClick={() => handleOpenApplicants(job)}
                    >
                      <div>
                        <div className="drive-card-top">
                          <div className="company-logo-avatar">
                            {(job.company_name || user?.company_name || 'C')[0]}
                          </div>
                          <div className="drive-info-title-box">
                            <div className="drive-company-name">{job.company_name || user?.company_name}</div>
                            <h4 className="drive-title-text">{job.title}</h4>
                            <div className="drive-ctc-pill">Active Campaign</div>
                          </div>
                        </div>

                        <p className="drive-desc-snippet">{job.description}</p>

                        <div className="drive-tags-cluster">
                          <span className="tag-pill" style={{ color: 'var(--brand-primary)' }}>
                            Cutoff: {parseFloat(job.min_cgpa).toFixed(2)} CGPA
                          </span>
                          <span className="tag-pill">
                            👥 {job.applicant_count || 0} Applicants
                          </span>
                        </div>
                      </div>

                      <div className="drive-card-footer">
                        <div className="drive-deadline-text">
                          <span>Closes:</span>
                          <strong>{new Date(job.deadline).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}</strong>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenApplicants(job);
                          }}
                        >
                          Review Applicants ({job.applicant_count || 0}) →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PUBLISH NEW DRIVE FORM */}
          {activeTab === 'publish' && (
            <div style={{
              maxWidth: '680px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Publish Institutional Recruitment Drive</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '28px' }}>
                Set your minimum academic index threshold and timeline. The eligibility engine will automatically match qualified engineering students.
              </p>

              <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Job Role Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SDE-1 / Cloud Systems Architect"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Role Description & Expectations *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details regarding tech stack, responsibilities, compensation CTC packages, and interview round expectations..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Minimum CGPA Cutoff (0-10) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 7.50"
                      value={formData.min_cgpa}
                      onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Registration Deadline Date *
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={posting}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    {posting ? 'Broadcasting Drive...' : 'Publish Drive Instantly →'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('drives')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ANALYTICS VIEW */}
          {activeTab === 'analytics' && <PlacementAnalytics />}
        </div>
      </main>

      {/* APPLICANT REVIEW MODAL / DRAWER */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-panel" style={{ maxWidth: reviewViewMode === 'kanban' ? '1100px' : '860px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.06em' }}>
                  Candidate Review Panel
                </div>
                <h3 style={{ margin: '2px 0' }}>{selectedJob.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Cutoff: {parseFloat(selectedJob.min_cgpa).toFixed(2)} CGPA • {applicants.length} Submissions
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                >
                  📥 Export CSV
                </button>

                <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      backgroundColor: reviewViewMode === 'table' ? 'var(--brand-primary)' : 'transparent',
                      color: reviewViewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setReviewViewMode('table')}
                  >
                    📋 List
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      backgroundColor: reviewViewMode === 'kanban' ? 'var(--brand-primary)' : 'transparent',
                      color: reviewViewMode === 'kanban' ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setReviewViewMode('kanban')}
                  >
                    🗂️ Kanban
                  </button>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedJob(null)}
                  style={{ fontSize: '16px', padding: '4px 10px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ paddingBottom: selectedApplicantIds.length > 0 ? '90px' : '28px' }}>
              {/* Search and Batch Select Header within Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search candidate name, branch, or email..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                  />
                </div>

                {/* Batch Select All Checkbox */}
                {reviewViewMode === 'table' && filteredApplicants.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleSelectAll(filteredApplicants)}
                  >
                    {selectedApplicantIds.length === filteredApplicants.length ? '✓ Deselect All' : 'Select All Candidates'}
                  </button>
                )}
              </div>

              {applicantsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Loading candidate submissions...</p>
                </div>
              ) : filteredApplicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No candidates found.</p>
                </div>
              ) : reviewViewMode === 'kanban' ? (
                /* KANBAN MULTI-STAGE BOARD */
                <div className="kanban-board-container">
                  {['Applied', 'Shortlisted', 'Interviewing', 'Accepted'].map((colStage) => {
                    const colApps = filteredApplicants.filter((a) => a.status === colStage);

                    return (
                      <div key={colStage} className="kanban-column">
                        <div className="kanban-column-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>{colStage}</span>
                            <span className="kanban-column-count">{colApps.length}</span>
                          </div>
                        </div>

                        <div className="kanban-card-list">
                          {colApps.length === 0 ? (
                            <div className="kanban-empty-drop">
                              No candidates in this round
                            </div>
                          ) : (
                            colApps.map((app) => {
                              const appId = app.application_id || app.id;
                              const isSelected = selectedApplicantIds.includes(appId);

                              return (
                                <div key={appId} className={`kanban-card ${isSelected ? 'selected' : ''}`}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectApplicant(appId)}
                                      style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span className="badge badge-cgpa" style={{ fontSize: '10px' }}>
                                      {parseFloat(app.cgpa).toFixed(2)} CGPA
                                    </span>
                                  </div>

                                  <div className="kanban-card-name">{app.name || app.username}</div>
                                  <div className="kanban-card-sub">{app.branch} • {app.email}</div>

                                  {app.resume_url && (
                                    <div style={{ margin: '6px 0' }}>
                                      <a
                                        href={getFullResumeUrl(app.resume_url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: '11px', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                                        onClick={() => playClick()}
                                      >
                                        📄 View PDF Resume
                                      </a>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                                    {colStage === 'Applied' && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        style={{ width: '100%', fontSize: '11px', padding: '4px 6px' }}
                                        onClick={() => handleUpdateStatus(appId, 'Shortlisted', app.name)}
                                      >
                                        Shortlist →
                                      </button>
                                    )}
                                    {colStage === 'Shortlisted' && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        style={{ width: '100%', fontSize: '11px', padding: '4px 6px' }}
                                        onClick={() => handleUpdateStatus(appId, 'Accepted', app.name)}
                                      >
                                        Offer Job ✓
                                      </button>
                                    )}
                                    {colStage === 'Accepted' && (
                                      <span className="badge badge-accepted" style={{ width: '100%', justifyContent: 'center' }}>
                                        ✓ Offer Sent
                                      </span>
                                    )}
                                    {colStage !== 'Accepted' && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        style={{ fontSize: '11px', padding: '4px 6px', color: 'var(--accent-rose)' }}
                                        onClick={() => handleUpdateStatus(appId, 'Rejected', app.name)}
                                        title="Reject"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD LIST VIEW */
                filteredApplicants.map((app) => {
                  const appId = app.application_id || app.id;
                  const isUpdating = updatingId === appId;
                  const isSelected = selectedApplicantIds.includes(appId);

                  return (
                    <div
                      key={appId}
                      style={{
                        padding: '16px 20px',
                        backgroundColor: isSelected ? 'var(--brand-indigo-light)' : 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--brand-indigo)' : 'var(--border-subtle)'}`,
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '14px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectApplicant(appId)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{app.name || app.username}</span>
                            <span className="badge badge-cgpa">CGPA: {parseFloat(app.cgpa).toFixed(2)}</span>
                            <span className={`badge ${getStatusBadgeClass(app.status)}`}>{app.status}</span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                            <span>🎓 {app.branch}</span>
                            <span>✉️ {app.email}</span>
                            {app.resume_url && (
                              <a
                                href={getFullResumeUrl(app.resume_url)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}
                                onClick={() => playClick()}
                              >
                                📄 View PDF Resume
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={app.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(appId, e.target.value, app.name)}
                          style={{ padding: '6px 10px', fontSize: '12px', minWidth: '130px' }}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Accepted">Accepted (Offer)</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* FLOATING BATCH ACTION DOCK */}
            {selectedApplicantIds.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '24px',
                right: '24px',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-focus)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100,
                animation: 'slideUp 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-accepted" style={{ fontSize: '12px' }}>
                    {selectedApplicantIds.length} Selected
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Bulk Candidate Actions:
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={batchUpdating}
                    onClick={() => handleBatchStatusUpdate('Shortlisted')}
                  >
                    Shortlist ({selectedApplicantIds.length})
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={batchUpdating}
                    onClick={() => handleBatchStatusUpdate('Accepted')}
                  >
                    Offer Job ({selectedApplicantIds.length}) ✓
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={batchUpdating}
                    style={{ color: 'var(--accent-rose)' }}
                    onClick={() => handleBatchStatusUpdate('Rejected')}
                  >
                    Reject ({selectedApplicantIds.length})
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedApplicantIds([])}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onSelectAction={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default RecruiterDashboard;
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppSidebar from './AppSidebar';
import DriveDetailDrawer from './DriveDetailDrawer';
import CommandPalette from './CommandPalette';
import NotificationDrawer from './NotificationDrawer';
import PlacementAnalytics from './PlacementAnalytics';
import PlacementDossierModal from './PlacementDossierModal';
import { playClick, playSuccess } from '../utils/soundEngine';

const StudentDashboard = () => {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();

  const [eligibleJobs, setEligibleJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'applications' | 'scorecard' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [inspectingJob, setInspectingJob] = useState(null);

  // New Flagship States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const cleanBase = useMemo(() => (API_BASE_URL || '').replace(/\/+$/, ''), []);
  const isFetchingRef = useRef(false);

  // Fetch student profile, eligible drives, and applications
  const fetchStudentData = useCallback(async (isInitial = false) => {
    if (!token || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [jobsRes, appsRes, profileRes] = await Promise.allSettled([
        axios.get(`${cleanBase}/api/jobs/eligible`, { headers }),
        axios.get(`${cleanBase}/api/applications/my`, { headers }),
        axios.get(`${cleanBase}/api/students/profile`, { headers })
      ]);

      if (jobsRes.status === 'fulfilled') {
        const jobsData = jobsRes.value.data?.data;
        setEligibleJobs(Array.isArray(jobsData) ? jobsData : []);
      }

      if (appsRes.status === 'fulfilled') {
        const appsData = appsRes.value.data?.data;
        setMyApplications(Array.isArray(appsData) ? appsData : []);
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.data) {
        const pData = profileRes.value.data.data;
        if (pData.resume_url !== user?.resume_url || pData.cgpa !== user?.cgpa) {
          updateUser(pData);
        }
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
      showToast('Failed to sync dashboard data.', 'error');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [cleanBase, token, user?.resume_url, user?.cgpa, updateUser, showToast]);

  useEffect(() => {
    if (token) {
      fetchStudentData(true);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Apply
  const handleApply = async (jobId, jobTitle) => {
    playClick();
    setApplyingJobId(jobId);
    try {
      const res = await axios.post(
        `${cleanBase}/api/applications/apply`,
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      playSuccess();
      showToast(res.data?.message || `Successfully applied to ${jobTitle}!`, 'success');
      await fetchStudentData(false);
      setInspectingJob(null);
    } catch (err) {
      console.error('Apply error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit application.';
      showToast(errMsg, 'error', 4000);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Handle PDF Resume Upload
  const handleFileUpload = async (e) => {
    playClick();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are supported for resumes.', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5MB limit. Please upload a smaller PDF.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploadingResume(true);
    try {
      const res = await axios.post(`${cleanBase}/api/students/upload-resume`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUrl = res.data?.resume_url;
      updateUser({ resume_url: updatedUrl });
      playSuccess();
      showToast('PDF Resume uploaded and verified successfully!', 'success');
      fetchStudentData(false);
    } catch (err) {
      console.error('Resume upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error uploading resume.';
      showToast(errMsg, 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const getFullResumeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return eligibleJobs;
    const q = searchQuery.toLowerCase();
    return eligibleJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(q) ||
        job.company_name?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q)
    );
  }, [eligibleJobs, searchQuery]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const cgpa = user?.cgpa !== undefined && user?.cgpa !== null ? parseFloat(user.cgpa).toFixed(2) : '0.00';
    const totalEligible = eligibleJobs.length;
    const totalApplied = myApplications.length;
    const shortlistedCount = myApplications.filter((a) =>
      ['Shortlisted', 'Interviewing', 'Accepted'].includes(a.status)
    ).length;

    return { cgpa, totalEligible, totalApplied, shortlistedCount };
  }, [user, eligibleJobs, myApplications]);

  // ATS Placement Readiness Score
  const atsReadiness = useMemo(() => {
    const cgpaVal = parseFloat(user?.cgpa) || 0;
    const hasResume = Boolean(user?.resume_url);
    const score = Math.min(100, Math.round((cgpaVal / 10) * 75 + (hasResume ? 25 : 0)));
    const margin = (cgpaVal - 7.00).toFixed(2);
    return {
      score,
      margin: parseFloat(margin) >= 0 ? `+${margin}` : `${margin}`,
      hasResume
    };
  }, [user]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted': return 'badge-accepted';
      case 'Shortlisted': return 'badge-shortlisted';
      case 'Interviewing': return 'badge-interviewing';
      case 'Rejected': return 'badge-rejected';
      default: return 'badge-applied';
    }
  };

  const getTechTags = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('data')) return ['Python', 'SQL', 'Snowflake', 'Spark'];
    if (t.includes('frontend')) return ['React', 'TypeScript', 'Next.js'];
    if (t.includes('full stack')) return ['React', 'Node.js', 'PostgreSQL'];
    if (t.includes('analyst')) return ['PowerBI', 'Excel', 'Python'];
    return ['DSA', 'System Design', 'Cloud'];
  };

  return (
    <div className="app-layout">
      {/* Enterprise Left Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobCount={eligibleJobs.length}
        appCount={myApplications.length}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* Main Workbench */}
      <main className="app-main">
        {/* Top Global Command Header */}
        <header className="app-top-header">
          <div className="header-breadcrumbs">
            <span>Apex Placement</span>
            <span>/</span>
            <span>Student Portal</span>
            <span>/</span>
            <span className="breadcrumb-active">
              {activeTab === 'jobs' && 'Eligible Job Drives'}
              {activeTab === 'applications' && 'My Pipeline'}
              {activeTab === 'scorecard' && 'ATS Readiness'}
              {activeTab === 'analytics' && 'Campus Placement Analytics'}
            </span>
          </div>

          <div className="header-actions">
            <div className="header-status-pill">
              <span className="pulse-dot" />
              <span>Engine v2.4 Online</span>
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
                2
              </span>
            </button>

            <CommandPalette
              eligibleJobs={eligibleJobs}
              onSelectJob={(job) => {
                setInspectingJob(job);
                setActiveTab('jobs');
              }}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                playClick();
                fetchStudentData(false);
              }}
              disabled={refreshing}
            >
              {refreshing ? 'Syncing...' : '🔄 Sync'}
            </button>
          </div>
        </header>

        {/* Page Workspace Viewport */}
        <div className="page-workbench">
          {/* Executive Metrics HUD */}
          <div className="hud-grid">
            <div className="hud-card">
              <div className="hud-label">
                <span>Academic CGPA</span>
                <span>⭐</span>
              </div>
              <div className="hud-value">{metrics.cgpa}</div>
              <div className="hud-subtext">Verified Academic Index</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Eligible Drives</span>
                <span>💼</span>
              </div>
              <div className="hud-value">{metrics.totalEligible}</div>
              <div className="hud-subtext">Automated threshold matching</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Applications Filed</span>
                <span>📄</span>
              </div>
              <div className="hud-value">{metrics.totalApplied}</div>
              <div className="hud-subtext">Active campus submissions</div>
            </div>

            <div className="hud-card">
              <div className="hud-label">
                <span>Shortlisted / Offers</span>
                <span>🎯</span>
              </div>
              <div className="hud-value">{metrics.shortlistedCount}</div>
              <div className="hud-subtext">Progressed to interview rounds</div>
            </div>
          </div>

          {/* ATS Placement Readiness Banner */}
          <div className="scorecard-banner">
            <div className="scorecard-radial-container">
              <div className="scorecard-dial">
                <div className="scorecard-dial-inner">
                  <span className="scorecard-dial-num">{atsReadiness.score}</span>
                  <span className="scorecard-dial-unit">INDEX</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>ATS Placement Readiness Engine</h3>
                  <span className="badge badge-accepted">
                    Cutoff Margin: {atsReadiness.margin} CGPA
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {atsReadiness.hasResume
                    ? 'Your verified PDF credentials qualify you for 100% of standard campus recruitment rounds.'
                    : 'Upload your verified resume to reach a 100/100 ATS placement readiness score.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  playClick();
                  setIsDossierOpen(true);
                }}
              >
                🖨️ Official Dossier
              </button>

              {user?.resume_url ? (
                <a
                  href={getFullResumeUrl(user.resume_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  onClick={() => playClick()}
                >
                  👁️ Inspect PDF Resume
                </a>
              ) : (
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  Attach PDF Resume
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={uploadingResume}
                  />
                </label>
              )}
            </div>
          </div>

          {/* TAB 1: ELIGIBLE JOB DRIVES */}
          {activeTab === 'jobs' && (
            <div>
              {/* Search and Quick Filters */}
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search drives by role, company name, or technology (or press ⌘K)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {initialLoading ? (
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
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Scanning eligibility engine criteria...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '60px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No Matching Job Drives</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
                    {searchQuery
                      ? 'No active placement drives matched your search query.'
                      : `Currently there are no unexpired drives with minimum CGPA requirements at or below your score (${metrics.cgpa}).`}
                  </p>
                </div>
              ) : (
                <div className="drives-grid">
                  {filteredJobs.map((job) => {
                    const existingApp = myApplications.find((a) => a.job_id === job.id);
                    const hasApplied = Boolean(existingApp || job.has_applied);
                    const currentStatus = existingApp?.status || job.application_status || 'Applied';
                    const tags = getTechTags(job.title);

                    return (
                      <div
                        key={job.id}
                        className="drive-card-pro"
                        onClick={() => {
                          playClick();
                          setInspectingJob(job);
                        }}
                      >
                        <div>
                          <div className="drive-card-top">
                            <div className="company-logo-avatar">
                              {(job.company_name || 'C')[0]}
                            </div>
                            <div className="drive-info-title-box">
                              <div className="drive-company-name">{job.company_name}</div>
                              <h4 className="drive-title-text">{job.title}</h4>
                              <div className="drive-ctc-pill">₹14,00,000 - ₹22,00,000 / yr</div>
                            </div>
                          </div>

                          <p className="drive-desc-snippet">{job.description}</p>

                          <div className="drive-tags-cluster">
                            {tags.map((tag) => (
                              <span key={tag} className="tag-pill">{tag}</span>
                            ))}
                            <span className="tag-pill" style={{ color: 'var(--brand-primary)' }}>
                              Min CGPA: {parseFloat(job.min_cgpa).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="drive-card-footer">
                          <div className="drive-deadline-text">
                            <span>Deadline:</span>
                            <strong>{new Date(job.deadline).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}</strong>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                setInspectingJob(job);
                              }}
                            >
                              🤖 AI Coach
                            </button>

                            {hasApplied ? (
                              <span className={`badge ${getStatusBadgeClass(currentStatus)}`}>
                                ✓ {currentStatus}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApply(job.id, job.title);
                                }}
                                disabled={applyingJobId === job.id}
                              >
                                {applyingJobId === job.id ? 'Submitting...' : 'Apply →'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY APPLICATIONS */}
          {activeTab === 'applications' && (
            <div>
              {myApplications.length === 0 ? (
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '60px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📮</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No Applications Filed Yet</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                    Explore eligible placement drives and click "Apply Now" to start tracking your recruitment pipeline.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('jobs')}
                  >
                    Explore Job Drives
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {myApplications.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px 24px',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                            {app.company_name}
                          </div>
                          <h3 style={{ fontSize: '1.15rem', margin: '3px 0 6px 0' }}>{app.title}</h3>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            Applied on: <strong>{new Date(app.applied_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</strong>
                          </div>
                        </div>

                        <div>
                          <span className={`badge ${getStatusBadgeClass(app.status)}`} style={{ padding: '6px 14px', fontSize: '12px' }}>
                            ● {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Pipeline Progression */}
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Recruitment Stages:</span>
                        <span className="badge badge-applied">1. Applied</span> →
                        <span className={['Shortlisted', 'Interviewing', 'Accepted'].includes(app.status) ? 'badge badge-accepted' : 'badge'}>
                          2. Shortlisted
                        </span> →
                        <span className={['Interviewing', 'Accepted'].includes(app.status) ? 'badge badge-accepted' : 'badge'}>
                          3. Interviewing
                        </span> →
                        <span className={app.status === 'Accepted' ? 'badge badge-accepted' : (app.status === 'Rejected' ? 'badge badge-rejected' : 'badge')}>
                          4. {app.status === 'Accepted' ? 'Accepted Offer ✓' : (app.status === 'Rejected' ? 'Final Decision' : 'Final Round')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATS SCORECARD VIEW */}
          {activeTab === 'scorecard' && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Verified Placement Credentials & ATS Analysis</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Your comprehensive benchmark standing across campus recruitment criteria.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Standing</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '6px 0' }}>
                    {metrics.cgpa} / 10.00
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Clears minimum cutoff for 100% of campus hiring partners.
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PDF Documentation</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: user?.resume_url ? 'var(--brand-primary)' : 'var(--accent-amber)', margin: '6px 0' }}>
                    {user?.resume_url ? 'Active & Verified' : 'Action Required'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {user?.resume_url ? 'Ready for one-click recruiter inspection.' : 'Upload PDF resume to enable recruiter review.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAMPUS PLACEMENT ANALYTICS */}
          {activeTab === 'analytics' && <PlacementAnalytics />}
        </div>
      </main>

      {/* Slide-Over Detail Drawer with AI Interview Coach */}
      <DriveDetailDrawer
        job={inspectingJob}
        isOpen={Boolean(inspectingJob)}
        onClose={() => setInspectingJob(null)}
        onApply={handleApply}
        hasApplied={Boolean(myApplications.find((a) => a.job_id === inspectingJob?.id))}
        isApplying={applyingJobId === inspectingJob?.id}
        studentCgpa={metrics.cgpa}
      />

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onSelectAction={(tab) => setActiveTab(tab)}
      />

      {/* Official University Sealed Dossier Modal */}
      <PlacementDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        user={user}
      />
    </div>
  );
};

export default StudentDashboard;
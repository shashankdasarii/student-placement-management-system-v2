import React, { useState } from 'react';
import { playClick, playSuccess } from '../utils/soundEngine';

const DriveDetailDrawer = ({
  job = null,
  isOpen = false,
  onClose = () => {},
  onApply = () => {},
  hasApplied = false,
  isApplying = false,
  studentCgpa = '0.00'
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview'); // 'overview' | 'coach'
  const [checkedMilestones, setCheckedMilestones] = useState({});

  if (!isOpen || !job) return null;

  const minCgpa = parseFloat(job.min_cgpa || 0).toFixed(2);
  const studentCgpaVal = parseFloat(studentCgpa || 0).toFixed(2);
  const isCgpaQualified = parseFloat(studentCgpa) >= parseFloat(job.min_cgpa);

  // Generate realistic tech stack tags based on job title
  const getTechTags = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('data')) return ['Python', 'SQL', 'Snowflake', 'Apache Spark', 'Airflow'];
    if (t.includes('frontend')) return ['React 19', 'TypeScript', 'Tailwind', 'Next.js', 'Web Vitals'];
    if (t.includes('full stack')) return ['React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'];
    if (t.includes('analyst')) return ['PowerBI', 'Tableau', 'Excel Advanced', 'Python', 'Statistics'];
    return ['Data Structures', 'Algorithms', 'System Design', 'Java / C++', 'Cloud'];
  };

  const tags = getTechTags(job.title);

  // Curated Interview Coach Questions
  const getInterviewQuestions = (company = '', title = '') => {
    const c = company.toLowerCase();
    if (c.includes('google')) {
      return [
        { q: 'Given a directed graph, detect whether a cycle exists using Tarjan or Kahn’s algorithm.', cat: 'Algorithms (Hard)' },
        { q: 'Design Google Search autocomplete with millions of concurrent queries using a Trie and Redis cache.', cat: 'System Design' },
        { q: 'Explain how thread synchronization works in Linux and when to use lock-free data structures.', cat: 'Core CS' },
        { q: 'Describe a situation where you had to push back on a technical architectural decision with data.', cat: 'Googleyness & Fit' }
      ];
    }
    if (c.includes('amazon')) {
      return [
        { q: 'Implement an LRU Cache with O(1) get and put operations using doubly linked lists and hashmaps.', cat: 'DSA' },
        { q: 'Design an e-commerce flash sale order processing queue handling 100,000 TPS.', cat: 'System Architecture' },
        { q: 'How would you troubleshoot a memory leak in a production Node/Java cluster?', cat: 'Debugging & Ops' },
        { q: 'Give an example of when you showed Customer Obsession by challenging an existing process.', cat: 'Leadership Principle' }
      ];
    }
    return [
      { q: `Explain the end-to-end client-server architecture for a production ${title} system.`, cat: 'Architecture' },
      { q: 'Explain database indexing: Differences between B-Tree and Hash indexes, and how indexing impacts writes.', cat: 'Databases' },
      { q: 'What are closures and event loop phases, and how do you prevent race conditions in async code?', cat: 'Full Stack' },
      { q: 'Walk through your most complex academic or open-source software project from start to finish.', cat: 'Behavioral & Experience' }
    ];
  };

  const interviewQuestions = getInterviewQuestions(job.company_name, job.title);

  const prepMilestones = [
    { id: 'm1', label: 'Review core Data Structures: Trees, Graphs, Hash Tables' },
    { id: 'm2', label: 'Solve 2 Medium LeetCode problems related to company tag' },
    { id: 'm3', label: 'Draft 3 STAR behavioral stories for leadership assessment' },
    { id: 'm4', label: 'Inspect company tech stack & prepare 2 questions for interviewer' }
  ];

  const handleToggleMilestone = (id) => {
    playSuccess();
    setCheckedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="company-logo-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
              {(job.company_name || 'C')[0]}
            </div>
            <div>
              <div className="drive-company-name">{job.company_name}</div>
              <h2 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{job.title}</h2>
              <div className="drive-ctc-pill" style={{ marginTop: '4px' }}>
                ₹14,00,000 - ₹22,00,000 / yr (Full-time)
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              playClick();
              onClose();
            }}
            style={{ padding: '6px 10px', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>

        {/* Segmented View Switcher: Overview vs AI Coach */}
        <div style={{
          display: 'flex',
          padding: '12px 32px 0 32px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          gap: '8px'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${activeDrawerTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
            onClick={() => {
              playClick();
              setActiveDrawerTab('overview');
            }}
          >
            📋 Drive Specifications
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeDrawerTab === 'coach' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
            onClick={() => {
              playClick();
              setActiveDrawerTab('coach');
            }}
          >
            🤖 AI Interview Coach
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {activeDrawerTab === 'overview' ? (
            <>
              {/* Eligibility Audit Box */}
              <div style={{
                backgroundColor: isCgpaQualified ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)',
                border: `1px solid ${isCgpaQualified ? 'rgba(5, 150, 105, 0.2)' : 'rgba(225, 29, 72, 0.2)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: isCgpaQualified ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{isCgpaQualified ? '✓ Eligibility Confirmed' : '⚠ CGPA Below Cutoff'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Cutoff Requirement: <strong>{minCgpa} CGPA</strong> • Your Academic Index: <strong>{studentCgpaVal} CGPA</strong>
                  </div>
                </div>
                <span className={`badge ${isCgpaQualified ? 'badge-accepted' : 'badge-rejected'}`}>
                  {isCgpaQualified ? 'Qualified' : 'Ineligible'}
                </span>
              </div>

              {/* Hiring Timeline & Interview Rounds */}
              <div>
                <div className="drawer-section-title">Hiring Process & Rounds</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { round: 'Round 1', title: 'Resume & Portfolio Screening', desc: 'ATS criteria check and branch verification' },
                    { round: 'Round 2', title: 'Online Technical Assessment', desc: '90 mins: DSA, Problem Solving & Core CS Fundamentals' },
                    { round: 'Round 3', title: 'Technical Interview & System Architecture', desc: 'Live coding and technical deep dive' },
                    { round: 'Round 4', title: 'HR & Executive Leadership Fit', desc: 'Culture assessment and CTC offer discussion' }
                  ].map((r, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-indigo)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Description */}
              <div>
                <div className="drawer-section-title">Role Overview & Expectations</div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {job.description}
                </p>
              </div>

              {/* Skills Required */}
              <div>
                <div className="drawer-section-title">Target Technology Stack</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tags.map((tag) => (
                    <span key={tag} className="tag-pill" style={{ fontSize: '12px', padding: '5px 10px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Dates */}
              <div>
                <div className="drawer-section-title">Key Deadlines</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12.5px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Registration Closes:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginTop: '2px' }}>
                      {new Date(job.deadline).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Drive Venue:</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      Virtual & On-Campus
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* AI INTERVIEW COACH TAB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Coach Banner */}
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, var(--brand-indigo-light), transparent)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>🤖</span>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--brand-indigo)' }}>
                    Interview Intelligence for {job.company_name}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Curated interview question bank, algorithmic focus patterns, and preparation milestones tailored specifically to this role.
                </p>
              </div>

              {/* Technical Question Bank */}
              <div>
                <div className="drawer-section-title">High-Frequency Interview Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {interviewQuestions.map((qObj, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-indigo)', textTransform: 'uppercase' }}>
                          Question #{idx + 1}
                        </span>
                        <span className="tag-pill" style={{ fontSize: '10px' }}>{qObj.cat}</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        "{qObj.q}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Prep Checklist */}
              <div>
                <div className="drawer-section-title">Candidate Readiness Checklist</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prepMilestones.map((m) => {
                    const isDone = Boolean(checkedMilestones[m.id]);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(m.id)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: isDone ? 'var(--accent-emerald-light)' : 'var(--bg-surface-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isDone ? 'rgba(5, 150, 105, 0.3)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                        />
                        <span style={{
                          fontSize: '12.5px',
                          color: isDone ? 'var(--accent-emerald)' : 'var(--text-primary)',
                          fontWeight: isDone ? 700 : 500,
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Action Footer */}
        <div className="drawer-footer">
          {hasApplied ? (
            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }} disabled>
              ✓ Application Already Submitted
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              disabled={isApplying || !isCgpaQualified}
              onClick={() => {
                playClick();
                onApply(job.id, job.title);
              }}
            >
              {isApplying ? 'Submitting Application...' : 'Submit Official Application →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveDetailDrawer;

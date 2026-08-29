import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useToast } from '../context/ToastContext';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
import { playClick, playSuccess } from '../utils/soundEngine';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    branch: 'Computer Science',
    cgpa: '',
    company_name: ''
  });
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole) => {
    playClick();
    setRole(newRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must contain at least 6 characters.', 'warning');
      return;
    }

    if (role === 'student') {
      const cgpaNum = parseFloat(formData.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        showToast('CGPA must be a valid number between 0.00 and 10.00.', 'warning');
        return;
      }
    } else if (role === 'recruiter') {
      if (!formData.company_name.trim()) {
        showToast('Company/Organization name is mandatory.', 'warning');
        return;
      }
    }

    setLoading(true);

    try {
      const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        name: formData.name.trim() || formData.username.trim(),
        ...(role === 'student' && {
          branch: formData.branch,
          cgpa: parseFloat(formData.cgpa)
        }),
        ...(role === 'recruiter' && {
          company_name: formData.company_name.trim()
        })
      };

      const res = await axios.post(`${cleanBase}/api/auth/register`, payload);
      playSuccess();
      showToast(res.data?.message || 'Registration successful! You can now sign in.', 'success', 3000);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Account registration failed.';
      showToast(errMsg, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Showcase Hero */}
      <div className="auth-hero-pane">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>Apex Placement Cloud</div>
              <div className="auth-brand-sub">Enterprise Campus Recruitment Platform</div>
            </div>
          </div>

          <div style={{ maxWidth: '500px' }}>
            <div className="auth-infra-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', marginBottom: '16px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Join 1,200+ Campus Talent Partners</span>
            </div>

            <h1 className="text-gradient" style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.12, marginBottom: '16px', letterSpacing: '-0.04em' }}>
              Launch your campus recruitment journey.
            </h1>
            <p className="auth-hero-desc" style={{ fontSize: '15px', lineHeight: 1.6 }}>
              Join hundreds of engineering students and enterprise talent partners on the high-performance placement operating system.
            </p>
          </div>

          {/* Live Campus Activity Feed */}
          <div className="auth-activity-card">
            <div className="auth-activity-header">
              <span className="pulse-dot" />
              <span>Real-Time Campus Hiring Activity</span>
            </div>
            <div className="auth-activity-item">
              <span className="auth-company-tag">Google</span>
              <span className="auth-activity-desc">Issued 3 offers for SDE-1 (₹28.4 LPA)</span>
              <span className="auth-activity-time">Just now</span>
            </div>
            <div className="auth-activity-item">
              <span className="auth-company-tag">Microsoft</span>
              <span className="auth-activity-desc">Shortlisted 18 students (CGPA ≥ 8.00)</span>
              <span className="auth-activity-time">2m ago</span>
            </div>
            <div className="auth-activity-item">
              <span className="auth-company-tag">Amazon</span>
              <span className="auth-activity-desc">Published AWS Cloud Solutions drive</span>
              <span className="auth-activity-time">8m ago</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid on Hero */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '480px', marginBottom: '24px' }}>
            <div className="auth-stat-card">
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>98.4%</div>
              <div className="auth-stat-label" style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>Placement Conversion Rate</div>
            </div>
            <div className="auth-stat-card">
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>₹28.4 LPA</div>
              <div className="auth-stat-label" style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>Top Tier CTC Compensation</div>
            </div>
          </div>

          {/* Hiring Partners Pill Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partners:</span>
            {['Google', 'Microsoft', 'Amazon', 'Cisco', 'Goldman Sachs'].map((partner) => (
              <span key={partner} className="partner-tag-pill">{partner}</span>
            ))}
          </div>

          <div className="auth-cluster-status" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span>Instant Registration • Multi-Role Access • Enterprise Security</span>
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Create Account</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Join as a student candidate or recruiter
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <ThemeToggle />
              <SoundToggle />
            </div>
          </div>

          {/* Role Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '13px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: role === 'student' ? 'var(--brand-primary)' : 'transparent',
                color: role === 'student' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600
              }}
              onClick={() => handleRoleChange('student')}
            >
              🎓 Student Candidate
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '13px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: role === 'recruiter' ? 'var(--brand-primary)' : 'transparent',
                color: role === 'recruiter' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600
              }}
              onClick={() => handleRoleChange('recruiter')}
            >
              💼 Hiring Partner
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. jdoe"
                />
              </div>
              <div>
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-email">Institutional Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@university.edu"
              />
            </div>

            {role === 'student' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label htmlFor="reg-branch">Academic Branch</label>
                  <select
                    id="reg-branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Electronics & Comm.">Electronics & Comm.</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-cgpa">Current CGPA</label>
                  <input
                    id="reg-cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    required
                    value={formData.cgpa}
                    onChange={handleChange}
                    placeholder="8.50"
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="reg-company">Company / Organization</label>
                <input
                  id="reg-company"
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. TechCorp Solutions Inc."
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars"
                />
              </div>
              <div>
                <label htmlFor="reg-confirm">Confirm</label>
                <input
                  id="reg-confirm"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              {loading ? 'Creating Account...' : `Register as ${role === 'student' ? 'Student' : 'Recruiter'} →`}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

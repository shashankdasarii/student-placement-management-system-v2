import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
import { playClick, playSuccess } from '../utils/soundEngine';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleQuickFill = (demoUser, demoPass) => {
    playClick();
    setFormData({ username: demoUser, password: demoPass });
    showToast(`Quick-filled credentials for ${demoUser}`, 'info', 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      showToast('Please enter both username and password.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
      const res = await axios.post(`${cleanBase}/api/auth/login`, {
        username: formData.username.trim(),
        password: formData.password
      });

      const { token, user } = res.data;

      if (!token) {
        throw new Error('Authentication token not received.');
      }

      login(token, user);
      playSuccess();
      showToast(`Welcome back, ${user.name || user.username}!`, 'success', 2500);

      // Navigate based on role
      if (user.role === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter-dashboard', { replace: true });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Invalid username or password.';
      showToast(errMsg, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Showcase Hero (Enterprise Stripe / Linear style) */}
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
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Next-Gen Recruitment Infrastructure</span>
            </div>

            <h1 className="text-gradient" style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.12, marginBottom: '16px', letterSpacing: '-0.04em' }}>
              The modern infrastructure for campus hiring.
            </h1>
            <p className="auth-hero-desc" style={{ fontSize: '15px', lineHeight: 1.6 }}>
              Automated CGPA eligibility scanning, real-time recruiter pipelines, and verified digital dossiers built for premier engineering institutions.
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
            <span>Core Eligibility Engine v2.4 Active • Cloud Cluster Ready</span>
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Sign in</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Access student drives or recruiter management
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <ThemeToggle />
              <SoundToggle />
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '22px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              ⚡ One-Click Demo Logins
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('john_student', 'password123')}
              >
                🎓 Student Account
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('techcorp_hr', 'password123')}
              >
                💼 Recruiter Account
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="login-username">Username or Registration ID</label>
              <input
                id="login-username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. john_student"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            New to the campus placement system?{' '}
            <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
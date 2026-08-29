import React, { useState } from 'react';
import { playClick } from '../utils/soundEngine';

const PlacementAnalytics = () => {
  const [activeTier, setActiveTier] = useState(2); // index of hovered CTC node

  const ctcTiers = [
    { label: 'Tier 3 (Core)', range: '₹4.5 - ₹8 LPA', count: 184, pct: '48%', color: '#38bdf8' },
    { label: 'Tier 2 (Premier)', range: '₹8 - ₹16 LPA', count: 132, pct: '34%', color: '#818cf8' },
    { label: 'Tier 1 (Product)', range: '₹16 - ₹24 LPA', count: 48, pct: '12%', color: '#34d399' },
    { label: 'Super Dream', range: '₹24 - ₹32+ LPA', count: 22, pct: '6%', color: '#fbbf24' }
  ];

  const branchData = [
    { name: 'Computer Science & Eng.', placed: 94, total: 100, color: '#6366f1' },
    { name: 'Data Science & AI', placed: 92, total: 100, color: '#06b6d4' },
    { name: 'Information Technology', placed: 89, total: 100, color: '#10b981' },
    { name: 'Electronics & Comm.', placed: 81, total: 100, color: '#f59e0b' },
    { name: 'Mechanical & Civil', placed: 74, total: 100, color: '#8b5cf6' }
  ];

  const funnelStages = [
    { stage: 'Total Eligible Profiles', count: 386, pct: '100%', color: '#38bdf8' },
    { stage: 'Submitted Applications', count: 312, pct: '81%', color: '#818cf8' },
    { stage: 'Shortlisted for Online Test', count: 184, pct: '48%', color: '#c084fc' },
    { stage: 'Advanced to Technical Interview', count: 96, pct: '25%', color: '#f472b6' },
    { stage: 'Official CTC Offers Extended', count: 68, pct: '18%', color: '#34d399' }
  ];

  return (
    <div className="analytics-workbench">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Campus Placement Analytics Engine</h2>
          <span className="badge badge-accepted">Live Batch 2026</span>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Real-time institutional recruitment intelligence, compensation distribution, and conversion metrics.
        </p>
      </div>

      {/* Top 3 Analytical KPI Highlights */}
      <div className="hud-grid" style={{ marginBottom: '28px' }}>
        <div className="hud-card">
          <div className="hud-label">
            <span>Average Campus CTC</span>
            <span>📈</span>
          </div>
          <div className="hud-value" style={{ color: 'var(--brand-indigo)' }}>₹14.6 LPA</div>
          <div className="hud-subtext">+18.2% vs previous academic year</div>
        </div>

        <div className="hud-card">
          <div className="hud-label">
            <span>Overall Clearance Rate</span>
            <span>🎯</span>
          </div>
          <div className="hud-value" style={{ color: 'var(--accent-emerald)' }}>91.4%</div>
          <div className="hud-subtext">352 of 386 registered students placed</div>
        </div>

        <div className="hud-card">
          <div className="hud-label">
            <span>Highest Tier-1 Package</span>
            <span>⚡</span>
          </div>
          <div className="hud-value" style={{ color: 'var(--accent-amber)' }}>₹28.4 LPA</div>
          <div className="hud-subtext">Offered by Google Cloud Systems</div>
        </div>
      </div>

      {/* Grid: CTC Distribution Curve & Branch Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* CHART 1: Interactive SVG CTC Distribution Curve */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>CTC Compensation Curve</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Package distribution across percentiles</div>
            </div>
            <span className="badge badge-applied">Interactive SVG</span>
          </div>

          {/* SVG Area & Nodes Chart */}
          <div style={{ width: '100%', height: '180px', position: 'relative', marginTop: '10px' }}>
            <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="ctcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-indigo)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--brand-indigo)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="130" x2="380" y2="130" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="20" y1="80" x2="380" y2="80" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="20" y1="30" x2="380" y2="30" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3" />

              {/* Area fill */}
              <path
                d="M 20,130 C 70,120 120,40 170,50 C 230,60 280,100 380,125 L 380,130 L 20,130 Z"
                fill="url(#ctcGradient)"
              />

              {/* Curve Line */}
              <path
                d="M 20,130 C 70,120 120,40 170,50 C 230,60 280,100 380,125"
                fill="none"
                stroke="var(--brand-indigo)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Interactive Nodes */}
              {[
                { cx: 70, cy: 110, tierIdx: 0 },
                { cx: 170, cy: 50, tierIdx: 1 },
                { cx: 270, cy: 95, tierIdx: 2 },
                { cx: 350, cy: 120, tierIdx: 3 }
              ].map((node, i) => (
                <g key={i} style={{ cursor: 'pointer' }} onClick={() => { playClick(); setActiveTier(node.tierIdx); }}>
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={activeTier === node.tierIdx ? 7 : 5}
                    fill={activeTier === node.tierIdx ? '#ffffff' : 'var(--brand-indigo)'}
                    stroke="var(--brand-indigo)"
                    strokeWidth={activeTier === node.tierIdx ? 3 : 2}
                  />
                  {activeTier === node.tierIdx && (
                    <circle cx={node.cx} cy={node.cy} r="12" fill="none" stroke="var(--brand-indigo)" strokeWidth="1.5" opacity="0.5" />
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Tier Detail Card */}
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: ctcTiers[activeTier].color }}>
                {ctcTiers[activeTier].label}
              </span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {ctcTiers[activeTier].range}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: ctcTiers[activeTier].color }}>
                {ctcTiers[activeTier].count} Offers
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {ctcTiers[activeTier].pct} of cohort
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Department Placement Rates */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Department Placement Ratio</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Conversion index by academic discipline</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {branchData.map((b) => (
              <div key={b.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: b.color }}>{b.placed}%</span>
                </div>
                <div style={{
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: `${b.placed}%`,
                    height: '100%',
                    backgroundColor: b.color,
                    borderRadius: '9999px',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART 3: Recruitment Funnel Progression */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '26px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Campus Recruitment Conversion Funnel</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Step-by-step applicant progression across interview rounds</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {funnelStages.map((f, i) => (
            <div
              key={f.stage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 18px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: f.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                flexShrink: 0
              }}>
                {i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{f.stage}</div>
                <div style={{
                  marginTop: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
                  <div style={{ width: f.pct, height: '100%', backgroundColor: f.color, borderRadius: '9999px' }} />
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '15px', color: f.color }}>
                  {f.count}
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.pct}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlacementAnalytics;

import React from 'react';
import { playClick } from '../utils/soundEngine';

const PlacementDossierModal = ({ isOpen = false, onClose = () => {}, user = null }) => {
  if (!isOpen || !user) return null;

  const cgpaVal = parseFloat(user.cgpa || 0).toFixed(2);
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    playClick();
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel print-dossier-panel"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="modal-header no-print">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-indigo)', letterSpacing: '0.06em' }}>
              Official University Documentation
            </div>
            <h3 style={{ margin: '2px 0' }}>Placement Clearance Dossier</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              🖨️ Print Official Dossier
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="modal-body print-dossier-content" style={{ padding: '36px 44px' }}>
          {/* Institutional Letterhead */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--border-medium)',
            paddingBottom: '20px',
            marginBottom: '24px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
                  APEX INSTITUTE OF TECHNOLOGY
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                CENTRAL CORPORATE RELATIONS & PLACEMENT CELL • ACCREDITATION GRADE A++
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-accepted" style={{ fontSize: '11px', padding: '4px 10px' }}>
                OFFICIALLY VERIFIED
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                REF: APEX-2026-X892
              </div>
            </div>
          </div>

          {/* Student Dossier Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Candidate Full Name
              </span>
              <div style={{ fontWeight: 800, fontSize: '15px', marginTop: '2px', color: 'var(--text-primary)' }}>
                {user.name || user.username}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Roll ID / Registration
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                {user.username}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Discipline & Department
              </span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                {user.branch || 'Computer Science'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Verified Academic CGPA
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                {cgpaVal} / 10.00
              </div>
            </div>
          </div>

          {/* Clearance Audit Check */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Statutory Placement Clearances
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { title: 'Academic Minimum Index Threshold', status: 'CLEARED (CGPA ≥ 7.00)', ok: true },
                { title: 'Active Academic Standing', status: '0 ACTIVE BACKLOGS', ok: true },
                { title: 'Digital PDF Resume Credentials', status: user.resume_url ? 'VERIFIED & ARCHIVED' : 'PENDING UPLOAD', ok: Boolean(user.resume_url) },
                { title: 'Departmental Conduct Clearance', status: 'IN GOOD STANDING', ok: true }
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{c.title}</span>
                  <span className={`badge ${c.ok ? 'badge-accepted' : 'badge-rejected'}`} style={{ fontSize: '10px' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Authorization Statement */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--brand-indigo-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            marginBottom: '28px',
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: 'var(--text-secondary)'
          }}>
            <strong>Placement Officer Endorsement:</strong> This digital dossier certifies that the aforementioned candidate is verified and officially authorized by Apex Institute of Technology to participate in campus recruitment interview rounds, technical assessments, and employment contract offers for Batch 2026.
          </div>

          {/* Signatures & Seal Block */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date of Verification</div>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{currentDate}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                HASH: SHA256-4b82e1c8
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px dashed var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 6px auto',
                fontSize: '22px'
              }}>
                🏛️
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>
                Official University Seal
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ width: '140px', borderBottom: '1px solid var(--text-muted)', marginBottom: '4px' }} />
              <div style={{ fontWeight: 800, fontSize: '12.5px' }}>Dr. R. K. Mukherjee</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dean, Corporate Relations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementDossierModal;

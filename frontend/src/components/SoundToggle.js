import React, { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled, playSwitch } from '../utils/soundEngine';

const SoundToggle = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playSwitch();
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-sm ${className}`}
      onClick={handleToggle}
      title={enabled ? 'Mute physical sound haptics' : 'Enable physical sound haptics'}
      aria-label="Toggle haptic audio"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 700,
        padding: '6px 14px'
      }}
    >
      <span style={{ fontSize: '13px' }}>{enabled ? '🔊' : '🔇'}</span>
      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {enabled ? 'Audio On' : 'Muted'}
      </span>
    </button>
  );
};

export default SoundToggle;

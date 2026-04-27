import React from 'react';
import { useTranslation } from 'react-i18next';

const CFG = {
  5: { key: 'critical', bg: 'rgba(226,75,74,0.12)', color: '#E24B4A', pulse: true },
  4: { key: 'high', bg: 'rgba(239,159,39,0.12)', color: '#EF9F27', pulse: false },
  3: { key: 'medium', bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', pulse: false },
  2: { key: 'low', bg: 'rgba(29,158,117,0.12)', color: '#1D9E75', pulse: false },
  1: { key: 'minimal', bg: 'rgba(107,114,128,0.12)', color: '#6B7280', pulse: false },
};

export default function UrgencyBadge({ score, size = 'sm' }) {
  const { t } = useTranslation();
  const cfg = CFG[score] || CFG[3];

  return (
    <span
      className={cfg.pulse ? 'badge-critical' : ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'lg' ? '5px 12px' : '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: size === 'lg' ? 13 : 11,
        fontWeight: 700, fontFamily: "'Inter',sans-serif",
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.color}40`, flexShrink: 0,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {t(`urgency.${cfg.key}`, { defaultValue: cfg.key.charAt(0).toUpperCase() + cfg.key.slice(1) })}
    </span>
  );
}

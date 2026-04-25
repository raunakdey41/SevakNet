import React from 'react';
import { getUrgencyTier, getUrgencyColour, formatScore, categoryIcon, timeAgo, deadlineLabel } from '../utils/urgency';

export default function TaskCard({ task, onFindVolunteers, onSelect, isSelected }) {
  const tier    = getUrgencyTier(task.urgency_score);
  const colour  = getUrgencyColour(task.urgency_score);
  const dl      = deadlineLabel(task.deadline);

  return (
    <div
      className={`card-${tier} animate-fade-up`}
      onClick={() => onSelect && onSelect(task)}
      style={{
        background: isSelected ? '#1c2230' : '#161b22',
        border: `1px solid ${isSelected ? colour.bg : '#21262d'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left urgency stripe */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: colour.bg,
        borderRadius: '10px 0 0 10px',
      }} />

      <div style={{ marginLeft: 8 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{categoryIcon(task.category)}</span>
            <span
              className={tier === 'critical' ? 'badge-critical' : ''}
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: colour.bg,
                background: `${colour.bg}1a`,
                border: `1px solid ${colour.bg}44`,
                borderRadius: 4,
                padding: '2px 7px',
              }}
            >
              {tier}
            </span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 600,
            color: colour.bg,
          }}>
            {formatScore(task.urgency_score)}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: '#f0f6fc',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {task.title}
        </div>

        {/* Location + Skill */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#8b949e' }}>
            📍 {task.ward_name}, {task.block}
          </span>
          {task.skill_required && (
            <span style={{ fontSize: 12, color: '#8b949e' }}>
              🔧 {task.skill_required}
            </span>
          )}
          {task.distance_km != null && (
            <span style={{ fontSize: 12, color: '#8b949e' }}>
              📏 {Number(task.distance_km).toFixed(1)} km
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#484f58' }}>
              {timeAgo(task.reported_at || task.deadline)}
            </span>
            {dl && (
              <span style={{ fontSize: 11, color: dl.color, fontWeight: 600 }}>
                ⏱ {dl.label}
              </span>
            )}
          </div>

          {onFindVolunteers && (
            <button
              onClick={(e) => { e.stopPropagation(); onFindVolunteers(task); }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#0f1117',
                background: '#00D2B4',
                border: 'none',
                borderRadius: 5,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.03em',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.target.style.background = '#00a98f'}
              onMouseLeave={(e) => e.target.style.background = '#00D2B4'}
            >
              Find Volunteers →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

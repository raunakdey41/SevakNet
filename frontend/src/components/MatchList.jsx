import React, { useEffect, useState } from 'react';
import { getTaskMatches, createAssignment } from '../api/client';
import { getUrgencyColour, formatScore, categoryIcon } from '../utils/urgency';
import toast from 'react-hot-toast';

function SkillBadge({ skill, required }) {
  const matched = skill?.toLowerCase() === required?.toLowerCase();
  return (
    <span style={{
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 4,
      background: matched ? 'rgba(0,210,180,0.12)' : 'rgba(255,255,255,0.05)',
      color: matched ? '#00D2B4' : '#8b949e',
      border: `1px solid ${matched ? 'rgba(0,210,180,0.3)' : '#21262d'}`,
      fontWeight: matched ? 600 : 400,
    }}>
      {skill}
      {matched && ' ✓'}
    </span>
  );
}

function ScoreBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 5, background: '#21262d', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.round(score * 100)}%`,
          background: score >= 0.8 ? '#00D2B4' : score >= 0.6 ? '#eab308' : '#f97316',
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 600,
        color: score >= 0.8 ? '#00D2B4' : score >= 0.6 ? '#eab308' : '#f97316',
        minWidth: 36,
      }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

export default function MatchList({ task, onClose, onAssigned }) {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    if (!task) return;
    setLoading(true);
    getTaskMatches(task.id)
      .then(setMatches)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [task?.id]);

  const handleAssign = async (volunteer) => {
    setAssigning(volunteer.id);
    try {
      await createAssignment({
        task_id: task.id,
        volunteer_id: volunteer.id,
        match_score: volunteer.match_score,
      });
      toast.success(`✅ ${volunteer.name} assigned to task`);
      onAssigned && onAssigned(task.id);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssigning(null);
    }
  };

  if (!task) return null;
  const colour = getUrgencyColour(task.urgency_score);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-fade-up"
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 14,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 22px 16px',
          borderBottom: '1px solid #21262d',
          background: '#1c2230',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{categoryIcon(task.category)}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: colour.bg,
                  background: `${colour.bg}1a`,
                  border: `1px solid ${colour.bg}44`,
                  borderRadius: 4,
                  padding: '2px 7px',
                }}>
                  Score: {formatScore(task.urgency_score)}
                </span>
              </div>
              <h2 style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#f0f6fc',
              }}>
                Volunteer Matches
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b949e' }}>
                {task.title} · {task.ward_name}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #21262d',
                borderRadius: 6,
                color: '#8b949e',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
              <div style={{ fontSize: 24, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
              Calculating match scores…
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#f0f6fc', marginBottom: 6 }}>No matches found</div>
              <div style={{ fontSize: 13 }}>No active volunteers meet the 0.5 threshold for this task.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {matches.map((vol, idx) => (
                <div
                  key={vol.id}
                  style={{
                    background: '#0f1117',
                    border: '1px solid #21262d',
                    borderRadius: 10,
                    padding: '14px 16px',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#30363d'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#21262d'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg, #00D2B4, #0099cc)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#0f1117',
                        flexShrink: 0,
                      }}>
                        {vol.name?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f6fc' }}>
                          #{idx + 1} {vol.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#8b949e' }}>
                          {vol.ward_name || 'Unknown area'} · {vol.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <ScoreBar score={vol.match_score} />

                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(vol.skills || []).map((sk) => (
                      <SkillBadge key={sk} skill={sk} required={task.skill_required} />
                    ))}
                  </div>

                  {vol.availability?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#8b949e' }}>
                      🕐 {vol.availability.join(', ')}
                    </div>
                  )}

                  <button
                    disabled={!!assigning}
                    onClick={() => handleAssign(vol)}
                    style={{
                      marginTop: 12,
                      width: '100%',
                      padding: '8px 0',
                      background: assigning === vol.id ? '#00a98f' : '#00D2B4',
                      color: '#0f1117',
                      border: 'none',
                      borderRadius: 7,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: assigning ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.03em',
                      transition: 'background 0.15s, opacity 0.15s',
                      opacity: assigning && assigning !== vol.id ? 0.4 : 1,
                    }}
                  >
                    {assigning === vol.id ? 'Assigning…' : 'Assign This Volunteer'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

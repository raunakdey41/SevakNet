import React, { useEffect, useState, useCallback } from 'react';
import { getNearbyTasks, createAssignment } from '../api/client';
import { getUrgencyColour, getUrgencyTier, formatScore, categoryIcon, deadlineLabel, timeAgo } from '../utils/urgency';
import toast from 'react-hot-toast';

// Default to South 24 Parganas centroid if geolocation unavailable
const DEFAULT_COORDS = { lat: 22.49, lng: 88.18 };

function UrgencyBadge({ score }) {
  const tier   = getUrgencyTier(score);
  const colour = getUrgencyColour(score);
  return (
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
        padding: '2px 8px',
      }}
    >
      {tier}
    </span>
  );
}

function TaskFeedCard({ task, onAccept, accepting }) {
  const tier   = getUrgencyTier(task.urgency_score);
  const colour = getUrgencyColour(task.urgency_score);
  const dl     = deadlineLabel(task.deadline);

  return (
    <div
      className={`card-${tier}`}
      style={{
        background: '#161b22',
        border: `1px solid #21262d`,
        borderRadius: 12,
        padding: '18px 20px',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = colour.bg + '66'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#21262d'; }}
    >
      {/* Left urgency stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${colour.bg}, ${colour.bg}88)`,
        borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ marginLeft: 12 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{categoryIcon(task.category)}</span>
            <UrgencyBadge score={task.urgency_score} />
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
            color: colour.bg,
          }}>
            {formatScore(task.urgency_score)}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 6px 0',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: '#f0f6fc',
          lineHeight: 1.3,
        }}>
          {task.title}
        </h3>

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#8b949e' }}>
            📍 {task.ward_name}, {task.block}
          </span>
          {task.distance_km != null && (
            <span style={{ fontSize: 13, color: '#8b949e' }}>
              📏 {Number(task.distance_km).toFixed(1)} km away
            </span>
          )}
          {task.skill_required && (
            <span style={{
              fontSize: 12,
              padding: '2px 9px',
              background: 'rgba(0,210,180,0.08)',
              border: '1px solid rgba(0,210,180,0.2)',
              borderRadius: 4,
              color: '#00D2B4',
              fontWeight: 500,
            }}>
              🔧 {task.skill_required}
            </span>
          )}
        </div>

        {/* Deadline + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#484f58' }}>
            Reported {timeAgo(task.reported_at)}
          </span>
          {dl && (
            <span style={{ fontSize: 12, fontWeight: 600, color: dl.color }}>
              ⏱ {dl.label}
            </span>
          )}
        </div>

        {/* Accept button */}
        <button
          disabled={!!accepting || task.status !== 'open'}
          onClick={() => onAccept(task)}
          style={{
            width: '100%',
            padding: '10px 0',
            background: task.status !== 'open'
              ? '#21262d'
              : accepting === task.id
              ? '#00a98f'
              : `linear-gradient(90deg, ${colour.bg}, ${colour.bg}cc)`,
            color: task.status !== 'open' ? '#484f58' : '#0f1117',
            border: 'none',
            borderRadius: 8,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: task.status !== 'open' || accepting ? 'not-allowed' : 'pointer',
            letterSpacing: '0.03em',
            transition: 'all 0.15s',
          }}
        >
          {task.status !== 'open'
            ? `Task ${task.status}`
            : accepting === task.id
            ? '⟳ Accepting…'
            : 'Accept Task →'}
        </button>
      </div>
    </div>
  );
}

export default function VolunteerView() {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [coords, setCoords]       = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [radius, setRadius]       = useState(10);
  const [volunteerId]             = useState(() => localStorage.getItem('sevaknet_vol_id') || '');

  const loadCoords = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()    => setCoords(DEFAULT_COORDS)
      );
    } else {
      setCoords(DEFAULT_COORDS);
    }
  }, []);

  useEffect(() => { loadCoords(); }, [loadCoords]);

  const fetchTasks = useCallback(() => {
    if (!coords) return;
    setLoading(true);
    getNearbyTasks(coords.lat, coords.lng, radius)
      .then((t) => { setTasks(t); setLoading(false); })
      .catch((err) => { toast.error(err.message); setLoading(false); });
  }, [coords, radius]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAccept = async (task) => {
    if (!volunteerId) {
      toast.error('Set your volunteer ID in localStorage: sevaknet_vol_id');
      return;
    }
    setAccepting(task.id);
    try {
      await createAssignment({ task_id: task.id, volunteer_id: volunteerId });
      toast.success(`✅ You've accepted: ${task.title}`);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'assigned' } : t));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAccepting(null);
    }
  };

  const openCount = tasks.filter((t) => t.status === 'open').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', padding: '0 0 60px 0' }}>

      {/* Header */}
      <div style={{
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        padding: '20px 24px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h1 style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#f0f6fc',
              }}>
                Nearby Tasks
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#8b949e' }}>
                {coords
                  ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} · ${openCount} open within ${radius} km`
                  : 'Locating…'}
              </p>
            </div>
            <button
              onClick={fetchTasks}
              disabled={loading}
              style={{
                background: 'none',
                border: '1px solid #21262d',
                borderRadius: 7,
                color: loading ? '#484f58' : '#00D2B4',
                padding: '6px 14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
              }}
            >
              {loading ? '⟳' : '↺'} Refresh
            </button>
          </div>

          {/* Radius filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#8b949e', whiteSpace: 'nowrap' }}>Search radius:</span>
            <input
              type="range" min="2" max="30" step="1"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#00D2B4' }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 600,
              color: '#00D2B4',
              minWidth: 42,
            }}>
              {radius} km
            </span>
          </div>
        </div>
      </div>

      {/* Task feed */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b949e' }}>
            <div style={{
              width: 40, height: 40, margin: '0 auto 16px',
              border: '3px solid #21262d', borderTopColor: '#00D2B4',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Scanning nearby tasks…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b949e' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#f0f6fc', fontSize: 18, marginBottom: 8 }}>
              No tasks nearby
            </div>
            <div style={{ fontSize: 14 }}>Try increasing the search radius.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tasks.map((task) => (
              <TaskFeedCard
                key={task.id}
                task={task}
                onAccept={handleAccept}
                accepting={accepting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { getDashboard } from '../api/client';
import MapView from '../components/MapView';
import TaskCard from '../components/TaskCard';
import MatchList from '../components/MatchList';
import { getUrgencyColour } from '../utils/urgency';
import toast from 'react-hot-toast';

const TIER_ORDER = ['critical', 'high', 'medium', 'low'];

const STAT_CONFIGS = [
  { key: 'critical', label: 'Critical',   icon: '🔴', tier: 'critical' },
  { key: 'high',     label: 'High',       icon: '🟠', tier: 'high' },
  { key: 'medium',   label: 'Medium',     icon: '🟡', tier: 'medium' },
  { key: 'low',      label: 'Low',        icon: '🟢', tier: 'low' },
];

function StatPill({ icon, label, count, tier, active, onClick }) {
  const colour = getUrgencyColour(tier === 'critical' ? 20 : tier === 'high' ? 14 : tier === 'medium' ? 8 : 2);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: active ? `${colour.bg}18` : '#161b22',
        border: `1px solid ${active ? colour.bg : '#21262d'}`,
        borderRadius: 8,
        padding: '8px 14px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        color: '#f0f6fc',
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>{label}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: 14,
        color: colour.bg,
        minWidth: 20,
        textAlign: 'right',
      }}>{count}</span>
    </button>
  );
}

export default function Dashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matchTask, setMatchTask]     = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchDashboard = useCallback(() => {
    getDashboard()
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { toast.error(err.message); setLoading(false); });
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Poll every 30s
  useEffect(() => {
    const id = setInterval(fetchDashboard, 30000);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  const allTasks = data
    ? TIER_ORDER.flatMap((t) => data[t] || [])
    : [];

  const visibleTasks = selectedTier
    ? (data?.[selectedTier] || [])
    : allTasks;

  const handleAssigned = (taskId) => {
    fetchDashboard();
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f1117', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid #21262d',
          borderTopColor: '#00D2B4',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#8b949e', fontFamily: "'Space Grotesk', sans-serif" }}>
          Loading operations…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Map — full background */}
      <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
        <MapView
          tasks={allTasks}
          onTaskClick={setSelectedTask}
          selectedTaskId={selectedTask?.id}
        />

        {/* Floating top bar */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: sidebarOpen ? 380 : 16,
          zIndex: 800,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          {/* Summary stats */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            background: 'rgba(15,17,23,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #21262d',
            borderRadius: 10,
            padding: '8px 12px',
          }}>
            {STAT_CONFIGS.map((s) => (
              <StatPill
                key={s.key}
                icon={s.icon}
                label={s.label}
                tier={s.tier}
                count={(data?.[s.key] || []).length}
                active={selectedTier === s.key}
                onClick={() => setSelectedTier(selectedTier === s.key ? null : s.key)}
              />
            ))}
          </div>

          {data?.summary && (
            <div style={{
              background: 'rgba(15,17,23,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #21262d',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              color: '#8b949e',
              display: 'flex', gap: 14,
            }}>
              <span>
                <span style={{ color: '#00D2B4', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.summary.total}
                </span> open
              </span>
              <span>
                <span style={{ color: '#f0f6fc', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.summary.assigned}
                </span> assigned
              </span>
            </div>
          )}
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute', right: sidebarOpen ? 364 : 12, top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 801,
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 6,
            color: '#8b949e',
            width: 22,
            height: 48,
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'right 0.3s ease',
          }}
        >
          {sidebarOpen ? '›' : '‹'}
        </button>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="animate-slide-in"
          style={{
            width: 360,
            flexShrink: 0,
            background: '#0f1117',
            borderLeft: '1px solid #21262d',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          {/* Sidebar header */}
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid #21262d',
            background: '#161b22',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00D2B4',
                boxShadow: '0 0 8px #00D2B4',
                animation: 'criticalPulse 2s ease-in-out infinite',
              }} />
              <h1 style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: '#f0f6fc',
                letterSpacing: '0.02em',
              }}>
                ACTIVE TASKS
              </h1>
              <span style={{
                marginLeft: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#484f58',
              }}>
                {visibleTasks.length} {selectedTier ? `· ${selectedTier}` : ''}
              </span>
            </div>
          </div>

          {/* Task list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <div style={{ fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>
                  {selectedTier ? `No ${selectedTier} tasks` : 'No open tasks'}
                </div>
                <div style={{ fontSize: 13 }}>All clear in this tier.</div>
              </div>
            ) : (
              visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onFindVolunteers={setMatchTask}
                  onSelect={setSelectedTask}
                  isSelected={selectedTask?.id === task.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Match modal */}
      {matchTask && (
        <MatchList
          task={matchTask}
          onClose={() => setMatchTask(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}

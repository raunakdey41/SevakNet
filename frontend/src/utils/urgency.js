export const URGENCY_COLOURS = {
  critical: { bg: '#ef4444', text: '#fef2f2', border: '#ef4444', glow: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
  high:     { bg: '#f97316', text: '#fff7ed', border: '#f97316', glow: 'rgba(249,115,22,0.3)', dot: '#f97316' },
  medium:   { bg: '#eab308', text: '#fefce8', border: '#eab308', glow: 'rgba(234,179,8,0.3)',  dot: '#eab308' },
  low:      { bg: '#22c55e', text: '#f0fdf4', border: '#22c55e', glow: 'rgba(34,197,94,0.3)',  dot: '#22c55e' },
};

export function getUrgencyTier(score) {
  if (score >= 18) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6)  return 'medium';
  return 'low';
}

export function getUrgencyColour(score) {
  return URGENCY_COLOURS[getUrgencyTier(score)];
}

export function getUrgencyEmoji(score) {
  const tier = getUrgencyTier(score);
  return { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[tier];
}

export function formatScore(score) {
  return typeof score === 'number' ? score.toFixed(1) : '—';
}

export function categoryIcon(category) {
  return {
    medical:   '🏥',
    food:      '🌾',
    water:     '💧',
    shelter:   '🏚',
    education: '📚',
  }[category] ?? '📋';
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function deadlineLabel(deadlineStr) {
  if (!deadlineStr) return null;
  const diff = new Date(deadlineStr).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 0)    return { label: 'Overdue', color: '#ef4444' };
  if (hours < 6)    return { label: `${hours}h left`, color: '#ef4444' };
  if (hours < 24)   return { label: `${hours}h left`, color: '#f97316' };
  const days = Math.floor(hours / 24);
  return { label: `${days}d left`, color: '#8b949e' };
}

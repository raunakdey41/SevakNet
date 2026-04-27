import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UrgencyBadge from './UrgencyBadge';
import CategoryChip from './CategoryChip';

const BORDER = { 5: '#E24B4A', 4: '#EF9F27', 3: '#F59E0B', 2: '#1D9E75', 1: '#9CA3AF' };

export default function TaskCard({ task, onFindVolunteers, onClick, compact = false }) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="card"
      style={{ padding: compact ? 16 : 20, borderLeft: `4px solid ${BORDER[Math.ceil(task.urgency_score / 20)] || 'var(--color-border)'}`, cursor: onClick ? 'pointer' : 'default', marginBottom: 12 }}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <UrgencyBadge score={Math.ceil(task.urgency_score / 20)} />
          <CategoryChip category={task.category} />
        </div>
        {onClick && <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 2 }} />}
      </div>
      <h4 style={{ fontSize: compact ? 13 : 15, fontWeight: 600, marginBottom: compact ? 6 : 10, lineHeight: 1.3 }}>{task.title}</h4>
      {!compact && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>
        {task.description?.length > 110 ? task.description.slice(0, 110) + '…' : task.description}
      </p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
          <MapPin size={11} /> {task.ward_name}
        </span>
        {task.affected_people && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
          <Users size={11} /> {t('common.peopleAffectedCount', { count: task.affected_people, defaultValue: `${task.affected_people} affected` })}
        </span>}
        {task.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
          <Clock size={11} /> {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>}
        {task.status && <span className={`status-${task.status}`} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
          {t(`ngoDashboard.${task.status}`, { defaultValue: task.status.charAt(0).toUpperCase() + task.status.slice(1) })}
        </span>}
      </div>
      {onFindVolunteers && (
        <button className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: 13, width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={e => { e.stopPropagation(); onFindVolunteers(task); }}>
          {t('ngoDashboard.volunteerMatches')}
        </button>
      )}
    </motion.div>
  );
}

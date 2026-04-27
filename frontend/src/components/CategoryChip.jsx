import React from 'react';
import { categoryConfig } from '../data/mockData';

export default function CategoryChip({ category, size = 'sm' }) {
  const cfg = categoryConfig[category] || categoryConfig['Other'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: size==='lg' ? '5px 12px' : '3px 8px',
      borderRadius:'var(--radius-pill)',
      fontSize: size==='lg' ? 13 : 11,
      fontWeight:600, fontFamily:"'Inter',sans-serif",
      background:cfg.bg, color:cfg.color,
    }}>
      <span style={{fontSize: size==='lg'?13:11}}>{cfg.icon}</span>
      {category}
    </span>
  );
}

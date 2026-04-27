import React, { useState } from 'react';
import { LayoutDashboard, Map, ListChecks, FileText, Inbox, Users, BarChart2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import SevakNetLogo from './SevakNetLogo';

const NAV = (t) => [
  { id: 'overview', icon: LayoutDashboard, label: t('sidebar.dashboard') },
  { id: 'map', icon: Map, label: t('sidebar.mapView') },
  { id: 'tasks', icon: ListChecks, label: t('sidebar.tasks') },
  { id: 'reports', icon: FileText, label: t('sidebar.fieldReports') },
  { id: 'inbox', icon: Inbox, label: t('sidebar.citizenInbox'), badge: 3 },
  { id: 'volunteers', icon: Users, label: t('sidebar.volunteers') },
  { id: 'analytics', icon: BarChart2, label: t('sidebar.analytics') },
  { id: 'settings', icon: Settings, label: t('sidebar.settings') },
];

export default function Sidebar({ activeView, onViewChange }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo area */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', minHeight: 64 }}>
        {collapsed ? (
          <div style={{ width: 36, height: 36, margin: '0 auto' }}>
            <SevakNetLogo size={36} showText={false} />
          </div>
        ) : (
          <SevakNetLogo size={34} showText={true} textColor="var(--color-primary)" />
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV(t).map(item => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id} onClick={() => onViewChange(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '11px' : '10px 12px',
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 0.2s', justifyContent: collapsed ? 'center' : 'flex-start',
                fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 13, marginBottom: 3,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-primary-subtle)'; e.currentTarget.style.color = 'var(--color-primary)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
              title={collapsed ? item.label : undefined}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-danger)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', gap: 6, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>
          {collapsed ? <ChevronRight size={15} /> : <><span>{t('sidebar.collapse')}</span><ChevronLeft size={15} /></>}
        </button>
      </div>
    </div>
  );
}

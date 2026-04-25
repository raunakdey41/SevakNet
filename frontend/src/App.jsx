import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard    from './pages/Dashboard';
import SurveyForm   from './pages/SurveyForm';
import VolunteerView from './pages/VolunteerView';

const NAV_LINKS = [
  { to: '/',          label: 'Operations',  icon: '🗺' },
  { to: '/survey',    label: 'New Survey',  icon: '📋' },
  { to: '/volunteer', label: 'Volunteer',   icon: '🙋' },
];

function Nav() {
  const loc = useLocation();
  const isDashboard = loc.pathname === '/';

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      background: '#0d1117',
      borderBottom: '1px solid #21262d',
      padding: '0 20px',
      height: 52,
      flexShrink: 0,
      zIndex: 200,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28 }}>
        <div style={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg, #00D2B4, #006fa6)',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#0d1117',
          fontFamily: "'Space Grotesk', sans-serif",
          flexShrink: 0,
        }}>
          SN
        </div>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: '#f0f6fc',
          letterSpacing: '0.01em',
        }}>
          SevakNet
        </span>
        <span style={{
          fontSize: 10,
          color: '#484f58',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
        }}>
          WB / IN
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 14px',
              borderRadius: 7,
              textDecoration: 'none',
              fontSize: 13,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#00D2B4' : '#8b949e',
              background: isActive ? 'rgba(0,210,180,0.1)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.6)',
        }} />
        <span style={{ fontSize: 11, color: '#484f58', fontFamily: "'JetBrains Mono', monospace" }}>
          LIVE
        </span>
      </div>
    </nav>
  );
}

function AppLayout() {
  const loc = useLocation();
  const isDashboard = loc.pathname === '/';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: isDashboard ? 'hidden' : 'auto',
    }}>
      <Nav />
      <div style={{ flex: 1, overflow: isDashboard ? 'hidden' : 'auto', position: 'relative' }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/survey"    element={<SurveyForm />} />
          <Route path="/volunteer" element={<VolunteerView />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#161b22',
            color: '#f0f6fc',
            border: '1px solid #21262d',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#00D2B4', secondary: '#0f1117' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
        }}
      />
    </BrowserRouter>
  );
}

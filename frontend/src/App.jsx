import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';

import Landing from './pages/Landing';
import CitizenPortal from './pages/CitizenPortal';
import { NgoLogin, NgoRegister } from './pages/NgoAuth';
import NgoDashboard from './pages/NgoDashboard';
import { VolunteerLogin, VolunteerRegister } from './pages/VolunteerAuth';
import VolunteerDashboard from './pages/VolunteerDashboard';

function GuardNgo({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated()) return <Navigate to="/ngo/login" replace />;
  return children;
}

function GuardVol({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated()) return <Navigate to="/volunteer/login" replace />;
  return children;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)', fontSize: 14 }}>Loading SevakNet…</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/report" element={<CitizenPortal />} />
      <Route path="/ngo/login" element={<NgoLogin />} />
      <Route path="/ngo/register" element={<NgoRegister />} />
      <Route path="/ngo/dashboard" element={<GuardNgo><NgoDashboard /></GuardNgo>} />
      <Route path="/volunteer/login" element={<VolunteerLogin />} />
      <Route path="/volunteer/register" element={<VolunteerRegister />} />
      <Route path="/volunteer/dashboard" element={<GuardVol><VolunteerDashboard /></GuardVol>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              boxShadow: 'var(--shadow-md)',
            },
            success: { iconTheme: { primary: 'var(--color-secondary)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

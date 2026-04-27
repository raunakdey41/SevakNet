import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, MapPin, Clock, CheckCircle, Loader, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UrgencyBadge from '../components/UrgencyBadge';
import CategoryChip from '../components/CategoryChip';
import MapView from '../components/MapView';
import SkeletonLoader from '../components/SkeletonLoader';
import AvailabilityGrid from '../components/AvailabilityGrid';
import { skillsList, assignments as mockAssignments, tasks as mockTasks, volunteers as mockVols } from '../data/mockData';
import { getMyAssignments, getNearbyTasks, updateAssignmentStatus, completeAssignment, listLocations, updateVolunteer, deleteVolunteer } from '../api/client';

const TABS_KEYS = ['volunteerDashboard.tabs.myAssignments', 'volunteerDashboard.tabs.nearbyTasks', 'volunteerDashboard.tabs.myProfile'];

// ── ASSIGNMENT CARD ────────────────────────────────────────────────────────────
function AssignmentCard({ asgn, onAccept, onComplete, onCompleteWithPhoto }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const fileRef = React.useRef();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file); setPhotoError('');
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitWithPhoto = async () => {
    if (!photoFile) { setPhotoError('Please attach a photo as proof of completion.'); return; }
    setBusy(true); await onCompleteWithPhoto(asgn.id, photoFile); setBusy(false);
  };
  const border = { 5: '#E24B4A', 4: '#EF9F27', 3: '#F59E0B', 2: '#1D9E75', 1: '#9CA3AF' }[Math.ceil(asgn.urgency_score / 20)] || '#9CA3AF';

  const act = async fn => { setBusy(true); await fn(asgn.id); setBusy(false); };

  const statusLabel = {
    pending: t('volunteerDashboard.status.awaitingAcceptance'),
    accepted: t('volunteerDashboard.status.accepted'),
    'in-progress': t('volunteerDashboard.status.inProgress'),
    completed: t('volunteerDashboard.status.completed')
  }[asgn.status] || asgn.status;
  const statusStyle = {
    pending: { background: 'rgba(107,114,128,0.12)', color: '#6B7280' },
    accepted: { background: 'rgba(83,74,183,0.1)', color: 'var(--color-primary)' },
    'in-progress': { background: 'rgba(29,158,117,0.1)', color: 'var(--color-secondary)' },
    completed: { background: 'rgba(29,158,117,0.1)', color: 'var(--color-secondary)' },
  }[asgn.status] || {};

  return (
    <motion.div className="card" style={{ borderLeft: `4px solid ${border}`, marginBottom: 14 }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 7, lineHeight: 1.3 }}>{asgn.task_title}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <UrgencyBadge score={Math.ceil(asgn.urgency_score / 20)} />
            <CategoryChip category={asgn.category} />
          </div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, fontFamily: "'Inter',sans-serif", flexShrink: 0, ...statusStyle }}>
          {statusLabel}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
          <MapPin size={12} /> {asgn.ward_name}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
          📍 {asgn.distance_km?.toFixed(1) || '0'}{t('volunteerDashboard.away')}
        </span>
        {asgn.deadline && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
            <Clock size={12} /> {t('common.due', { defaultValue: 'Due' })} {new Date(asgn.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'Inter',sans-serif" }}>
          <Star size={12} fill="var(--color-primary)" /> {asgn.matchScore}{t('volunteerDashboard.match')}
        </span>
      </div>

      {asgn.status === 'pending' && (
        <motion.button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}
          onClick={() => act(onAccept)} disabled={busy} whileTap={{ scale: 0.98 }}>
          {busy ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('volunteerDashboard.accepting')}</> : <><CheckCircle size={15} /> {t('volunteerDashboard.acceptTask')}</>}
        </motion.button>
      )}
      {asgn.status === 'accepted' && (
        <button className="btn btn-outline-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => act(onComplete)} disabled={busy}>
          {busy ? t('common.updating', { defaultValue: 'Updating…' }) : `▶ ${t('volunteerDashboard.markInProgress')}`}
        </button>
      )}
      {asgn.status === 'in-progress' && (
        <div>
          <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 10, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}>
            {photoPreview
              ? <img src={photoPreview} alt="Evidence" style={{ maxHeight: 140, borderRadius: 8, maxWidth: '100%' }} />
              : <div style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>📷 <strong>Tap to attach photo evidence</strong><br/><span style={{fontSize:11}}>Required to mark task complete</span></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
          {photoError && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>{photoError}</div>}
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={submitWithPhoto} disabled={busy}>
            {busy ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : `✓ ${t('volunteerDashboard.markComplete')}`}
          </button>
        </div>
      )}
      {asgn.status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--color-secondary)', fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>
          <CheckCircle size={17} /> {t('volunteerDashboard.taskCompletedSuccess')}
        </div>
      )}
    </motion.div>
  );
}

// ── NEARBY TASK CARD ───────────────────────────────────────────────────────────
function NearbyCard({ task, seed, onClick }) {
  const { t } = useTranslation();
  const score = Math.min(95, 60 + ((seed * 37) % 36));
  const scoreColor = score >= 80 ? 'var(--color-secondary)' : score >= 65 ? 'var(--color-accent)' : '#6B7280';
  const border = { 5: '#E24B4A', 4: '#EF9F27', 3: '#F59E0B', 2: '#1D9E75', 1: '#9CA3AF' }[Math.ceil(task.urgency_score / 20)] || '#9CA3AF';
  return (
    <motion.div className="card" style={{ borderLeft: `4px solid ${border}`, marginBottom: 12, cursor: 'pointer' }}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      onClick={() => { console.log('DEBUG: NearbyCard clicked:', task.id); onClick(task); }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
        <UrgencyBadge score={Math.ceil(task.urgency_score / 20)} />
        <CategoryChip category={task.category} />
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{task.title}</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {task.ward_name}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>👥 {t('common.peopleAffectedCount', { defaultValue: '{{count}} affected', count: task.affected_people })}</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>{t('volunteerDashboard.matchScoreLabel', { defaultValue: 'Your match score' })}</span>
          <span style={{ fontWeight: 700, color: scoreColor }}>{score}{t('volunteerDashboard.match')}</span>
        </div>
        <div className="match-bar">
          <motion.div className="match-bar-fill" style={{ background: scoreColor }}
            initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7 }} />
        </div>
      </div>
      {task.requiredSkills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {task.requiredSkills.map(s => <span key={s} className="chip" style={{ padding: '2px 7px', fontSize: 11 }}>{s}</span>)}
        </div>
      )}
    </motion.div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
export default function VolunteerDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingN, setLoadingN] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); // For detail modal
  useEffect(() => {
    if (selectedTask) console.log('DEBUG: selectedTask is now:', selectedTask);
  }, [selectedTask]);

  // Profile state
  const [volLocation, setVolLocation] = useState(null);
  const [pSkills, setPSkills] = useState(user?.skills || []);
  const [pAvail, setPAvail] = useState(user?.availability || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locations, setLocations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = user?.name || 'Volunteer';
  const first = name.split(' ')[0];
  const initials = user?.initials || (name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('volunteerDashboard.greeting.morning');
    if (h < 17) return t('volunteerDashboard.greeting.afternoon');
    return t('volunteerDashboard.greeting.evening');
  })();

  // Initial Load: Assignments & Locations
  useEffect(() => {
    (async () => {
      try {
        const [aRes, lRes] = await Promise.all([
          getMyAssignments(),
          listLocations()
        ]);
        setAssignments(aRes.data);
        setLocations(lRes);

        // Find volunteer's ward location
        if (user?.location_id && Array.isArray(lRes)) {
          const loc = lRes.find(l => l.id === user.location_id);
          if (loc) setVolLocation({ lat: loc.lat, lng: loc.lng });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load your assignments. Please try logging out and back in.');
      } finally {
        setLoadingA(false);
      }
    })();
  }, [user]);

  // Nearby Tasks (whenever tab 1 is active)
  useEffect(() => {
    if (tab !== 1) return;
    setLoadingN(true);
    (async () => {
      try {
        let lat = volLocation?.lat;
        let lng = volLocation?.lng;

        // Try geolocation if no ward location
        if (!lat || !lng) {
          const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
          }).catch(() => null);
          if (pos) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        }

        // Fallback to Kolkata center if everything fails
        lat = lat || 22.5726;
        lng = lng || 88.3639;

        const r = await getNearbyTasks(lat, lng, 15);
        setNearby(r.data);
      } catch (err) {
        console.error('Failed to fetch nearby tasks:', err);
        setNearby(mockTasks.filter(t => t.status !== 'completed'));
      } finally {
        setLoadingN(false);
      }
    })();
  }, [tab, volLocation]);

  const handleAccept = async id => {
    try { await updateAssignmentStatus(id, 'accepted'); } catch (err) { alert(err.message); }
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'accepted' } : a));
  };

  // accepted → in-progress (no photo yet)
  const handleComplete = async id => {
    try { await updateAssignmentStatus(id, 'in-progress'); } catch (err) { alert(err.message); }
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'in-progress' } : a));
  };

  // in-progress → completed (requires photo evidence via Cloudinary)
  const handleCompleteWithPhoto = async (id, photoFile) => {
    try {
      await completeAssignment(id, photoFile);
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateVolunteer(user.id, { skills: pSkills, availability: pAvail });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user?.id) return;
    setDeleting(true);
    try {
      await deleteVolunteer(user.id);
      logout();
      nav('/volunteer/login');
    } catch (err) {
      alert('Failed to delete profile: ' + err.message);
      setDeleting(false);
    }
  };

  const pending = assignments.filter(a => a.status === 'pending');
  const active = assignments.filter(a => a.status === 'accepted' || a.status === 'in-progress');
  const done = assignments.filter(a => a.status === 'completed');

  return (
    <div translate="no" className="notranslate" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Topbar */}
      <div style={{ height: 'var(--navbar-height)', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 14, background: 'white', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ flex: 1 }}>
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--color-text-primary)' }}>
            {greeting}, <span style={{ color: 'var(--color-secondary)' }}>{first}</span> 🙏
          </motion.p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", margin: 0 }}>
            {pending.length > 0 ? t('volunteerDashboard.awaitingResponse', { count: pending.length }) : t('volunteerDashboard.welcomeSub')}
          </p>
        </div>
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
          <Bell size={19} style={{ color: 'var(--color-text-secondary)' }} className={pending.length > 0 ? 'bell-notify' : ''} />
          {pending.length > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 15, height: 15, borderRadius: '50%', background: 'var(--color-danger)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pending.length}</span>
          )}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials}</div>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <button className="btn btn-ghost" style={{ padding: '7px 11px', fontSize: 12 }} onClick={() => { logout(); nav('/volunteer/login'); }}>
          <LogOut size={13} /> {t('ngoDashboard.logout', { defaultValue: 'Logout' })}
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--color-border)', padding: '0 22px', display: 'flex', gap: 0 }}>
        {TABS_KEYS.map((tk, i) => (
          <button key={tk} onClick={() => setTab(i)} style={{ padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, fontFamily: "'Inter',sans-serif", color: tab === i ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: tab === i ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 0.2s' }}>
            {t(tk)}
            {i === 0 && pending.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-danger)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '22px 16px' }}>
        <AnimatePresence mode="wait">
          {/* ── MY ASSIGNMENTS ── */}
          {tab === 0 && (
            <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error && (
                <div style={{ marginBottom: 20, padding: '13px 16px', background: 'rgba(226,75,74,0.1)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                  ❌ {error}
                </div>
              )}

              {loadingA ? <SkeletonLoader type="card" count={3} /> :
                assignments.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '56px 24px' }}>
                    <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
                    <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('volunteerDashboard.noAssignmentsTitle')}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", maxWidth: 300, margin: '0 auto 20px' }}>{t('volunteerDashboard.noAssignmentsSub')}</p>
                    <button className="btn btn-secondary" onClick={() => setTab(1)}>{t('volunteerDashboard.browseNearby')}</button>
                  </motion.div>
                ) : (
                  <>
                    {pending.length > 0 && <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>🔔 {t('volunteerDashboard.awaitingResponseStatus', { defaultValue: 'Awaiting Your Response' })}</div>
                      {pending.map(a => <AssignmentCard key={a.id} asgn={a} onAccept={handleAccept} onComplete={handleComplete} onCompleteWithPhoto={handleCompleteWithPhoto} />)}
                    </>}
                    {active.length > 0 && <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6, margin: '18px 0 10px', fontFamily: "'Inter',sans-serif" }}>⚡ {t('volunteerDashboard.status.active', { defaultValue: 'Active' })}</div>
                      {active.map(a => <AssignmentCard key={a.id} asgn={a} onAccept={handleAccept} onComplete={handleComplete} onCompleteWithPhoto={handleCompleteWithPhoto} />)}
                    </>}
                    {done.length > 0 && <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: 0.6, margin: '18px 0 10px', fontFamily: "'Inter',sans-serif" }}>✅ {t('volunteerDashboard.status.completed')}</div>
                      {done.map(a => <AssignmentCard key={a.id} asgn={a} onAccept={handleAccept} onComplete={handleComplete} onCompleteWithPhoto={handleCompleteWithPhoto} />)}
                    </>}
                  </>
                )
              }
            </motion.div>
          )}

          {/* ── NEARBY TASKS ── */}
          {tab === 1 && (
            <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: 19, marginBottom: 14 }}>{t('volunteerDashboard.tasksNearYou')}</h2>
              <div style={{ height: 210, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 18, boxShadow: 'var(--shadow-sm)' }}>
                {loadingN ? <SkeletonLoader type="map" /> : <MapView tasks={nearby} onTaskSelect={setSelectedTask} center={[volLocation?.lat || 22.5726, volLocation?.lng || 88.3639]} zoom={11} />}
              </div>
              {!loadingN && nearby.filter(t => t.urgency >= 4).length > 0 && (
                <div style={{ marginBottom: 10, padding: '9px 13px', background: 'rgba(83,74,183,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--color-primary)', fontWeight: 500 }}>
                  ⭐ {t('volunteerDashboard.highPriorityMatch', { count: nearby.filter(t => t.urgency >= 4).length })}
                </div>
              )}
              {loadingN ? <SkeletonLoader type="card" count={3} /> :
                nearby.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🌿</div>
                    <h3 style={{ fontSize: 17, marginBottom: 6 }}>{t('volunteerDashboard.noNearbyTasksTitle')}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>{t('volunteerDashboard.noNearbyTasksSub')}</p>
                  </div>
                ) : nearby.map((t, i) => <NearbyCard key={t.id} task={t} seed={i + 1} onClick={setSelectedTask} />)
              }
            </motion.div>
          )}

          {/* ── MY PROFILE ── */}
          {tab === 2 && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: 19, marginBottom: 18 }}>{t('volunteerDashboard.myProfile')}</h2>

              {/* Avatar card */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 3 }}>{name}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, margin: 0 }}>{user?.phone}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Poppins',sans-serif", color: 'var(--color-primary)' }}>{user?.tasksCompleted || 0}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{t('volunteerDashboard.tasksDone')}</div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="card" style={{ marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, marginBottom: 14 }}>{t('volunteerDashboard.mySkills')}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {skillsList.map(s => (
                    <button key={s.id} type="button" className={`category-btn${pSkills.includes(s.label) ? ' selected' : ''}`} style={{ padding: '9px 6px' }}
                      onClick={() => { const has = pSkills.includes(s.label); setPSkills(has ? pSkills.filter(x => x !== s.label) : [...pSkills, s.label]); }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 10 }}>{t(`skills.${s.label}`, { defaultValue: s.label })}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="card" style={{ marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, marginBottom: 14 }}>{t('volunteerDashboard.myAvailability')}</h4>
                <AvailabilityGrid selected={pAvail} onChange={setPAvail} />
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}
                onClick={handleSave} disabled={saving || saved}>
                {saving ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('volunteerDashboard.saving')}</>
                  : saved ? <><CheckCircle size={15} /> {t('volunteerDashboard.saved')}</>
                    : t('volunteerDashboard.saveProfileChanges')}
              </button>

              {/* Danger Zone */}
              <div className="card" style={{ marginTop: 22, border: '1.5px solid rgba(226,75,74,0.3)', background: 'rgba(226,75,74,0.03)' }}>
                <h4 style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>⚠ Danger Zone</h4>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 14, lineHeight: 1.5 }}>Deleting your profile will deactivate your account and remove you from the volunteer network. This action cannot be undone.</p>
                {!showDeleteConfirm
                  ? <button className="btn" style={{ background: 'transparent', border: '1.5px solid var(--color-danger)', color: 'var(--color-danger)', padding: '9px 18px', fontSize: 13, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setShowDeleteConfirm(true)}>🗑 Delete My Profile</button>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 600, margin: 0 }}>Are you absolutely sure? This cannot be undone.</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        <button className="btn" style={{ flex: 1, background: 'var(--color-danger)', color: 'white', border: 'none', justifyContent: 'center', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '9px', fontWeight: 700 }}
                          onClick={handleDeleteProfile} disabled={deleting}>
                          {deleting ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Detail Modal Overlay */}
        <AnimatePresence>
          {selectedTask && (
            <div key="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
              onClick={() => setSelectedTask(null)}>
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ width: '100%', maxWidth: 500, background: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px 24px 40px', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', cursor: 'default' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 20px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <UrgencyBadge score={Math.ceil(selectedTask.urgency_score / 20)} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>{selectedTask.title}</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} /> {selectedTask.ward_name}, {selectedTask.block}
                    </p>
                  </div>
                  <CategoryChip category={selectedTask.category} />
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('common.description', { defaultValue: 'Description' })}</h4>
                  <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{selectedTask.description || 'No description provided.'}</p>
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{t('common.affected', { defaultValue: 'Affected' })}</div>
                    <div style={{ fontWeight: 700 }}>{selectedTask.affected_people} {t('common.people', { defaultValue: 'People' })}</div>
                  </div>
                  {selectedTask.deadline && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{t('common.deadline', { defaultValue: 'Deadline' })}</div>
                      <div style={{ fontWeight: 700 }}>{new Date(selectedTask.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  )}
                </div>

                {selectedTask.skill_required && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{t('common.skillsRequired', { defaultValue: 'SKILLS REQUIRED' })}</div>
                    <span className="chip" style={{ background: 'rgba(83,74,183,0.1)', color: 'var(--color-primary)', fontWeight: 600 }}>{selectedTask.skill_required}</span>
                  </div>
                )}

                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 16, gap: 10 }}
                  onClick={async () => {
                    try {
                      setLoadingA(true);
                      const { assignVolunteer } = await import('../api/client');
                      await assignVolunteer({ task_id: selectedTask.id, volunteer_id: user.id });
                      const aRes = await getMyAssignments();
                      console.log('DEBUG: Assignments updated after claim:', aRes.data);
                      setAssignments(aRes.data);
                      setSelectedTask(null);
                      setTab(0); // Go to my assignments
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      setLoadingA(false);
                    }
                  }}>
                  <CheckCircle size={20} /> {t('volunteerDashboard.acceptTask')}
                </button>
              </motion.div>
            </div>
          )}

        </AnimatePresence>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

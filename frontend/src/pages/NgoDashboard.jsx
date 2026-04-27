import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogOut, Plus, RefreshCw, CheckCircle, X, Eye, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import TaskCard from '../components/TaskCard';
import VolunteerCard from '../components/VolunteerCard';
import UrgencyBadge from '../components/UrgencyBadge';
import CategoryChip from '../components/CategoryChip';
import SkeletonLoader from '../components/SkeletonLoader';
import SlidePanel from '../components/SlidePanel';
import CountUpNumber from '../components/CountUpNumber';
import AvailabilityGrid from '../components/AvailabilityGrid';
import { tasks as mockTasks, volunteers as mockVolunteers, citizenReports as mockReports, dashboardStats as mockStats, recentActivity as mockRecent, categoryConfig } from '../data/mockData';
import { listTasks, getTaskMatches, assignVolunteer, listLocations, listCitizenReports, createSurvey, listVolunteers, updateSurvey } from '../api/client';
import { getDistrictCenter } from '../utils/geo';

// ── FIELD REPORT FORM ──────────────────────────────────────────────────────────
function FieldReportForm({ onClose, prefill, locations = [], defaultDistrict = '' }) {
  const { t } = useTranslation();

  // Build district list (unique, sorted)
  const districtList = [...new Set(locations.map(l => l.district).filter(Boolean))].sort();

  // Derive pre-fill district from location id
  const prefillDistrict = prefill?.location_id
    ? (locations.find(l => l.id === prefill.location_id)?.district || '')
    : (prefill?.district || defaultDistrict);

  const [form, setForm] = useState({ 
    wardId: prefill?.location_id || '', 
    reportedBy: prefill?.reported_by || '', 
    category: prefill?.category || '', 
    urgency: 3, 
    peopleAffected: prefill?.affected_people || '', 
    description: prefill?.description || '', 
    deadline: '', 
    slots: [] 
  });
  const [selectedDistrict, setSelectedDistrict] = useState(prefillDistrict);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Wards for the selected district
  const wardsForDistrict = selectedDistrict
    ? locations.filter(l => l.district === selectedDistrict)
    : [];

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    set('wardId', ''); // reset ward when district changes
  };

  const UC = { 1: '#1D9E75', 2: '#1D9E75', 3: '#F59E0B', 4: '#EF9F27', 5: '#E24B4A' };
  const UL = { 1: t('urgency.minimal', { defaultValue: 'Minimal' }), 2: t('urgency.low', { defaultValue: 'Low' }), 3: t('urgency.medium', { defaultValue: 'Medium' }), 4: t('urgency.high', { defaultValue: 'High' }), 5: t('urgency.critical', { defaultValue: 'Critical' }) };

  const submit = async () => {
    if (!form.wardId || !form.category || !form.description) {
      setError('Please fill required fields.');
      return;
    }
    setError('');
    setLoading(true); 
    try {
      await createSurvey({
        location_id: form.wardId,
        reported_by: form.reportedBy,
        category: form.category,
        urgency_level: form.urgency,
        affected_people: parseInt(form.peopleAffected) || 1,
        description: form.description,
        deadline: form.deadline
      });
      setDone(true); 
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
      <h3 style={{ fontSize: 18, color: 'var(--color-secondary)' }}>{t('ngoDashboard.reportSubmitted')}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, marginTop: 6 }}>{t('ngoDashboard.reportSubmittedSub')}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── District Dropdown ── */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>District</label>
        <select className="input-field" value={selectedDistrict} onChange={e => handleDistrictChange(e.target.value)}>
          <option value="">-- Select district --</option>
          {districtList.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {/* ── Ward Dropdown (filtered by district) ── */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.ward')}</label>
        <select className="input-field" value={form.wardId} onChange={e => set('wardId', e.target.value)} disabled={!selectedDistrict}>
          <option value="">{selectedDistrict ? t('ngoDashboard.wardPlaceholder', { defaultValue: '-- Select ward --' }) : '-- Select a district first --'}</option>
          {wardsForDistrict.map(l => <option key={l.id} value={l.id}>{l.ward_name || l.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.reportedBy')}</label>
        <input className="input-field" placeholder={t('ngoDashboard.reportedByPlaceholder', { defaultValue: 'Name of reporter' })} value={form.reportedBy} onChange={e => set('reportedBy', e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 9, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.category')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {Object.keys(categoryConfig).map(cat => (
            <button key={cat} type="button" className={`category-btn${form.category === cat ? ' selected' : ''}`} onClick={() => set('category', form.category === cat ? '' : cat)}>
              <span style={{ fontSize: 20 }}>{categoryConfig[cat].icon}</span><span style={{ fontSize: 11 }}>{t(`categories.${cat}`, { defaultValue: cat })}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7, fontFamily: "'Inter',sans-serif" }}>
          {t('ngoDashboard.urgency')}: <span style={{ color: UC[form.urgency], fontWeight: 700 }}>{UL[form.urgency]}</span>
        </label>
        <input type="range" min={1} max={5} value={form.urgency} onChange={e => set('urgency', parseInt(e.target.value))}
          style={{ background: `linear-gradient(to right,${UC[form.urgency]} ${(form.urgency - 1) * 25}%,var(--color-border) ${(form.urgency - 1) * 25}%)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginTop: 3 }}>
          <span>Low</span><span>Critical</span>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.peopleAffected')}</label>
        <input className="input-field" type="number" min={1} placeholder="e.g. 150" value={form.peopleAffected} onChange={e => set('peopleAffected', e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.description')} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({form.description.length}/600)</span></label>
        <textarea className="input-field" style={{ minHeight: 100, resize: 'vertical' }} maxLength={600} placeholder={t('ngoDashboard.descriptionPlaceholder', { defaultValue: 'Describe the situation in detail…' })} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.deadline')}</label>
        <input className="input-field" type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 9, fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.requiredTimeSlots')}</label>
        <AvailabilityGrid selected={form.slots} onChange={v => set('slots', v)} />
      </div>
      <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
        {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('ngoDashboard.submittingFieldReport', { defaultValue: 'Submitting…' })}</> : t('ngoDashboard.submitFieldReport')}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── METRIC CARD ────────────────────────────────────────────────────────────────
function MetricCard({ icon, label, target, color, delay = 0 }) {
  return (
    <motion.div className="metric-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Poppins',sans-serif", color, marginBottom: 4 }}><CountUpNumber target={target} /></div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{label}</div>
    </motion.div>
  );
}

// ── ANALYTICS ──────────────────────────────────────────────────────────────────
function AnalyticsView() {
  const { t } = useTranslation();
  const bars = [
    { label: t('ngoDashboard.tasksByCategory'), data: [{ n: t('categories.Water'), v: 2, c: '#3B82F6' }, { n: t('categories.Food'), v: 2, c: '#10B981' }, { n: t('categories.Medical'), v: 1, c: '#EF4444' }, { n: t('categories.Shelter'), v: 1, c: '#F59E0B' }] },
    { label: t('ngoDashboard.byUrgency'), data: [{ n: t('urgency.critical', { defaultValue: 'Critical' }), v: 3, c: '#E24B4A' }, { n: t('urgency.high', { defaultValue: 'High' }), v: 2, c: '#EF9F27' }, { n: t('urgency.medium', { defaultValue: 'Medium' }), v: 1, c: '#F59E0B' }, { n: t('urgency.low', { defaultValue: 'Low' }), v: 1, c: '#1D9E75' }] },
  ];
  const weekly = [{ d: t('days.mon', { defaultValue: 'Mon' }), v: 2 }, { d: t('days.tue', { defaultValue: 'Tue' }), v: 3 }, { d: t('days.wed', { defaultValue: 'Wed' }), v: 1 }, { d: t('days.thu', { defaultValue: 'Thu' }), v: 4 }, { d: t('days.fri', { defaultValue: 'Fri' }), v: 3 }, { d: t('days.sat', { defaultValue: 'Sat' }), v: 5 }, { d: t('days.sun', { defaultValue: 'Sun' }), v: 2 }];
  return (
    <div>
      <h2 style={{ fontSize: 21, marginBottom: 22 }}>{t('ngoDashboard.analyticsOverview')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {bars.map(chart => (
          <div key={chart.label} className="card">
            <h4 style={{ fontSize: 14, marginBottom: 14 }}>{chart.label}</h4>
            {chart.data.map((d, i) => {
              const max = Math.max(...chart.data.map(x => x.v));
              return (
                <div key={d.n} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{d.n}</span><span style={{ fontWeight: 600 }}>{d.v}</span>
                  </div>
                  <div className="match-bar">
                    <motion.div className="match-bar-fill" style={{ background: d.c, height: 8 }} initial={{ width: 0 }} animate={{ width: `${(d.v / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="card">
        <h4 style={{ fontSize: 14, marginBottom: 14 }}>{t('ngoDashboard.weeklyTaskResolution')}</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
          {weekly.map((item, i) => (
            <div key={item.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <motion.div style={{ width: '100%', background: 'var(--color-primary)', borderRadius: '4px 4px 0 0' }} initial={{ height: 0 }} animate={{ height: `${(item.v / 5) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.06 }} />
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{item.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function NgoDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth(); const nav = useNavigate();
  const [view, setView] = useState('overview');
  const [taskList, setTaskList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [citizenReports, setCitizenReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selTask, setSelTask] = useState(null);
  const [matchVols, setMatchVols] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [volunteerList, setVolunteerList] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    try { 
      const params = { district: user?.district };
      const [tRes, lRes, cRes, vRes] = await Promise.all([
        listTasks(params),
        listLocations(),
        listCitizenReports(params),
        listVolunteers(params)
      ]);
      setTaskList(tRes);
      setLocations(lRes);
      setCitizenReports(cRes || []);
      setVolunteerList(vRes);
    }
    catch (err) { 
      console.error('Failed to load dashboard data:', err);
      // Fallback to empty or mock if needed, but primarily use API
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openMatch = async (task) => {
    setSelTask(task); setMatchOpen(true); setMatchLoading(true);
    try { const r = await getTaskMatches(task.id); setMatchVols(r.data); }
    catch { setMatchVols(volunteerList.filter(v => v.skills?.some(s => task.requiredSkills?.includes(s))).slice(0, 4)); }
    finally { setMatchLoading(false); }
  };

  // State for task-picker (used in Volunteers tab when no task is pre-selected)
  const [taskPickerVol, setTaskPickerVol] = useState(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [pickTaskId, setPickTaskId] = useState('');
  const [pickAssigning, setPickAssigning] = useState(false);

  const doAssign = async (volId, taskId) => {
    // If taskId is missing (called from Volunteers tab), open task picker
    if (!taskId) {
      setTaskPickerVol(volId);
      setPickTaskId('');
      setTaskPickerOpen(true);
      return;
    }
    try { 
      await assignVolunteer({ task_id: taskId, volunteer_id: volId }); 
      setMatchOpen(false);
      loadAll(); // Refresh to show assigned status
    } catch (err) {
      alert('Assignment failed: ' + err.message);
    }
  };

  const doAssignWithPick = async () => {
    if (!pickTaskId) { alert('Please select a task first.'); return; }
    setPickAssigning(true);
    try {
      await assignVolunteer({ task_id: pickTaskId, volunteer_id: taskPickerVol });
      setTaskPickerOpen(false);
      setTaskPickerVol(null);
      setPickTaskId('');
      loadAll();
    } catch (err) {
      alert('Assignment failed: ' + err.message);
    } finally {
      setPickAssigning(false);
    }
  };

  const filtered = taskList.filter(task => {
    if (taskFilter !== 'all' && task.status !== taskFilter) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const filteredReports = citizenReports.filter(r => inboxFilter === 'all' || r.status === inboxFilter);

  // Pending reports count for notification badge
  const pendingCount = citizenReports.filter(r => (r.status || 'pending') === 'pending').length;

  // Mark a report as reviewed (optimistic)
  const handleReview = async (reportId) => {
    if (!reportId || reviewingId === reportId) return;
    setReviewingId(reportId);
    // Optimistic update
    setCitizenReports(prev => prev.map(r => (r.id || r.surveyId) === reportId ? { ...r, status: 'reviewed' } : r));
    try {
      await updateSurvey(reportId, { status: 'reviewed' });
    } catch (err) {
      // Revert on failure
      setCitizenReports(prev => prev.map(r => (r.id || r.surveyId) === reportId ? { ...r, status: 'pending' } : r));
      alert('Failed to mark as reviewed: ' + err.message);
    } finally {
      setReviewingId(null);
    }
  };

  // Stats shim
  const stats = {
    open: taskList.filter(task => task.status === 'open').length,
    critical: taskList.filter(task => (task.urgency_score || task.urgency * 20) > 80).length,
    volunteers: volunteerList.length,
    reports: citizenReports.length
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeView={view} onViewChange={setView} />

      <div className="dashboard-main">
        {/* Topbar */}
        <div style={{ height: 'var(--navbar-height)', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 14, background: 'white', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: 380 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input className="input-field" style={{ paddingLeft: 34, padding: '8px 12px 8px 34px', fontSize: 13 }} placeholder={t('ngoDashboard.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* ── Notification Bell ── */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              style={{ position: 'relative', background: notifOpen ? 'var(--color-primary)' : 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
            >
              <Bell size={19} style={{ color: notifOpen ? 'white' : 'var(--color-text-secondary)' }} className="bell-notify" />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--color-danger)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, background: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', zIndex: 9000, overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>Notifications</span>
                    {pendingCount > 0 && <span style={{ fontSize: 11, background: 'var(--color-danger)', color: 'white', borderRadius: 'var(--radius-pill)', padding: '2px 8px', fontWeight: 600 }}>{pendingCount} pending</span>}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {citizenReports.filter(r => (r.status || 'pending') === 'pending').length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>All caught up!
                      </div>
                    ) : (
                      citizenReports.filter(r => (r.status || 'pending') === 'pending').slice(0, 8).map(r => (
                        <div key={r.id || r.reportId}
                          onClick={() => { setView('inbox'); setNotifOpen(false); }}
                          style={{ padding: '11px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(83,74,183,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reported_by || 'Anonymous'}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{r.description || 'New citizen report'}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginTop: 3 }}>{r.ward_name || r.block || ''}{r.district ? ` · ${r.district}` : ''}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {pendingCount > 0 && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                      <button onClick={() => { setView('inbox'); setNotifOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>View all in Citizen Inbox →</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{(user?.name || 'N')[0]}</div>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'NGO Admin'}</span>
          </div>
          <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => { logout(); nav('/ngo/login'); }}>
            <LogOut size={14} /> {t('ngoDashboard.logout')}
          </button>
        </div>

        {/* Main content */}
        <div className="dashboard-content">
          <AnimatePresence mode="wait">

            {/* ─── OVERVIEW ─── */}
            {view === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 22, padding: '14px 18px', background: 'rgba(83,74,183,0.06)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    🤖 <strong>{t('ngoDashboard.aiInsightPrefix', { defaultValue: 'AI Insight:' })}</strong> {t('ngoDashboard.aiInsight', { criticalTasks: stats.critical, activeVolunteers: stats.volunteers })}
                  </p>
                </div>
                {loading ? <SkeletonLoader type="metric" /> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                    <MetricCard icon="📋" label={t('ngoDashboard.open')} target={stats.open} color="var(--color-primary)" delay={0} />
                    <MetricCard icon="🔴" label={t('ngoDashboard.criticalAlerts')} target={stats.critical} color="var(--color-danger)" delay={0.08} />
                    <MetricCard icon="👥" label={t('ngoDashboard.activeVolunteers')} target={stats.volunteers} color="var(--color-secondary)" delay={0.16} />
                    <MetricCard icon="📊" label={t('ngoDashboard.reportsWeek')} target={stats.reports} color="var(--color-accent)" delay={0.24} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 360 }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: 14 }}>{t('ngoDashboard.liveTaskMap')}</h3>
                      <button className="btn btn-primary" style={{ padding: '6px 13px', fontSize: 12, gap: 5 }} onClick={() => { setPrefill(null); setReportOpen(true); }}>
                        <Plus size={12} /> {t('ngoDashboard.addTask')}
                      </button>
                    </div>
                    <div style={{ height: 320 }}><MapView tasks={taskList} onTaskSelect={openMatch} /></div>
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ fontSize: 14 }}>{t('ngoDashboard.priorityQueue')}</h3>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 320, padding: '8px 10px' }}>
                      {loading ? <SkeletonLoader type="row" count={5} /> :
                        [...taskList].sort((a, b) => b.urgency_score - a.urgency_score).filter(task => task.status !== 'completed').map(task => (
                          <div key={task.id} className="priority-row" onClick={() => openMatch(task)}>
                            <UrgencyBadge score={Math.ceil(task.urgency_score / 20)} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{task.ward_name}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{t('ngoDashboard.score')} {task.urgency_score}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: 14, marginBottom: 14 }}>{t('dashboard.recentActivity')}</h3>
                  {mockRecent.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: i < mockRecent.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.4 }}>{a.text}</p>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── MAP VIEW ─── */}
            {view === 'map' && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: 'calc(100vh - var(--navbar-height) - 48px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 20 }}>{t('sidebar.mapView')}</h2>
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => { setPrefill(null); setReportOpen(true); }}><Plus size={13} /> {t('ngoDashboard.addTask')}</button>
                </div>
                <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                  <MapView tasks={taskList} onTaskSelect={openMatch} center={getDistrictCenter(user?.district)} />
                </div>
              </motion.div>
            )}

            {/* ─── TASKS ─── */}
            {view === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ fontSize: 20 }}>{t('ngoDashboard.allTasks')}</h2>
                  <div style={{ display: 'flex', gap: 9 }}>
                    <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 12 }} value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
                      <option value="all">{t('ngoDashboard.allStatus')}</option>
                      <option value="open">{t('ngoDashboard.open')}</option>
                      <option value="assigned">{t('ngoDashboard.assigned')}</option>
                      <option value="completed">{t('ngoDashboard.completed')}</option>
                    </select>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => { setPrefill(null); setReportOpen(true); }}><Plus size={13} /> {t('ngoDashboard.addTask')}</button>
                  </div>
                </div>
                {loading ? <SkeletonLoader type="card" count={4} /> :
                  filtered.length === 0
                    ? <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div style={{ fontSize: 44, marginBottom: 10 }}>🌿</div>
                      <h3 style={{ fontSize: 17, marginBottom: 6 }}>{t('ngoDashboard.noTasksTitle')}</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>{t('ngoDashboard.noTasksSub')}</p>
                    </div>
                    : filtered.map(task => <TaskCard key={task.id} task={task} onFindVolunteers={() => openMatch(task)} />)
                }
              </motion.div>
            )}

            {/* ─── FIELD REPORTS ─── */}
            {view === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ fontSize: 20 }}>{t('ngoDashboard.fieldReports')}</h2>
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => { setPrefill(null); setReportOpen(true); }}><Plus size={13} /> {t('ngoDashboard.submitReport')}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                  {taskList.filter(task => task.type === 'report').map(task => <TaskCard key={task.id} task={task} compact onClick={() => openMatch(task)} />)}
                </div>
              </motion.div>
            )}

            {/* ─── INBOX ─── */}
            {view === 'inbox' && (
              <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <h2 style={{ fontSize: 20 }}>{t('ngoDashboard.citizenInbox')}</h2>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {['all', 'pending', 'reviewed', 'resolved'].map(f => (
                      <button key={f} onClick={() => setInboxFilter(f)} style={{ padding: '6px 13px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--color-border)', fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: 'pointer', background: inboxFilter === f ? 'var(--color-primary)' : 'white', color: inboxFilter === f ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                        {t(`inbox.${f}`, { defaultValue: f.charAt(0).toUpperCase() + f.slice(1) })}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredReports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
                    <h3 style={{ fontSize: 17, marginBottom: 6 }}>No reports yet</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>Citizen reports will appear here when submitted.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
                    {filteredReports.map(r => {
                      const status = r.status || 'pending';
                      const reportedAt = r.reported_at ? new Date(r.reported_at) : null;
                      const dateStr = reportedAt && !isNaN(reportedAt) ? reportedAt.toLocaleDateString('en-IN') : '—';
                      return (
                        <motion.div key={r.id || r.reportId} className="card" style={{ padding: 18 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>{r.reported_by || 'Anonymous'}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{r.phone || '—'}</div>
                            </div>
                            <span className={`status-${status}`} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                          {r.category && <CategoryChip category={r.category} />}
                          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", lineHeight: 1.5, margin: '9px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description || '—'}</p>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 11, fontFamily: "'Inter',sans-serif" }}>
                            {r.ward_name || r.block || '—'}{r.district ? ` · ${r.district}` : ''} · {dateStr}
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            {status === 'pending' ? (
                              <button
                                className="btn btn-outline"
                                style={{ flex: 1, padding: '6px', fontSize: 11, justifyContent: 'center', opacity: reviewingId === (r.id || r.reportId) ? 0.6 : 1 }}
                                onClick={() => handleReview(r.id || r.reportId)}
                                disabled={reviewingId === (r.id || r.reportId)}
                              >
                                {reviewingId === (r.id || r.reportId)
                                  ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite', marginRight: 4 }} />Marking…</>
                                  : <><Eye size={11} style={{ marginRight: 4 }} />{t('ngoDashboard.review')}</>}
                              </button>
                            ) : (
                              <div style={{ flex: 1, padding: '6px', fontSize: 11, textAlign: 'center', color: 'var(--color-secondary)', fontWeight: 600, fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <CheckCircle size={11} /> {status.charAt(0).toUpperCase() + status.slice(1)}
                              </div>
                            )}
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: 11, justifyContent: 'center' }} onClick={() => { setPrefill(r); setReportOpen(true); }}>{t('ngoDashboard.createTask')}</button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── VOLUNTEERS ─── */}
            {view === 'volunteers' && (
              <motion.div key="volunteers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontSize: 20, marginBottom: 18 }}>{t('ngoDashboard.volunteerNetwork')}</h2>
                {volunteerList.map(v => <VolunteerCard key={v.id} volunteer={v} onAssign={doAssign} />)}
              </motion.div>
            )}



            {/* ─── ANALYTICS ─── */}
            {view === 'analytics' && <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AnalyticsView /></motion.div>}

            {/* ─── SETTINGS ─── */}
            {view === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontSize: 20, marginBottom: 18 }}>{t('sidebar.settings')}</h2>
                <div className="card" style={{ maxWidth: 480 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 16 }}>{t('ngoDashboard.ngoProfile')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{t('auth.ngoName')}</label><input className="input-field" defaultValue={user?.name || 'Demo NGO'} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{t('auth.email')}</label><input className="input-field" defaultValue={user?.email || 'demo@ngo.org'} /></div>
                    <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>{t('ngoDashboard.saveChanges')}</button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Match panel */}
      <SlidePanel isOpen={matchOpen} onClose={() => setMatchOpen(false)} title={t('ngoDashboard.volunteerMatches')}>
        {selTask && (
          <>
            <TaskCard task={selTask} compact />
            <div style={{ margin: '14px 0 10px', padding: '11px 14px', background: 'rgba(29,158,117,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-secondary)' }}>
              <p style={{ fontSize: 12, fontFamily: "'Inter',sans-serif", margin: 0 }}>🤖 {t('ngoDashboard.volunteerMatchAI', { defaultValue: 'Found {{count}} volunteers matched by skills, proximity and availability.', count: matchVols.length })}</p>
            </div>
            <h3 style={{ fontSize: 14, margin: '14px 0 10px' }}>{t('ngoDashboard.topMatchedVolunteers')}</h3>
            {matchLoading ? <SkeletonLoader type="volunteer" count={3} /> :
              matchVols.length
                ? matchVols.map(v => <VolunteerCard key={v.id} volunteer={v} taskId={selTask.id} onAssign={doAssign} />)
                : <div style={{ textAlign: 'center', padding: 28, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  {t('ngoDashboard.noVolunteersMatched')}
                </div>
            }
          </>
        )}
      </SlidePanel>

      {/* Field report panel */}
      <SlidePanel isOpen={reportOpen} onClose={() => setReportOpen(false)} title={t('ngoDashboard.fieldReportTitle')}>
        <FieldReportForm onClose={() => { setReportOpen(false); loadAll(); }} prefill={prefill} locations={locations} defaultDistrict={user?.district} />
      </SlidePanel>

      {/* Task Picker Modal — shown when assigning from Volunteers tab */}
      <AnimatePresence>
        {taskPickerOpen && (
          <motion.div
            key="task-picker-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setTaskPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setTaskPickerOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Assign to Task</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 18 }}>Select an open task to assign this volunteer to:</p>
              <select className="input-field" value={pickTaskId} onChange={e => setPickTaskId(e.target.value)} style={{ marginBottom: 18 }}>
                <option value="">-- Select a task --</option>
                {taskList.filter(t => t.status === 'open').map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.ward_name || t.district || ''})</option>
                ))}
              </select>
              {taskList.filter(t => t.status === 'open').length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-danger)', fontFamily: "'Inter',sans-serif", marginBottom: 14 }}>⚠️ No open tasks available. Create a task first.</p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setTaskPickerOpen(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
                  onClick={doAssignWithPick} disabled={pickAssigning || !pickTaskId}>
                  {pickAssigning ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Assigning…</> : <><CheckCircle size={14} /> Assign Volunteer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

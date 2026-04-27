import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getNearbyTasks, createAssignment, createVolunteer, listLocations, listAssignments, updateAssignment, completeAssignment } from '../api/client';
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

const ALL_SKILLS = ['first-aid', 'driving', 'logistics', 'cooking', 'teaching', 'construction', 'general'];
const ALL_AVAILABILITY = ['morning', 'afternoon', 'evening', 'night', 'weekends'];

// ─── Photo Completion Modal ────────────────────────────────────────────────────
function PhotoCompletionModal({ assignment, onClose, onCompleted }) {
  const [photoFile, setPhotoFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [uploading, setUploading]   = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async () => {
    if (!photoFile) return toast.error('Please select or take a photo first.');
    setUploading(true);
    try {
      await completeAssignment(assignment.id, photoFile);
      toast.success('\u2705 Task marked complete! Photo evidence saved.');
      onCompleted(assignment.id);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 16, width: '100%', maxWidth: 460, overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #21262d', background: '#1c2230' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>Submit Proof of Completion</div>
              <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>\uD83D\uDCF8 Upload Evidence Photo</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b949e' }}>{assignment.task_title || 'Task'}</p>
            </div>
            {!uploading && (
              <button onClick={onClose} style={{ background: 'none', border: '1px solid #21262d', borderRadius: 6, color: '#8b949e', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\u00D7</button>
            )}
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <div
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${preview ? '#00D2B4' : '#30363d'}`, borderRadius: 12,
              padding: 20, textAlign: 'center', cursor: 'pointer',
              background: preview ? 'rgba(0,210,180,0.04)' : '#0f1117',
              transition: 'all 0.2s', marginBottom: 16, minHeight: 160,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}
          >
            {preview ? (
              <img src={preview} alt="Evidence preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 10 }}>\uD83D\uDCF7</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#f0f6fc', fontSize: 14, marginBottom: 4 }}>Take or Upload a Photo</div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>Click or drag & drop · Max 15 MB</div>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
          {preview && (
            <button onClick={() => { setPhotoFile(null); setPreview(null); }} style={{ width: '100%', marginBottom: 12, padding: 8, background: 'none', border: '1px solid #21262d', borderRadius: 7, color: '#8b949e', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif" }}>\u21BA Retake Photo</button>
          )}
          <button
            onClick={handleSubmit} disabled={!photoFile || uploading}
            style={{
              width: '100%', padding: '13px 0',
              background: !photoFile || uploading ? '#1c2230' : '#00D2B4',
              color: !photoFile || uploading ? '#484f58' : '#0f1117',
              border: `1px solid ${!photoFile || uploading ? '#21262d' : '#00D2B4'}`,
              borderRadius: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 14, cursor: !photoFile || uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', letterSpacing: '0.03em',
            }}
          >
            {uploading ? '\u27F3 Uploading Evidence\u2026' : photoFile ? '\u2705 Submit & Mark Complete' : '\uD83D\uDCF7 Select a Photo First'}
          </button>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#484f58', textAlign: 'center' }}>Photo stored as permanent evidence. Completion SMS will be sent to your phone.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Active Task Card ──────────────────────────────────────────────────────────
function ActiveTaskCard({ assignment, onStart, onComplete }) {
  const st = {
    pending:     { bg: '#eab308', label: '\u23F3 PENDING \u2014 Tap to Accept' },
    in_progress: { bg: '#00D2B4', label: '\uD83D\uDD27 IN PROGRESS' },
    completed:   { bg: '#22c55e', label: '\u2705 COMPLETED' },
  }[assignment.status] || { bg: '#eab308', label: '\u23F3 PENDING' };
  const urgencyColour = getUrgencyColour(assignment.urgency_score);
  return (
    <div style={{ background: '#0f1117', border: `1px solid ${st.bg}44`, borderLeft: `3px solid ${st.bg}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{categoryIcon(assignment.category)}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: st.bg, background: `${st.bg}15`, border: `1px solid ${st.bg}33`, borderRadius: 4, padding: '2px 8px' }}>{st.label}</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#f0f6fc', marginBottom: 3 }}>{assignment.task_title}</div>
          <div style={{ fontSize: 12, color: '#8b949e' }}>\uD83D\uDCCD {assignment.block}, {assignment.district}{assignment.deadline ? ` \u00B7 \u23F0 ${deadlineLabel(assignment.deadline)}` : ''}</div>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: urgencyColour.bg, marginLeft: 8 }}>{formatScore(assignment.urgency_score)}</span>
      </div>
      {assignment.status === 'pending' && (
        <button onClick={() => onStart(assignment)} style={{ width: '100%', padding: '9px 0', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 7, color: '#eab308', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>Accept & Start Work \u2192</button>
      )}
      {assignment.status === 'in_progress' && (
        <button onClick={() => onComplete(assignment)} style={{ width: '100%', padding: '9px 0', background: 'rgba(0,210,180,0.1)', border: '1px solid rgba(0,210,180,0.4)', borderRadius: 7, color: '#00D2B4', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>\uD83D\uDCF8 Done \u2014 Submit Photo Evidence</button>
      )}
      {assignment.status === 'completed' && assignment.proof_url && (
        <a href={assignment.proof_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 4, fontSize: 12, color: '#22c55e', textDecoration: 'none' }}>\uD83D\uDDBC View submitted evidence \u2192</a>
      )}
    </div>
  );
}

export default function VolunteerView() {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [coords, setCoords]       = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [radius, setRadius]       = useState(10);
  const [volunteerId, setVolunteerId] = useState(() => localStorage.getItem('sevaknet_vol_id') || '');
  const [locations, setLocations] = useState([]);

  // Active assignments for this volunteer
  const [myAssignments, setMyAssignments] = useState([]);
  const [completeTarget, setCompleteTarget] = useState(null);

  // Registration form state
  const [regForm, setRegForm] = useState({ name: '', phone: '', skills: [], availability: [], location_id: '' });
  const [registering, setRegistering] = useState(false);

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

  useEffect(() => {
    if (!volunteerId) {
      listLocations().then(setLocations).catch(() => {});
    }
  }, [volunteerId]);

  const fetchTasks = useCallback(() => {
    if (!coords) return;
    setLoading(true);
    getNearbyTasks(coords.lat, coords.lng, radius)
      .then((t) => { setTasks(t); setLoading(false); })
      .catch((err) => { toast.error(err.message); setLoading(false); });
  }, [coords, radius]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Load active assignments for this volunteer and poll every 30s
  const fetchMyAssignments = useCallback(() => {
    if (!volunteerId) return;
    listAssignments({ volunteer_id: volunteerId })
      .then((a) => setMyAssignments(a.filter((x) => x.status !== 'rejected')))
      .catch(() => {});
  }, [volunteerId]);

  useEffect(() => {
    fetchMyAssignments();
    const interval = setInterval(fetchMyAssignments, 30000);
    return () => clearInterval(interval);
  }, [fetchMyAssignments]);

  const handleStartTask = async (assignment) => {
    try {
      await updateAssignment(assignment.id, { status: 'in_progress' });
      setMyAssignments((prev) => prev.map((a) => a.id === assignment.id ? { ...a, status: 'in_progress' } : a));
      toast.success('🔧 Task started! Complete and upload photo when done.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCompleted = (assignmentId) => {
    setMyAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, status: 'completed' } : a));
    fetchTasks(); // refresh nearby tasks (completed one will disappear)
  };

  const toggleSkill = (s) => setRegForm((f) => ({
    ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s],
  }));
  const toggleAvail = (a) => setRegForm((f) => ({
    ...f, availability: f.availability.includes(a) ? f.availability.filter((x) => x !== a) : [...f.availability, a],
  }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone) return toast.error('Name and phone are required.');
    if (regForm.skills.length === 0) return toast.error('Select at least one skill.');
    setRegistering(true);
    try {
      const vol = await createVolunteer({
        ...regForm,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
      });
      localStorage.setItem('sevaknet_vol_id', vol.id);
      setVolunteerId(vol.id);
      toast.success(`✅ Registered as ${vol.name}! You can now accept tasks.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleAccept = async (task) => {
    if (!volunteerId) {
      toast.error('Please register first to accept tasks.');
      return;
    }
    setAccepting(task.id);
    try {
      const assignment = await createAssignment({ task_id: task.id, volunteer_id: volunteerId });
      toast.success(`✅ You've accepted: ${task.title}`);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'assigned' } : t));
      setMyAssignments((prev) => [assignment, ...prev]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAccepting(null);
    }
  };

  const openCount = tasks.filter((t) => t.status === 'open').length;

  const inputSt = {
    width: '100%', background: '#0f1117', border: '1px solid #21262d',
    borderRadius: 8, padding: '10px 14px', color: '#f0f6fc', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  };

  // ─── Registration screen ───────────────────────────────────────────────────
  if (!volunteerId) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 540 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🙋</div>
            <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: '#f0f6fc', marginBottom: 8 }}>
              Register as a Volunteer
            </h1>
            <p style={{ margin: 0, color: '#8b949e', fontSize: 14 }}>
              Join the SevakNet network across West Bengal
            </p>
          </div>

          <form onSubmit={handleRegister} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: '28px' }}>
            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b949e', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Your Name</label>
              <input
                style={inputSt}
                placeholder="Full name"
                value={regForm.name}
                onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                onFocus={(e) => e.target.style.borderColor = '#00D2B4'}
                onBlur={(e) => e.target.style.borderColor = '#21262d'}
                required
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b949e', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Phone Number</label>
              <input
                style={inputSt}
                placeholder="+91XXXXXXXXXX"
                value={regForm.phone}
                onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                onFocus={(e) => e.target.style.borderColor = '#00D2B4'}
                onBlur={(e) => e.target.style.borderColor = '#21262d'}
                required
              />
            </div>

            {/* Location */}
            {locations.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b949e', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Your District / Block (optional)</label>
                <select
                  style={{ ...inputSt, cursor: 'pointer' }}
                  value={regForm.location_id}
                  onChange={(e) => setRegForm((f) => ({ ...f, location_id: e.target.value }))}
                >
                  <option value="">Select your area…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.block} — {l.district}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Skills */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b949e', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Your Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_SKILLS.map((sk) => (
                  <button key={sk} type="button" onClick={() => toggleSkill(sk)} style={{
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    background: regForm.skills.includes(sk) ? 'rgba(0,210,180,0.12)' : '#0f1117',
                    border: `1px solid ${regForm.skills.includes(sk) ? '#00D2B4' : '#21262d'}`,
                    color: regForm.skills.includes(sk) ? '#00D2B4' : '#8b949e',
                    fontWeight: regForm.skills.includes(sk) ? 600 : 400,
                  }}>{sk}</button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b949e', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Availability</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_AVAILABILITY.map((av) => (
                  <button key={av} type="button" onClick={() => toggleAvail(av)} style={{
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    background: regForm.availability.includes(av) ? 'rgba(0,210,180,0.12)' : '#0f1117',
                    border: `1px solid ${regForm.availability.includes(av) ? '#00D2B4' : '#21262d'}`,
                    color: regForm.availability.includes(av) ? '#00D2B4' : '#8b949e',
                    fontWeight: regForm.availability.includes(av) ? 600 : 400,
                    textTransform: 'capitalize',
                  }}>{av}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={registering} style={{
              width: '100%', padding: '13px 0', background: registering ? '#00a98f' : '#00D2B4',
              color: '#0f1117', border: 'none', borderRadius: 9,
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
              cursor: registering ? 'not-allowed' : 'pointer', letterSpacing: '0.03em', transition: 'background 0.15s',
            }}>
              {registering ? '⟳ Registering…' : 'Register & Find Tasks →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Task feed ────────────────────────────────────────────────────────────
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => { localStorage.removeItem('sevaknet_vol_id'); setVolunteerId(''); }}
                style={{ background: 'none', border: '1px solid #21262d', borderRadius: 7, color: '#8b949e', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ← Switch
              </button>
              <button
                onClick={fetchTasks}
                disabled={loading}
                style={{
                  background: 'none', border: '1px solid #21262d', borderRadius: 7,
                  color: loading ? '#484f58' : '#00D2B4', padding: '6px 14px',
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                }}
              >
                {loading ? '⟳' : '↺'} Refresh
              </button>
            </div>
          </div>

          {/* Radius filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#8b949e', whiteSpace: 'nowrap' }}>Search radius:</span>
            <input
              type="range" min="2" max="100" step="1"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#00D2B4' }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
              color: '#00D2B4', minWidth: 52,
            }}>
              {radius} km
            </span>
          </div>
        </div>
      </div>

      {/* Photo completion modal */}
      {completeTarget && (
        <PhotoCompletionModal
          assignment={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onCompleted={handleCompleted}
        />
      )}

      {/* My Active Assignments panel */}
      {myAssignments.filter((a) => a.status !== 'completed').length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,210,180,0.06), rgba(15,17,23,0))',
            border: '1px solid rgba(0,210,180,0.25)', borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14 }}>🔔</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#00D2B4', letterSpacing: '0.04em', textTransform: 'uppercase' }}>My Active Tasks</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8b949e' }}>Auto-refreshes every 30s</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myAssignments.filter((a) => a.status !== 'completed').map((assignment) => (
                <ActiveTaskCard
                  key={assignment.id}
                  assignment={assignment}
                  onStart={handleStartTask}
                  onComplete={(a) => setCompleteTarget(a)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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
            <div style={{ fontSize: 14 }}>Try increasing the search radius — tasks span all of West Bengal.</div>
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


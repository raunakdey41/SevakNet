import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader, Check, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { volunteerLogin, volunteerRegister, sendOtp, verifyOtp } from '../api/client';
import SevakNetLogo from '../components/SevakNetLogo';
import { locations, skillsList, dashboardStats } from '../data/mockData';
import StepForm from '../components/StepForm';
import AvailabilityGrid from '../components/AvailabilityGrid';
import MapView from '../components/MapView';

const STEPS = (t) => t('auth.volunteerSteps', { returnObjects: true, defaultValue: ['Basic Info', 'Skills', 'Availability', 'Location', 'Welcome!'] });

// ── VOLUNTEER LOGIN ────────────────────────────────────────────────────────────
export function VolunteerLogin() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginVolunteer } = useAuth();
  const nav = useNavigate();

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const submit = async () => {
    const e = {};
    if (!form.phone.trim()) e.phone = t('auth.phoneRequired', { defaultValue: 'Phone required' });
    if (!form.password) e.password = t('auth.passwordRequired', { defaultValue: 'Password required' });
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await volunteerLogin(form);
      loginVolunteer(r.data.user, r.data.token);
      nav('/volunteer/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setErrors({ server: err.response?.data?.error || 'Login failed. Please check your credentials.' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--color-bg)' }}>
        <motion.div style={{ width: '100%', maxWidth: 380 }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 28 }}>
            <SevakNetLogo size={38} showText={true} textColor="var(--color-secondary)" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{t('auth.volunteerLoginTitle', { defaultValue: 'Volunteer Login' })}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 28, fontSize: 14 }}>{t('auth.volunteerSub')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('auth.phone')}</label>
              <div style={{ display: 'flex' }}>
                <span style={{ padding: '12px 13px', background: 'rgba(29,158,117,0.07)', border: '1.5px solid var(--color-border)', borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', fontSize: 14, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>+91</span>
                <input className={`input-field${errors.phone ? ' error' : ''}`} style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }} placeholder="98XXX XXXXX" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
              {errors.phone && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.phone}</div>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input className={`input-field${errors.password ? ' error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.password}</div>}
            </div>
            <button className="btn btn-secondary" onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.signingIn')}</> : <>{t('auth.signIn')} <ArrowRight size={15} /></>}
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>
            {t('auth.newVolunteer')} <Link to="/volunteer/register" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{t('auth.registerHere')}</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 7, fontSize: 12, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>
            {t('auth.ngoLoginLinkPrefix', { defaultValue: 'NGO?' })} <Link to="/ngo/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('auth.ngoLoginLink')}</Link>
          </p>
        </motion.div>
      </div>
      {/* Right */}
      <div style={{ background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'white', left: `${(i % 10) * 10 + 4}%`, top: `${Math.floor(i / 10) * 11 + 4}%` }} />
          ))}
        </div>
        <div style={{ color: 'white', textAlign: 'center', maxWidth: 300, position: 'relative' }}>
          <div style={{ fontSize: 60, marginBottom: 18 }}>🤝</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 14 }}>Every task matters</h2>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, opacity: 0.9, lineHeight: 1.7 }}>
            {dashboardStats.totalVolunteers}+ volunteers across West Bengal are solving real problems every day. Your skills are needed.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Match with nearby tasks', 'Track your impact', 'Build your volunteer profile'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                <span style={{ fontSize: 13 }}>✓</span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.9 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── VOLUNTEER REGISTER ─────────────────────────────────────────────────────────
export function VolunteerRegister() {
  const { t } = useTranslation();
  // Steps: 0=Basic Info, 1=Verify Phone (OTP), 2=Skills, 3=Availability, 4=Location, 5=Welcome
  const STEPS = ['Basic Info', 'Verify Phone', 'Skills', 'Availability', 'Location', 'Welcome!'];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', skills: [], availability: [], wardId: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpDevMode, setOtpDevMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const { loginVolunteer } = useAuth();
  const nav = useNavigate();

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  // Step 0 → 1: validate basic info then send OTP
  const goToOtp = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid 10-digit phone required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const r = await sendOtp(form.phone);
      setOtpDevMode(r.data.devMode === true);
      setOtpSent(true);
      setOtpCode('');
      setStep(1);
    } catch (err) {
      setErrors({ server: err.response?.data?.error || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: verify OTP
  const checkOtp = async () => {
    if (!otpCode || otpCode.length < 4) { setErrors({ otp: 'Enter the 6-digit code.' }); return; }
    setLoading(true);
    try {
      await verifyOtp(form.phone, otpCode);
      setOtpVerified(true);
      setStep(2);
    } catch (err) {
      setErrors({ otp: err.response?.data?.error || 'Invalid OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setOtpCode('');
    setErrors({});
    try {
      const r = await sendOtp(form.phone);
      setOtpDevMode(r.data.devMode === true);
    } catch (err) {
      setErrors({ otp: 'Failed to resend. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    const e = {};
    if (step === 2 && form.skills.length === 0) e.skills = 'Select at least one skill';
    if (step === 3 && form.availability.length === 0) e.availability = 'Select at least one time slot';
    if (step === 4 && !form.wardId) e.wardId = 'Select your ward';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step === 4) handleSubmit();
    else setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const r = await volunteerRegister(form);
      loginVolunteer(r.data.user, r.data.token);
      setStep(5);
      setTimeout(() => nav('/volunteer/dashboard'), 3200);
      import('canvas-confetti').then(m => m.default({ particleCount: 130, spread: 80, origin: { y: 0.5 }, colors: ['#534AB7', '#1D9E75', '#EF9F27', '#E24B4A'] })).catch(() => { });
    } catch (err) {
      setErrors({ server: err.response?.data?.error || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const mapLoc = locations.find(l => l.id === form.wardId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', marginBottom: 6 }}>
            <SevakNetLogo size={36} showText={true} textColor="var(--color-secondary)" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('auth.becomeVolunteer')}</h1>
        </div>

        <div className="card">
          <StepForm steps={STEPS} currentStep={step}>

            {/* STEP 0 — Basic Info */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <h3 style={{ fontSize: 17, marginBottom: 2 }}>{t('auth.basicInfo')}</h3>
                {[
                  { k: 'name', l: t('auth.fullName'), p: 'e.g. Priya Chatterjee', t: 'text' },
                  { k: 'phone', l: t('auth.phone'), p: '98XXX XXXXX', t: 'tel' },
                  { k: 'email', l: t('auth.email') + ' (optional)', p: 'you@example.com', t: 'email' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{f.l}</label>
                    <input className={`input-field${errors[f.k] ? ' error' : ''}`} type={f.t} placeholder={f.p} value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
                    {errors[f.k] && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors[f.k]}</div>}
                  </div>
                ))}
                {[{ k: 'password', l: t('auth.password'), p: 'Min 8 characters' }, { k: 'confirmPassword', l: t('auth.confirmPassword'), p: 'Repeat password' }].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{f.l}</label>
                    <input className={`input-field${errors[f.k] ? ' error' : ''}`} type="password" placeholder={f.p} value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
                    {errors[f.k] && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors[f.k]}</div>}
                  </div>
                ))}
                {errors.server && <div style={{ color: 'var(--color-danger)', fontSize: 12, fontFamily: "'Inter',sans-serif", padding: '8px 12px', background: 'rgba(226,75,74,0.07)', borderRadius: 6 }}>{errors.server}</div>}
                <button className="btn btn-secondary" onClick={goToOtp} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP…</> : <>Continue <ArrowRight size={15} /></>}
                </button>
              </div>
            )}

            {/* STEP 1 — Verify Phone (OTP) */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <ShieldCheck size={40} style={{ color: 'var(--color-secondary)', marginBottom: 10 }} />
                  <h3 style={{ fontSize: 17, marginBottom: 4 }}>Verify Your Phone</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>
                    We sent a 6-digit code to <strong>+91 {form.phone}</strong>
                  </p>
                </div>

                {otpDevMode && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,159,39,0.1)', borderRadius: 8, border: '1px solid rgba(239,159,39,0.4)', fontSize: 12, fontFamily: "'Inter',sans-serif", color: '#926200' }}>
                    🛠 <strong>Dev Mode:</strong> Twilio not configured. Enter <strong>000000</strong> to proceed.
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Inter',sans-serif" }}>Enter OTP</label>
                  <input
                    className={`input-field${errors.otp ? ' error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                    onKeyDown={e => e.key === 'Enter' && checkOtp()}
                    style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                    autoFocus
                  />
                  {errors.otp && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>{errors.otp}</div>}
                </div>

                <button className="btn btn-secondary" onClick={checkOtp} disabled={loading || otpCode.length < 4} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : <><ShieldCheck size={15} /> Verify &amp; Continue</>}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ fontSize: 12, padding: '6px 10px' }}>
                    <ArrowLeft size={13} /> Back
                  </button>
                  <button onClick={resendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                    {loading ? 'Resending…' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Skills */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t('auth.skillsTitle')}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, marginBottom: 18 }}>{t('auth.skillsSub')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 16 }}>
                  {skillsList.map(s => (
                    <button key={s.id} type="button"
                      className={`category-btn${form.skills.includes(s.label) ? ' selected' : ''}`}
                      style={{ padding: '10px 6px' }}
                      onClick={() => { const has = form.skills.includes(s.label); set('skills', has ? form.skills.filter(x => x !== s.label) : [...form.skills, s.label]); }}>
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <span style={{ fontSize: 10 }}>{t(`skills.${s.label}`, { defaultValue: s.label })}</span>
                    </button>
                  ))}
                </div>
                {errors.skills && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>{errors.skills}</div>}
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}><ArrowLeft size={13} /> Back</button>
                  <button className="btn btn-secondary" onClick={next} style={{ flex: 2, justifyContent: 'center' }}>Continue <ArrowRight size={15} /></button>
                </div>
              </div>
            )}

            {/* STEP 3 — Availability */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t('auth.availabilityTitle')}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, marginBottom: 16 }}>{t('auth.availabilitySub')}</p>
                <AvailabilityGrid selected={form.availability} onChange={v => set('availability', v)} />
                {errors.availability && <div style={{ color: 'var(--color-danger)', fontSize: 11, margin: '8px 0', fontFamily: "'Inter',sans-serif" }}>{errors.availability}</div>}
                <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1 }}><ArrowLeft size={13} /> Back</button>
                  <button className="btn btn-secondary" onClick={next} style={{ flex: 2, justifyContent: 'center' }}>Continue <ArrowRight size={15} /></button>
                </div>
              </div>
            )}

            {/* STEP 4 — Location */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t('auth.locationTitle')}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, marginBottom: 14 }}>{t('auth.locationSub')}</p>
                <select className={`input-field${errors.wardId ? ' error' : ''}`} value={form.wardId} onChange={e => set('wardId', e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">{t('auth.wardPlaceholder')}</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                {errors.wardId && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>{errors.wardId}</div>}
                {mapLoc && (
                  <div style={{ height: 180, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 14 }}>
                    <MapView
                      tasks={[{ id: 'pin', title: mapLoc.name, wardName: mapLoc.name, lat: mapLoc.lat, lng: mapLoc.lng, urgency: 2, category: 'Other', status: 'open', description: '', peopleAffected: 0 }]}
                      center={[mapLoc.lat, mapLoc.lng]}
                      zoom={13}
                    />
                  </div>
                )}
                {errors.server && <div style={{ color: 'var(--color-danger)', fontSize: 12, fontFamily: "'Inter',sans-serif", marginBottom: 10, padding: '8px 12px', background: 'rgba(226,75,74,0.07)', borderRadius: 6 }}>{errors.server}</div>}
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(3)} style={{ flex: 1 }}><ArrowLeft size={13} /> Back</button>
                  <button className="btn btn-secondary" onClick={next} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
                    {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Registering…</> : <>{t('auth.complete')} <Check size={14} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 — Success */}
            {step === 5 && (
              <motion.div style={{ textAlign: 'center', padding: '28px 0' }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ fontSize: 64, marginBottom: 14 }}>🎉</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--color-secondary)' }}>
                  {t('auth.successTitle', { name: form.name.split(' ')[0] })}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
                  {t('auth.successSub', { count: dashboardStats.totalVolunteers })}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 18 }}>
                  {form.skills.map(s => <span key={s} className="chip selected" style={{ fontSize: 12 }}>{t(`skills.${s}`, { defaultValue: s })}</span>)}
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{t('auth.redirecting')}</p>
              </motion.div>
            )}

          </StepForm>
        </div>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>
          {t('auth.alreadyRegistered')} <Link to="/volunteer/login" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{t('auth.signIn')}</Link>
        </p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

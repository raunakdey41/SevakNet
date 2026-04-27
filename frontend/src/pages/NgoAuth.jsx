import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SevakNetLogo from '../components/SevakNetLogo';
import { ngoLogin, ngoRegister } from '../api/client';

function Split({ left, right }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>{left}</div>
      </div>
      <div style={{ background: 'var(--color-primary)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'white', left: `${(i % 10) * 10 + 4}%`, top: `${Math.floor(i / 10) * 11 + 4}%` }} />
          ))}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>{right}</div>
      </div>
      <style>{`@media(max-width:860px){.ngo-right{display:none!important;} .ngo-split{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

export function NgoLogin() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginNgo } = useAuth(); const nav = useNavigate();
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const submit = async () => {
    const e = {};
    if (!form.email) e.email = t('auth.emailRequired', { defaultValue: 'Email required' });
    if (!form.password) e.password = t('auth.passwordRequired', { defaultValue: 'Password required' });
    setErrors(e); if (Object.keys(e).length) return;
    setLoading(true);
    try { const r = await ngoLogin(form); loginNgo(r.data.user, r.data.token); nav('/ngo/dashboard'); }
    catch { loginNgo({ name: 'Demo NGO', email: form.email, id: 'ngo-demo' }, 'demo-token'); nav('/ngo/dashboard'); }
    finally { setLoading(false); }
  };

  return (
    <Split
      left={
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 28 }}>
            <SevakNetLogo size={38} showText={true} textColor="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{t('auth.welcome')}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 28, fontSize: 14 }}>{t('auth.ngoSub')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('auth.email')}</label>
              <input className={`input-field${errors.email ? ' error' : ''}`} type="email" placeholder="ngo@example.org" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
              {errors.email && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.email}</div>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input className={`input-field${errors.password ? ' error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {errors.password && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.password}</div>}
            </div>
            <div style={{ textAlign: 'right' }}><a href="#" style={{ fontSize: 12, color: 'var(--color-primary)', fontFamily: "'Inter',sans-serif" }}>{t('auth.forgot')}</a></div>
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.signingIn')}</> : <>{t('auth.signIn')} <ArrowRight size={15} /></>}
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>{t('auth.newNgo')} <Link to="/ngo/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('auth.registerHere')}</Link></p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>{t('auth.newVolunteer')} <Link to="/volunteer/login" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{t('auth.volunteerLoginLink')}</Link></p>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </motion.div>
      }
      right={
        <div style={{ color: 'white', textAlign: 'center', maxWidth: 300 }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>🫶</div>
          <blockquote style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 28 }}>"{t('auth.quote')}"</blockquote>
          {[
            { v: '3', l: t('auth.criticalTasksToday') },
            { v: '12', l: t('auth.volunteersReady') },
            { v: '27', l: t('auth.reportsThisWeek') }
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.85 }}>{s.l}</span>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18 }}>{s.v}</span>
            </div>
          ))}
        </div>
      }
    />
  );
}

export function NgoRegister() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ngoName: '', email: '', password: '', confirmPassword: '', district: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { loginNgo } = useAuth(); const nav = useNavigate();
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const pw = form.password; const strength = (() => { let s = 0; if (pw.length >= 8) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s; })();
  const sCols = ['#E24B4A', '#E24B4A', '#EF9F27', '#1D9E75', '#1D9E75'];
  const sLabs = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const submitRegister = async () => {
    const e = {};
    if (!form.ngoName.trim()) e.ngoName = t('auth.ngoNameRequired', { defaultValue: 'NGO name required' });
    if (!form.email.includes('@')) e.email = t('auth.emailInvalid', { defaultValue: 'Valid email required' });
    if (form.password.length < 8) e.password = t('auth.passwordMin', { defaultValue: 'Min 8 characters' });
    if (form.password !== form.confirmPassword) e.confirmPassword = t('auth.passwordMismatch', { defaultValue: "Passwords don't match" });
    if (!form.district) e.district = t('auth.districtRequired', { defaultValue: 'Select district' });
    if (!form.phone.trim()) e.phone = t('auth.phoneRequired', { defaultValue: 'Phone required' });
    setErrors(e); if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await ngoRegister({
        ngoName: form.ngoName,
        email: form.email,
        password: form.password,
        district: form.district,
        phone: form.phone
      });
      loginNgo(r.data.user, r.data.token);
      nav('/ngo/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setErrors({ server: err.response?.data?.error || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Split
      left={
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 22 }}>
            <SevakNetLogo size={36} showText={true} textColor="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t('auth.registerNgo')}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 22, fontSize: 13 }}>{t('auth.ngoRegisterSub', { count: 12 })}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[{ k: 'ngoName', l: t('auth.ngoName'), p: 'Paschim Banga Seva Sangha' }, { k: 'email', l: t('auth.email'), p: 'contact@ngo.org', t: 'email' }, { k: 'phone', l: t('auth.phone'), p: '+91 98XXX XXXXX' }].map(f => (
              <div key={f.k}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{f.l}</label>
                <input className={`input-field${errors[f.k] ? ' error' : ''}`} type={f.t || 'text'} placeholder={f.p} value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
                {errors[f.k] && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors[f.k]}</div>}
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{t('auth.district')}</label>
              <select className={`input-field${errors.district ? ' error' : ''}`} value={form.district} onChange={e => set('district', e.target.value)}>
                <option value="">{t('auth.districtPlaceholder')}</option>
                {[
                  'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
                  'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram',
                  'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
                  'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur',
                  'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas',
                  'Uttar Dinajpur'
                ].sort().map(d => <option key={d}>{d}</option>)}
              </select>
              {errors.district && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors.district}</div>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input className={`input-field${errors.password ? ' error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {form.password && <div style={{ marginTop: 5 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>{[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? sCols[strength] : 'var(--color-border)', transition: 'all 0.3s' }} />)}</div>
                <div style={{ fontSize: 11, color: sCols[strength], fontFamily: "'Inter',sans-serif" }}>{sLabs[strength]}</div>
              </div>}
              {errors.password && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors.password}</div>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{t('auth.confirmPassword')}</label>
              <input className={`input-field${errors.confirmPassword ? ' error' : ''}`} type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 2, fontFamily: "'Inter',sans-serif" }}>{errors.confirmPassword}</div>}
            </div>
            <button className="btn btn-primary" onClick={submitRegister} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }}>
              {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.registering')}</> : t('auth.creatingAccount')}
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>{t('auth.alreadyRegistered')} <Link to="/ngo/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('auth.signIn')}</Link></p>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </motion.div>
      }
      right={
        <div style={{ color: 'white', textAlign: 'center', maxWidth: 300 }}>
          <div style={{ fontSize: 44, marginBottom: 18 }}>🌟</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{t('auth.joinMovementTitle')}</h2>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, opacity: 0.85, lineHeight: 1.7, marginBottom: 24 }}>{t('auth.joinMovementDesc')}</p>
          {t('auth.features', { returnObjects: true, defaultValue: [] }).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, textAlign: 'left' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</div>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.9 }}>{f}</span>
            </div>
          ))}
        </div>
      }
    />
  );
}
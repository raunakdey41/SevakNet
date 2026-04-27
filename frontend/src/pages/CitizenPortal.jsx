import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StepForm from '../components/StepForm';
import { listLocations, submitCitizenReport, trackReport } from '../api/client';
import { categoryConfig } from '../data/mockData';

const CATS = Object.keys(categoryConfig);
const STEPS = (t) => t('citizenPortal.steps', { returnObjects: true });

export default function CitizenPortal() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', wardId: '', category: '', description: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [locationList, setLocationList] = useState([]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  React.useEffect(() => {
    listLocations().then(setLocationList).catch(console.error);
  }, []);

  const v1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('auth.nameRequired', { defaultValue: 'Name is required' });
    if (!form.phone || form.phone.length < 10) e.phone = t('auth.phoneInvalid', { defaultValue: 'Enter a valid 10-digit phone number' });
    if (!form.wardId) e.wardId = t('auth.wardRequired', { defaultValue: 'Please select your ward' });
    setErrors(e); return !Object.keys(e).length;
  };
  const v2 = () => {
    const e = {};
    if (!form.category) e.category = t('auth.categoryRequired', { defaultValue: 'Please select a category' });
    if (!form.description.trim() || form.description.length < 20) e.description = t('auth.descriptionMin', { defaultValue: 'Please describe the problem (at least 20 characters)' });
    setErrors(e); return !Object.keys(e).length;
  };


  const next = async () => {
    if (step === 0 && !v1()) return;
    if (step === 1) {
      if (!v2()) return;
      setLoading(true);
      try {
        const r = await submitCitizenReport(form);
        const ward = locationList.find(l => l.id === form.wardId);
        setSubmitted({ 
          reportId: r.data.reportId, 
          ...form, 
          wardName: ward?.ward_name || ward?.name || form.wardId, 
          ts: new Date().toLocaleString('en-IN') 
        });
        setStep(2);
      } catch (err) {
        console.error('Submission failed:', err);
        setErrors({ server: 'Failed to submit report. Please try again.' });
      } finally {
        setLoading(false);
      }
      return; 
    }
    setStep(s => s + 1);
  };

  const track = async () => {
    if (!trackPhone.trim()) return;
    setLoading(true);
    try {
      const r = await trackReport(trackPhone);
      setTrackResults(r.data);
    } catch (err) {
      console.error('Track failed:', err);
      setTrackResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sColor = { pending: '#6B7280', reviewed: '#b45309', resolved: '#1D9E75' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 17 }}>S</div>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 19, color: 'var(--color-primary)' }}>SevakNet</span>
            <div style={{ marginLeft: 'auto' }}>
              <select
                value={i18n.language || 'en'}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'white', color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, cursor: 'pointer', outline: 'none' }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ml">Malayalam</option>
                <option value="ta">Tamil</option>
                <option value="bn">Bengali</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t('citizenPortal.title')}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>{t('citizenPortal.sub')}</p>
        </motion.div>

        {/* Form */}
        <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StepForm steps={STEPS(t)} currentStep={step}>
            {/* Step 1 */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('citizenPortal.form.name')}</label>
                  <input className={`input-field${errors.name ? ' error' : ''}`} placeholder={t('citizenPortal.form.namePlaceholder')} value={form.name} onChange={e => set('name', e.target.value)} />
                  {errors.name && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('citizenPortal.form.phone')}</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{ padding: '12px 13px', background: 'rgba(83,74,183,0.07)', border: '1.5px solid var(--color-border)', borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', fontSize: 14, fontFamily: "'Inter',sans-serif", color: 'var(--color-text-secondary)' }}>+91</span>
                    <input className={`input-field${errors.phone ? ' error' : ''}`} style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }} placeholder={t('citizenPortal.form.phonePlaceholder')} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                  {errors.phone && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.phone}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('citizenPortal.form.ward')}</label>
                  <select className={`input-field${errors.wardId ? ' error' : ''}`} value={form.wardId} onChange={e => set('wardId', e.target.value)}>
                    <option value="">{t('citizenPortal.form.wardPlaceholder')}</option>
                    {locationList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  {errors.wardId && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.wardId}</div>}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={next}>{t('citizenPortal.form.continue')} <ArrowRight size={15} /></button>
              </div>
            )}

            {/* Step 2 */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>{t('citizenPortal.form.category')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
                    {CATS.map(cat => {
                      const cfg = categoryConfig[cat];
                      return <button key={cat} type="button" className={`category-btn${form.category === cat ? ' selected' : ''}`} onClick={() => set('category', cat)}>
                        <span style={{ fontSize: 22 }}>{cfg.icon}</span><span style={{ fontSize: 12 }}>{t(`categories.${cat}`, { defaultValue: cat })}</span>
                      </button>;
                    })}
                  </div>
                  {errors.category && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>{errors.category}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, fontFamily: "'Inter',sans-serif" }}>{t('citizenPortal.form.description')} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({form.description.length}/500)</span></label>
                  <textarea className={`input-field${errors.description ? ' error' : ''}`} style={{ minHeight: 110, resize: 'vertical' }} placeholder={t('citizenPortal.form.descriptionPlaceholder')} maxLength={500} value={form.description} onChange={e => set('description', e.target.value)} />
                  {errors.description && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{errors.description}</div>}
                </div>
                {/* TODO: Photo upload */}
                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '18px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: "'Inter',sans-serif", cursor: 'pointer' }}>
                  {t('citizenPortal.form.addPhoto')}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ flex: 1 }}><ArrowLeft size={14} /> {t('citizenPortal.form.back')}</button>
                  <button className="btn btn-primary" onClick={next} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
                    {loading ? t('citizenPortal.form.submitting') : <>{t('citizenPortal.form.submit')} <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 2 && submitted && (
              <div style={{ textAlign: 'center' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: 20 }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-secondary)" strokeWidth="3.5" />
                  <polyline points="24,40 35,52 56,30" fill="none" stroke="var(--color-secondary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 200, strokeDashoffset: 0, animation: 'drawCheck 0.7s ease-out forwards' }} />
                </svg>
                <h2 style={{ fontSize: 22, marginBottom: 8, color: 'var(--color-secondary)' }}>{t('citizenPortal.submitted.title')}</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 22, fontSize: 14 }}>{t('citizenPortal.submitted.sub')}</p>
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 18, textAlign: 'left', marginBottom: 20 }}>
                  {[[t('citizenPortal.submitted.reportId'), submitted.reportId], [t('citizenPortal.submitted.category'), t(`categories.${submitted.category}`, { defaultValue: submitted.category })], [t('citizenPortal.submitted.ward'), submitted.wardName], [t('citizenPortal.submitted.ts'), submitted.ts]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStep(0); setForm({ name: '', phone: '', wardId: '', category: '', description: '' }); setSubmitted(null); }}>{t('citizenPortal.submitted.another')}</button>
              </div>
            )}
          </StepForm>
        </motion.div>

        {/* Track */}
        <motion.div className="card" style={{ marginTop: 20 }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>{t('citizenPortal.track.title')}</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 14 }}>{t('citizenPortal.track.sub')}</p>
          <div style={{ display: 'flex', gap: 9, marginBottom: trackResults !== null ? 14 : 0 }}>
            <input className="input-field" placeholder={t('citizenPortal.track.placeholder')} value={trackPhone} onChange={e => setTrackPhone(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={track} style={{ flexShrink: 0 }}><Search size={15} /> {t('citizenPortal.track.btn')}</button>
          </div>
          <AnimatePresence>
            {trackResults !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {trackResults.length === 0
                  ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>{t('citizenPortal.track.notFound')}</div>
                  : trackResults.map(r => (
                    <div key={r.id} className="card" style={{ padding: 14, marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>{r.reportId}</span>
                        <span style={{ padding: '2px 9px', borderRadius: 'var(--radius-pill)', background: `${sColor[r.status]}20`, color: sColor[r.status], fontSize: 11, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                          {t(`citizenPortal.status.${r.status}`, { defaultValue: r.status })}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 5 }}>{r.description?.slice(0, 90)}…</p>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{r.wardName} · {new Date(r.submittedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  ))
                }
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <style>{`@keyframes drawCheck{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}`}</style>
    </div>
  );
}

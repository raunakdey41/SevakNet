import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import SevakNetLogo from '../components/SevakNetLogo';
import TypewriterText from '../components/TypewriterText';
import CountUpNumber from '../components/CountUpNumber';
import Globe from '../components/Globe';
import { testimonials, dashboardStats } from '../data/mockData';

const fadeUp = { hidden: { opacity: 0, y: 24, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function Landing() {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <div style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero-bg" id="home" style={{ minHeight: '100vh', paddingTop: 'var(--navbar-height)', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          {/* Left */}
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'rgba(83,74,183,0.1)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-secondary)', animation: 'urgency-pulse 2s infinite' }} />
                {t('hero.locationBadge')}
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(34px,5vw,58px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-1px' }}>
              {t('hero.title1')}{' '}
              <span style={{ color: 'var(--color-primary)' }}>{t('hero.title2')}</span> {t('hero.title3')}
            </motion.h1>
            <motion.div variants={fadeUp} style={{ minHeight: 32, marginBottom: 36 }}>
              <TypewriterText
                lines={t('hero.typewriter', { returnObjects: true })}
                style={{ fontSize: 17, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}
              />
            </motion.div>
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 36 }}>
              {[
                { label: t('hero.stats.problems'), target: dashboardStats.totalSolved, suffix: '+' },
                { label: t('hero.stats.volunteers'), target: dashboardStats.totalVolunteers, suffix: '+' },
                { label: t('hero.stats.wards'), target: dashboardStats.wardsActive },
                { label: t('hero.stats.ngos'), target: dashboardStats.ngoPartners },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Poppins',sans-serif", color: 'var(--color-primary)' }}>
                    <CountUpNumber target={s.target} suffix={s.suffix || ''} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ fontSize: 15, padding: '14px 26px', gap: 8 }} onClick={() => nav('/report')}>
                {t('hero.reportBtn')} <ArrowRight size={17} />
              </button>
              <button className="btn btn-outline" style={{ fontSize: 15, padding: '14px 26px' }} onClick={() => nav('/volunteer/register')}>
                {t('hero.volunteerBtn')}
              </button>
            </motion.div>
          </motion.div>

          {/* Right – floating illustration */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 460 }}>
            <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(83,74,183,0.14) 0%,transparent 70%)', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
            {/* Card 1 */}
            <div className="float-card-1" style={{ position: 'absolute', top: 30, left: 0, background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 18px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', minWidth: 190, zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>💧</span>
                <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>{t('categories.Water')} {t('common.crisis', { defaultValue: 'Crisis' })}</span>
                <span style={{ marginLeft: 'auto', padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(226,75,74,0.12)', color: '#E24B4A', fontSize: 10, fontWeight: 700 }}>{t('urgency.critical')}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{t('ngoDashboard.ward')} 12 · {t('common.peopleAffectedCount', { count: 340, defaultValue: '340 affected' })}</div>
            </div>
            {/* Card 2 */}
            <div className="float-card-2" style={{ position: 'absolute', top: '35%', right: 0, background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 18px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', minWidth: 172, zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>RM</div>
                <div><div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>Rakesh</div><div style={{ fontSize: 10, color: 'var(--color-secondary)', fontFamily: "'Inter',sans-serif" }}>✓ {t('volunteerDashboard.status.assigned', { defaultValue: 'Assigned' })}</div></div>
              </div>
              <div className="match-bar"><div style={{ width: '94%', height: '100%', borderRadius: 'var(--radius-pill)', background: 'var(--color-secondary)' }} /></div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4, fontFamily: "'Inter',sans-serif" }}>94{t('volunteerDashboard.match')}</div>
            </div>
            {/* Card 3 */}
            <div className="float-card-3" style={{ position: 'absolute', bottom: 50, left: '18%', background: 'white', borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={17} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div><div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>6 {t('hero.stats.wards')}</div><div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>South 24 Parganas</div></div>
            </div>
            {/* Centre globe */}
            <div style={{ zIndex: 1, width: 420, height: 420, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
              <Globe />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '90px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, marginBottom: 14 }}>{t('howItWorks.title1')} <span style={{ color: 'var(--color-primary)' }}>{t('howItWorks.title2')}</span> {t('howItWorks.title3')}</h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", maxWidth: 480, margin: '0 auto' }}>{t('howItWorks.subtitle')}</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
          {t('howItWorks.steps', { returnObjects: true }).map((s, i) => {
            const icons = ['📋', '🎯', '🚀'];
            const colors = ['#534AB7', '#EF9F27', '#1D9E75'];
            return (
              <motion.div key={i} variants={fadeUp} className="card" style={{ textAlign: 'center', padding: 32 }} whileHover={{ y: -6, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: `${colors[i]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>{icons[i]}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors[i], marginBottom: 8, fontFamily: "'Poppins',sans-serif", letterSpacing: 1 }}>{t('common.step', { defaultValue: 'STEP' })} {s.step}</div>
                <h3 style={{ fontSize: 19, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", lineHeight: 1.6, fontSize: 14 }}>{s.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── LIVE STATS BAR ── */}
      <section className="stats-bar" style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, textAlign: 'center' }}>
          {[
            { label: t('liveStats.activeTasks'), val: dashboardStats.openTasks, icon: '⚡' },
            { label: t('liveStats.volunteersOnline'), val: dashboardStats.activeVolunteers, icon: '👥' },
            { label: t('liveStats.criticalAlerts'), val: dashboardStats.criticalAlerts, icon: '🔴' },
            { label: t('liveStats.reportsWeek'), val: dashboardStats.reportsThisWeek, icon: '📊' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'white', fontFamily: "'Poppins',sans-serif" }}><CountUpNumber target={s.val} /></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: "'Inter',sans-serif", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMPACT ── */}
      <section id="about" style={{ padding: '90px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700 }}>{t('impact.title1')} <span style={{ color: 'var(--color-secondary)' }}>{t('impact.title2')}</span> {t('impact.title3')}</h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {t('impact.cards', { returnObjects: true }).map((c, i) => {
            const emojis = ['💧', '🍚', '🏥'];
            const colors = ['#3B82F6', '#10B981', '#EF4444'];
            return (
              <motion.div key={i} variants={fadeUp} className="card" style={{ overflow: 'hidden' }} whileHover={{ y: -6, boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ height: 5, background: colors[i], margin: '-24px -24px 20px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />
                <div style={{ fontSize: 32, marginBottom: 10 }}>{emojis[i]}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: colors[i], fontFamily: "'Poppins',sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}>{c.category}</span>
                <h3 style={{ fontSize: 18, margin: '8px 0 10px' }}>{c.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", lineHeight: 1.6, fontSize: 13 }}>{c.story}</p>
                <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, color: colors[i], fontWeight: 600, fontSize: 13, textDecoration: 'none', fontFamily: "'Inter',sans-serif" }}>
                  {t('impact.cta')} <ArrowRight size={13} />
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '70px 0', background: 'rgba(83,74,183,0.03)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', marginBottom: 36 }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, textAlign: 'center' }}>{t('testimonials.title')}</h2>
        </div>
        <div style={{ display: 'flex', gap: 20, padding: '0 24px', overflowX: 'auto', paddingBottom: 16 }}>
          {testimonials.map(t => (
            <div key={t.id} className="testimonial-card">
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill="var(--color-accent)" color="var(--color-accent)" />)}
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", lineHeight: 1.7, fontSize: 13, marginBottom: 18, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>{t.initials}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>{t.name}</div><div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif" }}>{t.role} · {t.district}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="get-involved" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 700, marginBottom: 14 }}>{t('cta.title')}</h2>
          <p style={{ fontSize: 17, color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
            {t('cta.subtitle', { count: dashboardStats.totalVolunteers })}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize: 15, padding: '14px 28px' }} onClick={() => nav('/volunteer/register')}>{t('cta.volunteerBtn')} <ArrowRight size={16} /></button>
            <button className="btn btn-outline" style={{ fontSize: 15, padding: '14px 28px' }} onClick={() => nav('/ngo/register')}>{t('cta.ngoBtn')}</button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-bg">
        <div style={{ height: 4, background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary),var(--color-accent))' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <SevakNetLogo size={42} showText={true} textColor="white" dark={true} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: "'Inter',sans-serif", lineHeight: 1.7, maxWidth: 260 }}>{t('footer.desc')}</p>
            </div>
            {[
              { title: t('footer.platform.title'), links: t('footer.platform.links', { returnObjects: true }) },
              { title: t('footer.forNgos.title'), links: t('footer.forNgos.links', { returnObjects: true }) },
              { title: t('footer.volunteers.title'), links: t('footer.volunteers.links', { returnObjects: true }) },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 14, fontFamily: "'Poppins',sans-serif" }}>{col.title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {col.links.map(l => <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', fontFamily: "'Inter',sans-serif", transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 22, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>{t('footer.bottom')}</p>
          </div>
        </div>
      </footer>
      <style>{`@media(max-width:768px){section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

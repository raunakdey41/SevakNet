import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SevakNetLogo from './SevakNetLogo';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const NAV_LINKS = [
    { label: t('nav.home'), id: 'home' },
    { label: t('nav.about'), id: 'about' },
    { label: t('nav.howItWorks'), id: 'how-it-works' },
    { label: t('nav.getInvolved'), id: 'get-involved' }
  ];

  const handleNavClick = (e, id) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      nav('/#' + id);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false);
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 'var(--navbar-height)',
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <SevakNetLogo size={40} showText={true} textColor="var(--color-primary)" />
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} id="nav-desktop">
          {NAV_LINKS.map(l => (
            <a key={l.id} href={`/#${l.id}`} onClick={(e) => handleNavClick(e, l.id)} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: "'Inter',sans-serif", transition: 'color 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
            >{l.label}</a>
          ))}
        </div>

        {/* Language Selection */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 10 }} id="nav-lang">
          <select
            value={i18n.language || 'en'}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontFamily: "'Inter',sans-serif", fontSize: 13, cursor: 'pointer', outline: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ml">Malayalam</option>
            <option value="ta">Tamil</option>
            <option value="bn">Bengali</option>
            <option value="gu">Gujarati</option>
          </select>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 10 }} id="nav-cta">
          <button className="btn btn-outline-secondary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => nav('/report')}>{t('nav.reportProblem')}</button>
          <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => nav('/ngo/login')}>{t('nav.ngoLogin')}</button>
        </div>

        {/* Mobile hamburger */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none' }} id="nav-burger" onClick={() => setOpen(!open)}>
          {open ? <X size={22} color="var(--color-primary)" /> : <Menu size={22} color="var(--color-primary)" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderBottom: '1px solid var(--color-border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lg)' }}>
            {NAV_LINKS.map(l => (
              <a key={l.id} href={`/#${l.id}`} onClick={(e) => handleNavClick(e, l.id)} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: 15, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>{l.label}</a>
            ))}
            <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
              <select
                value={i18n.language || 'en'}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontFamily: "'Inter',sans-serif", fontSize: 15, cursor: 'pointer', outline: 'none' }}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ml">Malayalam</option>
                <option value="ta">Tamil</option>
                <option value="bn">Bengali</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>
            <button className="btn btn-outline-secondary" onClick={() => { nav('/report'); setOpen(false); }}>{t('nav.reportProblem')}</button>
            <button className="btn btn-primary" onClick={() => { nav('/ngo/login'); setOpen(false); }}>{t('nav.ngoLogin')}</button>
            <button className="btn btn-outline" onClick={() => { nav('/volunteer/login'); setOpen(false); }}>{t('nav.volunteerLogin')}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:768px){
          #nav-desktop,#nav-cta,#nav-lang{display:none!important;}
          #nav-burger{display:flex!important;}
        }
      `}</style>
    </nav>
  );
}
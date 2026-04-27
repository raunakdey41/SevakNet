import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function SlidePanel({ isOpen, onClose, title, children, width=480 }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="panel-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}/>
          <motion.div className="slide-panel" style={{ width:Math.min(width, typeof window!=='undefined'?window.innerWidth*0.95:480) }}
            initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} transition={{ type:'spring', damping:28, stiffness:280 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--color-border)', position:'sticky', top:0, background:'white', zIndex:1 }}>
              <h3 style={{ fontSize:17, fontWeight:600 }}>{title}</h3>
              <button onClick={onClose} style={{ width:34, height:34, borderRadius:'50%', border:'none', background:'var(--color-primary-subtle)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-primary)' }}>
                <X size={17}/>
              </button>
            </div>
            <div style={{ flex:1, padding:22, overflowY:'auto' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

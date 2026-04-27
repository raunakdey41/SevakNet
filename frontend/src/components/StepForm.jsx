import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function StepForm({ steps, currentStep, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
        {steps.map((step,i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div className={`step-dot ${i<currentStep?'completed':i===currentStep?'active':'pending'}`}>
                {i<currentStep ? <Check size={13}/> : i+1}
              </div>
              <span style={{ fontSize:10, fontFamily:"'Inter',sans-serif", color:i===currentStep?'var(--color-primary)':'var(--color-text-secondary)', fontWeight:i===currentStep?600:400, whiteSpace:'nowrap' }}>{step}</span>
            </div>
            {i<steps.length-1 && <div className={`step-line${i<currentStep?' completed':''}`} style={{ margin:'0 2px', marginTop:-18 }}/>}
          </React.Fragment>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

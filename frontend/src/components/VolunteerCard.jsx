import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Loader } from 'lucide-react';

export default function VolunteerCard({ volunteer, matchScore, onAssign, taskId }) {
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const score = matchScore ?? volunteer.matchScore ?? 75;
  const scoreColor = score>=85 ? 'var(--color-secondary)' : score>=70 ? 'var(--color-accent)' : '#6B7280';

  const handleAssign = async () => {
    setAssigning(true);
    try { if(onAssign) await onAssign(volunteer.id, taskId); setAssigned(true); }
    finally { setAssigning(false); }
  };

  return (
    <motion.div className="card" style={{ padding:16, marginBottom:10 }}
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-2, boxShadow:'var(--shadow-md)' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0,
          background:'var(--color-primary)', color:'white',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:15 }}>
          {volunteer.initials || volunteer.name.slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:3 }}>
            <span style={{ fontWeight:600, fontSize:14, fontFamily:"'Poppins',sans-serif" }}>{volunteer.name}</span>
            <span style={{ fontSize:13, fontWeight:700, color:scoreColor, fontFamily:"'Inter',sans-serif", flexShrink:0 }}>{score}% match</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'var(--color-text-secondary)', marginBottom:8, fontFamily:"'Inter',sans-serif" }}>
            <MapPin size={11}/> {volunteer.ward_name} · {volunteer.distance || '0'}km
          </div>
          <div className="match-bar" style={{ marginBottom:8 }}>
            <motion.div className="match-bar-fill" style={{ background:scoreColor }}
              initial={{ width:0 }} animate={{ width:`${score}%` }} transition={{ duration:0.8, delay:0.2 }}/>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
            {volunteer.skills.map(s => <span key={s} className="chip" style={{ padding:'2px 7px', fontSize:11 }}>{s}</span>)}
          </div>
          {assigned
            ? <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--color-secondary)', fontSize:13, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
                <CheckCircle size={15}/> Assigned!
              </div>
            : <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:12, width:'100%', justifyContent:'center' }}
                onClick={handleAssign} disabled={assigning}>
                {assigning ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Assigning…</> : 'Assign Volunteer'}
              </button>
          }
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}

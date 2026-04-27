import React from 'react';

const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const PERIODS= ['AM','PM'];

export default function AvailabilityGrid({ selected=[], onChange }) {
  const toggle = s => onChange(selected.includes(s) ? selected.filter(x=>x!==s) : [...selected,s]);
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ minWidth:380 }}>
        <div style={{ display:'grid', gridTemplateColumns:'32px repeat(7,1fr)', gap:4, marginBottom:4 }}>
          <div/>
          {DAYS.map(d=><div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', fontFamily:"'Inter',sans-serif" }}>{d}</div>)}
        </div>
        {PERIODS.map(p=>(
          <div key={p} style={{ display:'grid', gridTemplateColumns:'32px repeat(7,1fr)', gap:4, marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--color-text-secondary)', fontFamily:"'Inter',sans-serif" }}>{p}</div>
            {DAYS.map(d=>{ const slot=`${d}-${p}`; const sel=selected.includes(slot); return (
              <button key={slot} type="button" className={`avail-slot${sel?' selected':''}`} onClick={()=>toggle(slot)}>{sel?'✓':'·'}</button>
            );})}
          </div>
        ))}
      </div>
      <div style={{ marginTop:6, fontSize:12, color:'var(--color-text-secondary)', fontFamily:"'Inter',sans-serif" }}>
        {selected.length} slot{selected.length!==1?'s':''} selected
      </div>
    </div>
  );
}

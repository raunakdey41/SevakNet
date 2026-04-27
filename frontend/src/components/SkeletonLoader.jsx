import React from 'react';

const S = ({ w='100%', h=14, r=8, mb=0 }) => (
  <div className="skeleton" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }}/>
);

export default function SkeletonLoader({ type='card', count=1 }) {
  const items = Array.from({ length:count });
  if(type==='metric') return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      {Array.from({length:4}).map((_,i) => (
        <div key={i} className="metric-card">
          <S w={40} h={40} r={12} mb={12}/><S w="50%" h={32} mb={8}/><S w="70%" h={14}/>
        </div>
      ))}
    </div>
  );
  if(type==='row') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {items.map((_,i) => (
        <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0' }}>
          <S w={8} h={8} r={4}/><S h={14}/><S w={80} h={22} r={11}/><S w={60} h={14}/>
        </div>
      ))}
    </div>
  );
  if(type==='volunteer') return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {items.map((_,i) => (
        <div key={i} className="card" style={{ padding:16 }}>
          <div style={{ display:'flex', gap:12 }}>
            <S w={44} h={44} r={22}/>
            <div style={{ flex:1 }}><S w="55%" h={14} mb={6}/><S w="40%" h={12} mb={8}/><div style={{display:'flex',gap:6}}><S w={60} h={20} r={10}/><S w={80} h={20} r={10}/></div></div>
          </div>
        </div>
      ))}
    </div>
  );
  if(type==='map') return <div className="skeleton" style={{ width:'100%', height:'100%', minHeight:300, borderRadius:'var(--radius-md)' }}/>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {items.map((_,i) => (
        <div key={i} className="card" style={{ padding:18 }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}><S w={36} h={36} r={18}/><div style={{flex:1}}><S h={13} mb={6}/><S w="60%" h={12}/></div></div>
          <S h={12} mb={5}/><S w="80%" h={12}/>
        </div>
      ))}
    </div>
  );
}

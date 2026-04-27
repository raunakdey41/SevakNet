import React, { useEffect, useRef } from 'react';

const URGENCY_COLORS = { 5:'#E24B4A', 4:'#EF9F27', 3:'#F59E0B', 2:'#1D9E75', 1:'#9CA3AF' };

export default function MapView({ tasks=[], onTaskSelect, center=[22.4502,88.2500], zoom=11 }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if(instanceRef.current || !mapRef.current) return;
    let map;
    import('leaflet').then(L => {
      if(instanceRef.current) return;
      map = L.map(mapRef.current, { center, zoom, zoomControl:true, attributionControl:false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom:19 }).addTo(map);
      instanceRef.current = map;
      addMarkers(L, map, tasks);
    }).catch(()=>{});
    return () => { if(instanceRef.current){ instanceRef.current.remove(); instanceRef.current=null; } };
  }, []);

  function addMarkers(L, map, taskList) {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    taskList.forEach(task => {
      if(!task.lat || !task.lng) return;
      const urgencyLevel = Math.ceil((task.urgency_score || 0) / 20);
      const c = URGENCY_COLORS[urgencyLevel] || '#534AB7';
      const icon = L.divIcon({
        className:'',
        html:`<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${c};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);transform:rotate(-45deg);"></div>`,
        iconSize:[28,28], iconAnchor:[14,28],
      });
      const marker = L.marker([task.lat,task.lng],{icon}).addTo(map)
        .bindTooltip(`<strong>${task.title}</strong><br/>${task.ward_name}`,{direction:'top',offset:[0,-30]})
        .on('click', () => onTaskSelect && onTaskSelect(task));
      markersRef.current.push(marker);
    });
  }

  useEffect(() => {
    if(!instanceRef.current) return;
    import('leaflet').then(L => addMarkers(L, instanceRef.current, tasks));
  }, [JSON.stringify(tasks.map(t=>t.id))]);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', minHeight:280 }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%', minHeight:280, borderRadius:'var(--radius-md)' }}/>
      <div style={{ position:'absolute', bottom:12, left:12, zIndex:10,
        background:'rgba(255,255,255,0.96)', borderRadius:'var(--radius-sm)',
        padding:'8px 12px', boxShadow:'var(--shadow-sm)', fontSize:11, fontFamily:"'Inter',sans-serif" }}>
        {[{l:'Critical',c:'#E24B4A'},{l:'High',c:'#EF9F27'},{l:'Medium',c:'#F59E0B'},{l:'Low',c:'#1D9E75'}].map(({l,c})=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <div style={{ width:10,height:10,borderRadius:'50%',background:c }}/>
            <span style={{ color:'var(--color-text-secondary)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

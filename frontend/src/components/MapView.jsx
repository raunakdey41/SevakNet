import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getUrgencyColour, formatScore, categoryIcon, getUrgencyTier } from '../utils/urgency';

// West Bengal center
const WB_CENTER = [22.5, 88.35];
const WB_ZOOM   = 11;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function FlyToNewTask({ tasks }) {
  const map = useMap();
  const prevLen = useRef(0);

  useEffect(() => {
    if (tasks.length > prevLen.current && tasks.length > 0) {
      const newest = tasks[tasks.length - 1];
      if (newest.lat && newest.lng) {
        map.flyTo([newest.lat, newest.lng], 14, { duration: 1.2 });
      }
    }
    prevLen.current = tasks.length;
  }, [tasks, map]);

  return null;
}

export default function MapView({ tasks = [], onTaskClick, selectedTaskId }) {
  return (
    <MapContainer
      center={WB_CENTER}
      zoom={WB_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />

      <FlyToNewTask tasks={tasks} />

      {tasks.map((task) => {
        if (!task.lat || !task.lng) return null;
        const tier    = getUrgencyTier(task.urgency_score);
        const colour  = getUrgencyColour(task.urgency_score);
        const isSelected = task.id === selectedTaskId;
        const radius  = isSelected ? 16 : tier === 'critical' ? 12 : 9;

        return (
          <CircleMarker
            key={task.id}
            center={[task.lat, task.lng]}
            radius={radius}
            pathOptions={{
              color: colour.bg,
              fillColor: colour.bg,
              fillOpacity: isSelected ? 0.95 : 0.75,
              weight: isSelected ? 3 : 1.5,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => onTaskClick && onTaskClick(task),
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{categoryIcon(task.category || '')}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: colour.bg,
                    padding: '2px 7px',
                    background: `${colour.bg}22`,
                    borderRadius: 4,
                  }}>
                    {tier}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#f0f6fc' }}>
                  {task.title}
                </div>
                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>
                  {task.ward_name} · {task.block}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: colour.bg,
                    fontWeight: 600,
                  }}>
                    ⚡ {formatScore(task.urgency_score)}
                  </span>
                  <span style={{ fontSize: 11, color: '#8b949e' }}>
                    {task.skill_required}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';

import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const socket = io('http://localhost:5005');

// Destination for ETA calculation
const DESTINATION = [23.05, 72.60];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function App() {
  const [vehicleLocations, setVehicleLocations] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    socket.on('locationUpdate', (data) => {
      setVehicleLocations((prev) => {
        const updated = { ...prev };
        const prevData = updated[data.vehicleId];
        const currTime = Date.now();
        const newPoint = [data.latitude, data.longitude];
        
        let newHistory = [];
        let speed = 0;
        
        if (prevData) {
          newHistory = [...prevData.history, newPoint];
          if (newHistory.length > 20) newHistory.shift(); // Keep last 20 points
          
          const distance = getDistance(prevData.current.lat, prevData.current.lng, data.latitude, data.longitude);
          const timeHrs = (currTime - prevData.localTime) / 3600000;
          if (timeHrs > 0) {
            let calculatedSpeed = distance / timeHrs;
            // Clamping max speed
            calculatedSpeed = Math.min(calculatedSpeed, 80); 
            // Smoothing speed
            speed = (prevData.speed * 0.7) + (calculatedSpeed * 0.3);
          }
        } else {
          newHistory = [newPoint];
        }

        const distanceToDest = getDistance(data.latitude, data.longitude, DESTINATION[0], DESTINATION[1]);
        
        // Better ETA: use at least 20km/h to avoid division by zero or inflated times
        const avgSpeed = Math.max(speed, 20);
        const etaMinutes = (distanceToDest / avgSpeed) * 60;

        updated[data.vehicleId] = { 
          current: { lat: data.latitude, lng: data.longitude },
          history: newHistory,
          speed: speed,
          etaMinutes: etaMinutes,
          timestamp: data.timestamp,
          localTime: currTime 
        };
        
        return updated;
      });
    });

    return () => {
      socket.off('locationUpdate');
    };
  }, []);

  // Update current time every second to recompute online/offline status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const vehicles = Object.entries(vehicleLocations);
  const defaultCenter = [23.0225, 72.5714]; // Centered around simulation origin
  const mapCenter = vehicles.length > 0 ? [vehicles[0][1].current.lat, vehicles[0][1].current.lng] : defaultCenter;

  const flyToVehicle = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
  };

  const getVehicleStatus = (speed, localTime) => {
    if (currentTime - localTime > 10000) return { label: 'OFFLINE', class: 'offline' };
    if (speed < 5) return { label: 'IDLE', class: 'idle' };
    if (speed > 60) return { label: 'FAST', class: 'fast' };
    return { label: 'MOVING', class: 'moving' };
  };

  return (
    <div className="dashboard">
      <div className="map-section">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render Destination Marker */}
          <Marker position={DESTINATION}>
            <Popup>
              <strong>DestinationHQ</strong>
            </Popup>
          </Marker>

          {vehicles.map(([id, loc], index) => {
            const status = getVehicleStatus(loc.speed, loc.localTime);
            const isSelected = selected === id;
            
            return (
              <div key={id}>
                <Polyline 
                  positions={loc.history} 
                  color={isSelected ? "#f59e0b" : "#38bdf8"} 
                  weight={isSelected ? 6 : 4} 
                  opacity={isSelected ? 1 : 0.7} 
                />
                <Marker position={[loc.current.lat, loc.current.lng]}>
                  <Popup>
                    <strong>{id}</strong> <br/>
                    Status: {status.label} <br/>
                    Speed: {loc.speed.toFixed(1)} km/h <br/>
                    ETA: {loc.etaMinutes > 0 ? `${Math.round(loc.etaMinutes)} mins` : 'N/A'} <br/>
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>
      </div>

      <div className="side-panel">
        <header className="header">
          <h1>Fleet Tracking</h1>
          <div className="live-indicator">
            <span className="pulse"></span> Live
          </div>
        </header>

        <div className="panel-content">
          <h2 className="section-title">Vehicle Status</h2>
          {vehicles.length === 0 ? (
            <div className="empty-state">
              <p>Waiting for vehicle data...</p>
            </div>
          ) : (
            <ul className="vehicle-list">
              {vehicles.map(([id, loc]) => {
                const status = getVehicleStatus(loc.speed, loc.localTime);
                
                return (
                  <li 
                    key={id} 
                    className={`vehicle-item ${selected === id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelected(id);
                      flyToVehicle(loc.current.lat, loc.current.lng);
                    }}
                  >
                    <div className="vehicle-header">
                      <span className="vehicle-id">
                        <span className="icon">🚚</span> {id}
                      </span>
                      <span className={`status-badge ${status.class}`}>
                        <span className="status-dot"></span>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="vehicle-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <div className="stat-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Speed</span>
                        <strong>{loc.speed.toFixed(1)} <small>km/h</small></strong>
                      </div>
                      <div className="stat-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ETA</span>
                        <strong>{loc.etaMinutes > 0 ? Math.round(loc.etaMinutes) : '--'} <small>mins</small></strong>
                      </div>
                    </div>

                    <div className="vehicle-details" style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', justifyContent: 'space-between' }}>
                      <div>Lat: {loc.current.lat.toFixed(4)}</div>
                      <div>Lng: {loc.current.lng.toFixed(4)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


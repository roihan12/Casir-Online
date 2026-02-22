import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import { getMyLocations } from '../services/attendanceService';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" style="box-shadow: 0 0 15px rgba(59, 130, 246, 0.6)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const locationIcon = L.divIcon({
  className: "custom-loc-marker",
  html: `<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-white relative z-10">
           <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const FitBounds = ({ userPos, locations }) => {
  const map = useMap();
  useEffect(() => {
    if (!userPos && (!locations || locations.length === 0)) return;
    
    const bounds = L.latLngBounds([]);
    if (userPos) bounds.extend([userPos.latitude, userPos.longitude]);
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude) bounds.extend([loc.latitude, loc.longitude]);
    });
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [userPos, locations, map]);
  return null;
};

const AttendanceMap = () => {
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  
  const { position, error: geoError, loading: geoLoading, calculateDistance } = useGeolocation({ watch: true });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLocLoading(true);
        const res = await getMyLocations();
        const locs = Array.isArray(res) ? res : (res.data || []);
        setLocations(locs.filter(l => l.canAccess !== false && l.latitude && l.longitude));
      } catch (err) {
        console.error('Failed to load attendance locations', err);
      } finally {
        setLocLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const isWithinAny = useMemo(() => {
    if (!position || locations.length === 0) return null;
    return locations.some(loc => {
      const dist = calculateDistance(position.latitude, position.longitude, loc.latitude, loc.longitude);
      return dist <= (loc.radius || 100);
    });
  }, [position, locations, calculateDistance]);

  const nearestLocation = useMemo(() => {
    if (!position || locations.length === 0) return null;
    let nearest = null;
    let minDist = Infinity;
    locations.forEach(loc => {
      const dist = calculateDistance(position.latitude, position.longitude, loc.latitude, loc.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...loc, distance: dist };
      }
    });
    return nearest;
  }, [position, locations, calculateDistance]);

  const loading = geoLoading || locLoading;

  if (loading && !position) {
    return (
      <div className="h-64 bg-white rounded-3xl flex flex-col items-center justify-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm font-medium text-gray-500">Mengambil lokasi langsung...</p>
      </div>
    );
  }

  const defaultCenter = position 
    ? [position.latitude, position.longitude] 
    : (locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [-6.2, 106.8]);

  return (
    <div className="mb-8 space-y-4 animate-fade-in">
      {/* Alert Banners */}
      {geoError && (
         <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 shadow-sm">
           <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
           <div className="flex-1">
             <p className="text-sm font-bold text-amber-900">Akses Lokasi Bermasalah</p>
             <p className="text-sm text-amber-800 mt-1">{geoError}</p>
           </div>
         </div>
      )}
      
      {!geoError && position && isWithinAny === false && (
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-900">Di Luar Area yang Diizinkan</p>
            <p className="text-sm text-rose-800 mt-1">Saat ini Anda terlalu jauh dari titik absensi. Harap mendekat untuk melakukan absensi.</p>
            {nearestLocation && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-rose-100 text-xs font-semibold text-rose-600">
                Jarak Anda {Math.round(nearestLocation.distance)}m dari {nearestLocation.nama} (batas radius: {nearestLocation.radius || 100}m)
              </div>
            )}
          </div>
        </div>
      )}

      {!geoError && position && isWithinAny === true && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900">Di Dalam Area Absensi</p>
            <p className="text-sm text-emerald-800 mt-1">Anda berada di dalam area yang diizinkan dan dapat absen masuk atau keluar dengan sukses.</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="h-[350px] w-full bg-gray-50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative z-0">
        <MapContainer center={defaultCenter} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds userPos={position} locations={locations} />
          
          {locations.map(loc => {
            const radius = loc.radius || 100;
            return (
              <React.Fragment key={loc.id}>
                <Circle 
                  center={[loc.latitude, loc.longitude]} 
                  radius={radius} 
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2 }} 
                />
                <Marker position={[loc.latitude, loc.longitude]} icon={locationIcon}>
                  <Popup>
                    <div className="text-center p-1">
                      <p className="font-bold text-gray-800">{loc.nama}</p>
                      <p className="text-xs text-gray-500 mt-1">Batas Radius: {radius}m</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {position && (
            <Marker position={[position.latitude, position.longitude]} icon={userIcon}>
              <Popup>
                <p className="font-semibold text-blue-600">Lokasi Anda saat ini</p>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default AttendanceMap;

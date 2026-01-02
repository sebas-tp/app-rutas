import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteData } from '../types';
import { DEFAULT_CENTER } from '../constants';

interface MapComponentProps {
  stops: Stop[];
  route: RouteData | null;
  onMapClick: (lat: number, lng: number) => void;
}

// --- SUBCOMPONENTES AUXILIARES ---

// 1. EL SALVADOR: Fuerza al mapa a recalcular su tamaño al cargar
// Esto soluciona que se vea gris o cortado hasta apretar F12
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // Esperamos 100ms a que el CSS termine de cargar y forzamos resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// 2. Manejador de clics
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// 3. Zoom Automático
const MapUpdater: React.FC<{ stops: Stop[], route: RouteData | null }> = ({ stops, route }) => {
  const map = useMap();

  useEffect(() => {
    // Damos un pequeño delay para asegurar que el mapa ya tenga tamaño real
    const timer = setTimeout(() => {
        if (route && route.geometry.length > 0) {
        const bounds = L.latLngBounds(route.geometry as L.LatLngExpression[]);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
        } else if (stops.length > 0) {
        const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]) as L.LatLngExpression[]);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
        }
    }, 200); // Delay táctico
    return () => clearTimeout(timer);
  }, [stops, route, map]);

  return null;
};

// --- ICONOS ---
const createCustomIcon = (number: string | number, isDepot: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="marker-label ${isDepot ? 'depot' : ''}">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// --- COMPONENTE PRINCIPAL ---
const MapComponent: React.FC<MapComponentProps> = ({ stops, route, onMapClick }) => {
  return (
    <div className="flex-1 relative h-full w-full cursor-crosshair bg-slate-200">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <MapResizer /> {/* <--- AQUÍ ESTÁ EL ARREGLO DEL F12 */}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={onMapClick} />
        <MapUpdater stops={stops} route={route} />

        {route && (
          <Polyline 
            positions={route.geometry} 
            color="#2563eb" 
            weight={5} 
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {stops.map((stop, idx) => (
          <Marker 
            key={stop.id} 
            position={[stop.lat, stop.lng]}
            icon={createCustomIcon(stop.isDepot ? 'D' : (stop.order || (idx + 1)), stop.isDepot)}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <p className="font-bold text-sm text-slate-800 border-b pb-1 mb-1">
                  {stop.isDepot ? '🏭 DEPÓSITO' : `📦 ENTREGA #${stop.order || idx + 1}`}
                </p>
                <p className="text-xs text-slate-600 font-medium">{stop.address}</p>
                {stop.timeWindow && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    ⏰ {stop.timeWindow.start} - {stop.timeWindow.end}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 pointer-events-none">
        <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2 uppercase tracking-tight">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Click en mapa para agregar
        </p>
      </div>
    </div>
  );
};

export default MapComponent;


import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteData } from '../types';
import { DEFAULT_CENTER } from '../constants';

interface MapComponentProps {
  stops: Stop[];
  route: RouteData | null;
  onMapClick: (lat: number, lng: number) => void;
}

// Controlador de eventos del mapa
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Utilidad para re-centrar el mapa
const MapUpdater: React.FC<{ stops: Stop[], route: RouteData | null }> = ({ stops, route }) => {
  const map = useMap();

  React.useEffect(() => {
    if (route && route.geometry.length > 0) {
      const bounds = L.latLngBounds(route.geometry as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]) as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
    }
  }, [stops, route, map]);

  return null;
};

const createCustomIcon = (number: string | number, isDepot: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="marker-label ${isDepot ? 'depot' : ''}">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapComponent: React.FC<MapComponentProps> = ({ stops, route, onMapClick }) => {
  return (
    <div className="flex-1 relative h-full cursor-crosshair">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={onMapClick} />
        <MapUpdater stops={stops} route={route} />

        {route && (
          <Polyline 
            positions={route.geometry} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.8}
            lineCap="round"
          />
        )}

        {stops.map((stop, idx) => (
          <Marker 
            key={stop.id} 
            position={[stop.lat, stop.lng]}
            icon={createCustomIcon(stop.isDepot ? 'D' : (stop.order || (idx + 1)), stop.isDepot)}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm">{stop.isDepot ? 'Depósito (Inicio/Fin)' : `Entrega #${stop.order || idx + 1}`}</p>
                <p className="text-xs text-gray-600">{stop.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-slate-200 pointer-events-none">
        <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2 uppercase tracking-tight">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Click en el mapa para añadir parada
        </p>
      </div>
    </div>
  );
};

export default MapComponent;

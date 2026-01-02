import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import { Stop, RouteData, SavedRoute } from './types';
import { optimizeRoute, reverseGeocode } from './services/orsService';

const App: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  // Cargar rutas guardadas del localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('georoute_saved');
    if (saved) setSavedRoutes(JSON.parse(saved));
  }, []);

  const handleAddStop = (stop: Stop) => {
    setStops(prev => [...prev, stop]);
    setRoute(null);
    setError(null);
  };

  const handleUpdateStop = (id: string, updates: Partial<Stop>) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setRoute(null);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const address = await reverseGeocode(lat, lng);
      handleAddStop({
        id: Math.random().toString(36).substr(2, 9),
        address,
        lat,
        lng,
        isDepot: stops.length === 0,
        type: 'cliente',
      });
    } catch (err) {
      console.error("Map click error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStop = (id: string) => {
    setStops(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Si borramos el depósito, el siguiente en la lista pasa a ser depósito por seguridad
      if (prev.find(s => s.id === id)?.isDepot && filtered.length > 0) {
        filtered[0].isDepot = true;
      }
      return filtered.map(s => ({ ...s, order: undefined }));
    });
    setRoute(null);
  };

  const handleSetDepot = (id: string) => {
    setStops(prev => prev.map(s => ({ ...s, isDepot: s.id === id })));
    setRoute(null);
  };

  const handleSaveRoute = (name: string) => {
    const newRoute: SavedRoute = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleDateString(),
      stops: [...stops],
    };
    const updated = [newRoute, ...savedRoutes];
    setSavedRoutes(updated);
    localStorage.setItem('georoute_saved', JSON.stringify(updated));
  };

  const handleLoadRoute = (saved: SavedRoute) => {
    setStops(saved.stops);
    setRoute(null);
    setError(null);
  };

  // --- LÓGICA CENTRAL DE OPTIMIZACIÓN ---
  // Ahora recibe 'startTime' desde el Sidebar para calcular bien las esperas
  const handleOptimize = async (startTime: string) => {
    if (stops.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Llamamos al servicio pasando la hora de inicio elegida
      const result = await optimizeRoute(stops, startTime);
      setRoute(result);

      // Asignar el orden devuelto por la API a nuestras paradas visuales
      const updatedStops = [...stops].map(s => ({ ...s, order: undefined }));
      const otherStops = stops.filter(s => !s.isDepot);
      
      let stepCounter = 1;
      result.steps.forEach((step: any) => {
        if (step.type === 'job') {
          // step.id viene del servicio (1, 2, 3...) y machea con el índice del array de trabajos
          const originalStop = otherStops[step.id - 1];
          const st = updatedStops.find(s => s.id === originalStop?.id);
          if (st) st.order = stepCounter++;
        }
      });
      setStops(updatedStops);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al optimizar la ruta");
    } finally {
      setLoading(false);
    }
  };

  // Ordenar paradas para la vista de impresión/PDF
  const orderedStops = [...stops].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans">
      
      <Sidebar 
        stops={stops}
        route={route}
        onAddStop={handleAddStop}
        onRemoveStop={handleRemoveStop}
        onUpdateStop={handleUpdateStop}
        onSetDepot={handleSetDepot}
        onOptimize={handleOptimize} // Conectamos la función actualizada
        onSaveRoute={handleSaveRoute}
        onLoadRoute={handleLoadRoute}
        savedRoutes={savedRoutes}
        loading={loading}
        error={error}
        isOptimized={!!route}
      />
      
      {/* CONTENEDOR PRINCIPAL DEL MAPA */}
      <main className="flex-1 flex flex-col h-full relative no-print">
        <MapComponent stops={stops} route={route} onMapClick={handleMapClick} />
        
        {loading && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[2000] flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-blue-100">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Optimizando logística...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[2000] shadow-lg">
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}
      </main>

      {/* =================================================================================
          VISTA DE REPORTE OCULTA (PLANTILLA PARA PDF)
          Nota: Se usa 'invisible' y 'fixed' para que no afecte el layout pero exista en el DOM
         ================================================================================= */}
      <div 
        id="report-preview" 
        className="fixed top-0 left-0 w-[210mm] min-h-[297mm] bg-white p-8 z-[-1000] invisible"
      >
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Hoja de Ruta</h1>
            <p className="text-sm text-slate-500 font-bold">{new Date().toLocaleDateString()} - GeoRoute Logistics</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-600">{route ? (route.distance / 1000).toFixed(1) : 0} km</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distancia Total</p>
          </div>
        </div>

        {/* Mapa estático para el reporte */}
        <div className="border rounded-2xl overflow-hidden mb-8 h-[350px] w-full border-slate-200">
           {route && <MapComponent stops={stops} route={route} onMapClick={() => {}} />}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2">Itinerario de Paradas</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 border-b">
                <th className="py-2 w-12 text-center">#</th>
                <th className="py-2">Dirección / Punto</th>
                <th className="py-2">Horario</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Obs.</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {orderedStops.map((stop, idx) => (
                <tr key={stop.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-center font-black text-blue-600">
                    {stop.isDepot ? 'DEP' : stop.order || idx + 1}
                  </td>
                  <td className="py-3 font-bold pr-2 max-w-[200px] truncate">{stop.address}</td>
                  <td className="py-3 whitespace-nowrap">
                    {stop.timeWindow?.start ? `${stop.timeWindow.start} - ${stop.timeWindow.end}` : '-'}
                  </td>
                  <td className="py-3 uppercase font-bold text-[9px] text-slate-400">
                    {stop.type}
                  </td>
                  <td className="py-3 text-slate-500 italic max-w-xs truncate">{stop.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end">
          <div className="text-[10px] text-slate-400 font-medium">
            GeoRoute Logistics - Documento generado automáticamente
          </div>
          <div className="text-[10px] text-slate-300">
             Página 1/1
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

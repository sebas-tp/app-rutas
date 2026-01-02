import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import { Stop, RouteData, SavedRoute } from './types';
import { optimizeRoute, reverseGeocode } from './services/orsService';
import { saveRouteToCloud, getRoutesFromCloud, deleteRouteFromCloud } from './services/routeService';

const App: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const cloudRoutes = await getRoutesFromCloud();
        setSavedRoutes(cloudRoutes);
      } catch (err) {
        console.error("Error conectando a la nube", err);
      }
    };
    fetchRoutes();
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

  const handleSaveRoute = async (name: string) => {
    setIsCloudLoading(true);
    try {
      await saveRouteToCloud(name, stops, route);
      const updatedRoutes = await getRoutesFromCloud();
      setSavedRoutes(updatedRoutes);
      alert("✅ ¡Ruta guardada en la nube con éxito!");
    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar en la nube. Revisa tu conexión.");
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm("¿Estás seguro que querés eliminar esta ruta guardada?")) return;
    try {
      await deleteRouteFromCloud(id);
      setSavedRoutes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la ruta.");
    }
  };

  const handleLoadRoute = (saved: SavedRoute) => {
    setStops(saved.stops);
    setRoute(null);
    setError(null);
  };

  const handleOptimize = async (startTime: string) => {
    if (stops.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await optimizeRoute(stops, startTime);
      setRoute(result);
      const updatedStops = [...stops].map(s => ({ ...s, order: undefined }));
      const otherStops = stops.filter(s => !s.isDepot);
      let stepCounter = 1;
      result.steps.forEach((step: any) => {
        if (step.type === 'job') {
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

  return (
    // CAMBIO IMPORTANTE: flex-col-reverse en mobile pone el menú abajo
    <div className="flex flex-col-reverse md:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar con altura controlada en mobile */}
      <div className="w-full md:w-96 h-[45vh] md:h-full flex-none z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:shadow-none bg-white">
        <Sidebar 
          stops={stops}
          route={route}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onUpdateStop={handleUpdateStop}
          onSetDepot={handleSetDepot}
          onOptimize={handleOptimize}
          onSaveRoute={handleSaveRoute}
          onLoadRoute={handleLoadRoute}
          onDeleteRoute={handleDeleteRoute}
          savedRoutes={savedRoutes}
          loading={loading || isCloudLoading}
          error={error}
          isOptimized={!!route}
        />
      </div>
      
      {/* Mapa ocupa el resto */}
      <main className="flex-1 flex flex-col h-full relative no-print min-h-0">
        <MapComponent stops={stops} route={route} onMapClick={handleMapClick} />
        
        {(loading || isCloudLoading) && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[2000] flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-blue-100">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="font-black text-slate-800 uppercase tracking-widest text-[10px]">
                {isCloudLoading ? 'Procesando en la nube...' : 'Optimizando...'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[2000] shadow-lg">
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}
      </main>

      <div id="report-preview" className="fixed top-0 left-0 w-[210mm] min-h-[297mm] bg-white p-8 z-[-1000] invisible">
         {/* ... Contenido del PDF (se mantiene igual, no lo copio todo para no hacer spam pero está en el código original) ... */}
         {/* Si querés copiarlo completo, avisame y te pego la parte del PDF también, pero no cambia */}
      </div>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { 
  Search, Trash2, MapPin, Navigation, Loader2, Flag, 
  User, Truck, Save, FolderOpen, Share2, FileDown, Info, Crosshair, Clock, BarChart3
} from 'lucide-react';
import html2canvas from 'html2canvas'; 
import jsPDF from 'jspdf';             
import { Stop, GeocodingResult, SavedRoute, RouteData } from '../types';
import { geocodeSearch, reverseGeocode } from '../services/orsService';
import StatsModal from './StatsModal';

interface SidebarProps {
  stops: Stop[];
  route: RouteData | null;
  onAddStop: (stop: Stop) => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, updates: Partial<Stop>) => void;
  onSetDepot: (id: string) => void;
  onOptimize: (startTime: string) => void;
  onSaveRoute: (name: string) => void;
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (id: string) => void; // <--- PROP NUEVA
  savedRoutes: SavedRoute[];
  loading: boolean;
  error: string | null;
  isOptimized: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  stops, route, onAddStop, onRemoveStop, onUpdateStop, onSetDepot, 
  onOptimize, onSaveRoute, onLoadRoute, onDeleteRoute, // <--- RECIBIMOS LA PROP
  savedRoutes, loading, error, isOptimized
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'saved'>('current');
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [showStats, setShowStats] = useState(false);

  // --- BUSCADOR ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const coords = query.includes(',') ? query.split(',').map(n => parseFloat(n.trim())) : null;
    let searchResults = await geocodeSearch(query);
    if (coords && coords.length === 2 && !isNaN(coords[0])) {
      searchResults = [{
        label: `📍 Coordenadas: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`,
        coordinates: [coords[1], coords[0]],
        isFromCoords: true
      }, ...searchResults];
    }
    setResults(searchResults);
    setSearching(false);
  };

  const handleSelectResult = async (res: GeocodingResult) => {
    let label = res.label;
    if (res.isFromCoords) {
      label = await reverseGeocode(res.coordinates[1], res.coordinates[0]);
    }
    onAddStop({
      id: Math.random().toString(36).substr(2, 9),
      address: label,
      lat: res.coordinates[1],
      lng: res.coordinates[0],
      isDepot: stops.length === 0,
      type: 'cliente',
    });
    setResults([]);
    setQuery('');
  };

  // --- WHATSAPP ---
  const handleExportWhatsApp = () => {
    const ordered = [...stops].sort((a, b) => (a.order || 0) - (b.order || 0));
    const depot = stops.find(s => s.isDepot);
    const points = [depot, ...ordered.filter(s => !s.isDepot), depot].filter(Boolean);
    const routeParams = points.map(p => `${p?.lat},${p?.lng}`).join('/');
    const multiStopLink = `https://www.google.com/maps/dir/${routeParams}`;

    let text = `🚀 *HOJA DE RUTA OPTIMIZADA*\n`;
    if (route) {
      text += `📅 Salida: ${startTime} hs\n`;
      text += `📏 Distancia: ${(route.distance / 1000).toFixed(1)} km\n`;
      text += `⏱️ Tiempo est.: ${Math.round(route.duration / 60)} min\n\n`;
    }
    text += `🗺️ *ABRIR GPS:* ${multiStopLink}\n\n📋 *PARADAS:*\n`;
    ordered.forEach((s, i) => {
      const icon = s.isDepot ? '🏭' : (s.type === 'proveedor' ? '📦' : '👤');
      text += `*${i + 1}.* ${icon} ${s.address.split(',')[0]}\n`; 
      if (s.timeWindow?.start) text += `   ⏰ ${s.timeWindow.start} - ${s.timeWindow.end}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- PDF GENERATOR ---
  const handleDownloadPDF = async () => {
    const originalElement = document.getElementById('report-preview');
    if (!originalElement) return;

    setGeneratingPdf(true);

    try {
      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.visibility = 'visible';
      clone.style.zIndex = '-9999';
      clone.style.width = '794px'; 
      clone.style.height = 'auto'; 
      clone.style.overflow = 'visible';
      clone.style.background = 'white';
      
      document.body.appendChild(clone);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        height: clone.scrollHeight,
        windowHeight: clone.scrollHeight
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', [imgWidth, Math.max(imgHeight, pageHeight)]);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Ruta_Logistica_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);

    } catch (err) {
      console.error("Error PDF", err);
      alert("Error al generar PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const orderedStops = [...stops].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <div className="w-full md:w-96 bg-white h-full flex flex-col shadow-2xl z-20 border-r border-slate-200 no-print">
        {/* HEADER */}
        <div className="bg-slate-900 p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <Navigation className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold tracking-tight">GeoRoute <span className="text-blue-500">Logistics</span></h1>
            </div>
            {/* BOTÓN DASHBOARD */}
            <button 
              onClick={() => setShowStats(true)}
              className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-all"
              title="Panel de Métricas"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('current')}
              className={`pb-2 px-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'current' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
            >
              Ruta Actual
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`pb-2 px-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'saved' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
            >
              Guardadas ({savedRoutes.length})
            </button>
          </div>
        </div>

        {activeTab === 'current' ? (
          <>
            {/* BUSCADOR */}
            <div className="p-4 border-b border-slate-100 bg-white z-50">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar dir. o coordenadas..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </form>
              {results.length > 0 && (
                <ul className="absolute mt-1 w-80 bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden">
                  {results.map((res, i) => (
                    <li key={i} onClick={() => handleSelectResult(res)} className="p-3 text-xs hover:bg-blue-50 cursor-pointer border-b flex items-center gap-2">
                      {res.isFromCoords ? <Crosshair className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3 text-slate-400" />}
                      <span className="truncate font-bold text-slate-700">{res.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* LISTA DE PARADAS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {isOptimized && route && (
                <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg mb-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Resumen</h3>
                    <Info className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-black">{(route.distance / 1000).toFixed(1)} <span className="text-sm font-normal opacity-70">km</span></p>
                      <p className="text-[10px] font-bold uppercase opacity-60">Distancia</p>
                    </div>
                    <div className="w-px h-8 bg-white/20 my-auto" />
                    <div>
                      <p className="text-2xl font-black">{Math.round(route.duration / 60)} <span className="text-sm font-normal opacity-70">min</span></p>
                      <p className="text-[10px] font-bold uppercase opacity-60">Tiempo</p>
                    </div>
                  </div>
                </div>
              )}

              {isOptimized && (
                <div className="space-y-3">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Orden de Visita</h2>
                  <div className="space-y-2 border-l-2 border-blue-200 ml-2 pl-4">
                    {orderedStops.map((stop) => (
                      <div 
                        key={stop.id} 
                        onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                        className="relative bg-white p-3 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-blue-300 transition-all"
                      >
                        <div className="absolute -left-[25px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                          {stop.isDepot ? 'D' : stop.order}
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 truncate">{stop.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                  {!isOptimized ? `Paradas cargadas (${stops.length})` : 'Editar Puntos'}
                </h2>
                {/* LISTA SIMPLE DE EDICIÓN */}
                <div className="space-y-2">
                  {stops.map((stop) => (
                    <div key={stop.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all ${expandedStop === stop.id ? 'ring-2 ring-blue-500' : ''}`}>
                      <div 
                        className="p-3 flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stop.isDepot ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                          {stop.isDepot ? <Flag className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{stop.address}</p>
                          <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            {stop.type}
                          </span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveStop(stop.id); }} className="text-slate-300 hover:text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* MENU DESPLEGABLE DE EDICION */}
                      {expandedStop === stop.id && (
                        <div className="p-3 border-t border-slate-50 bg-slate-50 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Tipo</label>
                              <select 
                                value={stop.type}
                                onChange={(e) => onUpdateStop(stop.id, { type: e.target.value as any })}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                              >
                                <option value="cliente">Cliente</option>
                                <option value="proveedor">Proveedor</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Rol</label>
                              <button 
                                onClick={() => onSetDepot(stop.id)}
                                className={`w-full text-[10px] p-2 rounded-lg border font-bold transition-colors ${stop.isDepot ? 'bg-red-500 text-white border-red-600' : 'bg-white border-slate-200'}`}
                              >
                                {stop.isDepot ? 'DEPÓSITO' : 'HACER DEPÓSITO'}
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Desde</label>
                                  <input type="time" value={stop.timeWindow?.start || ''} onChange={(e) => onUpdateStop(stop.id, { timeWindow: { ...stop.timeWindow, start: e.target.value, end: stop.timeWindow?.end || '18:00' } })} className="w-full text-xs p-2 rounded-lg border border-slate-200"/>
                              </div>
                              <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Hasta</label>
                                  <input type="time" value={stop.timeWindow?.end || ''} onChange={(e) => onUpdateStop(stop.id, { timeWindow: { ...stop.timeWindow, start: stop.timeWindow?.start || '09:00', end: e.target.value } })} className="w-full text-xs p-2 rounded-lg border border-slate-200"/>
                              </div>
                          </div>
                          <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Comentario</label>
                              <textarea value={stop.comment || ''} onChange={(e) => onUpdateStop(stop.id, { comment: e.target.value })} className="w-full text-xs p-2 rounded-lg border border-slate-200 h-16 resize-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" /> Hora de Salida de Fábrica
                </label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onOptimize(startTime)}
                  disabled={loading || stops.length < 2}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 text-xs uppercase"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Navigation className="w-4 h-4 fill-white" /> Optimizar</>}
                </button>
                <button 
                  onClick={() => {
                    const name = prompt("Nombre para esta ruta:");
                    if (name) onSaveRoute(name);
                  }}
                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                  title="Guardar ruta"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
              
              {isOptimized && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleExportWhatsApp}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[10px] uppercase"
                  >
                    <Share2 className="w-3 h-3" /> WhatsApp
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={generatingPdf}
                    className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[10px] uppercase"
                  >
                    {generatingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} 
                    {generatingPdf ? 'Generando...' : 'Descargar PDF'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* VISTA DE RUTAS GUARDADAS (CON BOTÓN DE BORRAR) */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {savedRoutes.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <FolderOpen className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase tracking-widest">No hay rutas guardadas</p>
              </div>
            ) : (
              savedRoutes.map(route => (
                <div 
                  key={route.id}
                  onClick={() => onLoadRoute(route)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-all group relative"
                >
                  {/* BOTÓN DE BORRAR (FLOTANTE A LA DERECHA) */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteRoute(route.id); 
                    }}
                    className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar ruta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex justify-between items-start mb-2 pr-8">
                    <h3 className="font-black text-slate-900 group-hover:text-blue-600 truncate">{route.name}</h3>
                  </div>
                  
                  <div className="flex justify-between items-end">
                       <span className="text-[10px] font-bold text-slate-400">{route.date}</span>
                       <div className="flex gap-2">
                          <span className="text-[10px] font-medium text-slate-500">{route.stops.length} stops</span>
                          {route.totalDistance && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {(route.totalDistance / 1000).toFixed(1)} km
                            </span>
                          )}
                       </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <StatsModal 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
        routes={savedRoutes} 
      />
    </>
  );
};

export default Sidebar;

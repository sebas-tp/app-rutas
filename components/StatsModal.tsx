import React from 'react';
import { X, TrendingUp, Map, Clock, Users } from 'lucide-react';
import { SavedRoute } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: SavedRoute[];
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, routes }) => {
  if (!isOpen) return null;

  // --- CÁLCULOS DE INGENIERÍA (KPIs) ---
  const totalRoutes = routes.length;
  
  // Sumamos distancias (divido por 1000 para pasar de metros a km)
  const totalKm = routes.reduce((acc, curr) => acc + (curr.totalDistance || 0), 0) / 1000;
  
  // Sumamos clientes visitados (restamos 1 por ruta asumiendo que es el depósito)
  const totalClients = routes.reduce((acc, curr) => acc + (curr.stopCount ? curr.stopCount - 1 : 0), 0);
  
  // Promedio de km por ruta
  const avgKmPerRoute = totalRoutes > 0 ? (totalKm / totalRoutes) : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Panel de Gerencia</h2>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Métricas de Logística</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Grid de KPIs */}
        <div className="p-6 grid grid-cols-2 gap-4">
          
          {/* KPI 1: Rutas Totales */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Map className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Viajes Realizados</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{totalRoutes}</p>
          </div>

          {/* KPI 2: Clientes Totales */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Clientes Visitados</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{totalClients}</p>
          </div>

          {/* KPI 3: Kilómetros Totales */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 col-span-2">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Kilómetros Acumulados</span>
                </div>
                <p className="text-4xl font-black text-slate-800">{totalKm.toFixed(1)} <span className="text-sm text-slate-400 font-medium">km</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold">Promedio por viaje</p>
                <p className="text-lg font-black text-indigo-600">{avgKmPerRoute.toFixed(1)} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Datos calculados desde Firebase Cloud</p>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;

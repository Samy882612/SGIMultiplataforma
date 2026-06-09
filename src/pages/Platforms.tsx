import { useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle, ExternalLink, Activity } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string;
  products: number;
  sales: number;
  color: string;
}

const initPlatforms: Platform[] = [
  { id: 'ml', name: 'MercadoLibre', logo: 'ML', status: 'connected', lastSync: '2024-06-03 10:32', products: 45, sales: 128, color: 'bg-yellow-400' },
  { id: 'fb', name: 'Falabella', logo: 'FA', status: 'connected', lastSync: '2024-06-03 09:15', products: 32, sales: 67, color: 'bg-green-500' },
  { id: 'az', name: 'Amazon', logo: 'AZ', status: 'disconnected', lastSync: 'N/A', products: 0, sales: 0, color: 'bg-orange-500' },
];

export default function Platforms() {
  const [platforms, setPlatforms] = useState(initPlatforms);

  const sync = (id: string) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, status: 'syncing' } : p));
    setTimeout(() => {
      setPlatforms(prev => prev.map(p => p.id === id ? {
        ...p, status: 'connected',
        lastSync: new Date().toLocaleString('es-CO')
      } : p));
    }, 2000);
  };

  const toggleConnection = (id: string) => {
    setPlatforms(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (p.status === 'disconnected') {
        return {
          ...p,
          status: 'connected',
          lastSync: new Date().toLocaleString('es-CO'),
        };
      }
      return {
        ...p,
        status: 'disconnected',
        lastSync: 'N/A',
      };
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={22} />
          <h3 className="font-bold text-lg">Estado de Sincronización</h3>
        </div>
        <p className="text-blue-100 text-sm">Las plataformas conectadas sincronizan inventario y ventas en tiempo real mediante API REST.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map(p => (
          <div key={p.id} className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${p.color} rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                {p.logo}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{p.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {p.status === 'connected' && <><CheckCircle2 size={13} className="text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Conectado</span></>}
                  {p.status === 'disconnected' && <><XCircle size={13} className="text-red-400" /><span className="text-xs text-red-500 font-medium">Desconectado</span></>}
                  {p.status === 'syncing' && <><RefreshCw size={13} className="text-blue-500 animate-spin" /><span className="text-xs text-blue-600 font-medium">Sincronizando...</span></>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{p.products}</p>
                <p className="text-xs text-slate-500">Productos</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{p.sales}</p>
                <p className="text-xs text-slate-500">Ventas</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw size={11} /> Última sync: {p.lastSync}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => sync(p.id)}
                disabled={p.status === 'disconnected' || p.status === 'syncing'}
                className="btn-primary flex-1 text-xs py-2 disabled:opacity-40"
              >
                <RefreshCw size={13} />Sincronizar
              </button>
              <button
                onClick={() => toggleConnection(p.id)}
                className={`${p.status === 'disconnected' ? 'btn-primary' : 'btn-secondary'} flex-1 text-xs py-2`}
              >
                <ExternalLink size={13} />{p.status === 'disconnected' ? 'Conectar' : 'Desconectar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Log de Sincronización</h3>
        <div className="space-y-2">
          {[
            { time: '10:32', msg: 'MercadoLibre: 45 productos sincronizados correctamente', ok: true },
            { time: '09:15', msg: 'Falabella: 32 productos sincronizados correctamente', ok: true },
            { time: '09:00', msg: 'Amazon: Error de autenticación — API Key inválida', ok: false },
            { time: '08:45', msg: 'MercadoLibre: Venta V002 registrada y stock actualizado', ok: true },
            { time: '08:30', msg: 'Falabella: Venta V003 registrada y stock actualizado', ok: true },
          ].map((log, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${log.ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {log.ok
                ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                : <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />}
              <span className={`font-mono text-xs ${log.ok ? 'text-emerald-700' : 'text-red-700'}`}>[{log.time}]</span>
              <span className={log.ok ? 'text-emerald-800' : 'text-red-800'}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

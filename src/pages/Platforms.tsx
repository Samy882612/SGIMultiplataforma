import { useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle, ExternalLink, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Platform as PlatformType } from '../types';

export default function Platforms() {
  const { platforms, setPlatforms } = useApp();
  const [logs, setLogs] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const [localKeys, setLocalKeys] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    platforms.forEach(p => { map[p.id] = p.apiKey ?? ''; });
    return map;
  });

  const saveApiKey = (id: string) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, apiKey: localKeys[id] } : p));
    setLogs(prev => [{ time: new Date().toLocaleTimeString('es-CO'), msg: `${id}: API Key actualizada`, ok: true }, ...prev]);
  };

  const sync = (id: string) => {
    const p = platforms.find(pl => pl.id === id);
    if (!p) return;
    // start syncing
    setPlatforms(prev => prev.map(pl => pl.id === id ? { ...pl, status: 'syncing' } : pl));

    setTimeout(() => {
      const apiKey = p.apiKey ?? '';
      if (!apiKey || apiKey.length < 5 || apiKey.toLowerCase().includes('invalid')) {
        // authentication failed
        setPlatforms(prev => prev.map(pl => pl.id === id ? { ...pl, status: 'disconnected', lastSync: 'N/A' } : pl));
        setLogs(prev => [{ time: new Date().toLocaleTimeString('es-CO'), msg: `${p.name}: Error de autenticación — API Key inválida`, ok: false }, ...prev]);
        return;
      }

      // simulate successful sync: update counts and lastSync
      const newProducts = Math.max(p.products, Math.floor(Math.random() * 100));
      const newSales = Math.max(p.sales, Math.floor(Math.random() * 200));
      setPlatforms(prev => prev.map(pl => pl.id === id ? { ...pl, status: 'connected', lastSync: new Date().toLocaleString('es-CO'), products: newProducts, sales: newSales } : pl));
      setLogs(prev => [{ time: new Date().toLocaleTimeString('es-CO'), msg: `${p.name}: ${newProducts} productos sincronizados correctamente`, ok: true }, ...prev]);
    }, 1500);
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
        <p className="text-blue-100 text-sm">Las plataformas conectadas sincronizan inventario y ventas en tiempo real mediante API REST. Proporcione su API Key para cada plataforma y pulse "Guardar" antes de sincronizar.</p>
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

            <div>
              <label className="text-xs text-slate-500">API Key</label>
              <div className="flex gap-2 mt-1">
                <input value={localKeys[p.id] ?? ''} onChange={e => setLocalKeys(prev => ({ ...prev, [p.id]: e.target.value }))} className="flex-1 input" placeholder="Ingrese API Key" />
                <button onClick={() => saveApiKey(p.id)} className="btn-primary text-xs">Guardar</button>
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
          {logs.length === 0 && (
            <div className="text-sm text-slate-500">Sin operaciones recientes.</div>
          )}
          {logs.map((log, i) => (
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

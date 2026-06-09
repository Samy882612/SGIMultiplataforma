import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle, ExternalLink, Activity, Plus, Pencil, Trash2 } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  logo: string;
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string;
  products: number;
  sales: number;
  color: string;
}

interface PlatformForm {
  name: string;
  logo: string;
  apiKey: string;
  color: string;
}

const initialFormState: PlatformForm = { name: '', logo: '', apiKey: '', color: 'bg-slate-500' };

const initPlatforms: Platform[] = [
  { id: 'PL001', name: 'MercadoLibre', logo: 'ML', apiKey: 'ml-demo-key', status: 'connected', lastSync: '2024-06-03 10:32', products: 45, sales: 128, color: 'bg-yellow-400' },
  { id: 'PL002', name: 'Falabella', logo: 'FA', apiKey: 'fb-demo-key', status: 'connected', lastSync: '2024-06-03 09:15', products: 32, sales: 67, color: 'bg-green-500' },
  { id: 'PL003', name: 'Exito', logo: 'EX', status: 'disconnected', lastSync: 'N/A', products: 0, sales: 0, color: 'bg-orange-500' },
];

const apiUrl = '/api/platforms';

const createPlatformId = () => `PL${Date.now()}`;

export default function Platforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [form, setForm] = useState<PlatformForm>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error al cargar plataformas');
        const data = (await response.json()) as Platform[];
        setPlatforms(data);
        setError(null);
      } catch (err) {
        console.warn('No se pudo cargar plataformas desde el backend, cargando datos locales.', err);
        const stored = typeof window !== 'undefined' ? localStorage.getItem('platformsConfig') : null;
        setPlatforms(stored ? JSON.parse(stored) as Platform[] : initPlatforms);
        setError('No se pudo cargar la configuración desde la base de datos. Usando datos locales.');
      } finally {
        setLoading(false);
      }
    };

    loadPlatforms();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('platformsConfig', JSON.stringify(platforms));
    }
  }, [platforms, loading]);

  const patchPlatform = async (platform: Platform) => {
    try {
      const response = await fetch(`${apiUrl}/${platform.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platform),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const updated = (await response.json()) as Platform;
      setPlatforms(prev => prev.map(p => p.id === updated.id ? updated : p));
      return updated;
    } catch (err) {
      console.warn('No se pudo actualizar la plataforma en el backend.', err);
      return platform;
    }
  };

  const createPlatformOnServer = async (platform: Platform) => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(platform),
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as Platform;
  };

  const updateLocalPlatform = (id: string, changes: Partial<Platform>) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  };

  const sync = (id: string) => {
    const platform = platforms.find(p => p.id === id);
    if (!platform || platform.status === 'disconnected') return;

    updateLocalPlatform(id, { status: 'syncing' });

    setTimeout(async () => {
      const updatedPlatform: Platform = {
        ...platform,
        status: platform.apiKey ? 'connected' : 'disconnected',
        lastSync: platform.apiKey ? new Date().toLocaleString('es-CO') : 'N/A',
      };
      updateLocalPlatform(id, updatedPlatform);
      await patchPlatform(updatedPlatform);
    }, 2000);
  };

  const toggleConnection = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    if (!platform) return;

    if (platform.status === 'disconnected') {
      if (!platform.apiKey?.trim()) return;
      const updatedPlatform: Platform = {
        ...platform,
        status: 'connected',
        lastSync: new Date().toLocaleString('es-CO'),
      };
      updateLocalPlatform(id, updatedPlatform);
      await patchPlatform(updatedPlatform);
      return;
    }

    const updatedPlatform: Platform = {
      ...platform,
      status: 'disconnected',
      lastSync: 'N/A',
    };
    updateLocalPlatform(id, updatedPlatform);
    await patchPlatform(updatedPlatform);
  };

  const updateApiKey = (id: string, apiKey: string) => {
    updateLocalPlatform(id, { apiKey });
  };

  const saveApiKey = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    if (!platform) return;

    const updatedPlatform: Platform = {
      ...platform,
      apiKey: platform.apiKey?.trim() || '',
      status: platform.apiKey?.trim() ? 'connected' : 'disconnected',
      lastSync: platform.apiKey?.trim() ? new Date().toLocaleString('es-CO') : 'N/A',
    };

    updateLocalPlatform(id, updatedPlatform);
    await patchPlatform(updatedPlatform);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPlatform(null);
    setForm(initialFormState);
  };

  const handleFormChange = (field: keyof PlatformForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const savePlatform = async () => {
    const name = form.name.trim();
    if (!name) return;

    const id = selectedPlatform ? selectedPlatform.id : createPlatformId();
    const logo = form.logo.trim() || name.slice(0, 2).toUpperCase();
    const status = form.apiKey.trim() ? 'connected' : 'disconnected';
    const lastSync = form.apiKey.trim() ? new Date().toLocaleString('es-CO') : 'N/A';
    const platformData: Platform = {
      id,
      name,
      logo,
      apiKey: form.apiKey.trim(),
      status,
      lastSync,
      products: selectedPlatform ? selectedPlatform.products : 0,
      sales: selectedPlatform ? selectedPlatform.sales : 0,
      color: form.color,
    };

    if (modal === 'add') {
      setPlatforms(prev => [...prev, platformData]);
      try {
        const created = await createPlatformOnServer(platformData);
        setPlatforms(prev => prev.map(p => p.id === platformData.id ? created : p));
      } catch (err) {
        console.warn('No se pudo crear la plataforma en el backend. Guardando en local.', err);
      }
    } else if (modal === 'edit' && selectedPlatform) {
      setPlatforms(prev => prev.map(p => p.id === selectedPlatform.id ? platformData : p));
      await patchPlatform(platformData);
    }

    closeModal();
  };

  const openAdd = () => {
    setSelectedPlatform(null);
    setForm(initialFormState);
    setModal('add');
  };

  const openEdit = (platform: Platform) => {
    setSelectedPlatform(platform);
    setForm({ name: platform.name, logo: platform.logo, apiKey: platform.apiKey ?? '', color: platform.color });
    setModal('edit');
  };

  const deletePlatform = async (id: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
    if (selectedPlatform?.id === id) closeModal();

    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Request failed: ${response.status}`);
      }
    } catch (err) {
      console.warn('No se pudo eliminar la plataforma en el backend.', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Activity size={22} />
            <div>
              <h3 className="font-bold text-lg">Estado de Sincronización</h3>
              <p className="text-blue-100 text-sm">Las plataformas conectadas sincronizan inventario y ventas en tiempo real mediante API REST.</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2 px-3">
            <Plus size={16} /> Agregar plataforma
          </button>
        </div>
        {error && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-orange-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map(p => (
          <div key={p.id} className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
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
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Pencil size={15} />
                </button>
                <button onClick={() => deletePlatform(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={15} />
                </button>
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

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500">API Key</label>
              <input
                type="password"
                value={p.apiKey || ''}
                onChange={event => updateApiKey(p.id, event.target.value)}
                className="input-field w-full text-sm"
                placeholder="Ingresa la API Key"
              />
              <button
                onClick={() => saveApiKey(p.id)}
                className="btn-secondary w-full text-xs py-2"
              >
                Guardar API Key
              </button>
              {p.status === 'disconnected' && !p.apiKey && (
                <p className="text-xs text-red-500">Debes ingresar una API Key para conectar esta plataforma.</p>
              )}
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

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{modal === 'add' ? 'Agregar Plataforma' : 'Editar Plataforma'}</h3>
                <p className="text-sm text-slate-500">Configura el nombre, logo, API Key y color de la plataforma.</p>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-900">Cerrar</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Nombre</label>
                <input
                  className="input-field w-full"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="Ej. MercadoLibre"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Logo</label>
                <input
                  className="input-field w-full"
                  value={form.logo}
                  onChange={e => handleFormChange('logo', e.target.value)}
                  placeholder="Ej. ML"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">API Key</label>
                <input
                  type="password"
                  className="input-field w-full"
                  value={form.apiKey}
                  onChange={e => handleFormChange('apiKey', e.target.value)}
                  placeholder="Escribe la API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Color</label>
                <select
                  value={form.color}
                  onChange={e => handleFormChange('color', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="bg-slate-500">Gris</option>
                  <option value="bg-yellow-400">Amarillo</option>
                  <option value="bg-green-500">Verde</option>
                  <option value="bg-orange-500">Naranja</option>
                  <option value="bg-blue-500">Azul</option>
                  <option value="bg-violet-500">Violeta</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-end px-6 py-4 border-t border-slate-200">
              <button onClick={closeModal} className="btn-secondary py-2 px-4">Cancelar</button>
              <button onClick={savePlatform} className="btn-primary py-2 px-4">
                {modal === 'add' ? 'Agregar plataforma' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

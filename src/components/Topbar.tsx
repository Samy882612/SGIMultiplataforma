import { useApp } from '../context/AppContext';
import { Bell, Search } from 'lucide-react';

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Gestión de Inventario',
  sales: 'Gestión de Ventas',
  reports: 'Reportes y Analíticas',
  platforms: 'Plataformas Conectadas',
  users: 'Gestión de Usuarios',
  architecture: 'Arquitectura del Sistema',
};

export default function Topbar() {
  const { activeView, products } = useApp();
  const lowStock = products.filter(p => p.quantity <= p.minStock).length;

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">{viewTitles[activeView]}</h1>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            placeholder="Buscar..."
          />
        </div>
        <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell size={20} className="text-slate-600" />
          {lowStock > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {lowStock}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

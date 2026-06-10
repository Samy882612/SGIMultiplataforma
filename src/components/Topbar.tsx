import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, AlertCircle, TrendingUp, Check, Package } from 'lucide-react';

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Gestión de Inventario',
  sales: 'Gestión de Ventas',
  reports: 'Reportes y Analíticas',
  platforms: 'Plataformas Conectadas',
  users: 'Gestión de Usuarios',
};

export default function Topbar() {
  const { activeView, products, sales } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
  const lowStock = lowStockProducts.length;
  const recentSales = sales.slice(-3).reverse();
  const totalNotifications = lowStock + recentSales.length;

  const searchResults = searchTerm.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(value.trim().length > 0);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">{viewTitles[activeView]}</h1>
      <div className="flex items-center gap-4">
        <div className="relative" onClick={e => e.stopPropagation()}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-64 overflow-y-auto">
              {searchResults.map(product => (
                <div 
                  key={product.id}
                  className="p-3 hover:bg-blue-50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchResults(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Package size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{product.id}</span>
                        <span>•</span>
                        <span>Stock: {product.quantity}</span>
                        <span>•</span>
                        <span>${product.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button 
            onClick={toggleNotifications}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors active:bg-blue-100"
          >
            <Bell size={20} className={showNotifications ? 'text-blue-600' : 'text-slate-600'} />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {totalNotifications}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-transparent">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Bell size={16} className="text-blue-600" />
                  Notificaciones
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {totalNotifications === 0 ? (
                  <div className="p-8 text-center">
                    <Check size={32} className="mx-auto text-emerald-500 mb-2" />
                    <div className="text-slate-600 font-medium">Todo está en orden</div>
                    <div className="text-slate-400 text-sm mt-1">No hay notificaciones</div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lowStock > 0 && (
                      <div className="p-4 bg-red-50 hover:bg-red-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{lowStock} producto{lowStock !== 1 ? 's' : ''} con stock bajo</p>
                            <p className="text-xs text-slate-500 mt-1">Stock por debajo del mínimo establecido</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {lowStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Stock: {product.quantity} / Mínimo: {product.minStock}</p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">
                            {product.quantity}/{product.minStock}
                          </span>
                        </div>
                      </div>
                    ))}

                    {recentSales.length > 0 && lowStock > 0 && (
                      <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-600">Ventas Recientes</div>
                    )}

                    {recentSales.map((sale, idx) => (
                      <div key={`${sale.id}-${idx}`} className="p-3 hover:bg-emerald-50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <TrendingUp size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">Venta registrada: {sale.id}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total: ${sale.total.toLocaleString('es-CO')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

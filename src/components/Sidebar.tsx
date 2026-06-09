import React from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  Globe, Users, Network, LogOut, Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveView } from '../types';

const nav: { label: string; icon: React.ReactNode; view: ActiveView }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, view: 'dashboard' },
  { label: 'Inventario', icon: <Package size={20} />, view: 'inventory' },
  { label: 'Ventas', icon: <ShoppingCart size={20} />, view: 'sales' },
  { label: 'Reportes', icon: <BarChart2 size={20} />, view: 'reports' },
  { label: 'Plataformas', icon: <Globe size={20} />, view: 'platforms' },
  { label: 'Usuarios', icon: <Users size={20} />, view: 'users' },
  { label: 'Arquitectura', icon: <Network size={20} />, view: 'architecture' },
];

export default function Sidebar() {
  const { activeView, setActiveView, currentUser, logout } = useApp();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col shadow-2xl">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Store size={22} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">SAPPosStore</p>
          <p className="text-blue-200 text-xs">Sistema de Inventario</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(item => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`sidebar-item w-full text-left ${activeView === item.view ? 'active' : ''}`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-left">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-blue-300 text-xs capitalize">{currentUser.role}</p>
          </div>
          <LogOut size={16} className="text-blue-300" />
        </button>
      </div>
    </aside>
  );
}

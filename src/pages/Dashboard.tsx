import React from 'react';
import { useApp } from '../context/AppContext';
import { Package, ShoppingCart, AlertTriangle, ArrowUpRight, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const salesData = [
  { day: 'Lun', ventas: 1200000 }, { day: 'Mar', ventas: 890000 },
  { day: 'Mie', ventas: 2100000 }, { day: 'Jue', ventas: 1500000 },
  { day: 'Vie', ventas: 3200000 }, { day: 'Sab', ventas: 2800000 },
  { day: 'Dom', ventas: 1100000 },
];

const platformData = [
  { name: 'Local', value: 45 },
  { name: 'MercadoLibre', value: 35 },
  { name: 'Falabella', value: 20 },
];

const COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { products, sales } = useApp();
  const lowStock = products.filter(p => p.quantity <= p.minStock);
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((a, s) => a + s.total, 0);
  const totalSales = sales.filter(s => s.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign />} color="blue" label="Ingresos Totales" value={fmt(totalRevenue)} change="+12.5%" />
        <StatCard icon={<ShoppingCart />} color="emerald" label="Ventas Completadas" value={String(totalSales)} change="+8.2%" />
        <StatCard icon={<Package />} color="violet" label="Productos en Stock" value={String(products.length)} change="+2" />
        <StatCard icon={<AlertTriangle />} color="amber" label="Stock Bajo" value={String(lowStock.length)} change="Atención" warn />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Ventas de la Semana</h3>
            <span className="badge-info">Esta semana</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
              <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fill="url(#colorVentas)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Ventas por Plataforma</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={platformData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                {platformData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: unknown) => `${Number(v)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800">Alertas de Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                <span className="badge-warning">{p.quantity} uds.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Ventas Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Recibo</th>
              <th className="table-th">Fecha</th>
              <th className="table-th">Plataforma</th>
              <th className="table-th">Total</th>
              <th className="table-th">Estado</th>
            </tr></thead>
            <tbody>
              {sales.slice(0, 5).map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-blue-600">{s.receiptNumber}</td>
                  <td className="table-td">{s.date}</td>
                  <td className="table-td capitalize">{s.platform}</td>
                  <td className="table-td font-semibold">{fmt(s.total)}</td>
                  <td className="table-td">
                    <span className={s.status === 'completed' ? 'badge-success' : s.status === 'returned' ? 'badge-danger' : 'badge-warning'}>
                      {s.status === 'completed' ? 'Completada' : s.status === 'returned' ? 'Devuelta' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value, change, warn = false }: {
  icon: React.ReactNode; color: string; label: string;
  value: string; change: string; warn?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold flex items-center gap-1 ${warn ? 'text-amber-500' : 'text-emerald-600'}`}>
          {!warn && <ArrowUpRight size={14} />}{change}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

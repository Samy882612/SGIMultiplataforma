import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, RotateCcw } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Reports() {
  const { sales, products } = useApp();

  const completed = sales.filter(s => s.status === 'completed');
  const returned = sales.filter(s => s.status === 'returned');

  const totalRevenue = completed.reduce((a, s) => a + s.total, 0);
  const totalCost = completed.reduce((a, s) =>
    a + s.products.reduce((b, sp) => {
      const p = products.find(p => p.id === sp.productId);
      return b + (p ? p.cost * sp.quantity : 0);
    }, 0), 0);
  const profit = totalRevenue - totalCost;
  const totalReturns = returned.reduce((a, s) => a + s.total, 0);

  const productStats: Record<string, { name: string; qty: number; rev: number }> = {};
  completed.forEach(s =>
    s.products.forEach(sp => {
      if (!productStats[sp.productId]) productStats[sp.productId] = { name: sp.productName, qty: 0, rev: 0 };
      productStats[sp.productId].qty += sp.quantity;
      productStats[sp.productId].rev += sp.subtotal;
    })
  );
  const topProducts = Object.values(productStats).sort((a, b) => b.rev - a.rev).slice(0, 6);

  const platformStats = [
    { name: 'Local', ventas: completed.filter(s => s.platform === 'local').reduce((a, s) => a + s.total, 0) },
    { name: 'MercadoLibre', ventas: completed.filter(s => s.platform === 'mercadolibre').reduce((a, s) => a + s.total, 0) },
    { name: 'Falabella', ventas: completed.filter(s => s.platform === 'falabella').reduce((a, s) => a + s.total, 0) },
  ];

  const dailyData = [
    { day: '28 May', ventas: 1200000, costo: 800000 },
    { day: '29 May', ventas: 890000, costo: 600000 },
    { day: '30 May', ventas: 2100000, costo: 1400000 },
    { day: '31 May', ventas: 1500000, costo: 950000 },
    { day: '01 Jun', ventas: 3200000, costo: 2100000 },
    { day: '02 Jun', ventas: 2800000, costo: 1900000 },
    { day: '03 Jun', ventas: totalRevenue, costo: totalCost },
  ];

  const exportReport = () => {
    const rows: string[] = [];
    rows.push('SAPPosStore Reporte');
    rows.push('Periodo,Junio 2024');
    rows.push('');
    rows.push('Resumen,Valor');
    rows.push(`Ingresos Totales,${totalRevenue}`);
    rows.push(`Utilidad Neta,${profit}`);
    rows.push(`Costo Total,${totalCost}`);
    rows.push(`Devoluciones,${totalReturns}`);
    rows.push('');
    rows.push('Ventas por Plataforma,Total Ventas');
    platformStats.forEach(platform => rows.push(`${platform.name},${platform.ventas}`));
    rows.push('');
    rows.push('Top Productos,Unidades Vendidas,Ingresos,% del Total');
    topProducts.forEach((p, index) => rows.push(`${index + 1}. ${p.name},${p.qty},${p.rev},${((p.rev / totalRevenue) * 100).toFixed(1)}%`));
    rows.push('');
    rows.push('Devoluciones,Recibo,Fecha,Productos,Monto');
    returned.forEach(s => rows.push(`${s.id},${s.receiptNumber},${s.date},${s.products.map(p => p.productName).join('; ')},${s.total}`));
    rows.push('');
    rows.push('Ventas Diarias,Día,Ventas,Costo');
    dailyData.forEach(d => rows.push(`${d.day},${d.ventas},${d.costo}`));

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-junio-2024.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 text-sm">Período: Junio 2024</p>
        <button onClick={exportReport} className="btn-primary"><Download size={16} />Exportar Reporte</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<DollarSign />} color="blue" label="Ingresos Totales" value={fmt(totalRevenue)} />
        <SummaryCard icon={<TrendingUp />} color="emerald" label="Utilidad Neta" value={fmt(profit)} />
        <SummaryCard icon={<TrendingDown />} color="violet" label="Costo Total" value={fmt(totalCost)} />
        <SummaryCard icon={<RotateCcw />} color="red" label="Devoluciones" value={fmt(totalReturns)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Ventas vs Costos (Diario)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} name="Ventas" />
              <Line type="monotone" dataKey="costo" stroke="#f59e0b" strokeWidth={2} name="Costo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Ventas por Plataforma</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
              <Bar dataKey="ventas" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Productos Más Vendidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">#</th>
              <th className="table-th">Producto</th>
              <th className="table-th">Unidades Vendidas</th>
              <th className="table-th">Ingresos</th>
              <th className="table-th">% del Total</th>
            </tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="table-td">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="table-td font-medium">{p.name}</td>
                  <td className="table-td">{p.qty} uds.</td>
                  <td className="table-td font-semibold text-blue-700">{fmt(p.rev)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(p.rev / totalRevenue * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{(p.rev / totalRevenue * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-l-4 border-blue-400">
        <h3 className="font-semibold text-slate-800 mb-3">Resumen de Devoluciones</h3>
        {returned.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay devoluciones registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-th">Recibo</th>
              <th className="table-th">Fecha</th>
              <th className="table-th">Producto</th>
              <th className="table-th">Monto</th>
            </tr></thead>
            <tbody>
              {returned.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-blue-600">{s.receiptNumber}</td>
                  <td className="table-td">{s.date}</td>
                  <td className="table-td">{s.products.map(p => p.productName).join(', ')}</td>
                  <td className="table-td font-semibold text-red-500">{fmt(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, color, label, value }: {
  icon: React.ReactNode; color: string; label: string; value: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    red: 'bg-red-100 text-red-500',
  };
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-800 mt-2">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Save, FileText, Printer } from 'lucide-react';
import type { Sale, SaleItem } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Sales() {
  const { products, sales, createSale, currentUser } = useApp();
  const [modal, setModal] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }]);
  const [platform, setPlatform] = useState<Sale['platform']>('local');

  const addItem = () => setItems(prev => [...prev, { productId: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: string, val: string | number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const computeTotal = () =>
    items.reduce((sum, it) => {
      const p = products.find(p => p.id === it.productId);
      return sum + (p ? p.price * it.quantity : 0);
    }, 0);

  const handleSave = async () => {
    const saleItems: SaleItem[] = items
      .filter(it => it.productId && it.quantity > 0)
      .map(it => {
        const p = products.find(p => p.id === it.productId)!;
        return { productId: p.id, productName: p.name, quantity: it.quantity, unitPrice: p.price, subtotal: p.price * it.quantity };
      });

    if (!saleItems.length) {
      alert('Debe seleccionar al menos un producto con cantidad mayor a cero.');
      return;
    }

    try {
      const newSale = await createSale({ platform, products: saleItems, employeeId: currentUser.id });
      setModal(false);
      setReceipt(newSale);
      setItems([{ productId: '', quantity: 1 }]);
    } catch (error) {
      console.error(error);
      alert('No se pudo registrar la venta. Intente de nuevo.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          {(['all', 'completed', 'returned'] as const).map(f => (
            <span key={f} className="badge-info cursor-pointer capitalize">{f === 'all' ? 'Todas' : f === 'completed' ? 'Completadas' : 'Devueltas'}</span>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={18} /> Nueva Venta
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Recibo</th>
              <th className="table-th">Fecha</th>
              <th className="table-th">Productos</th>
              <th className="table-th">Plataforma</th>
              <th className="table-th">Total</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Acciones</th>
            </tr></thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-blue-600">{s.receiptNumber}</td>
                  <td className="table-td">{s.date}</td>
                  <td className="table-td text-xs text-slate-500">{s.products.map(p => p.productName).join(', ')}</td>
                  <td className="table-td capitalize">
                    <span className={
                      s.platform === 'mercadolibre' ? 'badge-warning' :
                      s.platform === 'falabella' ? 'badge-info' : 'badge-success'
                    }>{s.platform}</span>
                  </td>
                  <td className="table-td font-bold">{fmt(s.total)}</td>
                  <td className="table-td">
                    <span className={s.status === 'completed' ? 'badge-success' : s.status === 'returned' ? 'badge-danger' : 'badge-warning'}>
                      {s.status === 'completed' ? 'Completada' : s.status === 'returned' ? 'Devuelta' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="table-td">
                    <button onClick={() => setReceipt(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                      <FileText size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold">Nueva Venta</h2>
              <button onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Plataforma</label>
                <select value={platform} onChange={e => setPlatform(e.target.value as Sale['platform'])} className="input-field">
                  <option value="local">Local</option>
                  <option value="mercadolibre">MercadoLibre</option>
                  <option value="falabella">Falabella</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500">Productos</label>
                  <button onClick={addItem} className="btn-secondary text-xs py-1"><Plus size={14} />Agregar</button>
                </div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={it.productId}
                        onChange={e => updateItem(i, 'productId', e.target.value)}
                        className="input-field flex-1"
                      >
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)} ({p.quantity} disp.)</option>
                        ))}
                      </select>
                      <input
                        type="number" min="1"
                        value={it.quantity}
                        onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                        className="input-field w-20"
                      />
                      <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-600">Total:</span>
                  <span className="text-blue-700 text-lg">{fmt(computeTotal())}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="btn-secondary"><X size={16} />Cancelar</button>
              <button onClick={handleSave} className="btn-primary"><Save size={16} />Registrar Venta</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="text-center border-b border-dashed border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-800">SAPPosStore</h2>
                <p className="text-slate-500 text-sm">Sistema de Gestión de Inventario</p>
                <p className="font-mono text-blue-600 mt-1">{receipt.receiptNumber}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fecha:</span><span className="font-medium">{receipt.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plataforma:</span>
                <span className="font-medium capitalize">{receipt.platform}</span>
              </div>
              <table className="w-full text-sm border-t border-slate-100 pt-2">
                <thead><tr>
                  <th className="text-left text-xs text-slate-500 py-1">Producto</th>
                  <th className="text-right text-xs text-slate-500 py-1">Cant.</th>
                  <th className="text-right text-xs text-slate-500 py-1">Subtotal</th>
                </tr></thead>
                <tbody>
                  {receipt.products.map((p, i) => (
                    <tr key={i}><td className="py-1">{p.productName}</td>
                    <td className="text-right">{p.quantity}</td>
                    <td className="text-right">{fmt(p.subtotal)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold">
                <span>TOTAL</span><span className="text-blue-700">{fmt(receipt.total)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReceipt(null)} className="btn-secondary flex-1"><X size={16} />Cerrar</button>
                <button onClick={() => window.print()} className="btn-primary flex-1"><Printer size={16} />Imprimir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

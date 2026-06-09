import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, Search, X, Save, AlertTriangle } from 'lucide-react';
import type { Product } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const emptyProduct: Omit<Product, 'id'> = {
  name: '', cost: 0, price: 0, quantity: 0, category: '', sku: '', minStock: 10
};

export default function Inventory() {
  const { products, createProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyProduct); setModal('add'); };
  const openEdit = (p: Product) => { setSelected(p); setForm({ ...p }); setModal('edit'); };

  const handleSave = async () => {
    try {
      if (modal === 'add') {
        await createProduct(form);
      } else if (modal === 'edit' && selected) {
        await updateProduct(selected.id, form);
      }
      setModal(null);
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar el producto.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar el producto.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..." className="input-field pl-9" />
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th rounded-tl-2xl">SKU</th>
              <th className="table-th">Producto</th>
              <th className="table-th">Categoría</th>
              <th className="table-th">Costo</th>
              <th className="table-th">Precio Venta</th>
              <th className="table-th">Stock</th>
              <th className="table-th">Margen</th>
              <th className="table-th rounded-tr-2xl">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => {
                const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                const low = p.quantity <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-slate-500 text-xs">{p.sku}</td>
                    <td className="table-td font-medium text-slate-800">{p.name}</td>
                    <td className="table-td"><span className="badge-info">{p.category}</span></td>
                    <td className="table-td">{fmt(p.cost)}</td>
                    <td className="table-td font-semibold">{fmt(p.price)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {low && <AlertTriangle size={14} className="text-amber-500" />}
                        <span className={low ? 'badge-warning' : 'badge-success'}>{p.quantity} uds.</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="text-emerald-600 font-semibold">{margin}%</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {modal === 'add' ? 'Nuevo Producto' : 'Editar Producto'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Nombre', key: 'name', type: 'text' },
                { label: 'SKU', key: 'sku', type: 'text' },
                { label: 'Categoría', key: 'category', type: 'text' },
                { label: 'Cantidad', key: 'quantity', type: 'number' },
                { label: 'Costo ($)', key: 'cost', type: 'number' },
                { label: 'Precio Venta ($)', key: 'price', type: 'number' },
                { label: 'Stock Mínimo', key: 'minStock', type: 'number' },
              ].map(f => (
                <div key={f.key} className={f.key === 'name' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as Record<string, unknown>)[f.key] as string | number}
                    onChange={e => setForm(prev => ({
                      ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value
                    }))}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="btn-secondary"><X size={16} />Cancelar</button>
              <button onClick={handleSave} className="btn-primary"><Save size={16} />Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

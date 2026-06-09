import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Invoice, InvoiceStatus, TaxRate, InvoiceItem } from '../types';
import {
  FileText, Plus, X, Save, Pencil, Trash2, Search,
  CheckCircle2, Clock, AlertCircle, XCircle, FileCheck,
  Receipt, Percent, History, Download, Eye,
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const STATUS_MAP: Record<InvoiceStatus, { label: string; badge: string }> = {
  draft:     { label: 'Borrador',   badge: 'badge-warning' },
  issued:    { label: 'Emitida',    badge: 'badge-info' },
  paid:      { label: 'Pagada',     badge: 'badge-success' },
  cancelled: { label: 'Cancelada',  badge: 'badge-danger' },
  overdue:   { label: 'Vencida',    badge: 'badge-danger' },
};

type Tab = 'invoices' | 'taxes' | 'history';

export default function Billing() {
  const [tab, setTab] = useState<Tab>('invoices');

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
        {([
          { id: 'invoices', label: 'Facturas',   icon: <Receipt size={15} /> },
          { id: 'taxes',    label: 'Impuestos',  icon: <Percent size={15} /> },
          { id: 'history',  label: 'Historial',  icon: <History size={15} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${tab === t.id ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'invoices' && <InvoicesTab />}
      {tab === 'taxes'    && <TaxesTab />}
      {tab === 'history'  && <HistoryTab />}
    </div>
  );
}

// ─── TAB: FACTURAS ───────────────────────────────────────────────────────────

function InvoicesTab() {
  const { invoices, setInvoices, products, taxRates, currentUser, createInvoice, updateInvoiceStatus, deleteInvoice } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [modal, setModal] = useState<'new' | 'view' | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
                        inv.number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totals = {
    paid:    invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0),
    pending: invoices.filter(i => i.status === 'issued').reduce((a, i) => a + i.total, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0),
  };

  const statusIcon = (s: InvoiceStatus) => {
    const icons: Record<InvoiceStatus, React.ReactNode> = {
      paid:      <CheckCircle2 size={14} className="text-emerald-500" />,
      issued:    <Clock size={14} className="text-blue-500" />,
      draft:     <FileText size={14} className="text-slate-400" />,
      cancelled: <XCircle size={14} className="text-red-400" />,
      overdue:   <AlertCircle size={14} className="text-red-500" />,
    };
    return icons[s];
  };

  const changeStatus = async (id: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(id, status);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el estado de la factura.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar la factura.');
    }
  };

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Facturas" value={`${invoices.length}`} icon={<FileCheck size={20}/>} color="blue" />
        <KpiCard label="Cobrado" value={fmt(totals.paid)} icon={<CheckCircle2 size={20}/>} color="emerald" />
        <KpiCard label="Por Cobrar" value={fmt(totals.pending)} icon={<Clock size={20}/>} color="violet" />
        <KpiCard label="Vencidas" value={fmt(totals.overdue)} icon={<AlertCircle size={20}/>} color="red" />
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar factura o cliente..." className="input-field pl-9 w-56" />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
            className="input-field w-36"
          >
            <option value="all">Todos</option>
            {(Object.keys(STATUS_MAP) as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_MAP[s].label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => { setSelected(null); setModal('new'); }} className="btn-primary">
          <Plus size={16} /> Nueva Factura
        </button>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Número</th>
              <th className="table-th">Cliente</th>
              <th className="table-th">Fecha</th>
              <th className="table-th">Vencimiento</th>
              <th className="table-th">Subtotal</th>
              <th className="table-th">IVA</th>
              <th className="table-th">Total</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-blue-600 font-semibold">{inv.number}</td>
                  <td className="table-td font-medium text-slate-800">{inv.clientName}</td>
                  <td className="table-td text-slate-500">{inv.date}</td>
                  <td className="table-td">
                    <span className={inv.status === 'overdue' ? 'text-red-500 font-semibold text-sm' : 'text-slate-500 text-sm'}>
                      {inv.dueDate}
                    </span>
                  </td>
                  <td className="table-td">{fmt(inv.subtotal)}</td>
                  <td className="table-td text-amber-600 font-medium">{fmt(inv.totalTax)}</td>
                  <td className="table-td font-bold text-slate-800">{fmt(inv.total)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(inv.status)}
                      <span className={STATUS_MAP[inv.status].badge}>{STATUS_MAP[inv.status].label}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(inv); setModal('view'); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Ver">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => window.print()}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Descargar">
                        <Download size={14} />
                      </button>
                      {inv.status === 'issued' && (
                        <button onClick={() => changeStatus(inv.id, 'paid')}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Marcar pagada">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {(inv.status === 'draft' || inv.status === 'issued') && (
                        <button onClick={() => changeStatus(inv.id, 'cancelled')}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Cancelar">
                          <XCircle size={14} />
                        </button>
                      )}
                      {inv.status === 'draft' && (
                        <button onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva factura */}
      {modal === 'new' && (
        <InvoiceModal
          products={products}
          taxRates={taxRates}
          currentUser={currentUser}
          invoicesCount={invoices.length}
          onSave={async inv => { await createInvoice(inv); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal ver factura */}
      {modal === 'view' && selected && (
        <InvoiceViewModal invoice={selected} onClose={() => setModal(null)} />
      )}
    </>
  );
}

// ─── MODAL: NUEVA FACTURA ─────────────────────────────────────────────────────

function InvoiceModal({
  products, taxRates, currentUser, invoicesCount, onSave, onClose,
}: {
  products: ReturnType<typeof useApp>['products'];
  taxRates: TaxRate[];
  currentUser: ReturnType<typeof useApp>['currentUser'];
  invoicesCount: number;
  onSave: (inv: Invoice) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDue);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([{ productId: '', quantity: 1, taxRateId: taxRates[0]?.id ?? '' }]);

  const addItem = () => setItems(p => [...p, { productId: '', quantity: 1, taxRateId: taxRates[0]?.id ?? '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: string, val: string | number) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const computedItems: InvoiceItem[] = items
    .filter(it => it.productId)
    .map(it => {
      const prod = products.find(p => p.id === it.productId)!;
      const tax = taxRates.find(t => t.id === it.taxRateId)!;
      const qty = it.quantity ?? 1;
      const sub = prod.price * qty;
      const taxAmt = sub * (tax?.rate ?? 0) / 100;
      return {
        productId: prod.id, productName: prod.name, quantity: qty,
        unitPrice: prod.price, taxRateId: tax?.id ?? '',
        taxAmount: taxAmt, subtotal: sub, total: sub + taxAmt,
      };
    });

  const subtotal = computedItems.reduce((a, i) => a + i.subtotal, 0);
  const totalTax = computedItems.reduce((a, i) => a + i.taxAmount, 0);
  const total = subtotal + totalTax;
  const num = String(invoicesCount + 1).padStart(3, '0');

  const handleSave = (status: 'draft' | 'issued') => {
    if (!clientName || computedItems.length === 0) return;
    onSave({
      id: `INV${num}`, number: `FAC-2024-${num}`, date: today, dueDate,
      clientName, clientId, clientEmail,
      items: computedItems, subtotal, totalTax, total,
      status, notes, createdBy: currentUser.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nueva Factura</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Datos del cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre del cliente *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} className="input-field" placeholder="Empresa o persona"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">NIT / Cédula</label>
              <input value={clientId} onChange={e => setClientId(e.target.value)} className="input-field" placeholder="900123456-1"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Correo</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="input-field" placeholder="correo@empresa.com"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de vencimiento</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field"/>
            </div>
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Productos / Servicios *</span>
              <button onClick={addItem} className="btn-secondary text-xs py-1 px-3"><Plus size={14}/>Agregar</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={it.productId ?? ''} onChange={e => updateItem(i, 'productId', e.target.value)} className="input-field">
                      <option value="">Seleccionar producto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={it.quantity ?? 1}
                      onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                      className="input-field" placeholder="Qty"/>
                  </div>
                  <div className="col-span-3">
                    <select value={it.taxRateId ?? ''} onChange={e => updateItem(i, 'taxRateId', e.target.value)} className="input-field">
                      {taxRates.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 text-right text-xs text-slate-500">
                    {it.productId ? fmt(
                      (products.find(p => p.id === it.productId)?.price ?? 0) * (it.quantity ?? 1)
                    ) : '—'}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeItem(i)} disabled={items.length === 1}
                      className="p-1 hover:bg-red-50 text-red-400 rounded-lg disabled:opacity-30">
                      <X size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-600">
              <span>Total Impuestos</span><span className="font-semibold">{fmt(totalTax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-2">
              <span>TOTAL</span><span className="text-blue-700 text-lg">{fmt(total)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="input-field resize-none" placeholder="Observaciones, condiciones de pago..."/>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary"><X size={15}/>Cancelar</button>
          <button onClick={() => handleSave('draft')} className="btn-secondary"><Save size={15}/>Guardar Borrador</button>
          <button onClick={() => handleSave('issued')} className="btn-primary"><FileCheck size={15}/>Emitir Factura</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: VER FACTURA ───────────────────────────────────────────────────────

function InvoiceViewModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{invoice.number}</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente" value={invoice.clientName}/>
            <Field label="NIT / Cédula" value={invoice.clientId || '—'}/>
            <Field label="Correo" value={invoice.clientEmail || '—'}/>
            <Field label="Fecha" value={invoice.date}/>
            <Field label="Vencimiento" value={invoice.dueDate}/>
            <Field label="Estado" value={STATUS_MAP[invoice.status].label}/>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">DETALLE</p>
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400">
                <th className="text-left pb-1">Producto</th>
                <th className="text-right pb-1">Qty</th>
                <th className="text-right pb-1">Precio</th>
                <th className="text-right pb-1">IVA</th>
                <th className="text-right pb-1">Total</th>
              </tr></thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="py-1.5">{item.productName}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{fmt(item.unitPrice)}</td>
                    <td className="text-right text-amber-600">{fmt(item.taxAmount)}</td>
                    <td className="text-right font-semibold">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-amber-600"><span>Impuestos</span><span>{fmt(invoice.totalTax)}</span></div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-2 text-base">
              <span>TOTAL</span><span className="text-blue-700">{fmt(invoice.total)}</span>
            </div>
          </div>
          {invoice.notes && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 font-semibold">NOTAS</p>
              <p className="text-slate-600 text-xs">{invoice.notes}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary"><X size={15}/>Cerrar</button>
          <button onClick={() => window.print()} className="btn-primary"><Download size={15}/>Descargar PDF</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

// ─── TAB: IMPUESTOS ───────────────────────────────────────────────────────────

function TaxesTab() {
  const { taxRates, createTaxRate, updateTaxRate, toggleTaxRate } = useApp();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<TaxRate | null>(null);
  const [form, setForm] = useState({ name: '', rate: 0, description: '' });

  const openAdd = () => { setForm({ name: '', rate: 0, description: '' }); setModal('add'); };
  const openEdit = (t: TaxRate) => { setSelected(t); setForm({ name: t.name, rate: t.rate, description: t.description }); setModal('edit'); };

  const handleSave = async () => {
    try {
      if (modal === 'add') {
        await createTaxRate(form);
      } else if (modal === 'edit' && selected) {
        await updateTaxRate(selected.id, form);
      }
      setModal(null);
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar la tarifa de impuesto.');
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await toggleTaxRate(id);
    } catch (error) {
      console.error(error);
      alert('No se pudo cambiar el estado de la tarifa.');
    }
  };

  const totalTaxCollected = useApp().invoices
    .filter(i => i.status === 'paid')
    .reduce((a, i) => a + i.totalTax, 0);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Tarifas Activas" value={`${taxRates.filter(t => t.active).length}`} icon={<Percent size={20}/>} color="blue"/>
        <KpiCard label="IVA Recaudado" value={fmt(totalTaxCollected)} icon={<Receipt size={20}/>} color="emerald"/>
        <KpiCard label="Total Tarifas" value={`${taxRates.length}`} icon={<FileText size={20}/>} color="violet"/>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Tarifas de Impuestos</h3>
        <button onClick={openAdd} className="btn-primary"><Plus size={16}/>Nueva Tarifa</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-th">Nombre</th>
            <th className="table-th">Tasa</th>
            <th className="table-th">Descripción</th>
            <th className="table-th">Estado</th>
            <th className="table-th">Acciones</th>
          </tr></thead>
          <tbody>
            {taxRates.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="table-td font-semibold text-slate-800">{t.name}</td>
                <td className="table-td">
                  <span className="text-amber-600 font-bold text-base">{t.rate}%</span>
                </td>
                <td className="table-td text-slate-500">{t.description}</td>
                <td className="table-td">
                  <span className={t.active ? 'badge-success' : 'badge-danger'}>{t.active ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={14}/></button>
                    <button onClick={() => toggleActive(t.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      {t.active ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen por tarifa */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Resumen de Recaudación por Tarifa</h3>
        <div className="space-y-3">
          {taxRates.filter(t => t.active).map(t => {
            const collected = useApp().invoices
              .filter(i => i.status === 'paid')
              .reduce((sum, inv) => sum + inv.items.filter(it => it.taxRateId === t.id).reduce((a, it) => a + it.taxAmount, 0), 0);
            const pct = totalTaxCollected > 0 ? (collected / totalTaxCollected) * 100 : 0;
            return (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-32 text-sm font-medium text-slate-700 shrink-0">{t.name}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                  <div className="bg-amber-400 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                </div>
                <div className="w-28 text-right text-sm font-semibold text-slate-700">{fmt(collected)}</div>
                <div className="w-12 text-right text-xs text-slate-400">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold">{modal === 'add' ? 'Nueva Tarifa' : 'Editar Tarifa'}</h2>
              <button onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" placeholder="ej. IVA 19%"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tasa (%)</label>
                <input type="number" min="0" max="100" value={form.rate}
                  onChange={e => setForm(p => ({...p, rate: Number(e.target.value)}))} className="input-field"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
                <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input-field"/>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="btn-secondary"><X size={15}/>Cancelar</button>
              <button onClick={handleSave} className="btn-primary"><Save size={15}/>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── TAB: HISTORIAL ───────────────────────────────────────────────────────────

function HistoryTab() {
  const { invoices } = useApp();
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  const filtered = filterStatus === 'all' ? invoices : invoices.filter(i => i.status === filterStatus);

  const events = filtered.flatMap(inv => [
    { id: inv.id + '-c', date: inv.date, type: 'created', label: `Factura ${inv.number} creada`, client: inv.clientName, amount: inv.total, status: inv.status },
    ...(inv.status === 'paid' ? [{ id: inv.id + '-p', date: inv.dueDate, type: 'paid', label: `Factura ${inv.number} cobrada`, client: inv.clientName, amount: inv.total, status: inv.status }] : []),
    ...(inv.status === 'cancelled' ? [{ id: inv.id + '-x', date: inv.date, type: 'cancelled', label: `Factura ${inv.number} cancelada`, client: inv.clientName, amount: inv.total, status: inv.status }] : []),
    ...(inv.status === 'overdue' ? [{ id: inv.id + '-o', date: inv.dueDate, type: 'overdue', label: `Factura ${inv.number} vencida`, client: inv.clientName, amount: inv.total, status: inv.status }] : []),
  ]).sort((a, b) => b.date.localeCompare(a.date));

  const typeIcon: Record<string, { icon: React.ReactNode; color: string }> = {
    created:   { icon: <FileText size={14}/>,    color: 'bg-blue-100 text-blue-600' },
    paid:      { icon: <CheckCircle2 size={14}/>, color: 'bg-emerald-100 text-emerald-600' },
    cancelled: { icon: <XCircle size={14}/>,      color: 'bg-red-100 text-red-500' },
    overdue:   { icon: <AlertCircle size={14}/>,  color: 'bg-red-100 text-red-500' },
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as InvoiceStatus | 'all')} className="input-field w-36">
            <option value="all">Todos</option>
            {(Object.keys(STATUS_MAP) as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_MAP[s].label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">{events.length} eventos</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-th">Evento</th>
            <th className="table-th">Factura</th>
            <th className="table-th">Cliente</th>
            <th className="table-th">Fecha</th>
            <th className="table-th">Monto</th>
            <th className="table-th">Estado</th>
          </tr></thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} className="hover:bg-slate-50">
                <td className="table-td">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeIcon[ev.type].color}`}>
                    {typeIcon[ev.type].icon}
                  </div>
                </td>
                <td className="table-td text-sm text-slate-600">{ev.label}</td>
                <td className="table-td font-medium text-slate-800">{ev.client}</td>
                <td className="table-td text-slate-500">{ev.date}</td>
                <td className="table-td font-semibold text-slate-800">{fmt(ev.amount)}</td>
                <td className="table-td">
                  <span className={STATUS_MAP[ev.status as InvoiceStatus].badge}>
                    {STATUS_MAP[ev.status as InvoiceStatus].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(STATUS_MAP) as [InvoiceStatus, { label: string; badge: string }][]).map(([status, info]) => {
          const count = invoices.filter(i => i.status === status).length;
          const total = invoices.filter(i => i.status === status).reduce((a, i) => a + i.total, 0);
          return (
            <div key={status} className="card">
              <p className="text-xs text-slate-400 mb-1">{info.label}</p>
              <p className="text-xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500">{fmt(total)}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── COMPONENTE AUXILIAR ──────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600', emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600', red: 'bg-red-100 text-red-500',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

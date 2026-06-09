import React from 'react';
import { Monitor, Smartphone, Server, Database, Globe, ArrowRight, ArrowDown, Layers, Shield, Zap } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="p-6 space-y-8">
      <div className="card bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <h2 className="text-xl font-bold mb-2">Arquitectura del Sistema — SAPPosStore</h2>
        <p className="text-slate-300 text-sm">
          Sistema de Gestión de Inventario Multiplataforma. Arquitectura cliente-servidor con sincronización
          en tiempo real vía API REST. Compatible con desktop (Electron) y móvil (React Native / PWA).
        </p>
      </div>

      <div className="card space-y-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Layers size={20} className="text-blue-600" /> Diagrama de Capas
        </h3>

        <div className="flex flex-col items-center gap-2">
          <Layer
            color="from-blue-500 to-blue-600"
            icon={<Monitor size={20} />}
            label="CAPA DE PRESENTACIÓN — Frontend"
            items={['React + TypeScript + Tailwind CSS', 'Electron (Desktop: Windows/macOS/Linux)', 'PWA / React Native (Móvil: iOS/Android)']}
            badge="Cliente"
          />
          <div className="flex items-center gap-2 text-slate-400">
            <ArrowDown size={20} /><span className="text-xs">HTTP/HTTPS · REST API · JWT Auth</span><ArrowDown size={20} />
          </div>
          <Layer
            color="from-violet-500 to-violet-600"
            icon={<Server size={20} />}
            label="CAPA DE NEGOCIO — Backend"
            items={['Node.js + Express / FastAPI (Python)', 'JWT Authentication + Role-Based Access', 'Lógica de Negocio: Inventario, Ventas, Reportes', 'Servicio de Sincronización con APIs externas']}
            badge="Servidor"
          />
          <div className="flex items-center gap-2 text-slate-400">
            <ArrowDown size={20} /><span className="text-xs">ORM / SQL Queries · Encrypted Connection</span><ArrowDown size={20} />
          </div>
          <Layer
            color="from-emerald-500 to-emerald-600"
            icon={<Database size={20} />}
            label="CAPA DE DATOS — Base de Datos"
            items={['MySQL (Schema: sapposstore)', 'Tablas: productos, ventas, usuarios, plataformas', 'Respaldos automáticos diarios', 'Cifrado AES-256 para datos sensibles']}
            badge="BD"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Globe size={18} className="text-blue-600" /> Integraciones Externas
          </h3>
          {[
            { name: 'MercadoLibre API', color: 'bg-yellow-400', desc: 'Sincronización de inventario y captura de ventas', status: 'Activo' },
            { name: 'Falabella API', color: 'bg-green-500', desc: 'Actualización de stock en tiempo real', status: 'Activo' },
            { name: 'Amazon Seller API', color: 'bg-orange-500', desc: 'Integración futura planeada', status: 'Próximo' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-white font-bold text-xs`}>
                {p.name.slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
              <span className={p.status === 'Activo' ? 'badge-success' : 'badge-warning'}>{p.status}</span>
            </div>
          ))}
        </div>

        <div className="card space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Smartphone size={18} className="text-blue-600" /> Compatibilidad de Plataformas
          </h3>
          {[
            { label: 'Desktop Windows', icon: <Monitor size={16} />, status: 'Electron.js', ok: true },
            { label: 'Desktop macOS / Linux', icon: <Monitor size={16} />, status: 'Electron.js', ok: true },
            { label: 'Móvil iOS / Android', icon: <Smartphone size={16} />, status: 'PWA / React Native', ok: true },
            { label: 'Web Browser', icon: <Globe size={16} />, status: 'React SPA', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.status}</p>
              </div>
              <span className={item.ok ? 'badge-success' : 'badge-warning'}>{item.ok ? 'Soportado' : 'Próximo'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Shield size={18} className="text-blue-600" /> Requerimientos No Funcionales Implementados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Zap />, label: 'Rendimiento', desc: '<2s para 10,000 productos', color: 'blue' },
            { icon: <Shield />, label: 'Seguridad', desc: 'JWT + Cifrado AES-256', color: 'emerald' },
            { icon: <Layers />, label: 'Escalabilidad', desc: 'API modular extensible', color: 'violet' },
            { icon: <Monitor />, label: 'Compatibilidad', desc: 'Win / macOS / Linux / Móvil', color: 'amber' },
          ].map((r, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 bg-${r.color}-100 text-${r.color}-600 rounded-xl mx-auto flex items-center justify-center mb-2`}>
                {r.icon}
              </div>
              <p className="font-semibold text-slate-800 text-sm">{r.label}</p>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Database size={18} className="text-blue-600" /> Esquema de Base de Datos (MySQL — sapposstore)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { table: 'productos', fields: ['id PK', 'sku', 'nombre', 'costo', 'precio_venta', 'cantidad', 'stock_minimo', 'categoria'] },
            { table: 'ventas', fields: ['id PK', 'numero_recibo', 'fecha', 'total', 'plataforma', 'estado', 'empleado_id FK'] },
            { table: 'venta_items', fields: ['id PK', 'venta_id FK', 'producto_id FK', 'cantidad', 'precio_unitario', 'subtotal'] },
            { table: 'usuarios', fields: ['id PK', 'nombre', 'email', 'rol', 'activo', 'created_at'] },
            { table: 'plataformas', fields: ['id PK', 'nombre', 'api_key', 'estado', 'ultima_sync'] },
            { table: 'reportes_log', fields: ['id PK', 'tipo', 'periodo', 'generado_por FK', 'fecha'] },
          ].map((t, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-2 text-sm font-bold font-mono">{t.table}</div>
              <div className="p-3 space-y-1">
                {t.fields.map((f, j) => (
                  <p key={j} className="text-xs font-mono text-slate-600 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${f.includes('PK') ? 'bg-amber-400' : f.includes('FK') ? 'bg-blue-400' : 'bg-slate-300'}`} />
                    {f}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Layer({ color, icon, label, items, badge }: {
  color: string; icon: React.ReactNode; label: string; items: string[]; badge: string;
}) {
  return (
    <div className={`w-full max-w-2xl bg-gradient-to-r ${color} text-white rounded-2xl p-5 shadow-lg`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="font-bold text-sm">{label}</span>
        <span className="ml-auto bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{badge}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
            <ArrowRight size={12} className="opacity-70" />
            <span className="text-xs">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
